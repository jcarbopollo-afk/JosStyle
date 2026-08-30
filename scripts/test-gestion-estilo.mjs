// ============================================================================
// EH · Fase 36/65 — Gestión global de módulos ("🧩 Gestionar apartados")
//
// Las quince pruebas críticas del apartado 17, y lo que gobierna la fase:
//   · ocultar ≠ desactivar ≠ eliminar, y las tres se prueban por separado
//   · ocultar NO cambia el funcionamiento interno (apartado 3)
//   · desactivar NO borra, ni después de meses (apartado 12)
//   · eliminar va a la papelera global, elemento a elemento (apartados 5 y 6)
//   · restablecer devuelve la visibilidad pero NO reactiva (apartado 8)
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, moduloEH,
  modulosActivos, guardarConfig, MODULOS_EH,
} from '../src/lib/estiloDeHombre.js';
import { seccionesDePantalla, cambiarTamano, datosPantalla } from '../src/lib/pantallaEH.js';
import { bloquesVisibles } from '../src/lib/miEstilo.js';
import { recomendarIdeas } from '../src/lib/ideasEstilo.js';
import { descubrir } from '../src/lib/descubrir.js';
import { metricasVisibles, metricasDisponibles } from '../src/lib/progresoEstilo.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import {
  ESTADOS_GESTION, estadoGestion, TEXTOS_GESTION_EH, estadoDe, alternarOculto,
  ocultarModulo, mostrarModulo, estaOculto, modulosVisibles, desactivarModulo,
  activarModulo, PARTES_POR_MODULO, partesDe, alternarParteDe, DEPENDENCIAS,
  dependencia, avisoDependencia, resolverDependencia, DONDE_VIVEN, CLAVES_PAPELERA_EH,
  planEliminarDatos, avisoEliminarDatos, TEXTOS_RESTABLECER_EH, restablecerEstilo,
  buscarApartado, ESENCIALES, fichaGestion, panelGestionEstilo, resumenGestionEstilo,
  auditarGestionEstilo, textosDeGestionEstilo,
} from '../src/lib/gestionEstilo.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const ARM = { prendas: [], outfits: [], usos: [] };
const TODOS_EH = ['estilo', 'skincare', 'pelo', 'barba', 'perfumes', 'sonrisa', 'accesorios', 'gustos'];
const con = (ids) => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ids);
const FUENTE = readFileSync(new URL('../src/lib/gestionEstilo.js', import.meta.url), 'utf8');
const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const cfg = (est, id) => JSON.stringify(normalizarEstiloHombre(est).modulos.find((m) => m.id === id).config);

/** Un estado con datos de verdad en Perfumes, para probar el borrado. */
const conDatos = () => guardarConfig(con(TODOS_EH), 'perfumes', {
  perfumes: {
    perfumes: [{ id: 'pf1', nombre: 'Uno' }, { id: 'pf2', nombre: 'Dos' }],
    historial: [{ id: 'u1', perfumeId: 'pf1', fecha: '2026-08-29' }],
    partes: { historial: true },
  },
});

console.log('\n🧩  EH · Fase 36/65 — Gestión global de módulos\n');

/* ===========================================================================
   Test 1 — ⚠️ LOS TRES ESTADOS (apartados 2 y 16)
   =========================================================================== */
