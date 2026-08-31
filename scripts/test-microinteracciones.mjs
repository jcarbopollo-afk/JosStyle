// ============================================================================
// EH · Fase 50/65 — Microinteracciones y animaciones
//
// *"Cada acción debe tener una respuesta visual clara, rápida y elegante."*
//
// Lo que vigila esta prueba:
//   · las veinticuatro, cada una con dónde vive y para qué sirve
//   · las dos que NO se construyen, con su motivo (ya están resueltas)
//   · y el apartado 22: la misma acción, el mismo gesto, en las 51 pantallas
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { DURACION_FEEDBACK_MS, TARJETAS_DE_CARGA } from '../src/lib/estadosEstilo.js';
import { REGLAS_RENDIMIENTO, revisarRendimiento } from '../src/lib/rendimiento.js';
import {
  FUNCIONES_ANIMACION, funcionAnimacion, MICROINTERACCIONES, microinteraccion, noExisten,
  ESCALAS_AL_TOCAR, REGLAS_CONSISTENCIA, reglaConsistencia, revisarConsistencia,
  TEXTOS_MICRO, auditarMicrointeracciones, panelMicrointeracciones,
} from '../src/lib/microinteracciones.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const VISTA = readFileSync(join(RAIZ, 'src/views/EstiloHombreView.jsx'), 'utf8');
const UI = readFileSync(join(RAIZ, 'src/components/ui.jsx'), 'utf8');
const CSS = readFileSync(join(RAIZ, 'src/index.css'), 'utf8');

console.log('\n✨ EH · Fase 50/65 — Microinteracciones y animaciones\n');

/* ---------------------------------------------------------------------------
   1 · LAS VEINTICUATRO
   --------------------------------------------------------------------------- */
{
  console.log('1 · Las veinticuatro, con dónde viven');
  eq(MICROINTERACCIONES.length, 24, 'las veinticuatro del enunciado');
  eq(MICROINTERACCIONES.map((m) => m.apartado), Array.from({ length: 24 }, (_, i) => i + 1), 'y en su orden');
  const a = auditarMicrointeracciones(VISTA);
  eq(a.sinDonde, [], '⚠️ ninguna se queda sin decir dónde vive');
  eq(a.sinFuncion, [], '⚠️ apartado 23 — y cada una declara PARA QUÉ sirve');
  eq(FUNCIONES_ANIMACION.map((f) => f.id), ['confirmar', 'orientar', 'conectar', 'suavizar'],
    'las cuatro funciones que admite el enunciado');
  eq([a.animacionesNuevas, a.pantallasNuevas], [0, 0], 'esta fase no añade ninguna');
  ok(!!microinteraccion('volver') && !microinteraccion('inventada'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   2 · LAS DOS QUE NO SE CONSTRUYEN (decisión 4)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Arrastrar no se construye, y se dice por qué');
  eq(noExisten().map((m) => m.apartado), [2, 3, 16],
    '⚠️ tres no existen: mantener pulsado, arrastrar y los deslizantes');
  eq(auditarMicrointeracciones(VISTA).sinMotivo, [], '⚠️ y ninguna se queda sin motivo');
  ok(/flechas/.test(microinteraccion('arrastrar').donde),
    '⚠️ mover una plaquita ya se hace con flechas desde la Personalización');
  ok(/segundo mecanismo/.test(microinteraccion('arrastrar').porque),
    'y añadir arrastre sería un segundo mecanismo para lo mismo (la lección de la F48)');
  ok(/lector de pantalla/.test(microinteraccion('mantener').porque),
    '⚠️ con el motivo que de verdad importa: las flechas funcionan con el lector de pantalla');
  ok(/número continuo|listas y casillas/.test(microinteraccion('sliders').porque),
    'y no hay deslizantes porque no hay nada continuo que configurar');
}

/* ---------------------------------------------------------------------------
   3 · LA MISMA ACCIÓN, EL MISMO GESTO (apartado 22)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Consistencia en las 51 pantallas');
  eq(revisarConsistencia(VISTA), [], '⚠️ ni una inconsistencia en la vista de Estilo de hombre');

  const volver = (VISTA.match(/aria-label="Volver"/g) || []).length;
  ok(volver >= 40, `${volver} botones de volver, y todos iguales`);
  eq((VISTA.match(/ArrowLeft size=\{16\}/g) || []).length, volver,
    '⚠️ el mismo icono y el mismo tamaño en todos');

  /* ⚠️ Decisión 1 — el feedback al tocar vive en `ui.jsx`, no aquí. */
  ok(!/active:scale/.test(VISTA),
    '⚠️ y la vista NO se escribe su propio feedback al tocar: es el de JosStyle');
  ok(/active:scale/.test(UI), 'que sí está en los componentes globales');
  eq(ESCALAS_AL_TOCAR.length, 4, 'con su escalera de cuatro tamaños');
  ok(ESCALAS_AL_TOCAR.every((e) => UI.includes(e.clase)),
    '⚠️ y las cuatro existen de verdad en `ui.jsx`: la escalera es deliberada');

  /* La comprobación de la comprobación: cada regla caza su caso. */
  REGLAS_CONSISTENCIA.forEach((r) => {
    const malo = {
      volver_igual: '<button aria-label="Volver"></button>',
      sin_atras_inventado: '<button aria-label="Atrás"></button>',
      feedback_de_ui: '<button className="active:scale-95">',
      un_solo_exito: 'setTimeout(() => setVisible(false), 3000)',
    }[r.id];
    ok(revisarConsistencia(malo).some((x) => x.regla === r.id), `caza su caso: ${r.id}`);
  });
  ok(!!reglaConsistencia('volver_igual'), 'y las reglas se buscan por id');
}

/* ---------------------------------------------------------------------------
   4 · LO QUE YA ESTABA, Y NO SE REHACE (apartados 18, 19, 20 y 21)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · El éxito, la carga y el movimiento reducido');
  const a = auditarMicrointeracciones(VISTA);
  eq(a.feedbackMs, DURACION_FEEDBACK_MS, 'apartado 18 — el ✓ dura lo que dice la F41');
  ok(DURACION_FEEDBACK_MS <= 3000, 'y es corto: dos segundos');
  eq(a.tarjetasDeCarga, TARJETAS_DE_CARGA, 'apartado 19 — las tarjetas de esqueleto son las de la F41');
  ok(/export function CargandoEH/.test(VISTA), 'y su componente existe');
  ok(/export function HechoEH/.test(VISTA), 'igual que el del ✓');
  ok(/prefers-reduced-motion/.test(CSS), 'apartado 20 — `prefers-reduced-motion`, desde la F42');
  eq(a.reglaVelocidad, true, '⚠️ apartado 21 — y la regla de velocidad es la de la F44: no se escribe otra');
  eq(revisarRendimiento('EstiloHombreView.jsx', VISTA).filter((p) => p.regla === 'animacion_larga'), [],
    'ni una animación de medio segundo o más');
  ok(REGLAS_RENDIMIENTO.some((r) => r.id === 'animacion_larga'), 'que sigue existiendo donde nació');

  const panel = panelMicrointeracciones(VISTA);
  eq(panel.consistente, true, '🎯 y el veredicto es verde: la misma acción, el mismo gesto');
  eq(panel.resueltasDeOtraForma.length, 3, 'con las tres resueltas de otra forma, aparte');
  ok(panel.microinteracciones.every((m) => !m.existe || !!m.funcionQue),
    'y cada una explica para qué sirve su animación');
  ok(/queda bonito/.test(TEXTOS_MICRO.gratuita), 'con la frase del apartado 23');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
