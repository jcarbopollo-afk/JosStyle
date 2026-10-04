/* Genera docs/MOTION_MAP.md a partir de src/lib/motionMapa.js (Motion System · F0).
   ⚠️ El documento SALE del mapa, no se teclea al lado: así no puede quedarse viejo.
   Uso: node --import ./scripts/resolver-vite.mjs scripts/generar-motion-map.mjs */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { motionMapMarkdown } from '../src/lib/motionMapa.js';

const DESTINO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'MOTION_MAP.md');
writeFileSync(DESTINO, motionMapMarkdown());
console.log(`MOTION_MAP.md escrito en ${DESTINO}`);
