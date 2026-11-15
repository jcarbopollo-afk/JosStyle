import React, { useMemo, useState } from 'react';
import { Stethoscope, AlertTriangle, Info, CircleAlert, RotateCw } from 'lucide-react';
import { ChevronDespliegue } from './motion';
import { Plegable } from './layoutMotion';
import { Card } from './ui';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { diagnosticoHorarios, textoDeTamano, GRAVEDADES_DIAGNOSTICO } from '../lib/diagnosticoHorario';

/* 🔎 HORARIOS · FASE 4, ENTREGA A — EL PANEL DE DIAGNÓSTICO (`docs/19` §12.2, TP-4)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 **SOLO LECTURA.** No recibe ni una función que guarde (`onCambiar` no
   llega aquí), no tiene botones que cambien datos, no ejecuta SQL, no llama a
   la red y no exporta nada: cuenta lo que la aplicación YA cargó de la cuenta y
   lo enseña. Es para que Josué lo mire en su iPhone antes de la entrega B.

   A diferencia del diagnóstico del catálogo (FIT F35), éste **sí se ve en
   producción**: es el que pidió TP-4. Va plegado al final de la pantalla de
   Horario y no calcula nada hasta que se abre.

   Distingue lo observado (los recuentos), lo que conviene mirar (los hallazgos,
   con su gravedad en icono y palabra, nunca solo en color) y lo que no puede
   saber (las limitaciones). No enseña ni un título, ni una nota, ni un nombre:
   solo cifras y nombres de campos. */

const ICONOS_GRAVEDAD = { riesgo: CircleAlert, aviso: AlertTriangle, info: Info };
const tonoDe = (g) => (g === 'riesgo' ? COLORS.negative : g === 'aviso' ? COLORS.warning : COLORS.info);
const nombreGravedad = (g) => GRAVEDADES_DIAGNOSTICO.find((x) => x.id === g)?.nombre || g;

const NOMBRES_ENTIDAD = {
  horarioTop: 'El horario entero', horario: 'Horarios', columna: 'Columnas', fila: 'Franjas', actividad: 'Actividades',
  visibilidad: 'Dónde se ve una actividad', bloque: 'Clases', recurrencia: 'Repetición', excepcion: 'Cambios de un día',
  cambios: 'Lo que cambia ese día',
};

function Fila({ nombre, valor }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs py-0.5">
      <span style={{ color: COLORS.textMuted }}>{nombre}</span>
      <span className="font-bold tabular-nums" style={{ color: COLORS.text }}>{valor}</span>
    </div>
  );
}

function Bloque({ titulo, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider mt-3 mb-1" style={{ color: COLORS.textMuted }}>{titulo}</p>
      {children}
    </div>
  );
}

/* Una colección que no es una lista llega como `null`: no se puede contar, y un «0»
   la presentaría como vacía. */
const NO_SE_LEE = 'No se puede leer';
const n = (x) => (x === null || x === undefined ? NO_SE_LEE : x);

const TEXTO_SOLO_LECTURA = {
  version_futura: 'Esta aplicación no guarda cambios del horario hasta que se recargue con la versión nueva.',
  version_ilegible: 'Esta aplicación no guarda cambios del horario: no reconoce la versión de los datos.',
  datos_malformados: 'Esta aplicación no guarda cambios del horario: parte de lo guardado no tiene la forma que sabe leer, y guardar encima lo borraría.',
};

const textoVersion = (v) => {
  if (!v) return '—';
  if (v.tipo === 'raiz_malformada') return 'No se puede leer';
  if (v.tipo === 'sin_version' || v.tipo === 'sin_datos') return `Sin versión (se lee como la ${v.conocida})`;
  if (v.tipo === 'futura') return `${v.valor}, más nueva que esta aplicación (${v.conocida})`;
  if (v.tipo === 'ilegible') return 'No se puede leer';
  return String(v.valor);
};

