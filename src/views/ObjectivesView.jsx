import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, CheckCircle2, Circle, CalendarClock, Sparkles, Loader2, Star, ArrowLeft, Pencil, Pause, Play, Archive } from 'lucide-react';
import { COLORS, PLAZOS_OBJETIVO, DIAS_ENTRE_REVISIONES } from '../tokens';
import { uid, todayISO } from '../lib/helpers';
import { askAI, AI_SYSTEM } from '../lib/ai';
import { Card, SectionTitle, Field, TextInput, Select, PrimaryButton, GhostBtn, ToggleTab, EmptyHint, AIPanel } from '../components/ui';
/* E3 F27 (PR F5) — Objetivos pasa a ser una mini-app completa. 🚨 Ni un objetivo
   nuevo: se amplía el que vive en la clave `objetivos` desde la Fase 9, y **ni un
   campo se renombra** — `texto`, `plazo` y `cumplido` los leen otros
   veinticuatro archivos, Fe incluido. */
import {
  ESTADOS_OBJETIVO, estadoDeObjetivo, estadoObjetivo,
  CATEGORIAS_OBJETIVO, categoriaObjetivo,
  PRIORIDADES, PRIORIDAD_POR_DEFECTO, etiquetaDePrioridad,
  crearObjetivo, editarObjetivo, completarObjetivo, cambiarEstadoObjetivo,
  marcarPrincipal, fechaLimiteDeObjetivo, textoDePlazo,
  progresoDeObjetivo, metasDeObjetivo, progresoDeMeta, metaCompletada,
  FILTROS_OBJETIVO, filtrarObjetivos, ordenarObjetivos, VACIO_OBJETIVOS,
} from '../lib/metasObjetivos';

function diasDesde(iso) {
  if (!iso) return Infinity;
  const ms = new Date(todayISO() + 'T00:00:00') - new Date(iso + 'T00:00:00');
  return Math.floor(ms / 86400000);
}

