// ---------------------------------------------------------------------------
// Entrega 2 · ME Fase 1 — pruebas de comportamiento del sistema de módulos
// activables/desactivables.
//
// La prueba de humo comprueba que las vistas no revientan. Esto comprueba algo
// distinto y más importante: que desactivar un módulo **de verdad lo hace
// desaparecer** de la interfaz, que es el requisito central de la fase
// ("la interfaz debe reconstruirse automáticamente según los módulos activos").
//
// Se renderiza el Dashboard a HTML y se busca/no-se-busca el texto de cada
// módulo. Es una comprobación de caja negra sobre el resultado real.
// ---------------------------------------------------------------------------
import React from 'react';
import { renderToString } from 'react-dom/server';
import DashboardView from '../src/views/DashboardView.jsx';
import {
  DEFAULT_PERFIL, DEFAULT_ECONOMIA, DEFAULT_CALISTENIA, DEFAULT_SALUD, DEFAULT_NUTRICION,
  DEFAULT_ESTUDIOS, DEFAULT_NEGOCIO, DEFAULT_PRODUCTIVIDAD, DEFAULT_OBJETIVOS, DEFAULT_DIARIO,
  DEFAULT_BIBLIOTECA, DEFAULT_FE, DEFAULT_BIENESTAR, DEFAULT_PERSONALIZACION,
  DEFAULT_NOTIFICACIONES, DEFAULT_CALENDARIO, ACCENTS, DESCRIPCIONES_MODULOS,
} from '../src/tokens.js';
import { calcularResumenModulo } from '../src/lib/resumenesHub.js';

const accent = ACCENTS[0].value;
const noop = () => {};
const HOY = new Date().toISOString().slice(0, 10);

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

// Estado con datos en todos los módulos, para que todas las tarjetas tengan algo que enseñar.
const base = {
  perfil: { ...DEFAULT_PERFIL, nombre: 'Josué' },
  sueno: [{ id: '1', fecha: HOY, horaDormir: '23:30', horaDespertar: '07:00', calidad: 4 }],
  calistenia: { ...DEFAULT_CALISTENIA, Planche: { nivel: 35, progresion: [], prs: [], sesiones: [{ id: 's', fecha: HOY }] } },
  futbol: [], economia: { saldoInicial: 100, hucha: 0, movimientos: [{ id: 'm', fecha: HOY, tipo: 'gasto', cantidad: 12 }] },
  salud: { medidas: [{ id: 'x', fecha: HOY, peso: 72 }], historial: [] },
  nutricion: { comidas: [{ id: 'c', fecha: HOY, nombre: 'Avena', calorias: 350 }], agua: {}, favoritos: [] },
  estudios: DEFAULT_ESTUDIOS, negocio: DEFAULT_NEGOCIO,
  productividad: { ...DEFAULT_PRODUCTIVIDAD, tareas: [{ id: 't', texto: 'Repasar', hecha: false, fechaLimite: HOY }] },
  objetivos: { lista: [{ id: 'o', texto: 'Handstand 30s', plazo: '90 días', cumplido: false, fechaCreacion: HOY }], ultimaRevision: null },
  diario: DEFAULT_DIARIO, biblioteca: DEFAULT_BIBLIOTECA,
  relacion: { nombre: 'María', fechas: [{ id: 'r', etiqueta: 'Aniversario', fecha: HOY }] },
  fe: DEFAULT_FE, bienestar: DEFAULT_BIENESTAR, calendario: DEFAULT_CALENDARIO,
  notificaciones: DEFAULT_NOTIFICACIONES,
};

function render(ocultos) {
  const estado = { ...base, personalizacion: { ...DEFAULT_PERSONALIZACION, ocultos } };
  return renderToString(React.createElement(DashboardView, {
    ...estado, favoritas: [], modo: null, derivadosCalendario: [],
    resumenes: Object.fromEntries(Object.keys(DESCRIPCIONES_MODULOS).map((id) => [id, calcularResumenModulo(id, estado)])),
    dashboardOcultos: [], modulosDesactivados: ocultos, onNavegar: noop, accent,
  }));
}

