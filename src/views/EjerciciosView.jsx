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
   =========================================================================== */

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, X, SlidersHorizontal } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, SectionTitle, TextInput, GhostBtn, EmptyHint } from '../components/ui';
import { GRUPOS_MUSCULARES } from '../lib/fitness';
import { iconoDeGrupo } from '../components/iconosFitness';
import {
  ENTORNOS, EQUIPAMIENTO, DIFICULTADES, TIPOS_EJERCICIO, CATALOGO_EJERCICIOS,
  buscarEjercicios, filtrarEjercicios, recuentos, musculosDe, musculoPrincipal,
  nombreCompleto, sustitutosDe, variantesDe, baseDe, progresionesDe,
  dificultad as dificultadDe, equipo, entorno as entornoDe, medida as medidaDe, papel as papelDe,
} from '../lib/ejercicios';

/* ── Una pastilla de filtro ────────────────────────────────────────────────
   ⚠️ Lleva su recuento al lado: el apartado 23 pide filtros que sirvan, y un
   filtro que deja la lista vacía sin avisar es peor que no tenerlo. */
function Pastilla({ activa, children, cuantos = null, accent, onClick }) {
  const apagada = cuantos === 0;
  return (
    <button
      onClick={onClick}
      disabled={apagada}
      aria-pressed={activa}
      className="px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 toque-44 active:scale-[0.97] transition-colors"
      style={{
        background: activa ? accent : hexToRgba(COLORS.border, 0.5),
        color: activa ? COLORS.textOnAccent : COLORS.textMuted,
        opacity: apagada ? 0.4 : 1,
      }}
    >
      {children}
      {cuantos !== null && <span className="ml-1.5 opacity-70">{cuantos}</span>}
    </button>
  );
}

/* ── Una tarjeta de la lista (apartados 23 y 25) ───────────────────────────
   *"nombre; entorno; dificultad; músculo principal; equipamiento principal"*,
   y el apartado 25 pide que sean *"visuales, compactas, fáciles de escanear"*. */
export function TarjetaEjercicio({ ejercicio, accent, onAbrir, accion = 'Ver', marca = null }) {
  const principal = musculoPrincipal(ejercicio);
  const Icono = iconoDeGrupo(principal?.grupoId);
  const dif = dificultadDe(ejercicio.dificultad);
  const equipoPrincipal = ejercicio.equipamiento.find((e) => e !== 'suelo' && e !== 'ninguno')
    || ejercicio.equipamiento[0];
  const entornos = ejercicio.entornos.map((e) => entornoDe(e)?.nombre).filter(Boolean);
  return (
    <button
      onClick={onAbrir}
      aria-label={`${accion} ${nombreCompleto(ejercicio)}`}
      className="hub-card w-full text-left rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99]"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: hexToRgba(accent, 0.14), color: accent }}
      >
        <Icono size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {ejercicio.nombre}
        </p>
        {ejercicio.variante && (
          <p className="text-[11px] truncate" style={{ color: COLORS.textMuted }}>{ejercicio.variante}</p>
        )}
        <p className="text-xs truncate mt-0.5" style={{ color: COLORS.textMuted }}>
          {principal ? principal.nombre : 'Sin músculos'}
          {dif ? ` · ${dif.nombre}` : ''}
          {equipoPrincipal ? ` · ${equipo(equipoPrincipal)?.nombre || equipoPrincipal}` : ''}
        </p>
      </div>
      {/* ⚠️ En modo selector se dice si ya está en el entrenamiento, pero NO se
          bloquea: duplicar un ejercicio es el apartado 17 de la FIT F3. */}
      <span
        className="text-[10px] font-semibold shrink-0 text-right"
        style={{ color: marca ? accent : COLORS.textMuted }}
      >
        {marca || entornos.join(' · ')}
      </span>
    </button>
  );
}

/* ── La barra de un músculo, con su porcentaje ─────────────────────────────
   El apartado 24 pide *"músculos implicados; distribución porcentual"*: los
   números son los del catálogo, no una estimación de la pantalla. */
