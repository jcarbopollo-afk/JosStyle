/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F16 — ESTADOS DE SISTEMA, CARGA, ERROR, SIN CONEXIÓN,
   GUARDADO Y TRANSICIONES ASÍNCRONAS

   *"Cuando algo está cargando: se entiende. Cuando algo cambia: se percibe.
   Cuando algo falla: se comunica. Cuando algo se sincroniza: se confirma."*

   La decisión vive aquí y se prueba en Node; lo que toca el DOM está en
   `src/components/estadosAsincronos.jsx` (el indicador de arriba, la pantalla
   de arranque que no puede cargar), `vacioMotion.js` (el vacío que llega
   después del contenido) y `App.jsx`. La cuenta de lo que se carga y se guarda
   es `sincronizacion.js`, una hoja del árbol que importa `supabase.js`.

   ⚠️ **JosStyle ya era una aplicación optimista sin saberlo**: cada cambio es
   `setX(nuevo)` + `saveData(clave, nuevo)`, la pantalla primero y la cuenta
   después (apartado 14). Lo que faltaba no era la UI optimista: era saber si
   había llegado, decirlo cuando no, y no pisar lo que no se ha cargado.
   =========================================================================== */
import { DURACIONES_MOTION } from './motion';
import { RETARDO_INDICADOR_MS } from './estadosInteraccion';

/* ───────────────────────────────────────────────────────────────────────────
   1 · LA MÁQUINA DE ESTADOS (apartados 2 y 60)

   *"Evitar booleanos contradictorios como isLoading = true, isError = true,
   isSaved = true simultáneamente."* Una operación está en UN estado, y solo se
   llega a otro por un evento que tenga sentido desde ahí. Un evento que no lo
   tiene —un «éxito» que llega después de cancelar— se ignora: es lo que impide
   que una respuesta vieja devuelva la pantalla a un estado que ya no es.
   ─────────────────────────────────────────────────────────────────────────── */
export const ESTADOS_ASINCRONOS = Object.freeze([
  { id: 'idle', nombre: 'En reposo', como: 'Su aspecto de siempre.' },
  { id: 'loading', nombre: 'Cargando', como: 'Nada durante el retardo (`RETARDO_INDICADOR`); después, el esqueleto de su forma o un giro con texto.' },
  { id: 'success', nombre: 'Listo', como: 'El contenido entra en el sitio del esqueleto: sin un segundo salto.' },
  { id: 'error', nombre: 'Ha fallado', como: 'Donde se esperaba el resultado, con qué hacer. Nunca la pantalla entera por un trozo (apartado 19).' },
  { id: 'retrying', nombre: 'Reintentando', como: 'Lo de antes se queda; el botón dice «Guardando…» o «Cargando…» (F9).' },
  { id: 'cancelled', nombre: 'Cancelado', como: 'Vuelve a reposo sin dejar un giro huérfano (apartado 40).' },
  { id: 'saving', nombre: 'Guardando', como: 'El cambio ya se ve; si tarda, el indicador de arriba lo dice.' },
  { id: 'saved', nombre: 'Guardado', como: 'Nada, normalmente (guardar sale bien decenas de veces). «Guardado» un momento solo después de haber dicho que tardaba o que faltaba algo.' },
  { id: 'pending', nombre: 'Sin guardar', como: 'El cambio sigue en pantalla y el indicador lo dice, con «Guardar ahora».' },
  { id: 'offline', nombre: 'Sin conexión', como: 'Una señal pequeña arriba, sin animación global (apartado 30).' },
]);

export const TRANSICIONES_ASINCRONAS = Object.freeze({
  idle: { cargar: 'loading', guardar: 'saving' },
  loading: { exito: 'success', fallo: 'error', cancelar: 'cancelled' },
  success: { cargar: 'loading', guardar: 'saving' },
  error: { reintentar: 'retrying', cancelar: 'cancelled', cargar: 'loading' },
  retrying: { exito: 'success', fallo: 'error', cancelar: 'cancelled' },
  cancelled: { cargar: 'loading', guardar: 'saving' },
  saving: { exito: 'saved', fallo: 'pending', sinConexion: 'pending' },
  saved: { guardar: 'saving', cargar: 'loading' },
  pending: { reintentar: 'saving', guardar: 'saving' },
  offline: { reconectar: 'saving', guardar: 'pending' },
});

/** El estado siguiente; un evento que no tiene sentido desde el actual se ignora. */
export function siguienteEstadoAsincrono(estado, evento) {
  const desde = TRANSICIONES_ASINCRONAS[estado] ? estado : 'idle';
  return TRANSICIONES_ASINCRONAS[desde][evento] || desde;
}

/* ───────────────────────────────────────────────────────────────────────────
   2 · LOS TIEMPOS (apartados 9, 11, 12 y 13)

   Cuándo se dice algo y cuánto se queda. ⚠️ No son duraciones de animación
   —esas son los tokens de la F1—: son umbrales de estado. Los que dependen de
   una animación salen de ella.
   ─────────────────────────────────────────────────────────────────────────── */
