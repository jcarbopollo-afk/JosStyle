// ============================================================================
// EH · Fase 41/65 — Estados vacíos, carga, errores y recuperación
//
// Las quince pruebas del apartado 17, y lo que gobierna la fase:
//   · todo estado responde a QUÉ HA PASADO → QUÉ PUEDE HACER → QUÉ PASA CON SUS DATOS
//   · nunca una pantalla vacía, y nunca un vacío sin botón
//   · tres estados del enunciado NO se pueden detectar hoy, y se dice
//   · un dato corrupto NO rompe la pantalla — y para verlo hay que mirar lo GUARDADO
//   · antes de borrar se dice adónde va, y solo cuando es verdad
//   · y el permiso no se pide dos veces
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre,
  alternarModulo, guardarConfig, moduloEH, IDS_EH,
} from '../src/lib/estiloDeHombre.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { anadirPerfume, datosPerfumes } from '../src/lib/perfumes.js';
import { anadirGusto, datosGustos } from '../src/lib/gustos.js';
import {
  ESTADOS_EH, estadoEH, ESTADOS_DETECTABLES, ESTADOS_SIN_MECANISMO,
  MENSAJES_HECHO, DURACION_FEEDBACK_MS, TARJETAS_DE_CARGA, TEXTOS_ESTADOS,
  COLECCIONES_EH, coleccionEH, estadoDeColeccion, estadosVacios,
  elementosProblematicos, avisoDeCorrupto, estadoDeAcceso, estadoDeEliminado,
  avisoDeBorrado, hayConexion, estadoDeConexion, estadoDePermiso,
  auditarEstados, textosDeEstados, panelEstados, TITULOS_VACIOS,
} from '../src/lib/estadosEstilo.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const TODOS_EH = ['estilo', 'skincare', 'pelo', 'barba', 'perfumes', 'sonrisa', 'accesorios', 'gustos'];
const FUENTE = readFileSync(new URL('../src/lib/estadosEstilo.js', import.meta.url), 'utf8');
const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const VISTA = readFileSync(new URL('../src/views/EstiloHombreView.jsx', import.meta.url), 'utf8');

console.log('\n⚠️ EH · Fase 41/65 — Estados vacíos, carga, errores y recuperación\n');

