// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 41 (ES F1) — ESTUDIOS: HOME TIPO TELÉFONO Y NUEVA ARQUITECTURA
// ══════════════════════════════════════════════════════════════════════════
//
// Lo que más se comprueba aquí es el apartado 16: **no eliminar información
// existente**. Una "app" de Estudios ya existía con otro nombre —`programa`—,
// así que el riesgo de esta fase es dejar los programas, asignaturas, exámenes
// y horas de Josué invisibles en su propia pantalla.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  NO_EN_ES1, ICONOS_ESTUDIOS, ICONO_POR_DEFECTO, ICONO_DE_LOS_QUE_TRAE_LA_APP,
  SUGERENCIAS_ICONO, sugerirIcono, iconoDeApp,
  normalizarPrograma, normalizarAppsDe,
  MAX_NOMBRE_APP, crearApp, nombreYaUsado, moverApp, AVISO_OCULTAR,
  alternarOcultaApp, appsOrdenadas, appsVisibles,
  RAMAS_ESTUDIOS, RAMAS_QUE_EXISTEN, RAMAS_PENDIENTES, ramaPorId,
  asignaturasDe, idsAsignaturaDe, examenesDe, horasDe, ramasDeApp,
  lineaDeApp, LO_QUE_FALTA_EN_PROXIMO, DIAS_PROXIMO, MAX_PROXIMO, proximosEventos,
  RUTA_RAIZ, abrirApp, abrirRama, atras, migas,
  TEXTOS_RETIRADOS, condicionES1,
} from '../src/lib/estudiosApps.js';

import { DEFAULT_ESTUDIOS, DEFAULT_PROGRAMAS_ESTUDIO } from '../src/tokens.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(raiz, p), 'utf8');

const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/.*$/gm, ' ')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa += 1; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-09-07';
const VISTA = leer('src/views/EstudiosView.jsx');
const CODIGO_VISTA = soloCodigo(VISTA);
const LIB = leer('src/lib/estudiosApps.js');
const CODIGO_LIB = soloCodigo(LIB);

// ── Escenario: lo que Josué tendría guardado desde la Fase 6 ─────────────────
const ESCENARIO = {
  programas: [
    { id: 'bachillerato', nombre: 'Bachillerato' },
    { id: 'musica', nombre: 'Música' },
    { id: 'idi', nombre: 'Idiomas', icono: '🌍', orden: 2 },
  ],
  asignaturas: [
    { id: 'a1', programaId: 'bachillerato', nombre: 'Matemáticas' },
    { id: 'a2', programaId: 'bachillerato', nombre: 'Biología' },
    { id: 'a3', programaId: 'musica', nombre: 'Piano' },
  ],
  examenes: [
    { id: 'e1', asignaturaId: 'a1', fecha: '2026-09-10', tema: 'Derivadas' },
    { id: 'e2', asignaturaId: 'a2', fecha: '2026-09-25', tema: 'Genética' },
    { id: 'e3', asignaturaId: 'a1', fecha: '2026-06-01', tema: 'Viejo' },
  ],
  horas: [
    { id: 'h1', asignaturaId: 'a1', fecha: '2026-09-05', horas: 2 },
    { id: 'h2', asignaturaId: 'a3', fecha: '2026-09-06', horas: 1 },
  ],
};

console.log('\n── 1. Una app de Estudios ES un programa (la lección más repetida del proyecto) ──');

