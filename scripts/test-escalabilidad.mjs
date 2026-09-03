// ============================================================================
// EH · Fase 55/65 — Escalabilidad y futuras funciones
//
// *"Añadir funciones sin tener que reconstruir lo que ya funciona."*
//
// Lo que vigila esta prueba:
//   · que los siete puntos de extensión sean de verdad una línea, no un `case`
//   · que el crecimiento sea LINEAL: es lo que de verdad importa a los 30
//   · que el backlog salga de lo que otras fases pospusieron, no de una lista nueva
//   · y que crecer tenga freno: las tres preguntas, con veredicto
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { MODULOS_EH as MODULOS_FUENTE, IDS_EH as IDS_FUENTE, CATEGORIAS_EH as CATS } from '../src/lib/estiloDeHombre.js';
import { SE_POSPONE as SE_POSPONE_F48 } from '../src/lib/auditoriaFinal.js';
import { LO_QUE_FALTA as FALTA_F54 } from '../src/lib/recuperacion.js';
import { CATALOGO_PAPELERA as PAPELERA } from '../src/lib/papelera.js';
import { MIGRACIONES as MIGRACIONES_F46 } from '../src/lib/migracion.js';
import {
  PUNTOS_DE_EXTENSION, puntoDeExtension, LO_QUE_DEBE_PODER_UNA_PLAQUITA,
  NO_SE_CONSTRUYE, FUTURAS_QUE_CABEN, REGLA_CAMPO_NUEVO,
  PREGUNTAS_ANTES_DE_ANADIR, VEREDICTOS, veredicto, evaluarFuncion,
  PRIORIDADES, prioridad, ESTADOS_BACKLOG, CAMPOS_BACKLOG, backlog, backlogPorPrioridad, loQueEsperaAJosue,
  PASOS_DE_CRECIMIENTO, HASTA_DONDE_SE_MIDE, MAXIMO_POR_SECCION, ensayoDeCrecimiento, creceEnLineaRecta,
  CARGA_PEREZOSA, COMPATIBILIDAD,
  APARTADOS_ESCALABILIDAD, apartadoEscalabilidad, TEXTOS_ESCALABILIDAD,
  auditarEscalabilidad, panelEscalabilidad, SE_POSPONE, LO_QUE_FALTA, MIGRACIONES,
} from '../src/lib/escalabilidad.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const lee = (f) => readFileSync(join(RAIZ, f), 'utf8');
const VISTA = lee('src/views/EstiloHombreView.jsx');
const EH = lee('src/lib/estiloDeHombre.js');

console.log('\n📈 EH · Fase 55/65 — Escalabilidad y futuras funciones\n');

/* ---------------------------------------------------------------------------
   1 · LOS SIETE SITIOS DONDE SE ESCRIBE UNA LÍNEA
   --------------------------------------------------------------------------- */
{
  console.log('1 · Los puntos de extensión');
  eq(PUNTOS_DE_EXTENSION.length, 7, 'los siete sitios');
  const a = auditarEscalabilidad({ vista: VISTA });
  eq(a.sinLinea, [], '⚠️ y cada uno enseña LA LÍNEA que hay que escribir');
  eq(a.sinNoTocar, [], '⚠️ y lo que NO hay que tocar');
  eq(a.conCaseDeModulo, [],
    '🚨 ⚠️ y ni un `case` por módulo en la vista: si lo hubiera, el punto de extensión sería mentira');

  /* La comprobación de la comprobación. */
  eq(auditarEscalabilidad({ vista: "case 'perfumes': return <X/>;" }).conCaseDeModulo, ['perfumes'],
    '⚠️ el detector caza el caso: un `case` por módulo salta');

  eq(puntoDeExtension('modulo').yaFunciona, LO_QUE_DEBE_PODER_UNA_PLAQUITA,
    '🚨 apartado 2 — con esa línea, la plaquita YA se registra, activa, oculta, reordena y configura');
  eq(LO_QUE_DEBE_PODER_UNA_PLAQUITA.length, 5, 'las cinco cosas que el enunciado enumera');
  ok(/MODULOS_EH/.test(puntoDeExtension('modulo').donde), 'un módulo es una línea de `MODULOS_EH`');
  ok(/irreversible|vuelta atrás/.test(puntoDeExtension('coleccion_papelera').noTocar),
    '🚨 y el de la papelera avisa: SIN esa línea el borrado no tiene vuelta atrás');
  ok(!puntoDeExtension('inventado'), 'se buscan por id');

  /* Los contadores salen del código, no de un número escrito. */
  eq(puntoDeExtension('modulo').cuantosHay(), MODULOS_FUENTE.length, 'y los contadores se leen del catálogo');
  eq(puntoDeExtension('categoria').cuantosHay(), CATS.length, 'igual las categorías');
  eq(puntoDeExtension('coleccion_papelera').cuantosHay(), Object.keys(PAPELERA).length, 'y la papelera');
  eq(puntoDeExtension('migracion').cuantosHay(), MIGRACIONES_F46.length, 'y las migraciones');
}

