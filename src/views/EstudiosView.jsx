import React, { useState, useEffect } from 'react';
import { GraduationCap, Clock, Plus, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, HelpCircle, TrendingUp, Loader2, Sparkles, X, Eye, EyeOff, Pencil } from 'lucide-react';
import { COLORS } from '../tokens';
import { uid, formatFecha, todayISO, hexToRgba } from '../lib/helpers';
import { askAI, AI_SYSTEM } from '../lib/ai';
import { correlacionSuenoEstudio } from '../lib/correlaciones';
import {
  ICONOS_ESTUDIOS, ICONO_POR_DEFECTO, sugerirIcono, iconoDeApp,
  MAX_NOMBRE_APP, crearApp, nombreYaUsado, moverApp, AVISO_OCULTAR, alternarOcultaApp,
  appsOrdenadas, appsVisibles,
  asignaturasDe, examenesDe, horasDe, ramasDeApp, ramaPorId, lineaDeApp, proximosEventos,
  RUTA_RAIZ, abrirApp, abrirRama, abrirAsignatura, abrirSeccion, atras, migas,
  TIPOS_ESTUDIO, MAX_NOMBRE_RAMA, ICONO_RAMA_POR_DEFECTO, sugerenciasDeRama,
  crearRama, anadirRama, quitarRama, AVISO_QUITAR_RAMA, TEXTO_RAMA_SIN_SISTEMA,
} from '../lib/estudiosApps';
import {
  ACENTOS_COLECCION, ICONOS_ASIGNATURA, ICONO_ASIGNATURA_POR_DEFECTO, sugerirIconoAsignatura,
  iconoDeAsignatura, MAX_NOMBRE_ASIGNATURA, MAX_NOMBRE_TEMA, MAX_DESCRIPCION_TEMA,
  estadoTema, crearAsignatura, editarAsignatura, alternarOcultaAsignatura, AVISO_OCULTAR_ASIGNATURA,
  asignaturasOrdenadas, asignaturasVisibles, moverAsignatura,
  temasDe, crearTema, editarTema, avanzarTema, moverTema,
  resumenAsignatura, lineaDeAsignatura, seccionesDeAsignatura, impactoDeEliminarAsignatura,
} from '../lib/asignaturas';
import {
  TIPOS_EVENTO_ACADEMICO, TIPO_EVENTO_POR_DEFECTO, tipoEventoAcademico, tipoDeFecha,
  ESTADOS_EXAMEN, ESTADOS_ENTREGA, estadoExamen, estadoEntrega,
  MAX_NOMBRE_FECHA, MAX_NOTAS_FECHA, cuentaAtras, fechasAcademicas,
  crearEntrega, crearEventoAcademico, editarExamenFecha, editarEntrega, editarEventoAcademico,
  cambiarEstadoExamen, cambiarEstadoEntrega, impactoDeEliminarFecha,
} from '../lib/fechasAcademicas';
import { Card, SectionTitle, Field, TextInput, SelectInput, PrimaryButton, BotonBorrar, EmptyHint, AIPanel } from '../components/ui';

