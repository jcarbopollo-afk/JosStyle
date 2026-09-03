// ============================================================================
// EH · Fase 51/65 — CONTROL DE CALIDAD DE LA EXPERIENCIA REAL
//
// *"Hasta ahora hemos comprobado que las funciones existen y funcionan. Ahora
// toca comprobar algo diferente: ¿se siente bien utilizar Estilo de hombre en
// el día a día?"*
//
// ── QUÉ SE CONSTRUYE AQUÍ ──────────────────────────────────────────────────
//
// Las cincuenta fases anteriores han preguntado *"¿funciona?"*. Ésta pregunta
// **"¿cuánto cuesta usarlo?"**, y eso sí se puede medir sin ser una persona:
//
//   · **cuántos toques** cuesta cada acción habitual (apartados 3 y 12),
//   · **dónde se busca** cada cosa, y si está donde uno miraría (apartado 4),
//   · si con **dos módulos** encendidos la aplicación se siente entera (6),
//   · si con **todos** encendidos se sigue encontrando algo (7),
//   · si lo que él personaliza **sigue ahí al volver** (8),
//   · si lo que se puede quitar **se puede recuperar** (9 y 10),
//   · y si un resbalón **le cuesta un dato** (11).
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. ⚠️ UN RECORRIDO SE MIDE CONTRA LA PANTALLA DE VERDAD, NO CONTRA UN
// NÚMERO QUE YO ESCRIBA.** Sería facilísimo poner `toques: 2` en una tabla y
// declarar la fase superada. Así que cada paso de cada recorrido nombra **el
// componente real** que abre —`PerfumesEH`, `GestionarApartados`— y la prueba
// comprueba en `EstiloHombreView.jsx` que ese componente **existe**. Un
// recorrido que mienta sobre por dónde pasa no compila la fase.
//
// **2. ⚠️ LA PRUEBA DE PERMANENCIA (8) SE HACE, NO SE DECLARA.** Cada cosa que
// él personaliza trae **la función que la cambia y la que la lee**, y
// `probarPersistencia` la cambia de verdad, la pasa por `JSON` —que es lo que
// hace `saveData`— y la vuelve a leer. Es la **regla 5** del proyecto convertida
// en prueba: el campo que el normalizador no conozca, aquí se cae.
//
// **3. ⚠️ LOS APARTADOS 1, 2, 13 Y 19 NO SE PUEDEN HACER DESDE AQUÍ, Y SE
// DICEN.** El primer día, el tercer día, varios días de notificaciones y —sobre
// todo— *"dar Estilo de hombre a alguien que no haya leído ninguna de estas
// fases"*: eso **es una persona**, por definición. Fingirlos sería mentir justo
// en la fase que existe para no mentirse. Van a **R1** con su motivo, como las
// seis de la F47.
//
// **4. ⚠️ Y LO QUE SÍ SE MIDE, SE MIDE CONTRA UN LÍMITE ESCRITO ANTES.** Cada
// recorrido lleva su `maximo` de toques puesto **por lo que es**, no por lo que
// salió: una acción de todos los días, 3; una de configuración, 5. Si un día
// alguien mete una pantalla intermedia, la prueba se pone roja sola.
//
// **5. ⚠️ NO SE INVENTA NADA PARA APROBAR.** El apartado 17 —*"¿realmente hace
// falta?"*— ya lo contestó la **F48** con su `SE_POSPONE`, y el 16 —coherencia
// con el resto de la aplicación— lo contestó la **F49** comparando vocabulario.
// Aquí se **reutilizan**, no se rehacen: escribir una segunda respuesta a la
// misma pregunta es exactamente el duplicado que la F48 vino a cazar.
// ============================================================================

import { MODULOS_EH, IDS_EH, moduloEH, estadoPantalla, configurarPrimeraVez, alternarModulo, reordenar, modulosActivos, normalizarEstiloHombre, DEFAULT_ESTILO_HOMBRE } from './estiloDeHombre';
import { seccionesDePantalla, datosPantalla, cambiarTamano, tamanoDe, alternarAcceso, alternarVerAccesos, accesosActivos, alternarLinea, lineasActivas, lineasDisponibles } from './pantallaEH';
import { alternarOculto, estaOculto, modulosVisibles } from './gestionEstilo';
import { permisoIA, alternarPermisoIA } from './iaEstilo';
import { buscarModulos, necesitaConfirmacion } from './gestionModulos';
import { CATALOGO_PAPELERA } from './papelera';
import { GRAVEDADES, gravedad, ordenarPorGravedad } from './pruebasIntegrales';
import { SE_POSPONE } from './auditoriaFinal';

/* ===========================================================================
   1 · CUÁNTO CUESTA CADA ACCIÓN (apartados 3 y 12)
   ===========================================================================
   *"Simular acciones que deberían tardar pocos segundos… Si una acción sencilla
   requiere demasiados pasos: simplificarla."*

   ⚠️ **Un toque es un toque de verdad.** Cada paso dice qué se toca y a dónde
   lleva, y `abre` nombra **el componente que existe en la vista** (decisión 1).
   Escribir un recorrido más corto de lo que es sería inútil: la comprobación
   siguiente exige que cada `abre` esté en `EstiloHombreView.jsx`.

   ⚠️ Y el `maximo` está puesto **por lo que es la acción**, no por lo que salió
   al medirla (decisión 4):

     · `diaria`  → 3 toques. Se hace todos los días; a la cuarta, cansa.
     · `puntual` → 4. Se hace de vez en cuando.
     · `ajuste`  → 5. Se hace una vez y se olvida. */

