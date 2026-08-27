// ---------------------------------------------------------------------------
// Prueba de humo: renderiza de verdad las vistas principales con datos reales
// y con datos vacíos, y falla si alguna lanza una excepción.
//
// POR QUÉ IMPORTA
// Hasta ahora, la única verificación posible en este proyecto era "compila".
// Compilar no detecta un `undefined.map()`, un `Object.keys(null)` ni un hook
// mal colocado — que son exactamente los errores que han aparecido varias veces
// en la historia del proyecto (ver el error de orden de Hooks de la Fase A3).
//
// Esto renderiza los componentes a HTML con react-dom/server. No sustituye a
// probar la app en un iPhone (no hay layout, ni gestos, ni navegador real),
// pero sí detecta el tipo de fallo que deja una pantalla en blanco.
//
// Se ejecuta mediante scripts/smoke.mjs, que lo compila antes con esbuild
// (Node no entiende JSX por sí mismo).
// ---------------------------------------------------------------------------
import React from 'react';
import { renderToString } from 'react-dom/server';

import DashboardView from '../src/views/DashboardView.jsx';
import SleepView from '../src/views/SleepView.jsx';
import FinanceView from '../src/views/FinanceView.jsx';
import ObjectivesView from '../src/views/ObjectivesView.jsx';
import DiaryView from '../src/views/DiaryView.jsx';
import StatsView from '../src/views/StatsView.jsx';
import PredictionsView from '../src/views/PredictionsView.jsx';
import ProductivityView from '../src/views/ProductivityView.jsx';
import RachasView, { ResumenRachaHoy, TarjetaRacha, Celebracion } from '../src/views/RachasView.jsx';
import HorarioView, { PanelAvanzado, FichaActividad, HoyView } from '../src/views/HorarioView.jsx';
import EstiloHombreView, { GestionarApartados, Recomendados, Plaquita, AsistenteEH, RetomarConfiguracion, YaLoSabemos, MisDatosEH, MiEstiloEH, PerfilCapilarEH, PanelPelo, RutinasPeloEH, SeguimientoPeloEH, AjustesPeloEH, RutinaDeHoy, RecomendacionesPeloEH, ProductosPeloEH, PeluqueriaEH } from '../src/views/EstiloHombreView.jsx';
import { registrarCorte, planificarCorte, alternarRecordatorio, anadirSitio, PARTE_PELUQUERIA } from '../src/lib/peluqueria.js';
import { crearRutina, marcarRutinaEntera, registrarCambio, alternarParte, datosPelo } from '../src/lib/rutinasPelo.js';
import { guardarRecomendacion, descartar, REGLAS_PELO } from '../src/lib/recomendacionesPelo.js';
import { crearProductoPelo, anadirTienda, marcarNoDisponible, crearPack } from '../src/lib/productosPelo.js';
import { contestarPelo, PREGUNTAS_PELO } from '../src/lib/perfilCapilar.js';
import { NO_LO_SE } from '../src/lib/cuestionarios.js';
import { alternarValor, anadirLibre } from '../src/lib/perfilEstilo.js';
import { guardarDato } from '../src/lib/datosEstiloHombre.js';
import { iniciarAsistente, irAPaso, marcarEnSeleccion, omitirAsistente, terminarAsistente } from '../src/lib/configuracionInicial.js';
import { DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, alternarModulo, guardarConfig } from '../src/lib/estiloDeHombre.js';
import { mochilaDeFecha, progresoMochila, marcarEstado } from '../src/lib/mochila.js';
import {
  tablonDelDia, crearAutomatizacion, previsualizar, ejecutar, historialDe, marcarCompletada,
} from '../src/lib/automatizaciones.js';
import { detectarSobrecarga } from '../src/lib/planificador.js';
import { registrarEnviado, centroDeAvisos } from '../src/lib/avisosHorario.js';
import { informe, recomendaciones } from '../src/lib/analiticaHorario.js';
import { crearMaterial, crearEnlaceMaterial } from '../src/lib/horarioDatos.js';
import { contextoTemporal, opcionesReprogramar } from '../src/lib/hoy.js';
import { fichaActividad, impactoEliminarActividad, editarActividad, crearActividadUnica } from '../src/lib/actividades.js';
import { archivarHorario, guardarCiclo, normalizarVisual } from '../src/lib/horarioEstructura.js';
import { DEFAULT_HORARIO_TOP } from '../src/lib/horario.js';
import { crearDesdePlantilla, crearBloqueRapido, editarBloque, ALCANCES } from '../src/lib/horarioEditor.js';
import AchievementsView from '../src/views/AchievementsView.jsx';
import HubView from '../src/views/HubView.jsx';
import WellbeingView from '../src/views/WellbeingView.jsx';
import BusinessView from '../src/views/BusinessView.jsx';
import PersonalizationView from '../src/views/PersonalizationView.jsx';
import PapeleraView from '../src/views/PapeleraView.jsx';
import { BloqueFondo, EditorFoto, BloqueLegibilidad, PaletaDetectada, BloqueRecomendado, BloquePresets, BloqueLegibilidadAuto, VistaPreviaGlobal } from '../src/views/SettingsView.jsx';
import ArmarioView, { PanelOutfits, PanelCalendario, PanelIdeas } from '../src/views/ArmarioView.jsx';

import {
  DEFAULT_PERFIL, DEFAULT_ECONOMIA, DEFAULT_CALISTENIA, DEFAULT_SALUD, DEFAULT_NUTRICION,
  DEFAULT_ESTUDIOS, DEFAULT_NEGOCIO, DEFAULT_PRODUCTIVIDAD, DEFAULT_OBJETIVOS, DEFAULT_DIARIO,
  DEFAULT_BIBLIOTECA, DEFAULT_RELACION, DEFAULT_FE, DEFAULT_BIENESTAR, DEFAULT_PERSONALIZACION,
  DEFAULT_NOTIFICACIONES, DEFAULT_CALENDARIO, DEFAULT_APARIENCIA, DEFAULT_TEMA_PERSONALIZADO, ACCENTS, COLORS,
} from '../src/tokens.js';
import { DEFAULT_PAPELERA } from '../src/lib/papelera.js';
import { DEFAULT_ARMARIO, crearPrenda, crearOutfit, crearUso } from '../src/lib/armario.js';
import { calcularResumenModulo } from '../src/lib/resumenesHub.js';
import { addDays } from '../src/lib/helpers.js';
import { ESTADO_INICIAL, crearRacha as crearRachaSrv, completarDia as completarDiaSrv } from '../src/lib/rachasServicio.js';
import { GAMIFICACION_INICIAL, evaluar as evaluarGam, EVENTOS_GAMIFICACION } from '../src/lib/rachasGamificacion.js';

const accent = ACCENTS[0].value;
const noop = () => {};
const datosPeloSmoke = (e5) => datosPelo(e5).rutinas[0].id;
const HOY = new Date().toISOString().slice(0, 10);
// RA Fase 1 — los dos días anteriores, para poder montar una racha de verdad en las
// pruebas. Se calculan con el mismo `addDays` que usa el motor, no a mano.
const AYER = addDays(HOY, -1);
const AYER2 = addDays(HOY, -2);

// --- Dos escenarios: usuario recién registrado y usuario con datos reales ---
const vacio = {
  perfil: DEFAULT_PERFIL, sueno: [], calistenia: DEFAULT_CALISTENIA, futbol: [],
  economia: DEFAULT_ECONOMIA, salud: DEFAULT_SALUD, nutricion: DEFAULT_NUTRICION,
  estudios: DEFAULT_ESTUDIOS, negocio: DEFAULT_NEGOCIO, productividad: DEFAULT_PRODUCTIVIDAD,
  objetivos: DEFAULT_OBJETIVOS, diario: DEFAULT_DIARIO, biblioteca: DEFAULT_BIBLIOTECA,
  relacion: DEFAULT_RELACION, fe: DEFAULT_FE, bienestar: DEFAULT_BIENESTAR,
  calendario: DEFAULT_CALENDARIO, personalizacion: DEFAULT_PERSONALIZACION,
  notificaciones: DEFAULT_NOTIFICACIONES, papelera: DEFAULT_PAPELERA,
  armario: DEFAULT_ARMARIO, apariencia: DEFAULT_APARIENCIA,
};

