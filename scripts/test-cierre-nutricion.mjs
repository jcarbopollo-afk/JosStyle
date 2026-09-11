// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 40 (NU F8) — PULIDO FINAL, INTEGRACIÓN Y QA DE NUTRICIÓN
// ══════════════════════════════════════════════════════════════════════════
//
// La regla final del enunciado: *"No des por terminada la fase simplemente
// porque el código compile."* Así que aquí no se comprueba que exista un
// informe: se comprueba que **el informe ejecute lo que promete** y que pueda
// ponerse rojo. Una auditoría que no puede fallar no sirve (EH F42).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  FASES_NUTRICION, auditoriaDeFases, auditoriaCalculos,
  ORDEN_CONSUMO_OBJETIVO, auditoriaObjetivoConsumido, estadosExtremos,
  auditoriaValidaciones, CLAVE_NUTRICION, LO_QUE_PERSISTE, NO_SE_GUARDA_PORQUE_SE_DERIVA,
  auditoriaPersistencia, INTEGRACIONES, RACHAS, auditoriaIntegracion,
  DATOS_DE_DEMOSTRACION, LLAMADAS_DE_RED, SECRETOS_EN_FRONTEND, AISLAMIENTO,
  PENDIENTE, DEUDA_TECNICA, informeFinal, condicionNU8,
} from '../src/lib/cierreNutricion.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(raiz, p), 'utf8');

const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/.*$/gm, ' ')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa += 1; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-09-07';
const VISTA = leer('src/views/NutritionView.jsx');
const CODIGO_VISTA = soloCodigo(VISTA);
const APP = leer('src/App.jsx');
const LIB = leer('src/lib/cierreNutricion.js');
const CODIGO = soloCodigo(LIB);

console.log('\n══ E3 · Fase 40 (NU F8) — el cierre de Nutrición ══');

console.log('\n── 1. 🚨 Las siete auditorías se EJECUTAN (apartado 1) ──────────');
eq(FASES_NUTRICION.length, 7, 'las siete fases anteriores, cada una con su archivo');
ok(FASES_NUTRICION.every((f) => typeof f.audita === 'function'),
  '🚨 y su `audita` es LA FUNCIÓN DE VERDAD, importada: renombrar una rompe la compilación (EH F39)');
ok(FASES_NUTRICION.every((f) => f.id && f.nombre && f.archivo), '⚠️ con su id, su nombre y dónde vive');
const fases = auditoriaDeFases({ vista: VISTA });
ok(fases.every((f) => f.total > 0), '⚠️ y todas devuelven puntos de verdad');
const rojas = fases.filter((f) => f.rojos > 0);
ok(rojas.length === 0,
  `🚨 NINGUNA FASE ESTÁ ROJA${rojas.length ? `: ${rojas.map((f) => `${f.id} (${f.textosRojos.join('; ')})`).join(' | ')}` : ''}`);
/* 🚨 Y se pone roja de verdad: con una pantalla vacía, varias fases fallan. */
ok(auditoriaDeFases({ vista: '' }).some((f) => f.rojos > 0),
  '🚨 con una pantalla vacía SÍ se ponen rojas: la auditoría puede fallar (EH F42)');

console.log('\n── 2. Los cálculos, de punta a punta (apartado 6) ───────────────');
const calc = auditoriaCalculos(HOY);
eq(calc.eslabones.length, 8, 'ocho eslabones: alimento → cantidad → comida → día → objetivo → estadísticas');
const malos = calc.eslabones.filter((e) => !e.ok);
ok(malos.length === 0, `🚨 y la cadena cuadra entera${malos.length ? `: ${malos.map((e) => e.texto).join(', ')}` : ''}`);
ok(calc.eslabones.some((e) => e.id === 'edicion'),
  '⚠️ incluido que editar la cantidad rehaga la cadena sin desviarse');
ok(calc.eslabones.some((e) => e.id === 'macros'),
  '⚠️ y que los macros de un objetivo sumen sus kcal (*"no aceptar inconsistencias por redondeos"*)');
/* ⚠️ Cada eslabón se comprueba contra el anterior, no contra un número escrito. */
ok(!/=== 233|=== 2400|=== 389/.test(CODIGO),
  '🚨 y NO contra constantes escritas a mano: un cálculo roto aprobaría igual');

console.log('\n── 3. Objetivo y consumido no se confunden (apartado 7) ─────────');
const oc = auditoriaObjetivoConsumido(HOY);
eq(oc.texto, '1850 / 2400 kcal', '«1.850 / 2.400 kcal», el ejemplo del enunciado');
ok(oc.consumidoPrimero, '🚨 LO CONSUMIDO VA PRIMERO, que es lo que se puede confundir');
ok(oc.ok, '⚠️ y el objetivo detrás, con su unidad');
ok(oc.sinObjetivo, '🚨 Y SIN OBJETIVO NO HAY BARRA: un «1850 / —» invitaría a leer un objetivo que no existe');
ok(/consumido/.test(ORDEN_CONSUMO_OBJETIVO) && ORDEN_CONSUMO_OBJETIVO.indexOf('consumido') < ORDEN_CONSUMO_OBJETIVO.indexOf('objetivo'),
  '⚠️ y el orden está declarado');

