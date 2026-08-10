import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card } from '../components/ui';

// Fase N1 — Nueva navegación por áreas (sustituye la barra inferior de 4 accesos + "Más" plano
// por 5 pestañas fijas: Inicio, Salud, Vida, Gestión, Más). Al tocar cualquiera que no sea
// Inicio, primero se abre este "hub": una rejilla de tarjetas grandes, una por módulo de esa
// área, con resumen real (src/lib/resumenesHub.js) — nunca se entra directo al módulo.
//
// Orden/ocultos/iconos siguen viniendo de `personalizacion` (Fase 19), sin cambiar su modelo de
// datos: cada hub simplemente filtra y ordena su propia lista fija de módulos (`area.modulos`)
// con ese mismo `orden`/`ocultos` global, en vez de una lista plana única. "Ajustes" (dentro del
// área "Más") sigue fuera de la personalización, fijo siempre al final — mismo motivo que antes:
// que Josué nunca se quede sin forma de deshacer un cambio.
//
// Fase N3 — al soltar una tarjeta no se navega al instante: `expandingId` marca cuál se pulsó,
// dispara su animación de "expansión" (`.hub-card-expanding` en index.css: escala + brillo +
// sombra por encima de las demás) y hace retroceder ligeramente al resto (`.hub-card-receding`),
// y solo entonces, tras `EXPAND_MS`, se llama a `onOpenModulo` — así la navegación real ocurre
// cuando la expansión ya se ve, dando la sensación de "entrar" en la tarjeta en vez de un salto
// brusco a la pantalla siguiente (que además ya desliza sola, ver `.module-enter` de la Fase N1/N2).
const EXPAND_MS = 190;

export default function HubView({ area, modulos, personalizacion, resumenes, accent, onOpenModulo }) {
  const [expandingId, setExpandingId] = useState(null);
  const timeoutRef = useRef(null);

  // Si el hub se desmonta a medio pulsar (ej. Josué toca otra pestaña de la barra inferior
  // mientras la tarjeta todavía está expandiéndose), se cancela la navegación pendiente — si no,
  // el setTimeout dispararía igualmente y lo mandaría al módulo equivocado por encima de donde
  // haya navegado mientras tanto.
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const handleAbrir = (id) => {
    if (expandingId) return;
    setExpandingId(id);
    timeoutRef.current = setTimeout(() => onOpenModulo(id), EXPAND_MS);
  };

  const fijos = area.id === 'mas' ? ['ajustes'] : [];
  const personalizables = area.modulos.filter((id) => !fijos.includes(id));

  const ordenGlobal = personalizacion.orden || [];
  const ordenados = [...personalizables].sort((a, b) => {
    const ia = ordenGlobal.indexOf(a);
    const ib = ordenGlobal.indexOf(b);
    if (ia === -1 && ib === -1) return personalizables.indexOf(a) - personalizables.indexOf(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  const visibles = ordenados.filter((id) => !(personalizacion.ocultos || []).includes(id));
  const idsFinales = [...visibles, ...fijos];

  return (
    <div className="space-y-5 pb-4">
      {/* Fase N2 — key={area.id} fuerza que el fundido del encabezado se repita cada vez que se
          entra a un área distinta, no solo la primera vez (mismo motivo que key={tab} en App.jsx).
          Fase N4 — "Área" pasa a mayúsculas con tracking amplio (estilo "eyebrow" de apps premium),
          separada del título por más aire para reforzar la jerarquía tipográfica. */}
      <div key={area.id} className="hub-header">
        <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textMuted, letterSpacing: '0.08em' }}>Área</p>
        <h1 className="text-2xl font-extrabold mt-1 tracking-tight" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {area.label}
        </h1>
      </div>

      {idsFinales.map((id, i) => {
        const mod = modulos[id];
        if (!mod) return null;
        const Icon = mod.icon;
        const resumen = resumenes[id] || { linea1: '', linea2: '', estado: 'info' };
        const expandiendoEsta = expandingId === id;
        const otraExpandiendo = !!expandingId && !expandiendoEsta;
        return (
          <button
            key={id}
            onClick={() => handleAbrir(id)}
            disabled={!!expandingId}
            aria-label={`Abrir ${mod.label}`}
            className={`hub-card w-full text-left rounded-3xl p-5 flex items-center gap-4 ${expandiendoEsta ? 'hub-card-expanding' : ''} ${otraExpandiendo ? 'hub-card-receding' : ''}`}
            style={{
              // Fase N4 — "cristal": superficie translúcida + desenfoque + un ligerísimo brillo
              // diagonal (el gradiente blanco casi imperceptible), en vez del color sólido de
              // N1/N2. WebkitBackdropFilter necesario para que Safari/iOS (donde vive esta PWA)
              // aplique el desenfoque igual que el resto de navegadores.
              background: `linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0) 45%), ${hexToRgba(COLORS.surface, 0.68)}`,
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: `1px solid ${hexToRgba(COLORS.border, 0.8)}`,
              // La entrada en cascada (hubCardIn) usa este retraso por índice; la expansión al
              // pulsar (hubCardExpand) es una animación distinta que debe arrancar ya, sin
              // heredar el retraso — si no, `animation-delay` (que viene por estilo en línea,
              // máxima prioridad) retrasaría también la expansión hasta 480ms de más.
              animationDelay: expandiendoEsta ? '0ms' : `${i * 80}ms`,
            }}
          >
            <div
              className="hub-card-icon w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: hexToRgba(accent, 0.14), border: `1px solid ${hexToRgba(accent, 0.25)}` }}
            >
              <Icon size={26} style={{ color: accent }} />
            </div>
            <div className="min-w-0 flex-1">
              {/* Fase N4 — indicador de estado (punto): acento si el módulo tiene datos reales que
                  mostrar hoy, apagado si todavía no hay nada, sin punto en los módulos de solo
                  lectura/configuración (Estadísticas, Predicciones, Logros, Ajustes) — nunca se
                  inventa una urgencia que no existe, solo "hay algo nuevo" o "está vacío". */}
              <div className="flex items-center gap-1.5">
                {resumen.estado && resumen.estado !== 'info' && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: resumen.estado === 'activo' ? accent : COLORS.border }}
                  />
                )}
                <p className="text-base font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{mod.label}</p>
              </div>
              <p className="text-sm mt-1 truncate font-medium" style={{ color: COLORS.text, opacity: 0.75 }}>{resumen.linea1}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.textMuted }}>{resumen.linea2}</p>
            </div>
            <ChevronRight size={18} style={{ color: COLORS.textMuted, flexShrink: 0 }} />
          </button>
        );
      })}

      {idsFinales.length === 0 && (
        <Card>
          <p className="text-sm text-center" style={{ color: COLORS.textMuted }}>
            Has ocultado todos los módulos de esta área desde Ajustes → Pantalla principal. Vuelve ahí para mostrar alguno de nuevo.
          </p>
        </Card>
      )}
    </div>
  );
}
