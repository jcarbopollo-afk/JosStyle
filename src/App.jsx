import React, { useState, useEffect } from 'react';
import { Home, Moon, Dumbbell, Wallet, Settings, Loader2, HeartPulse, Apple, MoreHorizontal, X, GraduationCap, Briefcase, ListTodo, Target, BookOpen, Library, Heart, Church, Smartphone, BarChart3, TrendingUp, Search, Trophy } from 'lucide-react';
import { COLORS, ACCENTS, DEFAULT_PERFIL, DEFAULT_ECONOMIA, DEFAULT_CALISTENIA, DEFAULT_SALUD, DEFAULT_NUTRICION, DEFAULT_ESTUDIOS, DEFAULT_NEGOCIO, DEFAULT_PRODUCTIVIDAD, DEFAULT_OBJETIVOS, DEFAULT_DIARIO, DEFAULT_BIBLIOTECA, DEFAULT_RELACION, DEFAULT_FE, DEFAULT_BIENESTAR, DEFAULT_PERSONALIZACION, METRICAS_FAVORITAS_DISPONIBLES, MAX_METRICAS_FAVORITAS, MODOS_APP } from './tokens';
import { getSession, onAuthChange, loadData, saveData, signOut, uploadProgressPhoto, deleteProgressPhoto, uploadTrainingVideo, deleteTrainingVideo, uploadBibliotecaArchivo, deleteBibliotecaArchivo } from './lib/supabase';
import { exportCSV, exportXLSX } from './lib/exportData';
import { uid, todayISO, hexToRgba } from './lib/helpers';
import { extractPdfText } from './lib/pdfText';
import { prediccionObjetivo } from './lib/predicciones';
import { PinGate, SuggestionsButton, UniversalSearchModal } from './components/ui';
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
import PersonalizationView, { ICONOS_PERSONALIZABLES_MAP } from './views/PersonalizationView';

