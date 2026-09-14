/* ===========================================================================
   ENTREGA 4 · FASE 5/45 — LA BIBLIOTECA DE PLANIFICACIONES, LA PANTALLA

   El criterio de finalización pide entrar en *Fitness → Entrenamiento → Más
   planes* y *"sentir que estoy navegando por una biblioteca real de planes de
   entrenamiento"*, pudiendo **Explorar → Buscar → Filtrar → Abrir → Revisar →
   Seleccionar → Personalizar** *"sin que ninguna de esas acciones sea
   simplemente un mockup"*.

   🚨 **ESTA PANTALLA NO CALCULA NADA.** La distribución muscular, la duración,
   los recuentos de cada filtro, qué plan está activo y qué pasa al
   personalizar salen de `src/lib/planes.js`; los datos, de
   `src/lib/catalogoPlanes.js` (apartado 22: *"Separar datos, modelos, lógica y
   UI"*, y *"No dependas de datos escritos directamente dentro de
   componentes"*).

   🚨 **Y NO PINTA «EMPEZAR ENTRENAMIENTO»** (apartado 14: *"no debe iniciar
   todavía el entrenamiento"*). El motor en vivo es una fase posterior, y un
   botón que no hace nada es peor que no tenerlo (regla 8, y la F4 ya lo dejó
   escrito con el apartado 19 de su enunciado).

   ⚠️ **Ni una imagen inventada** (apartado 5): `thumbnail` vale `null` en los
   diecisiete planes, así que el cuadro de cada tarjeta dibuja **el grupo
   muscular que más pesa**, derivado de sus ejercicios. El diseño funciona sin
   imagen porque nunca contó con ella.

   ⚠️ **Los menús y las confirmaciones se despliegan dentro de la tarjeta**, sin
   `fixed inset-0` ni portal (regla 3): en un iPhone un menú flotante se sale al
   hacer scroll, y `react-dom/server` no sabe pintar un portal, así que además
   se quedaría sin un solo caso de renderizado.
   =========================================================================== */

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Star, Check, Copy, SlidersHorizontal, X } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import {
  Card, SectionTitle, TextInput, GhostBtn, PrimaryButton,
} from '../components/ui';
import { iconoDeGrupo } from '../components/iconosFitness';
import {
  CATALOGO_PLANES, FILTRO_TODOS, planPorId, fichaDePlan, fichaDeDia,
  planesVisibles, pastillasDeFiltro, avisoDeCambioDePlan, resumenDePersonalizar,
  planActivoDe, esFavorito,
  ESTADO_SIN_RESULTADOS, ESTADO_SIN_FAVORITOS, ESTADO_ERROR_PLANES,
} from '../lib/planes';

/* Los tres filtros de detalle del apartado 7 que no son la barra de categorías.
   ⚠️ Es una lista, no tres bloques de JSX repetidos: así el día que haya un
   cuarto es una línea. */
const FILTROS_DETALLE = [
  { campo: 'objetivo', titulo: 'Objetivo' },
  { campo: 'dificultad', titulo: 'Nivel' },
  { campo: 'frecuencia', titulo: 'Días por semana' },
];

function Pastilla({ activa, children, cuenta = null, accent, onClick, label }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={activa}
      aria-label={label}
      className="px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 toque-44 active:scale-[0.97]"
      style={{
        background: activa ? accent : hexToRgba(COLORS.border, 0.5),
        color: activa ? COLORS.textOnAccent : COLORS.textMuted,
      }}
    >
      {children}
      {cuenta !== null && <span className="ml-1.5 opacity-70">{cuenta}</span>}
    </button>
  );
}

/* ── La tarjeta de un plan (apartado 4) ────────────────────────────────────
   *"PPL Estético · Gym · 5 días/semana ≈ 60 min · Intermedio"*. El enunciado
   pide *"suficiente información para decidir si abrirla, pero sin estar
   saturada"*, así que va en **dos líneas**: la de siempre y el objetivo. */
