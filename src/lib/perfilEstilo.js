// ============================================================================
// EH · Fase 6/65 — PERFIL DE ESTILO Y PREFERENCIAS PERSONALES
//
// *"Armario → qué prendas tiene el usuario. Perfil de estilo → qué le gusta, qué
// quiere conseguir y qué tipo de imagen quiere transmitir."*
//
// ── DÓNDE VIVE ESTO, Y POR QUÉ NO EN UN SITIO NUEVO ────────────────────────
//
// Todo el perfil se guarda en **la capa de datos de la Fase 4**, con una línea
// por preferencia en `REGISTRO_DATOS`. No hay un `perfilEstilo: {}` aparte, y no
// es por ahorrar: es que **`estilosFavoritos` y `coloresFavoritos` YA EXISTÍAN**
// desde la Fase 5. Crear aquí unos paralelos habría dado dos listas de estilos
// favoritos, y el Test 9 de esta fase dice literalmente *"comprobar que no se
// duplica la información"*.
//
// El efecto secundario bueno: el panel **Mis datos** de la Fase 4 enseña el
// perfil entero sin que nadie lo enchufe, y `hayQuePreguntar()` ya sabe que
// Productos no tiene que volver a preguntar los colores.
//
// ── LAS TRES COSAS QUE NO SE INVENTAN ──────────────────────────────────────
//
// **1. Los colores son los del armario** (apartado 4: *"no duplicar el sistema
// de paletas si ya existe"*). **2. Las marcas se leen de sus prendas** (apartado
// 5: *"reutilizar las marcas existentes"*). **3. Las ocasiones son las de los
// outfits** (apartado 6). Ninguna de las tres se declara aquí.
//
// ⚠️ **Lo que sí nace aquí son los NIVELES** (apartado 10: *"mantener el sistema
// de niveles que ya definimos"*). En la especificación se definen en fases
// posteriores —la 18 y la 22 los usan— pero en orden de construcción esta es la
// primera que los necesita. Así que se definen aquí, una vez, y esas fases los
// importarán en vez de escribir los suyos.
// ============================================================================

import { COLORES_ARMARIO, OCASIONES_OUTFIT, marcasDe, colorDe, CATEGORIAS_ARMARIO } from './armario';
import { leerDato, guardarDato, eliminarDato, datoDelRegistro } from './datosEstiloHombre';
import { estaActivo } from './estiloDeHombre';
import { todayISO } from './helpers';

/* ===========================================================================
   1 · ACCESO (apartado 1)
   ===========================================================================
   *"Dentro de 👕 Estilo y Armario añadir una zona 👤 Mi estilo. **No crear otro
   apartado principal.**"*

   Por eso no hay un módulo nuevo en `MODULOS_EH`: el perfil vive dentro del que
   ya está. */

export const ZONA_MI_ESTILO = { id: 'mi-estilo', nombre: 'Mi estilo', icono: '👤', dentroDe: 'estilo' };

/* ===========================================================================
   2 · LAS LISTAS DEL ENUNCIADO
   ===========================================================================
   Las cinco que el enunciado enumera y que **no existen en ningún otro sitio**.
   Los colores, las marcas y las ocasiones NO están aquí: se leen del armario. */

export const ESTILOS_VESTIR = [
  { id: 'casual', nombre: 'Casual' },
  { id: 'deportivo', nombre: 'Deportivo' },
  { id: 'minimalista', nombre: 'Minimalista' },
  { id: 'elegante', nombre: 'Elegante' },
  { id: 'urbano', nombre: 'Urbano' },
  { id: 'clasico', nombre: 'Clásico' },
  { id: 'streetwear', nombre: 'Streetwear' },
  { id: 'formal', nombre: 'Formal' },
  { id: 'smart_casual', nombre: 'Smart casual' },
  { id: 'otro', nombre: 'Otro' },
];

export const PRIORIDADES_ESTILO = [
  { id: 'comodidad', nombre: 'Comodidad' },
  { id: 'apariencia', nombre: 'Buena apariencia' },
  { id: 'versatilidad', nombre: 'Versatilidad' },
  { id: 'calidad', nombre: 'Calidad' },
  { id: 'precio', nombre: 'Precio' },
  { id: 'durabilidad', nombre: 'Durabilidad' },
];

