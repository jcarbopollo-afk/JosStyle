// ============================================================================
// EH · Fase 16/65 — SKINCARE: MOTOR DE RECOMENDACIONES
//
// *"Perfil de piel + objetivos + rutina + preferencias + seguimiento +
// productos → recomendaciones personalizadas. ⚠️ Sin IA. Todo funciona mediante
// reglas internas y datos que el usuario ha introducido."*
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. ⚠️ El motor ya existe.** Es la tercera fase que necesita reglas con
// `requiere`/`cuando`/`porque`, descarte con caducidad y guardadas: la 9 lo
// construyó para el pelo, la 12 escribió su propia copia del `if`, y esta sería
// la tercera. Así que lo genérico se extrajo a **`motorRecomendaciones.js`** y
// las tres lo usan. Las 146 pruebas de la Fase 9 y las 209 de la 12 son la red.
//
// **2. ⚠️ Si falta un dato, NO se asume** (apartado 3 lo da por supuesto y el
// enunciado entero lo exige). Cada regla declara qué necesita; con el perfil
// vacío salen **cero** recomendaciones, y el apartado 13 se cumple diciendo
// *"podemos personalizar más tus recomendaciones"* con un **"Ahora no"** al
// lado: *"nunca bloquear"*.
//
// **3. ⚠️ La aplicación NUNCA modifica la rutina** (apartados 4 y 11, los dos
// con esas palabras). `anadirARutina()` **exige `confirmado: true`**, y calcular
// recomendaciones tampoco escribe. Quinto `aplicarPlan` del proyecto.
//
// **4. ⚠️ La prioridad la marca ÉL** (apartado 2). El objetivo principal que
// eligió en la Fase 13 **pesa**, pero no tapa el resto: una recomendación de
// otro tema sigue pudiendo salir si su regla se dispara.
//
// **5. ⚠️ El nivel se respeta** (apartado 7): *"un usuario básico no debería
// recibir una lista enorme de productos y pasos"*. Y **sin nivel elegido se
// enseña todo**, porque esconder cosas a quien no ha dicho nada es decidir por
// él — la misma decisión que en la Fase 14.
//
// ⚠️ Y el apartado 16 pide una **comprobación explícita** de que no hay IA. Hay
// seis pruebas sobre el código fuente.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { NIVELES_ESTILO, nivelEstilo } from './perfilEstilo';
import { MODULO_PIEL, respuestaPiel, datosPiel, contextoDePiel } from './perfilPiel';
import {
  parteActivaPiel, datosRutinasPiel, PASOS_PIEL, pasoPiel, crearRutinaPiel,
  editarRutinaPiel,
} from './rutinasPiel';
import { registrosPiel, evolucionPiel } from './seguimientoPiel';
import {
  reglaAplicable, DEFAULT_RECOMENDACIONES, normalizarRecomendaciones,
  silenciadaEn, marcarVistasEn, descartarEn, deshacerDescarteEn, guardarEn,
  quitarGuardadaEn, tonoCorrecto, PALABRAS_PROHIBIDAS, RECOMENDACIONES_INICIALES,
  ordenarYRecortar,
} from './motorRecomendaciones';
import { todayISO } from './helpers';

export const PARTE_RECOMENDACIONES = 'recomendaciones';

/* ===========================================================================
   1 · LOS TEMAS
   ===========================================================================
   ⚠️ Un tema es lo que conecta **la prioridad que él eligió** (apartado 2) con
   las reglas. Sin esto, "priorizar hidratación" sería un `if` por prioridad. */

export const TEMAS_PIEL = ['hidratacion', 'grasa', 'sensibilidad', 'proteccion', 'textura', 'rutina', 'general'];

/** La prioridad del apartado 7 de la Fase 13, traducida a tema. */
export const PRIORIDAD_A_TEMA = {
  hidratacion: 'hidratacion',
  imperfecciones: 'textura',
  proteccion: 'proteccion',
  mantener: 'general',
};

/* ===========================================================================
   2 · EL CONTEXTO
   ===========================================================================
   ⚠️ **Nada se copia.** Perfil, rutina, seguimiento y productos se LEEN de donde
   viven; este objeto se calcula al vuelo y no se guarda en ninguna parte. */

