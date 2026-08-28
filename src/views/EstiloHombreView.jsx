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
import {
  CATEGORIAS_PRODUCTO_PELO, categoriaProducto, CATALOGO_VACIO_PORQUE,
  productosPelo, crearProductoPelo, alternarFavorito, alternarMio, marcarNoDisponible,
  alternativasDe, enlacesDe, recomendarProductos, packsPelo, crearPack, verPack,
  packSugerido, resumenProductosPelo, estadoProducto,
} from '../lib/productosPelo';
import {
  PREFERENCIAS_CORTE, ANTELACIONES_AVISO, MODOS_PROXIMO, panelPeluqueria,
  historialDeCortes, registrarCorte, borrarCorte, planificarCorte, editarCita,
  avisoEliminarCita, eliminarCita, marcarCorteRealizado, alternarRecordatorio,
  anadirSitio, borrarSitio, guardarFrecuencia, datosPeluqueria, resumenPeluqueria,
  PARTE_PELUQUERIA,
} from '../lib/peluqueria';
import {
  PARTES_LONGITUD, NIVELES_MANTENIMIENTO, nivelMantenimiento, preguntasDeCorte,
  perfilDeCorte, progresoCorte, contestarCorte, guardarReferencia, referenciaDe,
  cortesDisponibles, corteDe, anadirCorte, alternarFavoritoCorte, fijarCorteActual,
  corteActual, marcarQuieroProbar, quitarObjetivoDeCorte, objetivoDeCorte,
  VALORACIONES_CORTE, decirQueCorteFue, valorarCorte, historialConCortes,
  recomendarCortes, loQueFaltaParaCortes, compararCortes, patronesDeCorte,
  tiempoParaPeinarse, resumenCortes,
} from '../lib/cortesPelo';
import {
  MODULO_PIEL, TEXTOS_PIEL, panelPiel, contestarPiel, seccionesDePiel,
  progresoPiel, estadoDeEntrada, decirAhoraNo, volverAConfigurar,
  anadirProductoPiel, quitarProductoPiel, datosPiel, resumenPiel, respuestaPiel,
  TIPOS_PIEL, NECESIDADES_PIEL,
} from '../lib/perfilPiel';
import {
  PLAQUITAS_PIEL, PARTES_PIEL, parteActivaPiel, alternarPartePiel, PASOS_PIEL,
  pasosParaNivel, MOMENTOS_PIEL, FRECUENCIAS_PIEL, datosRutinasPiel,
  crearRutinaPiel, editarRutinaPiel, impactoEliminarRutinaPiel, eliminarRutinaPiel,
  rutinasDeHoyPiel, checklistPiel, marcarPasoPiel, omitirPasoPiel,
  marcarRutinaPielEntera, plantillaSugerida, usarPlantilla, estaSemanaPiel,
  historialPiel, resumenRutinasPiel, TEXTOS_ESTADO_DIA as TEXTOS_DIA_PIEL,
} from '../lib/rutinasPiel';
import {
  PARTE_SEGUIMIENTO, ESCALA_PIEL, TEXTO_NO_REGISTRAR, ASPECTOS_PIEL,
  NIVELES_ASPECTO, registrarPiel, eliminarRegistroPiel, PERIODOS_PIEL,
  panelSeguimientoPiel, resumenSeguimientoPiel, desdeQueUsas,
} from '../lib/seguimientoPiel';
import {
  PARTE_RECOMENDACIONES, MOTIVOS_DESCARTE_PIEL, recomendarPiel, loQueFaltaPiel,
  marcarVistasPiel, descartarPiel, guardarRecomendacionPiel, quitarGuardadaPiel,
  anadirARutina, resumenRecsPiel,
} from '../lib/recomendacionesPiel';
import {
  /* ⚠️ `CATALOGO_VACIO_PORQUE` no se importa aquí: es LA MISMA constante que
     ya viene de `productosPelo`, porque vive en `motorProductos`. */
  PARTE_PRODUCTOS, CATEGORIAS_PRODUCTO_PIEL, categoriaPiel,
  productosPiel, crearProductoPiel, eliminarProductoPiel, alternarFavoritoPiel,
  alternarMioPiel, valorarProductoPiel, enlacesDePiel, marcarNoDisponiblePiel,
  alternativasDePiel, FILTROS_PIEL, buscarEnPiel, marcasDePiel,
  FILAS_COMPARACION_PIEL, compararProductosPiel, recomendarProductosPiel,
  packsPiel, crearPackPiel, eliminarPackPiel, verPackPiel, packSugeridoPiel,
  resumenProductosPiel, MAX_COMPARAR, TIPOS_TIENDA,
} from '../lib/productosPiel';
import {
  TEXTOS_BARBA, PARTES_BARBA, PLAQUITAS_BARBA, NIVELES_BARBA, FRECUENCIAS_AFEITADO,
  datosBarba, decirAhoraNoBarba, configurarBarba, elegirPartesBarba,
  parteActivaBarba, alternarParteBarba, estadoDeEntradaBarba, seccionesDeBarba,
  progresoBarba, contestarBarba, borrarBarba, respuestaBarba, panelBarba,
  loQueYaSabemosDeTuBarba, frecuenciaDeAfeitado, ponerDiasAfeitado,
  catalogoParaBarba, productosDeBarba, marcarProductoBarba, quitarProductoBarba,
  resumenBarba, MODULO_BARBA,
} from '../lib/perfilBarba';
import {
  PASOS_BARBA, FRECUENCIAS_BARBA, frecuenciaBarba, ESCALA_BARBA, ASPECTOS_BARBA,
  plantillasSugeridasBarba, usarPlantillaBarba, crearRutinaBarba,
  alternarFavoritaBarba, alternarRecordatorioBarba, impactoEliminarRutinaBarba,
  eliminarRutinaBarba, checklistBarba, marcarPasoBarba, omitirPasoBarba,
  marcarRutinaBarbaEntera, registrarBarba, historialBarba, sugerenciasBarba,
  resumenRutinasBarba, panelRutinasBarba, TEXTOS_ESTADO_DIA as TEXTOS_DIA_BARBA,
} from '../lib/rutinasBarba';
import {
  MODULO_SONRISA, TEXTOS_SONRISA, PASOS_SONRISA, MOMENTOS_SONRISA, momentoSonrisa,
  TIPOS_PRODUCTO_SONRISA, FRECUENCIAS_CEPILLO, avisoRevision, configurarSonrisa,
  decirAhoraNoSonrisa, alternarParteSonrisa, crearRutinaSonrisa,
  usarPlantillaSonrisa, marcarPasoSonrisa, omitirPasoSonrisa,
  alternarRecordatorioSonrisa, impactoEliminarRutinaSonrisa,
  anadirProductoSonrisa, quitarProductoSonrisa, registrarCambioCepillo,
  ponerFrecuenciaCepillo, planificarCambioCepillo, quitarPlanCepillo,
  crearRevision, editarRevision, registrarSonrisa, resumenSonrisa, panelSonrisa,
  TEXTOS_ESTADO_DIA as TEXTOS_DIA_SONRISA,
} from '../lib/sonrisa';
import {
  MODULO_PERFUMES, TEXTOS_PERFUMES, aroma, ocasion, configurarPerfumes,
  decirAhoraNoPerfumes, alternarPartePerfumes, contestarPerfume, anadirPerfume,
  alternarFavoritoPerfume, valorarPerfume, ponerPerfumeActual,
  asignarPerfumeAOcasion, anadirPorProbar, quitarPorProbar, moverAColeccion,
  registrarUso, resumenPerfumes, panelPerfumes,
} from '../lib/perfumes';
import {
  panelRecsPerfume, compararPerfumes, descartarPerfume, ponerEnRotacion,
  ponerEspera, ponerDisponibilidad, MAX_COMPARAR as MAX_COMPARAR_PERFUME,
} from '../lib/recomendacionesPerfumes';
import {
  MODULO_ACCESORIOS, TEXTOS_ACCESORIOS, CATEGORIAS_ACCESORIO, CASILLAS_ACCESORIOS,
  configurarAccesorios, decirAhoraNoAccesorios, elegirCategoriasAccesorios,
  alternarParteAccesorios, prepararAltaAccesorio, aplicarAltaAccesorio,
  usarPrendaComoAccesorio, editarAccesorio, alternarFavoritoAccesorio,
  alternarEnUsoAccesorio, combinacionesDeAccesorio, anadirDeseoAccesorio,
  dondeComprarAccesorio, TEXTO_AL_BORRAR, resumenAccesorios, panelAccesorios,
  categoriasActivasAccesorios,
} from '../lib/accesorios';
import {
  MODULO_GUSTOS, TEXTOS_GUSTOS, DESTINO_DIARIO, configurarGustos, decirAhoraNoGustos,
  alternarParteGustos, anadirGusto, editarGusto, alternarFavoritoGusto, cambiarEstadoGusto,
  ponerFechaGusto, completarSuelto, resumenGustos, panelGustos, estadoHacer,
} from '../lib/gustos';
import {
  TEXTOS_PUENTE, DESTINO_OBJETIVOS, PARTE_EXPERIENCIAS, estadoDelObjetivo,
  prepararObjetivo, aplicarObjetivo, marcarYaLoHice, panelPuente,
} from '../lib/objetivosEnEstiloHombre';

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
  const prods = useMemo(() => resumenProductosPelo(estado, datosGlobales), [estado, datosGlobales]);
  const pelu = useMemo(() => resumenPeluqueria(estado, datosGlobales), [estado, datosGlobales]);

  if (zona === 'rutina') return <RutinasPeloEH estado={estado} accent={accent} onCambiar={onCambiar} onCerrar={() => setZona(null)} />;
  if (zona === 'seguimiento') return <SeguimientoPeloEH estado={estado} accent={accent} onCambiar={onCambiar} onCerrar={() => setZona(null)} />;
  if (zona === 'ajustes') return <AjustesPeloEH estado={estado} accent={accent} onCambiar={onCambiar} onCerrar={() => setZona(null)} />;
  if (zona === 'productos') {
    return (
      <ProductosPeloEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setZona(null)}
      />
    );
  }
  if (zona === 'recomendaciones') {
    return (
      <RecomendacionesPeloEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setZona(null)}
      />
    );
  }
  if (zona === 'peluqueria') {
    return (
      <PeluqueriaEH
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
    productos: prods.total === 0 ? 'Añade los tuyos' : `${prods.total} ${prods.total === 1 ? 'producto' : 'productos'}`,
    // ⚠️ Nunca una fecha inventada: si no hay cita, se dice que no la hay.
    peluqueria: pelu.proximo
      ? `Corte el ${pelu.proximo}`
      : (pelu.ultimo ? `Último: ${pelu.ultimo}` : 'Registra tu último corte'),
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
            /* ⚠️ F11, apartado 14 — apagar Peluquería **oculta la plaquita** y
               conserva historial, preferencias y sitios. No borra nada. */
            .filter((p) => p.id !== 'peluqueria' || parteActiva(estado, PARTE_PELUQUERIA))
            .map((p) => {
              const abre = p.id === 'perfil' ? onPerfil
                : (p.id === 'rutina' ? () => setZona('rutina')
                  : (p.id === 'seguimiento' ? () => setZona('seguimiento')
                    : (p.id === 'recomendaciones' ? () => setZona('recomendaciones')
                      : (p.id === 'productos' ? () => setZona('productos')
                        : (p.id === 'peluqueria' ? () => setZona('peluqueria') : null)))));
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
   PRODUCTOS CAPILARES (F10)
   ===========================================================================
   *"La aplicación recomienda. El usuario elige."*

   ⚠️ **Aquí no hay catálogo, y se dice.** D2-03 de Josué y el apartado 3 del
   enunciado coinciden: nada de llenar la aplicación con productos inventados.
   Todo lo que sale aquí lo ha metido él.

   ⚠️ **Y nunca un botón de comprar** (apartado 19). Como mucho, *"Ver
   producto"* — y solo si él guardó un enlace. */
export function ProductosPeloEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar }) {
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [cat, setCat] = useState(null);
  const productos = useMemo(() => productosPelo(estado), [estado]);
  const rec = useMemo(() => recomendarProductos(estado, datosGlobales, { limite: 3 }), [estado, datosGlobales]);
  const sug = useMemo(() => packSugerido(estado, datosGlobales), [estado, datosGlobales]);
  const packs = useMemo(() => packsPelo(estado).map((p) => verPack(estado, p.id)).filter(Boolean), [estado]);

  const crear = () => {
    const { estado: nuevo, error } = crearProductoPelo(estado, { nombre, marca, categoria: cat });
    if (!error) onCambiar?.(nuevo);
    setCreando(false); setNombre(''); setMarca(''); setCat(null);
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>🛒 Productos para ti</p>
      </div>
      {/* ⚠️ Regla 8 + D2-03: se dice que no hay catálogo, en vez de fingir uno. */}
      <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>{CATALOGO_VACIO_PORQUE}</p>

      {/* Apartado 4 — ⭐ Para ti, solo si están activas (apartado 18). */}
      {rec.activas && rec.recomendaciones.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: COLORS.textMuted }}>
            ⭐ Para ti
          </p>
          <div className="space-y-1">
            {rec.recomendaciones.map((x) => (
              <div key={x.id} className="rounded-2xl p-2.5"
                style={{ background: hexToRgba(accent, 0.08), border: `1px solid ${hexToRgba(accent, 0.25)}` }}>
                <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>
                  {x.icono} {x.nombre}{x.marca ? ` · ${x.marca}` : ''}
                </p>
                <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{x.encaje}</p>
                {/* Apartado 5 — siempre el motivo. */}
                <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>{x.porque}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apartado 15 — el pack sugerido: se propone, se elige. Nunca se compra. */}
      {sug.hayPack && (
        <div className="rounded-2xl p-3 mb-3"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
          <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>📦 {sug.nombre}</p>
          {sug.productos.map((x) => (
            <p key={x.id} className="text-[10px]" style={{ color: COLORS.textMuted }}>{x.icono} {x.nombre}</p>
          ))}
          <button
            onClick={() => onCambiar?.(crearPack(estado, sug.nombre, sug.productos.map((x) => x.id)).estado)}
            className="text-[10px] font-semibold mt-1.5" style={{ color: accent }}
          >
            Guardar este pack
          </button>
        </div>
      )}

      {packs.length > 0 && (
        <div className="mb-3">
          {packs.map((p) => (
            <p key={p.id} className="text-[10px]" style={{ color: COLORS.textMuted }}>
              📦 {p.nombre} · {p.productos.length} {p.productos.length === 1 ? 'producto' : 'productos'}
              {p.precio !== null ? ` · ${p.precio} €` : ''}
            </p>
          ))}
        </div>
      )}

      {/* La lista de los suyos. */}
      <div className="space-y-1 mb-3">
        {productos.map((p) => {
          const en = enlacesDe(estado, p.id);
          const est = estadoProducto(p.estado);
          const alts = p.estado !== 'disponible' ? alternativasDe(estado, p.id) : [];
          return (
            <div key={p.id} className="rounded-2xl p-2.5"
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none flex-shrink-0" aria-hidden="true">
                  {categoriaProducto(p.categoria)?.icono || '🧴'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold truncate" style={{ color: COLORS.text }}>{p.nombre}</p>
                  <p className="text-[10px] truncate" style={{ color: COLORS.textMuted }}>
                    {[p.marca, categoriaProducto(p.categoria)?.nombre, p.precio !== null ? `${p.precio} €` : null]
                      .filter(Boolean).join(' · ') || 'Sin más datos'}
                  </p>
                </div>
                <button onClick={() => onCambiar?.(alternarFavorito(estado, p.id).estado)}
                  className="flex-shrink-0 text-[11px]" aria-label={`Favorito ${p.nombre}`}>
                  {p.favorito ? '❤️' : '🤍'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <button onClick={() => onCambiar?.(alternarMio(estado, p.id).estado)}
                  className="text-[10px] font-semibold" style={{ color: p.mio ? accent : COLORS.textMuted }}>
                  {p.mio ? '✓ Ya lo tengo' : 'Ya lo tengo'}
                </button>
                {/* ⚠️ Apartado 12: siempre "Ver producto", nunca "Comprar". */}
                {en.enlaces.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-semibold" style={{ color: accent }}>
                    {l.etiqueta} · {l.tienda}
                  </a>
                ))}
                {en.sinEnlaces && (
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{en.sinEnlacesTexto}</span>
                )}
                <button onClick={() => onCambiar?.(marcarNoDisponible(estado, p.id, p.estado !== 'disponible').estado)}
                  className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>
                  {p.estado === 'disponible' ? 'Marcar no disponible' : 'Vuelve a estar'}
                </button>
              </div>

              {/* ⚠️ Apartado 12 — el aviso SOLO si hay algún enlace de afiliado. */}
              {en.aviso && <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>{en.aviso}</p>}

              {/* Apartado 10 — no disponible NO es borrado. */}
              {est?.aviso && (
                <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
                  ⚠️ {est.nombre}
                  {alts.length > 0 && ` · También tienes: ${alts.map((a) => a.nombre).join(', ')}`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {creando ? (
        <div className="space-y-2">
          <TextInput value={nombre} onChange={(ev) => setNombre(ev.target.value)}
            placeholder="Nombre del producto" aria-label="Nombre del producto" />
          <TextInput value={marca} onChange={(ev) => setMarca(ev.target.value)}
            placeholder="Marca (opcional)" aria-label="Marca" />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIAS_PRODUCTO_PELO.map((c) => (
              <button key={c.id} onClick={() => setCat(cat === c.id ? null : c.id)}
                className="rounded-full px-2.5 py-1"
                style={{
                  background: cat === c.id ? hexToRgba(accent, 0.12) : COLORS.surface2,
                  border: `1px solid ${cat === c.id ? accent : COLORS.border}`,
                }}
                aria-pressed={cat === c.id}
              >
                <span className="text-[11px] font-semibold" style={{ color: cat === c.id ? COLORS.text : COLORS.textMuted }}>
                  {c.icono} {c.nombre}
                </span>
              </button>
            ))}
          </div>
          <PrimaryButton accent={accent} onClick={crear}>Guardar producto</PrimaryButton>
          <button onClick={() => setCreando(false)} className="text-[11px] font-semibold mx-auto block"
            style={{ color: COLORS.textMuted }}>Cancelar</button>
        </div>
      ) : (
        <PrimaryButton accent={accent} icon={Plus} onClick={() => setCreando(true)}>Añadir producto</PrimaryButton>
      )}
    </Card>
  );
}

/* ===========================================================================
   PELUQUERÍA (F11)
   ===========================================================================
   *"Última vez que te cortaste el pelo… Próximo corte planificado."*

   ⚠️ **Las dos listas nunca se mezclan** (apartado 15). Arriba, el plan: una
   cita, que se puede mover, marcar como hecha o quitar del calendario. Abajo,
   la historia: los cortes que de verdad ocurrieron. Quitar la cita **no toca**
   el historial, y la pantalla lo dice con esas palabras antes de hacerlo.

   ⚠️ Y **nada se calcula aquí**: el próximo corte lo sugiere
   `sugerirProximoCorte`, la frecuencia real la deriva `frecuenciaReal`, y el
   choque entre lo que dijo en el perfil y lo que puso a mano lo enseña
   `frecuenciaDeCorte`. La vista pinta lo que le dan. */
export function PeluqueriaEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar }) {
  /* ⚠️ Regla 4 — todos los hooks antes de cualquier `return`. */
  const [fecha, setFecha] = useState('');
  const [nota, setNota] = useState('');
  const [preferencia, setPreferencia] = useState(null);
  const [modo, setModo] = useState('fecha');
  const [cuando, setCuando] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [sitio, setSitio] = useState('');
  const [lugar, setLugar] = useState('');
  const [error, setError] = useState(null);
  const [confirmar, setConfirmar] = useState(null);
  const [verSitios, setVerSitios] = useState(false);
  const [verCorte, setVerCorte] = useState(false);

  const panel = useMemo(() => panelPeluqueria(estado, datosGlobales), [estado, datosGlobales]);
  const historial = useMemo(() => historialDeCortes(estado), [estado]);
  const cita = useMemo(() => datosPeluqueria(estado).cita, [estado]);
  const corte = useMemo(() => resumenCortes(estado, datosGlobales), [estado, datosGlobales]);

  const aplicar = (r) => {
    if (r.error) { setError(r.error); return; }
    setError(null);
    onCambiar?.(r.estado);
  };

  /* ⚠️ Regla 4 — el `return` condicional va DESPUÉS de todos los hooks. */
  if (verCorte) {
    return (
      <MiEstiloDeCorteEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setVerCorte(false)}
      />
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>✂️ Peluquería</p>
      </div>

      {/* F12, apartado 1 — *"dentro de ✂️ Peluquería añadir: Mi estilo de corte"*. */}
      <button
        onClick={() => setVerCorte(true)}
        className="w-full rounded-2xl p-2.5 flex items-center gap-2 text-left mb-3"
        style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
      >
        <span className="text-base leading-none" aria-hidden="true">💇‍♂️</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>Mi estilo de corte</p>
          <p className="text-[10px] truncate" style={{ color: COLORS.textMuted }}>
            {corte.objetivo
              ? `🎯 Quieres probar: ${corte.objetivo}`
              : (corte.actual
                ? `Ahora llevas: ${corte.actual}`
                : (corte.contestadas === 0 ? 'Cuéntanos qué corte te gusta' : `${corte.contestadas} de ${corte.total} contestadas`))}
          </p>
        </div>
      </button>

      {/* Apartado 1 — lo primero es lo último que pasó y lo siguiente que toca. */}
      {panel.sinNada ? (
        <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>{panel.textoVacio}</p>
      ) : (
        <div className="rounded-2xl p-2.5 mb-3"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
          <p className="text-[11px]" style={{ color: COLORS.text }}>
            {panel.ultimo ? `Último corte: ${panel.ultimo.fecha}` : 'Todavía no has registrado ningún corte'}
          </p>
          {/* ⚠️ Regla 8 — o hay una fecha de verdad, o se dice que no la hay.
              Nunca una fecha inventada para llenar el hueco. */}
          {panel.proximo ? (
            <p className="text-[10px] mt-0.5" style={{ color: accent }}>
              Próximo corte planificado: {panel.proximo.fecha}
              {cita?.hora ? ` a las ${cita.hora}` : ''}
            </p>
          ) : panel.sugerido ? (
            <div className="mt-1">
              <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{panel.sugerido.texto}</p>
              <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{panel.sugerido.de}</p>
              {/* ⚠️ Sugerir no es reservar (apartado 16): esto lo guarda él. */}
              <button
                onClick={() => aplicar(planificarCorte(estado, { modo: 'fecha', fecha: panel.sugerido.fecha }))}
                className="text-[10px] font-semibold mt-1"
                style={{ color: accent }}
              >
                {panel.sugerido.accion}
              </button>
            </div>
          ) : (
            <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>Sin corte planificado</p>
          )}
        </div>
      )}

      {/* Apartado 4 — la frecuencia, y el choque si lo hay. */}
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: COLORS.textMuted }}>
        Cada cuánto
      </p>
      <p className="text-[11px]" style={{ color: COLORS.text }}>{panel.frecuencia.texto}</p>
      {panel.frecuencia.de && (
        <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{panel.frecuencia.de}</p>
      )}
      {/* ⚠️ El choque se ENSEÑA, no se resuelve en silencio (como `tallaDe`). */}
      {panel.frecuencia.conflicto && (
        <p className="text-[10px] mt-0.5" style={{ color: COLORS.warning || COLORS.textMuted }}>
          Aquí pusiste cada {panel.frecuencia.conflicto.guardada} y en tu perfil cada {panel.frecuencia.conflicto.perfil}.
          Manda la del perfil.
        </p>
      )}
      <div className="flex flex-wrap gap-1 mt-1.5 mb-3">
        {[2, 3, 4, 6, 8].map((s) => (
          <button
            key={s}
            onClick={() => aplicar(guardarFrecuencia(estado, s))}
            className="rounded-full px-2.5 py-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
          >
            <span className="text-[10px] font-semibold" style={{ color: COLORS.text }}>{s} sem.</span>
          </button>
        ))}
      </div>

      {/* Apartado 2 — registrar un corte, con el atajo de "Hoy". */}
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: COLORS.textMuted }}>
        Registrar corte
      </p>
      <div className="flex gap-1.5 mb-1.5">
        <button
          onClick={() => aplicar(registrarCorte(estado, { nota, preferencia }))}
          className="rounded-2xl px-3 py-1.5"
          style={{ background: accent }}
        >
          <span className="text-[11px] font-semibold" style={{ color: COLORS.textOnAccent }}>Hoy</span>
        </button>
        <input
          type="date" value={fecha} onChange={(ev) => setFecha(ev.target.value)}
          aria-label="Fecha del corte"
          className="flex-1 rounded-2xl px-2.5 py-1.5 text-[11px]"
          style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
        />
        <button
          onClick={() => { aplicar(registrarCorte(estado, { fecha, nota, preferencia })); setFecha(''); setNota(''); }}
          disabled={!fecha}
          className="rounded-2xl px-3 py-1.5 disabled:opacity-40"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
        >
          <span className="text-[11px] font-semibold" style={{ color: COLORS.text }}>Añadir</span>
        </button>
      </div>
      {/* Apartado 10 — qué quiere la próxima vez. Opcional. */}
      <div className="flex flex-wrap gap-1 mb-1.5">
        {PREFERENCIAS_CORTE.map((p) => (
          <button
            key={p.id}
            onClick={() => setPreferencia(preferencia === p.id ? null : p.id)}
            className="rounded-full px-2.5 py-1"
            style={{
              background: preferencia === p.id ? hexToRgba(accent, 0.14) : COLORS.surface2,
              border: `1px solid ${preferencia === p.id ? accent : COLORS.border}`,
            }}
          >
            <span className="text-[10px] font-semibold" style={{ color: preferencia === p.id ? accent : COLORS.text }}>
              {p.nombre}
            </span>
          </button>
        ))}
      </div>
      <TextInput value={nota} onChange={(ev) => setNota(ev.target.value)}
        placeholder="Una nota, si quieres" aria-label="Nota del corte" />

      {/* Apartados 3, 7 y 8 — el plan. */}
      <p className="text-[10px] font-semibold uppercase tracking-wide mt-3 mb-1.5" style={{ color: COLORS.textMuted }}>
        Próximo corte
      </p>
      {cita ? (
        <div className="rounded-2xl p-2.5 space-y-1.5"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2">
            <input
              type="date" value={cita.fecha} onChange={(ev) => aplicar(editarCita(estado, { fecha: ev.target.value }))}
              aria-label="Fecha de la cita"
              className="flex-1 rounded-xl px-2 py-1 text-[11px]"
              style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            />
            <input
              type="time" value={cita.hora || ''} onChange={(ev) => aplicar(editarCita(estado, { hora: ev.target.value }))}
              aria-label="Hora de la cita"
              className="rounded-xl px-2 py-1 text-[11px]"
              style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            />
          </div>

          {/* Apartado 5 — el recordatorio nace apagado y se pide. */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] flex-1" style={{ color: COLORS.text }}>Avisarme</span>
            <Switch checked={cita.recordatorio} onChange={() => aplicar(alternarRecordatorio(estado))}
              accent={accent} label="Avisarme del corte" />
          </div>
          {cita.recordatorio && (
            <div className="flex flex-wrap gap-1">
              {ANTELACIONES_AVISO.map((a) => (
                <button
                  key={a.id}
                  onClick={() => aplicar(editarCita(estado, { antelacion: a.id }))}
                  className="rounded-full px-2 py-0.5"
                  style={{
                    background: cita.antelacion === a.id ? hexToRgba(accent, 0.14) : COLORS.surface,
                    border: `1px solid ${cita.antelacion === a.id ? accent : COLORS.border}`,
                  }}
                >
                  <span className="text-[10px] font-semibold" style={{ color: cita.antelacion === a.id ? accent : COLORS.textMuted }}>
                    {a.nombre}
                  </span>
                </button>
              ))}
            </div>
          )}
          {/* Apartado 13 — el calendario sigue funcionando sin recordatorios. */}
          <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
            Salga o no el aviso, el corte sigue en tu calendario.
          </p>

          <div className="flex gap-1.5">
            {/* Apartado 8 — el plan se vuelve historia. */}
            <button
              onClick={() => aplicar(marcarCorteRealizado(estado))}
              className="flex-1 rounded-2xl py-1.5"
              style={{ background: accent }}
            >
              <span className="text-[11px] font-semibold" style={{ color: COLORS.textOnAccent }}>✅ Corte realizado</span>
            </button>
            {/* ⚠️ Apartado 15 — con su aviso, y sin tocar el historial. */}
            <button
              onClick={() => setConfirmar(avisoEliminarCita(estado))}
              className="rounded-2xl px-3 py-1.5"
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              <span className="text-[11px] font-semibold" style={{ color: COLORS.textMuted }}>Eliminar</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1">
            {MODOS_PROXIMO.map((m) => (
              <button
                key={m.id}
                onClick={() => setModo(m.id)}
                className="rounded-full px-2.5 py-1"
                style={{
                  background: modo === m.id ? hexToRgba(accent, 0.14) : COLORS.surface2,
                  border: `1px solid ${modo === m.id ? accent : COLORS.border}`,
                }}
              >
                <span className="text-[10px] font-semibold" style={{ color: modo === m.id ? accent : COLORS.text }}>
                  {m.nombre}
                </span>
              </button>
            ))}
          </div>
          {/* ⚠️ "Todavía no lo sé" no pide nada más: es una respuesta, no un
              hueco que rellenar (apartado 3). */}
          {modo === 'fecha' && (
            <input
              type="date" value={cuando} onChange={(ev) => setCuando(ev.target.value)}
              aria-label="Fecha del próximo corte"
              className="w-full rounded-2xl px-2.5 py-1.5 text-[11px]"
              style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            />
          )}
          {(modo === 'semanas' || modo === 'dias') && (
            <TextInput value={cantidad} onChange={(ev) => setCantidad(ev.target.value)}
              placeholder={modo === 'semanas' ? 'Cuántas semanas' : 'Cuántos días'}
              aria-label={modo === 'semanas' ? 'Cuántas semanas' : 'Cuántos días'} />
          )}
          {modo !== 'no_se' && (
            <PrimaryButton
              accent={accent}
              onClick={() => { aplicar(planificarCorte(estado, { modo, fecha: cuando, cantidad })); setCuando(''); setCantidad(''); }}
            >
              Planificar
            </PrimaryButton>
          )}
        </div>
      )}

      {/* Apartado 9 — el historial, y lo que se deriva de él. */}
      {historial.length > 0 && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-wide mt-3 mb-1.5" style={{ color: COLORS.textMuted }}>
            Historial
          </p>
          {panel.real.suficiente && (
            <p className="text-[10px] mb-1.5" style={{ color: COLORS.textMuted }}>{panel.real.texto}</p>
          )}
          <div className="space-y-1">
            {historial.slice(0, 12).map((c) => (
              <div key={c.id} className="rounded-2xl p-2 flex items-center gap-2"
                style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>{c.fecha}</p>
                  <p className="text-[10px] truncate" style={{ color: COLORS.textMuted }}>
                    {[
                      // `null` en el más antiguo: no hay con qué compararlo.
                      c.diasDesdeElAnterior === null ? '' : `${c.diasDesdeElAnterior} días después del anterior`,
                      c.sitio, c.preferenciaNombre, c.nota,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button onClick={() => aplicar(borrarCorte(estado, c.id))} aria-label={`Borrar el corte del ${c.fecha}`}>
                  <X size={13} style={{ color: COLORS.textMuted }} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Apartado 12 — dónde se corta. Un nombre y un sitio, nada más. */}
      <button
        onClick={() => setVerSitios(!verSitios)}
        className="text-[10px] font-semibold mt-3"
        style={{ color: COLORS.textMuted }}
      >
        {verSitios ? 'Ocultar' : 'Dónde te lo cortas'} ({panel.sitios.length})
      </button>
      {verSitios && (
        <div className="mt-1.5 space-y-1">
          {panel.sitios.map((s) => (
            <div key={s.id} className="rounded-2xl p-2 flex items-center gap-2"
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold truncate" style={{ color: COLORS.text }}>{s.nombre}</p>
                {s.lugar && <p className="text-[10px] truncate" style={{ color: COLORS.textMuted }}>{s.lugar}</p>}
              </div>
              <button onClick={() => aplicar(borrarSitio(estado, s.id))} aria-label={`Borrar ${s.nombre}`}>
                <X size={13} style={{ color: COLORS.textMuted }} />
              </button>
            </div>
          ))}
          <TextInput value={sitio} onChange={(ev) => setSitio(ev.target.value)}
            placeholder="Nombre" aria-label="Nombre del sitio" />
          <TextInput value={lugar} onChange={(ev) => setLugar(ev.target.value)}
            placeholder="Dónde está" aria-label="Dónde está" />
          <button
            onClick={() => { aplicar(anadirSitio(estado, { nombre: sitio, lugar })); setSitio(''); setLugar(''); }}
            className="text-[10px] font-semibold"
            style={{ color: accent }}
          >
            Añadir sitio
          </button>
          {/* Regla 8 — se dice lo que NO hace, en vez de dejar un botón muerto. */}
          <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
            Aquí solo se apunta dónde vas. Las reservas se hacen por tu cuenta.
          </p>
        </div>
      )}

      {error && <p className="text-[10px] mt-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}

      <AvisoDesactivar
        aviso={confirmar} accent={accent}
        onCancelar={() => setConfirmar(null)}
        onConfirmar={() => { aplicar(eliminarCita(estado)); setConfirmar(null); }}
      />
    </Card>
  );
}

/* ===========================================================================
   MI ESTILO DE CORTE (F12)
   ===========================================================================
   *"Son recomendaciones, no órdenes."*

   ⚠️ **La pregunta del apartado 5 no está aquí, y se dice por qué.** La Fase 7
   ya preguntó cuánto tiempo quiere dedicarle, con esas mismas cinco opciones.
   Volver a preguntarla dejaría a Josué con dos respuestas y ninguna forma de
   saber cuál manda, así que se enseña la suya y dónde se cambia. */
export function MiEstiloDeCorteEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar }) {
  const [zona, setZona] = useState('perfil');   // 'perfil' | 'ideas' | 'historial'
  const [nuevo, setNuevo] = useState('');
  const [comparar, setComparar] = useState([]);
  const [error, setError] = useState(null);

  const perfil = useMemo(() => perfilDeCorte(estado, datosGlobales), [estado, datosGlobales]);
  const progreso = useMemo(() => progresoCorte(estado, datosGlobales), [estado, datosGlobales]);
  const tiempo = useMemo(() => tiempoParaPeinarse(estado, datosGlobales), [estado, datosGlobales]);
  const recs = useMemo(() => recomendarCortes(estado, datosGlobales), [estado, datosGlobales]);
  const falta = useMemo(() => loQueFaltaParaCortes(estado, datosGlobales), [estado, datosGlobales]);
  const actual = useMemo(() => corteActual(estado), [estado]);
  const objetivo = useMemo(() => objetivoDeCorte(estado), [estado]);
  const patron = useMemo(() => patronesDeCorte(estado), [estado]);
  const historial = useMemo(() => historialConCortes(estado), [estado]);
  const cortes = useMemo(() => cortesDisponibles(estado), [estado]);
  const tabla = useMemo(() => compararCortes(estado, comparar), [estado, comparar]);

  const aplicar = (r) => {
    if (r.error) { setError(r.error); return; }
    setError(null);
    onCambiar?.(r.estado);
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>💇‍♂️ Mi estilo de corte</p>
      </div>

      <div className="flex gap-1 mb-3">
        {[['perfil', 'Preferencias'], ['ideas', 'Ideas'], ['historial', 'Historial']].map(([id, nom]) => (
          <button
            key={id} onClick={() => setZona(id)}
            className="flex-1 rounded-2xl py-1.5"
            style={{
              background: zona === id ? hexToRgba(accent, 0.14) : COLORS.surface2,
              border: `1px solid ${zona === id ? accent : COLORS.border}`,
            }}
          >
            <span className="text-[11px] font-semibold" style={{ color: zona === id ? accent : COLORS.text }}>{nom}</span>
          </button>
        ))}
      </div>

      {zona === 'perfil' && (
        <div className="space-y-3">
          {perfil.map((q) => (
            <div key={q.id}>
              <p className="text-[11px] font-semibold mb-1" style={{ color: COLORS.text }}>{q.titulo}</p>
              <div className="flex flex-wrap gap-1">
                {q.opcionesVisibles.map((o) => {
                  const puesto = q.valores.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => aplicar(contestarCorte(estado, q.id, o.id))}
                      className="rounded-full px-2.5 py-1"
                      style={{
                        background: puesto ? hexToRgba(accent, 0.14) : COLORS.surface2,
                        border: `1px solid ${puesto ? accent : COLORS.border}`,
                      }}
                    >
                      <span className="text-[10px] font-semibold" style={{ color: puesto ? accent : COLORS.text }}>
                        {o.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Apartado 2 — *"no obligar a utilizar medidas exactas"*. */}
              {PARTES_LONGITUD.some((p) => p.id === q.id) && (
                <input
                  value={referenciaDe(estado, q.id)}
                  onChange={(ev) => aplicar(guardarReferencia(estado, q.id, ev.target.value))}
                  placeholder="O una referencia tuya: «número 2»"
                  aria-label={`Referencia para ${q.titulo}`}
                  className="w-full rounded-2xl px-2.5 py-1.5 text-[11px] mt-1"
                  style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
                />
              )}
            </div>
          ))}

          {/* ⚠️ Apartado 5 — la respuesta que YA dio, y dónde se cambia. */}
          <div className="rounded-2xl p-2.5"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>Tiempo para peinarte</p>
            <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
              {tiempo.contestada
                ? `${tiempo.etiqueta} · lo dijiste en ${tiempo.donde}, ahí se cambia.`
                : `Todavía no lo has dicho. Se contesta en ${tiempo.donde}.`}
            </p>
          </div>

          {/* Apartado 3 — *"la lista debe ser ampliable"*. */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: COLORS.textMuted }}>
              ¿Falta alguno?
            </p>
            <div className="flex gap-1.5">
              <TextInput value={nuevo} onChange={(ev) => setNuevo(ev.target.value)}
                placeholder="Nombre del corte" aria-label="Nombre del corte" />
              <button
                onClick={() => { aplicar(anadirCorte(estado, { nombre: nuevo })); setNuevo(''); }}
                disabled={!nuevo.trim()}
                className="rounded-2xl px-3 disabled:opacity-40"
                style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
              >
                <span className="text-[11px] font-semibold" style={{ color: COLORS.text }}>Añadir</span>
              </button>
            </div>
          </div>

          <p className="text-[10px] text-center" style={{ color: COLORS.textMuted }}>
            {progreso.sinEmpezar
              ? 'Todo esto es opcional. Cuanto más nos cuentes, mejor afinamos.'
              : `Has contestado ${progreso.contestadas} de ${progreso.total}.`}
          </p>
        </div>
      )}

      {zona === 'ideas' && (
        <div className="space-y-2">
          {/* Apartado 11 — el corte actual, que pone él. */}
          <div className="rounded-2xl p-2.5"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <p className="text-[11px]" style={{ color: COLORS.text }}>
              {actual ? `Ahora llevas: ${actual.nombre}` : 'No has dicho qué corte llevas ahora'}
            </p>
            {objetivo && (
              <p className="text-[10px] mt-0.5" style={{ color: accent }}>{objetivo.texto}</p>
            )}
            {/* Apartado 15 — *"parece"*, no un diagnóstico. */}
            {patron.hay && (
              <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>
                {patron.texto} ({patron.cortes.map((c) => c.nombre).join(', ')})
              </p>
            )}
          </div>

          {recs.total === 0 ? (
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
              {falta.hayQueAfinar ? falta.texto : 'Aquí saldrán cortes que podrían encajarte.'}
            </p>
          ) : (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
                💡 Cortes que podrían encajarte
              </p>
              {recs.recomendaciones.map((x) => (
                <div key={x.id} className="rounded-2xl p-2.5"
                  style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold flex-1" style={{ color: COLORS.text }}>{x.nombre}</p>
                    <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{x.mantenimiento}</span>
                  </div>
                  {/* ⚠️ Apartado 8 — el "¿por qué?", siempre. */}
                  {x.porque.map((p) => (
                    <p key={p} className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>{p}</p>
                  ))}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {/* Apartado 18 — las tres son decisiones suyas, una a una. */}
                    <button onClick={() => aplicar(alternarFavoritoCorte(estado, x.id))}
                      className="text-[10px] font-semibold" style={{ color: x.favorito ? accent : COLORS.textMuted }}>
                      {x.favorito ? '❤️ Guardado' : '❤️ Guardar corte'}
                    </button>
                    <button
                      onClick={() => aplicar(x.objetivo ? quitarObjetivoDeCorte(estado) : marcarQuieroProbar(estado, x.id))}
                      className="text-[10px] font-semibold" style={{ color: x.objetivo ? accent : COLORS.textMuted }}>
                      {x.objetivo ? '🎯 Es tu objetivo' : '🎯 Quiero probar'}
                    </button>
                    <button
                      onClick={() => setComparar(comparar.includes(x.id) ? comparar.filter((c) => c !== x.id) : [...comparar, x.id])}
                      className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>
                      {comparar.includes(x.id) ? 'Quitar' : 'Comparar'}
                    </button>
                    <button onClick={() => aplicar(fijarCorteActual(estado, x.id))}
                      className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>
                      Es el que llevo
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Apartado 9 — comparar. ⚠️ No elige: enseña y ya. */}
          {tabla.length > 1 && (
            <div className="rounded-2xl p-2.5"
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              {tabla.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold flex-1" style={{ color: COLORS.text }}>{c.nombre}</span>
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>Mantenimiento: {c.mantenimiento}</span>
                </div>
              ))}
              <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>Tú decides cuál te pega más.</p>
            </div>
          )}
        </div>
      )}

      {zona === 'historial' && (
        <div className="space-y-1.5">
          {historial.length === 0 ? (
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
              Cuando registres un corte en Peluquería podrás decir cuál fue y qué te pareció.
            </p>
          ) : historial.map((c) => (
            <div key={c.id} className="rounded-2xl p-2.5"
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>
                {c.fecha}{c.corteNombre ? ` — ${c.corteNombre}` : ''}
              </p>
              {/* Apartado 13 — decir qué corte fue es OPCIONAL, y después. */}
              <div className="flex flex-wrap gap-1 mt-1">
                {cortes.filter((x) => x.id !== 'otro').slice(0, 9).map((x) => (
                  <button
                    key={x.id}
                    onClick={() => aplicar(decirQueCorteFue(estado, c.id, c.corteId === x.id ? null : x.id))}
                    className="rounded-full px-2 py-0.5"
                    style={{
                      background: c.corteId === x.id ? hexToRgba(accent, 0.14) : COLORS.surface,
                      border: `1px solid ${c.corteId === x.id ? accent : COLORS.border}`,
                    }}
                  >
                    <span className="text-[10px]" style={{ color: c.corteId === x.id ? accent : COLORS.textMuted }}>{x.nombre}</span>
                  </button>
                ))}
              </div>
              {/* Apartado 14 — ¿qué te pareció? */}
              <div className="flex gap-1 mt-1">
                {VALORACIONES_CORTE.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => aplicar(valorarCorte(estado, c.id, c.valoracion === v.id ? null : v.id))}
                    className="rounded-full px-2 py-0.5"
                    style={{
                      background: c.valoracion === v.id ? hexToRgba(accent, 0.14) : COLORS.surface,
                      border: `1px solid ${c.valoracion === v.id ? accent : COLORS.border}`,
                    }}
                    aria-label={v.nombre}
                  >
                    <span className="text-[11px]">{v.icono}</span>
                  </button>
                ))}
              </div>
              {c.nota && <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>{c.nota}</p>}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-[10px] mt-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}
    </Card>
  );
}

/* ===========================================================================
   SKINCARE: PERFIL DE PIEL (F13)
   ===========================================================================
   *"Sin IA. Sin diagnósticos médicos. El usuario decide siempre. Todo es
   opcional."*

   ⚠️ **La pantalla no decide qué preguntas se enseñan.** El apartado 14 pide un
   formulario adaptativo, y eso lo calcula `preguntasVisibles()` en el motor: si
   dijo que no usa productos, esas preguntas no llegan hasta aquí. Un `if` en el
   JSX habría sido una regla que nadie puede comprobar.

   ⚠️ Y **el formulario va por secciones** (apartado 2): *"no mostrar un
   formulario gigante de golpe"*. */
export function PerfilPielEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar }) {
  const [seccion, setSeccion] = useState(0);
  const [nuevo, setNuevo] = useState('');
  const [error, setError] = useState(null);

  const panel = useMemo(() => panelPiel(estado, datosGlobales), [estado, datosGlobales]);
  const secciones = panel.secciones;
  const actual = secciones[Math.min(seccion, Math.max(secciones.length - 1, 0))] || null;

  const aplicar = (r) => {
    if (r.error) { setError(r.error); return; }
    setError(null);
    onCambiar?.(r.estado);
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_PIEL.editar}</p>
      </div>

      {/* ⚠️ Apartado 15 — lo que ya sabíamos, y de dónde. Si no se dice, parece
          que la respuesta se ha ido a otro sitio sin avisar. */}
      {panel.yaSabemos.length > 0 && (
        <div className="rounded-2xl p-2.5 mb-3"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
          {panel.yaSabemos.map((x) => (
            <p key={x.id} className="text-[10px]" style={{ color: COLORS.textMuted }}>
              {x.nombre}: {x.etiquetas.join(', ')}
              {x.conQuien.length > 0 ? ` · también lo usa ${x.conQuien.join(' y ')}` : ''}
            </p>
          ))}
        </div>
      )}

      {/* Apartado 2 — las secciones, para no plantarle trece preguntas de golpe. */}
      <div className="flex gap-1 mb-3 overflow-x-auto">
        {secciones.map((s, i) => (
          <button
            key={s.id} onClick={() => setSeccion(i)}
            className="rounded-2xl px-2.5 py-1.5 flex-shrink-0"
            style={{
              background: actual?.id === s.id ? hexToRgba(accent, 0.14) : COLORS.surface2,
              border: `1px solid ${actual?.id === s.id ? accent : COLORS.border}`,
            }}
          >
            <span className="text-[10px] font-semibold" style={{ color: actual?.id === s.id ? accent : COLORS.text }}>
              {s.nombre} {s.contestadas}/{s.total}
            </span>
          </button>
        ))}
      </div>

      {actual && (
        <div className="space-y-3">
          {actual.preguntas.map((q) => (
            <div key={q.id}>
              <p className="text-[11px] font-semibold mb-0.5" style={{ color: COLORS.text }}>{q.titulo}</p>
              {q.ayuda && <p className="text-[10px] mb-1" style={{ color: COLORS.textMuted }}>{q.ayuda}</p>}
              <div className="flex flex-wrap gap-1">
                {q.opcionesVisibles.map((o) => {
                  const puesto = q.valores.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => aplicar(contestarPiel(estado, q.id, o.id))}
                      className="rounded-full px-2.5 py-1"
                      style={{
                        background: puesto ? hexToRgba(accent, 0.14) : COLORS.surface2,
                        border: `1px solid ${puesto ? accent : COLORS.border}`,
                      }}
                    >
                      <span className="text-[10px] font-semibold" style={{ color: puesto ? accent : COLORS.text }}>
                        {o.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Apartado 10 — sus productos de ahora. ⚠️ Solo si usa alguno, y
              *"no obligar a introducirlos todos"*: uno basta. */}
          {actual.id === 'productos' && panel.pideProductos && (
            <div>
              <p className="text-[11px] font-semibold mb-1" style={{ color: COLORS.text }}>
                Los que uses ahora, si quieres
              </p>
              {panel.productos.map((p) => (
                <div key={p.id} className="rounded-2xl p-2 flex items-center gap-2 mb-1"
                  style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
                  <span className="text-[11px] flex-1 truncate" style={{ color: COLORS.text }}>{p.nombre}</span>
                  <button onClick={() => aplicar(quitarProductoPiel(estado, p.id))} aria-label={`Quitar ${p.nombre}`}>
                    <X size={13} style={{ color: COLORS.textMuted }} />
                  </button>
                </div>
              ))}
              <div className="flex gap-1.5">
                <TextInput value={nuevo} onChange={(ev) => setNuevo(ev.target.value)}
                  placeholder="Nombre del producto" aria-label="Nombre del producto" />
                <button
                  onClick={() => { aplicar(anadirProductoPiel(estado, nuevo)); setNuevo(''); }}
                  disabled={!nuevo.trim()}
                  className="rounded-2xl px-3 disabled:opacity-40"
                  style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
                >
                  <span className="text-[11px] font-semibold" style={{ color: COLORS.text }}>Añadir</span>
                </button>
              </div>
              <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
                Con apuntar alguno vale. No hace falta que estén todos.
              </p>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-center mt-3" style={{ color: COLORS.textMuted }}>
        {panel.progreso.sinEmpezar
          ? 'Todo es opcional, y puedes cambiarlo cuando quieras.'
          : `Has contestado ${panel.progreso.contestadas} de ${panel.progreso.total}.`}
      </p>
      {/* Regla 8 — se dice qué llega después, no "próximamente". */}
      <p className="text-[10px] text-center" style={{ color: COLORS.textMuted }}>{panel.nota}</p>

      {error && <p className="text-[10px] mt-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}
    </Card>
  );
}

/* ===========================================================================
   SKINCARE: RUTINAS (F14)
   ===========================================================================
   *"La aplicación propone. El usuario configura."*

   ⚠️ **Omitir no es fallar** (apartado 10). Un paso omitido sale de la cuenta
   del día, así que dos hechos y uno omitido es una rutina HECHA. Lo decide
   `checklistPiel()`, no esta pantalla. */
export function RutinasPielEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar }) {
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [momento, setMomento] = useState('manana');
  const [frecuencia, setFrecuencia] = useState('diario');
  const [pasos, setPasos] = useState([]);
  /* ⚠️ Guardamos el id junto al aviso: buscar la rutina por su nombre al
     confirmar borraría la equivocada en cuanto haya dos que se llamen igual. */
  const [confirmar, setConfirmar] = useState(null);

  const d = useMemo(() => datosRutinasPiel(estado), [estado]);
  const sug = useMemo(() => plantillaSugerida(estado, datosGlobales), [estado, datosGlobales]);
  /* Apartado 14 — el nivel que eligió en la Fase 13. Se LEE, no se guarda otra
     vez aquí: sería el segundo perfil. */
  const nivel = useMemo(
    () => respuestaPiel(estado, 'complejidadPiel', datosGlobales).valores[0] || null,
    [estado, datosGlobales],
  );
  const disponibles = useMemo(() => pasosParaNivel(nivel), [nivel]);

  const aplicar = (r) => onCambiar?.(r.estado ?? r);

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

      {/* Apartados 12 y 13 — la plantilla PROPONE; crearla la confirma él. */}
      {d.rutinas.length === 0 && (
        sug.hay ? (
          <div className="rounded-2xl p-2.5 mb-3"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>{sug.nombre}</p>
            <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
              {sug.pasos.map((p) => `${p.icono} ${p.nombre}`).join(' · ')}
            </p>
            <button
              onClick={() => aplicar(usarPlantilla(estado, sug.plantilla, { confirmado: true }))}
              className="text-[10px] font-semibold mt-1" style={{ color: accent }}
            >
              {sug.accion}
            </button>
          </div>
        ) : (
          <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>{sug.texto}</p>
        )
      )}

      {d.rutinas.map((r) => {
        const lista = checklistPiel(estado, r.id);
        const toca = rutinasDeHoyPiel(estado).some((x) => x.id === r.id);
        return (
          <div key={r.id} className="rounded-2xl p-2.5 mb-1.5"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold flex-1 truncate" style={{ color: COLORS.text }}>
                {MOMENTOS_PIEL.find((m) => m.id === r.momento)?.icono} {r.nombre}
              </span>
              {/* ⚠️ "Pendiente", nunca "has fallado" (apartado 15). */}
              <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                {toca ? TEXTOS_DIA_PIEL[lista.estado] : 'Hoy no toca'}
              </span>
              <button
                onClick={() => setConfirmar({ ...impactoEliminarRutinaPiel(estado, r.id), id: r.id })}
                aria-label={`Eliminar ${r.nombre}`}
              >
                <X size={13} style={{ color: COLORS.textMuted }} />
              </button>
            </div>
            {toca && lista.pasos.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={() => aplicar(marcarPasoPiel(estado, r.id, p.id))}
                  className="flex items-center gap-1.5 flex-1 text-left"
                >
                  <span className="text-[11px]" style={{ color: p.hecho ? accent : COLORS.textMuted }}>
                    {p.hecho ? '☑' : (p.omitido ? '—' : '☐')}
                  </span>
                  <span className="text-[11px]" style={{ color: p.omitido ? COLORS.textMuted : COLORS.text }}>
                    {p.icono} {p.etiqueta}{p.producto ? ` · ${p.producto}` : ''}
                  </span>
                </button>
                {/* ⚠️ Apartado 10 — *"Omitir hoy"*, sin penalización. */}
                <button
                  onClick={() => aplicar(omitirPasoPiel(estado, r.id, p.id))}
                  className="text-[10px]" style={{ color: p.omitido ? accent : COLORS.textMuted }}
                >
                  {p.omitido ? 'Omitido hoy' : 'Omitir hoy'}
                </button>
              </div>
            ))}
            {toca && lista.pasos.length > 0 && (
              <button
                onClick={() => aplicar(marcarRutinaPielEntera(estado, r.id))}
                className="text-[10px] font-semibold mt-1" style={{ color: accent }}
              >
                {lista.estado === 'hecha' ? 'Desmarcar todo' : 'Marcar todo'}
              </button>
            )}
          </div>
        );
      })}

      {creando ? (
        <div className="space-y-1.5 mt-2">
          <TextInput value={nombre} onChange={(ev) => setNombre(ev.target.value)}
            placeholder="Nombre de la rutina" aria-label="Nombre de la rutina" />
          <div className="flex flex-wrap gap-1">
            {MOMENTOS_PIEL.map((m) => (
              <button key={m.id} onClick={() => setMomento(m.id)} className="rounded-full px-2.5 py-1"
                style={{
                  background: momento === m.id ? hexToRgba(accent, 0.14) : COLORS.surface2,
                  border: `1px solid ${momento === m.id ? accent : COLORS.border}`,
                }}>
                <span className="text-[10px] font-semibold" style={{ color: momento === m.id ? accent : COLORS.text }}>
                  {m.icono} {m.nombre}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {FRECUENCIAS_PIEL.map((f) => (
              <button key={f.id} onClick={() => setFrecuencia(f.id)} className="rounded-full px-2 py-0.5"
                style={{
                  background: frecuencia === f.id ? hexToRgba(accent, 0.14) : COLORS.surface2,
                  border: `1px solid ${frecuencia === f.id ? accent : COLORS.border}`,
                }}>
                <span className="text-[10px]" style={{ color: frecuencia === f.id ? accent : COLORS.textMuted }}>{f.nombre}</span>
              </button>
            ))}
          </div>
          {/* ⚠️ Apartado 14 — el nivel filtra lo que se OFRECE, nunca lo guardado. */}
          <div className="flex flex-wrap gap-1">
            {disponibles.map((p) => (
              <button
                key={p.id}
                onClick={() => setPasos(pasos.includes(p.id) ? pasos.filter((x) => x !== p.id) : [...pasos, p.id])}
                className="rounded-full px-2 py-0.5"
                style={{
                  background: pasos.includes(p.id) ? hexToRgba(accent, 0.14) : COLORS.surface2,
                  border: `1px solid ${pasos.includes(p.id) ? accent : COLORS.border}`,
                }}
              >
                <span className="text-[10px]" style={{ color: pasos.includes(p.id) ? accent : COLORS.textMuted }}>
                  {p.icono} {p.nombre}
                </span>
              </button>
            ))}
          </div>
          <PrimaryButton
            accent={accent}
            onClick={() => {
              aplicar(crearRutinaPiel(estado, {
                nombre, momento, frecuencia, pasos: pasos.map((id) => ({ accion: id })),
              }));
              setCreando(false); setNombre(''); setPasos([]);
            }}
          >
            Crear rutina
          </PrimaryButton>
          <button onClick={() => setCreando(false)} className="text-[10px] font-semibold w-full"
            style={{ color: COLORS.textMuted }}>Cancelar</button>
        </div>
      ) : (
        <PrimaryButton accent={accent} icon={Plus} onClick={() => setCreando(true)}>Crear rutina</PrimaryButton>
      )}

      {/* Apartado 16 — una frase, no una pantalla de estadísticas. */}
      <p className="text-[10px] text-center mt-3" style={{ color: COLORS.textMuted }}>
        {estaSemanaPiel(estado).texto}
      </p>

      <AvisoDesactivar
        aviso={confirmar} accent={accent}
        onCancelar={() => setConfirmar(null)}
        onConfirmar={() => {
          if (confirmar?.id) aplicar(eliminarRutinaPiel(estado, confirmar.id));
          setConfirmar(null);
        }}
      />
    </Card>
  );
}

/* ===========================================================================
   SKINCARE: RECOMENDACIONES (F16)
   ===========================================================================
   ⚠️ **La aplicación nunca modifica la rutina** (apartados 4 y 11). "Añadir a
   mi rutina" llama a `anadirARutina` con `confirmado: true` **porque él ha
   tocado el botón**; sin ese toque no se escribe nada.

   ⚠️ Y **cada una trae su "¿por qué aparece?"** (apartado 6): la transparencia
   es el punto, no un adorno. */
export function RecomendacionesPielEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar, onPerfil }) {
  const [verTodas, setVerTodas] = useState(false);
  const [menu, setMenu] = useState(null);
  const [aviso, setAviso] = useState(null);

  const r = useMemo(
    () => recomendarPiel(estado, datosGlobales, { limite: verTodas ? 99 : 3 }),
    [estado, datosGlobales, verTodas],
  );
  const rutinas = useMemo(() => datosRutinasPiel(estado).rutinas, [estado]);

  const aplicar = (x) => onCambiar?.(x.estado ?? x);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>💡 Recomendaciones</p>
      </div>

      {/* ⚠️ Apartado 13 — se ofrece completar el perfil, con "Ahora no" al lado.
          *"Nunca bloquear."* */}
      {r.falta.hayQueAfinar && (
        <div className="rounded-2xl p-2.5 mb-2"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
          <p className="text-[11px]" style={{ color: COLORS.text }}>{r.falta.texto}</p>
          <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
            {r.falta.campos.map((c) => c.texto).join(' · ')}
          </p>
          <div className="flex gap-2 mt-1">
            <button onClick={onPerfil} className="text-[10px] font-semibold" style={{ color: accent }}>
              {r.falta.accion}
            </button>
            <button onClick={() => {}} className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>
              {r.falta.ahoraNo}
            </button>
          </div>
        </div>
      )}

      {r.total === 0 ? (
        <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
          Aquí saldrán cosas que podrían encajarte, cuando nos cuentes algo más.
        </p>
      ) : r.recomendaciones.map((x) => (
        <div key={x.id} className="rounded-2xl p-2.5 mb-1.5"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>
                {x.icono} {x.titulo}
              </p>
              <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{x.texto}</p>
              {/* ⚠️ Apartado 6 — el "¿por qué aparece?", siempre. */}
              <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>{x.porque}</p>
            </div>
            {/* Apartado 9 — el ⋯ con sus cuatro motivos. */}
            <button onClick={() => setMenu(menu === x.id ? null : x.id)} aria-label="Opciones">
              <span className="text-[13px]" style={{ color: COLORS.textMuted }}>⋯</span>
            </button>
          </div>

          {menu === x.id && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {MOTIVOS_DESCARTE_PIEL.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { aplicar(descartarPiel(estado, x.id, m.id)); setMenu(null); }}
                  className="rounded-full px-2 py-0.5"
                  style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
                >
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{m.nombre}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-1.5">
            <button
              onClick={() => aplicar(x.guardada ? quitarGuardadaPiel(estado, x.id) : guardarRecomendacionPiel(estado, x.id))}
              className="text-[10px] font-semibold" style={{ color: x.guardada ? accent : COLORS.textMuted }}
            >
              {x.guardada ? '❤️ Guardada' : '❤️ Guardar'}
            </button>
            {/* ⚠️ Apartados 4 y 11 — con confirmación, siempre. */}
            {x.tipo === 'rutina' && (
              <button
                onClick={() => setAviso({
                  id: x.id,
                  titulo: 'Añadir a tu rutina',
                  texto: `Se añadirá "${x.titulo}" a ${rutinas[0]?.nombre || 'una rutina nueva'}.`,
                  confirmar: 'Añadir', cancelar: 'Ignorar',
                })}
                className="text-[10px] font-semibold" style={{ color: accent }}
              >
                Añadir a mi rutina
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Apartado 8 — tres, y "Ver más". */}
      {r.hayMas && !verTodas && (
        <button onClick={() => setVerTodas(true)} className="text-[11px] font-semibold mx-auto block mt-1"
          style={{ color: accent }}>Ver más</button>
      )}

      <AvisoDesactivar
        aviso={aviso} accent={accent}
        onCancelar={() => setAviso(null)}
        onConfirmar={() => {
          /* ⚠️ `confirmado: true` porque ÉL acaba de tocar "Añadir". Nunca es
             un valor por defecto de la función. */
          aplicar(anadirARutina(estado, aviso.id, rutinas[0]?.id || null, { confirmado: true }));
          setAviso(null);
        }}
      />
    </Card>
  );
}

/* ===========================================================================
   SKINCARE: SEGUIMIENTO (F15)
   ===========================================================================
   ⚠️ **Ni rachas ni obligación** (apartado 9, que el enunciado marca como *"esto
   es importante"*). Un día sin registrar **no existe**: no sale como un cero, no
   se cuenta y no se menciona.

   ⚠️ Y **nunca una causa** (apartados 7 y 12): se enseña *"↑ Mejorando"* y
   *"desde que empezaste a usar X has registrado N valoraciones"*, y ahí se
   para. */
export function SeguimientoPielEH({ estado, accent, onCambiar, onCerrar, onEliminar }) {
  const [periodo, setPeriodo] = useState('30');
  const [como, setComo] = useState(null);
  const [aspectos, setAspectos] = useState({});
  const [nota, setNota] = useState('');
  const [cambio, setCambio] = useState('');
  const [producto, setProducto] = useState(null);
  const [error, setError] = useState(null);

  const panel = useMemo(() => panelSeguimientoPiel(estado, { periodo }), [estado, periodo]);

  const limpiar = () => { setComo(null); setAspectos({}); setNota(''); setCambio(''); setProducto(null); };

  const guardar = () => {
    const r = registrarPiel(estado, { como, aspectos, nota, cambio, productoId: producto });
    if (r.error) { setError(r.error); return; }
    setError(null); limpiar(); onCambiar?.(r.estado);
  };

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

      {/* Apartado 2 — la valoración rápida. */}
      <p className="text-[11px] font-semibold mb-1" style={{ color: COLORS.text }}>¿Cómo notas tu piel hoy?</p>
      <div className="flex gap-1 mb-1.5">
        {ESCALA_PIEL.map((x) => (
          <button
            key={x.id} onClick={() => setComo(como === x.id ? null : x.id)}
            className="flex-1 rounded-2xl py-1.5"
            style={{
              background: como === x.id ? hexToRgba(accent, 0.14) : COLORS.surface2,
              border: `1px solid ${como === x.id ? accent : COLORS.border}`,
            }}
            aria-label={x.nombre}
          >
            <span className="text-base">{x.icono}</span>
          </button>
        ))}
      </div>
      {/* ⚠️ No es una sexta cara: es no registrar. */}
      <button onClick={limpiar} className="text-[10px] font-semibold mb-2" style={{ color: COLORS.textMuted }}>
        {TEXTO_NO_REGISTRAR}
      </button>

      {/* Apartado 3 — los aspectos, todos opcionales. */}
      {ASPECTOS_PIEL.map((a) => (
        <div key={a.id} className="flex items-center gap-2 mb-1">
          <span className="text-[10px] flex-1" style={{ color: COLORS.textMuted }}>{a.nombre}</span>
          {NIVELES_ASPECTO.map((nv) => (
            <button
              key={nv.valor}
              onClick={() => setAspectos({ ...aspectos, [a.id]: aspectos[a.id] === nv.valor ? undefined : nv.valor })}
              className="rounded-full w-6 h-6"
              style={{
                background: aspectos[a.id] === nv.valor ? hexToRgba(accent, 0.14) : COLORS.surface2,
                border: `1px solid ${aspectos[a.id] === nv.valor ? accent : COLORS.border}`,
              }}
              aria-label={`${a.nombre}: ${nv.nombre}`}
            >
              <span className="text-[10px]" style={{ color: aspectos[a.id] === nv.valor ? accent : COLORS.textMuted }}>
                {nv.valor}
              </span>
            </button>
          ))}
        </div>
      ))}

      {/* Apartados 4, 5 y 6 — nota, producto y cambio de rutina. Opcionales. */}
      <TextInput value={nota} onChange={(ev) => setNota(ev.target.value)}
        placeholder="📝 ¿Quieres escribir algo?" aria-label="Nota" />
      <div className="mt-1">
        <TextInput value={cambio} onChange={(ev) => setCambio(ev.target.value)}
          placeholder="¿Has cambiado algo de tu rutina?" aria-label="Cambio de rutina" />
      </div>
      {panel.productos.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {panel.productos.map((pr) => (
            <button
              key={pr.id} onClick={() => setProducto(producto === pr.id ? null : pr.id)}
              className="rounded-full px-2 py-0.5"
              style={{
                background: producto === pr.id ? hexToRgba(accent, 0.14) : COLORS.surface2,
                border: `1px solid ${producto === pr.id ? accent : COLORS.border}`,
              }}
            >
              <span className="text-[10px]" style={{ color: producto === pr.id ? accent : COLORS.textMuted }}>{pr.nombre}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-2">
        <PrimaryButton accent={accent} onClick={guardar}>Guardar</PrimaryButton>
      </div>
      {error && <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>{error}</p>}

      {/* Apartado 8 — los periodos. */}
      <div className="flex gap-1 mt-3 mb-1.5">
        {PERIODOS_PIEL.map((pd) => (
          <button key={pd.id} onClick={() => setPeriodo(pd.id)} className="flex-1 rounded-2xl py-1"
            style={{
              background: periodo === pd.id ? hexToRgba(accent, 0.14) : COLORS.surface2,
              border: `1px solid ${periodo === pd.id ? accent : COLORS.border}`,
            }}>
            <span className="text-[10px] font-semibold" style={{ color: periodo === pd.id ? accent : COLORS.textMuted }}>
              {pd.id === 'todo' ? 'Todo' : pd.id}
            </span>
          </button>
        ))}
      </div>

      {/* Apartado 7 — la evolución, sin una sola causa. */}
      {panel.evolucion.hay ? (
        <div className="rounded-2xl p-2.5 mb-2"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
          <p className="text-[11px] font-semibold mb-1" style={{ color: COLORS.text }}>📊 Tu evolución</p>
          {panel.evolucion.aspectos.map((a) => (
            <p key={a.id} className="text-[10px]" style={{ color: COLORS.textMuted }}>
              {a.nombre}: {a.icono} {a.etiqueta}
            </p>
          ))}
          {/* ⚠️ De dónde sale: sin caja negra. */}
          <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>{panel.evolucion.de}</p>
        </div>
      ) : (
        <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>{panel.evolucion.texto}</p>
      )}

      {panel.registros.map((r) => (
        <div key={r.id} className="rounded-2xl p-2 flex items-center gap-2 mb-1"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
          <span className="text-base">{r.comoInfo?.icono || '·'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px]" style={{ color: COLORS.text }}>{r.fecha}</p>
            <p className="text-[10px] truncate" style={{ color: COLORS.textMuted }}>
              {[r.producto, r.cambio, r.nota].filter(Boolean).join(' · ')}
            </p>
          </div>
          {/* ⚠️ Apartado 13 — va a "Eliminados recientemente", la papelera que ya
              existe. Por eso lo maneja App.jsx y no esta pantalla. */}
          <button onClick={() => onEliminar?.(r.id)} aria-label={`Eliminar el registro del ${r.fecha}`}>
            <X size={13} style={{ color: COLORS.textMuted }} />
          </button>
        </div>
      ))}

      {/* Apartado 12 — se cuenta lo registrado, nunca se explica. */}
      {panel.productos.map((pr) => {
        const d = desdeQueUsas(estado, pr.id);
        return d?.hay ? (
          <p key={pr.id} className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>{d.texto}</p>
        ) : null;
      })}
    </Card>
  );
}

/* ===========================================================================
   PRODUCTOS DE SKINCARE (F17)
   ===========================================================================
   *"La aplicación recomienda. El usuario elige."*

   ⚠️ **Todo lo que se ve aquí lo ha metido él.** El catálogo está vacío por
   decisión de Josué (D2-03), y la pantalla lo dice con una frase en vez de
   fingir una tienda. No hay ni un botón que compre: los enlaces son enlaces, y
   el pack sugerido trae un botón que **lo crearía**, que pulsa él.

   ⚠️ Y **la vista no calcula nada**: recomendar es `recomendarProductosPiel`,
   filtrar es `buscarEnPiel`, comparar es `compararProductosPiel` y el pack lo
   propone `packSugeridoPiel`. Aquí solo se pinta. */
export function ProductosPielEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar }) {
  /* ⚠️ Regla 4 — todos los hooks antes de cualquier `return`. */
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [cat, setCat] = useState(null);
  const [precio, setPrecio] = useState('');
  const [tipos, setTipos] = useState([]);
  const [objetivos, setObjetivos] = useState([]);
  const [tienda, setTienda] = useState(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState(null);
  const [texto, setTexto] = useState('');
  const [filtros, setFiltros] = useState({});
  const [verFiltros, setVerFiltros] = useState(false);
  const [comparar, setComparar] = useState([]);
  const [nombrePack, setNombrePack] = useState('');

  const lista = useMemo(() => buscarEnPiel(estado, { texto, ...filtros }), [estado, texto, filtros]);
  const todos = useMemo(() => productosPiel(estado), [estado]);
  const rec = useMemo(() => recomendarProductosPiel(estado, datosGlobales), [estado, datosGlobales]);
  const sug = useMemo(() => packSugeridoPiel(estado, datosGlobales), [estado, datosGlobales]);
  const packs = useMemo(() => packsPiel(estado).map((p) => verPackPiel(estado, p.id)).filter(Boolean), [estado]);
  const marcas = useMemo(() => marcasDePiel(estado), [estado]);
  const tabla = useMemo(() => compararProductosPiel(estado, comparar), [estado, comparar]);
  const resumen = useMemo(() => resumenProductosPiel(estado, datosGlobales), [estado, datosGlobales]);

  const aplicar = (r) => {
    if (r.error) { setError(r.error); return; }
    setError(null);
    onCambiar?.(r.estado);
  };

  const guardar = () => {
    const r = crearProductoPiel(estado, {
      nombre,
      marca,
      categoria: cat,
      precio: precio.trim() === '' ? null : Number(precio.replace(',', '.')),
      tiposPiel: tipos,
      objetivos,
      /* ⚠️ *"Nunca inventar enlaces"* (apartado 4): si no escribe una URL, la
         tienda se guarda igual y **sin enlace**. Lo que no vale, el
         normalizador lo deja en `null` y la ficha dirá que no hay enlace. */
      tiendas: tienda ? [{ tipo: tienda, url: url.trim() || null }] : [],
    });
    if (r.error) { setError(r.error); return; }
    setError(null);
    if (!r.sinEfecto) onCambiar?.(r.estado);
    setCreando(false); setNombre(''); setMarca(''); setCat(null); setPrecio('');
    setTipos([]); setObjetivos([]); setTienda(null); setUrl('');
  };

  const alternar = (lst, set, id) => set(lst.includes(id) ? lst.filter((x) => x !== id) : [...lst, id]);
  const filtrar = (id, valor) => setFiltros((f) => (f[id] === valor
    ? Object.fromEntries(Object.entries(f).filter(([k]) => k !== id))
    : { ...f, [id]: valor }));

  const chip = (activo) => ({
    background: activo ? hexToRgba(accent, 0.12) : COLORS.surface2,
    border: `1px solid ${activo ? accent : COLORS.border}`,
  });

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>🛒 Productos para ti</p>
      </div>
      {/* ⚠️ Regla 8 + D2-03: se dice que no hay catálogo, en vez de fingir uno. */}
      <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>{CATALOGO_VACIO_PORQUE}</p>

      {error && <p className="text-[11px] mb-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}

      {/* Apartados 8 y 9 — ⭐ Para ti, cada uno con su porqué. */}
      {rec.activo && rec.productos.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: COLORS.textMuted }}>
            ⭐ Para ti
          </p>
          <div className="space-y-1">
            {rec.productos.map((p) => (
              <div key={p.id} className="rounded-2xl p-2.5"
                style={{ background: hexToRgba(accent, 0.08), border: `1px solid ${hexToRgba(accent, 0.25)}` }}>
                <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>
                  {categoriaPiel(p.categoria)?.icono || '🧴'} {p.nombre}{p.marca ? ` · ${p.marca}` : ''}
                </p>
                <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{p.porque}</p>
              </div>
            ))}
          </div>
          {rec.hayMas && (
            <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
              Y {rec.total - rec.productos.length} más en tu lista.
            </p>
          )}
        </div>
      )}

      {/* Apartado 17 — el pack sugerido SUGIERE: crearlo lo pulsa él. */}
      {sug.hay && (
        <div className="rounded-2xl p-3 mb-3"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
          <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>📦 {sug.nombre}</p>
          {sug.productos.map((p) => (
            <p key={p.id} className="text-[10px]" style={{ color: COLORS.textMuted }}>
              {categoriaPiel(p.categoria)?.icono || '🧴'} {p.nombre}
            </p>
          ))}
          <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>{sug.porque}</p>
          <button
            onClick={() => aplicar(crearPackPiel(estado, sug.nombre, sug.productoIds))}
            className="text-[10px] font-semibold mt-1.5" style={{ color: accent }}
          >
            {sug.accion}
          </button>
        </div>
      )}

      {/* Apartado 16 — sus packs, con lo que ya tiene marcado. */}
      {packs.length > 0 && (
        <div className="space-y-1 mb-3">
          {packs.map((p) => (
            <div key={p.id} className="rounded-2xl p-2.5"
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>📦 {p.nombre}</p>
              {p.items.map((x) => (
                <p key={x.id} className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  {p.yaTengo.includes(x.id) ? '☑️' : '☐'} {x.nombre}
                </p>
              ))}
              {/* ⚠️ Sin todos los precios NO se da un total: mentiría. */}
              <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>
                {p.precio === null
                  ? 'Sin precios guardados'
                  : `${p.precio} €${p.sumaParcial ? ` · solo ${p.conPrecio} de ${p.total} tienen precio` : ''}`}
              </p>
              <button onClick={() => aplicar(eliminarPackPiel(estado, p.id))}
                className="text-[10px] font-semibold mt-1" style={{ color: COLORS.textMuted }}>
                Quitar el pack
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Apartado 11 — el buscador. Apartado 10 — los filtros, que no obligan. */}
      {todos.length > 0 && (
        <div className="mb-3 space-y-2">
          <TextInput value={texto} onChange={(ev) => setTexto(ev.target.value)}
            placeholder="🔍 Buscar productos" aria-label="Buscar productos" />
          <button onClick={() => setVerFiltros(!verFiltros)} className="text-[10px] font-semibold"
            style={{ color: accent }}>
            {verFiltros ? 'Ocultar filtros' : 'Filtros'}
          </button>
          {verFiltros && (
            <div className="space-y-1.5">
              {FILTROS_PIEL.filter((f) => f.opciones).map((f) => (
                <div key={f.id}>
                  <p className="text-[10px] font-semibold mb-1" style={{ color: COLORS.textMuted }}>{f.nombre}</p>
                  <div className="flex flex-wrap gap-1">
                    {f.opciones().map((o) => (
                      <button key={o.id} onClick={() => filtrar(f.id, o.id)}
                        className="rounded-full px-2 py-0.5" style={chip(filtros[f.id] === o.id)}
                        aria-pressed={filtros[f.id] === o.id}>
                        <span className="text-[10px] font-semibold"
                          style={{ color: filtros[f.id] === o.id ? COLORS.text : COLORS.textMuted }}>
                          {o.icono ? `${o.icono} ` : ''}{o.nombre}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {marcas.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold mb-1" style={{ color: COLORS.textMuted }}>Marca</p>
                  <div className="flex flex-wrap gap-1">
                    {marcas.map((m) => (
                      <button key={m} onClick={() => filtrar('marca', m)}
                        className="rounded-full px-2 py-0.5" style={chip(filtros.marca === m)}
                        aria-pressed={filtros.marca === m}>
                        <span className="text-[10px] font-semibold"
                          style={{ color: filtros.marca === m ? COLORS.text : COLORS.textMuted }}>{m}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => { setFiltros({}); setTexto(''); }}
                className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>
                Quitar los filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Apartado 15 — la comparación, que enseña diferencias y no elige. */}
      {tabla.suficiente && (
        <div className="rounded-2xl p-2.5 mb-3 overflow-x-auto"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
          <table className="text-[10px] w-full">
            <thead>
              <tr>
                <th className="text-left pr-2" style={{ color: COLORS.textMuted }}> </th>
                {tabla.productos.map((p) => (
                  <th key={p.id} className="text-left pr-2 font-semibold" style={{ color: COLORS.text }}>{p.nombre}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabla.filas.map((f) => (
                <tr key={f.id}>
                  <td className="pr-2" style={{ color: COLORS.textMuted }}>{f.nombre}</td>
                  {f.valores.map((v, i) => (
                    <td key={i} className="pr-2" style={{ color: COLORS.text }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {tabla.recortado && (
            <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
              Se comparan {MAX_COMPARAR} a la vez.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <button onClick={() => setComparar([])} className="text-[10px] font-semibold"
              style={{ color: COLORS.textMuted }}>Dejar de comparar</button>
            <TextInput value={nombrePack} onChange={(ev) => setNombrePack(ev.target.value)}
              placeholder="Nombre del pack" aria-label="Nombre del pack" />
            <button
              onClick={() => { aplicar(crearPackPiel(estado, nombrePack, comparar)); setNombrePack(''); }}
              className="text-[10px] font-semibold" style={{ color: accent }}>
              Guardarlos como pack
            </button>
          </div>
        </div>
      )}
      {comparar.length === 1 && (
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>{tabla.texto}</p>
      )}

      {/* La lista. */}
      <div className="space-y-1 mb-3">
        {lista.map((p) => {
          const en = enlacesDePiel(estado, p.id);
          const alts = p.estado !== 'disponible' ? alternativasDePiel(estado, p.id) : [];
          const elegido = comparar.includes(p.id);
          return (
            <div key={p.id} className="rounded-2xl p-2.5"
              style={{ background: COLORS.surface2, border: `1px solid ${elegido ? accent : COLORS.border}` }}>
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none flex-shrink-0" aria-hidden="true">
                  {categoriaPiel(p.categoria)?.icono || '🧴'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold truncate" style={{ color: COLORS.text }}>{p.nombre}</p>
                  <p className="text-[10px] truncate" style={{ color: COLORS.textMuted }}>
                    {[p.marca, categoriaPiel(p.categoria)?.nombre, p.precio !== null ? `${p.precio} €` : null]
                      .filter(Boolean).join(' · ') || 'Sin más datos'}
                  </p>
                </div>
                <button onClick={() => aplicar(alternarFavoritoPiel(estado, p.id))}
                  className="flex-shrink-0 text-[11px]" aria-label={`Favorito ${p.nombre}`}>
                  {p.favorito ? '❤️' : '🤍'}
                </button>
              </div>

              {/* Apartado 5 — dónde conseguirlo, aunque no haya enlace. */}
              {en.donde.length > 0 && (
                <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
                  Disponible en {en.donde.join(', ')}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <button onClick={() => aplicar(alternarMioPiel(estado, p.id))}
                  className="text-[10px] font-semibold" style={{ color: p.mio ? accent : COLORS.textMuted }}>
                  {p.mio ? '✓ Ya lo tengo' : 'Ya lo tengo'}
                </button>
                {/* ⚠️ Apartado 7: siempre "Ver producto", nunca "Comprar". */}
                {en.enlaces.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-semibold" style={{ color: accent }}>
                    {l.etiqueta} · {l.tienda}
                  </a>
                ))}
                {en.sinEnlaces && (
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{en.sinEnlacesTexto}</span>
                )}
                <button
                  onClick={() => setComparar(elegido
                    ? comparar.filter((x) => x !== p.id)
                    : [...comparar, p.id].slice(-MAX_COMPARAR))}
                  className="text-[10px] font-semibold" style={{ color: elegido ? accent : COLORS.textMuted }}>
                  {elegido ? '✓ Comparar' : 'Comparar'}
                </button>
                <button onClick={() => aplicar(marcarNoDisponiblePiel(estado, p.id, p.estado !== 'disponible'))}
                  className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>
                  {p.estado === 'disponible' ? 'Marcar no disponible' : 'Vuelve a estar'}
                </button>
                <button onClick={() => aplicar(eliminarProductoPiel(estado, p.id))}
                  className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>
                  Quitar
                </button>
              </div>

              {/* Apartado 20 — su valoración, que es información personal. */}
              <div className="flex items-center gap-1 mt-1.5">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} onClick={() => aplicar(valorarProductoPiel(estado, p.id, p.valoracion === v ? null : v))}
                    className="text-[11px]" aria-label={`Valorar ${p.nombre} con ${v}`}>
                    {p.valoracion !== null && v <= p.valoracion ? '⭐' : '☆'}
                  </button>
                ))}
              </div>

              {/* ⚠️ El aviso de afiliación, SOLO si hay algún enlace de afiliado. */}
              {en.aviso && <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>{en.aviso}</p>}

              {/* Apartado 18 — no disponible NO es borrado, y hay alternativas. */}
              {p.estado !== 'disponible' && (
                <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
                  ⚠️ No disponible
                  {alts.length > 0
                    ? ` · Ver alternativas: ${alts.map((a) => a.nombre).join(', ')}`
                    : ' · Todavía no tienes ninguna alternativa guardada'}
                </p>
              )}
            </div>
          );
        })}
        {todos.length > 0 && lista.length === 0 && (
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
            Ninguno de tus productos encaja con lo que has buscado.
          </p>
        )}
      </div>

      {/* Apartado 14 — producto personalizado: no necesita estar en un catálogo. */}
      {creando ? (
        <div className="space-y-2">
          <TextInput value={nombre} onChange={(ev) => setNombre(ev.target.value)}
            placeholder="Nombre del producto" aria-label="Nombre del producto" />
          <TextInput value={marca} onChange={(ev) => setMarca(ev.target.value)}
            placeholder="Marca (opcional)" aria-label="Marca" />
          <TextInput value={precio} onChange={(ev) => setPrecio(ev.target.value)}
            placeholder="Precio en € (opcional)" aria-label="Precio" inputMode="decimal" />

          <p className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>Categoría</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIAS_PRODUCTO_PIEL.map((c) => (
              <button key={c.id} onClick={() => setCat(cat === c.id ? null : c.id)}
                className="rounded-full px-2.5 py-1" style={chip(cat === c.id)} aria-pressed={cat === c.id}>
                <span className="text-[11px] font-semibold" style={{ color: cat === c.id ? COLORS.text : COLORS.textMuted }}>
                  {c.icono} {c.nombre}
                </span>
              </button>
            ))}
          </div>

          <p className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>
            Para qué tipo de piel (si no marcas ninguno, vale para cualquiera)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TIPOS_PIEL.map((t) => (
              <button key={t.id} onClick={() => alternar(tipos, setTipos, t.id)}
                className="rounded-full px-2.5 py-1" style={chip(tipos.includes(t.id))}
                aria-pressed={tipos.includes(t.id)}>
                <span className="text-[11px] font-semibold"
                  style={{ color: tipos.includes(t.id) ? COLORS.text : COLORS.textMuted }}>{t.nombre}</span>
              </button>
            ))}
          </div>

          <p className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>Para qué sirve</p>
          <div className="flex flex-wrap gap-1.5">
            {NECESIDADES_PIEL.map((o) => (
              <button key={o.id} onClick={() => alternar(objetivos, setObjetivos, o.id)}
                className="rounded-full px-2.5 py-1" style={chip(objetivos.includes(o.id))}
                aria-pressed={objetivos.includes(o.id)}>
                <span className="text-[11px] font-semibold"
                  style={{ color: objetivos.includes(o.id) ? COLORS.text : COLORS.textMuted }}>{o.nombre}</span>
              </button>
            ))}
          </div>

          {/* Apartados 4, 5 y 6 — dónde se consigue, con enlace o sin él. */}
          <p className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>Dónde se consigue</p>
          <div className="flex flex-wrap gap-1.5">
            {TIPOS_TIENDA.map((t) => (
              <button key={t.id} onClick={() => setTienda(tienda === t.id ? null : t.id)}
                className="rounded-full px-2.5 py-1" style={chip(tienda === t.id)} aria-pressed={tienda === t.id}>
                <span className="text-[11px] font-semibold" style={{ color: tienda === t.id ? COLORS.text : COLORS.textMuted }}>
                  {t.icono} {t.nombre}
                </span>
              </button>
            ))}
          </div>
          {tienda && (
            <TextInput value={url} onChange={(ev) => setUrl(ev.target.value)}
              placeholder="Enlace (opcional)" aria-label="Enlace del producto" inputMode="url" />
          )}

          <PrimaryButton accent={accent} onClick={guardar}>Guardar producto</PrimaryButton>
          <button onClick={() => { setCreando(false); setError(null); }}
            className="text-[11px] font-semibold mx-auto block" style={{ color: COLORS.textMuted }}>Cancelar</button>
        </div>
      ) : (
        <PrimaryButton accent={accent} icon={Plus} onClick={() => setCreando(true)}>Añadir producto</PrimaryButton>
      )}

      {resumen.total > 0 && (
        <p className="text-[10px] mt-2" style={{ color: COLORS.textMuted }}>
          {resumen.total} {resumen.total === 1 ? 'producto' : 'productos'}
          {resumen.mios > 0 ? ` · ${resumen.mios} que ya tienes` : ''}
          {resumen.favoritos > 0 ? ` · ${resumen.favoritos} favoritos` : ''}
        </p>
      )}
    </Card>
  );
}

/**
 * F14, apartado 1 — el panel de Skincare, con sus cinco plaquitas. ⚠️ Regla 8:
 * las dos que todavía no funcionan **dicen en qué fase llegan**, en vez de no
 * hacer nada al tocarlas.
 */
export function PanelPiel({ estado, accent, datosGlobales = {}, onCambiar, onCerrar, onPerfil, onEliminarRegistro }) {
  const [zona, setZona] = useState(null);      // null | 'rutina' | 'seguimiento'
  const prog = useMemo(() => progresoPiel(estado, datosGlobales), [estado, datosGlobales]);
  const rut = useMemo(() => resumenRutinasPiel(estado), [estado]);
  const hist = useMemo(() => historialPiel(estado), [estado]);
  const seg = useMemo(() => resumenSeguimientoPiel(estado), [estado]);
  const recs = useMemo(() => resumenRecsPiel(estado, datosGlobales), [estado, datosGlobales]);
  const prod = useMemo(() => resumenProductosPiel(estado, datosGlobales), [estado, datosGlobales]);

  if (zona === 'rutina') {
    return (
      <RutinasPielEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setZona(null)}
      />
    );
  }
  if (zona === 'recomendaciones') {
    return (
      <RecomendacionesPielEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setZona(null)} onPerfil={onPerfil}
      />
    );
  }
  if (zona === 'seguimiento') {
    return (
      <SeguimientoPielEH
        estado={estado} accent={accent}
        onCambiar={onCambiar} onCerrar={() => setZona(null)} onEliminar={onEliminarRegistro}
      />
    );
  }
  if (zona === 'productos') {
    return (
      <ProductosPielEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setZona(null)}
      />
    );
  }

  const sub = {
    perfil: prog.sinEmpezar ? 'Sin configurar' : `${prog.contestadas} de ${prog.total}`,
    rutina: rut.rutinas === 0 ? 'Ninguna todavía' : `${rut.rutinas} ${rut.rutinas === 1 ? 'rutina' : 'rutinas'}`,
    // ⚠️ F15 — el recuento es de registros de piel, no de rutinas hechas: son
    // dos cosas distintas y mezclarlas mentiría en las dos direcciones.
    seguimiento: seg.guardados === 0 ? 'Sin registros' : seg.texto,
    recomendaciones: recs.disponibles === 0
      ? 'Cuéntanos algo más'
      : `${recs.disponibles} ${recs.disponibles === 1 ? 'opción' : 'opciones'}`,
    /* ⚠️ F17 — el recuento es de SUS productos, porque no hay catálogo (D2-03).
       Decir "0 productos" sin más parecería un fallo; se dice qué pasa. */
    productos: prod.total === 0
      ? 'Añade los tuyos'
      : `${prod.total} ${prod.total === 1 ? 'producto' : 'productos'}`,
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
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>🧴 Skincare</p>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {PLAQUITAS_PIEL
            .filter((p) => p.id !== 'rutina' || parteActivaPiel(estado, 'rutinas'))
            .filter((p) => p.id !== 'seguimiento' || parteActivaPiel(estado, 'seguimiento'))
            /* ⚠️ F16, apartados 1 y 17 — apagarlas hace desaparecer la plaquita
               y los demás módulos siguen funcionando. */
            .filter((p) => p.id !== 'recomendaciones' || parteActivaPiel(estado, PARTE_RECOMENDACIONES))
            /* ⚠️ F17, apartado 21 — apagar Productos hace desaparecer su
               plaquita, **los datos permanecen** y skincare sigue funcionando. */
            .filter((p) => p.id !== 'productos' || parteActivaPiel(estado, PARTE_PRODUCTOS))
            .map((p) => (
              <Plaquita
                key={p.id} accent={accent}
                modulo={{ nombre: p.nombre, icono: p.icono, sub: '' }}
                sub={p.listo ? (sub[p.id] || '') : `Llega en la fase ${p.fase}`}
                onAbrir={p.listo
                  ? (p.id === 'perfil' ? onPerfil
                    : (p.id === 'rutina' ? () => setZona('rutina')
                      : (p.id === 'seguimiento' ? () => setZona('seguimiento')
                        : (p.id === 'recomendaciones' ? () => setZona('recomendaciones')
                          : (p.id === 'productos' ? () => setZona('productos') : null)))))
                  : null}
              />
            ))}
        </div>
      </Card>

      {/* Apartado 16 — *"información sencilla"*, y ya. */}
      {parteActivaPiel(estado, 'seguimiento') && hist.length > 0 && (
        <Card>
          <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>📈 Seguimiento</p>
          <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>{estaSemanaPiel(estado).texto}</p>
          {hist.map((h) => (
            <p key={h.id} className="text-[10px]" style={{ color: COLORS.textMuted }}>
              {/* ⚠️ Sin días en los que tocara NO hay cumplimiento (apartado 15). */}
              {h.nombre}: {h.cumplimiento === null
                ? `${h.hechas} ${h.hechas === 1 ? 'vez' : 'veces'} en el último mes`
                : `${h.hechas} de ${h.tocaba}`}
            </p>
          ))}
        </Card>
      )}

      {/* Apartado 18 — cada parte se puede apagar, y los datos se conservan. */}
      <Card>
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: COLORS.textMuted }}>
          ⚙️ Gestionar apartados
        </p>
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>
          Lo que apagues deja de aparecer, pero no se borra nada.
        </p>
        {PARTES_PIEL.map((p) => (
          <div key={p.id} className="rounded-2xl p-2.5 flex items-center gap-2 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <span className="text-[11px] font-semibold flex-1" style={{ color: COLORS.text }}>{p.nombre}</span>
            <Switch checked={parteActivaPiel(estado, p.id)} onChange={() => onCambiar?.(alternarPartePiel(estado, p.id))}
              accent={accent} label={p.nombre} />
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ===========================================================================
   BARBA Y AFEITADO (F20)
   ===========================================================================
   *"Un módulo independiente y 100 % opcional. No todo el mundo tiene barba."*

   ⚠️ Tres pantallas encadenadas, y en este orden: la **entrada** con sus dos
   botones (apartado 1), **qué quiere gestionar** (apartado 2) y el **panel**,
   con el perfil dentro. Quien dice "Ahora no" no ve ninguna de las otras dos.

   ⚠️ Y **la vista no decide nada**: qué preguntas se enseñan lo dice
   `seccionesDeBarba`, qué frecuencia tiene `frecuenciaDeAfeitado`, y qué
   productos hay `catalogoParaBarba`. Aquí solo se pinta. */

/** Apartado 2 — *"¿Qué quieres gestionar?"*, con sus seis casillas. */
export function ElegirPartesBarba({ estado, accent, onCambiar, onCerrar }) {
  const yaPuestas = useMemo(() => {
    const d = datosBarba(estado);
    return PARTES_BARBA.filter((p) => d.partes[p.id]).map((p) => p.id);
  }, [estado]);
  const [marcadas, setMarcadas] = useState(yaPuestas);
  const [error, setError] = useState(null);

  const alternar = (id) => setMarcadas(marcadas.includes(id)
    ? marcadas.filter((x) => x !== id) : [...marcadas, id]);

  const guardar = () => {
    const r = elegirPartesBarba(estado, marcadas);
    if (r.error) { setError(r.error); return; }
    setError(null);
    onCambiar?.(r.estado);
    onCerrar?.();
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>¿Qué quieres gestionar?</p>
      </div>
      <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>
        Puedes elegir varias, y cambiarlo cuando quieras.
      </p>

      <div className="space-y-1.5">
        {PARTES_BARBA.map((p) => {
          const puesta = marcadas.includes(p.id);
          return (
            <button
              key={p.id} onClick={() => alternar(p.id)}
              className="w-full rounded-2xl p-2.5 flex items-center gap-2 text-left"
              style={{
                background: puesta ? hexToRgba(accent, 0.1) : COLORS.surface2,
                border: `1px solid ${puesta ? accent : COLORS.border}`,
              }}
              aria-pressed={puesta}
            >
              <span className="text-sm leading-none" aria-hidden="true">{puesta ? '☑️' : '☐'}</span>
              <span className="text-sm leading-none" aria-hidden="true">{p.icono}</span>
              <span className="text-[11px] font-semibold flex-1" style={{ color: COLORS.text }}>{p.nombre}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="text-[10px] mt-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}

      <div className="mt-3">
        <PrimaryButton accent={accent} onClick={guardar}>Continuar</PrimaryButton>
      </div>
    </Card>
  );
}

/** Apartados 3 a 13 — el formulario, opcional y por secciones. */
export function PerfilBarbaEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar }) {
  const [seccion, setSeccion] = useState(0);
  const [dias, setDias] = useState('');
  const [error, setError] = useState(null);

  const panel = useMemo(() => panelBarba(estado, datosGlobales), [estado, datosGlobales]);
  const secciones = panel.secciones;
  const actual = secciones[Math.min(seccion, Math.max(secciones.length - 1, 0))] || null;

  const aplicar = (r) => {
    if (r.error) { setError(r.error); return; }
    setError(null);
    onCambiar?.(r.estado);
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_BARBA.editar}</p>
      </div>

      {/* ⚠️ Apartado 17 — lo que ya sabíamos, y DÓNDE se cambia. Aquí no se
          edita: `sensibilidadPiel` es de Skincare y de la capa compartida. */}
      {panel.yaSabemos.length > 0 && (
        <div className="rounded-2xl p-2.5 mb-3"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
          <p className="text-[10px] font-semibold mb-0.5" style={{ color: COLORS.textMuted }}>
            Esto ya nos lo has contado
          </p>
          {panel.yaSabemos.map((x) => (
            <p key={x.id} className="text-[10px]" style={{ color: COLORS.textMuted }}>
              {x.nombre}: {x.valor}{x.donde ? ` · se cambia en ${x.donde}` : ''}
            </p>
          ))}
        </div>
      )}

      {/* ⚠️ Un recuento, no una nota: contestar tres de nueve está bien. */}
      <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>
        {panel.progreso.contestadas} de {panel.progreso.total} · todo es opcional
      </p>

      <div className="flex gap-1 mb-3 overflow-x-auto">
        {secciones.map((s, i) => (
          <button
            key={s.id} onClick={() => setSeccion(i)}
            className="rounded-2xl px-2.5 py-1.5 flex-shrink-0"
            style={{
              background: actual?.id === s.id ? hexToRgba(accent, 0.14) : COLORS.surface2,
              border: `1px solid ${actual?.id === s.id ? accent : COLORS.border}`,
            }}
          >
            <span className="text-[10px] font-semibold" style={{ color: actual?.id === s.id ? accent : COLORS.text }}>
              {s.nombre} {s.contestadas}/{s.total}
            </span>
          </button>
        ))}
      </div>

      {actual && (
        <div className="space-y-3">
          {actual.preguntas.map((q) => (
            <div key={q.id}>
              <p className="text-[11px] font-semibold mb-0.5" style={{ color: COLORS.text }}>{q.titulo}</p>
              {q.ayuda && <p className="text-[10px] mb-1" style={{ color: COLORS.textMuted }}>{q.ayuda}</p>}
              <div className="flex flex-wrap gap-1">
                {q.opcionesVisibles.map((o) => {
                  const puesto = q.valores.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => aplicar(contestarBarba(estado, q.id, o.id))}
                      className="rounded-full px-2.5 py-1"
                      style={{
                        background: puesto ? hexToRgba(accent, 0.14) : COLORS.surface2,
                        border: `1px solid ${puesto ? accent : COLORS.border}`,
                      }}
                      aria-pressed={puesto}
                    >
                      <span className="text-[10px] font-semibold" style={{ color: puesto ? accent : COLORS.text }}>
                        {o.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>
              {q.valores.length > 0 && (
                <button onClick={() => aplicar(borrarBarba(estado, q.id))}
                  className="text-[10px] font-semibold mt-1" style={{ color: COLORS.textMuted }}>
                  Quitar la respuesta
                </button>
              )}
            </div>
          ))}

          {/* ⚠️ Apartado 8 — "Personalizado" pide su cifra, y sin ella NO se
              inventa una. Y si choca con lo del perfil, se enseña el choque. */}
          {actual.id === 'afeitado' && respuestaBarba(estado, 'frecuenciaAfeitado', datosGlobales).valores[0] === 'personalizado' && (
            <div>
              <p className="text-[11px] font-semibold mb-1" style={{ color: COLORS.text }}>¿Cada cuántos días?</p>
              <div className="flex gap-1.5">
                <TextInput value={dias} onChange={(ev) => setDias(ev.target.value)}
                  placeholder="Por ejemplo, 4" aria-label="Cada cuántos días" inputMode="numeric" />
                <button
                  onClick={() => { aplicar(ponerDiasAfeitado(estado, dias)); setDias(''); }}
                  className="rounded-2xl px-3"
                  style={{ background: hexToRgba(accent, 0.12), border: `1px solid ${accent}` }}
                >
                  <span className="text-[11px] font-semibold" style={{ color: accent }}>Guardar</span>
                </button>
              </div>
            </div>
          )}
          {actual.id === 'afeitado' && panel.frecuencia.choque && (
            <p className="text-[10px]" style={{ color: COLORS.textMuted }}>⚠️ {panel.frecuencia.texto}</p>
          )}
        </div>
      )}

      {error && <p className="text-[10px] mt-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}
    </Card>
  );
}

/** Apartado 12 — los productos que YA tiene. ⚠️ Del catálogo global, no de aquí. */
export function ProductosBarbaEH({ estado, accent, onCambiar, onCerrar }) {
  const catalogo = useMemo(() => catalogoParaBarba(estado), [estado]);
  const mios = useMemo(() => productosDeBarba(estado), [estado]);
  const marcados = mios.map((p) => p.id);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>🛒 Mis productos</p>
      </div>
      {/* ⚠️ Se dice de dónde salen, para que no parezca un catálogo nuevo. */}
      <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>
        Son los que ya tienes registrados en otros apartados. Marca los que uses para la barba.
      </p>

      {catalogo.length === 0 ? (
        <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
          Todavía no has registrado ningún producto. Los que añadas en Skincare o en Pelo saldrán aquí.
        </p>
      ) : (
        <div className="space-y-1">
          {catalogo.map((p) => {
            const puesto = marcados.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => onCambiar?.((puesto ? quitarProductoBarba(estado, p.id) : marcarProductoBarba(estado, p.id)).estado)}
                className="w-full rounded-2xl p-2.5 flex items-center gap-2 text-left"
                style={{
                  background: puesto ? hexToRgba(accent, 0.1) : COLORS.surface2,
                  border: `1px solid ${puesto ? accent : COLORS.border}`,
                }}
                aria-pressed={puesto}
              >
                <span className="text-sm leading-none" aria-hidden="true">{puesto ? '☑️' : '☐'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold truncate" style={{ color: COLORS.text }}>{p.nombre}</span>
                  {/* ⚠️ Y de qué módulo es: el mismo producto vale para varios. */}
                  <span className="block text-[10px] truncate" style={{ color: COLORS.textMuted }}>
                    {[p.marca, `de ${p.moduloNombre}`].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ===========================================================================
   RUTINAS DE BARBA (F21)
   ===========================================================================
   ⚠️ **Omitir es una tercera cosa** (apartado 7) y **un día sin hacer no es un
   fallo**: la pantalla dice "Pendiente", nunca "has fallado". Y **nada se
   calcula aquí**: el estado del día lo dice `checklistBarba`, las plantillas
   `plantillasSugeridasBarba` y las sugerencias `sugerenciasBarba`. */
export function RutinasBarbaEH({ estado, accent, onCambiar, onCerrar, onEliminarRegistro, onEliminarRutina }) {
  /* ⚠️ Regla 4 — todos los hooks antes de cualquier `return`. */
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [pasos, setPasos] = useState([]);
  const [frecuencia, setFrecuencia] = useState('diaria');
  const [registrando, setRegistrando] = useState(null);
  const [como, setComo] = useState(null);
  const [aspectos, setAspectos] = useState({});
  const [nota, setNota] = useState('');
  const [confirmar, setConfirmar] = useState(null);
  const [error, setError] = useState(null);

  const panel = useMemo(() => panelRutinasBarba(estado), [estado]);

  const aplicar = (r) => {
    if (r.error) { setError(r.error); return false; }
    setError(null);
    onCambiar?.(r.estado);
    return true;
  };

  const crear = () => {
    const r = crearRutinaBarba(estado, { nombre, pasos: pasos.map((a) => ({ accion: a })), frecuencia });
    if (!aplicar(r)) return;
    setCreando(false); setNombre(''); setPasos([]); setFrecuencia('diaria');
  };

  const guardarRegistro = () => {
    const r = registrarBarba(estado, { rutinaId: registrando, como, aspectos, nota });
    if (!aplicar(r)) return;
    setRegistrando(null); setComo(null); setAspectos({}); setNota('');
  };

  const chip = (activo) => ({
    background: activo ? hexToRgba(accent, 0.12) : COLORS.surface2,
    border: `1px solid ${activo ? accent : COLORS.border}`,
  });

  /* ⚠️ Regla 4 — el `return` condicional, después de todos los hooks. */
  if (!panel.activo) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-1">
          {onCerrar && (
            <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
              <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
            </button>
          )}
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>🪒 Mi rutina</p>
        </div>
        {/* ⚠️ Apagado no es roto: se dice qué pasa y dónde se enciende. */}
        <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
          Tienes el afeitado desactivado. Puedes volver a encenderlo en Gestionar apartados, y tus rutinas siguen guardadas.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-2 mb-1">
          {onCerrar && (
            <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
              <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
            </button>
          )}
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>🪒 Mi rutina</p>
        </div>

        {error && <p className="text-[10px] mb-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}

        {/* Apartado 6 — el checklist de hoy. */}
        {panel.hoy.length > 0 && (
          <div className="space-y-2 mb-3">
            {panel.hoy.map((lista) => (
              <div key={lista.id} className="rounded-2xl p-2.5"
                style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[11px] font-semibold flex-1" style={{ color: COLORS.text }}>{lista.nombre}</p>
                  {/* ⚠️ "Pendiente", nunca "has fallado". El texto es del motor. */}
                  {/* ⚠️ `TEXTOS_ESTADO_DIA` son TEXTOS, no objetos: leer `.nombre`
                      dejaba el estado del día en blanco. Lo cazó el navegador. */}
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                    {TEXTOS_DIA_BARBA[lista.estado] || ''}
                  </span>
                </div>
                {lista.pasos.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 py-0.5">
                    <button
                      onClick={() => onCambiar?.(marcarPasoBarba(estado, lista.id, p.id))}
                      className="text-[13px] leading-none"
                      aria-label={`Marcar ${p.etiqueta}`}
                      aria-pressed={p.hecho}
                    >
                      {p.hecho ? '☑️' : '☐'}
                    </button>
                    <span className="text-[11px] flex-1"
                      style={{ color: p.omitido ? COLORS.textMuted : COLORS.text }}>
                      {p.icono} {p.etiqueta}
                      {p.producto ? ` · ${p.producto}` : ''}
                    </span>
                    {/* Apartado 7 — omitir, sin penalización. */}
                    <button
                      onClick={() => onCambiar?.(omitirPasoBarba(estado, lista.id, p.id))}
                      className="text-[10px] font-semibold"
                      style={{ color: p.omitido ? accent : COLORS.textMuted }}
                    >
                      {p.omitido ? 'Omitido hoy' : 'Omitir hoy'}
                    </button>
                  </div>
                ))}
                <button onClick={() => onCambiar?.(marcarRutinaBarbaEntera(estado, lista.id))}
                  className="text-[10px] font-semibold mt-1" style={{ color: accent }}>
                  Marcarlo todo
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Apartado 1 — las plantillas, que se ofrecen. */}
        {panel.plantillas.length > 0 && (
          <div className="space-y-1 mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
              Si quieres, empieza por una de estas
            </p>
            {panel.plantillas.map((p) => (
              <div key={p.id} className="rounded-2xl p-2.5"
                style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
                <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>{p.icono} {p.nombre}</p>
                <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  {p.pasosVisibles.map((x) => x.nombre).join(' · ')} · {p.frecuenciaNombre}
                </p>
                {/* ⚠️ Con `confirmado`: verla no la crea. */}
                <button
                  onClick={() => aplicar(usarPlantillaBarba(estado, p.id, { confirmado: true }))}
                  className="text-[10px] font-semibold mt-1" style={{ color: accent }}
                >
                  {p.accion}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Apartado 4 — sus rutinas, cada una como una tarjeta sencilla. */}
        <div className="space-y-1 mb-3">
          {panel.rutinas.map((r) => (
            <div key={r.id} className="rounded-2xl p-2.5"
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold truncate" style={{ color: COLORS.text }}>{r.nombre}</span>
                  <span className="block text-[10px]" style={{ color: COLORS.textMuted }}>
                    {r.pasos.length} {r.pasos.length === 1 ? 'paso' : 'pasos'} · {frecuenciaBarba(r.frecuencia)?.nombre || ''}
                  </span>
                </span>
                {/* Apartado 16 — favoritos globales. */}
                <button onClick={() => aplicar(alternarFavoritaBarba(estado, r.id))}
                  className="text-[11px]" aria-label={`Favorita ${r.nombre}`}>
                  {r.favorita ? '❤️' : '🤍'}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {/* Apartado 8 — el recordatorio, que enciende él. */}
                <button onClick={() => aplicar(alternarRecordatorioBarba(estado, r.id))}
                  className="text-[10px] font-semibold"
                  style={{ color: r.recordatorio ? accent : COLORS.textMuted }}>
                  {r.recordatorio ? '🔔 Con recordatorio' : 'Recordármelo'}
                </button>
                {panel.seguimiento && (
                  <button onClick={() => setRegistrando(r.id)} className="text-[10px] font-semibold" style={{ color: accent }}>
                    ¿Cómo ha ido?
                  </button>
                )}
                {/* ⚠️ Apartado 19 — antes de borrar, se dice qué se lleva. */}
                <button onClick={() => setConfirmar(impactoEliminarRutinaBarba(estado, r.id))}
                  className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>
                  Eliminar
                </button>
              </div>
              {confirmar && confirmar.nombre === r.nombre && (
                <div className="mt-1.5">
                  <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{confirmar.texto}</p>
                  <div className="flex gap-2 mt-1">
                    {/* ⚠️ Apartado 19 — por la papelera GLOBAL, para que se pueda
                        recuperar. Si la pantalla no está enganchada a ella, se
                        borra sin más: nunca se deja el botón sin hacer nada. */}
                    <button
                      onClick={() => {
                        if (onEliminarRutina) onEliminarRutina(r.id);
                        else aplicar(eliminarRutinaBarba(estado, r.id));
                        setConfirmar(null);
                      }}
                      className="text-[10px] font-semibold" style={{ color: accent }}>{confirmar.confirmar}</button>
                    <button onClick={() => setConfirmar(null)}
                      className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>{confirmar.cancelar}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {panel.rutinas.length === 0 && !creando && (
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>Crea tu primera rutina cuando quieras.</p>
          )}
        </div>

        {/* Apartado 5 — rutina personalizada. */}
        {creando ? (
          <div className="space-y-2">
            <TextInput value={nombre} onChange={(ev) => setNombre(ev.target.value)}
              placeholder="Nombre de la rutina" aria-label="Nombre de la rutina" />
            <p className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>Pasos</p>
            <div className="flex flex-wrap gap-1.5">
              {PASOS_BARBA.map((p) => (
                <button key={p.id}
                  onClick={() => setPasos(pasos.includes(p.id) ? pasos.filter((x) => x !== p.id) : [...pasos, p.id])}
                  className="rounded-full px-2.5 py-1" style={chip(pasos.includes(p.id))}
                  aria-pressed={pasos.includes(p.id)}>
                  <span className="text-[11px] font-semibold"
                    style={{ color: pasos.includes(p.id) ? COLORS.text : COLORS.textMuted }}>
                    {p.icono} {p.nombre}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>Cada cuánto</p>
            <div className="flex flex-wrap gap-1.5">
              {FRECUENCIAS_BARBA.map((f) => (
                <button key={f.id} onClick={() => setFrecuencia(f.id)}
                  className="rounded-full px-2.5 py-1" style={chip(frecuencia === f.id)}
                  aria-pressed={frecuencia === f.id}>
                  <span className="text-[11px] font-semibold"
                    style={{ color: frecuencia === f.id ? COLORS.text : COLORS.textMuted }}>{f.nombre}</span>
                </button>
              ))}
            </div>
            <PrimaryButton accent={accent} onClick={crear}>Guardar rutina</PrimaryButton>
            <button onClick={() => { setCreando(false); setError(null); }}
              className="text-[11px] font-semibold mx-auto block" style={{ color: COLORS.textMuted }}>Cancelar</button>
          </div>
        ) : (
          <PrimaryButton accent={accent} icon={Plus} onClick={() => setCreando(true)}>Crear rutina</PrimaryButton>
        )}
      </Card>

      {/* Apartados 9, 10 y 11 — registrar cómo ha ido. Todo opcional. */}
      {registrando && (
        <Card>
          <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>¿Cómo ha ido?</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ESCALA_BARBA.map((x) => (
              <button key={x.id} onClick={() => setComo(como === x.id ? null : x.id)}
                className="rounded-full px-2.5 py-1" style={chip(como === x.id)} aria-pressed={como === x.id}>
                <span className="text-[11px] font-semibold" style={{ color: como === x.id ? COLORS.text : COLORS.textMuted }}>
                  {x.icono} {x.nombre}
                </span>
              </button>
            ))}
          </div>
          {ASPECTOS_BARBA.map((a) => (
            <div key={a.id} className="flex items-center gap-1 mb-1">
              <span className="text-[10px] flex-1" style={{ color: COLORS.textMuted }}>{a.icono} {a.nombre}</span>
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v}
                  onClick={() => setAspectos({ ...aspectos, [a.id]: aspectos[a.id] === v ? undefined : v })}
                  className="text-[11px]" aria-label={`${a.nombre} ${v}`}>
                  {aspectos[a.id] >= v ? '⭐' : '☆'}
                </button>
              ))}
            </div>
          ))}
          <TextInput value={nota} onChange={(ev) => setNota(ev.target.value)}
            placeholder="Una nota, si quieres" aria-label="Nota" />
          <div className="mt-2">
            <PrimaryButton accent={accent} onClick={guardarRegistro}>Guardar</PrimaryButton>
          </div>
          <button onClick={() => { setRegistrando(null); setError(null); }}
            className="text-[11px] font-semibold mx-auto block mt-2" style={{ color: COLORS.textMuted }}>Cancelar</button>
        </Card>
      )}

      {/* Apartado 15 — sugerencias, que no hacen nada solas. */}
      {panel.sugerencias.length > 0 && (
        <Card>
          <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>💡 Sugerencias</p>
          {panel.sugerencias.map((s) => (
            <div key={s.id} className="rounded-2xl p-2.5 mb-1"
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <p className="text-[11px]" style={{ color: COLORS.text }}>{s.texto}</p>
              {s.id === 'guardar_habitual' && s.rutina && (
                <button onClick={() => aplicar(alternarFavoritaBarba(estado, s.rutina.id))}
                  className="text-[10px] font-semibold mt-1" style={{ color: accent }}>{s.accion}</button>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Apartado 12 — el historial, sencillo. */}
      {panel.historial.length > 0 && (
        <Card>
          <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>📋 Historial</p>
          {panel.historial.map((h) => (
            <div key={h.id} className="flex items-start gap-2 py-1">
              <span className="min-w-0 flex-1">
                <span className="block text-[11px]" style={{ color: COLORS.text }}>
                  {h.fecha.slice(8, 10)}/{h.fecha.slice(5, 7)} — {h.que || 'Registro'}
                  {h.como ? ` ${h.como.icono}` : ''}
                </span>
                {/* ⚠️ Sin valoraciones NO hay estrella: no se pinta un 0. */}
                {h.estrella !== null && (
                  <span className="block text-[10px]" style={{ color: COLORS.textMuted }}>⭐ {h.estrella}/5</span>
                )}
                {h.nota && <span className="block text-[10px]" style={{ color: COLORS.textMuted }}>📝 {h.nota}</span>}
              </span>
              {onEliminarRegistro && (
                <button onClick={() => onEliminarRegistro(h.id)} aria-label={`Eliminar registro del ${h.fecha}`}>
                  <X size={13} style={{ color: COLORS.textMuted }} />
                </button>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/** Apartado 16 — el panel, con sus plaquitas y su gestión de apartados. */
export function PanelBarba({ estado, accent, datosGlobales = {}, onCambiar, onCerrar, onPerfil, onPartes, onEliminarRegistroBarba, onEliminarRutinaBarba }) {
  const [zona, setZona] = useState(null);
  const panel = useMemo(() => panelBarba(estado, datosGlobales), [estado, datosGlobales]);
  const res = useMemo(() => resumenBarba(estado, datosGlobales), [estado, datosGlobales]);
  const rut = useMemo(() => resumenRutinasBarba(estado), [estado]);

  /* ⚠️ Regla 4 — los `return` condicionales, después de los hooks. */
  if (zona === 'rutina') {
    return (
      <RutinasBarbaEH
        estado={estado} accent={accent} onCambiar={onCambiar} onCerrar={() => setZona(null)}
        onEliminarRegistro={onEliminarRegistroBarba} onEliminarRutina={onEliminarRutinaBarba}
      />
    );
  }
  if (zona === 'productos') {
    return (
      <ProductosBarbaEH
        estado={estado} accent={accent} onCambiar={onCambiar} onCerrar={() => setZona(null)}
      />
    );
  }

  const sub = {
    perfil: res.sinEmpezar ? 'Sin configurar' : `${res.contestadas} de ${res.total}`,
    productos: res.productos === 0 ? 'Marca los tuyos' : `${res.productos} marcados`,
    /* ⚠️ F21 — derivado, como todo: ni un contador guardado. */
    rutina: rut.rutinas === 0
      ? 'Crea la primera'
      : `${rut.rutinas} ${rut.rutinas === 1 ? 'rutina' : 'rutinas'}`
        + (rut.hoy > 0 ? ` · ${rut.hechasHoy}/${rut.hoy} hoy` : ''),
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
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_BARBA.titulo}</p>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {PLAQUITAS_BARBA
            .filter((p) => p.id !== 'productos' || parteActivaBarba(estado, 'productos'))
            /* ⚠️ F21 — la rutina tiene su propio interruptor (apartado 16), y
               vale para las tres cosas: barba, afeitado y perfilado. */
            .filter((p) => p.id !== 'rutina' || parteActivaBarba(estado, 'rutinas'))
            .filter((p) => p.id !== 'seguimiento' || parteActivaBarba(estado, 'seguimiento'))
            .map((p) => (
              <Plaquita
                key={p.id} accent={accent}
                modulo={{ nombre: p.nombre, icono: p.icono, sub: '' }}
                /* ⚠️ Regla 8 — la que no funciona dice en qué fase llega. */
                sub={p.listo ? (sub[p.id] || '') : `Llega en la fase ${p.fase}`}
                onAbrir={p.listo
                  ? (p.id === 'perfil' ? onPerfil
                    : (p.id === 'rutina' ? () => setZona('rutina')
                      : (p.id === 'productos' ? () => setZona('productos') : null)))
                  : null}
              />
            ))}
        </div>
      </Card>

      {/* Apartado 8 — cada cuánto, si nos lo ha dicho. */}
      {panel.frecuencia.hay && (
        <Card>
          <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>🪒 Cada cuánto</p>
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{panel.frecuencia.texto}</p>
        </Card>
      )}

      {/* Apartado 16 — ⚙️ Gestionar apartados, sin salir de aquí. */}
      <Card>
        <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>⚙️ Gestionar apartados</p>
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>
          Puedes quitar lo que no uses. Lo que hayas configurado se queda guardado.
        </p>
        {PARTES_BARBA.map((p) => (
          <div key={p.id} className="rounded-2xl p-2.5 flex items-center gap-2 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <span className="text-sm leading-none" aria-hidden="true">{p.icono}</span>
            <span className="text-[11px] font-semibold flex-1" style={{ color: COLORS.text }}>{p.nombre}</span>
            <Switch checked={parteActivaBarba(estado, p.id)} onChange={() => onCambiar?.(alternarParteBarba(estado, p.id))}
              accent={accent} label={p.nombre} />
          </div>
        ))}
        {onPartes && (
          <button onClick={onPartes} className="text-[11px] font-semibold mt-1" style={{ color: accent }}>
            Volver a elegir qué gestionas
          </button>
        )}
      </Card>
    </div>
  );
}

/** Apartado 1 — la entrada, con sus dos botones literales. */
export function BarbaEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar, onEliminarRegistroBarba, onEliminarRutinaBarba }) {
  const [pantalla, setPantalla] = useState(null);   // null | 'partes' | 'perfil'
  const entrada = useMemo(() => estadoDeEntradaBarba(estado, datosGlobales), [estado, datosGlobales]);
  /* ⚠️ Regla 4 y el fallo real de F3: se calcula UNA vez. Si se recalculara,
     pulsar "Sí, configurarlo" cambiaría el estado y la pantalla saltaría sola. */
  const [yaEntro] = useState(() => ['eligiendo', 'a_medias', 'configurado'].includes(entrada));

  /* ⚠️ Regla 4 — los `return` condicionales, todos después de los hooks. */
  if (pantalla === 'partes') {
    return (
      <ElegirPartesBarba
        estado={estado} accent={accent} onCambiar={onCambiar} onCerrar={() => setPantalla(null)}
      />
    );
  }
  if (pantalla === 'perfil') {
    return (
      <PerfilBarbaEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setPantalla(null)}
      />
    );
  }
  if (yaEntro || ['eligiendo', 'a_medias', 'configurado'].includes(entrada)) {
    return (
      <PanelBarba
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={onCerrar}
        onPerfil={() => setPantalla('perfil')}
        onPartes={() => setPantalla('partes')}
        onEliminarRegistroBarba={onEliminarRegistroBarba}
        onEliminarRutinaBarba={onEliminarRutinaBarba}
      />
    );
  }

  return (
    <Card className="text-center">
      {onCerrar && (
        <button onClick={onCerrar} className="p-1 -ml-1 float-left" aria-label="Volver">
          <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
        </button>
      )}
      <p className="text-2xl leading-none mb-2" aria-hidden="true">🧔</p>
      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_BARBA.titulo}</p>
      <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>{TEXTOS_BARBA.pregunta}</p>
      <PrimaryButton
        accent={accent}
        onClick={() => { onCambiar?.(configurarBarba(estado).estado); setPantalla('partes'); }}
      >
        {TEXTOS_BARBA.configurar}
      </PrimaryButton>
      {/* ⚠️ "Ahora no" oculta el apartado, pero no borra nada. */}
      <button
        onClick={() => onCambiar?.(decirAhoraNoBarba(estado).estado)}
        className="text-[11px] font-semibold mt-2"
        style={{ color: COLORS.textMuted }}
      >
        {TEXTOS_BARBA.ahoraNo}
      </button>
      {entrada === 'ahora_no' && (
        <p className="text-[10px] mt-2" style={{ color: COLORS.textMuted }}>{TEXTOS_BARBA.oculto}</p>
      )}
    </Card>
  );
}

/* ===========================================================================
   SONRISA — HIGIENE BUCAL (F23)
   ===========================================================================
   *"Pequeño, opcional, configurable y sin saturar."*

   ⚠️ **La racha solo se pinta si él la tiene** (apartado 10). Si no hay una
   racha suya de esto, `panel.racha` es `null` y aquí no se dibuja nada — ni un
   "créala", que sería empujarle a algo que no ha pedido.

   ⚠️ Y **nada se calcula aquí**: la cuenta de la semana la deriva
   `estaSemanaSonrisa`, la fecha del cepillo la propone `sugerirCambioCepillo` y
   los consejos son fijos. */
export function SonrisaEH({ estado, accent, rachas = null, onCambiar, onCerrar, onEliminar }) {
  /* ⚠️ Regla 4 — todos los hooks antes de cualquier `return`. */
  const [zona, setZona] = useState(null);
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [pasos, setPasos] = useState([]);
  const [momento, setMomento] = useState('cualquiera');
  const [prodNombre, setProdNombre] = useState('');
  const [prodTipo, setProdTipo] = useState('cepillo');
  const [fechaRev, setFechaRev] = useState('');
  const [notaRev, setNotaRev] = useState('');
  const [cambio, setCambio] = useState('');
  const [nota, setNota] = useState('');
  const [confirmar, setConfirmar] = useState(null);
  const [error, setError] = useState(null);

  const panel = useMemo(() => panelSonrisa(estado, { rachas }), [estado, rachas]);
  const entrada = panel.estado;
  const [yaEntro] = useState(() => entrada === 'configurado');

  const aplicar = (r) => {
    if (r.error) { setError(r.error); return false; }
    setError(null);
    onCambiar?.(r.estado);
    return true;
  };

  const chip = (activo) => ({
    background: activo ? hexToRgba(accent, 0.12) : COLORS.surface2,
    border: `1px solid ${activo ? accent : COLORS.border}`,
  });

  const cabecera = (titulo, volver) => (
    <div className="flex items-center gap-2 mb-1">
      <button onClick={volver} className="p-1 -ml-1" aria-label="Volver">
        <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
      </button>
      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{titulo}</p>
    </div>
  );

  /* ⚠️ Regla 4 — los `return` condicionales, todos después de los hooks. */
  if (!yaEntro && entrada !== 'configurado') {
    return (
      <Card className="text-center">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1 float-left" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-2xl leading-none mb-2" aria-hidden="true">😁</p>
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_SONRISA.titulo}</p>
        <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>{TEXTOS_SONRISA.sub}</p>
        <PrimaryButton accent={accent} onClick={() => aplicar(configurarSonrisa(estado))}>
          {TEXTOS_SONRISA.configurar}
        </PrimaryButton>
        <button onClick={() => aplicar(decirAhoraNoSonrisa(estado))}
          className="text-[11px] font-semibold mt-2" style={{ color: COLORS.textMuted }}>
          {TEXTOS_SONRISA.ahoraNo}
        </button>
        {entrada === 'ahora_no' && (
          <p className="text-[10px] mt-2" style={{ color: COLORS.textMuted }}>{TEXTOS_SONRISA.oculto}</p>
        )}
      </Card>
    );
  }

  /* ── 🪥 Higiene diaria ─────────────────────────────────────────────── */
  if (zona === 'higiene') {
    return (
      <Card>
        {cabecera('🪥 Higiene diaria', () => setZona(null))}
        {error && <p className="text-[10px] mb-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}

        {panel.hoy.map((lista) => (
          <div key={lista.id} className="rounded-2xl p-2.5 mb-2"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[11px] font-semibold flex-1" style={{ color: COLORS.text }}>{lista.nombre}</p>
              {/* ⚠️ "Pendiente", nunca "has fallado". El texto es del motor. */}
              <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                {TEXTOS_DIA_SONRISA[lista.estado] || ''}
              </span>
            </div>
            {lista.pasos.map((p) => (
              <div key={p.id} className="flex items-center gap-2 py-0.5">
                <button onClick={() => onCambiar?.(marcarPasoSonrisa(estado, lista.id, p.id))}
                  className="text-[13px] leading-none" aria-label={`Marcar ${p.etiqueta}`} aria-pressed={p.hecho}>
                  {p.hecho ? '☑️' : '☐'}
                </button>
                <span className="text-[11px] flex-1"
                  style={{ color: p.omitido ? COLORS.textMuted : COLORS.text }}>
                  {p.icono} {p.etiqueta}{p.producto ? ` · ${p.producto}` : ''}
                </span>
                <button onClick={() => onCambiar?.(omitirPasoSonrisa(estado, lista.id, p.id))}
                  className="text-[10px] font-semibold"
                  style={{ color: p.omitido ? accent : COLORS.textMuted }}>
                  {p.omitido ? 'Omitido hoy' : 'Omitir hoy'}
                </button>
              </div>
            ))}
          </div>
        ))}

        {/* Apartado 2 — la plantilla, que se ofrece. */}
        {panel.plantilla.hay && (
          <div className="rounded-2xl p-2.5 mb-2"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>
              {panel.plantilla.icono} {panel.plantilla.nombre}
            </p>
            {panel.plantilla.rutinasVisibles.map((r) => (
              <p key={r.nombre} className="text-[10px]" style={{ color: COLORS.textMuted }}>
                {r.nombre}: {r.pasosVisibles.map((x) => x.nombre).join(' · ')}
              </p>
            ))}
            <button onClick={() => aplicar(usarPlantillaSonrisa(estado, { confirmado: true }))}
              className="text-[10px] font-semibold mt-1" style={{ color: accent }}>
              {panel.plantilla.accion}
            </button>
          </div>
        )}

        {panel.rutinas.map((r) => (
          <div key={r.id} className="rounded-2xl p-2.5 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>
              {momentoSonrisa(r.momento)?.icono} {r.nombre}
            </p>
            <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
              {r.pasos.length} {r.pasos.length === 1 ? 'paso' : 'pasos'}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <button onClick={() => aplicar(alternarRecordatorioSonrisa(estado, r.id))}
                className="text-[10px] font-semibold"
                style={{ color: r.recordatorio ? accent : COLORS.textMuted }}>
                {r.recordatorio ? '🔔 Con recordatorio' : 'Recordármela'}
              </button>
              <button onClick={() => setConfirmar(impactoEliminarRutinaSonrisa(estado, r.id))}
                className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>Eliminar</button>
            </div>
            {confirmar && confirmar.nombre === r.nombre && (
              <div className="mt-1.5">
                <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{confirmar.texto}</p>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => { onEliminar?.('rutinas', r.id); setConfirmar(null); }}
                    className="text-[10px] font-semibold" style={{ color: accent }}>{confirmar.confirmar}</button>
                  <button onClick={() => setConfirmar(null)}
                    className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>{confirmar.cancelar}</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {creando ? (
          <div className="space-y-2 mt-2">
            <TextInput value={nombre} onChange={(ev) => setNombre(ev.target.value)}
              placeholder="Nombre de la rutina" aria-label="Nombre de la rutina" />
            <div className="flex flex-wrap gap-1.5">
              {PASOS_SONRISA.map((p) => (
                <button key={p.id}
                  onClick={() => setPasos(pasos.includes(p.id) ? pasos.filter((x) => x !== p.id) : [...pasos, p.id])}
                  className="rounded-full px-2.5 py-1" style={chip(pasos.includes(p.id))}
                  aria-pressed={pasos.includes(p.id)}>
                  <span className="text-[11px] font-semibold"
                    style={{ color: pasos.includes(p.id) ? COLORS.text : COLORS.textMuted }}>
                    {p.icono} {p.nombre}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MOMENTOS_SONRISA.map((m) => (
                <button key={m.id} onClick={() => setMomento(m.id)}
                  className="rounded-full px-2.5 py-1" style={chip(momento === m.id)} aria-pressed={momento === m.id}>
                  <span className="text-[11px] font-semibold"
                    style={{ color: momento === m.id ? COLORS.text : COLORS.textMuted }}>{m.icono} {m.nombre}</span>
                </button>
              ))}
            </div>
            <PrimaryButton accent={accent} onClick={() => {
              if (!aplicar(crearRutinaSonrisa(estado, { nombre, momento, frecuencia: 'diario', pasos: pasos.map((a) => ({ accion: a })) }))) return;
              setCreando(false); setNombre(''); setPasos([]); setMomento('cualquiera');
            }}>Guardar rutina</PrimaryButton>
            <button onClick={() => { setCreando(false); setError(null); }}
              className="text-[11px] font-semibold mx-auto block" style={{ color: COLORS.textMuted }}>Cancelar</button>
          </div>
        ) : (
          <div className="mt-2">
            <PrimaryButton accent={accent} icon={Plus} onClick={() => setCreando(true)}>Crear rutina</PrimaryButton>
          </div>
        )}
      </Card>
    );
  }

  /* ── 🦷 Cuidado dental: cepillo y productos ────────────────────────── */
  if (zona === 'dental') {
    return (
      <Card>
        {cabecera('🦷 Cuidado dental', () => setZona(null))}
        {error && <p className="text-[10px] mb-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}

        <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: COLORS.textMuted }}>
          🪥 Cambio de cepillo
        </p>
        <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
          {panel.cepillo.ultimoCambio ? `Último cambio: ${panel.cepillo.ultimoCambio}` : 'Todavía no nos lo has dicho.'}
        </p>
        <p className="text-[11px] mb-1" style={{ color: COLORS.textMuted }}>{panel.cepillo.sugerencia.texto}</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {FRECUENCIAS_CEPILLO.filter((f) => f.dias).map((f) => (
            <button key={f.id} onClick={() => aplicar(ponerFrecuenciaCepillo(estado, f.id))}
              className="rounded-full px-2.5 py-1" style={chip(panel.cepillo.frecuencia === f.id)}
              aria-pressed={panel.cepillo.frecuencia === f.id}>
              <span className="text-[10px] font-semibold"
                style={{ color: panel.cepillo.frecuencia === f.id ? COLORS.text : COLORS.textMuted }}>{f.nombre}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 mb-1">
          <TextInput value={cambio} onChange={(ev) => setCambio(ev.target.value)}
            placeholder="AAAA-MM-DD" aria-label="Fecha del último cambio" />
          <button onClick={() => { aplicar(registrarCambioCepillo(estado, { fecha: cambio })); setCambio(''); }}
            className="rounded-2xl px-3" style={{ background: hexToRgba(accent, 0.12), border: `1px solid ${accent}` }}>
            <span className="text-[11px] font-semibold" style={{ color: accent }}>Lo cambié</span>
          </button>
        </div>
        {/* ⚠️ Apartado 6 — la fecha se GUARDA si él quiere. Nunca sola. */}
        {panel.cepillo.sugerencia.hay && !panel.cepillo.proximo && (
          <button onClick={() => aplicar(planificarCambioCepillo(estado, panel.cepillo.sugerencia.fecha, { confirmado: true }))}
            className="text-[10px] font-semibold" style={{ color: accent }}>
            {panel.cepillo.sugerencia.accion}
          </button>
        )}
        {panel.cepillo.proximo && (
          <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
            📅 Guardado para el {panel.cepillo.proximo} ·{' '}
            <button onClick={() => aplicar(quitarPlanCepillo(estado))} className="font-semibold" style={{ color: accent }}>
              quitarlo
            </button>
          </p>
        )}

        <p className="text-[10px] font-semibold uppercase tracking-wide mt-3 mb-1" style={{ color: COLORS.textMuted }}>
          🛒 Mis productos
        </p>
        {panel.productos.map((p) => (
          <div key={p.id} className="rounded-2xl p-2 flex items-center gap-2 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] truncate" style={{ color: COLORS.text }}>{p.nombreVisible}</span>
              <span className="block text-[10px]" style={{ color: COLORS.textMuted }}>
                {p.etiqueta}
                {/* ⚠️ Si lo borró en su módulo, se dice, en vez de fingir que sigue. */}
                {p.seFue ? ' · ya no está en tu catálogo' : ''}
              </span>
            </span>
            <button onClick={() => aplicar(quitarProductoSonrisa(estado, p.id))} aria-label={`Quitar ${p.nombreVisible}`}>
              <X size={13} style={{ color: COLORS.textMuted }} />
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-1.5 my-1.5">
          {TIPOS_PRODUCTO_SONRISA.map((t) => (
            <button key={t.id} onClick={() => setProdTipo(t.id)}
              className="rounded-full px-2.5 py-1" style={chip(prodTipo === t.id)} aria-pressed={prodTipo === t.id}>
              <span className="text-[10px] font-semibold"
                style={{ color: prodTipo === t.id ? COLORS.text : COLORS.textMuted }}>{t.icono} {t.nombre}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <TextInput value={prodNombre} onChange={(ev) => setProdNombre(ev.target.value)}
            placeholder="Nombre del producto" aria-label="Nombre del producto" />
          <button onClick={() => { aplicar(anadirProductoSonrisa(estado, { tipo: prodTipo, nombre: prodNombre })); setProdNombre(''); }}
            disabled={!prodNombre.trim()}
            className="rounded-2xl px-3 disabled:opacity-40"
            style={{ background: hexToRgba(accent, 0.12), border: `1px solid ${accent}` }}>
            <span className="text-[11px] font-semibold" style={{ color: accent }}>Añadir</span>
          </button>
        </div>

        {/* Apartado 12 — sugerencias, que no hacen nada solas. */}
        {panel.sugerencias.length > 0 && (
          <div className="mt-3">
            {panel.sugerencias.map((s) => (
              <p key={s.id} className="text-[10px] mb-1" style={{ color: COLORS.textMuted }}>💡 {s.texto}</p>
            ))}
          </div>
        )}
      </Card>
    );
  }

  /* ── 📅 Revisiones ─────────────────────────────────────────────────── */
  if (zona === 'revisiones') {
    return (
      <Card>
        {cabecera('📅 Revisiones', () => setZona(null))}
        {error && <p className="text-[10px] mb-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}
        {panel.revisiones.map((r) => (
          <div key={r.id} className="rounded-2xl p-2.5 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>
              🦷 {r.fecha}{r.hecha ? ' · hecha' : ''}
            </p>
            {r.nota && <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{r.nota}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <button onClick={() => aplicar(editarRevision(estado, r.id, { aviso: !r.aviso }))}
                className="text-[10px] font-semibold" style={{ color: r.aviso ? accent : COLORS.textMuted }}>
                {r.aviso ? `🔔 ${avisoRevision(r.avisoTipo)?.nombre || ''}` : 'Recordármela'}
              </button>
              {!r.hecha && (
                <button onClick={() => aplicar(editarRevision(estado, r.id, { hecha: true }))}
                  className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>Ya fui</button>
              )}
              <button onClick={() => onEliminar?.('revisiones', r.id)}
                className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>Eliminar</button>
            </div>
          </div>
        ))}
        {panel.revisiones.length === 0 && (
          <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>
            Cuando tengas fecha, apúntala y la verás en tu calendario.
          </p>
        )}
        <div className="space-y-2 mt-2">
          <TextInput value={fechaRev} onChange={(ev) => setFechaRev(ev.target.value)}
            placeholder="AAAA-MM-DD" aria-label="Fecha de la revisión" />
          <TextInput value={notaRev} onChange={(ev) => setNotaRev(ev.target.value)}
            placeholder="Una nota, si quieres" aria-label="Nota de la revisión" />
          <PrimaryButton accent={accent} onClick={() => {
            if (!aplicar(crearRevision(estado, { fecha: fechaRev, nota: notaRev }))) return;
            setFechaRev(''); setNotaRev('');
          }}>Apuntar revisión</PrimaryButton>
        </div>
      </Card>
    );
  }

  /* ── 📈 Seguimiento ────────────────────────────────────────────────── */
  if (zona === 'seguimiento') {
    return (
      <Card>
        {cabecera('📈 Seguimiento', () => setZona(null))}
        {error && <p className="text-[10px] mb-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}
        {/* ⚠️ Derivado, y sin competición. */}
        {panel.semana && (
          <p className="text-[11px] mb-2" style={{ color: COLORS.text }}>{panel.semana.texto}</p>
        )}
        {panel.registros.map((r) => (
          <div key={r.id} className="flex items-start gap-2 py-1">
            <span className="min-w-0 flex-1">
              <span className="block text-[10px]" style={{ color: COLORS.textMuted }}>{r.fecha}</span>
              <span className="block text-[11px]" style={{ color: COLORS.text }}>📝 {r.nota}</span>
            </span>
            <button onClick={() => onEliminar?.('registros', r.id)} aria-label={`Eliminar registro del ${r.fecha}`}>
              <X size={13} style={{ color: COLORS.textMuted }} />
            </button>
          </div>
        ))}
        <div className="space-y-2 mt-2">
          <TextInput value={nota} onChange={(ev) => setNota(ev.target.value)}
            placeholder="¿Cómo lo llevas?" aria-label="Nota de seguimiento" />
          <PrimaryButton accent={accent} onClick={() => {
            if (!aplicar(registrarSonrisa(estado, { nota }))) return;
            setNota('');
          }}>Guardar</PrimaryButton>
        </div>
      </Card>
    );
  }

  /* ── El panel ──────────────────────────────────────────────────────── */
  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-2 mb-3">
          {onCerrar && (
            <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
              <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
            </button>
          )}
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_SONRISA.titulo}</p>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {panel.partes.filter((p) => p.activa).map((p) => (
            <Plaquita
              key={p.id} accent={accent}
              modulo={{ nombre: p.nombre, icono: p.icono, sub: '' }}
              sub={{
                higiene: panel.resumen.rutinas === 0 ? 'Crea la primera'
                  : `${panel.resumen.rutinas} ${panel.resumen.rutinas === 1 ? 'rutina' : 'rutinas'}`,
                dental: panel.resumen.productos === 0 ? 'Apunta lo que usas' : `${panel.resumen.productos} productos`,
                revisiones: panel.resumen.proximaRevision || 'Sin ninguna apuntada',
                seguimiento: panel.semana?.hechas ? `${panel.semana.hechas} esta semana` : 'Cuéntanos',
              }[p.id] || ''}
              onAbrir={() => setZona(p.id)}
            />
          ))}
        </div>
      </Card>

      {/* ⚠️ Apartado 10 — la racha, SOLO si él la tiene. Si no, no se pinta. */}
      {panel.racha && (
        <Card>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
            🏆 {panel.racha.racha.nombre}
          </p>
          <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
            {panel.racha.eventos.length} {panel.racha.eventos.length === 1 ? 'día' : 'días'} registrados
          </p>
        </Card>
      )}

      {/* Apartado 11 — consejos generales, iguales para todo el mundo. */}
      <Card>
        <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>💡 Consejos</p>
        {panel.consejos.map((c) => (
          <p key={c} className="text-[10px] mb-0.5" style={{ color: COLORS.textMuted }}>· {c}</p>
        ))}
      </Card>

      {/* Apartado 14 — cada plaquita, con su interruptor. */}
      <Card>
        <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>⚙️ Gestionar apartados</p>
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>
          Quita lo que no uses. Lo que hayas guardado se queda.
        </p>
        {panel.partes.map((p) => (
          <div key={p.id} className="rounded-2xl p-2.5 flex items-center gap-2 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <span className="text-sm leading-none" aria-hidden="true">{p.icono}</span>
            <span className="text-[11px] font-semibold flex-1" style={{ color: COLORS.text }}>{p.nombre}</span>
            <Switch checked={p.activa} onChange={() => onCambiar?.(alternarParteSonrisa(estado, p.id))}
              accent={accent} label={p.nombre} />
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ===========================================================================
   PERFUMES Y FRAGANCIAS (F24)
   ===========================================================================
   *"La idea no es convertirlo en una tienda de perfumes."* Así que aquí no hay
   precios, ni tiendas, ni catálogo: solo lo que él tiene y lo que le gusta.

   ⚠️ **"Mi perfume actual" y "favorito" son dos botones distintos**, y ninguno
   se deduce del otro (apartado 12). */
export function PerfumesEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar, onEliminar }) {
  /* ⚠️ Regla 4 — todos los hooks antes de cualquier `return`. */
  const [zona, setZona] = useState(null);
  const [seccion, setSeccion] = useState(0);
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [probar, setProbar] = useState('');
  const [error, setError] = useState(null);

  const panel = useMemo(() => panelPerfumes(estado, datosGlobales), [estado, datosGlobales]);
  const [yaEntro] = useState(() => panel.estado === 'configurado');
  const secciones = panel.secciones;
  const actual = secciones[Math.min(seccion, Math.max(secciones.length - 1, 0))] || null;

  const aplicar = (r) => {
    if (r.error) { setError(r.error); return false; }
    setError(null);
    onCambiar?.(r.estado);
    return true;
  };

  const chip = (a) => ({
    background: a ? hexToRgba(accent, 0.12) : COLORS.surface2,
    border: `1px solid ${a ? accent : COLORS.border}`,
  });

  const cabecera = (titulo) => (
    <div className="flex items-center gap-2 mb-1">
      <button onClick={() => setZona(null)} className="p-1 -ml-1" aria-label="Volver">
        <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
      </button>
      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{titulo}</p>
    </div>
  );

  /* ⚠️ Regla 4 — los `return` condicionales, después de los hooks. */
  if (!yaEntro && panel.estado !== 'configurado') {
    return (
      <Card className="text-center">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1 float-left" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-2xl leading-none mb-2" aria-hidden="true">🌫️</p>
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_PERFUMES.titulo}</p>
        <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>{TEXTOS_PERFUMES.pregunta}</p>
        <PrimaryButton accent={accent} onClick={() => aplicar(configurarPerfumes(estado))}>
          {TEXTOS_PERFUMES.configurar}
        </PrimaryButton>
        <button onClick={() => aplicar(decirAhoraNoPerfumes(estado))}
          className="text-[11px] font-semibold mt-2" style={{ color: COLORS.textMuted }}>
          {TEXTOS_PERFUMES.ahoraNo}
        </button>
        {panel.estado === 'ahora_no' && (
          <p className="text-[10px] mt-2" style={{ color: COLORS.textMuted }}>{TEXTOS_PERFUMES.oculto}</p>
        )}
      </Card>
    );
  }

  /* ── 🌫️ Mi perfil ──────────────────────────────────────────────────── */
  if (zona === 'perfil') {
    return (
      <Card>
        {cabecera(TEXTOS_PERFUMES.editar)}
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>
          {panel.progreso.contestadas} de {panel.progreso.total} · todo es opcional
        </p>
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {secciones.map((s, i) => (
            <button key={s.id} onClick={() => setSeccion(i)}
              className="rounded-2xl px-2.5 py-1.5 flex-shrink-0"
              style={{
                background: actual?.id === s.id ? hexToRgba(accent, 0.14) : COLORS.surface2,
                border: `1px solid ${actual?.id === s.id ? accent : COLORS.border}`,
              }}>
              <span className="text-[10px] font-semibold" style={{ color: actual?.id === s.id ? accent : COLORS.text }}>
                {s.nombre} {s.contestadas}/{s.total}
              </span>
            </button>
          ))}
        </div>
        {actual && actual.preguntas.map((q) => (
          <div key={q.id} className="mb-3">
            <p className="text-[11px] font-semibold mb-0.5" style={{ color: COLORS.text }}>{q.titulo}</p>
            {q.ayuda && <p className="text-[10px] mb-1" style={{ color: COLORS.textMuted }}>{q.ayuda}</p>}
            <div className="flex flex-wrap gap-1">
              {q.opcionesVisibles.map((o) => {
                const puesto = q.valores.includes(o.id);
                return (
                  <button key={o.id} onClick={() => aplicar(contestarPerfume(estado, q.id, o.id))}
                    className="rounded-full px-2.5 py-1" style={chip(puesto)} aria-pressed={puesto}>
                    <span className="text-[10px] font-semibold" style={{ color: puesto ? accent : COLORS.text }}>
                      {o.nombre}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {error && <p className="text-[10px]" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}
      </Card>
    );
  }

  /* ── 🧴 Mi colección ───────────────────────────────────────────────── */
  if (zona === 'coleccion') {
    return (
      <Card>
        {cabecera('🧴 Mi colección')}
        {error && <p className="text-[10px] mb-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}
        {panel.perfumes.map((p) => (
          <div key={p.id} className="rounded-2xl p-2.5 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold truncate" style={{ color: COLORS.text }}>
                  {p.nombre}{panel.actual?.id === p.id ? ' · el que usas ahora' : ''}
                </span>
                <span className="block text-[10px] truncate" style={{ color: COLORS.textMuted }}>
                  {[p.marca, p.tipo.map((t) => aroma(t)?.nombre).filter(Boolean).join(', '),
                    p.ocasiones.map((o) => ocasion(o)?.nombre).filter(Boolean).join(', ')]
                    .filter(Boolean).join(' · ') || 'Sin más datos'}
                </span>
              </span>
              <button onClick={() => aplicar(alternarFavoritoPerfume(estado, p.id))}
                className="text-[11px]" aria-label={`Favorito ${p.nombre}`}>
                {p.favorito ? '❤️' : '🤍'}
              </button>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} onClick={() => aplicar(valorarPerfume(estado, p.id, p.valoracion === v ? null : v))}
                  className="text-[11px]" aria-label={`Valorar ${p.nombre} con ${v}`}>
                  {p.valoracion !== null && v <= p.valoracion ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            {p.nota && <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>📝 {p.nota}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {/* ⚠️ Apartado 12 — "el que uso ahora" es OTRA cosa que "favorito". */}
              <button onClick={() => aplicar(ponerPerfumeActual(estado, panel.actual?.id === p.id ? null : p.id))}
                className="text-[10px] font-semibold"
                style={{ color: panel.actual?.id === p.id ? accent : COLORS.textMuted }}>
                {panel.actual?.id === p.id ? '✓ Es el que uso ahora' : 'Es el que uso ahora'}
              </button>
              <button onClick={() => onEliminar?.('perfumes', p.id)}
                className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>Eliminar</button>
            </div>
            {/* Apartado 13 — un perfume para cada ocasión, opcional. */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {panel.ocasiones.map((o) => {
                const puesta = panel.porOcasion.some((x) => x.ocasion.id === o.id && x.perfume.id === p.id);
                return (
                  <button key={o.id}
                    onClick={() => aplicar(asignarPerfumeAOcasion(estado, o.id, puesta ? null : p.id))}
                    className="rounded-full px-2 py-0.5" style={chip(puesta)} aria-pressed={puesta}>
                    <span className="text-[10px]" style={{ color: puesta ? accent : COLORS.textMuted }}>
                      {o.icono} {o.nombre}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {panel.perfumes.length === 0 && (
          <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>Añade los que tengas, cuando quieras.</p>
        )}
        <div className="space-y-2 mt-2">
          <TextInput value={nombre} onChange={(ev) => setNombre(ev.target.value)}
            placeholder="Nombre del perfume" aria-label="Nombre del perfume" />
          <TextInput value={marca} onChange={(ev) => setMarca(ev.target.value)}
            placeholder="Marca (opcional)" aria-label="Marca" />
          <PrimaryButton accent={accent} onClick={() => {
            if (!aplicar(anadirPerfume(estado, { nombre, marca }))) return;
            setNombre(''); setMarca('');
          }}>Añadir perfume</PrimaryButton>
        </div>
      </Card>
    );
  }

  /* ── 🎯 Quiero probar ──────────────────────────────────────────────── */
  if (zona === 'probar') {
    return (
      <Card>
        {cabecera('🎯 Quiero probar')}
        {error && <p className="text-[10px] mb-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}
        {panel.porProbar.map((p) => (
          <div key={p.id} className="rounded-2xl p-2.5 flex items-center gap-2 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold truncate" style={{ color: COLORS.text }}>{p.nombre}</span>
              {p.marca && <span className="block text-[10px]" style={{ color: COLORS.textMuted }}>{p.marca}</span>}
            </span>
            {/* ⚠️ Lo probó: pasa a la colección y sale de aquí, de una vez. */}
            <button onClick={() => aplicar(moverAColeccion(estado, p.id))}
              className="text-[10px] font-semibold" style={{ color: accent }}>Ya lo tengo</button>
            <button onClick={() => aplicar(quitarPorProbar(estado, p.id))} aria-label={`Quitar ${p.nombre}`}>
              <X size={13} style={{ color: COLORS.textMuted }} />
            </button>
          </div>
        ))}
        {panel.porProbar.length === 0 && (
          <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>
            Apunta aquí los que te llamen la atención.
          </p>
        )}
        <div className="flex gap-1.5 mt-2">
          <TextInput value={probar} onChange={(ev) => setProbar(ev.target.value)}
            placeholder="Nombre" aria-label="Perfume que quieres probar" />
          <button onClick={() => { aplicar(anadirPorProbar(estado, { nombre: probar })); setProbar(''); }}
            disabled={!probar.trim()}
            className="rounded-2xl px-3 disabled:opacity-40"
            style={{ background: hexToRgba(accent, 0.12), border: `1px solid ${accent}` }}>
            <span className="text-[11px] font-semibold" style={{ color: accent }}>Añadir</span>
          </button>
        </div>
      </Card>
    );
  }

  /* ── 💡 Recomendaciones (F25) ──────────────────────────────────────── */
  if (zona === 'recomendaciones') {
    return (
      <RecomendacionesPerfumesEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setZona(null)}
      />
    );
  }

  /* ── 📋 Historial ──────────────────────────────────────────────────── */
  if (zona === 'historial') {
    return (
      <Card>
        {cabecera('📋 Historial')}
        {error && <p className="text-[10px] mb-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}
        {/* ⚠️ *"Sin necesidad de hacerlo cada vez"*: ni racha ni hueco. */}
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>
          Apunta cuándo usas cada uno, si te apetece. No hace falta hacerlo siempre.
        </p>
        {panel.historial.map((u) => (
          <div key={u.id} className="flex items-start gap-2 py-1">
            <span className="min-w-0 flex-1">
              <span className="block text-[11px]" style={{ color: COLORS.text }}>
                {u.fecha} — {u.perfume?.nombre || 'Un perfume que ya no tienes'}
                {u.ocasionNombre ? ` · ${u.ocasionNombre}` : ''}
              </span>
              {u.valoracion !== null && (
                <span className="block text-[10px]" style={{ color: COLORS.textMuted }}>⭐ {u.valoracion}/5</span>
              )}
            </span>
            <button onClick={() => onEliminar?.('historial', u.id)} aria-label={`Eliminar el registro del ${u.fecha}`}>
              <X size={13} style={{ color: COLORS.textMuted }} />
            </button>
          </div>
        ))}
        {panel.perfumes.map((p) => (
          <button key={p.id} onClick={() => aplicar(registrarUso(estado, { perfumeId: p.id }))}
            className="text-[10px] font-semibold mr-2 mt-1" style={{ color: accent }}>
            + Hoy usé {p.nombre}
          </button>
        ))}
      </Card>
    );
  }

  /* ── El panel ──────────────────────────────────────────────────────── */
  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-2 mb-3">
          {onCerrar && (
            <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
              <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
            </button>
          )}
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_PERFUMES.titulo}</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {panel.plaquitas.map((p) => (
            <Plaquita
              key={p.id} accent={accent}
              modulo={{ nombre: p.nombre, icono: p.icono, sub: '' }}
              /* ⚠️ Regla 8 — la que no funciona dice en qué fase llega. */
              sub={p.listo ? ({
                perfil: panel.progreso.sinEmpezar ? 'Cuéntanos tus gustos'
                  : `${panel.progreso.contestadas} de ${panel.progreso.total}`,
                coleccion: panel.resumen.coleccion === 0 ? 'Añade los tuyos'
                  : `${panel.resumen.coleccion} ${panel.resumen.coleccion === 1 ? 'perfume' : 'perfumes'}`,
                probar: panel.resumen.porProbar === 0 ? 'Apunta los que te llamen' : `${panel.resumen.porProbar} apuntados`,
                historial: panel.resumen.usos === 0 ? 'Si te apetece' : `${panel.resumen.usos} registros`,
                recomendaciones: '¿Cuál me pongo?',
              }[p.id] || '') : `Llega en la fase ${p.fase}`}
              onAbrir={p.listo ? () => setZona(p.id) : null}
            />
          ))}
        </div>
      </Card>

      {/* Apartado 12 — el que usa ahora, que no es el favorito. */}
      {panel.actual && (
        <Card>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>🌫️ El que usas ahora</p>
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
            {panel.actual.nombre}{panel.actual.marca ? ` · ${panel.actual.marca}` : ''}
          </p>
        </Card>
      )}

      {/* Apartado 13 — el de cada ocasión, si ha asignado alguno. */}
      {panel.porOcasion.length > 0 && (
        <Card>
          <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Para cada ocasión</p>
          {panel.porOcasion.map((x) => (
            <p key={x.ocasion.id} className="text-[10px]" style={{ color: COLORS.textMuted }}>
              {x.ocasion.icono} {x.ocasion.nombre} → {x.perfume.nombre}
            </p>
          ))}
        </Card>
      )}

      {/* Apartado 18 — cada parte, con su interruptor. */}
      <Card>
        <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>⚙️ Gestionar apartados</p>
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>
          Quita lo que no uses. Los datos permanecen.
        </p>
        {panel.partes.map((p) => (
          <div key={p.id} className="rounded-2xl p-2.5 flex items-center gap-2 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <span className="text-sm leading-none" aria-hidden="true">{p.icono}</span>
            <span className="text-[11px] font-semibold flex-1" style={{ color: COLORS.text }}>{p.nombre}</span>
            <Switch checked={p.activa} onChange={() => onCambiar?.(alternarPartePerfumes(estado, p.id))}
              accent={accent} label={p.nombre} />
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ===========================================================================
   RECOMENDACIONES DE PERFUME (F25)
   ===========================================================================
   *"Qué perfume usar → cuándo → por qué."* Sin IA.

   ⚠️ **La rotación y las estadísticas devuelven `null` si están apagadas**, y
   aquí eso se pinta como lo que es: no se enseñan. Apagada y vacía son dos
   cosas distintas, y confundirlas sería enseñarle una lista de siete días en
   blanco de algo que no ha activado. */
export function RecomendacionesPerfumesEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar }) {
  /* ⚠️ Regla 4 — todos los hooks antes de cualquier `return`. */
  const [ocasionPedida, setOcasionPedida] = useState(null);
  const [epocaPedida, setEpocaPedida] = useState(null);
  const [saltar, setSaltar] = useState(0);
  const [comparar, setComparar] = useState([]);
  const [error, setError] = useState(null);

  const panel = useMemo(
    () => panelRecsPerfume(estado, { ocasion: ocasionPedida, epoca: epocaPedida, saltar, datosGlobales }),
    [estado, ocasionPedida, epocaPedida, saltar, datosGlobales],
  );
  const tabla = useMemo(() => compararPerfumes(estado, comparar), [estado, comparar]);
  const rec = panel.recomendacion;

  const aplicar = (r) => {
    if (r.error) { setError(r.error); return false; }
    setError(null);
    onCambiar?.(r.estado);
    return true;
  };

  const chip = (a) => ({
    background: a ? hexToRgba(accent, 0.12) : COLORS.surface2,
    border: `1px solid ${a ? accent : COLORS.border}`,
  });

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-2 mb-1">
          {onCerrar && (
            <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
              <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
            </button>
          )}
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>💡 ¿Cuál me pongo?</p>
        </div>
        {error && <p className="text-[10px] mb-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}

        {/* Apartado 5 — *"¿Para qué lo necesitas?"*. Se elige, no se deduce. */}
        <p className="text-[10px] font-semibold mb-1" style={{ color: COLORS.textMuted }}>¿Para qué lo necesitas?</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {panel.ocasiones.map((o) => (
            <button key={o.id}
              onClick={() => { setOcasionPedida(ocasionPedida === o.id ? null : o.id); setSaltar(0); }}
              className="rounded-full px-2.5 py-1" style={chip(ocasionPedida === o.id)}
              aria-pressed={ocasionPedida === o.id}>
              <span className="text-[10px] font-semibold"
                style={{ color: ocasionPedida === o.id ? accent : COLORS.text }}>{o.icono} {o.nombre}</span>
            </button>
          ))}
        </div>

        {/* Apartado 6 — *"¿Cuándo?"*. */}
        <p className="text-[10px] font-semibold mb-1" style={{ color: COLORS.textMuted }}>¿Cuándo?</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {panel.epocas.map((e) => (
            <button key={e.id}
              onClick={() => { setEpocaPedida(epocaPedida === e.id ? null : e.id); setSaltar(0); }}
              className="rounded-full px-2.5 py-1" style={chip(epocaPedida === e.id)}
              aria-pressed={epocaPedida === e.id}>
              <span className="text-[10px] font-semibold"
                style={{ color: epocaPedida === e.id ? accent : COLORS.text }}>{e.icono} {e.nombre}</span>
            </button>
          ))}
        </div>

        {/* Apartado 7 — la recomendación, con su porqué. */}
        {rec.hay ? (
          <div className="rounded-2xl p-3"
            style={{ background: hexToRgba(accent, 0.08), border: `1px solid ${hexToRgba(accent, 0.25)}` }}>
            <p className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>{rec.titulo}</p>
            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{rec.perfume.nombre}</p>
            <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>{rec.porque}</p>
            {/* ⚠️ Apartado 11 — usado hace poco se DICE, no se esconde. */}
            {rec.aviso && <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>⏳ {rec.aviso}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button onClick={() => aplicar(alternarFavoritoPerfume(estado, rec.perfume.id))}
                className="text-[10px] font-semibold" style={{ color: accent }}>
                {rec.perfume.favorito ? '❤️ Ya es favorito' : '❤️ Me gusta'}
              </button>
              {/* Apartado 8 — y "otra opción" recuerda lo que descartó. */}
              {rec.hayMas && (
                <button
                  onClick={() => { aplicar(descartarPerfume(estado, rec.perfume.id, { ocasion: ocasionPedida })); setSaltar(saltar + 1); }}
                  className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>
                  🔄 Otra opción
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ⚠️ Sin recomendación se dice qué falta, no una tarjeta vacía. */
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{rec.texto}</p>
        )}
      </Card>

      {/* Apartado 9 — comparar. La tabla es la del motor de la Fase 17. */}
      {panel.coleccion.length > 1 && (
        <Card>
          <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Comparar</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {panel.coleccion.map((p) => {
              const puesto = comparar.includes(p.id);
              return (
                <button key={p.id}
                  onClick={() => setComparar(puesto ? comparar.filter((x) => x !== p.id) : [...comparar, p.id].slice(-MAX_COMPARAR_PERFUME))}
                  className="rounded-full px-2.5 py-1" style={chip(puesto)} aria-pressed={puesto}>
                  <span className="text-[10px] font-semibold" style={{ color: puesto ? accent : COLORS.text }}>{p.nombre}</span>
                </button>
              );
            })}
          </div>
          {tabla.suficiente ? (
            <div className="overflow-x-auto">
              <table className="text-[10px] w-full">
                <thead>
                  <tr>
                    <th className="text-left pr-2" style={{ color: COLORS.textMuted }}> </th>
                    {tabla.perfumes.map((p) => (
                      <th key={p.id} className="text-left pr-2 font-semibold" style={{ color: COLORS.text }}>{p.nombre}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabla.filas.map((f) => (
                    <tr key={f.id}>
                      <td className="pr-2" style={{ color: COLORS.textMuted }}>{f.nombre}</td>
                      {f.valores.map((v, i) => (
                        <td key={i} className="pr-2" style={{ color: COLORS.text }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            comparar.length > 0 && <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{tabla.texto}</p>
          )}
        </Card>
      )}

      {/* ⚠️ Apartado 10 — la rotación, SOLO si la ha activado. `null` = apagada. */}
      {panel.rotacion !== null && (
        <Card>
          <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>🔄 Rotación</p>
          {panel.tocaHoy && (
            <p className="text-[11px] mb-1" style={{ color: COLORS.textMuted }}>Hoy toca {panel.tocaHoy.nombre}.</p>
          )}
          {panel.rotacion.map((d) => (
            <div key={d.id} className="flex items-center gap-2 py-0.5">
              <span className="text-[11px] w-20" style={{ color: COLORS.textMuted }}>{d.nombre}</span>
              <div className="flex flex-wrap gap-1 flex-1">
                {panel.coleccion.map((p) => {
                  const puesto = d.perfume?.id === p.id;
                  return (
                    <button key={p.id} onClick={() => aplicar(ponerEnRotacion(estado, d.id, puesto ? null : p.id))}
                      className="rounded-full px-2 py-0.5" style={chip(puesto)} aria-pressed={puesto}>
                      <span className="text-[10px]" style={{ color: puesto ? accent : COLORS.textMuted }}>{p.nombre}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Apartado 11 — evitar repetir. Opcional. */}
          <p className="text-[10px] font-semibold mt-2 mb-1" style={{ color: COLORS.textMuted }}>
            Evitar repetir el mismo perfume durante
          </p>
          <div className="flex flex-wrap gap-1">
            {panel.esperas.filter((e) => e.dias).map((e) => (
              <button key={e.id}
                onClick={() => aplicar(ponerEspera(estado, panel.resumen.espera === e.id ? null : e.id))}
                className="rounded-full px-2.5 py-1" style={chip(panel.resumen.espera === e.id)}
                aria-pressed={panel.resumen.espera === e.id}>
                <span className="text-[10px] font-semibold"
                  style={{ color: panel.resumen.espera === e.id ? accent : COLORS.text }}>{e.nombre}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ⚠️ Apartado 17 — las estadísticas, solo si activó seguimiento. */}
      {panel.estadisticas !== null && (
        <Card>
          <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>📊 Mi uso</p>
          {panel.estadisticas.hay ? (
            <>
              {panel.estadisticas.masUsado && (
                <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  Más utilizado → {panel.estadisticas.masUsado.nombre} ({panel.estadisticas.masUsado.usos})
                </p>
              )}
              {panel.estadisticas.masValorado && (
                <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  Más valorado → {panel.estadisticas.masValorado.nombre} ({panel.estadisticas.masValorado.valoracion}/5)
                </p>
              )}
              {panel.estadisticas.menosUsado && (
                <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  Menos utilizado → {panel.estadisticas.menosUsado.nombre} ({panel.estadisticas.menosUsado.usos})
                </p>
              )}
              {/* ⚠️ Sin ni un uso NO se dice cuál es el más usado: se dice esto. */}
              {panel.estadisticas.texto && (
                <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{panel.estadisticas.texto}</p>
              )}
            </>
          ) : (
            <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{panel.estadisticas.texto}</p>
          )}
        </Card>
      )}
    </div>
  );
}

/** Apartado 1 de F13 — la entrada, con sus dos botones. */
export function SkincareEH({ estado, accent, datosGlobales = {}, onCambiar, onCerrar, onEliminarRegistro }) {
  const [configurando, setConfigurando] = useState(false);
  const entrada = useMemo(() => estadoDeEntrada(estado, datosGlobales), [estado, datosGlobales]);
  /* ⚠️ Se calcula UNA vez, antes de cualquier `return` (regla 4): si se
     recalculara, pulsar "Configurar" pasaría el estado a `a_medias` y la
     pantalla saltaría sola. Mismo fallo real que ya se corrigió en F3. */
  const [yaConfigurado] = useState(() => ['a_medias', 'configurado'].includes(estadoDeEntrada(estado, datosGlobales)));

  /* ⚠️ Regla 4 — los `return` condicionales, después de los hooks.
     F14 — una vez configurado, la entrada lleva al PANEL, no al formulario:
     el perfil es una de sus cinco plaquitas (apartado 1). */
  if (configurando) {
    return (
      <PerfilPielEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setConfigurando(false)}
      />
    );
  }
  if (yaConfigurado || entrada === 'configurado' || entrada === 'a_medias') {
    return (
      <PanelPiel
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={onCerrar}
        onPerfil={() => setConfigurando(true)}
        onEliminarRegistro={onEliminarRegistro}
      />
    );
  }

  return (
    <Card className="text-center">
      {onCerrar && (
        <button onClick={onCerrar} className="p-1 -ml-1 float-left" aria-label="Volver">
          <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
        </button>
      )}
      <p className="text-2xl leading-none mb-2" aria-hidden="true">🧴</p>
      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_PIEL.titulo}</p>
      <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>{TEXTOS_PIEL.sub}</p>
      <PrimaryButton
        accent={accent}
        onClick={() => { onCambiar?.(volverAConfigurar(estado).estado); setConfigurando(true); }}
      >
        {TEXTOS_PIEL.configurar}
      </PrimaryButton>
      {/* ⚠️ "Ahora no" no es un estado degradado: es una decisión suya. */}
      <button
        onClick={() => onCambiar?.(decirAhoraNo(estado).estado)}
        className="text-[11px] font-semibold mt-2"
        style={{ color: COLORS.textMuted }}
      >
        {TEXTOS_PIEL.ahoraNo}
      </button>
      {entrada === 'ahora_no' && (
        <p className="text-[10px] mt-2" style={{ color: COLORS.textMuted }}>{TEXTOS_PIEL.omitido}</p>
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
   EH F26 — 🕶️ ACCESORIOS
   ===========================================================================
   ⚠️ **La pantalla escribe en DOS almacenes.** Añadir un accesorio crea la
   prenda en el Armario y el envoltorio de estilo aquí, así que necesita dos
   canales: `onCambiar` para Estilo de hombre y `onGuardar` para los dos a la
   vez. Marcar favorito solo toca el armario, porque el favorito es el global
   (apartado 7). */
export function AccesoriosEH({ estado, armario = null, accent, datosGlobales = {}, onCambiar, onGuardar, onCerrar, onEliminar }) {
  /* ⚠️ Regla 4 — todos los hooks antes de cualquier `return`. */
  const [zona, setZona] = useState(null);
  const [eligiendo, setEligiendo] = useState(false);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('relojes');
  const [marca, setMarca] = useState('');
  const [deseo, setDeseo] = useState('');
  const [abierto, setAbierto] = useState(null);
  const [duplicado, setDuplicado] = useState(null);
  const [error, setError] = useState(null);

  const arm = armario || { prendas: [], outfits: [], usos: [] };
  const panel = useMemo(() => panelAccesorios(estado, arm, datosGlobales), [estado, arm, datosGlobales]);
  const [yaEntro] = useState(() => panel.estado === 'configurado');
  const activas = panel.categorias.filter((c) => c.activa);

  const aplicar = (r) => {
    if (r.error) { setError(r.error); return false; }
    setError(null);
    onCambiar?.(r.estado);
    return true;
  };

  const chip = (a) => ({
    background: a ? hexToRgba(accent, 0.12) : COLORS.surface2,
    border: `1px solid ${a ? accent : COLORS.border}`,
  });

  const cabecera = (titulo) => (
    <div className="flex items-center gap-2 mb-1">
      <button onClick={() => { setZona(null); setDuplicado(null); setError(null); }} className="p-1 -ml-1" aria-label="Volver">
        <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
      </button>
      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{titulo}</p>
    </div>
  );

  /* Apartado 4 — el alta. ⚠️ Primero se comprueba el duplicado; solo si él dice
     que lo cree igual, se fuerza. */
  const anadir = ({ forzarNueva = false } = {}) => {
    const p = prepararAltaAccesorio(estado, arm, { nombre, tipo, marca }, { forzarNueva });
    if (p.error) { setError(p.error); return; }
    if (p.duplicado) { setDuplicado(p); return; }
    const r = aplicarAltaAccesorio(estado, arm, p.plan);
    if (r.error) { setError(r.error); return; }
    setError(null); setDuplicado(null); setNombre(''); setMarca('');
    onGuardar?.({ estado: r.estado, armario: r.armario });
  };

  /* Apartado 3 — *"si existe: utilizar ese elemento"*. Ni una copia. */
  const usarLaQueYaTiene = (prendaId) => {
    const r = usarPrendaComoAccesorio(estado, arm, prendaId, {});
    if (r.error) { setError(r.error); return; }
    setError(null); setDuplicado(null); setNombre(''); setMarca('');
    onCambiar?.(r.estado);
  };

  /* Apartado 7 — el favorito vive en la prenda, así que esto solo toca el armario. */
  const alternarFavorito = (id) => {
    const r = alternarFavoritoAccesorio(estado, arm, id);
    if (r.error) { setError(r.error); return; }
    setError(null);
    onGuardar?.({ armario: r.armario });
  };

  /* ⚠️ Regla 4 — los `return` condicionales, después de los hooks. */
  if (!yaEntro && panel.estado !== 'configurado') {
    return (
      <Card className="text-center">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1 float-left" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-2xl leading-none mb-2" aria-hidden="true">🕶️</p>
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_ACCESORIOS.titulo}</p>
        <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>{TEXTOS_ACCESORIOS.pregunta}</p>
        <PrimaryButton accent={accent} onClick={() => aplicar(configurarAccesorios(estado))}>
          {TEXTOS_ACCESORIOS.configurar}
        </PrimaryButton>
        <button onClick={() => aplicar(decirAhoraNoAccesorios(estado))}
          className="text-[11px] font-semibold mt-2" style={{ color: COLORS.textMuted }}>
          {TEXTOS_ACCESORIOS.ahoraNo}
        </button>
        {panel.estado === 'ahora_no' && (
          <p className="text-[10px] mt-2" style={{ color: COLORS.textMuted }}>{TEXTOS_ACCESORIOS.oculto}</p>
        )}
      </Card>
    );
  }

  /* ── Apartado 2 — qué quiere gestionar ─────────────────────────────── */
  if (eligiendo) {
    const puestas = activas.map((c) => c.id);
    return (
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => setEligiendo(false)} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_ACCESORIOS.editar}</p>
        </div>
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>Cada categoría va por su cuenta.</p>
        <div className="flex flex-wrap gap-1">
          {CASILLAS_ACCESORIOS.map((c) => {
            const puesta = puestas.includes(c.id);
            return (
              <button key={c.id} aria-pressed={puesta}
                onClick={() => onCambiar?.(elegirCategoriasAccesorios(
                  estado, puesta ? puestas.filter((x) => x !== c.id) : [...puestas, c.id],
                ))}
                className="rounded-full px-2.5 py-1" style={chip(puesta)}>
                <span className="text-[10px] font-semibold" style={{ color: puesta ? accent : COLORS.text }}>
                  {c.icono} {c.nombre}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    );
  }

  /* ── 🕶️ Mis accesorios (apartados 3 a 8) ───────────────────────────── */
  if (zona === 'mios') {
    return (
      <Card>
        {cabecera('🕶️ Mis accesorios')}
        {/* ⚠️ Apartado 3, dicho: si no, apuntaría su reloj en los dos sitios. */}
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>{TEXTOS_ACCESORIOS.viveEnElArmario}</p>
        {error && <p className="text-[10px] mb-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}

        {panel.accesorios.map((a) => {
          const comb = combinacionesDeAccesorio(estado, arm, a.id, datosGlobales);
          const donde = dondeComprarAccesorio(estado, arm, a.id);
          return (
            <div key={a.id} className="rounded-2xl p-2.5 mb-1"
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none" aria-hidden="true">{a.categoria.icono}</span>
                <button onClick={() => setAbierto(abierto === a.id ? null : a.id)}
                  className="min-w-0 flex-1 text-left">
                  <span className="block text-[11px] font-semibold truncate" style={{ color: COLORS.text }}>
                    {a.nombre}{a.marca ? ` · ${a.marca}` : ''}
                  </span>
                  <span className="block text-[10px]" style={{ color: COLORS.textMuted }}>
                    {a.categoria.nombre}{a.enUso ? ' · ⭐ lo llevas' : ''}
                  </span>
                </button>
                {/* Apartado 7 — el favorito global, escrito en la prenda. */}
                <button onClick={() => alternarFavorito(a.id)} aria-pressed={a.favorito}
                  aria-label={`Marcar ${a.nombre} como favorito`}>
                  <span className="text-[13px] leading-none" aria-hidden="true">{a.favorito ? '❤️' : '🤍'}</span>
                </button>
                {/* Apartado 8 — "estoy usando", que admite varios a la vez. */}
                <button onClick={() => aplicar(alternarEnUsoAccesorio(estado, a.id))}
                  aria-pressed={a.enUso} aria-label={`Marcar que llevas ${a.nombre}`}>
                  <span className="text-[13px] leading-none" aria-hidden="true">{a.enUso ? '⭐' : '☆'}</span>
                </button>
                <button onClick={() => onEliminar?.('accesorios', a.id)} aria-label={`Eliminar ${a.nombre}`}>
                  <X size={13} style={{ color: COLORS.textMuted }} />
                </button>
              </div>
              {abierto === a.id && (
                <div className="mt-2">
                  {/* Apartado 5 — el estilo, de la lista de la Fase 6. */}
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: COLORS.text }}>Estilo</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {panel.estilos.map((e) => {
                      const puesto = a.estilos.includes(e.id);
                      return (
                        <button key={e.id} aria-pressed={puesto}
                          onClick={() => aplicar(editarAccesorio(estado, a.id, {
                            estilos: puesto ? a.estilos.filter((x) => x !== e.id) : [...a.estilos, e.id],
                          }))}
                          className="rounded-full px-2 py-0.5" style={chip(puesto)}>
                          <span className="text-[10px] font-semibold" style={{ color: puesto ? accent : COLORS.text }}>{e.nombre}</span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Apartado 6 — las ocasiones, de la lista de la Fase 24. */}
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: COLORS.text }}>Ocasiones</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {panel.ocasiones.map((o) => {
                      const puesta = a.ocasiones.includes(o.id);
                      return (
                        <button key={o.id} aria-pressed={puesta}
                          onClick={() => aplicar(editarAccesorio(estado, a.id, {
                            ocasiones: puesta ? a.ocasiones.filter((x) => x !== o.id) : [...a.ocasiones, o.id],
                          }))}
                          className="rounded-full px-2 py-0.5" style={chip(puesta)}>
                          <span className="text-[10px] font-semibold" style={{ color: puesta ? accent : COLORS.text }}>
                            {o.icono} {o.nombre}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{comb.texto}</p>
                  {/* Apartado 12 — el enlace sale del catálogo global, si lo hay. */}
                  <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{donde.texto || (donde.donde || []).join(' · ')}</p>
                  <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>{TEXTO_AL_BORRAR}</p>
                </div>
              )}
            </div>
          );
        })}
        {panel.accesorios.length === 0 && (
          <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>Todavía no has apuntado ninguno.</p>
        )}

        {/* Apartado 3 — los que ya están en el Armario, sin volver a crearlos. */}
        {panel.delArmarioSinUsar.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] font-semibold mb-1" style={{ color: COLORS.text }}>Ya los tienes en tu Armario</p>
            {panel.delArmarioSinUsar.map((p) => (
              <button key={p.id} onClick={() => usarLaQueYaTiene(p.id)}
                className="text-[10px] font-semibold mr-2" style={{ color: accent }}>
                + Usar {p.nombre}
              </button>
            ))}
          </div>
        )}

        {/* Apartado 4 — añadir. */}
        <div className="mt-3">
          <p className="text-[11px] font-semibold mb-1" style={{ color: COLORS.text }}>+ Añadir accesorio</p>
          <div className="flex flex-wrap gap-1 mb-1">
            {activas.map((c) => (
              <button key={c.id} onClick={() => setTipo(c.id)} aria-pressed={tipo === c.id}
                className="rounded-full px-2 py-0.5" style={chip(tipo === c.id)}>
                <span className="text-[10px] font-semibold" style={{ color: tipo === c.id ? accent : COLORS.text }}>
                  {c.icono} {c.nombre}
                </span>
              </button>
            ))}
          </div>
          <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre" aria-label="Nombre del accesorio" />
          <div className="mt-1">
            <TextInput value={marca} onChange={(e) => setMarca(e.target.value)}
              placeholder="Marca (opcional)" aria-label="Marca del accesorio" />
          </div>
          {duplicado ? (
            <div className="mt-2 rounded-2xl p-2.5" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <p className="text-[10px] mb-1" style={{ color: COLORS.text }}>{duplicado.texto}</p>
              <button onClick={() => usarLaQueYaTiene(duplicado.duplicado.id)}
                className="text-[10px] font-semibold mr-3" style={{ color: accent }}>
                Usar el que ya tengo
              </button>
              {/* ⚠️ Crear otro igual exige decirlo: no hay valor por defecto. */}
              <button onClick={() => anadir({ forzarNueva: true })}
                className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>
                Crear otro distinto
              </button>
            </div>
          ) : (
            <button onClick={() => anadir()} className="text-[11px] font-semibold mt-1" style={{ color: accent }}>
              Añadir
            </button>
          )}
        </div>
      </Card>
    );
  }

  /* ── 🧩 Combinaciones (apartado 9) ─────────────────────────────────── */
  if (zona === 'combinaciones') {
    return (
      <Card>
        {cabecera('🧩 Combinaciones')}
        {/* ⚠️ No es un outfit: es la preferencia que él guarda. */}
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>
          Los outfits se montan en tu Armario. Aquí solo apuntas con qué estilo usas cada accesorio.
        </p>
        {panel.accesorios.map((a) => (
          <div key={a.id} className="rounded-2xl p-2.5 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>
              {a.categoria.icono} {a.nombre}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {panel.estilos.map((e) => {
                const puesto = a.combinaCon.includes(e.id);
                return (
                  <button key={e.id} aria-pressed={puesto}
                    onClick={() => aplicar(editarAccesorio(estado, a.id, {
                      combinaCon: puesto ? a.combinaCon.filter((x) => x !== e.id) : [...a.combinaCon, e.id],
                    }))}
                    className="rounded-full px-2 py-0.5" style={chip(puesto)}>
                    <span className="text-[10px] font-semibold" style={{ color: puesto ? accent : COLORS.text }}>{e.nombre}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
              {combinacionesDeAccesorio(estado, arm, a.id, datosGlobales).texto}
            </p>
          </div>
        ))}
        {panel.accesorios.length === 0 && (
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>Cuando apuntes alguno, aquí dirás con qué lo usas.</p>
        )}
      </Card>
    );
  }

  /* ── 💡 Recomendaciones (apartado 10) ──────────────────────────────── */
  if (zona === 'recomendaciones') {
    return (
      <Card>
        {cabecera('💡 Recomendaciones')}
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>
          Salen de lo que has apuntado. Sin inteligencia artificial.
        </p>
        {panel.sugerencias.map((s) => (
          <div key={s.id} className="rounded-2xl p-2.5 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <p className="text-[11px]" style={{ color: COLORS.text }}>{s.texto}</p>
            <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>{s.accion}</p>
          </div>
        ))}
        {panel.sugerencias.length === 0 && (
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>Ahora mismo no se nos ocurre nada que decirte.</p>
        )}
      </Card>
    );
  }

  /* ── 🎯 Quiero comprar (apartado 13) ───────────────────────────────── */
  if (zona === 'deseos') {
    return (
      <Card>
        {cabecera('🎯 Quiero comprar')}
        {error && <p className="text-[10px] mb-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}
        {panel.deseos.map((d) => (
          <div key={d.id} className="rounded-2xl p-2.5 mb-1 flex items-center gap-2"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold truncate" style={{ color: COLORS.text }}>{d.nombre}</span>
              <span className="block text-[10px]" style={{ color: COLORS.textMuted }}>{d.marca || 'Sin marca apuntada'}</span>
            </span>
            <button onClick={() => onEliminar?.('deseos', d.id)} aria-label={`Eliminar ${d.nombre}`}>
              <X size={13} style={{ color: COLORS.textMuted }} />
            </button>
          </div>
        ))}
        {panel.deseos.length === 0 && (
          <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>Apunta lo que te vaya llamando.</p>
        )}
        <TextInput value={deseo} onChange={(e) => setDeseo(e.target.value)}
          placeholder="Lo que te apetece" aria-label="Lo que quieres comprar" />
        <button
          onClick={() => { if (aplicar(anadirDeseoAccesorio(estado, { nombre: deseo, tipo }))) setDeseo(''); }}
          className="text-[11px] font-semibold mt-1" style={{ color: accent }}>
          Añadir a la lista
        </button>
      </Card>
    );
  }

  /* ── El panel ──────────────────────────────────────────────────────── */
  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-2 mb-3">
          {onCerrar && (
            <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
              <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
            </button>
          )}
          <p className="text-sm font-semibold flex-1" style={{ color: COLORS.text }}>{TEXTOS_ACCESORIOS.titulo}</p>
          <button onClick={() => setEligiendo(true)} className="text-[10px] font-semibold" style={{ color: accent }}>
            {TEXTOS_ACCESORIOS.editar}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {panel.plaquitas.map((p) => (
            <Plaquita
              key={p.id} accent={accent}
              modulo={{ nombre: p.nombre, icono: p.icono, sub: '' }}
              sub={{
                mios: panel.resumen.accesorios === 0 ? 'Añade los tuyos'
                  : `${panel.resumen.accesorios} ${panel.resumen.accesorios === 1 ? 'accesorio' : 'accesorios'}`,
                combinaciones: panel.resumen.accesorios === 0 ? 'Cuando tengas alguno'
                  : `${panel.resumen.conEstilo} con estilo`,
                recomendaciones: panel.sugerencias.length === 0 ? 'Nada por ahora'
                  : `${panel.sugerencias.length} ${panel.sugerencias.length === 1 ? 'idea' : 'ideas'}`,
                deseos: panel.deseos.length === 0 ? 'Apunta lo que te llame' : `${panel.deseos.length} apuntados`,
              }[p.id] || ''}
              onAbrir={() => setZona(p.id)}
            />
          ))}
        </div>
      </Card>

      {/* Apartado 8 — lo que lleva ahora, si ha marcado algo. */}
      {panel.enUso.length > 0 && (
        <Card>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>⭐ Lo que llevas</p>
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
            {panel.enUso.map((a) => a.nombre).join(' · ')}
          </p>
        </Card>
      )}

      {/* Apartado 14 — cada parte, con su interruptor. */}
      <Card>
        <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>⚙️ Gestionar apartados</p>
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>
          Quita lo que no uses. Los datos permanecen.
        </p>
        {panel.partes.map((p) => (
          <div key={p.id} className="rounded-2xl p-2.5 flex items-center gap-2 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <span className="text-sm leading-none" aria-hidden="true">{p.icono}</span>
            <span className="text-[11px] font-semibold flex-1" style={{ color: COLORS.text }}>{p.nombre}</span>
            <Switch checked={p.activa} onChange={() => onCambiar?.(alternarParteAccesorios(estado, p.id))}
              accent={accent} label={p.nombre} />
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ===========================================================================
   EH F27 — ❤️ MIS GUSTOS
   ===========================================================================
   ⚠️ **Los nombres viven en el registro de la Fase 4** (`intereses` y
   `quiereHacer`, desde la Fase 6), así que lo que él escribió en el perfil de
   estilo sale aquí como una entrada suelta con un botón para completarla. Y la
   nota es corta: **lo extenso lleva al Diario**, que ya existe. */
export function GustosEH({ estado, accent, datosGlobales = {}, objetivos = null, onCambiar, onCerrar, onIr, onEliminar, onGuardarObjetivo }) {
  /* ⚠️ Regla 4 — todos los hooks antes de cualquier `return`. */
  const [zona, setZona] = useState(null);
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState('otros');
  const [abierto, setAbierto] = useState(null);
  const [convirtiendo, setConvirtiendo] = useState(null);
  const [error, setError] = useState(null);

  const panel = useMemo(() => panelGustos(estado, datosGlobales), [estado, datosGlobales]);
  /* EH F28 — el puente con Objetivos. ⚠️ `objetivos` llega de fuera en solo
     lectura: aquí no se guarda ni un objetivo, solo su id. */
  const objs = objetivos || { lista: [] };
  const puente = useMemo(() => panelPuente(estado, objs), [estado, objs]);
  const [yaEntro] = useState(() => panel.estado === 'configurado');
  const bloque = panel.porTipo.find((t) => t.parte === zona) || null;

  const aplicar = (r) => {
    if (r.error) { setError(r.error); return false; }
    setError(null);
    onCambiar?.(r.estado);
    return true;
  };

  const chip = (a) => ({
    background: a ? hexToRgba(accent, 0.12) : COLORS.surface2,
    border: `1px solid ${a ? accent : COLORS.border}`,
  });

  const cabecera = (titulo) => (
    <div className="flex items-center gap-2 mb-1">
      <button onClick={() => { setZona(null); setError(null); }} className="p-1 -ml-1" aria-label="Volver">
        <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
      </button>
      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{titulo}</p>
    </div>
  );

  /* ⚠️ Regla 4 — los `return` condicionales, después de los hooks. */
  if (!yaEntro && panel.estado !== 'configurado') {
    return (
      <Card className="text-center">
        {onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1 float-left" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-2xl leading-none mb-2" aria-hidden="true">❤️</p>
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_GUSTOS.titulo}</p>
        <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>{TEXTOS_GUSTOS.pregunta}</p>
        <PrimaryButton accent={accent} onClick={() => aplicar(configurarGustos(estado))}>
          {TEXTOS_GUSTOS.configurar}
        </PrimaryButton>
        <button onClick={() => aplicar(decirAhoraNoGustos(estado))}
          className="text-[11px] font-semibold mt-2" style={{ color: COLORS.textMuted }}>
          {TEXTOS_GUSTOS.ahoraNo}
        </button>
        {panel.estado === 'ahora_no' && (
          <p className="text-[10px] mt-2" style={{ color: COLORS.textMuted }}>{TEXTOS_GUSTOS.oculto}</p>
        )}
      </Card>
    );
  }

  /* ── 🌟 Experiencias (EH F28, apartado 4) ──────────────────────────── */
  if (zona === PARTE_EXPERIENCIAS) {
    return (
      <Card>
        {cabecera('🌟 Experiencias')}
        {/* ⚠️ Es una vista de la categoría que ya existe, no otra lista. */}
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>
          Lo que has apuntado en la categoría Experiencias.
        </p>
        {(puente.experiencias || []).map((x) => (
          <div key={x.id} className="rounded-2xl p-2.5 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>
              {x.tipoNombre.icono} {x.nombre}
            </p>
            <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
              {[x.texto, x.lugar, x.fecha].filter(Boolean).join(' · ')}
            </p>
          </div>
        ))}
        {(puente.experiencias || []).length === 0 && (
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
            Cuando apuntes algo como Experiencia, aparecerá aquí.
          </p>
        )}
        {/* Apartado 5 — lo que está cumplido en Objetivos y aún no marcado aquí. */}
        {puente.sugerencias.map((s) => (
          <div key={s.id} className="rounded-2xl p-2.5 mt-2"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <p className="text-[11px]" style={{ color: COLORS.text }}>{s.nombre} — {s.texto}</p>
            <button
              onClick={() => aplicar(marcarYaLoHice(estado, objs, s.id, { confirmado: true, datosGlobales }))}
              className="text-[10px] font-semibold mt-1" style={{ color: accent }}>
              {s.accion}
            </button>
          </div>
        ))}
      </Card>
    );
  }

  /* ── 📋 Mis preferencias (apartado 1) ──────────────────────────────── */
  if (zona === 'preferencias') {
    return (
      <Card>
        {cabecera('📋 Mis preferencias')}
        {/* ⚠️ Ni una lista nueva: es lo que ya dijo, con su sitio de edición. */}
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>
          Esto es lo que ya has contado en otras pantallas. Aquí solo se mira.
        </p>
        {(panel.preferencias || []).map((p) => (
          <div key={p.id} className="rounded-2xl p-2.5 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <p className="text-[11px] font-semibold" style={{ color: COLORS.text }}>{p.nombre}</p>
            <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{p.texto}</p>
            <p className="text-[10px]" style={{ color: COLORS.textMuted }}>Se cambia en: {p.donde}</p>
          </div>
        ))}
      </Card>
    );
  }

  /* ── Un bloque: Me gusta · Quiero hacer · Mis intereses ────────────── */
  if (bloque) {
    return (
      <Card>
        {cabecera(`${bloque.icono} ${bloque.nombre}`)}
        {/* ⚠️ Apartado 4, dicho donde se ve. */}
        {bloque.id === 'hacer' && (
          <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>{TEXTOS_GUSTOS.noEsTarea}</p>
        )}
        {error && <p className="text-[10px] mb-2" style={{ color: COLORS.danger || COLORS.textMuted }}>{error}</p>}

        {bloque.entradas.map((x) => (
          <div key={x.id} className="rounded-2xl p-2.5 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center gap-2">
              <span className="text-sm leading-none" aria-hidden="true">{x.categoriaNombre.icono}</span>
              <button onClick={() => setAbierto(abierto === x.id ? null : x.id)} className="min-w-0 flex-1 text-left">
                <span className="block text-[11px] font-semibold truncate" style={{ color: COLORS.text }}>
                  {x.nombre}
                </span>
                <span className="block text-[10px]" style={{ color: COLORS.textMuted }}>
                  {[x.categoriaNombre.nombre, x.estadoNombre ? `${x.estadoNombre.icono} ${x.estadoNombre.nombre}` : null,
                    x.fecha, x.lugar].filter(Boolean).join(' · ')}
                </span>
              </button>
              <button onClick={() => aplicar(alternarFavoritoGusto(estado, x.id))}
                aria-pressed={x.favorito} aria-label={`Marcar ${x.nombre} como favorito`}>
                <span className="text-[13px] leading-none" aria-hidden="true">{x.favorito ? '❤️' : '🤍'}</span>
              </button>
              <button onClick={() => onEliminar?.(x.id)} aria-label={`Eliminar ${x.nombre}`}>
                <X size={13} style={{ color: COLORS.textMuted }} />
              </button>
            </div>
            {abierto === x.id && (
              <div className="mt-2">
                {/* Apartado 3 — la categoría, para organizarlo. */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {panel.categorias.map((c) => (
                    <button key={c.id} aria-pressed={x.categoria === c.id}
                      onClick={() => aplicar(editarGusto(estado, x.id, { categoria: c.id }))}
                      className="rounded-full px-2 py-0.5" style={chip(x.categoria === c.id)}>
                      <span className="text-[10px] font-semibold" style={{ color: x.categoria === c.id ? accent : COLORS.text }}>
                        {c.icono} {c.nombre}
                      </span>
                    </button>
                  ))}
                </div>
                {/* Apartado 5 — la prioridad, opcional y sin prisa. */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {panel.prioridades.map((p) => (
                    <button key={p.id} aria-pressed={x.prioridad === p.id}
                      onClick={() => aplicar(editarGusto(estado, x.id, {
                        prioridad: x.prioridad === p.id ? null : p.id,
                      }))}
                      className="rounded-full px-2 py-0.5" style={chip(x.prioridad === p.id)}>
                      <span className="text-[10px] font-semibold" style={{ color: x.prioridad === p.id ? accent : COLORS.text }}>
                        {p.nombre}
                      </span>
                    </button>
                  ))}
                </div>
                {/* Apartado 6 — el estado, SOLO en "Quiero hacer". */}
                {x.tipo === 'hacer' && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {panel.estados.map((s) => (
                      <button key={s.id} aria-pressed={x.estado === s.id}
                        onClick={() => aplicar(cambiarEstadoGusto(estado, x.id, s.id))}
                        className="rounded-full px-2 py-0.5" style={chip(x.estado === s.id)}>
                        <span className="text-[10px] font-semibold" style={{ color: x.estado === s.id ? accent : COLORS.text }}>
                          {s.icono} {s.nombre}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {/* Apartado 7 — la fecha, que llega al calendario sin crear nada. */}
                <TextInput type="date" value={x.fecha || ''} aria-label={`Fecha de ${x.nombre}`}
                  onChange={(e) => aplicar(ponerFechaGusto(estado, x.id, e.target.value || null))} />
                {/* Apartado 8 — el lugar. */}
                <div className="mt-1">
                  <TextInput value={x.lugar} placeholder="Dónde (opcional)" aria-label={`Lugar de ${x.nombre}`}
                    onChange={(e) => aplicar(editarGusto(estado, x.id, { lugar: e.target.value }))} />
                </div>
                {/* Apartado 10 — la nota corta, y el Diario para lo largo. */}
                <div className="mt-1">
                  <TextInput value={x.nota} placeholder="Nota corta (opcional)" aria-label={`Nota de ${x.nombre}`}
                    onChange={(e) => aplicar(editarGusto(estado, x.id, { nota: e.target.value }))} />
                </div>
                <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>{TEXTOS_GUSTOS.diario}</p>
                {onIr && (
                  <button onClick={() => onIr(DESTINO_DIARIO)} className="text-[10px] font-semibold" style={{ color: accent }}>
                    {TEXTOS_GUSTOS.abrirDiario}
                  </button>
                )}

                {/* ── EH F28 — el puente con Objetivos, solo en "Quiero hacer" ── */}
                {x.tipo === 'hacer' && (() => {
                  const est = estadoDelObjetivo(x, objs);
                  return (
                    <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{est.texto}</p>
                      {/* ⚠️ Apartado 10 — lo que Objetivos tiene es un sí/no. */}
                      {est.enlazado && (
                        <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
                          {TEXTOS_PUENTE.sinPorcentaje}
                        </p>
                      )}
                      {/* Apartado 5 — se propone, y marcar exige confirmarlo. */}
                      {est.cumplido && estadoHacer(x.estado)?.abierto && (
                        <button
                          onClick={() => aplicar(marcarYaLoHice(estado, objs, x.id, { confirmado: true, datosGlobales }))}
                          className="text-[10px] font-semibold mr-3" style={{ color: accent }}>
                          {TEXTOS_PUENTE.yaLoHice}
                        </button>
                      )}
                      {est.enlazado && onIr && (
                        <button onClick={() => onIr(DESTINO_OBJETIVOS, { id: est.objetivo.id })}
                          className="text-[10px] font-semibold" style={{ color: accent }}>
                          {TEXTOS_PUENTE.verObjetivo}
                        </button>
                      )}
                      {/* Apartados 1 y 2 — convertir, eligiendo plazo. Sin defecto. */}
                      {!est.enlazado && !est.perdido && (
                        convirtiendo === x.id ? (
                          <div className="mt-1">
                            <p className="text-[10px] font-semibold mb-1" style={{ color: COLORS.text }}>
                              {TEXTOS_PUENTE.elegirPlazo}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {puente.plazos.map((pl) => (
                                <button key={pl} className="rounded-full px-2 py-0.5" style={chip(false)}
                                  onClick={() => {
                                    const plan = prepararObjetivo(estado, objs, x.id, { plazo: pl });
                                    if (plan.error) { setError(plan.error); return; }
                                    const guardado = aplicarObjetivo(estado, objs, plan.plan, { datosGlobales });
                                    if (guardado.error) { setError(guardado.error); return; }
                                    setError(null); setConvirtiendo(null);
                                    onGuardarObjetivo?.({ estado: guardado.estado, objetivos: guardado.objetivos });
                                    /* Apartado 2 — se abre el sistema global, y
                                       `ObjectivesView` ya sabe destacar el id. */
                                    onIr?.(DESTINO_OBJETIVOS, { id: guardado.objetivo.id });
                                  }}>
                                  <span className="text-[10px] font-semibold" style={{ color: COLORS.text }}>{pl}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setConvirtiendo(x.id)}
                            className="text-[10px] font-semibold" style={{ color: accent }}>
                            {TEXTOS_PUENTE.convertir}
                          </button>
                        )
                      )}
                      <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
                        {TEXTOS_PUENTE.dondeVive}
                      </p>
                      {/* ⚠️ Apartado 7 — el límite, dicho en vez de un botón muerto. */}
                      <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{TEXTOS_PUENTE.sinFotos}</p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ))}
        {bloque.entradas.length === 0 && (
          <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>Todavía no has apuntado nada aquí.</p>
        )}

        {/* ⚠️ Lo que escribió en el perfil de estilo, sin duplicarlo. */}
        {bloque.sueltos.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] font-semibold mb-1" style={{ color: COLORS.text }}>
              Ya lo dijiste en tu perfil de estilo
            </p>
            {bloque.sueltos.map((s) => (
              <button key={s} onClick={() => aplicar(completarSuelto(estado, bloque.id, s, {}, { datosGlobales }))}
                className="text-[10px] font-semibold mr-2" style={{ color: accent }}>
                + {s}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3">
          <div className="flex flex-wrap gap-1 mb-1">
            {panel.categorias.map((c) => (
              <button key={c.id} onClick={() => setCategoria(c.id)} aria-pressed={categoria === c.id}
                className="rounded-full px-2 py-0.5" style={chip(categoria === c.id)}>
                <span className="text-[10px] font-semibold" style={{ color: categoria === c.id ? accent : COLORS.text }}>
                  {c.icono} {c.nombre}
                </span>
              </button>
            ))}
          </div>
          <TextInput value={texto} onChange={(e) => setTexto(e.target.value)}
            placeholder="Añadir" aria-label={`Añadir a ${bloque.nombre}`} />
          <button
            onClick={() => {
              if (aplicar(anadirGusto(estado, { nombre: texto, tipo: bloque.id, categoria }, { datosGlobales }))) setTexto('');
            }}
            className="text-[11px] font-semibold mt-1" style={{ color: accent }}>
            Añadir
          </button>
        </div>
      </Card>
    );
  }

  /* ── El panel ──────────────────────────────────────────────────────── */
  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-2 mb-3">
          {onCerrar && (
            <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
              <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
            </button>
          )}
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{TEXTOS_GUSTOS.titulo}</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {panel.plaquitas.map((p) => (
            <Plaquita
              key={p.id} accent={accent}
              modulo={{ nombre: p.nombre, icono: p.icono, sub: '' }}
              sub={{
                me_gusta: panel.resumen.gusta === 0 ? 'Apunta lo que te guste' : `${panel.resumen.gusta} apuntados`,
                quiero_hacer: panel.resumen.hacer === 0 ? 'Lo que te apetezca' : `${panel.resumen.hacer} apuntados`,
                intereses: panel.resumen.interes === 0 ? 'Lo que te llame' : `${panel.resumen.interes} apuntados`,
                preferencias: 'Lo que ya has contado',
                experiencias: puente.resumen.experiencias
                  ? `${puente.resumen.experiencias} apuntadas`
                  : 'Viajes, aprender algo…',
              }[p.id] || ''}
              onAbrir={() => setZona(p.id)}
            />
          ))}
        </div>
      </Card>

      {/* Apartado 13 — cada bloque, con su interruptor. */}
      <Card>
        <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>⚙️ Gestionar apartados</p>
        <p className="text-[10px] mb-2" style={{ color: COLORS.textMuted }}>
          Quita lo que no uses. Los datos permanecen.
        </p>
        {panel.partes.map((p) => (
          <div key={p.id} className="rounded-2xl p-2.5 flex items-center gap-2 mb-1"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <span className="text-sm leading-none" aria-hidden="true">{p.icono}</span>
            <span className="text-[11px] font-semibold flex-1" style={{ color: COLORS.text }}>{p.nombre}</span>
            <Switch checked={p.activa} onChange={() => onCambiar?.(alternarParteGustos(estado, p.id))}
              accent={accent} label={p.nombre} />
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ===========================================================================
   LA PANTALLA (F1 apartados 2 y 13 · F2 apartados 9, 10 y 11)
   =========================================================================== */
export default function EstiloHombreView({ estiloHombre, accent, datosGlobales = {}, armario = null, onIr, onCambiar, onEliminarRegistro, onEliminarRegistroBarba, onEliminarRutinaBarba, onEliminarSonrisa, onEliminarPerfume, onEliminarAccesorio, onGuardarAccesorio, onEliminarGusto, onGuardarObjetivo, objetivos = null, rachas = null }) {
  const [gestionando, setGestionando] = useState(false);
  const [misDatos, setMisDatos] = useState(false);
  const [miEstilo, setMiEstilo] = useState(false);
  const [perfilPelo, setPerfilPelo] = useState(false);   // false | 'panel' | 'perfil'
  const [skincare, setSkincare] = useState(false);       // F13
  const [barba, setBarba] = useState(false);             // F20
  const [sonrisa, setSonrisa] = useState(false);         // F23
  const [perfumes, setPerfumes] = useState(false);       // F24
  const [accesorios, setAccesorios] = useState(false);   // F26
  const [gustos, setGustos] = useState(false);           // F27
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
  /* F13 — el recuento de Skincare, derivado como todos los demás. */
  const pielEH = useMemo(() => resumenPiel(estado, datosGlobales), [estado, datosGlobales]);
  const subPiel = { sin_configurar: 'Configura tu perfil', ahora_no: 'Cuando quieras' }[pielEH.estado]
    || `${pielEH.contestadas} de ${pielEH.total} contestadas`;
  /* F20 — el de Barba, derivado igual: nada de un contador guardado. */
  const barbaEH = useMemo(() => resumenBarba(estado, datosGlobales), [estado, datosGlobales]);
  const subBarba = {
    sin_configurar: 'Si quieres, configúralo', ahora_no: 'Cuando quieras', eligiendo: 'Personalízalo',
  }[barbaEH.estado] || `${barbaEH.contestadas} de ${barbaEH.total} contestadas`;
  /* F23 — el de Sonrisa, derivado igual. */
  const sonrisaEH = useMemo(() => resumenSonrisa(estado), [estado]);
  const subSonrisa = sonrisaEH.estado === 'sin_configurar' ? 'Si quieres, configúralo'
    : (sonrisaEH.estado === 'ahora_no' ? 'Cuando quieras'
      : (sonrisaEH.rutinas === 0 ? 'Crea tu rutina'
        : `${sonrisaEH.rutinas} ${sonrisaEH.rutinas === 1 ? 'rutina' : 'rutinas'}`
          + (sonrisaEH.hoy > 0 ? ` · ${sonrisaEH.hechasHoy}/${sonrisaEH.hoy} hoy` : '')));
  /* F24 — el de Perfumes, derivado igual. */
  const perfumesEH = useMemo(() => resumenPerfumes(estado, datosGlobales), [estado, datosGlobales]);
  const subPerfumes = perfumesEH.estado === 'sin_configurar' ? 'Si quieres, configúralo'
    : (perfumesEH.estado === 'ahora_no' ? 'Cuando quieras'
      : (perfumesEH.coleccion === 0 ? 'Añade los tuyos'
        : `${perfumesEH.coleccion} ${perfumesEH.coleccion === 1 ? 'perfume' : 'perfumes'}`));
  /* F26 — el de Accesorios, derivado igual: la cuenta sale de unir el armario
     con lo guardado aquí, y no hay ni un contador. */
  const accesoriosEH = useMemo(
    () => resumenAccesorios(estado, armario || { prendas: [], outfits: [], usos: [] }),
    [estado, armario],
  );
  const subAccesorios = accesoriosEH.estado === 'sin_configurar' ? 'Si quieres, configúralo'
    : (accesoriosEH.estado === 'ahora_no' ? 'Cuando quieras'
      : (accesoriosEH.accesorios === 0 ? 'Añade los tuyos'
        : `${accesoriosEH.accesorios} ${accesoriosEH.accesorios === 1 ? 'accesorio' : 'accesorios'}`
          + (accesoriosEH.enUso > 0 ? ` · ${accesoriosEH.enUso} puestos` : '')));
  /* F27 — el de Mis gustos, derivado igual. ⚠️ Los "sueltos" son lo que ya
     escribió en el perfil de estilo y todavía no ha completado: se cuentan, no
     se duplican. */
  const gustosEH = useMemo(() => resumenGustos(estado, datosGlobales), [estado, datosGlobales]);
  const subGustos = gustosEH.estado === 'sin_configurar' ? 'Si quieres, configúralo'
    : (gustosEH.estado === 'ahora_no' ? 'Cuando quieras'
      : (gustosEH.total === 0
        ? (gustosEH.sueltos > 0 ? `${gustosEH.sueltos} por completar` : 'Cuéntanos qué te gusta')
        : `${gustosEH.total} ${gustosEH.total === 1 ? 'cosa' : 'cosas'}`));
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

  /* F13 — la plaquita de Skincare abre su entrada (apartado 1), que decide
     entre la bienvenida y el formulario. */
  if (skincare) {
    return (
      <SkincareEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setSkincare(false)}
        onEliminarRegistro={onEliminarRegistro}
      />
    );
  }

  /* F20 — la plaquita de Barba abre su entrada (apartado 1), que decide entre
     la bienvenida, las casillas del apartado 2 y el panel. */
  if (barba) {
    return (
      <BarbaEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setBarba(false)}
        onEliminarRegistroBarba={onEliminarRegistroBarba}
        onEliminarRutinaBarba={onEliminarRutinaBarba}
      />
    );
  }

  /* F23 — la plaquita de Sonrisa abre su entrada, que decide entre la
     bienvenida y el panel de sus cuatro apartados. */
  if (sonrisa) {
    return (
      <SonrisaEH
        estado={estado} accent={accent} rachas={rachas}
        onCambiar={onCambiar} onCerrar={() => setSonrisa(false)}
        onEliminar={onEliminarSonrisa}
      />
    );
  }

  /* F24 — la plaquita de Perfumes abre su entrada. */
  if (perfumes) {
    return (
      <PerfumesEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onCerrar={() => setPerfumes(false)}
        onEliminar={onEliminarPerfume}
      />
    );
  }

  /* F26 — la plaquita de Accesorios abre su entrada. ⚠️ Recibe el armario y el
     canal que escribe en los dos almacenes: la prenda va allí, no aquí. */
  if (accesorios) {
    return (
      <AccesoriosEH
        estado={estado} armario={armario} accent={accent} datosGlobales={datosGlobales}
        onCambiar={onCambiar} onGuardar={onGuardarAccesorio}
        onCerrar={() => setAccesorios(false)}
        onEliminar={onEliminarAccesorio}
      />
    );
  }

  /* F27 — la plaquita de Mis gustos abre su entrada. ⚠️ Recibe `onIr` porque
     el apartado 10 lleva al Diario que ya existe, en vez de copiar nada. */
  if (gustos) {
    return (
      <GustosEH
        estado={estado} accent={accent} datosGlobales={datosGlobales}
        /* EH F28 — Objetivos en solo lectura, y el canal que escribe los dos. */
        objetivos={objetivos} onGuardarObjetivo={onGuardarObjetivo}
        onCambiar={onCambiar} onIr={onIr}
        onCerrar={() => setGustos(false)}
        onEliminar={onEliminarGusto}
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
              /* F13 — Skincare es el tercero con contenido propio. */
              const esPiel = m.id === MODULO_PIEL && !ordenando;
              /* F20 — y Barba el cuarto. */
              const esBarba = m.id === MODULO_BARBA && !ordenando;
              /* F23 — Sonrisa, el quinto. */
              const esSonrisa = m.id === MODULO_SONRISA && !ordenando;
              /* F24 — y Perfumes, el sexto. */
              const esPerfumes = m.id === MODULO_PERFUMES && !ordenando;
              /* F26 — Accesorios, el séptimo. */
              const esAccesorios = m.id === MODULO_ACCESORIOS && !ordenando;
              /* F27 — y Mis gustos, el octavo. */
              const esGustos = m.id === MODULO_GUSTOS && !ordenando;
              return (
                <Plaquita
                  key={m.id} modulo={m} accent={accent}
                  sub={esArmario && estiloArmario ? resumenPlaquitaArmario
                    : (esPelo ? subPelo : (esPiel ? subPiel : (esBarba ? subBarba : (esSonrisa ? subSonrisa : (esPerfumes ? subPerfumes : (esAccesorios ? subAccesorios : (esGustos ? subGustos : null)))))))}
                  onAbrir={esArmario ? () => onIr(DESTINO_ARMARIO)
                    : (esPelo ? () => setPerfilPelo('panel')
                      : (esPiel ? () => setSkincare(true)
                        : (esBarba ? () => setBarba(true)
                          : (esSonrisa ? () => setSonrisa(true)
                            : (esPerfumes ? () => setPerfumes(true)
                              : (esAccesorios ? () => setAccesorios(true)
                                : (esGustos ? () => setGustos(true) : null)))))))}
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
            /* ⚠️ F13 — Skincare ya tiene contenido, así que deja de contar como
               pendiente. Un aviso que dice "el resto llega después" incluyendo
               uno que YA funciona es exactamente la mentira que prohíbe la
               regla 8, solo que en la otra dirección. */
            const conPiel = activos.some((m) => m.id === MODULO_PIEL);
            const pendientes = activos.length - (conArmario ? 1 : 0) - (conPelo ? 1 : 0) - (conPiel ? 1 : 0);
            if (pendientes === 0) return null;
            return (
              <p className="text-[11px] text-center" style={{ color: COLORS.textMuted }}>
                {conArmario || conPelo || conPiel
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
