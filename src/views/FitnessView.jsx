/* ===========================================================================
   ENTREGA 4 · FASE 1/45 — FITNESS, LA PANTALLA

   El enunciado pide cimientos: entrada, tres áreas, una estructura de pantalla
   reutilizable, estados vacíos y responsive. Y remata con el criterio de éxito:
   *"Jos Style → Fitness abre correctamente un módulo que ya parece una parte
   real de la aplicación"*.

   🚨 **ESTA PANTALLA NO REESCRIBE LA DE CALISTENIA.** `TrainingView` —siete
   habilidades con su progresión, sus récords, sus sesiones, sus vídeos y los
   partidos de fútbol— se renderiza **tal cual**, con las mismas props que
   `App.jsx` ya pasaba. Es la E3 F23 con Productividad y NAV F1 con Números:
   *agrupar pantallas es renderizarlas, nunca copiarlas*. Si una fase futura la
   «integrara» copiando su contenido, habría dos versiones de lo mismo y
   acabarían diciendo cosas distintas — hay una prueba que lo vigila.

   🚨 **Y NO GUARDA NI UNA CIFRA.** Los números del área de Entrenamiento, el
   recuento de fotos y la racha se derivan en el momento desde `fitness.js`.

   ⚠️ **Cuál área está abierta es estado de esta pantalla, no un dato.** Es la
   lección de la EH F40: guardar `viendo` hacía que volver te dejara donde lo
   dejaste hace dos semanas. `DEFAULT_FITNESS` ni siquiera tiene el campo.
   =========================================================================== */

import React, { useState, useEffect } from 'react';
import { ChevronRight, Lock, Camera, Flame, Dumbbell, Plus, Pencil, X } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, SectionTitle, GhostBtn, PrimaryButton } from '../components/ui';
import {
  AREAS_FITNESS, AREA_INICIAL, GRUPOS_MUSCULARES, NIVELES_RANGO, SIN_RANGO,
  estadoDeNivel, nombreDeRango, ESTADOS_VACIOS, CTA_CLASIFICAR, ACCESOS_ENTRENAMIENTO,
  rachaDeFitness, resumenProgreso, resumenEntrenamiento,
} from '../lib/fitness';
import { iconoDeArea, iconoDeGrupo } from '../components/iconosFitness';
import TrainingView from './TrainingView';
/* FIT F2 — el catálogo se renderiza entero aquí dentro, como `TrainingView`:
   agrupar pantallas es renderizarlas, nunca copiarlas (E3 F23). */
import EjerciciosView from './EjerciciosView';
/* FIT F3 — el constructor, renderizado entero aquí dentro (E3 F23). */
import ConstructorView from './ConstructorView';
/* FIT F4 — la gestión de plantillas, renderizada entera aquí dentro (E3 F23). */
import PlantillasView from './PlantillasView';
import { duplicarPlantilla, fichaDePlantilla, ordenarPlantillas } from '../lib/plantillas';
import {
  crearRutina, planARutina, leerBorrador, borrarBorrador,
} from '../lib/constructor';

/* ── La cabecera (apartado 6) ──────────────────────────────────────────────
   *"El header debe poder utilizarse posteriormente en todas las pantallas del
   módulo"*, y prepararse para el nombre, la racha, acciones y navegación
   secundaria. Por eso recibe `acciones` como children: la fase que necesite un
   botón arriba lo pasa, sin tocar este componente.

   ⚠️ La racha **solo se pinta si existe**. El apartado 6 ofrecía enseñar
   «0 días» como estado neutro, y sería un número falso el día que Josué lleve
   cuatro seguidos: la racha de entrenamiento la lleva el motor de rachas, y si
   no la tiene definida no hay nada que decir (EH F23, apartado 10). */
export function CabeceraFitness({ titulo, racha, accent, acciones = null }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h2
          className="text-2xl font-extrabold truncate"
          style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif", letterSpacing: '-0.02em' }}
        >
          {titulo}
        </h2>
        {racha && (
          <p className="text-xs font-semibold mt-0.5 flex items-center gap-1" style={{ color: accent }}>
            <Flame size={13} /> {racha.texto} seguidos
          </p>
        )}
      </div>
      {acciones}
    </div>
  );
}

