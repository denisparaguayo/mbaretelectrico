import fs from 'node:fs';
import path from 'node:path';

const inPath = path.resolve('src/data/precios.csv');
const outPath = path.resolve('src/data/precios.json');

if (!fs.existsSync(inPath)) {
	console.error('No existe src/data/precios.csv');
	process.exit(1);
}

const csv = fs.readFileSync(inPath, 'utf-8').trim();
const lines = csv.split(/\r?\n/);
const headers = lines
	.shift()
	.split(',')
	.map((h) => h.trim());

const idxCodigo = headers.indexOf('codigoProducto');
const idxPrecio = headers.indexOf('precioPublico');

if (idxCodigo === -1 || idxPrecio === -1) {
	console.error('El CSV debe tener columnas: codigoProducto,precioPublico');
	process.exit(1);
}

const map = {};
for (const line of lines) {
	if (!line.trim()) continue;
	const cols = line.split(',').map((c) => c.trim());
	const codigo = cols[idxCodigo];
	const precio = Number(cols[idxPrecio]);
	if (!codigo) continue;
	if (!Number.isFinite(precio)) continue;
	map[codigo] = precio;
}

fs.writeFileSync(outPath, JSON.stringify(map, null, 2), 'utf-8');
console.log(`OK → ${outPath} (${Object.keys(map).length} precios)`);
