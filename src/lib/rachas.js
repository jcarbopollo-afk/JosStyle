// ============================================================================
// RA · Fase 1/4 — MOTOR DE RACHAS
// ============================================================================
//
// Apartado 24, que es la frase que ordena todo lo demás: *"No hagas una solución
// rápida que simplemente incremente un contador. Quiero un sistema profesional
// basado en historial y reglas, donde los contadores sean resultados derivados
// del estado real."*
//
// El proyecto YA TENÍA una racha, y era exactamente la solución rápida que el
// apartado prohíbe: los hábitos de Productividad guardaban `rachaActual` y
// `mejorRacha` como números mutables, y al desmarcar el día de hoy se le restaba
// uno a mano. Eso significa que bastaba con desmarcar y volver a marcar para
// inflar el récord, y que un historial corregido a mano nunca cuadraba con el
// contador. **Aquí no se guarda ningún número: todos se derivan del historial.**
// Es el mismo camino que AR Fase 3, donde desaparecieron los contadores de uso
// del Armario por este mismo motivo.
//
// Este archivo es PURO: no toca React, ni Supabase, ni el reloj (el día de hoy
// entra siempre como parámetro). Por eso se puede probar entero con Node y por
// eso el mismo cálculo sirve en el Dashboard, en el Centro de Rachas y en una
// exportación, que es lo que pide el apartado 17 (CONSISTENCIA).
//
// LO QUE NO ESTÁ AQUÍ, Y ES DELIBERADO (apartado 22): niveles, medallas, logros,
// recompensas, confeti, animaciones, sonidos, rankings. Nada de eso pertenece a
// esta fase. Y por D2-02, cuando llegue, se queda dentro de Rachas y Sonido: no
// sube al Dashboard como puntuación global ni suma a la puntuación diaria.
// ============================================================================

import { todayISO, addDays, uid } from './helpers';

/* ===========================================================================
   1 · EL MODELO
   ===========================================================================

   Cuatro conceptos separados, como pide el apartado 5:

     Racha    — la definición: qué se mide, cómo se llama, con qué regla.
     Regla    — la condición de cumplimiento. Vive aparte para que añadir una
                nueva no obligue a tocar el motor (apartados 5 y 12).
     Evento   — un cumplimiento concreto, con su día local y su valor.
     Estado   — lo que se deriva de todo lo anterior. Nunca se guarda.

   Nada de esto lleva `user_id`: los datos viajan dentro de `app_data`, que ya
   está atado al usuario autenticado por RLS. El apartado 16 pide justo eso —
   *"nunca confiar en un user_id enviado desde el cliente"*—: aquí el cliente no
   manda ninguno, porque no existe ninguno que mandar. */

export const DEFAULT_RACHAS = { definiciones: [], eventos: [] };

/* Los tipos del apartado 3. Son identificadores estables: lo que se guarda en un
   evento es este `id`, no el nombre, así que renombrar "Estudio" no rompe nada.

   `custom` está para las rachas que Josué se cree él (apartado 14). No hay
   interfaz para crearlas todavía — eso es de una fase posterior— pero el motor
   no distingue: una racha suya se calcula igual que una de las de aquí. */
export const TIPOS_RACHA = [
  { id: 'training', label: 'Entrenamiento', icono: 'entreno' },
  { id: 'study', label: 'Estudio', icono: 'estudios' },
  { id: 'sleep', label: 'Sueño', icono: 'sueno' },
  { id: 'nutrition', label: 'Nutrición', icono: 'nutricion' },
  { id: 'habits', label: 'Hábitos', icono: 'productividad' },
  { id: 'goals', label: 'Objetivos', icono: 'objetivos' },
  { id: 'productivity', label: 'Productividad', icono: 'productividad' },
  { id: 'savings', label: 'Ahorro', icono: 'economia' },
  { id: 'custom', label: 'Personalizada', icono: 'objetivos' },
];

