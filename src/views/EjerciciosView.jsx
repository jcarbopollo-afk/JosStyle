/* ===========================================================================
   ENTREGA 4 · FASE 2/45 — EL CATÁLOGO DE EJERCICIOS, LA PANTALLA

   El apartado 23 pide *"una pantalla interna para poder inspeccionar el
   catálogo"* con buscador, filtros y lista, y el 24 una vista de detalle
   reutilizable. Y el apartado 25 remata: *"Debe sentirse como una parte de
   Fitness, no como una página administrativa"*.

   🚨 **ESTA PANTALLA NO CALCULA NADA.** Buscar, filtrar, contar, resolver los
   músculos, encontrar los sustitutos y las progresiones — todo sale de
   `src/lib/ejercicios.js`. Aquí solo se dibuja.

   ⚠️ **El detalle se exporta a propósito** (`DetalleEjercicio`): el apartado 24
   dice que *"esta pantalla será reutilizada posteriormente"*, y además sin
   exportarla no la probaría nadie — solo aparece tras pulsar una tarjeta, que
   es el agujero del Álbum de Relación (NAV F3).

   🚨 **Y DESDE LA FIT F3 ESTA MISMA PANTALLA ES EL SELECTOR DEL CONSTRUCTOR.**
   El apartado 5 de aquella fase pide un selector *"basado directamente en el
   catálogo de la Fase 2"* con búsqueda, filtros y navegación: es esto. Con
   `onElegir`, tocar una tarjeta **añade** en vez de abrir el detalle —el
   apartado 6 lo quiere inmediato— y se queda aquí, para poder seguir añadiendo
   *"sin perder el contexto"*. Una segunda pantalla de catálogo habría sido el
   duplicado de la E3 F22: dos buscadores encontrando cosas distintas.

   🔓 **FIT F34 — Y ES LA BIBLIOTECA (`ExerciseLibrary`), Y SU DETALLE LA FICHA
   (`ExerciseDetail`).** No se escribe una segunda: se amplía ésta con la
   cabecera «Ejercicios», los recientes, los favoritos y «Explorar», la
   búsqueda por músculo y material, «Limpiar filtros» y la lista de 20 en 20.
   La ficha se monta con `fichaDeBiblioteca` y los componentes de
   `components/bibliotecaEjercicios.jsx`. ⚠️ **Lo personal y las acciones solo
   salen si se le pasa con qué**: la misma ficha se abre desde el tutorial del
   entrenamiento en vivo y desde Progreso, y ahí decir «Sin datos de
   rendimiento» sin haber mirado los datos sería mentir (regla 8).
   =========================================================================== */

import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Search, X, Plus } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { CatalogDiagnosticsEntry } from '../components/diagnosticoCatalogo';
import { Card, SectionTitle, GhostBtn, EmptyHint } from '../components/ui';
import {
  ExerciseSearchBar, ExerciseFilters, ExerciseGrid, ExerciseCard, ExerciseHeader, ExerciseMuscleBreakdown,
  ExerciseEquipment, ExerciseTechnique, ExerciseTutorial, ExerciseProgressions, ExerciseVariantsList,
  ExerciseAlternatives, ExercisePersonalProgress, ExerciseAddToWorkout, ExerciseFavoriteButton, ExerciseFilterChip,
} from '../components/bibliotecaEjercicios';
import {
  consultarBiblioteca, opcionesDeFiltroBiblioteca, paginaDeBiblioteca, POR_PAGINA_BIBLIOTECA,
  bloquesDeBiblioteca, fichaDeBiblioteca, favoritosDeEjercicios, alternarFavoritoEjercicio,
  entrenamientosParaAnadir, anadirAEntrenamiento, rutinaNuevaCon, ejerciciosDeBiblioteca, TEXTO_LIMPIAR_FILTROS,
} from '../lib/bibliotecaEjercicios';

/* ── La tarjeta de la F2, que desde la F34 vive en los componentes ─────────
   Se reexporta con su nombre de siempre: la usan el banco de renderizado y
   quien ya la importaba de aquí. */
export const TarjetaEjercicio = ExerciseCard;

