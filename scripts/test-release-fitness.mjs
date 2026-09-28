/* Entrega 4 · FIT F45/45 — Pulido final, QA extremo y release de Fitness.
   ═══════════════════════════════════════════════════════════════════════════
   *"No considerar Fitness terminado simplemente porque «compila»."* Lo que se
   comprueba aquí: que cada casilla de la lista del release (apartado 58) nombra
   una prueba que EXISTE —una suite que `verificar.sh` ejecuta, o una marca que
   está en el recorrido de Chromium—; que la definición de «terminado» (65) se
   apoya en casillas de verdad; que el informe final (64) tiene sus veinte
   puntos y no dice «COMPLETADO» a secas mientras quede algo real por hacer; y
   el arreglo de la fase: «Empezar» en un entrenamiento que ya está en curso lo
   continúa, sin una segunda sesión (apartado 21). */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHECKLIST_RELEASE, TERMINADO_FITNESS, HALLAZGOS_F45, PENDIENTES_F45, NO_EN_FIT45, informeReleaseFitness, PUNTOS_INFORME,
} from '../src/lib/releaseFitness.js';
import {
  empezarSesion, guardarSesion, sesionEnCursoDelMismoOrigen, sesionActiva, marcarSerie, HORAS_SESION_ANTIGUA, ejerciciosDeSesion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { normalizarFitnessConSesiones } from '../src/lib/entrenamiento.js';
import { crearLinea } from '../src/lib/constructor.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const VERIFICAR = leer('scripts/verificar.sh');
const probada = (d) => existsSync(join(RAIZ, d.archivo))
  && (d.suite ? VERIFICAR.includes(d.archivo.replace('scripts/', '')) : leer(d.archivo).includes(d.marca));

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. La lista del release: cada casilla, con su prueba (apartado 58) ──');
ok(CHECKLIST_RELEASE.length === 36, `Las 36 casillas del apartado 58 (${CHECKLIST_RELEASE.length})`);
ok(new Set(CHECKLIST_RELEASE.map((c) => c.id)).size === CHECKLIST_RELEASE.length, '…cada una con su id');
const casillas = {};
CHECKLIST_RELEASE.forEach((c) => {
  const faltan = c.donde.filter((d) => !probada(d));
  casillas[c.id] = { ok: c.donde.length > 0 && faltan.length === 0, noAplica: c.noAplica || null };
  ok(casillas[c.id].ok, `${c.que}${c.noAplica ? ' (no aplica, y dice por qué)' : ''}${faltan.length ? ` — falta: ${faltan.map((d) => d.marca || d.archivo).join(' · ')}` : ''}`);
});
ok(CHECKLIST_RELEASE.filter((c) => c.noAplica).every((c) => c.noAplica.length > 60 && c.donde.length > 0),
  'Lo que no aplica (typecheck y lint) dice por qué, y qué hace su papel');

console.log('\n── 2. «Terminado» (apartado 65) ──');
const ids = new Set(CHECKLIST_RELEASE.map((c) => c.id));
ok(TERMINADO_FITNESS.length === 13, 'Los trece puntos de la definición de «terminado»');
ok(TERMINADO_FITNESS.every((t) => t.casillas.every((id) => ids.has(id))), '…y cada uno se apoya en casillas que existen');
ok(TERMINADO_FITNESS.every((t) => t.casillas.length > 0 || t.tambien), '…o dice qué lo demuestra');
ok(TERMINADO_FITNESS.every((t) => t.casillas.every((id) => casillas[id].ok)), '…y todas esas casillas están en verde');

console.log('\n── 3. El informe final (apartado 64) ──');
const informe = informeReleaseFitness({ casillas });
ok(PUNTOS_INFORME.length === 20 && PUNTOS_INFORME.every((p) => informe[p] !== undefined && informe[p] !== ''), 'Los veinte puntos del informe, ninguno vacío');
ok(informe.estado === 'COMPLETADO CON PROBLEMAS PENDIENTES',
  `🚨 El estado es «COMPLETADO CON PROBLEMAS PENDIENTES», no «COMPLETADO» a secas: queda el iPhone de verdad y lo que decide Josué (${informe.estado})`);
ok(/listo para usarse de verdad/.test(informe.conclusion), '…y la conclusión dice que está listo para usarse');
const conFallo = informeReleaseFitness({ casillas: { ...casillas, persistencia: { ok: false } } });
ok(conFallo.estado === 'CON FALLOS' && /NO está listo/.test(conFallo.conclusion) && conFallo.persistencia === 'FALLA',
  '…y con una casilla en rojo, el informe lo dice: una auditoría que no puede fallar no sirve (EH F42)');
ok(/no aplica/.test(informe.typecheck) && /no aplica/.test(informe.lint), 'Typecheck y lint salen como «no aplica», con su motivo, no como «correcto»');
ok(PENDIENTES_F45.every((p) => p.que && p.porque.length > 40), 'Lo pendiente, con su motivo: solo lo real (apartado 64, punto 18)');
ok(PENDIENTES_F45.some((p) => p.id === 'r1'), '…empezando por abrirlo en su iPhone (R1)');
ok(NO_EN_FIT45.some((n) => /Fase 46|fase 46/.test(n.que)), 'Y no hay una fase 46 (apartado 63)');
ok(HALLAZGOS_F45.every((h) => h.prioridad && h.que && h.arreglo && h.apartado), 'Cada hallazgo, con su prioridad y su arreglo');

console.log('\n── 4. El doble «Empezar» ya no crea una segunda sesión (apartado 21) ──');
const lineas = [crearLinea({ exerciseId: 'press-banca-barra', series: 2, reps: 10, peso: 40 })].filter(Boolean);
const ahora = Date.parse('2026-09-28T10:00:00');
const primera = empezarSesion({ nombre: 'Push', lineas, origenTipo: 'plantilla', origenId: 'pl-1', ahora });
let fitness = guardarSesion({ sesiones: [] }, primera);
const otraVez = empezarSesion({ nombre: 'Push', lineas, origenTipo: 'plantilla', origenId: 'pl-1', ahora: ahora + 60000 });
ok(primera && otraVez && primera.id !== otraVez.id, 'Empezar dos veces construye dos sesiones distintas…');
ok(sesionEnCursoDelMismoOrigen(fitness, otraVez, ahora + 60000)?.id === primera.id,
  '🐛 …pero la segunda encuentra la que ya está en curso del mismo entrenamiento, y es ésa la que se continúa');
const deOtra = empezarSesion({ nombre: 'Pierna', lineas, origenTipo: 'plantilla', origenId: 'pl-2', ahora });
ok(sesionEnCursoDelMismoOrigen(fitness, deOtra, ahora) === null, '…mientras que otro entrenamiento no la confunde');
const tarde = ahora + (HORAS_SESION_ANTIGUA + 1) * 3600000;
ok(sesionEnCursoDelMismoOrigen(fitness, otraVez, tarde) === null,
  '⚠️ …y una de hace más de seis horas no se retoma sin preguntar: tiene su tarjeta (F39)');
ok(sesionEnCursoDelMismoOrigen(fitness, { origen: { tipo: 'plantilla', id: null } }, ahora) === null
  && sesionEnCursoDelMismoOrigen(fitness, null, ahora) === null, '…ni una sin origen');
const ej0 = ejerciciosDeSesion(primera)[0];
const hecha = marcarSerie(primera, ej0.id, ej0.series[0].id, true);
ok(ejerciciosDeSesion(hecha)[0].series[0].estado === 'hecha', '(se marca una serie)');
const finalizando = pasarAFinalizacion(hecha, { ahora: ahora + 600000 });
const guardado = guardarEntrenamiento(finalizando, { confirmado: true, ahora: ahora + 700000 });
ok(guardado.ok && guardado.sesion.estado === 'completada', '(y se guarda completada)');
const completada = guardado.sesion;
fitness = guardarSesion(fitness, completada);
ok(sesionEnCursoDelMismoOrigen(fitness, otraVez, ahora + 800000) === null,
  '…y una ya completada tampoco: repetir el entrenamiento otro día es uno NUEVO (apartado 49)');
const cargado = normalizarFitnessConSesiones(fitness);
ok(sesionActiva(cargado) === null && (cargado.sesiones || []).filter((s) => s.estado === 'completada').length === 1,
  '…y lo guardado, pasado por la puerta de carga, es UNA sesión completada y ninguna en curso');
const vista = leer('src/views/FitnessView.jsx');
ok(/sesionEnCursoDelMismoOrigen\(fitness \|\| \{\}, sesion\)/.test(vista) && /setEntrenando\(yaEnCurso\.id\)/.test(vista),
  'La pantalla lo usa al empezar: continúa la que había en vez de guardar otra');

console.log('\n── 5. Volver dice a dónde vuelve, también desde la biblioteca (apartado 24) ──');
const bloqueBiblioteca = (vista.match(/<EjerciciosView[\s\S]*?\/>/) || [''])[0];
ok(/volverA="Entrenamiento"/.test(bloqueBiblioteca) && /onVolver=\{\(\) => setDentro\(null\)\}/.test(bloqueBiblioteca),
  '🐛 La biblioteca abierta desde Entrenamiento vuelve a Entrenamiento y lo dice —antes decía «Fitness»—, como el historial y el constructor');
ok(/volverTexto=\{historialVuelveA \? historialVuelveA\.texto : 'Entrenamiento'\}/.test(vista),
  '…que es lo que ya decía el historial abierto desde el mismo sitio');
ok(HALLAZGOS_F45.some((h) => h.id === 'volver_biblioteca' && h.prioridad === 'P3'), '…y queda en los hallazgos, con su prioridad');

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}FIT F45: ${total - fallos}/${total} — ${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
