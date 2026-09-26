/* ══════════════════════════════════════════════════════════════════════════
   FIT F39 — los respaldos de Fitness (apartados 22, 26, 27 y 52)
   ══════════════════════════════════════════════════════════════════════════

   *"Crear fallbacks reutilizables: MissingImage, MissingData, ErrorState,
   EmptyState, LoadingState, Offline/PersistenceError, NotAvailable. No
   duplicar mensajes en cada pantalla."*

   ⚠️ **Cinco de los siete ya existían**, y no se escriben otra vez: están en
   `FALLBACKS_FITNESS` (`src/lib/robustezFitness.js`) con dónde viven —el
   error de un área es `AreaSegura` (F36), la carga es `Esqueleto` (E3 F14), el
   vacío es `EmptyHint` y los estados de cada pantalla, el fallo de guardado es
   `guardado_fallido` (F37)…—. Aquí solo nacen los dos que faltaban. */
import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { COLORS } from '../tokens';

/* ── MissingImage (apartado 22) ────────────────────────────────────────────
   *"Si falta una imagen: usar placeholder coherente. Nunca mostrar imagen rota
   del navegador."* Una `<img>` que, si no carga, se cambia por su respaldo —
   el que le dé quien la pinta (el icono del grupo muscular, un esqueleto…) o,
   sin él, un recuadro con un icono de imagen tachada—. ⚠️ Y el respaldo es
   **solo de esa imagen**: las demás de la pantalla siguen (F27). */
export function MissingImage({ src, alt = '', className = '', style, respaldo = null, onFallo = null, ...resto }) {
  const [fallo, setFallo] = useState(false);
  if (!src || fallo) {
    if (respaldo) return respaldo;
    return (
      <div
        className={`${className} flex items-center justify-center`}
        style={{ ...(style || {}), background: COLORS.surface2, color: COLORS.textMuted }}
        role={alt ? 'img' : undefined}
        aria-label={alt ? `${alt} (imagen no disponible)` : undefined}
        aria-hidden={alt ? undefined : 'true'}
      >
        <ImageOff size={18} aria-hidden="true" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => { setFallo(true); if (onFallo) onFallo(); }}
      {...resto}
    />
  );
}

/* ── MissingData (apartados 26 y 27) ───────────────────────────────────────
   *"Si falta duración: no mostrar 0 min como si fuese real. Mostrar «—»"* y
   *"no calcular volumen artificial"*. Un guion para la vista y el nombre de lo
   que falta para el lector de pantalla, que un «—» no lo dice. */
export const TEXTO_NO_DISPONIBLE = 'No disponible';

export function MissingData({ que = '', className = '' }) {
  return (
    <span className={className} aria-label={que ? `${que}: ${TEXTO_NO_DISPONIBLE.toLowerCase()}` : TEXTO_NO_DISPONIBLE}>
      —
    </span>
  );
}
