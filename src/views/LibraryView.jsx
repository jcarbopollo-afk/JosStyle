import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, FileText, Video as VideoIcon, Image as ImageIcon, StickyNote, Link as LinkIcon,
  Trash2, ExternalLink, ChevronDown, ChevronUp, Upload, ArrowLeft, Plus, Pencil, Star, Archive,
  BookMarked, Bookmark, Lightbulb, FolderOpen,
} from 'lucide-react';
import { COLORS, TIPOS_ARCHIVO_BIBLIOTECA } from '../tokens';
import { uid, todayISO, formatFecha } from '../lib/helpers';
import { getSignedBibliotecaUrl } from '../lib/supabase';
import {
  MINI_APPS, miniApp, elementosDe, indicadorDe, diferenciaDe,
  crearIdea, crearColeccion, CLASE_TARJETA, retrasoDeTarjeta,
} from '../lib/biblioteca';
/* BL F2 — Libros tiene su propia librería. `crearLibro` y `normalizarLibro`
   vivían en `biblioteca.js` desde la F1 y se mudaron aquí al desarrollarla:
   una sola fábrica, no dos. */
import {
  TIPOS_GUARDADO, tipoGuardado, dominioDe, faviconDe, nombreDe,
  crearGuardado, editarGuardado, alternarFavorito, archivar, desarchivar,
  FILTROS_GUARDADOS, ORDENES_GUARDADOS, ORDEN_POR_DEFECTO,
  filtrarGuardados, ordenarGuardados, resumenGuardados, DIFERENCIA_CON_NOTAS,
} from '../lib/guardados';
import {
  ESTADOS_LIBRO, estadoLibro, ESTADO_POR_DEFECTO, crearLibro, editarLibro,
  progresoDe, actualizarPagina, cambiarEstado, marcarTerminado,
  lineaResumen, libroActual, FILTROS_LIBROS, ORDENES_LIBROS,
  filtrarLibros, ordenarLibros, estadisticasLectura, historialLectura,
  tituloDeLibroValido, revisarPortada, inicialesDe,
} from '../lib/libros';
import { Card, SectionTitle, Field, TextInput, Textarea, Select, PrimaryButton, GhostBtn, EmptyHint, BotonBorrar, BotonBorrarDefinitivo } from '../components/ui';

// Fase 11 — Biblioteca: PDFs, vídeos, fotos, apuntes y enlaces conviven en un único listado
// buscable. Los tres tipos de archivo comparten forma { id, tipo, path, titulo, fecha } +
// textoExtraido solo en los PDF; apuntes y enlaces son texto puro sin archivo.
//
// 🚨 E3 F16 (BL F1) — esa lista única pasa a ser **seis mini-apps**, pero los datos
// son exactamente los mismos: los apuntes son las Notas, los enlaces son los
// Guardados y los archivos son los Documentos. Ni una colección nueva para ellos.
const FILTROS = [
  { id: 'pdf', label: 'PDFs' },
  { id: 'video', label: 'Vídeos' },
  { id: 'foto', label: 'Fotos' },
];

const ICONOS = { pdf: FileText, video: VideoIcon, foto: ImageIcon, apunte: StickyNote, enlace: LinkIcon };

/* ⚠️ **La otra mitad del catálogo.** `MINI_APPS` es datos —una línea por
   mini-app— y esto son **componentes de React**, exactamente el mismo reparto
   que `CATEGORIAS_ARMARIO` / `ICONOS_CATEGORIA` en el Armario (AR F1 / E3 F3).
   Al añadir una mini-app hay que añadir su línea en los dos sitios; hay una
   prueba que compara las dos listas, porque un icono que falta aquí sale como
   un hueco y no falla en ninguna parte. */
const ICONOS_MINI_APP = {
  BookMarked, StickyNote, Bookmark, Lightbulb, FileText, FolderOpen,
};