console.log('\n── 4. Los estados extremos (apartado 8) ─────────────────────────');
const ext = estadosExtremos(HOY);
eq(ext.casos.length, 7, 'los siete del enunciado');
const extMalos = ext.casos.filter((c) => !c.ok);
ok(extMalos.length === 0, `🚨 y los siete pasan${extMalos.length ? `: ${extMalos.map((c) => c.nombre).join(', ')}` : ''}`);
ok(ext.casos.every((c) => c.nombre && c.nota), '⚠️ cada uno con qué se comprobó');
const superado = ext.casos.find((c) => c.id === 'objetivo_superado');
ok(/barra NO se rompe/.test(superado.nota),
  '🚨 incluido que pasarse del objetivo NO rompa la barra (apartado 8)');
const sinDatos = ext.casos.find((c) => c.id === 'sin_datos');
ok(/hueco, no un cero/.test(sinDatos.nota), '⚠️ y que un día sin datos sea un hueco');
ok(ext.casos.some((c) => c.id === 'muchos_alimentos') && ext.casos.some((c) => c.id === 'muchos_dias'),
  '⚠️ con los dos casos de volumen: 200 alimentos y 120 días');

console.log('\n── 5. Las validaciones (apartado 14) ────────────────────────────');
const val = auditoriaValidaciones();
eq(val.casos.length, 6, 'las seis entradas incorrectas del enunciado');
ok(val.ok, '🚨 todas dan aviso: la aplicación no se rompe con ninguna');
ok(val.casos.every((c) => c.ok),
  '⚠️ y ninguno dice «Error» a secas: se dice QUÉ corregir (EH F62)');
ok(val.noEscribeConDatosMalos,
  '🚨 Y CON DATOS MALOS NO SE ESCRIBE NADA, ni pidiéndolo con `confirmado` (regla 7)');
ok(val.casos.some((c) => c.id === 'absurdo') && val.casos.some((c) => c.id === 'negativo'),
  '⚠️ con la cantidad negativa y la absurda entre ellas');

console.log('\n── 6. La persistencia (apartado 15) ─────────────────────────────');
const per = auditoriaPersistencia(HOY);
eq(CLAVE_NUTRICION, 'nutricion', 'todo Nutrición vive en UNA clave');
eq(LO_QUE_PERSISTE.length, 6, 'seis campos guardados');
ok(per.ok && per.sinPerdidas,
  '🚨 Y PASANDO POR LOS NORMALIZADORES NO SE PIERDE NINGUNO: es la regla 5 comprobada');
ok(LO_QUE_PERSISTE.every((c) => c.id && c.nombre && c.fase), '⚠️ cada uno con la fase que lo trajo');
/* ⚠️ Los recientes NO están, y es correcto. */
ok(!LO_QUE_PERSISTE.some((c) => c.id === 'recientes'),
  '🚨 y los recientes NO se guardan: se derivan de las comidas (NU F5)');
ok(NO_SE_GUARDA_PORQUE_SE_DERIVA.length >= 3 && NO_SE_GUARDA_PORQUE_SE_DERIVA.every((d) => d.que && d.deDonde),
  '⚠️ con lo derivado declarado y de dónde sale');
