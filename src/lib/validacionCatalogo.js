import { CATALOGO_BRUTO } from './catalogoEjercicios';
import {
  ENTORNOS, EQUIPAMIENTO, DIFICULTADES, TIPOS_EJERCICIO, AGARRES, PAPELES, MEDIDAS,
  PATRONES_MOVIMIENTO, auditarCatalogo, ranura, crearEjercicioCompleto,
} from './ejercicios';
import { GRUPOS_MUSCULARES, subgrupoMuscular } from './fitness';

/* Entrega 4 · Fase 35/45 — «Calidad, validación y administración del catálogo».
   ═══════════════════════════════════════════════════════════════════════════

   El objetivo lo dice en una línea: *"Un error de catálogo debe detectarse
   pronto y no meses después cuando rompa otra parte de la aplicación"*. Esto
   es **una capa ligera** (apartado 40): ni un CMS, ni un panel de
   administración, ni un backend. Una función que mira el catálogo y dice qué
   está mal (error) y qué está incompleto (aviso).

   ───────────────────────────────────────────────────────────────────────────
   1 · LA VALIDACIÓN YA EXISTÍA, Y SE AMPLÍA
   ───────────────────────────────────────────────────────────────────────────

   `auditarCatalogo()` es de la **F2** y ya comprobaba ids repetidos,
   porcentajes que no suman 100, referencias colgadas, entornos, músculos,
   músculo principal, subgrupos sin ejercicio y enlaces inventados. **No se
   escribe otra vez**: `validateExerciseCatalog` la LLAMA para esas ocho y
   convierte lo que encuentra en errores y avisos (apartados 27 y 28). Lo nuevo
   es todo lo que la F2 no miraba —ids de catálogo, papeles, patrones, medidas,
   ciclos, sustituciones a sí mismo, recursos, contenido, cobertura y
   duplicados—.

   ───────────────────────────────────────────────────────────────────────────
   2 · SE VALIDA EL CATÁLOGO EN BRUTO, NUNCA EL NORMALIZADO
   ───────────────────────────────────────────────────────────────────────────

   🚨 `crearEjercicioCompleto` **corrige en silencio**, y es su trabajo: una
   dificultad desconocida pasa a «principiante», un entorno `'Casa'` desaparece,
   un subgrupo que no existe se descarta y un papel raro pasa a «secundario».
   Validando lo normalizado, **nada de eso se vería jamás** (EH F41 y EH F45:
   *"un dato corrupto se busca en lo guardado"*). El apartado 5 lo dice: *"No
   corregir automáticamente silenciosamente"*. Así que se mira
   `CATALOGO_BRUTO`, tal como está escrito.

   ───────────────────────────────────────────────────────────────────────────
   3 · EL CATÁLOGO NO ES LO DEL USUARIO (apartado 36)
   ───────────────────────────────────────────────────────────────────────────

   Una sesión o una plantilla que apunta a un ejercicio que ya no existe **no es
   un catálogo inválido**: es un ejercicio archivado (C-36), y la F29 y la F34
   ya lo enseñan así. Esta función **no recibe `fitness`** —no puede mezclarlo
   aunque quiera—, y nada de aquí escribe ni corrige: solo informa. */

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LAS REGLAS, EN UN SOLO SITIO (apartado 27)
   ═══════════════════════════════════════════════════════════════════════════

   Cada regla declara **su gravedad aquí y en ningún otro sitio**: si mañana
   «descripción corta» pasa a ser un error, se cambia una palabra y el build, el
   diagnóstico y las pruebas lo leen de aquí. */

export const GRAVEDADES = [
  { id: 'error', nombre: 'Error', que: 'Rompe otra parte de Fitness. Para el build.' },
  { id: 'aviso', nombre: 'Aviso', que: 'Incompleto o sospechoso. Se informa y no para nada.' },
];

