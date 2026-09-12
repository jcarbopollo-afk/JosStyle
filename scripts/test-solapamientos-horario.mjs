/* ===========================================================================
   GE F2 — el solapamiento falso del Horario.

   Josué: *"Los horarios eliminados siguen provocando detección falsa de
   solapamientos"*, y con una condición: *"NO asumas que el problema es
   únicamente visual. Quiero que encuentres la causa real."*

   No lo era. La causa real, reproducida con las funciones de verdad:

     1. **`duplicarHorario` dejaba DOS horarios activos a la vez.** La copia
        heredaba `activo: true`, `archivado: false`, `desde: ''` y `hasta: ''`,
        o sea **vigente desde hoy**, con las mismas clases. El botón se llama
        *"Duplicar para otro curso"* y el otro curso empezaba a contar hoy.
     2. **`resolverDia` SUMA todos los horarios vigentes** (así es como conviven
        el del instituto y el del gimnasio), de modo que cada clase se resolvía
        **dos veces** y `conflictosDelDia` informaba fielmente de un choque por
        clase. **El detector no estaba roto: le estaban dando la lista mal.**
     3. Y el aviso decía *"2 choques de horario"* **y nada más**, así que era
        indistinguible de un choque dentro de un mismo horario. Por eso no había
        forma de entender qué pasaba.

   🚨 **Y por eso el arreglo NO es acotar la detección al horario que se mira.**
   Eso escondería el CASO E —dos horarios distintos que de verdad chocan—, que es
   justo lo que el enunciado exige que se siga detectando. Hay una comprobación
   de ello aquí abajo.
   =========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  crearHorario, crearBloque, normalizarHorarioTop,
  resolverDia, conflictosDelDia, eliminarHorario, revisarHorario, resumenHorario,
} from '../src/lib/horario.js';
import { duplicarHorario, archivarHorario, horariosActivos, horariosArchivados } from '../src/lib/horarioEstructura.js';
import { eliminarDeVerdad, impactoEliminarHorario } from '../src/lib/misHorarios.js';
import { contextoTemporal } from '../src/lib/hoy.js';

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

const LUNES = '2026-09-14';
const HOY = '2026-09-01';

/** Un horario con dos clases seguidas que NO se solapan entre ellas. */
function escenario() {
  const h = crearHorario({ nombre: 'Curso 25-26', hoy: HOY });
  const lunes = h.columnas.find((c) => c.dia === 1);
  const estado = normalizarHorarioTop({
    horarios: [h],
    bloques: [
      crearBloque({ horarioId: h.id, columnaId: lunes.id, inicio: '08:00', fin: '09:00', titulo: 'Mates', hoy: HOY }),
      crearBloque({ horarioId: h.id, columnaId: lunes.id, inicio: '09:00', fin: '10:00', titulo: 'Lengua', hoy: HOY }),
    ],
  });
  return { h, lunes, estado };
}

console.log('\n── 1. El punto de partida: un horario sano ──');

const { h, lunes, estado } = escenario();
eq(resolverDia(estado, LUNES).length, 2, 'Un horario con dos clases resuelve dos clases');
eq(conflictosDelDia(estado, LUNES).length, 0, '🚨 Y NO hay ningún choque: tocarse no es solaparse');

console.log('\n── 2. LA CAUSA: duplicar dejaba dos horarios vivos ──');

const dup = duplicarHorario(estado, h.id, { nombre: 'Curso 26-27', hoy: HOY });
const copia = dup.estado.horarios.find((x) => x.id !== h.id);

ok(copia, 'Duplicar crea la copia');
eq(copia.archivado, true,
  '🚨 GE F2 — LA COPIA SIN FECHAS NACE ARCHIVADA: «duplicar para otro curso» no puede poner dos cursos en marcha HOY');
eq(copia.activo, false, '…y por tanto no activa');
eq(horariosActivos(dup.estado).length, 1, '🚨 Sigue habiendo UN horario activo, no dos');
eq(horariosArchivados(dup.estado).length, 1, '⚠️ …y la copia está en Archivados, de donde se restaura de un toque');

