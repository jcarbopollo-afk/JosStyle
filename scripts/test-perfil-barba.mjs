// ============================================================================
// EH · Fase 20/65 — Barba y afeitado: perfil y configuración
//
// Las trece pruebas del apartado 18, y lo que gobierna la fase:
//   · el apartado 17 es una lista de siete cosas que hay que REUTILIZAR
//   · `sensibilidadPiel` YA está contestada — se lee, no se vuelve a preguntar
//   · los productos son los del catálogo global: aquí solo se guardan IDS
//   · nunca un diagnóstico (apartados 10 y 11), con la lista de la Fase 13
// ============================================================================

import { readFileSync } from 'node:fs';
import { DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre } from '../src/lib/estiloDeHombre.js';
import { NIVELES_ESTILO } from '../src/lib/perfilEstilo.js';
import { REGISTRO_DATOS, guardarDato, leerDato } from '../src/lib/datosEstiloHombre.js';
import { NO_LO_SE, destinoDe, preguntasVisibles } from '../src/lib/cuestionarios.js';
import { PALABRAS_CLINICAS as CLINICAS_F13, sinDiagnostico as sinDiagF13, contestarPiel } from '../src/lib/perfilPiel.js';
import { crearProductoPiel, productosPiel, eliminarProductoPiel } from '../src/lib/productosPiel.js';
import { crearProductoPelo } from '../src/lib/productosPelo.js';
import {
  MODULO_BARBA, TEXTOS_BARBA, PARTES_BARBA, parteBarba, PLAQUITAS_BARBA,
  TIPOS_BARBA, LONGITUDES_BARBA, ESTILOS_BARBA, OBJETIVOS_BARBA, METODOS_AFEITADO,
  FRECUENCIAS_AFEITADO, frecuenciaAfeitado, PREFERENCIAS_AFEITADO, MOLESTIAS_AFEITADO,
  NIVELES_BARBA, nivelBarba, SECCIONES_BARBA, PREGUNTAS_BARBA, preguntaBarba,
  respuestaBarba, contestarBarba, borrarBarba, perfilBarba, preguntasDeBarba,
  progresoBarba, seccionesDeBarba, DEFAULT_BARBA, normalizarBarba, datosBarba,
  decirAhoraNoBarba, configurarBarba, elegirPartesBarba, parteActivaBarba,
  alternarParteBarba, ESTADOS_BARBA, estadoDeEntradaBarba, catalogoParaBarba,
  productosDeBarba, marcarProductoBarba, quitarProductoBarba, ponerDiasAfeitado,
  frecuenciaDeAfeitado, DATOS_QUE_YA_TENEMOS, loQueYaSabemosDeTuBarba,
  textosDeBarba, contextoDeBarba, resumenBarba, auditarBarba, panelBarba,
  sinDiagnostico, PALABRAS_CLINICAS,
} from '../src/lib/perfilBarba.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-28';
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['barba', 'skincare']);
const responder = (e, pares) => pares.reduce((acc, [q, v]) => contestarBarba(acc, q, v, { hoy: HOY }).estado, e);
const conPartes = (e, ids) => elegirPartesBarba(e, ids, { hoy: HOY }).estado;

/* ⚠️ Quitar comentarios, textos y la auditoría ANTES de leer el código para
   comprobar una ausencia: si no, la prueba caza su propia evidencia honesta.
   Van ocho veces en este proyecto. */
