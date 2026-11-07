/* ===========================================================================
   FITNESS 3/8 — EL EDITOR DE UNA RUTINA (crear y editar)

   Una rutina es un ciclo de 1 a 30 días. Al crearla salen **todos sus días sin
   decidir** (prompt 3 §4) y cada uno se decide: entrenamiento —con una plantilla,
   que puede repetirse en otros días— o descanso. No se guarda con días sin decidir,
   y la pantalla dice cuáles faltan en vez de apagar el botón (EH F62).

   🚨 **ESTA PANTALLA NO CALCULA NI GUARDA.** Qué falta, qué pasa al quitar días y
   cómo se guarda salen de `src/lib/rutinasCiclicas.js`; guardar lo hace quien la
   abre (`onGuardar`), con el `fitness` entero (regla 5).

   ⚠️ Se abre a pantalla completa, sin las pestañas de Fitness debajo (como el
   constructor): con las pestañas, media rutina se perdería de un toque. Los
   desplegables son `Plegable` y la lista de días, `ListaAnimada` (Motion System).
   =========================================================================== */

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Check, Minus, Plus, Moon, Dumbbell, X, Search } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { acentoLegible } from '../lib/acabadoFitness';
import { Card, SectionTitle, TextInput, GhostBtn, PrimaryButton, Field } from '../components/ui';
import { ChevronDespliegue } from '../components/motion';
import { Plegable, ListaAnimada } from '../components/layoutMotion';
import { PROPS_CAMPO_BUSQUEDA } from '../lib/movilFitness';
import {
  DURACION_RUTINA, cambiarDuracion, configurarDia, validarRutinaCiclica, textoDeDia,
  origenDePlantilla, EXPLICACIONES_RUTINA,
} from '../lib/rutinasCiclicas';

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const ranura = (v) => texto(v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
/* Cuántas plantillas se enseñan sin buscar: con las 63 predeterminadas a la vista
   el día se convertiría en una lista interminable. */
const SIN_BUSCAR = 6;

/** Lo que se elige para un día: descanso o una plantilla, con buscador. */
export function EleccionDeDia({ dia, plantillas = [], usadasEnRutina = [], accent, onElegir, onCrearPlantilla = null }) {
  const [consulta, setConsulta] = useState('');
  const q = ranura(consulta);
  const ordenadas = useMemo(() => {
    const usadas = plantillas.filter((p) => usadasEnRutina.includes(p.id));
    const resto = plantillas.filter((p) => !usadasEnRutina.includes(p.id));
    return [...usadas, ...resto];
  }, [plantillas, usadasEnRutina]);
  const visibles = q
    ? ordenadas.filter((p) => ranura(`${p.nombre} ${origenDePlantilla(p)}`).includes(q))
    : ordenadas.slice(0, SIN_BUSCAR);
  const ocultas = q ? 0 : Math.max(0, ordenadas.length - SIN_BUSCAR);

  return (
    <div className="space-y-2 pt-2">
      <button
        onClick={() => onElegir({ tipo: 'descanso' })}
        aria-pressed={dia.tipo === 'descanso'}
        className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-left toque-44 active:opacity-70"
        style={{
          background: dia.tipo === 'descanso' ? hexToRgba(accent, 0.14) : COLORS.surface2,
          color: COLORS.text,
          border: `1px solid ${dia.tipo === 'descanso' ? accent : COLORS.border}`,
        }}
      >
        <Moon size={16} style={{ color: COLORS.textMuted }} /> Descanso
      </button>

      <p className="text-[11px] font-bold uppercase tracking-wider pt-1" style={{ color: COLORS.textMuted }}>
        Entrenamiento: elige una plantilla
      </p>
      <TextInput
        value={consulta}
        onChange={(ev) => setConsulta(ev.target.value)}
        placeholder="Buscar una plantilla"
        aria-label="Buscar una plantilla para este día"
        {...PROPS_CAMPO_BUSQUEDA}
      />
      {visibles.length === 0 && (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>Ninguna plantilla se llama así.</p>
      )}
      {visibles.map((p) => {
        const elegida = dia.tipo === 'entreno' && dia.plantillaId === p.id;
        const de = origenDePlantilla(p);
        return (
          <button
            key={p.id}
            onClick={() => onElegir({ tipo: 'entreno', plantillaId: p.id })}
            aria-pressed={elegida}
            aria-label={`Asignar ${p.nombre}${de ? ` (${de})` : ''}`}
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left toque-44 active:opacity-70"
            style={{
              background: elegida ? hexToRgba(accent, 0.14) : COLORS.surface2,
              border: `1px solid ${elegida ? accent : COLORS.border}`,
            }}
          >
            <Dumbbell size={16} style={{ color: COLORS.textMuted }} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold truncate" style={{ color: COLORS.text }}>{p.nombre}</span>
              {(de || usadasEnRutina.includes(p.id)) && (
                <span className="block text-[11px] truncate" style={{ color: COLORS.textMuted }}>
                  {[usadasEnRutina.includes(p.id) ? 'Ya está en esta rutina' : '', de].filter(Boolean).join(' · ')}
                </span>
              )}
            </span>
            {elegida && <Check size={16} style={{ color: acentoLegible(accent) }} />}
          </button>
        );
      })}
      {ocultas > 0 && (
        <p className="text-[11px] flex items-center gap-1" style={{ color: COLORS.textMuted }}>
          <Search size={12} /> Y {ocultas} más: escribe su nombre para encontrarla.
        </p>
      )}
      {onCrearPlantilla && (
        <GhostBtn icon={Plus} onClick={onCrearPlantilla}>Crear una plantilla nueva</GhostBtn>
      )}
    </div>
  );
}

export default function EditorRutinaView({
  fitness, plantillas = [], rutinaInicial, nueva = false, accent,
  onGuardar = null, onVolver = null, onCrearPlantilla = null, onCambiar = null,
  /* Cómo estaba al abrirla, para saber si hay algo que perder al salir (quien la
     abre lo guarda: el editor se vuelve a montar al volver de crear una plantilla). */
  original: originalDado = null,
}) {
  const [rutina, setRutinaLocal] = useState(rutinaInicial);
  const [abierto, setAbierto] = useState(null);
  const [problemas, setProblemas] = useState([]);
  const [quitar, setQuitar] = useState(null);
  const [avisoSalir, setAvisoSalir] = useState(false);
  const [original] = useState(() => originalDado || JSON.stringify(rutinaInicial));

  /* Quien abre el editor guarda el borrador (para volver de crear una plantilla
     sin perder lo hecho): cada cambio se le cuenta. */
  const setRutina = (r) => { setRutinaLocal(r); if (onCambiar) onCambiar(r); setProblemas([]); };
  const cambiado = JSON.stringify(rutina) !== original;
  const usadas = (rutina?.dias || []).filter((d) => d.tipo === 'entreno').map((d) => d.plantillaId);

  if (!rutina) return null;
  const n = rutina.dias.length;

  const pedirDuracion = (m) => {
    const r = cambiarDuracion(rutina, m);
    if (!r.ok) { setProblemas([{ id: 'duracion', que: r.motivo }]); return; }
    /* Quitar días ya decididos se pregunta: es lo único que se pierde aquí. */
    if (r.quitados.length) { setQuitar(r); return; }
    setRutina(r.rutina);
  };

  const guardar = () => {
    const v = validarRutinaCiclica(rutina, fitness);
    if (!v.ok) { setProblemas(v.problemas); return; }
    const res = onGuardar ? onGuardar(rutina) : null;
    if (res && !res.ok) setProblemas(res.problemas || []);
  };

  const salir = () => { if (cambiado) setAvisoSalir(true); else if (onVolver) onVolver(); };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={salir}
        aria-label="Volver a Rutinas"
        className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
        style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
      >
        <ArrowLeft size={16} /> Rutinas
      </button>

      <SectionTitle sub={EXPLICACIONES_RUTINA.rutina}>{nueva ? 'Nueva rutina' : 'Editar rutina'}</SectionTitle>

      {avisoSalir && (
        <Card style={{ border: `1px solid ${COLORS.negative}` }}>
          <p className="text-sm font-bold" style={{ color: COLORS.text }}>¿Salir sin guardar?</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Los cambios de esta rutina se perderán.</p>
          <div className="flex gap-2 mt-3">
            <GhostBtn onClick={() => setAvisoSalir(false)}>Seguir editando</GhostBtn>
            <GhostBtn icon={X} onClick={() => { setAvisoSalir(false); if (onVolver) onVolver(); }}>Salir</GhostBtn>
          </div>
        </Card>
      )}

      <Card>
        <Field label="Nombre">
          <TextInput
            value={rutina.nombre}
            placeholder="Ej: Push Pull Legs"
            aria-label="Nombre de la rutina"
            onChange={(ev) => setRutina({ ...rutina, nombre: ev.target.value })}
          />
        </Field>
        <div className="mt-3">
          <p className="text-xs font-semibold mb-1.5" style={{ color: COLORS.textMuted }}>Días del ciclo</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => pedirDuracion(n - 1)}
              aria-label="Un día menos"
              className="w-10 h-10 rounded-xl flex items-center justify-center toque-44 active:opacity-60"
              style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            >
              <Minus size={16} />
            </button>
            <p className="text-xl font-extrabold tabular-nums" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }} aria-live="polite">
              {n} {n === 1 ? 'día' : 'días'}
            </p>
            <button
              onClick={() => pedirDuracion(n + 1)}
              aria-label="Un día más"
              className="w-10 h-10 rounded-xl flex items-center justify-center toque-44 active:opacity-60"
              style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            >
              <Plus size={16} />
            </button>
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>
            Entre {DURACION_RUTINA.min} y {DURACION_RUTINA.max} días. Al acabar el último, vuelve al día 1.
          </p>
        </div>
      </Card>

      {quitar && (
        <Card style={{ border: `1px solid ${COLORS.warning}` }}>
          <p className="text-sm font-bold" style={{ color: COLORS.text }}>
            ¿Quitar {quitar.quitados.length === 1 ? `el día ${quitar.quitados[0].numero}` : `los días ${quitar.quitados.map((d) => d.numero).join(', ')}`}?
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            Ya {quitar.quitados.length === 1 ? 'estaba decidido' : 'estaban decididos'}. Las plantillas no se borran.
          </p>
          <div className="flex gap-2 mt-3">
            <GhostBtn onClick={() => setQuitar(null)}>Cancelar</GhostBtn>
            <GhostBtn icon={Minus} onClick={() => { setRutina(quitar.rutina); setQuitar(null); }}>Quitar</GhostBtn>
          </div>
        </Card>
      )}

      <div>
        <SectionTitle sub={EXPLICACIONES_RUTINA.dia}>Los días</SectionTitle>
        <ListaAnimada className="space-y-2">
          {rutina.dias.map((d, i) => {
            const estaAbierto = abierto === d.id;
            const sinDecidir = !d.tipo;
            return (
              <div key={d.id} data-flip-id={d.id}>
                <Card>
                  <button
                    onClick={() => setAbierto(estaAbierto ? null : d.id)}
                    aria-expanded={estaAbierto}
                    aria-label={`Día ${i + 1}: ${textoDeDia(fitness, d)}`}
                    className="w-full flex items-center gap-3 text-left toque-44"
                  >
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 tabular-nums"
                      style={{ background: hexToRgba(sinDecidir ? COLORS.warning : accent, 0.14), color: sinDecidir ? COLORS.text : acentoLegible(accent) }}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate" style={{ color: sinDecidir ? COLORS.textMuted : COLORS.text }}>
                        {textoDeDia(fitness, d)}
                      </span>
                      <span className="block text-[11px]" style={{ color: COLORS.textMuted }}>
                        {sinDecidir ? 'Toca para decidir' : d.tipo === 'descanso' ? 'Descanso' : 'Entrenamiento'}
                      </span>
                    </span>
                    <ChevronDespliegue abierto={estaAbierto} />
                  </button>
                  <Plegable abierto={estaAbierto}>{() => (
                    <EleccionDeDia
                      dia={d}
                      plantillas={plantillas}
                      usadasEnRutina={usadas}
                      accent={accent}
                      onElegir={(eleccion) => { setRutina(configurarDia(rutina, d.id, eleccion)); setAbierto(null); }}
                      onCrearPlantilla={onCrearPlantilla ? () => onCrearPlantilla(rutina, d.id) : null}
                    />
                  )}</Plegable>
                </Card>
              </div>
            );
          })}
        </ListaAnimada>
        <p className="text-[11px] mt-2 px-1" style={{ color: COLORS.textMuted }}>{EXPLICACIONES_RUTINA.plantilla}</p>
      </div>

      {problemas.length > 0 && (
        <Card style={{ border: `1px solid ${COLORS.warning}` }}>
          <div role="alert" className="space-y-1">
            {problemas.map((p) => (
              <p key={p.id} className="text-xs" style={{ color: COLORS.text }}>{p.que}</p>
            ))}
          </div>
        </Card>
      )}

      <PrimaryButton accent={accent} icon={Check} onClick={guardar}>Guardar rutina</PrimaryButton>
    </div>
  );
}
