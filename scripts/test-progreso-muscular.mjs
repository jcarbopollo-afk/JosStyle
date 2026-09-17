/* Entrega 4 · FIT F13/45 — Progreso por grupos musculares.
   ═══════════════════════════════════════════════════════════════════════════
   Los 18 puntos del apartado 26, y por encima de todo:
   · un grupo que no se entrena es «Sin datos», NUNCA «Descenso» (apartado 11);
   · un ejercicio cuenta según su porcentaje, no al 100 % en todo (apartado 9);
   · un solo ejercicio no decide un grupo con varios (apartado 4);
   · esto es rendimiento, no hipertrofia (apartado 2). */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RECENCIA_DIAS, fitnessEnPeriodo, repartoMuscular, senalesDeEjercicios, votoMuscular,
  ejerciciosDeMusculo, progresoDeSubgrupo, progresoDeGrupo, resumenMuscular, ejercicioEnGrupo,
  FILTROS_GRUPO, AVISO_RENDIMIENTO, NO_EN_FIT13,
} from '../src/lib/progresoMuscular.js';
import { progresoDeEjercicio } from '../src/lib/progresion.js';
import { GRUPOS_MUSCULARES } from '../src/lib/fitness.js';
import { ejercicioPorId } from '../src/lib/ejercicios.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { addDays } from '../src/lib/helpers.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (src) => src.replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1 ');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const HOY = '2026-09-17';
const hace = (n) => addDays(HOY, -n);
function sesion(exerciseId, valores, fecha, cambios = {}) {
  let r = crearRutina({ nombre: exerciseId });
  r = anadirEjercicio(r, exerciseId);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length, ...cambios });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    if (!v) return;
    s = editarSerie(s, e.id, e.series[i].id, v);
    s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
}
const con = (...ss) => ss.reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS });
const r = (reps, peso = null) => ({ reps, peso });
const corp = { tipoCarga: 'corporal' };
/* Un ejercicio que MEJORA, se mantiene o BAJA: dos sesiones recientes. */
const mejora = (id, cambios = {}) => [sesion(id, [r(8, cambios.tipoCarga ? null : 50)], hace(10), cambios), sesion(id, [r(10, cambios.tipoCarga ? null : 50)], hace(3), cambios)];
const estable = (id, cambios = {}) => [sesion(id, [r(8, cambios.tipoCarga ? null : 50)], hace(10), cambios), sesion(id, [r(8, cambios.tipoCarga ? null : 50)], hace(3), cambios)];
const baja = (id, cambios = {}) => [sesion(id, [r(10, cambios.tipoCarga ? null : 50)], hace(10), cambios), sesion(id, [r(8, cambios.tipoCarga ? null : 50)], hace(3), cambios)];
const grupo = (res, id) => res.grupos.find((g) => g.id === id);

console.log('\n═══ FIT F13/45 · Progreso por grupos musculares ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Sin datos, uno, varios (apartado 26: 2-5) ──');

const VACIO = resumenMuscular({ ...DEFAULT_FITNESS }, { hoy: HOY });
ok(VACIO.grupos.length === 7 && VACIO.grupos.map((g) => g.id).join() === GRUPOS_MUSCULARES.map((g) => g.id).join(),
  'Aparecen los siete grupos del catálogo, en su orden (apartado 26.2)');
ok(VACIO.grupos.every((g) => g.estado === 'sin_datos' && g.estadoNombre === 'Sin datos'), '🚨 Sin entrenar nada, todos «Sin datos» (26.3)');
ok(!VACIO.hayEjercicios && !VACIO.hayDatos, '…y el resumen lo sabe, para pintar su estado vacío');

const PECHO = con(...mejora('press-banca-barra'));
const RP = resumenMuscular(PECHO, { hoy: HOY });
const gPecho = grupo(RP, 'pecho');
ok(gPecho.estado === 'mejora' && gPecho.pocaInformacion === true && gPecho.ejerciciosConDatos === 1,
  '🚨 Con UN ejercicio: su tendencia, marcada como poca información (apartado 4, 26.4)');
ok(gPecho.resumen === 'Poca información: un solo ejercicio', `…y lo dice: «${gPecho.resumen}»`);
ok(grupo(RP, 'cuello').estado === 'sin_datos', '🚨 El cuello, que no ha entrenado, NO sale «Descenso»: «Sin datos» (apartado 11)');
ok(grupo(RP, 'piernas').estado === 'sin_datos', '…ni las piernas');

