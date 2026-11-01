// ---------------------------------------------------------------------------
// 🔓 Imagen personal · Fase B · B3 (2026-11-01) — la portada nueva.
//
// Se pinta `EstiloHombreView` a HTML (react-dom/server) y se comprueba lo que
// Josué decidió para la portada:
//   - seis tarjetas iguales (Ropa, Cuidado, Pelo, Fragancia, Accesorios y
//     Funcionamiento), en una cuadrícula de dos columnas y en ese orden;
//   - debajo, Hábitos y rutinas: ancho, sin botón y diciendo que todavía no tiene
//     pantalla propia;
//   - las seis salen también sin nada activado (decisión 6);
//   - el enlace discreto de Ropa a «👤 Mi estilo», hermano del botón principal,
//     nunca dentro de él;
//   - los accesos rápidos, debajo de las tarjetas;
//   - ni rastro de «llegan en las siguientes fases» (decisión 8);
//   - y que no se pierde nada: las plaquitas se mudaron a su categoría (B4), los
//     bloques de Mi estilo personal, Ideas, Mi progreso, Descubrir, Personalizar,
//     Ordenar, las recomendaciones y Gestionar, a Funcionamiento (B5), y Fitness,
//     Sueño y Salud solo salen de ella porque viven en Gestionar apartados (C);
//   - 🔓 B5 (decisión A): Personalizar no ofrece tamaño a las tarjetas fijas, y
//     los tamaños ya guardados no se tocan.
//
//   node scripts/smoke.mjs test-portada-eh.jsx
// ---------------------------------------------------------------------------
import React from 'react';
import { renderToString } from 'react-dom/server';
import EstiloHombreView, { TarjetaPortadaEH, AccesoHabitosEH, CategoriaEH, PersonalizarPlaquitas, GestionarEstiloEH } from '../src/views/EstiloHombreView.jsx';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, alternarModulo, IDS_EH, moduloEH,
} from '../src/lib/estiloDeHombre.js';
import {
  alternarAcceso, tarjetasDePortada, contenidoDeCategoria, TEXTOS_PANTALLA,
  panelPersonalizar, cambiarTamano, tamanoDe, tieneTarjetaFija, TEXTOS_MOVER,
} from '../src/lib/pantallaEH.js';
import { alternarOculto } from '../src/lib/gestionEstilo.js';
import {
  puedeMoverEnSuCategoria, subirEnSuCategoria, bajarEnSuCategoria, moverAEnSuCategoria,
  gruposParaOrdenar, hayQueOrdenar,
} from '../src/lib/gestionModulos.js';
import { modulosActivos } from '../src/lib/estiloDeHombre.js';
import { ACCENTS } from '../src/tokens.js';

const accent = ACCENTS[0].value;
const noop = () => {};
const ARM = { prendas: [], outfits: [], usos: [] };

let fallos = 0;
let total = 0;
const comprobar = (nombre, ok, detalle = '') => {
  total += 1;
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

const pinta = (estado) => renderToString(
  <EstiloHombreView estiloHombre={estado} accent={accent} datosGlobales={{}} armario={ARM} onIr={noop} onCambiar={noop} />,
);
const textos = (h) => h.replace(/<[^>]+>/g, '\n').split('\n').map((x) => x.trim()).filter(Boolean);
/** El trozo de HTML de la cuadrícula de tarjetas (hasta el acceso de Hábitos). */
const cuadricula = (h) => {
  const i = h.indexOf('data-portada-eh="tarjetas"');
  const f = h.indexOf('role="group"', i);
  return i >= 0 && f > i ? h.slice(i, f) : '';
};
/** ¿Hay algún `<button>` dentro de otro? */
const botonDentroDeBoton = (h) => {
  let prof = 0; let max = 0;
  for (const m of h.matchAll(/<\/?button\b/g)) {
    prof += m[0] === '<button' ? 1 : -1;
    max = Math.max(max, prof);
  }
  return max > 1;
};

const NOMBRES = ['Ropa', 'Cuidado', 'Pelo', 'Fragancia', 'Accesorios', 'Funcionamiento'];

console.log('\n🧔  Imagen personal · Fase B · B3 — la portada nueva\n');

/* ── 1 · Las seis tarjetas, iguales y en su orden ─────────────────────────── */
const todos = alternarAcceso(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, IDS_EH), 'rutina_facial');
const hTodos = pinta(todos);
const grid = cuadricula(hTodos);
comprobar('La portada pinta la cuadrícula de tarjetas', grid.length > 0);
comprobar('…de dos columnas y filas de la misma altura', /class="grid grid-cols-2 auto-rows-fr gap-2"/.test(hTodos));
const tGrid = textos(grid);
const posiciones = NOMBRES.map((n) => tGrid.indexOf(n));
comprobar('Están las seis: Ropa, Cuidado, Pelo, Fragancia, Accesorios y Funcionamiento',
  posiciones.every((p) => p >= 0), JSON.stringify(posiciones));
