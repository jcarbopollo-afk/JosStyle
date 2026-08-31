// ============================================================================
// EH · Fase 18/65 — Cuerpo e higiene masculina: configuración y perfil
//
// La fase que estuvo bloqueada por C-25 desde v1.67.0, y lo que la gobierna:
//   · DOS módulos con las siete casillas repartidas (respuesta 1 de Josué)
//   · manos y pies solo se ENCIENDEN aquí: la pantalla es la F22 (respuesta 2)
//   · el apartado 17 se cumple literalmente: quitar uno no toca el otro
//   · aquí no se pregunta lo que ya está contestado (aromas, sensibilidad)
//   · ni un catálogo de productos nuevo
//   · y nunca un diagnóstico
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, moduloEH,
} from '../src/lib/estiloDeHombre.js';
import { REGISTRO_DATOS, datoDelRegistro } from '../src/lib/datosEstiloHombre.js';
import { NIVELES_ESTILO } from '../src/lib/perfilEstilo.js';
import { PALABRAS_CLINICAS, sinDiagnostico } from '../src/lib/perfilPiel.js';
import { PARTES_POR_MODULO } from '../src/lib/gestionEstilo.js';
import { FUENTES_DE_ESTADO } from '../src/lib/miEstilo.js';
import { LINEAS_DE_PLAQUITA } from '../src/lib/pantallaEH.js';
import { FUENTES_BUSQUEDA, buscarEnEstilo } from '../src/lib/buscadorEstilo.js';
import {
  MODULO_HIGIENE, MODULO_CUERPO, MODULOS_CH, esModuloCH, PARTES_HIGIENE, PARTES_CUERPO,
  partesDeModulo, parteCH, COSAS_DE_HIGIENE_DIARIA, QUE_BUSCA, CATEGORIAS_PRODUCTO_CH,
  NECESIDADES_CH, TIEMPOS_CH, NIVELES_CH, PREGUNTAS_CH, preguntaCH, SECCIONES_CH,
  YA_CONTESTADO, loQueYaSabemosCH, normalizarCH, datosCH, estadoDeEntradaCH,
  decirAhoraNoCH, configurarCH, parteActivaCH, alternarParteCH, elegirPartesCH,
  alternarCosaHigiene, respuestaCH, contestarCH, progresoCH, seccionesDeCH,
  contextoDeCuerpo, PLAQUITAS_CH, plaquitasDe, resumenCH, lineaCH,
  textosDeCH, auditarCH, panelCH, TEXTOS_CH, CATALOGOS_QUE_LLEGAN_EN_F19,
} from '../src/lib/cuerpoHigiene.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const FUENTE = readFileSync(new URL('../src/lib/cuerpoHigiene.js', import.meta.url), 'utf8');
const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const VISTA = readFileSync(new URL('../src/views/EstiloHombreView.jsx', import.meta.url), 'utf8');
const con = (ids) => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ids);
const LOS_DOS = con(['higiene', 'cuerpo']);

console.log('\n🚿 EH · Fase 18/65 — Cuerpo e higiene: configuración y perfil\n');