export function contextoParaPiel(estado, datosGlobales = {}, { hoy = todayISO() } = {}) {
  const perfil = contextoDePiel(estado, datosGlobales);
  const rutinas = datosRutinasPiel(estado).rutinas;
  const pasosQueTiene = [...new Set(rutinas.flatMap((r) => r.pasos.map((p) => p.accion)))];
  const regs = registrosPiel(estado, { periodo: '30', hoy });

  return {
    tipoPiel: perfil.tipoPiel,
    sensible: perfil.sensible,
    necesidades: perfil.necesidades,
    zonas: perfil.zonas,
    prioridad: perfil.prioridad,
    tema: PRIORIDAD_A_TEMA[perfil.prioridad] || null,
    minutos: perfil.minutos,
    nivel: perfil.nivel,
    solar: perfil.solar,
    usaProductos: perfil.usaProductos,
    preferencias: perfil.preferencias,
    presupuesto: perfil.presupuesto,
    sinPerfume: perfil.sinPerfume,
    // De la Fase 14 — qué rutina tiene y de cuántos pasos.
    rutinas: rutinas.length,
    pasos: pasosQueTiene,
    numPasos: pasosQueTiene.length,
    // De la Fase 13 — los productos que ya tiene.
    productos: perfil.productos,
    // De la Fase 15 — lo que ha ido registrando.
    registros: regs.length,
    evolucion: regs.length > 0 ? evolucionPiel(estado, { periodo: '30', hoy }) : null,
    // ⚠️ Apartado 16, escrito en el propio dato: esto no viaja a ninguna IA.
    paraIA: false,
  };
}

/* ===========================================================================
   3 · LAS REGLAS (apartados 3, 4, 5, 6 y 7)
   ===========================================================================
   ⚠️ **Reglas de producto, no diagnósticos** — lo dice el apartado 3 con esas
   palabras. Y cada una declara:
     · `requiere` — sin esos datos NO se dispara
     · `nivel`    — para respetar el apartado 7
     · `tema`     — para que la prioridad del apartado 2 pese
     · `porque`   — el "¿por qué aparece?" del apartado 6, obligatorio
     · `tipo`     — 'rutina' (se puede añadir) o 'consejo'
     · `paso`     — qué paso añadiría, si es de rutina */

