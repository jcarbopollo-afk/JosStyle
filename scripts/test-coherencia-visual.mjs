// ============================================================================
// EH · Fase 49/65 — Revisión visual final y coherencia
//
// *"Que tenga personalidad propia, pero que siga pareciendo JC Fitness."*
//
// ⚠️ La referencia **no es una lista escrita a mano**: son las otras
// veintiséis vistas de JosStyle. Si Estilo de hombre usa un radio, un tamaño de
// texto o un espaciado que no usa nadie más, esto falla.
// ============================================================================

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { ESTADOS_GESTION } from '../src/lib/gestionEstilo.js';
import { ESTADOS_MODULO } from '../src/lib/miEstilo.js';
import {
  CATEGORIAS_VISUALES, categoriaVisual, vocabulario, soloEn, inventaAlgo, EXCEPCIONES, esExcepcion,
  REGLAS_VISUALES, reglaVisual, revisarVisual, LISTAS_DE_ESTADO, revisarEstados,
  APARTADOS_VISUALES, apartadoVisual, TEXTOS_COHERENCIA, auditarCoherencia,
  panelCoherencia,
} from '../src/lib/coherenciaVisual.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const VISTAS = join(RAIZ, 'src/views');
const EH = readFileSync(join(VISTAS, 'EstiloHombreView.jsx'), 'utf8');
const OTRAS = readdirSync(VISTAS)
  .filter((f) => f.endsWith('.jsx') && f !== 'EstiloHombreView.jsx')
  .map((f) => readFileSync(join(VISTAS, f), 'utf8'));
const UI = readFileSync(join(RAIZ, 'src/components/ui.jsx'), 'utf8');
const CSS = readFileSync(join(RAIZ, 'src/index.css'), 'utf8');

console.log('\n🎨 EH · Fase 49/65 — Revisión visual final y coherencia\n');

/* ---------------------------------------------------------------------------
   1 · EL VOCABULARIO, COMPARADO CON EL RESTO (decisión 1)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Estilo de hombre no se inventa nada');
  ok(OTRAS.length >= 20, `se compara contra las otras ${OTRAS.length} vistas de JosStyle`);
  const vocab = vocabulario(EH);
  ok(vocab.radios.length > 0 && vocab.textos.length > 0, 'y se saca su vocabulario de verdad');

  const inventado = soloEn(EH, OTRAS);
  eq(inventado.radios, [], '⚠️ ni un radio de borde que no use el resto de la aplicación');
  eq(inventado.textos, [], 'ni un tamaño de texto');
  /* ⚠️ Los dos espaciados que solo usa Estilo de hombre son `-m-1.5` y su
     vertical: los introdujo la F42 para llegar a 44 px de área táctil SIN
     cambiar el dibujo. Están declarados como excepción, con su motivo. */
  eq(inventado.espaciados, ['m-1.5', 'my-1.5'],
    'los dos únicos espaciados suyos son los del área táctil de la F42');
  ok(EXCEPCIONES.every((e) => !!e.porque), 'y están declarados con su motivo');
  eq(inventaAlgo(EH, OTRAS), [],
    '⚠️ 🎯 la condición de finalización: nada que parezca de otra aplicación');

  /* ⚠️ Decisión 2 — la hoja inferior lleva `rounded-t-3xl`, que es el mismo
     lenguaje que `rounded-3xl`: lo que se compara es el TAMAÑO del radio, no la
     esquina. Sin normalizar, el revisor habría cazado la única hoja inferior. */
  ok(/rounded-t-3xl/.test(EH), 'la hoja inferior existe y usa un radio por un lado');
  ok(vocabulario(EH).radios.includes('rounded-3xl'),
    '⚠️ y se compara como su familia: el lado no es el lenguaje visual');

  /* La comprobación de la comprobación: con un token inventado, salta. */
  const raro = `${EH}\n<div className="rounded-[7px] text-[42px] p-13">`;
  const conRaro = soloEn(raro, OTRAS);
  ok(conRaro.radios.includes('rounded-[7px]'), '⚠️ y con un radio inventado, SALTA');
  ok(conRaro.textos.includes('text-[42px]'), 'con un tamaño inventado, también');
}

