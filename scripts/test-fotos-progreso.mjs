/* ===========================================================================
   FIT F26/45 — EL PROGRESO FÍSICO EN FOTOS

   Las dieciocho pruebas del apartado 39, más lo que esta fase tiene que
   demostrar que NO hace: crear una segunda lista de fotos, guardar una URL
   firmada, analizar el cuerpo, prometer que un borrado se recupera, o dejar
   que una foto rota se lleve por delante la galería entera.
   =========================================================================== */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CAMPOS_QUE_YA_EXISTIAN, VISIBILIDAD_PRIVADA, VISIBILIDADES, TAGS_FOTO, tagFoto,
  crearFotoProgreso, normalizarFotoProgreso, normalizarFotosProgreso, editarFotoProgreso,
  etiquetaDeDia, diasDeFotos, fotosEnOrden, fotoPorId, vecinasDeFoto,
  MINIMO_PARA_COMPARAR, FALTA_OTRA_FOTO, compararFotos, diasEntreFechas, textoDeDistancia,
  opcionesParaComparar, puedeComparar, LADO_MAXIMO, CALIDAD_JPEG, dimensionesOptimizadas,
  ORIENTACION, VACIO_FOTOS, ERRORES_FOTO, ESTADOS_FOTOS, estadoFotos, FOTOS_POR_TANDA,
  pantallaDeFotos, TRAS_ENTRENAR, sesionDeFoto, casillasDeFotos, auditarFotos,
  NO_EN_FIT26, DECISIONES_FIT26,
} from '../src/lib/fotosProgreso.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
/* ⚠️ Comentarios Y cadenas: este archivo explica lo que no hace, y la propia
   explicación haría saltar los barridos (la lección de siempre). */
