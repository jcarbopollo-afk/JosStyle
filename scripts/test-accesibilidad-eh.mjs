// ============================================================================
// EH · Fase 42/65 — Accesibilidad y usabilidad
//
// La revisión completa del apartado 19, y lo que gobierna la fase:
//   · "las plaquitas pueden ser pequeñas, pero nunca difíciles de pulsar"
//   · el color NUNCA va solo
//   · lo que ya estaba resuelto (contraste, animaciones, tamaño) no se rehace
//   · tres apartados solo se pueden comprobar en un móvil, y se dice
//   · y un revisor que no puede fallar no sirve: cada regla caza su ejemplo malo
// ============================================================================

import { readFileSync, readdirSync } from 'node:fs';
import { MODULOS_EH } from '../src/lib/estiloDeHombre.js';
import { ESTADOS_GESTION } from '../src/lib/gestionEstilo.js';
import { ESTADOS_MODULO } from '../src/lib/miEstilo.js';
import { NIVELES_ESTILO } from '../src/lib/perfilEstilo.js';
import { ESTADOS_EH } from '../src/lib/estadosEstilo.js';
import {
  AREA_TACTIL_MINIMA, CLASES_AREA, ICONOS_SUELTOS, CATALOGOS_DE_ESTADO,
  etiquetaDeEstado, estadosSoloColor, YA_RESUELTO_A11Y, SOLO_EN_UN_MOVIL,
  REGLAS_A11Y, reglaA11Y, revisarPantalla, TEXTOS_A11Y, MAXIMO_DESCRIPCION,
  descripcionesLargas, auditarAccesibilidad,
} from '../src/lib/accesibilidadEH.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const RAIZ = new URL('..', import.meta.url).pathname;
const leer = (r) => readFileSync(new URL(r, import.meta.url), 'utf8');
const VISTA = leer('../src/views/EstiloHombreView.jsx');
const UI = leer('../src/components/ui.jsx');
const CSS = leer('../src/index.css');
const FUENTE = leer('../src/lib/accesibilidadEH.js');

console.log('\n♿ EH · Fase 42/65 — Accesibilidad y usabilidad\n');

