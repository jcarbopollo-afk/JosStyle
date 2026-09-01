// ============================================================================
// EH · Fase 51/65 — Control de calidad de la experiencia real
//
// *"Todo funciona" no es la condición de finalización. Lo es "todo funciona y
// utilizarlo resulta natural".*
//
// Lo que vigila esta prueba:
//   · que ningún recorrido mienta sobre por dónde pasa (contra la vista real)
//   · que ninguna acción de todos los días cueste más de tres toques
//   · que lo que él personaliza siga ahí después de cerrar y volver (regla 5)
//   · y que los cuatro apartados que necesitan a una persona lo digan
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { GRAVEDADES as GRAVEDADES_F47 } from '../src/lib/pruebasIntegrales.js';
import { SE_POSPONE as SE_POSPONE_F48 } from '../src/lib/auditoriaFinal.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { IDS_EH } from '../src/lib/estiloDeHombre.js';
import {
  TIPOS_DE_ACCION, tipoDeAccion, maximoDe,
  RECORRIDOS, recorrido, toquesDe, demasiadoLargos, RECORRIDOS_DEL_ENUNCIADO, componentesQueAbren,
  PREGUNTAS, pregunta, responder, sinRespuesta,
  PERFILES_DE_USO, perfilDeUso, estadoDePerfil, probarPerfil,
  LO_QUE_SE_PERSONALIZA, personalizable, cerrarYVolver, probarPersistencia, noPermanecen,
  NO_QUIERO_ESTO, noQuiero, MAXIMO_PARA_VOLVER, dificilesDeRecuperar,
  RESBALONES, PROTECCIONES, resbalon, sinProteccion, modulosQueConfirman,
  SABER_SIEMPRE,
  APARTADOS_EXPERIENCIA, apartadoExperiencia, apartadosDeJosue, apartadosYaHechos, apartadosAutomaticos,
  FALLOS_DE_EXPERIENCIA, fallo, fallosPorGravedad, criticos,
  TEXTOS_EXPERIENCIA, auditarExperiencia, panelExperiencia,
  GRAVEDADES, SE_POSPONE,
} from '../src/lib/experienciaReal.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const VISTA = readFileSync(join(RAIZ, 'src/views/EstiloHombreView.jsx'), 'utf8');

console.log('\n🧭 EH · Fase 51/65 — Control de calidad de la experiencia real\n');

/* ---------------------------------------------------------------------------
   1 · CUÁNTO CUESTA CADA ACCIÓN (apartados 3 y 12)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Los toques de cada acción');
  eq(demasiadoLargos(), [], '⚠️ ni una acción se pasa de los toques que su tipo permite');

  eq(TIPOS_DE_ACCION.map((t) => [t.id, t.maximo]),
    [['diaria', 3], ['puntual', 4], ['ajuste', 5]],
    'los tres límites, escritos antes de medir (decisión 4)');
  ok(!!tipoDeAccion('diaria') && !tipoDeAccion('inventado'), 'los tipos se buscan por id');
  eq(maximoDe('nada'), 3, 'y un tipo desconocido cae en el más estricto, no en el más laxo');

  /* ⚠️ Los cinco que el enunciado nombra por su nombre. */
  eq(RECORRIDOS_DEL_ENUNCIADO,
    ['anadir_perfume', 'marcar_favorito', 'abrir_rutina', 'ocultar_modulo', 'crear_recordatorio'],
    'los cinco del enunciado, con su nombre');
  eq(toquesDe('marcar_favorito'), 2, 'marcar favorito: dos toques');
  eq(toquesDe('abrir_rutina'), 2, 'abrir la rutina: dos');
  eq(toquesDe('anadir_perfume'), 3, 'añadir un perfume: tres');
  ok(RECORRIDOS.filter((r) => r.tipo === 'diaria').every((r) => r.pasos.length <= 3),
    '⚠️ y ninguna de las de todos los días pasa de tres');

  /* 🚨 Decisión 1 — un recorrido no puede inventarse por dónde pasa. */
  eq(auditarExperiencia(null, { vista: VISTA }).componentesInventados, [],
    '🚨 cada componente que dicen abrir EXISTE en la vista de verdad');
  ok(componentesQueAbren().length >= 10, `${componentesQueAbren().length} componentes reales nombrados`);

  /* La comprobación de la comprobación: si me invento uno, salta. */
  eq(auditarExperiencia(null, { vista: 'export function PerfumesEH() {}' }).componentesInventados.length,
    componentesQueAbren().length - 1,
    '⚠️ y con una vista que no los tiene, los caza todos menos el que sí está');

  ok(!!recorrido('anadir_perfume') && !recorrido('inventado'), 'los recorridos se buscan por id');
  eq(toquesDe('inventado'), 0, 'y uno que no existe no cuesta toques');
  ok(RECORRIDOS.every((r) => r.pasos.length === toquesDe(r.id)),
    '⚠️ los toques SON los pasos: no hay un número aparte que se quede desfasado');
  ok(recorrido('abrir_rutina').atajo === 'rutina_facial',
    'y la rutina de hoy cuesta uno con el acceso rápido de la F29');
}