console.log('Test 1 — ⚠️ ocultar ≠ desactivar ≠ eliminar');
{
  eq(ESTADOS_GESTION.map((e) => e.nombre), ['Activo', 'Oculto', 'Desactivado'],
    'los tres del apartado 16, con sus nombres');
  eq(ESTADOS_GESTION.map((e) => e.icono), ['🟢', '⚪', '⏸️'], 'y sus iconos, tal cual');
  eq(ESTADOS_GESTION.length, 3, '⚠️ TRES, no dos: la fase entera es el tercero');
  eq(estadoGestion('inventado'), null, 'un estado que no existe da null');

  const e = con(TODOS_EH);
  eq(estadoDe(e, 'skincare'), 'activo', 'de partida, activo');
  eq(estadoDe(ocultarModulo(e, 'skincare'), 'skincare'), 'oculto', 'ocultarlo lo deja oculto');
  eq(estadoDe(desactivarModulo(e, 'skincare'), 'skincare'), 'desactivado', 'y desactivarlo, desactivado');
  eq(estadoDe(desactivarModulo(ocultarModulo(e, 'skincare'), 'skincare'), 'skincare'), 'desactivado',
    '⚠️ y desactivado GANA: no se dicen las dos cosas a la vez (apartado 16)');
  eq(estadoDe(e, 'inventado'), null, 'un módulo que no existe da null');
  ok(TEXTOS_GESTION_EH.tresCosas.includes('Ocultar lo quita') && TEXTOS_GESTION_EH.tresCosas.includes('Eliminar borra'),
    'y la pantalla separa las tres con una frase');
}

/* ===========================================================================
   Test 2 — ⚠️ OCULTAR NO CAMBIA EL FUNCIONAMIENTO (apartado 3 · pruebas 1, 2 y 9)
   =========================================================================== */
console.log('\nTest 2 — ⚠️ *"no cambia su funcionamiento interno"*');
{
  const e = conDatos();
  const oculto = ocultarModulo(e, 'perfumes');
  eq(estaOculto(oculto, 'perfumes'), true, 'se puede ocultar (prueba 1)');

  /* Apartado 3, primera mitad — desaparece de la PORTADA. */
  const antes = seccionesDePantalla(e, { armario: ARM }).flatMap((s) => s.modulos).map((m) => m.id);
  const despues = seccionesDePantalla(oculto, { armario: ARM }).flatMap((s) => s.modulos).map((m) => m.id);
  ok(antes.includes('perfumes'), 'de partida sale en la portada');
  ok(!despues.includes('perfumes'), '⚠️ y oculto, DESAPARECE de la pantalla principal');
  eq(despues.length, antes.length - 1, 'y solo ese: los demás siguen');

  /* Apartado 3, segunda mitad — ⚠️ y NADA MÁS cambia. */
  ok(modulosActivos(oculto).some((m) => m.id === 'perfumes'),
    '⚠️ pero SIGUE ACTIVO: ocultar no es desactivar');
  const ideasAntes = recomendarIdeas(e, { armario: ARM, limite: 50 }).ideas.filter((i) => i.tema === 'perfumes');
  const ideasDespues = recomendarIdeas(oculto, { armario: ARM, limite: 50 }).ideas.filter((i) => i.tema === 'perfumes');
  eq(ideasDespues.length, ideasAntes.length,
    '⚠️ y SIGUE DANDO IDEAS (F32): *"no cambia su funcionamiento interno"*');
  eq(descubrir(oculto, { limite: 50 }).tarjetas.filter((t) => t.modulo === 'perfumes').length,
    descubrir(e, { limite: 50 }).tarjetas.filter((t) => t.modulo === 'perfumes').length,
    'y sigue dando tarjetas de Descubrir (F33)');
  ok(metricasDisponibles(oculto).some((m) => m.modulo === 'perfumes'),
    'y sus métricas siguen ofreciéndose (F35)');
  eq(cfg(oculto, 'perfumes'), cfg(e, 'perfumes'), '⚠️ y sus datos, intactos (prueba 9)');

  /* Prueba 2 — volver a mostrarlo. */
  const vuelve = mostrarModulo(oculto, 'perfumes');
  eq(estaOculto(vuelve, 'perfumes'), false, 'se puede volver a mostrar (prueba 2)');
  eq(seccionesDePantalla(vuelve, { armario: ARM }).flatMap((s) => s.modulos).map((m) => m.id), antes,
    '⚠️ y vuelve a su sitio, con el mismo orden');
  eq(cfg(vuelve, 'perfumes'), cfg(e, 'perfumes'), 'sin perder nada');

  eq(estaOculto(alternarOculto(e, 'perfumes'), 'perfumes'), true, 'y hay un conmutador');
  eq(estaOculto(alternarOculto(alternarOculto(e, 'perfumes'), 'perfumes'), 'perfumes'), false, 'que va y vuelve');
  eq(normalizarEstiloHombre(ocultarModulo(e, 'inventado')), normalizarEstiloHombre(e),
    'y un módulo que no existe no se toca');

  /* ⚠️ Y tampoco ocupa sitio en la tarjeta "Mi estilo" de la F29, que está en la
     MISMA pantalla principal: verlo ahí justo debajo de donde acaba de quitarlo
     parecería que ocultar no ha hecho nada. */
  const enMiEstilo = (est) => bloquesVisibles(est, { armario: ARM })
    .flatMap((b) => b.modulosActivos).map((m) => m.id);
  ok(enMiEstilo(e).includes('perfumes'), 'de partida sale también en "Mi estilo"');
  ok(!enMiEstilo(oculto).includes('perfumes'),
    '⚠️ y oculto desaparece de la pantalla principal ENTERA, no solo de su plaquita');
  ok(enMiEstilo(vuelve).includes('perfumes'), 'y vuelve con él');

  // ⚠️ Una sección con TODOS sus módulos ocultos no se pinta.
  const sinEstilo = ['estilo', 'perfumes', 'accesorios'].reduce((acc, id) => ocultarModulo(acc, id), e);
  ok(!seccionesDePantalla(sinEstilo, { armario: ARM }).some((s) => s.id === 'estilo'),
    '⚠️ y una sección entera oculta tampoco se pinta');
}