const fuente = readFileSync(new URL('../src/lib/perfilBarba.js', import.meta.url), 'utf8');
const codigo = fuente
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/export function auditarBarba[\s\S]*?\n}/, '')
  .replace(/'[^'\n]*'/g, "''")
  .replace(/`[^`]*`/g, '``');

/* ── 1 · ⚠️ EL APARTADO 17: NADA NUEVO SE CONSTRUYE AQUÍ ────────────────── */
console.log('\n1 · ⚠️ Reutilizar, no crear sistemas paralelos (apartado 17)');

{
  const a = auditarBarba();
  eq([a.inventariosNuevos, a.catalogosNuevos], [0, 0], 'Cero inventarios y cero catálogos nuevos (apartado 12)');
  eq([a.calendariosNuevos, a.recordatoriosNuevos, a.papelerasNuevas], [0, 0, 0],
    'Cero calendarios, recordatorios y papeleras propios');
  eq([a.motoresNuevos, a.escalasNuevas], [0, 0], 'Cero motores y cero escalas nuevas');
  eq(a.motorCuestionarios, 'cuestionarios.js', 'Con el motor de la Fase 7 declarado');
  eq(a.registroDatos, 'datosEstiloHombre.js', 'Y el registro de la Fase 4');
}

/* ⚠️ Los niveles son LOS MISMOS de la Fase 6, no una tercera escala. */
eq(NIVELES_BARBA.map((x) => x.id), NIVELES_ESTILO.map((x) => x.id),
  '⚠️ Los tres niveles son los de `NIVELES_ESTILO`, no una escala nueva');
eq(NIVELES_BARBA.map((x) => x.icono), NIVELES_ESTILO.map((x) => x.icono), 'Con sus mismos iconos');
ok(NIVELES_BARBA.every((x) => x.frase.length > 0), 'Y solo cambia lo que significan aquí (apartado 13)');
ok(!/🟢|🟡|🔴/.test(codigo), 'Los iconos no se reescriben a mano');

/* ⚠️ Y la lista de palabras clínicas es la de la Fase 13, importada. */
eq(PALABRAS_CLINICAS, CLINICAS_F13, '⚠️ La lista de palabras clínicas es la MISMA que la de la Fase 13');
eq(sinDiagnostico, sinDiagF13, 'Y el guardián también es uno solo');
eq(auditarBarba().listasClinicasNuevas, 0, 'Cero listas clínicas nuevas');
ok(!/PALABRAS_CLINICAS\s*=\s*\[/.test(codigo), 'Aquí no se reescribe');

/* ── 2 · ACTIVACIÓN: LOS DOS BOTONES (apartado 1) ───────────────────────── */
console.log('\n2 · Activación — "Sí, configurarlo" y "Ahora no"');

eq(TEXTOS_BARBA.configurar, 'Sí, configurarlo', 'El botón de sí, con las palabras del enunciado');
eq(TEXTOS_BARBA.ahoraNo, 'Ahora no', 'Y el de no');
eq(estadoDeEntradaBarba(base()), 'sin_configurar', 'Prueba 1: se entra sin configurar');

{
  // Prueba 2: saltarlo.
  const e = decirAhoraNoBarba(base()).estado;
  eq(estadoDeEntradaBarba(e), 'ahora_no', 'Prueba 2: "Ahora no" se guarda');
  eq(datosBarba(e).ahoraNo, true, 'Y consta');
  ok(TEXTOS_BARBA.oculto.length > 0, '⚠️ Y se dice que puede volver: oculto no es borrado');

  // Prueba 11: reactivarlo.
  const vuelta = configurarBarba(e, { hoy: HOY }).estado;
  eq(estadoDeEntradaBarba(vuelta), 'sin_configurar', 'Prueba 11: y puede volver cuando quiera');
  eq(datosBarba(vuelta).editado, HOY, 'Con la fecha en la que volvió');
}

/* ── 3 · QUÉ QUIERE GESTIONAR (apartado 2) ──────────────────────────────── */
console.log('\n3 · Las seis casillas del apartado 2');

eq(PARTES_BARBA.map((p) => p.id), ['barba', 'afeitado', 'perfilado', 'cuidadoPiel', 'productos', 'seguimiento'],
  'Las seis, en el orden del enunciado');
eq(PARTES_BARBA.filter((p) => !p.porDefecto).map((p) => p.id), ['seguimiento'],
  '⚠️ Y Seguimiento viene apagada, porque el enunciado la dibuja con ☐, no con ☑️');

{
  // Prueba 3: activar solo una sección.
  const una = conPartes(base(), ['barba']);
  eq(parteActivaBarba(una, 'barba'), true, 'Prueba 3: se puede activar solo una');
  eq(parteActivaBarba(una, 'afeitado'), false, 'Y las demás quedan apagadas');
  eq(datosBarba(una).elegido, true, 'Y consta que ya ha pasado por esta pantalla');
  eq(estadoDeEntradaBarba(una), 'eligiendo', 'El formulario sigue siendo opcional');

  // Prueba 4: activar varias.
  const varias = conPartes(base(), ['barba', 'afeitado', 'productos']);
  eq(PARTES_BARBA.filter((p) => parteActivaBarba(varias, p.id)).map((p) => p.id),
    ['barba', 'afeitado', 'productos'], 'Prueba 4: o varias');

  eq(elegirPartesBarba(base(), []).error, 'Elige al menos una cosa que quieras gestionar.',
    '⚠️ Sin marcar ninguna no se guarda: quien no quiere nada tiene "Ahora no", que es otra cosa');
  eq(elegirPartesBarba(base(), ['inventada']).error, 'Elige al menos una cosa que quieras gestionar.',
    'Ni una parte que no existe');
  eq(parteBarba('inventada'), null, 'Una parte que no existe es `null`');
}

/* Pruebas 5 y 6: desactivar una y reactivarla, sin perder los datos. */
{
  let e = conPartes(base(), ['barba', 'afeitado']);
  e = responder(e, [['tipoBarba', 'corta'], ['metodoAfeitado', 'cuchilla']]);
  eq(respuestaBarba(e, 'tipoBarba').valores, ['corta'], 'Con dos respuestas dentro');

  e = alternarParteBarba(e, 'afeitado');
  eq(parteActivaBarba(e, 'afeitado'), false, 'Prueba 5: se desactiva una parte');
  eq(parteActivaBarba(e, 'barba'), true, 'Y las demás siguen encendidas: son independientes');
  eq(respuestaBarba(e, 'metodoAfeitado').valores, ['cuchilla'],
    '⚠️ Prueba 12: y LO CONTESTADO SIGUE AHÍ (apartado 16: "sin perder los datos")');

  e = alternarParteBarba(e, 'afeitado');
  eq(parteActivaBarba(e, 'afeitado'), true, 'Prueba 6: se reactiva');
  eq(respuestaBarba(e, 'metodoAfeitado').valores, ['cuchilla'], 'Y sigue siendo lo mismo');

  eq(alternarParteBarba(base(), 'inventada'), normalizarEstiloHombre(base()), 'Alternar lo que no existe no hace nada');
}

/* ── 4 · EL FORMULARIO ES ADAPTATIVO, Y DESDE EL MOTOR ──────────────────── */
console.log('\n4 · ⚠️ El formulario adaptativo es del motor, no un `if` en la vista');

ok(!/if\s*\(.*partes\.(barba|afeitado)/.test(codigo.replace(/cuando:[^\n]*\n/g, '')),
  '⚠️ Ninguna condición de visibilidad escrita a mano fuera de un `cuando`');

{
  // Prueba 3 otra vez, pero mirando qué se le enseña.
  const soloBarba = conPartes(base(), ['barba']);
  const ids = preguntasDeBarba(soloBarba).map((p) => p.id);
  ok(ids.includes('tipoBarba'), 'Quien solo gestiona la barba ve su tipo');
  ok(!ids.includes('metodoAfeitado'), '⚠️ Y NO ve cómo se afeita: no ha marcado esa casilla (apartado 7)');
  ok(!ids.includes('frecuenciaAfeitado'), 'Ni cada cuánto');
  ok(ids.includes('objetivoBarba'), 'Pero sí lo que busca, que no depende de ninguna casilla');
  ok(ids.includes('nivelBarba'), 'Y su nivel');

  const soloAfeitado = conPartes(base(), ['afeitado']);
  const ids2 = preguntasDeBarba(soloAfeitado).map((p) => p.id);
  ok(!ids2.includes('tipoBarba'), 'Y quien solo se afeita no ve las preguntas de barba');
  ok(ids2.includes('metodoAfeitado'), 'Pero sí las de afeitado');

  // ⚠️ Perfilado también abre las preguntas de afeitado: el apartado 8 pregunta
  // "afeitarte o perfilarte", con esas palabras.
  const soloPerfilado = conPartes(base(), ['perfilado']);
  ok(preguntasDeBarba(soloPerfilado).map((p) => p.id).includes('frecuenciaAfeitado'),
    '⚠️ Y el perfilado también, porque el apartado 8 dice "afeitarte o perfilarte"');
}

{
  // ⚠️ Esconder una pregunta NO borra su respuesta (F13).
  let e = conPartes(base(), ['barba']);
  e = responder(e, [['tipoBarba', 'corta'], ['longitudBarba', 'media']]);
  ok(preguntasDeBarba(e).map((p) => p.id).includes('longitudBarba'), 'Con barba, se pregunta la longitud');
  e = responder(e, [['tipoBarba', 'sin']]);
  ok(!preguntasDeBarba(e).map((p) => p.id).includes('longitudBarba'),
    '⚠️ Quien dice que ahora no lleva barba no ve la pregunta de longitud');
  eq(respuestaBarba(e, 'longitudBarba').valores, ['media'],
    '⚠️ Pero lo que había contestado NO SE BORRA: solo deja de enseñarse');
}

{
  // ⚠️ Y el progreso cuenta LO VISIBLE.
  const e = conPartes(base(), ['barba']);
  const p = progresoBarba(e);
  eq(p.total, preguntasDeBarba(e).length, '⚠️ El progreso cuenta lo que se ve, no las diez preguntas');
  ok(p.escondidas > 0, 'Y sabe cuántas se están escondiendo, para poder decirlo');
  eq(p.contestadas, 0, 'Sin contestar nada, cero');
}

/* ── 5 · ⚠️ LO QUE YA SABEMOS NO SE VUELVE A PREGUNTAR ──────────────────── */
console.log('\n5 · ⚠️ `sensibilidadPiel` ya está contestada (apartado 17)');

{
  const enRegistro = REGISTRO_DATOS.find((d) => d.id === 'sensibilidadPiel');
  ok(enRegistro.usan.includes('barba'),
    '⚠️ El registro de la Fase 4 ya decía que Barba la usa, dos fases antes de que existiera');
  ok(!PREGUNTAS_BARBA.some((p) => p.id === 'sensibilidadPiel'),
    '⚠️ Y por eso esta fase NO la vuelve a preguntar');
  ok(DATOS_QUE_YA_TENEMOS.includes('sensibilidadPiel'), 'La lee');

  let e = contestarPiel(base(), 'sensibilidadPiel', 'si', { hoy: HOY }).estado;
  const sabido = loQueYaSabemosDeTuBarba(e);
  ok(sabido.some((d) => d.id === 'sensibilidadPiel'), 'Lo contestado en Skincare llega a Barba');
  ok(sabido.every((d) => d.donde), '⚠️ Y cada uno dice DÓNDE se cambia: aquí no se edita');
  eq(contextoDeBarba(e).sensiblePiel, true, 'Y entra en el contexto');

  /* ⚠️ Pero `molestiaAfeitado` SÍ es una pregunta nueva, y no es la misma. */
  ok(PREGUNTAS_BARBA.some((p) => p.id === 'molestiaAfeitado'),
    '⚠️ `molestiaAfeitado` sí existe: reaccionar a un producto y molestarse tras la cuchilla son dos cosas');
  eq(destinoDe('molestiaAfeitado'), 'del_modulo', 'Y es del módulo, no compartida');
  eq(destinoDe('sensibilidadPiel'), 'compartido', 'Mientras que la otra es compartida');
  eq(loQueYaSabemosDeTuBarba(base()), [], 'Sin nada contestado no se le enseña nada inventado');
}

/* ── 6 · PRODUCTOS: LOS QUE YA TIENE (apartado 12) ──────────────────────── */
console.log('\n6 · ⚠️ Los productos son los del catálogo global — ni un inventario nuevo');

{
  let e = conPartes(base(), ['barba', 'productos']);
  e = crearProductoPiel(e, { nombre: 'Aftershave', categoria: 'barba' }, { hoy: HOY }).estado;
  e = crearProductoPelo(e, { nombre: 'Aceite', categoria: 'aceite' }).estado;

  const cat = catalogoParaBarba(e);
  eq(cat.length, 2, '⚠️ El catálogo son los dos inventarios que YA existen');
  ok(cat.some((p) => p.modulo === 'skincare') && cat.some((p) => p.modulo === 'pelo'),
    'Y cada uno dice de dónde sale');

  const id = cat.find((p) => p.nombre === 'Aftershave').id;
  // Prueba 7: asociar productos existentes.
  e = marcarProductoBarba(e, id).estado;
  eq(productosDeBarba(e).map((p) => p.nombre), ['Aftershave'], 'Prueba 7: se marca uno que ya tenía');
  eq(datosBarba(e).productos, [id],
    '⚠️ Y lo GUARDADO es solo el id: la ficha vive en su módulo (apartado 12)');
  eq(productosPiel(e).length, 1, '⚠️ Prueba 13: y no se ha duplicado en ningún sitio');

  eq(marcarProductoBarba(e, id).sinEfecto, true, 'Marcarlo dos veces no lo duplica');
  eq(marcarProductoBarba(e, 'no-existe').error, 'Ese producto no existe.', 'Ni se marca lo que no hay');

  const sin = quitarProductoBarba(e, id).estado;
  eq(productosDeBarba(sin), [], 'Se puede desmarcar');
  eq(productosPiel(sin).length, 1,
    '⚠️ Y desmarcarlo NO lo borra de Skincare: sigue siendo un producto suyo');

  /* ⚠️ Y si lo borra en su módulo, aquí desaparece — no se queda un nombre
     huérfano, que sería media ficha guardada aquí. */
  const borrado = eliminarProductoPiel(e, id).estado;
  eq(productosDeBarba(borrado), [], '⚠️ Si lo borra en Skincare, aquí desaparece: no se guarda su nombre');
}

/* ── 7 · LA FRECUENCIA (apartado 8) ─────────────────────────────────────── */
console.log('\n7 · Cada cuánto — y "cuando lo necesito" es una respuesta');

eq(FRECUENCIAS_AFEITADO.map((f) => f.id),
  ['diario', 'pocos_dias', 'semanal', 'quincenal', 'necesito', 'personalizado'],
  'Las seis del enunciado, en su orden');
eq(frecuenciaAfeitado('necesito').dias, null, '⚠️ "Cuando lo necesito" NO tiene días, y es correcto');
eq(frecuenciaAfeitado('personalizado').dias, null, 'Ni "Personalizado", hasta que él lo diga');

{
  const e0 = conPartes(base(), ['afeitado']);
  eq(frecuenciaDeAfeitado(e0).hay, false, 'Sin contestar, no hay frecuencia');
  ok(!/\d/.test(frecuenciaDeAfeitado(e0).texto), '⚠️ Y no se inventa un número');

  const sem = responder(e0, [['frecuenciaAfeitado', 'semanal']]);
  eq(frecuenciaDeAfeitado(sem).dias, 7, 'Semanal son siete días');

  const nec = responder(e0, [['frecuenciaAfeitado', 'necesito']]);
  eq(frecuenciaDeAfeitado(nec).hay, true, '"Cuando lo necesito" es una respuesta completa');
  eq(frecuenciaDeAfeitado(nec).dias, null, 'Sin traducirla a días');

  const per = responder(e0, [['frecuenciaAfeitado', 'personalizado']]);
  eq(frecuenciaDeAfeitado(per).hay, false, '"Personalizado" sin cifra todavía no es una frecuencia');
  ok(/dinos cada cuántos días/i.test(frecuenciaDeAfeitado(per).texto), 'Y se pide la cifra');
  const con = ponerDiasAfeitado(per, 4).estado;
  eq(frecuenciaDeAfeitado(con).dias, 4, 'Con la cifra, ya sí');

  /* ⚠️ `Number(null)` es 0 y `Number.isInteger(0)` es `true` — el fallo de F11. */
  eq(ponerDiasAfeitado(per, null).error, 'Dime cada cuántos días, con un número.', '⚠️ Un `null` no son 0 días');
  eq(ponerDiasAfeitado(per, 0).error, 'Dime cada cuántos días, con un número.', 'Ni un 0');
  eq(ponerDiasAfeitado(per, -3).error, 'Dime cada cuántos días, con un número.', 'Ni un negativo');
  eq(ponerDiasAfeitado(per, 2.5).error, 'Dime cada cuántos días, con un número.', 'Ni un decimal');
  eq(normalizarBarba({ cadaCuantosDias: 0 }).cadaCuantosDias, null, 'Y el normalizador tampoco lo deja pasar');

  // ⚠️ El choque se enseña, no se resuelve por él (como `frecuenciaDeCorte`).
  const choque = ponerDiasAfeitado(sem, 3).estado;
  eq(frecuenciaDeAfeitado(choque).choque, true, '⚠️ Si dijo una cosa y puso otra, se ENSEÑA el choque');
  ok(/perfil.*a mano/i.test(frecuenciaDeAfeitado(choque).texto), 'Con las dos, para que decida él');
}

/* ── 8 · ⚠️ NUNCA UN DIAGNÓSTICO (apartados 10 y 11) ────────────────────── */
console.log('\n8 · ⚠️ Información declarada por él, nunca un diagnóstico');

textosDeBarba().forEach((t) => {
  if (!sinDiagnostico(t)) ok(false, `⚠️ Texto con palabra clínica: "${t}"`);
});
ok(textosDeBarba().every(sinDiagnostico), `⚠️ Los ${textosDeBarba().length} textos de esta fase, sin una sola palabra clínica`);
/* ⚠️ Sobre los TEXTOS, no sobre el archivo: el comentario que explica por qué
   no se dice "¿qué te pasa?" contiene esas palabras, y es evidencia honesta.
   Novena vez que este proyecto se topa con lo mismo. */
ok(!textosDeBarba().some((t) => /¿qué te pasa|qué problema|síntoma|padeces/i.test(t)),
  'Ni una pregunta que suene a consulta médica');
ok(MOLESTIAS_AFEITADO.some((m) => m.id === 'ninguno'),
  '⚠️ Y "Ninguno" es una opción: no responder y responder que no hay nada son dos cosas');
ok(/nos lo cuentas tú/i.test(preguntaBarba('molestiasBarba').ayuda),
  'Y se dice que lo cuenta él y que la app no interpreta nada (apartado 11)');

/* ── 9 · TODAS LAS PREGUNTAS ADMITEN "NO LO SÉ" ─────────────────────────── */
console.log('\n9 · No se obliga a nada');

{
  const e = conPartes(base(), ['barba', 'afeitado']);
  const conNoSe = contestarBarba(e, 'tipoBarba', NO_LO_SE, { hoy: HOY }).estado;
  const r = respuestaBarba(conNoSe, 'tipoBarba');
  eq(r.contestada, true, '"No lo sé" cuenta como contestada');
  eq(r.noSabe, true, 'Y consta que no lo sabe');
  eq(r.puedeAprender, true, 'Y abre la puerta al contenido educativo');
  // ⚠️ Y no arrastra al resto: quien no sabe su tipo sigue viendo lo demás.
  ok(preguntasDeBarba(conNoSe).length > 1, 'Y no bloquea el resto del formulario');
  // ⚠️ "No lo sé" es exclusiva (F7).
  const luego = contestarBarba(conNoSe, 'tipoBarba', 'corta', { hoy: HOY }).estado;
  eq(respuestaBarba(luego, 'tipoBarba').noSabe, false, 'Y contestar de verdad la sustituye');
  eq(respuestaBarba(borrarBarba(luego, 'tipoBarba').estado, 'tipoBarba').contestada, false, 'Se puede borrar');
}

/* ── 10 · LAS LISTAS, LITERALES ─────────────────────────────────────────── */
console.log('\n10 · Las listas del enunciado, literales');

eq(TIPOS_BARBA.length, 7, 'Siete tipos de barba (apartado 3)');
eq(LONGITUDES_BARBA.length, 5, 'Cinco longitudes (apartado 4)');
eq(ESTILOS_BARBA.length, 7, 'Siete estilos (apartado 5)');
eq(OBJETIVOS_BARBA.length, 7, 'Siete objetivos (apartado 6)');
eq(METODOS_AFEITADO.length, 5, 'Cinco métodos (apartado 7)');
eq(PREFERENCIAS_AFEITADO.length, 6, 'Seis preferencias (apartado 9)');
eq(MOLESTIAS_AFEITADO.length, 6, 'Seis molestias (apartado 11)');
eq(TIPOS_BARBA[0].nombre, 'Sin barba actualmente', '⚠️ Y "Sin barba actualmente" es la primera, como en el enunciado');
[TIPOS_BARBA, ESTILOS_BARBA, OBJETIVOS_BARBA, METODOS_AFEITADO]
  .forEach((l, i) => ok(l.some((x) => x.id === 'otro'), `La lista ${i + 1} tiene su "Otro", como pide el enunciado`));

/* ── 11 · EL ALMACÉN Y SU NORMALIZADOR ──────────────────────────────────── */
console.log('\n11 · ⚠️ El normalizador conoce sus seis campos');

['ahoraNo', 'elegido', 'partes', 'productos', 'cadaCuantosDias', 'editado']
  .forEach((c) => ok(c in DEFAULT_BARBA, `\`${c}\` está declarado en el DEFAULT`));

