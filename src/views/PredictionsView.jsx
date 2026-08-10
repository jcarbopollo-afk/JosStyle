import React from 'react';
import { TrendingUp, Target, Flame, Scale, Dumbbell, Wallet, GraduationCap } from 'lucide-react';
import { COLORS } from '../tokens';
import { formatFecha } from '../lib/helpers';
import {
  prediccionObjetivo, prediccionAbandonoHabito, prediccionPeso,
  prediccionFuerza, prediccionAhorro, prediccionNotas,
} from '../lib/predicciones';
import { Card, SectionTitle } from '../components/ui';

// Fase 1 del Sistema de Personalización Visual Extrema — antes era un objeto fijo calculado una
// sola vez al cargar el módulo (`{ bajo: COLORS.positive, ... }`), lo que copiaba el valor de
// `COLORS` en ese instante y se quedaba "congelado" si el tema cambiaba después (COLORS es un
// singleton mutable, no una referencia reactiva). Convertido en función para leer `COLORS` en
// cada render, igual que hace el resto de la app. De paso, `medio` deja de estar hardcodeado en
// '#C9A24B' y pasa a `COLORS.warning`, el mismo token nuevo que ya usan HealthView/TrainingView.
const colorRiesgo = (riesgo) => ({ bajo: COLORS.positive, medio: COLORS.warning, alto: COLORS.negative }[riesgo]);

function TarjetaPrediccion({ icon: Icon, titulo, suficientesDatos, resumenFalta, children }) {
  return (
    <Card>
      <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: COLORS.text }}>
        <Icon size={16} style={{ color: COLORS.textMuted }} /> {titulo}
      </p>
      {!suficientesDatos ? (
        <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
          Todavía no hay datos suficientes para una lectura fiable{resumenFalta ? ` — ${resumenFalta}` : ''}. Se irá completando según registres más.
        </p>
      ) : children}
    </Card>
  );
}

function ObjetivosTarjeta({ objetivos }) {
  const pendientes = (objetivos?.lista || []).filter((o) => !o.cumplido);
  const conPrediccion = pendientes
    .map((o) => ({ o, p: prediccionObjetivo(o) }))
    .filter((x) => x.p.suficientesDatos)
    .sort((a, b) => a.p.diasRestantes - b.p.diasRestantes)
    .slice(0, 5);

  return (
    <TarjetaPrediccion
      icon={Target}
      titulo="Tiempo estimado de tus objetivos"
      suficientesDatos={conPrediccion.length > 0}
      resumenFalta="añade objetivos con plazo en la pestaña Objetivos"
    >
      <div className="space-y-2 mt-2">
        {conPrediccion.map(({ o, p }) => (
          <div key={o.id} className="flex items-center justify-between text-sm">
            <p style={{ color: COLORS.text }} className="pr-2">{o.texto}</p>
            <p className="text-xs font-semibold text-right flex-shrink-0" style={{ color: p.superado ? COLORS.negative : COLORS.textMuted }}>
              {p.superado ? `Plazo superado hace ${Math.abs(p.diasRestantes)} días` : `${p.diasRestantes} días (hasta ${formatFecha(p.fechaLimiteISO)})`}
            </p>
          </div>
        ))}
      </div>
    </TarjetaPrediccion>
  );
}

function HabitosTarjeta({ productividad }) {
  const habitos = productividad?.habitos || [];
  const conPrediccion = habitos
    .map((h) => ({ h, p: prediccionAbandonoHabito(h) }))
    .filter((x) => x.p.suficientesDatos);

  return (
    <TarjetaPrediccion
      icon={Flame}
      titulo="Riesgo de abandono de tus hábitos"
      suficientesDatos={conPrediccion.length > 0}
      resumenFalta="hacen falta al menos 5 días de historial en algún hábito"
    >
      <div className="space-y-2 mt-2">
        {conPrediccion.map(({ h, p }) => (
          <div key={h.id} className="flex items-center justify-between text-sm">
            <p style={{ color: COLORS.text }}>{h.nombre}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: COLORS.textMuted }}>{p.tasa}% últimos {p.ventana}d</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: colorRiesgo(p.riesgo), background: `${colorRiesgo(p.riesgo)}22` }}
              >
                {p.riesgo}
              </span>
            </div>
          </div>
        ))}
      </div>
    </TarjetaPrediccion>
  );
}