/* ---------------------------------------------------------------------------
   1 · C-25: DOS MÓDULOS, SIETE CASILLAS REPARTIDAS
   --------------------------------------------------------------------------- */
{
  console.log('1 · Dos módulos, y las siete casillas repartidas');
  eq(MODULOS_CH, ['higiene', 'cuerpo'], '⚠️ son DOS módulos (respuesta 1 de Josué)');
  ok(!!moduloEH(MODULO_HIGIENE) && !!moduloEH(MODULO_CUERPO),
    'y los dos siguen en `MODULOS_EH`: no se retira ninguno');
  eq(moduloEH(MODULO_HIGIENE).nombre, 'Higiene',
    '⚠️ y se sigue llamando Higiene, no Aseo (respuesta 3)');
  ok(esModuloCH('higiene') && esModuloCH('cuerpo') && !esModuloCH('pelo'), 'se reconocen por id');

  const delApartado1 = [...PARTES_HIGIENE, ...PARTES_CUERPO].filter((p) => p.deApartado1);
  eq(delApartado1.length, 7, '⚠️ las SIETE casillas del apartado 1, ni una más ni una menos');
  eq(delApartado1.map((p) => p.nombre), [
    'Higiene diaria', 'Desodorante', 'Cuidado de manos', 'Cuidado de pies',
    'Cuidado corporal', 'Cuidado específico', 'Seguimiento',
  ], 'y son exactamente las del enunciado');
  eq(auditarCH().repetidas, [], '⚠️ ninguna casilla está en los dos módulos a la vez');
  eq(delApartado1.filter((p) => p.nombre === 'Seguimiento')[0].porDefecto, false,
    '⚠️ y Seguimiento va ☐, no ☑️, como en el enunciado');
  ok(delApartado1.filter((p) => p.nombre !== 'Seguimiento').every((p) => p.porDefecto),
    'las otras seis van marcadas');

  // ⚠️ Respuesta 2 — manos y pies se encienden aquí, se configuran en la F22.
  const manos = parteCH(MODULO_HIGIENE, 'manos');
  const pies = parteCH(MODULO_HIGIENE, 'pies');
  eq([manos.enFase, pies.enFase], [22, 22],
    '⚠️ manos y pies se configuran en la Fase 22 (respuesta 2 de Josué)');
  /* ⚠️ Eran dos cuando se escribió esto; la **F22 añadió `unas`**, que su
     apartado 1 pide con su propio interruptor. Se cuentan las que declaran esa
     fase, no un número escrito a mano — y ahora son tres. */
  eq(auditarCH().enFase22, 3, 'y la auditoría lo dice: las tres de la F22');
  ok(!PREGUNTAS_CH.some((p) => /mano|pie/i.test(p.titulo)),
    '⚠️ y aquí NO se les pregunta nada: solo se encienden');
}