export const TIPOS_DE_ACCION = [
  { id: 'diaria', nombre: 'De todos los días', maximo: 3 },
  { id: 'puntual', nombre: 'De vez en cuando', maximo: 4 },
  { id: 'ajuste', nombre: 'De configurar una vez', maximo: 5 },
];

export const tipoDeAccion = (id) => TIPOS_DE_ACCION.find((t) => t.id === id) || null;
export const maximoDe = (tipo) => tipoDeAccion(tipo)?.maximo ?? 3;

export const RECORRIDOS = [
  {
    id: 'anadir_perfume',
    accion: 'Añadir un perfume',
    tipo: 'puntual',
    delEnunciado: true,
    pasos: [
      { toca: 'La plaquita 🌫️ Perfumes', abre: 'PerfumesEH' },
      { toca: 'Mi colección', abre: null },
      { toca: 'Añadir perfume', abre: null },
    ],
  },
  {
    id: 'marcar_favorito',
    accion: 'Marcar un perfume como favorito',
    tipo: 'diaria',
    delEnunciado: true,
    pasos: [
      { toca: 'La plaquita 🌫️ Perfumes', abre: 'PerfumesEH' },
      { toca: 'La estrella del perfume', abre: null },
    ],
  },
  {
    id: 'abrir_rutina',
    accion: 'Abrir la rutina facial de hoy',
    tipo: 'diaria',
    delEnunciado: true,
    pasos: [
      { toca: 'La plaquita 🧴 Skincare', abre: 'SkincareEH' },
      { toca: 'Rutinas', abre: 'RutinasPielEH' },
    ],
    /* ⚠️ Y con el acceso rápido de la F29 encendido, **uno**: la zona ⚡ lleva
       directo a `skincare · rutina`. Eso es lo que hace que valga la pena. */
    atajo: 'rutina_facial',
  },
  {
    id: 'ocultar_modulo',
    accion: 'Ocultar un módulo de la pantalla',
    tipo: 'ajuste',
    delEnunciado: true,
    pasos: [
      { toca: 'Gestionar apartados', abre: 'GestionarApartados' },
      { toca: 'El apartado', abre: null },
      { toca: 'Ocultar', abre: null },
    ],
  },
  {
    id: 'crear_recordatorio',
    accion: 'Crear un recordatorio de una rutina',
    tipo: 'puntual',
    delEnunciado: true,
    pasos: [
      { toca: 'La plaquita del módulo', abre: 'PanelPiel' },
      { toca: 'Rutinas', abre: 'RutinasPielEH' },
      { toca: 'La rutina', abre: null },
      { toca: 'Recordarme', abre: null },
    ],
  },
  /* Los siguientes no los nombra el enunciado, pero son los que él hace: si uno
     de éstos cuesta cinco toques, la aplicación cansa aunque los cinco del
     enunciado estén bien. */
  {
    id: 'ver_recomendaciones',
    accion: 'Ver qué me recomienda',
    tipo: 'diaria',
    pasos: [
      { toca: 'La plaquita del módulo', abre: 'PanelPelo' },
      { toca: 'Recomendaciones', abre: 'RecomendacionesPeloEH' },
    ],
  },
  {
    id: 'buscar_algo',
    accion: 'Buscar cualquier cosa por su nombre',
    tipo: 'diaria',
    pasos: [
      { toca: 'La lupa', abre: 'BuscadorEstiloEH' },
      { toca: 'Escribir y tocar el resultado', abre: null },
    ],
  },
  {
    id: 'recuperar_borrado',
    accion: 'Recuperar algo que borré',
    tipo: 'puntual',
    pasos: [
      { toca: 'Ajustes', abre: null },
      { toca: 'Papelera', abre: null },
      { toca: 'Restaurar', abre: null },
    ],
  },
  {
    id: 'cambiar_tamano',
    accion: 'Cambiar el tamaño de una plaquita',
    tipo: 'ajuste',
    pasos: [
      { toca: 'Personalizar pantalla', abre: 'PersonalizarPlaquitas' },
      { toca: 'El apartado', abre: null },
      { toca: 'El tamaño', abre: null },
    ],
  },
  {
    id: 'cambiar_preferencias',
    accion: 'Cambiar mis preferencias',
    tipo: 'ajuste',
    pasos: [
      { toca: 'Mis datos', abre: 'MisDatosEH' },
      { toca: 'Preferencias', abre: 'PreferenciasEH' },
      { toca: 'La preferencia', abre: null },
    ],
  },
  {
    id: 'ver_progreso',
    accion: 'Ver cómo voy',
    tipo: 'puntual',
    pasos: [
      { toca: 'Progreso', abre: 'ProgresoEH' },
    ],
  },
  {
    id: 'apagar_apartado',
    accion: 'Desactivar un apartado entero',
    tipo: 'ajuste',
    pasos: [
      { toca: 'Gestionar apartados', abre: 'GestionarApartados' },
      { toca: 'El apartado', abre: null },
      { toca: 'Desactivar', abre: null },
      { toca: 'Confirmar', abre: null },
    ],
  },
];