/* ===========================================================================
   Test 3 — ⚠️ DESACTIVAR NO BORRA (apartados 4, 7 y 12 · pruebas 3, 4 y 10)
   =========================================================================== */
console.log('\nTest 3 — ⚠️ *"desactivar ≠ borrar"*');
{
  const e = conDatos();
  const off = desactivarModulo(e, 'perfumes');
  eq(estadoDe(off, 'perfumes'), 'desactivado', 'se puede desactivar (prueba 3)');
  ok(!modulosActivos(off).some((m) => m.id === 'perfumes'), 'y deja de estar activo');

  /* Apartado 4 — *"el módulo deja de funcionar activamente"*. */
  ok(!recomendarIdeas(off, { armario: ARM, limite: 50 }).ideas.some((i) => i.tema === 'perfumes'),
    '⚠️ y DEJA DE DAR IDEAS: *"no aparece en sugerencias"* (apartado 4)');
  ok(!descubrir(off, { limite: 50 }).tarjetas.some((t) => t.modulo === 'perfumes'),
    'ni tarjetas de Descubrir');
  ok(!metricasVisibles(off).some((m) => m.modulo === 'perfumes'), 'ni métricas');
  ok(!seccionesDePantalla(off, { armario: ARM }).flatMap((s) => s.modulos).some((m) => m.id === 'perfumes'),
    'ni sale en la portada');

  /* Apartado 12 — ⚠️ y sus datos SIGUEN AHÍ. */
  eq(cfg(off, 'perfumes'), cfg(e, 'perfumes'),
    '⚠️ pero sus datos NO se tocan (apartado 12 · prueba 10)');
  eq(auditarGestionEstilo().borradosAlDesactivar, 0, 'la auditoría: cero borrados al desactivar');

  /* Apartado 7 — *"recupera su funcionamiento anterior"*. */
  const vuelve = activarModulo(off, 'perfumes');
  eq(estadoDe(vuelve, 'perfumes'), 'activo', 'se puede reactivar (prueba 4)');
  eq(cfg(vuelve, 'perfumes'), cfg(e, 'perfumes'),
    '⚠️ *"no obliga a configurarlo desde cero"* (apartado 7)');
  ok(recomendarIdeas(vuelve, { armario: ARM, limite: 50 }).ideas.some((i) => i.tema === 'perfumes'),
    'y vuelve a funcionar entero');
  ok(TEXTOS_GESTION_EH.desactivarNoBorra.includes('meses'),
    '⚠️ y se dice: *"puedes tenerlo desactivado meses y volver"*');
  ok(TEXTOS_GESTION_EH.reactivar.includes('como lo dejaste'), 'con su frase al reactivar');

  /* ⚠️ Y ocultar y desactivar son INDEPENDIENTES. */
  const ocultoYoff = desactivarModulo(ocultarModulo(e, 'perfumes'), 'perfumes');
  eq(estaOculto(activarModulo(ocultoYoff, 'perfumes'), 'perfumes'), true,
    '⚠️ reactivar no des-oculta: son dos interruptores distintos');
}

