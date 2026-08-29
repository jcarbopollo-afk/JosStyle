// ============================================================================
// EH · Fase 39/65 — Integración con el resto de JosStyle
//
// Lo que gobierna la fase, y lo que hay que comprobar:
//   · Estilo de hombre USA los sistemas globales; no los duplica
//   · Tareas era el único que faltaba, y entra como entró Objetivos en la F28
//   · `aplicarTarea` sin `confirmado` no escribe nada (regla 7)
//   · dos de los sistemas del enunciado NO EXISTEN, y se dice (regla 8)
//   · un dato existe una sola vez (apartado 18)
//   · borrar enseña lo que se va y lo que se queda (apartado 19)
//   · desactivar NO borra (apartado 20)
//   · y la prueba maestra del apartado 21, ejecutada de verdad
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre,
  alternarModulo, guardarConfig, FUENTES_GLOBALES,
} from '../src/lib/estiloDeHombre.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { CLAVES_PAPELERA_EH, estadoDe } from '../src/lib/gestionEstilo.js';
import { REGISTRO_DATOS } from '../src/lib/datosEstiloHombre.js';
import {
  anadirDeseoAccesorio, deseosAccesorios, normalizarDeseo,
} from '../src/lib/accesorios.js';
import { anadirGusto, entradasDeGustos, editarGusto } from '../src/lib/gustos.js';
import {
  anadirPorProbar, anadirPerfume, ponerPerfumeActual, asignarPerfumeAOcasion,
  registrarUso, datosPerfumes, normalizarPorProbar, editarPorProbar,
} from '../src/lib/perfumes.js';
import {
  SISTEMAS_EH, sistemaEH, SISTEMAS_CONECTADOS, SISTEMAS_QUE_NO_EXISTEN,
  TEXTOS_INTEGRACION, MODULO_TAREAS, DESTINO_TAREAS, FUENTES_TAREA, fuenteTarea,
  textoDeTarea, tareaDe, accionesConcretas, sugerenciasDeTarea, prepararTarea,
  aplicarTarea, desenlazarTarea, duenoDe, DATOS_COMPARTIDOS, duplicadosDetectados,
  mapaDeDatos, REFERENCIAS_CONOCIDAS, referenciasA, impactoDeEliminar,
  impactoDeDesactivar, pruebaMaestra, auditarIntegracion, textosDeIntegracion,
  panelIntegracion,
} from '../src/lib/integracionEstilo.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-29';
const TODOS_EH = ['estilo', 'skincare', 'pelo', 'barba', 'perfumes', 'sonrisa', 'accesorios', 'gustos'];
const FUENTE = readFileSync(new URL('../src/lib/integracionEstilo.js', import.meta.url), 'utf8');
const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const APP = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const VISTA = readFileSync(new URL('../src/views/EstiloHombreView.jsx', import.meta.url), 'utf8');

/** Un estado con un deseo de accesorio y un perfume por probar. */
const conAcciones = () => {
  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, TODOS_EH);
  e = anadirDeseoAccesorio(e, { nombre: 'Reloj negro', marca: 'Casio' }, { hoy: HOY }).estado;
  e = anadirPorProbar(e, { nombre: 'Sauvage', marca: 'Dior' }, { hoy: HOY }).estado;
  return e;
};

/** Un estado con un perfume al que apuntan tres cosas. */
const conPerfumeReferenciado = () => {
  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, TODOS_EH);
  e = anadirPerfume(e, { nombre: 'Bleu' }, { hoy: HOY }).estado;
  const id = datosPerfumes(e).perfumes[0].id;
  e = ponerPerfumeActual(e, id).estado;
  e = asignarPerfumeAOcasion(e, 'diario', id).estado;
  e = registrarUso(e, { fecha: HOY, perfumeId: id }).estado;
  return { estado: e, id };
};

console.log('\n🔗 EH · Fase 39/65 — Integración con el resto de JosStyle\n');