export const recorrido = (id) => RECORRIDOS.find((r) => r.id === id) || null;

/** Los toques de un recorrido son **sus pasos**. No hay un número aparte que se
 *  pueda quedar desfasado del recorrido que dice contar. */
export const toquesDe = (id) => recorrido(id)?.pasos.length ?? 0;

/** ⚠️ Apartado 12 — los que se pasan de lo que su tipo permite. Lista vacía o
 *  hay algo que simplificar; no hay término medio. */
export const demasiadoLargos = () => RECORRIDOS
  .filter((r) => r.pasos.length > maximoDe(r.tipo))
  .map((r) => ({ id: r.id, accion: r.accion, toques: r.pasos.length, maximo: maximoDe(r.tipo) }));

/** Los cinco que el enunciado nombra por su nombre. */
export const RECORRIDOS_DEL_ENUNCIADO = RECORRIDOS.filter((r) => r.delEnunciado).map((r) => r.id);

/** ⚠️ Decisión 1 — los componentes que los recorridos dicen abrir. Quien los
 *  comprueba mira la vista de verdad. */
export const componentesQueAbren = () => [
  ...new Set(RECORRIDOS.flatMap((r) => r.pasos.map((p) => p.abre)).filter(Boolean)),
];

/* ===========================================================================
   2 · ¿DÓNDE ESTÁ ESTO? (apartado 4)
   ===========================================================================
   *"Entrar sin saber dónde está una función. Preguntar: '¿Dónde añadiría un
   perfume?' … Si no es evidente: mejorar navegación."*

   ⚠️ **Evidente** aquí quiere decir dos cosas comprobables: que la respuesta sea
   **un sitio y no dos**, y que **el buscador de la F39 la encuentre** escribiendo
   la palabra que uno escribiría. Si hay que saber el nombre interno del módulo
   para dar con algo, no es evidente. */

export const PREGUNTAS = [
  { id: 'perfume', pregunta: '¿Dónde añadiría un perfume?', respuesta: 'En la plaquita 🌫️ Perfumes', modulo: 'perfumes', buscando: 'perfume', recorrido: 'anadir_perfume', delEnunciado: true },
  { id: 'preferencias', pregunta: '¿Dónde cambiaría mis preferencias?', respuesta: 'En 👤 Mis datos → Preferencias', modulo: null, buscando: null, recorrido: 'cambiar_preferencias', delEnunciado: true },
  { id: 'ocultar', pregunta: '¿Dónde ocultaría un módulo?', respuesta: 'En ⚙️ Gestionar apartados', modulo: null, buscando: null, recorrido: 'ocultar_modulo', delEnunciado: true },
  { id: 'pelo', pregunta: '¿Dónde apunto qué corte me hice?', respuesta: 'En la plaquita 💇 Pelo', modulo: 'pelo', buscando: 'corte', recorrido: null },
  { id: 'piel', pregunta: '¿Dónde está mi rutina de cara?', respuesta: 'En la plaquita 🧴 Skincare', modulo: 'skincare', buscando: 'rutina', recorrido: 'abrir_rutina' },
  { id: 'unas', pregunta: '¿Dónde apunto lo de las uñas?', respuesta: 'En 🧼 Higiene → Manos, uñas y pies', modulo: 'higiene', buscando: 'uñas', recorrido: null },
  { id: 'papelera', pregunta: '¿Dónde está lo que borré?', respuesta: 'En Ajustes → Papelera', modulo: null, buscando: null, recorrido: 'recuperar_borrado' },
];

export const pregunta = (id) => PREGUNTAS.find((p) => p.id === id) || null;

/**
 * ⚠️ Se responde **con el buscador de verdad**, no con esta tabla: si escribir
 * "perfume" no lleva a Perfumes, la respuesta escrita aquí da igual.
 * Devuelve `{ id, encontrado, unico }` para las que apuntan a un módulo; las que
 * apuntan a una pantalla de ajustes se responden por su recorrido.
 */
export function responder(estado, id) {
  const p = pregunta(id);
  if (!p) return null;
  if (!p.buscando) {
    return { id, porBuscador: false, porRecorrido: !!recorrido(p.recorrido), encontrado: !!recorrido(p.recorrido) };
  }
  const hallados = buscarModulos(estado, p.buscando);
  return {
    id,
    porBuscador: true,
    porRecorrido: !!recorrido(p.recorrido),
    encontrado: hallados.some((m) => m.id === p.modulo),
    /* ⚠️ **Que salgan varios no es un fallo**: "perfume" también es del cuerpo
       (desodorante). Lo que importa es que **el suyo salga**, y que salga
       primero cuando la palabra es su nombre. */
    primero: hallados[0]?.id === p.modulo,
    cuantos: hallados.length,
  };
}

export const sinRespuesta = (estado) => PREGUNTAS
  .map((p) => responder(estado, p.id))
  .filter((r) => r && !r.encontrado)
  .map((r) => r.id);

/* ===========================================================================
   3 · EL SENCILLO Y EL AVANZADO (apartados 5, 6 y 7)
   ===========================================================================
   *"Activar únicamente 🧴 Cuidado y 🌫️ Perfumes. Todo lo demás desactivado.
   Debe sentirse perfectamente completo."*
   *"Activar prácticamente todo. Debe seguir siendo posible encontrar cualquier
   cosa rápidamente."*

   ⚠️ **"Completo" no es una opinión.** Con dos módulos encendidos, la pantalla
   tiene que traer secciones, plaquitas con contenido y accesos rápidos que
   lleven a algún sitio. Si con dos se ve un hueco donde había algo, es que la
   pantalla se apoyaba en los demás. */