{
  let e = conPartes(base(), ['barba', 'productos']);
  e = crearProductoPiel(e, { nombre: 'Aceite de barba', categoria: 'barba' }, { hoy: HOY }).estado;
  e = marcarProductoBarba(e, productosPiel(e)[0].id).estado;
  e = ponerDiasAfeitado(e, 5).estado;

  const ida = normalizarBarba(datosBarba(e));
  const vuelta = normalizarBarba(JSON.parse(JSON.stringify(ida)));
  eq(vuelta.productos.length, 1, '⚠️ Los productos SOBREVIVEN a dos normalizaciones seguidas');
  eq(vuelta.cadaCuantosDias, 5, 'Y los días');
  eq(vuelta.partes.barba, true, 'Y las partes');
  eq(vuelta.elegido, true, 'Y que ya eligió');

  eq(normalizarBarba(null).partes.seguimiento, false, 'Sin nada guardado, los valores por defecto');
  eq(normalizarBarba({ productos: [{ id: 'x' }, 'y'] }).productos, ['y'],
    '⚠️ Una ficha entera metida aquí NO se guarda: aquí solo van ids');
}

/* ── 12 · LA ESTRUCTURA QUE SE DEJA PREPARADA (regla 8) ─────────────────── */
console.log('\n12 · Regla 8: lo que todavía no funciona lo dice');

