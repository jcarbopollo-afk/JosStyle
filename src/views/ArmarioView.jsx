import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shirt, Plus, Search, X, SlidersHorizontal, Star, Camera, Pencil, ChevronDown, ChevronUp, Loader2, Copy, Check, Layers } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import { getSignedPrendaUrl } from '../lib/supabase';
import {
  CATEGORIAS_ARMARIO, COLORES_ARMARIO, ESTADOS_PRENDA, TEMPORADAS_PRENDA,
  prendasVisibles, marcasDe, conteoPorCategoria, ordenesDisponibles,
  categoriaDe, colorDe, estadoDe,
  ZONAS_OUTFIT, OCASIONES_OUTFIT, ESTACIONES_OUTFIT, zonaDeCategoria,
  outfitsVisibles, ordenesOutfitsDisponibles, lugaresDe, prendasDeOutfit,
  composicionPorZonas, outfitsConPrenda,
} from '../lib/armario';
import {
  Card, SectionTitle, Field, TextInput, Textarea, PrimaryButton, GhostBtn, EmptyHint, SelectInput, ToggleTab,
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
function DetallePrenda({ prenda, accent, onCerrar, onEditar, onEliminar }) {
  const [confirmando, setConfirmando] = useState(false);
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

            <div className="flex gap-2 mt-4">
              <PrimaryButton accent={accent} onClick={() => onEditar(prenda)} icon={Pencil}>Editar</PrimaryButton>
            </div>

            {confirmando ? (
              <div className="mt-3 rounded-2xl p-3" style={{ background: COLORS.surface2 }}>
                <p className="text-xs mb-2" style={{ color: COLORS.text }}>
                  {prenda.fotoPath
                    ? 'Se eliminará la prenda y su fotografía. La foto no se puede recuperar.'
                    : '¿Eliminar esta prenda? Podrás recuperarla desde Eliminados recientemente.'}
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
function ComposicionOutfit({ outfit, prendas, accent, onPulsarPrenda }) {
  const grupos = composicionPorZonas(outfit, prendas);
  if (grupos.length === 0) {
    return <EmptyHint text="Este outfit todavía no tiene prendas." />;
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
    </div>
  );
}

/* Tarjeta de outfit: un mosaico con las cuatro primeras prendas. Si el outfit tiene
   foto propia, manda ella (apartado 9). */
function TarjetaOutfit({ outfit, prendas, accent, onAbrir }) {
  const suyas = prendasDeOutfit(outfit, prendas);
  const ocasion = OCASIONES_OUTFIT.find((o) => o.id === outfit.ocasion);
  return (
    <button
      onClick={() => onAbrir(outfit)}
      className="text-left rounded-2xl overflow-hidden transition-transform active:scale-[0.97]"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <div className="relative">
        {outfit.fotoPath ? (
          <MiniaturaPrenda prenda={{ fotoPath: outfit.fotoPath, nombre: outfit.nombre, color: 'otro', categoria: 'otros' }} alto={112} />
        ) : suyas.length === 0 ? (
          <div className="w-full flex items-center justify-center" style={{ height: 112, background: COLORS.surface2 }}>
            <Layers size={20} style={{ color: COLORS.textMuted }} />
          </div>
        ) : (
          /* Mosaico de hasta 4 prendas. Con una sola, ocupa el ancho entero en vez de
             dejar tres huecos vacíos. */
          <div className="grid" style={{ height: 112, gridTemplateColumns: suyas.length === 1 ? '1fr' : '1fr 1fr', gap: 1, background: COLORS.border }}>
            {suyas.slice(0, 4).map((p) => (
              <MiniaturaPrenda key={p.id} prenda={p} alto={suyas.length <= 2 ? 112 : 55.5} />
            ))}
          </div>
        )}
        {outfit.favorito && (
          <span className="absolute rounded-full p-1" style={{ top: 6, right: 6, background: hexToRgba(COLORS.bg, 0.65) }}>
            <Star size={11} style={{ color: accent, fill: accent }} />
          </span>
        )}
      </div>
      <div className="px-2.5 py-2">
        <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{outfit.nombre || 'Sin nombre'}</p>
        <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
          {suyas.length} {suyas.length === 1 ? 'prenda' : 'prendas'}{ocasion ? ` · ${ocasion.label}` : ''}
        </p>
      </div>
    </button>
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
function DetalleOutfit({ outfit, prendas, accent, onCerrar, onEditar, onDuplicar, onEliminar, onAbrirPrenda }) {
  const [confirmando, setConfirmando] = useState(false);
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
              <p className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
                <span className="truncate">{outfit.nombre || 'Sin nombre'}</span>
                {outfit.favorito && <Star size={15} style={{ color: accent, fill: accent, flexShrink: 0 }} />}
              </p>
            </div>
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

            <ComposicionOutfit outfit={outfit} prendas={prendas} accent={accent} onPulsarPrenda={onAbrirPrenda} />

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

export default function ArmarioView({ armario, onAddPrenda, onUpdatePrenda, onDeletePrenda, onSubirFoto, accent }) {
  const prendas = armario?.prendas || [];
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
  const ordenes = useMemo(() => ordenesDisponibles(prendas), [prendas]);
  const visibles = useMemo(
    () => prendasVisibles(prendas, { consulta, filtros, orden }),
    [prendas, consulta, filtros, orden],
  );

  // Si el orden elegido deja de estar disponible (porque se ha borrado el último uso
  // registrado), se vuelve al de por defecto en vez de dejar una lista sin ordenar.
  useEffect(() => {
    if (!ordenes.some((o) => o.id === orden)) setOrden('recientes');
  }, [ordenes, orden]);

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
          prenda={detalle} accent={accent}
          onCerrar={() => setDetalle(null)}
          onEditar={abrirEdicion}
          onEliminar={eliminar}
        />
      )}
    </div>
  );
}
