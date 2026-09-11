// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 34 (NU F2) — NUTRICIÓN: SISTEMA DE DÍAS E HISTORIAL
// ══════════════════════════════════════════════════════════════════════════
//
// 🚨 Lo primero que hay que demostrar es lo que **no** se ha construido: el
// apartado 4 dibuja un árbol `nutrition ├── 2026-08-28 …` y el 5, dos párrafos
// después, dice *"No crear una arquitectura paralela innecesaria"*. La segunda
// manda, porque la primera **ya se cumplía**: cada comida lleva su fecha.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  ARQUITECTURA_DIAS, DIAS_TIRA, diasConRegistro, tiraDeDias,
  mesDeNutricion, tituloDeMes, tituloDelDia,
  ESTADOS_DIA, estadoDia, estadoDeDia,
  resumenDelDia, comidasDelDia,
  NO_EN_NU2, AUDITORIA_NU2, condicionNU2,
} from '../src/lib/nutricion.js';
import { celdasMes } from '../src/lib/calendario.js';

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

/* 2026-09-07 es lunes. */
const HOY = '2026-09-07';
const VISTA = leer('src/views/NutritionView.jsx');
const CODIGO_VISTA = soloCodigo(VISTA);
const LIB = leer('src/lib/nutricion.js');

const comidas = [
  { id: 'a', fecha: HOY, nombre: 'Avena', calorias: 350, proteinas: 12, carbohidratos: 55, grasas: 8, momento: 'desayuno' },
  { id: 'b', fecha: '2026-09-05', nombre: 'Cena', calorias: 900, proteinas: 30, carbohidratos: 90, grasas: 20, momento: 'cena' },
  { id: 'c', fecha: '2026-09-05', nombre: 'Otra del mismo día', calorias: 100, proteinas: 2, carbohidratos: 20, grasas: 1, momento: 'extras' },
];

console.log('\n══ E3 · Fase 34 (NU F2) — el sistema de días de Nutrición ══');

console.log('\n── 1. 🚨 La arquitectura por días YA EXISTÍA (apartados 4 y 5) ──');
ok(ARQUITECTURA_DIAS.donde && ARQUITECTURA_DIAS.porque && ARQUITECTURA_DIAS.aislamiento,
  'está declarada: dónde vive, por qué, y cómo aísla un día de otro');
ok(/no crear una arquitectura paralela|arquitectura paralela/i.test(ARQUITECTURA_DIAS.porque),
  '🚨 y el motivo es el apartado 5: *"No crear una arquitectura paralela innecesaria"*');
eq(AUDITORIA_NU2.arquitecturasParalelas, 0, 'ni una arquitectura paralela');
eq(AUDITORIA_NU2.clavesNuevas, 0, 'ni una clave nueva: sigue siendo `nutricion`');
ok(!/nutricionPorDia|nutritionByDay|diasNutricion\s*=/.test(soloCodigo(LIB)),
  '🚨 y no hay ningún objeto `{ "2026-08-28": {...} }`: un día es un FILTRO, no una carpeta');
eq(ARQUITECTURA_DIAS.noSePorDia, ['agua', 'favoritos'],
  '⚠️ y se declara lo que NO es por día: el agua y los favoritos, que un árbol por fecha habría roto');
/* 🚨 El aislamiento se comprueba de verdad. */
eq(comidasDelDia(comidas, HOY).length, 1, 'el día de hoy tiene su comida');
eq(comidasDelDia(comidas, '2026-09-05').length, 2, 'y el 5, las suyas');
eq(comidasDelDia(comidas, '2026-09-06').length, 0, '🚨 y un día sin comidas no hereda las del vecino');
eq(resumenDelDia(comidas, '2026-09-05')[0].consumido, 1000,
  '🚨 EL RESUMEN RESPONDE AL DÍA ELEGIDO (apartado 8): 1000 kcal el día 5…');
eq(resumenDelDia(comidas, HOY)[0].consumido, 350, '…y 350 hoy');
eq(resumenDelDia(comidas, '2026-09-06')[0].consumido, 0, '…y cero el 6, sin reutilizar los de hoy');

console.log('\n── 2. El mini-historial (apartado 9) ────────────────────────────');
eq(DIAS_TIRA, 7, 'la tira son siete días');
const tira = tiraDeDias(comidas, HOY, { hoy: HOY });
eq(tira.length, 7, 'con sus siete');
eq(tira.at(-1).fecha, HOY, '🚨 y termina en el día SELECCIONADO, para que se vea dónde está');
eq(tira.at(-1).seleccionado, true, 'que va marcado');
eq(tira.filter((d) => d.seleccionado).length, 1, '⚠️ y solo uno');
eq(tira.map((d) => d.inicial), ['M', 'X', 'J', 'V', 'S', 'D', 'L'],
  '🚨 con la inicial de su día de la semana, y la X del miércoles');
