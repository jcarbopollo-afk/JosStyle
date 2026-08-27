// ============================================================================
// EH · Fase 2/65 — PRUEBAS
//
// El apartado 18 pide diez tests con nombre (A…J). Están todos, y los dos que
// no se pueden ejecutar aquí lo dicen en vez de darse por buenos:
//
//   Test E (cerrar aplicación) — se comprueba lo que SÍ es comprobable: que el
//   estado sobrevive a un viaje por JSON y por el normalizador, que es lo que
//   hace `saveData`/`loadData`. Que Supabase responda es R1.
//   Test J (móvil) — no se puede probar sin un iPhone. R1.
//
// Más los casos límite del apartado 17, que son los que de verdad rompen cosas.
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  MODULOS_EH, CATEGORIAS_EH, IDS_EH, DEFAULT_ESTILO_HOMBRE,
  normalizarEstiloHombre, configurarPrimeraVez, alternarModulo, reordenar,
  guardarConfig, modulosActivos, todosLosModulos, estadoPantalla,
  retiradosQueVuelven, restaurarRetirados,
} from '../src/lib/estiloDeHombre.js';
import {
  modulosAgrupados, modulosSinCategoria, buscarModulos, resultadosAgrupados,
  necesitaConfirmacion, moduloTieneDatos, avisoDesactivar,
  subirModulo, bajarModulo, moverA, puedeMover,
  recomendados, MAX_RECOMENDADOS, fichaModulo, TEXTOS_GESTION,
  resumenGestion, MODULOS_DEL_ENUNCIADO_NO_CREADOS,
} from '../src/lib/gestionModulos.js';