function FiltroPill({ children, active, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap flex-shrink-0"
      style={active
        ? { background: accent, color: COLORS.textOnAccent }
        : { background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
    >
      {children}
    </button>
  );
}

// Devuelve un fragmento de texto alrededor de la primera coincidencia de la búsqueda,
// para que el resultado de un PDF muestre dónde aparece lo buscado, no solo el título.
function snippet(texto, query) {
  if (!texto || !query) return '';
  const idx = texto.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return '';
  const start = Math.max(0, idx - 35);
  const end = Math.min(texto.length, idx + query.length + 35);
  return (start > 0 ? '…' : '') + texto.slice(start, end).trim() + (end < texto.length ? '…' : '');
}

function ItemCard({ item, query, url, accent, onDelete }) {
  const [abierto, setAbierto] = useState(false);
  const Icon = ICONOS[item._tipo];
  const esApunte = item._tipo === 'apunte';
  const esArchivo = item._tipo === 'pdf' || item._tipo === 'video' || item._tipo === 'foto';
  const trozo = item._tipo === 'pdf' ? snippet(item.textoExtraido, query) : '';

  return (
    <Card style={{ padding: '1rem' }}>
      <div className="flex items-start gap-3">
        {item._tipo === 'foto' && url ? (
          <img src={url} alt={item.titulo} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: COLORS.surface2 }}>
            <Icon size={16} style={{ color: accent }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{item.titulo}</p>
            <p className="text-[11px] flex-shrink-0" style={{ color: COLORS.textMuted }}>{formatFecha(item.fecha)}</p>
          </div>

          {item._tipo === 'enlace' && (
            <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.textMuted }}>{item.url}</p>
          )}
          {item._tipo === 'pdf' && !item.textoExtraido && (
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>PDF sin texto extraíble (probablemente escaneado) — buscable solo por título.</p>
          )}
          {trozo && <p className="text-xs mt-0.5 leading-relaxed" style={{ color: COLORS.textMuted }}>…{trozo}…</p>}
          {esApunte && !abierto && item.contenido && (
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{item.contenido.slice(0, 60)}{item.contenido.length > 60 ? '…' : ''}</p>
          )}

          <div className="flex items-center gap-3 mt-2">
            {esArchivo && url && (
              <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold" style={{ color: accent }}>
                <ExternalLink size={12} /> Abrir
              </a>
            )}
            {item._tipo === 'enlace' && (
              <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold" style={{ color: accent }}>
                <ExternalLink size={12} /> Abrir enlace
              </a>
            )}
            {esApunte && (item.contenido?.length > 60) && (
              <button onClick={() => setAbierto(!abierto)} className="flex items-center gap-1 text-xs font-semibold" style={{ color: accent }}>
                {abierto ? <>Ocultar <ChevronUp size={12} /></> : <>Ver completo <ChevronDown size={12} /></>}
              </button>
            )}
            {/* Entrega 3 · F1, apartado 3 — un apunte y un enlace van a Eliminados recientemente
                y vuelven de ahí, así que no se pregunta nada. Un ARCHIVO (PDF, vídeo, foto) se
                borra de verdad del almacenamiento y no puede ir a la papelera: ahí sí. */}
            {esArchivo ? (
              <BotonBorrarDefinitivo
                onConfirm={onDelete}
                label="Eliminar archivo"
                titulo="¿Eliminar este archivo?"
                detalle="El archivo se borra del todo y no se puede recuperar."
                className="flex items-center gap-1 text-xs"
                style={{ color: COLORS.textMuted }}
              >
                <><Trash2 size={12} /> Eliminar</>
              </BotonBorrarDefinitivo>
            ) : (
              <button onClick={onDelete} className="flex items-center gap-1 text-xs" style={{ color: COLORS.textMuted }}>
                <Trash2 size={12} /> Eliminar
              </button>
            )}
          </div>

          {esApunte && abierto && (
            <p className="text-sm mt-2 leading-relaxed whitespace-pre-wrap" style={{ color: COLORS.text }}>{item.contenido}</p>
          )}
          {item._tipo === 'enlace' && item.descripcion && (
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{item.descripcion}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function AnadirArchivo({ tipo, onAdd, accent }) {
  const [titulo, setTitulo] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const meta = TIPOS_ARCHIVO_BIBLIOTECA.find((t) => t.id === tipo);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSubiendo(true);
    try {
      await onAdd(tipo, file, titulo.trim() || file.name);
      setTitulo('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <Card>
      <Field label="Título (opcional — si lo dejas vacío se usa el nombre del archivo)">
        <TextInput value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={`Ej: Apuntes de Biología — Tema 3`} />
      </Field>
      <label className="block">
        <div
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold w-full cursor-pointer"
          style={{ background: accent, color: COLORS.textOnAccent, opacity: subiendo ? 0.6 : 1 }}
        >
          <Upload size={16} strokeWidth={2.5} />
          {subiendo ? (tipo === 'pdf' ? 'Subiendo y leyendo el PDF…' : 'Subiendo…') : `Subir ${meta.label.toLowerCase()}`}
        </div>
        <input type="file" accept={meta.accept} onChange={handleFile} disabled={subiendo} className="hidden" />
      </label>
    </Card>
  );
}

/* 🚨 **La nota rápida** (BL F1, criterio de éxito 10).
   *"Debe ser extremadamente rápida… simplemente entra, escribe y guarda. NO
   obligar a: categoría, etiquetas, tipo, proyecto, fecha. Puede existir un
   título opcional, pero el contenido debe poder guardarse directamente."*

   Por eso **el texto va primero y el título después**, marcado como opcional:
   el formulario anterior pedía el título arriba, que es justo lo que el
   enunciado llama *"un formulario burocrático"*.

   ⚠️ Guarda en `biblioteca.apuntes`, la lista de la Fase 11. Una nota **es** un
   apunte: crear una segunda lista habría dejado los suyos invisibles. */
export function AnadirNotaRapida({ onAdd, accent }) {
  const [form, setForm] = useState({ titulo: '', contenido: '' });
  const puedeGuardar = Boolean(form.titulo.trim() || form.contenido.trim());
  const guardar = () => {
    if (!puedeGuardar) return;
    onAdd({ id: uid(), fecha: todayISO(), titulo: form.titulo.trim() || 'Sin título', contenido: form.contenido });
    setForm({ titulo: '', contenido: '' });
  };
  return (
    <Card>
      <Textarea
        rows={6}
        value={form.contenido}
        onChange={(e) => setForm({ ...form, contenido: e.target.value })}
        placeholder="Escribe o pega lo que quieras…"
        aria-label="Contenido de la nota"
      />
      <div className="mt-2">
        <Field label="Título (opcional)">
          <TextInput value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Sin título" />
        </Field>
      </div>
      <PrimaryButton accent={accent} disabled={!puedeGuardar} onClick={guardar}>Guardar nota</PrimaryButton>
    </Card>
  );
}

/* Los formularios de las tres listas nuevas. **Mínimos a propósito**: lo que
   hace falta para que el botón de crear escriba algo de verdad (regla 8). El
   modelo completo de cada una llega en su fase — BL F2, F5 y F7. */
export function AnadirIdea({ onAdd, accent }) {
  const [form, setForm] = useState({ titulo: '', detalle: '' });
  const idea = crearIdea(form);
  return (
    <Card>
      <Field label="La idea">
        <TextInput aria-label="La idea" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Crear una app que automatice X" />
      </Field>
      <Field label="Desarróllala un poco (opcional)">
        <Textarea rows={3} value={form.detalle} onChange={(e) => setForm({ ...form, detalle: e.target.value })} />
      </Field>
      <PrimaryButton accent={accent} disabled={!idea} onClick={() => { onAdd(crearIdea(form)); setForm({ titulo: '', detalle: '' }); }}>
        Guardar idea
      </PrimaryButton>
    </Card>
  );
}

export function AnadirColeccion({ onAdd, accent }) {
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const coleccion = crearColeccion(form);
  return (
    <Card>
      <Field label="Nombre de la colección">
        <TextInput aria-label="Nombre de la colección" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Aprender programación" />
      </Field>
      <Field label="Descripción (opcional)">
        <TextInput value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      </Field>
      <PrimaryButton accent={accent} disabled={!coleccion} onClick={() => { onAdd(crearColeccion(form)); setForm({ nombre: '', descripcion: '' }); }}>
        Crear colección
      </PrimaryButton>
    </Card>
  );
}

/* Una ficha de libro, idea o colección. Sin acciones que todavía no existen:
   *"una ficha solo ofrece las acciones que le sirven"* (EH F61). */
export function FichaSimple({ titulo, sub, fecha, onDelete }) {
  return (
    <Card style={{ padding: '0.85rem 1rem' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{titulo}</p>
          {sub ? <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{sub}</p> : null}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{formatFecha(fecha)}</p>
          <BotonBorrar onClick={onDelete} />
        </div>
      </div>
    </Card>
  );
}

/* La plaquita del lanzador. *"Icono grande, nombre, descripción muy corta,
   posible indicador de contenido, microanimación y feedback al tocar."*

   ⚠️ La cascada de entrada es `.hub-card`, la que ya usan los hubs desde la
   Fase N2 — escribir una segunda se vería distinta. Y el feedback al tocar sale
   de `active:scale-[0.97]`, la misma escalera de `ui.jsx` (EH F50). */
export function TarjetaMiniApp({ app, indicador, accent, indice, onAbrir }) {
  const Icono = ICONOS_MINI_APP[app.icono];
  return (
    <button
      onClick={onAbrir}
      className={`${CLASE_TARJETA} text-left rounded-2xl p-4 w-full transition-transform active:scale-[0.97] toque-44`}
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        animationDelay: retrasoDeTarjeta(indice),
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{ background: COLORS.surface2 }}
      >
        {Icono ? <Icono size={22} style={{ color: accent }} strokeWidth={2} /> : null}
      </div>
      <p className="text-sm font-bold" style={{ color: COLORS.text }}>{app.nombre}</p>
      <p className="text-[11px] mt-0.5 leading-snug" style={{ color: COLORS.textMuted }}>{app.descripcion}</p>
      {indicador ? (
        <p className="text-[11px] mt-2 font-semibold" style={{ color: accent }}>{indicador}</p>
      ) : null}
    </button>
  );
}

/* ── Cabecera de una mini-app ──────────────────────────────────────────────
   *"Cada mini-app debe tener: título, botón volver, botón de crear contenido,
   estado vacío."* Los cuatro, y en el mismo sitio para las seis. */
export function CabeceraMiniApp({ app, accent, abierto, onVolver, onToggleCrear }) {
  const Icono = ICONOS_MINI_APP[app.icono];
  return (
    <div className="flex items-center gap-2">
      <button onClick={onVolver} className="p-1.5 -m-1.5" aria-label="Volver a la biblioteca">
        <ArrowLeft size={18} style={{ color: COLORS.textMuted }} />
      </button>
      {Icono ? <Icono size={18} style={{ color: accent }} /> : null}
      <p className="text-base font-bold flex-1" style={{ color: COLORS.text }}>{app.nombre}</p>
      <button
        onClick={onToggleCrear}
        className="rounded-full p-2 -m-0.5 transition-transform active:scale-90"
        style={{ background: abierto ? COLORS.surface2 : accent }}
        aria-label={abierto ? `Cerrar el formulario de ${app.nombre.toLowerCase()}` : `Añadir en ${app.nombre}`}
      >
        <Plus
          size={16}
          strokeWidth={2.5}
          style={{
            color: abierto ? COLORS.textMuted : COLORS.textOnAccent,
            transform: abierto ? 'rotate(45deg)' : 'none',
            transition: 'transform 180ms var(--ease-premium)',
          }}
        />
      </button>
    </div>
  );
}

/* El estado vacío del enunciado: título, frase y la salida.
   *"No dejar pantallas vacías sin contexto."* */
export function VacioMiniApp({ app, accent, onCrear }) {
  return (
    <Card style={{ padding: '1.75rem 1.25rem', textAlign: 'center' }}>
      <p className="text-sm font-bold" style={{ color: COLORS.text }}>{app.vacio.titulo}</p>
      <p className="text-xs mt-1 mb-4 leading-relaxed" style={{ color: COLORS.textMuted }}>{app.vacio.frase}</p>
      <PrimaryButton accent={accent} icon={Plus} onClick={onCrear}>{app.vacio.boton}</PrimaryButton>
    </Card>
  );
}

export default function LibraryView({
  biblioteca, archivos,
  onAddArchivo, onDeleteArchivo,
  onAddApunte, onDeleteApunte,
  onAddEnlace, onDeleteEnlace, onUpdateEnlace,
  onAddLibro, onDeleteLibro, onUpdateLibro, onSubirPortada, onBorrarPortada,
  onAddIdea, onDeleteIdea,
  onAddColeccion, onDeleteColeccion,
  accent,
}) {
  // `null` = el lanzador. El enunciado quiere que **lo primero** que se vea sean
  // las seis mini-apps, no una lista ni una parrafada (criterio 14).
  const [abierta, setAbierta] = useState(null);
  const [crear, setCrear] = useState(false);
  const [query, setQuery] = useState('');
  const [tipoArchivo, setTipoArchivo] = useState('pdf');
  const [filtro, setFiltro] = useState('todos');
  const [urls, setUrls] = useState({});

  const datos = { biblioteca, archivos };
  const conArchivo = archivos.filter((a) => a.tipo === 'foto' || a.tipo === 'pdf' || a.tipo === 'video');

  // ⚠️ Va ANTES de cualquier `return` condicional (regla 4): un hook detrás de un
  // `return` tumba la aplicación entera con "Rendered more hooks than during the
  // previous render", y a este proyecto ya le pasó.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(conArchivo.map(async (a) => [a.id, await getSignedBibliotecaUrl(a.path)]));
      if (!cancelled) setUrls(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archivos]);

  const volver = () => { setAbierta(null); setCrear(false); setQuery(''); setFiltro('todos'); };
  const abrir = (id) => { setAbierta(id); setCrear(false); setQuery(''); setFiltro('todos'); };

  // ── El lanzador ─────────────────────────────────────────────────────────
  if (!abierta) {
    return (
      <div className="space-y-4 pb-4">
        <SectionTitle>Biblioteca</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {MINI_APPS.map((app, i) => (
            <TarjetaMiniApp
              key={app.id}
              app={app}
              indice={i}
              indicador={indicadorDe(app.id, datos)}
              accent={accent}
              onAbrir={() => abrir(app.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  const app = miniApp(abierta);
  const elementos = elementosDe(abierta, datos);
  const q = query.trim().toLowerCase();
  const coincide = (textos) => !q || textos.filter(Boolean).join(' ').toLowerCase().includes(q);

  // Un buscador dentro de la mini-app solo cuando hay bastante que buscar: con
  // tres elementos, una caja de búsqueda es ruido.
  /* ⚠️ Libros tiene su propio buscador dentro de su pantalla (BL F2), con sus
     filtros y su orden al lado: dos cajas de búsqueda en la misma pantalla
     serían dos formas de hacer lo mismo. */
  const conBuscador = !['libros', 'guardados'].includes(abierta) && elementos.length >= 5;

  const cabecera = (
    <>
      <CabeceraMiniApp
        app={app}
        accent={accent}
        abierto={crear}
        onVolver={volver}
        onToggleCrear={() => setCrear(!crear)}
      />
      {/* ⚠️ La diferencia con su vecina, dicha en la pantalla: el enunciado dedica
          tres apartados a que las seis sean *"claramente diferenciables"*. */}
      {diferenciaDe(abierta).map((frase) => (
        <p key={frase} className="text-[11px] leading-snug" style={{ color: COLORS.textMuted }}>{frase}</p>
      ))}
      {conBuscador && (
        <div className="relative">
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar en ${app.nombre.toLowerCase()}…`}
            style={{ paddingLeft: 34 }}
            aria-label={`Buscar en ${app.nombre.toLowerCase()}`}
          />
        </div>
      )}
    </>
  );

  const vacio = <VacioMiniApp app={app} accent={accent} onCrear={() => setCrear(true)} />;
  const nadaCoincide = <EmptyHint text="Nada coincide con esta búsqueda." />;

  // ── Notas ───────────────────────────────────────────────────────────────
  if (abierta === 'notas') {
    const lista = elementos.filter((a) => coincide([a.titulo, a.contenido]));
    return (
      <div className="space-y-3 pb-4">
        {cabecera}
        {crear && <AnadirNotaRapida onAdd={(n) => { onAddApunte(n); setCrear(false); }} accent={accent} />}
        {elementos.length === 0 ? vacio : lista.length === 0 ? nadaCoincide : (
          <div className="space-y-2">
            {lista.map((a) => (
              <ItemCard key={a.id} item={{ ...a, _tipo: 'apunte' }} query={q} accent={accent} onDelete={() => onDeleteApunte(a.id)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Guardados ───────────────────────────────────────────────────────────
  if (abierta === 'guardados') {
    /* 🚨 BL F4 — Guardados tiene pantalla propia: tipos, favoritos, archivar,
       búsqueda por seis campos, filtros, orden y detalle. La cabecera, el ＋ y el
       estado vacío siguen siendo los del lanzador (BL F1). */
    return (
      <PantallaGuardados
        guardados={elementos}
        cabecera={cabecera}
        crear={crear}
        onCerrarCrear={() => setCrear(false)}
        vacio={vacio}
        accent={accent}
        onAdd={onAddEnlace}
        onUpdate={onUpdateEnlace}
        onDelete={onDeleteEnlace}
      />
    );
  }

  // ── Documentos ──────────────────────────────────────────────────────────
  if (abierta === 'documentos') {
    const lista = elementos
      .filter((a) => filtro === 'todos' || a.tipo === filtro)
      .filter((a) => coincide([a.titulo, a.textoExtraido]))
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    return (
      <div className="space-y-3 pb-4">
        {cabecera}
        {crear && (
          <>
            <Card>
              <Field label="Qué vas a subir">
                <Select value={tipoArchivo} onChange={(e) => setTipoArchivo(e.target.value)}>
                  <option value="pdf">PDF</option>
                  <option value="video">Vídeo</option>
                  <option value="foto">Foto</option>
                </Select>
              </Field>
            </Card>
            <AnadirArchivo tipo={tipoArchivo} onAdd={onAddArchivo} accent={accent} />
          </>
        )}
        {elementos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <FiltroPill active={filtro === 'todos'} onClick={() => setFiltro('todos')} accent={accent}>Todos</FiltroPill>
            {FILTROS.map((f) => (
              <FiltroPill key={f.id} active={filtro === f.id} onClick={() => setFiltro(f.id)} accent={accent}>{f.label}</FiltroPill>
            ))}
          </div>
        )}
        {elementos.length === 0 ? vacio : lista.length === 0 ? nadaCoincide : (
          <div className="space-y-2">
            {lista.map((a) => (
              <ItemCard key={a.id} item={{ ...a, _tipo: a.tipo }} query={q} url={urls[a.id]} accent={accent} onDelete={() => onDeleteArchivo(a.id, a.path)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Libros ──────────────────────────────────────────────────────────────
  if (abierta === 'libros') {
    /* 🚨 BL F2 — Libros tiene pantalla propia: resumen, "continuar leyendo",
       filtros, orden, tarjetas con portada y detalle. La cabecera, el ＋ y el
       estado vacío siguen siendo los del lanzador (BL F1), no unos nuevos. */
    return (
      <PantallaLibros
        app={app}
        libros={elementos}
        cabecera={cabecera}
        crear={crear}
        onCerrarCrear={() => setCrear(false)}
        onAbrirCrear={() => setCrear(true)}
        vacio={vacio}
        accent={accent}
        onAdd={onAddLibro}
        onUpdate={onUpdateLibro}
        onDelete={onDeleteLibro}
        onSubirPortada={onSubirPortada}
        onBorrarPortada={onBorrarPortada}
      />
    );
  }

  // ── Ideas ───────────────────────────────────────────────────────────────
  if (abierta === 'ideas') {
    const lista = elementos.filter((i) => coincide([i.titulo, i.detalle]));
    return (
      <div className="space-y-3 pb-4">
        {cabecera}
        {crear && <AnadirIdea onAdd={(i) => { onAddIdea(i); setCrear(false); }} accent={accent} />}
        {elementos.length === 0 ? vacio : lista.length === 0 ? nadaCoincide : (
          <div className="space-y-2">
            {lista.map((i) => (
              <FichaSimple key={i.id} titulo={i.titulo} sub={i.detalle} fecha={i.fecha} onDelete={() => onDeleteIdea(i.id)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Colecciones ─────────────────────────────────────────────────────────
  const lista = elementos.filter((c) => coincide([c.nombre, c.descripcion]));
  return (
    <div className="space-y-3 pb-4">
      {cabecera}
      {crear && <AnadirColeccion onAdd={(c) => { onAddColeccion(c); setCrear(false); }} accent={accent} />}
      {elementos.length === 0 ? vacio : lista.length === 0 ? nadaCoincide : (
        <div className="space-y-2">
          {lista.map((c) => (
            <FichaSimple key={c.id} titulo={c.nombre} sub={c.descripcion} fecha={c.fecha} onDelete={() => onDeleteColeccion(c.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ENTREGA 3 · FASE 17 (BL F2) — LIBROS
   ══════════════════════════════════════════════════════════════════════════ */

/* La portada. *"No bloquear el funcionamiento si el usuario no añade portada"*:
   sin imagen se dibujan sus iniciales, que es un dato de verdad y no una
   ilustración inventada (regla 8). */
export function Portada({ libro, url, alto = 132, accent }) {
  if (url) {
    return (
      <img
        src={url}
        alt={`Portada de ${libro.titulo}`}
        className="w-full rounded-xl object-cover"
        style={{ height: alto, background: COLORS.surface2 }}
      />
    );
  }
  return (
    <div
      className="w-full rounded-xl flex items-center justify-center"
      style={{ height: alto, background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
      aria-hidden="true"
    >
      <span className="text-lg font-bold" style={{ color: accent }}>{inicialesDe(libro)}</span>
    </div>
  );
}

/* La barra de progreso. Sin total de páginas no se pinta: un 0 % diría que no
   ha leído nada de un libro cuyo tamaño no conocemos. */
export function BarraProgreso({ libro, accent }) {
  const p = progresoDe(libro);
  if (!p) return null;
  return (
    <div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: COLORS.surface2 }}>
        <div
          className="h-full rounded-full progreso-libro"
          style={{ width: `${p.porcentaje}%`, background: accent }}
        />
      </div>
      <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>
        {p.paginas} / {p.total} páginas · {p.porcentaje} %
      </p>
    </div>
  );
}

export function EtiquetaEstado({ estado }) {
  const e = estadoLibro(estado);
  if (!e) return null;
  return (
    <span
      className="text-[11px] font-semibold rounded-full px-2 py-0.5 inline-block"
      style={{ background: COLORS.surface2, color: COLORS.textMuted }}
    >
      {e.icono} {e.nombre}
    </span>
  );
}

/* "Continuar leyendo": *"esta tarjeta debe tener más protagonismo que el
   resto"*. Solo existe si hay un libro en marcha. */
export function ContinuarLeyendo({ libro, url, accent, onAbrir }) {
  if (!libro) return null;
  const p = progresoDe(libro);
  return (
    <Card style={{ padding: '1rem' }}>
      <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: accent }}>Continuar leyendo</p>
      <div className="flex gap-3">
        <div style={{ width: 74, flexShrink: 0 }}>
          <Portada libro={libro} url={url} alto={104} accent={accent} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-sm font-bold" style={{ color: COLORS.text }}>{libro.titulo}</p>
            {libro.autor ? <p className="text-xs" style={{ color: COLORS.textMuted }}>{libro.autor}</p> : null}
            {p ? <p className="text-lg font-bold mt-1" style={{ color: accent }}>{p.porcentaje} %</p> : null}
          </div>
          <button
            onClick={onAbrir}
            className="self-start text-xs font-semibold toque-44 p-1.5 -m-1.5"
            style={{ color: accent }}
          >
            Continuar →
          </button>
        </div>
      </div>
      <BarraProgreso libro={libro} accent={accent} />
    </Card>
  );
}

export function TarjetaLibro({ libro, url, accent, indice = 0, onAbrir }) {
  return (
    <button
      onClick={onAbrir}
      className={`${CLASE_TARJETA} text-left rounded-2xl p-3 w-full transition-transform active:scale-[0.97]`}
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, animationDelay: retrasoDeTarjeta(indice) }}
    >
      <Portada libro={libro} url={url} accent={accent} />
      <p className="text-sm font-semibold mt-2 leading-snug" style={{ color: COLORS.text }}>{libro.titulo}</p>
      {libro.autor ? <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{libro.autor}</p> : null}
      <div className="mt-1.5"><EtiquetaEstado estado={libro.estado} /></div>
      <div className="mt-1.5"><BarraProgreso libro={libro} accent={accent} /></div>
    </button>
  );
}

/* El formulario, uno solo para crear y para editar: dos serían dos sitios donde
   arreglar el mismo fallo. */
export function FormularioLibro({ libro = null, accent, onGuardar, onCancelar, onSubirPortada }) {
  const [form, setForm] = useState({
    titulo: libro?.titulo || '',
    autor: libro?.autor || '',
    totalPaginas: libro?.totalPaginas ?? '',
    paginaActual: libro?.paginaActual ?? '',
    estado: libro?.estado || ESTADO_POR_DEFECTO,
    inicio: libro?.inicio || '',
    fin: libro?.fin || '',
    nota: libro?.nota || '',
  });
  const [portada, setPortada] = useState(libro?.portada || null);
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState(null);

  const puedeGuardar = tituloDeLibroValido(form.titulo);

  const elegirPortada = async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    const problema = revisarPortada(file);
    if (problema) { setAviso(problema); return; }
    setAviso(null);
    setSubiendo(true);
    try {
      const camino = await onSubirPortada(file);
      if (camino) setPortada(camino);
      else setAviso('No se ha podido subir la portada. Comprueba la conexión y prueba otra vez.');
    } finally {
      setSubiendo(false);
    }
  };

  const guardar = () => {
    if (!puedeGuardar) return;
    onGuardar({
      titulo: form.titulo,
      autor: form.autor,
      portada,
      totalPaginas: form.totalPaginas === '' ? null : Number(form.totalPaginas),
      paginaActual: form.paginaActual === '' ? null : Number(form.paginaActual),
      estado: form.estado,
      inicio: form.inicio || null,
      fin: form.fin || null,
      nota: form.nota,
    });
  };

  return (
    <Card>
      <Field label="Título">
        <TextInput
          aria-label="Título del libro"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Ej: Hábitos atómicos"
        />
      </Field>
      <Field label="Autor (opcional)">
        <TextInput aria-label="Autor del libro" value={form.autor} onChange={(e) => setForm({ ...form, autor: e.target.value })} />
      </Field>

      <Field label="Portada (opcional)">
        <div className="flex items-center gap-3">
          <div style={{ width: 56, flexShrink: 0 }}>
            <Portada libro={{ titulo: form.titulo || '?' }} url={null} alto={76} accent={accent} />
          </div>
          <label className="flex-1">
            <div
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer toque-44"
              style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}`, opacity: subiendo ? 0.6 : 1 }}
            >
              <Upload size={14} />
              {subiendo ? 'Subiendo…' : portada ? 'Cambiar la portada' : 'Elegir una imagen'}
            </div>
            <input type="file" accept="image/*" onChange={elegirPortada} disabled={subiendo} className="hidden" />
          </label>
        </div>
        {aviso ? <p className="text-xs mt-1.5" style={{ color: COLORS.textMuted }}>{aviso}</p> : null}
      </Field>

      <Field label="Páginas del libro (opcional)">
        <TextInput
          aria-label="Páginas del libro"
          inputMode="numeric"
          value={form.totalPaginas}
          onChange={(e) => setForm({ ...form, totalPaginas: e.target.value.replace(/\D/g, '') })}
          placeholder="Ej: 250"
        />
      </Field>
      <Field label="Página por la que vas (opcional)">
        <TextInput
          aria-label="Página actual"
          inputMode="numeric"
          value={form.paginaActual}
          onChange={(e) => setForm({ ...form, paginaActual: e.target.value.replace(/\D/g, '') })}
        />
      </Field>

      <Field label="Estado">
        <Select aria-label="Estado del libro" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
          {ESTADOS_LIBRO.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </Select>
      </Field>
      <Field label="Cuándo lo empezaste (opcional)">
        <TextInput aria-label="Fecha de inicio" type="date" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} />
      </Field>
      <Field label="Cuándo lo terminaste (opcional)">
        <TextInput aria-label="Fecha de finalización" type="date" value={form.fin} onChange={(e) => setForm({ ...form, fin: e.target.value })} />
      </Field>
      <Field label="Tu nota sobre el libro (opcional)">
        <Textarea
          aria-label="Nota del libro"
          rows={3}
          value={form.nota}
          onChange={(e) => setForm({ ...form, nota: e.target.value })}
          placeholder="Ej: Me está gustando especialmente el capítulo 4."
        />
      </Field>

      <PrimaryButton accent={accent} disabled={!puedeGuardar} onClick={guardar}>
        {libro ? 'Guardar cambios' : 'Guardar libro'}
      </PrimaryButton>
      {onCancelar ? <div className="mt-2"><GhostBtn onClick={onCancelar}>Cancelar</GhostBtn></div> : null}
    </Card>
  );
}

/* El detalle. Overlay a pantalla completa **con `createPortal`** (regla 3): sin
   él se ancla al contenedor de `.module-enter` y aparece abajo del todo. */
export function DetalleLibro({ libro, url, accent, onCerrar, onGuardar, onEliminar, onSubirPortada }) {
  const [editando, setEditando] = useState(false);
  const [pagina, setPagina] = useState(String(libro?.paginaActual ?? ''));
  const [celebra, setCelebra] = useState(false);

  useEffect(() => {
    const alPulsar = (ev) => { if (ev.key === 'Escape') onCerrar(); };
    if (typeof document !== 'undefined') document.addEventListener('keydown', alPulsar);
    return () => { if (typeof document !== 'undefined') document.removeEventListener('keydown', alPulsar); };
  }, [onCerrar]);

  if (!libro) return null;

  const terminar = () => {
    onGuardar(marcarTerminado(libro));
    setCelebra(true);
  };

  const contenido = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto pantalla-segura"
      style={{ background: COLORS.bg }}
      role="dialog"
      aria-label={`Detalle de ${libro.titulo}`}
    >
      <div className="max-w-md mx-auto px-4 pb-8 space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <button onClick={onCerrar} className="p-1.5 -m-1.5" aria-label="Cerrar el detalle del libro">
            <ArrowLeft size={18} style={{ color: COLORS.textMuted }} />
          </button>
          <p className="text-base font-bold flex-1 truncate" style={{ color: COLORS.text }}>{libro.titulo}</p>
        </div>

        {editando ? (
          <FormularioLibro
            libro={libro}
            accent={accent}
            onSubirPortada={onSubirPortada}
            onCancelar={() => setEditando(false)}
            onGuardar={(cambios) => { onGuardar(editarLibro(libro, cambios)); setEditando(false); }}
          />
        ) : (
          <>
            <Card>
              <div className="flex gap-3">
                <div style={{ width: 96, flexShrink: 0 }}>
                  <Portada libro={libro} url={url} alto={136} accent={accent} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  {libro.autor ? <p className="text-sm" style={{ color: COLORS.textMuted }}>{libro.autor}</p> : null}
                  <EtiquetaEstado estado={libro.estado} />
                  {libro.inicio ? <p className="text-[11px]" style={{ color: COLORS.textMuted }}>Empezado el {formatFecha(libro.inicio)}</p> : null}
                  {libro.fin ? <p className="text-[11px]" style={{ color: COLORS.textMuted }}>Terminado el {formatFecha(libro.fin)}</p> : null}
                </div>
              </div>
              <div className="mt-3"><BarraProgreso libro={libro} accent={accent} /></div>
              {progresoDe(libro) === null && (
                <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
                  Sin las páginas del libro no se puede calcular el porcentaje. Puedes añadirlas al editarlo.
                </p>
              )}
            </Card>

            {libro.totalPaginas ? (
              <Card>
                <Field label="Página por la que vas">
                  <TextInput
                    aria-label="Actualizar la página actual"
                    inputMode="numeric"
                    value={pagina}
                    onChange={(e) => setPagina(e.target.value.replace(/\D/g, ''))}
                  />
                </Field>
                <PrimaryButton accent={accent} onClick={() => onGuardar(actualizarPagina(libro, pagina))}>
                  Guardar la página
                </PrimaryButton>
              </Card>
            ) : null}

            <Card>
              <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>Estado</p>
              <div className="flex flex-wrap gap-2">
                {ESTADOS_LIBRO.map((e) => (
                  <FiltroPill
                    key={e.id}
                    active={libro.estado === e.id}
                    accent={accent}
                    onClick={() => { if (e.id === 'terminado') terminar(); else onGuardar(cambiarEstado(libro, e.id)); }}
                  >
                    {e.icono} {e.nombre}
                  </FiltroPill>
                ))}
              </div>
            </Card>

            {libro.nota ? (
              <Card>
                <p className="text-xs font-semibold mb-1" style={{ color: COLORS.textMuted }}>Tu nota</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: COLORS.text }}>{libro.nota}</p>
              </Card>
            ) : null}

            <Card>
              <div className="flex items-center justify-between">
                <GhostBtn icon={Pencil} onClick={() => setEditando(true)}>Editar</GhostBtn>
                <BotonBorrar onClick={() => { onEliminar(libro.id); onCerrar(); }} label="Eliminar el libro" />
              </div>
            </Card>
          </>
        )}
      </div>

      {/* La celebración del enunciado: *"animación de finalización… discreta. No
          exagerar."* Una línea, y se va sola al tocar. */}
      {celebra && (
        <button
          onClick={() => setCelebra(false)}
          className="fixed left-0 right-0 flex justify-center celebracion-libro"
          style={{ bottom: 'calc(var(--safe-bottom) + 24px)' }}
          aria-label="Cerrar el aviso de libro terminado"
        >
          <span
            className="text-xs font-semibold rounded-full px-4 py-2"
            style={{ background: accent, color: COLORS.textOnAccent }}
          >
            ✓ Terminado. Un libro más.
          </span>
        </button>
      )}
    </div>
  );

  /* 🚨 Regla 3: todo overlay `fixed inset-0` va con `createPortal(..., document.body)`.
     Sin él se ancla al contenedor de `.module-enter` y aparece "abajo del todo",
     que es un fallo real ya corregido en este proyecto. */
  return typeof document === 'undefined' ? contenido : createPortal(contenido, document.body);
}

export function PantallaLibros({
  app, libros, cabecera, crear, onCerrarCrear, onAbrirCrear, vacio, accent,
  onAdd, onUpdate, onDelete, onSubirPortada, onBorrarPortada,
}) {
  const [filtro, setFiltro] = useState('todos');
  const [orden, setOrden] = useState('recientes');
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(null);
  const [urls, setUrls] = useState({});

  const conPortada = libros.filter((l) => l.portada);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const pares = await Promise.all(conPortada.map(async (l) => [l.id, await getSignedBibliotecaUrl(l.portada)]));
      if (!cancelado) setUrls(Object.fromEntries(pares));
    })();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libros.map((l) => `${l.id}:${l.portada || ''}`).join('|')]);

  const linea = lineaResumen(libros);
  const actual = libroActual(libros);
  const visibles = ordenarLibros(filtrarLibros(libros, { estado: filtro, texto }), orden);
  const historial = historialLectura(libros);
  const stats = estadisticasLectura(libros);
  const abiertoAhora = abierto ? libros.find((l) => l.id === abierto) || null : null;

  /* ⚠️ Eliminar un libro se lleva su portada del almacenamiento: dejarla sería
     un archivo huérfano ocupando sitio en el bucket de Josué para siempre. */
  const eliminar = (id) => {
    const libro = libros.find((l) => l.id === id);
    if (libro?.portada && onBorrarPortada) onBorrarPortada(libro.portada);
    onDelete(id);
  };

  return (
    <div className="space-y-3 pb-4">
      {cabecera}
      {linea ? <p className="text-xs font-semibold" style={{ color: accent }}>{linea}</p> : null}

      {crear && (
        <FormularioLibro
          accent={accent}
          onSubirPortada={onSubirPortada}
          onCancelar={onCerrarCrear}
          onGuardar={(datos) => { onAdd(crearLibro(datos)); onCerrarCrear(); }}
        />
      )}

      {libros.length === 0 ? vacio : (
        <>
          <ContinuarLeyendo libro={actual} url={actual ? urls[actual.id] : null} accent={accent} onAbrir={() => setAbierto(actual.id)} />

          {libros.length >= 4 && (
            <div className="relative">
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
              <TextInput
                aria-label="Buscar por título o autor"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Buscar por título o autor…"
                style={{ paddingLeft: 34 }}
              />
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {FILTROS_LIBROS.map((f) => (
              <FiltroPill key={f.id} active={filtro === f.id} accent={accent} onClick={() => setFiltro(f.id)}>{f.nombre}</FiltroPill>
            ))}
          </div>

          <Field label="Ordenar por">
            <Select aria-label="Ordenar los libros" value={orden} onChange={(e) => setOrden(e.target.value)}>
              {ORDENES_LIBROS.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </Select>
          </Field>

          {visibles.length === 0 ? (
            <EmptyHint text="Ningún libro coincide con esta búsqueda o este filtro." />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {visibles.map((l, i) => (
                <TarjetaLibro key={l.id} libro={l} url={urls[l.id]} accent={accent} indice={i} onAbrir={() => setAbierto(l.id)} />
              ))}
            </div>
          )}

          <Card>
            <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>Tu lectura</p>
            <p className="text-sm" style={{ color: COLORS.text }}>
              {stats.paginasLeidas} {stats.paginasLeidas === 1 ? 'página leída' : 'páginas leídas'} · {stats.terminados} {stats.terminados === 1 ? 'libro terminado' : 'libros terminados'}
            </p>
            {stats.sinContar > 0 && (
              <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>
                {stats.sinContar} {stats.sinContar === 1 ? 'libro no cuenta' : 'libros no cuentan'} porque no tienen apuntadas sus páginas.
              </p>
            )}
            {stats.diasDeLectura !== null && (
              <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>
                {stats.diasDeLectura} {stats.diasDeLectura === 1 ? 'día de lectura' : 'días de lectura'} en {stats.conFechas} {stats.conFechas === 1 ? 'libro con sus dos fechas' : 'libros con sus dos fechas'}.
              </p>
            )}
          </Card>

          {historial.length > 0 && (
            <Card>
              <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>Libros terminados</p>
              <div className="space-y-1.5">
                {historial.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2">
                    <p className="text-sm truncate" style={{ color: COLORS.text }}>{l.titulo}</p>
                    <p className="text-[11px] flex-shrink-0" style={{ color: COLORS.textMuted }}>
                      {l.fin ? formatFecha(l.fin) : 'Sin fecha'}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {abiertoAhora && (
        <DetalleLibro
          libro={abiertoAhora}
          url={urls[abiertoAhora.id]}
          accent={accent}
          onCerrar={() => setAbierto(null)}
          onGuardar={onUpdate}
          onEliminar={eliminar}
          onSubirPortada={onSubirPortada}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ENTREGA 3 · FASE 18 (BL F4) — GUARDADOS
   ══════════════════════════════════════════════════════════════════════════ */

/* El favicon del propio sitio, con su vuelta atrás. *"Si una preview falla: la
   tarjeta sigue funcionando."* Se pide **al sitio mismo**, sin pasar por ningún
   servicio de terceros, y va con `loading="lazy"` para que no bloquee la
   pantalla (apartado de rendimiento). */
export function IconoGuardado({ guardado, accent, tam = 18 }) {
  const [falla, setFalla] = useState(false);
  const src = guardado.tipo === 'link' ? faviconDe(guardado.url) : null;
  const tipo = tipoGuardado(guardado.tipo);
  if (src && !falla) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        width={tam}
        height={tam}
        onError={() => setFalla(true)}
        style={{ width: tam, height: tam, borderRadius: 4, objectFit: 'contain' }}
      />
    );
  }
  return <span style={{ fontSize: tam - 2, color: accent }} aria-hidden="true">{tipo?.icono || '📎'}</span>;
}

export function TarjetaGuardado({ guardado, accent, indice = 0, onAbrir, onFavorito }) {
  const dominio = dominioDe(guardado.url);
  const tipo = tipoGuardado(guardado.tipo);
  return (
    <Card style={{ padding: '0.85rem 1rem', animationDelay: retrasoDeTarjeta(indice) }} className={CLASE_TARJETA}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5"><IconoGuardado guardado={guardado} accent={accent} /></div>
        <button onClick={onAbrir} className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{nombreDe(guardado)}</p>
          {/* ⚠️ `break-all` porque *"las URLs largas nunca deben romper el layout"*. */}
          {dominio ? <p className="text-[11px] break-all" style={{ color: COLORS.textMuted }}>{dominio}</p> : null}
          {guardado.tipo !== 'link' && guardado.titulo && guardado.contenido ? (
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
              {guardado.contenido.slice(0, 70)}{guardado.contenido.length > 70 ? '…' : ''}
            </p>
          ) : null}
          <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>
            {tipo?.nombre} · {formatFecha(guardado.fecha)}
            {guardado.estado === 'archived' ? ' · Archivado' : ''}
          </p>
        </button>
        <button
          onClick={onFavorito}
          className="p-1.5 -m-1.5 flex-shrink-0 transition-transform active:scale-90 favorito-guardado"
          aria-label={guardado.favorito ? `Quitar ${nombreDe(guardado)} de favoritos` : `Marcar ${nombreDe(guardado)} como favorito`}
        >
          <Star
            size={16}
            style={{ color: guardado.favorito ? accent : COLORS.textMuted }}
            fill={guardado.favorito ? accent : 'none'}
          />
        </button>
      </div>
    </Card>
  );
}

/* El formulario. *"Guardar algo debe ser extremadamente rápido… no obligar a
   rellenar un formulario enorme."* Así que lo primero y único imprescindible es
   la dirección o el texto; el resto se despliega solo si lo quiere. */
export function FormularioGuardado({ guardado = null, accent, onGuardar, onCancelar }) {
  const [tipo, setTipo] = useState(guardado?.tipo || 'link');
  const [form, setForm] = useState({
    url: guardado?.url || '',
    contenido: guardado?.contenido || '',
    titulo: guardado?.titulo || '',
    descripcion: guardado?.descripcion || '',
    nota: guardado?.nota || '',
  });
  const [masCampos, setMasCampos] = useState(Boolean(guardado?.descripcion || guardado?.nota));

  const propuesta = crearGuardado({ ...form, tipo });
  const dominio = dominioDe(form.url);

  return (
    <Card>
      <Field label="Qué estás guardando">
        <div className="flex gap-2">
          {TIPOS_GUARDADO.map((t) => (
            <FiltroPill key={t.id} active={tipo === t.id} accent={accent} onClick={() => setTipo(t.id)}>
              {t.icono} {t.nombre}
            </FiltroPill>
          ))}
        </div>
      </Field>

      {tipo === 'link' ? (
        <Field label="Pega la dirección">
          <TextInput
            aria-label="Dirección del enlace"
            inputMode="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://…"
          />
        </Field>
      ) : (
        <Field label="Lo que quieres conservar">
          <Textarea
            aria-label="Contenido del guardado"
            rows={4}
            value={form.contenido}
            onChange={(e) => setForm({ ...form, contenido: e.target.value })}
            placeholder="Pega o escribe aquí…"
          />
        </Field>
      )}

      {/* 🚨 Lo único que se puede saber de una dirección sin descargarla es su
          dominio, y se enseña. El título no se puede sacar, y se dice — nunca se
          finge (regla 8). */}
      {tipo === 'link' && dominio ? (
        <p className="text-[11px] -mt-1 mb-2" style={{ color: COLORS.textMuted }}>
          De {dominio}. El título se escribe a mano: la aplicación no puede leerlo de la página.
        </p>
      ) : null}

      <Field label="Título (opcional)">
        <TextInput
          aria-label="Título del guardado"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder={tipo === 'link' ? 'Ej: Tutorial de React' : 'Sin título'}
        />
      </Field>

      {masCampos ? (
        <>
          <Field label="Descripción (opcional)">
            <TextInput aria-label="Descripción del guardado" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </Field>
          <Field label="Tu nota (opcional)">
            <Textarea
              aria-label="Nota del guardado"
              rows={2}
              value={form.nota}
              onChange={(e) => setForm({ ...form, nota: e.target.value })}
              placeholder="Ej: Mirar este vídeo cuando termine el proyecto."
            />
          </Field>
        </>
      ) : (
        <div className="mb-2"><GhostBtn onClick={() => setMasCampos(true)}>Añadir descripción o nota</GhostBtn></div>
      )}

      <PrimaryButton accent={accent} disabled={!propuesta} onClick={() => onGuardar({ ...form, tipo })}>
        {guardado ? 'Guardar cambios' : 'Guardar'}
      </PrimaryButton>
      {onCancelar ? <div className="mt-2"><GhostBtn onClick={onCancelar}>Cancelar</GhostBtn></div> : null}
    </Card>
  );
}

export function DetalleGuardado({ guardado, accent, onCerrar, onGuardar, onEliminar }) {
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    const alPulsar = (ev) => { if (ev.key === 'Escape') onCerrar(); };
    if (typeof document !== 'undefined') document.addEventListener('keydown', alPulsar);
    return () => { if (typeof document !== 'undefined') document.removeEventListener('keydown', alPulsar); };
  }, [onCerrar]);

  if (!guardado) return null;
  const dominio = dominioDe(guardado.url);
  const tipo = tipoGuardado(guardado.tipo);

  const contenido = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto pantalla-segura"
      style={{ background: COLORS.bg }}
      role="dialog"
      aria-label={`Detalle de ${nombreDe(guardado)}`}
    >
      <div className="max-w-md mx-auto px-4 pb-8 space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <button onClick={onCerrar} className="p-1.5 -m-1.5" aria-label="Cerrar el detalle del guardado">
            <ArrowLeft size={18} style={{ color: COLORS.textMuted }} />
          </button>
          <p className="text-base font-bold flex-1 truncate" style={{ color: COLORS.text }}>{nombreDe(guardado)}</p>
        </div>

        {editando ? (
          <FormularioGuardado
            guardado={guardado}
            accent={accent}
            onCancelar={() => setEditando(false)}
            onGuardar={(cambios) => { onGuardar(editarGuardado(guardado, cambios)); setEditando(false); }}
          />
        ) : (
          <>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <IconoGuardado guardado={guardado} accent={accent} />
                <span className="text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: COLORS.surface2, color: COLORS.textMuted }}>
                  {tipo?.icono} {tipo?.nombre}
                </span>
                {guardado.estado === 'archived' ? (
                  <span className="text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: COLORS.surface2, color: COLORS.textMuted }}>Archivado</span>
                ) : null}
              </div>
              {guardado.url ? <p className="text-xs break-all" style={{ color: COLORS.textMuted }}>{guardado.url}</p> : null}
              {guardado.contenido ? (
                <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap" style={{ color: COLORS.text }}>{guardado.contenido}</p>
              ) : null}
              {guardado.descripcion ? <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>{guardado.descripcion}</p> : null}
              {guardado.nota ? (
                <p className="text-xs mt-2 leading-relaxed whitespace-pre-wrap" style={{ color: COLORS.text }}>Tu nota: {guardado.nota}</p>
              ) : null}
              <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>Guardado el {formatFecha(guardado.fecha)}</p>
            </Card>

            {/* *"Debe abrirse de forma segura. No ejecutar contenido externo
                dentro de la aplicación"*: pestaña nueva, con `noreferrer`. */}
            {guardado.url ? (
              <Card>
                <a
                  href={guardado.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-2 text-sm font-semibold toque-44"
                  style={{ color: accent }}
                >
                  <ExternalLink size={15} /> Abrir enlace
                </a>
              </Card>
            ) : null}

            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <GhostBtn icon={Star} onClick={() => onGuardar(alternarFavorito(guardado))}>
                  {guardado.favorito ? 'Quitar de favoritos' : 'Favorito'}
                </GhostBtn>
                <GhostBtn icon={Pencil} onClick={() => setEditando(true)}>Editar</GhostBtn>
                <GhostBtn
                  icon={Archive}
                  onClick={() => onGuardar(guardado.estado === 'archived' ? desarchivar(guardado) : archivar(guardado))}
                >
                  {guardado.estado === 'archived' ? 'Sacar del archivo' : 'Archivar'}
                </GhostBtn>
                <BotonBorrar onClick={() => { onEliminar(guardado.id); onCerrar(); }} label="Eliminar el guardado" />
              </div>
              {/* ⚠️ Archivar y eliminar son dos acciones distintas, y se dice cuál
                  hace qué: prometer lo que no se cumple es mentir en pantalla. */}
              <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
                Archivar lo saca de la lista sin borrarlo. Eliminar lo manda a Eliminados recientes, de donde puedes recuperarlo.
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );

  return typeof document === 'undefined' ? contenido : createPortal(contenido, document.body);
}

export function PantallaGuardados({ guardados, cabecera, crear, onCerrarCrear, vacio, accent, onAdd, onUpdate, onDelete }) {
  const [filtro, setFiltro] = useState('todos');
  const [orden, setOrden] = useState(ORDEN_POR_DEFECTO);
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(null);

  const resumen = resumenGuardados(guardados);
  const visibles = ordenarGuardados(filtrarGuardados(guardados, { filtro, texto }), orden);
  const abiertoAhora = abierto ? guardados.find((g) => g.id === abierto) || null : null;

  return (
    <div className="space-y-3 pb-4">
      {cabecera}
      {resumen ? <p className="text-xs font-semibold" style={{ color: accent }}>{resumen}</p> : null}

      {crear && (
        <FormularioGuardado
          accent={accent}
          onCancelar={onCerrarCrear}
          onGuardar={(datos) => { onAdd(crearGuardado(datos)); onCerrarCrear(); }}
        />
      )}

      {guardados.length === 0 ? vacio : (
        <>
          {guardados.length >= 4 && (
            <div className="relative">
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
              <TextInput
                aria-label="Buscar en los guardados"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Buscar por título, dirección o nota…"
                style={{ paddingLeft: 34 }}
              />
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {FILTROS_GUARDADOS.map((f) => (
              <FiltroPill key={f.id} active={filtro === f.id} accent={accent} onClick={() => setFiltro(f.id)}>{f.nombre}</FiltroPill>
            ))}
          </div>

          <Field label="Ordenar por">
            <Select aria-label="Ordenar los guardados" value={orden} onChange={(e) => setOrden(e.target.value)}>
              {ORDENES_GUARDADOS.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </Select>
          </Field>

          {visibles.length === 0 ? (
            <EmptyHint text={filtro === 'archivados' ? 'No has archivado nada todavía.' : 'Nada coincide con esta búsqueda o este filtro.'} />
          ) : (
            <div className="space-y-2">
              {visibles.map((g, i) => (
                <TarjetaGuardado
                  key={g.id}
                  guardado={g}
                  accent={accent}
                  indice={i}
                  onAbrir={() => setAbierto(g.id)}
                  onFavorito={() => onUpdate(alternarFavorito(g))}
                />
              ))}
            </div>
          )}

          {/* 🚨 La diferencia con Notas, dicha en la pantalla: el enunciado la
              marca como IMPORTANTE para que Guardados no acabe siendo otra
              aplicación de notas. */}
          <p className="text-[11px] leading-snug" style={{ color: COLORS.textMuted }}>
            {DIFERENCIA_CON_NOTAS.ejemplo}
          </p>
        </>
      )}

      {abiertoAhora && (
        <DetalleGuardado
          guardado={abiertoAhora}
          accent={accent}
          onCerrar={() => setAbierto(null)}
          onGuardar={onUpdate}
          onEliminar={onDelete}
        />
      )}
    </div>
  );
}
