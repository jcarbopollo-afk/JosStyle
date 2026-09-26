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
import { ChevronRight, ChevronLeft, Camera, Flame, Dumbbell, Pencil, X } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, SectionTitle, GhostBtn, PrimaryButton, EmptyHint } from '../components/ui';
import {
  AREAS_FITNESS, AREA_INICIAL, ESTADOS_VACIOS, ACCESOS_ENTRENAMIENTO,
  rachaDeFitness, resumenProgreso, resumenEntrenamiento,
} from '../lib/fitness';
import { iconoDeArea } from '../components/iconosFitness';
import TrainingView from './TrainingView';
/* FIT F2 — el catálogo se renderiza entero aquí dentro, como `TrainingView`:
   agrupar pantallas es renderizarlas, nunca copiarlas (E3 F23). */
import EjerciciosView from './EjerciciosView';
import { esDesarrollo } from '../components/diagnosticoCatalogo';
/* FIT F3 — el constructor, renderizado entero aquí dentro (E3 F23). */
import ConstructorView from './ConstructorView';
/* FIT F4 — la gestión de plantillas, renderizada entera aquí dentro (E3 F23). */
import PlantillasView from './PlantillasView';
/* FIT F5 — la biblioteca de planificaciones, renderizada entera aquí dentro. */
import BibliotecaPlanesView from './BibliotecaPlanesView';
/* FIT F6 — «Tu Plan», el centro de control, renderizado entero aquí dentro. */
import TuPlanView from './TuPlanView';
/* FIT F7 — el entrenamiento en vivo, que es PANTALLA ENTERA (como el
   constructor): con las pestañas debajo se podría uno ir a Rangos en mitad de
   una serie, que es la puerta de atrás por la que se pierde el trabajo. */
import EntrenamientoVivoView, { SesionRecuperable } from './EntrenamientoVivoView';
/* FIT F10 — el historial, dentro de Entrenamiento (su apartado 2). */
import HistorialView, { DetalleSesionHistorial } from './HistorialView';
/* 🔓 FIT F32, apartado 37 — una sesión hecha, abierta desde Tu Plan, es el
   detalle del Historial: *"No duplicar pantallas"*. */
import { detalleDeSesion, sesionDelHistorial } from '../lib/historial';
/* FIT F12 — Progreso: resumen, ejercicios y fotos. */
import ProgresoView from './ProgresoView';
/* FIT F16 — Rangos: la pantalla entera, que consume la lógica de la F15. */
import RangosView from './RangosView';
/* FIT F17 — el cuestionario de clasificación, que se abre desde Rangos. */
import ClasificacionView from './ClasificacionView';
/* FIT F8 — el resumen y el guardado, también pantalla entera: se llega desde el
   entrenamiento en vivo y se sale guardando o descartando. */
import FinalizacionView from './FinalizacionView';
import { duplicarPlantilla } from '../lib/plantillas';
import {
  usarPlan, personalizarPreset, alternarFavoritoPlan, quitarPlanActivo, diaARutina,
} from '../lib/planes';
import { planActivoCompleto, sesionDelDia, tuPlan } from '../lib/tuPlan';
import {
  empezarSesion, guardarSesion, sesionActiva, descartarSesion,
} from '../lib/entrenamiento';
import {
  sesionEnFinalizacion, AVISO_RECUPERAR_FINAL, descartarEntrenamiento,
} from '../lib/finalizacion';
import {
  crearRutina, planARutina, leerBorrador, borrarBorrador,
} from '../lib/constructor';
/* 🔓 FIT F30, apartado 36 — el objetivo activo del ejercicio en curso. */
import { objetivoEnVivo } from '../lib/objetivosFitness';
/* 🔓 FIT F33 — cancelar el objetivo del ejercicio sustituido (F14). */
import { cancelarObjetivo } from '../lib/objetivosProgreso';

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

