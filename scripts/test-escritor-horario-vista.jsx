// ---------------------------------------------------------------------------
// 🛡 HORARIOS · E1 — LO QUE SE VE del conflicto de edición (D2, opción B) y de la entrega corta (D1), pintado de
// verdad con react-dom/server. Datos DE PRUEBA, construidos aquí.
// ---------------------------------------------------------------------------
import React from 'react';
import { renderToString } from 'react-dom/server';
import HorarioView from '../src/views/HorarioView.jsx';
import { ACCENTS } from '../src/tokens.js';
import {
  AvisoConflictoHorario, AvisoApartadaPendiente, ConsultaGuardiaHorario, ConsultaGuardiaHorarioEntrada,
} from '../src/components/guardiaHorarioPanel.jsx';
import { MOTIVO_CONFLICTO_HORARIO, TEXTOS_CONFLICTO } from '../src/lib/escritorHorario.js';
import { TEXTOS_DECISION, TEXTOS_MOTIVO_RETIRADA } from '../src/lib/guardiaHorario.js';
import { crearDesdePlantilla } from '../src/lib/horarioEditor.js';
import { DEFAULT_HORARIO_TOP } from '../src/lib/horario.js';

const accent = ACCENTS[0].value;
let pasa = 0; let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) { pasa++; console.log(`  ✓ ${nombre}`); } else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};
const texto = (h) => h.replace(/<!--.*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const roto = (t) => /\bNaN\b|\bundefined\b|\bnull\b|\[object Object\]|Invalid Date|Infinity/.test(t);

console.log('\n── El aviso del conflicto (D2) ──');
for (const [estadoCopia, frase] of [
  ['guardada', TEXTOS_CONFLICTO.copiaGuardada],
  ['guardando', TEXTOS_CONFLICTO.copiaGuardando],
  ['sin_guardar', TEXTOS_CONFLICTO.copiaSinGuardar],
]) {
  const escritor = { estado: 'conflicto', conflicto: { detectadoEn: '2026-11-16T10:00:00Z', copia: { estado: estadoCopia, opId: 'op1' }, aparatoSuyo: 'B' }, apartadasSinGuardar: 0 };
  const h = renderToString(<AvisoConflictoHorario escritor={escritor} accent={accent} onVerLoDeAhora={() => {}} onDescartarMiCambio={() => {}} />);
  const t = texto(h);
  comprobar(`Copia ${estadoCopia}: dice qué ha pasado y que tu cambio no se ha perdido`, t.includes(TEXTOS_CONFLICTO.titulo) && t.includes('no se ha perdido'), t);
  comprobar(`Copia ${estadoCopia}: dice cómo está la copia apartada`, t.includes(frase), t);
  comprobar(`Copia ${estadoCopia}: las dos salidas, siempre (nunca bloqueado)`, t.includes(TEXTOS_CONFLICTO.verAhora) && t.includes(TEXTOS_CONFLICTO.descartar));
  comprobar(`Copia ${estadoCopia}: ningún botón que fuerce la escritura`, !/Guardar de todas formas|Sobrescribir|Forzar/i.test(t));
  comprobar(`Copia ${estadoCopia}: es una alerta`, /role="alert"/.test(h));
  comprobar(`Copia ${estadoCopia}: nada roto a la vista`, !roto(t), t);
}
comprobar('Sin conflicto, el aviso no se pinta', renderToString(<AvisoConflictoHorario escritor={{ conflicto: null }} accent={accent} />) === '');
{
  const t = texto(renderToString(<AvisoApartadaPendiente escritor={{ conflicto: null, apartadasSinGuardar: 1 }} />));
  comprobar('Una copia apartada que no llegó a la cuenta se avisa', t.includes(TEXTOS_CONFLICTO.apartadaPendiente), t);
  comprobar('Sin copias pendientes, nada', renderToString(<AvisoApartadaPendiente escritor={{ conflicto: null, apartadasSinGuardar: 0 }} />) === '');
}

console.log('\n── Dentro de Horario, con un conflicto abierto ──');
{
  const { estado } = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Instituto', plantilla: 'colegio', hoy: '2026-11-09' });
  const escritor = { estado: 'conflicto', conflicto: { detectadoEn: 'x', copia: { estado: 'guardada', opId: 'op1' } }, apartadasSinGuardar: 0 };
  const t = texto(renderToString(<HorarioView horarioTop={estado} accent={accent} hoy="2026-11-09" onCambiar={() => {}} onCrearHorario={() => {}}
    soloLectura={MOTIVO_CONFLICTO_HORARIO} escritor={escritor} onVerLoDeAhora={() => {}} onDescartarMiCambio={() => {}} />));
  comprobar('HorarioView con conflicto: enseña el aviso y tu horario entero', t.includes(TEXTOS_CONFLICTO.titulo) && t.includes('Planificación') && t.includes('Agenda'), t.slice(0, 300));
  comprobar('HorarioView con conflicto: sin editar ni añadir (Horarios no guarda hasta que elijas)', !/Editar horario|Añadir clase/.test(t));
  comprobar('HorarioView con conflicto: no confunde el aviso con el de una versión más nueva', !t.includes('versión más nueva de JosStyle'));
  const sin = texto(renderToString(<HorarioView horarioTop={estado} accent={accent} hoy="2026-11-09" onCambiar={() => {}} onCrearHorario={() => {}} escritor={{ estado: 'en_orden', conflicto: null, apartadasSinGuardar: 0 }} />));
  comprobar('Sin conflicto, HorarioView sigue como siempre', !sin.includes(TEXTOS_CONFLICTO.titulo) && sin.includes('Planificación'));
}

console.log('\n── La entrega corta en la consulta (D1) ──');
{
  const ahora = Date.parse('2026-11-16T10:00:00Z');
  const DIA = 86400000;
  const filas = [
    { aparato: 'X', secuencia: 3, etiqueta: null, visitas: { '3.163.0': { ultima: { fecha: '2026-11-16', en: new Date(ahora).toISOString() } } } },
    { aparato: 'VIEJO', secuencia: 5, etiqueta: 'Tableta vieja', visitas: { '3.100.0': { ultima: { fecha: '2026-08-01', en: new Date(ahora - 90 * DIA).toISOString() } } } },
    { aparato: 'RECIENTE', secuencia: 2, etiqueta: 'Portátil', visitas: { '3.162.0': { ultima: { fecha: '2026-11-14', en: new Date(ahora - 2 * DIA).toISOString() } } } },
  ];
  const registros = [
    { id: 'inc-abierta', clase: 'perdida', motivo: 'testigo_ausente', fecha: '2026-11-10', aparato: 'RECIENTE', resuelto: false, huella: 'h1' },
    { id: 'inc-resuelta', clase: 'ambigua', motivo: 'testigo_ausente', fecha: '2026-11-11', aparato: 'RECIENTE', resuelto: true, huella: 'h2' },
  ];
  const resoluciones = [{ id: 'res1', deteccionIds: ['inc-resuelta'], decision: 'conforme', reconocida: true, vigente: true, aparato: 'X' }];
  const guardia = { estado: 'E1', motivo: null, aparato: 'X', textoTestigo: 'Testigo demostrado', registroPendiente: null, pendientes: 0, estadoRegistro: null, filas, resumen: { registros, intenciones: [], resoluciones, retiradas: [] } };
  const acciones = { onRetirar: async () => ({ ok: true }), onResolver: async () => ({ ok: true }), onReabrir: async () => ({ ok: true }) };
  const h = renderToString(<ConsultaGuardiaHorario guardia={guardia} onEvaluar={async () => null} {...acciones} accent={accent} ahora={() => ahora} />);
  const t = texto(h);
  comprobar('Retirar se ofrece SOLO para el aparato sin visitas en 30 días', /aria-label="Retirar Tableta vieja"/.test(h) && !/aria-label="Retirar Portátil"/.test(h) && !/aria-label="Retirar Aparato X \(este\)"/.test(h), t);
  comprobar('Un aviso abierto se puede marcar; uno resuelto, no', /aria-label="Marcar el aviso inc-abie para resolverlo"/.test(h) && !/Marcar el aviso inc-resu/.test(h));
  comprobar('Las dos decisiones de la lista cerrada, y ninguna otra', t.includes(TEXTOS_DECISION.conforme) && t.includes(TEXTOS_DECISION.asumida) && !/Resolver todo|Otra decisión/.test(t));
  comprobar('Antes de resolver, se dice que se revise el horario y que no cambia nada de él', t.includes('Antes, revisa tu horario') && t.includes('Resolver no cambia nada de tu horario'));
  comprobar('Una resolución vigente se puede reabrir', /aria-label="Reabrir la resolución res1"/.test(h));
  comprobar('Los motivos de retirada son los tres cerrados (no se pintan hasta abrir la retirada)', Object.keys(TEXTOS_MOTIVO_RETIRADA).length === 3 && !t.includes(TEXTOS_MOTIVO_RETIRADA.sin_uso));
  comprobar('Nada roto a la vista', !roto(t), t);
  const sinAcciones = renderToString(<ConsultaGuardiaHorario guardia={guardia} onEvaluar={async () => null} />);
  comprobar('Sin las acciones (una pantalla antigua), sigue siendo solo consulta: ningún botón', !/<button/.test(sinAcciones));
  const e0 = renderToString(<ConsultaGuardiaHorario guardia={{ ...guardia, estado: 'E0' }} {...acciones} ahora={() => ahora} />);
  comprobar('Mientras se comprueba (E0), ninguna acción', !/aria-label="Retirar|Marcar el aviso|Reabrir la resolución/.test(e0));
  const entrada = texto(renderToString(<ConsultaGuardiaHorarioEntrada guardia={guardia} accent={accent} {...acciones} />));
  comprobar('La entrada dice que retirar o resolver pide confirmación', entrada.includes('retirar o resolver pide confirmación'), entrada);
}

console.log(`\n${fallos === 0 ? '✓' : '✗'} ${pasa}/${pasa + fallos} comprobaciones del conflicto y la entrega corta en pantalla`);
if (fallos) process.exit(1);
