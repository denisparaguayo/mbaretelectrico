// src/content/config.ts
import { defineCollection, z } from 'astro:content';

/**
 * Productos (MD)
 * Usado en:
 * - /catalogo (lista + buscador)
 * - /p/[slug] (ficha individual + SEO Product JSON-LD)
 */
const productos = defineCollection({
	type: 'content',
	schema: z.object({
		nombre: z.string(),
		descripcionCorta: z.string(),
		categoria: z.string(), // ej: "iluminacion" | "cables" | "llaves-y-tomas" ...
		marca: z.string().optional(),

		// Precio público (se muestra siempre)
		precioPublico: z.number().int().nonnegative(),

		// venta por unidad o por metro (cables)
		tipoVenta: z.enum(['unidad', 'metro']),
		codigoProducto: z.string(),

		// Opcionales
		imagen: z.string().optional(), // ej: "/img/productos/panel-led-18w.jpg"
		tags: z.array(z.string()).optional(),
		destacado: z.boolean().optional(),
	}),
});

/**
 * Categorías SEO (MD)
 * Usado en:
 * - /catalogo?cat=iluminacion (intro SEO)
 * - JSON-LD CollectionPage
 *
 * Nota: el slug del archivo define la URL/identificador (c.slug),
 * pero igual guardamos `slug` en frontmatter por claridad (y para validación).
 */
const categorias = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
	}),
});

export const collections = {
	productos,
	categorias,
};