/* 🚨 **Y AQUÍ ESTÁ EL LÍMITE DEL ARREGLO, que es lo que lo hace correcto.** Si
   al duplicar SÍ dice cuándo empieza el curso nuevo, la copia **se queda
   activa**: `horarioVigente` ya la deja fuera de todas las fechas anteriores a
   su `desde`, así que no puede duplicar ni una clase hoy, y **se enciende sola**
   el día que empiece. Archivarla también habría sido «arreglar» algo que no
   estaba roto, y le obligaría a acordarse de restaurarla en septiembre. */
const conFechas = duplicarHorario(estado, h.id, {
  nombre: 'Curso 27-28', desde: '2027-09-01', hasta: '2028-06-30', hoy: HOY,
});
const futura = conFechas.estado.horarios.find((x) => x.id !== h.id);
eq(futura.archivado, false, '🚨 GE F2 — Una copia que EMPIEZA MÁS ADELANTE no se archiva');
eq(futura.activo, true, '…sigue activa, porque se encenderá sola cuando llegue su fecha');
eq(resolverDia(conFechas.estado, LUNES).length, 2,
  '🚨 …y aun así HOY no duplica nada: `horarioVigente` la deja fuera hasta su `desde`');
eq(conflictosDelDia(conFechas.estado, LUNES).length, 0, '…así que tampoco hay choques');

/* ⚠️ Y duplicar uno ARCHIVADO no lo saca del archivo por la puerta de atrás. */
const deArchivado = duplicarHorario(archivarHorario(estado, h.id), h.id, { hoy: HOY });
eq(deArchivado.estado.horarios.find((x) => x.id !== h.id).archivado, true,
  '⚠️ La copia de un horario archivado nace archivada también');

/* 🚨 **Ésta es la comprobación que importa**: con la copia viva, cada clase se
   resolvía dos veces y el aviso decía «2 choques» sobre un horario impecable. */
eq(resolverDia(dup.estado, LUNES).length, 2,
  '🚨 GE F2 — EL LUNES SIGUE TENIENDO DOS CLASES, no cuatro: la copia no resuelve');
eq(conflictosDelDia(dup.estado, LUNES).length, 0,
  '🚨 GE F2 — Y CERO CHOQUES: era esto lo que veía Josué en un horario sin solapes');

// ⚠️ Y no se ha perdido nada: las clases de la copia están guardadas.
eq(dup.estado.bloques.filter((b) => b.horarioId === copia.id).length, 2,
  '⚠️ Archivada NO es borrada: sus dos clases siguen guardadas');
eq(horariosActivos(archivarHorario(dup.estado, copia.id, false)).length, 2,
  '⚠️ Y restaurarla la devuelve activa: es él quien decide cuándo empieza el curso nuevo');

console.log('\n── 3. Y lo que ve la pantalla, que es donde se notaba ──');

/* 🐛 `contextoTemporal` recibe `horarioId` y se lo pasa a `linea`, así que la
   pantalla enseñaba UNA clase mientras anunciaba UN choque. Con la copia
   archivada, las dos cifras vuelven a decir lo mismo. */
const ctx = contextoTemporal(dup.estado, { fecha: LUNES, hoy: LUNES, horarioId: h.id });
eq(ctx.conflictos.length, 0,
  '🚨 GE F2 — La pantalla ya no anuncia un choque sobre un día que no lo tiene');

console.log('\n── 4. CASO E — un choque de VERDAD se sigue detectando ──');

/* 🚨 Josué: *"horarios genuinamente solapados deben seguir detectándose"*. Dos
   horarios distintos y los dos activos a propósito —el instituto y el
   gimnasio— son la razón de que `resolverDia` sume: un choque entre ellos es
   real y hay que decirlo. **Por eso el arreglo NO fue acotar la detección.** */