const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
  .replace(/'(?:\\.|[^'\\])*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""')
  .replace(/`(?:\\.|[^`\\])*`/g, '``');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}
const seccion = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

const LIB = leer('src/lib/fotosProgreso.js');
const COMP = leer('src/components/fotosProgreso.jsx');
const APP = leer('src/App.jsx');

/* ── Escenarios ──────────────────────────────────────────────────────────── */
/** ⚠️ Con la forma que de VERDAD tiene lo guardado desde la Fase 3: sin los
    cinco campos que añade esta fase. Sembrarlas ya normalizadas no probaría la
    migración (la lección de las fábricas de escenarios, FIT F22). */
const VIEJAS = [
  { id: 'v1', path: 'usuario/1.jpg', fecha: '2026-06-12', nota: 'Inicio del verano' },
  { id: 'v2', path: 'usuario/2.jpg', fecha: '2026-09-12', nota: '' },
  { id: 'v3', path: 'usuario/3.jpg', fecha: '2026-09-12', nota: 'Inicio de curso' },
];
const UNA = [VIEJAS[0]];

seccion('1-4 · Sin fotos, una, varias, y varias del mismo día');
{
  const vacio = pantallaDeFotos([]);
  ok(vacio.estado.id === 'vacio' && vacio.total === 0, 'Sin fotos el estado es «vacío»');
  ok(vacio.vacio === VACIO_FOTOS && /Empieza a registrar tu progreso/.test(vacio.vacio.titulo),
    'Con el texto del apartado 24…');
  ok(vacio.vacio.cta === 'Añadir primera foto', '…y su CTA, que es una salida de verdad');
  ok(vacio.dias.length === 0 && vacio.orden.length === 0, 'Y ni un día ni una foto que enseñar');

  const una = pantallaDeFotos(UNA);
  ok(una.estado.id === 'una' && una.total === 1, 'Con una foto el estado es «una»');
  ok(una.dias.length === 1 && una.dias[0].cuantas === 1, 'Y su día, con una foto');

  const p = pantallaDeFotos(VIEJAS);
  ok(p.estado.id === 'varias' && p.total === 3, 'Con tres, «varias»');
  /* 🚨 Apartado 10 — varias del mismo día se agrupan. */
  ok(p.dias.length === 2, `Tres fotos en DOS días: las del mismo día se agrupan (${p.dias.length})`);
  const sept = p.dias.find((d) => d.fecha === '2026-09-12');
  ok(sept && sept.cuantas === 2 && sept.texto === '2 fotos', 'El día con dos lo dice: «2 fotos»');
  /* Apartado 6 — pero **cada una sigue siendo un registro independiente**. */
  ok(p.orden.length === 3 && new Set(p.orden.map((f) => f.id)).size === 3,
    '🚨 Y siguen siendo TRES registros: agrupar es para verlas, no para guardarlas');
  ok(sept.nota === 'Inicio de curso', 'La nota del día es la que él escribió, no una inventada');
  /* Apartado 9 — más reciente primero. */
  ok(p.dias[0].fecha > p.dias[1].fecha, 'Los días van de más reciente a más antiguo');
  ok(p.dias[0].etiqueta === '12 SEP 2026', `Con su rótulo del apartado 10 (${p.dias[0].etiqueta})`);
}

seccion('5 · La fecha se puede cambiar (apartado 3)');
{
  /* 🚨 *"El usuario puede subir hoy una fotografía tomada hace meses"*. */
  const editadas = editarFotoProgreso(normalizarFotosProgreso(VIEJAS), 'v2', { fecha: '2026-01-05' }, { ahora: Date.UTC(2026, 8, 19) });
  const f = editadas.find((x) => x.id === 'v2');
  ok(f.fecha === '2026-01-05', 'La fecha de la foto se edita');
  const antes = normalizarFotosProgreso(VIEJAS).find((x) => x.id === 'v2');
  ok(f.createdAt === antes.createdAt, '🚨 Y `createdAt` NO se mueve: cuándo la subió es un hecho');
  ok(f.actualizadaEn !== antes.actualizadaEn, '…pero sí se apunta que la tocó');
  ok(f.path === antes.path && f.id === antes.id, 'Ni el camino ni el id cambian: apuntarían a otro archivo');
  /* Y la agrupación se mueve con ella. */
  ok(diasDeFotos(editadas).length === 3, 'Al cambiarle el día, la galería la reagrupa sola');
  /* Falsificable: una fecha vacía no la borra. */
  ok(editarFotoProgreso(editadas, 'v2', { fecha: '' })[1].fecha === '2026-01-05',
    'Y una fecha vacía no se la borra');
}

seccion('6-7 · La nota y las etiquetas');
{
  const con = crearFotoProgreso({ path: 'u/x.jpg', nota: '  Después de entrenar  ', tags: ['frontal', 'lateral'] });
  ok(con.nota === 'Después de entrenar', 'La nota se guarda limpia');
  ok(con.tags.join(',') === 'frontal,lateral', 'Y las etiquetas elegidas');
  /* Apartados 18 y 19 — las dos son opcionales. */
  const sin = crearFotoProgreso({ path: 'u/y.jpg' });
  ok(sin.nota === '' && sin.tags.length === 0, 'Las dos son opcionales: sin nota y sin etiquetas');
  /* Una etiqueta que no existe no se guarda: sería un valor que nadie sabe pintar. */
  ok(crearFotoProgreso({ path: 'u/z.jpg', tags: ['frontal', 'inventada'] }).tags.join(',') === 'frontal',
    'Una etiqueta que no está en el catálogo se descarta');
  ok(TAGS_FOTO.length === 5 && TAGS_FOTO.every((t) => t.id && t.nombre), 'Las cinco del apartado 19, con su nombre');
  ok(!!tagFoto('espalda') && !tagFoto('loquesea'), 'Y se consultan por id');
}

seccion('8-9 · Eliminación y cancelación');
{
  /* 🚨 Apartado 22 — *"No eliminar todo el grupo del mismo día accidentalmente"*.
     Aquí eso sale gratis: cada foto es un registro, así que quitar una por su id
     no puede llevarse a su vecina. */
  const limpias = normalizarFotosProgreso(VIEJAS);
  const quedan = limpias.filter((f) => f.id !== 'v2');
  const p = pantallaDeFotos(quedan);
  ok(p.total === 2, 'Borrar una deja las otras dos');
  ok(p.dias.find((d) => d.fecha === '2026-09-12').cuantas === 1,
    '🚨 Y la del MISMO día sigue ahí: no se borra el grupo entero');
  /* Apartado 23 — la papelera. Aquí NO la hay, y está declarado. */
  ok(!/eliminarConPapelera|CATALOGO_PAPELERA/.test(soloCodigo(LIB)),
    'La librería no promete una papelera que no existe');
  ok(NO_EN_FIT26.some((x) => /papelera/i.test(x.que) && /huérfano|deshacer/i.test(x.porque)),
    'Y se declara POR QUÉ: las fotos están fuera del deshacer desde la Fase 3');
  /* El aviso dice la verdad (apartado 22). */
  ok(/no se puede deshacer/i.test(COMP), 'El aviso de borrado dice que no se puede deshacer');
  ok(!/Eliminados recientes|se puede recuperar/i.test(COMP),
    '…y NO promete que se recupere, que sería mentir en pantalla');
  /* Apartado 5 — cancelar en la previsualización no guarda nada. */
  ok(/onCancelar/.test(COMP) && /Cancelar/.test(COMP), 'La previsualización se puede cancelar');
  ok(!/onGuardar\(\)/.test(soloCodigo(COMP).replace(/onGuardar\(\{[^}]*\}\)/g, '')),
    '🚨 Y no se guarda nada mientras está en la previsualización (apartado 5)');
}

seccion('10 · La comparación (apartados 13 y 14)');
{
  const c = compararFotos(VIEJAS, 'v1', 'v3');
  ok(c.hay === true, 'Dos fotos se comparan');
  ok(c.antes.fecha === '2026-06-12' && c.despues.fecha === '2026-09-12', 'Junio es el ANTES y septiembre el DESPUÉS');
  /* 🚨 Apartado 14 — y lo decide la FECHA, no el orden en que las eligió. */
  const alReves = compararFotos(VIEJAS, 'v3', 'v1');
  ok(alReves.antes.id === c.antes.id && alReves.despues.id === c.despues.id,
    '🚨 Eligiéndolas al revés sale LO MISMO: manda la fecha, no el orden de selección');
  ok(c.etiquetaAntes === '12 JUN 2026' && c.etiquetaDespues === '12 SEP 2026', 'Con sus dos rótulos');
  ok(c.dias === 92 && /3 meses/.test(c.texto), `Y el tiempo entre las dos (${c.dias} días → «${c.texto}»)`);
  /* La misma foto dos veces no es una comparación. */
  ok(compararFotos(VIEJAS, 'v1', 'v1').hay === false, 'La misma foto dos veces no compara');
  ok(compararFotos(VIEJAS, 'v1', 'noexiste').hay === false, 'Y una que no existe, tampoco');
  /* Apartado 17 — la selección es sencilla: fecha y foto. */
  const ops = opcionesParaComparar(VIEJAS);
  ok(ops.length === 3 && ops.every((o) => o.id && o.fecha && o.etiqueta && o.path), 'Las opciones traen fecha y foto');
  ok(!/calendario|Calendar/i.test(soloCodigo(LIB)), 'Sin un calendario complejo (apartado 17)');
  /* 🚨 Apartados 14 y 41 — ni una palabra sobre el cuerpo. */
  const textos = [c.texto, textoDeDistancia(0), textoDeDistancia(1), textoDeDistancia(20), textoDeDistancia(400)].join(' · ');
  ['músculo', 'grasa', 'masa', 'has ganado', 'has perdido', 'mejor', 'peor', 'definido'].forEach((p) => {
    ok(!new RegExp(p, 'i').test(textos), `La comparación no dice «${p}»`);
  });
  ok(textoDeDistancia(0) === 'El mismo día' && textoDeDistancia(1) === '1 día de diferencia',
    'Lo único que se afirma es el tiempo entre las dos');
  /* ⚠️ Y en LOCAL, que es la trampa del UTC por enésima vez. */
  ok(diasEntreFechas('2026-03-28', '2026-03-30') === 2, 'Los días se cuentan en local, cruzando el cambio de hora');
}

seccion('11 · Fotos con distintas proporciones (apartado 15)');
{
  /* 🚨 *"Nunca estirar una imagen para que encaje"* — y eso es `object-contain`. */
  ok(/object-contain/.test(COMP), 'La comparación usa `object-contain`, que no deforma');
  ok(!/object-fill/.test(COMP), 'Y en ningún sitio `object-fill`, que estiraría');
  const conContain = (COMP.match(/object-contain/g) || []).length;
  ok(conContain >= 3, `Lo usan la previsualización, el visor y la comparación (${conContain})`);
  /* Apartado 8 — y la reducción conserva la proporción. */
  const d = dimensionesOptimizadas(4032, 3024);
  ok(d.ancho === LADO_MAXIMO && d.reducida, `Una foto enorme se reduce al lado máximo (${d.ancho}×${d.alto})`);
  ok(Math.abs((d.ancho / d.alto) - (4032 / 3024)) < 0.01, 'Conservando exactamente su proporción');
  ok(dimensionesOptimizadas(800, 600).reducida === false, 'Y una pequeña NO se agranda: no mejora nada y pesa más');
  ok(dimensionesOptimizadas(0, 0).ancho === 0, 'Con medidas imposibles no se inventa un tamaño');
  ok(CALIDAD_JPEG >= 0.8, `La calidad no es destructiva (${CALIDAD_JPEG}, apartado 8)`);
  /* Apartado 7 — la orientación NO se rota a mano. */
  ok(ORIENTACION.seRota === false && /EXIF/i.test(ORIENTACION.porque), 'La orientación no se rota: el navegador ya lo hace');
  ok(/imageOrientation/.test(COMP), '…y al redimensionar se conserva (`imageOrientation`)');
  ok(/return file/.test(COMP), 'Y si algo falla se sube el original: peor sin comprimir que girada');
}

seccion('12-13 · Foto asociada a un entrenamiento, y entrenamiento borrado');
{
  const conSesion = crearFotoProgreso({ path: 'u/a.jpg', createdFromWorkoutId: 's1' });
  const fitness = { sesiones: [{ id: 's1', estado: 'completada' }] };
  const s = sesionDeFoto(conSesion, fitness);
  ok(s.hay && s.existe && s.texto === TRAS_ENTRENAR, 'Con sesión se dice «Después de entrenamiento»');
  /* 🚨 Apartado 33 — la foto sigue existiendo aunque la sesión se elimine. */
  const sinSesion = sesionDeFoto(conSesion, { sesiones: [] });
  ok(sinSesion.hay === true && sinSesion.existe === false,
    '🚨 Borrada la sesión, el enlace queda sin asociación — y la foto NO se toca');
  ok(normalizarFotoProgreso(conSesion).createdFromWorkoutId === 's1',
    '🚨 Y el normalizador NO limpia el id: borrarlo perdería que se hizo tras entrenar');
  ok(/ya no existe/i.test(COMP), 'Y la pantalla lo dice en vez de ofrecer un enlace muerto (regla 8)');
  /* Apartado 20 — y no es obligatorio. */
  ok(crearFotoProgreso({ path: 'u/b.jpg' }).createdFromWorkoutId === null, 'Asociarla no es obligatorio');
  ok(sesionDeFoto(crearFotoProgreso({ path: 'u/b.jpg' }), fitness).hay === false, 'Sin asociación no se pinta nada');
}

seccion('14-15 · Error de guardado y de lectura');
{
  /* Apartado 28 — *"No marcarla como guardada si no existe realmente"*. */
  ok(/No se ha podido guardar la foto/.test(ERRORES_FOTO.guardar.titulo), 'El error de guardado, con las palabras del apartado 28');
  ok(/No se ha subido nada/.test(ERRORES_FOTO.guardar.que), '…y dice que no se ha subido nada');
  /* Apartado 29 — una foto que no está NO rompe la galería. */
  ok(/no se puede mostrar/i.test(ERRORES_FOTO.leer.titulo), 'El error de lectura tiene su texto');
  ok(/Las demás siguen bien/.test(ERRORES_FOTO.leer.que), '🚨 …y dice expresamente que las demás siguen');
  ok(/fallidas/.test(COMP), 'La galería marca las que fallan una a una, no entera');
  /* Y ninguno dice «Error» a secas (EH F62). */
  [ERRORES_FOTO.guardar, ERRORES_FOTO.leer].forEach((e) => {
    ok(!/^Error/i.test(e.titulo) && !/null|undefined|token|JSON/i.test(`${e.titulo} ${e.que}`),
      `«${e.titulo}» dice qué ha pasado, sin palabras técnicas`);
  });
}

seccion('16 · Persistencia (apartado 27)');
{
  /* 🚨 Y la que de verdad importa: los cinco campos nuevos SOBREVIVEN al
     guardado, que es la regla 5 por enésima vez. */
  const migrada = normalizarFotoProgreso(VIEJAS[0]);
  ['createdAt', 'tags', 'createdFromWorkoutId', 'visibility', 'actualizadaEn'].forEach((c) => {
    ok(Object.prototype.hasOwnProperty.call(migrada, c), `Lo guardado en la Fase 3 estrena «${c}»`);
  });
  ok(migrada.id === 'v1' && migrada.path === 'usuario/1.jpg' && migrada.fecha === '2026-06-12' && migrada.nota === 'Inicio del verano',
    '🚨 …y NO pierde nada de lo que ya tenía');
  ok(migrada.createdAt.startsWith('2026-06-12'),
    'Su `createdAt` se deduce de su fecha, que es lo único que se sabe de ella');
  /* 🚨 Y el normalizador corre AL CARGAR, o el siguiente guardado se los lleva. */
  ok(/normalizarFotosProgreso\(sf\)/.test(APP),
    '🚨 `App.jsx` normaliza `saludFotos` al cargar (sin esto, la regla 5 se los llevaría)');
  ok(/import \{[^}]*crearFotoProgreso[^}]*\} from '\.\/lib\/fotosProgreso'/.test(APP),
    'Y la foto la construye su fábrica, con todos sus campos');
  /* Segunda pasada = lo mismo: es idempotente. */
  ok(JSON.stringify(normalizarFotoProgreso(migrada)) === JSON.stringify(migrada),
    'Normalizar dos veces da lo mismo: no se desvía en cada carga');
}

seccion('17 · Muchas fotos (apartados 26 y 37)');
{
  const muchas = Array.from({ length: 120 }, (_, i) => ({
    id: `m${i}`, path: `u/${i}.jpg`, fecha: `2026-0${(i % 9) + 1}-1${i % 9}`, nota: '',
  }));
  const t0 = Date.now();
  const p = pantallaDeFotos(muchas);
  const ms = Date.now() - t0;
  ok(p.total === 120, '120 fotos entran enteras');
  ok(ms < 300, `Y la pantalla se arma rápido (${ms} ms)`);
  ok(p.dias.length > 1 && p.dias.every((d, i) => i === 0 || p.dias[i - 1].fecha > d.fecha), 'Agrupadas y ordenadas');
  /* 🚨 No se piden todas las URLs firmadas de golpe. */
  ok(FOTOS_POR_TANDA > 0 && FOTOS_POR_TANDA < 120, `Se firman por tandas de ${FOTOS_POR_TANDA}, no las 120`);
  ok(/slice\(0, cuantas\)/.test(COMP), 'La galería solo firma las que va necesitando');
  ok(/loading="lazy"/.test(COMP), 'Y las miniaturas cargan en diferido (apartado 37)');
}

seccion('18 · En el móvil (apartados 12, 16 y 36)');
{
  ok(/createPortal/.test(COMP), '🚨 El visor sale por `createPortal` (regla 3 del proyecto)');
  ok(/var\(--safe-top\)/.test(COMP) && /var\(--safe-bottom\)/.test(COMP), 'Y respeta la Safe Area del iPhone');
  ok(/overflow-auto/.test(COMP), 'Apartado 12 — la imagen grande se puede desplazar');
  ok(/toque-44/.test(COMP), 'Apartado 36 — las zonas de toque son de 44 px');
  /* Apartado 36 — los botones dicen qué hacen, sin depender del icono.
     🐛 Y se cuentan **las dos formas**: `aria-label="…"` y `aria-label={`…`}`.
     Mirando solo las comillas salían cuatro de los siete que hay, porque los
     que llevan el nombre de la foto dentro van con plantilla. */
  const labels = [
    ...[...COMP.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1]),
    ...[...COMP.matchAll(/aria-label=\{`([^`]+)`\}/g)].map((m) => m[1]),
  ];
  ok(labels.length >= 5, `Los botones llevan nombre accesible (${labels.length})`);
  ['Cerrar', 'anterior', 'siguiente'].forEach((q) => {
    ok(labels.some((l) => new RegExp(q, 'i').test(l)), `…incluido «${q}»`);
  });
  ok(/alt=/.test(COMP), 'Y cada imagen lleva su `alt`');
  ok(!/onTouchStart|onSwipe/.test(soloCodigo(COMP)),
    '⚠️ Sin gestos exclusivos: todo lo que se puede hacer tiene su botón visible (EH F50)');
}

