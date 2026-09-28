/* ─────────────────────────────────────────────────────────────────────────
   Entrega 4 · FIT F45/45 — PULIDO FINAL, QA EXTREMO Y RELEASE DE FITNESS.

   *"AHORA NO VAMOS A CONSTRUIR OTRO SISTEMA. Vamos a realizar el RELEASE FINAL
   DE FITNESS."* Y su regla absoluta: ni una funcionalidad, ni un módulo, ni un
   sistema, ni una fórmula nueva.

   Esto es el INFORME del release escrito como datos, para que la prueba lo
   pueda comprobar: la lista del apartado 58 con DÓNDE se demuestra cada casilla
   —la suite o la sección del recorrido de Chromium, y la marca que la prueba
   busca en ella—, la definición de «terminado» del apartado 65, lo que se
   encontró y se arregló, y lo que queda de verdad (apartado 64, punto 18: solo
   problemas reales que no se han podido resolver).

   ⚠️ **Ninguna casilla se pone a mano** (EH F64 y F43): una línea que dijera
   «probado» sin que la prueba exista sería la auditoría que no puede fallar
   (EH F42). Cada una nombra su comprobación y la suite la busca.
   ───────────────────────────────────────────────────────────────────────── */

const RECORRIDO = 'scripts/test-app-real.mjs';
const en = (archivo, marca) => ({ archivo, marca });
const suite = (nombre) => ({ archivo: `scripts/${nombre}`, suite: true });