/* ---------------------------------------------------------------------------
   2 · LAS REGLAS QUE NO DEPENDEN DE NADIE (apartados 7 y 17)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Ni gradientes, ni sombras grandes, ni colores fuera del tema');
  eq(auditarCoherencia(EH, OTRAS).sinEjemplo, [],
    '⚠️ todas las reglas traen un ejemplo que sí incumple (la lección de la F42)');
  REGLAS_VISUALES.forEach((r) => {
    ok(revisarVisual('x.jsx', r.ejemploMalo).some((p) => p.regla === r.id), `caza su ejemplo: ${r.id}`);
  });

  eq(revisarVisual('EstiloHombreView.jsx', EH), [],
    '⚠️ y la vista de Estilo de hombre no rompe ninguna');
  eq(revisarVisual('ui.jsx', UI), [], 'ni los componentes globales');
  eq(revisarVisual('x.jsx', '// bg-gradient-to-r\n/* text-white */'), [],
    '⚠️ pero un ejemplo dentro de un comentario NO cuenta');

  ok(/prefers-reduced-motion/.test(CSS),
    'apartado 8 — y las animaciones siguen respetando `prefers-reduced-motion` (F42)');
  eq(revisarVisual('EstiloHombreView.jsx', EH).filter((p) => p.regla === 'animacion_infinita'), [],
    '⚠️ ni una animación que no pare');
}

/* ---------------------------------------------------------------------------
   3 · LOS ESTADOS, CON SU TEXTO (apartado 9)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Un estado nunca es solo un color');
  eq(revisarEstados(), [], '⚠️ ningún estado se queda sin texto');
  ok(LISTAS_DE_ESTADO.length === 2, 'se revisan las listas que ya existen, sin crear una tercera');
  ok(ESTADOS_GESTION.length > 0 && ESTADOS_MODULO.length > 0, 'y las dos tienen estados dentro');
  ok(ESTADOS_GESTION.every((e) => !!e.nombre || !!e.texto || !!e.etiqueta),
    'los de Gestionar apartados llevan su palabra');
  ok(ESTADOS_MODULO.every((e) => !!e.nombre || !!e.texto || !!e.etiqueta),
    'y los de Mi estilo, también');
}

/* ---------------------------------------------------------------------------
   4 · LOS VEINTE APARTADOS
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Los veinte apartados');
  eq(APARTADOS_VISUALES.length, 20, 'los veinte del enunciado');
  eq(APARTADOS_VISUALES.map((a) => a.apartado), Array.from({ length: 20 }, (_, i) => i + 1), 'y en su orden');
  const a = auditarCoherencia(EH, OTRAS);
  eq(a.sinDonde, [], 'ninguno se queda sin decir dónde se cumple');
  eq(a.deJosue, ['responsive', 'comparacion'], '⚠️ dos necesitan ojos, y se dicen');
  eq(a.sinMotivo, [], 'con su motivo cada uno');
  ok(/ojos|Josué/i.test(apartadoVisual('comparacion').porque || apartadoVisual('comparacion').donde),
    'y el de comparar con el Dashboard es de Josué');
  ok(!!apartadoVisual('modo_oscuro').limite,
    '⚠️ el modo oscuro se comprueba por código, pero se dice que verlo es cosa suya');
  eq([a.pantallasNuevas, a.tokensNuevos], [0, 0], 'esta fase no añade ni una pantalla ni un token');

  const panel = panelCoherencia(EH, OTRAS);
  eq(panel.coherente, true, '🎯 y el veredicto es verde: JosStyle + personalidad propia');
  eq(panel.meta, TEXTOS_COHERENCIA.meta, 'con la frase del apartado 20');
  eq(panel.pendienteDeJosue.length, 2, 'y lo que le toca mirar a él, aparte');
  ok(Object.keys(panel.vocabulario).length === CATEGORIAS_VISUALES.length,
    'el panel enseña el vocabulario por categorías');
  ok(!!categoriaVisual('radios') && !categoriaVisual('inventada'), 'que se buscan por id');
  ok(!!reglaVisual('gradiente'), 'y las reglas también');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
