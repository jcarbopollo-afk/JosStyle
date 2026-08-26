// ============================================================================
// HT · Fase 3/12 — EL EDITOR VISUAL
//
// *"El usuario ve una cuadrícula sencilla. El sistema se encarga de toda la
// complejidad."* (apartado 1)
//
// Toda la complejidad está en `horarioEditor.js`, que es puro y tiene 132
// comprobaciones. Aquí solo se pinta y se llama. Esta pantalla **no calcula ni
// un solape ni un conflicto**: los pide.
//
// ── LAS DOS DECISIONES QUE MÁS SE NOTAN ────────────────────────────────────
//
// **1. Modo consulta y modo edición** (apartado 35). *"MODO CONSULTA: el horario
// se ve limpio, no aparecen controles innecesarios."* En un iPhone eso no es
// estética: los botones de añadir columna, mover y borrar ocupan la mitad de la
// pantalla, y el 95 % de las veces Josué solo quiere mirar qué tiene ahora.
//
// **2. La columna de horas se queda fija** (apartado 7). Con siete días no caben
// en 390 px, así que la cuadrícula se desplaza — y si la hora se fuera con ella,
// a mitad de scroll no se sabría qué franja se está mirando.
//
// ── LO QUE NO HACE, Y POR QUÉ ──────────────────────────────────────────────
//
// · **No hay botón de Guardar** (apartado 36). Cada operación entra por
//   `snapshotAndSave`, que ya guarda y ya alimenta el "Deshacer" global.
// · **No hay drag & drop.** El apartado 25 lo pide *"en dispositivos
//   compatibles"*, y el 26 exige que en móvil exista igualmente "Mover a…". Se
//   ha construido **lo segundo**, que es lo que Josué va a usar de verdad desde
//   el iPhone; el arrastre puede añadirse encima sin tocar nada, porque acaba en
//   la misma función `moverBloque`.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar, Plus, ChevronLeft, ChevronRight, ArrowLeft, Trash2, Copy,
  Pencil, Eye, EyeOff, AlertTriangle, Check, MoveRight, X, GripVertical, Star,
} from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba, todayISO, addDays } from '../lib/helpers';
import { Card, SectionTitle, Field, TextInput, Select, PrimaryButton, GhostBtn, ListRow } from '../components/ui';
import { TIPOS_HORARIO, DIAS_SEMANA, diaDeFecha, duracionMinutos, normalizarHora } from '../lib/horario';
import {
  PLANTILLAS_HORARIO, crearDesdePlantilla, columnasDe, filasDe,
  contarEnColumna, contarEnFila, anadirColumna, editarColumna, alternarColumna, moverColumna,
  anadirFila, editarFila, eliminarFila,
  crearBloqueRapido, sugerencias, describirConflicto,
  ALCANCES, editarBloque, moverBloque, duplicarBloque, eliminarBloque,
  duplicarDia, vaciarDia, VISTAS_HORARIO, rejillaSemana, vistaDia, vistaAgenda,
  resumenEditor, PALETA_ACTIVIDADES,
} from '../lib/horarioEditor';
import {
  DENSIDADES, densidad, leerVisual, guardarVisual,
  cicloDe, guardarCiclo, semanaDelCiclo, gruposDe,
  INTERVALOS, generarFranjas, impactoRegenerarFranjas, regenerarFranjas,
  duplicarHorario, archivarHorario, horariosActivos, horariosArchivados,
  buscarEnHorario, resumenEstructura, describirProblema,
} from '../lib/horarioEstructura';
import {
  ICONOS_ACTIVIDAD, iconoDe, fichaActividad, impactoEliminarActividad, horasYMinutos,
  editarActividad, alternarFavorita, archivarActividad, duplicarActividad,
  eliminarActividadDefinitiva, actividadesOrdenadas, gruposDe as gruposDeActividades,
} from '../lib/actividades';
import { contextoTemporal, describirMinutos, opcionesReprogramar, modoHoy } from '../lib/hoy';
import {
  mochilaDeFecha, progresoMochila, marcarPreparado, prepararTodo, vaciarPreparacion,
  anadirAMano, quitarDeMochila,
} from '../lib/mochila';
import {
  tablonDelDia, marcarCompletada, previsualizar, ejecutar, deshacer, ejecutarTodo,
  historialDe, explicarAccion, puedeDeshacerse, resumenAutomatizaciones,
} from '../lib/automatizaciones';
import {
  ordenarPorPrioridad, planDeEstudio, explicarPlan, planAlternativo, compararPlanes,
  huecosParaMover, detectarSobrecarga, aplicarPlan, previsualizarPlan, describirAccion,
} from '../lib/planificador';

const plural = (n, uno, varios) => (n === 1 ? uno : varios);
const fechaCorta = (iso) => iso.split('-').reverse().slice(0, 2).join('/');

/* ===========================================================================
   CREAR UN HORARIO (apartados 2 y 3)
   ===========================================================================
   *"Al pulsarla aparecerá una configuración inicial extremadamente sencilla."*
   Tres campos y una plantilla. Todo lo demás se cambia después. */
function CrearHorario({ accent, onCrear, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('escolar');
  const [plantillaId, setPlantillaId] = useState('colegio');

  return (
    <Card>
      <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Nuevo horario</p>
      <Field label="Nombre">
        <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Instituto, Gimnasio, Estudio…" />
      </Field>
      <Field label="De qué es">
        <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS_HORARIO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </Select>
      </Field>
      <Field label="Empezar con">
        <Select value={plantillaId} onChange={(e) => setPlantillaId(e.target.value)}>
          {PLANTILLAS_HORARIO.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.sub}</option>)}
        </Select>
      </Field>
      <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>
        Es solo un punto de partida: los días y las horas se cambian después.
      </p>
      <div className="flex gap-2">
        <PrimaryButton accent={accent} onClick={() => onCrear({ nombre, tipo, plantillaId })}>Crear</PrimaryButton>
        <div style={{ width: 110, flexShrink: 0 }}>
          <GhostBtn onClick={onCancelar}>Cancelar</GhostBtn>
        </div>
      </div>
    </Card>
  );
}

/* ===========================================================================
   UN BLOQUE EN LA CUADRÍCULA (apartado 33)
   ===========================================================================
   *"El bloque no deberá llenarse de información. En la cuadrícula deberá
   aparecer únicamente lo importante."*

   Nombre y poco más. El aula, el profesor y el material se ven al abrirlo — con
   cinco días y seis franjas delante, una celda con cuatro líneas hace la
   cuadrícula ilegible.

   Y **el color no es lo único que lo identifica** (apartado 60): siempre hay
   nombre. Una actividad no se reconoce solo por ser roja. */
function BloqueCelda({ bloque, accent, compacto = false, onAbrir }) {
  const color = bloque.color || accent;
  return (
    <button
      onClick={onAbrir}
      className="w-full rounded-lg px-1.5 py-1 text-left"
      style={{
        background: hexToRgba(color, 0.16),
        // El borde izquierdo es lo que da el color sin teñir el texto: sobre un
        // fondo tintado, el texto del tema sigue siendo legible en claro y en
        // oscuro (apartado 61).
        borderLeft: `3px solid ${color}`,
        minHeight: compacto ? 30 : 38,
      }}
      aria-label={`${bloque.titulo}, ${bloque.inicio} a ${bloque.fin}`}
    >
      <p className="text-[10px] font-semibold leading-tight truncate" style={{ color: COLORS.text }}>{bloque.titulo}</p>
      {!compacto && bloque.aula && (
        <p className="text-[9px] truncate" style={{ color: COLORS.textMuted }}>{bloque.aula}</p>
      )}
    </button>
  );
}

/* ===========================================================================
   LA CUADRÍCULA (apartados 4, 6 y 7)
   ===========================================================================
   *"La columna de horas deberá poder permanecer fija mientras se desplazan los
   días."* Se resuelve con la hora fuera del contenedor que hace scroll, no con
   `position: sticky` — en iOS, `sticky` dentro de un scroll horizontal es
   irregular, y aquí la solución simple es además la robusta. */
