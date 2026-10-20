// ---------------------------------------------------------------------------
// FASE 1C — lo que se VE de las correcciones, pintado de verdad con react-dom/server.
//
//   · Imagen personal → «Mis datos»: con entrenamientos SOLO en Fitness dice cuántos y que
//     vienen de Fitness; sin ninguno dice que falta y ofrece «Abrir Fitness» (una sección que
//     existe), nunca «Calistenia».
//   · Progreso → Logros: «Primer PR» pide algo que se puede hacer; con un récord en Fitness sale
//     conseguido; con el PR de calistenia de antes sigue conseguido; el total es siempre 12.
//   · Estadísticas → «Entrenar y ánimo»: con el registro interrumpido no enseña una diferencia
//     inventada y dice cuántos días deja fuera.
//
// Lo que NO se puede comprobar aquí: el toque en «Abrir Fitness» (renderToString no ejecuta
// manejadores; el cableado se comprueba en `test-correcciones-1c.mjs`) y el cambio de día a
// medianoche (renderToString no ejecuta efectos).
// ---------------------------------------------------------------------------
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MisDatosEH } from '../src/views/EstiloHombreView.jsx';
import AchievementsView from '../src/views/AchievementsView.jsx';
import StatsView from '../src/views/StatsView.jsx';
import { ACCENTS } from '../src/tokens.js';
import { DEFAULT_ESTILO_HOMBRE } from '../src/lib/estiloDeHombre.js';
import { empezarSesion, editarSerie, marcarSerie, ejerciciosDeSesion, normalizarFitnessConSesiones } from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { addDays } from '../src/lib/helpers.js';

const accent = ACCENTS[0].value;
const noop = () => {};
let pasa = 0;
let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) { pasa++; console.log(`  ✓ ${nombre}`); } else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};
/* El texto que se lee, sin etiquetas ni comentarios de React. */
const texto = (html) => html.replace(/<!--.*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');

function entrenamiento(fecha, reps = 8) {
  let r = crearRutina({ nombre: 'Tirón' });
  r = anadirEjercicio(r, 'dominada-prona');
  r = editarLinea(r, r.lineas[0].id, { series: 1, tipoCarga: 'corporal' });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: 'Tirón', lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  s = editarSerie(s, e.id, e.series[0].id, { reps });
  s = marcarSerie(s, e.id, e.series[0].id, true);
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3000000 }), { confirmado: true, ahora: inicio + 3001000 }).sesion;
}
const conSesiones = (sesiones) => normalizarFitnessConSesiones({ ...DEFAULT_FITNESS, sesiones });

/* ── 1. Imagen personal → Mis datos ─────────────────────────────────────── */
console.log('\n── 1. Imagen personal · «Tu entrenamiento» en Mis datos ──');
{
  const soloFitness = { perfil: { nombre: 'Josué' }, fitness: conSesiones([entrenamiento('2026-10-01'), entrenamiento('2026-10-03')]) };
  const t = texto(renderToString(<MisDatosEH estado={DEFAULT_ESTILO_HOMBRE} accent={accent} datosGlobales={soloFitness} onCambiar={noop} onCerrar={noop} onIr={noop} />));
  comprobar('🚨 Solo con Fitness: «Tu entrenamiento · 2 entrenamientos completados en Fitness»',
    /Tu entrenamiento\s+2 entrenamientos completados en Fitness/.test(t), t.slice(0, 400));
  comprobar('…con «Fitness» como origen, y ni rastro de «Calistenia»', /Fitness/.test(t) && !/Calistenia/.test(t));

  const vacio = texto(renderToString(<MisDatosEH estado={DEFAULT_ESTILO_HOMBRE} accent={accent} datosGlobales={{ perfil: { nombre: 'Josué' } }} onCambiar={noop} onCerrar={noop} onIr={noop} />));
  comprobar('🚨 Sin entrenamientos: dice que falta y ofrece «Abrir Fitness»',
    /Tu entrenamiento\s+Todavía no tienes esta información\.\s+Abrir Fitness/.test(vacio), vacio.slice(0, 400));
  comprobar('…y no manda a «Calistenia», que ya no existe', !/Calistenia/.test(vacio));
  const sinNavegar = texto(renderToString(<MisDatosEH estado={DEFAULT_ESTILO_HOMBRE} accent={accent} datosGlobales={{}} onCambiar={noop} onCerrar={noop} />));
  comprobar('Sin a dónde navegar (`onIr`), no se pinta un botón que no haría nada: se dice «Fitness»',
    !/Abrir Fitness/.test(sinNavegar) && /Tu entrenamiento\s+Todavía no tienes esta información\.\s+Fitness/.test(sinNavegar));

  const antes = { calistenia: { planche: { sesiones: [{ fecha: '2026-09-12' }] } } };
  const tAntes = texto(renderToString(<MisDatosEH estado={DEFAULT_ESTILO_HOMBRE} accent={accent} datosGlobales={antes} onCambiar={noop} onCerrar={noop} onIr={noop} />));
  comprobar('Solo con la calistenia de antes: «Calistenia de antes: 1 día registrado, el último el 12 septiembre 2026» (historia, con su fecha)',
    /Calistenia de antes: 1 día registrado, el último el 12 septiembre 2026/.test(tAntes), tAntes.slice(0, 400));
}

