// ============================================================================
// EH · Fase 53/65 — Documentación técnica y mantenimiento
//
// *"Si dentro de meses queremos modificar Estilo de hombre, Claude debe poder
// entender rápidamente cómo funciona sin rehacer todo el análisis."*
//
// Lo que vigila esta prueba:
//   · que el documento esté AL DÍA con el código, y no sea una foto de un día
//   · que las doce dependencias globales estén, incluidas las dos que NO se usan
//   · que ningún componente reutilizable nombre algo que no existe
//   · y que no se haya colado un secreto en la documentación
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { MODULOS_EH as MODULOS_FUENTE, FUENTES_GLOBALES as FUENTES } from '../src/lib/estiloDeHombre.js';
import { SE_POSPONE as SE_POSPONE_F48, RESPUESTA_FINAL } from '../src/lib/auditoriaFinal.js';
import { MIGRACIONES as MIGRACIONES_F46 } from '../src/lib/migracion.js';
import { CATALOGO_PAPELERA as PAPELERA } from '../src/lib/papelera.js';
import {
  QUE_HACE, QUE_NO_HACE, LA_REGLA, COMO_ESTA_ORGANIZADO,
  mapaDeModulos, PANTALLAS_TRANSVERSALES,
  DEPENDENCIAS_GLOBALES, dependenciaGlobal, dependenciasQueNoSeUsan,
  fuenteDeCadaDato, REGLA_DE_FUENTE,
  ESTADOS_DOC, estadoDoc,
  CICLO_DE_ELIMINACION, AVISO_ELIMINACION, coleccionesConPapelera, coleccionesTotalesEnLaPapelera,
  ESTRUCTURA, registroDeMigraciones,
  COMPONENTES_REUTILIZABLES, componenteReutilizable,
  REGLAS_DE_DISENO, REGLAS_UX, NOTIFICACIONES_DOC, PRIVACIDAD_DOC, SUITE_DE_PRUEBAS,
  HISTORIAL, IDEAS_FUTURAS, REGLA_PARA_CLAUDE,
  MANTENIMIENTO, preguntaDeMantenimiento,
  SECCIONES_DOC, seccionDoc, DOCUMENTO, TEXTOS_DOC,
  auditarDocumentacion, panelDocumentacion, SE_POSPONE, MIGRACIONES,
} from '../src/lib/documentacionEH.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const lee = (f) => readFileSync(join(RAIZ, f), 'utf8');
const DOC = lee(DOCUMENTO);
const UI = lee('src/components/ui.jsx');
const VISTA = lee('src/views/EstiloHombreView.jsx');
const VERIFICAR = lee('scripts/verificar.sh');

console.log('\n📘 EH · Fase 53/65 — Documentación técnica y mantenimiento\n');

/* ---------------------------------------------------------------------------
   1 · EL DOCUMENTO EXISTE Y ESTÁ AL DÍA (decisión 2)
   --------------------------------------------------------------------------- */
{
  console.log('1 · El documento, contra el código');
  ok(DOC.length > 4000, `${DOCUMENTO} existe y tiene contenido (${DOC.length} caracteres)`);
  ok(/ESTILO DE HOMBRE — DOCUMENTACIÓN TÉCNICA/.test(DOC), 'con el título que pide el apartado 1');

  const a = auditarDocumentacion(DOC);
  eq(a.modulosQueFaltan, [], `🚨 ⚠️ los ${MODULOS_FUENTE.length} módulos de \`MODULOS_EH\` están en el documento`);
  eq(a.dependenciasQueFaltan, [], '🚨 y las doce dependencias globales');
  eq(a.estadosQueFaltan, [], 'y los cuatro estados');
  eq(a.reglasQueFaltan, [], 'y las seis reglas de UX, con sus palabras');
  eq(a.componentesQueFaltan, [], 'y los seis componentes reutilizables');
  eq(a.mantenimientoQueFalta, [], 'y las cuatro preguntas de mantenimiento');
  eq(a.sinReglaParaClaude, false, '⚠️ apartado 17 — y la regla para quien venga después');
  eq(a.conSecretos, false, '🚨 apartado 7 — y ni un secreto se ha colado en la documentación');

  /* La comprobación de la comprobación: si el documento se queda corto, salta. */
  const corto = auditarDocumentacion('# Documentación\n\nEsto está vacío.');
  ok(corto.modulosQueFaltan.length === MODULOS_FUENTE.length,
    '⚠️ y con un documento vacío los caza TODOS: el detector no es decorativo');
  ok(auditarDocumentacion('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abc').conSecretos,
    '⚠️ igual que un token pegado por error');

  ok(/se genera desde/.test(DOC), '🚨 y el documento dice de dónde sale, para que nadie lo edite a mano');
  ok(/No lo edites a mano/.test(DOC), 'con esas palabras');
}

