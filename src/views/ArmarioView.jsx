import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shirt, Plus, Search, X, SlidersHorizontal, Star, Camera, Pencil, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2, Copy, Check, Layers, CalendarDays, History, List } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba, todayISO, formatFecha } from '../lib/helpers';
import { getSignedPrendaUrl } from '../lib/supabase';
import {
  CATEGORIAS_ARMARIO, COLORES_ARMARIO, ESTADOS_PRENDA, TEMPORADAS_PRENDA,
  prendasVisibles, marcasDe, conteoPorCategoria, ordenesDisponibles,
  categoriaDe, colorDe, estadoDe,
  ZONAS_OUTFIT, OCASIONES_OUTFIT, ESTACIONES_OUTFIT, zonaDeCategoria,
  outfitsVisibles, ordenesOutfitsDisponibles, lugaresDe, prendasDeOutfit,
  composicionPorZonas, outfitsConPrenda, usoEnOutfits, composicionDeOutfit,
  noDisponiblesDeOutfit, crearOutfit,
  EVENTOS_USO, RANGOS_HISTORIAL, usosDeOutfit, usosDePrenda, resumenOutfit, resumenPrenda,
  textoUltimoUso, usosDelDia, usosPorDia, filtrarUsos, desdeDelRango,
  lugaresDeUsos, personasDeUsos, resumenDeUso, resumenHistorial,
} from '../lib/armario';
import { celdasMes, isoDeFecha } from '../lib/calendario';
import {
  Card, SectionTitle, Field, TextInput, Textarea, PrimaryButton, GhostBtn, EmptyHint, SelectInput, ToggleTab, BotonBorrar,
} from '../components/ui';

/* ---------- Miniatura ----------
   Apartado 6: "nunca dejar un enorme espacio vacío por no tener imagen". Sin foto se
   pinta la prenda con su color y la inicial de su categoría — reconocible de un vistazo
   y del mismo tamaño que una foto, así que la rejilla no se desalinea según quién tenga
   fotografía y quién no.

   La URL se firma al montar y dura una hora (mismo patrón que las fotos de Salud). */
function MiniaturaPrenda({ prenda, alto = 104 }) {
  const [url, setUrl] = useState(null);
  const [cargando, setCargando] = useState(!!prenda.fotoPath);

  useEffect(() => {
    let vivo = true;
    if (!prenda.fotoPath) { setUrl(null); setCargando(false); return; }
    setCargando(true);
    getSignedPrendaUrl(prenda.fotoPath).then((u) => {
      if (vivo) { setUrl(u); setCargando(false); }
    });
    return () => { vivo = false; };
  }, [prenda.fotoPath]);

  const color = colorDe(prenda.color);
  const cat = categoriaDe(prenda.categoria);

  if (prenda.fotoPath && (cargando || url)) {
    return (
      <div className="w-full flex items-center justify-center overflow-hidden" style={{ height: alto, background: COLORS.surface2 }}>
        {url
          ? <img src={url} alt={prenda.nombre} className="w-full h-full" style={{ objectFit: 'cover' }} />
          : <Loader2 size={16} className="animate-spin" style={{ color: COLORS.textMuted }} />}
      </div>
    );
  }

  return (
    <div
      className="w-full flex flex-col items-center justify-center gap-1"
      style={{ height: alto, background: `linear-gradient(160deg, ${hexToRgba(color.muestra, 0.42)}, ${COLORS.surface2} 78%)` }}
    >
      <Shirt size={22} style={{ color: COLORS.textMuted }} />
      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
        {cat.label}
      </span>
    </div>
  );
}

/* ---------- Tarjeta ----------
   Apartado 6: nombre, categoría y color como mínimo, y toda la tarjeta pulsable para
   ir al detalle. La estrella de favorita se pinta encima de la miniatura, no en una
   fila aparte: no puede ser un botón dentro de un botón (bug de BI Fase 1). */
function TarjetaPrenda({ prenda, accent, onAbrir }) {
  const color = colorDe(prenda.color);
  const estado = estadoDe(prenda.estado);
  return (
    <button
      onClick={() => onAbrir(prenda)}
      className="text-left rounded-2xl overflow-hidden transition-transform active:scale-[0.97]"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <div className="relative">
        <MiniaturaPrenda prenda={prenda} />
        {prenda.favorita && (
          <span className="absolute rounded-full p-1" style={{ top: 6, right: 6, background: hexToRgba(COLORS.bg, 0.65) }}>
            <Star size={11} style={{ color: accent, fill: accent }} />
          </span>
        )}
      </div>
      <div className="px-2.5 py-2">
        <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{prenda.nombre || 'Sin nombre'}</p>
        <p className="text-xs truncate flex items-center gap-1.5" style={{ color: COLORS.textMuted }}>
          <span className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: color.muestra, border: `1px solid ${COLORS.border}` }} />
          {color.label}{prenda.marca ? ` · ${prenda.marca}` : ''}
        </p>
        {prenda.estado !== 'disponible' && (
          <p className="text-[11px] mt-0.5 truncate" style={{ color: COLORS.textMuted }}>{estado.label}</p>
        )}
      </div>
    </button>
  );
}

/* ---------- Formulario ----------
   Apartado 16, el que más manda en esta pantalla: "no quiero que el usuario tenga que
   rellenar 15 campos cada vez que añade una camiseta". Por defecto solo cuatro cosas
   —nombre, categoría, color y foto opcional— y el resto detrás de "Más información".
   Sirve igual para crear y para editar; lo único que cambia es de dónde parte. */
const FORM_VACIO = {
  nombre: '', categoria: 'camisetas', color: 'negro', marca: '', talla: '',
  subcategoria: '', colorSecundario: '', temporada: 'todo_el_ano', material: '',
  notas: '', precio: '', fechaCompra: '', estado: 'disponible', favorita: false,
};

