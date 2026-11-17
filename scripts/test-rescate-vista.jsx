// ---------------------------------------------------------------------------
// 🛟 HORARIOS · E1-R · R5 — LO QUE SE VE de una copia de rescate o de versión antigua, pintado de verdad con
// react-dom/server: las casillas solo en lo que se puede elegir, «no se toca» en lo que cambió después, el botón de
// recuperar apagado hasta elegir algo, la confirmación con lo elegido, y nada roto. Datos DE PRUEBA, construidos aquí.
// Uso: node scripts/smoke.mjs test-rescate-vista.jsx
// ---------------------------------------------------------------------------
import React from 'react';
import { renderToString } from 'react-dom/server';
import { DetalleCopia, CambiosApartadosEntrada } from '../src/components/cambiosApartados.jsx';
import { describirCopia, prepararRecuperacion, TEXTOS_CAMBIOS_APARTADOS as T, MOTIVOS_NO_RECUPERABLE } from '../src/lib/cambiosApartados.js';
import { ACCENTS } from '../src/tokens.js';

const accent = ACCENTS[0].value;
let pasa = 0; let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) { pasa++; console.log(`  ✓ ${nombre}`); } else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};
const texto = (h) => h.replace(/<!--.*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ');
const roto = (t) => /\bNaN\b|\bundefined\b|\bnull\b|\[object Object\]|Invalid Date|Infinity/.test(t);
const noop = () => {};

const H0 = { actividades: [{ id: 'am', nombre: 'Matemáticas' }, { id: 'ah', nombre: 'Historia' }], bloques: [
  { id: 'b1', horarioId: 'hh', columnaId: 'c1', actividadId: 'am', inicio: '08:00', fin: '09:00', aula: 'A1' },
  { id: 'b2', horarioId: 'hh', columnaId: 'c1', actividadId: 'ah', inicio: '09:00', fin: '10:00', aula: 'A2' }], completadas: [] };
const pisado = { ...H0, bloques: [{ ...H0.bloques[0], aula: 'VIEJO' }], testigo: { revision: 'r2', aparato: 'viejo' } };
const filaR = { id: 'r1', tipo: 'rescate', aparato: 'viejo', creada_en: '2026-11-17T10:00:00Z', vista: false, tamano: 1800, meta: { clave: 'horarioTop', accion: 'escritura', creadaEn: '2026-11-17T10:00:00Z' }, contenido: { formato: 1, clave: 'horarioTop', antes: H0, despues: pisado } };
const actual = (v) => ({ horarioTop: { existe: true, valor: v }, estudios: { existe: false }, papelera: { existe: false } });
const det = (fila, v) => ({ estado: 'listo', fila, actual: actual(v), prep: prepararRecuperacion({ fila, actual: actual(v) }) });
const props = (fila, extra) => ({ copia: describirCopia(fila, { aparato: 'A' }), accent, onRecuperar: noop, onEliminar: noop, onConfirmar: noop, onCancelar: noop, onReintentar: noop, onElegir: noop, onElegirTodo: noop, onElegirNada: noop, puedeRecuperar: null, enConflictoAbierto: false, ...extra });

console.log('\n── Una copia de rescate, para elegir ──');
{
  /* b1 sigue como la dejó la versión antigua (se puede volver a dejar como estaba); b2 la quitó (se puede volver a poner). */
  const d = det(filaR, pisado);
  const h = renderToString(<DetalleCopia {...props(filaR, { detalle: d })} />);
  const t = texto(h);
  comprobar('dice qué es y qué supondría recuperarlo todo', t.includes('lo que había antes de que una versión anterior guardara encima') && t.includes('Recuperarlo todo supondría'), t);
  comprobar('dice cómo se elige (solo lo que sigue como estaba)', t.includes(T.elegirExplica));
  comprobar('una casilla por cada cosa que se puede elegir (2)', (h.match(/type="checkbox"/g) || []).length === 2, String((h.match(/type="checkbox"/g) || []).length));
  comprobar('cada casilla con su nombre («Volver a poner la clase «Historia» (09:00–10:00)»)', h.includes('aria-label="Volver a poner la clase «Historia» (09:00–10:00)"'), h.slice(0, 300));
  comprobar('sin nada elegido, «Recuperar lo elegido…» está apagado y dice por qué', /aria-label="Recuperar lo elegido: [^"]*"[^>]*disabled=""|disabled=""[^>]*aria-label="Recuperar lo elegido/.test(h) && t.includes(T.elegidosNinguno), t);
  comprobar('«Elegir todo lo que se puede» (hay más de una)', t.includes(T.elegirTodo));
  comprobar('y se puede eliminar', t.includes(T.eliminar));
  comprobar('nada roto a la vista', !roto(t), t);
  const h2 = renderToString(<DetalleCopia {...props(filaR, { detalle: d, elegidas: [d.prep.piezas[0].id] })} />);
  comprobar('con una elegida: su casilla marcada y el botón encendido', /checked=""/.test(h2) && !/aria-label="Recuperar lo elegido: [^"]*"[^>]*disabled=""/.test(h2) && !texto(h2).includes(T.elegidosNinguno));
  const plan = prepararRecuperacion({ fila: filaR, actual: actual(pisado), elegidas: [d.prep.piezas[0].id] });
  const h3 = renderToString(<DetalleCopia {...props(filaR, { detalle: d, elegidas: [d.prep.piezas[0].id], accion: { tipo: 'recuperar', fase: 'confirmar', plan } })} />);
  const t3 = texto(h3);
  comprobar('al confirmar, se enseña exactamente lo elegido y cómo se guarda', plan.resumen.every((l) => t3.includes(l)) && t3.includes(T.recuperarExplica) && t3.includes(T.recuperarConfirmar), t3);
  comprobar('mientras confirma, las casillas no se pueden tocar', (h3.match(/type="checkbox"[^>]*disabled=""|disabled=""[^>]*type="checkbox"/g) || []).length === 2);
}

