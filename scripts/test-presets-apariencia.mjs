// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 8 — pruebas de los presets de apariencia.
//
// Las tres que más importan:
//
//   · Apartado 14 — un preset oficial NO se puede modificar, ni por accidente.
//   · Apartado 6  — "activo" tiene que decir la verdad: si aplicas un preset y
//     luego cambias un color a mano, ya no estás usando ese preset.
//   · Apartado 2  — un preset guarda la apariencia COMPLETA, fondo incluido. Un
//     preset con los colores pero sin la foto no es un preset, es medio.
// ---------------------------------------------------------------------------
import {
  PRESETS_OFICIALES, MAX_PRESETS, crearPreset, normalizarPreset, aplicarPreset,
  presetTieneFoto, listaPresets, presetActivo, duplicarPreset, actualizarPreset,
  alternarFavorito, esEditable,
} from '../src/lib/presetsApariencia.js';
import { DEFAULT_TEMA_PERSONALIZADO } from '../src/tokens.js';
import { DEFAULT_FONDO } from '../src/lib/fondos.js';

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

console.log('\n═══ FO Fase 8 — presets de apariencia ═══\n');

const APARIENCIA = {
  tema: 'oscuro',
  accent: '#C77C3A',
  temaPersonalizado: { ...DEFAULT_TEMA_PERSONALIZADO, secundario: '#123456', superficieAlfa: 70, sombras: 12 },
  fondo: {
    ...DEFAULT_FONDO, tipo: 'foto', activo: true,
    foto: { ...DEFAULT_FONDO.foto, id: 'f1', path: 'u/mia.jpg', ancho: 1080, alto: 1920 },
    escala: 150, desenfoque: 8, luminosidad: -30, overlay: { color: '#001122', intensidad: 25 },
  },
};

/* --- Apartado 2: la configuración COMPLETA --- */
{
  const p = crearPreset({ nombre: '  Mi estilo  ', ...APARIENCIA });
  comprobar('El nombre llega recortado', p.nombre === 'Mi estilo');
  comprobar('Sin nombre no queda vacío', crearPreset({}).nombre === 'Mi apariencia');
  comprobar('Guarda el tema claro/oscuro', p.tema === 'oscuro');
  comprobar('Guarda el acento', p.accent === '#C77C3A');
  comprobar('Guarda los colores personalizados', p.temaPersonalizado.secundario === '#123456');
  comprobar('...las transparencias', p.temaPersonalizado.superficieAlfa === 70);
  comprobar('...y las sombras', p.temaPersonalizado.sombras === 12);
  // Lo que la fase V4 NO guardaba y es lo que hace de esto un preset completo.
  comprobar('GUARDA EL FONDO ENTERO, no solo los colores', p.fondo.tipo === 'foto' && p.fondo.activo === true);
  comprobar('...con la fotografía', p.fondo.foto.path === 'u/mia.jpg');
  comprobar('...y sus ajustes', p.fondo.escala === 150 && p.fondo.desenfoque === 8 && p.fondo.luminosidad === -30);
  comprobar('...y el overlay', p.fondo.overlay.intensidad === 25);
  comprobar('Un preset nuevo no es oficial ni favorito', p.oficial === false && p.favorito === false);
  comprobar('Dos presets nunca comparten id', crearPreset({}).id !== crearPreset({}).id);
  comprobar('presetTieneFoto lo detecta', presetTieneFoto(p) === true && presetTieneFoto(crearPreset({})) === false);

  // Copia profunda: si guardara referencias, el preset cambiaría solo cada vez que
  // Josué toca un color y dejaría de ser "lo que tenía aquel día".
  APARIENCIA.temaPersonalizado.secundario = '#000000';
  APARIENCIA.fondo.escala = 100;
  comprobar('EL PRESET ES UNA FOTO FIJA: copia profunda, no referencias',
    p.temaPersonalizado.secundario === '#123456' && p.fondo.escala === 150);
  // Se deja como estaba para el resto de pruebas.
  APARIENCIA.temaPersonalizado.secundario = '#123456';
  APARIENCIA.fondo.escala = 150;
}