let n = 0;
let fallos = 0;
function ok(cond, msg) {
  n += 1;
  if (cond) { console.log(`  \u2713 ${msg}`); return; }
  fallos += 1;
  console.log(`  \u2717 ${msg}`);
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function eq(a, b, msg) {
  n += 1;
  if (igual(a, b)) { console.log(`  \u2713 ${msg}`); return; }
  fallos += 1;
  console.log(`  \u2717 ${msg} \u2014 esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);
}

const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare', 'pelo', 'fitness']);

/* ── 1 · AGRUPACIÓN (apartado 3) ─────────────────────────────────────────── */

ok(CATEGORIAS_EH.length === 7, 'Las siete categorías del enunciado');
eq(CATEGORIAS_EH.map((c) => c.id),
  ['estilo', 'cuidado', 'fisico', 'salud', 'bienestar', 'conocimiento', 'compras'],
  'En el orden del enunciado');
ok(CATEGORIAS_EH.every((c) => c.nombre && c.icono), 'Cada categoría con nombre e icono');

eq(modulosSinCategoria(), [], 'Ningún módulo del catálogo se queda sin categoría');

const grupos = modulosAgrupados(base());
ok(grupos.length > 0, 'Agrupa');
ok(grupos.every((g) => g.modulos.length > 0), '⚠️ Ninguna categoría vacía se devuelve');
eq(grupos.reduce((s, g) => s + g.modulos.length, 0), MODULOS_EH.length,
  'Todos los módulos salen exactamente una vez');
ok(grupos.every((g) => g.activos <= g.total), 'activos nunca supera al total');

const soloActivos = modulosAgrupados(base(), { soloActivos: true });
eq(soloActivos.reduce((s, g) => s + g.modulos.length, 0), 3, 'Filtrado a los activos');
ok(soloActivos.every((g) => g.modulos.every((m) => m.activo)), 'Y solo salen activos');

// ⚠️ Una categoría que se quede sin módulos activos NO aparece con el filtro.
ok(soloActivos.length < grupos.length, 'Con el filtro hay menos categorías, no categorías vacías');

/* ── 2 · BUSCADOR (apartado 12) ──────────────────────────────────────────── */

// El ejemplo LITERAL del enunciado: "Buscar: pelo → 💇 Pelo, 🧔 Barba".
const porPelo = buscarModulos(base(), 'pelo').map((m) => m.id);
ok(porPelo.includes('pelo'), 'Buscar "pelo" encuentra Pelo');
ok(porPelo.includes('barba'), '⚠️ …y Barba, que es el ejemplo del enunciado');
eq(porPelo[0], 'pelo', 'Pelo primero: el nombre exacto gana al sinónimo');

eq(buscarModulos(base(), '').length, MODULOS_EH.length, 'Sin texto salen todos');
eq(buscarModulos(base(), '   ').length, MODULOS_EH.length, 'Solo espacios es lo mismo que vacío');
eq(buscarModulos(base(), 'zzzz'), [], 'Sin resultados devuelve lista vacía, no todos');

// Tildes y mayúsculas: Josué escribe desde un iPhone.
ok(buscarModulos(base(), 'SKINCARE').some((m) => m.id === 'skincare'), 'Mayúsculas');
ok(buscarModulos(base(), 'habito').some((m) => m.id === 'habitos'), 'Sin tilde encuentra "Hábitos"');
ok(buscarModulos(base(), 'Educación').some((m) => m.id === 'educacion'), 'Con tilde también');
ok(buscarModulos(base(), 'sueño').some((m) => m.id === 'sueno'), 'La eñe no rompe nada');

// Buscar por categoría y por descripción corta.
ok(buscarModulos(base(), 'compras').some((m) => m.id === 'productos'), 'Encuentra por categoría');
ok(buscarModulos(base(), 'crema').some((m) => m.id === 'skincare'), 'Encuentra por sinónimo');

const agrupadosBusqueda = resultadosAgrupados(base(), 'pelo');
ok(agrupadosBusqueda.every((g) => g.modulos.length > 0), 'Los resultados agrupados no traen categorías vacías');
eq(agrupadosBusqueda.reduce((s, g) => s + g.modulos.length, 0), porPelo.length,
  'Agrupar no pierde ni añade resultados');

/* ── 3 · ACTIVAR Y DESACTIVAR (apartados 4 y 5) ──────────────────────────── */

// Test A — activar → aparece.
const conHigiene = alternarModulo(base(), 'higiene', true);
ok(modulosActivos(conHigiene).some((m) => m.id === 'higiene'), 'Test A: activar → aparece');
eq(modulosActivos(conHigiene).length, 4, 'Test A: y los otros siguen');

// Test B — desactivar → desaparece.
const sinPelo = alternarModulo(base(), 'pelo', false);
ok(!modulosActivos(sinPelo).some((m) => m.id === 'pelo'), 'Test B: desactivar → desaparece');
ok(todosLosModulos(sinPelo).some((m) => m.id === 'pelo'), 'Test B: pero sigue en la gestión');

// Test C — reactivar recupera su estado.
const conDatos = guardarConfig(base(), 'skincare', { tipoPiel: 'mixta', productos: 3 });
const apagado = alternarModulo(conDatos, 'skincare', false);
const reencendido = alternarModulo(apagado, 'skincare', true);
const cfg = normalizarEstiloHombre(reencendido).modulos.find((m) => m.id === 'skincare').config;
eq(cfg, { tipoPiel: 'mixta', productos: 3 }, '⚠️ Test C: reactivar recupera los datos intactos');
eq(Object.keys(normalizarEstiloHombre(apagado).modulos.find((m) => m.id === 'skincare').config).length, 2,
  '⚠️ Test C: y estando apagado tampoco se habían borrado');

/* ── 4 · CONFIRMACIÓN AL DESACTIVAR (apartado 6) ─────────────────────────── */

ok(necesitaConfirmacion('skincare'), 'Skincare está declarado como importante');
ok(!necesitaConfirmacion('higiene'), 'Higiene se apaga directo');
ok(!necesitaConfirmacion('inventado'), 'Un id que no existe no pide confirmación');

// ⚠️ Declarado importante, pero VACÍO: no hay nada que perder, no hay cartel.
eq(avisoDesactivar(base(), 'skincare'), null,
  '⚠️ Sin datos guardados NO se enseña un aviso que no protege nada');
eq(avisoDesactivar(base(), 'higiene'), null, 'Un módulo sencillo nunca pide confirmación');

const aviso = avisoDesactivar(conDatos, 'skincare');
ok(aviso !== null, 'Con datos SÍ se avisa');
ok(aviso.texto.includes('no se eliminarán'), 'Y el aviso dice que los datos se quedan');
ok(aviso.texto.includes('Skincare'), 'Con el nombre del módulo, no un texto genérico');
eq(aviso.confirmar, 'Desactivar', 'El botón que confirma');
eq(aviso.cancelar, 'Cancelar', 'Y el que no');

ok(moduloTieneDatos(conDatos, 'skincare'), 'Detecta los datos');
ok(!moduloTieneDatos(conDatos, 'pelo'), 'Y su ausencia');
// Una fase futura que guarde fuera de `config` dice cómo se mira.
ok(moduloTieneDatos(base(), 'pelo', () => true), 'El comprobador externo manda');
ok(avisoDesactivar(base(), 'pelo', { tieneDatos: () => true }) !== null,
  'Y entonces sí sale el aviso aunque config esté vacío');

/* ── 5 · ORDEN (apartado 9) ──────────────────────────────────────────────── */

// Test D — reordenar y que persista.
const orden0 = modulosActivos(base()).map((m) => m.id);
eq(orden0, ['skincare', 'pelo', 'fitness'], 'El orden inicial es el que eligió');

const subido = subirModulo(base(), 'fitness');
eq(modulosActivos(subido).map((m) => m.id), ['skincare', 'fitness', 'pelo'], 'Test D: subir');

const bajado = bajarModulo(base(), 'skincare');
eq(modulosActivos(bajado).map((m) => m.id), ['pelo', 'skincare', 'fitness'], 'Test D: bajar');

// ⚠️ En los bordes no pasa nada, y la interfaz puede apagar la flecha.
eq(modulosActivos(subirModulo(base(), 'skincare')).map((m) => m.id), orden0, 'Subir el primero no mueve nada');
eq(modulosActivos(bajarModulo(base(), 'fitness')).map((m) => m.id), orden0, 'Bajar el último tampoco');
eq(puedeMover(base(), 'skincare'), { arriba: false, abajo: true, posicion: 0, de: 3 }, 'El primero solo baja');
eq(puedeMover(base(), 'fitness'), { arriba: true, abajo: false, posicion: 2, de: 3 }, 'El último solo sube');
eq(puedeMover(base(), 'higiene').posicion, -1, 'Un módulo apagado no está en la lista visible');

// ⚠️ Mover salta por encima de los APAGADOS: si no, la flecha no haría nada
// visible y Josué pensaría que está rota. Aquí `higiene` queda EN MEDIO por
// orden (posición 1) pero apagada, así que subir `pelo` tiene que adelantar a
// `skincare`, no a `higiene`.
const conApagadoEnMedio = alternarModulo(
  configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare', 'higiene', 'pelo', 'fitness']), 'higiene', false);
eq(modulosActivos(conApagadoEnMedio).map((m) => m.id), ['skincare', 'pelo', 'fitness'],
  'El apagado no se ve, pero su orden sigue entre medias');
eq(modulosActivos(subirModulo(conApagadoEnMedio, 'pelo')).map((m) => m.id),
  ['pelo', 'skincare', 'fitness'], '⚠️ Subir mueve dentro de los ACTIVOS, saltándose el apagado');
eq(modulosActivos(bajarModulo(conApagadoEnMedio, 'skincare')).map((m) => m.id),
  ['pelo', 'skincare', 'fitness'], '⚠️ Y bajar igual: un paso visible, no un paso de catálogo');

// El que usará el drag & drop.
eq(modulosActivos(moverA(base(), 'fitness', 0)).map((m) => m.id), ['fitness', 'skincare', 'pelo'], 'moverA al principio');
eq(modulosActivos(moverA(base(), 'skincare', 2)).map((m) => m.id), ['pelo', 'fitness', 'skincare'], 'moverA al final');
eq(modulosActivos(moverA(base(), 'skincare', 99)).map((m) => m.id), ['pelo', 'fitness', 'skincare'], 'Un índice pasado se acota');
eq(modulosActivos(moverA(base(), 'skincare', -5)).map((m) => m.id), orden0, 'Uno negativo también, y ya estaba ahí');
eq(modulosActivos(moverA(base(), 'higiene', 0)).map((m) => m.id), orden0, 'Mover un apagado no hace nada');
eq(modulosActivos(moverA(base(), 'skincare', 0)).map((m) => m.id), orden0, 'Moverlo a donde ya está no hace nada');

// ⚠️ Reordenar NO enciende ni apaga nada.
eq(modulosActivos(moverA(base(), 'fitness', 0)).length, 3, 'Reordenar no cambia cuántos hay');
eq(todosLosModulos(moverA(base(), 'fitness', 0)).length, MODULOS_EH.length, 'Ni cuántos existen');

/* ── 6 · RECOMENDADOS (apartado 11) ──────────────────────────────────────── */

const reco = recomendados(base());
ok(reco.length <= MAX_RECOMENDADOS, 'Como mucho tres');
ok(reco.every((m) => !m.activo), '⚠️ Nunca se recomienda lo que ya está encendido');
ok(reco.some((m) => m.id === 'habitos'), 'Hábitos, que el enunciado pone de ejemplo');
ok(reco.some((m) => m.id === 'educacion'), 'Y Educación');
ok(!reco.some((m) => m.id === 'skincare'), 'Skincare no, porque ya lo tiene activo');

eq(recomendados(DEFAULT_ESTILO_HOMBRE), [], '⚠️ Sin configurar todavía no se recomienda nada');

const todoEncendido = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, IDS_EH);
eq(recomendados(todoEncendido), [], '⚠️ Con todo encendido tampoco: no hay sección vacía con título');
eq(recomendados(base(), { max: 0 }), [], 'max 0 devuelve nada');

/* ── 7 · FICHA DEL MÓDULO (apartado 13) ──────────────────────────────────── */

const ficha = fichaModulo(base(), 'skincare');
eq(ficha.nombre, 'Skincare', 'La ficha trae el nombre');
eq(ficha.estadoTexto, 'Activado', 'Y el estado, en palabras');
eq(fichaModulo(base(), 'higiene').estadoTexto, 'Desactivado', 'Y el contrario');
eq(ficha.categoria, 'Cuidado', 'Y su categoría');
ok(ficha.sub, 'Y la descripción corta');
ok(ficha.contenido === false, '⚠️ Hoy ningún módulo tiene contenido, y la ficha lo dice');
ok(ficha.avisoContenido.includes('fase 6'), '⚠️ Y dice en cuál llega, en vez de "próximamente"');
ok(ficha.confirmarAlApagar === true, 'La ficha sabe si pedirá confirmación');
eq(fichaModulo(base(), 'inventado'), null, 'Un id que no existe devuelve null, no un objeto a medias');

/* ── 8 · ESTADO VACÍO (apartado 10) ──────────────────────────────────────── */

// Test F — desactivar todos.
let vacio = base();
IDS_EH.forEach((id) => { vacio = alternarModulo(vacio, id, false); });
eq(modulosActivos(vacio).length, 0, 'Test F: no queda ninguno activo');
eq(estadoPantalla(vacio), 'sin_modulos', '⚠️ Test F: y la pantalla lo sabe, no es un caso roto');
ok(TEXTOS_GESTION.vacioTitulo.includes('vacío'), 'Con el texto del enunciado');
ok(TEXTOS_GESTION.vacioAccion.includes('Gestionar'), 'Y la salida');
eq(todosLosModulos(vacio).length, MODULOS_EH.length, 'Test F: los módulos siguen existiendo, apagados');

// Los textos son los del enunciado, literales.
eq(TEXTOS_GESTION.cabecera, 'Personaliza tu espacio', 'Cabecera literal del enunciado');
ok(TEXTOS_GESTION.ayuda.startsWith('Activa solamente'), 'Y la ayuda');

/* ── 9 · CASOS LÍMITE (apartado 17) ──────────────────────────────────────── */

// "Usuario pulsa muchas veces rápidamente → no debe duplicar módulos."
let machacado = base();
for (let i = 0; i < 20; i += 1) machacado = alternarModulo(machacado, 'skincare');
eq(todosLosModulos(machacado).filter((m) => m.id === 'skincare').length, 1,
  '⚠️ Test I: veinte pulsaciones y sigue habiendo UN skincare');
eq(todosLosModulos(machacado).length, MODULOS_EH.length, 'Test I: y el total no crece');
ok(modulosActivos(machacado).some((m) => m.id === 'skincare'), 'Test I: número par de toques → como estaba');

// Y si los duplicados llegan de un guardado corrupto, el normalizador los quita.
const corrupto = normalizarEstiloHombre({
  configurado: true,
  modulos: [
    { id: 'skincare', activo: true, orden: 0, config: { a: 1 } },
    { id: 'skincare', activo: false, orden: 5, config: { b: 2 } },
    { id: 'pelo', activo: true, orden: 1, config: {} },
  ],
});
eq(corrupto.modulos.filter((m) => m.id === 'skincare').length, 1, '⚠️ Un duplicado guardado se quita al cargar');
eq(corrupto.modulos.find((m) => m.id === 'skincare').config, { a: 1, b: 2 },
  '⚠️ …fusionando las dos config: perder ajustes es lo que se intenta evitar');
eq(corrupto.modulos.find((m) => m.id === 'skincare').activo, false,
  '⚠️ …y manda la última entrada, que es la intención más reciente');

// "Módulo eliminado del catálogo → los datos NO deben borrarse automáticamente."
const conRetirado = normalizarEstiloHombre({
  configurado: true,
  modulos: [
    { id: 'skincare', activo: true, orden: 0, config: {} },
    { id: 'modulo_de_otra_version', activo: true, orden: 1, config: { importante: 'no perder esto' } },
  ],
});
ok(!conRetirado.modulos.some((m) => m.id === 'modulo_de_otra_version'),
  'Un módulo que ya no está en el catálogo sale de la lista');
eq(conRetirado.retirados.length, 1, '⚠️ …pero NO se borra: va a la cuarentena');
eq(conRetirado.retirados[0].config, { importante: 'no perder esto' },
  '⚠️ Con sus datos enteros. Es el apartado 17, y era un fallo real de la Fase 1');
eq(todosLosModulos(conRetirado).length, MODULOS_EH.length, 'Y no aparece en la gestión: nadie sabría pintarlo');

// Y sobrevive a un guardado (regla 5: saveData sobrescribe).
const trasGuardar = normalizarEstiloHombre(JSON.parse(JSON.stringify(conRetirado)));
eq(trasGuardar.retirados.length, 1, '⚠️ La cuarentena sobrevive al guardado, que es donde se perdía');
eq(trasGuardar.retirados[0].config, { importante: 'no perder esto' }, 'Con los datos');

// Si el módulo vuelve al catálogo, vuelve con sus datos.
eq(retiradosQueVuelven(conRetirado), [], 'Hoy ninguno de los retirados está en el catálogo');
const fingido = { ...conRetirado, retirados: [{ id: 'higiene', activo: true, orden: 0, config: { x: 1 }, version: 1 }] };
eq(retiradosQueVuelven(fingido).length, 1, 'Uno que vuelve al catálogo se detecta');
const restaurado = restaurarRetirados(fingido);
eq(restaurado.modulos.find((m) => m.id === 'higiene').config, { x: 1 }, '⚠️ Y vuelve CON sus datos, no desde cero');
ok(restaurado.modulos.find((m) => m.id === 'higiene').activo, 'Y como estaba');
eq(restaurado.retirados.length, 0, 'Sale de la cuarentena');
eq(restaurarRetirados(conRetirado).retirados.length, 1, 'Sin nada que restaurar no cambia nada');

// "Módulo nuevo añadido → disponible/desactivado inicialmente."
const versionVieja = normalizarEstiloHombre({ configurado: true, modulos: [{ id: 'skincare', activo: true, orden: 0 }] });
eq(versionVieja.modulos.length, MODULOS_EH.length, 'Los que faltaban aparecen');
ok(versionVieja.modulos.filter((m) => m.id !== 'skincare').every((m) => !m.activo),
  '⚠️ …y aparecen APAGADOS: encenderlos sería decidir por Josué');
ok(versionVieja.modulos.find((m) => m.id === 'skincare').activo, 'Sin tocar lo que ya tenía');

// "Usuario cierra durante una modificación → la configuración no debe quedar corrupta."
[null, undefined, {}, { modulos: null }, { modulos: 'roto' }, { modulos: [null, undefined] },
  { retirados: 'roto' }, { modulos: [{ }] }, { configurado: 'sí' }].forEach((malo, i) => {
  const r = normalizarEstiloHombre(malo);
  ok(Array.isArray(r.modulos) && Array.isArray(r.retirados), `Entrada corrupta ${i} no revienta`);
  ok(r.modulos.length === MODULOS_EH.length, `Entrada corrupta ${i} devuelve el catálogo entero`);
});

/* ── 10 · TEST E — PERSISTENCIA (apartado 14) ────────────────────────────── */

// No se puede cerrar la aplicación aquí, pero sí hacer lo que hace `saveData`:
// serializar, volver a cargar y normalizar. Que Supabase responda es R1.
const antes = moverA(guardarConfig(alternarModulo(base(), 'higiene', true), 'skincare', { tipoPiel: 'mixta' }), 'fitness', 0);
const despues = normalizarEstiloHombre(JSON.parse(JSON.stringify(antes)));
eq(modulosActivos(despues).map((m) => m.id), modulosActivos(antes).map((m) => m.id),
  'Test E: el orden sobrevive al guardado');
eq(despues.modulos.find((m) => m.id === 'skincare').config, { tipoPiel: 'mixta' },
  'Test E: la configuración del módulo también');
eq(despues.configurado, true, 'Test E: y "ya configurado"');
eq(despues.creadoEn, antes.creadoEn, 'Test E: y la fecha');

/* ── 11 · TEST H — MUCHOS MÓDULOS ────────────────────────────────────────── */

const todosOn = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, IDS_EH);
eq(modulosActivos(todosOn).length, MODULOS_EH.length, 'Test H: los trece activos');
eq(modulosAgrupados(todosOn).length, CATEGORIAS_EH.length, 'Test H: y las siete categorías con contenido');
ok(modulosAgrupados(todosOn).every((g) => g.activos === g.total), 'Test H: todas al completo');
eq(estadoPantalla(todosOn), 'con_modulos', 'Test H: la pantalla sigue siendo la normal');
eq(new Set(modulosActivos(todosOn).map((m) => m.orden)).size, MODULOS_EH.length,
  '⚠️ Test H: trece órdenes distintos, ninguno repetido');

/* ── 12 · RESUMEN ────────────────────────────────────────────────────────── */

const r = resumenGestion(base());
eq(r.activos, 3, 'Cuenta los activos');
eq(r.total, MODULOS_EH.length, 'Y el total');
eq(r.disponibles, MODULOS_EH.length - 3, 'Y los que quedan');
eq(r.categoriasTotales, 7, 'Y las categorías que existen');
ok(r.puedeReordenar, 'Con tres se puede reordenar');
ok(!resumenGestion(alternarModulo(alternarModulo(base(), 'pelo', false), 'fitness', false)).puedeReordenar,
  '⚠️ Con uno solo no se ofrece reordenar: dos flechas que no hacen nada');
eq(r.retirados, 0, 'Hoy no hay nada en cuarentena');
eq(resumenGestion(conRetirado).retirados, 1, 'Y cuando lo hay, se cuenta');

/* ── 13 · APARTADO 15 — UNA ÚNICA FUENTE DE VERDAD ───────────────────────── */

// *"No crear `skincareSettings` en un lugar distinto simplemente para saber si
// Skincare está activo."* Esto no es una opinión: se comprueba contra el código.
const fuentes = ['src/lib/gestionModulos.js', 'src/views/EstiloHombreView.jsx'];
fuentes.forEach((f) => {
  const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
  ok(!/const\s+MODULOS_EH\s*=/.test(src), `${f} no redefine el catálogo`);
  ok(!/const\s+CATEGORIAS_EH\s*=/.test(src), `${f} no redefine las categorías`);
});
const gestion = readFileSync(new URL('../src/lib/gestionModulos.js', import.meta.url), 'utf8');
ok(!/id:\s*'skincare'/.test(gestion), '⚠️ El id de un módulo solo aparece en el catálogo');

/* ── 14 · LO QUE EL ENUNCIADO NOMBRA Y NO SE HA CREADO ───────────────────── */

ok(MODULOS_DEL_ENUNCIADO_NO_CREADOS.length === 6, 'Los seis módulos del apartado 3 que no se han creado');
ok(MODULOS_DEL_ENUNCIADO_NO_CREADOS.every((m) => m.motivo && m.motivo.length > 10),
  '⚠️ Cada uno con su motivo escrito, no un hueco silencioso');
ok(MODULOS_DEL_ENUNCIADO_NO_CREADOS.every((m) => CATEGORIAS_EH.some((c) => c.id === m.categoria)),
  'Y con la categoría en la que entrarían si algún día se crean');
ok(MODULOS_DEL_ENUNCIADO_NO_CREADOS.filter((m) => m.motivo.includes('Ya es un módulo')).length === 2,
  'Dos de ellos ya existen en JosStyle: copiarlos rompería el apartado 15');

/* ── 15 · APARTADO 16 — AÑADIR UN MÓDULO NO OBLIGA A RECONSTRUIR NADA ────── */

// La comprobación real: todo lo que esta fase construye sale del catálogo, así
// que un módulo nuevo entra en todo sin tocar una línea de aquí.
ok(MODULOS_EH.every((m) => m.categoria && m.terminos && Array.isArray(m.terminos)),
  '⚠️ Cada módulo trae SU categoría y SUS términos en su línea');
ok(MODULOS_EH.every((m) => m.terminos.length >= 3), 'Con sinónimos suficientes para el buscador');
ok(new Set(MODULOS_EH.map((m) => m.id)).size === MODULOS_EH.length, 'Sin ids repetidos');
ok(MODULOS_EH.every((m) => Number.isFinite(m.fase) && m.fase >= 2), 'Y con la fase en la que llega su contenido');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