function diasHasta(fechaISO) {
  return Math.ceil((new Date(fechaISO + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/* ---------- Explicar un concepto con IA ----------
   Caja de pregunta libre — a diferencia del resto de paneles de IA de la app (que mandan un
   prompt ya construido a partir de los datos), aquí el texto lo escribe el usuario. Sigue
   disparándose solo con un toque explícito, nunca automáticamente. */
function ExplicarConcepto({ accent }) {
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const preguntar = async () => {
    if (!pregunta.trim()) return;
    setLoading(true);
    setError('');
    setRespuesta('');
    try {
      const texto = await askAI(
        AI_SYSTEM,
        `Josué (16 años, 1º de Bachillerato de Ciencias, rama Biología, y estudiante de música) te pide que le expliques ` +
        `este concepto de forma clara y breve, con un ejemplo si ayuda: "${pregunta.trim()}"`
      );
      setRespuesta(texto || 'No he podido generar una explicación ahora mismo.');
    } catch (e) {
      setError(e.message || 'No he podido conectar con la IA ahora mismo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <p className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: COLORS.text }}>
        <HelpCircle size={16} style={{ color: accent }} /> Explícame un concepto
      </p>
      <div className="flex items-center gap-2">
        <TextInput
          value={pregunta} onChange={(e) => setPregunta(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && preguntar()}
          placeholder="Ej: la meiosis, un acorde disminuido..."
        />
        <div style={{ width: 84, flexShrink: 0 }}>
          <PrimaryButton accent={accent} disabled={loading || !pregunta.trim()} onClick={preguntar}>
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Preguntar'}
          </PrimaryButton>
        </div>
      </div>
      {error && <p className="text-xs mt-2" style={{ color: COLORS.negative }}>{error}</p>}
      {respuesta && <p className="text-sm mt-3 leading-relaxed" style={{ color: COLORS.text }}>{respuesta}</p>}
    </Card>
  );
}

/* ---------- Plan de repaso de un examen ----------
   La IA genera una lista de pasos (JSON) contando hacia atrás desde la fecha del examen; el
   usuario los marca, edita o borra después — mismo patrón ya usado para la progresión de
   calistenia en la Fase 5 (JSON parseado y editable, no un bloque de texto fijo). */
function PlanRepaso({ examen, onUpdatePlan, accent }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const plan = examen.planRepaso || [];

  const generar = async () => {
    setLoading(true);
    setError('');
    try {
      const dias = diasHasta(examen.fecha);
      const texto = await askAI(
        AI_SYSTEM,
        `Examen "${examen.tema || 'sin tema especificado'}" dentro de ${dias} días (${examen.fecha}). ` +
        `Nota objetivo: ${examen.notaObjetivo || 'sin especificar'}. Genera un plan de repaso realista repartido ` +
        `en pasos, priorizado por lo que queda de tiempo. Responde ÚNICAMENTE con un JSON válido, sin texto ni ` +
        `markdown alrededor, con este formato exacto: {"pasos": ["paso 1", "paso 2", "..."]}. Entre 3 y 7 pasos, ` +
        `nunca más de los que quepan razonablemente en ${dias} días.`
      );
      const limpio = texto.replace(/```json|```/g, '').trim();
      const json = JSON.parse(limpio);
      const pasos = (json.pasos || []).map((texto) => ({ id: uid(), texto, hecho: false }));
      onUpdatePlan([...plan, ...pasos]);
    } catch (e) {
      setError('No he podido generar el plan ahora mismo. Puedes añadir pasos a mano abajo.');
    } finally {
      setLoading(false);
    }
  };

  const [pasoManual, setPasoManual] = useState('');
  const anadirManual = () => {
    if (!pasoManual.trim()) return;
    onUpdatePlan([...plan, { id: uid(), texto: pasoManual.trim(), hecho: false }]);
    setPasoManual('');
  };
  const toggle = (id) => onUpdatePlan(plan.map((p) => (p.id === id ? { ...p, hecho: !p.hecho } : p)));
  const borrar = (id) => onUpdatePlan(plan.filter((p) => p.id !== id));

  return (
    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Plan de repaso</p>
        {plan.length === 0 && (
          <button onClick={generar} disabled={loading} className="flex items-center gap-1 text-xs font-semibold disabled:opacity-60" style={{ color: accent }}>
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {loading ? 'Generando…' : 'Generar con IA'}
          </button>
        )}
      </div>
      {error && <p className="text-xs mb-2" style={{ color: COLORS.negative }}>{error}</p>}
      <div className="space-y-1.5">
        {plan.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <input type="checkbox" checked={p.hecho} onChange={() => toggle(p.id)} />
            <span className="text-xs flex-1" style={{ color: p.hecho ? COLORS.textMuted : COLORS.text, textDecoration: p.hecho ? 'line-through' : 'none' }}>
              {p.texto}
            </span>
            <button onClick={() => borrar(p.id)} aria-label="Borrar paso"><Trash2 size={12} style={{ color: COLORS.textMuted }} /></button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <TextInput value={pasoManual} onChange={(e) => setPasoManual(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && anadirManual()} placeholder="Añadir paso a mano" />
        <button onClick={anadirManual} className="p-2.5 rounded-xl" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }} aria-label="Añadir paso">
          <Plus size={14} style={{ color: COLORS.text }} />
        </button>
      </div>
    </div>
  );
}

function ExamenItem({ examen, onUpdate, onDelete, accent, forzarAbierta, onFocoConsumido }) {
  const [abierto, setAbierto] = useState(false);
  const dias = diasHasta(examen.fecha);

  // Ampliación del Dashboard — Centro de Control (apartado 6: "Examen de Biología — 3 días →
  // abrir directamente el examen") — `forzarAbierta` lo decide el padre (AsignaturaCard), que ya
  // sabe si el deep-link pendiente apunta a este examen en concreto.
  useEffect(() => {
    if (forzarAbierta) {
      setAbierto(true);
      const el = document.getElementById(`examen-${examen.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      onFocoConsumido && onFocoConsumido();
    }
  }, [forzarAbierta]);

  return (
    <Card id={`examen-${examen.id}`} style={{ padding: '0.9rem' }}>
      <button onClick={() => setAbierto((a) => !a)} className="w-full flex items-center justify-between text-left">
        <div>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{examen.tema || 'Examen'}</p>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
            {formatFecha(examen.fecha)} · {dias >= 0 ? `en ${dias} días` : 'ya pasó'}
            {examen.notaObjetivo && ` · objetivo: ${examen.notaObjetivo}`}
            {examen.notaObtenida && ` · obtenida: ${examen.notaObtenida}`}
          </p>
        </div>
        {abierto ? <ChevronUp size={16} style={{ color: COLORS.textMuted }} /> : <ChevronDown size={16} style={{ color: COLORS.textMuted }} />}
      </button>

      {abierto && (
        <>
          {dias < 0 && !examen.notaObtenida && (
            <div className="mt-3">
              <Field label="Nota obtenida (opcional, ya pasó el examen)">
                <TextInput value={examen.notaObtenida || ''} onChange={(e) => onUpdate({ ...examen, notaObtenida: e.target.value })} />
              </Field>
            </div>
          )}
          <PlanRepaso examen={examen} onUpdatePlan={(plan) => onUpdate({ ...examen, planRepaso: plan })} accent={accent} />
          <button onClick={() => onDelete(examen.id)} className="text-xs mt-3" style={{ color: COLORS.negative }}>Borrar examen</button>
        </>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ENTREGA 3 · ES FASE 3 — ASIGNATURAS Y GESTIÓN ACADÉMICA
   ══════════════════════════════════════════════════════════════════════════

   🚨 `AsignaturaCard` —el acordeón que metía exámenes y horas dentro de la lista—
   **ya no existe**: el apartado 14 dice *"no volver a la estructura antigua de
   página larga"*. Sus dos funciones **no se han perdido**, se han mudado a la
   pantalla de la asignatura, que es donde el árbol las pone. */

function FilaAsignatura({ asignatura, linea, accent, onAbrir }) {
  const col = asignatura.acento ? (COLORS[asignatura.acento] || accent) : accent;
  return (
    <button
      onClick={onAbrir}
      className="w-full rounded-2xl p-3 flex items-center gap-2.5 text-left transition-transform active:scale-[0.99]"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <span aria-hidden="true" style={{ fontSize: 22 }}>{iconoDeAsignatura(asignatura)}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold truncate" style={{ color: COLORS.text }}>{asignatura.nombre}</span>
        {/* Apartado 9 — el profesor y el aula son información SECUNDARIA: nunca compiten con
            los exámenes ni con el contenido. */}
        {linea
          ? <span className="block text-xs truncate" style={{ color: col }}>{linea}</span>
          : (asignatura.profesor || asignatura.aula)
            ? <span className="block text-xs truncate" style={{ color: COLORS.textMuted }}>{[asignatura.profesor, asignatura.aula].filter(Boolean).join(' · ')}</span>
            : null}
      </span>
      <ChevronRight size={16} style={{ color: COLORS.textMuted }} />
    </button>
  );
}

/* Apartado 2 — crear una asignatura. ⚠️ Solo el nombre es obligatorio: *"los datos secundarios no
   deben ser obligatorios"*. Sirve también para editar. */
function FormAsignatura({ accent, inicial, onGuardar, onCerrar }) {
  const [nombre, setNombre] = useState(inicial?.nombre || '');
  const [icono, setIcono] = useState(inicial?.icono || '');
  const [acento, setAcento] = useState(inicial?.acento || '');
  const [profesor, setProfesor] = useState(inicial?.profesor || '');
  const [aula, setAula] = useState(inicial?.aula || '');
  const propuesto = icono || sugerirIconoAsignatura(nombre) || ICONO_ASIGNATURA_POR_DEFECTO;

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
          {inicial ? 'Editar asignatura' : 'Nueva asignatura'}
        </p>
        <button onClick={onCerrar} className="toque-44 p-1.5 -m-1.5" aria-label="Cerrar">
          <X size={16} style={{ color: COLORS.textMuted }} />
        </button>
      </div>

      <Field label="Nombre">
        <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={MAX_NOMBRE_ASIGNATURA} placeholder="Ej: Biología" />
      </Field>

      <Field label="Icono">
        <div className="flex items-center gap-2 mb-2">
          <span aria-hidden="true" style={{ fontSize: 24 }}>{propuesto}</span>
          <TextInput value={icono} onChange={(e) => setIcono(e.target.value)} placeholder="O pega el que quieras" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ICONOS_ASIGNATURA.map((ic) => (
            <button
              key={ic} onClick={() => setIcono(ic)} aria-label={`Usar el icono ${ic}`} aria-pressed={icono === ic}
              className="toque-44 rounded-xl transition-transform active:scale-90"
              style={{
                fontSize: 18, width: 38, height: 38,
                background: icono === ic ? hexToRgba(accent, 0.16) : COLORS.surface2,
                border: `1px solid ${icono === ic ? accent : COLORS.border}`,
              }}
            >{ic}</button>
          ))}
        </div>
      </Field>

      {/* ⚠️ El acento se guarda como TOKEN, nunca como hex: un hex se queda fijo cuando Josué
          cambia de tema (regla 2). Es el catálogo de la BL F7, no uno nuevo. */}
      <Field label="Color (opcional)">
        <div className="flex flex-wrap gap-1.5">
          {ACENTOS_COLECCION.map((a) => (
            <button
              key={a.id} onClick={() => setAcento(acento === a.id ? '' : a.id)} aria-pressed={acento === a.id}
              className="toque-44 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-transform active:scale-95"
              style={{
                background: acento === a.id ? hexToRgba(accent, 0.16) : COLORS.surface2,
                border: `1px solid ${acento === a.id ? accent : COLORS.border}`,
                color: COLORS[a.id] || accent,
              }}
            >{a.nombre}</button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Profesor (opcional)">
          <TextInput value={profesor} onChange={(e) => setProfesor(e.target.value)} placeholder="Ej: Marta" />
        </Field>
        <Field label="Aula (opcional)">
          <TextInput value={aula} onChange={(e) => setAula(e.target.value)} placeholder="Ej: 204" />
        </Field>
      </div>

      <PrimaryButton accent={accent} disabled={!nombre.trim()} onClick={() => onGuardar({ nombre, icono, acento, profesor, aula })}>
        {inicial ? 'Guardar' : 'Crear asignatura'}
      </PrimaryButton>
    </Card>
  );
}

/* Apartados 5, 6 y 7 — el contenido por temas. Tres estados, con icono y palabra: el color nunca
   va solo (EH F42). */
function FilaTema({ tema, primero, ultimo, accent, onAvanzar, onEditar, onSubir, onBajar, onEliminar }) {
  const est = estadoTema(tema.estado);
  const col = est.acento ? (COLORS[est.acento] || accent) : COLORS.textMuted;
  return (
    <div className="rounded-2xl p-2.5 flex items-center gap-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      <button
        onClick={onAvanzar} className="toque-44 p-1.5 -m-1.5 flex items-center gap-1.5"
        aria-label={`${tema.nombre}: ${est.nombre}. Cambiar de estado`}
      >
        <span aria-hidden="true" style={{ color: col, fontSize: 16 }}>{est.icono}</span>
      </button>
      <span className="min-w-0 flex-1">
        <span className="block text-sm truncate" style={{ color: COLORS.text, textDecoration: tema.estado === 'completado' ? 'line-through' : 'none' }}>
          {tema.nombre}
        </span>
        <span className="block text-[11px] truncate" style={{ color: col }}>
          {est.nombre}{tema.descripcion ? ` · ${tema.descripcion}` : ''}
        </span>
      </span>
      <button onClick={onSubir} disabled={primero} className="toque-44 p-1.5 -m-1.5 disabled:opacity-30" aria-label={`Subir ${tema.nombre}`}>
        <ChevronUp size={15} style={{ color: COLORS.textMuted }} />
      </button>
      <button onClick={onBajar} disabled={ultimo} className="toque-44 p-1.5 -m-1.5 disabled:opacity-30" aria-label={`Bajar ${tema.nombre}`}>
        <ChevronDown size={15} style={{ color: COLORS.textMuted }} />
      </button>
      <button onClick={onEditar} className="toque-44 p-1.5 -m-1.5" aria-label={`Editar ${tema.nombre}`}>
        <Pencil size={14} style={{ color: COLORS.textMuted }} />
      </button>
      <BotonBorrar onClick={onEliminar} label={`Eliminar el tema ${tema.nombre}`} />
    </div>
  );
}

function FormTema({ accent, inicial, onGuardar, onCerrar }) {
  const [nombre, setNombre] = useState(inicial?.nombre || '');
  const [descripcion, setDescripcion] = useState(inicial?.descripcion || '');
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{inicial ? 'Editar tema' : 'Nuevo tema'}</p>
        <button onClick={onCerrar} className="toque-44 p-1.5 -m-1.5" aria-label="Cerrar">
          <X size={16} style={{ color: COLORS.textMuted }} />
        </button>
      </div>
      <Field label="Nombre">
        <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={MAX_NOMBRE_TEMA} placeholder="Ej: Tema 1 — La célula" />
      </Field>
      <Field label="Descripción (opcional)">
        <TextInput value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={MAX_DESCRIPCION_TEMA} placeholder="Lo que quieras recordar" />
      </Field>
      <PrimaryButton accent={accent} disabled={!nombre.trim()} onClick={() => onGuardar({ nombre, descripcion })}>
        {inicial ? 'Guardar' : 'Crear tema'}
      </PrimaryButton>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ENTREGA 3 · ES FASE 4 — EXÁMENES, ENTREGAS Y FECHAS
   ══════════════════════════════════════════════════════════════════════════

   🚨 Apartado 12: *"No depender únicamente del color. El icono y el texto deben
   indicar claramente el tipo."* Por eso cada fila lleva su icono Y su palabra. */

function FilaFecha({ fila, nombreAsignatura, accent, onAbrir }) {
  const t = tipoDeFecha(fila.tipo);
  const est = fila.tipo === 'examen' ? estadoExamen(fila.estado)
    : fila.tipo === 'entrega' ? estadoEntrega(fila.estado) : null;
  const colEst = est?.acento ? (COLORS[est.acento] || accent) : COLORS.textMuted;
  const cuenta = cuentaAtras(fila.fecha);

  return (
    <button
      onClick={onAbrir}
      className="w-full rounded-2xl p-3 flex items-center gap-2.5 text-left transition-transform active:scale-[0.99]"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <span aria-hidden="true" style={{ fontSize: 20 }}>{t?.icono || '📅'}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold truncate" style={{ color: COLORS.text }}>{fila.nombre}</span>
        <span className="block text-[11px] truncate" style={{ color: COLORS.textMuted }}>
          {/* El TIPO en palabra, nunca solo el color. */}
          {t?.nombre}
          {fila.subtipo && fila.subtipo !== 'otro' ? ` · ${tipoEventoAcademico(fila.subtipo).nombre}` : ''}
          {nombreAsignatura ? ` · ${nombreAsignatura}` : ''}
          {fila.fecha ? ` · ${formatFecha(fila.fecha)}` : ' · Sin fecha'}
          {fila.hora ? ` · ${fila.hora}` : ''}
        </span>
        {est && (
          <span className="block text-[11px]" style={{ color: colEst }}>{est.icono} {est.nombre}</span>
        )}
      </span>
      {cuenta && <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: accent }}>{cuenta}</span>}
    </button>
  );
}

/* Apartados 2, 4, 6 y 18 — un formulario corto: *"Añadir → seleccionar asignatura → fecha →
   guardar"*. Sirve para crear y para editar los tres tipos. */
function FormFecha({ accent, tipo, asignaturas, inicial, asignaturaFija, onGuardar, onCerrar }) {
  const [nombre, setNombre] = useState(inicial?.nombre || '');
  const [asignaturaId, setAsignaturaId] = useState(inicial?.asignaturaId || asignaturaFija || '');
  const [fecha, setFecha] = useState(inicial?.fecha || todayISO());
  const [hora, setHora] = useState(inicial?.hora || '');
  const [notas, setNotas] = useState(inicial?.notas || '');
  const [subtipo, setSubtipo] = useState(inicial?.subtipo || TIPO_EVENTO_POR_DEFECTO);
  const t = tipoDeFecha(tipo);

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
          {inicial ? `Editar ${t.nombre.toLowerCase()}` : `${t.icono} Nuevo/a ${t.nombre.toLowerCase()}`}
        </p>
        <button onClick={onCerrar} className="toque-44 p-1.5 -m-1.5" aria-label="Cerrar">
          <X size={16} style={{ color: COLORS.textMuted }} />
        </button>
      </div>

      <Field label="Nombre">
        <TextInput
          value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={MAX_NOMBRE_FECHA}
          placeholder={tipo === 'examen' ? 'Ej: Derivadas' : tipo === 'entrega' ? 'Ej: Trabajo de Historia' : 'Ej: Exposición de clase'}
        />
      </Field>

      {/* Si se crea desde una asignatura no se vuelve a preguntar: el contexto viaja (E3 F9). */}
      {!asignaturaFija && (
        <Field label="Asignatura">
          <SelectInput value={asignaturaId} onChange={(e) => setAsignaturaId(e.target.value)}>
            <option value="">Elige una asignatura</option>
            {asignaturas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </SelectInput>
        </Field>
      )}

      {tipo === 'evento' && (
        <Field label="Tipo">
          <SelectInput value={subtipo} onChange={(e) => setSubtipo(e.target.value)}>
            {TIPOS_EVENTO_ACADEMICO.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </SelectInput>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label={tipo === 'entrega' ? 'Fecha límite' : 'Fecha'}>
          <TextInput type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
        <Field label="Hora (opcional)">
          <TextInput type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </Field>
      </div>

      <Field label="Notas (opcional)">
        <TextInput value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={MAX_NOTAS_FECHA} placeholder="Lo que quieras recordar" />
      </Field>

      <PrimaryButton
        accent={accent}
        disabled={!nombre.trim() || !(asignaturaFija || asignaturaId)}
        onClick={() => onGuardar({ nombre, asignaturaId: asignaturaFija || asignaturaId, fecha, hora, notas, tipo: subtipo })}
      >
        {inicial ? 'Guardar' : 'Crear'}
      </PrimaryButton>
    </Card>
  );
}

/* Apartado 13 — la vista de detalle, con sus dos acciones. */
function DetalleFecha({ fila, nombreAsignatura, accent, onEstado, onEditar, onEliminar, onCerrar }) {
  const t = tipoDeFecha(fila.tipo);
  const estados = fila.tipo === 'examen' ? ESTADOS_EXAMEN : fila.tipo === 'entrega' ? ESTADOS_ENTREGA : null;
  const actual = fila.tipo === 'examen' ? estadoExamen(fila.estado) : fila.tipo === 'entrega' ? estadoEntrega(fila.estado) : null;
  const impacto = impactoDeEliminarFecha(fila);
  const [confirmar, setConfirmar] = useState(false);
  const cuenta = cuentaAtras(fila.fecha);

  return (
    <Card>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-bold min-w-0" style={{ color: COLORS.text }}>
          <span aria-hidden="true">{t?.icono}</span> {fila.nombre}
        </p>
        <button onClick={onCerrar} className="toque-44 p-1.5 -m-1.5" aria-label="Cerrar">
          <X size={16} style={{ color: COLORS.textMuted }} />
        </button>
      </div>
      <p className="text-xs" style={{ color: COLORS.textMuted }}>
        {t?.nombre}
        {fila.subtipo && fila.subtipo !== 'otro' ? ` · ${tipoEventoAcademico(fila.subtipo).nombre}` : ''}
        {nombreAsignatura ? ` · ${nombreAsignatura}` : ''}
        {fila.fecha ? ` · ${formatFecha(fila.fecha)}` : ' · Sin fecha'}
        {fila.hora ? ` · ${fila.hora}` : ''}
        {cuenta ? ` · ${cuenta}` : ''}
      </p>
      {fila.notas && <p className="text-sm mt-2 leading-relaxed" style={{ color: COLORS.text }}>{fila.notas}</p>}

      {estados && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {estados.map((e) => (
            <button
              key={e.id} onClick={() => onEstado(e.id)} aria-pressed={actual?.id === e.id}
              className="toque-44 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-transform active:scale-95"
              style={{
                background: actual?.id === e.id ? hexToRgba(accent, 0.16) : COLORS.surface2,
                border: `1px solid ${actual?.id === e.id ? accent : COLORS.border}`,
                color: actual?.id === e.id ? accent : COLORS.textMuted,
              }}
            >{e.icono} {e.nombre}</button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-3">
        <button onClick={onEditar} className="text-xs font-semibold" style={{ color: accent }}>Editar</button>
        <button onClick={() => setConfirmar(true)} className="text-xs font-semibold" style={{ color: COLORS.negative }}>Eliminar</button>
      </div>

      {/* Apartado 15 — se confirma, y se dice que se recupera: va a la papelera. */}
      {confirmar && (
        <div className="mt-3 rounded-2xl p-2.5" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
          <p className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>{impacto.aviso}</p>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={() => setConfirmar(false)} className="flex-1 rounded-xl py-2 text-xs font-semibold" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.text }}>
              Cancelar
            </button>
            <button onClick={onEliminar} className="flex-1 rounded-xl py-2 text-xs font-semibold" style={{ background: COLORS.negative, color: COLORS.textOnAccent }}>
              Eliminar
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

/* El panel de una lista de fechas. Lo usan **las seis pantallas** que enseñan fechas —las tres del
   área y las tres de una asignatura—, porque el apartado 19 dice que hay un solo registro visto
   desde muchos sitios: seis copias de esta lista serían seis sitios donde equivocarse. */
function PanelFechas({ tipo, filas, asignaturas, accent, asignaturaFija, abierta, onAbrir,
  onCrear, onEditar, onEstado, onEliminar }) {
  const [form, setForm] = useState(null); // null | 'nueva' | id
  const t = tipoDeFecha(tipo);
  const nombreDe = (id) => asignaturas.find((a) => a.id === id)?.nombre || '';
  const enDetalle = filas.find((f) => f.id === abierta) || null;

  return (
    <>
      {filas.length === 0 && !form && (
        <EmptyHint text={`Todavía no hay ${t.nombre.toLowerCase()}s aquí.`} />
      )}

      <div className="space-y-1.5">
        {filas.map((f) => (
          form === f.id ? (
            <FormFecha
              key={f.id} accent={accent} tipo={tipo} asignaturas={asignaturas} inicial={f}
              asignaturaFija={f.asignaturaId}
              onGuardar={(datos) => { onEditar(f.id, datos); setForm(null); }}
              onCerrar={() => setForm(null)}
            />
          ) : (
            <div key={f.id}>
              <FilaFecha
                fila={f} nombreAsignatura={nombreDe(f.asignaturaId)} accent={accent}
                onAbrir={() => onAbrir(abierta === f.id ? null : f.id)}
              />
              {enDetalle?.id === f.id && (
                <div className="mt-1.5">
                  <DetalleFecha
                    fila={f} nombreAsignatura={nombreDe(f.asignaturaId)} accent={accent}
                    onEstado={(e) => onEstado(f.id, e)}
                    onEditar={() => { setForm(f.id); onAbrir(null); }}
                    onEliminar={() => { onEliminar(f.id); onAbrir(null); }}
                    onCerrar={() => onAbrir(null)}
                  />
                </div>
              )}
            </div>
          )
        ))}
      </div>

      {form === 'nueva' ? (
        <FormFecha
          accent={accent} tipo={tipo} asignaturas={asignaturas} asignaturaFija={asignaturaFija}
          onGuardar={(datos) => { onCrear(datos); setForm(null); }}
          onCerrar={() => setForm(null)}
        />
      ) : (
        <button
          onClick={() => setForm('nueva')}
          className="w-full rounded-2xl p-3 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
          style={{ background: COLORS.surface2, border: `1px dashed ${COLORS.border}` }}
        >
          <Plus size={16} style={{ color: accent }} />
          <span className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>Añadir {t.nombre.toLowerCase()}</span>
        </button>
      )}
    </>
  );
}

function CorrelacionEstudio({ sueno, horas, accent }) {
  const c = correlacionSuenoEstudio(sueno, horas);
  return (
    <Card>
      <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: COLORS.text }}>
        <TrendingUp size={16} style={{ color: accent }} /> Sueño y estudio
      </p>
      {c.suficientesDatos ? (
        <p className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>
          En los días con al menos 7h de sueño la noche anterior ({c.diasBuenSueno} días con datos), has estudiado de media{' '}
          <span style={{ color: COLORS.text, fontWeight: 600 }}>{c.mediaHorasConBuenSueno}h</span>. Con menos de 7h ({c.diasSuenoCorto} días), la media baja a{' '}
          <span style={{ color: COLORS.text, fontWeight: 600 }}>{c.mediaHorasConSuenoCorto}h</span>.
        </p>
      ) : (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          Todavía no hay suficientes días con sueño y horas de estudio registrados el mismo periodo para comparar (hacen falta al menos 2 días de cada tipo).
        </p>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ENTREGA 3 · ES FASE 1 — HOME TIPO TELÉFONO Y NUEVA ARQUITECTURA
   ══════════════════════════════════════════════════════════════════════════

   🚨 Lo que aquí se llama **app** es el `programa` que existe desde la Fase 6.
   El enunciado propone 🎓 Bachillerato, 🎹 Música, ⚽ Fútbol, ♟️ Ajedrez y
   🌍 Idiomas, y este módulo ya traía **Bachillerato y Música**. Una lista nueva
   habría dejado sus asignaturas, exámenes y horas invisibles (apartado 16).

   La pantalla es un navegador de tres niveles —Home → app → rama— y **nada de lo
   que ya funcionaba se ha reescrito**: `AsignaturaCard`, `ExamenItem`,
   `PlanRepaso`, `ExplicarConcepto` y `CorrelacionEstudio` son los de siempre; lo
   que cambia es dónde viven. */

function Plaquita({ app, linea, accent, onAbrir }) {
  return (
    <button
      onClick={onAbrir}
      className="rounded-2xl p-3 flex flex-col items-center justify-start text-center transition-transform active:scale-95"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, minHeight: 108 }}
    >
      <span aria-hidden="true" style={{ fontSize: 28, lineHeight: '34px' }}>{iconoDeApp(app)}</span>
      <span className="text-xs font-semibold mt-1 w-full truncate" style={{ color: COLORS.text }}>{app.nombre}</span>
      {/* Apartado 6 — una línea como mucho, y solo si aporta. `null` no pinta nada. */}
      {linea && <span className="text-[10px] mt-0.5 w-full truncate" style={{ color: accent }}>{linea}</span>}
    </button>
  );
}

function CrearApp({ accent, programas, onCrear, onCerrar }) {
  const [nombre, setNombre] = useState('');
  const [icono, setIcono] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tipo, setTipo] = useState(null);

  // El icono se PROPONE según lo que escribe, y el campo sigue siendo suyo.
  const propuesto = icono || sugerirIcono(nombre) || ICONO_POR_DEFECTO;
  const repetido = nombreYaUsado(nombre, programas);

  const crear = () => {
    const app = crearApp({ nombre, icono: icono || sugerirIcono(nombre) || '', categoria, tipo }, programas);
    if (!app) return;
    onCrear(app);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Nueva área de estudio</p>
        <button onClick={onCerrar} className="toque-44 p-1.5 -m-1.5" aria-label="Cerrar">
          <X size={16} style={{ color: COLORS.textMuted }} />
        </button>
      </div>

      <Field label="Nombre">
        <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={MAX_NOMBRE_APP} placeholder="Ej: Idiomas" />
      </Field>

      <Field label="Icono">
        <div className="flex items-center gap-2 mb-2">
          <span aria-hidden="true" style={{ fontSize: 26 }}>{propuesto}</span>
          <TextInput value={icono} onChange={(e) => setIcono(e.target.value)} placeholder="O pega el que quieras" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ICONOS_ESTUDIOS.map((ic) => (
            <button
              key={ic} onClick={() => setIcono(ic)} aria-label={`Usar el icono ${ic}`}
              aria-pressed={icono === ic}
              className="toque-44 rounded-xl transition-transform active:scale-90"
              style={{
                fontSize: 20, width: 40, height: 40,
                background: icono === ic ? hexToRgba(accent, 0.16) : COLORS.surface2,
                border: `1px solid ${icono === ic ? accent : COLORS.border}`,
              }}
            >
              {ic}
            </button>
          ))}
        </div>
      </Field>

      {/* ES F2, apartado 12 — el tipo NO restringe nada: decide qué secciones se le proponen
          después. Por eso se puede dejar sin elegir, y entonces se le ofrecen todas. */}
      <Field label="Tipo (opcional)">
        <div className="flex flex-wrap gap-1.5">
          {TIPOS_ESTUDIO.map((t) => (
            <button
              key={t.id} onClick={() => setTipo(tipo === t.id ? null : t.id)}
              aria-pressed={tipo === t.id}
              className="toque-44 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-transform active:scale-95"
              style={{
                background: tipo === t.id ? hexToRgba(accent, 0.16) : COLORS.surface2,
                border: `1px solid ${tipo === t.id ? accent : COLORS.border}`,
                color: tipo === t.id ? accent : COLORS.textMuted,
              }}
            >
              {t.icono} {t.nombre}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Categoría (opcional)">
        <TextInput value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ej: Extraescolares" />
      </Field>

      {/* Avisa del nombre repetido; no lo prohíbe. Puede tener dos "Inglés". */}
      {repetido && (
        <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
          Ya tienes un área con ese nombre. Puedes crearla igualmente.
        </p>
      )}

      <PrimaryButton accent={accent} disabled={!nombre.trim()} onClick={crear}>Crear</PrimaryButton>
    </Card>
  );
}

/* ES F2, apartado 5 — añadir una sección dentro de un área. Las sugerencias son las del apartado 4 y
   dependen del tipo, pero **no imponen nada**: puede escribir la suya. */
function CrearRama({ accent, app, onCrear, onCerrar }) {
  const [nombre, setNombre] = useState('');
  const [icono, setIcono] = useState('');
  const sugerencias = sugerenciasDeRama(app?.tipo);
  const yaEstan = new Set((app?.ramas || []).map((r) => r.nombre.toLowerCase()));

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Nueva sección</p>
        <button onClick={onCerrar} className="toque-44 p-1.5 -m-1.5" aria-label="Cerrar">
          <X size={16} style={{ color: COLORS.textMuted }} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {sugerencias.filter((s) => !yaEstan.has(s.nombre.toLowerCase())).map((s) => (
          <button
            key={s.nombre} onClick={() => { setNombre(s.nombre); setIcono(s.icono); }}
            className="toque-44 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-transform active:scale-95"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          >
            {s.icono} {s.nombre}
          </button>
        ))}
      </div>

      <Field label="Nombre">
        <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={MAX_NOMBRE_RAMA} placeholder="Ej: Oposiciones" />
      </Field>

      <Field label="Icono">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" style={{ fontSize: 24 }}>{icono || ICONO_RAMA_POR_DEFECTO}</span>
          <TextInput value={icono} onChange={(e) => setIcono(e.target.value)} placeholder="Pega el que quieras" />
        </div>
      </Field>

      {/* ⚠️ No se llama «Añadir»: la tarjeta ＋ de la cuadrícula ya se llama así, y dos botones con
          el mismo nombre en la misma pantalla acaban llevando al sitio equivocado (E3 F30). */}
      <PrimaryButton accent={accent} disabled={!nombre.trim()} onClick={() => {
        const r = crearRama({ nombre, icono });
        if (r) onCrear(r);
      }}>Crear sección</PrimaryButton>
    </Card>
  );
}

function ProximoEnEstudios({ estudios, accent, onIr }) {
  const eventos = proximosEventos(estudios);

  return (
    <div>
      <p className="text-xs font-bold tracking-wide mb-2" style={{ color: COLORS.textMuted }}>PRÓXIMO</p>
      {eventos.length === 0 ? (
        <EmptyHint text="No tienes exámenes apuntados para los próximos 30 días." />
      ) : (
        <div className="space-y-1.5">
          {eventos.map((e) => (
            <button
              key={e.id} onClick={() => onIr(e)}
              className="w-full rounded-2xl p-2.5 flex items-center gap-2.5 text-left transition-transform active:scale-[0.99]"
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              <span aria-hidden="true" style={{ fontSize: 18 }}>{e.icono}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold truncate" style={{ color: COLORS.text }}>{e.titulo}</span>
                <span className="block text-[11px] truncate" style={{ color: COLORS.textMuted }}>
                  {formatFecha(e.fecha)}{e.programa ? ` · ${e.programa}` : ''}
                </span>
              </span>
              <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: accent }}>
                {e.dias === 0 ? 'Hoy' : e.dias === 1 ? 'Mañana' : `${e.dias} días`}
              </span>
            </button>
          ))}
        </div>
      )}
      {/* Regla 8 — lo que todavía no puede salir aquí se dice, no se finge. */}
      <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
        Por ahora solo salen los exámenes: los trabajos y las entregas todavía no se pueden apuntar.
      </p>
    </div>
  );
}

export default function EstudiosView({ estudios, sueno, onAddPrograma, onUpdateProgramas, onDeletePrograma, onAddAsignatura, onUpdateAsignaturas, onDeleteAsignatura, onAddTema, onUpdateTemas, onDeleteTema, onAddEntrega, onUpdateEntregas, onDeleteEntrega, onAddEvento, onUpdateEventos, onDeleteEvento, onUpdateExamenes, onAddExamen, onUpdateExamen, onDeleteExamen, onAddHoras, onDeleteHoras, accent, foco, onFocoConsumido }) {
  const [ruta, setRuta] = useState(RUTA_RAIZ);
  const [creando, setCreando] = useState(false);
  const [organizando, setOrganizando] = useState(false);
  const [anadiendoRama, setAnadiendoRama] = useState(false);
  const [organizandoRamas, setOrganizandoRamas] = useState(false);
  // ES F3
  const [formAsig, setFormAsig] = useState(null);      // null | 'nueva' | id
  const [organizandoAsigs, setOrganizandoAsigs] = useState(false);
  const [formTema, setFormTema] = useState(null);      // null | 'nuevo' | id
  const [formExamen, setFormExamen] = useState(false);
  const [horasRapidas, setHorasRapidas] = useState('');
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  // ES F4 — qué fecha está abierta en detalle (apartado 13).
  const [fechaAbierta, setFechaAbierta] = useState(null);

  // Ampliación del Dashboard — Centro de Control (apartado 6): el examen destacado puede vivir en
  // cualquier app — se abre su app y su rama de asignaturas; AsignaturaCard y ExamenItem se
  // encargan de desplegarse y hacer scroll hasta el examen en sí.
  useEffect(() => {
    if (!foco?.examenId) return;
    const ex = estudios.examenes.find((e) => e.id === foco.examenId);
    const asig = ex && estudios.asignaturas.find((a) => a.id === ex.asignaturaId);
    if (asig) {
      // ES F3 — el examen destacado vive dentro de SU asignatura, así que se abre su sección de
      // exámenes; `ExamenItem` se encarga de desplegarse solo.
      const prog = (estudios.programas || []).find((p) => p.id === asig.programaId);
      const ramaAsig = (prog?.ramas || []).find((r) => r.sistema === 'asignaturas');
      if (ramaAsig) setRuta(abrirSeccion(asig.programaId, ramaAsig.id, asig.id, 'examenes'));
    }
  }, [foco]);

  const programas = estudios.programas || [];
  const visibles = appsVisibles(programas);
  const todas = appsOrdenadas(programas);
  const app = programas.find((p) => p.id === ruta.appId) || null;
  const asignaturasApp = app ? asignaturasOrdenadas(estudios, app.id) : [];


  /* ES F4 — los tres tipos de fecha se crean, editan, cambian de estado y se borran por AQUÍ, sea
     cual sea la pantalla desde la que se toque: una sola puerta por tipo (apartado 19). */
  const accionesFecha = {
    examen: {
      crear: (d) => onAddExamen({ id: uid(), asignaturaId: d.asignaturaId, tema: d.nombre, fecha: d.fecha, hora: d.hora, notas: d.notas, estado: 'proximo', notaObjetivo: '', notaObtenida: '', planRepaso: [] }),
      editar: (id, d) => onUpdateExamenes(editarExamenFecha(estudios.examenes || [], id, { tema: d.nombre, fecha: d.fecha, hora: d.hora, notas: d.notas })),
      estado: (id, e) => onUpdateExamenes(cambiarEstadoExamen(estudios.examenes || [], id, e)),
      eliminar: onDeleteExamen,
    },
    entrega: {
      crear: (d) => { const t = crearEntrega(d); if (t) onAddEntrega(t); },
      editar: (id, d) => onUpdateEntregas(editarEntrega(estudios.entregas || [], id, d)),
      estado: (id, e) => onUpdateEntregas(cambiarEstadoEntrega(estudios.entregas || [], id, e)),
      eliminar: onDeleteEntrega,
    },
    evento: {
      crear: (d) => { const v = crearEventoAcademico(d); if (v) onAddEvento(v); },
      editar: (id, d) => onUpdateEventos(editarEventoAcademico(estudios.eventos || [], id, d)),
      estado: () => {},
      eliminar: onDeleteEvento,
    },
  };

  const panelDe = (tipo, filas, asignaturasDisponibles, asignaturaFija = null) => {
    const a = accionesFecha[tipo];
    return (
      <PanelFechas
        tipo={tipo} filas={filas} asignaturas={asignaturasDisponibles} accent={accent}
        asignaturaFija={asignaturaFija} abierta={fechaAbierta} onAbrir={setFechaAbierta}
        onCrear={a.crear} onEditar={a.editar} onEstado={a.estado} onEliminar={a.eliminar}
      />
    );
  };

  const cabecera = (
    <div className="flex items-center gap-2">
      {ruta.vista !== 'home' && (
        <button onClick={() => setRuta(atras(ruta))} className="toque-44 p-1.5 -m-1.5" aria-label="Volver atrás">
          <ChevronLeft size={20} style={{ color: COLORS.text }} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
          {migas(ruta, programas, estudios.asignaturas || []).map((m) => m.texto).join(' › ')}
        </p>
      </div>
    </div>
  );

  /* ── HOME ───────────────────────────────────────────────────────────────── */
  if (ruta.vista === 'home') {
    return (
      <div className="space-y-4 pb-4 module-enter">
        <SectionTitle>
          <span className="flex items-center gap-2"><GraduationCap size={18} style={{ color: accent }} /> Estudios</span>
        </SectionTitle>

        {/* Apartado 14 — tres columnas, iconos grandes, sin scroll horizontal. */}
        <div className="grid grid-cols-3 gap-3">
          {visibles.map((p) => (
            <Plaquita key={p.id} app={p} linea={lineaDeApp(estudios, p.id)} accent={accent} onAbrir={() => setRuta(abrirApp(p.id))} />
          ))}
          <button
            onClick={() => setCreando((c) => !c)}
            className="rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-transform active:scale-95"
            style={{ background: COLORS.surface2, border: `1px dashed ${COLORS.border}`, minHeight: 108 }}
          >
            <Plus size={24} style={{ color: accent }} />
            <span className="text-xs font-semibold mt-1" style={{ color: COLORS.textMuted }}>Añadir</span>
          </button>
        </div>

        {creando && (
          <CrearApp
            accent={accent} programas={programas}
            onCrear={(nueva) => { onAddPrograma(nueva); setCreando(false); setRuta(abrirApp(nueva.id)); }}
            onCerrar={() => setCreando(false)}
          />
        )}

        {/* Apartado 4 — reordenar, ocultar y eliminar, sin un panel de configuración enorme. */}
        {todas.length > 0 && (
          <div>
            <button onClick={() => setOrganizando((o) => !o)} className="text-xs font-semibold" style={{ color: accent }}>
              {organizando ? 'Listo' : 'Organizar'}
            </button>
            {organizando && (
              <Card style={{ marginTop: '0.5rem' }}>
                <div className="space-y-1.5">
                  {todas.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span aria-hidden="true" style={{ fontSize: 16 }}>{iconoDeApp(p)}</span>
                      <span className="text-xs min-w-0 flex-1 truncate" style={{ color: p.oculto ? COLORS.textMuted : COLORS.text }}>
                        {p.nombre}{p.oculto ? ' · oculta' : ''}
                      </span>
                      <button onClick={() => onUpdateProgramas(moverApp(programas, p.id, 'arriba'))} disabled={i === 0} className="toque-44 p-1.5 -m-1.5 disabled:opacity-30" aria-label={`Subir ${p.nombre}`}>
                        <ChevronUp size={16} style={{ color: COLORS.text }} />
                      </button>
                      <button onClick={() => onUpdateProgramas(moverApp(programas, p.id, 'abajo'))} disabled={i === todas.length - 1} className="toque-44 p-1.5 -m-1.5 disabled:opacity-30" aria-label={`Bajar ${p.nombre}`}>
                        <ChevronDown size={16} style={{ color: COLORS.text }} />
                      </button>
                      <button onClick={() => onUpdateProgramas(alternarOcultaApp(programas, p.id))} className="toque-44 p-1.5 -m-1.5" aria-label={p.oculto ? `Mostrar ${p.nombre}` : `Ocultar ${p.nombre}`}>
                        {p.oculto ? <Eye size={16} style={{ color: COLORS.textMuted }} /> : <EyeOff size={16} style={{ color: COLORS.textMuted }} />}
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>{AVISO_OCULTAR}</p>
              </Card>
            )}
          </div>
        )}

        {/* Apartado 9 — jerarquía: 2.º los próximos eventos. */}
        <ProximoEnEstudios estudios={estudios} accent={accent} onIr={(e) => setRuta(abrirRama(e.programaId, 'asignaturas'))} />

        {/* Apartado 9 — y 3.º la información secundaria. */}
        <CorrelacionEstudio sueno={sueno} horas={estudios.horas} accent={accent} />
      </div>
    );
  }

  /* ── UNA APP ────────────────────────────────────────────────────────────── */
  if (ruta.vista === 'app') {
    if (!app) return <div className="space-y-4 pb-4">{cabecera}<EmptyHint text="Esa área ya no existe." /></div>;
    const ramas = ramasDeApp(estudios, app);

    return (
      <div className="space-y-4 pb-4 module-enter">
        {cabecera}

        <div className="flex items-center gap-3">
          <span aria-hidden="true" style={{ fontSize: 34 }}>{iconoDeApp(app)}</span>
          <div className="min-w-0">
            <p className="text-lg font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{app.nombre}</p>
            {app.categoria && <p className="text-xs" style={{ color: COLORS.textMuted }}>{app.categoria}</p>}
          </div>
        </div>

        {/* ES F2, apartados 2 y 16 — la misma cuadrícula de tarjetas del Home: las pantallas
            interiores se sienten como una continuación, no como otra aplicación. */}
        <div className="grid grid-cols-2 gap-3">
          {ramas.map((r) => (
            <button
              key={r.id} onClick={() => setRuta(abrirRama(app.id, r.id))}
              className="rounded-2xl p-3 flex flex-col items-start text-left transition-transform active:scale-95"
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, minHeight: 92 }}
            >
              <span aria-hidden="true" style={{ fontSize: 24 }}>{r.icono}</span>
              <span className="text-sm font-semibold mt-1.5 w-full truncate" style={{ color: COLORS.text }}>{r.nombre}</span>
              {/* Una rama sin sistema no finge un número: ni un cero, que diría que está vacía. */}
              {r.linea && <span className="text-xs w-full truncate" style={{ color: COLORS.textMuted }}>{r.linea}</span>}
            </button>
          ))}
          <button
            onClick={() => setAnadiendoRama((a) => !a)}
            className="rounded-2xl p-3 flex flex-col items-center justify-center transition-transform active:scale-95"
            style={{ background: COLORS.surface2, border: `1px dashed ${COLORS.border}`, minHeight: 92 }}
          >
            <Plus size={20} style={{ color: accent }} />
            <span className="text-xs font-semibold mt-1" style={{ color: COLORS.textMuted }}>Añadir</span>
          </button>
        </div>

        {ramas.length === 0 && !anadiendoRama && (
          <EmptyHint text="Esta área no tiene ninguna sección. Añade la primera con ＋." />
        )}

        {anadiendoRama && (
          <CrearRama
            accent={accent} app={app}
            onCrear={(nueva) => { onUpdateProgramas(anadirRama(programas, app.id, nueva)); setAnadiendoRama(false); }}
            onCerrar={() => setAnadiendoRama(false)}
          />
        )}

        {/* Apartado 14 — quitar una rama. ⚠️ No borra nada de lo que hay dentro. */}
        {ramas.length > 0 && (
          <div>
            <button onClick={() => setOrganizandoRamas((o) => !o)} className="text-xs font-semibold" style={{ color: accent }}>
              {organizandoRamas ? 'Listo' : 'Organizar secciones'}
            </button>
            {organizandoRamas && (
              <Card style={{ marginTop: '0.5rem' }}>
                <div className="space-y-1.5">
                  {ramas.map((r) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <span aria-hidden="true" style={{ fontSize: 16 }}>{r.icono}</span>
                      <span className="text-xs min-w-0 flex-1 truncate" style={{ color: COLORS.text }}>{r.nombre}</span>
                      <BotonBorrar
                        onClick={() => onUpdateProgramas(quitarRama(programas, app.id, r.id))}
                        label={`Quitar ${r.nombre} de ${app.nombre}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>{AVISO_QUITAR_RAMA}</p>
              </Card>
            )}
          </div>
        )}

        {/* Entrega 2 · ME Fase 4 — eliminar se lleva sus asignaturas (y con ellas exámenes y horas) a
            la papelera en una sola entrada, así que restaurarla la devuelve entera. */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="text-xs min-w-0 truncate" style={{ color: COLORS.textMuted }}>
            {asignaturasApp.length} {asignaturasApp.length === 1 ? 'asignatura' : 'asignaturas'}
          </p>
          <BotonBorrar onClick={() => { onDeletePrograma(app.id); setRuta(RUTA_RAIZ); }} label={`Eliminar el área ${app.nombre}`} />
        </div>
      </div>
    );
  }

  /* ── UNA ASIGNATURA Y SUS SECCIONES (ES F3, apartados 4 a 9) ─────────────── */
  if (ruta.vista === 'asignatura' || ruta.vista === 'seccion') {
    const asig = (estudios.asignaturas || []).find((a) => a.id === ruta.asignaturaId);
    if (!app || !asig) {
      return <div className="space-y-4 pb-4">{cabecera}<EmptyHint text="Esa asignatura ya no existe." /></div>;
    }

    const cabeceraAsig = (
      <div className="flex items-center gap-3">
        <span aria-hidden="true" style={{ fontSize: 30 }}>{iconoDeAsignatura(asig)}</span>
        <div className="min-w-0">
          <p className="text-lg font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{asig.nombre}</p>
          {/* Apartado 9 — el profesor y el aula, como información secundaria. */}
          {(asig.profesor || asig.aula) && (
            <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
              {[asig.profesor, asig.aula].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>
    );

    /* ── Una sección de la asignatura ── */
    if (ruta.vista === 'seccion') {
      const examenesAsig = (estudios.examenes || []).filter((e) => e.asignaturaId === asig.id);
      const temas = temasDe(estudios, asig.id);

      return (
        <div className="space-y-4 pb-4 module-enter">
          {cabecera}

          {/* ⚠️ Los exámenes conservan `ExamenItem` con su **plan de repaso**, que existe desde la
              Fase 6 y la IA rellena: cambiarlos por la fila genérica lo habría borrado de la
              pantalla. Debajo va el formulario nuevo, con hora y notas (apartados 1 y 2). */}
          {ruta.seccion === 'examenes' && (
            <>
              {examenesAsig.length === 0 && !formExamen && (
                <EmptyHint text="Todavía no hay exámenes en esta asignatura." />
              )}
              <div className="space-y-2">
                {[...examenesAsig].sort((a, b) => ((a.fecha || '9999') > (b.fecha || '9999') ? 1 : -1)).map((ex) => (
                  <div key={ex.id}>
                    <ExamenItem
                      examen={ex} onUpdate={onUpdateExamen} onDelete={onDeleteExamen} accent={accent}
                      forzarAbierta={foco?.examenId === ex.id} onFocoConsumido={onFocoConsumido}
                    />
                    {/* Apartado 3 — su estado, con icono y palabra. */}
                    <div className="flex flex-wrap gap-1.5 mt-1 mb-1">
                      {ESTADOS_EXAMEN.map((e) => (
                        <button
                          key={e.id} onClick={() => accionesFecha.examen.estado(ex.id, e.id)}
                          aria-pressed={(ex.estado || 'proximo') === e.id}
                          className="toque-44 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-transform active:scale-95"
                          style={{
                            background: (ex.estado || 'proximo') === e.id ? hexToRgba(accent, 0.16) : COLORS.surface2,
                            border: `1px solid ${(ex.estado || 'proximo') === e.id ? accent : COLORS.border}`,
                            color: (ex.estado || 'proximo') === e.id ? accent : COLORS.textMuted,
                          }}
                        >{e.icono} {e.nombre}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {formExamen ? (
                <FormFecha
                  accent={accent} tipo="examen" asignaturas={asignaturasApp} asignaturaFija={asig.id}
                  onGuardar={(d) => { accionesFecha.examen.crear(d); setFormExamen(false); }}
                  onCerrar={() => setFormExamen(false)}
                />
              ) : (
                <button
                  onClick={() => setFormExamen(true)}
                  className="w-full rounded-2xl p-3 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                  style={{ background: COLORS.surface2, border: `1px dashed ${COLORS.border}` }}
                >
                  <Plus size={16} style={{ color: accent }} />
                  <span className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>Añadir examen</span>
                </button>
              )}
            </>
          )}

          {/* Apartados 4, 5 y 6 — las entregas y los eventos de ESTA asignatura. */}
          {ruta.seccion === 'entregas' && panelDe('entrega', fechasAcademicas(estudios, { asignaturaId: asig.id }).filter((f) => f.tipo === 'entrega'), asignaturasApp, asig.id)}
          {ruta.seccion === 'eventos' && panelDe('evento', fechasAcademicas(estudios, { asignaturaId: asig.id }).filter((f) => f.tipo === 'evento'), asignaturasApp, asig.id)}

          {ruta.seccion === 'contenido' && (
            <>
              {temas.length === 0 && !formTema && (
                <EmptyHint text="Todavía no has añadido ningún tema. Organiza aquí el temario de la asignatura." />
              )}
              <div className="space-y-1.5">
                {temas.map((t, i) => (
                  formTema === t.id ? (
                    <FormTema
                      key={t.id} accent={accent} inicial={t}
                      onGuardar={(datos) => { onUpdateTemas(editarTema(estudios.temas || [], t.id, datos)); setFormTema(null); }}
                      onCerrar={() => setFormTema(null)}
                    />
                  ) : (
                    <FilaTema
                      key={t.id} tema={t} primero={i === 0} ultimo={i === temas.length - 1} accent={accent}
                      onAvanzar={() => onUpdateTemas(avanzarTema(estudios.temas || [], t.id))}
                      onEditar={() => setFormTema(t.id)}
                      onSubir={() => onUpdateTemas(moverTema(estudios.temas || [], asig.id, t.id, 'arriba'))}
                      onBajar={() => onUpdateTemas(moverTema(estudios.temas || [], asig.id, t.id, 'abajo'))}
                      onEliminar={() => onDeleteTema(t.id)}
                    />
                  )
                ))}
              </div>
              {formTema === 'nuevo' ? (
                <FormTema
                  accent={accent}
                  onGuardar={(datos) => {
                    const nuevo = crearTema({ ...datos, asignaturaId: asig.id }, estudios.temas || []);
                    if (!nuevo) return;
                    onAddTema(nuevo);
                    setFormTema(null);
                  }}
                  onCerrar={() => setFormTema(null)}
                />
              ) : (
                <button
                  onClick={() => setFormTema('nuevo')}
                  className="w-full rounded-2xl p-3 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                  style={{ background: COLORS.surface2, border: `1px dashed ${COLORS.border}` }}
                >
                  <Plus size={16} style={{ color: accent }} />
                  <span className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>Añadir tema</span>
                </button>
              )}
            </>
          )}
        </div>
      );
    }

    /* ── La pantalla de la asignatura ── */
    const resumen = resumenAsignatura(estudios, asig.id);
    const secciones = seccionesDeAsignatura(estudios, asig.id);
    const impacto = impactoDeEliminarAsignatura(estudios, asig.id);

    return (
      <div className="space-y-4 pb-4 module-enter">
        {cabecera}
        {cabeceraAsig}

        {/* Apartado 8 — compacto, y SOLO las líneas que tienen algo que decir: `[]` cuando no hay
            nada, nunca una fila de ceros. Y ni una línea de entregas, que no existen. */}
        {resumen.length > 0 && (
          <p className="text-xs" style={{ color: accent }}>{resumen.join(' · ')}</p>
        )}

        {formAsig === asig.id ? (
          <FormAsignatura
            accent={accent} inicial={asig}
            onGuardar={(datos) => { onUpdateAsignaturas(editarAsignatura(estudios.asignaturas, asig.id, datos)); setFormAsig(null); }}
            onCerrar={() => setFormAsig(null)}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {secciones.map((sec) => (
                <button
                  key={sec.id} onClick={() => setRuta(abrirSeccion(app.id, ruta.ramaId, asig.id, sec.id))}
                  className="rounded-2xl p-3 flex flex-col items-start text-left transition-transform active:scale-95"
                  style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, minHeight: 88 }}
                >
                  <span aria-hidden="true" style={{ fontSize: 22 }}>{sec.icono}</span>
                  <span className="text-sm font-semibold mt-1.5 w-full truncate" style={{ color: COLORS.text }}>{sec.nombre}</span>
                  {sec.linea && <span className="text-xs w-full truncate" style={{ color: COLORS.textMuted }}>{sec.linea}</span>}
                </button>
              ))}
            </div>

            {/* Apartado 13 — una acción rápida: registrar lo estudiado sin salir de aquí. Vivía
                dentro del acordeón que esta fase retira, y no se pierde. */}
            <div className="flex items-center gap-2">
              <TextInput
                type="number" step="0.5" inputMode="decimal" placeholder="Horas estudiadas hoy"
                value={horasRapidas} onChange={(e) => setHorasRapidas(e.target.value)}
              />
              <div style={{ width: 90, flexShrink: 0 }}>
                <PrimaryButton accent={accent} disabled={!Number(horasRapidas)} icon={Clock} onClick={() => {
                  const h = Number(horasRapidas);
                  if (!h) return;
                  onAddHoras({ id: uid(), asignaturaId: asig.id, fecha: todayISO(), horas: h });
                  setHorasRapidas('');
                }}>Sumar</PrimaryButton>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button onClick={() => setFormAsig(asig.id)} className="text-xs font-semibold" style={{ color: accent }}>
                Editar asignatura
              </button>
              <button onClick={() => setConfirmarBorrado(true)} className="text-xs font-semibold" style={{ color: COLORS.negative }}>
                Eliminar
              </button>
            </div>

            {/* 🚨 Apartado 3 — antes de eliminar se enseña lo que se va con ella. Y como va a la
                papelera, el aviso dice que se recupera: prometer lo contrario sería mentir. */}
            {confirmarBorrado && (
              <Card style={{ background: COLORS.surface2 }}>
                <p className="text-sm font-semibold" style={{ color: COLORS.text }}>¿Eliminar {asig.nombre}?</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: COLORS.textMuted }}>{impacto.aviso}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => setConfirmarBorrado(false)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.text }}>
                    Cancelar
                  </button>
                  <button
                    onClick={() => { onDeleteAsignatura(asig.id); setConfirmarBorrado(false); setRuta(abrirRama(app.id, ruta.ramaId)); }}
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                    style={{ background: COLORS.negative, color: COLORS.textOnAccent }}
                  >
                    Eliminar
                  </button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  /* ── UNA RAMA ───────────────────────────────────────────────────────────── */
  if (!app) return <div className="space-y-4 pb-4">{cabecera}<EmptyHint text="Esa área ya no existe." /></div>;

  const visiblesApp = asignaturasVisibles(estudios, app.id);
  const idsAsig = asignaturasApp.map((a) => a.id);
  const examenesApp = examenesDe(estudios, app.id);
  const horasApp = horasDe(estudios, app.id);
  const nombreAsignatura = (id) => estudios.asignaturas.find((a) => a.id === id)?.nombre || '';

  /* 🚨 ES F2 — la pantalla se elige por el SISTEMA de la rama, nunca por su id: desde esta fase los
     ids los pone `uid()` al crearlas y dos apps pueden tener una «Entrenamiento» cada una. */
  const rama = ramaPorId(app, ruta.ramaId);
  const sistema = rama?.sistema || null;

  return (
    <div className="space-y-4 pb-4 module-enter">
      {cabecera}

      {/* ES F3, apartados 1 y 14 — una lista compacta que LLEVA a la asignatura, no un acordeón
          que la abre dentro: *"las asignaturas deben sentirse como elementos dentro del árbol"*. */}
      {sistema === 'asignaturas' && (
        <>
          <div className="space-y-1.5">
            {visiblesApp.length === 0 && !formAsig && (
              <EmptyHint text="Todavía no has añadido ninguna asignatura a esta área." />
            )}
            {visiblesApp.map((a) => (
              <FilaAsignatura
                key={a.id} asignatura={a} linea={lineaDeAsignatura(estudios, a.id)} accent={accent}
                onAbrir={() => setRuta(abrirAsignatura(app.id, ruta.ramaId, a.id))}
              />
            ))}
          </div>

          {formAsig === 'nueva' ? (
            <FormAsignatura
              accent={accent}
              onGuardar={(datos) => {
                const nueva = crearAsignatura({ ...datos, programaId: app.id }, estudios.asignaturas || []);
                if (!nueva) return;
                onAddAsignatura(nueva);
                setFormAsig(null);
              }}
              onCerrar={() => setFormAsig(null)}
            />
          ) : (
            <button
              onClick={() => setFormAsig('nueva')}
              className="w-full rounded-2xl p-3 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
              style={{ background: COLORS.surface2, border: `1px dashed ${COLORS.border}` }}
            >
              <Plus size={16} style={{ color: accent }} />
              <span className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>Añadir asignatura</span>
            </button>
          )}

          {/* Apartados 3 y 10 — reordenar y ocultar. ⚠️ Ocultar no borra nada. */}
          {asignaturasApp.length > 1 && (
            <div>
              <button onClick={() => setOrganizandoAsigs((o) => !o)} className="text-xs font-semibold" style={{ color: accent }}>
                {organizandoAsigs ? 'Listo' : 'Organizar asignaturas'}
              </button>
              {organizandoAsigs && (
                <Card style={{ marginTop: '0.5rem' }}>
                  <div className="space-y-1.5">
                    {asignaturasApp.map((a, i) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <span aria-hidden="true" style={{ fontSize: 15 }}>{iconoDeAsignatura(a)}</span>
                        <span className="text-xs min-w-0 flex-1 truncate" style={{ color: a.oculto ? COLORS.textMuted : COLORS.text }}>
                          {a.nombre}{a.oculto ? ' · oculta' : ''}
                        </span>
                        <button onClick={() => onUpdateAsignaturas(moverAsignatura(estudios.asignaturas, app.id, a.id, 'arriba'))} disabled={i === 0} className="toque-44 p-1.5 -m-1.5 disabled:opacity-30" aria-label={`Subir ${a.nombre}`}>
                          <ChevronUp size={15} style={{ color: COLORS.text }} />
                        </button>
                        <button onClick={() => onUpdateAsignaturas(moverAsignatura(estudios.asignaturas, app.id, a.id, 'abajo'))} disabled={i === asignaturasApp.length - 1} className="toque-44 p-1.5 -m-1.5 disabled:opacity-30" aria-label={`Bajar ${a.nombre}`}>
                          <ChevronDown size={15} style={{ color: COLORS.text }} />
                        </button>
                        <button onClick={() => onUpdateAsignaturas(alternarOcultaAsignatura(estudios.asignaturas, a.id))} className="toque-44 p-1.5 -m-1.5" aria-label={a.oculto ? `Mostrar ${a.nombre}` : `Ocultar ${a.nombre}`}>
                          {a.oculto ? <Eye size={15} style={{ color: COLORS.textMuted }} /> : <EyeOff size={15} style={{ color: COLORS.textMuted }} />}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>{AVISO_OCULTAR_ASIGNATURA}</p>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Apartado 20 — desde el área se ven las de TODAS sus asignaturas. */}
      {sistema === 'entregas' && panelDe('entrega', fechasAcademicas(estudios, { asignaturaIds: idsAsig }).filter((f) => f.tipo === 'entrega'), asignaturasApp)}
      {sistema === 'eventos' && panelDe('evento', fechasAcademicas(estudios, { asignaturaIds: idsAsig }).filter((f) => f.tipo === 'evento'), asignaturasApp)}

      {sistema === 'examenes' && (
        <>
          {examenesApp.length === 0 ? (
            <EmptyHint text="Todavía no hay exámenes en esta área. Se añaden desde cada asignatura." />
          ) : (
            <div className="space-y-2">
              {[...examenesApp].sort((a, b) => (a.fecha > b.fecha ? 1 : -1)).map((ex) => (
                <div key={ex.id}>
                  <p className="text-[11px] mb-1" style={{ color: COLORS.textMuted }}>{nombreAsignatura(ex.asignaturaId)}</p>
                  <ExamenItem
                    examen={ex} onUpdate={onUpdateExamen} onDelete={onDeleteExamen} accent={accent}
                    forzarAbierta={foco?.examenId === ex.id} onFocoConsumido={onFocoConsumido}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 🚨 Apartado 8 — la inteligencia NO se elimina: sale del Home y vive aquí. */}
          <ExplicarConcepto accent={accent} />

          <AIPanel
            label="Analizar mis estudios"
            accent={accent}
            buildPrompt={() =>
              `Asignaturas de Josué (JSON): ${JSON.stringify(asignaturasApp)}. ` +
              `Exámenes próximos y pasados (JSON): ${JSON.stringify(examenesApp.slice(-15))}. ` +
              `Horas de estudio recientes (JSON): ${JSON.stringify(horasApp.slice(-20))}. ` +
              `Dale una lectura breve de cómo lo lleva y qué priorizaría esta semana según fechas de examen — ` +
              `aconseja, no decidas por él. Si detectas un patrón simple, cita el dato concreto; si hay pocos datos, dilo abiertamente.`
            }
          />
        </>
      )}

      {sistema === 'horas' && (
        horasApp.length === 0 ? (
          <EmptyHint text="Todavía no has registrado horas en esta área. Se suman desde cada asignatura." />
        ) : (
          <Card>
            <div className="space-y-1.5">
              {[...horasApp].sort((a, b) => (a.fecha > b.fecha ? -1 : 1)).map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-2">
                  <p className="text-xs min-w-0 truncate" style={{ color: COLORS.text }}>
                    {formatFecha(h.fecha)} · {h.horas}h · {nombreAsignatura(h.asignaturaId)}
                  </p>
                  <BotonBorrar onClick={() => onDeleteHoras(h.id)} label="Eliminar horas de estudio" />
                </div>
              ))}
            </div>
          </Card>
        )
      )}

      {/* 🚨 Una sección sin sistema detrás. Ni una lista falsa ni un botón que no haría nada
          (regla 8): una frase que dice qué es y que todavía no se puede guardar nada dentro. */}
      {rama && !sistema && (
        <Card>
          <p className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.text }}>
            <span aria-hidden="true">{rama.icono}</span> {rama.nombre}
          </p>
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: COLORS.textMuted }}>
            {TEXTO_RAMA_SIN_SISTEMA}
          </p>
        </Card>
      )}

      {/* Una rama que ya no existe —la quitó mientras la miraba— no deja la pantalla en blanco. */}
      {!rama && <EmptyHint text="Esa sección ya no está en esta área." />}
    </div>
  );
}
