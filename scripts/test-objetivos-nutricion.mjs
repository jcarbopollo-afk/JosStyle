// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 35 (NU F3) — CONFIGURACIÓN Y OBJETIVOS NUTRICIONALES
// ══════════════════════════════════════════════════════════════════════════
//
// 🔒 Esta fase toca la única regla con candado de todo el proyecto: *"ni Salud ni
// Nutrición pueden **prescribir** objetivos calóricos o de peso **estrictos**"*.
// Así que buena parte de estas comprobaciones no miran que el cálculo salga:
// miran que **la app proponga y él decida**, que todo sea editable y que nada se
// escriba sin confirmar. Está anotado como C-30 en `docs/03`.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  DATOS_DEL_PERFIL, SEXO_BMR, sexoDesdePerfil,
  NIVELES_ACTIVIDAD, nivelActividad, OBJETIVOS_NUTRICION, objetivoNut,
  KCAL_POR_GRAMO, PROTEINA_POR_KG, FRACCION_GRASAS,
  calcularBMR, calcularTDEE, calcularObjetivos, kcalDeMacros, coherencia,
  MARGEN_COHERENCIA, PASOS_CONFIG, pasoConfig, RANGOS, validar, validarDatos,
  DEFAULT_OBJETIVOS_NUT, normalizarObjetivosNut, normalizarNutricionObjetivos,
  planObjetivos, editarObjetivo, recalcular,
  objetivosParaResumen, DIFERENCIA_PESO_AVISO, avisoDePeso,
  CTA_SIN_CONFIGURAR, AVISO_ORIENTATIVO, NO_EN_NU3, AUDITORIA_NU3, condicionNU3,
} from '../src/lib/objetivosNutricion.js';
import { ACTIVIDAD_FACTORES } from '../src/tokens.js';
import { resumenDelDia } from '../src/lib/nutricion.js';

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
const LIB = leer('src/lib/objetivosNutricion.js');
const CODIGO = soloCodigo(LIB);

const DATOS = { sexo: 'masculino', edad: 16, altura: 187, peso: 72, actividad: 'moderado', objetivo: 'ganar' };
const PERFIL = { sexo: 'Masculino', fechaNacimiento: '2010-07-29', altura: 187, peso: 72, actividad: 'moderado' };

console.log('\n══ E3 · Fase 35 (NU F3) — los objetivos nutricionales ══');

console.log('\n── 1. 🔒 La app PROPONE, él decide (regla 12 + C-30) ────────────');
const sinConfirmar = planObjetivos({ datos: DATOS, hoy: HOY });
eq(sinConfirmar.escribe, false, '🚨 sin `confirmado` NO escribe — decimonoveno `aplicarPlan` del proyecto');
eq(sinConfirmar.objetivos, null, '🚨 y no devuelve nada que guardar');
ok(sinConfirmar.ok && sinConfirmar.calculado, '⚠️ pero sí calcula, para poder enseñárselo antes (apartado 8)');
const conConfirmar = planObjetivos({ datos: DATOS, hoy: HOY, confirmado: true });
eq(conConfirmar.escribe, true, 'con `confirmado`, sí');
ok(conConfirmar.objetivos && conConfirmar.objetivos.configurado === true, 'y devuelve la configuración');
eq(AUDITORIA_NU3.escrituraSinConfirmar, 0, 'ni una escritura sin confirmar');
/* 🔒 Y lo que la regla 12 prohíbe de verdad. */
eq(AUDITORIA_NU3.objetivosDePeso, 0, '🔒 NI UN OBJETIVO DE PESO: la regla 12 lo prohíbe, y el enunciado tampoco lo pide');
ok(!('pesoObjetivo' in DEFAULT_OBJETIVOS_NUT) && !('plazo' in DEFAULT_OBJETIVOS_NUT),
  '🔒 y no hay ni campo de peso objetivo ni de plazo en lo que se guarda');
ok(/orientativ/i.test(AVISO_ORIENTATIVO) && /16 años/.test(AVISO_ORIENTATIVO),
  '🔒 todo se presenta como ORIENTATIVO, con la misma honestidad que ya usa Ajustes');
