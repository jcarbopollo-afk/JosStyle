// ============================================================================
// EH · Fase 64/65 — Prueba integral end-to-end
//
// *"No declarar Estilo de hombre terminado hasta que: funcionalidad ✅ UX ✅
// diseño ✅ datos ✅ IA ✅ sincronización ✅ móvil ✅ accesibilidad ✅ seguridad ✅
// rendimiento ✅ recuperación ✅ integración ✅"*
//
// Lo que vigila esta prueba:
//   · 🚨 que el recorrido completo pase ENTERO, de configurar a migrar
//   · que las doce casillas estén CALCULADAS, no marcadas a mano
//   · y que las que no están verdes lo digan con su motivo
// ============================================================================

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { PRUEBAS_INTEGRALES as INTEGRALES_F47 } from '../src/lib/pruebasIntegrales.js';
import { probarPersistencia as PERSISTENCIA_F51 } from '../src/lib/experienciaReal.js';
import {
  RECORRIDOS_E2E, recorridoE2E, recorridosDeJosue, recorridosAutomaticos,
  PASOS, recorridoCompleto,
  LAS_DOCE, condicionFinal, cuantosVerdes, losQueFaltan, TEXTO_CONDICION,
  auditarPruebaFinal, panelPruebaFinal, PRUEBAS_INTEGRALES,
} from '../src/lib/pruebaFinal.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const VISTAS = join(RAIZ, 'src/views');
const VISTA = readFileSync(join(VISTAS, 'EstiloHombreView.jsx'), 'utf8');
/* ⚠️ TODAS las demás vistas: la comparación visual de la F49 necesita el
   vocabulario entero del proyecto, no una muestra. */
const OTRAS = readdirSync(VISTAS)
  .filter((f) => f.endsWith('.jsx') && f !== 'EstiloHombreView.jsx')
  .map((f) => readFileSync(join(VISTAS, f), 'utf8'));
const OPCIONES = {
  vista: VISTA,
  sql: readFileSync(join(RAIZ, 'supabase/schema.sql'), 'utf8'),
  api: readFileSync(join(RAIZ, 'api/ask-ai.js'), 'utf8'),
  fuentesResto: OTRAS,
};

console.log('\n🏁 EH · Fase 64/65 — Prueba integral end-to-end\n');

/* ---------------------------------------------------------------------------
   1 · 🚨 EL RECORRIDO COMPLETO, EJECUTADO
   --------------------------------------------------------------------------- */
{
  console.log('1 · La cadena entera');
  const r = recorridoCompleto();
  eq(r.ok, true, `🚨 ⚠️ el recorrido completo pasa ENTERO${r.ok ? '' : ` — se rompió en "${r.paso}": ${r.porque}`}`);
  eq(r.paso, null, 'sin romperse en ningún paso');
  eq(Object.keys(r.pasos).length, PASOS.length, `los ${PASOS.length} pasos, de configurar a migrar`);

  /* Los pasos que más importan, uno a uno. */
  eq(r.pasos.configurar, 4, 'configura cuatro apartados');
  eq(r.pasos.anadir, 2, 'añade dos perfumes');
  eq(r.pasos.personalizar.tamano, 'grande', 'cambia el tamaño de una plaquita');
  eq(r.pasos.personalizar.oculto, true, 'y oculta un apartado');
  eq(r.pasos.guardar_y_volver,
    { tamano: 'grande', oculto: true, perfumes: 2 },
    '🚨 ⚠️ y TODO sobrevive a cerrar y volver: el tamaño, lo oculto y los datos (regla 5)');
  eq(r.pasos.permiso_ia.antes, null,
    '🚨 sin el permiso de la IA no salía contexto — comprobado dentro del recorrido');
  eq(r.pasos.permiso_ia.ahora, true, 'y con permiso, sí');
  ok(r.pasos.aprender > 0, 'aprende de lo que hace (F57)');
  ok(r.pasos.insight > 0, 'saca un insight de esos datos (F58)');
  eq(r.pasos.resumen.hay, true, 'y lo mete en el resumen semanal (F59)');
  eq(r.pasos.contexto.hay, true, 'recomienda con un evento por delante (F60)');
  eq(r.pasos.copia, 2, 'hace copia de seguridad (F54)');
  eq(r.pasos.romper, 0, 'se rompe un módulo a propósito');
  eq(r.pasos.restaurar.perfumes, 2, 'y se restaura');
  eq(r.pasos.restaurar.otroIntacto, true,
    '🚨 ⚠️ sin tocar el otro módulo: eso es el nivel 3 de la F54');
  eq(r.pasos.migrar.error, null, 'y una migración de v1 a v2 sin errores (F46)');
  eq(r.pasos.migrar.migrada, true, 'que sí migra');
}