export const TIEMPOS_ASINCRONOS = Object.freeze({
  /** Un botón que carga enseña su giro a partir de aquí (F9): menos sería un parpadeo. */
  retardoIndicador: RETARDO_INDICADOR_MS,
  /** Un guardado normal tarda 100-400 ms con cobertura. Decir «Guardando…» arriba en cada toque
   *  sería una consola de servidor (apartado 28): solo si pasa de esto. */
  guardandoTras: 1200,
  /** Una caída de un segundo no merece un aviso: sin conexión se dice si dura. */
  sinConexionTras: 1200,
  /** Lo que aparece se queda al menos esto, aunque deje de hacer falta antes: sin destellos (apartado 12). */
  minimoVisible: 900,
  /** «Guardado», un momento, para leerlo. */
  guardadoVisible: 1800,
  /** El esqueleto del arranque deja de latir en silencio: dice que tarda (apartado 9)… */
  esqueletoTarda: 8000,
  /** …y ofrece volver a intentarlo. */
  esqueletoReintentar: 20000,
  /** Un estado vacío que llega DESPUÉS del contenido espera a que lo de antes se haya ido (apartado 23). */
  vacioTrasSalida: DURACIONES_MOTION.fast,
});

/* ───────────────────────────────────────────────────────────────────────────
   3 · EL INDICADOR DE ARRIBA (apartados 26-33)

   Un solo sitio de toda la aplicación que dice cómo va lo guardado: discreto,
   rápido, y **nada cuando todo va bien** —la mayoría del tiempo—. Lo que
   enseña sale del resumen de `sincronizacion.js` y de la conexión, por orden
   de importancia.
   ─────────────────────────────────────────────────────────────────────────── */
export const NOMBRES_DE_CLAVE = Object.freeze({
  ajustes: 'Ajustes', perfil: 'tu perfil', sueno: 'Sueño', calistenia: 'Calistenia', futbol: 'Fútbol',
  economia: 'Economía', salud: 'Salud', saludFotos: 'las fotos de progreso', nutricion: 'Nutrición',
  calisteniaVideos: 'los vídeos de calistenia', estudios: 'Estudios', negocio: 'Negocio', productividad: 'Productividad',
  objetivos: 'Objetivos', calendario: 'el Calendario', diario: 'el Diario', biblioteca: 'la Biblioteca',
  bibliotecaArchivos: 'los documentos', relacion: 'Relación', fe: 'Fe', bienestar: 'Bienestar digital',
  personalizacion: 'la personalización', notificaciones: 'los avisos', historialColor: 'los colores recientes',
  temaPersonalizado: 'tu tema', temasGuardados: 'tus temas', historial: 'el historial de cambios', papelera: 'Eliminados recientemente',
  armario: 'el Armario', rachas: 'las rachas', gamificacionRachas: 'los logros de las rachas', audio: 'el sonido',
  horarioTop: 'el Horario', estiloHombre: 'Imagen personal', fitness: 'Fitness',
});

export const nombreDeClave = (clave) => NOMBRES_DE_CLAVE[clave] || 'una parte de tus datos';

const cambios = (n) => `${n} ${n === 1 ? 'cambio' : 'cambios'}`;

/** Lo que dice cada estado del indicador. `accion` es lo que hace su botón, si tiene. */
export const ESTADOS_INDICADOR = Object.freeze([
  { id: 'sin_cargar', prioridad: 1, tono: 'error', rol: 'alert', accion: { id: 'recargar', texto: 'Volver a cargar' } },
  { id: 'pendiente', prioridad: 2, tono: 'aviso', rol: 'status', accion: { id: 'guardar', texto: 'Guardar ahora' } },
  { id: 'pendiente_sin_conexion', prioridad: 2, tono: 'aviso', rol: 'status', accion: null },
  { id: 'sin_conexion', prioridad: 3, tono: 'neutro', rol: 'status', accion: null },
  { id: 'guardando', prioridad: 4, tono: 'neutro', rol: 'status', accion: null },
  { id: 'guardado', prioridad: 5, tono: 'bien', rol: 'status', accion: null },
  { id: 'oculto', prioridad: 9, tono: 'neutro', rol: 'status', accion: null },
]);
const indicador = (id) => ESTADOS_INDICADOR.find((e) => e.id === id);