eq(tira.map((d) => d.dia), [1, 2, 3, 4, 5, 6, 7], 'y su número');
eq(tira.filter((d) => d.conRegistros).map((d) => d.fecha), ['2026-09-05', HOY],
  '🚨 los días CON datos se distinguen de los que no (apartado 9)');
/* Al retroceder, el seleccionado sigue en la tira. */
const tiraAtras = tiraDeDias(comidas, '2026-09-05', { hoy: HOY });
eq(tiraAtras.at(-1).fecha, '2026-09-05', '⚠️ al cambiar de día la tira lo sigue');
eq(tiraAtras.filter((d) => d.hoy).length, 0, '⚠️ y si hoy queda fuera, no se marca ninguno como hoy');
eq(tiraDeDias(comidas, '2026-09-20', { hoy: HOY }).filter((d) => d.futuro).length, 7,
  '🚨 y en el futuro los siete van marcados como futuros (apartado 7)');
eq(diasConRegistro(comidas).size, 2, '`diasConRegistro` cuenta los días, no las comidas');
eq(diasConRegistro(null).size, 0, '⚠️ y con basura, ninguno');
// ⚠️ Esta comprobación miraba «todo lo que hay antes de AguaTab», así que la E3 F38 la puso roja con
// el código bien: su gráfica de evolución vive en `EstadisticasNutricion` —que es literalmente su
// apartado 13— y basta el `import … from 'recharts'` de la línea 2 para hacerla saltar. Lo que esta
// fase promete es que **la tira de días** no sea una gráfica, así que se mira la tira: el componente
// `SelectorDia`, que es quien la pinta. Un barrido que abarca más de lo que su frase promete acaba
// señalando algo que está bien (E3 F29, E3 F32, E3 F33 y ya van unas cuantas).
const COMPONENTE_TIRA = (CODIGO_VISTA.split('function SelectorDia')[1] || '').split('\nfunction ')[0];
ok(COMPONENTE_TIRA.length > 200, 'se encuentra el componente que pinta la tira de días');
ok(!/recharts|LineChart|BarChart|ResponsiveContainer|<svg/.test(COMPONENTE_TIRA),
  '⚠️ y la tira NO es una gráfica: *"No convertir esto en una gráfica compleja"*');

console.log('\n── 3. 🚨 El calendario reutiliza la cuadrícula que ya existe ─────');
const mes = mesDeNutricion(comidas, { anio: 2026, mes: 8, seleccionado: HOY, hoy: HOY });
eq(mes.length, celdasMes(2026, 8).length,
  '🚨 `mesDeNutricion` se apoya en `celdasMes`, la del Calendario Universal: ni una cuadrícula nueva');
eq(AUDITORIA_NU2.cuadriculasNuevas, 0, 'y está declarado');
ok(LIB.includes("from './calendario'"), '⚠️ y se ve en el import');
const dias = mes.filter(Boolean);
eq(dias.length, 30, 'septiembre tiene 30 días');
eq(dias.filter((c) => c.hoy).length, 1, '🚨 uno es HOY (apartado 10)');
eq(dias.filter((c) => c.seleccionado).length, 1, 'uno es el seleccionado');
eq(dias.filter((c) => c.conRegistros).map((c) => c.fecha), ['2026-09-05', HOY],
  '🚨 y los que tienen registros se distinguen de los que no');
eq(dias.filter((c) => c.futuro).length, 23, '⚠️ y los futuros van aparte (apartado 7)');
eq(mesDeNutricion(comidas, { anio: 2026, mes: 7, seleccionado: HOY, hoy: HOY }).filter(Boolean).filter((c) => c.seleccionado).length, 0,
  '⚠️ y en otro mes no hay ninguno seleccionado');
eq(tituloDeMes(2026, 8), 'Septiembre de 2026', 'el título del mes, con mayúscula');
ok(CODIGO_VISTA.includes('mesDeNutricion') && CODIGO_VISTA.includes('CalendarioNutricion'),
  '⚠️ y la pantalla lo usa');
ok(!/fixed inset-0/.test(CODIGO_VISTA.split('AguaTab')[0] || ''),
  '⚠️ y es un panel que se despliega, no una pantalla gigante (apartado 10)');

console.log('\n── 4. El título del día (apartados 2 y 8) ───────────────────────');
eq(tituloDelDia(HOY, HOY), 'HOY · 7 SEPT', '🚨 *"HOY · 29 AGO"*, el formato del apartado 8');
eq(tituloDelDia('2026-09-06', HOY), 'AYER · 6 SEPT', 'y ayer');
eq(tituloDelDia('2026-09-08', HOY), 'MAÑANA · 8 SEPT', 'y mañana');
ok(!/·/.test(tituloDelDia('2026-09-01', HOY)),
  '⚠️ y más atrás no se repite la fecha dos veces: «1 SEPT», no «1 SEPT · 1 SEPT»');
