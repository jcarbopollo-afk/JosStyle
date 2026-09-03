// ============================================================================
// EH · Fase 54/65 — Backup, restauración y recuperación avanzada
//
// *"Un error nunca debería convertirse automáticamente en una pérdida
// irreversible de información."*
//
// Lo que vigila esta prueba:
//   · los cuatro niveles, del más pequeño al más grande
//   · 🚨 que restaurar UN módulo no toque a los demás (el nivel que faltaba)
//   · que la restauración se haya PROBADO: datos → copia → romper → restaurar
//   · y que lo que depende de un sistema global que no existe esté dicho
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { normalizarEstiloHombre, IDS_EH, VERSION_EH } from '../src/lib/estiloDeHombre.js';
import { VERSION_ACTUAL as VERSION_F46 } from '../src/lib/migracion.js';
import { CATALOGO_PAPELERA as PAPELERA } from '../src/lib/papelera.js';
import {
  NIVELES, nivel,
  LO_QUE_FALTA, falta,
  MOMENTOS_DE_COPIA, copiaDeSeguridad, esCopia,
  restaurarModulo, loQueSePierde, restaurarTodo, TEXTOS_RECUPERACION,
  IMPORTAR_EXISTE, MOTIVOS_INVALIDA, motivoInvalida, validarCopia,
  OPERACIONES, CAMPOS_PROHIBIDOS, registrar, registroLimpio,
  ensayoDeRestauracion,
  SIMULACROS, simulacro, simulacrosSinRecuperacion,
  APARTADOS_RECUPERACION, apartadoRecuperacion, apartadosSinCumplir,
  auditarRecuperacion, panelRecuperacion,
} from '../src/lib/recuperacion.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const SUPA = readFileSync(join(RAIZ, 'src/lib/supabase.js'), 'utf8');

/* Un estado con datos en dos módulos, para no probar sobre el vacío. */
const conDatos = () => normalizarEstiloHombre({
  configurado: true,
  modulos: [
    { id: 'perfumes', activo: true, oculto: false, orden: 0, config: { perfumes: { perfumes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] } } },
    { id: 'skincare', activo: true, oculto: true, orden: 1, config: { seguimiento: { registros: [{ id: 'r1' }, { id: 'r2' }] } } },
    { id: 'pelo', activo: false, oculto: false, orden: 2, config: { rutinas: { rutinas: [{ id: 'x' }] } } },
  ],
});

console.log('\n♻️ EH · Fase 54/65 — Backup, restauración y recuperación avanzada\n');

