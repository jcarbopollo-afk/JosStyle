/* Genera docs/09_ESTILO_DE_HOMBRE_CIERRE.md a partir de cierre.js.
   ⚠️ Igual que el de la F53: el informe SALE del código. Si una fase se pone
   roja, esta página lo dice sola. */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  CONGELADO, NO_SE_PUEDE, SI_SE_PUEDE, REGLA_DE_CAMBIO,
  ESTADOS_CIERRE, estadoCierre, inventarioFinal,
  etiqueta, informeFinal, informeEnVerde,
  DOCUMENTACION, BACKLOG_AL_GLOBAL, ES_MODULO_OFICIAL,
  TEXTOS_CIERRE, APARTADOS_CIERRE,
} from '../src/lib/cierre.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const VISTAS = join(RAIZ, 'src/views');
const OPCIONES = {
  vista: readFileSync(join(VISTAS, 'EstiloHombreView.jsx'), 'utf8'),
  sql: readFileSync(join(RAIZ, 'supabase/schema.sql'), 'utf8'),
  api: readFileSync(join(RAIZ, 'api/ask-ai.js'), 'utf8'),
  fuentesResto: readdirSync(VISTAS)
    .filter((f) => f.endsWith('.jsx') && f !== 'EstiloHombreView.jsx')
    .map((f) => readFileSync(join(VISTAS, f), 'utf8')),
};

const L = [];
const p = (s = '') => L.push(s);
const informe = informeFinal(OPCIONES);
const inv = inventarioFinal();
const v = etiqueta();

p('# ESTILO DE HOMBRE — ESTADO FINAL');
p();
p(`> **${v.nombre}** · ${v.fases} · esquema de datos v${v.esquemaDeDatos}`);
p('>');
p(`> 🚨 **Este informe se genera desde \`src/lib/cierre.js\`**, y cada línea sale de ejecutar la`);
p('> auditoría de su fase. No hay ni un ✅ escrito a mano: si una fase se pone roja, esta página lo');
p('> dice sola. Se regenera con `node --import ./scripts/resolver-vite.mjs scripts/generar-cierre-eh.mjs`.');
p();
p('---');
p();

/* 18 — el informe */
p('## El informe');
p();
p('| | Apartado | Sale de |');
p('|---|---|---|');
informe.forEach((l) => p(`| ${l.icono} | **${l.nombre}** | ${l.de} |`));
p();
p(`**${informeEnVerde(informe)} de ${informe.length} en verde.**`);
p();
informe.filter((l) => l.estado !== 'terminado').forEach((l) => {
  p(`> ${l.icono} **${l.nombre}** — ${l.porque}`);
  p();
});
informe.filter((l) => l.matiz).forEach((l) => {
  p(`> ${l.matiz}`);
  p();
});
p(`> ${TEXTOS_CIERRE.criterio}`);
p();

/* 2 — inventario */
p('## Inventario final');
p();
p('| | Estado | Qué significa |');
p('|---|---|---|');
ESTADOS_CIERRE.forEach((e) => p(`| ${e.icono} | **${e.id}** | ${e.que} |`));
p();
p('### ✅ Terminado');
p();
p(`Los **${inv.terminado.modulos} apartados** del catálogo, las **${inv.terminado.fases} fases**, los`);
p(`**${inv.terminado.sistemasRevisados} sistemas** revisados uno a uno en la F48 y los`);
p(`**${inv.terminado.recorridosE2E} recorridos** integrales que se ejecutan solos.`);
p();
p('### 🟡 Pendiente');
p();
p('*Se puede hacer aquí, y no se ha hecho.*');
p();
inv.pendiente.forEach((x) => p(`- **${x.que}** *(${x.prioridad}, ${x.de})*`));
p();
p('### 🔴 Bloqueado');
p();
p('*Depende de otro sistema de JC Fitness, o de una decisión de Josué.*');
p();
inv.bloqueado.forEach((b) => {
  p(`**${b.que}**`);
  p();
  p(`- Depende de: ${b.dependeDe}`);
  p(`- Lo decide: ${b.decide}`);
  p(`- El arreglo: ${b.arreglo}`);
  p();
});
p('### 💡 Futuro');
p();
p('*Deliberadamente no implementado.*');
p();
inv.futuro.forEach((f) => p(`- **${f.que}** — ${f.porque}`));
p();

/* 1 y 15 — congelación */
p('## Congelado');
p();
p(`Estilo de hombre está **${CONGELADO ? 'cerrado' : 'abierto'}** a funciones nuevas.`);
p();
p('**No se puede:**');
p();
NO_SE_PUEDE.forEach((x) => p(`- ${x.icono} ${x.que}`));
p();
p('**Sí se puede:**');
p();
SI_SE_PUEDE.forEach((x) => {
  p(`- **${x.que}** — ${x.ejemplo}`);
  if (x.listonAlto) p(`  - ⚠️ ${x.listonAlto}`);
});
p();
p(`> ${REGLA_DE_CAMBIO}`);
p();

/* 12 — versión */
p('## La versión');
p();
p('| | |');
p('|---|---|');
p(`| **Nombre** | ${v.nombre} |`);
p(`| **Fecha** | ${v.fecha} |`);
p(`| **Fases** | ${v.fases} |`);
p(`| **Esquema de datos** | v${v.esquemaDeDatos} |`);
p(`| **Estado** | ${v.estado} |`);
p(`| **SQL** | ${v.sql} |`);
p(`| **Usa** | ${v.dependencias.join(' · ')} |`);
p(`| **No usa** | ${v.noUsa.join(' · ')} |`);
p();

/* 16 — módulo oficial */
p('## Módulo oficial de JC Fitness');
p();
p(`**Qué hace.** ${ES_MODULO_OFICIAL.hace}`);
p();
p(`**Qué no hace.** ${ES_MODULO_OFICIAL.noHace}`);
p();
p(`> ${ES_MODULO_OFICIAL.regla}`);
p();
p(`Usa **${ES_MODULO_OFICIAL.usa} de los ${ES_MODULO_OFICIAL.de}** sistemas globales que existen.`);
p();

/* 13 y 14 — documentación y backlog */
p('## Dónde está todo');
p();
p(`- **Cómo funciona por dentro:** \`${DOCUMENTACION.tecnica}\` (${DOCUMENTACION.apartadosCubiertos} apartados)`);
p(`- **Cómo publicarlo:** \`${DOCUMENTACION.publicar}\``);
p(`- **Qué se hizo en cada fase:** \`${DOCUMENTACION.historial}\` y \`${DOCUMENTACION.fases}\``);
p(`- **Las ${BACKLOG_AL_GLOBAL.cuantas} ideas del backlog:** ${BACKLOG_AL_GLOBAL.donde}`);
p();
p(`> ${BACKLOG_AL_GLOBAL.regla}`);
p();

/* Cierre */
p('---');
p();
p('## Condición final');
p();
p(`> ${TEXTOS_CIERRE.condicion}`);
p();
p(`> ${TEXTOS_CIERRE.loQueFalta}`);
p();
p(`*${TEXTOS_CIERRE.gracias}*`);
p();
p(`*Los ${APARTADOS_CIERRE.length} apartados de esta fase están contestados; el informe y el inventario se derivan del código.*`);
p();

writeFileSync(join(RAIZ, 'docs/09_ESTILO_DE_HOMBRE_CIERRE.md'), L.join(String.fromCharCode(13, 10)));
console.log(`✅ informe final generado — ${L.length} líneas · ${informeEnVerde(informe)}/${informe.length} en verde`);
