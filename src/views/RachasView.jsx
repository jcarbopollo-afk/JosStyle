// ============================================================================
// RA · Fase 4/4 — CENTRO DE RACHAS
//
// Cierra el bloque. Las tres fases anteriores construyeron el motor, la
// persistencia y la gamificación; esto es lo único que Josué ve.
//
// *"La estética debe seguir la identidad actual de la aplicación: premium +
// moderna + minimalista + deportiva + elegante + rápida + móvil-first. No crees
// un diseño visual independiente."* (apartados 1 y 22)
//
// Por eso aquí no hay ni un color suelto ni un componente nuevo que duplique
// otro: `Card`, `PrimaryButton`, `GhostBtn`, `ListRow` y los tokens de
// `COLORS` son los mismos de toda la app. Lo único propio son las piezas que no
// existían: la tarjeta de racha, el calendario compacto y la celebración.
//
// ── LO QUE NO HACE, Y ES DELIBERADO ────────────────────────────────────────
//
// · **No suena** (apartados 20 y 38). Emite eventos; el sistema de audio los
//   escuchará cuando exista. Ni un archivo de audio en un componente.
// · **No vibra** (apartado 21). Mismo criterio.
// · **No calcula nada.** Todos los números vienen de `rachasGamificacion.js`,
//   que a su vez los deriva del historial. Si esta pantalla dijera un número
//   distinto del Dashboard, sería porque alguien contó por su cuenta — y aquí
//   nadie cuenta.
// ============================================================================

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Flame, Trophy, ChevronRight, ArrowLeft, Plus, Check, Trash2, Lock, Target } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba, todayISO } from '../lib/helpers';
import { Card, SectionTitle, Field, TextInput, Select, PrimaryButton, GhostBtn, ListRow } from '../components/ui';
import { TIPOS_RACHA, ESTADOS_RACHA, ESTADOS_DIA, CLASES_REGLA } from '../lib/rachas';
import { panelRachas, panelHabitos } from '../lib/rachasServicio';
import { mantenimientoHoy, textoMantenimiento, feedbackDeSubida, DURACION_FEEDBACK_MS } from '../lib/rachasHoy';
import {
  panelGamificacion, diasDelMes, progresoHaciaHito,
  ESTADOS_LOGRO, definicionLogro, EVENTOS_GAMIFICACION, NIVELES_CELEBRACION,
} from '../lib/rachasGamificacion';

/* ---------------------------------------------------------------------------
   Apartado 5 — *"No uses únicamente colores. Combina iconos, texto, animación,
   jerarquía y estados."* Es también el apartado 24 (accesibilidad): un estado
   que solo se distingue por el color no existe para quien no distingue ese
   color. Cada estado lleva su palabra y su forma, no solo su tinte.
   --------------------------------------------------------------------------- */
const PRESENTACION_ESTADO = {
  [ESTADOS_RACHA.ACTIVA]: { texto: 'Al día', tono: 'positivo', icono: Flame },
  [ESTADOS_RACHA.NUEVA]: { texto: 'Recién empezada', tono: 'positivo', icono: Flame },
  [ESTADOS_RACHA.PENDIENTE]: { texto: 'Hoy pendiente', tono: 'aviso', icono: Target },
  [ESTADOS_RACHA.ROTA]: { texto: 'Terminada', tono: 'neutro', icono: Trophy },
  [ESTADOS_RACHA.SIN_DATOS]: { texto: 'Sin empezar', tono: 'neutro', icono: Target },
};

const colorDeTono = (tono, accent) => {
  if (tono === 'positivo') return accent;
  if (tono === 'aviso') return COLORS.warning || COLORS.textMuted;
  return COLORS.textMuted;
};

const plural = (n, uno, varios) => (n === 1 ? uno : varios);

/* ===========================================================================
   BARRA DE PROGRESO HACIA EL SIGUIENTE HITO (apartado 11)
   ===========================================================================
   El porcentaje viene calculado de `progresoHaciaHito`, que lo mide desde el
   hito anterior (RA F3). Aquí solo se pinta.

   Sin hito siguiente no se dibuja nada: quien lleva 400 días no tiene barra que
   llenar, y fingir una sería inventarse un objetivo (regla 8). */