/* 🚨 Apartados 9 y 10 — cada ejercicio cuenta según su porcentaje. */
const press = RP.senales.find((s) => s.exerciseId === 'press-banca-barra');
const pesoEn = (g) => press.reparto.filter((x) => x.grupoId === g).reduce((n, x) => n + x.peso, 0);
ok(Math.abs(pesoEn('pecho') - 0.5) < 1e-9 && Math.abs(pesoEn('brazos') - 0.25) < 1e-9 && Math.abs(pesoEn('hombros') - 0.2) < 1e-9,
  `🚨 El press de banca vota 0,5 en Pecho, 0,25 en Brazos y 0,2 en Hombros, como dice el catálogo (26.7)`);
ok(Math.abs(press.reparto.reduce((n, x) => n + x.peso, 0) - 1) < 1e-9, '…y el reparto suma 1: no cuenta al 100 % en todo');
ok(ejerciciosDeMusculo(RP.senales, { grupoId: 'brazos' })[0].implicacion === 25, '…y la lista de Brazos dice «25 %» de implicación');

/* Varios ejercicios (26.5). Espalda: dominada 0,65 · remo 0,77 · face pull 0,35. */
const ESP1 = resumenMuscular(con(...mejora('dominada-prona', corp), ...mejora('face-pull'), ...estable('remo-barra')), { hoy: HOY });
const e1 = grupo(ESP1, 'espalda');
ok(e1.estado === 'mejora' && e1.mejoran === 2 && e1.ejerciciosConDatos === 3,
  `🚨 Espalda con dominadas y face pull mejorando (0,65 + 0,35) frente al remo estable (0,77): MEJORANDO por mayoría ponderada (${e1.estado})`);
ok(e1.resumen === '2 de 3 ejercicios mejoran' && Math.abs(e1.fraccion - 2 / 3) < 1e-9,
  `…«${e1.resumen}», y la barra sale de CONTAR: 2 de 3 (apartado 3)`);
ok(e1.pocaInformacion === false, '…sin la marca de poca información');

const ESP2 = resumenMuscular(con(...mejora('dominada-prona', corp), ...estable('remo-barra')), { hoy: HOY });
ok(grupo(ESP2, 'espalda').estado === 'estable',
  '🚨 Dominadas mejorando (0,65) y remo estable (0,77): nadie tiene mayoría → ESTABLE. Un ejercicio no decide el grupo (apartado 4)');

/* ⚠️ El empate se prueba con señales de peso IDÉNTICO: en el catálogo ni siquiera
   la dominada prona y la supina implican igual la espalda (0,65 y 0,55). */
const empate = votoMuscular([{ conDatos: true, estado: 'mejora', peso: 0.5 }, { conDatos: true, estado: 'descenso', peso: 0.5 }]);
ok(empate.estado === 'estable', '🚨 Uno mejora y otro baja con el mismo peso: EMPATE → ESTABLE (apartado 4)');
const ESP3 = resumenMuscular(con(...mejora('dominada-prona', corp), ...baja('dominada-supina', corp)), { hoy: HOY });
ok(grupo(ESP3, 'espalda').estado === 'mejora', '…y con pesos reales la prona (0,65) pesa más que la supina (0,55): la mayoría manda');

const ESP4 = resumenMuscular(con(...baja('dominada-prona', corp), ...baja('remo-barra'), ...mejora('face-pull')), { hoy: HOY });
ok(grupo(ESP4, 'espalda').estado === 'descenso', 'Dos bajan (0,65 + 0,77) frente a uno que mejora (0,35): DESCENSO por mayoría');

const PRIMERO = resumenMuscular(con(sesion('peso-muerto', [r(5, 100)], hace(2))), { hoy: HOY });
ok(grupo(PRIMERO, 'espalda').estado === 'sin_datos' && PRIMERO.hayEjercicios === true && PRIMERO.hayDatos === false,
  '🚨 Un primer registro NO vota: la espalda sigue «Sin datos», y se distingue de no haber entrenado (apartado 22)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Subgrupos (apartados 6 y 9, 26.6) ──');

const dors = e1.subgrupos.find((s) => s.id === 'dorsales');
const erect = e1.subgrupos.find((s) => s.id === 'erectores');
ok(e1.subgrupos.length === 3 && dors && erect, 'Espalda se abre en sus tres subgrupos');
ok(dors.ejerciciosConDatos === 2 && dors.estado === 'mejora',
  `Dorsales: dominadas (0,5) mejoran y remo (0,4) estable → ${dors.estadoNombre}`);
ok(erect.ejerciciosConDatos === 1 && erect.estado === 'estable' && erect.pocaInformacion,
  '🚨 Erectores: solo el remo los trabaja → su tendencia, con poca información');
