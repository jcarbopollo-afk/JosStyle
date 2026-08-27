// ============================================================================
// EH · Fases 1 y 2/65 — LA PANTALLA
//
// F1 dejó una pantalla mínima. La **Fase 2** construye la gestión de verdad:
// categorías, buscador, orden, confirmación al apagar, recomendados y ficha.
//
// ── LAS DECISIONES QUE SE VEN ──────────────────────────────────────────────
//
// **1. Las plaquitas dicen la verdad.** Ninguno de los trece módulos tiene
// contenido todavía —el enunciado lo prohíbe expresamente— así que la plaquita
// **no lleva a ninguna parte y lo dice**, en vez de abrir una pantalla vacía.
// Es la regla 8 del proyecto: nada de "próximamente" ni de controles
// decorativos, pero tampoco fingir que algo funciona.
//
// **2. La pantalla no decide nada.** Los tres estados del apartado 13 los
// calcula `estadoPantalla()`; qué hay en cada categoría, `modulosAgrupados()`;
// si hay que avisar al apagar, `avisoDesactivar()`. Todo con pruebas de Node.
// Tres `if` encadenados en una vista es donde aparece el cuarto caso que nadie
// contempló.
//
// **3. Las plaquitas son pequeñas** (F1, apartado 5): *"no crear diseños
// excesivamente grandes, queremos que se puedan mostrar bastantes módulos sin
// que la pantalla resulte pesada"*.
//
// **4. Reordenar es un modo, no un estorbo.** Las flechas ↑↓ solo salen cuando
// se pulsa "Ordenar" (F2, apartado 9), y en los extremos salen apagadas en vez
// de no hacer nada al pulsarlas.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Check, ArrowLeft, Search, X, ChevronUp, ChevronDown, ArrowUpDown, Plus } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, PrimaryButton, Switch, TextInput } from '../components/ui';
import {
  modulosActivos, todosLosModulos, configurarPrimeraVez,
  alternarModulo, estadoPantalla, resumenEstiloHombre,
} from '../lib/estiloDeHombre';
import {
  modulosAgrupados, resultadosAgrupados, avisoDesactivar, subirModulo, bajarModulo,
  puedeMover, recomendados, fichaModulo, TEXTOS_GESTION, resumenGestion,
} from '../lib/gestionModulos';

/* ===========================================================================
   UNA PLAQUITA (F1, apartado 5)
   ===========================================================================
   Icono, nombre y una descripción corta. Nada más: el apartado lo pide
   pequeño, y con trece módulos la diferencia entre "cabe" y "no cabe" son
   veinte píxeles de alto. */