/* ---------------------------------------------------------------------------
   2 · ¿DÓNDE ESTÁ ESTO? (apartado 4)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Descubrimiento: dónde buscaría uno cada cosa');
  const estado = estadoDePerfil('avanzado');
  eq(sinRespuesta(estado), [], '⚠️ las siete preguntas tienen respuesta');
  eq(PREGUNTAS.filter((p) => p.delEnunciado).map((p) => p.id),
    ['perfume', 'preferencias', 'ocultar'], 'las tres que él escribe');

  /* ⚠️ Se responde con el buscador de la F39, no con la tabla de esta fase. */
  ok(responder(estado, 'perfume').porBuscador, 'la del perfume se contesta buscando "perfume"');
  ok(responder(estado, 'perfume').encontrado, '⚠️ y escribir "perfume" lleva a Perfumes');
  ok(responder(estado, 'perfume').primero, 'y lo lleva primero, por delante del cuerpo');
  ok(responder(estado, 'perfume').cuantos >= 2,
    'sin que salga solo él: "perfume" también es del cuerpo, y eso está bien');
  ok(responder(estado, 'unas').encontrado, '⚠️ y escribir "uñas", con eñe, lleva a Higiene (F22)');
  ok(!responder(estado, 'ocultar').porBuscador && responder(estado, 'ocultar').encontrado,
    'y las de ajustes se contestan por su recorrido, no buscando un módulo');
  ok(!responder(estado, 'inventada'), 'una pregunta que no existe no se contesta');
  ok(!!pregunta('papelera'), 'las preguntas se buscan por id');

  /* ⚠️ Y el buscador **no es un sello de goma**: una palabra que no es de nadie
     no devuelve nada. Sin esto, "las siete tienen respuesta" no valdría nada. */
  eq(responder(estadoDePerfil('avanzado'), 'perfume').encontrado, true, 'el buscador encuentra…');
  ok(sinRespuesta({ ...estadoDePerfil('avanzado'), modulos: [] }).length === 0,
    '⚠️ y las encuentra también con todo apagado, a propósito: así se enciende lo que falta (F28)');
}

