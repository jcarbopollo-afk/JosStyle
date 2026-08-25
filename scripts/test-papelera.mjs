// ---------------------------------------------------------------------------
// Entrega 2 · ME Fase 3 — pruebas de la papelera global.
//
//   node --import ./scripts/resolver-vite.mjs scripts/test-papelera.mjs
//
// Lo importante que se comprueba aquí es que la recuperación es REAL: el
// elemento vuelve a su sitio, en su posición original, con sus datos íntegros —
// no una copia nueva con otro id.
// ---------------------------------------------------------------------------
import {
  CATALOGO_PAPELERA, DEFAULT_PAPELERA, RETENCION_PAPELERA_DIAS, OPCIONES_RETENCION,
  claveCatalogo, prepararEliminacion, prepararRestauracion, purgarCaducados, conArrastrados,
  describirEntrada, tiempoDesde, diasRestantes, ordenarPapelera,
} from '../src/lib/papelera.js';

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

const AHORA = '2026-08-25T12:00:00.000Z';
const hace = (h) => new Date(new Date(AHORA).getTime() - h * 3600000).toISOString();

console.log('\n═══ ME Fase 3 — papelera global ═══\n');

// --- Catálogo ---
{
  // 27 desde ME Fase 4 (la auditoría añadió `estudios.programas`, que se podía crear y
  // no borrar) y 28 desde AR Fase 1, con las prendas del Armario.
  comprobar('El catálogo cubre 29 colecciones', Object.keys(CATALOGO_PAPELERA).length === 29,
    String(Object.keys(CATALOGO_PAPELERA).length));
  comprobar('Toda entrada declara módulo, tipo y campos',
    Object.values(CATALOGO_PAPELERA).every((c) => c.modulo && c.tipo && Array.isArray(c.campos)));
  comprobar('La clave del catálogo coincide con modulo.coleccion',
    Object.entries(CATALOGO_PAPELERA).every(([k, c]) => k === claveCatalogo(c.modulo, c.coleccion)));
  comprobar('Relación está marcada como privada', CATALOGO_PAPELERA['relacion.fechas'].privado === true);
  comprobar('Ningún otro módulo está marcado como privado',
    Object.entries(CATALOGO_PAPELERA).filter(([, c]) => c.privado).length === 1);
  comprobar('Los módulos con archivos en Storage NO están en el catálogo',
    !['saludFotos', 'calisteniaVideos', 'bibliotecaArchivos'].some((m) => CATALOGO_PAPELERA[m]));
}

// --- Eliminar ---
{
  const productividad = { tareas: [{ id: 'a', texto: 'Uno' }, { id: 'b', texto: 'Dos' }, { id: 'c', texto: 'Tres' }] };
  const r = prepararEliminacion(productividad, 'productividad', 'tareas', 'b', AHORA);

  comprobar('Eliminar quita el elemento de la lista', r.moduloActualizado.tareas.length === 2);
  comprobar('...y quita el correcto', !r.moduloActualizado.tareas.some((t) => t.id === 'b'));
  comprobar('...sin tocar el resto', r.moduloActualizado.tareas.map((t) => t.id).join() === 'a,c');
  comprobar('No muta el original', productividad.tareas.length === 3);
  comprobar('La entrada guarda el objeto íntegro', r.entrada.datos.texto === 'Dos');
  comprobar('La entrada guarda la posición original', r.entrada.indice === 1);
  comprobar('La entrada guarda el id original', r.entrada.idOriginal === 'b');
  comprobar('La entrada conoce su tipo legible', r.entrada.tipo === 'Tarea');
  comprobar('La entrada tiene su propio id, distinto del original', r.entrada.id && r.entrada.id !== 'b');
  comprobar('La entrada guarda cuándo se eliminó', r.entrada.eliminadoEn === AHORA);

  comprobar('Eliminar algo inexistente devuelve null',
    prepararEliminacion(productividad, 'productividad', 'tareas', 'zzz', AHORA) === null);
}

