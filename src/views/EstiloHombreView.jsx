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
import {
  MODULO_EH_ESTILO, DESTINO_ARMARIO, accesoAlArmario, resumenEstiloArmario,
} from '../lib/armarioEnEstiloHombre';
import {
  ZONA_MI_ESTILO, perfilDeEstilo, alternarValor, anadirLibre, limpiarCampo,
  estadoDelPerfil, loQueReflejaTuArmario, contrasteConElArmario, nombreDeValor,
  NIVELES_ESTILO,
} from '../lib/perfilEstilo';
import {
  MODULO_PELO, TEXTOS_PELO, perfilCapilar, contestarPelo, borrarPelo,
  progresoPelo, estadoPerfilCapilar, dudasDelPerfil,
} from '../lib/perfilCapilar';
import {
  PLAQUITAS_PELO, PARTES_PELO, ACCIONES_PELO, FRECUENCIAS_PELO, COMO_LO_NOTAS,
  datosPelo, parteActiva, alternarParte, crearRutina, editarRutina,
  impactoEliminarRutina, eliminarRutina, rutinasDeHoy, checklistDelDia,
  TEXTOS_ESTADO_DIA, marcarPaso, marcarRutinaEntera, historialPelo,
  registrarCambio, cambiosPelo, anadirProducto, resumenPelo, baseParaRecomendar,
} from '../lib/rutinasPelo';
import {
  MOTIVOS_DESCARTE, recomendarPelo, descartar, guardarRecomendacion,
  guardadasDePelo, aplicarARutina, PUENTE_PRODUCTOS_PELO, resumenRecomendacionesPelo,
} from '../lib/recomendacionesPelo';

/* ===========================================================================
   UNA PLAQUITA (F1, apartado 5)
   ===========================================================================
   Icono, nombre y una descripción corta. Nada más: el apartado lo pide
   pequeño, y con trece módulos la diferencia entre "cabe" y "no cabe" son
   veinte píxeles de alto. */