/* ── 2. Progreso → Logros ───────────────────────────────────────────────── */
console.log('\n── 2. Logros · «Primer PR» se puede conseguir ──');
const pintarLogros = (props) => texto(renderToString(<AchievementsView accent={accent} {...props} />));
{
  const nueva = pintarLogros({});
  comprobar('🚨 Cuenta nueva: «0 de 12 insignias» y «Primer PR» pide superar una marca en Fitness',
    /0 de 12 insignias/.test(nueva) && /Primer PR\s+Supera tu mejor marca en un ejercicio de Fitness/.test(nueva), nueva.slice(0, 300));
  comprobar('…ninguna insignia pide un récord de calistenia', !/récord personal de calistenia/i.test(nueva));

  const record = pintarLogros({ fitness: conSesiones([entrenamiento('2026-10-01', 8), entrenamiento('2026-10-03', 9)]) });
  comprobar('🚨 Con un récord en Fitness (8 → 9 repeticiones): «1 de 12» y «Primer PR» conseguido',
    /1 de 12 insignias/.test(record) && /Primer PR/.test(record), record.slice(0, 300));
  const sinRecord = pintarLogros({ fitness: conSesiones([entrenamiento('2026-10-01', 8), entrenamiento('2026-10-03', 8)]) });
  comprobar('…repetir la misma marca no lo consigue: «0 de 12»', /0 de 12 insignias/.test(sinRecord));

  const historico = pintarLogros({ calistenia: { planche: { prs: [{ valor: '30s hold' }] } } });
  comprobar('🚨 Con el PR de calistenia de antes: conservado — «1 de 12» y «Registraste un récord personal de calistenia»',
    /1 de 12 insignias/.test(historico) && /Primer PR\s+Registraste un récord personal de calistenia/.test(historico), historico.slice(0, 300));
}

/* ── 3. Estadísticas → Entrenar y ánimo ─────────────────────────────────── */
console.log('\n── 3. Estadísticas · un registro interrumpido no inventa una diferencia ──');
{
  const dias = ['2026-06-01', '2026-06-03', '2026-06-05', '2026-06-08', '2026-06-10', '2026-06-12'];
  const fitness = conSesiones(dias.map((f) => entrenamiento(f)));
  const entradas = [];
  for (let f = '2026-06-01'; f <= '2026-10-18'; f = addDays(f, 1)) entradas.push({ id: f, fecha: f, animo: f <= '2026-06-14' ? 4 : 3 });
  const t = texto(renderToString(<StatsView sueno={[]} estudios={{ horas: [] }} diario={{ entradas }} calistenia={{}} fitness={fitness} accent={accent} />));
  comprobar('🚨 «Días con entrenamiento (6)» y «Días sin entrenamiento (6)», no 134',
    /Días con entrenamiento \(6\)/.test(t) && /Días sin entrenamiento \(6\)/.test(t), t.slice(0, 500));
  comprobar('…con el mismo ánimo en los dos grupos (4 y 4): la diferencia inventada no aparece',
    (t.match(/4 \/5 de ánimo medio/g) || []).length === 2 && !/3\.1 \/5|3,1 \/5/.test(t));
  comprobar('…y dice qué compara y que 128 días de Diario se quedan fuera',
    /Solo compara las semanas en las que registraste algún entrenamiento/.test(t) && /128 días de Diario se quedan fuera por eso/.test(t));
  comprobar('…sin afirmar que una cosa cause la otra', /no dice que una cosa cause la otra/.test(t));
}

console.log(`\n  ${fallos === 0 ? '✓' : '✗'} Lo que se ve de la Fase 1C — ${pasa} comprobaciones${fallos ? `, ${fallos} FALLOS` : ''}\n`);
process.exit(fallos === 0 ? 0 : 1);
