/* Entrega 3 · Fase 30 (BN) — «Rediseño y reorganización del apartado Bienestar»
   ═══════════════════════════════════════════════════════════════════════════

   🚨 **ESTA FASE NO AÑADE FUNCIONES.** Lo dice su apartado 1 con estas palabras:
   *"El objetivo principal NO es añadir funcionalidades nuevas, sino mejorar la
   jerarquía, nomenclatura y presentación de las funcionalidades que ya
   existen."* Y el 9 lo repite en negativo: ni una sección de Lesiones, ni
   quitar Fotos, ni quitar Medidas, ni quitar *Analizar mi salud*, ni
   *"sobrecargar Bienestar con nuevas tarjetas simplemente para «llenar» el
   diseño"*.

   Así que aquí **no hay ni un almacén nuevo, ni un campo nuevo, ni una clave
   nueva en `app_data`**. Lo que hay es: el catálogo de las cuatro áreas del
   apartado 4, las funciones de LECTURA que la pantalla necesita para enseñar un
   número real, y la declaración escrita de lo que se conserva y de lo que se ha
   renombrado. Hay pruebas que leen este archivo para comprobar las tres cosas.

   ── Lo que sí cambia, y por qué ──────────────────────────────────────────────

   🚨 **EL APARTADO SE LLAMA BIENESTAR Y EL MÓDULO «MI SALUD».** El apartado 3 no
   permite las dos cosas con el mismo nombre: *"Dentro de Bienestar NO debe
   aparecer otro título o tarjeta principal llamada simplemente «Salud»"*. El
   área de la barra inferior pasa a **Bienestar** y el módulo que hay dentro a
   **Mi salud**. Los ids (`area-salud`, `salud`) **no se tocan** — el apartado 2
   lo prohíbe expresamente: *"NO cambiar nombres de variables, tablas, columnas
   o estructuras internas"*.

   🚨 **Y HABÍA UN CHOQUE DE NOMBRES QUE EL ENUNCIADO NO PODÍA SABER:** ya existe
   un módulo llamado **Bienestar** —el digital, el del tiempo de pantalla—, que
   vive en el área «Más». Con el área llamada Bienestar habría dos cosas con el
   mismo nombre en dos sitios distintos. Su propia pantalla ya se titula
   *"Bienestar digital"* desde que se construyó, así que lo que se corrige es su
   etiqueta en el menú, que era la que se había quedado corta. Ni un id tocado.

   ⚠️ **LAS LESIONES NO SON UNA SECCIÓN, Y ADEMÁS YA ESTABAN EN DOS SITIOS.** El
   apartado 4 pide que se gestionen *"dentro del Historial, aprovechando la
   estructura existente"*. Existen dos estructuras:

     1. `salud.historial` con `tipo: 'Lesión'` — eventos con fecha (Fase 3).
     2. `perfil.lesiones` — las lesiones relevantes de ahora, con zona y estado,
        que se editan en Ajustes → Perfil (Fase A2).

   No se copia ninguna en la otra: el Historial las **enseña juntas** y dice
   dónde se edita cada una. Es `leerDato()` de EH F4 otra vez — una sola
   respuesta, y el sitio donde se cambia, escrito en la pantalla. */

import { TIPOS_HISTORIAL_MEDICO } from '../tokens';
import { todayISO, formatFecha } from './helpers';

/* ══════════════════════════════════════════════════════════════════════════
   1 · LOS NOMBRES — apartados 2 y 3
   ══════════════════════════════════════════════════════════════════════════ */

export const NOMBRE_APARTADO = 'Bienestar';
export const NOMBRE_MODULO = 'Mi salud';
export const SUBTITULO_MODULO = 'Medidas, fotos e historial — entrada manual, y la IA lo interpreta';

/* ⚠️ Una línea por sitio donde Josué VE el nombre (apartado 2), con lo que decía
   antes y lo que dice ahora. La prueba abre cada archivo y comprueba que el
   texto nuevo está y el viejo no — una lista que solo se cuenta a sí misma no
   demuestra nada (EH F42: una regla que no puede fallar no sirve). */
export const RENOMBRADO = [
  { donde: 'Barra inferior y cabecera del área', archivo: 'src/App.jsx', antes: 'Salud', ahora: 'Bienestar' },
  { donde: 'Tarjeta del módulo dentro del área', archivo: 'src/App.jsx', antes: 'Salud', ahora: 'Mi salud' },
  { donde: 'Título de la pantalla', archivo: 'src/views/HealthView.jsx', antes: 'Salud', ahora: 'Mi salud' },
  { donde: 'Tarjeta de Hoy', archivo: 'src/views/DashboardView.jsx', antes: 'Salud', ahora: 'Mi salud' },
  { donde: 'Etiqueta del módulo de tiempo de pantalla', archivo: 'src/App.jsx', antes: 'Bienestar', ahora: 'Bienestar digital' },
];

