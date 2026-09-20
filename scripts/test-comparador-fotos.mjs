/* ===========================================================================
   FIT F27/45 — COMPARADOR AVANZADO DE PROGRESO FÍSICO

   Las veinte pruebas del apartado 32, los ocho pasos del criterio de
   finalización, y lo que esta fase tiene que demostrar que NO hace: escribir
   una segunda comparación, afirmar algo del cuerpo, inventarse un encuadre que
   nadie etiquetó, guardar la comparación, o dejar que un gesto se coma el
   divisor.
   =========================================================================== */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  YA_LO_HIZO_LA_F26, RUTA_COMPARADOR, ENTRADAS_COMPARADOR, CERRAR_COMPARADOR,
  PASOS_SELECCION, pasoSeleccion, CAMBIAR_FOTO, opcionesDelLado, seleccionDesdeFoto, pasoPendiente,
  ROTULO_ANTES, ROTULO_DESPUES, ARIA_ANTES, ARIA_DESPUES, INVERTIR, ladosDeComparacion,
  IDS_ORIENTACION, TAGS_ORIENTACION, orientacionDeFoto, metaDeLado,
  mismoEncuadre, ENCUADRES_DISTINTOS, encuadreDeComparacion,
  MODOS_COMPARACION, MODO_POR_DEFECTO, modoComparacion,
  ANCHO_MINIMO_MITAD, ANCHO_MINIMO_LADO_A_LADO, disposicionDeAncho,
  SLIDER_MIN, SLIDER_MAX, SLIDER_INICIAL, SLIDER_PASO, ARIA_SLIDER,
  posicionSlider, moverSlider, SLIDER_LLEGA_AL_BORDE,
  ZOOM_NORMAL, ZOOM_MAX, ZOOM_PASO, VOLVER_A_ESCALA, crearZoom, crearZoomDeLados,
  limiteDesplazamiento, aplicarZoom, moverZoom, reiniciarZoom, hayZoom,
  puedeAcercar, puedeAlejar, textoDeZoom,
  AJUSTE_IMAGEN, ALINEACIONES, ALINEACION_POR_DEFECTO, alineacion,
  GESTOS, gestosActivos, TOUCH_ACTION_LADO, TOUCH_ACTION_DIVISOR,
  VACIO_COMPARADOR, FOTO_DESAPARECIDA, ELEGIR_OTRA, ERROR_DE_ESTE_LADO,
  ESTADOS_COMPARADOR, estadoComparador,
  pantallaComparador, NO_EN_FIT27, DECISIONES_FIT27,
  casillasDelComparador, auditarComparador,
} from '../src/lib/comparadorFotos.js';

import {
  crearFotoProgreso, normalizarFotosProgreso, fotosEnOrden, etiquetaDeDia,
  compararFotos, MINIMO_PARA_COMPARAR, TAGS_FOTO,
} from '../src/lib/fotosProgreso.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
/* ⚠️ Comentarios Y cadenas: este archivo explica lo que no hace, y la propia
   explicación haría saltar los barridos (la lección de siempre, enésima vez). */
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

const LIB = leer('src/lib/comparadorFotos.js');
const COMP = leer('src/components/comparadorFotos.jsx');
const F26 = leer('src/components/fotosProgreso.jsx');

/* ── Escenarios ──────────────────────────────────────────────────────────── */
const foto = (id, fecha, extra = {}) => ({
  ...crearFotoProgreso({ path: `usuario/${id}.jpg`, fecha, ...extra }),
  id,
});

/** Dos fotos, tres meses de diferencia: el ejemplo del apartado 5. */
const DOS = [foto('a', '2026-06-12'), foto('b', '2026-09-12')];
const MUCHAS = Array.from({ length: 24 }, (_, i) => foto(
  `m${i}`,
  `2026-${String(1 + (i % 9)).padStart(2, '0')}-${String(1 + (i % 27)).padStart(2, '0')}`,
));
const CON_TAGS = [
  foto('t1', '2026-06-12', { tags: ['frontal'], nota: 'Empiezo' }),
  foto('t2', '2026-09-12', { tags: ['frontal'] }),
  foto('t3', '2026-09-20', { tags: ['espalda'] }),
  foto('t4', '2026-07-01', { tags: ['pose'] }),
  foto('t5', '2026-08-01', {}),
];

seccion('1-2 · Dos fotos y muchas fotos');
{
  const p = pantallaComparador(DOS, { antesId: 'a', despuesId: 'b' });
  ok(p.estado === 'comparando' && p.hay === true, 'Con dos fotos elegidas, se compara');
  ok(p.lados.length === 2, 'Y hay exactamente dos lados');
  ok(p.comparacion.antes.id === 'a' && p.comparacion.despues.id === 'b',
    'El ANTES es la más antigua (apartado 4), y lo decide `compararFotos` de la F26');

  const m = pantallaComparador(MUCHAS, { antesId: 'm0', despuesId: 'm5' });
  ok(m.hay === true, 'Con veinticuatro fotos también');
  ok(m.opcionesAntes.length === 23 && m.opcionesDespues.length === 23,
    'Y cada lista ofrece todas menos la que está puesta en el otro lado');
  ok(m.opcionesAntes.every((o) => o.id !== 'm5'), 'La del otro lado no aparece en la lista');
}

