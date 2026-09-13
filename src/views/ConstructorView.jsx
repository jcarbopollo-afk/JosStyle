/* ===========================================================================
   ENTREGA 4 · FASE 3/45 — EL CONSTRUCTOR DE ENTRENAMIENTOS, LA PANTALLA

   El flujo entero del objetivo: *"Entrenamiento → Crear entrenamiento → Añadir
   ejercicio → Configurar → Ordenar → Guardar"*. Y el criterio de éxito remata:
   *"Debe sentirse como el principio de un constructor de entrenamientos
   profesional, no como un formulario básico"*.

   🚨 **ESTA PANTALLA NO CALCULA NADA.** Añadir, editar, mover, duplicar,
   validar, la distribución muscular y la duración salen de
   `src/lib/constructor.js`. Aquí solo se dibuja y se recogen los toques.

   🚨 **Y NO ESCRIBE UNA SEGUNDA PANTALLA DE CATÁLOGO.** El selector de
   ejercicios del apartado 5 —buscar, filtrar, navegar— **es `EjerciciosView`**,
   la de la F2, en modo de elegir. Escribir otra habría dejado dos buscadores
   que acabarían encontrando cosas distintas (E3 F23 y E3 F22).

   ⚠️ **Ordenar se hace con flechas, no arrastrando.** El apartado 8 lo admite
   —*"o controles subir/bajar si el drag & drop no es suficientemente
   fiable"*— y es la decisión de EH F50: una flecha funciona con el lector de
   pantalla y en un dedo sobre una lista con scroll.
   =========================================================================== */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft, Plus, Check, ChevronUp, ChevronDown, Copy, Trash2, Pencil, X,
} from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import {
  Card, SectionTitle, TextInput, Textarea, GhostBtn, PrimaryButton, Field, EmptyHint,
} from '../components/ui';
import { iconoDeGrupo } from '../components/iconosFitness';
import { ENTORNOS, ejercicioPorId, musculoPrincipal } from '../lib/ejercicios';
import EjerciciosView from './EjerciciosView';
import {
  DESCANSOS, MODOS_LINEA, TIPOS_CARGA, MAX_SERIES,
  crearRutina, nombreDeLinea, textoDeSeries, textoDeCarga, musculosResumidos,
  anadirEjercicio, editarLinea, eliminarLinea, duplicarLinea, moverLinea,
  variantesDeLinea, cambiarVariante,
  resumenRutina, guardarRutina, hayCambios,
  guardarBorrador, borrarBorrador,
} from '../lib/constructor';

/* ── Un botón redondo de icono ─────────────────────────────────────────────
   ⚠️ Siempre con `aria-label` y con `toque-44`: un botón de solo icono sin
   nombre no lo puede pulsar quien usa VoiceOver (EH F42). */
function BotonIcono({ icon: Icono, label, onClick, disabled = false, peligro = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 toque-44 active:scale-90 disabled:opacity-30"
      style={{
        background: hexToRgba(COLORS.border, 0.45),
        color: peligro ? COLORS.negative : COLORS.textMuted,
      }}
    >
      <Icono size={16} />
    </button>
  );
}

/* ── Una fila de la lista de ejercicios (apartado 7) ───────────────────────
   *"nombre; variante; icono; número de series; repeticiones o duración;
   descanso; información muscular resumida; control para editar; control para
   eliminar"*. Todo eso, y nada más. */