ok(/puedes cambiar/i.test(AVISO_ORIENTATIVO), '🔒 y diciéndole que puede cambiar los cuatro números');
ok(VISTA.includes('AVISO_ORIENTATIVO'), '⚠️ y la pantalla lo enseña');
ok(!/deberías|tienes que|obligator/i.test(AVISO_ORIENTATIVO + CTA_SIN_CONFIGURAR.detalle),
  '⚠️ y ni un «deberías»: se propone, no se manda');

console.log('\n── 2. Los datos salen del perfil (apartados 2 y 15) ─────────────');
eq(DATOS_DEL_PERFIL.map((d) => d.id), ['sexo', 'edad', 'altura', 'peso'], 'los cuatro que pide el apartado 2');
ok(DATOS_DEL_PERFIL.every((d) => d.campo), '🚨 cada uno declara DE QUÉ CAMPO del perfil sale');
eq(DATOS_DEL_PERFIL.find((d) => d.id === 'edad').derivado, true, '⚠️ y la edad se deriva de la fecha de nacimiento, no se guarda');
eq(AUDITORIA_NU3.datosDuplicados, 0, '🚨 y no se duplica ninguno: *"no duplicar información innecesariamente"*');
ok(!('altura' in DEFAULT_OBJETIVOS_NUT) && !('edad' in DEFAULT_OBJETIVOS_NUT),
  '🚨 lo guardado NO lleva altura ni edad: viven en el perfil');
eq(sexoDesdePerfil(PERFIL), 'masculino', '`sexoDesdePerfil` traduce lo que guarda el perfil');
eq(sexoDesdePerfil({ sexo: 'Prefiero no decirlo' }), null,
  '🚨 y sin una respuesta que sirva devuelve `null`: NO se supone ninguno');
eq(sexoDesdePerfil({}), null, '⚠️ ni sin el campo');
ok(VISTA.includes('DATOS_DEL_PERFIL') && VISTA.includes('sexoDesdePerfil'), '⚠️ y la pantalla los lee de ahí');
ok(/Ajustes → Perfil/.test(VISTA), '⚠️ diciendo dónde se cambian de verdad');

console.log('\n── 3. La actividad y el objetivo (apartados 3 y 4) ──────────────');
eq(NIVELES_ACTIVIDAD.length, 5, 'los cinco niveles del apartado 3');
ok(NIVELES_ACTIVIDAD.every((n) => n.explica && n.explica.length > 10),
  '🚨 cada uno con su explicación en cristiano: *"no utilizar una lista técnica difícil de entender"*');
/* 🚨 Y los factores no se escriben otra vez. */
eq(NIVELES_ACTIVIDAD.find((n) => n.id === 'moderado').factor, ACTIVIDAD_FACTORES.moderado,
  '🚨 los cuatro primeros factores son los de `ACTIVIDAD_FACTORES`, que ya existían en `tokens.js`');
ok(/ACTIVIDAD_FACTORES\./.test(CODIGO), '⚠️ y se leen de ahí, no copiados');
ok(NIVELES_ACTIVIDAD.every((n, i, a) => i === 0 || n.factor > a[i - 1].factor), '⚠️ y van de menos a más');
eq(OBJETIVOS_NUTRICION.map((o) => o.id), ['perder', 'mantener', 'ganar'], 'los tres objetivos del apartado 4');
ok(OBJETIVOS_NUTRICION.every((o) => o.explica), 'cada uno con su explicación');
eq(objetivoNut('mantener').ajuste, 0, 'mantener no ajusta nada');
ok(Math.abs(objetivoNut('perder').ajuste) <= 0.15 && Math.abs(objetivoNut('ganar').ajuste) <= 0.15,
  '🔒 y el déficit y el superávit son SUAVES: el enunciado los pide "controlados" y la regla 12 prohíbe lo estricto');
eq(nivelActividad('no-existe'), null, '⚠️ un nivel que no existe es `null`');
eq(objetivoNut('no-existe'), null, '⚠️ y un objetivo tampoco se inventa');

console.log('\n── 4. El cálculo: Mifflin-St Jeor (apartados 5, 6 y 7) ──────────');
eq(calcularBMR(DATOS), Math.round(10 * 72 + 6.25 * 187 - 5 * 16 + 5),
  '🚨 el BMR es Mifflin-St Jeor, la fórmula que pide el apartado 5');