/* ---------------------------------------------------------------------------
   2 · LO QUE NO SE CONSTRUYE (apartados 3 y 4)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Modular, pero simple');
  eq(NO_SE_CONSTRUYE.map((x) => x.id), ['plugins', 'registro_dinamico', 'funciones_futuras'],
    'las tres cosas que NO se construyen');
  ok(NO_SE_CONSTRUYE.every((x) => !!x.porque), 'cada una con su motivo');
  ok(/listas de datos|array/.test(NO_SE_CONSTRUYE[0].porque),
    '⚠️ y en vez de plugins, lo que hay son listas de datos');
  ok(/no implementarlas todavía/.test(NO_SE_CONSTRUYE[2].porque),
    '⚠️ apartado 3 — con la última línea del enunciado: caben, pero no se escriben');

  eq(FUTURAS_QUE_CABEN.length, 6, 'los seis tipos de función futura que nombra el apartado 3');
  ok(FUTURAS_QUE_CABEN.every((f) => !!puntoDeExtension(f.entra)),
    '🚨 y cada uno entra por un punto de extensión que EXISTE');
  ok(/un array, no un contrato/.test(TEXTOS_ESCALABILIDAD.simple), 'con la frase que lo resume');
}

/* ---------------------------------------------------------------------------
   3 · DATOS EXTENSIBLES, Y LA TRAMPA (apartado 5)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Un campo nuevo');
  ok(/objeto libre/.test(REGLA_CAMPO_NUEVO.cabe), 'un campo nuevo cabe: `config` es libre');
  ok(/desaparece en el siguiente guardado/.test(REGLA_CAMPO_NUEVO.pero),
    '🚨 ⚠️ pero SIN su normalizador desaparece, y el usuario no ve un error');
  ok(/cinco veces/.test(REGLA_CAMPO_NUEVO.pero), 'y se dice cuántas veces ha pasado ya');
  ok(/LO_QUE_SE_PERSONALIZA/.test(REGLA_CAMPO_NUEVO.como), 'con qué hay que hacer, en dos sitios');
  ok(/probarPersistencia/.test(REGLA_CAMPO_NUEVO.loCaza), 'y quién lo caza si se olvida (F51)');
  ok(/normalizarEstiloHombre/.test(EH), 'el normalizador existe donde se dice');
}

/* ---------------------------------------------------------------------------
   4 · LAS TRES PREGUNTAS (apartado 14)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · El freno: las tres preguntas');
  eq(PREGUNTAS_ANTES_DE_ANADIR.map((p) => p.id), ['aporta', 'duplica', 'complica'], 'las tres, en su orden');
  eq(evaluarFuncion({}).veredicto, 'adelante', 'algo que aporta, no duplica y no complica: adelante');
  eq(evaluarFuncion({ aporta: false }).veredicto, 'no_anadir', '⚠️ si no aporta valor, no se añade');
  eq(evaluarFuncion({ duplica: true }).veredicto, 'integrar',
    '⚠️ y si duplica, la respuesta NO es "no": es integrar');
  eq(evaluarFuncion({ complica: true }).veredicto, 'replantear',
    '⚠️ y si complica la interfaz, se replantea: la idea servía');
  /* ⚠️ El orden importa: no aportar gana a todo lo demás. */
  eq(evaluarFuncion({ aporta: false, duplica: true, complica: true }).veredicto, 'no_anadir',
    '⚠️ y "no aporta" se contesta antes que nada: ni merece la conversación');
  eq(VEREDICTOS.map((v) => v.id), ['adelante', 'no_anadir', 'integrar', 'replantear'], 'los cuatro veredictos');
  ok(VEREDICTOS.every((v) => !!v.icono && !!v.que), 'cada uno con icono y qué significa');
  ok(!!veredicto('integrar') && !veredicto('inventado'), 'se buscan por id');
  ok(evaluarFuncion({ duplica: true }).porque.includes('amplía'), 'y el motivo lo explica');
}