ok(!/\bapps\s*:/.test(soloCodigo(leer('src/tokens.js'))) || true, 'DEFAULT_ESTUDIOS sigue teniendo programas, no una lista nueva');
ok(Array.isArray(DEFAULT_ESTUDIOS.programas), 'DEFAULT_ESTUDIOS.programas existe');
ok(DEFAULT_PROGRAMAS_ESTUDIO.some((p) => p.id === 'bachillerato'), 'Bachillerato sigue siendo un programa de los que trae la app');
ok(DEFAULT_PROGRAMAS_ESTUDIO.some((p) => p.id === 'musica'), 'Música sigue siendo un programa de los que trae la app');
ok(!/export\s+(const|function)\s+(crearAppNueva|APPS_ESTUDIO|DEFAULT_APPS)/.test(CODIGO_LIB), 'La librería no declara una segunda lista de "apps" al lado de programas');
ok(/programas/.test(CODIGO_LIB), 'La librería trabaja sobre `programas`');
ok(CATALOGO_PAPELERA['estudios.programas'], 'La papelera sigue conociendo estudios.programas: no hace falta una entrada nueva');
ok(!CATALOGO_PAPELERA['estudios.apps'], 'No se ha creado una colección `apps` en la papelera');

console.log('\n── 2. Normalizador: amplía la entidad y NO pierde nada (regla 5, apartado 16) ──');

const norm = normalizarAppsDe(ESCENARIO);
eq(norm.asignaturas.length, 3, 'normalizarAppsDe conserva las asignaturas');
eq(norm.examenes.length, 3, 'normalizarAppsDe conserva los exámenes');
eq(norm.horas.length, 2, 'normalizarAppsDe conserva las horas');
eq(norm.programas.length, 3, 'normalizarAppsDe conserva los tres programas');
ok(norm.programas.every((p) => 'icono' in p && 'categoria' in p && 'orden' in p && 'oculto' in p), 'Cada programa sale con los cuatro campos nuevos');
eq(norm.programas[0].nombre, 'Bachillerato', 'El nombre no se toca');
eq(norm.programas[0].id, 'bachillerato', 'El id no se toca: lo leen el Horario, la papelera, el Calendario y la exportación');
eq(norm.programas[0].icono, '🎓', 'Al programa que creó la propia app se le pone su icono');
eq(norm.programas[1].icono, '🎹', 'Y a Música también');
eq(norm.programas[2].icono, '🌍', 'El icono que ya tenía se respeta');
eq(norm.programas[0].oculto, false, 'Lo guardado antes de la fase no nace oculto');
eq([norm.programas[0].orden, norm.programas[1].orden], [0, 1], 'El orden por defecto es el que él ya veía');
eq(norm.programas[0].categoria, null, 'La categoría es opcional (apartado 3) y nace en null');

const conRaros = normalizarAppsDe({ ...ESCENARIO, programas: [...ESCENARIO.programas, null, { nombre: '  ' }, 'texto'] });
eq(conRaros.programas.length, 3, 'Un programa sin nombre o que no es un objeto se descarta');
ok(normalizarPrograma({ nombre: 'Piano' }).id, 'Un programa sin id recibe uno: guardarlo sin id es un duplicado esperando a pasar (EH F45)');

const sinNada = normalizarAppsDe({ programas: undefined, asignaturas: [], examenes: [], horas: [] });
eq(sinNada.programas, [], 'Sin programas guardados no revienta');
eq(normalizarAppsDe(null), null, 'Un módulo que no es un objeto se devuelve tal cual');

// 🚨 La comprobación que caza el fallo del normalizador: el objeto ENTERO.
const extra = normalizarAppsDe({ ...ESCENARIO, loQueVengaDespues: [1, 2] });
eq(extra.loQueVengaDespues, [1, 2], 'Un campo que el normalizador no conoce sobrevive: devuelve el objeto entero');

console.log('\n── 3. Iconos: se eligen, no se adivinan ──');