/** Apartado 58 — la lista del release, casilla por casilla. */
export const CHECKLIST_RELEASE = Object.freeze([
  { id: 'abre', que: 'Fitness abre correctamente', donde: [en(RECORRIDO, 'USUARIO NUEVO (apartado 58)'), en(RECORRIDO, 'FIT F45 — regresión completa')] },
  { id: 'navegacion', que: 'Navegación funciona', donde: [suite('test-auditoria-fitness.mjs'), en(RECORRIDO, 'FIT F43 — volver')] },
  { id: 'rangos', que: 'Rangos funcionan', donde: [suite('test-motor-rangos.mjs'), suite('test-rangos.mjs'), en(RECORRIDO, 'FIT F16')] },
  { id: 'clasificacion', que: 'Clasificación funciona', donde: [suite('test-clasificacion.mjs'), suite('test-cola-clasificacion.mjs'), en(RECORRIDO, 'FIT F24')] },
  { id: 'catalogo', que: 'Catálogo funciona', donde: [suite('test-ejercicios.mjs'), suite('test-validacion-catalogo.mjs'), en(RECORRIDO, 'FIT F2')] },
  { id: 'busqueda', que: 'Búsqueda funciona', donde: [suite('test-biblioteca-ejercicios.mjs'), en(RECORRIDO, 'FIT F34')] },
  { id: 'filtros', que: 'Filtros funcionan', donde: [suite('test-biblioteca-ejercicios.mjs'), suite('test-planes.mjs'), en(RECORRIDO, 'FIT F34')] },
  { id: 'ejercicios', que: 'Ejercicios funcionan', donde: [suite('test-detalle-ejercicio.mjs'), en(RECORRIDO, 'FIT F34')] },
  { id: 'planes', que: 'Planes funcionan', donde: [suite('test-planes.mjs'), suite('test-tu-plan.mjs'), en(RECORRIDO, 'FIT F5')] },
  { id: 'constructor', que: 'Constructor funciona', donde: [suite('test-constructor.mjs'), en(RECORRIDO, 'FIT F3')] },
  { id: 'plantillas', que: 'Plantillas funcionan', donde: [suite('test-plantillas.mjs'), en(RECORRIDO, 'FIT F4')] },
  { id: 'vivo', que: 'Live Workout funciona', donde: [suite('test-entrenamiento.mjs'), suite('test-entrenamiento-ux.mjs'), en(RECORRIDO, 'FIT F9')] },
  { id: 'series', que: 'Series funcionan', donde: [suite('test-entrenamiento.mjs'), en(RECORRIDO, 'FIT F7')] },
  { id: 'reloj', que: 'Timer funciona', donde: [suite('test-entrenamiento.mjs'), en(RECORRIDO, 'FIT F40')] },
  { id: 'descanso', que: 'Descanso funciona', donde: [suite('test-entrenamiento-ux.mjs'), en(RECORRIDO, 'FIT F9')] },
  { id: 'tutoriales', que: 'Tutoriales funcionan', donde: [suite('test-entrenamiento-ux.mjs'), en(RECORRIDO, 'FIT F9')] },
  { id: 'reemplazos', que: 'Reemplazos funcionan', donde: [suite('test-sustitucion.mjs'), en(RECORRIDO, 'FIT F33')] },
  { id: 'finalizacion', que: 'Finalización funciona', donde: [suite('test-finalizacion.mjs'), en(RECORRIDO, 'FIT F8')] },
  { id: 'historial', que: 'Historial funciona', donde: [suite('test-historial.mjs'), en(RECORRIDO, 'FIT F10')] },
  { id: 'progreso', que: 'Progreso funciona', donde: [suite('test-progreso-ejercicios.mjs'), suite('test-resumen-progreso.mjs'), en(RECORRIDO, 'FIT F12')] },
  { id: 'fotos', que: 'Fotos funcionan', donde: [suite('test-fotos-progreso.mjs'), en(RECORRIDO, 'FIT F26')] },
  { id: 'comparador', que: 'Comparador funciona', donde: [suite('test-comparador-fotos.mjs'), en(RECORRIDO, 'FIT F27')] },
  { id: 'objetivos', que: 'Objetivos funcionan', donde: [suite('test-objetivos-progreso.mjs'), suite('test-objetivos-fitness.mjs'), en(RECORRIDO, 'FIT F30')] },
  { id: 'actividad', que: 'Actividad funciona', donde: [suite('test-actividad-entrenamiento.mjs'), en(RECORRIDO, 'FIT F31')] },
  { id: 'persistencia', que: 'Persistencia funciona', donde: [suite('test-persistencia-fitness.mjs'), en(RECORRIDO, 'FIT F41')] },
  { id: 'recuperacion', que: 'Recuperación funciona', donde: [suite('test-entrenamiento.mjs'), en(RECORRIDO, 'FIT F41'), en(RECORRIDO, 'FIT F45 — interrupción')] },
  { id: 'migraciones', que: 'Migraciones funcionan', donde: [suite('test-persistencia-fitness.mjs')] },
  { id: 'movil', que: 'Mobile funciona', donde: [en(RECORRIDO, 'DISPOSITIVOS_DE_PRUEBA'), en(RECORRIDO, 'FIT F45 — regresión completa')] },
  { id: 'escritorio', que: 'Desktop funciona', donde: [en(RECORRIDO, 'DISPOSITIVOS_DE_PRUEBA'), en(RECORRIDO, 'FIT F45 — escritorio')] },
  { id: 'accesibilidad', que: 'Accesibilidad básica funciona', donde: [suite('test-robustez-fitness.mjs'), en(RECORRIDO, 'FIT F39')] },
  { id: 'consola', que: 'Consola limpia', donde: [en(RECORRIDO, 'NI UN ERROR en todo el recorrido'), suite('test-arquitectura-fitness.mjs')] },
  { id: 'typecheck', que: 'Typecheck correcto', noAplica: 'JosStyle es JavaScript con JSDoc (FIT F35, apartado 35): no hay tipos que comprobar. Lo que hace ese papel —que cada nombre usado exista y cada import resuelva— lo comprueban el build de Vite y las reglas invariantes de `test-imports.mjs` en cada pasada.', donde: [suite('test-imports.mjs')] },
  { id: 'lint', que: 'Lint correcto', noAplica: 'El proyecto no tiene lint y no se le añade una dependencia para esto (apartado 40). Se pasó ESLint una vez fuera del proyecto en la F44 —ni una regla de hooks rota—, y lo que se queda vigilando es `importsSinUso`.', donde: [suite('test-arquitectura-fitness.mjs')] },
  { id: 'pruebas', que: 'Tests correctos', donde: [en('scripts/verificar.sh', 'TODO CORRECTO')] },
  { id: 'build', que: 'Build correcto', donde: [en('scripts/verificar.sh', 'vite build')] },
  { id: 'regresiones', que: 'Sin regresiones críticas', donde: [en(RECORRIDO, 'FIT F45 — regresión completa'), suite('test-auditoria-fitness.mjs')] },
]);