/* ---------------------------------------------------------------------------
   1 · LOS CUATRO NIVELES (condición de finalización)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Los cuatro niveles');
  eq(NIVELES.map((x) => x.icono), ['🗑️', '🔄', '♻️', '☁️'], 'los cuatro de la condición, con sus iconos');
  eq(NIVELES.map((x) => x.nivel), [1, 2, 3, 4], 'del más pequeño al más grande');
  ok(NIVELES.every((x) => x.existe), '🎯 y los cuatro EXISTEN');
  eq(NIVELES.filter((x) => x.nuevo).map((x) => x.id), ['modulo'],
    '⚠️ el que faltaba era el 3: restaurar un módulo sin tocar los demás');
  ok(nivel('configuracion').noBorra,
    '⚠️ y el nivel 2 no borra ni un dato: solo devuelve orden, tamaños y visibilidad');
  ok(NIVELES.every((x) => !!x.funcion && !!x.deLaFase),
    'cada nivel dice con qué función se hace y de qué fase viene');
  ok(/papelera/i.test(nivel('elemento').con), 'el 1 es la papelera global, no una propia');
  ok(!nivel('inventado'), 'los niveles se buscan por id');
  ok(/camino corto/.test(TEXTOS_RECUPERACION.nivelMasSencillo),
    '⚠️ apartado 5 — y se dice que para una cosa borrada no hace falta restaurar nada más');
}

/* ---------------------------------------------------------------------------
   2 · 🚨 RESTAURAR UN MÓDULO NO TOCA A LOS DEMÁS (apartados 5 y 7)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · El nivel que faltaba: restaurar SOLO un apartado');
  const base = conDatos();
  const copia = copiaDeSeguridad(base);
  ok(esCopia(copia), 'la copia se reconoce como copia');
  eq(copia.tipo, 'estiloHombre', 'y dice de qué es');
  ok(!!copia.fecha && !!copia.version, '⚠️ con su fecha y su versión: restaurar a ciegas es lo que se evita');

  /* Se pierden los perfumes. */
  const roto = { ...base, modulos: base.modulos.map((m) => (m.id === 'perfumes' ? { ...m, config: {} } : m)) };
  const r = restaurarModulo(roto, 'perfumes', copia);
  ok(r.hecho, 'se restaura el apartado');
  eq(r.estado.modulos.find((m) => m.id === 'perfumes').config.perfumes.perfumes.length, 3,
    '🚨 y vuelven los tres perfumes');

  /* 🚨 Lo que de verdad importa: los OTROS no se han movido. */
  const skin = (e) => e.modulos.find((m) => m.id === 'skincare');
  eq(skin(r.estado).config.seguimiento.registros.length, 2,
    '🚨 ⚠️ y Skincare sigue con sus dos registros: restaurar uno no toca a los demás');
  eq(skin(r.estado).oculto, true, '⚠️ ni su "oculto"');
  eq(r.estado.modulos.find((m) => m.id === 'pelo').activo, false, 'ni el "activo" de Pelo');
  eq(r.estado.modulos.map((m) => m.orden), base.modulos.map((m) => m.orden), 'ni el orden de nadie');

  /* ⚠️ Y restaurar datos no vuelve a encender un módulo que él apagó. */
  const apagado = { ...base, modulos: base.modulos.map((m) => (m.id === 'perfumes' ? { ...m, activo: false, config: {} } : m)) };
  const r2 = restaurarModulo(apagado, 'perfumes', copia);
  eq(r2.estado.modulos.find((m) => m.id === 'perfumes').activo, false,
    '🚨 ⚠️ y si él lo apagó, restaurar sus datos NO lo vuelve a encender');
  eq(r2.estado.modulos.find((m) => m.id === 'perfumes').config.perfumes.perfumes.length, 3,
    'aunque los datos sí vuelven');

  /* Y hace su propia copia antes, para deshacer una restauración mal hecha. */
  ok(esCopia(r.antes), '⚠️ y guarda una copia de ANTES: restaurar mal también se deshace');

  /* Los casos que no. */
  eq(restaurarModulo(base, 'inventado', copia).hecho, false, 'un apartado que no existe no se restaura');
  ok(!!restaurarModulo(base, 'inventado', copia).error, 'y lo dice');
  eq(restaurarModulo(base, 'perfumes', { cualquier: 'cosa' }).hecho, false,
    '⚠️ y algo que no es una copia, tampoco');
  eq(restaurarModulo(base, 'perfumes', copiaDeSeguridad(normalizarEstiloHombre({}))).hecho, true,
    'una copia sin ese apartado configurado sigue siendo una copia válida');
}