/* --- Regla 5: un tema guardado por la fase V4, sin fondo --- */
{
  const viejo = { id: 'v1', nombre: 'De antes', tema: 'claro', accent: '#FF0000', temaPersonalizado: { secundario: '#00FF00' } };
  const n = normalizarPreset(viejo);
  comprobar('Un tema guardado por V4 sigue funcionando', n.nombre === 'De antes' && n.accent === '#FF0000');
  comprobar('...y se le pone un fondo de fábrica', n.fondo.tipo === 'ninguno' && n.fondo.activo === false);
  comprobar('...así que aplicarlo no toca el fondo actual de forma rara', aplicarPreset(n).fondo.activo === false);
  comprobar('...y recupera los campos nuevos del tema', n.temaPersonalizado.superficieAlfa === 100);
  comprobar('Un preset nulo devuelve null', normalizarPreset(null) === null);
}

/* --- Apartados 13 y 14: los oficiales --- */
{
  comprobar('Hay presets incluidos', PRESETS_OFICIALES.length >= 3);
  comprobar('Todos están marcados como oficiales', PRESETS_OFICIALES.every((p) => p.oficial === true));
  comprobar('Todos tienen nombre y descripción', PRESETS_OFICIALES.every((p) => p.nombre && p.descripcion));
  // Ninguno trae una foto: una foto es de quien la hizo.
  comprobar('NINGÚN preset oficial trae una fotografía', PRESETS_OFICIALES.every((p) => !p.fondo.foto?.path));
  // `accent: null` = "no toques el acento", no "ponlo a null".
  comprobar('Los oficiales no imponen un acento', PRESETS_OFICIALES.every((p) => p.accent === null));
  const conservado = aplicarPreset(PRESETS_OFICIALES[0], { accentActual: '#C77C3A' });
  comprobar('...así que aplicar uno CONSERVA el acento de Josué', conservado.accent === '#C77C3A');

  const oficial = PRESETS_OFICIALES[1];
  comprobar('Un oficial NO es editable', esEditable(oficial) === false);
  comprobar('Uno propio sí', esEditable(crearPreset({})) === true);
  // Apartado 14: intentar actualizarlo no hace nada, en vez de fallar.
  const tras = actualizarPreset(oficial, APARIENCIA);
  comprobar('ACTUALIZAR UN OFICIAL NO LO CAMBIA', tras.fondo.foto.path === '' && tras.accent === null);
  comprobar('...ni siquiera su nombre', tras.nombre === oficial.nombre);
  comprobar('Marcar favorito un oficial tampoco hace nada', alternarFavorito(oficial).favorito === false);
}

/* --- Apartado 9: duplicar --- */
{
  const p = crearPreset({ nombre: 'Gym', ...APARIENCIA, favorito: true });
  const copia = duplicarPreset(p);
  comprobar('Duplicar crea un id nuevo', copia.id !== p.id);
  comprobar('...con nombre reconocible', copia.nombre === 'Gym (copia)');
  comprobar('...y la misma configuración', copia.fondo.foto.path === p.fondo.foto.path && copia.temaPersonalizado.secundario === p.temaPersonalizado.secundario);
  // Independiente de verdad: modificar la copia no toca el original.
  copia.temaPersonalizado.secundario = '#FFFFFF';
  comprobar('LA COPIA ES INDEPENDIENTE: tocarla no toca el original', p.temaPersonalizado.secundario === '#123456');

  // Apartado 14: duplicar un oficial es LA vía para personalizarlo, así que la
  // copia tiene que dejar de ser oficial o tampoco se podría tocar.
  const copiaOficial = duplicarPreset(PRESETS_OFICIALES[1]);
  comprobar('Duplicar un oficial da un preset TUYO, editable', copiaOficial.oficial === false && esEditable(copiaOficial));
  comprobar('...conservando su configuración', copiaOficial.fondo.incluido === PRESETS_OFICIALES[1].fondo.incluido);
  comprobar('Duplicar null no revienta', duplicarPreset(null) === null);
}

/* --- Apartado 10: editar un preset existente --- */
{
  const p = crearPreset({ nombre: 'Mi estilo', tema: 'oscuro', accent: '#111111', temaPersonalizado: DEFAULT_TEMA_PERSONALIZADO, fondo: DEFAULT_FONDO });
  const actualizado = actualizarPreset(p, APARIENCIA);
  comprobar('Actualizar recoge la apariencia actual', actualizado.accent === '#C77C3A');
  comprobar('...incluido el fondo', actualizado.fondo.foto.path === 'u/mia.jpg');
  comprobar('...conservando id y nombre', actualizado.id === p.id && actualizado.nombre === 'Mi estilo');
  comprobar('...y sellando cuándo', !!actualizado.actualizadoEn);
}

