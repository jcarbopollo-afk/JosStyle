import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Home, Moon, Dumbbell, Wallet, Settings, Loader2, HeartPulse, Apple, MoreHorizontal, GraduationCap, Briefcase, ListTodo, Target, BookOpen, Library, Heart, Church, Smartphone, BarChart3, TrendingUp, Search, Trophy, Lock, ArrowLeft, Calendar, Shirt, Flame, CalendarClock, UserRound } from 'lucide-react';
import { COLORS, ACCENTS, DEFAULT_PERFIL, DEFAULT_ECONOMIA, DEFAULT_CALISTENIA, DEFAULT_SALUD, DEFAULT_NUTRICION, DEFAULT_ESTUDIOS, DEFAULT_NEGOCIO, DEFAULT_PRODUCTIVIDAD, DEFAULT_OBJETIVOS, DEFAULT_DIARIO, DEFAULT_BIBLIOTECA, DEFAULT_RELACION, DEFAULT_FE, DEFAULT_BIENESTAR, DEFAULT_PERSONALIZACION, METRICAS_FAVORITAS_DISPONIBLES, MAX_METRICAS_FAVORITAS, MODOS_APP, DEFAULT_APARIENCIA, aplicarTema, TAMANOS_TEXTO, DEFAULT_NOTIFICACIONES, DEFAULT_SEGURIDAD, OPCIONES_BLOQUEO_AUTOMATICO, ACCIONES_PROTEGIBLES, DEFAULT_HISTORIAL_COLOR, MAX_COLORES_RECIENTES, MAX_COLORES_FAVORITOS, DEFAULT_TEMA_PERSONALIZADO, DEFAULT_TEMAS_GUARDADOS, MAX_TEMAS_GUARDADOS, PALETAS_PREDEFINIDAS, DEFAULT_CALENDARIO, PERFILES_MODULOS } from './tokens';
import { getSession, onAuthChange, onAuthEvent, sendPasswordReset, loadData, saveData, signOut, uploadProgressPhoto, deleteProgressPhoto, uploadTrainingVideo, deleteTrainingVideo, uploadBibliotecaArchivo, deleteBibliotecaArchivo, uploadPrendaFoto, deletePrendaFoto, uploadFondoFoto, getSignedFondoUrl } from './lib/supabase';
import { exportCSV, exportXLSX } from './lib/exportData';
import { uid, todayISO, addDays, hexToRgba } from './lib/helpers';
import { extractPdfText } from './lib/pdfText';
import { prediccionObjetivo } from './lib/predicciones';
import { verificarBiometria } from './lib/biometria';
import { crearPinHash, verificarPin } from './lib/pin';
import { calcularResumenModulo } from './lib/resumenesHub';
import { eventosDerivados } from './lib/calendarioIntegracion';
import { normalizarFondo, resolverFondo, estilosDeFondo, estilosDeVelo, estilosDeLuminosidad } from './lib/fondos';
import { urlFirmada, urlEnCache } from './lib/imagenes';
import { resumenHabito } from './lib/rachas';
import { DEFAULT_AUDIO, normalizarAudio } from './lib/audio';
import { iniciarAudio, conectarAlBus, actualizarPreferencias as actualizarAudio, detener as detenerAudio } from './lib/audioEngine';
import { emitir } from './lib/eventos';
import { ESTADO_INICIAL, normalizarEstado, crearRacha as crearRachaServicio, completarDia as completarDiaServicio, deshacerDia as deshacerDiaServicio, eliminarRacha as eliminarRachaServicio } from './lib/rachasServicio';
import { GAMIFICACION_INICIAL, normalizarGamificacion, evaluar as evaluarRachas, olvidarRacha as olvidarRachaGamificacion } from './lib/rachasGamificacion';
import { PinGate, EntradaPin, VerificacionPinModal, CrearPinModal, RecuperarPinModal, SuggestionsButton, UniversalSearchModal } from './components/ui';
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
import CalendarView from './views/CalendarView';
import DiaryView from './views/DiaryView';
import LibraryView from './views/LibraryView';
import RelationView from './views/RelationView';
import FaithView from './views/FaithView';
import WellbeingView from './views/WellbeingView';
import StatsView from './views/StatsView';
import PredictionsView from './views/PredictionsView';
import AchievementsView from './views/AchievementsView';
import SettingsView from './views/SettingsView';
import { construirIndice } from './lib/indiceBusqueda';
import { DEFAULT_ARMARIO, crearPrenda, actualizarPrenda, crearOutfit, actualizarOutfit, duplicarOutfit, crearUso, actualizarUso } from './lib/armario';
import ArmarioView from './views/ArmarioView';
import RachasView, { ResumenRachaHoy } from './views/RachasView';
import HorarioView from './views/HorarioView';
import EstiloHombreView from './views/EstiloHombreView';
import { DEFAULT_HORARIO_TOP, normalizarHorarioTop } from './lib/horario';
import { DEFAULT_ESTILO_HOMBRE, normalizarEstiloHombre } from './lib/estiloDeHombre';
/* ⚠️ **Este import faltaba desde ME F3**, y `DEFAULT_PAPELERA` se usa en un
   `useState` de la línea 262: `App.jsx` lanzaba un ReferenceError en el primer
   render. Ni `vite build` ni las pruebas de renderizado podían verlo —
   JavaScript no comprueba los identificadores al compilar, y `App.jsx` no se
   renderiza en las pruebas porque necesita Supabase—. Lo encontró la regla
   invariante que se añadió en esta misma fase (`scripts/test-imports.mjs`),
   escrita justo después de cometer el mismo fallo con `eliminarRegistroPiel`. */
import { DEFAULT_PAPELERA, purgarCaducados, prepararEliminacion, prepararRestauracion, conArrastrados } from './lib/papelera';
// EH F15 — los registros de piel entran y salen de la papelera que YA existe.
import { eliminarRegistroPiel, restaurarRegistroPiel } from './lib/seguimientoPiel';
// EH F21 — lo mismo para barba: rutinas y registros, a la papelera de siempre.
import { eliminarRegistroBarba, restaurarRegistroBarba, eliminarRutinaConPapelera, restaurarRutinaBarba } from './lib/rutinasBarba';
// EH F19 — y las rutinas de Higiene y de Cuidado corporal, por la misma puerta.
import { eliminarRutinaCuerpo, restaurarRutinaCuerpo } from './lib/rutinasCuerpo';
// EH F23 — y lo mismo para Sonrisa: rutinas, revisiones y registros.
import {
  eliminarRutinaSonrisa, restaurarRutinaSonrisa, eliminarRevision, restaurarRevision,
  eliminarRegistroSonrisa, restaurarRegistroSonrisa,
} from './lib/sonrisa';
// EH F24 — perfumes y su historial, a la misma papelera.
import { eliminarPerfume, restaurarPerfume, eliminarUso, restaurarUso } from './lib/perfumes';
// EH F26 — accesorios y su lista de deseados, a la misma papelera.
import { eliminarAccesorio, restaurarAccesorio, eliminarDeseoAccesorio, restaurarDeseoAccesorio } from './lib/accesorios';
// EH F27 — gustos, intereses y cosas que quiere hacer, a la misma papelera.
import { eliminarGusto, restaurarGusto } from './lib/gustos';
/* ⚠️ **EH F39, apartado 3** — el puente a Tareas. `App.jsx` es el dueño de
   `estiloHombre` y de `productividad`, así que el plan lo aplica aquí. */
import { aplicarTarea } from './lib/integracionEstilo';
import { ICONOS_PERSONALIZABLES_MAP } from './views/PersonalizationView'; // el componente en sí ahora se usa dentro de SettingsView.jsx (Fase A1)

// FO Fase 12 — firmar una foto de fondo cualquiera por su ruta, no solo la activa.
// Lo necesitan las miniaturas de "Fotografías anteriores". Vive fuera del componente
// a propósito: si se definiera dentro, sería una función nueva en cada render y el
// `useEffect` de cada miniatura volvería a dispararse sin parar.
const firmarFotoFondo = (path) => urlFirmada(path, getSignedFondoUrl);

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
//
// Fase 1 del Calendario Universal — "calendario" se suma como un módulo más de MORE_NAV/AREAS_NAV,
// nunca como una sexta pestaña (el propio prompt del Calendario lo deja explícito: la barra
// inferior no crece, los módulos nuevos entran dentro de un área ya existente). Vive en "Vida"
// (junto a Estudios/Productividad/Objetivos/Diario/Biblioteca, las áreas con más dimensión
// temporal) y en primera posición, dado que su vocación es ser el eje temporal transversal de
// toda la app — ver HANDOFF.md para el resto de la arquitectura (origen/origenId por evento,
// preparada para que una Fase 2 futura conecte aquí Objetivos/Hábitos/Estudios/etc. sin duplicar
// datos).
const MORE_NAV = [
  { id: 'salud', label: 'Salud', icon: HeartPulse },
  { id: 'sueno', label: 'Sueño', icon: Moon },
  { id: 'nutricion', label: 'Nutrición', icon: Apple },
  { id: 'entreno', label: 'Entrenamiento', icon: Dumbbell },
  { id: 'calendario', label: 'Calendario', icon: Calendar },
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
  { id: 'armario', label: 'Armario', icon: Shirt },
  { id: 'rachas', label: 'Rachas', icon: Flame },
  { id: 'horario', label: 'Horario', icon: CalendarClock },
  // Entrega 2 · EH Fase 1 — Estilo de Hombre entra como UN módulo más del área
  // "Más". La barra inferior sigue con cinco pestañas (regla 10): un apartado
  // nuevo va a un área existente, nunca a la barra.
  { id: 'estilo-hombre', label: 'Estilo de hombre', icon: UserRound },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
];

// BI Fase 3 · apartado 16 — "limitar el número de elementos". Cuatro caben sin empujar
// las sugerencias fuera de la pantalla en un móvil.
const MAX_RECIENTES_BUSQUEDA = 4;

const AREAS_NAV = [
  { id: 'area-salud', label: 'Salud', icon: HeartPulse, modulos: ['salud', 'sueno', 'nutricion', 'entreno'] },
  { id: 'area-vida', label: 'Vida', icon: BookOpen, modulos: ['calendario', 'horario', 'estudios', 'productividad', 'rachas', 'objetivos', 'diario', 'biblioteca'] },
  { id: 'area-gestion', label: 'Gestión', icon: Briefcase, modulos: ['economia', 'negocio', 'armario'] },
  { id: 'area-mas', label: 'Más', icon: MoreHorizontal, modulos: ['estilo-hombre', 'relacion', 'fe', 'bienestar', 'estadisticas', 'predicciones', 'logros', 'ajustes'] },
];

// Fase de Seguridad Centralizada — catálogo de "áreas protegibles" (apartado 1 de la
// especificación: "no debe limitarse a los módulos actuales, cualquier módulo futuro debe poder
// declararse protegible"). Se construye a partir de MORE_NAV, el mismo catálogo plano que ya usa
// Personalización — así un módulo nuevo que se añada ahí en el futuro aparece solo en la lista de
// "Protección mediante PIN" de Seguridad, sin tocar este archivo. 'hoy' se añade aparte porque
// vive fuera de MORE_NAV (es la pestaña fija de inicio) pero también puede querer protegerse.
const AREAS_PROTEGIBLES = [{ id: 'hoy', label: 'Hoy', icon: Home }, ...MORE_NAV];

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
// Fase de Seguridad Centralizada: verifica contra el hash (nunca en claro) y comparte el mismo
// EntradaPin que el resto de pantallas que piden PIN; añade "¿No recuerdas tu PIN?".
function BloqueoAutomaticoGate({ seguridad, accent, onUnlock, onOlvidoPin }) {
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
  const intentarPin = async (valor) => {
    setVerificando(true);
    const ok = await verificarPin(valor, seguridad.pinHash, seguridad.pinSalt);
    setVerificando(false);
    if (ok) onUnlock(); else setError('PIN incorrecto');
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
      <EntradaPin accent={accent} onSubmit={intentarPin} cargando={verificando} error={error} />
      {onOlvidoPin && (
        <button onClick={onOlvidoPin} className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
          ¿No recuerdas tu PIN?
        </button>
      )}
    </div>
  );
}