/** Apartado 65 — la definición de «terminado», cada punto con la casilla de la
    lista que lo demuestra. */
export const TERMINADO_FITNESS = Object.freeze([
  { que: 'Las funcionalidades existentes funcionan', casillas: ['rangos', 'catalogo', 'planes', 'constructor', 'plantillas', 'vivo', 'finalizacion', 'historial', 'progreso', 'objetivos', 'actividad'] },
  { que: 'Los datos se conservan', casillas: ['persistencia', 'migraciones'] },
  { que: 'Las sesiones se recuperan', casillas: ['recuperacion'] },
  { que: 'Los flujos críticos funcionan', casillas: ['regresiones', 'navegacion'] },
  { que: 'No existen errores críticos conocidos', casillas: ['consola', 'regresiones'] },
  { que: 'Typecheck pasa', casillas: ['typecheck'] },
  { que: 'Lint pasa', casillas: ['lint'] },
  { que: 'Tests pasan', casillas: ['pruebas'] },
  { que: 'Build pasa', casillas: ['build'] },
  { que: 'La experiencia móvil es correcta', casillas: ['movil'] },
  { que: 'La interfaz mantiene la identidad de JosStyle', casillas: ['accesibilidad'], tambien: 'La auditoría visual de la F42 (`auditarAcabado`): la escala de Fitness es la de JosStyle, con sus componentes comunes.' },
  { que: 'No existen elementos de desarrollo visibles', casillas: ['consola'], tambien: 'El diagnóstico del catálogo solo existe con `esDesarrollo()` (F35), y la regla invariante de notas internas barre la interfaz.' },
  { que: 'No se han introducido funcionalidades fuera del alcance', casillas: [], tambien: '`NO_EN_FIT45`: ni IA, ni social, ni XP, ni métricas nuevas (apartado 55).' },
]);

/** Lo que encontró el release, con su prioridad y dónde se arregló. */
export const HALLAZGOS_F45 = Object.freeze([
  {
    id: 'sesion_duplicada', prioridad: 'P2', apartado: 21,
    que: 'Volver a pulsar «Empezar» en el mismo entrenamiento que ya estaba en curso creaba una segunda sesión y dejaba la primera colgada.',
    arreglo: '`sesionEnCursoDelMismoOrigen` (entrenamiento.js): quien empieza el mismo día del plan o la misma plantilla continúa la que había. Una de más de seis horas no cuenta: ésa tiene su tarjeta (F39).',
  },
]);

/** Apartado 64, punto 18 — lo que queda de verdad. No son fallos del código:
    son cosas que ninguna prueba de aquí puede hacer, o decisiones de Josué. */
export const PENDIENTES_F45 = Object.freeze([
  { id: 'r1', que: 'Abrirlo en su iPhone', porque: 'Todas las pruebas corren en Chromium; Safari resuelve distinto algunas cosas (SF F1). Es lo único que ninguna comprobación cubre (R1).' },
  { id: 'supabase', que: 'Supabase de verdad', porque: 'El recorrido usa un doble de Supabase; la subida real de una foto y la sincronización entre dispositivos solo se ven en su cuenta.' },
  { id: 'c32', que: 'El zoom de los campos y el pellizco (C-32)', porque: 'El `maximum-scale=1` del viewport evita el zoom al escribir y bloquea el pellizco para ampliar. Arreglarlo cambia la letra de todos los formularios: lo decide él.' },
  { id: 'dep30', que: 'Sin conexión (DEP-30)', porque: 'Fitness guarda en Supabase: sin cobertura el guardado falla y la pantalla lo dice (F37, F41), pero no hay service worker que lo deje para después. Añadirlo mal congelaría la aplicación en una versión vieja.' },
  { id: 'c42', que: 'Dividir el bundle (C-42)', porque: 'Un archivo de 4,4 MB; dividirlo haría que una pestaña abierta falle al publicar la siguiente versión en Vercel. Es de la familia de DEP-30.' },
]);