// --- Módulo que ES la lista (sueno, futbol) ---
{
  const sueno = [{ id: 's1', fecha: '2026-08-24' }, { id: 's2', fecha: '2026-08-25' }];
  const r = prepararEliminacion(sueno, 'sueno', null, 's1', AHORA);
  comprobar('Funciona con un módulo que es directamente una lista', Array.isArray(r.moduloActualizado));
  comprobar('...quitando el elemento correcto', r.moduloActualizado.length === 1 && r.moduloActualizado[0].id === 's2');

  const vuelta = prepararRestauracion(r.moduloActualizado, r.entrada);
  comprobar('...y restaurándolo en su posición', vuelta.moduloActualizado.map((x) => x.id).join() === 's1,s2');
}

// --- Restaurar: la recuperación tiene que ser REAL ---
{
  const original = { tareas: [{ id: 'a', texto: 'Uno' }, { id: 'b', texto: 'Dos', hecha: true, fechaLimite: '2026-09-01' }, { id: 'c', texto: 'Tres' }] };
  const del = prepararEliminacion(original, 'productividad', 'tareas', 'b', AHORA);
  const res = prepararRestauracion(del.moduloActualizado, del.entrada);

  comprobar('Restaurar devuelve el elemento a su posición exacta',
    res.moduloActualizado.tareas.map((t) => t.id).join() === 'a,b,c');
  comprobar('Restaurar conserva TODOS sus campos',
    res.moduloActualizado.tareas[1].hecha === true && res.moduloActualizado.tareas[1].fechaLimite === '2026-09-01');
  comprobar('Restaurar conserva el id original (no es una copia nueva)',
    res.moduloActualizado.tareas[1].id === 'b');
  comprobar('El resultado es idéntico al estado de partida',
    JSON.stringify(res.moduloActualizado) === JSON.stringify(original));
}

// --- Restaurar en casos límite ---
{
  const del = prepararEliminacion({ tareas: [{ id: 'a' }, { id: 'b' }] }, 'productividad', 'tareas', 'b', AHORA);

  // La lista ha encogido desde entonces: se inserta lo más cerca posible, sin reventar.
  const cortita = prepararRestauracion({ tareas: [] }, del.entrada);
  comprobar('Si la lista encogió, restaura igualmente', cortita.moduloActualizado.tareas.length === 1);

  // Ya existe (p. ej. tras un deshacer): no duplica.
  const yaEsta = prepararRestauracion({ tareas: [{ id: 'b' }] }, del.entrada);
  comprobar('No duplica si el elemento ya volvió por otra vía', yaEsta.moduloActualizado.tareas.length === 1);
  comprobar('...y lo marca como ya existente', yaEsta.yaExistia === true);

  comprobar('Restaurar una entrada corrupta devuelve null', prepararRestauracion({}, null) === null);
  comprobar('Restaurar una entrada sin datos devuelve null', prepararRestauracion({}, { indice: 0 }) === null);
}