eq(calcularBMR({ ...DATOS, sexo: 'femenino' }), Math.round(10 * 72 + 6.25 * 187 - 5 * 16 - 161),
  '⚠️ con su constante para cada sexo');
const calc = calcularObjetivos(DATOS);
eq(calcularTDEE(calc.bmr, 'moderado'), Math.round(calc.bmr * ACTIVIDAD_FACTORES.moderado),
  '🚨 el TDEE aplica el factor de actividad');
ok(calc.kcal > calc.tdee, '🚨 y «ganar masa» sube respecto al TDEE…');
ok(calcularObjetivos({ ...DATOS, objetivo: 'perder' }).kcal < calc.tdee, '…«perder grasa» baja…');
eq(calcularObjetivos({ ...DATOS, objetivo: 'mantener' }).kcal, calc.tdee, '…y «mantener» lo deja igual');
eq(calc.proteinas, Math.round(72 * PROTEINA_POR_KG.ganar),
  '🚨 la proteína sale del peso y del objetivo (apartado 6)');
/* 🚨 El apartado 7, con su ejemplo de lo que NO puede pasar. */
eq(coherencia(calc).cuadra, true,
  '🚨 LOS MACROS CUADRAN CON LAS KCAL: *"2.400 kcal pero unos macros que equivalgan a 2.700"* es lo que prohíbe el apartado 7');
ok(Math.abs(kcalDeMacros(calc) - calc.kcal) <= Math.max(50, calc.kcal * MARGEN_COHERENCIA),
  '⚠️ dentro del margen, porque redondear cuatro números nunca da exacto');
for (const o of ['perder', 'mantener', 'ganar']) {
  ok(coherencia(calcularObjetivos({ ...DATOS, objetivo: o })).cuadra, `⚠️ y cuadran con «${objetivoNut(o).nombre}» también`);
}
eq(KCAL_POR_GRAMO.grasas, 9, 'las grasas son 9 kcal por gramo');
ok(FRACCION_GRASAS > 0.2 && FRACCION_GRASAS < 0.4, '⚠️ y su fracción es razonable');
/* 🚨 Nunca un NaN (apartado 14). */
eq(calcularBMR({}), null, '🚨 sin datos, `null` — nunca un NaN');
eq(calcularBMR({ ...DATOS, peso: 'x' }), null, '⚠️ ni con basura');
eq(calcularBMR({ ...DATOS, peso: -5 }), null, '⚠️ ni con un peso negativo');
eq(calcularBMR({ ...DATOS, sexo: null }), null, '🚨 y sin sexo tampoco se supone uno');
eq(calcularObjetivos({ ...DATOS, actividad: null }), null, '⚠️ ni sin actividad');
eq(calcularTDEE(null, 'moderado'), null, '⚠️ y el TDEE de un BMR que no existe es `null`');

console.log('\n── 5. Las validaciones (apartado 14) ────────────────────────────');
ok(!!validar('peso', 'x'), 'un peso que no es número da error');
ok(!!validar('peso', -5), 'uno negativo también');
ok(!!validar('altura', 1870), 'y uno fuera de rango');
eq(validar('altura', 187), null, 'uno bueno no da ninguno');
ok(/entre 100 y 250/.test(validar('altura', 1870)), '🚨 y el error DICE QUÉ CORREGIR, con el rango (EH F62)');
ok(!/NaN|null|undefined|Error/.test(validar('peso', 'x')), '🚨 sin una sola palabra técnica');
const mal = validarDatos({ ...DATOS, peso: -5, actividad: null });
eq(mal.valido, false, 'unos datos malos no valen');
ok(mal.errores.peso && mal.errores.actividad, 'con un error por campo');
eq(validarDatos(DATOS).valido, true, 'y unos buenos, sí');
eq(planObjetivos({ datos: { ...DATOS, peso: -5 }, confirmado: true }).escribe, false,
  '🚨 Y UNA CONFIGURACIÓN INVÁLIDA NO SE GUARDA, ni con `confirmado`');
eq(PASOS_CONFIG.length, 4, 'el formulario son cuatro pasos, no una pantalla enorme (apartado 2)');
eq(pasoConfig('resumen').nombre, 'Resumen', '`pasoConfig` responde por id');
ok(Object.keys(RANGOS).length >= 7, 'y hay un rango por cada número que él puede escribir');

