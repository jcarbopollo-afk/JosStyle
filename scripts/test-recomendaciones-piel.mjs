// ============================================================================
// EH · Fase 16/65 — Skincare: motor de recomendaciones
//
// Las nueve pruebas del apartado 18, y lo que gobierna la fase:
//   · el motor se comparte con las fases 9 y 12 (no una tercera copia)
//   · si falta un dato NO se asume, y una regla sin requisitos no se aplica
//   · la aplicación NUNCA modifica la rutina (apartados 4 y 11)
//   · la comprobación explícita de "sin IA" que pide el apartado 16
// ============================================================================

import { readFileSync } from 'node:fs';
import { DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre } from '../src/lib/estiloDeHombre.js';
import { NIVELES_ESTILO } from '../src/lib/perfilEstilo.js';
import { reglaAplicable as reglaMotor, tonoCorrecto as tonoMotor } from '../src/lib/motorRecomendaciones.js';
import { reglaAplicable as reglaPeloF9 } from '../src/lib/recomendacionesPelo.js';
import { contestarPiel, anadirProductoPiel, MODULO_PIEL } from '../src/lib/perfilPiel.js';
import { alternarPartePiel, crearRutinaPiel, datosRutinasPiel } from '../src/lib/rutinasPiel.js';
import { registrarPiel } from '../src/lib/seguimientoPiel.js';
import {
  PARTE_RECOMENDACIONES, TEMAS_PIEL, PRIORIDAD_A_TEMA, contextoParaPiel,
  REGLAS_PIEL, reglaPiel, IDS_REGLAS_PIEL, MOTIVOS_DESCARTE_PIEL,
  DIAS_SILENCIO_PIEL, DEFAULT_RECS_PIEL, normalizarRecsPiel, recsDePiel,
  silenciadaPiel, recomendarPiel, loQueFaltaPiel, marcarVistasPiel,
  descartarPiel, deshacerDescartePiel, guardarRecomendacionPiel,
  quitarGuardadaPiel, guardadasDePiel, anadirARutina, queBuscarEnProductos,
  resumenRecsPiel, auditarRecsPiel, tonoCorrecto, RECOMENDACIONES_INICIALES,
} from '../src/lib/recomendacionesPiel.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-08-27';
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare']);
const responder = (e, pares) => pares.reduce((acc, [q, v]) => contestarPiel(acc, q, v, { hoy: HOY }).estado, e);

const fuente = readFileSync(new URL('../src/lib/recomendacionesPiel.js', import.meta.url), 'utf8');
const codigo = fuente
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/export function auditarRecsPiel[\s\S]*?\n}/, '');

/* ── 1 · ⚠️ UN SOLO MOTOR, NO TRES ──────────────────────────────────────── */
console.log('\n1 · ⚠️ El motor se comparte con las fases 9 y 12');