/* --- Apartados 5, 15 y 16: lista, favoritos y orden --- */
{
  const a = crearPreset({ nombre: 'A', ...APARIENCIA });
  const b = { ...crearPreset({ nombre: 'B', ...APARIENCIA }), favorito: true };
  const lista = listaPresets([a, b]);
  comprobar('La lista incluye los propios y los oficiales', lista.length === 2 + PRESETS_OFICIALES.length);
  comprobar('Los favoritos van arriba', lista[0].nombre === 'B');
  // Los oficiales al FINAL: son cuatro y siempre están, así que arriba ocuparían
  // la primera pantalla y empujarían fuera lo que Josué ha creado.
  comprobar('Los oficiales van al final, no tapando lo propio', lista[lista.length - 1].oficial === true);
  comprobar('Los propios van antes que los oficiales', lista[0].oficial === false && lista[1].oficial === false);
  comprobar('Sin propios, solo salen los oficiales', listaPresets([]).length === PRESETS_OFICIALES.length);
  comprobar('Una lista nula no revienta', listaPresets(null).length === PRESETS_OFICIALES.length);
  comprobar('Alternar favorito funciona en los propios', alternarFavorito(a).favorito === true);
  comprobar('...y se puede quitar', alternarFavorito(alternarFavorito(a)).favorito === false);
  comprobar('Hay un límite de presets', MAX_PRESETS > 0);
}

/* --- APARTADO 6: "activo" tiene que decir la verdad --- */
{
  const p = crearPreset({ nombre: 'Mi estilo', ...APARIENCIA });
  const lista = listaPresets([p]);

  comprobar('Con la apariencia del preset, sale como activo',
    presetActivo(lista, APARIENCIA)?.id === p.id);

  // LA prueba: cambiar un color a mano significa que YA NO estás usando ese
  // preset, aunque fuera el último que aplicaste. Marcarlo activo sería mentir.
  const tocado = { ...APARIENCIA, temaPersonalizado: { ...APARIENCIA.temaPersonalizado, secundario: '#ABCDEF' } };
  comprobar('CLAVE · Si cambias un color a mano, YA NO está activo', presetActivo(lista, tocado) === null);
  // Y lo mismo tocando el fondo.
  const otroFondo = { ...APARIENCIA, fondo: { ...APARIENCIA.fondo, desenfoque: 30 } };
  comprobar('CLAVE · Ni cambiando el fondo', presetActivo(lista, otroFondo) === null);

  // Pero recordar el encuadre de una foto vieja NO cambia lo que se ve, así que
  // no puede desactivar el preset.
  const conMemoria = { ...APARIENCIA, fondo: { ...APARIENCIA.fondo, ajustesPorFoto: { z: { escala: 200 } }, analisis: { fotoId: 'x' } } };
  comprobar('...pero el historial de ajustes y el análisis NO cuentan: no se ven',
    presetActivo(lista, conMemoria)?.id === p.id);

  comprobar('Sin apariencia, no hay activo', presetActivo(lista, null) === null);
}

/* --- Apartado 7: aplicar --- */
{
  const p = crearPreset({ nombre: 'X', ...APARIENCIA });
  const c = aplicarPreset(p);
  comprobar('Aplicar devuelve las cuatro piezas por separado',
    'tema' in c && 'accent' in c && 'temaPersonalizado' in c && 'fondo' in c);
  comprobar('...con el fondo completo', c.fondo.foto.path === 'u/mia.jpg' && c.fondo.escala === 150);
  // Copia profunda otra vez: aplicar y luego tocar no puede corromper el preset.
  c.fondo.escala = 100;
  c.temaPersonalizado.secundario = '#000000';
  comprobar('APLICAR NO CORROMPE EL PRESET: lo aplicado es una copia',
    p.fondo.escala === 150 && p.temaPersonalizado.secundario === '#123456');
  comprobar('Aplicar null devuelve null', aplicarPreset(null) === null);
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