export const PERFILES_DE_USO = [
  {
    id: 'simple',
    nombre: 'El sencillo',
    apartado: 6,
    modulos: ['skincare', 'perfumes'],
    que: 'Solo cuidado facial y perfumes. Todo lo demás apagado.',
    debe: 'Sentirse perfectamente completo.',
  },
  {
    id: 'avanzado',
    nombre: 'El avanzado',
    apartado: 7,
    modulos: null,   // null = todos los que existen
    que: 'Prácticamente todo encendido.',
    debe: 'Seguir siendo posible encontrar cualquier cosa rápidamente.',
  },
  {
    /* ⚠️ El tercero no lo pide el enunciado, y es el que de verdad rompe cosas:
       el que **entra y no enciende nada**. La F25 ya se encontró con él. */
    id: 'vacio',
    nombre: 'El que no enciende nada',
    apartado: 5,
    modulos: [],
    que: 'Configurado, pero sin ningún apartado activo.',
    debe: 'No enseñar una pantalla en blanco, sino qué hacer.',
  },
];

export const perfilDeUso = (id) => PERFILES_DE_USO.find((p) => p.id === id) || null;

/** Monta el estado de verdad de un perfil, con `configurarPrimeraVez`. */
export function estadoDePerfil(id) {
  const p = perfilDeUso(id);
  if (!p) return null;
  const ids = p.modulos === null ? IDS_EH : p.modulos;
  return configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ids);
}

/**
 * ⚠️ **La prueba de sobrecarga (5) es la misma cuenta al revés.** Con todo
 * encendido, la pantalla no puede convertirse en una lista infinita: por eso se
 * mide **cuántas plaquitas caen en cada sección**, que es lo que el enunciado
 * llama *"agrupar"*.
 */
export function probarPerfil(id, { armario = null, datosGlobales = {} } = {}) {
  const p = perfilDeUso(id);
  const estado = estadoDePerfil(id);
  if (!p || !estado) return null;
  const secciones = seccionesDePantalla(estado, { armario, datosGlobales });
  const activos = modulosActivos(estado);
  const plaquitas = secciones.reduce((n, s) => n + s.modulos.length, 0);
  return {
    id,
    activos: activos.length,
    secciones: secciones.length,
    plaquitas,
    /* ⚠️ Ni una plaquita de un módulo apagado, ni un módulo activo sin plaquita:
       las dos son el mismo fallo mirado desde cada lado. */
    huerfanas: secciones.flatMap((s) => s.modulos.map((m) => m.id))
      .filter((mid) => !activos.some((a) => a.id === mid)),
    sinPlaquita: activos.map((a) => a.id)
      .filter((mid) => !secciones.some((s) => s.modulos.some((m) => m.id === mid))),
    /* ⚠️ Y qué enseña la pantalla cuando no queda nada: `sin_modulos` es el
       estado que trae el texto de la F25 —"empieza por lo que quieras"—, no una
       pantalla en blanco. Sin esto, el perfil vacío parecería un fallo. */
    pantalla: estadoPantalla(estado),
    // Apartado 5 — la sección más cargada. Agrupadas, no amontonadas.
    mayorSeccion: secciones.reduce((n, s) => Math.max(n, s.modulos.length), 0),
    vacia: plaquitas === 0,
  };
}

/* ===========================================================================
   4 · LO QUE ÉL TOCA TIENE QUE SEGUIR AHÍ (apartado 8)
   ===========================================================================
   *"Cambiar orden, tamaño, visibilidad, módulos activos. Cerrar aplicación.
   Volver. Todo debe permanecer."*

   🚨 ⚠️ **Ésta es la prueba de la regla 5 del proyecto**, y por eso se hace en
   vez de declararse (decisión 2). `saveData` **sobrescribe**: guarda lo que el
   normalizador devuelve, no lo que había. Un campo nuevo que su normalizador no
   conozca **desaparece en el siguiente guardado**, y el usuario no ve un error:
   ve que su cambio "no se guardó". Ya ha pasado cinco veces en este proyecto.

   Cada cosa personalizable trae **la función que la cambia** y **la que la lee**,
   así que la prueba es literal: cambiar → guardar → volver a leer. */