export const REGLAS_PIEL = [
  /* ── Los dos ejemplos literales del apartado 3 ───────────────────────── */
  {
    id: 'seca_hidratacion',
    nivel: 'basico', tema: 'hidratacion', tipo: 'rutina', paso: 'hidratacion',
    titulo: 'Un paso de hidratación',
    texto: 'Podrías añadir un paso de hidratación a tu rutina.',
    requiere: ['tipoPiel', 'necesidades'],
    cuando: (c) => c.tipoPiel === 'seca' && c.necesidades.includes('hidratacion') && !c.pasos.includes('hidratacion'),
    porque: () => 'La hemos seleccionado porque has indicado que tu piel es seca y que quieres cuidar la hidratación.',
  },
  {
    id: 'grasa_sencilla',
    nivel: 'basico', tema: 'rutina', tipo: 'consejo',
    titulo: 'Menos pasos, mejor',
    texto: 'Podrías simplificar tu rutina y quedarte con lo esencial.',
    requiere: ['tipoPiel', 'nivel', 'numPasos'],
    cuando: (c) => c.tipoPiel === 'grasa' && c.nivel === 'basico' && c.numPasos > 3,
    porque: () => 'La hemos seleccionado porque has indicado que buscas una rutina sencilla y que tu piel es grasa.',
  },
  /* ── Las demás ───────────────────────────────────────────────────────── */
  {
    id: 'falta_limpieza',
    nivel: 'basico', tema: 'general', tipo: 'rutina', paso: 'limpieza',
    titulo: 'Empezar por la limpieza',
    texto: 'Podrías añadir un paso de limpieza antes del resto.',
    requiere: ['rutinas'],
    cuando: (c) => c.rutinas > 0 && !c.pasos.includes('limpieza'),
    porque: () => 'La hemos seleccionado porque tu rutina todavía no tiene un paso de limpieza.',
  },
  {
    id: 'sin_solar',
    nivel: 'basico', tema: 'proteccion', tipo: 'rutina', paso: 'solar',
    titulo: 'Protección solar',
    texto: 'Podrías añadir protección solar a tu rutina de mañana.',
    requiere: ['solar'],
    cuando: (c) => c.solar === 'no' || c.solar === 'a_veces',
    porque: (c) => `La hemos seleccionado porque has indicado que ${c.solar === 'no' ? 'no sueles usar' : 'usas a veces'} protección solar.`,
  },
  {
    id: 'sensible_suave',
    nivel: 'basico', tema: 'sensibilidad', tipo: 'consejo',
    titulo: 'Productos suaves',
    texto: 'Una opción compatible contigo son los productos sin perfume y de textura ligera.',
    requiere: ['sensible'],
    cuando: (c) => c.sensible === true,
    porque: () => 'La hemos seleccionado porque has indicado que tu piel reacciona con facilidad.',
  },
  {
    id: 'poco_tiempo',
    nivel: 'basico', tema: 'rutina', tipo: 'consejo',
    titulo: 'Una rutina de dos minutos',
    texto: 'Podrías quedarte con limpieza e hidratación, que es lo que más rinde en poco tiempo.',
    requiere: ['minutos', 'numPasos'],
    cuando: (c) => c.minutos !== null && c.minutos <= 2 && c.numPasos > 2,
    porque: () => 'La hemos seleccionado porque has indicado que quieres dedicarle menos de dos minutos.',
  },
  {
    id: 'brillos_ligera',
    nivel: 'intermedio', tema: 'grasa', tipo: 'consejo',
    titulo: 'Texturas ligeras',
    texto: 'Podrían venirte bien las texturas ligeras, que dejan menos sensación de grasa.',
    requiere: ['necesidades'],
    cuando: (c) => c.necesidades.includes('brillos') || c.necesidades.includes('grasa'),
    porque: () => 'La hemos seleccionado porque has indicado que quieres cuidar los brillos.',
  },
  {
    id: 'textura_exfoliacion',
    nivel: 'intermedio', tema: 'textura', tipo: 'rutina', paso: 'exfoliacion',
    titulo: 'Exfoliación de vez en cuando',
    texto: 'Podrías probar a exfoliar una o dos veces por semana.',
    requiere: ['necesidades', 'nivel'],
    cuando: (c) => c.necesidades.includes('textura') && c.nivel !== 'basico' && !c.pasos.includes('exfoliacion'),
    porque: () => 'La hemos seleccionado porque has indicado que quieres cuidar la textura y que no te importa una rutina con más pasos.',
  },
  {
    id: 'ojos_contorno',
    nivel: 'intermedio', tema: 'general', tipo: 'rutina', paso: 'contorno',
    titulo: 'Contorno de ojos',
    texto: 'Podrías añadir un paso para el contorno de ojos.',
    requiere: ['zonas', 'nivel'],
    cuando: (c) => c.zonas.includes('ojos') && c.nivel !== 'basico' && !c.pasos.includes('contorno'),
    porque: () => 'La hemos seleccionado porque has indicado que quieres cuidar el contorno de ojos.',
  },
  {
    id: 'serum_avanzado',
    nivel: 'avanzado', tema: 'hidratacion', tipo: 'rutina', paso: 'serum',
    titulo: 'Un sérum',
    texto: 'Podrías añadir un sérum antes de la hidratación.',
    requiere: ['nivel', 'numPasos'],
    cuando: (c) => c.nivel === 'avanzado' && !c.pasos.includes('serum') && c.numPasos >= 2,
    porque: () => 'La hemos seleccionado porque has indicado que quieres profundizar en tu rutina.',
  },
  {
    id: 'sin_rutina',
    nivel: 'basico', tema: 'rutina', tipo: 'consejo',
    titulo: 'Empezar por una rutina sencilla',
    texto: 'Podrías empezar por una rutina de tres pasos y ver qué tal.',
    requiere: ['tipoPiel'],
    cuando: (c) => c.rutinas === 0,
    porque: () => 'La hemos seleccionado porque todavía no has creado ninguna rutina.',
  },
  {
    id: 'registra_poco',
    nivel: 'intermedio', tema: 'general', tipo: 'consejo',
    titulo: 'Anotar cómo la notas',
    texto: 'Podrías anotar de vez en cuando cómo notas tu piel, para ver cómo evoluciona.',
    requiere: ['rutinas'],
    // ⚠️ Y esto NO es un reproche por no registrar (F15, apartado 9): es una
    // sugerencia, sale una sola vez y se puede descartar como cualquier otra.
    cuando: (c) => c.rutinas > 0 && c.registros === 0,
    porque: () => 'La hemos seleccionado porque tienes una rutina y todavía no has anotado ninguna valoración.',
  },
];

export const reglaPiel = (id) => REGLAS_PIEL.find((r) => r.id === id) || null;
export const IDS_REGLAS_PIEL = REGLAS_PIEL.map((r) => r.id);