function PesoTarjeta({ salud }) {
  const p = prediccionPeso(salud?.medidas);
  return (
    <TarjetaPrediccion
      icon={Scale}
      titulo="Tendencia de peso"
      suficientesDatos={p.suficientesDatos}
      resumenFalta="hacen falta al menos 3 medidas con peso, repartidas en 7+ días"
    >
      <div className="flex items-center justify-between text-sm mt-2">
        <div>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Peso actual</p>
          <p className="font-bold" style={{ color: COLORS.text }}>{p.pesoActual} kg</p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Tendencia</p>
          <p className="font-bold" style={{ color: COLORS.text }}>{p.tendenciaSemana > 0 ? '+' : ''}{p.tendenciaSemana} kg/semana</p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Estimado en 30 días</p>
          <p className="font-bold" style={{ color: COLORS.text }}>{p.pesoEstimado30d} kg</p>
        </div>
      </div>
    </TarjetaPrediccion>
  );
}

function FuerzaTarjeta({ calistenia }) {
  const p = prediccionFuerza(calistenia);
  return (
    <TarjetaPrediccion
      icon={Dumbbell}
      titulo="Constancia de entreno"
      suficientesDatos={p.suficientesDatos}
      resumenFalta="hacen falta al menos 4 sesiones registradas en alguna habilidad"
    >
      <p className="text-sm mt-2" style={{ color: COLORS.text }}>
        En <span className="font-semibold">{p.skill}</span>, la habilidad que más entrenas: <span className="font-semibold">{p.sesionesRecientes}</span> sesiones en los últimos 14 días
        frente a <span className="font-semibold">{p.sesionesAnteriores}</span> en los 14 anteriores — tu ritmo va <span className="font-semibold">{p.tendencia}</span>.
      </p>
      <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
        No hay una cifra de fuerza fiable que proyectar (tus PRs son texto libre, no números comparables) — esto refleja constancia, no rendimiento.
      </p>
    </TarjetaPrediccion>
  );
}

function AhorroTarjeta({ economia }) {
  const p = prediccionAhorro(economia);
  return (
    <TarjetaPrediccion
      icon={Wallet}
      titulo="Proyección de ahorro"
      suficientesDatos={p.suficientesDatos}
      resumenFalta="hacen falta movimientos registrados en al menos 2 meses distintos"
    >
      <div className="flex items-center justify-between text-sm mt-2">
        <div>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Neto medio/mes ({p.mesesConsiderados} meses)</p>
          <p className="font-bold" style={{ color: p.netoMedioMensual >= 0 ? COLORS.positive : COLORS.negative }}>{p.netoMedioMensual >= 0 ? '+' : ''}{p.netoMedioMensual} €</p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Hucha estimada en 3 meses</p>
          <p className="font-bold" style={{ color: COLORS.text }}>{p.proyeccion3Meses} €</p>
        </div>
      </div>
    </TarjetaPrediccion>
  );
}

function NotasTarjeta({ estudios }) {
  const p = prediccionNotas(estudios);
  return (
    <TarjetaPrediccion
      icon={GraduationCap}
      titulo="Tendencia de notas"
      suficientesDatos={p.suficientesDatos}
      resumenFalta="hacen falta al menos 3 exámenes con nota obtenida registrada"
    >
      <div className="flex items-center justify-between text-sm mt-2">
        <div>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Media de tus últimos 3 exámenes</p>
          <p className="font-bold" style={{ color: COLORS.text }}>{p.notaMediaReciente}</p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Tendencia</p>
          <p className="font-bold" style={{ color: COLORS.text }}>{p.tendencia}</p>
        </div>
      </div>
    </TarjetaPrediccion>
  );
}

export default function PredictionsView({ objetivos, productividad, salud, calistenia, economia, estudios, accent }) {
  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Proyecciones simples sobre tu propio historial — nunca una decisión tomada por ti">
        <span className="flex items-center gap-2"><TrendingUp size={18} style={{ color: accent }} /> Predicciones</span>
      </SectionTitle>

      <ObjetivosTarjeta objetivos={objetivos} />
      <HabitosTarjeta productividad={productividad} />
      <PesoTarjeta salud={salud} />
      <FuerzaTarjeta calistenia={calistenia} />
      <AhorroTarjeta economia={economia} />
      <NotasTarjeta estudios={estudios} />

      <p className="text-xs text-center px-4" style={{ color: COLORS.textMuted }}>
        Todo esto son medias y tendencias simples sobre lo que ya has registrado — no un pronóstico garantizado, y nunca sustituyen tu propio criterio.
      </p>
    </div>
  );
}