export const IMAGENES_PERSONALES = [
  { id: 'elegante', nombre: 'Elegante' },
  { id: 'deportivo', nombre: 'Deportivo' },
  { id: 'cuidado', nombre: 'Cuidado' },
  { id: 'casual', nombre: 'Casual' },
  { id: 'maduro', nombre: 'Maduro' },
  { id: 'minimalista', nombre: 'Minimalista' },
  { id: 'natural', nombre: 'Natural' },
  { id: 'otro', nombre: 'Otro' },
];

/**
 * ⚠️ **Los niveles nacen aquí** (apartado 10). Las fases 18 y 22 los usan; esta
 * es la primera que los necesita en orden de construcción, así que se definen
 * una vez y aquellas los importan. El día que una fase escriba `['Básico',
 * 'Intermedio', 'Avanzado']` por su cuenta, habrá dos listas.
 */
export const NIVELES_ESTILO = [
  { id: 'basico', nombre: 'Básico', icono: '🟢', orden: 1 },
  { id: 'intermedio', nombre: 'Intermedio', icono: '🟡', orden: 2 },
  { id: 'avanzado', nombre: 'Avanzado', icono: '🔴', orden: 3 },
];

export const nivelEstilo = (id) => NIVELES_ESTILO.find((x) => x.id === id) || null;

/* ⚠️ Las tres listas que NO se declaran, con dónde están de verdad. Existe para
   que una fase futura que las busque aquí encuentre el sitio correcto en vez de
   escribir la suya. */
export const LISTAS_PRESTADAS = {
  colores: { de: 'armario.js', constante: 'COLORES_ARMARIO', apartado: 4 },
  marcas: { de: 'armario.js', constante: 'marcasDe(prendas)', apartado: 5, derivada: true },
  ocasiones: { de: 'armario.js', constante: 'OCASIONES_OUTFIT', apartado: 6 },
};

export const coloresDisponibles = () => COLORES_ARMARIO;
export const ocasionesDisponibles = () => OCASIONES_OUTFIT;
/** Apartado 5 — *"reutilizar las marcas existentes"*: las de sus propias prendas. */
export const marcasDisponibles = (armario) => marcasDe(((armario || {}).prendas) || []);

/* ===========================================================================
   3 · LOS CAMPOS DEL PERFIL
   ===========================================================================
   Cada uno con su lista de opciones —o `libre: true` si es texto suyo— y si
   admite varios. Añadir un campo al perfil es **añadir una línea**, igual que
   añadir un módulo lo es en la Fase 1. */

export const CAMPOS_PERFIL_ESTILO = [
  { id: 'estilosFavoritos', titulo: '¿Cómo quieres vestir?', apartado: 2, multiple: true, opciones: () => ESTILOS_VESTIR },
  { id: 'prioridadesEstilo', titulo: '¿Qué buscas?', apartado: 3, multiple: true, ordenada: true, opciones: () => PRIORIDADES_ESTILO },
  { id: 'coloresFavoritos', titulo: 'Colores que te gustan', apartado: 4, multiple: true, opciones: coloresDisponibles },
  { id: 'coloresEvitar', titulo: 'Colores que prefieres evitar', apartado: 4, multiple: true, opciones: coloresDisponibles },
  { id: 'marcasFavoritas', titulo: 'Marcas favoritas', apartado: 5, multiple: true, delArmario: true },
  { id: 'marcasEvitar', titulo: 'Marcas que no quieres usar', apartado: 5, multiple: true, delArmario: true },
  { id: 'ocasionesInteres', titulo: '¿Para qué quieres recomendaciones?', apartado: 6, multiple: true, opciones: ocasionesDisponibles },
  { id: 'intereses', titulo: 'Cosas que te gustan', apartado: 7, multiple: true, libre: true },
  { id: 'quiereHacer', titulo: 'Cosas que te gustaría hacer', apartado: 8, multiple: true, libre: true },
  { id: 'imagenPersonal', titulo: '¿Qué imagen te gustaría transmitir?', apartado: 9, multiple: true, opciones: () => IMAGENES_PERSONALES },
  { id: 'nivelEstilo', titulo: 'Tu nivel', apartado: 10, multiple: false, opciones: () => NIVELES_ESTILO },
];

