// ============================================================================
// EH · Fase 65/65 — Cierre, congelación y entrega final
//
// *"Estilo de hombre queda cerrado como módulo funcional. Significa que tenemos
// una BASE ESTABLE v1.0 sobre la que construir sin volver a empezar."*
//
// Lo que vigila esta prueba:
//   · 🚨 que el informe final se CALCULE, no se marque
//   · que lo que falta esté dicho, con quién lo decide y cuál es el arreglo
//   · que "bloqueado" y "pendiente" no sean lo mismo
//   · y que el documento de cierre esté al día con el código
// ============================================================================

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { SE_POSPONE as SE_POSPONE_F48 } from '../src/lib/auditoriaFinal.js';
import { HALLAZGO_ENDPOINT as HALLAZGO_F63 } from '../src/lib/seguridadEH.js';
import { recorridoCompleto as E2E_F64 } from '../src/lib/pruebaFinal.js';
import { backlog as BACKLOG_F55 } from '../src/lib/escalabilidad.js';
import {
  CONGELADO, NO_SE_PUEDE, SI_SE_PUEDE, REGLA_DE_CAMBIO,
  ESTADOS_CIERRE, estadoCierre, BLOQUEADO, pendiente, futuro, terminado, inventarioFinal,
  VERSION, etiqueta,
  LINEAS_DEL_INFORME, informeFinal, informeEnVerde,
  DOCUMENTACION, BACKLOG_AL_GLOBAL, ES_MODULO_OFICIAL,
  TEXTOS_CIERRE, APARTADOS_CIERRE, apartadoCierre,
  auditarCierre, panelCierre, SE_POSPONE, HALLAZGO_ENDPOINT, VERSION_EH,
} from '../src/lib/cierre.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const VISTAS = join(RAIZ, 'src/views');
const OPCIONES = {
  vista: readFileSync(join(VISTAS, 'EstiloHombreView.jsx'), 'utf8'),
  sql: readFileSync(join(RAIZ, 'supabase/schema.sql'), 'utf8'),
  api: readFileSync(join(RAIZ, 'api/ask-ai.js'), 'utf8'),
  fuentesResto: readdirSync(VISTAS)
    .filter((f) => f.endsWith('.jsx') && f !== 'EstiloHombreView.jsx')
    .map((f) => readFileSync(join(VISTAS, f), 'utf8')),
};
const DOC = readFileSync(join(RAIZ, 'docs/09_ESTILO_DE_HOMBRE_CIERRE.md'), 'utf8');

console.log('\n🏁 EH · Fase 65/65 — Cierre, congelación y entrega final\n');

/* ---------------------------------------------------------------------------
   1 · 🚨 EL INFORME SE CALCULA (apartado 18)
   --------------------------------------------------------------------------- */
{
  console.log('1 · El informe final');
  const informe = informeFinal(OPCIONES);
  eq(informe.length, 9, 'las nueve líneas que pide el apartado 18');
  eq(informe.map((l) => l.nombre),
    ['Funcionalidad', 'Diseño', 'UX', 'Datos', 'IA', 'Seguridad', 'Rendimiento', 'Móvil', 'Integración'],
    'con sus nombres, en su orden');
  ok(informe.every((l) => !!l.de),
    '🚨 ⚠️ y cada una dice DE QUÉ FASE sale: no hay ni un ✅ escrito a mano');
  ok(informe.every((l) => ['✅', '🟡', '🔴'].includes(l.icono)),
    'con los tres iconos del enunciado');

  /* 🚨 Decisión 2 — no salen las nueve. */
  eq(informeEnVerde(informe), 8, '🚨 salen OCHO de nueve, y ese es el resultado honesto');
  eq(auditarCierre(OPCIONES).noVerdes, ['movil'],
    '🚨 ⚠️ la que falta es el móvil: nadie ha abierto esto en un iPhone');
  eq(informe.find((l) => l.id === 'movil').icono, '🟡',
    '⚠️ y es 🟡, no 🔴: no está roto — está sin comprobar donde importa');
  eq(auditarCierre(OPCIONES).sinMotivo, [],
    '🚨 y lo que no está verde dice POR QUÉ (apartado 17: "si algo falla, no ocultarlo")');
  ok(/iPhone/.test(informe.find((l) => l.id === 'movil').porque), 'con el motivo exacto');

  /* Y una verde CON MATIZ. */
  const seg = informe.find((l) => l.id === 'seguridad');
  eq(seg.icono, '✅', 'la seguridad sale verde…');
  ok(/api\/ask-ai/.test(seg.matiz), '⚠️ …y su matiz va escrito en el informe, no escondido');
  ok(/no se oculta/.test(TEXTOS_CIERRE.criterio), 'con el criterio del apartado 17');
}