/* ---------------------------------------------------------------------------
   2 · QUÉ HACE, QUÉ NO HACE Y CÓMO ESTÁ ORGANIZADO (apartado 1)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Qué hace y qué no hace');
  eq(QUE_HACE, RESPUESTA_FINAL.hace, '⚠️ el "qué hace" es el de la F48, importado: no hay una segunda versión');
  eq(QUE_NO_HACE, RESPUESTA_FINAL.noHace, 'y el "qué no hace", igual');
  eq(LA_REGLA, RESPUESTA_FINAL.regla, 'y la regla de las tres capas');
  ok(/no guarda su peso|No guarda su peso/.test(QUE_NO_HACE),
    '⚠️ con lo que importa: lo que NO guarda, para que nadie lo duplique');
  eq(COMO_ESTA_ORGANIZADO.length, 5, 'las cinco capas');
  ok(COMO_ESTA_ORGANIZADO.every((c) => !!c.donde), 'cada una con el archivo donde vive');
}

/* ---------------------------------------------------------------------------
   3 · EL MAPA (apartado 2) — derivado
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · El mapa de módulos, derivado');
  const mapa = mapaDeModulos();
  const enElMapa = mapa.flatMap((c) => c.modulos.map((m) => m.id));
  eq(enElMapa.sort(), MODULOS_FUENTE.map((m) => m.id).sort(),
    '🚨 ⚠️ el mapa sale de `MODULOS_EH`: ni sobra ni falta ninguno');
  ok(mapa.every((c) => c.modulos.length > 0), 'y no se pinta una categoría vacía');
  ok(mapa.every((c) => !!c.icono && !!c.nombre), 'cada categoría con su icono y su nombre');
  ok(enElMapa.every((id) => new RegExp(`\\b${id}\\b`).test(JSON.stringify(mapa))), 'y cada módulo con su id');
  eq(PANTALLAS_TRANSVERSALES.length, 6, 'y las seis pantallas que no son un módulo');
  ok(PANTALLAS_TRANSVERSALES.every((t) => !!t.fase && !!t.que), 'cada una con su fase y qué es');
}

/* ---------------------------------------------------------------------------
   4 · LAS DEPENDENCIAS (apartado 3) — incluidas las que NO se usan
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Las doce dependencias globales');
  eq(DEPENDENCIAS_GLOBALES.length, 12, 'las doce que el enunciado enumera');
  eq(dependenciasQueNoSeUsan().map((d) => d.id), ['favoritos', 'diario'],
    '⚠️ decisión 3 — DOS no se usan, y están igualmente en la lista');
  ok(dependenciasQueNoSeUsan().every((d) => !!d.porque),
    '🚨 con su motivo: sin él, el siguiente no sabe si es un olvido o una decisión');
  ok(/no hay un sistema global de favoritos/i.test(dependenciaGlobal('favoritos').porque),
    'los favoritos, porque cada módulo tiene los suyos');
  ok(/F47/.test(dependenciaGlobal('diario').porque), 'y el Diario, porque la F47 lo declaró pendiente');
  ok(DEPENDENCIAS_GLOBALES.filter((d) => d.usa).every((d) => !!d.como && !!d.donde),
    '⚠️ y las diez que sí se usan dicen CÓMO y en qué archivo');
  ok(/SOBRESCRIBE/.test(dependenciaGlobal('sincronizacion').como),
    '🚨 con el aviso que más caro sale: `saveData` sobrescribe (regla 5)');
  ok(/NO tiene la suya/.test(dependenciaGlobal('eliminados').como),
    '⚠️ y que la papelera es la global, no una propia');
  ok(!dependenciaGlobal('inventada'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   5 · DÓNDE VIVE CADA DATO (apartado 4) — derivado
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · La fuente de cada dato');
  const fuentes = fuenteDeCadaDato();
  const globales = fuentes.filter((f) => f.vive === 'global');
  eq(globales.length, Object.keys(FUENTES).length,
    '🚨 los datos globales salen de `FUENTES_GLOBALES`, no de una lista a mano');
  ok(fuentes.some((f) => f.dato === 'perfumes' && f.vive === 'estiloHombre'),
    '⚠️ el ejemplo del enunciado: un perfume vive en el módulo Perfumes');
  ok(globales.some((f) => f.dato === 'calendario'),
    'y una fecha, en el Calendario global');
  ok(fuentes.every((f) => !!f.clave), 'cada uno con la clave donde está de verdad');
  ok(/ya existe fuera/.test(REGLA_DE_FUENTE), '⚠️ y la regla que evita el duplicado, escrita');
}

/* ---------------------------------------------------------------------------
   6 · ESTADOS Y ELIMINACIÓN (apartados 5 y 6)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Estados y eliminación');
  eq(ESTADOS_DOC.map((e) => e.icono), ['🟢', '⚪', '⏸️', '🗑️'], 'los cuatro iconos del enunciado');
  eq(ESTADOS_DOC.filter((e) => e.de === 'elemento').map((e) => e.id), ['eliminado'],
    '⚠️ y "eliminado" es de un ELEMENTO, no de un módulo: por eso no está en `ESTADOS_GESTION`');
  ok(/SIGUE FUNCIONANDO/.test(estadoDoc('oculto').que),
    '⚠️ oculto no es apagado: sigue dando ideas, tarjetas y métricas');
  ok(/No borra nada/.test(estadoDoc('desactivado').que), 'y desactivar no borra nada');

  eq(CICLO_DE_ELIMINACION.map((c) => c.paso), [1, 2, 3, 4], 'los cuatro pasos de eliminar');
  ok(/eliminarConPapelera/.test(CICLO_DE_ELIMINACION[0].como),
    '⚠️ y el primero dice la función: nunca un `filter` a mano');
  ok(/IRREVERSIBLE/.test(AVISO_ELIMINACION),
    '🚨 con el aviso que ya hizo falta tres veces en este proyecto');
  eq(coleccionesTotalesEnLaPapelera(), Object.keys(PAPELERA).length,
    'y las colecciones de la papelera se cuentan del catálogo de verdad');
  ok(coleccionesConPapelera() > 0, `${coleccionesConPapelera()} de ellas son de Estilo de hombre`);
}

/* ---------------------------------------------------------------------------
   7 · ESTRUCTURA Y MIGRACIONES (apartados 7 y 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Estructura de datos y migraciones');
  eq(ESTRUCTURA.claveDeEsteModulo, 'estiloHombre', 'una sola clave');
  ok(/app_data/.test(ESTRUCTURA.tabla), 'la tabla, con sus campos');
  ok(/clave primaria|primaria/i.test(ESTRUCTURA.indices), 'los índices: la clave primaria y nada más');
  ok(/sin su valor/.test(ESTRUCTURA.sinSecretos),
    '⚠️ apartado 7 — y las variables se nombran sin su valor');

  eq(registroDeMigraciones().length, MIGRACIONES_F46.length,
    '🚨 las migraciones salen de la F46, no se copian');
  ok(MIGRACIONES === MIGRACIONES_F46, 'literalmente el mismo array');
  ok(registroDeMigraciones().every((m) => !!m.de && !!m.a && !!m.que && !!m.porque),
    '⚠️ y cada una con versión anterior → nueva → qué cambió → por qué');
}

/* ---------------------------------------------------------------------------
   8 · COMPONENTES Y REGLAS (apartados 9, 10 y 11)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Componentes reutilizables y reglas');
  eq(COMPONENTES_REUTILIZABLES.length, 6, 'los seis del enunciado');
  /* 🚨 Cada uno nombra algo que EXISTE. Una lista de nombres inventados manda a
     buscar lo que no está. */
  COMPONENTES_REUTILIZABLES.filter((c) => c.componente !== 'createPortal').forEach((c) => {
    const fuente = c.vive.includes('ui.jsx') ? UI : VISTA;
    ok(new RegExp(`(export (function|const) )?${c.componente}\\b`).test(fuente),
      `🚨 \`${c.componente}\` existe de verdad (${c.nombre})`);
  });
  ok(/react-dom/.test(componenteReutilizable('modales').vive),
    '⚠️ y los modales NO nombran un componente que no existe: la regla es `createPortal`');
  ok(/createPortal/.test(VISTA), 'que sí está en la vista');

  eq(REGLAS_DE_DISENO.length, 8, 'las siete del apartado 10, más el texto sobre el acento');
  ok(REGLAS_DE_DISENO.every((r) => !!r.regla && !!r.fase), 'cada una con su regla y de qué fase sale');
  ok(/textOnAccent/.test(REGLAS_DE_DISENO.find((r) => r.id === 'texto_sobre_acento').regla),
    '🐛 incluida la que costó cuatro botones en la F49');

  eq(REGLAS_UX.length, 6, 'las seis reglas de UX del apartado 11');
  ok(REGLAS_UX.every((r) => !!r.porque), 'cada una con por qué');
  ok(REGLAS_UX.some((r) => r.regla === 'Ocultar no elimina.'), 'con sus palabras exactas');
}

