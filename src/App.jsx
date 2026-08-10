import React, { useState, useEffect, useRef } from 'react';
import { Home, Moon, Dumbbell, Wallet, Settings, Loader2, HeartPulse, Apple, MoreHorizontal, GraduationCap, Briefcase, ListTodo, Target, BookOpen, Library, Heart, Church, Smartphone, BarChart3, TrendingUp, Search, Trophy, Lock, ArrowLeft } from 'lucide-react';
import { COLORS, ACCENTS, DEFAULT_PERFIL, DEFAULT_ECONOMIA, DEFAULT_CALISTENIA, DEFAULT_SALUD, DEFAULT_NUTRICION, DEFAULT_ESTUDIOS, DEFAULT_NEGOCIO, DEFAULT_PRODUCTIVIDAD, DEFAULT_OBJETIVOS, DEFAULT_DIARIO, DEFAULT_BIBLIOTECA, DEFAULT_RELACION, DEFAULT_FE, DEFAULT_BIENESTAR, DEFAULT_PERSONALIZACION, METRICAS_FAVORITAS_DISPONIBLES, MAX_METRICAS_FAVORITAS, MODOS_APP, DEFAULT_APARIENCIA, aplicarTema, TAMANOS_TEXTO, DEFAULT_NOTIFICACIONES, DEFAULT_SEGURIDAD, OPCIONES_BLOQUEO_AUTOMATICO, DEFAULT_HISTORIAL_COLOR, MAX_COLORES_RECIENTES, MAX_COLORES_FAVORITOS, DEFAULT_TEMA_PERSONALIZADO, DEFAULT_TEMAS_GUARDADOS, MAX_TEMAS_GUARDADOS, PALETAS_PREDEFINIDAS } from './tokens';
import { getSession, onAuthChange, loadData, saveData, signOut, uploadProgressPhoto, deleteProgressPhoto, uploadTrainingVideo, deleteTrainingVideo, uploadBibliotecaArchivo, deleteBibliotecaArchivo } from './lib/supabase';
import { exportCSV, exportXLSX } from './lib/exportData';
import { uid, todayISO, hexToRgba } from './lib/helpers';
import { extractPdfText } from './lib/pdfText';
import { prediccionObjetivo } from './lib/predicciones';
import { verificarBiometria } from './lib/biometria';
import { calcularResumenModulo } from './lib/resumenesHub';
import { PinGate, SuggestionsButton, UniversalSearchModal } from './components/ui';
import HubView from './views/HubView';
import Auth from './components/Auth';
import DashboardView from './views/DashboardView';
import SleepView from './views/SleepView';
import TrainingView from './views/TrainingView';
import FinanceView from './views/FinanceView';
import HealthView from './views/HealthView';
import NutritionView from './views/NutritionView';
import EstudiosView from './views/EstudiosView';
import BusinessView from './views/BusinessView';
import ProductivityView from './views/ProductivityView';
import ObjectivesView from './views/ObjectivesView';
import DiaryView from './views/DiaryView';
import LibraryView from './views/LibraryView';
import RelationView from './views/RelationView';
import FaithView from './views/FaithView';
import WellbeingView from './views/WellbeingView';
import StatsView from './views/StatsView';
import PredictionsView from './views/PredictionsView';
import AchievementsView from './views/AchievementsView';
import SettingsView from './views/SettingsView';
import { ICONOS_PERSONALIZABLES_MAP } from './views/PersonalizationView'; // el componente en sí ahora se usa dentro de SettingsView.jsx (Fase A1)

// Con Salud y Nutrición ya son 7 secciones — demasiadas para una sola barra inferior cómoda.
// A partir de la Fase 4: 4 accesos rápidos + "Más", que lista el resto. Cada módulo nuevo futuro
// se añade a MORE_NAV, no a la barra — así la barra nunca vuelve a ir apretada. Estudios (Fase 6),
// Negocio (Fase 7), Productividad (Fase 8) y Objetivos (Fase 9) siguen ese mismo criterio.
// Fase N1 — Nueva navegación por áreas (sustituye la barra de 4 accesos + "Más" plano por 5
// pestañas fijas: Inicio directo + 4 áreas que abren primero un "hub" de tarjetas, nunca el
// módulo directo). "hoy" sigue siendo un caso aparte, fuera de toda área, igual que antes.
// MORE_NAV sigue siendo el catálogo plano id → label/icono por defecto que ya usa Personalización
// (Fase 19) para reordenar/ocultar/cambiar icono — ahora incluye también sueno/entreno/nutricion
// (antes exentos por vivir fijos en la barra inferior; ya no hay razón para esa excepción, ver
// HANDOFF.md). AREAS_NAV agrupa esos mismos ids en las 4 pestañas, sin duplicar su definición.
const MORE_NAV = [
  { id: 'salud', label: 'Salud', icon: HeartPulse },
  { id: 'sueno', label: 'Sueño', icon: Moon },
  { id: 'nutricion', label: 'Nutrición', icon: Apple },
  { id: 'entreno', label: 'Entrenamiento', icon: Dumbbell },
  { id: 'estudios', label: 'Estudios', icon: GraduationCap },
  { id: 'negocio', label: 'Negocio', icon: Briefcase },
  { id: 'productividad', label: 'Productividad', icon: ListTodo },
  { id: 'objetivos', label: 'Objetivos', icon: Target },
  { id: 'diario', label: 'Diario', icon: BookOpen },
  { id: 'fe', label: 'Fe', icon: Church },
  { id: 'biblioteca', label: 'Biblioteca', icon: Library },
  { id: 'relacion', label: 'Relación', icon: Heart },
  { id: 'bienestar', label: 'Bienestar', icon: Smartphone },
  { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { id: 'predicciones', label: 'Predicciones', icon: TrendingUp },
  { id: 'logros', label: 'Logros', icon: Trophy },
  { id: 'economia', label: 'Economía', icon: Wallet },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
];

const AREAS_NAV = [
  { id: 'area-salud', label: 'Salud', icon: HeartPulse, modulos: ['salud', 'sueno', 'nutricion', 'entreno'] },
  { id: 'area-vida', label: 'Vida', icon: BookOpen, modulos: ['estudios', 'productividad', 'objetivos', 'diario', 'biblioteca'] },
  { id: 'area-gestion', label: 'Gestión', icon: Briefcase, modulos: ['economia', 'negocio'] },
  { id: 'area-mas', label: 'Más', icon: MoreHorizontal, modulos: ['relacion', 'fe', 'bienestar', 'estadisticas', 'predicciones', 'logros', 'ajustes'] },
];

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.bg }}>
      <Loader2 className="animate-spin" size={28} style={{ color: ACCENTS[0].value }} />
    </div>
  );
}