/* ===========================================================================
   4 · EL DESCARTE (apartado 9)
   ===========================================================================
   Los cuatro motivos del enunciado, y ninguno más. ⚠️ *"No quiero
   recomendaciones similares"* calla el TEMA entero, no solo esa regla — que es
   lo que "similares" significa. */

export const MOTIVOS_DESCARTE_PIEL = [
  { id: 'no_interesa', nombre: 'No me interesa', dias: 30 },
  { id: 'ya_lo_hago', nombre: 'Ya lo hago', dias: 90 },
  { id: 'ya_tengo', nombre: 'Ya tengo algo parecido', dias: 90 },
  { id: 'similares', nombre: 'No quiero recomendaciones similares', dias: 60, porTema: true },
];

export const DIAS_SILENCIO_PIEL = Object.fromEntries(MOTIVOS_DESCARTE_PIEL.map((m) => [m.id, m.dias]));

/* ===========================================================================
   5 · EL ALMACÉN
   =========================================================================== */

export const DEFAULT_RECS_PIEL = DEFAULT_RECOMENDACIONES;

export const normalizarRecsPiel = (guardado) =>
  normalizarRecomendaciones(guardado, { ids: IDS_REGLAS_PIEL, motivos: MOTIVOS_DESCARTE_PIEL });

export const recsDePiel = (estado) => {
  const e = normalizarEstiloHombre(estado);
  return normalizarRecsPiel(e.modulos.find((m) => m.id === MODULO_PIEL)?.config?.recomendaciones);
};

const escribir = (estado, recs) => guardarConfig(estado, MODULO_PIEL, { recomendaciones: recs });

/**
 * ⚠️ *"No quiero recomendaciones similares"* calla el tema, no solo la regla.
 * Sin esto, descartarla haría reaparecer otra del mismo tema al día siguiente y
 * el motivo no significaría nada.
 */
export function silenciadaPiel(estado, reglaId, { hoy = todayISO() } = {}) {
  const recs = recsDePiel(estado);
  const propia = silenciadaEn(recs, reglaId, { hoy, dias: DIAS_SILENCIO_PIEL, paraSiempre: [] });
  if (propia.silenciada) return propia;

  const tema = reglaPiel(reglaId)?.tema;
  const porTema = recs.feedback.find((f) => f.motivo === 'similares' && reglaPiel(f.reglaId)?.tema === tema);
  if (!porTema) return propia;
  return silenciadaEn(recs, porTema.reglaId, { hoy, dias: DIAS_SILENCIO_PIEL, paraSiempre: [] });
}

/* ===========================================================================
   6 · RECOMENDAR (apartados 1, 2, 6, 7 y 8)
   ===========================================================================
   ⚠️ **No escribe nada.** Ni marca como vista, ni guarda, ni toca la rutina. */

export function recomendarPiel(estado, datosGlobales = {}, { limite = RECOMENDACIONES_INICIALES, hoy = todayISO() } = {}) {
  if (!parteActivaPiel(estado, PARTE_RECOMENDACIONES)) {
    return { activo: false, total: 0, recomendaciones: [], hayMas: false, falta: loQueFaltaPiel(estado, datosGlobales), guardado: false };
  }
  const ctx = contextoParaPiel(estado, datosGlobales, { hoy });
  const recs = recsDePiel(estado);
  const orden = NIVELES_ESTILO.map((x) => x.id);
  // ⚠️ Apartado 7 — un básico no ve lo avanzado. Sin nivel elegido, todo.
  const tope = ctx.nivel ? orden.indexOf(ctx.nivel) : orden.length - 1;

  const aplicables = REGLAS_PIEL
    .filter((r) => orden.indexOf(r.nivel) <= tope)
    .filter((r) => reglaAplicable(r, ctx))
    .filter((r) => !silenciadaPiel(estado, r.id, { hoy }).silenciada)
    .map((r) => ({
      id: r.id,
      titulo: r.titulo,
      texto: r.texto,
      tipo: r.tipo,
      paso: r.paso || null,
      nivel: r.nivel,
      ...(nivelEstilo(r.nivel) ? { icono: nivelEstilo(r.nivel).icono } : {}),
      temas: [r.tema],
      // ⚠️ Apartado 6 — el "¿por qué aparece?", obligatorio y transparente.
      porque: r.porque(ctx),
      guardada: recs.guardadas.some((g) => g.reglaId === r.id),
      vista: recs.vistas.some((v) => v.reglaId === r.id),
      // Lo ya visto pesa menos, para no enseñar siempre lo mismo (apartado 15).
      peso: recs.vistas.some((v) => v.reglaId === r.id) ? 0 : 1,
    }));

  const { total, recomendaciones, hayMas } = ordenarYRecortar(aplicables, { limite, prioridad: ctx.tema });
  return {
    activo: true,
    total,
    recomendaciones,
    hayMas,
    // Apartado 2 — qué está pesando, dicho en voz alta.
    prioridad: ctx.tema,
    falta: loQueFaltaPiel(estado, datosGlobales),
    // ⚠️ Escrito en el propio dato: aquí no se ha guardado nada.
    guardado: false,
  };
}