export const tipoRacha = (id) => TIPOS_RACHA.find((t) => t.id === id) || TIPOS_RACHA[TIPOS_RACHA.length - 1];

/* ===========================================================================
   2 · LAS REGLAS
   ===========================================================================

   Apartado 12: *"No es necesario implementar todas estas reglas ahora. Pero la
   arquitectura NO debe impedirlas."*

   La forma de no impedirlas es este registro. Una regla dice dos cosas:

     periodo    — sobre qué se cuenta la racha. Hoy solo existe 'dia'.
     evaluar    — dado el evento de ese día (o ninguno), ¿está cumplido?

   Añadir "estudiar 30 minutos" no toca el motor: es una entrada más aquí.

   ⚠️ **Lo que sí tocaría el motor, y por eso NO se ha fingido que existe:** una
   regla SEMANAL ("cumplir 4 veces por semana") no es una condición distinta
   sobre el mismo día — cuenta SEMANAS consecutivas, no días. Eso cambia el
   recorrido entero, no la evaluación. El sitio exacto donde entraría está
   marcado en `recorrerRacha`. Dejar aquí un `periodo: 'semana'` que el motor
   ignora sería un control decorativo, que es justo lo que prohíbe la regla 8. */
export const CLASES_REGLA = {
  /* Hay que cumplir todos los días. La regla por defecto. */
  diaria: {
    id: 'diaria',
    label: 'Todos los días',
    periodo: 'dia',
    describir: () => 'Todos los días',
    evaluar: (evento) => !!evento,
  },

  /* Como la diaria, pero perdona un número de días seguidos sin romperse.
     No es un capricho: es **la regla que el proyecto ya usaba** para los hábitos
     de Productividad desde la Fase 8 ("un solo día fallado no la rompe a cero,
     se pausa"). El apartado 25 pide reutilizar lo que existe en vez de
     duplicarlo, así que en lugar de cambiarle el comportamiento a Josué sin
     avisar, se ha convertido en una regla más del registro.

     Los días perdonados NO suman a la racha: perdonan, no cuentan. */
  diaria_con_gracia: {
    id: 'diaria_con_gracia',
    label: 'Todos los días, con margen',
    periodo: 'dia',
    tolerancia: 1,
    describir: (regla) => {
      const t = toleranciaDe(regla);
      return t === 1 ? 'Todos los días (se perdona un fallo)' : `Todos los días (se perdonan ${t} fallos seguidos)`;
    },
    evaluar: (evento) => !!evento,
  },

  /* "Estudiar al menos 30 minutos", "dormir al menos 7 horas". El valor va en el
     evento, y el mínimo en la regla. */
  minimo: {
    id: 'minimo',
    label: 'Al menos un mínimo',
    periodo: 'dia',
    describir: (regla) => `Al menos ${regla?.valor ?? 0}${regla?.unidad ? ` ${regla.unidad}` : ''} al día`,
    evaluar: (evento, regla) => !!evento && Number(evento.valor) >= Number(regla?.valor ?? 0),
  },

  /* "Hacer 50 flexiones". Idéntica en forma a `minimo` y separada a propósito:
     lo que cambia es qué le enseña la interfaz a Josué, no la aritmética. */
  cantidad: {
    id: 'cantidad',
    label: 'Una cantidad',
    periodo: 'dia',
    describir: (regla) => `${regla?.valor ?? 0}${regla?.unidad ? ` ${regla.unidad}` : ''} al día`,
    evaluar: (evento, regla) => !!evento && Number(evento.valor) >= Number(regla?.valor ?? 0),
  },
};

export const DEFAULT_REGLA = { clase: 'diaria' };

/** La clase de una regla, con caída a `diaria` si viene rota o de una versión vieja. */
export function claseDeRegla(regla) {
  return CLASES_REGLA[regla?.clase] || CLASES_REGLA.diaria;
}