export const REGLAS_CATALOGO = [
  /* ── Errores: lo que rompe entrenamiento, progreso, rangos u objetivos ── */
  { id: 'id_invalido', gravedad: 'error', que: 'Sin id, o con un id que no es una ranura estable', apartado: 2 },
  { id: 'id_duplicado', gravedad: 'error', que: 'Dos ejercicios con el mismo id', apartado: 2 },
  { id: 'nombre_vacio', gravedad: 'error', que: 'Sin nombre legible', apartado: 3 },
  { id: 'sin_musculos', gravedad: 'error', que: 'No trabaja ningún grupo muscular', apartado: 4 },
  { id: 'subgrupo_inexistente', gravedad: 'error', que: 'Un músculo que no existe', apartado: 4 },
  { id: 'subgrupo_de_otro_grupo', gravedad: 'error', que: 'Un subgrupo declarado en un grupo que no es el suyo', apartado: 6 },
  { id: 'porcentaje_imposible', gravedad: 'error', que: 'Un porcentaje que no es un número entre 0 y 100', apartado: 5 },
  { id: 'porcentajes_no_suman', gravedad: 'error', que: 'Los porcentajes no suman 100', apartado: 5 },
  { id: 'papel_invalido', gravedad: 'error', que: 'Un papel muscular fuera de la lista', apartado: 7 },
  { id: 'sin_principal', gravedad: 'error', que: 'Ningún músculo principal', apartado: 7 },
  { id: 'entorno_invalido', gravedad: 'error', que: 'Un entorno fuera de la lista, o ninguno', apartado: 8 },
  { id: 'equipo_invalido', gravedad: 'error', que: 'Un material fuera de la lista', apartado: 9 },
  { id: 'dificultad_invalida', gravedad: 'error', que: 'Una dificultad fuera de la lista', apartado: 10 },
  { id: 'tipo_invalido', gravedad: 'error', que: 'Un tipo fuera de la lista', apartado: 11 },
  { id: 'agarre_invalido', gravedad: 'error', que: 'Un agarre fuera de la lista', apartado: 9 },
  { id: 'patron_invalido', gravedad: 'error', que: 'Sin patrón de movimiento, o uno fuera de la lista (FIT F33)', apartado: 11 },
  { id: 'medida_invalida', gravedad: 'error', que: 'Sin medidas, o una fuera de la lista', apartado: 19 },
  { id: 'configuracion_incompatible', gravedad: 'error', que: 'Una forma de medirse que no encaja con lo que es', apartado: 19 },
  { id: 'referencia_inexistente', gravedad: 'error', que: 'Una variante, base, progresión o sustitución que no existe', apartado: 1 },
  { id: 'referencia_a_si_mismo', gravedad: 'error', que: 'Un ejercicio que es su propia base, variante, progresión o sustitución', apartado: 13 },
  { id: 'variante_incoherente', gravedad: 'error', que: 'Una variante declarada que no es de la misma familia', apartado: 12 },
  { id: 'ciclo_variantes', gravedad: 'error', que: 'Una cadena de bases que vuelve sobre sí misma', apartado: 12 },
  { id: 'ciclo_progresion', gravedad: 'error', que: 'Una cadena de progresiones que vuelve sobre sí misma', apartado: 14 },
  { id: 'enlace_externo', gravedad: 'error', que: 'Un enlace de fuera dentro del catálogo (FIT F2)', apartado: 18 },
  { id: 'recurso_mal_formado', gravedad: 'error', que: 'Un recurso que no es una ruta propia con extensión conocida', apartado: 17 },
  /* ── Avisos: incompleto o sospechoso, nunca paran el build ── */
  { id: 'recurso_no_encontrado', gravedad: 'aviso', que: 'Una ruta propia que no existe en `public/`', apartado: 17 },
  { id: 'sin_imagen', gravedad: 'aviso', que: 'Sin imagen', apartado: 27 },
  { id: 'sin_tutorial', gravedad: 'aviso', que: 'Sin vídeo ni animación', apartado: 27 },
  { id: 'descripcion_corta', gravedad: 'aviso', que: 'Descripción de menos de 30 caracteres', apartado: 27 },
  { id: 'contenido_incompleto', gravedad: 'aviso', que: 'Falta descripción, instrucciones, errores o consejos', apartado: 32 },
  { id: 'skill_sin_progresion', gravedad: 'aviso', que: 'Una habilidad sin progresión ni nadie que lleve a ella', apartado: 29 },
  { id: 'explosivo_incoherente', gravedad: 'aviso', que: 'El campo `explosivo` y el tipo «explosivo» no dicen lo mismo', apartado: 22 },
  { id: 'referencia_archivada', gravedad: 'aviso', que: 'Un ejercicio en uso que propone uno archivado', apartado: 37 },
  { id: 'posible_duplicado', gravedad: 'aviso', que: 'Dos ejercicios sin relación declarada que parecen el mismo', apartado: 16 },
  { id: 'cobertura_baja', gravedad: 'aviso', que: 'Un grupo muscular con pocos ejercicios', apartado: 31 },
  { id: 'subgrupo_sin_ejercicios', gravedad: 'aviso', que: 'Un subgrupo que no trabaja ningún ejercicio (FIT F2)', apartado: 31 },
];

