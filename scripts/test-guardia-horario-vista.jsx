// ---------------------------------------------------------------------------
// 🛡 HORARIOS · A-BIS — LO QUE SE VE DE LA GUARDIA, pintado de verdad con react-dom/server: los tres avisos de
// solo lectura (§8) y la pantalla de consulta (§10) en cada estado. Datos DE PRUEBA, construidos aquí.
// ---------------------------------------------------------------------------
import React from 'react';
import { renderToString } from 'react-dom/server';
import HorarioView from '../src/views/HorarioView.jsx';
import { ACCENTS } from '../src/tokens.js';
import { AvisoSoloLecturaHorario, DiagnosticoHorariosEntrada } from '../src/components/diagnosticoHorarioPanel.jsx';
import { AvisoGuardiaHorario, ConsultaGuardiaHorario, ConsultaGuardiaHorarioEntrada } from '../src/components/guardiaHorarioPanel.jsx';
import { crearGuardiaDeHorario, MOTIVOS_BLOQUEO_GUARDIA } from '../src/lib/guardiaHorario.js';
import { crearDesdePlantilla } from '../src/lib/horarioEditor.js';
import { DEFAULT_HORARIO_TOP } from '../src/lib/horario.js';

const accent = ACCENTS[0].value;
let pasa = 0; let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) { pasa++; console.log(`  ✓ ${nombre}`); } else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};
const texto = (h) => h.replace(/<!--.*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const roto = (t) => /\bNaN\b|\bundefined\b|\bnull\b|\[object Object\]|Invalid Date|Infinity/.test(t);

console.log('\n── Los tres avisos de la guardia ──');
for (const [m, esperado, boton] of [
  [MOTIVOS_BLOQUEO_GUARDIA.comprobando, 'Comprobando tu horario', false],
  [MOTIVOS_BLOQUEO_GUARDIA.noVerificable, 'No se ha podido comprobar tu horario', true],
  [MOTIVOS_BLOQUEO_GUARDIA.incidencia, 'todavía no se ha podido apuntar en tu cuenta', true],
]) {
  const h = renderToString(<AvisoGuardiaHorario motivo={m} accent={accent} guardia={{ motivo: 'lectura_guardia' }} onReintentar={() => {}} />);
  const t = texto(h);
  comprobar(`${m}: dice «${esperado}»`, t.includes(esperado), t);
  comprobar(`${m}: ${boton ? 'ofrece' : 'no ofrece'} «Reintentar»`, t.includes('Reintentar') === boton);
  comprobar(`${m}: nunca «Recargar» (no es una versión más nueva)`, !t.includes('Recargar') && !t.includes('versión más nueva de JosStyle'));
  comprobar(`${m}: es un role="status"`, /role="status"/.test(h));
  comprobar(`${m}: nada roto a la vista`, !roto(t), t);
}
{
  const t = texto(renderToString(<AvisoGuardiaHorario motivo={MOTIVOS_BLOQUEO_GUARDIA.noVerificable} accent={accent} guardia={{ motivo: 'horario_sin_cargar' }} onReintentar={() => {}} />));
  comprobar('No verificable: dice por qué (horario sin cargar)', t.includes('Tu horario no se ha podido cargar'), t);
  const a = texto(renderToString(<AvisoSoloLecturaHorario motivo="version_futura" accent={accent} onRecargar={() => {}} />));
  comprobar('El aviso de la entrega A sigue igual (versión más nueva + Recargar)', a.includes('versión más nueva') && a.includes('Recargar'));
}

console.log('\n── La pantalla de consulta, en cada estado ──');
const servidorDe = (filas, horario) => ({
  leerTodas: async () => ({ ok: true, filas }),
  leerPropia: async (_u, k) => { const f = filas.find((x) => x.key === k); return { ok: true, existe: !!f, valor: f ? f.value : null }; },
  insertar: async () => ({ ok: true }),
  actualizarSiBase: async () => ({ ok: true, aplicada: true }),
  leerHorario: async () => ({ ok: true, existe: horario !== undefined, valor: horario ?? null }),
});
const fila = (ap, extra = {}) => ({ key: `horarioGuardia:${ap}`, value: { formato: 1, aparato: ap, secuencia: 2, ultimaOperacion: 'o', primeraVezA: { en: '2026-11-01T10:00:00Z', versionApp: '3.162.0' }, etiqueta: null, visitas: { '3.162.0': { primera: { fecha: '2026-11-01' }, ultima: { fecha: '2026-11-10', en: '2026-11-10T10:00:00Z' } } }, testigo: { intenciones: [], ...(extra.testigo || {}) }, detecciones: extra.detecciones || [], retiradas: [], resoluciones: [] } });
const HT = { horarios: [], bloques: [], actividades: [], excepciones: [] };
const dem = { visto: { primera: { revision: 'r0' }, ultima: { revision: 'r0', conocidas: [] } } };
const escenarios = [
  ['E2', [], { ...HT }, 'Inicial'],
  ['AI', [fila('Y', { testigo: { intenciones: [{ id: 'i1' }] } })], { ...HT }, 'Arranque incompleto'],
  ['E1', [fila('Y', { testigo: dem })], { ...HT, version: 1, testigo: { formato: 1, revision: 'r1' } }, 'Testigo demostrado'],
  ['B', [fila('Y', { testigo: dem })], { ...HT }, 'Falta un testigo demostrado'],
  ['C', [fila('Y', { testigo: dem })], { ...HT, version: 1 }, 'Situación ambigua'],
  ['no_verificable', [{ key: 'horarioGuardia:Y', value: { formato: 9 } }], { ...HT }, 'versión más nueva de la comprobación'],
];
for (const [esperado, filas, horario, rotulo] of escenarios) {
  const g = crearGuardiaDeHorario({ transporte: servidorDe(filas, horario), usuario: 'u', aparato: 'X', candado: null, versionApp: '3.162.0' });
  await g.comprobar({});
  await g.esperar();
  const v = g.vista();
  comprobar(`${esperado}: la guardia llega a su estado`, v.estado === esperado, v.estado);
  const h = renderToString(<ConsultaGuardiaHorario guardia={v} onEvaluar={async () => null} />);
  const t = texto(h);
  comprobar(`${esperado}: dice «${rotulo}»`, t.includes(rotulo), t.slice(0, 300));
  comprobar(`${esperado}: enseña aparatos, pérdidas, casos ambiguos, retiradas, intenciones y las cinco condiciones`,
    ['Tus aparatos', 'Pérdidas', 'Casos ambiguos', 'Retiradas y resoluciones', 'Intenciones', 'Las cinco condiciones'].every((x) => t.includes(x)));
  comprobar(`${esperado}: solo consulta (ningún botón)`, !/<button/.test(h));
  comprobar(`${esperado}: nada roto a la vista`, !roto(t), t);
  if (esperado === 'B') comprobar('B sin confirmar: el aviso sale en «Pérdidas» como «todavía sin apuntar»', /Pérdidas.*Falta el testigo del horario.*todavía sin apuntar en tu cuenta/.test(t), t);
  if (esperado === 'B' || esperado === 'C') {
    /* Y con el servidor guardando de verdad: el registro confirmado sale abierto en su bloque. */
    const almacen = new Map(filas.map((f) => [f.key, f.value]));
    const t2 = {
      ...servidorDe(filas, horario),
      leerTodas: async () => ({ ok: true, filas: [...almacen].map(([key, value]) => ({ key, value })) }),
      leerPropia: async (_u, k) => ({ ok: true, existe: almacen.has(k), valor: almacen.get(k) ?? null }),
      insertar: async (_u, k, v) => { almacen.set(k, v); return { ok: true }; },
    };
    const g2 = crearGuardiaDeHorario({ transporte: t2, usuario: 'u', aparato: 'X', candado: null, versionApp: '3.162.0' });
    await g2.comprobar({}); await g2.esperar();
    const v2 = g2.vista();
    const tt = texto(renderToString(<ConsultaGuardiaHorario guardia={v2} />));
    comprobar(`${esperado} confirmado: sin aviso de «sin apuntar» y el registro sale abierto`, !tt.includes('todavía sin apuntar') && tt.includes('abierto'), tt);
  }
  if (esperado === 'C') comprobar('C: el aviso sale en «Casos ambiguos» y dice que no se puede saber', /Casos ambiguos No se puede saber si antes escribió una copia antigua\. Falta el testigo del horario/.test(t), t);
}

console.log('\n── El estado de cada aparato ──');
{
  const base = { estado: 'E1', motivo: null, aparato: 'X', textoTestigo: 'Testigo demostrado', registroPendiente: null, pendientes: 0, estadoRegistro: null };
  const filas = [
    { aparato: 'X', secuencia: 3, etiqueta: null, visitas: { '3.162.0': { ultima: { fecha: '2026-11-10' } } } },
    { aparato: 'V', secuencia: 5, etiqueta: 'Tableta vieja', visitas: { '3.100.0': { ultima: { fecha: '2026-08-01' } } } },
  ];
  const resumen = (secuenciaVista) => ({ registros: [], intenciones: [], resoluciones: [], retiradas: [{ id: 'rt1', aparatoRetirado: 'V', secuenciaVista, fecha: '2026-11-11' }] });
  const t1 = texto(renderToString(<ConsultaGuardiaHorario guardia={{ ...base, filas, resumen: resumen(5) }} />));
  comprobar('Un aparato con una retirada vigente sale «retirado»; el resto, «en uso»', /Tableta vieja 3\.100\.0 · 2026-08-01 · retirado/.test(t1) && /\(este\) 3\.162\.0 · 2026-11-10 · en uso/.test(t1), t1);
  const t2 = texto(renderToString(<ConsultaGuardiaHorario guardia={{ ...base, filas, resumen: resumen(4) }} />));
  comprobar('Una retirada que no vio su secuencia actual no lo retira', /Tableta vieja 3\.100\.0 · 2026-08-01 · en uso/.test(t2), t2);
}

console.log('\n── Dentro de Horario ──');
{
  const { estado } = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Instituto', plantilla: 'colegio', hoy: '2026-11-09' });
  const g = crearGuardiaDeHorario({ transporte: servidorDe([], estado), usuario: 'u', aparato: 'X', candado: null });
  const h = renderToString(<HorarioView horarioTop={estado} accent={accent} hoy="2026-11-09" onCambiar={() => {}} onCrearHorario={() => {}}
    soloLectura={MOTIVOS_BLOQUEO_GUARDIA.comprobando} guardia={g.vista()} onReintentarGuardia={() => {}} onEvaluarGuardia={async () => null} />);
  const t = texto(h);
  comprobar('HorarioView en E0: dice «Comprobando tu horario» y se pinta entero', t.includes('Comprobando tu horario') && t.includes('Planificación') && t.includes('Agenda'), t.slice(0, 200));
  comprobar('HorarioView en E0: sin el botón de añadir ni de editar', !/Editar horario|Añadir clase/.test(t));
  comprobar('HorarioView: la consulta de la guardia está junto al diagnóstico (plegada)', t.includes('Comprobación de tus aparatos') && t.includes('Diagnóstico de tus horarios'));
  const e = texto(renderToString(<ConsultaGuardiaHorarioEntrada guardia={g.vista()} accent={accent} />));
  comprobar('La entrada de la consulta se pinta plegada («Solo consulta: no cambia nada»)', e.includes('Comprobación de tus aparatos') && e.includes('Solo consulta: no cambia nada'));
  comprobar('Sin guardia (antes de cargar), la entrada no se pinta', renderToString(<ConsultaGuardiaHorarioEntrada guardia={null} accent={accent} />) === '');
  const sinGuardia = texto(renderToString(<HorarioView horarioTop={estado} accent={accent} hoy="2026-11-09" onCambiar={() => {}} onCrearHorario={() => {}} />));
  comprobar('HorarioView sin guardia (como antes de la A-bis) sigue pintándose igual', sinGuardia.includes('Diagnóstico de tus horarios') && !sinGuardia.includes('Comprobación de tus aparatos'));
  void DiagnosticoHorariosEntrada; void AvisoSoloLecturaHorario;
}

console.log(`\n${fallos === 0 ? '✓' : '✗'} ${pasa}/${pasa + fallos} comprobaciones de la guardia en pantalla`);
if (fallos) process.exit(1);
