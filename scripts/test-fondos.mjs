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
  // La fotografía es de la Fase 2: existe en el modelo pero no se ofrece todavía.
  comprobar('La fotografía está declarada pero marcada como no implementada',
    tipoDeFondo('foto').implementado === false && tipoDeFondo('foto').fase === 2);
  comprobar('Los otros cuatro sí están implementados',
    TIPOS_FONDO.filter((t) => t.id !== 'foto').every((t) => t.implementado === true));
  comprobar('Hay fondos incluidos (apartado 3-E)', FONDOS_INCLUIDOS.length >= 3);
  comprobar('Un incluido desconocido no revienta', fondoIncluido('zzz').id === FONDOS_INCLUIDOS[0].id);
  // Los incluidos se definen con TOKENS, no con hex: siguen el tema y el acento.
  comprobar('Los fondos incluidos se definen con tokens, no con hex sueltos',
    FONDOS_INCLUIDOS.every((f) => !/^#/.test(f.de) && !/^#/.test(f.a)));
  comprobar('Las 5 posiciones tienen su CSS', POSICIONES_FONDO.every((p) => p.id && p.label && p.css));
  comprobar('Una posición desconocida cae en el centro', posicionDeFondo('zzz').id === 'centro');
}

/* --- Apartado 4: el modelo central --- */
{
  const esperados = ['tipo', 'activo', 'incluido', 'color', 'degradado', 'foto', 'posicion',
    'escala', 'opacidad', 'desenfoque', 'velo', 'analisis', 'paleta', 'recomendacion'];
  for (const campo of esperados) comprobar(`El modelo declara "${campo}"`, campo in DEFAULT_FONDO);
  // Apartado 7: la fotografía tiene que poder identificarse por completo.
  for (const campo of ['id', 'path', 'origen', 'ancho', 'alto', 'proporcion']) {
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
  comprobar('...y recupera los campos que le faltaban', n.velo === 0 && n.escala === 100 && 'foto' in n);
  comprobar('...incluidos los de fases futuras', 'analisis' in n && 'paleta' in n);
  comprobar('Un fondo nulo devuelve el valor por defecto', normalizarFondo(null).tipo === 'ninguno');
  comprobar('Un fondo indefinido también', normalizarFondo(undefined).activo === false);

  // Los números se acotan: un valor absurdo guardado por error no puede dejar
  // la app inutilizable.
  comprobar('Una escala absurda se acota', normalizarFondo({ escala: 4000 }).escala === 300);
  comprobar('Una opacidad negativa se acota a 0', normalizarFondo({ opacidad: -50 }).opacidad === 0);
  comprobar('Un desenfoque enorme se acota', normalizarFondo({ desenfoque: 999 }).desenfoque === 40);
  comprobar('Un velo por encima de 90 se acota', normalizarFondo({ velo: 100 }).velo === 90);
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
  const fotoZoom = estilosDeFondo(resolverFondo({ tipo: 'foto', activo: true, escala: 150, posicion: 'arriba' }, { urlFoto: 'u' }), COLORES);
  comprobar('Con escala distinta de 100 se usa el porcentaje', fotoZoom.backgroundSize === '150%');
  comprobar('...y la posición elegida', fotoZoom.backgroundPosition === 'center top');
}

/* --- El velo (apartado 4, `overlay`) --- */
{
  comprobar('Sin velo no se pinta capa de velo', estilosDeVelo(resolverFondo({ tipo: 'color', color: '#F00', activo: true }), COLORES) === null);
  comprobar('Sin fondo tampoco', estilosDeVelo(resolverFondo(DEFAULT_FONDO), COLORES) === null);
  const velo = estilosDeVelo(resolverFondo({ tipo: 'color', color: '#F00', activo: true, velo: 40 }), COLORES);
  comprobar('Con velo se pinta con el color de fondo del tema', velo.background === COLORES.bg);
  comprobar('...a la opacidad pedida', velo.opacity === 0.4);
  // El velo va en SU capa: si se desenfocara con la foto dejaría de proteger la
  // lectura, que es justo para lo que existe.
  comprobar('El velo NO lleva desenfoque, aunque el fondo sí',
    estilosDeVelo(resolverFondo({ tipo: 'foto', activo: true, velo: 30, desenfoque: 20 }, { urlFoto: 'u' }), COLORES).filter === undefined);
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

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