console.log('\n═══ ME Fase 1 — módulos activables/desactivables ═══\n');

// 1. Con todo activo, los módulos aparecen.
{
  const html = render([]);
  comprobar('Con todo activo, "Sueño" aparece en Hoy', html.includes('Sueño'));
  comprobar('Con todo activo, "Diario" aparece en Hoy', html.includes('Diario'));
  comprobar('Con todo activo, "Bienestar" aparece en Hoy', html.includes('Bienestar'));
  comprobar('Con todo activo, la fila de Acciones rápidas existe', html.includes('Acciones rápidas'));
}

// 2. Desactivar un módulo lo quita de verdad. ESTE es el requisito de la fase:
//    antes de ME Fase 1, `ocultos` solo filtraba los hubs y el Dashboard lo ignoraba.
{
  const html = render(['diario']);
  comprobar('Al desactivar Diario, desaparece de Hoy', !html.includes('>Diario<'), 'sigue apareciendo');
  comprobar('...y el resto sigue ahí', html.includes('Bienestar'));
}

// 3. Relación desactivada no deja asomar el nombre de la pareja en la pantalla principal.
{
  const conRelacion = render([]);
  const sinRelacion = render(['relacion']);
  comprobar('Con Relación activa, su recordatorio aparece', conRelacion.includes('Aniversario'));
  comprobar('Con Relación desactivada, NO asoma nada suyo en Hoy', !sinRelacion.includes('Aniversario'), 'sigue asomando');
}

// 4. Las acciones rápidas se filtran, y la fila entera desaparece si no queda ninguna.
{
  const sinSueno = render(['sueno']);
  comprobar('Al desactivar Sueño, su acción rápida desaparece',
    (sinSueno.match(/Sueño/g) || []).length === 0, 'queda alguna mención');

  const sinNinguna = render(['sueno', 'economia', 'productividad', 'objetivos']);
  comprobar('Sin ninguna acción rápida disponible, la fila entera se va',
    !sinNinguna.includes('Acciones rápidas'), 'queda el encabezado vacío');
}

// 5. Desactivar TODO no rompe nada ni deja encabezados huérfanos.
{
  const todos = Object.keys(DESCRIPCIONES_MODULOS).filter((id) => id !== 'ajustes');
  const html = render(todos);
  comprobar('Con todo desactivado, Hoy sigue renderizando', html.length > 0);
  comprobar('...sin encabezado de Acciones rápidas', !html.includes('Acciones rápidas'));
  comprobar('...y el saludo y la puntuación siguen ahí', html.includes('Josué'));
}

// 6. Desactivar no toca los datos: el estado que se pasa es idéntico salvo `ocultos`.
{
  const antes = JSON.stringify(base);
  render(['sueno', 'diario', 'relacion']);
  comprobar('Renderizar con módulos desactivados no muta los datos', JSON.stringify(base) === antes);
}

// 7. Toda entrada de navegación tiene descripción en el centro de módulos.
{
  const sinDescripcion = ['salud', 'sueno', 'nutricion', 'entreno', 'calendario', 'estudios',
    'negocio', 'productividad', 'objetivos', 'diario', 'fe', 'biblioteca', 'relacion',
    'bienestar', 'estadisticas', 'predicciones', 'logros', 'economia']
    .filter((id) => !DESCRIPCIONES_MODULOS[id]);
  comprobar('Todos los módulos tienen descripción', sinDescripcion.length === 0, sinDescripcion.join(', '));

  const largas = Object.entries(DESCRIPCIONES_MODULOS).filter(([, d]) => d.length > 80).map(([id]) => id);
  comprobar('Ninguna descripción pasa de 80 caracteres (apartado 11)', largas.length === 0, largas.join(', '));
}

console.log('');
if (fallos) { console.error(`═══ ${fallos} PRUEBA(S) FALLIDA(S) ═══\n`); process.exit(1); }
console.log('═══ TODAS LAS PRUEBAS PASAN ═══\n');