// --- Borrado en cascada (asignatura → exámenes + horas) ---
{
  const estudios = {
    asignaturas: [{ id: 'bio', nombre: 'Biología' }, { id: 'mat', nombre: 'Matemáticas' }],
    examenes: [{ id: 'e1', asignaturaId: 'bio', tema: 'Genética' }, { id: 'e2', asignaturaId: 'mat', tema: 'Derivadas' }],
    horas: [{ id: 'h1', asignaturaId: 'bio', horas: 2 }],
  };

  const del = prepararEliminacion(estudios, 'estudios', 'asignaturas', 'bio', AHORA);
  const entrada = conArrastrados(del.entrada, [
    { coleccion: 'examenes', elementos: estudios.examenes.filter((e) => e.asignaturaId === 'bio') },
    { coleccion: 'horas', elementos: estudios.horas.filter((h) => h.asignaturaId === 'bio') },
  ]);

  comprobar('La entrada guarda lo que cayó en cascada', (entrada.relacionados || []).length === 2);
  comprobar('...incluido el examen de esa asignatura',
    entrada.relacionados.find((r) => r.coleccion === 'examenes').elementos[0].id === 'e1');

  // Estado tras el borrado en cascada, como lo deja App.jsx.
  const trasBorrar = {
    ...del.moduloActualizado,
    examenes: estudios.examenes.filter((e) => e.asignaturaId !== 'bio'),
    horas: estudios.horas.filter((h) => h.asignaturaId !== 'bio'),
  };
  comprobar('Tras borrar, la asignatura no está', trasBorrar.asignaturas.length === 1);
  comprobar('...ni su examen', trasBorrar.examenes.length === 1);
  comprobar('...ni sus horas', trasBorrar.horas.length === 0);
  comprobar('...pero el examen de OTRA asignatura sigue', trasBorrar.examenes[0].id === 'e2');

  const res = prepararRestauracion(trasBorrar, entrada);
  comprobar('Restaurar devuelve la asignatura a su posición',
    res.moduloActualizado.asignaturas.map((a) => a.id).join() === 'bio,mat');
  comprobar('Restaurar devuelve TAMBIÉN sus exámenes',
    res.moduloActualizado.examenes.some((e) => e.id === 'e1'));
  comprobar('Restaurar devuelve TAMBIÉN sus horas',
    res.moduloActualizado.horas.some((h) => h.id === 'h1'));
  comprobar('...sin duplicar lo que no se había borrado',
    res.moduloActualizado.examenes.filter((e) => e.id === 'e2').length === 1);

  // Restaurar dos veces no debe duplicar nada.
  const otraVez = prepararRestauracion(res.moduloActualizado, entrada);
  comprobar('Restaurar dos veces no duplica', otraVez.yaExistia === true);

  comprobar('Sin nada arrastrado, la entrada se queda igual',
    conArrastrados(del.entrada, [{ coleccion: 'examenes', elementos: [] }]).relacionados === undefined);
}

// --- Retención ---
{
  const papelera = {
    retencionDias: 30,
    elementos: [
      { id: '1', eliminadoEn: hace(2) },          // reciente
      { id: '2', eliminadoEn: hace(24 * 29) },    // 29 días
      { id: '3', eliminadoEn: hace(24 * 31) },    // 31 días → caducado
      { id: '4', eliminadoEn: 'fecha-rota' },     // corrupta → no se toca
    ],
  };
  const purgada = purgarCaducados(papelera, AHORA);
  comprobar('Purga las entradas caducadas', !purgada.elementos.some((e) => e.id === '3'));
  comprobar('Conserva las que están dentro del plazo',
    ['1', '2'].every((id) => purgada.elementos.some((e) => e.id === id)));
  comprobar('Una fecha corrupta no se borra sola', purgada.elementos.some((e) => e.id === '4'));

  const sinCaducidad = purgarCaducados({ ...papelera, retencionDias: 0 }, AHORA);
  comprobar('Con retención 0 ("hasta que yo lo borre") no caduca nada',
    sinCaducidad.elementos.length === 4);

  comprobar('Purgar una papelera vacía no rompe', purgarCaducados(DEFAULT_PAPELERA, AHORA).elementos.length === 0);
  comprobar('Purgar undefined no rompe', purgarCaducados(undefined, AHORA).elementos.length === 0);
  comprobar('Sin nada que purgar devuelve el mismo objeto (sin escritura inútil)',
    purgarCaducados({ retencionDias: 30, elementos: [{ id: '1', eliminadoEn: hace(1) }] }, AHORA).elementos.length === 1);
}