comprobar('…en ese orden', posiciones.every((p, i) => i === 0 || p > posiciones[i - 1]), JSON.stringify(posiciones));
comprobar('Las seis tienen la misma caja (mismo tamaño y jerarquía)',
  (grid.match(/class="relative rounded-2xl h-full"/g) || []).length === 6);
comprobar('…el mismo contenido interior, con la misma altura mínima',
  (grid.match(/class="w-full h-full rounded-2xl p-3 flex flex-col items-start gap-1 text-left"/g) || []).length === 6
  && (grid.match(/min-height:112px/g) || []).length === 6);
comprobar('…y el nombre con el mismo estilo de letra en todas',
  (grid.match(/class="text-sm font-semibold w-full truncate"/g) || []).length === 6);
/* 🔓 B4 — en B3 solo se podían tocar cuatro (Cuidado y Funcionamiento no se abrían
   todavía). Se da la vuelta: ahora las seis abren su sitio. */
comprobar('B4: las seis tarjetas se pueden tocar (Cuidado y Funcionamiento abren su categoría)',
  (grid.match(/<button type="button" class="w-full h-full rounded-2xl/g) || []).length === 6);
comprobar('B4: …y ninguna se queda como caja muda', (grid.match(/<div class="w-full h-full rounded-2xl/g) || []).length === 0);
comprobar('Ningún botón queda dentro de otro', !botonDentroDeBoton(hTodos));

/* ── 2 · El enlace de Ropa a «👤 Mi estilo» ───────────────────────────────── */
const enlaceRopa = /<\/button><button type="button" class="toque-44 absolute left-3 bottom-2[^"]*"[^>]*>👤<!-- --> <!-- -->Mi estilo/;
comprobar('Ropa lleva el enlace discreto a «👤 Mi estilo», como botón propio que va DESPUÉS del principal (hermano, no hijo)',
  enlaceRopa.test(grid));
comprobar('…y es el de la primera tarjeta, Ropa', grid.indexOf('toque-44 absolute') < grid.indexOf('>Cuidado<'));
const sinEstilo = pinta(alternarModulo(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare', 'pelo']), 'estilo', false));
comprobar('Con Estilo apagado no se ofrece el enlace (como hoy)', !/toque-44 absolute left-3 bottom-2/.test(cuadricula(sinEstilo)));
comprobar('No hay un segundo enlace suelto a «Mi estilo» fuera de la tarjeta',
  (hTodos.match(/toque-44 absolute left-3 bottom-2/g) || []).length === 1);

/* ── 3 · Hábitos y rutinas ────────────────────────────────────────────────── */
const tTodos = textos(hTodos);
const iHab = tTodos.indexOf('Hábitos y rutinas');
comprobar('Hábitos y rutinas sale debajo de las seis tarjetas', iHab > posiciones[5] && posiciones[5] >= 0);
comprobar('…diciendo «Todavía no tiene pantalla propia»', tTodos[iHab + 1] === 'Todavía no tiene pantalla propia');
comprobar('…sin botón: no simula abrir nada',
  /<div role="group" aria-label="Hábitos y rutinas: Todavía no tiene pantalla propia"/.test(hTodos));

/* ── 4 · Sin nada activado, las seis siguen (decisión 6) ──────────────────── */
const hVacio = pinta(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, []));
const tVacio = textos(cuadricula(hVacio));
comprobar('Sin ningún apartado activado, las seis tarjetas están igual', NOMBRES.every((n) => tVacio.includes(n)));
comprobar('…con el mismo aspecto', (cuadricula(hVacio).match(/class="relative rounded-2xl h-full"/g) || []).length === 6);
comprobar('…y Hábitos y rutinas también', /aria-label="Hábitos y rutinas: Todavía no tiene pantalla propia"/.test(hVacio));
comprobar('…y la oferta de siempre para empezar sigue debajo', textos(hVacio).includes('Tu espacio está vacío'));

/* ── 5 · Accesos rápidos, debajo de las tarjetas ──────────────────────────── */
const iAccesos = tTodos.indexOf(TEXTOS_PANTALLA.accesos);
comprobar('Los accesos rápidos siguen en la portada', iAccesos >= 0);
comprobar('…debajo de las seis tarjetas y de Hábitos', iAccesos > iHab);
comprobar('…con el que él eligió', tTodos.slice(iAccesos, iAccesos + 6).includes('Rutina facial'));

/* ── 6 · Ni una promesa de fases (decisión 8) ─────────────────────────────── */
comprobar('Ya no dice «llegan en las siguientes fases»', !/siguientes fases/.test(hTodos) && !/siguientes fases/.test(hVacio));
comprobar('…y dice la verdad cuando hay apartados activos sin pantalla', tTodos.includes(TEXTOS_PANTALLA.algunosSinPantalla));
const hConPantalla = pinta(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare', 'pelo']));
comprobar('…y no lo dice si todos los activos tienen pantalla', !textos(hConPantalla).includes(TEXTOS_PANTALLA.algunosSinPantalla));
comprobar('Ningún texto de la portada habla de una fase', !/[Ff]ase \d/.test(tTodos.join(' ')));

/* ── 7 · No se pierde nada ──────────────────────────────────────────────────── */
/* 🔓 B5 — en B3 y B4 estos bloques seguían en la portada (zona de transición).
   Se da la vuelta: el buscador SE QUEDA arriba (decisión D) y el resto ya no está
   en la portada; la sección 10 comprueba que están en Funcionamiento. */
comprobar('El buscador sigue arriba en la portada (decisión D)', tTodos.includes('🔍 Buscar en Imagen personal'));
['💡 Ideas para ti', '📊 Mi progreso', '✨ Descubrir', '🧔 Mi estilo personal',
  TEXTOS_PANTALLA.personalizar, 'Ordenar', 'Gestionar apartados'].forEach((t) => {
  comprobar(`B5: «${t}» ya no está en la portada (se mudó a Funcionamiento)`, !tTodos.some((x) => x.includes(t)));
});
const hTres = pinta(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare', 'pelo', 'habitos']));
comprobar('B5: «También puedes añadir» ya no está en la portada (se mudó a Funcionamiento)', !/También puedes añadir/.test(hTres));
const iZona = 0;
/* 🔓 B4 — en B3 estas plaquitas seguían en la portada «hasta B4». Se da la vuelta:
   ya no están en la portada… y la sección 9 comprueba que están dentro de su
   categoría, que es donde se mudaron. */
['Barba', 'Skincare', 'Higiene', 'Cuidado corporal', 'Sonrisa', 'Mis gustos', 'Progreso', 'Educación', 'Productos'].forEach((n) => {
  comprobar(`B4: la plaquita de «${n}» ya no está en la portada (se mudó a su categoría)`,
    !tTodos.slice(iZona).some((x) => x === `⚪ ${n}`) && !new RegExp(`>⚪ <!-- -->${n}<|>${n}</p>`).test(hTodos.slice(hTodos.indexOf('Mi estilo personal'))));
});
comprobar('B4: no queda ninguna sección de plaquitas en la portada',
  !/>🧴 <!-- -->Cuidado<\/p>|>⚙️ <!-- -->Funcionamiento<\/p>|>🏋️ <!-- -->Físico<|>🧬 <!-- -->Salud<|>❤️ <!-- -->Personal</.test(hTodos));
comprobar('Fitness, Sueño y Salud ya no tienen plaquita en la portada (viven en Gestionar apartados)',
  !['⚪ Fitness', '⚪ Sueño', '⚪ Salud'].some((x) => tTodos.includes(x)));
comprobar('«Estilo y armario», «Perfumes» y la plaquita de Pelo no se repiten: tienen tarjeta',
  !tTodos.slice(iZona).some((x) => x === '⚪ Perfumes' || x === '⚪ Estilo y armario'));

/* ── 8 · Los componentes, sueltos ─────────────────────────────────────────── */
const { tarjetas, habitos } = tarjetasDePortada(todos, { armario: ARM });
const hTarjeta = renderToString(<TarjetaPortadaEH tarjeta={tarjetas[2]} accent={accent} sub="Línea" onAbrir={noop} />);
comprobar('TarjetaPortadaEH pinta su icono, su nombre y su línea', /💇/.test(hTarjeta) && /Pelo/.test(hTarjeta) && /Línea/.test(hTarjeta));
comprobar('AccesoHabitosEH pinta el texto honesto', /Todavía no tiene pantalla propia/.test(renderToString(<AccesoHabitosEH habitos={habitos} />)));
comprobar('AccesoHabitosEH sin datos no pinta nada', renderToString(<AccesoHabitosEH habitos={null} />) === '');

/* ── 9 · 🔓 B4 — LA PANTALLA DE CADA CATEGORÍA ─────────────────────────────── */
const pintaCat = (estado, id) => renderToString(
  <CategoriaEH contenido={contenidoDeCategoria(estado, id, { armario: ARM })} accent={accent}
    subDe={() => null} onAbrir={noop} onActivar={noop} onCerrar={noop} />,
);
// Cuidado: Higiene, Barba y Skincare activos (Skincare oculta); Cuidado corporal y Sonrisa apagados.
let eCu = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['higiene', 'barba', 'skincare']);
const hCu = pintaCat(eCu, 'cuidado');
const tCu = textos(hCu);
// El «volver» es el mismo botón que en el resto de Imagen personal (EH F50, regla `volver_igual`).
comprobar('B4: Cuidado tiene su cabecera y su «volver», el mismo botón de siempre',
  /<button class="p-1 -ml-1" aria-label="Volver">/.test(hCu) && tCu.includes('Cuidado'));
const orden = ['Higiene', 'Barba', 'Skincare'].map((n) => tCu.findIndex((x) => x === n || x === `⚪ ${n}`));
comprobar('B4: enseña sus apartados activos en el orden que él eligió', orden.every((p, i) => p >= 0 && (i === 0 || p > orden[i - 1])),
  JSON.stringify(orden));
comprobar('B4: cada uno con su plaquita de siempre, y se puede abrir',
  (hCu.match(/<button class="rounded-2xl p-2\.5 flex items-center gap-2 text-left w-full"/g) || []).length === 3);
comprobar('B4: los apagados aparecen aparte, «Sin activar»…', tCu.includes('Sin activar') && tCu.includes('Cuidado corporal') && tCu.includes('Sonrisa'));
comprobar('B4: …cada uno con su botón «Activar»',
  /aria-label="Activar Cuidado corporal"/.test(hCu) && /aria-label="Activar Sonrisa"/.test(hCu));
eCu = alternarOculto(eCu, 'skincare');
const hOc = pintaCat(eCu, 'cuidado');
const tOc = textos(hOc);
comprobar('B4: un apartado oculto (F36) no se pinta como plaquita',
  !tOc.slice(0, tOc.findIndex((x) => x.startsWith('Ocultos'))).some((x) => x === 'Skincare' || x === '⚪ Skincare'));
comprobar('B4: …pero se dice que está, que sigue funcionando y dónde se vuelve a mostrar',
  hOc.replace(/<!-- -->/g, '').includes('Ocultos: Skincare. Siguen funcionando; se vuelven a mostrar desde Gestionar apartados.'));
comprobar('B4: oculto y desactivado son dos listas distintas', !/aria-label="Activar Skincare"/.test(hOc));
comprobar('B4: ningún botón dentro de otro en Cuidado', !botonDentroDeBoton(hOc));

// Funcionamiento: lo que no tiene pantalla lo dice y no se toca (decisión G).
const hFu = pintaCat(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['gustos', 'progreso', 'educacion', 'productos']), 'funcionamiento');
const tFu = textos(hFu);
comprobar('B4: Funcionamiento enseña Mis gustos, Progreso, Educación y Productos',
  ['Mis gustos', 'Progreso', 'Educación', 'Productos'].every((n) => tFu.some((x) => x === n || x === `⚪ ${n}`)));
comprobar('B4: Mis gustos se puede abrir', (hFu.match(/<button class="rounded-2xl p-2\.5/g) || []).length === 1);
comprobar('B4: Progreso, Educación y Productos dicen «Todavía no tiene pantalla propia»…',
  (tFu.filter((x) => x === 'Todavía no tiene pantalla propia')).length === 3);
comprobar('B4: …y no simulan abrir nada (no son botones)', (hFu.match(/<div class="rounded-2xl p-2\.5 flex items-center gap-2"/g) || []).length === 3);

// Sin nada activo: lo dice y ofrece activar sus cinco apartados.
const hVacia = pintaCat(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, []), 'cuidado');
comprobar('B4: una categoría sin nada activo lo dice', /Todavía no tienes ningún apartado activado aquí\./.test(hVacia));
comprobar('B4: …y ofrece activar sus cinco apartados', (hVacia.match(/aria-label="Activar /g) || []).length === 5);
comprobar('B4: CategoriaEH sin contenido no pinta nada', renderToString(<CategoriaEH contenido={null} accent={accent} />) === '');

/* ── 10 · 🔓 B5 — LOS BLOQUES, EN FUNCIONAMIENTO ───────────────────────────── */
/* La pantalla de Funcionamiento solo se abre con un toque (estado interno), y
   react-dom/server no toca. Así que aquí se comprueba el CÓDIGO —qué pinta cada
   sitio— y el recorrido de Chromium comprueba que se ven y funcionan. */
// smoke.mjs empaqueta la prueba en node_modules/.cache: se lee desde la raíz.
const fuente = readFileSync(join(process.cwd(), 'src/views/EstiloHombreView.jsx'), 'utf8');
const trozo = (desde, hasta) => {
  const i = fuente.indexOf(desde);
  const f = fuente.indexOf(hasta, i + desde.length);
  return i >= 0 && f > i ? fuente.slice(i, f) : '';
};
const enFunc = trozo('const bloquesFuncionamiento = (', '\n  );\n');
const listaOrd = trozo('const listaOrdenar = (', '\n  );\n');
// La portada es el último `return (` del componente principal.
const iPortada = fuente.lastIndexOf("  return (\n    <div className=\"space-y-3\">");
const portadaSrc = iPortada >= 0 ? fuente.slice(iPortada) : '';
const BLOQUES_B5 = [
  ['Mi estilo personal (F29)', 'miEstiloPanel.titulo'],
  ['…y su «mostrar» si está oculto', 'mostrarMiEstilo(estado)'],
  ['Ideas (F32)', '<IdeasEH'],
  ['Mi progreso (F35)', '<ProgresoEH'],
  ['Descubrir (F33)', '<DescubrirEH'],
  ['Personalizar (F31)', 'setPersonalizando(true)'],
  ['Ordenar (F2)', 'setOrdenando((v) => !v)'],
  ['las recomendaciones para activar apartados', '<Recomendados'],
];
comprobar('B5: existe el bloque de Funcionamiento y la portada', enFunc.length > 500 && portadaSrc.length > 500);
for (const [nombre, marca] of BLOQUES_B5) {
  const veces = fuente.split(marca).length - 1;
  comprobar(`B5: ${nombre} está en Funcionamiento`, enFunc.includes(marca));
  comprobar(`B5: ${nombre} ya no está en la portada`, !portadaSrc.includes(marca));
}
// Un único acceso: en todo el componente principal cada bloque sale UNA vez (fuera
// de Funcionamiento solo cuentan otros componentes que ya lo tenían antes de B5).
const principal = fuente.slice(fuente.indexOf('export default function EstiloHombreView'));
for (const [nombre, marca] of [['Ideas', '<IdeasEH'], ['Mi progreso', '<ProgresoEH'], ['Descubrir', '<DescubrirEH'],
  ['Recomendados', '<Recomendados'], ['Ordenar', 'setOrdenando((v) => !v)'], ['Mi estilo personal', 'miEstiloPanel.titulo']]) {
  comprobar(`B5: «${nombre}» tiene un único acceso`, principal.split(marca).length - 1 === 1);
}
comprobar('B5: «⋮ Personalizar» tiene un único botón en la vista principal',
  principal.split('{TEXTOS_PANTALLA.personalizar}').length - 1 === 1);
comprobar('B5: los bloques se mudan con sus condiciones de siempre (también `!ordenando`)',
  (enFunc.match(/!ordenando/g) || []).length >= 6 && enFunc.includes('hayQueOrdenar(estado)'));
comprobar('B5: la lista de Ordenar se muda también, con sus flechas (dentro de cada grupo)',
  /subirEnSuCategoria\(estado, m\.id\)/.test(listaOrd) && /bajarEnSuCategoria/.test(listaOrd) && /gruposParaOrdenar/.test(listaOrd));
comprobar('B5: la lista de Ordenar ya no se pinta en la portada', !portadaSrc.includes('EnSuCategoria(estado, m.id)'));
comprobar('B5: Funcionamiento recibe los bloques y la lista; Cuidado, no',
  /extras=\{contenidoCategoria\.id === 'funcionamiento' \? bloquesFuncionamiento : null\}/.test(fuente)
  && /cuerpo=\{contenidoCategoria\.id === 'funcionamiento' && ordenando \? listaOrdenar : null\}/.test(fuente));
comprobar('B5: salir de la categoría termina el modo Ordenar', /onCerrar=\{\(\) => \{ setCategoria\(null\); setOrdenando\(false\); \}\}/.test(fuente));
// «⚙️ Gestionar apartados» (F1, apartado 6): el botón de siempre se muda. En la
// portada solo queda el de la tarjeta de vacío (F2, apartado 10), que sale cuando
// no hay ni un apartado activo; está señalado como pendiente de decisión.
const BOTON_GESTIONAR = '<Settings size={12} /> Gestionar apartados';
comprobar('B5: el botón «Gestionar apartados» (F1, apartado 6) está en Funcionamiento', enFunc.includes(BOTON_GESTIONAR));
comprobar('B5: …y ya no está en la portada', !portadaSrc.includes(BOTON_GESTIONAR));
comprobar('B5: …un único botón así en la vista principal', principal.split(BOTON_GESTIONAR).length - 1 === 1);
const iVacio = portadaSrc.indexOf('TEXTOS_GESTION.vacioAccion');
comprobar('B5: en la portada solo queda el de la tarjeta de vacío (sin apartados activos)',
  portadaSrc.split('setGestionando(true)').length - 1 === 1 && iVacio > 0
  && portadaSrc.lastIndexOf('setGestionando(true)', iVacio) > portadaSrc.lastIndexOf("pantalla === 'sin_modulos' ? (", iVacio));
comprobar('B5: con apartados activos, la portada pintada no tiene ningún «Gestionar apartados»', !/Gestionar apartados/.test(hTodos));
comprobar('B5: el aviso de apartados sin pantalla se queda en la portada', portadaSrc.includes('TEXTOS_PANTALLA.algunosSinPantalla'));

// CategoriaEH pinta `extras` debajo y `cuerpo` en el sitio de las plaquitas.
const contFu = contenidoDeCategoria(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['gustos']), 'funcionamiento', { armario: ARM });
const hExtra = renderToString(<CategoriaEH contenido={contFu} accent={accent} onAbrir={noop} onActivar={noop} onCerrar={noop}
  extras={<p>BLOQUES-B5</p>} />);
comprobar('B5: CategoriaEH pinta los bloques extra debajo de los apartados',
  hExtra.includes('BLOQUES-B5') && hExtra.indexOf('BLOQUES-B5') > hExtra.indexOf('data-categoria-eh="funcionamiento"'));
const hCuerpo = renderToString(<CategoriaEH contenido={contFu} accent={accent} onAbrir={noop} onActivar={noop} onCerrar={noop}
  extras={<p>BLOQUES-B5</p>} cuerpo={<p>ORDENANDO</p>} />);
comprobar('B5: mientras se ordena, la lista ocupa el sitio de las plaquitas',
  hCuerpo.includes('ORDENANDO') && !hCuerpo.includes('data-categoria-eh=') && hCuerpo.includes('BLOQUES-B5'));
comprobar('B5: sin extras, Cuidado se pinta como en B4', !pintaCat(eCu, 'cuidado').includes('BLOQUES-B5'));

/* ── 11 · 🔓 B5 (decisión A) — tamaño solo donde tiene efecto ──────────────── */
const FIJAS = ['estilo', 'pelo', 'perfumes', 'accesorios'];
const TEXTOS_MOVER_B5 = TEXTOS_MOVER.mover;   // «⋮⋮ Mover»
comprobar('A: Ropa, Pelo, Fragancia y Accesorios tienen tarjeta fija', FIJAS.every(tieneTarjetaFija));
comprobar('A: los apartados de Cuidado y Funcionamiento no (su tamaño sí se ve dentro)',
  ['higiene', 'barba', 'skincare', 'sonrisa', 'cuerpo', 'gustos', 'progreso', 'educacion', 'productos'].every((id) => !tieneTarjetaFija(id)));
comprobar('A: Fitness, Sueño, Salud y Hábitos tampoco', ['fitness', 'sueno', 'salud', 'habitos'].filter((id) => IDS_EH.includes(id)).every((id) => !tieneTarjetaFija(id)));
let eA = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['estilo', 'pelo', 'perfumes', 'accesorios', 'barba']);
eA = cambiarTamano(eA, 'pelo', 'grande');      // un tamaño guardado ANTES de B5
const guardadoAntes = JSON.stringify(eA);
const pp = panelPersonalizar(eA, { armario: ARM });
const filaDe = (id) => pp.modulos.find((m) => m.id === id);
comprobar('A: panelPersonalizar marca las fijas', FIJAS.every((id) => filaDe(id) && filaDe(id).tarjetaFija === true));
comprobar('A: …y no las demás', filaDe('barba') && filaDe('barba').tarjetaFija === false);
comprobar('A: el tamaño guardado de Pelo sigue ahí (no se borra ni se cambia)',
  filaDe('pelo').tamano.id === 'grande' && tamanoDe(eA, 'pelo').id === 'grande');
comprobar('A: pintar Personalizar no toca lo guardado', JSON.stringify(eA) === guardadoAntes);
const hPers = renderToString(<PersonalizarPlaquitas estado={eA} accent={accent} armario={ARM} onCambiar={noop} onCerrar={noop}
  onGestionar={noop} onAvisos={noop} onIntegracion={noop} onComoFunciona={noop} onPrivacidad={noop} />);
// Los botones de tamaño se reconocen por su texto: «▫️ Pequeña», «◻️ Mediana», «⬜ Grande».
const nTamanos = (hPers.replace(/<!-- -->/g, '').match(/>(▫️ Pequeña|◻️ Mediana|⬜ Grande)<\/button>/g) || []).length;
const marcas = (hPers.match(/data-tarjeta-fija="([a-z]+)"/g) || []).map((x) => x.split('"')[1]);
comprobar('A: Personalizar dice, en las cuatro fijas, que su tarjeta es de tamaño fijo',
  FIJAS.every((id) => marcas.includes(id)) && marcas.length === 4, JSON.stringify(marcas));
comprobar('A: …con el texto acordado', (hPers.split(TEXTOS_PANTALLA.tarjetaFija).length - 1) === 4);
comprobar('A: …y solo Barba (de Cuidado) ofrece los tres botones de tamaño', nTamanos === 3 && !hPers.includes('data-tarjeta-fija="barba"'),
  `botones de tamaño: ${nTamanos}`);
comprobar('A: «Configurar contenido» se sigue ofreciendo en los cinco (también en las fijas)',
  hPers.split(TEXTOS_PANTALLA.configurarContenido).length - 1 === 5);

/* ── 12 · 🔓 B5 (corrección) — decisión B y el orden, solo donde se ve ─────── */
const ordenIds = (e) => modulosActivos(e).map((m) => m.id);
// Una tarjeta fija EN MEDIO de los de Cuidado: estilo entre higiene y barba.
let eO = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['higiene', 'estilo', 'barba', 'pelo', 'skincare', 'gustos', 'progreso', 'perfumes', 'accesorios']);
eO = cambiarTamano(eO, 'barba', 'grande');
eO = alternarOculto(eO, 'skincare');
const fotoO = JSON.stringify(eO);
comprobar('Orden: las cuatro tarjetas fijas no se mueven (son las únicas de su grupo)',
  FIJAS.every((id) => puedeMoverEnSuCategoria(eO, id).mueve === false));
comprobar('Orden: …y pedirles subir o bajar no cambia nada guardado',
  FIJAS.every((id) => JSON.stringify(subirEnSuCategoria(eO, id)) === JSON.stringify(bajarEnSuCategoria(eO, id))
    && ordenIds(subirEnSuCategoria(eO, id)).join() === ordenIds(eO).join()));
comprobar('Orden: los de Cuidado sí se mueven entre ellos', puedeMoverEnSuCategoria(eO, 'barba').mueve
  && puedeMoverEnSuCategoria(eO, 'barba').de === 3 && puedeMoverEnSuCategoria(eO, 'barba').posicion === 1);
const tras = subirEnSuCategoria(eO, 'barba');
const cuidadoDe = (e) => ordenIds(e).filter((id) => ['higiene', 'barba', 'skincare', 'sonrisa', 'cuerpo'].includes(id));
comprobar('Orden: subir Barba la pone delante de Higiene de un solo toque (salta la tarjeta fija de en medio)',
  cuidadoDe(tras).join() === 'barba,higiene,skincare', cuidadoDe(tras).join());
comprobar('Orden: …y las demás no cambian de orden entre ellas',
  ordenIds(tras).filter((id) => !['barba', 'higiene'].includes(id)).join() === ordenIds(eO).filter((id) => !['barba', 'higiene'].includes(id)).join());
comprobar('Orden: mover no toca nada más de lo guardado (config, oculto, tamaños, activos)', (() => {
  const a = JSON.parse(fotoO); const b = JSON.parse(JSON.stringify(tras));
  const sinOrden = (e) => ({ ...e, modulos: e.modulos.map(({ orden, ...m }) => m) });
  return JSON.stringify(sinOrden(a)) === JSON.stringify(sinOrden(b));
})());
comprobar('Orden: los de Funcionamiento, entre ellos', cuidadoDe(bajarEnSuCategoria(eO, 'gustos')).join() === cuidadoDe(eO).join()
  && ordenIds(bajarEnSuCategoria(eO, 'gustos')).filter((id) => ['gustos', 'progreso'].includes(id)).join() === 'progreso,gustos');
comprobar('Orden: «Mover» a un sitio de su grupo', cuidadoDe(moverAEnSuCategoria(eO, 'higiene', 2)).join() === 'barba,skincare,higiene');
comprobar('Orden: un sitio fuera de su grupo no hace nada', JSON.stringify(moverAEnSuCategoria(eO, 'higiene', 7)) === JSON.stringify(eO)
  && JSON.stringify(moverAEnSuCategoria(eO, 'pelo', 0)) === JSON.stringify(eO));
comprobar('Orden: pintar y calcular no tocan lo guardado', JSON.stringify(eO) === fotoO);
const grupos = gruposParaOrdenar(eO);
comprobar('Orden: la lista de Ordenar va por grupos y solo con los que tienen con quién ordenarse',
  grupos.map((g) => g.id).join() === 'cuidado,funcionamiento', grupos.map((g) => g.id).join());
comprobar('Orden: sin dos apartados en un mismo grupo no se ofrece «Ordenar»',
  !hayQueOrdenar(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['estilo', 'pelo', 'perfumes', 'accesorios', 'barba', 'gustos']))
  && hayQueOrdenar(eO));

// Personalizar (F31)
const hP2 = renderToString(<PersonalizarPlaquitas estado={eO} accent={accent} armario={ARM} onCambiar={noop} onCerrar={noop}
  onGestionar={noop} onAvisos={noop} onIntegracion={noop} onComoFunciona={noop} onPrivacidad={noop} />);
comprobar('Personalizar: ni flechas ni «Mover» en las cuatro tarjetas fijas',
  FIJAS.every((id) => !hP2.includes(`aria-label="Subir ${moduloEH(id).nombre}"`) && !hP2.includes(`aria-label="Bajar ${moduloEH(id).nombre}"`)));
const sinOrdenP = (hP2.match(/data-sin-orden="([a-z]+)"/g) || []).map((x) => x.split('"')[1]);
comprobar('Personalizar: …y en su lugar dice que su tarjeta tiene un sitio fijo',
  FIJAS.every((id) => sinOrdenP.includes(id)) && (hP2.split(TEXTOS_PANTALLA.ordenFijo).length - 1) === 4, JSON.stringify(sinOrdenP));
comprobar('Personalizar: Higiene, Barba, Skincare, Mis gustos y Progreso conservan sus flechas',
  ['Higiene', 'Barba', 'Skincare', 'Mis gustos', 'Progreso'].every((n) => hP2.includes(`aria-label="Subir ${n}"`) && hP2.includes(`aria-label="Bajar ${n}"`)));
comprobar('Personalizar: «Mover» solo en los cinco que se pueden mover',
  (hP2.replace(/<!-- -->/g, '').match(new RegExp(`>${TEXTOS_MOVER_B5}</button>`, 'g')) || []).length === 5);
comprobar('Personalizar: «👁️ Quitar» se conserva en todos (desactiva: tiene efecto también en las fijas)',
  (hP2.match(/👁️ Quitar/g) || []).length === 9);

// Gestionar apartados (F36)
const pintaGE = (e) => renderToString(<GestionarEstiloEH estado={e} accent={accent} onCambiar={noop} onCerrar={noop} />);
const hG = pintaGE(eO);
const filaG = (h, nombre) => {
  const i = h.indexOf(`>${nombre}</span>`);
  const f = h.indexOf('data-flip-id=', i);
  return i >= 0 ? h.slice(i, f > i ? f : undefined) : '';
};
comprobar('Gestionar: las cuatro tarjetas fijas no ofrecen «Ocultar» (decisión B)',
  FIJAS.every((id) => !filaG(hG, moduloEH(id).nombre).includes('👁️ Ocultar')), FIJAS.map((id) => filaG(hG, moduloEH(id).nombre).length).join());
comprobar('Gestionar: …y dicen por qué', (hG.match(/data-sin-ocultar="/g) || []).length === 4);
comprobar('Gestionar: …pero siguen pudiendo desactivarse', FIJAS.every((id) => filaG(hG, moduloEH(id).nombre).includes('Desactivar')));
comprobar('Gestionar: Higiene y Barba conservan «Ocultar»; Skincare (oculto), «Mostrar»',
  filaG(hG, 'Higiene').includes('👁️ Ocultar') && filaG(hG, 'Barba').includes('👁️ Ocultar') && filaG(hG, 'Skincare').includes('👁️ Mostrar'));
comprobar('Gestionar: sin flechas en las fijas; con flechas en Cuidado',
  FIJAS.every((id) => !hG.includes(`aria-label="Subir ${moduloEH(id).nombre}"`)) && hG.includes('aria-label="Subir Barba"'));
// Una fija oculta de ANTES (guardado): no se borra, y se ofrece «Mostrar», que sí tiene efecto.
const eOcultaAntes = alternarOculto(eO, 'pelo');
comprobar('Gestionar: Pelo oculto desde antes conserva su valor guardado', eOcultaAntes.modulos.find((m) => m.id === 'pelo').oculto === true);
comprobar('Gestionar: …y se le ofrece «Mostrar» (lo devuelve a «Mi estilo personal»)', filaG(pintaGE(eOcultaAntes), 'Pelo').includes('👁️ Mostrar'));

/* ── 13 · El acceso rápido «🧴 Rutina facial» abre la rutina directamente ───── */
{
  const { ACCESOS_DISPONIBLES } = await import('../src/lib/pantallaEH.js');
  const { PanelPiel, SkincareEH } = await import('../src/views/EstiloHombreView.jsx');
  const { alternarPartePiel } = await import('../src/lib/rutinasPiel.js');
  const rf = ACCESOS_DISPONIBLES.find((a) => a.id === 'rutina_facial');
  comprobar('Acceso: «Rutina facial» declara Skincare y su zona «rutina»', rf && rf.modulo === 'skincare' && rf.zona === 'rutina');
  comprobar('Acceso: la portada pasa la zona al abrir un acceso rápido', fuente.includes('onClick={() => abrirModulo(a.modulo, a.zona)}'));
  comprobar('Acceso: Skincare se abre en su rutina solo si la zona es «rutina»',
    fuente.includes("if (id === MODULO_PIEL) return setSkincare(zona === 'rutina' ? 'rutina' : true);")
    && fuente.includes("zonaInicial={skincare === 'rutina' ? 'rutina' : null}"));
  comprobar('Acceso: las demás llamadas a abrirModulo no cambian (zona por defecto, null)', fuente.includes('const abrirModulo = (id, zona = null) => {'));
  let ePiel = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare']);
  ePiel = { ...ePiel, modulos: ePiel.modulos.map((m) => (m.id === 'skincare' ? { ...m, config: { necesidadesPiel: 'hidratacion', complejidadPiel: 'basico' } } : m)) };
  const enRutina = (h) => /<p class="text-sm font-semibold"[^>]*>🧴 Mi rutina<\/p>/.test(h);
  const hPanel = renderToString(<PanelPiel estado={ePiel} accent={accent} onCambiar={noop} onCerrar={noop} />);
  const hDirecto = renderToString(<PanelPiel estado={ePiel} accent={accent} onCambiar={noop} onCerrar={noop} zonaInicial="rutina" />);
  comprobar('Acceso: sin zona, Skincare abre su panel (como siempre)', !enRutina(hPanel) && /Mi piel/.test(hPanel));
  comprobar('Acceso: con la zona «rutina», abre directamente «🧴 Mi rutina» (RutinasPielEH)', enRutina(hDirecto) && !/Mi piel/.test(hDirecto));
  const sinRutinas = alternarPartePiel(ePiel, 'rutinas');
  comprobar('Acceso: con las rutinas de Skincare apagadas, no salta a una pantalla que no se ofrece: abre el panel',
    !enRutina(renderToString(<PanelPiel estado={sinRutinas} accent={accent} onCambiar={noop} onCerrar={noop} zonaInicial="rutina" />)));
  comprobar('Acceso: SkincareEH configurado pasa la zona y abre la rutina',
    enRutina(renderToString(<SkincareEH estado={ePiel} accent={accent} onCambiar={noop} onCerrar={noop} zonaInicial="rutina" />)));
  const sinPerfil = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare']);
  comprobar('Acceso: sin configurar, primero su entrada de siempre (no se salta la configuración)',
    !enRutina(renderToString(<SkincareEH estado={sinPerfil} accent={accent} onCambiar={noop} onCerrar={noop} zonaInicial="rutina" />)));
}

console.log('');
if (fallos) { console.error(`═══ ${fallos} PRUEBA(S) FALLIDA(S) de ${total} ═══\n`); process.exit(1); }
console.log(`═══ TODAS LAS PRUEBAS PASAN (${total}) ═══\n`);