export function TarjetaPlan({ plan, accent, activo = false, favorito = false, onAbrir, onFavorito }) {
  const ficha = fichaDePlan(plan);
  if (!ficha.id) return null;
  const Icono = iconoDeGrupo(ficha.grupoDominante?.id);
  const linea = [ficha.entorno, ficha.textoFrecuencia, ficha.duracion, ficha.dificultad]
    .filter(Boolean).join(' · ');

  return (
    <Card style={activo ? { border: `1px solid ${accent}` } : undefined}>
      <div className="flex items-center gap-3">
        {/* 🚨 El thumbnail del apartado 5 sin inventar una URL: el grupo que más
            pesa en el propio plan, calculado de sus ejercicios. */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: hexToRgba(accent, 0.14), color: accent }}
        >
          <Icono size={24} />
        </div>
        <button
          onClick={onAbrir}
          aria-label={`Abrir ${ficha.nombre}`}
          className="min-w-0 flex-1 text-left toque-44 active:opacity-70"
        >
          <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {ficha.nombre}
          </p>
          <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>{linea}</p>
          {ficha.objetivo && (
            <p className="text-[11px] truncate mt-0.5" style={{ color: accent }}>{ficha.objetivo}</p>
          )}
        </button>
        {onFavorito && (
          <button
            onClick={onFavorito}
            aria-label={favorito ? `Quitar ${ficha.nombre} de guardados` : `Guardar ${ficha.nombre}`}
            aria-pressed={favorito}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 toque-44 active:scale-90"
            style={{
              background: hexToRgba(COLORS.border, 0.45),
              color: favorito ? COLORS.warning : COLORS.textMuted,
            }}
          >
            <Star size={16} fill={favorito ? COLORS.warning : 'none'} />
          </button>
        )}
      </div>
      {/* ⚠️ Solo se rotula el activo si lo es: una etiqueta «no activo» en los
          dieciséis restantes sería ruido. */}
      {activo && (
        <p className="text-[11px] font-semibold mt-2" style={{ color: accent }}>Es tu plan actual</p>
      )}
    </Card>
  );
}

/* ── La confirmación de cambio de plan (apartado 14) ───────────────────────
   *"Si el usuario ya tiene otro plan activo: mostrar una confirmación antes de
   reemplazarlo."* ⚠️ Y dice que el anterior **no se pierde**: sigue en la
   biblioteca, así que asustar de balde sería mentir al revés (E3 F26). */
export function ConfirmarCambioDePlan({ actual, nuevo, onCancelar, onConfirmar }) {
  if (!actual || !nuevo) return null;
  const aviso = avisoDeCambioDePlan(actual, nuevo);
  return (
    <Card style={{ border: `1px solid ${COLORS.warning}` }}>
      <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
        {aviso.titulo}
      </p>
      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{aviso.que}</p>
      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{aviso.nuevo}</p>
      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{aviso.vuelve}</p>
      <div className="flex gap-2 mt-3">
        <GhostBtn onClick={onCancelar}>{aviso.cancelar}</GhostBtn>
        {/* Botón crudo por el `aria-label` propio: `GhostBtn` no lo reparte, y
            «Cambiar plan» suelto se confundiría con el de la ficha (E3 F30). */}
        <button
          onClick={onConfirmar}
          aria-label={`Confirmar cambiar a ${nuevo.nombre}`}
          className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold toque-44"
          style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
        >
          <Check size={14} />
          {aviso.confirmar}
        </button>
      </div>
    </Card>
  );
}

/* ── El detalle de un plan (apartados 11, 12 y 13) ─────────────────────────
   Cabecera · información rápida · objetivo · distribución muscular · la semana
   · los ejercicios del día que se toque. */