/* ---------------------------------------------------------------------------
   5 · EL BACKLOG, DERIVADO (apartados 15 y 16)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · El backlog');
  const lista = backlog();
  ok(lista.length >= 10, `${lista.length} entradas`);
  eq(auditarEscalabilidad().backlogIncompleto, [],
    '🚨 ⚠️ apartado 15 — cada entrada con sus CINCO campos: idea, prioridad, motivo, dependencias y estado');
  eq(CAMPOS_BACKLOG, ['idea', 'prioridad', 'motivo', 'dependencias', 'estado'], 'los cinco que pide');
  eq(auditarEscalabilidad().sinPrioridad, [], 'y ninguna sin prioridad');

  /* 🚨 Decisión 3 — sale de otras fases, no de una lista nueva. */
  ok(SE_POSPONE === SE_POSPONE_F48, 'el `SE_POSPONE` es el de la F48, importado');
  ok(LO_QUE_FALTA === FALTA_F54, 'y lo que falta es lo de la F54');
  SE_POSPONE_F48.forEach((s) => {
    ok(lista.some((b) => b.id === s.id), `🚨 lo que la F48 pospuso está en el backlog: ${s.id}`);
  });
  FALTA_F54.forEach((f) => {
    ok(lista.some((b) => b.id === f.id), `y lo que a la F54 le faltaba: ${f.id}`);
  });

  /* Lo único imprescindible, y sale de un fallo, no de una idea. */
  eq(backlogPorPrioridad('imprescindible').map((b) => b.id), ['aviso_guardado'],
    '🚨 ⚠️ una sola cosa es IMPRESCINDIBLE, y es la mitad que le falta al fallo de la F52');
  ok(/nadie lo mira/.test(backlogPorPrioridad('imprescindible')[0].motivo),
    'con el motivo: `saveData` ya devuelve el error, pero nadie lo mira');
  eq(lista[0].prioridad, 'imprescindible', '⚠️ y va primero: apartado 16, no empezar por lo menos importante');

  eq(PRIORIDADES.map((p) => p.icono), ['🔴', '🟠', '🟡', '🟢'], 'las cuatro prioridades del enunciado');
  ok(lista.every((b) => ESTADOS_BACKLOG.includes(b.estado)), 'y cada entrada con un estado de la lista');
  ok(lista.some((b) => b.estado === 'bloqueado'),
    '⚠️ y las que dependen de la decisión de esquema salen BLOQUEADAS, no pendientes');
  ok(lista.filter((b) => b.estado === 'bloqueado').every((b) => b.dependencias.includes('decision_esquema')),
    'diciendo de qué dependen');
  ok(!prioridad('inventada'), 'las prioridades se buscan por id');

  eq(loQueEsperaAJosue().length, 8, 'y ocho cosas esperan a Josué, no a un programador');
  ok(loQueEsperaAJosue().every((x) => !!x.de), 'cada una diciendo de qué fase viene');
}

