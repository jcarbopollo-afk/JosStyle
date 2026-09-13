/* ===========================================================================
   ENTREGA 4 · FASE 4/45 — TUS PLANTILLAS, LA PANTALLA

   El objetivo lo dice en una línea: *"No quiero simplemente una lista visual.
   Todas las acciones deben funcionar realmente y persistir los cambios"*.

   🚨 **ESTA PANTALLA NO CALCULA NADA.** Buscar, filtrar, ordenar, contar,
   resolver la distribución muscular, estimar la duración y decidir qué se lleva
   un borrado salen de `src/lib/plantillas.js` y `src/lib/constructor.js`.

   🚨 **Y NO ESCRIBE UN SEGUNDO CONSTRUCTOR** (apartado 23): *Editar* abre el de
   la F3 con `planARutina`, y guardar vuelve por `rutinaAPlan`. La integración
   es bidireccional porque **es el mismo modelo**, no porque se sincronicen dos.

   ⚠️ **El menú de acciones se despliega dentro de la tarjeta**, sin `fixed
   inset-0` ni portal (regla 3): en un iPhone un menú flotante se sale de la
   tarjeta al hacer scroll, y `react-dom/server` no sabe pintar un portal, así
   que además se quedaría sin un solo caso de renderizado.
   =========================================================================== */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Search, X, MoreHorizontal, Pencil, Copy, Trash2, Plus, ArrowUpDown,
} from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import {
  Card, SectionTitle, TextInput, GhostBtn, PrimaryButton,
} from '../components/ui';
import { iconoDeGrupo } from '../components/iconosFitness';
import {
  ORDENACIONES, ORDEN_POR_DEFECTO, MINIMO_PARA_BUSCAR, FILTRO_TODOS, filtrosDeEntorno,
  fichaDePlantilla, lineasDePlantilla, plantillasVisibles, contarPorEntorno,
  avisoDeEliminar, ESTADO_VACIO_PLANTILLAS,
} from '../lib/plantillas';
import { textoDeSeries, textoDeCarga, musculosResumidos } from '../lib/constructor';