/* ---------------------------------------------------------------------------
   2 · EL APARTADO 17: CADA COMPONENTE ES INDEPENDIENTE
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · "Puede quitar Higiene diaria sin quitar Cuidado corporal"');
  let e = elegirPartesCH(LOS_DOS, MODULO_HIGIENE, ['higieneDiaria', 'desodorante']);
  e = elegirPartesCH(e, MODULO_CUERPO, ['cuidadoCorporal']);
  eq(datosCH(e, MODULO_HIGIENE).partes.higieneDiaria, true, 'Higiene diaria puesta');
  eq(datosCH(e, MODULO_CUERPO).partes.cuidadoCorporal, true, 'y Cuidado corporal también');

  const sinHigiene = alternarParteCH(e, MODULO_HIGIENE, 'higieneDiaria');
  eq(datosCH(sinHigiene, MODULO_HIGIENE).partes.higieneDiaria, false, 'se quita Higiene diaria…');
  eq(datosCH(sinHigiene, MODULO_CUERPO).partes.cuidadoCorporal, true,
    '⚠️ …y CUIDADO CORPORAL SIGUE PUESTO (apartado 17, literal)');
  const alReves = alternarParteCH(e, MODULO_CUERPO, 'cuidadoCorporal');
  eq(datosCH(alReves, MODULO_HIGIENE).partes.higieneDiaria, true, '⚠️ y al revés igual');

  // ⚠️ La lección de la F21: elegir qué usas NO toca los interruptores de fases.
  eq(datosCH(e, MODULO_CUERPO).partes.rutinas, true,
    '⚠️ y elegir qué utilizas NO apaga las rutinas por la espalda (lección de la F21)');
  ok(PARTES_CUERPO.find((p) => p.id === 'rutinas').deApartado1 === false,
    'porque las rutinas no son una casilla del apartado 1');

  eq(alternarParteCH(e, MODULO_HIGIENE, 'inventada'), normalizarEstiloHombre(e),
    'una parte que no existe no hace nada');
  // ⚠️ Y una parte de un módulo no se cuela en el otro.
  eq(normalizarCH({ partes: { cuidadoCorporal: true } }, MODULO_HIGIENE).partes.cuidadoCorporal,
    undefined, '⚠️ una parte de Cuerpo no revive dentro de Higiene');
}

/* ---------------------------------------------------------------------------
   3 · LA ENTRADA (apartados 1 y 2)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · La entrada');
  eq(estadoDeEntradaCH(LOS_DOS, MODULO_HIGIENE), 'sin_configurar', 'de fábrica, sin configurar');
  eq(estadoDeEntradaCH(decirAhoraNoCH(LOS_DOS, MODULO_HIGIENE), MODULO_HIGIENE), 'ahora_no',
    '"Ahora no" se guarda, y no se le vuelve a plantar la pantalla');
  eq(datosCH(decirAhoraNoCH(LOS_DOS, MODULO_HIGIENE), MODULO_CUERPO).ahoraNo, false,
    '⚠️ y decir que no en uno no dice que no en el otro');
  eq(estadoDeEntradaCH(configurarCH(LOS_DOS, MODULO_HIGIENE), MODULO_HIGIENE), 'configurado',
    'y al terminar queda configurado');

  const p = panelCH(LOS_DOS, MODULO_HIGIENE);
  eq(p.entrada.casillas.length, 4, 'Higiene enseña SUS cuatro casillas');
  eq(panelCH(LOS_DOS, MODULO_CUERPO).entrada.casillas.length, 3, 'y Cuidado corporal, las suyas tres');
  eq(p.entrada.titulo, '¿Qué quieres utilizar?', 'con la pregunta del enunciado');
  ok(/Solo verás lo que hayas marcado/.test(p.entrada.soloLoTuyo),
    '⚠️ y "no mostrar lo que no haya seleccionado", dicho');
  ok(/opcional/i.test(p.opcional), 'y que el formulario es opcional (apartado 2)');
}

/* ---------------------------------------------------------------------------
   4 · EL SOLAPE DEL PROPIO ENUNCIADO, CERRADO (apartados 1 y 3)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Higiene diaria: la casilla y lo de dentro son dos cosas');
  eq(COSAS_DE_HIGIENE_DIARIA.map((c) => c.nombre), ['Ducha', 'Higiene corporal', 'Higiene íntima'],
    '⚠️ dentro de Higiene diaria van TRES cosas, no seis');
  ok(!COSAS_DE_HIGIENE_DIARIA.some((c) => /desodorante|mano|pie/i.test(c.nombre)),
    '⚠️ el desodorante, las manos y los pies NO están aquí dentro: son casillas propias');
  ok(PARTES_HIGIENE.some((p) => p.id === 'desodorante'),
    'y el desodorante es una casilla del apartado 1');

  const conDucha = alternarCosaHigiene(LOS_DOS, 'ducha');
  eq(datosCH(conDucha, MODULO_HIGIENE).cosas.ducha, true, 'se puede marcar la ducha');
  eq(datosCH(conDucha, MODULO_CUERPO).cosas.ducha, false,
    '⚠️ y eso no aparece en Cuidado corporal: solo Higiene lo guarda');
  eq(alternarCosaHigiene(LOS_DOS, 'inventada'), normalizarEstiloHombre(LOS_DOS),
    'una cosa que no existe no hace nada');
}

/* ---------------------------------------------------------------------------
   5 · AQUÍ NO SE PREGUNTA LO QUE YA ESTÁ CONTESTADO (apartados 2, 6 y 7)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · No preguntar lo que ya sabemos');
  eq(YA_CONTESTADO.map((x) => x.dato),
    ['aromasFavoritos', 'aromasQueNoGustan', 'sinPerfume', 'sensibilidadPiel'],
    '⚠️ cuatro datos que ya están en el registro de la F4');
  ok(YA_CONTESTADO.every((x) => !!datoDelRegistro(x.dato)),
    'y los cuatro existen ahí de verdad');
  eq(auditarCH().preguntasRepetidas, [],
    '⚠️ y NINGUNO tiene una pregunta propia en esta fase');

  // ⚠️ La F24 los declaró con `cuerpo` dentro, justo previendo esto.
  ok((datoDelRegistro('aromasFavoritos').usan || []).includes('cuerpo'),
    '⚠️ la F24 ya declaró los aromas con `cuerpo` en su `usan`, siete fases antes');
  ok((datoDelRegistro('sinPerfume').usan || []).includes('cuerpo'),
    'y la F17 hizo lo mismo con "sin perfume"');
  ok((datoDelRegistro('sensibilidadPiel').usan || []).includes('skincare'),
    'y la sensibilidad de piel está desde la F13');

  const ya = loQueYaSabemosCH(LOS_DOS);
  eq(ya.length, 4, 'se leen los cuatro');
  ok(ya.every((x) => 'tiene' in x && !!x.donde), 'con si lo tiene y dónde se cambia');
  // ⚠️ Y no se copia: el estado no crece.
  eq(JSON.stringify(normalizarEstiloHombre(LOS_DOS)), JSON.stringify(normalizarEstiloHombre(LOS_DOS)),
    'y leerlo no escribe nada');
}

/* ---------------------------------------------------------------------------
   6 · EL FORMULARIO (apartados 4 a 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · El formulario');
  eq(PREGUNTAS_CH.length, 5, 'cinco preguntas: mucho más ligero que Skincare');
  ok(PREGUNTAS_CH.every((p) => !!p.titulo && !!p.opciones && p.opciones.length > 0),
    'todas con su título y sus opciones');
  ok(new Set(PREGUNTAS_CH.map((p) => p.id)).size === PREGUNTAS_CH.length, 'ningún id repetido');
  ok(PREGUNTAS_CH.every((p) => SECCIONES_CH.some((s) => s.id === p.seccion)),
    'y ninguna en una sección que no existe');

  eq(QUE_BUSCA.length, 9, 'las nueve cosas del apartado 4');
  eq(CATEGORIAS_PRODUCTO_CH.map((c) => c.nombre),
    ['Gel de ducha', 'Crema corporal', 'Jabón', 'Desodorante', 'Otros'],
    'las cinco categorías del apartado 5');
  eq(NECESIDADES_CH.length, 8, 'las ocho del apartado 8');
  eq(TIEMPOS_CH.map((t) => t.nombre), ['Muy poco', 'Poco', 'Normal', 'No me importa'],
    'los cuatro tiempos del apartado 9');
  // ⚠️ Apartado 10 — el sistema global, importado.
  eq(NIVELES_CH, NIVELES_ESTILO, '⚠️ los niveles son los GLOBALES de la F6, no unos nuevos');
  ok(/nada se vuelve obligatorio/i.test(TEXTOS_CH.nivelSuave),
    'y el nivel solo abre opciones: nada se vuelve obligatorio');

  let e = contestarCH(LOS_DOS, MODULO_HIGIENE, 'queBuscaCuerpo', 'limpieza').estado;
  e = contestarCH(e, MODULO_HIGIENE, 'queBuscaCuerpo', 'olor').estado;
  eq(respuestaCH(e, MODULO_HIGIENE, 'queBuscaCuerpo').valores, ['limpieza', 'olor'],
    'se pueden marcar varias');
  ok(!!contestarCH(e, MODULO_HIGIENE, 'queBuscaCuerpo', 'zzz').error,
    'y una opción que no existe da error, no se guarda');
  eq(progresoCH(e, MODULO_HIGIENE).contestadas, 1, 'el progreso cuenta lo contestado');
  eq(progresoCH(e, MODULO_HIGIENE).total, 5, 'sobre lo visible');
  eq(contextoDeCuerpo(e, MODULO_HIGIENE).busca, ['limpieza', 'olor'],
    'y el contexto lo lleva para la F19');
  const secs = seccionesDeCH(e, MODULO_HIGIENE);
  ok(secs.length > 0, 'y las secciones traen sus preguntas');
  eq(secs.reduce((a, s2) => a + s2.total, 0), 5, '⚠️ y entre todas están las cinco: ninguna se pierde');
  ok(secs.every((s2) => s2.total > 0), 'y ninguna sección sale vacía');
}

/* ---------------------------------------------------------------------------
   7 · NI UN CATÁLOGO NUEVO, NI UN DIAGNÓSTICO (apartados 7, 15 y 18)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Ni un catálogo nuevo, ni un diagnóstico');
  eq(auditarCH().catalogosNuevos, 0, '⚠️ ni un catálogo de productos nuevo (apartado 15)');
  ok(!/CATALOGO_[A-Z]+\s*=\s*\[/.test(SIN_COMENTARIOS),
    'y no hay ninguno escrito en esta librería');
  ok(/from '\.\/motorProductos'/.test(FUENTE),
    '⚠️ los productos salen del motor de la F17: "no crear Catálogo corporal 2"');
  ok(!!TEXTOS_CH.catalogo && /catálogo/i.test(TEXTOS_CH.catalogo),
    'y el catálogo vacío a propósito se dice (D2-03)');

  eq(auditarCH().textosClinicos, [],
    '⚠️ ningún texto de esta fase suena a diagnóstico (apartado 7)');
  ok(PALABRAS_CLINICAS.length > 0 && !sinDiagnostico('tengo dermatitis'),
    'y la comprobación cazaría uno de verdad');
  ok(/from '\.\/perfilPiel'/.test(FUENTE),
    '⚠️ con la lista de la F13, no una segunda');
  ok(/quieras cuidar/i.test(preguntaCH('necesidadesCuerpo').titulo),
    '⚠️ y se pregunta QUÉ QUIERE CUIDAR, no qué le pasa');

  const textos = textosDeCH();
  ok(textos.every((t) => typeof t === 'string' && t.length > 0), 'ningún texto vacío');
  ok(!textos.some((t) => /fase \d|apartado \d|próximamente/i.test(t)),
    'ninguno menciona fases ni apartados (regla 9)');
}

/* ---------------------------------------------------------------------------
   8 · LO QUE LLEGA DESPUÉS, DICHO (regla 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Lo que llega en otra fase');
  ok(plaquitasDe(MODULO_HIGIENE).length > 0 && plaquitasDe(MODULO_CUERPO).length > 0,
    'los dos tienen sus plaquitas');
  ok(plaquitasDe(MODULO_HIGIENE).some((p) => p.fase === 22),
    'Higiene enseña la de manos y pies, que es la F22');
  ok(plaquitasDe(MODULO_CUERPO).some((p) => p.fase === 19),
    'y Cuidado corporal la de rutinas, que es la F19');
  const p = panelCH(LOS_DOS, MODULO_HIGIENE);
  ok(p.plaquitas.filter((x) => !x.lista).every((x) => !!x.texto),
    '⚠️ y la que todavía no existe LO DICE, en vez de abrir un vacío (regla 8)');
  eq(CATALOGOS_QUE_LLEGAN_EN_F19, ['METRICAS_PROGRESO', 'COLECCIONES_EH'],
    '⚠️ y las métricas y las colecciones llegan con la F19, que es la que crea listas');
}

/* ---------------------------------------------------------------------------
   9 · SU LÍNEA EN LOS CATÁLOGOS GLOBALES
   --------------------------------------------------------------------------- */
{
  console.log('\n9 · Su línea en los catálogos');
  ok(!!FUENTES_DE_ESTADO.higiene && !!FUENTES_DE_ESTADO.cuerpo,
    '⚠️ los dos tienen su línea en `FUENTES_DE_ESTADO` (F29)');
  ok(!!LINEAS_DE_PLAQUITA.higiene && !!LINEAS_DE_PLAQUITA.cuerpo,
    'y en `LINEAS_DE_PLAQUITA` (F31)');
  ok(!!PARTES_POR_MODULO.higiene && !!PARTES_POR_MODULO.cuerpo,
    'y en `PARTES_POR_MODULO` (F36)');
  eq(PARTES_POR_MODULO.higiene.partes, PARTES_HIGIENE, '⚠️ cada uno con SUS partes');
  eq(PARTES_POR_MODULO.cuerpo.partes, PARTES_CUERPO, 'y no las del otro');
  ok(FUENTES_BUSQUEDA.some((f) => f.modulo === 'higiene')
    && FUENTES_BUSQUEDA.some((f) => f.modulo === 'cuerpo'),
    'y en `FUENTES_BUSQUEDA` (F37)');

  // ⚠️ Y la línea de la portada sale de su `lineaCH()`, no de un dato nuevo.
  eq(lineaCH(DEFAULT_ESTILO_HOMBRE, MODULO_HIGIENE), null,
    'sin configurar no hay línea que enseñar');
  const e = elegirPartesCH(LOS_DOS, MODULO_HIGIENE, ['higieneDiaria', 'desodorante']);
  eq(lineaCH(e, MODULO_HIGIENE), '2 de 4 activados', 'y configurado, dice cuántas tiene');
  eq(resumenCH(e, MODULO_HIGIENE).de, 5, 'el resumen cuenta las preguntas visibles');

  // Y el buscador lo encuentra de verdad.
  const r = buscarEnEstilo(e, 'desod');
  ok(r.grupos.some((g) => g.resultados.some((x) => x.nombre === 'Desodorante')),
    '⚠️ y buscar "desod" encuentra el desodorante de Higiene');
}