/* ---------------------------------------------------------------------------
   2 · CONGELADO, PERO NO CERRADO CON LLAVE (apartados 1 y 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · La congelación');
  eq(CONGELADO, true, 'el módulo queda congelado a funciones nuevas');
  eq(NO_SE_PUEDE.length, 3, 'las tres cosas que ya no se hacen');
  eq(NO_SE_PUEDE.map((x) => x.id), ['funciones', 'modulos', 'arquitectura'], 'con sus nombres');
  eq(SI_SE_PUEDE.length, 3, '⚠️ y las tres que sí: corregir, arreglar un error y un ajuste imprescindible');
  ok(SI_SE_PUEDE.every((x) => !!x.ejemplo), 'cada una con un ejemplo, para que no sea una excusa');
  ok(/no es un ajuste: es una función/.test(SI_SE_PUEDE.find((x) => x.id === 'ajuste').listonAlto),
    '🚨 con el listón alto: si hace falta una pantalla nueva, no es un ajuste');
  ok(/verificar\.sh/.test(REGLA_DE_CAMBIO),
    '⚠️ apartado 15 — y cualquier cambio futuro pasa por la verificación entera');
}

/* ---------------------------------------------------------------------------
   3 · 🚨 BLOQUEADO NO ES PENDIENTE (apartado 2)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · El inventario final');
  eq(ESTADOS_CIERRE.map((e) => e.icono), ['✅', '🟡', '🔴', '💡'], 'los cuatro estados del enunciado');
  ok(ESTADOS_CIERRE.every((e) => !!e.que), 'cada uno con qué significa');
  ok(/otro sistema|decisión de Josué/.test(estadoCierre('bloqueado').que),
    '🚨 ⚠️ y "bloqueado" NO es "pendiente": es lo que no se puede hacer desde aquí');

  const inv = inventarioFinal();
  eq(inv.bloqueado.length, 3, 'tres cosas bloqueadas');
  eq(auditarCierre(OPCIONES).bloqueadosSinDueno, [],
    '🚨 y las tres dicen QUIÉN lo decide y CUÁL es el arreglo');

  /* 🚨 El endpoint estaba bloqueado esperando una decisión de Josué. Josué
     decidió el 2026-09-04, así que salió de ahí — pero NO desapareció: un
     bloqueo que se levanta y se borra deja el cierre mintiendo sobre lo que
     hubo. Queda en `desbloqueado`, con la fecha y con lo que sigue abierto. */
  ok(!inv.bloqueado.some((b) => b.id === 'endpoint_sin_auth'),
    'el endpoint de la F63 ya no está bloqueado');
  eq(inv.desbloqueado.length, 1, 'y está en lo desbloqueado, no borrado');
  eq(inv.desbloqueado[0].decidio, 'Josué', 'diciendo quién lo decidió');
  eq(inv.desbloqueado[0].cuando, '2026-09-04', 'y cuándo');
  ok(/memoria/.test(inv.desbloqueado[0].sigueAbierto),
    '⚠️ y qué NO quedó cerrado: el tope por usuario vive en memoria');
  eq(HALLAZGO_ENDPOINT, HALLAZGO_F63, 'importado de allí, no reescrito');
  ok(inv.bloqueado.some((b) => b.id === 'conflictos'),
    'y los conflictos entre dispositivos');
  ok(/columna/.test(inv.bloqueado.find((b) => b.id === 'conflictos').arreglo),
    '⚠️ con el arreglo dicho: una columna nueva, no un parche');

  ok(inv.pendiente.length > 0, `${inv.pendiente.length} cosas pendientes, que sí se pueden hacer aquí`);
  ok(inv.pendiente.every((x) => !!x.que && !!x.de), 'cada una diciendo qué es y de qué fase viene');
  ok(!inv.pendiente.some((x) => inv.bloqueado.some((b) => b.id === x.id)),
    '⚠️ y ninguna aparece a la vez como pendiente y bloqueada');

  eq(futuro(), SE_POSPONE_F48.map((s) => ({ id: s.id, que: s.que, porque: s.porque })),
    '💡 y lo futuro es el `SE_POSPONE` de la F48, derivado');
  ok(SE_POSPONE === SE_POSPONE_F48, 'importado');
  ok(terminado().fases === 65, 'con las sesenta y cinco fases terminadas');
  ok(terminado().modulos >= 17, `y los ${terminado().modulos} apartados del catálogo`);
}

