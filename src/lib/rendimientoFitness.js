// ============================================================================
// FIT · Fase 40/45 — RENDIMIENTO Y OPTIMIZACIÓN TÉCNICA DE FITNESS
//
// *"Esta fase NO añade funcionalidades nuevas. El objetivo es que todo Fitness
// siga siendo rápido cuando haya muchos datos."* Y su apartado 2 es la regla de
// todo lo que hay aquí: **"Primero medir. Después optimizar."**
//
// ── LO QUE SE MIDIÓ, Y DÓNDE ESTABA EL TIEMPO ───────────────────────────────
//
// Con el escenario grande del apartado 53 —1 000 sesiones, 900 ejercicios
// propios, 100 objetivos y 1 000 fotos— casi todo Fitness ya iba por debajo de
// los 50 ms, porque lo decidieron fases anteriores (`YA_EXISTIA_F40`). Salían
// **dos cuellos de botella de verdad**, y ninguno se habría visto sin medir:
//
//   · **El historial de rangos de la F22** calculaba el rango de CADA día
//     entrenado desde cero —cada ejercicio, cada grupo, el global—, así que el
//     resumen de Rangos tardaba **6,4 s** la primera vez y el centro de Progreso
//     **6,6 s**. Lo lee el panel de Rangos (F25) y la línea temporal (F28).
//   · **Cada tecla de un peso guardaba TODO Fitness en Supabase** (F7/F9):
//     «20.5» eran cuatro subidas del `fitness` entero —1,4 MB con 300
//     sesiones— y cuatro repintados de la aplicación por un campo.
//
// Y al medir el primero apareció un fallo que no era de rendimiento: **el
// historial de un rango se quedaba viejo al clasificar un ejercicio** (la caché
// de la F22 solo miraba las sesiones). Apartado 13: *"Nunca mostrar datos
// antiguos como actuales después de una modificación"*.
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. 🚨 UNA OPTIMIZACIÓN DA EL MISMO RESULTADO, Y LA PRUEBA LO COMPARA** (apartado
// 59). El historial incremental se compara punto a punto con el cálculo entero
// de antes, sobre escenarios con sesiones desordenadas, del mismo día, sin
// fecha, en curso, clasificaciones y reclasificaciones. Ni una fórmula cambia.
//
// **2. 🚨 SE REUTILIZA LO QUE NO HA CAMBIADO, Y SE DICE POR QUÉ NO PUEDE HABER
// CAMBIADO.** El rango de un ejercicio depende SOLO de sus apariciones y de su
// estimación (F15, F19), así que entre un día y el siguiente se recalculan los
// ejercicios que se entrenaron o se clasificaron en medio, y nada más. Es el
// *"completar curl → actualizar curl"* del apartado 12.
//
// **3. ⚠️ LO MEDIDO Y DESCARTADO SE DECLARA** (`DESCARTADO_F40`): reutilizar grupos
// enteros ganaba un 8 % en rutinas divididas y nada en cuerpo completo, así que
// no se quedó —el apartado 2 prohíbe complicar el código sin beneficio real—.
//
// **4. ⚠️ UNA CACHÉ VA COLGADA DE UN OBJETO QUE NO CAMBIA, O NO VA** (F36, apartado
// 12). Las nuevas —apariciones por sesión, reparto por ejercicio, relevancia,
// pesos de un reparto— van en `WeakMap` sobre objetos que ningún código edita:
// una sesión, una ficha, un reparto **congelado**. Si cambian, son otro objeto.
//
// **5. ⚠️ LO QUE NECESITA A JOSUÉ O UN CAMBIO DE ARQUITECTURA SE DOCUMENTA**
// (apartado 66): dividir el bundle en trozos (**C-42**, en `docs/03`) y las
// miniaturas de las fotos (F27) no se improvisan aquí.
//
// **6. ⚠️ UNA AUDITORÍA QUE NO PUEDE PONERSE ROJA NO SIRVE** (EH F42): cada
// casilla de `auditarRendimientoFitness` trae su `ejemploMalo` y la prueba comprueba
// que lo caza.
// ============================================================================

import { CATALOGO_EJERCICIOS } from './ejercicios.js';

/* ═══════════════════════════════════════════════════════════════════════════
   1 · EL AUTOGUARDADO DE LO QUE SE ESCRIBE (apartados 29, 30, 32, 33 y 34)
   ═══════════════════════════════════════════════════════════════════════════
   🐛 **Cada tecla de un peso guardaba TODO Fitness.** El campo de la serie
   confirmaba en cada pulsación, así que escribir «20.5» eran cuatro guardados
   —y cada uno sube el `fitness` entero a Supabase: 460 KB con 100 sesiones,
   1,4 MB con 300— y cuatro repintados de la aplicación entera por un campo.
   Ahora lo que se escribe vive en el campo y se guarda **una vez**: al salir de
   él, a los `RETARDO_AUTOGUARDADO_MS` de dejar de escribir, al esconderse la
   página o al desaparecer el campo. ⚠️ **Es el mismo retardo que ya tenía la
   nota** (F9, apartado 23): un solo número para «guardar lo que se escribe».
   ⚠️ Y **marcar una serie, los botones y la navegación no esperan nunca**
   (apartado 34): salir del campo para pulsarlos ya guarda lo escrito. */
export const RETARDO_AUTOGUARDADO_MS = 700;

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LOS PRESUPUESTOS (apartados 50 y 52)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ Milisegundos **en Node, sobre el escenario grande, la primera vez** (sin
   nada en caché). No dicen lo que tarda el iPhone —eso es R1—: dicen que el
   cálculo no es el problema, y la prueba se pone roja si una fase futura vuelve
   a hacer el trabajo entero. Con holgura a propósito: son un techo, no una
   marca que batir (*"No obsesionarse con números artificiales"*, apartado 50). */
export const ESCENARIO_PRESUPUESTO = { sesiones: 600, propios: 300, objetivos: 100, fotos: 1000, clasificaciones: 40 };

export const PRESUPUESTOS_FITNESS = [
  { id: 'resumen_rangos', nombre: 'El panel de Rangos (F25), la primera vez', ms: 1800, antes: '2,8 s con 600 sesiones (6,4 s con 1 000); ahora 0,55 s' },
  { id: 'centro_progreso', nombre: 'El centro de Progreso (F28), la primera vez', ms: 1800, antes: '2,6 s con 600 sesiones (6,6 s con 1 000); ahora 0,5 s' },
  { id: 'biblioteca', nombre: 'Buscar en la biblioteca con 1 000 ejercicios', ms: 400, antes: 'Ya estaba por debajo (F34)' },
  { id: 'historial', nombre: 'Las fichas y los filtros del historial', ms: 400, antes: 'Ya estaba por debajo (F10)' },
  { id: 'actividad', nombre: 'La actividad (F31)', ms: 200, antes: 'Ya estaba por debajo' },
];
export const presupuestoFitness = (id) => PRESUPUESTOS_FITNESS.find((p) => p.id === id) || null;

/* ═══════════════════════════════════════════════════════════════════════════
   3 · EL ESCENARIO GRANDE (apartados 53 y 54)
   ═══════════════════════════════════════════════════════════════════════════
   *"Simular con 1000 ejercicios, 1000 sesiones, 100 objetivos, 1000 fotos
   metadata […] No es necesario crear archivos enormes si existe otra forma de
   simular el volumen."* Se genera en memoria, **sin azar** —dos pasadas dan lo
   mismo—, con ejercicios del catálogo de verdad. ⚠️ Las sesiones salen en
   orden, una por día hasta `hoy`, con cinco ejercicios de cuatro series; con
   `dividida` cada sesión es de un solo músculo (una rutina push/pull/pierna),
   que es el otro caso que importa al medir. */
export function escenarioGrande({
  sesiones = 1000, propios = 0, objetivos = 0, fotos = 0, clasificaciones = 0,
  hoy = '2026-09-17', dividida = false,
} = {}) {
  const base = CATALOGO_EJERCICIOS.filter((e) => e && !e.archivado);
  const ids = base.map((e) => e.id);
  const principal = (e) => {
    const m = [...(e.musculos || [])].sort((a, b) => (b.porcentaje || 0) - (a.porcentaje || 0))[0];
    return m ? m.subgrupoId : '';
  };
  const porMusculo = new Map();
  base.forEach((e) => {
    const k = principal(e);
    if (!porMusculo.has(k)) porMusculo.set(k, []);
    porMusculo.get(k).push(e.id);
  });
  const musculos = [...porMusculo.values()].filter((l) => l.length >= 3);
  const idDe = (i, k) => (dividida && musculos.length
    ? musculos[i % musculos.length][k % musculos[i % musculos.length].length]
    : ids[(i * 7 + k * 13) % ids.length]);

  const [a, m, d] = String(hoy).split('-').map(Number);
  const DIA = 86400000;
  const fin = new Date(a, m - 1, d, 18, 0, 0).getTime();
  const iso = (t) => {
    const x = new Date(t);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };

  const lasSesiones = Array.from({ length: sesiones }, (_, i) => {
    const t = fin - (sesiones - i) * DIA;
    return {
      id: `gran-s${i}`, estado: 'completada', fecha: iso(t), iniciadaEn: t, terminadaEn: t + 3600000, nombre: `Sesión ${i + 1}`,
      origen: {
        tipo: 'plan',
        ejercicios: Array.from({ length: 5 }, (_, k) => ({
          id: `gran-s${i}e${k}`,
          exerciseId: idDe(i, k),
          series: Array.from({ length: 4 }, (__, n) => ({
            id: `gran-s${i}e${k}n${n}`, numero: n + 1, origen: 'planificada', estado: 'hecha', modo: 'reps',
            plan: { reps: 10, peso: 40 }, hecho: { reps: 8 + (i % 5), peso: 40 + (i % 20) },
          })),
        })),
      },
    };
  });
  const losPropios = Array.from({ length: propios }, (_, i) => ({
    ...base[i % base.length], id: `gran-propio-${i}`, nombre: `Propio ${i + 1}`, archivado: false,
  }));
  const losObjetivos = Array.from({ length: objetivos }, (_, i) => ({
    id: `gran-o${i}`, exerciseId: ids[i % ids.length], tipo: 'reps', valor: 15, creadoEn: fin - 100 * DIA, estado: 'activo',
  }));
  const lasClasificaciones = Array.from({ length: clasificaciones }, (_, i) => ({
    id: `gran-c${i}`, exerciseId: ids[(i * 5 + 3) % ids.length], respuesta: 'x', puntuacion: 300 + ((i * 37) % 500),
    fuente: 'cuestionario', confianza: 'baja', creadoEn: fin - (200 - i) * DIA, actualizadoEn: i % 4 === 0 ? fin - (50 - i) * DIA : null,
  }));
  const lasFotos = Array.from({ length: fotos }, (_, i) => ({
    id: `gran-f${i}`, path: `u/gran-${i}.jpg`, fecha: iso(fin - i * DIA), tags: ['frontal'], nota: '',
  }));
  return {
    fitness: { sesiones: lasSesiones, ejercicios: losPropios, objetivos: losObjetivos, clasificaciones: lasClasificaciones },
    fotos: lasFotos,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LA AUDITORÍA (apartados 25-28, 37, 40, 55, 56 y 57)
   ═══════════════════════════════════════════════════════════════════════════
   Lee el código de Fitness —`ARCHIVOS_FITNESS` (F37) y los dos ganchos de
   `components/` que escuchan eventos— y dice dónde mirar. ⚠️ Cada regla trae el
   ejemplo que la pone roja, porque una auditoría que no puede fallar no sirve. */

export const HOOKS_FITNESS = ['src/components/dialogoAccesible.js', 'src/components/scrollAlVolver.js'];

/* Quita comentarios conservando los saltos de línea (FIT F38: si no, la línea
   que se devuelve apunta a otro sitio). Local a propósito: exportarlo sería un
   segundo nombre con otro significado (FIT F36). */
function sinComentariosF40(src) {
  return String(src || '')
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
}
const lineaDe = (src, i) => String(src).slice(0, i).split('\n').length;

/** Apartados 55 y 56 — un intervalo que nadie limpia sigue corriendo al salir. */
export function intervalosSinLimpiar(src) {
  const c = sinComentariosF40(src);
  const i = c.search(/\bsetInterval\s*\(/);
  return i >= 0 && !/\bclearInterval\s*\(/.test(c) ? [{ dato: 'setInterval', linea: lineaDe(c, i) }] : [];
}

/** Apartado 55 — cada `addEventListener('x')` con su `removeEventListener('x')`. */
export function escuchadoresSinQuitar(src) {
  const c = sinComentariosF40(src);
  const out = [];
  const re = /addEventListener\(\s*(['"])([\w-]+)\1/g;
  let m;
  while ((m = re.exec(c))) {
    const quita = new RegExp(`removeEventListener\\(\\s*(['"])${m[2]}\\1`);
    if (!quita.test(c)) out.push({ dato: m[2], linea: lineaDe(c, m.index) });
  }
  return out;
}

/** Apartado 57 — una `createObjectURL` sin su `revokeObjectURL` es memoria perdida. */
export function urlsSinRevocar(src) {
  const c = sinComentariosF40(src);
  const i = c.search(/createObjectURL\s*\(/);
  return i >= 0 && !/revokeObjectURL\s*\(/.test(c) ? [{ dato: 'createObjectURL', linea: lineaDe(c, i) }] : [];
}

/** Apartado 40 — quien escucha `resize` mide como mucho una vez por fotograma. */
export function resizeSinFotograma(src) {
  const c = sinComentariosF40(src);
  const i = c.search(/addEventListener\(\s*['"]resize['"]/);
  return i >= 0 && !/requestAnimationFrame\s*\(/.test(c) ? [{ dato: 'resize', linea: lineaDe(c, i) }] : [];
}

/**
 * Apartado 37 — *"Nunca utilizar índices de array como key cuando exista un ID
 * estable"*. Caza un `.map((x, i) => …)` cuya `key` es solo el índice cuando el
 * elemento **tiene** `x.id` (lo usa el propio cuerpo). ⚠️ Una lista sin id —las
 * letras de la semana, los huecos del mes, los puntos de una adherencia— sí
 * puede ir por posición: no hay otra cosa.
 */
export function clavesPorIndice(src) {
  const c = sinComentariosF40(src);
  const out = [];
  const re = /\.map\(\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g;
  let m;
  while ((m = re.exec(c))) {
    const [, el, idx] = m;
    const trozo = c.slice(m.index, m.index + 900);
    const k = trozo.match(/\bkey=\{([^}]*)\}/);
    if (!k) continue;
    const expr = k[1];
    const usaIndice = new RegExp(`\\b${idx}\\b`).test(expr);
    const tieneMiembro = /\w\.\w/.test(expr);
    if (usaIndice && !tieneMiembro && new RegExp(`\\b${el}\\.id\\b`).test(trozo)) out.push({ dato: `key={${expr}}`, linea: lineaDe(c, m.index) });
  }
  return out;
}

/**
 * Apartados 25-28 — **el reloj de la sesión y el del descanso redibujan solo su
 * número.** `useAhora` (el tic de medio segundo) solo puede llamarse dentro de
 * `RelojSesion` y `DescansoVivo` —y en `SesionRecuperable`, la tarjeta compacta
 * de «Continuar entrenamiento», que es solo eso—: si la pantalla del
 * entrenamiento lo pidiera, repintaría la tabla de series, el carrusel y la
 * anatomía dos veces por segundo mientras él escribe un peso.
 */
export const RELOJES_PERMITIDOS = ['RelojSesion', 'DescansoVivo', 'SesionRecuperable'];
export function relojFueraDeSuSitio(src) {
  const c = sinComentariosF40(src);
  const out = [];
  const re = /\buseAhora\s*\(/g;
  let m;
  while ((m = re.exec(c))) {
    const antes = c.slice(0, m.index);
    if (/function\s+$/.test(antes)) continue; // la definición del gancho
    const funciones = [...antes.matchAll(/function\s+(\w+)\s*\(/g)];
    const dentro = funciones.length ? funciones[funciones.length - 1][1] : null;
    if (dentro === 'useAhora') continue;
    if (!RELOJES_PERMITIDOS.includes(dentro)) out.push({ dato: dentro || '(fuera de una función)', linea: lineaDe(c, m.index) });
  }
  return out;
}

/**
 * Apartados 29 y 32 — un campo numérico del entrenamiento en vivo NO confirma en
 * cada tecla: su `onChange` programa (`confirmarLuego`), y el retardo es
 * `RETARDO_AUTOGUARDADO_MS`, no un número suelto.
 */
export function guardadoPorTecla(src) {
  const c = sinComentariosF40(src);
  const out = [];
  const re = /onChange=\{\(ev\)\s*=>\s*\{[^}]*\bconfirmar\(/g;
  let m;
  while ((m = re.exec(c))) out.push({ dato: 'onChange → confirmar', linea: lineaDe(c, m.index) });
  const suelto = /setTimeout\([^;]*?,\s*\d{3,4}\s*\)/g;
  while ((m = suelto.exec(c))) {
    if (/onGuardar|confirmar/.test(m[0])) out.push({ dato: 'retardo escrito a mano', linea: lineaDe(c, m.index) });
  }
  return out;
}

export const CASILLAS_RENDIMIENTO = [
  { id: 'intervalos', texto: 'Ningún intervalo se queda corriendo al salir (apartados 55 y 56)', revisa: intervalosSinLimpiar,
    ejemploMalo: 'useEffect(() => { setInterval(tic, 500); }, []);' },
  { id: 'escuchadores', texto: 'Cada escuchador se quita al desmontar (apartado 55)', revisa: escuchadoresSinQuitar,
    ejemploMalo: "useEffect(() => { window.addEventListener('scroll', f); }, []);" },
  { id: 'object_urls', texto: 'Cada URL de un archivo se revoca (apartado 57)', revisa: urlsSinRevocar,
    ejemploMalo: 'const url = URL.createObjectURL(file);' },
  { id: 'resize', texto: 'Un resize mide una vez por fotograma (apartado 40)', revisa: resizeSinFotograma,
    ejemploMalo: "window.addEventListener('resize', medir); window.removeEventListener('resize', medir);" },
  { id: 'claves', texto: 'Ninguna lista con id va con la posición de key (apartado 37)', revisa: clavesPorIndice,
    ejemploMalo: 'fichas.map((f, i) => <Tarjeta key={i} onAbrir={() => abrir(f.id)} />)' },
  { id: 'reloj_aislado', texto: 'El tic del reloj solo repinta el reloj (apartados 25-28)', revisa: relojFueraDeSuSitio,
    ejemploMalo: 'export default function EntrenamientoVivoView() { const ahora = useAhora(true); return null; }' },
  { id: 'guardado_por_tecla', texto: 'Escribir un peso no guarda en cada tecla (apartados 29 y 32)', revisa: guardadoPorTecla,
    ejemploMalo: 'onChange={(ev) => { setTexto(ev.target.value); confirmar(ev.target.value); }}' },
];

/**
 * `archivos`: `{ ruta: código }` de Fitness. Devuelve cada casilla con lo que la
 * pone roja, para que se sepa dónde mirar.
 */
export function auditarRendimientoFitness({ archivos = {} } = {}) {
  const casillas = CASILLAS_RENDIMIENTO.map((c) => {
    const problemas = Object.entries(archivos).flatMap(([ruta, src]) => c.revisa(src).map((p) => ({ ruta, ...p })));
    return { id: c.id, texto: c.texto, ok: problemas.length === 0, problemas };
  });
  return { casillas, ok: casillas.every((c) => c.ok) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LO QUE YA EXISTÍA, LO OPTIMIZADO, LO DESCARTADO Y LO QUE NO SE HACE
   ═══════════════════════════════════════════════════════════════════════════ */

export const YA_EXISTIA_F40 = [
  { apartado: 4, que: 'La biblioteca no pinta todo el catálogo', donde: 'De veinte en veinte con «Ver más» (F34, apartado 37)' },
  { apartado: 5, que: 'La búsqueda no recorre el catálogo en cada tecla', donde: '`DEBOUNCE_BUSQUEDA_MS` de `rendimiento.js` (EH F44), y el texto buscable de cada ejercicio en un `WeakMap` (F34)' },
  { apartado: 7, que: 'Un índice ligero de búsqueda', donde: '`textoBuscable` junta nombre, músculo, material, entorno, tipo y patrón una vez por ficha (F34): no es una base de datos paralela' },
  { apartado: 8, que: 'Nada duplica un `Exercise`', donde: 'Planes, plantillas, sesiones y objetivos guardan `exerciseId` (F3); el snapshot de la sesión es la excepción (F7)' },
  { apartado: 10, que: 'Los selectores', donde: '`ejercicioPorId` (F2), `indiceDeProgresion` una vez por lista de sesiones (F11), `sesionesDelHistorial` (F10)' },
  { apartado: 14, que: 'El historial con cientos de sesiones', donde: 'Por páginas con «Ver más» (F10)' },
  { apartado: 17, que: 'Las fotos no se descargan en original', donde: 'Se suben reducidas a 1 600 px (F26) y se firman solo al verse (F38)' },
  { apartado: 18, que: 'La galería carga de forma progresiva', donde: '`loading="lazy"` y firmas al verse (F38, apartados 18 y 21)' },
  { apartado: 27, que: 'El reloj con marcas de tiempo', donde: '`iniciadaEn` y las pausas (E3 F25 y F7)' },
  { apartado: 28, que: 'El descanso con marcas de tiempo', donde: '`sesion.descanso` (F9)' },
  { apartado: 31, que: 'Una sola fuente de verdad en la sesión activa', donde: 'La sesión vive en `fitness.sesiones` (F7) y la pantalla no guarda copia' },
  { apartado: 38, que: 'Animar solo transform y opacidad', donde: '`auditarMovimiento()` de la F37 prohíbe `transition-all` y lo que mueve la caja' },
  { apartado: 39, que: 'Nada pesado en el scroll', donde: '`useScrollAlVolver` solo apunta un número, con `passive: true` (F38)' },
  { apartado: 44, que: 'La actividad deriva del historial', donde: '`actividadEntrenamiento.js` (F31), con `useMemo` por `fitness`' },
  { apartado: 45, que: 'La semana actual primero', donde: '`semanaDelPlan` calcula una semana; las otras, al navegar (F6 y F32)' },
  { apartado: 47, que: 'Supabase: una carga inicial y nada repetido', donde: '`loadData` una vez por clave al entrar (`App.jsx`); ninguna pantalla de Fitness consulta por su cuenta' },
  { apartado: 49, que: 'Lo que funcionaba sin red sigue igual', donde: 'Ninguna optimización de esta fase añade una petición' },
  { apartado: 57, que: 'Las URL de las fotos se revocan', donde: '`fotosProgreso.jsx` revoca la vista previa al cambiar y al cerrar (F26)' },
];

export const OPTIMIZACIONES_F40 = [
  { apartados: [11, 12, 42], archivo: 'src/lib/historialRangos.js · src/lib/motorRangos.js', que: 'El historial de un rango recalcula solo los ejercicios que cambiaron entre un día y el siguiente', medido: 'Panel de Rangos: 6,4 s → 0,95 s con 1 000 sesiones; 1,1 s → 0,47 s con 300' },
  { apartados: [11, 42], archivo: 'src/lib/rangos.js', que: 'Cuánto pone cada ejercicio en cada grupo y subgrupo se suma una vez por reparto', medido: 'La agregación por músculos dejó de ser lo más caro del panel' },
  { apartados: [13, 35], archivo: 'src/lib/progresion.js', que: 'Las apariciones de cada sesión se leen una vez por sesión, no una vez por punto del historial', medido: 'Es lo que hace posible el primer punto' },
  { apartados: [10, 35], archivo: 'src/lib/progresoMuscular.js · src/lib/clasificacion.js', que: 'El reparto muscular y la relevancia, una vez por ficha', medido: 'La cola de clasificación: 82 → 42 ms' },
  { apartados: [13], archivo: 'src/lib/historialRangos.js', que: '🐛 La caché del historial se tira también al clasificar y al cambiar los propios', medido: 'Antes seguía enseñando el historial de antes de clasificar' },
  { apartados: [25, 26, 27, 28], archivo: 'src/views/EntrenamientoVivoView.jsx', que: 'El tic del reloj y del descanso vive en `RelojSesion` y `DescansoVivo`', medido: 'La pantalla del entrenamiento ya no se repinta dos veces por segundo: solo el número' },
  { apartados: [29, 32, 33, 34], archivo: 'src/views/EntrenamientoVivoView.jsx', que: 'Un peso se guarda una vez, no en cada tecla, sin perderse al salir', medido: '«20.5»: 4 guardados de todo Fitness → 1' },
  { apartados: [33], archivo: 'src/views/EntrenamientoVivoView.jsx', que: '🐛 La nota escrita y cerrada antes del retardo ya no se pierde', medido: 'Antes se perdía al cerrar el panel, cambiar de ejercicio o salir' },
  { apartados: [41], archivo: 'src/lib/progresoEjercicios.js · src/views/ProgresoView.jsx', que: 'La gráfica toca como mucho 40 puntos; la línea sigue pasando por todos', medido: '300 registros: 600 círculos → 80' },
  { apartados: [40], archivo: 'src/components/comparadorFotos.jsx', que: 'El comparador mide una vez por fotograma al girar o cambiar de tamaño', medido: 'Un repintado por fotograma en vez de uno por evento' },
];

export const DESCARTADO_F40 = [
  { que: 'Reutilizar el rango de un grupo muscular entero entre días', porque: 'Medido: un 8 % menos en rutinas divididas y nada en cuerpo completo, a cambio de seguir qué grupos toca cada ejercicio. El apartado 2 prohíbe complicar el código sin beneficio real.' },
  { que: 'Virtualizar listas', porque: 'Todas las listas largas de Fitness ya van por páginas (biblioteca F34, historial F10): con 20 tarjetas pintadas no hay nada que virtualizar, y una librería nueva es lo que prohíbe el apartado 61.' },
  { que: 'Calcular solo el final del historial de un rango para el panel (apartado 42)', porque: 'La línea temporal de Progreso (F28) necesita todos los cambios, así que el historial entero se calcula de todas formas; y con la memoria del primer punto ya cuesta menos de un segundo con 1 000 sesiones.' },
];

export const NO_EN_FIT40 = [
  { que: 'Dividir el bundle en trozos que se cargan al abrirlos (apartados 22 y 23)', porque: 'Medido: 4,4 MB en un solo archivo, y lo más pesado no es Fitness (el lector de códigos de barras, el de PDF y el de Excel suman 1 MB). Con Vercel, un trozo de una versión anterior desaparece al publicar la siguiente: una pestaña abierta en su iPhone fallaría al abrir esa parte. Es la familia del service worker (DEP-30), así que se documenta como C-42 y lo decide Josué.' },
  { que: 'Miniaturas de las fotos (apartados 17, 19 y 20)', porque: 'La F26 sube UNA versión reducida a 1 600 px (F27 lo declaró). Una segunda más pequeña es otra subida y otro camino en Storage: una función nueva. Y las fichas de ejercicios no tienen imágenes de fuera: solo rutas propias (F34).' },
  { que: 'Workers, bases de datos locales o una caché central (apartado 61)', porque: 'Nada de lo medido lo necesita: el cuello de botella era hacer el trabajo entero, no dónde se hacía.' },
  { que: 'Cambiar de `localStorage` a otra persistencia (apartado 46)', porque: 'Fitness no guarda en `localStorage` más que el borrador del constructor (F3). Lo demás va a Supabase, y no hay nada medido que empuje a cambiarlo.' },
];

export const DECISIONES_FIT40 = [
  { id: 'misma_respuesta', texto: 'Una optimización devuelve lo mismo que antes, y la prueba lo compara punto a punto (apartado 59).' },
  { id: 'medido_antes', texto: 'Se optimiza lo medido: el panel de Rangos y el guardado por tecla; lo demás ya iba por debajo (apartado 2).' },
  { id: 'cache_en_objeto', texto: 'Una caché va colgada de un objeto que no cambia; si cambia, es otro objeto (apartado 12).' },
  { id: 'sin_arquitectura', texto: 'Lo que necesita a Josué o otra arquitectura se documenta, no se improvisa (apartado 66): C-42.' },
];
