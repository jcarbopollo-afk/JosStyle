// ============================================================================
// SO · Fase 1/5 — BUS DE EVENTOS (apartados 30 y 31)
//
// *"Si el proyecto tiene un Event Bus: ÚSALO. No crees otro sistema de eventos
// paralelo. Si no existe uno suficientemente adecuado, crea una abstracción
// ligera."*
//
// Inspeccionado: **no existe.** Lo más parecido es el patrón de RA F3, donde
// `evaluar()` devuelve una lista de eventos y quien la llama decide qué hacer.
// Eso es un modelo de *tirar*, no de *suscribirse*: sirve cuando hay un
// consumidor, y aquí van a ser cuatro.
//
//     Evento
//      ├── Audio          ← SO F1
//      ├── Haptics        ← más adelante
//      ├── Visual         ← RA F4, ya construido
//      └── Notificaciones ← Fase 10 de HT
//
// *"sin que Entrenamiento tenga que conocer ninguno de ellos"* (apartado 31).
//
// ── LO QUE ESTE BUS **NO** HACE ────────────────────────────────────────────
//
// **No define ni un evento propio de rachas.** Los de RA F3 ya existen con su
// nombre y su forma; aquí solo se transportan. Redefinirlos sería exactamente el
// "sistema de eventos paralelo" que el apartado 30 prohíbe, y dejaría dos
// catálogos que se irían separando con cada fase.
//
// Y es **síncrono a propósito**: un `setTimeout` convertiría "he pulsado el
// botón" y "ha sonado" en dos momentos distintos, que es justo lo que rompe la
// sensación de respuesta inmediata. Lo que necesite esperar, espera en su
// suscriptor.
// ============================================================================

/** Los suscriptores, por tipo de evento. `'*'` recibe todos. */
const suscriptores = new Map();

/**
 * Escuchar un tipo de evento (o `'*'` para todos).
 * Devuelve la función para dejar de escuchar — sin eso, un componente que se
 * desmonta dejaría su suscriptor vivo para siempre (apartado 34: *"limpia
 * listeners cuando corresponda"*).
 */
export function suscribir(tipo, fn) {
  if (typeof fn !== 'function') return () => {};
  if (!suscriptores.has(tipo)) suscriptores.set(tipo, new Set());
  suscriptores.get(tipo).add(fn);
  return () => {
    const grupo = suscriptores.get(tipo);
    if (!grupo) return;
    grupo.delete(fn);
    if (!grupo.size) suscriptores.delete(tipo);
  };
}

/**
 * Emitir un evento. Devuelve a cuántos suscriptores llegó, que es lo que
 * permite probar el bus sin espiar sus tripas.
 *
 * **Un suscriptor que falla no puede tumbar a los demás ni al emisor.** Si el
 * motor de audio revienta, el entrenamiento tiene que quedar guardado igual: es
 * el apartado 26 (*"nunca hagas que `audio.play()` provoque un error que rompa
 * la interfaz"*) aplicado en el sitio donde de verdad se puede garantizar.
 */
export function emitir(tipo, datos = {}) {
  const evento = { tipo, ...datos, en: Date.now() };
  let entregas = 0;
  for (const clave of [tipo, '*']) {
    for (const fn of suscriptores.get(clave) || []) {
      try { fn(evento); entregas++; } catch (e) { registrarFallo(clave, e); }
    }
  }
  return entregas;
}

/* Los fallos no se tragan en silencio —eso escondería un bug— pero tampoco se
   dejan explotar. Se apuntan y se puede preguntar por ellos. */
const fallos = [];
const MAX_FALLOS = 20;

function registrarFallo(tipo, error) {
  fallos.push({ tipo, mensaje: String(error?.message || error), en: Date.now() });
  if (fallos.length > MAX_FALLOS) fallos.shift();
  if (typeof console !== 'undefined' && console.warn) console.warn(`[eventos] fallo en un suscriptor de ${tipo}:`, error);
}

export const fallosDeEventos = () => [...fallos];
export const limpiarFallos = () => { fallos.length = 0; };

/** Cuántos escuchan un tipo. Para probar que las suscripciones se sueltan. */
export const cuentaSuscriptores = (tipo) => (suscriptores.get(tipo) || new Set()).size;

/** Solo para las pruebas y para reiniciar la app: deja el bus vacío. */
export const reiniciarBus = () => { suscriptores.clear(); fallos.length = 0; };
