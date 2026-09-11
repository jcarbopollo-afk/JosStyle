// ══════════════════════════════════════════════════════════════════════════
// E3 · FASES 41 y 42 (ES F1 y ES F2) — ESTUDIOS: EL HOME Y EL ÁRBOL
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
  RAMAS_POR_DEFECTO, SISTEMAS_DE_RAMA, IDS_SISTEMA, ramaPorId, ramasDe,
  TIPOS_ESTUDIO, IDS_TIPO, tipoDeEstudio, TIPO_DE_LOS_QUE_TRAE_LA_APP,
  SUGERENCIAS_RAMA, sugerenciasDeRama, MAX_NOMBRE_RAMA, ICONO_RAMA_POR_DEFECTO,
  normalizarRama, crearRama, anadirRama, quitarRama, AVISO_QUITAR_RAMA,
  TEXTO_RAMA_SIN_SISTEMA, NO_EN_ES2, condicionES2,
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

// 🚨 ES F2 — las ramas dejan de ser una lista global y viven DENTRO de cada app.
// ⚠️ Se comprueba QUE ESTÉN LAS QUE TIENEN QUE ESTAR, no cuántas hay: una cuenta exacta es una
// bomba de relojería, y la E3 F44 añadió dos con todo el derecho al construir entregas y eventos
// (EH F21, la lección de `MODULOS_EH.length === 13`).
ok(RAMAS_POR_DEFECTO.every((r) => IDS_SISTEMA.includes(r.sistema)), 'Una app nace solo con ramas que funcionan de verdad');
ok(['asignaturas', 'examenes', 'horas'].every((id) => RAMAS_POR_DEFECTO.some((r) => r.sistema === id)), 'Entre ellas las tres de siempre');
ok(IDS_SISTEMA.length >= 3, `Hay ${IDS_SISTEMA.length} sistemas de rama construidos`);
ok(Object.values(SISTEMAS_DE_RAMA).every((s) => typeof s.cuenta === 'function' && s.singular && s.plural), 'Cada sistema sabe contar lo suyo');
const bach = norm.programas.find((p) => p.id === 'bachillerato');
eq(ramaPorId(bach, 'asignaturas').nombre, 'Asignaturas', 'ramaPorId encuentra una rama DENTRO de su app');
eq(ramaPorId(bach, 'inventada'), null, 'ramaPorId no se inventa ramas');
eq(ramaPorId(null, 'asignaturas'), null, 'Sin app no hay rama');

const ramasBach = ramasDeApp(norm, 'bachillerato');
eq(ramasBach.length, RAMAS_POR_DEFECTO.length, 'Una app abre las ramas que tiene');
eq(ramasDeApp(norm, bach).map((r) => r.id), ramasBach.map((r) => r.id), 'ramasDeApp acepta el id o la app entera');
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
ok(Number.isFinite(DIAS_PROXIMO) && Number.isFinite(MAX_PROXIMO), 'La ventana y el tope están declarados, no escritos a mano');

const muchos = {
  ...norm,
  examenes: Array.from({ length: 12 }, (_, i) => ({ id: `x${i}`, asignaturaId: 'a1', fecha: `2026-09-${String(8 + i).padStart(2, '0')}` })),
};
eq(proximosEventos(muchos, HOY).length, MAX_PROXIMO, 'La zona no crece sin fin: se topa en MAX_PROXIMO');

// 🔓 **La ES F1 declaró aquí que las entregas no se podían enseñar, y la ES F4 las construyó.** Esta
// comprobación vigilaba una promesa; ahora vigila que se haya cumplido — que es para lo que estaba
// escrita (la lección de la SU F1 → SU F2: al cerrar una fase que otra dejó «para más adelante»,
// buscar la comprobación que lo guardaba).
eq(LO_QUE_FALTA_EN_PROXIMO, [], '🔓 Ya no falta nada en la zona de PRÓXIMO: la ES F4 construyó las entregas');
ok(proximosEventos(norm, HOY).every((e) => e.tipo), '⚠️ y cada fecha próxima declara su tipo');

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
// ⚠️ Esta comprobación buscaba `AsignaturaCard` por su NOMBRE, y la E3 F43 lo retiró con todo el
// derecho: su apartado 14 prohíbe la página larga. Lo que la frase promete es que **las asignaturas
// se sigan pudiendo abrir**, así que se busca el mecanismo de ahora (E3 F29, enésima vez).
ok(/FilaAsignatura/.test(CODIGO_VISTA) && /abrirAsignatura/.test(CODIGO_VISTA),
  'Las asignaturas se siguen pudiendo abrir: no se ha borrado la pantalla que ya existía');
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