export function FilaEjercicio({
  linea, propios = [], accent, primera = false, ultima = false,
  onEditar, onSubir, onBajar, onDuplicar, onEliminar,
}) {
  const ej = ejercicioPorId(linea.exerciseId, propios);
  const principal = musculoPrincipal(ej);
  const Icono = iconoDeGrupo(principal?.grupoId);
  const nombre = nombreDeLinea(linea, propios);
  const carga = textoDeCarga(linea);
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: hexToRgba(accent, 0.14), color: accent }}
        >
          <Icono size={20} />
        </div>
        <button
          onClick={onEditar}
          aria-label={`Editar ${nombre}`}
          className="min-w-0 flex-1 text-left toque-44 active:opacity-70"
        >
          <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {nombre}
          </p>
          <p className="text-xs mt-0.5" style={{ color: accent }}>
            {textoDeSeries(linea)}
            {carga ? ` · ${carga}` : ''}
            {linea.descanso ? ` · ${linea.descanso} s descanso` : ''}
          </p>
          <p className="text-[11px] truncate" style={{ color: COLORS.textMuted }}>
            {musculosResumidos(linea, propios)}
          </p>
          {linea.notas && (
            <p className="text-[11px] italic truncate mt-0.5" style={{ color: COLORS.textMuted }}>
              {linea.notas}
            </p>
          )}
        </button>
        <div className="flex flex-col gap-1 shrink-0">
          <BotonIcono icon={ChevronUp} label={`Subir ${nombre}`} onClick={onSubir} disabled={primera} />
          <BotonIcono icon={ChevronDown} label={`Bajar ${nombre}`} onClick={onBajar} disabled={ultima} />
        </div>
      </div>
      <div className="flex gap-2 mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <GhostBtn icon={Pencil} onClick={onEditar}>Configurar</GhostBtn>
        <GhostBtn icon={Copy} onClick={onDuplicar}>Duplicar</GhostBtn>
        <BotonIcono icon={Trash2} label={`Quitar ${nombre}`} onClick={onEliminar} peligro />
      </div>
    </Card>
  );
}

/* ── Un número con sus dos flechas ─────────────────────────────────────────
   El apartado 29 pide que *"la edición de series/reps sea especialmente
   cómoda"*: en un iPhone, escribir un número es abrir el teclado, así que se
   puede tocar más y menos **y** escribirlo. */
function Contador({
  label, valor, onCambiar, min = 0, max = 999, sufijo = '', vacio = '—', permiteVacio = true,
}) {
  const n = valor === null || valor === undefined ? null : Number(valor);
  const mueve = (d) => onCambiar(Math.max(min, Math.min(max, (n ?? min) + d)));
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        {/* ⚠️ Solo donde dejarlo en blanco significa algo. Un «quitar» sobre las
            series, que no pueden faltar, sería un botón que no hace lo que
            dice (regla 8). */}
        {permiteVacio && (
          <BotonIcono icon={X} label={`Quitar ${label}`} onClick={() => onCambiar(null)} disabled={n === null} />
        )}
        <button
          onClick={() => mueve(-1)}
          aria-label={`Bajar ${label}`}
          disabled={n !== null && n <= min}
          className="w-10 h-10 rounded-xl text-lg font-bold toque-44 active:scale-90 disabled:opacity-30"
          style={{ background: hexToRgba(COLORS.border, 0.45), color: COLORS.text }}
        >−</button>
        <div
          className="flex-1 text-center rounded-xl py-2.5 text-base font-extrabold"
          style={{ background: hexToRgba(COLORS.border, 0.3), color: COLORS.text, minHeight: 44 }}
        >
          {n === null ? vacio : `${n}${sufijo}`}
        </div>
        <button
          onClick={() => mueve(1)}
          aria-label={`Subir ${label}`}
          disabled={n !== null && n >= max}
          className="w-10 h-10 rounded-xl text-lg font-bold toque-44 active:scale-90 disabled:opacity-30"
          style={{ background: hexToRgba(COLORS.border, 0.45), color: COLORS.text }}
        >+</button>
      </div>
    </Field>
  );
}

function Pastilla({ activa, children, accent, onClick, label }) {
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
    </button>
  );
}

/* ── El editor de una línea (apartado 15) ──────────────────────────────────
   🚨 Cambia **esa línea de esa rutina**, nunca el ejercicio del catálogo. */