seccion('3 · La misma foto en los dos lados');
{
  /* 🚨 Apartado 3 — *"No permitir seleccionar la misma fotografía para ambos
     lados"*. Lo que se comprueba es que **no se puede llegar a pedirlo**. */
  const p = pantallaComparador(DOS, { antesId: 'a', despuesId: 'a' });
  ok(p.hay === false, 'Elegir la misma en los dos lados no compara nada');
  ok(p.comparacion && p.comparacion.motivo === 'misma',
    'Y la guarda de la F26 sigue diciendo por qué');
  ok(!p.opcionesDespues.some((o) => o.id === 'a'),
    'Pero antes de eso, la lista del otro lado ya no la ofrece');
  ok(opcionesDelLado(DOS, { excluir: 'a' }).length === 1, '`opcionesDelLado` excluye la puesta');
  ok(opcionesDelLado(DOS, {}).length === 2, 'Y sin nada puesto las ofrece todas');
}

seccion('4 · Cambiar el orden de antes y después');
{
  const c = compararFotos(DOS, 'a', 'b');
  const normal = ladosDeComparacion(c, { invertida: false });
  const dado = ladosDeComparacion(c, { invertida: true });
  ok(normal[0].foto.id === 'a' && normal[1].foto.id === 'b', 'Sin invertir, la antigua a la izquierda');
  ok(dado[0].foto.id === 'b' && dado[1].foto.id === 'a', 'Invertida, la reciente a la izquierda');
  /* 🚨 La lección de la fase: el rótulo viaja con la foto, no con el hueco. */
  ok(dado[0].rotulo === ROTULO_DESPUES && dado[0].aria === ARIA_DESPUES,
    'Y la reciente SIGUE llamándose «Después» aunque esté a la izquierda (apartado 21)');
  ok(dado[1].rotulo === ROTULO_ANTES && dado[1].aria === ARIA_ANTES,
    'Y la antigua sigue siendo «Antes»: invertir cambia la posición, nunca el tiempo');
  ok(dado[0].posicion === 'izquierda' && dado[1].posicion === 'derecha',
    'La posición se dice aparte, para quien la necesite');
  const p = pantallaComparador(DOS, { antesId: 'a', despuesId: 'b', invertida: true });
  ok(p.invertida === true && p.lados[0].foto.id === 'b', 'Y la pantalla lo respeta');
  ok(p.comparacion.antes.id === 'a', 'Sin tocar quién es el antes de verdad');
  ok(/Intercambiar/.test(INVERTIR), 'El botón dice lo que hace');
}

seccion('5-6 · Lado a lado y deslizar');
{
  ok(MODOS_COMPARACION.length === 2, 'Dos modos, ni uno más (apartado 9)');
  ok(MODO_POR_DEFECTO === 'lado', 'Se entra en lado a lado');
  ok(modoComparacion('deslizar').id === 'deslizar', 'Y se puede cambiar al otro');
  ok(modoComparacion('inventado').id === MODO_POR_DEFECTO, 'Un modo raro cae al de siempre');
  ok(modoComparacion('deslizar').seApila === false,
    'El modo deslizar no se apila: es una sola caja con un divisor');

  /* Apartado 8 — el divisor llega a los dos extremos, o no sirve. */
  ok(posicionSlider(SLIDER_INICIAL) === 50, 'El divisor empieza en el centro');
  ok(moverSlider(50, -60) === SLIDER_MIN && moverSlider(50, 60) === SLIDER_MAX,
    'Y llega a los dos bordes (apartado 8: es una herramienta, no un efecto)');
  ok(SLIDER_LLEGA_AL_BORDE === true, 'Declarado, para que nadie lo acote luego');
  ok(moverSlider(50, SLIDER_PASO) === 52, 'Con el teclado se mueve de dos en dos');
  ok(posicionSlider('mucho') === SLIDER_INICIAL, 'Un valor que no es número vuelve al centro');
  ok(posicionSlider(48.6) === 49, 'Y siempre es un entero: medio píxel no se puede pintar');
  ok(/Divisor/.test(ARIA_SLIDER), 'El divisor tiene nombre para el lector de pantalla');
}