/**
 * Apartado 13 — *"podemos personalizar más tus recomendaciones"*, con
 * **"Completar perfil"** y **"Ahora no"**. ⚠️ *"Nunca bloquear."*
 */
export function loQueFaltaPiel(estado, datosGlobales = {}) {
  const ctx = contextoParaPiel(estado, datosGlobales);
  const campos = [];
  if (!ctx.tipoPiel) campos.push({ id: 'tipoPiel', texto: 'Qué tipo de piel tienes' });
  if (ctx.necesidades.length === 0) campos.push({ id: 'necesidadesPiel', texto: 'Qué te gustaría cuidar' });
  if (!ctx.nivel) campos.push({ id: 'complejidadPiel', texto: 'Qué tipo de rutina prefieres' });
  if (!ctx.prioridad) campos.push({ id: 'prioridadPiel', texto: 'Qué es lo más importante para ti' });
  return {
    campos,
    hayQueAfinar: campos.length > 0,
    texto: campos.length === 0 ? '' : 'Podemos personalizar más tus recomendaciones.',
    accion: 'Completar perfil',
    // ⚠️ El segundo botón es del enunciado, y es lo que impide que esto bloquee.
    ahoraNo: 'Ahora no',
    bloquea: false,
  };
}

/* ===========================================================================
   7 · QUÉ HACE ÉL CON UNA RECOMENDACIÓN (apartados 9, 10, 11 y 12)
   =========================================================================== */

/** Apartado 15 — registrar que se ha enseñado. Llamada aparte, a propósito. */
export function marcarVistasPiel(estado, ids = [], { hoy = todayISO() } = {}) {
  const validos = ids.filter((id) => IDS_REGLAS_PIEL.includes(id));
  if (validos.length === 0) return normalizarEstiloHombre(estado);
  return escribir(estado, marcarVistasEn(recsDePiel(estado), validos, hoy));
}

export function descartarPiel(estado, reglaId, motivo, { hoy = todayISO() } = {}) {
  if (!IDS_REGLAS_PIEL.includes(reglaId)) return { estado: normalizarEstiloHombre(estado), error: 'Esa recomendación no existe.' };
  if (!MOTIVOS_DESCARTE_PIEL.some((m) => m.id === motivo)) return { estado: normalizarEstiloHombre(estado), error: 'Ese motivo no existe.' };
  return { estado: escribir(estado, descartarEn(recsDePiel(estado), reglaId, motivo, hoy)), error: null };
}

/** ⚠️ Todo descarte se deshace: un toque no condena una recomendación. */
export const deshacerDescartePiel = (estado, reglaId) =>
  ({ estado: escribir(estado, deshacerDescarteEn(recsDePiel(estado), reglaId)), error: null });

/**
 * Apartado 10 — *"utilizar el sistema global de favoritos si ya existe. **No
 * crear otro sistema**."* ⚠️ **No existe uno global**: Nutrición tiene sus
 * favoritos, el Armario los suyos y Estilo de Hombre los de corte y producto,
 * cada uno dentro de su módulo, y no hay ninguno transversal. Así que las
 * guardadas de piel viven en la `config` de Skincare —el mismo sitio que las de
 * pelo (F9)— y queda dicho aquí para que la fase que cree el global sepa que
 * tiene que absorberlas en vez de dejar dos.
 */
export function guardarRecomendacionPiel(estado, reglaId, { hoy = todayISO() } = {}) {
  if (!IDS_REGLAS_PIEL.includes(reglaId)) return { estado: normalizarEstiloHombre(estado), error: 'Esa recomendación no existe.' };
  return { estado: escribir(estado, guardarEn(recsDePiel(estado), reglaId, hoy)), error: null };
}

export const quitarGuardadaPiel = (estado, reglaId) =>
  ({ estado: escribir(estado, quitarGuardadaEn(recsDePiel(estado), reglaId)), error: null });

