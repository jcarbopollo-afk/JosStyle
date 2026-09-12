/* ===========================================================================
   NÚMEROS — la pantalla

   Josué: *"Reorganiza lo que ya existe para que tenga sentido bajo Números"*.

   🚨 **ESTA PANTALLA NO REESCRIBE NINGUNA DE LAS TRES QUE AGRUPA.** `StatsView`,
   `PredictionsView` y `AchievementsView` se renderizan **tal cual**, con las
   mismas props que recibían desde `App.jsx`. Lo único que hay aquí es el
   lanzador y el volver — es literalmente la E3 F23 con Productividad: *la fase
   es la pantalla y la navegación, no el contenido*.

   ⚠️ Por eso hay una prueba que comprueba que las tres se siguen importando y
   usando: si una fase futura las «integrara» copiando su contenido aquí, habría
   dos versiones de la misma pantalla y acabarían diciendo cosas distintas.
   =========================================================================== */
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { COLORS } from '../tokens';
// ⚠️ `hexToRgba` vive en `helpers.js`, no en `tokens.js`. Lo cazó el build.
import { hexToRgba } from '../lib/helpers';
import { Card, SectionTitle } from '../components/ui';
import { APPS_NUMEROS, appNumeros, panelNumeros } from '../lib/numeros';
import { ICONOS_NUMEROS } from '../components/iconosNumeros';
import StatsView from './StatsView';
import PredictionsView from './PredictionsView';
import AchievementsView from './AchievementsView';

/* ── Una plaquita del lanzador ───────────────────────────────────────────── */
function TarjetaNumeros({ app, linea, hayDatos, accent, onAbrir }) {
  const Icono = ICONOS_NUMEROS[app.id];
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
      <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
        {app.nombre}
      </p>
      {/* ⚠️ Sin datos se dice qué falta, no un cero: un «0» aquí sería
          inventarse un mal resultado donde lo que pasa es que todavía no ha
          registrado nada (E3 F13). */}
      <p className="text-[11px] mt-0.5 leading-snug" style={{ color: hayDatos ? COLORS.textMuted : hexToRgba(COLORS.textMuted, 0.75) }}>
        {linea}
      </p>
    </button>
  );
}

export default function NumbersView(props) {
  const { accent } = props;
  const [abierta, setAbierta] = useState(null);

  const panel = panelNumeros(props);

  if (abierta) {
    const app = appNumeros(abierta);
    return (
      <div className="space-y-4 pb-4">
        {/* El volver es el mismo de siempre: una píldora, no una flecha suelta. */}
        <button
          onClick={() => setAbierta(null)}
          className="back-bar inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold toque-44 active:opacity-60"
          style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
          aria-label="Volver a Números"
        >
          <ArrowLeft size={15} />
          Números
        </button>

        {/* 🚨 Las tres vistas, TAL CUAL. Ni una línea de su contenido vive aquí. */}
        {abierta === 'estadisticas' && (
          <StatsView
            sueno={props.sueno} estudios={props.estudios} diario={props.diario}
            calistenia={props.calistenia} accent={accent}
          />
        )}
        {abierta === 'predicciones' && (
          <PredictionsView
            objetivos={props.objetivos} productividad={props.productividad} salud={props.salud}
            calistenia={props.calistenia} economia={props.economia} estudios={props.estudios}
            accent={accent}
          />
        )}
        {abierta === 'logros' && (
          <AchievementsView
            productividad={props.productividad} diario={props.diario} objetivos={props.objetivos}
            bienestar={props.bienestar} fe={props.fe} nutricion={props.nutricion} salud={props.salud}
            calistenia={props.calistenia} economia={props.economia} sueno={props.sueno}
            accent={accent}
          />
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
        <SectionTitle>Números</SectionTitle>
        <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
          Todo lo que se puede medir de lo que haces.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {APPS_NUMEROS.map((app) => {
          const linea = panel.find((p) => p.id === app.id);
          return (
            <TarjetaNumeros
              key={app.id}
              app={app}
              linea={linea?.linea || app.desc}
              hayDatos={linea?.hayDatos}
              accent={accent}
              onAbrir={() => setAbierta(app.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