// Con Salud y Nutrición ya son 7 secciones — demasiadas para una sola barra inferior cómoda.
// A partir de la Fase 4: 4 accesos rápidos + "Más", que lista el resto. Cada módulo nuevo futuro
// se añade a MORE_NAV, no a la barra — así la barra nunca vuelve a ir apretada. Estudios (Fase 6),
// Negocio (Fase 7), Productividad (Fase 8) y Objetivos (Fase 9) siguen ese mismo criterio.
const PRIMARY_NAV = [
  { id: 'hoy', label: 'Hoy', icon: Home },
  { id: 'sueno', label: 'Sueño', icon: Moon },
  { id: 'entreno', label: 'Entreno', icon: Dumbbell },
  { id: 'nutricion', label: 'Nutrición', icon: Apple },
];
const MORE_NAV = [
  { id: 'salud', label: 'Salud', icon: HeartPulse },
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

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.bg }}>
      <Loader2 className="animate-spin" size={28} style={{ color: ACCENTS[0].value }} />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = comprobando, null = sin sesión
  const [tab, setTab] = useState('hoy');
  const [loaded, setLoaded] = useState(false);
  const [accent, setAccent] = useState(ACCENTS[0].value);
  const [pin, setPin] = useState(null);
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
  const [history, setHistory] = useState([]);
  const [showMore, setShowMore] = useState(false);
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
      const [a, p, s, c, f, e, sal, sf, nut, cv, est, neg, prod, obj, dia, bib, bibArch, rel, feData, bien, pers, h] = await Promise.all([
        loadData(uidUser, 'ajustes', { accent: ACCENTS[0].value, pin: null }),
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
        loadData(uidUser, 'historial', []),
      ]);
      if (cancelled) return;
      setAccent(a.accent || ACCENTS[0].value);
      setPin(a.pin || null);
      setPerfil(p);
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
      setHistory(h);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [session]);

  if (session === undefined) return <LoadingScreen />;
  if (!session) return <Auth />;
  if (!loaded) return <LoadingScreen />;

  const uidUser = session.user.id;

  const updateAccent = async (color) => { setAccent(color); await saveData(uidUser, 'ajustes', { accent: color, pin }); };
  const updatePin = async (newPin) => { setPin(newPin); await saveData(uidUser, 'ajustes', { accent, pin: newPin }); };
  const updatePerfil = async (next) => { setPerfil(next); await saveData(uidUser, 'perfil', next); };

  // Fase 19 — Personalización total: igual que `ajustes` (accent/pin), es configuración de cómo
  // se ve/organiza la app, no "datos" — se guarda directo, sin pasar por snapshotAndSave/deshacer.
  const updatePersonalizacion = (next) => { setPersonalizacion(next); saveData(uidUser, 'personalizacion', next); };
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
  const ajustesNavItem = MORE_NAV.find((m) => m.id === 'ajustes');
  const ordenIds = personalizacion.orden.length
    ? [...personalizacion.orden.filter((id) => moreNavPersonalizables.some((m) => m.id === id)),
       ...moreNavPersonalizables.filter((m) => !personalizacion.orden.includes(m.id)).map((m) => m.id)]
    : moreNavPersonalizables.map((m) => m.id);
  const moreNavOrdenadoConIconos = ordenIds
    .map((id) => moreNavPersonalizables.find((m) => m.id === id))
    .filter(Boolean)
    .map((m) => ({ ...m, icon: ICONOS_PERSONALIZABLES_MAP[personalizacion.iconos[m.id]] || m.icon }));
  const moreNavVisible = [...moreNavOrdenadoConIconos.filter((m) => !personalizacion.ocultos.includes(m.id)), ajustesNavItem];

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
    switch (tab) {
      case 'hoy':
        return (
          <DashboardView
            perfil={perfil} sueno={sueno} calistenia={calistenia} futbol={futbol} economia={economia}
            relacion={relacion} favoritas={favoritasResueltas}
            productividad={productividad} estudios={estudios} modo={personalizacion.modo}
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
        return (
          <div className="space-y-4">
            <SettingsView
              perfil={perfil} onUpdatePerfil={updatePerfil} accent={accent} onUpdateAccent={updateAccent}
              onExportCSV={() => exportCSV(currentState)} onExportXLSX={() => exportXLSX(currentState)}
              onUndo={undo} canUndo={history.length > 0}
              pin={pin} onSetPin={updatePin}
              onSignOut={signOut}
            />
            <PersonalizationView
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
              accent={accent}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Fase 19: además de Relación (siempre protegida, Fase 12), cualquier módulo que Josué haya
  // marcado en Personalización avanzada (personalizacion.pinExtra) pasa por el mismo PinGate.
  const necesitaPin = tab === 'relacion' || personalizacion.pinExtra.includes(tab);
  const renderTab = () => (necesitaPin ? <PinGate pin={pin} accent={accent}>{renderContent()}</PinGate> : renderContent());

  return (
    <div style={{ '--accent': accent, background: COLORS.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
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

      <nav
        className="fixed bottom-0 left-0 right-0 flex justify-center"
        style={{ background: 'rgba(5,6,10,0.75)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${COLORS.border}` }}
      >
        <div className="max-w-md w-full flex px-2 py-2">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)} className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl">
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} style={{ color: active ? accent : COLORS.textMuted }} />
                <span style={{ fontSize: 10, fontWeight: 500, color: active ? accent : COLORS.textMuted }}>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowMore(true)}
            className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl"
          >
            <MoreHorizontal
              size={20}
              strokeWidth={MORE_NAV.some((m) => m.id === tab) ? 2.4 : 1.8}
              style={{ color: MORE_NAV.some((m) => m.id === tab) ? accent : COLORS.textMuted }}
            />
            <span style={{ fontSize: 10, fontWeight: 500, color: MORE_NAV.some((m) => m.id === tab) ? accent : COLORS.textMuted }}>Más</span>
          </button>
        </div>
      </nav>

      {showMore && (
        <div className="fixed inset-0 z-40 flex items-end" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowMore(false)}>
          <div
            className="w-full rounded-t-3xl p-4"
            style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.border}`, paddingBottom: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Más secciones</p>
              <button onClick={() => setShowMore(false)} className="p-1.5 rounded-full" style={{ background: COLORS.surface2 }} aria-label="Cerrar">
                <X size={14} style={{ color: COLORS.text }} />
              </button>
            </div>
            <div className="space-y-1">
              {moreNavVisible.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setTab(item.id); setShowMore(false); }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-3"
                    style={{ background: active ? hexToRgba(accent, 0.1) : 'transparent' }}
                  >
                    <Icon size={18} style={{ color: active ? accent : COLORS.textMuted }} />
                    <span className="text-sm font-medium" style={{ color: active ? accent : COLORS.text }}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