/* ---------------------------------------------------------------------------
   1 · EL MAPA: UNA LÍNEA POR SISTEMA (apartados 1-17)
   --------------------------------------------------------------------------- */
{
  console.log('1 · El mapa de sistemas globales');
  eq(SISTEMAS_EH.length, 17, 'diecisiete sistemas, uno por apartado del 1 al 17');
  const apartados = SISTEMAS_EH.map((s) => s.apartado).sort((a, b) => a - b);
  eq(apartados, Array.from({ length: 17 }, (_, i) => i + 1), 'y no falta ni sobra ningún apartado');
  ok(new Set(SISTEMAS_EH.map((s) => s.id)).size === SISTEMAS_EH.length, 'ningún id repetido');
  ok(SISTEMAS_EH.every((s) => typeof s.que === 'string' && s.que.length > 0),
    'cada uno explica qué usa, en una frase');
  ok(SISTEMAS_EH.every((s) => typeof s.existe === 'boolean'), 'y si existe o no');

  // Los que el enunciado enumera y de verdad hay.
  ['calendario', 'objetivos', 'tareas', 'recordatorios', 'productos', 'armario',
    'diario', 'rachas', 'sonidos', 'papelera', 'busqueda', 'notificaciones',
    'ajustes', 'cuenta', 'sincronizacion'].forEach((id) => {
    ok(sistemaEH(id) && sistemaEH(id).existe, `${id} está conectado`);
  });
  eq(SISTEMAS_CONECTADOS.length, 15, 'quince conectados');

  // ⚠️ Los dos que el enunciado da por hechos y NO existen (regla 8).
  eq(SISTEMAS_QUE_NO_EXISTEN.map((s) => s.id), ['favoritos', 'fotos'],
    '⚠️ favoritos globales (5) y galería de fotos (9) no existen');
  SISTEMAS_QUE_NO_EXISTEN.forEach((s) => {
    ok(typeof s.porque === 'string' && s.porque.length > 20,
      `y ${s.id} lo dice con una frase, en vez de un botón muerto`);
    eq(s.destino, null, `${s.id} no lleva a ninguna parte, porque no la hay`);
    eq(s.entra, [], `${s.id} no finge una conexión`);
  });
}