ok(/normalizarMisAlimentosDe\(normalizarNutricionF4\(/.test(APP),
  '⚠️ y `App.jsx` encadena los normalizadores al cargar, en su orden');

console.log('\n── 7. La integración (apartado 16) ──────────────────────────────');
const integ = auditoriaIntegracion();
ok(integ.ok, 'las integraciones están hechas');
ok(INTEGRACIONES.every((i) => i.con && i.como && i.funcion),
  '🚨 y cada una dice CON QUÉ FUNCIÓN se conecta, no «sí, está conectado»');
ok(integ.papelera.every((p) => p.ok),
  '⚠️ las comidas y los alimentos propios están en la papelera global (ME F3)');
/* 🚨 El apartado 16 lo repite: nada de un segundo sistema de rachas. */
eq(RACHAS.propias, 0, '🚨 NI UN SISTEMA DE RACHAS DUPLICADO dentro de Nutrición');
ok(/recuento/i.test(RACHAS.como), '⚠️ y se declara qué es en su lugar');
ok(INTEGRACIONES.some((i) => /Perfil/.test(i.con)) && INTEGRACIONES.some((i) => /Hoy/.test(i.con)),
  '⚠️ con Perfil/Salud y con el resumen para Hoy, los dos del apartado 16');

console.log('\n── 8. Seguridad y limpieza (apartados 19, 20 y 21) ──────────────');
eq(DATOS_DE_DEMOSTRACION, 0, 'ni un dato de demostración exportado');
ok(!/export const DEMO|export const EJEMPLO|datosDePrueba/.test(CODIGO),
  '🚨 y no hay ninguno que pueda acabar en el estado de Josué por descuido');
eq(SECRETOS_EN_FRONTEND, 0, 'ni un secreto en el frontend');
ok(LLAMADAS_DE_RED.every((l) => l.clave === false && l.porque),
  '🚨 las dos llamadas de red no necesitan clave, y se dice por qué');
/* El barrido de verdad sobre las siete librerías de Nutrición. */
const LIBRERIAS = ['nutricion', 'objetivosNutricion', 'alimentos', 'misAlimentos', 'estadisticasNutricion', 'inteligenciaNutricion', 'cierreNutricion'];
const conSecreto = LIBRERIAS.filter((n) => /sk-[A-Za-z0-9_-]{8}|api[_-]?key\s*[:=]\s*['"][^'"]{8}/i.test(leer(`src/lib/${n}.js`)));
ok(conSecreto.length === 0, `🚨 y se barren las siete librerías${conSecreto.length ? `: ${conSecreto.join(', ')}` : ''}`);
eq(AISLAMIENTO.tablasNuevas, 0, 'Nutrición no crea ni una tabla');
ok(/auth\.uid\(\) = user_id/.test(AISLAMIENTO.como),
  '⚠️ así que hereda las políticas por usuario de `app_data` (EH F43)');

console.log('\n── 9. Lo que queda fuera (apartados 23 y 25) ────────────────────');
ok(PENDIENTE.length >= 3, 'lo pendiente está documentado, no implementado a medias');
ok(PENDIENTE.every((p) => p.que && p.porque && p.decide),
  '🚨 cada cosa con su motivo y quién lo decide (apartado 23)');
ok(PENDIENTE.some((p) => /rachas/i.test(p.que)),
  '⚠️ incluido enlazar la constancia con el sistema global, que es de ese módulo');
ok(PENDIENTE.some((p) => /Hoy/.test(p.que)),
  '⚠️ y meter el resumen en Hoy, que es tocar otra fase');
ok(DEUDA_TECNICA.length >= 2 && DEUDA_TECNICA.every((d) => d.que && d.como && d.desde),
  '⚠️ y la deuda heredada se dice con su nombre (apartado 25, punto 10)');
ok(DEUDA_TECNICA.some((d) => /conflicto/i.test(d.que)) && DEUDA_TECNICA.some((d) => /ask-ai/i.test(d.que)),
  '🚨 las dos de verdad: el conflicto entre dispositivos y el endpoint sin autenticación');

console.log('\n── 10. El informe final (apartado 25) ───────────────────────────');
const inf = informeFinal({ vista: VISTA }, HOY);
eq(inf.estado, 'COMPLETADO', '🚨 EL ESTADO SE CALCULA, y sale COMPLETADO');
ok(inf.funcionalidades.length === 7, '⚠️ con las siete fases');
ok(inf.estructura.clave === 'nutricion' && inf.estructura.campos.length === 6,
  '⚠️ la estructura de datos: una clave y seis campos');
ok(inf.estructura.derivados.length >= 3, '⚠️ y lo que se deriva en vez de guardarse');
ok(Array.isArray(inf.integraciones) && Array.isArray(inf.pendiente) && Array.isArray(inf.deudaTecnica),
  '⚠️ con las integraciones, lo pendiente y la deuda');
/* 🚨 Y se pone en PENDIENTE de verdad si algo falla. */
eq(informeFinal({ vista: '' }, HOY).estado, 'PENDIENTE',
  '🚨 con una pantalla vacía el informe dice PENDIENTE: no es una etiqueta escrita a mano');

console.log('\n── 11. 🚨 El criterio de finalización se CALCULA (apartado 24) ──');
const cond = condicionNU8({ vista: VISTA }, HOY);
eq(cond.length, 18, 'los dieciocho puntos del criterio');
const rojos = cond.filter((c) => !c.ok);
ok(rojos.length === 0, `🚨 y ninguno rojo${rojos.length ? `: ${rojos.map((r) => r.texto).join(', ')}` : ''}`);
ok(condicionNU8({ vista: '' }, HOY).some((c) => !c.ok),
  '🚨 con una pantalla vacía se pone roja: una auditoría que no puede fallar no sirve (EH F42)');
/* Apartado 22 — las cinco piezas del recorrido del usuario existen. */
ok(['ComidasTab', 'AnadirAlimento', 'ConfiguracionNutricion', 'EstadisticasNutricion', 'AnalisisNutricional'].every((c) => CODIGO_VISTA.includes(c)),
  '⚠️ y las cinco piezas del recorrido del apartado 22 están en la pantalla');

console.log('\n' + '═'.repeat(70));
if (fallos.length) {
  console.log(`✗ ${fallos.length} fallos de ${pasa + fallos.length}`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F40 (NU F8) · Cierre de Nutrición`);