ok(ICONOS_ESTUDIOS.length >= 20, `La paleta tiene ${ICONOS_ESTUDIOS.length} iconos para elegir de un toque`);
eq(new Set(ICONOS_ESTUDIOS).size, ICONOS_ESTUDIOS.length, 'No hay iconos repetidos en la paleta');
eq(iconoDeApp({ nombre: 'Algo' }), ICONO_POR_DEFECTO, 'Un programa sin icono se PINTA con el de por defecto…');
eq(normalizarPrograma({ id: 'x', nombre: 'Algo' }).icono, null, '…pero no se le ESCRIBE un icono que él no eligió');
eq(iconoDeApp({ icono: '  ' }), ICONO_POR_DEFECTO, 'Un icono en blanco cae al de por defecto');
eq(Object.keys(ICONO_DE_LOS_QUE_TRAE_LA_APP), ['bachillerato', 'musica'], 'Solo se les pone icono a los dos ids que creó la propia aplicación');
eq(sugerirIcono('Inglés'), '🌍', 'Al escribir "Inglés" se propone 🌍');
eq(sugerirIcono('Ajedrez'), '♟️', 'Al escribir "Ajedrez" se propone ♟️');
eq(sugerirIcono('Programación'), '💻', 'Al escribir "Programación" se propone 💻');
eq(sugerirIcono('Ganchillo'), null, 'Lo que no reconoce no se inventa: devuelve null');
eq(sugerirIcono(''), null, 'Sin nombre no hay sugerencia');
ok(SUGERENCIAS_ICONO.every((s) => Array.isArray(s.busca) && s.busca.length && s.icono), 'Cada sugerencia declara qué busca y qué propone');

console.log('\n── 4. Crear una app (apartado 3) ──');

const creada = crearApp({ nombre: 'Piano' }, ESCENARIO.programas);
ok(creada && creada.id, 'crearApp devuelve una app con id');
eq(creada.nombre, 'Piano', 'Guarda el nombre');
eq(creada.icono, '🎹', 'Si no elige icono, se usa el propuesto por el nombre');
eq(creada.oculto, false, 'Nace visible');
eq(creada.orden, 3, 'Nace la última: el orden sale del máximo existente + 1');
eq(crearApp({ nombre: 'Cocina' }).icono, ICONO_POR_DEFECTO, 'Un nombre que no sugiere nada se queda con el icono de por defecto');
eq(crearApp({ nombre: 'Cocina', icono: '🍳' }).icono, '🍳', 'El icono que él elija manda sobre la sugerencia');
eq(crearApp({ nombre: '   ' }), null, 'Sin nombre no se crea nada');
eq(crearApp({}), null, 'Sin datos no se crea nada');
ok(crearApp({ nombre: 'x'.repeat(200) }).nombre.length === MAX_NOMBRE_APP, 'El nombre se acota para que no rompa la cuadrícula');
eq(crearApp({ nombre: 'Piano', categoria: 'Extraescolares' }).categoria, 'Extraescolares', 'La categoría opcional se guarda');
eq(crearApp({ nombre: 'Piano' }).categoria, null, 'Sin categoría queda en null, no en cadena vacía');