function BarraHito({ hito, accent }) {
  if (!hito) return null;
  return (
    <div className="mt-2">
      <div
        className="rounded-full overflow-hidden"
        style={{ height: 6, background: hexToRgba(accent, 0.15) }}
        role="progressbar"
        aria-valuenow={hito.progreso}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${hito.faltan} ${plural(hito.faltan, 'día', 'días')} para el hito de ${hito.objetivo}`}
      >
        {/* La transición la gobierna el ajuste global de animaciones y
            `prefers-reduced-motion` desde `index.css`: no hay un segundo sistema
            de animaciones (apartado 17). */}
        <div style={{ width: `${hito.progreso}%`, height: '100%', background: accent, transition: 'width .35s var(--ease-premium, ease)' }} />
      </div>
      <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>
        {hito.faltan} {plural(hito.faltan, 'día', 'días')} para los {hito.objetivo}
      </p>
    </div>
  );
}

/* ===========================================================================
   TARJETA DE RACHA (apartados 4 y 5)
   ===========================================================================
   *"No codifiques una tarjeta exclusivamente para entrenamiento. Debe funcionar
   para Entrenamiento, Estudio, Sueño, Hábitos, Nutrición, etc."*

   Recibe un resumen —el que devuelve el motor— y no sabe de qué módulo viene.
   Por eso sirve igual para una racha creada aquí que para un hábito de
   Productividad, que es un dato de otro sitio con otra forma. */
export function TarjetaRacha({ resumen, accent, onAbrir, compacta = false }) {
  const p = PRESENTACION_ESTADO[resumen.estado] || PRESENTACION_ESTADO[ESTADOS_RACHA.SIN_DATOS];
  const Icono = p.icono;
  const color = colorDeTono(p.tono, accent);
  const hito = resumen.hito || progresoHaciaHito(resumen.actual);

  const contenido = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{resumen.nombre}</p>
          <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color }}>
            <Icono size={11} className="flex-shrink-0" />
            {p.texto}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold leading-none" style={{ color: resumen.actual > 0 ? accent : COLORS.textMuted }}>
            {resumen.actual}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>
            {plural(resumen.actual, 'día', 'días')}
          </p>
        </div>
        {onAbrir && <ChevronRight size={15} style={{ color: COLORS.textMuted }} className="flex-shrink-0" />}
      </div>

      {!compacta && <BarraHito hito={hito} accent={accent} />}

      {/* Apartado 12 — el récord se destaca, pero sin competir con la racha
          actual: va pequeño y debajo. Y solo si hay uno mayor que contar. */}
      {!compacta && resumen.record > resumen.actual && (
        <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: COLORS.textMuted }}>
          <Trophy size={11} /> Tu mejor: {resumen.record} {plural(resumen.record, 'día', 'días')}
        </p>
      )}
      {!compacta && resumen.batiendoRecord && (
        <p className="text-[11px] mt-1.5 font-semibold flex items-center gap-1" style={{ color: accent }}>
          <Trophy size={11} /> Estás batiendo tu récord
        </p>
      )}
    </>
  );

  if (!onAbrir) return <Card>{contenido}</Card>;
  return (
    <Card>
      <button onClick={onAbrir} className="w-full text-left" aria-label={`Abrir ${resumen.nombre}`}>
        {contenido}
      </button>
    </Card>
  );
}

/* ===========================================================================
   RESUMEN PARA LA PANTALLA DE HOY (apartado 3)
   ===========================================================================
   *"Debe ser visible pero no dominar toda la pantalla."*

   Una tarjeta, la racha principal, y un enlace al Centro. Si no hay ninguna
   racha viva no se pinta nada: una tarjeta que dice "0 días" todos los días
   deja de significar nada y ocupa sitio en una pantalla de iPhone.

   El apartado 29 pide además el recordatorio de día pendiente, *"y no mostrarlo
   si ya está completado"*. Eso sale del estado, no de una bandera aparte. */
/* ⚠️ **Entrega 3 · Fase 2 (apartados 1-5)** — este bloque, que ya existía desde
   RA F4, es el que la fase pide *"dentro del apartado principal Hoy"*. **No se
   crea uno nuevo**: el enunciado dice *"o una representación equivalente más
   integrada con el diseño actual"*, y montar una segunda tarjeta de rachas en
   Hoy sería exactamente el *"Dashboard lleno de elementos innecesarios"* que su
   apartado 2 quiere evitar.

   Lo que se añade es la pregunta que nadie contestaba: **cuántas rachas piden
   una acción HOY**, con sus dos estados (apartado 5). El resumen de la racha
   principal se queda debajo, como estaba.

   ⚠️ **Y ahora se pinta también sin racha viva.** Antes salía solo si la
   principal llevaba días; con tres rachas recién creadas y todas a cero, Josué
   no veía nada que le recordara mantenerlas — que es justo lo que esta fase
   pide. Sigue sin pintarse cuando no hay ninguna racha activa (apartado 2). */
export function ResumenRachaHoy({ rachas, habitos, accent, onAbrir, hoy = todayISO() }) {
  const principal = useMemo(() => {
    const dePanel = panelRachas(rachas, hoy).principal;
    const deHabitos = panelHabitos(habitos, hoy).principal;
    const candidatos = [dePanel, deHabitos].filter(Boolean);
    return candidatos.sort((a, b) => (b.actual - a.actual) || (b.record - a.record))[0] || null;
  }, [rachas, habitos, hoy]);

  const mantenimiento = useMemo(() => mantenimientoHoy(rachas, habitos, hoy), [rachas, habitos, hoy]);
  const texto = textoMantenimiento(mantenimiento);
  const hayPrincipal = !!principal && principal.actual > 0;

  // Apartado 2 — sin nada que mantener y sin racha viva, el bloque no existe.
  if (!texto && !hayPrincipal) return null;

  const pendiente = hayPrincipal && principal.estadoHoy === ESTADOS_DIA.PENDIENTE;
  const hito = hayPrincipal ? progresoHaciaHito(principal.actual) : null;

  return (
    <Card style={{ border: `1px solid ${hexToRgba(accent, 0.35)}`, background: hexToRgba(accent, 0.06) }}>
      {/* Apartado 3 — un solo toque lleva al Centro de Rachas. Ni una pantalla
          intermedia: allí es donde se registra. */}
      <button onClick={onAbrir} className="w-full text-left" aria-label="Abrir el Centro de Rachas">
        {texto && (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: COLORS.text }}>
                <Flame size={15} style={{ color: accent, flexShrink: 0 }} />
                {texto.titulo}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>{texto.detalle}</p>
            </div>
            <ChevronRight size={15} style={{ color: COLORS.textMuted }} className="flex-shrink-0" />
          </div>
        )}

        {hayPrincipal && (
          <div className={`flex items-center justify-between gap-3${texto ? ' mt-2 pt-2' : ''}`} style={texto ? { borderTop: `1px solid ${hexToRgba(accent, 0.2)}` } : undefined}>
            <div className="min-w-0">
              <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: COLORS.text }}>
                {!texto && <Flame size={15} style={{ color: accent, flexShrink: 0 }} />}
                {principal.actual} {plural(principal.actual, 'día', 'días')} · {principal.nombre}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>
                {pendiente
                  ? 'Complétalo hoy para mantener la racha.'
                  : principal.record > principal.actual
                    ? `Tu mejor: ${principal.record} días`
                    : 'Vas por tu mejor marca.'}
              </p>
            </div>
            {!texto && <ChevronRight size={15} style={{ color: COLORS.textMuted }} className="flex-shrink-0" />}
          </div>
        )}
        {hito && <BarraHito hito={hito} accent={accent} />}
      </button>
    </Card>
  );
}

/* ===========================================================================
   CALENDARIO COMPACTO (apartados 9 y 10)
   ===========================================================================
   *"NO HACER UN CALENDARIO GIGANTE. Debe ser compacto."*

   Una rejilla de siete columnas con un punto por día. Sin emojis: el apartado 9
   los propone *"pero quiero algo más elegante si el sistema de iconografía
   actual permite algo mejor"*, y una rejilla de puntos con color y forma dice lo
   mismo ocupando la mitad y leyéndose de un vistazo.

   Los estados NO se distinguen solo por color (apartado 24): completado es un
   punto lleno, perdido un aro, pendiente un aro con borde marcado y futuro casi
   invisible. Y cada celda lleva su `title` y su `aria-label`. */
const NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function CalendarioRacha({ rachas, rachaId, accent, hoy = todayISO() }) {
  const [anio, mes] = useMemo(() => { const [a, m] = hoy.split('-'); return [Number(a), Number(m)]; }, [hoy]);
  const [ver, setVer] = useState({ anio, mes });

  const dias = useMemo(() => diasDelMes(rachas, rachaId, ver.anio, ver.mes, hoy), [rachas, rachaId, ver, hoy]);
  if (!dias.length) return null;

  // Lunes primero, como en España. `getDay()` da 0 para domingo.
  const primerDia = new Date(`${ver.anio}-${String(ver.mes).padStart(2, '0')}-01T00:00:00`).getDay();
  const huecos = (primerDia + 6) % 7;

  const mover = (n) => {
    let m = ver.mes + n;
    let a = ver.anio;
    if (m < 1) { m = 12; a--; }
    if (m > 12) { m = 1; a++; }
    setVer({ anio: a, mes: m });
  };

  const estiloDia = (estado) => {
    if (estado === ESTADOS_DIA.COMPLETADO) return { background: accent, border: `1px solid ${accent}` };
    if (estado === ESTADOS_DIA.PENDIENTE) return { background: 'transparent', border: `2px solid ${accent}` };
    if (estado === ESTADOS_DIA.PERDIDO) return { background: 'transparent', border: `1px solid ${COLORS.border}` };
    return { background: 'transparent', border: `1px dashed ${COLORS.border}`, opacity: 0.4 };
  };
  const nombreEstado = {
    [ESTADOS_DIA.COMPLETADO]: 'completado',
    [ESTADOS_DIA.PENDIENTE]: 'pendiente',
    [ESTADOS_DIA.PERDIDO]: 'no cumplido',
    [ESTADOS_DIA.FUTURO]: 'todavía no',
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => mover(-1)} className="p-1.5 rounded-lg" aria-label="Mes anterior">
          <ArrowLeft size={14} style={{ color: COLORS.textMuted }} />
        </button>
        <p className="text-xs font-semibold" style={{ color: COLORS.text }}>
          {NOMBRES_MES[ver.mes - 1]} {ver.anio}
        </p>
        <button onClick={() => mover(1)} className="p-1.5 rounded-lg" aria-label="Mes siguiente">
          <ChevronRight size={14} style={{ color: COLORS.textMuted }} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
          <p key={i} className="text-[10px] text-center" style={{ color: COLORS.textMuted }} aria-hidden="true">{d}</p>
        ))}
        {Array.from({ length: huecos }).map((_, i) => <span key={`h${i}`} aria-hidden="true" />)}
        {dias.map((d) => (
          <span
            key={d.fecha}
            className="rounded-full mx-auto"
            style={{ width: 18, height: 18, ...estiloDia(d.estado) }}
            title={`${d.dia} · ${nombreEstado[d.estado]}`}
            role="img"
            aria-label={`Día ${d.dia}, ${nombreEstado[d.estado]}`}
          />
        ))}
      </div>

      {/* Sin leyenda, un color no dice nada. */}
      <div className="flex flex-wrap gap-3 mt-3">
        {[ESTADOS_DIA.COMPLETADO, ESTADOS_DIA.PENDIENTE, ESTADOS_DIA.PERDIDO].map((e) => (
          <span key={e} className="flex items-center gap-1.5 text-[10px]" style={{ color: COLORS.textMuted }}>
            <span className="rounded-full" style={{ width: 10, height: 10, ...estiloDia(e) }} aria-hidden="true" />
            {nombreEstado[e]}
          </span>
        ))}
      </div>
    </Card>
  );
}

/* ===========================================================================
   LOGROS (apartados 13 y 14)
   ===========================================================================
   *"Desbloqueados con apariencia destacada. Bloqueados más discretos."*

   Los ocultos llegan aquí ya como "???" desde RA F3: esta pantalla no sabe de
   qué van, así que no puede filtrarse por descuido.

   ⚠️ Estos son los logros DE LAS RACHAS, y viven aquí. Los doce de la Fase 20
   —Diario, Objetivos, Nutrición…— siguen en su pantalla de Logros y no se tocan:
   son de toda la app, no de las rachas, y juntarlos mezclaría dos cosas
   distintas en una lista larguísima. */
function TarjetaLogro({ logro, accent, onAbrir }) {
  const desbloqueado = logro.estado === ESTADOS_LOGRO.DESBLOQUEADO;
  return (
    <button
      onClick={() => onAbrir(logro)}
      className="rounded-2xl p-3 text-left w-full"
      style={{
        background: desbloqueado ? hexToRgba(accent, 0.1) : COLORS.surface2,
        border: `1px solid ${desbloqueado ? accent : COLORS.border}`,
        opacity: desbloqueado ? 1 : 0.75,
      }}
      aria-label={`${logro.titulo}${desbloqueado ? ', conseguido' : ', por conseguir'}`}
    >
      <div className="flex items-center gap-2">
        {desbloqueado
          ? <Trophy size={14} style={{ color: accent, flexShrink: 0 }} />
          : <Lock size={14} style={{ color: COLORS.textMuted, flexShrink: 0 }} />}
        <p className="text-xs font-semibold truncate" style={{ color: COLORS.text }}>{logro.titulo}</p>
      </div>
      {logro.rachaNombre && (
        <p className="text-[10px] mt-0.5 truncate" style={{ color: COLORS.textMuted }}>{logro.rachaNombre}</p>
      )}
      {/* Apartado 13: *"Los logros bloqueados pueden mostrar progreso cuando
          exista."* Cuando no existe, no se inventa una barra. */}
      {logro.progreso && (
        <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
          {logro.progreso.actual} / {logro.progreso.meta}
        </p>
      )}
    </button>
  );
}

/* Apartado 14 — *"No hagas una ventana enorme."* Una tarjeta desplegada bajo la
   lista, no un modal a pantalla completa: en un iPhone, un modal por tocar un
   logro es más interrupción de la que merece la información que trae. */
function DetalleLogro({ logro, accent, onCerrar }) {
  const def = definicionLogro(logro.id);
  const desbloqueado = logro.estado === ESTADOS_LOGRO.DESBLOQUEADO;
  return (
    <Card style={{ border: `1px solid ${desbloqueado ? accent : COLORS.border}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{logro.titulo}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{logro.desc}</p>
          {logro.rachaNombre && (
            <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>En: {logro.rachaNombre}</p>
          )}
          {desbloqueado && logro.desbloqueadoEn && (
            <p className="text-[11px] mt-1.5 font-semibold" style={{ color: accent }}>
              Conseguido el {logro.desbloqueadoEn.split('-').reverse().join('/')}
            </p>
          )}
          {!desbloqueado && logro.progreso && (
            <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>
              Llevas {logro.progreso.actual} de {logro.progreso.meta}
            </p>
          )}
          {/* Si un logro oculto sigue bloqueado, aquí tampoco se destapa. */}
          {!desbloqueado && !logro.progreso && def && !def.oculto && (
            <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>Todavía por conseguir.</p>
          )}
        </div>
        <button onClick={onCerrar} className="text-[11px] font-semibold flex-shrink-0" style={{ color: COLORS.textMuted }}>
          Cerrar
        </button>
      </div>
    </Card>
  );
}

