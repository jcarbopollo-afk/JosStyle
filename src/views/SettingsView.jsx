import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  User, Download, Upload, RotateCcw, Undo2, Lock, LogOut, ArrowLeft, Search, ChevronRight,
  Palette, LayoutGrid, SlidersHorizontal, Bell, ShieldCheck,
  Database, RefreshCw, Puzzle, Accessibility, Info, EyeOff, Plus, Trash2,
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
import { Card, Field, TextInput, Select, GhostBtn, SectionTitle } from '../components/ui';
import PersonalizationView from './PersonalizationView';
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
  apariencia, onUpdateApariencia,
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
  modulos, personalizacion, onMove, onToggleOculto, onSetIcono, onTogglePinExtra,
  onToggleFavorita, onMoveFavorita, modo, onSetModo,
}) {
  const [local, setLocal] = useState(perfil);
  useEffect(() => { setLocal(perfil); }, [perfil]);
  const [open, setOpen] = useState(null); // id de categoría abierta, o null = lista
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
            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Tema</p>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>Claro, Oscuro o Automático (sigue al sistema, sin reiniciar la app).</p>
              <OpcionesFila opciones={TEMAS_DISPONIBLES} valor={apariencia.tema} onChange={(v) => onUpdateApariencia({ ...apariencia, tema: v })} accent={accent} />
            </Card>

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
            modulos={modulos}
            personalizacion={personalizacion}
            protectedAreas={seguridad.protectedAreas}
            onMove={onMove}
            onToggleOculto={onToggleOculto}
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