export const regla = (id) => REGLAS_CATALOGO.find((r) => r.id === id) || null;

/* Los umbrales, declarados (EH F44: un presupuesto es un número). */
export const TOLERANCIA_PORCENTAJE = 0.5;
export const MIN_DESCRIPCION = 30;
export const UMBRAL_COBERTURA = 5;
/* Las extensiones que puede tener un recurso propio. Una imagen o un vídeo que
   no las lleva no es algo que el navegador sepa pintar. */
export const EXTENSIONES_IMAGEN = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg'];
export const EXTENSIONES_VIDEO = ['mp4', 'webm', 'mov'];
/* Apartado 14 — *"Si existe una excepción intencionada: debe estar
   explícitamente marcada."* Vacía: no hay ninguna, y una que se añada aquí se
   ve en la revisión. Cada línea es `{ ids: ['a', 'b'], porque: '…' }`. */
export const CICLOS_PERMITIDOS = [];

/* ═══════════════════════════════════════════════════════════════════════════
   2 · AYUDANTES QUE NO CORRIGEN NADA
   ═══════════════════════════════════════════════════════════════════════════ */

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const lista = (v) => (Array.isArray(v) ? v : []);
const esNumero = (v) => typeof v === 'number' && Number.isFinite(v);
const conocido = (catalogo, id) => catalogo.some((c) => c.id === id);
const ESTABLE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function problema(reglaId, id, mensaje, extra = {}) {
  const r = regla(reglaId);
  return { regla: reglaId, gravedad: r ? r.gravedad : 'error', id: id || null, mensaje, ...extra };
}

/* Lo que `auditarCatalogo` necesita, sin tocar un valor: solo se garantiza que
   las listas son listas, para que un ejercicio roto no la tumbe (apartado 37 de
   la F34: *"No permitir que un dato corrupto rompa la biblioteca completa"*). */
function proyeccionParaAuditar(e) {
  return {
    ...e,
    id: texto(e.id),
    musculos: lista(e.musculos).map((m) => ({ ...(m || {}) })),
    entornos: lista(e.entornos),
    sustitutos: lista(e.sustitutos),
    progresiones: lista(e.progresiones),
    variantes: lista(e.variantes),
  };
}

/** Una ruta propia con extensión conocida: `/ejercicios/press.webp`. */
export function recursoBienFormado(ruta, extensiones) {
  if (typeof ruta !== 'string') return false;
  const r = ruta.trim();
  if (!r.startsWith('/') || r.startsWith('//')) return false;
  const ext = (r.split('?')[0].split('.').pop() || '').toLowerCase();
  return extensiones.includes(ext);
}

/** Los recursos que declara un ejercicio, cada uno con lo que debería ser. */
export function recursosDe(e) {
  const tut = e && typeof e.tutorial === 'object' && e.tutorial ? e.tutorial : {};
  const rec = e && typeof e.recursos === 'object' && e.recursos ? e.recursos : {};
  return [
    { campo: 'tutorial.video', valor: tut.video, extensiones: EXTENSIONES_VIDEO },
    { campo: 'tutorial.animacion', valor: tut.animacion, extensiones: [...EXTENSIONES_VIDEO, 'gif', 'webp', 'svg'] },
    { campo: 'recursos.thumbnail', valor: rec.thumbnail, extensiones: EXTENSIONES_IMAGEN },
    { campo: 'recursos.ilustracion', valor: rec.ilustracion, extensiones: EXTENSIONES_IMAGEN },
    { campo: 'recursos.anatomia', valor: rec.anatomia, extensiones: EXTENSIONES_IMAGEN },
  ].filter((x) => x.valor !== null && x.valor !== undefined && x.valor !== '');
}

/* Las palabras que no distinguen un ejercicio de otro. Se quitan antes de
   comparar nombres: «Press de banca» y «Press banca» son lo mismo. */
const VACIAS = new Set(['con', 'de', 'la', 'el', 'en', 'a', 'al', 'del', 'y', 'las', 'los', 'sobre', 'por']);
const palabrasDe = (e) => new Set(
  ranura([e.nombre, e.variante].filter((x) => typeof x === 'string').join(' '))
    .split('-')
    .filter((t) => t && !VACIAS.has(t))
    .map((t) => t.replace(/(es|s)$/, '')),
);
const principalDe = (e) => lista(e.musculos)
  .filter((m) => m && esNumero(m.porcentaje))
  .reduce((a, b) => (!a || b.porcentaje > a.porcentaje ? b : a), null)?.subgrupoId || null;

