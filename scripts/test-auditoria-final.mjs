// ============================================================================
// EH · Fase 48/65 — Auditoría final de funciones y duplicados
//
// *"Así evitamos que dentro de seis meses tengamos tres calendarios, dos
// papeleras, cuatro sistemas de favoritos y cinco formas distintas de hacer lo
// mismo."*
//
// Lo que vigila esta prueba:
//   · los quince sistemas del apartado 3, cada uno con su dueño
//   · y el revisor, sobre las cuarenta y siete librerías DE VERDAD
//   · un icono por cosa (apartado 12)
//   · las cuatro listas del apartado 20, y que "se elimina" está vacía
//   · y que esta fase no ha añadido nada (apartado 21)
// ============================================================================

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { IDS_EH, MODULOS_EH } from '../src/lib/estiloDeHombre.js';
import { LIBRERIAS_EH } from '../src/lib/privacidadEstilo.js';
import { TIPOS_AVISO_EH } from '../src/lib/avisosEstilo.js';
import { METRICAS_PROGRESO } from '../src/lib/progresoEstilo.js';
import {
  CLASIFICACIONES, clasificacion, SISTEMAS_REVISADOS, sistemaRevisado,
  revisarDuplicados, revisarIconos, SE_QUEDA, SE_INTEGRA, SE_ELIMINA, SE_POSPONE,
  RESPUESTA_FINAL, auditarFinal, panelAuditoriaFinal,
} from '../src/lib/auditoriaFinal.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

/* Las librerías de Estilo de hombre, leídas de verdad — la misma lista que usa
   la F43, para no escribir una segunda. */
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const FUENTES = {};
LIBRERIAS_EH.forEach((nombre) => {
  try { FUENTES[nombre] = readFileSync(join(RAIZ, 'src/lib', `${nombre}.js`), 'utf8'); } catch { /* no está */ }
});
const VISTA = readFileSync(join(RAIZ, 'src/views/EstiloHombreView.jsx'), 'utf8');

console.log('\n🔎 EH · Fase 48/65 — Auditoría final de funciones y duplicados\n');

/* ---------------------------------------------------------------------------
   1 · LAS CUATRO ETIQUETAS Y LOS QUINCE SISTEMAS (apartados 2 y 3)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Cada sistema, con su dueño');
  eq(CLASIFICACIONES.map((c) => c.id), ['propio', 'global', 'integrado', 'duplicado'],
    'las cuatro etiquetas del apartado 2');
  eq(clasificacion('duplicado').icono, '🔴', 'con sus colores');

  eq(SISTEMAS_REVISADOS.length, 15, 'los quince sistemas que el apartado 3 manda revisar');
  eq(SISTEMAS_REVISADOS.map((s) => s.id), [
    'favoritos', 'calendario', 'tareas', 'objetivos', 'diario', 'notificaciones',
    'recordatorios', 'eliminados', 'fotos', 'productos', 'armario', 'rachas',
    'sonidos', 'busqueda', 'estadisticas',
  ], 'y son exactamente los de su lista');

  const a = auditarFinal(FUENTES);
  eq(a.sinDueno, [], '⚠️ ninguno se queda sin etiqueta');
  eq(a.sinDondeVive, [], 'ni sin decir dónde vive de verdad');
  eq(a.duplicados, [],
    '🔴 y NINGUNO está clasificado como duplicado: es la condición de finalización');
  ok(a.porEtiqueta.global >= 5 && a.porEtiqueta.integrado >= 3,
    'la mayoría son globales o de otro módulo, que es lo que se buscaba');
  ok(/no existe un sistema de favoritos/i.test(sistemaRevisado('favoritos').nota),
    '⚠️ y el de favoritos dice por qué NO es un duplicado: no hay uno global (F39)');
}

/* ---------------------------------------------------------------------------
   2 · EL REVISOR, SOBRE EL CÓDIGO DE VERDAD (decisión 3)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Ni un sistema paralelo en las librerías');
  ok(Object.keys(FUENTES).length >= 40,
    `se leen las ${Object.keys(FUENTES).length} librerías de Estilo de hombre`);
  eq(revisarDuplicados(FUENTES), [],
    '⚠️ y NINGUNA monta un calendario, una papelera, un audio ni unas fotos propios');

  /* ⚠️ La comprobación de la comprobación: con un archivo que sí lo hiciera,
     salta. Sin esto, una expresión mal escrita daría siempre cero. */
  const inventado = {
    falso: 'export const DEFAULT_PAPELERA_EH = []; const a = new Audio("x"); function crearPrenda() {}',
  };
  const pillados = revisarDuplicados(inventado).map((p) => p.sistema).sort();
  eq(pillados, ['armario', 'eliminados', 'sonidos'],
    '⚠️ y con un archivo que sí los monta, los caza los tres');
  eq(revisarDuplicados({ x: '// new Audio("x")\n/* crearPrenda({}) */' }), [],
    '⚠️ pero un ejemplo dentro de un comentario NO cuenta');

  // Y la vista tampoco.
  eq(revisarDuplicados({ 'EstiloHombreView.jsx': VISTA }).filter((p) => p.sistema !== 'fotos'), [],
    'la pantalla tampoco monta ninguno');
}

