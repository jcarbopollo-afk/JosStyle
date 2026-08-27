// ============================================================================
// EH · Fase 6/65 — PRUEBAS
//
// Los diez tests del apartado 16. Los dos que más importan son el **7** ("no
// rellenar ningún campo → el módulo sigue funcionando") y el **9** ("comprobar
// que no se duplica la información del armario"), porque los dos fallan sin
// hacer ruido: uno deja una pantalla rota solo para quien no rellena nada, y el
// otro da dos listas de colores que se separan con el tiempo.
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, alternarModulo, normalizarEstiloHombre,
} from '../src/lib/estiloDeHombre.js';
import { leerDato, REGISTRO_DATOS, datoDelRegistro } from '../src/lib/datosEstiloHombre.js';
import { DEFAULT_ARMARIO, crearPrenda, crearOutfit, COLORES_ARMARIO, OCASIONES_OUTFIT } from '../src/lib/armario.js';
import {
  ZONA_MI_ESTILO, ESTILOS_VESTIR, PRIORIDADES_ESTILO, IMAGENES_PERSONALES,
  NIVELES_ESTILO, nivelEstilo, LISTAS_PRESTADAS,
  coloresDisponibles, ocasionesDisponibles, marcasDisponibles,
  CAMPOS_PERFIL_ESTILO, campoPerfil, IDS_PERFIL_ESTILO,
  leerCampo, alternarValor, ordenarValores, anadirLibre, limpiarCampo,
  perfilDeEstilo, nombreDeValor, estadoDelPerfil,
  MINIMO_PARA_REFLEJAR, OCASION_A_ESTILO, CATEGORIA_A_ESTILO,
  loQueReflejaTuArmario, contrasteConElArmario,
  perfilParaRecomendaciones, reglasDelPerfil, auditarPerfilEstilo, resumenPerfilEstilo,
} from '../src/lib/perfilEstilo.js';