const lleno = {
  ...vacio,
  armario: (() => {
    const p1 = { ...crearPrenda({ nombre: 'Vaquero gris', categoria: 'pantalones', color: 'gris', marca: "Levi's", talla: '30' }), creadaEn: '2026-01-01T00:00:00Z' };
    const p2 = { ...crearPrenda({ nombre: 'Sudadera Nike', categoria: 'sudaderas', color: 'negro', marca: 'Nike', favorita: true, estado: 'lavanderia' }), creadaEn: '2026-02-01T00:00:00Z' };
    const o1 = { ...crearOutfit({ nombre: 'Casual gris', prendaIds: [p1.id, p2.id], ocasion: 'casual', lugar: 'Instituto', personas: ['Amigos'], favorito: true, descripcion: 'El de todos los días' }), creadoEn: '2026-03-01T00:00:00Z' };
    return {
      ...DEFAULT_ARMARIO,
      prendas: [p1, p2],
      outfits: [
        o1,
        // Un outfit con una prenda que YA NO EXISTE y otro sin ninguna: los dos casos
        // límite del apartado 4 y del 5 del cierre técnico, que tienen que pintarse sin
        // reventar ni dejar un hueco vacío.
        { ...crearOutfit({ nombre: 'Con prenda borrada', prendaIds: [p1.id, 'fantasma'] }), creadoEn: '2026-03-02T00:00:00Z' },
        { ...crearOutfit({ nombre: 'Sin prendas', prendaIds: [] }), creadoEn: '2026-03-03T00:00:00Z' },
      ],
      // AR Fase 3 — historial con los tres casos que el calendario tiene que saber pintar:
      // un uso normal, DOS el mismo día (la insignia con el número) y uno HUÉRFANO, cuyo
      // outfit ya no existe: ese debe decir "outfit eliminado", no reventar ni desaparecer.
      usos: [
        crearUso({ outfitId: o1.id, fecha: HOY, hora: '09:00', lugar: 'Instituto', personas: ['Jorge'], evento: 'universidad', notas: 'Día normal' }),
        crearUso({ outfitId: o1.id, fecha: HOY, hora: '21:00', evento: 'cena' }),
        crearUso({ outfitId: 'fantasma', fecha: HOY, evento: 'otro' }),
      ],
    };
  })(),
  // FO Fase 1 — un fondo configurado a la antigua: SIN los campos nuevos (velo, escala,
  // foto, analisis...). Es exactamente lo que devuelve `loadData` de una versión anterior,
  // y tiene que pintarse sin romperse (regla 5 del proyecto).
  apariencia: { ...DEFAULT_APARIENCIA, fondo: { tipo: 'degradado', activo: true, degradado: { de: '#123456', a: '#654321', angulo: 120 } } },
  sueno: [{ id: '1', fecha: HOY, horaDormir: '23:30', horaDespertar: '07:00', calidad: 4, notas: '' }],
  calistenia: { ...DEFAULT_CALISTENIA, Planche: { nivel: 35, progresion: [{ id: 'p', texto: 'Tuck', hecho: true }], prs: [{ id: 'r', fecha: HOY, valor: '20s' }], sesiones: [{ id: 's', fecha: HOY }] } },
  futbol: [{ id: 'f', fecha: HOY, resultado: '3-2' }],
  economia: { saldoInicial: 100, hucha: 50, movimientos: [{ id: 'm', fecha: HOY, tipo: 'gasto', cantidad: 12, concepto: 'Café' }] },
  salud: { medidas: [{ id: 'x', fecha: HOY, peso: 72, grasa: 12 }], historial: [] },
  nutricion: { comidas: [{ id: 'c', fecha: HOY, nombre: 'Avena', kcal: 350, prot: 12, carbs: 55, grasas: 8 }], agua: { [HOY]: 1500 }, favoritos: [] },
  // RA Fase 1 — el hábito ya no guarda `rachaActual` ni `mejorRacha`: la racha sale del
  // historial. Se dejan tres días seguidos para que la tarjeta enseñe una racha de verdad.
  productividad: { habitos: [{ id: 'h', nombre: 'Leer', historial: { [AYER2]: true, [AYER]: true, [HOY]: true } }], rutinas: [], tareas: [{ id: 't', texto: 'Repasar', hecha: false, fechaLimite: HOY }], metas: [], pomodoros: { [HOY]: 2 } },
  objetivos: { lista: [{ id: 'o', texto: 'Handstand 30s', plazo: '90 días', cumplido: false, fechaCreacion: HOY }], ultimaRevision: null },
  diario: { entradas: [{ id: 'd', fecha: HOY, animo: 4, comoMeSiento: 'Bien', queHeAprendido: 'Algo', queMejorareManana: 'Otra cosa' }] },
  relacion: { nombre: 'A', fechas: [{ id: 'r', etiqueta: 'Aniversario', fecha: HOY, tipo: 'aniversario', repetir: true }] },
  bienestar: { registros: [{ id: 'b', fecha: HOY, categoria: 'productivo', minutos: 60 }], reflexiones: [], sesiones: [{ id: 'z', fecha: HOY, minutos: 25 }] },
  negocio: { proyectos: [{ id: 'n', nombre: 'Idea', estado: 'Idea', notas: '', ingresos: 0, gastos: 0 }] },
  papelera: { retencionDias: 30, elementos: [
    { id: 'p1', modulo: 'productividad', coleccion: 'tareas', tipo: 'Tarea', icono: 'productividad', idOriginal: 't9', indice: 0, eliminadoEn: new Date().toISOString(), datos: { id: 't9', texto: 'Algo borrado' } },
    { id: 'p2', modulo: 'relacion', coleccion: 'fechas', tipo: 'Fecha importante', icono: 'relacion', privado: true, idOriginal: 'f9', indice: 0, eliminadoEn: new Date().toISOString(), datos: { id: 'f9', etiqueta: 'Privado' } },
  ] },
};

function propsDashboard(e) {
  return {
    ...e, favoritas: [], modo: null, derivadosCalendario: [],
    resumenes: Object.fromEntries(['salud', 'sueno', 'nutricion', 'entreno', 'calendario', 'estudios',
      'productividad', 'objetivos', 'diario', 'biblioteca', 'economia', 'negocio', 'relacion', 'fe',
      'bienestar', 'estadisticas', 'predicciones', 'logros', 'ajustes']
      .map((id) => [id, calcularResumenModulo(id, e)])),
    dashboardOcultos: [], modulosDesactivados: e.personalizacion.ocultos || [], onNavegar: noop, accent,
  };
}

// Catálogo reducido de módulos y áreas, con la misma forma que MORE_NAV/AREAS_NAV de App.jsx.
const MODULOS_PRUEBA = [
  { id: 'salud', label: 'Salud', icon: () => null },
  { id: 'sueno', label: 'Sueño', icon: () => null },
  { id: 'nutricion', label: 'Nutrición', icon: () => null },
  { id: 'economia', label: 'Economía', icon: () => null },
  { id: 'relacion', label: 'Relación', icon: () => null },
];
const AREAS_PRUEBA = [
  { id: 'area-salud', label: 'Salud', modulos: ['salud', 'sueno', 'nutricion'] },
  { id: 'area-gestion', label: 'Gestión', modulos: ['economia'] },
  { id: 'area-mas', label: 'Más', modulos: ['relacion'] },
];

