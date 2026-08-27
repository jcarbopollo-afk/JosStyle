// ============================================================================
// EH · Fases 1, 2 y 3/65 — LA PANTALLA
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
//
// **5. El asistente se puede saltar en cualquier paso** (F3, apartado 6), y
// saltárselo lleva a la misma pantalla que terminarlo. No es un estado
// degradado: es una decisión suya.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Check, ArrowLeft, Search, X, ChevronUp, ChevronDown, ArrowUpDown, Plus, SlidersHorizontal, Database, Lock, Pencil } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, PrimaryButton, Switch, TextInput } from '../components/ui';
import {
  modulosActivos, todosLosModulos, alternarModulo, estadoPantalla,
  resumenEstiloHombre, normalizarEstiloHombre,
} from '../lib/estiloDeHombre';
import {
  modulosAgrupados, resultadosAgrupados, avisoDesactivar, subirModulo, bajarModulo,
  puedeMover, recomendados, fichaModulo, TEXTOS_GESTION, resumenGestion,
} from '../lib/gestionModulos';
import {
  pasoAsistente, puedeOmitir, TEXTO_OMITIR, estadoAsistente, normalizarAsistente,
  iniciarAsistente, avanzar, retroceder, marcarEnSeleccion, seleccionarTodos,
  limpiarSeleccion, contadorSeleccion, terminarAsistente, omitirAsistente,
  reiniciarAsistente, modificarConfiguracion, loQueYaSabemos, configuracionPendiente,
  resumenAsistente,
} from '../lib/configuracionInicial';
import {
  todosLosDatos, resumenDatos, guardarDato, eliminarDato, antiguedadDato,
  TEXTO_SIN_DATO, ACCION_ANADIR,
} from '../lib/datosEstiloHombre';

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
   EL ASISTENTE DE PRIMERA CONFIGURACIÓN (F3)
   ===========================================================================
   *"Sencilla. Progresiva. Saltable. Personalizable. Reutilizable. Sin IA."*

   Cuatro pasos, y en tres de ellos se puede salir. La pantalla no decide por
   dónde va: se lo pregunta a `resumenAsistente()`. */

/** Apartado 5 — *"no necesitamos mostrar una cifra gigante ni hacer que parezca
 *  una tarea"*. Cuatro puntos y ya. */
function Pasos({ numero, de, accent }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: de }, (_, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: i + 1 === numero ? 16 : 5, height: 5,
            background: i + 1 <= numero ? accent : COLORS.border,
          }}
        />
      ))}
    </div>
  );
}

/** Apartado 7 — *"No preguntar información que JC Fitness ya conoce."* Se le
 *  enseña lo que ya sabemos y de dónde sale, en vez de volver a pedírselo. */
export function YaLoSabemos({ datosGlobales, accent }) {
  const { sabidos } = useMemo(() => loQueYaSabemos(datosGlobales), [datosGlobales]);
  if (sabidos.length === 0) return null;
  return (
    <div
      className="rounded-2xl p-3"
      style={{ background: hexToRgba(accent, 0.08), border: `1px solid ${hexToRgba(accent, 0.25)}` }}
    >
      <p className="text-[11px] font-semibold mb-1" style={{ color: COLORS.text }}>
        Esto ya lo sabemos, no hace falta que lo repitas
      </p>
      <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
        {sabidos.map((d) => d.que).join(' · ')}. Se lee de {[...new Set(sabidos.map((d) => d.donde))].join(', ')}.
      </p>
    </div>
  );
}

