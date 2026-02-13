import React, { useEffect, useMemo, useState } from 'react';
import { loadOrder } from '../lib/orderStore';

function countItems() {
	const st = loadOrder();
	// total de unidades (sumando cantidades). Si preferís "cantidad de productos distintos", cambiá por st.items.length
	return st.items.reduce((acc, it) => acc + (it.cantidad ?? 0), 0);
}

export default function OrderCountBadge() {
	const [count, setCount] = useState(0);

	useEffect(() => {
		// inicial
		setCount(countItems());

		// cuando agregás/quitas desde tus botones (evento custom)
		const onCustom = () => setCount(countItems());
		window.addEventListener('mbarete:order_updated', onCustom);

		// cuando cambia LocalStorage en otra pestaña/ventana
		const onStorage = (e: StorageEvent) => {
			if (e.key === 'mbarete_pedido_v1') setCount(countItems());
		};
		window.addEventListener('storage', onStorage);

		return () => {
			window.removeEventListener('mbarete:order_updated', onCustom);
			window.removeEventListener('storage', onStorage);
		};
	}, []);

	const label = useMemo(() => (count > 99 ? '99+' : String(count)), [count]);

	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				minWidth: 22,
				height: 22,
				padding: '0 6px',
				borderRadius: 999,
				background: 'var(--logo-orange)',
				color: '#fff',
				fontSize: 12,
				fontWeight: 800,
				lineHeight: 1,
			}}
			aria-label={`Items en pedido: ${count}`}
			title={`Items en pedido: ${count}`}>
			{label}
		</span>
	);
}