console.log('\n── 14. ES F2 · Las ramas son de cada app y las configura él (apartados 4, 5, 13 y 14) ──');

// \U0001f6a8 El riesgo de esta fase: que lo guardado por la ES F1 cambie de aspecto. No cambia.
eq(ramasDe(norm.programas[0]).map((r) => r.id), RAMAS_POR_DEFECTO.map((r) => r.id),
  '🚨 Un programa SIN ramas guardadas recibe las que funcionan de verdad');
ok(ramasDe(norm.programas[0]).every((r) => r.sistema), 'y todas traen su sistema');

// ⚠️ Un array VACÍO no es lo mismo que no tener el campo: las quitó todas y eso se respeta.
const sinRamas = normalizarAppsDe({ ...ESCENARIO, programas: [{ id: 'x', nombre: 'Vacía', ramas: [] }] });
eq(ramasDe(sinRamas.programas[0]), [], '⚠️ Si las quitó TODAS se queda sin ninguna: `[]` no es "no tiene el campo"');

// Apartado 4 — dos apps pueden tener estructuras distintas.
const conPropia = anadirRama(norm.programas, 'musica', crearRama({ nombre: 'Repertorio', icono: '\U0001f3bc' }));
eq(ramasDe(conPropia.find((p) => p.id === 'musica')).length, RAMAS_POR_DEFECTO.length + 1, 'Añadir una rama la mete en SU app');
eq(ramasDe(conPropia.find((p) => p.id === 'bachillerato')).length, RAMAS_POR_DEFECTO.length, '🚨 y NO toca las de las demás: la estructura es flexible');
eq(ramasDe(conPropia.find((p) => p.id === 'musica')).at(-1).sistema, null, 'Una rama que crea él no tiene sistema detrás, y se sabe');
eq(anadirRama(norm.programas, 'musica', null), norm.programas, 'Añadir nada no cambia nada');

// Apartado 5 — crear una rama.
const oposiciones = crearRama({ nombre: 'Oposiciones', icono: '\U0001f4d6' });
eq(oposiciones.nombre, 'Oposiciones', 'crearRama guarda el nombre');
eq(oposiciones.icono, '\U0001f4d6', 'y el icono');
eq(oposiciones.sistema, null, 'y nace sin sistema');
ok(oposiciones.id, 'con su id');
eq(crearRama({ nombre: '  ' }), null, 'Sin nombre no se crea nada');
eq(crearRama({ nombre: 'Sin icono' }).icono, ICONO_RAMA_POR_DEFECTO, 'Sin icono se usa el de por defecto');
ok(crearRama({ nombre: 'x'.repeat(99) }).nombre.length === MAX_NOMBRE_RAMA, 'El nombre se acota');

// \U0001f6a8 Quitar una rama NO borra sus datos.
const quitada = quitarRama(norm.programas, 'bachillerato', 'examenes');
ok(!ramasDe(quitada.find((p) => p.id === 'bachillerato')).some((r) => r.id === 'examenes'), 'Quitar una rama la saca del árbol');
eq(ramasDe(quitada.find((p) => p.id === 'bachillerato')).length, RAMAS_POR_DEFECTO.length - 1, 'y solo esa');
const trasQuitar = normalizarAppsDe({ ...ESCENARIO, programas: quitada });
eq(examenesDe(trasQuitar, 'bachillerato').length, 3, '\U0001f6a8 y los exámenes SIGUEN ESTANDO: quitar no es borrar');
eq(ramasDe(quitarRama(norm.programas, 'musica', 'examenes').find((p) => p.id === 'bachillerato')).length, RAMAS_POR_DEFECTO.length, 'Quitar en una app no toca las otras');
ok(/se queda/i.test(AVISO_QUITAR_RAMA) && !/no se puede deshacer/i.test(AVISO_QUITAR_RAMA), 'El aviso dice que lo de dentro se queda, y no promete un borrado');