/* ---------------------------------------------------------------------------
   1 · EL REVISOR CAZA COSAS DE VERDAD (decisión 6)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Un revisor que no puede fallar no sirve');
  ok(REGLAS_A11Y.length >= 5, 'hay reglas declaradas');
  ok(REGLAS_A11Y.every((r) => typeof r.revisar === 'function'), 'y todas saben revisar');
  ok(REGLAS_A11Y.every((r) => typeof r.que === 'string' && r.que.length > 10),
    'y todas explican qué comprueban');
  eq(auditarAccesibilidad().sinEjemplo, [], 'todas declaran si tienen ejemplo malo');
  ok(!!reglaA11Y('area_tactil') && !reglaA11Y('inventada'), 'se buscan por id');

  // ⚠️ La comprobación de la comprobación.
  REGLAS_A11Y.filter((r) => r.ejemploMalo).forEach((r) => {
    const res = revisarPantalla(r.ejemploMalo);
    ok(res.problemas.some((p) => p.regla === r.id),
      `⚠️ "${r.id}" caza su propio ejemplo malo`);
  });
  eq(revisarPantalla('<button className="p-2" aria-label="Cerrar"><X size={13} /></button>').problemas, [],
    'y un botón bien hecho no da ningún problema');
  eq(revisarPantalla('').problemas, [], 'ni un archivo vacío');

  // 🐛 El falso positivo que costó una vuelta: un botón cuyo texto es {label}.
  eq(revisarPantalla('<button onClick={x}><Plus size={12} /><span>{label}</span></button>').problemas, [],
    '⚠️ y un botón cuyo nombre es una expresión NO es un botón de solo icono (10.ª vez)');
}

/* ---------------------------------------------------------------------------
   2 · LA APLICACIÓN, REVISADA (apartados 1, 2, 9 y 14 · pruebas 6, 7, 8 y 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · La aplicación entera, revisada');
  const r = revisarPantalla(VISTA);
  eq(r.problemas, [], '⚠️ Estilo de hombre no incumple ninguna regla');
  eq(r.limpia, true, 'y el revisor lo dice');

  // Y el resto de la aplicación, de paso.
  const otras = readdirSync(new URL('../src/views', import.meta.url))
    .map((f) => ({ f, r: revisarPantalla(readFileSync(new URL(`../src/views/${f}`, import.meta.url), 'utf8')) }))
    .filter((x) => x.r.problemas.length > 0);
  eq(otras.map((x) => x.f), [], '⚠️ ni ninguna otra pantalla de JosStyle');
  eq(revisarPantalla(UI).problemas, [], 'ni los componentes compartidos');

  // ⚠️ Y la razón de ser de la fase, comprobada sobre el código de verdad.
  eq(AREA_TACTIL_MINIMA, 44, 'el área táctil mínima es la de Apple');
  ok(CLASES_AREA.length >= 5, 'y hay varias formas de declararla');
  ok(ICONOS_SUELTOS.includes('X') && ICONOS_SUELTOS.includes('Trash2'),
    'los iconos que se usan solos están listados');
  ok(/aria-label="Cerrar" className="p-1\.5 -m-1\.5"/.test(VISTA),
    '⚠️ y el botón de cerrar tiene su zona de toque sin cambiar de tamaño');
  ok(/label=\{panel\.interruptor\}/.test(VISTA) && /label=\{t\.nombre\}/.test(VISTA),
    '⚠️ y los interruptores dicen qué encienden (apartado 14)');
}

/* ---------------------------------------------------------------------------
   3 · EL COLOR NUNCA VA SOLO (apartado 6 · pruebas 1 y 2)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · El color nunca va solo');
  eq(estadosSoloColor(), [], '⚠️ ningún estado se distingue solo por su color');
  ok(CATALOGOS_DE_ESTADO.length >= 3, 'y están todos los catálogos del módulo');
  CATALOGOS_DE_ESTADO.forEach((c) => {
    ok((c.lista || []).length > 0, `${c.id} tiene estados`);
    ok((c.lista || []).every((x) => !!x.nombre && !!x.icono),
      `⚠️ y todos los de ${c.id} traen icono Y palabra`);
  });
  eq(etiquetaDeEstado(ESTADOS_GESTION[0]), '🟢 Activo',
    '⚠️ "🟢 Activo también debe tener: Activo", con esas palabras');
  eq(etiquetaDeEstado(null), '', 'y sin estado no se inventa una etiqueta');
  eq(etiquetaDeEstado({ icono: '🔴' }), '🔴', 'lo que hay, sin rellenar lo que falta');

  // La comprobación cazaría uno mal hecho.
  ok(ESTADOS_MODULO.every((x) => !!x.nombre), 'los de Mi estilo tienen nombre');
  ok(NIVELES_ESTILO.every((x) => !!x.nombre), 'y los tres niveles de estilo también');
  ok(ESTADOS_EH.every((e) => !!e.titulo), 'y los estados de la F41 llevan su texto');
}

/* ---------------------------------------------------------------------------
   4 · LO QUE YA ESTABA RESUELTO (apartados 5, 7, 8, 12, 13 y 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Lo que ya estaba resuelto, y no se rehace');
  eq(YA_RESUELTO_A11Y.map((x) => x.apartado).sort((a, b) => a - b), [5, 7, 8, 12, 13, 15],
    'seis apartados los resuelven sitios que ya existen');
  ok(YA_RESUELTO_A11Y.every((x) => !!x.donde), 'y cada uno dice dónde');

  // ⚠️ Y de verdad siguen ahí (pruebas 1, 2 y 13).
  ok(/@media \(prefers-reduced-motion: reduce\)/.test(CSS),
    '⚠️ las animaciones respetan la preferencia del sistema (apartado 7)');
  ok(/data-animaciones/.test(CSS), 'y el ajuste propio de JosStyle también');
  ok(/data-radio|data-densidad/.test(CSS), 'y la densidad, que es de Ajustes');

  eq(auditarAccesibilidad().sistemasNuevosDeColor, 0,
    '⚠️ esta fase NO crea un segundo sistema de color (regla 2)');
  eq(auditarAccesibilidad().sistemasNuevosDeTexto, 0, 'ni uno de tamaños de texto');
  ok(!/COLORS\s*=|const\s+PALETA|#[0-9a-fA-F]{6}/.test(FUENTE.replace(/\/\*[\s\S]*?\*\//g, '')),
    '⚠️ y no hay ni un color suelto en esta librería');
}

/* ---------------------------------------------------------------------------
   5 · LO QUE SOLO SE PUEDE VER EN UN MÓVIL (apartados 10, 16 y 17)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Lo que hace falta un teléfono para comprobar');
  eq(SOLO_EN_UN_MOVIL.map((x) => x.apartado), [10, 16, 17],
    '⚠️ el teclado, la rotación y los cuatro dispositivos');
  ok(SOLO_EN_UN_MOVIL.every((x) => typeof x.que === 'string' && x.que.length > 15),
    'y cada uno dice qué hay que mirar');
  eq(auditarAccesibilidad().soloEnUnMovil, [10, 16, 17],
    '⚠️ y se declaran en vez de darlos por buenos sin haberlos probado');
}

/* ---------------------------------------------------------------------------
   6 · TEXTO Y JERARQUÍA (apartado 3)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Títulos claros y descripciones cortas');
  eq(descripcionesLargas(), [],
    '⚠️ ninguna descripción de la portada es un párrafo');
  ok(MAXIMO_DESCRIPCION > 0 && MAXIMO_DESCRIPCION <= 160, 'con un tope declarado');
  ok(MODULOS_EH.every((m) => !!m.nombre && m.nombre.length <= 24),
    'y los nombres de los apartados son cortos');
  ok(Object.values(TEXTOS_A11Y).every((t) => typeof t === 'string' && t.length > 0),
    'ningún texto vacío');
  ok(!Object.values(TEXTOS_A11Y).some((t) => /fase \d|apartado \d/i.test(t)),
    'y ninguno menciona fases ni apartados (regla 9)');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
