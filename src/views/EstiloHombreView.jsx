// ============================================================================
// EH · Fase 1/65 — LA PANTALLA
//
// *"Crear una pantalla principal limpia."* Y poco más: el apartado 14 es
// taxativo sobre lo que NO va aquí.
//
// ── LAS TRES DECISIONES QUE SE VEN ─────────────────────────────────────────
//
// **1. Las plaquitas dicen la verdad.** Ninguno de los trece módulos tiene
// contenido todavía —el enunciado lo prohíbe expresamente— así que la plaquita
// **no lleva a ninguna parte y lo dice**, en vez de abrir una pantalla vacía.
// Es la regla 8 del proyecto: nada de "próximamente" ni de controles
// decorativos, pero tampoco fingir que algo funciona.
//
// **2. La pantalla no decide su propio estado.** Los tres casos del apartado 13
// los calcula `estadoPantalla()`, que se prueba con Node. Tres `if` encadenados
// en una vista es donde aparece el cuarto caso que nadie contempló.
//
// **3. Las plaquitas son pequeñas** (apartado 5): *"no crear diseños
// excesivamente grandes, queremos que se puedan mostrar bastantes módulos sin
// que la pantalla resulte pesada"*. Trece caben en dos columnas sin scroll en
// un iPhone.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { Settings, Check, ArrowLeft } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, PrimaryButton, GhostBtn } from '../components/ui';
import {
  MODULOS_EH, modulosActivos, todosLosModulos, configurarPrimeraVez,
  alternarModulo, estadoPantalla, resumenEstiloHombre,
} from '../lib/estiloDeHombre';

/* ===========================================================================
   UNA PLAQUITA (apartado 5)
   ===========================================================================
   Icono, nombre y una descripción corta. Nada más: el apartado lo pide
   pequeño, y con trece módulos la diferencia entre "cabe" y "no cabe" son
   veinte píxeles de alto. */
function Plaquita({ modulo, accent }) {
  return (
    <div
      className="rounded-2xl p-2.5 flex items-center gap-2"
      style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, minWidth: 0 }}
    >
      <span className="text-base leading-none flex-shrink-0" aria-hidden="true">{modulo.icono}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: COLORS.text }}>{modulo.nombre}</p>
        <p className="text-[10px] truncate" style={{ color: COLORS.textMuted }}>{modulo.sub}</p>
      </div>
    </div>
  );
}

/* ===========================================================================
   GESTIONAR APARTADOS (apartados 4 y 6)
   ===========================================================================
   *"Debe quedar muy claro qué está activo."* Y el 6: *"este sistema será
   reutilizado por todo Estilo de hombre"* — por eso es un componente aparte y
   sirve tanto para la primera vez como para después. */
export function GestionarApartados({ estado, accent, primeraVez = false, onGuardar, onAlternar, onCerrar }) {
  const todos = useMemo(() => todosLosModulos(estado), [estado]);
  // En la primera configuración se elige y se confirma; después, cada
  // interruptor se aplica al momento.
  const [elegidos, setElegidos] = useState(() => todos.filter((m) => m.activo).map((m) => m.id));

  const activo = (id) => (primeraVez ? elegidos.includes(id) : todos.find((m) => m.id === id)?.activo);

  const tocar = (id) => {
    if (!primeraVez) { onAlternar?.(id); return; }
    setElegidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {!primeraVez && onCerrar && (
          <button onClick={onCerrar} className="p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={16} style={{ color: COLORS.textMuted }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
          {primeraVez ? '¿Qué quieres utilizar?' : 'Gestionar apartados'}
        </p>
      </div>
      <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>
        {primeraVez
          ? 'Elige los apartados que quieras tener. Puedes cambiarlo cuando quieras.'
          : 'Lo que apagues deja de aparecer, pero no se borra nada.'}
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        {todos.map((m) => {
          const on = activo(m.id);
          return (
            <button
              key={m.id}
              onClick={() => tocar(m.id)}
              className="rounded-2xl p-2.5 flex items-center gap-2 text-left"
              style={{
                background: on ? hexToRgba(accent, 0.12) : COLORS.surface2,
                border: `1px solid ${on ? accent : COLORS.border}`,
                minWidth: 0,
              }}
              aria-pressed={!!on}
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

      {primeraVez && (
        <div className="mt-3">
          <PrimaryButton accent={accent} onClick={() => onGuardar?.(elegidos)}>Continuar</PrimaryButton>
          <p className="text-[10px] text-center mt-1.5" style={{ color: COLORS.textMuted }}>
            {elegidos.length === 0
              ? 'Puedes continuar sin elegir nada y decidirlo después.'
              : `${elegidos.length} ${elegidos.length === 1 ? 'apartado elegido' : 'apartados elegidos'}.`}
          </p>
        </div>
      )}
    </Card>
  );
}

/* ===========================================================================
   LA PANTALLA (apartados 2 y 13)
   =========================================================================== */
export default function EstiloHombreView({ estiloHombre, accent, onCambiar }) {
  const [gestionando, setGestionando] = useState(false);
  const estado = estiloHombre;
  const pantalla = estadoPantalla(estado);
  const activos = useMemo(() => modulosActivos(estado), [estado]);
  const resumen = useMemo(() => resumenEstiloHombre(estado), [estado]);

  // Apartado 3 — la primera configuración.
  if (pantalla === 'sin_configurar') {
    return (
      <div className="space-y-3">
        <Card className="text-center">
          <p className="text-2xl leading-none mb-2" aria-hidden="true">🧔</p>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Estilo de hombre</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            Personaliza tu espacio y utiliza solamente lo que necesitas.
          </p>
        </Card>
        <GestionarApartados
          estado={estado} accent={accent} primeraVez
          onGuardar={(ids) => onCambiar(configurarPrimeraVez(estado, ids))}
        />
      </div>
    );
  }

  if (gestionando) {
    return (
      <GestionarApartados
        estado={estado} accent={accent}
        onAlternar={(id) => onCambiar(alternarModulo(estado, id))}
        onCerrar={() => setGestionando(false)}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Apartado 13 — configurado pero sin nada encendido. No es una pantalla
          rota: es una decisión suya, y se le ofrece cambiarla. */}
      {pantalla === 'sin_modulos' ? (
        <Card className="text-center">
          <p className="text-2xl leading-none mb-2" aria-hidden="true">🧔</p>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Personaliza tu espacio</p>
          <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>
            Todavía no has elegido ningún apartado.
          </p>
          <PrimaryButton accent={accent} icon={Settings} onClick={() => setGestionando(true)}>
            Configurar ahora
          </PrimaryButton>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {activos.map((m) => <Plaquita key={m.id} modulo={m} accent={accent} />)}
          </div>

          {/* ⚠️ Regla 8 y apartado 14. Ninguno de estos apartados tiene
              contenido todavía, y el enunciado prohíbe construirlo en esta fase.
              Así que la pantalla LO DICE, en vez de que Josué toque una plaquita
              y no pase nada. */}
          <p className="text-[11px] text-center" style={{ color: COLORS.textMuted }}>
            {resumen.conContenido === 0
              ? 'De momento esto es solo tu espacio elegido: el contenido de cada apartado llega en las siguientes fases.'
              : ''}
          </p>
        </>
      )}

      {/* Apartado 6 — la opción de gestionar SIEMPRE está. */}
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