// --- Privacidad de Relación ---
{
  const del = prepararEliminacion(
    { fechas: [{ id: 'f1', etiqueta: 'Aniversario con María' }] },
    'relacion', 'fechas', 'f1', AHORA,
  );
  comprobar('Una fecha de Relación se marca como privada', del.entrada.privado === true);
  comprobar('Bloqueada, su etiqueta NO se muestra',
    describirEntrada(del.entrada) === 'Elemento privado');
  comprobar('...ni siquiera parcialmente',
    !describirEntrada(del.entrada).includes('María'));
  comprobar('Desbloqueada, sí se muestra',
    describirEntrada(del.entrada, { relacionDesbloqueada: true }) === 'Aniversario con María');
  comprobar('Los datos siguen guardados para poder restaurar',
    del.entrada.datos.etiqueta === 'Aniversario con María');
}

// --- Descripciones ---
{
  const conTexto = { modulo: 'productividad', coleccion: 'tareas', tipo: 'Tarea', datos: { texto: 'Repasar Biología' } };
  comprobar('Describe con el primer campo disponible', describirEntrada(conTexto) === 'Repasar Biología');

  const sinCampos = { modulo: 'productividad', coleccion: 'tareas', tipo: 'Tarea', datos: {} };
  comprobar('Sin campo útil, cae al tipo', describirEntrada(sinCampos) === 'Tarea');

  const largo = { modulo: 'objetivos', coleccion: 'lista', tipo: 'Objetivo', datos: { texto: 'x'.repeat(200) } };
  comprobar('Recorta las descripciones muy largas', describirEntrada(largo).length <= 60);

  comprobar('Una entrada nula no rompe', describirEntrada(null) === '');
}

// --- Tiempo transcurrido, como en los ejemplos de la especificación ---
{
  comprobar('"hace 2 horas"', tiempoDesde(hace(2), AHORA) === 'hace 2 horas');
  comprobar('"ayer"', tiempoDesde(hace(25), AHORA) === 'ayer');
  comprobar('"hace 3 días"', tiempoDesde(hace(24 * 3), AHORA) === 'hace 3 días');
  comprobar('"hace 1 hora" en singular', tiempoDesde(hace(1), AHORA) === 'hace 1 hora');
  comprobar('"ahora mismo"', tiempoDesde(AHORA, AHORA) === 'ahora mismo');
  comprobar('Una fecha rota no rompe', tiempoDesde('nada', AHORA) === '');
}

// --- Días restantes ---
{
  comprobar('Recién eliminado quedan los días completos',
    diasRestantes({ eliminadoEn: AHORA }, 30, AHORA) === 30);
  comprobar('A los 29 días queda 1', diasRestantes({ eliminadoEn: hace(24 * 29) }, 30, AHORA) === 1);
  comprobar('Nunca baja de 0', diasRestantes({ eliminadoEn: hace(24 * 60) }, 30, AHORA) === 0);
  comprobar('Sin retención, no hay cuenta atrás', diasRestantes({ eliminadoEn: AHORA }, 0, AHORA) === null);
}

// --- Orden y opciones ---
{
  const orden = ordenarPapelera([
    { id: 'viejo', eliminadoEn: hace(48) },
    { id: 'nuevo', eliminadoEn: hace(1) },
    { id: 'medio', eliminadoEn: hace(10) },
  ]);
  comprobar('Lo más reciente va primero', orden.map((e) => e.id).join() === 'nuevo,medio,viejo');
  comprobar('Ordenar una lista vacía no rompe', ordenarPapelera([]).length === 0);
  comprobar('Ordenar undefined no rompe', ordenarPapelera(undefined).length === 0);

  comprobar('Hay opción de "hasta que yo lo borre"', OPCIONES_RETENCION.some((o) => o.value === 0));
  comprobar('La retención por defecto son 30 días', RETENCION_PAPELERA_DIAS === 30);
  comprobar('DEFAULT_PAPELERA trae la retención por defecto',
    DEFAULT_PAPELERA.retencionDias === RETENCION_PAPELERA_DIAS && DEFAULT_PAPELERA.elementos.length === 0);
}

console.log('');
if (fallos) { console.error(`═══ ${fallos} PRUEBA(S) FALLIDA(S) ═══\n`); process.exit(1); }
console.log('═══ TODAS LAS PRUEBAS PASAN ═══\n');