seccion('7-8 · Móvil y escritorio');
{
  /* 🚨 Apartado 7 — el corte está CALCULADO, no escrito a ojo. */
  ok(ANCHO_MINIMO_LADO_A_LADO === ANCHO_MINIMO_MITAD * 2 + 16 * 2 + 12,
    'El ancho mínimo sale de las dos mitades, los márgenes y la separación');
  ok(disposicionDeAncho(320, 'lado').disposicion === 'columna',
    'En un iPhone SE (320 px) el lado a lado se apila (apartado 7)');
  ok(disposicionDeAncho(375, 'lado').disposicion === 'fila',
    'En un iPhone normal (375 px) caben los dos');
  ok(disposicionDeAncho(1200, 'lado').disposicion === 'fila', 'Y en escritorio, desde luego');
  ok(disposicionDeAncho(320, 'deslizar').disposicion === 'superpuesta',
    'El modo deslizar nunca se apila, porque es una sola imagen sobre otra');
  ok(disposicionDeAncho(320, 'lado').cabenLosDos === false
    && disposicionDeAncho(375, 'lado').cabenLosDos === true,
    'Y se puede volver al lado a lado en cuanto hay sitio (apartado 7)');
}

seccion('9 · Proporciones distintas');
{
  ok(AJUSTE_IMAGEN === 'contain', 'Apartado 11 — `object-fit: contain`, literal');
  ok(/object-contain/.test(COMP), 'Y está en el componente');
  ok(!/object-cover/.test(COMP.split('ComparisonImage')[1] || ''),
    'La imagen de la comparación NUNCA recorta: recortar es deformar lo que se mira');
  ok(ALINEACIONES.length === 2 && ALINEACIONES.map((a) => a.id).join() === 'centro,arriba',
    'Apartado 12 — arriba y centro, y nada más');
  ok(ALINEACION_POR_DEFECTO === 'centro' && alineacion('loquesea').id === 'centro',
    'Por defecto, centro');
  ok(alineacion('arriba').css === 'top', 'Y cada una sabe su valor de CSS');
}

seccion('10-13 · Orientaciones, mismo tag, tags distintos y sin tags');
{
  /* 🚨 Las orientaciones son TRES; `TAGS_FOTO` tiene cinco. */
  ok(TAGS_ORIENTACION.length === 3, 'Tres orientaciones: frontal, lateral y espalda');
  ok(TAGS_ORIENTACION.every((t) => TAGS_FOTO.includes(t)),
    'Y salen del catálogo de la F26, no de una segunda lista');
  ok(!IDS_ORIENTACION.includes('pose') && !IDS_ORIENTACION.includes('relajado'),
    '«Pose» y «relajado» no dicen desde dónde está hecha la foto');

  ok(orientacionDeFoto(CON_TAGS[0]).id === 'frontal', 'Una foto frontal se reconoce');
  ok(orientacionDeFoto(CON_TAGS[3]) === null,
    'Una etiquetada solo como «pose» no tiene orientación…');
  ok(orientacionDeFoto(CON_TAGS[4]) === null, '…y una sin etiquetas, tampoco');

  const iguales = encuadreDeComparacion(compararFotos(CON_TAGS, 't1', 't2'));
  ok(iguales.mismo === true && iguales.texto === mismoEncuadre('Frontal'),
    'Mismo tag → «Frontal · Antes / Después» (apartado 14, con su formato)');
  ok(iguales.aviso === null, 'Y sin aviso: no hay nada que matizar');

  const distintos = encuadreDeComparacion(compararFotos(CON_TAGS, 't2', 't3'));
  ok(distintos.mismo === false && distintos.aviso === ENCUADRES_DISTINTOS,
    'Tags distintos → se comparan igual, pero se dice que los encuadres difieren');
  ok(distintos.texto === 'Frontal / Espalda', 'Y se dice cuáles son');

  /* 🚨 Apartado 13 — *"Si no existe: no inventarlo"*, y tampoco en negativo. */
  const sinTag = encuadreDeComparacion(compararFotos(CON_TAGS, 't1', 't5'));
  ok(sinTag.conocido === false && sinTag.texto === null && sinTag.aviso === null,
    'Con una sin etiquetar no se afirma NI que coinciden NI que no (apartado 13)');
  ok(encuadreDeComparacion(null) === null, 'Y sin comparación no hay encuadre');
}

seccion('14-15 · Fechas iguales y fechas distintas');
{
  const mismoDia = [foto('x', '2026-09-12'), foto('y', '2026-09-12')];
  const p = pantallaComparador(mismoDia, { antesId: 'x', despuesId: 'y' });
  ok(p.hay === true, 'Dos fotos del mismo día se comparan');
  ok(p.comparacion.dias === 0 && /mismo día/i.test(p.comparacion.texto),
    'Y se dice que es el mismo día, no «0 días de diferencia»');

  const tres = pantallaComparador(DOS, { antesId: 'a', despuesId: 'b' });
  ok(tres.comparacion.dias === 92, 'Del 12 de junio al 12 de septiembre hay 92 días');
  ok(/3 meses/.test(tres.comparacion.texto), 'Que se dicen como «3 meses» (apartado 15)');
  ok(tres.lados[0].meta.etiqueta === etiquetaDeDia('2026-06-12'),
    'Y cada lado enseña su fecha con el formato de la F26');
}