/* ---------------------------------------------------------------------------
   1 · TODO ESTADO TIENE UNA RESPUESTA CLARA
   --------------------------------------------------------------------------- */
{
  console.log('1 · Qué ha pasado → qué puedes hacer → qué pasa con tus datos');
  const a = auditarEstados();
  ok(ESTADOS_EH.length >= 14, 'hay un estado por cada situación del enunciado');
  eq(a.sinQuePaso, [], '⚠️ todos dicen QUÉ HA PASADO');
  eq(a.sinQuePasaConSusDatos, [], '⚠️ todos dicen QUÉ HA OCURRIDO CON SUS DATOS');
  eq(a.sinQueHacer, [], '⚠️ y todos ofrecen QUÉ PUEDE HACER (menos los de esperar)');
  eq(a.titulosVacios, [], '⚠️ y ninguno dice solo "Error" (apartado 6, con esas palabras)');
  ok(TITULOS_VACIOS.test('Error'), 'y la comprobación cazaría un "Error." a secas');
  ok(TITULOS_VACIOS.test('Ups'), 'o un "Ups"');
  ok(ESTADOS_EH.every((e) => e.opciones.every((o) => !!o.accion)),
    '⚠️ cada opción declara su acción: ni un botón decorativo (regla 8)');
  ok(new Set(ESTADOS_EH.map((e) => e.id)).size === ESTADOS_EH.length, 'ningún id repetido');
  ok(!!estadoEH('sin_datos') && !estadoEH('inventado'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   2 · LO QUE NO SE PUEDE DETECTAR HOY, DICHO
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Tres estados que hoy no se pueden detectar');
  eq(ESTADOS_SIN_MECANISMO.map((e) => e.id), ['error_guardado', 'sincronizando', 'conflicto'],
    '⚠️ el error de guardado, la sincronización y el conflicto');
  ESTADOS_SIN_MECANISMO.forEach((e) => {
    ok(typeof e.porque === 'string' && e.porque.length > 30,
      `y ${e.id} dice POR QUÉ, con una frase entera`);
    ok(!!e.titulo && !!e.datos,
      `${e.id} tiene su texto escrito, para el día que exista el mecanismo`);
  });
  eq(ESTADOS_DETECTABLES.length, ESTADOS_EH.length - 3, 'los demás sí se detectan');

  // ⚠️ Decisión 3 — y NO se monta una cola de escritura (RA F2).
  eq(auditarEstados().colasDeEscritura, 0, '⚠️ ni una cola de escritura');
  ok(!/encolar|vaciarCola|pendientes\s*:/.test(SIN_COMENTARIOS),
    '⚠️ porque añadir un perfume dos veces son dos perfumes: reintentar NO es idempotente');
  ok(!/saveData|supabase/i.test(SIN_COMENTARIOS),
    'y esta fase no toca el guardado de nadie');
}

/* ---------------------------------------------------------------------------
   3 · SIN DATOS Y PRIMERA VEZ (apartados 1 y 2 · prueba 1)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Nunca una pantalla vacía');
  ok(COLECCIONES_EH.length >= 8, 'hay una línea por colección con pantalla');
  ok(COLECCIONES_EH.every((c) => !!moduloEH(c.modulo)),
    'y ninguna nombra un módulo que no existe');
  eq(auditarEstados().coleccionesSinVacio, [],
    '⚠️ ninguna se queda sin título y sin botón');
  ok(COLECCIONES_EH.every((c) => /^\+ |^Añadir|^Crear/.test(c.boton)),
    'y el botón siempre invita a añadir algo');

  const e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, TODOS_EH);
  const vacios = estadosVacios(e);
  ok(vacios.every((v) => v.vacia), 'de fábrica están todas vacías (prueba 1)');
  ok(vacios.every((v) => !!v.titulo && !!v.texto && !!v.boton),
    '⚠️ y TODAS traen qué pasa y qué hacer: ni una pantalla muda');

  const p = estadoDeColeccion(e, 'perfumes.perfumes');
  eq(p.titulo, 'Tu colección está vacía', 'el ejemplo del enunciado, tal cual');
  eq(p.boton, 'Añadir perfume', 'con su botón');

  const conUno = anadirPerfume(e, { nombre: 'Bleu' }).estado;
  eq(estadoDeColeccion(conUno, 'perfumes.perfumes').vacia, false, 'con un perfume ya no está vacía');
  eq(estadoDeColeccion(conUno, 'perfumes.perfumes').total, 1, 'y se cuenta');
  eq(estadoDeColeccion(e, 'inventada'), null, 'una colección que no existe no da estado');
  ok(!!coleccionEH('gustos.entradas'), 'y las colecciones se buscan por id');
}

/* ---------------------------------------------------------------------------
   4 · UN DATO CORRUPTO NO ROMPE LA PANTALLA (apartado 14)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Un dato corrupto no rompe la pantalla');
  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, TODOS_EH);
  e = anadirPerfume(e, { nombre: 'Bleu' }).estado;
  eq(elementosProblematicos(e, 'perfumes.perfumes').hayProblemas, false,
    'con todo bien no se inventa un problema');
  eq(avisoDeCorrupto(e, 'perfumes.perfumes'), null, 'y no sale ningún aviso');

  // Uno roto en medio de dos buenos, guardado a mano como llegaría de Supabase.
  const d = datosPerfumes(e);
  const roto = guardarConfig(e, 'perfumes', {
    perfumes: { ...d, perfumes: [{ id: 'a', nombre: 'Uno' }, { id: 'b' }, { id: 'c', nombre: 'Tres' }] },
  });
  const r = elementosProblematicos(roto, 'perfumes.perfumes');
  eq(r.hayProblemas, true, '⚠️ el registro sin nombre se detecta');
  eq(r.malos.length, 1, 'solo ése');
  eq(r.malos[0].id, 'b', 'con su id');
  eq(r.buenos.length, 2, '⚠️ y LOS OTROS DOS SE SIGUEN VIENDO: no rompe la pantalla');

  // ⚠️ La lección de la fase: hay que mirar lo GUARDADO, no lo normalizado.
  eq(datosPerfumes(roto).perfumes.length, 2,
    '⚠️ el normalizador ya lo había descartado en silencio…');
  ok(r.malos.length > 0,
    '…así que leerlo con `datos*()` no habría encontrado nunca nada (regla 8)');
  ok(COLECCIONES_EH.filter((c) => c.crudo).every((c) => !!c.crudo.modulo && Array.isArray(c.crudo.camino)),
    'cada colección revisable declara dónde vive en crudo');
  ok(auditarEstados().revisables >= 5, 'y al menos cinco se pueden revisar');
  ok(COLECCIONES_EH.filter((c) => !c.crudo).length > 0,
    'las que no, están declaradas como tales en vez de fingirlo');

  const aviso = avisoDeCorrupto(roto, 'perfumes.perfumes');
  eq(aviso.cuantos, 1, 'el aviso dice cuántos');
  eq(aviso.siguenBien, 2, '⚠️ y sobre todo cuántos SIGUEN BIEN');
  ok(/resto de tus cosas están bien/.test(aviso.datos), 'con esa frase, que es lo que tranquiliza');
}

/* ---------------------------------------------------------------------------
   5 · MÓDULO DESACTIVADO Y ELEMENTO ELIMINADO (apartados 10 y 11 · pruebas 9 y 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Desactivado y eliminado');
  const e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes']);
  eq(estadoDeAcceso(e, 'perfumes'), null, 'un módulo activo se abre sin más');
  const parado = estadoDeAcceso(e, 'barba');
  ok(!!parado, 'uno desactivado se para (prueba 10)');
  eq(parado.titulo, 'Este apartado está desactivado', 'con la frase del enunciado');
  eq(parado.nombre, 'Barba', 'y su nombre');
  eq(parado.opciones.map((o) => o.id), ['activar', 'volver'], 'con Activar y Volver');
  ok(/sigue guardado/.test(parado.datos), '⚠️ y diciendo que lo de dentro sigue ahí (F36)');
  eq(estadoDeAcceso(e, 'inventado'), null, 'un módulo que no existe no da estado');
  // Y activarlo lo desbloquea de verdad.
  eq(estadoDeAcceso(alternarModulo(e, 'barba', true), 'barba'), null, 'al activarlo, se entra');

  const papelera = {
    elementos: [{
      modulo: 'perfumes', coleccion: 'perfumes', id: 'x1', tipo: 'Perfume',
      datos: { nombre: 'Ido' }, eliminadoEn: '2026-08-29T10:00:00Z',
    }],
  };
  const borrado = estadoDeEliminado(papelera, 'perfumes', 'perfumes', 'x1');
  ok(!!borrado, 'lo eliminado se encuentra (prueba 9)');
  eq(borrado.titulo, 'Este elemento está en Eliminados recientemente', 'con la frase del enunciado');
  eq(borrado.opciones.map((o) => o.id), ['recuperar', 'volver'], 'y sus dos opciones');
  eq(borrado.tipo, 'Perfume', 'con el tipo que dice el catálogo de la papelera');
  eq(estadoDeEliminado(papelera, 'perfumes', 'perfumes', 'otro'), null, 'lo que no está, no está');
  eq(estadoDeEliminado(null, 'perfumes', 'perfumes', 'x1'), null, 'y sin papelera no se inventa nada');
  eq(estadoDeEliminado(papelera, 'gustos', 'entradas', 'x1'), null,
    'ni se confunde con otra colección');
}

/* ---------------------------------------------------------------------------
   6 · ANTES DE BORRAR (apartado 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Antes de borrar se dice adónde va');
  const conPapelera = avisoDeBorrado('perfumes', 'perfumes');
  eq(conPapelera.aPapelera, true, 'un perfume va a Eliminados recientemente');
  eq(conPapelera.datos, TEXTOS_ESTADOS.siSePuedeRecuperar, 'y se le promete que podrá recuperarlo');
  eq(conPapelera.titulo, '¿Seguro que quieres eliminarlo?', 'con la pregunta del enunciado');
  eq(conPapelera.opciones.map((o) => o.id), ['eliminar', 'cancelar'], 'y sus dos salidas');

  const sinPapelera = avisoDeBorrado('inventado', 'x');
  eq(sinPapelera.aPapelera, false, '⚠️ lo que no va a la papelera se dice');
  eq(sinPapelera.datos, TEXTOS_ESTADOS.noSePuedeRecuperar,
    '⚠️ y NO se le promete que podrá recuperarlo: sería mentira');
  ok(!/podrás recuperarlo/i.test(sinPapelera.datos), 'con esas palabras');

  // Y lo que dice el catálogo es lo que dice la papelera de verdad.
  ok(Object.keys(CATALOGO_PAPELERA).some((k) => k === 'perfumes.perfumes'),
    'porque sale del catálogo de la papelera global (ME F3)');
}

/* ---------------------------------------------------------------------------
   7 · CONEXIÓN Y PERMISOS (apartados 4, 5 y 12 · prueba 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Conexión y permisos');
  eq(hayConexion(), true, 'fuera del navegador se da por buena la conexión');
  eq(estadoDeConexion(), null, 'y no sale ningún aviso');
  const sinCon = estadoEH('sin_conexion');
  eq(sinCon.titulo, 'No hemos podido actualizar tus datos', 'la frase del enunciado');
  eq(sinCon.opciones.map((o) => o.etiqueta), ['Reintentar', 'Seguir sin conexión'],
    'con Reintentar y Seguir sin conexión');
  ok(/lo último que se cargó/.test(sinCon.datos),
    '⚠️ y diciendo la verdad sobre lo que está viendo (apartado 5)');
  ok(/hace falta conexión/.test(estadoEH('modo_sin_conexion').datos),
    '⚠️ y que sin conexión se puede mirar pero no guardar');

  const permiso = estadoDePermiso();
  ok(permiso === null || permiso.id === 'permiso_denegado', 'el permiso se consulta, no se pide');
  if (permiso) {
    eq(permiso.opciones.map((o) => o.id), ['ajustes'],
      '⚠️ y si ya dijo que no, la única salida es Ajustes: no se pide dos veces');
    ok(/desde Ajustes/.test(permiso.datos) || /ajustes/i.test(permiso.texto),
      'diciendo dónde se cambia');
  }
  ok(!/requestPermission/.test(SIN_COMENTARIOS),
    '⚠️ esta fase NO pide el permiso: solo mira en qué estado está (apartado 12)');
}

/* ---------------------------------------------------------------------------
   8 · CARGA Y FEEDBACK (apartados 3 y 16)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Cargando y feedback');
  eq(TARJETAS_DE_CARGA, 3, '⚠️ tarjetas pequeñas, no un spinner enorme (apartado 3)');
  eq(estadoEH('cargando').opciones, [], 'mientras carga no hay nada que decidir');
  ok(/siguen donde estaban/.test(estadoEH('cargando').datos),
    'pero se dice que sus datos están bien');

  eq(Object.keys(MENSAJES_HECHO).sort(),
    ['actualizado', 'activado', 'eliminado', 'guardado', 'recuperado'].sort(),
    'los mensajes del apartado 16');
  ok(Object.values(MENSAJES_HECHO).every((m) => m.startsWith('✓') && m.length < 20),
    '⚠️ pequeños, todos con su ✓');
  ok(DURACION_FEEDBACK_MS > 0 && DURACION_FEEDBACK_MS <= 4000,
    '⚠️ y temporales: se van solos (apartado 16)');
}

/* ---------------------------------------------------------------------------
   9 · LOS TEXTOS Y LA PANTALLA
   --------------------------------------------------------------------------- */
{
  console.log('\n9 · Los textos y la pantalla');
  const textos = textosDeEstados();
  ok(textos.every((t) => typeof t === 'string' && t.length > 0), 'ningún texto vacío');
  ok(!textos.some((t) => /fase \d|apartado \d|próximamente/i.test(t)),
    '⚠️ ninguno menciona fases ni apartados (regla 9)');
  // Apartado 6 — nunca "Error" a secas, en ninguna parte.
  ok(!textos.some((t) => TITULOS_VACIOS.test(t)), '⚠️ y ninguno es un "Error." a secas');
  ok(!textos.some((t) => /\bfallo del sistema\b|\bexcepción\b|\bnull\b|undefined/i.test(t)),
    '⚠️ ni habla en informático: son mensajes para Josué');

  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, TODOS_EH);
  e = anadirGusto(e, { nombre: 'Correr', categoria: 'aficiones' }).estado;
  const p = panelEstados(e, { papelera: { elementos: [] } });
  ok(Array.isArray(p.vacios) && p.vacios.length > 0, 'el panel trae los vacíos');
  eq(p.problemas, [], 'y sin problemas, ninguno');
  eq(p.sinMecanismo.length, 3, 'y los tres que hoy no se detectan, con su motivo');
  eq(p.papeleraDisponible, true, 'y si tiene papelera a mano');

  ok(/export function VacioEH/.test(VISTA), 'la pantalla del vacío existe');
  ok(/export function CargandoEH/.test(VISTA), 'la de la carga');
  ok(/export function AvisoEstadoEH/.test(VISTA), 'la del aviso');
  ok(/export function HechoEH/.test(VISTA), 'y la del ✓ temporal');
  ok(/import \{[\s\S]*?estadoDeColeccion[\s\S]*?\} from '\.\.\/lib\/estadosEstilo'/.test(VISTA),
    '⚠️ y la vista IMPORTA la librería (la lección de la F15)');
  // ⚠️ Y se usan de verdad: una librería sin consumidor no es una fase hecha.
  ok(/<VacioEH/.test(VISTA), 'el vacío se usa en una pantalla de verdad');
  ok(/estadoDeAcceso\(estado, id\)/.test(VISTA),
    '⚠️ y abrir un apartado desactivado se para antes de entrar (apartado 10)');
  /* ⚠️ La puerta de verdad es **Mis preferencias → Editar** (F34): las plaquitas,
     "Mi estilo" y Gestionar apartados ya filtran por activo, y el buscador tiene
     su propio aviso desde la F37. Se comprueba que ese Editar pasa por el mismo
     `abrirModulo` que lleva el guardia, en vez de abrir la pantalla a pelo. */
  ok(/onEditar=\{\(modulo\) => \{[^}]*abrirModulo\(modulo\)/.test(VISTA),
    '⚠️ y "Mis preferencias → Editar" entra por el mismo sitio, que es donde está el guardia');
  ok(/avisoDeBorrado\('skincare', 'registros'/.test(VISTA),
    '⚠️ y borrar un registro pregunta antes (apartado 15)');
  ok(/<AvisosDeEstadoEH/.test(VISTA), 'y la portada avisa de lo que va mal');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