export const LO_QUE_SE_PERSONALIZA = [
  {
    id: 'activos',
    nombre: 'Qué apartados están encendidos',
    guarda: 'modulos[].activo',
    cambia: (e) => alternarModulo(e, 'pelo', true),
    lee: (e) => modulosActivos(e).some((m) => m.id === 'pelo'),
    esperado: true,
  },
  {
    id: 'orden',
    nombre: 'El orden de las plaquitas',
    guarda: 'modulos[].orden',
    cambia: (e) => reordenar(e, ['perfumes', 'skincare']),
    lee: (e) => modulosActivos(e)[0]?.id || null,
    esperado: 'perfumes',
  },
  {
    id: 'oculto',
    nombre: 'Qué apartados están ocultos',
    guarda: 'modulos[].oculto',
    cambia: (e) => alternarOculto(e, 'skincare'),
    lee: (e) => estaOculto(e, 'skincare'),
    esperado: true,
  },
  {
    id: 'tamano',
    nombre: 'El tamaño de cada plaquita',
    guarda: 'config.pantalla.tamanos',
    cambia: (e) => cambiarTamano(e, 'perfumes', 'grande'),
    /* ⚠️ `tamanoDe` devuelve el tamaño ENTERO, no su id: comparado con la
       cadena 'grande' daba siempre falso, y la prueba habría dicho que el
       tamaño no se guarda… cuando sí se guarda. Un fallo de la prueba, no del
       código, y de los que más caros salen: el que te manda a arreglar algo
       que no está roto. */
    lee: (e) => tamanoDe(e, 'perfumes')?.id || null,
    esperado: 'grande',
  },
  {
    id: 'contenido',
    nombre: 'Qué líneas enseña cada plaquita',
    guarda: 'config.pantalla.contenido',
    cambia: (e) => {
      const primera = lineasDisponibles('perfumes')[0];
      return primera ? alternarLinea(e, 'perfumes', primera.id) : e;
    },
    lee: (e) => {
      const primera = lineasDisponibles('perfumes')[0];
      return primera ? lineasActivas(e, 'perfumes').includes(primera.id) : null;
    },
    /* ⚠️ Se compara contra **lo contrario de lo que había**, no contra un
       `true`: si mañana esa línea nace apagada, la prueba sigue valiendo. */
    esperado: (antes) => !antes,
  },
  {
    id: 'accesos',
    nombre: 'Los accesos rápidos elegidos',
    guarda: 'config.pantalla.accesos',
    cambia: (e) => alternarAcceso(e, 'elegir_perfume'),
    lee: (e) => (accesosActivos(e) || []).some((a) => a.id === 'elegir_perfume'),
    esperado: true,
  },
  {
    id: 'ver_accesos',
    nombre: 'Si la zona de accesos se ve o no',
    guarda: 'config.pantalla.verAccesos',
    cambia: (e) => alternarVerAccesos(e),
    lee: (e) => datosPantalla(e).verAccesos,
    esperado: false,
  },
  {
    /* 🚨 **EH F56** — el interruptor de la IA entra aquí el mismo día que nace.
       Es el campo más caro de perder de todos: si no sobreviviera a cerrar y
       volver, volvería a su valor por defecto —apagado— y él creería que lo tiene
       encendido, o al revés. Y esta lista es lo único que lo comprueba. */
    id: 'ia',
    nombre: 'Si la IA puede mirar sus datos',
    guarda: 'config.ia.permitido',
    cambia: (e) => alternarPermisoIA(e),
    lee: (e) => permisoIA(e),
    esperado: true,
  },
];

export const personalizable = (id) => LO_QUE_SE_PERSONALIZA.find((c) => c.id === id) || null;

/** Lo que hace `saveData`: pasa por JSON y vuelve por el normalizador. */
export const cerrarYVolver = (estado) => normalizarEstiloHombre(JSON.parse(JSON.stringify(estado)));

/**
 * ⚠️ Apartado 8, de verdad: cambia cada cosa, cierra, vuelve y la lee.
 * Devuelve la lista de las que **no sobrevivieron**.
 */
export function probarPersistencia() {
  const base = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare', 'perfumes']);
  return LO_QUE_SE_PERSONALIZA.map((c) => {
    const antes = c.lee(base);
    const cambiado = c.cambia(base);
    const enCaliente = c.lee(cambiado);
    const despues = c.lee(cerrarYVolver(cambiado));
    const esperado = typeof c.esperado === 'function' ? c.esperado(antes) : c.esperado;
    return {
      id: c.id,
      nombre: c.nombre,
      guarda: c.guarda,
      antes,
      enCaliente,
      despues,
      esperado,
      // El cambio ni siquiera llegó a hacerse: eso es otro fallo, y peor.
      cambia: enCaliente === esperado,
      // Se hizo, pero no sobrevivió a cerrar y volver: **regla 5**.
      permanece: despues === esperado,
    };
  });
}

export const noPermanecen = () => probarPersistencia().filter((r) => !r.permanece).map((r) => r.id);

/* ===========================================================================
   5 · QUITARLO Y RECUPERARLO (apartados 9 y 10)
   ===========================================================================
   *"Intentar eliminar recomendaciones, estadísticas, notificaciones, descubrir.
   Debe poder hacerse fácilmente."* · *"Después de eliminar/ocultar: encontrarlo
   → recuperarlo → volver a utilizarlo. Sin tener que buscar en cinco menús."*

   ⚠️ **Las cuatro que él nombra no son módulos**, son partes de dentro: por eso
   cada una dice **con qué mecanismo se quita** —el de la F36 (partes), el de la
   F34 (avisos) o el de la F38 (papelera)— y **dónde se recupera**. Que se puedan
   quitar ya lo comprueban sus fases; lo que se mira aquí es que **volver** no
   cueste más que quitar. */