export function Plaquita({ modulo, accent, orden = null, onSubir, onBajar, onAbrir, sub = null }) {
  /* ⚠️ EH F5, apartado 1 — *"debe abrir el sistema de armario que ya existe. No
     crear una nueva pantalla equivalente."* Por eso la plaquita de Estilo y
     armario, y solo esa, es pulsable: es la única que hoy lleva a algún sitio.
     Las otras doce lo dicen en vez de no hacer nada al tocarlas (regla 8). */
  const Contenedor = onAbrir ? 'button' : 'div';
  return (
    <Contenedor
      onClick={onAbrir || undefined}
      className={`rounded-2xl p-2.5 flex items-center gap-2${onAbrir ? ' text-left w-full' : ''}`}
      style={{
        background: COLORS.surface2,
        border: `1px solid ${onAbrir ? accent : COLORS.border}`,
        minWidth: 0,
      }}
    >
      <span className="text-base leading-none flex-shrink-0" aria-hidden="true">{modulo.icono}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate" style={{ color: COLORS.text }}>{modulo.nombre}</p>
        <p className="text-[10px] truncate" style={{ color: COLORS.textMuted }}>{sub || modulo.sub}</p>
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
    </Contenedor>
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
   MI ESTILO (F6)
   ===========================================================================
   *"Armario → qué prendas tiene. Perfil de estilo → qué le gusta, qué quiere
   conseguir y qué imagen quiere transmitir."*

   ⚠️ **Todo es opcional** (apartado 13). No hay barra de progreso, ni
   porcentaje, ni la palabra "incompleto": un perfil vacío es un perfil válido y
   la pantalla no le pone nota. */
export function MiEstiloEH({ estado, accent, armario = null, datosGlobales = {}, onCambiar, onCerrar }) {
  const [libre, setLibre] = useState({});
  const campos = useMemo(() => perfilDeEstilo(estado, armario, datosGlobales), [estado, armario, datosGlobales]);
  const resumen = useMemo(() => estadoDelPerfil(estado, armario, datosGlobales), [estado, armario, datosGlobales]);
  const refleja = useMemo(() => loQueReflejaTuArmario(armario), [armario]);
  const contraste = useMemo(
    () => contrasteConElArmario(estado, armario, datosGlobales), [estado, armario, datosGlobales],
  );

  const anadir = (id) => {
    const texto = (libre[id] || '').trim();
    if (!texto) return;
    const { estado: nuevo, error } = anadirLibre(estado, id, texto);
    if (!error) onCambiar?.(nuevo);
    setLibre((prev) => ({ ...prev, [id]: '' }));
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
          {ZONA_MI_ESTILO.icono} {ZONA_MI_ESTILO.nombre}
        </p>
      </div>
      <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>
        Qué te gusta y qué imagen quieres dar. Puedes dejarlo todo vacío: nada de esto es obligatorio.
      </p>

      {/* Apartado 14 — informativo, no una clasificación. Solo si hay datos. */}
      {refleja.suficiente && (
        <div
          className="rounded-2xl p-3 mb-3"
          style={{ background: hexToRgba(accent, 0.08), border: `1px solid ${hexToRgba(accent, 0.25)}` }}
        >
          <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>{refleja.texto}</p>
          <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>
            Sale de {refleja.origen}.{contraste.hayContraste ? ` ${contraste.texto}` : ''}
          </p>
        </div>
      )}

      {campos.map((campo) => (
        <div key={campo.id} className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
              {campo.titulo}
            </p>
            {campo.tiene && (
              <button
                onClick={() => onCambiar?.(limpiarCampo(estado, campo.id).estado)}
                className="text-[10px] font-semibold"
                style={{ color: COLORS.textMuted }}
              >
                Limpiar
              </button>
            )}
          </div>

          {/* ⚠️ Apartado 5 — sin prendas no hay marcas que ofrecer, y se dice.
              Una lista vacía sin explicación parece una pantalla rota. */}
          {campo.sinOpciones ? (
            <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
              Cuando añadas prendas al armario podrás elegir entre sus marcas.
            </p>
          ) : campo.libre ? (
            <>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {campo.valores.map((v) => (
                  <button
                    key={v}
                    onClick={() => onCambiar?.(alternarValor(estado, campo.id, v).estado)}
                    className="rounded-full pl-2.5 pr-2 py-1 flex items-center gap-1"
                    style={{ background: hexToRgba(accent, 0.12), border: `1px solid ${accent}` }}
                  >
                    <span className="text-[11px] font-semibold" style={{ color: COLORS.text }}>{v}</span>
                    <X size={10} style={{ color: COLORS.textMuted }} />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <TextInput
                  value={libre[campo.id] || ''}
                  onChange={(ev) => setLibre((prev) => ({ ...prev, [campo.id]: ev.target.value }))}
                  placeholder="Escribe y añade"
                  aria-label={campo.titulo}
                />
                <button
                  onClick={() => anadir(campo.id)}
                  className="rounded-2xl px-3 py-2 text-[11px] font-semibold flex-shrink-0"
                  style={{ background: accent, color: '#fff' }}
                >
                  Añadir
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {campo.opciones.map((o) => {
                const on = campo.valores.includes(o.id);
                return (
                  <button
                    key={o.id}
                    onClick={() => onCambiar?.(alternarValor(estado, campo.id, o.id).estado)}
                    className="rounded-full px-2.5 py-1"
                    style={{
                      background: on ? hexToRgba(accent, 0.12) : COLORS.surface2,
                      border: `1px solid ${on ? accent : COLORS.border}`,
                    }}
                    aria-pressed={on}
                  >
                    <span className="text-[11px] font-semibold" style={{ color: on ? COLORS.text : COLORS.textMuted }}>
                      {o.nombre || o.label || o.id}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Apartado 3 — el orden ES la prioridad, así que se enseña numerado. */}
          {campo.ordenada && campo.valores.length > 1 && (
            <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
              Por orden: {campo.valores.map((v, i) => `${i + 1}. ${nombreDeValor(campo.id, v)}`).join(' · ')}
            </p>
          )}
        </div>
      ))}

      {/* ⚠️ Apartado 13 — un recuento, no una nota. Ni porcentaje ni "incompleto". */}
      <p className="text-[10px] text-center" style={{ color: COLORS.textMuted }}>
        {resumen.vacio
          ? 'Todo esto es opcional. Puedes volver cuando quieras.'
          : `Has rellenado ${resumen.rellenos} de ${resumen.total}. El resto puede quedarse vacío.`}
      </p>
    </Card>
  );
}

/* ===========================================================================
   PERFIL CAPILAR (F7)
   ===========================================================================
   *"Tu perfil capilar — Cuéntanos un poco sobre tu pelo para poder personalizar
   este apartado."* Con dos salidas desde el primer momento: **el usuario puede
   saltárselo** (apartado 1).

   ⚠️ Las doce preguntas se pintan desde `PREGUNTAS_PELO`. Esta pantalla no sabe
   ni una: cuando la fase 13 traiga las de Skincare, servirá igual. */
export function PerfilCapilarEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar }) {
  const preguntas = useMemo(() => perfilCapilar(estado, datosGlobales), [estado, datosGlobales]);
  const progreso = useMemo(() => progresoPelo(estado, datosGlobales), [estado, datosGlobales]);
  const dudas = useMemo(() => dudasDelPerfil(estado, datosGlobales), [estado, datosGlobales]);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
          💇 {progreso.sinEmpezar ? TEXTOS_PELO.titulo : TEXTOS_PELO.editar}
        </p>
      </div>
      <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>{TEXTOS_PELO.texto}</p>

      {preguntas.map((q) => (
        <div key={q.id} className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
              {q.titulo}
            </p>
            {q.contestada && (
              <button
                onClick={() => onCambiar?.(borrarPelo(estado, q.id).estado)}
                className="text-[10px] font-semibold"
                style={{ color: COLORS.textMuted }}
              >
                Quitar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {q.opcionesVisibles.map((o) => {
              const on = q.valores.includes(o.id);
              return (
                <button
                  key={o.id}
                  onClick={() => onCambiar?.(contestarPelo(estado, q.id, o.id).estado)}
                  className="rounded-full px-2.5 py-1"
                  style={{
                    background: on ? hexToRgba(accent, 0.12) : COLORS.surface2,
                    border: `1px solid ${on ? accent : COLORS.border}`,
                  }}
                  aria-pressed={on}
                >
                  <span className="text-[11px] font-semibold" style={{ color: on ? COLORS.text : COLORS.textMuted }}>
                    {o.nombre}
                  </span>
                </button>
              );
            })}
          </div>
          {q.ayuda && !q.contestada && (
            <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>{q.ayuda}</p>
          )}
        </div>
      ))}

      {/* ⚠️ Apartado 2 — "no lo sé" no es un hueco: es lo que abre la puerta al
          contenido educativo, y se dice CUÁNDO llega en vez de "próximamente". */}
      {dudas.length > 0 && (
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>{TEXTOS_PELO.educativo}</p>
      )}

      {/* Un recuento, no una nota. Contestar dos de doce está bien. */}
      <p className="text-[10px] text-center" style={{ color: COLORS.textMuted }}>
        {progreso.sinEmpezar
          ? 'Todo esto es opcional. Puedes contestar solo lo que quieras.'
          : `Has contestado ${progreso.contestadas} de ${progreso.total}. El resto puede quedarse sin contestar.`}
      </p>
    </Card>
  );
}

/* ===========================================================================
   PELO: PANEL, RUTINAS Y SEGUIMIENTO (F8)
   ===========================================================================
   *"La aplicación recomienda y organiza; el usuario decide."*

   ⚠️ **No castigar** (apartado 7). Un día sin hacer la rutina sale como
   "Pendiente" y nada más: ni rojo, ni un aspa, ni una cuenta de días perdidos.
   Hay una prueba de Node que recorre todos los textos buscando reproches. */

export function PanelPelo({ estado, accent, datosGlobales = {}, onCambiar, onCerrar, onPerfil }) {
  const [zona, setZona] = useState(null);      // null | 'rutina' | 'seguimiento' | 'ajustes'
  const resumen = useMemo(() => resumenPelo(estado), [estado]);
  const perfil = useMemo(() => progresoPelo(estado, datosGlobales), [estado, datosGlobales]);
  const recs = useMemo(() => resumenRecomendacionesPelo(estado, datosGlobales), [estado, datosGlobales]);

  if (zona === 'rutina') return <RutinasPeloEH estado={estado} accent={accent} onCambiar={onCambiar} onCerrar={() => setZona(null)} />;
  if (zona === 'seguimiento') return <SeguimientoPeloEH estado={estado} accent={accent} onCambiar={onCambiar} onCerrar={() => setZona(null)} />;
  if (zona === 'ajustes') return <AjustesPeloEH estado={estado} accent={accent} onCambiar={onCambiar} onCerrar={() => setZona(null)} />;
  if (zona === 'recomendaciones') {
    return (
      <RecomendacionesPeloEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setZona(null)}
      />
    );
  }

  const sub = {
    perfil: perfil.sinEmpezar ? 'Sin configurar' : `${perfil.contestadas} de ${perfil.total}`,
    rutina: resumen.rutinas === 0 ? 'Ninguna todavía' : `${resumen.rutinas} ${resumen.rutinas === 1 ? 'rutina' : 'rutinas'}`,
    seguimiento: resumen.registros === 0 ? 'Sin registros' : `${resumen.registros} ${resumen.registros === 1 ? 'día' : 'días'}`,
    recomendaciones: recs.disponibles === 0
      ? 'Cuéntanos algo más'
      : `${recs.disponibles} ${recs.disponibles === 1 ? 'opción' : 'opciones'}`,
  };

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-2 mb-3">
          {onCerrar && (
            <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
              <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
            </button>
          )}
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>💇 Pelo</p>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {PLAQUITAS_PELO.filter((p) => p.id !== 'recomendaciones' || parteActiva(estado, 'recomendaciones'))
            .filter((p) => p.id !== 'seguimiento' || parteActiva(estado, 'seguimiento'))
            .filter((p) => p.id !== 'rutina' || parteActiva(estado, 'rutinas'))
            .map((p) => {
              const abre = p.id === 'perfil' ? onPerfil
                : (p.id === 'rutina' ? () => setZona('rutina')
                  : (p.id === 'seguimiento' ? () => setZona('seguimiento')
                    : (p.id === 'recomendaciones' ? () => setZona('recomendaciones') : null)));
              return (
                <Plaquita
                  key={p.id} accent={accent}
                  modulo={{ nombre: p.nombre, icono: p.icono, sub: '' }}
                  /* ⚠️ Regla 8 — las dos que no funcionan dicen en qué fase
                     llegan, en vez de no hacer nada al tocarlas. */
                  sub={p.listo ? (sub[p.id] || '') : `Llega en la fase ${p.fase}`}
                  onAbrir={p.listo ? abre : null}
                />
              );
            })}
        </div>
      </Card>

      {/* Apartado 6 — la lista de hoy, si hay algo que tocar. */}
      <RutinaDeHoy estado={estado} accent={accent} onCambiar={onCambiar} />

      <button
        onClick={() => setZona('ajustes')}
        className="flex items-center gap-1.5 text-[11px] font-semibold mx-auto"
        style={{ color: COLORS.textMuted }}
      >
        <Settings size={12} /> Configurar Pelo
      </button>
    </div>
  );
}

/** Apartado 6 — *"Rutina de hoy"*, con sus casillas. */
export function RutinaDeHoy({ estado, accent, onCambiar }) {
  const hoy = useMemo(() => rutinasDeHoy(estado), [estado]);
  const listas = useMemo(
    () => hoy.map((r) => checklistDelDia(estado, r.id)).filter(Boolean), [estado, hoy],
  );
  if (listas.length === 0) return null;

  return (
    <Card>
      <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>Rutina de hoy</p>
      {listas.map((l) => (
        <div key={l.id} className="mb-3 last:mb-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>{l.nombre}</p>
            {/* ⚠️ Apartado 7: "Pendiente", nunca "Has fallado". */}
            <span className="text-[10px]" style={{ color: l.estado === 'hecha' ? accent : COLORS.textMuted }}>
              {TEXTOS_ESTADO_DIA[l.estado]}
            </span>
          </div>
          <div className="space-y-1">
            {l.pasos.map((p) => (
              <button
                key={p.id}
                onClick={() => onCambiar?.(marcarPaso(estado, l.id, p.id).estado)}
                className="rounded-2xl p-2.5 flex items-center gap-2 w-full text-left"
                style={{
                  background: p.hecho ? hexToRgba(accent, 0.1) : COLORS.surface2,
                  border: `1px solid ${p.hecho ? accent : COLORS.border}`,
                }}
                aria-pressed={p.hecho}
              >
                <span className="text-sm leading-none flex-shrink-0" aria-hidden="true">{p.icono}</span>
                <span className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold block truncate" style={{ color: COLORS.text }}>
                    {p.etiqueta}
                  </span>
                  {p.producto && (
                    <span className="text-[10px] block truncate" style={{ color: COLORS.textMuted }}>{p.producto}</span>
                  )}
                </span>
                {p.hecho && <Check size={14} style={{ color: accent }} className="flex-shrink-0" />}
              </button>
            ))}
          </div>
          {l.total > 1 && (
            <button
              onClick={() => onCambiar?.(marcarRutinaEntera(estado, l.id).estado)}
              className="text-[10px] font-semibold mt-1.5"
              style={{ color: accent }}
            >
              {l.estado === 'hecha' ? 'Desmarcar todo' : 'Marcar todo'}
            </button>
          )}
        </div>
      ))}
    </Card>
  );
}

/** Apartados 2, 3, 11, 12 y 14 — crear, editar y borrar rutinas. */
export function RutinasPeloEH({ estado, accent, onCambiar, onCerrar }) {
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [elegidos, setElegidos] = useState([]);
  const [frecuencia, setFrecuencia] = useState('diaria');
  const [aBorrar, setABorrar] = useState(null);
  const datos = useMemo(() => datosPelo(estado), [estado]);

  const crear = () => {
    const { estado: nuevo } = crearRutina(estado, {
      nombre: nombre.trim() || 'Mi rutina',
      pasos: elegidos.map((a) => ({ accion: a })),
      frecuencia,
    });
    onCambiar?.(nuevo);
    setCreando(false); setNombre(''); setElegidos([]); setFrecuencia('diaria');
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>🧴 Mi rutina</p>
      </div>

      {datos.rutinas.length === 0 && !creando && (
        <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>
          Todavía no tienes ninguna. Créala como quieras: aquí no hay rutinas puestas de fábrica.
        </p>
      )}

      <div className="space-y-1.5 mb-3">
        {datos.rutinas.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl p-2.5"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold truncate" style={{ color: COLORS.text }}>{r.nombre}</p>
                <p className="text-[10px] truncate" style={{ color: COLORS.textMuted }}>
                  {FRECUENCIAS_PELO.find((f) => f.id === r.frecuencia)?.nombre}
                  {r.pasos.length > 0 && ` · ${r.pasos.length} ${r.pasos.length === 1 ? 'paso' : 'pasos'}`}
                  {r.duracion ? ` · ${r.duracion} min` : ''}
                </p>
              </div>
              <Switch
                checked={r.activa}
                onChange={() => onCambiar?.(editarRutina(estado, r.id, { activa: !r.activa }).estado)}
                accent={accent} label={r.nombre}
              />
              <button onClick={() => setABorrar(impactoEliminarRutina(estado, r.id))} aria-label={`Borrar ${r.nombre}`}>
                <X size={14} style={{ color: COLORS.textMuted }} />
              </button>
            </div>
            {/* Apartado 5 — el recordatorio es suyo, y nace apagado. */}
            {parteActiva(estado, 'recordatorios') && (
              <button
                onClick={() => onCambiar?.(editarRutina(estado, r.id, { recordatorio: !r.recordatorio }).estado)}
                className="text-[10px] font-semibold mt-1"
                style={{ color: r.recordatorio ? accent : COLORS.textMuted }}
              >
                {r.recordatorio ? '🔔 Recordatorio activado' : '🔕 Recordatorio desactivado'}
              </button>
            )}
          </div>
        ))}
      </div>

      {creando ? (
        <div className="space-y-2">
          <TextInput value={nombre} onChange={(ev) => setNombre(ev.target.value)}
            placeholder="Nombre de la rutina" aria-label="Nombre de la rutina" />
          <div className="flex flex-wrap gap-1.5">
            {ACCIONES_PELO.map((a) => {
              const on = elegidos.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => setElegidos((p) => (on ? p.filter((x) => x !== a.id) : [...p, a.id]))}
                  className="rounded-full px-2.5 py-1"
                  style={{
                    background: on ? hexToRgba(accent, 0.12) : COLORS.surface2,
                    border: `1px solid ${on ? accent : COLORS.border}`,
                  }}
                  aria-pressed={on}
                >
                  <span className="text-[11px] font-semibold" style={{ color: on ? COLORS.text : COLORS.textMuted }}>
                    {a.icono} {a.nombre}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FRECUENCIAS_PELO.map((f) => (
              <button
                key={f.id} onClick={() => setFrecuencia(f.id)}
                className="rounded-full px-2.5 py-1"
                style={{
                  background: frecuencia === f.id ? hexToRgba(accent, 0.12) : COLORS.surface2,
                  border: `1px solid ${frecuencia === f.id ? accent : COLORS.border}`,
                }}
                aria-pressed={frecuencia === f.id}
              >
                <span className="text-[11px] font-semibold"
                  style={{ color: frecuencia === f.id ? COLORS.text : COLORS.textMuted }}>{f.nombre}</span>
              </button>
            ))}
          </div>
          <PrimaryButton accent={accent} onClick={crear}>Guardar rutina</PrimaryButton>
          <button onClick={() => setCreando(false)} className="text-[11px] font-semibold mx-auto block"
            style={{ color: COLORS.textMuted }}>Cancelar</button>
        </div>
      ) : (
        <PrimaryButton accent={accent} icon={Plus} onClick={() => setCreando(true)}>Crear rutina</PrimaryButton>
      )}

      {/* ⚠️ Borrar dice ANTES qué se lleva por delante. */}
      <AvisoDesactivar
        aviso={aBorrar?.existe ? {
          titulo: 'Borrar rutina', texto: aBorrar.texto, confirmar: 'Borrar', cancelar: 'Cancelar',
        } : null}
        accent={accent}
        onConfirmar={() => {
          const r = datos.rutinas.find((x) => x.nombre === aBorrar.nombre);
          if (r) onCambiar?.(eliminarRutina(estado, r.id).estado);
          setABorrar(null);
        }}
        onCancelar={() => setABorrar(null)}
      />
    </Card>
  );
}

/** Apartados 8 y 9 — historial y cambios. *"No convertirlo todavía en estadísticas complejas."* */
export function SeguimientoPeloEH({ estado, accent, onCambiar, onCerrar }) {
  const [nota, setNota] = useState('');
  const hist = useMemo(() => historialPelo(estado), [estado]);
  const cambios = useMemo(() => cambiosPelo(estado), [estado]);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>📈 Seguimiento</p>
      </div>

      {hist.length === 0 ? (
        <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>
          Cuando tengas alguna rutina, aquí verás cómo va.
        </p>
      ) : (
        <div className="space-y-1.5 mb-3">
          {hist.map((h) => (
            <div key={h.id} className="rounded-2xl p-2.5"
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <p className="text-[11px] font-semibold truncate" style={{ color: COLORS.text }}>{h.nombre}</p>
              {/* ⚠️ Sin días en los que tocara NO hay cumplimiento: decir "0 %"
                  de algo que nunca tocó es el reproche que prohíbe el apartado 7. */}
              <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
                {h.cumplimiento === null
                  ? `${h.hechas} ${h.hechas === 1 ? 'vez' : 'veces'} en el último mes`
                  : `${h.hechas} de ${h.tocaba} · ${h.cumplimiento} %`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Apartado 9 — ¿cómo notas tu pelo? */}
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: COLORS.textMuted }}>
        ¿Cómo notas tu pelo?
      </p>
      <div className="flex gap-1.5 mb-2">
        {COMO_LO_NOTAS.map((c) => (
          <button
            key={c.id}
            onClick={() => { onCambiar?.(registrarCambio(estado, c.id, nota).estado); setNota(''); }}
            className="rounded-full px-3 py-1 flex-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
          >
            <span className="text-[11px] font-semibold" style={{ color: COLORS.text }}>{c.nombre}</span>
          </button>
        ))}
      </div>
      <TextInput value={nota} onChange={(ev) => setNota(ev.target.value)}
        placeholder="Una nota, si quieres" aria-label="Nota" />

      {cambios.length > 0 && (
        <div className="mt-3 space-y-1">
          {cambios.slice(0, 5).map((c) => (
            <p key={c.id} className="text-[10px]" style={{ color: COLORS.textMuted }}>
              {c.fecha} · {COMO_LO_NOTAS.find((x) => x.id === c.como)?.nombre}
              {c.nota ? ` — ${c.nota}` : ''}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}

/** Apartado 15 — *"Cada parte puede desaparecer si el usuario no la quiere."* */
export function AjustesPeloEH({ estado, accent, onCambiar, onCerrar }) {
  const rec = useMemo(() => baseParaRecomendar(estado), [estado]);
  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>⚙️ Configurar Pelo</p>
      </div>
      <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>
        Lo que apagues deja de aparecer, pero no se borra nada.
      </p>
      <div className="space-y-1">
        {PARTES_PELO.map((p) => (
          <div key={p.id} className="rounded-2xl p-2.5 flex items-center gap-2"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <span className="text-[11px] font-semibold flex-1" style={{ color: COLORS.text }}>{p.nombre}</span>
            <Switch checked={parteActiva(estado, p.id)} onChange={() => onCambiar?.(alternarParte(estado, p.id))}
              accent={accent} label={p.nombre} />
          </div>
        ))}
      </div>
      {/* Regla 8 — se dice cuándo llegan, no "próximamente". */}
      <p className="text-[10px] mt-3" style={{ color: COLORS.textMuted }}>{rec.nota}</p>
    </Card>
  );
}

/* ===========================================================================
   RECOMENDACIONES DE PELO (F9)
   ===========================================================================
   *"💡 Recomendaciones para ti."* Tres, con su motivo y con las dos salidas de
   siempre.

   ⚠️ **Una recomendación no modifica nada** (apartado 10). "Añadir a mi rutina"
   llama a `aplicarARutina` con `confirmado: true`, y sin ese toque el estado no
   cambia ni un byte. */
export function RecomendacionesPeloEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar }) {
  const [verTodas, setVerTodas] = useState(false);
  const [nivel, setNivel] = useState(null);
  const [menu, setMenu] = useState(null);
  const r = useMemo(
    () => recomendarPelo(estado, datosGlobales, { nivel, limite: verTodas ? 99 : 3 }),
    [estado, datosGlobales, nivel, verTodas],
  );
  const guardadas = useMemo(() => guardadasDePelo(estado), [estado]);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>💡 Recomendaciones para ti</p>
      </div>
      <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>
        Salen de lo que nos has contado. Ninguna es obligatoria.
      </p>

      {/* Apartado 6 — el nivel lo elige él. */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {[{ id: null, nombre: 'Todos', icono: '' }, ...NIVELES_ESTILO].map((niv) => (
          <button
            key={niv.id || 'todos'} onClick={() => setNivel(niv.id)}
            className="rounded-full px-2.5 py-1"
            style={{
              background: nivel === niv.id ? hexToRgba(accent, 0.12) : COLORS.surface2,
              border: `1px solid ${nivel === niv.id ? accent : COLORS.border}`,
            }}
            aria-pressed={nivel === niv.id}
          >
            <span className="text-[11px] font-semibold" style={{ color: nivel === niv.id ? COLORS.text : COLORS.textMuted }}>
              {niv.icono} {niv.nombre}
            </span>
          </button>
        ))}
      </div>

      {/* Apartado 12 — falta información, pero NUNCA se bloquea. */}
      {r.falta.hayQueAfinar && (
        <div className="rounded-2xl p-3 mb-3"
          style={{ background: hexToRgba(accent, 0.08), border: `1px solid ${hexToRgba(accent, 0.25)}` }}>
          <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>{r.falta.titulo}</p>
          <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>{r.falta.texto}</p>
        </div>
      )}

      {r.recomendaciones.length === 0 ? (
        <p className="text-[11px] text-center py-3" style={{ color: COLORS.textMuted }}>
          Cuéntanos algo más sobre tu pelo y aquí aparecerán opciones que podrían encajarte.
        </p>
      ) : (
        <div className="space-y-1.5">
          {r.recomendaciones.map((x) => (
            <div key={x.reglaId} className="rounded-2xl p-2.5"
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-start gap-2">
                <span className="text-base leading-none flex-shrink-0" aria-hidden="true">{x.icono}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>
                    {x.titulo} <span style={{ color: COLORS.textMuted }}>{x.nivelIcono}</span>
                  </p>
                  <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{x.texto}</p>
                  {/* ⚠️ Apartado 5 — siempre el motivo. */}
                  <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>{x.porque}</p>
                </div>
                <button onClick={() => setMenu(menu === x.reglaId ? null : x.reglaId)}
                  className="flex-shrink-0 px-1" aria-label={`Opciones de ${x.titulo}`}>
                  <span className="text-[13px]" style={{ color: COLORS.textMuted }}>⋯</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <button onClick={() => onCambiar?.(guardarRecomendacion(estado, x.reglaId).estado)}
                  className="text-[10px] font-semibold" style={{ color: x.guardada ? accent : COLORS.textMuted }}>
                  {x.guardada ? '❤️ Guardada' : '❤️ Guardar'}
                </button>
                {/* ⚠️ Apartado 10 — solo si él lo confirma. */}
                {x.accion && (
                  <button
                    onClick={() => onCambiar?.(aplicarARutina(estado, x.reglaId, { confirmado: true }).estado)}
                    className="text-[10px] font-semibold" style={{ color: accent }}
                  >
                    Añadir a mi rutina
                  </button>
                )}
                {x.verProductos && (
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                    🛒 {PUENTE_PRODUCTOS_PELO.nota}
                  </span>
                )}
              </div>

              {/* Apartado 8 — los cuatro motivos, y nada más. */}
              {menu === x.reglaId && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {MOTIVOS_DESCARTE.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { onCambiar?.(descartar(estado, x.reglaId, m.id).estado); setMenu(null); }}
                      className="rounded-full px-2.5 py-1"
                      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
                    >
                      <span className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>{m.nombre}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Apartado 7 — "Ver más", para no saturar. */}
      {r.hayMas && !verTodas && (
        <button onClick={() => setVerTodas(true)} className="text-[11px] font-semibold mx-auto block mt-2"
          style={{ color: accent }}>
          Ver más
        </button>
      )}

      {guardadas.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: COLORS.textMuted }}>
            ⭐ Guardados
          </p>
          {guardadas.map((g) => (
            <p key={g.id} className="text-[10px]" style={{ color: COLORS.textMuted }}>{g.icono} {g.titulo}</p>
          ))}
        </div>
      )}
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
export default function EstiloHombreView({ estiloHombre, accent, datosGlobales = {}, armario = null, onIr, onCambiar }) {
  const [gestionando, setGestionando] = useState(false);
  const [misDatos, setMisDatos] = useState(false);
  const [miEstilo, setMiEstilo] = useState(false);
  const [perfilPelo, setPerfilPelo] = useState(false);   // false | 'panel' | 'perfil'
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
  /* F5 — el recuento del armario es DERIVADO, calculado aquí, nunca guardado. */
  const estiloArmario = useMemo(
    () => (armario ? resumenEstiloArmario(estado, armario, datosGlobales) : null),
    [estado, armario, datosGlobales],
  );
  const progresoPeloEH = useMemo(() => progresoPelo(estado, datosGlobales), [estado, datosGlobales]);
  const resumenPeloEH = useMemo(() => resumenPelo(estado), [estado]);
  const subPelo = resumenPeloEH.rutinas > 0
    ? `${resumenPeloEH.rutinas} ${resumenPeloEH.rutinas === 1 ? 'rutina' : 'rutinas'}`
      + (resumenPeloEH.hoy > 0 ? ` · ${resumenPeloEH.hechasHoy}/${resumenPeloEH.hoy} hoy` : '')
    : (progresoPeloEH.sinEmpezar ? 'Configura tu perfil'
      : `${progresoPeloEH.contestadas} de ${progresoPeloEH.total} contestadas`);
  const perfilEstilo = useMemo(
    () => estadoDelPerfil(estado, armario, datosGlobales), [estado, armario, datosGlobales],
  );
  const resumenPlaquitaArmario = estiloArmario && !estiloArmario.vacio
    ? `${estiloArmario.total} ${estiloArmario.total === 1 ? 'prenda' : 'prendas'}`
      + (estiloArmario.outfits > 0 ? ` · ${estiloArmario.outfits} ${estiloArmario.outfits === 1 ? 'outfit' : 'outfits'}` : '')
    : null;

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

  /* F8 — la plaquita de Pelo abre su PANEL, y el perfil capilar de F7 es una de
     sus cinco plaquitas (apartado 1). */
  if (perfilPelo === 'perfil') {
    return (
      <PerfilCapilarEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setPerfilPelo('panel')}
      />
    );
  }
  if (perfilPelo) {
    return (
      <PanelPelo
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setPerfilPelo(false)}
        onPerfil={() => setPerfilPelo('perfil')}
      />
    );
  }

  if (miEstilo) {
    return (
      <MiEstiloEH
        estado={estado} accent={accent} armario={armario} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setMiEstilo(false)}
      />
    );
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
            {activos.map((m) => {
              /* F5 — la única plaquita que hoy lleva a algún sitio es la del
                 armario, porque su módulo YA EXISTE. Y lleva al de siempre, no a
                 una copia (apartado 1). */
              const esArmario = m.id === MODULO_EH_ESTILO && !ordenando && onIr;
              /* F7 — Pelo ya tiene contenido propio: su perfil capilar. Sigue
                 siendo la excepción, no la regla: los otros once apartados no
                 llevan a ninguna parte todavía y la pantalla lo dice. */
              const esPelo = m.id === MODULO_PELO && !ordenando;
              return (
                <Plaquita
                  key={m.id} modulo={m} accent={accent}
                  sub={esArmario && estiloArmario ? resumenPlaquitaArmario : (esPelo ? subPelo : null)}
                  onAbrir={esArmario ? () => onIr(DESTINO_ARMARIO) : (esPelo ? () => setPerfilPelo('panel') : null)}
                  orden={ordenando ? puedeMover(estado, m.id) : null}
                  onSubir={() => onCambiar(subirModulo(estado, m.id))}
                  onBajar={() => onCambiar(bajarModulo(estado, m.id))}
                />
              );
            })}
          </div>

          {/* ⚠️ Regla 8 y apartado 14 de F1. Ninguno de estos apartados tiene
              contenido todavía, y el enunciado prohíbe construirlo. Así que la
              pantalla LO DICE, en vez de que Josué toque una plaquita y no pase
              nada. */}
          {/* ⚠️ F5 — el armario YA tiene contenido, así que el aviso ya no puede
              decir "ninguno": dice cuántos faltan y no miente sobre el que hay. */}
          {!ordenando && (() => {
            const conArmario = activos.some((m) => m.id === MODULO_EH_ESTILO) && !!onIr;
            const conPelo = activos.some((m) => m.id === MODULO_PELO);
            const pendientes = activos.length - (conArmario ? 1 : 0) - (conPelo ? 1 : 0);
            if (pendientes === 0) return null;
            return (
              <p className="text-[11px] text-center" style={{ color: COLORS.textMuted }}>
                {conArmario || conPelo
                  ? 'El resto de apartados que has elegido llegan en las siguientes fases.'
                  : 'De momento esto es solo tu espacio elegido: el contenido de cada apartado llega en las siguientes fases.'}
              </p>
            );
          })()}

          {/* F6, apartado 1 — *"dentro de 👕 Estilo y Armario añadir una zona 👤 Mi
              estilo. No crear otro apartado principal."* Por eso el acceso está
              debajo de las plaquitas y solo si ese apartado está encendido, no
              como una plaquita más. */}
          {!ordenando && activos.some((m) => m.id === MODULO_EH_ESTILO) && (
            <button
              onClick={() => setMiEstilo(true)}
              className="flex items-center gap-1.5 text-[11px] font-semibold mx-auto"
              style={{ color: accent }}
            >
              {ZONA_MI_ESTILO.icono} {ZONA_MI_ESTILO.nombre}
              {perfilEstilo && !perfilEstilo.vacio && (
                <span style={{ color: COLORS.textMuted }}>· {perfilEstilo.rellenos} de {perfilEstilo.total}</span>
              )}
            </button>
          )}

          {/* Apartado 9 de F2 — reordenar es un modo. Con un solo módulo activo
              no se ofrece: dos flechas que no hacen nada. */}
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
