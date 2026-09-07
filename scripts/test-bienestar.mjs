// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 30 (BN) — REDISEÑO Y REORGANIZACIÓN DEL APARTADO «BIENESTAR»
// ══════════════════════════════════════════════════════════════════════════
//
// Lo que hay que demostrar en esta fase no es que algo NUEVO funcione: es que
// **no se ha perdido nada** y que el nombre ya no se repite. Así que casi todas
// las comprobaciones leen el código de verdad —`HealthView.jsx`, `App.jsx`,
// `DashboardView.jsx`— en vez de preguntarle a un catálogo si se porta bien.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  NOMBRE_APARTADO, NOMBRE_MODULO, SUBTITULO_MODULO,
  RENOMBRADO, NO_SE_RENOMBRA,
  SECCIONES_BIENESTAR, seccionBN, aperturaInicialBN,
  LO_QUE_SE_CONSERVA, LESIONES, TIPO_LESION,
  ultimaMedida, diasDesde, imcDe, estadoActual, DIAS_SIN_REGISTRAR_AVISO, avisoDeRegistro,
  MAX_PUNTOS_EVOLUCION, evolucionPeso, resumenDeMedida,
  FILTRO_TODOS, filtrosDeHistorial, filtrarHistorial, ordenarHistorial, lesionesDe,
  resumenDeSeccion, NO_EN_BN, AUDITORIA_BN, condicionBN,
} from '../src/lib/salud.js';
import { TIPOS_HISTORIAL_MEDICO } from '../src/tokens.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(raiz, p), 'utf8');

const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/.*$/gm, ' ')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

/* ⚠️ Para buscar TEXTOS que ve Josué hace falta lo contrario: quitar los
   comentarios (donde esta fase escribe «Salud» un montón de veces explicando
   qué dejó de llamarse así) y **conservar las cadenas**. Es la lección de
   EH F48: `soloCodigo` para el mecanismo, esto para lo que se lee. */
const sinComentarios = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/.*$/gm, ' ');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa += 1; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-09-07';
const VISTA = leer('src/views/HealthView.jsx');
const VISTA_TEXTO = sinComentarios(VISTA);
const VISTA_CODIGO = soloCodigo(VISTA);
const APP = leer('src/App.jsx');
const APP_CODIGO = soloCodigo(APP);
const HOY_VIEW = leer('src/views/DashboardView.jsx');
const LIB = leer('src/lib/salud.js');

const salud = {
  medidas: [
    { id: 'm1', fecha: '2026-09-01', peso: 70 },
    { id: 'm2', fecha: '2026-09-05', peso: 71.5, grasaCorporal: 14, frecuenciaCardiaca: 58 },
  ],
  historial: [
    { id: 'h1', fecha: '2026-09-03', tipo: 'Lesión', descripcion: 'esguince de tobillo' },
    { id: 'h2', fecha: '2026-08-01', tipo: 'Vacuna', descripcion: 'gripe' },
    { id: 'h3', fecha: '2026-09-06', tipo: 'Lesión', descripcion: 'sobrecarga en el gemelo' },
  ],
};
const perfil = { peso: 72, altura: 187, lesiones: [{ id: 'l1', zona: 'Tobillo derecho', estado: 'Recuperada', fecha: '2026-05-02' }] };
const fotos = [{ id: 'f1', fecha: '2026-09-02', path: 'x/1.jpg' }];
const VACIO = { medidas: [], historial: [] };

console.log('\n══ E3 · Fase 30 (BN) — el apartado Bienestar ══');

console.log('\n── 1. 🚨 Los nombres: apartados 2 y 3 ──────────────────────────');
eq(NOMBRE_APARTADO, 'Bienestar', '*"SALUD → BIENESTAR"* (apartado 2)');
ok(NOMBRE_MODULO !== 'Salud', '🚨 y el módulo de dentro NO se llama «Salud»: es la redundancia que prohíbe el apartado 3');
eq(NOMBRE_MODULO, 'Mi salud', 'se llama «Mi salud»');
ok(APP_CODIGO.includes("label: ''") === false || APP.includes("label: 'Bienestar'"),
  '🚨 el área de la barra inferior dice «Bienestar» en `App.jsx`');