export const campoPerfil = (id) => CAMPOS_PERFIL_ESTILO.find((c) => c.id === id) || null;
export const IDS_PERFIL_ESTILO = CAMPOS_PERFIL_ESTILO.map((c) => c.id);

/* ===========================================================================
   4 · LEER Y ESCRIBIR
   ===========================================================================
   ⚠️ Todo pasa por `leerDato`/`guardarDato` de la Fase 4. Esta fase **no tiene
   almacén propio**, y por eso no puede desincronizarse de nada.

   Apartado 13: *"Puede dejar estilo vacío, marcas vacías, intereses vacíos…
   La aplicación debe funcionar igualmente."* Así que un campo sin rellenar
   devuelve `[]`, nunca `null` ni un error. */

const comoLista = (valor) => {
  if (Array.isArray(valor)) return valor.filter((x) => x !== null && x !== undefined && x !== '');
  if (valor === null || valor === undefined || valor === '') return [];
  return [valor];
};

export function leerCampo(estado, id, datosGlobales = {}) {
  const campo = campoPerfil(id);
  if (!campo) return { id, valores: [], tiene: false, titulo: '', vacio: true };
  const d = leerDato(estado, id, datosGlobales);
  const valores = comoLista(d.valor);
  return {
    id,
    titulo: campo.titulo,
    apartado: campo.apartado,
    multiple: campo.multiple,
    valores,
    tiene: valores.length > 0,
    vacio: valores.length === 0,
    actualizadoEn: d.actualizadoEn,
  };
}

/** Apartados 2 y 12 — *"debe poder seleccionar más de uno"* y poder cambiarlo. */
export function alternarValor(estado, id, valor, { hoy = todayISO() } = {}) {
  const campo = campoPerfil(id);
  if (!campo) return { estado, error: 'Ese campo no existe en el perfil de estilo.' };
  const actuales = leerCampo(estado, id).valores;

  if (!campo.multiple) {
    // Un campo de valor único: volver a tocarlo lo quita, no lo repite.
    if (actuales[0] === valor) return eliminarDato(estado, id);
    return guardarDato(estado, id, valor, { modulo: 'estilo', hoy });
  }

  const siguientes = actuales.includes(valor) ? actuales.filter((x) => x !== valor) : [...actuales, valor];
  // ⚠️ Quedarse sin nada NO es un error (apartado 13): se borra el dato, que es
  // más honesto que guardar una lista vacía y decir después "no lo has indicado".
  if (siguientes.length === 0) return eliminarDato(estado, id);
  return guardarDato(estado, id, siguientes, { modulo: 'estilo', hoy });
}

/** Apartado 3 — *"establecer prioridad cuando tenga sentido"*: el orden manda. */
export function ordenarValores(estado, id, orden = [], { hoy = todayISO() } = {}) {
  const campo = campoPerfil(id);
  if (!campo || !campo.ordenada) return { estado, error: 'Ese campo no lleva orden.' };
  const actuales = leerCampo(estado, id).valores;
  const nuevos = orden.filter((x) => actuales.includes(x));
  // ⚠️ Lo que no venga en el orden se queda detrás, no desaparece. Mismo criterio
  // que `reordenar()` de la Fase 1 y que las columnas de HT F4.
  const resto = actuales.filter((x) => !nuevos.includes(x));
  if (nuevos.length + resto.length === 0) return eliminarDato(estado, id);
  return guardarDato(estado, id, [...nuevos, ...resto], { modulo: 'estilo', hoy });
}

/** Apartados 7 y 8 — intereses y cosas que le gustaría hacer, en texto libre. */
export function anadirLibre(estado, id, texto, { hoy = todayISO() } = {}) {
  const campo = campoPerfil(id);
  if (!campo || !campo.libre) return { estado, error: 'Ese campo no admite texto libre.' };
  const limpio = String(texto || '').trim();
  if (!limpio) return { estado, error: null, sinEfecto: true };
  const actuales = leerCampo(estado, id).valores;
  if (actuales.some((x) => String(x).toLowerCase() === limpio.toLowerCase())) {
    return { estado, error: null, sinEfecto: true };   // ya estaba: no se duplica
  }
  return guardarDato(estado, id, [...actuales, limpio], { modulo: 'estilo', hoy });
}