export const NO_QUIERO_ESTO = [
  {
    id: 'recomendaciones',
    nombre: 'Recomendaciones',
    delEnunciado: true,
    seQuita: 'Gestionar apartados → el apartado → sus partes',
    mecanismo: 'partes',
    seRecupera: 'El mismo sitio, volviendo a encenderla',
    toquesQuitar: 3,
    toquesVolver: 3,
  },
  {
    id: 'estadisticas',
    nombre: 'Estadísticas',
    delEnunciado: true,
    seQuita: 'Gestionar apartados → el apartado → sus partes',
    mecanismo: 'partes',
    seRecupera: 'El mismo sitio',
    toquesQuitar: 3,
    toquesVolver: 3,
  },
  {
    id: 'notificaciones',
    nombre: 'Notificaciones',
    delEnunciado: true,
    seQuita: 'Ajustes → Avisos → apagarlos',
    mecanismo: 'avisos',
    seRecupera: 'El mismo sitio',
    toquesQuitar: 3,
    toquesVolver: 3,
  },
  {
    id: 'descubrir',
    nombre: 'Descubrir',
    delEnunciado: true,
    seQuita: 'La propia tarjeta, con "No me interesa"',
    mecanismo: 'partes',
    seRecupera: 'Gestionar apartados → Descubrir',
    /* ⚠️ Quitarla cuesta **uno** —está en la propia tarjeta— y volver cuesta
       tres. Es asimétrico a propósito: quitar algo que molesta tiene que ser
       inmediato; recuperarlo, no tanto. Lo que el apartado 10 prohíbe es que
       recuperarlo sea **imposible de encontrar**, no que cueste un toque más. */
    toquesQuitar: 1,
    toquesVolver: 3,
  },
  {
    id: 'un_dato',
    nombre: 'Un perfume, una rutina, un registro',
    delEnunciado: false,
    seQuita: 'Su papelera, desde la propia lista',
    mecanismo: 'papelera',
    seRecupera: 'Ajustes → Papelera → Restaurar',
    toquesQuitar: 2,
    toquesVolver: 3,
  },
];

export const noQuiero = (id) => NO_QUIERO_ESTO.find((n) => n.id === id) || null;

/** ⚠️ Apartado 10 — *"sin tener que buscar en cinco menús"*. Cinco es el número
 *  que él escribió; aquí el límite es **tres**, que es lo que cuesta el más
 *  largo de los que existen. */
export const MAXIMO_PARA_VOLVER = 3;

export const dificilesDeRecuperar = () => NO_QUIERO_ESTO
  .filter((n) => n.toquesVolver > MAXIMO_PARA_VOLVER)
  .map((n) => n.id);

/* ===========================================================================
   6 · EL RESBALÓN (apartado 11)
   ===========================================================================
   *"Pulsar accidentalmente eliminar. Cambiar una preferencia equivocada. Salir
   sin guardar. Pulsar atrás demasiado pronto. La aplicación debe proteger al
   usuario cuando corresponda."*

   ⚠️ *"Cuando corresponda"* es la parte importante: **no todo lleva confirmación**.
   Un aviso delante de cada toque enseña a darle a "Sí" sin leer, y entonces el
   aviso que sí importaba tampoco se lee. Así que cada resbalón dice **qué lo
   protege**, y los que no llevan nada dicen **por qué no**. */

export const RESBALONES = [
  {
    id: 'borrar_sin_querer',
    que: 'Pulsar eliminar sin querer',
    protege: 'papelera',
    como: 'Se va a la papelera, con 30 días para volver.',
    porque: null,
  },
  {
    id: 'apagar_modulo',
    que: 'Desactivar un apartado que tenía datos',
    protege: 'confirmacion',
    como: 'Aviso que dice cuántos datos hay y que no se borran.',
    porque: null,
  },
  {
    id: 'borrar_todo',
    que: 'Vaciar Estilo de hombre entero',
    protege: 'confirmacion_fuerte',
    como: 'Dice exactamente qué se borra, qué no, y que no se puede deshacer.',
    porque: null,
  },
  {
    id: 'preferencia_equivocada',
    que: 'Cambiar una preferencia equivocada',
    protege: 'reversible',
    como: 'Se cambia de vuelta en el mismo sitio y con el mismo toque.',
    /* ⚠️ Aquí **no** hay confirmación, y es deliberado: una preferencia se
       cambia con un toque y se deshace con otro. Un aviso para eso es el que
       enseña a no leer avisos. */
    porque: 'Deshacerlo cuesta lo mismo que hacerlo.',
  },
  {
    id: 'salir_sin_guardar',
    que: 'Salir sin guardar',
    protege: 'no_aplica',
    como: 'No existe "guardar": cada cambio se guarda al hacerlo.',
    porque: 'No hay ningún formulario que se pueda perder al salir.',
  },
  {
    id: 'atras_pronto',
    que: 'Pulsar atrás demasiado pronto',
    protege: 'no_aplica',
    como: 'Volver no descarta nada, porque ya estaba guardado.',
    porque: 'Misma razón: no hay estado a medias que se pierda al volver.',
  },
];

export const PROTECCIONES = ['papelera', 'confirmacion', 'confirmacion_fuerte', 'reversible', 'no_aplica'];

export const resbalon = (id) => RESBALONES.find((r) => r.id === id) || null;

/** ⚠️ Los que no protegen nada tienen que explicar por qué, igual que en la F50. */
export const sinProteccion = () => RESBALONES
  .filter((r) => (r.protege === 'no_aplica' || r.protege === 'reversible') && !r.porque)
  .map((r) => r.id);

/** Cuántos módulos piden confirmación al apagarse, de los que tienen datos. */
export const modulosQueConfirman = () => MODULOS_EH.filter((m) => necesitaConfirmacion(m.id)).map((m) => m.id);