ok(APP.includes("{ id: 'area-salud', label: 'Bienestar'"),
  '⚠️ y con su id intacto: `area-salud` lo guarda la personalización de la Fase 19 (apartado 2)');
ok(APP.includes("{ id: 'salud', label: 'Mi salud'"),
  '🚨 y la tarjeta del módulo dice «Mi salud», con el id `salud` sin tocar');
ok(/Inicio/.test(APP) && APP.includes("label: 'Vida'") && APP.includes("label: 'Gestión'"),
  '⚠️ la navegación queda Inicio · Bienestar · Vida · Gestión');

/* 🚨 El choque de nombres que el enunciado no podía prever. */
ok(APP.includes("{ id: 'bienestar', label: 'Bienestar digital'"),
  '🚨 y el módulo del tiempo de pantalla pasa a «Bienestar digital»: con el área llamada Bienestar había DOS');
ok(leer('src/views/WellbeingView.jsx').includes('Bienestar digital'),
  '⚠️ que es como su propia pantalla se llamaba ya: lo que estaba corto era la etiqueta del menú');
ok(APP.includes("id: 'bienestar'"), '⚠️ y su id tampoco se toca: es su clave guardada');

/* La tabla de renombrados tiene que ser verdad, no una lista bonita. */
ok(RENOMBRADO.length >= 5 && RENOMBRADO.every((r) => r.donde && r.archivo && r.antes && r.ahora),
  'una línea por sitio donde Josué ve el nombre, con el antes y el ahora');
ok(RENOMBRADO.every((r) => leer(r.archivo).includes(r.ahora)),
  '🚨 y cada «ahora» está DE VERDAD en su archivo: una tabla que solo se cuenta a sí misma no demuestra nada');
ok(NO_SE_RENOMBRA.length === 4 && NO_SE_RENOMBRA.every((n) => n.que && n.porque),
  '⚠️ y lo que NO se renombra lleva su motivo (apartado 2: no tocar variables ni estructuras)');

console.log('\n── 2. 🚨 La redundancia «Salud → Salud» ha desaparecido ─────────');
ok(!/>\s*Salud\s*</.test(VISTA_TEXTO),
  '🚨 la pantalla ya no pinta «Salud» a secas en ningún sitio');
ok(VISTA_TEXTO.includes('{NOMBRE_MODULO}'),
  '⚠️ y el título sale de la constante, no escrito a mano: renombrar en un sitio lo cambia en todos');
ok(!/titulo="Salud"/.test(HOY_VIEW), '🚨 la tarjeta de Hoy tampoco dice «Salud»');
ok(/titulo="Mi salud"/.test(HOY_VIEW), '⚠️ dice «Mi salud»');
ok(SUBTITULO_MODULO.length > 0 && !/^Salud/.test(SUBTITULO_MODULO), '⚠️ y el subtítulo no vuelve a empezar por «Salud»');

console.log('\n── 3. 🚨 No se ha perdido ni una función (apartados 5 y 9) ──────');
eq(LO_QUE_SE_CONSERVA.length, 8, 'ocho funciones declaradas como conservadas');
for (const l of LO_QUE_SE_CONSERVA) {
  ok(VISTA.includes(l.prop), `🚨 «${l.que}» sigue en la pantalla (\`${l.prop}\`)`);
}
ok(VISTA.includes('onAddMedida') && VISTA.includes('onAddHistorial') && VISTA.includes('onAddFoto'),
  '⚠️ las tres formas de CREAR siguen ahí');
ok(VISTA.includes('BotonBorrar') && VISTA.includes('BotonBorrarDefinitivo'),
  '⚠️ y las de BORRAR: la papelera para lo que vuelve, la confirmación para la foto que se va de Storage');
