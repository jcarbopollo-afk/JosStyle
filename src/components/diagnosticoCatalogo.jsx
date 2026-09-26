import React, { useMemo, useState } from 'react';
import { Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card } from './ui';
import { diagnosticoCatalogo, REGLAS_CATALOGO } from '../lib/validacionCatalogo';

/* FIT F35 — «Fitness Catalog Diagnostics» (apartados 29, 30 y 31).
   ═══════════════════════════════════════════════════════════════════════════

   🚨 **Solo en desarrollo** (apartado 29: *"NO mostrar esta pantalla al
   usuario normal"*). Quien decide es `esDesarrollo()`, que lee
   `import.meta.env.DEV`: en el build de Vercel vale `false` y el bloque no se
   pinta nunca. Por eso es un plegable **dentro** de la biblioteca y no una
   pantalla con su pestaña —una ruta que Josué pudiera abrir sería justo lo
   que el apartado prohíbe—, y por eso no hay un solo botón de «arreglar»: el
   diagnóstico **informa**, no corrige (apartados 2, 5 y 16).

   ⚠️ `import.meta.env?.DEV` con la interrogación: en el banco de renderizado
   (Node) `import.meta.env` no existe, y sin ella la biblioteca entera dejaría
   de pintarse por una herramienta que ni siquiera se ve. */

export const esDesarrollo = () => {
  try {
    return import.meta.env?.DEV === true;
  } catch {
    return false;
  }
};

const nombreRegla = (id) => REGLAS_CATALOGO.find((r) => r.id === id)?.que || id;

function Fila({ nombre, valor, tono = null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs py-0.5">
      <span style={{ color: COLORS.textMuted }}>{nombre}</span>
      <span className="font-bold tabular-nums" style={{ color: tono || COLORS.text }}>{valor}</span>
    </div>
  );
}

function Bloque({ titulo, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider mt-3 mb-1" style={{ color: COLORS.textMuted }}>{titulo}</p>
      {children}
    </div>
  );
}

/** El panel, con el diagnóstico ya calculado. Se exporta para probarlo. */
export function CatalogDiagnostics({ diagnostico }) {
  const d = diagnostico;
  if (!d) return null;
  const reglasConProblemas = REGLAS_CATALOGO.filter((r) => (d.porRegla?.[r.id] || 0) > 0);
  return (
    <div role="region" aria-label="Diagnóstico del catálogo">
      <Fila nombre="Ejercicios totales" valor={d.total} />
      <Fila nombre="Errores" valor={d.errores.length} tono={d.errores.length ? COLORS.negative : COLORS.positive} />
      <Fila nombre="Avisos" valor={d.avisos.length} />

      {d.errores.length > 0 && (
        <Bloque titulo="Errores">
          <ul className="space-y-1">
            {d.errores.slice(0, 30).map((e, i) => (
              <li key={`${e.regla}-${e.id}-${i}`} className="text-xs" style={{ color: COLORS.negative }}>{e.mensaje}</li>
            ))}
          </ul>
        </Bloque>
      )}

      {reglasConProblemas.length > 0 && (
        <Bloque titulo="Por regla">
          {reglasConProblemas.map((r) => (
            <Fila
              key={r.id}
              nombre={`${r.gravedad === 'error' ? 'Error' : 'Aviso'} · ${nombreRegla(r.id)}`}
              valor={d.porRegla[r.id]}
              tono={r.gravedad === 'error' ? COLORS.negative : null}
            />
          ))}
        </Bloque>
      )}

      <Bloque titulo="Por entorno">
        {d.porEntorno.map((x) => <Fila key={x.id} nombre={x.nombre} valor={x.ejercicios} />)}
      </Bloque>
      <Bloque titulo="Por dificultad">
        {d.porDificultad.map((x) => <Fila key={x.id} nombre={x.nombre} valor={x.ejercicios} />)}
      </Bloque>
      <Bloque titulo="Por tipo">
        {d.porTipo.map((x) => <Fila key={x.id} nombre={x.nombre} valor={x.ejercicios} />)}
      </Bloque>
      <Bloque titulo="Por grupo muscular (principal)">
        {d.porGrupo.map((x) => <Fila key={x.grupoId} nombre={x.nombre} valor={x.ejercicios} />)}
      </Bloque>
      <Bloque titulo="Contenido">
        <Fila nombre="Categorías" valor={d.categorias.length} />
        <Fila nombre="Sin imagen" valor={d.sinImagen.length} />
        <Fila nombre="Sin tutorial" valor={d.sinTutorial.length} />
        <Fila nombre="Habilidades sin progresión" valor={d.sinProgresion.length} />
        <Fila nombre="Contenido incompleto" valor={d.contenidoIncompleto.length} />
      </Bloque>
    </div>
  );
}

/** El plegable de la biblioteca. Calcula al abrir, nunca al pintar la lista. */
export function CatalogDiagnosticsEntry({ accent }) {
  const [abierto, setAbierto] = useState(false);
  const diagnostico = useMemo(() => (abierto ? diagnosticoCatalogo() : null), [abierto]);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label="Diagnóstico del catálogo (solo en desarrollo)"
        className="w-full flex items-center gap-2 text-left toque-44"
      >
        <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(accent || COLORS.info, 0.12) }}>
          <Wrench size={16} style={{ color: accent || COLORS.info }} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold" style={{ color: COLORS.text }}>Diagnóstico del catálogo</span>
          <span className="block text-[11px]" style={{ color: COLORS.textMuted }}>Solo en desarrollo</span>
        </span>
        {abierto ? <ChevronUp size={16} style={{ color: COLORS.textMuted }} /> : <ChevronDown size={16} style={{ color: COLORS.textMuted }} />}
      </button>
      {abierto && <div className="mt-3"><CatalogDiagnostics diagnostico={diagnostico} /></div>}
    </Card>
  );
}

export const COMPONENTES_FIT35 = [
  { nombre: 'CatalogDiagnostics', que: 'El panel: totales, errores, avisos por regla, entornos, dificultad, tipo, grupo y contenido' },
  { nombre: 'CatalogDiagnosticsEntry', que: 'El plegable de la biblioteca, solo en desarrollo' },
];