seccion('16 · La nota');
{
  const p = pantallaComparador(CON_TAGS, { antesId: 't1', despuesId: 't2' });
  ok(p.lados[0].meta.nota === 'Empiezo', 'La nota del lado que la tiene se enseña');
  ok(p.lados[1].meta.nota === null, 'Y el que no la tiene no enseña un hueco');
  ok(p.lados[0].meta.orientacion === 'Frontal', 'Apartado 5 — la orientación, si existe');
  ok(metaDeLado({ foto: null }) === null, 'Sin foto no hay meta que pintar');
  const otros = metaDeLado({ foto: CON_TAGS[3], rotulo: ROTULO_ANTES, aria: ARIA_ANTES });
  ok(otros.orientacion === null && otros.otrosTags.join() === 'Pose',
    'Un tag que no es orientación se enseña aparte, sin fingir que lo es');
}

seccion('17 · Una foto eliminada');
{
  /* 🚨 Apartado 24 — *"cerrar la comparación de forma segura… No romper el
     módulo"*. Se simula lo que pasa de verdad: se borra y la pantalla se
     vuelve a pedir con los mismos ids. */
  const quedan = DOS.concat([foto('c', '2026-07-01')]).filter((f) => f.id !== 'b');
  const p = pantallaComparador(quedan, { antesId: 'a', despuesId: 'b' });
  ok(p.estado === 'desaparecida', 'Si una de las elegidas ya no está, el estado lo dice');
  ok(p.aviso === FOTO_DESAPARECIDA && /ya no está disponible/.test(p.aviso),
    'Con el texto del apartado 24, literal');
  ok(p.hay === false && p.lados.length === 0, 'Y no se pinta media comparación');
  ok(p.opcionesDespues.length === 1 && p.opcionesDespues[0].id === 'c',
    'Pero se puede elegir otra sin salir (apartado 17)');
  ok(/Elegir otra/.test(ELEGIR_OTRA), 'Y hay una salida con nombre');
}

seccion('18 · Una foto que no carga');
{
  /* Apartado 25 — el placeholder es **solo de esa**: la otra sigue. */
  const p = pantallaComparador(DOS, { antesId: 'a', despuesId: 'b', fallidas: { a: true } });
  ok(p.hay === true, 'Una foto rota NO cierra el comparador');
  ok(p.lados[0].fallida === true && p.lados[1].fallida === false,
    'El fallo es de ese lado, no de los dos');
  ok(/no se puede mostrar/i.test(ERROR_DE_ESTE_LADO),
    'Con el texto de la F26, que ya dice qué ha pasado');
  const rotas = pantallaComparador(DOS, { antesId: 'a', despuesId: 'b', fallidas: { a: true, b: true } });
  ok(rotas.hay === true && rotas.lados.every((l) => l.fallida),
    'Y con las DOS rotas la pantalla se sostiene igual: se mide el peor caso');
}

seccion('19 · Zoom');
{
  const z = crearZoom();
  ok(z.escala === ZOOM_NORMAL && z.x === 0 && z.y === 0, 'El zoom empieza a escala normal');
  ok(aplicarZoom(z, ZOOM_PASO).escala === 1.5, 'Acercar sube medio paso');
  ok(aplicarZoom({ escala: ZOOM_MAX, x: 0, y: 0 }, ZOOM_PASO).escala === ZOOM_MAX,
    'Y no pasa del máximo');
  ok(aplicarZoom(z, -ZOOM_PASO).escala === ZOOM_NORMAL, 'Ni baja de la escala normal');
  ok(puedeAcercar(z) === true && puedeAlejar(z) === false, 'A escala normal solo se puede acercar');
  ok(hayZoom(z) === false && hayZoom({ escala: 2 }) === true, '`hayZoom` distingue las dos cosas');
  ok(reiniciarZoom().escala === ZOOM_NORMAL, 'Y se vuelve de un toque (apartado 10)');
  ok(/[Ee]scala normal/.test(VOLVER_A_ESCALA), 'Con un botón que dice lo que hace');
  ok(textoDeZoom(z) === null && textoDeZoom({ escala: 2 }) === '2,0×',
    'A escala normal no se enseña un «1,0×» que no dice nada');

  /* 🚨 El límite de desplazamiento, calculado y comprobable sin navegador. */
  ok(limiteDesplazamiento(1) === 0, 'Sin zoom no hay nada que desplazar');
  ok(limiteDesplazamiento(2) === 50, 'Al doble, la imagen sobresale la mitad por cada borde');
  ok(limiteDesplazamiento(3) === 100, 'Y al triple, una anchura entera');
  const movido = moverZoom({ escala: 2, x: 0, y: 0 }, 80, -80);
  ok(movido.x === 50 && movido.y === -50, 'Arrastrar se recorta al límite: nunca queda un hueco');
  const recortado = aplicarZoom({ escala: 3, x: 90, y: 0 }, -ZOOM_MAX);
  ok(recortado.escala === ZOOM_NORMAL && recortado.x === 0,
    'Y al volver a escala normal el desplazamiento se recorta solo');

  /* 🚨 Apartado 10 — *"mantener ambas imágenes independientes"*. */
  const lados = crearZoomDeLados();
  const soloUno = { ...lados, antes: aplicarZoom(lados.antes, ZOOM_PASO) };
  ok(hayZoom(soloUno.antes) && !hayZoom(soloUno.despues),
    'Ampliar un lado NO amplía el otro: cada foto tiene su zoom');
}

