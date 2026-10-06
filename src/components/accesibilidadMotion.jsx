import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F12 — LA PANTALLA DICE DÓNDE ESTÁS (apartados 9 y 26)

   Con el movimiento completo, la pantalla que entra desde la derecha ya dice
   «has llegado a otro sitio». Sin verla —VoiceOver— o con «Sin movimiento»,
   eso no lo dice nada: cambiar de pestaña dejaba el foco en la barra de abajo
   y la pantalla nueva en silencio. Un aviso educado (`aria-live="polite"`),
   invisible, dice el nombre de la pantalla al llegar. La primera vez no: al
   abrir la aplicación ya se lee la pantalla entera.
   ═══════════════════════════════════════════════════════════════════════════ */
export function AnuncioDeNavegacion({ nombre, clave }) {
  const [texto, setTexto] = useState('');
  /* 🐛 MS F14 — se compara con la ÚLTIMA pantalla anunciada, no con «¿es la primera vez?». En
     desarrollo, `StrictMode` monta, deshace y vuelve a montar cada efecto: la marca de «primera vez»
     ya estaba gastada en la segunda pasada, y al abrir la aplicación se anunciaba «Inicio» (60 ms
     después, así que la prueba lo veía o no según lo deprisa que leyera). Con la clave, abrir no
     habla nunca, y cambiar de pantalla, siempre. */
  const anunciada = useRef(clave);
  useEffect(() => {
    if (anunciada.current === clave) return undefined;
    anunciada.current = clave;
    /* Se vacía y se vuelve a escribir: con el mismo nombre dos veces seguidas, un lector de
       pantalla no anunciaría el segundo cambio. */
    setTexto('');
    const t = setTimeout(() => setTexto(nombre || ''), 60);
    return () => clearTimeout(t);
  }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  return <p className="sr-only" aria-live="polite" aria-atomic="true" data-anuncio-navegacion="">{texto}</p>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F12 — UN GIRO DE CARGA QUE SIGNIFICA ALGO SIN GIRAR (apartados 2, 13 y 26)

   El giro dice «algo está pasando» con el movimiento. Quieto (Reducido) o sin verlo (VoiceOver) no
   decía nada: varios iban solos, sin texto. `GiroDeCarga` lleva su texto para el lector de pantalla
   (`role="status"`), y el icono queda fuera de VoiceOver. Donde ya hay un texto visible al lado
   («Pensando…», el botón que dice «Guardando…»), no hace falta.
   ═══════════════════════════════════════════════════════════════════════════ */
export function GiroDeCarga({ texto = 'Cargando…', size = 16, className = '', style, color }) {
  return (
    <span role="status" className={`inline-flex items-center justify-center ${className}`.trim()}>
      <Loader2 size={size} className="animate-spin" style={style} color={color} aria-hidden="true" />
      <span className="sr-only">{texto}</span>
    </span>
  );
}