/** Cuántos días seguidos perdona una regla. Cero para todas menos la de gracia. */
export function toleranciaDe(regla) {
  const clase = claseDeRegla(regla);
  const propia = Number(regla?.tolerancia);
  if (Number.isFinite(propia) && propia >= 0) return Math.min(Math.floor(propia), 30);
  return Number(clase.tolerancia) || 0;
}

/** La frase que describe una regla, para no escribirla a mano en cada pantalla. */
export const describirRegla = (regla) => claseDeRegla(regla).describir(regla);

/* ===========================================================================
   3 · DEFINICIONES DE RACHA
   =========================================================================== */

export function crearRacha({ tipo = 'custom', nombre = '', regla = DEFAULT_REGLA, hoy = todayISO() } = {}) {
  const t = tipoRacha(tipo);
  return normalizarRacha({
    id: uid(),
    tipo: t.id,
    nombre: (nombre || '').trim() || t.label,
    icono: t.icono,
    regla,
    creadaEn: hoy,
    activa: true,
  });
}

export function normalizarRacha(guardada) {
  const g = guardada || {};
  const t = tipoRacha(g.tipo);
  const clase = claseDeRegla(g.regla);
  return {
    id: g.id || uid(),
    tipo: t.id,
    nombre: (g.nombre || '').trim() || t.label,
    icono: g.icono || t.icono,
    regla: {
      ...(g.regla || {}),
      clase: clase.id,
      // Se normaliza aquí y no al leerla para que una regla guardada con una
      // tolerancia absurda (o negativa) no pueda romper el recorrido.
      ...(toleranciaDe(g.regla) ? { tolerancia: toleranciaDe(g.regla) } : {}),
    },
    creadaEn: g.creadaEn || null,
    activa: g.activa !== false,
  };
}

/* ===========================================================================
   4 · EVENTOS E IDEMPOTENCIA
   ===========================================================================

   Apartado 18, palabra por palabra: *"Si el usuario pulsa varias veces Completar
   entrenamiento no quiero que se creen 3 días completados para el mismo día.
   Debe existir un identificador único lógico: user + streak + localDate."*

   El usuario ya está implícito (los datos son suyos), así que la clave lógica
   aquí es `rachaId + fecha`. `registrarCumplimiento` SUSTITUYE, nunca añade: da
   igual si se pulsa una vez o veinte, y da igual si dos dispositivos mandan lo
   mismo a la vez (apartado 19) — el resultado es el mismo día una sola vez.

   Cada evento guarda DOS tiempos, que es lo que pide el apartado 4:

     fecha        — el día LOCAL de Josué (`AAAA-MM-DD`). Es lo que decide la
                    racha. A las 23:59 cuenta para hoy; a las 00:01, para mañana.
     registradoEn — el instante exacto en UTC. No decide nada; sirve para
                    desempatar si algún día dos dispositivos escriben a la vez
                    (apartado 21, "sincronización simultánea"). */

export const claveEvento = (rachaId, fecha) => `${rachaId}::${fecha}`;

export function crearEvento({ rachaId, fecha = todayISO(), valor = 1, origen = 'manual' } = {}) {
  return {
    id: uid(),
    rachaId,
    fecha,
    valor: Number.isFinite(Number(valor)) ? Number(valor) : 1,
    registradoEn: new Date().toISOString(),
    origen,
  };
}

/**
 * Registra (o corrige) el cumplimiento de un día. Devuelve la lista entera de
 * eventos, no muta la que recibe.
 *
 * Si ya había uno para ese día y esa racha, se sustituye. Eso cubre a la vez la
 * idempotencia del apartado 18 y la corrección del apartado 21 ("edición de una
 * actividad que generaba una racha"): cambiar los minutos estudiados de un día
 * es volver a registrarlo, no crear un segundo.
 */
