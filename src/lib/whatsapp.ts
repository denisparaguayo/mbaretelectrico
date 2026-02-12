import type { OrderState } from './orderStore';
import { formatGs } from './money';
import { SHIPPING_BY_CITY, shippingCost } from '../data/shipping';
import { subtotal as calcSubtotal } from './orderStore';

export function waUrl(message: string) {
	const phone = import.meta.env.PUBLIC_WHATSAPP_PHONE;
	return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function cityLabel(cityId: string) {
	return SHIPPING_BY_CITY.find((x) => x.id === cityId)?.label ?? '';
}

export function buildNormalOrderMessage(state: OrderState) {
	const sub = calcSubtotal(state);
	const ship = shippingCost(sub, state.cityId);
	const total = sub + ship;

	const lines = state.items.map((i) => {
		const unit = i.tipoVenta === 'metro' ? 'm' : 'u';
		const lineTotal = i.precioPublico * i.cantidad;
		return `- ${i.nombre} x${i.cantidad}${unit} = Gs. ${formatGs(lineTotal)}`;
	});

	const pay =
		state.payment === 'transferencia'
			? 'Transferencia'
			: state.payment === 'tigo'
				? 'Giro Tigo'
				: state.payment === 'puerta'
					? 'En puerta (sujeto a confirmación)'
					: 'A definir';

	return [
		'Pedido (Precio normal) – Mbarete Eléctrico',
		'',
		...lines,
		'',
		`Subtotal: Gs. ${formatGs(sub)}`,
		state.cityId
			? `Ciudad: ${cityLabel(state.cityId)} (Envío Gs. ${formatGs(ship)})`
			: 'Ciudad: (elegir)',
		`Total: Gs. ${formatGs(total)}`,
		`Pago: ${pay}`,
		'',
		'¿Confirmamos disponibilidad y coordinamos entrega?',
	].join('\n');
}

export function buildWholesaleMessage(state: OrderState) {
	const lines = state.items.map((i) => {
		const unit = i.tipoVenta === 'metro' ? 'm' : 'u';
		return `- ${i.nombre} x${i.cantidad}${unit}`;
	});

	return [
		'Consulta Mayorista – Mbarete Eléctrico',
		'',
		...lines,
		'',
		state.cityId ? `Ciudad: ${cityLabel(state.cityId)}` : 'Ciudad: (elegir)',
		'',
		'¿Me pasás precio mayorista y cantidad mínima para cada ítem?',
	].join('\n');
}