export const quitarLibre = (estado, id, texto, opts) => alternarValor(estado, id, texto, opts);

/** Apartado 12 — *"desde ⚙️ Editar mi estilo puede modificar cualquier preferencia"*. */
export function limpiarCampo(estado, id) {
  if (!campoPerfil(id)) return { estado, error: 'Ese campo no existe en el perfil de estilo.' };
  return eliminarDato(estado, id);
}

/* ===========================================================================
   5 · EL PERFIL ENTERO
   =========================================================================== */

export function perfilDeEstilo(estado, armario = null, datosGlobales = {}) {
  return CAMPOS_PERFIL_ESTILO.map((c) => {
    const leido = leerCampo(estado, c.id, datosGlobales);
    const opciones = c.delArmario
      ? marcasDisponibles(armario).map((m) => ({ id: m, nombre: m }))
      : (c.opciones ? c.opciones() : []);
    return {
      ...leido,
      libre: !!c.libre,
      ordenada: !!c.ordenada,
      delArmario: !!c.delArmario,
      opciones,
      // ⚠️ Apartado 5 — si no tiene ninguna prenda, no hay marcas que ofrecer, y
      // se dice en vez de enseñar una lista vacía sin explicación.
      sinOpciones: !c.libre && opciones.length === 0,
      // El nombre legible de cada valor elegido. Para una lista de marcas es el
      // texto mismo; para un color, su etiqueta.
      etiquetas: leido.valores.map((v) => nombreDeValor(c.id, v)),
    };
  });
}

export function nombreDeValor(campoId, valor) {
  const campo = campoPerfil(campoId);
  if (!campo || campo.libre || campo.delArmario) return String(valor);
  const encontrado = (campo.opciones ? campo.opciones() : []).find((o) => o.id === valor);
  if (encontrado) return encontrado.nombre || encontrado.label;
  // Los colores del armario usan `label`, no `nombre`.
  return colorDe(valor)?.label || String(valor);
}

/**
 * Apartado 13 — *"No obligar a completar todo"*. Esto NO es una barra de
 * progreso que empuje: es un recuento para poder decir *"has rellenado 3 de
 * 11"* sin ponerle nota. Ni porcentaje, ni "incompleto".
 */
export function estadoDelPerfil(estado, armario = null, datosGlobales = {}) {
  const campos = perfilDeEstilo(estado, armario, datosGlobales);
  const rellenos = campos.filter((c) => c.tiene);
  return {
    rellenos: rellenos.length,
    total: campos.length,
    vacio: rellenos.length === 0,
    // ⚠️ Un perfil vacío es un perfil válido. El Test 7 es exactamente eso.
    valido: true,
    campos: campos.map((c) => ({ id: c.id, tiene: c.tiene })),
  };
}

/* ===========================================================================
   6 · LO QUE REFLEJA SU ARMARIO (apartado 14)
   ===========================================================================
   *"Tu armario refleja principalmente: Deportivo · Casual · Minimalista. Pero
   esto debe ser informativo, no una clasificación obligatoria."*

   ⚠️ **Y aquí hay una tentación que conviene nombrar:** deducir "estilo" de una
   prenda es adivinar. Un pantalón negro puede ser de cualquier estilo. Así que
   esto NO clasifica prendas: mira **las ocasiones de sus outfits y las
   categorías que más tiene**, que son datos que él ha puesto, y **dice de dónde
   sale cada palabra**. Si no hay bastante, no dice nada — igual que la analítica
   del Horario (HT F11) y las recomendaciones del Armario (AR F4). */

export const MINIMO_PARA_REFLEJAR = 4;

/* La única tabla de interpretación que hay, y está declarada entera para poder
   discutirla. Va de OCASIÓN (que él eligió) a estilo, no de prenda a estilo. */
export const OCASION_A_ESTILO = {
  deporte: 'deportivo',
  estudios: 'casual',
  diario: 'casual',
  casual: 'casual',
  trabajo: 'smart_casual',
  formal: 'formal',
  evento: 'elegante',
  cena: 'elegante',
  fiesta: 'urbano',
  viaje: 'casual',
};

