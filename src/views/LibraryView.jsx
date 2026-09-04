import React, { useState, useEffect } from 'react';
import { Search, FileText, Video as VideoIcon, Image as ImageIcon, StickyNote, Link as LinkIcon, Trash2, ExternalLink, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { COLORS, TIPOS_ARCHIVO_BIBLIOTECA } from '../tokens';
import { uid, todayISO, formatFecha } from '../lib/helpers';
import { getSignedBibliotecaUrl } from '../lib/supabase';
import { Card, SectionTitle, Field, TextInput, Textarea, Select, PrimaryButton, EmptyHint, BotonBorrarDefinitivo } from '../components/ui';

// Fase 11 — Biblioteca: PDFs, vídeos, fotos, apuntes y enlaces conviven en un único listado
// buscable. Los tres tipos de archivo comparten forma { id, tipo, path, titulo, fecha } +
// textoExtraido solo en los PDF; apuntes y enlaces son texto puro sin archivo.
const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'pdf', label: 'PDFs' },
  { id: 'video', label: 'Vídeos' },
  { id: 'foto', label: 'Fotos' },
  { id: 'apunte', label: 'Apuntes' },
  { id: 'enlace', label: 'Enlaces' },
];

const ICONOS = { pdf: FileText, video: VideoIcon, foto: ImageIcon, apunte: StickyNote, enlace: LinkIcon };

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

function AnadirApunte({ onAdd, accent }) {
  const [form, setForm] = useState({ titulo: '', contenido: '' });
  const puedeGuardar = form.titulo.trim() || form.contenido.trim();
  const guardar = () => {
    if (!puedeGuardar) return;
    onAdd({ id: uid(), fecha: todayISO(), titulo: form.titulo.trim() || 'Sin título', contenido: form.contenido });
    setForm({ titulo: '', contenido: '' });
  };
  return (
    <Card>
      <Field label="Título">
        <TextInput value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Resumen del examen de Física" />
      </Field>
      <Field label="Contenido">
        <Textarea rows={4} value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} placeholder="Escribe el apunte…" />
      </Field>
      <PrimaryButton accent={accent} disabled={!puedeGuardar} onClick={guardar}>Guardar apunte</PrimaryButton>
    </Card>
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

export default function LibraryView({ biblioteca, archivos, onAddArchivo, onDeleteArchivo, onAddApunte, onDeleteApunte, onAddEnlace, onDeleteEnlace, accent }) {
  const [query, setQuery] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [tipoNuevo, setTipoNuevo] = useState('pdf');
  const [urls, setUrls] = useState({});

  const conArchivo = archivos.filter((a) => a.tipo === 'foto' || a.tipo === 'pdf' || a.tipo === 'video');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(conArchivo.map(async (a) => [a.id, await getSignedBibliotecaUrl(a.path)]));
      if (!cancelled) setUrls(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archivos]);

  const todos = [
    ...archivos.map((a) => ({ ...a, _tipo: a.tipo })),
    ...biblioteca.apuntes.map((a) => ({ ...a, _tipo: 'apunte' })),
    ...biblioteca.enlaces.map((e) => ({ ...e, _tipo: 'enlace' })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  const q = query.trim().toLowerCase();
  const filtrados = todos.filter((item) => {
    if (filtro !== 'todos' && item._tipo !== filtro) return false;
    if (!q) return true;
    const haystack = [item.titulo, item.contenido, item.descripcion, item.url, item.textoExtraido].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  });

  const eliminar = (item) => {
    if (item._tipo === 'apunte') onDeleteApunte(item.id);
    else if (item._tipo === 'enlace') onDeleteEnlace(item.id);
    else onDeleteArchivo(item.id, item.path);
  };

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="PDFs, vídeos, fotos, apuntes y enlaces — todo en un mismo sitio y buscable">Biblioteca</SectionTitle>

      <div className="relative">
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título, contenido o dentro de un PDF…"
          style={{ paddingLeft: 34 }}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {FILTROS.map((f) => (
          <FiltroPill key={f.id} active={filtro === f.id} onClick={() => setFiltro(f.id)} accent={accent}>{f.label}</FiltroPill>
        ))}
      </div>

      <Card>
        <Field label="Añadir">
          <Select value={tipoNuevo} onChange={(e) => setTipoNuevo(e.target.value)}>
            <option value="pdf">PDF</option>
            <option value="video">Vídeo</option>
            <option value="foto">Foto</option>
            <option value="apunte">Apunte de texto</option>
            <option value="enlace">Enlace</option>
          </Select>
        </Field>
      </Card>

      {(tipoNuevo === 'pdf' || tipoNuevo === 'video' || tipoNuevo === 'foto') && <AnadirArchivo tipo={tipoNuevo} onAdd={onAddArchivo} accent={accent} />}
      {tipoNuevo === 'apunte' && <AnadirApunte onAdd={onAddApunte} accent={accent} />}
      {tipoNuevo === 'enlace' && <AnadirEnlace onAdd={onAddEnlace} accent={accent} />}

      {filtrados.length === 0 ? (
        <EmptyHint text={q || filtro !== 'todos' ? 'Nada coincide con esta búsqueda o filtro.' : 'Tu biblioteca está vacía. Añade tu primer PDF, apunte o enlace arriba.'} />
      ) : (
        <div className="space-y-2">
          {filtrados.map((item) => (
            <ItemCard key={`${item._tipo}-${item.id}`} item={item} query={q} url={urls[item.id]} accent={accent} onDelete={() => eliminar(item)} />
          ))}
        </div>
      )}
    </div>
  );
}