export function DetallePlan({
  plan, accent, activo = false, favorito = false,
  onVolver, onUsar, onPersonalizar, onFavorito,
}) {
  const [dia, setDia] = useState(null);
  const [verPersonalizar, setVerPersonalizar] = useState(false);
  const ficha = fichaDePlan(plan);

  if (!ficha.id) {
    return (
      <Card>
        <p className="text-sm font-bold" style={{ color: COLORS.text }}>{ESTADO_ERROR_PLANES.titulo}</p>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{ESTADO_ERROR_PLANES.texto}</p>
        {onVolver && <div className="mt-3"><GhostBtn icon={ArrowLeft} onClick={onVolver}>{ESTADO_ERROR_PLANES.accion}</GhostBtn></div>}
      </Card>
    );
  }

  const Icono = iconoDeGrupo(ficha.grupoDominante?.id);
  const abierto = dia === null ? null : fichaDeDia(plan, dia);
  const resumenPers = resumenDePersonalizar(plan);

  return (
    <div className="space-y-4">
      <button
        onClick={onVolver}
        aria-label="Volver a la biblioteca de planes"
        className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
        style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
      >
        <ArrowLeft size={16} /> Más planes
      </button>

      {/* Cabecera (apartado 11). */}
      <Card>
        <div className="flex items-start gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: hexToRgba(accent, 0.14), color: accent }}
          >
            <Icono size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-extrabold leading-tight" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
              {ficha.nombre}
            </p>
            {ficha.subtitulo && (
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{ficha.subtitulo}</p>
            )}
            <p className="text-xs mt-1" style={{ color: accent }}>
              {[ficha.entorno, ficha.dificultad, ficha.textoFrecuencia].filter(Boolean).join(' · ')}
            </p>
          </div>
          {onFavorito && (
            <button
              onClick={onFavorito}
              aria-label={favorito ? `Quitar ${ficha.nombre} de guardados` : `Guardar ${ficha.nombre}`}
              aria-pressed={favorito}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 toque-44 active:scale-90"
              style={{
                background: hexToRgba(COLORS.border, 0.45),
                color: favorito ? COLORS.warning : COLORS.textMuted,
              }}
            >
              <Star size={16} fill={favorito ? COLORS.warning : 'none'} />
            </button>
          )}
        </div>

        {/* Información rápida (apartado 11). */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {[
            { que: 'Por sesión', valor: ficha.duracion || '—' },
            { que: 'Días', valor: `${ficha.diasEntreno}` },
            { que: 'Ejercicios', valor: `${ficha.ejercicios}` },
          ].map((d) => (
            <div key={d.que} className="text-center">
              <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{d.valor}</p>
              <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{d.que}</p>
            </div>
          ))}
        </div>

        {/* Apartado 14: usar el plan. ⚠️ Y NADA de «Empezar entrenamiento». */}
        <div className="flex gap-2 flex-wrap mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {activo ? (
            <p className="text-xs font-semibold py-2" style={{ color: accent }}>Ya es tu plan actual</p>
          ) : (
            <PrimaryButton accent={accent} icon={Check} onClick={onUsar}>Usar este plan</PrimaryButton>
          )}
          <GhostBtn icon={Copy} onClick={() => setVerPersonalizar((v) => !v)}>Personalizar</GhostBtn>
        </div>
      </Card>

      {/* Apartado 15: antes de copiar, qué va a pasar. ⚠️ No es una
          confirmación de las de asustar — no se pierde nada y lo creado se
          elimina de un toque (F4) —, es decir qué aparece y dónde. */}
      {verPersonalizar && (
        <Card style={{ border: `1px solid ${accent}` }}>
          <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {resumenPers.titulo}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{resumenPers.que}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{resumenPers.original}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{resumenPers.donde}</p>
          <div className="flex gap-2 mt-3">
            <GhostBtn onClick={() => setVerPersonalizar(false)}>Cancelar</GhostBtn>
            <button
              onClick={() => { setVerPersonalizar(false); onPersonalizar && onPersonalizar(); }}
              aria-label={`Crear mis plantillas de ${ficha.nombre}`}
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold toque-44"
              style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            >
              <Copy size={14} />
              Crear mis plantillas
            </button>
          </div>
        </Card>
      )}

      {/* Objetivo (apartado 11). */}
      {(ficha.descripcion || ficha.paraQuien) && (
        <div>
          <SectionTitle sub={ficha.objetivo ? `Objetivo: ${ficha.objetivo.toLowerCase()}` : undefined}>
            Para qué es
          </SectionTitle>
          <Card>
            {ficha.descripcion && (
              <p className="text-sm leading-relaxed" style={{ color: COLORS.textMuted }}>{ficha.descripcion}</p>
            )}
            {ficha.paraQuien && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: COLORS.text }}>{ficha.paraQuien}</p>
            )}
          </Card>
        </div>
      )}

      {/* Distribución muscular (apartados 10 y 11), derivada. */}
      {ficha.distribucion.grupos.length > 0 && (
        <div>
          <SectionTitle sub="Calculado de los ejercicios del plan">Distribución muscular</SectionTitle>
          <Card>
            {ficha.distribucion.grupos.map((g) => (
              <div key={g.grupoId} className="mb-2.5 last:mb-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold truncate" style={{ color: COLORS.text }}>{g.nombre}</span>
                  <span className="text-[11px] shrink-0" style={{ color: COLORS.textMuted }}>{g.porcentaje}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: hexToRgba(COLORS.border, 0.6) }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, g.porcentaje))}%`, background: accent }}
                  />
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* La semana (apartado 12). */}
      <div>
        <SectionTitle sub="Toca un día para ver sus ejercicios">La semana</SectionTitle>
        <div className="space-y-2">
          {plan.dias.map((d, i) => {
            const f = fichaDeDia(plan, i);
            const seleccionado = dia === i;
            return (
              <Card key={d.id} style={seleccionado ? { border: `1px solid ${accent}` } : undefined}>
                <button
                  onClick={() => (d.descanso ? null : setDia(seleccionado ? null : i))}
                  aria-label={d.descanso ? `Día ${i + 1}: descanso` : `Ver los ejercicios de ${d.nombre}`}
                  disabled={d.descanso}
                  className="w-full flex items-center gap-3 text-left toque-44"
                >
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
                    style={{
                      background: hexToRgba(d.descanso ? COLORS.border : accent, d.descanso ? 0.5 : 0.14),
                      color: d.descanso ? COLORS.textMuted : accent,
                    }}
                  >
                    D{i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
                      {f.nombre}
                    </span>
                    {/* ⚠️ Un día de descanso no dice «0 ejercicios ≈ 0 min»: es
                        descanso, no un día vacío (regla 8). */}
                    <span className="block text-xs truncate" style={{ color: COLORS.textMuted }}>
                      {d.descanso
                        ? 'Sin entrenamiento'
                        : [`${f.ejercicios} ${f.ejercicios === 1 ? 'ejercicio' : 'ejercicios'}`, f.duracion].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </button>

                {/* Los ejercicios del día (apartado 13). */}
                {seleccionado && abierto && (
                  <div className="mt-2.5 pt-2.5 space-y-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    {abierto.lineas.map((l) => (
                      <div key={l.id} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: accent }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate" style={{ color: COLORS.text }}>{l.nombre}</p>
                          {!l.existe ? (
                            <p className="text-[11px]" style={{ color: COLORS.negative }}>Ejercicio no disponible</p>
                          ) : (
                            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
                              {[l.series, l.carga, l.descanso ? `${l.descanso} s descanso` : '', l.musculos]
                                .filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── La biblioteca (apartados 3, 4, 6, 7 y 17) ─────────────────────────────
   ⚠️ Qué se busca, qué filtro está puesto y qué plan está abierto son **estado
   de la pantalla**, no datos (EH F40). Lo único que se guarda es cuál eligió y
   cuáles marcó, y eso lo escribe `App.jsx`. */
export default function BibliotecaPlanesView({
  planes = CATALOGO_PLANES, fitness = {}, accent,
  onVolver = null, onUsar = null, onPersonalizar = null, onFavorito = null,
}) {
  const [consulta, setConsulta] = useState('');
  const [filtros, setFiltros] = useState({
    entorno: FILTRO_TODOS, objetivo: FILTRO_TODOS, dificultad: FILTRO_TODOS, frecuencia: FILTRO_TODOS,
  });
  const [verFiltros, setVerFiltros] = useState(false);
  const [soloGuardados, setSoloGuardados] = useState(false);
  const [abierto, setAbierto] = useState(null);
  const [cambiando, setCambiando] = useState(null);

  const activoId = planActivoDe(fitness)?.planId || null;

  const visibles = useMemo(() => {
    const base = planesVisibles(planes, { consulta, ...filtros });
    return soloGuardados ? base.filter((p) => esFavorito(fitness, p.id)) : base;
  }, [planes, consulta, filtros, soloGuardados, fitness]);

  const pastillasEntorno = useMemo(
    () => pastillasDeFiltro(planes, filtros, 'entorno'), [planes, filtros],
  );
  const hayFiltro = Object.values(filtros).some((v) => v !== FILTRO_TODOS) || !!consulta || soloGuardados;

  const limpiar = () => {
    setConsulta('');
    setSoloGuardados(false);
    setFiltros({ entorno: FILTRO_TODOS, objetivo: FILTRO_TODOS, dificultad: FILTRO_TODOS, frecuencia: FILTRO_TODOS });
  };

  /* 🚨 La confirmación se pinta **en los dos caminos de esta pantalla**, y ése
     fue un fallo real que cazó Chromium: vivía solo en el de la lista, y
     «Usar este plan» se pulsa desde el DETALLE —que devuelve antes—, así que
     `cambiando` se ponía y **no se veía nada**. Es la lección de GE F1: una
     pantalla que se pinta por dos caminos tiene que repartir también sus
     avisos, o la acción no existe para quien la usa. */
  const confirmacion = cambiando ? (
    <ConfirmarCambioDePlan
      actual={cambiando.actual}
      nuevo={cambiando.nuevo}
      onCancelar={() => setCambiando(null)}
      onConfirmar={() => {
        const id = cambiando.nuevo.id;
        setCambiando(null);
        onUsar && onUsar(id, { confirmado: true });
      }}
    />
  ) : null;

  /* El detalle es una pantalla entera, no un panel dentro de la lista: así el
     scroll empieza arriba y la semana cabe (apartado 18). */
  if (abierto) {
    const plan = planPorId(abierto, planes);
    return (
      <div className="space-y-4">
        {confirmacion}
        <DetallePlan
          plan={plan}
          accent={accent}
          activo={activoId === abierto}
          favorito={esFavorito(fitness, abierto)}
          onVolver={() => setAbierto(null)}
          onFavorito={onFavorito ? () => onFavorito(abierto) : null}
          onPersonalizar={onPersonalizar ? () => onPersonalizar(abierto) : null}
          onUsar={() => {
            const actual = activoId ? planPorId(activoId, planes) : null;
            /* Solo se pregunta si había otro (apartado 14). */
            if (actual && actual.id !== abierto) { setCambiando({ actual, nuevo: plan }); return; }
            onUsar && onUsar(abierto, { confirmado: false });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onVolver && (
        <button
          onClick={onVolver}
          aria-label="Volver a Entrenamiento"
          className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
          style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
        >
          <ArrowLeft size={16} /> Entrenamiento
        </button>
      )}

      {confirmacion}

      {/* Apartado 6: el buscador. */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TextInput
            value={consulta}
            onChange={(ev) => setConsulta(ev.target.value)}
            placeholder="Buscar un plan"
            aria-label="Buscar un plan"
          />
        </div>
        <GhostBtn icon={verFiltros ? X : SlidersHorizontal} onClick={() => setVerFiltros((v) => !v)}>
          {verFiltros ? 'Cerrar' : 'Filtros'}
        </GhostBtn>
      </div>

      {/* Apartado 3: la navegación horizontal por categorías. ⚠️ `overflow-x`
          en SU contenedor, para que la página no se arrastre de lado
          (apartado 18 y la lección de GE F1). */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {pastillasEntorno.map((p) => (
          <Pastilla
            key={p.id}
            activa={filtros.entorno === p.id}
            cuenta={p.cuenta}
            accent={accent}
            label={`Ver planes de ${p.nombre.toLowerCase()}`}
            onClick={() => setFiltros((f) => ({ ...f, entorno: p.id }))}
          >
            {p.nombre}
          </Pastilla>
        ))}
      </div>

      {/* Apartado 7: los filtros de detalle, plegados para no saturar el móvil
          (*"No es necesario crear un sistema de filtros visualmente
          gigantesco"*). */}
      {verFiltros && (
        <Card>
          {FILTROS_DETALLE.map(({ campo, titulo }) => {
            const pastillas = pastillasDeFiltro(planes, filtros, campo);
            if (pastillas.length <= 1) return null;
            return (
              <div key={campo} className="mb-3 last:mb-0">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textMuted }}>
                  {titulo}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {pastillas.map((p) => (
                    <Pastilla
                      key={p.id}
                      activa={String(filtros[campo]) === String(p.id)}
                      cuenta={p.cuenta}
                      accent={accent}
                      label={`${titulo}: ${p.nombre.toLowerCase()}`}
                      onClick={() => setFiltros((f) => ({ ...f, [campo]: p.id }))}
                    >
                      {p.nombre}
                    </Pastilla>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="flex gap-1.5 flex-wrap pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            <Pastilla
              activa={soloGuardados}
              accent={accent}
              label="Ver solo los planes guardados"
              onClick={() => setSoloGuardados((v) => !v)}
            >
              Guardados
            </Pastilla>
            {hayFiltro && <GhostBtn onClick={limpiar}>Quitar los filtros</GhostBtn>}
          </div>
        </Card>
      )}

      {/* Apartado 17: los estados vacíos, cada uno con su salida. */}
      {visibles.length === 0 ? (
        <Card>
          <div className="py-6 text-center">
            <Search size={22} className="mx-auto mb-2" style={{ color: COLORS.textMuted }} />
            <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
              {soloGuardados ? ESTADO_SIN_FAVORITOS.titulo : ESTADO_SIN_RESULTADOS.titulo}
            </p>
            <p className="text-xs mt-1.5" style={{ color: COLORS.textMuted }}>
              {soloGuardados ? ESTADO_SIN_FAVORITOS.texto : ESTADO_SIN_RESULTADOS.texto}
            </p>
            <div className="mt-4 flex justify-center">
              <PrimaryButton accent={accent} onClick={limpiar}>
                {soloGuardados ? ESTADO_SIN_FAVORITOS.accion : ESTADO_SIN_RESULTADOS.accion}
              </PrimaryButton>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {visibles.map((p) => (
            <TarjetaPlan
              key={p.id}
              plan={p}
              accent={accent}
              activo={activoId === p.id}
              favorito={esFavorito(fitness, p.id)}
              onAbrir={() => setAbierto(p.id)}
              onFavorito={onFavorito ? () => onFavorito(p.id) : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
