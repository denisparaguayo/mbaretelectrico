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
	initialCategory?: string;
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
			type="button"
			onClick={onClick}
			className={[
				'shrink-0',
				'rounded-full px-3 py-2',
				'text-[13px] font-extrabold leading-none',
				'border transition',
				'active:scale-[0.98]',
				active
					? 'bg-(--brand) text-(--brand-contrast) border-(--brand)'
					: 'bg-(--surface) text-(--text) border-(--border) hover:bg-(--muted)',
			].join(' ')}>
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
		<div className="grid gap-4">
			{/* Buscador */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="flex-1 min-w-[240px]">
					<input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Buscar: luz led, panel, cable 2.5, térmica…"
						className="w-full rounded-(--r-lg) border border-(--border) bg-(--surface) px-4 py-3 text-[14px] outline-none transition focus:border-(--logo-blue) focus:ring-4 focus:ring-(--ring)"
					/>
				</div>

				{hasFilters && (
					<button
						type="button"
						onClick={() => {
							setQ('');
							setCat('all');
						}}
						className="rounded-(--r-lg) border border-(--border) bg-(--surface) px-4 py-3 text-[13px] font-black transition hover:bg-(--muted)">
						Limpiar
					</button>
				)}
			</div>

			{/* Chips con scroll SOLO interno (no rompe página) */}
			<div className="w-full overflow-x-auto">
				<div className="flex w-max gap-2 py-1 pr-2">
					<Chip
						active={cat === 'all'}
						label="Todo"
						onClick={() => setCat('all')}
					/>
					{categories
						.filter((c) => c.id !== 'all')
						.map((c) => (
							<Chip
								key={c.id}
								active={cat === c.id}
								label={c.label}
								onClick={() => setCat(c.id)}
							/>
						))}
				</div>
			</div>

			{/* Resumen */}
			<div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-(--text2)">
				<span>
					<span className="font-black text-(--text)">{filtered.length}</span>{' '}
					resultado(s)
				</span>
				<span>Agregá al pedido y enviá todo por WhatsApp</span>
			</div>

			{/* GRID RESPONSIVE CORRECTO */}
			<div className="mt-2 grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
				{filtered.map((p) => {
					const unidad = p.tipoVenta === 'metro' ? 'm' : 'u';

					return (
						<div
							key={p.slug}
							className="min-w-0 flex h-full flex-col gap-3 rounded-(--r-lg) border border-(--border) bg-(--surface) p-3 sm:p-4 shadow-(--shadow)">
							{/* Imagen */}
							<a href={`/p/${p.slug}`} className="block">
								<div className="aspect-[4/3] rounded-(--r-md) bg-(--muted) overflow-hidden border border-(--border)">
									{p.imagen ? (
										<img
											src={p.imagen}
											alt={p.nombre}
											className="h-full w-full object-cover"
											loading="lazy"
										/>
									) : null}
								</div>
							</a>

							{/* Título */}
							<div className="min-h-[46px]">
								<a href={`/p/${p.slug}`} className="block">
									<div className="font-black leading-tight text-[14px] sm:text-[15px] text-(--text)">
										{p.nombre}
									</div>
								</a>
								<div className="mt-1 text-[12.5px] font-semibold text-(--text3)">
									{p.marca || (
										<span className="text-transparent select-none">.</span>
									)}
								</div>
							</div>

							<div className="flex-1" />

							{/* Precio + botón */}
							<div className="mt-auto flex flex-col gap-2">
								<div className="font-black text-[15px] sm:text-[16px] text-(--text)">
									Gs. {formatGs(p.precioPublico)}
									<span className="ml-1 text-[12px] font-bold text-(--text3)">
										/ {unidad}
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
					);
				})}
			</div>

			{/* Sin resultados */}
			{filtered.length === 0 && (
				<div className="rounded-(--r-lg) border border-(--border) bg-(--surface) p-4 text-(--text2)">
					<div className="font-black text-(--text)">
						No encontramos resultados.
					</div>
					<div className="mt-1 text-[13px]">
						Probá con otra palabra (ej: <strong>led</strong>,{' '}
						<strong>cable</strong>, <strong>térmica</strong>).
					</div>
				</div>
			)}
		</div>
	);
}