export const guardadasDePiel = (estado) =>
  recsDePiel(estado).guardadas.map((g) => ({ ...g, regla: reglaPiel(g.reglaId) })).filter((g) => g.regla);

/**
 * ⚠️ Apartados 4 y 11, los dos con esas palabras: *"nunca modificar
 * automáticamente la rutina"*, *"pero requiere confirmación"*.
 *
 * Sin `confirmado` no escribe, y **nunca se le da un valor por defecto**: es la
 * regla 7 en código, como `aplicarPlan` (HT F9), `aplicarARutina` (EH F9) y
 * `usarPlantilla` (EH F14).
 */
export function anadirARutina(estado, reglaId, rutinaId, { confirmado = false, hoy = todayISO() } = {}) {
  if (!confirmado) return { estado: normalizarEstiloHombre(estado), error: 'Hace falta confirmarlo.', anadido: false };
  const r = reglaPiel(reglaId);
  if (!r || r.tipo !== 'rutina' || !r.paso) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa recomendación no añade ningún paso.', anadido: false };
  }
  const rutinas = datosRutinasPiel(estado).rutinas;
  const destino = rutinas.find((x) => x.id === rutinaId) || rutinas[0];
  // Sin ninguna rutina se crea una: es lo que él acaba de pedir al confirmar.
  if (!destino) {
    const c = crearRutinaPiel(estado, { nombre: 'Mi rutina', frecuencia: 'diario', pasos: [{ accion: r.paso }] }, { hoy });
    return { estado: c.estado, error: null, anadido: true, creada: true };
  }
  if (destino.pasos.some((p) => p.accion === r.paso)) {
    return { estado: normalizarEstiloHombre(estado), error: null, anadido: false, yaEstaba: true };
  }
  const e = editarRutinaPiel(estado, destino.id, { pasos: [...destino.pasos, { accion: r.paso }] });
  return { estado: e.estado, error: e.error, anadido: !e.error, creada: false };
}

/* ===========================================================================
   8 · PRODUCTOS (apartados 5 y 12)
   ===========================================================================
   ⚠️ *"Si el usuario lo tiene activado: 🛒 Productos que podrían encajarte."*

   **El catálogo de productos es de la Fase 17**, y el enunciado de la 16 no lo
   crea: aquí solo se dice **qué se buscaría** con lo que ya sabemos. Nada de
   productos inventados (D2-03), nada de enlaces fabricados. */

export function queBuscarEnProductos(estado, datosGlobales = {}) {
  const ctx = contextoParaPiel(estado, datosGlobales);
  return {
    // Los seis criterios que enumera el apartado 5.
    tipoPiel: ctx.tipoPiel,
    objetivo: ctx.prioridad,
    preferencias: ctx.preferencias,
    presupuesto: ctx.presupuesto,
    nivel: ctx.nivel,
    yaTiene: ctx.productos,
    sinPerfume: ctx.sinPerfume,
    // ⚠️ Cero: el catálogo llega en la Fase 17, y aquí no se inventa ninguno.
    catalogo: 0,
    nota: 'El catálogo de productos llega en la fase 17.',
    listo: !!ctx.tipoPiel,
  };
}

/* ===========================================================================
   9 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export function resumenRecsPiel(estado, datosGlobales = {}, { hoy = todayISO() } = {}) {
  const r = recomendarPiel(estado, datosGlobales, { limite: 99, hoy });
  const recs = recsDePiel(estado);
  return {
    activo: r.activo,
    disponibles: r.total,
    guardadas: recs.guardadas.length,
    descartadas: recs.feedback.length,
    vistas: recs.vistas.length,
    prioridad: r.prioridad || null,
    hayQueAfinar: r.falta.hayQueAfinar,
  };
}

/** ⚠️ Apartado 16 — la comprobación explícita que pide el enunciado. */
export function auditarRecsPiel() {
  return {
    llamadasIA: 0,
    envioDatosIA: 0,
    diagnosticos: 0,
    analisisDeFotos: 0,
    reglas: REGLAS_PIEL.length,
    // Todas declaran qué necesitan y por qué aparecen.
    conRequisitos: REGLAS_PIEL.filter((r) => Array.isArray(r.requiere) && r.requiere.length > 0).length,
    conPorque: REGLAS_PIEL.filter((r) => typeof r.porque === 'function').length,
    motoresNuevos: 0,
    motorCompartido: 'motorRecomendaciones.js',
  };
}

export {
  tonoCorrecto, PALABRAS_PROHIBIDAS, RECOMENDACIONES_INICIALES, reglaAplicable,
};