/* ---------------------------------------------------------------------------
   4 · LA VERSIÓN Y LA INTEGRACIÓN (apartados 12 y 16)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · La etiqueta y el módulo oficial');
  eq(VERSION.nombre, 'JC Fitness — Estilo de hombre v1.0', 'la versión, con el nombre del enunciado');
  eq(VERSION.esquemaDeDatos, VERSION_EH, 'y el esquema de datos que conoce la migración');
  eq(VERSION.fases, '65 de 65', 'las sesenta y cinco');
  ok(/Ninguno/.test(VERSION.sql), '🚨 y cero SQL en sesenta y cinco fases');
  ok(!!etiqueta().fecha, 'la etiqueta lleva fecha');
  ok(VERSION.dependencias.length >= 8, `usa ${VERSION.dependencias.length} sistemas globales`);
  ok(VERSION.noUsa.length === 2, '⚠️ y los dos que NO usa también van en la etiqueta');

  eq(ES_MODULO_OFICIAL.usa, VERSION.dependencias.length, 'apartado 16 — usa los sistemas globales…');
  ok(/no guarda su peso|No guarda/.test(ES_MODULO_OFICIAL.noHace),
    '…y no duplica ninguno: lo que ya hace JosStyle, aquí no se rehace');
  ok(/Las plaquitas muestran/.test(ES_MODULO_OFICIAL.regla), 'con la regla de las tres capas (F48)');
}

/* ---------------------------------------------------------------------------
   5 · EL DOCUMENTO DE CIERRE, AL DÍA
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · El documento');
  ok(DOC.length > 3000, `docs/09_ESTILO_DE_HOMBRE_CIERRE.md existe (${DOC.length} caracteres)`);
  ok(/ESTILO DE HOMBRE — ESTADO FINAL/.test(DOC), 'con el título del apartado 18');
  ok(/se genera desde/.test(DOC), '🚨 y diciendo que se GENERA desde el código');
  informeFinal(OPCIONES).forEach((l) => {
    ok(DOC.includes(l.nombre), `la línea de ${l.nombre} está en el documento`);
  });
  ok(DOC.includes('8 de 9 en verde'), '🚨 ⚠️ con el recuento de verdad: ocho de nueve');
  BLOQUEADO.forEach((b) => {
    ok(DOC.includes(b.que.slice(0, 30)), `y lo bloqueado, uno a uno: ${b.id}`);
  });
  ok(/BASE ESTABLE v1\.0/.test(DOC), 'y la condición final, con sus palabras');

  eq(DOCUMENTACION.tecnica, 'docs/08_ESTILO_DE_HOMBRE_TECNICO.md', 'apartado 13 — con la técnica de la F53');
  ok(/PUBLICAR/.test(DOCUMENTACION.publicar), 'y la de publicar, de la F52');
  eq(BACKLOG_AL_GLOBAL.cuantas, BACKLOG_F55().length,
    '⚠️ apartado 14 — y el backlog es el de la F55, derivado');
  ok(/Ninguna idea descartada se queda en un comentario/.test(BACKLOG_AL_GLOBAL.regla),
    'con la regla del apartado 14');
}

/* ---------------------------------------------------------------------------
   6 · EL VEREDICTO
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Entregado');
  eq(APARTADOS_CIERRE.length, 18, 'los dieciocho apartados de la fase');
  eq(auditarCierre(OPCIONES).sinDonde, [], 'y todos dicen dónde se contestan');
  ok(/R1/.test(apartadoCierre(9).donde),
    '⚠️ incluido el 9, que es de Josué: nadie lo ha abierto en un móvil');
  ok(!apartadoCierre(99), 'se buscan por id');

  eq(auditarCierre(OPCIONES).e2eOk, true, 'el recorrido completo de la F64 sigue pasando entero');
  ok(E2E_F64().ok, 'comprobado desde su propia función');

  const panel = panelCierre(OPCIONES);
  eq(panel.entregado, true,
    '🎯 cerrado y entregado — que no quiere decir "todo perfecto", sino que **nada está escondido**');
  ok(/BASE ESTABLE/.test(panel.condicion), 'con la condición final');
  ok(/no está escondido/.test(TEXTOS_CIERRE.loQueFalta), 'y con lo que falta, dicho');
  ok(/sesenta y cinco fases/i.test(TEXTOS_CIERRE.gracias), 'y el recorrido de las 65 fases');
  eq(panel.informe.length, 9, 'el panel trae el informe');
  eq(panel.inventario.bloqueado.length, 3, 'y el inventario');
  eq(panel.inventario.desbloqueado.length, 1, 'con lo que se desbloqueó después');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