/* ── La ficha (F2, apartado 24 · FIT F34, apartados 8-30) ──────────────────
   Jerarquía del apartado 39: visual, nombre, músculos, técnica, progresiones y
   variantes, y tu progreso. `fitness` y las acciones son opcionales. */
export function DetalleEjercicio({
  ejercicio, accent, onVolver = null, onAbrirOtro = null, volverA = 'Catálogo',
  fitness = null, perfil = null, propios = [],
  onFavorito = null, onAnadir = null, onCrearNuevo = null,
  onVerProgreso = null, onVerObjetivo = null, onCrearObjetivo = null, onClasificar = null,
  exerciseId = null,
}) {
  const [anadiendo, setAnadiendo] = useState(false);
  const id = ejercicio ? ejercicio.id : exerciseId;
  const ficha = useMemo(
    () => (id ? fichaDeBiblioteca(fitness || {}, id, { propios, perfil }) : { estado: 'no_existe' }),
    [id, fitness, propios, perfil],
  );
  const volver = onVolver && (
    <button
      onClick={onVolver}
      aria-label={`Volver a ${volverA}`}
      className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
      style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
    >
      <ArrowLeft size={16} /> {volverA}
    </button>
  );

  if (ficha.estado === 'no_existe') {
    return (
      <div className="space-y-4">
        {volver}
        <EmptyHint text="Ese ejercicio ya no está en el catálogo." />
      </div>
    );
  }

  /* Apartado 27 — el archivado se ve, con su historia, y no se añade a nada. */
  if (ficha.estado === 'archivado') {
    return (
      <div className="space-y-4">
        {volver}
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.warning }}>{ficha.etiquetaArchivado}</p>
          <p className="text-xl font-extrabold mt-1" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{ficha.nombre}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{ficha.avisoArchivado}</p>
        </Card>
        {fitness && (
          <ExercisePersonalProgress
            personal={ficha.personal}
            accent={accent}
            onVerProgreso={onVerProgreso ? () => onVerProgreso(ficha.id) : null}
            onVerObjetivo={onVerObjetivo}
          />
        )}
      </div>
    );
  }

  const abrir = onAbrirOtro || null;
  const puedeAnadir = !!(onAnadir || onCrearNuevo);
  return (
    <div className="space-y-4">
      {volver}
      <ExerciseHeader ficha={ficha} accent={accent} />

      {/* Apartado 30 — solo las acciones que se pueden hacer desde aquí. */}
      {(puedeAnadir || onFavorito) && (
        <div className="flex gap-2 flex-wrap">
          {puedeAnadir && (
            <button
              onClick={() => setAnadiendo(!anadiendo)}
              aria-expanded={anadiendo}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold toque-44 active:scale-95"
              style={{ background: accent, color: COLORS.textOnAccent }}
            >
              <Plus size={15} aria-hidden="true" />Añadir a entrenamiento
            </button>
          )}
          <ExerciseFavoriteButton favorito={ficha.favorito} accent={accent} onAlternar={onFavorito ? () => onFavorito(ficha.id) : null} />
        </div>
      )}
      {anadiendo && puedeAnadir && (
        <ExerciseAddToWorkout
          entrenamientos={entrenamientosParaAnadir(fitness)}
          accent={accent}
          onAnadir={onAnadir ? (plantillaId) => onAnadir(plantillaId, ficha.id) : null}
          onCrearNuevo={onCrearNuevo ? () => onCrearNuevo(ficha.id) : null}
          onCerrar={() => setAnadiendo(false)}
        />
      )}

      <ExerciseMuscleBreakdown musculos={ficha.musculos} nota={ficha.notaMusculos} accent={accent} />
      <ExerciseEquipment equipamiento={ficha.equipamiento} accent={accent} />
      <ExerciseTechnique tecnica={ficha.tecnica} accent={accent} />
      <ExerciseTutorial tutorial={ficha.tutorial} nombre={ficha.nombre} />
      <ExerciseProgressions progresion={ficha.progresion} accent={accent} onAbrir={abrir} />
      <ExerciseVariantsList variantes={ficha.variantes} accent={accent} onAbrir={abrir} />
      <ExerciseAlternatives alternativas={ficha.alternativas} accent={accent} onAbrir={abrir} />

      {fitness && (
        <ExercisePersonalProgress
          personal={ficha.personal}
          accent={accent}
          onVerProgreso={onVerProgreso ? () => onVerProgreso(ficha.id) : null}
          onVerObjetivo={onVerObjetivo}
          onCrearObjetivo={onCrearObjetivo ? () => onCrearObjetivo(ficha.id) : null}
          onClasificar={onClasificar ? () => onClasificar(ficha.id) : null}
        />
      )}
    </div>
  );
}

