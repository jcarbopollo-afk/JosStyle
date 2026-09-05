import React, { useState, useEffect } from 'react';
import {
  Search, FileText, Video as VideoIcon, Image as ImageIcon, StickyNote, Link as LinkIcon,
  Trash2, ExternalLink, ChevronDown, ChevronUp, Upload, ArrowLeft, Plus,
  BookMarked, Bookmark, Lightbulb, FolderOpen,
} from 'lucide-react';
import { COLORS, TIPOS_ARCHIVO_BIBLIOTECA } from '../tokens';
import { uid, todayISO, formatFecha } from '../lib/helpers';
import { getSignedBibliotecaUrl } from '../lib/supabase';
import {
  MINI_APPS, miniApp, elementosDe, indicadorDe, diferenciaDe,
  crearLibro, crearIdea, crearColeccion, CLASE_TARJETA, retrasoDeTarjeta,
} from '../lib/biblioteca';
import { Card, SectionTitle, Field, TextInput, Textarea, Select, PrimaryButton, EmptyHint, BotonBorrar, BotonBorrarDefinitivo } from '../components/ui';

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
export function AnadirLibro({ onAdd, accent }) {
  const [form, setForm] = useState({ titulo: '', autor: '' });
  const libro = crearLibro(form);
  return (
    <Card>
      <Field label="Título del libro">
        <TextInput aria-label="Título del libro" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Hábitos atómicos" />
      </Field>
      <Field label="Autor (opcional)">
        <TextInput aria-label="Autor del libro" value={form.autor} onChange={(e) => setForm({ ...form, autor: e.target.value })} />
      </Field>
      <PrimaryButton accent={accent} disabled={!libro} onClick={() => { onAdd(crearLibro(form)); setForm({ titulo: '', autor: '' }); }}>
        Guardar libro
      </PrimaryButton>
    </Card>
  );
}

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

function AnadirEnlace({ onAdd, accent }) {
  const [form, setForm] = useState({ titulo: '', url: '', descripcion: '' });
  const puedeGuardar = form.titulo.trim() && form.url.trim();
  const guardar = () => {
    if (!puedeGuardar) return;
    let url = form.url.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    onAdd({ id: uid(), fecha: todayISO(), titulo: form.titulo.trim(), url, descripcion: form.descripcion.trim() });
    setForm({ titulo: '', url: '', descripcion: '' });
  };
  return (
    <Card>
      <Field label="Título">
        <TextInput value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Vídeo de repaso de Química" />
      </Field>
      <Field label="Enlace">
        <TextInput value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
      </Field>
      <Field label="Descripción (opcional)">
        <TextInput value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      </Field>
      <PrimaryButton accent={accent} disabled={!puedeGuardar} onClick={guardar}>Guardar enlace</PrimaryButton>
    </Card>
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
  onAddEnlace, onDeleteEnlace,
  onAddLibro, onDeleteLibro,
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
  const conBuscador = elementos.length >= 5;

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
    const lista = elementos.filter((e) => coincide([e.titulo, e.url, e.descripcion]));
    return (
      <div className="space-y-3 pb-4">
        {cabecera}
        {crear && <AnadirEnlace onAdd={(e) => { onAddEnlace(e); setCrear(false); }} accent={accent} />}
        {elementos.length === 0 ? vacio : lista.length === 0 ? nadaCoincide : (
          <div className="space-y-2">
            {lista.map((e) => (
              <ItemCard key={e.id} item={{ ...e, _tipo: 'enlace' }} query={q} accent={accent} onDelete={() => onDeleteEnlace(e.id)} />
            ))}
          </div>
        )}
      </div>
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
    const lista = elementos.filter((l) => coincide([l.titulo, l.autor]));
    return (
      <div className="space-y-3 pb-4">
        {cabecera}
        {crear && <AnadirLibro onAdd={(l) => { onAddLibro(l); setCrear(false); }} accent={accent} />}
        {elementos.length === 0 ? vacio : lista.length === 0 ? nadaCoincide : (
          <div className="space-y-2">
            {lista.map((l) => (
              <FichaSimple key={l.id} titulo={l.titulo} sub={l.autor} fecha={l.fecha} onDelete={() => onDeleteLibro(l.id)} />
            ))}
          </div>
        )}
      </div>
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
