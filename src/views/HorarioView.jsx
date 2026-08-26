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

import React, { useMemo, useState } from 'react';
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
  estudios = null, productividad = null,
  onCambiar, onCrearHorario,
}) {
  const estado = horarioTop;
  const [horarioId, setHorarioId] = useState(null);
  const [vista, setVista] = useState('semana');
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