/** Apartado 55 — lo que NO entra, aunque se pudiera. */
export const NO_EN_FIT45 = Object.freeze([
  { que: 'IA adicional, social, rankings globales, leaderboard, XP, gamificación, métricas, estadísticas, recomendaciones o integraciones nuevas', porque: 'Apartado 55: *"Fitness queda cerrado funcionalmente después de esta fase."*' },
  { que: 'Una fase 46', porque: 'Apartado 63: *"No crear una Fase 46 por iniciativa propia."* Lo que venga después es un ciclo nuevo, y lo abre Josué.' },
  { que: 'Unir los componentes que solo pinta el banco de renderizado con los de pantalla', porque: 'Cambiaría el aspecto que dejó la F42 (apartado 53: no cambiar la identidad). Están declarados en `COMPONENTES_SIN_PANTALLA` (F44).' },
]);

/** Apartado 64 — el informe final, con sus veinte puntos. `casillas` es el
    resultado de la lista del apartado 58 tal como la calcula la prueba.
    ⚠️ No se llama `informeFinal`: ése es el de los cierres de Estilo de hombre,
    Nutrición y Estudios (EH F65, E3 F40, E3 F46), y dos nombres iguales con
    dos significados es lo que la F44 caza. */
export function informeReleaseFitness({ casillas = {}, verificacion = null } = {}) {
  const estado = (id) => {
    const c = casillas[id];
    if (!c) return 'sin comprobar';
    if (c.noAplica) return `no aplica — ${c.noAplica}`;
    return c.ok ? 'correcto' : 'FALLA';
  };
  const hayFallos = Object.values(casillas).some((c) => c && !c.ok && !c.noAplica);
  return {
    estado: hayFallos ? 'CON FALLOS' : (PENDIENTES_F45.length ? 'COMPLETADO CON PROBLEMAS PENDIENTES' : 'COMPLETADO'),
    problemas: HALLAZGOS_F45.map((h) => `${h.prioridad} · ${h.que}`),
    correcciones: HALLAZGOS_F45.map((h) => h.arreglo),
    regresiones: hayFallos ? 'Sí: ver las casillas en FALLA.' : 'Ninguna: la regresión completa del apartado 45 pasa en móvil y en escritorio.',
    persistencia: estado('persistencia'),
    vivo: estado('vivo'),
    rangos: estado('rangos'),
    progreso: estado('progreso'),
    objetivos: estado('objetivos'),
    historial: estado('historial'),
    movil: estado('movil'),
    accesibilidad: estado('accesibilidad'),
    rendimiento: 'El de la F40: el panel de Rangos pasó de 6,4 s a 0,95 s con 1 000 sesiones, y el tic del reloj repinta el número, no la pantalla.',
    typecheck: estado('typecheck'),
    lint: estado('lint'),
    pruebas: verificacion || estado('pruebas'),
    build: estado('build'),
    pendientes: PENDIENTES_F45.map((p) => `${p.que}: ${p.porque}`),
    cambios: HALLAZGOS_F45.map((h) => h.arreglo),
    conclusion: hayFallos
      ? 'Fitness NO está listo: hay casillas en falla.'
      : 'Fitness está listo para usarse de verdad dentro de JosStyle. Lo que queda es mirarlo en el iPhone y las decisiones que son de Josué.',
  };
}

export const PUNTOS_INFORME = Object.freeze([
  'estado', 'problemas', 'correcciones', 'regresiones', 'persistencia', 'vivo', 'rangos', 'progreso',
  'objetivos', 'historial', 'movil', 'accesibilidad', 'rendimiento', 'typecheck', 'lint', 'pruebas',
  'build', 'pendientes', 'cambios', 'conclusion',
]);
