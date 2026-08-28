// ============================================================================
// EH · Fase 27/65 — Gustos, intereses y cosas que quiero hacer
//
// Las quince pruebas del apartado 15, y lo que gobierna la fase:
//   · "cosas que te gustan" y "que te gustaría hacer" YA EXISTEN en el registro
//   · "quiero hacer" NO es una tarea (apartado 4)
//   · la fecha llega al calendario, pero nadie crea un evento (apartado 7)
//   · "Mis preferencias" no es una cuarta lista: es la vista del registro
// ============================================================================

import { readFileSync } from 'node:fs';
import { DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, moduloEH } from '../src/lib/estiloDeHombre.js';
import { REGISTRO_DATOS, leerDato, guardarDato, origenDe } from '../src/lib/datosEstiloHombre.js';
import { CATALOGO_PAPELERA, describirEntrada } from '../src/lib/papelera.js';
import { CAMPOS_PERFIL_ESTILO } from '../src/lib/perfilEstilo.js';
import { eventosDerivados, NOMBRES_ORIGEN } from '../src/lib/calendarioIntegracion.js';
import {
  MODULO_GUSTOS, TEXTOS_GUSTOS, DESTINO_DIARIO, TIPOS_GUSTO, tipoGusto, TIPOS_CON_REGISTRO,
  PARTES_GUSTOS, parteGustos, PLAQUITAS_GUSTOS, CATEGORIAS_GUSTO, categoriaGusto,
  PRIORIDADES_GUSTO, prioridadGusto, ESTADOS_HACER, estadoHacer, MAX_NOMBRE_GUSTO,
  MAX_NOTA_GUSTO, DEFAULT_GUSTOS, normalizarEntradaGusto, normalizarGustos, datosGustos,
  decirAhoraNoGustos, configurarGustos, parteActivaGustos, alternarParteGustos,
  estadoDeEntradaGustos, tipoActivo, entradasDeGustos, entradaDeGustos, sueltosDelPerfil,
  anadirGusto, editarGusto, alternarFavoritoGusto, cambiarEstadoGusto, ponerFechaGusto,
  completarSuelto, eliminarGusto, restaurarGusto, eventosDeGustos, misPreferencias,
  paraPersonalizar, resumenGustos, auditarGustos, textosDeGustos, panelGustos,
} from '../src/lib/gustos.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-28';
const base = () => configurarGustos(
  configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['gustos', 'estilo']), { hoy: HOY },
).estado;
const con = (datos = {}, e = base()) => {
  const r = anadirGusto(e, { nombre: 'Fútbol', tipo: 'gusta', categoria: 'deportes', ...datos }, { hoy: HOY });
  return { estado: r.estado, entrada: r.entrada, error: r.error, sinEfecto: r.sinEfecto };
};

console.log('\n❤️  EH · Fase 27/65 — Gustos, intereses y cosas que quiero hacer\n');

/* ===========================================================================
   Test 1 — LA PLAQUITA Y LOS CUATRO BLOQUES (apartado 1)
   =========================================================================== */
console.log('Test 1 — la plaquita y sus cuatro bloques');
{
  ok(!!moduloEH('gustos'), 'el módulo está en el catálogo de la Fase 1');
  eq(moduloEH('gustos').icono, '❤️', 'con el icono del enunciado');
  eq(moduloEH('gustos').categoria, 'bienestar', 'en la categoría de bienestar');
  ok(moduloEH('gustos').terminos.includes('intereses'), '"intereses" lo encuentra en el buscador');

  /* ⚠️ Se comprueba QUE ESTÉN LOS QUE TIENEN QUE ESTAR, no cuántos hay: la F28
     añadió 'experiencias' con todo el derecho y una cuenta exacta habría saltado
     con algo que está bien. Es la lección de `test-papelera.mjs`. */
  ['me_gusta', 'quiero_hacer', 'intereses', 'preferencias'].forEach((id) => {
    ok(PARTES_GUSTOS.some((p) => p.id === id), `el bloque "${id}" del apartado 1 existe`);
  });
  eq(PARTES_GUSTOS.slice(0, 4).map((p) => p.nombre),
    ['Me gusta', 'Quiero hacer', 'Mis intereses', 'Mis preferencias'],
    'los cuatro del apartado 1, con sus nombres y en su orden');
  ok(PARTES_GUSTOS.every((p) => p.porDefecto), 'los cuatro nacen encendidos');
  ok(PLAQUITAS_GUSTOS.every((p) => p.listo), '⚠️ Regla 8 — las cuatro funcionan hoy');

  eq(TEXTOS_GUSTOS.pregunta, '¿Quieres utilizar este apartado?', 'la pregunta de la entrada');
  const vacio = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['gustos']);
  eq(estadoDeEntradaGustos(vacio), 'sin_configurar', 'sin tocar nada, sin configurar');
  eq(estadoDeEntradaGustos(decirAhoraNoGustos(vacio).estado), 'ahora_no', '"Ahora no" se recuerda');
  eq(estadoDeEntradaGustos(base()), 'configurado', 'y se puede configurar');
  eq(datosGustos(base()).editado, HOY, 'con la fecha en la que lo hizo');
}