export function registrarCumplimiento(eventos, { rachaId, fecha = todayISO(), valor = 1, origen = 'manual' } = {}) {
  if (!rachaId || !fecha) return eventos || [];
  const clave = claveEvento(rachaId, fecha);
  const previo = (eventos || []).find((e) => claveEvento(e.rachaId, e.fecha) === clave);
  const nuevo = {
    ...crearEvento({ rachaId, fecha, valor, origen }),
    // Se conserva el id original al corregir: así una fila que ya estaba en una
    // lista renderizada no se desmonta y se vuelve a montar por un cambio de valor.
    ...(previo ? { id: previo.id } : {}),
  };
  return [...(eventos || []).filter((e) => claveEvento(e.rachaId, e.fecha) !== clave), nuevo];
}

/** Deshacer el cumplimiento de un día. Quita el evento; no marca "fallado". */
export function anularCumplimiento(eventos, rachaId, fecha) {
  const clave = claveEvento(rachaId, fecha);
  return (eventos || []).filter((e) => claveEvento(e.rachaId, e.fecha) !== clave);
}

/**
 * Los eventos de una racha, indexados por día.
 *
 * Aquí se resuelve el "datos duplicados" y el "datos fuera de orden" del
 * apartado 21: si por lo que sea llegaran dos eventos del mismo día, **gana el
 * registrado más tarde**, y el orden en que vengan en la lista da igual.
 */
export function indicePorFecha(eventos, rachaId) {
  const indice = {};
  for (const e of eventos || []) {
    if (rachaId && e.rachaId !== rachaId) continue;
    if (!e.fecha) continue;
    const previo = indice[e.fecha];
    if (!previo || String(e.registradoEn || '') >= String(previo.registradoEn || '')) indice[e.fecha] = e;
  }
  return indice;
}

/* ===========================================================================
   5 · EL ESTADO DE UN DÍA
   ===========================================================================

   Apartado 11: *"No mezcles estos estados."* Son cuatro y se distinguen por dos
   cosas nada más — si el día cumple la regla, y si el día ya ha terminado. */

export const ESTADOS_DIA = {
  COMPLETADO: 'completado',   // cumple la regla
  PERDIDO: 'perdido',         // terminó el día sin cumplirla
  PENDIENTE: 'pendiente',     // es hoy y todavía da tiempo
  FUTURO: 'futuro',           // aún no ha llegado
};

export function estadoDeDia(fecha, { indice, regla, hoy = todayISO() } = {}) {
  const clase = claseDeRegla(regla);
  if (clase.evaluar(indice?.[fecha], regla)) return ESTADOS_DIA.COMPLETADO;
  if (fecha > hoy) return ESTADOS_DIA.FUTURO;
  // Apartado 8, el que más insiste: *"Un día que todavía está en curso no debe
  // considerarse automáticamente fallido."* A las 10:00 sin entrenar, hoy es
  // PENDIENTE, no perdido. La racha no se rompe hasta que el día termina.
  if (fecha === hoy) return ESTADOS_DIA.PENDIENTE;
  return ESTADOS_DIA.PERDIDO;
}

/* ===========================================================================
   6 · EL RECORRIDO — de dónde salen todos los números
   ===========================================================================

   Una sola función recorre hacia atrás desde un día y devuelve el tramo de racha
   que termina ahí. Todo lo demás (racha actual, récord, historial) se apoya en
   ella, y por eso nunca pueden discrepar entre sí — el problema del apartado 17.

   ⚠️ **Punto de integración de las reglas semanales** (apartado 12): una regla
   con `periodo: 'semana'` recorrería SEMANAS en vez de días. El bucle de abajo
   es lo único que habría que duplicar para ello; ni el modelo, ni los eventos,
   ni el resto de funciones cambian. */
