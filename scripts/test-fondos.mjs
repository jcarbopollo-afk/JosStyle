// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 1 — pruebas del sistema central de fondos.
//
// Lo que importa comprobar aquí no es que un degradado se vea bonito (eso solo
// lo puede ver Josué en su iPhone), sino las dos promesas que hace el
// apartado 6: que la cadena de prioridad SIEMPRE devuelve algo pintable, y que
// nunca aparece "un fondo vacío, roto o indefinido".
//
// Y una tercera que es de la regla 5 del proyecto: que una configuración
// guardada por una versión anterior, sin los campos nuevos, se carga sin
// romperse y sin perder lo que el usuario sí tenía.
// ---------------------------------------------------------------------------
import {
  TIPOS_FONDO, tipoDeFondo, FONDOS_INCLUIDOS, fondoIncluido, DEFAULT_FONDO,
  POSICIONES_FONDO, posicionDeFondo, normalizarFondo, resolverFondo, estilosDeFondo,
  estilosDeVelo, seleccionarFondo, ajustarFondo, restablecerFondo, tieneFondoGuardado,
  describirFondo,
  ORIENTACIONES_FOTO, orientacionDeFoto, datosDeFoto, encuadreInicial, validarFotoFondo,
  aplicarFoto, quitarFoto, tieneFoto, MAX_PESO_FONDO,
  AJUSTES_PRESENTACION, ajustesPorDefecto, ajustesDe, restablecerAjustes, tieneAjustes,
  recordarAjustes, aplicarFotoConAjustes, estilosDeLuminosidad, MAX_AJUSTES_RECORDADOS,
} from '../src/lib/fondos.js';

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

console.log('\n═══ FO Fase 1 — sistema central de fondos ═══\n');

// Una paleta mínima, como la que tendría COLORS en tiempo de ejecución.
const COLORES = { bg: '#0B0D12', surface: '#151922', surface2: '#1E2430', accent: '#4C8DFF', secondary: '#8D4CFF', tertiary: '#4CFFB0' };

