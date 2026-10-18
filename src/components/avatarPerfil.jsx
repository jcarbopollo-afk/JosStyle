/* ============================================================================
   👤 EL CÍRCULO DE LA FOTO DE PERFIL — uno solo para toda la aplicación

   Lo pintan la cabecera de Ajustes (PF F1), la tarjeta de Perfil y, desde el
   2026-10-18, la cabecera de Inicio. La foto es `perfil.foto` (v3.68.0, en la fila
   de `app_data` de siempre): ni una segunda fuente. Sin foto, sus iniciales; sin
   nombre, el icono de persona.
   =========================================================================== */
import React from 'react';
import { User } from 'lucide-react';
import { hexToRgba } from '../lib/helpers';
import { esFotoValida, inicialesDe } from '../lib/fotoPerfil';

export function CirculoAvatar({ perfil, accent, lado = 88, aria = 'Tu foto de perfil' }) {
  const foto = esFotoValida(perfil?.foto) ? perfil.foto : null;
  const iniciales = inicialesDe(perfil || {});
  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
      style={{
        width: lado, height: lado,
        background: foto ? 'transparent' : hexToRgba(accent, 0.14),
        border: `2px solid ${hexToRgba(accent, foto ? 0.35 : 0.25)}`,
      }}
    >
      {foto ? (
        <img src={foto} alt={aria} className="w-full h-full object-cover" />
      ) : iniciales ? (
        /* ⚠️ Sin foto se pintan SUS INICIALES, no una silueta gris: un hueco con
           tus iniciales parece tuyo; el monigote de desconocido parece un error.
           El tamaño de la letra va con el círculo, o a 56 px se sale. */
        <span
          className="font-extrabold"
          style={{ color: accent, fontFamily: "'Manrope', sans-serif", fontSize: Math.round(lado * 0.34) }}
        >
          {iniciales}
        </span>
      ) : (
        <User size={Math.round(lado * 0.39)} style={{ color: accent }} aria-hidden="true" />
      )}
    </div>
  );
}