/* Dos ejercicios están relacionados si el catálogo lo DICE: base, variante,
   progresión o sustituto. Esa relación es la marca de que la diferencia es
   intencionada (apartado 16), así que no se avisa. */
const relacionados = (a, b) => a.base === b.id || b.base === a.id || (a.base && a.base === b.base)
  || ['variantes', 'progresiones', 'sustitutos'].some((c) => lista(a[c]).includes(b.id) || lista(b[c]).includes(a.id));

/** Recorre un grafo `id → [ids]` y devuelve cada ciclo una vez, como lista. */
export function ciclosDe(aristas) {
  const ciclos = [];
  const vistos = new Set();
  const firma = new Set();
  const visitar = (id, camino) => {
    if (camino.includes(id)) {
      const ciclo = camino.slice(camino.indexOf(id));
      const clave = [...ciclo].sort().join('|');
      if (!firma.has(clave)) { firma.add(clave); ciclos.push(ciclo); }
      return;
    }
    if (vistos.has(id)) return;
    lista(aristas.get(id)).forEach((sig) => visitar(sig, [...camino, id]));
    vistos.add(id);
  };
  [...aristas.keys()].forEach((id) => visitar(id, []));
  return ciclos;
}

const cicloPermitido = (ciclo) => CICLOS_PERMITIDOS.some((c) => {
  const ids = new Set(lista(c.ids));
  return ciclo.every((x) => ids.has(x));
});

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LA VALIDACIÓN (apartados 1-24, 27, 28, 31 y 32)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `{ errors, warnings, valid }` (apartado 28), más `total` y `porRegla`.
 *
 * Recibe el catálogo **en bruto** —por defecto `CATALOGO_BRUTO`— y, si se le
 * da, `existeRecurso(ruta)` para comprobar que una ruta propia existe de verdad
 * (el build se lo pasa leyendo `public/`; el navegador no puede).
 */
