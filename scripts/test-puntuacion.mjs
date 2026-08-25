// Pruebas de src/lib/puntuacion.js, ejecutables con Node porque son funciones
// puras sin JSX (mismo criterio con el que ya se verificó colorEngine.js).
//
//   node scripts/test-puntuacion.mjs
//
// El caso 1 es el que motivó todo el arreglo: con la fórmula anterior daba 100
// para siempre en cuanto había cualquier dato histórico.

import { puntuacionDelDia, mensajePuntuacion } from '../src/lib/puntuacion.js';

const HOY = '2026-08-25';
const AYER = '2026-08-24';
const HACE_UN_MES = '2026-07-25';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); }
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
}

console.log('\n═══ puntuacionDelDia ═══\n');

// 1. EL BUG ORIGINAL: datos antiguos, nada hoy. Antes daba 100. Debe dar 0.
{
  const r = puntuacionDelDia({
    sueno: [{ fecha: HACE_UN_MES }],
    calistenia: { Planche: { nivel: 40, sesiones: [{ fecha: HACE_UN_MES }] } },
    nutricion: { comidas: [{ fecha: HACE_UN_MES }], agua: {} },
  }, HOY);
  comprobar('Datos de hace un mes y nada hoy → 0, no 100', r.valor === 0, `dio ${r.valor}`);
  comprobar('...y las 3 áreas siguen contando como "en uso"', r.total === 3, `total=${r.total}`);
}

// 2. Día completo.
{
  const r = puntuacionDelDia({
    sueno: [{ fecha: HOY }],
    calistenia: { Planche: { sesiones: [{ fecha: HOY }] } },
    nutricion: { comidas: [{ fecha: HOY }], agua: {} },
  }, HOY);
  comprobar('Todo registrado hoy → 100', r.valor === 100, `dio ${r.valor}`);
  comprobar('Mensaje de día completo', mensajePuntuacion(r).includes('completo'));
}

// 3. Áreas sin usar no penalizan.
{
  const soloSueno = puntuacionDelDia({ sueno: [{ fecha: HOY }] }, HOY);
  comprobar('Solo uso Sueño y lo registro → 100 (el resto no penaliza)', soloSueno.valor === 100, `dio ${soloSueno.valor}`);
  comprobar('...y el desglose tiene 1 sola área', soloSueno.total === 1, `total=${soloSueno.total}`);
}

// 4. Usuario nuevo: null, nunca un 0 desmotivador.
{
  const r = puntuacionDelDia({}, HOY);
  comprobar('Sin ningún dato → valor null, no 0', r.valor === null, `dio ${r.valor}`);
  comprobar('...y hayDatos es false', r.hayDatos === false);
  comprobar('...con mensaje de bienvenida', mensajePuntuacion(r).includes('Registra algo'));
}

// 5. El sueño de anoche registrado hoy cuenta (se anota por la mañana).
{
  const r = puntuacionDelDia({ sueno: [{ fecha: AYER }] }, HOY);
  comprobar('Sueño con fecha de ayer cuenta como hecho hoy', r.valor === 100, `dio ${r.valor}`);
}

// 6. Parcial: exactamente la mitad.
{
  const r = puntuacionDelDia({
    sueno: [{ fecha: HOY }],
    nutricion: { comidas: [{ fecha: HACE_UN_MES }], agua: {} },
  }, HOY);
  comprobar('1 de 2 áreas cumplidas → 50', r.valor === 50, `dio ${r.valor}`);
  comprobar('...y el mensaje nombra lo que falta', mensajePuntuacion(r).toLowerCase().includes('nutrición'));
}

// 7. Hábitos: cuentan solo si están TODOS marcados.
{
  const dos = { productividad: { habitos: [
    { historial: { [HOY]: true } },
    { historial: {} },
  ] } };
  comprobar('Con un hábito sin marcar → 0', puntuacionDelDia(dos, HOY).valor === 0);

  const todos = { productividad: { habitos: [
    { historial: { [HOY]: true } },
    { historial: { [HOY]: true } },
  ] } };
  comprobar('Con todos los hábitos marcados → 100', puntuacionDelDia(todos, HOY).valor === 100);
}