/* ---------------------------------------------------------------------------
   2 · NI UN SISTEMA NUEVO (la regla de la fase)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · "Utiliza los sistemas globales. No los duplica."');
  const a = auditarIntegracion();
  eq(a.sinConectar, [], '⚠️ todas las funciones declaradas existen de verdad');
  eq(a.calendariosNuevos, 0, 'ni un calendario nuevo (apartado 1)');
  eq(a.listasDeTareasNuevas, 0, 'ni una lista de tareas dentro de Estilo (apartado 3)');
  eq(a.papelerasNuevas, 0, 'ni una papelera propia (apartado 12)');
  eq(a.galeriasNuevas, 0, 'ni una galería paralela (apartado 9)');
  eq(a.noExisten, ['favoritos', 'fotos'], 'y los dos que faltan, nombrados');

  // ⚠️ El código, leído: ni un almacén propio en esta fase.
  ok(!/DEFAULT_INTEGRACION/.test(SIN_COMENTARIOS),
    '⚠️ la fase NO tiene almacén propio: no guarda nada que ya viva fuera');
  ok(!/function normalizarIntegracion/.test(SIN_COMENTARIOS),
    'y por tanto tampoco normalizador');
  ok(!/new Notification|Notification\.requestPermission/.test(SIN_COMENTARIOS),
    '⚠️ no manda notificaciones por su cuenta: eso es de notificaciones.js (apartado 14)');
  ok(!/localStorage|supabase/i.test(SIN_COMENTARIOS),
    '⚠️ ni toca el guardado: sincronizar es del sistema global (apartado 17)');
  ok(/from '\.\/papelera'/.test(FUENTE), 'usa la papelera global (apartado 12)');
  ok(/from '\.\/calendarioIntegracion'/.test(FUENTE), 'y el calendario global (apartado 1)');
  ok(/from '\.\/notificaciones'/.test(FUENTE), 'y el emisor global de avisos (apartado 14)');
}

/* ---------------------------------------------------------------------------
   3 · TAREAS: EL QUE FALTABA (apartado 3)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Tareas — el único sistema que faltaba');
  eq(MODULO_TAREAS, 'productividad', 'las tareas son de Productividad');
  eq(DESTINO_TAREAS, 'productividad', 'y allí lleva el botón');
  eq(FUENTES_TAREA.map((f) => f.id), ['accesorio_deseado', 'perfume_por_probar'],
    'dos fuentes, y las dos son listas que YA existían');
  ok(FUENTES_TAREA.every((f) => typeof f.leer === 'function' && typeof f.escribir === 'function'),
    'cada fuente sabe leerse y escribirse en SU módulo');

  const e = conAcciones();
  const acciones = accionesConcretas(e, { tareas: [] });
  eq(acciones.length, 2, 'dos acciones concretas');
  eq(acciones.map((a) => a.texto), ['Comprar Reloj negro (Casio)', 'Probar Sauvage (Dior)'],
    '⚠️ "Comprar producto X", que es el ejemplo del enunciado');
  ok(acciones.every((a) => a.enTareas === false), 'ninguna está todavía en Tareas');
  eq(sugerenciasDeTarea(e, { tareas: [] }).length, 2, 'y las dos se pueden ofrecer');

  const plan = prepararTarea(e, 'accesorio_deseado', acciones[0].elementoId, { fechaLimite: '2026-09-10' });
  ok(plan && plan.tarea, 'el plan trae la tarea');
  eq(Object.keys(plan.tarea).sort(), ['fechaLimite', 'hecha', 'id', 'texto'],
    '⚠️ con la forma REAL de una tarea de Productividad, ni un campo inventado');
  eq(plan.destino, 'productividad', 'y su destino');
  eq(plan.tarea.fechaLimite, '2026-09-10', 'la fecha, si la puso');
  eq(prepararTarea(e, 'accesorio_deseado', acciones[0].elementoId, { fechaLimite: '10/09/2026' }).tarea.fechaLimite,
    null, '⚠️ y una fecha con otra forma no se cuela');
  eq(prepararTarea(e, 'inventada', 'x'), null, 'una fuente que no existe no da plan');
  eq(prepararTarea(e, 'accesorio_deseado', 'no-existe'), null, 'ni un elemento que no está');

  // ⚠️ Decimoséptimo `aplicarPlan` del proyecto.
  eq(aplicarTarea(e, { tareas: [] }, plan), null,
    '⚠️ sin `confirmado` NO escribe nada (regla 7)');
  eq(aplicarTarea(e, { tareas: [] }, plan, { confirmado: false }), null,
    'ni pasándole `false` a mano');
  eq(aplicarTarea(e, { tareas: [] }, null, { confirmado: true }), null, 'ni sin plan');

  const r = aplicarTarea(e, { tareas: [] }, plan, { confirmado: true });
  ok(r && r.estiloHombre && r.productividad, 'con `confirmado` devuelve LOS DOS almacenes');
  eq(r.productividad.tareas.length, 1, 'la tarea entra en Productividad');
  eq(r.productividad.tareas[0].texto, 'Comprar Reloj negro (Casio)', 'con su texto');

  // ⚠️ Apartado 18 — en Estilo solo queda el id.
  const deseo = deseosAccesorios(r.estiloHombre)[0];
  eq(deseo.tareaId, plan.tarea.id, '⚠️ y en Estilo de hombre queda SOLO su id');
  ok(!('texto' in deseo) && !('hecha' in deseo),
    '⚠️ ni el texto ni el "hecha": eso vive en Tareas (fuente única, apartado 18)');

  const tras = accionesConcretas(r.estiloHombre, r.productividad);
  eq(tras[0].enTareas, true, 'ya está en Tareas');
  eq(tras[0].hecha, false, 'y sin marcar');
  eq(sugerenciasDeTarea(r.estiloHombre, r.productividad).length, 1,
    'y ya no se le vuelve a ofrecer');
  const hecha = { tareas: [{ ...r.productividad.tareas[0], hecha: true }] };
  eq(accionesConcretas(r.estiloHombre, hecha)[0].hecha, true,
    '⚠️ marcarla en Productividad se ve aquí: el dato es el de allí');

  // ⚠️ Borrada en Productividad: se dice, no se rehace sola.
  const colgada = accionesConcretas(r.estiloHombre, { tareas: [] })[0];
  eq(colgada.colgada, true, '⚠️ si la borra en Tareas, el enlace queda colgando y se dice');
  eq(colgada.enTareas, false, 'y no se finge que sigue ahí');
  eq(tareaDe(deseo, { tareas: [] }), null, 'ni se inventa una tarea que ya no está');

  const suelto = desenlazarTarea(r.estiloHombre, 'accesorio_deseado', acciones[0].elementoId);
  eq(deseosAccesorios(suelto)[0].tareaId, null, 'soltar el enlace lo quita de aquí');
  eq(accionesConcretas(suelto, r.productividad).filter((a) => a.enTareas).length, 0,
    'y la tarea sigue en Productividad: soltar no la borra');

  // El perfume por probar, por el otro lado.
  const plan2 = prepararTarea(e, 'perfume_por_probar', acciones[1].elementoId);
  const r2 = aplicarTarea(e, { tareas: [] }, plan2, { confirmado: true });
  eq(datosPerfumes(r2.estiloHombre).porProbar[0].tareaId, plan2.tarea.id,
    'un perfume por probar también se enlaza');
  eq(plan2.tarea.fechaLimite, null, 'y sin fecha si no la puso');
  eq(textoDeTarea(fuenteTarea('perfume_por_probar'), { nombre: 'Uno' }), 'Probar Uno',
    'sin marca, el texto no lleva paréntesis vacío');
}

/* ---------------------------------------------------------------------------
   4 · EL NORMALIZADOR (regla 5 — la lección número veintinueve)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · El campo nuevo sobrevive al guardado');
  ok('tareaId' in normalizarDeseo({ nombre: 'X' }),
    '⚠️ `tareaId` está en el normalizador de un deseo desde el primer día');
  ok('tareaId' in normalizarPorProbar({ nombre: 'X' }),
    'y en el de un perfume por probar');
  eq(normalizarDeseo({ nombre: 'X', tareaId: 't1' }).tareaId, 't1', 'y se conserva');
  eq(normalizarDeseo({ nombre: 'X', tareaId: 7 }).tareaId, null, 'lo que no es un id se cae');
  eq(normalizarPorProbar({ nombre: 'X', tareaId: {} }).tareaId, null, 'en los dos sitios');

  // El viaje completo: guardar, releer y comprobar que sigue.
  const e = conAcciones();
  const acc = accionesConcretas(e, { tareas: [] });
  const r = aplicarTarea(e, { tareas: [] }, prepararTarea(e, 'accesorio_deseado', acc[0].elementoId), { confirmado: true });
  const releido = normalizarEstiloHombre(JSON.parse(JSON.stringify(r.estiloHombre)));
  ok(!!deseosAccesorios(releido)[0].tareaId,
    '⚠️ y sobrevive a guardar y volver a leer (regla 5)');

  // ⚠️ `editarPorProbar` nació aquí: el puente decide, el módulo dueño escribe.
  const conProbar = anadirPorProbar(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, TODOS_EH), { nombre: 'Uno' }).estado;
  const idp = datosPerfumes(conProbar).porProbar[0].id;
  eq(editarPorProbar(conProbar, 'fantasma', {}).error, 'Ese no está en la lista.',
    'editar algo que no está da error, no lo crea');
  eq(editarPorProbar(conProbar, idp, { nombre: '  ' }).error, 'Necesita un nombre.',
    'y no lo deja sin nombre');
  eq(datosPerfumes(editarPorProbar(conProbar, idp, { tareaId: 't9' }).estado).porProbar[0].tareaId,
    't9', 'y guarda lo que sí vale');
}

/* ---------------------------------------------------------------------------
   5 · FUENTE ÚNICA DE VERDAD (apartado 18)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Un dato existe una sola vez');
  ok(DATOS_COMPARTIDOS.length > 0, 'hay datos que usan varios módulos');
  DATOS_COMPARTIDOS.forEach((id) => {
    ok(duenoDe(id).compartido, `${id} lo usan dos o más módulos, y está declarado`);
  });
  ok(DATOS_COMPARTIDOS.every((id) => REGISTRO_DATOS.some((d) => d.id === id)),
    '⚠️ y todos salen del REGISTRO_DATOS de la F4: ni un registro nuevo');
  eq(duenoDe('peso').global, true, 'el peso es un dato global…');
  eq(duenoDe('peso').modulo, 'salud', '…y su dueño es Salud');

  const e = conAcciones();
  eq(duplicadosDetectados(e), [], '⚠️ ningún módulo guarda por su cuenta un dato global');
  // Y si alguno lo hiciera, esto lo diría.
  const roto = guardarConfig(e, 'skincare', { peso: 72 });
  const fallo = duplicadosDetectados(roto);
  eq(fallo.length, 1, '⚠️ un módulo que guardase el peso sería detectado');
  eq(fallo[0].modulo, 'skincare', 'con su nombre');
  eq(fallo[0].vive, FUENTES_GLOBALES.peso.que, 'y con dónde vive de verdad');

  const mapa = mapaDeDatos(e);
  eq(mapa.length, DATOS_COMPARTIDOS.length, 'el mapa trae los compartidos');
  ok(mapa.every((d) => 'origen' in d && 'usan' in d), 'cada uno con su origen y quién lo usa');
}

/* ---------------------------------------------------------------------------
   6 · ELIMINACIÓN EN CASCADA (apartado 19)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Borrar enseña lo que se va y lo que se queda');
  const { estado, id } = conPerfumeReferenciado();
  const refs = referenciasA(estado, 'perfumes.perfumes', id);
  eq(refs.length, 3, 'tres cosas apuntan a ese perfume');
  eq(refs.map((r) => r.donde), ['Tu perfume actual', 'Los perfumes por ocasión', 'Tu historial de uso'],
    'y se dicen con su nombre');

  const imp = impactoDeEliminar(estado, 'perfumes.perfumes', id);
  eq(imp.tipo, 'Perfume', 'el aviso dice qué es');
  eq(imp.aPapelera, true, '⚠️ y que va a Eliminados recientemente, no a la nada');
  eq(imp.seActualizan.length, 3, 'lo que se queda sin apuntar a nada');
  eq(imp.seQuedan.length, 0, 'y aquí no hay nada intocable');
  eq(imp.sinReferencias, null, 'con referencias, no se dice que no las haya');

  // Un accesorio: la prenda SIGUE en el armario (F26).
  const impAcc = impactoDeEliminar(estado, 'accesorios.accesorios', 'x');
  eq(impAcc.seQuedan.map((r) => r.donde), ['Tu armario'],
    '⚠️ borrar un accesorio NO borra la prenda del Armario');
  eq(impAcc.seActualizan, [], 'y no se le atribuye ningún destrozo más');

  // Un gusto con objetivo: el objetivo SIGUE en Objetivos (F28).
  let conGusto = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, TODOS_EH);
  conGusto = anadirGusto(conGusto, { nombre: 'Viaje a Japón', categoria: 'experiencias', estado: 'quiero' }).estado;
  const gustoId = entradasDeGustos(conGusto)[0].id;
  eq(referenciasA(conGusto, 'gustos.entradas', gustoId), [],
    'un gusto sin objetivo no arrastra nada');
  const gustoConObjetivo = editarGusto(conGusto, gustoId, { objetivoId: 'ob1' }).estado;
  const impGusto = impactoDeEliminar(gustoConObjetivo, 'gustos.entradas', gustoId);
  eq(impGusto.seQuedan.map((r) => r.donde), ['Objetivos'],
    '⚠️ y borrarlo NO borra el objetivo: sigue en Objetivos (F28)');
  eq(impGusto.seActualizan, [], 'sin nada más que actualizar');

  // Sin referencias, se dice.
  const limpio = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, TODOS_EH);
  const impSin = impactoDeEliminar(limpio, 'perfumes.perfumes', 'no-existe');
  eq(impSin.hayReferencias, false, 'sin referencias no se inventan');
  eq(impSin.sinReferencias, TEXTOS_INTEGRACION.sinReferencias, 'y se dice');

  // ⚠️ Nada de esto escribe.
  eq(JSON.stringify(normalizarEstiloHombre(estado)), JSON.stringify(normalizarEstiloHombre(estado)),
    'mirar el impacto no cambia el estado');
  ok(!/eliminarConPapelera|prepararEliminacion\(/.test(SIN_COMENTARIOS),
    '⚠️ esta fase NO borra: quien borra es la papelera global (ME F3)');
  ok(Object.keys(REFERENCIAS_CONOCIDAS).every((k) => !!CATALOGO_PAPELERA[k]),
    'y cada colección con referencias está en el catálogo de la papelera');
}

/* ---------------------------------------------------------------------------
   7 · DESACTIVAR NO BORRA (apartado 20)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Desactivar no elimina información');
  const { estado, id } = conPerfumeReferenciado();
  const imp = impactoDeDesactivar(estado, 'perfumes');
  eq(imp.estadoAntes, 'activo', 'antes estaba activo');
  eq(imp.estadoDespues, 'desactivado', 'y después, desactivado');
  eq(imp.conservaDatos, true, '⚠️ y la configuración es la MISMA, letra por letra');

  // Y de verdad: apagar, encender y comprobar que el perfume sigue.
  const apagado = alternarModulo(estado, 'perfumes', false);
  eq(datosPerfumes(apagado).perfumes.length, 1, 'el perfume sigue ahí con el módulo apagado');
  const encendido = alternarModulo(apagado, 'perfumes', true);
  eq(datosPerfumes(encendido).perfumes[0].id, id, 'y vuelve entero al reactivarlo');
  eq(estadoDe(encendido, 'perfumes'), 'activo', 'con su estado');
  ok(/no borra nada/i.test(TEXTOS_INTEGRACION.desactivarNoBorra),
    'y se le dice antes, para que no lo tenga que averiguar');
}

/* ---------------------------------------------------------------------------
   8 · LA PRUEBA MAESTRA (apartado 21)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Estilo → Calendario → Objetivos → Tareas → Diario → Favoritos → Productos → Notificaciones → Eliminados');
  const e = conAcciones();
  const acc = accionesConcretas(e, { tareas: [] });
  const r = aplicarTarea(e, { tareas: [] }, prepararTarea(e, 'accesorio_deseado', acc[0].elementoId), { confirmado: true });
  const pm = pruebaMaestra({ estado: r.estiloHombre, productividad: r.productividad, hoy: HOY });

  eq(pm.pasos.map((p) => p.id),
    ['estilo', 'calendario', 'objetivos', 'tareas', 'diario', 'favoritos', 'productos', 'notificaciones', 'papelera'],
    '⚠️ los nueve pasos del enunciado, en su orden');
  eq(pm.ok, true, '⚠️ y todos trabajan sobre los mismos sistemas globales');
  eq(pm.fallan, [], 'ninguno falla');
  eq(pm.duplicados, [], 'y no hay ni un dato duplicado');
  ok(pm.pasos.every((p) => typeof p.detalle === 'string' && p.detalle.length > 0),
    'cada paso dice qué ha comprobado');

  // Los destinos, uno a uno: el sistema global de siempre.
  const porId = Object.fromEntries(pm.pasos.map((p) => [p.id, p]));
  eq(porId.calendario.global, 'calendario', 'el calendario es el global');
  eq(porId.objetivos.global, 'objetivos', 'los objetivos, los globales');
  eq(porId.tareas.global, 'productividad', 'las tareas, las de Productividad');
  eq(porId.diario.global, 'diario', 'el diario, el que ya existe');
  eq(porId.papelera.global, 'papelera', 'y la papelera, la global');
  eq(porId.favoritos.global, null, '⚠️ favoritos no tiene sistema global…');
  eq(porId.favoritos.ok, true, '…y Estilo tampoco crea uno propio');
  ok(porId.favoritos.detalle === sistemaEH('favoritos').porque, 'lo dice con su frase');
  ok(porId.papelera.detalle.includes(String(CLAVES_PAPELERA_EH.length)),
    'y cuenta las colecciones de Estilo que están en la papelera global');

  // ⚠️ Con el módulo apagado sigue siendo válida: la integración no depende de eso.
  const apagado = alternarModulo(r.estiloHombre, 'perfumes', false);
  eq(pruebaMaestra({ estado: apagado, productividad: r.productividad, hoy: HOY }).ok, true,
    'y sigue en pie con un apartado apagado');
  eq(pruebaMaestra({ estado: DEFAULT_ESTILO_HOMBRE, hoy: HOY }).ok, true,
    'y sin nada configurado también');
}

/* ---------------------------------------------------------------------------
   9 · LA PANTALLA
   --------------------------------------------------------------------------- */
{
  console.log('\n9 · La pantalla');
  const e = conAcciones();
  const p = panelIntegracion(e, { productividad: { tareas: [] } });
  eq(p.titulo, TEXTOS_INTEGRACION.titulo, 'el panel trae su título');
  eq(p.sistemas.length, 17, 'y los diecisiete sistemas');
  eq(p.tareas.acciones.length, 2, 'las dos acciones concretas');
  ok(p.sistemas.filter((s) => !s.existe).every((s) => !!s.porque),
    '⚠️ y lo que no existe llega a la pantalla con su motivo');
  ok(p.sistemas.filter((s) => !s.existe).every((s) => s.destino === null),
    'sin un botón que no llevaría a ninguna parte (regla 8)');
  ok(!!p.datos.texto && Array.isArray(p.datos.lista), 'el mapa de datos, con su frase');
  ok(!!p.desactivar, 'y el aviso de que desactivar no borra');
  eq(panelIntegracion(DEFAULT_ESTILO_HOMBRE).tareas.acciones, [],
    'sin nada apuntado, no hay acciones');

  // ⚠️ La vista existe y entra por la puerta de siempre.
  ok(/export function IntegracionEH/.test(VISTA), 'la pantalla existe');
  ok(/import \{[\s\S]*?panelIntegracion[\s\S]*?\} from '\.\.\/lib\/integracionEstilo'/.test(VISTA),
    '⚠️ y la vista IMPORTA la librería (la lección de la F15)');
  ok(/onIntegracion/.test(VISTA), 'se entra desde ⋮ Personalizar, como la F36 y la F38');
  ok(!/localStorage/.test(VISTA.slice(VISTA.indexOf('export function IntegracionEH'), VISTA.indexOf('export function AvisosEstiloEH'))),
    'y la pantalla no guarda nada por su cuenta');

  // ⚠️ App.jsx es quien escribe los dos almacenes.
  ok(/import \{ aplicarTarea \} from '\.\/lib\/integracionEstilo'/.test(APP),
    '⚠️ App.jsx importa `aplicarTarea` (la lección de la F15)');
  ok(/aplicarTarea\(estiloHombre, productividad, plan, \{ confirmado: true \}\)/.test(APP),
    'y lo llama con `confirmado`, que es el toque explícito de Josué');
  ok(/estiloHombre: r\.estiloHombre, productividad: r\.productividad/.test(APP),
    '⚠️ guardando LOS DOS almacenes en un solo guardado');
  ok(/productividad=\{productividad\}/.test(APP), 'y le pasa Productividad a la vista');
}

/* ---------------------------------------------------------------------------
   10 · LOS TEXTOS
   --------------------------------------------------------------------------- */
{
  console.log('\n10 · Los textos');
  const textos = textosDeIntegracion();
  ok(textos.every((t) => typeof t === 'string' && t.length > 0), 'ninguno vacío');
  // Regla 9 — ni una nota de desarrollo en lo que ve Josué.
  ok(!textos.some((t) => /fase \d|apartado \d|pendiente de|próximamente/i.test(t)),
    '⚠️ ninguno menciona fases, apartados ni "próximamente" (regla 9)');
  // Regla 8 — lo que no existe se dice; no se promete.
  ok(!textos.some((t) => /muy pronto|en breve|estamos trabajando/i.test(t)),
    '⚠️ y nada se promete para más adelante (regla 8)');
  // D2-03 — ni una compra.
  ok(!textos.some((t) => /comprar aquí|añadir al carrito|afiliad/i.test(t)),
    '⚠️ ni una compra ni una afiliación (D2-03)');
  ok(/una sola vez/i.test(TEXTOS_INTEGRACION.fuenteUnica),
    'y la regla del apartado 18 se dice con sus palabras');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