/* ===========================================================================
   CELEBRACIÓN (apartados 15, 16 y 19)
   ===========================================================================
   *"Si una misma acción provoca racha, récord, logro e hito, no muestres cuatro
   pop-ups diferentes. Agrupa la celebración. Una única experiencia."*

   De ahí que esto reciba la LISTA entera de eventos y saque de ella un solo
   mensaje. Y no es un modal: es una tarjeta que aparece en su sitio y se cierra
   sola al tocar. *"Evita pantallas invasivas."*

   Solo se muestra cuando hay algo de verdad que celebrar — un hito o un récord.
   Completar un día normal no abre nada: ese es el "microfeedback" del apartado
   16, y va en la propia tarjeta de la racha. */
export function Celebracion({ eventos, accent, onCerrar }) {
  const resumen = useMemo(() => {
    if (!eventos || !eventos.length) return null;
    const hito = eventos.filter((e) => e.tipo === EVENTOS_GAMIFICACION.STREAK_MILESTONE_REACHED)
      .sort((a, b) => b.hito - a.hito)[0];
    const record = eventos.find((e) => e.tipo === EVENTOS_GAMIFICACION.STREAK_PERSONAL_RECORD);
    const logros = eventos.filter((e) => e.tipo === EVENTOS_GAMIFICACION.ACHIEVEMENT_UNLOCKED);
    if (!hito && !record && !logros.length) return null;
    return { hito, record, logros, grande: hito?.celebracion === NIVELES_CELEBRACION.GRANDE };
  }, [eventos]);

  if (!resumen) return null;

  return (
    <Card
      className="module-enter"
      style={{
        border: `1px solid ${accent}`,
        background: hexToRgba(accent, resumen.grande ? 0.14 : 0.08),
      }}
    >
      <div className="text-center">
        {resumen.hito && (
          <p className="text-lg font-bold flex items-center justify-center gap-2" style={{ color: accent }}>
            <Flame size={18} /> {resumen.hito.hito} {plural(resumen.hito.hito, 'día', 'días')}
          </p>
        )}
        {resumen.record && (
          <p className="text-sm font-semibold mt-1 flex items-center justify-center gap-1.5" style={{ color: COLORS.text }}>
            <Trophy size={14} style={{ color: accent }} /> Nuevo récord personal
          </p>
        )}
        {resumen.logros.length > 0 && (
          <p className="text-xs mt-1.5" style={{ color: COLORS.textMuted }}>
            {resumen.logros.length === 1
              ? `Logro conseguido: ${resumen.logros[0].titulo}`
              : `${resumen.logros.length} logros conseguidos`}
          </p>
        )}
        <div className="mt-3">
          <GhostBtn onClick={onCerrar}>Seguir</GhostBtn>
        </div>
      </div>
    </Card>
  );
}

