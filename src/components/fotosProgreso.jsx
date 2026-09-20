/* ===========================================================================
   ENTREGA 4 · FASE 26/45 — LAS PIEZAS DEL DIARIO VISUAL

   🚨 **NI UNA FOTO SE GUARDA AQUÍ.** Estos componentes piden su URL firmada a
   `getSignedPhotoUrl()` —que caduca en una hora, por eso **nunca se guarda**
   (E3 F17 y NAV F3)— y escriben por la puerta de siempre: `onAddFoto` y
   `onDeleteFoto` de `App.jsx`, las mismas que usa el bloque de Salud.

   ⚠️ **Y NO SE CARGAN TODAS DE GOLPE** (apartados 26 y 37): se firman por
   tandas de `FOTOS_POR_TANDA`, según se van necesitando.
   =========================================================================== */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, X, ChevronLeft, ChevronRight, GitCompareArrows, Dumbbell } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { Card, Field, TextInput, PrimaryButton, GhostBtn, BotonBorrarDefinitivo, SectionTitle } from './ui';
import { getSignedPhotoUrl } from '../lib/supabase';
import {
  TAGS_FOTO, tagFoto, VACIO_FOTOS, ERRORES_FOTO, FOTOS_POR_TANDA, LADO_MAXIMO, CALIDAD_JPEG,
  dimensionesOptimizadas, etiquetaDeDia, sesionDeFoto, vecinasDeFoto, compararFotos,
} from '../lib/fotosProgreso';

/* ═══ Las URLs firmadas, por tandas ════════════════════════════════════════
   🚨 Apartado 26 — *"No cargar todas las imágenes de máxima resolución
   inmediatamente"*. Y apartado 29: **una foto que ya no está no rompe la
   galería**; se queda con su estado de error y las demás siguen. */
export function useUrlsFirmadas(fotos, { porTanda = FOTOS_POR_TANDA } = {}) {
  const [urls, setUrls] = useState({});
  const [fallidas, setFallidas] = useState({});
  const [cuantas, setCuantas] = useState(porTanda);
  const ids = useMemo(() => fotos.map((f) => f.id).join(','), [fotos]);

  useEffect(() => { setCuantas(porTanda); }, [ids, porTanda]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const pendientes = fotos.slice(0, cuantas).filter((f) => !urls[f.id] && !fallidas[f.id]);
      if (!pendientes.length) return;
      const pares = await Promise.all(pendientes.map(async (f) => {
        try { return [f.id, await getSignedPhotoUrl(f.path)]; } catch { return [f.id, null]; }
      }));
      if (cancelado) return;
      const ok = {};
      const mal = {};
      pares.forEach(([id, url]) => { if (url) ok[id] = url; else mal[id] = true; });
      if (Object.keys(ok).length) setUrls((v) => ({ ...v, ...ok }));
      if (Object.keys(mal).length) setFallidas((v) => ({ ...v, ...mal }));
    })();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, cuantas]);

  return { urls, fallidas, cuantas, verMas: () => setCuantas((n) => n + porTanda), hayMas: cuantas < fotos.length };
}

/* ═══ Apartado 8 · Reducir sin destruir ════════════════════════════════════
   ⚠️ **Y sin rotar** (apartado 7): `imageOrientation: 'from-image'` conserva la
   orientación que el navegador ya aplica. Si algo falla —un navegador sin
   `createImageBitmap`, un formato raro— **se sube el original tal cual**: peor
   una foto sin comprimir que una foto girada o perdida. */
