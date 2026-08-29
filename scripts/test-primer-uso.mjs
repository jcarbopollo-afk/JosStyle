// ============================================================================
// EH · Fase 40/65 — Primer uso y configuración inicial
//
// Las catorce pruebas del apartado 16, y lo que gobierna la fase:
//   · la mitad ya estaba construida (F3, F1, F30) y NO se rehace
//   · el tutorial son cuatro pantallas, se puede saltar y se recuerda
//   · UNA idea para empezar. Una.
//   · aprender con el uso NO activa nada
//   · "Añadir a Estilo" es una referencia, nunca una copia
//   · y ni un porcentaje, ni una tarea pendiente
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre,
  alternarModulo, guardarConfig, estadoPantalla, moduloEH,
} from '../src/lib/estiloDeHombre.js';
import {
  estadoAsistente, iniciarAsistente, omitirAsistente, terminarAsistente,
  modificarConfiguracion,
} from '../src/lib/configuracionInicial.js';
import { estadoDe } from '../src/lib/gestionEstilo.js';
import { anadirPerfume, datosPerfumes } from '../src/lib/perfumes.js';
import { anadirGusto } from '../src/lib/gustos.js';
import { descubrir, datosDescubrir } from '../src/lib/descubrir.js';
import {
  YA_CONSTRUIDO, TEXTOS_PRIMER_USO, PANTALLAS_TUTORIAL, IDS_TUTORIAL, pantallaTutorial,
  ESTADOS_TUTORIAL, DEFAULT_PRIMER_USO, normalizarPrimerUso, datosPrimerUso,
  tutorialVisto, verTutorial, avanzarTutorial, saltarTutorial, pasoDelTutorial,
  MAXIMO_IDEAS_INICIO, ideaParaEmpezar, cerrarIdea,
  SUGERENCIAS_POR_USO, sugerenciaPorUso, aceptarSugerencia, rechazarSugerencia,
  FUENTES_YA_TENGO, loQueYaTienes, anadirAEstilo,
  auditarPrimerUso, textosDePrimerUso, panelPrimerUso,
  PATRON_PORCENTAJE, PALABRAS_DE_DEBER,
} from '../src/lib/primerUso.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-29';
const TODOS_EH = ['estilo', 'skincare', 'pelo', 'barba', 'perfumes', 'sonrisa', 'accesorios', 'gustos'];
const FUENTE = readFileSync(new URL('../src/lib/primerUso.js', import.meta.url), 'utf8');
const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const VISTA = readFileSync(new URL('../src/views/EstiloHombreView.jsx', import.meta.url), 'utf8');

const ARMARIO = { prendas: [{ id: 'p1' }, { id: 'p2' }], outfits: [], usos: [] };

console.log('\n🧔 EH · Fase 40/65 — Primer uso y configuración inicial\n');