/* ═══════════════════════════════════════════════════════════════════════════
   LO QUE ESTA FASE TIENE QUE DEMOSTRAR QUE NO HACE
   ═══════════════════════════════════════════════════════════════════════════ */

seccion('🚨 No hay una segunda lista de fotos');
{
  ok(!/saludFotos\s*=|fotos:\s*\[\]/.test(soloCodigo(LIB)), 'La librería no declara ninguna lista propia');
  ok(!/saveData|localStorage/.test(soloCodigo(LIB)), 'Y no guarda nada por su cuenta');
  ok(!/DEFAULT_FOTOS|fitness\.fotos/.test(soloCodigo(LIB)), 'Ni una clave nueva en `fitness`');
  ok(/uploadProgressPhoto/.test(APP) && /deleteProgressPhoto/.test(APP), 'Se sube y se borra por las funciones de siempre');
  ok(/getSignedPhotoUrl/.test(COMP), 'Y se lee con la firma de siempre');
  ok(NO_EN_FIT26.some((x) => /segunda lista/i.test(x.que)), 'Está declarado, con su motivo');
  ok(CAMPOS_QUE_YA_EXISTIAN.length === 3 && CAMPOS_QUE_YA_EXISTIAN.every((c) => c.pide && c.es && c.porque),
    'Los tres campos del apartado 2 que ya existían, con su nombre real y su porqué');
  ok(CAMPOS_QUE_YA_EXISTIAN.map((c) => c.es).join(',') === 'path,fecha,nota', '…que son `path`, `fecha` y `nota`');
}