/* ---------------------------------------------------------------------------
   2 · 🚨 LAS DOCE, CALCULADAS Y NO MARCADAS
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · La condición de finalización');
  const c = condicionFinal(OPCIONES);
  eq(LAS_DOCE.length, 12, 'las doce que pide el enunciado');
  eq(Object.keys(c).sort(), [...LAS_DOCE].sort(), 'y las doce se calculan');
  ok(LAS_DOCE.every((k) => typeof c[k].ok === 'boolean' && !!c[k].de),
    '⚠️ cada una con su resultado y de qué fase sale');

  const verdes = cuantosVerdes(c);
  const faltan = losQueFaltan(c);
  eq(verdes, 10, `🚨 ⚠️ están DIEZ de doce en verde — y que falten dos es el resultado correcto`);
  eq(faltan, ['sincronizacion', 'movil'],
    '🚨 las dos que faltan: la sincronización entre dispositivos y el móvil');
  eq(auditarPruebaFinal(OPCIONES).faltanSinMotivo, [],
    '⚠️ y las dos dicen POR QUÉ, que es lo único que las hace aceptables');
  ok(/último en escribir gana/.test(c.sincronizacion.porque),
    '🚨 la sincronización: el último en escribir gana, y es una decisión de esquema');
  ok(/iPhone/.test(c.movil.porque),
    '🚨 y el móvil: nadie ha abierto esto en un teléfono de verdad');

  /* ⚠️ Y una que está verde CON MATIZ, dicho. */
  eq(c.seguridad.ok, true, 'la seguridad sale verde…');
  ok(/api\/ask-ai/.test(c.seguridad.matiz),
    '⚠️ …con su matiz escrito: los datos están protegidos, la factura de la IA no');

  /* 🚨 Decisión 1 — no hay forma de ponerlas verdes escribiendo. */
  ok(c.datos.ok === PERSISTENCIA_F51().every((x) => x.permanece),
    '🚨 "datos" sale de ejecutar la prueba de persistencia de la F51, no de un `true`');
  ok(/F51/.test(c.ux.de) && /F61/.test(c.ux.de), 'y "UX" de la F51 y la F61');
  ok(/F63/.test(c.seguridad.de), '"seguridad" de la F63');
  ok(/F54/.test(c.recuperacion.de), 'y "recuperación" de la F54');
  ok(/faltan la sincronización/.test(TEXTO_CONDICION), 'con el texto que lo resume');
}

/* ---------------------------------------------------------------------------
   3 · LOS VEINTISÉIS RECORRIDOS
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Los veintiséis del enunciado');
  eq(RECORRIDOS_E2E.length, 26, 'los veintiséis');
  eq(RECORRIDOS_E2E.map((r) => r.id), Array.from({ length: 26 }, (_, i) => i + 1), 'en su orden');
  eq(auditarPruebaFinal(OPCIONES).sinDonde, [],
    '⚠️ y cada uno que se comprueba dice dónde se comprueba');
  eq(auditarPruebaFinal(OPCIONES).sinMotivo, [],
    '🚨 y cada uno que NO se puede comprobar dice por qué');

  eq(recorridosDeJosue().map((r) => r.id), [15, 16, 17, 18, 26],
    'cinco necesitan su móvil, o no existen');
  ok(/NO EXISTE/.test(recorridoE2E(16).porque),
    '🚨 y el 16 no es "falta probarlo": es que **no existe** el sistema de conflictos');
  ok(/el único que no puede hacerla/.test(recorridoE2E(26).porque),
    '🚨 y el 26 es el de siempre: he leído las 65 fases, así que soy justo el único que no puede');
  ok(recorridosAutomaticos().length >= 7, `${recorridosAutomaticos().length} se ejecutan de verdad`);
  ok(!recorridoE2E(99), 'se buscan por id');

  ok(PRUEBAS_INTEGRALES === INTEGRALES_F47,
    '⚠️ y las treinta pruebas de la F47 se importan: esta fase no las reescribe');
  eq(auditarPruebaFinal(OPCIONES).integrales, INTEGRALES_F47.length, 'las treinta siguen ahí');
}

/* ---------------------------------------------------------------------------
   4 · EL VEREDICTO
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · El veredicto de la fase');
  const panel = panelPruebaFinal(OPCIONES);
  eq(panel.pruebaSuperada, true,
    '🎯 la prueba integral se ha hecho entera, y las doce están calculadas');
  eq(panel.e2eOk, true, 'con el recorrido completo en verde');
  eq(panel.verdes, 10, 'diez de doce');
  eq(panel.faltan.length, 2, 'y dos que no, dichas');
  ok(/no se declara terminado/i.test(panel.texto),
    '⚠️ y el veredicto de esta fase NO es "está terminado"');
  ok(panel.recorrido.ok, 'el panel trae el recorrido ejecutado');
  eq(panel.recorridosLista.length, 26, 'y los veintiséis');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