/* ---------------------------------------------------------------------------
   1 · LO QUE YA ESTABA CONSTRUIDO (apartados 1-4, 6, 9, 12 y 13)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Lo que ya estaba construido, y no se rehace');
  eq(YA_CONSTRUIDO.map((x) => x.apartado), [1, 2, 3, 4, 6, 9, 12, 13],
    'ocho apartados los resuelven fases anteriores');
  ok(YA_CONSTRUIDO.every((x) => typeof x.donde === 'string' && typeof x.desde === 'string'),
    'y cada uno declara dónde vive y desde qué fase');
  eq(auditarPrimerUso().sinFuncion, [],
    '⚠️ y las ocho funciones existen de verdad: no es una lista de nombres');

  // Prueba 1 — usuario nuevo.
  eq(estadoPantalla(DEFAULT_ESTILO_HOMBRE), 'sin_configurar', 'un usuario nuevo entra sin configurar');
  eq(estadoAsistente(DEFAULT_ESTILO_HOMBRE), 'nunca', 'y sin haber visto el asistente (prueba 1)');

  // Prueba 2 — empezar. Prueba 3 y 4 — uno o varios.
  const empezado = iniciarAsistente(DEFAULT_ESTILO_HOMBRE, { hoy: HOY });
  eq(estadoAsistente(empezado), 'en_curso', 'Empezar lo pone en curso (prueba 2)');
  const uno = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes']);
  eq(normalizarEstiloHombre(uno).modulos.filter((m) => m.activo).map((m) => m.id), ['perfumes'],
    'se puede elegir uno solo (prueba 3)');
  const varios = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes', 'gustos', 'skincare']);
  eq(normalizarEstiloHombre(varios).modulos.filter((m) => m.activo).length, 3,
    'o varios (prueba 4)');

  // Prueba 5 y 6 — saltar y salir. Prueba 7 — volver.
  const saltado = omitirAsistente(DEFAULT_ESTILO_HOMBRE, { hoy: HOY });
  eq(estadoAsistente(saltado), 'omitido', 'Saltar es un final válido (pruebas 5 y 6)');
  eq(normalizarEstiloHombre(saltado).modulos.filter((m) => m.activo).length, 0,
    '⚠️ y saltar NO enciende nada: "no pasa absolutamente nada"');
  ok(estadoAsistente(saltado) !== 'nunca',
    '⚠️ Y al volver NO se repite el tutorial inicial (prueba 7, apartado 13)');

  // Prueba 8 — añadir módulos después (apartado 4).
  const luego = alternarModulo(uno, 'skincare', true);
  eq(normalizarEstiloHombre(luego).modulos.filter((m) => m.activo).map((m) => m.id).sort(),
    ['perfumes', 'skincare'], 'se pueden añadir módulos después (prueba 8, apartado 4)');
  eq(datosPerfumes(luego).perfumes, datosPerfumes(uno).perfumes,
    'y añadir uno no toca lo que ya había');

  // Apartado 9 — volver a configurar.
  eq(estadoAsistente(modificarConfiguracion(terminarAsistente(uno))), 'en_curso',
    'y se puede volver a configurar entero (apartado 9)');
}

/* ---------------------------------------------------------------------------
   2 · EL TUTORIAL (apartados 14 y 15 · pruebas 12 y 13)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · El tutorial');
  eq(PANTALLAS_TUTORIAL.length, 4, '⚠️ cuatro pantallas: "máximo unas pocas"');
  eq(IDS_TUTORIAL, ['plaquitas', 'personalizar', 'conexiones', 'ocultar'],
    'y son las cuatro que pide el apartado 14, en su orden');
  ok(PANTALLAS_TUTORIAL.every((p) => p.titulo && p.texto && p.icono),
    'cada una con su icono, su título y su explicación');
  ok(!!pantallaTutorial('plaquitas') && !pantallaTutorial('inventada'),
    'y se buscan por id');
  eq(ESTADOS_TUTORIAL, ['nunca', 'visto', 'saltado'],
    '⚠️ tres estados: que esté abierto AHORA es de la pantalla, no del almacén');

  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes']);
  eq(tutorialVisto(e), false, 'de fábrica no lo ha visto');
  eq(pasoDelTutorial(e).numero, 1, 'y empieza por la primera');
  eq(pasoDelTutorial(e).de, 4, 'de cuatro');

  e = verTutorial(e);
  eq(pasoDelTutorial(e).pantalla.id, 'plaquitas', 'abrirlo empieza por las plaquitas');
  e = avanzarTutorial(e);
  eq(pasoDelTutorial(e).pantalla.id, 'personalizar', 'y avanza');
  eq(tutorialVisto(e), false, 'a medias todavía no cuenta como visto');
  e = avanzarTutorial(avanzarTutorial(e));
  eq(pasoDelTutorial(e).ultima, true, 'la cuarta es la última');
  e = avanzarTutorial(e);
  eq(datosPrimerUso(e).tutorial, 'visto', '⚠️ al terminar queda VISTO (apartado 15)');
  eq(tutorialVisto(e), true, 'y no hay que volver a enseñárselo');
  eq(pasoDelTutorial(e).numero, 1, 'y vuelve al principio para la próxima');

  // Prueba 12 — repetir tutorial. ⚠️ Y sigue constando como visto.
  const otraVez = verTutorial(e);
  eq(pasoDelTutorial(otraVez).numero, 1, 'se puede volver a ver (prueba 12)');
  eq(tutorialVisto(otraVez), true,
    '⚠️ y volver a verlo NO le hace olvidar que ya lo había visto');

  // Prueba 13 — saltar tutorial, desde cualquier pantalla.
  const saltadoYa = saltarTutorial(avanzarTutorial(verTutorial(e)));
  eq(datosPrimerUso(saltadoYa).tutorial, 'saltado', 'se puede saltar (prueba 13)');
  eq(tutorialVisto(saltadoYa), true, '⚠️ y saltarlo NO es un estado peor: cuenta igual');

  // ⚠️ Y nunca se abre solo.
  ok(!/useEffect/.test(SIN_COMENTARIOS), 'la librería no hace nada por su cuenta');
  ok(/onComoFunciona/.test(VISTA), 'y en la pantalla se abre a un toque suyo');
}

/* ---------------------------------------------------------------------------
   3 · UNA IDEA. UNA. (apartado 7)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Una idea para empezar');
  eq(MAXIMO_IDEAS_INICIO, 1, '⚠️ como máximo UNA: "no bombardear"');

  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, TODOS_EH);
  e = anadirPerfume(e, { nombre: 'Bleu' }, { hoy: HOY }).estado;
  const idea = ideaParaEmpezar(e, { hoy: HOY });
  ok(!!idea, 'con módulos encendidos hay una idea');
  ok(!!idea.texto && !!idea.cerrar, 'con su texto y su Cerrar');
  eq(idea.titulo, TEXTOS_PRIMER_USO.ideaTitulo, 'y su título');

  // ⚠️ Sale del catálogo de la F33: ni una lista nueva.
  const dela33 = descubrir(e, { hoy: HOY }).tarjetas.map((t) => t.id);
  ok(dela33.includes(idea.id),
    '⚠️ y sale de ✨ Descubrir (F33): esta fase NO escribe un catálogo nuevo');
  ok(!/TARJETAS_|IDEAS_INICIO\s*=\s*\[/.test(SIN_COMENTARIOS),
    'no hay ni un catálogo de ideas en esta fase');
  eq(auditarPrimerUso().catalogosNuevos, 0, 'y la auditoría lo dice');

  // Cerrar es de la bienvenida: la tarjeta sigue en Descubrir.
  const cerrada = cerrarIdea(e, idea.id);
  eq(datosPrimerUso(cerrada).ideaCerrada, idea.id, 'cerrarla se guarda');
  const otra = ideaParaEmpezar(cerrada, { hoy: HOY });
  ok(!otra || otra.id !== idea.id, 'y no vuelve a salir esa');
  ok(descubrir(cerrada, { hoy: HOY }).tarjetas.some((t) => t.id === idea.id),
    '⚠️ pero SIGUE en ✨ Descubrir: cerrar no es descartar');
  eq(datosDescubrir(cerrada).feedback, [], 'y no se ha guardado ningún descarte');

  eq(cerrarIdea(e, ''), normalizarEstiloHombre(e), 'cerrar sin id no hace nada');

  // Sin ni un módulo encendido, no hay idea que dar.
  eq(ideaParaEmpezar(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, []), { hoy: HOY }), null,
    'sin apartados encendidos no se inventa una idea');
}

/* ---------------------------------------------------------------------------
   4 · APRENDER CON EL USO (apartado 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Aprender con el uso, sin activar nada');
  ok(SUGERENCIAS_POR_USO.length > 0, 'hay sugerencias declaradas');
  ok(SUGERENCIAS_POR_USO.every((s) => typeof s.porque === 'string' && s.porque.length > 10),
    '⚠️ y cada una explica por qué: una sugerencia sin motivo es una imposición');
  ok(SUGERENCIAS_POR_USO.every((s) => typeof s.hayDatos === 'function'),
    'y cada una sabe mirar si de verdad lo usa');
  ok(SUGERENCIAS_POR_USO.every((s) => !!moduloEH(s.usa) && !!moduloEH(s.ofrece)),
    'y ninguna nombra un módulo que no existe');
  ok(SUGERENCIAS_POR_USO.some((s) => s.usa === 'perfumes' && s.ofrece === 'accesorios'),
    '⚠️ incluida la del enunciado: usa Perfumes → ¿añadir Accesorios?');

  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes']);
  eq(sugerenciaPorUso(e), null,
    '⚠️ encendido pero SIN DATOS no se sugiere nada: encenderlo no es usarlo');

  e = anadirPerfume(e, { nombre: 'Bleu' }, { hoy: HOY }).estado;
  const sug = sugerenciaPorUso(e);
  ok(!!sug, 'con datos de verdad, sí');
  eq(sug.modulo, 'accesorios', 'y propone Accesorios');
  ok(/¿Quieres añadir/.test(sug.pregunta), 'con la pregunta del enunciado');
  ok(!!sug.porque, 'y su motivo');

  // ⚠️ Decimoctavo `aplicarPlan`: sin `confirmado` no activa nada.
  eq(aceptarSugerencia(e, 'accesorios'), null,
    '⚠️ sin `confirmado` NO activa nada (apartado 8, con esas palabras)');
  eq(aceptarSugerencia(e, 'accesorios', { confirmado: false }), null, 'ni pasándole false');
  eq(aceptarSugerencia(e, 'inventado', { confirmado: true }), null, 'ni un módulo que no existe');

  const aceptada = aceptarSugerencia(e, 'accesorios', { confirmado: true });
  eq(estadoDe(aceptada, 'accesorios'), 'activo', 'con `confirmado` sí se enciende');
  eq(datosPerfumes(aceptada).perfumes.length, 1, 'y no toca nada de lo que ya había');
  ok(datosPrimerUso(aceptada).ofrecidos.includes('accesorios'), 'y queda apuntado que se ofreció');

  // "No, gracias" — y no se insiste (apartado 12).
  const rechazada = rechazarSugerencia(e, 'accesorios');
  eq(estadoDe(rechazada, 'accesorios'), 'desactivado', '"No, gracias" no enciende nada');
  ok(!sugerenciaPorUso(rechazada) || sugerenciaPorUso(rechazada).modulo !== 'accesorios',
    '⚠️ y no se vuelve a proponer: "no insistir"');
  ok(datosPrimerUso(rechazada).rechazados.includes('accesorios'), 'queda apuntado que dijo que no');

  // Solo una a la vez: "no bombardear".
  let mucho = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes', 'skincare', 'gustos']);
  mucho = anadirPerfume(mucho, { nombre: 'Uno' }, { hoy: HOY }).estado;
  mucho = anadirGusto(mucho, { nombre: 'Correr', categoria: 'aficiones' }).estado;
  ok(!Array.isArray(sugerenciaPorUso(mucho)), '⚠️ y sale UNA sugerencia, no una lista');
}

/* ---------------------------------------------------------------------------
   5 · LO QUE YA TIENE, Y "AÑADIR A ESTILO" (apartados 10 y 11 · pruebas 9-11)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Lo que ya tiene: una referencia, nunca una copia');
  ok(FUENTES_YA_TENGO.every((f) => !!moduloEH(f.modulo)),
    'cada fuente apunta a un módulo que existe');
  ok(FUENTES_YA_TENGO.every((f) => typeof f.hay === 'function' && typeof f.detalle === 'function'),
    'y sabe mirarse y contarse');

  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes']);
  e = anadirPerfume(e, { nombre: 'Bleu' }, { hoy: HOY }).estado;

  const vacio = loQueYaTienes(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, []), {});
  eq(vacio.hay, false, 'sin nada, no se inventa que ya tiene algo');
  eq(vacio.vacio, TEXTOS_PRIMER_USO.nadaQueTraer, 'y se dice');

  const yt = loQueYaTienes(e, { armario: ARMARIO });
  eq(yt.hay, true, 'con un armario y un perfume, sí hay (prueba 9)');
  eq(yt.titulo, TEXTOS_PRIMER_USO.yaTienes, 'con la frase del enunciado');
  ok(yt.fuentes.some((f) => f.id === 'armario' && f.texto === 'Armario configurado'),
    '⚠️ "👕 Armario configurado", el ejemplo del enunciado');
  eq(yt.fuentes.find((f) => f.id === 'armario').detalle, '2 prendas', 'con su cuenta');
  eq(yt.fuentes.find((f) => f.id === 'perfumes').detalle, '1 perfume',
    'y en singular cuando toca');
  eq(yt.fuentes.find((f) => f.id === 'armario').yaActivo, false,
    'el módulo que lo lee todavía no está encendido');
  eq(yt.fuentes.find((f) => f.id === 'perfumes').yaActivo, true,
    'y el que sí, se marca: no hay nada que "añadir"');

  // ⚠️ Prueba 10 y 11 — importar es una REFERENCIA, y no hay duplicados.
  eq(anadirAEstilo(e, 'armario'), null, '⚠️ sin `confirmado` no escribe (decimonoveno aplicarPlan)');
  eq(anadirAEstilo(e, 'inventada', { confirmado: true }), null, 'ni una fuente que no existe');
  const antesEH = JSON.stringify(normalizarEstiloHombre(e));
  const armarioAntes = JSON.stringify(ARMARIO);
  const conEstilo = anadirAEstilo(e, 'armario', { confirmado: true });
  eq(estadoDe(conEstilo, 'estilo'), 'activo', 'añadirlo enciende el módulo que ya lo lee (prueba 10)');
  eq(JSON.stringify(ARMARIO), armarioAntes, '⚠️ y el armario NO se toca');
  // ⚠️ La comprobación de la prueba 11: lo único que cambia es el interruptor.
  const soloInterruptor = normalizarEstiloHombre(conEstilo).modulos
    .map((m) => (m.id === 'estilo' ? { ...m, activo: false } : m));
  eq(JSON.stringify({ ...normalizarEstiloHombre(conEstilo), modulos: soloInterruptor }), antesEH,
    '⚠️ NI UN CAMPO COPIADO: lo único que cambia es el interruptor (prueba 11)');
  eq(auditarPrimerUso().camposCopiados, 0, 'y la auditoría lo dice');
  eq(anadirAEstilo(conEstilo, 'armario', { confirmado: true }), null,
    'y añadirlo dos veces no hace nada: no hay duplicados');

  ok(!/crearPrenda\(|crearOutfit\(|anadirPerfume\(/.test(SIN_COMENTARIOS),
    '⚠️ esta fase no crea ni una prenda, ni un outfit, ni un perfume');
}

/* ---------------------------------------------------------------------------
   6 · NI UN PORCENTAJE, NI UNA TAREA PENDIENTE (apartado 5)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Nada de "tu perfil está al 20%"');
  const a = auditarPrimerUso();
  eq(a.conPorcentaje, [], '⚠️ ningún texto lleva un porcentaje');
  eq(a.conDeber, [], '⚠️ y ninguno le dice lo que tiene que hacer');
  ok(PATRON_PORCENTAJE.test('Tu perfil está al 20%'),
    'y la comprobación cazaría el ejemplo del enunciado');
  ok(PALABRAS_DE_DEBER.test('deberías configurarlo'), 'y una frase de deber');

  const textos = textosDePrimerUso();
  ok(textos.every((t) => typeof t === 'string' && t.length > 0), 'ningún texto vacío');
  // Regla 9 — ni una nota de desarrollo.
  ok(!textos.some((t) => /fase \d|apartado \d|próximamente|pendiente de/i.test(t)),
    '⚠️ ninguno menciona fases ni apartados (regla 9)');
  ok(/no hace falta configurar nada/i.test(TEXTOS_PRIMER_USO.sinPresion),
    '⚠️ y se le dice que no pasa nada si no configura nada (apartado 12)');
}

/* ---------------------------------------------------------------------------
   7 · EL NORMALIZADOR Y LA PERSISTENCIA (prueba 14 · regla 5)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Persistencia');
  eq(normalizarPrimerUso(null), DEFAULT_PRIMER_USO, 'un guardado corrupto cae en el defecto');
  eq(Object.keys(normalizarPrimerUso({})).sort(), Object.keys(DEFAULT_PRIMER_USO).sort(),
    'y el normalizador conoce todos los campos (regla 5)');
  eq(normalizarPrimerUso({ tutorial: 'inventado' }).tutorial, 'nunca', 'un estado raro no se cuela');
  eq(normalizarPrimerUso({ paso: 99 }).paso, 0, 'ni un paso fuera de rango');
  eq(normalizarPrimerUso({ paso: -1 }).paso, 0, 'ni negativo');
  eq(normalizarPrimerUso({ rechazados: ['fantasma', 'pelo'] }).rechazados, ['pelo'],
    '⚠️ ni un módulo retirado del catálogo');
  eq(normalizarPrimerUso({ ofrecidos: ['pelo', 'pelo'] }).ofrecidos, ['pelo'], 'ni repetidos');
  eq(normalizarPrimerUso({ ideaCerrada: 7 }).ideaCerrada, null, 'ni un id que no lo es');

  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, TODOS_EH);
  e = saltarTutorial(rechazarSugerencia(cerrarIdea(e, 'desc_x'), 'pelo'));
  const guardado = datosPrimerUso(e);
  const releido = normalizarPrimerUso(JSON.parse(JSON.stringify(guardado)));
  eq(releido, guardado, '⚠️ guardar y volver a leer devuelve lo mismo (prueba 14)');
  const cfg = normalizarEstiloHombre(e).modulos.find((m) => m.id === 'estilo').config;
  ok('primerUso' in cfg, 'vive en el módulo anfitrión, como el resto');
}

/* ---------------------------------------------------------------------------
   8 · LA PANTALLA
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · La pantalla');
  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes']);
  e = anadirPerfume(e, { nombre: 'Bleu' }, { hoy: HOY }).estado;
  const p = panelPrimerUso(e, { armario: ARMARIO, hoy: HOY });
  eq(p.titulo, TEXTOS_PRIMER_USO.titulo, 'el panel trae su título');
  eq(p.sub, TEXTOS_PRIMER_USO.sub, 'y la frase de bienvenida del enunciado');
  ok(!!p.tutorial && !!p.yaTienes, 'con el tutorial y lo que ya tiene');
  ok('idea' in p && 'sugerencia' in p, 'la idea y la sugerencia, aunque sean null');
  eq(p.sinPresion, TEXTOS_PRIMER_USO.sinPresion, 'y que no hace falta configurar nada');

  ok(/export function TutorialEH/.test(VISTA), 'la pantalla del tutorial existe');
  ok(/export function BienvenidaEH/.test(VISTA), 'y la de la bienvenida');
  ok(/import \{[\s\S]*?panelPrimerUso[\s\S]*?\} from '\.\.\/lib\/primerUso'/.test(VISTA),
    '⚠️ y la vista IMPORTA la librería (la lección de la F15)');
  ok(/onCambiar\(verTutorial\(estado\)\); setTutorial\(true\)/.test(VISTA),
    '⚠️ y abrirlo empieza siempre por la primera pantalla (prueba 12)');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