ok(VISTA.includes('PinGate') && VISTA.includes('protegidoFotos'),
  '🚨 el PIN de las fotos privadas sigue en su sitio, con el mismo interruptor de Seguridad');
ok(VISTA.includes('Analizar mi salud') && VISTA.includes('AIPanel'),
  '🚨 *"Analizar mi salud"* sigue existiendo — el apartado 4 dice NO eliminarla, NO esconderla');
ok(VISTA.includes('No des objetivos de peso ni calóricos estrictos'),
  '⚠️ y con su prompt intacto: la IA sigue sin prescribir objetivos estrictos (regla 7)');
ok(APP.includes('perfil={perfil}') && VISTA.includes('perfil,'),
  '⚠️ `perfil` llega a la pantalla: el IMC y las lesiones relevantes salen de ahí, no de una copia');

console.log('\n── 4. Las cuatro áreas del apartado 4 ──────────────────────────');
eq(SECCIONES_BIENESTAR.map((s) => s.id), ['medidas', 'fotos', 'historial', 'analisis'],
  '📏 Medidas · 📸 Fotos · 📋 Historial · 🤖 Analizar mi salud');
ok(SECCIONES_BIENESTAR.every((s) => s.emoji && s.nombre && s.descripcion),
  '⚠️ cada una con su icono y su descripción: títulos fáciles de escanear (apartado 6)');
eq(seccionBN('historial').nombre, 'Historial', '`seccionBN` responde por id');
eq(seccionBN('no-existe'), null, '⚠️ y con un id que no existe devuelve `null`, no revienta');
eq(SECCIONES_BIENESTAR.filter((s) => s.plegable).length, 3, 'tres secciones plegables');
eq(seccionBN('analisis').plegable, false, '⚠️ y el panel de IA NO es una de ellas: vive al final, siempre visible');
/* 🚨 La lección de la E3 F26, escrita en código. */
eq(aperturaInicialBN(), ['medidas'], '🚨 Medidas nace abierta: una pantalla que nace toda plegada sale en blanco (E3 F26)');
eq(aperturaInicialBN([{ id: 'a', plegable: true, abiertaPorDefecto: false }, { id: 'b', plegable: true, abiertaPorDefecto: false }]),
  ['a'], '🚨 y si NINGUNA quisiera abrirse, se abre la primera igual');
/* ⚠️ La otra mitad del catálogo: datos aquí, componentes en la vista. */
for (const s of SECCIONES_BIENESTAR) {
  ok(new RegExp(`${s.id}:\\s*[A-Z]`).test(VISTA_CODIGO), `⚠️ «${s.nombre}» tiene su icono en \`ICONOS_SECCION\` (E3 F3: un hueco no falla en ninguna parte)`);
}

console.log('\n── 5. 🚨 Las lesiones NO son una sección (apartado 9) ───────────');
eq(LESIONES.hayseccionPropia, false, '🚨 *"NO crear una sección independiente de Lesiones"*');
ok(!SECCIONES_BIENESTAR.some((s) => /lesion/i.test(s.id) || /lesion/i.test(s.nombre)),
  '🚨 y no hay ninguna sección que se llame así');
ok(TIPOS_HISTORIAL_MEDICO.includes(TIPO_LESION),
  '⚠️ porque ya eran un tipo del historial desde la Fase 3: la estructura existente que pide el apartado');
eq(LESIONES.fuentes.map((f) => f.id), ['historial', 'perfil'],
  '🚨 y son DOS fuentes: el historial con fecha, y las lesiones relevantes del perfil (Fase A2)');
eq(LESIONES.fuentes.find((f) => f.id === 'perfil').seEditaAqui, false,
  '⚠️ la del perfil es de solo lectura aquí');