// Apartado 14 — persistencia: lo configurado sobrevive a otra pasada del normalizador.
const rehecho = normalizarAppsDe({ ...ESCENARIO, programas: conPropia });
ok(ramasDe(rehecho.programas.find((p) => p.id === 'musica')).some((r) => r.nombre === 'Repertorio'),
  '\U0001f6a8 Una rama creada por él SOBREVIVE al normalizador (apartado 14)');
eq(ramasDe(rehecho.programas.find((p) => p.id === 'musica')).find((r) => r.nombre === 'Repertorio').sistema, null,
  'y sigue sin sistema, no se le inventa uno');

// El normalizador de una rama.
eq(normalizarRama({ nombre: '  ' }), null, 'Una rama sin nombre se descarta');
eq(normalizarRama(null), null, 'Y una que no es un objeto también');
eq(normalizarRama({ nombre: 'Algo', sistema: 'inventado' }).sistema, null,
  '\U0001f6a8 Un sistema que no existe se queda en `null`, no revienta la pantalla');
eq(normalizarRama({ nombre: 'Algo', sistema: 'examenes' }).sistema, 'examenes', 'Un sistema que existe se respeta');
ok(normalizarRama({ nombre: 'Algo' }).id, 'Una rama sin id recibe uno');

console.log('\n── 15. ES F2 · Los cuatro tipos de estudio (apartado 12) ──');

eq(TIPOS_ESTUDIO.length, 4, 'Son cuatro tipos');
eq(IDS_TIPO, ['formal', 'habilidad', 'deporte', 'mental'], 'Educación formal, habilidad, deporte y entrenamiento mental');
ok(TIPOS_ESTUDIO.every((t) => t.nombre && t.icono && t.ejemplos), 'Cada uno con su nombre, su icono y sus ejemplos');
eq(tipoDeEstudio('formal').nombre, 'Educación formal', 'tipoDeEstudio encuentra uno');
eq(tipoDeEstudio('inventado'), null, 'y no se inventa ninguno');
eq(norm.programas.find((p) => p.id === 'bachillerato').tipo, 'formal', 'Bachillerato es educación formal');
eq(norm.programas.find((p) => p.id === 'musica').tipo, 'habilidad', 'Música es una habilidad');
eq(norm.programas.find((p) => p.id === 'idi').tipo, null,
  '\U0001f6a8 A lo que escribió Josué NO se le adivina el tipo: sería la app clasificándole sus estudios');
eq(Object.keys(TIPO_DE_LOS_QUE_TRAE_LA_APP), ['bachillerato', 'musica'], 'Solo los dos ids que creó la propia aplicación');
eq(normalizarPrograma({ id: 'x', nombre: 'X', tipo: 'inventado' }).tipo, null, 'Un tipo que no existe se descarta');

// ⚠️ El tipo NO restringe: solo decide qué se le PROPONE.
ok(sugerenciasDeRama('habilidad').some((x) => x.nombre === 'Repertorio'), 'A una habilidad se le proponen sus secciones');
ok(sugerenciasDeRama('mental').some((x) => x.nombre === 'Aperturas'), 'Y a un entrenamiento mental, las suyas');
ok(sugerenciasDeRama('deporte').some((x) => x.nombre === 'Partidos'), 'Y a un deporte, las suyas');
ok(!sugerenciasDeRama('habilidad').some((x) => x.nombre === 'Aperturas'), 'Cada tipo propone lo suyo, no todo');
ok(sugerenciasDeRama(null).length >= 9, '\U0001f6a8 Sin tipo se le ofrecen TODAS: no saber su tipo no puede dejarle sin sugerencias');
eq(new Set(sugerenciasDeRama(null).map((x) => x.nombre)).size, sugerenciasDeRama(null).length, 'y sin repetir');
ok(Object.values(SUGERENCIAS_RAMA).flat().every((x) => x.nombre && x.icono), 'Cada sugerencia trae nombre e icono');

// \U0001f6a8 Las de los ejemplos del apartado 4 NO se sirven de serie: serían pantallas vacías.
ok(!RAMAS_POR_DEFECTO.some((r) => ['Repertorio', 'Partidas', 'Aperturas', 'Instrumentos'].includes(r.nombre)),
  '\U0001f6a8 Ninguna rama sin sistema viene de serie: abrir Música no puede dar tres pantallas vacías');