seccion('20 · Cambiar las fotografías sin salir');
{
  ok(/Cambiar/.test(CAMBIAR_FOTO), 'Apartado 17 — el botón se llama «Cambiar»');
  const p = pantallaComparador(MUCHAS, { antesId: 'm0', despuesId: 'm5' });
  ok(p.opcionesAntes.length > 0 && p.opcionesDespues.length > 0,
    'Y desde la comparación se siguen ofreciendo las dos listas');
  ok(p.paso === null, 'Con las dos puestas no hay paso pendiente');
  const medio = pantallaComparador(MUCHAS, { antesId: 'm0' });
  ok(medio.estado === 'eligiendo' && medio.paso.id === 'despues',
    'Con una sola puesta, lo que falta es la final');
  ok(/foto final/.test(medio.paso.titulo), 'Con la frase del apartado 3');
  const nada = pantallaComparador(MUCHAS, {});
  ok(nada.paso.id === 'antes' && /foto inicial/.test(nada.paso.titulo),
    'Y sin nada puesto, la inicial');
  ok(PASOS_SELECCION.length === 2 && pasoSeleccion('antes').corto === 'Inicial',
    'Dos pasos, con su nombre corto para los rótulos');
  ok(pasoPendiente({ antesId: 'x', despuesId: 'y' }) === null, '`pasoPendiente` sabe cuándo no falta nada');
}

seccion('Apartado 2 · Las dos entradas');
{
  ok(ENTRADAS_COMPARADOR.length === 2, 'Se entra desde la galería y desde el detalle de una foto');
  ok(RUTA_COMPARADOR.join(' → ') === 'Progreso → Fotos → Comparar', 'Y la ruta es la del apartado 1');

  /* Desde el detalle, la foto abierta se queda puesta en el lado que le toca
     POR SU FECHA — no en el que se pulsó. */
  const orden = fotosEnOrden(normalizarFotosProgreso(MUCHAS));
  const masNueva = orden[orden.length - 1];
  const desdeNueva = seleccionDesdeFoto(MUCHAS, masNueva.id);
  ok(desdeNueva.despuesId === masNueva.id && desdeNueva.paso === 'antes',
    'Abriendo la más reciente, lo que falta es la inicial');
  const desdeVieja = seleccionDesdeFoto(MUCHAS, orden[0].id);
  ok(desdeVieja.antesId === orden[0].id && desdeVieja.paso === 'despues',
    'Abriendo una anterior, lo que falta es la final');
  ok(seleccionDesdeFoto(MUCHAS, 'no-existe').origen === 'galeria',
    'Y con un id que no existe se entra como desde la galería, sin romperse');
}

seccion('Apartado 23 · Menos de dos fotos');
{
  const vacio = pantallaComparador([], {});
  ok(vacio.estado === 'sin_fotos' && vacio.hay === false, 'Sin fotos no hay comparador');
  ok(vacio.vacio.titulo === VACIO_COMPARADOR.titulo
    && /al menos dos fotos/.test(vacio.vacio.titulo),
    'Con el texto del apartado 23, literal');
  ok(vacio.vacio.cta === 'Añadir foto', 'Y su CTA, que es una salida de verdad');
  ok(vacio.faltan === 2, 'Y se sabe cuántas faltan');

  const una = pantallaComparador([DOS[0]], {});
  ok(una.estado === 'sin_fotos' && una.faltan === 1, 'Con una foto falta una');
  ok(MINIMO_PARA_COMPARAR === 2, 'El mínimo es el de la F26, no un 2 escrito otra vez');
  ok(ESTADOS_COMPARADOR.length === 4 && estadoComparador('comparando').hayComparacion === true,
    'Los cuatro estados están declarados, con cuál de ellos compara');
}

