/* ===========================================================================
   AS F1 — el catálogo compartido de asignaturas (Horario ↔ Estudio).

   Josué: *"quiero que las asignaturas de Horario y Estudio dejen de funcionar
   como sistemas independientes"*, con una condición por delante: *"antes de
   modificar nada, analiza cómo están implementados actualmente ambos módulos"*.

   🚨 **Y al mirarlo, el catálogo compartido YA EXISTÍA**: es
   `estudios.asignaturas`, y `App.jsx` se lo pasa a `HorarioView` desde HT F1,
   donde está escrito que *"una actividad de horario no las copia: apunta a
   ellas por `asignaturaId`"*. Así que esta fase **no crea un sistema nuevo** —
   eso sería el segundo sistema que él prohíbe—: termina de conectar el que hay.

   Los tres agujeros que sí eran reales:

     1. `buscarActividad` solo miraba `horarioTop.actividades`, así que elegir
        una asignatura de Estudios en Horario **creaba una copia suelta** con
        `asignaturaId: null`. El desplegable la ofrecía y nacía desconectada.
     2. Crear desde Horario **no escribía en el catálogo**, así que la PRUEBA A
        del enunciado no podía pasar.
     3. `programaId` vivía DENTRO de la asignatura, así que no existía el estado
        *"está en el catálogo pero todavía no la usa ningún programa"* — que es
        literalmente el apartado 4.
   =========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  normalizarAsignatura, normalizarAsignaturasDe,
  catalogoAsignaturas, asignaturasDePrograma, asignaturasOrdenadas,
  buscarAsignaturaPorNombre, crearAsignatura,
  anadirAPrograma, quitarDePrograma, usaPrograma,
  MISMO_NOMBRE,
} from '../src/lib/asignaturas.js';
import { crearBloqueRapido, buscarActividad, sugerencias } from '../src/lib/horarioEditor.js';
import { normalizarHorarioTop, crearHorario, nombreDeActividad } from '../src/lib/horario.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa++; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(a === b, `${m}${a === b ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const sinComentarios = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/(?<![:\w])\/\/[^\n]*/g, '');

const HOY = '2026-09-01';

/* Lo que Josué ya tiene guardado: dos programas y sus asignaturas, con el
   `programaId` de siempre dentro de cada una. */
const guardado = () => ({
  programas: [{ id: 'p_bach', nombre: 'Bachillerato' }, { id: 'p_mus', nombre: 'Música' }],
  asignaturas: [
    { id: 'a_mat', nombre: 'Matemáticas', programaId: 'p_bach', orden: 0 },
    { id: 'a_fis', nombre: 'Física', programaId: 'p_bach', orden: 1 },
    { id: 'a_pia', nombre: 'Piano', programaId: 'p_mus', orden: 0 },
  ],
  temas: [], examenes: [], horas: [], entregas: [], eventos: [],
});

console.log('\n── 1. Lo guardado antes NO se pierde ni se mueve ──');

/* 🚨 El apartado 7, literal: *"no los pierdas, no reinicies datos, no
   sustituyas silenciosamente información existente"*. */
const est = normalizarAsignaturasDe(guardado());
eq(est.asignaturas.length, 3, 'Las tres asignaturas de Josué siguen ahí');
eq(asignaturasDePrograma(est, 'p_bach').length, 2, '🚨 Y Bachillerato sigue teniendo las suyas');
eq(asignaturasDePrograma(est, 'p_mus').length, 1, '🚨 …y Música la suya');
eq(asignaturasDePrograma(est, 'p_bach')[0].nombre, 'Matemáticas', '…con su nombre intacto');

/* ⚠️ El `programaId` de siempre se ABSORBE en la relación, como `coleccionId`
   en la BL F7 (E3 F21): dos fuentes de verdad para lo mismo es como se acaba
   enseñando una cosa distinta en cada pantalla. */
const mat = est.asignaturas.find((a) => a.id === 'a_mat');
ok(Array.isArray(mat.programaIds), '⚠️ La relación con los programas es una lista');
ok(usaPrograma(mat, 'p_bach'), '🚨 …y la de Bachillerato la conserva: nada se ha movido');
ok(!usaPrograma(mat, 'p_mus'), '…y no se ha colado en el otro programa');

// ⚠️ Y la función de siempre sigue contestando igual: no se ha roto Estudio.
eq(asignaturasOrdenadas(est, 'p_bach').length, 2,
  '⚠️ `asignaturasOrdenadas` sigue dando lo mismo: las pantallas de Estudio no se enteran');

console.log('\n── 2. El catálogo es UNO, y es el que ya existía ──');

eq(catalogoAsignaturas(est).length, 3, '🚨 El catálogo son TODAS las asignaturas, de cualquier programa');
ok(catalogoAsignaturas(est).some((a) => a.nombre === 'Piano'),
  '…así que Horario puede ofrecer Piano aunque sea de otro programa');

