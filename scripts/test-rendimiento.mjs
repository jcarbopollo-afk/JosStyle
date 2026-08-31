// ============================================================================
// EH · Fase 44/65 — Rendimiento y optimización
//
// Esta fase no se construye: se MIDE. Y esto es lo que la vigila:
//   · los dieciocho apartados, cada uno con dónde se cumple
//   · los que necesitan un móvil, declarados con su motivo (R1)
//   · los tres escenarios del apartado 16, generados de verdad y medidos
//   · el revisor, con un ejemplo que sí incumple por cada regla
//   · y las dos piezas que faltaban: el debounce y la paginación
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, guardarConfig,
} from '../src/lib/estiloDeHombre.js';
import { panelPantalla } from '../src/lib/pantallaEH.js';
import { panelBuscador } from '../src/lib/buscadorEstilo.js';
import { datosPerfumes } from '../src/lib/perfumes.js';
import { datosAccesorios } from '../src/lib/accesorios.js';
import { datosGustos } from '../src/lib/gustos.js';
import {
  PRESUPUESTOS, presupuesto, medir, dentroDePresupuesto, POR_PAGINA, paginar,
  DEBOUNCE_BUSQUEDA_MS, conRetardo, APARTADOS_RENDIMIENTO, apartadoRendimiento,
  apartadosMedibles, apartadosDeJosue, ESCENARIOS_CARGA, escenarioCarga, generarEscenario,
  REGLAS_RENDIMIENTO, reglaRendimiento, revisarRendimiento, revisarTodo,
  TEXTOS_RENDIMIENTO, auditarRendimiento, panelRendimiento,
} from '../src/lib/rendimiento.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const VISTA = readFileSync(new URL('../src/views/EstiloHombreView.jsx', import.meta.url), 'utf8');
const APP = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const UI = readFileSync(new URL('../src/components/ui.jsx', import.meta.url), 'utf8');
const CSS = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

console.log('\n⚡ EH · Fase 44/65 — Rendimiento y optimización\n');

/* ---------------------------------------------------------------------------
   1 · LOS DIECIOCHO APARTADOS, CON DÓNDE SE CUMPLEN (decisión 1)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Los dieciocho apartados, declarados');
  eq(APARTADOS_RENDIMIENTO.length, 18, 'los dieciocho del enunciado, ni uno menos');
  eq(APARTADOS_RENDIMIENTO.map((a) => a.apartado), Array.from({ length: 18 }, (_, i) => i + 1),
    'y en su orden, del 1 al 18');
  const a = auditarRendimiento();
  eq(a.sinDonde, [], '⚠️ ninguno se queda sin decir DÓNDE se cumple');
  eq(a.sinMotivo, [], '⚠️ y ninguno de los que no se pueden medir se queda sin motivo');
  eq(a.modulosNuevos, 0, 'esta fase no añade ni un módulo al catálogo');
  eq([a.cachesPropios, a.almacenesPropios], [0, 0],
    '⚠️ ni un caché ni un almacenamiento propios (decisión 3)');
  ok(!!apartadoRendimiento('debounce') && !apartadoRendimiento('inventado'), 'se buscan por id');

  eq(apartadosDeJosue().map((a2) => a2.apartado), [5, 6, 10, 15, 17, 18],
    '⚠️ los seis que necesitan un móvil o que ya están centralizados');
  ok(apartadoRendimiento('datos_locales').porque.includes('localStorage'),
    '⚠️ y el apartado 6 dice por qué NO vive aquí: la F43 lo prohíbe en este bloque');
  ok(/App\.jsx/.test(apartadoRendimiento('datos_locales').donde),
    'con el sitio donde sí vive: `App.jsx` y Supabase');
  eq(apartadosMedibles().length, 12, 'y quedan doce que sí se pueden comprobar desde aquí');
}

/* ---------------------------------------------------------------------------
   2 · LOS ESCENARIOS DE CARGA (apartado 16)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Los tres usuarios del apartado 16, generados de verdad');
  eq(ESCENARIOS_CARGA.map((e) => e.id), ['pequeno', 'medio', 'grande'], 'los tres del enunciado');
  eq(escenarioCarga('pequeno').perfumes, 5, 'el pequeño, con sus cinco perfumes');
  eq(escenarioCarga('medio').accesorios, 100, 'el medio, con sus cien accesorios');
  ok(escenarioCarga('grande').registros >= 1000, '⚠️ y el grande, con mil registros: *"cientos o miles"*');
  eq(generarEscenario('inventado'), null, 'un escenario que no existe devuelve null');

  const config = generarEscenario('grande');
  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes', 'accesorios', 'gustos', 'estilo']);
  e = guardarConfig(e, 'perfumes', { perfumes: config.perfumes });
  e = guardarConfig(e, 'accesorios', { accesorios: config.accesorios });
  e = guardarConfig(e, 'gustos', { gustos: config.gustos });

  /* ⚠️ Los datos pasan por los NORMALIZADORES de cada módulo: un escenario que
     no pase por ahí no probaría nada de lo que se usa de verdad. */
  eq(datosPerfumes(e).perfumes.length, 300, '⚠️ los trescientos perfumes entran por su normalizador');
  eq(datosAccesorios(e).accesorios.length, 300, 'los trescientos accesorios, igual');
  eq(datosGustos(e).entradas.length, 300, 'y los trescientos gustos');

  // Apartados 1 y 2 — la portada no calcula todos los módulos.
  const portada = medir(() => panelPantalla(e, {}));
  const rp = dentroDePresupuesto('portada', portada.ms);
  ok(rp.ok, `⚠️ la portada con el usuario grande cabe en su presupuesto (${Math.round(portada.ms)} ms de ${rp.limite})`);

  // Apartado 8 — una búsqueda sobre todo, con el usuario grande.
  const busqueda = medir(() => panelBuscador(e, 'perfume', {}));
  const rb = dentroDePresupuesto('buscador', busqueda.ms);
  ok(rb.ok, `⚠️ una búsqueda cabe en el suyo (${Math.round(busqueda.ms)} ms de ${rb.limite})`);

  // Y el pequeño, para que se vea que la diferencia no es un abismo.
  let p = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes', 'accesorios', 'gustos', 'estilo']);
  const cp = generarEscenario('pequeno');
  p = guardarConfig(p, 'perfumes', { perfumes: cp.perfumes });
  const pequena = medir(() => panelPantalla(p, {}));
  ok(pequena.ms <= presupuesto('portada').ms,
    `y con el usuario pequeño también (${Math.round(pequena.ms)} ms)`);

  eq(medir(() => 42).resultado, 42, '`medir` devuelve lo que devuelve la función');
  ok(medir(() => 42).ms >= 0, 'y sus milisegundos');
  eq(dentroDePresupuesto('inventado', 1).ok, false, 'un presupuesto que no existe se dice');
  eq(PRESUPUESTOS.every((x) => x.ms > 0), true, 'y todos los presupuestos son un número de verdad');
}