export function EditorLinea({
  linea, propios = [], accent, onCambiar, onCerrar, onCambiarVariante = null,
}) {
  if (!linea) return <EmptyHint text="Ese ejercicio ya no está en la rutina." />;
  const nombre = nombreDeLinea(linea, propios);
  const carga = TIPOS_CARGA.find((t) => t.id === linea.tipoCarga);
  const otrasVariantes = variantesDeLinea(linea, propios);
  const set = (cambios) => onCambiar(cambios);
  return (
    <div className="space-y-4">
      <button
        onClick={onCerrar}
        aria-label="Volver al entrenamiento"
        className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
        style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
      >
        <ArrowLeft size={16} /> Entrenamiento
      </button>

      <Card>
        <p className="text-lg font-extrabold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {nombre}
        </p>
        <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
          {musculosResumidos(linea, propios)}
        </p>
      </Card>

      <Card>
        <Contador
          label="Series"
          valor={linea.series}
          min={1}
          max={MAX_SERIES}
          permiteVacio={false}
          onCambiar={(v) => set({ series: v === null ? 1 : v })}
        />

        {/* Apartado 11: repeticiones o tiempo, y se puede cambiar. */}
        <Field label="Se mide en">
          <div className="flex gap-1.5">
            {MODOS_LINEA.map((m) => (
              <Pastilla
                key={m.id}
                activa={linea.modo === m.id}
                accent={accent}
                label={`Medir en ${m.nombre.toLowerCase()}`}
                onClick={() => set({ modo: m.id })}
              >
                {m.nombre}
              </Pastilla>
            ))}
          </div>
        </Field>

        {linea.modo === 'tiempo' ? (
          <Contador
            label="Segundos por serie"
            valor={linea.duracion}
            min={1}
            max={600}
            sufijo=" s"
            onCambiar={(v) => set({ duracion: v })}
          />
        ) : (
          <>
            <Contador
              label="Repeticiones"
              valor={linea.repeticiones}
              min={1}
              max={200}
              onCambiar={(v) => set({ repeticiones: v })}
            />
            {/* Apartado 10: *"repeticiones exactas; rango de repeticiones"*. */}
            <Contador
              label="Hasta (para un rango, 8–12)"
              valor={linea.repsHasta}
              min={1}
              max={200}
              onCambiar={(v) => set({ repsHasta: v })}
            />
          </>
        )}

        {/* Apartado 12: ni todos los ejercicios llevan peso, ni el mismo tipo. */}
        <Field label="Carga">
          <div className="flex gap-1.5 flex-wrap">
            {TIPOS_CARGA.map((t) => (
              <Pastilla
                key={t.id}
                activa={linea.tipoCarga === t.id}
                accent={accent}
                label={`Carga: ${t.nombre.toLowerCase()}`}
                onClick={() => set({ tipoCarga: t.id, peso: t.llevaNumero ? linea.peso : null })}
              >
                {t.nombre}
              </Pastilla>
            ))}
          </div>
        </Field>
        {carga && carga.llevaNumero && (
          <Field label="Kilos">
            <TextInput
              value={linea.peso === null ? '' : String(linea.peso)}
              inputMode="decimal"
              placeholder="Sin poner"
              aria-label="Kilos"
              onChange={(ev) => set({ peso: ev.target.value === '' ? null : ev.target.value })}
            />
          </Field>
        )}

        <Field label="Descanso entre series">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {DESCANSOS.map((d) => (
              <Pastilla
                key={d}
                activa={linea.descanso === d}
                accent={accent}
                label={`Descansar ${d} segundos`}
                onClick={() => set({ descanso: d })}
              >
                {d} s
              </Pastilla>
            ))}
          </div>
        </Field>

        {/* Apartado 15: *"variante cuando sea compatible"*. ⚠️ Solo se ofrece si
            ese ejercicio tiene familia — si no, sería una lista vacía con
            título (regla 8). */}
        {onCambiarVariante && otrasVariantes.length > 0 && (
          <Field label="Variante">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {otrasVariantes.map((v) => (
                <Pastilla
                  key={v.id}
                  activa={false}
                  accent={accent}
                  label={`Cambiar a ${v.nombre}${v.variante ? ` · ${v.variante}` : ''}`}
                  onClick={() => onCambiarVariante(v.id)}
                >
                  {v.variante || v.nombre}
                </Pastilla>
              ))}
            </div>
          </Field>
        )}

        {/* Apartado 14: la nota de la PLANTILLA, no la de una sesión real. */}
        <Field label="Nota">
          <Textarea
            value={linea.notas}
            rows={2}
            placeholder="Ej: controlar la excéntrica"
            aria-label="Nota del ejercicio"
            onChange={(ev) => set({ notas: ev.target.value })}
          />
        </Field>
      </Card>

      <PrimaryButton accent={accent} icon={Check} onClick={onCerrar}>Hecho</PrimaryButton>
    </div>
  );
}

/* ── La previsualización (apartado 22) ─────────────────────────────────────
   Todo derivado: ni el número de ejercicios, ni la duración, ni un solo
   porcentaje están guardados en ninguna parte. */