console.log('\n── 6. 🚨 Todo editable, y lo suyo manda (apartados 6 y 11) ───────');
const guardado = conConfirmar.objetivos;
const editado = editarObjetivo(guardado, 'kcal', 2600);
eq(editado.error, null, 'cambiar un número a mano vale');
eq(editado.objetivos.kcal, 2600, 'y se queda');
eq(editado.objetivos.manual.kcal, true, '🚨 con su marca de `manual`, como la mochila de HT F7');
eq(editado.objetivos.proteinas, guardado.proteinas, '⚠️ sin tocar los otros tres');
/* 🚨 Lo editado a mano no se pierde al volver a pasar por la configuración. */
const tras = planObjetivos({ datos: DATOS, actual: editado.objetivos, hoy: HOY, confirmado: true });
eq(tras.objetivos.kcal, 2600,
  '🚨 Y VOLVER A ABRIR LA CONFIGURACIÓN NO LE BORRA SU NÚMERO (apartado 11)');
eq(tras.objetivos.proteinas, guardado.proteinas, '⚠️ mientras lo que no tocó se recalcula');
eq(recalcular(editado.objetivos, DATOS, HOY).kcal, guardado.kcal,
  '⚠️ y si quiere volver a lo calculado, `recalcular` le quita la marca');
eq(editarObjetivo(guardado, 'kcal', 99).objetivos.kcal, guardado.kcal, '⚠️ un valor imposible no entra…');
ok(!!editarObjetivo(guardado, 'kcal', 99).error, '…y lo dice');
eq(editarObjetivo(guardado, 'inventado', 5).objetivos.kcal, guardado.kcal, '⚠️ y un campo que no existe no hace nada');
/* Y si al editar dejan de cuadrar, se dice — no se esconde. */
const descuadrado = editarObjetivo(guardado, 'kcal', 1500).objetivos;
eq(coherencia(descuadrado).cuadra, false, '🚨 si al editar dejan de cuadrar…');
ok(/Ajusta uno de los dos/.test(coherencia(descuadrado).texto), '…SE DICE, no se esconde (apartado 7)');
ok(VISTA.includes('coherencia') && VISTA.includes('cuadra'), '⚠️ y la pantalla lo enseña');

console.log('\n── 7. Lo guardado (apartados 9, 12 y 15) ────────────────────────');
eq(AUDITORIA_NU3.clavesNuevas, 0, '🚨 ni una clave nueva: los objetivos viven DENTRO de `nutricion`');
ok(APP.includes('normalizarNutricionObjetivos'), '⚠️ y su normalizador corre al cargar');
const n = normalizarNutricionObjetivos({ comidas: [{ id: 'c' }], agua: { x: 1 }, favoritos: [{ id: 'f' }] });
eq(n.agua.x, 1, '🚨 y devuelve el módulo ENTERO: perder `agua` la borraría (regla 5)');
eq(n.comidas.length, 1, 'con sus comidas');
eq(n.objetivos.configurado, false, 'y unos objetivos sin configurar');
eq(normalizarObjetivosNut(null).configurado, false, '⚠️ con basura, sin configurar');
eq(normalizarObjetivosNut({ kcal: 99999 }).kcal, null, '⚠️ y un número imposible guardado se limpia');
eq(normalizarObjetivosNut({ actividad: 'inventada' }).actividad, null, '⚠️ igual que una actividad que no existe');
eq(normalizarObjetivosNut({ manual: { kcal: true, inventado: true } }).manual.inventado, undefined,
  '⚠️ y las marcas de `manual` solo valen para los cuatro números que hay');
eq(guardado.pesoAlCalcular, 72, '🚨 se guarda el peso CON EL QUE SE CALCULÓ…');
ok(!('altura' in guardado) || guardado.altura === undefined, '…pero no la altura: los datos vivos son los del perfil (apartado 12)');
/* Apartado 12 — si su peso cambia, se le DICE; no se recalcula solo. */
eq(avisoDePeso({ objetivos: guardado }, PERFIL), null, 'con el mismo peso no se le dice nada');
ok(/78/.test(avisoDePeso({ objetivos: guardado }, { peso: 78 }) || ''),
  '🚨 con seis kilos más SÍ, y con los dos números');