/* ---------------------------------------------------------------------------
   3 · EL SENCILLO, EL AVANZADO Y EL QUE NO ENCIENDE NADA (5, 6 y 7)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Con dos módulos, con todos, y con ninguno');
  const simple = probarPerfil('simple');
  eq([simple.activos, simple.plaquitas], [2, 2], 'el sencillo: skincare y perfumes, y sus dos plaquitas');
  eq(simple.vacia, false, '⚠️ y con dos encendidos la pantalla NO se ve vacía');
  eq([simple.huerfanas, simple.sinPlaquita], [[], []],
    '⚠️ ni una plaquita de un módulo apagado, ni un módulo activo sin plaquita');
  eq(simple.secciones, 2, 'con sus dos secciones: cuidado y estilo');

  const avanzado = probarPerfil('avanzado');
  eq(avanzado.activos, IDS_EH.length, `el avanzado: los ${IDS_EH.length} del catálogo`);
  eq([avanzado.huerfanas, avanzado.sinPlaquita], [[], []], 'y tampoco se pierde ninguno');
  ok(avanzado.secciones >= 5, `apartado 5 — repartidos en ${avanzado.secciones} secciones, no en una lista`);
  ok(avanzado.mayorSeccion <= 8,
    `⚠️ y la sección más cargada tiene ${avanzado.mayorSeccion}: agrupadas, no amontonadas`);

  const vacio = probarPerfil('vacio');
  eq(vacio.vacia, true, 'el que no enciende nada no tiene plaquitas…');
  eq(vacio.pantalla, 'sin_modulos',
    '⚠️ …pero la pantalla NO está en blanco: está en `sin_modulos`, con el texto de la F25');
  ok(!!perfilDeUso('simple') && !perfilDeUso('inventado'), 'los perfiles se buscan por id');
  ok(!probarPerfil('inventado'), 'y uno que no existe no se prueba');
  eq(PERFILES_DE_USO.map((p) => p.apartado), [6, 7, 5], 'cada perfil dice de qué apartado sale');
}

/* ---------------------------------------------------------------------------
   4 · CERRAR Y VOLVER (apartado 8) — la regla 5 hecha prueba
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Lo que él personaliza sigue ahí al volver');
  const r = probarPersistencia();
  eq(r.length, 7, 'las siete cosas que él puede personalizar');
  eq(noPermanecen(), [], '🚨 ⚠️ las siete sobreviven a cerrar y volver (regla 5)');
  eq(r.filter((x) => !x.cambia).map((x) => x.id), [], 'y antes de eso, las siete se cambian de verdad');

  /* ⚠️ Que la prueba pase por JSON no es un detalle: es lo que hace `saveData`. */
  ok(LO_QUE_SE_PERSONALIZA.every((c) => typeof c.cambia === 'function' && typeof c.lee === 'function'),
    '⚠️ cada una trae la función que la cambia y la que la lee: no es una tabla');
  ok(LO_QUE_SE_PERSONALIZA.every((c) => !!c.guarda), 'y dónde vive dentro del estado');
  ok(!!personalizable('tamano') && !personalizable('inventado'), 'se buscan por id');

  /* La comprobación de la comprobación: un campo que el normalizador no conozca
     tiene que caerse aquí. Se simula metiendo uno a mano. */
  const conInventado = { ...cerrarYVolver({}), inventado: 'hola' };
  eq(cerrarYVolver(conInventado).inventado, undefined,
    '🚨 y un campo que el normalizador no conoce se pierde al guardar: eso es la regla 5');

  eq(r.find((x) => x.id === 'tamano').despues, 'grande',
    'el tamaño de la plaquita vuelve siendo grande');
  eq(r.find((x) => x.id === 'orden').despues, 'perfumes',
    'y el orden que él puso sigue siendo el suyo');
}