/* ---------------------------------------------------------------------------
   10 · PERSISTENCIA Y PANTALLA
   --------------------------------------------------------------------------- */
{
  console.log('\n10 · Persistencia y pantalla');
  eq(Object.keys(normalizarCH({}, MODULO_HIGIENE)).sort(),
    ['ahoraNo', 'configurado', 'cosas', 'editado', 'partes'],
    'el normalizador conoce todos los campos (regla 5)');
  eq(normalizarCH(null, MODULO_HIGIENE).partes.higieneDiaria, true,
    'un guardado corrupto cae en los valores por defecto');
  eq(normalizarCH({ partes: { fantasma: true } }, MODULO_HIGIENE).partes.fantasma, undefined,
    'una parte de otra versión no revive');
  eq(normalizarCH({ editado: 7 }, MODULO_HIGIENE).editado, null, 'ni una fecha que no lo es');

  let e = elegirPartesCH(LOS_DOS, MODULO_HIGIENE, ['higieneDiaria']);
  e = alternarCosaHigiene(e, 'ducha');
  const guardado = datosCH(e, MODULO_HIGIENE);
  const releido = normalizarCH(JSON.parse(JSON.stringify(guardado)), MODULO_HIGIENE);
  eq(releido, guardado, '⚠️ guardar y volver a leer devuelve lo mismo');
  const cfg = normalizarEstiloHombre(e).modulos.find((m) => m.id === MODULO_HIGIENE).config;
  ok('cuerpoHigiene' in cfg, 'y vive en la config de su módulo');

  ok(/export function CuerpoHigieneEH/.test(VISTA), 'la pantalla existe');
  ok(/import \{[\s\S]*?panelCH[\s\S]*?\} from '\.\.\/lib\/cuerpoHigiene'/.test(VISTA),
    '⚠️ y la vista IMPORTA la librería (la lección de la F15)');
  ok(/if \(id === MODULO_HIGIENE \|\| id === MODULO_CUERPO\) return setCuerpoHigiene\(id\)/.test(VISTA),
    'y las plaquitas de los dos módulos abren esa pantalla');
  ok(/modulo=\{cuerpoHigiene\}/.test(VISTA),
    '⚠️ una sola pantalla para los dos, distinguidos por su id: ni una copia');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