function textosDe(id, resumen) {
  const n = resumen.pendientes.length;
  const sinCargar = resumen.sinCargar;
  switch (id) {
    case 'sin_cargar':
      return {
        texto: sinCargar.length === 1 ? `No se ha podido cargar ${nombreDeClave(sinCargar[0])}` : `No se han podido cargar ${sinCargar.length} apartados`,
        detalle: 'Para no pisar lo que tienes guardado, ahí no se guarda nada hasta volver a cargar.',
      };
    case 'pendiente':
      return {
        texto: `${cambios(n)} sin guardar`,
        detalle: resumen.motivos.includes('sin_espacio')
          ? 'No caben en tu cuenta. Siguen en esta pantalla.'
          : 'Siguen en esta pantalla. Si cierras la app antes, se pierden.',
      };
    case 'pendiente_sin_conexion':
      return { texto: `Sin conexión · ${cambios(n)} esperando`, detalle: 'Se guardarán solos al volver, si no cierras la app.' };
    case 'sin_conexion':
      return { texto: 'Sin conexión', detalle: 'Puedes seguir; lo que cambies se guardará al volver.' };
    case 'guardando':
      return { texto: 'Guardando…', detalle: null };
    case 'guardado':
      return { texto: 'Guardado', detalle: null };
    default:
      return { texto: '', detalle: null };
  }
}

/**
 * Qué toca enseñar AHORA, sin memoria: lo más importante de lo que pasa.
 * `revisarEn`: dentro de cuánto puede cambiar la decisión sin que llegue
 * ningún aviso (un guardado que pasa a ser lento, una caída que pasa a durar).
 */
export function estadoDeSincronizacion({ resumen, enLinea = true, sinConexionDesde = null, ahora = Date.now() } = {}) {
  const r = resumen || { sinCargar: [], pendientes: [], motivos: [], guardando: 0, guardandoDesde: null, reintentando: false, confirmadoEn: 0 };
  const T = TIEMPOS_ASINCRONOS;
  let id = 'oculto';
  let revisarEn = null;
  const caidaLarga = !enLinea && sinConexionDesde !== null && ahora - sinConexionDesde >= T.sinConexionTras;
  if (!enLinea && sinConexionDesde !== null && !caidaLarga) revisarEn = sinConexionDesde + T.sinConexionTras - ahora;
  const lento = r.guardando > 0 && r.guardandoDesde !== null && ahora - r.guardandoDesde >= T.guardandoTras;
  if (r.guardando > 0 && !lento && r.guardandoDesde !== null) {
    const falta = r.guardandoDesde + T.guardandoTras - ahora;
    revisarEn = revisarEn === null ? falta : Math.min(revisarEn, falta);
  }
  const reciente = r.confirmadoEn && ahora - r.confirmadoEn < T.guardadoVisible;
  if (reciente) {
    const falta = r.confirmadoEn + T.guardadoVisible - ahora;
    revisarEn = revisarEn === null ? falta : Math.min(revisarEn, falta);
  }
  if (r.sinCargar.length) id = 'sin_cargar';
  else if (r.pendientes.length && !enLinea) id = 'pendiente_sin_conexion';
  else if (r.reintentando || lento) id = 'guardando';
  else if (r.pendientes.length) id = 'pendiente';
  else if (caidaLarga) id = 'sin_conexion';
  else if (reciente) id = 'guardado';
  return { ...contenidoDeIndicador(id, r), revisarEn: revisarEn === null ? null : Math.max(0, revisarEn) };
}

/** Lo que se pinta de un estado del indicador: su tono, su rol, su botón y sus frases. */
export function contenidoDeIndicador(id, resumen) {
  const r = resumen || { sinCargar: [], pendientes: [], motivos: [] };
  const base = indicador(id) || indicador('oculto');
  return { ...base, ...textosDe(base.id, { sinCargar: r.sinCargar || [], pendientes: r.pendientes || [], motivos: r.motivos || [] }) };
}

/**
 * Con memoria (apartados 12 y 27): lo que se ve tiene un mínimo, y «Guardando…»
 * que termina bien pasa por «Guardado» antes de irse —*"Guardar → Guardando →
 * Guardado"*—, en vez de desaparecer como si nada.
 * `anterior` es `{ id, desde }` (lo que se está viendo y desde cuándo).
 */
export function siguienteIndicador(anterior, decision, ahora = Date.now()) {
  const prev = anterior && anterior.id ? anterior : { id: 'oculto', desde: 0 };
  const T = TIEMPOS_ASINCRONOS;
  let id = decision.id;
  if (prev.id === 'guardando' && id === 'oculto') id = 'guardado';
  if (id === prev.id) return { id, desde: prev.desde, revisarEn: decision.revisarEn };
  /* Lo que se iba a esconder espera su mínimo; lo más importante entra ya. */
  if (prev.id !== 'oculto' && id === 'oculto' && ahora - prev.desde < T.minimoVisible) {
    return { id: prev.id, desde: prev.desde, revisarEn: prev.desde + T.minimoVisible - ahora };
  }
  const revisar = id === 'guardado' && decision.id !== 'guardado' ? T.guardadoVisible : decision.revisarEn;
  return { id, desde: ahora, revisarEn: revisar };
}