seccion('Apartado 22 · Los gestos no se pisan entre ellos');
{
  const enLado = gestosActivos('lado', { zoom: false }).map((g) => g.id);
  ok(enLado.includes('swipe'), 'En lado a lado se puede deslizar para cambiar de foto');
  ok(!enLado.includes('arrastrar-divisor'), 'Y ahí no hay divisor que arrastrar');

  const enDeslizar = gestosActivos('deslizar', { zoom: false }).map((g) => g.id);
  /* 🚨 La decisión de la fase: el swipe NO existe en el modo deslizar. */
  ok(!enDeslizar.includes('swipe'),
    'En el modo deslizar NO hay swipe: ahí el arrastre horizontal es el divisor');
  ok(enDeslizar.includes('arrastrar-divisor'), 'Lo que hay es el divisor');

  const conZoom = gestosActivos('lado', { zoom: true }).map((g) => g.id);
  ok(!conZoom.includes('swipe'), 'Con el zoom puesto, arrastrar desplaza la imagen…');
  ok(conZoom.includes('arrastrar-zoom'), '…y ése es el gesto que manda');
  ok(!gestosActivos('lado', { zoom: false }).some((g) => g.id === 'arrastrar-zoom'),
    'Sin zoom no se anuncia un gesto que no haría nada');
  ok(TOUCH_ACTION_LADO === 'pan-y', 'El scroll vertical se respeta (apartado 22)');
  ok(TOUCH_ACTION_DIVISOR === 'none', 'Y el divisor se queda el arrastre entero');
  ok(GESTOS.every((g) => g.porque && g.porque.length > 10), 'Cada gesto dice por qué está donde está');
}