const trap = e1.subgrupos.find((s) => s.id === 'trapecio');
ok(trap.ejerciciosConDatos === 3, 'Trapecio: los tres lo trabajan, cada uno con su parte');
const ejDors = ejerciciosDeMusculo(ESP1.senales, { subgrupoId: 'dorsales' });
ok(ejDors.map((t) => t.exerciseId).join() === 'dominada-prona,remo-barra' && ejDors[0].implicacion === 50,
  '🚨 Espalda → Dorsales → Dominadas: la lista del subgrupo, la que más lo implica primero (apartado 27)');
ok(ejDors[0].ultima === '10 reps' && ejDors[0].estado === 'mejora', `…con el último resultado y la tendencia de la F12 (${ejDors[0].ultima})`);
ok(progresoDeSubgrupo([], { id: 'x', nombre: 'X' }).estado === 'sin_datos', 'Un subgrupo sin ejercicios: «Sin datos»');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Periodo y recencia (apartados 13 y 14, 26.9) ──');

const VIEJO = con(...[sesion('press-banca-barra', [r(8, 50)], hace(45)), sesion('press-banca-barra', [r(10, 50)], hace(40))]);
ok(grupo(resumenMuscular(VIEJO, { hoy: HOY, rango: '3m' }), 'pecho').estado === 'mejora', 'En 3 meses, la mejora de hace 40 días cuenta');
const r30 = resumenMuscular(VIEJO, { hoy: HOY, rango: '30d' });
ok(grupo(r30, 'pecho').estado === 'sin_datos' && r30.hayEjercicios === false,
  '🚨 En 30 días NO: «datos insuficientes», sin usar en silencio los datos viejos (apartado 13)');
const MEDIO = con(sesion('press-banca-barra', [r(8, 50)], hace(45)), sesion('press-banca-barra', [r(10, 50)], hace(5)));
const rMedio = resumenMuscular(MEDIO, { hoy: HOY, rango: '30d' });
ok(grupo(rMedio, 'pecho').estado === 'sin_datos' && rMedio.hayEjercicios && !rMedio.hayDatos,
  '⚠️ Con una sesión dentro y la anterior fuera del periodo: hay ejercicio, pero no con qué comparar dentro');

const ANTIGUO = con(sesion('press-banca-barra', [r(8, 50)], hace(130)), sesion('press-banca-barra', [r(10, 50)], hace(120)));
const rAnt = resumenMuscular(ANTIGUO, { hoy: HOY, rango: 'todo' });
ok(grupo(rAnt, 'pecho').estado === 'sin_datos' && rAnt.senales[0].antiguo === true,
  `🚨 Con «Todo», una mejora de hace 120 días ya NO dice «mejorando»: pasa de la recencia de ${RECENCIA_DIAS} días (apartado 14)`);
ok(progresoDeEjercicio(ANTIGUO, 'press-banca-barra').tendencia === 'mejora', '…aunque la F11 siga guardando que aquella vez mejoró');

const f30 = fitnessEnPeriodo(MEDIO, '30d', HOY);
ok(f30.sesiones.length === 1 && fitnessEnPeriodo(MEDIO, '30d', HOY).sesiones === f30.sesiones,
  '⚠️ El periodo filtra las sesiones y reutiliza la misma lista: el índice de la F11 no se recalcula (apartado 19)');
ok(fitnessEnPeriodo(MEDIO, 'todo', HOY) === MEDIO, '…y con «Todo» no se copia nada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Parciales, eliminados y datos rotos (26.12, 26.13 y apartado 12) ──');

const PARCIAL = con(sesion('press-banca-barra', [r(10, 50), r(10, 50), r(10, 50)], hace(10)), sesion('press-banca-barra', [r(10, 50), r(10, 50), null], hace(3)));
ok(grupo(resumenMuscular(PARCIAL, { hoy: HOY }), 'pecho').estado === 'estable',
  '🚨 Hacer 2 de 3 series con los mismos números NO es un descenso del pecho (26.12)');

const fantasma = sesion('press-banca-barra', [r(8, 50)], hace(5));
const conFantasma = { ...fantasma, id: 'fantasma', origen: { ...fantasma.origen, ejercicios: fantasma.origen.ejercicios.map((e) => ({ ...e, exerciseId: 'ya-no-existe' })) } };
const fantasma2 = { ...conFantasma, id: 'fantasma2', fecha: hace(2), iniciadaEn: conFantasma.iniciadaEn + 86400000 * 3, terminadaEn: conFantasma.terminadaEn + 86400000 * 3 };
let noRompe = true;
let rF = null;
try { rF = resumenMuscular(con(conFantasma, fantasma2, ...mejora('press-banca-barra')), { hoy: HOY }); } catch { noRompe = false; }
ok(noRompe, '🚨 Un ejercicio que ya no está en el catálogo no rompe Progreso (26.13)');
ok(rF && !rF.senales.some((s) => s.exerciseId === 'ya-no-existe'), '🚨 …y NO se atribuye a ningún grupo: sin ficha no se sabe qué trabaja (apartado 12)');
ok(ejercicioEnGrupo('ya-no-existe', 'pecho') === false, '…tampoco en el filtro');