function recorrerRacha(desde, { indice, regla, hoy, limite = 3650 }) {
  const tolerancia = toleranciaDe(regla);
  const clase = claseDeRegla(regla);

  let dias = 0;
  let inicio = null;
  let fin = null;
  let fallosSeguidos = 0;
  let cursor = desde;

  for (let i = 0; i < limite; i++) {
    if (clase.evaluar(indice[cursor], regla)) {
      dias++;
      inicio = cursor;
      if (!fin) fin = cursor;
      fallosSeguidos = 0;
    } else {
      // Un día futuro o el de hoy sin cumplir no cuenta ni rompe: se salta.
      const estado = estadoDeDia(cursor, { indice, regla, hoy });
      if (estado === ESTADOS_DIA.PENDIENTE || estado === ESTADOS_DIA.FUTURO) {
        cursor = addDays(cursor, -1);
        continue;
      }
      fallosSeguidos++;
      if (fallosSeguidos > tolerancia) break;
      // Un día perdonado no suma. Perdona, no cuenta.
    }
    cursor = addDays(cursor, -1);
  }

  return { dias, inicio, fin };
}

/* ===========================================================================
   7 · RACHA ACTUAL, RÉCORD, HISTORIAL Y ESTADO
   =========================================================================== */

/**
 * Apartado 7. Se ancla en HOY y se recorre hacia atrás.
 *
 * La política del día en curso es la del apartado 8: si hoy está pendiente, la
 * racha **no se cuenta desde hoy pero tampoco se rompe** — se mira desde ayer.
 * Con lunes ✅, martes ✅ y miércoles todavía por hacer, el miércoles a las 10:00
 * la racha vale 2 y está viva, no 0 y perdida.
 */
export function rachaActual(eventos, racha, hoy = todayISO()) {
  const r = normalizarRacha(racha);
  const indice = indicePorFecha(eventos, r.id);
  return recorrerRacha(hoy, { indice, regla: r.regla, hoy }).dias;
}

/**
 * Apartado 9. **Se calcula, no se guarda.** Recorre todos los días con evento y
 * se queda con el tramo más largo, así que corregir el historial corrige el
 * récord solo, y no hay forma de inflarlo desde la interfaz.
 */
export function mejorRacha(eventos, racha, hoy = todayISO()) {
  return historialDeRachas(eventos, racha, hoy).reduce((max, t) => Math.max(max, t.dias), 0);
}

/**
 * Apartado 10. Todos los tramos, del más reciente al más antiguo, con su fecha
 * de inicio, de fin y su duración. Es la fuente para el calendario y las
 * estadísticas de las fases siguientes, sin que tengan que recalcular nada.
 */
export function historialDeRachas(eventos, racha, hoy = todayISO()) {
  const r = normalizarRacha(racha);
  const indice = indicePorFecha(eventos, r.id);
  const fechas = Object.keys(indice).sort();
  if (!fechas.length) return [];

  const tramos = [];
  let cursor = fechas[fechas.length - 1];
  const primera = fechas[0];
  // El ancla es hoy si es posterior al último evento, para que el tramo vivo
  // incluya bien el día en curso.
  if (hoy > cursor) cursor = hoy;

  for (let i = 0; i < 3650 && cursor >= primera; i++) {
    const tramo = recorrerRacha(cursor, { indice, regla: r.regla, hoy });
    if (!tramo.dias) {
      cursor = addDays(cursor, -1);
      continue;
    }
    tramos.push({
      inicio: tramo.inicio,
      fin: tramo.fin,
      dias: tramo.dias,
      // Vivo = llega hasta hoy o hasta ayer con hoy todavía pendiente.
      activo: tramo.fin === hoy || (tramo.fin === addDays(hoy, -1) && estadoDeDia(hoy, { indice, regla: r.regla, hoy }) === ESTADOS_DIA.PENDIENTE),
    });
    cursor = addDays(tramo.inicio, -1);
  }
  return tramos;
}

/* Apartado 7: *"Diseña una lógica que distinga racha activa / día pendiente /
   racha rota. Esto es MUY importante."* Son esos tres, más dos que salen gratis
   del mismo cálculo y evitan que cada pantalla los deduzca por su cuenta.

   Lo que NO está aquí es "en riesgo" (queda poco día para cumplir): depende de
   la HORA, no del día, y esta fase construye el motor, no la interfaz. Entra en
   RA F4 con el resto de estados visuales. */