/* --- Apartado 3: los cinco tipos --- */
{
  comprobar('Los 5 tipos de fondo del apartado 3', TIPOS_FONDO.length === 5, String(TIPOS_FONDO.length));
  comprobar('Están los cinco, por id',
    ['ninguno', 'color', 'degradado', 'foto', 'predeterminado'].every((id) => TIPOS_FONDO.some((t) => t.id === id)));
  comprobar('Todos tienen etiqueta y descripción', TIPOS_FONDO.every((t) => t.label && t.descripcion));
  comprobar('Un tipo desconocido cae en "Sin fondo"', tipoDeFondo('inventado').id === 'ninguno');
  // FO Fase 2 encendió la fotografía. Los cinco tipos están ya implementados.
  comprobar('Los cinco tipos están implementados', TIPOS_FONDO.every((t) => t.implementado === true));
  comprobar('Hay fondos incluidos (apartado 3-E)', FONDOS_INCLUIDOS.length >= 3);
  comprobar('Un incluido desconocido no revienta', fondoIncluido('zzz').id === FONDOS_INCLUIDOS[0].id);
  // Los incluidos se definen con TOKENS, no con hex: siguen el tema y el acento.
  comprobar('Los fondos incluidos se definen con tokens, no con hex sueltos',
    FONDOS_INCLUIDOS.every((f) => !/^#/.test(f.de) && !/^#/.test(f.a)));
  // Desde FO F3 las posiciones fijas son solo la tabla de migración y los atajos
  // del editor: el encuadre real son dos porcentajes libres.
  comprobar('Las 5 posiciones traen sus coordenadas', POSICIONES_FONDO.every((p) => p.id && p.label && Number.isFinite(p.x) && Number.isFinite(p.y)));
  comprobar('Una posición desconocida cae en el centro', posicionDeFondo('zzz').id === 'centro');
}

/* --- Apartado 4: el modelo central --- */
{
  const esperados = ['tipo', 'activo', 'incluido', 'color', 'degradado', 'foto', 'encuadre',
    'escala', 'opacidad', 'desenfoque', 'luminosidad', 'overlay', 'ajustesPorFoto',
    'analisis', 'paleta', 'recomendacion'];
  for (const campo of esperados) comprobar(`El modelo declara "${campo}"`, campo in DEFAULT_FONDO);
  // Apartado 7: la fotografía tiene que poder identificarse por completo.
  for (const campo of ['id', 'path', 'origen', 'formato', 'ancho', 'alto', 'proporcion', 'peso', 'anadidaEn']) {
    comprobar(`La fotografía declara "${campo}"`, campo in DEFAULT_FONDO.foto);
  }
  // Apartados 8 y 9: preparado para colores y recomendaciones, vacío hoy.
  comprobar('Los campos de las fases 4-6 nacen vacíos, no inventados',
    DEFAULT_FONDO.analisis === null && DEFAULT_FONDO.paleta === null && DEFAULT_FONDO.recomendacion === null);
  comprobar('Por defecto no hay fondo activo', DEFAULT_FONDO.tipo === 'ninguno' && DEFAULT_FONDO.activo === false);
}

/* --- Regla 5 del proyecto: lo guardado por una versión antigua --- */
{
  // Esta es LA prueba que evita una migración a mano dentro de tres fases.
  const antiguo = { tipo: 'color', activo: true, color: '#FF0000' };
  const n = normalizarFondo(antiguo);
  comprobar('Una configuración antigua conserva lo que tenía', n.tipo === 'color' && n.color === '#FF0000');
  comprobar('...y recupera los campos que le faltaban', n.overlay.intensidad === 0 && n.escala === 100 && 'foto' in n);
  comprobar('...incluidos los de fases futuras', 'analisis' in n && 'paleta' in n);
  comprobar('Un fondo nulo devuelve el valor por defecto', normalizarFondo(null).tipo === 'ninguno');
  comprobar('Un fondo indefinido también', normalizarFondo(undefined).activo === false);

  // Los números se acotan: un valor absurdo guardado por error no puede dejar
  // la app inutilizable.
  comprobar('Una escala absurda se acota', normalizarFondo({ escala: 4000 }).escala === 300);
  comprobar('Una opacidad negativa se acota a 0', normalizarFondo({ opacidad: -50 }).opacidad === 0);
  comprobar('Un desenfoque enorme se acota', normalizarFondo({ desenfoque: 999 }).desenfoque === 40);
  comprobar('Un overlay por encima de 90 se acota', normalizarFondo({ overlay: { intensidad: 100 } }).overlay.intensidad === 90);
  comprobar('La luminosidad se acota por abajo', normalizarFondo({ luminosidad: -500 }).luminosidad === -90);
  comprobar('...y por arriba, con menos margen para aclarar', normalizarFondo({ luminosidad: 500 }).luminosidad === 60);
  comprobar('Un valor no numérico cae en su valor por defecto', normalizarFondo({ escala: 'mucho' }).escala === 100);
  comprobar('Un tipo inventado cae en "ninguno"', normalizarFondo({ tipo: 'zzz' }).tipo === 'ninguno');
  comprobar('Un color inválido se descarta', normalizarFondo({ color: 'rojo' }).color === '');
  comprobar('Un color válido se normaliza', normalizarFondo({ color: '#abcdef' }).color === '#ABCDEF');
}

/* --- Apartado 6: la cadena de prioridad. NUNCA un fondo roto --- */
{
  comprobar('Sin fondo activo, se usa el de siempre', resolverFondo(DEFAULT_FONDO).tipo === 'ninguno');
  comprobar('Un fondo configurado pero apagado no se pinta',
    resolverFondo({ tipo: 'color', color: '#FF0000', activo: false }).tipo === 'ninguno');
  comprobar('...y dice por qué', resolverFondo({ tipo: 'color', color: '#FF0000', activo: false }).motivo === 'desactivado');

  comprobar('Un color válido se pinta', resolverFondo({ tipo: 'color', color: '#FF0000', activo: true }).tipo === 'color');
  // Un color roto NO deja un hueco: cae al fondo normal.
  const colorRoto = resolverFondo({ tipo: 'color', color: 'no-es-un-color', activo: true });
  comprobar('Un color roto cae al fondo normal', colorRoto.tipo === 'ninguno');
  comprobar('...diciendo el motivo', colorRoto.motivo === 'color_invalido');

  const degRoto = resolverFondo({ tipo: 'degradado', degradado: { de: '#FF0000', a: '' }, activo: true });
  comprobar('Un degradado a medias cae al fondo normal', degRoto.tipo === 'ninguno' && degRoto.motivo === 'degradado_invalido');
  const degOk = resolverFondo({ tipo: 'degradado', degradado: { de: '#ff0000', a: '#00ff00', angulo: 90 }, activo: true });
  comprobar('Un degradado completo se pinta', degOk.tipo === 'degradado');
  comprobar('...con sus colores normalizados', degOk.degradado.de === '#FF0000' && degOk.degradado.a === '#00FF00');

  // ESTE es el escalón intermedio del apartado 6: una foto que ya no está NO
  // deja la pantalla en blanco, baja al fondo incluido.
  const sinFoto = resolverFondo({ tipo: 'foto', activo: true, foto: { path: 'x.jpg' } });
  comprobar('Una foto sin URL baja al fondo incluido, no a un hueco', sinFoto.tipo === 'predeterminado');
  comprobar('...y avisa de por qué', sinFoto.motivo === 'foto_no_disponible');
  const conFoto = resolverFondo({ tipo: 'foto', activo: true, foto: { path: 'x.jpg' } }, { urlFoto: 'https://x/y.jpg' });
  comprobar('Con URL firmada, la foto sí se pinta', conFoto.tipo === 'foto' && conFoto.urlFoto === 'https://x/y.jpg');

  // La promesa gorda del apartado 6, comprobada contra basura de verdad.
  const basura = [null, undefined, {}, { tipo: null }, { tipo: 'foto', activo: true }, { activo: true },
    { tipo: 'degradado', activo: true }, { tipo: 'color', activo: true }, 'texto', 42];
  comprobar('NINGUNA entrada, por rota que sea, devuelve null o un tipo desconocido',
    basura.every((x) => {
      const r = resolverFondo(x);
      return r && TIPOS_FONDO.some((t) => t.id === r.tipo);
    }));
}

/* --- Apartados 11 y 13: los estilos que se pintan --- */
{
  comprobar('Sin fondo no se pinta ninguna capa', estilosDeFondo(resolverFondo(DEFAULT_FONDO), COLORES) === null);
  comprobar('Un resuelto nulo tampoco revienta', estilosDeFondo(null, COLORES) === null);

  const color = estilosDeFondo(resolverFondo({ tipo: 'color', color: '#FF0000', activo: true }), COLORES);
  comprobar('El color sólido se pinta como background', color.background === '#FF0000');
  comprobar('...con la opacidad al 100 % por defecto', color.opacity === 1);
  comprobar('...y sin filtro si no hay desenfoque', color.filter === undefined);

  const conDesenfoque = estilosDeFondo(resolverFondo({ tipo: 'color', color: '#FF0000', activo: true, desenfoque: 10 }), COLORES);
  comprobar('El desenfoque se aplica', conDesenfoque.filter === 'blur(10px)');
  // Sin agrandar la capa, el desenfoque deja un halo transparente en los bordes.
  comprobar('...y la capa se agranda para que el recorte caiga fuera', conDesenfoque.transform === 'scale(1.1)');

  const deg = estilosDeFondo(resolverFondo({ tipo: 'degradado', degradado: { de: '#FF0000', a: '#00FF00', angulo: 90 }, activo: true }), COLORES);
  comprobar('El degradado usa linear-gradient con su ángulo', deg.background === 'linear-gradient(90deg, #FF0000, #00FF00)', deg.background);

  const inc = estilosDeFondo(resolverFondo({ tipo: 'predeterminado', incluido: 'acento_suave', activo: true }), COLORES);
  comprobar('Un fondo incluido sale de los colores del tema', inc.background.includes(COLORES.accent) && inc.background.includes(COLORES.bg));
  comprobar('...mezclándose con el fondo, no tapándolo', inc.background.includes('color-mix'));
  // Sin paleta no puede reventar: los fondos incluidos se piden desde el arranque.
  comprobar('Sin paleta, el fondo incluido no revienta', !!estilosDeFondo(resolverFondo({ tipo: 'predeterminado', activo: true }), null));

  const foto = estilosDeFondo(resolverFondo({ tipo: 'foto', activo: true }, { urlFoto: 'https://x/y.jpg' }), COLORES);
  comprobar('La foto se pinta como backgroundImage', foto.backgroundImage.includes('https://x/y.jpg'));
  comprobar('...a tamaño cover cuando la escala es 100', foto.backgroundSize === 'cover');
  comprobar('...y sin repetirse', foto.backgroundRepeat === 'no-repeat');
  const fotoZoom = estilosDeFondo(resolverFondo({ tipo: 'foto', activo: true, escala: 150, encuadre: { x: 20, y: 80 } }, { urlFoto: 'u' }), COLORES);
  comprobar('Con escala distinta de 100 se usa el porcentaje', fotoZoom.backgroundSize === '150%');
  comprobar('...y el encuadre libre en porcentajes', fotoZoom.backgroundPosition === '20% 80%', fotoZoom.backgroundPosition);
}

/* --- El velo (apartado 4, `overlay`) --- */
{
  comprobar('Sin overlay no se pinta esa capa', estilosDeVelo(resolverFondo({ tipo: 'color', color: '#F00', activo: true }), COLORES) === null);
  comprobar('Sin fondo tampoco', estilosDeVelo(resolverFondo(DEFAULT_FONDO), COLORES) === null);
  const velo = estilosDeVelo(resolverFondo({ tipo: 'color', color: '#F00', activo: true, overlay: { intensidad: 40 } }), COLORES);
  comprobar('Sin color propio, el overlay usa el fondo del tema', velo.background === COLORES.bg);
  comprobar('...a la opacidad pedida', velo.opacity === 0.4);
  const teñido = estilosDeVelo(resolverFondo({ tipo: 'color', color: '#F00', activo: true, overlay: { color: '#00FF00', intensidad: 50 } }), COLORES);
  comprobar('Con color propio, el overlay lo usa', teñido.background === '#00FF00');
  // El overlay va en SU capa: si se desenfocara con la foto dejaría de proteger la
  // lectura, que es justo para lo que existe.
  comprobar('El overlay NO lleva desenfoque, aunque el fondo sí',
    estilosDeVelo(resolverFondo({ tipo: 'foto', activo: true, overlay: { intensidad: 30 }, desenfoque: 20 }, { urlFoto: 'u' }), COLORES).filter === undefined);
  // MIGRACIÓN: un `velo` guardado por v1.36/37 tiene que llegar al overlay.
  comprobar('Un `velo` guardado por una versión anterior se migra al overlay',
    normalizarFondo({ velo: 35 }).overlay.intensidad === 35);
}

/* --- Apartados 13 y 14: cambiar y restablecer --- */
{
  const f = seleccionarFondo(DEFAULT_FONDO, 'color', { color: '#123456' });
  comprobar('Seleccionar un tipo lo activa', f.tipo === 'color' && f.activo === true);
  comprobar('...con los datos que se le pasan', f.color === '#123456');
  comprobar('Seleccionar "ninguno" desactiva', seleccionarFondo(f, 'ninguno').activo === false);
  comprobar('Un tipo inventado no cambia nada', seleccionarFondo(f, 'zzz').tipo === 'color');

  const ajustado = ajustarFondo(f, { velo: 30, desenfoque: 5 });
  comprobar('Ajustar la presentación no cambia el tipo', ajustado.tipo === 'color' && ajustado.color === '#123456');
  comprobar('...pero sí los ajustes', ajustado.velo === 30 && ajustado.desenfoque === 5);

  // Apartado 14, literal: restablecer NO borra nada.
  const r = restablecerFondo(ajustado);
  comprobar('Restablecer vuelve al fondo normal', r.tipo === 'ninguno' && r.activo === false);
  comprobar('...SIN borrar el color que había', r.color === '#123456');
  comprobar('...ni los ajustes', r.velo === 30);
  comprobar('...así que se sabe que hay algo a lo que volver', tieneFondoGuardado(r) === true);
  comprobar('Un fondo virgen no tiene nada guardado', tieneFondoGuardado(DEFAULT_FONDO) === false);
  const conFoto = restablecerFondo({ tipo: 'foto', activo: true, foto: { path: 'mia.jpg' } });
  comprobar('Restablecer NO borra la fotografía elegida', conFoto.foto.path === 'mia.jpg');
}

/* --- Descripción para Ajustes: nunca inventa --- */
{
  comprobar('Sin fondo, lo dice', describirFondo(DEFAULT_FONDO) === 'El fondo normal de JosStyle');
  comprobar('Un fondo apagado también', describirFondo({ tipo: 'color', color: '#FF0000', activo: false }) === 'El fondo normal de JosStyle');
  comprobar('Un color se describe con su hex', describirFondo({ tipo: 'color', color: '#FF0000', activo: true }).includes('#FF0000'));
  comprobar('Un incluido se describe por su nombre',
    describirFondo({ tipo: 'predeterminado', incluido: 'profundidad', activo: true }) === 'Profundidad');
  // Y el caso honesto: tipo foto pero sin foto elegida todavía.
  comprobar('Una foto sin elegir lo dice, no finge',
    describirFondo({ tipo: 'foto', activo: true }) === 'Fotografía sin elegir');
  comprobar('Una foto elegida se describe', describirFondo({ tipo: 'foto', activo: true, foto: { path: 'x' } }) === 'Tu fotografía');
}

/* --- Apartado 10: claro/oscuro no puede perder el fondo --- */
{
  // El fondo no guarda ningún color del tema resuelto: los incluidos se pintan
  // con tokens en el momento. Por eso cambiar de tema no puede tocarlo — y esto
  // lo comprueba de verdad, pintando el MISMO fondo con dos paletas distintas.
  const claro = { bg: '#F3F4F7', accent: '#4C8DFF', surface2: '#EAEDF1' };
  const fondo = { tipo: 'predeterminado', incluido: 'acento_suave', activo: true };
  const enOscuro = estilosDeFondo(resolverFondo(fondo), COLORES);
  const enClaro = estilosDeFondo(resolverFondo(fondo), claro);
  comprobar('El mismo fondo se pinta distinto en cada tema', enOscuro.background !== enClaro.background);
  comprobar('...usando el fondo de cada tema', enClaro.background.includes(claro.bg));
  comprobar('...y la configuración guardada no cambia', normalizarFondo(fondo).incluido === 'acento_suave');
}

/* ===========================================================================
   FO FASE 2 — GALERÍA Y SELECCIÓN DE FOTOGRAFÍAS
   =========================================================================== */
console.log('\n═══ FO Fase 2 — la fotografía de fondo ═══\n');

/* --- Apartados 5 y 11: la foto y su orientación --- */
{
  comprobar('Las 4 orientaciones del apartado 5', ORIENTACIONES_FOTO.length === 4);
  // La orientación se DEDUCE de las medidas reales; no es una etiqueta guardada.
  comprobar('Una foto de móvil (1080x1920) es vertical', orientacionDeFoto({ proporcion: 1080 / 1920 }) === 'vertical');
  comprobar('Una foto apaisada (1920x1080) es horizontal', orientacionDeFoto({ proporcion: 1920 / 1080 }) === 'horizontal');
  comprobar('Una foto cuadrada es cuadrada', orientacionDeFoto({ proporcion: 1 }) === 'cuadrada');
  comprobar('Casi cuadrada sigue siendo cuadrada', orientacionDeFoto({ proporcion: 1.02 }) === 'cuadrada');
  comprobar('Una panorámica (3:1) es panorámica', orientacionDeFoto({ proporcion: 3 }) === 'panoramica');
  // Sin medidas NO se inventa una orientación.
  comprobar('Sin proporción no se inventa orientación', orientacionDeFoto({ proporcion: 0 }) === null);
  comprobar('Una foto nula tampoco revienta', orientacionDeFoto(null) === null);

  const d = datosDeFoto({ path: 'u/1.jpg', formato: 'image/jpeg', ancho: 1080, alto: 1920, peso: 2048 });
  comprobar('Los datos de la foto traen todo lo del apartado 11',
    d.id && d.path === 'u/1.jpg' && d.formato === 'image/jpeg' && d.peso === 2048 && d.anadidaEn);
  comprobar('La proporción se calcula, no se pide', Math.abs(d.proporcion - 0.5625) < 0.001, String(d.proporcion));
  comprobar('Dos fotos nunca comparten id', datosDeFoto({}).id !== datosDeFoto({}).id);
  // Una foto sin medidas no puede dividir por cero.
  comprobar('Sin alto, la proporción es 0 y no NaN', datosDeFoto({ ancho: 100, alto: 0 }).proporcion === 0);
  comprobar('El origen por defecto es la galería', datosDeFoto({}).origen === 'galeria');
}

/* --- Apartado 6: el encuadre inicial --- */
{
  // Una foto muy vertical se ancla ARRIBA: centrada cortaría justo por donde
  // suele estar lo importante en una foto de móvil.
  comprobar('Una foto vertical se ancla arriba', encuadreInicial({ proporcion: 0.5625 }).encuadre.y === 0);
  comprobar('Una horizontal se centra', encuadreInicial({ proporcion: 1.77 }).encuadre.y === 50);
  comprobar('Una panorámica se centra', encuadreInicial({ proporcion: 3 }).encuadre.y === 50);
  comprobar('Una cuadrada se centra', encuadreInicial({ proporcion: 1 }).encuadre.y === 50);
  comprobar('El encuadre inicial nunca desplaza en horizontal', encuadreInicial({ proporcion: 0.5 }).encuadre.x === 50);
  // Apartado 5: la imagen NUNCA debe deformarse. Escala 100 = `cover`.
  comprobar('El encuadre inicial es siempre cover, para no deformar', encuadreInicial({ proporcion: 3 }).escala === 100);
  comprobar('Sin medidas, el encuadre no revienta', encuadreInicial(null).encuadre.y === 50);
}

/* --- Apartado 12: no dejar entrar una imagen imposible --- */
{
  comprobar('Un JPEG normal vale', validarFotoFondo({ type: 'image/jpeg', size: 1024 * 1024 }).ok === true);
  comprobar('Un PNG vale', validarFotoFondo({ type: 'image/png', size: 500 }).ok === true);
  comprobar('Un HEIC de iPhone vale', validarFotoFondo({ type: 'image/heic', size: 500 }).ok === true);
  comprobar('Un PDF no vale', validarFotoFondo({ type: 'application/pdf', size: 500 }).ok === false);
  comprobar('...y lo dice en castellano', validarFotoFondo({ type: 'application/pdf', size: 500 }).motivo.includes('no es una imagen'));
  const gorda = validarFotoFondo({ type: 'image/jpeg', size: MAX_PESO_FONDO + 1 });
  comprobar('Una imagen de más de 12 MB se rechaza', gorda.ok === false);
  comprobar('...diciendo cuánto pesa y cuál es el máximo', gorda.motivo.includes('MB') && gorda.motivo.includes('12 MB'));
  comprobar('Sin archivo lo dice, no revienta', validarFotoFondo(null).ok === false);
  // Algunos navegadores no rellenan `type`. Rechazar una foto válida por eso
  // sería peor que aceptar una rara.
  comprobar('Un archivo sin tipo declarado NO se rechaza por formato', validarFotoFondo({ type: '', size: 500 }).ok === true);
}

/* --- Apartados 7 y 14: aplicar la foto SIN perder lo anterior --- */
{
  // Esta es LA prueba del apartado 14: elegir una foto no puede tirar el color
  // que Josué tenía configurado.
  const conColor = seleccionarFondo(DEFAULT_FONDO, 'color', { color: '#123456' });
  const conFoto = aplicarFoto(conColor, datosDeFoto({ path: 'u/1.jpg', ancho: 1080, alto: 1920 }));
  comprobar('Aplicar una foto la deja activa', conFoto.tipo === 'foto' && conFoto.activo === true);
  comprobar('...con su ruta guardada', conFoto.foto.path === 'u/1.jpg');
  comprobar('...y el encuadre inicial ya calculado', conFoto.encuadre.y === 0 && conFoto.escala === 100);
  comprobar('APLICAR UNA FOTO NO BORRA EL COLOR ANTERIOR', conFoto.color === '#123456');

  const conDeg = seleccionarFondo(DEFAULT_FONDO, 'degradado', { degradado: { de: '#FF0000', a: '#00FF00', angulo: 90 } });
  const conFoto2 = aplicarFoto(conDeg, datosDeFoto({ path: 'u/2.jpg', ancho: 1920, alto: 1080 }));
  comprobar('...ni el degradado', conFoto2.degradado.de === '#FF0000' && conFoto2.degradado.a === '#00FF00');
  comprobar('Una foto horizontal se centra al aplicarla', conFoto2.encuadre.y === 50);
  comprobar('tieneFoto lo detecta', tieneFoto(conFoto) === true && tieneFoto(DEFAULT_FONDO) === false);

  // Apartado 8: cambiar de foto sin quitar la anterior primero.
  const cambiada = aplicarFoto(conFoto, datosDeFoto({ path: 'u/3.jpg', ancho: 1000, alto: 1000 }));
  comprobar('Cambiar de foto sustituye la ruta', cambiada.foto.path === 'u/3.jpg');
  comprobar('...recalculando su encuadre', cambiada.encuadre.y === 50);
  comprobar('...y sigue sin perder el color', cambiada.color === '#123456');
}

/* --- Apartado 9: quitar la foto --- */
{
  const base = seleccionarFondo(DEFAULT_FONDO, 'color', { color: '#123456' });
  const conFoto = aplicarFoto(base, datosDeFoto({ path: 'u/1.jpg', ancho: 1080, alto: 1920 }));

  const quitada = quitarFoto(conFoto);
  // "Vuelve al fondo anterior según la lógica de la FASE 1" — había un color.
  comprobar('Quitar la foto vuelve al color que había', quitada.tipo === 'color' && quitada.activo === true);
  // Y lo que el apartado subraya: la foto NO se elimina definitivamente.
  comprobar('QUITAR LA FOTO NO LA BORRA DEL SISTEMA', quitada.foto.path === 'u/1.jpg');
  comprobar('...así que se puede recuperar en la Fase 12', tieneFoto(quitada) === true);

  // Sin color ni degradado previos, se vuelve al fondo normal.
  const soloFoto = aplicarFoto(DEFAULT_FONDO, datosDeFoto({ path: 'u/9.jpg', ancho: 100, alto: 100 }));
  const sinNada = quitarFoto(soloFoto);
  comprobar('Sin nada anterior, se vuelve al fondo normal', sinNada.tipo === 'ninguno' && sinNada.activo === false);
  comprobar('...y la foto tampoco se pierde', sinNada.foto.path === 'u/9.jpg');

  // Con degradado previo, se vuelve al degradado.
  const conDeg = aplicarFoto(seleccionarFondo(DEFAULT_FONDO, 'degradado', { degradado: { de: '#FF0000', a: '#00FF00' } }),
    datosDeFoto({ path: 'u/4.jpg', ancho: 100, alto: 100 }));
  comprobar('Con degradado previo, se vuelve al degradado', quitarFoto(conDeg).tipo === 'degradado');
}

/* --- Apartado 13: la foto sobrevive a cerrar y abrir --- */
{
  // Se simula el viaje real: guardar → JSON → cargar → normalizar.
  const original = aplicarFoto(DEFAULT_FONDO, datosDeFoto({ path: 'u/1.jpg', formato: 'image/jpeg', ancho: 1080, alto: 1920, peso: 999 }));
  const vuelta = normalizarFondo(JSON.parse(JSON.stringify(original)));
  comprobar('La foto sobrevive a guardar y volver a cargar', vuelta.foto.path === 'u/1.jpg');
  comprobar('...con sus medidas', vuelta.foto.ancho === 1080 && vuelta.foto.alto === 1920);
  comprobar('...su formato y su peso', vuelta.foto.formato === 'image/jpeg' && vuelta.foto.peso === 999);
  comprobar('...y su encuadre', vuelta.encuadre.y === 0);
  comprobar('...y sigue siendo el fondo activo', vuelta.tipo === 'foto' && vuelta.activo === true);
}

/* ===========================================================================
   FO FASE 3 — EL EDITOR DE FOTOGRAFÍA
   =========================================================================== */
console.log('\n═══ FO Fase 3 — editor de fotografía ═══\n');

const FOTO_V = datosDeFoto({ path: 'u/v.jpg', ancho: 1080, alto: 1920 });   // vertical
const FOTO_H = datosDeFoto({ path: 'u/h.jpg', ancho: 1920, alto: 1080 });   // horizontal

/* --- Apartado 2: la fotografía original NUNCA se modifica --- */
{
  const base = aplicarFoto(DEFAULT_FONDO, FOTO_V);
  const editado = ajustarFondo(base, { escala: 180, desenfoque: 12, luminosidad: -50, encuadre: { x: 30, y: 20 } });
  // Los ajustes son configuración del fondo, no una imagen nueva: la ruta y las
  // medidas de la foto siguen siendo exactamente las mismas.
  comprobar('Editar NO toca el archivo: misma ruta', editado.foto.path === FOTO_V.path);
  comprobar('...mismas medidas', editado.foto.ancho === 1080 && editado.foto.alto === 1920);
  comprobar('...y mismo id', editado.foto.id === FOTO_V.id);
  comprobar('Los ajustes se guardan como configuración', editado.escala === 180 && editado.desenfoque === 12);
}

/* --- Apartados 4-7: zoom y encuadre, sin deformar --- */
{
  const f = aplicarFoto(DEFAULT_FONDO, FOTO_H);
  comprobar('El zoom mínimo es 100 (cover): por debajo dejaría huecos', ajustarFondo(f, { escala: 50 }).escala === 100);
  comprobar('El zoom tiene tope razonable', ajustarFondo(f, { escala: 9999 }).escala === 300);
  comprobar('Volver al zoom inicial es volver a 100', restablecerAjustes(ajustarFondo(f, { escala: 250 })).escala === 100);

  // Apartado 5 y 6: horizontal y vertical, libres.
  const movido = ajustarFondo(f, { encuadre: { x: 15, y: 85 } });
  comprobar('Se puede desplazar en horizontal', movido.encuadre.x === 15);
  comprobar('...y en vertical', movido.encuadre.y === 85);
  comprobar('El encuadre se acota a 0-100', ajustarFondo(f, { encuadre: { x: -50, y: 500 } }).encuadre.x === 0);
  comprobar('...por los dos lados', ajustarFondo(f, { encuadre: { x: -50, y: 500 } }).encuadre.y === 100);

  // Apartado 7: NUNCA deformar. El tamaño de fondo es cover o un %, jamás "100% 100%".
  const est = estilosDeFondo(resolverFondo(ajustarFondo(f, { escala: 180 }), { urlFoto: 'u' }), COLORES);
  comprobar('El zoom no deforma: se pinta con un solo porcentaje', est.backgroundSize === '180%');
  comprobar('Sin zoom, cover', estilosDeFondo(resolverFondo(f, { urlFoto: 'u' }), COLORES).backgroundSize === 'cover');
}

/* --- Apartados 9 y 10: oscurecer y aclarar --- */
{
  comprobar('Sin luminosidad no se pinta esa capa', estilosDeLuminosidad(resolverFondo(aplicarFoto(DEFAULT_FONDO, FOTO_H), { urlFoto: 'u' })) === null);
  const osc = estilosDeLuminosidad(resolverFondo(ajustarFondo(aplicarFoto(DEFAULT_FONDO, FOTO_H), { luminosidad: -60 }), { urlFoto: 'u' }));
  comprobar('Negativo oscurece con negro', osc.background === '#000000' && Math.abs(osc.opacity - 0.6) < 0.001);
  const acl = estilosDeLuminosidad(resolverFondo(ajustarFondo(aplicarFoto(DEFAULT_FONDO, FOTO_H), { luminosidad: 40 }), { urlFoto: 'u' }));
  comprobar('Positivo aclara con blanco', acl.background === '#FFFFFF' && Math.abs(acl.opacity - 0.4) < 0.001);
  // Apartado 10: el aclarado tiene menos recorrido, para no matar el contraste.
  comprobar('El aclarado llega menos lejos que el oscurecido',
    normalizarFondo({ luminosidad: 999 }).luminosidad < Math.abs(normalizarFondo({ luminosidad: -999 }).luminosidad));
  comprobar('Sin fondo no hay capa de luminosidad', estilosDeLuminosidad(resolverFondo(DEFAULT_FONDO)) === null);
}

/* --- Apartado 13: restablecer ajustes, sin perder la foto --- */
{
  const f = aplicarFoto(DEFAULT_FONDO, FOTO_V);
  const editado = ajustarFondo(f, { escala: 220, desenfoque: 20, luminosidad: -70, opacidad: 40, encuadre: { x: 10, y: 90 }, overlay: { color: '#FF0000', intensidad: 60 } });
  const limpio = restablecerAjustes(editado);

  comprobar('Restablecer devuelve el zoom', limpio.escala === 100);
  comprobar('...quita el desenfoque', limpio.desenfoque === 0);
  comprobar('...quita el oscurecimiento', limpio.luminosidad === 0);
  comprobar('...devuelve la opacidad', limpio.opacidad === 100);
  comprobar('...desactiva el overlay', limpio.overlay.intensidad === 0 && limpio.overlay.color === '');
  // Y esto es lo que subraya el apartado: NO elimina la fotografía.
  comprobar('RESTABLECER NO ELIMINA LA FOTOGRAFÍA', limpio.foto.path === FOTO_V.path);
  comprobar('...y sigue activa', limpio.tipo === 'foto' && limpio.activo === true);
  // El encuadre vuelve al INICIAL de esa orientación, no a "centro" a secas: para
  // una foto vertical, "original" es anclada arriba, que es como se aplicó.
  comprobar('El encuadre vuelve al inicial de SU orientación, no al centro', limpio.encuadre.y === 0);
  comprobar('Una foto horizontal sí vuelve al centro', restablecerAjustes(ajustarFondo(aplicarFoto(DEFAULT_FONDO, FOTO_H), { encuadre: { x: 0, y: 0 } })).encuadre.y === 50);
  comprobar('Sin ajustes, no hay nada que restablecer', tieneAjustes(f) === false);
  comprobar('Con ajustes, sí', tieneAjustes(editado) === true);
}

/* --- Apartado 14: cancelar. El editor trabaja sobre un borrador --- */
{
  // Cancelar es no llamar a onCambiar: el fondo guardado no se toca. Se comprueba
  // que editar un borrador NUNCA muta el original, que es lo que lo hace posible
  // "incluso después de realizar muchos cambios".
  const original = aplicarFoto(DEFAULT_FONDO, FOTO_V);
  const copia = JSON.parse(JSON.stringify(original));
  let borrador = original;
  for (let i = 0; i < 40; i++) borrador = ajustarFondo(borrador, { escala: 100 + i, desenfoque: i % 40, luminosidad: -i });
  comprobar('40 cambios seguidos no tocan el fondo original', JSON.stringify(original) === JSON.stringify(copia));
  comprobar('...aunque el borrador sí haya cambiado', borrador.escala !== original.escala);
}

/* --- Apartado 16: cambiar de foto desde el editor --- */
{
  const conAjustes = ajustarFondo(aplicarFoto(DEFAULT_FONDO, FOTO_V), {
    escala: 200, encuadre: { x: 10, y: 90 }, desenfoque: 15, luminosidad: -40,
  });
  const nueva = aplicarFotoConAjustes(conAjustes, FOTO_H);

  comprobar('Cambiar de foto sustituye la imagen', nueva.foto.path === FOTO_H.path);
  // La geometría NO se hereda: el encuadre bueno de un retrato vertical no
  // significa nada en una panorámica. Es el "accidentalmente" del apartado.
  comprobar('El encuadre NO se hereda: se recalcula', nueva.encuadre.y === 50 && nueva.encuadre.x === 50);
  comprobar('...ni el zoom', nueva.escala === 100);
  // El gusto sí: si querías la foto discreta y oscura para leer mejor, la sigues
  // queriendo así con otra imagen.
  comprobar('El desenfoque SÍ se hereda, es gusto', nueva.desenfoque === 15);
  comprobar('...y el oscurecimiento también', nueva.luminosidad === -40);
}

/* --- Apartado 20: los ajustes quedan vinculados a SU fotografía --- */
{
  const conV = ajustarFondo(aplicarFoto(DEFAULT_FONDO, FOTO_V), { escala: 250, encuadre: { x: 80, y: 10 } });
  // Al cambiar a la horizontal, los de la vertical se recuerdan...
  const conH = aplicarFotoConAjustes(conV, FOTO_H);
  comprobar('Al cambiar de foto se recuerdan los ajustes de la anterior', !!conH.ajustesPorFoto[FOTO_V.id]);
  comprobar('...con su zoom', conH.ajustesPorFoto[FOTO_V.id].escala === 250);
  // ...y al volver a ella, se recuperan en vez de heredar los de la otra.
  const vuelta = aplicarFotoConAjustes(ajustarFondo(conH, { escala: 130 }), FOTO_V);
  comprobar('VOLVER A UNA FOTO YA USADA RECUPERA SUS AJUSTES', vuelta.escala === 250, String(vuelta.escala));
  comprobar('...incluido su encuadre', vuelta.encuadre.x === 80 && vuelta.encuadre.y === 10);
  comprobar('...y no los de la foto intermedia', vuelta.escala !== 130);

  // La memoria no puede crecer sin fin: se guarda entera en cada saveData.
  let acumulado = DEFAULT_FONDO;
  for (let i = 0; i < MAX_AJUSTES_RECORDADOS + 6; i++) {
    acumulado = aplicarFotoConAjustes(acumulado, datosDeFoto({ path: `u/${i}.jpg`, ancho: 100, alto: 100 }));
  }
  comprobar('La memoria de ajustes se limita', Object.keys(recordarAjustes(acumulado).ajustesPorFoto).length <= MAX_AJUSTES_RECORDADOS,
    String(Object.keys(recordarAjustes(acumulado).ajustesPorFoto).length));
  comprobar('Una foto sin id no ensucia la memoria', Object.keys(recordarAjustes(DEFAULT_FONDO).ajustesPorFoto).length === 0);
}

/* --- Los ajustes de presentación son una lista única --- */
{
  comprobar('AJUSTES_PRESENTACION cubre los seis controles', AJUSTES_PRESENTACION.length === 6);
  comprobar('Todos existen en el modelo', AJUSTES_PRESENTACION.every((k) => k in DEFAULT_FONDO));
  const porDefecto = ajustesPorDefecto();
  comprobar('Los valores de fábrica salen del propio modelo', porDefecto.escala === DEFAULT_FONDO.escala);
  // Copias, no referencias: si `ajustesPorDefecto` devolviera el mismo objeto
  // anidado, editar un fondo mutaría DEFAULT_FONDO para toda la app.
  porDefecto.overlay.intensidad = 99;
  comprobar('ajustesPorDefecto devuelve COPIAS, no referencias a DEFAULT_FONDO',
    DEFAULT_FONDO.overlay.intensidad === 0);
  const extraidos = ajustesDe(ajustarFondo(DEFAULT_FONDO, { escala: 150 }));
  comprobar('ajustesDe extrae solo la presentación', extraidos.escala === 150 && !('tipo' in extraidos) && !('foto' in extraidos));
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