/* ---------------------------------------------------------------------------
   3 · RESTAURAR TODO, CON AVISO Y CONFIRMACIÓN (apartado 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · La restauración completa');
  const antiguo = copiaDeSeguridad(normalizarEstiloHombre({
    configurado: true,
    modulos: [{ id: 'perfumes', activo: true, orden: 0, config: { perfumes: { perfumes: [{ id: 'a' }] } } }],
  }));
  const ahora = conDatos();

  const sinConfirmar = restaurarTodo(ahora, antiguo);
  eq(sinConfirmar.hecho, false, '🚨 sin confirmar NO escribe nada');
  ok(!!sinConfirmar.aviso, '⚠️ y devuelve el aviso, que es lo que pide el apartado 8');
  ok(/no estará/.test(sinConfirmar.aviso), 'diciendo que lo apuntado después se pierde');
  eq(sinConfirmar.estado, ahora, 'y el estado se queda exactamente igual');

  const pierde = sinConfirmar.pierde;
  ok(pierde.apartadosQueSeQuedanSinDatos.includes('Skincare'),
    '⚠️ y dice QUÉ apartados se quedan sin datos, por su nombre');
  ok(pierde.apartadosQueSeQuedanSinDatos.includes('Pelo'), 'los dos');
  eq(pierde.fecha, antiguo.fecha, 'y de cuándo es la copia');

  const hecho = restaurarTodo(ahora, antiguo, { confirmado: true });
  eq(hecho.hecho, true, 'confirmando, se restaura');
  eq(hecho.estado.modulos.find((m) => m.id === 'skincare')?.config?.seguimiento, undefined,
    'y el estado es el de la copia');
  ok(esCopia(hecho.antes), '⚠️ con copia de lo que había, también aquí');
  eq(restaurarTodo(ahora, 'basura', { confirmado: true }).hecho, false, 'y basura no se restaura');

  ok(/no guarda la fecha de cada cosa/.test(TEXTOS_RECUPERACION.sinFechas),
    '⚠️ apartado 12 — y se dice por qué NO se puede avisar de cuál es más reciente');
}

/* ---------------------------------------------------------------------------
   4 · VALIDAR ANTES DE IMPORTAR (apartado 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Validar antes de importar');
  eq(IMPORTAR_EXISTE, false,
    '🚨 ⚠️ la pantalla de importar NO existe, y se dice: esto es la cerradura, no la puerta');

  const buena = copiaDeSeguridad(conDatos());
  const v = validarCopia(buena);
  eq(v.valida, true, 'una copia buena pasa');
  ok(!!v.estado, 'y devuelve el estado ya normalizado');

  eq(validarCopia('{ esto no es json').motivos, ['no_json'], 'un texto roto no pasa');
  eq(validarCopia('{"a":1}').motivos, ['no_es_copia'], 'un JSON que no es una copia, tampoco');
  eq(validarCopia({ tipo: 'otra', estado: {} }).motivos, ['no_es_copia'], 'ni una copia de otra cosa');

  const futura = { ...buena, estado: { ...buena.estado, version: VERSION_F46 + 5 } };
  ok(validarCopia(futura).motivos.includes('version_futura'),
    '🚨 ⚠️ y una copia de una versión MÁS NUEVA no se importa: no se sabe qué trae dentro');
  eq(validarCopia(futura).estado, null,
    '🚨 y cuando no es válida NO devuelve el estado: así nadie lo escribe por error');

  const conRaro = { ...buena, estado: { ...buena.estado, modulos: [...buena.estado.modulos, { id: 'inventado', activo: true }] } };
  const vr = validarCopia(conRaro);
  eq(vr.valida, true, '⚠️ un apartado desconocido NO impide importar…');
  ok(vr.avisos.some((x) => x.id === 'modulos_desconocidos'), '…pero avisa');
  ok(!vr.estado.modulos.some((m) => m.id === 'inventado'),
    'y el normalizador lo aparta, como hace con los retirados');

  ok(validarCopia(JSON.stringify(buena)).valida, 'y también acepta el texto JSON tal cual');
  eq(MOTIVOS_INVALIDA.length, 5, 'los cinco motivos, cada uno con su explicación');
  ok(MOTIVOS_INVALIDA.every((m) => !!m.que), 'en palabras que se entienden');
  ok(!motivoInvalida('inventado'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   5 · EL REGISTRO, SIN DATOS PERSONALES (apartado 18)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · El registro');
  const r = registrar('restaurar_modulo', { modulo: 'perfumes', cuantos: 3 });
  ok(!!r, 'una operación conocida se registra');
  eq(r.operacion, 'restaurar_modulo', 'con qué se hizo');
  eq(r.modulo, 'perfumes', 'en qué apartado');
  eq(r.cuantos, 3, 'y cuántos elementos');
  ok(!!r.cuando, 'y cuándo');
  ok(registroLimpio(r), '🚨 ⚠️ y NI UN dato personal: ni nombres, ni textos, ni marcas');
  eq(registrar('inventada'), null, 'una operación que no está en la lista no se registra');
  eq(registrar('copia', { modulo: 'noexiste' }).modulo, null,
    '⚠️ y un módulo que no es del catálogo se descarta: solo ids que escribí yo');
  ok(!registroLimpio({ operacion: 'copia', nombre: 'Bleu de Chanel' }),
    '🚨 y el detector caza el registro que se ha convertido en una copia de los datos');
  ok(CAMPOS_PROHIBIDOS.includes('nombre') && CAMPOS_PROHIBIDOS.includes('foto'),
    'con la lista de lo que nunca puede llevar');
  eq(OPERACIONES.length, 6, 'las seis operaciones que se registran');
}

/* ---------------------------------------------------------------------------
   6 · LA PRUEBA DE RESTAURACIÓN (apartado 16) — hecha, no declarada
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · La prueba de restauración, hecha de verdad');
  const e = ensayoDeRestauracion();
  eq(e.antes, 2, 'datos de prueba: dos perfumes');
  eq(e.trasRomper, 0, 'se pierden');
  eq(e.trasRestaurar, 2, '🎯 y vuelven');
  eq(e.seRecupero, true, '🚨 la copia SE PUEDE restaurar de verdad, no solo crear');
  eq(e.otroModuloIntacto, true, '🚨 ⚠️ y el otro apartado no se ha movido');

  eq(MOMENTOS_DE_COPIA.length, 4, 'los cuatro momentos del apartado 3');
  ok(MOMENTOS_DE_COPIA.filter((m) => m.automatica).length === 3,
    '⚠️ tres son automáticas; la cuarta no hace falta porque no hay cambios de esquema');
  ok(MOMENTOS_DE_COPIA.every((m) => !!m.donde), 'y cada uno dice dónde se hace');
}

/* ---------------------------------------------------------------------------
   7 · LOS SIMULACROS (apartado 17)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Los cinco desastres');
  eq(SIMULACROS.length, 5, 'los cinco que el enunciado simula');
  eq(simulacrosSinRecuperacion(), ['conflicto_dispositivos'],
    '🚨 ⚠️ cuatro se recuperan; el conflicto entre dispositivos NO, y se dice');
  ok(/último en escribir gana/.test(simulacro('conflicto_dispositivos').como),
    'con lo que pasa de verdad: el último en escribir gana');
  ok(/decisión de esquema/.test(simulacro('conflicto_dispositivos').porque),
    '⚠️ y por qué no se arregla aquí: es una columna nueva, no un parche');
  ok(SIMULACROS.filter((s) => s.seRecupera).every((s) => !!s.como && !!s.donde),
    'y los cuatro que sí dicen cómo y dónde');
  ok(/copia antes de tocar/.test(simulacro('error_migracion').como), 'la migración, con la copia de la F46');
  ok(/papelera/i.test(simulacro('eliminacion_accidental').como), 'el borrado, con la papelera');
  ok(!simulacro('inventado'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   8 · LO QUE NO EXISTE, Y EL VEREDICTO
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Lo que falta, dicho con su nombre');
  eq(LO_QUE_FALTA.map((f) => f.apartado), [1, 2, 9, 11, 12], 'cinco apartados dependen de algo que no hay');
  eq(auditarRecuperacion().sinMotivo, [], '🚨 y ninguno se queda sin decir por qué');
  eq(auditarRecuperacion().sinAlternativa, [], '⚠️ ni sin decir qué hay en su lugar');
  ok(/no crear un sistema|prohíbe/i.test(falta('sistema_global').porque),
    '⚠️ y el backup global no se construye porque el ENUNCIADO lo prohíbe, no por pereza');
  ok(/una fila por \(usuario, clave\)/.test(falta('historial_versiones').porque),
    '🚨 el historial de versiones no cabe: `app_data` tiene una fila por usuario y clave');
  ok(/F41|esquema/.test(falta('conflicto_restauracion').porque),
    'y el conflicto sigue siendo la decisión abierta desde la F41');

  eq(APARTADOS_RECUPERACION.length, 18, 'los dieciocho apartados');
  eq(apartadosSinCumplir().map((a) => a.id), [1, 2, 9, 11, 12], 'cinco sin cumplir, los mismos cinco');
  ok(APARTADOS_RECUPERACION.every((a) => !!a.donde), 'y todos dicen dónde se contestan');
  ok(!apartadoRecuperacion(99), 'se buscan por id');

  /* Apartado 13 — la copia no abre una segunda puerta a los datos. */
  ok(/onConflict/.test(SUPA), 'los datos siguen viviendo donde vivían…');
  ok(!/backup|copia_seguridad/i.test(SUPA),
    '🚨 ⚠️ apartado 13 — y NO hay una segunda tabla de copias: un backup aparte sería otra puerta a lo mismo');

  ok(Object.keys(PAPELERA).length >= 45, `la papelera cubre ${Object.keys(PAPELERA).length} colecciones`);
  ok(auditarRecuperacion().coleccionesRecuperables > 0,
    `${auditarRecuperacion().coleccionesRecuperables} de ellas son de Estilo de hombre`);

  const panel = panelRecuperacion();
  eq(panel.protegido, true, '🎯 los cuatro niveles existen y la restauración está probada');
  ok(/varios niveles/i.test(panel.condicion), 'con la condición de finalización');
  eq(VERSION_EH, VERSION_F46, 'y la versión del módulo es la que conoce la migración');
  ok(IDS_EH.length > 0, `sobre los ${IDS_EH.length} apartados del catálogo`);
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
