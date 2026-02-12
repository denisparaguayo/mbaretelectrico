// src/components/CatalogBrowser.tsx
import React, { useMemo, useState } from 'react';
import AddToOrderButton from './AddToOrderButton';
import { formatGs } from '../lib/money';

type Product = {
	slug: string;
	nombre: string;
	marca?: string;
	categoria: string;
	precioPublico: number;
	tipoVenta: 'unidad' | 'metro';
	descripcionCorta: string;
	imagen?: string;
	tags?: string[];
};

type Props = {
	products: Product[];
	categories: { id: string; label: string }[];
	initialCategory?: string; // ✅ para arrancar con ?cat=
};

function normalize(s: string) {
	return (s ?? '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();
}

function Chip({
	active,
	label,
	onClick,
}: {
	active: boolean;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			onClick={onClick}
			type="button"
			style={{
				padding: '10px 12px',
				borderRadius: 999,
				border: '1px solid',
				borderColor: active ? '#111' : '#ddd',
				background: active ? '#111' : '#fff',
				color: active ? '#fff' : '#111',
				fontWeight: 800,
				fontSize: 13,
				cursor: 'pointer',
				lineHeight: 1,
				transition: 'transform .12s ease, box-shadow .12s ease',
			}}
			aria-pressed={active}>
			{label}
		</button>
	);
}

export default function CatalogBrowser({
	products,
	categories,
	initialCategory,
}: Props) {
	const [q, setQ] = useState('');
	const [cat, setCat] = useState<string>(
		initialCategory && initialCategory.trim() ? initialCategory : 'all'
	);

	const filtered = useMemo(() => {
		const nq = normalize(q);

		return products.filter((p) => {
			if (cat !== 'all' && p.categoria !== cat) return false;
			if (!nq) return true;

			const hay = normalize(
				[
					p.nombre,
					p.marca ?? '',
					p.categoria,
					p.descripcionCorta,
					...(p.tags ?? []),
				].join(' ')
			);

			return hay.includes(nq);
		});
	}, [q, cat, products]);

	const hasFilters = q.trim().length > 0 || cat !== 'all';

	return (
		<div style={{ display: 'grid', gap: 14 }}>
			{/* Buscador */}
			<div
				style={{
					display: 'flex',
					gap: 10,
					flexWrap: 'wrap',
					alignItems: 'center',
				}}>
				<div style={{ flex: '1 1 340px' }}>
					<input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Buscar: luz led, panel, cable 2.5, llave térmica…"
						style={{
							width: '100%',
							padding: '12px 14px',
							borderRadius: 14,
							border: '1px solid #ddd',
							outline: 'none',
							fontSize: 14,
						}}
					/>
				</div>

				{hasFilters && (
					<button
						type="button"
						onClick={() => {
							setQ('');
							setCat('all');
						}}
						style={{
							padding: '12px 14px',
							borderRadius: 14,
							border: '1px solid #ddd',
							background: '#fff',
							cursor: 'pointer',
							fontWeight: 800,
							fontSize: 13,
						}}>
						Limpiar
					</button>
				)}
			</div>

			{/* Chips */}
			<div
				style={{
					display: 'flex',
					gap: 8,
					flexWrap: 'wrap',
					alignItems: 'center',
				}}>
				<Chip
					active={cat === 'all'}
					label="Todo"
					onClick={() => setCat('all')}
				/>
				{categories.map((c) => (
					<Chip
						key={c.id}
						active={cat === c.id}
						label={c.label}
						onClick={() => setCat(c.id)}
					/>
				))}
			</div>

			{/* Resumen */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					color: '#555',
					fontSize: 13,
					gap: 10,
					flexWrap: 'wrap',
				}}>
				<span>
					<strong style={{ color: '#111' }}>{filtered.length}</strong>{' '}
					resultado(s)
				</span>
				<span>Agregá al pedido y enviá todo por WhatsApp</span>
			</div>

			{/* Grid */}
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
					gap: 12,
				}}>
				{filtered.map((p) => (
					<div
						key={p.slug}
						style={{
							border: '1px solid #eee',
							borderRadius: 16,
							padding: 14,
							display: 'flex',
							flexDirection: 'column',
							gap: 10,
							background: '#fff',
							boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
						}}>
						<a
							href={`/p/${p.slug}`}
							style={{ textDecoration: 'none', color: 'inherit' }}
							aria-label={`Ver ${p.nombre}`}>
							<div
								style={{
									aspectRatio: '4/3',
									background: '#f6f6f6',
									borderRadius: 12,
									overflow: 'hidden',
									border: '1px solid #efefef',
								}}>
								{p.imagen ? (
									<img
										src={p.imagen}
										alt={p.nombre}
										style={{
											width: '100%',
											height: '100%',
											objectFit: 'cover',
										}}
										loading="lazy"
									/>
								) : null}
							</div>
						</a>

						<div>
							<a
								href={`/p/${p.slug}`}
								style={{ textDecoration: 'none', color: 'inherit' }}>
								<div style={{ fontWeight: 900, lineHeight: 1.2 }}>
									{p.nombre}
								</div>
							</a>
							<div style={{ color: '#555', fontSize: 13, marginTop: 4 }}>
								{p.marca ? p.marca : ' '}
							</div>
						</div>

						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 10,
								marginTop: 'auto',
							}}>
							<div style={{ fontWeight: 900 }}>
								Gs. {formatGs(p.precioPublico)}
								<span style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>
									{' '}
									/{p.tipoVenta === 'metro' ? 'metro' : 'unidad'}
								</span>
							</div>

							<AddToOrderButton
								slug={p.slug}
								nombre={p.nombre}
								precioPublico={p.precioPublico}
								tipoVenta={p.tipoVenta}
							/>
						</div>
					</div>
				))}
			</div>

			{/* Sin resultados */}
			{filtered.length === 0 && (
				<div
					style={{
						padding: 16,
						border: '1px solid #eee',
						borderRadius: 14,
						background: '#fff',
					}}>
					No encontramos resultados. Probá con otra palabra (ej: “led”, “cable”,
					“térmica”).
				</div>
			)}
		</div>
	);
}