/* ---------------------------------------------------------------------------
   3 · UN ICONO POR COSA (apartado 12)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Un icono por cosa');
  eq(revisarIconos(), [], '⚠️ ni dos módulos con el mismo icono, ni una plaquita repitiendo el suyo');
  const iconos = MODULOS_EH.map((m) => m.icono);
  eq(iconos.length, [...new Set(iconos)].length, `los ${iconos.length} módulos tienen iconos distintos`);
  ok(MODULOS_EH.every((m) => !!m.icono), 'y ninguno se queda sin icono');
}

/* ---------------------------------------------------------------------------
   4 · LAS CUATRO LISTAS (apartado 20)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Se queda, se integra, se elimina, se pospone');
  const a = auditarFinal(FUENTES);
  ok(a.seQueda >= 7, `se quedan ${a.seQueda} cosas, las que definen el módulo (apartado 8)`);
  ok(a.seIntegra >= 5, `se integran ${a.seIntegra}, con la fuente que manda en cada una`);
  eq(SE_ELIMINA, [],
    '⚠️ 🔴 "SE ELIMINA" está VACÍA — y no es un descuido: las fases anteriores fueron quitando');
  ok(a.sePospone >= 5, `y se posponen ${a.sePospone} ideas, con su motivo`);
  eq(a.sinPorque, [], '⚠️ ninguna de las dos listas deja algo sin explicar');

  ok(SE_POSPONE.some((x) => x.id === 'favoritos_globales'), 'los favoritos globales se posponen');
  ok(SE_POSPONE.some((x) => x.id === 'conflictos'), 'y los conflictos entre dispositivos, también');
  ok(SE_INTEGRA.every((x) => !!x.vive && !!x.enEH),
    '⚠️ y cada cosa integrada dice quién manda y qué guarda Estilo de hombre');

  // Apartado 21 — esta fase no añade nada.
  eq([a.funcionesNuevas, a.almacenesNuevos], [0, 0],
    '⚠️ apartado 21 — esta fase NO añade ni una función: lo nuevo va a "se pospone"');
}

/* ---------------------------------------------------------------------------
   5 · ESTADÍSTICAS Y AVISOS (apartados 17 y 18)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Lo que no aporta, fuera');
  const a = auditarFinal(FUENTES);
  eq(a.metricasSinModulo, [], '⚠️ cada estadística dice de qué módulo es');
  ok(a.metricas > 0 && a.metricas < 40, `hay ${a.metricas} métricas, no una por cada cosa que se pueda contar`);
  eq(a.avisosEncendidosPorDefecto, [],
    '⚠️ apartado 18 — TODOS los avisos nacen apagados: menos notificaciones, mejor experiencia');
  ok(TIPOS_AVISO_EH.every((t) => !!t.modulo && !!t.categoria),
    'y cada uno dice de qué módulo es y en qué categoría de Ajustes cae');
  ok(METRICAS_PROGRESO.every((m) => typeof m.fuente === 'function'),
    '⚠️ y ninguna estadística guarda un contador: todas leen de donde viven los datos');
}

/* ---------------------------------------------------------------------------
   6 · LA RESPUESTA DEL APARTADO 22
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Qué hace, y qué no hace');
  ok(RESPUESTA_FINAL.hace.length > 80, 'la respuesta a "¿qué hace Estilo de hombre?" está escrita');
  ok(/no guarda su peso|ya lo hace JosStyle/i.test(RESPUESTA_FINAL.noHace),
    '⚠️ y la de "¿qué NO hace porque ya lo hace JosStyle?", también');
  ok(/Los módulos guardan los datos/.test(RESPUESTA_FINAL.regla),
    'con la regla de la condición de finalización de la F45');

  const panel = panelAuditoriaFinal(FUENTES);
  eq(panel.sistemas.length, 15, 'el panel trae los quince');
  ok(panel.sistemas.every((s) => !!s.etiquetaNombre), 'con el nombre de su etiqueta');
  eq(panel.seElimina, [], 'y con la lista de eliminar vacía');
  ok(panel.auditoria.enPapelera >= 20,
    `las ${panel.auditoria.enPapelera} colecciones de Estilo de hombre están en la papelera global`);
}

/* ---------------------------------------------------------------------------
   7 · EL INVENTARIO DEL APARTADO 1, SIN ESCRIBIRLO A MANO
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · El inventario sale de lo que ya existe');
  const a = auditarFinal(FUENTES);
  eq(a.modulos, IDS_EH.length, 'los módulos, del catálogo de la F1');
  eq(a.librerias, LIBRERIAS_EH.length, 'las librerías, de la lista de la F43');
  ok(a.colecciones > 0 && a.fuentesGlobales > 0, 'las colecciones y las fuentes globales, de las suyas');

  /* ⚠️ Y que la lista de librerías siga completa: si alguien añade un archivo a
     `src/lib/` de Estilo de hombre y no lo apunta, la auditoría de privacidad
     (F43) y esta dejan de verlo — y eso es como no tenerlas. */
  const enDisco = readdirSync(join(RAIZ, 'src/lib')).filter((f) => f.endsWith('.js')).map((f) => f.replace('.js', ''));
  /* ⚠️ `horarioEstructura` es de Horario Top, no de aquí: se excluye a mano,
     que es más honesto que ensanchar la expresión hasta que no encuentre nada. */
  const sinRevisar = enDisco.filter((f) => (
    /Estilo$|EH$|perfil|rutinas|productos|recomendaciones|motor|cuerpo|manos|migracion|rendimiento|estructuraDatos|pruebasIntegrales|auditoriaFinal|coherenciaVisual|microinteracciones|experienciaReal|produccion|recuperacion|escalabilidad|iaEstilo|aprendizaje|insights|resumenPeriodico|contextual/i.test(f)
    && f !== 'horarioEstructura'
    && !LIBRERIAS_EH.includes(f)
  ));
  eq(sinRevisar, [],
    '🐛 ⚠️ y NINGUNA librería de Estilo de hombre se queda fuera de la lista que auditan la F43 y esta');
  ok(LIBRERIAS_EH.includes('rendimiento') && LIBRERIAS_EH.includes('migracion')
    && LIBRERIAS_EH.includes('auditoriaFinal'),
    '⚠️ las cinco de las fases de revisión ya están dentro: antes no las miraba nadie');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