/* ===========================================================================
   Test 2 — ⚠️ LOS NOMBRES YA VIVÍAN EN EL REGISTRO (decisión 1)
   =========================================================================== */
console.log('\nTest 2 — ⚠️ ni una segunda lista de "cosas que me gustan"');
{
  ok(!!REGISTRO_DATOS.find((d) => d.id === 'intereses'),
    '"Cosas que te gustan" ya estaba en el registro de la Fase 4');
  ok(!!REGISTRO_DATOS.find((d) => d.id === 'quiereHacer'),
    'y "Cosas que te gustaría hacer" también');
  ok(REGISTRO_DATOS.find((d) => d.id === 'intereses').usan.includes('gustos'),
    '⚠️ y el módulo se declara como uno de los que lo usan');
  ok(REGISTRO_DATOS.find((d) => d.id === 'quiereHacer').usan.includes('gustos'), 'los dos');
  ok(CAMPOS_PERFIL_ESTILO.some((c) => c.id === 'intereses'),
    'el perfil de estilo (F6) los pregunta desde entonces');
  eq(origenDe('intereses'), 'propio', 'y son datos propios, así que se pueden escribir');
  eq(TIPOS_CON_REGISTRO.map((t) => t.dato), ['intereses', 'quiereHacer'],
    'los dos tipos con campo en el registro, declarados');
  eq(tipoGusto('interes').dato, null, '⚠️ y "Mis intereses" no tiene ninguno: está escrito, no olvidado');

  const r = con();
  eq(leerDato(r.estado, 'intereses').valor, ['Fútbol'],
    '⚠️ añadir un gusto DEJA SU NOMBRE EN EL REGISTRO, donde ya vivía');
  const h = anadirGusto(r.estado, { nombre: 'Viajar a Londres', tipo: 'hacer' }, { hoy: HOY });
  eq(leerDato(h.estado, 'quiereHacer').valor, ['Viajar a Londres'], 'y lo mismo con "Quiero hacer"');
  eq(leerDato(h.estado, 'intereses').valor, ['Fútbol'], 'sin mezclar los dos campos');
  eq(auditarGustos(r.estado).listasDuplicadas, 0, 'la auditoría: cero listas duplicadas');
  eq(auditarGustos(r.estado).datosDelRegistroSincronizados, ['intereses', 'quiereHacer'],
    '⚠️ y declara lo que SÍ escribe, en vez de esconderlo');
}

/* ===========================================================================
   Test 3 — LO QUE ESCRIBIÓ EN EL PERFIL SALE AQUÍ (apartado 2)
   =========================================================================== */
