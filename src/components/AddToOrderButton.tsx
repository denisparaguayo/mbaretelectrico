import React, { useState } from 'react';
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
			className={[
				'w-full',
				'inline-flex items-center justify-center',
				'rounded-(--r-md)',
				'px-3 py-2',
				'text-[13px] font-black',
				'transition-all duration-200',
				'active:scale-[0.98]',
				added
					? 'bg-(--brand) text-(--brand-contrast) border border-(--brand)'
					: 'bg-(--surface) text-(--text) border border-(--border) hover:bg-(--muted)',
			].join(' ')}>
			{added ? 'Agregado ✓' : 'Agregar al pedido'}
		</button>
	);
}