/* ───────────────────────────────────────────────────────────────────────────
   4 · EL ARRANQUE (apartados 4, 5 y 9)

   El esqueleto tiene la forma de Hoy (E3 F14) y el contenido entra en su sitio
   con la transición de sección (F2): sin pantalla en blanco y sin salto. Lo que
   faltaba es qué pasa si NO llega: el esqueleto latía para siempre. Y si no se
   pudo cargar NADA, la aplicación arrancaba como una cuenta nueva.
   ─────────────────────────────────────────────────────────────────────────── */
export function estadoDeEspera({ desde, ahora = Date.now() } = {}) {
  const T = TIEMPOS_ASINCRONOS;
  const pasado = Math.max(0, ahora - (Number.isFinite(desde) ? desde : ahora));
  if (pasado >= T.esqueletoReintentar) return { id: 'reintentar', texto: 'Está tardando mucho. Puede que la conexión vaya lenta.', revisarEn: null };
  if (pasado >= T.esqueletoTarda) return { id: 'tarda', texto: 'Está tardando más de lo normal…', revisarEn: T.esqueletoReintentar - pasado };
  return { id: 'cargando', texto: null, revisarEn: T.esqueletoTarda - pasado };
}

/** Si no se pudo cargar NADA, no hay aplicación que enseñar: sería una cuenta vacía que no es la suya. */
export const arranqueSinDatos = (sinCargar, total) => total > 0 && Array.isArray(sinCargar) && sinCargar.length >= total;

export const TEXTOS_ARRANQUE = Object.freeze({
  titulo: 'No se han podido cargar tus datos',
  texto: 'Tus datos siguen en tu cuenta: no se ha borrado nada. Cuando haya conexión, vuelve a intentarlo.',
  reintentar: 'Reintentar',
  reintentando: 'Reintentando…',
});

/* ───────────────────────────────────────────────────────────────────────────
   5 · LA SESIÓN (apartados 44 y 45)

   *"Si la sesión expira: la transición debe ser contextual y clara. No borrar
   la interfaz instantáneamente sin explicación."* Salir porque él lo pide no
   necesita explicación; que la sesión se vaya sola, sí.
   ─────────────────────────────────────────────────────────────────────────── */
export function motivoDeSalida({ habia = false, hay = false, pedida = false } = {}) {
  if (habia && !hay && !pedida) return 'caducada';
  return null;
}

export const TEXTOS_SALIDA = Object.freeze({
  caducada: {
    titulo: 'Tu sesión ha caducado',
    texto: 'Vuelve a entrar. Lo que estaba guardado sigue en tu cuenta.',
    sinGuardar: (n) => (n > 0 ? `${cambios(n)} de los últimos minutos no llegaron a guardarse.` : null),
  },
});

/* ───────────────────────────────────────────────────────────────────────────
   6 · LOS PERMISOS (apartado 46)

   *"Diferenciar checking, granted, denied, unavailable. No mostrar error
   cuando simplemente todavía se está comprobando."* Mientras la cámara se
   abre, «Abriendo la cámara…»; si dice que no, se distingue «no has dado
   permiso» de «aquí no hay cámara».
   ─────────────────────────────────────────────────────────────────────────── */
export function estadoDePermiso(error) {
  if (!error) return { id: 'concedido', texto: null };
  const nombre = String((error && (error.name || error.code)) || '');
  if (/NotAllowed|Permission|Security/i.test(nombre)) {
    return { id: 'denegado', texto: 'No has dado permiso para usar la cámara. Puedes darlo en Ajustes → Safari → Cámara.' };
  }
  if (/NotFound|Overconstrained|NotReadable|NotSupported|TypeError/i.test(nombre)) {
    return { id: 'no_disponible', texto: 'Ahora mismo no se puede usar la cámara en este dispositivo. Puedes escribir el código a mano.' };
  }
  return { id: 'no_disponible', texto: 'No se pudo abrir la cámara. Prueba otra vez o escribe el código a mano.' };
}

/* ───────────────────────────────────────────────────────────────────────────
   7 · LA ÚLTIMA PETICIÓN GANA (apartados 40, 41 y 49)

   *"request A, request B, response B, response A: la UI no debe volver al
   estado antiguo"*. Cada petición saca un turno; al contestar, solo pinta si
   sigue siendo el suyo. Cancelar (o desmontar) deja todos los que había sin
   vigencia: lo que llegue después no pinta nada, ni un giro huérfano.
   ─────────────────────────────────────────────────────────────────────────── */