// Fase A5 — Seguridad avanzada: pantalla de bloqueo automático (apartado 146), con desbloqueo
// rápido por biometría (si Josué la activó, apartado 145 — prioridad biometría/PIN respaldo) y
// PIN como respaldo siempre disponible. Distinta del PinGate por sección (Fase 2/12/19): esta
// bloquea la app entera tras un periodo de inactividad, no una sección concreta al navegar a ella.
function BloqueoAutomaticoGate({ pin, accent, seguridad, onUnlock }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [verificando, setVerificando] = useState(false);
  const biometriaLista = seguridad.biometriaActiva && !!seguridad.biometriaCredencialId;

  const intentarBiometria = async () => {
    setVerificando(true);
    setError('');
    const ok = await verificarBiometria(seguridad.biometriaCredencialId);
    setVerificando(false);
    if (ok) onUnlock(); else setError('No se ha podido verificar. Prueba de nuevo o usa el PIN.');
  };
  const tryUnlock = () => {
    if (value === pin) onUnlock();
    else { setError('PIN incorrecto'); setValue(''); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-8" style={{ background: COLORS.bg }}>
      <Lock size={28} style={{ color: accent }} />
      <p className="text-sm text-center" style={{ color: COLORS.textMuted }}>App bloqueada por inactividad</p>
      {biometriaLista && (
        <button
          onClick={intentarBiometria}
          disabled={verificando}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: accent, color: COLORS.textOnAccent }}
        >
          {verificando ? 'Verificando…' : 'Desbloquear con Face ID / Touch ID'}
        </button>
      )}
      <div className="flex items-center gap-2">
        <input
          type="password" inputMode="numeric" maxLength={6} placeholder="PIN"
          value={value} onChange={(e) => { setValue(e.target.value.replace(/\D/g, '')); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
          className="rounded-xl px-3 py-2.5 text-sm outline-none text-center"
          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text, maxWidth: 120 }}
        />
        <button
          onClick={tryUnlock} disabled={value.length < 4}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
          style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
        >
          Entrar
        </button>
      </div>
      {error && <p className="text-xs" style={{ color: COLORS.negative }}>{error}</p>}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = comprobando, null = sin sesión
  const [tab, setTab] = useState('hoy');
  const [loaded, setLoaded] = useState(false);
  const [accent, setAccent] = useState(ACCENTS[0].value);
  const [pin, setPin] = useState(null);
  // Fase A3 — Apariencia avanzada: tema (claro/oscuro/automático), tamaño de texto, densidad,
  // radios de borde y animaciones. `temaSistemaOscuro` solo se usa para resolver "automático".
  const [apariencia, setApariencia] = useState(DEFAULT_APARIENCIA);
  const [temaSistemaOscuro, setTemaSistemaOscuro] = useState(
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : true)
  );
  // Fase A5 — Seguridad avanzada: bloqueo automático + biometría. `bloqueado` es el estado de la
  // pantalla de bloqueo completa (distinta del PinGate por sección que ya existía).
  const [seguridad, setSeguridad] = useState(DEFAULT_SEGURIDAD);
  const [bloqueado, setBloqueado] = useState(false);
  const inactivityTimer = useRef(null);
  const [perfil, setPerfil] = useState(DEFAULT_PERFIL);
  const [sueno, setSueno] = useState([]);
  const [calistenia, setCalistenia] = useState(DEFAULT_CALISTENIA);
  const [futbol, setFutbol] = useState([]);
  const [economia, setEconomia] = useState(DEFAULT_ECONOMIA);
  const [salud, setSalud] = useState(DEFAULT_SALUD);
  const [saludFotos, setSaludFotos] = useState([]); // metadatos; el archivo en sí vive en Supabase Storage
  const [nutricion, setNutricion] = useState(DEFAULT_NUTRICION);
  const [calisteniaVideos, setCalisteniaVideos] = useState([]); // metadatos; el archivo vive en Supabase Storage
  const [estudios, setEstudios] = useState(DEFAULT_ESTUDIOS);
  const [negocio, setNegocio] = useState(DEFAULT_NEGOCIO);
  const [productividad, setProductividad] = useState(DEFAULT_PRODUCTIVIDAD);
  const [objetivos, setObjetivos] = useState(DEFAULT_OBJETIVOS);
  const [diario, setDiario] = useState(DEFAULT_DIARIO);
  const [biblioteca, setBiblioteca] = useState(DEFAULT_BIBLIOTECA);
  const [bibliotecaArchivos, setBibliotecaArchivos] = useState([]); // metadatos; el archivo vive en Supabase Storage
  const [relacion, setRelacion] = useState(DEFAULT_RELACION);
  const [fe, setFe] = useState(DEFAULT_FE);
  const [bienestar, setBienestar] = useState(DEFAULT_BIENESTAR);
  const [personalizacion, setPersonalizacion] = useState(DEFAULT_PERSONALIZACION);
  // Fase A4 — Notificaciones reales: clave propia en Supabase (no dentro de 'ajustes'), guardada
  // directa, sin pasar por snapshotAndSave/deshacer — es configuración, no un dato de un módulo.
  const [notificaciones, setNotificaciones] = useState(DEFAULT_NOTIFICACIONES);
  // Fase 2 del Sistema de Personalización Visual Extrema — historial del ColorPicker (recientes/
  // favoritos), clave propia en Supabase, mismo criterio que `notificaciones`.
  const [historialColor, setHistorialColor] = useState(DEFAULT_HISTORIAL_COLOR);
  // Fase 3 del Sistema de Personalización Visual Extrema — Constructor de temas: overrides de
  // Secundario/Terciario/Fondo/Superficie/Texto/Bordes/Estados, clave propia en Supabase.
  const [temaPersonalizado, setTemaPersonalizado] = useState(DEFAULT_TEMA_PERSONALIZADO);
  // Fase 4 del Sistema de Personalización Visual Extrema — temas completos guardados por Josué
  // (tema + accent + temaPersonalizado, foto lista para aplicar de un toque), clave propia en
  // Supabase, mismo criterio de guardado directo sin deshacer que historialColor/temaPersonalizado.
  const [temasGuardados, setTemasGuardados] = useState(DEFAULT_TEMAS_GUARDADOS);
  const [history, setHistory] = useState([]);
  const [showSearch, setShowSearch] = useState(false); // Fase 18 — buscador universal

  useEffect(() => {
    getSession().then(setSession);
    const unsub = onAuthChange(setSession);
    return unsub;
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      const uidUser = session.user.id;
      const [a, p, s, c, f, e, sal, sf, nut, cv, est, neg, prod, obj, dia, bib, bibArch, rel, feData, bien, pers, notif, hcol, tp, temGuard, h] = await Promise.all([
        loadData(uidUser, 'ajustes', { accent: ACCENTS[0].value, pin: null, apariencia: DEFAULT_APARIENCIA, seguridad: DEFAULT_SEGURIDAD }),
        loadData(uidUser, 'perfil', DEFAULT_PERFIL),
        loadData(uidUser, 'sueno', []),
        loadData(uidUser, 'calistenia', DEFAULT_CALISTENIA),
        loadData(uidUser, 'futbol', []),
        loadData(uidUser, 'economia', DEFAULT_ECONOMIA),
        loadData(uidUser, 'salud', DEFAULT_SALUD),
        loadData(uidUser, 'saludFotos', []),
        loadData(uidUser, 'nutricion', DEFAULT_NUTRICION),
        loadData(uidUser, 'calisteniaVideos', []),
        loadData(uidUser, 'estudios', DEFAULT_ESTUDIOS),
        loadData(uidUser, 'negocio', DEFAULT_NEGOCIO),
        loadData(uidUser, 'productividad', DEFAULT_PRODUCTIVIDAD),
        loadData(uidUser, 'objetivos', DEFAULT_OBJETIVOS),
        loadData(uidUser, 'diario', DEFAULT_DIARIO),
        loadData(uidUser, 'biblioteca', DEFAULT_BIBLIOTECA),
        loadData(uidUser, 'bibliotecaArchivos', []),
        loadData(uidUser, 'relacion', DEFAULT_RELACION),
        loadData(uidUser, 'fe', DEFAULT_FE),
        loadData(uidUser, 'bienestar', DEFAULT_BIENESTAR),
        loadData(uidUser, 'personalizacion', DEFAULT_PERSONALIZACION),
        loadData(uidUser, 'notificaciones', DEFAULT_NOTIFICACIONES),
        loadData(uidUser, 'historialColor', DEFAULT_HISTORIAL_COLOR),
        loadData(uidUser, 'temaPersonalizado', DEFAULT_TEMA_PERSONALIZADO),
        loadData(uidUser, 'temasGuardados', DEFAULT_TEMAS_GUARDADOS),
        loadData(uidUser, 'historial', []),
      ]);
      if (cancelled) return;
      setAccent(a.accent || ACCENTS[0].value);
      setPin(a.pin || null);
      // Fase A3: merge con DEFAULT_APARIENCIA, mismo motivo que el merge de perfil de la Fase A2 —
      // un registro `ajustes` guardado antes de esta fase no tiene la clave `apariencia` todavía.
      setApariencia({ ...DEFAULT_APARIENCIA, ...(a.apariencia || {}) });
      // Fase A5: mismo motivo que apariencia — un registro `ajustes` guardado antes de esta fase
      // no tiene la clave `seguridad` todavía.
      setSeguridad({ ...DEFAULT_SEGURIDAD, ...(a.seguridad || {}) });
      // Fase A2: merge con DEFAULT_PERFIL para que un perfil guardado antes de esta fase
      // (sin los campos nuevos: apellidos, sexo, deportesPracticados, idioma, unidades...)
      // no se quede con esos campos en `undefined` — mismo patrón que ya se usaba en
      // Calistenia (Fase 5) para no romper datos antiguos al añadir campos nuevos.
      setPerfil({ ...DEFAULT_PERFIL, ...p });
      setSueno(s);
      setCalistenia(c);
      setFutbol(f);
      setEconomia(e);
      setSalud(sal);
      setSaludFotos(sf);
      setNutricion(nut);
      setCalisteniaVideos(cv);
      setEstudios(est);
      setNegocio(neg);
      setProductividad(prod);
      setObjetivos(obj);
      setDiario(dia);
      setBiblioteca(bib);
      setBibliotecaArchivos(bibArch);
      setRelacion(rel);
      setFe(feData);
      setBienestar(bien);
      setPersonalizacion(pers);
      // Fase A4: merge con DEFAULT_NOTIFICACIONES, mismo motivo que perfil/apariencia — un
      // registro guardado antes de esta fase (o inexistente) no debe dejar `categorias` a medias.
      setNotificaciones({ ...DEFAULT_NOTIFICACIONES, ...notif, categorias: { ...DEFAULT_NOTIFICACIONES.categorias, ...(notif.categorias || {}) } });
      // Fase 2 del Sistema de Personalización Visual Extrema: merge con DEFAULT_HISTORIAL_COLOR,
      // mismo motivo que notificaciones — un registro inexistente o guardado antes de esta fase
      // no debe dejar `recientes`/`favoritos` en `undefined`.
      setHistorialColor({ ...DEFAULT_HISTORIAL_COLOR, ...hcol });
      // Fase 3: merge con DEFAULT_TEMA_PERSONALIZADO, mismo motivo que notificaciones/historialColor
      // — un registro inexistente o guardado antes de esta fase no debe dejar `estados` a medias.
      setTemaPersonalizado({ ...DEFAULT_TEMA_PERSONALIZADO, ...tp, estados: { ...DEFAULT_TEMA_PERSONALIZADO.estados, ...(tp.estados || {}) } });
      // Fase 4: sin merge de objeto (es una lista, no un objeto de campos) — solo nos aseguramos
      // de que sea de verdad un array, por si `temasGuardados` no existe todavía en Supabase.
      setTemasGuardados(Array.isArray(temGuard) ? temGuard : DEFAULT_TEMAS_GUARDADOS);
      setHistory(h);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [session]);

  // Fase A3: tema realmente aplicado (resuelve "automático" contra el sistema operativo) y
  // aplicado de forma síncrona aquí mismo, antes de generar el JSX de esta misma pasada de
  // render — así los componentes hijos (renderizados justo después, en el mismo render) ya
  // leen los colores correctos de `COLORS`, sin esperar a un efecto ni a un re-render extra.
  // Se calcula y aplica ANTES de los `return` condicionales de más abajo para que la pantalla
  // de carga y la de login también respeten el tema, y para no romper el orden de los Hooks
  // (los `useEffect` de aquí abajo tienen que ejecutarse siempre, nunca solo a veces).
  const temaResuelto = apariencia.tema === 'automatico' ? (temaSistemaOscuro ? 'oscuro' : 'claro') : apariencia.tema;
  // Fase 1 del Sistema de Personalización Visual Extrema: `aplicarTema` ahora recibe también el
  // acento activo, para calcular los roles derivados (ver tokens.js/colorEngine.js). De paso se
  // corrige una inconsistencia que llevaba desde la Fase A7 (Accesibilidad): `altoContraste` no
  // se estaba pasando nunca a `aplicarTema`, así que el interruptor de alto contraste guardaba
  // la preferencia pero no llegaba a aplicarse — con esta línea sí tiene efecto real.
  // Fase 3: cuarto parámetro, `temaPersonalizado` — overrides de Secundario/Terciario/Fondo/
  // Superficie/Texto/Bordes/Estados (ver tokens.js). `null`/vacío en cada campo = automático.
  aplicarTema(temaResuelto, apariencia.altoContraste, accent, temaPersonalizado);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setTemaSistemaOscuro(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler); else mq.addListener(handler);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', handler); else mq.removeListener(handler); };
  }, []);

  useEffect(() => {
    const tam = TAMANOS_TEXTO.find((t) => t.value === apariencia.tamanoTexto) || TAMANOS_TEXTO[1];
    document.documentElement.style.fontSize = `${tam.px}px`;
    document.documentElement.dataset.radio = apariencia.radioBorde;
    document.documentElement.dataset.animaciones = apariencia.animaciones;
    document.documentElement.dataset.reducirMovimiento = String(apariencia.reducirMovimiento);
  }, [apariencia.tamanoTexto, apariencia.radioBorde, apariencia.animaciones, apariencia.reducirMovimiento]);

  // Fase A5 — Bloqueo automático (apartado 146): sin PIN no hay nada que auto-bloquear; con
  // "nunca" (por defecto) tampoco se arma ningún temporizador. Reinicia el temporizador con
  // cualquier interacción — mismo criterio que un móvil real.
  useEffect(() => {
    const opcion = OPCIONES_BLOQUEO_AUTOMATICO.find((o) => o.value === seguridad.bloqueoAutomatico);
    if (!pin || !opcion || opcion.ms === null) return;
    const reiniciar = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => setBloqueado(true), opcion.ms);
    };
    const eventos = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    eventos.forEach((ev) => window.addEventListener(ev, reiniciar));
    reiniciar();
    return () => {
      eventos.forEach((ev) => window.removeEventListener(ev, reiniciar));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [pin, seguridad.bloqueoAutomatico]);

  // "Inmediatamente" además bloquea en cuanto la pestaña/app pasa a segundo plano, no solo tras
  // el margen corto de inactividad de arriba — más fiel al apartado 146 ("Inmediatamente").
  useEffect(() => {
    if (!pin || seguridad.bloqueoAutomatico !== 'inmediato') return;
    const onVisibility = () => { if (document.hidden) setBloqueado(true); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pin, seguridad.bloqueoAutomatico]);

  if (session === undefined) return <LoadingScreen />;
  if (!session) return <Auth />;
  if (!loaded) return <LoadingScreen />;

  const uidUser = session.user.id;

  // Fase A3/A5: `saveData` sobrescribe el valor entero de la clave 'ajustes' (upsert, no fusiona)
  // — las cuatro funciones deben mandar siempre el paquete completo (accent + pin + apariencia +
  // seguridad) o se perderían entre sí. Antes de la Fase A3 'ajustes' solo tenía accent/pin.
  const updateAccent = async (color) => { setAccent(color); await saveData(uidUser, 'ajustes', { accent: color, pin, apariencia, seguridad }); };
  // Apartado 145: el PIN es el respaldo obligatorio de la biometría — si Josué borra el PIN,
  // la biometría se desactiva sola en el mismo guardado (nunca queda biometría sin PIN de apoyo).
  const updatePin = async (newPin) => {
    setPin(newPin);
    const seguridadSiguiente = !newPin && seguridad.biometriaActiva ? { ...seguridad, biometriaActiva: false } : seguridad;
    if (seguridadSiguiente !== seguridad) setSeguridad(seguridadSiguiente);
    await saveData(uidUser, 'ajustes', { accent, pin: newPin, apariencia, seguridad: seguridadSiguiente });
  };
  const updateApariencia = async (next) => { setApariencia(next); await saveData(uidUser, 'ajustes', { accent, pin, apariencia: next, seguridad }); };
  const updateSeguridad = async (next) => { setSeguridad(next); await saveData(uidUser, 'ajustes', { accent, pin, apariencia, seguridad: next }); };
  const updatePerfil = async (next) => { setPerfil(next); await saveData(uidUser, 'perfil', next); };

  // Fase 2 del Sistema de Personalización Visual Extrema — historial del ColorPicker (recientes/
  // favoritos). Guardado directo, sin snapshotAndSave/deshacer, mismo criterio que notificaciones/
  // personalizacion: es una preferencia de la app, no un dato de módulo con sentido de "deshacer".
  const registrarColorReciente = (hexColor) => {
    setHistorialColor((prev) => {
      const siguiente = { ...prev, recientes: [hexColor, ...prev.recientes.filter((c) => c !== hexColor)].slice(0, MAX_COLORES_RECIENTES) };
      saveData(uidUser, 'historialColor', siguiente);
      return siguiente;
    });
  };
  const toggleFavoritoColor = (hexColor) => {
    setHistorialColor((prev) => {
      const yaEsta = prev.favoritos.includes(hexColor);
      const favoritosSiguientes = yaEsta
        ? prev.favoritos.filter((c) => c !== hexColor)
        : [hexColor, ...prev.favoritos].slice(0, MAX_COLORES_FAVORITOS);
      const siguiente = { ...prev, favoritos: favoritosSiguientes };
      saveData(uidUser, 'historialColor', siguiente);
      return siguiente;
    });
  };
  // Fase 3 — Constructor de temas. `setTemaPersonalizado` sirve también de vista previa (llamado
  // desde el ColorPicker anidado en cada fila del constructor, sin escribir en Supabase todavía);
  // `updateTemaPersonalizado` es el guardado real, mismo patrón preview/commit que el acento.
  const updateTemaPersonalizado = async (next) => { setTemaPersonalizado(next); await saveData(uidUser, 'temaPersonalizado', next); };

  // Fase 4 del Sistema de Personalización Visual Extrema — Presets + gestión de temas.
  //
  // `aplicarConjuntoTema` es la única función que cambia tema+accent+temaPersonalizado A LA VEZ
  // (al tocar un preset o un tema guardado). Construye el payload de 'ajustes' con el accent y el
  // tema NUEVOS explícitos en vez de encadenar `updateAccent`+`updateApariencia` (que existen para
  // cambios sueltos, cada una desde su propia tarjeta): cada una guarda el paquete 'ajustes'
  // completo leyendo el resto de campos del closure de React, y dos llamadas seguidas en la misma
  // función no ven todavía el `setState` de la anterior (React no re-renderiza a mitad de una
  // función) — la segunda pisaría a la primera con un valor desactualizado. Construyendo el
  // payload a mano con los valores nuevos explícitos, ese problema no puede pasar.
  const aplicarConjuntoTema = async ({ tema: temaNombre, accent: accentHex, temaPersonalizado: tp }) => {
    const tpFinal = tp || DEFAULT_TEMA_PERSONALIZADO;
    const aparienciaSiguiente = { ...apariencia, tema: temaNombre };
    setAccent(accentHex);
    setApariencia(aparienciaSiguiente);
    setTemaPersonalizado(tpFinal);
    await saveData(uidUser, 'ajustes', { accent: accentHex, pin, apariencia: aparienciaSiguiente, seguridad });
    await saveData(uidUser, 'temaPersonalizado', tpFinal);
  };

  // Aplica la paleta predefinida marcada `esOficial` (el azul metálico original de la app) —
  // sirve como "Restablecer al tema oficial" desde la gestión de temas.
  const restablecerTemaOficial = () => {
    const oficial = PALETAS_PREDEFINIDAS.find((p) => p.esOficial) || PALETAS_PREDEFINIDAS[0];
    aplicarConjuntoTema(oficial);
  };

  const guardarTemaComoNuevo = (nombre) => {
    if (temasGuardados.length >= MAX_TEMAS_GUARDADOS) return false;
    const nuevo = {
      id: uid(), nombre: nombre.trim() || 'Tema sin nombre',
      tema: apariencia.tema === 'automatico' ? temaResuelto : apariencia.tema,
      accent, temaPersonalizado, creadoEn: new Date().toISOString(),
    };
    const siguiente = [...temasGuardados, nuevo];
    setTemasGuardados(siguiente);
    saveData(uidUser, 'temasGuardados', siguiente);
    return true;
  };

  const renombrarTemaGuardado = (id, nombre) => {
    const siguiente = temasGuardados.map((t) => (t.id === id ? { ...t, nombre: nombre.trim() || t.nombre } : t));
    setTemasGuardados(siguiente);
    saveData(uidUser, 'temasGuardados', siguiente);
  };

  const duplicarTemaGuardado = (id) => {
    if (temasGuardados.length >= MAX_TEMAS_GUARDADOS) return false;
    const original = temasGuardados.find((t) => t.id === id);
    if (!original) return false;
    const copia = { ...original, id: uid(), nombre: `${original.nombre} (copia)`, creadoEn: new Date().toISOString() };
    const siguiente = [...temasGuardados, copia];
    setTemasGuardados(siguiente);
    saveData(uidUser, 'temasGuardados', siguiente);
    return true;
  };

  const eliminarTemaGuardado = (id) => {
    const siguiente = temasGuardados.filter((t) => t.id !== id);
    setTemasGuardados(siguiente);
    saveData(uidUser, 'temasGuardados', siguiente);
  };

  // El archivo ya viene validado (hex válidos, campos esperados) por quien llama — ver
  // GestionTemas.jsx. Un tema importado se añade a la lista, nunca se aplica solo: Josué decide
  // si lo activa después de verlo, mismo criterio que "Importar apariencia" (Fase A3), que pide
  // confirmación explícita antes de aplicar nada.
  const importarTemaGuardado = (temaImportado) => {
    if (temasGuardados.length >= MAX_TEMAS_GUARDADOS) return false;
    const nuevo = { ...temaImportado, id: uid(), creadoEn: new Date().toISOString() };
    const siguiente = [...temasGuardados, nuevo];
    setTemasGuardados(siguiente);
    saveData(uidUser, 'temasGuardados', siguiente);
    return true;
  };

  // Fase A6 — Privacidad (apartado 195: "Eliminación de datos específicos", categorías concretas
  // sin afectar al resto). Perfil queda fuera de este mapa a propósito — ya tiene su propio
  // "Restablecer perfil" en la categoría Perfil desde la Fase A2, no se duplica aquí. Los tres
  // módulos con archivos en Supabase Storage (saludFotos, calisteniaVideos, bibliotecaArchivos)
  // también quedan fuera a propósito: borrar solo el registro dejaría los archivos huérfanos en
  // Storage — habría que borrar cada archivo uno a uno primero, fuera de alcance de esta fase.
  const RESET_MODULOS = {
    sueno: { label: 'Sueño', default: [], setter: setSueno },
    calistenia: { label: 'Calistenia', default: DEFAULT_CALISTENIA, setter: setCalistenia },
    futbol: { label: 'Fútbol', default: [], setter: setFutbol },
    economia: { label: 'Economía', default: DEFAULT_ECONOMIA, setter: setEconomia },
    salud: { label: 'Salud (medidas e historial médico)', default: DEFAULT_SALUD, setter: setSalud },
    nutricion: { label: 'Nutrición', default: DEFAULT_NUTRICION, setter: setNutricion },
    estudios: { label: 'Estudios', default: DEFAULT_ESTUDIOS, setter: setEstudios },
    negocio: { label: 'Negocio', default: DEFAULT_NEGOCIO, setter: setNegocio },
    productividad: { label: 'Productividad', default: DEFAULT_PRODUCTIVIDAD, setter: setProductividad },
    objetivos: { label: 'Objetivos', default: DEFAULT_OBJETIVOS, setter: setObjetivos },
    diario: { label: 'Diario', default: DEFAULT_DIARIO, setter: setDiario },
    biblioteca: { label: 'Biblioteca (apuntes y enlaces)', default: DEFAULT_BIBLIOTECA, setter: setBiblioteca },
    relacion: { label: 'Relación', default: DEFAULT_RELACION, setter: setRelacion },
    fe: { label: 'Fe', default: DEFAULT_FE, setter: setFe },
    bienestar: { label: 'Bienestar digital', default: DEFAULT_BIENESTAR, setter: setBienestar },
  };
  const borrarDatosModulo = async (id) => {
    const cfg = RESET_MODULOS[id];
    if (!cfg) return;
    cfg.setter(cfg.default);
    await saveData(uidUser, id, cfg.default);
  };

  // Fase 19 — Personalización total: igual que `ajustes` (accent/pin), es configuración de cómo
  // se ve/organiza la app, no "datos" — se guarda directo, sin pasar por snapshotAndSave/deshacer.
  const updatePersonalizacion = (next) => { setPersonalizacion(next); saveData(uidUser, 'personalizacion', next); };
  // Fase A4 — Notificaciones reales: mismo criterio que personalización (configuración, no un
  // dato de módulo), clave propia en Supabase, sin pasar por snapshotAndSave/deshacer.
  const updateNotificaciones = (next) => { setNotificaciones(next); saveData(uidUser, 'notificaciones', next); };
  const moverModuloNav = (id, dir) => {
    const orden = personalizacion.orden.length ? personalizacion.orden : moreNavPersonalizables.map((m) => m.id);
    const idx = orden.indexOf(id);
    const nuevoIdx = idx + dir;
    if (idx === -1 || nuevoIdx < 0 || nuevoIdx >= orden.length) return;
    const next = [...orden];
    [next[idx], next[nuevoIdx]] = [next[nuevoIdx], next[idx]];
    updatePersonalizacion({ ...personalizacion, orden: next });
  };
  const toggleOcultoModulo = (id) => {
    const ocultos = personalizacion.ocultos.includes(id)
      ? personalizacion.ocultos.filter((x) => x !== id)
      : [...personalizacion.ocultos, id];
    updatePersonalizacion({ ...personalizacion, ocultos });
    if (tab === id && !personalizacion.ocultos.includes(id)) setTab('hoy'); // se acaba de ocultar la pestaña activa
  };
  const setIconoModulo = (id, iconKey) => {
    const iconos = { ...personalizacion.iconos };
    if (iconKey) iconos[id] = iconKey; else delete iconos[id];
    updatePersonalizacion({ ...personalizacion, iconos });
  };
  const togglePinExtraModulo = (id) => {
    const pinExtra = personalizacion.pinExtra.includes(id)
      ? personalizacion.pinExtra.filter((x) => x !== id)
      : [...personalizacion.pinExtra, id];
    updatePersonalizacion({ ...personalizacion, pinExtra });
  };
  const toggleFavoritaMetrica = (id) => {
    const favoritas = personalizacion.favoritas.includes(id)
      ? personalizacion.favoritas.filter((x) => x !== id)
      : personalizacion.favoritas.length < MAX_METRICAS_FAVORITAS
        ? [...personalizacion.favoritas, id]
        : personalizacion.favoritas;
    updatePersonalizacion({ ...personalizacion, favoritas });
  };
  const moverFavoritaMetrica = (id, dir) => {
    const idx = personalizacion.favoritas.indexOf(id);
    const nuevoIdx = idx + dir;
    if (idx === -1 || nuevoIdx < 0 || nuevoIdx >= personalizacion.favoritas.length) return;
    const next = [...personalizacion.favoritas];
    [next[idx], next[nuevoIdx]] = [next[nuevoIdx], next[idx]];
    updatePersonalizacion({ ...personalizacion, favoritas: next });
  };
  // Fase 20 — modos "viaje/vacaciones/exámenes": activar el mismo modo que ya está activo lo
  // desactiva (toggle), igual de sencillo que ocultar un módulo. Guardado directo, sin deshacer,
  // mismo criterio que el resto de personalizacion (es "cómo se comporta la app", no un dato).
  const setModoApp = (modoId) => {
    const modo = personalizacion.modo === modoId ? null : modoId;
    updatePersonalizacion({ ...personalizacion, modo });
  };

  const snapshotAndSave = (patch) => {
    const snapshot = { sueno, calistenia, futbol, economia, salud, nutricion, estudios, negocio, productividad, objetivos, diario, biblioteca, relacion, fe, bienestar };
    const nextHist = [...history, snapshot].slice(-10);
    setHistory(nextHist);
    saveData(uidUser, 'historial', nextHist);
    if (patch.sueno) { setSueno(patch.sueno); saveData(uidUser, 'sueno', patch.sueno); }
    if (patch.calistenia) { setCalistenia(patch.calistenia); saveData(uidUser, 'calistenia', patch.calistenia); }
    if (patch.futbol) { setFutbol(patch.futbol); saveData(uidUser, 'futbol', patch.futbol); }
    if (patch.economia) { setEconomia(patch.economia); saveData(uidUser, 'economia', patch.economia); }
    if (patch.salud) { setSalud(patch.salud); saveData(uidUser, 'salud', patch.salud); }
    if (patch.nutricion) { setNutricion(patch.nutricion); saveData(uidUser, 'nutricion', patch.nutricion); }
    if (patch.estudios) { setEstudios(patch.estudios); saveData(uidUser, 'estudios', patch.estudios); }
    if (patch.negocio) { setNegocio(patch.negocio); saveData(uidUser, 'negocio', patch.negocio); }
    if (patch.productividad) { setProductividad(patch.productividad); saveData(uidUser, 'productividad', patch.productividad); }
    if (patch.objetivos) { setObjetivos(patch.objetivos); saveData(uidUser, 'objetivos', patch.objetivos); }
    if (patch.diario) { setDiario(patch.diario); saveData(uidUser, 'diario', patch.diario); }
    if (patch.biblioteca) { setBiblioteca(patch.biblioteca); saveData(uidUser, 'biblioteca', patch.biblioteca); }
    if (patch.relacion) { setRelacion(patch.relacion); saveData(uidUser, 'relacion', patch.relacion); }
    if (patch.fe) { setFe(patch.fe); saveData(uidUser, 'fe', patch.fe); }
    if (patch.bienestar) { setBienestar(patch.bienestar); saveData(uidUser, 'bienestar', patch.bienestar); }
  };

  const addSueno = (entry) => snapshotAndSave({ sueno: [...sueno, entry] });
  const updateSkill = (skill, data) => snapshotAndSave({ calistenia: { ...calistenia, [skill]: data } });
  const addPartido = (entry) => snapshotAndSave({ futbol: [...futbol, entry] });
  const addMovimiento = (mov) => snapshotAndSave({ economia: { ...economia, movimientos: [...economia.movimientos, mov] } });
  const updateHucha = (v) => snapshotAndSave({ economia: { ...economia, hucha: v } });
  const addMedida = (entry) => snapshotAndSave({ salud: { ...salud, medidas: [...salud.medidas, entry] } });
  const addHistorialMedico = (entry) => snapshotAndSave({ salud: { ...salud, historial: [...salud.historial, entry] } });

  const addComida = (entry) => snapshotAndSave({ nutricion: { ...nutricion, comidas: [...nutricion.comidas, entry] } });
  const addFavorito = (entry) => snapshotAndSave({ nutricion: { ...nutricion, favoritos: [...nutricion.favoritos, { ...entry, id: uid() }] } });
  const registrarFavorito = (fav) => snapshotAndSave({ nutricion: { ...nutricion, comidas: [...nutricion.comidas, { ...fav, id: uid(), fecha: todayISO() }] } });
  const eliminarFavorito = (id) => snapshotAndSave({ nutricion: { ...nutricion, favoritos: nutricion.favoritos.filter((f) => f.id !== id) } });
  const setAgua = (fecha, ml) => snapshotAndSave({ nutricion: { ...nutricion, agua: { ...nutricion.agua, [fecha]: ml } } });

  const addPrograma = (p) => snapshotAndSave({ estudios: { ...estudios, programas: [...estudios.programas, p] } });
  const addAsignatura = (a) => snapshotAndSave({ estudios: { ...estudios, asignaturas: [...estudios.asignaturas, a] } });
  const deleteAsignatura = (id) =>
    snapshotAndSave({
      estudios: {
        ...estudios,
        asignaturas: estudios.asignaturas.filter((a) => a.id !== id),
        // Borrar una asignatura borra también sus exámenes y horas — evita dejar registros
        // huérfanos apuntando a una asignatura que ya no existe.
        examenes: estudios.examenes.filter((e) => e.asignaturaId !== id),
        horas: estudios.horas.filter((h) => h.asignaturaId !== id),
      },
    });
  const addExamen = (ex) => snapshotAndSave({ estudios: { ...estudios, examenes: [...estudios.examenes, ex] } });
  const updateExamen = (ex) => snapshotAndSave({ estudios: { ...estudios, examenes: estudios.examenes.map((e) => (e.id === ex.id ? ex : e)) } });
  const deleteExamen = (id) => snapshotAndSave({ estudios: { ...estudios, examenes: estudios.examenes.filter((e) => e.id !== id) } });
  const addHoras = (h) => snapshotAndSave({ estudios: { ...estudios, horas: [...estudios.horas, h] } });

  const addProyecto = (p) => snapshotAndSave({ negocio: { ...negocio, proyectos: [...negocio.proyectos, p] } });
  const updateProyecto = (p) => snapshotAndSave({ negocio: { ...negocio, proyectos: negocio.proyectos.map((x) => (x.id === p.id ? p : x)) } });
  const deleteProyecto = (id) => snapshotAndSave({ negocio: { ...negocio, proyectos: negocio.proyectos.filter((x) => x.id !== id) } });

  const addHabito = (h) => snapshotAndSave({ productividad: { ...productividad, habitos: [...productividad.habitos, h] } });
  const updateHabito = (h) => snapshotAndSave({ productividad: { ...productividad, habitos: productividad.habitos.map((x) => (x.id === h.id ? h : x)) } });
  const deleteHabito = (id) => snapshotAndSave({ productividad: { ...productividad, habitos: productividad.habitos.filter((x) => x.id !== id) } });
  const addRutina = (r) => snapshotAndSave({ productividad: { ...productividad, rutinas: [...productividad.rutinas, r] } });
  const updateRutina = (r) => snapshotAndSave({ productividad: { ...productividad, rutinas: productividad.rutinas.map((x) => (x.id === r.id ? r : x)) } });
  const deleteRutina = (id) => snapshotAndSave({ productividad: { ...productividad, rutinas: productividad.rutinas.filter((x) => x.id !== id) } });
  const addTarea = (t) => snapshotAndSave({ productividad: { ...productividad, tareas: [...productividad.tareas, t] } });
  const toggleTarea = (id) =>
    snapshotAndSave({ productividad: { ...productividad, tareas: productividad.tareas.map((x) => (x.id === id ? { ...x, hecha: !x.hecha } : x)) } });
  const deleteTarea = (id) => snapshotAndSave({ productividad: { ...productividad, tareas: productividad.tareas.filter((x) => x.id !== id) } });
  const addMeta = (m) => snapshotAndSave({ productividad: { ...productividad, metas: [...productividad.metas, m] } });
  const updateMeta = (m) => snapshotAndSave({ productividad: { ...productividad, metas: productividad.metas.map((x) => (x.id === m.id ? m : x)) } });
  const deleteMeta = (id) => snapshotAndSave({ productividad: { ...productividad, metas: productividad.metas.filter((x) => x.id !== id) } });
  // El contador de pomodoros no pasa por snapshotAndSave (no tiene sentido "deshacer" un
  // pomodoro completado) — se guarda directo, igual de ligero que un simple contador diario.
  const completarPomodoro = () => {
    const hoy = todayISO();
    const next = { ...productividad, pomodoros: { ...productividad.pomodoros, [hoy]: (productividad.pomodoros[hoy] || 0) + 1 } };
    setProductividad(next);
    saveData(uidUser, 'productividad', next);
  };

  const addObjetivo = (o) => snapshotAndSave({ objetivos: { ...objetivos, lista: [...objetivos.lista, o] } });
  const updateObjetivo = (o) => snapshotAndSave({ objetivos: { ...objetivos, lista: objetivos.lista.map((x) => (x.id === o.id ? o : x)) } });
  const deleteObjetivo = (id) => snapshotAndSave({ objetivos: { ...objetivos, lista: objetivos.lista.filter((x) => x.id !== id) } });
  // La fecha de la última revisión tampoco pasa por el snapshot — es un dato de "seguimiento",
  // no algo que tenga sentido deshacer, igual que el contador de pomodoros.
  const marcarRevisionHecha = () => {
    const next = { ...objetivos, ultimaRevision: todayISO() };
    setObjetivos(next);
    saveData(uidUser, 'objetivos', next);
  };

  const addEntradaDiario = (e) => snapshotAndSave({ diario: { ...diario, entradas: [...diario.entradas, e] } });
  const updateEntradaDiario = (e) => snapshotAndSave({ diario: { ...diario, entradas: diario.entradas.map((x) => (x.id === e.id ? e : x)) } });
  const deleteEntradaDiario = (id) => snapshotAndSave({ diario: { ...diario, entradas: diario.entradas.filter((x) => x.id !== id) } });

  // Fase 11 — Biblioteca. Apuntes y enlaces son texto puro, así que sí pasan por
  // snapshotAndSave/deshacer, igual que el resto de módulos de datos de la app.
  const addApunte = (a) => snapshotAndSave({ biblioteca: { ...biblioteca, apuntes: [...biblioteca.apuntes, a] } });
  const deleteApunte = (id) => snapshotAndSave({ biblioteca: { ...biblioteca, apuntes: biblioteca.apuntes.filter((x) => x.id !== id) } });
  const addEnlace = (e) => snapshotAndSave({ biblioteca: { ...biblioteca, enlaces: [...biblioteca.enlaces, e] } });
  const deleteEnlace = (id) => snapshotAndSave({ biblioteca: { ...biblioteca, enlaces: biblioteca.enlaces.filter((x) => x.id !== id) } });

  // Fase 12 — Relación: módulo privado (PinGate en el render, ver renderTab). Nombre y fechas
  // importantes son texto puro, sin archivos, así que pasan por snapshotAndSave/deshacer igual
  // que el resto de módulos de datos (mismo criterio que Diario y los apuntes de Biblioteca).
  const updateNombrePareja = (nombre) => snapshotAndSave({ relacion: { ...relacion, nombre } });
  const addFechaImportante = (f) => snapshotAndSave({ relacion: { ...relacion, fechas: [...relacion.fechas, f] } });
  const deleteFechaImportante = (id) => snapshotAndSave({ relacion: { ...relacion, fechas: relacion.fechas.filter((x) => x.id !== id) } });

  // Fase 14 — Fe: cuatro sub-áreas de texto puro, todas sin PIN (Josué no pidió privacidad
  // extra aquí), así que las cuatro pasan por snapshotAndSave/deshacer como el resto de módulos
  // de datos de la app.
  const addServicioFe = (s) => snapshotAndSave({ fe: { ...fe, servicio: [...fe.servicio, s] } });
  const deleteServicioFe = (id) => snapshotAndSave({ fe: { ...fe, servicio: fe.servicio.filter((x) => x.id !== id) } });
  const addEventoFe = (ev) => snapshotAndSave({ fe: { ...fe, eventos: [...fe.eventos, ev] } });
  const deleteEventoFe = (id) => snapshotAndSave({ fe: { ...fe, eventos: fe.eventos.filter((x) => x.id !== id) } });
  const addDiarioFe = (d) => snapshotAndSave({ fe: { ...fe, diario: [...fe.diario, d] } });
  const deleteDiarioFe = (id) => snapshotAndSave({ fe: { ...fe, diario: fe.diario.filter((x) => x.id !== id) } });
  const addObjetivoFe = (o) => snapshotAndSave({ fe: { ...fe, objetivos: [...fe.objetivos, o] } });
  const updateObjetivoFe = (o) => snapshotAndSave({ fe: { ...fe, objetivos: fe.objetivos.map((x) => (x.id === o.id ? o : x)) } });
  const deleteObjetivoFe = (id) => snapshotAndSave({ fe: { ...fe, objetivos: fe.objetivos.filter((x) => x.id !== id) } });

  // Fase 15 — Bienestar digital: las tres sub-áreas son texto puro (sin archivos, sin PIN), así
  // que pasan por snapshotAndSave/deshacer como el resto de módulos de datos de la app — mismo
  // criterio que Fe o los apuntes/enlaces de Biblioteca.
  const addRegistroTiempoUso = (r) => snapshotAndSave({ bienestar: { ...bienestar, registros: [...bienestar.registros, r] } });
  const deleteRegistroTiempoUso = (id) => snapshotAndSave({ bienestar: { ...bienestar, registros: bienestar.registros.filter((x) => x.id !== id) } });
  const addReflexionBienestar = (r) => snapshotAndSave({ bienestar: { ...bienestar, reflexiones: [...bienestar.reflexiones, r] } });
  const deleteReflexionBienestar = (id) => snapshotAndSave({ bienestar: { ...bienestar, reflexiones: bienestar.reflexiones.filter((x) => x.id !== id) } });
  const completarSesionConcentracion = (minutos) =>
    snapshotAndSave({ bienestar: { ...bienestar, sesiones: [...bienestar.sesiones, { id: uid(), minutos, fecha: todayISO() }] } });

  // Las fotos de progreso viven fuera del sistema de deshacer: implican un archivo real
  // subido a Supabase Storage, y "deshacer" no debería dejar un archivo huérfano sin referencia.
  const addFoto = async (file, nota) => {
    const path = await uploadProgressPhoto(uidUser, file);
    const entry = { id: uid(), path, fecha: todayISO(), nota: nota || '' };
    const next = [...saludFotos, entry];
    setSaludFotos(next);
    await saveData(uidUser, 'saludFotos', next);
  };
  const deleteFoto = async (id, path) => {
    const next = saludFotos.filter((f) => f.id !== id);
    setSaludFotos(next);
    await saveData(uidUser, 'saludFotos', next);
    await deleteProgressPhoto(path);
  };

  // Vídeos de calistenia — mismo motivo que las fotos de Salud: fuera del sistema de deshacer,
  // para no dejar archivos huérfanos en Storage sin ninguna fila que los referencie.
  const addVideo = async (skill, file, nota) => {
    const path = await uploadTrainingVideo(uidUser, file);
    const entry = { id: uid(), skill, path, fecha: todayISO(), nota: nota || '', feedback: '' };
    const next = [...calisteniaVideos, entry];
    setCalisteniaVideos(next);
    await saveData(uidUser, 'calisteniaVideos', next);
  };
  const deleteVideo = async (id, path) => {
    const next = calisteniaVideos.filter((v) => v.id !== id);
    setCalisteniaVideos(next);
    await saveData(uidUser, 'calisteniaVideos', next);
    await deleteTrainingVideo(path);
  };
  // El análisis de IA se guarda en el propio vídeo para no tener que repetirlo cada vez que se
  // abre la pestaña — pero solo se dispara cuando el usuario toca "Analizar con IA", nunca solo.
  const setVideoFeedback = async (id, feedback) => {
    const next = calisteniaVideos.map((v) => (v.id === id ? { ...v, feedback } : v));
    setCalisteniaVideos(next);
    await saveData(uidUser, 'calisteniaVideos', next);
  };

  // Fase 11 — Biblioteca: archivos (pdf/vídeo/foto) fuera del sistema de deshacer, mismo motivo
  // exacto que las fotos de progreso y los vídeos de calistenia — implican un archivo real en
  // Supabase Storage y "deshacer" dejaría un archivo huérfano sin ninguna fila que lo referencie.
  // El texto del PDF se extrae en el propio navegador antes de guardar el registro.
  const addArchivoBiblioteca = async (tipo, file, titulo) => {
    const path = await uploadBibliotecaArchivo(uidUser, file);
    const textoExtraido = tipo === 'pdf' ? await extractPdfText(file) : '';
    const entry = { id: uid(), tipo, path, titulo, fecha: todayISO(), textoExtraido };
    const next = [...bibliotecaArchivos, entry];
    setBibliotecaArchivos(next);
    await saveData(uidUser, 'bibliotecaArchivos', next);
  };
  const deleteArchivoBiblioteca = async (id, path) => {
    const next = bibliotecaArchivos.filter((x) => x.id !== id);
    setBibliotecaArchivos(next);
    await saveData(uidUser, 'bibliotecaArchivos', next);
    await deleteBibliotecaArchivo(path);
  };

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    const rest = history.slice(0, -1);
    setSueno(last.sueno); saveData(uidUser, 'sueno', last.sueno);
    setCalistenia(last.calistenia); saveData(uidUser, 'calistenia', last.calistenia);
    setFutbol(last.futbol); saveData(uidUser, 'futbol', last.futbol);
    setEconomia(last.economia); saveData(uidUser, 'economia', last.economia);
    setSalud(last.salud || DEFAULT_SALUD); saveData(uidUser, 'salud', last.salud || DEFAULT_SALUD);
    setNutricion(last.nutricion || DEFAULT_NUTRICION); saveData(uidUser, 'nutricion', last.nutricion || DEFAULT_NUTRICION);
    setEstudios(last.estudios || DEFAULT_ESTUDIOS); saveData(uidUser, 'estudios', last.estudios || DEFAULT_ESTUDIOS);
    setNegocio(last.negocio || DEFAULT_NEGOCIO); saveData(uidUser, 'negocio', last.negocio || DEFAULT_NEGOCIO);
    setProductividad(last.productividad || DEFAULT_PRODUCTIVIDAD); saveData(uidUser, 'productividad', last.productividad || DEFAULT_PRODUCTIVIDAD);
    setObjetivos(last.objetivos || DEFAULT_OBJETIVOS); saveData(uidUser, 'objetivos', last.objetivos || DEFAULT_OBJETIVOS);
    setDiario(last.diario || DEFAULT_DIARIO); saveData(uidUser, 'diario', last.diario || DEFAULT_DIARIO);
    setBiblioteca(last.biblioteca || DEFAULT_BIBLIOTECA); saveData(uidUser, 'biblioteca', last.biblioteca || DEFAULT_BIBLIOTECA);
    setRelacion(last.relacion || DEFAULT_RELACION); saveData(uidUser, 'relacion', last.relacion || DEFAULT_RELACION);
    setFe(last.fe || DEFAULT_FE); saveData(uidUser, 'fe', last.fe || DEFAULT_FE);
    setBienestar(last.bienestar || DEFAULT_BIENESTAR); saveData(uidUser, 'bienestar', last.bienestar || DEFAULT_BIENESTAR);
    setHistory(rest); saveData(uidUser, 'historial', rest);
  };

  // relacion queda fuera de currentState/export: es el único módulo protegido por PIN de
  // principio a fin, y exportar a CSV/Excel no pide el PIN — igual que las fotos de Salud o
  // los vídeos de Calistenia no se incluyen en el export por ser sensibles/binarios. fe y
  // bienestar sí se incluyen: ninguno lleva PIN ni archivos, mismo criterio que diario o
  // biblioteca (texto puro, sin protección).
  const currentState = { sueno, calistenia, futbol, economia, salud, nutricion, estudios, negocio, productividad, objetivos, diario, biblioteca, fe, bienestar };

  // Fase 19 — Personalización total: MORE_NAV es la lista canónica (id/label/icono por defecto);
  // "ajustes" queda siempre fuera de la personalización (ver motivo en tokens.js). El orden
  // guardado es una lista de ids — cualquier módulo nuevo que una fase futura añada a MORE_NAV y
  // que Josué no haya reordenado todavía aparece al final, en su posición original.
  const moreNavPersonalizables = MORE_NAV.filter((m) => m.id !== 'ajustes');
  const ordenIds = personalizacion.orden.length
    ? [...personalizacion.orden.filter((id) => moreNavPersonalizables.some((m) => m.id === id)),
       ...moreNavPersonalizables.filter((m) => !personalizacion.orden.includes(m.id)).map((m) => m.id)]
    : moreNavPersonalizables.map((m) => m.id);
  const moreNavOrdenadoConIconos = ordenIds
    .map((id) => moreNavPersonalizables.find((m) => m.id === id))
    .filter(Boolean)
    .map((m) => ({ ...m, icon: ICONOS_PERSONALIZABLES_MAP[personalizacion.iconos[m.id]] || m.icon }));

  // Fase N1 — catálogo con iconos ya resueltos (igual que moreNavOrdenadoConIconos, pero indexado
  // por id) para que HubView pinte el icono personalizado de cada tarjeta sin recalcularlo.
  const catalogoConIconos = Object.fromEntries(
    MORE_NAV.map((m) => [m.id, { ...m, icon: ICONOS_PERSONALIZABLES_MAP[personalizacion.iconos[m.id]] || m.icon }])
  );
  // A qué área pertenece un módulo (para el botón "volver" y para resaltar el icono correcto de
  // la barra inferior mientras se está dentro de un módulo, no solo en el propio hub).
  const areaDeModulo = (id) => AREAS_NAV.find((a) => a.modulos.includes(id));
  const areaActual = tab.startsWith('area-') ? AREAS_NAV.find((a) => a.id === tab) : areaDeModulo(tab);
  // Resúmenes de todas las tarjetas, recalculados en cada render — son cálculos baratos (sumas,
  // últimas fechas) sobre datos que ya están en memoria, mismo criterio que calcularMetricas().
  const resumenesTodos = Object.fromEntries(
    MORE_NAV.map((m) => [m.id, calcularResumenModulo(m.id, { sueno, calistenia, futbol, economia, salud, nutricion, estudios, negocio, productividad, objetivos, diario, biblioteca, bibliotecaArchivos, relacion, fe, bienestar })])
  );

  // Fase 19 — métricas favoritas del panel "Hoy": se calculan aquí (no en DashboardView) porque
  // combinan datos de varios módulos, mismo criterio que ya usan Estadísticas/Predicciones —
  // ninguna vista de solo-lectura debería tener que conocer la forma interna de otro módulo.
  const calcularMetricas = () => {
    const valores = {};
    const ultimaMedida = salud.medidas[salud.medidas.length - 1];
    valores.peso = ultimaMedida?.peso ? `${ultimaMedida.peso} kg` : 'Sin datos';
    valores.hucha = `${economia.hucha || 0} €`;
    const mejorRacha = productividad.habitos.reduce((max, h) => Math.max(max, h.rachaActual || 0), 0);
    valores.racha_habito = productividad.habitos.length ? `${mejorRacha} días` : 'Sin hábitos';
    const pendientesConPlazo = objetivos.lista
      .filter((o) => !o.cumplido)
      .map((o) => ({ o, p: prediccionObjetivo(o) }))
      .filter((x) => x.p.suficientesDatos)
      .sort((a, b) => a.p.diasRestantes - b.p.diasRestantes);
    valores.proximo_objetivo = pendientesConPlazo.length
      ? `${pendientesConPlazo[0].o.texto} (${pendientesConPlazo[0].p.diasRestantes}d)`
      : 'Sin objetivos pendientes';
    const cutoff7 = new Date(); cutoff7.setDate(cutoff7.getDate() - 6);
    const cutoff7ISO = cutoff7.toISOString().slice(0, 10);
    const entradasRecientes = diario.entradas.filter((e) => e.fecha >= cutoff7ISO);
    valores.animo_medio = entradasRecientes.length
      ? `${Math.round((entradasRecientes.reduce((s, e) => s + Number(e.animo), 0) / entradasRecientes.length) * 10) / 10}/5`
      : 'Sin datos';
    valores.sesiones_concentracion = `${bienestar.sesiones.filter((s) => s.fecha >= cutoff7ISO).length}`;
    return valores;
  };
  const metricasCalculadas = calcularMetricas();
  const favoritasResueltas = personalizacion.favoritas
    .map((id) => METRICAS_FAVORITAS_DISPONIBLES.find((m) => m.id === id))
    .filter(Boolean)
    .map((m) => ({ id: m.id, label: m.label, valor: metricasCalculadas[m.id] }));

  // Fase 18 — panel de sugerencias y buscador universal reutilizan currentState como contexto:
  // es exactamente el mismo objeto ya auditado para la exportación CSV/Excel (sin `relacion`, el
  // único módulo protegido por PIN de principio a fin, y sin archivos binarios) — mismo criterio
  // de privacidad, sin tener que mantener una segunda lista de "qué puede ver la IA".
  const buildSuggestionsPrompt = () =>
    `Resumen reciente de varios módulos de la app personal de Josué (JSON, últimos registros de cada uno): ${JSON.stringify({
      sueno: sueno.slice(-7),
      calistenia,
      futbol: futbol.slice(-5),
      economia: { ...economia, movimientos: economia.movimientos.slice(-10) },
      salud,
      nutricion: { ...nutricion, comidas: nutricion.comidas.slice(-10) },
      estudios,
      productividad,
      objetivos,
      fe: { ...fe, diario: fe.diario.slice(-3) },
      bienestar,
    })}. Da como máximo 2 sugerencias breves y concretas de algo a lo que Josué podría prestar atención hoy o esta semana, basadas solo en estos datos. Si no ves nada claro que sugerir, dilo abiertamente en vez de forzar una.`;

  const renderContent = () => {
    // Fase N1 — hubs de área: al pulsar Salud/Vida/Gestión/Más en la barra inferior se llega
    // aquí primero, nunca directo a un módulo (ver AREAS_NAV arriba). Las tarjetas llaman a
    // setTab(id) con el id del módulo real, que sigue resolviendo exactamente igual que siempre
    // en el resto de este switch, sin tocar ninguna vista existente.
    if (tab.startsWith('area-')) {
      const area = AREAS_NAV.find((a) => a.id === tab);
      return (
        <HubView
          area={area} modulos={catalogoConIconos} personalizacion={personalizacion}
          resumenes={resumenesTodos} accent={accent} onOpenModulo={setTab}
        />
      );
    }
    switch (tab) {
      case 'hoy':
        return (
          <DashboardView
            perfil={perfil} sueno={sueno} calistenia={calistenia} futbol={futbol} economia={economia}
            relacion={relacion} favoritas={favoritasResueltas}
            productividad={productividad} estudios={estudios} modo={personalizacion.modo}
            notificaciones={notificaciones}
            accent={accent}
          />
        );
      case 'sueno':
        return <SleepView sueno={sueno} onAdd={addSueno} accent={accent} />;
      case 'entreno':
        return (
          <TrainingView
            calistenia={calistenia} onUpdateSkill={updateSkill}
            futbol={futbol} onAddPartido={addPartido}
            videos={calisteniaVideos} onAddVideo={addVideo} onDeleteVideo={deleteVideo} onSetVideoFeedback={setVideoFeedback}
            accent={accent}
          />
        );
      case 'salud':
        return (
          <HealthView
            salud={salud} fotos={saludFotos}
            onAddMedida={addMedida} onAddHistorial={addHistorialMedico}
            onAddFoto={addFoto} onDeleteFoto={deleteFoto}
            pin={pin} accent={accent}
          />
        );
      case 'nutricion':
        return (
          <NutritionView
            nutricion={nutricion} onAddComida={addComida} onAddFavorito={addFavorito}
            onRegistrarFavorito={registrarFavorito} onEliminarFavorito={eliminarFavorito}
            onSetAgua={setAgua} accent={accent}
          />
        );
      case 'estudios':
        return (
          <EstudiosView
            estudios={estudios} sueno={sueno}
            onAddPrograma={addPrograma} onAddAsignatura={addAsignatura} onDeleteAsignatura={deleteAsignatura}
            onAddExamen={addExamen} onUpdateExamen={updateExamen} onDeleteExamen={deleteExamen}
            onAddHoras={addHoras} accent={accent}
          />
        );
      case 'negocio':
        return <BusinessView negocio={negocio} onAddProyecto={addProyecto} onUpdateProyecto={updateProyecto} onDeleteProyecto={deleteProyecto} accent={accent} />;
      case 'productividad':
        return (
          <ProductivityView
            productividad={productividad}
            onAddHabito={addHabito} onUpdateHabito={updateHabito} onDeleteHabito={deleteHabito}
            onAddRutina={addRutina} onUpdateRutina={updateRutina} onDeleteRutina={deleteRutina}
            onAddTarea={addTarea} onToggleTarea={toggleTarea} onDeleteTarea={deleteTarea}
            onAddMeta={addMeta} onUpdateMeta={updateMeta} onDeleteMeta={deleteMeta}
            onCompletarPomodoro={completarPomodoro}
            accent={accent}
          />
        );
      case 'objetivos':
        return (
          <ObjectivesView
            objetivos={objetivos} onAdd={addObjetivo} onUpdate={updateObjetivo} onDelete={deleteObjetivo}
            onRevisionHecha={marcarRevisionHecha} accent={accent}
          />
        );
      case 'diario':
        return (
          <DiaryView
            diario={diario} onAdd={addEntradaDiario} onUpdate={updateEntradaDiario} onDelete={deleteEntradaDiario}
            accent={accent}
          />
        );
      case 'fe':
        return (
          <FaithView
            fe={fe}
            onAddServicio={addServicioFe} onDeleteServicio={deleteServicioFe}
            onAddEvento={addEventoFe} onDeleteEvento={deleteEventoFe}
            onAddDiarioFe={addDiarioFe} onDeleteDiarioFe={deleteDiarioFe}
            onAddObjetivoFe={addObjetivoFe} onUpdateObjetivoFe={updateObjetivoFe} onDeleteObjetivoFe={deleteObjetivoFe}
            accent={accent}
          />
        );
      case 'biblioteca':
        return (
          <LibraryView
            biblioteca={biblioteca} archivos={bibliotecaArchivos}
            onAddArchivo={addArchivoBiblioteca} onDeleteArchivo={deleteArchivoBiblioteca}
            onAddApunte={addApunte} onDeleteApunte={deleteApunte}
            onAddEnlace={addEnlace} onDeleteEnlace={deleteEnlace}
            accent={accent}
          />
        );
      case 'relacion':
        return (
          <RelationView
            relacion={relacion}
            onUpdateNombre={updateNombrePareja}
            onAddFecha={addFechaImportante}
            onDeleteFecha={deleteFechaImportante}
            accent={accent}
          />
        );
      case 'bienestar':
        return (
          <WellbeingView
            bienestar={bienestar}
            onAddRegistro={addRegistroTiempoUso} onDeleteRegistro={deleteRegistroTiempoUso}
            onAddReflexion={addReflexionBienestar} onDeleteReflexion={deleteReflexionBienestar}
            onCompletarSesion={completarSesionConcentracion}
            accent={accent}
          />
        );
      case 'estadisticas':
        return <StatsView sueno={sueno} estudios={estudios} diario={diario} calistenia={calistenia} accent={accent} />;
      case 'predicciones':
        return (
          <PredictionsView
            objetivos={objetivos} productividad={productividad} salud={salud}
            calistenia={calistenia} economia={economia} estudios={estudios}
            accent={accent}
          />
        );
      case 'logros':
        return (
          <AchievementsView
            productividad={productividad} diario={diario} objetivos={objetivos}
            bienestar={bienestar} fe={fe} nutricion={nutricion} salud={salud}
            calistenia={calistenia} economia={economia} sueno={sueno}
            accent={accent}
          />
        );
      case 'economia':
        return <FinanceView economia={economia} onAddMovimiento={addMovimiento} onUpdateHucha={updateHucha} accent={accent} />;
      case 'ajustes':
        // Fase A1 — Ajustes pasa a ser un único centro de categorías (ver SettingsView.jsx):
        // ya no se apilan SettingsView + PersonalizationView, SettingsView reenvía las props
        // de personalización a la categoría interna "Pantalla principal" que envuelve
        // PersonalizationView sin tocarla.
        return (
          <SettingsView
            perfil={perfil} onUpdatePerfil={updatePerfil} accent={accent} onUpdateAccent={updateAccent}
            onPreviewAccent={setAccent}
            historialColor={historialColor} onRegistrarColorReciente={registrarColorReciente} onToggleFavoritoColor={toggleFavoritoColor}
            temaPersonalizado={temaPersonalizado} onUpdateTemaPersonalizado={updateTemaPersonalizado}
            onPreviewTemaPersonalizado={setTemaPersonalizado}
            temasGuardados={temasGuardados}
            onAplicarConjuntoTema={aplicarConjuntoTema}
            onRestablecerTemaOficial={restablecerTemaOficial}
            onGuardarTemaComoNuevo={guardarTemaComoNuevo}
            onRenombrarTemaGuardado={renombrarTemaGuardado}
            onDuplicarTemaGuardado={duplicarTemaGuardado}
            onEliminarTemaGuardado={eliminarTemaGuardado}
            onImportarTemaGuardado={importarTemaGuardado}
            apariencia={apariencia} onUpdateApariencia={updateApariencia}
            notificaciones={notificaciones} onUpdateNotificaciones={updateNotificaciones}
            seguridad={seguridad} onUpdateSeguridad={updateSeguridad} userId={uidUser}
            modulosBorrables={Object.entries(RESET_MODULOS).map(([id, cfg]) => ({ id, label: cfg.label }))}
            onBorrarDatosModulo={borrarDatosModulo}
            onExportCSV={() => exportCSV(currentState)} onExportXLSX={() => exportXLSX(currentState)}
            onUndo={undo} canUndo={history.length > 0}
            pin={pin} onSetPin={updatePin}
            onSignOut={signOut}
            modulos={moreNavOrdenadoConIconos}
            personalizacion={personalizacion}
            onMove={moverModuloNav}
            onToggleOculto={toggleOcultoModulo}
            onSetIcono={setIconoModulo}
            onTogglePinExtra={togglePinExtraModulo}
            onToggleFavorita={toggleFavoritaMetrica}
            onMoveFavorita={moverFavoritaMetrica}
            modo={personalizacion.modo}
            onSetModo={setModoApp}
          />
        );
      default:
        return null;
    }
  };

  // Fase 19: además de Relación (siempre protegida, Fase 12), cualquier módulo que Josué haya
  // marcado en Personalización avanzada (personalizacion.pinExtra) pasa por el mismo PinGate.
  const necesitaPin = tab === 'relacion' || personalizacion.pinExtra.includes(tab);
  // Fase N1/N2 — si `tab` es un módulo (no "hoy" ni un hub), se llegó ahí desde un hub de área:
  // se añade una barra "volver a {Área}" arriba y una entrada con deslizamiento suave. `key={tab}`
  // fuerza que la animación se repita cada vez que cambias de módulo (si no, React reutiliza el
  // mismo nodo del DOM y la animación CSS solo se ve la primera vez). Fase N2: la barra "volver"
  // lleva además su propia animación más corta (`back-bar`) por encima de la del contenedor
  // (`module-enter`) — ambas se combinan porque son transforms independientes de padre e hijo —
  // para que se sienta como una capa que ya estaba fija ahí, no como si arrastrara con el resto.
  const esHub = tab.startsWith('area-');
  const enModulo = tab !== 'hoy' && !esHub;
  const renderTab = () => {
    const contenido = necesitaPin ? <PinGate pin={pin} accent={accent}>{renderContent()}</PinGate> : renderContent();
    if (!enModulo || !areaActual) return contenido;
    return (
      <div key={tab} className="module-enter">
        {/* Fase N4 — pasa de texto suelto a una píldora "glass" (fondo tenue + borde apenas
            visible), coherente con el resto del lenguaje visual del hub del que viene. */}
        <button
          onClick={() => setTab(areaActual.id)}
          className="back-bar inline-flex items-center gap-1.5 mb-4 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold active:opacity-60"
          style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
        >
          <ArrowLeft size={16} /> {areaActual.label}
        </button>
        {contenido}
      </div>
    );
  };

  // Fase A5: bloqueo automático por inactividad, por encima de todo lo demás (incluida la propia
  // navegación) — solo puede ocurrir si hay PIN configurado (ver el useEffect de arriba).
  if (bloqueado && pin) {
    return (
      <BloqueoAutomaticoGate
        pin={pin} accent={accent} seguridad={seguridad}
        onUnlock={() => setBloqueado(false)}
      />
    );
  }

  return (
    <div
      style={{
        '--accent': accent,
        // Fase 1 del Sistema de Personalización Visual Extrema — variables CSS que reflejan los
        // tokens ya resueltos de `COLORS` (que solo viven como objeto JS) para que `index.css`
        // también pueda consumir tokens en vez de colores sueltos (apartado 15 de la
        // especificación: "los componentes deben consumir tokens semánticos", incluido CSS puro,
        // no solo `style={{}}` en línea). Se recalculan en cada render junto con `COLORS`, así
        // que siguen el tema/acento activos igual de en vivo que el resto de la app.
        '--color-bg': COLORS.bg,
        '--color-surface': COLORS.surface,
        '--color-border': COLORS.border,
        '--color-text': COLORS.text,
        '--color-text-muted': COLORS.textMuted,
        background: COLORS.bg,
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`*:focus-visible { outline: 2px solid ${accent}; outline-offset: 2px; }`}</style>

      {/* Fase 18 — panel de sugerencias fijo arriba a la izquierda y buscador universal en
          lenguaje natural arriba a la derecha; ninguno de los dos se dispara solo. */}
      <SuggestionsButton accent={accent} buildPrompt={buildSuggestionsPrompt} />
      <button
        onClick={() => setShowSearch(true)}
        className="fixed z-30 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ top: 14, right: 14, background: hexToRgba(accent, 0.15), border: `1px solid ${hexToRgba(accent, 0.3)}`, backdropFilter: 'blur(8px)' }}
        aria-label="Buscar en tus datos"
      >
        <Search size={16} style={{ color: accent }} />
      </button>
      {showSearch && (
        <UniversalSearchModal accent={accent} onClose={() => setShowSearch(false)} buildContext={() => currentState} />
      )}

      <div className="max-w-md mx-auto px-4 pt-16" style={{ paddingBottom: 100 }}>
        {renderTab()}
      </div>

      {/* Fase N1 — barra inferior fija de 5 pestañas (Inicio + 4 áreas). Pulsar un área siempre
          lleva a su hub (nunca directo a un módulo); el icono se resalta también mientras se está
          dentro de un módulo de esa área (areaActual), no solo en el propio hub. Nunca añadir una
          sexta pestaña — los módulos nuevos van dentro de un área existente (AREAS_NAV arriba). */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex justify-center"
        style={{ background: 'rgba(5,6,10,0.75)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${COLORS.border}` }}
      >
        <div className="max-w-md w-full flex px-2 py-2">
          <button onClick={() => setTab('hoy')} className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl">
            <Home size={20} strokeWidth={tab === 'hoy' ? 2.4 : 1.8} className="nav-tab-icon" style={{ color: tab === 'hoy' ? accent : COLORS.textMuted }} />
            <span className="nav-tab-label" style={{ fontSize: 10, fontWeight: 500, color: tab === 'hoy' ? accent : COLORS.textMuted }}>Inicio</span>
          </button>
          {AREAS_NAV.map((area) => {
            const Icon = area.icon;
            const active = areaActual?.id === area.id;
            return (
              <button key={area.id} onClick={() => setTab(area.id)} className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl">
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} className="nav-tab-icon" style={{ color: active ? accent : COLORS.textMuted }} />
                <span className="nav-tab-label" style={{ fontSize: 10, fontWeight: 500, color: active ? accent : COLORS.textMuted }}>{area.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