function RevisionBanner({ ultimaRevision, objetivos, accent, onRevisionHecha }) {
  const [abierta, setAbierta] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const dias = diasDesde(ultimaRevision);
  const toca = dias >= DIAS_ENTRE_REVISIONES;

  if (!toca && !abierta) return null;

  const pedirRevision = async () => {
    setAbierta(true);
    setCargando(true);
    setError('');
    try {
      const respuesta = await askAI(
        AI_SYSTEM,
        `Objetivos actuales de Josué, 16 años (JSON): ${JSON.stringify(objetivos.map((o) => ({ texto: o.texto, plazo: o.plazo, cumplido: o.cumplido })))}. ` +
          `Haz una revisión breve: valora en 2-3 frases si parece ir por buen camino según lo que tiene registrado, y sugiere como máximo un objetivo nuevo razonable si ves un hueco claro (ej. sin nada a 5-10 años). ` +
          `No decidas ni asumas que va a cumplir nada — es una reflexión, no una orden. Con 16 años es normal y sano que estos objetivos cambien con el tiempo.`
      );
      setTexto(respuesta || 'No he podido generar la revisión.');
      onRevisionHecha();
    } catch (e) {
      setError('No he podido generar la revisión ahora mismo. Inténtalo de nuevo en un momento.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Card style={{ background: `${COLORS.surface}`, border: `1px solid ${accent}55` }}>
      <div className="flex items-start gap-3">
        <CalendarClock size={18} style={{ color: accent, flexShrink: 0, marginTop: 2 }} />
        <div className="flex-1">
          {!abierta ? (
            <>
              <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
                {ultimaRevision ? `Hace ${dias} días que no revisas tus objetivos a largo plazo` : 'Todavía no has hecho una revisión de objetivos'}
              </p>
              <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>Es normal que cambien con el tiempo — merece la pena echarles un vistazo de vez en cuando.</p>
              <button onClick={pedirRevision} className="flex items-center gap-2 text-sm font-semibold" style={{ color: accent }}>
                <Sparkles size={15} /> Hacer revisión ahora
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: COLORS.text }}>
                {cargando && <Loader2 size={14} className="animate-spin" />} Revisión
              </p>
              {error && <p className="text-xs" style={{ color: COLORS.textMuted }}>{error}</p>}
              {texto && <p className="text-sm leading-relaxed" style={{ color: COLORS.text }}>{texto}</p>}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ⚠️ E3 F23 (PR F1) — Objetivos deja de ser un módulo y pasa a ser una mini-app
   de Productividad. **Esta pantalla no se ha tocado**: la fase que la absorbe
   dice expresamente que no se rehacen las mini-apps. Lo único que se le añade es
   `sinTitulo`, porque su nombre ya lo pone la cabecera del lanzador y repetirlo
   dos veces seguidas es el fallo de *Fondo* que vio Josué. */
/* ---------- Piezas de la mini-app Objetivos (E3 F27 · PR F5) ---------- */

function BarraProgreso({ porcentaje, accent }) {
  // ⚠️ `null` no es 0: sin metas no hay porcentaje, y no se pinta una barra
  // vacía que diría que va mal (E3 F13).
  if (porcentaje === null || porcentaje === undefined) return null;
  return (
    <div className="h-2 rounded-full mt-2 overflow-hidden" style={{ background: COLORS.border }}>
      <div className="h-full rounded-full" style={{ width: `${porcentaje}%`, background: accent, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function ChipPrioridadObj({ id }) {
  const e = etiquetaDePrioridad(id);
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: COLORS[e.token] || COLORS.textMuted }}>
      <span aria-hidden="true">{e.icono}</span>{e.nombre}
    </span>
  );
}

function TarjetaObjetivo({ objetivo, metas, accent, destacada, onAbrir }) {
  const cat = categoriaObjetivo(objetivo.categoria);
  const prog = progresoDeObjetivo(objetivo, metas);
  const estado = estadoDeObjetivo(objetivo);
  const plazoTexto = textoDePlazo(objetivo);
  return (
    <Card
      id={`objetivo-${objetivo.id}`}
      style={{ padding: '1rem', transition: 'box-shadow 0.3s ease', boxShadow: destacada ? `0 0 0 2px ${accent}` : 'none' }}
    >
      <button onClick={() => onAbrir(objetivo)} className="w-full text-left">
        <div className="flex items-start gap-2">
          {objetivo.principal && <Star size={16} aria-label="Objetivo principal" style={{ color: accent, flexShrink: 0, marginTop: 2 }} />}
          <p className="text-base font-bold flex-1" style={{ color: COLORS.text, textDecoration: objetivo.cumplido ? 'line-through' : 'none' }}>
            {cat ? `${cat.icono} ` : '🎯 '}{objetivo.texto}
          </p>
        </div>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{prog.texto}</p>
        <BarraProgreso porcentaje={prog.porcentaje} accent={accent} />
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-xs" style={{ color: COLORS.textMuted }}>{objetivo.plazo}</span>
          {plazoTexto && (
            <span className="text-xs" style={{ color: plazoTexto === 'Vencida' ? COLORS.danger : COLORS.textMuted }}>{plazoTexto}</span>
          )}
          {!objetivo.cumplido && <ChipPrioridadObj id={objetivo.prioridad} />}
          {estado !== 'activo' && (
            <span className="text-xs" style={{ color: COLORS.textMuted }}>
              <span aria-hidden="true">{estadoObjetivo(estado)?.icono}</span> {estadoObjetivo(estado)?.nombre}
            </span>
          )}
        </div>
      </button>
    </Card>
  );
}

export function FormularioObjetivo({ objetivo = null, accent, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    texto: objetivo?.texto || '',
    descripcion: objetivo?.descripcion || '',
    // 🚨 El plazo NO tiene valor por defecto al crear: hay que elegirlo.
    plazo: objetivo?.plazo || '',
    fechaObjetivo: objetivo?.fechaObjetivo || '',
    categoria: objetivo?.categoria || '',
    prioridad: objetivo?.prioridad || PRIORIDAD_POR_DEFECTO,
  });
  const valido = !!form.texto.trim() && PLAZOS_OBJETIVO.includes(form.plazo);

  const guardar = () => {
    if (!valido) return;
    const campos = {
      texto: form.texto,
      descripcion: form.descripcion,
      plazo: form.plazo,
      fechaObjetivo: form.fechaObjetivo || null,
      categoria: form.categoria || null,
    };
    onGuardar(objetivo
      ? editarObjetivo(objetivo, { ...campos, prioridad: form.prioridad })
      : crearObjetivo({ ...campos, prioridadId: form.prioridad }));
  };

  return (
    <Card id="nuevo-objetivo-input">
      <Field label="Objetivo">
        <TextInput
          aria-label="Nombre del objetivo" value={form.texto}
          onChange={(ev) => setForm({ ...form, texto: ev.target.value })}
          placeholder="Ej. mejorar mi físico"
        />
      </Field>
      <Field label="Descripción (opcional)">
        <TextInput
          aria-label="Descripción del objetivo" value={form.descripcion}
          onChange={(ev) => setForm({ ...form, descripcion: ev.target.value })}
          placeholder="Para qué lo quieres"
        />
      </Field>
      <Field label="Plazo">
        <Select value={form.plazo} onChange={(ev) => setForm({ ...form, plazo: ev.target.value })} aria-label="Plazo del objetivo">
          {/* ⚠️ Sin opción marcada de salida: elegir el plazo por él metería su
              objetivo en "30 días" sin decírselo (EH F28, HT F3). */}
          <option value="">Elige un plazo</option>
          {PLAZOS_OBJETIVO.map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
      </Field>
      <Field label="Fecha objetivo (opcional)">
        <TextInput
          type="date" aria-label="Fecha objetivo" value={form.fechaObjetivo}
          onChange={(ev) => setForm({ ...form, fechaObjetivo: ev.target.value })}
        />
      </Field>
      <Field label="Categoría (opcional)">
        <Select value={form.categoria} onChange={(ev) => setForm({ ...form, categoria: ev.target.value })} aria-label="Categoría del objetivo">
          <option value="">Sin categoría</option>
          {CATEGORIAS_OBJETIVO.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Select>
      </Field>
      <Field label="Prioridad">
        <div className="flex gap-2">
          {PRIORIDADES.map((pr) => (
            <button
              key={pr.id} onClick={() => setForm({ ...form, prioridad: pr.id })}
              aria-label={`Prioridad ${pr.nombre}`} aria-pressed={form.prioridad === pr.id}
              className="flex-1 rounded-xl py-2 text-xs font-semibold toque-44"
              style={{
                background: form.prioridad === pr.id ? accent : COLORS.card,
                color: form.prioridad === pr.id ? COLORS.textOnAccent : COLORS.text,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <span aria-hidden="true">{pr.icono}</span> {pr.nombre}
            </button>
          ))}
        </div>
      </Field>
      <div className="flex gap-2 mt-3">
        <PrimaryButton accent={accent} icon={objetivo ? Pencil : Plus} onClick={guardar} disabled={!valido}>
          {objetivo ? 'Guardar cambios' : 'Añadir objetivo'}
        </PrimaryButton>
        <GhostBtn onClick={onCancelar}>Cancelar</GhostBtn>
      </div>
    </Card>
  );
}

function DetalleObjetivo({ objetivo, metas, accent, onGuardar, onCompletar, onEstado, onPrincipal, onDelete, onCerrar, onAbrirMeta }) {
  const [editando, setEditando] = useState(false);
  const prog = progresoDeObjetivo(objetivo, metas);
  const suyas = metasDeObjetivo(objetivo.id, metas);
  const limite = fechaLimiteDeObjetivo(objetivo);
  const estado = estadoDeObjetivo(objetivo);

  if (editando) {
    return (
      <FormularioObjetivo
        objetivo={objetivo} accent={accent}
        onGuardar={(o) => { if (o) onGuardar(o); setEditando(false); }}
        onCancelar={() => setEditando(false)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={onCerrar} className="flex items-center gap-1 text-xs toque-44" style={{ color: COLORS.textMuted }}>
        <ArrowLeft size={14} /> Volver a los objetivos
      </button>

      <Card>
        <p className="text-lg font-bold" style={{ color: COLORS.text }}>{objetivo.texto}</p>
        {objetivo.descripcion && <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{objetivo.descripcion}</p>}
        <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>{prog.texto}</p>
        <BarraProgreso porcentaje={prog.porcentaje} accent={accent} />
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-xs" style={{ color: COLORS.textMuted }}>{objetivo.plazo}</span>
          <ChipPrioridadObj id={objetivo.prioridad} />
          <span className="text-xs" style={{ color: COLORS.textMuted }}>
            <span aria-hidden="true">{estadoObjetivo(estado)?.icono}</span> {estadoObjetivo(estado)?.nombre}
          </span>
        </div>
        {limite && (
          <p className="text-xs mt-1" style={{ color: limite.vencida ? COLORS.danger : COLORS.textMuted }}>
            {limite.origen === 'elegida' ? 'Fecha que elegiste' : 'Según el plazo'}: {limite.fecha.split('-').reverse().join('/')}
          </p>
        )}
        {/* ⚠️ El choque entre el plazo y la fecha elegida NO se resuelve en
            silencio: se dice, como `tallaDe()` en EH F5. */}
        {limite && limite.choca && (
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            Por el plazo tocaría el {limite.segunPlazo.split('-').reverse().join('/')}. Manda la fecha que elegiste.
          </p>
        )}
      </Card>

      <Card>
        <SectionTitle>Acciones</SectionTitle>
        <div className="flex gap-2 flex-wrap">
          <GhostBtn icon={objetivo.cumplido ? Circle : CheckCircle2} onClick={() => onCompletar(objetivo)}>
            {objetivo.cumplido ? 'Marcar sin cumplir' : 'Completar'}
          </GhostBtn>
          <GhostBtn icon={Pencil} onClick={() => setEditando(true)}>Editar</GhostBtn>
          <GhostBtn icon={Star} onClick={() => onPrincipal(objetivo)}>
            {objetivo.principal ? 'Quitar de principal' : 'Marcar como principal'}
          </GhostBtn>
          {estado === 'pausa'
            ? <GhostBtn icon={Play} onClick={() => onEstado(objetivo, 'activo')}>Reanudar</GhostBtn>
            : <GhostBtn icon={Pause} onClick={() => onEstado(objetivo, 'pausa')}>Pausar</GhostBtn>}
          {estado === 'archivado'
            ? <GhostBtn icon={Play} onClick={() => onEstado(objetivo, 'activo')}>Desarchivar</GhostBtn>
            : <GhostBtn icon={Archive} onClick={() => onEstado(objetivo, 'archivado')}>Archivar</GhostBtn>}
        </div>
        {/* ⚠️ Archivar no borra que lo cumplió, y se dice (E3 F19). */}
        <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
          Archivar lo quita de la lista de activos. No borra nada ni cambia si está cumplido.
        </p>
      </Card>

      <Card>
        <SectionTitle>Metas de este objetivo</SectionTitle>
        {suyas.length === 0 && (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            Todavía no tiene metas. Las metas son lo medible: “15 dominadas”, “entrenar 4 días”. Se crean en Metas y se enlazan desde allí.
          </p>
        )}
        {suyas.map((m) => {
          const p = progresoDeMeta(m);
          return (
            <button
              key={m.id} onClick={() => onAbrirMeta && onAbrirMeta(m)}
              className="w-full flex items-center justify-between py-2 text-left toque-44"
            >
              <span className="text-sm flex-1" style={{ color: COLORS.text, textDecoration: metaCompletada(m) ? 'line-through' : 'none' }}>
                {m.nombre}
              </span>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>{p.texto}</span>
            </button>
          );
        })}
      </Card>

      <Card>
        <button
          onClick={() => { onDelete(objetivo.id); onCerrar(); }}
          aria-label={`Eliminar el objetivo ${objetivo.texto}`}
          className="flex items-center gap-2 text-xs font-semibold toque-44"
          style={{ color: COLORS.danger }}
        >
          <Trash2 size={15} /> Eliminar objetivo
        </button>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
          Puedes recuperarlo desde Eliminados recientemente. Sus metas no se borran: se quedan sin objetivo.
        </p>
      </Card>
    </div>
  );
}

export default function ObjectivesView({
  objetivos, metas = [], onAdd, onUpdate, onDelete, onRevisionHecha,
  onGuardarLista, accent, foco, onFocoConsumido, sinTitulo = false,
}) {
  const [crear, setCrear] = useState(false);
  const [abierto, setAbierto] = useState(null);
  const [filtro, setFiltro] = useState('activos');
  // Ampliación del Dashboard — Centro de Control: `destacadoId` resalta brevemente (apartado 4/6:
  // "Dashboard → Objetivo específico") el objetivo al que se ha llegado por deep-link, para que
  // Josué vea de un vistazo cuál es sin tener que leer toda la lista.
  const [destacadoId, setDestacadoId] = useState(null);

  useEffect(() => {
    if (!foco) return undefined;
    if (foco.accion === 'nuevo') {
      setCrear(true);
      onFocoConsumido && onFocoConsumido();
      return undefined;
    }
    if (foco.id) {
      const el = document.getElementById(`objetivo-${foco.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setDestacadoId(foco.id);
      onFocoConsumido && onFocoConsumido();
      const t = setTimeout(() => setDestacadoId(null), 2200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [foco]);

  const lista = objetivos?.lista || [];
  const detalle = abierto ? lista.find((o) => o.id === abierto) : null;
  const visibles = ordenarObjetivos(filtrarObjetivos(lista, filtro));

  /* ⭐ El principal es UNO: marcarlo desmarca el anterior, así que la operación
     es sobre la lista entera y quien guarda es `App.jsx`. */
  const alternarPrincipal = (o) => {
    const siguiente = marcarPrincipal(lista, o.id);
    if (siguiente && onGuardarLista) onGuardarLista(siguiente);
  };

  if (detalle) {
    return (
      <div className="space-y-4 pb-4">
        <DetalleObjetivo
          objetivo={detalle} metas={metas} accent={accent}
          onGuardar={onUpdate}
          onCompletar={(o) => onUpdate(completarObjetivo(o))}
          onEstado={(o, e) => onUpdate(cambiarEstadoObjetivo(o, e))}
          onPrincipal={alternarPrincipal}
          onDelete={onDelete}
          onCerrar={() => setAbierto(null)}
        />
      </div>
    );
  }

  if (crear) {
    return (
      <div className="space-y-4 pb-4">
        <FormularioObjetivo
          accent={accent}
          onGuardar={(o) => { if (o) onAdd(o); setCrear(false); }}
          onCancelar={() => setCrear(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {sinTitulo ? null : <SectionTitle sub="De 30 días a 10 años — fijos hasta que tú decidas cambiarlos">Objetivos</SectionTitle>}

      <Card>
        <p className="text-sm" style={{ color: COLORS.textMuted }}>Define hacia dónde quieres avanzar.</p>
      </Card>

      <RevisionBanner ultimaRevision={objetivos.ultimaRevision} objetivos={lista} accent={accent} onRevisionHecha={onRevisionHecha} />

      <PrimaryButton accent={accent} icon={Plus} onClick={() => setCrear(true)}>Nuevo objetivo</PrimaryButton>

      {/* Los filtros solo aparecen cuando hay algo que filtrar. */}
      {lista.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTROS_OBJETIVO.map((f) => (
            <ToggleTab key={f.id} active={filtro === f.id} accent={accent} onClick={() => setFiltro(f.id)}>
              {f.nombre}
            </ToggleTab>
          ))}
        </div>
      )}

      {lista.length === 0 && (
        <Card className="text-center">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{VACIO_OBJETIVOS.titulo}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{VACIO_OBJETIVOS.texto}</p>
        </Card>
      )}
      {/* 🚨 Con objetivos pero ninguno en el filtro puesto, se DICE: una lista en
          blanco parecería que no tiene ninguno (la lección de la E3 F26). */}
      {lista.length > 0 && visibles.length === 0 && (
        <EmptyHint text="Ninguno encaja con este filtro. Prueba con “Todos”." />
      )}

      {visibles.map((o) => (
        <TarjetaObjetivo
          key={o.id} objetivo={o} metas={metas} accent={accent}
          destacada={destacadoId === o.id}
          onAbrir={(x) => setAbierto(x.id)}
        />
      ))}

      <AIPanel
        label="¿Voy por buen camino?"
        accent={accent}
        buildPrompt={() =>
          `Objetivos de Josué (JSON): ${JSON.stringify(lista.map((o) => ({ texto: o.texto, plazo: o.plazo, cumplido: o.cumplido })))}. ` +
          `Valora brevemente si parece ir avanzando según lo que tiene marcado como cumplido, sin inventar datos que no tengas.`
        }
      />
    </div>
  );
}