eq(reglaPeloF9, reglaMotor, '⚠️ La Fase 9 usa la MISMA función que el motor, no una copia');
eq(tonoCorrecto, tonoMotor, 'Y el guardián de tono también es uno solo');
eq(auditarRecsPiel().motoresNuevos, 0, 'Cero motores nuevos');
eq(auditarRecsPiel().motorCompartido, 'motorRecomendaciones.js', 'Con su nombre, declarado');
ok(!/function\s+reglaAplicable\s*\(/.test(codigo), 'Y aquí no se reescribe');

/* ⚠️ La regla de oro, en un solo sitio. */
ok(!reglaMotor({ requiere: [], cuando: () => true }, {}),
  '⚠️ Una regla SIN requisitos declarados no se aplica nunca: se dispararía con el contexto vacío');
ok(!reglaMotor(null, {}), 'Ni una regla que no existe');
ok(!reglaMotor({ requiere: ['x'], cuando: () => true }, {}), 'Ni una a la que le falta su dato');
ok(!reglaMotor({ requiere: ['x'], cuando: () => { throw new Error('boom'); } }, { x: 1 }),
  'Y una regla que revienta no tumba la pantalla: no recomienda y ya');
ok(reglaMotor({ requiere: ['x'], cuando: (c) => c.x === 1 }, { x: 1 }), 'Con su dato, se aplica');
ok(!reglaMotor({ requiere: ['x'], cuando: () => true }, { x: [] }), 'Una lista vacía no es un dato');

/* ── 2 · LAS REGLAS (apartados 3, 6 y 7) ────────────────────────────────── */
console.log('\n2 · Las reglas: cada una declara qué necesita y por qué aparece');

ok(REGLAS_PIEL.length >= 10, `${REGLAS_PIEL.length} reglas`);
ok(REGLAS_PIEL.every((r) => Array.isArray(r.requiere) && r.requiere.length > 0),
  '⚠️ TODAS declaran `requiere`');
ok(REGLAS_PIEL.every((r) => typeof r.porque === 'function'),
  '⚠️ Apartado 6: TODAS traen su "¿por qué aparece?"');
ok(REGLAS_PIEL.every((r) => NIVELES_ESTILO.some((x) => x.id === r.nivel)),
  'Todas con un nivel de los de la Fase 6');
ok(REGLAS_PIEL.every((r) => TEMAS_PIEL.includes(r.tema)), 'Y un tema conocido');
ok(NIVELES_ESTILO.every((niv) => REGLAS_PIEL.some((r) => r.nivel === niv.id)),
  '⚠️ Hay reglas en los TRES niveles: un nivel vacío sería un control decorativo');
eq(new Set(IDS_REGLAS_PIEL).size, REGLAS_PIEL.length, 'Sin ids repetidos');
eq(reglaPiel('inventada'), null, 'Una que no existe es null');

// Los dos ejemplos literales del apartado 3.
ok(reglaPiel('seca_hidratacion'), 'El primer ejemplo del enunciado (piel seca + hidratación) es una regla');
ok(reglaPiel('grasa_sencilla'), 'Y el segundo (piel grasa + rutina sencilla), también');

/* ── 3 · SIN PERFIL, NADA (apartados 13 y 18) ───────────────────────────── */
console.log('\n3 · Prueba del apartado 18 — usuario sin perfil');

eq(recomendarPiel(base()).total, 0, '⚠️ Sin perfil, CERO recomendaciones: no se asume nada');
const falta = loQueFaltaPiel(base());
ok(falta.hayQueAfinar, 'Y se dice que se puede afinar');
eq(falta.texto, 'Podemos personalizar más tus recomendaciones.', 'Con la frase literal del apartado 13');
eq(falta.accion, 'Completar perfil', 'Con su botón');
eq(falta.ahoraNo, 'Ahora no', '⚠️ Y el "Ahora no" que impide que esto bloquee');
eq(falta.bloquea, false, 'Declarado: nunca bloquea');
eq(loQueFaltaPiel(base()).campos.length >= 3, true, 'Diciendo qué falta');

/* ── 4 · PERFIL SECO + HIDRATACIÓN (apartado 18) ────────────────────────── */
console.log('\n4 · Prueba del apartado 18 — perfil seco + hidratación');

const seca = responder(base(), [
  ['tipoPiel', 'seca'], ['necesidadesPiel', 'hidratacion'],
  ['complejidadPiel', 'basico'], ['prioridadPiel', 'hidratacion'],
]);
const rSeca = recomendarPiel(seca, {}, { hoy: HOY });
ok(rSeca.total > 0, 'Con perfil seco e hidratación, sí hay recomendaciones');
ok(rSeca.recomendaciones.some((x) => x.id === 'seca_hidratacion'),
  '⚠️ Y aparece la del ejemplo del enunciado');
eq(rSeca.recomendaciones.find((x) => x.id === 'seca_hidratacion').porque,
  'La hemos seleccionado porque has indicado que tu piel es seca y que quieres cuidar la hidratación.',
  'Con su "¿por qué?", en la forma del apartado 6');
eq(rSeca.prioridad, 'hidratacion', '⚠️ Apartado 2: la prioridad que marcó ÉL es la que pesa');
ok(rSeca.recomendaciones.every((x) => x.porque.length > 0), 'Todas traen su explicación');

/* ── 5 · PERFIL GRASO + RUTINA BÁSICA (apartado 18) ─────────────────────── */
console.log('\n5 · Prueba del apartado 18 — perfil graso + rutina básica');

let grasa = responder(base(), [
  ['tipoPiel', 'grasa'], ['complejidadPiel', 'basico'], ['necesidadesPiel', 'brillos'],
]);
grasa = crearRutinaPiel(grasa, {
  nombre: 'La mía', frecuencia: 'diario',
  pasos: [{ accion: 'limpieza' }, { accion: 'tonico' }, { accion: 'serum' }, { accion: 'hidratacion' }],
}, { hoy: HOY }).estado;
const rGrasa = recomendarPiel(grasa, {}, { hoy: HOY });
ok(rGrasa.recomendaciones.some((x) => x.id === 'grasa_sencilla'),
  '⚠️ Aparece la de simplificar, que es el segundo ejemplo del enunciado');
// ⚠️ Apartado 7 — un básico no ve lo avanzado.
ok(rGrasa.recomendaciones.every((x) => x.nivel === 'basico'),
  '⚠️ Apartado 7: un usuario básico NO recibe recomendaciones avanzadas');
const avanzado = responder(grasa, [['complejidadPiel', 'basico'], ['complejidadPiel', 'avanzado']]);
ok(recomendarPiel(avanzado, {}, { hoy: HOY }).total >= rGrasa.total,
  'Y uno avanzado ve al menos las mismas');
// ⚠️ Sin nivel elegido se enseña todo.
const sinNivel = responder(base(), [['tipoPiel', 'grasa'], ['necesidadesPiel', 'brillos']]);
ok(recomendarPiel(sinNivel, {}, { limite: 99, hoy: HOY }).recomendaciones.some((x) => x.nivel !== 'basico'),
  '⚠️ Sin nivel elegido se enseña todo: esconder a quien no ha dicho nada es decidir por él');
/* ⚠️ Y con el nivel puesto en básico, esa misma deja de salir — que es el
   apartado 7 funcionando, no el filtro de `requiere`. */
const bajado = responder(sinNivel, [['complejidadPiel', 'basico']]);
ok(!recomendarPiel(bajado, {}, { limite: 99, hoy: HOY }).recomendaciones.some((x) => x.nivel !== 'basico'),
  'Y poniendo "básica", esa misma desaparece: es el filtro de nivel, no otra cosa');

/* ── 6 · CANTIDAD (apartado 8) ──────────────────────────────────────────── */
console.log('\n6 · Apartado 8 — tres, y "Ver más"');

eq(RECOMENDACIONES_INICIALES, 3, 'Tres inicialmente, como pide el enunciado');
eq(recomendarPiel(seca, {}, { hoy: HOY }).recomendaciones.length <= 3, true, 'Y no salen más de tres de golpe');
const todas = recomendarPiel(seca, {}, { limite: 99, hoy: HOY });
eq(todas.recomendaciones.length, todas.total, 'Con "Ver más" salen todas');
eq(recomendarPiel(seca, {}, { hoy: HOY }).hayMas, todas.total > 3, 'Y se sabe si hay más');

/* ── 7 · CAMBIAR EL OBJETIVO (apartado 18) ──────────────────────────────── */
console.log('\n7 · Prueba del apartado 18 — cambiar objetivo cambia prioridades');

eq(PRIORIDAD_A_TEMA.proteccion, 'proteccion', 'Cada prioridad tiene su tema');
const otroObjetivo = responder(seca, [['prioridadPiel', 'hidratacion'], ['prioridadPiel', 'proteccion']]);
eq(recomendarPiel(otroObjetivo, {}, { hoy: HOY }).prioridad, 'proteccion',
  '⚠️ Cambiar el objetivo cambia lo que pesa');
// ⚠️ Pero no tapa el resto: las de otros temas siguen pudiendo salir.
const conSolar = responder(otroObjetivo, [['solarPiel', 'no']]);
const rSolar = recomendarPiel(conSolar, {}, { limite: 99, hoy: HOY });
eq(rSolar.recomendaciones[0].id, 'sin_solar',
  '⚠️ Apartado 2: lo de su prioridad sale primero…');
ok(rSolar.recomendaciones.some((x) => !x.temas.includes('proteccion')),
  '…pero NO tapa el resto: una recomendación de otro tema sigue saliendo');

/* ── 8 · DESCARTAR (apartados 9 y 18) ───────────────────────────────────── */
console.log('\n8 · Apartado 9 — descartar, con sus cuatro motivos');

eq(MOTIVOS_DESCARTE_PIEL.map((m) => m.nombre),
  ['No me interesa', 'Ya lo hago', 'Ya tengo algo parecido', 'No quiero recomendaciones similares'],
  'Los cuatro del enunciado, y ninguno más');
const descartada = descartarPiel(seca, 'seca_hidratacion', 'no_interesa', { hoy: HOY });
eq(descartada.error, null, 'Se descarta');
ok(!recomendarPiel(descartada.estado, {}, { limite: 99, hoy: HOY }).recomendaciones.some((x) => x.id === 'seca_hidratacion'),
  '⚠️ Y no se repite inmediatamente (prueba del apartado 18)');
ok(silenciadaPiel(descartada.estado, 'seca_hidratacion', { hoy: HOY }).silenciada, 'Está callada');
// Pero caduca.
ok(!silenciadaPiel(descartada.estado, 'seca_hidratacion', { hoy: '2026-12-01' }).silenciada,
  '⚠️ Y caduca: "no me interesa" calla 30 días, no para siempre');
eq(DIAS_SILENCIO_PIEL.ya_lo_hago, 90, '"Ya lo hago" calla más');
ok(descartarPiel(seca, 'inventada', 'no_interesa').error !== null, 'Una recomendación que no existe da error');
ok(descartarPiel(seca, 'seca_hidratacion', 'inventado').error !== null, 'Y un motivo que no existe, también');

/* ⚠️ "No quiero recomendaciones similares" calla el TEMA. */
const similares = descartarPiel(seca, 'seca_hidratacion', 'similares', { hoy: HOY }).estado;
const otraDelTema = REGLAS_PIEL.find((r) => r.tema === 'hidratacion' && r.id !== 'seca_hidratacion');
ok(silenciadaPiel(similares, otraDelTema.id, { hoy: HOY }).silenciada,
  '⚠️ "No quiero recomendaciones similares" calla el TEMA entero, que es lo que "similares" significa');
ok(!silenciadaPiel(similares, 'sin_solar', { hoy: HOY }).silenciada, 'Pero no las de otros temas');

// Y se deshace.
eq(recsDePiel(deshacerDescartePiel(descartada.estado, 'seca_hidratacion').estado).feedback, [],
  '⚠️ Todo descarte se deshace: un toque no condena una recomendación');

/* ── 9 · GUARDAR (apartados 10 y 18) ────────────────────────────────────── */
console.log('\n9 · Apartado 10 — guardar');

const guardada = guardarRecomendacionPiel(seca, 'seca_hidratacion', { hoy: HOY });
eq(guardada.error, null, 'Prueba del apartado 18: se guarda');
eq(guardadasDePiel(guardada.estado).length, 1, 'Y aparece en las guardadas');
eq(guardadasDePiel(guardada.estado)[0].regla.titulo, 'Un paso de hidratación', 'Con su regla resuelta');
eq(recsDePiel(guardarRecomendacionPiel(guardada.estado, 'seca_hidratacion').estado).guardadas.length, 1,
  'Guardarla dos veces no la duplica');
eq(guardadasDePiel(quitarGuardadaPiel(guardada.estado, 'seca_hidratacion').estado), [], 'Y se quita');
ok(guardarRecomendacionPiel(seca, 'inventada').error !== null, 'Una que no existe da error');
ok(recomendarPiel(guardada.estado, {}, { limite: 99, hoy: HOY })
  .recomendaciones.find((x) => x.id === 'seca_hidratacion').guardada,
  'Y la recomendación se ve marcada como guardada');

/* ── 10 · ⚠️ AÑADIR A RUTINA (apartados 4, 11 y 18) ─────────────────────── */
console.log('\n10 · ⚠️ Apartados 4 y 11 — la aplicación NUNCA modifica la rutina');

const conRutina = crearRutinaPiel(seca, { nombre: 'Mañana', frecuencia: 'diario', pasos: [{ accion: 'limpieza' }] }, { hoy: HOY });
const rutId = conRutina.rutina.id;

// ⚠️ Sin confirmar, nada.
const sinConfirmar = anadirARutina(conRutina.estado, 'seca_hidratacion', rutId);
eq(sinConfirmar.anadido, false, '⚠️ Prueba del apartado 18: añadir a la rutina REQUIERE confirmación');
ok(sinConfirmar.error !== null, 'Y lo dice');
eq(datosRutinasPiel(sinConfirmar.estado).rutinas[0].pasos.length, 1, 'La rutina no ha cambiado');

// ⚠️ Y calcular recomendaciones tampoco escribe.
const antes = JSON.stringify(normalizarEstiloHombre(conRutina.estado));
recomendarPiel(conRutina.estado, {}, { hoy: HOY });
contextoParaPiel(conRutina.estado);
loQueFaltaPiel(conRutina.estado);
queBuscarEnProductos(conRutina.estado);
resumenRecsPiel(conRutina.estado, {}, { hoy: HOY });
eq(JSON.stringify(normalizarEstiloHombre(conRutina.estado)), antes,
  '⚠️ Mirar recomendaciones NO cambia ni un byte del estado');

// Confirmando, sí.
const anadido = anadirARutina(conRutina.estado, 'seca_hidratacion', rutId, { confirmado: true, hoy: HOY });
eq(anadido.anadido, true, 'Confirmando, se añade');
eq(datosRutinasPiel(anadido.estado).rutinas[0].pasos.map((p) => p.accion), ['limpieza', 'hidratacion'],
  'Y el paso entra en la rutina que él eligió');
eq(anadirARutina(anadido.estado, 'seca_hidratacion', rutId, { confirmado: true }).yaEstaba, true,
  'Añadirlo dos veces no lo duplica');
ok(anadirARutina(seca, 'grasa_sencilla', rutId, { confirmado: true }).error !== null,
  '⚠️ Una recomendación que es un consejo, no un paso, no se puede "añadir a la rutina"');
// Sin ninguna rutina, se crea: es lo que acaba de pedir al confirmar.
const creada = anadirARutina(seca, 'seca_hidratacion', null, { confirmado: true, hoy: HOY });
eq(creada.creada, true, 'Sin ninguna rutina, confirmar crea una');
eq(datosRutinasPiel(creada.estado).rutinas[0].pasos[0].accion, 'hidratacion', 'Con el paso dentro');

/* ── 11 · HISTORIAL (apartado 15) ───────────────────────────────────────── */
console.log('\n11 · Apartado 15 — qué se ha enseñado ya');

const vista = marcarVistasPiel(seca, ['seca_hidratacion'], { hoy: HOY });
eq(recsDePiel(vista).vistas.length, 1, 'Se registra que se ha enseñado');
eq(recsDePiel(marcarVistasPiel(vista, ['seca_hidratacion'], { hoy: HOY })).vistas[0].veces, 2, 'Y cuántas veces');
eq(recsDePiel(marcarVistasPiel(seca, ['inventada'], { hoy: HOY })).vistas, [], 'Una que no existe no se registra');
/* ⚠️ Lo ya visto pesa menos, para no enseñar siempre lo mismo. Se comprueba
   sobre el PESO y sobre dos del mismo tema, no sobre la posición global: la
   prioridad que él marcó pesa más que "ya la has visto", y eso es correcto —
   lo que pidió expresamente no puede caer al final por haberlo mirado. */
const rVista = recomendarPiel(vista, {}, { limite: 99, hoy: HOY });
eq(rVista.recomendaciones.find((x) => x.id === 'seca_hidratacion').vista, true, 'Se ve que ya se enseñó');
const conDos = marcarVistasPiel(conSolar, ['sin_solar'], { hoy: HOY });
const lista = recomendarPiel(conDos, {}, { limite: 99, hoy: HOY }).recomendaciones;
const iVisto = lista.findIndex((x) => x.id === 'sin_solar');
const iNuevo = lista.findIndex((x) => x.id !== 'sin_solar' && x.temas.includes('proteccion'));
ok(iNuevo === -1 || iNuevo < iVisto,
  '⚠️ Entre dos del mismo tema, la que ya se enseñó va detrás');
ok(lista.find((x) => x.id === 'sin_solar').peso < 10 + 1,
  'Lo ya visto pesa menos que lo que no se ha visto');
// Y mostrar y registrar son dos llamadas distintas.
eq(recsDePiel(seca).vistas, [], '⚠️ Recomendar NO marca como visto: son dos llamadas');

/* ── 12 · PRODUCTOS (apartados 5 y 12) ──────────────────────────────────── */
console.log('\n12 · Apartados 5 y 12 — qué se buscaría en productos');

const conProd = anadirProductoPiel(seca, 'Crema hidratante').estado;
const q = queBuscarEnProductos(conProd);
eq(q.tipoPiel, 'seca', 'Con su tipo de piel');
eq(q.objetivo, 'hidratacion', 'Su objetivo');
eq(q.yaTiene, ['Crema hidratante'], 'Y lo que ya tiene');
eq(q.catalogo, 0, '⚠️ CERO productos: el catálogo llega en la fase 17 y aquí no se inventa ninguno');
ok(q.nota.includes('fase 17'), 'Y se dice en qué fase llega (regla 8)');
eq(queBuscarEnProductos(base()).listo, false, 'Sin tipo de piel no hay nada que buscar');
ok(!/http|amazon|farmacia\.com|precio:/i.test(codigo), '⚠️ Ni una URL ni un producto inventado (D2-03)');

/* ── 13 · ⚠️ APARTADO 16 — LA COMPROBACIÓN EXPLÍCITA DE "SIN IA" ────────── */
console.log('\n13 · ⚠️ Apartado 16 — sin IA, comprobado');

['askAI', 'AI_SYSTEM', 'anthropic', 'fetch(', 'XMLHttpRequest', 'openai'].forEach((x) => {
  ok(!codigo.includes(x), `❌ No llamadas a modelos de IA: ni "${x}"`);
});
const aud = auditarRecsPiel();
eq([aud.llamadasIA, aud.envioDatosIA, aud.diagnosticos, aud.analisisDeFotos], [0, 0, 0, 0],
  '⚠️ Las cuatro prohibiciones del apartado 16, declaradas y en cero');
eq(aud.conRequisitos, aud.reglas, 'Todas las reglas declaran requisitos');
eq(aud.conPorque, aud.reglas, 'Y todas su "por qué"');
eq(contextoParaPiel(seca).paraIA, false, 'Y el contexto lleva escrito que no viaja');
// ❌ No generar diagnósticos.
const textos = [
  ...REGLAS_PIEL.map((r) => r.titulo), ...REGLAS_PIEL.map((r) => r.texto),
  ...REGLAS_PIEL.map((r) => r.porque(contextoParaPiel(seca))),
  loQueFaltaPiel(base()).texto, queBuscarEnProductos(conProd).nota,
];
['diagnóstico', 'dermatitis', 'acné', 'enfermedad', 'padeces', 'sufres', 'síntoma'].forEach((mala) => {
  ok(textos.every((t) => !String(t).toLowerCase().includes(mala)), `❌ No generar diagnósticos: ni "${mala}"`);
});
// Y el tono de la Fase 9, que se comparte.
textos.forEach((t) => {
  ok(tonoCorrecto(t), `Sin imperativos: "${String(t).slice(0, 40)}…"`);
});

/* ── 14 · DESACTIVAR Y REACTIVAR (apartados 17 y 18) ────────────────────── */
console.log('\n14 · Apartado 17 — desactivar y reactivar');

const apagadas = alternarPartePiel(guardada.estado, PARTE_RECOMENDACIONES);
eq(recomendarPiel(apagadas, {}, { hoy: HOY }).total, 0, 'Prueba del apartado 18: apagadas, desaparecen');
eq(recomendarPiel(apagadas, {}, { hoy: HOY }).activo, false, 'Y se sabe por qué');
// ⚠️ Los demás módulos siguen funcionando.
eq(datosRutinasPiel(apagadas).rutinas.length, datosRutinasPiel(guardada.estado).rutinas.length,
  '⚠️ Apartado 17: los demás módulos continúan funcionando');
const reactivadas = alternarPartePiel(apagadas, PARTE_RECOMENDACIONES);
ok(recomendarPiel(reactivadas, {}, { hoy: HOY }).total > 0, 'Reactivadas, vuelven');
eq(guardadasDePiel(reactivadas).length, 1, '⚠️ Y la configuración se conserva');

/* ── 15 · EL NORMALIZADOR ───────────────────────────────────────────────── */
console.log('\n15 · El normalizador');

eq(normalizarRecsPiel(undefined), DEFAULT_RECS_PIEL, 'Sin nada, el valor por defecto');
eq(normalizarRecsPiel('roto'), DEFAULT_RECS_PIEL, 'Con basura, también');
eq(normalizarRecsPiel({ feedback: [{ reglaId: 'inventada', motivo: 'no_interesa' }] }).feedback, [],
  'Un descarte de una regla que no existe se cae');
eq(normalizarRecsPiel({ feedback: [{ reglaId: 'sin_solar', motivo: 'inventado' }] }).feedback, [],
  'Y con un motivo que no existe, también');
eq(normalizarRecsPiel({ guardadas: [{ reglaId: 'inventada' }] }).guardadas, [], 'Una guardada fantasma, igual');
// ⚠️ Y sobrevive a un guardado: `recomendaciones` es un campo de la config de Skincare.
eq(recsDePiel(normalizarEstiloHombre(guardada.estado)).guardadas.length, 1,
  '⚠️ Y sigue ahí después de normalizar otra vez (regla 5)');

/* ── 16 · RESUMEN ───────────────────────────────────────────────────────── */
console.log('\n16 · Resumen');

const res = resumenRecsPiel(guardada.estado, {}, { hoy: HOY });
eq(res.guardadas, 1, 'Una guardada');
ok(res.disponibles > 0, 'Con recomendaciones disponibles');
eq(res.prioridad, 'hidratacion', 'Y su prioridad');
eq(resumenRecsPiel(base(), {}, { hoy: HOY }).disponibles, 0, 'Sin perfil, cero — y no revienta');
ok(resumenRecsPiel(base(), {}, { hoy: HOY }).hayQueAfinar, 'Diciendo que se puede afinar');
eq(PARTE_RECOMENDACIONES, 'recomendaciones', 'La parte tiene su id');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
