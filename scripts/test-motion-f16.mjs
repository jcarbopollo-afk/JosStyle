/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 16 — estados de sistema, carga, error, sin conexión, guardado y transiciones asíncronas

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f16.mjs

   Lo que se comprueba aquí: la cuenta de lo que se carga y se guarda (`sincronizacion.js`) —una clave que no
   se pudo cargar no se guarda, lo que no llega queda pendiente con su ÚLTIMO valor, las respuestas que
   llegan tarde no reescriben nada, los guardados de una clave salen en orden y una sesión vieja no toca la
   nueva—; la máquina de estados; el indicador de arriba, con sus tiempos y su memoria; el arranque que
   tarda o no carga; la sesión que caduca; los permisos; la última petición gana; el mapa de lo asíncrono;
   la auditoría (limpia hoy y roja con cada fallo de antes); y que todo esté cableado donde debe. Lo que
   necesita un navegador —un guardado que falla y se reintenta, una carga que falla, sin conexión, el
   arranque lento, la sesión que caduca, el orden de tres guardados seguidos— está en la sección
   «MS F16» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  empezarSesionDeDatos, usuarioDeLaSesion, apuntarCargaFallida, apuntarCargaBuena, cargaFallida, clavesSinCargar,
  antesDeGuardar, despuesDeGuardar, esperarAnterior, pendientesParaReintentar, marcarReintento, resumenSincronizacion,
  suscribirSincronizacion, motivoDeError, marcarSalidaPedida, consumirSalidaPedida, ERROR_CARGA_FALLIDA, ERROR_OTRA_SESION,
  TOPE_ESPERA_ANTERIOR_MS,
} from '../src/lib/sincronizacion.js';
import {
  ESTADOS_ASINCRONOS, TRANSICIONES_ASINCRONAS, siguienteEstadoAsincrono, TIEMPOS_ASINCRONOS, NOMBRES_DE_CLAVE, nombreDeClave,
  ESTADOS_INDICADOR, estadoDeSincronizacion, siguienteIndicador, contenidoDeIndicador, estadoDeEspera, arranqueSinDatos,
  TEXTOS_ARRANQUE, motivoDeSalida, TEXTOS_SALIDA, estadoDePermiso, crearTurnos, vacioTrasContenido, MAPA_ASINCRONO,
  GIROS_PERMITIDOS, ARCHIVOS_CON_RED, banderasSinFinally, auditarAsincronia, EJEMPLOS_MALOS_F16, DECISIONES_F16,
  REVISADO_Y_BIEN_F16, NO_EN_F16, CUANDO_F16,
} from '../src/lib/estadosAsincronos.js';
import { DURACIONES_MOTION } from '../src/lib/motion.js';
import { RETARDO_INDICADOR_MS } from '../src/lib/estadosInteraccion.js';
import { PIEZAS_DE_MOVIMIENTO } from '../src/lib/orquestadorMotion.js';
import { PIEZAS_MOTION } from '../src/lib/rendimientoMotion.js';
import { estadoEH, ESTADOS_SIN_MECANISMO } from '../src/lib/estadosEstilo.js';
import { caida, caidasSinAviso } from '../src/lib/produccion.js';
import { MOTION_MAP } from '../src/lib/motionMapa.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const CSS = leer('src/index.css');
const APP = leer('src/App.jsx');
const UI = leer('src/components/ui.jsx');
const SUPA = leer('src/lib/supabase.js');
const SINC = leer('src/lib/sincronizacion.js');
const COMP = leer('src/components/estadosAsincronos.jsx');
const VACIO = leer('src/components/vacioMotion.js');
const AUTH = leer('src/components/Auth.jsx');
const NUT = leer('src/views/NutritionView.jsx');

const ARCHIVOS = { 'src/App.jsx': APP };
['src/views', 'src/components'].forEach((d) => readdirSync(join(RAIZ, d)).forEach((f) => {
  const p = `${d}/${f}`;
  if (statSync(join(RAIZ, p)).isFile() && /\.(jsx?|mjs)$/.test(f)) ARCHIVOS[p] = leer(p);
}));

