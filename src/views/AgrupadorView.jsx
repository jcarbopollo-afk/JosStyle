/* ===========================================================================
   AGRUPADOR — el lanzador que comparten Mente y Organización

   Josué (DIST F1): *"utilizar una presentación tipo mini-app: icono, nombre
   debajo, distribución mediante una cuadrícula limpia, espaciado suficiente,
   diseño compacto, estética premium coherente con Jos Style"*, y
   *"Evitar listas verticales interminables de módulos."*

   🚨 **ESTA PANTALLA NO REESCRIBE NINGUNA DE LAS QUE AGRUPA.** Recibe cada
   panel ya construido por `App.jsx` y lo pinta tal cual, así que Fe, Relación,
   Bienestar digital, Tareas, Calendario y Horario **siguen siendo las mismas
   pantallas**. Es `NumbersView` (NAV F1) generalizado, y por el mismo motivo:
   el día que alguien las «integre» copiando su contenido habrá dos versiones de
   cada una y acabarán diciendo cosas distintas.

   ⚠️ **Una sola pantalla para las dos agrupadoras, no dos calcadas.** Escribir
   `MenteView` y `OrganizacionView` por separado habría dejado dos copias del
   mismo lanzador, y arreglar un fallo en una no lo arreglaría en la otra.

   ⚠️ **Los paneles se piden como FUNCIÓN, no como nodo ya creado.** Si `App.jsx`
   pasara los seis elementos hechos, se montarían los seis a la vez cada vez que
   se abre la agrupadora —Relación incluida, con su PIN— aunque no se vea
   ninguno. Así solo se construye el que se abre.
   =========================================================================== */
import React, { useState } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { COLORS } from '../tokens';
// ⚠️ `hexToRgba` vive en `helpers.js`, no en `tokens.js` (lo cazó el build en NAV F1).
import { hexToRgba } from '../lib/helpers';
import { Card, SectionTitle } from '../components/ui';
import { ICONOS_AGRUPADORES } from '../components/iconosAgrupadores';

/* ── Una plaquita del lanzador ─────────────────────────────────────────────
   Mismo dibujo que la de Números: cuadrícula de dos columnas, icono en su
   cuadradito con el acento al 14 %, nombre debajo y una línea de contexto.
   Coherencia visual, no un lenguaje nuevo. */
function TarjetaAgrupador({ app, linea, accent, onAbrir }) {
  const Icono = ICONOS_AGRUPADORES[app.id];
  return (
    <button
      onClick={onAbrir}
      className="hub-card text-left rounded-2xl p-3.5 toque-44 active:scale-[0.98]"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
      aria-label={`Abrir ${app.nombre}`}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
        style={{ background: hexToRgba(accent, 0.14) }}
      >
        {Icono && <Icono size={18} style={{ color: accent }} />}
      </div>
      <div className="flex items-center gap-1">
        <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {app.nombre}
        </p>
        {/* ⚠️ El candado se dibuja porque el dato lo dice (`protegida`), no por
            un `if` con el id escrito a mano: así una sub-app protegida futura lo
            hereda sola. Y va con su texto al lado, nunca solo el icono
            (EH F42: el color y el dibujo nunca van solos). */}
        {app.protegida && <Lock size={12} style={{ color: COLORS.textMuted }} aria-label="Protegido con PIN" />}
      </div>
      <p className="text-[11px] mt-0.5 leading-snug" style={{ color: COLORS.textMuted }}>
        {linea}
      </p>
    </button>
  );
}

/**
 * @param {object}   grupo          La línea de `AGRUPADORES` (id, nombre, desc, apps).
 * @param {function} panelDe        (appId) => ReactNode. Se llama SOLO para la abierta.
 * @param {function} protegerPanel  (appId, nodo) => ReactNode. Obligatoria si alguna
 *                                  sub-app declara `protegida`.
 * @param {object}   lineas         Opcional, appId → texto de la plaquita.
 */
export default function AgrupadorView({ grupo, panelDe, protegerPanel = null, lineas = {}, accent }) {
  const [abierta, setAbierta] = useState(null);

  if (!grupo) {
    return (
      <Card>
        <p className="text-sm" style={{ color: COLORS.textMuted }}>Ese apartado ya no existe.</p>
      </Card>
    );
  }

  if (abierta) {
    const app = grupo.apps.find((a) => a.id === abierta);
    /* 🚨 **UNA SUB-APP PROTEGIDA SIN PROTECTOR NO SE PINTA, Y SE DICE.**
       Hasta esta fase el PIN de Relación lo ponía `App.jsx` mirando la PESTAÑA
       (`tab === 'relacion'`); al meterla dentro de Mente la pestaña pasa a ser
       `mente`, así que **el PIN habría desaparecido sin que fallara nada** y su
       contenido se habría abierto solo. Eso es la regla 6 rota en silencio, que
       es la peor forma de romperla. Así que si el catálogo dice `protegida` y
       nadie ha pasado `protegerPanel`, aquí no se pinta el panel: se dice.
       Fingir que está protegido sería exactamente la regla 8 al revés. */
    const faltaProteccion = app?.protegida && typeof protegerPanel !== 'function';
    const crudo = app && !faltaProteccion ? panelDe(app.id) : null;
    const contenido = app?.protegida && !faltaProteccion ? protegerPanel(app.id, crudo) : crudo;

    return (
      <div className="space-y-4 pb-4">
        {/* El volver es el mismo de siempre: una píldora, no una flecha suelta.
            ⚠️ Y devuelve al lanzador de ESTA agrupadora, no al área: la
            jerarquía que pidió Josué es sección → módulo → submódulo, y la
            barra de «volver a Gestión» de `App.jsx` sigue encima. */}
        <button
          onClick={() => setAbierta(null)}
          className="back-bar inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
          style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
          aria-label={`Volver a ${grupo.nombre}`}
        >
          <ArrowLeft size={15} />
          {grupo.nombre}
        </button>

        {contenido}

        {faltaProteccion && (
          <Card>
            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
              {app.nombre} está protegido
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              No se puede abrir desde aquí porque falta la comprobación del PIN. Ábrelo desde su
              acceso de siempre.
            </p>
          </Card>
        )}

        {!app && (
          <Card>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>Ese apartado ya no existe.</p>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div>
        <SectionTitle>{grupo.nombre}</SectionTitle>
        <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{grupo.desc}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {grupo.apps.map((app) => (
          <TarjetaAgrupador
            key={app.id}
            app={app}
            linea={lineas[app.id] || app.desc}
            accent={accent}
            onAbrir={() => setAbierta(app.id)}
          />
        ))}
      </div>
    </div>
  );
}