export function crearTurnos() {
  let actual = 0;
  let cerrado = false;
  return {
    nuevo() {
      actual += 1;
      const id = actual;
      return { id, vigente: () => !cerrado && id === actual };
    },
    cancelar() { actual += 1; },
    cerrar() { cerrado = true; actual += 1; },
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   8 · EL VACÍO QUE LLEGA DESPUÉS (apartados 21-23)

   *"content → empty: animar la desaparición y después introducir el estado
   vacío."* Un estado vacío que se monta con su pantalla entra con ella (el de
   siempre, `vacio-entra`); uno que aparece porque se ha ido lo último espera
   a que lo de antes salga (`vacio-tras-salida`). Se distingue mirando si la
   pantalla que lo contiene sigue entrando.
   ─────────────────────────────────────────────────────────────────────────── */
export const vacioTrasContenido = ({ pantallaEntrando = false, dentroDePantalla = true } = {}) => dentroDePantalla && !pantallaEntrando;

/* ───────────────────────────────────────────────────────────────────────────
   9 · EL MAPA (apartado 1)

   *"Crear un mapa real. No asumir que todo utiliza el mismo patrón."* Cada
   operación asíncrona de JosStyle, con su patrón, sus estados y quién es el
   dueño de su movimiento (apartado 3). `archivo` es donde vive; la auditoría
   comprueba que existe y que sigue haciendo lo que dice.
   ─────────────────────────────────────────────────────────────────────────── */
export const MAPA_ASINCRONO = Object.freeze([
  { id: 'arranque', que: 'Abrir la aplicación: sesión, 35 claves de `app_data` y las fuentes', archivo: 'src/App.jsx', patron: 'Promise.all de `loadData` + `useFuentesListas`', estados: ['loading', 'success', 'error', 'retrying'], dueno: '`LoadingScreen` (esqueleto con la forma de Hoy) → la entrada de sección (F2); `ErrorDeArranque` si no llega nada', antes: 'Si una carga fallaba, la clave arrancaba vacía y el siguiente guardado PISABA la cuenta (y la migración de `ajustes` lo hacía sola). Si fallaban todas, una cuenta nueva. Y el esqueleto latía para siempre.', queda: 'Lo que no carga no se guarda (`sincronizacion.js`); si no carga nada, «No se han podido cargar tus datos · Reintentar»; si tarda, lo dice.' },
  { id: 'sesion', que: 'Entrar, salir y la sesión que se renueva o caduca', archivo: 'src/App.jsx', patron: '`getSession` + `onAuthChange` de Supabase', estados: ['loading', 'success', 'error'], dueno: '`LoadingScreen` mientras se comprueba; `Auth` con su motivo', antes: 'Una sesión que caducaba borraba la pantalla y enseñaba la de entrar sin decir por qué.', queda: '«Tu sesión ha caducado», y cuántos cambios no llegaron a guardarse. Sin destello entrar → app → entrar: mientras se comprueba, esqueleto.' },
  { id: 'guardar', que: 'Guardar cualquier cambio (`saveData`, desde 91 sitios de App.jsx)', archivo: 'src/lib/supabase.js', patron: 'Optimista: `setX` + `saveData` (upsert de la clave entera)', estados: ['saving', 'saved', 'pending', 'retrying'], dueno: '`IndicadorDeSincronizacion` (uno para toda la aplicación); Fitness además lo dice en su pantalla (FIT F37)', antes: 'El resultado lo leía solo Fitness: en el resto, un guardado fallido sonaba (`ACTION_ERROR`) y nada más. Dos guardados de la misma clave podían llegar al revés.', queda: 'Lo que no llega queda pendiente con su último valor, se dice arriba y se vuelve a mandar al pedirlo o al volver la conexión. Los de una clave salen en orden.' },
  { id: 'conexion', que: 'Perder y recuperar la conexión', archivo: 'src/lib/supabase.js', patron: 'Eventos `online` / `offline` (`vigilarLaConexion`)', estados: ['offline', 'retrying', 'saved'], dueno: '`IndicadorDeSincronizacion`', antes: 'Solo sonaba (SO): `connection_lost` y `connection_restored`.', queda: '«Sin conexión» si dura más de un segundo; al volver, lo pendiente se manda solo y «Guardado» un momento.' },
  { id: 'subidas', que: 'Subir fotos, vídeos y archivos (Salud, Fitness, Armario, Biblioteca, Fondos, Relación)', archivo: 'src/components/ui.jsx', patron: '`await upload…` con el botón en `estado="cargando"` (F9)', estados: ['saving', 'saved', 'error'], dueno: 'El botón que lo pidió (F9: texto en su sitio, giro si tarda, no repite)', antes: 'Resuelto en la F9.', queda: 'Así.' },
  { id: 'ia', que: 'Preguntar a la IA (análisis, sugerencias, foto de comida, vídeo de técnica)', archivo: 'src/lib/ai.js', patron: '`fetch` a `/api/ask-ai`, siempre a un toque (regla 7)', estados: ['loading', 'success', 'error'], dueno: 'El botón ocupado (F9) y el texto de error amable de cada panel', antes: 'Ya no se puede pedir dos veces a la vez (F9: el toque no repite).', queda: 'Así. Un panel que se cierra a media respuesta no pinta lo que llegue después (React 18 no avisa, y no hay movimiento que se quede colgado).' },
  { id: 'off', que: 'Buscar un alimento en Open Food Facts', archivo: 'src/views/NutritionView.jsx', patron: '`await buscarAlimentosPorNombre`, a petición', estados: ['loading', 'success', 'error', 'cancelled'], dueno: 'El botón «Buscar en la base de productos» (F9)', antes: '🐛 Si cambiaba el texto mientras buscaba, los resultados de la búsqueda VIEJA salían debajo del texto nuevo.', queda: 'Turnos (`crearTurnos`): solo pinta la búsqueda vigente, y cambiar el texto la deja sin vigencia.' },
  { id: 'codigo', que: 'Leer un código de barras y buscar el producto', archivo: 'src/views/NutritionView.jsx', patron: 'Cámara (`BarcodeScanner`) + `await buscarProductoPorCodigoBarras`', estados: ['loading', 'success', 'error'], dueno: 'El visor de la cámara y el aviso del formulario', antes: 'Un solo mensaje para «sin permiso» y «sin cámara», y dos lecturas seguidas podían contestar al revés.', queda: 'Comprobando («Abriendo la cámara…»), denegado y no disponible, cada uno con su frase (apartado 46); y la última lectura gana (turnos).' },
  { id: 'pin', que: 'Comprobar un PIN o la biometría', archivo: 'src/components/ui.jsx', patron: '`await verificarPin` / `verificarBiometria`', estados: ['loading', 'success', 'error'], dueno: '`EntradaPin` (`cargando`)', antes: '🐛 `setVerificando(false)` iba DESPUÉS del `await` y fuera de un `finally`: si `crypto.subtle` lanzaba, la entrada se quedaba «verificando» para siempre y no se podía volver a intentar.', queda: 'En un `finally`: pase lo que pase, la entrada vuelve a reposo (apartado 40).' },
  { id: 'fuentes', que: 'Las tipografías', archivo: 'src/components/layoutMotion.jsx', patron: '`useFuentesListas` (F10), con tope', estados: ['loading', 'success'], dueno: '`LoadingScreen`', antes: 'Resuelto en la F10.', queda: 'Así.' },
  { id: 'sonidos', que: 'Los archivos de sonido', archivo: 'src/lib/audioEngine.js', patron: '`fetch` perezoso del motor de audio', estados: ['loading', 'success', 'error'], dueno: 'Ninguno visible: un sonido que no carga no suena, y la acción sigue', antes: 'Así.', queda: 'Así (no es un estado de la interfaz).' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   10 · LA AUDITORÍA (apartados 10, 40 y 60)

   Lee el código y caza, con su línea:
     · `cargando_sin_finally` — una bandera de espera que se enciende antes de
       un `await` y se apaga después, sin `try` ni `finally`: si lo esperado
       lanza, el giro se queda para siempre (apartado 40);
     · `giro_sin_texto` — un `animate-spin` fuera de las piezas que lo llevan
       con su texto (`GiroDeCarga`, los botones de `ui.jsx`): un giro suelto no
       dice qué espera (apartados 10 y 53; la F12 lo dejó escrito);
     · `asincrono_sin_mapa` — un archivo de pantalla que llama a la red (IA,
       Open Food Facts, `fetch`) y no está en `MAPA_ASINCRONO`: una operación
       nueva tiene que decir sus estados (apartado 60).
   ─────────────────────────────────────────────────────────────────────────── */
const sinComentarios = (src) => String(src || '')
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`\\])\/\/.*$/gm, (m, a) => a + ' '.repeat(m.length - a.length));
const lineaDe = (src, i) => src.slice(0, i).split('\n').length;

/** Dónde puede haber un giro (`animate-spin`): piezas que lo acompañan de su texto. */
export const GIROS_PERMITIDOS = Object.freeze([
  { archivo: 'src/components/ui.jsx', porque: 'Los botones de `estado="cargando"` (F9: el texto dice qué espera) y los paneles de IA con su «Pensando…».' },
  { archivo: 'src/components/accesibilidadMotion.jsx', porque: '`GiroDeCarga`, que lleva su texto (F12).' },
  { archivo: 'src/views/SettingsView.jsx', porque: 'El análisis de colores de una foto de fondo, con «Analizando colores…» al lado.' },
]);

/** Archivos de pantalla que llaman a la red, y dónde están en el mapa. */
const LLAMADAS_DE_RED = /\bawait\s+(askAI\w*|buscarAlimentosPorNombre|buscarProductoPorCodigoBarras|fetch)\s*\(/g;
export const ARCHIVOS_CON_RED = Object.freeze({
  'src/components/ui.jsx': 'ia',
  'src/views/NutritionView.jsx': 'off',
  'src/views/EstudiosView.jsx': 'ia',
  'src/views/ObjectivesView.jsx': 'ia',
  'src/views/TrainingView.jsx': 'ia',
});

export function banderasSinFinally(src) {
  const limpio = sinComentarios(src);
  const hallados = [];
  const re = /\b(set[A-Z]\w*)\(\s*true\s*\)\s*;/g;
  let m;
  while ((m = re.exec(limpio))) {
    const nombre = m[1];
    const resto = limpio.slice(m.index + m[0].length, m.index + m[0].length + 1500);
    const espera = resto.search(/\bawait\s/);
    const apaga = resto.search(new RegExp(`\\b${nombre}\\(\\s*false\\s*\\)`));
    if (espera === -1 || apaga === -1 || espera > apaga) continue;
    const entre = resto.slice(0, apaga);
    if (/\btry\s*\{/.test(entre.slice(0, espera + 1)) || /\bfinally\s*\{[^{}]*$/.test(entre)) continue;
    hallados.push(lineaDe(limpio, m.index));
  }
  return hallados;
}

export function auditarAsincronia({ archivos = {} } = {}) {
  const problemas = [];
  Object.entries(archivos).forEach(([ruta, src]) => {
    if (!/\.jsx?$/.test(ruta)) return;
    banderasSinFinally(src).forEach((linea) => problemas.push({ regla: 'cargando_sin_finally', archivo: ruta, linea }));
    const limpio = sinComentarios(src);
    if (!GIROS_PERMITIDOS.some((g) => g.archivo === ruta)) {
      const re = /animate-spin/g;
      let m;
      while ((m = re.exec(limpio))) problemas.push({ regla: 'giro_sin_texto', archivo: ruta, linea: lineaDe(limpio, m.index) });
    }
    if (/^src\/(views|components)\//.test(ruta)) {
      const re = new RegExp(LLAMADAS_DE_RED.source, 'g');
      const m = re.exec(limpio);
      if (m && !ARCHIVOS_CON_RED[ruta]) problemas.push({ regla: 'asincrono_sin_mapa', archivo: ruta, linea: lineaDe(limpio, m.index) });
    }
  });
  return problemas;
}

/** Cada regla, con un ejemplo que tiene que cazar (EH F42: una regla que no puede fallar no sirve). */
export const EJEMPLOS_MALOS_F16 = Object.freeze([
  { regla: 'cargando_sin_finally', ruta: 'src/views/X.jsx', src: 'const f = async () => {\n  setCargando(true);\n  const r = await pedir();\n  setCargando(false);\n};' },
  { regla: 'giro_sin_texto', ruta: 'src/views/X.jsx', src: '<Loader2 className="animate-spin" />' },
  { regla: 'asincrono_sin_mapa', ruta: 'src/views/NuevaView.jsx', src: 'const r = await askAI(AI_SYSTEM, p);' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   11 · LO QUE SE DECIDIÓ, LO QUE ESTABA BIEN Y LO QUE NO SE HACE
   ─────────────────────────────────────────────────────────────────────────── */
export const DECISIONES_F16 = Object.freeze([
  { apartados: [20, 24], que: '🚨 Una clave que no se pudo cargar no se guarda', porque: 'Arrancar con el valor por defecto deja usar la aplicación (apartado 20: los demás apartados siguen), pero guardar encima pisaría lo que hay en la cuenta. Antes de la F16 lo hacía la propia migración de `ajustes` en el arranque: con esa carga fallida, guardaba los ajustes por defecto —acento, apariencia y el PIN—.' },
  { apartados: [14, 16, 33], que: 'Optimista sin vuelta atrás: lo que no llega se queda PENDIENTE, no se deshace', porque: 'Deshacer en pantalla un cambio que solo no ha llegado a la cuenta sería perder lo que él ha escrito por un fallo de red. El cambio se queda, el indicador lo dice y se vuelve a mandar (es idempotente: `saveData` sobrescribe la clave entera). La vuelta atrás visible es «Deshacer», que ya existe (histórico de diez pasos y papelera).' },
  { apartados: [26, 28], que: 'Un solo indicador para toda la aplicación, y vacío casi siempre', porque: '«Guardando…» solo si un guardado pasa de 1,2 s; «Guardado» solo después de haber dicho algo. Guardar sale bien decenas de veces por sesión: un aviso en cada toque convertiría una aplicación personal en una consola de servidor.' },
  { apartados: [3, 19], que: 'Fitness dice SU fallo en su pantalla y el indicador dice el de todas', porque: 'El aviso de Fitness (FIT F37) habla del entrenamiento que acaba de terminar y se va a los segundos; el indicador cuenta lo que sigue sin guardar en toda la aplicación y no se va hasta que llega. Sus botones se llaman distinto («Reintentar» / «Guardar ahora»): dos botones iguales en la misma pantalla no se distinguen (E3 F30).' },
  { apartados: [7, 8], que: 'Del esqueleto al contenido: la entrada de sección, en su sitio', porque: 'El esqueleto del arranque tiene la forma de Hoy (E3 F14) y Hoy entra con `nav-seccion` (F2): un fundido corto en el mismo sitio. Una segunda animación encima sería un doble fundido.' },
  { apartados: [9, 51], que: 'El esqueleto no late para siempre', porque: 'A los 8 s dice que tarda y deja de latir (un bucle que no informa gasta batería); a los 20 s ofrece volver a intentarlo.' },
  { apartados: [22, 23], que: 'Vacío ↔ contenido', porque: 'La lista se queda montada aunque se vacíe, así que lo último que se borra sale con su copia inerte (F10) y el vacío entra DESPUÉS (`vacio-tras-salida`); lo primero que se crea entra en el sitio del vacío.' },
  { apartados: [41], que: 'Los guardados de una clave, en orden', porque: 'Uno espera a que termine el anterior (con tope de 10 s, para que una petición colgada no pare la cola). Sin esto, dos guardados seguidos podían llegar al revés y la cuenta quedarse con el viejo.' },
  { apartados: [45], que: 'La sesión que caduca se explica', porque: 'Supabase dice lo mismo al salir y al caducar. `signOut` apunta que se pidió; sin esa marca, la pantalla de entrar dice que ha caducado y cuántos cambios no llegaron.' },
  { apartados: [50], que: 'Lo pendiente no se guarda en el dispositivo', porque: 'Llevaría datos de Relación, del diario o de la piel escritos en claro en el teléfono: *"no almacenar datos sensibles innecesarios"*. Por eso el aviso dice que si se cierra la app antes, se pierden.' },
]);

export const REVISADO_Y_BIEN_F16 = Object.freeze([
  { que: 'Botones que cargan', donde: 'F9: `estado="cargando"` — texto en su sitio, giro solo si tarda, `aria-busy`, no repite.' },
  { que: 'El esqueleto de carga', donde: 'E3 F14: la forma de Hoy; F12: quieto en Reducido; F13: solo opacidad (componible).' },
  { que: 'Los avisos de una acción', donde: '`AvisoAccion` (F9): entra, se queda y sale; el de un error con su icono y `role="alert"`.' },
  { que: 'Errores locales', donde: '`AreaSegura` (FIT F36, F2): un fallo al pintar una pantalla se queda en ella; la barra de abajo sigue.' },
  { que: 'Borrar y deshacer', donde: 'La papelera (ME F3) y el histórico de diez pasos; la fila que vuelve se recoloca en su sitio con `ListaAnimada` (F10).' },
  { que: 'Navegar mientras algo carga', donde: 'Nada bloquea la navegación: cada pantalla espera lo suyo dentro de sí, y una respuesta que llega a una pantalla ya cerrada no mueve nada.' },
]);

export const NO_EN_F16 = Object.freeze([
  { apartados: [34, 35, 36], que: 'Datos en tiempo real y cambios de otro dispositivo', porque: 'JosStyle no usa Supabase Realtime: lo de otro dispositivo llega al volver a abrir. Los conflictos siguen sin detectarse (EH F41, F45, F54): el último en escribir gana, y está declarado.' },
  { apartados: [37, 38], que: 'Refrescar y «tirar para actualizar»', porque: 'No hay un refresco dentro de la aplicación ni un gesto de tirar: los datos se cargan al abrir. Construir el gesto sería una función nueva (y en Safari choca con el rebote de la página).' },
  { apartados: [13], que: 'Una barra de progreso de las subidas', porque: '`supabase-js` no informa del avance de una subida: una barra sería progreso fingido. El botón dice «Subiendo…».' },
  { apartados: [16], que: 'Deshacer en pantalla un cambio que no llegó', porque: 'Ver `DECISIONES_F16`: se queda pendiente y se vuelve a mandar.' },
]);

export const CUANDO_F16 = Object.freeze([
  { patron: '`saveData(uid, clave, valor)`', cuando: 'Siempre: la cola, el orden, lo pendiente y el indicador vienen solos. Si la pantalla tiene algo que decir de SU guardado (Fitness), lee `{ ok }`.' },
  { patron: '`crearTurnos()` / `useTurnos()`', cuando: 'Una petición que se puede lanzar otra vez antes de que conteste (una búsqueda), o cuyo resultado deja de valer si cambia algo (el texto buscado).' },
  { patron: '`try { … } finally { setCargando(false) }`', cuando: 'Toda bandera de espera alrededor de un `await`: pase lo que pase, vuelve a reposo.' },
  { patron: '`estado="cargando"` (F9)', cuando: 'Un botón que espera.' },
  { patron: '`<Esqueleto>`', cuando: 'Una pantalla o una sección que se pinta cuando llegan sus datos y cuya forma se conoce.' },
  { patron: '`<EmptyHint>` o `useVacioQueLlega`', cuando: 'Un estado vacío: si llega después del contenido, espera a que se vaya.' },
]);
