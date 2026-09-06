import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, FileText, Video as VideoIcon, Image as ImageIcon, StickyNote, Link as LinkIcon,
  Trash2, ExternalLink, ChevronDown, ChevronUp, Upload, ArrowLeft, Plus, Pencil, Star, Archive, Sparkles, Copy,
  BookMarked, Bookmark, Lightbulb, FolderOpen,
  GraduationCap, Code, Briefcase, Heart, Rocket, Dumbbell, Paperclip, Check, Minus, X,
} from 'lucide-react';
import { COLORS, TIPOS_ARCHIVO_BIBLIOTECA, PERIODOS_META, PLAZOS_OBJETIVO } from '../tokens';
import { uid, todayISO, formatFecha } from '../lib/helpers';
import { getSignedBibliotecaUrl } from '../lib/supabase';
import {
  MINI_APPS, miniApp, elementosDe, indicadorDe, diferenciaDe,
  CLASE_TARJETA, retrasoDeTarjeta,
} from '../lib/biblioteca';
/* BL F8 — la capa de integración: Recientes, la búsqueda global de la Biblioteca,
   los favoritos y las acciones rápidas. Ninguna guarda un solo dato. */
import {
  CABECERA_BIBLIOTECA, TIPOS_BIBLIOTECA, tipoBiblioteca, recientes, MAX_RECIENTES,
  buscarEnBiblioteca, resumenDeBusqueda, LIMITE_RESULTADOS,
  favoritosDe, ACCIONES_RAPIDAS, contadores, totalElementos,
} from '../lib/bibliotecaGlobal';
import { DEBOUNCE_BUSQUEDA_MS } from '../lib/rendimiento';
/* BL F7 — Colecciones tiene su propia librería. `crearColeccion` y
   `normalizarColeccion` vivían en `biblioteca.js` desde la F1 y se mudaron allí
   al desarrollarla: una sola fábrica, no dos. */
import {
  TIPOS_ELEMENTO, tipoElemento, ICONOS_DISPONIBLES, ACENTOS_COLECCION, ACENTO_POR_DEFECTO,
  ICONO_POR_DEFECTO, crearColeccion, editarColeccion, alternarFavoritaColeccion,
  archivarColeccion, desarchivarColeccion, contieneElemento, anadirElementos, quitarElemento,
  alternarEnColeccion, coleccionesDe, elementosDeColeccion, contarColeccion, agruparPorTipo,
  tiposDe, previewDe, nombreDelElemento, buscarColecciones, buscarDentro,
  FILTROS_COLECCIONES, FILTRO_COLECCIONES_POR_DEFECTO, filtrarColecciones,
  ORDENES_COLECCIONES, ORDEN_COLECCIONES_POR_DEFECTO, ordenarColecciones,
  FILTROS_DENTRO, filtrarDentro, ORDENES_DENTRO, ORDEN_DENTRO_POR_DEFECTO, ordenarDentro,
  avisoDeEliminar, estadisticasColecciones, lineaColecciones,
  VACIO_COLECCIONES, VACIO_DENTRO,
} from '../lib/colecciones';
/* BL F2 — Libros tiene su propia librería. `crearLibro` y `normalizarLibro`
   vivían en `biblioteca.js` desde la F1 y se mudaron aquí al desarrollarla:
   una sola fábrica, no dos. */
import {
  ESTADOS_DOCUMENTO, estadoDocumento, CATEGORIAS_DOCUMENTO, MARCAS_FORMATO, aplicarMarca,
  crearDocumento, editarDocumento, alternarFavoritoDoc, archivarDocumento, desarchivarDocumento,
  guardarEnBiblioteca, volverABorrador, RETRASO_AUTOGUARDADO_MS, estadoDeGuardado,
  bloquesDe, trozosDe, indiceDe, adelantoDe, nombreDoc,
  FILTROS_DOCUMENTOS, ORDENES_DOCUMENTOS, ORDEN_DOC_POR_DEFECTO,
  filtrarDocumentos, ordenarDocumentos, etiquetasUsadas, lineaDocumentos, EJEMPLO_DIFERENCIA,
} from '../lib/documentos';
import {
  ESTADOS_IDEA, estadoIdea, ESTADO_IDEA_POR_DEFECTO, PRIORIDADES_IDEA, prioridadIdea,
  PRIORIDAD_POR_DEFECTO, CATEGORIAS_IDEA, crearIdea, editarIdea, cambiarEstadoIdea,
  archivarIdea, desarchivarIdea, CONVERSIONES, conversion, convertirIdea, generadosDe,
  textoDeIdea, FILTROS_IDEAS, ORDENES_IDEAS, ORDEN_IDEAS_POR_DEFECTO,
  filtrarIdeas, ordenarIdeas, estadisticasIdeas, lineaIdeas, DIFERENCIA_IDEAS,
} from '../lib/ideas';
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

function ItemCard({
  item, query, url, accent, onDelete,
  /* BL F7 — las tres props del sistema único de colecciones. Son **opcionales**:
     sin `colecciones` la ficha se pinta exactamente igual que antes. */
  destacado = false, colecciones = null, tipoColeccion = null, onAlternarColeccion = null,
}) {
  const [abierto, setAbierto] = useState(destacado);
  const Icon = ICONOS[item._tipo];
  const esApunte = item._tipo === 'apunte';
  const esArchivo = item._tipo === 'pdf' || item._tipo === 'video' || item._tipo === 'foto';
  const trozo = item._tipo === 'pdf' ? snippet(item.textoExtraido, query) : '';
  const conColecciones = !!(colecciones && tipoColeccion && onAlternarColeccion);

  return (
    <Card style={destacado ? { padding: '1rem', border: `1px solid ${accent}` } : { padding: '1rem' }}>
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

          {conColecciones && (
            <AnadirAColeccion
              colecciones={colecciones}
              tipo={tipoColeccion}
              id={item.id}
              accent={accent}
              onAlternar={onAlternarColeccion}
            />
          )}

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

/* 🚨 **BL F7 — `AnadirColeccion` y `FichaSimple` se han ido.** Eran el formulario
   y la ficha mínimos de la BL F1, escritos *"para que el botón de crear escriba
   algo de verdad"* hasta que llegara la fase de Colecciones. Ya ha llegado:
   quien crea una colección es `FormularioColeccion` y quien la enseña es
   `TarjetaColeccion`. Dejar los dos vivos al lado habría sido un segundo
   formulario para lo mismo — el duplicado que la propia BL F7 prohíbe. */

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
  onAddIdea, onDeleteIdea, onUpdateIdea, onConvertirIdea,
  onAddDocumento, onDeleteDocumento, onUpdateDocumento,
  onAddColeccion, onDeleteColeccion, onUpdateColeccion, onSetColecciones,
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
  /* 🚨 BL F7 — *"Al pulsar un elemento dentro de una colección: **abrir el
     elemento original**. No crear una copia de la nota."* Ésta es la pieza que lo
     cumple: la colección no enseña una copia, manda a la mini-app del elemento y
     le dice cuál abrir. Cada pantalla ya sabía abrir un detalle por id; lo único
     nuevo es decirle desde fuera cuál. */
  const [foco, setFoco] = useState(null);

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

  const volver = () => { setAbierta(null); setCrear(false); setQuery(''); setFiltro('todos'); setFoco(null); };
  const abrir = (id) => { setAbierta(id); setCrear(false); setQuery(''); setFiltro('todos'); setFoco(null); };

  /** Llevar a la mini-app del elemento y abrir el original. `null` si el tipo no
   *  está en el catálogo — nunca una pantalla en blanco. */
  const abrirOriginal = (tipo, id) => {
    const t = tipoElemento(tipo);
    if (!t) return;
    setAbierta(t.miniApp);
    setCrear(false);
    setQuery('');
    setFiltro('todos');
    setFoco({ tipo, id });
  };

  // ── El lanzador ─────────────────────────────────────────────────────────
  if (!abierta) {
    /* 🚨 BL F8 — *"que Biblioteca deje de sentirse como 6 herramientas separadas
       y pase a sentirse como un único sistema personal de información"*. Debajo
       de los seis cuadraditos —que siguen siendo **los protagonistas**— van
       Recientes, la búsqueda global y los favoritos. **Ninguna de las tres es una
       séptima mini-app**: son secciones de esta pantalla (apartados 3 y 9). */
    return (
      <PantallaBiblioteca
        datos={datos}
        accent={accent}
        onAbrirMiniApp={abrir}
        onAbrirOriginal={abrirOriginal}
        onCrearEn={(id) => { setAbierta(id); setCrear(true); setQuery(''); setFiltro('todos'); setFoco(null); }}
      />
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
  const conBuscador = !['libros', 'guardados', 'ideas', 'documentos'].includes(abierta) && elementos.length >= 5;

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

  /* 🚨 BL F7 — *"Esto debe reutilizar el mismo sistema. **No crear cinco
     sistemas distintos.**"* Éste es el sistema, y es uno: las cinco mini-apps
     reciben las mismas dos props y ninguna sabe cómo se guarda una relación. */
  const colecciones = biblioteca.colecciones || [];
  const alternarColeccion = (coleccionId, tipo, id) =>
    onSetColecciones(alternarEnColeccion(colecciones, coleccionId, tipo, id));
  const focoDe = (tipo) => (foco && foco.tipo === tipo ? foco.id : null);

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
              <ItemCard
                key={a.id}
                item={{ ...a, _tipo: 'apunte' }}
                query={q}
                accent={accent}
                onDelete={() => onDeleteApunte(a.id)}
                /* ⚠️ Una nota no tiene pantalla de detalle propia: se despliega
                   en su ficha. Así que *"abrir el original"* es dejarla marcada
                   y abierta en la lista, no inventarle una pantalla. */
                destacado={focoDe('nota') === a.id}
                colecciones={colecciones}
                tipoColeccion="nota"
                onAlternarColeccion={alternarColeccion}
              />
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
        colecciones={colecciones}
        onAlternarColeccion={alternarColeccion}
        foco={focoDe('guardado')}
      />
    );
  }

  // ── Documentos ──────────────────────────────────────────────────────────
  if (abierta === 'documentos') {
    /* 🚨 BL F6 — Documentos guarda DOS cosas bajo el mismo techo: los archivos
       que Josué subió desde la Fase 11 y los documentos de texto que estrena esta
       fase. Ninguna se lleva por delante a la otra.

       ⚠️ BL F8 — `elementos` es ahora la SUMA de las dos listas, porque el
       contador de la plaquita tenía que contarlas las dos y solo miraba una. La
       pantalla las sigue necesitando separadas: los textos por un lado y los
       archivos por otro, cada uno con su botón y su papelera. */
    return (
      <PantallaDocumentos
        documentos={biblioteca.documentos || []}
        archivos={archivos}
        urlsArchivos={urls}
        cabecera={cabecera}
        crear={crear}
        onCerrarCrear={() => setCrear(false)}
        vacio={vacio}
        accent={accent}
        onAdd={onAddDocumento}
        onUpdate={onUpdateDocumento}
        onDelete={onDeleteDocumento}
        onAddArchivo={onAddArchivo}
        onDeleteArchivo={onDeleteArchivo}
        colecciones={colecciones}
        onAlternarColeccion={alternarColeccion}
        foco={focoDe('documento')}
        focoArchivo={focoDe('archivo')}
      />
    );
  }

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
        colecciones={colecciones}
        onAlternarColeccion={alternarColeccion}
        foco={focoDe('libro')}
      />
    );
  }

  // ── Ideas ───────────────────────────────────────────────────────────────
  if (abierta === 'ideas') {
    /* 🚨 BL F5 — Ideas tiene pantalla propia: cinco estados, prioridad,
       categorías, notas de desarrollo, conversión a tarea/meta/objetivo,
       archivado, búsqueda, filtros, orden y estadísticas sencillas. */
    return (
      <PantallaIdeas
        ideas={elementos}
        cabecera={cabecera}
        crear={crear}
        onCerrarCrear={() => setCrear(false)}
        vacio={vacio}
        accent={accent}
        onAdd={onAddIdea}
        onUpdate={onUpdateIdea}
        onDelete={onDeleteIdea}
        onConvertir={onConvertirIdea}
        colecciones={colecciones}
        onAlternarColeccion={alternarColeccion}
        foco={focoDe('idea')}
      />
    );
  }

  // ── Colecciones ─────────────────────────────────────────────────────────
  /* 🚨 BL F7 — Colecciones tiene pantalla propia: tarjetas visuales con preview,
     detalle con el contenido agrupado por tipo, selector múltiple para añadir,
     filtros, orden, búsqueda dentro y estadísticas. La cabecera, el ＋ y el
     estado vacío siguen siendo los del lanzador (BL F1). */
  return (
    <PantallaColecciones
      colecciones={elementos}
      datos={datos}
      cabecera={cabecera}
      crear={crear}
      onCerrarCrear={() => setCrear(false)}
      onAbrirCrear={() => setCrear(true)}
      accent={accent}
      onAdd={onAddColeccion}
      onUpdate={onUpdateColeccion}
      onDelete={onDeleteColeccion}
      onAbrirOriginal={abrirOriginal}
    />
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
export function DetalleLibro({
  libro, url, accent, onCerrar, onGuardar, onEliminar, onSubirPortada,
  colecciones = null, onAlternarColeccion = null,
}) {
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
              {onAlternarColeccion ? (
                <AnadirAColeccion
                  colecciones={colecciones}
                  tipo="libro"
                  id={libro.id}
                  accent={accent}
                  onAlternar={onAlternarColeccion}
                />
              ) : null}
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
  colecciones = null, onAlternarColeccion = null, foco = null,
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

  /* BL F7 — *"abrir el elemento original"* desde una colección. */
  useEffect(() => { if (foco) setAbierto(foco); }, [foco]);

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
          colecciones={colecciones}
          onAlternarColeccion={onAlternarColeccion}
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

export function DetalleGuardado({
  guardado, accent, onCerrar, onGuardar, onEliminar,
  colecciones = null, onAlternarColeccion = null,
}) {
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
              {onAlternarColeccion ? (
                <AnadirAColeccion
                  colecciones={colecciones}
                  tipo="guardado"
                  id={guardado.id}
                  accent={accent}
                  onAlternar={onAlternarColeccion}
                />
              ) : null}
            </Card>
          </>
        )}
      </div>
    </div>
  );

  return typeof document === 'undefined' ? contenido : createPortal(contenido, document.body);
}