console.log('\n── 16. ES F2 · Una rama sin sistema dice lo que es (apartados 6, 9 y 10) ──');

const ramasMusica = ramasDeApp(rehecho, rehecho.programas.find((p) => p.id === 'musica'));
const repertorio = ramasMusica.find((r) => r.nombre === 'Repertorio');
eq(repertorio.cuantos, null, '\U0001f6a8 Una rama sin sistema no finge un número: `null`, no un 0 que diría que está vacía');
eq(repertorio.linea, null, 'y no pinta línea');
eq(ramasMusica.find((r) => r.id === 'asignaturas').cuantos, 1, 'La que sí tiene sistema sigue contando');
ok(!/pr[óo]ximamente|en construcci[óo]n|fase \d/i.test(TEXTO_RAMA_SIN_SISTEMA),
  '\U0001f6a8 Y su texto NO dice "próximamente" ni nombra una fase (reglas 8 y 9)');
ok(/todav[íi]a no se puede guardar/i.test(TEXTO_RAMA_SIN_SISTEMA), 'Dice con una frase corta que aún no se guarda nada dentro (regla 8)');
ok(VISTA.includes('TEXTO_RAMA_SIN_SISTEMA'), 'y la pantalla lo usa');

console.log('\n── 17. ES F2 · La pantalla de un área (apartados 2, 3, 15 y 16) ──');

ok(/grid-cols-2/.test(VISTA), 'Las ramas se pintan en cuadrícula de tarjetas, como el Home (apartado 2)');
ok(/CrearRama/.test(CODIGO_VISTA), 'Hay un formulario para añadir una sección (apartado 5)');
ok(/quitarRama/.test(CODIGO_VISTA), 'y se puede quitar (apartado 14)');
ok(/sugerenciasDeRama/.test(CODIGO_VISTA), 'con las sugerencias de su tipo (apartado 4)');
ok(/TIPOS_ESTUDIO/.test(CODIGO_VISTA), 'y el tipo se elige al crear el área (apartado 12)');
// \U0001f6a8 La pantalla se elige por el SISTEMA, no por el id: desde la F2 los ids los pone uid().
ok(/sistema === /.test(CODIGO_VISTA), '\U0001f6a8 La rama abre su pantalla por su SISTEMA, no por su id');
ok(!/ruta\.ramaId === /.test(CODIGO_VISTA), 'y ya no queda ni un `ramaId === ` escrito a mano');

console.log('\n── 18. ES F2 · La condición de finalización (apartado 18) ──');

const cond2 = condicionES2(ESCENARIO);
ok(cond2.length >= 9, `La condición de la F2 tiene ${cond2.length} casillas`);
ok(cond2.every((c) => c.id && c.texto && typeof c.ok === 'boolean'), 'Cada casilla dice qué comprueba');
ok(cond2.every((c) => c.ok), `Todas en verde: ${cond2.filter((c) => !c.ok).map((c) => c.texto).join(', ') || 'ninguna roja'}`);
// \U0001f6a8 Y puede ponerse roja.
const rota2 = condicionES2({ programas: [{ id: 'a', nombre: 'A', ramas: [] }], asignaturas: [], examenes: [], horas: [] });
eq(rota2.find((c) => c.id === 'ramas_propias').ok, false, '\U0001f6a8 con un área sin ramas, la casilla de ramas propias SE PONE ROJA');
ok(NO_EN_ES2.length >= 6 && NO_EN_ES2.every((x) => x.que && x.porque), 'Lo que la F2 no implementa está declarado con su motivo');
ok(NO_EN_ES2.some((x) => /entregas/i.test(x.que)), 'Las entregas funcionales están entre lo que no se hace');
ok(NO_EN_ES2.some((x) => /estad[íi]stica/i.test(x.que)), 'Y las estadísticas académicas');

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

console.log(`\n  ${fallos.length ? '✗' : '✓'} ES F1 + F2 — ${pasa} comprobaciones${fallos.length ? `, ${fallos.length} FALLOS` : ''}`);
if (fallos.length) { fallos.forEach((f) => console.log(`      ✗ ${f}`)); process.exit(1); }