function FormularioPrenda({ inicial, accent, guardando, errorFoto, onGuardar, onCancelar, onFoto, fotoPendiente }) {
  const [form, setForm] = useState({ ...FORM_VACIO, ...(inicial || {}) });
  const [masInfo, setMasInfo] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const puedeGuardar = form.nombre.trim().length > 0 && !guardando;

  return (
    <Card>
      <Field label="Nombre">
        <TextInput
          value={form.nombre} autoFocus
          onChange={(e) => set('nombre', e.target.value)}
          placeholder="Ej: Vaquero gris"
          onKeyDown={(e) => { if (e.key === 'Enter' && puedeGuardar) onGuardar(form); }}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoría">
          <SelectInput value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
            {CATEGORIAS_ARMARIO.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </SelectInput>
        </Field>
        <Field label="Color">
          <SelectInput value={form.color} onChange={(e) => set('color', e.target.value)}>
            {COLORES_ARMARIO.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </SelectInput>
        </Field>
      </div>

      {/* Apartado 4: la foto es opcional y se dice en la propia etiqueta, para que no
          parezca un paso obligatorio que hay que saltarse. */}
      <label className="flex items-center gap-2 text-xs font-semibold mb-3 cursor-pointer" style={{ color: accent }}>
        <Camera size={14} />
        {fotoPendiente ? `Foto elegida: ${fotoPendiente}` : 'Añadir foto (opcional)'}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onFoto(e.target.files?.[0] || null)} />
      </label>
      {errorFoto && <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>{errorFoto}</p>}

      <button
        onClick={() => setMasInfo((m) => !m)}
        className="flex items-center gap-1.5 text-xs font-semibold mb-3"
        style={{ color: COLORS.textMuted }}
        aria-expanded={masInfo}
      >
        {masInfo ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Más información
      </button>

      {masInfo && (
        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '0.75rem' }}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marca"><TextInput value={form.marca} onChange={(e) => set('marca', e.target.value)} placeholder="Nike, Zara…" /></Field>
            <Field label="Talla"><TextInput value={form.talla} onChange={(e) => set('talla', e.target.value)} placeholder="M, 42…" /></Field>
            <Field label="Temporada">
              <SelectInput value={form.temporada} onChange={(e) => set('temporada', e.target.value)}>
                {TEMPORADAS_PRENDA.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </SelectInput>
            </Field>
            <Field label="Estado">
              <SelectInput value={form.estado} onChange={(e) => set('estado', e.target.value)}>
                {ESTADOS_PRENDA.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </SelectInput>
            </Field>
            <Field label="Color secundario">
              <SelectInput value={form.colorSecundario} onChange={(e) => set('colorSecundario', e.target.value)}>
                <option value="">Ninguno</option>
                {COLORES_ARMARIO.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </SelectInput>
            </Field>
            <Field label="Material"><TextInput value={form.material} onChange={(e) => set('material', e.target.value)} placeholder="Algodón…" /></Field>
            <Field label="Precio (€)"><TextInput type="number" inputMode="decimal" value={form.precio} onChange={(e) => set('precio', e.target.value)} /></Field>
            <Field label="Fecha de compra"><TextInput type="date" value={form.fechaCompra} onChange={(e) => set('fechaCompra', e.target.value)} /></Field>
          </div>
          <Field label="Subcategoría"><TextInput value={form.subcategoria} onChange={(e) => set('subcategoria', e.target.value)} placeholder="Ej: manga larga" /></Field>
          <Field label="Notas"><Textarea value={form.notas} onChange={(e) => set('notas', e.target.value)} rows={2} /></Field>
          <button
            onClick={() => set('favorita', !form.favorita)}
            className="flex items-center gap-1.5 text-xs font-semibold mb-3"
            style={{ color: form.favorita ? accent : COLORS.textMuted }}
            aria-pressed={form.favorita}
          >
            <Star size={13} style={form.favorita ? { color: accent, fill: accent } : undefined} />
            {form.favorita ? 'Es una de tus favoritas' : 'Marcar como favorita'}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <PrimaryButton accent={accent} onClick={() => onGuardar(form)} disabled={!puedeGuardar}>
          {guardando ? 'Guardando…' : 'Guardar prenda'}
        </PrimaryButton>
        <div style={{ width: 100, flexShrink: 0 }}>
          <GhostBtn onClick={onCancelar}>Cancelar</GhostBtn>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Detalle ----------
   Apartado 7: todo lo que tenga la prenda, editar y eliminar.

   La eliminación SÍ pide confirmación aquí, a diferencia del resto de la app (donde
   ME Fase 3 la quitó porque la papelera lo hace reversible). El motivo es concreto y
   no una excepción caprichosa: la papelera guarda el objeto de la prenda, pero **la
   fotografía vive en Supabase Storage y no vuelve** — igual que las fotos de Salud y
   los vídeos de Calistenia, excluidos de la papelera desde ME Fase 3. Borrar una
   prenda con foto es, en parte, irreversible, y eso es exactamente lo que la regla
   del proyecto reserva para la confirmación. */
function DetallePrenda({ prenda, outfits, usos, hoyISO, accent, onCerrar, onEditar, onEliminar }) {
  const [confirmando, setConfirmando] = useState(false);
  const [verHistorial, setVerHistorial] = useState(false);
  // Apartado 10 de la continuación: no se impide borrar, pero sí se avisa.
  const enOutfits = usoEnOutfits(outfits, prenda.id);
  // Apartado 16: la prenda tiene historial aunque Josué nunca la registre directamente.
  // Se deduce de los outfits que la llevan.
  const mios = usosDePrenda(usos, outfits, prenda.id);
  const resumen = resumenDeUso(mios);
  const color = colorDe(prenda.color);
  const filas = [
    ['Categoría', categoriaDe(prenda.categoria).label],
    ['Subcategoría', prenda.subcategoria],
    ['Color', color.label],
    ['Color secundario', prenda.colorSecundario ? colorDe(prenda.colorSecundario).label : ''],
    ['Marca', prenda.marca],
    ['Talla', prenda.talla],
    ['Temporada', (TEMPORADAS_PRENDA.find((t) => t.id === prenda.temporada) || {}).label],
    ['Material', prenda.material],
    ['Estado', estadoDe(prenda.estado).label],
    ['Precio', prenda.precio != null ? `${prenda.precio} €` : ''],
    ['Comprada el', prenda.fechaCompra],
  ].filter(([, v]) => v);

  // Regla 3 del proyecto: todo overlay `fixed inset-0` va con createPortal.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 pb-3 sm:pb-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCerrar}>
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, maxHeight: '86vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ maxHeight: '86vh', overflowY: 'auto' }}>
          <div className="relative">
            <MiniaturaPrenda prenda={prenda} alto={190} />
            <button
              onClick={onCerrar}
              className="absolute rounded-full p-1.5"
              style={{ top: 10, right: 10, background: hexToRgba(COLORS.bg, 0.7) }}
              aria-label="Cerrar detalle de la prenda"
            >
              <X size={14} style={{ color: COLORS.text }} />
            </button>
          </div>

          <div className="p-4">
            <p className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
              {prenda.nombre || 'Sin nombre'}
              {prenda.favorita && <Star size={15} style={{ color: accent, fill: accent }} />}
            </p>

            <div className="mt-3 space-y-1.5">
              {filas.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3">
                  <span className="text-xs flex-shrink-0" style={{ color: COLORS.textMuted }}>{k}</span>
                  <span className="text-sm text-right min-w-0 truncate" style={{ color: COLORS.text }}>{v}</span>
                </div>
              ))}
            </div>

            {prenda.notas && (
              <p className="text-sm mt-3 leading-relaxed" style={{ color: COLORS.textMuted }}>{prenda.notas}</p>
            )}

            {/* Apartado 28: sin datos NO se dice "0 días" ni se inventa una fecha. */}
            <p className="text-xs mt-3" style={{ color: COLORS.textMuted }}>
              {resumen.total > 0
                ? `Usada ${resumen.total} ${resumen.total === 1 ? 'vez' : 'veces'} · último uso ${textoUltimoUso(resumen.ultimaFecha, hoyISO).toLowerCase()}`
                : 'Todavía no hay datos de uso.'}
            </p>

            {resumen.total > 0 && (
              <>
                <button
                  onClick={() => setVerHistorial((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold mt-2"
                  style={{ color: COLORS.textMuted }}
                  aria-expanded={verHistorial}
                >
                  {verHistorial ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  <History size={12} /> Historial de uso
                </button>
                {verHistorial && (
                  <div className="mt-2">
                    <HistorialDeUso
                      usosFiltrados={mios} outfits={outfits} prendas={[prenda]} accent={accent} hoyISO={hoyISO}
                      vacioTexto="Todavía no hay datos de uso."
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2 mt-4">
              <PrimaryButton accent={accent} onClick={() => onEditar(prenda)} icon={Pencil}>Editar</PrimaryButton>
            </div>

            {confirmando ? (
              <div className="mt-3 rounded-2xl p-3" style={{ background: COLORS.surface2 }}>
                <p className="text-xs mb-2" style={{ color: COLORS.text }}>
                  {prenda.fotoPath
                    ? 'Se eliminará la prenda y su fotografía. La foto no se puede recuperar.'
                    : '¿Eliminar esta prenda? Podrás recuperarla desde Eliminados recientemente.'}
                  {enOutfits > 0 && ` Está en ${enOutfits} ${enOutfits === 1 ? 'outfit' : 'outfits'}, que seguirán existiendo y la marcarán como no disponible.`}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => onEliminar(prenda)} className="text-xs font-semibold" style={{ color: COLORS.negative }}>Sí, eliminar</button>
                  <button onClick={() => setConfirmando(false)} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmando(true)} className="text-xs font-semibold mt-3" style={{ color: COLORS.negative }}>
                Eliminar prenda
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Filtros ----------
   Apartado 10: combinables. Se despliegan a petición para que la cabecera no se coma
   media pantalla en un móvil (apartado 18). */
function PanelFiltros({ filtros, setFiltros, marcas, accent, orden, setOrden, ordenes }) {
  const set = (k, v) => setFiltros((f) => ({ ...f, [k]: v || undefined }));
  return (
    <Card style={{ background: COLORS.surface2 }}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoría">
          <SelectInput value={filtros.categoria || ''} onChange={(e) => set('categoria', e.target.value)}>
            <option value="">Todas</option>
            {CATEGORIAS_ARMARIO.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </SelectInput>
        </Field>
        <Field label="Color">
          <SelectInput value={filtros.color || ''} onChange={(e) => set('color', e.target.value)}>
            <option value="">Todos</option>
            {COLORES_ARMARIO.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </SelectInput>
        </Field>
        {/* Solo se ofrece filtrar por marca si Josué ha escrito alguna: un desplegable
            vacío es un control que no hace nada (regla 8). */}
        {marcas.length > 0 && (
          <Field label="Marca">
            <SelectInput value={filtros.marca || ''} onChange={(e) => set('marca', e.target.value)}>
              <option value="">Todas</option>
              {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
            </SelectInput>
          </Field>
        )}
        <Field label="Temporada">
          <SelectInput value={filtros.temporada || ''} onChange={(e) => set('temporada', e.target.value)}>
            <option value="">Todas</option>
            {TEMPORADAS_PRENDA.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </SelectInput>
        </Field>
        <Field label="Estado">
          <SelectInput value={filtros.estado || ''} onChange={(e) => set('estado', e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS_PRENDA.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </SelectInput>
        </Field>
        <Field label="Ordenar por">
          <SelectInput value={orden} onChange={(e) => setOrden(e.target.value)}>
            {ordenes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </SelectInput>
        </Field>
      </div>
      <button
        onClick={() => setFiltros((f) => ({ ...f, soloFavoritas: !f.soloFavoritas }))}
        className="flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: filtros.soloFavoritas ? accent : COLORS.textMuted }}
        aria-pressed={!!filtros.soloFavoritas}
      >
        <Star size={13} style={filtros.soloFavoritas ? { color: accent, fill: accent } : undefined} /> Solo favoritas
      </button>
    </Card>
  );
}

/* ===========================================================================
   Entrega 2 · AR Fase 2 — Outfits
   =========================================================================== */

/* Vista previa (apartado 8): las prendas agrupadas por zona del cuerpo. La
   especificación es explícita en que NO hace falta una silueta ni una
   representación fotográfica del cuerpo — lo que importa es ver de qué se compone.
   Con fotos, la composición se ve sola. */
function ComposicionOutfit({ outfit, prendas, accent, onPulsarPrenda, onAnadirPrendas }) {
  const grupos = composicionPorZonas(outfit, prendas);
  // Apartado 4 del cierre técnico: una prenda borrada no puede dejar una tarjeta vacía
  // ni reventar la pantalla. Se dice que ya no está, y punto.
  const faltan = composicionDeOutfit(outfit, prendas).filter((c) => !c.prenda).length;

  // Apartado 5 del cierre: un outfit sin prendas tiene su propio estado, con salida.
  if (grupos.length === 0 && faltan === 0) {
    return (
      <div>
        <EmptyHint text="Este outfit todavía no tiene prendas." />
        {onAnadirPrendas && (
          <button onClick={onAnadirPrendas} className="text-xs font-semibold mt-2" style={{ color: accent }}>
            Añadir prendas
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {grupos.map(({ zona, prendas: lista }) => (
        <div key={zona.id}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: COLORS.textMuted }}>
            {zona.label}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {lista.map((p) => (
              /* Apartado 17: pulsar una prenda dentro del outfit abre SU detalle, el
                 mismo de la Fase 1. No hay una segunda pantalla de prenda. */
              <button
                key={p.id}
                onClick={() => onPulsarPrenda && onPulsarPrenda(p)}
                className="rounded-xl overflow-hidden flex-shrink-0 text-left transition-transform active:scale-95"
                style={{ width: 84, background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
              >
                <MiniaturaPrenda prenda={p} alto={64} />
                <p className="text-[11px] px-1.5 py-1 truncate" style={{ color: COLORS.text }}>{p.nombre}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
      {faltan > 0 && (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          {faltan === 1
            ? 'Una prenda de este outfit ya no está en tu armario. Si la recuperas desde Eliminados recientemente, volverá aquí sola.'
            : `${faltan} prendas de este outfit ya no están en tu armario. Si las recuperas desde Eliminados recientemente, volverán aquí solas.`}
        </p>
      )}
    </div>
  );
}

/* Tarjeta de outfit.
   Apartados 8 y 9 del pulido: editar y duplicar tienen que estar a un toque desde la
   propia tarjeta, sin entrar en dos pantallas. Y el favorito se marca desde aquí
   (apartado 11).

   La tarjeta NO es un botón: es un contenedor con un botón grande arriba (abrir) y una
   fila de acciones debajo. Un botón dentro de otro es HTML inválido y en iOS el toque
   interior se lo come el exterior — el mismo fallo silencioso que apareció en BI Fase 1
   y que `smoke-vistas.jsx` comprueba ahora en todas las vistas. */
function TarjetaOutfit({ outfit, prendas, accent, onAbrir, onEditar, onDuplicar, onFavorito }) {
  const suyas = prendasDeOutfit(outfit, prendas);
  const ocasion = OCASIONES_OUTFIT.find((o) => o.id === outfit.ocasion);
  const noDisponibles = noDisponiblesDeOutfit(outfit, prendas);

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      <button
        onClick={() => onAbrir(outfit)}
        className="text-left transition-transform active:scale-[0.97]"
        aria-label={`Abrir el outfit ${outfit.nombre}`}
      >
        <div className="relative">
          {outfit.fotoPath ? (
            <MiniaturaPrenda prenda={{ fotoPath: outfit.fotoPath, nombre: outfit.nombre, color: 'otro', categoria: 'otros' }} alto={112} />
          ) : suyas.length === 0 ? (
            <div className="w-full flex items-center justify-center" style={{ height: 112, background: COLORS.surface2 }}>
              <Layers size={20} style={{ color: COLORS.textMuted }} />
            </div>
          ) : (
            /* Apartado 6 del pulido: sin foto propia, la composición se hace con las
               prendas. Con una sola, ocupa el ancho entero en vez de dejar tres huecos. */
            <div className="grid" style={{ height: 112, gridTemplateColumns: suyas.length === 1 ? '1fr' : '1fr 1fr', gap: 1, background: COLORS.border }}>
              {suyas.slice(0, 4).map((p) => (
                <MiniaturaPrenda key={p.id} prenda={p} alto={suyas.length <= 2 ? 112 : 55.5} />
              ))}
            </div>
          )}
        </div>
        <div className="px-2.5 pt-2">
          <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{outfit.nombre || 'Sin nombre'}</p>
          <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
            {suyas.length} {suyas.length === 1 ? 'prenda' : 'prendas'}{ocasion ? ` · ${ocasion.label}` : ''}
          </p>
          {/* Apartado 14 del pulido — indicador discreto, sin impedir nada. */}
          {noDisponibles > 0 && (
            <p className="text-[11px] mt-0.5 truncate" style={{ color: COLORS.textMuted }}>
              {noDisponibles} {noDisponibles === 1 ? 'prenda no disponible' : 'prendas no disponibles'}
            </p>
          )}
        </div>
      </button>

      <div className="flex items-center gap-1 px-2 py-1.5 mt-auto">
        <button
          onClick={() => onFavorito(outfit)}
          className="p-1.5 rounded-lg transition-transform active:scale-90"
          aria-pressed={!!outfit.favorito}
          aria-label={outfit.favorito ? 'Quitar de favoritos' : 'Marcar como favorito'}
        >
          <Star size={13} style={outfit.favorito ? { color: accent, fill: accent } : { color: COLORS.textMuted }} />
        </button>
        <button onClick={() => onEditar(outfit)} className="p-1.5 rounded-lg transition-transform active:scale-90" aria-label={`Editar ${outfit.nombre}`}>
          <Pencil size={13} style={{ color: COLORS.textMuted }} />
        </button>
        <button onClick={() => onDuplicar(outfit)} className="p-1.5 rounded-lg transition-transform active:scale-90" aria-label={`Duplicar ${outfit.nombre}`}>
          <Copy size={13} style={{ color: COLORS.textMuted }} />
        </button>
        {/* Apartado 10 del pulido: eliminar NO va aquí, junto a editar. Vive solo dentro
            del detalle y con confirmación, para que no se pulse sin querer. */}
      </div>
    </div>
  );
}

/* Selector de prendas (apartados 5, 6 y 7).

   Reutiliza `prendasVisibles` de la Fase 1 tal cual — la especificación pide
   expresamente no crear un segundo sistema de búsqueda. Y no limita cuántas prendas
   de la misma zona se pueden meter: dos camisetas o tres accesorios son un outfit
   perfectamente válido. */
function SelectorPrendas({ prendas, seleccion, onToggle, accent }) {
  const [consulta, setConsulta] = useState('');
  const [zona, setZona] = useState('');

  const visibles = useMemo(() => {
    const base = prendasVisibles(prendas, { consulta, orden: 'recientes' });
    if (!zona) return base;
    return base.filter((p) => zonaDeCategoria(p.categoria) === zona);
  }, [prendas, consulta, zona]);

  return (
    <div>
      <div className="relative mb-2">
        <Search size={14} style={{ color: COLORS.textMuted, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
        <TextInput
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Buscar entre tus prendas…"
          style={{ paddingLeft: 30 }}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-2" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setZona('')}
          className="text-xs px-3 py-1.5 rounded-full font-semibold flex-shrink-0"
          style={{ background: !zona ? accent : COLORS.surface2, color: !zona ? COLORS.textOnAccent : COLORS.textMuted, border: `1px solid ${!zona ? accent : COLORS.border}` }}
        >
          Todas
        </button>
        {ZONAS_OUTFIT.map((z) => {
          const activa = zona === z.id;
          return (
            <button
              key={z.id}
              onClick={() => setZona(activa ? '' : z.id)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold flex-shrink-0"
              style={{ background: activa ? accent : COLORS.surface2, color: activa ? COLORS.textOnAccent : COLORS.textMuted, border: `1px solid ${activa ? accent : COLORS.border}` }}
            >
              {z.label}
            </button>
          );
        })}
      </div>

      {visibles.length === 0 ? (
        <EmptyHint text={consulta || zona ? 'Ninguna prenda coincide.' : 'Añade prendas al armario para poder combinarlas.'} />
      ) : (
        <div className="grid grid-cols-3 gap-2" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
          {visibles.map((p) => {
            const elegida = seleccion.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p.id)}
                aria-pressed={elegida}
                className="relative rounded-xl overflow-hidden text-left transition-transform active:scale-95"
                style={{ background: COLORS.surface2, border: `2px solid ${elegida ? accent : COLORS.border}` }}
              >
                <MiniaturaPrenda prenda={p} alto={62} />
                <p className="text-[11px] px-1.5 py-1 truncate" style={{ color: COLORS.text }}>{p.nombre}</p>
                {elegida && (
                  <span className="absolute rounded-full p-0.5" style={{ top: 4, right: 4, background: accent }}>
                    <Check size={10} style={{ color: COLORS.textOnAccent }} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const FORM_OUTFIT_VACIO = {
  nombre: '', descripcion: '', prendaIds: [], ocasion: 'diario',
  estacion: 'todo_el_ano', lugar: '', personas: [], favorito: false,
};

/* Apartado 25: crear un outfit tiene que ser rápido. Nombre → prendas → guardar.
   Lo demás (ocasión, estación, lugar, personas, descripción) va plegado. */
function FormularioOutfit({ inicial, prendas, accent, guardando, errorFoto, fotoPendiente, onFoto, onGuardar, onCancelar }) {
  const [form, setForm] = useState({ ...FORM_OUTFIT_VACIO, ...(inicial || {}) });
  const [masInfo, setMasInfo] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (id) => setForm((f) => ({
    ...f,
    prendaIds: f.prendaIds.includes(id) ? f.prendaIds.filter((x) => x !== id) : [...f.prendaIds, id],
  }));
  const puedeGuardar = form.nombre.trim().length > 0 && !guardando;

  return (
    <Card>
      <Field label="Nombre del outfit">
        <TextInput
          value={form.nombre} autoFocus
          onChange={(e) => set('nombre', e.target.value)}
          placeholder="Ej: Casual gris"
        />
      </Field>

      <p className="text-xs font-semibold mb-1.5" style={{ color: COLORS.textMuted }}>
        Prendas {form.prendaIds.length > 0 && `· ${form.prendaIds.length} elegidas`}
      </p>
      <SelectorPrendas prendas={prendas} seleccion={form.prendaIds} onToggle={toggle} accent={accent} />

      <label className="flex items-center gap-2 text-xs font-semibold mt-3 mb-3 cursor-pointer" style={{ color: accent }}>
        <Camera size={14} />
        {fotoPendiente ? `Foto elegida: ${fotoPendiente}` : 'Foto del outfit (opcional)'}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onFoto(e.target.files?.[0] || null)} />
      </label>
      {errorFoto && <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>{errorFoto}</p>}

      <button
        onClick={() => setMasInfo((m) => !m)}
        className="flex items-center gap-1.5 text-xs font-semibold mb-3"
        style={{ color: COLORS.textMuted }}
        aria-expanded={masInfo}
      >
        {masInfo ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Más información
      </button>

      {masInfo && (
        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '0.75rem' }}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ocasión">
              <SelectInput value={form.ocasion} onChange={(e) => set('ocasion', e.target.value)}>
                {OCASIONES_OUTFIT.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </SelectInput>
            </Field>
            <Field label="Estación">
              <SelectInput value={form.estacion} onChange={(e) => set('estacion', e.target.value)}>
                {ESTACIONES_OUTFIT.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </SelectInput>
            </Field>
          </div>
          <Field label="Lugar"><TextInput value={form.lugar} onChange={(e) => set('lugar', e.target.value)} placeholder="Instituto, gimnasio…" /></Field>
          {/* Apartado 11: personas es texto libre separado por comas, no un sistema
              social — el propio apartado dice que no se construya uno. */}
          <Field label="Personas">
            <TextInput
              value={(form.personas || []).join(', ')}
              onChange={(e) => set('personas', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
              placeholder="Amigos, familia…"
            />
          </Field>
          <Field label="Descripción"><Textarea value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} rows={2} /></Field>
          <button
            onClick={() => set('favorito', !form.favorito)}
            className="flex items-center gap-1.5 text-xs font-semibold mb-3"
            style={{ color: form.favorito ? accent : COLORS.textMuted }}
            aria-pressed={form.favorito}
          >
            <Star size={13} style={form.favorito ? { color: accent, fill: accent } : undefined} />
            {form.favorito ? 'Es uno de tus favoritos' : 'Marcar como favorito'}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <PrimaryButton accent={accent} onClick={() => onGuardar(form)} disabled={!puedeGuardar}>
          {guardando ? 'Guardando…' : 'Guardar outfit'}
        </PrimaryButton>
        <div style={{ width: 100, flexShrink: 0 }}>
          <GhostBtn onClick={onCancelar}>Cancelar</GhostBtn>
        </div>
      </div>
    </Card>
  );
}

/* Detalle del outfit (apartado 16): todo lo que tenga, y editar / duplicar / eliminar. */
function DetalleOutfit({ outfit, prendas, usos, hoyISO, accent, onCerrar, onEditar, onDuplicar, onEliminar, onFavorito, onAbrirPrenda, onRegistrarUso }) {
  const [confirmando, setConfirmando] = useState(false);
  const [verHistorial, setVerHistorial] = useState(false);
  const mios = usosDeOutfit(usos, outfit.id);
  const resumen = resumenDeUso(mios);
  const ocasion = OCASIONES_OUTFIT.find((o) => o.id === outfit.ocasion);
  const estacion = ESTACIONES_OUTFIT.find((o) => o.id === outfit.estacion);
  const filas = [
    ['Ocasión', ocasion?.label],
    ['Estación', estacion?.label],
    ['Lugar', outfit.lugar],
    ['Personas', (outfit.personas || []).join(', ')],
  ].filter(([, v]) => v);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 pb-3 sm:pb-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCerrar}>
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, maxHeight: '86vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ maxHeight: '86vh', overflowY: 'auto' }}>
          <div className="flex items-start justify-between gap-3 p-4 pb-2">
            <div className="min-w-0">
              <p className="text-lg font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
                {outfit.nombre || 'Sin nombre'}
              </p>
            </div>
            {/* Apartado 11 del pulido: marcar/desmarcar favorito sin salir de aquí. */}
            <button
              onClick={() => onFavorito(outfit)}
              className="rounded-full p-1.5 flex-shrink-0 transition-transform active:scale-90"
              style={{ background: COLORS.surface2 }}
              aria-pressed={!!outfit.favorito}
              aria-label={outfit.favorito ? 'Quitar de favoritos' : 'Marcar como favorito'}
            >
              <Star size={14} style={outfit.favorito ? { color: accent, fill: accent } : { color: COLORS.textMuted }} />
            </button>
            <button onClick={onCerrar} className="rounded-full p-1.5 flex-shrink-0" style={{ background: COLORS.surface2 }} aria-label="Cerrar outfit">
              <X size={14} style={{ color: COLORS.text }} />
            </button>
          </div>

          <div className="px-4 pb-4">
            {outfit.fotoPath && (
              <div className="rounded-2xl overflow-hidden mb-3">
                <MiniaturaPrenda prenda={{ fotoPath: outfit.fotoPath, nombre: outfit.nombre, color: 'otro', categoria: 'otros' }} alto={180} />
              </div>
            )}

            <ComposicionOutfit
              outfit={outfit} prendas={prendas} accent={accent}
              onPulsarPrenda={onAbrirPrenda}
              onAnadirPrendas={() => onEditar(outfit)}
            />

            {filas.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {filas.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3">
                    <span className="text-xs flex-shrink-0" style={{ color: COLORS.textMuted }}>{k}</span>
                    <span className="text-sm text-right min-w-0 truncate" style={{ color: COLORS.text }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {outfit.descripcion && (
              <p className="text-sm mt-3 leading-relaxed" style={{ color: COLORS.textMuted }}>{outfit.descripcion}</p>
            )}

            {/* Apartado 15: "hace X días", siempre calculado, nunca guardado. */}
            <p className="text-xs mt-3" style={{ color: COLORS.textMuted }}>
              {resumen.total > 0
                ? `Usado ${resumen.total} ${resumen.total === 1 ? 'vez' : 'veces'} · último uso ${textoUltimoUso(resumen.ultimaFecha, hoyISO).toLowerCase()}`
                : 'Todavía no has registrado este outfit.'}
            </p>

            {/* Apartado 7: el atajo que hace que registrar tarde segundos. */}
            <div className="mt-3">
              <PrimaryButton accent={accent} onClick={() => onRegistrarUso(outfit)} icon={Check}>
                Me lo he puesto hoy
              </PrimaryButton>
            </div>

            <button
              onClick={() => setVerHistorial((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold mt-3"
              style={{ color: COLORS.textMuted }}
              aria-expanded={verHistorial}
            >
              {verHistorial ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              <History size={12} /> Historial de uso
            </button>
            {verHistorial && (
              <div className="mt-2">
                <HistorialDeUso
                  usosFiltrados={mios} outfits={[outfit]} prendas={prendas} accent={accent} hoyISO={hoyISO}
                  vacioTexto="Todavía no has registrado este outfit."
                />
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <PrimaryButton accent={accent} onClick={() => onEditar(outfit)} icon={Pencil}>Editar</PrimaryButton>
              <div style={{ width: 118, flexShrink: 0 }}>
                <GhostBtn icon={Copy} onClick={() => onDuplicar(outfit)}>Duplicar</GhostBtn>
              </div>
            </div>

            {confirmando ? (
              <div className="mt-3 rounded-2xl p-3" style={{ background: COLORS.surface2 }}>
                {/* Apartado 15, dicho en la propia interfaz para que no dé miedo: borrar
                    el outfit no borra ninguna prenda. */}
                <p className="text-xs mb-2" style={{ color: COLORS.text }}>
                  ¿Eliminar este outfit? Tus prendas se quedan en el armario; solo desaparece la combinación.
                  {resumen.total > 0 && ` Sus ${resumen.total} ${resumen.total === 1 ? 'uso registrado se conserva' : 'usos registrados se conservan'} en el calendario, y vuelven a su sitio si lo recuperas.`}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => onEliminar(outfit)} className="text-xs font-semibold" style={{ color: COLORS.negative }}>Sí, eliminar</button>
                  <button onClick={() => setConfirmando(false)} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmando(true)} className="text-xs font-semibold mt-3" style={{ color: COLORS.negative }}>
                Eliminar outfit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ===========================================================================
   Entrega 2 · AR Fase 3 — Calendario e historial de uso
   =========================================================================== */

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const FORM_USO_VACIO = { outfitId: '', fecha: '', hora: '', lugar: '', personas: [], evento: 'diario', notas: '' };

/* Formulario de un uso (apartados 6 y 20).
   Lo único obligatorio es outfit + fecha. Todo lo demás vive plegado, porque el
   apartado 35 pide que registrar un outfit tarde segundos, no que se rellene una ficha. */
function FormularioUso({ inicial, outfits, prendas, accent, onGuardar, onCancelar }) {
  const [form, setForm] = useState({ ...FORM_USO_VACIO, fecha: todayISO(), ...(inicial || {}) });
  const [masInfo, setMasInfo] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const puedeGuardar = !!form.outfitId && !!form.fecha;
  const elegido = outfits.find((o) => o.id === form.outfitId);

  return (
    <Card>
      <Field label="Outfit">
        <SelectInput value={form.outfitId} onChange={(e) => set('outfitId', e.target.value)}>
          <option value="">Elige un outfit…</option>
          {[...outfits].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((o) => (
            <option key={o.id} value={o.id}>{o.nombre}</option>
          ))}
        </SelectInput>
      </Field>

      {/* Ver qué llevaba ese outfit ayuda a no registrar el equivocado. */}
      {elegido && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3" style={{ scrollbarWidth: 'none' }}>
          {prendasDeOutfit(elegido, prendas).map((p) => (
            <div key={p.id} className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: 60, background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <MiniaturaPrenda prenda={p} alto={44} />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha">
          <TextInput type="date" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} />
        </Field>
        <Field label="Hora (opcional)">
          <TextInput type="time" value={form.hora} onChange={(e) => set('hora', e.target.value)} />
        </Field>
      </div>

      <button
        onClick={() => setMasInfo((m) => !m)}
        className="flex items-center gap-1.5 text-xs font-semibold mb-3"
        style={{ color: COLORS.textMuted }}
        aria-expanded={masInfo}
      >
        {masInfo ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Más información
      </button>

      {masInfo && (
        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '0.75rem' }}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lugar"><TextInput value={form.lugar} onChange={(e) => set('lugar', e.target.value)} placeholder="Instituto, casa…" /></Field>
            <Field label="Ocasión">
              <SelectInput value={form.evento} onChange={(e) => set('evento', e.target.value)}>
                {EVENTOS_USO.map((ev) => <option key={ev.id} value={ev.id}>{ev.label}</option>)}
              </SelectInput>
            </Field>
          </div>
          <Field label="Personas">
            <TextInput
              value={(form.personas || []).join(', ')}
              onChange={(e) => set('personas', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
              placeholder="Jorge, Pablo, María"
            />
          </Field>
          <Field label="Notas"><Textarea value={form.notas} onChange={(e) => set('notas', e.target.value)} rows={2} placeholder="Hacía bastante calor…" /></Field>
        </div>
      )}

      <div className="flex gap-2">
        <PrimaryButton accent={accent} onClick={() => onGuardar(form)} disabled={!puedeGuardar}>
          {inicial?.id ? 'Guardar cambios' : 'Registrar uso'}
        </PrimaryButton>
        <div style={{ width: 100, flexShrink: 0 }}>
          <GhostBtn onClick={onCancelar}>Cancelar</GhostBtn>
        </div>
      </div>
    </Card>
  );
}

/* Una fila del historial: el outfit, cuándo y dónde. Sirve igual en el detalle de un
   día, en la vista de lista y en el historial de un outfit o de una prenda. */
function FilaUso({ uso, outfits, prendas, accent, onAbrirOutfit, onEditar, onEliminar, mostrarFecha = true }) {
  const outfit = outfits.find((o) => o.id === uso.outfitId);
  const evento = EVENTOS_USO.find((e) => e.id === uso.evento);
  const contexto = [uso.lugar, evento && evento.id !== 'diario' ? evento.label : '', (uso.personas || []).join(', ')]
    .filter(Boolean).join(' · ');

  return (
    <div className="rounded-2xl p-3" style={{ background: COLORS.surface2 }}>
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={() => outfit && onAbrirOutfit && onAbrirOutfit(outfit)}
          className="text-left min-w-0 flex-1"
          disabled={!outfit}
        >
          <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>
            {/* Apartado 32: si el outfit se borró, el uso NO desaparece — se dice. */}
            {outfit ? outfit.nombre : 'Outfit eliminado'}
          </p>
          <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
            {mostrarFecha ? formatFecha(uso.fecha) : ''}{uso.hora ? `${mostrarFecha ? ' · ' : ''}${uso.hora}` : ''}
            {contexto ? `${mostrarFecha || uso.hora ? ' · ' : ''}${contexto}` : ''}
          </p>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEditar && (
            <button onClick={() => onEditar(uso)} className="p-1.5 rounded-lg transition-transform active:scale-90" aria-label="Editar este uso">
              <Pencil size={12} style={{ color: COLORS.textMuted }} />
            </button>
          )}
          {onEliminar && <BotonBorrar onClick={() => onEliminar(uso)} label="Eliminar este uso" />}
        </div>
      </div>
      {uso.notas && <p className="text-xs mt-1.5 leading-relaxed" style={{ color: COLORS.textMuted }}>{uso.notas}</p>}
      {outfit && (
        <div className="flex gap-1.5 mt-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {prendasDeOutfit(outfit, prendas).slice(0, 6).map((p) => (
            <div key={p.id} className="rounded-lg overflow-hidden flex-shrink-0" style={{ width: 38, border: `1px solid ${COLORS.border}` }}>
              <MiniaturaPrenda prenda={p} alto={30} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Historial de un outfit o de una prenda (apartados 14, 16, 27 y 28).
   Se usa dentro de los dos detalles, así que recibe ya la lista filtrada. */
export function HistorialDeUso({ usosFiltrados, outfits, prendas, accent, hoyISO, onRegistrar, vacioTexto, vacioBoton }) {
  const resumen = resumenDeUso(usosFiltrados);
  if (resumen.total === 0) {
    return (
      <div className="rounded-2xl p-3" style={{ background: COLORS.surface2 }}>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>{vacioTexto}</p>
        {onRegistrar && vacioBoton && (
          <button onClick={onRegistrar} className="text-xs font-semibold mt-2" style={{ color: accent }}>{vacioBoton}</button>
        )}
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-sm font-semibold" style={{ color: COLORS.text }}>
          {resumen.total} {resumen.total === 1 ? 'uso' : 'usos'}
        </span>
        <span className="text-xs" style={{ color: COLORS.textMuted }}>
          Último: {textoUltimoUso(resumen.ultimaFecha, hoyISO)}
        </span>
      </div>
      <div className="space-y-1.5" style={{ maxHeight: '34vh', overflowY: 'auto' }}>
        {usosFiltrados.slice(0, 40).map((u) => (
          <FilaUso key={u.id} uso={u} outfits={outfits} prendas={prendas} accent={accent} />
        ))}
      </div>
      {usosFiltrados.length > 40 && (
        <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
          Se muestran los 40 más recientes de {usosFiltrados.length}.
        </p>
      )}
    </div>
  );
}

/* ---------- Pestaña PRENDAS ----------
   Es la pantalla entera de la Fase 1, ahora como una de las dos pestañas del Armario
   (apartado 2 de la Fase 2). No ha cambiado nada de su funcionamiento: solo recibe
   `outfits` para poder avisar, al borrar una prenda, de en cuántas combinaciones está. */
function PanelPrendas({ prendas, outfits, usos, hoyISO, onAddPrenda, onUpdatePrenda, onDeletePrenda, onSubirFoto, accent, prendaFoco, onFocoConsumido }) {
  const [consulta, setConsulta] = useState('');
  const [filtros, setFiltros] = useState({});
  const [orden, setOrden] = useState('recientes');
  const [verFiltros, setVerFiltros] = useState(false);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorFoto, setErrorFoto] = useState('');

  const marcas = useMemo(() => marcasDe(prendas), [prendas]);
  const conteo = useMemo(() => conteoPorCategoria(prendas), [prendas]);
  // Las ordenaciones por uso salen del historial, no de un contador dentro de la prenda:
  // por eso `usos` y `outfits` entran aquí y en las dependencias del memo.
  const ordenes = useMemo(() => ordenesDisponibles(usos), [usos]);
  const visibles = useMemo(
    () => prendasVisibles(prendas, { consulta, filtros, orden, usos, outfits }),
    [prendas, consulta, filtros, orden, usos, outfits],
  );

  // Si el orden elegido deja de estar disponible (porque se ha borrado el último uso
  // registrado), se vuelve al de por defecto en vez de dejar una lista sin ordenar.
  useEffect(() => {
    if (!ordenes.some((o) => o.id === orden)) setOrden('recientes');
  }, [ordenes, orden]);

  // Apartado 17 de la Fase 2: pulsar una prenda dentro de un outfit abre SU detalle.
  // El outfit cambia a esta pestaña y deja aquí el id; se consume una sola vez, igual
  // que el deep-link del Dashboard, para que no se vuelva a abrir al volver.
  useEffect(() => {
    if (!prendaFoco) return;
    const p = prendas.find((x) => x.id === prendaFoco);
    if (p) setDetalle(p);
    onFocoConsumido && onFocoConsumido();
  }, [prendaFoco]);

  const hayFiltros = Object.values(filtros).some(Boolean) || consulta.trim().length > 0;

  const abrirNueva = () => { setEditando(null); setArchivoFoto(null); setErrorFoto(''); setFormAbierto(true); };
  const abrirEdicion = (p) => { setEditando(p); setArchivoFoto(null); setErrorFoto(''); setDetalle(null); setFormAbierto(true); };
  const cerrarForm = () => { setFormAbierto(false); setEditando(null); setArchivoFoto(null); setErrorFoto(''); };

  const guardar = async (form) => {
    setGuardando(true);
    setErrorFoto('');
    let fotoPath = editando ? editando.fotoPath : '';
    if (archivoFoto) {
      try {
        fotoPath = await onSubirFoto(archivoFoto);
      } catch {
        // La foto es opcional: si falla la subida se guarda la prenda igual y se dice
        // por qué. Perder los datos escritos por un fallo de red sería mucho peor.
        setErrorFoto('No se ha podido subir la foto. La prenda se ha guardado sin ella.');
        fotoPath = editando ? editando.fotoPath : '';
      }
    }
    if (editando) onUpdatePrenda(editando.id, { ...form, fotoPath });
    else onAddPrenda({ ...form, fotoPath });
    setGuardando(false);
    setFormAbierto(false);
    setEditando(null);
    setArchivoFoto(null);
  };

  const eliminar = (p) => { onDeletePrenda(p.id); setDetalle(null); };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle sub={prendas.length ? `${prendas.length} ${prendas.length === 1 ? 'prenda' : 'prendas'}` : 'Todo tu estilo, organizado en un solo lugar'}>
          <span className="flex items-center gap-2"><Shirt size={18} style={{ color: accent }} /> Mi armario</span>
        </SectionTitle>
        {prendas.length > 0 && (
          <button
            onClick={abrirNueva}
            className="p-2.5 rounded-xl flex-shrink-0 transition-transform active:scale-90"
            style={{ background: accent }}
            aria-label="Añadir prenda"
          >
            <Plus size={16} color={COLORS.textOnAccent} />
          </button>
        )}
      </div>

      {/* Apartado 19: el armario vacío invita, no deja una pantalla en blanco. */}
      {prendas.length === 0 && !formAbierto && (
        <Card>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Tu armario está esperando.</p>
          <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>
            Añade tu primera prenda y empieza a construir tu armario digital. La foto es opcional: puedes añadirla luego, o no ponerla nunca.
          </p>
          <PrimaryButton accent={accent} onClick={abrirNueva} icon={Plus}>Añadir primera prenda</PrimaryButton>
        </Card>
      )}

      {formAbierto && (
        <FormularioPrenda
          inicial={editando}
          accent={accent}
          guardando={guardando}
          errorFoto={errorFoto}
          fotoPendiente={archivoFoto ? archivoFoto.name : null}
          onFoto={setArchivoFoto}
          onGuardar={guardar}
          onCancelar={cerrarForm}
        />
      )}

      {prendas.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search size={14} style={{ color: COLORS.textMuted, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <TextInput
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                placeholder="Buscar por nombre, color, marca…"
                style={{ paddingLeft: 30, paddingRight: consulta ? 30 : undefined }}
              />
              {consulta && (
                <button
                  onClick={() => setConsulta('')}
                  className="absolute rounded-full flex items-center justify-center"
                  style={{ right: 8, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, background: COLORS.surface2 }}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={11} style={{ color: COLORS.textMuted }} />
                </button>
              )}
            </div>
            <button
              onClick={() => setVerFiltros((v) => !v)}
              className="p-2.5 rounded-xl flex-shrink-0"
              style={{ background: verFiltros ? hexToRgba(accent, 0.16) : COLORS.surface2, border: `1px solid ${verFiltros ? accent : COLORS.border}` }}
              aria-label="Filtros y orden"
              aria-expanded={verFiltros}
            >
              <SlidersHorizontal size={16} style={{ color: verFiltros ? accent : COLORS.textMuted }} />
            </button>
          </div>

          {verFiltros && (
            <PanelFiltros
              filtros={filtros} setFiltros={setFiltros} marcas={marcas} accent={accent}
              orden={orden} setOrden={setOrden} ordenes={ordenes}
            />
          )}

          {/* Atajo por categoría: solo se pintan las que tienen prendas dentro. */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setFiltros((f) => ({ ...f, categoria: undefined }))}
              className="text-xs px-3 py-1.5 rounded-full font-semibold flex-shrink-0"
              style={{
                background: !filtros.categoria ? accent : COLORS.surface2,
                color: !filtros.categoria ? COLORS.textOnAccent : COLORS.textMuted,
                border: `1px solid ${!filtros.categoria ? accent : COLORS.border}`,
              }}
            >
              Todas
            </button>
            {CATEGORIAS_ARMARIO.filter((c) => conteo[c.id]).map((c) => {
              const activa = filtros.categoria === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setFiltros((f) => ({ ...f, categoria: activa ? undefined : c.id }))}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold flex-shrink-0"
                  style={{
                    background: activa ? accent : COLORS.surface2,
                    color: activa ? COLORS.textOnAccent : COLORS.textMuted,
                    border: `1px solid ${activa ? accent : COLORS.border}`,
                  }}
                >
                  {c.label} {conteo[c.id]}
                </button>
              );
            })}
          </div>

          {visibles.length === 0 ? (
            <EmptyHint text={hayFiltros ? 'Ninguna prenda coincide con lo que has buscado.' : 'Todavía no hay prendas aquí.'} />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {visibles.map((p) => (
                <TarjetaPrenda key={p.id} prenda={p} accent={accent} onAbrir={setDetalle} />
              ))}
            </div>
          )}
        </>
      )}

      {detalle && (
        <DetallePrenda
          prenda={detalle} outfits={outfits} usos={usos} hoyISO={hoyISO} accent={accent}
          onCerrar={() => setDetalle(null)}
          onEditar={abrirEdicion}
          onEliminar={eliminar}
        />
      )}
    </div>
  );
}

/* ---------- Pestaña OUTFITS ----------
   Se exporta con nombre además de usarse aquí dentro: `renderToString` no puede pulsar
   una pestaña, así que sin esto el panel de outfits nunca llegaría a renderizarse en la
   prueba de humo — y es justo donde vive la mitad de esta fase. */
export function PanelOutfits({ outfits, prendas, usos, hoyISO, onAddOutfit, onUpdateOutfit, onDeleteOutfit, onDuplicarOutfit, onSubirFoto, onAbrirPrenda, onRegistrarUso, accent, outfitFoco, onFocoConsumido }) {
  const [consulta, setConsulta] = useState('');
  const [filtros, setFiltros] = useState({});
  const [orden, setOrden] = useState('recientes');
  const [verFiltros, setVerFiltros] = useState(false);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorFoto, setErrorFoto] = useState('');
  const [aviso, setAviso] = useState('');

  const lugares = useMemo(() => lugaresDe(outfits), [outfits]);
  const ordenes = useMemo(() => ordenesOutfitsDisponibles(usos), [usos]);
  const visibles = useMemo(
    () => outfitsVisibles(outfits, prendas, { consulta, filtros, orden, usos }),
    [outfits, prendas, consulta, filtros, orden, usos],
  );

  useEffect(() => {
    if (!ordenes.some((o) => o.id === orden)) setOrden('recientes');
  }, [ordenes, orden]);

  // Apartado 13 del pulido — el aviso de "guardado ✓" se va solo. Nada de `alert()`.
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 2600);
    return () => clearTimeout(t);
  }, [aviso]);

  // El detalle abierto tiene que reflejar los cambios en cuanto se guardan (apartado 7
  // de la continuación: "después de guardar, los cambios deben reflejarse
  // inmediatamente"). Se relee del array en vez de guardar una copia en el estado, que
  // se quedaría vieja.
  const detalleVivo = detalle ? outfits.find((o) => o.id === detalle.id) || null : null;
  useEffect(() => {
    if (detalle && !detalleVivo) setDetalle(null);
  }, [detalle, detalleVivo]);

  // Desde el calendario se puede abrir el outfit de un uso: llega su id y se abre aquí.
  useEffect(() => {
    if (!outfitFoco) return;
    const o = outfits.find((x) => x.id === outfitFoco);
    if (o) setDetalle(o);
    onFocoConsumido && onFocoConsumido();
  }, [outfitFoco]);

  const hayFiltros = Object.values(filtros).some(Boolean) || consulta.trim().length > 0;

  const abrirNuevo = () => { setEditando(null); setArchivoFoto(null); setErrorFoto(''); setFormAbierto(true); };
  const abrirEdicion = (o) => { setEditando(o); setArchivoFoto(null); setErrorFoto(''); setDetalle(null); setFormAbierto(true); };
  const cerrarForm = () => { setFormAbierto(false); setEditando(null); setArchivoFoto(null); setErrorFoto(''); };

  const guardar = async (form) => {
    setGuardando(true);
    setErrorFoto('');
    let fotoPath = editando ? editando.fotoPath : '';
    if (archivoFoto) {
      try {
        fotoPath = await onSubirFoto(archivoFoto);
      } catch {
        // Apartado 19 del pulido: no perder en silencio lo que ya había escrito.
        setErrorFoto('No se ha podido subir la foto. El outfit se ha guardado sin ella.');
        fotoPath = editando ? editando.fotoPath : '';
      }
    }
    if (editando) { onUpdateOutfit(editando.id, { ...form, fotoPath }); setAviso('Outfit actualizado'); }
    else { onAddOutfit({ ...form, fotoPath }); setAviso('Outfit guardado'); }
    setGuardando(false);
    setFormAbierto(false);
    setEditando(null);
    setArchivoFoto(null);
  };

  const duplicar = (o) => { onDuplicarOutfit(o.id); setDetalle(null); setAviso('Outfit duplicado'); };
  const eliminar = (o) => { onDeleteOutfit(o.id); setDetalle(null); setAviso('Outfit eliminado'); };
  const alternarFavorito = (o) => onUpdateOutfit(o.id, { favorito: !o.favorito });

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle sub={outfits.length ? `${outfits.length} ${outfits.length === 1 ? 'outfit' : 'outfits'}` : 'Combina tus prendas y crea tu propio estilo'}>
          <span className="flex items-center gap-2"><Layers size={18} style={{ color: accent }} /> Mis outfits</span>
        </SectionTitle>
        {outfits.length > 0 && (
          <button
            onClick={abrirNuevo}
            className="p-2.5 rounded-xl flex-shrink-0 transition-transform active:scale-90"
            style={{ background: accent }}
            aria-label="Crear outfit"
          >
            <Plus size={16} color={COLORS.textOnAccent} />
          </button>
        )}
      </div>

      {/* Apartado 20 del pulido: feedback breve, con el sistema visual de la propia app. */}
      {aviso && (
        <div className="rounded-2xl px-3 py-2 flex items-center gap-2" style={{ background: hexToRgba(accent, 0.12), border: `1px solid ${hexToRgba(accent, 0.28)}` }}>
          <Check size={14} style={{ color: accent }} strokeWidth={3} />
          <span className="text-xs font-semibold" style={{ color: COLORS.text }}>{aviso}</span>
        </div>
      )}

      {/* Apartado 27: estado vacío que invita, con el texto exacto de la especificación. */}
      {outfits.length === 0 && !formAbierto && (
        <Card>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Todavía no tienes outfits</p>
          <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>
            Combina tus prendas y guarda tus looks favoritos para tenerlos siempre preparados.
          </p>
          {prendas.length === 0 ? (
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              Antes necesitas alguna prenda en el armario: añádelas en la pestaña Prendas.
            </p>
          ) : (
            <PrimaryButton accent={accent} onClick={abrirNuevo} icon={Plus}>Crear mi primer outfit</PrimaryButton>
          )}
        </Card>
      )}

      {formAbierto && (
        <FormularioOutfit
          inicial={editando}
          prendas={prendas}
          accent={accent}
          guardando={guardando}
          errorFoto={errorFoto}
          fotoPendiente={archivoFoto ? archivoFoto.name : null}
          onFoto={setArchivoFoto}
          onGuardar={guardar}
          onCancelar={cerrarForm}
        />
      )}

      {outfits.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search size={14} style={{ color: COLORS.textMuted, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <TextInput
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                placeholder="Buscar por nombre, ocasión o prenda…"
                style={{ paddingLeft: 30, paddingRight: consulta ? 30 : undefined }}
              />
              {consulta && (
                <button
                  onClick={() => setConsulta('')}
                  className="absolute rounded-full flex items-center justify-center"
                  style={{ right: 8, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, background: COLORS.surface2 }}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={11} style={{ color: COLORS.textMuted }} />
                </button>
              )}
            </div>
            <button
              onClick={() => setVerFiltros((v) => !v)}
              className="p-2.5 rounded-xl flex-shrink-0"
              style={{ background: verFiltros ? hexToRgba(accent, 0.16) : COLORS.surface2, border: `1px solid ${verFiltros ? accent : COLORS.border}` }}
              aria-label="Filtros y orden de outfits"
              aria-expanded={verFiltros}
            >
              <SlidersHorizontal size={16} style={{ color: verFiltros ? accent : COLORS.textMuted }} />
            </button>
          </div>

          {verFiltros && (
            <Card style={{ background: COLORS.surface2 }}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ocasión">
                  <SelectInput value={filtros.ocasion || ''} onChange={(e) => setFiltros((f) => ({ ...f, ocasion: e.target.value || undefined }))}>
                    <option value="">Todas</option>
                    {OCASIONES_OUTFIT.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Estación">
                  <SelectInput value={filtros.estacion || ''} onChange={(e) => setFiltros((f) => ({ ...f, estacion: e.target.value || undefined }))}>
                    <option value="">Todas</option>
                    {ESTACIONES_OUTFIT.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </SelectInput>
                </Field>
                {/* Solo se ofrece si Josué ha escrito algún lugar: un desplegable vacío
                    es un control que no hace nada (regla 8). */}
                {lugares.length > 0 && (
                  <Field label="Lugar">
                    <SelectInput value={filtros.lugar || ''} onChange={(e) => setFiltros((f) => ({ ...f, lugar: e.target.value || undefined }))}>
                      <option value="">Todos</option>
                      {lugares.map((l) => <option key={l} value={l}>{l}</option>)}
                    </SelectInput>
                  </Field>
                )}
                {/* Apartado 22 — "outfits que utilizan el vaquero gris". */}
                {prendas.length > 0 && (
                  <Field label="Con la prenda">
                    <SelectInput value={filtros.prendaId || ''} onChange={(e) => setFiltros((f) => ({ ...f, prendaId: e.target.value || undefined }))}>
                      <option value="">Cualquiera</option>
                      {[...prendas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </SelectInput>
                  </Field>
                )}
                <Field label="Ordenar por">
                  <SelectInput value={orden} onChange={(e) => setOrden(e.target.value)}>
                    {ordenes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </SelectInput>
                </Field>
              </div>
              <button
                onClick={() => setFiltros((f) => ({ ...f, soloFavoritos: !f.soloFavoritos }))}
                className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: filtros.soloFavoritos ? accent : COLORS.textMuted }}
                aria-pressed={!!filtros.soloFavoritos}
              >
                <Star size={13} style={filtros.soloFavoritos ? { color: accent, fill: accent } : undefined} /> Solo favoritos
              </button>
            </Card>
          )}

          {visibles.length === 0 ? (
            <EmptyHint text={hayFiltros ? 'Ningún outfit coincide con lo que has buscado.' : 'Todavía no hay outfits aquí.'} />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {visibles.map((o) => (
                <TarjetaOutfit
                  key={o.id} outfit={o} prendas={prendas} accent={accent}
                  onAbrir={setDetalle}
                  onEditar={abrirEdicion}
                  onDuplicar={duplicar}
                  onFavorito={alternarFavorito}
                />
              ))}
            </div>
          )}
        </>
      )}

      {detalleVivo && (
        <DetalleOutfit
          outfit={detalleVivo} prendas={prendas} usos={usos} hoyISO={hoyISO} accent={accent}
          onCerrar={() => setDetalle(null)}
          onEditar={abrirEdicion}
          onDuplicar={duplicar}
          onEliminar={eliminar}
          onFavorito={alternarFavorito}
          onRegistrarUso={(o) => { onRegistrarUso(o); setDetalle(null); setAviso('Registrado: te lo has puesto hoy'); }}
          onAbrirPrenda={(p) => { setDetalle(null); onAbrirPrenda(p.id); }}
        />
      )}
    </div>
  );
}

/* ---------- La pantalla del Armario: dos pestañas ----------
   Apartado 2: "debe quedar claro en todo momento si el usuario está viendo sus prendas
   o sus outfits". Se usa el mismo `ToggleTab` que ya separa Mes/Agenda en el Calendario
   y las subpestañas de Productividad — nada de un sistema de navegación nuevo. */
export default function ArmarioView({
  armario, onAddPrenda, onUpdatePrenda, onDeletePrenda, onSubirFoto,
  onAddOutfit, onUpdateOutfit, onDeleteOutfit, onDuplicarOutfit,
  onAddUso, onUpdateUso, onDeleteUso, accent,
}) {
  const prendas = armario?.prendas || [];
  const outfits = armario?.outfits || [];
  const usos = armario?.usos || [];
  const [pestana, setPestana] = useState('prendas');
  const [prendaFoco, setPrendaFoco] = useState(null);
  const [outfitFoco, setOutfitFoco] = useState(null);

  // El "hoy" se calcula una vez por render y se pasa a todo el árbol: si cada "hace X
  // días" llamara a `todayISO()` por su cuenta, una sesión abierta durante el cambio de
  // día podría enseñar dos fechas distintas en la misma pantalla.
  const hoyISO = todayISO();

  // Apartado 17: desde un outfit se abre la prenda. Cambia de pestaña y deja el id;
  // `PanelPrendas` lo consume y abre su detalle.
  const abrirPrenda = (id) => { setPrendaFoco(id); setPestana('prendas'); };
  // Y al revés, desde el calendario: abrir el outfit de un uso.
  const abrirOutfit = (o) => { setOutfitFoco(o.id); setPestana('outfits'); };

  // Apartado 7: "Me lo he puesto" registra con la fecha de hoy y nada más que rellenar.
  const registrarHoy = (outfit) => onAddUso({ outfitId: outfit.id, fecha: hoyISO });

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <ToggleTab active={pestana === 'prendas'} onClick={() => setPestana('prendas')} accent={accent}>
          Prendas{prendas.length > 0 ? ` ${prendas.length}` : ''}
        </ToggleTab>
        <ToggleTab active={pestana === 'outfits'} onClick={() => setPestana('outfits')} accent={accent}>
          Outfits{outfits.length > 0 ? ` ${outfits.length}` : ''}
        </ToggleTab>
        <ToggleTab active={pestana === 'calendario'} onClick={() => setPestana('calendario')} accent={accent}>
          Calendario
        </ToggleTab>
      </div>

      {pestana === 'prendas' && (
        <PanelPrendas
          prendas={prendas} outfits={outfits} usos={usos} hoyISO={hoyISO}
          onAddPrenda={onAddPrenda} onUpdatePrenda={onUpdatePrenda} onDeletePrenda={onDeletePrenda}
          onSubirFoto={onSubirFoto} accent={accent}
          prendaFoco={prendaFoco} onFocoConsumido={() => setPrendaFoco(null)}
        />
      )}
      {pestana === 'outfits' && (
        <PanelOutfits
          outfits={outfits} prendas={prendas} usos={usos} hoyISO={hoyISO}
          onAddOutfit={onAddOutfit} onUpdateOutfit={onUpdateOutfit}
          onDeleteOutfit={onDeleteOutfit} onDuplicarOutfit={onDuplicarOutfit}
          onSubirFoto={onSubirFoto} onAbrirPrenda={abrirPrenda}
          onRegistrarUso={registrarHoy} accent={accent}
          outfitFoco={outfitFoco} onFocoConsumido={() => setOutfitFoco(null)}
        />
      )}
      {pestana === 'calendario' && (
        <PanelCalendario
          usos={usos} outfits={outfits} prendas={prendas} accent={accent} hoyISO={hoyISO}
          onAddUso={onAddUso} onUpdateUso={onUpdateUso} onDeleteUso={onDeleteUso}
          onAbrirOutfit={abrirOutfit}
        />
      )}
    </div>
  );
}

/* ---------- Pestaña CALENDARIO ----------
   Apartado 23: no es una tabla, es "¿qué me he puesto este mes?" de un vistazo. Los días
   con uso llevan la miniatura del outfit, no un punto.

   Reutiliza `celdasMes` del Calendario Universal (regla 11: nada de un segundo motor de
   calendario). Lo único propio es qué se pinta dentro de cada celda. */
export function PanelCalendario({
  usos, outfits, prendas, accent, hoyISO,
  onAddUso, onUpdateUso, onDeleteUso, onAbrirOutfit,
}) {
  const hoy = hoyISO || todayISO();
  const [ano, setAno] = useState(() => Number(hoy.slice(0, 4)));
  const [mes, setMes] = useState(() => Number(hoy.slice(5, 7)) - 1);
  const [vista, setVista] = useState('mes');
  const [diaAbierto, setDiaAbierto] = useState(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [rango, setRango] = useState('mes');
  const [filtros, setFiltros] = useState({});
  const [verFiltros, setVerFiltros] = useState(false);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 2600);
    return () => clearTimeout(t);
  }, [aviso]);

  const celdas = useMemo(() => celdasMes(ano, mes), [ano, mes]);
  const porDia = useMemo(() => usosPorDia(usos, ano, mes), [usos, ano, mes]);

  // Apartado 25 y 26: la vista de lista filtra por rango y contexto.
  const listaFiltrada = useMemo(
    () => filtrarUsos(usos, outfits, { ...filtros, desde: desdeDelRango(rango, hoy) }),
    [usos, outfits, filtros, rango, hoy],
  );
  const lugares = useMemo(() => lugaresDeUsos(usos), [usos]);
  const personas = useMemo(() => personasDeUsos(usos), [usos]);
  const resumen = useMemo(() => resumenHistorial({ usos }, hoy), [usos, hoy]);

  const irMes = (delta) => {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
  };
  const irHoy = () => { setAno(Number(hoy.slice(0, 4))); setMes(Number(hoy.slice(5, 7)) - 1); };

  const abrirNuevo = (fecha) => {
    setEditando(fecha ? { ...FORM_USO_VACIO, fecha } : null);
    setFormAbierto(true);
    setDiaAbierto(null);
  };
  const abrirEdicion = (uso) => { setEditando(uso); setFormAbierto(true); setDiaAbierto(null); };

  const guardar = (form) => {
    if (editando?.id) { onUpdateUso(editando.id, form); setAviso('Uso actualizado'); }
    else { onAddUso(form); setAviso('Uso registrado'); }
    setFormAbierto(false);
    setEditando(null);
  };
  const eliminar = (uso) => { onDeleteUso(uso.id); setAviso('Uso eliminado'); };

  const sinOutfits = outfits.length === 0;

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle sub={resumen.total ? `${resumen.total} ${resumen.total === 1 ? 'uso registrado' : 'usos registrados'} · último ${resumen.texto.toLowerCase()}` : 'Registra qué te pones y verás cuánto hace que no usas cada cosa'}>
          <span className="flex items-center gap-2"><CalendarDays size={18} style={{ color: accent }} /> Calendario</span>
        </SectionTitle>
        {!sinOutfits && (
          <button
            onClick={() => abrirNuevo(null)}
            className="p-2.5 rounded-xl flex-shrink-0 transition-transform active:scale-90"
            style={{ background: accent }}
            aria-label="Registrar uso de un outfit"
          >
            <Plus size={16} color={COLORS.textOnAccent} />
          </button>
        )}
      </div>

      {aviso && (
        <div className="rounded-2xl px-3 py-2 flex items-center gap-2" style={{ background: hexToRgba(accent, 0.12), border: `1px solid ${hexToRgba(accent, 0.28)}` }}>
          <Check size={14} style={{ color: accent }} strokeWidth={3} />
          <span className="text-xs font-semibold" style={{ color: COLORS.text }}>{aviso}</span>
        </div>
      )}

      {sinOutfits && (
        <Card>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Todavía no puedes registrar nada</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            El calendario registra outfits, no prendas sueltas. Crea un outfit en la pestaña Outfits y vuelve aquí.
          </p>
        </Card>
      )}

      {formAbierto && (
        <FormularioUso
          inicial={editando}
          outfits={outfits}
          prendas={prendas}
          accent={accent}
          onGuardar={guardar}
          onCancelar={() => { setFormAbierto(false); setEditando(null); }}
        />
      )}

      {!sinOutfits && (
        <>
          {/* Apartado 24: además del calendario, una lista cronológica. */}
          <div className="flex gap-2">
            <ToggleTab active={vista === 'mes'} onClick={() => setVista('mes')} accent={accent}>Mes</ToggleTab>
            <ToggleTab active={vista === 'lista'} onClick={() => setVista('lista')} accent={accent}>Lista</ToggleTab>
          </div>

          {vista === 'mes' ? (
            <Card style={{ padding: '0.9rem' }}>
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => irMes(-1)} className="p-1.5 rounded-lg" style={{ background: COLORS.surface2 }} aria-label="Mes anterior">
                  <ChevronLeft size={15} style={{ color: COLORS.text }} />
                </button>
                <button onClick={irHoy} className="text-sm font-semibold" style={{ color: COLORS.text }}>
                  {MESES[mes]} {ano}
                </button>
                <button onClick={() => irMes(1)} className="p-1.5 rounded-lg" style={{ background: COLORS.surface2 }} aria-label="Mes siguiente">
                  <ChevronRight size={15} style={{ color: COLORS.text }} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {DIAS_SEMANA.map((d, i) => (
                  <span key={i} className="text-[10px] font-semibold text-center" style={{ color: COLORS.textMuted }}>{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {celdas.map((c, i) => {
                  if (!c) return <span key={`h${i}`} />;
                  const delDia = porDia[c.fecha] || [];
                  const esHoy = c.fecha === hoy;
                  const primero = delDia[0] && outfits.find((o) => o.id === delDia[0].outfitId);
                  const suyas = primero ? prendasDeOutfit(primero, prendas) : [];
                  return (
                    <button
                      key={c.fecha}
                      onClick={() => (delDia.length ? setDiaAbierto(c.fecha) : abrirNuevo(c.fecha))}
                      className="rounded-lg overflow-hidden relative transition-transform active:scale-90"
                      style={{
                        aspectRatio: '1',
                        background: delDia.length ? COLORS.surface2 : 'transparent',
                        border: `1px solid ${esHoy ? accent : delDia.length ? COLORS.border : 'transparent'}`,
                      }}
                      aria-label={delDia.length
                        ? `${c.dia} de ${MESES[mes]}, ${delDia.length} ${delDia.length === 1 ? 'outfit registrado' : 'outfits registrados'}`
                        : `${c.dia} de ${MESES[mes]}, registrar un outfit`}
                    >
                      {/* Apartado 23: la miniatura del outfit, no un punto. */}
                      {suyas.length > 0 && (
                        <span className="absolute inset-0" style={{ opacity: 0.55 }}>
                          <MiniaturaPrenda prenda={suyas[0]} alto={999} />
                        </span>
                      )}
                      <span
                        className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold"
                        style={{ color: delDia.length ? COLORS.text : COLORS.textMuted, textShadow: suyas.length ? `0 1px 3px ${COLORS.bg}` : 'none' }}
                      >
                        {c.dia}
                      </span>
                      {/* Apartado 5: varios outfits el mismo día. */}
                      {delDia.length > 1 && (
                        <span
                          className="absolute rounded-full text-[9px] font-bold flex items-center justify-center"
                          style={{ bottom: 2, right: 2, width: 12, height: 12, background: accent, color: COLORS.textOnAccent }}
                        >
                          {delDia.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <SelectInput value={rango} onChange={(e) => setRango(e.target.value)}>
                    {RANGOS_HISTORIAL.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </SelectInput>
                </div>
                <button
                  onClick={() => setVerFiltros((v) => !v)}
                  className="p-2.5 rounded-xl flex-shrink-0"
                  style={{ background: verFiltros ? hexToRgba(accent, 0.16) : COLORS.surface2, border: `1px solid ${verFiltros ? accent : COLORS.border}` }}
                  aria-label="Filtros del historial"
                  aria-expanded={verFiltros}
                >
                  <SlidersHorizontal size={16} style={{ color: verFiltros ? accent : COLORS.textMuted }} />
                </button>
              </div>

              {verFiltros && (
                <Card style={{ background: COLORS.surface2 }}>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Outfit">
                      <SelectInput value={filtros.outfitId || ''} onChange={(e) => setFiltros((f) => ({ ...f, outfitId: e.target.value || undefined }))}>
                        <option value="">Todos</option>
                        {[...outfits].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                      </SelectInput>
                    </Field>
                    {/* Apartado 25: "todos los usos del vaquero gris". */}
                    {prendas.length > 0 && (
                      <Field label="Prenda">
                        <SelectInput value={filtros.prendaId || ''} onChange={(e) => setFiltros((f) => ({ ...f, prendaId: e.target.value || undefined }))}>
                          <option value="">Todas</option>
                          {[...prendas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </SelectInput>
                      </Field>
                    )}
                    <Field label="Ocasión">
                      <SelectInput value={filtros.evento || ''} onChange={(e) => setFiltros((f) => ({ ...f, evento: e.target.value || undefined }))}>
                        <option value="">Todas</option>
                        {EVENTOS_USO.map((ev) => <option key={ev.id} value={ev.id}>{ev.label}</option>)}
                      </SelectInput>
                    </Field>
                    {lugares.length > 0 && (
                      <Field label="Lugar">
                        <SelectInput value={filtros.lugar || ''} onChange={(e) => setFiltros((f) => ({ ...f, lugar: e.target.value || undefined }))}>
                          <option value="">Todos</option>
                          {lugares.map((l) => <option key={l} value={l}>{l}</option>)}
                        </SelectInput>
                      </Field>
                    )}
                    {personas.length > 0 && (
                      <Field label="Con">
                        <SelectInput value={filtros.persona || ''} onChange={(e) => setFiltros((f) => ({ ...f, persona: e.target.value || undefined }))}>
                          <option value="">Cualquiera</option>
                          {personas.map((x) => <option key={x} value={x}>{x}</option>)}
                        </SelectInput>
                      </Field>
                    )}
                  </div>
                </Card>
              )}

              {listaFiltrada.length === 0 ? (
                <EmptyHint text={usos.length === 0 ? 'Todavía no has registrado ningún uso.' : 'Ningún uso coincide con lo que has filtrado.'} />
              ) : (
                <div className="space-y-2">
                  {listaFiltrada.slice(0, 60).map((u) => (
                    <FilaUso
                      key={u.id} uso={u} outfits={outfits} prendas={prendas} accent={accent}
                      onAbrirOutfit={onAbrirOutfit}
                      onEditar={abrirEdicion}
                      onEliminar={eliminar}
                    />
                  ))}
                  {listaFiltrada.length > 60 && (
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>
                      Se muestran los 60 más recientes de {listaFiltrada.length}. Acota el rango o filtra para ver el resto.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Apartado 19 — detalle de un día */}
      {diaAbierto && (
        <DetalleDia
          fecha={diaAbierto}
          usos={usosDelDia(usos, diaAbierto)}
          outfits={outfits} prendas={prendas} accent={accent}
          onCerrar={() => setDiaAbierto(null)}
          onAnadir={() => abrirNuevo(diaAbierto)}
          onAbrirOutfit={(o) => { setDiaAbierto(null); onAbrirOutfit(o); }}
          onEditar={abrirEdicion}
          onEliminar={eliminar}
        />
      )}
    </div>
  );
}

/* Detalle de un día (apartado 19). */
function DetalleDia({ fecha, usos, outfits, prendas, accent, onCerrar, onAnadir, onAbrirOutfit, onEditar, onEliminar }) {
  const legible = new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 pb-3 sm:pb-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCerrar}>
      <div
        className="w-full max-w-md rounded-3xl p-4"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, maxHeight: '86vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="text-lg font-bold capitalize" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{legible}</p>
          <button onClick={onCerrar} className="rounded-full p-1.5 flex-shrink-0" style={{ background: COLORS.surface2 }} aria-label="Cerrar el día">
            <X size={14} style={{ color: COLORS.text }} />
          </button>
        </div>

        <div className="space-y-2">
          {usos.map((u) => (
            <FilaUso
              key={u.id} uso={u} outfits={outfits} prendas={prendas} accent={accent}
              mostrarFecha={false}
              onAbrirOutfit={onAbrirOutfit}
              onEditar={onEditar}
              onEliminar={onEliminar}
            />
          ))}
        </div>

        <button onClick={onAnadir} className="flex items-center gap-1.5 text-xs font-semibold mt-3" style={{ color: accent }}>
          <Plus size={13} /> Añadir otro outfit a este día
        </button>
      </div>
    </div>,
    document.body,
  );
}
