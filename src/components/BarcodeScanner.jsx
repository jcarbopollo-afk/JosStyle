import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BrowserMultiFormatReader } from '@zxing/library';
import { X } from 'lucide-react';
import { COLORS } from '../tokens';
import { GiroDeCarga } from './accesibilidadMotion';
import { estadoDePermiso } from '../lib/estadosAsincronos';

// Overlay de pantalla completa que abre la cámara trasera y decodifica códigos de barras
// en directo. Al detectar uno, llama a onDetected(codigo) una sola vez y se detiene sola.
export default function BarcodeScanner({ onDetected, onClose, accent }) {
  const videoRef = useRef(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let stopped = false;

    reader
      .decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current,
        (result) => {
          if (stopped) return;
          setReady(true);
          if (result) {
            stopped = true;
            reader.reset();
            onDetected(result.getText());
          }
          // Un error de "no encontrado en este fotograma" es normal mientras se busca — se ignora.
        }
      )
      .catch((e) => {
        /* MS F16, apartado 46 — comprobando («Abriendo la cámara…»), denegado y no disponible son
           tres cosas: «no has dado permiso» no se arregla igual que «aquí no hay cámara». */
        if (stopped) return;
        setError(estadoDePermiso(e).texto);
        console.error(e);
      });

    return () => {
      stopped = true;
      try { reader.reset(); } catch (e) { /* noop */ }
    };
  }, [onDetected]);

  // Optimización de navegación/scroll — sin `createPortal`, este escáner "fixed" quedaba anclado
  // al contenedor `.module-enter` de Nutrición (con `transform` permanente por su animación de
  // entrada, ver App.jsx/index.css) en vez del viewport real: en vez de cubrir toda la pantalla,
  // podía quedar cortado o desplazado según la altura del contenido de esa vista.
  return createPortal(
    <div className="fixed inset-0 z-capa flex flex-col visor-seguro" style={{ background: '#000' }}>
      {/* MS F15 (apartados 10-12) — la cabecera empieza debajo de la hora y de la isla, y el botón de cerrar
          llega a los 44 px: estaba a 16 px del borde de arriba, debajo de la batería del iPhone. */}
      <div className="flex items-center justify-between p-4" style={{ background: 'rgba(5,6,10,0.85)', paddingTop: 'calc(var(--safe-top) + 1rem)' }}>
        <p className="text-sm font-semibold text-white">Apunta al código de barras</p>
        <button onClick={onClose} className="p-1.5 rounded-full toque-44" style={{ background: COLORS.surface2 }} aria-label="Cerrar escáner">
          <X size={16} color="#fff" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <GiroDeCarga size={28} color={accent} texto="Abriendo la cámara…" />
          </div>
        )}
        {!error && (
          <div
            className="absolute rounded-2xl"
            style={{ width: '78%', height: 110, border: `2px solid ${accent}`, boxShadow: '0 0 0 2000px rgba(0,0,0,0.45)' }}
          />
        )}
        {error && (
          <div className="px-8 text-center">
            <p className="text-sm text-white">{error}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