export function validateExerciseCatalog(bruto = CATALOGO_BRUTO, { existeRecurso = null } = {}) {
  const entradas = lista(bruto).filter((e) => e && typeof e === 'object');
  const problemas = [];
  const add = (...a) => problemas.push(problema(...a));
  const noEsObjeto = lista(bruto).length - entradas.length;
  if (noEsObjeto > 0) add('id_invalido', null, `${noEsObjeto} entrada(s) del catálogo no son un ejercicio`);

  /* ── 3.1 · Lo que ya miraba la F2 ─────────────────────────────────────── */
  const aud = auditarCatalogo(entradas.map(proyeccionParaAuditar));
  [...new Set(aud.repetidos)].filter(Boolean).forEach((id) => add('id_duplicado', id, `El id «${id}» está repetido`));
  aud.sumaMal.forEach(({ id, suma }) => {
    /* Sin músculos ya es su propio error: decir además que suman 0 sería
       contarlo dos veces. */
    const e = entradas.find((x) => texto(x.id) === id);
    if (e && lista(e.musculos).length) add('porcentajes_no_suman', id, `Los porcentajes de «${id}» suman ${suma}, no 100`, { suma });
  });
  aud.colgados.forEach(({ id, campo, ref }) => add('referencia_inexistente', id, `«${id}» apunta en ${campo} a «${ref}», que no existe`, { campo, ref }));
  aud.sinEntorno.forEach((id) => add('entorno_invalido', id, `«${id}» no dice dónde se hace`));
  aud.sinMusculos.forEach((id) => add('sin_musculos', id, `«${id}» no trabaja ningún músculo`));
  aud.sinPrincipal
    .filter((id) => lista(entradas.find((x) => texto(x.id) === id)?.musculos).length)
    .forEach((id) => add('sin_principal', id, `«${id}» no tiene músculo principal`));
  aud.conEnlace.forEach((id) => add('enlace_externo', id, `«${id}» lleva un enlace de fuera`));
  aud.subgruposHuerfanos.forEach((s) => add('subgrupo_sin_ejercicios', s, `Ningún ejercicio trabaja «${s}»`));

  /* ── 3.2 · Lo nuevo, ejercicio a ejercicio ─────────────────────────────── */
  const ids = new Set(entradas.map((e) => texto(e.id)).filter(Boolean));
  const porId = new Map(entradas.map((e) => [texto(e.id), e]));
  for (const e of entradas) {
    const id = texto(e.id);
    if (!id) { add('id_invalido', null, `Un ejercicio sin id («${texto(e.nombre) || 'sin nombre'}»)`); continue; }
    if (!ESTABLE.test(id)) add('id_invalido', id, `«${id}» no es una ranura estable (minúsculas, números y guiones)`);

    const nombre = texto(e.nombre);
    if (!nombre || !/[a-záéíóúüñ]{2}/i.test(nombre)) add('nombre_vacio', id, `«${id}» no tiene un nombre legible`);

    lista(e.musculos).forEach((m) => {
      const s = subgrupoMuscular(texto(m?.subgrupoId));
      if (!s) add('subgrupo_inexistente', id, `«${id}» trabaja «${texto(m?.subgrupoId) || '(vacío)'}», que no existe`);
      /* Apartado 6: si la línea declara su grupo, tiene que ser el del
         subgrupo. El catálogo de JosStyle no lo declara —se deriva, y así no
         puede desviarse—, pero un ejercicio que lo traiga se comprueba. */
      const grupo = texto(m?.grupoId) || texto(m?.grupo);
      if (s && grupo && grupo !== s.grupoId) add('subgrupo_de_otro_grupo', id, `«${id}»: ${s.id} es de ${s.grupoId}, no de ${grupo}`);
      if (!esNumero(m?.porcentaje) || m.porcentaje <= 0 || m.porcentaje > 100) {
        add('porcentaje_imposible', id, `«${id}»: el porcentaje de ${texto(m?.subgrupoId) || '?'} es ${JSON.stringify(m?.porcentaje)}`);
      }
      if (!PAPELES.some((p) => p.id === m?.papel)) add('papel_invalido', id, `«${id}»: el papel «${m?.papel}» no existe`);
    });

    lista(e.entornos).filter((x) => !conocido(ENTORNOS, x))
      .forEach((x) => add('entorno_invalido', id, `«${id}»: el entorno «${x}» no existe (son ${ENTORNOS.map((z) => z.id).join(', ')})`));
    lista(e.equipamiento).filter((x) => !conocido(EQUIPAMIENTO, x))
      .forEach((x) => add('equipo_invalido', id, `«${id}»: el material «${x}» no existe`));
    if (!conocido(DIFICULTADES, e.dificultad)) add('dificultad_invalida', id, `«${id}»: la dificultad «${e.dificultad}» no existe`);
    if (!lista(e.tipos).length) add('tipo_invalido', id, `«${id}» no tiene ningún tipo`);
    lista(e.tipos).filter((x) => !conocido(TIPOS_EJERCICIO, x))
      .forEach((x) => add('tipo_invalido', id, `«${id}»: el tipo «${x}» no existe`));
    if (e.agarre !== null && e.agarre !== undefined && !conocido(AGARRES, e.agarre)) add('agarre_invalido', id, `«${id}»: el agarre «${e.agarre}» no existe`);
    if (!conocido(PATRONES_MOVIMIENTO, e.patron)) add('patron_invalido', id, `«${id}»: el patrón «${e.patron ?? '(ninguno)'}» no existe`);

    const medidas = lista(e.medidas);
    if (!medidas.length) add('medida_invalida', id, `«${id}» no dice cómo se mide`);
    medidas.filter((x) => !conocido(MEDIDAS, x)).forEach((x) => add('medida_invalida', id, `«${id}»: la medida «${x}» no existe`));
    const tipos = lista(e.tipos);
    /* Apartados 19-21: un isométrico tiene que poder medirse en segundos, y
       un peso sin repeticiones no es una serie. */
    if (tipos.includes('isometrico') && !medidas.includes('tiempo')) {
      add('configuracion_incompatible', id, `«${id}» es isométrico y no se puede medir en segundos`);
    }
    if (medidas.includes('peso') && !medidas.includes('reps')) {
      add('configuracion_incompatible', id, `«${id}» se mide con peso pero sin repeticiones`);
    }
    if ((e.explosivo === true) !== tipos.includes('explosivo')) {
      add('explosivo_incoherente', id, `«${id}»: explosivo = ${e.explosivo === true} y el tipo dice lo contrario`);
    }

    /* Apartados 12, 13 y 15: a sí mismo, nunca. */
    if (texto(e.base) === id) add('referencia_a_si_mismo', id, `«${id}» es su propia base`);
    ['variantes', 'progresiones', 'sustitutos'].forEach((campo) => {
      if (lista(e[campo]).map(texto).includes(id)) add('referencia_a_si_mismo', id, `«${id}» se tiene a sí mismo en ${campo}`);
    });
    /* Una variante declarada tiene que ser de la familia: hija, madre o
       hermana. Que la base no declare a todas sus hijas NO es un fallo: la
       familia se deriva de las dos direcciones (FIT F29). */
    lista(e.variantes).map(texto).filter((v) => v !== id && porId.has(v)).forEach((v) => {
      const x = porId.get(v);
      const familia = texto(x.base) === id || texto(e.base) === v || (texto(e.base) && texto(e.base) === texto(x.base));
      if (!familia) add('variante_incoherente', id, `«${id}» declara a «${v}» como variante y no son de la misma familia`);
    });
    ['variantes', 'progresiones', 'sustitutos'].forEach((campo) => {
      lista(e[campo]).map(texto).filter((r) => porId.get(r)?.archivado === true && e.archivado !== true)
        .forEach((r) => add('referencia_archivada', id, `«${id}» propone en ${campo} a «${r}», que está archivado`));
    });

    /* Apartados 17 y 18: recursos. Un enlace de fuera ya lo caza la F2. */
    recursosDe(e).forEach(({ campo, valor, extensiones }) => {
      if (typeof valor === 'string' && /^https?:\/\//i.test(valor.trim())) return;
      if (!recursoBienFormado(valor, extensiones)) {
        add('recurso_mal_formado', id, `«${id}»: ${campo} = ${JSON.stringify(valor)} no es una ruta propia válida`, { campo });
      } else if (typeof existeRecurso === 'function' && !existeRecurso(valor.trim())) {
        add('recurso_no_encontrado', id, `«${id}»: ${campo} apunta a ${valor.trim()}, que no existe`, { campo });
      }
    });
    const recursos = recursosDe(e).map((r) => r.campo);
    if (!recursos.some((c) => c.startsWith('recursos.'))) add('sin_imagen', id, `«${id}» no tiene imagen`);
    if (!recursos.some((c) => c.startsWith('tutorial.'))) add('sin_tutorial', id, `«${id}» no tiene vídeo ni animación`);

    /* Apartado 32: contenido. */
    const desc = texto(e.descripcion);
    if (desc && desc.length < MIN_DESCRIPCION) add('descripcion_corta', id, `«${id}»: la descripción tiene ${desc.length} caracteres`);
    const ins = e.instrucciones && typeof e.instrucciones === 'object' ? e.instrucciones : {};
    const falta = [
      !desc ? 'descripción' : '',
      !(texto(ins.preparacion) || texto(ins.ejecucion)) ? 'instrucciones' : '',
      !lista(ins.errores).length ? 'errores frecuentes' : '',
      !lista(ins.consejos).length ? 'consejos' : '',
    ].filter(Boolean);
    if (falta.length) add('contenido_incompleto', id, `«${id}»: contenido incompleto — falta ${falta.join(', ')}`, { falta });
  }

  /* ── 3.3 · Lo que solo se ve mirando el catálogo entero ─────────────────── */
  const aristas = (campo) => new Map(entradas.filter((e) => texto(e.id))
    .map((e) => [texto(e.id), lista(campo === 'base' ? [e.base] : e[campo]).map(texto).filter((r) => r && r !== texto(e.id) && ids.has(r))]));
  ciclosDe(aristas('base')).forEach((c) => add('ciclo_variantes', c[0], `Las bases forman un ciclo: ${[...c, c[0]].join(' → ')}`, { ciclo: c }));
  ciclosDe(aristas('progresiones')).filter((c) => !cicloPermitido(c))
    .forEach((c) => add('ciclo_progresion', c[0], `Las progresiones forman un ciclo: ${[...c, c[0]].join(' → ')}`, { ciclo: c }));

  /* Apartado 29: una habilidad sin progresión y a la que nadie lleva. */
  const destinos = new Set(entradas.flatMap((e) => lista(e.progresiones).map(texto)));
  entradas.filter((e) => lista(e.tipos).includes('habilidad') && !lista(e.progresiones).length && !destinos.has(texto(e.id)))
    .forEach((e) => add('skill_sin_progresion', texto(e.id), `«${texto(e.id)}» es una habilidad sin progresión`));

  /* Apartado 16: posibles duplicados. Se avisa, NUNCA se elimina. */
  const activos = entradas.filter((e) => texto(e.id) && e.archivado !== true)
    .map((e) => ({ e, palabras: palabrasDe(e), principal: principalDe(e) }));
  for (let i = 0; i < activos.length; i += 1) {
    for (let j = i + 1; j < activos.length; j += 1) {
      const { e: a, palabras: pa, principal: ma } = activos[i];
      const { e: b, palabras: pb, principal: mb } = activos[j];
      if (!pa.size || !pb.size || ma !== mb || relacionados(a, b)) continue;
      const contenido = [...pa].every((t) => pb.has(t)) || [...pb].every((t) => pa.has(t));
      if (contenido) {
        add('posible_duplicado', texto(a.id), `«${texto(a.id)}» y «${texto(b.id)}» parecen el mismo ejercicio`, { otro: texto(b.id) });
      }
    }
  }

  /* Apartado 31: cobertura por grupo, contando por el músculo PRINCIPAL. */
  const cobertura = coberturaPorGrupo(entradas);
  cobertura.filter((c) => c.ejercicios < UMBRAL_COBERTURA)
    .forEach((c) => add('cobertura_baja', c.grupoId, `${c.nombre}: ${c.ejercicios} ejercicio${c.ejercicios === 1 ? '' : 's'}`, { ejercicios: c.ejercicios }));

  const errors = problemas.filter((p) => p.gravedad === 'error');
  const warnings = problemas.filter((p) => p.gravedad === 'aviso');
  const porRegla = Object.fromEntries(REGLAS_CATALOGO.map((r) => [r.id, problemas.filter((p) => p.regla === r.id).length]));
  return { errors, warnings, valid: errors.length === 0, total: entradas.length, porRegla };
}

/** Cuántos ejercicios tienen cada grupo como músculo PRINCIPAL. */
export function coberturaPorGrupo(bruto = CATALOGO_BRUTO) {
  const cuenta = Object.fromEntries(GRUPOS_MUSCULARES.map((g) => [g.id, 0]));
  lista(bruto).forEach((e) => {
    const g = subgrupoMuscular(principalDe(e || {}))?.grupoId;
    if (g && g in cuenta) cuenta[g] += 1;
  });
  return GRUPOS_MUSCULARES.map((g) => ({ grupoId: g.id, nombre: g.nombre, ejercicios: cuenta[g.id] }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · EL DIAGNÓSTICO (apartados 29, 30 y 31)
   ═══════════════════════════════════════════════════════════════════════════

   Lo que enseña la herramienta de desarrollo. Todo sale de la validación y del
   catálogo normalizado —el que usa la aplicación—, sin una cifra guardada. */

export function diagnosticoCatalogo(bruto = CATALOGO_BRUTO, opciones = {}) {
  const v = validateExerciseCatalog(bruto, opciones);
  const ejercicios = lista(bruto).filter((e) => e && typeof e === 'object').map((e) => crearEjercicioCompleto(e));
  const contar = (catalogo, campo) => catalogo.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    ejercicios: ejercicios.filter((e) => (Array.isArray(e[campo]) ? e[campo].includes(c.id) : e[campo] === c.id)).length,
  }));
  const idsCon = (regla) => [...new Set([...v.errors, ...v.warnings].filter((p) => p.regla === regla).map((p) => p.id))];
  return {
    total: v.total,
    valido: v.valid,
    errores: v.errors,
    avisos: v.warnings,
    porRegla: v.porRegla,
    porEntorno: contar(ENTORNOS, 'entornos'),
    porDificultad: contar(DIFICULTADES, 'dificultad'),
    porTipo: contar(TIPOS_EJERCICIO, 'tipos'),
    porGrupo: coberturaPorGrupo(bruto),
    categorias: [...new Set(ejercicios.map((e) => e.categoria).filter(Boolean))],
    sinImagen: idsCon('sin_imagen'),
    sinTutorial: idsCon('sin_tutorial'),
    sinProgresion: idsCon('skill_sin_progresion'),
    contenidoIncompleto: idsCon('contenido_incompleto'),
  };
}

/** «1 error», «3 errores»: lo leen la consola y el build. */
export const cuantos = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/** Una línea por regla con problemas, para la consola y el build. */
export function resumenDeValidacion(v) {
  const lineas = REGLAS_CATALOGO
    .filter((r) => (v.porRegla?.[r.id] || 0) > 0)
    .map((r) => `${r.gravedad === 'error' ? '✗' : '·'} ${r.que}: ${v.porRegla[r.id]}`);
  return [`Catálogo de ejercicios: ${v.total} · ${cuantos(v.errors.length, 'error', 'errores')} · ${cuantos(v.warnings.length, 'aviso', 'avisos')}`, ...lineas].join('\n');
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · AL ARRANCAR EN DESARROLLO (apartado 25)
   ═══════════════════════════════════════════════════════════════════════════

   `main.jsx` la llama solo con `import.meta.env.DEV`. ⚠️ Esta librería **no lee
   `import.meta.env`** a propósito: la importa también `vite.config.js` para el
   build, y allí no existe. Los errores salen con `console.error` —*"Errores
   críticos sí deben ser visibles"*— y los avisos se resumen en una línea, que
   trescientos avisos seguidos enseñan a no mirar la consola. */
export function avisarEnDesarrollo(consola = console) {
  const v = validateExerciseCatalog();
  if (v.errors.length) {
    consola.error(`[JosStyle] El catálogo de ejercicios tiene ${cuantos(v.errors.length, 'error', 'errores')}:\n${v.errors.map((e) => `  ✗ ${e.mensaje}`).join('\n')}`);
  }
  if (v.warnings.length) consola.warn(`[JosStyle] ${resumenDeValidacion(v)}`);
  return v;
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LO QUE YA ESTABA, LO QUE NO SE CONSTRUYE Y LO DECIDIDO
   ═══════════════════════════════════════════════════════════════════════════ */

export const YA_LO_RESUELVE = [
  { que: 'Ids repetidos, porcentajes, referencias colgadas, entornos, músculos, principal y enlaces', es: auditarCatalogo },
  { que: 'Las constantes centrales del apartado 34', es: 'ENTORNOS, EQUIPAMIENTO, DIFICULTADES, TIPOS_EJERCICIO, PAPELES y MEDIDAS (ejercicios.js) y GRUPOS_MUSCULARES (fitness.js)' },
  { que: 'Que un recurso roto no rompa la ficha (apartados 17 y 18)', es: 'ExerciseVisual y ExerciseTutorial (F34), con su onError' },
  { que: 'Que el peso corporal no cuente como volumen (apartado 23)', es: 'resumenDeSesion (F8): el volumen sale solo de series con peso y repeticiones' },
  { que: 'Que el histórico siga siendo interpretable (apartado 24)', es: 'El snapshot de la sesión (F7) y «Ejercicio archivado» (F29, C-36)' },
];

export const NO_EN_FIT35 = [
  { que: 'CMS, panel de administración real, backend nuevo, base de datos externa', porque: 'Apartado 40: una capa ligera de calidad.' },
  { que: 'IA o scraping para rellenar el catálogo', porque: 'Apartado 40, y la regla 8: nada de contenido inventado.' },
  { que: 'Migrar el proyecto a TypeScript', porque: 'Apartado 35 contra el 40: el proyecto es JavaScript; los tipos van en JSDoc (`ejercicios.js`) sin cambiar la cadena de compilación.' },
  { que: 'Corregir el catálogo automáticamente', porque: 'Apartados 2, 5 y 16: se informa, no se modifica.' },
  { que: 'Enseñar el diagnóstico a Josué', porque: 'Apartados 28 y 29: solo en desarrollo.' },
];

export const DECISIONES_FIT35 = [
  {
    que: 'Se valida el catálogo en bruto',
    porque: '`crearEjercicioCompleto` corrige en silencio (una dificultad desconocida pasa a «principiante»); validando lo normalizado no se vería nada.',
  },
  {
    que: 'Sin imagen y sin tutorial son avisos de cada ejercicio',
    porque: 'El apartado 27 los pone como aviso, y el diagnóstico los cuenta: hoy son los cien, y es verdad.',
  },
  {
    que: 'Dos ejercicios relacionados en el catálogo no son un posible duplicado',
    porque: 'La relación declarada (base, variante, progresión, sustituto) es la marca de que la diferencia es intencionada (apartado 16).',
  },
  {
    que: 'El build para con errores y nunca con avisos',
    porque: 'Apartados 25-27: un aviso no puede parar un despliegue de Vercel.',
  },
  {
    que: 'Un ejercicio archivado se marca con `archivado: true` y sigue en el catálogo',
    porque: 'Apartado 37: permanece en el histórico con su nombre, pero no sale en búsquedas ni se propone. Hasta ahora «archivado» era «ya no está» (C-36), y eso sigue valiendo.',
  },
];