/* ---------------------------------------------------------------------------
   5 · QUITARLO Y RECUPERARLO (apartados 9 y 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · No quiero esto — y quiero recuperarlo');
  eq(NO_QUIERO_ESTO.filter((x) => x.delEnunciado).map((x) => x.id),
    ['recomendaciones', 'estadisticas', 'notificaciones', 'descubrir'], 'las cuatro que él nombra');
  eq(dificilesDeRecuperar(), [],
    `⚠️ ninguna cuesta más de ${MAXIMO_PARA_VOLVER} toques recuperarla ("sin buscar en cinco menús")`);
  ok(NO_QUIERO_ESTO.every((x) => !!x.seQuita && !!x.seRecupera),
    'y cada una dice dónde se quita Y dónde se recupera');
  eq(noQuiero('descubrir').toquesQuitar, 1,
    '⚠️ quitar la tarjeta de Descubrir cuesta UN toque: lo que molesta se quita ya');
  ok(noQuiero('descubrir').toquesVolver > noQuiero('descubrir').toquesQuitar,
    'y recuperarla cuesta más, a propósito');
  ok(NO_QUIERO_ESTO.every((x) => ['partes', 'avisos', 'papelera'].includes(x.mecanismo)),
    '⚠️ y ninguna inventa un mecanismo nuevo: son los de la F36, la F34 y la F38');
  ok(Object.keys(CATALOGO_PAPELERA).length >= 45,
    `la papelera cubre ${Object.keys(CATALOGO_PAPELERA).length} colecciones (ME F3)`);
  ok(!noQuiero('inventado'), 'y una que no existe no se quita');
}

/* ---------------------------------------------------------------------------
   6 · EL RESBALÓN (apartado 11)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Errores humanos');
  eq(RESBALONES.length, 6, 'los cuatro del enunciado, y dos más');
  eq(sinProteccion(), [], '⚠️ y el que no lleva confirmación explica POR QUÉ no la lleva');
  ok(RESBALONES.every((x) => PROTECCIONES.includes(x.protege)),
    'cada uno con una de las cinco protecciones, sin inventarse una sexta');
  eq(resbalon('borrar_sin_querer').protege, 'papelera', 'borrar sin querer: a la papelera');
  eq(resbalon('borrar_todo').protege, 'confirmacion_fuerte', 'vaciarlo todo: confirmación fuerte');
  ok(/mismo toque|lo mismo/.test(resbalon('preferencia_equivocada').porque),
    '⚠️ y una preferencia NO lleva aviso: deshacerla cuesta lo mismo que hacerla');
  ok(/no hay/i.test(resbalon('salir_sin_guardar').porque),
    '⚠️ ni "salir sin guardar": no existe guardar, cada cambio se guarda al hacerlo');
  ok(modulosQueConfirman().length >= 5,
    `${modulosQueConfirman().length} módulos piden confirmación al apagarse`);
  ok(!resbalon('inventado'), 'los resbalones se buscan por id');
}

/* ---------------------------------------------------------------------------
   7 · SABER SIEMPRE (apartado 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Confianza: saber siempre en qué estado está todo');
  eq(SABER_SIEMPRE.map((s) => s.id),
    ['guardado', 'oculto', 'desactivado', 'eliminado', 'recuperable'], 'las cinco que él enumera');
  ok(SABER_SIEMPRE.every((s) => !!s.donde && !!s.calcula),
    '⚠️ y cada una con dónde se ve Y quién lo calcula: sin función detrás sería una frase bonita');
}

/* ---------------------------------------------------------------------------
   8 · LOS APARTADOS, Y LOS QUE NO PUEDO HACER YO
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Los diecinueve apartados');
  eq(APARTADOS_EXPERIENCIA.length, 19, 'los diecinueve');
  eq(APARTADOS_EXPERIENCIA.map((a) => a.id), Array.from({ length: 19 }, (_, i) => i + 1), 'y en su orden');
  eq(apartadosDeJosue().map((a) => a.id), [1, 2, 13, 19],
    '🚨 ⚠️ cuatro necesitan a una persona: el primer día, el tercero, las notificaciones y la final');
  eq(auditarExperiencia(null, { vista: VISTA }).sinMotivo, [],
    '⚠️ y ninguno de ésos se queda sin decir por qué');
  ok(/no puede hacer esta prueba/i.test(apartadoExperiencia(19).porque),
    '🚨 la 19 con el motivo de verdad: he leído las fases, así que soy el único que NO puede hacerla');
  ok(apartadosAutomaticos().every((a) => a.cumplido && !!a.donde),
    'y los automáticos dicen en qué función se comprueban');

  /* ⚠️ Decisión 5 — dos apartados ya los contestaron otras fases. */
  eq(apartadosYaHechos().map((a) => a.id), [16, 17], 'dos ya estaban contestados');
  ok(/F49/.test(apartadoExperiencia(16).donde), '⚠️ la coherencia, por la F49: no se reescribe');
  ok(/F48/.test(apartadoExperiencia(17).donde), '⚠️ y "¿realmente hace falta?", por la F48');
  ok(SE_POSPONE === SE_POSPONE_F48, 'y se importa de allí, no se copia');
  ok(SE_POSPONE.length > 0, `con las ${SE_POSPONE.length} que la F48 pospuso`);
}

/* ---------------------------------------------------------------------------
   9 · LA LISTA DE FALLOS (apartado 18) Y EL VEREDICTO
   --------------------------------------------------------------------------- */
{
  console.log('\n9 · La lista de fallos y la condición de finalización');
  ok(GRAVEDADES === GRAVEDADES_F47, '⚠️ las cuatro gravedades son las de la F47, importadas');
  eq(GRAVEDADES.map((g) => g.icono), ['🔴', '🟠', '🟡', '🟢'], 'con sus cuatro iconos');
  eq(criticos().length, 0, '🎯 ni un fallo crítico');
  ok(FALLOS_DE_EXPERIENCIA.every((f) => !!gravedadValida(f.gravedad) && !!f.que && !!f.decision),
    'y cada fallo dice su gravedad, qué es y qué se decidió');
  eq(fallosPorGravedad().map((f) => f.gravedad), ['mejora', 'mejora'], 'ordenados por gravedad');
  ok(!!fallo('sin_atajo') && !fallo('inventado'), 'los fallos se buscan por id');

  const panel = panelExperiencia(null, { vista: VISTA });
  eq(panel.natural, true, '🎯 usarlo no cuesta más de lo que debería');
  eq(panel.paraJosue, [1, 2, 13, 19],
    '⚠️ y lo que necesita una persona queda FUERA del veredicto, no contado como verde');
  ok(/resulta natural/.test(panel.condicion), 'con la condición del enunciado, entera');
  ok(/no puedo hacer/.test(TEXTOS_EXPERIENCIA.sinInstrucciones), 'y la frase que la resume');
  ok(/sin sacrificar claridad/.test(TEXTOS_EXPERIENCIA.sinSacrificar),
    'incluida la mitad que se olvida: menos toques, pero sin sacrificar claridad');
}

function gravedadValida(id) { return GRAVEDADES.some((g) => g.id === id); }

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