eq(PLAQUITAS_BARBA.find((p) => p.id === 'perfil').listo, true, 'El perfil funciona hoy');
eq(PLAQUITAS_BARBA.filter((p) => !p.listo).map((p) => p.fase), [21, 21, 21],
  '⚠️ Y las tres que no, dicen que llegan en la Fase 21 (condición de finalización)');
ok(!/proximamente|próximamente|en construcción|TODO:/i.test(fuente), 'Ni un "próximamente" ni un TODO');
ok(!/Math\.random/.test(codigo), 'Ni una cifra inventada');
ok(!/askAI|anthropic|claude|fetch\(/i.test(codigo), '⚠️ Sin IA: ni una llamada');
eq(auditarBarba().usaIA, 0, 'Declarado');

/* ── 13 · EL PANEL Y EL RESUMEN ─────────────────────────────────────────── */
console.log('\n13 · El panel que dibuja la pantalla');

{
  let e = conPartes(base(), ['barba', 'afeitado', 'productos']);
  e = responder(e, [['tipoBarba', 'corta'], ['nivelBarba', 'basico'], ['frecuenciaAfeitado', 'semanal']]);
  const p = panelBarba(e);
  eq(p.estado, 'a_medias', 'Sabe en qué estado está');
  ok(p.secciones.length > 0, 'Trae las secciones');
  ok(p.secciones.length > 0 && p.secciones.every((s) => s.total > 0),
    '⚠️ Y ninguna sección vacía: no se pinta un título sin nada');
  eq(p.frecuencia.dias, 7, 'Y la frecuencia');
  eq(p.partes.filter((x) => x.activa).length, 3, 'Y qué partes están encendidas');

  const r = resumenBarba(e);
  eq(r.nivel, 'Básico', 'El resumen sabe su nivel');
  eq(r.partesActivas, 3, 'Y cuántas partes lleva');
  eq(r.compartidos, ['sensibilidadPiel', 'sinPerfume', 'nivelEstilo'],
    'Y declara cuáles de los datos que usa NO son suyos');
  eq(r.productos, 0, 'Y cuántos productos ha marcado');

  eq(seccionesDeBarba(base()).every((s) => s.total > 0), true, 'Sin partes elegidas tampoco hay secciones vacías');
}

if (fallos > 0) { console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`); process.exit(1); }
console.log(`\n  ${n} comprobaciones correctas.`);