ok(/Ajustes → Perfil/.test(LESIONES.fuentes.find((f) => f.id === 'perfil').nota),
  '🚨 y dice DÓNDE se edita: una sola fuente de verdad, y el sitio escrito en la pantalla (EH F4)');
const les = lesionesDe({ salud, perfil });
eq(les.historial.length, 2, 'las dos del historial');
eq(les.perfil.length, 1, 'y la del perfil');
eq(les.total, 3, 'tres en total, sin sumar dos veces la misma');
eq(les.historial[0].id, 'h3', '⚠️ y ordenadas de la más reciente a la más vieja');
eq(lesionesDe({}).hay, false, 'sin nada, `hay: false`');
/* 🚨 Ni una copia: la del perfil se enseña, no se guarda aquí. */
ok(!soloCodigo(LIB).includes('salud.historial.push') && !/lesiones\s*:/.test(soloCodigo(LIB).replace(/perfil\?\.lesiones/g, '')),
  '🚨 y `salud.js` NO escribe lesiones en ningún sitio: las lee de las dos y ya');

console.log('\n── 6. El historial y sus filtros ───────────────────────────────');
eq(FILTRO_TODOS.id, 'todos', 'el filtro «Todo» existe');
eq(filtrosDeHistorial(salud.historial).map((f) => f.id), ['todos', 'Lesión', 'Vacuna'],
  '🚨 los filtros salen de los tipos USADOS, no de una lista escrita a mano');
eq(filtrosDeHistorial([]).length, 1, '⚠️ sin entradas, solo «Todo»: no se ofrecen filtros vacíos');
eq(filtrarHistorial(salud.historial, 'Lesión').length, 2, 'filtrar por Lesión da dos');
eq(filtrarHistorial(salud.historial, 'todos').length, 3, 'y «Todo» las da todas');
eq(filtrarHistorial(salud.historial).length, 3, '⚠️ sin filtro también');
eq(ordenarHistorial(salud.historial).map((e) => e.id), ['h3', 'h1', 'h2'], 'la más reciente primero');
ok(VISTA_CODIGO.includes('filtroValido'),
  '🚨 y si el filtro puesto deja de existir se vuelve a «Todo»: un filtro huérfano no puede dejar la lista vacía para siempre (E3 F24)');

console.log('\n── 7. Todo derivado: aquí no se guarda nada ────────────────────');
eq(AUDITORIA_BN.tablasNuevas, 0, 'ni una tabla nueva en Supabase (apartado 5)');
eq(AUDITORIA_BN.clavesNuevas, 0, 'ni una clave nueva en `app_data`');
eq(AUDITORIA_BN.camposNuevos, 0, 'ni un campo nuevo en una entidad');
eq(AUDITORIA_BN.funcionesEliminadas, 0, '🚨 y ni una función eliminada (apartado 5)');
ok(!soloCodigo(LIB).includes('saveData') && !soloCodigo(LIB).includes('supabase'),
  '🚨 `salud.js` no escribe: no llama a `saveData` ni toca Supabase');
ok(!/export function normalizar/.test(LIB),
  '⚠️ y no tiene normalizador, porque no tiene almacén propio');
eq(ultimaMedida(salud.medidas).id, 'm2', 'la última medida es la de la fecha más alta');
eq(ultimaMedida([]), null, '⚠️ sin medidas, `null`');
eq(ultimaMedida(undefined), null, '⚠️ y con basura tampoco revienta');
eq(diasDesde('2026-09-05', HOY), 2, 'los días se cuentan en local');
eq(diasDesde(null, HOY), null, '⚠️ sin fecha, `null`');