/* ---------------------------------------------------------------------------
   3 · LA PAGINACIÓN (apartado 3)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Las listas grandes no se pintan enteras');
  const cien = Array.from({ length: 100 }, (_, i) => ({ id: i }));
  const pg = paginar(cien);
  eq(pg.items.length, POR_PAGINA, `de cien se enseñan ${POR_PAGINA}`);
  eq(pg.total, 100, 'diciendo cuántas hay en total');
  eq(pg.hayMas, true, 'y que quedan más');
  eq(pg.quedan, 80, 'cuántas quedan');
  eq(pg.siguiente, 40, 'y cuántas se enseñarían al pedir más');
  ok(/Ver \d+ más/.test(pg.verMas), 'con el texto del botón hecho');

  const todas = paginar(cien, { visibles: 100 });
  eq([todas.hayMas, todas.verMas], [false, ''],
    '⚠️ y cuando ya están todas, no queda botón que enseñar');
  eq(paginar(cien, { visibles: 500 }).items.length, 100,
    '⚠️ pedir más de las que hay no inventa ninguna');
  eq(paginar(null).items, [], 'y sin lista, no revienta');
  eq(paginar(cien, { visibles: -5 }).items.length, 0, 'ni con un número imposible');

  // Y la pantalla la usa de verdad.
  ok(/const pagina = paginar\(panel\.perfumes/.test(VISTA),
    '⚠️ la colección de perfumes la usa: con trescientos, pintaba trescientas tarjetas');
  ok(/setVisibles\(pagina\.siguiente\)/.test(VISTA), 'con su botón de "Ver más"');
  ok(/const \[visibles, setVisibles\] = useState\(POR_PAGINA\)/.test(VISTA),
    '⚠️ y cuántas se ven vive en la PANTALLA, no en lo guardado');
}

/* ---------------------------------------------------------------------------
   4 · EL DEBOUNCE (apartado 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · El buscador no lanza una consulta por tecla');
  ok(DEBOUNCE_BUSQUEDA_MS >= 150 && DEBOUNCE_BUSQUEDA_MS <= 400,
    'la espera es un cuarto de segundo, ni imperceptible ni molesta');

  let veces = 0;
  const lanzar = conRetardo(() => { veces += 1; }, 5);
  ['p', 'pe', 'per', 'perf', 'perfu'].forEach((t) => lanzar(t));
  eq(veces, 0, '⚠️ cinco pulsaciones seguidas no han lanzado NINGUNA búsqueda todavía');
  await new Promise((r) => setTimeout(r, 30));
  eq(veces, 1, '⚠️ y al parar de escribir se lanza UNA, no cinco');
  const otra = conRetardo(() => { veces += 1; }, 50);
  otra('x'); otra.cancelar();
  await new Promise((r) => setTimeout(r, 80));
  eq(veces, 1, 'y se puede cancelar, para cuando la pantalla se cierra');

  // Y la pantalla lo usa de verdad.
  ok(/const \[buscado, setBuscado\] = useState\(''\)/.test(VISTA),
    '⚠️ el buscador separa lo que se escribe de lo que se busca');
  ok(/setTimeout\(\(\) => setBuscado\(texto\), DEBOUNCE_BUSQUEDA_MS\)/.test(VISTA),
    'con el retardo de la librería, no un número escrito a mano');
  ok(/return \(\) => clearTimeout\(t\)/.test(VISTA),
    '⚠️ y limpiando el temporizador: si no, el último se dispararía con la pantalla cerrada');
  ok(/panelBuscador\(estado, buscado,/.test(VISTA),
    '⚠️ y lo que se busca es lo retrasado, no lo que se está escribiendo');
}

/* ---------------------------------------------------------------------------
   5 · EL REVISOR, Y QUE PUEDE FALLAR (decisión 5)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · El revisor caza de verdad');
  eq(auditarRendimiento().sinEjemplo, [],
    '⚠️ todas las reglas traen un ejemplo que SÍ incumple (la lección de la F42)');
  REGLAS_RENDIMIENTO.forEach((r) => {
    const problemas = revisarRendimiento('inventado.jsx', r.ejemploMalo);
    ok(problemas.some((p) => p.regla === r.id), `caza su propio ejemplo: ${r.id}`);
  });
  ok(!!reglaRendimiento('debounce_'.slice(0, 8)) === false, 'y una regla que no existe no aparece');

  /* ⚠️ Sin comentarios: un ejemplo dentro de un comentario no es código. */
  eq(revisarRendimiento('x.js', '// <img src="a" />\n/* <img src="b" /> */'), [],
    '⚠️ un ejemplo dentro de un comentario NO cuenta como incumplimiento');

  // Y ahora, sobre el código de verdad.
  const problemas = revisarTodo({
    'EstiloHombreView.jsx': VISTA,
    'App.jsx': APP,
    'ui.jsx': UI,
  });
  const deVista = problemas.filter((p) => p.archivo !== 'ui.jsx');
  eq(deVista, [], '⚠️ y el código real no incumple ninguna: ni búsquedas por tecla, ni animaciones largas, ni componentes repetidos');
  ok(/prefers-reduced-motion/.test(CSS),
    '⚠️ apartado 9 — y las animaciones siguen respetando `prefers-reduced-motion` (F42)');
}