function Cuadricula({ rejilla, accent, edicion, visual, onCelda, onBloque, onMenuColumna }) {
  const { columnas, celdas } = rejilla;
  if (!columnas.length) {
    return (
      <Card className="text-center">
        <p className="text-sm" style={{ color: COLORS.textMuted }}>Este horario todavía no tiene días.</p>
      </Card>
    );
  }

  const ANCHO_HORA = 46;
  // HT F4 · apartados 22, 23 y 59 — la densidad y el zoom son de ESTE aparato.
  // El alto de fila sale de la densidad; el zoom lo escala y también el ancho,
  // porque un zoom que solo estirara hacia abajo dejaría las columnas ilegibles.
  const escala = (visual?.zoom || 100) / 100;
  const ALTO = Math.round(densidad(visual?.densidad).alto * escala);
  const ANCHO_COL = columnas.length <= 5 && escala <= 1 ? 0 : Math.round(92 * escala);

  return (
    <div className="flex" style={{ gap: 4 }}>
      {/* La columna de horas, fuera del scroll. */}
      <div style={{ width: ANCHO_HORA, flexShrink: 0 }}>
        <div style={{ height: 26 }} aria-hidden="true" />
        {celdas.map(({ fila }) => (
          <div key={fila.id} className="flex flex-col justify-center" style={{ height: ALTO }}>
            <p className="text-[10px] font-semibold leading-none" style={{ color: COLORS.text }}>{fila.inicio}</p>
            <p className="text-[9px] leading-none mt-0.5" style={{ color: COLORS.textMuted }}>{fila.fin}</p>
          </div>
        ))}
      </div>

      {/* Y los días, que sí se desplazan. */}
      <div className="flex-1 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: ANCHO_COL ? columnas.length * ANCHO_COL : '100%' }}>
          <div className="flex" style={{ gap: 4, height: 26 }}>
            {columnas.map((c) => (
              <div key={c.id} className="flex-1 flex items-center justify-center gap-1" style={{ minWidth: ANCHO_COL || 0 }}>
                <p className="text-[10px] font-semibold truncate" style={{ color: COLORS.textMuted }}>
                  {c.corto || c.nombre}
                </p>
                {edicion && (
                  <button onClick={() => onMenuColumna(c)} className="p-0.5" aria-label={`Opciones de ${c.nombre}`}>
                    <GripVertical size={11} style={{ color: COLORS.textMuted }} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {celdas.map(({ fila, celdas: fils }) => (
            <div key={fila.id} className="flex" style={{ gap: 4, height: ALTO }}>
              {fils.map((celda) => (
                <div key={celda.columna.id} className="flex-1 py-0.5" style={{ minWidth: ANCHO_COL || 0 }}>
                  {celda.bloques.length === 0 ? (
                    <button
                      onClick={() => onCelda(celda.columna, fila)}
                      className="w-full h-full rounded-lg"
                      style={{ border: `1px dashed ${COLORS.border}`, opacity: edicion ? 1 : 0.35 }}
                      aria-label={`Añadir en ${celda.columna.nombre} a las ${fila.inicio}`}
                    />
                  ) : (
                    <div className="h-full flex flex-col" style={{ gap: 2 }}>
                      {celda.bloques.map((b) => (
                        <BloqueCelda key={b.id} bloque={b} accent={accent} compacto={celda.bloques.length > 1} onAbrir={() => onBloque(b)} />
                      ))}
                    </div>
                  )}
                  {/* Apartado 29 — el conflicto se ve sin entrar en nada. */}
                  {celda.conflicto && (
                    <p className="text-[9px] flex items-center gap-0.5 mt-0.5" style={{ color: COLORS.negative }}>
                      <AlertTriangle size={8} /> Choque
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   CREAR UN BLOQUE ESCRIBIENDO (apartados 15, 16 y 17)
   ===========================================================================
   *"Tocar celda → escribir «Matemáticas» → Enter."* Un campo y nada más. Los
   campos avanzados son de la fase 4; aquí lo que importa es que montar un
   horario entero sean minutos. */
function NuevoBloque({ estado, columna, fila, accent, asignaturas, onCrear, onCerrar }) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [conflicto, setConflicto] = useState(null);

  const sugeridas = useMemo(() => sugerencias(estado, texto, { asignaturas }), [estado, texto, asignaturas]);

  const crear = (nombre, forzar = false) => {
    const r = onCrear(nombre || texto, forzar);
    if (r?.error) { setError(r.error); setConflicto(r.conflictos ? describirConflicto(estado, r.conflictos, { asignaturas }) : null); return; }
    onCerrar();
  };

  return (
    <Card style={{ border: `1px solid ${accent}` }}>
      <p className="text-xs font-semibold mb-1" style={{ color: COLORS.text }}>
        {columna.nombre} · {fila.inicio}–{fila.fin}
      </p>
      <TextInput
        value={texto}
        onChange={(e) => { setTexto(e.target.value); setError(''); setConflicto(null); }}
        onKeyDown={(e) => { if (e.key === 'Enter') crear(); }}
        placeholder="Matemáticas"
        autoFocus
      />

      {/* Apartado 17 — al escribir "Mate" se sugiere lo que ya existe, para no
          crear una segunda Matemáticas. */}
      {sugeridas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {sugeridas.map((s) => (
            <button
              key={`${s.origen}:${s.id}`}
              onClick={() => crear(s.nombre)}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold"
              style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            >
              {s.nombre}
              {s.origen === 'estudios' && <span className="ml-1" style={{ color: COLORS.textMuted }}>· de Estudios</span>}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs mt-2" style={{ color: COLORS.negative }}>{error}</p>}
      {conflicto && (
        <div className="mt-1.5">
          {conflicto.map((c) => (
            <p key={c.id} className="text-[11px]" style={{ color: COLORS.textMuted }}>
              Ya está {c.titulo} de {c.inicio} a {c.fin}.
            </p>
          ))}
          {/* Apartado 28: se puede forzar, pero hay que pedirlo. */}
          <button onClick={() => crear(texto, true)} className="text-[11px] font-semibold mt-1" style={{ color: accent }}>
            Ponerlo igualmente
          </button>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <PrimaryButton accent={accent} onClick={() => crear()}>Añadir</PrimaryButton>
        <div style={{ width: 110, flexShrink: 0 }}>
          <GhostBtn onClick={onCerrar}>Cancelar</GhostBtn>
        </div>
      </div>
    </Card>
  );
}

/* ===========================================================================
   EL PANEL DE UN BLOQUE (apartados 20, 41, 52 y 53)
   ===========================================================================
   Aquí vive **lo más delicado de la fase**: al cambiar la hora, hay que preguntar
   si es solo hoy o siempre. Si no se pregunta, cambiar "Matemáticas" porque hoy
   hubo un cambio se carga todos los lunes del curso.

   El editor lo impone además desde abajo: sin alcance no escribe. */
function PanelBloque({ bloque, columnas, accent, fecha, onEditar, onMover, onDuplicar, onEliminar, onAbrirActividad, onCerrar }) {
  const [modo, setModo] = useState(null);        // 'hora' | 'mover' | 'duplicar' | 'borrar'
  const [inicio, setInicio] = useState(bloque.inicio);
  const [fin, setFin] = useState(bloque.fin);
  const [destino, setDestino] = useState(columnas[0]?.id || '');
  const [error, setError] = useState('');

  const aplicar = (alcance) => {
    const r = onEditar(bloque.id, { inicio, fin }, { alcance, fecha });
    if (r?.error) { setError(r.error); return; }
    setModo(null); setError('');
  };

  return (
    <Card style={{ border: `1px solid ${bloque.color || accent}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {/* HT F5 · apartado 29 — el nombre abre la ficha de la actividad: es
              la puerta a su profesor, su material, sus exámenes y sus tareas. */}
          {bloque.actividadId && onAbrirActividad ? (
            <button onClick={() => onAbrirActividad(bloque.actividadId)} className="text-left">
              <p className="text-sm font-semibold truncate" style={{ color: accent }}>{bloque.titulo}</p>
            </button>
          ) : (
            <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{bloque.titulo}</p>
          )}
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{bloque.inicio} – {bloque.fin}</p>
          {/* Apartados 54 y 55 — solo si existen. Nada de filas vacías. */}
          {bloque.aula && <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>Aula {bloque.aula}</p>}
          {bloque.profesor && <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{bloque.profesor}</p>}
        </div>
        <button onClick={onCerrar} className="p-1" aria-label="Cerrar"><X size={14} style={{ color: COLORS.textMuted }} /></button>
      </div>

      {!modo && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Accion icono={Pencil} label="Cambiar hora" onClick={() => setModo('hora')} />
          <Accion icono={MoveRight} label="Mover a…" onClick={() => setModo('mover')} />
          <Accion icono={Copy} label="Duplicar en…" onClick={() => setModo('duplicar')} />
          <Accion icono={Trash2} label="Eliminar" tono="negativo" onClick={() => setModo('borrar')} />
        </div>
      )}

      {modo === 'hora' && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Desde"><TextInput value={inicio} onChange={(e) => setInicio(e.target.value)} placeholder="08:00" /></Field>
            <Field label="Hasta"><TextInput value={fin} onChange={(e) => setFin(e.target.value)} placeholder="09:00" /></Field>
          </div>
          {/* LA pregunta del apartado 53. Dos botones, sin uno "por defecto". */}
          <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>¿Qué quieres cambiar?</p>
          <div className="flex flex-col gap-2">
            {fecha && (
              <PrimaryButton accent={accent} onClick={() => aplicar(ALCANCES.SOLO_ESTE_DIA)}>
                Solo el {fechaCorta(fecha)}
              </PrimaryButton>
            )}
            <GhostBtn onClick={() => aplicar(ALCANCES.TODOS)}>Todos los días iguales</GhostBtn>
            <GhostBtn onClick={() => { setModo(null); setError(''); }}>Cancelar</GhostBtn>
          </div>
          {error && <p className="text-xs mt-2" style={{ color: COLORS.negative }}>{error}</p>}
        </div>
      )}

      {(modo === 'mover' || modo === 'duplicar') && (
        <div className="mt-3">
          <Field label="¿A qué día?">
            <Select value={destino} onChange={(e) => setDestino(e.target.value)}>
              {columnas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Field>
          <div className="flex gap-2">
            <PrimaryButton accent={accent} onClick={() => {
              const r = modo === 'mover' ? onMover(bloque.id, destino) : onDuplicar(bloque.id, destino);
              if (r?.error) { setError(r.error); return; }
              setModo(null); onCerrar();
            }}>
              {modo === 'mover' ? 'Mover' : 'Duplicar'}
            </PrimaryButton>
            <div style={{ width: 110, flexShrink: 0 }}><GhostBtn onClick={() => { setModo(null); setError(''); }}>Cancelar</GhostBtn></div>
          </div>
          {error && <p className="text-xs mt-2" style={{ color: COLORS.negative }}>{error}</p>}
        </div>
      )}

      {modo === 'borrar' && (
        <div className="flex items-center gap-3 mt-3">
          <button onClick={() => { onEliminar(bloque.id); onCerrar(); }} className="text-xs font-semibold" style={{ color: COLORS.negative }}>
            Sí, eliminar
          </button>
          <button onClick={() => setModo(null)} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cancelar</button>
        </div>
      )}
    </Card>
  );
}

function Accion({ icono: Icono, label, onClick, tono }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
      style={{
        background: COLORS.surface2,
        color: tono === 'negativo' ? COLORS.negative : COLORS.text,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <Icono size={12} /> {label}
    </button>
  );
}

/* ===========================================================================
   MENÚ DE UNA COLUMNA (apartados 9, 10, 23, 24 y 40)
   ===========================================================================
   *"Antes de eliminar una columna con información se deberá solicitar
   confirmación."* Y el 40: si está vacía, no hace falta. El editor da el número,
   así que aquí se puede distinguir. */
function MenuColumna({ columna, estado, horarioId, columnas, accent, onMover, onOcultar, onDuplicarDia, onVaciar, onEliminar, onCerrar }) {
  const [confirmando, setConfirmando] = useState(null);
  const [destino, setDestino] = useState(columnas.find((c) => c.id !== columna.id)?.id || '');
  const [aviso, setAviso] = useState('');
  const n = contarEnColumna(estado, columna.id);

  return (
    <Card style={{ border: `1px solid ${accent}` }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{columna.nombre}</p>
        <button onClick={onCerrar} className="p-1" aria-label="Cerrar"><X size={14} style={{ color: COLORS.textMuted }} /></button>
      </div>
      <p className="text-[11px] mt-0.5 mb-3" style={{ color: COLORS.textMuted }}>
        {n} {plural(n, 'bloque', 'bloques')}
      </p>

      <div className="flex flex-wrap gap-1.5">
        <Accion icono={ChevronLeft} label="Izquierda" onClick={() => onMover(columna.id, 'izquierda')} />
        <Accion icono={ChevronRight} label="Derecha" onClick={() => onMover(columna.id, 'derecha')} />
        <Accion icono={columna.visible === false ? Eye : EyeOff} label={columna.visible === false ? 'Mostrar' : 'Ocultar'} onClick={() => onOcultar(columna.id)} />
        <Accion icono={Copy} label="Copiar día en…" onClick={() => setConfirmando('duplicar')} />
        {n > 0 && <Accion icono={Trash2} label="Vaciar día" tono="negativo" onClick={() => setConfirmando('vaciar')} />}
        <Accion icono={Trash2} label="Eliminar día" tono="negativo" onClick={() => setConfirmando(n > 0 ? 'eliminar' : 'eliminar_ya')} />
      </div>

      {confirmando === 'duplicar' && (
        <div className="mt-3">
          <Field label="Copiarlo en">
            <Select value={destino} onChange={(e) => setDestino(e.target.value)}>
              {columnas.filter((c) => c.id !== columna.id).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Field>
          <div className="flex gap-2">
            <PrimaryButton accent={accent} onClick={() => {
              const r = onDuplicarDia(columna.id, destino, false);
              if (r?.error) { setAviso(r.error); return; }
              setConfirmando(null); onCerrar();
            }}>Copiar</PrimaryButton>
            <div style={{ width: 110, flexShrink: 0 }}><GhostBtn onClick={() => { setConfirmando(null); setAviso(''); }}>Cancelar</GhostBtn></div>
          </div>
          {aviso && (
            <div className="mt-2">
              <p className="text-xs" style={{ color: COLORS.negative }}>{aviso}</p>
              <button onClick={() => { onDuplicarDia(columna.id, destino, true); setConfirmando(null); onCerrar(); }}
                className="text-[11px] font-semibold mt-1" style={{ color: accent }}>
                Sustituir lo que hay
              </button>
            </div>
          )}
        </div>
      )}

      {(confirmando === 'vaciar' || confirmando === 'eliminar') && (
        <div className="mt-3">
          <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
            {confirmando === 'vaciar'
              ? `Este día tiene ${n} ${plural(n, 'bloque', 'bloques')}. ¿Los quito del horario?`
              : `Al eliminar el día se van también sus ${n} ${plural(n, 'bloque', 'bloques')}.`}
          </p>
          <div className="flex items-center gap-3">
            <button onClick={() => {
              if (confirmando === 'vaciar') onVaciar(columna.id); else onEliminar(columna.id);
              setConfirmando(null); onCerrar();
            }} className="text-xs font-semibold" style={{ color: COLORS.negative }}>
              Sí, hazlo
            </button>
            <button onClick={() => setConfirmando(null)} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Apartado 40 — una columna vacía se borra sin ceremonia. */}
      {confirmando === 'eliminar_ya' && (() => { onEliminar(columna.id); onCerrar(); return null; })()}
    </Card>
  );
}

/* ===========================================================================
   FRANJAS (apartados 11, 12 y 13)
   =========================================================================== */
function PanelFranjas({ horario, estado, accent, onAnadir, onEditar, onEliminar }) {
  const [editando, setEditando] = useState(null);
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const filas = filasDe(horario);

  return (
    <Card>
      <SectionTitle sub="Se pueden cambiar y no todas tienen que durar lo mismo">Franjas horarias</SectionTitle>
      {filas.map((f, i) => {
        const n = contarEnFila(estado, horario.id, f);
        return editando === f.id ? (
          <div key={f.id} className="py-2">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Desde"><TextInput value={inicio} onChange={(e) => setInicio(e.target.value)} /></Field>
              <Field label="Hasta"><TextInput value={fin} onChange={(e) => setFin(e.target.value)} /></Field>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { onEditar(f.id, { inicio, fin }); setEditando(null); }} className="text-xs font-semibold" style={{ color: accent }}>Guardar</button>
              <button onClick={() => setEditando(null)} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cancelar</button>
              <button onClick={() => { onEliminar(f.id); setEditando(null); }} className="text-xs font-semibold ml-auto" style={{ color: COLORS.negative }}>
                Eliminar{n > 0 ? ` (${n} ${plural(n, 'bloque', 'bloques')} se quedan sin franja)` : ''}
              </button>
            </div>
          </div>
        ) : (
          <ListRow key={f.id} last={i === filas.length - 1} onClick={() => { setEditando(f.id); setInicio(f.inicio); setFin(f.fin); }}>
            <span className="text-xs font-semibold" style={{ color: COLORS.text }}>{f.inicio} – {f.fin}</span>
            <span className="text-[11px] ml-auto" style={{ color: COLORS.textMuted }}>
              {duracionMinutos(f.inicio, f.fin)} min
            </span>
          </ListRow>
        );
      })}
      <div className="mt-2">
        <GhostBtn icon={Plus} onClick={onAnadir}>Añadir franja</GhostBtn>
      </div>
    </Card>
  );
}

/* ===========================================================================
   LA PANTALLA
   =========================================================================== */
/* ===========================================================================
   EL PLANIFICADOR (HT F9 · apartados 6, 7, 16-19, 36, 37 y 56)
   ===========================================================================
   La arquitectura del apartado 52 puesta en pantalla:

     DATOS → MOTOR TEMPORAL → PLANIFICADOR → **PROPUESTA** → CONFIRMACIÓN

   ⚠️ **Nada de esto escribe hasta que Josué toca "Ponlo en mi horario".** Es la
   regla 7 del proyecto: la IA —y el planificador, que es su motor— proponen; el
   cambio lo hace él. El botón dice exactamente lo que va a pasar.

   ⚠️ **Y no castiga** (apartado 19): si el plan hay que rehacerlo, se dice que
   *"necesita reajustarse"*, nunca que se ha fallado. */
function PanelPlan({ estado, examenes, accent, hoy, asignaturas, sobrecarga, onAplicar }) {
  const [examenId, setExamenId] = useState(examenes[0]?.id || '');
  const [alternativo, setAlternativo] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [hecho, setHecho] = useState('');

  const examen = examenes.find((x) => x.id === examenId) || null;
  const opciones = useMemo(() => ({
    examenFecha: examen?.fecha,
    temas: (examen?.tema || '').split(/[,;]/).map((t) => t.trim()).filter(Boolean),
    titulo: examen?.asignatura || 'Estudiar',
    hoy, asignaturas,
  }), [examen, hoy, asignaturas]);

  const plan = useMemo(
    () => (examen ? (alternativo ? planAlternativo(estado, opciones) : planDeEstudio(estado, opciones)) : null),
    [estado, examen, alternativo, opciones],
  );
  const comparativa = useMemo(
    () => (examen ? compararPlanes(planDeEstudio(estado, opciones), planAlternativo(estado, opciones)) : null),
    [estado, examen, opciones],
  );

  if (!examenes.length && !sobrecarga?.hay) return null;

  return (
    <Card>
      <p className="text-[10px] font-semibold tracking-wide mb-1" style={{ color: COLORS.textMuted }}>PLANIFICAR</p>

      {/* Apartado 36 — se dice, y se ofrece la alternativa. Nada más. */}
      {sobrecarga?.hay && (
        <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>{sobrecarga.mensaje}</p>
      )}

      {examenes.length > 0 && (
        <>
          {examenes.length > 1 && (
            <Field label="¿Para qué examen?">
              <Select value={examenId} onChange={(e) => { setExamenId(e.target.value); setHecho(''); }}>
                {examenes.map((x) => (
                  <option key={x.id} value={x.id}>{x.asignatura || 'Examen'} · {fechaCorta(x.fecha)}</option>
                ))}
              </Select>
            </Field>
          )}

          {plan?.imposible && <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>{plan.aviso}</p>}

          {plan && !plan.imposible && (
            <>
              {plan.sesiones.map((s) => (
                <div key={`${s.fecha}-${s.inicio}`} className="flex items-center gap-2 py-0.5">
                  <span className="text-[11px] font-semibold" style={{ color: COLORS.textMuted, width: 62 }}>
                    {s.dia.slice(0, 3)} {s.inicio}
                  </span>
                  <span className="text-xs flex-1 truncate" style={{ color: COLORS.text }}>{s.titulo}</span>
                </div>
              ))}
              <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>{explicarPlan(plan)}</p>
              {plan.aviso && <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{plan.aviso}</p>}

              {/* Apartados 68 y 69 — otra forma de repartirlo, para comparar. */}
              {comparativa && (
                <button onClick={() => setAlternativo(!alternativo)} className="text-[11px] font-semibold mt-1.5" style={{ color: accent }}>
                  {alternativo
                    ? `Ver el plan largo (${comparativa.a.sesiones} sesiones de más rato)`
                    : `Ver otro reparto (${comparativa.b.sesiones} sesiones más cortas)`}
                </button>
              )}

              {/* ⚠️ Aquí y solo aquí se escribe, y solo tras confirmar. */}
              {!hecho && (
                confirmando ? (
                  <div className="rounded-xl p-2 mt-2" style={{ background: COLORS.surface2 }}>
                    <p className="text-[11px] mb-2" style={{ color: COLORS.text }}>
                      Se van a crear {plan.sesiones.length} {plural(plan.sesiones.length, 'sesión', 'sesiones')} en tu horario.
                      Puedes cambiarlas o borrarlas después como cualquier otra clase.
                    </p>
                    <div className="flex gap-2">
                      <PrimaryButton accent={accent} onClick={() => {
                        const r = onAplicar(plan.sesiones);
                        setConfirmando(false);
                        setHecho(r?.error ? '' : `Listo: ${plan.sesiones.length} ${plural(plan.sesiones.length, 'sesión añadida', 'sesiones añadidas')}.`);
                      }}>
                        Ponlo en mi horario
                      </PrimaryButton>
                      <div style={{ width: 110, flexShrink: 0 }}>
                        <GhostBtn onClick={() => setConfirmando(false)}>Cancelar</GhostBtn>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2"><Accion icono={Check} label="Ponlo en mi horario" onClick={() => setConfirmando(true)} /></div>
                )
              )}
              {hecho && <p className="text-[11px] mt-2" style={{ color: accent }}>{hecho}</p>}
            </>
          )}
        </>
      )}
    </Card>
  );
}

/* ===========================================================================
   UNA FILA DEL TABLÓN (HT F8 · apartados 2-9, 15 y 19)
   ===========================================================================
   ⚠️ **PASADA no es COMPLETADA.** *"La hora terminó"* y *"la actividad se
   realizó"* son cosas distintas: una clase a la que no fuiste terminó igual.

   Por eso lo pasado sale apagado pero **con una casilla**, no tachado: se puede
   confirmar después. Y confirmarlo es siempre opcional (apartado 9) — nada
   obliga a marcar nada. */
function FilaTablon({ ev, accent, onCompletar }) {
  const hecha = ev.estadoTemporal === 'completada';
  const pasada = ev.estadoTemporal === 'pasada';
  const enCurso = ev.estadoTemporal === 'en_curso';
  const proxima = ev.estadoTemporal === 'proxima';

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[11px] font-semibold" style={{ color: COLORS.textMuted, width: 40 }}>{ev.inicio}</span>
      {onCompletar && (pasada || hecha || enCurso) ? (
        <button onClick={() => onCompletar(ev, !hecha)} className="flex-shrink-0"
          aria-label={`${hecha ? 'Desmarcar' : 'Marcar como hecha'} ${ev.titulo}`}>
          <span className="block w-3.5 h-3.5 rounded flex items-center justify-center"
            style={{ border: `1.5px solid ${hecha ? accent : COLORS.border}`, background: hecha ? accent : 'transparent' }}>
            {hecha && <Check size={9} style={{ color: COLORS.textOnAccent }} />}
          </span>
        </button>
      ) : <span className="w-3.5 flex-shrink-0" aria-hidden="true" />}
      <span className="text-xs flex-1 truncate"
        style={{ color: enCurso ? accent : (pasada && !hecha) ? COLORS.textMuted : COLORS.text }}>
        {ev.titulo}
      </span>
      {enCurso && <span className="text-[10px] flex-shrink-0" style={{ color: accent }}>ahora</span>}
      {proxima && <span className="text-[10px] flex-shrink-0" style={{ color: COLORS.textMuted }}>enseguida</span>}
    </div>
  );
}

/* ===========================================================================
   LAS AUTOMATIZACIONES DEL DÍA (HT F8 · apartados 48-53)
   ===========================================================================
   *"Añadida bata automáticamente por Biología."*

   Tres cosas y ninguna más: qué haría hoy, qué ha hecho, y deshacerlo.

   ⚠️ **Lo que necesita confirmación se pregunta** (apartado 53). Ejecutarlo
   "porque estaba en el lote" sería saltarse la regla por comodidad. */
function PanelAutomatizaciones({ propuestas, historial, accent, onEjecutar, onEjecutarTodo, onDeshacer }) {
  const auto = propuestas.filter((p) => !p.confirmar);
  const preguntar = propuestas.filter((p) => p.confirmar);

  if (!propuestas.length && !historial.length) return null;

  return (
    <Card>
      <p className="text-[10px] font-semibold tracking-wide mb-1" style={{ color: COLORS.textMuted }}>AUTOMÁTICO</p>

      {auto.length > 0 && (
        <>
          {auto.map((p) => (
            <p key={p.automatizacionId} className="text-[11px] py-0.5" style={{ color: COLORS.text }}>
              {p.valor} <span style={{ color: COLORS.textMuted }}>— por {p.porQue}</span>
            </p>
          ))}
          {onEjecutarTodo && <div className="mt-1.5"><Accion icono={Check} label="Hacerlo" onClick={onEjecutarTodo} /></div>}
        </>
      )}

      {/* Apartado 53 — lo importante se pregunta, una por una. */}
      {preguntar.map((p) => (
        <div key={p.automatizacionId} className="rounded-xl p-2 mt-2" style={{ background: COLORS.surface2 }}>
          <p className="text-[11px]" style={{ color: COLORS.text }}>
            ¿{p.valor}? <span style={{ color: COLORS.textMuted }}>Por {p.porQue}.</span>
          </p>
          <div className="flex gap-2 mt-1.5">
            <button onClick={() => onEjecutar?.(p, true)} className="text-[11px] font-semibold" style={{ color: accent }}>Sí</button>
            <button className="text-[11px] font-semibold" style={{ color: COLORS.textMuted }}>Ahora no</button>
          </div>
        </div>
      ))}

      {/* Apartados 50, 51 y 52 — qué pasó, cuándo, y deshacerlo. */}
      {historial.slice(0, 4).map((h) => (
        <div key={h.id} className="flex items-center gap-2 py-0.5">
          <span className="text-[10px] flex-shrink-0" style={{ color: COLORS.textMuted, width: 34 }}>{h.hora}</span>
          <span className="text-[11px] flex-1"
            style={{ color: h.deshecha ? COLORS.textMuted : COLORS.text, textDecoration: h.deshecha ? 'line-through' : 'none' }}>
            {explicarAccion(h)}
          </span>
          {puedeDeshacerse(h) && onDeshacer && (
            <button onClick={() => onDeshacer(h.id)} className="text-[10px] font-semibold flex-shrink-0" style={{ color: accent }}>
              Deshacer
            </button>
          )}
        </div>
      ))}
    </Card>
  );
}

/* ===========================================================================
   LA MOCHILA (HT F7 · apartados 14-23, 38, 57, 59 y 108)
   ===========================================================================
   *"Día → actividades → materiales → excepciones → mochila."*

   Nada de esta lista se ha escrito a mano: sale del horario de ese día. Lo
   único que se guarda es qué has metido ya y qué has añadido tú.

   ── LO QUE SE VE, Y POR QUÉ ────────────────────────────────────────────────
   · **Obligatorio y opcional van separados** (apartado 21): *"esto evita que el
     usuario confunda recomendaciones con necesidades reales"*.
   · **Cada cosa dice por qué está** (apartado 59). "Bata — la necesitas porque
     tienes Biología" se lee de un vistazo; una checklist muda se ignora.
   · **Lo que no tienes no se puede marcar** (apartado 38): sale tachado y con
     su motivo, porque marcarlo sería mentira.
   · **Sin castigo** (apartado 105): si faltó algo se dice qué, sin reproche. */
function PanelMochila({ mochila, progreso, accent, titulo = 'MOCHILA', onMarcar, onPrepararTodo, onVaciar, onAnadir, onQuitar }) {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(null);
  const [error, setError] = useState('');

  const obligatorios = mochila.elementos.filter((e) => ['critico', 'obligatorio'].includes(e.prioridad));
  const opcionales = mochila.elementos.filter((e) => !['critico', 'obligatorio'].includes(e.prioridad));

  const fila = (e) => (
    <div key={e.clave} className="py-1">
      <div className="flex items-center gap-2">
        <button
          onClick={() => e.disponible && onMarcar?.(e, !e.preparado)}
          className="flex-shrink-0"
          disabled={!e.disponible}
          aria-label={`${e.preparado ? 'Sacar' : 'Meter'} ${e.nombre}`}
        >
          <span className="block w-4 h-4 rounded-md flex items-center justify-center"
            style={{
              border: `1.5px solid ${e.preparado ? accent : COLORS.border}`,
              background: e.preparado ? accent : 'transparent',
              opacity: e.disponible ? 1 : 0.4,
            }}>
            {e.preparado && <Check size={10} style={{ color: COLORS.textOnAccent }} />}
          </span>
        </button>
        <button onClick={() => setAbierto(abierto === e.clave ? null : e.clave)} className="flex-1 text-left min-w-0">
          <span className="text-xs truncate block"
            style={{ color: e.disponible ? COLORS.text : COLORS.textMuted, textDecoration: e.disponible ? 'none' : 'line-through' }}>
            {e.cantidad > 1 ? `${e.cantidad} ` : ''}{e.nombre}
          </span>
        </button>
        {!e.disponible && (
          <span className="text-[10px] flex-shrink-0" style={{ color: COLORS.negative }}>
            {e.prestadoA ? `lo tiene ${e.prestadoA}` : e.estado}
          </span>
        )}
        {e.origen === 'manual' && onQuitar && (
          <button onClick={() => onQuitar(e.nombre)} className="p-0.5 flex-shrink-0" aria-label={`Quitar ${e.nombre}`}>
            <X size={11} style={{ color: COLORS.textMuted }} />
          </button>
        )}
      </div>
      {/* Apartado 59 — la explicación, al tocarlo. */}
      {abierto === e.clave && (
        <p className="text-[10px] pl-6 mt-0.5" style={{ color: COLORS.textMuted }}>
          {e.porQueTexto}{e.ubicacion ? ` Está en: ${e.ubicacion}.` : ''}
        </p>
      )}
    </div>
  );

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-[10px] font-semibold tracking-wide" style={{ color: COLORS.textMuted }}>🎒 {titulo}</p>
        {!progreso.vacia && (
          <span className="text-[10px]" style={{ color: progreso.completa ? accent : COLORS.textMuted }}>
            {progreso.preparados}/{progreso.total}
          </span>
        )}
      </div>

      {progreso.vacia ? (
        <p className="text-[11px]" style={{ color: COLORS.textMuted }}>Nada que llevar ese día.</p>
      ) : (
        <>
          {/* Apartado 18 — la barra. Con la mochila vacía sería 0/0 y
              desaparecería, por eso el motor devuelve 100 en ese caso. */}
          <div className="h-1 rounded-full mb-2" style={{ background: COLORS.surface2 }}>
            <div className="h-1 rounded-full" style={{ width: `${progreso.porcentaje}%`, background: accent }} />
          </div>

          {obligatorios.length > 0 && (
            <>
              <p className="text-[10px] font-semibold mt-1" style={{ color: COLORS.textMuted }}>OBLIGATORIO</p>
              {obligatorios.map(fila)}
            </>
          )}
          {opcionales.length > 0 && (
            <>
              <p className="text-[10px] font-semibold mt-2" style={{ color: COLORS.textMuted }}>OPCIONAL</p>
              {opcionales.map(fila)}
            </>
          )}

          {/* Apartados 20 y 49 — qué falta, dicho con su nombre. */}
          {progreso.aviso && (
            <p className="text-[11px] mt-2 flex items-start gap-1" style={{ color: COLORS.negative }}>
              <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" /> {progreso.aviso}
            </p>
          )}
          {progreso.completa && (
            <p className="text-[11px] mt-2" style={{ color: accent }}>Lo tienes todo.</p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-2">
            {onPrepararTodo && !progreso.completa && <Accion icono={Check} label="Meter todo" onClick={onPrepararTodo} />}
            {onVaciar && progreso.preparados > 0 && <Accion icono={X} label="Vaciar" onClick={onVaciar} />}
          </div>
        </>
      )}

      {/* Apartado 57 — añadir algo a mano, que después no se borra solo. */}
      {onAnadir && (
        <div className="flex gap-2 mt-2">
          <TextInput value={texto} onChange={(e) => { setTexto(e.target.value); setError(''); }} placeholder="Añadir algo más…" />
          <button
            onClick={() => {
              const r = onAnadir(texto);
              if (r?.error) { setError(r.error); return; }
              setTexto('');
            }}
            className="px-2.5 rounded-xl text-[11px] font-semibold flex-shrink-0"
            style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}>
            Añadir
          </button>
        </div>
      )}
      {error && <p className="text-[11px] mt-1" style={{ color: COLORS.negative }}>{error}</p>}
    </Card>
  );
}

/* ===========================================================================
   HOY (HT F6 · apartados 1-7, 32-36, 65, 69 y 85)
   ===========================================================================
   *"HOY no será simplemente la fecha actual. Será una vista agregadora."*

   Todo lo que se pinta aquí sale de `contextoTemporal`, que **no guarda nada**:
   consulta las entidades originales (apartado 102). Completar una tarea desde
   Productividad cambia esta pantalla sin que esta pantalla se entere.

   ── LO QUE SE VE, EN ESTE ORDEN ────────────────────────────────────────────
   AHORA · SIGUIENTE · PENDIENTE · MAÑANA. Es el ejemplo del apartado 1, tal
   cual, porque ese orden es el de las preguntas que uno se hace: qué estoy
   haciendo, qué viene, qué se me olvida, qué preparo esta noche.

   ⚠️ **Un día sin nada NO es una pantalla rota** (apartado 69): dice que no hay
   nada programado y ofrece planificar, en vez de quedarse en blanco.

   ⚠️ **El contador de "termina en 23 min" se actualiza solo** (apartado 5), con
   un `setInterval` de un minuto. Sin él, el número se congela en cuanto la
   pantalla lleva un rato abierta, y decir "empieza en 42 min" cuando empezó
   hace diez es peor que no decir nada. */
export function HoyView({
  contexto, accent, modo = 'completo', onModo, onCompletarTarea, onReprogramar,
  onAbrirBloque, onIrAFecha, opcionesFecha = [],
  // HT F7 — la mochila de HOY y la de MAÑANA, que es la que de verdad importa
  // por la noche (apartado 15).
  mochilaHoy = null, mochilaManana = null, accionesMochila = null,
  // HT F8 — el tablón con estados temporales y las automatizaciones del día.
  tablon = null, onCompletar = null, automatizaciones = null,
  // HT F9 — el planificador. Propone; escribe solo cuando Josué confirma.
  planificador = null,
}) {
  const { dia, ahora, siguiente: prox, pendientes: pend, libre, conflictos, manana, agenda } = contexto;
  const [reprogramando, setReprogramando] = useState(null);
  const [verPasado, setVerPasado] = useState(false);
  const completo = modo === 'completo';

  return (
    <div className="space-y-3">
      {/* Apartado 6 — el resumen de arriba: la carga del día de un vistazo. */}
      <Card>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
              {dia.nombreDia} {fechaCorta(dia.fecha)}
            </p>
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
              {dia.diaLibre ? 'Día libre'
                : dia.vacio ? 'Nada programado'
                  : `${dia.actividades} ${plural(dia.actividades, 'actividad', 'actividades')}${dia.pendientes ? ` · ${dia.pendientes} ${plural(dia.pendientes, 'pendiente', 'pendientes')}` : ''}`}
            </p>
          </div>
          {onModo && (
            <button onClick={() => onModo(completo ? 'minimo' : 'completo')}
              className="text-[11px] font-semibold flex-shrink-0" style={{ color: accent }}>
              {completo ? 'Ver lo justo' : 'Ver todo'}
            </button>
          )}
        </div>
      </Card>

      {/* Apartado 39 — un choque se ve arriba, no escondido. */}
      {conflictos.length > 0 && (
        <Card style={{ border: `1px solid ${COLORS.negative}` }}>
          <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: COLORS.negative }}>
            <AlertTriangle size={12} /> {conflictos.length} {plural(conflictos.length, 'choque', 'choques')} de horario
          </p>
        </Card>
      )}

      {/* AHORA (apartados 3 y 5). */}
      {ahora && (
        <Card style={{ border: `1px solid ${ahora.color || accent}` }}>
          <p className="text-[10px] font-semibold tracking-wide" style={{ color: COLORS.textMuted }}>AHORA</p>
          <button onClick={() => ahora.bloqueId && onAbrirBloque?.(ahora)} className="text-left w-full">
            <p className="text-sm font-semibold mt-0.5" style={{ color: COLORS.text }}>{ahora.titulo}</p>
          </button>
          <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>
            {ahora.inicio}–{ahora.fin} · termina en {describirMinutos(ahora.minutosRestantes)}
          </p>
          {ahora.ubicacion && <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{ahora.ubicacion}</p>}
        </Card>
      )}

      {/* SIGUIENTE (apartado 4). */}
      {prox && (
        <Card>
          <p className="text-[10px] font-semibold tracking-wide" style={{ color: COLORS.textMuted }}>SIGUIENTE</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: COLORS.text }}>{prox.titulo}</p>
          <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>
            {prox.esHoy
              ? `${prox.inicio} · empieza en ${describirMinutos(prox.minutosPara)}`
              : `${prox.inicio} · ${fechaCorta(prox.fecha)}`}
          </p>
        </Card>
      )}

      {/* PENDIENTE (apartados 32-35). */}
      {pend.length > 0 && (
        <Card>
          <p className="text-[10px] font-semibold tracking-wide mb-1" style={{ color: COLORS.textMuted }}>PENDIENTE</p>
          {pend.map((p, i) => (
            <div key={p.id} style={{ borderBottom: i === pend.length - 1 ? 'none' : `1px solid ${COLORS.border}` }} className="py-1.5">
              <div className="flex items-center gap-2">
                {/* Apartado 35 — completar sin abrir Productividad. Solo las
                    tareas: un examen no se "completa", llega. */}
                {p.tipo === 'tarea' && onCompletarTarea ? (
                  <button onClick={() => onCompletarTarea(p.refId)} className="flex-shrink-0" aria-label={`Completar ${p.titulo}`}>
                    <span className="block w-4 h-4 rounded-md" style={{ border: `1.5px solid ${COLORS.border}` }} />
                  </button>
                ) : (
                  <span className="w-4 flex-shrink-0 text-center text-[10px]" aria-hidden="true">📝</span>
                )}
                <span className="text-xs flex-1 truncate" style={{ color: COLORS.text }}>{p.titulo}</span>
                {/* Apartado 33 — vencida, con cuántos días lleva. No desaparece. */}
                {p.estado === 'vencida' && (
                  <span className="text-[10px] flex-shrink-0" style={{ color: COLORS.negative }}>
                    Vencida hace {p.diasDeRetraso} {plural(p.diasDeRetraso, 'día', 'días')}
                  </span>
                )}
                {p.estado === 'proxima' && p.fecha && (
                  <span className="text-[10px] flex-shrink-0" style={{ color: COLORS.textMuted }}>{fechaCorta(p.fecha)}</span>
                )}
              </div>
              {/* Apartado 34 — reprogramar en pocos toques. */}
              {p.tipo === 'tarea' && onReprogramar && (
                <div className="pl-6">
                  {reprogramando === p.id ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {opcionesFecha.map((o) => (
                        <button key={o.id} onClick={() => { onReprogramar(p.refId, o.fecha); setReprogramando(null); }}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold"
                          style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}>
                          {o.label}
                        </button>
                      ))}
                      <button onClick={() => setReprogramando(null)} className="text-[10px]" style={{ color: COLORS.textMuted }}>Cancelar</button>
                    </div>
                  ) : (
                    <button onClick={() => setReprogramando(p.id)} className="text-[10px] mt-0.5" style={{ color: accent }}>
                      Reprogramar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* HT F9 · apartados 16-19 y 56 — el plan de estudio, propuesto. */}
      {completo && planificador && (
        <PanelPlan
          estado={planificador.estado} examenes={planificador.examenes} accent={accent}
          hoy={planificador.hoy} asignaturas={planificador.asignaturas}
          sobrecarga={planificador.sobrecarga} onAplicar={planificador.aplicar}
        />
      )}

      {/* HT F8 · apartados 48-52 — qué haría hoy solo, y qué ya ha hecho. */}
      {automatizaciones && (
        <PanelAutomatizaciones
          propuestas={automatizaciones.propuestas} historial={automatizaciones.historial} accent={accent}
          onEjecutar={automatizaciones.ejecutar} onEjecutarTodo={automatizaciones.ejecutarTodo}
          onDeshacer={automatizaciones.deshacer}
        />
      )}

      {/* HT F7 · apartado 14 — la mochila de hoy. */}
      {mochilaHoy && !mochilaHoy.progreso.vacia && (
        <PanelMochila
          mochila={mochilaHoy.mochila} progreso={mochilaHoy.progreso} accent={accent} titulo="HOY"
          onMarcar={accionesMochila?.marcar} onPrepararTodo={accionesMochila?.prepararTodo}
          onVaciar={accionesMochila?.vaciar} onAnadir={accionesMochila?.anadir} onQuitar={accionesMochila?.quitar}
        />
      )}

      {/* Apartado 69 — un día sin nada NO es una pantalla rota. */}
      {dia.vacio && pend.length === 0 && (
        <Card className="text-center">
          <Calendar size={20} style={{ color: accent }} className="mx-auto mb-2" />
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
            {dia.diaLibre ? 'Hoy es día libre' : 'No tienes nada programado'}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            {dia.diaLibre ? 'Disfrútalo.' : 'Puedes montar tu día desde la cuadrícula de la semana.'}
          </p>
        </Card>
      )}

      {completo && (
        <>
          {/* HT F8 · apartados 15 y 16 — el tablón. Lo terminado SALE del
              tablón principal y se consulta aparte, porque a las 20:00 lo que
              importa no es la clase de las 8. */}
          {(agenda.eventos.length > 0 || agenda.todoElDia.length > 0) && (
            <Card>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[10px] font-semibold tracking-wide" style={{ color: COLORS.textMuted }}>EL DÍA</p>
                {tablon && tablon.pasados.length > 0 && (
                  <button onClick={() => setVerPasado(!verPasado)} className="text-[10px] font-semibold" style={{ color: accent }}>
                    {verPasado ? 'Ocultar lo pasado' : `Ver lo pasado (${tablon.pasados.length})`}
                  </button>
                )}
              </div>
              {agenda.todoElDia.map((ev) => (
                <p key={ev.id} className="text-xs py-0.5" style={{ color: COLORS.text }}>
                  <span style={{ color: COLORS.textMuted }}>Todo el día · </span>{ev.titulo}
                </p>
              ))}
              {(verPasado ? tablon?.todos || [] : tablon?.activos || []).map((ev, i) => (
                <FilaTablon key={ev.clave || i} ev={ev} accent={accent} onCompletar={onCompletar} />
              ))}
              {/* Apartado 17 — el historial del día, en una línea. */}
              {tablon && tablon.terminadas > 0 && (
                <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
                  {tablon.completadas > 0
                    ? `${tablon.completadas} de ${tablon.terminadas} ${plural(tablon.terminadas, 'terminada', 'terminadas')} confirmada${tablon.completadas === 1 ? '' : 's'}.`
                    : `${tablon.terminadas} ${plural(tablon.terminadas, 'ya terminó', 'ya terminaron')}.`}
                </p>
              )}
            </Card>
          )}

          {/* Tiempo libre (apartado 65) y descanso (68), que no es lo mismo. */}
          {libre.minutos > 0 && !dia.vacio && (
            <Card>
              <p className="text-xs" style={{ color: COLORS.text }}>{libre.texto}</p>
              {libre.huecos.slice(0, 3).map((h) => (
                <p key={`${h.inicio}-${h.fin}`} className="text-[11px]" style={{ color: COLORS.textMuted }}>
                  {h.inicio}–{h.fin}
                </p>
              ))}
              {libre.minutosDescanso > 0 && (
                <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>
                  Más {describirMinutos(libre.minutosDescanso)} de descanso ya planificados.
                </p>
              )}
            </Card>
          )}

          {/* MAÑANA (apartado 85) — para preparar la mochila por la noche. */}
          <Card>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold tracking-wide" style={{ color: COLORS.textMuted }}>MAÑANA</p>
              {onIrAFecha && (
                <button onClick={() => onIrAFecha(manana.fecha)} className="text-[10px] font-semibold" style={{ color: accent }}>Ver el día</button>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: COLORS.text }}>
              {manana.dia.vacio ? 'Nada programado'
                : `${manana.dia.actividades} ${plural(manana.dia.actividades, 'actividad', 'actividades')}`}
            </p>
          </Card>

          {/* HT F7 · apartado 15 — la mochila de MAÑANA, que es la que se
              prepara por la noche. Sustituye a la línea de material suelta que
              había en F6: una lista con casillas sirve; una frase, no. */}
          {mochilaManana && !mochilaManana.progreso.vacia && (
            <PanelMochila
              mochila={mochilaManana.mochila} progreso={mochilaManana.progreso} accent={accent} titulo="PARA MAÑANA"
              onMarcar={accionesMochila?.marcarManana} onPrepararTodo={accionesMochila?.prepararTodoManana}
              onVaciar={accionesMochila?.vaciarManana} onAnadir={accionesMochila?.anadirManana} onQuitar={accionesMochila?.quitarManana}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ===========================================================================
   LA FICHA DE UNA ACTIVIDAD (HT F5 · apartados 29, 30, 77, 79 y 100)
   ===========================================================================
   *"«Biología» dejará de ser texto dentro de una celda: será una entidad
   reutilizable y conectada."*

   La ficha es **la puerta de entrada al resto de la información** (apartado 29):
   qué días toca, cuánto tiempo a la semana, profesor, aula, material, exámenes
   y tareas. No calcula nada: se lo pide todo a `actividades.js`.

   ── TRES DECISIONES QUE SE VEN ─────────────────────────────────────────────
   · **Las notas privadas SÍ salen aquí** (apartado 52) y **no salen en el
     contexto de la IA** (apartado 73). Esta es la pantalla privada de Josué.
   · **Las tareas se dicen como lo que son**: Productividad no tiene campo de
     asignatura, así que se enseñan las que MENCIONAN la actividad y el texto lo
     dice. Fingir un enlace sería un dato inventado (regla 8).
   · **Borrar avisa primero y recomienda archivar** (apartado 58). */
export function FichaActividad({ ficha, accent, onEditar, onFavorita, onArchivar, onDuplicar, onEliminar, impacto, onCerrar }) {
  const [modo, setModo] = useState(null);   // 'editar' | 'borrar'
  const [campos, setCampos] = useState({
    nombre: ficha.titulo, corto: ficha.corto, persona: ficha.profesor,
    ubicacion: ficha.aula, notas: ficha.notas, icono: ficha.icono,
  });

  const color = ficha.color || accent;
  return (
    <Card style={{ border: `1px solid ${color}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-lg leading-none" aria-hidden="true">{ficha.icono}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{ficha.titulo}</p>
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
              {ficha.tipo}{ficha.grupo ? ` · ${ficha.grupo.nombre}` : ''}
              {ficha.estado !== 'Activa' ? ` · ${ficha.estado}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onFavorita} className="p-1" aria-label={ficha.favorita ? 'Quitar de favoritas' : 'Marcar como favorita'}>
            <Star size={14} style={{ color: ficha.favorita ? accent : COLORS.textMuted }} fill={ficha.favorita ? accent : 'none'} />
          </button>
          <button onClick={onCerrar} className="p-1" aria-label="Cerrar"><X size={14} style={{ color: COLORS.textMuted }} /></button>
        </div>
      </div>

      {!modo && (
        <>
          {/* Cuándo toca y cuánto ocupa: lo primero del apartado 77. */}
          {ficha.horario.length > 0 && (
            <div className="mt-3">
              {ficha.horario.map((h) => (
                <p key={h.bloqueId} className="text-xs" style={{ color: COLORS.text }}>
                  <span style={{ color: COLORS.textMuted }}>{h.diaLabel}</span> · {h.inicio}–{h.fin}
                </p>
              ))}
              <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>
                {horasYMinutos(ficha.minutosSemana)} a la semana
              </p>
            </div>
          )}
          {ficha.horario.length === 0 && (
            <p className="text-[11px] mt-3" style={{ color: COLORS.textMuted }}>Todavía no está en ningún día del horario.</p>
          )}

          {/* Solo lo que existe: nada de filas vacías (regla 8). */}
          {(ficha.profesor || ficha.aula) && (
            <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
              {[ficha.profesor, ficha.aula].filter(Boolean).join(' · ')}
            </p>
          )}
          {ficha.material.length > 0 && (
            <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>
              Material: {ficha.material.join(', ')}
            </p>
          )}
          {ficha.etiquetas.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {ficha.etiquetas.map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded-md text-[10px]"
                  style={{ background: hexToRgba(color, 0.14), color: COLORS.text }}>{t}</span>
              ))}
            </div>
          )}

          {ficha.examenes.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>Exámenes</p>
              {ficha.examenes.slice(0, 3).map((x) => (
                <p key={x.id} className="text-[11px]" style={{ color: x.pasado ? COLORS.textMuted : COLORS.text }}>
                  {fechaCorta(x.fecha || '')} {x.tema}
                </p>
              ))}
            </div>
          )}

          {ficha.tareas.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>Tareas que la nombran</p>
              {ficha.tareas.slice(0, 4).map((t) => (
                <p key={t.id} className="text-[11px]" style={{ color: t.hecha ? COLORS.textMuted : COLORS.text }}>
                  {t.hecha ? '✓ ' : '· '}{t.texto}
                </p>
              ))}
              <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>
                Salen las que escribiste con su nombre: las tareas todavía no se pueden enlazar a una asignatura.
              </p>
            </div>
          )}

          {ficha.notas && (
            <div className="mt-3 rounded-xl p-2" style={{ background: COLORS.surface2 }}>
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: COLORS.textMuted }}>Nota privada</p>
              <p className="text-[11px]" style={{ color: COLORS.text }}>{ficha.notas}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3">
            <Accion icono={Pencil} label="Editar" onClick={() => setModo('editar')} />
            <Accion icono={Copy} label="Duplicar" onClick={onDuplicar} />
            <Accion icono={EyeOff} label={ficha.estado === 'Archivada' ? 'Recuperar' : 'Archivar'} onClick={onArchivar} />
            <Accion icono={Trash2} label="Eliminar" tono="negativo" onClick={() => setModo('borrar')} />
          </div>
        </>
      )}

      {modo === 'editar' && (
        <div className="mt-3">
          <Field label="Nombre"><TextInput value={campos.nombre} onChange={(e) => setCampos({ ...campos, nombre: e.target.value })} /></Field>
          <Field label="Nombre corto">
            <TextInput value={campos.corto} onChange={(e) => setCampos({ ...campos, corto: e.target.value })} placeholder="BIO" />
          </Field>
          <Field label="Icono">
            <div className="flex flex-wrap gap-1">
              {ICONOS_ACTIVIDAD.map((i) => (
                <button key={i.id} onClick={() => setCampos({ ...campos, icono: i.id })}
                  className="w-8 h-8 rounded-lg text-base"
                  style={{ background: campos.icono === i.id ? hexToRgba(accent, 0.2) : COLORS.surface2, border: `1px solid ${campos.icono === i.id ? accent : COLORS.border}` }}
                  aria-label={i.etiqueta}>{i.id}</button>
              ))}
            </div>
          </Field>
          <Field label="Profesor"><TextInput value={campos.persona} onChange={(e) => setCampos({ ...campos, persona: e.target.value })} /></Field>
          <Field label="Aula"><TextInput value={campos.ubicacion} onChange={(e) => setCampos({ ...campos, ubicacion: e.target.value })} /></Field>
          <Field label="Nota privada">
            <TextInput value={campos.notas} onChange={(e) => setCampos({ ...campos, notas: e.target.value })} placeholder="Solo la ves tú" />
          </Field>
          <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>
            Las notas privadas se quedan aquí: no salen en tu día ni se le mandan a la IA.
          </p>
          <div className="flex gap-2">
            <PrimaryButton accent={accent} onClick={() => { onEditar(campos); setModo(null); }}>Guardar</PrimaryButton>
            <div style={{ width: 110, flexShrink: 0 }}><GhostBtn onClick={() => setModo(null)}>Cancelar</GhostBtn></div>
          </div>
        </div>
      )}

      {modo === 'borrar' && (
        <div className="mt-3 rounded-xl p-2" style={{ background: hexToRgba(COLORS.negative, 0.1) }}>
          {/* Apartado 58 — el impacto, con números, ANTES de decidir. */}
          <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>
            {ficha.titulo} está en {impacto.bloques} {plural(impacto.bloques, 'clase', 'clases')}
            {impacto.examenes ? `, ${impacto.examenes} ${plural(impacto.examenes, 'examen', 'exámenes')}` : ''}
            {impacto.tareas ? ` y ${impacto.tareas} ${plural(impacto.tareas, 'tarea', 'tareas')}` : ''}.
          </p>
          <p className="text-[11px] mt-1 mb-2" style={{ color: COLORS.textMuted }}>
            {impacto.recomendado === 'archivar'
              ? 'Archivarla lo conserva todo y la puedes recuperar. Borrarla no.'
              : 'No la usa nada, así que borrarla no se lleva nada por delante.'}
          </p>
          <div className="flex flex-col gap-2">
            {impacto.recomendado === 'archivar' && (
              <PrimaryButton accent={accent} onClick={() => { onArchivar(); setModo(null); onCerrar(); }}>Archivar</PrimaryButton>
            )}
            <button onClick={() => { onEliminar(); onCerrar(); }} className="text-xs font-semibold text-left" style={{ color: COLORS.negative }}>
              Eliminar de todos modos
            </button>
            <button onClick={() => setModo(null)} className="text-xs font-semibold text-left" style={{ color: COLORS.textMuted }}>Cancelar</button>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ===========================================================================
   OPCIONES AVANZADAS (apartado 63)
   ===========================================================================
   *"Toda la potencia estará disponible, pero sin complicar la interfaz
   básica."* Por eso todo lo de esta fase vive detrás de un solo botón, dentro
   del modo edición: quien solo quiera mirar su horario no ve nada de esto.

   Los cuatro apartados que mandan aquí:

   · **30 — nada se mueve en silencio.** Regenerar las franjas puede dejar
     bloques sin fila; el impacto se calcula y se enseña ANTES de escribir.
   · **56 — archivar en vez de borrar.** Un horario archivado deja de resolver
     fechas, pero sus bloques siguen ahí.
   · **59 — el zoom es de este aparato.** Va a `localStorage`, no a Supabase:
     el iPhone y el ordenador no tienen la misma pantalla.
   · **20 — una configuración extrema no puede destruir la usabilidad.** El
     generador de franjas está topado y el zoom acotado en la propia librería. */
export function PanelAvanzado({ estado, horario, accent, asignaturas, visual, hoy, onVisual, onCambiar, onResultado }) {
  const [abierto, setAbierto] = useState(null);   // 'ver' | 'ciclo' | 'franjas' | 'buscar' | 'horario'
  const [busqueda, setBusqueda] = useState('');
  const [ciclo, setCiclo] = useState(() => cicloDe(horario));
  const [fr, setFr] = useState({ desde: '08:00', hasta: '14:00', intervalo: 60, descanso: 0 });
  const [aviso, setAviso] = useState(null);
  const [confirmando, setConfirmando] = useState(null);

  const resultados = useMemo(
    () => (busqueda.trim() ? buscarEnHorario(estado, busqueda, { asignaturas }) : []),
    [estado, busqueda, asignaturas],
  );
  const nuevasFranjas = useMemo(() => generarFranjas(fr), [fr]);
  const estructura = useMemo(() => resumenEstructura(estado, horario.id), [estado, horario]);
  const archivados = horariosArchivados(estado);

  const secciones = [
    { id: 'ver', label: 'Ver' },
    { id: 'buscar', label: 'Buscar' },
    { id: 'ciclo', label: 'Semanas A/B' },
    { id: 'franjas', label: 'Franjas' },
    { id: 'horario', label: 'El horario' },
  ];

  const aplicarFranjas = (forzar) => {
    const impacto = impactoRegenerarFranjas(estado, horario.id, nuevasFranjas);
    if (!impacto.seguro && !forzar) { setAviso(impacto); return; }
    setAviso(null);
    onCambiar(regenerarFranjas(estado, horario.id, nuevasFranjas));
  };

  return (
    <Card>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {secciones.map((s) => (
          <button key={s.id} onClick={() => { setAbierto(abierto === s.id ? null : s.id); setAviso(null); }}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
            style={abierto === s.id
              ? { background: accent, color: COLORS.textOnAccent }
              : { background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>
            {s.label}
          </button>
        ))}
      </div>

      {abierto === 'ver' && (
        <>
          <Field label="Tamaño de las filas">
            <Select value={visual.densidad} onChange={(e) => onVisual({ ...visual, densidad: e.target.value })}>
              {DENSIDADES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </Select>
          </Field>
          <Field label={`Zoom · ${visual.zoom} %`}>
            <input type="range" min={60} max={140} step={10} value={visual.zoom} className="w-full"
              onChange={(e) => onVisual({ ...visual, zoom: Number(e.target.value) })}
              style={{ accentColor: accent }} aria-label="Zoom de la cuadrícula" />
          </Field>
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
            El tamaño y el zoom son solo de este aparato. En el ordenador se ven a su medida.
          </p>
        </>
      )}

      {abierto === 'buscar' && (
        <>
          <TextInput value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Asignatura, aula, profesor…" />
          {busqueda.trim() && (
            <p className="text-[11px] mt-2 mb-1" style={{ color: COLORS.textMuted }}>
              {resultados.length} {plural(resultados.length, 'resultado', 'resultados')}
            </p>
          )}
          {resultados.slice(0, 12).map((b, i) => (
            <ListRow key={b.id} last={i === Math.min(resultados.length, 12) - 1}>
              <span className="text-[11px] font-semibold" style={{ color: COLORS.textMuted, width: 42 }}>{b.inicio}</span>
              <span className="text-xs font-semibold flex-1 truncate" style={{ color: COLORS.text }}>{b.titulo}</span>
              {b.ubicacion && <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{b.ubicacion}</span>}
            </ListRow>
          ))}
        </>
      )}

      {abierto === 'ciclo' && (
        <>
          <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>
            Para horarios que alternan: una semana A y otra B. Cada columna se marca con su semana; las que no
            lleven ninguna salen todas las semanas.
          </p>
          <Field label="Semanas que se repiten">
            <Select value={ciclo.semanas} onChange={(e) => setCiclo({ ...ciclo, semanas: Number(e.target.value) })}>
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n === 1 ? 'Sin alternar' : `${n} semanas`}</option>)}
            </Select>
          </Field>
          {ciclo.semanas > 1 && (
            <Field label="La semana A empieza el">
              <TextInput type="date" value={ciclo.ancla} onChange={(e) => setCiclo({ ...ciclo, ancla: e.target.value })} />
            </Field>
          )}
          {ciclo.semanas > 1 && !ciclo.ancla && (
            <p className="text-[11px] mb-2" style={{ color: COLORS.negative }}>
              Sin esa fecha no se puede saber en qué semana estamos, así que siempre se enseñará la A.
            </p>
          )}
          {ciclo.semanas > 1 && ciclo.ancla && (
            <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>
              Hoy toca la semana {semanaDelCiclo(ciclo, hoy)?.nombre}.
              {gruposDe(horario).length === 0 && ' Todavía no has marcado ninguna columna con su semana.'}
            </p>
          )}
          <PrimaryButton accent={accent} onClick={() => onCambiar(guardarCiclo(estado, horario.id, ciclo))}>
            Guardar
          </PrimaryButton>
        </>
      )}

      {abierto === 'franjas' && (
        <>
          <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>
            Crea de golpe todas las horas del día. Sustituye las que ya hay.
          </p>
          <div className="flex gap-2">
            <Field label="Desde"><TextInput type="time" value={fr.desde} onChange={(e) => setFr({ ...fr, desde: e.target.value })} /></Field>
            <Field label="Hasta"><TextInput type="time" value={fr.hasta} onChange={(e) => setFr({ ...fr, hasta: e.target.value })} /></Field>
          </div>
          <Field label="Cada">
            <Select value={fr.intervalo} onChange={(e) => setFr({ ...fr, intervalo: Number(e.target.value) })}>
              {INTERVALOS.map((n) => <option key={n} value={n}>{n} minutos</option>)}
            </Select>
          </Field>
          <Field label="Descanso entre clases">
            <Select value={fr.descanso} onChange={(e) => setFr({ ...fr, descanso: Number(e.target.value) })}>
              {[0, 5, 10, 15, 20].map((n) => <option key={n} value={n}>{n === 0 ? 'Sin descanso' : `${n} minutos`}</option>)}
            </Select>
          </Field>
          <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>
            Saldrían {nuevasFranjas.length} {plural(nuevasFranjas.length, 'franja', 'franjas')}
            {nuevasFranjas.length ? `, de ${nuevasFranjas[0].inicio} a ${nuevasFranjas[nuevasFranjas.length - 1].fin}` : ''}.
          </p>
          {aviso && (
            <div className="rounded-xl p-2 mb-2" style={{ background: hexToRgba(COLORS.negative, 0.1) }}>
              <p className="text-[11px] font-semibold" style={{ color: COLORS.negative }}>
                {aviso.huerfanos} {plural(aviso.huerfanos, 'clase se quedaría', 'clases se quedarían')} fuera de la rejilla nueva.
              </p>
              <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>
                No se borran ni se mueven: conservan su hora, pero dejarían de encajar en ninguna franja.
              </p>
              <PrimaryButton accent={accent} onClick={() => aplicarFranjas(true)}>Hacerlo igualmente</PrimaryButton>
            </div>
          )}
          {!aviso && nuevasFranjas.length > 0 && (
            <PrimaryButton accent={accent} onClick={() => aplicarFranjas(false)}>Crear las franjas</PrimaryButton>
          )}
        </>
      )}

      {abierto === 'horario' && (
        <>
          <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>
            {estructura?.columnas} {plural(estructura?.columnas, 'columna', 'columnas')} y {estructura?.filas} {plural(estructura?.filas, 'fila', 'filas')}
            {estructura?.sinHora ? ` (${estructura.sinHora} sin hora)` : ''}.
          </p>
          {[...new Set((estructura?.validacion.problemas || []).map(describirProblema))].map((texto, i) => (
            <p key={i} className="text-[11px] mb-1 flex items-start gap-1" style={{ color: COLORS.negative }}>
              <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" /> {texto}
            </p>
          ))}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Accion icono={Copy} label="Duplicar para otro curso"
              onClick={() => onResultado(duplicarHorario(estado, horario.id, { nombre: `${horario.nombre} (copia)`, hoy }))} />
            <Accion icono={EyeOff} label="Archivar" tono={COLORS.negative} onClick={() => setConfirmando('archivar')} />
          </div>
          {confirmando === 'archivar' && (
            <div className="rounded-xl p-2 mt-2" style={{ background: COLORS.surface2 }}>
              <p className="text-[11px] mb-2" style={{ color: COLORS.text }}>
                Archivarlo lo saca de la vista y deja de aparecer en tus días, pero no se borra nada: sus clases
                siguen guardadas y puedes recuperarlo cuando quieras.
              </p>
              <div className="flex gap-2">
                <PrimaryButton accent={COLORS.negative}
                  onClick={() => { onCambiar(archivarHorario(estado, horario.id)); setConfirmando(null); }}>
                  Archivar
                </PrimaryButton>
                <div style={{ width: 110, flexShrink: 0 }}>
                  <GhostBtn onClick={() => setConfirmando(null)}>Cancelar</GhostBtn>
                </div>
              </div>
            </div>
          )}
          {archivados.length > 0 && (
            <>
              <p className="text-[11px] mt-3 mb-1" style={{ color: COLORS.textMuted }}>Archivados</p>
              {archivados.map((h, i) => (
                <ListRow key={h.id} last={i === archivados.length - 1}
                  onClick={() => onCambiar(archivarHorario(estado, h.id, false))}>
                  <span className="text-xs flex-1 truncate" style={{ color: COLORS.text }}>{h.nombre}</span>
                  <span className="text-[10px]" style={{ color: accent }}>Recuperar</span>
                </ListRow>
              ))}
            </>
          )}
        </>
      )}
    </Card>
  );
}

export default function HorarioView({
  horarioTop, asignaturas = [], accent, hoy = todayISO(),
  // HT F5 — se LEEN, nunca se escriben: los exámenes son de Estudios y las
  // tareas de Productividad (apartado 92, "referencia única").
  estudios = null, productividad = null, calendario = null,
  // HT F6 · apartados 34 y 35 — completar y reprogramar SIN abrir Productividad.
  // La tarea sigue siendo suya: aquí solo se pide el cambio.
  onCompletarTarea = null, onReprogramarTarea = null,
  onCambiar, onCrearHorario,
}) {
  const estado = horarioTop;
  const [horarioId, setHorarioId] = useState(null);
  // HT F6 · apartado 1 — HOY es la vista por defecto: es la pregunta que se
  // hace al abrir la app.
  const [vista, setVista] = useState('hoy');
  const [edicion, setEdicion] = useState(false);
  const [creando, setCreando] = useState(false);
  const [celda, setCelda] = useState(null);
  const [bloque, setBloque] = useState(null);
  const [menuColumna, setMenuColumna] = useState(null);
  const [fecha, setFecha] = useState(hoy);
  const [franjas, setFranjas] = useState(false);
  const [avanzado, setAvanzado] = useState(false);
  const [actividadId, setActividadId] = useState(null);
  const [listaActividades, setListaActividades] = useState(false);
  const [modoHoyId, setModoHoyId] = useState('completo');
  /* HT F6 · apartado 5 — *"el contador deberá actualizarse automáticamente sin
     recargar la página"*. Un minuto basta: el número se dice en minutos, así
     que refrescar más a menudo solo gastaría batería. */
  const [minuto, setMinuto] = useState(() => new Date().getMinutes());
  useEffect(() => {
    const t = setInterval(() => setMinuto(new Date().getMinutes()), 60000);
    return () => clearInterval(t);
  }, []);
  // Apartado 59 — las preferencias de vista son de este aparato, así que se leen
  // de `localStorage` una vez y se guardan al cambiarlas. Nunca van a Supabase.
  const [visual, setVisual] = useState(() => leerVisual());
  const cambiarVisual = (v) => setVisual(guardarVisual(v));

  // Apartado 56 — los archivados no salen en el selector, pero siguen en el
  // estado: se recuperan desde Opciones avanzadas.
  const horarios = useMemo(() => (estado ? horariosActivos(estado) : []), [estado]);
  const activo = horarios.find((h) => h.id === horarioId) || horarios[0] || null;
  const columnas = useMemo(() => (activo ? columnasDe(activo) : []), [activo]);
  const rejilla = useMemo(() => (activo ? rejillaSemana(estado, activo.id, { asignaturas }) : { columnas: [], filas: [], celdas: [] }), [estado, activo, asignaturas]);
  const resumen = useMemo(() => (activo ? resumenEditor(estado, activo.id) : null), [estado, activo]);

  /* Cada operación entra por `onCambiar`, que en App.jsx es `snapshotAndSave`:
     guarda y alimenta el "Deshacer" global. Por eso aquí no hay ni botón de
     guardar ni historial propio (apartados 36 y 38). */
  const aplicar = (nuevo) => { onCambiar(nuevo); return { error: null }; };
  const aplicarResultado = (r) => { if (!r.error) onCambiar(r.estado); return r; };

  /* HT F5 — la ficha y su impacto. Los dos son derivados: se recalculan solos
     al cambiar el estado, así que "está en 6 clases" nunca dice 6 cuando
     quedan 4. */
  const ficha = useMemo(
    () => (actividadId ? fichaActividad(estado, actividadId, { asignaturas, estudios, productividad, acento: accent, hoy }) : null),
    [estado, actividadId, asignaturas, estudios, productividad, accent, hoy],
  );
  const impactoActividad = useMemo(
    () => (actividadId ? impactoEliminarActividad(estado, actividadId, { asignaturas, estudios, productividad }) : null),
    [estado, actividadId, asignaturas, estudios, productividad],
  );
  const actividades = useMemo(
    () => actividadesOrdenadas(estado, { asignaturas, incluirArchivadas: true }),
    [estado, asignaturas],
  );

  /* HT F6 · apartado 101 — UNA sola llamada responde las ocho preguntas. Si
     cada tarjeta preguntara por su cuenta, acabarían diciendo cosas distintas.
     `minuto` está en las dependencias a propósito: es lo que hace que
     "termina en 23 min" baje solo. */
  /* HT F7 — la mochila de hoy y la de mañana. Las dos son DERIVADAS: se
     recalculan al cambiar el estado, así que meter algo desde aquí y verlo
     marcado son el mismo dato, no dos. */
  const mochilaHoy = useMemo(() => {
    const m = mochilaDeFecha(estado, fecha, { asignaturas });
    return { mochila: m, progreso: progresoMochila(m) };
  }, [estado, fecha, asignaturas]);
  const fechaManana = useMemo(() => addDays(fecha, 1), [fecha]);
  const mochilaManana = useMemo(() => {
    const m = mochilaDeFecha(estado, fechaManana, { asignaturas });
    return { mochila: m, progreso: progresoMochila(m) };
  }, [estado, fechaManana, asignaturas]);

  const accionesMochila = useMemo(() => ({
    marcar: (el, v) => aplicar(marcarPreparado(estado, fecha, el, v)),
    prepararTodo: () => aplicar(prepararTodo(estado, fecha, { asignaturas })),
    vaciar: () => aplicar(vaciarPreparacion(estado, fecha)),
    anadir: (t) => aplicarResultado(anadirAMano(estado, fecha, t)),
    quitar: (n) => aplicar(quitarDeMochila(estado, fecha, n)),
    marcarManana: (el, v) => aplicar(marcarPreparado(estado, fechaManana, el, v)),
    prepararTodoManana: () => aplicar(prepararTodo(estado, fechaManana, { asignaturas })),
    vaciarManana: () => aplicar(vaciarPreparacion(estado, fechaManana)),
    anadirManana: (t) => aplicarResultado(anadirAMano(estado, fechaManana, t)),
    quitarManana: (n) => aplicar(quitarDeMochila(estado, fechaManana, n)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [estado, fecha, fechaManana, asignaturas]);

  /* HT F8 — el tablón y las automatizaciones. `minuto` está en las
     dependencias porque el estado temporal se CALCULA del reloj: sin él, a las
     11:01 la clase de las 10 seguiría diciendo "ahora". */
  const tablon = useMemo(
    () => tablonDelDia(estado, fecha, { asignaturas, hoy }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [estado, fecha, asignaturas, hoy, minuto],
  );
  const automatizaciones = useMemo(() => {
    const propuestas = previsualizar(estado, fecha, { asignaturas });
    const historial = historialDe(estado).filter((h) => h.fecha === fecha);
    if (!propuestas.length && !historial.length) return null;
    return {
      propuestas,
      historial,
      ejecutar: (p, confirmada) => aplicarResultado(ejecutar(estado, p, { fecha, confirmada })),
      ejecutarTodo: () => aplicar(ejecutarTodo(estado, fecha, { asignaturas }).estado),
      deshacer: (id) => aplicarResultado(deshacer(estado, id)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, fecha, asignaturas]);

  /* HT F9 — los exámenes que vienen y la sobrecarga. Todo derivado; el plan
     se calcula dentro del panel, que es quien sabe cuál está mirando. */
  const examenesProximos = useMemo(() => (estudios?.examenes || [])
    .filter((x) => x.fecha && x.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 5)
    .map((x) => ({
      id: x.id,
      fecha: x.fecha,
      tema: x.tema || '',
      asignatura: (estudios?.asignaturas || []).find((a) => a.id === x.asignaturaId)?.nombre || '',
    })), [estudios, hoy]);

  const planificador = useMemo(() => ({
    estado,
    examenes: examenesProximos,
    hoy,
    asignaturas,
    sobrecarga: detectarSobrecarga(estado, { desde: hoy, dias: 7, hoy, asignaturas, estudios, productividad }),
    /* ⚠️ ESTE es el único camino por el que un plan llega al horario, y exige
       `confirmado: true`. La pantalla lo pide con un botón que dice qué va a
       pasar (regla 7). */
    aplicar: (sesiones) => {
      if (!activo) return { error: 'No hay horario donde ponerlo.' };
      const columnaDe = (fecha) => (activo.columnas || []).find((c) => c.dia === diaDeFecha(fecha));
      let d = estado;
      for (const s of sesiones) {
        const col = columnaDe(s.fecha);
        if (!col) continue;
        d = aplicarPlan(d, [{ tipo: 'CREAR_BLOQUE_ESTUDIO', fecha: s.fecha, inicio: s.inicio, fin: s.fin, texto: s.titulo }],
          { confirmado: true, horarioId: activo.id, columnaId: col.id, hoy }).estado;
      }
      onCambiar(d);
      return { error: null };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [estado, examenesProximos, hoy, asignaturas, estudios, productividad, activo]);

  const contexto = useMemo(
    () => contextoTemporal(estado, { fecha, hoy, asignaturas, estudios, productividad, calendario, horarioId: activo?.id || null }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [estado, fecha, hoy, asignaturas, estudios, productividad, calendario, activo, minuto],
  );

  // Apartado 25 — sin ningún horario, no una pantalla vacía.
  if (!horarios.length) {
    return creando ? (
      <CrearHorario accent={accent} onCancelar={() => setCreando(false)}
        onCrear={(datos) => { const { estado: nuevo, horario } = crearDesdePlantilla(estado, { ...datos, hoy }); onCrearHorario(nuevo); setHorarioId(horario.id); setCreando(false); setEdicion(true); }} />
    ) : (
      <Card className="text-center">
        <Calendar size={22} style={{ color: accent }} className="mx-auto mb-2" />
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Todavía no tienes horario</p>
        <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>
          Elige una plantilla y en unos minutos lo tienes montado.
        </p>
        <PrimaryButton accent={accent} icon={Plus} onClick={() => setCreando(true)}>Crear horario</PrimaryButton>
        {/* Si están todos archivados, esta pantalla sería un callejón sin salida:
            el sitio para recuperarlos está dentro del horario que no hay. */}
        {horariosArchivados(estado).map((h) => (
          <button key={h.id} onClick={() => { onCambiar(archivarHorario(estado, h.id, false)); setHorarioId(h.id); }}
            className="text-[11px] font-semibold mt-3 block mx-auto" style={{ color: accent }}>
            Recuperar «{h.nombre}»
          </button>
        ))}
      </Card>
    );
  }

  const diaVista = vistaDia(estado, fecha, { asignaturas });
  const agenda = vistaAgenda(estado, { desde: fecha, dias: 7, asignaturas });

  return (
    <div className="space-y-3">
      {/* Selector de horario, solo si hay más de uno (apartado 58). */}
      {horarios.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {horarios.map((h) => (
            <button key={h.id} onClick={() => setHorarioId(h.id)}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
              style={h.id === activo?.id
                ? { background: accent, color: COLORS.textOnAccent }
                : { background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>
              {h.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Vistas + HOY (apartados 49 y 50). */}
      <div className="flex items-center gap-1.5">
        {VISTAS_HORARIO.map((v) => (
          <button key={v.id} onClick={() => setVista(v.id)}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
            style={v.id === vista
              ? { background: accent, color: COLORS.textOnAccent }
              : { background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>
            {v.label}
          </button>
        ))}
        <button onClick={() => { setFecha(hoy); setVista('dia'); }}
          className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold ml-auto"
          style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}>
          Hoy
        </button>
      </div>

      {/* HT F5 · apartados 18 y 30 — las actividades tienen que ser alcanzables
          sin pasar por un bloque: una asignatura archivada ya no tiene ninguno,
          y aun así hay que poder abrirla para recuperarla. */}
      {actividades.length > 0 && (
        <button onClick={() => { setListaActividades(!listaActividades); setActividadId(null); }}
          className="flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: listaActividades ? accent : COLORS.textMuted }}>
          <Star size={12} /> {listaActividades ? 'Cerrar asignaturas' : `Tus asignaturas y actividades (${actividades.length})`}
        </button>
      )}

      {listaActividades && !ficha && (
        <Card>
          {actividades.map((a, i) => (
            <ListRow key={a.id} last={i === actividades.length - 1} onClick={() => setActividadId(a.id)}>
              <span className="text-sm leading-none" aria-hidden="true">{iconoDe(a)}</span>
              <span className="text-xs font-semibold flex-1 truncate"
                style={{ color: a.estado === 'activa' ? COLORS.text : COLORS.textMuted }}>
                {a.titulo}
              </span>
              {a.favorita && <Star size={11} style={{ color: accent }} fill={accent} />}
              <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                {a.estado === 'archivada' ? 'Archivada'
                  : a.estado === 'oculta' ? 'Oculta'
                    : a.usos ? `${a.usos} ${plural(a.usos, 'clase', 'clases')}` : 'Sin usar'}
              </span>
            </ListRow>
          ))}
        </Card>
      )}

      {/* Apartado 35 — el interruptor entre consulta y edición. */}
      <div className="flex items-center gap-2">
        <button onClick={() => setEdicion(!edicion)}
          className="flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: edicion ? accent : COLORS.textMuted }}>
          <Pencil size={12} /> {edicion ? 'Terminar de editar' : 'Editar horario'}
        </button>
        {resumen?.conflictos > 0 && (
          <span className="flex items-center gap-1 text-[11px] ml-auto" style={{ color: COLORS.negative }}>
            <AlertTriangle size={11} /> {resumen.conflictos} {plural(resumen.conflictos, 'choque', 'choques')}
          </span>
        )}
      </div>

      {celda && (
        <NuevoBloque
          estado={estado} columna={celda.columna} fila={celda.fila} accent={accent} asignaturas={asignaturas}
          onCerrar={() => setCelda(null)}
          onCrear={(texto, forzar) => aplicarResultado(crearBloqueRapido(estado, {
            horarioId: activo.id, columnaId: celda.columna.id, filaId: celda.fila.id, texto, asignaturas, forzar, hoy,
          }))}
        />
      )}

      {/* HT F5 · apartado 29 — tocar una actividad abre su ficha entera. */}
      {ficha && impactoActividad && (
        <FichaActividad
          ficha={ficha} accent={accent} impacto={impactoActividad}
          onCerrar={() => setActividadId(null)}
          onEditar={(campos) => aplicar(editarActividad(estado, actividadId, campos))}
          onFavorita={() => aplicar(alternarFavorita(estado, actividadId))}
          onArchivar={() => aplicar(archivarActividad(estado, actividadId, ficha.estado !== 'Archivada'))}
          onDuplicar={() => aplicarResultado(duplicarActividad(estado, actividadId, { hoy }))}
          onEliminar={() => { aplicar(eliminarActividadDefinitiva(estado, actividadId)); setActividadId(null); }}
        />
      )}

      {bloque && (
        <PanelBloque
          bloque={bloque} columnas={columnas} accent={accent}
          onAbrirActividad={(id) => { setBloque(null); setActividadId(id); }}
          fecha={vista === 'semana' ? null : fecha}
          onCerrar={() => setBloque(null)}
          onEditar={(id, cambios, opciones) => aplicarResultado(editarBloque(estado, id, cambios, opciones))}
          onMover={(id, columnaId) => aplicarResultado(moverBloque(estado, id, { columnaId }))}
          onDuplicar={(id, columnaId) => aplicarResultado(duplicarBloque(estado, id, { columnaId, hoy }))}
          onEliminar={(id) => aplicar(eliminarBloque(estado, id))}
        />
      )}

      {menuColumna && (
        <MenuColumna
          columna={menuColumna} estado={estado} horarioId={activo.id} columnas={columnas} accent={accent}
          onCerrar={() => setMenuColumna(null)}
          onMover={(id, dir) => aplicar(moverColumna(estado, activo.id, id, dir))}
          onOcultar={(id) => aplicar(alternarColumna(estado, activo.id, id))}
          onDuplicarDia={(origen, destinoId, forzar) => aplicarResultado(duplicarDia(estado, activo.id, origen, destinoId, { hoy, forzar }))}
          onVaciar={(id) => aplicar(vaciarDia(estado, activo.id, id).estado)}
          onEliminar={(id) => aplicar({
            ...estado,
            horarios: estado.horarios.map((h) => (h.id === activo.id ? { ...h, columnas: h.columnas.filter((c) => c.id !== id) } : h)),
            bloques: estado.bloques.filter((b) => b.columnaId !== id),
          })}
        />
      )}

      {vista === 'hoy' && (
        <HoyView
          contexto={contexto} accent={accent} modo={modoHoyId} onModo={setModoHoyId}
          opcionesFecha={opcionesReprogramar(hoy)}
          onCompletarTarea={onCompletarTarea}
          onReprogramar={onReprogramarTarea}
          onAbrirBloque={(ev) => setBloque({ ...ev, id: ev.bloqueId })}
          onIrAFecha={(f) => { setFecha(f); setVista('dia'); }}
          mochilaHoy={mochilaHoy} mochilaManana={mochilaManana} accionesMochila={accionesMochila}
          tablon={tablon} automatizaciones={automatizaciones} planificador={planificador}
          onCompletar={(ev, v) => aplicar(marcarCompletada(estado, ev, fecha, v))}
        />
      )}

      {vista === 'semana' && (
        <Card>
          <Cuadricula
            rejilla={rejilla} accent={accent} edicion={edicion} visual={visual}
            onCelda={(columna, fila) => { setBloque(null); setMenuColumna(null); setCelda({ columna, fila }); }}
            onBloque={(b) => { setCelda(null); setMenuColumna(null); setBloque(b); }}
            onMenuColumna={(c) => { setCelda(null); setBloque(null); setMenuColumna(c); }}
          />
        </Card>
      )}

      {vista === 'dia' && (
        <>
          <div className="flex items-center justify-between">
            <button onClick={() => setFecha(addDays(fecha, -1))} className="p-1.5" aria-label="Día anterior">
              <ChevronLeft size={16} style={{ color: COLORS.textMuted }} />
            </button>
            <p className="text-xs font-semibold" style={{ color: COLORS.text }}>
              {DIAS_SEMANA[(diaDeFecha(fecha) || 1) - 1]?.label} {fechaCorta(fecha)}
            </p>
            <button onClick={() => setFecha(addDays(fecha, 1))} className="p-1.5" aria-label="Día siguiente">
              <ChevronRight size={16} style={{ color: COLORS.textMuted }} />
            </button>
          </div>
          <Card>
            {diaVista.eventos.length === 0 ? (
              <p className="text-xs text-center py-2" style={{ color: COLORS.textMuted }}>Nada este día.</p>
            ) : diaVista.eventos.map((ev, i) => (
              <ListRow key={`${ev.bloqueId || i}`} last={i === diaVista.eventos.length - 1}
                onClick={() => ev.bloqueId && setBloque({ ...ev, id: ev.bloqueId })}>
                <span className="text-[11px] font-semibold" style={{ color: COLORS.textMuted, width: 42 }}>{ev.inicio}</span>
                <span className="text-xs font-semibold flex-1 truncate" style={{ color: COLORS.text }}>{ev.titulo}</span>
                {ev.origen !== 'horario' && (
                  <span className="text-[10px]" style={{ color: accent }}>cambiado</span>
                )}
              </ListRow>
            ))}
          </Card>
        </>
      )}

      {vista === 'agenda' && (
        <Card>
          {agenda.map((d) => (
            <div key={d.fecha} className="mb-2">
              <p className="text-[11px] font-semibold mb-1" style={{ color: COLORS.textMuted }}>
                {d.nombreDia} {fechaCorta(d.fecha)}
              </p>
              {d.eventos.length === 0
                ? <p className="text-[11px] pl-2" style={{ color: COLORS.textMuted, opacity: 0.6 }}>Libre</p>
                : d.eventos.map((ev, i) => (
                  <p key={`${ev.bloqueId || i}`} className="text-xs pl-2" style={{ color: COLORS.text }}>
                    {ev.inicio} — {ev.titulo}
                  </p>
                ))}
            </div>
          ))}
        </Card>
      )}

      {edicion && vista === 'semana' && (
        <>
          <div className="flex flex-wrap gap-1.5">
            <Accion icono={Plus} label="Añadir día" onClick={() => aplicar(anadirColumna(estado, activo.id, { nombre: `Columna ${columnas.length + 1}` }))} />
            <Accion icono={Plus} label="Franjas" onClick={() => setFranjas(!franjas)} />
            <Accion icono={Plus} label="Otro horario" onClick={() => setCreando(true)} />
            {/* Apartado 63 — toda la potencia detrás de un botón, para no
                complicar la cuadrícula de todos los días. */}
            <Accion icono={GripVertical} label={avanzado ? 'Cerrar opciones' : 'Opciones avanzadas'} onClick={() => setAvanzado(!avanzado)} />
          </div>
          {avanzado && (
            <PanelAvanzado
              estado={estado} horario={activo} accent={accent} asignaturas={asignaturas}
              visual={visual} hoy={hoy} onVisual={cambiarVisual}
              onCambiar={aplicar} onResultado={aplicarResultado}
            />
          )}
          {franjas && (
            <PanelFranjas
              horario={activo} estado={estado} accent={accent}
              onAnadir={() => aplicar(anadirFila(estado, activo.id))}
              onEditar={(filaId, cambios) => aplicar(editarFila(estado, activo.id, filaId, cambios))}
              onEliminar={(filaId) => aplicar(eliminarFila(estado, activo.id, filaId))}
            />
          )}
          {creando && (
            <CrearHorario accent={accent} onCancelar={() => setCreando(false)}
              onCrear={(datos) => { const { estado: nuevo, horario } = crearDesdePlantilla(estado, { ...datos, hoy }); onCrearHorario(nuevo); setHorarioId(horario.id); setCreando(false); }} />
          )}
        </>
      )}
    </div>
  );
}