console.log('\n── 8. 🚨 El IMC: una sola fórmula, y `null` cuando no se puede ──');
ok(Math.abs(imcDe(72, 187) - 20.5897) < 0.001, 'el IMC de 72 kg y 187 cm');
eq(imcDe(72, 0), null, '🚨 sin altura devuelve `null`, NO `Infinity` — que se pintaría tal cual en la pantalla');
eq(imcDe(null, 187), null, '⚠️ y sin peso tampoco se inventa');
eq(imcDe(72, undefined), null, '⚠️ ni con la altura sin poner');
ok(HOY_VIEW.includes("from '../lib/salud'") && /imcDe\(pesoActual/.test(HOY_VIEW),
  '🚨 y Hoy usa ESA función: la fórmula estaba escrita a mano en dos pantallas');
ok(!/pesoActual \/ \(alturaM \* alturaM\)/.test(HOY_VIEW),
  '⚠️ la copia de Hoy ha desaparecido de verdad');

console.log('\n── 9. El estado de un vistazo ──────────────────────────────────');
const est = estadoActual({ salud, perfil, hoy: HOY });
eq(est.peso, 71.5, 'el peso es el de la última medida');
eq(est.desdeElPerfil, false, 'y no viene del perfil');
eq(est.dias, 2, 'con los días que hace');
const estSinMedidas = estadoActual({ salud: VACIO, perfil, hoy: HOY });
eq(estSinMedidas.peso, 72, '⚠️ sin medidas cae al peso del perfil, que es lo que ya hacía Hoy');
eq(estSinMedidas.desdeElPerfil, true, '🚨 y lo DICE: un número prestado no se presenta como tuyo');
eq(estadoActual({ salud: VACIO, perfil: {}, hoy: HOY }).vacio, true, 'sin nada de nada, vacío');
eq(estadoActual({}).vacio, true, '⚠️ y sin argumentos tampoco revienta');
eq(DIAS_SIN_REGISTRAR_AVISO, 7, 'el umbral del aviso, escrito una vez');
eq(avisoDeRegistro({ salud, hoy: HOY }).avisa, false, 'con dos días no avisa');
eq(avisoDeRegistro({ salud, hoy: '2026-09-20' }).avisa, true, 'con quince sí');
ok(/15 días/.test(avisoDeRegistro({ salud, hoy: '2026-09-20' }).texto), '⚠️ y dice cuántos');
eq(avisoDeRegistro({ salud: VACIO }).dias, null, '⚠️ sin ninguna medida no hay «hace N días» que decir');

console.log('\n── 10. La evolución y el resumen de una medida ─────────────────');
eq(MAX_PUNTOS_EVOLUCION, 10, 'la gráfica enseña los diez últimos, como siempre');
eq(evolucionPeso(salud.medidas).length, 2, 'dos puntos con peso');
eq(evolucionPeso(salud.medidas)[0].peso, 70, '⚠️ y ordenados del más viejo al más nuevo');
eq(evolucionPeso([{ id: 'x', fecha: HOY }]).length, 0,
  '🚨 una medida SIN peso no entra en la gráfica del peso: no se rellena un dato que no registró (E3 F13)');
eq(evolucionPeso(null).length, 0, '⚠️ y con basura, lista vacía');
eq(resumenDeMedida(salud.medidas[1]), '71.5 kg · 14% grasa · 58 ppm', 'los valores en una línea, sin huecos');
eq(resumenDeMedida({ id: 'x', fecha: HOY }), 'Sin valores numéricos', '⚠️ y una medida solo con notas lo dice');
eq(resumenDeMedida(null), null, '⚠️ sin medida, `null`');

console.log('\n── 11. ⚠️ Nunca un cero (E3 F23) ───────────────────────────────');
/* 🐛 Esta línea estaba escrita comparando el resultado CONSIGO MISMO, que es el
   fallo de la E3 F28: una comprobación así no puede ponerse roja jamás. Con
   `hoy` fijo se puede escribir el texto esperado entero. */
eq(resumenDeSeccion('medidas', { salud, hoy: HOY }).texto, '2 registros · hace 2 días',
  'Medidas dice cuántos registros hay y cuándo fue el último');
eq(resumenDeSeccion('medidas', { salud, hoy: '2026-09-05' }).texto, '2 registros · hoy',
  '⚠️ y el mismo día dice «hoy», no «hace 0 días»');
eq(resumenDeSeccion('medidas', { salud, hoy: '2026-09-06' }).texto, '2 registros · hace 1 día',
  '⚠️ con un día, en singular');
eq(resumenDeSeccion('medidas', { salud: VACIO }).vacio, true, 'y sin ninguno, vacío');
ok(!/\b0\b/.test(resumenDeSeccion('medidas', { salud: VACIO }).texto),
  '🚨 sin decir «0 medidas»: una sección vacía dice qué se hace ahí, no un cero');
eq(resumenDeSeccion('fotos', { fotos }).texto, '1 foto', '⚠️ y en singular cuando es una');
ok(!/\b0\b/.test(resumenDeSeccion('fotos', { fotos: [] }).texto), '⚠️ Fotos tampoco enseña un cero');
eq(resumenDeSeccion('historial', { salud, perfil }).texto, '3 entradas · 1 lesión en tu perfil',
  '🚨 el Historial cuenta sus entradas y, APARTE, las lesiones del perfil (E3 F22: mirar de cuántas listas sale)');
ok(!/3 lesiones/.test(resumenDeSeccion('historial', { salud, perfil }).texto),
  '🚨 y NO las suma: las dos del historial ya están dentro de «3 entradas» — sumarlas diría que hay seis cosas');
eq(resumenDeSeccion('historial', { salud, perfil: {} }).texto, '3 entradas',
  '⚠️ sin lesiones en el perfil no se menciona el perfil');
eq(resumenDeSeccion('historial', { salud: VACIO, perfil: {} }).vacio, true, 'y vacío cuando no hay nada');
eq(resumenDeSeccion('analisis', { salud }), null, '⚠️ el panel de IA no tiene resumen: no es una sección plegable');

console.log('\n── 12. Lo que esta fase NO hace (apartado 9) ───────────────────');
ok(NO_EN_BN.length >= 6 && NO_EN_BN.every((n) => n.que && n.porque), 'seis cosas declaradas con su motivo');
ok(NO_EN_BN.some((n) => /Lesiones/.test(n.que)), '⚠️ empezando por la sección de Lesiones');
ok(NO_EN_BN.some((n) => /Supabase/.test(n.que)) && NO_EN_BN.some((n) => /autenticaci/i.test(n.que)),
  '⚠️ ni Supabase ni la autenticación');
/* 🚨 Y el apartado 9 se comprueba en el código, no en la lista. */
ok(!/supabase\/schema\.sql/.test(soloCodigo(LIB)), '🚨 esta fase no toca el esquema');
ok(!VISTA_CODIGO.includes('createClient'), '⚠️ ni la pantalla habla con Supabase por su cuenta');

console.log('\n── 13. 🚨 La condición de finalización se CALCULA ───────────────');
const cond = condicionBN({ salud, fotos, perfil, vista: VISTA });
eq(cond.length, 12, 'las doce comprobaciones del apartado 11');
const rojas = cond.filter((c) => !c.ok);
eq(rojas.map((c) => c.id), [12], '🚨 y solo queda roja la que necesita un iPhone y unos ojos');
ok(rojas.every((c) => c.manual === true && c.quien && c.porque),
  '⚠️ que va marcada como manual, con quién decide y por qué (nunca verde a mano)');
/* ⚠️ Una condición que no puede ponerse roja no comprueba nada (EH F42). */
const condRota = condicionBN({ salud, fotos, perfil, vista: 'export default function Nada() { return null; }' });
ok(condRota.filter((c) => !c.ok).length > 5,
  '🚨 y con una pantalla vacía se pone roja de verdad: una auditoría que no puede fallar no sirve');

console.log('\n══════════════════════════════════════════════════════════════════════');
if (fallos.length) {
  console.log(`✗ ${fallos.length} comprobación(es) fallida(s):`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F30 (BN) · El apartado Bienestar`);