let n = 0;
let fallos = 0;
function ok(cond, msg) {
  n += 1;
  if (cond) { console.log(`  ✓ ${msg}`); return; }
  fallos += 1;
  console.log(`  ✗ ${msg}`);
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function eq(a, b, msg) {
  n += 1;
  if (igual(a, b)) { console.log(`  ✓ ${msg}`); return; }
  fallos += 1;
  console.log(`  ✗ ${msg} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);
}

const HOY = '2026-08-27';
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['estilo']);
const set = (e, id, v) => alternarValor(e, id, v, { hoy: HOY }).estado;

const prendas = [
  crearPrenda({ nombre: 'Camiseta', categoria: 'camisetas', color: 'negro', marca: 'Zara' }),
  crearPrenda({ nombre: 'Chándal', categoria: 'chandal', color: 'gris', marca: 'Nike' }),
  crearPrenda({ nombre: 'Shorts', categoria: 'shorts', color: 'azul', marca: 'Nike' }),
  crearPrenda({ nombre: 'Sudadera', categoria: 'sudaderas', color: 'negro', marca: 'Adidas' }),
  crearPrenda({ nombre: 'Zapatillas', categoria: 'zapatillas', color: 'blanco', marca: 'Nike' }),
];
const ARMARIO = {
  ...DEFAULT_ARMARIO,
  prendas,
  outfits: [
    crearOutfit({ nombre: 'Entreno', prendaIds: [prendas[1].id], ocasion: 'deporte' }),
    crearOutfit({ nombre: 'Clase', prendaIds: [prendas[0].id], ocasion: 'estudios' }),
  ],
};

/* ── 1 · ACCESO Y LISTAS (apartados 1, 2, 3, 9 y 10) ─────────────────────── */

eq(ZONA_MI_ESTILO.dentroDe, 'estilo', '⚠️ Apartado 1: "Mi estilo" va DENTRO de Estilo y Armario');
ok(!ZONA_MI_ESTILO.fase, 'Y no es un módulo nuevo del catálogo: "no crear otro apartado principal"');

eq(ESTILOS_VESTIR.length, 10, 'Los diez estilos del enunciado');
ok(ESTILOS_VESTIR.some((e) => e.id === 'smart_casual'), 'Con Smart casual');
ok(ESTILOS_VESTIR.some((e) => e.id === 'otro'), 'Y con "Otro"');
eq(PRIORIDADES_ESTILO.length, 6, 'Las seis prioridades');
eq(IMAGENES_PERSONALES.length, 8, 'Las ocho imágenes del apartado 9');

// ⚠️ Los niveles nacen aquí: las fases 18 y 22 los usarán.
eq(NIVELES_ESTILO.map((x) => x.nombre), ['Básico', 'Intermedio', 'Avanzado'], 'Los tres niveles del apartado 10');
ok(NIVELES_ESTILO.every((x) => x.icono && x.orden), 'Con su color y su orden');
eq(nivelEstilo('intermedio').icono, '🟡', 'El amarillo del enunciado');
eq(nivelEstilo('inventado'), null, 'Un nivel que no existe devuelve null');

/* ── 2 · ⚠️ TEST 9 — NO SE DUPLICA NADA DEL ARMARIO ──────────────────────── */

// *"No duplicar el sistema de paletas si ya existe"* (4), *"reutilizar las
//  marcas existentes"* (5), *"mantener la información desarrollada"* (6).
eq(coloresDisponibles(), COLORES_ARMARIO, '⚠️ Apartado 4: los colores SON los del armario');
eq(ocasionesDisponibles(), OCASIONES_OUTFIT, '⚠️ Apartado 6: las ocasiones también');
eq(marcasDisponibles(ARMARIO), ['Adidas', 'Nike', 'Zara'], '⚠️ Apartado 5: las marcas salen de sus prendas');
eq(marcasDisponibles(null), [], 'Sin armario, ninguna — y no revienta');
eq(marcasDisponibles({}), [], 'Con un armario vacío tampoco');

const fuente = readFileSync(new URL('../src/lib/perfilEstilo.js', import.meta.url), 'utf8');
/* ⚠️ Estas comprobaciones miran el CÓDIGO, no los comentarios. Sin quitarlos
   fallaban por dos frases explicativas: la que dice que NO hay un `perfilEstilo:
   {}` aparte, y "conseguir", que contiene "seguir". Una prueba que salta con la
   prosa acaba haciendo que se reescriba la prosa en vez del código. */
const codigo = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
ok(!/const\s+COLORES_ARMARIO\s*=/.test(fuente), '⚠️ Test 9: no redefine los colores');
ok(!/const\s+OCASIONES_OUTFIT\s*=/.test(fuente), '⚠️ Test 9: ni las ocasiones');
ok(!/const\s+MARCAS\w*\s*=\s*\[/.test(fuente), '⚠️ Test 9: ni una lista de marcas');
ok(!/askAI|AI_SYSTEM|anthropic/i.test(fuente), '⚠️ Apartado 11: ni una llamada a la IA');

// Las tres listas prestadas están declaradas, con dónde viven de verdad.
eq(Object.keys(LISTAS_PRESTADAS).sort(), ['colores', 'marcas', 'ocasiones'], 'Las tres listas prestadas');
ok(Object.values(LISTAS_PRESTADAS).every((l) => l.de && l.constante && l.apartado),
  'Cada una dice de dónde sale y por qué apartado');

// ⚠️ Y ningún campo del perfil tiene almacén propio: todos en la capa de F4.
ok(IDS_PERFIL_ESTILO.every((id) => datoDelRegistro(id) !== null),
  '⚠️ Los once campos del perfil viven en el registro de la Fase 4, no aquí');
ok(!/DEFAULT_PERFIL_ESTILO|perfilEstilo:\s*\{/.test(codigo),
  '⚠️ Y no hay un almacén `perfilEstilo` paralelo');

// Y no se han creado unos `estilosFavoritos` nuevos: son los que ya había.
eq(REGISTRO_DATOS.filter((d) => d.id === 'estilosFavoritos').length, 1,
  '⚠️ Test 9: UN solo `estilosFavoritos` — la Fase 5 ya lo había creado');
eq(REGISTRO_DATOS.filter((d) => d.id === 'coloresFavoritos').length, 1, '⚠️ Y un solo `coloresFavoritos`');

/* ── 3 · TEST 1 — VARIOS ESTILOS (apartado 2) ────────────────────────────── */

let e = base();
e = set(e, 'estilosFavoritos', 'casual');
e = set(e, 'estilosFavoritos', 'deportivo');
e = set(e, 'estilosFavoritos', 'minimalista');
eq(leerCampo(e, 'estilosFavoritos').valores, ['casual', 'deportivo', 'minimalista'],
  '⚠️ Test 1: tres estilos a la vez — "no asumir que una persona tiene un único estilo"');
eq(leerCampo(set(e, 'estilosFavoritos', 'casual'), 'estilosFavoritos').valores, ['deportivo', 'minimalista'],
  'Test 2: volver a tocarlo lo quita');

// Un campo de valor único se comporta distinto, y a propósito.
let conNivel = set(base(), 'nivelEstilo', 'basico');
eq(leerCampo(conNivel, 'nivelEstilo').valores, ['basico'], 'El nivel es uno solo');
conNivel = set(conNivel, 'nivelEstilo', 'avanzado');
eq(leerCampo(conNivel, 'nivelEstilo').valores, ['avanzado'], '⚠️ Y elegir otro SUSTITUYE, no acumula');
eq(leerCampo(set(conNivel, 'nivelEstilo', 'avanzado'), 'nivelEstilo').valores, [],
  'Volver a tocar el mismo lo quita');

ok(alternarValor(base(), 'inventado', 'x').error !== null, 'Un campo que no existe se rechaza');

/* ── 4 · TEST 5 Y 6 — COLORES Y MARCAS (apartados 4 y 5) ─────────────────── */

let conColores = set(set(base(), 'coloresFavoritos', 'negro'), 'coloresFavoritos', 'azul');
conColores = set(conColores, 'coloresEvitar', 'amarillo');
eq(leerCampo(conColores, 'coloresFavoritos').valores, ['negro', 'azul'], 'Test 5: los que le gustan');
eq(leerCampo(conColores, 'coloresEvitar').valores, ['amarillo'], 'Test 5: y los que evita');
ok(coloresDisponibles().some((c) => c.id === 'negro'), 'Los ids son los del armario');
eq(nombreDeValor('coloresFavoritos', 'negro'), 'Negro', '⚠️ Y el nombre sale del armario, no de una lista nueva');

let conMarcas = set(set(base(), 'marcasFavoritas', 'Nike'), 'marcasEvitar', 'Zara');
eq(leerCampo(conMarcas, 'marcasFavoritas').valores, ['Nike'], 'Test 6: marcas favoritas');
eq(leerCampo(conMarcas, 'marcasEvitar').valores, ['Zara'], 'Test 6: y las que no quiere');
eq(nombreDeValor('marcasFavoritas', 'Nike'), 'Nike', 'Una marca se llama como se llama');

// ⚠️ Apartado 5 — "no obligar al usuario a seleccionar ninguna".
eq(leerCampo(base(), 'marcasFavoritas').valores, [], 'De partida, ninguna marca');
const sinPrendas = perfilDeEstilo(base(), DEFAULT_ARMARIO);
ok(sinPrendas.find((c) => c.id === 'marcasFavoritas').sinOpciones,
  '⚠️ Sin prendas no hay marcas que ofrecer, y se dice en vez de una lista vacía muda');

/* ── 5 · PRIORIDADES CON ORDEN (apartado 3) ──────────────────────────────── */

let conPrio = set(set(set(base(), 'prioridadesEstilo', 'calidad'), 'prioridadesEstilo', 'comodidad'), 'prioridadesEstilo', 'precio');
eq(leerCampo(conPrio, 'prioridadesEstilo').valores, ['calidad', 'comodidad', 'precio'], 'Tres prioridades');
const ordenado = ordenarValores(conPrio, 'prioridadesEstilo', ['comodidad', 'calidad', 'precio']).estado;
eq(leerCampo(ordenado, 'prioridadesEstilo').valores, ['comodidad', 'calidad', 'precio'],
  '⚠️ Apartado 3: el orden ES la prioridad');
const parcial = ordenarValores(conPrio, 'prioridadesEstilo', ['precio']).estado;
eq(leerCampo(parcial, 'prioridadesEstilo').valores, ['precio', 'calidad', 'comodidad'],
  '⚠️ Lo que no venga en el orden se queda DETRÁS, no desaparece');
ok(ordenarValores(base(), 'estilosFavoritos', ['casual']).error !== null,
  'Un campo sin orden declarado rechaza que se le ordene');
eq(leerCampo(ordenarValores(conPrio, 'prioridadesEstilo', ['inventada']).estado, 'prioridadesEstilo').valores.length, 3,
  'Un valor que no tiene no se cuela por el orden');

/* ── 6 · TESTS 3 Y 4 — INTERESES Y COSAS QUE HACER (apartados 7 y 8) ─────── */

let libre = anadirLibre(base(), 'intereses', 'Fútbol', { hoy: HOY }).estado;
libre = anadirLibre(libre, 'intereses', 'Música', { hoy: HOY }).estado;
eq(leerCampo(libre, 'intereses').valores, ['Fútbol', 'Música'], 'Test 3: los intereses');

libre = anadirLibre(libre, 'quiereHacer', 'Viajar', { hoy: HOY }).estado;
eq(leerCampo(libre, 'quiereHacer').valores, ['Viajar'], 'Test 4: y lo que le gustaría hacer');
ok(leerCampo(libre, 'intereses').valores.length === 2,
  '⚠️ Apartado 8: son DOS listas separadas, no una');

ok(anadirLibre(libre, 'intereses', 'fútbol', { hoy: HOY }).sinEfecto,
  '⚠️ No se duplica por mayúsculas: "fútbol" ya estaba como "Fútbol"');
ok(anadirLibre(libre, 'intereses', '   ', { hoy: HOY }).sinEfecto, 'Ni se añade un espacio en blanco');
ok(anadirLibre(base(), 'estilosFavoritos', 'algo').error !== null,
  'Un campo de opciones no admite texto libre');
eq(leerCampo(anadirLibre(base(), 'intereses', '  Gaming  ', { hoy: HOY }).estado, 'intereses').valores, ['Gaming'],
  'Y se recorta');

// ⚠️ Apartado 7 — "esto no tiene que convertirse en una red social".
ok(!/amigo|seguidor|compartir|publicar|red social/i.test(codigo),
  '⚠️ Apartado 7: ni una palabra de red social en el código');

/* ── 7 · ⚠️ TEST 7 — CON TODO VACÍO, TODO FUNCIONA (apartado 13) ─────────── */

const vacio = base();
const perfilVacio = perfilDeEstilo(vacio, ARMARIO);
eq(perfilVacio.length, CAMPOS_PERFIL_ESTILO.length, 'Test 7: salen los once campos');
ok(perfilVacio.every((c) => Array.isArray(c.valores) && c.valores.length === 0),
  '⚠️ Test 7: todos vacíos, y ninguno es null');
ok(perfilVacio.every((c) => c.titulo), 'Cada uno con su título');
const est = estadoDelPerfil(vacio, ARMARIO);
eq(est.rellenos, 0, 'Test 7: cero rellenos');
ok(est.valido, '⚠️ Test 7: y AUN ASÍ el perfil es válido — un perfil vacío es un perfil');
ok(est.vacio, 'Y lo dice');

// ⚠️ Y no hay barra de progreso que empuje.
ok(!/porcentaje|completado|incompleto|%/.test(JSON.stringify(estadoDelPerfil(vacio, ARMARIO))),
  '⚠️ Apartado 13: ni porcentaje ni "incompleto" — no se le pone nota');

// El motor de reglas con el perfil vacío: cero reglas, no un error.
eq(reglasDelPerfil(vacio, ARMARIO), [], 'Test 7: sin perfil, cero reglas');
ok(perfilParaRecomendaciones(vacio, ARMARIO).vacio, 'Y quien lo use puede saberlo');
eq(perfilParaRecomendaciones(vacio, ARMARIO).nivel, null, 'Sin nivel, null y no undefined');

// Quedarse sin nada borra el dato en vez de guardar una lista vacía.
const unoSolo = set(base(), 'estilosFavoritos', 'casual');
const otraVezVacio = set(unoSolo, 'estilosFavoritos', 'casual');
ok(!leerDato(otraVezVacio, 'estilosFavoritos', {}).tiene,
  '⚠️ Quitar el último borra el dato: guardar `[]` y decir después "no lo has indicado" es mentir a medias');

// Y limpiar un campo entero.
eq(leerCampo(limpiarCampo(conPrio, 'prioridadesEstilo').estado, 'prioridadesEstilo').valores, [],
  'Apartado 12: se puede limpiar un campo entero');
ok(limpiarCampo(base(), 'inventado').error !== null, 'Un campo que no existe no se limpia');

/* ── 8 · TEST 8 — LOS CAMBIOS LLEGAN A LAS RECOMENDACIONES ───────────────── */

const conPerfil = set(set(set(base(), 'estilosFavoritos', 'deportivo'), 'coloresEvitar', 'rosa'), 'prioridadesEstilo', 'comodidad');
const reglas = reglasDelPerfil(conPerfil, ARMARIO);
ok(reglas.length === 3, 'Test 8: tres reglas del perfil');
ok(reglas.every((r) => r.porque && r.porque.length > 5), '⚠️ Cada regla dice POR QUÉ: sin caja negra');
eq(reglas.find((r) => r.id === 'color_evitar').evitar, ['rosa'], 'La de evitar colores');
eq(reglas.find((r) => r.id === 'prioridad').primera, 'comodidad', 'Y la prioridad, que es la primera');
ok(reglas.find((r) => r.id === 'prioridad').porque.includes('comodidad'), 'Con su nombre legible dentro');

// Test 2 y 8 — cambiar y que el cambio se note.
const cambiado = set(conPerfil, 'coloresEvitar', 'negro');
eq(reglasDelPerfil(cambiado, ARMARIO).find((r) => r.id === 'color_evitar').evitar, ['rosa', 'negro'],
  '⚠️ Test 8: el cambio llega solo, porque no hay copia intermedia');

// ⚠️ Apartado 15 — lo personal no viaja a las recomendaciones.
const conDeseos = anadirLibre(conPerfil, 'quiereHacer', 'Aprender guitarra', { hoy: HOY }).estado;
const paraRec = perfilParaRecomendaciones(conDeseos, ARMARIO);
ok(!JSON.stringify(paraRec).includes('guitarra'),
  '⚠️ Apartado 15: lo que le gustaría hacer NO sale en el contexto de recomendaciones');
ok(paraRec.noIncluye.includes('quiereHacer'), 'Y se declara qué se ha dejado fuera');
ok(paraRec.porQue.length > 10, 'Con el motivo escrito, no un hueco');

/* ── 9 · LO QUE REFLEJA EL ARMARIO (apartado 14) ─────────────────────────── */

eq(MINIMO_PARA_REFLEJAR, 4, 'Hace falta un mínimo para afirmar algo');
const pocas = loQueReflejaTuArmario({ ...DEFAULT_ARMARIO, prendas: prendas.slice(0, 2) });
ok(!pocas.suficiente, '⚠️ Con dos prendas NO se afirma nada');
eq(pocas.texto, '', '⚠️ Y el texto es vacío, no una frase a medias');
eq(pocas.hacenFalta, 4, 'Se dice cuántas harían falta');
eq(loQueReflejaTuArmario(null).suficiente, false, 'Sin armario tampoco');
eq(loQueReflejaTuArmario({ prendas: 'roto' }).suficiente, false, 'Ni con basura');

const refleja = loQueReflejaTuArmario(ARMARIO);
ok(refleja.suficiente, 'Con cinco prendas y dos outfits sí');
ok(refleja.texto.startsWith('Tu armario refleja principalmente:'),
  '⚠️ La frase LITERAL del enunciado');
ok(refleja.estilos.length > 0 && refleja.estilos.length <= 3, 'Como mucho tres estilos');
eq(refleja.estilos[0].id, 'deportivo', 'El chándal, los shorts y el outfit de deporte pesan');
ok(refleja.origen.includes('outfit'), '⚠️ Y dice de dónde sale: sin caja negra');

// ⚠️ La tabla de interpretación está declarada entera, para poder discutirla.
ok(Object.keys(OCASION_A_ESTILO).every((o) => OCASIONES_OUTFIT.some((x) => x.id === o)),
  '⚠️ Toda ocasión interpretada existe de verdad en el armario');
ok(Object.values(OCASION_A_ESTILO).every((s) => ESTILOS_VESTIR.some((x) => x.id === s)),
  'Y todo estilo al que apunta, también');
ok(Object.values(CATEGORIA_A_ESTILO).every((s) => ESTILOS_VESTIR.some((x) => x.id === s)),
  'Igual con las categorías');
ok(!('pantalones' in CATEGORIA_A_ESTILO),
  '⚠️ Un pantalón NO dice de qué estilo es, así que no está en la tabla: adivinar es inventar');

// El contraste describe, no corrige.
const conEstiloElegante = set(base(), 'estilosFavoritos', 'elegante');
const contraste = contrasteConElArmario(conEstiloElegante, ARMARIO);
ok(contraste.hayContraste, 'Hay algo que contrastar');
eq(contraste.coinciden, [], 'Y no coincide con lo que ha elegido');
ok(contraste.texto.includes('puede ser justo lo que buscas cambiar'),
  '⚠️ Apartado 14: informativo, NO una corrección');
['deberías', 'error', 'incorrecto', 'mal', 'no encaja'].forEach((x) => {
  ok(!contraste.texto.toLowerCase().includes(x), `Nunca "${x}"`);
});
ok(!contrasteConElArmario(base(), ARMARIO).hayContraste, 'Sin estilos elegidos no se contrasta nada');
ok(!contrasteConElArmario(conEstiloElegante, DEFAULT_ARMARIO).hayContraste, 'Ni con el armario vacío');
ok(contrasteConElArmario(set(base(), 'estilosFavoritos', 'deportivo'), ARMARIO).coinciden.length === 1,
  'Y cuando coincide, lo dice');

/* ── 10 · TEST 10 — DESACTIVAR NO PIERDE EL PERFIL ───────────────────────── */

const apagado = alternarModulo(conPerfil, 'estilo', false);
eq(leerCampo(apagado, 'estilosFavoritos').valores, ['deportivo'],
  '⚠️ Test 10: apagar Estilo y Armario NO borra las preferencias');
eq(reglasDelPerfil(apagado, ARMARIO).length, 3, 'Y las reglas siguen calculándose');
const reencendido = alternarModulo(apagado, 'estilo', true);
eq(leerCampo(reencendido, 'estilosFavoritos').valores, ['deportivo'], 'Test 10: y al volver, intactas');

// Y sobrevive al guardado (regla 5).
const tras = normalizarEstiloHombre(JSON.parse(JSON.stringify(conPerfil)));
eq(leerCampo(tras, 'estilosFavoritos').valores, ['deportivo'], 'El perfil sobrevive al guardado');
eq(leerCampo(tras, 'prioridadesEstilo').valores, ['comodidad'], 'Los dos campos');

/* ── 11 · AUDITORÍA Y RESUMEN ────────────────────────────────────────────── */

const aud = auditarPerfilEstilo(conPerfil, ARMARIO);
eq(aud.almacenesPropios, 0, '⚠️ Test 9: CERO almacenes propios');
eq(aud.camposEnRegistro, aud.camposTotal, '⚠️ Todos los campos en la capa de la Fase 4');
eq(aud.listasPrestadas, 3, 'Tres listas prestadas del armario');
eq(aud.listasPropias, 4, 'Y cuatro propias, que no existían en ningún sitio');
eq(aud.camposRellenos, 3, 'Tres campos rellenos');

const res = resumenPerfilEstilo(conPerfil, ARMARIO);
eq(res.total, 11, 'Los once campos');
eq(res.rellenos, 3, 'Tres rellenos');
eq(res.reglas, 3, 'Tres reglas');
eq(res.marcasDisponibles, 3, 'Y las tres marcas de su armario');
ok(res.refleja.length > 0, 'Con lo que refleja su armario');
eq(resumenPerfilEstilo(base(), DEFAULT_ARMARIO).refleja, '', 'Y sin armario, sin frase');
ok(resumenPerfilEstilo(base(), null).vacio, 'Sin armario ni perfil no revienta');

if (fallos > 0) {
  console.log(`\n  ${fallos} de ${n} comprobaciones han fallado.`);
  process.exit(1);
}
console.log(`\n  ${n} comprobaciones correctas.`);