console.log('\nTest 3 — lo del perfil de estilo sale aquí, sin duplicarse');
{
  const conPerfil = guardarDato(base(), 'intereses', ['Piano', 'Montaña']).estado;
  eq(sueltosDelPerfil(conPerfil, 'gusta'), ['Piano', 'Montaña'],
    '⚠️ lo que escribió en el perfil de estilo sale como entrada suelta');
  eq(entradasDeGustos(conPerfil, 'gusta').length, 0, 'todavía sin ficha');

  const r = completarSuelto(conPerfil, 'gusta', 'Piano', { categoria: 'musica' }, { hoy: HOY });
  eq(r.error, null, 'y se puede completar');
  eq(entradasDeGustos(r.estado, 'gusta').map((x) => x.nombre), ['Piano'], 'pasa a tener ficha');
  eq(sueltosDelPerfil(r.estado, 'gusta'), ['Montaña'], 'y deja de estar suelto');
  eq(leerDato(r.estado, 'intereses').valor, ['Montaña', 'Piano'],
    '⚠️ SIN DUPLICARSE en el registro: sigue habiendo un solo "Piano"');
  ok(!!completarSuelto(conPerfil, 'gusta', 'Nada de eso', {}).error,
    'completar algo que no está en el perfil se dice');
  eq(sueltosDelPerfil(base(), 'interes'), [],
    '"Mis intereses" no tiene campo en el registro, así que no tiene sueltos');
}

/* ===========================================================================
   Test 4 — AÑADIR, EDITAR Y CATEGORÍAS (apartados 2 y 3)
   =========================================================================== */
console.log('\nTest 4 — añadir, editar y organizar');
{
  const r = con();
  eq(r.error, null, 'se añade sin error');
  eq(entradasDeGustos(r.estado).length, 1, 'y queda una entrada');
  eq(entradasDeGustos(r.estado)[0].nombre, 'Fútbol', 'con su nombre');
  eq(entradasDeGustos(r.estado)[0].categoria, 'deportes', 'y su categoría');
  eq(entradasDeGustos(r.estado)[0].categoriaNombre.icono, '⚽', 'resuelta con su icono');

  eq(CATEGORIAS_GUSTO.length, 11, 'las once del apartado 3');
  eq(CATEGORIAS_GUSTO.map((c) => c.nombre), ['Deportes', 'Música', 'Cine y series', 'Viajes',
    'Comida', 'Tecnología', 'Moda', 'Hobbies', 'Lugares', 'Experiencias', 'Otros'],
  'con sus nombres y en su orden');
  eq(normalizarEntradaGusto({ nombre: 'X', categoria: 'inventada' }).categoria, 'otros',
    'una categoría que no existe cae en "Otros"');

  const ed = editarGusto(r.estado, r.entrada.id, { categoria: 'hobbies', nota: 'Los domingos' });
  eq(entradasDeGustos(ed.estado)[0].categoria, 'hobbies', 'se puede editar la categoría');
  eq(entradasDeGustos(ed.estado)[0].nota, 'Los domingos', 'y la nota');
  const ren = editarGusto(r.estado, r.entrada.id, { nombre: 'Fútbol sala' });
  eq(leerDato(ren.estado, 'intereses').valor, ['Fútbol sala'],
    '⚠️ y renombrar SACA el nombre viejo del registro: si no, se quedaría allí para siempre');
  ok(!!editarGusto(r.estado, r.entrada.id, { nombre: '  ' }).error, 'un nombre vacío no se acepta');
  ok(!!editarGusto(r.estado, 'noexiste', {}).error, 'editar lo que no existe se dice');
  ok(con({}, r.estado).sinEfecto, 'el mismo nombre en el mismo bloque no se duplica');
  ok(!con({ nombre: '   ' }).entrada, 'sin nombre no hay entrada');
  eq(normalizarEntradaGusto({ nombre: 'x'.repeat(400) }).nombre.length, MAX_NOMBRE_GUSTO,
    'el nombre se recorta al máximo');
}

/* ===========================================================================
   Test 5 — "QUIERO HACER" ESTÁ SEPARADO Y NO ES UNA TAREA (apartado 4)
   =========================================================================== */