/* ---------------------------------------------------------------------------
   1 · UNA CLAVE QUE NO SE PUDO CARGAR NO SE GUARDA (apartado 20)
   --------------------------------------------------------------------------- */
{
  console.log('\n1 · Lo que no se pudo cargar no se guarda');
  empezarSesionDeDatos('u1');
  ok(usuarioDeLaSesion() === 'u1', 'la sesión de datos es la de este usuario');
  apuntarCargaFallida('ajustes', { message: 'TypeError: Failed to fetch' });
  ok(cargaFallida('ajustes') && igual(clavesSinCargar(), ['ajustes']), 'una carga fallida queda apuntada');
  const t = antesDeGuardar('ajustes', { usuario: 'u1' });
  ok(t.sale === false && t.error === ERROR_CARGA_FALLIDA,
    '🚨 y su guardado NO sale: pisaría lo que hay en la cuenta (la migración del arranque guardaba los ajustes por defecto, PIN incluido)');
  ok(antesDeGuardar('perfil', { usuario: 'u1' }).sale === true, '…las demás claves se guardan como siempre (apartado 20: lo demás sigue funcionando)');
  apuntarCargaBuena('ajustes');
  ok(!cargaFallida('ajustes') && antesDeGuardar('ajustes', { usuario: 'u1' }).sale === true, 'cargada de verdad, se desbloquea');
  ok(/apuntarCargaFallida\(key, error\)/.test(SUPA) && /apuntarCargaBuena\(key\)/.test(SUPA),
    '`loadData` apunta la carga fallida y la buena (y sigue devolviendo el valor por defecto: la aplicación arranca)');
  ok(/try \{\s*\(\{ data, error \} = await supabase/.test(SUPA), '…y una excepción de red al cargar cuenta como fallo, no rompe el arranque');
  ok(/if \(!turno\.sale\)[\s\S]{0,260}return \{ ok: false, error: turno\.error, bloqueado: true \}/.test(SUPA),
    '`saveData` devuelve `{ ok: false, bloqueado: true }` sin tocar la red');
}

/* ---------------------------------------------------------------------------
   2 · LO QUE NO LLEGA QUEDA PENDIENTE, CON SU ÚLTIMO VALOR (apartados 16, 24, 33, 41)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Pendiente, orden y respuestas que llegan tarde');
  empezarSesionDeDatos('u1');
  const a = antesDeGuardar('tareas', { usuario: 'u1' });
  despuesDeGuardar('tareas', a, { ok: false, error: { message: 'Failed to fetch' }, valor: { v: 1 } });
  ok(igual(pendientesParaReintentar(), [{ clave: 'tareas', valor: { v: 1 } }]), 'un guardado que falla deja su valor pendiente');
  const b = antesDeGuardar('tareas', { usuario: 'u1' });
  despuesDeGuardar('tareas', b, { ok: false, error: { status: 500 }, valor: { v: 2 } });
  ok(igual(pendientesParaReintentar(), [{ clave: 'tareas', valor: { v: 2 } }]), '…y si el siguiente también falla, el pendiente es el ÚLTIMO (lo que hay en pantalla)');
  const c = antesDeGuardar('tareas', { usuario: 'u1' });
  despuesDeGuardar('tareas', c, { ok: true, valor: { v: 3 } });
  ok(pendientesParaReintentar().length === 0, 'uno más nuevo que llega deja de tener pendiente lo de antes');

  /* request A, request B, response B (bien), response A (mal): A no vuelve a dejar nada pendiente. */
  const A = antesDeGuardar('notas', { usuario: 'u1' });
  const B = antesDeGuardar('notas', { usuario: 'u1' });
  despuesDeGuardar('notas', B, { ok: true, valor: { n: 'B' } });
  despuesDeGuardar('notas', A, { ok: false, error: { status: 500 }, valor: { n: 'A' } });
  ok(pendientesParaReintentar().length === 0, '🚨 apartado 41 — una respuesta VIEJA que falla después de una más nueva que llegó no deja nada pendiente');
  /* request A (bien) llega después de B (mal): sigue pendiente B. */
  const A2 = antesDeGuardar('notas', { usuario: 'u1' });
  const B2 = antesDeGuardar('notas', { usuario: 'u1' });
  despuesDeGuardar('notas', B2, { ok: false, error: { status: 500 }, valor: { n: 'B2' } });
  despuesDeGuardar('notas', A2, { ok: true, valor: { n: 'A2' } });
  ok(igual(pendientesParaReintentar(), [{ clave: 'notas', valor: { n: 'B2' } }]), '…y una vieja que llega bien no se lleva el pendiente más nuevo');

  /* La cola: el segundo guardado de una clave espera al primero. */
  empezarSesionDeDatos('u1');
  const p1 = antesDeGuardar('k', { usuario: 'u1' });
  const p2 = antesDeGuardar('k', { usuario: 'u1' });
  const p3 = antesDeGuardar('otra', { usuario: 'u1' });
  ok(p1.anterior === null && p2.anterior !== null && p3.anterior === null,
    '🚨 los guardados de una clave salen EN ORDEN: el segundo espera al primero; los de otra clave no esperan');
  let soltado = false;
  esperarAnterior(p2.anterior).then(() => { soltado = true; });
  await Promise.resolve();
  ok(!soltado, '…mientras el primero no termina, el segundo no sale');
  despuesDeGuardar('k', p1, { ok: true, valor: 1 });
  await new Promise((r) => setTimeout(r, 0));
  ok(soltado, '…y sale en cuanto termina');
  const tope = Date.now();
  await esperarAnterior(new Promise(() => {}), 30);
  ok(Date.now() - tope < 1000 && TOPE_ESPERA_ANTERIOR_MS === 10000, 'una petición colgada no para la cola para siempre (tope de 10 s; aquí, 30 ms)');
  ok(/await esperarAnterior\(turno\.anterior\)/.test(SUPA) && /despuesDeGuardar\(key, turno, \{ ok: !error, error, valor: value \}\)/.test(SUPA),
    '`saveData` espera a su anterior y apunta cómo fue, con el valor que mandó');
}

/* ---------------------------------------------------------------------------
   3 · LA SESIÓN DE DATOS ES DE UN USUARIO (seguridad)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Una sesión vieja no toca la nueva');
  empezarSesionDeDatos('u1');
  const viejo = antesDeGuardar('diario', { usuario: 'u1' });
  empezarSesionDeDatos('u2');
  despuesDeGuardar('diario', viejo, { ok: false, error: { status: 500 }, valor: { privado: 'de u1' } });
  ok(pendientesParaReintentar().length === 0, '🚨 lo que contesta una sesión que ya se cerró no deja nada pendiente en la de otro usuario');
  const ajeno = antesDeGuardar('diario', { usuario: 'u1' });
  ok(ajeno.sale === false && ajeno.error === ERROR_OTRA_SESION, '🚨 y un guardado con el id de otro usuario no sale');
  const fallo = antesDeGuardar('diario', { usuario: 'u2' });
  despuesDeGuardar('diario', fallo, { ok: false, error: { status: 500 }, valor: { x: 1 } });
  empezarSesionDeDatos(null);
  ok(pendientesParaReintentar().length === 0 && usuarioDeLaSesion() === null, 'al salir, lo pendiente (datos privados) se vacía de la memoria');
  ok(!/localStorage|sessionStorage|indexedDB/.test(sinComentarios(SINC)), '…y nunca se escribe en el dispositivo (*"no almacenar datos sensibles innecesarios"*)');
  marcarSalidaPedida();
  ok(consumirSalidaPedida() === true && consumirSalidaPedida() === false, 'salir a propósito se apunta y se gasta una vez');
  ok(/marcarSalidaPedida\(\);\s*const \{ error \} = await supabase\.auth\.signOut\(\)/.test(SUPA), '`signOut` lo apunta antes de salir');
}

/* ---------------------------------------------------------------------------
   4 · EL RESUMEN, LOS OYENTES Y LOS MOTIVOS
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · El resumen y quien lo escucha');
  empezarSesionDeDatos('u1');
  const vistos = [];
  const soltar = suscribirSincronizacion((r) => vistos.push(r));
  const t = antesDeGuardar('k', { usuario: 'u1', ahora: 1000 });
  let r = resumenSincronizacion();
  ok(r.guardando === 1 && r.guardandoDesde === 1000, 'lo que está saliendo se cuenta, con desde cuándo');
  despuesDeGuardar('k', t, { ok: false, error: { status: 413 }, valor: 1 });
  r = resumenSincronizacion();
  ok(r.guardando === 0 && igual(r.pendientes, ['k']) && igual(r.motivos, ['sin_espacio']), '…y lo que no llegó, con su motivo');
  marcarReintento(true);
  ok(resumenSincronizacion().reintentando === true, 'reintentar se dice');
  marcarReintento(false, { ahora: 5000, salioBien: true });
  ok(resumenSincronizacion().confirmadoEn === 5000, '…y cuándo salió bien (para «Guardado»)');
  ok(vistos.length >= 4, `quien escucha se entera de cada cambio (${vistos.length})`);
  soltar();
  const n = vistos.length;
  apuntarCargaFallida('x', null);
  ok(vistos.length === n, 'y al soltar deja de escuchar (apartado 50)');
  ok(motivoDeError({ message: 'TypeError: Failed to fetch' }) === 'sin_conexion' && motivoDeError({ status: 413 }) === 'sin_espacio'
    && motivoDeError({ status: 401 }) === 'sesion' && motivoDeError({ status: 500 }) === 'servidor' && motivoDeError(ERROR_CARGA_FALLIDA) === 'carga_fallida' && motivoDeError(null) === null,
  'el motivo de un fallo: sin conexión, sin espacio, sesión, servidor, carga fallida');
}

/* ---------------------------------------------------------------------------
   5 · LA MÁQUINA DE ESTADOS (apartados 2 y 60)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · La máquina de estados');
  ok(['idle', 'loading', 'success', 'error', 'retrying', 'cancelled', 'saving', 'saved', 'pending', 'offline'].every((id) => ESTADOS_ASINCRONOS.some((e) => e.id === id && e.como)),
    'los estados de la regla permanente, cada uno con cómo se ve');
  ok(siguienteEstadoAsincrono('idle', 'cargar') === 'loading' && siguienteEstadoAsincrono('loading', 'exito') === 'success', 'idle → loading → success');
  ok(siguienteEstadoAsincrono('loading', 'fallo') === 'error' && siguienteEstadoAsincrono('error', 'reintentar') === 'retrying' && siguienteEstadoAsincrono('retrying', 'exito') === 'success',
    'idle → loading → error → retrying → success');
  ok(siguienteEstadoAsincrono('saved', 'guardar') === 'saving' && siguienteEstadoAsincrono('saving', 'fallo') === 'pending' && siguienteEstadoAsincrono('pending', 'reintentar') === 'saving',
    'saved → saving → pending → saving');
  ok(siguienteEstadoAsincrono('cancelled', 'exito') === 'cancelled', '🚨 un «éxito» que llega después de cancelar se ignora (apartado 40: sin estados huérfanos)');
  ok(siguienteEstadoAsincrono('success', 'fallo') === 'success', '…y un fallo que llega tarde no tumba lo que ya está bien');
  ok(siguienteEstadoAsincrono('inventado', 'cargar') === 'loading', 'un estado que no existe se lee como reposo');
  ok(Object.keys(TRANSICIONES_ASINCRONAS).every((e) => Object.values(TRANSICIONES_ASINCRONAS[e]).every((d) => TRANSICIONES_ASINCRONAS[d])),
    'cada transición lleva a un estado que existe');
}

/* ---------------------------------------------------------------------------
   6 · LOS TIEMPOS (apartados 9, 11, 12)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Los tiempos');
  ok(TIEMPOS_ASINCRONOS.retardoIndicador === RETARDO_INDICADOR_MS, 'el retardo de un giro es el de la F9 (no un segundo número)');
  ok(TIEMPOS_ASINCRONOS.vacioTrasSalida === DURACIONES_MOTION.fast, 'el vacío que llega después espera lo que dura una salida (`fast`, F10)');
  ok(TIEMPOS_ASINCRONOS.guardandoTras > TIEMPOS_ASINCRONOS.retardoIndicador && TIEMPOS_ASINCRONOS.minimoVisible >= 600 && TIEMPOS_ASINCRONOS.guardadoVisible > TIEMPOS_ASINCRONOS.minimoVisible,
    '«Guardando…» arriba solo si tarda de verdad; lo que aparece se queda un mínimo; «Guardado», lo justo para leerlo');
  ok(TIEMPOS_ASINCRONOS.esqueletoTarda < TIEMPOS_ASINCRONOS.esqueletoReintentar, 'el esqueleto primero dice que tarda y después ofrece reintentar');
  ok(/\.vacio-entra\.vacio-tras-salida \{\s*animation-delay: var\(--motion-dur-fast\);/.test(CSS), 'en el CSS, el retraso del vacío es el token `fast`, no un número');
  ok(/\.esqueleto\.esqueleto-quieto \{\s*animation-name: none;/.test(CSS), 'y el esqueleto que ya ha dicho que tarda deja de latir');
}

/* ---------------------------------------------------------------------------
   7 · EL INDICADOR DE ARRIBA (apartados 26-33)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · El indicador de arriba');
  const base = { sinCargar: [], pendientes: [], motivos: [], guardando: 0, guardandoDesde: null, reintentando: false, confirmadoEn: 0 };
  const T = TIEMPOS_ASINCRONOS;
  ok(estadoDeSincronizacion({ resumen: base, ahora: 10000 }).id === 'oculto', '🚨 todo bien: nada (apartado 28: no una consola de servidor)');
  const rapido = estadoDeSincronizacion({ resumen: { ...base, guardando: 1, guardandoDesde: 10000 }, ahora: 10300 });
  ok(rapido.id === 'oculto' && rapido.revisarEn === T.guardandoTras - 300, 'un guardado normal (300 ms) no se dice, pero se vuelve a mirar cuando sería lento');
  ok(estadoDeSincronizacion({ resumen: { ...base, guardando: 1, guardandoDesde: 10000 }, ahora: 10000 + T.guardandoTras }).id === 'guardando', '…y si tarda, «Guardando…»');
  const pend = estadoDeSincronizacion({ resumen: { ...base, pendientes: ['tareas', 'diario'] }, ahora: 1 });
  ok(pend.id === 'pendiente' && pend.texto === '2 cambios sin guardar' && pend.accion && pend.accion.texto === 'Guardar ahora',
    'lo que no ha llegado: «2 cambios sin guardar · Guardar ahora»');
  ok(contenidoDeIndicador('pendiente', { ...base, pendientes: ['x'] }).texto === '1 cambio sin guardar', '…en singular cuando es uno');
  ok(/si cierras la app antes, se pierden/i.test(pend.detalle), '…y dice la verdad: está en memoria, no en el dispositivo');
  ok(/No caben/.test(estadoDeSincronizacion({ resumen: { ...base, pendientes: ['x'], motivos: ['sin_espacio'] } }).detalle), 'sin espacio no es sin conexión (FIT F41)');
  const off = estadoDeSincronizacion({ resumen: base, enLinea: false, sinConexionDesde: 1000, ahora: 1500 });
  ok(off.id === 'oculto' && off.revisarEn === T.sinConexionTras - 500, 'una caída de medio segundo no se dice (apartado 30: nada exagerado)…');
  ok(estadoDeSincronizacion({ resumen: base, enLinea: false, sinConexionDesde: 1000, ahora: 1000 + T.sinConexionTras }).id === 'sin_conexion', '…una que dura, «Sin conexión»');
  ok(estadoDeSincronizacion({ resumen: { ...base, pendientes: ['x'] }, enLinea: false, sinConexionDesde: 0, ahora: 1 }).texto === 'Sin conexión · 1 cambio esperando',
    'sin conexión y con algo esperando: lo dice, sin botón (se manda solo al volver)');
  const carga = estadoDeSincronizacion({ resumen: { ...base, sinCargar: ['productividad'], pendientes: ['x'] } });
  ok(carga.id === 'sin_cargar' && carga.texto === 'No se ha podido cargar Productividad' && carga.accion.texto === 'Volver a cargar' && carga.rol === 'alert',
    '🚨 lo que no se pudo cargar va primero, como alerta, con «Volver a cargar»');
  ok(estadoDeSincronizacion({ resumen: { ...base, sinCargar: ['a', 'b'] } }).texto === 'No se han podido cargar 2 apartados', '…varias, contadas');
  ok(estadoDeSincronizacion({ resumen: { ...base, reintentando: true, pendientes: ['x'] } }).id === 'guardando', 'reintentando: «Guardando…»');
  ok(estadoDeSincronizacion({ resumen: { ...base, confirmadoEn: 1000 }, ahora: 1500 }).id === 'guardado', 'un reintento que sale bien: «Guardado», un momento…');
  ok(estadoDeSincronizacion({ resumen: { ...base, confirmadoEn: 1000 }, ahora: 1000 + T.guardadoVisible }).id === 'oculto', '…y se va');
  ok(nombreDeClave('relacion') === 'Relación' && nombreDeClave('zzz') === 'una parte de tus datos', 'cada clave tiene su nombre para decirlo (y una desconocida no enseña su id)');
  ok(['ajustes', 'perfil', 'productividad', 'fitness', 'estiloHombre', 'relacion', 'diario'].every((k) => NOMBRES_DE_CLAVE[k]), '…las que carga el arranque');
  const cargas = (APP.match(/loadData\(uidUser, '([^']+)'/g) || []).map((x) => x.match(/'([^']+)'/)[1]);
  ok(cargas.length >= 30 && cargas.every((k) => NOMBRES_DE_CLAVE[k]), `…todas las que carga el arranque (${cargas.length}) tienen nombre`);
  ok(ESTADOS_INDICADOR.filter((e) => e.accion).every((e) => e.accion.texto !== 'Reintentar'),
    'sus botones no se llaman «Reintentar»: el aviso de Fitness ya tiene uno, y dos iguales en la misma pantalla no se distinguen (E3 F30)');

  /* Con memoria: mínimo visible, y «Guardando…» pasa por «Guardado». */
  let v = siguienteIndicador({ id: 'oculto', desde: 0 }, { id: 'sin_conexion', revisarEn: null }, 1000);
  ok(v.id === 'sin_conexion' && v.desde === 1000, 'lo que aparece apunta desde cuándo');
  v = siguienteIndicador(v, { id: 'oculto', revisarEn: null }, 1200);
  ok(v.id === 'sin_conexion' && v.revisarEn === T.minimoVisible - 200, '🚨 apartado 12 — no desaparece a los 200 ms: se queda su mínimo (sin destello)');
  v = siguienteIndicador(v, { id: 'oculto', revisarEn: null }, 1000 + T.minimoVisible);
  ok(v.id === 'oculto', '…y después sí');
  v = siguienteIndicador({ id: 'guardando', desde: 0 }, { id: 'oculto', revisarEn: null }, 5000);
  ok(v.id === 'guardado' && v.revisarEn === T.guardadoVisible, 'apartado 27 — Guardar → Guardando… → Guardado (no desaparece como si nada)');
  v = siguienteIndicador({ id: 'sin_conexion', desde: 1000 }, { id: 'sin_cargar', revisarEn: null }, 1100);
  ok(v.id === 'sin_cargar', 'lo más importante entra ya, sin esperar el mínimo de lo de antes');
}