eq(avisoDePeso({ objetivos: guardado }, { peso: 73 }), null, `⚠️ pero no por menos de ${DIFERENCIA_PESO_AVISO} kg`);
eq(avisoDePeso({ objetivos: null }, PERFIL), null, '⚠️ y sin configurar, nada');
ok(!/recalcular\s*\(/.test(CODIGO.split('avisoDePeso')[1] || ''),
  '🚨 y NO se recalcula solo: sería la app cambiándole el objetivo por la espalda (apartado 12)');

console.log('\n── 8. La integración con Nutrición (apartado 10) ────────────────');
eq(objetivosParaResumen({ objetivos: guardado }).calorias, guardado.kcal, 'los objetivos llegan con la forma que espera la NU F1');
eq(objetivosParaResumen({ objetivos: null }), null,
  '🚨 y SIN configurar devuelve `null`: Nutrición sigue enseñando lo consumido, como en la NU F1');
eq(objetivosParaResumen({}), null, '⚠️ con basura tampoco revienta');
/* 🚨 Y el resultado, de punta a punta. */
const comidas = [{ id: 'c', fecha: HOY, calorias: 1850, proteinas: 92, carbohidratos: 210, grasas: 48 }];
const conObj = resumenDelDia(comidas, HOY, objetivosParaResumen({ objetivos: guardado }));
eq(conObj[0].texto, `1850 / ${guardado.kcal} kcal`,
  '🚨 «1.850 / 2.400 kcal»: consumo a la izquierda, objetivo a la derecha (apartado 10)');
ok(conObj[0].porcentaje !== null, 'con su porcentaje');
const sinObj = resumenDelDia(comidas, HOY, objetivosParaResumen({ objetivos: null }));
eq(sinObj[0].texto, '1850 kcal', '⚠️ y sin objetivos, lo consumido a secas');
eq(sinObj[0].porcentaje, null, '⚠️ sin porcentaje');
ok(CODIGO_VISTA.includes('objetivosParaResumen') && CODIGO_VISTA.includes('resumenDelDia(comidas, fecha, objetivos)'),
  '⚠️ y la pantalla los enchufa ahí');
ok(VISTA.includes('CTA_SIN_CONFIGURAR'), '⚠️ con su CTA cuando todavía no los tiene (apartado 1)');
ok(/Configurar nutrición/.test(VISTA), '⚠️ y el acceso para volver a cambiarlos (apartado 11)');

console.log('\n── 9. Lo que esta fase NO hace (apartado 16) ────────────────────');
ok(NO_EN_NU3.length >= 6 && NO_EN_NU3.every((x) => x.que && x.porque), 'seis cosas declaradas con su motivo');
ok(NO_EN_NU3.some((x) => /objetivo de peso/i.test(x.que) && /regla 12/.test(x.porque)),
  '🔒 empezando por el objetivo de peso, con la regla que lo prohíbe');
ok(NO_EN_NU3.some((x) => /registro de alimentos/i.test(x.que) && x.fase === 'NU F4'), '⚠️ el registro de alimentos');
ok(NO_EN_NU3.some((x) => /estadísticas/i.test(x.que) && x.fase === 'NU F6'), '⚠️ las estadísticas');
ok(NO_EN_NU3.some((x) => /IA nutricional/i.test(x.que) && x.fase === 'NU F7'), '⚠️ y la IA nutricional');
ok(!/askAI|buildPrompt/.test(CODIGO), '⚠️ y no se llama a la IA desde aquí');

console.log('\n── 10. 🚨 La condición de finalización se CALCULA (apartado 17) ──');
const cond = condicionNU3({ vista: VISTA });
eq(cond.length, 16, 'los dieciséis puntos del criterio');
eq(cond.filter((c) => !c.ok).map((c) => c.id), [], '🚨 y ninguno rojo — cada uno ejecuta el cálculo de verdad');
const rota = condicionNU3({ vista: 'export default function Nada() { return null; }' });
ok(rota.filter((c) => !c.ok).length >= 3,
  '🚨 con una pantalla vacía se pone roja: una auditoría que no puede fallar no sirve (EH F42)');

console.log('\n══════════════════════════════════════════════════════════════════════');
if (fallos.length) {
  console.log(`✗ ${fallos.length} comprobación(es) fallida(s):`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F35 (NU F3) · Los objetivos nutricionales`);