seccion('🚨 Ni una URL firmada guardada (E3 F17 y NAV F3)');
{
  const f = crearFotoProgreso({ path: 'u/a.jpg' });
  ok(!Object.prototype.hasOwnProperty.call(f, 'url'), 'La foto no tiene campo `url`');
  ok(!Object.prototype.hasOwnProperty.call(normalizarFotoProgreso({ path: 'u/a.jpg', url: 'https://x' }), 'url'),
    '🚨 Y si alguien guardara una, el normalizador se la lleva: caduca en una hora');
  ok(!/https?:\/\//.test(JSON.stringify(f)), 'Ni una dirección dentro del dato');
}

seccion('🚨 Privacidad (apartados 21 y 38)');
{
  ok(VISIBILIDAD_PRIVADA === 'private', 'La visibilidad por defecto es privada');
  ok(crearFotoProgreso({ path: 'u/a.jpg' }).visibility === VISIBILIDAD_PRIVADA, 'Toda foto nueva nace privada');
  /* 🚨 Y cualquier valor raro vuelve a privada, nunca al revés. */
  ok(normalizarFotoProgreso({ path: 'u/a.jpg', visibility: 'public' }).visibility === VISIBILIDAD_PRIVADA,
    '🚨 Un «public» guardado a mano vuelve a privada al cargar');
  ok(VISIBILIDADES.length === 1, 'Y solo existe un valor: un selector con uno sería decorativo (regla 8)');
  ok(!/compartir|share|publico|followers/i.test(soloCodigo(LIB)), 'Ninguna función de compartir');
  ok(!/fetch\(|axios|ask-ai/.test(soloCodigo(LIB)) && !/fetch\(|ask-ai/.test(soloCodigo(COMP)),
    '🚨 Y ni una foto sale hacia ninguna API externa (apartado 38)');
  /* C-35 — la misma protección que en Salud. */
  ok(/fotosDesbloqueadas/.test(APP), 'La galería de Fitness usa la protección `fotos_privadas`…');
  ok(/protectedActions\.includes\('fotos_privadas'\)/.test(APP) && /estaDesbloqueado\('accion:fotos_privadas'\)/.test(APP),
    '🚨 …leída del MISMO sitio que la de Salud, no de un segundo criterio (C-35)');
  ok(DECISIONES_FIT26.some((d) => /C-35/.test(d.porque)), 'Y queda anotada como C-35');
}

seccion('🚨 Ni análisis del cuerpo, ni IA, ni recomendaciones (apartado 41)');
{
  const todos = JSON.stringify([
    VACIO_FOTOS, ERRORES_FOTO, ESTADOS_FOTOS, TAGS_FOTO, FALTA_OTRA_FOTO, TRAS_ENTRENAR,
    pantallaDeFotos(VIEJAS).texto,
    pantallaDeFotos(VIEJAS).dias.map((d) => [d.etiqueta, d.texto, d.nota]),
    compararFotos(VIEJAS, 'v1', 'v3').texto,
  ]);
  [/grasa corporal/i, /masa muscular/i, /\banaliza/i, /\bIA\b/, /te recomiendo/i, /deberías/i,
    /has ganado/i, /has perdido/i, /\bfiltro/i].forEach((re) => {
    ok(!re.test(todos), `Ningún texto generado dice ${re}`);
  });
  /* Y que el barrido SÍ caza un ejemplo malo (EH F42). */
  ok(/grasa corporal/i.test('Tu grasa corporal ha bajado'), 'El barrido caza un ejemplo malo…');
  ok(!/grasa corporal/i.test(FALTA_OTRA_FOTO), '…y no salta con un texto que está bien');
  ok(NO_EN_FIT26.some((x) => /análisis del cuerpo/i.test(x.que)), 'Está declarado con su motivo');
}

seccion('La auditoría, y una que SÍ se puede poner roja');
{
  const a = auditarFotos(VIEJAS);
  ok(a.ok === true, `La auditoría está en verde (${a.casillas.length} casillas)`);
  ok(auditarFotos([]).ok === true, 'Y sin fotos también: «sin fotos» es un estado válido');
  /* 🚨 EH F42 — una auditoría que no puede fallar no sirve. */
  const falso = casillasDeFotos({
    orden: [
      { id: 'x', path: '', visibility: 'public', url: 'https://caduca' },
      { id: 'y', path: 'u/y.jpg', visibility: 'private' },
      { id: 'z', path: 'u/z.jpg', visibility: 'private' },
    ],
    /* 🐛 Y con DOS fotos agrupadas frente a TRES en la lista: el escenario
       anterior sumaba 2 y 2, así que esa casilla no podía ponerse roja jamás
       — una comprobación que parece vigilar algo y no puede fallar es peor que
       no tenerla (EH F42, y es el fallo de la E3 F43 otra vez). */
    dias: [{ fecha: '2026-01-01', cuantas: 1 }, { fecha: '2026-09-01', cuantas: 1 }],
    comparacion: null,
  });
  ok(falso.some((c) => c.id === 'sin_copias' && !c.ok), 'Una foto sin archivo pone su casilla roja');
  ok(falso.some((c) => c.id === 'privadas' && !c.ok), 'Una pública, la suya');
  ok(falso.some((c) => c.id === 'sin_url' && !c.ok), 'Una con URL guardada, la suya');
  ok(falso.some((c) => c.id === 'orden' && !c.ok), 'Los días al revés, la suya');
  ok(falso.some((c) => c.id === 'agrupadas' && !c.ok), 'Y una agrupación que pierde fotos, la suya');
  ok(falso.some((c) => c.id === 'comparar_sin_bloquear' && !c.ok), 'Y si la comparación desapareciera, la suya');
}

seccion('Lo que no se construye, dicho');
{
  ok(NO_EN_FIT26.length >= 6 && NO_EN_FIT26.every((x) => x.que && x.porque), 'Todo lo excluido lleva su motivo');
  ok(DECISIONES_FIT26.length >= 5 && DECISIONES_FIT26.every((x) => x.que && x.porque), 'Y cada decisión, el suyo');
  ok(MINIMO_PARA_COMPARAR === 2 && FALTA_OTRA_FOTO === 'Necesitas otra foto para comparar.',
    'El apartado 25, con sus palabras');
  /* 🚨 Y **no se desactiva la sección entera** (apartado 25). */
  const una = pantallaDeFotos(UNA);
  ok(una.comparacion.disponible === false && una.comparacion.aviso === FALTA_OTRA_FOTO,
    '🚨 Con una sola foto la comparación lo DICE, en vez de desaparecer');
  ok(puedeComparar(VIEJAS) && !puedeComparar(UNA), 'Con dos o más sí se puede');
  ok(!!estadoFotos('vacio') && !!estadoFotos('varias') && !estadoFotos('loquesea'), 'Los estados se consultan por id');
  ok(etiquetaDeDia('2026-09-12') === '12 SEP 2026' && etiquetaDeDia('roto') === 'roto', 'El rótulo aguanta una fecha rota');
  ok(fotoPorId(VIEJAS, 'v2') !== null && fotoPorId(VIEJAS, 'nada') === null, 'Y una foto se busca por su id');
  const v = vecinasDeFoto(VIEJAS, fotosEnOrden(VIEJAS)[0].id);
  ok(v.anterior === null && v.siguiente !== null, '⚠️ En el primer extremo no se da la vuelta: `anterior` es null');
  ok(vecinasDeFoto(VIEJAS, 'nada').total === 3, 'Y con un id que no existe no revienta');
}

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}FIT F26 — ${total - fallos}/${total} comprobaciones\x1b[0m`);
if (fallos > 0) process.exit(1);
