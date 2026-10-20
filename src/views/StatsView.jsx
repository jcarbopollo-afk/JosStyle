import React from 'react';
import { BarChart3, Moon, Dumbbell, GraduationCap } from 'lucide-react';
import { COLORS } from '../tokens';
import { correlacionSuenoEstudio, correlacionSuenoAnimo, correlacionEntrenoAnimo } from '../lib/correlaciones';
import { Card, SectionTitle, EmptyHint } from '../components/ui';

function FilaComparacion({ etiquetaA, valorA, etiquetaB, valorB, unidad }) {
  return (
    <div className="flex items-center justify-between text-sm mt-2">
      <div>
        <p style={{ color: COLORS.textMuted }} className="text-xs">{etiquetaA}</p>
        <p className="font-bold" style={{ color: COLORS.text }}>{valorA} {unidad}</p>
      </div>
      <div className="text-right">
        <p style={{ color: COLORS.textMuted }} className="text-xs">{etiquetaB}</p>
        <p className="font-bold" style={{ color: COLORS.text }}>{valorB} {unidad}</p>
      </div>
    </div>
  );
}

function TarjetaCorrelacion({ icon: Icon, titulo, suficientesDatos, resumenFalta, children }) {
  return (
    <Card>
      <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: COLORS.text }}>
        <Icon size={16} style={{ color: COLORS.textMuted }} /> {titulo}
      </p>
      {!suficientesDatos ? (
        <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
          Todavía no hay datos suficientes para una lectura fiable — {resumenFalta}. Se irá completando según registres más días.
        </p>
      ) : children}
    </Card>
  );
}

export default function StatsView({ sueno, estudios, diario, calistenia, fitness, accent }) {
  /* 🐛 Fase 1B — `diario` puede llegar sin `entradas` (una cuenta nueva, o datos
     importados a medias): sin esta guarda la pantalla entera se caía. */
  const entradas = Array.isArray(diario?.entradas) ? diario.entradas : [];
  const cEstudio = correlacionSuenoEstudio(sueno, estudios?.horas || []);
  const cAnimo = correlacionSuenoAnimo(sueno, entradas);
  /* 🐛 Fase 1B (CX-09) — los entrenamientos de Fitness y, si los hay, los días de la calistenia
     de antes; solo sus fechas, y cada día una vez. */
  const cEntreno = correlacionEntrenoAnimo({ fitness, calistenia }, entradas);

  const hayAlgunaCorrelacion = cEstudio.suficientesDatos || cAnimo.suficientesDatos || cEntreno.suficientesDatos;

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Cruces entre módulos, siempre con el dato concreto en el que se apoyan">
        <span className="flex items-center gap-2"><BarChart3 size={18} style={{ color: accent }} /> Estadísticas</span>
      </SectionTitle>

      {!hayAlgunaCorrelacion && (
        <EmptyHint text="Todavía no hay suficiente historial cruzado entre módulos. Sigue registrando sueño, diario, estudios y entrenos — esta pantalla se irá llenando sola." />
      )}

      <TarjetaCorrelacion
        icon={Moon}
        titulo="Sueño y horas de estudio"
        suficientesDatos={cEstudio.suficientesDatos}
        resumenFalta={`llevas ${cEstudio.diasBuenSueno} día(s) con 7h+ de sueño y ${cEstudio.diasSuenoCorto} con menos, hacen falta al menos 2 de cada`}
      >
        <FilaComparacion
          etiquetaA={`Noches con 7h+ de sueño (${cEstudio.diasBuenSueno} días)`}
          valorA={cEstudio.mediaHorasConBuenSueno}
          etiquetaB={`Noches con menos de 7h (${cEstudio.diasSuenoCorto} días)`}
          valorB={cEstudio.mediaHorasConSuenoCorto}
          unidad="h de estudio de media"
        />
      </TarjetaCorrelacion>

      <TarjetaCorrelacion
        icon={Moon}
        titulo="Sueño y ánimo del Diario"
        suficientesDatos={cAnimo.suficientesDatos}
        resumenFalta={`llevas ${cAnimo.diasBuenSueno} día(s) con 7h+ de sueño y ${cAnimo.diasSuenoCorto} con menos (con entrada de Diario ese mismo día), hacen falta al menos 2 de cada`}
      >
        <FilaComparacion
          etiquetaA={`Noches con 7h+ de sueño (${cAnimo.diasBuenSueno} días)`}
          valorA={cAnimo.mediaAnimoConBuenSueno}
          etiquetaB={`Noches con menos de 7h (${cAnimo.diasSuenoCorto} días)`}
          valorB={cAnimo.mediaAnimoConSuenoCorto}
          unidad="/5 de ánimo medio"
        />
      </TarjetaCorrelacion>

      <TarjetaCorrelacion
        icon={Dumbbell}
        titulo="Entrenar y ánimo"
        suficientesDatos={cEntreno.suficientesDatos}
        resumenFalta={cEntreno.desde
          ? `en las semanas en las que registraste algún entrenamiento llevas ${cEntreno.diasConEntreno} día(s) con entrenamiento y ${cEntreno.diasSinEntreno} sin él (con entrada de Diario), hacen falta al menos 3 de cada`
          : 'todavía no hay ningún entrenamiento completado en Fitness'}
      >
        <FilaComparacion
          etiquetaA={`Días con entrenamiento (${cEntreno.diasConEntreno})`}
          valorA={cEntreno.mediaAnimoConEntreno}
          etiquetaB={`Días sin entrenamiento (${cEntreno.diasSinEntreno})`}
          valorB={cEntreno.mediaAnimoSinEntreno}
          unidad="/5 de ánimo medio"
        />
        <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
          {cEntreno.conCalisteniaAnterior
            ? 'Cuenta los entrenamientos completados en Fitness y los días de calistenia que registraste antes.'
            : 'Cuenta los entrenamientos completados en Fitness.'}
          {/* 🐛 Fase 1C (CX-09) — una semana sin ningún entrenamiento registrado no dice si
              descansó o no lo apuntó: sus días no se comparan, y se dice cuántos son. */}
          {' '}Solo compara las semanas en las que registraste algún entrenamiento: en una semana sin ninguno no se sabe si descansaste o no lo apuntaste.
          {cEntreno.diasFuera > 0 && ` ${cEntreno.diasFuera} ${cEntreno.diasFuera === 1 ? 'día de Diario se queda' : 'días de Diario se quedan'} fuera por eso.`}
        </p>
      </TarjetaCorrelacion>

      <p className="text-xs text-center px-4" style={{ color: COLORS.textMuted }}>
        Esto compara medias entre dos grupos de días — no dice que una cosa cause la otra, solo que aparecen juntas en tu historial hasta ahora.
      </p>
    </div>
  );
}
