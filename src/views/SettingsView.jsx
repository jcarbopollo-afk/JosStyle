import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  User, Download, Upload, RotateCcw, Undo2, Lock, LogOut, ArrowLeft, Search, ChevronRight,
  Palette, LayoutGrid, SlidersHorizontal, Bell, ShieldCheck,
  Database, RefreshCw, Puzzle, Accessibility, Info, EyeOff, Plus, Trash2, Image as ImageIcon, Loader2, Sparkles, Copy, Star, ChevronUp, Type,
} from 'lucide-react';
import pkg from '../../package.json';
import {
  COLORS, ACCENTS, ACTIVIDAD_FACTORES, DEFAULT_PERFIL,
  SEXOS_PERFIL, MANOS_DOMINANTES, OBJETIVOS_PRINCIPALES, DEPORTES_DISPONIBLES,
  NIVELES_DEPORTIVOS, ANIOS_EXPERIENCIA_OPCIONES, ESTADOS_LESION, NIVELES_EDUCATIVOS,
  IDIOMAS_DISPONIBLES, SISTEMAS_UNIDADES,
  DEFAULT_APARIENCIA, TEMAS_DISPONIBLES, TAMANOS_TEXTO, DENSIDADES_INTERFAZ, RADIOS_BORDE, NIVELES_ANIMACION,
  DEFAULT_NOTIFICACIONES, CATEGORIAS_NOTIFICACION,
  OPCIONES_BLOQUEO_AUTOMATICO, ACCIONES_PROTEGIBLES, OPCIONES_SESION_PIN,
} from '../tokens';
import { calcularEdad, shade, hexToRgba, uid, todayISO } from '../lib/helpers';
import { permisoNotificaciones, pedirPermisoNotificaciones } from '../lib/notificaciones';
import { biometriaSoportada, registrarBiometria } from '../lib/biometria';
import { Card, Field, TextInput, Select, GhostBtn, SectionTitle, PrimaryButton, BotonBorrar } from '../components/ui';
import PersonalizationView from './PersonalizationView';
import PapeleraView from './PapeleraView';
import {
  TIPOS_FONDO, FONDOS_INCLUIDOS, POSICIONES_FONDO, seleccionarFondo, ajustarFondo,
  restablecerFondo, describirFondo, tieneFondoGuardado, resolverFondo, estilosDeFondo,
  estilosDeVelo, datosDeFoto, validarFotoFondo, aplicarFoto, quitarFoto, tieneFoto,
  orientacionDeFoto, estilosDeLuminosidad, restablecerAjustes, tieneAjustes,
  aplicarFotoConAjustes,
} from '../lib/fondos';
import { normalizarTema, restablecerColores, tieneColoresPersonalizados } from '../lib/temaColores';
import { analizarImagen, analisisValidoPara, sellarAnalisis, describirColor } from '../lib/detectorColores';
import { generarPropuestas, aplicarPropuesta, guardarApariencia } from '../lib/recomendadorApariencia';
import { optimizarImagen, ahorroDe } from '../lib/imagenes';
import {
  MAX_PRESETS, crearPreset, aplicarPreset, listaPresets, presetActivo,
  duplicarPreset, actualizarPreset, alternarFavorito, esEditable,
} from '../lib/presetsApariencia';
import {
  revisarLegibilidad, propuestasSobreFoto, correccionesDe, hayCorrecciones, resumenLegibilidad,
} from '../lib/legibilidad';
import ColorPicker from '../components/ColorPicker';
import TemaBuilder from '../components/TemaBuilder';
import GestionTemas from '../components/GestionTemas';

// ─────────────────────────────────────────────────────────────────────────
// Fase A1 — Ajustes: arquitectura general (Entrega 1 de la especificación
// extendida, apartados 1-48 — ver ESPECIFICACION_AJUSTES_ENTREGA1.md).
// Ajustes deja de ser una única pantalla larga y pasa a ser un centro de
// categorías: cabecera con buscador -> tarjetas de categoría -> pantalla
// propia por categoría, con botón atrás. Sigue sin haber botones "Guardar":
// cada campo sigue confirmando al vuelo (onBlur/onChange), igual que antes.
//
// Cada categoría de `useCategorias()` renderiza su propio contenido real más
// abajo (nunca un aviso genérico de "todavía no" — mismo criterio que el
// resto de la app: nunca simular una función que no existe, y nunca explicar
// dentro de la propia app en qué fase de construcción está algo). Las
// categorías puramente informativas (Preferencias, Sincronización,
// Integraciones, Accesibilidad) redirigen a dónde vive de verdad ese control
// en vez de duplicarlo. Información lee la versión real de package.json.
// ─────────────────────────────────────────────────────────────────────────

// Orden estable a propósito (apartado 4 de la especificación) — nunca reordenar automáticamente.
function useCategorias() {
  return useMemo(() => ([
    { id: 'perfil', label: 'Perfil', desc: 'Tu información personal, usada por el sistema.', icon: User, listo: true },
    { id: 'apariencia', label: 'Apariencia', desc: 'Tema, acento, texto, bordes y animaciones.', icon: Palette, listo: true },
    { id: 'pantalla-principal', label: 'Pantalla principal', desc: 'Qué ves en "Hoy" y en el menú "Más".', icon: LayoutGrid, listo: true },
    { id: 'preferencias', label: 'Preferencias generales', desc: 'Idioma, zona horaria, país y unidades.', icon: SlidersHorizontal, listo: true, soloInfo: true },
    { id: 'notificaciones', label: 'Notificaciones', desc: 'Permiso, categorías y horario de descanso.', icon: Bell, listo: true },
    { id: 'seguridad', label: 'Seguridad', desc: 'PIN, biometría y cierre de sesión.', icon: Lock, listo: true },
    { id: 'privacidad', label: 'Privacidad', desc: 'Transparencia, qué usa la IA y borrado por categoría.', icon: EyeOff, listo: true },
    { id: 'datos', label: 'Datos', desc: 'Copia de seguridad y exportación.', icon: Database, listo: true },
    { id: 'papelera', label: 'Eliminados recientemente', desc: 'Recupera lo que hayas borrado por error.', icon: Trash2, listo: true },
    { id: 'sincronizacion', label: 'Sincronización', desc: 'Tus datos entre dispositivos.', icon: RefreshCw, listo: true, soloInfo: true },
    { id: 'integraciones', label: 'Integraciones', desc: 'Conexiones con otros servicios.', icon: Puzzle, listo: true, soloInfo: true },
    { id: 'accesibilidad', label: 'Accesibilidad', desc: 'Tamaño de texto y reducir movimiento ya están en Apariencia.', icon: Accessibility, listo: true, soloInfo: true },
    { id: 'informacion', label: 'Información', desc: 'Versión, créditos e información técnica.', icon: Info, listo: true },
  ]), []);
}

function CategoryHeader({ label, desc, onBack }) {
  return (
    <div className="flex items-start gap-3 mb-1">
      <button
        onClick={onBack}
        aria-label="Volver a Ajustes"
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
      >
        <ArrowLeft size={16} style={{ color: COLORS.text }} />
      </button>
      <div>
        <h2 className="text-lg font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{label}</h2>
        {desc && <p className="text-sm mt-0.5" style={{ color: COLORS.textMuted }}>{desc}</p>}
      </div>
    </div>
  );
}

function InfoOnly({ children }) {
  return (
    <Card>
      <p className="text-sm leading-relaxed" style={{ color: COLORS.textMuted }}>{children}</p>
    </Card>
  );
}