/** El panel, con el diagnóstico ya calculado. Se exporta para probarlo. */
export function DiagnosticoHorarios({ diagnostico }) {
  const d = diagnostico;
  if (!d) return null;
  const r = d.recuentos;
  return (
    <div role="region" aria-label="Diagnóstico de tus horarios">
      {d.estado === 'sin_cargar' && (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>{d.limitaciones[0]}</p>
      )}

      {d.estado !== 'sin_cargar' && (
        <>
          <Bloque titulo="Lo que hay guardado">
            <Fila nombre="Versión de los datos" valor={textoVersion(d.version)} />
            {d.version?.soloLectura && (
              <p className="text-xs py-0.5" style={{ color: COLORS.negative }}>
                {TEXTO_SOLO_LECTURA[d.version.motivo] || TEXTO_SOLO_LECTURA.version_futura}
              </p>
            )}
            {r ? (
              <>
                <Fila nombre="Horarios" valor={r.horarios.total === null ? NO_SE_LEE : `${r.horarios.total} · ${r.horarios.activos} activos · ${r.horarios.archivados} archivados${r.horarios.inactivos ? ` · ${r.horarios.inactivos} desactivados` : ''}`} />
                <Fila nombre="Columnas" valor={r.columnas.total === null ? NO_SE_LEE : `${r.columnas.total}${r.columnas.sinDia ? ` · ${r.columnas.sinDia} sin día` : ''}${r.columnas.ocultas ? ` · ${r.columnas.ocultas} ocultas` : ''}`} />
                <Fila nombre="Clases" valor={n(r.reglas)} />
                <Fila nombre="Cambios de un día" valor={n(r.excepciones)} />
                <Fila nombre="Actividades" valor={n(r.actividades)} />
                <Fila nombre="Elementos de la mochila" valor={n(r.mochila)} />
                <Fila nombre="Marcadas como hechas" valor={n(r.completadas)} />
                <Fila nombre={`Choques en ${r.choques.dias} días`} valor={r.choques.pares} />
              </>
            ) : (
              <p className="text-xs py-0.5" style={{ color: COLORS.textMuted }}>
                {d.estado === 'vacio' ? 'Todavía no hay ningún horario guardado.' : 'Lo guardado no tiene la forma de un horario.'}
              </p>
            )}
          </Bloque>

          {d.tamanos && (
            <Bloque titulo="Tamaño">
              <Fila nombre="El horario entero" valor={textoDeTamano(d.tamanos.horarioTop)} />
              {d.tamanos.mochila !== undefined && <Fila nombre="La mochila" valor={textoDeTamano(d.tamanos.mochila)} />}
              {d.tamanos.completadas !== undefined && <Fila nombre="Lo marcado como hecho" valor={textoDeTamano(d.tamanos.completadas)} />}
            </Bloque>
          )}

          <Bloque titulo="Lo que conviene mirar">
            {d.hallazgos.length === 0 ? (
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Nada que señalar.</p>
            ) : (
              <ul className="space-y-2">
                {d.hallazgos.map((h) => {
                  const Icono = ICONOS_GRAVEDAD[h.gravedad] || Info;
                  return (
                    <li key={h.id} className="flex items-start gap-2">
                      <Icono size={14} className="flex-shrink-0 mt-0.5" style={{ color: tonoDe(h.gravedad) }} aria-hidden="true" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-semibold" style={{ color: COLORS.text }}>
                          {h.titulo}: <span className="tabular-nums">{h.cantidad}</span>
                        </span>
                        <span className="block text-[11px]" style={{ color: COLORS.textMuted }}>
                          {nombreGravedad(h.gravedad)}. {h.detalle}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Bloque>

          {Object.keys(d.camposDesconocidos || {}).length > 0 && (
            <Bloque titulo="Campos que esta versión no conoce">
              {Object.entries(d.camposDesconocidos).map(([entidad, campos]) => (
                <Fila key={entidad} nombre={NOMBRES_ENTIDAD[entidad] || entidad} valor={campos.join(', ')} />
              ))}
            </Bloque>
          )}

          <Bloque titulo="Lo que este diagnóstico no sabe">
            <ul className="space-y-1">
              {d.limitaciones.map((t) => (
                <li key={t} className="text-[11px]" style={{ color: COLORS.textMuted }}>{t}</li>
              ))}
            </ul>
          </Bloque>
        </>
      )}
    </div>
  );
}

/** El plegable de la pantalla de Horario. Calcula al abrir, nunca al pintar. */
export function DiagnosticoHorariosEntrada({ crudo, asignaturas = null, cargaFallida = false, hoy, accent }) {
  const [abierto, setAbierto] = useState(false);
  const diagnostico = useMemo(
    () => (abierto ? diagnosticoHorarios(crudo, { asignaturas, cargaFallida, ...(hoy ? { hoy } : {}) }) : null),
    [abierto, crudo, asignaturas, cargaFallida, hoy],
  );
  return (
    <Card>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label="Diagnóstico de tus horarios"
        className="w-full flex items-center gap-2 text-left toque-44"
      >
        <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(accent || COLORS.info, 0.12) }}>
          <Stethoscope size={16} style={{ color: accent || COLORS.info }} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold" style={{ color: COLORS.text }}>Diagnóstico de tus horarios</span>
          <span className="block text-[11px]" style={{ color: COLORS.textMuted }}>Solo consulta: no cambia nada</span>
        </span>
        <ChevronDespliegue abierto={abierto} size={16} style={{ color: COLORS.textMuted }} />
      </button>
      <Plegable abierto={abierto}>{() => <div className="mt-3"><DiagnosticoHorarios diagnostico={diagnostico} /></div>}</Plegable>
    </Card>
  );
}

/** El aviso de la guardia de versión (`docs/20` §12): todo se ve, nada se guarda. */
export function AvisoSoloLecturaHorario({ motivo, accent, onRecargar }) {
  if (!motivo) return null;
  const texto = motivo === 'version_ilegible'
    ? 'No se reconoce la versión con la que se guardó tu horario. Para no estropearlo, esta aplicación no guarda cambios en él. Recarga la aplicación para editarlo.'
    : motivo === 'datos_malformados'
      ? 'Parte de tu horario guardado no tiene la forma que esta versión sabe leer. Para no perder nada, no se guardan cambios en él: lo que hay en tu cuenta se conserva tal cual. El diagnóstico de abajo dice qué parte es.'
      : 'Tu horario se guardó con una versión más nueva de JosStyle. Recarga la aplicación para editarlo.';
  return (
    <Card>
      <div role="status" className="flex items-start gap-2">
        <CircleAlert size={16} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.warning }} aria-hidden="true" />
        <p className="text-xs flex-1" style={{ color: COLORS.text }}>{texto}</p>
      </div>
      <button
        type="button"
        onClick={onRecargar}
        className="mt-2 flex items-center gap-1.5 text-xs font-semibold toque-44"
        style={{ color: accent || COLORS.info }}
      >
        <RotateCw size={13} aria-hidden="true" /> Recargar
      </button>
    </Card>
  );
}