const gym = crearHorario({ nombre: 'Gimnasio', tipo: 'personalizado', hoy: HOY });
const lunesGym = gym.columnas.find((c) => c.dia === 1);
const dosDeVerdad = normalizarHorarioTop({
  horarios: [h, gym],
  bloques: [
    crearBloque({ horarioId: h.id, columnaId: lunes.id, inicio: '08:00', fin: '09:00', titulo: 'Mates', hoy: HOY }),
    crearBloque({ horarioId: gym.id, columnaId: lunesGym.id, inicio: '08:30', fin: '09:30', titulo: 'Pesas', hoy: HOY }),
  ],
});
eq(horariosActivos(dosDeVerdad).length, 2, 'Dos horarios distintos pueden estar activos a la vez: es la función');
eq(conflictosDelDia(dosDeVerdad, LUNES).length, 1,
  '🚨 CASO E — Mates 08:00-09:00 contra Pesas 08:30-09:30 SIGUE saliendo como choque');

/* ⚠️ Y un choque dentro de un mismo horario también, claro. */
const mismoHorario = normalizarHorarioTop({
  horarios: [h],
  bloques: [
    crearBloque({ horarioId: h.id, columnaId: lunes.id, inicio: '08:00', fin: '09:00', titulo: 'Mates', hoy: HOY }),
    crearBloque({ horarioId: h.id, columnaId: lunes.id, inicio: '08:30', fin: '09:30', titulo: 'Física', hoy: HOY }),
  ],
});
eq(conflictosDelDia(mismoHorario, LUNES).length, 1,
  '⚠️ …y un choque DENTRO de un mismo horario, también');

console.log('\n── 5. Un choque dice DE QUÉ horarios es ──');

/* 🚨 El aviso decía *"2 choques de horario"* y nada más, así que era imposible
   distinguir un choque real de dos copias del mismo horario — que es justo lo
   que hizo indescifrable este fallo. El evento ya llevaba `horarioNombre`
   (`horario.js`) y nadie lo usaba. ⚠️ Esto es lo que arregla **los datos que
   Josué ya tiene guardados**: el punto 2 solo evita crearlo otra vez. */
const par = conflictosDelDia(dosDeVerdad, LUNES)[0];
ok(par.every((ev) => typeof ev.horarioNombre === 'string' && ev.horarioNombre),
  '🚨 GE F2 — Cada lado del choque sabe de qué horario viene');
ok(new Set(par.map((ev) => ev.horarioNombre)).size === 2,
  '…y aquí son dos horarios distintos, que es lo que hay que poder leer en pantalla');

const VISTA = sinComentarios(leer('src/views/HorarioView.jsx'));
ok(/horarioNombre/.test(VISTA),
  '🚨 GE F2 — Y la pantalla lo ENSEÑA: un número suelto no se puede diagnosticar');

console.log('\n── 6. Eliminar y archivar funcionan, y siguen funcionando ──');

/* ⚠️ Esto NO era la causa —se comprobó antes de tocar nada— pero es lo que Josué
   nombra en el encargo, así que queda con su prueba para que no se rompa. */
const conDos = duplicarHorario(escenario().estado, h.id, { hoy: HOY }).estado;
const idCopia = conDos.horarios.find((x) => x.id !== h.id).id;

const trasBorrar = eliminarDeVerdad(conDos, idCopia, { confirmado: true });
eq(trasBorrar.horarios.length, 1, '🚨 Eliminar un horario lo quita de verdad');
eq(trasBorrar.bloques.filter((b) => b.horarioId === idCopia).length, 0,
  '🚨 …y se lleva sus clases en cascada: ni un bloque huérfano');
eq(conflictosDelDia(trasBorrar, LUNES).length, 0, '…y no queda ningún choque suyo');
ok(revisarHorario(trasBorrar).ok, '⚠️ …y la revisión de integridad queda limpia');

eq(eliminarDeVerdad(conDos, idCopia).horarios.length, 2,
  '🚨 Y sin `confirmado` NO borra nada: mostrar y ejecutar son dos llamadas (el patrón `aplicarPlan`)');
ok(impactoEliminarHorario(conDos, idCopia)?.permanente === true,
  '⚠️ El aviso dice que es permanente, porque un horario NO va a la papelera');