/* ===========================================================================
   7 · SABER SIEMPRE EN QUÉ ESTADO ESTÁ TODO (apartado 15)
   ===========================================================================
   *"El usuario debe saber siempre: qué está guardado, qué está oculto, qué está
   desactivado, qué se ha eliminado, qué puede recuperar."*

   ⚠️ Las cinco. Cada una con **dónde se ve** y **quién lo calcula**, porque una
   promesa de éstas sin una función detrás es una frase bonita. */

export const SABER_SIEMPRE = [
  { id: 'guardado', que: 'Qué está guardado', donde: '👤 Mis datos', calcula: 'resumenDatosEH', apartado: 15 },
  { id: 'oculto', que: 'Qué está oculto', donde: '⚙️ Gestionar apartados', calcula: 'estadoDe', apartado: 15 },
  { id: 'desactivado', que: 'Qué está desactivado', donde: '⚙️ Gestionar apartados', calcula: 'modulosActivos', apartado: 15 },
  { id: 'eliminado', que: 'Qué se ha eliminado', donde: '🗑️ Papelera', calcula: 'ordenarPapelera', apartado: 15 },
  { id: 'recuperable', que: 'Qué puede recuperar', donde: '🗑️ Papelera', calcula: 'diasRestantes', apartado: 15 },
];

/* ===========================================================================
   8 · LOS APARTADOS, UNO A UNO
   ===========================================================================
   ⚠️ Decisión 3 — los que necesitan a una persona lo dicen, con `como: 'josue'`.
   Decisión 5 — los que ya contestó otra fase lo dicen, con `como: 'hecho'` y el
   nombre de la fase que los contestó. */

export const APARTADOS_EXPERIENCIA = [
  { id: 1, nombre: 'Prueba del primer día', como: 'josue', cumplido: false, donde: 'R1', porque: 'Instalar, entrar y descubrir por primera vez es, literalmente, una primera vez. Aquí ya no queda ninguna.' },
  { id: 2, nombre: 'Prueba del tercer día', como: 'josue', cumplido: false, donde: 'R1', porque: 'Volver después de varios días es volver después de varios días. Nadie puede olvidarse de esto a propósito.' },
  { id: 3, nombre: 'Prueba de uso rápido', como: 'node', cumplido: true, donde: 'RECORRIDOS' },
  { id: 4, nombre: 'Prueba de descubrimiento', como: 'node', cumplido: true, donde: 'PREGUNTAS + responder()' },
  { id: 5, nombre: 'Prueba de sobrecarga', como: 'node', cumplido: true, donde: 'probarPerfil("avanzado")' },
  { id: 6, nombre: 'Prueba de usuario simple', como: 'node', cumplido: true, donde: 'probarPerfil("simple")' },
  { id: 7, nombre: 'Prueba de usuario avanzado', como: 'node', cumplido: true, donde: 'probarPerfil("avanzado")' },
  { id: 8, nombre: 'Prueba de personalización', como: 'node', cumplido: true, donde: 'probarPersistencia()' },
  { id: 9, nombre: 'Prueba de «no quiero esto»', como: 'node', cumplido: true, donde: 'NO_QUIERO_ESTO' },
  { id: 10, nombre: 'Prueba de «quiero recuperarlo»', como: 'node', cumplido: true, donde: 'dificilesDeRecuperar()' },
  { id: 11, nombre: 'Prueba de errores humanos', como: 'node', cumplido: true, donde: 'RESBALONES' },
  { id: 12, nombre: 'Prueba de velocidad', como: 'node', cumplido: true, donde: 'demasiadoLargos()' },
  { id: 13, nombre: 'Prueba de notificaciones', como: 'josue', cumplido: false, donde: 'R1', porque: '"¿Molestan?" no se contesta contando avisos: se contesta recibiéndolos durante una semana. La F34 ya deja el interruptor para bajarlas.' },
  { id: 14, nombre: 'Prueba de recomendaciones', como: 'node', cumplido: true, donde: 'motorRecomendaciones + "No me interesa" (F32)' },
  { id: 15, nombre: 'Prueba de confianza', como: 'node', cumplido: true, donde: 'SABER_SIEMPRE' },
  { id: 16, nombre: 'Prueba de coherencia', como: 'hecho', cumplido: true, donde: 'F49 · coherenciaVisual.js', porque: 'Comparar Estilo con el resto de la aplicación es exactamente lo que hace `soloEn()`. Escribirlo otra vez sería el duplicado que la F48 caza.' },
  { id: 17, nombre: 'Prueba de «¿realmente hace falta?»', como: 'hecho', cumplido: true, donde: 'F48 · SE_POSPONE', porque: 'La F48 ya pasó función por función decidiendo qué se queda, qué se integra y qué se pospone. Ésa es esta pregunta.' },
  { id: 18, nombre: 'Lista de fallos', como: 'node', cumplido: true, donde: 'FALLOS_DE_EXPERIENCIA' },
  { id: 19, nombre: 'Prueba final sin instrucciones', como: 'josue', cumplido: false, donde: 'R1', porque: '🚨 "Dar Estilo de hombre a alguien que no haya leído ninguna de estas fases." Yo las he leído todas. Soy la única persona del mundo que NO puede hacer esta prueba.' },
];