function Pastilla({ activa, children, cuantos = null, accent, onClick, label }) {
  const apagada = cuantos === 0;
  return (
    <button
      onClick={onClick}
      disabled={apagada}
      aria-pressed={activa}
      aria-label={label}
      className="px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 toque-44 active:scale-[0.97]"
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

/* ── La tarjeta de una plantilla (apartados 3 y 4) ─────────────────────────
   *"thumbnail; nombre; número de ejercicios; duración aproximada; entorno;
   objetivo si existe; fecha de última modificación"*, y un menú de acciones.
   ⚠️ El objetivo **no está**, y no es un olvido: está declarado en
   `SIN_OBJETIVO` porque el apartado 6 no deja editarlo en ninguna parte. */
export function TarjetaPlantilla({
  plantilla, propios = [], accent, hoy, onVer, onEditar, onDuplicar, onEliminar,
}) {
  const [abierto, setAbierto] = useState(false);
  const ficha = fichaDePlantilla(plantilla, propios, hoy);
  if (!ficha) return null;
  const Icono = iconoDeGrupo(ficha.grupo?.grupoId);
  const linea = [
    ficha.entornos.join(' · '),
    `${ficha.ejercicios} ${ficha.ejercicios === 1 ? 'ejercicio' : 'ejercicios'}`,
    ficha.duracion,
  ].filter(Boolean).join(' · ');

  return (
    <Card>
      <div className="flex items-center gap-3">
        {/* 🚨 El *thumbnail*: el grupo que más pesa en la propia rutina. No es una
            imagen inventada — sale de la distribución muscular. */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: hexToRgba(accent, 0.14), color: accent }}
        >
          <Icono size={22} />
        </div>
        <button
          onClick={onVer}
          aria-label={`Ver ${ficha.nombre}`}
          className="min-w-0 flex-1 text-left toque-44 active:opacity-70"
        >
          <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {ficha.nombre}
          </p>
          <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
            {/* ⚠️ Una plantilla sin ejercicios se dice, no deja la tarjeta muda
                (apartado 24). */}
            {ficha.vacia ? 'Todavía sin ejercicios' : linea}
          </p>
          {ficha.editado && (
            <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>{ficha.editado}</p>
          )}
        </button>
        <button
          onClick={() => setAbierto((v) => !v)}
          aria-label={abierto ? `Cerrar las acciones de ${ficha.nombre}` : `Acciones de ${ficha.nombre}`}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 toque-44 active:scale-90"
          style={{ background: hexToRgba(COLORS.border, 0.45), color: COLORS.textMuted }}
        >
          {abierto ? <X size={16} /> : <MoreHorizontal size={16} />}
        </button>
      </div>

      {/* Apartado 4: *"No quiero botones enormes para todas las acciones."* */}
      {abierto && (
        <div className="flex gap-2 flex-wrap mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <GhostBtn icon={Pencil} onClick={onEditar}>Editar</GhostBtn>
          <GhostBtn icon={Copy} onClick={onDuplicar}>Duplicar</GhostBtn>
          <GhostBtn icon={Trash2} onClick={onEliminar}>Eliminar</GhostBtn>
        </div>
      )}
    </Card>
  );
}

/* ── La confirmación de borrado (apartado 8) ───────────────────────────────
   ⚠️ Dice **lo que se lleva** y **que vuelve**: la plantilla va a Eliminados
   recientes, así que prometer un borrado definitivo sería mentir (E3 F26). */
export function ConfirmarEliminarPlantilla({ plantilla, onCancelar, onEliminar }) {
  if (!plantilla) return null;
  const aviso = avisoDeEliminar(plantilla);
  return (
    <Card style={{ border: `1px solid ${COLORS.negative}` }}>
      <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
        {aviso.titulo}
      </p>
      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{aviso.que}</p>
      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{aviso.vuelve}</p>
      <div className="flex gap-2 mt-3">
        <GhostBtn onClick={onCancelar}>{aviso.cancelar}</GhostBtn>
        <GhostBtn icon={Trash2} onClick={onEliminar}>{aviso.eliminar}</GhostBtn>
      </div>
    </Card>
  );
}

/* ── El detalle (apartado 9) ───────────────────────────────────────────────
   Cabecera, información, distribución muscular y los ejercicios. ⚠️ Y **sin
   «Empezar entrenamiento»**: el apartado 19 prefiere no enseñarlo a enseñarlo
   muerto, y el motor es la FIT F7. */
export function DetallePlantilla({
  plantilla, propios = [], accent, hoy, onVolver, onEditar, onDuplicar, onEliminar,
}) {
  const ficha = fichaDePlantilla(plantilla, propios, hoy);
  if (!ficha) {
    return (
      <Card>
        <p className="text-sm font-bold" style={{ color: COLORS.text }}>Esa plantilla ya no está</p>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
          Puede que la hayas eliminado desde otra pantalla.
        </p>
        {onVolver && <div className="mt-3"><GhostBtn icon={ArrowLeft} onClick={onVolver}>Tus plantillas</GhostBtn></div>}
      </Card>
    );
  }
  const filas = lineasDePlantilla(plantilla, propios);

  return (
    <div className="space-y-4">
      <button
        onClick={onVolver}
        aria-label="Volver a Tus plantillas"
        className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
        style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
      >
        <ArrowLeft size={16} /> Tus plantillas
      </button>

      <Card>
        <p className="text-xl font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {ficha.nombre}
        </p>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
          {[ficha.entornos.join(' · '),
            `${ficha.ejercicios} ${ficha.ejercicios === 1 ? 'ejercicio' : 'ejercicios'}`,
            ficha.duracion].filter(Boolean).join(' · ')}
        </p>
        {ficha.editado && (
          <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>{ficha.editado}</p>
        )}
        {ficha.descripcion && (
          <p className="text-sm mt-2 leading-relaxed" style={{ color: COLORS.textMuted }}>{ficha.descripcion}</p>
        )}
        <div className="flex gap-2 flex-wrap mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <GhostBtn icon={Pencil} onClick={onEditar}>Editar</GhostBtn>
          <GhostBtn icon={Copy} onClick={onDuplicar}>Duplicar</GhostBtn>
          <GhostBtn icon={Trash2} onClick={onEliminar}>Eliminar</GhostBtn>
        </div>
      </Card>

      {ficha.distribucion.grupos.length > 0 && (
        <div>
          <SectionTitle sub="De toda la rutina, cuánto se lleva cada zona">Distribución muscular</SectionTitle>
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

      <div>
        <SectionTitle sub="En el orden en el que los vas a hacer">Ejercicios</SectionTitle>
        {filas.length === 0 ? (
          <Card>
            <p className="text-sm font-bold" style={{ color: COLORS.text }}>Esta plantilla no tiene ejercicios</p>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              Ábrela en el constructor y añádele los que quieras.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filas.map((l) => {
              const Icono = iconoDeGrupo(null);
              const carga = textoDeCarga(l);
              return (
                <Card key={l.id}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: hexToRgba(l.existe ? accent : COLORS.negative, 0.14),
                        color: l.existe ? accent : COLORS.negative,
                      }}
                    >
                      <Icono size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
                        {l.nombre}
                      </p>
                      {/* ⚠️ Apartado 24: si el ejercicio ya no está, se dice — no se
                          rompe la plantilla entera. */}
                      {!l.existe ? (
                        <p className="text-xs" style={{ color: COLORS.negative }}>Ejercicio no disponible</p>
                      ) : (
                        <>
                          <p className="text-xs" style={{ color: accent }}>
                            {textoDeSeries(l)}
                            {carga ? ` · ${carga}` : ''}
                            {l.descanso ? ` · ${l.descanso} s descanso` : ''}
                          </p>
                          <p className="text-[11px] truncate" style={{ color: COLORS.textMuted }}>
                            {musculosResumidos(l, propios)}
                          </p>
                        </>
                      )}
                      {l.notas && (
                        <p className="text-[11px] italic truncate mt-0.5" style={{ color: COLORS.textMuted }}>{l.notas}</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Tus plantillas (apartado 3) ───────────────────────────────────────────
   ⚠️ Qué orden está puesto, qué se busca y qué filtro hay son **estado de la
   pantalla**, no datos (EH F40). El apartado 14 pide que el orden *"se mantenga
   durante la sesión si es sencillo"*: se mantiene mientras la pantalla esté
   abierta, que es exactamente lo que se puede prometer sin guardarlo. */
export default function PlantillasView({
  plantillas = [], propios = [], accent, hoy,
  onVolver = null, onCrear = null, onEditar = null, onDuplicar = null, onEliminar = null,
}) {
  const [consulta, setConsulta] = useState('');
  const [entorno, setEntorno] = useState(FILTRO_TODOS);
  const [orden, setOrden] = useState(ORDEN_POR_DEFECTO);
  const [verOrden, setVerOrden] = useState(false);
  const [abierta, setAbierta] = useState(null);
  const [borrando, setBorrando] = useState(null);

  const visibles = useMemo(
    () => plantillasVisibles(plantillas, { consulta, entorno, orden }),
    [plantillas, consulta, entorno, orden],
  );
  const cuenta = useMemo(() => contarPorEntorno(plantillas), [plantillas]);
  const hayBuscador = plantillas.length >= MINIMO_PARA_BUSCAR;

  const enPantalla = abierta ? plantillas.find((p) => p.id === abierta) : null;

  if (abierta) {
    return (
      <DetallePlantilla
        plantilla={enPantalla}
        propios={propios}
        accent={accent}
        hoy={hoy}
        onVolver={() => setAbierta(null)}
        onEditar={() => onEditar && onEditar(enPantalla)}
        onDuplicar={() => { onDuplicar && onDuplicar(enPantalla); setAbierta(null); }}
        onEliminar={() => { setBorrando(enPantalla); setAbierta(null); }}
      />
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

      {borrando && (
        <ConfirmarEliminarPlantilla
          plantilla={borrando}
          onCancelar={() => setBorrando(null)}
          onEliminar={() => { const p = borrando; setBorrando(null); onEliminar && onEliminar(p); }}
        />
      )}

      {plantillas.length === 0 ? (
        <Card>
          <div className="py-6 text-center">
            <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
              {ESTADO_VACIO_PLANTILLAS.titulo}
            </p>
            <p className="text-xs mt-1.5" style={{ color: COLORS.textMuted }}>
              {ESTADO_VACIO_PLANTILLAS.texto}
            </p>
            {/* 🚨 Un vacío sin salida es una pantalla rota (EH F41). */}
            {onCrear && (
              <div className="mt-4">
                <PrimaryButton accent={accent} icon={Plus} onClick={onCrear}>
                  {ESTADO_VACIO_PLANTILLAS.accion}
                </PrimaryButton>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Apartado 15: el buscador solo cuando hay bastantes para que sirva. */}
          {hayBuscador && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <TextInput
                  value={consulta}
                  onChange={(ev) => setConsulta(ev.target.value)}
                  placeholder="Buscar una plantilla"
                  aria-label="Buscar una plantilla"
                />
              </div>
              <GhostBtn icon={verOrden ? X : ArrowUpDown} onClick={() => setVerOrden((v) => !v)}>
                {verOrden ? 'Cerrar' : 'Orden'}
              </GhostBtn>
            </div>
          )}

          {verOrden && (
            <Card>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textMuted }}>
                Ordenar por
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {ORDENACIONES.map((o) => (
                  <Pastilla
                    key={o.id}
                    activa={orden === o.id}
                    accent={accent}
                    label={`Ordenar por ${o.nombre.toLowerCase()}`}
                    onClick={() => setOrden(o.id)}
                  >
                    {o.nombre}
                  </Pastilla>
                ))}
              </div>
            </Card>
          )}

          {/* Apartado 16. Cada pastilla dice cuántas quedarían, y la que dejaría
              cero se apaga — igual que en el catálogo de la F2. */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {filtrosDeEntorno().map((f) => (
              <Pastilla
                key={f.id}
                activa={entorno === f.id}
                cuantos={f.id === FILTRO_TODOS ? null : cuenta[f.id]}
                accent={accent}
                label={f.id === FILTRO_TODOS ? 'Ver todas' : `Filtrar por ${f.nombre.toLowerCase()}`}
                onClick={() => setEntorno(f.id)}
              >
                {f.nombre}
              </Pastilla>
            ))}
          </div>

          <p className="text-xs px-1" style={{ color: COLORS.textMuted }}>
            {visibles.length} {visibles.length === 1 ? 'plantilla' : 'plantillas'}
            {visibles.length !== plantillas.length ? ` de ${plantillas.length}` : ''}
          </p>

          {visibles.length === 0 ? (
            <Card>
              <div className="py-5 text-center">
                <Search size={22} style={{ color: COLORS.textMuted }} className="mx-auto mb-2" />
                <p className="text-sm font-bold" style={{ color: COLORS.text }}>Ninguna encaja</p>
                <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                  Prueba con otra palabra o quita el filtro.
                </p>
                <div className="mt-3 flex justify-center">
                  <GhostBtn icon={X} onClick={() => { setConsulta(''); setEntorno(FILTRO_TODOS); }}>
                    Empezar de nuevo
                  </GhostBtn>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {visibles.map((p) => (
                <TarjetaPlantilla
                  key={p.id}
                  plantilla={p}
                  propios={propios}
                  accent={accent}
                  hoy={hoy}
                  onVer={() => setAbierta(p.id)}
                  onEditar={() => onEditar && onEditar(p)}
                  onDuplicar={() => onDuplicar && onDuplicar(p)}
                  onEliminar={() => setBorrando(p)}
                />
              ))}
            </div>
          )}

          {onCrear && (
            <PrimaryButton accent={accent} icon={Plus} onClick={onCrear}>Crear entrenamiento</PrimaryButton>
          )}
        </>
      )}
    </div>
  );
}