export const ESTADOS_RACHA = {
  SIN_DATOS: 'sin_datos',           // nunca se ha cumplido nada
  NUEVA: 'nueva',                   // racha viva de un solo día
  ACTIVA: 'activa',                 // viva y hoy ya está cumplido
  PENDIENTE: 'pendiente',           // viva, pero hoy todavía está por cumplir
  ROTA: 'rota',                     // hubo racha y se cortó
};

export function estadoRacha(eventos, racha, hoy = todayISO()) {
  const r = normalizarRacha(racha);
  const indice = indicePorFecha(eventos, r.id);
  const dias = recorrerRacha(hoy, { indice, regla: r.regla, hoy }).dias;
  const estadoHoy = estadoDeDia(hoy, { indice, regla: r.regla, hoy });

  if (!dias) return Object.keys(indice).length ? ESTADOS_RACHA.ROTA : ESTADOS_RACHA.SIN_DATOS;
  if (estadoHoy === ESTADOS_DIA.PENDIENTE) return ESTADOS_RACHA.PENDIENTE;
  return dias === 1 ? ESTADOS_RACHA.NUEVA : ESTADOS_RACHA.ACTIVA;
}

/** Apartado 10 y 17: los números de una racha, todos derivados y de una pieza. */
export function estadisticasRacha(eventos, racha, hoy = todayISO()) {
  const r = normalizarRacha(racha);
  const indice = indicePorFecha(eventos, r.id);
  const clase = claseDeRegla(r.regla);
  const fechas = Object.keys(indice).sort();

  let cumplidos = 0;
  for (const f of fechas) if (clase.evaluar(indice[f], r.regla)) cumplidos++;

  // El denominador arranca en el primer día con actividad, no en la fecha de
  // creación: contar como fallados los días anteriores a que existiera nada
  // castigaría a una racha recién empezada con un porcentaje ridículo.
  const primero = fechas[0] || null;
  const ultimo = fechas[fechas.length - 1] || null;
  const totalDias = primero ? diasEntre(primero, hoy < primero ? primero : hoy) : 0;
  const perdidos = Math.max(0, totalDias - cumplidos);

  return {
    diasCumplidos: cumplidos,
    diasPerdidos: perdidos,
    primerDia: primero,
    ultimoDia: ultimo,
    totalDias,
    porcentaje: totalDias ? Math.round((cumplidos / totalDias) * 100) : 0,
  };
}

/** Días naturales entre dos fechas locales, ambas incluidas. */
export function diasEntre(desde, hasta) {
  if (!desde || !hasta || hasta < desde) return 0;
  const a = new Date(`${desde}T00:00:00`);
  const b = new Date(`${hasta}T00:00:00`);
  return Math.round((b - a) / 86400000) + 1;
}

/**
 * Apartado 17 — *"Los diferentes componentes de la aplicación deberán consumir
 * esas funciones en lugar de crear sus propios cálculos."*
 *
 * Esta es esa función. Una sola llamada devuelve todo lo que enseña una pantalla,
 * calculado una vez. Que el Dashboard diga 15 y el Centro de Rachas 16 solo puede
 * pasar si alguien se pone a contar por su cuenta; con esto no hace falta.
 */
export function resumenRacha(eventos, racha, hoy = todayISO()) {
  const r = normalizarRacha(racha);
  const tramos = historialDeRachas(eventos, r, hoy);
  const actual = rachaActual(eventos, r, hoy);
  const record = tramos.reduce((max, t) => Math.max(max, t.dias), 0);
  const vivo = tramos.find((t) => t.activo) || null;

  return {
    id: r.id,
    nombre: r.nombre,
    tipo: r.tipo,
    icono: r.icono,
    regla: describirRegla(r.regla),
    actual,
    record,
    estado: estadoRacha(eventos, r, hoy),
    estadoHoy: estadoDeDia(hoy, { indice: indicePorFecha(eventos, r.id), regla: r.regla, hoy }),
    // `record === actual && actual > 0` no basta: la primera racha de todas
    // iguala el récord sin batir nada. Batirlo es superar a los tramos ANTERIORES,
    // y para eso **tiene que haber alguno** — sin él no hay récord que batir.
    // (`[].every()` es `true`, que es justo por donde se colaba la primera.)
    batiendoRecord: actual > 0
      && tramos.some((t) => !t.activo)
      && tramos.filter((t) => !t.activo).every((t) => t.dias < actual),
    inicio: vivo?.inicio || null,
    ultimoDia: tramos[0]?.fin || null,
    tramos,
    ...estadisticasRacha(eventos, r, hoy),
  };
}