/* 🚨 Y no hay un segundo almacén: el catálogo SALE de `estudios.asignaturas`.
   Una lista nueva al lado sería el sistema paralelo que él prohíbe. */
const LIB = sinComentarios(leer('src/lib/asignaturas.js'));
ok(!/catalogo\s*:\s*\[|asignaturasCompartidas\s*=/.test(LIB),
  '🚨 No hay una segunda lista de asignaturas: el catálogo se deriva de la que ya había');

console.log('\n── 3. PRUEBA A — crear en Horario y usarla en Estudio ──');

/* Josué: *"Creo una asignatura llamada Filosofía [en Horario]. Entro en
   Estudio, pulso añadir asignatura, aparece Filosofía. La selecciono. **Se
   utiliza la misma asignatura, no una copia.**"* */
const h = crearHorario({ nombre: 'Curso', tipo: 'escolar', hoy: HOY });
const lunes = h.columnas.find((c) => c.dia === 1);
const horarioBase = normalizarHorarioTop({ horarios: [h], bloques: [] });

const rA = crearBloqueRapido(horarioBase, {
  horarioId: h.id, columnaId: lunes.id, inicio: '08:00', fin: '09:00',
  texto: 'Filosofía', asignaturas: catalogoAsignaturas(est), hoy: HOY,
});
ok(!rA.error, 'Se crea el bloque escribiendo «Filosofía»');
ok(rA.asignaturaNueva && rA.asignaturaNueva.nombre === 'Filosofía',
  '🚨 AS F1 — y devuelve la asignatura NUEVA para el catálogo compartido');
/* 🚨 Y la actividad queda ENLAZADA por id, no con el nombre copiado. */
eq(rA.actividad.asignaturaId, rA.asignaturaNueva.id,
  '🚨 AS F1 — la actividad del horario APUNTA a la asignatura, no la copia');

/* ⚠️ Y escribe en DOS almacenes, así que devuelve un plan y guarda `App.jsx`
   en UNA sola llamada: dos escrituras seguidas se pisan (E3 F26). */
const APP = sinComentarios(leer('src/App.jsx'));
ok(/horarioTop:[\s\S]{0,200}estudios:|estudios:[\s\S]{0,200}horarioTop:/.test(APP),
  '🚨 AS F1 — `App.jsx` guarda el horario y las asignaturas en la MISMA llamada');

// Y ahora Estudio la ve, con el MISMO id.
const estConFilo = { ...est, asignaturas: [...est.asignaturas, rA.asignaturaNueva] };
const enCatalogo = catalogoAsignaturas(estConFilo).find((a) => a.nombre === 'Filosofía');
ok(!!enCatalogo, '🚨 PRUEBA A — Filosofía aparece en el catálogo de Estudio');
eq(enCatalogo.id, rA.asignaturaNueva.id, '🚨 PRUEBA A — y es LA MISMA asignatura, no una copia');

/* 🚨 PRUEBA C — crearla no la mete en ningún programa. */
eq(enCatalogo.programaIds.length, 0,
  '🚨 PRUEBA C — nace disponible pero SIN programa: crear no es usar (apartado 4)');
eq(asignaturasDePrograma(estConFilo, 'p_bach').length, 2,
  '🚨 PRUEBA C — …así que Bachillerato NO la ha ganado sola');
eq(asignaturasDePrograma(estConFilo, 'p_mus').length, 1, '…ni Música');

// Y al añadirla a un programa, entonces sí.
const conFiloEnBach = anadirAPrograma(estConFilo.asignaturas, enCatalogo.id, 'p_bach');
eq(asignaturasDePrograma({ ...estConFilo, asignaturas: conFiloEnBach }, 'p_bach').length, 3,
  '⚠️ Y cuando él la añade a Bachillerato, entonces sí sale ahí');

console.log('\n── 4. PRUEBA B — crear en Estudio y usarla en Horario ──');

const eco = crearAsignatura({ nombre: 'Economía', programaId: 'p_bach' }, est.asignaturas);
const estConEco = normalizarAsignaturasDe({ ...est, asignaturas: [...est.asignaturas, eco] });
ok(catalogoAsignaturas(estConEco).some((a) => a.nombre === 'Economía'),
  '🚨 PRUEBA B — Economía, creada en Estudio, está en el catálogo');

/* 🚨 Y Horario la ofrece al escribir, sin tener que crearla otra vez. */
const sug = sugerencias(horarioBase, 'Econ', { asignaturas: catalogoAsignaturas(estConEco) });
ok(sug.some((s) => s.nombre === 'Economía'),
  '🚨 PRUEBA B — y Horario la ofrece al escribir «Econ»');

/* 🚨 Y AL ELEGIRLA NO SE DUPLICA: la actividad nace enlazada por id. Éste era
   el agujero 1 — `buscarActividad` solo miraba las actividades del horario, así
   que una asignatura de Estudios sin actividad todavía **no se encontraba** y
   se creaba una copia con el nombre y `asignaturaId: null`. */
const rB = crearBloqueRapido(horarioBase, {
  horarioId: h.id, columnaId: lunes.id, inicio: '09:00', fin: '10:00',
  texto: 'Economía', asignaturas: catalogoAsignaturas(estConEco), hoy: HOY,
});
ok(!rB.error, 'Se puede poner Economía en el horario');
eq(rB.actividad.asignaturaId, eco.id,
  '🚨 PRUEBA B — la actividad APUNTA a la Economía de Estudio, no crea otra');
ok(!rB.asignaturaNueva,
  '🚨 …y NO se crea ninguna asignatura nueva: ya existía');

/* ⚠️ Y el nombre que se pinta sale de la asignatura, así que renombrarla en
   Estudio cambia el horario solo — no hay copia que sincronizar. */
eq(nombreDeActividad(rB.actividad, catalogoAsignaturas(estConEco)), 'Economía',
  '⚠️ El nombre se lee de la asignatura: renombrarla en Estudio cambia el horario solo');

console.log('\n── 5. No duplicar (apartado 6) ──');

ok(buscarAsignaturaPorNombre(est, 'matemáticas')?.id === 'a_mat',
  '🚨 Buscar «matemáticas» encuentra la que ya existe, sin importar mayúsculas');
ok(buscarAsignaturaPorNombre(est, '  Matemáticas  ')?.id === 'a_mat',
  '…y sin importar los espacios');
ok(buscarAsignaturaPorNombre(est, 'Historia') === null,
  '…y no se inventa una coincidencia donde no la hay');

/* ⚠️ Pero NO se impide crear algo legítimamente distinto (apartado 14 de la F2):
   *"Física y Física avanzada pueden ser asignaturas diferentes"*. */
ok(buscarAsignaturaPorNombre(est, 'Física avanzada') === null,
  '⚠️ «Física avanzada» NO se confunde con «Física»: son dos asignaturas distintas');
ok(!!MISMO_NOMBRE && /ya existe/i.test(MISMO_NOMBRE),
  '⚠️ Y el aviso ofrece usar la existente, en vez de bloquear');

/* 🚨 Y `buscarActividad` encuentra la asignatura del catálogo aunque todavía no
   tenga actividad en el horario: era el agujero que creaba el duplicado. */
ok(buscarActividad(horarioBase, 'Matemáticas', catalogoAsignaturas(est)) === null,
  '(sin actividad todavía, no hay actividad que devolver)');
const rDup = crearBloqueRapido(horarioBase, {
  horarioId: h.id, columnaId: lunes.id, inicio: '10:00', fin: '11:00',
  texto: 'Matemáticas', asignaturas: catalogoAsignaturas(est), hoy: HOY,
});
eq(rDup.actividad.asignaturaId, 'a_mat',
  '🚨 AS F1 — escribir «Matemáticas» en Horario ENLAZA con la de Estudio, no crea otra');
ok(!rDup.asignaturaNueva, '…y no añade nada al catálogo, porque ya estaba');

console.log('\n── 6. Quitar de un programa NO borra la asignatura (preparado para AS F2) ──');

/* ⚠️ El apartado 9: en esta fase **no** se implementa la eliminación. Lo que sí
   se deja listo es la relación, que es lo que AS F2 necesita. */
const sinMatEnBach = quitarDePrograma(est.asignaturas, 'a_mat', 'p_bach');
eq(sinMatEnBach.length, 3, '🚨 Quitarla de Bachillerato NO la borra del catálogo');
eq(asignaturasDePrograma({ ...est, asignaturas: sinMatEnBach }, 'p_bach').length, 1,
  '…solo deja de usarse en ese programa');
ok(catalogoAsignaturas({ ...est, asignaturas: sinMatEnBach }).some((a) => a.id === 'a_mat'),
  '🚨 …y sigue disponible para Horario y para otros programas');

/* ⚠️ Y añadir dos veces al mismo programa no la duplica en la relación. */
const dosVeces = anadirAPrograma(anadirAPrograma(est.asignaturas, 'a_pia', 'p_bach'), 'a_pia', 'p_bach');
eq(dosVeces.find((a) => a.id === 'a_pia').programaIds.filter((p) => p === 'p_bach').length, 1,
  '⚠️ Añadirla dos veces al mismo programa no la repite');

console.log('\n── 7. Lo que esta fase NO hace (apartado 9) ──');

ok(!/export function eliminarAsignaturaDelCatalogo|export function eliminarCompartida/.test(LIB),
  '🚨 AS F1 NO implementa la eliminación: eso es AS F2, y él lo pidió aparte');

console.log(`\n  ${fallos.length ? '✗' : '✓'} Asignaturas compartidas (AS F1) — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