// FO Fase 1 — el fondo se guarda dentro de `apariencia`, y el merge de carga es superficial,
// así que hay que normalizarlo aparte. Está aquí y no dentro del componente porque no depende
// de ningún estado: es una transformación pura de lo que viene de la base de datos.
const conFondoNormalizado = (ap) => ({ ...ap, fondo: normalizarFondo(ap.fondo) });

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = comprobando, null = sin sesión
  const [tab, setTab] = useState('hoy');
  const [loaded, setLoaded] = useState(false);
  const [accent, setAccent] = useState(ACCENTS[0].value);
  // Fase A3 — Apariencia avanzada: tema (claro/oscuro/automático), tamaño de texto, densidad,
  // radios de borde y animaciones. `temaSistemaOscuro` solo se usa para resolver "automático".
  const [apariencia, setApariencia] = useState(DEFAULT_APARIENCIA);
  // FO Fase 2 — la URL firmada de la foto de fondo. Vive en estado y no se calcula al vuelo
  // porque firmar es una llamada de red: hacerlo en cada render sería una petición por render.
  const [urlFotoFondo, setUrlFotoFondo] = useState(null);
  const [temaSistemaOscuro, setTemaSistemaOscuro] = useState(
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : true)
  );
  // Fase A5 — Seguridad avanzada: bloqueo automático + biometría. `bloqueado` es el estado de la
  // pantalla de bloqueo completa (distinta del PinGate por sección que ya existía).
  // Fase de Seguridad Centralizada: `seguridad` pasa a ser también el único sitio con el PIN
  // (hasheado, ver src/lib/pin.js) y las zonas/funciones protegidas — ya no existe un estado
  // `pin` en claro aparte. `desbloqueosPin` es el mapa de sesiones temporales del apartado 6
  // (clave `area:<id>` o `accion:<id>` → timestamp de expiración), solo en memoria: al cerrar o
  // recargar la app se pierde por sí solo, sin necesitar lógica extra (apartado 7). `verificacion`
  // es la petición de PIN pendiente para confirmar una acción sensible (apartado 3): cambiar PIN,
  // desactivarlo o quitar protección a una sección/función — un único modal para las tres, en vez
  // de repetir la pantalla de verificación en cada sitio. `flujoNuevoPin` controla el modal de
  // crear/cambiar PIN ('primero' | 'cambio' | 'recuperacion' | null) y `recuperandoPin` el modal
  // de "¿No recuerdas tu PIN?".
  const [seguridad, setSeguridad] = useState(DEFAULT_SEGURIDAD);
  const [bloqueado, setBloqueado] = useState(false);
  const [desbloqueosPin, setDesbloqueosPin] = useState({});
  const [verificacion, setVerificacion] = useState(null); // { motivo, onSuccess }
  const [flujoNuevoPin, setFlujoNuevoPin] = useState(null); // 'primero' | 'cambio' | 'recuperacion' | null
  const [recuperandoPin, setRecuperandoPin] = useState(false);
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
  // Fase 1 del Calendario Universal — texto puro (sin archivos, sin PIN), mismo criterio que
  // Diario/Objetivos: clave de Supabase propia ('calendario'), pasa por snapshotAndSave/deshacer.
  const [calendario, setCalendario] = useState(DEFAULT_CALENDARIO);
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
  // Entrega 2 · ME Fase 3 — papelera global ("Eliminados recientemente").
  const [papelera, setPapelera] = useState(DEFAULT_PAPELERA);
  const [history, setHistory] = useState([]);
  const [showSearch, setShowSearch] = useState(false); // Fase 18 — buscador universal
  // Ampliación del Dashboard — Centro de Control: `dashboardFoco` es el único estado nuevo que
  // necesita el deep-linking (apartado 5/6 de la especificación: "cada tarjeta debe conocer cuál
  // es su destino", "siempre que sea técnicamente posible, una tarjeta debe poder llevar al
  // elemento exacto que representa"). No es un router paralelo (apartado 23 lo prohíbe
  // explícitamente) — reutiliza `setTab`, el mecanismo de navegación que ya existe desde la Fase
  // N1, y añade solo el elemento concreto a enfocar dentro de esa pestaña: `{ modulo, id/skill/
  // examenId/tareaId/accion... }`. Cada vista de destino consume su propio `foco` una única vez
  // (scroll + resaltado temporal, o abrir el formulario correspondiente) y llama a
  // `onFocoConsumido`, que lo limpia — así volver a esa pestaña más tarde por la navegación normal
  // no vuelve a saltar solo al mismo elemento.
  const [armario, setArmario] = useState(DEFAULT_ARMARIO);
  const [rachas, setRachas] = useState(ESTADO_INICIAL);
  // SO Fase 1 — las preferencias de sonido, en su propia clave de `app_data` como
  // `notificaciones`. NO dentro del paquete `ajustes`: ese se guarda entero en
  // cada escritura (regla 5), así que un `saveData` que se olvidara del audio lo
  // borraría. Y de fábrica está apagado, porque todavía no hay sonidos.
  const [audio, setAudio] = useState(DEFAULT_AUDIO);
  const [horarioTop, setHorarioTop] = useState(DEFAULT_HORARIO_TOP);
  /* EH Fase 1 — Estilo de Hombre en su propia clave de `app_data`. Ni una tabla
     nueva ni SQL que ejecutar, igual que los otros veintidós módulos, y aparte
     del paquete `ajustes` porque ese se guarda entero en cada escritura
     (regla 5): un `saveData` que se olvidara de esto lo borraría. */
  const [estiloHombre, setEstiloHombre] = useState(DEFAULT_ESTILO_HOMBRE);
  // RA Fase 3 — los logros y los hitos ya anunciados, en su propia clave. Van
  // aparte de `rachas` porque son cosas distintas (apartado 7: hito ≠ logro) y
  // porque un logro conseguido NO se revoca al corregir el historial (apartado 28).
  const [gamificacion, setGamificacion] = useState(GAMIFICACION_INICIAL);
  const [dashboardFoco, setDashboardFoco] = useState(null);
  // BI Fase 4 · apartado 11 — de dónde vino Josué al abrir algo desde el buscador.
  const [vueltaBusqueda, setVueltaBusqueda] = useState(null);

  useEffect(() => {
    getSession().then(setSession);
    const unsub = onAuthChange(setSession);
    return unsub;
  }, []);

  /* ⚠️ **EH F43, apartados 3 y 15** — *"cerrar sesión debe invalidar correctamente
     el acceso: no dejar datos privados accesibles desde una sesión anterior."*

     🚨 `loaded` se ponía a `true` una sola vez y **no volvía a bajar nunca**. Al
     cerrar sesión y entrar con otra cuenta, `if (!loaded)` ya no paraba nada, así
     que la aplicación se pintaba **con los datos del usuario anterior** hasta que
     Supabase contestaba. En un móvil compartido eso es ver lo de otro.

     ⚠️ Va por el **id del usuario**, no por el objeto `session`: Supabase lo
     renueva solo cada hora, y con `[session]` la pantalla de carga aparecería
     sola en mitad del día. */
  useEffect(() => {
    setLoaded(false);
    if (!session) {
      // Y de paso, fuera de memoria lo más privado.
      setEstiloHombre(DEFAULT_ESTILO_HOMBRE);
      setRelacion(DEFAULT_RELACION);
      setDiario(DEFAULT_DIARIO);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      const uidUser = session.user.id;
      const [a, p, s, c, f, e, sal, sf, nut, cv, est, neg, prod, obj, cal, dia, bib, bibArch, rel, feData, bien, pers, notif, hcol, tp, temGuard, h, pap, arm, rach, gam, aud, hor, eh] = await Promise.all([
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
        loadData(uidUser, 'calendario', DEFAULT_CALENDARIO),
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
        loadData(uidUser, 'papelera', DEFAULT_PAPELERA),
        loadData(uidUser, 'armario', DEFAULT_ARMARIO),
        // RA Fase 2 — las rachas viven en `app_data`, la misma tabla por usuario que
        // todo lo demás. Sin tabla nueva y sin SQL que Josué tenga que ejecutar: las
        // políticas RLS de `app_data` ya garantizan el aislamiento del apartado 5.
        loadData(uidUser, 'rachas', ESTADO_INICIAL),
        loadData(uidUser, 'gamificacionRachas', GAMIFICACION_INICIAL),
        loadData(uidUser, 'audio', DEFAULT_AUDIO),
        loadData(uidUser, 'horarioTop', DEFAULT_HORARIO_TOP),
        loadData(uidUser, 'estiloHombre', DEFAULT_ESTILO_HOMBRE),
      ]);
      if (cancelled) return;
      setAccent(a.accent || ACCENTS[0].value);
      // Fase de Seguridad Centralizada — migración desde el sistema antiguo (apartado 11 de la
      // especificación, obligatorio y en este orden): (1) partimos de lo que ya hubiera en
      // `seguridad` (bloqueoAutomatico/biometría, sin tocar); (2) si existía un PIN en texto
      // plano (`a.pin`, Fase A5 y anteriores) y todavía no hay `pinHash`, se hashea una sola vez
      // — el texto plano se descarta en el guardado de abajo y no vuelve a escribirse nunca más;
      // (3) si `personalizacion.pinExtra` (Fase 19) tenía secciones protegidas y esta cuenta
      // todavía no pasó por esta migración, se vuelcan en `protectedAreas` (unión, 'relacion'
      // sigue aparte, siempre protegida, igual que antes); (4) 'fotos_privadas' se activa sola en
      // `protectedActions` la primera vez, porque HealthView ya protegía esa pestaña siempre, sin
      // opción, desde antes de esta fase — así nadie pierde protección que ya tenía. Las banderas
      // `migradoAreas`/`migradoAcciones` aseguran que esto pase una única vez: si más adelante
      // Josué desprotege algo a mano, un recargado no debe "resucitarlo" releyendo `pinExtra`.
      let seguridadCargada = { ...DEFAULT_SEGURIDAD, ...(a.seguridad || {}) };
      let migracionPendiente = false;
      if (!seguridadCargada.pinHash && a.pin) {
        const { pinHash, pinSalt } = await crearPinHash(a.pin);
        seguridadCargada = { ...seguridadCargada, pinHash, pinSalt };
        migracionPendiente = true;
      }
      if (!seguridadCargada.migradoAreas) {
        const pinExtraAntiguo = Array.isArray(pers?.pinExtra) ? pers.pinExtra : [];
        const areasIniciales = Array.from(new Set([...(seguridadCargada.protectedAreas || []), ...pinExtraAntiguo.filter((id) => id !== 'relacion')]));
        seguridadCargada = { ...seguridadCargada, protectedAreas: areasIniciales, migradoAreas: true };
        migracionPendiente = true;
      }
      if (!seguridadCargada.migradoAcciones) {
        seguridadCargada = {
          ...seguridadCargada,
          protectedActions: Array.from(new Set([...(seguridadCargada.protectedActions || []), 'fotos_privadas'])),
          migradoAcciones: true,
        };
        migracionPendiente = true;
      }
      setSeguridad(seguridadCargada);
      if (migracionPendiente) {
        // Persiste la migración y descarta el PIN en texto plano de una vez por todas (`pin:
        // null`) — de aquí en adelante `ajustes.pin` no vuelve a usarse en ningún guardado.
        saveData(uidUser, 'ajustes', {
          accent: a.accent || ACCENTS[0].value, pin: null,
          apariencia: { ...DEFAULT_APARIENCIA, ...(a.apariencia || {}) },
          seguridad: seguridadCargada,
        });
      }
      // Fase A3: merge con DEFAULT_APARIENCIA, mismo motivo que el merge de perfil de la Fase A2 —
      // un registro `ajustes` guardado antes de esta fase no tiene la clave `apariencia` todavía.
      //
      // FO Fase 1 — el merge de arriba es SUPERFICIAL, así que un `fondo` guardado por una versión
      // anterior sustituiría al valor por defecto entero y llegaría sin los campos nuevos. Por eso
      // pasa además por `normalizarFondo`, que repone lo que falte sin pisar lo que sí había y
      // acota los números al rango en que significan algo.
      setApariencia(conFondoNormalizado({ ...DEFAULT_APARIENCIA, ...(a.apariencia || {}) }));
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
      // Fase 1 del Calendario Universal: solo nos aseguramos de que `eventos` sea de verdad un
      // array (mismo criterio que `temasGuardados`), por si `calendario` no existe todavía en
      // Supabase para un usuario que ya tenía cuenta antes de esta fase.
      setCalendario({ ...DEFAULT_CALENDARIO, ...cal, eventos: Array.isArray(cal?.eventos) ? cal.eventos : [] });
      setDiario(dia);
      setBiblioteca(bib);
      setBibliotecaArchivos(bibArch);
      setRelacion(rel);
      setFe(feData);
      setBienestar(bien);
      // Ampliación del Dashboard — Centro de Control: `personalizacion` nunca se fusionaba con su
      // valor por defecto (a diferencia de notificaciones/historialColor/temaPersonalizado, que sí
      // lo hacen) — un registro guardado antes de esta fase se habría quedado con
      // `dashboardOcultos` en `undefined`. Corrección de compatibilidad hacia atrás hecha a la vez,
      // mismo criterio que el resto de fases: merge con el default, nunca sobrescribir sin más.
      setPersonalizacion({ ...DEFAULT_PERSONALIZACION, ...pers });
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
      // Entrega 2 · ME Fase 3 — la retención se aplica al abrir la app: lo que haya vencido se
      // borra definitivamente aquí, una sola vez, y solo se escribe si de verdad cambió algo.
      const papeleraCargada = purgarCaducados({ ...DEFAULT_PAPELERA, ...(pap || {}) }, new Date().toISOString());
      setPapelera(papeleraCargada);
      if (pap && papeleraCargada.elementos.length !== (pap.elementos || []).length) {
        saveData(uidUser, 'papelera', papeleraCargada);
      }
      // Entrega 2 · AR Fase 1 — fusión con el valor por defecto obligatoria (regla 5): `loadData`
      // no fusiona, así que sin esto un armario guardado antes de que existieran `outfits` y
      // `usos` llegaría con esos campos en `undefined` y las fases 2 y 3 reventarían al leerlos.
      setArmario({ ...DEFAULT_ARMARIO, ...(arm || {}) });
      // RA Fase 2 — `normalizarEstado` hace de fusión con el default (regla 5) y a la
      // vez de saneado: un estado restaurado de una copia vieja con contadores
      // pegados o cumplimientos huérfanos entra limpio.
      setRachas(normalizarEstado(rach));
      setGamificacion(normalizarGamificacion(gam));
      setAudio(normalizarAudio(aud));
      setHorarioTop(normalizarHorarioTop(hor));
      setEstiloHombre(normalizarEstiloHombre(eh));
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

  // FO Fase 1 — el fondo se resuelve AQUÍ, en el mismo sitio y el mismo momento que el tema, y
  // justo DESPUÉS de `aplicarTema`: los fondos incluidos se pintan con los tokens ya resueltos,
  // así que tienen que leer `COLORS` con el tema y el acento de este render, no los del anterior.
  //
  // Es el "componente centralizado" del apartado 11: una sola resolución para toda la app, y
  // ninguna pantalla gestiona su propio fondo. Va antes de los `return` condicionales por la
  // regla 4 del proyecto (ya se produjo aquí el error "Rendered more hooks than during the
  // previous render"), aunque esto no sea un Hook: mantener junto todo lo que decide la
  // apariencia evita que la pantalla de carga y la de login queden fuera del sistema.
  //
  // FO Fase 2 — la URL firmada de la fotografía. Mientras se está firmando es null, y
  // `resolverFondo` ya sabe qué hacer con eso: baja al fondo incluido en vez de dejar un
  // hueco (apartado 6). Eso además da la transición suave que pide el apartado 16 — nunca
  // se ve la pantalla sin fondo mientras carga la imagen.
  const fondoResuelto = resolverFondo(apariencia.fondo, { urlFoto: urlFotoFondo });
  const estiloFondo = estilosDeFondo(fondoResuelto, COLORS);
  // FO Fase 3 — tres capas, en este orden: la foto, la luz (oscurecer/aclarar) y el
  // overlay de color. Ninguna se mezcla con otra: "oscurecer la foto" no debe
  // oscurecer el overlay, y el overlay no debe desenfocarse con la foto.
  const estiloLuz = estilosDeLuminosidad(fondoResuelto);
  const estiloVelo = estilosDeVelo(fondoResuelto, COLORS);

  // Firma la foto de fondo cuando cambia la ruta, y solo entonces. La URL dura una hora,
  // igual que las de Salud y Armario. `cancelado` evita escribir el resultado de una firma
  // que ya no interesa si Josué cambia de foto mientras la anterior seguía en vuelo — sin
  // eso, la respuesta lenta de la foto vieja pisaría a la nueva.
  const rutaFotoFondo = apariencia.fondo?.foto?.path || '';
  useEffect(() => {
    if (!rutaFotoFondo) { setUrlFotoFondo(null); return undefined; }
    // FO Fase 11 — si ya hay una firma válida en caché se usa SIN esperar: así al
    // volver a Ajustes el fondo aparece al instante en vez de parpadear mientras se
    // pide otra firma para la misma foto. Las firmas duran una hora.
    const yaFirmada = urlEnCache(rutaFotoFondo);
    if (yaFirmada) { setUrlFotoFondo(yaFirmada); return undefined; }
    let cancelado = false;
    firmarFotoFondo(rutaFotoFondo).then((url) => { if (!cancelado) setUrlFotoFondo(url); });
    return () => { cancelado = true; };
  }, [rutaFotoFondo]);

  /* SO Fase 1 — el motor de audio. Se arranca una vez y se suelta al desmontar:
     el enganche del primer gesto (iOS) dejaría oyentes pegados al documento si
     nadie los quitara. Aquí NO se crea el contexto de audio: eso espera al primer
     toque, que es lo que exige Safari, y por eso el motor es el único que lo toca.
     (La regla invariante 10 falla si esta palabra aparece fuera de él, aunque sea
     en un comentario: así no se puede colar por descuido.) */
  useEffect(() => {
    const soltar = iniciarAudio({ prefs: audio });
    const desconectar = conectarAlBus();
    return () => { soltar?.(); desconectar?.(); detenerAudio(); };
    // Solo al montar: cambiar el volumen no puede reiniciar el motor ni volver a
    // pedir permiso. Las preferencias entran por el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { actualizarAudio(audio); }, [audio]);

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
    document.documentElement.dataset.densidad = apariencia.densidad;
    document.documentElement.dataset.animaciones = apariencia.animaciones;
    document.documentElement.dataset.reducirMovimiento = String(apariencia.reducirMovimiento);
  }, [apariencia.tamanoTexto, apariencia.radioBorde, apariencia.densidad, apariencia.animaciones, apariencia.reducirMovimiento]);

  // Fase A5 — Bloqueo automático (apartado 146): sin PIN no hay nada que auto-bloquear; con
  // "nunca" (por defecto) tampoco se arma ningún temporizador. Reinicia el temporizador con
  // cualquier interacción — mismo criterio que un móvil real. Fase de Seguridad Centralizada:
  // ahora se arma con `seguridad.pinHash` (nunca hubo PIN en claro que consultar) — mismo criterio
  // exacto que antes, ni un comportamiento nuevo, solo la fuente de verdad correcta (apartado 7:
  // "si ya existe bloqueo automático, intégralo, no dupliques sistemas").
  useEffect(() => {
    const opcion = OPCIONES_BLOQUEO_AUTOMATICO.find((o) => o.value === seguridad.bloqueoAutomatico);
    if (!seguridad.pinHash || !opcion || opcion.ms === null) return;
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
  }, [seguridad.pinHash, seguridad.bloqueoAutomatico]);

  // "Inmediatamente" además bloquea en cuanto la pestaña/app pasa a segundo plano, no solo tras
  // el margen corto de inactividad de arriba — más fiel al apartado 146 ("Inmediatamente").
  useEffect(() => {
    if (!seguridad.pinHash || seguridad.bloqueoAutomatico !== 'inmediato') return;
    const onVisibility = () => { if (document.hidden) setBloqueado(true); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [seguridad.pinHash, seguridad.bloqueoAutomatico]);

  // Fase de Seguridad Centralizada (apartado 7 — integrar con el bloqueo existente, no duplicar):
  // en cuanto el bloqueo automático de arriba salta, se limpian también todas las sesiones
  // temporales de sección/función (apartado 6) — volver a entrar en cualquier zona protegida tras
  // un bloqueo pide el PIN de nuevo, sin excepción.
  useEffect(() => {
    if (bloqueado) setDesbloqueosPin({});
  }, [bloqueado]);

  // Recuperación de PIN — escucha el evento 'PASSWORD_RECOVERY' que Supabase dispara al abrir,
  // desde este dispositivo, el enlace del correo de recuperación (ver sendPasswordReset más abajo
  // y RecuperarPinModal). Solo entonces se deja crear un PIN nuevo: la identidad ya quedó
  // verificada por el propio mecanismo de Supabase, no por haber escrito un correo cualquiera.
  useEffect(() => {
    const unsub = onAuthEvent((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecuperandoPin(false);
        setFlujoNuevoPin('recuperacion');
      }
    });
    return unsub;
  }, []);

  /* =========================================================================
     ⚠️ REGLA 4 — TODOS LOS HOOKS, ANTES DE LOS `return` CONDICIONALES
     =========================================================================
     Estos cinco hooks estaban MÁS ABAJO, después de los tres `return` de aquí
     debajo. El efecto: en el primer render `session` es `undefined`, se salía
     por `<LoadingScreen />` y esos hooks NO se ejecutaban; en cuanto llegaba la
     sesión, React encontraba cinco hooks más que la vez anterior y lanzaba
     **"Rendered more hooks than during the previous render"**, que TUMBA LA
     APLICACIÓN ENTERA.

     Es literalmente la regla 4 del proyecto —*"en App.jsx, todos los useEffect
     van ANTES de los return condicionales"*—, que ya se había roto una vez y
     volvió a romperse. Lo encontró abrir la aplicación en un navegador de
     verdad: ni el build ni las pruebas de renderizado podían verlo, porque
     `App.jsx` no se renderizaba en ninguna prueba.

     Las funciones auxiliares que los usan (`irAResultado`, `recordarBusqueda`,
     `focoPara`…) siguen abajo: no son hooks y da igual dónde estén. */

  // BI Fase 4 · apartado 11 — el rastro de "vuelve a donde estabas" solo vale para el
  // módulo al que llevó el buscador. En cuanto Josué navega a cualquier otro sitio se
  // borra, para que no reaparezca días después si vuelve a ese módulo por la barra de
  // abajo. Un único efecto cubre TODAS las formas de navegar.
  useEffect(() => {
    setVueltaBusqueda((v) => (v && v.hacia !== tab ? null : v));
  }, [tab]);

  // BI Fase 2 — el índice del buscador se construye a partir de MORE_NAV, así que un
  // módulo que una fase futura añada ahí aparece solo (apartado 17). Se recalcula cuando
  // cambia lo que Josué ha apagado: lo desactivado no debe poder encontrarse (D2-07).
  const indiceBusqueda = useMemo(
    () => construirIndice(MORE_NAV, { modulosDesactivados: personalizacion.ocultos }),
    [personalizacion.ocultos],
  );

  // BI Fase 3 · apartado 16 — accesos recientes del buscador. Se guardan los IDS de las
  // funciones abiertas, nunca el texto que escribió; y en `localStorage`, no en
  // `app_data`, porque el apartado lo pide y porque no merece sincronizarse.
  const [recientesBusqueda, setRecientesBusqueda] = useState(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem('josstyle:busquedas-recientes') || '[]');
      return Array.isArray(guardado) ? guardado.slice(0, MAX_RECIENTES_BUSQUEDA) : [];
    } catch { return []; }
  });

  // Se resuelven contra el índice ACTUAL, así que un reciente cuyo módulo se haya
  // desactivado después desaparece solo, sin necesidad de limpiar nada.
  const entradasRecientes = useMemo(
    () => recientesBusqueda.map((id) => indiceBusqueda.find((e) => e.id === id)).filter(Boolean),
    [recientesBusqueda, indiceBusqueda],
  );

  // RA Fase 4 · apartado 31 — el resumen de Rachas recorre historiales día a día, así que
  // esto va memoizado. El resto son sumas baratas sobre datos que ya están en memoria.
  const resumenesTodos = useMemo(() => Object.fromEntries(
    MORE_NAV.map((m) => [m.id, calcularResumenModulo(m.id, { sueno, calistenia, futbol, economia, salud, nutricion, estudios, negocio, productividad, objetivos, calendario, diario, biblioteca, bibliotecaArchivos, relacion, fe, bienestar, rachas, horarioTop })])
  ), [sueno, calistenia, futbol, economia, salud, nutricion, estudios, negocio, productividad, objetivos, calendario, diario, biblioteca, bibliotecaArchivos, relacion, fe, bienestar, rachas, horarioTop]);

  if (session === undefined) return <LoadingScreen />;
  if (!session) return <Auth />;
  if (!loaded) return <LoadingScreen />;

  const uidUser = session.user.id;

  // Fase A3/A5: `saveData` sobrescribe el valor entero de la clave 'ajustes' (upsert, no fusiona)
  // — las funciones deben mandar siempre el paquete completo (accent + apariencia + seguridad) o
  // se perderían entre sí. `pin: null` se manda siempre a partir de ahora — el campo en claro
  // queda descartado para siempre desde la migración de carga, más arriba.
  const updateAccent = async (color) => { setAccent(color); await saveData(uidUser, 'ajustes', { accent: color, pin: null, apariencia, seguridad }); };
  const updateApariencia = async (next) => { setApariencia(next); await saveData(uidUser, 'ajustes', { accent, pin: null, apariencia: next, seguridad }); };
  const updateSeguridad = async (next) => { setSeguridad(next); await saveData(uidUser, 'ajustes', { accent, pin: null, apariencia, seguridad: next }); };
  const updatePerfil = async (next) => { setPerfil(next); await saveData(uidUser, 'perfil', next); };

  // ---------- Ampliación del Dashboard — Centro de Control ----------
  // Única función de navegación con deep-link de toda la app (apartado 5: "utiliza la
  // arquitectura existente... no quiero un sistema de routing paralelo") — por dentro es
  // `setTab`, ni más ni menos; `foco` es opcional y solo lo usan los módulos que ya saben
  // interpretarlo (ver cada vista). Sin segundo argumento se comporta exactamente igual que
  // pulsar la pestaña correspondiente en la barra inferior.
  const navegarDesdeHoy = (modulo, foco) => {
    setDashboardFoco(foco ? { modulo, ...foco } : null);
    setTab(modulo);
  };
  const consumirFoco = () => setDashboardFoco(null);

  // BI Fase 4 · apartado 11 — el rastro de "vuelve a donde estabas" solo vale para el
  // módulo al que llevó el buscador. En cuanto Josué navega a cualquier otro sitio se
  // borra, para que no reaparezca días después si vuelve a ese módulo por la barra de
  // abajo. Un único efecto cubre TODAS las formas de navegar; ponerlo en cada botón
  // habría dejado fuera la que se añada mañana.

  // ---------- Entrega 2 · BI Fase 2 — buscador de funciones ----------
  // El índice se construye a partir de MORE_NAV, así que un módulo que una fase futura añada
  // ahí aparece solo en el buscador (apartado 17). Se recalcula cuando cambia la lista de
  // módulos desactivados: lo que Josué ha apagado no debe poder encontrarse (decisión D2-07 —
  // Inicio, Buscador y Módulos son un solo sistema, no tres).
  // Apartado 12: pulsar un resultado abre el sitio exacto, no la lista de Ajustes para que lo
  // busque él. Reutiliza el mismo `navegarDesdeHoy` del deep-link del Dashboard — ni un sistema
  // de navegación nuevo (apartado 16 y regla 10).
  //
  // BI Fase 3 · apartado 11 — tres tipos de destino, un solo camino: una pantalla no lleva foco,
  // un ajuste lleva su categoría, y una acción lleva el foco que abre el formulario. El `foco` de
  // las acciones sale del propio índice, que copia el de las acciones rápidas del Dashboard.
  const irAResultado = (entrada) => {
    if (!entrada) return;
    const foco = entrada.foco || (entrada.ajuste ? { categoria: entrada.ajuste } : undefined);
    // BI Fase 4 · apartado 11 — "al volver, regresar al punto lógico anterior". Sin esto,
    // buscar "colores" desde Inicio y pulsar atrás dejaba a Josué en el hub de "Más",
    // que no es de donde venía. Se recuerda de dónde salió y adónde fue; en cuanto
    // navegue a cualquier otro sitio, el rastro se borra solo (ver `renderConVuelta`).
    if (entrada.tab !== tab) setVueltaBusqueda({ desde: tab, hacia: entrada.tab });
    navegarDesdeHoy(entrada.tab, foco);
  };

  // BI Fase 3 · apartado 16 — accesos recientes del buscador.
  //
  // Se guardan los IDS de las funciones abiertas, nunca el texto que Josué escribió: un
  // historial de búsquedas podría acabar guardando una pregunta personal ("por qué me
  // encuentro mal"), y eso no tiene por qué quedarse en ninguna parte.
  //
  // Y viven en `localStorage`, NO en `app_data`: el apartado lo pide explícitamente
  // ("guardarlo localmente si corresponde, no enviarlo innecesariamente al servidor"), y
  // además no es un dato de Josué que merezca sincronizarse entre dispositivos ni entrar
  // en la copia de seguridad. Si el navegador lo borra, no se pierde nada que importe.
  const guardarRecientes = (ids) => {
    setRecientesBusqueda(ids);
    try { localStorage.setItem('josstyle:busquedas-recientes', JSON.stringify(ids)); } catch { /* modo privado */ }
  };
  const recordarBusqueda = (entrada) => {
    if (!entrada) return;
    guardarRecientes([entrada.id, ...recientesBusqueda.filter((x) => x !== entrada.id)].slice(0, MAX_RECIENTES_BUSQUEDA));
  };
  // Se resuelven contra el índice ACTUAL, así que un reciente cuyo módulo se haya
  // desactivado después desaparece solo, sin necesidad de limpiar nada.
  // Cada vista de destino solo necesita saber si el foco pendiente es "el suyo" — así ninguna
  // vista tiene que conocer la forma de `dashboardFoco` de las demás.
  const focoPara = (modulo) => (dashboardFoco && dashboardFoco.modulo === modulo ? dashboardFoco : null);

  // ---------- Fase de Seguridad Centralizada ----------
  // Único sistema de autenticación que controla todas las zonas protegidas (apartado 8/9 de la
  // especificación) — todo lo demás (PinGate por sección, HealthView por acción, Personalización,
  // Seguridad) llama a estas mismas funciones, nunca reimplementa su propia comprobación.

  // "Pide el PIN actual antes de..." — el único punto por el que pasan las tres acciones críticas
  // del apartado 3: cambiar el PIN, desactivarlo, o quitar protección a una sección/función. Si
  // todavía no hay PIN configurado no hay nada que verificar — `onExito` se llama directo (p. ej.
  // proteger una sección por primera vez nunca necesita el PIN, solo quitarle protección).
  const pedirVerificacionPin = (motivo, onExito) => {
    if (!seguridad.pinHash) { onExito(); return; }
    setVerificacion({ motivo, onSuccess: () => { setVerificacion(null); onExito(); } });
  };

  // Crea el hash+salt nuevos (src/lib/pin.js) y los guarda — nunca el PIN en claro. Se llama tras
  // el paso de verificación (cambio) o directamente (primera vez / recuperación por correo).
  const cambiarPin = async (nuevoPin) => {
    const { pinHash, pinSalt } = await crearPinHash(nuevoPin);
    const next = { ...seguridad, pinHash, pinSalt };
    setSeguridad(next);
    await saveData(uidUser, 'ajustes', { accent, pin: null, apariencia, seguridad: next });
    setFlujoNuevoPin(null);
  };

  // Apartado 145 (ya existente): el PIN es el respaldo obligatorio de la biometría, así que
  // desactivar el PIN desactiva también la biometría en el mismo guardado. Al no quedar PIN,
  // tampoco tiene sentido mantener zonas/funciones "protegidas" sin nada que las proteja — se
  // limpian también `protectedAreas`/`protectedActions` (apartado 4: sin esto, la app se quedaría
  // con secciones marcadas como protegidas mostrando el aviso de "crea un PIN" para siempre).
  const desactivarPin = async () => {
    const next = { ...seguridad, pinHash: null, pinSalt: null, protectedAreas: [], protectedActions: [], biometriaActiva: false, biometriaCredencialId: null };
    setSeguridad(next);
    setDesbloqueosPin({});
    await saveData(uidUser, 'ajustes', { accent, pin: null, apariencia, seguridad: next });
  };

  const iniciarCreacionPin = () => setFlujoNuevoPin('primero');
  const iniciarCambioPin = () => pedirVerificacionPin('Confirma tu PIN actual para cambiarlo.', () => setFlujoNuevoPin('cambio'));
  const iniciarDesactivarPin = () => pedirVerificacionPin('Confirma tu PIN para desactivarlo. Se perderá la protección de todas las secciones y funciones.', desactivarPin);

  // Apartado 1/2/3/9 — añadir protección nunca pide PIN (subir la seguridad no es una acción de
  // riesgo); quitarla siempre pasa por `pedirVerificacionPin`, "especialmente cuando la
  // modificación reduzca la protección". Estas dos funciones son el único sitio que toca
  // `protectedAreas`/`protectedActions` — tanto la nueva sección de Seguridad como el toggle ya
  // existente en Personalización llaman aquí (ver App.jsx más abajo y SettingsView.jsx).
  const toggleAreaProtegida = (id) => {
    const protegidaAhora = seguridad.protectedAreas.includes(id);
    if (protegidaAhora) {
      pedirVerificacionPin(`Vas a quitar la protección PIN de "${(AREAS_PROTEGIBLES.find((a) => a.id === id) || {}).label || id}".`, () => {
        updateSeguridad({ ...seguridad, protectedAreas: seguridad.protectedAreas.filter((x) => x !== id) });
      });
    } else {
      updateSeguridad({ ...seguridad, protectedAreas: [...seguridad.protectedAreas, id] });
    }
  };
  const toggleAccionProtegida = (id) => {
    const protegidaAhora = seguridad.protectedActions.includes(id);
    if (protegidaAhora) {
      pedirVerificacionPin(`Vas a quitar la protección PIN de "${(ACCIONES_PROTEGIBLES.find((a) => a.id === id) || {}).label || id}".`, () => {
        updateSeguridad({ ...seguridad, protectedActions: seguridad.protectedActions.filter((x) => x !== id) });
      });
    } else {
      updateSeguridad({ ...seguridad, protectedActions: [...seguridad.protectedActions, id] });
    }
  };

  // Sesión temporal de desbloqueo (apartado 6): tras acertar el PIN una vez, la sección/función
  // queda desbloqueada `seguridad.sessionTimeoutMin` minutos, en memoria — nunca en Supabase, para
  // que cerrar/reabrir la app la vuelva a pedir sola (apartado 7/8 de las comprobaciones). Con
  // sessionTimeoutMin=0 ("pedir siempre") no se registra nada: el PinGate se queda desbloqueado
  // mientras la pantalla siga montada (no re-pregunta a media visita) pero vuelve a pedirlo la
  // siguiente vez que se entre en la sección.
  const registrarDesbloqueo = (key) => {
    const minutos = seguridad.sessionTimeoutMin ?? 5;
    if (minutos <= 0) return;
    setDesbloqueosPin((prev) => ({ ...prev, [key]: Date.now() + minutos * 60000 }));
  };
  const estaDesbloqueado = (key) => !!desbloqueosPin[key] && desbloqueosPin[key] > Date.now();

  // Recuperación de PIN (apartado añadido a la especificación) — nunca se pide ni se guarda la
  // contraseña del correo: `sendPasswordReset` usa el flujo propio de Supabase, y solo tras el
  // evento 'PASSWORD_RECOVERY' (ver el useEffect de arriba) se deja crear un PIN nuevo.
  const enviarRecuperacionPin = (email) => sendPasswordReset(email, window.location.origin);
  const guardarPinTrasFlujo = async (nuevoPin) => {
    await cambiarPin(nuevoPin);
    // Tras cambiar el PIN (creación, cambio normal o recuperación) no tiene sentido dejar la app
    // bloqueada pidiendo el PIN que se acaba de teclear un segundo antes.
    setBloqueado(false);
  };

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
    await saveData(uidUser, 'ajustes', { accent: accentHex, pin: null, apariencia: aparienciaSiguiente, seguridad });
    await saveData(uidUser, 'temaPersonalizado', tpFinal);
  };

  // Aplica la paleta predefinida marcada `esOficial` (el azul metálico original de la app) —
  // sirve como "Restablecer al tema oficial" desde la gestión de temas.
  const restablecerTemaOficial = () => {
    const oficial = PALETAS_PREDEFINIDAS.find((p) => p.esOficial) || PALETAS_PREDEFINIDAS[0];
    aplicarConjuntoTema(oficial);
  };

  // ---------- FO Fase 8 — presets de apariencia ----------
  // Se reutiliza `temasGuardados` (fase V4) tal cual: misma clave de Supabase, mismo
  // estado, mismo límite. Lo único que cambia es QUÉ se guarda dentro — ahora también
  // el fondo (apartado 2). Crear un segundo almacén de presets al lado habría dejado
  // dos listas de apariencias guardadas en Ajustes, que es exactamente lo que la regla
  // de "no duplicar sistemas" evita.
  const guardarPreset = (preset) => {
    if (!preset || temasGuardados.length >= MAX_TEMAS_GUARDADOS) return;
    const siguiente = [...temasGuardados, preset];
    setTemasGuardados(siguiente);
    saveData(uidUser, 'temasGuardados', siguiente);
  };
  const cambiarPresets = (lista) => {
    setTemasGuardados(lista);
    saveData(uidUser, 'temasGuardados', lista);
  };
  // FO Fase 12 — borrar una apariencia guardada va por la papelera, no se pierde.
  // Antes se filtraba la lista directamente y desaparecía para siempre: una
  // apariencia que costó configurar es exactamente lo que la filosofía del apartado
  // 1 quiere proteger ("nada importante debería desaparecer accidentalmente").
  const eliminarPreset = (id) => eliminarConPapelera('temasGuardados', null, id);
  // Aplicar toca CUATRO cosas a la vez: tema, acento, colores y fondo.
  //
  // Y por eso NO se encadenan `updateAccent` + `updateTemaPersonalizado` +
  // `updateApariencia`: es exactamente el fallo que documenta `aplicarConjuntoTema`
  // justo aquí arriba. Cada una guarda el paquete 'ajustes' entero leyendo el resto
  // de campos del closure, y dos llamadas seguidas en la misma función no ven el
  // `setState` de la anterior (React no re-renderiza a mitad de una función), así
  // que la segunda pisaría a la primera con un valor viejo. Al aplicar un preset se
  // habrían perdido el fondo o el tema sin dar ningún error.
  //
  // Se construye el payload a mano con los valores nuevos explícitos, igual que
  // hace `aplicarConjuntoTema`.
  const aplicarPresetCompleto = async (cambios) => {
    if (!cambios) return;
    const accentFinal = cambios.accent || accent;
    const aparienciaSiguiente = { ...apariencia, tema: cambios.tema, fondo: cambios.fondo };
    setAccent(accentFinal);
    setApariencia(aparienciaSiguiente);
    setTemaPersonalizado(cambios.temaPersonalizado);
    await saveData(uidUser, 'ajustes', { accent: accentFinal, pin: null, apariencia: aparienciaSiguiente, seguridad });
    await saveData(uidUser, 'temaPersonalizado', cambios.temaPersonalizado);
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
    calendario: { label: 'Calendario', default: DEFAULT_CALENDARIO, setter: setCalendario },
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
  // Entrega 2 · ME Fase 2 — "Mi pantalla de inicio". `dashboardOcultos` responde a una pregunta
  // distinta de `ocultos`: "sí uso este apartado, pero no quiero verlo nada más abrir la app"
  // (la especificación es explícita: "Módulo activado ≠ necesariamente visible en Dashboard").
  const toggleDashboardModulo = (id) => {
    const actual = personalizacion.dashboardOcultos || [];
    const dashboardOcultos = actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id];
    updatePersonalizacion({ ...personalizacion, dashboardOcultos });
  };

  // Entrega 2 · ME Fase 2 — Perfiles rápidos. Un punto de partida, nunca una jaula: aplica el
  // conjunto de activos del perfil y ya está. No se guarda "qué perfil tienes puesto" porque en
  // cuanto Josué cambie un interruptor esa etiqueta sería mentira.
  //
  // Solo toca `ocultos`: el orden, los iconos, el PIN y las métricas favoritas se respetan tal y
  // como los tuviera. Un perfil decide QUÉ usas, no cómo lo tienes colocado.
  const aplicarPerfilModulos = (perfilId) => {
    const perfil = PERFILES_MODULOS.find((p) => p.id === perfilId);
    if (!perfil) return;
    const personalizables = MORE_NAV.filter((m) => m.id !== 'ajustes').map((m) => m.id);
    const ocultos = perfil.activos === null
      ? []
      : personalizables.filter((id) => !perfil.activos.includes(id));
    updatePersonalizacion({ ...personalizacion, ocultos });
    // Si el perfil acaba de desactivar la pestaña abierta, volver a "Hoy" para no dejar a Josué
    // mirando una pantalla de un módulo que ya no está activo.
    if (ocultos.includes(tab)) setTab('hoy');
  };

  // ---------------------------------------------------------------------------
  // Entrega 2 · ME Fase 3 — Papelera global.
  //
  // `eliminarConPapelera` sustituye al `snapshotAndSave({ X: { ...X, lista: lista.filter(...) } })`
  // que repetían los 22 handlers de borrado. Es una sola función porque todos seguían
  // exactamente el mismo patrón: módulo + colección + id. Añadir un módulo futuro a la
  // papelera es añadirlo a CATALOGO_PAPELERA — aquí no hay que tocar nada.
  // ---------------------------------------------------------------------------
  const MODULOS_PAPELERA = {
    sueno: [sueno, setSueno], futbol: [futbol, setFutbol], economia: [economia, setEconomia],
    salud: [salud, setSalud], nutricion: [nutricion, setNutricion], estudios: [estudios, setEstudios],
    negocio: [negocio, setNegocio], productividad: [productividad, setProductividad],
    objetivos: [objetivos, setObjetivos], calendario: [calendario, setCalendario],
    diario: [diario, setDiario], biblioteca: [biblioteca, setBiblioteca],
    relacion: [relacion, setRelacion], fe: [fe, setFe], bienestar: [bienestar, setBienestar],
    armario: [armario, setArmario],
    // FO Fase 12 — las apariencias guardadas entran en la papelera universal. Es una
    // lista plana, como `sueno` o `futbol`; el motor de ME F3 ya lo soportaba.
    temasGuardados: [temasGuardados, setTemasGuardados],
  };

  /* EH F15, apartado 13 — *"si JC Fitness ya tiene Eliminados recientemente,
     utilizar ese sistema en lugar de crear otro"*. Los registros de piel viven
     dentro de la `config` de Skincare, así que su lista no está en el primer
     nivel de un módulo y `MODULOS_PAPELERA` no los alcanza. Lo que se hace es
     pedirle al propio módulo el estado ya sin el registro **y la entrada de
     papelera**, y guardarlos juntos: ⚠️ la papelera sigue siendo UNA, con su
     retención, su recuperación y su pantalla. */
  const eliminarRegistroDePiel = (id) => {
    const r = eliminarRegistroPiel(estiloHombre, id);
    if (r.error) return;
    snapshotAndSave({
      estiloHombre: r.estado,
      papelera: { ...papelera, elementos: [...papelera.elementos, r.entrada] },
    });
  };

  /* ⚠️ EH F21, apartado 19 — igual que los de piel: las rutinas y los registros
     de barba viven dentro de la `config` de su módulo, así que `MODULOS_PAPELERA`
     no los alcanza. Se le pide al módulo el estado ya sin el elemento **y la
     entrada de papelera**, y se guardan juntos. La papelera sigue siendo UNA. */
  const eliminarDeBarba = (coleccion, id) => {
    const r = coleccion === 'rutinas'
      ? eliminarRutinaConPapelera(estiloHombre, id)
      : eliminarRegistroBarba(estiloHombre, id);
    if (r.error) return;
    snapshotAndSave({
      estiloHombre: r.estado,
      papelera: { ...papelera, elementos: [...papelera.elementos, r.entrada] },
    });
  };

  /* ⚠️ EH F23, apartado 16 — igual que barba y piel: viven dentro de la
     `config` de su módulo, así que van por su puerta y acaban en LA MISMA
     papelera, con su retención y su recuperación. */
  const eliminarDeSonrisa = (coleccion, id) => {
    const fn = { rutinas: eliminarRutinaSonrisa, revisiones: eliminarRevision, registros: eliminarRegistroSonrisa }[coleccion];
    if (!fn) return;
    const r = fn(estiloHombre, id);
    if (r.error) return;
    snapshotAndSave({
      estiloHombre: r.estado,
      papelera: { ...papelera, elementos: [...papelera.elementos, r.entrada] },
    });
  };

  const eliminarDePerfumes = (coleccion, id) => {
    const r = coleccion === 'perfumes' ? eliminarPerfume(estiloHombre, id) : eliminarUso(estiloHombre, id);
    if (r.error) return;
    snapshotAndSave({
      estiloHombre: r.estado,
      papelera: { ...papelera, elementos: [...papelera.elementos, r.entrada] },
    });
  };

  /* EH F26 — Accesorios. ⚠️ Borrar aquí quita el ENVOLTORIO de estilo: la
     prenda sigue en el Armario, y por eso esto no toca `armario`. */
  const eliminarDeAccesorios = (coleccion, id) => {
    const r = coleccion === 'accesorios'
      ? eliminarAccesorio(estiloHombre, id)
      : eliminarDeseoAccesorio(estiloHombre, id);
    if (r.error) return;
    snapshotAndSave({
      estiloHombre: r.estado,
      papelera: { ...papelera, elementos: [...papelera.elementos, r.entrada] },
    });
  };

  /* EH F27 — Mis gustos. ⚠️ Borrar saca el nombre TAMBIÉN del registro de la
     Fase 4, para que el perfil de estilo no siga diciendo que le gusta. */
  const eliminarDeGustos = (id) => {
    const r = eliminarGusto(estiloHombre, id);
    if (r.error) return;
    snapshotAndSave({
      estiloHombre: r.estado,
      papelera: { ...papelera, elementos: [...papelera.elementos, r.entrada] },
    });
  };

  /* ⚠️ EH F19, apartado 18 — las rutinas de Higiene y de Cuidado corporal viven
     dentro de la `config` de su módulo, como las de barba, así que entran por
     esta puerta y acaban en LA MISMA papelera. Son dos módulos (C-25), y por eso
     el módulo viaja como argumento en vez de estar escrito dentro. */
  const eliminarDeCuerpo = (modulo, id) => {
    const r = eliminarRutinaCuerpo(estiloHombre, modulo, id);
    if (r.error) return;
    snapshotAndSave({
      estiloHombre: r.estado,
      papelera: { ...papelera, elementos: [...papelera.elementos, r.entrada] },
    });
  };

  const eliminarConPapelera = (modulo, coleccion, id) => {
    // Los registros de piel no son una lista de primer nivel: van por su puerta.
    if (modulo === 'skincare' && coleccion === 'registros') return eliminarRegistroDePiel(id);
    if (modulo === 'barba') return eliminarDeBarba(coleccion, id);
    if (modulo === 'higiene' || modulo === 'cuerpo') return eliminarDeCuerpo(modulo, id);
    if (modulo === 'sonrisa') return eliminarDeSonrisa(coleccion, id);
    if (modulo === 'perfumes') return eliminarDePerfumes(coleccion, id);
    if (modulo === 'accesorios') return eliminarDeAccesorios(coleccion, id);
    if (modulo === 'gustos') return eliminarDeGustos(id);
    const entradaModulo = MODULOS_PAPELERA[modulo];
    if (!entradaModulo) return;
    const resultado = prepararEliminacion(entradaModulo[0], modulo, coleccion, id, new Date().toISOString());
    if (!resultado) return;
    // Un único snapshotAndSave con las dos cosas: el módulo sin el elemento y la papelera con él.
    // Así el deshacer de 10 pasos revierte ambas a la vez y nunca quedan desincronizadas.
    snapshotAndSave({
      [modulo]: resultado.moduloActualizado,
      papelera: { ...papelera, elementos: [...papelera.elementos, resultado.entrada] },
    });
  };

  const restaurarDePapelera = (entradaId) => {
    const entrada = papelera.elementos.find((e) => e.id === entradaId);
    if (!entrada) return;
    // EH F15 — y vuelven por la misma puerta, con el motor de ME F3 intacto.
    if (entrada.modulo === 'skincare' && entrada.coleccion === 'registros') {
      const r = restaurarRegistroPiel(estiloHombre, entrada);
      if (r.error) return;
      snapshotAndSave({
        estiloHombre: r.estado,
        papelera: { ...papelera, elementos: papelera.elementos.filter((e) => e.id !== entradaId) },
      });
      return;
    }
    // EH F24 — y Perfumes.
    if (entrada.modulo === 'perfumes') {
      const r = entrada.coleccion === 'perfumes'
        ? restaurarPerfume(estiloHombre, entrada)
        : restaurarUso(estiloHombre, entrada);
      if (r.error) return;
      snapshotAndSave({
        estiloHombre: r.estado,
        papelera: { ...papelera, elementos: papelera.elementos.filter((e) => e.id !== entradaId) },
      });
      return;
    }
    // EH F27 — y Mis gustos.
    if (entrada.modulo === 'gustos') {
      const r = restaurarGusto(estiloHombre, entrada);
      if (r.error) return;
      snapshotAndSave({
        estiloHombre: r.estado,
        papelera: { ...papelera, elementos: papelera.elementos.filter((e) => e.id !== entradaId) },
      });
      return;
    }
    // EH F26 — y Accesorios.
    if (entrada.modulo === 'accesorios') {
      const r = entrada.coleccion === 'accesorios'
        ? restaurarAccesorio(estiloHombre, entrada)
        : restaurarDeseoAccesorio(estiloHombre, entrada);
      if (r.error) return;
      snapshotAndSave({
        estiloHombre: r.estado,
        papelera: { ...papelera, elementos: papelera.elementos.filter((e) => e.id !== entradaId) },
      });
      return;
    }
    // EH F23 — y Sonrisa, por la misma puerta.
    if (entrada.modulo === 'sonrisa') {
      const fn = { rutinas: restaurarRutinaSonrisa, revisiones: restaurarRevision, registros: restaurarRegistroSonrisa }[entrada.coleccion];
      const r = fn ? fn(estiloHombre, entrada) : null;
      if (!r || r.error) return;
      snapshotAndSave({
        estiloHombre: r.estado,
        papelera: { ...papelera, elementos: papelera.elementos.filter((e) => e.id !== entradaId) },
      });
      return;
    }
    // EH F19 — y las de Higiene y Cuidado corporal, con su módulo por delante.
    if (entrada.modulo === 'higiene' || entrada.modulo === 'cuerpo') {
      const r = restaurarRutinaCuerpo(estiloHombre, entrada.modulo, entrada);
      if (r.error) return;
      snapshotAndSave({
        estiloHombre: r.estado,
        papelera: { ...papelera, elementos: papelera.elementos.filter((e) => e.id !== entradaId) },
      });
      return;
    }
    // EH F21 — y lo mismo para barba, por la misma puerta.
    if (entrada.modulo === 'barba') {
      const r = entrada.coleccion === 'rutinas'
        ? restaurarRutinaBarba(estiloHombre, entrada)
        : restaurarRegistroBarba(estiloHombre, entrada);
      if (r.error) return;
      snapshotAndSave({
        estiloHombre: r.estado,
        papelera: { ...papelera, elementos: papelera.elementos.filter((e) => e.id !== entradaId) },
      });
      return;
    }
    const entradaModulo = MODULOS_PAPELERA[entrada.modulo];
    if (!entradaModulo) return;
    const resultado = prepararRestauracion(entradaModulo[0], entrada);
    if (!resultado) return;
    // La entrada sale de la papelera tanto si se ha insertado como si el elemento ya había
    // vuelto por otra vía (un deshacer): en ambos casos deja de tener sentido tenerla ahí.
    snapshotAndSave({
      [entrada.modulo]: resultado.moduloActualizado,
      papelera: { ...papelera, elementos: papelera.elementos.filter((e) => e.id !== entradaId) },
    });
  };

  // Borrado definitivo y vaciado NO pasan por snapshotAndSave: meter en el histórico de deshacer
  // una acción cuyo sentido es "esto ya no se puede recuperar" sería contradictorio.
  const eliminarDefinitivo = (entradaId) => {
    const siguiente = { ...papelera, elementos: papelera.elementos.filter((e) => e.id !== entradaId) };
    setPapelera(siguiente);
    saveData(uidUser, 'papelera', siguiente);
  };

  const vaciarPapelera = () => {
    const siguiente = { ...papelera, elementos: [] };
    setPapelera(siguiente);
    saveData(uidUser, 'papelera', siguiente);
  };

  const setRetencionPapelera = (dias) => {
    // Al acortar la retención puede haber elementos que ya estén fuera de plazo: se purgan en el
    // momento, para que la lista que ve Josué coincida con la regla que acaba de elegir.
    const siguiente = purgarCaducados({ ...papelera, retencionDias: dias }, new Date().toISOString());
    setPapelera(siguiente);
    saveData(uidUser, 'papelera', siguiente);
  };

  // Entrega 2 · ME Fase 4 — borrados que faltaban. La auditoría de esta fase encontró seis
  // colecciones donde el usuario podía crear pero no borrar: registros de sueño, movimientos de
  // economía, medidas y entradas médicas de Salud, comidas, partidos de fútbol y horas de
  // estudio. Todos entran por la papelera, como el resto.
  const deleteRegistroSueno = (id) => eliminarConPapelera('sueno', null, id);
  const deletePartido = (id) => eliminarConPapelera('futbol', null, id);
  const deleteMovimiento = (id) => eliminarConPapelera('economia', 'movimientos', id);
  const deleteMedida = (id) => eliminarConPapelera('salud', 'medidas', id);
  const deleteHistorialMedico = (id) => eliminarConPapelera('salud', 'historial', id);
  const deleteComida = (id) => eliminarConPapelera('nutricion', 'comidas', id);
  const deleteHorasEstudio = (id) => eliminarConPapelera('estudios', 'horas', id);

  // ---------- Entrega 2 · AR Fase 1 — Armario ----------
  // `crearPrenda` y `actualizarPrenda` viven en lib/armario.js, no aquí: son puras y por
  // eso se pueden probar con Node sin montar React.
  const addPrenda = (datos) => snapshotAndSave({ armario: { ...armario, prendas: [...armario.prendas, crearPrenda(datos)] } });
  const updatePrenda = (id, cambios) => snapshotAndSave({
    armario: { ...armario, prendas: armario.prendas.map((p) => (p.id === id ? actualizarPrenda(p, cambios) : p)) },
  });
  // Va por la papelera como todo lo demás (ME Fase 3), pero con un matiz: la fotografía
  // vive en Storage y NO vuelve al restaurar, igual que las fotos de Salud y los vídeos de
  // Calistenia. Por eso se borra el fichero aquí y la vista pide confirmación cuando hay
  // foto — la única parte irreversible del borrado.
  const deletePrenda = (id) => {
    const prenda = armario.prendas.find((p) => p.id === id);
    if (prenda && prenda.fotoPath) deletePrendaFoto(prenda.fotoPath);
    eliminarConPapelera('armario', 'prendas', id);
  };
  const subirFotoPrenda = (file) => uploadPrendaFoto(uidUser, file);
  // FO Fase 2 — la foto de fondo, al bucket 'fondos'. Mismo patrón que todo lo demás.
  const subirFotoFondo = (file) => uploadFondoFoto(uidUser, file);

  // ---------- AR Fase 2 — Outfits ----------
  // Un outfit REFERENCIA prendas (`prendaIds`), nunca las copia: si Josué le cambia el
  // nombre o la foto a una prenda, el outfit se entera solo. Por eso aquí no hay ni una
  // línea que sincronice nada entre las dos listas.
  const addOutfit = (datos) => snapshotAndSave({ armario: { ...armario, outfits: [...armario.outfits, crearOutfit(datos)] } });
  const updateOutfit = (id, cambios) => snapshotAndSave({
    armario: { ...armario, outfits: armario.outfits.map((o) => (o.id === id ? actualizarOutfit(o, cambios) : o)) },
  });
  const duplicarUnOutfit = (id) => {
    const original = armario.outfits.find((o) => o.id === id);
    if (!original) return;
    snapshotAndSave({ armario: { ...armario, outfits: [...armario.outfits, duplicarOutfit(original)] } });
  };
  // Borrar un outfit NO toca ninguna prenda (apartado 15): las prendas son del armario,
  // los outfits solo las referencian. Tampoco borra su foto de portada aquí, porque va
  // a la papelera y podría restaurarse — el fichero se queda, igual que en el resto de
  // la app con lo recuperable.
  const deleteOutfit = (id) => eliminarConPapelera('armario', 'outfits', id);

  // ---------- AR Fase 3 — Historial de uso ----------
  // Un uso es un HECHO fechado: "el día 20 me puse el Casual Gris". Todo lo demás —cuántas
  // veces se ha usado una prenda, cuándo fue la última— se DEDUCE de esta lista, nunca se
  // guarda aparte (apartado 17). Por eso aquí solo hay las tres operaciones básicas: no
  // existe ningún contador que mantener sincronizado.
  const addUso = (datos) => snapshotAndSave({ armario: { ...armario, usos: [...armario.usos, crearUso(datos)] } });
  const updateUso = (id, cambios) => snapshotAndSave({
    armario: { ...armario, usos: armario.usos.map((u) => (u.id === id ? actualizarUso(u, cambios) : u)) },
  });
  const deleteUso = (id) => eliminarConPapelera('armario', 'usos', id);

  /* ---------------------------------------------------------------------------
     RA Fase 4 — las cuatro operaciones del Centro de Rachas.

     Todas pasan por `rachasServicio.js` (RA F2): esta pantalla no escribe
     rachas por su cuenta ni recalcula nada, igual que ninguna otra. Y todas
     entran por `snapshotAndSave`, así que "Deshacer" funciona con las rachas
     como con todo lo demás.
     --------------------------------------------------------------------------- */
  const crearNuevaRacha = (datos) => {
    const { estado: nuevo, error } = crearRachaServicio(rachas, datos);
    if (!error) snapshotAndSave({ rachas: nuevo });
    return { error };
  };
  const completarDiaRacha = (rachaId) => {
    const { estado: nuevo, error } = completarDiaServicio(rachas, { rachaId });
    if (!error) snapshotAndSave({ rachas: nuevo });
  };
  const deshacerDiaRacha = (rachaId) => snapshotAndSave({ rachas: deshacerDiaServicio(rachas, rachaId) });
  // Borrar la racha se lleva su historial (RA F2) y también sus logros e hitos
  // (RA F3): si no, quedarían apuntando a algo que ya no existe.
  const borrarRacha = (rachaId) => snapshotAndSave({
    rachas: eliminarRachaServicio(rachas, rachaId),
    gamificacion: olvidarRachaGamificacion(gamificacion, rachaId),
  });

  /* Evalúa hitos y logros y devuelve SOLO lo nuevo, para que la pantalla lo
     celebre una vez. No entra en el historial de deshacer: un logro conseguido
     no es una edición que Josué quisiera revertir con el botón de atrás. */
  const evaluarGamificacion = () => {
    const { gamificacion: nuevo, eventos } = evaluarRachas(rachas, gamificacion);
    if (eventos.length) { setGamificacion(nuevo); saveData(uidUser, 'gamificacionRachas', nuevo); }
    // SO Fase 1 · apartados 30 y 31 — se emiten al bus, y quien quiera reacciona.
    // Rachas NO sabe que existe el audio, y el audio no sabe qué es una racha:
    // los eventos llegan con SUS nombres y el motor los traduce.
    for (const ev of eventos) emitir(ev.tipo, ev);
    return eventos;
  };

  const updateAudio = async (next) => {
    const limpio = normalizarAudio(next);
    setAudio(limpio);
    await saveData(uidUser, 'audio', limpio);
  };

  const setIconoModulo = (id, iconKey) => {
    const iconos = { ...personalizacion.iconos };
    if (iconKey) iconos[id] = iconKey; else delete iconos[id];
    updatePersonalizacion({ ...personalizacion, iconos });
  };
  // Fase de Seguridad Centralizada: el candado de Personalización (Fase 19) ya no escribe en
  // `personalizacion.pinExtra` — llama a la misma `toggleAreaProtegida` que la nueva lista de
  // Seguridad, así hay un único sitio que decide qué está protegido (apartado 8/9) y quitar
  // protección desde aquí también pide el PIN actual (apartado 3). `personalizacion.pinExtra` se
  // conserva en el estado tal cual quedó por compatibilidad de datos antiguos, pero ya no se lee
  // ni se escribe — la migración de carga, más arriba, la volcó una única vez en `protectedAreas`.
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

  // `papelera` entra en el snapshot desde la Entrega 2 · ME Fase 3. Sin esto, deshacer un borrado
  // devolvería el elemento a su módulo pero dejaría su entrada en la papelera: un fantasma que
  // al restaurarse duplicaría el elemento. Con la papelera dentro del snapshot, deshacer revierte
  // las dos cosas a la vez y los dos sistemas de recuperación no se pisan.
  const snapshotAndSave = (patch) => {
    const snapshot = { sueno, calistenia, futbol, economia, salud, nutricion, estudios, negocio, productividad, objetivos, calendario, diario, biblioteca, relacion, fe, bienestar, papelera, armario, rachas, gamificacion, horarioTop };
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
    if (patch.calendario) { setCalendario(patch.calendario); saveData(uidUser, 'calendario', patch.calendario); }
    if (patch.diario) { setDiario(patch.diario); saveData(uidUser, 'diario', patch.diario); }
    if (patch.biblioteca) { setBiblioteca(patch.biblioteca); saveData(uidUser, 'biblioteca', patch.biblioteca); }
    if (patch.relacion) { setRelacion(patch.relacion); saveData(uidUser, 'relacion', patch.relacion); }
    if (patch.fe) { setFe(patch.fe); saveData(uidUser, 'fe', patch.fe); }
    if (patch.bienestar) { setBienestar(patch.bienestar); saveData(uidUser, 'bienestar', patch.bienestar); }
    if (patch.papelera) { setPapelera(patch.papelera); saveData(uidUser, 'papelera', patch.papelera); }
    if (patch.armario) { setArmario(patch.armario); saveData(uidUser, 'armario', patch.armario); }
    if (patch.rachas) { setRachas(patch.rachas); saveData(uidUser, 'rachas', patch.rachas); }
    if (patch.gamificacion) { setGamificacion(patch.gamificacion); saveData(uidUser, 'gamificacionRachas', patch.gamificacion); }
    if (patch.horarioTop) { setHorarioTop(patch.horarioTop); saveData(uidUser, 'horarioTop', patch.horarioTop); }
    if (patch.estiloHombre) { setEstiloHombre(patch.estiloHombre); saveData(uidUser, 'estiloHombre', patch.estiloHombre); }
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
  // Segundo borrado en cascada, encontrado por la auditoría de ME Fase 4: un programa se podía
  // crear y no quitar, así que un "Idiomas" creado por probar se quedaba en la barra para siempre.
  // Arrastra sus asignaturas y, con ellas, los exámenes y las horas de cada una — todo en la misma
  // entrada de papelera, para que restaurar el programa devuelva el árbol entero.
  const deletePrograma = (id) => {
    const resultado = prepararEliminacion(estudios, 'estudios', 'programas', id, new Date().toISOString());
    if (!resultado) return;
    const asignaturas = estudios.asignaturas.filter((a) => a.programaId === id);
    const idsAsignatura = asignaturas.map((a) => a.id);
    const examenes = estudios.examenes.filter((e) => idsAsignatura.includes(e.asignaturaId));
    const horas = estudios.horas.filter((h) => idsAsignatura.includes(h.asignaturaId));
    const entrada = conArrastrados(resultado.entrada, [
      { coleccion: 'asignaturas', elementos: asignaturas },
      { coleccion: 'examenes', elementos: examenes },
      { coleccion: 'horas', elementos: horas },
    ]);
    snapshotAndSave({
      estudios: {
        ...resultado.moduloActualizado,
        asignaturas: estudios.asignaturas.filter((a) => a.programaId !== id),
        examenes: estudios.examenes.filter((e) => !idsAsignatura.includes(e.asignaturaId)),
        horas: estudios.horas.filter((h) => !idsAsignatura.includes(h.asignaturaId)),
      },
      papelera: { ...papelera, elementos: [...papelera.elementos, entrada] },
    });
  };
  const addAsignatura = (a) => snapshotAndSave({ estudios: { ...estudios, asignaturas: [...estudios.asignaturas, a] } });
  // Único borrado en cascada de la app: quitar una asignatura se lleva por delante sus exámenes
  // y sus horas de estudio, para no dejar registros huérfanos apuntando a algo que ya no existe.
  //
  // Por eso no puede usar `eliminarConPapelera` tal cual: si la papelera guardara solo la
  // asignatura, recuperarla devolvería una asignatura vacía y los exámenes se habrían perdido
  // para siempre. `conArrastrados` mete en la misma entrada lo que cayó con ella, y restaurar
  // devuelve las tres cosas a la vez (especificación: "recupera sus relaciones cuando sea posible").
  const deleteAsignatura = (id) => {
    const resultado = prepararEliminacion(estudios, 'estudios', 'asignaturas', id, new Date().toISOString());
    if (!resultado) return;
    const examenesArrastrados = estudios.examenes.filter((e) => e.asignaturaId === id);
    const horasArrastradas = estudios.horas.filter((h) => h.asignaturaId === id);
    const entrada = conArrastrados(resultado.entrada, [
      { coleccion: 'examenes', elementos: examenesArrastrados },
      { coleccion: 'horas', elementos: horasArrastradas },
    ]);
    snapshotAndSave({
      estudios: {
        ...resultado.moduloActualizado,
        examenes: estudios.examenes.filter((e) => e.asignaturaId !== id),
        horas: estudios.horas.filter((h) => h.asignaturaId !== id),
      },
      papelera: { ...papelera, elementos: [...papelera.elementos, entrada] },
    });
  };
  const addExamen = (ex) => snapshotAndSave({ estudios: { ...estudios, examenes: [...estudios.examenes, ex] } });
  const updateExamen = (ex) => snapshotAndSave({ estudios: { ...estudios, examenes: estudios.examenes.map((e) => (e.id === ex.id ? ex : e)) } });
  const deleteExamen = (id) => eliminarConPapelera('estudios', 'examenes', id);
  const addHoras = (h) => snapshotAndSave({ estudios: { ...estudios, horas: [...estudios.horas, h] } });

  const addProyecto = (p) => snapshotAndSave({ negocio: { ...negocio, proyectos: [...negocio.proyectos, p] } });
  const updateProyecto = (p) => snapshotAndSave({ negocio: { ...negocio, proyectos: negocio.proyectos.map((x) => (x.id === p.id ? p : x)) } });
  const deleteProyecto = (id) => eliminarConPapelera('negocio', 'proyectos', id);
  const addHabito = (h) => snapshotAndSave({ productividad: { ...productividad, habitos: [...productividad.habitos, h] } });
  const updateHabito = (h) => snapshotAndSave({ productividad: { ...productividad, habitos: productividad.habitos.map((x) => (x.id === h.id ? h : x)) } });
  const deleteHabito = (id) => eliminarConPapelera('productividad', 'habitos', id);
  const addRutina = (r) => snapshotAndSave({ productividad: { ...productividad, rutinas: [...productividad.rutinas, r] } });
  const updateRutina = (r) => snapshotAndSave({ productividad: { ...productividad, rutinas: productividad.rutinas.map((x) => (x.id === r.id ? r : x)) } });
  const deleteRutina = (id) => eliminarConPapelera('productividad', 'rutinas', id);
  const addTarea = (t) => snapshotAndSave({ productividad: { ...productividad, tareas: [...productividad.tareas, t] } });
  const toggleTarea = (id) =>
    snapshotAndSave({ productividad: { ...productividad, tareas: productividad.tareas.map((x) => (x.id === id ? { ...x, hecha: !x.hecha } : x)) } });
  const deleteTarea = (id) => eliminarConPapelera('productividad', 'tareas', id);
  const addMeta = (m) => snapshotAndSave({ productividad: { ...productividad, metas: [...productividad.metas, m] } });
  const updateMeta = (m) => snapshotAndSave({ productividad: { ...productividad, metas: productividad.metas.map((x) => (x.id === m.id ? m : x)) } });
  const deleteMeta = (id) => eliminarConPapelera('productividad', 'metas', id);
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
  const deleteObjetivo = (id) => eliminarConPapelera('objetivos', 'lista', id);
  // La fecha de la última revisión tampoco pasa por el snapshot — es un dato de "seguimiento",
  // no algo que tenga sentido deshacer, igual que el contador de pomodoros.
  const marcarRevisionHecha = () => {
    const next = { ...objetivos, ultimaRevision: todayISO() };
    setObjetivos(next);
    saveData(uidUser, 'objetivos', next);
  };

  // Fase 1 del Calendario Universal — texto puro, sin PIN, así que pasa por snapshotAndSave/
  // deshacer como el resto de módulos de datos de la app (mismo criterio que Objetivos/Diario).
  const addEvento = (ev) => snapshotAndSave({ calendario: { ...calendario, eventos: [...calendario.eventos, ev] } });
  const updateEvento = (ev) => snapshotAndSave({ calendario: { ...calendario, eventos: calendario.eventos.map((x) => (x.id === ev.id ? ev : x)) } });
  const deleteEvento = (id) => eliminarConPapelera('calendario', 'eventos', id);
  const addEntradaDiario = (e) => snapshotAndSave({ diario: { ...diario, entradas: [...diario.entradas, e] } });
  const updateEntradaDiario = (e) => snapshotAndSave({ diario: { ...diario, entradas: diario.entradas.map((x) => (x.id === e.id ? e : x)) } });
  const deleteEntradaDiario = (id) => eliminarConPapelera('diario', 'entradas', id);
  // Fase 11 — Biblioteca. Apuntes y enlaces son texto puro, así que sí pasan por
  // snapshotAndSave/deshacer, igual que el resto de módulos de datos de la app.
  const addApunte = (a) => snapshotAndSave({ biblioteca: { ...biblioteca, apuntes: [...biblioteca.apuntes, a] } });
  const deleteApunte = (id) => eliminarConPapelera('biblioteca', 'apuntes', id);
  const addEnlace = (e) => snapshotAndSave({ biblioteca: { ...biblioteca, enlaces: [...biblioteca.enlaces, e] } });
  const deleteEnlace = (id) => eliminarConPapelera('biblioteca', 'enlaces', id);
  // Fase 12 — Relación: módulo privado (PinGate en el render, ver renderTab). Nombre y fechas
  // importantes son texto puro, sin archivos, así que pasan por snapshotAndSave/deshacer igual
  // que el resto de módulos de datos (mismo criterio que Diario y los apuntes de Biblioteca).
  const updateNombrePareja = (nombre) => snapshotAndSave({ relacion: { ...relacion, nombre } });
  const addFechaImportante = (f) => snapshotAndSave({ relacion: { ...relacion, fechas: [...relacion.fechas, f] } });
  const updateFechaImportante = (f) => snapshotAndSave({ relacion: { ...relacion, fechas: relacion.fechas.map((x) => (x.id === f.id ? f : x)) } });
  const deleteFechaImportante = (id) => eliminarConPapelera('relacion', 'fechas', id);
  // Fase 14 — Fe: cuatro sub-áreas de texto puro, todas sin PIN (Josué no pidió privacidad
  // extra aquí), así que las cuatro pasan por snapshotAndSave/deshacer como el resto de módulos
  // de datos de la app.
  const addServicioFe = (s) => snapshotAndSave({ fe: { ...fe, servicio: [...fe.servicio, s] } });
  const deleteServicioFe = (id) => eliminarConPapelera('fe', 'servicio', id);
  const addEventoFe = (ev) => snapshotAndSave({ fe: { ...fe, eventos: [...fe.eventos, ev] } });
  const deleteEventoFe = (id) => eliminarConPapelera('fe', 'eventos', id);
  const addDiarioFe = (d) => snapshotAndSave({ fe: { ...fe, diario: [...fe.diario, d] } });
  const deleteDiarioFe = (id) => eliminarConPapelera('fe', 'diario', id);
  const addObjetivoFe = (o) => snapshotAndSave({ fe: { ...fe, objetivos: [...fe.objetivos, o] } });
  const updateObjetivoFe = (o) => snapshotAndSave({ fe: { ...fe, objetivos: fe.objetivos.map((x) => (x.id === o.id ? o : x)) } });
  const deleteObjetivoFe = (id) => eliminarConPapelera('fe', 'objetivos', id);
  // Fase 15 — Bienestar digital: las tres sub-áreas son texto puro (sin archivos, sin PIN), así
  // que pasan por snapshotAndSave/deshacer como el resto de módulos de datos de la app — mismo
  // criterio que Fe o los apuntes/enlaces de Biblioteca.
  const addRegistroTiempoUso = (r) => snapshotAndSave({ bienestar: { ...bienestar, registros: [...bienestar.registros, r] } });
  const deleteRegistroTiempoUso = (id) => eliminarConPapelera('bienestar', 'registros', id);
  const addReflexionBienestar = (r) => snapshotAndSave({ bienestar: { ...bienestar, reflexiones: [...bienestar.reflexiones, r] } });
  const deleteReflexionBienestar = (id) => eliminarConPapelera('bienestar', 'reflexiones', id);
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
    setCalendario(last.calendario || DEFAULT_CALENDARIO); saveData(uidUser, 'calendario', last.calendario || DEFAULT_CALENDARIO);
    setDiario(last.diario || DEFAULT_DIARIO); saveData(uidUser, 'diario', last.diario || DEFAULT_DIARIO);
    setBiblioteca(last.biblioteca || DEFAULT_BIBLIOTECA); saveData(uidUser, 'biblioteca', last.biblioteca || DEFAULT_BIBLIOTECA);
    setRelacion(last.relacion || DEFAULT_RELACION); saveData(uidUser, 'relacion', last.relacion || DEFAULT_RELACION);
    setFe(last.fe || DEFAULT_FE); saveData(uidUser, 'fe', last.fe || DEFAULT_FE);
    setBienestar(last.bienestar || DEFAULT_BIENESTAR); saveData(uidUser, 'bienestar', last.bienestar || DEFAULT_BIENESTAR);
    setPapelera(last.papelera || DEFAULT_PAPELERA); saveData(uidUser, 'papelera', last.papelera || DEFAULT_PAPELERA);
    setArmario(last.armario || DEFAULT_ARMARIO); saveData(uidUser, 'armario', last.armario || DEFAULT_ARMARIO);
    setRachas(last.rachas || ESTADO_INICIAL); saveData(uidUser, 'rachas', last.rachas || ESTADO_INICIAL);
    setGamificacion(last.gamificacion || GAMIFICACION_INICIAL); saveData(uidUser, 'gamificacionRachas', last.gamificacion || GAMIFICACION_INICIAL);
    setHorarioTop(last.horarioTop || DEFAULT_HORARIO_TOP); saveData(uidUser, 'horarioTop', last.horarioTop || DEFAULT_HORARIO_TOP);
    setEstiloHombre(last.estiloHombre || DEFAULT_ESTILO_HOMBRE); saveData(uidUser, 'estiloHombre', last.estiloHombre || DEFAULT_ESTILO_HOMBRE);
    setHistory(rest); saveData(uidUser, 'historial', rest);
  };

  // relacion queda fuera de currentState/export: es el único módulo protegido por PIN de
  // principio a fin, y exportar a CSV/Excel no pide el PIN — igual que las fotos de Salud o
  // los vídeos de Calistenia no se incluyen en el export por ser sensibles/binarios. fe y
  // bienestar sí se incluyen: ninguno lleva PIN ni archivos, mismo criterio que diario o
  // biblioteca (texto puro, sin protección).
  const currentState = { sueno, calistenia, futbol, economia, salud, nutricion, estudios, negocio, productividad, objetivos, calendario, diario, biblioteca, fe, bienestar };

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
  // RA Fase 4 — el resumen de Rachas SÍ es caro (recorre historiales día a día), así que a
  // partir de aquí esto va memoizado. Es el apartado 31: *"evita cálculos repetidos"*.

  // Fase 19 — métricas favoritas del panel "Hoy": se calculan aquí (no en DashboardView) porque
  // combinan datos de varios módulos, mismo criterio que ya usan Estadísticas/Predicciones —
  // ninguna vista de solo-lectura debería tener que conocer la forma interna de otro módulo.
  const calcularMetricas = () => {
    const valores = {};
    const ultimaMedida = salud.medidas[salud.medidas.length - 1];
    valores.peso = ultimaMedida?.peso ? `${ultimaMedida.peso} kg` : 'Sin datos';
    valores.hucha = `${economia.hucha || 0} €`;
    // RA Fase 1 — derivada del historial, no de un contador guardado.
    const mejorRacha = productividad.habitos.reduce((max, h) => Math.max(max, resumenHabito(h).actual), 0);
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

  // Fase 2 del Calendario Universal — eventos de solo lectura calculados en cada render a partir
  // de Objetivos/Estudios/Entrenamiento/Productividad/Relación (ver calendarioIntegracion.js).
  // Mismo criterio de cálculo barato que `resumenesTodos`/`metricasCalculadas`: nunca se guarda,
  // se recalcula solo.
  //
  // Finalización del Calendario — Relación es el único módulo protegido de principio a fin en
  // toda la app, y el Calendario (igual que el Dashboard) no pide PIN para abrirse. Para que sus
  // fechas puedan aparecer en el Calendario sin ser una regresión de privacidad, solo se le pasan
  // los datos reales de Relación a `eventosDerivados` cuando el propio PIN de Relación ya está
  // desbloqueado en esta sesión (`estaDesbloqueado('area:relacion')`, el mismo comprobado más
  // abajo para abrir la pestaña) o cuando no existe ningún PIN configurado (en ese caso Relación
  // tampoco pide PIN para abrirse, así que no hay nada que proteger). Sin desbloquear, se pasa
  // `null` y ni un solo indicador de esas fechas llega al Calendario o al Dashboard.
  const relacionDesbloqueadaParaCalendario = !seguridad.pinHash || estaDesbloqueado('area:relacion');
  const derivadosCalendario = eventosDerivados({
    objetivos, estudios, calistenia, futbol, productividad, armario,
    relacion: relacionDesbloqueadaParaCalendario ? relacion : null,
    // EH F8, apartado 17 — las rutinas de pelo entran por el calendario que ya
    // existe. ⚠️ Necesitan un rango porque una rutina "cada 3 días" no tiene un
    // número finito de ocurrencias: se calcula una ventana de un año a cada
    // lado y no se materializa ninguna (regla 11).
    estiloHombre,
    desde: addDays(todayISO(), -365),
    hasta: addDays(todayISO(), 365),
  });

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
            productividad={productividad} estudios={estudios}
            /* ⚠️ Con los nombres escritos: la auditoría de ME F4 los busca literales. */
            onEliminarPerfume={(coleccion, id) => (coleccion === 'perfumes'
              ? eliminarConPapelera('perfumes', 'perfumes', id)
              : eliminarConPapelera('perfumes', 'historial', id))}
            rachas={rachas}
            // BI Fase 1 — el desplegable de situación de "Hoy" cambia el modo desde ahí mismo.
            // Es el MISMO interruptor que Personalización, no un segundo sistema (decisión D2-07).
            modo={personalizacion.modo} onSetModo={setModoApp}
            notificaciones={notificaciones}
            calendario={calendario} derivadosCalendario={derivadosCalendario}
            // Ampliación del Dashboard — Centro de Control: datos adicionales que el Dashboard
            // anterior no necesitaba (Salud, Objetivos, Nutrición) más los módulos de Nivel 3
            // (Diario, Negocio, Biblioteca, Fe, Bienestar — Relación ya se pasaba, solo para el
            // recordatorio discreto de siempre, nunca sus datos completos). `resumenes` reutiliza
            // el mismo cálculo ya hecho para los hubs (HubView), sin duplicar lógica ninguna.
            salud={salud} objetivos={objetivos} nutricion={nutricion}
            negocio={negocio} diario={diario} biblioteca={biblioteca} fe={fe} bienestar={bienestar}
            resumenes={resumenesTodos}
            dashboardOcultos={personalizacion.dashboardOcultos}
            modulosDesactivados={personalizacion.ocultos}
            onNavegar={navegarDesdeHoy}
            accent={accent}
          />
        );
      case 'sueno':
        return <SleepView sueno={sueno} onAdd={addSueno} onDelete={deleteRegistroSueno} accent={accent} foco={focoPara('sueno')} onFocoConsumido={consumirFoco} />;
      case 'entreno':
        return (
          <TrainingView
            calistenia={calistenia} onUpdateSkill={updateSkill}
            futbol={futbol} onAddPartido={addPartido} onDeletePartido={deletePartido}
            videos={calisteniaVideos} onAddVideo={addVideo} onDeleteVideo={deleteVideo} onSetVideoFeedback={setVideoFeedback}
            accent={accent}
            foco={focoPara('entreno')} onFocoConsumido={consumirFoco}
          />
        );
      case 'salud':
        // Fase de Seguridad Centralizada — "Ver fotos privadas de Salud" es la primera protección
        // de FUNCIÓN real (apartado 2), no de pantalla entera: antes HealthView protegía la
        // pestaña de fotos siempre, sin opción; ahora depende de `protectedActions`, con la
        // migración de carga activándola sola para no cambiar nada a quien ya tenía PIN.
        return (
          <HealthView
            salud={salud} fotos={saludFotos}
            onAddMedida={addMedida} onAddHistorial={addHistorialMedico}
            onDeleteMedida={deleteMedida} onDeleteHistorial={deleteHistorialMedico}
            onAddFoto={addFoto} onDeleteFoto={deleteFoto}
            protegidoFotos={seguridad.protectedActions.includes('fotos_privadas')}
            pinHash={seguridad.pinHash} pinSalt={seguridad.pinSalt}
            desbloqueadoFotos={estaDesbloqueado('accion:fotos_privadas')}
            onDesbloquearFotos={() => registrarDesbloqueo('accion:fotos_privadas')}
            onOlvidoPin={() => setRecuperandoPin(true)}
            accent={accent}
          />
        );
      case 'nutricion':
        return (
          <NutritionView
            nutricion={nutricion} onAddComida={addComida} onDeleteComida={deleteComida} onAddFavorito={addFavorito}
            onRegistrarFavorito={registrarFavorito} onEliminarFavorito={eliminarFavorito}
            onSetAgua={setAgua} accent={accent}
          />
        );
      case 'estudios':
        return (
          <EstudiosView
            estudios={estudios} sueno={sueno}
            onAddPrograma={addPrograma} onDeletePrograma={deletePrograma}
            onAddAsignatura={addAsignatura} onDeleteAsignatura={deleteAsignatura}
            onAddExamen={addExamen} onUpdateExamen={updateExamen} onDeleteExamen={deleteExamen}
            onAddHoras={addHoras} onDeleteHoras={deleteHorasEstudio} accent={accent}
            foco={focoPara('estudios')} onFocoConsumido={consumirFoco}
          />
        );
      case 'armario':
        return (
          <ArmarioView
            armario={armario}
            onAddPrenda={addPrenda} onUpdatePrenda={updatePrenda} onDeletePrenda={deletePrenda}
            onSubirFoto={subirFotoPrenda}
            onAddOutfit={addOutfit} onUpdateOutfit={updateOutfit}
            onDeleteOutfit={deleteOutfit} onDuplicarOutfit={duplicarUnOutfit}
            onAddUso={addUso} onUpdateUso={updateUso} onDeleteUso={deleteUso}
            accent={accent}
          />
        );
      // RA Fase 4 — el Centro de Rachas. Un módulo más, en el área Vida, junto a
      // Productividad, que es donde viven los hábitos. Nada de navegación paralela
      // (apartado 33): mismo hub, mismo botón de volver, mismas 5 pestañas.
      case 'rachas':
        return (
          <RachasView
            /* ⚠️ Con los nombres escritos: la auditoría de ME F4 los busca literales. */
            onEliminarPerfume={(coleccion, id) => (coleccion === 'perfumes'
              ? eliminarConPapelera('perfumes', 'perfumes', id)
              : eliminarConPapelera('perfumes', 'historial', id))}
            rachas={rachas} gamificacion={gamificacion} habitos={productividad.habitos}
            accent={accent}
            onCrearRacha={crearNuevaRacha}
            onCompletarDia={completarDiaRacha}
            onDeshacerDia={deshacerDiaRacha}
            onEliminarRacha={borrarRacha}
            onEvaluar={evaluarGamificacion}
          />
        );
      // HT Fase 3 — el editor de horarios. Cada operación entra por
      // `snapshotAndSave`, así que guarda sola y el "Deshacer" global la cubre:
      // el editor no monta ni autoguardado ni historial propios.
      // EH Fase 1 — el espacio de Estilo de Hombre. Todavía SIN contenido en
      // los apartados: el enunciado lo prohíbe expresamente en esta fase, y la
      // pantalla lo dice en vez de abrir plaquitas vacías (regla 8).
      case 'estilo-hombre':
        return (
          <EstiloHombreView
            estiloHombre={estiloHombre}
            accent={accent}
            /* EH F3, apartado 7 — *"No preguntar información que JC Fitness ya
               conoce."* Se le PASA lo que ya existe para que el asistente lo lea
               y no lo pregunte. ⚠️ Nada de esto se copia dentro de
               `estiloHombre`: se mira y se olvida (F1, apartado 10). */
            datosGlobales={{ perfil, salud, objetivos, calistenia, sueno }}
            /* EH F5, apartado 1 — la plaquita de Estilo y armario abre EL
               ARMARIO QUE YA EXISTE. ⚠️ Se pasa en solo lectura: aquí no se
               guarda ni una prenda (*"no crear un segundo sistema de ropa"*). */
            armario={armario}
            /* ⚠️ EH F28 — Objetivos llega en SOLO LECTURA. Aquí no se guarda ni
               un objetivo: el módulo devuelve un plan y guarda App.jsx. */
            objetivos={objetivos}
            /* ⚠️ EH F28, apartado 2 — *"se abrirá el sistema global de
               objetivos. No crear una pantalla paralela."* Se usa la ÚNICA
               navegación con deep-link de la app, la misma del Centro de
               Control: `ObjectivesView` ya sabe destacar el `foco.id`. */
            onIr={(destino, foco) => navegarDesdeHoy(destino, foco)}
            onCambiar={(nuevo) => snapshotAndSave({ estiloHombre: nuevo })}
            /* ⚠️ **EH F36, apartados 5 y 6** — *"utilizar 🗑️ Eliminados
               recientemente para poder recuperarlos"*. La pantalla devuelve el
               PLAN —qué elementos se van—, y aquí se ejecuta por la ÚNICA puerta
               de borrado de la app (ME F3), uno a uno, para que cada uno se
               pueda recuperar por separado. Mismo reparto que la F26. */
            onEliminarDatosEH={(elementos) => {
              (elementos || []).forEach((x) => eliminarConPapelera(x.modulo, x.coleccion, x.id));
            }}
            /* EH F15, apartado 13 — borrar un registro de piel va a "Eliminados
               recientemente", la papelera que ya existe. Por eso lo maneja
               App.jsx, que es quien la tiene, y no la pantalla. */
            /* ⚠️ Por `eliminarConPapelera`, la ÚNICA puerta de borrado de la
               app (ME F3), no por un atajo: así la auditoría de ME F4 ve el
               borrado y lo empareja con su entrada del catálogo. */
            onEliminarRegistro={(id) => eliminarConPapelera('skincare', 'registros', id)}
            onEliminarRegistroBarba={(id) => eliminarConPapelera('barba', 'registros', id)}
            onEliminarRutinaBarba={(id) => eliminarConPapelera('barba', 'rutinas', id)}
            /* ⚠️ EH F19 — las dos de Higiene y Cuidado corporal, **con su nombre
               escrito**, no con el módulo como variable: la auditoría de ME F4
               lee este archivo buscando el par módulo/colección, y con una
               variable no habría visto ninguna de las dos. */
            onEliminarRutinaCuerpo={(modulo, id) => (modulo === 'higiene'
              ? eliminarConPapelera('higiene', 'rutinas', id)
              : eliminarConPapelera('cuerpo', 'rutinas', id))}
            /* ⚠️ Las tres, con su nombre escrito: la auditoría de ME F4 comprueba
               sobre el código que toda colección del catálogo tenga un borrado
               de verdad, y una colección pasada como variable no se ve. */
            onEliminarSonrisa={(coleccion, id) => {
              if (coleccion === 'rutinas') return eliminarConPapelera('sonrisa', 'rutinas', id);
              if (coleccion === 'revisiones') return eliminarConPapelera('sonrisa', 'revisiones', id);
              return eliminarConPapelera('sonrisa', 'registros', id);
            }}
            /* ⚠️ Con los nombres escritos: la auditoría de ME F4 los busca literales. */
            onEliminarPerfume={(coleccion, id) => (coleccion === 'perfumes'
              ? eliminarConPapelera('perfumes', 'perfumes', id)
              : eliminarConPapelera('perfumes', 'historial', id))}
            /* ⚠️ EH F26 — los dos, con su nombre escrito, por lo mismo. */
            onEliminarAccesorio={(coleccion, id) => (coleccion === 'accesorios'
              ? eliminarConPapelera('accesorios', 'accesorios', id)
              : eliminarConPapelera('accesorios', 'deseos', id))}
            /* ⚠️ EH F26 — el ÚNICO sitio que escribe la prenda de un accesorio, y
               lo hace en el ARMARIO: el módulo decide, App.jsx —que es el dueño
               de los dos almacenes— guarda. Mismo reparto que `gestionModulos`
               con `estiloDeHombre`. */
            /* ⚠️ EH F27 — con el nombre escrito: la auditoría de ME F4 los busca
               literales sobre el código de App.jsx. */
            onEliminarGusto={(id) => eliminarConPapelera('gustos', 'entradas', id)}
            onGuardarAccesorio={({ estado: nuevo, armario: nuevoArmario }) => snapshotAndSave({
              ...(nuevo ? { estiloHombre: nuevo } : {}),
              ...(nuevoArmario ? { armario: nuevoArmario } : {}),
            })}
            /* ⚠️ EH F28 — el objetivo va a OBJETIVOS y aquí solo queda su id.
               Los dos almacenes en un solo guardado, como los accesorios. */
            onGuardarObjetivo={({ estado: nuevo, objetivos: nuevosObjetivos }) => snapshotAndSave({
              ...(nuevo ? { estiloHombre: nuevo } : {}),
              ...(nuevosObjetivos ? { objetivos: nuevosObjetivos } : {}),
            })}
            /* ⚠️ **EH F39, apartado 3** — el único sistema global que Estilo de
               hombre no había tocado nunca. La tarea vive en Productividad y
               aquí solo queda su id; los dos almacenes, en un solo guardado. */
            productividad={productividad}
            onGuardarTarea={(plan) => {
              const r = aplicarTarea(estiloHombre, productividad, plan, { confirmado: true });
              if (r) snapshotAndSave({ estiloHombre: r.estiloHombre, productividad: r.productividad });
            }}
            rachas={rachas}
          />
        );

      case 'horario':
        return (
          <HorarioView
            horarioTop={horarioTop}
            asignaturas={estudios.asignaturas || []}
            estudios={estudios} productividad={productividad} calendario={calendario}
            notificaciones={notificaciones}
            onCompletarTarea={toggleTarea}
            onReprogramarTarea={(id, fecha) => snapshotAndSave({
              productividad: { ...productividad, tareas: productividad.tareas.map((t) => (t.id === id ? { ...t, fecha } : t)) },
            })}
            accent={accent}
            onCambiar={(nuevo) => snapshotAndSave({ horarioTop: nuevo })}
            onCrearHorario={(nuevo) => snapshotAndSave({ horarioTop: nuevo })}
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
            foco={focoPara('productividad')} onFocoConsumido={consumirFoco}
          />
        );
      case 'objetivos':
        return (
          <ObjectivesView
            objetivos={objetivos} onAdd={addObjetivo} onUpdate={updateObjetivo} onDelete={deleteObjetivo}
            onRevisionHecha={marcarRevisionHecha} accent={accent}
            foco={focoPara('objetivos')} onFocoConsumido={consumirFoco}
          />
        );
      case 'calendario':
        return (
          <CalendarView
            calendario={calendario} derivados={derivadosCalendario}
            onAdd={addEvento} onUpdate={updateEvento} onDelete={deleteEvento}
            onAbrirModulo={setTab}
            accent={accent}
            foco={focoPara('calendario')} onFocoConsumido={consumirFoco}
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
            onUpdateFecha={updateFechaImportante}
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
        return (
          <FinanceView
            economia={economia} onAddMovimiento={addMovimiento} onUpdateHucha={updateHucha} accent={accent}
            foco={focoPara('economia')} onFocoConsumido={consumirFoco}
          />
        );
      case 'ajustes': {
        // Fase A1 — Ajustes pasa a ser un único centro de categorías (ver SettingsView.jsx):
        // ya no se apilan SettingsView + PersonalizationView, SettingsView reenvía las props
        // de personalización a la categoría interna "Pantalla principal" que envuelve
        // PersonalizationView sin tocarla.
        // Fase de Seguridad Centralizada — 'exportar_datos' y 'eliminar_datos' son las otras dos
        // acciones protegibles ya cableadas de verdad (apartado 2): si Josué las activa en
        // Seguridad, exportar o borrar datos por categoría pide primero el PIN actual, igual que
        // cualquier otra acción sensible — mismo `pedirVerificacionPin` que usa todo lo demás.
        const exportarProtegido = seguridad.protectedActions.includes('exportar_datos');
        const eliminarProtegido = seguridad.protectedActions.includes('eliminar_datos');
        /* ⚠️ **EH F34, apartado 14** — *"Estilo de hombre debe incluir sus datos
           dentro de esa exportación"*. Se pasa **aparte de `currentState`**, no
           dentro: ese objeto es también el contexto que se le manda a la IA, y
           el perfil de piel tiene escrito que **no viaja a la IA** (EH F13,
           apartado 17). Meterlo en `currentState` habría sido más corto y habría
           filtrado a la IA todo Estilo de hombre de una vez. */
        const paraExportar = { ...currentState, estiloHombre };
        const exportarCSVProtegido = () => {
          const ejecutar = () => exportCSV(paraExportar);
          if (exportarProtegido) pedirVerificacionPin('Confirma tu PIN para exportar tus datos.', ejecutar); else ejecutar();
        };
        const exportarXLSXProtegido = () => {
          const ejecutar = () => exportXLSX(paraExportar);
          if (exportarProtegido) pedirVerificacionPin('Confirma tu PIN para exportar tus datos.', ejecutar); else ejecutar();
        };
        const borrarDatosModuloProtegido = (id) => {
          const ejecutar = () => borrarDatosModulo(id);
          if (eliminarProtegido) pedirVerificacionPin('Confirma tu PIN para eliminar estos datos.', ejecutar); else ejecutar();
        };
        return (
          <SettingsView
            foco={focoPara('ajustes')} onFocoConsumido={consumirFoco}
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
            onSubirFotoFondo={subirFotoFondo} urlFotoFondo={urlFotoFondo}
            onFirmarFotoFondo={firmarFotoFondo}
            onGuardarPreset={guardarPreset} onCambiarPresets={cambiarPresets} onAplicarPreset={aplicarPresetCompleto}
            onEliminarPreset={eliminarPreset}
            notificaciones={notificaciones} onUpdateNotificaciones={updateNotificaciones}
            seguridad={seguridad} onUpdateSeguridad={updateSeguridad} userId={uidUser}
            areasProtegibles={AREAS_PROTEGIBLES}
            onToggleAreaProtegida={toggleAreaProtegida}
            onToggleAccionProtegida={toggleAccionProtegida}
            onIniciarCrearPin={iniciarCreacionPin}
            onIniciarCambioPin={iniciarCambioPin}
            onIniciarDesactivarPin={iniciarDesactivarPin}
            modulosBorrables={Object.entries(RESET_MODULOS).map(([id, cfg]) => ({ id, label: cfg.label }))}
            onBorrarDatosModulo={borrarDatosModuloProtegido}
            onExportCSV={exportarCSVProtegido} onExportXLSX={exportarXLSXProtegido}
            onUndo={undo} canUndo={history.length > 0}
            onSignOut={signOut}
            areas={AREAS_NAV}
            modulos={moreNavOrdenadoConIconos}
            personalizacion={personalizacion}
            onMove={moverModuloNav}
            onToggleOculto={toggleOcultoModulo}
            papelera={papelera}
            relacionDesbloqueada={!seguridad.pinHash || estaDesbloqueado('area:relacion')}
            onRestaurarPapelera={restaurarDePapelera}
            onEliminarDefinitivo={eliminarDefinitivo}
            onVaciarPapelera={vaciarPapelera}
            onSetRetencionPapelera={setRetencionPapelera}
            onToggleDashboard={toggleDashboardModulo}
            onAplicarPerfil={aplicarPerfilModulos}
            onSetIcono={setIconoModulo}
            onTogglePinExtra={toggleAreaProtegida}
            onToggleFavorita={toggleFavoritaMetrica}
            onMoveFavorita={moverFavoritaMetrica}
            modo={personalizacion.modo}
            onSetModo={setModoApp}
          />
        );
      }
      default:
        return null;
    }
  };

  // Fase de Seguridad Centralizada — sustituye a "Fase 19: Relación siempre + personalizacion.
  // pinExtra" por la lista única `seguridad.protectedAreas` (más 'relacion', que sigue especial,
  // siempre protegida, sin poder quitarla — ni siquiera pasa por `toggleAreaProtegida`). La clave
  // `area:<tab>` del mapa de sesiones temporales identifica esta sección en `desbloqueosPin`
  // (apartado 6); sin PIN configurado nada se pide, exactamente igual que con el sistema anterior.
  const areaProtegida = tab === 'relacion' || seguridad.protectedAreas.includes(tab);
  const necesitaPin = !!seguridad.pinHash && areaProtegida && !estaDesbloqueado(`area:${tab}`);
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
    const contenido = necesitaPin ? (
      <PinGate
        pinHash={seguridad.pinHash} pinSalt={seguridad.pinSalt} accent={accent}
        desbloqueado={estaDesbloqueado(`area:${tab}`)}
        onDesbloquear={() => registrarDesbloqueo(`area:${tab}`)}
        onOlvidoPin={() => setRecuperandoPin(true)}
      >
        {renderContent()}
      </PinGate>
    ) : renderContent();
    if (!enModulo || !areaActual) return contenido;
    // BI Fase 4 · apartado 11 — si Josué llegó aquí desde el buscador, "atrás" lo
    // devuelve a donde estaba, no al hub del área (que puede no haber pisado nunca).
    // El rastro solo vale para el módulo al que le llevó el buscador; en cuanto se
    // mueve a otro sitio deja de aplicarse.
    const vueltaValida = vueltaBusqueda && vueltaBusqueda.hacia === tab ? vueltaBusqueda : null;
    const destinoVuelta = vueltaValida ? vueltaValida.desde : areaActual.id;
    const etiquetaVuelta = vueltaValida
      ? (vueltaValida.desde === 'hoy'
        ? 'Inicio'
        : (AREAS_NAV.find((a) => a.id === vueltaValida.desde)?.label
          || MORE_NAV.find((m) => m.id === vueltaValida.desde)?.label
          || 'Atrás'))
      : areaActual.label;
    return (
      <div key={tab} className="module-enter">
        {/* Fase N4 — pasa de texto suelto a una píldora "glass" (fondo tenue + borde apenas
            visible), coherente con el resto del lenguaje visual del hub del que viene. */}
        <button
          onClick={() => { setVueltaBusqueda(null); setTab(destinoVuelta); }}
          className="back-bar inline-flex items-center gap-1.5 mb-4 pl-2.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold active:opacity-60"
          style={{ color: COLORS.textMuted, background: hexToRgba(COLORS.border, 0.35) }}
        >
          <ArrowLeft size={16} /> {etiquetaVuelta}
        </button>
        {contenido}
      </div>
    );
  };

  // Modales globales de Seguridad (recuperación de PIN y creación/cambio) — pueden dispararse
  // tanto desde la pantalla de bloqueo automático (más abajo) como desde cualquier PinGate o desde
  // Seguridad, así que se declaran una sola vez y se reutilizan en ambos `return` de este
  // componente (apartado 8: un único sistema, nunca una pantalla distinta según de dónde se venga).
  const modalesRecuperacion = (
    <>
      {recuperandoPin && (
        <RecuperarPinModal
          accent={accent} emailCuenta={session.user.email}
          onEnviar={enviarRecuperacionPin} onCancel={() => setRecuperandoPin(false)}
        />
      )}
      {flujoNuevoPin && (
        <CrearPinModal
          accent={accent}
          titulo={flujoNuevoPin === 'recuperacion' ? 'Crea tu PIN nuevo' : flujoNuevoPin === 'cambio' ? 'Cambia tu PIN' : 'Crea tu PIN'}
          onGuardar={guardarPinTrasFlujo}
          onCancel={() => setFlujoNuevoPin(null)}
          permitirCancelar={flujoNuevoPin !== 'recuperacion'}
        />
      )}
    </>
  );

  // Fase A5: bloqueo automático por inactividad, por encima de todo lo demás (incluida la propia
  // navegación) — solo puede ocurrir si hay PIN configurado (ver el useEffect de arriba).
  if (bloqueado && seguridad.pinHash) {
    return (
      <>
        <BloqueoAutomaticoGate
          seguridad={seguridad} accent={accent}
          onUnlock={() => setBloqueado(false)}
          onOlvidoPin={() => setRecuperandoPin(true)}
        />
        {modalesRecuperacion}
      </>
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
        // FO Fase 1 — `isolation: isolate` convierte este contenedor en un contexto de
        // apilamiento propio. Hace falta para que las capas de fondo puedan ir con
        // `z-index: -1` y queden ENTRE el `background` de aquí arriba y el contenido de la
        // app, en vez de escaparse al contexto raíz y esconderse detrás del `<body>`.
        //
        // No afecta a los overlays `fixed` de la app: `isolation` crea contexto de
        // apilamiento, pero NO un bloque contenedor para `position: fixed` (eso solo lo
        // hacen transform/filter/will-change). Y los modales van por `createPortal` a
        // `document.body`, así que están fuera de este contenedor y siguen encima de todo.
        isolation: 'isolate',
      }}
    >
      <style>{`*:focus-visible { outline: 2px solid ${accent}; outline-offset: 2px; }`}</style>

      {/* FO Fase 1 — el fondo, en DOS capas fijas detrás de todo (z-index 0; el contenido de la
          app vive por encima porque `position: relative` lo saca del flujo de apilamiento base).

          `background: COLORS.bg` sigue estando arriba, en el contenedor, y eso es a propósito:
          es la última red de seguridad del apartado 6. Si estas capas no pintaran nada —porque
          el fondo está apagado, o roto, o el navegador no entiende `color-mix`— debajo sigue
          habiendo el fondo normal de JosStyle, nunca un hueco.

          Son dos capas y no una porque el velo NO debe desenfocarse con la fotografía: si
          compartieran capa, subir el desenfoque difuminaría también el velo y dejaría de
          proteger la lectura, que es justo para lo que existe. */}
      {estiloFondo && (
        <div aria-hidden="true" className="fixed inset-0 pointer-events-none" style={{ ...estiloFondo, zIndex: -1 }} />
      )}
      {estiloLuz && (
        <div aria-hidden="true" className="fixed inset-0 pointer-events-none" style={{ ...estiloLuz, zIndex: -1 }} />
      )}
      {estiloVelo && (
        <div aria-hidden="true" className="fixed inset-0 pointer-events-none" style={{ ...estiloVelo, zIndex: -1 }} />
      )}

      {/* Fase 18 + BI Fase 2 — dos accesos fijos, ninguno de los dos se dispara solo.
          La lupa pasa a la IZQUIERDA en esta fase porque el apartado 1 la sitúa ahí, y el panel
          de sugerencias se va a la derecha. Se intercambian de sitio en vez de quitar uno: son
          cosas distintas (buscar/preguntar vs. sugerencias del día) y la especificación prohíbe
          expresamente eliminar funcionalidad existente. */}
      <button
        onClick={() => setShowSearch(true)}
        className="fixed z-30 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90"
        style={{ top: 14, left: 14, background: hexToRgba(accent, 0.15), border: `1px solid ${hexToRgba(accent, 0.3)}`, backdropFilter: 'blur(8px)' }}
        aria-label="Buscar funciones o preguntar a la IA"
      >
        <Search size={16} style={{ color: accent }} />
      </button>
      <SuggestionsButton accent={accent} buildPrompt={buildSuggestionsPrompt} lado="derecha" />
      {showSearch && (
        <UniversalSearchModal
          accent={accent} onClose={() => setShowSearch(false)} buildContext={() => currentState}
          indice={indiceBusqueda} onIr={irAResultado}
          recientes={entradasRecientes} onRecordar={recordarBusqueda}
          onLimpiarRecientes={() => guardarRecientes([])}
        />
      )}

      {/* Fase de Seguridad Centralizada — el modal de "confirma tu PIN" (cambiar/desactivar PIN,
          quitar protección de una sección o función) flota por encima de cualquier pantalla desde
          la que se dispare, Seguridad incluida. */}
      {verificacion && (
        <VerificacionPinModal
          seguridad={seguridad} accent={accent} motivo={verificacion.motivo}
          onSuccess={verificacion.onSuccess} onCancel={() => setVerificacion(null)}
          onOlvidoPin={() => { setVerificacion(null); setRecuperandoPin(true); }}
        />
      )}
      {modalesRecuperacion}

      <div className="max-w-md mx-auto px-4 pt-16" style={{ paddingBottom: 100 }}>
        {renderTab()}
      </div>

      {/* Fase N1 — barra inferior fija de 5 pestañas (Inicio + 4 áreas). Pulsar un área siempre
          lleva a su hub (nunca directo a un módulo); el icono se resalta también mientras se está
          dentro de un módulo de esa área (areaActual), no solo en el propio hub. Nunca añadir una
          sexta pestaña — los módulos nuevos van dentro de un área existente (AREAS_NAV arriba). */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex justify-center"
        // FO Fase 4, apartado 10 — la barra sale del sistema de colores en vez de llevar
        // un rgba fijo, que además ignoraba el tema claro: en modo claro la barra era
        // negra igual. `navBgAlpha` respeta el tema y la transparencia elegida.
        style={{ background: COLORS.navBgAlpha || COLORS.surface, backdropFilter: 'blur(20px)', borderTop: `1px solid ${COLORS.border}` }}
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