/* ===========================================================================
   8 · LA RACHA GLOBAL (apartado 13)
   ===========================================================================

   *"La racha global no debe sustituir a las individuales. Debe poder calcularse
   como una capa superior."*

   ⚠️ **Aquí he tenido que elegir, porque el ejemplo del apartado no cuadra:** con
   rachas de 18, 12, 7 y 24 días dice que la global son 18, que no es ni el máximo
   (24) ni el mínimo (7) ni ninguna operación evidente entre ellas.

   Lo que se ha implementado es lo único que tiene un significado claro y no se
   contradice: **días seguidos en los que se cumplió al menos una racha**. Es
   "cuántos días llevo sin abandonar del todo", que es lo que se espera de una
   racha global, y no penaliza por tener una racha nueva de tres días. Está
   apuntado en `docs/03` para que Josué lo confirme o lo cambie; cambiarlo es
   tocar solo esta función. */
export function rachaGlobal(eventos, rachas, hoy = todayISO()) {
  const definiciones = (rachas || []).map(normalizarRacha).filter((r) => r.activa);
  if (!definiciones.length) return { actual: 0, record: 0, estado: ESTADOS_RACHA.SIN_DATOS, contribuyen: [] };

  // Un índice sintético: un día cuenta si CUALQUIER racha lo tiene cumplido.
  const indice = {};
  for (const r of definiciones) {
    const propio = indicePorFecha(eventos, r.id);
    const clase = claseDeRegla(r.regla);
    for (const fecha of Object.keys(propio)) {
      if (clase.evaluar(propio[fecha], r.regla)) indice[fecha] = { fecha, valor: 1 };
    }
  }

  const virtual = { id: '__global__', regla: DEFAULT_REGLA };
  const eventosVirtuales = Object.keys(indice).map((fecha) => ({ ...indice[fecha], rachaId: '__global__' }));

  return {
    actual: rachaActual(eventosVirtuales, virtual, hoy),
    record: mejorRacha(eventosVirtuales, virtual, hoy),
    estado: estadoRacha(eventosVirtuales, virtual, hoy),
    // Cuáles están vivas hoy. La global no las sustituye: las señala.
    contribuyen: definiciones
      .filter((r) => rachaActual(eventos, r, hoy) > 0)
      .map((r) => ({ id: r.id, nombre: r.nombre, dias: rachaActual(eventos, r, hoy) })),
  };
}

/* ===========================================================================
   9 · MIGRACIÓN DESDE LOS HÁBITOS (apartado 25)
   ===========================================================================

   *"Si existe una implementación parcial de algo relacionado con rachas,
   reutilízala o refactorízala en lugar de duplicarla."*

   La implementación parcial son los hábitos de Productividad, que guardan
   `historial: { 'AAAA-MM-DD': true }` y —esto es lo que sobra— `rachaActual` y
   `mejorRacha` como números sueltos.

   El historial se conserva tal cual: **es dato real de Josué y no se toca**. Lo
   que desaparece es la necesidad de los contadores, porque estas funciones los
   derivan del mismo historial que ya había. Ningún hábito pierde nada, y ninguno
   necesita migración destructiva. */

/** La regla con la que se calculan los hábitos: la de siempre, con su margen de un día. */
export const REGLA_HABITO = { clase: 'diaria_con_gracia', tolerancia: 1 };