console.log('\n── Lo que cambió después no se puede elegir ──');
{
  const despues = { ...pisado, bloques: [{ ...pisado.bloques[0], aula: 'DE-B' }] };
  const h = renderToString(<DetalleCopia {...props(filaR, { detalle: det(filaR, despues) })} />);
  const t = texto(h);
  comprobar('b1 (cambió después) sale sin casilla y con «no se toca»', t.includes(`Volver a dejar la clase «Matemáticas» (08:00–09:00) como estaba · ${T.piezaChoque}`), t);
  comprobar('y solo b2 tiene casilla', (h.match(/type="checkbox"/g) || []).length === 1);
  const todo = { ...despues, bloques: [...despues.bloques, H0.bloques[1]] };
  const t2 = texto(renderToString(<DetalleCopia {...props(filaR, { detalle: det(filaR, todo) })} />));
  comprobar('si todo cambió después: «No se puede recuperar», con su motivo, y se ve qué era', t2.includes('No se puede recuperar') && t2.includes(MOTIVOS_NO_RECUPERABLE.todo_cambio) && t2.includes('Volver a dejar la clase') && !t2.includes(T.recuperarElegidos), t2);
  const t3 = texto(renderToString(<DetalleCopia {...props(filaR, { detalle: det(filaR, H0) })} />));
  comprobar('si ya está todo así: «Ya está en tu cuenta», sin botón de recuperar', t3.includes('Ya está en tu cuenta') && !t3.includes(T.recuperarElegidos) && t3.includes(T.piezaHecha), t3);
}

console.log('\n── Una de versión antigua, y una de Estudios ──');
{
  const filaV = { ...filaR, id: 'v1', tipo: 'version_antigua', contenido: { formato: 1, clave: 'horarioTop', intentado: pisado, vigente: H0, existia: true } };
  const t = texto(renderToString(<DetalleCopia {...props(filaV, { detalle: det(filaV, H0) })} />));
  comprobar('versión antigua: «lo que intentó guardar», y lo que se puede aplicar («Quitar la clase «Historia»…»)', t.includes('lo que intentó guardar una versión anterior') && t.includes('Quitar la clase «Historia» (09:00–10:00)'), t);
  const filaE = { ...filaR, id: 'e1', meta: { clave: 'estudios' }, contenido: { formato: 1, clave: 'estudios', antes: { asignaturas: [{ id: 'mat', nombre: 'Matemáticas' }] }, despues: { asignaturas: [] } } };
  const te = texto(renderToString(<DetalleCopia {...props(filaE, { detalle: det(filaE, H0) })} />));
  comprobar('Estudios: se ve qué contiene, se dice que no se recupera desde aquí, y se puede eliminar', te.includes('1 asignatura añadida') && te.includes(MOTIVOS_NO_RECUPERABLE.clave_sin_recuperacion) && te.includes(T.eliminar) && !te.includes(T.recuperarElegidos), te);
  comprobar('nada roto a la vista', !roto(t) && !roto(te));
}

console.log('\n── La entrada cerrada ──');
{
  /* El aviso sale de un efecto (lo comprueba Chromium); cerrada y sin el servicio de avisos, la entrada se pinta igual. */
  const h = renderToString(<CambiosApartadosEntrada servicio={{ listar: noop, espacio: noop, copia: noop, actual: noop }} accent={accent} />);
  comprobar('cerrada: el título y la explicación, sin aviso inventado', texto(h).includes(T.titulo) && !h.includes('data-aviso-version-antigua'));
}

console.log(`\n${fallos === 0 ? '✓' : '✗'} ${pasa}/${pasa + fallos} comprobaciones de las copias de rescate y de versión antigua en pantalla`);
if (fallos) process.exit(1);