export function AsistenteEH({ estado, accent, datosGlobales, onCambiar }) {
  const resumen = useMemo(() => resumenAsistente(estado, datosGlobales), [estado, datosGlobales]);
  const contador = useMemo(() => contadorSeleccion(estado), [estado]);
  const seleccion = normalizarAsistente(normalizarEstiloHombre(estado).asistente).seleccion;
  const grupos = useMemo(() => modulosAgrupados(estado), [estado]);
  const paso = pasoAsistente(resumen.paso) || pasoAsistente('bienvenida');
  const esSeleccion = paso.id === 'seleccion';
  const esFinal = paso.id === 'final';
  const pendientes = useMemo(
    () => (esFinal ? configuracionPendiente(terminarAsistente(estado), datosGlobales) : []),
    [estado, datosGlobales, esFinal],
  );

  const siguiente = () => onCambiar(esFinal ? terminarAsistente(estado) : avanzar(estado));

  return (
    <div className="space-y-3">
      <Card className="text-center">
        <p className="text-2xl leading-none mb-2" aria-hidden="true">{paso.icono}</p>
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{paso.titulo}</p>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{paso.texto}</p>
        <div className="mt-3"><Pasos numero={resumen.numero} de={resumen.de} accent={accent} /></div>
      </Card>

      {/* Apartado 7 — lo que ya sabemos, antes de pedirle nada. */}
      {paso.id === 'explicacion' && <YaLoSabemos datosGlobales={datosGlobales} accent={accent} />}

      {/* Apartado 3 — la selección, agrupada por categorías. */}
      {esSeleccion && (
        <Card>
          {/* Apartado 4 — *"pero no debe ser la opción predeterminada"*: son dos
              botones pequeños, no un interruptor puesto de fábrica. */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>{contador.texto}</p>
            <div className="flex gap-2">
              <button
                onClick={() => onCambiar(seleccionarTodos(estado))}
                className="text-[11px] font-semibold" style={{ color: contador.todos ? COLORS.textMuted : accent }}
                disabled={contador.todos}
              >
                Seleccionar todos
              </button>
              <button
                onClick={() => onCambiar(limpiarSeleccion(estado))}
                className="text-[11px] font-semibold" style={{ color: contador.ninguno ? COLORS.textMuted : accent }}
                disabled={contador.ninguno}
              >
                Limpiar
              </button>
            </div>
          </div>

          {grupos.map((cat) => (
            <div key={cat.id} className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: COLORS.textMuted }}>
                {cat.icono} {cat.nombre}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {cat.modulos.map((m) => {
                  const on = seleccion.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => onCambiar(marcarEnSeleccion(estado, m.id))}
                      className="rounded-2xl p-2.5 flex items-center gap-2 text-left"
                      style={{
                        background: on ? hexToRgba(accent, 0.12) : COLORS.surface2,
                        border: `1px solid ${on ? accent : COLORS.border}`,
                        minWidth: 0,
                      }}
                      aria-pressed={on}
                    >
                      <span className="text-base leading-none flex-shrink-0" aria-hidden="true">{m.icono}</span>
                      <span className="text-[11px] font-semibold flex-1 truncate" style={{ color: COLORS.text }}>
                        {m.nombre}
                      </span>
                      {on && <Check size={12} style={{ color: accent }} className="flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Apartado 8 — *"no mostrar todos los formularios juntos"*. Y regla 8:
          hoy ninguno de esos formularios existe, así que se dice CUÁNDO llega
          cada uno en vez de abrir una pantalla vacía. */}
      {esFinal && pendientes.length > 0 && (
        <Card>
          <p className="text-[11px] font-semibold mb-2" style={{ color: COLORS.text }}>Lo que has elegido</p>
          <div className="space-y-1">
            {pendientes.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <span className="text-sm leading-none" aria-hidden="true">{m.icono}</span>
                <span className="text-[11px] flex-1 truncate" style={{ color: COLORS.text }}>{m.nombre}</span>
                <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  {m.reutiliza > 0 ? `${m.reutiliza} datos ya guardados` : 'Sin configurar'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-2" style={{ color: COLORS.textMuted }}>
            Cada apartado se configura por su cuenta cuando lo abras. No hay nada más que rellenar ahora.
          </p>
        </Card>
      )}

      <div>
        <PrimaryButton accent={accent} onClick={siguiente}>{paso.boton}</PrimaryButton>
        <div className="flex items-center justify-center gap-4 mt-2">
          {resumen.numero > 1 && !esFinal && (
            <button onClick={() => onCambiar(retroceder(estado))} className="text-[11px] font-semibold"
              style={{ color: COLORS.textMuted }}>
              Atrás
            </button>
          )}
          {/* Apartado 6 — omitir por ahora. No se rompe nada. */}
          {puedeOmitir(paso.id) && (
            <button onClick={() => onCambiar(omitirAsistente(estado))} className="text-[11px] font-semibold"
              style={{ color: COLORS.textMuted }}>
              {TEXTO_OMITIR}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Apartado 15 — *"Continuar configuración"* o *"Empezar de nuevo"*. */
export function RetomarConfiguracion({ estado, accent, onCambiar }) {
  const resumen = useMemo(() => resumenAsistente(estado, {}), [estado]);
  return (
    <Card className="text-center">
      <p className="text-2xl leading-none mb-2" aria-hidden="true">🧔</p>
      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Lo dejaste a medias</p>
      <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>
        Ibas por el paso {resumen.numero} de {resumen.de}
        {resumen.seleccionados > 0
          ? `, con ${resumen.seleccionados} ${resumen.seleccionados === 1 ? 'apartado elegido' : 'apartados elegidos'}.`
          : '.'}
      </p>
      <PrimaryButton accent={accent} onClick={() => onCambiar(iniciarAsistente(estado))}>
        Continuar configuración
      </PrimaryButton>
      <button
        onClick={() => onCambiar(reiniciarAsistente(estado))}
        className="text-[11px] font-semibold mt-2"
        style={{ color: COLORS.textMuted }}
      >
        Empezar de nuevo
      </button>
    </Card>
  );
}

/* ===========================================================================
   GESTIONAR APARTADOS (F1 apartados 4 y 6 · F2 completo)
   ===========================================================================
   *"Este sistema será reutilizado por todo Estilo de hombre"* — por eso es un
   componente aparte y sirve tanto para la primera vez como para después. */
export function GestionarApartados({ estado, accent, onCambiar, onCerrar, onMisDatos }) {
  const [busqueda, setBusqueda] = useState('');
  const [ficha, setFicha] = useState(null);
  const [pendiente, setPendiente] = useState(null);   // { id, aviso }
  const todos = useMemo(() => todosLosModulos(estado), [estado]);

  const grupos = useMemo(
    () => (busqueda.trim() ? resultadosAgrupados(estado, busqueda) : modulosAgrupados(estado)),
    [estado, busqueda],
  );

  const activo = (id) => !!todos.find((m) => m.id === id)?.activo;

  const tocar = (id) => {
    // F2, apartado 6 — apagar un módulo con datos pregunta antes. Encenderlo, no.
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
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_GESTION.cabecera}</p>
      </div>
      <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>{TEXTOS_GESTION.ayuda}</p>

      {/* F2, apartado 12 — el buscador. */}
      {(
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
                    onClick={() => setFicha(fichaModulo(estado, m.id))}
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
                  <Switch checked={on} onChange={() => tocar(m.id)} accent={accent} label={m.nombre} />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* F3, apartado 16 — *"Modificar mi configuración. Pero esto no debe
          borrar datos."* Vuelve al asistente por el paso de la selección, con lo
          que hoy está encendido ya marcado y EN SU ORDEN. */}
      <div className="flex items-center justify-center gap-4 mt-1">
        <button
          onClick={() => onCambiar?.(modificarConfiguracion(estado))}
          className="flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: COLORS.textMuted }}
        >
          <SlidersHorizontal size={12} /> Modificar mi configuración
        </button>
        {/* F3 apartado 13 y F4 apartado 8 — *"No queremos que las respuestas
            iniciales queden bloqueadas para siempre."* */}
        {onMisDatos && (
          <button
            onClick={onMisDatos}
            className="flex items-center gap-1.5 text-[11px] font-semibold"
            style={{ color: COLORS.textMuted }}
          >
            <Database size={12} /> Mis datos
          </button>
        )}
      </div>

      <AvisoDesactivar
        aviso={pendiente?.aviso} accent={accent}
        onConfirmar={confirmarApagado} onCancelar={() => setPendiente(null)}
      />
      <FichaModuloEH ficha={ficha} accent={accent} onCerrar={() => setFicha(null)} />
    </Card>
  );
}

/* ===========================================================================
   MIS DATOS (F3 apartado 13 · F4 completo)
   ===========================================================================
   *"Todo dato introducido por el usuario debe poder modificarse posteriormente…
   Nunca bloquear la información introducida."* (F4, apartado 8)

   ⚠️ **Y lo de fuera se edita fuera.** El peso sale con un candado y con el
   nombre del módulo donde vive: ofrecer aquí un campo para cambiarlo crearía la
   copia que prohíbe el apartado 3, y dos sitios donde se edita el mismo dato
   acaban dando dos números distintos.

   ⚠️ **Nunca `undefined` ni `null`** (apartado 15): lo que falta dice *"Todavía
   no tienes esta información"* y ofrece añadirlo. */
export function MisDatosEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar }) {
  const [editando, setEditando] = useState(null);   // { id, valor }
  const grupos = useMemo(() => todosLosDatos(estado, datosGlobales), [estado, datosGlobales]);
  const resumen = useMemo(() => resumenDatos(estado, datosGlobales), [estado, datosGlobales]);

  const guardar = () => {
    if (!editando) return;
    const { estado: nuevo, error } = guardarDato(estado, editando.id, editando.valor);
    if (!error) onCambiar?.(nuevo);
    setEditando(null);
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Mis datos</p>
      </div>
      <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>
        {resumen.globales} de {resumen.globalesTotal} datos ya los tiene JosStyle y no hace falta repetirlos.
        {resumen.compartidos > 0 && ` ${resumen.compartidos} se comparten entre apartados.`}
      </p>

      {grupos.map((cat) => (
        <div key={cat.id} className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: COLORS.textMuted }}>
            {cat.icono} {cat.nombre}
          </p>
          <div className="space-y-1">
            {cat.datos.map((d) => {
              const edad = d.origen === 'propio' ? antiguedadDato(estado, d.id) : { texto: '' };
              const enEdicion = editando?.id === d.id;
              return (
                <div
                  key={d.id}
                  className="rounded-2xl p-2.5"
                  style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold truncate" style={{ color: COLORS.text }}>{d.nombre}</p>
                      <p className="text-[10px] truncate" style={{ color: d.tiene ? COLORS.textMuted : COLORS.textMuted }}>
                        {d.tiene ? d.texto : TEXTO_SIN_DATO}
                      </p>
                    </div>
                    {/* ⚠️ Apartado 3 — lo global no se toca desde aquí. */}
                    {!d.editableAqui ? (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Lock size={11} style={{ color: COLORS.textMuted }} />
                        <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{d.donde}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setEditando(enEdicion ? null : { id: d.id, valor: d.tiene ? String(d.valor) : '' })}
                        className="flex items-center gap-1 flex-shrink-0 text-[10px] font-semibold"
                        style={{ color: accent }}
                      >
                        {d.tiene ? <Pencil size={11} /> : <Plus size={11} />}
                        {d.tiene ? 'Editar' : ACCION_ANADIR}
                      </button>
                    )}
                  </div>

                  {edad.texto && !enEdicion && (
                    <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>{edad.texto}</p>
                  )}

                  {enEdicion && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <TextInput
                        value={editando.valor}
                        onChange={(ev) => setEditando({ ...editando, valor: ev.target.value })}
                        placeholder={d.nombre}
                        aria-label={d.nombre}
                      />
                      <button
                        onClick={guardar}
                        className="rounded-2xl px-3 py-2 text-[11px] font-semibold flex-shrink-0"
                        style={{ background: accent, color: '#fff' }}
                      >
                        Guardar
                      </button>
                      {d.tiene && (
                        <button
                          onClick={() => { onCambiar?.(eliminarDato(estado, d.id).estado); setEditando(null); }}
                          className="text-[11px] font-semibold flex-shrink-0"
                          style={{ color: COLORS.textMuted }}
                        >
                          Borrar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
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
export default function EstiloHombreView({ estiloHombre, accent, datosGlobales = {}, onCambiar }) {
  const [gestionando, setGestionando] = useState(false);
  const [misDatos, setMisDatos] = useState(false);
  const [ordenando, setOrdenando] = useState(false);
  /* ⚠️ **Se calcula UNA sola vez, al entrar en el módulo** (regla 4: los hooks,
     antes de cualquier `return`). Si se recalculara en cada render, pulsar
     "Empezar" en la bienvenida pasaría el asistente a `en_curso` y acto seguido
     le saldría "Lo dejaste a medias" — sobre algo que acaba de empezar. Lo que
     el apartado 15 pide es distinguir **volver** de **seguir**, y eso no está en
     el estado guardado: está en si ya estaba a medias cuando abrió la pantalla. */
  const [veniaAMedias, setVeniaAMedias] = useState(() => estadoAsistente(estiloHombre) === 'en_curso');
  const estado = estiloHombre;
  const pantalla = estadoPantalla(estado);
  const asistente = estadoAsistente(estado);
  const seguir = (nuevo) => { setVeniaAMedias(false); onCambiar(nuevo); };
  const activos = useMemo(() => modulosActivos(estado), [estado]);
  const resumen = useMemo(() => resumenEstiloHombre(estado), [estado]);
  const gestion = useMemo(() => resumenGestion(estado), [estado]);

  /* F3 — el asistente manda mientras esté en curso o sin empezar.
     ⚠️ Los tres casos los decide `estadoAsistente()`, no un `if` aquí:
     'nunca' → bienvenida · 'en_curso' → retomar o seguir · lo demás → pantalla. */
  if (asistente === 'nunca' && pantalla === 'sin_configurar') {
    return <AsistenteEH estado={estado} accent={accent} datosGlobales={datosGlobales} onCambiar={seguir} />;
  }
  if (asistente === 'en_curso') {
    // Apartado 15 — si lo dejó a medias, primero se le ofrece continuar o
    // empezar de nuevo. Una vez elige, sigue el asistente normal.
    return veniaAMedias
      ? <RetomarConfiguracion estado={estado} accent={accent} onCambiar={seguir} />
      : <AsistenteEH estado={estado} accent={accent} datosGlobales={datosGlobales} onCambiar={seguir} />;
  }

  if (misDatos) {
    return (
      <MisDatosEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setMisDatos(false)}
      />
    );
  }

  if (gestionando) {
    return (
      <GestionarApartados
        estado={estado} accent={accent}
        onCambiar={onCambiar}
        onCerrar={() => setGestionando(false)}
        onMisDatos={() => { setGestionando(false); setMisDatos(true); }}
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
