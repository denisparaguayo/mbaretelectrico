export type CityId =
	| 'asuncion'
	| 'fernando'
	| 'lambare'
	| 'villa-elisa'
	| 'luque'
	| 'san-lorenzo'
	| 'mra'
	| 'nemby'
	| 'limpio'
	| 'capiata'
	| 'aregua'
	| 'itaugua'
	| 'otro-central';

export const FREE_SHIPPING_MIN = Number(
	import.meta.env.PUBLIC_FREE_SHIPPING_MIN ?? 300000
);

export const SHIPPING_BY_CITY: { id: CityId; label: string; cost: number }[] = [
	{ id: 'asuncion', label: 'Asunción', cost: 17000 },
	{ id: 'fernando', label: 'Fernando de la Mora', cost: 17000 },
	{ id: 'lambare', label: 'Lambaré', cost: 17000 },
	{ id: 'villa-elisa', label: 'Villa Elisa', cost: 17000 },

	{ id: 'luque', label: 'Luque', cost: 19000 },
	{ id: 'san-lorenzo', label: 'San Lorenzo', cost: 19000 },
	{ id: 'mra', label: 'Mariano Roque Alonso', cost: 19000 },
	{ id: 'nemby', label: 'Ñemby', cost: 19000 },

	{ id: 'limpio', label: 'Limpio', cost: 22000 },
	{ id: 'capiata', label: 'Capiatá', cost: 22000 },
	{ id: 'aregua', label: 'Areguá', cost: 22000 },
	{ id: 'itaugua', label: 'Itauguá', cost: 22000 },

	{ id: 'otro-central', label: 'Otro (Central)', cost: 22000 },
];

export function shippingCost(subtotal: number, cityId: CityId | ''): number {
	if (!cityId) return 0;
	if (subtotal >= FREE_SHIPPING_MIN) return 0;
	return SHIPPING_BY_CITY.find((x) => x.id === cityId)?.cost ?? 0;
}
