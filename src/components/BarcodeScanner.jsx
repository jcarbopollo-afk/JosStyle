import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { X, Loader2 } from 'lucide-react';
import { COLORS } from '../tokens';

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
        setError('No se pudo acceder a la cámara. Revisa que le has dado permiso a esta web en Ajustes → Safari.');
        console.error(e);
      });

    return () => {
      stopped = true;
      try { reader.reset(); } catch (e) { /* noop */ }
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#000' }}>
      <div className="flex items-center justify-between p-4" style={{ background: 'rgba(5,6,10,0.85)' }}>
        <p className="text-sm font-semibold text-white">Apunta al código de barras</p>
        <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: COLORS.surface2 }} aria-label="Cerrar escáner">
          <X size={16} color="#fff" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin" size={28} color={accent} />
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
    </div>
  );
}