/* ── La navegación interna (apartado 5) ────────────────────────────────────
   *"NO quiero tres botones gigantes que parezcan una pantalla provisional"*.
   Es un control segmentado: una píldora con las tres dentro, la activa con el
   acento detrás.

   ⚠️ `aria-current` además del color: un estado no puede distinguirse solo por
   su color (EH F42, apartado 6). Y `flex-1` da la zona de toque. */
export function PestanasFitness({ areas, activa, onCambiar, accent }) {
  return (
    <div
      className="flex gap-1 p-1 rounded-2xl mb-5"
      role="tablist"
      aria-label="Áreas de Fitness"
      style={{ background: hexToRgba(COLORS.border, 0.45) }}
    >
      {areas.map((a) => {
        const Icono = iconoDeArea(a.id);
        const esta = a.id === activa;
        return (
          <button
            key={a.id}
            role="tab"
            aria-selected={esta}
            aria-current={esta ? 'page' : undefined}
            onClick={() => onCambiar(a.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-sm font-bold transition-colors toque-44 active:scale-[0.98]"
            style={{
              background: esta ? accent : 'transparent',
              color: esta ? COLORS.textOnAccent : COLORS.textMuted,
            }}
          >
            <Icono size={15} />
            <span className="truncate">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Un estado vacío (apartado 17) ─────────────────────────────────────────
   *"Nunca quiero: una pantalla en blanco […] botones sin función que parezcan
   rotos"*. El texto y la salida salen de `ESTADOS_VACIOS`, declarados con su
   motivo; si un área no tiene botón, es que todavía no hay nada que pulsar, y
   entonces no se pinta ninguno. */
export function VacioFitness({ estado, accent, onAccion = null }) {
  return (
    <Card>
      <div className="py-6 text-center">
        <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {estado.titulo}
        </p>
        <p className="text-sm mt-1.5 mx-auto max-w-xs" style={{ color: COLORS.textMuted }}>
          {estado.texto}
        </p>
        {estado.accion && onAccion && (
          <div className="mt-4 flex justify-center">
            <GhostBtn icon={Camera} onClick={() => onAccion(estado.accion)}>
              {estado.accion.texto}
            </GhostBtn>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── La insignia de un nivel (apartados 9 y 16) ────────────────────────────
   *"Debe existir una estructura visual para las insignias de los 10 niveles,
   pero todavía no debe mostrar progreso ficticio"*. Hexagonal, como pide el
   apartado, y con los tres estados del apartado 8: completado, actual y
   bloqueado.

   ⚠️ El candado va **además** del color, no en su lugar. */
export function InsigniaRango({ nivel, estado, accent }) {
  const activa = estado !== 'bloqueado';
  return (
    <div className="flex flex-col items-center gap-1 shrink-0" style={{ width: 56 }}>
      <div
        className="w-11 h-11 flex items-center justify-center"
        style={{
          clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
          background: estado === 'actual' ? accent : hexToRgba(COLORS.border, activa ? 0.9 : 0.45),
          color: estado === 'actual' ? COLORS.textOnAccent : COLORS.textMuted,
        }}
      >
        {activa
          ? <span className="text-sm font-extrabold">{nivel.orden}</span>
          : <Lock size={14} aria-hidden="true" />}
      </div>
      <span
        className="text-[10px] font-semibold text-center leading-tight"
        style={{ color: estado === 'actual' ? COLORS.text : COLORS.textMuted }}
      >
        {nivel.nombre}
      </span>
    </div>
  );
}

/* ── La tarjeta de un grupo muscular (apartado 9) ──────────────────────────
   *"Cada tarjeta debe estar preparada para posteriormente mostrar: icono,
   nombre, rango, progreso, chevron, subgrupos"*. Las seis cosas están; lo que
   todavía no hay es el **cálculo**, así que el rango se enseña como `SIN_RANGO`
   —que es la verdad— y no como un porcentaje inventado.

   ⚠️ **Y el chevron solo aparece si hay a dónde ir.** La pantalla de un grupo
   es de una fase posterior, así que en la FIT F1 la tarjeta no es un botón: un
   chevron promete navegación, y una flecha que no lleva a ninguna parte es el
   control decorativo de la regla 8. El componente ya acepta `onAbrir`, de forma
   que la fase que construya esa pantalla solo tiene que pasárselo. */
export function TarjetaGrupoMuscular({ grupo, rango, accent, onAbrir = null }) {
  const Icono = iconoDeGrupo(grupo.id);
  const subgrupos = grupo.subgrupos || [];
  const dentro = (
    <>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: hexToRgba(accent, 0.14), color: accent }}
      >
        <Icono size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {grupo.nombre}
        </p>
        <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
          {nombreDeRango(rango?.nivel ?? null)} · {subgrupos.length} {subgrupos.length === 1 ? 'zona' : 'zonas'}
        </p>
      </div>
      {onAbrir && <ChevronRight size={18} style={{ color: COLORS.textMuted }} aria-hidden="true" />}
    </>
  );
  const clases = 'hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3';
  const estilo = { background: COLORS.surface, border: `1px solid ${COLORS.border}` };
  if (!onAbrir) return <div className={clases} style={estilo}>{dentro}</div>;
  return (
    <button
      onClick={onAbrir}
      aria-label={`Ver ${grupo.nombre}`}
      className={`${clases} active:scale-[0.99]`}
      style={estilo}
    >
      {dentro}
    </button>
  );
}

/* ── Área: RANGOS (apartados 9 y 10) ─────────────────────────────────────── */
/* ⚠️ Las tres áreas se EXPORTAN a propósito: solo una se pinta a la vez, así que
   renderizar `FitnessView` no prueba las otras dos. Es la lección del Álbum de
   Relación (NAV F3) — *si lo que tocas solo aparece tras pulsar algo,
   exportarlo y probarlo aparte*. */
export function AreaRangos({ rangos = [], accent }) {
  const lista = Array.isArray(rangos) ? rangos : [];
  const general = lista.find((r) => r.nivel !== null) || null;
  return (
    <div className="space-y-5">
      <Card>
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
          Rango Predicho
        </p>
        <p
          className="text-3xl font-extrabold mt-1"
          style={{ color: general ? accent : COLORS.text, fontFamily: "'Manrope', sans-serif" }}
        >
          {nombreDeRango(general?.nivel ?? null)}
        </p>
        <p className="text-sm mt-1.5" style={{ color: COLORS.textMuted }}>
          {general ? 'Calculado con los ejercicios que has clasificado.' : SIN_RANGO.que}
        </p>

        {/* Las diez insignias. En un iPhone pequeño no caben diez de una vez, así
            que van en su propio carril horizontal: la página nunca se desplaza
            de lado, solo esta tira. */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mt-4 -mx-1 px-1">
          {NIVELES_RANGO.map((n) => (
            <InsigniaRango
              key={n.id}
              nivel={n}
              estado={estadoDeNivel(n, general?.nivel ?? null)}
              accent={accent}
            />
          ))}
        </div>

        {/* El CTA del apartado 9. Existe y se ve, pero dice la verdad: sin
            catálogo de ejercicios no hay nada que clasificar todavía. */}
        <p
          className="text-xs mt-4 pt-3"
          style={{ color: COLORS.textMuted, borderTop: `1px solid ${COLORS.border}` }}
        >
          <span className="font-semibold" style={{ color: COLORS.text }}>{CTA_CLASIFICAR.texto}</span>
          {' — '}{CTA_CLASIFICAR.mientrasTanto}
        </p>
      </Card>

      <div>
        <SectionTitle sub="Tu nivel en cada zona del cuerpo">Rankings musculares</SectionTitle>
        <div className="space-y-2">
          {GRUPOS_MUSCULARES.map((g) => (
            <TarjetaGrupoMuscular
              key={g.id}
              grupo={g}
              rango={lista.find((r) => r.grupoId === g.id) || null}
              accent={accent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Área: PROGRESO (apartado 11) ─────────────────────────────────────────
   🚨 **Las fotos de progreso ya existen**: las sube Salud física desde la
   Fase 3, con su archivo, su fecha, su nota y su PIN opcional. Esta pantalla
   **las cuenta y lleva allí**; no las copia, no las vuelve a subir y no se
   salta su protección. Decirle *"todavía no has añadido fotografías"* a alguien
   que tiene cinco sería mentirle en su propia pantalla. */
export function AreaProgreso({ fotos, accent, onIr = null }) {
  const resumen = resumenProgreso(fotos);
  if (resumen.vacio) {
    /* ⚠️ Sin `onIr` no se pinta el botón: un «Añadir foto» que no lleva a
       ninguna parte es peor que no ofrecerlo (regla 8). */
    return (
      <VacioFitness
        estado={ESTADOS_VACIOS.progreso}
        accent={accent}
        onAccion={onIr ? (a) => onIr(a.lleva) : null}
      />
    );
  }
  return (
    <div className="space-y-4">
      <Card>
        <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          Tu progreso
        </p>
        <p className="text-sm mt-1.5" style={{ color: COLORS.textMuted }}>{resumen.texto}</p>
        {onIr && (
          <div className="mt-4">
            <GhostBtn icon={Camera} onClick={() => onIr('salud')}>Ver y añadir fotos</GhostBtn>
          </div>
        )}
      </Card>
      <p className="text-xs px-1" style={{ color: COLORS.textMuted }}>
        La línea de tiempo y la comparación entre dos fotos llegan en una fase posterior.
      </p>
    </div>
  );
}

/* ── Área: ENTRENAMIENTO (apartado 12) ────────────────────────────────────
   *"Tu Plan"*, *"Planificaciones"* y *"Tus plantillas"*, más lo que ya existe:
   las habilidades de calistenia. El apartado 23 prohíbe construir aquí el
   constructor, la biblioteca y el historial, así que los accesos que aún no
   existen **se dicen** en vez de ofrecerse como botones que no llevan a
   ninguna parte (regla 8). */
export function AreaEntrenamiento({
  fitness, calistenia, accent, entrenoProps, onAbrirConstructor = null,
  onGuardarFitness = null, onEliminarPlantilla = null,
}) {
  const resumen = resumenEntrenamiento(fitness, calistenia);
  const propios = (fitness || {}).ejercicios || [];
  /* 🚨 Lo que construye Josué son **plantillas**, no planes. Lo dejó escrito la
     F1 en `crearWorkoutPlan`: *"un plan y una plantilla son la misma forma: lo
     que cambia es si él lo creó (`plantillas`) o viene de la biblioteca
     (`planes`)"*. Guardarlo en `planes` habría chocado con la biblioteca de
     planificaciones de una fase posterior y habría dejado lo suyo mezclado con
     lo que no es suyo. */
  const plantillas = (fitness || {}).plantillas || [];
  const hayPlantillas = plantillas.length > 0;
  /* ⚠️ Qué subpantalla está abierta es estado de la pantalla, no un dato
     (EH F40): `DEFAULT_FITNESS` no tiene el campo, y volver a Fitness siempre
     te deja donde se entra, no donde lo dejaste hace dos semanas. */
  const [dentro, setDentro] = useState(null);
  /* FIT F3, apartado 25 — el borrador se LEE al entrar y se OFRECE. Guardarlo
     y no volver a mencionarlo sería guardarlo para nada; y recuperarlo solo,
     sin preguntar, le pondría delante algo que quizá ya no quiere. */
  const [borrador, setBorrador] = useState(() => leerBorrador());
  const aMedias = borrador && borrador.lineas.length > 0;
  /* FIT F4, apartado 20: *"No llenar la pantalla de cards."* El área enseña las
     tres últimas y la gestión entera vive en su propia pantalla. */
  const ultimas = ordenarPlantillas(plantillas, 'recientes').slice(0, 3);

  if (dentro === 'ejercicios') {
    return (
      <EjerciciosView
        propios={propios}
        accent={accent}
        onVolver={() => setDentro(null)}
      />
    );
  }

  /* FIT F4 — la gestión completa: buscar, filtrar, ordenar, ver el detalle,
     duplicar y eliminar. */
  if (dentro === 'plantillas') {
    return (
      <PlantillasView
        plantillas={plantillas}
        propios={propios}
        accent={accent}
        onVolver={() => setDentro(null)}
        onCrear={onAbrirConstructor ? () => onAbrirConstructor(null) : null}
        onEditar={onAbrirConstructor ? (p) => onAbrirConstructor(planARutina(p)) : null}
        onDuplicar={onGuardarFitness ? (p) => {
          const r = duplicarPlantilla(plantillas, p.id);
          if (r.ok) onGuardarFitness({ ...(fitness || {}), plantillas: r.plantillas });
        } : null}
        onEliminar={onEliminarPlantilla ? (p) => onEliminarPlantilla(p.id) : null}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Apartado 25: *"si el usuario cierra accidentalmente, navega atrás,
          recarga, no debería perder todo el trabajo"*. */}
      {aMedias && onAbrirConstructor && (
        <Card style={{ border: `1px solid ${accent}` }}>
          <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            Tienes un entrenamiento a medias
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            {borrador.nombre || 'Sin nombre todavía'} · {borrador.lineas.length}
            {borrador.lineas.length === 1 ? ' ejercicio' : ' ejercicios'}
          </p>
          <div className="flex gap-2 mt-3">
            <GhostBtn icon={Pencil} onClick={() => onAbrirConstructor(borrador)}>Continuar</GhostBtn>
            <GhostBtn icon={X} onClick={() => { borrarBorrador(); setBorrador(null); }}>Descartar</GhostBtn>
          </div>
        </Card>
      )}

      <div>
        <SectionTitle sub="Lo que estás entrenando ahora">Tu Plan</SectionTitle>
        {/* ⚠️ El plan ACTIVO es otra cosa que las plantillas, y llega en una fase
            posterior: aquí sigue el estado vacío de la F1. */}
        <VacioFitness estado={ESTADOS_VACIOS.entrenamiento} accent={accent} />
      </div>

      <div>
        <SectionTitle sub="Las rutinas que te has creado tú">Tus plantillas</SectionTitle>
        {hayPlantillas
          ? (
            /* Apartado 24: *"una rutina guardada puede volver a abrirse y
               editarse"*. Esto NO es la gestión completa de plantillas —menú de
               acciones, duplicar, buscar, filtrar, ordenar—, que es la FIT F4:
               es la lista mínima que impide que lo guardado quede encerrado. */
            <div className="space-y-2">
              {ultimas.map((p) => {
                const res = fichaDePlantilla(p, propios) || { ejercicios: 0, duracion: '' };
                return (
                  <button
                    key={p.id}
                    onClick={() => setDentro('plantillas')}
                    aria-label={`Ver ${p.nombre || 'entrenamiento sin nombre'}`}
                    className="hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99]"
                    style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: hexToRgba(accent, 0.14), color: accent }}
                    >
                      <Dumbbell size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
                        {p.nombre || 'Sin nombre'}
                      </p>
                      <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
                        {res.ejercicios} {res.ejercicios === 1 ? 'ejercicio' : 'ejercicios'}
                        {res.duracion ? ` · ${res.duracion}` : ''}
                      </p>
                    </div>
                    <ChevronRight size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />
                  </button>
                );
              })}
              {/* ⚠️ «Ver las N» solo si queda algo fuera: un botón que lleva a la
                  lista que ya estás viendo no hace nada (E3 F46, regla 8). */}
              {plantillas.length > ultimas.length && (
                <GhostBtn icon={ChevronRight} onClick={() => setDentro('plantillas')}>
                  Ver las {plantillas.length}
                </GhostBtn>
              )}
              <GhostBtn icon={Pencil} onClick={() => setDentro('plantillas')}>Gestionarlas</GhostBtn>
            </div>
          )
          : (
            <Card>
              <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
                Todavía no te has creado ninguna
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                La que construyas aparecerá aquí, y podrás volver a abrirla.
              </p>
            </Card>
          )}

        {/* 🚨 El CTA del apartado 2, y lleva de verdad al constructor. Si nadie
            puede guardar no se pinta: sería el control decorativo de la
            regla 8. */}
        {onAbrirConstructor && (
          <div className="mt-3">
            <PrimaryButton accent={accent} icon={Plus} onClick={() => onAbrirConstructor(null)}>
              Crear entrenamiento
            </PrimaryButton>
          </div>
        )}
      </div>

      <div>
        <SectionTitle sub="Lo que vendrá y lo que ya puedes usar">Secciones</SectionTitle>
        <div className="space-y-2">
          {/* 🚨 El que EXISTE es un botón; el que no, una frase que dice cuándo
              llega. Un botón que no lleva a ninguna parte es el control
              decorativo de la regla 8. */}
          {ACCESOS_ENTRENAMIENTO.filter((a) => a.existe && a.id !== 'habilidades' && a.id !== 'plantillas').map((a) => (
            <button
              key={a.id}
              onClick={() => setDentro(a.id)}
              aria-label={`Abrir ${a.nombre}`}
              className="hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99]"
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: hexToRgba(accent, 0.14), color: accent }}
              >
                <Dumbbell size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
                  {a.nombre}
                </p>
                <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>{a.que}</p>
              </div>
              <ChevronRight size={18} style={{ color: COLORS.textMuted }} aria-hidden="true" />
            </button>
          ))}
          {ACCESOS_ENTRENAMIENTO.filter((a) => !a.existe).map((a) => (
            <Card key={a.id}>
              <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
                {a.nombre}
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                {a.que} Llega en {a.enFase.toLowerCase()}.
              </p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle
          sub={resumen.habilidadesActivas > 0
            ? `${resumen.habilidadesActivas} en marcha · progresión, récords, sesiones y vídeos`
            : 'Calistenia: progresión, récords, sesiones y vídeos'}
        >
          Habilidades
        </SectionTitle>
        {/* 🚨 La pantalla de siempre, entera y sin tocar. */}
        <TrainingView {...entrenoProps} accent={accent} />
      </div>
    </div>
  );
}

/* ── La pantalla ─────────────────────────────────────────────────────────── */
export default function FitnessView({
  fitness, calistenia, onUpdateSkill, futbol, onAddPartido, onDeletePartido,
  videos, onAddVideo, onDeleteVideo, onSetVideoFeedback,
  fotos = [], rachas, accent, foco, onFocoConsumido, onIr, onGuardarFitness = null,
  onEliminarPlantilla = null,
}) {
  const [area, setArea] = useState(AREA_INICIAL);

  /* ⚠️ Un foco que llega apuntando a una habilidad no puede quedarse escondido
     detrás del área que estuviera abierta: es la lección de la E3 F24 —un
     elemento recién creado no puede desaparecer por el filtro puesto—. Si viene
     un foco, se abre el área que lo sabe interpretar. */
  useEffect(() => {
    if (foco) setArea('entrenamiento');
  }, [foco]);

  /* FIT F3 — qué se está construyendo es estado de la pantalla, nunca un dato
     guardado (EH F40). `null` = no se está construyendo nada. */
  const [creando, setCreando] = useState(null);

  const racha = rachaDeFitness(rachas);
  const rangos = (fitness?.rangos) || [];
  /* 🚨 Lo que se crea Josué vive en `plantillas`, no en `planes`: la F1 dejó esa
     división escrita, y `planes` es la biblioteca de una fase posterior. */
  const plantillas = (fitness?.plantillas) || [];
  const propios = (fitness?.ejercicios) || [];
  const entrenoProps = {
    calistenia, onUpdateSkill, futbol, onAddPartido, onDeletePartido,
    videos, onAddVideo, onDeleteVideo, onSetVideoFeedback, foco, onFocoConsumido,
  };

  /* 🚨 FIT F3 — el constructor es PANTALLA ENTERA, sin cabecera ni pestañas. El
     apartado 4 le da su propio encabezado —volver, título, guardar—, y dejar
     las pestañas debajo permitiría irse a Rangos en mitad de una rutina, que es
     la puerta de atrás por la que se pierde el trabajo. Va DESPUÉS de todos los
     hooks (regla 4). */
  if (creando) {
    return (
      <ConstructorView
        planes={plantillas}
        propios={propios}
        accent={accent}
        rutinaInicial={creando.rutina}
        onGuardar={(siguientes) => onGuardarFitness && onGuardarFitness({ ...(fitness || {}), plantillas: siguientes })}
        onVolver={() => setCreando(null)}
      />
    );
  }

  return (
    <div className="space-y-1">
      <CabeceraFitness titulo="Fitness" racha={racha} accent={accent} />
      <PestanasFitness areas={AREAS_FITNESS} activa={area} onCambiar={setArea} accent={accent} />

      {area === 'rangos' && <AreaRangos rangos={rangos} accent={accent} />}
      {area === 'progreso' && <AreaProgreso fotos={fotos} accent={accent} onIr={onIr} />}
      {area === 'entrenamiento' && (
        <AreaEntrenamiento
          fitness={fitness} calistenia={calistenia} accent={accent} entrenoProps={entrenoProps}
          onGuardarFitness={onGuardarFitness}
          onEliminarPlantilla={onEliminarPlantilla}
          onAbrirConstructor={onGuardarFitness
            ? (rutina) => setCreando({ rutina: rutina || crearRutina({}) })
            : null}
        />
      )}
    </div>
  );
}