/** Un hábito de Productividad, visto como una racha. */
export function rachaDeHabito(habito) {
  return normalizarRacha({
    id: habito?.id,
    tipo: 'habits',
    nombre: habito?.nombre,
    regla: REGLA_HABITO,
    creadaEn: null,
  });
}

/** Su `historial` de siempre, visto como eventos. Sin copiar ni duplicar nada. */
export function eventosDeHistorial(rachaId, historial) {
  return Object.keys(historial || {})
    .filter((fecha) => historial[fecha])
    .map((fecha) => ({ id: `${rachaId}:${fecha}`, rachaId, fecha, valor: 1, registradoEn: `${fecha}T00:00:00.000Z`, origen: 'habito' }));
}

/**
 * El resumen de un hábito, derivado. Sustituye a `habito.rachaActual` y
 * `habito.mejorRacha`, que ya no hacen falta y que además mentían: al desmarcar
 * el día de hoy se le restaba uno al contador a mano, así que desmarcar y volver
 * a marcar subía el récord sin haber cumplido nada.
 */
export function resumenHabito(habito, hoy = todayISO()) {
  const racha = rachaDeHabito(habito);
  return resumenRacha(eventosDeHistorial(racha.id, habito?.historial), racha, hoy);
}

/**
 * Marcar o desmarcar el día de hoy en un hábito.
 *
 * Se queda como estaba —escribe en `historial`— porque ese es el formato que
 * Josué ya tiene guardado y migrarlo no aporta nada. Lo que cambia es que **ya
 * no escribe contadores**: si no se guarda ningún número, ningún número puede
 * quedar desincronizado con el historial (apartado 17).
 */
export function alternarHabito(habito, hoy = todayISO()) {
  const historial = { ...(habito?.historial || {}) };
  if (historial[hoy]) delete historial[hoy];
  else historial[hoy] = true;
  // `rachaActual` y `mejorRacha` se retiran del objeto en lugar de dejarse a
  // cero: un cero guardado seguiría siendo un número guardado, y volvería a
  // tentar a alguien a leerlo en vez de derivarlo.
  const { rachaActual: _ra, mejorRacha: _mr, ...resto } = habito || {};
  return { ...resto, historial };
}

/* ===========================================================================
   10 · PERSISTENCIA, SINCRONIZACIÓN Y OFFLINE — dónde engancha lo que falta
   ===========================================================================

   Apartados 15, 19 y 20. Nada de esto se construye en esta fase; lo que pide el
   apartado 20 es que los puntos de integración queden identificados, y son:

   · **Supabase (15) y seguridad (16).** `DEFAULT_RACHAS` se guarda como una clave
     más de `app_data`, la misma tabla que ya usan los otros veinte módulos: una
     fila por usuario, con RLS por `auth.uid()`. No hace falta tabla nueva ni
     política nueva, y el cliente nunca manda un `user_id` — no lo tiene.
     Si algún día el volumen pide una tabla propia `streak_events`, la clave
     lógica ya existe (`claveEvento`) y sería su índice único.

   · **Sincronización (19).** El estado vive en `ajustes`/`app_data`, nunca en la
     memoria de un componente, así que dos dispositivos convergen igual que en el
     resto de la app. Y como el motor deriva TODO del historial, dos dispositivos
     con los mismos eventos no pueden enseñar rachas distintas.

   · **Offline (20).** El punto de enganche es la lista de eventos:
     `registrarCumplimiento` es idempotente por `racha + fecha`, así que una cola
     de sincronización puede reintentar el mismo evento las veces que haga falta
     sin duplicarlo ni inflar la racha. Es la propiedad que hace que una mala
     conexión no pueda estropear un récord.

   · **Notificaciones y gamificación.** `estadoRacha` ya distingue PENDIENTE de
     ROTA, que es exactamente lo que necesita un aviso de "te queda poco día" sin
     inventarse nada. Los hitos y logros son de RA F3. */