// 8. Tareas vencidas sin hacer penalizan; sin tareas vencidas, el área no cuenta.
{
  const vencida = { productividad: { tareas: [{ hecha: false, fechaLimite: AYER }] } };
  comprobar('Tarea vencida sin hacer → área en uso y no cumplida', puntuacionDelDia(vencida, HOY).valor === 0);

  const futura = { productividad: { tareas: [{ hecha: false, fechaLimite: '2027-01-01' }] } };
  comprobar('Tarea futura → el área no entra en el cálculo', puntuacionDelDia(futura, HOY).hayDatos === false);
}

// 9. Salud: ventana de 7 días, no diaria.
{
  const reciente = { salud: { medidas: [{ fecha: '2026-08-20' }] } };
  comprobar('Medida de hace 5 días → cuenta como al día', puntuacionDelDia(reciente, HOY).valor === 100);

  const vieja = { salud: { medidas: [{ fecha: '2026-08-01' }] } };
  comprobar('Medida de hace 24 días → no cuenta', puntuacionDelDia(vieja, HOY).valor === 0);
}

// 10. El valor siempre está en rango y el desglose es coherente.
{
  const r = puntuacionDelDia({
    sueno: [{ fecha: HOY }],
    diario: { entradas: [{ fecha: HACE_UN_MES }] },
    estudios: { horas: [{ fecha: HOY }] },
  }, HOY);
  comprobar('Valor dentro de 0-100', r.valor >= 0 && r.valor <= 100, `dio ${r.valor}`);
  comprobar('detalle.length coincide con total', r.detalle.length === r.total);
  comprobar('hechos coincide con los marcados en detalle',
    r.hechos === r.detalle.filter((d) => d.hecho).length);
}

// 11. No revienta con datos corruptos o incompletos.
{
  const casos = [
    undefined, null, {},
    { sueno: null, calistenia: null },
    { calistenia: { Planche: null } },
    { nutricion: { comidas: null, agua: null } },
    { productividad: { habitos: [{ /* sin historial */ }] } },
  ];
  let robusto = true;
  for (const c of casos) {
    try { puntuacionDelDia(c, HOY); } catch (e) { robusto = false; console.error('    excepción con', JSON.stringify(c), e.message); }
  }
  comprobar('No lanza excepción con datos nulos/corruptos', robusto);
}

// 12. Módulos desactivados (Entrega 2 · ME Fase 1) no cuentan para la puntuación.
{
  const estado = {
    sueno: [{ fecha: HACE_UN_MES }],   // usa Sueño, pero no lo ha registrado hoy
    diario: { entradas: [{ fecha: HOY }] },
  };
  comprobar('Sin desactivar nada → 50 (1 de 2)', puntuacionDelDia(estado, HOY).valor === 50);
  comprobar('Con Sueño desactivado → 100 (ya no penaliza)',
    puntuacionDelDia(estado, HOY, ['sueno']).valor === 100);
  comprobar('...y el desglose deja de mencionarlo',
    !puntuacionDelDia(estado, HOY, ['sueno']).detalle.some((d) => d.id === 'sueno'));
  comprobar('Desactivándolo todo → null, no 0',
    puntuacionDelDia(estado, HOY, ['sueno', 'diario']).valor === null);
  comprobar('Un valor no-array en desactivados se ignora sin romper',
    puntuacionDelDia(estado, HOY, null).valor === 50);
}

console.log('');
if (fallos) { console.error(`═══ ${fallos} PRUEBA(S) FALLIDA(S) ═══\n`); process.exit(1); }
console.log('═══ TODAS LAS PRUEBAS PASAN ═══\n');
