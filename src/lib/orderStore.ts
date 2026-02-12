import type { CityId } from '../data/shipping';

export type OrderItem = {
	slug: string;
	nombre: string;
	precioPublico: number;
	tipoVenta: 'unidad' | 'metro';
	cantidad: number; // unidad: entero; metro: entero (1m)
};

export type OrderState = {
	items: OrderItem[];
	cityId: CityId | '';
	payment: 'transferencia' | 'tigo' | 'puerta' | '';
};

const KEY = 'mbarete_pedido_v1';

export const defaultOrderState: OrderState = {
	items: [],
	cityId: '',
	payment: '',
};

export function loadOrder(): OrderState {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return defaultOrderState;
		const parsed = JSON.parse(raw) as OrderState;
		return {
			...defaultOrderState,
			...parsed,
			items: Array.isArray(parsed.items) ? parsed.items : [],
		};
	} catch {
		return defaultOrderState;
	}
}

export function saveOrder(state: OrderState) {
	localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearOrder() {
	localStorage.removeItem(KEY);
}

export function addItem(state: OrderState, item: Omit<OrderItem, 'cantidad'>) {
	const existing = state.items.find((i) => i.slug === item.slug);
	if (existing) {
		existing.cantidad += 1;
	} else {
		state.items.push({ ...item, cantidad: 1 });
	}
	return state;
}

export function updateQty(state: OrderState, slug: string, qty: number) {
	const it = state.items.find((i) => i.slug === slug);
	if (!it) return state;
	const fixed = Math.max(1, Math.floor(qty)); // 1m / 1u increments
	it.cantidad = fixed;
	return state;
}

export function removeItem(state: OrderState, slug: string) {
	state.items = state.items.filter((i) => i.slug !== slug);
	return state;
}

export function subtotal(state: OrderState) {
	return state.items.reduce((acc, i) => acc + i.precioPublico * i.cantidad, 0);
}
