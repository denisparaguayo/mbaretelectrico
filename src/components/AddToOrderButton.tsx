import React, { useEffect, useState } from 'react';
import { addItem, loadOrder, saveOrder } from '../lib/orderStore';

type Props = {
	slug: string;
	nombre: string;
	precioPublico: number;
	tipoVenta: 'unidad' | 'metro';
};

export default function AddToOrderButton(props: Props) {
	const [added, setAdded] = useState(false);

	function onAdd() {
		const st = loadOrder();
		addItem(st, {
			slug: props.slug,
			nombre: props.nombre,
			precioPublico: props.precioPublico,
			tipoVenta: props.tipoVenta,
		});
		saveOrder(st);
		setAdded(true);
		window.dispatchEvent(new Event('mbarete:order_updated'));
		setTimeout(() => setAdded(false), 900);
	}

	return (
		<button
			onClick={onAdd}
			style={{
				padding: '10px 12px',
				borderRadius: 12,
				border: '1px solid #111',
				background: added ? '#111' : '#fff',
				color: added ? '#fff' : '#111',
				fontWeight: 700,
				cursor: 'pointer',
			}}>
			{added ? 'Agregado' : 'Agregar al pedido'}
		</button>
	);
}