console.log('\nTest 5 — ⚠️ "Quiero hacer" no es una lista de tareas');
{
  const r = con();
  const h = anadirGusto(r.estado, { nombre: 'Aprender surf', tipo: 'hacer' }, { hoy: HOY });
  eq(entradasDeGustos(h.estado, 'gusta').map((x) => x.nombre), ['Fútbol'], 'cada bloque va por su lado');
  eq(entradasDeGustos(h.estado, 'hacer').map((x) => x.nombre), ['Aprender surf'],
    '*"separado completamente de Me gusta"*');
  eq(auditarGustos(h.estado).tareasCreadas, 0, '⚠️ y NI UNA TAREA creada');

  const fuente = readFileSync(new URL('../src/lib/gustos.js', import.meta.url), 'utf8');
  ok(!/from '\.\/productividad/.test(fuente), '⚠️ el módulo no importa nada de Productividad');
  ok(!/from '\.\/diario/.test(fuente), 'ni del Diario (apartado 10)');
  ok(!/from '\.\/calendario/.test(fuente), 'ni del Calendario: los eventos son derivados');
  ok(!/\bpedirIA|askAI|anthropic/i.test(fuente), 'y no llama a la IA');
  ok(TEXTOS_GUSTOS.noEsTarea.includes('no te va a aparecer'),
    '⚠️ y se le dice en la pantalla, no solo en el código');

  // El tipo no se cambia editando: cambiaría de campo del registro sin avisar.
  const movido = editarGusto(h.estado, h.entrada.id, { tipo: 'gusta' });
  eq(entradasDeGustos(movido.estado, 'hacer').length, 1, '⚠️ editar NO mueve una entrada de bloque');
}

/* ===========================================================================
   Test 6 — PRIORIDAD, SIN PRESIÓN (apartado 5)
   =========================================================================== */
console.log('\nTest 6 — la prioridad es opcional y no aprieta');
{
  eq(PRIORIDADES_GUSTO.map((p) => p.nombre),
    ['Me interesa', 'Me interesa mucho', 'Quiero hacerlo algún día'],
    'las tres del enunciado, literales');
  eq(con().entrada.prioridad, null,
    '⚠️ `null` a propósito: no elegir no es "me interesa"');
  const r = con();
  const p = editarGusto(r.estado, r.entrada.id, { prioridad: 'interesa_mucho' });
  eq(entradasDeGustos(p.estado)[0].prioridad, 'interesa_mucho', 'y se puede poner');
  eq(entradasDeGustos(p.estado)[0].prioridadNombre.nombre, 'Me interesa mucho', 'resuelta con su nombre');
  eq(normalizarEntradaGusto({ nombre: 'X', prioridad: 'urgente' }).prioridad, null,
    'una prioridad que no existe no se guarda');
  ok(!PRIORIDADES_GUSTO.some((x) => /urgente|pendiente|atrasado/i.test(x.nombre)),
    '⚠️ y ninguna mete prisa: *"no crear presión"*');
  ok(!prioridadGusto('nada'), 'la búsqueda de una prioridad que no existe da null');
}

/* ===========================================================================
   Test 7 — EL ESTADO ES SOLO DE "QUIERO HACER" (apartado 6)
   =========================================================================== */
console.log('\nTest 7 — el estado, y el historial que no se borra');
{
  eq(ESTADOS_HACER.map((e) => e.nombre), ['Idea', 'Quiero hacerlo', 'Ya lo hice', 'Ya no me interesa'],
    'los cuatro del enunciado');
  eq(ESTADOS_HACER.map((e) => e.icono), ['💭', '🎯', '✅', '❌'], 'con sus iconos');

  const r = con();
  eq(entradasDeGustos(r.estado)[0].estado, null,
    '⚠️ un "Me gusta" NO tiene estado: el apartado 6 dice *"para Quiero hacer"*');
  const h = anadirGusto(r.estado, { nombre: 'Viajar a Japón', tipo: 'hacer' }, { hoy: HOY });
  eq(entradasDeGustos(h.estado, 'hacer')[0].estado, 'idea', 'y uno de "Quiero hacer" nace como idea');

  const hecho = cambiarEstadoGusto(h.estado, h.entrada.id, 'hecho');
  eq(entradasDeGustos(hecho.estado, 'hacer')[0].estado, 'hecho', 'se puede marcar "Ya lo hice"');
  eq(entradasDeGustos(hecho.estado, 'hacer').length, 1,
    '⚠️ y NO se borra: *"esto permite conservar el historial sin eliminarlo"*');
  eq(leerDato(hecho.estado, 'quiereHacer').valor, ['Viajar a Japón'], 'ni sale del registro');
  ok(!!cambiarEstadoGusto(r.estado, r.entrada.id, 'hecho').error,
    '⚠️ un "Me gusta" no admite estado, y se dice');
  ok(!!cambiarEstadoGusto(h.estado, h.entrada.id, 'inventado').error, 'un estado que no existe tampoco');
  ok(!!cambiarEstadoGusto(h.estado, 'noexiste', 'hecho').error, 'ni sobre algo que no existe');
  eq(ESTADOS_HACER.filter((e) => e.abierto).map((e) => e.id), ['idea', 'quiero'],
    'dos siguen abiertos y dos son historial');
}

/* ===========================================================================
   Test 8 — LA FECHA Y EL CALENDARIO (apartado 7)
   =========================================================================== */
console.log('\nTest 8 — ⚠️ la fecha llega al calendario, pero nadie crea un evento');
{
  const r = con();
  eq(entradasDeGustos(r.estado)[0].fecha, null, 'sin fecha por defecto');
  eq(eventosDeGustos(r.estado, '2026-08-01', '2026-12-31'), [], 'y sin fecha no hay evento');

  const f = ponerFechaGusto(r.estado, r.entrada.id, '2026-09-10');
  eq(f.error, null, 'se puede poner una fecha');
  const ev = eventosDeGustos(f.estado, '2026-09-01', '2026-09-30');
  eq(ev.length, 1, 'y sale en el calendario');
  eq(ev[0].soloLectura, true, '⚠️ de SOLO LECTURA: *"no crear automáticamente ningún evento"*');
  eq(ev[0].origen, 'gustos', 'con su origen');
  eq(ev[0].origenId, r.entrada.id, 'y apuntando a la entrada');
  eq(ev[0].todoElDia, true, 'todo el día: no le pone una hora que él no ha dicho');
  eq(NOMBRES_ORIGEN.gustos, 'Mis gustos', 'y el calendario sabe cómo se llama el origen');

  eq(eventosDeGustos(f.estado, '2026-08-01', '2026-08-31').length, 0,
    '⚠️ FILTRADO POR EL RANGO que se pide: la lección de la Fase 23');
  const sinFecha = ponerFechaGusto(f.estado, r.entrada.id, null);
  eq(eventosDeGustos(sinFecha.estado, '2026-09-01', '2026-09-30').length, 0,
    'quitar la fecha hace desaparecer el evento, porque es derivado');
  ok(!!ponerFechaGusto(r.estado, r.entrada.id, '2026-13-45').error, 'una fecha imposible no se acepta');
  ok(!!ponerFechaGusto(r.estado, r.entrada.id, 'mañana').error, 'ni una que no lo sea');

  // ⚠️ Lo que ya hizo no se pinta en el futuro.
  const h = anadirGusto(r.estado, { nombre: 'Viajar a Japón', tipo: 'hacer', fecha: '2026-09-15' }, { hoy: HOY });
  eq(eventosDeGustos(h.estado, '2026-09-01', '2026-09-30').length, 1, 'lo que quiere hacer sí sale');
  const ya = cambiarEstadoGusto(h.estado, h.entrada.id, 'hecho');
  eq(eventosDeGustos(ya.estado, '2026-09-01', '2026-09-30').length, 0,
    '⚠️ y lo que YA HIZO deja de salir: es historial, no plan');

  // Y entra por la puerta del calendario global, no por una nueva.
  const derivados = eventosDerivados({
    estiloHombre: h.estado, desde: '2026-09-01', hasta: '2026-09-30',
  });
  ok(derivados.some((x) => x.origen === 'gustos'),
    '⚠️ y llega al calendario GLOBAL, por la misma puerta que Pelo, Piel, Barba y Sonrisa');
  eq(auditarGustos(r.estado).calendariosNuevos, 0, 'la auditoría: cero calendarios nuevos');
  eq(auditarGustos(r.estado).eventosGuardados, 0, 'y cero eventos guardados');
}

/* ===========================================================================
   Test 9 — LUGARES, FAVORITOS Y NOTAS (apartados 8, 9 y 10)
   =========================================================================== */
console.log('\nTest 9 — lugar, favorito y nota');
{
  const r = con({ lugar: 'Sierra Nevada' });
  eq(entradasDeGustos(r.estado)[0].lugar, 'Sierra Nevada', 'el lugar se guarda (apartado 8)');
  eq(con().entrada.lugar, '', 'y está vacío si no dice ninguno');

  eq(con().entrada.favorito, false, 'nada nace favorito');
  const fav = alternarFavoritoGusto(r.estado, r.entrada.id);
  eq(entradasDeGustos(fav.estado)[0].favorito, true, 'se puede marcar favorito');
  eq(entradasDeGustos(alternarFavoritoGusto(fav.estado, r.entrada.id).estado)[0].favorito, false,
    'y quitar');
  ok(!!alternarFavoritoGusto(r.estado, 'noexiste').error, 'sobre algo que no existe se dice');
  eq(auditarGustos(r.estado).favoritosNuevos, 0, '⚠️ sin un sistema de favoritos aparte (apartado 9)');

  eq(normalizarEntradaGusto({ nombre: 'X', nota: 'y'.repeat(600) }).nota.length, MAX_NOTA_GUSTO,
    '⚠️ la nota es CORTA: lo extenso es del Diario');
  eq(DESTINO_DIARIO, 'diario', 'y la pantalla lleva al Diario que ya existe');
  ok(TEXTOS_GUSTOS.abrirDiario.includes('Diario'), 'con su botón');
  eq(auditarGustos(r.estado).diariosNuevos, 0, '⚠️ *"pero no convertirlo en diario"*: cero');
}

/* ===========================================================================
   Test 10 — MIS PREFERENCIAS NO ES UNA CUARTA LISTA (apartado 1)
   =========================================================================== */
console.log('\nTest 10 — ⚠️ "Mis preferencias" es la vista del registro');
{
  const p = misPreferencias(base());
  ok(p.length > 0, 'salen las preferencias que ya tiene declaradas');
  eq(p.length, REGISTRO_DATOS.filter((d) => d.clase === 'preferencia').length,
    '⚠️ exactamente las que el registro de la Fase 4 marca como preferencia');
  ok(p.every((x) => x.editableAqui === false),
    '⚠️ y NINGUNA se edita aquí: se dice dónde, como hace la Fase 12 con `tiempoPelo`');
  ok(p.every((x) => x.donde), 'cada una con su sitio');
  ok(p.every((x) => typeof x.texto === 'string'), 'y con su texto, aunque esté vacía');
  ok(p.some((x) => x.id === 'estilosFavoritos'), 'incluidos los estilos favoritos de la Fase 6');
  eq(panelGustos(alternarParteGustos(base(), 'preferencias')).preferencias, null,
    '⚠️ y con la parte apagada devuelve `null`, no una lista vacía');
}

/* ===========================================================================
   Test 11 — NUNCA SE TOCA OTRO MÓDULO (apartado 11)
   =========================================================================== */
console.log('\nTest 11 — lo que otros podrán leer, y nada más');
{
  let e = con().estado;
  const h = anadirGusto(e, { nombre: 'Viajar a Londres', tipo: 'hacer' }, { hoy: HOY });
  e = anadirGusto(h.estado, { nombre: 'Fotografía', tipo: 'interes' }, { hoy: HOY }).estado;

  const p = paraPersonalizar(e);
  eq(p.gustos, ['Fútbol'], 'lo que le gusta');
  eq(p.quiereHacer, ['Viajar a Londres'], 'lo que quiere hacer');
  eq(p.intereses, ['Fotografía'], 'y sus intereses — el ejemplo del apartado 12, entero');
  eq(p.soloLectura, true, '⚠️ escrito en el propio dato: esto se lee, no se aplica');
  eq(auditarGustos(e).modulosModificados, 0, '⚠️ *"nunca modificar automáticamente otros módulos"*');

  const hecho = cambiarEstadoGusto(e, h.entrada.id, 'hecho');
  eq(paraPersonalizar(hecho.estado).quiereHacer, [],
    '⚠️ y lo que ya hizo sale de "quiere hacer": no es un plan');
  const apagado = alternarParteGustos(e, 'quiero_hacer');
  eq(paraPersonalizar(apagado).quiereHacer, [], 'un bloque apagado no aporta nada');
}

/* ===========================================================================
   Test 12 — DESACTIVAR Y REACTIVAR (apartado 13)
   =========================================================================== */
console.log('\nTest 12 — todo independiente');
{
  const r = con();
  const sinGustos = alternarParteGustos(r.estado, 'me_gusta');
  ok(!parteActivaGustos(sinGustos, 'me_gusta'), 'se apaga "Me gusta"');
  ok(parteActivaGustos(sinGustos, 'quiero_hacer'), 'manteniendo "Quiero hacer" (el ejemplo del enunciado)');
  eq(entradasDeGustos(sinGustos).length, 0, 'y sus entradas dejan de enseñarse');
  eq(datosGustos(sinGustos).entradas.length, 1, '⚠️ pero NO se borran: apagar no borra');
  eq(eventosDeGustos(ponerFechaGusto(sinGustos, r.entrada.id, '2026-09-10').estado, '2026-09-01', '2026-09-30').length, 0,
    'ni salen en el calendario');
  ok(!!anadirGusto(sinGustos, { nombre: 'Otra', tipo: 'gusta' }).error,
    'y no se puede añadir a un bloque apagado');
  eq(entradasDeGustos(alternarParteGustos(sinGustos, 'me_gusta')).length, 1,
    'al reactivarlo vuelve todo');
  eq(alternarParteGustos(r.estado, 'inventada'), normalizarEstiloHombre(r.estado),
    'una parte que no existe no cambia nada');
  ok(!panelGustos(sinGustos).plaquitas.some((p) => p.id === 'me_gusta'),
    'y la plaquita apagada no se enseña');
  ok(panelGustos(sinGustos).plaquitas.some((p) => p.id === 'quiero_hacer'),
    'mientras que las demás siguen ahí');
  ok(!tipoActivo(sinGustos, 'gusta'), 'el tipo queda inactivo');
  ok(!tipoActivo(r.estado, 'inventado'), 'y un tipo que no existe nunca está activo');
}

/* ===========================================================================
   Test 13 — ELIMINAR Y RECUPERAR (apartado 14)
   =========================================================================== */
console.log('\nTest 13 — a la papelera global, y vuelve entero');
{
  ok(!!CATALOGO_PAPELERA['gustos.entradas'], 'la colección está en el catálogo global');
  eq(CATALOGO_PAPELERA['gustos.entradas'].tipo, 'Gusto o interés', 'con su nombre para el usuario');
  eq(auditarGustos(base()).papelerasNuevas, 0, '⚠️ *"no crear papelera propia"*: cero');

  const r = con({ nota: 'Los domingos', lugar: 'El parque' });
  const del = eliminarGusto(r.estado, r.entrada.id, { ahora: '2026-08-28T10:00:00.000Z' });
  eq(del.error, null, 'se borra sin error');
  eq(entradasDeGustos(del.estado).length, 0, 'y desaparece');
  eq(leerDato(del.estado, 'intereses').valor, [],
    '⚠️ Y SU NOMBRE SALE DEL REGISTRO: dejarlo sería que el perfil siguiera diciendo que le gusta');
  eq(sueltosDelPerfil(del.estado, 'gusta'), [], 'así que tampoco vuelve como entrada suelta');
  eq(describirEntrada(del.entrada), 'Fútbol', 'la papelera lo identifica por su nombre');

  const vuelto = restaurarGusto(del.estado, del.entrada);
  eq(entradasDeGustos(vuelto.estado).length, 1, 'restaurar lo devuelve');
  eq(entradasDeGustos(vuelto.estado)[0].nota, 'Los domingos', 'con su nota');
  eq(entradasDeGustos(vuelto.estado)[0].lugar, 'El parque', 'y su lugar');
  eq(leerDato(vuelto.estado, 'intereses').valor, ['Fútbol'], '⚠️ y vuelve también al registro');
  ok(!eliminarGusto(r.estado, 'noexiste').entrada, 'borrar lo que no existe se dice');
  ok(!!restaurarGusto(r.estado, null).error, 'y restaurar sin entrada, también');
}

/* ===========================================================================
   Test 14 — PERSISTENCIA (regla 5)
   =========================================================================== */
console.log('\nTest 14 — persistencia: el normalizador no se lleva nada');
{
  let e = con({ lugar: 'El parque', nota: 'Los domingos', prioridad: 'interesa' }).estado;
  const h = anadirGusto(e, { nombre: 'Viajar a Japón', tipo: 'hacer', fecha: '2026-09-10' }, { hoy: HOY });
  e = alternarFavoritoGusto(h.estado, h.entrada.id).estado;

  const antes = datosGustos(e);
  const despues = normalizarGustos(JSON.parse(JSON.stringify(antes)));
  eq(despues, antes, '⚠️ guardar y volver a leer devuelve exactamente lo mismo (regla 5)');
  Object.keys(DEFAULT_GUSTOS).forEach((k) => {
    ok(k in despues, `el campo "${k}" sobrevive al normalizador`);
  });
  const uno = despues.entradas[1];
  ['id', 'tipo', 'nombre', 'categoria', 'prioridad', 'estado', 'fecha', 'lugar', 'nota', 'favorito', 'creadoEn']
    .forEach((c) => ok(c in uno, `y el campo "${c}" de cada entrada`));

  eq(normalizarGustos(null).entradas, [], 'un guardado corrupto no revienta');
  eq(normalizarGustos({}).partes.me_gusta, true, 'las partes vuelven a su valor por defecto');
  eq(normalizarGustos({ partes: { me_gusta: false } }).partes.me_gusta, false,
    'respetando lo que él había apagado');
  eq(normalizarGustos({ entradas: [{ tipo: 'gusta' }] }).entradas, [], 'una entrada sin nombre no es nada');
  eq(normalizarEntradaGusto({ nombre: 'X', tipo: 'inventado' }).tipo, 'gusta',
    'un tipo que no existe cae en "Me gusta"');
  eq(normalizarEntradaGusto({ nombre: 'X', tipo: 'hacer', estado: 'raro' }).estado, 'idea',
    'y un estado raro, en "Idea"');
}

/* ===========================================================================
   Test 15 — RESUMEN, PANEL Y TEXTOS
   =========================================================================== */
console.log('\nTest 15 — el panel que dibuja la pantalla');
{
  let e = con().estado;
  e = anadirGusto(e, { nombre: 'Viajar a Londres', tipo: 'hacer', fecha: '2026-09-10' }, { hoy: HOY }).estado;
  e = anadirGusto(e, { nombre: 'Fotografía', tipo: 'interes' }, { hoy: HOY }).estado;

  const res = resumenGustos(e);
  eq(res.total, 3, 'el resumen cuenta las tres');
  eq(res.gusta, 1, 'una de "Me gusta"');
  eq(res.hacer, 1, 'una de "Quiero hacer"');
  eq(res.interes, 1, 'y un interés');
  eq(res.conFecha, 1, 'una con fecha');
  eq(res.hechas, 0, 'ninguna hecha todavía');
  eq(res.sueltos, 0, 'y nada suelto en el perfil');
  eq(res.partesActivas, PARTES_GUSTOS.length, 'con todos los bloques encendidos');

  const p = panelGustos(e);
  eq(p.estado, 'configurado', 'el panel sabe en qué estado está');
  eq(p.porTipo.length, 3, 'con los tres tipos');
  eq(p.porTipo.find((t) => t.id === 'hacer').entradas.length, 1, 'cada uno con lo suyo');
  eq(p.categorias.length, 11, 'ofrece las once categorías');
  eq(p.prioridades.length, 3, 'las tres prioridades');
  eq(p.estados.length, 4, 'y los cuatro estados');
  ok(Array.isArray(p.preferencias), 'y la vista de preferencias');

  ok(textosDeGustos().length > 20, 'los textos del módulo se pueden barrer');
  ok(textosDeGustos().every((t) => typeof t === 'string' && t.length > 0), 'y ninguno está vacío');
  ok(!textosDeGustos().some((t) => /debes|tienes que|obligatorio/i.test(t)),
    '⚠️ y ninguno le manda: *"no crear presión"*');
  ok(!!parteGustos('me_gusta') && !parteGustos('nada'), 'la búsqueda de partes funciona');
  ok(!!categoriaGusto('deportes') && !categoriaGusto('nada'), 'la de categorías, también');
  ok(!!estadoHacer('idea') && !estadoHacer('nada'), 'y la de estados');
  eq(entradaDeGustos(e, 'noexiste'), null, 'pedir una entrada que no existe da null');
  eq(MODULO_GUSTOS, 'gustos', 'y el módulo se llama como su línea del catálogo');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