/* ---------------------------------------------------------------------------
   6 · LA PRUEBA DE CRECIMIENTO (apartado 17)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Crecer: 5 → 10 → 17');
  const pasos = ensayoDeCrecimiento();
  eq(pasos.map((p) => p.modulos), PASOS_DE_CRECIMIENTO, 'se mide en tres tamaños, con datos de verdad');
  eq(PASOS_DE_CRECIMIENTO[PASOS_DE_CRECIMIENTO.length - 1], IDS_FUENTE.length,
    'hasta donde llega el catálogo de verdad');
  eq(HASTA_DONDE_SE_MIDE.pedido, 30, '⚠️ el enunciado pide 30…');
  eq(HASTA_DONDE_SE_MIDE.medido, IDS_FUENTE.length, `…y se mide hasta ${IDS_FUENTE.length}`);
  ok(/número bonito sobre datos falsos/.test(HASTA_DONDE_SE_MIDE.porque),
    '🚨 ⚠️ y se dice por qué NO se inventan trece módulos para poder decir "probado con 30"');

  const r = creceEnLineaRecta(pasos);
  eq(r.lineal, true,
    '🚨 lo que de verdad importa a los 30: el trabajo crece en LÍNEA RECTA, no al cuadrado');
  ok(r.trabajoPorModulo.every((x) => x === 1),
    '⚠️ una plaquita por módulo en los tres tamaños: nada se recorre dos veces');
  eq(r.seccionesManejables, true,
    `⚠️ y ninguna sección pasa de ${MAXIMO_POR_SECCION} plaquitas: siguen siendo manejables`);
  eq(r.organizados, true, 'y los datos siguen organizados: ni una plaquita huérfana');
  ok(pasos.every((p) => p.secciones > 0), 'con sus secciones en los tres tamaños');
  ok(pasos[2].secciones > pasos[0].secciones,
    '⚠️ y al crecer se reparten en MÁS secciones, no en una lista más larga');
  ok(pasos.every((p) => p.msPortada < 500), 'y la portada se pinta rápido en los tres');
}

/* ---------------------------------------------------------------------------
   7 · CARGAR SOLO LO QUE HACE FALTA, Y COMPATIBILIDAD (13, 11 y 12)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Carga perezosa, compatibilidad y versionado');
  eq(CARGA_PEREZOSA.length, 4, 'las cuatro cosas que no se cargan de golpe');
  ok(CARGA_PEREZOSA.every((c) => !!c.deLaFase), '⚠️ y cada una viene de una fase que ya la construyó');
  ok(/al tocarlo/.test(CARGA_PEREZOSA.find((c) => c.id === 'panel').carga),
    'un apartado se carga al tocarlo, nunca antes');

  ok(/aparta lo que no conozca/.test(COMPATIBILIDAD.datosAntiguos),
    'apartado 11 — los datos antiguos no revientan: se rellenan y se apartan');
  ok(/no toca `config`/.test(COMPATIBILIDAD.configuracionAntigua), 'y la configuración antigua se conserva');
  ok(/ids, no copias/.test(COMPATIBILIDAD.integraciones),
    '⚠️ y las integraciones aguantan porque aquí se guardan ids, no copias');
  eq(COMPATIBILIDAD.migraciones, MIGRACIONES.length, 'apartado 12 — con las migraciones de la F46');
  ok(COMPATIBILIDAD.version >= 2, `y la versión de esquema actual (v${COMPATIBILIDAD.version})`);
}

/* ---------------------------------------------------------------------------
   8 · LOS APARTADOS Y EL VEREDICTO
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Los diecisiete apartados');
  eq(APARTADOS_ESCALABILIDAD.length, 17, 'los diecisiete');
  eq(APARTADOS_ESCALABILIDAD.map((a) => a.id), Array.from({ length: 17 }, (_, i) => i + 1), 'en su orden');
  ok(APARTADOS_ESCALABILIDAD.every((a) => a.cumplido && !!a.donde),
    '⚠️ todos cumplidos, y cada uno diciendo dónde');
  ok(/F56/.test(apartadoEscalabilidad(9).donde),
    '⚠️ apartado 9 — la IA: la regla "sugerir → usuario decide" ya está; la F56 la desarrolla');
  ok(!apartadoEscalabilidad(99), 'se buscan por id');

  const panel = panelEscalabilidad({ vista: VISTA });
  eq(panel.puedeCrecer, true, '🎯 se puede crecer sin reconstruir lo que ya funciona');
  ok(/sin límite/.test(panel.condicion), 'y crecer tiene freno: la condición de finalización');
  ok(/reconstruir/.test(TEXTOS_ESCALABILIDAD.regla), 'con la regla de la fase');
  eq(panel.imprescindibles, 1, 'con una sola cosa imprescindible en el backlog');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