export const apartadoExperiencia = (id) => APARTADOS_EXPERIENCIA.find((a) => a.id === id) || null;
export const apartadosDeJosue = () => APARTADOS_EXPERIENCIA.filter((a) => a.como === 'josue');
export const apartadosYaHechos = () => APARTADOS_EXPERIENCIA.filter((a) => a.como === 'hecho');
export const apartadosAutomaticos = () => APARTADOS_EXPERIENCIA.filter((a) => a.como === 'node');

/* ===========================================================================
   9 · LA LISTA DE FALLOS (apartado 18)
   ===========================================================================
   *"Cada problema encontrado debe clasificarse: 🔴 Crítico · 🟠 Importante ·
   🟡 Menor · 🟢 Mejora. Y corregirse empezando por los críticos."*

   ⚠️ Las gravedades son **las de la F47**, importadas. Y esto es la lista de lo
   que esta fase encontró de verdad al medir, no una lista de ejemplo. */

export const FALLOS_DE_EXPERIENCIA = [
  {
    id: 'descubrir_asimetrico',
    gravedad: 'mejora',
    que: 'Quitar la tarjeta de Descubrir cuesta un toque; recuperarla, tres.',
    decision: 'Se queda así. Quitar lo que molesta tiene que ser inmediato; recuperarlo, encontrable.',
    arreglado: null,
  },
  {
    id: 'sin_atajo',
    gravedad: 'mejora',
    que: 'Abrir la rutina de hoy cuesta dos toques, o uno con el acceso rápido de la F29 encendido.',
    decision: 'Se queda así: el acceso rápido ya existe y es él quien decide si lo quiere.',
    arreglado: null,
  },
];

export const fallo = (id) => FALLOS_DE_EXPERIENCIA.find((f) => f.id === id) || null;

/** ⚠️ Ordenados por gravedad, que es como pide corregirlos: críticos primero. */
export const fallosPorGravedad = () => ordenarPorGravedad(FALLOS_DE_EXPERIENCIA);

export const criticos = () => FALLOS_DE_EXPERIENCIA.filter((f) => f.gravedad === 'critico');

/* ===========================================================================
   10 · LA CONDICIÓN DE FINALIZACIÓN
   =========================================================================== */

export const TEXTOS_EXPERIENCIA = {
  condicion: 'Estilo de hombre no está terminado porque "todo funciona": lo estará cuando todo funciona y utilizarlo resulta natural.',
  sinInstrucciones: 'La prueba más importante es la que yo no puedo hacer: dárselo a alguien que no haya leído ninguna de estas fases.',
  simplificar: 'Si una acción sencilla requiere demasiados pasos, se simplifica.',
  sinSacrificar: 'Menos toques, sí. Pero sin sacrificar claridad.',
};

/* ===========================================================================
   11 · EL PARTE
   =========================================================================== */

export function auditarExperiencia(estado = null, { vista = '' } = {}) {
  const base = estado || configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['skincare', 'perfumes', 'pelo']);
  const persistencia = probarPersistencia();
  return {
    // Apartados 3 y 12
    recorridos: RECORRIDOS.length,
    largos: demasiadoLargos(),
    // Decisión 1 — los componentes que dicen abrir, contra la vista de verdad
    componentesInventados: vista
      ? componentesQueAbren().filter((c) => !new RegExp(`export function ${c}\\b`).test(vista))
      : [],
    // Apartado 4
    sinRespuesta: sinRespuesta(base),
    // Apartados 5, 6 y 7
    perfiles: PERFILES_DE_USO.map((p) => probarPerfil(p.id)),
    // Apartado 8 — regla 5
    noPermanecen: persistencia.filter((r) => !r.permanece).map((r) => r.id),
    noCambian: persistencia.filter((r) => !r.cambia).map((r) => r.id),
    // Apartados 9 y 10
    dificilesDeRecuperar: dificilesDeRecuperar(),
    // Apartado 11
    sinProteccion: sinProteccion(),
    // Apartado 18
    criticos: criticos().length,
    // Los que no se pueden hacer desde aquí
    paraJosue: apartadosDeJosue().map((a) => a.id),
    // Y ninguno se queda sin decir por qué
    sinMotivo: APARTADOS_EXPERIENCIA
      .filter((a) => (a.como === 'josue' || a.como === 'hecho') && !a.porque)
      .map((a) => a.id),
  };
}

export function panelExperiencia(estado = null, { vista = '' } = {}) {
  const a = auditarExperiencia(estado, { vista });
  return {
    ...a,
    apartados: APARTADOS_EXPERIENCIA,
    fallos: fallosPorGravedad(),
    gravedades: GRAVEDADES,
    /* 🎯 El veredicto de la fase: no "todo funciona", sino **usarlo no cuesta
       más de lo que debería**. Lo que necesita una persona queda fuera del
       veredicto a propósito: contarlo como verde sería justo la mentira que
       esta fase existe para no contar. */
    natural: a.largos.length === 0
      && a.componentesInventados.length === 0
      && a.sinRespuesta.length === 0
      && a.noPermanecen.length === 0
      && a.dificilesDeRecuperar.length === 0
      && a.criticos === 0,
    condicion: TEXTOS_EXPERIENCIA.condicion,
  };
}

export { GRAVEDADES, gravedad, SE_POSPONE, CATALOGO_PAPELERA, moduloEH, modulosVisibles };