/* Y de categoría a estilo, solo donde la prenda lo dice sin ambigüedad. Un
   chándal es deportivo; un pantalón, no dice nada, y por eso no está. */
export const CATEGORIA_A_ESTILO = {
  chandal: 'deportivo',
  shorts: 'deportivo',
  camisas: 'elegante',
  zapatos: 'elegante',
  polos: 'smart_casual',
  sudaderas: 'casual',
  camisetas: 'casual',
};

export function loQueReflejaTuArmario(armario) {
  const a = armario || {};
  const prendas = Array.isArray(a.prendas) ? a.prendas : [];
  const outfits = Array.isArray(a.outfits) ? a.outfits : [];

  if (prendas.length < MINIMO_PARA_REFLEJAR) {
    return {
      suficiente: false,
      estilos: [],
      // Apartado 14: informativo. Sin datos, no se inventa una etiqueta.
      texto: '',
      motivo: 'pocas_prendas',
      de: prendas.length,
      hacenFalta: MINIMO_PARA_REFLEJAR,
    };
  }

  const cuenta = new Map();
  const suma = (estilo, peso) => { if (estilo) cuenta.set(estilo, (cuenta.get(estilo) || 0) + peso); };

  // Las ocasiones pesan más: las eligió él a mano para cada outfit.
  outfits.forEach((o) => suma(OCASION_A_ESTILO[o.ocasion], 2));
  prendas.forEach((p) => suma(CATEGORIA_A_ESTILO[p.categoria], 1));

  const orden = [...cuenta.entries()].sort((a2, b) => b[1] - a2[1]).slice(0, 3);
  if (orden.length === 0) {
    return { suficiente: false, estilos: [], texto: '', motivo: 'sin_senal', de: prendas.length };
  }

  const nombres = orden.map(([id]) => ESTILOS_VESTIR.find((e) => e.id === id)?.nombre || id);
  return {
    suficiente: true,
    estilos: orden.map(([id, peso]) => ({ id, peso })),
    texto: `Tu armario refleja principalmente: ${nombres.join(' · ')}`,
    // ⚠️ De dónde sale, para que no sea una caja negra (misma regla que HT F11).
    origen: `${outfits.length} ${outfits.length === 1 ? 'outfit' : 'outfits'} y ${prendas.length} prendas`,
    motivo: null,
    de: prendas.length,
  };
}

/**
 * Apartado 14 — y la comparación con lo que él ha dicho, **sin corregirle**. Si
 * dice "elegante" y su armario refleja "deportivo", eso no es un error suyo:
 * puede ser exactamente lo que quiere cambiar.
 */
export function contrasteConElArmario(estado, armario, datosGlobales = {}) {
  const refleja = loQueReflejaTuArmario(armario);
  const dice = leerCampo(estado, 'estilosFavoritos', datosGlobales).valores;
  if (!refleja.suficiente || dice.length === 0) return { hayContraste: false, coinciden: [], texto: '' };
  const ids = refleja.estilos.map((e) => e.id);
  const coinciden = dice.filter((d) => ids.includes(d));
  return {
    hayContraste: true,
    coinciden,
    // Describe, no juzga. Ni "deberías", ni "no encaja".
    texto: coinciden.length > 0
      ? `Coincide con ${coinciden.length === 1 ? 'el estilo' : 'los estilos'} que has elegido.`
      : 'Es distinto de lo que has elegido, que puede ser justo lo que buscas cambiar.',
  };
}

/* ===========================================================================
   7 · PARA LAS RECOMENDACIONES (apartados 11 y 15)
   ===========================================================================
   *"Toda esta información podrá utilizarse posteriormente para generar
   recomendaciones mediante reglas. **No utilizar IA.**"*

   Esto no recomienda nada: entrega el perfil ya masticado para que quien
   recomiende no tenga que interpretarlo. Las recomendaciones de verdad son de
   AR F4 y de la Fase 32. */

