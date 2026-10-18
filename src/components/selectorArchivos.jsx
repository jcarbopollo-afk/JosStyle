/* ============================================================================
   📎 EL SELECTOR DE FOTOS Y ARCHIVOS — una pieza para toda la aplicación (P1)

   Lo que decide qué se ofrece es `src/lib/seleccionArchivos.js`; esto lo pinta.

   Uso (cada pantalla pone su botón, con su aspecto de siempre):

     <SelectorDeArchivos clase="imagen" maxBytes={10 * MB} onElegir={(files) => …}>
       {({ abrir, ocupado }) => <button onClick={abrir}>Añadir foto</button>}
     </SelectorDeArchivos>

   · Tocar el botón abre **directamente** el selector del sistema, sin un menú
     propio delante (2026-10-18): el del iPhone ya trae la fototeca, la cámara y
     Archivos; el de Android, la cámara, la galería y los archivos; el del
     ordenador, sus archivos. Y **sin `capture`**, que obligaría a la cámara.
   · Lo que no vale se dice debajo del botón, en palabras, y **no llega a
     `onElegir`**. Lo que llega a `onElegir` está elegido, **no guardado**: subirlo
     y decir si ha llegado sigue siendo de cada módulo.

   ⚠️ No importa nada de `ui.jsx` a propósito: `ui.jsx` lo usa (el adjunto de la
   IA), y al revés sería un ciclo.
   =========================================================================== */
import React, { useMemo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { COLORS } from '../tokens';
import { opcionesDeSeleccion, validarArchivos, CLASES_DE_ARCHIVO } from '../lib/seleccionArchivos';

function MensajeDeError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="campo-mensaje-entra text-xs mt-1.5 flex items-start gap-1.5" style={{ color: COLORS.negative }}>
      <AlertTriangle size={13} className="flex-shrink-0 mt-px" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/**
 * @param clase        'imagen' | 'video' | 'documento'
 * @param accept       lo que acepta esta función (por defecto, el de su clase)
 * @param multiple     varios a la vez
 * @param maxBytes     tope por archivo (null, sin tope)
 * @param maxArchivos  tope de archivos
 * @param disabled     mientras sube, no se abre
 * @param onElegir     (File[]) => void — solo lo que vale
 * @param children     ({ abrir, ocupado, idError }) => el botón de la pantalla (opcional)
 * @param controlRef   opcional: recibe `{ click, abrir }`, para las pantallas que ya abrían
 *                     su `<input>` con `ref.current.click()` desde varios botones
 */
export function SelectorDeArchivos({
  clase = 'imagen', accept = null, multiple = false, maxBytes = null, maxArchivos = null,
  disabled = false, onElegir, mostrarError = true, controlRef = null, children = null,
}) {
  const [opcion] = useMemo(() => opcionesDeSeleccion({ clase, accept }), [clase, accept]);
  const entrada = useRef(null);
  const [error, setError] = useState(null);
  const idError = useMemo(() => `selector-error-${Math.random().toString(36).slice(2, 8)}`, []);
  const aceptaValidar = accept || (CLASES_DE_ARCHIVO[clase] || {}).accept || '';

  /* ⚠️ Con `mostrarError={false}` el módulo dice él mismo lo que no vale (la foto
     de perfil, el fondo, el álbum): se le entrega todo, porque un archivo que se
     quedara aquí sin decir nada sería un toque que no hace nada. */
  const entregar = (lista) => {
    if (!mostrarError) { if (lista.length && onElegir) onElegir(multiple ? lista : lista.slice(0, 1)); return; }
    const { validos, errores } = validarArchivos(lista, { accept: aceptaValidar, maxBytes, maxArchivos: multiple ? maxArchivos : 1 });
    setError(errores.length ? errores.join(' ') : null);
    if (validos.length && onElegir) onElegir(validos);
  };

  /* ⚠️ El `<input>` lleva el atributo `hidden` además de la clase: así no cuenta como
     hermano para `space-y-*` (Tailwind) y el selector se puede poner en cualquier lista.
     🚨 Y se pulsa dentro del mismo toque: iOS solo abre el selector desde un gesto. */
  const abrir = () => {
    if (disabled) return;
    setError(null);
    if (entrada.current) entrada.current.click();
  };

  if (controlRef) controlRef.current = { click: abrir, abrir };

  return (
    <>
      {typeof children === 'function' ? children({ abrir, ocupado: disabled, idError: error ? idError : undefined }) : null}
      <input
        ref={entrada}
        type="file" accept={opcion.accept || undefined}
        multiple={multiple} disabled={disabled}
        hidden className="hidden" aria-hidden="true" tabIndex={-1} data-selector-opcion={opcion.id}
        onChange={(ev) => { const l = [...(ev.target.files || [])]; ev.target.value = ''; if (l.length) entregar(l); }}
      />
      {mostrarError && <MensajeDeError id={idError}>{error}</MensajeDeError>}
    </>
  );
}