// Fase A2 — selección múltiple de deportes (apartado 61): chips que se activan/desactivan,
// mismo componente visual que ya usa el resto de la app para selección única (ToggleTab), pero
// permitiendo varios a la vez en vez de uno solo.
function DeportesChips({ value, onChange, accent }) {
  const toggle = (d) => {
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {DEPORTES_DISPONIBLES.map((d) => {
        const activo = value.includes(d);
        return (
          <button
            key={d}
            onClick={() => toggle(d)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={activo
              ? { background: accent, color: COLORS.textOnAccent }
              : { background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}

// Fase A2 — lesiones relevantes (apartado 64): lista simple con alta/baja, igual de honesta que
// el resto de la app (sin campos obligatorios más allá de la zona). Vive en Perfil, separada del
// historial médico de Salud (Fase 3) — Perfil es "lo que otros módulos deben saber de mí de forma
// resumida", Salud es el historial completo de eventos médicos con fecha a fecha.
function LesionesEditor({ value, onChange, accent }) {
  const [nueva, setNueva] = useState({ zona: '', estado: ESTADOS_LESION[0], fecha: '', notas: '' });

  const añadir = () => {
    if (!nueva.zona.trim()) return;
    onChange([...value, { id: uid(), ...nueva }]);
    setNueva({ zona: '', estado: ESTADOS_LESION[0], fecha: '', notas: '' });
  };
  const quitar = (id) => onChange(value.filter((l) => l.id !== id));

  return (
    <div>
      {value.length > 0 && (
        <div className="space-y-2 mb-3">
          {value.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl" style={{ background: COLORS.surface2 }}>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{l.zona} · {l.estado}</p>
                {(l.fecha || l.notas) && (
                  <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>{[l.fecha, l.notas].filter(Boolean).join(' — ')}</p>
                )}
              </div>
              <button onClick={() => quitar(l.id)} aria-label="Eliminar lesión" className="flex-shrink-0">
                <Trash2 size={14} style={{ color: COLORS.textMuted }} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <TextInput placeholder="Zona (ej. rodilla)" value={nueva.zona} onChange={(e) => setNueva({ ...nueva, zona: e.target.value })} />
        <Select value={nueva.estado} onChange={(e) => setNueva({ ...nueva, estado: e.target.value })}>
          {ESTADOS_LESION.map((e) => <option key={e} value={e}>{e}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <TextInput type="date" value={nueva.fecha} onChange={(e) => setNueva({ ...nueva, fecha: e.target.value })} />
        <TextInput placeholder="Notas (opcional)" value={nueva.notas} onChange={(e) => setNueva({ ...nueva, notas: e.target.value })} />
      </div>
      <button
        onClick={añadir}
        disabled={!nueva.zona.trim()}
        className="flex items-center gap-1.5 text-xs font-semibold disabled:opacity-40"
        style={{ color: accent }}
      >
        <Plus size={14} /> Añadir lesión
      </button>
    </div>
  );
}

// Fase A3 — fila de opciones excluyentes (tema, tamaño de texto, densidad, bordes, animaciones):
// mismo estilo de pastilla que DeportesChips, pero selección única en vez de múltiple.
/* ---------- FO Fase 1 — el fondo, dentro de Apariencia ----------
   Solo se ofrecen los tipos que YA funcionan. La fotografía llega en la Fase 2 y por eso
   no aparece aquí: la regla 8 del proyecto prohíbe enseñar un control que no hace nada, y
   un "Fotografía (próximamente)" sería exactamente eso. El modelo ya la contempla; la
   interfaz la ofrecerá cuando exista.

   La vista previa se pinta con las MISMAS funciones que pintan el fondo de verdad
   (`resolverFondo` + `estilosDeFondo`), no con una imitación: si algún día divergieran,
   Josué elegiría una cosa y vería otra. */
function VistaPreviaFondo({ fondo, accent, urlFoto = null, alto = 96 }) {
  const resuelto = resolverFondo(fondo, { urlFoto });
  const estilo = estilosDeFondo(resuelto, COLORS);
  const luz = estilosDeLuminosidad(resuelto);
  const velo = estilosDeVelo(resuelto, COLORS);
  return (
    <div
      className="rounded-2xl overflow-hidden relative mb-3"
      style={{ height: alto, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}
    >
      {/* Las tres capas, en el mismo orden que en la app: foto → luz → overlay. */}
      {estilo && <div className="absolute inset-0" style={estilo} />}
      {luz && <div className="absolute inset-0" style={luz} />}
      {velo && <div className="absolute inset-0" style={velo} />}
      {/* Una tarjeta y un texto de mentira, para ver cómo queda la interfaz ENCIMA del
          fondo. Un rectángulo de color solo enseña el fondo; lo que hay que juzgar es si
          el contenido se sigue leyendo. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-xl px-3 py-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <p className="text-xs font-semibold" style={{ color: COLORS.text }}>Así se ve una tarjeta</p>
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>y su texto secundario</p>
        </div>
      </div>
    </div>
  );
}

function Deslizador({ label, valor, min, max, sufijo = '%', accent, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: COLORS.textMuted }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: COLORS.text }}>{valor}{sufijo}</span>
      </div>
      <input
        type="range" min={min} max={max} value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: accent }}
        aria-label={label}
      />
    </div>
  );
}

/* ---------- FO Fase 2 — elegir una fotografía ----------
   El flujo del apartado 3, en este orden y no en otro:

       elegir → VISTA PREVIA → aplicar

   La foto NO se aplica al elegirla. El apartado lo pide expresamente para que
   nadie tenga que aceptar una configuración que no le gusta y deshacerla después.

   Y la subida a Storage ocurre al APLICAR, no al elegir. Si subiera al elegir,
   cada foto que Josué mirara y descartara dejaría un archivo huérfano en su
   bucket para siempre. La vista previa se hace con `URL.createObjectURL`, que es
   local e instantánea — no hay que esperar a la red para ver cómo queda. */
function SelectorFoto({ fondo, accent, urlFotoActual, onSubirFoto, onCambiar }) {
  const inputRef = useRef(null);
  const [pendiente, setPendiente] = useState(null);   // { file, url, ancho, alto }
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [editando, setEditando] = useState(false);

  // Un `objectURL` que no se revoca es memoria retenida hasta recargar la página.
  // Se suelta al desmontar y cada vez que se sustituye por otro.
  useEffect(() => () => { if (pendiente?.url) URL.revokeObjectURL(pendiente.url); }, [pendiente]);

  const elegir = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';                    // permite reelegir el MISMO archivo
    if (!file) return;
    setError('');

    const validacion = validarFotoFondo(file);
    if (!validacion.ok) { setError(validacion.motivo); return; }

    // Se miden las dimensiones reales antes de nada: de ahí salen la proporción,
    // la orientación y el encuadre inicial del apartado 6.
    const url = URL.createObjectURL(file);
    try {
      const { ancho, alto } = await medirImagen(url);
      if (pendiente?.url) URL.revokeObjectURL(pendiente.url);
      setPendiente({ file, url, ancho, alto });
    } catch {
      URL.revokeObjectURL(url);
      setError('No he podido leer esa imagen. Prueba con otra.');
    }
  };

  const cancelar = () => {
    if (pendiente?.url) URL.revokeObjectURL(pendiente.url);
    setPendiente(null);
    setError('');
  };

  const aplicar = async () => {
    if (!pendiente) return;
    setSubiendo(true);
    setError('');
    try {
      // FO Fase 11 — se optimiza JUSTO ANTES de subir, no al elegir: si se hiciera
      // al elegir, cada foto que Josué mirase y descartara pagaría el redimensionado
      // para nada. Y aquí importa de verdad: una foto de iPhone son 4032×3024 y unos
      // 4 MB, y se estaba subiendo tal cual para pintarla en una pantalla de 390 px.
      const opt = await optimizarImagen(pendiente.file);
      const path = await onSubirFoto(opt.file);
      onCambiar(aplicarFotoConAjustes(fondo, datosDeFoto({
        path,
        origen: 'galeria',
        formato: opt.file.type,
        // Las medidas de la foto ORIGINAL, no las de la copia: la proporción y la
        // orientación tienen que ser las de la imagen que Josué eligió, o el
        // encuadre inicial saldría calculado sobre otra cosa.
        ancho: pendiente.ancho,
        alto: pendiente.alto,
        peso: opt.file.size,
      })));
      cancelar();
    } catch {
      // Honestidad, no un mensaje genérico: lo más probable es que falte el
      // bucket, y decirlo ahorra media hora de búsqueda.
      setError('No he podido subir la imagen. Comprueba tu conexión y que el almacenamiento esté configurado.');
    } finally {
      setSubiendo(false);
    }
  };

  const hayFoto = tieneFoto(fondo);

  return (
    <div className="mt-3">
      <input ref={inputRef} type="file" accept="image/*" onChange={elegir} className="hidden" aria-hidden="true" tabIndex={-1} />

      {/* Apartado 3: mientras hay una foto pendiente, manda la vista previa. */}
      {pendiente ? (
        <>
          <VistaPreviaFondo
            fondo={{ ...fondo, tipo: 'foto', activo: true, foto: { ...fondo.foto, proporcion: pendiente.alto ? pendiente.ancho / pendiente.alto : 0 } }}
            urlFoto={pendiente.url}
            accent={accent}
            alto={150}
          />
          <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>
            Así quedará. Todavía no se ha aplicado.
          </p>
          <div className="flex gap-2">
            <PrimaryButton accent={accent} onClick={aplicar} disabled={subiendo}>
              {subiendo ? 'Aplicando…' : 'Aplicar'}
            </PrimaryButton>
            <div style={{ width: 110, flexShrink: 0 }}>
              <GhostBtn onClick={cancelar} disabled={subiendo}>Cancelar</GhostBtn>
            </div>
          </div>
        </>
      ) : editando ? (
        <EditorFoto
          fondo={fondo} accent={accent} urlFoto={urlFotoActual}
          onGuardar={(b) => { onCambiar(b); setEditando(false); }}
          onCerrar={() => setEditando(false)}
          onCambiarFoto={() => { setEditando(false); inputRef.current?.click(); }}
        />
      ) : hayFoto ? (
        <>
          <VistaPreviaFondo fondo={fondo} urlFoto={urlFotoActual} accent={accent} alto={150} />
          <div className="flex gap-2">
            <PrimaryButton accent={accent} icon={SlidersHorizontal} onClick={() => setEditando(true)}>
              Ajustar foto
            </PrimaryButton>
            <div style={{ width: 110, flexShrink: 0 }}>
              <GhostBtn onClick={() => inputRef.current?.click()}>Cambiar</GhostBtn>
            </div>
          </div>
          <div className="mt-2">
            {/* Apartado 9: quitar la foto NO la borra del sistema. */}
            <GhostBtn onClick={() => onCambiar(quitarFoto(fondo))}>Quitar foto</GhostBtn>
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>
            Quitarla no la borra: vuelve al fondo que tenías antes.
          </p>
        </>
      ) : (
        /* Apartado 10 — el estado sin fotografía. Ni un hueco ni un elemento roto. */
        <div className="rounded-2xl p-4 text-center" style={{ border: `1px dashed ${COLORS.border}` }}>
          <ImageIcon size={20} style={{ color: COLORS.textMuted }} className="mx-auto mb-2" />
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Fondo fotográfico</p>
          <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>
            Personaliza JosStyle con una foto de tu galería.
          </p>
          <PrimaryButton accent={accent} icon={ImageIcon} onClick={() => inputRef.current?.click()}>
            Elegir foto
          </PrimaryButton>
        </div>
      )}

      {error && <p className="text-xs mt-2" style={{ color: COLORS.negative }}>{error}</p>}
    </div>
  );
}

/* Mide una imagen sin montarla en el documento. Hace falta para la proporción,
   la orientación y el encuadre inicial (apartados 5, 6 y 11), y para no aceptar
   un archivo que dice ser imagen y no se puede decodificar. */
function medirImagen(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ ancho: img.naturalWidth, alto: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

/* ---------- FO Fase 3 — el editor de fotografía ----------
   Apartado 14: se puede editar mucho y cancelar. Eso obliga a trabajar sobre un
   BORRADOR local, no sobre el fondo guardado: mientras el editor está abierto,
   `onCambiar` no se llama ni una vez. Cancelar es, literalmente, tirar el borrador.

   La vista previa lee ese mismo borrador, así que es en tiempo real (apartado 3)
   sin que nada se haya guardado todavía. */
export function EditorFoto({ fondo, accent, urlFoto, onGuardar, onCerrar, onCambiarFoto }) {
  const [borrador, setBorrador] = useState(() => fondo);
  const set = (cambios) => setBorrador((b) => ajustarFondo(b, cambios));
  const mover = (eje, valor) => set({ encuadre: { ...borrador.encuadre, [eje]: valor } });

  return (
    <div className="mt-3">
      {/* Apartado 17: la vista previa, grande y protagonista. */}
      <VistaPreviaFondo fondo={borrador} urlFoto={urlFoto} accent={accent} alto={190} />

      <div className="space-y-3">
        <Deslizador label="Zoom" valor={borrador.escala} min={100} max={300} accent={accent}
          onChange={(v) => set({ escala: v })} />
        {/* Apartados 5 y 6 — qué parte de la foto queda a la vista. Solo tienen
            sentido con zoom: a tamaño exacto no hay nada que desplazar. */}
        <Deslizador label="Horizontal" valor={borrador.encuadre.x} min={0} max={100} accent={accent}
          onChange={(v) => mover('x', v)} />
        <Deslizador label="Vertical" valor={borrador.encuadre.y} min={0} max={100} accent={accent}
          onChange={(v) => mover('y', v)} />
        <Deslizador label="Desenfoque" valor={borrador.desenfoque} min={0} max={40} sufijo=" px" accent={accent}
          onChange={(v) => set({ desenfoque: v })} />
        {/* Apartados 9 y 10 en un solo control: negativo oscurece, positivo aclara. */}
        <div>
          <Deslizador label="Luz" valor={borrador.luminosidad} min={-90} max={60} accent={accent}
            onChange={(v) => set({ luminosidad: v })} />
          <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>
            A la izquierda oscurece la foto, a la derecha la aclara. Útil para poder leer encima.
          </p>
        </div>
        <Deslizador label="Opacidad" valor={borrador.opacidad} min={10} max={100} accent={accent}
          onChange={(v) => set({ opacidad: v })} />

        {/* Apartado 12 — el overlay, con su color. Sin color, usa el del tema. */}
        <div>
          <Deslizador label="Tinte" valor={borrador.overlay.intensidad} min={0} max={90} accent={accent}
            onChange={(v) => set({ overlay: { ...borrador.overlay, intensidad: v } })} />
          {borrador.overlay.intensidad > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="color"
                value={borrador.overlay.color || COLORS.bg}
                onChange={(e) => set({ overlay: { ...borrador.overlay, color: e.target.value } })}
                className="rounded-lg flex-shrink-0"
                style={{ width: 44, height: 32, background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
                aria-label="Color del tinte"
              />
              {borrador.overlay.color && (
                <button
                  onClick={() => set({ overlay: { ...borrador.overlay, color: '' } })}
                  className="text-[11px] font-semibold"
                  style={{ color: accent }}
                >
                  Usar el color del tema
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Apartado 13 — restablecer. Solo aparece si hay algo que restablecer:
          un botón que no puede hacer nada es un control decorativo (regla 8). */}
      {tieneAjustes(borrador) && (
        <button
          onClick={() => setBorrador(restablecerAjustes(borrador))}
          className="text-xs font-semibold mt-3"
          style={{ color: accent }}
        >
          Restablecer ajustes
        </button>
      )}

      <div className="flex gap-2 mt-3">
        <PrimaryButton accent={accent} onClick={() => onGuardar(borrador)}>Aplicar</PrimaryButton>
        <div style={{ width: 110, flexShrink: 0 }}>
          <GhostBtn onClick={onCerrar}>Cancelar</GhostBtn>
        </div>
      </div>

      {/* Apartado 16 — cambiar de foto desde el editor. */}
      <button onClick={onCambiarFoto} className="text-xs font-semibold mt-3" style={{ color: accent }}>
        Cambiar de fotografía
      </button>
    </div>
  );
}

/* ---------- FO Fase 4 — que se vea el fondo, y que se siga leyendo ----------
   Apartados 7 y 12. Esto no es un efecto bonito: sin transparencia, poner una
   fotografía de fondo no sirve de nada, porque las tarjetas opacas la tapan
   entera y solo se ve en los márgenes.

   Va justo debajo del fondo, y no dentro del constructor de temas, porque es
   donde tiene sentido tocarlo: se ajusta MIRANDO la foto, no eligiendo colores. */
export function BloqueLegibilidad({ tema, fondoActivo, accent, onCambiar }) {
  const t = normalizarTema(tema);
  const set = (cambios) => onCambiar({ ...t, ...cambios });
  const [confirmando, setConfirmando] = useState(false);

  return (
    <Card>
      <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Tarjetas, bordes y barra</p>
      <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
        {fondoActivo
          ? 'Baja la opacidad para que se vea el fondo a través de la interfaz.'
          : 'Con un fondo puesto, esto deja que se vea a través de las tarjetas.'}
      </p>

      <div className="space-y-3">
        <Deslizador label="Opacidad de las tarjetas" valor={t.superficieAlfa} min={20} max={100} accent={accent}
          onChange={(v) => set({ superficieAlfa: v })} />
        <Deslizador label="Opacidad de la barra inferior" valor={t.navegacionAlfa} min={20} max={100} accent={accent}
          onChange={(v) => set({ navegacionAlfa: v })} />
        {/* FO Fase 7, apartado 10 — el color del borde ya se podía cambiar en el
            constructor de temas; lo que faltaba era su intensidad. Un borde al
            100 % sobre una tarjeta translúcida encima de una foto se ve como una
            caja pegada; bajarlo la integra sin quitarle la separación. */}
        <Deslizador label="Intensidad de los bordes" valor={t.bordeAlfa} min={20} max={100} accent={accent}
          onChange={(v) => set({ bordeAlfa: v })} />
        {/* Apartado 11 — sombras. El tope es bajo a propósito: el propio apartado
            pide evitar configuraciones que hagan que la app parezca desordenada. */}
        <Deslizador label="Sombra de las tarjetas" valor={t.sombras} min={0} max={40} sufijo="" accent={accent}
          onChange={(v) => set({ sombras: v })} />
      </div>

      {/* El mínimo no es 0 y conviene decir por qué, para que no parezca un tope
          arbitrario cuando el deslizador se planta antes de llegar al final. */}
      {(t.superficieAlfa <= 35 || t.navegacionAlfa <= 35) && (
        <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
          No baja de ahí a propósito: por debajo, el texto encima de una foto deja de leerse.
        </p>
      )}

      {/* Apartado 15 — restablecer colores, con confirmación y diciendo lo que NO toca. */}
      {tieneColoresPersonalizados(t) && (
        <div className="mt-3">
          {confirmando ? (
            <div className="rounded-2xl p-3" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <p className="text-xs mb-2" style={{ color: COLORS.text }}>
                Se van a devolver todos los colores a los de JosStyle. <strong>Tu fondo y tu fotografía no se tocan.</strong>
              </p>
              <div className="flex gap-2">
                <PrimaryButton accent={accent} onClick={() => { onCambiar(restablecerColores()); setConfirmando(false); }}>
                  Restablecer
                </PrimaryButton>
                <div style={{ width: 110, flexShrink: 0 }}>
                  <GhostBtn onClick={() => setConfirmando(false)}>Cancelar</GhostBtn>
                </div>
              </div>
            </div>
          ) : (
            <GhostBtn onClick={() => setConfirmando(true)} icon={RotateCcw}>Restablecer colores</GhostBtn>
          )}
        </div>
      )}
    </Card>
  );
}

/* ---------- FO Fase 5 — la paleta detectada en la fotografía ----------
   Apartado 15, y es la regla que gobierna este componente: **detectar NO es
   aplicar**. Si Josué tiene una foto azul y una paleta roja, aquí se enseña
   "azul" y su paleta roja se queda como está. Aplicarla es la Fase 6.

   Por eso este bloque solo MUESTRA, y lo único que se puede hacer con un color
   es copiarlo — una acción que decide él, no el sistema.

   El análisis se dispara al cambiar la foto (apartado 2), no mientras se mueve
   el zoom: eso sería analizar decenas de veces por segundo para nada. Y se
   guarda sellado con el id de su fotografía (apartados 13 y 14), así que una
   foto ya analizada no se vuelve a analizar y la paleta de una foto nunca se
   enseña para otra. */
export function PaletaDetectada({ fondo, urlFoto, accent, analisis, onAnalisis }) {
  const [estado, setEstado] = useState('inactivo');   // inactivo | analizando | listo | fallo
  const [copiado, setCopiado] = useState('');
  const fotoId = fondo?.foto?.id || '';
  const valido = analisisValidoPara(analisis, fondo?.foto);

  useEffect(() => {
    // Apartado 14 — si esta foto ya está analizada, no se repite el trabajo.
    if (!urlFoto || !fotoId || valido) { setEstado(valido ? 'listo' : 'inactivo'); return undefined; }
    let cancelado = false;
    setEstado('analizando');
    analizarImagen(urlFoto).then((res) => {
      if (cancelado) return;
      if (!res) { setEstado('fallo'); return; }
      onAnalisis(sellarAnalisis(res, fondo.foto));
      setEstado('listo');
    });
    // Igual que con la firma de la URL: si Josué cambia de foto mientras la
    // anterior se analizaba, el resultado viejo no puede pisar al nuevo.
    return () => { cancelado = true; };
  }, [urlFoto, fotoId, valido]);

  useEffect(() => {
    if (!copiado) return undefined;
    const t = setTimeout(() => setCopiado(''), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  if (!fotoId) return null;

  if (estado === 'analizando') {
    return (
      <p className="text-xs mt-3 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
        <Loader2 size={13} className="animate-spin" style={{ color: accent }} /> Analizando colores…
      </p>
    );
  }
  // Si no se ha podido analizar, se dice y ya: no se inventa una paleta.
  if (estado === 'fallo') {
    return <p className="text-xs mt-3" style={{ color: COLORS.textMuted }}>No he podido leer los colores de esta foto.</p>;
  }
  if (!valido || !analisis.colores.length) return null;

  const copiar = async (hex) => {
    try { await navigator.clipboard.writeText(hex); setCopiado(hex); } catch { setCopiado(''); }
  };

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold mb-2" style={{ color: COLORS.text }}>Colores de tu foto</p>
      <div className="flex flex-wrap gap-2">
        {analisis.colores.map((c) => (
          <button
            key={c.hex}
            onClick={() => copiar(c.hex)}
            className="rounded-xl overflow-hidden transition-transform active:scale-90"
            style={{ width: 42, height: 42, background: c.hex, border: `1px solid ${COLORS.border}` }}
            aria-label={`${c.hex}, ${describirColor(c)}. Tocar para copiar.`}
            title={describirColor(c)}
          />
        ))}
      </div>
      {copiado && (
        <p className="text-[11px] mt-1.5" style={{ color: accent }}>{copiado} copiado.</p>
      )}
      {/* Apartado 18 — una foto en blanco y negro no es un error, es una paleta neutra. */}
      {analisis.monocromatica && (
        <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>
          Tu foto es prácticamente en blanco y negro, así que no hay un color de acento que sacar de ella.
        </p>
      )}
      {/* Apartado 15, dicho en la propia interfaz para que no haya duda. */}
      <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>
        Solo te los enseño: tus colores no cambian solos. Toca uno para copiarlo.
      </p>
    </div>
  );
}

/* ---------- FO Fase 6 — "Recomendado" ----------
   Propone apariencias completas a partir de los colores de la foto. Tres cosas
   que la especificación pide y que gobiernan este componente:

   · Varias propuestas, no una (apartado 3), y realmente distintas (apartado 8):
     cada una parte de una estrategia cromática diferente.
   · PROBAR antes de aplicar (apartado 11): tocar una la pone en la app de verdad,
     al instante, sin guardarla.
   · VOLVER recupera exactamente lo anterior (apartado 12). Y no porque se
     acuerde de deshacer cada cambio: se hace una copia ANTES de tocar nada y se
     restaura entera, igual que el borrador del editor de fotos. */
export function BloqueRecomendado({ analisis, tema, accent, fondo, modoOscuro, onProbar, onAplicar }) {
  const [semilla, setSemilla] = useState(0);
  const [probando, setProbando] = useState(null);
  // La copia de seguridad se hace UNA vez, al empezar a probar. Si se rehiciera en
  // cada prueba, la segunda guardaría la apariencia de la primera y "volver"
  // devolvería a una propuesta en lugar de a lo que Josué tenía.
  const previo = useRef(null);

  const resultado = useMemo(
    () => generarPropuestas(analisis, tema, { semilla, modoOscuro }),
    [analisis, tema, semilla, modoOscuro],
  );

  const probar = (p) => {
    if (!previo.current) {
      previo.current = guardarApariencia({ accent, tema, overlay: fondo?.overlay });
    }
    setProbando(p.id);
    onProbar(aplicarPropuesta(p));
  };

  const volver = () => {
    if (previo.current) onProbar(previo.current);
    previo.current = null;
    setProbando(null);
  };

  const aplicar = (p) => {
    onAplicar(aplicarPropuesta(p));
    previo.current = null;
    setProbando(null);
  };

  if (!resultado.posible) return null;

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: COLORS.text }}>
          <Sparkles size={14} style={{ color: accent }} /> Recomendado
        </p>
        {/* Apartado 13 — generar otras. Determinista, no aleatorio: la misma
            semilla da siempre lo mismo. */}
        <button onClick={() => { setSemilla((n) => n + 1); volver(); }} className="text-xs font-semibold" style={{ color: accent }}>
          Otras
        </button>
      </div>
      <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
        Combinaciones sacadas de los colores de tu foto. Pruébalas antes de decidir.
      </p>

      <div className="space-y-2">
        {resultado.propuestas.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl p-3"
            style={{
              background: probando === p.id ? hexToRgba(accent, 0.12) : COLORS.surface2,
              border: `1px solid ${probando === p.id ? accent : COLORS.border}`,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{p.nombre}</p>
                <p className="text-[11px] truncate" style={{ color: COLORS.textMuted }}>{p.descripcion}</p>
              </div>
              {/* Apartado 9 — la representación de la propuesta. */}
              <div className="flex gap-1 flex-shrink-0">
                {p.muestras.map((hex, i) => (
                  <span key={i} className="rounded-full" style={{ width: 18, height: 18, background: hex, border: `1px solid ${COLORS.border}` }} />
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              {probando === p.id ? (
                <>
                  <PrimaryButton accent={accent} onClick={() => aplicar(p)}>Me gusta, aplicar</PrimaryButton>
                  <div style={{ width: 100, flexShrink: 0 }}>
                    <GhostBtn onClick={volver}>Volver</GhostBtn>
                  </div>
                </>
              ) : (
                <GhostBtn onClick={() => probar(p)}>Probar</GhostBtn>
              )}
            </div>
          </div>
        ))}
      </div>

      {probando && (
        <p className="text-[11px] mt-2" style={{ color: COLORS.textMuted }}>
          Estás probando una propuesta. Nada se ha guardado todavía: con "Volver" recuperas lo que tenías.
        </p>
      )}
    </Card>
  );
}

/* ---------- FO Fase 8 — apariencias guardadas ----------
   Un preset es la apariencia COMPLETA: tema, acento, colores, transparencias,
   sombras Y FONDO, fotografía incluida (apartado 2). Guardar solo los colores,
   que es lo que hacía el sistema anterior, deja media configuración.

   Los oficiales van al final de la lista y no al principio: son cuatro y siempre
   están, así que arriba ocuparían la primera pantalla entera y empujarían fuera
   lo que Josué se ha molestado en crear. */
export function BloquePresets({ presets, apariencia, accent, temaPersonalizado, onGuardar, onCambiarPresets, onAplicar }) {
  const [nombre, setNombre] = useState('');
  const [creando, setCreando] = useState(false);

  const actual = { tema: apariencia.tema, accent, temaPersonalizado, fondo: apariencia.fondo };
  const lista = useMemo(() => listaPresets(presets), [presets]);
  const activo = useMemo(() => presetActivo(lista, actual), [lista, apariencia, accent, temaPersonalizado]);

  const guardar = () => {
    onGuardar(crearPreset({ nombre, ...actual }));
    setNombre('');
    setCreando(false);
  };

  const sustituir = (id, nuevo) => onCambiarPresets((presets || []).map((p) => (p.id === id ? nuevo : p)));

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Apariencias guardadas</p>
        {(presets || []).length < MAX_PRESETS && !creando && (
          <button onClick={() => setCreando(true)} className="text-xs font-semibold" style={{ color: accent }}>
            Guardar la de ahora
          </button>
        )}
      </div>
      <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
        Guarda tus colores y tu fondo juntos, y cambia entre ellos de un toque.
      </p>

      {creando && (
        <div className="mb-3">
          <Field label="Nombre">
            <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Mi estilo, Gym, Verano…" />
          </Field>
          <div className="flex gap-2 mt-2">
            <PrimaryButton accent={accent} onClick={guardar}>Guardar</PrimaryButton>
            <div style={{ width: 110, flexShrink: 0 }}>
              <GhostBtn onClick={() => { setCreando(false); setNombre(''); }}>Cancelar</GhostBtn>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {lista.map((p) => {
          const esActivo = activo && activo.id === p.id;
          const editable = esEditable(p);
          return (
            <div
              key={p.id}
              className="rounded-2xl p-3"
              style={{
                background: esActivo ? hexToRgba(accent, 0.1) : COLORS.surface2,
                border: `1px solid ${esActivo ? accent : COLORS.border}`,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>
                    {esActivo ? '✓ ' : ''}{p.nombre}
                    {!editable && <span className="text-[10px] ml-1.5" style={{ color: COLORS.textMuted }}>incluida</span>}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: COLORS.textMuted }}>
                    {p.descripcion || describirFondo(p.fondo)}
                  </p>
                </div>
                {/* Apartado 5 — la miniatura, para reconocerlo de un vistazo. */}
                <MiniaturaPreset preset={p} />
              </div>

              <div className="flex items-center gap-1 mt-2">
                {!esActivo && (
                  <button onClick={() => onAplicar(aplicarPreset(p, { accentActual: accent }))}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                    style={{ background: accent, color: COLORS.textOnAccent }}>
                    Usar
                  </button>
                )}
                {/* Apartado 14 — un oficial se personaliza duplicándolo, no
                    editándolo: así el original nunca se pierde. */}
                <button onClick={() => onGuardar(duplicarPreset(p))} className="p-1.5 rounded-lg" aria-label={`Duplicar ${p.nombre}`}>
                  <Copy size={13} style={{ color: COLORS.textMuted }} />
                </button>
                {editable && (
                  <>
                    <button onClick={() => sustituir(p.id, actualizarPreset(p, actual))} className="text-[11px] font-semibold px-2 py-1.5" style={{ color: accent }}>
                      Actualizar
                    </button>
                    <button onClick={() => sustituir(p.id, alternarFavorito(p))} className="p-1.5 rounded-lg" aria-pressed={!!p.favorito} aria-label={p.favorito ? 'Quitar de favoritas' : 'Marcar favorita'}>
                      <Star size={13} style={p.favorito ? { color: accent, fill: accent } : { color: COLORS.textMuted }} />
                    </button>
                    <div className="ml-auto">
                      <BotonBorrar onClick={() => onCambiarPresets((presets || []).filter((x) => x.id !== p.id))} label={`Eliminar ${p.nombre}`} />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* La miniatura de un preset: sus colores y su fondo, en pequeño. Se pinta con las
   mismas funciones que pintan el fondo de verdad — una imitación acabaría
   divergiendo y enseñaría algo que no es lo que se va a aplicar. */
function MiniaturaPreset({ preset }) {
  const resuelto = resolverFondo(preset.fondo, { urlFoto: null });
  const estilo = estilosDeFondo(resuelto, COLORS);
  return (
    <span
      className="rounded-lg overflow-hidden relative flex-shrink-0"
      style={{ width: 44, height: 30, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}
      aria-hidden="true"
    >
      {estilo && <span className="absolute inset-0" style={estilo} />}
      {preset.accent && (
        <span className="absolute rounded-full" style={{ width: 10, height: 10, bottom: 4, right: 4, background: preset.accent }} />
      )}
    </span>
  );
}

/* ---------- FO Fase 9 — legibilidad ----------
   La filosofía del apartado 1: libertad total para personalizar, pero con
   protección para que la app siga siendo usable.

   Y la línea que la hace posible, del apartado 7: **detectar y corregir son
   cosas distintas**. Este bloque avisa y propone; no cambia nada hasta que se
   pulsa. El modo automático (apartado 8) está APAGADO por defecto y es lo único
   que autoriza a arreglar solo.

   Nada se bloquea (apartado 9): un color flojo se avisa, no se impide. */
export function BloqueLegibilidadAuto({ colors, fondo, analisis, tema, accent, auto, onSetAuto, onCorregir }) {
  const revision = useMemo(
    () => revisarLegibilidad({ colors, fondo, analisis, tema, accent }),
    [colors, fondo, analisis, tema, accent],
  );
  const sobreFoto = useMemo(
    () => propuestasSobreFoto({ fondo, analisis, colors }),
    [fondo, analisis, colors],
  );

  const todo = [...revision.problemas, ...sobreFoto];
  const cambios = correccionesDe(todo);
  const hayAlgo = hayCorrecciones(cambios);

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: COLORS.text }}>
          <ShieldCheck size={14} style={{ color: revision.graves > 0 ? COLORS.warning : accent }} /> Legibilidad
        </p>
      </div>
      <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>{resumenLegibilidad(revision)}</p>

      {/* Apartado 5 — el aviso, en castellano y sin tecnicismos. */}
      {revision.hayProblemas && (
        <ul className="space-y-1.5 mb-3">
          {revision.problemas.map((p) => (
            <li key={p.id} className="text-xs leading-relaxed flex gap-2" style={{ color: COLORS.textMuted }}>
              <span>{p.nivel === 'mal' ? '⚠️' : '·'}</span>
              <span>
                {p.que} {p.nivel === 'mal' ? 'cuesta leerlo' : 'se lee justo'} con tu combinación actual.
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Apartados 10, 11 y 12 — cuando el problema es la foto, la solución no es
          cambiar el texto: se propone tocar la foto y dejar los colores en paz. */}
      {sobreFoto.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {sobreFoto.map((p) => (
            <li key={p.id} className="text-xs leading-relaxed flex gap-2" style={{ color: COLORS.textMuted }}>
              <span style={{ color: accent }}>·</span>
              <span>{p.texto}</span>
            </li>
          ))}
        </ul>
      )}

      {hayAlgo && (
        <div className="mb-3">
          <PrimaryButton accent={accent} onClick={() => onCorregir(cambios)}>Arreglarlo</PrimaryButton>
          <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>
            Solo cambia lo que hace falta. Tu foto y tus colores principales no se tocan.
          </p>
        </div>
      )}

      {/* Apartado 8 — el modo automático, opcional y apagado de fábrica. */}
      <button
        onClick={() => onSetAuto(!auto)}
        className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2"
        style={{ background: COLORS.surface2, border: `1px solid ${auto ? accent : COLORS.border}` }}
        aria-pressed={auto}
      >
        <span className="text-xs font-semibold text-left" style={{ color: COLORS.text }}>
          Arreglar la legibilidad sola
          <span className="block text-[11px] font-normal" style={{ color: COLORS.textMuted }}>
            {auto ? 'Activado: se corrige sin preguntar.' : 'Desactivado: solo te aviso, decides tú.'}
          </span>
        </span>
        <span
          className="rounded-full flex-shrink-0"
          style={{ width: 34, height: 20, background: auto ? accent : COLORS.border, position: 'relative' }}
        >
          <span className="rounded-full absolute" style={{ width: 16, height: 16, top: 2, left: auto ? 16 : 2, background: COLORS.surface }} />
        </span>
      </button>
    </Card>
  );
}

/* ---------- FO Fase 10 — la vista previa global ----------
   Apartados 4 y 6: una representación de JosStyle con el fondo, una tarjeta, un
   botón, texto, iconos y la barra inferior. No hace falta enseñar la app entera;
   hace falta poder juzgar si la combinación funciona **sin salir de Ajustes**.

   Se pinta con las mismas funciones y los mismos tokens que la app de verdad
   (`resolverFondo`, `estilosDeFondo`, `COLORS.surfaceAlpha`, `COLORS.navBgAlpha`).
   Una imitación acabaría divergiendo y enseñaría algo que no es lo que se aplica. */
export function VistaPreviaGlobal({ fondo, urlFoto, accent }) {
  const resuelto = resolverFondo(fondo, { urlFoto });
  const estilo = estilosDeFondo(resuelto, COLORS);
  const luz = estilosDeLuminosidad(resuelto);
  const velo = estilosDeVelo(resuelto, COLORS);

  return (
    <div
      className="rounded-3xl overflow-hidden relative"
      style={{ height: 172, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}
    >
      {/* Las tres capas del fondo, en el mismo orden que en la app. */}
      {estilo && <div className="absolute inset-0" style={estilo} />}
      {luz && <div className="absolute inset-0" style={luz} />}
      {velo && <div className="absolute inset-0" style={velo} />}

      <div className="absolute inset-0 flex flex-col justify-between p-3">
        {/* Una tarjeta con su texto principal y su secundario. */}
        <div
          className="rounded-2xl p-2.5"
          style={{
            background: COLORS.surfaceAlpha || COLORS.surface,
            border: `1px solid ${COLORS.borderAlpha || COLORS.border}`,
            boxShadow: COLORS.cardShadow !== 'none' ? COLORS.cardShadow : undefined,
            backdropFilter: COLORS.surfaceAlpha !== COLORS.surface ? 'blur(12px)' : undefined,
          }}
        >
          <p className="text-xs font-semibold" style={{ color: COLORS.text }}>Una tarjeta</p>
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>y su texto secundario</p>
          <span
            className="inline-block text-[10px] font-semibold px-2 py-1 rounded-lg mt-1.5"
            style={{ background: accent, color: COLORS.textOnAccent }}
          >
            Un botón
          </span>
        </div>

        {/* Y la barra inferior, con un icono activo y dos apagados. */}
        <div
          className="rounded-xl flex items-center justify-around py-1.5"
          style={{
            background: COLORS.navBgAlpha || COLORS.surface,
            border: `1px solid ${COLORS.borderAlpha || COLORS.border}`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Palette size={13} style={{ color: COLORS.iconActive || accent }} />
          <LayoutGrid size={13} style={{ color: COLORS.iconMuted || COLORS.textMuted }} />
          <User size={13} style={{ color: COLORS.iconMuted || COLORS.textMuted }} />
        </div>
      </div>
    </div>
  );
}

/* Una sección plegable de Ajustes.
   Apartado 3: "aunque existan muchas opciones, no mostrar absolutamente todo al
   mismo tiempo". Apariencia había llegado a trece tarjetas seguidas, que en un
   iPhone es una pantalla de scroll para encontrar cualquier cosa. */
function Seccion({ titulo, sub, icono: Icono, accent, defecto = false, children }) {
  const [abierta, setAbierta] = useState(defecto);
  return (
    <Card style={{ padding: '0.9rem' }}>
      <button
        onClick={() => setAbierta((v) => !v)}
        className="w-full flex items-center justify-between gap-2"
        aria-expanded={abierta}
      >
        <span className="flex items-center gap-2 min-w-0 text-left">
          {Icono && <Icono size={15} style={{ color: accent }} className="flex-shrink-0" />}
          <span className="min-w-0">
            <span className="text-sm font-semibold block truncate" style={{ color: COLORS.text }}>{titulo}</span>
            {sub && <span className="text-[11px] block truncate" style={{ color: COLORS.textMuted }}>{sub}</span>}
          </span>
        </span>
        {abierta
          ? <ChevronUp size={15} style={{ color: COLORS.textMuted }} className="flex-shrink-0" />
          : <ChevronRight size={15} style={{ color: COLORS.textMuted }} className="flex-shrink-0" />}
      </button>
      {abierta && <div className="mt-3 space-y-4">{children}</div>}
    </Card>
  );
}

export function BloqueFondo({ fondo, accent, onCambiar, onSubirFoto, urlFotoFondo, analisisFoto, onAnalisisFoto }) {
  const [abierto, setAbierto] = useState(false);
  const disponibles = TIPOS_FONDO.filter((t) => t.implementado);
  const activo = fondo?.activo ? fondo.tipo : 'ninguno';

  return (
    <Card>
      <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Fondo</p>
      <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>{describirFondo(fondo)}</p>

      <VistaPreviaFondo fondo={fondo} accent={accent} />

      <OpcionesFila
        opciones={disponibles.map((t) => ({ value: t.id, label: t.label }))}
        valor={activo}
        onChange={(tipo) => onCambiar(seleccionarFondo(fondo, tipo))}
        accent={accent}
      />

      {/* Cada tipo enseña SOLO sus controles. Un selector de color cuando has elegido
          "degradado" no sirve para nada y confunde. */}
      {/* FO Fase 2 — la fotografía, con su flujo propio de elegir → previsualizar → aplicar. */}
      {activo === 'foto' && (
        <>
          <SelectorFoto
            fondo={fondo} accent={accent} urlFotoActual={urlFotoFondo}
            onSubirFoto={onSubirFoto} onCambiar={onCambiar}
          />
          {onAnalisisFoto && (
            <PaletaDetectada
              fondo={fondo} urlFoto={urlFotoFondo} accent={accent}
              analisis={analisisFoto} onAnalisis={onAnalisisFoto}
            />
          )}
        </>
      )}

      {activo === 'predeterminado' && (
        <div className="flex flex-wrap gap-2 mt-3">
          {FONDOS_INCLUIDOS.map((f) => (
            <button
              key={f.id}
              onClick={() => onCambiar(ajustarFondo(fondo, { incluido: f.id }))}
              className="px-3 py-2 rounded-xl text-xs font-semibold"
              style={fondo.incluido === f.id
                ? { background: accent, color: COLORS.textOnAccent }
                : { background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {activo === 'color' && (
        <div className="mt-3">
          <Field label="Color del fondo">
            <input
              type="color"
              value={fondo.color || COLORS.bg}
              onChange={(e) => onCambiar(ajustarFondo(fondo, { color: e.target.value }))}
              className="w-full rounded-xl"
              style={{ height: 42, background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
              aria-label="Color del fondo"
            />
          </Field>
        </div>
      )}

      {activo === 'degradado' && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="De">
            <input
              type="color"
              value={fondo.degradado?.de || COLORS.surface2}
              onChange={(e) => onCambiar(ajustarFondo(fondo, { degradado: { ...fondo.degradado, de: e.target.value } }))}
              className="w-full rounded-xl"
              style={{ height: 42, background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
              aria-label="Color inicial del degradado"
            />
          </Field>
          <Field label="A">
            <input
              type="color"
              value={fondo.degradado?.a || COLORS.bg}
              onChange={(e) => onCambiar(ajustarFondo(fondo, { degradado: { ...fondo.degradado, a: e.target.value } }))}
              className="w-full rounded-xl"
              style={{ height: 42, background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
              aria-label="Color final del degradado"
            />
          </Field>
          <div className="col-span-2">
            <Deslizador
              label="Ángulo" valor={fondo.degradado?.angulo ?? 160} min={0} max={360} sufijo="°" accent={accent}
              onChange={(v) => onCambiar(ajustarFondo(fondo, { degradado: { ...fondo.degradado, angulo: v } }))}
            />
          </div>
        </div>
      )}

      {/* Los ajustes de presentación valen para cualquier tipo, así que van juntos y
          plegados: en un iPhone, tres deslizadores siempre abiertos empujan todo lo demás
          fuera de la pantalla. */}
      {activo !== 'ninguno' && (
        <>
          <button
            onClick={() => setAbierto((v) => !v)}
            className="text-xs font-semibold mt-3"
            style={{ color: accent }}
            aria-expanded={abierto}
          >
            {abierto ? 'Ocultar ajustes' : 'Ajustar cómo se ve'}
          </button>
          {abierto && (
            <div className="space-y-3 mt-3">
              <Deslizador label="Intensidad" valor={fondo.opacidad} min={0} max={100} accent={accent}
                onChange={(v) => onCambiar(ajustarFondo(fondo, { opacidad: v }))} />
              <Deslizador label="Desenfoque" valor={fondo.desenfoque} min={0} max={40} sufijo=" px" accent={accent}
                onChange={(v) => onCambiar(ajustarFondo(fondo, { desenfoque: v }))} />
              <div>
                <Deslizador label="Velo" valor={fondo.velo} min={0} max={90} accent={accent}
                  onChange={(v) => onCambiar(ajustarFondo(fondo, { velo: v }))} />
                <p className="text-[11px] mt-1" style={{ color: COLORS.textMuted }}>
                  El velo atenúa el fondo por detrás de la interfaz. Súbelo si te cuesta leer.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Apartado 14 — restablecer NO borra nada, y la interfaz lo dice para que nadie
          evite el botón por miedo a perder lo que había elegido. */}
      {fondo?.activo && (
        <div className="mt-3">
          <GhostBtn onClick={() => onCambiar(restablecerFondo(fondo))}>Volver al fondo normal</GhostBtn>
          {tieneFondoGuardado(fondo) && (
            <p className="text-[11px] mt-1.5" style={{ color: COLORS.textMuted }}>
              No se borra nada: lo que has elegido se queda guardado por si quieres volver.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function OpcionesFila({ opciones, valor, onChange, accent }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((op) => {
        const activo = op.value === valor;
        return (
          <button
            key={op.value}
            onClick={() => onChange(op.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold"
            style={activo
              ? { background: accent, color: COLORS.textOnAccent }
              : { background: COLORS.surface2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
          >
            {op.label}
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsView({
  perfil, onUpdatePerfil, accent, onUpdateAccent, onPreviewAccent,
  historialColor, onRegistrarColorReciente, onToggleFavoritoColor,
  temaPersonalizado, onUpdateTemaPersonalizado, onPreviewTemaPersonalizado,
  temasGuardados, onAplicarConjuntoTema, onRestablecerTemaOficial,
  onGuardarTemaComoNuevo, onRenombrarTemaGuardado, onDuplicarTemaGuardado,
  onEliminarTemaGuardado, onImportarTemaGuardado,
  apariencia, onUpdateApariencia, onSubirFotoFondo, urlFotoFondo,
  onGuardarPreset, onCambiarPresets, onAplicarPreset,
  notificaciones, onUpdateNotificaciones,
  seguridad, onUpdateSeguridad, userId,
  // Fase de Seguridad Centralizada — catálogo de zonas protegibles (App.jsx, a partir de MORE_NAV
  // + 'hoy') y las funciones que de verdad tocan `seguridad.protectedAreas`/`protectedActions` o
  // el PIN, todas centralizadas en App.jsx (apartado 8/9: un único sistema, nunca varios).
  areasProtegibles, onToggleAreaProtegida, onToggleAccionProtegida,
  onIniciarCrearPin, onIniciarCambioPin, onIniciarDesactivarPin,
  modulosBorrables, onBorrarDatosModulo,
  onExportCSV, onExportXLSX, onUndo, canUndo,
  onSignOut,
  // Props de PersonalizationView (Fase 19/20), reenviadas tal cual a la categoría "Pantalla principal"
  areas, modulos, personalizacion, onMove, onToggleOculto, onToggleDashboard, onAplicarPerfil, onSetIcono, onTogglePinExtra,
  // Entrega 2 · ME Fase 3 — papelera global
  papelera, relacionDesbloqueada, onRestaurarPapelera, onEliminarDefinitivo, onVaciarPapelera, onSetRetencionPapelera,
  onToggleFavorita, onMoveFavorita, modo, onSetModo,
  // Entrega 2 · BI Fase 2 — deep-link desde el buscador de funciones
  foco, onFocoConsumido,
}) {
  const [local, setLocal] = useState(perfil);
  useEffect(() => { setLocal(perfil); }, [perfil]);
  const [open, setOpen] = useState(null); // id de categoría abierta, o null = lista

  // Entrega 2 · BI Fase 2 — el buscador manda aquí con la categoría ya elegida ("colores" abre
  // Apariencia directamente, apartado 12). Mismo mecanismo de `foco` que ya usan Sueño, Entreno,
  // Objetivos, Estudios, Productividad y Economía desde el Dashboard — no un sistema nuevo.
  useEffect(() => {
    if (!foco?.categoria) return;
    setOpen(foco.categoria);
    onFocoConsumido && onFocoConsumido();
  }, [foco]);
  const [query, setQuery] = useState('');
  // Fase 2 del Sistema de Personalización Visual Extrema — editor de color avanzado, abierto desde
  // "Color de acento" (el rol Principal). Fase 3 añade el constructor de temas para el resto de
  // roles (Secundario/Terciario/Fondo/Superficie/Texto/Bordes/Estados).
  const [colorPickerAbierto, setColorPickerAbierto] = useState(false);
  const [temaBuilderAbierto, setTemaBuilderAbierto] = useState(false);

  const categorias = useCategorias();

  const edad = calcularEdad(local.fechaNacimiento);
  const alturaM = local.altura / 100;
  const imc = local.peso / (alturaM * alturaM);
  const bmr = 10 * local.peso + 6.25 * local.altura - 5 * edad + 5;
  const tdee = bmr * (ACTIVIDAD_FACTORES[local.actividad] || 1.55);
  const pesoMin = (18.5 * alturaM * alturaM).toFixed(0);
  const pesoMax = (24.9 * alturaM * alturaM).toFixed(0);
  const commit = (next) => { setLocal(next); onUpdatePerfil(next); };

  // Fase A2 — apartados 72-74: exportar/importar/restablecer perfil.
  const fileInputRef = useRef(null);
  const [confirmandoReset, setConfirmandoReset] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [importError, setImportError] = useState('');

  const exportarPerfil = () => {
    const blob = new Blob([JSON.stringify(perfil, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'perfil-sistema-personal.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('formato');
        setPendingImport(parsed);
      } catch {
        setImportError('Ese archivo no es un perfil válido.');
      }
    };
    reader.readAsText(file);
  };

  const confirmarImport = () => { commit({ ...DEFAULT_PERFIL, ...pendingImport }); setPendingImport(null); };
  const restablecerPerfil = () => { commit(DEFAULT_PERFIL); setConfirmandoReset(false); };

  // Fase A3 — Apariencia avanzada: exportar/importar/restablecer el paquete de apariencia
  // (tema, tamaño de texto, densidad, bordes, animaciones) + acento. Mismo patrón que Perfil,
  // con sus propios estados para no chocar con los de arriba.
  const fileInputRefApariencia = useRef(null);
  const [confirmandoResetApariencia, setConfirmandoResetApariencia] = useState(false);
  const [pendingImportApariencia, setPendingImportApariencia] = useState(null);
  const [importErrorApariencia, setImportErrorApariencia] = useState('');

  const exportarApariencia = () => {
    const paquete = { ...apariencia, accent };
    const blob = new Blob([JSON.stringify(paquete, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apariencia-sistema-personal.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportApariencia = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportErrorApariencia('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('formato');
        setPendingImportApariencia(parsed);
      } catch {
        setImportErrorApariencia('Ese archivo no es un tema válido.');
      }
    };
    reader.readAsText(file);
  };

  const confirmarImportApariencia = () => {
    const { accent: accentImportado, ...resto } = pendingImportApariencia;
    onUpdateApariencia({ ...DEFAULT_APARIENCIA, ...resto });
    if (accentImportado) onUpdateAccent(accentImportado);
    setPendingImportApariencia(null);
  };
  const restablecerApariencia = () => { onUpdateApariencia(DEFAULT_APARIENCIA); setConfirmandoResetApariencia(false); };

  // Fase A4 — Notificaciones reales: estado del permiso del navegador (no es reactivo por sí
  // solo, se re-lee tras pedirlo) + exportar/importar/restablecer, mismo patrón que Apariencia.
  const [permisoNotif, setPermisoNotif] = useState(() => permisoNotificaciones());
  const solicitarPermisoNotif = async () => {
    const resultado = await pedirPermisoNotificaciones();
    setPermisoNotif(resultado);
  };

  const fileInputRefNotif = useRef(null);
  const [confirmandoResetNotif, setConfirmandoResetNotif] = useState(false);
  const [pendingImportNotif, setPendingImportNotif] = useState(null);
  const [importErrorNotif, setImportErrorNotif] = useState('');

  const exportarNotificaciones = () => {
    const blob = new Blob([JSON.stringify(notificaciones, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notificaciones-sistema-personal.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportNotificaciones = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportErrorNotif('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('formato');
        setPendingImportNotif(parsed);
      } catch {
        setImportErrorNotif('Ese archivo no es una configuración de notificaciones válida.');
      }
    };
    reader.readAsText(file);
  };

  const confirmarImportNotificaciones = () => {
    onUpdateNotificaciones({
      ...DEFAULT_NOTIFICACIONES,
      ...pendingImportNotif,
      categorias: { ...DEFAULT_NOTIFICACIONES.categorias, ...(pendingImportNotif.categorias || {}) },
    });
    setPendingImportNotif(null);
  };
  const restablecerNotificaciones = () => { onUpdateNotificaciones(DEFAULT_NOTIFICACIONES); setConfirmandoResetNotif(false); };

  // Fase A5 — Seguridad avanzada: biometría (WebAuthn local, ver src/lib/biometria.js) y
  // bloqueo automático. `biometriaSoportadaAqui` se calcula una vez por render, no cambia solo.
  const biometriaSoportadaAqui = biometriaSoportada();
  const [biometriaError, setBiometriaError] = useState('');
  const [registrandoBiometria, setRegistrandoBiometria] = useState(false);

  const activarBiometria = async () => {
    setBiometriaError('');
    setRegistrandoBiometria(true);
    try {
      const credencialId = await registrarBiometria(userId, perfil.nombre);
      onUpdateSeguridad({ ...seguridad, biometriaActiva: true, biometriaCredencialId: credencialId });
    } catch (err) {
      setBiometriaError(err.message || 'No se ha podido activar la biometría en este dispositivo.');
    }
    setRegistrandoBiometria(false);
  };
  const desactivarBiometria = () => {
    onUpdateSeguridad({ ...seguridad, biometriaActiva: false, biometriaCredencialId: null });
  };

  // Fase A6 — Privacidad: borrado por categoría (apartado 195). Un solo estado con el id del
  // módulo pendiente de confirmar (o null) — mismo patrón `confirmandoX` que el resto de la app,
  // pero indexado porque aquí hay varias filas en vez de una sola acción.
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(null);
  const confirmarBorrado = (id) => { onBorrarDatosModulo(id); setConfirmandoBorrado(null); };

  // Buscador de ajustes (apartado 32): filtra las tarjetas de categoría por nombre/descripción.
  // Búsqueda dentro de cada ajuste individual queda para cuando existan más categorías construidas.
  const categoriasFiltradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categorias;
    return categorias.filter((c) => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
  }, [categorias, query]);

  const actual = categorias.find((c) => c.id === open);

  if (actual) {
    return (
      <div className="space-y-4 pb-4">
        <CategoryHeader label={actual.label} desc={actual.desc} onBack={() => setOpen(null)} />

        {actual.id === 'perfil' && (
          <>
            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Datos básicos</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre">
                  <TextInput value={local.nombre} onChange={(e) => setLocal({ ...local, nombre: e.target.value })} onBlur={() => onUpdatePerfil(local)} />
                </Field>
                <Field label="Apellidos">
                  <TextInput value={local.apellidos} onChange={(e) => setLocal({ ...local, apellidos: e.target.value })} onBlur={() => onUpdatePerfil(local)} />
                </Field>
              </div>
              <Field label="Nombre mostrado (opcional)">
                <TextInput placeholder={local.nombre || 'Se usará el nombre'} value={local.nombreMostrado} onChange={(e) => setLocal({ ...local, nombreMostrado: e.target.value })} onBlur={() => onUpdatePerfil(local)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha de nacimiento">
                  <TextInput type="date" value={local.fechaNacimiento} onChange={(e) => commit({ ...local, fechaNacimiento: e.target.value })} />
                </Field>
                <Field label="Edad (calculada)">
                  <TextInput value={`${edad} años`} disabled style={{ opacity: 0.6 }} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Sexo">
                  <Select value={local.sexo} onChange={(e) => commit({ ...local, sexo: e.target.value })}>
                    <option value="">Sin especificar</option>
                    {SEXOS_PERFIL.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </Field>
                <Field label="Pronombres (opcional)">
                  <TextInput value={local.pronombres} onChange={(e) => setLocal({ ...local, pronombres: e.target.value })} onBlur={() => onUpdatePerfil(local)} />
                </Field>
              </div>
            </Card>

            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Información física</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Altura (cm)">
                  <TextInput type="number" value={local.altura} onChange={(e) => setLocal({ ...local, altura: Number(e.target.value) })} onBlur={() => onUpdatePerfil(local)} />
                </Field>
                <Field label="Peso (kg)">
                  <TextInput type="number" value={local.peso} onChange={(e) => setLocal({ ...local, peso: Number(e.target.value) })} onBlur={() => onUpdatePerfil(local)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Peso objetivo (kg, opcional)">
                  <TextInput type="number" value={local.pesoObjetivo ?? ''} onChange={(e) => setLocal({ ...local, pesoObjetivo: e.target.value === '' ? null : Number(e.target.value) })} onBlur={() => onUpdatePerfil(local)} />
                </Field>
                <Field label="Mano dominante (opcional)">
                  <Select value={local.manoDominante} onChange={(e) => commit({ ...local, manoDominante: e.target.value })}>
                    <option value="">Sin especificar</option>
                    {MANOS_DOMINANTES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="Nivel de actividad">
                <Select value={local.actividad} onChange={(e) => commit({ ...local, actividad: e.target.value })}>
                  <option value="sedentario">Sedentario</option>
                  <option value="ligero">Ligero</option>
                  <option value="moderado">Moderado</option>
                  <option value="intenso">Intenso</option>
                </Select>
              </Field>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                El peso objetivo no modifica el peso actual — solo lo usarán Nutrición/Objetivos/IA cuando esté conectado.
              </p>
            </Card>

            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Información deportiva</p>
              <Field label="Objetivo principal">
                <Select value={local.objetivoPrincipal} onChange={(e) => commit({ ...local, objetivoPrincipal: e.target.value })}>
                  <option value="">Sin especificar</option>
                  {OBJETIVOS_PRINCIPALES.map((o) => <option key={o} value={o}>{o}</option>)}
                </Select>
              </Field>
              <Field label="Deportes practicados">
                <DeportesChips value={local.deportesPracticados} onChange={(v) => commit({ ...local, deportesPracticados: v })} accent={accent} />
              </Field>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="Nivel deportivo">
                  <Select value={local.nivelDeportivo} onChange={(e) => commit({ ...local, nivelDeportivo: e.target.value })}>
                    <option value="">Sin especificar</option>
                    {NIVELES_DEPORTIVOS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </Select>
                </Field>
                <Field label="Años de experiencia">
                  <Select value={local.aniosExperiencia} onChange={(e) => commit({ ...local, aniosExperiencia: e.target.value })}>
                    <option value="">Sin especificar</option>
                    {ANIOS_EXPERIENCIA_OPCIONES.map((a) => <option key={a} value={a}>{a}</option>)}
                  </Select>
                </Field>
              </div>
              <p className="block text-xs mb-1.5 mt-3 font-medium" style={{ color: COLORS.textMuted }}>Lesiones relevantes (opcional)</p>
              <LesionesEditor value={local.lesiones} onChange={(v) => commit({ ...local, lesiones: v })} accent={accent} />
            </Card>

            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Información académica</p>
              <Field label="Nivel educativo">
                <Select value={local.nivelEducativo} onChange={(e) => commit({ ...local, nivelEducativo: e.target.value })}>
                  <option value="">Sin especificar</option>
                  {NIVELES_EDUCATIVOS.map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </Field>
              <Field label="Estudios actuales">
                <TextInput placeholder="Ej. Bachillerato Científico" value={local.estudiosActuales} onChange={(e) => setLocal({ ...local, estudiosActuales: e.target.value })} onBlur={() => onUpdatePerfil(local)} />
              </Field>
              <Field label="Profesión (opcional)">
                <TextInput value={local.profesion} onChange={(e) => setLocal({ ...local, profesion: e.target.value })} onBlur={() => onUpdatePerfil(local)} />
              </Field>
            </Card>

            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Información general</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Idioma">
                  <Select value={local.idioma} onChange={(e) => commit({ ...local, idioma: e.target.value })}>
                    {IDIOMAS_DISPONIBLES.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                  </Select>
                </Field>
                <Field label="Sistema de unidades">
                  <Select value={local.sistemaUnidades} onChange={(e) => commit({ ...local, sistemaUnidades: e.target.value })}>
                    {SISTEMAS_UNIDADES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="Zona horaria">
                <Select value={local.zonaHorariaAutomatica ? 'auto' : 'manual'} onChange={(e) => commit({ ...local, zonaHorariaAutomatica: e.target.value === 'auto' })}>
                  <option value="auto">Automática (detectada del dispositivo)</option>
                  <option value="manual">Manual</option>
                </Select>
              </Field>
              {!local.zonaHorariaAutomatica && (
                <Field label="Zona horaria manual">
                  <TextInput placeholder="Ej. Europe/Madrid" value={local.zonaHorariaManual} onChange={(e) => setLocal({ ...local, zonaHorariaManual: e.target.value })} onBlur={() => onUpdatePerfil(local)} />
                </Field>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="País">
                  <TextInput value={local.pais} onChange={(e) => setLocal({ ...local, pais: e.target.value })} onBlur={() => onUpdatePerfil(local)} />
                </Field>
                <Field label="Región (opcional)">
                  <TextInput value={local.region} onChange={(e) => setLocal({ ...local, region: e.target.value })} onBlur={() => onUpdatePerfil(local)} />
                </Field>
              </div>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                Español es el único idioma disponible hoy. El sistema de unidades solo se guarda como preferencia — convertir cm/kg en el resto de la app es trabajo pendiente, no algo ya activo.
              </p>
            </Card>

            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Cálculos corporales</p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div><p className="text-xl font-bold" style={{ color: COLORS.text }}>{edad}</p><p className="text-xs" style={{ color: COLORS.textMuted }}>años</p></div>
                <div><p className="text-xl font-bold" style={{ color: COLORS.text }}>{imc.toFixed(1)}</p><p className="text-xs" style={{ color: COLORS.textMuted }}>IMC</p></div>
                <div><p className="text-xl font-bold" style={{ color: COLORS.text }}>{Math.round(bmr)}</p><p className="text-xs" style={{ color: COLORS.textMuted }}>BMR kcal</p></div>
                <div><p className="text-xl font-bold" style={{ color: COLORS.text }}>{Math.round(tdee)}</p><p className="text-xs" style={{ color: COLORS.textMuted }}>TDEE kcal</p></div>
              </div>
              <p className="text-xs mt-3 text-center leading-relaxed" style={{ color: COLORS.textMuted }}>
                Peso saludable orientativo: {pesoMin}–{pesoMax} kg. Son datos orientativos, no un diagnóstico — con 16 años y en desarrollo, dicen poco por sí solos.
              </p>
            </Card>

            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Acciones</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <GhostBtn onClick={exportarPerfil} icon={Download}>Exportar perfil</GhostBtn>
                <GhostBtn onClick={() => fileInputRef.current?.click()} icon={Upload}>Importar perfil</GhostBtn>
              </div>
              <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
              {importError && <p className="text-xs mb-2" style={{ color: COLORS.negative }}>{importError}</p>}
              {pendingImport && (
                <div className="mb-3 px-3 py-2 rounded-xl" style={{ background: COLORS.surface2 }}>
                  <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>Vas a reemplazar tu perfil actual por el importado. Los campos que falten en el archivo volverán a su valor por defecto.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setPendingImport(null)} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cancelar</button>
                    <button onClick={confirmarImport} className="text-xs font-semibold" style={{ color: accent }}>Confirmar importación</button>
                  </div>
                </div>
              )}
              {!confirmandoReset ? (
                <button onClick={() => setConfirmandoReset(true)} className="flex items-center gap-2 text-xs font-semibold" style={{ color: COLORS.negative }}>
                  <RotateCcw size={14} /> Restablecer perfil completo
                </button>
              ) : (
                <div className="px-3 py-2 rounded-xl" style={{ background: COLORS.surface2 }}>
                  <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>Esto borra todos los campos de Perfil (nombre, físico, deportivo, académico y general) y los deja como al principio. No afecta a Salud, Entrenamiento ni al resto de módulos.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmandoReset(false)} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cancelar</button>
                    <button onClick={restablecerPerfil} className="text-xs font-semibold" style={{ color: COLORS.negative }}>Sí, restablecer</button>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {actual.id === 'apariencia' && (
          <>
            {/* FO Fase 10, apartados 4 y 6 — la vista previa global, arriba del todo y
                siempre visible: es la referencia contra la que se juzga cualquier
                cambio de los que hay debajo. */}
            <VistaPreviaGlobal fondo={apariencia.fondo} urlFoto={urlFotoFondo} accent={accent} />

            {/* Modo claro/oscuro: fuera de las secciones plegables a propósito. Es lo
                que más se toca, y llevaba aquí desde la Fase A3 — Josué ya sabe dónde
                está y esta fase no puede moverlo. */}
            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Tema</p>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>Claro, Oscuro o Automático (sigue al sistema, sin reiniciar la app).</p>
              <OpcionesFila opciones={TEMAS_DISPONIBLES} valor={apariencia.tema} onChange={(v) => onUpdateApariencia({ ...apariencia, tema: v })} accent={accent} />
            </Card>

            {/* FO Fase 1 — el fondo, dentro de Apariencia y no en una pantalla aparte: el
                apartado 5 pide que se integre con el sistema que ya existe, no que compita. */}
            <Seccion titulo="Fondo" sub={describirFondo(apariencia.fondo)} icono={ImageIcon} accent={accent} defecto>
            <BloqueFondo
              fondo={apariencia.fondo}
              accent={accent}
              onCambiar={(f) => onUpdateApariencia({ ...apariencia, fondo: f })}
              onSubirFoto={onSubirFotoFondo}
              urlFotoFondo={urlFotoFondo}
              analisisFoto={apariencia.fondo?.analisis}
              onAnalisisFoto={(a) => onUpdateApariencia({ ...apariencia, fondo: { ...apariencia.fondo, analisis: a } })}
            />

            </Seccion>

            <Seccion titulo="Colores" sub="Acento, paletas, tarjetas y bordes" icono={Palette} accent={accent}>
            <BloqueLegibilidad
              tema={temaPersonalizado}
              fondoActivo={!!apariencia.fondo?.activo}
              accent={accent}
              onCambiar={onUpdateTemaPersonalizado}
            />

            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Color de acento</p>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>Toca un color para aplicarlo a toda la app al instante, o abre el editor avanzado para elegir cualquier color.</p>
              <div className="flex flex-wrap gap-3">
                {ACCENTS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => onUpdateAccent(a.value)}
                    aria-label={a.name}
                    className="w-10 h-10 rounded-full transition-transform active:scale-90"
                    style={{
                      background: `linear-gradient(135deg, ${shade(a.value, 45)}, ${a.value} 55%, ${shade(a.value, -35)})`,
                      boxShadow: accent === a.value ? `0 0 0 2px ${COLORS.bg}, 0 0 0 4px ${a.value}` : 'none',
                    }}
                  />
                ))}
                {/* Fase 2 del Sistema de Personalización Visual Extrema — abre el editor avanzado
                    (ColorPicker.jsx): espectro completo, no limitado a estos 12 preestablecidos. */}
                <button
                  onClick={() => setColorPickerAbierto(true)}
                  aria-label="Color personalizado"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
                  style={{
                    background: 'conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)',
                    boxShadow: !ACCENTS.some((a) => a.value === accent) ? `0 0 0 2px ${COLORS.bg}, 0 0 0 4px ${accent}` : 'none',
                  }}
                >
                  <span className="w-4 h-4 rounded-full" style={{ background: COLORS.surface }} />
                </button>
              </div>
              <p className="text-xs mt-3" style={{ color: COLORS.textMuted }}>
                El acento nunca se usa en estados críticos (error/aviso/éxito) — esos mantienen su color fijo en toda la app.
              </p>
            </Card>

            {colorPickerAbierto && (
              <ColorPicker
                initialHex={accent}
                accent={accent}
                onPreview={onPreviewAccent}
                onCommit={(hex) => { onUpdateAccent(hex); onRegistrarColorReciente(hex); }}
                onClose={() => setColorPickerAbierto(false)}
                recientes={historialColor.recientes}
                favoritos={historialColor.favoritos}
                onToggleFavorito={onToggleFavoritoColor}
              />
            )}

            {/* Fase 4 del Sistema de Personalización Visual Extrema — Presets + gestión de temas:
                galería de temas predefinidos (siempre visible) y, en modo avanzado, gestión
                completa de temas propios (crear/renombrar/duplicar/eliminar/exportar/importar) +
                el interruptor de modo avanzado en sí. Ver GestionTemas.jsx. */}
            <GestionTemas
              accent={accent}
              apariencia={apariencia}
              onUpdateApariencia={onUpdateApariencia}
              temasGuardados={temasGuardados}
              onAplicarConjuntoTema={onAplicarConjuntoTema}
              onRestablecerTemaOficial={onRestablecerTemaOficial}
              onGuardarTemaComoNuevo={onGuardarTemaComoNuevo}
              onRenombrarTemaGuardado={onRenombrarTemaGuardado}
              onDuplicarTemaGuardado={onDuplicarTemaGuardado}
              onEliminarTemaGuardado={onEliminarTemaGuardado}
              onImportarTemaGuardado={onImportarTemaGuardado}
            />

            {/* Fase 3 del Sistema de Personalización Visual Extrema — Constructor de temas: el
                resto de roles (Secundario/Terciario/Fondo/Superficie/Texto/Bordes, y Estados en
                una sección aparte con aviso). Ver TemaBuilder.jsx. Solo en modo avanzado (Fase 4)
                — un componente de 10 campos no debería verse por accidente. */}
            {apariencia.modoColorAvanzado && (
              <Card>
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Constructor de temas</p>
                <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                  Personaliza el resto de la paleta más allá del acento: colores secundarios, fondo, superficie, texto
                  y bordes. Cada uno es automático hasta que lo cambias a mano.
                </p>
                <GhostBtn onClick={() => setTemaBuilderAbierto(true)} icon={Palette}>Abrir constructor de temas</GhostBtn>
              </Card>
            )}

            {temaBuilderAbierto && apariencia.modoColorAvanzado && (
              <TemaBuilder
                accent={accent}
                temaPersonalizado={temaPersonalizado}
                onPreviewTemaPersonalizado={onPreviewTemaPersonalizado}
                onUpdateTemaPersonalizado={onUpdateTemaPersonalizado}
                onClose={() => setTemaBuilderAbierto(false)}
                historialColor={historialColor}
                onRegistrarColorReciente={onRegistrarColorReciente}
                onToggleFavoritoColor={onToggleFavoritoColor}
              />
            )}

            </Seccion>

            {/* FO Fase 6 — `BloqueRecomendado` no pinta nada si no hay una foto
                analizada: sin ella no hay nada que recomendar y un bloque vacío sería
                un control decorativo (regla 8). La sección se queda plegada y vacía,
                que es honesto: la opción existe, pero todavía no puede hacer nada. */}
            <Seccion titulo="Recomendado" sub="Apariencias sacadas de tu foto" icono={Sparkles} accent={accent}>
            <BloqueRecomendado
              analisis={apariencia.fondo?.analisis}
              tema={temaPersonalizado}
              accent={accent}
              fondo={apariencia.fondo}
              modoOscuro={apariencia.tema !== 'claro'}
              onProbar={(c) => { onUpdateAccent(c.accent); onUpdateTemaPersonalizado(c.tema); onUpdateApariencia({ ...apariencia, fondo: { ...apariencia.fondo, overlay: c.overlay } }); }}
              onAplicar={(c) => { onUpdateAccent(c.accent); onUpdateTemaPersonalizado(c.tema); onUpdateApariencia({ ...apariencia, fondo: { ...apariencia.fondo, overlay: c.overlay } }); }}
            />

            </Seccion>

            <Seccion titulo="Apariencias guardadas" sub="Tus estilos y los incluidos" icono={LayoutGrid} accent={accent}>
            <BloquePresets
              presets={temasGuardados}
              apariencia={apariencia}
              accent={accent}
              temaPersonalizado={temaPersonalizado}
              onGuardar={onGuardarPreset}
              onCambiarPresets={onCambiarPresets}
              onAplicar={onAplicarPreset}
            />

            </Seccion>

            <Seccion titulo="Legibilidad" sub="Que todo se lea sobre tu fondo" icono={ShieldCheck} accent={accent}>
            <BloqueLegibilidadAuto
              colors={COLORS}
              fondo={apariencia.fondo}
              analisis={apariencia.fondo?.analisis}
              tema={temaPersonalizado}
              accent={accent}
              auto={!!apariencia.legibilidadAuto}
              onSetAuto={(v) => onUpdateApariencia({ ...apariencia, legibilidadAuto: v })}
              onCorregir={(c) => {
                if (c.accent) onUpdateAccent(c.accent);
                if (Object.keys(c.tema).length) onUpdateTemaPersonalizado({ ...temaPersonalizado, ...c.tema });
                if (Object.keys(c.fondo).length) onUpdateApariencia({ ...apariencia, fondo: { ...apariencia.fondo, ...c.fondo } });
              }}
            />

            </Seccion>

            <Seccion titulo="Texto y movimiento" sub="Tamaño, densidad, bordes y animaciones" icono={Type} accent={accent}>
            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Tamaño de texto</p>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>Escala todo el texto de la app de golpe (también iconos y botones, al ser proporcional).</p>
              <OpcionesFila opciones={TAMANOS_TEXTO} valor={apariencia.tamanoTexto} onChange={(v) => onUpdateApariencia({ ...apariencia, tamanoTexto: v })} accent={accent} />
            </Card>

            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Densidad de interfaz</p>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>Compacta (más información), Estándar (recomendada) o Cómoda (más espacio).</p>
              <OpcionesFila opciones={DENSIDADES_INTERFAZ} valor={apariencia.densidad} onChange={(v) => onUpdateApariencia({ ...apariencia, densidad: v })} accent={accent} />
              <p className="text-xs mt-3" style={{ color: COLORS.textMuted }}>
                Cambia el aire entre tarjetas y su relleno interior. No afecta al tamaño del texto: eso se ajusta arriba.
              </p>
            </Card>

            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Bordes</p>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>Radio de las tarjetas, botones y campos de toda la app.</p>
              <OpcionesFila opciones={RADIOS_BORDE} valor={apariencia.radioBorde} onChange={(v) => onUpdateApariencia({ ...apariencia, radioBorde: v })} accent={accent} />
            </Card>

            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Animaciones</p>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>Nivel de animación e interruptor directo para reducir movimiento.</p>
              <OpcionesFila opciones={NIVELES_ANIMACION} valor={apariencia.animaciones} onChange={(v) => onUpdateApariencia({ ...apariencia, animaciones: v })} accent={accent} />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Reducir movimiento (independiente del nivel de arriba)</p>
                <button
                  onClick={() => onUpdateApariencia({ ...apariencia, reducirMovimiento: !apariencia.reducirMovimiento })}
                  aria-label="Reducir movimiento"
                  className="w-11 h-6 rounded-full relative flex-shrink-0"
                  style={{ background: apariencia.reducirMovimiento ? accent : COLORS.surface2, border: `1px solid ${COLORS.border}` }}
                >
                  <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ background: '#fff', left: apariencia.reducirMovimiento ? 22 : 2 }} />
                </button>
              </div>
              <p className="text-xs mt-3" style={{ color: COLORS.textMuted }}>
                Hoy la app tiene pocas animaciones propias, así que el efecto real más notable es "Desactivadas" o el interruptor de arriba: eliminan transiciones y animaciones CSS en toda la app. También se respeta automáticamente si tu sistema operativo tiene activado "Reducir movimiento".
              </p>
            </Card>

            </Seccion>

            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Acciones</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <GhostBtn onClick={exportarApariencia} icon={Download}>Exportar apariencia</GhostBtn>
                <GhostBtn onClick={() => fileInputRefApariencia.current?.click()} icon={Upload}>Importar apariencia</GhostBtn>
              </div>
              <input ref={fileInputRefApariencia} type="file" accept="application/json" onChange={handleImportApariencia} className="hidden" />
              {importErrorApariencia && <p className="text-xs mb-2" style={{ color: COLORS.negative }}>{importErrorApariencia}</p>}
              {pendingImportApariencia && (
                <div className="mb-3 px-3 py-2 rounded-xl" style={{ background: COLORS.surface2 }}>
                  <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>Vas a reemplazar tema, tamaño de texto, densidad, bordes, animaciones y acento por los del archivo importado.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setPendingImportApariencia(null)} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cancelar</button>
                    <button onClick={confirmarImportApariencia} className="text-xs font-semibold" style={{ color: accent }}>Confirmar importación</button>
                  </div>
                </div>
              )}
              {!confirmandoResetApariencia ? (
                <button onClick={() => setConfirmandoResetApariencia(true)} className="flex items-center gap-2 text-xs font-semibold" style={{ color: COLORS.negative }}>
                  <RotateCcw size={14} /> Restablecer apariencia
                </button>
              ) : (
                <div className="px-3 py-2 rounded-xl" style={{ background: COLORS.surface2 }}>
                  <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>Esto vuelve tema, texto, densidad, bordes y animaciones a sus valores por defecto. El color de acento no se toca.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmandoResetApariencia(false)} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cancelar</button>
                    <button onClick={restablecerApariencia} className="text-xs font-semibold" style={{ color: COLORS.negative }}>Sí, restablecer</button>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {actual.id === 'pantalla-principal' && (
          <PersonalizationView
            areas={areas}
            modulos={modulos}
            personalizacion={personalizacion}
            protectedAreas={seguridad.protectedAreas}
            onMove={onMove}
            onToggleOculto={onToggleOculto}
            onToggleDashboard={onToggleDashboard}
            onAplicarPerfil={onAplicarPerfil}
            onSetIcono={onSetIcono}
            onTogglePinExtra={onTogglePinExtra}
            onToggleFavorita={onToggleFavorita}
            onMoveFavorita={onMoveFavorita}
            modo={modo}
            onSetModo={onSetModo}
            accent={accent}
          />
        )}

        {actual.id === 'seguridad' && (
          <>
            {/* Fase de Seguridad Centralizada — sustituye a "PIN de secciones privadas" (PinSetter,
                comparación en texto plano). El PIN se guarda hasheado (src/lib/pin.js); cambiarlo
                o desactivarlo siempre pide primero el PIN actual (apartado 3, el caso crítico de
                Seguridad) — por eso estos botones no hacen nada aquí mismo, solo abren el flujo
                centralizado de App.jsx (`onIniciarCambioPin`/`onIniciarDesactivarPin`), que decide
                si hace falta verificar y muestra el modal correspondiente. */}
            <Card>
              <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: COLORS.text }}>
                <Lock size={16} style={{ color: accent }} /> PIN
              </p>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                {seguridad.pinHash
                  ? 'Protege las zonas y funciones que actives más abajo. Cambiarlo o desactivarlo pide siempre el PIN actual.'
                  : 'Crea un PIN para poder proteger cualquier sección o función sensible de la app.'}
              </p>
              {seguridad.pinHash ? (
                <>
                  <p className="text-xs mb-3 flex items-center gap-1" style={{ color: COLORS.positive }}>
                    <ShieldCheck size={12} /> PIN activo
                  </p>
                  <div className="flex gap-2">
                    <GhostBtn onClick={onIniciarCambioPin} icon={RefreshCw}>Cambiar PIN</GhostBtn>
                    <GhostBtn onClick={onIniciarDesactivarPin} icon={Lock}>Desactivar</GhostBtn>
                  </div>
                </>
              ) : (
                <GhostBtn onClick={onIniciarCrearPin} icon={Lock}>Crear PIN</GhostBtn>
              )}
            </Card>

            {/* "Protección mediante PIN" (apartado 1) — catálogo completo de zonas protegibles, no
                solo los módulos actuales: `areasProtegibles` viene de MORE_NAV en App.jsx, así que
                cualquier módulo futuro aparece aquí solo, sin tocar este archivo. Quitar protección
                a una que ya la tenga pasa por `onToggleAreaProtegida`, que pide el PIN actual antes
                (apartado 3). 'Relación' sigue igual que siempre: protegida sin poder quitarla. */}
            <Card>
              <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: COLORS.text }}>
                <ShieldCheck size={16} style={{ color: accent }} /> Protección mediante PIN
              </p>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                {seguridad.pinHash
                  ? 'Elige qué secciones piden el PIN al entrar. Quitarle protección a una que ya la tenga vuelve a pedir tu PIN actual.'
                  : 'Crea un PIN arriba para poder activar esto.'}
              </p>
              {seguridad.pinHash && (
                <div>
                  {areasProtegibles.map((a) => {
                    const esRelacion = a.id === 'relacion';
                    const activo = esRelacion || seguridad.protectedAreas.includes(a.id);
                    const Icono = a.icon;
                    return (
                      <div key={a.id} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <span className="text-sm flex items-center gap-2" style={{ color: COLORS.text }}>
                          {Icono && <Icono size={14} style={{ color: COLORS.textMuted }} />} {a.label}
                        </span>
                        <button
                          onClick={() => (esRelacion ? null : onToggleAreaProtegida(a.id))}
                          disabled={esRelacion}
                          aria-label={activo ? `Quitar protección de ${a.label}` : `Proteger ${a.label} con PIN`}
                          title={esRelacion ? 'Relación siempre está protegida' : undefined}
                          className="w-11 h-6 rounded-full relative flex-shrink-0 disabled:opacity-60"
                          style={{ background: activo ? accent : COLORS.surface2, border: `1px solid ${COLORS.border}` }}
                        >
                          <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ background: '#fff', left: activo ? 22 : 2 }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Protección de función (apartado 2) — más granular que la de arriba: no bloquea toda
                una sección, solo la acción concreta. Todavía cubre solo las que ya están cableadas
                de verdad (ver HealthView.jsx y App.jsx); el resto del catálogo del apartado 2 queda
                preparado en el modelo de datos pero sin una pantalla real que proteger todavía. */}
            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Protección de funciones</p>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                {seguridad.pinHash
                  ? 'Acciones concretas que piden el PIN aunque la sección donde viven no esté protegida entera.'
                  : 'Crea un PIN arriba para poder activar esto.'}
              </p>
              {seguridad.pinHash && (
                <div>
                  {ACCIONES_PROTEGIBLES.map((a) => {
                    const activo = seguridad.protectedActions.includes(a.id);
                    return (
                      <div key={a.id} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <span className="text-sm" style={{ color: COLORS.text }}>{a.label}</span>
                        <button
                          onClick={() => onToggleAccionProtegida(a.id)}
                          aria-label={activo ? `Quitar protección de ${a.label}` : `Proteger ${a.label} con PIN`}
                          className="w-11 h-6 rounded-full relative flex-shrink-0"
                          style={{ background: activo ? accent : COLORS.surface2, border: `1px solid ${COLORS.border}` }}
                        >
                          <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ background: '#fff', left: activo ? 22 : 2 }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Sesión temporal de desbloqueo (apartado 6) — no hace falta verificación para
                cambiarla: no reduce ni amplía qué está protegido, solo cuánto dura desbloqueado. */}
            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Sesión de desbloqueo</p>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                Cuánto tiempo queda desbloqueada una sección o función tras acertar el PIN una vez, antes de volver a pedirlo.
              </p>
              {seguridad.pinHash ? (
                <OpcionesFila opciones={OPCIONES_SESION_PIN} valor={seguridad.sessionTimeoutMin} onChange={(v) => onUpdateSeguridad({ ...seguridad, sessionTimeoutMin: v })} accent={accent} />
              ) : (
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Crea un PIN arriba para poder activar esto.</p>
              )}
            </Card>

            <Card>
              <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: COLORS.text }}>
                <ShieldCheck size={16} style={{ color: accent }} /> Biometría
              </p>
              {!seguridad.pinHash ? (
                <p className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>
                  Crea primero un PIN arriba — la biometría necesita el PIN como respaldo obligatorio (si falla Face ID/Touch ID, o cambias de dispositivo, el PIN sigue funcionando).
                </p>
              ) : !biometriaSoportadaAqui ? (
                <p className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>
                  Este navegador no soporta biometría (WebAuthn). En iPhone necesitas Safari con la app instalada como PWA — pruébalo desde ahí.
                </p>
              ) : seguridad.biometriaActiva ? (
                <>
                  <p className="text-xs mb-3 flex items-center gap-1" style={{ color: COLORS.positive }}>
                    <ShieldCheck size={12} /> Activada en este dispositivo
                  </p>
                  <button onClick={desactivarBiometria} className="text-xs font-semibold" style={{ color: COLORS.negative }}>Desactivar</button>
                </>
              ) : (
                <>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: COLORS.textMuted }}>
                    Face ID / Touch ID / huella como desbloqueo rápido adicional, con el PIN siempre como respaldo. Te pedirá verificarte con el sistema al activarla.
                  </p>
                  <GhostBtn onClick={activarBiometria} icon={ShieldCheck}>
                    {registrandoBiometria ? 'Comprobando…' : 'Activar biometría'}
                  </GhostBtn>
                  {biometriaError && <p className="text-xs mt-2" style={{ color: COLORS.negative }}>{biometriaError}</p>}
                </>
              )}
              <p className="text-xs mt-3 leading-relaxed" style={{ color: COLORS.textMuted }}>
                Verifica tu Face ID/Touch ID/huella real a través del sistema operativo, pero se guarda solo en este dispositivo — no hay servidor que la verifique, así que tiene el mismo nivel de confianza que el PIN, solo que más rápida de usar. Actívala en cada dispositivo por separado.
              </p>
            </Card>

            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Bloqueo automático</p>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                {seguridad.pinHash ? 'Bloquea toda la app (no solo las zonas protegidas) tras un rato sin usarla — con biometría activada, se desbloquea rápido sin escribir el PIN.' : 'Crea un PIN arriba para poder activar esto.'}
              </p>
              {seguridad.pinHash && (
                <OpcionesFila opciones={OPCIONES_BLOQUEO_AUTOMATICO} valor={seguridad.bloqueoAutomatico} onChange={(v) => onUpdateSeguridad({ ...seguridad, bloqueoAutomatico: v })} accent={accent} />
              )}
            </Card>

            <button onClick={onSignOut} className="flex items-center justify-center gap-2 text-xs font-semibold w-full py-2" style={{ color: COLORS.textMuted }}>
              <LogOut size={14} /> Cerrar sesión
            </button>
          </>
        )}

        {actual.id === 'datos' && (
          <Card>
            <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Copia de seguridad</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <GhostBtn onClick={onExportCSV} icon={Download}>Exportar CSV</GhostBtn>
              <GhostBtn onClick={onExportXLSX} icon={Download}>Exportar Excel</GhostBtn>
            </div>
            <button
              onClick={onUndo} disabled={!canUndo}
              className="flex items-center gap-2 text-xs font-semibold disabled:opacity-40"
              style={{ color: COLORS.textMuted }}
            >
              <Undo2 size={14} /> Deshacer último cambio
            </button>
          </Card>
        )}

        {/* Entrega 2 · ME Fase 3 — la papelera es una vista propia porque tiene bastante
            contenido (lista, acciones por elemento, retención, vaciado con confirmación) y
            porque conviene poder reutilizarla si en el futuro se abre desde otro sitio. */}
        {actual.id === 'papelera' && (
          <PapeleraView
            papelera={papelera}
            relacionDesbloqueada={relacionDesbloqueada}
            onRestaurar={onRestaurarPapelera}
            onEliminarDefinitivo={onEliminarDefinitivo}
            onVaciar={onVaciarPapelera}
            onSetRetencion={onSetRetencionPapelera}
            accent={accent}
          />
        )}

        {actual.id === 'privacidad' && (
          <>
            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Panel de transparencia</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm" style={{ color: COLORS.textMuted }}>PIN</span>
                  <span className="text-sm font-semibold" style={{ color: seguridad.pinHash ? COLORS.positive : COLORS.textMuted }}>{seguridad.pinHash ? `Activo · ${seguridad.protectedAreas.length + 1} zona(s) protegida(s)` : 'No creado'}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm" style={{ color: COLORS.textMuted }}>Biometría</span>
                  <span className="text-sm font-semibold" style={{ color: seguridad.biometriaActiva ? COLORS.positive : COLORS.textMuted }}>{seguridad.biometriaActiva ? 'Activa en este dispositivo' : 'Desactivada'}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm" style={{ color: COLORS.textMuted }}>Bloqueo automático</span>
                  <span className="text-sm font-semibold" style={{ color: COLORS.text }}>{(OPCIONES_BLOQUEO_AUTOMATICO.find((o) => o.value === seguridad.bloqueoAutomatico) || {}).label}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm" style={{ color: COLORS.textMuted }}>Notificaciones</span>
                  <span className="text-sm font-semibold" style={{ color: COLORS.text }}>{notificaciones.activadas ? `Activadas (${Object.values(notificaciones.categorias).filter(Boolean).length}/${Object.keys(notificaciones.categorias).length} categorías)` : 'Desactivadas'}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm" style={{ color: COLORS.textMuted }}>Sincronización</span>
                  <span className="text-sm font-semibold" style={{ color: COLORS.positive }}>Automática con Supabase</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm" style={{ color: COLORS.textMuted }}>Integraciones externas</span>
                  <span className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>Ninguna conectada</span>
                </div>
              </div>
            </Card>

            <InfoOnly>
              Qué usa la Inteligencia Artificial: cada botón de IA de la app manda a un único proxy (`api/ask-ai.js`, en Vercel) los datos concretos de esa pantalla — nunca todos tus datos a la vez, y nunca la pestaña Relación, que queda excluida siempre. El proxy reenvía la pregunta a la API de Anthropic (procesamiento externo, no en tu dispositivo) y no guarda copia por su cuenta. La app no tiene memoria propia de conversaciones con la IA más allá de lo que ya ves en pantalla en cada momento.
            </InfoOnly>

            <InfoOnly>
              Permisos del dispositivo: esta app no pide permiso de cámara, micrófono ni ubicación — las fotos y vídeos se suben con el selector de archivos normal del sistema (que ya gestiona el propio sistema operativo, no la app), y el escaneo de códigos de barras usa una librería que lee directamente esos archivos, no la cámara en vivo. No hay ningún permiso de este tipo que gestionar aquí.
            </InfoOnly>

            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Eliminar datos por categoría</p>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>Borra solo esa categoría, sin tocar el resto. Perfil se restablece desde su propia categoría.</p>
              <div className="space-y-2">
                {modulosBorrables.map((m) => (
                  <div key={m.id}>
                    {confirmandoBorrado !== m.id ? (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm" style={{ color: COLORS.text }}>{m.label}</span>
                        <button onClick={() => setConfirmandoBorrado(m.id)} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: COLORS.negative }}>
                          <Trash2 size={13} /> Borrar
                        </button>
                      </div>
                    ) : (
                      <div className="px-3 py-2 rounded-xl" style={{ background: COLORS.surface2 }}>
                        <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>Esto borra todos los datos de "{m.label}" sin poder deshacerlo.</p>
                        <div className="flex gap-3">
                          <button onClick={() => setConfirmandoBorrado(null)} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cancelar</button>
                          <button onClick={() => confirmarBorrado(m.id)} className="text-xs font-semibold" style={{ color: COLORS.negative }}>Sí, borrar</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {actual.id === 'preferencias' && (
          <InfoOnly>
            Idioma, zona horaria, país/región y sistema de unidades se guardan y editan desde Perfil → "Información general" — no se duplican aquí. Español es hoy el único idioma disponible.
          </InfoOnly>
        )}

        {actual.id === 'notificaciones' && (
          <>
            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Permiso del sistema</p>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                {permisoNotif === 'granted' && 'Concedido — el navegador puede mostrar notificaciones.'}
                {permisoNotif === 'denied' && 'Denegado — actívalas desde los ajustes del navegador/sistema para este sitio, la app ya no puede pedirlo de nuevo.'}
                {permisoNotif === 'default' && 'Todavía no se ha pedido.'}
                {permisoNotif === 'no-soportado' && 'Este navegador no soporta notificaciones del sistema.'}
              </p>
              {permisoNotif === 'default' && (
                <GhostBtn onClick={solicitarPermisoNotif} icon={Bell}>Activar notificaciones</GhostBtn>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Activación global</p>
                  <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>Apaga esto y no se envía ninguna notificación, sin tocar las categorías de abajo.</p>
                </div>
                <button
                  onClick={() => onUpdateNotificaciones({ ...notificaciones, activadas: !notificaciones.activadas })}
                  aria-label="Activación global de notificaciones"
                  className="w-11 h-6 rounded-full relative flex-shrink-0"
                  style={{ background: notificaciones.activadas ? accent : COLORS.surface2, border: `1px solid ${COLORS.border}` }}
                >
                  <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ background: '#fff', left: notificaciones.activadas ? 22 : 2 }} />
                </button>
              </div>
            </Card>

            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Categorías</p>
              <div className="space-y-2">
                {CATEGORIAS_NOTIFICACION.map((c) => (
                  <div key={c.value} className="flex items-center justify-between">
                    <p className="text-sm" style={{ color: COLORS.text }}>{c.label}</p>
                    <button
                      onClick={() => onUpdateNotificaciones({ ...notificaciones, categorias: { ...notificaciones.categorias, [c.value]: !notificaciones.categorias[c.value] } })}
                      aria-label={`Notificaciones de ${c.label}`}
                      className="w-11 h-6 rounded-full relative flex-shrink-0"
                      style={{ background: notificaciones.categorias[c.value] ? accent : COLORS.surface2, border: `1px solid ${COLORS.border}` }}
                    >
                      <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ background: '#fff', left: notificaciones.categorias[c.value] ? 22 : 2 }} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-3 mb-1">
                <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Horario de descanso</p>
                <button
                  onClick={() => onUpdateNotificaciones({ ...notificaciones, horarioDescansoActivo: !notificaciones.horarioDescansoActivo })}
                  aria-label="Horario de descanso"
                  className="w-11 h-6 rounded-full relative flex-shrink-0"
                  style={{ background: notificaciones.horarioDescansoActivo ? accent : COLORS.surface2, border: `1px solid ${COLORS.border}` }}
                >
                  <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ background: '#fff', left: notificaciones.horarioDescansoActivo ? 22 : 2 }} />
                </button>
              </div>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>Fuera de este horario no se envía ninguna notificación de esta app.</p>
              {notificaciones.horarioDescansoActivo && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Desde">
                    <TextInput type="time" value={notificaciones.horarioDescansoInicio} onChange={(e) => onUpdateNotificaciones({ ...notificaciones, horarioDescansoInicio: e.target.value })} />
                  </Field>
                  <Field label="Hasta">
                    <TextInput type="time" value={notificaciones.horarioDescansoFin} onChange={(e) => onUpdateNotificaciones({ ...notificaciones, horarioDescansoFin: e.target.value })} />
                  </Field>
                </div>
              )}
            </Card>

            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Acciones</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <GhostBtn onClick={exportarNotificaciones} icon={Download}>Exportar</GhostBtn>
                <GhostBtn onClick={() => fileInputRefNotif.current?.click()} icon={Upload}>Importar</GhostBtn>
              </div>
              <input ref={fileInputRefNotif} type="file" accept="application/json" onChange={handleImportNotificaciones} className="hidden" />
              {importErrorNotif && <p className="text-xs mb-2" style={{ color: COLORS.negative }}>{importErrorNotif}</p>}
              {pendingImportNotif && (
                <div className="mb-3 px-3 py-2 rounded-xl" style={{ background: COLORS.surface2 }}>
                  <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>Vas a reemplazar la configuración de notificaciones por la del archivo importado.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setPendingImportNotif(null)} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cancelar</button>
                    <button onClick={confirmarImportNotificaciones} className="text-xs font-semibold" style={{ color: accent }}>Confirmar importación</button>
                  </div>
                </div>
              )}
              {!confirmandoResetNotif ? (
                <button onClick={() => setConfirmandoResetNotif(true)} className="flex items-center gap-2 text-xs font-semibold" style={{ color: COLORS.negative }}>
                  <RotateCcw size={14} /> Restablecer notificaciones
                </button>
              ) : (
                <div className="px-3 py-2 rounded-xl" style={{ background: COLORS.surface2 }}>
                  <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>Esto vuelve activación, categorías y horario a sus valores por defecto.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmandoResetNotif(false)} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cancelar</button>
                    <button onClick={restablecerNotificaciones} className="text-xs font-semibold" style={{ color: COLORS.negative }}>Sí, restablecer</button>
                  </div>
                </div>
              )}
            </Card>

            <InfoOnly>
              Las notificaciones llegan mientras tienes la app abierta en el navegador — no hay "Web Push" con servidor, así que no llegan con la app cerrada del todo. Ya están conectadas a los tres avisos automáticos de "Hoy" (sueño corto, racha en riesgo, examen sin horas): si activas el permiso y la categoría correspondiente, además del aviso dentro de la app recibirás una notificación real del sistema.
            </InfoOnly>
          </>
        )}

        {actual.id === 'sincronizacion' && (
          <InfoOnly>
            Tus datos se guardan y sincronizan automáticamente con Supabase en cuanto hay conexión — no hay nada que configurar. Si trabajas sin conexión, los cambios se guardan localmente y se sincronizan solos al recuperarla.
          </InfoOnly>
        )}

        {actual.id === 'integraciones' && (
          <InfoOnly>
            No hay ninguna integración externa conectada a tu cuenta ahora mismo.
          </InfoOnly>
        )}

        {actual.id === 'accesibilidad' && (
          <InfoOnly>
            El tamaño de texto, reducir movimiento y el alto contraste se controlan desde Apariencia — no se duplican aquí.
          </InfoOnly>
        )}

        {actual.id === 'informacion' && (
          <Card>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm" style={{ color: COLORS.textMuted }}>Versión</span>
              <span className="text-sm font-semibold" style={{ color: COLORS.text }}>{pkg.version}</span>
            </div>
            <div className="flex items-center justify-between py-1.5" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <span className="text-sm" style={{ color: COLORS.textMuted }}>Sistema Operativo Personal</span>
              <span className="text-sm" style={{ color: COLORS.text }}>Josué</span>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle>Ajustes</SectionTitle>

      <div className="relative">
        <Search size={15} style={{ color: COLORS.textMuted, position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <TextInput
          placeholder="Buscar en Ajustes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
      </div>

      <Card style={{ padding: 0 }}>
        {categoriasFiltradas.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: COLORS.textMuted }}>Sin resultados para "{query}".</p>
        )}
        {categoriasFiltradas.map((c, i) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => setOpen(c.id)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
              style={{ borderTop: i === 0 ? 'none' : `1px solid ${COLORS.border}` }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: hexToRgba(accent, 0.14) }}
              >
                <Icon size={16} style={{ color: accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{c.label}</p>
                <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>{c.desc}</p>
              </div>
              {!c.listo && (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0" style={{ background: COLORS.surface2, color: COLORS.textMuted }}>
                  Pronto
                </span>
              )}
              <ChevronRight size={16} style={{ color: COLORS.textMuted, flexShrink: 0 }} />
            </button>
          );
        })}
      </Card>
    </div>
  );
}