const trasArchivar = archivarHorario(conDos, idCopia);
eq(resolverDia(trasArchivar, LUNES).filter((ev) => ev.horarioId === idCopia).length, 0,
  '⚠️ Archivar también lo saca de los días, sin borrar sus clases');

console.log('\n── 7. Los bloques huérfanos: no chocan, pero se contaban ──');

/* ⚠️ Un bloque cuyo horario ya no existe **no produce choques** —`resolverDia`
   los filtra por `b.horarioId === horario.id`— pero `resumenHorario` los sumaba,
   así que el hub decía un número de bloques que no era el de la semana.
   🚨 El normalizador NO se toca: lo llaman docenas de funciones y tirar bloques
   ahí sería destructivo si alguna pasara un estado parcial. */
const huerfano = normalizarHorarioTop({
  horarios: [h],
  bloques: [
    crearBloque({ horarioId: h.id, columnaId: lunes.id, inicio: '08:00', fin: '09:00', titulo: 'Mates', hoy: HOY }),
    crearBloque({ horarioId: 'horario-que-ya-no-esta', columnaId: lunes.id, inicio: '08:00', fin: '09:00', titulo: 'Fantasma', hoy: HOY }),
  ],
});
eq(huerfano.bloques.length, 2, '⚠️ El normalizador los CONSERVA, a propósito');
eq(resolverDia(huerfano, LUNES).length, 1, '🚨 Pero un bloque huérfano no resuelve en ninguna fecha');
eq(conflictosDelDia(huerfano, LUNES).length, 0, '🚨 …así que nunca ha producido un choque');
eq(resumenHorario(huerfano, { fecha: LUNES }).bloques, 1,
  '🚨 GE F2 — Y el resumen ya NO lo cuenta: decía «2 bloques en la semana» habiendo uno');
ok(revisarHorario(huerfano).problemas.some((p) => p.tipo === 'bloque_sin_horario'),
  '⚠️ …y la revisión lo sigue señalando, que es su trabajo');

/* ⚠️ Y el de un horario ARCHIVADO tampoco cuenta como «esta semana»: está
   guardado, pero no es lo que tiene por delante. */
eq(resumenHorario(archivarHorario(duplicarHorario(escenario().estado, h.id, { hoy: HOY }).estado, h.id), { fecha: LUNES }).bloques, 0,
  '⚠️ Con todo archivado, cero bloques «en la semana» — están guardados, no vigentes');

console.log('\n── 8. Lo que esta fase NO ha tocado ──');

/* Josué: *"NO hagas ningún cambio adicional que no esté relacionado con este
   bug."* Estas cinco ya estaban bien y siguen igual. */
const HOYJS = sinComentarios(leer('src/lib/hoy.js'));
ok(/conflictos: conflictosDelDia\(estado, fecha, \{ asignaturas \}\)/.test(HOYJS),
  '🚨 `conflictosDelDia` sigue mirando TODOS los horarios: acotarlo escondería el caso E');
ok(/libre: tiempoLibre\(estado, fecha, \{ asignaturas \}\)/.test(HOYJS),
  '⚠️ …y el tiempo libre también, o diría que tiene la tarde libre teniendo entrenamiento');
ok(/material: materialDelDia\(estado, fecha, \{ asignaturas \}\)/.test(HOYJS),
  '⚠️ …y el material, o dejaría fuera de la mochila lo del otro horario');

const HOR = sinComentarios(leer('src/lib/horario.js'));
ok(/const horarios = e\.horarios\.filter\(\(h\) => horarioVigente\(h, fecha\)/.test(HOR),
  '⚠️ `resolverDia` sigue sumando los horarios vigentes: es la función, no el fallo');
ok(/bloques: \(Array\.isArray\(g\.bloques\) \? g\.bloques : \[\]\)\.map\(normalizarBloque\)\.filter\(\(b\) => b\.horarioId && b\.columnaId\)/.test(HOR),
  '🚨 Y el normalizador NO tira bloques por no encontrar su horario: sería destructivo con un estado parcial');

console.log(`\n  ${fallos.length ? '✗' : '✓'} Solapamientos del horario (GE F2) — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