const CASOS = [
  ['DashboardView', DashboardView, propsDashboard],
  ['SleepView', SleepView, (e) => ({ sueno: e.sueno, onAdd: noop, onDelete: noop, accent })],
  ['FinanceView', FinanceView, (e) => ({ economia: e.economia, onAdd: noop, onDelete: noop, onUpdate: noop, accent })],
  ['ObjectivesView', ObjectivesView, (e) => ({ objetivos: e.objetivos, onAdd: noop, onToggle: noop, onDelete: noop, onRevisar: noop, accent })],
  ['DiaryView', DiaryView, (e) => ({ diario: e.diario, onAdd: noop, onDelete: noop, accent })],
  ['StatsView', StatsView, (e) => ({ sueno: e.sueno, estudios: e.estudios, diario: e.diario, calistenia: e.calistenia, accent })],
  ['PredictionsView', PredictionsView, (e) => ({ objetivos: e.objetivos, productividad: e.productividad, salud: e.salud, calistenia: e.calistenia, economia: e.economia, estudios: e.estudios, accent })],
  ['AchievementsView', AchievementsView, (e) => ({ ...e, accent })],
  /* RA Fase 4 · apartado 36 — las pruebas visuales que pide, una por una. Se montan
     con el servicio real, no con datos inventados a mano: así, si el motor cambiara de
     forma, estas pruebas se enterarían. */
  ...(() => {
    // Una racha con N días seguidos que terminan hoy.
    const conDias = (n, extra = 0) => {
      let e = ESTADO_INICIAL;
      const c = crearRachaSrv(e, { tipo: 'training', nombre: 'Entreno' }, HOY);
      e = c.estado;
      // `extra` días en un tramo antiguo, para poder tener récord anterior.
      for (let i = 0; i < extra; i++) e = completarDiaSrv(e, { rachaId: c.racha.id, fecha: addDays(HOY, -40 - i) }).estado;
      for (let i = n - 1; i >= 0; i--) e = completarDiaSrv(e, { rachaId: c.racha.id, fecha: addDays(HOY, -i) }).estado;
      return { estado: e, id: c.racha.id };
    };
    const props = (estado, gam = GAMIFICACION_INICIAL, habitos = []) => ({
      rachas: estado, gamificacion: gam, habitos, accent, hoy: HOY,
      onCrearRacha: () => ({ error: null }), onCompletarDia: noop, onDeshacerDia: noop,
      onEliminarRacha: noop, onEvaluar: () => [],
    });

    const uno = conDias(1);
    const siete = conDias(7);
    const treinta = conDias(30);
    const record = conDias(9, 4);          // tramo viejo de 4, ahora 9 → récord batido
    const rota = (() => {
      let e = ESTADO_INICIAL;
      const c = crearRachaSrv(e, { tipo: 'study', nombre: 'Estudio' }, HOY); e = c.estado;
      for (let i = 8; i >= 6; i--) e = completarDiaSrv(e, { rachaId: c.racha.id, fecha: addDays(HOY, -i) }).estado;
      return e;
    })();
    const muchas = (() => {
      let e = ESTADO_INICIAL;
      for (const [tipo, nombre] of [['training', 'Entreno'], ['study', 'Estudio'], ['sleep', 'Sueño'], ['nutrition', 'Comer bien'], ['habits', 'Leer']]) {
        const c = crearRachaSrv(e, { tipo, nombre }, HOY); e = c.estado;
        for (let i = 0; i < 5; i++) e = completarDiaSrv(e, { rachaId: c.racha.id, fecha: addDays(HOY, -i) }).estado;
      }
      return e;
    })();
    const conLogros = evaluarGam(treinta.estado, GAMIFICACION_INICIAL, HOY).gamificacion;

    return [
      // Sin ninguna racha: el estado inicial, que no puede ser una pantalla vacía.
      ['RachasView · sin rachas', RachasView, () => props(ESTADO_INICIAL)],
      ['RachasView · un día', RachasView, () => props(uno.estado)],
      ['RachasView · siete días', RachasView, () => props(siete.estado)],
      // 30 días con sus logros ya desbloqueados: es donde más elementos hay a la vez.
      ['RachasView · treinta días con logros', RachasView, () => props(treinta.estado, conLogros)],
      ['RachasView · récord batido', RachasView, () => props(record.estado)],
      ['RachasView · racha rota', RachasView, () => props(rota)],
      ['RachasView · muchas rachas', RachasView, () => props(muchas)],
      // Rachas propias y hábitos juntos: la lista mezclada del Centro.
      ['RachasView · con hábitos', RachasView, (e) => props(siete.estado, GAMIFICACION_INICIAL, e.productividad.habitos)],
      // Un hábito solo, sin ninguna racha propia: no puede caer en el estado vacío.
      ['RachasView · solo hábitos', RachasView, (e) => props(ESTADO_INICIAL, GAMIFICACION_INICIAL, e.productividad.habitos)],

      // La tarjeta suelta, en sus dos formas.
      ['RachasView · tarjeta suelta', TarjetaRacha, () => ({
        resumen: { id: 'x', nombre: 'Entreno', actual: 17, record: 42, estado: 'activa', diasCumplidos: 50, tramos: [], batiendoRecord: false, porcentaje: 80, regla: 'Todos los días' },
        accent,
      })],
      ['RachasView · tarjeta compacta', TarjetaRacha, () => ({
        resumen: { id: 'x', nombre: 'Sueño', actual: 0, record: 0, estado: 'sin_datos', diasCumplidos: 0, tramos: [], batiendoRecord: false, porcentaje: 0, regla: 'Todos los días' },
        accent, compacta: true,
      })],

      // El resumen de Hoy: con racha viva se pinta, sin ninguna no.
      ['RachasView · resumen en Hoy', ResumenRachaHoy, () => ({ rachas: siete.estado, habitos: [], accent, hoy: HOY, onAbrir: noop })],

      // Apartado 19 — la celebración AGRUPADA: hito, récord y logro a la vez deben
      // salir en una sola tarjeta, no en tres avisos.
      ['RachasView · celebración agrupada', Celebracion, () => ({
        eventos: [
          { tipo: EVENTOS_GAMIFICACION.STREAK_MILESTONE_REACHED, hito: 30, celebracion: 'grande', nombre: 'Entreno', dias: 30 },
          { tipo: EVENTOS_GAMIFICACION.STREAK_PERSONAL_RECORD, nombre: 'Entreno', dias: 30, record: 30 },
          { tipo: EVENTOS_GAMIFICACION.ACHIEVEMENT_UNLOCKED, logroId: 'imparable', titulo: 'Imparable' },
        ],
        accent, onCerrar: noop,
      })],
    ];
  })(),

  /* HT Fase 3 · apartado 76 — los estados del editor que hay que poder pintar.
     Se montan con el editor real, no con datos escritos a mano. */
  ...(() => {
    const props = (estado, extra = {}) => ({
      horarioTop: estado, asignaturas: [{ id: 'a1', nombre: 'Física' }], accent, hoy: HOY,
      onCambiar: noop, onCrearHorario: noop, ...extra,
    });
    const base = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Instituto', plantillaId: 'colegio', hoy: HOY });
    const col = (d) => base.horario.columnas.find((c) => c.dia === d);
    const fila = (i) => base.horario.filas[i];

    let lleno = base.estado;
    for (const [dia, f, nombre] of [[1, 0, 'Matemáticas'], [1, 1, 'Biología'], [2, 0, 'Inglés'], [3, 2, 'Matemáticas']]) {
      lleno = crearBloqueRapido(lleno, { horarioId: base.horario.id, columnaId: col(dia).id, filaId: fila(f).id, texto: nombre, hoy: HOY }).estado;
    }
    // Un choque, para que se vea la marca de conflicto.
    const conChoque = crearBloqueRapido(lleno, {
      horarioId: base.horario.id, columnaId: col(1).id, inicio: '08:30', fin: '09:30', texto: 'Física', forzar: true, hoy: HOY,
    }).estado;
    // Y un cambio de un solo día, para que la vista de día lo marque.
    const conExcepcion = editarBloque(lleno, lleno.bloques[0].id, { inicio: '10:00', fin: '11:00' },
      { alcance: ALCANCES.SOLO_ESTE_DIA, fecha: HOY }).estado;
    const semanaCompleta = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Todo', plantillaId: 'semana', hoy: HOY }).estado;

    return [
      ['HorarioView · sin horario', HorarioView, () => props(DEFAULT_HORARIO_TOP)],
      ['HorarioView · recién creado', HorarioView, () => props(base.estado)],
      ['HorarioView · con clases', HorarioView, () => props(lleno)],
      ['HorarioView · con un choque', HorarioView, () => props(conChoque)],
      ['HorarioView · con un cambio de un día', HorarioView, () => props(conExcepcion)],
      // Siete columnas: es donde la cuadrícula tiene que hacer scroll sin perder
      // la columna de horas.
      ['HorarioView · semana completa', HorarioView, () => props(semanaCompleta)],
      // "Desde cero": ni columnas ni filas. No puede quedar un hueco roto.
      ['HorarioView · vacío del todo', HorarioView, () =>
        props(crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Mío', plantillaId: 'vacio', hoy: HOY }).estado)],
      // Dos horarios a la vez: sale el selector.
      ['HorarioView · dos horarios', HorarioView, () =>
        props(crearDesdePlantilla(lleno, { nombre: 'Gimnasio', tipo: 'entrenamiento', plantillaId: 'tarde', hoy: HOY }).estado)],

      /* HT Fase 4 — el panel avanzado y el callejón sin salida.
         Si TODOS los horarios están archivados, la pantalla se queda sin
         ninguno: tiene que seguir habiendo una forma de recuperarlos. */
      ['HorarioView · todos archivados', HorarioView, () =>
        props(archivarHorario(lleno, base.horario.id))],
      ['PanelAvanzado', PanelAvanzado, () => ({
        estado: lleno, horario: base.horario, accent, asignaturas: [{ id: 'a1', nombre: 'Física' }],
        visual: normalizarVisual(null), hoy: HOY, onVisual: noop, onCambiar: noop, onResultado: noop,
      })],
      // Con un ciclo A/B guardado y con la estructura rota, que es donde el
      // panel tiene que decir algo en castellano y no un `tipo` interno.
      ['PanelAvanzado · con ciclo A/B', PanelAvanzado, () => ({
        estado: guardarCiclo(lleno, base.horario.id, { semanas: 2, ancla: HOY }),
        horario: guardarCiclo(lleno, base.horario.id, { semanas: 2, ancla: HOY }).horarios[0],
        accent, asignaturas: [], visual: normalizarVisual({ densidad: 'compacto', zoom: 140 }),
        hoy: HOY, onVisual: noop, onCambiar: noop, onResultado: noop,
      })],
      /* HT Fase 5 — la ficha de actividad. Se monta con `fichaActividad` real:
         si el enlace con Estudios o el recuento de usos se rompiera, esto
         dejaría de renderizar. */
      ['FichaActividad', FichaActividad, () => {
        const act = lleno.actividades[0];
        const conDatos = editarActividad(lleno, act.id, {
          persona: 'Ana Ruiz', ubicacion: 'Lab 2.14', material: ['Bata'],
          notas: 'Preguntar por la recuperación', etiquetas: ['laboratorio'], favorita: true,
        });
        return {
          ficha: fichaActividad(conDatos, act.id, {
            estudios: { examenes: [] },
            productividad: { tareas: [{ id: 't1', texto: `Repasar ${act.nombre}`, hecha: false }] },
            acento: accent, hoy: HOY,
          }),
          impacto: impactoEliminarActividad(conDatos, act.id, { productividad: { tareas: [] } }),
          accent, onEditar: noop, onFavorita: noop, onArchivar: noop,
          onDuplicar: noop, onEliminar: noop, onCerrar: noop,
        };
      }],
      // Una actividad recién creada: sin días, sin profesor, sin nada. No puede
      // quedar una tarjeta con huecos ni con filas vacías.
      ['FichaActividad · sin nada todavía', FichaActividad, () => {
        const nueva = crearActividadUnica(base.estado, { nombre: 'Filosofía', hoy: HOY });
        return {
          ficha: fichaActividad(nueva.estado, nueva.actividad.id, { acento: accent, hoy: HOY }),
          impacto: impactoEliminarActividad(nueva.estado, nueva.actividad.id),
          accent, onEditar: noop, onFavorita: noop, onArchivar: noop,
          onDuplicar: noop, onEliminar: noop, onCerrar: noop,
        };
      }],
      ['HorarioView · con actividades y exámenes', HorarioView, () => props(lleno, {
        estudios: { asignaturas: [], examenes: [{ id: 'x1', asignaturaId: null, fecha: '2026-09-03', tema: 'Tema 3' }] },
        productividad: { tareas: [{ id: 't1', texto: 'Repasar Matemáticas', hecha: false }] },
      })],
      /* HT Fase 6 — HOY. Los cuatro estados que tiene que saber pintar, y el
         que más importa es el último: un día sin nada NO puede parecer una
         pantalla rota (apartado 69). */
      ...(() => {
        const propsHoy = (estado, extra = {}) => ({
          contexto: contextoTemporal(estado, { fecha: HOY, hoy: HOY, ahora: '09:30', ...extra }),
          accent, modo: 'completo', onModo: noop, opcionesFecha: opcionesReprogramar(HOY),
          onCompletarTarea: noop, onReprogramar: noop, onAbrirBloque: noop, onIrAFecha: noop,
        });
        const tareas = {
          tareas: [
            { id: 't1', texto: 'Vencida hace días', fecha: '2026-01-01', hecha: false },
            { id: 't2', texto: 'Para hoy', fecha: HOY, hecha: false },
            { id: 't3', texto: 'Sin fecha', hecha: false },
          ],
        };
        return [
          /* HT Fase 7 — la mochila dentro de HOY. El caso que más importa es el
             tercero: un material PERDIDO no se puede marcar, y tiene que
             pintarse tachado con su motivo en vez de desaparecer. */
          ...(() => {
            const libreta = crearMaterial({ nombre: 'Libreta', tipo: 'libreta', hoy: HOY });
            const bata = crearMaterial({ nombre: 'Bata', tipo: 'ropa', hoy: HOY });
            const act = lleno.actividades[0];
            const conMaterial = {
              ...lleno,
              materiales: [libreta, bata],
              enlacesMaterial: [
                crearEnlaceMaterial({ actividadId: act.id, materialId: libreta.id, obligatorio: true }),
                crearEnlaceMaterial({ actividadId: act.id, materialId: bata.id, obligatorio: false }),
              ],
            };
            const perdida = marcarEstado(conMaterial, bata.id, 'prestado', { prestadoA: 'Jorge' });
            const paquete = (e, f) => {
              const m = mochilaDeFecha(e, f);
              return { mochila: m, progreso: progresoMochila(m) };
            };
            const acciones = {
              marcar: noop, prepararTodo: noop, vaciar: noop, anadir: () => ({ error: null }), quitar: noop,
              marcarManana: noop, prepararTodoManana: noop, vaciarManana: noop,
              anadirManana: () => ({ error: null }), quitarManana: noop,
            };
            return [
              ['HoyView · con mochila', HoyView, () => ({
                ...propsHoy(conMaterial, { productividad: tareas }),
                mochilaHoy: paquete(conMaterial, HOY), mochilaManana: paquete(conMaterial, addDays(HOY, 1)),
                accionesMochila: acciones,
              })],
              ['HoyView · con material prestado', HoyView, () => ({
                ...propsHoy(perdida, { productividad: tareas }),
                mochilaHoy: paquete(perdida, HOY), mochilaManana: paquete(perdida, addDays(HOY, 1)),
                accionesMochila: acciones,
              })],
            ];
          })(),
          /* HT Fase 8 — el tablón con estados temporales y las
             automatizaciones. Lo que más importa es la distinción entre PASADA
             y COMPLETADA: las dos salen apagadas, pero la completada lleva su
             marca y la pasada sigue teniendo casilla. */
          ...(() => {
            const bata = crearAutomatizacion({
              nombre: 'Bata', accion: 'anadir_material', valor: 'Bata',
              condiciones: [{ tipo: 'actividad', valor: lleno.actividades[0]?.nombre || 'X' }],
            });
            const conAuto = { ...lleno, automatizaciones: [bata] };
            const hecho = ejecutar(conAuto, previsualizar(conAuto, HOY)[0] || { accion: 'avisar', valor: 'X' }, { fecha: HOY, ahora: '21:00' }).estado;
            const conHecha = marcarCompletada(lleno, { bloqueId: lleno.bloques[0].id }, HOY);
            const auto = (e) => ({
              propuestas: previsualizar(e, HOY), historial: historialDe(e).filter((h) => h.fecha === HOY),
              ejecutar: noop, ejecutarTodo: noop, deshacer: noop,
            });
            return [
              ['HoyView · con tablón y automatizaciones', HoyView, () => ({
                ...propsHoy(hecho, { productividad: tareas }),
                tablon: tablonDelDia(hecho, HOY, { hoy: HOY, ahora: '10:30' }),
                automatizaciones: auto(hecho), onCompletar: noop,
              })],
              // Una clase confirmada y otra solo terminada, a la vez.
              ['HoyView · pasada vs completada', HoyView, () => ({
                ...propsHoy(conHecha),
                tablon: tablonDelDia(conHecha, HOY, { hoy: HOY, ahora: '23:00' }),
                onCompletar: noop,
              })],
            ];
          })(),
          /* HT Fase 9 — el planificador. Los dos casos: con un examen que
             planificar, y con uno que ya no da tiempo a planificar (que no
             puede reñir ni quedarse en blanco). */
          ...(() => {
            const plani = (fechaExamen) => ({
              estado: lleno,
              examenes: [{ id: 'x1', fecha: fechaExamen, tema: 'Tema 1, Tema 2', asignatura: 'Biología' }],
              hoy: HOY, asignaturas: [],
              sobrecarga: detectarSobrecarga(lleno, { desde: HOY, dias: 7, hoy: HOY }),
              aplicar: () => ({ error: null }),
            });
            return [
              ['HoyView · con plan de estudio', HoyView, () => ({
                ...propsHoy(lleno, { productividad: tareas }), planificador: plani(addDays(HOY, 4)),
              })],
              ['HoyView · examen que es hoy', HoyView, () => ({
                ...propsHoy(lleno), planificador: plani(HOY),
              })],
            ];
          })(),
          /* HT Fase 10 — el centro de avisos. Con uno sin leer y otro leído, que
             es donde se ve que los sin leer van primero. */
          ...(() => {
            let conAvisos = registrarEnviado(lleno, { clave: 'k1', tipo: 'mochila', prioridad: 'alta', titulo: 'Prepara la mochila', cuerpo: 'Falta la bata' }, { ahora: '21:00', fecha: HOY });
            conAvisos = registrarEnviado(conAvisos, { clave: 'k2', tipo: 'estudio', prioridad: 'critica', titulo: 'Examen de Biología', cuerpo: 'Es mañana.' }, { ahora: '21:05', fecha: HOY });
            return [
              ['HoyView · con centro de avisos', HoyView, () => ({
                ...propsHoy(conAvisos, { productividad: tareas }),
                centroAvisos: centroDeAvisos(conAvisos),
                accionesAvisos: { leer: noop, archivar: noop, todosLeidos: noop },
              })],
            ];
          })(),
          /* HT Fase 11 — el informe. Los dos casos que importan: con datos, y
             SIN ellos (que no puede enseñar un 0 % que parezca un suspenso). */
          ...(() => {
            const conInf = (e) => {
              const inf = informe(e, { hoy: HOY, dias: 14 });
              return { informe: inf, recomendaciones: recomendaciones(inf) };
            };
            return [
              ['HoyView · con informe', HoyView, () => ({ ...propsHoy(lleno, { productividad: tareas }), analitica: conInf(lleno) })],
              ['HoyView · informe sin datos', HoyView, () => ({ ...propsHoy(DEFAULT_HORARIO_TOP), analitica: conInf(DEFAULT_HORARIO_TOP) })],
            ];
          })(),
          ['HoyView · con clases y pendientes', HoyView, () => propsHoy(lleno, { productividad: tareas })],
          ['HoyView · modo mínimo', HoyView, () => ({ ...propsHoy(lleno, { productividad: tareas }), modo: 'minimo' })],
          // El caso del apartado 69: nada programado. Y el del 39: un choque.
          ['HoyView · día sin nada', HoyView, () => propsHoy(DEFAULT_HORARIO_TOP)],
          ['HoyView · con un choque', HoyView, () => propsHoy(conChoque)],
        ];
      })(),
      // HT Fase 12 — el panel avanzado ahora tiene la pestaña de copia.
      /* EH Fases 1 y 2 — los TRES estados del apartado 13, que es lo único que
         la Fase 1 tenía que saber pintar (el tercero es el que más importa:
         configurado pero sin nada encendido NO puede ser una pantalla rota), más
         lo que añade la Fase 2: categorías, buscador con y sin resultados,
         ficha, aviso al desactivar y recomendados. */
      ...(() => {
        const GLOBAL_EH = {
          perfil: { nombre: 'Josué', fechaNacimiento: '2010-07-29', altura: 187, peso: 72, sexo: 'Masculino' },
          salud: { medidas: [{ fecha: HOY, peso: 73 }] }, objetivos: { lista: [{ id: 'o1' }] },
          calistenia: { Dominadas: { sesiones: [{ fecha: HOY }] } }, sueno: [{ fecha: HOY, horas: 8 }],
        };
        const props = (estado) => ({ estiloHombre: estado, accent, datosGlobales: GLOBAL_EH, onCambiar: noop });
        // EH Fase 5 — con un armario de verdad detrás, y con el módulo apagado.
        const conArmario = (estado) => ({ ...props(estado), armario: lleno.armario, onIr: noop });
        const conTres = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare', 'pelo', 'habitos'], { hoy: HOY });
        const todosLosIds = ['estilo', 'pelo', 'skincare', 'higiene', 'barba', 'cuerpo', 'fitness', 'sueno', 'salud', 'habitos', 'progreso', 'educacion', 'productos'];
        const conDatos = guardarConfig(conTres, 'skincare', { tipoPiel: 'mixta' });
        // EH Fase 3 — los cuatro pasos del asistente, más retomar y omitir.
        const arranque = iniciarAsistente(DEFAULT_ESTILO_HOMBRE, { hoy: HOY });
        const pasoAsist = (id) => ({
          estado: irAPaso(arranque, id), accent, datosGlobales: GLOBAL_EH, onCambiar: noop,
        });
        const conMarcados = marcarEnSeleccion(marcarEnSeleccion(irAPaso(arranque, 'seleccion'), 'skincare'), 'fitness');
        return [
          ['AsistenteEH · bienvenida', AsistenteEH, () => pasoAsist('bienvenida')],
          ['AsistenteEH · explicación', AsistenteEH, () => pasoAsist('explicacion')],
          ['AsistenteEH · selección vacía', AsistenteEH, () => pasoAsist('seleccion')],
          ['AsistenteEH · selección con marcados', AsistenteEH, () => ({
            estado: conMarcados, accent, datosGlobales: GLOBAL_EH, onCambiar: noop,
          })],
          ['AsistenteEH · final', AsistenteEH, () => ({
            estado: irAPaso(conMarcados, 'final'), accent, datosGlobales: GLOBAL_EH, onCambiar: noop,
          })],
          ['AsistenteEH · final sin nada elegido', AsistenteEH, () => pasoAsist('final')],
          /* ⚠️ La cuenta en blanco importa: el asistente NO puede enseñar "esto
             ya lo sabemos" cuando no sabemos nada. */
          ['AsistenteEH · sin datos globales', AsistenteEH, () => ({
            estado: irAPaso(arranque, 'explicacion'), accent, datosGlobales: {}, onCambiar: noop,
          })],
          ['RetomarConfiguracion · a medias', RetomarConfiguracion, () => ({
            estado: conMarcados, accent, onCambiar: noop,
          })],
          ['YaLoSabemos · con datos', YaLoSabemos, () => ({ datosGlobales: GLOBAL_EH, accent })],
          // EH Fase 4 — la capa de datos: lo global con candado, lo propio editable.
          ['MisDatosEH · sin nada propio', MisDatosEH, () => ({
            estado: conTres, accent, datosGlobales: GLOBAL_EH, onCambiar: noop, onCerrar: noop,
          })],
          ['MisDatosEH · con datos propios', MisDatosEH, () => ({
            estado: guardarDato(guardarDato(conTres, 'tipoPiel', 'mixta', { hoy: HOY }).estado,
              'tallaCamiseta', 'M', { hoy: '2025-11-01' }).estado,
            accent, datosGlobales: GLOBAL_EH, onCambiar: noop, onCerrar: noop,
          })],
          /* ⚠️ La cuenta en blanco: NADA puede salir como "undefined" ni "null"
             (apartado 15), y hay una prueba de Node que lo comprueba texto a texto. */
          ['MisDatosEH · sin datos globales', MisDatosEH, () => ({
            estado: conTres, accent, datosGlobales: {}, onCambiar: noop, onCerrar: noop,
          })],
          ['EstiloHombreView · omitido', EstiloHombreView, () => props(omitirAsistente(arranque, { hoy: HOY }))],
          ['EstiloHombreView · terminado por el asistente', EstiloHombreView, () =>
            props(terminarAsistente(conMarcados, { hoy: HOY }))],
          ['EstiloHombreView · con el armario conectado', EstiloHombreView, () =>
            conArmario(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['estilo', 'skincare']))],
          ['EstiloHombreView · armario apagado', EstiloHombreView, () =>
            conArmario(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare']))],
          ['EstiloHombreView · solo el armario', EstiloHombreView, () =>
            conArmario(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['estilo']))],
          // EH Fase 6 — el perfil de estilo: vacío (Test 7), relleno, y sin armario.
          ['MiEstiloEH · todo vacío', MiEstiloEH, () => ({
            estado: configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['estilo']), accent,
            armario: lleno.armario, datosGlobales: GLOBAL_EH, onCambiar: noop, onCerrar: noop,
          })],
          ['MiEstiloEH · con preferencias', MiEstiloEH, () => {
            let e2 = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['estilo']);
            e2 = alternarValor(e2, 'estilosFavoritos', 'casual', { hoy: HOY }).estado;
            e2 = alternarValor(e2, 'prioridadesEstilo', 'comodidad', { hoy: HOY }).estado;
            e2 = alternarValor(e2, 'prioridadesEstilo', 'precio', { hoy: HOY }).estado;
            e2 = alternarValor(e2, 'nivelEstilo', 'basico', { hoy: HOY }).estado;
            e2 = anadirLibre(e2, 'intereses', 'Fútbol', { hoy: HOY }).estado;
            return { estado: e2, accent, armario: lleno.armario, datosGlobales: GLOBAL_EH, onCambiar: noop, onCerrar: noop };
          }],
          /* ⚠️ Sin armario NO hay marcas que ofrecer, y la pantalla tiene que
             decirlo en vez de enseñar un hueco (apartado 5). */
          ['MiEstiloEH · sin armario', MiEstiloEH, () => ({
            estado: configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['estilo']), accent,
            armario: null, datosGlobales: {}, onCambiar: noop, onCerrar: noop,
          })],
          // EH Fase 7 — el perfil capilar: sin empezar, a medias con un "no lo sé", y entero.
          ['PerfilCapilarEH · sin empezar', PerfilCapilarEH, () => ({
            estado: configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['pelo']), accent,
            datosGlobales: GLOBAL_EH, onCambiar: noop, onCerrar: noop,
          })],
          ['PerfilCapilarEH · a medias con dudas', PerfilCapilarEH, () => {
            let e3 = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['pelo']);
            e3 = contestarPelo(e3, 'tipoPelo', NO_LO_SE, { hoy: HOY }).estado;
            e3 = contestarPelo(e3, 'cueroCabelludo', 'graso', { hoy: HOY }).estado;
            return { estado: e3, accent, datosGlobales: GLOBAL_EH, onCambiar: noop, onCerrar: noop };
          }],
          ['PerfilCapilarEH · contestado entero', PerfilCapilarEH, () => {
            let e3 = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['pelo']);
            PREGUNTAS_PELO.forEach((q) => { e3 = contestarPelo(e3, q.id, q.opciones[0].id, { hoy: HOY }).estado; });
            return { estado: e3, accent, datosGlobales: GLOBAL_EH, onCambiar: noop, onCerrar: noop };
          }],
          // EH Fase 8 — el panel de Pelo, sus rutinas y su seguimiento.
          ...(() => {
            const soloPelo = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['pelo']);
            const conRut = crearRutina(soloPelo, {
              nombre: 'Rutina de lavado', frecuencia: 'diaria',
              pasos: [{ accion: 'lavado', nombre: 'Champú' }, { accion: 'acondicionador' }],
            }, { hoy: HOY }).estado;
            const idR = datosPeloSmoke(conRut);
            const hecha = marcarRutinaEntera(conRut, idR, { hoy: HOY }).estado;
            const conCambios = registrarCambio(hecha, 'mejor', 'Lo noto menos seco.', { hoy: HOY }).estado;
            // Un perfil capilar de verdad, para que el motor de F9 tenga con qué.
            let conPerfilPelo = conCambios;
            /* eslint-disable no-unused-vars */
            [['tipoPelo', 'rizado'], ['necesidadesPelo', 'definicion'], ['necesidadesPelo', 'hidratacion'],
              ['cueroCabelludo', 'graso'], ['tiempoPelo', '10_20']]
              .forEach(([q, v]) => { conPerfilPelo = contestarPelo(conPerfilPelo, q, v, { hoy: HOY }).estado; });
            const cp1 = crearProductoPelo(conPerfilPelo, { nombre: 'Crema hidratante', marca: 'Genérica', categoria: 'hidratacion', precio: 9 }, { hoy: HOY });
            const conProductosPelo = crearProductoPelo(cp1.estado, { nombre: 'Crema de rizos', categoria: 'definicion' }, { hoy: HOY }).estado;
            const idProdSmoke = cp1.producto.id;
            const conEnlacePelo = anadirTienda(
              anadirTienda(conProductosPelo, idProdSmoke, { tipo: 'farmacia', nombre: 'Mi farmacia', url: 'https://ejemplo.test/a' }).estado,
              idProdSmoke, { tipo: 'amazon', nombre: 'Amazon', url: 'https://ejemplo.test/b', afiliado: true },
            ).estado;
            // EH F11 — dos cortes (para que haya intervalo) y una cita planificada.
            const conCortes = registrarCorte(
              registrarCorte(conPerfilPelo, { fecha: '2026-06-01', nota: 'Muy corto' }).estado,
              { fecha: '2026-07-06' },
            ).estado;
            const conCita = planificarCorte(conCortes, { modo: 'semanas', cantidad: 3, desde: HOY }).estado;
            const pp = (e4) => ({ estado: e4, accent, datosGlobales: GLOBAL_EH, onCambiar: noop, onCerrar: noop, onPerfil: noop });
            return [
              ['PanelPelo · sin nada', PanelPelo, () => pp(soloPelo)],
              ['PanelPelo · con rutina hecha', PanelPelo, () => pp(conCambios)],
              /* ⚠️ Con las partes apagadas la pantalla NO puede quedarse rota:
                 las plaquitas desaparecen y ya (apartado 15). */
              ['PanelPelo · con partes apagadas', PanelPelo, () =>
                pp(alternarParte(alternarParte(conRut, 'seguimiento'), 'rutinas'))],
              ['RutinasPeloEH · vacío', RutinasPeloEH, () => pp(soloPelo)],
              ['RutinasPeloEH · con una rutina', RutinasPeloEH, () => pp(conRut)],
              ['RutinaDeHoy · pendiente', RutinaDeHoy, () => ({ estado: conRut, accent, onCambiar: noop })],
              ['RutinaDeHoy · hecha', RutinaDeHoy, () => ({ estado: hecha, accent, onCambiar: noop })],
              ['SeguimientoPeloEH · sin datos', SeguimientoPeloEH, () => pp(soloPelo)],
              ['SeguimientoPeloEH · con historial', SeguimientoPeloEH, () => pp(conCambios)],
              ['AjustesPeloEH · las cuatro partes', AjustesPeloEH, () => pp(conRut)],
              // EH Fase 9 — el motor de recomendaciones: sin perfil, con perfil y descartada.
              ['RecomendacionesPeloEH · sin perfil', RecomendacionesPeloEH, () => pp(soloPelo)],
              ['RecomendacionesPeloEH · con perfil', RecomendacionesPeloEH, () => pp(conPerfilPelo)],
              ['RecomendacionesPeloEH · con una guardada', RecomendacionesPeloEH, () =>
                pp(guardarRecomendacion(conPerfilPelo, 'definicion_rizado', { hoy: HOY }).estado)],
              /* ⚠️ Con TODAS descartadas la pantalla no puede quedarse en blanco:
                 tiene que decir qué hacer (apartado 12). */
              ['RecomendacionesPeloEH · todas descartadas', RecomendacionesPeloEH, () =>
                pp(REGLAS_PELO.reduce((acc, rg) => descartar(acc, rg.id, 'no_verlo', { hoy: HOY }).estado, conPerfilPelo))],
              // EH Fase 10 — productos: sin ninguno, con los suyos, y uno no disponible.
              ['ProductosPeloEH · sin ninguno', ProductosPeloEH, () => pp(conPerfilPelo)],
              ['ProductosPeloEH · con productos', ProductosPeloEH, () => pp(conProductosPelo)],
              ['ProductosPeloEH · con enlace y afiliado', ProductosPeloEH, () => pp(conEnlacePelo)],
              /* ⚠️ Un producto no disponible NO desaparece: sale con su aviso y,
                 si las hay, con sus alternativas (apartado 10). */
              ['ProductosPeloEH · uno no disponible', ProductosPeloEH, () =>
                pp(marcarNoDisponible(conProductosPelo, idProdSmoke).estado)],
              ['ProductosPeloEH · con un pack', ProductosPeloEH, () =>
                pp(crearPack(conProductosPelo, 'Pack hidratación', [idProdSmoke], { hoy: HOY }).estado)],
              /* EH Fase 11 — peluquería. ⚠️ Los cuatro estados que la pantalla
                 tiene que saber pintar: sin nada, con historial, con una cita
                 planificada y con el aviso de eliminarla abierto. */
              ['PeluqueriaEH · sin nada', PeluqueriaEH, () => pp(conPerfilPelo)],
              ['PeluqueriaEH · con historial', PeluqueriaEH, () => pp(conCortes)],
              ['PeluqueriaEH · con cita', PeluqueriaEH, () => pp(conCita)],
              ['PeluqueriaEH · con recordatorio', PeluqueriaEH, () =>
                pp(alternarRecordatorio(conCita).estado)],
              ['PeluqueriaEH · con sitio', PeluqueriaEH, () =>
                pp(anadirSitio(conCortes, { nombre: 'Barbería del barrio', lugar: 'Calle Mayor' }).estado)],
              /* ⚠️ Apagar Peluquería oculta la plaquita y no rompe nada. */
              ['PanelPelo · sin peluquería', PanelPelo, () =>
                pp(alternarParte(conCita, PARTE_PELUQUERIA))],
              ['PanelPelo · con cita', PanelPelo, () => pp(conCita)],
            ];
          })(),
          ['EstiloHombreView · con Pelo activo', EstiloHombreView, () =>
            conArmario(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['pelo', 'skincare']))],
          ['EstiloHombreView · sin configurar', EstiloHombreView, () => props(DEFAULT_ESTILO_HOMBRE)],
          ['EstiloHombreView · con módulos', EstiloHombreView, () => props(conTres)],
          ['EstiloHombreView · configurado sin módulos', EstiloHombreView, () => props(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, []))],
          ['EstiloHombreView · con todos', EstiloHombreView, () => props(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, todosLosIds))],
          ['EstiloHombreView · con uno solo', EstiloHombreView, () => props(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['pelo']))],
          ['GestionarApartados · sin nada encendido', GestionarApartados, () => ({
            estado: DEFAULT_ESTILO_HOMBRE, accent, onCambiar: noop, onCerrar: noop,
          })],
          ['GestionarApartados · después', GestionarApartados, () => ({
            estado: conTres, accent, onCambiar: noop, onCerrar: noop,
          })],
          ['GestionarApartados · todo encendido', GestionarApartados, () => ({
            estado: configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, todosLosIds), accent, onCambiar: noop, onCerrar: noop,
          })],
          ['GestionarApartados · con datos guardados', GestionarApartados, () => ({
            estado: conDatos, accent, onCambiar: noop, onCerrar: noop,
          })],
          ['Recomendados · con sugerencias', Recomendados, () => ({ estado: conTres, accent, onAnadir: noop })],
          ['Plaquita · en modo ordenar', Plaquita, () => ({
            modulo: { id: 'pelo', nombre: 'Pelo', icono: '💇', sub: 'Corte y cuidado' }, accent,
            orden: { arriba: true, abajo: false, posicion: 2, de: 3 }, onSubir: noop, onBajar: noop,
          })],
          /* ⚠️ `Recomendados` sin nada que sugerir y `FichaModuloEH` no entran
             aquí, y por dos motivos distintos que conviene no confundir:
             el primero devuelve `null` a propósito (apartado 11: no se pinta una
             sección vacía con título) y este arnés cuenta un render vacío como
             fallo; el segundo usa `createPortal`, que necesita un `document` y
             `react-dom/server` no lo tiene. Los dos comportamientos están
             probados con Node en `test-gestion-modulos.mjs`. */
        ];
      })(),
      ['PanelAvanzado · con copia', PanelAvanzado, () => ({
        estado: lleno, horario: base.horario, accent, asignaturas: [],
        visual: normalizarVisual(null), hoy: HOY, onVisual: noop, onCambiar: noop, onResultado: noop,
      })],
      ['PanelAvanzado · horario sin días', PanelAvanzado, () => {
        const vacio = crearDesdePlantilla(DEFAULT_HORARIO_TOP, { nombre: 'Mío', plantillaId: 'vacio', hoy: HOY });
        return {
          estado: vacio.estado, horario: vacio.horario, accent, asignaturas: [],
          visual: normalizarVisual(null), hoy: HOY, onVisual: noop, onCambiar: noop, onResultado: noop,
        };
      }],
    ];
  })(),

  // RA Fase 1 — la lista de hábitos con su racha derivada. Antes no se renderizaba en
  // ninguna prueba, que es como un contador guardado podía mentir sin que nada avisara.
  ['ProductivityView', ProductivityView, (e) => ({
    productividad: e.productividad, accent,
    onAddHabito: noop, onUpdateHabito: noop, onDeleteHabito: noop,
    onAddRutina: noop, onUpdateRutina: noop, onDeleteRutina: noop,
    onAddTarea: noop, onToggleTarea: noop, onDeleteTarea: noop,
    onAddMeta: noop, onUpdateMeta: noop, onDeleteMeta: noop,
    onCompletarPomodoro: noop, foco: null, onFocoConsumido: noop,
  })],
  // Un hábito sin historial (recién creado) y otro con un hueco de un día: la regla con
  // margen no debe romperse por ese hueco, y ninguno de los dos puede reventar la vista.
  ['ProductivityView · hábitos límite', ProductivityView, () => ({
    productividad: {
      habitos: [
        { id: 'nuevo', nombre: 'Recién creado', historial: {} },
        { id: 'hueco', nombre: 'Con un fallo', historial: { [AYER2]: true, [HOY]: true } },
      ],
      rutinas: [], tareas: [], metas: [], pomodoros: {},
    },
    accent,
    onAddHabito: noop, onUpdateHabito: noop, onDeleteHabito: noop,
    onAddRutina: noop, onUpdateRutina: noop, onDeleteRutina: noop,
    onAddTarea: noop, onToggleTarea: noop, onDeleteTarea: noop,
    onAddMeta: noop, onUpdateMeta: noop, onDeleteMeta: noop,
    onCompletarPomodoro: noop, foco: null, onFocoConsumido: noop,
  })],
  ['WellbeingView', WellbeingView, (e) => ({ bienestar: e.bienestar, onAdd: noop, onDelete: noop, onAddReflexion: noop, onCompletarSesion: noop, accent })],
  ['BusinessView', BusinessView, (e) => ({ negocio: e.negocio, onAdd: noop, onUpdate: noop, onDelete: noop, accent })],
  ['ArmarioView', ArmarioView, (e) => ({
    armario: e.armario, onAddPrenda: noop, onUpdatePrenda: noop, onDeletePrenda: noop,
    onSubirFoto: async () => '', onAddOutfit: noop, onUpdateOutfit: noop,
    onDeleteOutfit: noop, onDuplicarOutfit: noop,
    onAddUso: noop, onUpdateUso: noop, onDeleteUso: noop, accent,
  })],
  // La pestaña de outfits aparte: `renderToString` no puede pulsar una pestaña, así que
  // sin esto la mitad de AR Fase 2 no se renderizaría nunca en las pruebas.
  ['ArmarioView · Outfits', PanelOutfits, (e) => ({
    outfits: e.armario.outfits, prendas: e.armario.prendas, usos: e.armario.usos,
    onAddOutfit: noop, onUpdateOutfit: noop, onDeleteOutfit: noop, onDuplicarOutfit: noop,
    onSubirFoto: async () => '', onAbrirPrenda: noop, onRegistrarUso: noop, accent,
  })],
  // Y la tercera pestaña, por el mismo motivo. El escenario "lleno" incluye un uso
  // huérfano a propósito: si el calendario diera por hecho que todo uso tiene outfit,
  // este caso lo dejaría en blanco o lo haría reventar, y aquí se ve.
  ['ArmarioView · Calendario', PanelCalendario, (e) => ({
    usos: e.armario.usos, outfits: e.armario.outfits, prendas: e.armario.prendas,
    hoyISO: HOY, onAddUso: noop, onUpdateUso: noop, onDeleteUso: noop, onAbrirOutfit: noop, accent,
  })],
  // Y la cuarta. El escenario "lleno" trae un uso huérfano y una prenda en la
  // lavandería: las estadísticas tienen que salir sin contarlos mal ni reventar.
  ['ArmarioView · Ideas', PanelIdeas, (e) => ({
    usos: e.armario.usos, outfits: e.armario.outfits, prendas: e.armario.prendas,
    hoyISO: HOY, onAbrirOutfit: noop, onAbrirPrenda: noop, onRegistrarUso: noop, accent,
  })],
  // FO Fase 1 — el bloque de fondo de Ajustes. Se renderiza aparte porque SettingsView
  // entera pide ~40 props; lo que hay que comprobar aquí es que el fondo se pinta con
  // cualquier configuración, incluida una guardada por una versión anterior.
  ['SettingsView · Fondo', BloqueFondo, (e) => ({
    fondo: e.apariencia.fondo, accent, onCambiar: noop,
    onSubirFoto: async () => '', urlFotoFondo: null,
  })],
  // FO Fase 2 — el estado con fotografía elegida, y el estado SIN foto todavía (apartado 10),
  // que es donde más fácil sería dejar un hueco roto.
  ['SettingsView · Fondo con foto', BloqueFondo, () => ({
    fondo: { ...DEFAULT_APARIENCIA.fondo, tipo: 'foto', activo: true, foto: { ...DEFAULT_APARIENCIA.fondo.foto, path: 'u/1.jpg', ancho: 1080, alto: 1920, proporcion: 0.5625 } },
    accent, onCambiar: noop, onSubirFoto: async () => '', urlFotoFondo: 'https://ejemplo/x.jpg',
  })],
  ['SettingsView · Fondo foto sin elegir', BloqueFondo, () => ({
    fondo: { ...DEFAULT_APARIENCIA.fondo, tipo: 'foto', activo: true },
    accent, onCambiar: noop, onSubirFoto: async () => '', urlFotoFondo: null,
  })],
  // FO Fase 12 — la lista de fotografías sustituidas. Se prueba con una ficha completa
  // y otra a medias (una foto elegida antes de esta fase, sin fecha ni medidas): ahí es
  // donde se vería una fecha inventada o un "0 × 0" si el texto no se cuidara.
  ['SettingsView · Fondo con anteriores', BloqueFondo, () => ({
    fondo: {
      ...DEFAULT_APARIENCIA.fondo, tipo: 'foto', activo: true,
      foto: { ...DEFAULT_APARIENCIA.fondo.foto, id: 'a', path: 'u/2.jpg', ancho: 1920, alto: 1080, proporcion: 1.7778 },
      fotosAnteriores: [
        { id: 'b', path: 'u/1.jpg', ancho: 1080, alto: 1920, sustituidaEn: '2026-08-01T10:00:00.000Z' },
        { id: 'c', path: 'u/0.jpg' },
      ],
    },
    accent, onCambiar: noop, onSubirFoto: async () => '', urlFotoFondo: 'https://ejemplo/x.jpg',
    onFirmarFoto: async () => 'https://ejemplo/mini.jpg',
  })],
  // FO Fase 4 — la transparencia, en sus dos extremos: opaca (como siempre) y muy
  // translúcida, que es cuando el aviso de legibilidad tiene que aparecer.
  ['SettingsView · Legibilidad', BloqueLegibilidad, () => ({
    tema: DEFAULT_TEMA_PERSONALIZADO, fondoActivo: false, accent, onCambiar: noop,
  })],
  ['SettingsView · Legibilidad translúcida', BloqueLegibilidad, () => ({
    tema: { ...DEFAULT_TEMA_PERSONALIZADO, superficieAlfa: 25, navegacionAlfa: 30, secundario: '#FF0000', bordeAlfa: 40, sombras: 28 },
    fondoActivo: true, accent, onCambiar: noop,
  })],
  // FO Fase 5 — la paleta detectada, con un análisis ya hecho y sellado. Sin
  // `urlFoto` el efecto no arranca, así que esto prueba el pintado, que es lo que
  // `renderToString` puede probar.
  ['SettingsView · Paleta detectada', PaletaDetectada, () => ({
    fondo: { ...DEFAULT_APARIENCIA.fondo, tipo: 'foto', activo: true, foto: { ...DEFAULT_APARIENCIA.fondo.foto, id: 'f1', path: 'u/1.jpg' } },
    urlFoto: null, accent, onAnalisis: noop,
    analisis: {
      fotoId: 'f1', monocromatica: false, suficiente: true,
      colores: [
        { hex: '#1B3A5C', peso: 0.5, tono: 'oscuro', saturacion: 'moderado', neutro: false },
        { hex: '#E8A33D', peso: 0.3, tono: 'claro', saturacion: 'vivo', neutro: false },
        { hex: '#7F7F7F', peso: 0.2, tono: 'medio', saturacion: 'neutro', neutro: true },
      ],
    },
  })],
  // Y una foto monocromática, que tiene su propio aviso.
  ['SettingsView · Paleta monocromática', PaletaDetectada, () => ({
    fondo: { ...DEFAULT_APARIENCIA.fondo, tipo: 'foto', activo: true, foto: { ...DEFAULT_APARIENCIA.fondo.foto, id: 'f2', path: 'u/2.jpg' } },
    urlFoto: null, accent, onAnalisis: noop,
    analisis: {
      fotoId: 'f2', monocromatica: true, suficiente: true,
      colores: [{ hex: '#111111', peso: 0.8, tono: 'oscuro', saturacion: 'neutro', neutro: true }],
    },
  })],
  // FO Fase 6 — las propuestas. Con un análisis real detrás, para que las cinco
  // estrategias se construyan de verdad y no solo se pinte un contenedor vacío.
  ['SettingsView · Recomendado', BloqueRecomendado, () => ({
    analisis: {
      fotoId: 'f1', monocromatica: false, suficiente: true,
      colores: [{ hex: '#1B4F8C', peso: 0.6, neutro: false, saturacionValor: 0.68, luminosidad: 0.33, tono: 'oscuro', saturacion: 'moderado', interes: 0.5 }],
      dominante: { hex: '#1B4F8C', peso: 0.6, neutro: false, saturacionValor: 0.68, luminosidad: 0.33 },
      acento: { hex: '#1B7FD4', peso: 0.1, neutro: false, saturacionValor: 0.78, luminosidad: 0.47 },
      secundario: { hex: '#8CA9C4', peso: 0.2, neutro: false, saturacionValor: 0.28, luminosidad: 0.66 },
      neutro: { hex: '#2B2B2B', peso: 0.1, neutro: true, saturacionValor: 0, luminosidad: 0.17 },
      claro: { hex: '#8CA9C4', luminosidad: 0.66 }, oscuro: { hex: '#101820', luminosidad: 0.08 },
      medio: '#3A5F86',
    },
    tema: DEFAULT_TEMA_PERSONALIZADO, accent, fondo: DEFAULT_APARIENCIA.fondo,
    modoOscuro: true, onProbar: noop, onAplicar: noop,
  })],
  // (Sin análisis, `BloqueRecomendado` no pinta NADA a propósito — un bloque de
  //  propuestas vacío sería un control decorativo. No se prueba aquí porque este
  //  arnés trata un render vacío como fallo; la aserción vive en
  //  `test-recomendador-apariencia.mjs`, que comprueba que `generarPropuestas`
  //  devuelve `posible: false`, que es justo lo que hace que no se pinte.)
  // FO Fase 8 — presets: uno propio favorito, uno propio normal, y los oficiales
  // que siempre están. Con la apariencia actual igual a la del primero, para que
  // se pinte también el estado "activo".
  ['SettingsView · Presets', BloquePresets, () => {
    const mio = {
      id: 'p1', nombre: 'Mi estilo', oficial: false, favorito: true, tema: 'oscuro',
      accent: '#C77C3A', temaPersonalizado: { ...DEFAULT_TEMA_PERSONALIZADO, superficieAlfa: 70 },
      fondo: { ...DEFAULT_APARIENCIA.fondo, tipo: 'predeterminado', activo: true, incluido: 'profundidad' },
    };
    // FO Fase 12 — uno de ellos lleva fotografía: la miniatura tiene que decirlo, o
    // parecería un degradado cualquiera (la miniatura no firma URLs).
    const conFoto = {
      ...mio, id: 'p3', nombre: 'Playa', favorito: false,
      fondo: { ...DEFAULT_APARIENCIA.fondo, tipo: 'foto', activo: true, foto: { ...DEFAULT_APARIENCIA.fondo.foto, id: 'z', path: 'u/9.jpg' } },
    };
    return {
      presets: [mio, { ...mio, id: 'p2', nombre: 'Gym', favorito: false }, conFoto],
      apariencia: { ...DEFAULT_APARIENCIA, tema: 'oscuro', fondo: mio.fondo },
      accent: '#C77C3A', temaPersonalizado: mio.temaPersonalizado,
      onGuardar: noop, onCambiarPresets: noop, onAplicar: noop, onEliminar: noop,
    };
  }],
  // Y sin ninguno propio: solo los oficiales, que nunca dejan la lista vacía.
  ['SettingsView · Presets solo oficiales', BloquePresets, () => ({
    presets: [], apariencia: DEFAULT_APARIENCIA, accent, temaPersonalizado: DEFAULT_TEMA_PERSONALIZADO,
    onGuardar: noop, onCambiarPresets: noop, onAplicar: noop, onEliminar: noop,
  })],
  // FO Fase 9 — legibilidad: el caso limpio (sin avisos) y el caso roto (texto
  // casi del color de la tarjeta, sobre una foto clara), que es donde se pintan
  // los avisos y el botón de arreglarlo.
  ['SettingsView · Legibilidad auto', BloqueLegibilidadAuto, () => ({
    colors: COLORS, fondo: DEFAULT_APARIENCIA.fondo, analisis: null,
    tema: DEFAULT_TEMA_PERSONALIZADO, accent, auto: false, onSetAuto: noop, onCorregir: noop,
  })],
  ['SettingsView · Legibilidad con avisos', BloqueLegibilidadAuto, () => ({
    colors: { ...COLORS, text: COLORS.surface, iconActive: COLORS.surface },
    fondo: { ...DEFAULT_APARIENCIA.fondo, tipo: 'foto', activo: true, foto: { ...DEFAULT_APARIENCIA.fondo.foto, id: 'f1', path: 'u/1.jpg' } },
    analisis: {
      fotoId: 'f1', monocromatica: false, suficiente: true, medio: '#EFEADF',
      colores: [{ hex: '#EFEADF', peso: 0.7, zona: 'centro', neutro: false, saturacionValor: 0.1, luminosidad: 0.9 }],
      dominante: { hex: '#EFEADF', peso: 0.7, zona: 'centro' },
    },
    tema: DEFAULT_TEMA_PERSONALIZADO, accent, auto: true, onSetAuto: noop, onCorregir: noop,
  })],
  // FO Fase 10 — la vista previa global, en sus dos extremos: sin fondo (la app
  // tal cual) y con una foto muy ajustada y tarjetas translúcidas, que es donde
  // se juntan todas las capas a la vez.
  ['SettingsView · Vista previa global', VistaPreviaGlobal, () => ({
    fondo: DEFAULT_APARIENCIA.fondo, urlFoto: null, accent,
  })],
  ['SettingsView · Vista previa con foto', VistaPreviaGlobal, () => ({
    fondo: {
      ...DEFAULT_APARIENCIA.fondo, tipo: 'foto', activo: true,
      foto: { ...DEFAULT_APARIENCIA.fondo.foto, id: 'f1', path: 'u/1.jpg' },
      escala: 140, desenfoque: 6, luminosidad: -35, overlay: { color: '', intensidad: 20 },
    },
    urlFoto: 'https://ejemplo/x.jpg', accent,
  })],
  // FO Fase 3 — el editor, con una foto ya muy ajustada: las tres capas (foto, luz
  // y overlay) tienen que pintarse a la vez sin romperse.
  ['SettingsView · Editor de foto', EditorFoto, () => ({
    fondo: {
      ...DEFAULT_APARIENCIA.fondo, tipo: 'foto', activo: true,
      foto: { ...DEFAULT_APARIENCIA.fondo.foto, id: 'f1', path: 'u/1.jpg', ancho: 1080, alto: 1920, proporcion: 0.5625 },
      escala: 180, encuadre: { x: 30, y: 15 }, desenfoque: 8, luminosidad: -45,
      opacidad: 85, overlay: { color: '#112233', intensidad: 25 },
    },
    accent, urlFoto: 'https://ejemplo/x.jpg', onGuardar: noop, onCerrar: noop, onCambiarFoto: noop,
  })],
  ['PersonalizationView', PersonalizationView, (e) => ({
    areas: AREAS_PRUEBA,
    modulos: MODULOS_PRUEBA,
    personalizacion: e.personalizacion,
    protectedAreas: [], onMove: noop, onToggleOculto: noop, onToggleDashboard: noop,
    onAplicarPerfil: noop, onSetIcono: noop,
    onTogglePinExtra: noop, onToggleFavorita: noop, onMoveFavorita: noop,
    modo: e.personalizacion.modo, onSetModo: noop, accent,
  })],
  ['PapeleraView', PapeleraView, (e) => ({
    papelera: e.papelera, relacionDesbloqueada: false,
    onRestaurar: noop, onEliminarDefinitivo: noop, onVaciar: noop, onSetRetencion: noop, accent,
  })],
  ['HubView', HubView, (e) => ({
    area: { id: 'area-salud', label: 'Salud', modulos: ['salud', 'sueno'] },
    modulos: [{ id: 'salud', label: 'Salud', icon: () => null }, { id: 'sueno', label: 'Sueño', icon: () => null }],
    personalizacion: e.personalizacion,
    resumenes: { salud: calcularResumenModulo('salud', e), sueno: calcularResumenModulo('sueno', e) },
    accent, onOpenModulo: noop,
  })],
];