/* ===========================================================================
   CREAR UNA RACHA
   ===========================================================================
   El apartado 14 de RA F1 dejó la arquitectura lista para rachas propias; esta
   es la pantalla que faltaba. El error de validación se enseña tal cual lo
   devuelve el servicio: una frase corta, en la propia interfaz (regla 8). */
function CrearRacha({ accent, onCrear, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('custom');
  const [clase, setClase] = useState('diaria');
  const [valor, setValor] = useState('');
  const [error, setError] = useState('');

  const necesitaValor = clase === 'minimo' || clase === 'cantidad';

  const crear = () => {
    const regla = necesitaValor ? { clase, valor: Number(valor) } : { clase };
    const { error: err } = onCrear({ nombre, tipo, regla });
    if (err) { setError(err); return; }
    setNombre(''); setValor(''); setError('');
    onCancelar();
  };

  return (
    <Card>
      <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Nueva racha</p>
      <Field label="Nombre">
        <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Entrenar, Leer, Dormir 8 h…" />
      </Field>
      <Field label="De qué es">
        <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS_RACHA.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </Select>
      </Field>
      <Field label="Cuándo cuenta un día">
        <Select value={clase} onChange={(e) => setClase(e.target.value)}>
          {Object.values(CLASES_REGLA).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
      </Field>
      {necesitaValor && (
        <Field label="Objetivo del día">
          <TextInput type="number" inputMode="numeric" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="30" />
        </Field>
      )}
      {error && <p className="text-xs mb-2" style={{ color: COLORS.negative }}>{error}</p>}
      <div className="flex gap-2 mt-1">
        <PrimaryButton accent={accent} onClick={crear}>Crear</PrimaryButton>
        <div style={{ width: 110, flexShrink: 0 }}>
          <GhostBtn onClick={onCancelar}>Cancelar</GhostBtn>
        </div>
      </div>
    </Card>
  );
}

/* ===========================================================================
   DETALLE DE UNA RACHA (apartados 8, 9, 27 y 28)
   ===========================================================================
   *"El usuario nunca debe sentir que su progreso histórico desapareció."*

   Por eso, cuando la racha está rota, el récord y el historial siguen ahí, y el
   mensaje **no castiga**: *"Evita ❌ HAS FALLADO. Prefiero: la racha terminó, hoy
   puedes empezar una nueva."* Está literalmente así abajo. */
/* Entrega 3 · F2, apartados 6, 7 y 8 — *"🔥 +1 día. Una recompensa pequeña,
   rápida y satisfactoria."*

   El fuego pega un pulso y el "+1" sube y se apaga, todo en menos de un segundo
   (`DURACION_FEEDBACK_MS`). Las dos animaciones viven en `index.css` y respetan
   solas "Reducir movimiento".

   ⚠️ **No es gamificación** (D2-02): ni puntos, ni niveles, ni monedas. Es el
   número de días que Josué acaba de conseguir, que ya existía, dicho más alto
   durante un instante. */
function FeedbackSubida({ subida, accent }) {
  if (!subida) return null;
  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <span className="fuego-sube">
        <Flame size={18} style={{ color: accent }} />
      </span>
      <span className="text-sm font-extrabold" style={{ color: COLORS.text }}>{subida.textoDias}</span>
      <span className="racha-mas-uno text-sm font-extrabold" style={{ color: accent }}>{subida.texto}</span>
    </div>
  );
}

function DetalleRacha({ resumen, rachas, accent, hoy, onVolver, onCompletar, onDeshacer, onEliminar, logros, onAbrirLogro, subida }) {
  const [confirmando, setConfirmando] = useState(false);
  const hechoHoy = resumen.estadoHoy === ESTADOS_DIA.COMPLETADO;
  const hito = progresoHaciaHito(resumen.actual);
  const mios = logros.filter((l) => l.rachaId === resumen.id);

  return (
    <div className="space-y-3">
      <button onClick={onVolver} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: COLORS.textMuted }}>
        <ArrowLeft size={13} /> Todas las rachas
      </button>

      <TarjetaRacha resumen={{ ...resumen, hito }} accent={accent} />

      {/* Apartado 18 — el feedback al completar sale del motor real. Aquí no se
          simula ningún número: `resumen.actual` ya viene derivado. */}
      {onCompletar && (
        <Card>
          {hechoHoy ? (
            <>
              {/* Entrega 3 · F2 — mientras dura, el "+1" ocupa el sitio del texto
                  de siempre. Es un instante: en cuanto se apaga vuelve la frase. */}
              {subida ? (
                <div className="mb-3"><FeedbackSubida subida={subida} accent={accent} /></div>
              ) : (
                <>
                  <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: accent }}>
                    <Check size={15} /> Día completado
                  </p>
                  <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>
                    Racha: {resumen.actual} {plural(resumen.actual, 'día', 'días')}.
                  </p>
                </>
              )}
              <GhostBtn onClick={() => onDeshacer(resumen.id)}>Deshacer el día de hoy</GhostBtn>
            </>
          ) : (
            <>
              {/* Apartado 29 — el recordatorio, solo si está pendiente. */}
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                {resumen.actual > 0
                  ? 'Complétalo hoy para mantener la racha.'
                  : 'Completa hoy y empieza una racha nueva.'}
              </p>
              <PrimaryButton accent={accent} icon={Check} onClick={() => onCompletar(resumen.id)}>
                Marcar hoy
              </PrimaryButton>
            </>
          )}
        </Card>
      )}

      {/* Apartados 8 y 28 — la ficha, con el histórico siempre visible. */}
      <Card>
        <SectionTitle>Cómo va</SectionTitle>
        <ListRow>
          <span className="text-xs" style={{ color: COLORS.textMuted }}>Mejor racha</span>
          <span className="text-xs font-semibold ml-auto" style={{ color: COLORS.text }}>
            {resumen.record} {plural(resumen.record, 'día', 'días')}
          </span>
        </ListRow>
        <ListRow>
          <span className="text-xs" style={{ color: COLORS.textMuted }}>Días cumplidos en total</span>
          <span className="text-xs font-semibold ml-auto" style={{ color: COLORS.text }}>{resumen.diasCumplidos}</span>
        </ListRow>
        {resumen.inicio && (
          <ListRow>
            <span className="text-xs" style={{ color: COLORS.textMuted }}>Empezó el</span>
            <span className="text-xs font-semibold ml-auto" style={{ color: COLORS.text }}>
              {resumen.inicio.split('-').reverse().join('/')}
            </span>
          </ListRow>
        )}
        {resumen.ultimoDia && (
          <ListRow>
            <span className="text-xs" style={{ color: COLORS.textMuted }}>Último día cumplido</span>
            <span className="text-xs font-semibold ml-auto" style={{ color: COLORS.text }}>
              {resumen.ultimoDia.split('-').reverse().join('/')}
            </span>
          </ListRow>
        )}
        <ListRow last>
          <span className="text-xs" style={{ color: COLORS.textMuted }}>Cumplimiento</span>
          <span className="text-xs font-semibold ml-auto" style={{ color: COLORS.text }}>{resumen.porcentaje} %</span>
        </ListRow>
        <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>{resumen.regla}</p>
      </Card>

      {/* Apartado 27 — nada de "HAS FALLADO". */}
      {resumen.estado === ESTADOS_RACHA.ROTA && (
        <Card>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            La racha terminó. Hoy puedes empezar una nueva — tu mejor marca de {resumen.record}{' '}
            {plural(resumen.record, 'día', 'días')} sigue siendo tuya.
          </p>
        </Card>
      )}

      {resumen.tramos.length > 1 && (
        <Card>
          <SectionTitle sub="Tus rachas anteriores">Historial</SectionTitle>
          {resumen.tramos.filter((t) => !t.activo).slice(0, 6).map((t, i, todos) => (
            <ListRow key={t.inicio} last={i === todos.length - 1}>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>
                {t.inicio.split('-').reverse().slice(0, 2).join('/')} – {t.fin.split('-').reverse().slice(0, 2).join('/')}
              </span>
              <span className="text-xs font-semibold ml-auto" style={{ color: COLORS.text }}>
                {t.dias} {plural(t.dias, 'día', 'días')}
              </span>
            </ListRow>
          ))}
        </Card>
      )}

      <CalendarioRacha rachas={rachas} rachaId={resumen.id} accent={accent} hoy={hoy} />

      {mios.length > 0 && (
        <div>
          <SectionTitle>Logros de esta racha</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {mios.map((l) => <TarjetaLogro key={l.clave} logro={l} accent={accent} onAbrir={onAbrirLogro} />)}
          </div>
        </div>
      )}

      {onEliminar && (
        <Card>
          {confirmando ? (
            <div className="flex items-center gap-3">
              <button onClick={() => { onEliminar(resumen.id); onVolver(); }} className="text-xs font-semibold" style={{ color: COLORS.negative }}>
                Sí, eliminar la racha
              </button>
              <button onClick={() => setConfirmando(false)} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setConfirmando(true)} className="flex items-center gap-2 text-xs font-semibold" style={{ color: COLORS.negative }}>
                <Trash2 size={13} /> Eliminar esta racha
              </button>
              <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>
                Se van también su historial y sus logros. Esto no se puede deshacer.
              </p>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

/* ===========================================================================
   EL CENTRO DE RACHAS (apartados 6, 7 y 37)
   ===========================================================================
   *"No quiero que 10 tarjetas ocupen toda la pantalla. La racha principal debe
   tener más protagonismo. Las secundarias deben ser fácilmente consultables."*

   De ahí el orden: resumen → principal grande → el resto compactas → logros →
   estadísticas. Y el recorrido del apartado 37 entero: Hoy → racha → Centro →
   detalle → volver, sin navegación paralela (apartado 33): es un módulo más de
   la app, con su área y su botón de volver, como los otros veinte. */
export default function RachasView({
  rachas, gamificacion, habitos, accent, hoy = todayISO(),
  onCrearRacha, onCompletarDia, onDeshacerDia, onEliminarRacha, onEvaluar,
}) {
  const [abierta, setAbierta] = useState(null);
  const [creando, setCreando] = useState(false);
  const [logroAbierto, setLogroAbierto] = useState(null);
  const [celebrando, setCelebrando] = useState(null);

  /* Entrega 3 · F2, apartados 6-8 — la recompensa de subir la racha.
     ⚠️ **No se guarda nada.** `esperandoSubida` es una referencia, no estado
     guardado: apunta el número de días que había ANTES de marcar, y cuando el
     estado real vuelve con uno más se enseña el "+1". Guardar un "ya te lo
     celebré" en disco sería el contador que el motor de rachas lleva desde
     RA F1 negándose a tener. */
  const [subida, setSubida] = useState(null);
  const esperandoSubida = useRef(null);

  const panel = useMemo(() => panelGamificacion(rachas, gamificacion, hoy), [rachas, gamificacion, hoy]);
  const deHabitos = useMemo(() => panelHabitos(habitos, hoy), [habitos, hoy]);

  // Las rachas propias y los hábitos, juntos en una sola lista: para Josué son
  // lo mismo, aunque por dentro vengan de módulos distintos. Los hábitos van
  // marcados para que el detalle no ofrezca botones que allí no existen — se
  // marcan desde Productividad, que es donde viven.
  const todas = useMemo(
    () => [...panel.rachas.map((r) => ({ ...r, propia: true })), ...deHabitos.rachas.map((r) => ({ ...r, propia: false }))]
      .sort((a, b) => (b.actual - a.actual) || (b.record - a.record)),
    [panel.rachas, deHabitos.rachas],
  );

  /* ⚠️ Va aquí, ANTES del `return` del estado vacío (regla 4 del proyecto: todos
     los hooks antes de cualquier `return` condicional). Ya se produjo una vez el
     "Rendered more hooks than during the previous render". */
  useEffect(() => {
    const esperando = esperandoSubida.current;
    if (!esperando) return undefined;
    const ahora = todas.find((r) => r.id === esperando.id);
    if (!ahora) return undefined;
    const fb = feedbackDeSubida(esperando.antes, ahora.actual);
    if (!fb) return undefined;
    esperandoSubida.current = null;
    setSubida({ id: esperando.id, ...fb });
    const t = setTimeout(() => setSubida(null), DURACION_FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [todas]);

  const detalle = abierta ? todas.find((r) => r.id === abierta) : null;

  const completar = (id) => {
    // Apartados 6-8 — cuántos días había antes, para saber si de verdad ha
    // subido. Si no sube (por ejemplo, ya estaba marcado) no se celebra nada.
    esperandoSubida.current = { id, antes: todas.find((r) => r.id === id)?.actual ?? null };
    onCompletarDia(id);
    // Apartado 19 — una sola celebración agrupada, no cuatro avisos.
    if (onEvaluar) {
      const eventos = onEvaluar();
      if (eventos && eventos.length) setCelebrando(eventos);
    }
  };

  // Apartado 25 — el estado sin rachas. Ni una pantalla vacía ni un hueco.
  if (!todas.length && !creando) {
    return (
      <div className="space-y-3">
        <Card className="text-center">
          <Flame size={22} style={{ color: accent }} className="mx-auto mb-2" />
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Empieza tu primera racha</p>
          <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>
            Elige algo que quieras hacer cada día y ve encadenando días. Los hábitos de
            Productividad también cuentan y aparecerán aquí solos.
          </p>
          <PrimaryButton accent={accent} icon={Plus} onClick={() => setCreando(true)}>
            Crear una racha
          </PrimaryButton>
        </Card>
      </div>
    );
  }

  if (detalle) {
    return (
      <DetalleRacha
        resumen={detalle}
        rachas={rachas}
        accent={accent}
        hoy={hoy}
        logros={panel.logros}
        onAbrirLogro={setLogroAbierto}
        onVolver={() => setAbierta(null)}
        // Un hábito se marca en Productividad, que es donde vive su dato. Ofrecer
        // aquí un botón que escribe en otro módulo sería duplicar el camino.
        onCompletar={detalle.propia ? completar : null}
        onDeshacer={detalle.propia ? onDeshacerDia : null}
        onEliminar={detalle.propia ? onEliminarRacha : null}
        // Entrega 3 · F2 — el "+1", solo en la racha que acaba de subir.
        subida={subida && subida.id === detalle.id ? subida : null}
      />
    );
  }

  const principal = todas[0];
  const secundarias = todas.slice(1);

  return (
    <div className="space-y-3">
      {celebrando && <Celebracion eventos={celebrando} accent={accent} onCerrar={() => setCelebrando(null)} />}

      {/* Apartado 6 — el resumen de arriba: racha actual y mejor racha. */}
      <Card>
        <div className="flex items-center justify-around text-center">
          <div>
            <p className="text-2xl font-bold" style={{ color: accent }}>{panel.estadisticas.rachaActual}</p>
            <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>Racha actual</p>
          </div>
          <div style={{ width: 1, height: 34, background: COLORS.border }} aria-hidden="true" />
          <div>
            <p className="text-2xl font-bold" style={{ color: COLORS.text }}>{panel.estadisticas.mejorRacha}</p>
            <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>Tu mejor</p>
          </div>
          <div style={{ width: 1, height: 34, background: COLORS.border }} aria-hidden="true" />
          <div>
            <p className="text-2xl font-bold" style={{ color: COLORS.text }}>{panel.estadisticas.logrosDesbloqueados}</p>
            <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>Logros</p>
          </div>
        </div>
      </Card>

      {creando
        ? <CrearRacha accent={accent} onCrear={onCrearRacha} onCancelar={() => setCreando(false)} />
        : (
          <button
            onClick={() => setCreando(true)}
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: accent }}
          >
            <Plus size={13} /> Nueva racha
          </button>
        )}

      {principal && <TarjetaRacha resumen={principal} accent={accent} onAbrir={() => setAbierta(principal.id)} />}

      {/* Apartado 7 — las secundarias, compactas y consultables. */}
      {secundarias.length > 0 && (
        <div>
          <SectionTitle>Tus otras rachas</SectionTitle>
          <div className="space-y-2">
            {secundarias.map((r) => (
              <TarjetaRacha key={r.id} resumen={r} accent={accent} compacta onAbrir={() => setAbierta(r.id)} />
            ))}
          </div>
        </div>
      )}

      {panel.logros.length > 0 && (
        <div>
          <SectionTitle sub={`${panel.desbloqueados.length} de ${panel.logros.length}`}>Logros</SectionTitle>
          {logroAbierto && (
            <div className="mb-2">
              <DetalleLogro logro={logroAbierto} accent={accent} onCerrar={() => setLogroAbierto(null)} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {panel.logros
              // Los conseguidos primero: es lo que Josué querrá volver a ver.
              .slice()
              .sort((a, b) => (a.estado === ESTADOS_LOGRO.DESBLOQUEADO ? 0 : 1) - (b.estado === ESTADOS_LOGRO.DESBLOQUEADO ? 0 : 1))
              .map((l) => <TarjetaLogro key={l.clave} logro={l} accent={accent} onAbrir={setLogroAbierto} />)}
          </div>
        </div>
      )}

      <Card>
        <SectionTitle>En total</SectionTitle>
        <ListRow>
          <span className="text-xs" style={{ color: COLORS.textMuted }}>Días cumplidos</span>
          <span className="text-xs font-semibold ml-auto" style={{ color: COLORS.text }}>{panel.estadisticas.diasTotalesCumplidos}</span>
        </ListRow>
        <ListRow>
          <span className="text-xs" style={{ color: COLORS.textMuted }}>Racha global</span>
          <span className="text-xs font-semibold ml-auto" style={{ color: COLORS.text }}>
            {panel.estadisticas.rachaGlobal} {plural(panel.estadisticas.rachaGlobal, 'día', 'días')}
          </span>
        </ListRow>
        <ListRow last>
          <span className="text-xs" style={{ color: COLORS.textMuted }}>Hitos alcanzados</span>
          <span className="text-xs font-semibold ml-auto" style={{ color: COLORS.text }}>{panel.estadisticas.hitosAlcanzados}</span>
        </ListRow>
        <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
          La racha global cuenta los días seguidos en los que cumpliste al menos una de tus rachas.
        </p>
      </Card>
    </div>
  );
}