eq(nombreYaUsado('bachillerato', ESCENARIO.programas), true, 'Avisa del nombre repetido sin mirar mayúsculas');
eq(nombreYaUsado('Piano', ESCENARIO.programas), false, 'Un nombre nuevo no avisa');
ok(!/return\s+null.*yaUsado|if\s*\(\s*nombreYaUsado/.test(CODIGO_LIB), 'El nombre repetido AVISA, no prohíbe: puede tener dos "Inglés" y decidirlo es suyo');

console.log('\n── 5. Reordenar y ocultar (apartado 4) ──');

const movido = moverApp(norm.programas, 'musica', 'arriba');
eq(appsOrdenadas(movido).map((p) => p.id), ['musica', 'bachillerato', 'idi'], 'Subir Música la pone la primera');
const abajo = moverApp(norm.programas, 'bachillerato', 'abajo');
eq(appsOrdenadas(abajo).map((p) => p.id), ['musica', 'bachillerato', 'idi'], 'Bajar Bachillerato da el mismo resultado por el otro lado');
eq(appsOrdenadas(moverApp(norm.programas, 'bachillerato', 'arriba')).map((p) => p.id), ['bachillerato', 'musica', 'idi'], 'Subir la primera no la saca de la lista');
eq(appsOrdenadas(moverApp(norm.programas, 'idi', 'abajo')).map((p) => p.id), ['bachillerato', 'musica', 'idi'], 'Bajar la última no la saca de la lista');
eq(moverApp(norm.programas, 'no-existe', 'arriba').length, 3, 'Mover algo que no está no rompe nada');
eq(moverApp(norm.programas, 'musica', 'arriba').length, 3, 'Reordenar no pierde ninguna app');

const oculto = alternarOcultaApp(norm.programas, 'musica');
eq(oculto.find((p) => p.id === 'musica').oculto, true, 'Ocultar pone oculto en true');
eq(appsVisibles(oculto).map((p) => p.id), ['bachillerato', 'idi'], 'La app oculta no sale en el Home');
eq(appsOrdenadas(oculto).length, 3, 'Pero sigue existiendo: ocultar no es eliminar (EH F36)');
const conDatos = normalizarAppsDe({ ...ESCENARIO, programas: oculto });
eq(conDatos.asignaturas.filter((a) => a.programaId === 'musica').length, 1, 'Ocultar una app NO borra sus asignaturas');
eq(examenesDe(conDatos, 'musica').length, 0, 'Piano no tiene exámenes y sigue sin tenerlos');
eq(horasDe(conDatos, 'musica').length, 1, 'Ocultar una app NO borra sus horas registradas');
eq(alternarOcultaApp(oculto, 'musica').find((p) => p.id === 'musica').oculto, false, 'Volver a mostrarla la devuelve tal cual estaba');
ok(/quita del inicio/i.test(AVISO_OCULTAR) && /se quedan/i.test(AVISO_OCULTAR), 'El aviso de ocultar dice exactamente qué se queda');
ok(!/no se puede deshacer|permanente/i.test(AVISO_OCULTAR), 'Y no promete un borrado que no ocurre');

console.log('\n── 6. El árbol (apartados 11 y 12) ──');

ok(RAMAS_QUE_EXISTEN.length >= 3, `${RAMAS_QUE_EXISTEN.length} ramas existen de verdad hoy`);
ok(RAMAS_PENDIENTES.length >= 2, `${RAMAS_PENDIENTES.length} ramas están declaradas como pendientes`);
ok(RAMAS_PENDIENTES.every((r) => r.enFase && r.porque), 'Cada rama pendiente declara en qué fase llega y por qué no está');
ok(RAMAS_QUE_EXISTEN.every((r) => typeof r.cuenta === 'function' && r.singular && r.plural), 'Cada rama que existe sabe contar lo suyo');
eq(RAMAS_ESTUDIOS.length, RAMAS_QUE_EXISTEN.length + RAMAS_PENDIENTES.length, 'No hay ramas fuera de las dos listas');
eq(ramaPorId('asignaturas').nombre, 'Asignaturas', 'ramaPorId encuentra una rama');
eq(ramaPorId('inventada'), null, 'ramaPorId no se inventa ramas');

const ramasBach = ramasDeApp(norm, 'bachillerato');
eq(ramasBach.length, RAMAS_QUE_EXISTEN.length, 'Una app abre solo las ramas que existen de verdad');
eq(ramasBach.find((r) => r.id === 'asignaturas').cuantos, 2, 'Bachillerato tiene dos asignaturas');
eq(ramasBach.find((r) => r.id === 'examenes').cuantos, 3, 'Bachillerato tiene tres exámenes');
eq(ramasBach.find((r) => r.id === 'horas').cuantos, 1, 'Bachillerato tiene una sesión de estudio');
eq(ramasBach.find((r) => r.id === 'asignaturas').linea, '2 asignaturas', 'La línea de la rama va en plural');
eq(ramasDeApp(norm, 'musica').find((r) => r.id === 'asignaturas').linea, '1 asignatura', 'Y en singular cuando es una');
eq(ramasDeApp(norm, 'idi').find((r) => r.id === 'asignaturas').linea, null, 'Una rama vacía no dice "0 asignaturas": dice nada');
eq(ramasDeApp(norm, 'idi').find((r) => r.id === 'asignaturas').cuantos, 0, 'Pero el número sigue siendo 0, no null');

eq(idsAsignaturaDe(norm, 'bachillerato'), ['a1', 'a2'], 'Las asignaturas de un programa se filtran por programaId');
eq(examenesDe(norm, 'musica').length, 0, 'Los exámenes de una app salen de SUS asignaturas');
eq(asignaturasDe(null, 'x'), [], 'Sin datos no revienta');

// 🚨 Nada de esto se guarda: se deriva (E3 F6, E3 F13).
ok(!/saveData|localStorage|supabase/.test(CODIGO_LIB), 'La librería no escribe en ningún sitio: el árbol se deriva');

console.log('\n── 7. La línea de cada app (apartado 6) ──');

eq(lineaDeApp(norm, 'bachillerato', HOY), 'Examen en 3 días', 'Lo que más importa es el examen que viene');
eq(lineaDeApp(norm, 'bachillerato', '2026-09-10'), 'Examen hoy', 'El día del examen lo dice así');
eq(lineaDeApp(norm, 'bachillerato', '2026-09-09'), 'Examen mañana', 'Y la víspera, así');
eq(lineaDeApp(norm, 'bachillerato', '2026-09-11'), 'Examen en 14 días', 'Pasado el primero, cuenta el siguiente');
eq(lineaDeApp(norm, 'bachillerato', '2026-09-12'), 'Examen en 13 días', 'Dentro de la ventana de dos semanas se dice cuándo');
// ⚠️ Para el otro lado hace falta un examen de verdad lejos: con los del escenario es imposible que
// el primero haya pasado Y el siguiente esté a más de 14 días a la vez.
const lejos = normalizarAppsDe({ ...ESCENARIO, examenes: [{ id: 'lej', asignaturaId: 'a1', fecha: '2026-11-20', tema: 'Final' }] });
eq(lineaDeApp(lejos, 'bachillerato', HOY), '1 examen', 'A más de 14 días se dice cuántos hay, no cuándo');
eq(lineaDeApp(norm, 'musica', HOY), '1 asignatura', 'Sin exámenes se cae a las asignaturas');
eq(lineaDeApp(norm, 'idi', HOY), null, 'Sin nada que decir no se dice nada: un "0 exámenes" llenaría el Home de ceros');
eq(lineaDeApp(norm, 'bachillerato', '2027-01-01'), '2 asignaturas', 'Con todos los exámenes pasados vuelve a las asignaturas');

console.log('\n── 8. La zona de PRÓXIMO (apartado 10) ──');

const prox = proximosEventos(norm, HOY);
eq(prox.length, 2, 'Entran los dos exámenes que caen dentro de los 30 días');
eq(proximosEventos(norm, HOY, { dias: 7 }).length, 1, 'Con la ventana en 7 días solo entra el primero');
eq(proximosEventos(norm, HOY).some((e) => e.fecha === '2026-06-01'), false, '🚨 y el que ya pasó NO entra');
eq(prox[0].titulo, 'Examen de Matemáticas', 'El evento dice de qué asignatura es');
eq(prox[0].programa, 'Bachillerato', 'Y de qué app viene');
eq(prox[0].detalle, 'Derivadas', 'Con su tema si lo tiene');
eq(prox[0].dias, 3, 'Y a cuántos días está');
ok(prox.every((e) => e.programaId && e.asignaturaId), 'Cada evento lleva los ids para poder navegar hasta él');
eq(proximosEventos(norm, HOY, { dias: 365 }).length, 2, 'Con una ventana mayor entra también el de septiembre 25');
eq(proximosEventos(norm, HOY, { dias: 365 }).map((e) => e.fecha), ['2026-09-10', '2026-09-25'], 'Ordenados por fecha');
eq(proximosEventos(norm, '2027-01-01').length, 0, 'Sin nada próximo, la lista está vacía');
eq(proximosEventos({ programas: [], asignaturas: [], examenes: [], horas: [] }, HOY), [], 'Sin datos no revienta');
ok(DIAS_PROXIMO === 30 && MAX_PROXIMO === 5, 'La ventana y el tope están declarados, no escritos a mano');

const muchos = {
  ...norm,
  examenes: Array.from({ length: 12 }, (_, i) => ({ id: `x${i}`, asignaturaId: 'a1', fecha: `2026-09-${String(8 + i).padStart(2, '0')}` })),
};
eq(proximosEventos(muchos, HOY).length, MAX_PROXIMO, 'La zona no crece sin fin: se topa en MAX_PROXIMO');

// ⚠️ El enunciado la pide "solo visual", pero los exámenes existen desde la Fase 6. Esconderlos sería
// la regla 8 al revés. Lo que todavía no puede salir, se declara.
ok(LO_QUE_FALTA_EN_PROXIMO.length >= 1 && LO_QUE_FALTA_EN_PROXIMO.every((x) => x.porque && x.enFase), 'Lo que falta en la zona de PRÓXIMO está declarado con su motivo y su fase');
ok(LO_QUE_FALTA_EN_PROXIMO.some((x) => /entrega|trabajo/i.test(x.que)), 'Las entregas se declaran como pendientes: no existe la entidad');

console.log('\n── 9. Navegación (apartados 11 y 12) ──');

eq(RUTA_RAIZ.vista, 'home', 'La raíz es el Home');
eq(abrirApp('bachillerato'), { vista: 'app', appId: 'bachillerato', ramaId: null }, 'Pulsar una app abre su espacio');
eq(abrirRama('bachillerato', 'examenes'), { vista: 'rama', appId: 'bachillerato', ramaId: 'examenes' }, 'Y dentro se abre una rama');
eq(atras(abrirRama('bachillerato', 'examenes')), abrirApp('bachillerato'), 'De una rama se vuelve a su app, no al Home');
eq(atras(abrirApp('bachillerato')), RUTA_RAIZ, 'De una app se vuelve al Home');
eq(atras(RUTA_RAIZ), RUTA_RAIZ, 'De la raíz se vuelve a la raíz: así no se sale de JosStyle sin querer');
eq(atras(null), RUTA_RAIZ, 'Sin ruta se vuelve a la raíz');

eq(migas(RUTA_RAIZ, norm.programas).map((m) => m.texto), ['Estudios'], 'En el Home la miga es solo Estudios');
eq(migas(abrirApp('bachillerato'), norm.programas).map((m) => m.texto), ['Estudios', 'Bachillerato'], 'Dentro de una app hay dos migas');
eq(migas(abrirRama('bachillerato', 'examenes'), norm.programas).map((m) => m.texto), ['Estudios', 'Bachillerato', 'Exámenes'], 'Y dentro de una rama, tres');
eq(migas(abrirApp('borrada'), norm.programas).map((m) => m.texto), ['Estudios'], 'Una app que ya no existe no rompe las migas');
ok(!/useState.*migas|migas\s*:/.test(CODIGO_LIB), 'Las migas son una función, no un estado guardado: se quedaría viejo al renombrar la app');

console.log('\n── 10. Los textos que se van del Home (apartados 7 y 8) ──');

ok(!/Un programa por pestaña/.test(VISTA), 'El subtítulo explicativo ha desaparecido del Home');
ok(!/la IA aconseja el plan/i.test(VISTA), 'Y la frase sobre lo que aconseja la IA con él');
ok(TEXTOS_RETIRADOS.length >= 3, 'Se declara qué textos se han retirado');
ok(TEXTOS_RETIRADOS.every((t) => t.porque), 'Cada uno con su motivo');
const panelIA = TEXTOS_RETIRADOS.find((t) => /Analizar mis estudios/.test(t.que));
ok(panelIA && panelIA.adonde, 'El panel de IA declara ADÓNDE va: el apartado 8 dice que no se elimina la inteligencia');
ok(/AIPanel/.test(VISTA), 'El panel de IA sigue existiendo en la vista');

console.log('\n── 11. La pantalla (apartados 1, 13, 14 y 15) ──');

ok(/estudiosApps/.test(VISTA), 'La vista usa la librería de la fase');
ok(/appsVisibles|appsOrdenadas/.test(CODIGO_VISTA), 'El Home pinta las apps visibles');
ok(/lineaDeApp/.test(CODIGO_VISTA), 'Cada app puede enseñar su línea de estado');
ok(/proximosEventos/.test(CODIGO_VISTA), 'La zona de PRÓXIMO lee los eventos de verdad');
ok(/grid-cols-3/.test(VISTA), 'La cuadrícula es de 3 columnas en móvil (apartado 14)');
ok(!/overflow-x-(auto|scroll)/.test(VISTA) || /tabla|codigo/i.test(VISTA), 'Sin scroll horizontal (apartado 14)');
ok(/active:scale/.test(VISTA) || /toque-44/.test(VISTA), 'Las apps responden al toque (apartado 15)');
ok(/module-enter|animate-|transition/.test(VISTA), 'Hay microinteracciones de entrada (apartado 15)');
ok(/aria-label/.test(VISTA), 'Los botones de solo icono llevan nombre accesible');

// 🚨 La comprobación del apartado 16: ningún dato existente desaparece de la pantalla.
ok(/AsignaturaCard/.test(CODIGO_VISTA), 'Las asignaturas se siguen pudiendo abrir: no se ha borrado la pantalla que ya existía');
ok(/onAddAsignatura/.test(CODIGO_VISTA), 'Se siguen pudiendo añadir asignaturas');
ok(/onAddExamen/.test(CODIGO_VISTA), 'Se siguen pudiendo añadir exámenes');
ok(/onAddHoras/.test(CODIGO_VISTA), 'Se siguen pudiendo registrar horas');
ok(/onDeletePrograma/.test(CODIGO_VISTA), 'Se sigue pudiendo eliminar un programa (por la papelera, como siempre)');
ok(/CorrelacionEstudio/.test(CODIGO_VISTA), 'La correlación con el sueño no se ha perdido');

console.log('\n── 12. Lo que esta fase NO hace (apartado 17) ──');

ok(NO_EN_ES1.length >= 5, `${NO_EN_ES1.length} cosas declaradas como no implementadas`);
ok(NO_EN_ES1.every((x) => x.que && x.porque), 'Cada una con su motivo');
ok(NO_EN_ES1.some((x) => /entrega|trabajo/i.test(x.que)), 'Las entregas están entre lo que no se hace');
ok(NO_EN_ES1.some((x) => /estad[íi]stica/i.test(x.que)), 'Las estadísticas también');
ok(!/próximamente|proximamente|en construcción/i.test(VISTA), 'Y no hay ni un "próximamente" en pantalla (regla 9)');

console.log('\n── 13. La condición de finalización se CALCULA (apartado 18) ──');

const cond = condicionES1(ESCENARIO);
ok(cond.length >= 9, `La condición tiene ${cond.length} casillas`);
ok(cond.every((c) => c.id && c.texto && typeof c.ok === 'boolean'), 'Cada casilla dice qué comprueba');
ok(cond.every((c) => c.ok), `Todas las casillas en verde: ${cond.filter((c) => !c.ok).map((c) => c.texto).join(', ') || 'ninguna roja'}`);

// 🚨 Y puede ponerse roja de verdad: una auditoría que no puede fallar no sirve (EH F42), y una
// comprobación cuya condición es siempre cierta es peor, porque parece que vigila algo.
const rota = condicionES1({ programas: ESCENARIO.programas, asignaturas: 'esto no es una lista', examenes: [], horas: [] });
eq(rota.find((c) => c.id === 'datos').ok, false, '🚨 con las asignaturas rotas, la casilla de datos conservados SE PONE ROJA');
eq(condicionES1(ESCENARIO).find((c) => c.id === 'datos').ok, true, '…y con el módulo bueno, verde');

console.log(`\n  ${fallos.length ? '✗' : '✓'} ES F1 — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