// Tercer escenario: datos guardados a los que les faltan campos, tal y como
// llegarían de una versión anterior de la app. `loadData` no fusiona con el
// valor por defecto, así que este caso es real, no teórico — ya ha provocado
// tres fallos en la historia del proyecto (Perfil/A2, apariencia/A3,
// personalizacion/Dashboard) y un cuarto en DiaryView, encontrado justamente
// con esta prueba.
const parcial = {
  ...vacio,
  sueno: [{ id: '1', fecha: HOY }],
  diario: { entradas: [{ id: 'd', fecha: HOY }] },
  salud: { medidas: [{ id: 'x', fecha: HOY }], historial: [] },
  economia: { saldoInicial: 0, hucha: 0, movimientos: [{ id: 'm', fecha: HOY, tipo: 'gasto', cantidad: 5 }] },
  objetivos: { lista: [{ id: 'o', plazo: '30 días' }], ultimaRevision: null },
  productividad: { ...DEFAULT_PRODUCTIVIDAD, habitos: [{ id: 'h', nombre: 'X' }], tareas: [{ id: 't' }] },
  bienestar: { registros: [{ id: 'b', fecha: HOY }], reflexiones: [], sesiones: [] },
  negocio: { proyectos: [{ id: 'n' }] },
  relacion: { nombre: '', fechas: [{ id: 'r', fecha: HOY }] },
  // Entrega 2 · AR Fase 1 — una prenda a medio rellenar: sin marca, sin talla y sin foto.
  // Es el caso normal de verdad, porque la especificación insiste en que añadir una prenda
  // tiene que poder hacerse en segundos con solo tres campos.
  armario: { ...DEFAULT_ARMARIO, prendas: [{ id: 'pr', nombre: 'Camiseta', categoria: 'camisetas', color: 'negro', estado: 'disponible' }] },
};