export async function optimizarImagen(file, { lado = LADO_MAXIMO, calidad = CALIDAD_JPEG } = {}) {
  try {
    if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const d = dimensionesOptimizadas(bitmap.width, bitmap.height, { lado });
    if (!d.reducida) { bitmap.close?.(); return file; }
    const lienzo = document.createElement('canvas');
    lienzo.width = d.ancho;
    lienzo.height = d.alto;
    const ctx = lienzo.getContext('2d');
    if (!ctx) { bitmap.close?.(); return file; }
    ctx.drawImage(bitmap, 0, 0, d.ancho, d.alto);
    bitmap.close?.();
    const blob = await new Promise((res) => lienzo.toBlob(res, 'image/jpeg', calidad));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/* ═══ Apartado 24 · El vacío ═══════════════════════════════════════════════ */
export function ProgressPhotoEmpty({ accent, onAnadir = null }) {
  return (
    <Card>
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: hexToRgba(accent, 0.14), color: accent }}>
          <Camera size={24} />
        </div>
        <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{VACIO_FOTOS.titulo}</p>
        <p className="text-xs mt-1 max-w-xs" style={{ color: COLORS.textMuted }}>{VACIO_FOTOS.que}</p>
        {onAnadir && (
          <div className="mt-4 w-full max-w-xs">
            <PrimaryButton onClick={onAnadir} accent={accent} icon={Camera}>{VACIO_FOTOS.cta}</PrimaryButton>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ═══ Apartados 4, 5 y 6 · El formulario ═══════════════════════════════════
   🚨 Apartado 5 — *"No guardar automáticamente si el usuario todavía está en la
   previsualización"*: se elige, se ve, y **entonces** se guarda.
   🚨 Apartado 6 — varias fotos en una acción, y **cada una un registro**. */
export function ProgressPhotoForm({ accent, hoy, onGuardar, onCancelar, guardando = false, error = null }) {
  const [elegidas, setElegidas] = useState([]);
  const [fecha, setFecha] = useState(hoy);
  const [nota, setNota] = useState('');
  const [tags, setTags] = useState([]);
  const entrada = useRef(null);

  useEffect(() => () => elegidas.forEach((e) => URL.revokeObjectURL(e.vista)), [elegidas]);

  const elegir = (ev) => {
    const files = [...(ev.target.files || [])];
    ev.target.value = '';
    if (!files.length) return;
    setElegidas((v) => [...v, ...files.map((file) => ({ id: `${file.name}-${file.size}-${Math.random()}`, file, vista: URL.createObjectURL(file) }))]);
  };
  const quitar = (id) => setElegidas((v) => {
    const fuera = v.find((e) => e.id === id);
    if (fuera) URL.revokeObjectURL(fuera.vista);
    return v.filter((e) => e.id !== id);
  });
  const alternarTag = (id) => setTags((v) => (v.includes(id) ? v.filter((t) => t !== id) : [...v, id]));

  return (
    <Card>
      <p className="text-sm font-bold mb-3" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>Añadir progreso</p>

      {/* Apartado 4 — «tomar fotografía si el dispositivo lo permite», y sin dar
          por hecho que hay cámara: es el mismo `<input>` de siempre. */}
      <label className="block">
        <div
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold w-full cursor-pointer toque-44"
          style={{ background: elegidas.length ? COLORS.surface2 : accent, color: elegidas.length ? COLORS.text : COLORS.textOnAccent, border: elegidas.length ? `1px solid ${COLORS.border}` : 'none' }}
        >
          <Camera size={16} strokeWidth={2.5} />
          {elegidas.length ? 'Añadir otra' : 'Elegir o hacer foto'}
        </div>
        <input ref={entrada} type="file" accept="image/*" multiple onChange={elegir} disabled={guardando} className="hidden" />
      </label>

      {/* Apartado 5 — la previsualización, antes de guardar nada. */}
      {elegidas.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {elegidas.map((e) => (
            <div key={e.id} className="relative rounded-xl overflow-hidden" style={{ background: COLORS.surface2 }}>
              {/* Apartado 15 — `object-contain`: nunca se estira una imagen. */}
              <img src={e.vista} alt="Foto elegida, sin guardar todavía" className="w-full aspect-square object-contain" />
              <button
                onClick={() => quitar(e.id)}
                aria-label="Quitar esta foto de la selección"
                className="absolute top-1 right-1 rounded-full p-1.5 toque-44"
                style={{ background: hexToRgba(COLORS.surface, 0.85), border: `1px solid ${COLORS.border}` }}
              >
                <X size={12} style={{ color: COLORS.text }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {elegidas.length > 0 && (
        <div className="mt-3 space-y-3">
          {/* Apartado 3 — la fecha se puede cambiar: pudo tomarla hace meses. */}
          <Field label="Fecha de la foto">
            <TextInput type="date" value={fecha} onChange={(ev) => setFecha(ev.target.value)} />
          </Field>
          {/* Apartado 18 — la nota es opcional, y no un diario obligatorio. */}
          <Field label="Nota (opcional)">
            <TextInput value={nota} onChange={(ev) => setNota(ev.target.value)} placeholder="Ej: inicio de curso" />
          </Field>
          {/* Apartado 19 — etiquetas opcionales, nunca obligatorias. */}
          <div>
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: COLORS.textMuted }}>Etiquetas (opcional)</p>
            <div className="flex flex-wrap gap-1.5">
              {TAGS_FOTO.map((t) => {
                const puesta = tags.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => alternarTag(t.id)}
                    aria-pressed={puesta}
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold toque-44"
                    style={{
                      background: puesta ? hexToRgba(accent, 0.16) : COLORS.surface2,
                      color: puesta ? accent : COLORS.textMuted,
                      border: `1px solid ${puesta ? accent : COLORS.border}`,
                    }}
                  >
                    {t.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Apartado 28 — si no se pudo guardar, se dice, y NO se da por hecha. */}
          {error && (
            <div className="rounded-xl p-3" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <p className="text-xs font-semibold" style={{ color: COLORS.text }}>{ERRORES_FOTO.guardar.titulo}</p>
              <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>{ERRORES_FOTO.guardar.que}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <PrimaryButton
              onClick={() => onGuardar({ files: elegidas.map((e) => e.file), fecha, nota, tags })}
              accent={accent}
              disabled={guardando}
              icon={Camera}
            >
              {guardando ? 'Guardando…' : `Guardar ${elegidas.length === 1 ? 'la foto' : `las ${elegidas.length} fotos`}`}
            </PrimaryButton>
            <GhostBtn onClick={onCancelar} disabled={guardando}>Cancelar</GhostBtn>
          </div>
        </div>
      )}

      {elegidas.length === 0 && onCancelar && (
        <div className="mt-2"><GhostBtn onClick={onCancelar}>Cancelar</GhostBtn></div>
      )}
    </Card>
  );
}

/* ═══ Apartado 9 · Una foto de la galería ══════════════════════════════════ */
export function ProgressPhotoCard({ foto, url, fallida, accent, onAbrir }) {
  const nombre = `Foto de progreso del ${etiquetaDeDia(foto.fecha)}${foto.nota ? `. ${foto.nota}` : ''}`;
  return (
    <button
      onClick={() => onAbrir(foto.id)}
      aria-label={`${nombre}. Abrir`}
      className="rounded-2xl overflow-hidden relative active:scale-[0.98] transition-transform"
      style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
    >
      {fallida ? (
        /* Apartado 29 — la que no está lo dice, y las demás siguen. */
        <div className="w-full aspect-square flex items-center justify-center p-3 text-center">
          <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{ERRORES_FOTO.leer.titulo}</p>
        </div>
      ) : url ? (
        <img src={url} alt={nombre} loading="lazy" className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square esqueleto" />
      )}
      {foto.tags.length > 0 && (
        <span
          className="absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-[9px] font-semibold"
          style={{ background: hexToRgba(COLORS.surface, 0.85), color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
        >
          {tagFoto(foto.tags[0]).nombre}
        </span>
      )}
    </button>
  );
}

/* ═══ Apartado 10 · La rejilla, agrupada por día ═══════════════════════════ */
export function ProgressPhotoGrid({ dias = [], urls = {}, fallidas = {}, accent, onAbrir }) {
  if (!dias.length) return null;
  return (
    <div className="space-y-5">
      {dias.map((d) => (
        <div key={d.fecha}>
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>{d.etiqueta}</p>
            <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{d.texto}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {d.fotos.map((f) => (
              <ProgressPhotoCard key={f.id} foto={f} url={urls[f.id]} fallida={!!fallidas[f.id]} accent={accent} onAbrir={onAbrir} />
            ))}
          </div>
          {d.nota && <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>{d.nota}</p>}
        </div>
      ))}
    </div>
  );
}

/* ═══ Apartados 11 y 12 · El visor ═════════════════════════════════════════
   🚨 `createPortal` (regla 3 del proyecto): un `fixed inset-0` dentro de un
   contenedor con transformaciones se ancla al contenedor, no al iPhone. */
export function ProgressPhotoViewer({ foto, url, fallida, vecinas, accent, fitness, onCerrar, onIr, onBorrar, onSesion = null }) {
  if (!foto || typeof document === 'undefined') return null;
  const sesion = sesionDeFoto(foto, fitness);
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto del ${etiquetaDeDia(foto.fecha)}`}
    >
      <div className="flex items-center justify-between gap-2 p-3" style={{ paddingTop: 'calc(var(--safe-top) + 0.75rem)' }}>
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: '#fff', fontFamily: "'Manrope', sans-serif" }}>{etiquetaDeDia(foto.fecha)}</p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{vecinas.posicion} de {vecinas.total}</p>
        </div>
        <button onClick={onCerrar} aria-label="Cerrar la foto" className="rounded-full p-2 toque-44" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <X size={18} style={{ color: '#fff' }} />
        </button>
      </div>

      {/* Apartado 12 — se puede desplazar si es grande, y el apartado 15 manda:
          `object-contain`, nunca estirada. */}
      <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center px-3">
        {fallida ? (
          <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.75)' }}>{ERRORES_FOTO.leer.titulo}</p>
        ) : url ? (
          <img src={url} alt={foto.nota || `Foto del ${etiquetaDeDia(foto.fecha)}`} className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="w-full h-48 esqueleto rounded-2xl" />
        )}
      </div>

      <div className="p-3 space-y-3" style={{ paddingBottom: 'calc(var(--safe-bottom) + 0.75rem)' }}>
        {foto.nota && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{foto.nota}</p>}
        {foto.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {foto.tags.map((t) => (
              <span key={t} className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}>
                {tagFoto(t).nombre}
              </span>
            ))}
          </div>
        )}
        {/* Apartados 20 y 33 — si la sesión sigue existiendo, se puede abrir; si
            la borró, el enlace queda sin asociación y se dice. */}
        {sesion.hay && (
          <div className="flex items-center gap-2">
            <Dumbbell size={13} style={{ color: 'rgba(255,255,255,0.65)' }} aria-hidden="true" />
            {sesion.existe && onSesion ? (
              <button onClick={() => onSesion(sesion.sesionId)} className="text-[11px] font-semibold underline toque-44" style={{ color: '#fff' }}>
                {sesion.texto}
              </button>
            ) : (
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {sesion.existe ? sesion.texto : 'El entrenamiento asociado ya no existe'}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => vecinas.anterior && onIr(vecinas.anterior.id)}
            disabled={!vecinas.anterior}
            aria-label="Foto anterior"
            className="rounded-full p-2.5 toque-44 disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <ChevronLeft size={18} style={{ color: '#fff' }} />
          </button>

          {/* Apartado 22 — la foto se borra de verdad de Storage y no vuelve, así
              que el aviso lo dice: no se puede deshacer. */}
          <BotonBorrarDefinitivo
            onConfirm={() => onBorrar(foto.id, foto.path)}
            label="Eliminar esta foto"
            titulo="¿Eliminar esta foto?"
            detalle="Esta acción no se puede deshacer. Las demás fotos de ese día se quedan."
            className="rounded-full px-4 py-2.5 text-xs font-semibold toque-44"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
          />

          <button
            onClick={() => vecinas.siguiente && onIr(vecinas.siguiente.id)}
            disabled={!vecinas.siguiente}
            aria-label="Foto siguiente"
            className="rounded-full p-2.5 toque-44 disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <ChevronRight size={18} style={{ color: '#fff' }} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ═══ Apartado 17 · Elegir qué se compara ══════════════════════════════════ */
export function ProgressPhotoDateSelector({ opciones = [], elegida, urls = {}, etiqueta, onElegir }) {
  return (
    <div>
      <p className="text-[11px] font-semibold mb-1.5" style={{ color: COLORS.textMuted }}>{etiqueta}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {opciones.map((o) => {
          const puesta = o.id === elegida;
          return (
            <button
              key={o.id}
              onClick={() => onElegir(o.id)}
              aria-pressed={puesta}
              aria-label={`${etiqueta}: ${o.etiqueta}`}
              className="shrink-0 rounded-xl overflow-hidden toque-44"
              style={{ border: `2px solid ${puesta ? COLORS.text : COLORS.border}`, width: 64 }}
            >
              {urls[o.id]
                ? <img src={urls[o.id]} alt="" className="w-16 h-16 object-cover" />
                : <div className="w-16 h-16 esqueleto" />}
              <span className="block text-[9px] py-1" style={{ color: COLORS.textMuted }}>{o.etiqueta}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ Apartados 13, 14 y 16 · La comparación ═══════════════════════════════ */
export function ProgressPhotoComparison({ comparacion, urls = {}, fallidas = {}, accent }) {
  if (!comparacion || !comparacion.hay) return null;
  const lado = (foto, rotulo) => (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted }}>{rotulo}</p>
      <div className="rounded-xl overflow-hidden" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
        {fallidas[foto.id] ? (
          <div className="w-full aspect-[3/4] flex items-center justify-center p-2">
            <p className="text-[10px] text-center" style={{ color: COLORS.textMuted }}>{ERRORES_FOTO.leer.titulo}</p>
          </div>
        ) : urls[foto.id] ? (
          /* 🚨 Apartado 15 — `object-contain`: si tienen proporciones distintas
             se adaptan, **nunca se estira una para que encaje**. */
          <img src={urls[foto.id]} alt={`${rotulo}: ${etiquetaDeDia(foto.fecha)}`} className="w-full aspect-[3/4] object-contain" />
        ) : (
          <div className="w-full aspect-[3/4] esqueleto" />
        )}
      </div>
      <p className="text-xs font-semibold mt-1.5" style={{ color: COLORS.text }}>{etiquetaDeDia(foto.fecha)}</p>
      {foto.nota && <p className="text-[10px]" style={{ color: COLORS.textMuted }}>{foto.nota}</p>}
    </div>
  );
  return (
    <Card>
      {/* Apartado 16 — lado a lado; en una pantalla estrecha caben igual porque
          cada lado es la mitad y la imagen se adapta sin deformarse. */}
      <div className="flex gap-3">
        {lado(comparacion.antes, 'Antes')}
        {lado(comparacion.despues, 'Después')}
      </div>
      {/* 🚨 Apartado 14 — lo ÚNICO que se afirma es el tiempo entre las dos. */}
      <p className="text-[11px] text-center mt-3" style={{ color: COLORS.textMuted }}>{comparacion.texto}</p>
    </Card>
  );
}

/* ═══ Apartado 25 · Cuando todavía no se puede comparar ════════════════════ */
export function ProgressPhotoCompareHint({ aviso }) {
  if (!aviso) return null;
  return (
    <Card>
      <div className="flex items-center gap-2">
        <GitCompareArrows size={16} style={{ color: COLORS.textMuted }} aria-hidden="true" />
        <p className="text-xs" style={{ color: COLORS.textMuted }}>{aviso}</p>
      </div>
    </Card>
  );
}

/* ═══ Apartados 1, 9, 31 y 42 · El diario visual entero ════════════════════
   ⚠️ **Esto NO sabe nada del PIN.** La protección `fotos_privadas` la pone
   quien lo pinta, envolviéndolo en el mismo `PinGate` que usa Salud: así hay
   **una sola** decisión de seguridad y no dos que puedan separarse (C-35). */
export function ProgressPhotos({
  pantalla, fitness = null, accent, hoy,
  onAddFoto = null, onDeleteFoto = null, onSesion = null,
}) {
  const [anadiendo, setAnadiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [abierta, setAbierta] = useState(null);
  const [comparando, setComparando] = useState(false);
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);

  const { urls, fallidas, verMas, hayMas } = useUrlsFirmadas(pantalla.orden);
  const foto = abierta ? pantalla.orden.find((f) => f.id === abierta) || null : null;
  const vecinas = foto ? vecinasDeFoto(pantalla.orden, foto.id) : { anterior: null, siguiente: null, posicion: 0, total: 0 };
  const comparacion = a && b ? compararFotos(pantalla.orden, a, b) : null;

  const guardar = async ({ files, fecha, nota, tags }) => {
    if (!onAddFoto) return;
    setGuardando(true);
    setError(null);
    try {
      /* 🚨 Apartado 6 — varias fotos, **cada una su registro**. Se suben de una
         en una a propósito: así, si falla la tercera, las dos primeras están
         guardadas de verdad y no se da nada por hecho (apartado 28). */
      for (const file of files) {
        const optimizada = await optimizarImagen(file);
        await onAddFoto(optimizada, { fecha, nota, tags });
      }
      setAnadiendo(false);
    } catch (e) {
      setError(e || true);
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (id, path) => {
    setAbierta(null);
    if (a === id) setA(null);
    if (b === id) setB(null);
    if (onDeleteFoto) await onDeleteFoto(id, path);
  };

  return (
    <div className="space-y-4">
      {/* Apartado 24 — el vacío, con su salida. */}
      {pantalla.estado.id === 'vacio' && !anadiendo && (
        <ProgressPhotoEmpty accent={accent} onAnadir={onAddFoto ? () => setAnadiendo(true) : null} />
      )}

      {anadiendo ? (
        <ProgressPhotoForm
          accent={accent}
          hoy={hoy}
          guardando={guardando}
          error={error}
          onGuardar={guardar}
          onCancelar={() => { setAnadiendo(false); setError(null); }}
        />
      ) : pantalla.estado.id !== 'vacio' && onAddFoto ? (
        <div className="flex flex-col gap-2">
          <PrimaryButton onClick={() => setAnadiendo(true)} accent={accent} icon={Camera}>+ Añadir progreso</PrimaryButton>
          {/* Apartado 25 — la sección de comparar existe siempre: o se usa, o
              dice qué falta. Nunca desaparece. */}
          {pantalla.comparacion.disponible ? (
            <GhostBtn icon={GitCompareArrows} onClick={() => setComparando((v) => !v)}>
              {comparando ? 'Cerrar la comparación' : 'Comparar progreso'}
            </GhostBtn>
          ) : null}
        </div>
      ) : null}

      {!anadiendo && pantalla.estado.id === 'una' && (
        <ProgressPhotoCompareHint aviso={pantalla.comparacion.aviso} />
      )}

      {comparando && pantalla.comparacion.disponible && (
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>Comparar progreso</p>
          <div className="space-y-3">
            <ProgressPhotoDateSelector opciones={pantalla.comparacion.opciones} elegida={a} urls={urls} etiqueta="Primera foto" onElegir={setA} />
            <ProgressPhotoDateSelector opciones={pantalla.comparacion.opciones} elegida={b} urls={urls} etiqueta="Segunda foto" onElegir={setB} />
          </div>
          {comparacion && !comparacion.hay && comparacion.motivo === 'misma' && (
            <p className="text-[11px] mt-3" style={{ color: COLORS.textMuted }}>Elige dos fotos distintas.</p>
          )}
        </Card>
      )}

      {comparando && comparacion && comparacion.hay && (
        <ProgressPhotoComparison comparacion={comparacion} urls={urls} fallidas={fallidas} accent={accent} />
      )}

      {pantalla.dias.length > 0 && (
        <ProgressPhotoGrid dias={pantalla.dias} urls={urls} fallidas={fallidas} accent={accent} onAbrir={setAbierta} />
      )}

      {/* Apartado 26 — con muchas fotos no se cargan todas de golpe. */}
      {hayMas && <GhostBtn onClick={verMas}>Ver más fotos</GhostBtn>}

      <ProgressPhotoViewer
        foto={foto}
        url={foto ? urls[foto.id] : null}
        fallida={foto ? !!fallidas[foto.id] : false}
        vecinas={vecinas}
        accent={accent}
        fitness={fitness}
        onCerrar={() => setAbierta(null)}
        onIr={setAbierta}
        onBorrar={borrar}
        onSesion={onSesion}
      />
    </div>
  );
}

export { SectionTitle };