function BarraMusculo({ implicacion, accent }) {
  const p = papelDe(implicacion.papel);
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-semibold truncate" style={{ color: COLORS.text }}>
          {implicacion.nombre}
        </span>
        <span className="text-[11px] shrink-0" style={{ color: COLORS.textMuted }}>
          {p ? p.nombre : ''} · {implicacion.porcentaje}%
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: hexToRgba(COLORS.border, 0.6) }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(0, Math.min(100, implicacion.porcentaje || 0))}%`,
            background: implicacion.papel === 'principal' ? accent : hexToRgba(accent, 0.45),
          }}
        />
      </div>
    </div>
  );
}

/* ── El detalle (apartado 24) ──────────────────────────────────────────────
   Reutilizable: la fase del entrenamiento en vivo abrirá esto mismo. */
export function DetalleEjercicio({ ejercicio, accent, onVolver = null, onAbrirOtro = null }) {
  if (!ejercicio) return <EmptyHint text="Ese ejercicio ya no está en el catálogo." />;
  const musculos = musculosDe(ejercicio).sort((a, b) => (b.porcentaje || 0) - (a.porcentaje || 0));
  const base = baseDe(ejercicio);
  const variantes = variantesDe(ejercicio);
  const sustitutos = sustitutosDe(ejercicio);
  const progresiones = progresionesDe(ejercicio);
  const ins = ejercicio.instrucciones;
  const hayInstrucciones = ins.preparacion || ins.ejecucion || ins.respiracion
    || ins.errores.length || ins.consejos.length;
  const fila = (nombre, valor) => (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs shrink-0" style={{ color: COLORS.textMuted }}>{nombre}</span>
      <span className="text-xs font-semibold text-right" style={{ color: COLORS.text }}>{valor}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      {onVolver && (
        <button
          onClick={onVolver}
          aria-label="Volver al catálogo"
          className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
          style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
        >
          <ArrowLeft size={16} /> Catálogo
        </button>
      )}

      <Card>
        <p className="text-xl font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {ejercicio.nombre}
        </p>
        {ejercicio.variante && (
          <p className="text-sm font-semibold" style={{ color: accent }}>{ejercicio.variante}</p>
        )}
        {ejercicio.descripcion && (
          <p className="text-sm mt-2 leading-relaxed" style={{ color: COLORS.textMuted }}>{ejercicio.descripcion}</p>
        )}
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {fila('Dificultad', dificultadDe(ejercicio.dificultad)?.nombre || '—')}
          {fila('Dónde', ejercicio.entornos.map((e) => entornoDe(e)?.nombre).filter(Boolean).join(' · ') || '—')}
          {fila('Material', ejercicio.equipamiento.map((e) => equipo(e)?.nombre).filter(Boolean).join(' · ') || 'Nada')}
          {ejercicio.tipos.length > 0 && fila('Tipo', ejercicio.tipos.map((t) => TIPOS_EJERCICIO.find((x) => x.id === t)?.nombre).filter(Boolean).join(' · '))}
          {ejercicio.agarre && fila('Agarre', ejercicio.agarre)}
          {fila('Se mide en', ejercicio.medidas.map((x) => medidaDe(x)?.nombre).filter(Boolean).join(' · '))}
          {ejercicio.nombreTecnico && fila('También conocido como', ejercicio.nombreTecnico)}
        </div>
      </Card>

      <div>
        <SectionTitle sub="De cada repetición, cuánto se lleva cada zona">Músculos</SectionTitle>
        <Card>
          {musculos.map((mus) => (
            <BarraMusculo key={mus.subgrupoId} implicacion={mus} accent={accent} />
          ))}
        </Card>
      </div>

      {hayInstrucciones && (
        <div>
          <SectionTitle sub="Cómo se hace bien">Técnica</SectionTitle>
          <Card>
            {ins.preparacion && (
              <>
                <p className="text-xs font-bold" style={{ color: COLORS.text }}>Preparación</p>
                <p className="text-sm mb-2.5" style={{ color: COLORS.textMuted }}>{ins.preparacion}</p>
              </>
            )}
            {ins.ejecucion && (
              <>
                <p className="text-xs font-bold" style={{ color: COLORS.text }}>Ejecución</p>
                <p className="text-sm mb-2.5" style={{ color: COLORS.textMuted }}>{ins.ejecucion}</p>
              </>
            )}
            {ins.respiracion && (
              <>
                <p className="text-xs font-bold" style={{ color: COLORS.text }}>Respiración</p>
                <p className="text-sm mb-2.5" style={{ color: COLORS.textMuted }}>{ins.respiracion}</p>
              </>
            )}
            {ins.errores.length > 0 && (
              <>
                <p className="text-xs font-bold" style={{ color: COLORS.text }}>Errores frecuentes</p>
                <ul className="mb-2.5">
                  {ins.errores.map((e) => (
                    <li key={e} className="text-sm flex gap-2" style={{ color: COLORS.textMuted }}>
                      <span style={{ color: COLORS.negative }}>·</span>{e}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {ins.consejos.length > 0 && (
              <>
                <p className="text-xs font-bold" style={{ color: COLORS.text }}>Consejos</p>
                <ul>
                  {ins.consejos.map((c) => (
                    <li key={c} className="text-sm flex gap-2" style={{ color: COLORS.textMuted }}>
                      <span style={{ color: accent }}>·</span>{c}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ⚠️ El tutorial se declara, no se finge: sin vídeo ni animación, se dice
          con una frase corta en vez de dejar un reproductor que no reproduce
          nada (regla 8 y apartado 22). */}
      {!ejercicio.tutorial.video && !ejercicio.tutorial.animacion && (
        <p className="text-xs px-1" style={{ color: COLORS.textMuted }}>
          Todavía no hay vídeo de este ejercicio.
        </p>
      )}

      {base && (
        <div>
          <SectionTitle sub="Este ejercicio es una variante de">Ejercicio base</SectionTitle>
          <div className="space-y-2">
            <TarjetaEjercicio ejercicio={base} accent={accent} onAbrir={() => onAbrirOtro && onAbrirOtro(base.id)} />
          </div>
        </div>
      )}

      {variantes.length > 0 && (
        <div>
          <SectionTitle sub="Lo mismo, hecho de otra forma">Variantes</SectionTitle>
          <div className="space-y-2">
            {variantes.map((v) => (
              <TarjetaEjercicio key={v.id} ejercicio={v} accent={accent} onAbrir={() => onAbrirOtro && onAbrirOtro(v.id)} />
            ))}
          </div>
        </div>
      )}

      {progresiones.length > 0 && (
        <div>
          <SectionTitle sub="Por dónde se pasa antes de llegar aquí">Progresiones</SectionTitle>
          <div className="space-y-2">
            {progresiones.map((p) => (
              <TarjetaEjercicio key={p.id} ejercicio={p} accent={accent} onAbrir={() => onAbrirOtro && onAbrirOtro(p.id)} />
            ))}
          </div>
        </div>
      )}

      {sustitutos.length > 0 && (
        <div>
          <SectionTitle sub="Si hoy no puedes hacer éste">Alternativas</SectionTitle>
          <div className="space-y-2">
            {sustitutos.map((s) => (
              <TarjetaEjercicio key={s.id} ejercicio={s} accent={accent} onAbrir={() => onAbrirOtro && onAbrirOtro(s.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── El catálogo (apartado 23) ─────────────────────────────────────────────
   ⚠️ **Cuál filtro está puesto y qué se está buscando NO se guardan**: son
   estado de la pantalla, no un dato (EH F40). */
export default function EjerciciosView({
  propios = [], accent, onVolver = null, volverA = 'Fitness',
  onElegir = null, yaElegidos = [],
}) {
  const [consulta, setConsulta] = useState('');
  const [filtros, setFiltros] = useState({});
  const [abierto, setAbierto] = useState(null);
  const [verFiltros, setVerFiltros] = useState(false);

  const encontrados = useMemo(() => buscarEjercicios(consulta, propios), [consulta, propios]);
  const lista = useMemo(() => filtrarEjercicios(encontrados, {
    entornos: filtros.entorno ? [filtros.entorno] : null,
    equipamiento: filtros.equipo ? [filtros.equipo] : null,
    grupo: filtros.grupo || null,
    dificultad: filtros.dificultad || null,
    tipos: filtros.tipo ? [filtros.tipo] : null,
  }), [encontrados, filtros]);
  const cuenta = useMemo(() => recuentos(encontrados), [encontrados]);

  const alternar = (clave, valor) => setFiltros((f) => (f[clave] === valor
    ? { ...f, [clave]: null }
    : { ...f, [clave]: valor }));
  const hayFiltros = Object.values(filtros).some(Boolean);

  if (abierto) {
    const ej = [...CATALOGO_EJERCICIOS, ...propios].find((e) => e.id === abierto);
    return (
      <DetalleEjercicio
        ejercicio={ej}
        accent={accent}
        onVolver={() => setAbierto(null)}
        onAbrirOtro={setAbierto}
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

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TextInput
            value={consulta}
            onChange={(ev) => setConsulta(ev.target.value)}
            placeholder="Buscar un ejercicio"
            aria-label="Buscar un ejercicio"
          />
        </div>
        <GhostBtn
          icon={verFiltros ? X : SlidersHorizontal}
          onClick={() => setVerFiltros((v) => !v)}
        >
          {verFiltros ? 'Cerrar' : 'Filtros'}
        </GhostBtn>
      </div>

      {verFiltros && (
        <Card>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textMuted }}>Dónde</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
            {ENTORNOS.map((e) => (
              <Pastilla key={e.id} activa={filtros.entorno === e.id} cuantos={cuenta.entornos[e.id]} accent={accent} onClick={() => alternar('entorno', e.id)}>
                {e.nombre}
              </Pastilla>
            ))}
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textMuted }}>Grupo muscular</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
            {GRUPOS_MUSCULARES.map((g) => (
              <Pastilla key={g.id} activa={filtros.grupo === g.id} cuantos={cuenta.grupos[g.id]} accent={accent} onClick={() => alternar('grupo', g.id)}>
                {g.nombre}
              </Pastilla>
            ))}
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textMuted }}>Material</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
            {EQUIPAMIENTO.filter((e) => cuenta.equipamiento[e.id] > 0).map((e) => (
              <Pastilla key={e.id} activa={filtros.equipo === e.id} cuantos={cuenta.equipamiento[e.id]} accent={accent} onClick={() => alternar('equipo', e.id)}>
                {e.nombre}
              </Pastilla>
            ))}
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textMuted }}>Dificultad</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
            {DIFICULTADES.map((d) => (
              <Pastilla key={d.id} activa={filtros.dificultad === d.id} cuantos={cuenta.dificultades[d.id]} accent={accent} onClick={() => alternar('dificultad', d.id)}>
                {d.nombre}
              </Pastilla>
            ))}
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textMuted }}>Tipo</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {TIPOS_EJERCICIO.filter((t) => cuenta.tipos[t.id] > 0).map((t) => (
              <Pastilla key={t.id} activa={filtros.tipo === t.id} cuantos={cuenta.tipos[t.id]} accent={accent} onClick={() => alternar('tipo', t.id)}>
                {t.nombre}
              </Pastilla>
            ))}
          </div>

          {hayFiltros && (
            <div className="mt-3">
              <GhostBtn icon={X} onClick={() => setFiltros({})}>Quitar los filtros</GhostBtn>
            </div>
          )}
        </Card>
      )}

      <p className="text-xs px-1" style={{ color: COLORS.textMuted }}>
        {lista.length} {lista.length === 1 ? 'ejercicio' : 'ejercicios'}
        {hayFiltros || consulta ? ` de ${CATALOGO_EJERCICIOS.length + propios.length}` : ''}
      </p>

      {/* ⚠️ Un vacío con salida, nunca una lista en blanco (apartado 17 de la F1). */}
      {lista.length === 0 ? (
        <Card>
          <div className="py-5 text-center">
            <Search size={22} style={{ color: COLORS.textMuted }} className="mx-auto mb-2" />
            <p className="text-sm font-bold" style={{ color: COLORS.text }}>Ningún ejercicio encaja</p>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              Prueba con menos filtros o con otra palabra.
            </p>
            {(hayFiltros || consulta) && (
              <div className="mt-3 flex justify-center">
                <GhostBtn icon={X} onClick={() => { setFiltros({}); setConsulta(''); }}>Empezar de nuevo</GhostBtn>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {lista.map((e) => (
            <TarjetaEjercicio
              key={e.id}
              ejercicio={e}
              accent={accent}
              accion={onElegir ? 'Añadir' : 'Ver'}
              marca={onElegir && yaElegidos.includes(e.id) ? 'Ya está' : null}
              onAbrir={() => (onElegir ? onElegir(e.id) : setAbierto(e.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