// Cuarto escenario: con módulos desactivados desde el centro de módulos (Entrega 2 · ME Fase 1).
// Es el comportamiento central de esa fase: la interfaz debe reconstruirse sola, sin dejar
// encabezados vacíos ni tarjetas huérfanas, y sin reventar por quedarse sin nada que pintar.
const desactivados = {
  ...lleno,
  personalizacion: {
    ...DEFAULT_PERSONALIZACION,
    ocultos: ['sueno', 'economia', 'productividad', 'objetivos', 'relacion', 'nutricion',
              'salud', 'estudios', 'entreno', 'calendario', 'diario', 'negocio',
              'biblioteca', 'fe', 'bienestar', 'estadisticas', 'predicciones', 'logros'],
  },
};

// Un `<button>` dentro de otro `<button>` es HTML inválido, no revienta el render y en iOS
// hace que el toque del botón interior se lo coma el exterior. Se encontró en BI Fase 1, al
// meter los selectores de situación dentro de un indicador que era él mismo un botón. Como es
// un fallo silencioso y fácil de repetir, se comprueba en todas las vistas y escenarios.
function botonesAnidados(html) {
  let profundidad = 0;
  for (const etiqueta of html.match(/<\/?button\b/g) || []) {
    if (etiqueta === '<button') { profundidad++; if (profundidad > 1) return true; }
    else profundidad--;
  }
  return false;
}

let fallos = 0;
for (const [nombre, Componente, props] of CASOS) {
  for (const [etiqueta, estado] of [['vacío', vacio], ['con datos', lleno], ['datos parciales', parcial], ['todo desactivado', desactivados]]) {
    try {
      const html = renderToString(React.createElement(Componente, props(estado)));
      if (typeof html !== 'string' || html.length === 0) throw new Error('render vacío');
      if (botonesAnidados(html)) throw new Error('tiene un <button> dentro de otro <button>');
      console.log(`  ✓ ${nombre} (${etiqueta})`);
    } catch (e) {
      console.error(`  ✗ ${nombre} (${etiqueta}) → ${e.message}`);
      fallos++;
    }
  }
}

console.log('');
if (fallos) { console.error(`═══ ${fallos} VISTA(S) FALLAN AL RENDERIZAR ═══\n`); process.exit(1); }
console.log('═══ TODAS LAS VISTAS RENDERIZAN ═══\n');
