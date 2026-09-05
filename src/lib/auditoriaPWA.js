/* ===========================================================================
   ENTREGA 3 · FASE 15 (HC F10) — PWA, iPHONE, SINCRONIZACIÓN Y AUDITORÍA FINAL
   ===========================================================================

   *"Conseguir que JosStyle funcione como una aplicación instalada, y no
   simplemente como una página web."* Y el enunciado acota: *"esta fase es de
   estabilización… **NO añadir nuevas funcionalidades de planificación. NO añadir
   IA.**"*

   **Cierra el bloque Hoy y Calendario** (las diez fases HC), así que su trabajo
   es comprobar, no construir. Y comprobar de verdad: cada cosa que el enunciado
   pide se lee **del archivo real** —`public/manifest.json`, `index.html`,
   `index.css`, `supabase/schema.sql`—, nunca de una casilla puesta a mano. Es lo
   que EH F64 dejó escrito: *"las casillas de la condición de finalización se
   CALCULAN; no las pongas a `true`"*.

   ─────────────────────────────────────────────────────────────────────────
   ⏸ **LO QUE SIGUE SIN PODERSE, Y ES LO MISMO DE SIEMPRE**
   ─────────────────────────────────────────────────────────────────────────

   Tres apartados de esta fase (11, 13 y 14) piden cosas que **hoy no se pueden
   cumplir**, y ninguna es un descuido:

   - **Abrir sin conexión** (11) necesita un *service worker*, la misma pieza que
     falta para los avisos con la app cerrada (E3 F11). 🚨 **Y aquí añadirlo a
     ciegas sería peligroso**: un service worker mal configurado deja a Josué con
     una versión vieja congelada, y este proyecto ya perdió meses exactamente por
     eso —`main` tenía código de agosto y *"la web seguía igual"*—. Va a
     `LO_QUE_DECIDE_JOSUE`, no al código.
   - **La sincronización entre dispositivos** (13 y 14): el último en escribir
     gana, porque `app_data` no guarda una versión. Está declarado desde EH F41 y
     confirmado en F45, F46 y F54. **Cualquier fase que lo dé por resuelto está
     mintiendo** (EH F64 lo dice con esas palabras).
   =========================================================================== */

/* ── Lo que se comprueba, y de qué archivo ─────────────────────────────────

   ⚠️ Cada línea dice **dónde mirar**. Una auditoría que no lee el archivo real
   no comprueba nada: su silencio parece un aprobado (EH F45 y F48). */
export const COMPROBACIONES_PWA = [
  { id: 'manifest', apartado: 3, nombre: 'El manifiesto existe y está completo', archivo: 'public/manifest.json' },
  { id: 'iconos', apartado: 4, nombre: 'Los iconos, incluidos los recortables', archivo: 'public/manifest.json' },
  { id: 'icono_iphone', apartado: 4, nombre: 'El icono del iPhone', archivo: 'index.html' },
  { id: 'standalone', apartado: 3, nombre: 'Se abre como aplicación, no como pestaña', archivo: 'public/manifest.json' },
  { id: 'safe_area', apartado: 7, nombre: 'Las zonas seguras del iPhone', archivo: 'src/index.css' },
  { id: 'barra_inferior', apartado: 8, nombre: 'La barra inferior, por encima del área segura', archivo: 'src/index.css' },
  { id: 'viewport', apartado: 7, nombre: 'La pantalla llega hasta los bordes', archivo: 'index.html' },
  { id: 'rls', apartado: 16, nombre: 'Cada usuario solo ve lo suyo', archivo: 'supabase/schema.sql' },
];

export const comprobacionPWA = (id) => COMPROBACIONES_PWA.find((c) => c.id === id) || null;

/* Los campos que el apartado 3 nombra. ⚠️ `start_url` tiene que ser una ruta
   que exista: *"no crear rutas inexistentes"*. */
export const CAMPOS_MANIFIESTO = ['name', 'short_name', 'start_url', 'display', 'icons', 'theme_color', 'background_color'];