const rota = { ...PECHO, sesiones: [...PECHO.sesiones, null, { id: 'z', estado: 'completada', fecha: hace(1) }, { id: 'y', estado: 'completada', fecha: 7, origen: { ejercicios: [null] } }] };
let noRompe2 = true;
try { resumenMuscular(rota, { hoy: HOY, rango: '7d' }); resumenMuscular(rota, { hoy: HOY }); } catch { noRompe2 = false; }
ok(noRompe2, 'Un historial parcialmente roto tampoco rompe (apartado 22)');
ok(votoMuscular([]).estado === 'sin_datos' && votoMuscular(null).estado === 'sin_datos', 'Sin señales, «Sin datos»');
ok(repartoMuscular(null).length === 0, 'Un ejercicio nulo no reparte nada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Filtros, integridad y lenguaje (26.8, 26.11, 26.14 y apartado 2) ──');

ok(FILTROS_GRUPO.length === 8 && FILTROS_GRUPO[0].id === 'todos', '«Todos» y los siete grupos (apartado 8)');
ok(ejercicioEnGrupo('press-banca-barra', 'brazos') && ejercicioEnGrupo('press-banca-barra', 'pecho') && !ejercicioEnGrupo('press-banca-barra', 'piernas'),
  '🚨 El filtro usa la implicación del catálogo: el press está en Pecho y en Brazos, no en Piernas');
ok(ejercicioEnGrupo('press-banca-barra', 'todos'), '…y «Todos» no filtra');

const ANTES = JSON.stringify(ESP1.senales.length ? con(...mejora('dominada-prona', corp)) : null);
const BASE = con(...mejora('dominada-prona', corp), ...estable('remo-barra'));
const COPIA = JSON.stringify(BASE);
resumenMuscular(BASE, { hoy: HOY }); resumenMuscular(BASE, { hoy: HOY, rango: '30d' });
ok(JSON.stringify(BASE) === COPIA && ANTES !== undefined, '🚨 Calcular el progreso muscular no cambia ni un byte de las sesiones (26.11)');

ok(/rendimiento/i.test(AVISO_RENDIMIENTO) && /no el tamaño del músculo/i.test(AVISO_RENDIMIENTO),
  '🚨 La pantalla dice que mide RENDIMIENTO, no el músculo (apartado 2)');
const VISTA = sinComentarios(leer('src/views/ProgresoView.jsx'));
const LIB = sinComentarios(leer('src/lib/progresoMuscular.js'));
ok(!/crecid|hipertrofi|ha crecido|más grande/i.test(VISTA + AVISO_RENDIMIENTO), '🚨 …y en ningún texto afirma que un músculo haya crecido');
ok(/progresoDeEjercicio\(/.test(LIB) && /tarjetaDeProgreso\(/.test(LIB) && !/compararSeries|difPeso/.test(LIB),
  '🚨 La tendencia es la de la F11 y la tarjeta la de la F12: ni una comparación nueva (apartado 18)');
ok(/AVISO_RENDIMIENTO/.test(VISTA) && /MusculosProgreso/.test(VISTA) && /DetalleMusculo/.test(VISTA), 'La pantalla tiene la sección, el detalle y el aviso');
ok(/aria-label=\{`\$\{m\.nombre\}: \$\{m\.estadoNombre\}/.test(VISTA), 'Cada tarjeta de músculo se anuncia con su estado, no solo con color (apartado 21)');
ok(/useMemo\(\(\) => resumenMuscular/.test(VISTA), 'El resumen muscular se calcula una vez por sesiones y periodo (apartado 19)');
ok(NO_EN_FIT13.length >= 4, 'Lo que no se construye, dicho');
ok(ejercicioPorId('dominada-prona') && progresoDeGrupo([], GRUPOS_MUSCULARES[0]).subgrupos.length === 3, 'Un grupo sin señales conserva sus subgrupos');

console.log(`\n  ${total - fallos}/${total} comprobaciones correctas.`);
if (fallos) {
  console.log(`  \x1b[31m${fallos} fallo(s).\x1b[0m\n`);
  process.exit(1);
}