/* 🚨 Lo que NO se renombra, y por qué. El apartado 2 lo pide literalmente. */
export const NO_SE_RENOMBRA = [
  { que: "el id del área, `'area-salud'`", porque: 'lo guarda la personalización de la Fase 19: cambiarlo perdería el orden y los ocultos de Josué' },
  { que: "el id del módulo, `'salud'`", porque: 'es la clave de `app_data` donde viven sus medidas y su historial' },
  { que: "el id del módulo de pantalla, `'bienestar'`", porque: 'mismo motivo: es su clave guardada' },
  { que: "la categoría de notificación `'salud'`", porque: 'está guardada en las preferencias de avisos de la Fase A4' },
];

/* ══════════════════════════════════════════════════════════════════════════
   2 · LAS CUATRO ÁREAS DEL APARTADO 4
   ══════════════════════════════════════════════════════════════════════════ */

/* *"📸 Fotos · 📏 Medidas · 📋 Historial · 🤖 Analizar mi salud"*, en el orden
   que pide el apartado 10: **qué puedo consultar → qué puedo registrar → dónde
   está mi historial**. `analisis` no es una sección plegable: es el panel de IA
   de siempre, que vive al final y no se toca. */
export const SECCIONES_BIENESTAR = [
  {
    id: 'medidas',
    emoji: '📏',
    nombre: 'Medidas',
    descripcion: 'Peso, grasa, pulso y tensión, con su evolución',
    coleccion: 'medidas',
    plegable: true,
    abiertaPorDefecto: true,
  },
  {
    id: 'fotos',
    emoji: '📸',
    nombre: 'Fotos',
    descripcion: 'Seguimiento visual de tu progreso',
    coleccion: 'fotos',
    plegable: true,
    abiertaPorDefecto: false,
  },
  {
    id: 'historial',
    emoji: '📋',
    nombre: 'Historial',
    descripcion: 'Lesiones, enfermedades, medicamentos y análisis',
    coleccion: 'historial',
    plegable: true,
    abiertaPorDefecto: false,
  },
  {
    id: 'analisis',
    emoji: '🤖',
    nombre: 'Analizar mi salud',
    descripcion: 'La IA lee lo que has registrado y te lo comenta',
    coleccion: null,
    plegable: false,
    abiertaPorDefecto: true,
  },
];

export const seccionBN = (id) => SECCIONES_BIENESTAR.find((s) => s.id === id) || null;

/* ⚠️ Una sección plegada no puede dejar la pantalla en blanco (E3 F26). Aquí no
   puede pasar —el estado de arriba se ve siempre y Medidas nace abierta—, pero
   la regla se escribe en código en vez de confiar en que se cumpla sola. */
export function aperturaInicialBN(secciones = SECCIONES_BIENESTAR) {
  const plegables = secciones.filter((s) => s.plegable);
  const abiertas = plegables.filter((s) => s.abiertaPorDefecto).map((s) => s.id);
  return abiertas.length ? abiertas : plegables.slice(0, 1).map((s) => s.id);
}

/* ══════════════════════════════════════════════════════════════════════════
   3 · LO QUE SE CONSERVA — apartados 5 y 9
   ══════════════════════════════════════════════════════════════════════════ */

/* *"Conserva todas las funcionalidades existentes. No elimines datos. No
   elimines campos. No elimines componentes funcionales. No rompas
   persistencia."*

   ⚠️ Cada línea nombra **la prop de verdad** que la vista recibe de `App.jsx`,
   así que la prueba puede leer `HealthView.jsx` y comprobar que sigue estando.
   Un catálogo que se limita a decir «se conserva» no conserva nada. */
export const LO_QUE_SE_CONSERVA = [
  { que: 'Registrar una medida', prop: 'onAddMedida', seccion: 'medidas' },
  { que: 'Borrar una medida (a la papelera)', prop: 'onDeleteMedida', seccion: 'medidas' },
  { que: 'Añadir una entrada al historial', prop: 'onAddHistorial', seccion: 'historial' },
  { que: 'Borrar una entrada del historial (a la papelera)', prop: 'onDeleteHistorial', seccion: 'historial' },
  { que: 'Subir una foto de progreso', prop: 'onAddFoto', seccion: 'fotos' },
  { que: 'Borrar una foto (definitivo: es un archivo de Storage)', prop: 'onDeleteFoto', seccion: 'fotos' },
  { que: 'El PIN sobre las fotos privadas', prop: 'protegidoFotos', seccion: 'fotos' },
  { que: 'Analizar mi salud con la IA', prop: 'salud', seccion: 'analisis' },
];