/** Revisa el manifiesto ya leído (un objeto). Devuelve lo que falta. */
export function revisarManifiesto(manifiesto) {
  const problemas = [];
  if (!manifiesto || typeof manifiesto !== 'object') return [{ campo: 'manifest', que: 'No se ha podido leer el manifiesto.' }];

  for (const campo of CAMPOS_MANIFIESTO) {
    if (!manifiesto[campo]) problemas.push({ campo, que: `Falta \`${campo}\`.` });
  }
  if (manifiesto.display && manifiesto.display !== 'standalone') {
    problemas.push({ campo: 'display', que: 'No se abriría como aplicación (apartado 3).' });
  }
  // Apartado 3 — *"no crear rutas inexistentes"*. JosStyle no tiene rutas: todo
  // cuelga de `/`, así que cualquier otra cosa apuntaría a un sitio que no está.
  if (manifiesto.start_url && manifiesto.start_url !== '/') {
    problemas.push({ campo: 'start_url', que: 'JosStyle no tiene rutas: la única de verdad es `/`.' });
  }

  const iconos = Array.isArray(manifiesto.icons) ? manifiesto.icons : [];
  for (const tamano of ['192x192', '512x512']) {
    if (!iconos.some((i) => i.sizes === tamano)) problemas.push({ campo: 'icons', que: `Falta el icono de ${tamano} (apartado 4).` });
  }
  // 🚨 Apartado 4 — *"maskable cuando corresponda"*. Sin uno recortable, Android
  // recorta el icono a lo bruto y sale con un borde blanco.
  if (!iconos.some((i) => String(i.purpose || '').includes('maskable'))) {
    problemas.push({ campo: 'icons', que: 'Ningún icono recortable: en Android saldría con un borde blanco (apartado 4).' });
  }
  return problemas;
}

/* ── El iPhone (apartados 6, 7 y 8) ────────────────────────────────────────

   *"Respetar notch, Dynamic Island, barra inferior y safe areas. Especialmente:
   bottom navigation, bottom sheets, modales."*

   ⚠️ Y eso **ya lo resolvió la E3 F1**: las variables y las clases viven en
   `index.css`. Aquí solo se comprueba que siguen ahí — si una fase futura las
   borra, esto salta. */
export const PIEZAS_IPHONE = [
  { id: 'safe_top', busca: '--safe-top', que: 'La zona de arriba, con el notch o la isla.' },
  { id: 'safe_bottom', busca: '--safe-bottom', que: 'La zona de abajo, con la barra del iPhone.' },
  { id: 'pantalla_segura', busca: '.pantalla-segura', que: 'El contenido, por debajo de la hora.' },
  { id: 'nav_segura', busca: '.nav-segura', que: 'La barra inferior, por encima del área segura (apartado 8).' },
  { id: 'accion_superior', busca: '.accion-superior', que: 'Los botones fijos de arriba.' },
  { id: 'toque_44', busca: '.toque-44', que: 'Los 44 píxeles de zona táctil.' },
];

export function revisarIPhone(css) {
  const texto = String(css || '');
  return PIEZAS_IPHONE.filter((p) => !texto.includes(p.busca)).map((p) => ({ campo: p.id, que: `Falta \`${p.busca}\`: ${p.que}` }));
}

/** Apartado 7 — sin `viewport-fit=cover` el navegador no deja usar las zonas
 *  seguras, así que las variables valdrían cero y todo lo de arriba sobraría. */
export function revisarViewport(html) {
  const texto = String(html || '');
  const problemas = [];
  if (!/viewport-fit=cover/.test(texto)) {
    problemas.push({ campo: 'viewport', que: 'Sin `viewport-fit=cover` las zonas seguras valen cero (apartado 7).' });
  }
  if (!/apple-touch-icon/.test(texto)) {
    problemas.push({ campo: 'apple-touch-icon', que: 'Sin esto, el iPhone usa una captura de la página como icono (apartado 4).' });
  }
  if (!/apple-mobile-web-app-capable/.test(texto)) {
    problemas.push({ campo: 'apple-mobile-web-app-capable', que: 'Sin esto no se abre a pantalla completa desde el icono (apartado 6).' });
  }
  return problemas;
}

/* ── El aislamiento entre usuarios (apartados 15, 16 y 17) ─────────────────

   *"Un usuario solo puede leer sus propios eventos, tareas, recordatorios,
   preferencias y conexiones externas."*

   🚨 **Y eso es de la base de datos, nunca de la pantalla** (EH F43 y F63):
   esconder un botón no protege nada. Se comprueba que las cuatro políticas de
   `app_data` son `auth.uid() = user_id` y que **no hay ninguna permisiva**.

   ⚠️ Y se lee el SQL **sin comentarios**: el archivo explica en uno que ninguna
   política es permisiva, y buscar esa frase entera saltaba con ella (EH F43, la
   undécima vez de esa lección). */
export const OPERACIONES_RLS = ['select', 'insert', 'update', 'delete'];
export const POLITICA_CORRECTA = /auth\.uid\(\)\s*=\s*user_id/i;
export const POLITICA_PERMISIVA = /auth\.uid\(\)\s+is\s+not\s+null/i;