export function perfilParaRecomendaciones(estado, armario = null, datosGlobales = {}) {
  const lee = (id) => leerCampo(estado, id, datosGlobales).valores;
  return {
    estilos: lee('estilosFavoritos'),
    // El orden ES la prioridad (apartado 3): el primero pesa más.
    prioridades: lee('prioridadesEstilo'),
    coloresGustan: lee('coloresFavoritos'),
    coloresEvitar: lee('coloresEvitar'),
    marcasGustan: lee('marcasFavoritas'),
    marcasEvitar: lee('marcasEvitar'),
    ocasiones: lee('ocasionesInteres'),
    intereses: lee('intereses'),
    imagen: lee('imagenPersonal'),
    nivel: lee('nivelEstilo')[0] || null,
    // ⚠️ Apartado 13 — con todo vacío esto sigue siendo válido, y quien lo use
    // tiene que poder saberlo sin contar campos.
    vacio: IDS_PERFIL_ESTILO.every((id) => lee(id).length === 0),
    // ⚠️ Apartado 15 — lo que NO sale de aquí, y por qué.
    noIncluye: ['quiereHacer'],
    porQue: 'Lo que le gustaría hacer es personal y no mejora una recomendación de ropa.',
  };
}

/**
 * Apartado 11, el ejemplo del enunciado: *"Le gusta el fútbol + estilo deportivo
 * + prioriza comodidad → mostrar recomendaciones compatibles."*
 *
 * ⚠️ Reglas, no IA: son cuatro, están escritas y cada una dice por qué.
 */
export function reglasDelPerfil(estado, armario = null, datosGlobales = {}) {
  const p = perfilParaRecomendaciones(estado, armario, datosGlobales);
  const reglas = [];

  if (p.estilos.length > 0) {
    reglas.push({ id: 'estilo', preferir: p.estilos, porque: `Has elegido ${p.estilos.map((e) => nombreDeValor('estilosFavoritos', e)).join(', ')}.` });
  }
  if (p.coloresEvitar.length > 0) {
    reglas.push({ id: 'color_evitar', evitar: p.coloresEvitar, porque: 'Has dicho que prefieres evitarlos.' });
  }
  if (p.coloresGustan.length > 0) {
    reglas.push({ id: 'color_preferir', preferir: p.coloresGustan, porque: 'Son los colores que te gustan.' });
  }
  if (p.marcasEvitar.length > 0) {
    reglas.push({ id: 'marca_evitar', evitar: p.marcasEvitar, porque: 'Has dicho que no quieres usarlas.' });
  }
  if (p.prioridades[0]) {
    reglas.push({ id: 'prioridad', primera: p.prioridades[0], porque: `Lo que más buscas es ${nombreDeValor('prioridadesEstilo', p.prioridades[0]).toLowerCase()}.` });
  }
  return reglas;
}

/* ===========================================================================
   8 · TESTS 9 Y 10 — NO DUPLICAR, NO PERDER
   ===========================================================================
   *"Comprobar que no se duplica la información del armario"* y *"desactivar
   Estilo y Armario → preferencias conservadas"*. */

export function auditarPerfilEstilo(estado, armario = null, datosGlobales = {}) {
  const campos = perfilDeEstilo(estado, armario, datosGlobales);
  return {
    // Test 9 — ni una lista de colores, marcas u ocasiones propia.
    listasPrestadas: Object.keys(LISTAS_PRESTADAS).length,
    listasPropias: [ESTILOS_VESTIR, PRIORIDADES_ESTILO, IMAGENES_PERSONALES, NIVELES_ESTILO].length,
    // Todos los campos viven en la capa de la Fase 4: cero almacenes propios.
    almacenesPropios: 0,
    camposEnRegistro: IDS_PERFIL_ESTILO.filter((id) => datoDelRegistro(id) !== null).length,
    camposTotal: IDS_PERFIL_ESTILO.length,
    // Test 10 — el perfil no depende de que el módulo esté encendido.
    moduloActivo: estaActivo(estado, 'estilo'),
    camposRellenos: campos.filter((c) => c.tiene).length,
  };
}

export function resumenPerfilEstilo(estado, armario = null, datosGlobales = {}) {
  const est = estadoDelPerfil(estado, armario, datosGlobales);
  const refleja = loQueReflejaTuArmario(armario);
  return {
    ...est,
    reglas: reglasDelPerfil(estado, armario, datosGlobales).length,
    refleja: refleja.suficiente ? refleja.texto : '',
    marcasDisponibles: marcasDisponibles(armario).length,
  };
}