/* ── Área: RANGOS (apartados 9 y 10) ─────────────────────────────────────── */
/* 🔓 **FIT F16 — el área entera es ahora `RangosView`**, igual que Progreso es
   `ProgresoView`: Rango Predicho, los diez rangos, clasificar ejercicios, tu
   cuerpo y los rankings musculares, todo calculado por la F15.

   ⚠️ Se llevó por delante `InsigniaRango` y `TarjetaGrupoMuscular`, los dos
   componentes con los que la F1 dejó el hueco preparado: sus sustitutos son
   `RankBadge` (F15) y `MuscleRankCard` (F16), y dejarlos ahí sin usar habría
   dejado dos formas distintas de pintar el mismo rango.

   ⚠️ Las tres áreas se EXPORTAN a propósito: solo una se pinta a la vez, así que
   renderizar `FitnessView` no prueba las otras dos. Es la lección del Álbum de
   Relación (NAV F3) — *si lo que tocas solo aparece tras pulsar algo,
   exportarlo y probarlo aparte*. */
export function AreaRangos({ fitness = null, perfil = null, accent, onEntrenar = null, onClasificar = null, onEjercicio = null }) {
  return (
    <RangosView
      fitness={fitness}
      propios={(fitness && fitness.ejercicios) || []}
      perfil={perfil}
      accent={accent}
      onEntrenar={onEntrenar}
      onClasificar={onClasificar}
      onEjercicio={onEjercicio}
    />
  );
}

/* ── Área: PROGRESO (apartado 11) ─────────────────────────────────────────
   🚨 **Las fotos de progreso ya existen**: las sube Salud física desde la
   Fase 3, con su archivo, su fecha, su nota y su PIN opcional. Esta pantalla
   **las cuenta y lleva allí**; no las copia, no las vuelve a subir y no se
   salta su protección. Decirle *"todavía no has añadido fotografías"* a alguien
   que tiene cinco sería mentirle en su propia pantalla. */
/* 🔓 FIT F12 — el área entera es ahora `ProgresoView`: Resumen, Ejercicios y
   Fotos (su apartado 2). ⚠️ **Las fotos no se pierden**: siguen contándose de
   Salud física y llevando allí, ahora en su propia pestaña, porque la F12 pide
   dejar la estructura lista para el sistema de fotos sin construirlo. */