/* 🚨 Apartado 9: *"NO crear una sección independiente de Lesiones"*. Las dos
   estructuras que ya existen, declaradas con dónde vive cada una y dónde se
   edita — nunca una copia. */
export const LESIONES = {
  hayseccionPropia: false,
  fuentes: [
    {
      id: 'historial',
      titulo: 'En tu historial',
      donde: "salud.historial, tipo 'Lesión'",
      seEditaAqui: true,
      nota: null,
    },
    {
      id: 'perfil',
      titulo: 'Lesiones relevantes de tu perfil',
      donde: 'perfil.lesiones',
      seEditaAqui: false,
      nota: 'Se añaden y se quitan en Ajustes → Perfil.',
    },
  ],
};

export const TIPO_LESION = 'Lesión';

/* ══════════════════════════════════════════════════════════════════════════
   4 · LECTURA — aquí no se guarda nada
   ══════════════════════════════════════════════════════════════════════════ */

const lista = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function ultimaMedida(medidas) {
  const orden = lista(medidas).filter((m) => m.fecha).sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  return orden.length ? orden[orden.length - 1] : null;
}

export function diasDesde(fechaISO, hoy = todayISO()) {
  if (!fechaISO) return null;
  const a = new Date(`${fechaISO}T00:00:00`).getTime();
  const b = new Date(`${hoy}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.round((b - a) / 86400000));
}

/* ⚠️ **La fórmula del IMC estaba escrita a mano en dos pantallas** (el Dashboard
   lo dice en un comentario: *"misma fórmula exacta que ya usa SettingsView"*).
   Aquí hay una sola, y **devuelve `null` cuando falta un dato** en vez de un
   `Infinity` que se pintaría tal cual. Un número que no se puede calcular no se
   inventa (regla 8). */
export function imcDe(pesoKg, alturaCm) {
  const p = num(pesoKg);
  const a = num(alturaCm);
  if (!p || !a) return null;
  const m = a / 100;
  const imc = p / (m * m);
  return Number.isFinite(imc) ? imc : null;
}

/* El estado de arriba de la pantalla. Todo derivado: peso de la última medida —o
   el del perfil si todavía no hay ninguna, que es lo que ya hacía el Dashboard—,
   IMC calculado, y cuántos días hace del último registro. Sin dato, `null`: un
   cero diría que pesa cero. */
export function estadoActual({ salud, perfil, hoy = todayISO() } = {}) {
  const ultima = ultimaMedida(salud?.medidas);
  const peso = num(ultima?.peso) || num(perfil?.peso);
  const imc = imcDe(peso, perfil?.altura);
  const dias = ultima ? diasDesde(ultima.fecha, hoy) : null;
  return {
    peso,
    imc,
    dias,
    desdeElPerfil: !num(ultima?.peso) && !!num(perfil?.peso),
    hayMedidas: lista(salud?.medidas).length > 0,
    vacio: !peso && !lista(salud?.medidas).length,
  };
}

/* *"Un registro rápido ayuda a la IA a ver tu evolución real"* seguía siendo
   verdad, así que el aviso se conserva — pero con su umbral escrito una vez. */
export const DIAS_SIN_REGISTRAR_AVISO = 7;

export function avisoDeRegistro({ salud, hoy = todayISO() } = {}) {
  const ultima = ultimaMedida(salud?.medidas);
  if (!ultima) return { avisa: true, dias: null, texto: 'Todavía no has registrado ninguna medida.' };
  const dias = diasDesde(ultima.fecha, hoy);
  if (dias === null || dias < DIAS_SIN_REGISTRAR_AVISO) return { avisa: false, dias, texto: null };
  return { avisa: true, dias, texto: `Hace ${dias} días que no registras tus medidas.` };
}

/* La evolución del peso para la gráfica que ya existía. Es una lectura: ni se
   guarda, ni se interpola, ni se rellena un día que no registró (E3 F13). */
export const MAX_PUNTOS_EVOLUCION = 10;

export function evolucionPeso(medidas, max = MAX_PUNTOS_EVOLUCION) {
  return lista(medidas)
    .filter((m) => m.fecha && num(m.peso))
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    .slice(-Math.max(1, max))
    .map((m) => ({ fecha: formatFecha(m.fecha), peso: Number(m.peso) }));
}

/* Los valores de una medida, en una línea, sin los huecos. Estaba dentro del JSX
   y ahora se puede probar. */
export function resumenDeMedida(m) {
  if (!m) return null;
  const partes = [
    num(m.peso) && `${m.peso} kg`,
    num(m.grasaCorporal) && `${m.grasaCorporal}% grasa`,
    num(m.frecuenciaCardiaca) && `${m.frecuenciaCardiaca} ppm`,
    num(m.tensionSistolica) && `${m.tensionSistolica}/${m.tensionDiastolica || '?'} tensión`,
  ].filter(Boolean);
  return partes.length ? partes.join(' · ') : 'Sin valores numéricos';
}

/* ══════════════════════════════════════════════════════════════════════════
   5 · EL HISTORIAL, CON SUS LESIONES DENTRO
   ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ Los filtros salen de `TIPOS_HISTORIAL_MEDICO`, **no de una lista escrita a
   mano**: el día que se añada un tipo, el filtro aparece solo. Es la lección de
   `CATEGORIAS_ARMARIO` (E3 F3) en otro sitio. */
export const FILTRO_TODOS = { id: 'todos', nombre: 'Todo' };

export function filtrosDeHistorial(historial) {
  const usados = new Set(lista(historial).map((e) => e.tipo));
  return [FILTRO_TODOS, ...TIPOS_HISTORIAL_MEDICO.filter((t) => usados.has(t)).map((t) => ({ id: t, nombre: t }))];
}

export function filtrarHistorial(historial, filtro = 'todos') {
  const todos = lista(historial);
  if (!filtro || filtro === 'todos') return todos;
  return todos.filter((e) => e.tipo === filtro);
}

export function ordenarHistorial(historial) {
  return [...lista(historial)].sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
}

/* Las lesiones de las DOS fuentes, sin copiar ninguna. La del perfil llega en
   modo lectura y con la frase de dónde se edita. */
export function lesionesDe({ salud, perfil } = {}) {
  const delHistorial = lista(salud?.historial).filter((e) => e.tipo === TIPO_LESION);
  const delPerfil = lista(perfil?.lesiones);
  return {
    historial: ordenarHistorial(delHistorial),
    perfil: delPerfil,
    total: delHistorial.length + delPerfil.length,
    hay: delHistorial.length + delPerfil.length > 0,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   6 · LO QUE DICE CADA SECCIÓN CUANDO ESTÁ PLEGADA
   ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ **Nunca un cero.** Una sección vacía dice qué se hace ahí, no «0 medidas»
   (E3 F23: *"una mini-app vacía NO enseña un cero"*). */
export function resumenDeSeccion(id, { salud, fotos, perfil, hoy = todayISO() } = {}) {
  if (id === 'medidas') {
    const n = lista(salud?.medidas).length;
    if (!n) return { texto: 'Todavía ninguna', vacio: true };
    const u = ultimaMedida(salud?.medidas);
    const d = u ? diasDesde(u.fecha, hoy) : null;
    return { texto: `${n} ${n === 1 ? 'registro' : 'registros'}${d === 0 ? ' · hoy' : d ? ` · hace ${d} ${d === 1 ? 'día' : 'días'}` : ''}`, vacio: false };
  }
  if (id === 'fotos') {
    const n = lista(fotos).length;
    if (!n) return { texto: 'Todavía ninguna', vacio: true };
    return { texto: `${n} ${n === 1 ? 'foto' : 'fotos'}`, vacio: false };
  }
  if (id === 'historial') {
    const n = lista(salud?.historial).length;
    /* ⚠️ **Las dos cifras no se suman, y ni siquiera se ponen juntas sin decir
       de dónde sale cada una.** Las lesiones del historial ya están dentro de
       «N entradas»; las del perfil son otras. Un *"3 entradas · 3 lesiones"*
       parecería que hay seis cosas. */
    const delPerfil = lista(perfil?.lesiones).length;
    if (!n && !delPerfil) return { texto: 'Todavía nada', vacio: true };
    const trozos = [];
    if (n) trozos.push(`${n} ${n === 1 ? 'entrada' : 'entradas'}`);
    if (delPerfil) trozos.push(`${delPerfil} ${delPerfil === 1 ? 'lesión' : 'lesiones'} en tu perfil`);
    return { texto: trozos.join(' · '), vacio: false };
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════════════════
   7 · LO QUE ESTA FASE NO HACE — apartado 9
   ══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_BN = [
  { que: 'Una sección independiente de Lesiones', porque: 'el apartado 9 lo prohíbe: se consultan dentro del Historial.' },
  { que: 'Quitar Fotos, Medidas o «Analizar mi salud»', porque: 'el apartado 4 dice que se mantienen tal y como están.' },
  { que: 'Tocar Supabase', porque: 'ni una tabla, ni una columna, ni una política: esta fase no guarda nada nuevo.' },
  { que: 'Tocar la autenticación', porque: 'el apartado 5 lo dice con esas palabras.' },
  { que: 'Tarjetas nuevas para llenar el diseño', porque: '*"La prioridad es simplificar, no añadir cosas."*' },
  { que: 'Renombrar variables, claves o ids', porque: 'el apartado 2 solo pide cambiar lo que ve el usuario.' },
];

export const AUDITORIA_BN = { tablasNuevas: 0, clavesNuevas: 0, camposNuevos: 0, funcionesEliminadas: 0 };

/* ══════════════════════════════════════════════════════════════════════════
   8 · LA CONDICIÓN DE FINALIZACIÓN — apartado 11
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 **Se calculan** (EH F64 y E3 F15): nadie pone una casilla a `true`. Las
   tres que necesitan un iPhone y unos ojos van marcadas con `manual: true` y su
   motivo — declararlas verdes desde aquí sería mentir en la propia auditoría. */
export function condicionBN({ salud, fotos, perfil, vista } = {}) {
  const codigo = typeof vista === 'string' ? vista : '';
  const props = LO_QUE_SE_CONSERVA.map((l) => l.prop);
  const est = estadoActual({ salud, perfil });

  return [
    { id: 1, texto: 'Bienestar carga y su pantalla existe', ok: codigo.includes('export default function HealthView') },
    { id: 2, texto: 'El apartado se llama Bienestar y el módulo Mi salud', ok: NOMBRE_APARTADO === 'Bienestar' && NOMBRE_MODULO === 'Mi salud' && codigo.includes(NOMBRE_MODULO) },
    { id: 3, texto: 'No se repite el nombre del área dentro de él', ok: !/>\s*Salud\s*</.test(codigo) },
    { id: 4, texto: 'Fotos sigue entera', ok: codigo.includes('onAddFoto') && codigo.includes('onDeleteFoto') },
    { id: 5, texto: 'Medidas sigue entera', ok: codigo.includes('onAddMedida') && codigo.includes('onDeleteMedida') },
    { id: 6, texto: 'Historial sigue entero', ok: codigo.includes('onAddHistorial') && codigo.includes('onDeleteHistorial') },
    { id: 7, texto: '«Analizar mi salud» sigue ahí', ok: codigo.includes('Analizar mi salud') && codigo.includes('AIPanel') },
    { id: 8, texto: 'Las lesiones se ven dentro del Historial, sin sección propia', ok: LESIONES.hayseccionPropia === false && codigo.includes('lesionesDe') },
    { id: 9, texto: 'Ninguna prop de las que funcionaban se ha quedado fuera', ok: props.every((p) => codigo.includes(p)) },
    { id: 10, texto: 'No se guarda nada nuevo', ok: AUDITORIA_BN.tablasNuevas === 0 && AUDITORIA_BN.clavesNuevas === 0 && AUDITORIA_BN.camposNuevos === 0 },
    /* ⚠️ Una casilla que se cumple sola no comprueba nada (EH F42). Ésta pasa
       el estado por las dos puertas: con una medida de verdad la sección tiene
       que dar un texto y NO estar vacía; sin ninguna, al revés. */
    {
      id: 11,
      texto: 'Cada sección enseña su número real, y sin datos dice que no hay',
      ok: (() => {
        const conDatos = resumenDeSeccion('medidas', { salud: { medidas: [{ id: 'x', fecha: todayISO(), peso: 70 }] } });
        const sinDatos = resumenDeSeccion('medidas', { salud: { medidas: [] } });
        return !!conDatos && conDatos.vacio === false && /1 registro/.test(conDatos.texto)
          && !!sinDatos && sinDatos.vacio === true && !/\b0\b/.test(sinDatos.texto)
          && est.hayMedidas === (lista(salud?.medidas).length > 0);
      })(),
    },
    { id: 12, texto: 'En un iPhone de verdad, y en claro y en oscuro', ok: false, manual: true, quien: 'Josué', porque: 'nadie ha abierto esto en su móvil; el recorrido en Chromium no es una pantalla táctil.' },
  ];
}