export function PantallaGuardados({
  guardados, cabecera, crear, onCerrarCrear, vacio, accent, onAdd, onUpdate, onDelete,
  colecciones = null, onAlternarColeccion = null, foco = null,
}) {
  const [filtro, setFiltro] = useState('todos');
  const [orden, setOrden] = useState(ORDEN_POR_DEFECTO);
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(null);

  /* BL F7 — *"abrir el elemento original"*: la colección dice cuál, y esta
     pantalla lo abre con el detalle que ya tenía. */
  useEffect(() => { if (foco) setAbierto(foco); }, [foco]);

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
          colecciones={colecciones}
          onAlternarColeccion={onAlternarColeccion}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ENTREGA 3 · FASE 19 (BL F5) — IDEAS
   ══════════════════════════════════════════════════════════════════════════ */

export function EtiquetaIdea({ estado, prioridad }) {
  const e = estadoIdea(estado);
  const p = prioridadIdea(prioridad);
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {e ? (
        <span className="text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: COLORS.surface2, color: COLORS.textMuted }}>
          {e.icono} {e.nombre}
        </span>
      ) : null}
      {p && p.id !== 'media' ? (
        <span className="text-[11px] rounded-full px-2 py-0.5" style={{ background: COLORS.surface2, color: COLORS.textMuted }}>
          Prioridad {p.nombre.toLowerCase()}
        </span>
      ) : null}
    </div>
  );
}

/* La ficha: *"cada idea debe sentirse como una pequeña ficha visual"*, no como
   una fila de una lista de tareas — el enunciado lo prohíbe expresamente. */
export function TarjetaIdea({ idea, accent, indice = 0, onAbrir }) {
  const preview = String(idea.descripcion || '').trim().replace(/\s+/g, ' ');
  return (
    <button
      onClick={onAbrir}
      className={`${CLASE_TARJETA} text-left rounded-2xl p-4 w-full transition-transform active:scale-[0.97]`}
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, animationDelay: retrasoDeTarjeta(indice) }}
    >
      <div className="flex items-start justify-between gap-2">
        <span style={{ fontSize: 18 }} aria-hidden="true">💡</span>
        <p className="text-[11px] flex-shrink-0" style={{ color: COLORS.textMuted }}>{formatFecha(idea.fecha)}</p>
      </div>
      <p className="text-sm font-semibold mt-1.5 leading-snug" style={{ color: COLORS.text }}>{textoDeIdea(idea)}</p>
      {idea.titulo && preview ? (
        <p className="text-xs mt-1 leading-relaxed" style={{ color: COLORS.textMuted }}>
          {preview.slice(0, 90)}{preview.length > 90 ? '…' : ''}
        </p>
      ) : null}
      {idea.categoria ? (
        <p className="text-[11px] mt-1" style={{ color: accent }}>{idea.categoria}</p>
      ) : null}
      <div className="mt-2"><EtiquetaIdea estado={idea.estado} prioridad={idea.prioridad} /></div>
    </button>
  );
}

/* El formulario. *"Debe ser rápido: `+` → título → guardar. Sin obligar a
   rellenar descripción, categoría o prioridad."* Por eso lo único que se ve al
   abrirlo son los dos campos de texto; lo demás está detrás de un botón. */
export function FormularioIdea({ idea = null, accent, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    titulo: idea?.titulo || '',
    descripcion: idea?.descripcion || '',
    notas: idea?.notas || '',
    prioridad: idea?.prioridad || PRIORIDAD_POR_DEFECTO,
    categoria: idea?.categoria || '',
    estado: idea?.estado || ESTADO_IDEA_POR_DEFECTO,
  });
  const [mas, setMas] = useState(Boolean(idea?.categoria || (idea && idea.prioridad !== PRIORIDAD_POR_DEFECTO)));

  const puedeGuardar = Boolean(crearIdea(form));

  return (
    <Card>
      <Field label="Tu idea">
        <TextInput
          aria-label="Título de la idea"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Ej: Crear una app de reservas deportivas"
        />
      </Field>
      <Field label="Desarróllala si quieres (opcional)">
        <Textarea
          aria-label="Descripción de la idea"
          rows={3}
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          placeholder="Lo que se te ocurra sobre ella…"
        />
      </Field>

      {/* Las notas de desarrollo solo tienen sentido en una idea que ya existe y
          se está trabajando: *"una idea en estado DESARROLLANDO puede tener
          información adicional"*. */}
      {idea ? (
        <Field label="Notas de desarrollo (opcional)">
          <Textarea
            aria-label="Notas de desarrollo"
            rows={3}
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            placeholder="Ej: Podría usar Supabase para guardar las reservas…"
          />
        </Field>
      ) : null}

      {mas ? (
        <>
          <Field label="Prioridad">
            <Select aria-label="Prioridad de la idea" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
              {PRIORIDADES_IDEA.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
          </Field>
          <Field label="Categoría (opcional)">
            <TextInput
              aria-label="Categoría de la idea"
              list="categorias-idea"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              placeholder="Escribe la tuya o elige una"
            />
            {/* ⚠️ Es una LISTA DE SUGERENCIAS, no un desplegable cerrado: el
                enunciado quiere que pueda crear las suyas, y con un `<select>`
                haría falta cambiar el código para admitir la primera. */}
            <datalist id="categorias-idea">
              {CATEGORIAS_IDEA.map((c) => <option key={c} value={c} />)}
            </datalist>
          </Field>
        </>
      ) : (
        <div className="mb-2"><GhostBtn onClick={() => setMas(true)}>Prioridad y categoría</GhostBtn></div>
      )}

      <PrimaryButton accent={accent} disabled={!puedeGuardar} onClick={() => onGuardar(form)}>
        {idea ? 'Guardar cambios' : 'Guardar idea'}
      </PrimaryButton>
      {onCancelar ? <div className="mt-2"><GhostBtn onClick={onCancelar}>Cancelar</GhostBtn></div> : null}
    </Card>
  );
}

/* Convertir. 🚨 Mostrar y escribir son dos llamadas: aquí se elige lo que falta
   por decidir y **solo al confirmar** se crea el elemento. */