seccion('Apartado 21 · Accesibilidad');
{
  ok(ARIA_ANTES === 'Foto anterior' && ARIA_DESPUES === 'Foto posterior',
    'Cada lado se llama por lo que es, no por dónde está');
  const etiquetas = (COMP.match(/aria-label=(?:"[^"]*"|\{`[^`]*`\}|\{[^}]*\})/g) || []);
  ok(etiquetas.length >= 6, `Los controles tienen nombre (${etiquetas.length} aria-label)`);
  ok(/role="slider"/.test(COMP), 'El divisor se anuncia como un deslizador');
  ok(/aria-valuenow/.test(COMP) && /aria-valuemin/.test(COMP) && /aria-valuemax/.test(COMP),
    'Con su valor, su mínimo y su máximo');
  ok(/onKeyDown/.test(COMP), 'Y se mueve con el teclado (apartado 21)');
  ok(/toque-44/.test(COMP), 'Los controles tienen zona de toque de 44 px');
}

seccion('Apartados 18, 28, 29 y 31 · Lo que NO se guarda ni se envía');
{
  const codigo = soloCodigo(LIB);
  ok(!/saveData|loadData|localStorage|sessionStorage/.test(codigo),
    'La librería no guarda NADA: la comparación es una vista derivada (apartados 18 y 29)');
  ok(!/supabase|fetch\(|ask-ai/i.test(codigo),
    'Y no manda nada a ninguna parte: las fotos son privadas (apartado 31)');
  ok(!/normalizar[A-Z]\w*Comparacion|crearComparacion/.test(codigo),
    'No hay entidad «comparación» que normalizar: no existe');

  /* 🚨 Apartado 28 — *"No modificar ProgressPhoto directamente"*. */
  const antes = JSON.stringify(normalizarFotosProgreso(CON_TAGS));
  pantallaComparador(CON_TAGS, { antesId: 't1', despuesId: 't2', invertida: true });
  aplicarZoom(crearZoom(), ZOOM_PASO);
  ok(JSON.stringify(normalizarFotosProgreso(CON_TAGS)) === antes,
    'Comparar, invertir y ampliar no tocan ni un campo de ninguna foto');

  const p = pantallaComparador(CON_TAGS, { antesId: 't1', despuesId: 't2' });
  const origen = normalizarFotosProgreso(CON_TAGS).find((f) => f.id === 't1');
  ok(JSON.stringify(p.lados.find((l) => l.foto.id === 't1').foto) === JSON.stringify(origen),
    'Y la foto que llega al lado es la misma, sin campos añadidos por el camino');
}

seccion('Apartado 34 · Ni una palabra sobre el cuerpo');
{
  /* 🚨 El barrido va sobre TODO lo que esta fase puede poner en pantalla. */
  const textos = [
    VACIO_COMPARADOR.titulo, VACIO_COMPARADOR.cta, FOTO_DESAPARECIDA, ELEGIR_OTRA,
    CAMBIAR_FOTO, CERRAR_COMPARADOR, INVERTIR, VOLVER_A_ESCALA, ARIA_SLIDER,
    ARIA_ANTES, ARIA_DESPUES, ROTULO_ANTES, ROTULO_DESPUES, ENCUADRES_DISTINTOS,
    mismoEncuadre('Frontal'),
    ...PASOS_SELECCION.flatMap((p) => [p.titulo, p.corto]),
    ...MODOS_COMPARACION.flatMap((m) => [m.nombre, m.descripcion]),
    ...ALINEACIONES.map((a) => a.nombre),
    ...ENTRADAS_COMPARADOR.map((e) => e.etiqueta),
    ...['t1', 't3'].map((id) => {
      const e = encuadreDeComparacion(compararFotos(CON_TAGS, 't1', id === 't1' ? 't2' : id));
      return [e.texto, e.aviso].filter(Boolean).join(' ');
    }),
    pantallaComparador(DOS, { antesId: 'a', despuesId: 'b' }).comparacion.texto,
    textoDeZoom({ escala: 2 }),
  ].filter(Boolean).join(' · ').toLowerCase();

  /* 🚨 **CON LÍMITE DE PALABRA, Y ESTO YA COSTÓ UNA VEZ** (FIT F1: «experto»
     contiene «xp»). Buscar `'ia '` como subcadena pone roja la fase entera con
     el código bien, porque *"3 meses de **diferencia** "* la contiene. Se busca
     la palabra, no los caracteres. */
  const PROHIBIDAS = [
    'grasa', 'grasas', 'músculo', 'musculo', 'muscular', 'composición', 'corporal',
    'ia', 'inteligencia', 'analiza', 'análisis', 'ranking', 'kilos', 'peso',
    'adelgazar', 'engordar', 'definición', 'ganado', 'perdido', 'mejorado',
  ];
  const dice = (palabra) => new RegExp(`(^|[^\\p{L}])${palabra}([^\\p{L}]|$)`, 'iu').test(textos);
  PROHIBIDAS.forEach((p) => ok(!dice(p), `Ningún texto dice «${p}»`));
  ok(!/mejor que|peor que|estás mejor|estás peor/i.test(textos),
    'Ni una comparación de valor: esto enseña dos fotos, no una nota');
  ok(/\d|día|mes|año|antes|después|foto/i.test(textos),
    'Y lo que sí se dice son fechas, tiempo y fotos');
  /* ⚠️ Y el barrido tiene que poder ponerse rojo (EH F42), o no vigila nada. */
  ok(dice('deslizar') === true,
    'El barrido encuentra una palabra que SÍ está: no está mirando una cadena vacía');
  ok(dice('diferencia') === true && !PROHIBIDAS.includes('diferencia'),
    'Y «diferencia» sigue en los textos: lo que se arregló fue la forma de buscar, no el texto');
}

seccion('Lo que ya estaba escrito y no se reescribe');
{
  ok(YA_LO_HIZO_LA_F26.length === 5, 'Cinco piezas del enunciado ya existían');
  ok(YA_LO_HIZO_LA_F26.every((y) => y.es), 'Y cada una guarda la función importada, no su nombre');
  ok(YA_LO_HIZO_LA_F26.find((y) => y.nombre === 'compararFotos').es === compararFotos,
    'La comparación es la de la F26, importada');

  const codigo = soloCodigo(LIB);
  /* 🚨 Una segunda `compararFotos` decidiría el ANTES de otra manera. */
  ok(!/function\s+compararFotos|function\s+opcionesParaComparar|function\s+etiquetaDeDia/.test(codigo),
    'No se redefine ninguna función de la F26');
  ok(!/function\s+diasEntre|function\s+textoDeDistancia/.test(codigo),
    'Ni el cálculo de días ni el texto de la distancia');
  ok(/from '\.\/fotosProgreso\.js'/.test(LIB), 'Se importan de donde están');
  ok(!/3\s*\*\s*30|\/\s*30\b/.test(codigo),
    'Y no hay una segunda aritmética de meses escondida aquí');
}

seccion('Apartado 27 · Los componentes');
{
  const PEDIDOS = [
    'ProgressComparison', 'ComparisonSelector', 'ComparisonViewport',
    'ComparisonSideBySide', 'ComparisonSlider', 'ComparisonImage',
    'ComparisonMeta', 'ComparisonControls', 'ComparisonEmpty',
  ];
  /* ⚠️ La prueba ABRE el archivo: una tabla que solo se cuenta a sí misma no
     demuestra nada (EH F42). */
  PEDIDOS.forEach((c) => ok(
    new RegExp(`export function ${c}\\b`).test(COMP),
    `${c} existe de verdad en el componente`,
  ));
  ok(!/function ProgressPhotoViewer/.test(COMP),
    'Y NO se duplica `ProgressPhotoViewer` (apartado 27): vive en la F26');
  /* 🚨 **NI UN CICLO ENTRE LOS DOS ARCHIVOS** (la lección de la FIT F24). La
     galería importa el comparador para abrirlo; el comparador **no importa
     nada de la galería**, porque la tira de fechas se ha mudado aquí con su
     único usuario (E3 F17: *se muda, no se duplica*). */
  ok(/export function ProgressPhotoDateSelector/.test(COMP),
    'La tira de fechas se MUDA aquí, donde está su único usuario');
  ok(!/from '\.\/fotosProgreso'/.test(COMP),
    '🚨 Y el comparador NO importa nada del componente de la F26: una sola dirección, sin ciclo');
  ok(!/export function ProgressPhotoDateSelector/.test(F26) && !/ProgressPhotoDateSelector/.test(soloCodigo(F26)),
    'Y no se queda una copia en la F26: se mudó, no se duplicó');
  ok(/createPortal/.test(COMP), 'Y el comparador a pantalla completa va por portal (regla 3)');
}

seccion('Apartado 30 · Sin bloquear la interfaz');
{
  /* 🚨 **EL COMPARADOR NO FIRMA NI UNA URL**, y eso ES el apartado 30: las que
     necesita ya las tiene la galería, firmadas por tandas desde la F26. Un
     segundo `useUrlsFirmadas` aquí pediría otra vez a Supabase **las mismas dos
     fotos que ya están cargadas** — justo la carga innecesaria que el apartado
     prohíbe. Llegan como prop. */
  ok(!/useUrlsFirmadas|getSignedPhotoUrl/.test(COMP),
    'El comparador no vuelve a firmar lo que la galería ya tiene firmado');
  ok(/urls\s*=\s*\{\}/.test(COMP), 'Las recibe como prop');
  ok(/useUrlsFirmadas/.test(F26) && /FOTOS_POR_TANDA/.test(F26),
    'Y quien las firma sigue siendo la F26, por tandas, sin tocarla');
  const miniaturas = NO_EN_FIT27.find((n) => /[Mm]iniaturas/.test(n.que));
  ok(!!miniaturas && /1600/.test(miniaturas.porque),
    'Y se declara por qué NO hay miniaturas: solo existe una versión de cada foto');
}

seccion('Lo que no se construye, y por qué');
{
  /* ⚠️ **Se comprueba QUÉ está declarado, no CUÁNTAS cosas hay**: una cuenta
     exacta es una bomba de relojería que salta el día que la fase siguiente
     añada una con todo el derecho (EH F21, nueve veces). */
  ok(NO_EN_FIT27.every((n) => n.que && n.porque && n.porque.length > 30),
    'Todo lo que no se construye lleva su motivo, y ninguno es una línea suelta');
  ok(NO_EN_FIT27.some((n) => /[Cc]ompartir/.test(n.que)), 'Compartir, por el apartado 19');
  ok(NO_EN_FIT27.some((n) => /[Ee]xportar/.test(n.que)), 'Exportar como imagen, por el apartado 20');
  ok(NO_EN_FIT27.some((n) => /corporal|grasa/i.test(n.que)), 'El análisis del cuerpo, por el 34');
  ok(NO_EN_FIT27.some((n) => /C-32/.test(n.porque)),
    'Y el pellizco para ampliar, que depende de una decisión de Josué (C-32)');

  const ids = DECISIONES_FIT27.map((d) => d.id);
  ok(DECISIONES_FIT27.every((d) => d.dice && d.porque), 'Cada decisión dice qué y por qué');
  ok(ids.includes('reutilizar-f26'), 'La comparación de la F26 se amplía, no se reescribe');
  ok(ids.includes('rotulo-con-la-foto'), 'El rótulo viaja con la foto');
  ok(ids.includes('swipe-solo-lado-a-lado'), 'El swipe no se come el divisor');
  ok(ids.includes('se-retira-la-comparacion-de-dentro'),
    'Y se declara que el bloque de dentro de la galería se retira, con su precedente');
}

seccion('Criterio de finalización · las ocho cosas que tiene que poder hacer');
{
  const a = auditarComparador(MUCHAS, { antesId: 'm0', despuesId: 'm5' });
  ok(a.completo === true, `Las ${a.total} casillas en verde`);
  a.casillas.forEach((c) => ok(c.ok, `  ${c.que}`));

  /* 🚨 Y una auditoría que no puede ponerse roja no sirve (EH F42). */
  const rota = auditarComparador([], {});
  ok(rota.completo === false && rota.ok < rota.total,
    'Sin fotos, la auditoría se pone roja: puede fallar');
  ok(casillasDelComparador([], {}).find((c) => c.id === 'lado_a_lado').ok === false,
    'Y la casilla que no se cumple es la que dice');
}

seccion('Integración · la pestaña de Fotos sigue siendo la de la F26');
{
  ok(/ProgressComparison/.test(F26), 'La galería de la F26 abre el comparador');
  ok(/comparadorFotos/.test(F26), 'Importándolo, no copiándolo');
  const codigo = soloCodigo(F26);
  ok(!/function ComparisonSlider|function ComparisonImage/.test(codigo),
    'Y sin llevarse ni un componente de esta fase dentro');
}

console.log(`\n${fallos === 0 ? '\x1b[32m✓' : '\x1b[31m✗'} ${total - fallos}/${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