/* ---------------------------------------------------------------------------
   9 · NOTIFICACIONES, PRIVACIDAD, PRUEBAS, HISTORIAL Y BACKLOG (12 a 16)
   --------------------------------------------------------------------------- */
{
  console.log('\n9 · Notificaciones, privacidad, pruebas, historial y backlog');
  ok(/TODAS/.test(NOTIFICACIONES_DOC.requiereActivacion),
    '⚠️ todas las notificaciones nacen apagadas, y se dice');
  ok(/no habla con el navegador/.test(NOTIFICACIONES_DOC.queUsa),
    'y Estilo de hombre no habla con el navegador: usa el sistema global');

  ok(/RLS/.test(PRIVACIDAD_DOC.comoSeProtege), 'la privacidad, con RLS y el PIN');
  ok(/JSON/.test(PRIVACIDAD_DOC.comoSeExporta), 'y cómo se exporta');
  ok(/papelera/.test(PRIVACIDAD_DOC.comoSeElimina), 'y cómo se elimina');

  /* ⚠️ Una prueba que no se ejecuta no es una prueba (lección de la F47). */
  ok(VERIFICAR.includes('test-documentacion-eh.mjs'),
    '⚠️ y esta misma prueba la ejecuta `verificar.sh`: si no, no serviría de nada');
  ok(/verificar\.sh/.test(SUITE_DE_PRUEBAS.comando), 'apartado 14 — con el comando de verdad');
  ok(SUITE_DE_PRUEBAS.integrales >= 30, `y los ${SUITE_DE_PRUEBAS.integrales} recorridos integrales de la F47`);
  ok(/entero|ANTES/.test(SUITE_DE_PRUEBAS.regla), '⚠️ y la regla: cada cambio pasa por ahí antes');

  ok(/CHANGELOG/.test(HISTORIAL.donde), 'apartado 15 — el historial vive en el CHANGELOG');
  ok(SE_POSPONE === SE_POSPONE_F48, '🚨 apartado 16 — el backlog ES el de la F48, no una segunda lista');
  eq(IDEAS_FUTURAS, SE_POSPONE_F48, 'literalmente');
  ok(IDEAS_FUTURAS.every((i) => !!i.porque), 'y cada idea pospuesta dice por qué se pospuso');
}