/* ---------------------------------------------------------------------------
   6 · LO QUE YA ESTABA, Y NO SE REHACE (apartados 7, 11, 12 y 14)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Lo que ya estaba resuelto, declarado y comprobado');
  // Apartado 7 — se sincroniza por clave, no la aplicación entera.
  ok(/saveData\(/.test(APP), 'apartado 7 — `saveData` existe en App.jsx');
  ok(apartadoRendimiento('sync_eficiente').limite.includes('diff'),
    '⚠️ y su límite se dice: no hay diff por campo, se manda la clave entera');
  eq(revisarTodo({ 'App.jsx': APP }).filter((p) => p.regla === 'guardado_en_bucle'), [],
    '⚠️ y no hay ni un guardado dentro de un bucle');

  // Apartado 11 — los componentes globales, en un solo sitio.
  ['Card', 'PrimaryButton', 'Switch'].forEach((c) => {
    ok(new RegExp(`(?:function|const)\\s+${c}\\b`).test(UI), `apartado 11 — \`${c}\` vive en ui.jsx`);
  });
  eq(revisarRendimiento('EstiloHombreView.jsx', VISTA).filter((p) => p.regla === 'componente_repetido'), [],
    '⚠️ y la vista NO redefine ninguno: *"no crear 40 versiones diferentes"*');

  // Apartado 14 — nunca una pantalla congelada.
  ok(/export function CargandoEH/.test(VISTA), 'apartado 14 — `CargandoEH` existe (F41)');
  eq(TEXTOS_RENDIMIENTO.cargando, 'Cargando…', 'con el texto del enunciado');
  ok(/Muchísimas funciones por detrás/.test(TEXTOS_RENDIMIENTO.promesa),
    'y la promesa de la fase, con sus palabras');

  // El panel, para la pantalla que quiera enseñarlo.
  const panel = panelRendimiento([{ id: 'carga_necesaria', ms: 12 }]);
  eq(panel.apartados.length, 18, 'el panel trae los dieciocho');
  eq(panel.apartados.find((a) => a.id === 'carga_necesaria').medida.ms, 12, 'con lo medido, si se ha medido');
  eq(panel.pendienteDeJosue.length, 6, '⚠️ y lo que le toca mirar a Josué, en una lista aparte');
  ok(panel.pendienteDeJosue.every((x) => !!x.porque), 'cada uno con su motivo');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