export function sinComentariosSQL(sql) {
  return String(sql || '').replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

export function revisarAislamientoPWA(sql) {
  const limpio = sinComentariosSQL(sql);
  const problemas = [];
  // 🚨 La permisiva dejaría a cualquiera con sesión leer la fila de cualquiera.
  if (POLITICA_PERMISIVA.test(limpio)) {
    problemas.push({ campo: 'rls', que: 'Hay una política permisiva: dejaría a cualquiera con sesión leer los datos de otro.' });
  }
  for (const op of OPERACIONES_RLS) {
    const tiene = new RegExp(`for\\s+${op}[\\s\\S]{0,400}?auth\\.uid\\(\\)\\s*=\\s*user_id`, 'i').test(limpio);
    if (!tiene) problemas.push({ campo: `rls_${op}`, que: `Falta la política de ${op} atada al usuario (apartado 16).` });
  }
  return problemas;
}

/* ── Lo que decide Josué (apartados 11, 13 y 14) ───────────────────────────

   🚨 Igual que `LO_QUE_NECESITA_JOSUE` en la E3 F12: **no son tareas pendientes
   mías**, y ninguna fase futura puede darlas por hechas. */
export const LO_QUE_DECIDE_JOSUE = [
  {
    id: 'service_worker',
    apartado: 11,
    que: 'Que la aplicación abra sin conexión',
    decide: 'Josué',
    porque: 'Hace falta una pieza que se queda funcionando en segundo plano, y es la misma que falta para los avisos con la app cerrada.',
    /* 🚨 El riesgo, escrito: este proyecto ya perdió meses con una versión
       congelada. Añadirla mal repetiría exactamente eso. */
    riesgo: 'Mal configurada, deja la aplicación congelada en una versión vieja: se abriría siempre la de antes por más que se suba código nuevo. A este proyecto ya le pasó algo así.',
  },
  {
    id: 'sincronizacion',
    apartado: 14,
    que: 'Que dos dispositivos no se pisen',
    decide: 'Josué',
    porque: 'Hoy gana el último que escribe, porque no se guarda una versión de cada dato. Arreglarlo es una columna nueva en la base de datos.',
    riesgo: 'Mientras tanto, editar lo mismo en el móvil y en el ordenador a la vez deja solo lo último que se guardó.',
  },
  {
    id: 'endpoint_ia',
    apartado: 17,
    que: 'Que la función de la IA pida sesión',
    decide: 'Josué',
    porque: 'La usan seis módulos, así que cambiarla es una decisión suya. Está escrito desde EH F63.',
    riesgo: 'Cualquiera que encuentre la dirección puede gastar dinero de su cuenta.',
  },
];

export const decideJosue = (id) => LO_QUE_DECIDE_JOSUE.find((x) => x.id === id) || null;

/* ── El cierre del bloque (la condición de finalización) ───────────────────

   🚨 **Las casillas se CALCULAN.** `condicionHC()` ejecuta las comprobaciones de
   verdad sobre los archivos que se le pasan; si una está roja, es que lo está
   (EH F64). Nadie las pone a `true` a mano. */
export function condicionHC({ manifiesto, html, css, sql } = {}) {
  const casillas = [
    { id: 'manifiesto', nombre: 'El manifiesto está completo', problemas: revisarManifiesto(manifiesto) },
    { id: 'iphone', nombre: 'Las zonas seguras del iPhone', problemas: revisarIPhone(css) },
    { id: 'viewport', nombre: 'La pantalla y el icono del iPhone', problemas: revisarViewport(html) },
    { id: 'aislamiento', nombre: 'Cada usuario solo ve lo suyo', problemas: revisarAislamientoPWA(sql) },
  ];
  return casillas.map((c) => ({ ...c, ok: c.problemas.length === 0 }));
}

/** Lo que falta de verdad, en una lista. `[]` si está todo. */
export const loQueFalla = (casillas) => casillas.filter((c) => !c.ok);

/* ── Lo que esta fase NO hace ──────────────────────────────────────────────
   *"NO añadir nuevas funcionalidades de planificación. NO añadir IA."* */
export const NO_EN_LA_AUDITORIA = [
  { que: 'Funcionalidades nuevas de planificación', porque: 'El enunciado lo prohíbe expresamente: esta fase es de estabilización.' },
  { que: 'IA', porque: 'El enunciado lo prohíbe expresamente.' },
  { que: 'Un service worker', porque: 'Mal configurado congela la aplicación en una versión vieja, y este proyecto ya perdió meses por algo así. Lo decide Josué.' },
  { que: 'Prometer edición sin conexión', porque: 'El apartado 12 lo dice con esas palabras: *"no prometer edición offline completa si la arquitectura no la soporta"*.' },
];