/* ===========================================================================
   Test 4 — ELIMINAR VA A LA PAPELERA GLOBAL (apartados 5 y 6 · pruebas 5, 6 y 7)
   =========================================================================== */
console.log('\nTest 4 — 🗑️ eliminar, con recuperación');
{
  eq(auditarGestionEstilo().papelerasNuevas, 0,
    '⚠️ cero papeleras propias: la global de ME F3 (apartado 5)');
  ok(!/prepararEliminacion|DEFAULT_PAPELERA|elementos:\s*\[/.test(SIN_COMENTARIOS),
    'y el código no monta una');

  const e = conDatos();
  const plan = planEliminarDatos(e, 'perfumes');
  eq(plan.length, 3, 'el plan trae los tres elementos de Perfumes (dos perfumes y un uso)');
  ok(plan.every((x) => x.modulo === 'perfumes' && typeof x.id === 'string' && x.coleccion),
    '⚠️ con la forma que `eliminarConPapelera` necesita (prueba 5)');
  ok(plan.some((x) => x.coleccion === 'perfumes') && plan.some((x) => x.coleccion === 'historial'),
    'y de las dos colecciones');
  ok(plan.every((x) => !!x.tipo), 'cada uno con su tipo, para que la papelera lo describa (prueba 6)');

  /* ⚠️ El plan sale del CATÁLOGO de la papelera, no de una lista propia. */
  ok(CLAVES_PAPELERA_EH.every((k) => !!CATALOGO_PAPELERA[k]),
    '⚠️ las claves salen del catálogo de ME F3');
  ok(CLAVES_PAPELERA_EH.length >= 10, 'y son las de Estilo de hombre, todas');
  Object.keys(DONDE_VIVEN).forEach((k) => {
    ok(!!CATALOGO_PAPELERA[k], `"${k}" existe en el catálogo de la papelera`);
  });

  eq(planEliminarDatos(e, 'gustos'), [], 'un módulo sin datos no tiene nada que borrar');
  const aviso = avisoEliminarDatos(e, 'gustos');
  ok(aviso.vacio.includes('todavía no tiene datos'),
    '⚠️ y se dice, en vez de ofrecer un botón que no hace nada (regla 8)');

  const a = avisoEliminarDatos(e, 'perfumes');
  eq(a.texto, '⚠️ Esto eliminará los datos de este apartado.', 'la confirmación literal del apartado 5');
  ok(a.nota.includes('Eliminados recientemente'),
    '⚠️ diciendo que van a la papelera y se pueden recuperar (apartado 6 · prueba 7)');
  eq([a.cancelar, a.confirmar], ['Cancelar', 'Eliminar'], 'con sus dos opciones');

  /* ⚠️ Y este archivo NO borra: devuelve el plan. */
  ok(!/snapshotAndSave|filter\(\(x\) => x\.id !== /.test(SIN_COMENTARIOS),
    '⚠️ el archivo no borra nada: quien lo hace es App.jsx, dueño de la papelera');
}

/* ===========================================================================
   Test 5 — RESTABLECER (apartado 8 · prueba 8)
   =========================================================================== */
console.log('\nTest 5 — 🔄 restablecer Estilo de hombre');
{
  const base = con(TODOS_EH);
  const tocado = desactivarModulo(ocultarModulo(cambiarTamano(base, 'skincare', 'grande'), 'perfumes'), 'barba');

  const sin = restablecerEstilo(tocado);
  eq(sin.aplicado, false, '⚠️ decimoquinto `aplicarPlan`: sin `confirmado` no escribe');
  eq(sin.estado, normalizarEstiloHombre(tocado), 'y devuelve el estado tal cual');
  ok(sin.aviso.noBorra.includes('no elimina datos'), 'con su *"esto no elimina datos"*');
  ok(sin.aviso.siVuelven.includes('vuelve a verse'), '⚠️ y qué vuelve: lo que solo estaba oculto');
  ok(sin.aviso.noReactiva.includes('sigue desactivado'), '⚠️ y qué no: lo que él desactivó');

  const hecho = restablecerEstilo(tocado, { confirmado: true });
  eq(hecho.aplicado, true, 'confirmando, sí (prueba 8)');
  eq(datosPantalla(hecho.estado).tamanos, {}, 'los tamaños vuelven');
  eq(estaOculto(hecho.estado, 'perfumes'), false,
    '⚠️ y la VISIBILIDAD también: el apartado 8 la nombra');
  eq(estadoDe(hecho.estado, 'barba'), 'desactivado',
    '⚠️ pero lo DESACTIVADO sigue desactivado: eso no es diseño, lo decidió él');
  eq(cfg(hecho.estado, 'skincare'), cfg(tocado, 'skincare'), 'y no se toca ningún dato');
}

/* ===========================================================================
   Test 6 — LAS PARTES (apartado 9)
   =========================================================================== */
console.log('\nTest 6 — ⚠️ activación por partes, sin definir ninguna aquí');
{
  eq(auditarGestionEstilo().partesDefinidasAqui, 0,
    '⚠️ ni una parte se define aquí: las declara cada módulo desde su fase');
  ok(!/PARTES_[A-Z]+\s*=\s*\[/.test(SIN_COMENTARIOS), 'y el código no declara ninguna lista');

  const e = con(TODOS_EH);
  /* ⚠️ Se pregunta al CATÁLOGO cuál no tiene partes, en vez de escribir un id a
     mano: la F18 le dio partes a `cuerpo`, que era el que ponía aquí, y esta
     comprobación saltó **con algo que estaba bien**. Es la lección de siempre. */
  const sinPartes = MODULOS_EH.map((m) => m.id).find((id) => !PARTES_POR_MODULO[id]);
  ok(!!sinPartes, 'hay algún módulo que todavía no declara partes');
  eq(partesDe(e, sinPartes), [], '⚠️ un módulo sin partes devuelve []: la pantalla no pinta la sección');
  eq(partesDe(e, 'no_existe'), [], 'y un id que no existe, igual');
  const partes = partesDe(e, 'perfumes');
  ok(partes.length >= 5, 'Perfumes trae las suyas');
  ok(partes.every((p) => 'puesta' in p && p.nombre && p.id), 'con su marca, su nombre y su id');
  const rec = partes.find((p) => p.id === 'recomendaciones');
  ok(!!rec, 'el ejemplo del enunciado existe: 💡 Recomendaciones');
  eq(rec.puesta, true, 'y viene puesta');
  const sinRec = alternarParteDe(e, 'perfumes', 'recomendaciones');
  eq(partesDe(sinRec, 'perfumes').find((p) => p.id === 'recomendaciones').puesta, false,
    '⚠️ se puede apagar una parte SIN apagar el módulo (apartado 9)');
  eq(estadoDe(sinRec, 'perfumes'), 'activo', 'que sigue activo');
  eq(normalizarEstiloHombre(alternarParteDe(e, 'perfumes', 'inventada')), normalizarEstiloHombre(e),
    'una parte que no existe no se toca');
  eq(normalizarEstiloHombre(alternarParteDe(e, 'cuerpo', 'x')), normalizarEstiloHombre(e),
    'ni un módulo sin partes');
  Object.keys(PARTES_POR_MODULO).forEach((id) => {
    ok(!!moduloEH(id), `"${id}" es un módulo del catálogo`);
  });
}

/* ===========================================================================
   Test 7 — DEPENDENCIAS Y NADA OBLIGATORIO (apartados 10 y 11 · prueba 11)
   =========================================================================== */
console.log('\nTest 7 — ⚠️ se avisa, no se impone');
{
  eq(auditarGestionEstilo().obligatorios, 0, '⚠️ ningún módulo es obligatorio (apartado 10)');
  ok(TEXTOS_GESTION_EH.nadaObligatorio.includes('Ninguno'), 'y se dice');

  const e = con(TODOS_EH);
  /* ⚠️ Las tres declaradas son REALES: sin esas partes, registrar no funciona. */
  DEPENDENCIAS.forEach((d) => {
    ok(!!moduloEH(d.modulo), `la dependencia "${d.id}" apunta a un módulo de verdad`);
    ok(partesDe(e, d.modulo).some((p) => p.id === d.necesita),
      `⚠️ y a una parte que EXISTE en ${d.modulo}: "${d.necesita}"`);
  });
  eq(dependencia('inventada'), null, 'una que no existe da null');

  /* Sonrisa trae "seguimiento" apagado de fábrica: ahí sí hace falta el aviso. */
  const aviso = avisoDependencia(e, 'sonrisa_registros');
  ok(!!aviso, 'con la parte apagada, sale el aviso (prueba 11)');
  ok(aviso.texto.startsWith('Para utilizar'), '⚠️ con la frase del apartado 11, literal');
  eq([aviso.cancelar, aviso.confirmar], ['Cancelar', 'Activar'],
    '⚠️ y ofrece Activar o Cancelar: no impone nada');

  const sinConfirmar = resolverDependencia(e, 'sonrisa_registros');
  eq(sinConfirmar.aplicado, false, '⚠️ sin `confirmado` no activa nada');
  eq(sinConfirmar.estado, normalizarEstiloHombre(e), 'y el estado sale igual');
  const hecho = resolverDependencia(e, 'sonrisa_registros', { confirmado: true });
  eq(hecho.aplicado, true, 'confirmando, sí');
  eq(partesDe(hecho.estado, 'sonrisa').find((p) => p.id === 'seguimiento').puesta, true,
    'y la parte queda activada');
  eq(avisoDependencia(hecho.estado, 'sonrisa_registros'), null,
    '⚠️ y entonces el aviso desaparece: no se insiste');
  eq(avisoDependencia(e, 'perfumes_usos'), null,
    '⚠️ y con la parte ya puesta, NO se avisa de nada');
}

/* ===========================================================================
   Test 8 — BUSCAR, ORDENAR Y LO ESENCIAL (apartados 13, 14 y 15)
   =========================================================================== */
console.log('\nTest 8 — ⚠️ ni un buscador ni un orden nuevos');
{
  eq(auditarGestionEstilo().buscadoresNuevos, 0, '⚠️ cero buscadores nuevos (apartado 14)');
  eq(auditarGestionEstilo().listasDeOrden, 0, 'y cero listas de orden (apartado 15)');
  ok(!/function buscar[A-Z]|\.toLowerCase\(\)\.includes/.test(SIN_COMENTARIOS),
    'el código no escribe una búsqueda propia: es `buscarModulos` de la F2');

  const e = con(TODOS_EH);
  const r = buscarApartado(e, 'perfume');
  ok(r.some((m) => m.id === 'perfumes'), '⚠️ "Perfume" encuentra Perfumes, el ejemplo del enunciado');
  eq(buscarApartado(e, 'xyzxyz'), [], 'y algo que no existe no encuentra nada');

  const panel = panelGestionEstilo(e, { texto: 'perfume' });
  ok(panel.modulos.length >= 1 && panel.modulos.every((m) => /perfum/i.test(m.nombre) || m.terminos?.some((t) => /perfum/i.test(t))),
    'la pantalla filtra con eso');
  eq(panelGestionEstilo(e).modulos.length, MODULOS_EH.length,
    '⚠️ y sin texto salen TODOS, activos y no (apartado 1)');

  // Apartado 13 — un usuario nuevo no recibe una pantalla gigantesca.
  ok(ESENCIALES.length > 0 && ESENCIALES.length < MODULOS_EH.length,
    '⚠️ los esenciales son unos pocos, no el catálogo entero');
  ok(TEXTOS_GESTION_EH.esenciales.includes('lo esencial'), 'y se dice');
}

/* ===========================================================================
   Test 9 — LA FICHA, EL RESUMEN Y LA PERSISTENCIA (apartados 2, 16 · pruebas 13-15)
   =========================================================================== */
console.log('\nTest 9 — la pantalla y lo que sobrevive');
{
  const e = ocultarModulo(desactivarModulo(conDatos(), 'barba'), 'perfumes');
  const f = fichaGestion(e, 'perfumes');
  ok(!!f, 'cada módulo tiene su ficha');
  eq(f.estado, 'oculto', 'con su estado');
  eq(f.insignia.icono, '⚪', 'y su etiqueta pequeña (apartado 16)');
  ok(f.partes.length > 0, 'sus partes');
  eq(f.elementos, 3, 'cuántos elementos se irían a la papelera');
  ok(!!f.orden, 'y dónde está, para poder moverlo');
  eq(fichaGestion(e, 'inventado'), null, 'un módulo que no existe da null');

  const r = resumenGestionEstilo(e);
  eq(r.total, MODULOS_EH.length, 'el resumen cuenta el catálogo entero');
  eq(r.ocultos, 1, 'los ocultos');
  eq(r.desactivados, MODULOS_EH.length - TODOS_EH.length + 1, 'los desactivados');
  eq(r.enLaPortada, modulosVisibles(e).length, 'y los que se pintan en la portada');
  eq(r.activos + r.ocultos + r.desactivados, r.total, '⚠️ y los tres estados suman el total');

  /* ⚠️ Pruebas 13, 14 y 15 — cerrar sesión, volver y que siga. `oculto` es un
     campo del módulo, así que va a Supabase con todo lo demás. */
  const releido = normalizarEstiloHombre(JSON.parse(JSON.stringify(e)));
  eq(estaOculto(releido, 'perfumes'), true,
    '⚠️ PERSISTENCIA: `oculto` sobrevive a guardar y volver a leer (regla 5 · prueba 15)');
  eq(estadoDe(releido, 'barba'), 'desactivado', 'y lo desactivado también');
  eq(cfg(releido, 'perfumes'), cfg(e, 'perfumes'), 'con sus datos');
  eq(normalizarEstiloHombre({ modulos: [{ id: 'perfumes' }] }).modulos.find((m) => m.id === 'perfumes').oculto,
    false, '⚠️ y lo guardado ANTES de la F36 no se esconde solo: sin el campo, `false`');

  ok(textosDeGestionEstilo().every((t) => typeof t === 'string' && t.length > 0), 'ningún texto vacío');
  /* ⚠️ **Buscar "obligatorio" aquí sería la trampa de siempre**, por sexta vez en
     el bloque: la frase que dice que NO hay nada obligatorio contiene la palabra.
     Lo que se comprueba es que ningún texto MANDE, y el mecanismo —que ningún
     módulo esté marcado como obligatorio— ya lo mira la auditoría del Test 7. */
  ok(!textosDeGestionEstilo().some((t) => /\bdebes\b|tienes que|hay que\b/i.test(t)),
    'y ninguno le manda');
  ok(textosDeGestionEstilo().some((t) => /Ninguno es obligatorio/.test(t)),
    '⚠️ al contrario: se dice que ninguno lo es');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