export function ConvertirIdea({ idea, accent, onConvertir, onCerrar }) {
  const [tipo, setTipo] = useState(null);
  const [opciones, setOpciones] = useState({ periodo: '', plazo: '', objetivo: '' });

  const destino = tipo ? conversion(tipo) : null;
  const resultado = tipo ? convertirIdea(idea, tipo, opciones, false) : null;
  const yaGenerados = generadosDe(idea);

  return (
    <Card>
      <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Convertir en…</p>
      <p className="text-[11px] mb-3" style={{ color: COLORS.textMuted }}>
        La idea se queda donde está: lo que se crea apunta a ella.
      </p>

      {yaGenerados.length > 0 && (
        <div className="mb-3 space-y-1">
          {yaGenerados.map((g) => (
            <p key={g.tipo} className="text-[11px]" style={{ color: COLORS.textMuted }}>
              {g.icono} Ya generó {g.nombre.toLowerCase()} — está en {g.donde}.
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {CONVERSIONES.map((c) => (
          <FiltroPill
            key={c.id}
            active={tipo === c.id}
            accent={accent}
            onClick={() => { setTipo(c.id); }}
          >
            {c.icono} {c.nombre}
          </FiltroPill>
        ))}
      </div>

      {/* 🚨 Un destino que todavía no existe se dice, no se esconde ni se finge
          (regla 8): el botón está, y al tocarlo explica por qué no puede ser. */}
      {destino && !destino.existe ? (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>{destino.porque}</p>
      ) : null}

      {destino?.pide.includes('periodo') && (
        <Field label="Cada cuánto quieres medirla">
          <Select aria-label="Periodo de la meta" value={opciones.periodo} onChange={(e) => setOpciones({ ...opciones, periodo: e.target.value })}>
            <option value="">Elige uno…</option>
            {PERIODOS_META.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
      )}
      {destino?.pide.includes('objetivo') && (
        <Field label="Cuántas veces">
          <TextInput
            aria-label="Veces de la meta"
            inputMode="numeric"
            value={opciones.objetivo}
            onChange={(e) => setOpciones({ ...opciones, objetivo: e.target.value.replace(/\D/g, '') })}
          />
        </Field>
      )}
      {destino?.pide.includes('plazo') && (
        <Field label="En cuánto tiempo">
          <Select aria-label="Plazo del objetivo" value={opciones.plazo} onChange={(e) => setOpciones({ ...opciones, plazo: e.target.value })}>
            <option value="">Elige uno…</option>
            {PLAZOS_OBJETIVO.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
      )}

      {resultado?.error ? (
        <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>{resultado.error}</p>
      ) : null}

      {resultado?.plan ? (
        <>
          <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
            Se creará «{resultado.plan.texto}» en {resultado.plan.destino}.
          </p>
          <PrimaryButton accent={accent} onClick={() => { onConvertir(idea, tipo, opciones); onCerrar(); }}>
            Crear {destino.nombre.toLowerCase()}
          </PrimaryButton>
        </>
      ) : null}
      <div className="mt-2"><GhostBtn onClick={onCerrar}>Cancelar</GhostBtn></div>
    </Card>
  );
}

export function DetalleIdea({
  idea, accent, onCerrar, onGuardar, onEliminar, onConvertir,
  colecciones = null, onAlternarColeccion = null,
}) {
  const [editando, setEditando] = useState(false);
  const [convirtiendo, setConvirtiendo] = useState(false);

  useEffect(() => {
    const alPulsar = (ev) => { if (ev.key === 'Escape') onCerrar(); };
    if (typeof document !== 'undefined') document.addEventListener('keydown', alPulsar);
    return () => { if (typeof document !== 'undefined') document.removeEventListener('keydown', alPulsar); };
  }, [onCerrar]);

  if (!idea) return null;
  const generados = generadosDe(idea);

  const contenido = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto pantalla-segura"
      style={{ background: COLORS.bg }}
      role="dialog"
      aria-label={`Detalle de ${textoDeIdea(idea)}`}
    >
      <div className="max-w-md mx-auto px-4 pb-8 space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <button onClick={onCerrar} className="p-1.5 -m-1.5" aria-label="Cerrar el detalle de la idea">
            <ArrowLeft size={18} style={{ color: COLORS.textMuted }} />
          </button>
          <p className="text-base font-bold flex-1 truncate" style={{ color: COLORS.text }}>{textoDeIdea(idea)}</p>
        </div>

        {editando ? (
          <FormularioIdea
            idea={idea}
            accent={accent}
            onCancelar={() => setEditando(false)}
            onGuardar={(cambios) => { onGuardar(editarIdea(idea, cambios)); setEditando(false); }}
          />
        ) : convirtiendo ? (
          <ConvertirIdea idea={idea} accent={accent} onConvertir={onConvertir} onCerrar={() => setConvirtiendo(false)} />
        ) : (
          <>
            <Card>
              <EtiquetaIdea estado={idea.estado} prioridad={idea.prioridad} />
              {idea.categoria ? <p className="text-[11px] mt-1.5" style={{ color: accent }}>{idea.categoria}</p> : null}
              {idea.descripcion ? (
                <p className="text-sm mt-2 leading-relaxed whitespace-pre-wrap" style={{ color: COLORS.text }}>{idea.descripcion}</p>
              ) : null}
              <p className="text-[11px] mt-3" style={{ color: COLORS.textMuted }}>Se te ocurrió el {formatFecha(idea.fecha)}</p>
              {idea.actualizado !== idea.fecha ? (
                <p className="text-[11px]" style={{ color: COLORS.textMuted }}>Última vez que la tocaste: {formatFecha(idea.actualizado)}</p>
              ) : null}
              {idea.completado ? (
                <p className="text-[11px]" style={{ color: COLORS.textMuted }}>La hiciste el {formatFecha(idea.completado)}</p>
              ) : null}
              {idea.archivada ? (
                <p className="text-[11px]" style={{ color: COLORS.textMuted }}>Está archivada.</p>
              ) : null}
            </Card>

            {idea.notas ? (
              <Card>
                <p className="text-xs font-semibold mb-1" style={{ color: COLORS.textMuted }}>Notas de desarrollo</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: COLORS.text }}>{idea.notas}</p>
              </Card>
            ) : null}

            {generados.length > 0 && (
              <Card>
                <p className="text-xs font-semibold mb-1" style={{ color: COLORS.textMuted }}>Lo que ha generado</p>
                {generados.map((g) => (
                  <p key={g.tipo} className="text-sm" style={{ color: COLORS.text }}>
                    {g.icono} {g.nombre} — en {g.donde}
                  </p>
                ))}
              </Card>
            )}

            <Card>
              <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>Estado</p>
              <div className="flex flex-wrap gap-2">
                {ESTADOS_IDEA.map((e) => (
                  <FiltroPill
                    key={e.id}
                    active={idea.estado === e.id}
                    accent={accent}
                    onClick={() => onGuardar(cambiarEstadoIdea(idea, e.id))}
                  >
                    {e.icono} {e.nombre}
                  </FiltroPill>
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <GhostBtn icon={Pencil} onClick={() => setEditando(true)}>Editar</GhostBtn>
                <GhostBtn icon={Sparkles} onClick={() => setConvirtiendo(true)}>Convertir en…</GhostBtn>
                <GhostBtn
                  icon={Archive}
                  onClick={() => onGuardar(idea.archivada ? desarchivarIdea(idea) : archivarIdea(idea))}
                >
                  {idea.archivada ? 'Sacar del archivo' : 'Archivar'}
                </GhostBtn>
                <BotonBorrar onClick={() => { onEliminar(idea.id); onCerrar(); }} label="Eliminar la idea" />
              </div>
              {/* ⚠️ Descartar, archivar y eliminar son TRES cosas, y se dice cuál
                  hace qué: el enunciado dedica un apartado a separarlas. */}
              <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
                Descartarla la deja aquí para poder revisarla. Archivarla la saca de la lista sin borrarla.
                Eliminarla la manda a Eliminados recientes, de donde puedes recuperarla.
              </p>
              {onAlternarColeccion ? (
                <AnadirAColeccion
                  colecciones={colecciones}
                  tipo="idea"
                  id={idea.id}
                  accent={accent}
                  onAlternar={onAlternarColeccion}
                />
              ) : null}
            </Card>
          </>
        )}
      </div>
    </div>
  );

  return typeof document === 'undefined' ? contenido : createPortal(contenido, document.body);
}

export function PantallaIdeas({
  ideas, cabecera, crear, onCerrarCrear, vacio, accent, onAdd, onUpdate, onDelete, onConvertir,
  colecciones = null, onAlternarColeccion = null, foco = null,
}) {
  const [filtro, setFiltro] = useState('todas');
  const [orden, setOrden] = useState(ORDEN_IDEAS_POR_DEFECTO);
  const [texto, setTexto] = useState('');
  const [abierta, setAbiertaIdea] = useState(null);

  /* BL F7 — *"abrir el elemento original"* desde una colección. */
  useEffect(() => { if (foco) setAbiertaIdea(foco); }, [foco]);

  const linea = lineaIdeas(ideas);
  const stats = estadisticasIdeas(ideas);
  const visibles = ordenarIdeas(filtrarIdeas(ideas, { filtro, texto }), orden);
  const abiertaAhora = abierta ? ideas.find((i) => i.id === abierta) || null : null;

  return (
    <div className="space-y-3 pb-4">
      {cabecera}
      {linea ? <p className="text-xs font-semibold" style={{ color: accent }}>{linea}</p> : null}

      {crear && (
        <FormularioIdea
          accent={accent}
          onCancelar={onCerrarCrear}
          onGuardar={(datos) => { onAdd(crearIdea(datos)); onCerrarCrear(); }}
        />
      )}

      {ideas.length === 0 ? vacio : (
        <>
          {ideas.length >= 4 && (
            <div className="relative">
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
              <TextInput
                aria-label="Buscar entre las ideas"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Buscar por título, descripción o notas…"
                style={{ paddingLeft: 34 }}
              />
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {FILTROS_IDEAS.map((f) => (
              <FiltroPill key={f.id} active={filtro === f.id} accent={accent} onClick={() => setFiltro(f.id)}>{f.nombre}</FiltroPill>
            ))}
          </div>

          <Field label="Ordenar por">
            <Select aria-label="Ordenar las ideas" value={orden} onChange={(e) => setOrden(e.target.value)}>
              {ORDENES_IDEAS.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </Select>
          </Field>

          {visibles.length === 0 ? (
            <EmptyHint text={filtro === 'archivadas' ? 'No has archivado ninguna idea todavía.' : 'Ninguna idea coincide con esta búsqueda o este filtro.'} />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {visibles.map((i, n) => (
                <TarjetaIdea key={i.id} idea={i} accent={accent} indice={n} onAbrir={() => setAbiertaIdea(i.id)} />
              ))}
            </div>
          )}

          <Card>
            <p className="text-xs font-semibold mb-1" style={{ color: COLORS.textMuted }}>Tus ideas</p>
            <p className="text-sm" style={{ color: COLORS.text }}>
              {stats.total} en total · {stats.activas} {stats.activas === 1 ? 'activa' : 'activas'} · {stats.realizadas} {stats.realizadas === 1 ? 'realizada' : 'realizadas'}
            </p>
            {stats.realizadasEsteMes > 0 && (
              <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>
                {stats.realizadasEsteMes} {stats.realizadasEsteMes === 1 ? 'realizada' : 'realizadas'} este mes.
              </p>
            )}
          </Card>

          {/* La diferencia con Notas, que el enunciado llama fundamental. */}
          <p className="text-[11px] leading-snug" style={{ color: COLORS.textMuted }}>
            {DIFERENCIA_IDEAS.ejemplo}
          </p>
        </>
      )}

      {abiertaAhora && (
        <DetalleIdea
          idea={abiertaAhora}
          accent={accent}
          onCerrar={() => setAbiertaIdea(null)}
          onGuardar={onUpdate}
          onEliminar={onDelete}
          onConvertir={onConvertir}
          colecciones={colecciones}
          onAlternarColeccion={onAlternarColeccion}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ENTREGA 3 · FASE 20 (BL F6) — DOCUMENTOS
   ══════════════════════════════════════════════════════════════════════════ */

/* Un trozo de texto con su marca. 🚨 Se pinta con elementos de React, **nunca
   con `dangerouslySetInnerHTML`**: lo que hay dentro lo escribe Josué, pero un
   texto pegado de cualquier sitio no tiene por qué ser inofensivo, y una vez
   que existe ese camino ya no se cierra. */
export function TextoConMarcas({ texto }) {
  return (
    <>
      {trozosDe(texto).map((t, i) => {
        if (t.codigo) {
          return (
            <code key={i} className="text-[0.9em] rounded px-1 py-0.5" style={{ background: COLORS.surface2, color: COLORS.text }}>
              {t.texto}
            </code>
          );
        }
        const estilo = {};
        if (t.negrita) estilo.fontWeight = 700;
        if (t.cursiva) estilo.fontStyle = 'italic';
        if (t.tachado) estilo.textDecoration = 'line-through';
        return <span key={i} style={estilo}>{t.texto}</span>;
      })}
    </>
  );
}

/* El modo lectura. *"El documento debe verse como contenido editorial. Especial
   atención a: anchura máxima del texto, interlineado, títulos, separación de
   secciones."* */
export function CuerpoDocumento({ contenido, accent }) {
  const bloques = bloquesDe(contenido);
  if (bloques.length === 0) {
    return <p className="text-sm" style={{ color: COLORS.textMuted }}>Este documento todavía está vacío.</p>;
  }
  const tamanos = { 1: 'text-lg', 2: 'text-base', 3: 'text-sm' };
  return (
    <div style={{ maxWidth: '68ch' }}>
      {bloques.map((b, i) => {
        if (b.tipo === 'separador') {
          return <hr key={i} className="my-4" style={{ border: 0, borderTop: `1px solid ${COLORS.border}` }} />;
        }
        if (b.tipo === 'titulo') {
          return (
            <p key={i} className={`${tamanos[b.nivel]} font-bold mt-4 mb-1.5 leading-snug`} style={{ color: COLORS.text }}>
              <TextoConMarcas texto={b.texto} />
            </p>
          );
        }
        if (b.tipo === 'cita') {
          return (
            <p key={i} className="text-sm my-2 pl-3 leading-relaxed" style={{ color: COLORS.textMuted, borderLeft: `2px solid ${accent}` }}>
              <TextoConMarcas texto={b.texto} />
            </p>
          );
        }
        if (b.tipo === 'checklist') {
          return (
            <div key={i} className="my-2 space-y-1">
              {b.elementos.map((el, j) => (
                <p key={j} className="text-sm leading-relaxed" style={{ color: el.hecho ? COLORS.textMuted : COLORS.text }}>
                  <span aria-hidden="true">{el.hecho ? '☑' : '☐'}</span>{' '}
                  <span style={el.hecho ? { textDecoration: 'line-through' } : undefined}><TextoConMarcas texto={el.texto} /></span>
                </p>
              ))}
            </div>
          );
        }
        if (b.tipo === 'vinetas' || b.tipo === 'numerada') {
          return (
            <div key={i} className="my-2 space-y-1">
              {b.elementos.map((el, j) => (
                <p key={j} className="text-sm leading-relaxed pl-4" style={{ color: COLORS.text, textIndent: '-1rem' }}>
                  <span style={{ color: COLORS.textMuted }}>{b.tipo === 'vinetas' ? '• ' : `${j + 1}. `}</span>
                  <TextoConMarcas texto={el.texto} />
                </p>
              ))}
            </div>
          );
        }
        return (
          <p key={i} className="text-sm my-2 leading-relaxed" style={{ color: COLORS.text }}>
            <TextoConMarcas texto={b.texto} />
          </p>
        );
      })}
    </div>
  );
}

/* El índice, si el documento tiene títulos. `null` si no: uno vacío ocupa sitio
   y no dice nada. */
export function IndiceDocumento({ contenido, accent }) {
  const indice = indiceDe(contenido);
  if (!indice) return null;
  return (
    <Card>
      <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: accent }}>Contenido</p>
      {indice.map((t) => (
        <p key={t.n} className="text-xs leading-relaxed" style={{ color: COLORS.textMuted, paddingLeft: (t.nivel - 1) * 12 }}>
          {t.n}. {t.texto}
        </p>
      ))}
    </Card>
  );
}

export function TarjetaDocumento({ documento, accent, indice = 0, onAbrir }) {
  const adelanto = adelantoDe(documento);
  const estado = estadoDocumento(documento.estado);
  return (
    <Card style={{ padding: '0.9rem 1rem', animationDelay: retrasoDeTarjeta(indice) }} className={CLASE_TARJETA}>
      <button onClick={onAbrir} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <span style={{ fontSize: 16 }} aria-hidden="true">📄</span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {documento.favorito ? <Star size={13} style={{ color: accent }} fill={accent} /> : null}
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{formatFecha(documento.actualizado)}</p>
          </div>
        </div>
        <p className="text-sm font-semibold mt-1 leading-snug" style={{ color: COLORS.text }}>{nombreDoc(documento)}</p>
        {adelanto ? <p className="text-xs mt-1 leading-relaxed" style={{ color: COLORS.textMuted }}>{adelanto}</p> : null}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {documento.estado === 'draft' ? (
            <span className="text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: COLORS.surface2, color: COLORS.textMuted }}>
              {estado?.icono} {estado?.nombre}
            </span>
          ) : null}
          {documento.categoria ? <span className="text-[11px]" style={{ color: accent }}>{documento.categoria}</span> : null}
          {(documento.etiquetas || []).slice(0, 3).map((t) => (
            <span key={t} className="text-[11px]" style={{ color: COLORS.textMuted }}>#{t}</span>
          ))}
        </div>
      </button>
    </Card>
  );
}

/* La barra de formato. Una pastilla por marca, sacadas del catálogo: añadir una
   marca es añadir una línea, nunca un botón a mano. */
export function BarraFormato({ accent, onMarca }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto py-1" style={{ scrollbarWidth: 'none' }}>
      {MARCAS_FORMATO.map((m) => (
        <button
          key={m.id}
          onClick={() => onMarca(m.id)}
          aria-label={m.nombre}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold flex-shrink-0 toque-44 transition-transform active:scale-90"
          style={{ background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
        >
          {m.muestra}
        </button>
      ))}
    </div>
  );
}

/* El editor. 🚨 El autoguardado es lo que el enunciado llama MUY IMPORTANTE:
   escribe con retardo, y **al cerrar guarda lo que quede pendiente** — sin eso,
   escribir una frase y salir en menos de un segundo la perdería. */
export function EditorDocumento({ documento, accent, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    titulo: documento?.titulo || '',
    descripcion: documento?.descripcion || '',
    contenido: documento?.contenido || '',
    categoria: documento?.categoria || '',
    etiquetas: (documento?.etiquetas || []).join(' '),
  });
  const [mas, setMas] = useState(Boolean(documento?.categoria || (documento?.etiquetas || []).length));
  const [guardando, setGuardando] = useState(false);
  const [guardadoAlguna, setGuardadoAlguna] = useState(false);
  const [enLinea, setEnLinea] = useState(true);
  const areaRef = React.useRef(null);
  const pendiente = React.useRef(null);

  /* ⚠️ Todos los hooks van ANTES de cualquier `return` condicional (regla 4). */
  useEffect(() => {
    if (typeof navigator === 'undefined') return undefined;
    const mirar = () => setEnLinea(navigator.onLine !== false);
    mirar();
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('online', mirar);
    window.addEventListener('offline', mirar);
    return () => { window.removeEventListener('online', mirar); window.removeEventListener('offline', mirar); };
  }, []);

  useEffect(() => {
    pendiente.current = form;
    setGuardando(true);
    const t = setTimeout(() => {
      onGuardar(form);
      pendiente.current = null;
      setGuardando(false);
      setGuardadoAlguna(true);
    }, RETRASO_AUTOGUARDADO_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.titulo, form.descripcion, form.contenido, form.categoria, form.etiquetas]);

  const cerrar = () => {
    /* 🚨 Lo que estuviera esperando al retardo se guarda AHORA. */
    if (pendiente.current) onGuardar(pendiente.current);
    onCerrar();
  };

  const aviso = estadoDeGuardado({ guardando, enLinea, guardadoAlguna });

  const marcar = (id) => {
    const area = areaRef.current;
    const ini = area ? area.selectionStart : form.contenido.length;
    const fin = area ? area.selectionEnd : ini;
    const r = aplicarMarca(form.contenido, ini, fin, id);
    setForm({ ...form, contenido: r.texto });
    /* El cursor se recoloca tras el repintado, para que se pueda seguir
       escribiendo donde toca sin volver a tocar la pantalla. */
    if (area) {
      requestAnimationFrame(() => { area.focus(); area.setSelectionRange(r.inicio, r.fin); });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={cerrar} className="p-1.5 -m-1.5" aria-label="Cerrar el editor">
          <ArrowLeft size={18} style={{ color: COLORS.textMuted }} />
        </button>
        <p className="text-sm font-semibold flex-1 truncate" style={{ color: COLORS.text }}>
          {form.titulo || 'Documento sin título'}
        </p>
        {aviso ? <p className="text-[11px] flex-shrink-0" style={{ color: COLORS.textMuted }}>{aviso.texto}</p> : null}
      </div>

      <Card>
        <Field label="Título">
          <TextInput
            aria-label="Título del documento"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Ej: Especificación de Productividad"
          />
        </Field>

        <BarraFormato accent={accent} onMarca={marcar} />

        <Textarea
          ref={areaRef}
          aria-label="Contenido del documento"
          rows={16}
          value={form.contenido}
          onChange={(e) => setForm({ ...form, contenido: e.target.value })}
          placeholder="Escribe aquí. Los botones de arriba ponen títulos, listas y demás."
          style={{ lineHeight: 1.7 }}
        />

        {mas ? (
          <div className="mt-2">
            <Field label="Descripción (opcional)">
              <TextInput aria-label="Descripción del documento" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </Field>
            <Field label="Categoría (opcional)">
              <TextInput
                aria-label="Categoría del documento"
                list="categorias-documento"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                placeholder="Escribe la tuya o elige una"
              />
              <datalist id="categorias-documento">
                {CATEGORIAS_DOCUMENTO.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>
            <Field label="Etiquetas (opcional, separadas por espacios)">
              <TextInput
                aria-label="Etiquetas del documento"
                value={form.etiquetas}
                onChange={(e) => setForm({ ...form, etiquetas: e.target.value })}
                placeholder="claude supabase productividad"
              />
            </Field>
          </div>
        ) : (
          <div className="mt-2"><GhostBtn onClick={() => setMas(true)}>Descripción, categoría y etiquetas</GhostBtn></div>
        )}
      </Card>
    </div>
  );
}

export function LecturaDocumento({
  documento, accent, onCerrar, onGuardar, onEliminar,
  colecciones = null, onAlternarColeccion = null,
}) {
  const [editando, setEditando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const alPulsar = (ev) => { if (ev.key === 'Escape' && !editando) onCerrar(); };
    if (typeof document !== 'undefined') document.addEventListener('keydown', alPulsar);
    return () => { if (typeof document !== 'undefined') document.removeEventListener('keydown', alPulsar); };
  }, [onCerrar, editando]);

  if (!documento) return null;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(documento.contenido || '');
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* ⚠️ Copiar puede no estar permitido, y entonces se dice qué hacer en vez
         de fingir que se copió (regla 8). */
      setCopiado(false);
    }
  };

  const contenido = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto pantalla-segura"
      style={{ background: COLORS.bg }}
      role="dialog"
      aria-label={`Documento ${nombreDoc(documento)}`}
    >
      <div className="max-w-md mx-auto px-4 pb-8 space-y-3">
        {editando ? (
          <EditorDocumento
            documento={documento}
            accent={accent}
            onCerrar={() => setEditando(false)}
            onGuardar={(cambios) => onGuardar(editarDocumento(documento, { ...cambios, etiquetas: cambios.etiquetas }))}
          />
        ) : (
          <>
            <div className="flex items-center gap-2 pt-1">
              <button onClick={onCerrar} className="p-1.5 -m-1.5" aria-label="Cerrar el documento">
                <ArrowLeft size={18} style={{ color: COLORS.textMuted }} />
              </button>
              <p className="text-base font-bold flex-1 truncate" style={{ color: COLORS.text }}>{nombreDoc(documento)}</p>
              <button
                onClick={() => onGuardar(alternarFavoritoDoc(documento))}
                className="p-1.5 -m-1.5 flex-shrink-0 transition-transform active:scale-90 favorito-guardado"
                aria-label={documento.favorito ? 'Quitar de favoritos' : 'Marcar como favorito'}
              >
                <Star size={16} style={{ color: documento.favorito ? accent : COLORS.textMuted }} fill={documento.favorito ? accent : 'none'} />
              </button>
            </div>

            {documento.descripcion ? (
              <p className="text-xs" style={{ color: COLORS.textMuted }}>{documento.descripcion}</p>
            ) : null}
            <div className="flex items-center gap-2 flex-wrap">
              {documento.estado === 'draft' ? (
                <span className="text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: COLORS.surface2, color: COLORS.textMuted }}>
                  ✎ Borrador
                </span>
              ) : null}
              {documento.categoria ? <span className="text-[11px]" style={{ color: accent }}>{documento.categoria}</span> : null}
              {(documento.etiquetas || []).map((t) => (
                <span key={t} className="text-[11px]" style={{ color: COLORS.textMuted }}>#{t}</span>
              ))}
            </div>

            <IndiceDocumento contenido={documento.contenido} accent={accent} />

            {/* *"No mostrar demasiados controles mientras se lee."* Por eso el
                cuerpo va suelto, sin tarjeta ni botones alrededor. */}
            <CuerpoDocumento contenido={documento.contenido} accent={accent} />

            <p className="text-[11px] pt-2" style={{ color: COLORS.textMuted }}>
              Creado el {formatFecha(documento.fecha)} · Última vez que lo tocaste: {formatFecha(documento.actualizado)}
            </p>

            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <GhostBtn icon={Pencil} onClick={() => setEditando(true)}>Editar</GhostBtn>
                <GhostBtn icon={Copy} onClick={copiar}>{copiado ? 'Copiado' : 'Copiar el texto'}</GhostBtn>
                {documento.estado === 'draft' ? (
                  <GhostBtn onClick={() => onGuardar(guardarEnBiblioteca(documento))}>Ya no es un borrador</GhostBtn>
                ) : (
                  <GhostBtn onClick={() => onGuardar(volverABorrador(documento))}>Volver a borrador</GhostBtn>
                )}
                <GhostBtn
                  icon={Archive}
                  onClick={() => onGuardar(documento.archivado ? desarchivarDocumento(documento) : archivarDocumento(documento))}
                >
                  {documento.archivado ? 'Sacar del archivo' : 'Archivar'}
                </GhostBtn>
                <BotonBorrar onClick={() => { onEliminar(documento.id); onCerrar(); }} label="Eliminar el documento" />
              </div>
              <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
                Archivarlo lo saca de la lista sin borrarlo. Eliminarlo lo manda a Eliminados recientes, de donde puedes recuperarlo.
              </p>
              {onAlternarColeccion ? (
                <AnadirAColeccion
                  colecciones={colecciones}
                  tipo="documento"
                  id={documento.id}
                  accent={accent}
                  onAlternar={onAlternarColeccion}
                />
              ) : null}
            </Card>
          </>
        )}
      </div>
    </div>
  );

  return typeof document === 'undefined' ? contenido : createPortal(contenido, document.body);
}

export function PantallaDocumentos({
  documentos, archivos, urlsArchivos, cabecera, crear, onCerrarCrear, vacio, accent,
  onAdd, onUpdate, onDelete, onAddArchivo, onDeleteArchivo,
  colecciones = null, onAlternarColeccion = null, foco = null, focoArchivo = null,
}) {
  const [filtroDoc, setFiltroDoc] = useState('todos');
  const [orden, setOrden] = useState(ORDEN_DOC_POR_DEFECTO);
  const [texto, setTexto] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [abierto, setAbierto] = useState(null);
  const [nuevo, setNuevo] = useState(null);
  const [verArchivos, setVerArchivos] = useState(false);
  const [tipoArchivo, setTipoArchivo] = useState('pdf');

  /* BL F7 — *"abrir el elemento original"* desde una colección. Un documento de
     texto tiene pantalla de lectura y se abre; un ARCHIVO no tiene una —se abre
     en el navegador—, así que se despliega la lista y se le marca. */
  useEffect(() => { if (foco) setAbierto(foco); }, [foco]);
  useEffect(() => { if (focoArchivo) setVerArchivos(true); }, [focoArchivo]);

  const linea = lineaDocumentos(documentos, archivos);
  const visibles = ordenarDocumentos(filtrarDocumentos(documentos, { filtro: filtroDoc, texto, etiqueta }), orden);
  const abiertoAhora = abierto ? documentos.find((d) => d.id === abierto) || null : null;
  const etiquetas = etiquetasUsadas(documentos);
  const vacioDelTodo = documentos.length === 0 && archivos.length === 0;

  /* El ＋ del lanzador abre el editor directamente: *"abrir directamente el
     editor… no obligar al usuario a rellenar campos organizativos antes de
     escribir"*. El documento se crea con el primer autoguardado. */
  const editandoNuevo = crear || nuevo !== null;

  if (editandoNuevo) {
    return (
      <div className="space-y-3 pb-4">
        <EditorDocumento
          documento={nuevo}
          accent={accent}
          onCerrar={() => { setNuevo(null); onCerrarCrear(); }}
          onGuardar={(datos) => {
            if (nuevo) { const d = editarDocumento(nuevo, datos); setNuevo(d); onUpdate(d); return; }
            const d = crearDocumento(datos);
            if (d) { setNuevo(d); onAdd(d); }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {cabecera}
      {linea ? <p className="text-xs font-semibold" style={{ color: accent }}>{linea}</p> : null}

      {vacioDelTodo ? vacio : (
        <>
          {documentos.length >= 4 && (
            <div className="relative">
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
              <TextInput
                aria-label="Buscar en los documentos"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Buscar por título, contenido o etiqueta…"
                style={{ paddingLeft: 34 }}
              />
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {FILTROS_DOCUMENTOS.map((f) => (
              <FiltroPill key={f.id} active={filtroDoc === f.id} accent={accent} onClick={() => setFiltroDoc(f.id)}>{f.nombre}</FiltroPill>
            ))}
          </div>

          {etiquetas.length > 0 && (
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <FiltroPill active={!etiqueta} accent={accent} onClick={() => setEtiqueta('')}>Todas las etiquetas</FiltroPill>
              {etiquetas.map((t) => (
                <FiltroPill key={t.etiqueta} active={etiqueta === t.etiqueta} accent={accent} onClick={() => setEtiqueta(t.etiqueta)}>
                  #{t.etiqueta}
                </FiltroPill>
              ))}
            </div>
          )}

          {documentos.length > 0 && (
            <Field label="Ordenar por">
              <Select aria-label="Ordenar los documentos" value={orden} onChange={(e) => setOrden(e.target.value)}>
                {ORDENES_DOCUMENTOS.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
              </Select>
            </Field>
          )}

          {documentos.length === 0 ? (
            <EmptyHint text="Todavía no has escrito ningún documento. Toca el ＋ para empezar uno." />
          ) : visibles.length === 0 ? (
            <EmptyHint text={filtroDoc === 'archivados' ? 'No has archivado ningún documento todavía.' : 'Ningún documento coincide con esta búsqueda o este filtro.'} />
          ) : (
            <div className="space-y-2">
              {visibles.map((d, i) => (
                <TarjetaDocumento key={d.id} documento={d} accent={accent} indice={i} onAbrir={() => setAbierto(d.id)} />
              ))}
            </div>
          )}

          {/* 🚨 Los archivos que Josué subió desde la Fase 11 siguen aquí, en su
              propio apartado. Esta fase no se los lleva. */}
          <Card>
            <button
              onClick={() => setVerArchivos(!verArchivos)}
              className="w-full flex items-center justify-between toque-44"
              aria-label={verArchivos ? 'Ocultar los archivos subidos' : 'Ver los archivos subidos'}
            >
              <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>
                Archivos subidos{archivos.length ? ` · ${archivos.length}` : ''}
              </p>
              {verArchivos ? <ChevronUp size={15} style={{ color: COLORS.textMuted }} /> : <ChevronDown size={15} style={{ color: COLORS.textMuted }} />}
            </button>
            {verArchivos && (
              <div className="mt-2 space-y-2">
                <Field label="Qué vas a subir">
                  <Select aria-label="Tipo de archivo" value={tipoArchivo} onChange={(e) => setTipoArchivo(e.target.value)}>
                    <option value="pdf">PDF</option>
                    <option value="video">Vídeo</option>
                    <option value="foto">Foto</option>
                  </Select>
                </Field>
                <AnadirArchivo tipo={tipoArchivo} onAdd={onAddArchivo} accent={accent} />
                {archivos.length === 0 ? (
                  <EmptyHint text="Todavía no has subido ningún archivo." />
                ) : archivos.map((a) => (
                  <ItemCard
                    key={a.id}
                    item={{ ...a, _tipo: a.tipo }}
                    query=""
                    url={urlsArchivos[a.id]}
                    accent={accent}
                    onDelete={() => onDeleteArchivo(a.id, a.path)}
                    destacado={focoArchivo === a.id}
                    colecciones={colecciones}
                    tipoColeccion={onAlternarColeccion ? 'archivo' : null}
                    onAlternarColeccion={onAlternarColeccion}
                  />
                ))}
              </div>
            )}
          </Card>

          <p className="text-[11px] leading-snug" style={{ color: COLORS.textMuted }}>
            {EJEMPLO_DIFERENCIA}
          </p>
        </>
      )}

      {abiertoAhora && (
        <LecturaDocumento
          documento={abiertoAhora}
          accent={accent}
          onCerrar={() => setAbierto(null)}
          onGuardar={onUpdate}
          onEliminar={onDelete}
          colecciones={colecciones}
          onAlternarColeccion={onAlternarColeccion}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ENTREGA 3 · FASE 21 (BL F7) — COLECCIONES
   ══════════════════════════════════════════════════════════════════════════

   *"Colecciones debe sentirse como espacios personales de organización. **No
   como carpetas antiguas.** Las tarjetas deben ser visuales."*

   🚨 Y todo lo que se pinta aquí sale de **resolver referencias**: no hay ni un
   título, ni un texto, ni una URL copiados dentro de una colección. Por eso
   renombrar una nota cambia lo que se ve aquí sin que nadie sincronice nada. */

/* ⚠️ La otra mitad de los dos catálogos de `colecciones.js`: aquéllos son datos
   —una línea por icono, una por tipo— y esto son **componentes de React**. El
   mismo reparto que `MINI_APPS` / `ICONOS_MINI_APP` y `CATEGORIAS_ARMARIO` /
   `ICONOS_CATEGORIA`. Un icono que falte aquí sale como un hueco y **no falla en
   ninguna parte**, así que hay una prueba que compara las dos listas. */
const ICONOS_COLECCION = {
  FolderOpen, GraduationCap, Code, Briefcase, Heart, Rocket, Dumbbell, Sparkles,
};

const ICONOS_TIPO_ELEMENTO = {
  BookMarked, StickyNote, Bookmark, Lightbulb, FileText, Paperclip,
};

export const iconoDeColeccion = (id) => ICONOS_COLECCION[id] || FolderOpen;
export const iconoDeTipo = (id) => {
  const t = tipoElemento(id);
  return (t && ICONOS_TIPO_ELEMENTO[t.icono]) || FileText;
};

/* 🚨 *"Utilizar el sistema de colores existente. **No crear una paleta
   independiente.**"* Un acento guardado es el nombre de un token, y aquí se
   traduce — exactamente como `colorDeTipoEvento` en `tokens.js`. Nunca un hex
   dentro de una vista (regla 2). */
export function colorDeAcento(id, accent) {
  return !id || id === 'accent' ? accent : (COLORS[id] || accent);
}

/* ── El sistema único de "Añadir a colección" ──────────────────────────────

   🚨 *"En una Nota: ••• → Añadir a colección… Esto debe reutilizar el mismo
   sistema. **No crear cinco sistemas distintos.**"* Éste es. Lo montan Libros,
   Notas, Guardados, Ideas y Documentos con las mismas props, y ninguno sabe cómo
   se guarda una relación.

   ⚠️ Sin ninguna colección creada **no se pinta nada**: un botón que abre una
   lista vacía es un control decorativo (regla 8). */
export function AnadirAColeccion({ colecciones, tipo, id, accent, onAlternar }) {
  const [abierto, setAbierto] = useState(false);
  const lista = Array.isArray(colecciones) ? colecciones : [];
  if (lista.length === 0) return null;

  const dentro = coleccionesDe(lista, tipo, id);
  const activas = lista.filter((c) => !c.archivada);
  const archivadas = lista.filter((c) => c.archivada);
  const ordenadas = [...activas, ...archivadas];

  return (
    <div className="mt-2">
      <button
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-1.5 text-xs font-semibold toque-44"
        style={{ color: dentro.length > 0 ? accent : COLORS.textMuted }}
        aria-label={`Añadir a colección`}
        aria-expanded={abierto}
      >
        <FolderOpen size={13} />
        {dentro.length === 0
          ? 'Añadir a colección'
          : `En ${dentro.length === 1 ? dentro[0].nombre : `${dentro.length} colecciones`}`}
        {abierto ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {abierto && (
        <div className="mt-2 space-y-1">
          {ordenadas.map((c) => {
            const marcada = contieneElemento(c, tipo, id);
            const Icono = iconoDeColeccion(c.icono);
            return (
              <button
                key={c.id}
                onClick={() => onAlternar(c.id, tipo, id)}
                className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left toque-44"
                style={{
                  background: COLORS.surface2,
                  border: `1px solid ${marcada ? colorDeAcento(c.acento, accent) : COLORS.border}`,
                }}
                aria-label={`${marcada ? 'Quitar de' : 'Añadir a'} ${c.nombre}`}
                aria-pressed={marcada}
              >
                <Icono size={14} style={{ color: colorDeAcento(c.acento, accent) }} />
                <span className="text-xs flex-1 truncate" style={{ color: COLORS.text }}>{c.nombre}</span>
                {c.archivada ? (
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>Archivada</span>
                ) : null}
                {marcada ? <Check size={14} style={{ color: colorDeAcento(c.acento, accent) }} /> : <Plus size={14} style={{ color: COLORS.textMuted }} />}
              </button>
            );
          })}
          {/* ⚠️ Se dice qué hace quitar, porque es la duda entera de esta fase. */}
          <p className="text-[11px] leading-snug" style={{ color: COLORS.textMuted }}>
            Quitarlo de una colección no lo elimina de tu biblioteca.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── La tarjeta ────────────────────────────────────────────────────────────

   *"Cada colección puede tener: icono, color/acento, número de elementos,
   preview de algunos elementos. **La preview debe utilizar datos reales.**"* */
export function TarjetaColeccion({ coleccion, datos, accent, indice = 0, onAbrir }) {
  const Icono = iconoDeColeccion(coleccion.icono);
  const color = colorDeAcento(coleccion.acento, accent);
  const n = contarColeccion(coleccion, datos);
  const tipos = tiposDe(coleccion, datos);
  const preview = previewDe(coleccion, datos);

  return (
    <button
      onClick={onAbrir}
      className={`w-full text-left ${CLASE_TARJETA}`}
      style={{ animationDelay: retrasoDeTarjeta(indice) }}
      aria-label={`Abrir la colección ${coleccion.nombre}`}
    >
      <Card style={{ padding: '1rem', borderLeft: `3px solid ${color}` }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: COLORS.surface2 }}>
            <Icono size={19} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold truncate" style={{ color: COLORS.text }}>{coleccion.nombre}</p>
              {coleccion.favorita ? <Star size={12} style={{ color }} fill={color} /> : null}
              {coleccion.archivada ? (
                <span className="text-[10px] rounded-full px-1.5 py-0.5" style={{ background: COLORS.surface2, color: COLORS.textMuted }}>Archivada</span>
              ) : null}
            </div>
            {coleccion.descripcion ? (
              <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.textMuted }}>{coleccion.descripcion}</p>
            ) : null}
            {/* ⚠️ **Sin elementos no se enseña "0 elementos"**: se dice que está
                vacía, que es lo que hay que hacer con ella. */}
            <p className="text-xs mt-1.5 font-semibold" style={{ color }}>
              {n === 0 ? 'Vacía' : `${n} ${n === 1 ? 'elemento' : 'elementos'}`}
            </p>
            {tipos.length > 0 ? (
              <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>{tipos.join(' · ')}</p>
            ) : null}
            {preview.length > 0 ? (
              <div className="flex items-center gap-1.5 mt-2">
                {preview.map((p) => {
                  const IconoTipo = iconoDeTipo(p.tipo);
                  return (
                    <div key={`${p.tipo}-${p.ref.id}`} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: COLORS.surface2 }}>
                      <IconoTipo size={12} style={{ color: COLORS.textMuted }} />
                    </div>
                  );
                })}
                {n > preview.length ? (
                  <span className="text-[11px]" style={{ color: COLORS.textMuted }}>+{n - preview.length}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </button>
  );
}

/* ── El formulario ─────────────────────────────────────────────────────────

   *"Nombre: obligatorio. Descripción: opcional. Icono: seleccionable.
   Color/acento: opcional."* Cuatro campos y ni uno más. */
export function FormularioColeccion({ coleccion = null, accent, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    nombre: coleccion?.nombre || '',
    descripcion: coleccion?.descripcion || '',
    icono: coleccion?.icono || ICONO_POR_DEFECTO,
    acento: coleccion?.acento || ACENTO_POR_DEFECTO,
  });
  const valido = !!crearColeccion(form);

  return (
    <Card>
      <Field label="Nombre">
        <TextInput
          aria-label="Nombre de la colección"
          value={form.nombre}
          onChange={(ev) => setForm({ ...form, nombre: ev.target.value })}
          placeholder="Ej: Estudios"
        />
      </Field>
      <Field label="Descripción (opcional)">
        <TextInput
          aria-label="Descripción de la colección"
          value={form.descripcion}
          onChange={(ev) => setForm({ ...form, descripcion: ev.target.value })}
          placeholder="Para qué es esta colección"
        />
      </Field>

      <Field label="Icono">
        <div className="flex flex-wrap gap-2">
          {ICONOS_DISPONIBLES.map((i) => {
            const Icono = iconoDeColeccion(i.id);
            const puesto = form.icono === i.id;
            return (
              <button
                key={i.id}
                onClick={() => setForm({ ...form, icono: i.id })}
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: COLORS.surface2,
                  border: `1px solid ${puesto ? colorDeAcento(form.acento, accent) : COLORS.border}`,
                }}
                aria-label={`Icono ${i.nombre}`}
                aria-pressed={puesto}
              >
                <Icono size={17} style={{ color: puesto ? colorDeAcento(form.acento, accent) : COLORS.textMuted }} />
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Color">
        <div className="flex flex-wrap gap-2">
          {ACENTOS_COLECCION.map((a) => {
            const puesto = form.acento === a.id;
            const color = colorDeAcento(a.id, accent);
            return (
              <button
                key={a.id}
                onClick={() => setForm({ ...form, acento: a.id })}
                className="rounded-full px-3 py-1.5 text-xs font-semibold toque-44"
                style={{
                  background: puesto ? color : COLORS.surface2,
                  color: puesto ? COLORS.textOnAccent : COLORS.textMuted,
                  border: `1px solid ${puesto ? color : COLORS.border}`,
                }}
                aria-label={`Color ${a.nombre}`}
                aria-pressed={puesto}
              >
                {a.nombre}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="flex gap-2 mt-2">
        <PrimaryButton
          accent={accent}
          disabled={!valido}
          onClick={() => onGuardar(form)}
        >
          {coleccion ? 'Guardar cambios' : 'Crear colección'}
        </PrimaryButton>
        <GhostBtn onClick={onCancelar}>Cancelar</GhostBtn>
      </div>
    </Card>
  );
}

/* ── El selector de contenido ──────────────────────────────────────────────

   *"+ Añadir. Mostrar selector: Libros, Notas, Guardados, Ideas, Documentos.
   **Permitir seleccionar múltiples elementos.** Botón: Añadir seleccionados."*

   ⚠️ Las pestañas salen del **catálogo**, no de un `if` por tipo: un tipo nuevo
   trae su pestaña sola. Y **lo que ya está dentro no se ofrece**: volver a
   marcarlo no haría nada y parecería roto. */
export function SelectorDeElementos({ coleccion, datos, accent, onCancelar, onAnadir }) {
  const [tipo, setTipo] = useState(TIPOS_ELEMENTO[0].id);
  const [texto, setTexto] = useState('');
  const [marcados, setMarcados] = useState([]);

  const t = tipoElemento(tipo);
  const origen = t.de === 'archivos'
    ? (datos.archivos || [])
    : ((datos.biblioteca || {})[t.coleccion] || []);
  const q = texto.trim().toLowerCase();
  const disponibles = origen
    .filter((x) => x && !contieneElemento(coleccion, tipo, x.id))
    .filter((x) => !q || t.textos(x).filter(Boolean).join(' ').toLowerCase().includes(q));

  const marcado = (id) => marcados.some((m) => m.tipo === tipo && m.id === id);
  const alternar = (id) => setMarcados(marcado(id)
    ? marcados.filter((m) => !(m.tipo === tipo && m.id === id))
    : [...marcados, { tipo, id }]);

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm font-bold" style={{ color: COLORS.text }}>Añadir contenido</p>
        <GhostBtn onClick={onCancelar}>Cancelar</GhostBtn>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {TIPOS_ELEMENTO.map((x) => (
          <FiltroPill key={x.id} active={tipo === x.id} accent={accent} onClick={() => { setTipo(x.id); setTexto(''); }}>
            {x.plural}
          </FiltroPill>
        ))}
      </div>

      {origen.length >= 4 && (
        <div className="relative mt-2">
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
          <TextInput
            aria-label={`Buscar en ${t.plural.toLowerCase()}`}
            value={texto}
            onChange={(ev) => setTexto(ev.target.value)}
            placeholder={`Buscar en ${t.plural.toLowerCase()}…`}
            style={{ paddingLeft: 34 }}
          />
        </div>
      )}

      <div className="space-y-1 mt-2">
        {disponibles.length === 0 ? (
          <EmptyHint text={
            origen.length === 0
              ? `Todavía no tienes ${t.plural.toLowerCase()} en tu biblioteca.`
              : q
                ? 'Nada coincide con esta búsqueda.'
                : `Ya has añadido todos tus ${t.plural.toLowerCase()} a esta colección.`
          } />
        ) : disponibles.map((x) => {
          const IconoTipo = iconoDeTipo(tipo);
          const puesto = marcado(x.id);
          return (
            <button
              key={x.id}
              onClick={() => alternar(x.id)}
              className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left toque-44"
              style={{ background: COLORS.surface2, border: `1px solid ${puesto ? accent : COLORS.border}` }}
              aria-label={`${puesto ? 'Quitar de la selección' : 'Seleccionar'} ${nombreDelElemento(tipo, x)}`}
              aria-pressed={puesto}
            >
              <IconoTipo size={14} style={{ color: puesto ? accent : COLORS.textMuted }} />
              <span className="text-xs flex-1 truncate" style={{ color: COLORS.text }}>{nombreDelElemento(tipo, x)}</span>
              {puesto ? <Check size={14} style={{ color: accent }} /> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <PrimaryButton
          accent={accent}
          disabled={marcados.length === 0}
          onClick={() => { onAnadir(marcados); setMarcados([]); }}
        >
          {marcados.length === 0
            ? 'Añadir seleccionados'
            : `Añadir ${marcados.length} seleccionado${marcados.length === 1 ? '' : 's'}`}
        </PrimaryButton>
      </div>
    </Card>
  );
}

/* ── El detalle: dentro de una colección ───────────────────────────────────

   *"Al tocar una colección: mostrar nombre, descripción, número de elementos.
   Después: CONTENIDO, agrupado visualmente por tipo. **No mostrar categorías
   vacías.**"* */
export function DetalleColeccion({
  coleccion, datos, accent, onCerrar, onGuardar, onEliminar, onAbrirOriginal,
}) {
  const [editando, setEditando] = useState(false);
  const [anadiendo, setAnadiendo] = useState(false);
  const [filtro, setFiltro] = useState('todo');
  const [orden, setOrden] = useState(ORDEN_DENTRO_POR_DEFECTO);
  const [texto, setTexto] = useState('');

  useEffect(() => {
    const alPulsar = (ev) => { if (ev.key === 'Escape') onCerrar(); };
    if (typeof document !== 'undefined') document.addEventListener('keydown', alPulsar);
    return () => { if (typeof document !== 'undefined') document.removeEventListener('keydown', alPulsar); };
  }, [onCerrar]);

  if (!coleccion) return null;

  const color = colorDeAcento(coleccion.acento, accent);
  const Icono = iconoDeColeccion(coleccion.icono);
  const resueltos = elementosDeColeccion(coleccion, datos);
  const visibles = ordenarDentro(filtrarDentro(buscarDentro(resueltos, texto), filtro), orden);
  const grupos = agruparPorTipo(visibles);
  const aviso = avisoDeEliminar(coleccion, datos);

  const contenido = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto pantalla-segura"
      style={{ background: COLORS.bg }}
      role="dialog"
      aria-label={`Colección ${coleccion.nombre}`}
    >
      <div className="max-w-md mx-auto px-4 pb-8 space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <button onClick={onCerrar} className="p-1.5 -m-1.5" aria-label="Cerrar la colección">
            <ArrowLeft size={18} style={{ color: COLORS.textMuted }} />
          </button>
          <Icono size={17} style={{ color }} />
          <p className="text-base font-bold flex-1 truncate" style={{ color: COLORS.text }}>{coleccion.nombre}</p>
        </div>

        {editando ? (
          <FormularioColeccion
            coleccion={coleccion}
            accent={accent}
            onCancelar={() => setEditando(false)}
            onGuardar={(cambios) => { onGuardar(editarColeccion(coleccion, cambios)); setEditando(false); }}
          />
        ) : (
          <>
            <Card style={{ borderLeft: `3px solid ${color}` }}>
              {coleccion.descripcion ? (
                <p className="text-sm leading-relaxed" style={{ color: COLORS.text }}>{coleccion.descripcion}</p>
              ) : null}
              <p className="text-xs mt-1 font-semibold" style={{ color }}>
                {resueltos.length === 0 ? 'Sin contenido todavía' : `${resueltos.length} ${resueltos.length === 1 ? 'elemento' : 'elementos'}`}
              </p>
              {coleccion.archivada ? (
                <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>
                  Archivada. Su contenido sigue intacto en su mini-app.
                </p>
              ) : null}
            </Card>

            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <GhostBtn icon={Plus} onClick={() => setAnadiendo(!anadiendo)}>Añadir contenido</GhostBtn>
                <GhostBtn icon={Star} onClick={() => onGuardar(alternarFavoritaColeccion(coleccion))}>
                  {coleccion.favorita ? 'Quitar de favoritas' : 'Favorita'}
                </GhostBtn>
                <GhostBtn icon={Pencil} onClick={() => setEditando(true)}>Editar</GhostBtn>
                <GhostBtn
                  icon={Archive}
                  onClick={() => onGuardar(coleccion.archivada ? desarchivarColeccion(coleccion) : archivarColeccion(coleccion))}
                >
                  {coleccion.archivada ? 'Sacar del archivo' : 'Archivar'}
                </GhostBtn>
                <BotonBorrar onClick={() => { onEliminar(coleccion.id); onCerrar(); }} label="Eliminar la colección" />
              </div>
              {/* 🚨 *"Mostrar claramente: «Los elementos de esta colección no se
                  eliminarán»."* Y es verdad por construcción: esta pantalla no
                  tiene ninguna función capaz de tocar la lista de un elemento. */}
              <p className="text-[11px] mt-2 leading-snug" style={{ color: COLORS.textMuted }}>
                Archivar la saca de las activas sin tocar su contenido. {aviso.seQueda}
              </p>
            </Card>

            {anadiendo && (
              <SelectorDeElementos
                coleccion={coleccion}
                datos={datos}
                accent={accent}
                onCancelar={() => setAnadiendo(false)}
                onAnadir={(refs) => { onGuardar(anadirElementos(coleccion, refs)); setAnadiendo(false); }}
              />
            )}

            {resueltos.length === 0 ? (
              <Card>
                <p className="text-sm font-bold" style={{ color: COLORS.text }}>{VACIO_DENTRO.titulo}</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: COLORS.textMuted }}>{VACIO_DENTRO.frase}</p>
                <div className="mt-3">
                  <PrimaryButton accent={accent} icon={Plus} onClick={() => setAnadiendo(true)}>{VACIO_DENTRO.boton}</PrimaryButton>
                </div>
              </Card>
            ) : (
              <>
                {resueltos.length >= 4 && (
                  <div className="relative">
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
                    <TextInput
                      aria-label="Buscar en esta colección"
                      value={texto}
                      onChange={(ev) => setTexto(ev.target.value)}
                      placeholder="Buscar en esta colección…"
                      style={{ paddingLeft: 34 }}
                    />
                  </div>
                )}

                <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {FILTROS_DENTRO.map((f) => (
                    <FiltroPill key={f.id} active={filtro === f.id} accent={accent} onClick={() => setFiltro(f.id)}>{f.label}</FiltroPill>
                  ))}
                </div>

                <Field label="Ordenar por">
                  <Select aria-label="Ordenar el contenido de la colección" value={orden} onChange={(ev) => setOrden(ev.target.value)}>
                    {ORDENES_DENTRO.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </Select>
                </Field>

                {visibles.length === 0 ? (
                  <EmptyHint text="Nada coincide con esta búsqueda o este filtro." />
                ) : orden === 'recientes' || orden === 'alfabetico' ? (
                  /* Agrupado por tipo salvo cuando el orden pedido es otro: si
                     "Tipo" ya ordena, agrupar además sería decirlo dos veces. */
                  grupos.map((g) => (
                    <div key={g.tipo.id} className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
                        {g.tipo.emoji} {g.tipo.plural}
                      </p>
                      {g.elementos.map((r) => (
                        <FilaDeColeccion
                          key={`${r.tipo}-${r.ref.id}`}
                          resuelto={r}
                          accent={accent}
                          onAbrir={() => onAbrirOriginal(r.tipo, r.ref.id)}
                          onQuitar={() => onGuardar(quitarElemento(coleccion, r.tipo, r.ref.id))}
                        />
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="space-y-1.5">
                    {visibles.map((r) => (
                      <FilaDeColeccion
                        key={`${r.tipo}-${r.ref.id}`}
                        resuelto={r}
                        accent={accent}
                        onAbrir={() => onAbrirOriginal(r.tipo, r.ref.id)}
                        onQuitar={() => onGuardar(quitarElemento(coleccion, r.tipo, r.ref.id))}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  return typeof document === 'undefined' ? contenido : createPortal(contenido, document.body);
}

/* Una fila dentro de una colección. Al pulsarla **se abre el elemento
   original**; el botón de la derecha quita **solo la relación**. */
export function FilaDeColeccion({ resuelto, accent, onAbrir, onQuitar }) {
  const IconoTipo = iconoDeTipo(resuelto.tipo);
  const t = tipoElemento(resuelto.tipo);
  const nombre = nombreDelElemento(resuelto.tipo, resuelto.elemento);
  return (
    <Card style={{ padding: '0.7rem 0.85rem' }}>
      <div className="flex items-center gap-2">
        <button
          onClick={onAbrir}
          className="flex items-center gap-2 flex-1 min-w-0 text-left toque-44"
          aria-label={`Abrir ${nombre}`}
        >
          <IconoTipo size={15} style={{ color: accent, flexShrink: 0 }} />
          <span className="text-sm truncate" style={{ color: COLORS.text }}>{nombre}</span>
        </button>
        <span className="text-[10px] flex-shrink-0" style={{ color: COLORS.textMuted }}>{t ? t.nombre : ''}</span>
        {/* ⚠️ **No es una papelera**, y por eso no lleva el icono de una: quitar
            de la colección **no borra nada**. Un icono de basura aquí haría creer
            lo contrario, y ese miedo es lo que el enunciado quiere evitar. */}
        <button
          onClick={onQuitar}
          className="p-1.5 -m-1.5 flex-shrink-0"
          aria-label={`Quitar ${nombre} de la colección`}
          title="Quitar de la colección"
        >
          <Minus size={15} style={{ color: COLORS.textMuted }} />
        </button>
      </div>
    </Card>
  );
}

/* ── La pantalla ───────────────────────────────────────────────────────────

   *"Colecciones. «Organiza tu biblioteca.» Botón: + Nueva colección. Mostrar
   las colecciones como tarjetas visuales."* */
export function PantallaColecciones({
  colecciones, datos, cabecera, crear, onCerrarCrear, onAbrirCrear, accent,
  onAdd, onUpdate, onDelete, onAbrirOriginal,
}) {
  const [filtro, setFiltro] = useState(FILTRO_COLECCIONES_POR_DEFECTO);
  const [orden, setOrden] = useState(ORDEN_COLECCIONES_POR_DEFECTO);
  const [texto, setTexto] = useState('');
  const [abierta, setAbierta] = useState(null);

  const stats = estadisticasColecciones(colecciones, datos);
  const linea = lineaColecciones(colecciones, datos);
  const visibles = ordenarColecciones(
    buscarColecciones(filtrarColecciones(colecciones, filtro), texto),
    orden,
    datos,
  );
  const abiertaAhora = abierta ? colecciones.find((c) => c.id === abierta) || null : null;

  return (
    <div className="space-y-3 pb-4">
      {cabecera}
      {linea ? <p className="text-xs font-semibold" style={{ color: accent }}>{linea}</p> : null}

      {crear && (
        <FormularioColeccion
          accent={accent}
          onCancelar={onCerrarCrear}
          onGuardar={(form) => { onAdd(crearColeccion(form)); onCerrarCrear(); }}
        />
      )}

      {colecciones.length === 0 ? (
        <Card>
          <p className="text-sm font-bold" style={{ color: COLORS.text }}>{VACIO_COLECCIONES.titulo}</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: COLORS.textMuted }}>{VACIO_COLECCIONES.frase}</p>
          <div className="mt-3">
            <PrimaryButton accent={accent} icon={Plus} onClick={onAbrirCrear}>{VACIO_COLECCIONES.boton}</PrimaryButton>
          </div>
        </Card>
      ) : (
        <>
          {colecciones.length >= 4 && (
            <div className="relative">
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
              <TextInput
                aria-label="Buscar entre las colecciones"
                value={texto}
                onChange={(ev) => setTexto(ev.target.value)}
                placeholder="Buscar por nombre o descripción…"
                style={{ paddingLeft: 34 }}
              />
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {FILTROS_COLECCIONES.map((f) => (
              <FiltroPill key={f.id} active={filtro === f.id} accent={accent} onClick={() => setFiltro(f.id)}>{f.label}</FiltroPill>
            ))}
          </div>

          <Field label="Ordenar por">
            <Select aria-label="Ordenar las colecciones" value={orden} onChange={(ev) => setOrden(ev.target.value)}>
              {ORDENES_COLECCIONES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </Select>
          </Field>

          {visibles.length === 0 ? (
            <EmptyHint text={filtro === 'archivadas' ? 'No has archivado ninguna colección.' : 'Nada coincide con esta búsqueda o este filtro.'} />
          ) : (
            <div className="space-y-2">
              {visibles.map((c, i) => (
                <TarjetaColeccion
                  key={c.id}
                  coleccion={c}
                  datos={datos}
                  accent={accent}
                  indice={i}
                  onAbrir={() => setAbierta(c.id)}
                />
              ))}
            </div>
          )}

          {/* *"ESTADÍSTICAS. Mostrar información sencilla… no crear estadísticas
              complejas."* Cuatro cifras, todas derivadas en el momento. */}
          <Card>
            <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: COLORS.textMuted }}>Resumen</p>
            <div className="grid grid-cols-3 gap-2">
              <Cifra n={stats.total} label="Total" accent={accent} />
              <Cifra n={stats.activas} label="Activas" accent={accent} />
              <Cifra n={stats.archivadas} label="Archivadas" accent={accent} />
            </div>
            <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
              {stats.elementosOrganizados === 0
                ? 'Todavía no has organizado ningún elemento.'
                : `${stats.elementosOrganizados} ${stats.elementosOrganizados === 1 ? 'elemento organizado' : 'elementos organizados'}.`}
              {stats.coleccionMasGrande
                ? ` La más llena es ${stats.coleccionMasGrande.nombre}, con ${stats.coleccionMasGrande.elementos}.`
                : ''}
            </p>
          </Card>
        </>
      )}

      {abiertaAhora && (
        <DetalleColeccion
          coleccion={abiertaAhora}
          datos={datos}
          accent={accent}
          onCerrar={() => setAbierta(null)}
          onGuardar={onUpdate}
          onEliminar={onDelete}
          onAbrirOriginal={(tipo, id) => { setAbierta(null); onAbrirOriginal(tipo, id); }}
        />
      )}
    </div>
  );
}

function Cifra({ n, label, accent }) {
  return (
    <div className="rounded-xl px-2 py-2 text-center" style={{ background: COLORS.surface2 }}>
      <p className="text-lg font-bold" style={{ color: accent }}>{n}</p>
      <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{label}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ENTREGA 3 · FASE 22 (BL F8) — INTEGRACIÓN Y EXPERIENCIA GLOBAL
   ══════════════════════════════════════════════════════════════════════════

   *"Todo debe sentirse como una única Biblioteca, no como seis módulos
   pegados."*

   🚨 Nada de lo que hay aquí guarda un dato: Recientes, la búsqueda, los
   favoritos y los contadores **se derivan** de las listas que ya existen. Por
   eso, en cuanto Josué toca una nota, sube sola en Recientes sin que nadie
   sincronice nada. */

/* La etiqueta de tipo que pide el apartado 27 (`ContentTypeBadge`). Una, usada
   por Recientes, por la búsqueda y por los favoritos — no tres. */
export function EtiquetaDeTipo({ tipo }) {
  const t = tipoBiblioteca(tipo);
  if (!t) return null;
  return (
    <span className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 whitespace-nowrap" style={{ background: COLORS.surface2, color: COLORS.textMuted }}>
      {t.nombre}
    </span>
  );
}

/* La fila de un elemento cualquiera de la Biblioteca (`RecentItem` del apartado
   27). *"Al pulsar un elemento: **abrir directamente el contenido original**"* —
   por eso solo recibe el tipo y el id, y quien navega es la pantalla. */
export function FilaDeBiblioteca({ tipo, nombre, detalle, accent, indice = 0, onAbrir }) {
  const Icono = iconoDeTipo(tipo);
  return (
    <button
      onClick={onAbrir}
      className={`w-full text-left ${CLASE_TARJETA}`}
      style={{ animationDelay: retrasoDeTarjeta(indice) }}
      aria-label={`Abrir ${nombre}`}
    >
      <Card style={{ padding: '0.7rem 0.85rem' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: COLORS.surface2 }}>
            <Icono size={15} style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{nombre}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <EtiquetaDeTipo tipo={tipo} />
              {detalle ? <span className="text-[11px]" style={{ color: COLORS.textMuted }}>{detalle}</span> : null}
            </div>
          </div>
        </div>
      </Card>
    </button>
  );
}

/* ── La búsqueda global de la Biblioteca ──────────────────────────────────

   *"La búsqueda debe sentirse instantánea. **No abrir una página nueva
   obligatoriamente.** Puede utilizar: barra desplegable, overlay, modal, página
   dedicada. Elegir la opción que mejor encaje con la arquitectura existente."*

   ⚠️ Se despliega **debajo de la caja**, sin overlay: es lo que ya hacen el resto
   de buscadores de la Biblioteca, y en un iPhone con el teclado abierto un modal
   deja la lista en los 200 px que quedan.

   ⚠️ Y el retardo es `DEBOUNCE_BUSQUEDA_MS`, el que usa toda la aplicación
   (EH F44): escribir aquí un número a mano sería el segundo retardo. */
export function BuscadorDeBiblioteca({ datos, accent, onAbrirOriginal }) {
  const [texto, setTexto] = useState('');
  const [consulta, setConsulta] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setConsulta(texto), DEBOUNCE_BUSQUEDA_MS);
    return () => clearTimeout(t);
  }, [texto]);

  const resultados = buscarEnBiblioteca(datos, consulta, LIMITE_RESULTADOS);
  const resumen = resumenDeBusqueda(resultados);
  const buscando = consulta.trim().length > 0;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
        <TextInput
          aria-label="Buscar en la Biblioteca"
          value={texto}
          onChange={(ev) => setTexto(ev.target.value)}
          placeholder="Buscar en Biblioteca…"
          style={{ paddingLeft: 34 }}
        />
        {texto ? (
          <button
            onClick={() => { setTexto(''); setConsulta(''); }}
            className="absolute p-1.5"
            style={{ right: 6, top: '50%', transform: 'translateY(-50%)' }}
            aria-label="Borrar la búsqueda"
          >
            <X size={15} style={{ color: COLORS.textMuted }} />
          </button>
        ) : null}
      </div>

      {buscando && (
        resultados.length === 0 ? (
          <EmptyHint text="Nada en tu biblioteca coincide con esta búsqueda." />
        ) : (
          <>
            {/* *"Cada resultado debe indicar claramente su tipo"*, y arriba
                cuántos hay de cada uno — solo de los que tienen alguno. */}
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
              {resumen.map((r) => `${r.n} ${r.n === 1 ? tipoBiblioteca(r.tipo).nombre.toLowerCase() : r.etiqueta.toLowerCase()}`).join(' · ')}
            </p>
            <div className="space-y-1.5">
              {resultados.map((r, i) => (
                <FilaDeBiblioteca
                  key={`${r.tipo}-${r.id}`}
                  tipo={r.tipo}
                  nombre={r.nombre}
                  accent={accent}
                  indice={i}
                  onAbrir={() => onAbrirOriginal(r.tipo, r.id)}
                />
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}

/* ── Las acciones rápidas ─────────────────────────────────────────────────

   *"Desde Biblioteca: ＋ … Esto permite crear contenido sin entrar primero en
   una mini-app."*

   ⚠️ **Y no hay seis formularios aquí**: cada acción abre su mini-app con el
   creador desplegado, que es el formulario que ya existe. Escribir otros seis
   sería el duplicado que prohíbe el apartado 27. */
export function AccionesRapidas({ accent, onCrearEn, onCerrar }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm font-bold" style={{ color: COLORS.text }}>Crear</p>
        <GhostBtn onClick={onCerrar}>Cancelar</GhostBtn>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ACCIONES_RAPIDAS.map((a) => {
          const Icono = ICONOS_MINI_APP[a.icono] || FileText;
          return (
            <button
              key={a.id}
              onClick={() => onCrearEn(a.miniApp)}
              className="flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-left toque-44"
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
              aria-label={a.etiqueta}
            >
              <Icono size={15} style={{ color: accent, flexShrink: 0 }} />
              <span className="text-xs truncate" style={{ color: COLORS.text }}>{a.etiqueta}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ── La pantalla principal ────────────────────────────────────────────────

   El orden es el del apartado 34: cabecera, los seis cuadraditos, Recientes,
   buscar, favoritos, crear. */
export function PantallaBiblioteca({ datos, accent, onAbrirMiniApp, onAbrirOriginal, onCrearEn }) {
  const [creando, setCreando] = useState(false);
  const ultimos = recientes(datos, MAX_RECIENTES);
  const favoritos = favoritosDe(datos);
  const total = totalElementos(datos);

  return (
    <div className="space-y-4 pb-4">
      <div>
        <SectionTitle>{CABECERA_BIBLIOTECA.titulo}</SectionTitle>
        <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{CABECERA_BIBLIOTECA.frase}</p>
      </div>

      {/* *"Mantener los 6 cuadraditos como elemento PROTAGONISTA"*: van los
          primeros y ocupan la pantalla, con su contador real debajo. */}
      <div className="grid grid-cols-2 gap-3">
        {MINI_APPS.map((app, i) => (
          <TarjetaMiniApp
            key={app.id}
            app={app}
            indice={i}
            indicador={indicadorDe(app.id, datos)}
            accent={accent}
            onAbrir={() => onAbrirMiniApp(app.id)}
          />
        ))}
      </div>

      {/* El ＋ de crear cualquier cosa sin entrar antes en una mini-app. */}
      {creando ? (
        <AccionesRapidas
          accent={accent}
          onCerrar={() => setCreando(false)}
          onCrearEn={(id) => { setCreando(false); onCrearEn(id); }}
        />
      ) : (
        <button
          onClick={() => setCreando(true)}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 toque-44"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: accent }}
          aria-label="Crear algo nuevo en la Biblioteca"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span className="text-xs font-semibold">Crear</span>
        </button>
      )}

      {/* La búsqueda global: solo cuando hay algo que buscar. Una caja de
          búsqueda sobre una biblioteca vacía es un control que no hace nada. */}
      {total > 0 && <BuscadorDeBiblioteca datos={datos} accent={accent} onAbrirOriginal={onAbrirOriginal} />}

      {/* 🕘 Recientes. *"Esta sección es MUY IMPORTANTE."* Y no es una séptima
          mini-app: vive solo aquí. */}
      {ultimos.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>🕘 Recientes</p>
          <div className="space-y-1.5">
            {ultimos.map((r, i) => (
              <FilaDeBiblioteca
                key={`${r.tipo}-${r.id}`}
                tipo={r.tipo}
                nombre={r.nombre}
                detalle={r.hace}
                accent={accent}
                indice={i}
                onAbrir={() => onAbrirOriginal(r.tipo, r.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ⭐ Favoritos. *"Solo mostrarla si existen favoritos"*: sin ninguno, la
          sección no existe. */}
      {favoritos.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>⭐ Favoritos</p>
          <div className="space-y-1.5">
            {favoritos.map((f, i) => (
              <FilaDeBiblioteca
                key={`${f.tipo}-${f.id}`}
                tipo={f.tipo}
                nombre={f.nombre}
                accent={accent}
                indice={i}
                onAbrir={() => onAbrirOriginal(f.tipo, f.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