/* ── La biblioteca (F2, apartado 23 · FIT F34, apartados 2-7) ──────────────
   ⚠️ **Qué se busca, qué filtro está puesto y cuántas se ven NO se guardan**:
   son estado de la pantalla, no un dato (EH F40). */
export default function EjerciciosView({
  propios = [], accent, onVolver = null, volverA = 'Fitness',
  onElegir = null, yaElegidos = [],
  /* 🔓 FIT F33 — lo que hace elegir. En el constructor, añadir; al sustituir,
     cambiar: una tarjeta que dice «Añadir» y reemplaza mentiría (regla 8). */
  accionElegir = 'Añadir', marcaElegido = 'Ya está',
  /* 🔓 FIT F34 — la biblioteca: con `fitness` salen los recientes, los
     favoritos y lo personal de la ficha; cada acción, solo si llega su función. */
  fitness = null, perfil = null, onGuardarFitness = null, onAbrirConstructor = null,
  onVerProgreso = null, onVerObjetivo = null, onCrearObjetivo = null, onClasificar = null,
  /* 🔓 FIT F35, apartado 29 — el diagnóstico del catálogo. Lo decide quien
     monta la biblioteca con `esDesarrollo()`: en producción no llega. */
  diagnostico = false,
}) {
  const [consulta, setConsulta] = useState('');
  const [filtros, setFiltros] = useState({});
  const [abierto, setAbierto] = useState(null);
  const [verFiltros, setVerFiltros] = useState(false);
  const [visibles, setVisibles] = useState(POR_PAGINA_BIBLIOTECA);

  const q = useMemo(() => consultarBiblioteca({ consulta, filtros, propios }), [consulta, filtros, propios]);
  const opciones = useMemo(() => opcionesDeFiltroBiblioteca(q.cuenta), [q.cuenta]);
  const pagina = useMemo(() => paginaDeBiblioteca(q.resultado, visibles), [q.resultado, visibles]);
  const bloques = useMemo(
    () => (onElegir ? [] : bloquesDeBiblioteca(fitness || {}, { propios })),
    [onElegir, fitness, propios],
  );
  const favoritos = favoritosDeEjercicios(fitness);
  const total = useMemo(() => ejerciciosDeBiblioteca(propios).length, [propios]);

  /* Al cambiar la búsqueda o los filtros se vuelve a la primera página. */
  useEffect(() => { setVisibles(POR_PAGINA_BIBLIOTECA); }, [consulta, filtros]);

  const alternar = (clave, valor) => setFiltros((f) => (f[clave] === valor
    ? { ...f, [clave]: null }
    : { ...f, [clave]: valor }));
  const limpiar = () => setFiltros({});
  const buscando = !!consulta.trim() || q.hayFiltros;

  if (abierto) {
    const guardar = onGuardarFitness && fitness ? onGuardarFitness : null;
    return (
      <DetalleEjercicio
        exerciseId={abierto}
        accent={accent}
        volverA="Ejercicios"
        onVolver={() => setAbierto(null)}
        onAbrirOtro={setAbierto}
        fitness={fitness}
        perfil={perfil}
        propios={propios}
        onFavorito={guardar ? (id) => guardar(alternarFavoritoEjercicio(fitness, id, { propios })) : null}
        onAnadir={guardar ? (plantillaId, id) => {
          const r = anadirAEntrenamiento(fitness, plantillaId, id, { propios });
          if (r.ok) guardar(r.fitness);
          return r.ok;
        } : null}
        onCrearNuevo={onAbrirConstructor ? (id) => { const r = rutinaNuevaCon(id, { propios }); if (r) onAbrirConstructor(r); } : null}
        onVerProgreso={onVerProgreso}
        onVerObjetivo={onVerObjetivo}
        onCrearObjetivo={onCrearObjetivo}
        onClasificar={onClasificar}
      />
    );
  }

  return (
    <div className="space-y-4">
      {onVolver && (
        <button
          onClick={onVolver}
          aria-label={`Volver a ${volverA}`}
          className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
          style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
        >
          <ArrowLeft size={16} /> {volverA}
        </button>
      )}

      {/* Apartado 2 — la cabecera «Ejercicios», en la biblioteca; en modo
          selector se entra desde otra pantalla que ya dice qué se hace. */}
      {!onElegir && (
        <p className="text-2xl font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>Ejercicios</p>
      )}

      <ExerciseSearchBar
        consulta={consulta}
        onConsulta={setConsulta}
        verFiltros={verFiltros}
        onVerFiltros={() => setVerFiltros((v) => !v)}
      />

      {verFiltros && (
        <ExerciseFilters opciones={opciones} filtros={filtros} accent={accent} onAlternar={alternar} onLimpiar={limpiar} />
      )}

      {/* Apartado 2 — recientes y favoritos solo si hay, y «Explorar». */}
      {!buscando && bloques.filter((b) => b.id !== 'catalogo').map((b) => (
        <div key={b.id}>
          <SectionTitle sub={b.sub}>{b.titulo}</SectionTitle>
          {b.ejercicios ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {b.ejercicios.map((e) => (
                <ExerciseCard key={e.id} ejercicio={e} accent={accent} favorito={favoritos.includes(e.id)} onAbrir={() => setAbierto(e.id)} />
              ))}
            </div>
          ) : (
            <div className="flex gap-1.5 flex-wrap">
              {b.categorias.map((c) => (
                <ExerciseFilterChip
                  key={c.id}
                  cuantos={c.cuantos}
                  accent={accent}
                  onClick={() => { setFiltros(c.filtro); setVerFiltros(true); }}
                >
                  {c.nombre}
                </ExerciseFilterChip>
              ))}
            </div>
          )}
        </div>
      ))}

      {!onElegir && !buscando && <SectionTitle>Todos los ejercicios</SectionTitle>}
      <p className="text-xs px-1" style={{ color: COLORS.textMuted }}>
        {q.resultado.length} {q.resultado.length === 1 ? 'ejercicio' : 'ejercicios'}
        {buscando ? ` de ${total}` : ''}
      </p>

      {/* ⚠️ Un vacío con salida, nunca una lista en blanco (apartado 17 de la F1). */}
      {q.resultado.length === 0 ? (
        <Card>
          <div className="py-5 text-center">
            <Search size={22} style={{ color: COLORS.textMuted }} className="mx-auto mb-2" />
            <p className="text-sm font-bold" style={{ color: COLORS.text }}>Ningún ejercicio encaja</p>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              Prueba con menos filtros o con otra palabra.
            </p>
            {buscando && (
              <div className="mt-3 flex justify-center">
                <GhostBtn icon={X} onClick={() => { setFiltros({}); setConsulta(''); }}>{TEXTO_LIMPIAR_FILTROS}</GhostBtn>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <ExerciseGrid
          pagina={pagina}
          accent={accent}
          accion={onElegir ? accionElegir : 'Ver'}
          marcaDe={onElegir ? (e) => (yaElegidos.includes(e.id) ? marcaElegido : null) : null}
          favoritos={favoritos}
          onAbrir={(id) => (onElegir ? onElegir(id) : setAbierto(id))}
          onMas={() => setVisibles((v) => v + POR_PAGINA_BIBLIOTECA)}
        />
      )}

      {diagnostico && !onElegir && !buscando && <CatalogDiagnosticsEntry accent={accent} />}
    </div>
  );
}

/* Los nombres del apartado 31. */
export const ExerciseLibrary = EjerciciosView;
export const ExerciseDetail = DetalleEjercicio;