ok(/useState\(hoy\)/.test(CODIGO_VISTA),
  '🚨 Y NUTRICIÓN ABRE SIEMPRE EN HOY (apartado 2): el día que miraba no se guarda, es de la pantalla (EH F40)');

console.log('\n── 5. Días vacíos y días futuros (apartados 6 y 7) ──────────────');
eq(ESTADOS_DIA.map((e) => e.id), ['con_datos', 'vacio', 'futuro'], 'tres estados de un día');
eq(estadoDeDia(comidas, HOY, HOY).id, 'con_datos', 'hoy tiene datos');
eq(estadoDeDia(comidas, '2026-09-06', HOY).id, 'vacio', 'el 6 está vacío');
eq(estadoDeDia(comidas, '2026-09-20', HOY).id, 'futuro',
  '🚨 y el 20 es FUTURO, que no es lo mismo que vacío: no es que no registrara nada, es que no ha llegado');
ok(!/error/i.test(estadoDia('vacio').texto) && !/error/i.test(estadoDia('futuro').texto),
  '🚨 y ninguno suena a error (apartado 6)');
ok(estadoDia('vacio').texto !== estadoDia('futuro').texto, '⚠️ y dicen cosas distintas');
eq(estadoDia('no-existe'), null, '⚠️ un estado que no existe es `null`');
ok(CODIGO_VISTA.includes('estadoDeDia') && VISTA.includes("estado.id === 'futuro'"),
  '⚠️ y la pantalla los distingue');
eq(AUDITORIA_NU2.datosInventados, 0, '🚨 y no se inventa ningún consumo (apartados 6 y 7)');

console.log('\n── 6. La navegación (apartados 1, 3, 11 y 12) ───────────────────');
ok(/aria-label="Día anterior"/.test(VISTA) && /aria-label="Día siguiente"/.test(VISTA),
  'las dos flechas, con su nombre para el lector de pantalla');
ok(/aria-label={calendarioAbierto \? /.test(VISTA) || /Elegir una fecha/.test(VISTA),
  '⚠️ y el acceso al calendario');
ok(VISTA.includes('Volver a hoy'), '⚠️ con la vuelta a HOY de un toque (apartado 12)');
ok(/key={fecha}/.test(VISTA),
  '🚨 y al cambiar de día se repite la cascada de entrada: transición suave, sin recargar nada (apartado 11)');
ok(!/window\.location|location\.reload/.test(CODIGO_VISTA),
  '⚠️ y ni una recarga de página');
ok(/aria-current={.*\? 'date'/.test(VISTA),
  '⚠️ y el día elegido se anuncia como tal, no solo con un color (EH F42)');

console.log('\n── 7. 🚨 Lo que la Fase 2 NO hace (apartado 14) ──────────────────');
ok(NO_EN_NU2.length >= 6 && NO_EN_NU2.every((x) => x.que && x.porque), 'seis cosas declaradas con su motivo');
ok(NO_EN_NU2.some((x) => /TDEE/.test(x.que)), '⚠️ el TDEE, que además choca con la regla 7');
ok(NO_EN_NU2.some((x) => /base de alimentos/i.test(x.que) && x.fase === 'NU F5'), '⚠️ la base de alimentos');
ok(NO_EN_NU2.some((x) => /gráficas/i.test(x.que) && x.fase === 'NU F6'), '⚠️ y las gráficas estadísticas');
/* 🚨 Y la que hay que decir al revés. */
ok(NO_EN_NU2.some((x) => /Quitar el escáner/i.test(x.que)),
  '🚨 el apartado 14 dice "no implementar" el escáner, pero YA EXISTÍA: quitarlo rompería un apartado que funciona');
ok(VISTA.includes('BarcodeScanner'), '⚠️ así que sigue ahí');
ok(!/tdee|TDEE/.test(soloCodigo(LIB)), '⚠️ y no hay ni un cálculo de TDEE en la librería');

console.log('\n── 8. 🚨 La condición de finalización se CALCULA (apartado 15) ───');
const cond = condicionNU2({ vista: VISTA });
eq(cond.length, 15, 'los quince puntos del criterio');
eq(cond.filter((c) => !c.ok).map((c) => c.id), [], '🚨 y ninguno rojo — se calculan sobre datos de verdad');
const rota = condicionNU2({ vista: 'export default function Nada() { return null; }' });
ok(rota.filter((c) => !c.ok).length >= 5,
  '🚨 con una pantalla vacía se pone roja: una auditoría que no puede fallar no sirve (EH F42)');

console.log('\n══════════════════════════════════════════════════════════════════════');
if (fallos.length) {
  console.log(`✗ ${fallos.length} comprobación(es) fallida(s):`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F34 (NU F2) · El sistema de días`);
