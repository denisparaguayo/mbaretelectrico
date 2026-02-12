import React, { useEffect, useMemo, useState } from 'react';
import {
	SHIPPING_BY_CITY,
	shippingCost,
	FREE_SHIPPING_MIN,
} from '../data/shipping';
import {
	buildNormalOrderMessage,
	buildWholesaleMessage,
	waUrl,
} from '../lib/whatsapp';
import { formatGs } from '../lib/money';
import {
	loadOrder,
	saveOrder,
	subtotal,
	updateQty,
	removeItem,
	clearOrder,
	type OrderState,
} from '../lib/orderStore';

export default function OrderSummary() {
	const [state, setState] = useState<OrderState>(() => ({
		items: [],
		cityId: '',
		payment: '',
	}));

	useEffect(() => {
		const st = loadOrder();
		setState(st);

		const handler = () => setState(loadOrder());
		window.addEventListener('mbarete:order_updated', handler);
		return () => window.removeEventListener('mbarete:order_updated', handler);
	}, []);

	const sub = useMemo(() => subtotal(state), [state]);
	const ship = useMemo(
		() => shippingCost(sub, state.cityId),
		[sub, state.cityId]
	);
	const total = sub + ship;
	const missingForFree = Math.max(0, FREE_SHIPPING_MIN - sub);

	function persist(next: OrderState) {
		setState({ ...next });
		saveOrder(next);
		window.dispatchEvent(new Event('mbarete:order_updated'));
	}

	function onQty(slug: string, qty: number) {
		const next = loadOrder();
		updateQty(next, slug, qty);
		persist(next);
	}

	function onRemove(slug: string) {
		const next = loadOrder();
		removeItem(next, slug);
		persist(next);
	}

	function onCity(v: string) {
		const next = loadOrder();
		next.cityId = v as any;
		persist(next);
	}

	function onPayment(v: string) {
		const next = loadOrder();
		next.payment = v as any;
		persist(next);
	}

	function sendNormal() {
		if (!state.items.length) return;
		window.open(waUrl(buildNormalOrderMessage(state)), '_blank');
	}

	function sendWholesale() {
		if (!state.items.length) return;
		window.open(waUrl(buildWholesaleMessage(state)), '_blank');
	}

	return (
		<div style={{ display: 'grid', gap: 14, maxWidth: 900 }}>
			{!state.items.length ? (
				<div
					style={{ padding: 16, border: '1px solid #eee', borderRadius: 14 }}>
					Tu pedido está vacío. Volvé al <a href="/catalogo">catálogo</a> y
					agregá productos.
				</div>
			) : (
				<>
					<div
						style={{ border: '1px solid #eee', borderRadius: 14, padding: 14 }}>
						<h2 style={{ margin: 0, marginBottom: 12 }}>Tu pedido</h2>

						<div style={{ display: 'grid', gap: 10 }}>
							{state.items.map((it) => (
								<div
									key={it.slug}
									style={{
										display: 'grid',
										gridTemplateColumns: '1fr 110px 110px 36px',
										gap: 10,
										alignItems: 'center',
									}}>
									<div>
										<div style={{ fontWeight: 800 }}>{it.nombre}</div>
										<div style={{ color: '#666', fontSize: 13 }}>
											Gs. {formatGs(it.precioPublico)} /{' '}
											{it.tipoVenta === 'metro' ? 'm' : 'u'}
										</div>
									</div>

									<input
										type="number"
										min={1}
										step={1}
										value={it.cantidad}
										onChange={(e) => onQty(it.slug, Number(e.target.value))}
										style={{
											padding: 10,
											borderRadius: 12,
											border: '1px solid #ddd',
										}}
									/>

									<div style={{ fontWeight: 900, textAlign: 'right' }}>
										Gs. {formatGs(it.precioPublico * it.cantidad)}
									</div>

									<button
										onClick={() => onRemove(it.slug)}
										title="Eliminar"
										style={{
											border: '1px solid #ddd',
											borderRadius: 12,
											padding: 10,
											cursor: 'pointer',
											background: '#fff',
										}}>
										×
									</button>
								</div>
							))}
						</div>
					</div>

					<div
						style={{ border: '1px solid #eee', borderRadius: 14, padding: 14 }}>
						<h2 style={{ margin: 0, marginBottom: 12 }}>Entrega y pago</h2>

						<div style={{ display: 'grid', gap: 12 }}>
							<label style={{ display: 'grid', gap: 6 }}>
								<span style={{ fontWeight: 700 }}>Ciudad</span>
								<select
									value={state.cityId}
									onChange={(e) => onCity(e.target.value)}
									style={{
										padding: 12,
										borderRadius: 12,
										border: '1px solid #ddd',
									}}>
									<option value="">Elegí tu ciudad</option>
									{SHIPPING_BY_CITY.map((c) => (
										<option key={c.id} value={c.id}>
											{c.label} — Gs. {formatGs(c.cost)}
										</option>
									))}
								</select>
							</label>

							<label style={{ display: 'grid', gap: 6 }}>
								<span style={{ fontWeight: 700 }}>Forma de pago</span>
								<select
									value={state.payment}
									onChange={(e) => onPayment(e.target.value)}
									style={{
										padding: 12,
										borderRadius: 12,
										border: '1px solid #ddd',
									}}>
									<option value="">Elegí forma de pago</option>
									<option value="transferencia">Transferencia</option>
									<option value="tigo">Giro Tigo</option>
									<option value="puerta">
										En puerta (sujeto a confirmación)
									</option>
								</select>
							</label>
						</div>

						<hr
							style={{
								border: 0,
								borderTop: '1px solid #eee',
								margin: '14px 0',
							}}
						/>

						<div style={{ display: 'grid', gap: 8 }}>
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<span style={{ color: '#555' }}>Subtotal productos</span>
								<strong>Gs. {formatGs(sub)}</strong>
							</div>

							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<span style={{ color: '#555' }}>
									Envío {state.cityId ? '' : '(elegí ciudad)'}
								</span>
								<strong>
									{ship === 0 && sub >= FREE_SHIPPING_MIN
										? 'Gratis'
										: `Gs. ${formatGs(ship)}`}
								</strong>
							</div>

							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									fontSize: 18,
								}}>
								<span style={{ fontWeight: 900 }}>Total</span>
								<span style={{ fontWeight: 900 }}>Gs. {formatGs(total)}</span>
							</div>

							{sub < FREE_SHIPPING_MIN ? (
								<div style={{ color: '#444', marginTop: 6 }}>
									Agregá <strong>Gs. {formatGs(missingForFree)}</strong> más y
									el envío es <strong>GRATIS</strong> 🚚
								</div>
							) : (
								<div style={{ color: '#111', marginTop: 6, fontWeight: 800 }}>
									🚚 Envío GRATIS aplicado
								</div>
							)}
						</div>

						<div
							style={{
								display: 'flex',
								gap: 10,
								flexWrap: 'wrap',
								marginTop: 14,
							}}>
							<button
								onClick={sendNormal}
								style={{
									padding: '12px 14px',
									borderRadius: 12,
									border: '1px solid #111',
									background: '#111',
									color: '#fff',
									fontWeight: 800,
									cursor: 'pointer',
								}}>
								Enviar pedido (precio normal)
							</button>

							<button
								onClick={sendWholesale}
								style={{
									padding: '12px 14px',
									borderRadius: 12,
									border: '1px solid #111',
									background: '#fff',
									color: '#111',
									fontWeight: 800,
									cursor: 'pointer',
								}}>
								Consultar mayorista por este pedido
							</button>

							<button
								onClick={() => {
									clearOrder();
									setState(loadOrder());
									window.dispatchEvent(new Event('mbarete:order_updated'));
								}}
								style={{
									padding: '12px 14px',
									borderRadius: 12,
									border: '1px solid #ddd',
									background: '#fff',
									color: '#333',
									fontWeight: 700,
									cursor: 'pointer',
								}}>
								Vaciar
							</button>
						</div>

						<div
							style={{
								marginTop: 10,
								color: '#666',
								fontSize: 13,
								lineHeight: 1.5,
							}}>
							Pago en puerta disponible para pedidos de bajo monto (sujeto a
							confirmación). La ubicación de Google Maps se solicita por
							WhatsApp al confirmar.
						</div>
					</div>
				</>
			)}
		</div>
	);
}