export function AreaProgreso({ fitness = null, fotos, accent, onIr = null, onEntrenar = null, onGuardarFitness = null, onEliminarObjetivo = null, focoEjercicio = null, onFocoEjercicioConsumido = null, focoObjetivo = null, onFocoObjetivoConsumido = null, focoVerObjetivo = null, onFocoVerObjetivoConsumido = null, onAddFoto = null, onDeleteFoto = null, protegidoFotos = false, pinHash = null, pinSalt = null, desbloqueadoFotos = false, onDesbloquearFotos = null, onOlvidoPin = null, perfil = null, onIrAHistorial = null, onIrARangos = null }) {
  const resumen = resumenProgreso(fotos);
  return (
    <ProgresoView
      fitness={fitness || {}}
      fotos={fotos}
      accent={accent}
      onEntrenar={onEntrenar}
      /* ⚠️ Sin `onIr` no se pinta el botón: un «Añadir foto» que no lleva a
         ninguna parte es peor que no ofrecerlo (regla 8). */
      onIrAFotos={onIr ? () => onIr(ESTADOS_VACIOS.progreso.accion.lleva) : null}
      resumenFotos={resumen}
      /* 🔓 FIT F26 — con estas dos, la pestaña Fotos es el diario visual; sin
         ellas se queda como la dejó la F12 (cuenta y lleva a Salud). */
      onAddFoto={onAddFoto}
      onDeleteFoto={onDeleteFoto}
      /* 🚨 Y su PIN, el MISMO de Salud (C-35). Sin estas props la galería se
         quedaba escondida sin puerta que abrir. */
      protegidoFotos={protegidoFotos}
      pinHash={pinHash}
      pinSalt={pinSalt}
      desbloqueadoFotos={desbloqueadoFotos}
      onDesbloquearFotos={onDesbloquearFotos}
      onOlvidoPin={onOlvidoPin}
      /* FIT F14 — los objetivos se guardan por la puerta de siempre. */
      onGuardarFitness={onGuardarFitness}
      onEliminarObjetivo={onEliminarObjetivo}
      /* FIT F18 — el ejercicio que llega desde el detalle muscular de Rangos. */
      focoEjercicio={focoEjercicio}
      onFocoEjercicioConsumido={onFocoEjercicioConsumido}
      /* 🔓 FIT F33, apartado 21 — el objetivo nuevo tras una sustitución. */
      focoObjetivo={focoObjetivo}
      onFocoObjetivoConsumido={onFocoObjetivoConsumido}
      /* 🔓 FIT F34 — y el objetivo que se abre desde la ficha de un ejercicio. */
      focoVerObjetivo={focoVerObjetivo}
      onFocoVerObjetivoConsumido={onFocoVerObjetivoConsumido}
      /* 🔓 FIT F28 — el centro de seguimiento lleva a los dos sitios que viven
         fuera de esta pantalla: el historial y los rangos (apartado 19). */
      perfil={perfil}
      onIrAHistorial={onIrAHistorial}
      onIrARangos={onIrARangos}
    />
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
  onGuardarFitness = null, onEliminarPlantilla = null, onEmpezarSesion = null,
  sesionEnCurso = null, onContinuarSesion = null, onDescartarSesion = null,
  sesionSinGuardar = null, onSeguirGuardando = null, onDescartarSinGuardar = null,
  onEliminarSesion = null,
  /* 🔓 FIT F34 — desde la ficha de un ejercicio se va a Progreso, a un objetivo
     o a clasificarlo: lo abre quien tiene esas pantallas, que es Fitness. */
  perfil = null, onVerProgresoEjercicio = null, onVerObjetivo = null,
  onCrearObjetivoEjercicio = null, onClasificarEjercicio = null,
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
  /* ⚠️ Qué subpantalla está abierta es estado de la pantalla, no un dato
     (EH F40): `DEFAULT_FITNESS` no tiene el campo, y volver a Fitness siempre
     te deja donde se entra, no donde lo dejaste hace dos semanas. */
  const [dentro, setDentro] = useState(null);
  /* 🔓 FIT F32 — la sesión hecha que se ha abierto desde Tu Plan. */
  const [sesionAbierta, setSesionAbierta] = useState(null);
  /* FIT F3, apartado 25 — el borrador se LEE al entrar y se OFRECE. Guardarlo
     y no volver a mencionarlo sería guardarlo para nada; y recuperarlo solo,
     sin preguntar, le pondría delante algo que quizá ya no quiere. */
  const [borrador, setBorrador] = useState(() => leerBorrador());
  const aMedias = borrador && borrador.lineas.length > 0;
  /* ⚠️ FIT F6 — las tres últimas plantillas, el plan activo y su ficha **se
     calculaban aquí** hasta esta fase. Ahora los resuelve `TuPlanView` con
     `tuPlan()`, que es quien los pinta: dejarlos escritos sin que los llamara
     nadie sería la función muerta de siempre (E3 F1 y E3 F5). */

  /* ── FIT F7 · empezar un entrenamiento ─────────────────────────────────
     🚨 La sesión se construye con `empezarSesion()`, que hace el **snapshot**
     del apartado 3: a partir de ahí la sesión ya no depende de que el plan o la
     plantilla sigan igual. ⚠️ Y las líneas que se le pasan son **las de la
     rutina**, no las de `lineasDeDia()`: aquéllas son texto para pintar —«4 × 8»,
     «Pecho 45 %»— y aquí hacen falta las series, el modo y el descanso. */
  const empezarDelPlan = (indice) => {
    if (!onEmpezarSesion) return;
    const resuelto = planActivoCompleto(fitness || {});
    if (!resuelto || !resuelto.plan) return;
    const ficha = sesionDelDia(resuelto.plan, indice, propios);
    if (!ficha || ficha.descanso) return;
    const rutina = diaARutina(resuelto.plan, indice, propios);
    onEmpezarSesion(empezarSesion({
      nombre: ficha.nombre,
      lineas: (rutina && rutina.lineas) || [],
      planId: resuelto.activo.planId,
      origenTipo: resuelto.origen,
      origenId: ficha.id,
      propios,
      entorno: resuelto.plan.entorno,
    }));
  };

  const empezarDePlantilla = (plantilla) => {
    if (!onEmpezarSesion || !plantilla) return;
    const rutina = planARutina(plantilla);
    if (!rutina || !rutina.lineas.length) return;
    onEmpezarSesion(empezarSesion({
      nombre: plantilla.nombre || 'Entrenamiento',
      lineas: rutina.lineas,
      planId: plantilla.id,
      origenTipo: 'plantilla',
      origenId: plantilla.id,
      propios,
      entorno: plantilla.entorno,
    }));
  };

  /* 🔓 FIT F10 — el historial (apartado 2: *"Entrenamiento → Historial"*).
     ⚠️ El botón del estado vacío (apartado 9) **lleva al flujo real**: si hoy
     toca entrenar, empieza el de hoy; si no, vuelve a Tu Plan, que es donde se
     elige qué entrenar. Nunca un botón que no hace nada. */
  if (dentro === 'historial') {
    const empezarDesdeHistorial = () => {
      const tp = tuPlan(fitness || {});
      if (tp.proximo && tp.proximo.esHoy && tp.proximo.indice !== null && onEmpezarSesion) {
        empezarDelPlan(tp.proximo.indice);
      } else {
        setDentro(null);
      }
    };
    return (
      <HistorialView
        fitness={fitness || {}}
        propios={propios}
        accent={accent}
        onVolver={() => setDentro(null)}
        onEmpezar={empezarDesdeHistorial}
        onEliminar={onEliminarSesion}
      />
    );
  }

  /* 🔓 FIT F32, apartado 37 — *"Desde cada sesión: → detalle histórico […] No
     duplicar pantallas."* Es el de la F10, con el botón que dice adónde vuelve
     (la lección de la F31 con Progreso). */
  if (sesionAbierta) {
    const s = sesionDelHistorial(fitness || {}, sesionAbierta);
    return (
      <div className="max-w-2xl mx-auto">
        {s ? (
          <DetalleSesionHistorial
            detalle={detalleDeSesion(s, { fitness: fitness || {}, propios })}
            accent={accent}
            onVolver={() => setSesionAbierta(null)}
            onEliminar={null}
            volverTexto="Tu Plan"
            volverEtiqueta="Volver a Tu Plan"
          />
        ) : (
          <div className="space-y-3">
            <EmptyHint text="Ese entrenamiento ya no está." />
            <GhostBtn icon={ChevronLeft} onClick={() => setSesionAbierta(null)}>Volver</GhostBtn>
          </div>
        )}
      </div>
    );
  }

  if (dentro === 'ejercicios') {
    /* 🔓 FIT F34 — la biblioteca, con lo que necesita para ser útil: sus datos
       (recientes, favoritos, su progreso) y las puertas de la ficha. «Crear uno
       nuevo» abre el constructor con el ejercicio dentro; no empieza a entrenar
       (apartado 21). */
    return (
      <EjerciciosView
        propios={propios}
        accent={accent}
        onVolver={() => setDentro(null)}
        fitness={fitness}
        perfil={perfil}
        onGuardarFitness={onGuardarFitness}
        onAbrirConstructor={onAbrirConstructor}
        onVerProgreso={onVerProgresoEjercicio}
        onVerObjetivo={onVerObjetivo}
        onCrearObjetivo={onCrearObjetivoEjercicio}
        onClasificar={onClasificarEjercicio}
        diagnostico={esDesarrollo()}
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
        onEmpezar={onEmpezarSesion ? empezarDePlantilla : null}
      />
    );
  }

  /* FIT F5 — la biblioteca de planificaciones (apartado 20: *"Desde
     Entrenamiento → Más planes debe poder accederse a esta biblioteca"*).
     ⚠️ Escribir es de `App.jsx`: aquí solo se le pasa el `fitness` siguiente. */
  if (dentro === 'planificaciones') {
    return (
      <BibliotecaPlanesView
        fitness={fitness || {}}
        accent={accent}
        onVolver={() => setDentro(null)}
        onUsar={onGuardarFitness ? (planId, opciones) => {
          const r = usarPlan(fitness || {}, planId, opciones);
          if (r.ok) onGuardarFitness(r.fitness);
        } : null}
        onPersonalizar={onGuardarFitness ? (planId) => {
          const r = personalizarPreset(fitness || {}, planId);
          /* Apartado 15: la copia aparece en Tus plantillas, así que se lleva
             ahí directamente — si no, habría que buscarla a ciegas. */
          if (r.ok) { onGuardarFitness(r.fitness); setDentro('plantillas'); }
        } : null}
        onFavorito={onGuardarFitness
          ? (planId) => onGuardarFitness(alternarFavoritoPlan(fitness || {}, planId))
          : null}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* 🚨 FIT F7, apartado 30 — *"Simplemente evitar que una sesión activa
          desaparezca."* Se busca en lo guardado, así que sobrevive a recargar y
          a cerrar la aplicación: la sesión ES el dato, no un rastro aparte. */}
      {sesionEnCurso && onContinuarSesion && (
        <SesionRecuperable
          sesion={sesionEnCurso}
          accent={accent}
          onContinuar={onContinuarSesion}
          onDescartar={onDescartarSesion || (() => {})}
        />
      )}

      {/* 🚨 FIT F8, apartado 28 — *"Si la aplicación se cierra en la pantalla de
          finalización antes de guardar: la información debe seguir
          recuperable."* ⚠️ Y **se dice distinto** que la de arriba: ésta ya no
          se entrena, se guarda. «Continuar entrenamiento» aquí le devolvería a
          la tabla de series algo que ya había terminado. */}
      {sesionSinGuardar && onSeguirGuardando && (
        <SesionRecuperable
          sesion={sesionSinGuardar}
          accent={accent}
          textos={AVISO_RECUPERAR_FINAL}
          onContinuar={onSeguirGuardando}
          onDescartar={onDescartarSinGuardar || (() => {})}
        />
      )}

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

      {/* FIT F6 — «Tu Plan» entero: el plan activo, el próximo entrenamiento, la
          semana con sus estados, la sesión de un día, la distribución semanal y
          el acceso a Tus plantillas. 🚨 **Se renderiza, no se copia** (E3 F23):
          la pantalla vive en su archivo y aquí solo se le pasan las acciones.
          ⚠️ Y sustituye a las dos secciones que dejaron la F4 y la F5 —«Tu Plan»
          con su tarjeta y «Tus plantillas» con sus tres últimas—: mantenerlas
          habría dejado **dos listas de plantillas en la misma pantalla**, que es
          la redundancia de la E3 F30. */}
      <TuPlanView
        fitness={fitness || {}}
        accent={accent}
        onExplorar={() => setDentro('planificaciones')}
        onCambiarPlan={() => setDentro('planificaciones')}
        onVerPlantillas={() => setDentro('plantillas')}
        onCrear={onAbrirConstructor ? () => onAbrirConstructor(null) : null}
        onQuitar={onGuardarFitness ? () => onGuardarFitness(quitarPlanActivo(fitness || {})) : null}
        onEmpezar={onEmpezarSesion ? empezarDelPlan : null}
        onVerSesion={(id) => setSesionAbierta(id)}
        /* 🔓 FIT F32, apartado 23 — «Editar plan»: una plantilla suya se abre en
           el constructor; un plan de la biblioteca no se edita, así que se
           lleva a elegir otro. */
        onEditarPlan={(() => {
          const r = planActivoCompleto(fitness || {});
          if (!r) return null;
          if (r.origen === 'plantilla') {
            const pl = ((fitness || {}).plantillas || []).find((x) => x && x.id === r.activo.planId);
            return pl && onAbrirConstructor ? () => onAbrirConstructor(planARutina(pl)) : null;
          }
          return () => setDentro('planificaciones');
        })()}
      />

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
  onEliminarPlantilla = null, onEliminarSesion = null, onEliminarObjetivo = null,
  perfil = null,
  /* 🚨 FIT F26 (C-35), CORREGIDO EN LA F27 — las fotos de progreso son las de
     Salud, y **su protección también**: las cinco props del PIN son las mismas
     que recibe `HealthView`. Antes llegaba `onAddFoto: null` con el PIN puesto
     y la galería simplemente no se pintaba, **sin forma de desbloquearla**. */
  onAddFoto = null, onDeleteFoto = null,
  protegidoFotos = false, pinHash = null, pinSalt = null,
  desbloqueadoFotos = false, onDesbloquearFotos = null, onOlvidoPin = null,
}) {
  const [area, setArea] = useState(AREA_INICIAL);
  /* 🔓 **FIT F18 — el foco muscular se retira.** La F16 mandaba el grupo a
     Progreso para abrir allí el detalle de la F13; la F18 construye el detalle
     de rangos **dentro de Rangos** (su apartado 1), así que ese viaje ya no
     ocurre. El de Progreso sigue donde estaba, entrando por Progreso →
     Músculos: son dos preguntas distintas sobre el mismo músculo. */
  /* FIT F18 — y el ejercicio que se abre desde el detalle muscular de Rangos:
     lleva a la pantalla de progreso de la F12, que ya existe (su apartado 11). */
  const [focoEjercicio, setFocoEjercicio] = useState(null);
  /* 🔓 FIT F33, apartado 21 — el ejercicio para el que crear un objetivo nuevo
     al sustituir. Estado de pantalla: se consume al abrir el formulario. */
  const [focoObjetivo, setFocoObjetivo] = useState(null);
  /* 🔓 FIT F34 — el objetivo que se abre desde la ficha de un ejercicio. */
  const [focoVerObjetivo, setFocoVerObjetivo] = useState(null);
  /* FIT F17 — si está contestando el cuestionario. Estado de pantalla: lo que se
     guarda son las respuestas, una a una, según las contesta. */
  const [clasificando, setClasificando] = useState(false);

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
  /* 🚨 FIT F7 — y lo mismo con el entrenamiento en vivo: lo que se guarda es
     **la sesión** (en `fitness.sesiones`, apartado 29); lo que es de la pantalla
     es **cuál está abierta**. Por eso aquí solo vive el id: la sesión se lee de
     lo guardado, y así el cronómetro, los pesos y las series marcadas siguen
     estando después de recargar (apartado 30). */
  const [entrenando, setEntrenando] = useState(null);

  const racha = rachaDeFitness(rachas);
  /* 🔓 FIT F16 — `fitness.rangos` ya no se lee aquí. Los rangos **se calculan**
     desde las sesiones (F15); el campo sigue en el modelo porque lo escribió la
     F1 y borrarlo sin migración rompería datos guardados, pero pintarlo sería
     enseñar una copia vieja de algo que se sabe calcular ahora mismo. */
  /* 🚨 Lo que se crea Josué vive en `plantillas`, no en `planes`: la F1 dejó esa
     división escrita, y `planes` es la biblioteca de una fase posterior. */
  const plantillas = (fitness?.plantillas) || [];
  const propios = (fitness?.ejercicios) || [];
  const entrenoProps = {
    calistenia, onUpdateSkill, futbol, onAddPartido, onDeletePartido,
    videos, onAddVideo, onDeleteVideo, onSetVideoFeedback, foco, onFocoConsumido,
  };

  /* ⚠️ La sesión sale de lo GUARDADO, nunca de una copia en el estado de la
     pantalla: con dos, marcar una serie escribiría en una y se pintaría la otra
     (apartado 28, *"una fuente de verdad única"*). */
  const sesiones = (fitness?.sesiones) || [];
  const enVivo = entrenando ? sesiones.find((s) => s && s.id === entrenando) || null : null;
  /* Apartado 30 de la F7 — la que quedó a medias entrenando; y el 28 de la F8
     —la que quedó TERMINADA y sin guardar—. ⚠️ **Son dos cosas distintas y se
     dicen distinto**: a una se vuelve a entrenar, a la otra se vuelve a
     guardar. Con un solo aviso, «Continuar entrenamiento» le devolvería a la
     tabla de series un entrenamiento que ya había terminado. */
  const pendiente = sesionActiva(fitness || {});
  const sinGuardar = sesionEnFinalizacion(fitness || {});

  const guardarSesionViva = (sesion) => {
    if (!onGuardarFitness) return;
    onGuardarFitness(guardarSesion(fitness || {}, sesion));
  };

  const empezar = (sesion) => {
    if (!sesion) return;
    guardarSesionViva(sesion);
    setEntrenando(sesion.id);
  };

  /* 🚨 FIT F7 — el entrenamiento en vivo es PANTALLA ENTERA, sin las pestañas
     de Fitness, por el mismo motivo que el constructor: dejarlas debajo
     permitiría irse a Rangos en mitad de una serie. Va DESPUÉS de todos los
     hooks (regla 4). */
  if (enVivo && (enVivo.estado === 'en_curso' || enVivo.estado === 'pausada')) {
    return (
      <EntrenamientoVivoView
        sesion={enVivo}
        propios={propios}
        accent={accent}
        onGuardar={guardarSesionViva}
        /* Apartado 31 — salir NO la marca como completada: se queda en curso y
           la tarjeta de recuperación la vuelve a ofrecer. */
        onSalir={() => setEntrenando(null)}
        /* 🔓 FIT F8 — Terminar deja la sesión en `finalizando` y **se queda en
           esta pantalla**: el `if` de abajo la recoge y pinta el resumen. */
        onTerminada={(s) => setEntrenando(s.id)}
        /* 🔓 FIT F30, apartado 36 — el objetivo del ejercicio que está haciendo,
           **como función**: la pantalla cambia de ejercicio sola y la vista no
           recibe `fitness` (ni lo necesita, porque aquí no se calcula nada).
           ⚠️ Y devuelve solo dos textos: *"No interferir con la tabla de
           series. El objetivo no debe modificar automáticamente la rutina."* */
        objetivoActivoDe={(exerciseId) => objetivoEnVivo(fitness, exerciseId, { propios })}
        /* 🔓 FIT F33, apartado 21 — al sustituir un ejercicio con objetivo.
           🚨 Cancelarlo va **en la misma escritura** que la sesión: dos
           guardados seguidos parten del mismo `fitness` y el segundo borraría
           el primero (E3 F26). Y «Crear uno nuevo» deja la sesión en curso —la
           tarjeta de recuperación la ofrece al volver— y abre el formulario. */
        onCancelarObjetivo={onGuardarFitness
          ? (objetivoId, sesionNueva) => onGuardarFitness(cancelarObjetivo(guardarSesion(fitness || {}, sesionNueva), objetivoId))
          : null}
        onCrearObjetivo={onGuardarFitness
          ? (exerciseId) => { setEntrenando(null); setFocoObjetivo(exerciseId); setArea('progreso'); }
          : null}
      />
    );
  }

  /* 🚨 FIT F8 — el resumen. Es pantalla entera por lo mismo que el
     entrenamiento: con las pestañas debajo se podría uno ir a Rangos con una
     sesión terminada y sin guardar.

     🐛 **Y la condición incluye `completada`, que es un fallo real que cazó el
     recorrido.** Al guardar, la sesión pasa a `completada`, `fitness` cambia y
     este `if` dejaba de cumplirse: `FinalizacionView` **se desmontaba antes de
     poder pintar su pantalla de éxito**, así que el apartado 19 no se veía
     nunca — y la sesión quedaba guardada, con la pantalla volviendo sola a
     Entrenamiento. Se sale de aquí **pulsando**, no porque cambie el dato. */
  if (enVivo && (enVivo.estado === 'finalizando' || enVivo.estado === 'completada')) {
    return (
      <FinalizacionView
        sesion={enVivo}
        propios={propios}
        accent={accent}
        onGuardar={guardarSesionViva}
        onDescartar={(s) => { guardarSesionViva(s); setEntrenando(null); }}
        /* Apartados 25 y 26 — se puede volver a entrenar en vez de guardar. */
        onSeguir={() => guardarSesionViva({ ...enVivo, estado: 'en_curso', terminadaEn: null })}
        onVolver={() => setEntrenando(null)}
      />
    );
  }

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

  /* 🚨 FIT F17 — el cuestionario es PANTALLA ENTERA, por el mismo motivo que el
     constructor y el entrenamiento en vivo: con las pestañas debajo, media
     pregunta contestada se pierde de un toque. Va después de todos los hooks
     (regla 4). */
  if (clasificando) {
    return (
      <ClasificacionView
        fitness={fitness}
        propios={propios}
        perfil={perfil}
        accent={accent}
        onGuardarFitness={onGuardarFitness}
        onVolver={() => setClasificando(false)}
        /* 🔓 FIT F34, apartado 25 — «Clasificar» desde la ficha de un ejercicio
           entra directamente a su pregunta. */
        ejercicioInicial={typeof clasificando === 'string' ? clasificando : null}
      />
    );
  }

  return (
    <div className="space-y-1">
      <CabeceraFitness titulo="Fitness" racha={racha} accent={accent} />
      <PestanasFitness areas={AREAS_FITNESS} activa={area} onCambiar={setArea} accent={accent} />

      {area === 'rangos' && (
        <AreaRangos
          fitness={fitness}
          perfil={perfil}
          accent={accent}
          /* 🔓 FIT F18 — el detalle de un grupo se abre dentro de Rangos, así
             que esto ya no manda a Progreso; el foco muscular sigue existiendo
             para quien quiera la pantalla de la F13. */
          onEjercicio={(id) => { setFocoEjercicio(id); setArea('progreso'); }}
          onEntrenar={() => setArea('entrenamiento')}
          /* ⚠️ Sin `onGuardarFitness` no se ofrece: un cuestionario que no puede
             guardar la respuesta sería un control decorativo (regla 8). */
          onClasificar={onGuardarFitness ? () => setClasificando(true) : null}
        />
      )}
      {area === 'progreso' && (
        <AreaProgreso
          fitness={fitness}
          fotos={fotos}
          accent={accent}
          onIr={onIr}
          /* FIT F28 — el motor de rangos necesita el perfil para las marcas de
             peso corporal, y los dos destinos de fuera de Progreso. */
          perfil={perfil}
          onIrAHistorial={() => setDentro('historial')}
          onIrARangos={() => setArea('rangos')}
          focoEjercicio={focoEjercicio}
          onFocoEjercicioConsumido={() => setFocoEjercicio(null)}
          focoObjetivo={focoObjetivo}
          onFocoObjetivoConsumido={() => setFocoObjetivo(null)}
          focoVerObjetivo={focoVerObjetivo}
          onFocoVerObjetivoConsumido={() => setFocoVerObjetivo(null)}
          /* FIT F12, apartado 5 — «Entrenar ahora» lleva a Entrenamiento, donde se empieza. */
          onEntrenar={() => setArea('entrenamiento')}
          onGuardarFitness={onGuardarFitness}
          onEliminarObjetivo={onEliminarObjetivo}
          onAddFoto={onAddFoto}
          onDeleteFoto={onDeleteFoto}
          protegidoFotos={protegidoFotos}
          pinHash={pinHash}
          pinSalt={pinSalt}
          desbloqueadoFotos={desbloqueadoFotos}
          onDesbloquearFotos={onDesbloquearFotos}
          onOlvidoPin={onOlvidoPin}
        />
      )}
      {area === 'entrenamiento' && (
        <AreaEntrenamiento
          fitness={fitness} calistenia={calistenia} accent={accent} entrenoProps={entrenoProps}
          onGuardarFitness={onGuardarFitness}
          onEliminarPlantilla={onEliminarPlantilla}
          onEliminarSesion={onEliminarSesion}
          onAbrirConstructor={onGuardarFitness
            ? (rutina) => setCreando({ rutina: rutina || crearRutina({}) })
            : null}
          onEmpezarSesion={onGuardarFitness ? empezar : null}
          sesionSinGuardar={sinGuardar}
          onSeguirGuardando={sinGuardar ? () => setEntrenando(sinGuardar.id) : null}
          onDescartarSinGuardar={sinGuardar && onGuardarFitness ? () => {
            const r = descartarEntrenamiento(sinGuardar, { confirmado: true });
            if (r.ok) onGuardarFitness(guardarSesion(fitness || {}, r.sesion));
          } : null}
          sesionEnCurso={pendiente}
          onContinuarSesion={pendiente ? () => setEntrenando(pendiente.id) : null}
          onDescartarSesion={pendiente && onGuardarFitness ? () => {
            const r = descartarSesion(pendiente, { confirmado: true });
            if (r.ok) onGuardarFitness(guardarSesion(fitness || {}, r.sesion));
          } : null}
          /* 🔓 FIT F34 — las cuatro puertas de la ficha de un ejercicio. */
          perfil={perfil}
          onVerProgresoEjercicio={(id) => { setFocoEjercicio(id); setArea('progreso'); }}
          onVerObjetivo={(objetivoId) => { setFocoVerObjetivo(objetivoId); setArea('progreso'); }}
          onCrearObjetivoEjercicio={onGuardarFitness ? (id) => { setFocoObjetivo(id); setArea('progreso'); } : null}
          onClasificarEjercicio={onGuardarFitness ? (id) => setClasificando(id) : null}
        />
      )}
    </div>
  );
}
