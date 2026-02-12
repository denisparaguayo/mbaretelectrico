import React, { useEffect, useMemo, useState } from 'react';
import { formatGs } from '../lib/money';
import {
	loadOrder,
	saveOrder,
	clearOrder,
	updateQty as storeUpdateQty,
	removeItem as storeRemoveItem,
	subtotal as storeSubtotal,
	type OrderState,
	type OrderItem,
} from '../lib/orderStore';

type Customer = {
	nombre: string;
	doc: string; // CI/RUC opcional
	direccion: string; // solo si pago puerta
};

const CUSTOMER_KEY = 'mbarete_customer_v1';

function readJSON<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}
function writeJSON(key: string, value: any) {
	localStorage.setItem(key, JSON.stringify(value));
}

function normalizePhone(input: string) {
	const digits = (input || '').replace(/[^\d]/g, '');
	if (digits.startsWith('0')) return `595${digits.slice(1)}`;
	if (digits.startsWith('595')) return digits;
	return digits;
}
function waLink(phone: string, text: string) {
	const p = normalizePhone(phone);
	return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}

export default function PedidoPage() {
	const WHATSAPP = import.meta.env.PUBLIC_WHATSAPP_NUMBER ?? '0986550235';
	const ENVIO_GRATIS_DESDE = Number(
		import.meta.env.PUBLIC_ENVIO_GRATIS_DESDE ?? 300000
	);

	const [order, setOrder] = useState<OrderState>(() => loadOrder());
	const [showCheckout, setShowCheckout] = useState(false);

	const [customer, setCustomer] = useState<Customer>({
		nombre: '',
		doc: '',
		direccion: '',
	});

	// cargar customer + escuchar cambios del carrito (evento que ya usás)
	useEffect(() => {
		setOrder(loadOrder());

		const saved = readJSON<Partial<Customer>>(CUSTOMER_KEY, {});
		setCustomer((prev) => ({ ...prev, ...saved }));

		const onUpdate = () => setOrder(loadOrder());
		window.addEventListener('mbarete:order_updated', onUpdate);

		return () => window.removeEventListener('mbarete:order_updated', onUpdate);
	}, []);

	// persistir customer
	useEffect(() => {
		writeJSON(CUSTOMER_KEY, customer);
	}, [customer]);

	const cart: OrderItem[] = order.items ?? [];
	const hasItems = cart.length > 0;

	const subtotal = useMemo(() => storeSubtotal(order), [order]);
	const envio = useMemo(
		() => (subtotal >= ENVIO_GRATIS_DESDE ? 0 : 17000),
		[subtotal, ENVIO_GRATIS_DESDE]
	);
	const total = subtotal + envio;

	const errors = useMemo(() => {
		const e: string[] = [];
		if (!hasItems) e.push('Tu pedido está vacío.');
		if (!customer.nombre.trim()) e.push('Falta el nombre del cliente.');
		if (order.payment === 'puerta' && !customer.direccion.trim()) {
			e.push('Para pago en puerta necesitás indicar dirección.');
		}
		if (!order.cityId) e.push('Seleccioná una ciudad/zona de envío.');
		if (!order.payment) e.push('Seleccioná una forma de pago.');
		return e;
	}, [
		hasItems,
		customer.nombre,
		customer.direccion,
		order.payment,
		order.cityId,
	]);

	function setCityId(cityId: OrderState['cityId']) {
		const st = loadOrder();
		st.cityId = cityId;
		saveOrder(st);
		setOrder(st);
		window.dispatchEvent(new Event('mbarete:order_updated'));
	}

	function setPayment(payment: OrderState['payment']) {
		const st = loadOrder();
		st.payment = payment;
		saveOrder(st);
		setOrder(st);
		window.dispatchEvent(new Event('mbarete:order_updated'));
	}

	function updateQty(slug: string, qty: number) {
		const st = loadOrder();
		storeUpdateQty(st, slug, qty);
		saveOrder(st);
		setOrder(st);
		window.dispatchEvent(new Event('mbarete:order_updated'));
	}

	function removeItem(slug: string) {
		const st = loadOrder();
		storeRemoveItem(st, slug);
		saveOrder(st);
		setOrder(st);
		window.dispatchEvent(new Event('mbarete:order_updated'));
	}

	function clearCart() {
		clearOrder();
		setOrder(loadOrder());
		window.dispatchEvent(new Event('mbarete:order_updated'));
	}

	function pagoLabel() {
		if (order.payment === 'transferencia') return 'Transferencia';
		if (order.payment === 'tigo') return 'Giro Tigo';
		if (order.payment === 'puerta')
			return 'Pago en puerta (sujeto a confirmación)';
		return 'Sin definir';
	}

	function buildOrderText(kind: 'normal' | 'mayorista') {
		const lines: string[] = [];

		lines.push(
			kind === 'normal'
				? 'PEDIDO MBARÉTE ELÉCTRICO'
				: 'CONSULTA MAYORISTA - MBARÉTE ELÉCTRICO'
		);
		lines.push('');
		lines.push(`Cliente: ${customer.nombre.trim()}`);
		if (customer.doc.trim()) lines.push(`CI/RUC: ${customer.doc.trim()}`);
		lines.push(`Ciudad/Zona: ${order.cityId || '-'}`);
		lines.push(`Pago: ${pagoLabel()}`);
		if (order.payment === 'puerta' && customer.direccion.trim()) {
			lines.push(`Dirección: ${customer.direccion.trim()}`);
		}
		lines.push('');
		lines.push('Productos:');

		cart.forEach((it) => {
			const unidad = it.tipoVenta === 'metro' ? 'm' : 'u';
			const itemTotal = it.precioPublico * it.cantidad;
			lines.push(
				`- ${it.cantidad}${unidad} ${it.nombre} → Gs. ${formatGs(itemTotal)}`
			);
		});

		lines.push('');
		lines.push(`Subtotal: Gs. ${formatGs(subtotal)}`);

		if (kind === 'normal') {
			lines.push(`Envío: ${envio === 0 ? 'Gratis' : `Gs. ${formatGs(envio)}`}`);
			lines.push(`TOTAL: Gs. ${formatGs(total)}`);
			lines.push('');
			lines.push('Entrega 24–48h en Asunción y Central (según confirmación).');
		} else {
			lines.push('');
			lines.push(
				'Quiero precio mayorista para este pedido. ¿Cuáles son los mínimos por ítem?'
			);
		}

		return lines.join('\n');
	}

	function onSend(kind: 'normal' | 'mayorista') {
		const text = buildOrderText(kind);
		window.open(waLink(WHATSAPP, text), '_blank', 'noopener,noreferrer');
	}

	return (
		<div style={{ display: 'grid', gap: 16 }}>
			<h1 style={{ margin: 0 }}>Mi pedido</h1>

			{!hasItems && (
				<div
					style={{
						border: '1px solid #eee',
						borderRadius: 14,
						padding: 14,
						background: '#fff',
					}}>
					Tu pedido está vacío. Volvé al <a href="/catalogo">catálogo</a> para
					agregar productos.
				</div>
			)}

			{hasItems && (
				<div style={{ display: 'grid', gap: 10 }}>
					{cart.map((it) => (
						<div
							key={it.slug}
							style={{
								border: '1px solid #eee',
								borderRadius: 14,
								padding: 14,
								background: '#fff',
								display: 'grid',
								gridTemplateColumns: '1fr auto',
								gap: 10,
								alignItems: 'center',
							}}>
							<div>
								<div style={{ fontWeight: 900 }}>{it.nombre}</div>
								<div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
									Gs. {formatGs(it.precioPublico)} /{' '}
									{it.tipoVenta === 'metro' ? 'metro' : 'unidad'}
								</div>
							</div>

							<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
								<button
									onClick={() => updateQty(it.slug, it.cantidad - 1)}
									style={{
										padding: '8px 10px',
										borderRadius: 12,
										border: '1px solid #ddd',
										background: '#fff',
										cursor: 'pointer',
										fontWeight: 900,
									}}
									aria-label="Disminuir">
									−
								</button>

								<div
									style={{
										minWidth: 54,
										textAlign: 'center',
										fontWeight: 900,
									}}>
									{it.cantidad}
									<span style={{ fontSize: 12, color: '#666' }}>
										{it.tipoVenta === 'metro' ? 'm' : ''}
									</span>
								</div>

								<button
									onClick={() => updateQty(it.slug, it.cantidad + 1)}
									style={{
										padding: '8px 10px',
										borderRadius: 12,
										border: '1px solid #ddd',
										background: '#fff',
										cursor: 'pointer',
										fontWeight: 900,
									}}
									aria-label="Aumentar">
									+
								</button>

								<button
									onClick={() => removeItem(it.slug)}
									style={{
										padding: '8px 10px',
										borderRadius: 12,
										border: '1px solid #ddd',
										background: '#fff',
										cursor: 'pointer',
										fontWeight: 900,
									}}
									aria-label="Quitar">
									✕
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{hasItems && (
				<div
					style={{
						border: '1px solid #eee',
						borderRadius: 14,
						padding: 14,
						background: '#fff',
						display: 'grid',
						gap: 10,
					}}>
					<div style={{ display: 'grid', gap: 6 }}>
						<label style={{ fontWeight: 900 }}>Ciudad/Zona (para envío)</label>
						<select
							value={order.cityId || ''}
							onChange={(e) => setCityId(e.target.value as any)}
							style={{
								padding: '12px 14px',
								borderRadius: 14,
								border: '1px solid #ddd',
								background: '#fff',
							}}>
							<option value="">Seleccionar…</option>
							<option value="asuncion">Asunción</option>
							<option value="san-lorenzo">San Lorenzo</option>
							<option value="luque">Luque</option>
							<option value="fernando">Fernando de la Mora</option>
							<option value="lambare">Lambaré</option>
							<option value="central-otro">Otro (Central)</option>
						</select>
					</div>

					<div style={{ display: 'grid', gap: 6 }}>
						<label style={{ fontWeight: 900 }}>Forma de pago</label>
						<div style={{ display: 'grid', gap: 8 }}>
							<label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
								<input
									type="radio"
									name="pago"
									checked={order.payment === 'transferencia'}
									onChange={() => setPayment('transferencia')}
								/>
								Transferencia
							</label>
							<label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
								<input
									type="radio"
									name="pago"
									checked={order.payment === 'tigo'}
									onChange={() => setPayment('tigo')}
								/>
								Giro Tigo
							</label>
							<label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
								<input
									type="radio"
									name="pago"
									checked={order.payment === 'puerta'}
									onChange={() => setPayment('puerta')}
								/>
								Pago en puerta (sujeto a confirmación)
							</label>
						</div>
					</div>

					<div style={{ display: 'flex', justifyContent: 'space-between' }}>
						<span style={{ color: '#666' }}>Subtotal</span>
						<strong>Gs. {formatGs(subtotal)}</strong>
					</div>

					<div style={{ display: 'flex', justifyContent: 'space-between' }}>
						<span style={{ color: '#666' }}>
							Envío {subtotal >= ENVIO_GRATIS_DESDE ? '(gratis)' : ''}
						</span>
						<strong>{envio === 0 ? 'Gratis' : `Gs. ${formatGs(envio)}`}</strong>
					</div>

					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							borderTop: '1px solid #eee',
							paddingTop: 10,
						}}>
						<span style={{ color: '#666' }}>Total</span>
						<strong>Gs. {formatGs(total)}</strong>
					</div>

					<div style={{ color: '#666', fontSize: 13, lineHeight: 1.6 }}>
						🚚 Envío gratis desde Gs. {formatGs(ENVIO_GRATIS_DESDE)} en Asunción
						y Central.
					</div>
				</div>
			)}

			<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
				<a
					href="/catalogo"
					style={{
						padding: '12px 14px',
						borderRadius: 14,
						border: '1px solid #ddd',
						background: '#34B7F1',
						textDecoration: 'none',
						fontWeight: 900,
					}}>
					Seguir comprando
				</a>

				{hasItems && (
					<>
						<button
							onClick={() => setShowCheckout(true)}
							style={{
								padding: '12px 14px',
								borderRadius: 14,
								border: '1px solid #111',
								background: '#128C7E',
								color: '#fff',
								cursor: 'pointer',
								fontWeight: 900,
							}}>
							Enviar pedido
						</button>

						<button
							onClick={clearCart}
							style={{
								padding: '12px 14px',
								borderRadius: 14,
								border: '1px solid #ddd',
								background: '#FF5A5F',
								cursor: 'pointer',
								fontWeight: 900,
							}}>
							Vaciar
						</button>
					</>
				)}
			</div>

			{/* Modal checkout (Opción C) */}
			{showCheckout && (
				<div
					role="dialog"
					aria-modal="true"
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(0,0,0,0.35)',
						display: 'grid',
						placeItems: 'center',
						zIndex: 60,
						padding: 16,
					}}
					onClick={() => setShowCheckout(false)}>
					<div
						onClick={(e) => e.stopPropagation()}
						style={{
							width: 'min(720px, 100%)',
							background: '#fff',
							borderRadius: 18,
							border: '1px solid #eee',
							padding: 16,
							boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
						}}>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								gap: 10,
							}}>
							<h2 style={{ margin: 0 }}>Datos del cliente</h2>
							<button
								onClick={() => setShowCheckout(false)}
								style={{
									border: '1px solid #ddd',
									background: '#fff',
									borderRadius: 12,
									padding: '8px 10px',
									cursor: 'pointer',
									fontWeight: 900,
								}}>
								✕
							</button>
						</div>

						<div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
							<div style={{ display: 'grid', gap: 6 }}>
								<label style={{ fontWeight: 900 }}>Nombre y apellido *</label>
								<input
									value={customer.nombre}
									onChange={(e) =>
										setCustomer({ ...customer, nombre: e.target.value })
									}
									placeholder="Ej: Juan Pérez"
									style={{
										padding: '12px 14px',
										borderRadius: 14,
										border: '1px solid #ddd',
									}}
								/>
							</div>

							<div style={{ display: 'grid', gap: 6 }}>
								<label style={{ fontWeight: 900 }}>CI o RUC (opcional)</label>
								<input
									value={customer.doc}
									onChange={(e) =>
										setCustomer({ ...customer, doc: e.target.value })
									}
									placeholder="Ej: 4.567.890 o 80012345-6"
									style={{
										padding: '12px 14px',
										borderRadius: 14,
										border: '1px solid #ddd',
									}}
								/>
							</div>

							{order.payment === 'puerta' && (
								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontWeight: 900 }}>Dirección *</label>
									<input
										value={customer.direccion}
										onChange={(e) =>
											setCustomer({ ...customer, direccion: e.target.value })
										}
										placeholder="Barrio, calle, nro, referencia"
										style={{
											padding: '12px 14px',
											borderRadius: 14,
											border: '1px solid #ddd',
										}}
									/>
								</div>
							)}

							{errors.length > 0 && (
								<div
									style={{
										border: '1px solid #ffe1e1',
										background: '#fff5f5',
										borderRadius: 14,
										padding: 12,
										color: '#8a1f1f',
									}}>
									<strong>Falta completar:</strong>
									<ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
										{errors.map((e) => (
											<li key={e}>{e}</li>
										))}
									</ul>
								</div>
							)}

							<div
								style={{
									display: 'flex',
									gap: 10,
									flexWrap: 'wrap',
									marginTop: 6,
								}}>
								<button
									onClick={() => onSend('normal')}
									disabled={errors.length > 0}
									style={{
										padding: '12px 14px',
										borderRadius: 14,
										border: '1px solid #111',
										background: errors.length > 0 ? '#999' : '#111',
										color: '#fff',
										cursor: errors.length > 0 ? 'not-allowed' : 'pointer',
										fontWeight: 900,
									}}>
									Enviar pedido por WhatsApp
								</button>

								<button
									onClick={() => onSend('mayorista')}
									disabled={errors.length > 0}
									style={{
										padding: '12px 14px',
										borderRadius: 14,
										border: '1px solid #ddd',
										background: '#fff',
										cursor: errors.length > 0 ? 'not-allowed' : 'pointer',
										fontWeight: 900,
									}}>
									Consultar mayorista por este pedido
								</button>
							</div>

							<div style={{ color: '#666', fontSize: 13, lineHeight: 1.6 }}>
								Tip: El nombre/CI se guardan en este dispositivo para que la
								próxima vez sea más rápido.
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