export function ResumenConstructor({ rutina, propios = [], accent }) {
  const res = resumenRutina(rutina, propios);
  if (res.ejercicios === 0) return null;
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {res.ejercicios} {res.ejercicios === 1 ? 'ejercicio' : 'ejercicios'}
        </p>
        {/* ⚠️ El «≈» viene del propio texto: es una estimación y tiene que
            parecerlo (apartado 20). */}
        <p className="text-sm font-extrabold" style={{ color: accent }}>{res.duracion}</p>
      </div>
      {res.distribucion.grupos.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textMuted }}>
            Distribución muscular
          </p>
          {res.distribucion.grupos.map((g) => (
            <div key={g.grupoId} className="mb-2 last:mb-0">
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
        </div>
      )}
    </Card>
  );
}

/* ── El constructor ────────────────────────────────────────────────────────
   ⚠️ Qué se está editando, si el selector está abierto y si hay un aviso son
   **estado de la pantalla**, no datos (EH F40). Lo único que sobrevive a cerrar
   la aplicación es el borrador, y vive en el dispositivo (apartado 25). */
export default function ConstructorView({
  planes = [], propios = [], accent, rutinaInicial = null, onGuardar, onVolver,
}) {
  const [rutina, setRutina] = useState(() => rutinaInicial || crearRutina({}));
  /* Con qué se entró, para saber si hay algo que perder al salir (apartado 26). */
  const [original] = useState(() => rutinaInicial || crearRutina({}));
  const [eligiendo, setEligiendo] = useState(false);
  const [editando, setEditando] = useState(null);
  const [avisoSalir, setAvisoSalir] = useState(false);
  const [problemas, setProblemas] = useState([]);
  const [guardado, setGuardado] = useState(false);
  const primeraVez = useRef(true);

  /* Apartado 25: *"Implementa un borrador local mientras el entrenamiento está
     siendo creado"*. Se guarda al cambiar algo, no al entrar: si no, entrar y
     salir sin tocar nada dejaría un borrador vacío que reaparecería mañana. */
  useEffect(() => {
    if (primeraVez.current) { primeraVez.current = false; return; }
    guardarBorrador(rutina);
  }, [rutina]);

  const cambios = useMemo(() => hayCambios(rutina, original), [rutina, original]);

  const cambiar = (siguiente) => { setRutina(siguiente); setGuardado(false); setProblemas([]); };

  const salir = () => {
    /* Apartado 26: *"No muestres esta alerta si no existen cambios"*. */
    if (cambios && !guardado) { setAvisoSalir(true); return; }
    borrarBorrador();
    onVolver && onVolver();
  };

  const guardar = () => {
    const r = guardarRutina(planes, rutina, propios);
    if (!r.ok) { setProblemas(r.problemas); return; }
    borrarBorrador();
    setProblemas([]);
    setGuardado(true);
    onGuardar && onGuardar(r.planes, r.plan);
  };

  /* Apartado 5 y 6: el selector ES el catálogo de la F2, y elegir añade y
     **te deja seguir añadiendo** — *"sin perder el contexto"*. */
  if (eligiendo) {
    return (
      <EjerciciosView
        propios={propios}
        accent={accent}
        volverA="Entrenamiento"
        onVolver={() => setEligiendo(false)}
        onElegir={(id) => cambiar(anadirEjercicio(rutina, id, { propios }))}
        yaElegidos={rutina.lineas.map((l) => l.exerciseId)}
      />
    );
  }

  if (editando) {
    const linea = rutina.lineas.find((l) => l.id === editando);
    return (
      <EditorLinea
        linea={linea}
        propios={propios}
        accent={accent}
        onCambiar={(c) => cambiar(editarLinea(rutina, editando, c))}
        onCambiarVariante={(id) => cambiar(cambiarVariante(rutina, editando, id, propios))}
        onCerrar={() => setEditando(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Apartado 4: volver, título y guardar. */}
      <div className="flex items-center gap-2">
        <button
          onClick={salir}
          aria-label="Volver a Entrenamiento"
          className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
          style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
        >
          <ArrowLeft size={16} /> Entrenamiento
        </button>
        <div className="flex-1" />
        {/* ⚠️ **«Guardar» NO se apaga cuando falta algo**, y es deliberado: un
            botón apagado no dice QUÉ corregir, y eso es lo que prohíbe EH F62.
            Se pulsa, y la validación contesta con palabras. */}
        <PrimaryButton accent={accent} icon={Check} onClick={guardar}>
          Guardar
        </PrimaryButton>
      </div>

      {avisoSalir && (
        <Card style={{ border: `1px solid ${COLORS.negative}` }}>
          <p className="text-sm font-bold" style={{ color: COLORS.text }}>¿Salir sin guardar?</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            Lo que llevas escrito se queda como borrador en este dispositivo.
          </p>
          <div className="flex gap-2 mt-3">
            <GhostBtn onClick={() => setAvisoSalir(false)}>Seguir editando</GhostBtn>
            <GhostBtn icon={X} onClick={() => { setAvisoSalir(false); onVolver && onVolver(); }}>Salir</GhostBtn>
          </div>
        </Card>
      )}

      {guardado && (
        <Card style={{ border: `1px solid ${accent}` }}>
          <p className="text-sm font-bold" style={{ color: COLORS.text }}>
            <Check size={14} className="inline mr-1.5" style={{ color: accent }} />
            Entrenamiento guardado
          </p>
        </Card>
      )}

      {/* Apartado 3: nombre, descripción y entorno — y el entorno NO es
          obligatorio, porque una rutina puede ser híbrida. */}
      <Card>
        <Field label="Nombre">
          <TextInput
            value={rutina.nombre}
            placeholder="Ej: Push"
            aria-label="Nombre del entrenamiento"
            onChange={(ev) => cambiar({ ...rutina, nombre: ev.target.value })}
          />
        </Field>
        <Field label="Descripción (si quieres)">
          <Textarea
            value={rutina.descripcion}
            rows={2}
            placeholder="Para qué es este entrenamiento"
            aria-label="Descripción del entrenamiento"
            onChange={(ev) => cambiar({ ...rutina, descripcion: ev.target.value })}
          />
        </Field>
        <Field label="Dónde (puedes marcar varios, o ninguno)">
          <div className="flex gap-1.5 flex-wrap">
            {ENTORNOS.map((e) => (
              <Pastilla
                key={e.id}
                activa={rutina.entornos.includes(e.id)}
                accent={accent}
                label={`Entrenar en ${e.nombre.toLowerCase()}`}
                onClick={() => cambiar({
                  ...rutina,
                  entornos: rutina.entornos.includes(e.id)
                    ? rutina.entornos.filter((x) => x !== e.id)
                    : [...rutina.entornos, e.id],
                })}
              >
                {e.nombre}
              </Pastilla>
            ))}
          </div>
        </Field>
      </Card>

      <ResumenConstructor rutina={rutina} propios={propios} accent={accent} />

      <div>
        <SectionTitle sub="En el orden en el que los vas a hacer">Ejercicios</SectionTitle>
        {rutina.lineas.length === 0 ? (
          <Card>
            <div className="py-5 text-center">
              <p className="text-sm font-bold" style={{ color: COLORS.text }}>Todavía no hay ningún ejercicio</p>
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                Elígelos del catálogo, uno a uno.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {rutina.lineas.map((l, i) => (
              <FilaEjercicio
                key={l.id}
                linea={l}
                propios={propios}
                accent={accent}
                primera={i === 0}
                ultima={i === rutina.lineas.length - 1}
                onEditar={() => setEditando(l.id)}
                onSubir={() => cambiar(moverLinea(rutina, l.id, 'arriba'))}
                onBajar={() => cambiar(moverLinea(rutina, l.id, 'abajo'))}
                onDuplicar={() => cambiar(duplicarLinea(rutina, l.id))}
                onEliminar={() => cambiar(eliminarLinea(rutina, l.id))}
              />
            ))}
          </div>
        )}
      </div>

      <PrimaryButton accent={accent} icon={Plus} onClick={() => setEligiendo(true)}>
        Añadir ejercicio
      </PrimaryButton>

      {/* 🚨 Lo que falta se dice con palabras y con el campo que lo arregla,
          nunca «Error» a secas (EH F62). Solo después de intentar guardar: un
          aviso mientras escribe el nombre sería regañarle por no haber
          terminado. */}
      {problemas.length > 0 && (
        <Card style={{ border: `1px solid ${COLORS.negative}` }}>
          <p className="text-sm font-bold" style={{ color: COLORS.text }}>Falta algo para poder guardar</p>
          <ul className="mt-1.5">
            {problemas.map((p) => (
              <li key={`${p.campo}-${p.lineaId || ''}-${p.que}`} className="text-xs flex gap-2" style={{ color: COLORS.textMuted }}>
                <span style={{ color: COLORS.negative }}>·</span>{p.que}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