export function Plaquita({ modulo, accent, orden = null, onSubir, onBajar }) {
  return (
    <div
      className="rounded-2xl p-2.5 flex items-center gap-2"
      style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, minWidth: 0 }}
    >
      <span className="text-base leading-none flex-shrink-0" aria-hidden="true">{modulo.icono}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate" style={{ color: COLORS.text }}>{modulo.nombre}</p>
        <p className="text-[10px] truncate" style={{ color: COLORS.textMuted }}>{modulo.sub}</p>
      </div>
      {/* Apartado 9 — ↑ Subir ↓ Bajar. En los extremos se apagan, no se
          esconden: una flecha que desaparece mueve la interfaz al pulsarla. */}
      {orden && (
        <div className="flex flex-col flex-shrink-0">
          <button
            onClick={onSubir} disabled={!orden.arriba} aria-label={`Subir ${modulo.nombre}`}
            style={{ color: orden.arriba ? accent : COLORS.border }} className="p-0.5"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={onBajar} disabled={!orden.abajo} aria-label={`Bajar ${modulo.nombre}`}
            style={{ color: orden.abajo ? accent : COLORS.border }} className="p-0.5"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ===========================================================================
   EL AVISO AL DESACTIVAR (F2, apartado 6)
   ===========================================================================
   ⚠️ `createPortal` — regla 3 del proyecto. Un `fixed inset-0` sin portal se
   ancla al contenedor de `.module-enter` y aparece "abajo del todo". */
function AvisoDesactivar({ aviso, accent, onConfirmar, onCancelar }) {
  if (!aviso) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onCancelar}
    >
      <div
        className="rounded-3xl p-4 w-full max-w-xs"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>⚠️ {aviso.titulo}</p>
        <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>{aviso.texto}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancelar}
            className="flex-1 rounded-2xl py-2 text-xs font-semibold"
            style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
          >
            {aviso.cancelar}
          </button>
          <button
            onClick={onConfirmar}
            className="flex-1 rounded-2xl py-2 text-xs font-semibold"
            style={{ background: accent, color: '#fff' }}
          >
            {aviso.confirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ===========================================================================
   LA FICHA (F2, apartado 13)
   ===========================================================================
   *"Al pulsar sobre un módulo desde la gestión, puede aparecer una pequeña
   descripción. No entrar todavía en el módulo funcional."* */
export function FichaModuloEH({ ficha, accent, onCerrar }) {
  if (!ficha) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onCerrar}
    >
      <div
        className="rounded-t-3xl p-4 w-full max-w-md"
        style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none" aria-hidden="true">{ficha.icono}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{ficha.nombre}</p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>{ficha.sub}</p>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar"><X size={16} style={{ color: COLORS.textMuted }} /></button>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span
            className="text-[10px] font-semibold rounded-full px-2 py-0.5"
            style={{ background: COLORS.surface2, color: COLORS.textMuted }}
          >
            {ficha.categoriaIcono} {ficha.categoria}
          </span>
          <span
            className="text-[10px] font-semibold rounded-full px-2 py-0.5"
            style={{
              background: ficha.activo ? hexToRgba(accent, 0.14) : COLORS.surface2,
              color: ficha.activo ? accent : COLORS.textMuted,
            }}
          >
            {ficha.estadoTexto}
          </span>
        </div>

        {/* ⚠️ Regla 8: en vez de sugerir que hay algo detrás, dice cuándo lo habrá. */}
        {!ficha.contenido && (
          <p className="text-[11px] mt-3" style={{ color: COLORS.textMuted }}>{ficha.avisoContenido}</p>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ===========================================================================
   GESTIONAR APARTADOS (F1 apartados 4 y 6 · F2 completo)
   ===========================================================================
   *"Este sistema será reutilizado por todo Estilo de hombre"* — por eso es un
   componente aparte y sirve tanto para la primera vez como para después. */
export function GestionarApartados({ estado, accent, primeraVez = false, onGuardar, onCambiar, onCerrar }) {
  const [busqueda, setBusqueda] = useState('');
  const [ficha, setFicha] = useState(null);
  const [pendiente, setPendiente] = useState(null);   // { id, aviso }
  const todos = useMemo(() => todosLosModulos(estado), [estado]);

  // En la primera configuración se elige y se confirma; después, cada
  // interruptor se aplica al momento.
  const [elegidos, setElegidos] = useState(() => todos.filter((m) => m.activo).map((m) => m.id));

  const grupos = useMemo(
    () => (busqueda.trim() ? resultadosAgrupados(estado, busqueda) : modulosAgrupados(estado)),
    [estado, busqueda],
  );

  const activo = (id) => (primeraVez ? elegidos.includes(id) : !!todos.find((m) => m.id === id)?.activo);

  const tocar = (id) => {
    if (primeraVez) {
      setElegidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
      return;
    }
    // Apartado 6 — apagar un módulo con datos pregunta antes. Encenderlo, no.
    if (activo(id)) {
      const aviso = avisoDesactivar(estado, id);
      if (aviso) { setPendiente({ id, aviso }); return; }
    }
    onCambiar?.(alternarModulo(estado, id));
  };

  const confirmarApagado = () => {
    if (pendiente) onCambiar?.(alternarModulo(estado, pendiente.id, false));
    setPendiente(null);
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {!primeraVez && onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
          {primeraVez ? '¿Qué quieres utilizar?' : TEXTOS_GESTION.cabecera}
        </p>
      </div>
      <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>
        {primeraVez
          ? 'Elige los apartados que quieras tener. Puedes cambiarlo cuando quieras.'
          : TEXTOS_GESTION.ayuda}
      </p>

      {/* Apartado 12 — el buscador. Solo después de la primera configuración:
          con trece módulos delante y ninguno elegido, buscar sobra. */}
      {!primeraVez && (
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textMuted }} />
          <TextInput
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={TEXTOS_GESTION.buscar}
            style={{ paddingLeft: 34, paddingRight: busqueda ? 34 : undefined }}
            aria-label={TEXTOS_GESTION.buscar}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Borrar búsqueda"
            >
              <X size={14} style={{ color: COLORS.textMuted }} />
            </button>
          )}
        </div>
      )}

      {/* Apartado 3 — agrupado por categorías. Una categoría vacía no se pinta:
          `modulosAgrupados` ya las quita. */}
      {grupos.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: COLORS.textMuted }}>
          {TEXTOS_GESTION.sinResultados}
        </p>
      ) : grupos.map((cat) => (
        <div key={cat.id} className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: COLORS.textMuted }}>
            {cat.icono} {cat.nombre}
          </p>
          <div className="space-y-1">
            {cat.modulos.map((m) => {
              const on = activo(m.id);
              return (
                <div
                  key={m.id}
                  className="rounded-2xl p-2.5 flex items-center gap-2"
                  style={{
                    background: on ? hexToRgba(accent, 0.1) : COLORS.surface2,
                    border: `1px solid ${on ? accent : COLORS.border}`,
                  }}
                >
                  <button
                    onClick={() => (primeraVez ? tocar(m.id) : setFicha(fichaModulo(estado, m.id)))}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    aria-label={`Información de ${m.nombre}`}
                  >
                    <span className="text-base leading-none flex-shrink-0" aria-hidden="true">{m.icono}</span>
                    <span className="min-w-0">
                      <span className="text-[11px] font-semibold block truncate" style={{ color: COLORS.text }}>
                        {m.nombre}
                      </span>
                      <span className="text-[10px] block truncate" style={{ color: COLORS.textMuted }}>{m.sub}</span>
                    </span>
                  </button>
                  {primeraVez
                    ? (on && <Check size={14} style={{ color: accent }} className="flex-shrink-0" />)
                    : <Switch checked={on} onChange={() => tocar(m.id)} accent={accent} label={m.nombre} />}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {primeraVez && (
        <div className="mt-3">
          <PrimaryButton accent={accent} onClick={() => onGuardar?.(elegidos)}>Continuar</PrimaryButton>
          <p className="text-[10px] text-center mt-1.5" style={{ color: COLORS.textMuted }}>
            {elegidos.length === 0
              ? 'Puedes continuar sin elegir nada y decidirlo después.'
              : `${elegidos.length} ${elegidos.length === 1 ? 'apartado elegido' : 'apartados elegidos'}.`}
          </p>
        </div>
      )}

      <AvisoDesactivar
        aviso={pendiente?.aviso} accent={accent}
        onConfirmar={confirmarApagado} onCancelar={() => setPendiente(null)}
      />
      <FichaModuloEH ficha={ficha} accent={accent} onCerrar={() => setFicha(null)} />
    </Card>
  );
}

/* ===========================================================================
   TAMBIÉN PUEDES AÑADIR (F2, apartado 11)
   ===========================================================================
   *"Debe ser informativo, nunca obligatorio. No utilizar IA."* Y no aparece si
   no hay nada que sugerir: una sección con título y sin contenido es peor que
   ninguna sección. */
export function Recomendados({ estado, accent, onAnadir }) {
  const lista = useMemo(() => recomendados(estado), [estado]);
  if (lista.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: COLORS.textMuted }}>
        ✨ {TEXTOS_GESTION.recomendadosTitulo}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {lista.map((m) => (
          <button
            key={m.id}
            onClick={() => onAnadir?.(m.id)}
            className="rounded-full pl-2 pr-2.5 py-1 flex items-center gap-1.5"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
          >
            <span className="text-xs leading-none" aria-hidden="true">{m.icono}</span>
            <span className="text-[11px] font-semibold" style={{ color: COLORS.text }}>{m.nombre}</span>
            <Plus size={11} style={{ color: accent }} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===========================================================================
   LA PANTALLA (F1 apartados 2 y 13 · F2 apartados 9, 10 y 11)
   =========================================================================== */
export default function EstiloHombreView({ estiloHombre, accent, onCambiar }) {
  const [gestionando, setGestionando] = useState(false);
  const [ordenando, setOrdenando] = useState(false);
  const estado = estiloHombre;
  const pantalla = estadoPantalla(estado);
  const activos = useMemo(() => modulosActivos(estado), [estado]);
  const resumen = useMemo(() => resumenEstiloHombre(estado), [estado]);
  const gestion = useMemo(() => resumenGestion(estado), [estado]);

  // Apartado 3 de F1 — la primera configuración.
  if (pantalla === 'sin_configurar') {
    return (
      <div className="space-y-3">
        <Card className="text-center">
          <p className="text-2xl leading-none mb-2" aria-hidden="true">🧔</p>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Estilo de hombre</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            Personaliza tu espacio y utiliza solamente lo que necesitas.
          </p>
        </Card>
        <GestionarApartados
          estado={estado} accent={accent} primeraVez
          onGuardar={(ids) => onCambiar(configurarPrimeraVez(estado, ids))}
        />
      </div>
    );
  }

  if (gestionando) {
    return (
      <GestionarApartados
        estado={estado} accent={accent}
        onCambiar={onCambiar}
        onCerrar={() => setGestionando(false)}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* F2, apartado 10 — configurado pero sin nada encendido. No es una
          pantalla rota: es una decisión suya, y se le ofrece cambiarla. */}
      {pantalla === 'sin_modulos' ? (
        <Card className="text-center">
          <p className="text-2xl leading-none mb-2" aria-hidden="true">🧔</p>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_GESTION.vacioTitulo}</p>
          <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>{TEXTOS_GESTION.vacioTexto}</p>
          <PrimaryButton accent={accent} icon={Settings} onClick={() => setGestionando(true)}>
            {TEXTOS_GESTION.vacioAccion}
          </PrimaryButton>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {activos.map((m) => (
              <Plaquita
                key={m.id} modulo={m} accent={accent}
                orden={ordenando ? puedeMover(estado, m.id) : null}
                onSubir={() => onCambiar(subirModulo(estado, m.id))}
                onBajar={() => onCambiar(bajarModulo(estado, m.id))}
              />
            ))}
          </div>

          {/* ⚠️ Regla 8 y apartado 14 de F1. Ninguno de estos apartados tiene
              contenido todavía, y el enunciado prohíbe construirlo. Así que la
              pantalla LO DICE, en vez de que Josué toque una plaquita y no pase
              nada. */}
          {resumen.conContenido === 0 && !ordenando && (
            <p className="text-[11px] text-center" style={{ color: COLORS.textMuted }}>
              De momento esto es solo tu espacio elegido: el contenido de cada apartado llega en las
              siguientes fases.
            </p>
          )}

          {/* Apartado 9 — reordenar es un modo. Con un solo módulo activo no se
              ofrece: dos flechas que no hacen nada. */}
          {gestion.puedeReordenar && (
            <button
              onClick={() => setOrdenando((v) => !v)}
              className="flex items-center gap-1.5 text-[11px] font-semibold mx-auto"
              style={{ color: ordenando ? accent : COLORS.textMuted }}
            >
              <ArrowUpDown size={12} /> {ordenando ? 'Listo' : 'Ordenar'}
            </button>
          )}

          {/* Apartado 11 — informativo, nunca obligatorio, y sin IA. */}
          {!ordenando && (
            <Recomendados
              estado={estado} accent={accent}
              onAnadir={(id) => onCambiar(alternarModulo(estado, id, true))}
            />
          )}
        </>
      )}

      {/* F1, apartado 6 — la opción de gestionar SIEMPRE está. */}
      <button
        onClick={() => setGestionando(true)}
        className="flex items-center gap-1.5 text-[11px] font-semibold mx-auto"
        style={{ color: accent }}
      >
        <Settings size={12} /> Gestionar apartados
      </button>
    </div>
  );
}