/* ---------------------------------------------------------------------------
   8 · EL ARRANQUE, LA SESIÓN Y LOS PERMISOS (apartados 4, 5, 9, 44-46)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Arranque, sesión y permisos');
  ok(estadoDeEspera({ desde: 0, ahora: 3000 }).id === 'cargando' && estadoDeEspera({ desde: 0, ahora: 3000 }).texto === null, 'cargando: solo el esqueleto');
  ok(estadoDeEspera({ desde: 0, ahora: TIEMPOS_ASINCRONOS.esqueletoTarda }).id === 'tarda', 'a los 8 s: «Está tardando más de lo normal…»');
  ok(estadoDeEspera({ desde: 0, ahora: TIEMPOS_ASINCRONOS.esqueletoReintentar }).id === 'reintentar' && estadoDeEspera({ desde: 0, ahora: 25000 }).revisarEn === null,
    'a los 20 s: ofrece volver a intentarlo, y deja de mirar el reloj');
  ok(arranqueSinDatos(['a', 'b'], 2) && !arranqueSinDatos(['a'], 2) && !arranqueSinDatos([], 0), 'sin cargar NADA no hay aplicación que enseñar; con una parte, sí');
  ok(/siguen en tu cuenta/.test(TEXTOS_ARRANQUE.texto) && /no se ha borrado nada/.test(TEXTOS_ARRANQUE.texto), '…y se dice que sus datos siguen donde estaban');
  ok(motivoDeSalida({ habia: true, hay: false, pedida: false }) === 'caducada', '🚨 apartado 45 — la sesión que se va sola ha caducado');
  ok(motivoDeSalida({ habia: true, hay: false, pedida: true }) === null && motivoDeSalida({ habia: false, hay: false }) === null, '…salir a propósito o no haber entrado nunca, no');
  ok(TEXTOS_SALIDA.caducada.sinGuardar(2) === '2 cambios de los últimos minutos no llegaron a guardarse.' && TEXTOS_SALIDA.caducada.sinGuardar(0) === null,
    '…y si se perdió algo, se dice cuánto');
  ok(estadoDePermiso({ name: 'NotAllowedError' }).id === 'denegado' && /permiso/.test(estadoDePermiso({ name: 'NotAllowedError' }).texto), 'apartado 46 — denegado: «no has dado permiso»');
  ok(estadoDePermiso({ name: 'NotFoundError' }).id === 'no_disponible' && estadoDePermiso({ name: 'NotReadableError' }).id === 'no_disponible', '…no disponible: otra frase');
  ok(estadoDePermiso(null).id === 'concedido', '…y sin error, concedido');
  ok(/estadoDePermiso\(e\)\.texto/.test(leer('src/components/BarcodeScanner.jsx')) && /Abriendo la cámara…/.test(leer('src/components/BarcodeScanner.jsx')),
    'el escáner distingue comprobando, denegado y no disponible');
}

/* ---------------------------------------------------------------------------
   9 · LA ÚLTIMA PETICIÓN GANA (apartados 40, 41, 49, 50)
   --------------------------------------------------------------------------- */
{
  console.log('\n9 · La última petición gana');
  const t = crearTurnos();
  const a = t.nuevo();
  const b = t.nuevo();
  ok(!a.vigente() && b.vigente(), 'request A, request B: solo B pinta (response A llega tarde y no pinta nada)');
  t.cancelar();
  ok(!b.vigente(), 'cancelar deja sin vigencia lo que había en marcha (sin giros huérfanos)');
  const c = t.nuevo();
  t.cerrar();
  ok(!c.vigente() && !t.nuevo().vigente(), 'al desmontar (cerrar) no pinta nada de lo que llegue después (apartado 50)');
  ok(/const turno = turnosOFF\.nuevo\(\);/.test(NUT) && /if \(!turno\.vigente\(\)\) return;/.test(NUT) && /const turno = turnosCodigo\.nuevo\(\);/.test(NUT),
    'Nutrición: la búsqueda de productos y la lectura de un código, con turnos');
  ok(/Productos con marca para «\$\{consultaOFF\}»/.test(NUT), '🐛 apartado 42 — unos resultados de otra búsqueda dicen de cuál son (lo de antes se queda mientras llega lo nuevo)');
  ok(/useEffect\(\(\) => \{\s*const t = crearTurnos\(\);\s*ref\.current = t;\s*return \(\) => t\.cerrar\(\);/.test(COMP),
    '`useTurnos` crea los turnos en el efecto: con `StrictMode` el efecto se deshace y se rehace');
}

/* ---------------------------------------------------------------------------
   10 · EL VACÍO QUE LLEGA DESPUÉS (apartados 21-23)
   --------------------------------------------------------------------------- */
{
  console.log('\n10 · Vacío ↔ contenido');
  ok(vacioTrasContenido({ pantallaEntrando: false }) === true && vacioTrasContenido({ pantallaEntrando: true }) === false,
    'un vacío que se monta con su pantalla entra con ella; uno que llega después espera');
  ok(vacioTrasContenido({ dentroDePantalla: false }) === false, '…y uno fuera de una pantalla (una hoja) entra con su hoja');
  ok(/useVacioQueLlega\(ref\);[\s\S]{0,120}<div ref=\{ref\} className="vacio-entra/.test(UI), '`EmptyHint` lo usa');
  ok(/el\.classList\.add\('vacio-tras-salida'\)/.test(VACIO) && /closest\('\[data-navegacion\]'\)/.test(VACIO) && /getAnimations/.test(VACIO),
    'se decide mirando si lo que lo contiene sigue entrando (la pantalla, una pestaña), antes de pintar');
  const CONS = leer('src/views/ConstructorView.jsx');
  const CAL = leer('src/views/CalendarView.jsx');
  ok(/\{rutina\.lineas\.length === 0 && \(\s*<VacioQueLlega>/.test(CONS) && !/rutina\.lineas\.length === 0 \? \(/.test(CONS),
    '🐛 el Constructor deja la lista montada aunque se vacíe: lo último sale con su copia y el vacío llega después');
  ok(/\{dia\.vacio && \(\s*<VacioQueLlega>/.test(CAL) && !/\{dia\.vacio \? \(/.test(CAL), '🐛 …y la agenda de un día, igual');
}

/* ---------------------------------------------------------------------------
   11 · EL MAPA Y LA AUDITORÍA (apartados 1, 10, 40, 60)
   --------------------------------------------------------------------------- */
{
  console.log('\n11 · El mapa de lo asíncrono y la auditoría');
  ok(MAPA_ASINCRONO.length >= 10 && MAPA_ASINCRONO.every((m) => m.id && m.que && m.patron && m.estados.length && m.dueno && m.antes && m.queda),
    `cada operación asíncrona con su patrón, sus estados y quién es el dueño de su movimiento (${MAPA_ASINCRONO.length})`);
  ok(MAPA_ASINCRONO.every((m) => existsSync(join(RAIZ, m.archivo))), '…y el archivo de cada una existe');
  ok(MAPA_ASINCRONO.every((m) => m.estados.every((e) => ESTADOS_ASINCRONOS.some((x) => x.id === e))), '…con estados de la máquina, no inventados');
  ok(Object.keys(ARCHIVOS_CON_RED).every((f) => existsSync(join(RAIZ, f))) && Object.values(ARCHIVOS_CON_RED).every((id) => MAPA_ASINCRONO.some((m) => m.id === id)),
    'cada pantalla que llama a la red apunta a su línea del mapa');
  ok(GIROS_PERMITIDOS.every((g) => existsSync(join(RAIZ, g.archivo)) && g.porque), 'los giros permitidos, con su motivo');
  const hoy = auditarAsincronia({ archivos: ARCHIVOS });
  ok(hoy.length === 0, `🚨 la auditoría, limpia con el código de hoy${hoy.length ? `: ${JSON.stringify(hoy.slice(0, 4))}` : ''}`);
  EJEMPLOS_MALOS_F16.forEach((e) => {
    const r = auditarAsincronia({ archivos: { [e.ruta]: e.src } });
    ok(r.some((x) => x.regla === e.regla), `…y caza su ejemplo malo: ${e.regla}`);
  });
  /* El fallo de verdad que cazó: la entrada del PIN, tal y como estaba. */
  const pinDeAntes = 'const intentar = async (valor) => {\n    setVerificando(true);\n    const ok = await verificarPin(valor, pinHash, pinSalt);\n    setVerificando(false);\n  };';
  ok(banderasSinFinally(pinDeAntes).length === 1, '🐛 caza la entrada del PIN de antes (si `crypto.subtle` lanzaba, «verificando» para siempre)');
  ok(banderasSinFinally('setX(true);\ntry { await f(); } finally { setX(false); }').length === 0
    && banderasSinFinally('setX(true);\ntry { r = await f(); } catch { r = null; }\nsetX(false);').length === 0,
  '…y no salta con un `finally` ni con el `await` dentro de un `try`');
  ok((UI.match(/try \{ ok = await verificarPin\([^)]*\); \} catch \{ ok = false; \} finally \{ setVerificando\(false\); \}/g) || []).length === 2
    && (APP.match(/finally \{ setVerificando\(false\); \}/g) || []).length === 2,
  '🐛 las cuatro esperas del PIN y la biometría, en un `finally`');
}

/* ---------------------------------------------------------------------------
   12 · CABLEADO (apartados 3, 5, 26, 44, 45, 47, 50, 52, 53)
   --------------------------------------------------------------------------- */
{
  console.log('\n12 · Cableado');
  ok(/if \(usuarioDeLaSesion\(\) !== uidUser\) empezarSesionDeDatos\(uidUser\);/.test(APP), 'el arranque empieza la sesión de datos del usuario (y al reintentar con el mismo, no la vacía)');
  ok(/const cargas = \[/.test(APP) && /await Promise\.all\(cargas\)/.test(APP) && /if \(arranqueSinDatos\(clavesSinCargar\(\), cargas\.length\)\) \{ setArranque\('sin_datos'\); return; \}/.test(APP),
    '🚨 si no se pudo cargar nada, no se enseña una cuenta vacía');
  ok(/if \(arranque === 'sin_datos'\) return <ErrorDeArranque onReintentar=\{reintentarArranque\}/.test(APP) && /\}, \[session, intentoCarga\]\);/.test(APP),
    '…sino «No se han podido cargar tus datos», y reintentar vuelve a cargar');
  ok(/empezarSesionDeDatos\(null\);/.test(APP) && /motivoDeSalida\(\{ habia: !!usuarioAnterior\.current, hay: false, pedida: consumirSalidaPedida\(\) \}\)/.test(APP),
    'al salir se vacía lo pendiente, y se distingue la sesión que caduca');
  ok(/return <Auth salida=\{salida\} \/>/.test(APP) && /TEXTOS_SALIDA\[salida\.motivo\]\.titulo/.test(AUTH) && /role="status" data-salida/.test(AUTH),
    'la pantalla de entrar explica la caducidad');
  ok(/<IndicadorDeSincronizacion \/>/.test(APP), 'el indicador de arriba, uno para toda la aplicación');
  ok(/quieto=\{espera\.id !== 'cargando'\}/.test(APP) && /<AvisoDeEspera estado=\{espera\} \/>/.test(APP), 'la pantalla de carga dice que tarda y deja de latir');
  ok(/role="status" className="sr-only" data-anuncio-estado/.test(COMP) && /role="alert" className="sr-only" data-anuncio-alerta/.test(COMP),
    '♿ apartado 53 — lo que dice se anuncia desde dos regiones SIEMPRE montadas (status y alert)');
  ok(/<Presencia visible=\{visible\} entrada="toastEnter" salida="toastExit"/.test(COMP) && /<CambioDeContenido clave=\{pintado\.id\}/.test(COMP),
    'entra y sale como un aviso y cambia de frase en su sitio: ningún movimiento escrito a mano (F1)');
  ok(/className="indicador-estado fixed inset-x-0 z-flotante/.test(COMP) && /\.indicador-estado \{\s*top: calc\(var\(--safe-top\) \+ 14px\);\s*padding-left: calc\(var\(--safe-left\) \+ 60px\);\s*padding-right: calc\(var\(--safe-right\) \+ 60px\);/.test(CSS),
    'arriba, con las áreas seguras y sitio para la lupa (F15), en su capa con nombre (F6)');
  ok(/reintentarGuardados\(\); \};/.test(SUPA) && /export function reintentarGuardados\(\)/.test(SUPA), 'al volver la conexión, lo pendiente se manda solo (apartado 32)');
  ok(/if \(!usuario \|\| !lista\.length\) return Promise\.resolve\(true\);/.test(SUPA), '…y sin nada pendiente no hace nada (ni un «Guardado» que nadie pidió)');
  ok(/export const reintentarGuardados = async \(\) => true;/.test(leer('scripts/smoke.mjs')), 'el doble de Supabase del banco de renderizado lo exporta también (E3 F16)');
  ok(PIEZAS_DE_MOVIMIENTO.includes('src/components/estadosAsincronos.jsx') && PIEZAS_DE_MOVIMIENTO.includes('src/components/vacioMotion.js'),
    'las piezas nuevas las vigila la auditoría del orquestador (temporizadores y escuchas limpios, F11)');
  ok(PIEZAS_MOTION.includes('src/lib/sincronizacion.js') && PIEZAS_MOTION.includes('src/components/estadosAsincronos.jsx'), '…y la de rendimiento (F13)');
  ok(!/setInterval/.test(sinComentarios(COMP)) && (COMP.match(/setTimeout\(/g) || []).length === (COMP.match(/clearTimeout\(/g) || []).length,
    'apartado 51 — ni un `setInterval`: el reloj se vuelve a mirar una vez, cuando toca, y cada espera se limpia');
}

/* ---------------------------------------------------------------------------
   13 · LO QUE SE DA LA VUELTA, LA DOCUMENTACIÓN Y EL MAPA
   --------------------------------------------------------------------------- */
{
  console.log('\n13 · Lo que se da la vuelta, el mapa y los documentos');
  ok(estadoEH('error_guardado').detectable === true && estadoEH('sincronizando').detectable === true && igual(ESTADOS_SIN_MECANISMO.map((e) => e.id), ['conflicto']),
    '🔓 EH F41 — el error de guardado y la sincronización ya se detectan; el conflicto entre dispositivos sigue sin poder saberse');
  ok(caida('fallo_guardado').avisa === true && caidasSinAviso().length === 0, '🔓 EH F52 — el fallo de guardado avisa, y ninguna caída queda sin aviso');
  ['vacios', 'errores', 'estado_sistema', 'esqueleto', 'pensando'].forEach((id) => {
    const e = MOTION_MAP.find((x) => x.id === id);
    ok(e && e.fase === 16 && e.estado !== 'sin_motion', `el MOTION_MAP: «${id}» es de la F16 y ya no está sin movimiento`);
  });
  ok(DECISIONES_F16.length >= 8 && DECISIONES_F16.every((d) => d.apartados.length && d.que && d.porque), 'las decisiones, con sus apartados y su motivo');
  ok(DECISIONES_F16.some((d) => /pisa|pisaría/.test(d.porque) && /PIN/.test(d.porque)), '…la primera, la carga fallida que pisaba la cuenta');
  ok(REVISADO_Y_BIEN_F16.length >= 5 && NO_EN_F16.length >= 3 && NO_EN_F16.every((n) => n.porque), 'lo revisado y bien, y lo que no se hace con su motivo');
  ok(NO_EN_F16.some((n) => n.apartados.includes(34) && /Realtime/.test(n.porque)), '…el tiempo real no existe aquí, y se dice (apartados 34-36)');
  ok(CUANDO_F16.length >= 5, 'cuándo usar cada pieza');
  const recorrido = leer('scripts/test-app-real.mjs');
  const sec = recorrido.slice(recorrido.indexOf('── MS F16'));
  ok(/── MS F16 · Estados de sistema/.test(recorrido) && /FALLAR_LECTURA/.test(sec) && /ABORTAR_ESCRITURA\.add/.test(sec) && /new Event\(v \? 'online' : 'offline'\)/.test(sec) && /Tu sesión ha caducado/.test(sec) && /RETRASO_LECTURA/.test(sec),
    'el recorrido mide en Chromium el guardado que falla y se reintenta, la carga fallida, sin conexión, el arranque lento y la sesión que caduca');
  const SIS = leer('docs/MOTION_SYSTEM.md');
  ok(/sincronizacion\.js/.test(SIS) && /IndicadorDeSincronizacion/.test(SIS) && /crearTurnos/.test(SIS) && /vacio-tras-salida/.test(SIS) && /auditarAsincronia/.test(SIS),
    'MOTION_SYSTEM.md explica el modelo asíncrono, el guardado, el indicador, las carreras y el vacío (apartado 56)');
  ok(/toda nueva operación asíncrona/i.test(SIS), '…con la regla permanente del apartado 60');
  ok(/\*\*F16\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F16');
  ok(!/framer-motion|react-spring|gsap|animejs|popmotion|motion-one/.test(leer('package.json')), 'ni una librería de animación en el paquete');
}

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