/* ---------------------------------------------------------------------------
   10 · LA REGLA PARA CLAUDE Y EL MANTENIMIENTO (17 y 18)
   --------------------------------------------------------------------------- */
{
  console.log('\n10 · La regla para quien venga, y qué hacer si algo falla');
  ok(/leer `docs\/08_ESTILO_DE_HOMBRE_TECNICO\.md`/.test(REGLA_PARA_CLAUDE),
    '🚨 apartado 17 — la regla nombra el documento por su ruta');
  ok(/no se copia/.test(REGLA_PARA_CLAUDE), 'y recuerda la regla de la fuente única');

  eq(MANTENIMIENTO.map((m) => m.id),
    ['migracion_falla', 'duplicado', 'integracion_rota', 'que_pruebas'],
    'las cuatro preguntas del apartado 18');
  ok(MANTENIMIENTO.every((m) => m.pregunta.endsWith('?')), '⚠️ y son preguntas, no descripciones');
  ok(MANTENIMIENTO.every((m) => !!m.respuesta && !!m.donde), 'cada una con respuesta y dónde mirar');
  ok(/restaurarCopia/.test(preguntaDeMantenimiento('migracion_falla').respuesta),
    'si falla una migración: la copia de la F46');
  ok(/entero/.test(preguntaDeMantenimiento('que_pruebas').respuesta),
    '⚠️ y qué pruebas ejecutar: la suite ENTERA, no la del archivo que tocaste');
  ok(!preguntaDeMantenimiento('inventada'), 'se buscan por id');

  eq(SECCIONES_DOC.length, 18, 'los dieciocho apartados del enunciado');
  eq(SECCIONES_DOC.map((s) => s.id), Array.from({ length: 18 }, (_, i) => i + 1), 'y en su orden');
  ok(SECCIONES_DOC.every((s) => !!s.donde), 'cada uno dice dónde se contesta');
  eq(SECCIONES_DOC.filter((s) => s.derivado).map((s) => s.id), [2, 4, 5, 8, 16],
    '🚨 y cinco se DERIVAN del código: ésos no pueden quedarse viejos');

  const panel = panelDocumentacion(DOC);
  eq(panel.alDia, true, '🎯 el documento está al día con el código');
  ok(/qué no debe tocarse/.test(panel.condicion), 'con la condición de finalización, entera');
  ok(/se pone roja/.test(TEXTOS_DOC.actualizado),
    '⚠️ y con lo que hace que el "mantenerlo actualizado" del apartado 2 se cumpla de verdad');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
