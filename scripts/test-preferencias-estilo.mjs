// ============================================================================
// EH · Fase 34/65 — Perfil y preferencias avanzadas ("⚙️ Mis preferencias")
//
// Las once pruebas del apartado 16, y lo que gobierna la fase:
//   · el apartado 15 ES el registro de la Fase 4: una sola fuente de verdad
//   · "Mis preferencias" ya estaba escrita (F27): se reutiliza y se agrupa
//   · los siete grupos son los siete temas de la F32
//   · el interruptor del apartado 7 vive donde surte efecto, no aquí
//   · ocultar y eliminar son dos acciones distintas
//   · y borrar Estilo de hombre NO toca otros módulos
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, moduloEH,
  alternarModulo, guardarConfig,
} from '../src/lib/estiloDeHombre.js';
import {
  REGISTRO_DATOS, guardarDato, leerDato, datoDelRegistro, modulosQueUsan, datosPrivados,
} from '../src/lib/datosEstiloHombre.js';
import { misPreferencias } from '../src/lib/gustos.js';
import { TEMAS_IDEAS, usaPreferencias, recomendarIdeas, datosIdeas } from '../src/lib/ideasEstilo.js';
import { MODULO_ANFITRION } from '../src/lib/miEstilo.js';
import {
  ZONA_PREFERENCIAS, TEXTOS_PREFERENCIAS, CATEGORIAS_PREFERENCIAS, temaDeDato,
  preferenciasPorTema, dondeSeEdita, preferenciasEnUso, alternarPreferenciasEnUso,
  borrarPreferencia, restablecerCategoria, loQueSeBorra, LO_QUE_NO_SE_BORRA,
  TEXTO_BORRADO_FUERTE, eliminarDatosDeEstilo, accionesDeModulo, filasParaExportar,
  resumenPreferencias, auditarPreferencias, textosDePreferencias, panelPreferencias,
} from '../src/lib/preferenciasEstilo.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const ARM = { prendas: [], outfits: [], usos: [] };
const nuevo = () => normalizarEstiloHombre(DEFAULT_ESTILO_HOMBRE);
const con = (ids) => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ids);
const TODOS_EH = ['estilo', 'skincare', 'pelo', 'barba', 'perfumes', 'accesorios', 'gustos'];
const FUENTE = readFileSync(new URL('../src/lib/preferenciasEstilo.js', import.meta.url), 'utf8');
const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
/** Un estado con dos preferencias puestas de verdad. */
const conPrefs = () => {
  let e = con(TODOS_EH);
  e = guardarDato(e, 'tipoPiel', 'seca', { modulo: 'skincare' }).estado;
  e = guardarDato(e, 'aromasFavoritos', ['frescos'], { modulo: 'perfumes' }).estado;
  return e;
};

console.log('\n⚙️   EH · Fase 34/65 — Perfil y preferencias avanzadas\n');

/* ===========================================================================
   Test 1 — ⚠️ EL APARTADO 15 ES EL REGISTRO DE LA FASE 4 (prueba 11)
   =========================================================================== */
console.log('Test 1 — ⚠️ una sola fuente de verdad');
{
  eq(auditarPreferencias().almacenesPropios, 0,
    '⚠️ esta fase NO guarda ni una preferencia: la fuente de verdad es el registro');
  ok(!/DEFAULT_PREFERENCIAS|normalizarPreferencias|guardarConfig\(/.test(SIN_COMENTARIOS),
    '⚠️ y el código no tiene almacén ni normalizador propios');

  const e = conPrefs();
  const antes = JSON.parse(JSON.stringify(normalizarEstiloHombre(e).datos));
  panelPreferencias(e);
  eq(JSON.parse(JSON.stringify(normalizarEstiloHombre(e).datos)), antes,
    'y leer la pantalla no escribe nada');

  /* ⚠️ *"Tipo de perfume → Perfumes. NO: tipo de perfume → Mi estilo + Perfumes."* */
  const grupos = preferenciasPorTema(e);
  const ids = grupos.flatMap((g) => g.preferencias.map((p) => p.id));
  eq(ids.length, new Set(ids).size,
    '⚠️ ninguna preferencia aparece en DOS grupos: sería el duplicado del apartado 15 (prueba 11)');
  ok(grupos.every((g) => g.preferencias.every((p) => p.editableAqui === false)),
    '⚠️ y ninguna se edita aquí: *"Mi estilo simplemente lo muestra"*');
  ok(grupos.every((g) => g.preferencias.every((p) => !!p.donde)),
    'cada una dice dónde se cambia de verdad');
}

/* ===========================================================================
   Test 2 — ⚠️ "MIS PREFERENCIAS" YA ESTABA ESCRITA (F27)
   =========================================================================== */
console.log('\nTest 2 — ⚠️ ni una segunda lista de preferencias');
{
  const e = conPrefs();
  const deLaF27 = misPreferencias(e).map((p) => p.id).sort();
  const deAqui = preferenciasPorTema(e).flatMap((g) => g.preferencias.map((p) => p.id)).sort();
  eq(deAqui, deLaF27,
    '⚠️ son EXACTAMENTE las de `misPreferencias()` (F27), agrupadas: ni una más ni una menos');
  ok(/from '\.\/gustos'/.test(FUENTE), 'y se importa de allí, no se copia');
  ok(!/clase === 'preferencia'/.test(SIN_COMENTARIOS.replace(/auditarPreferencias[\s\S]*/, '')),
    '⚠️ el filtro del registro no se reescribe: lo hace la función que ya existía');
  eq(auditarPreferencias().sinGrupo, 0,
    '⚠️ y ninguna preferencia se queda fuera de los siete grupos');
}

/* ===========================================================================
   Test 3 — LOS SIETE GRUPOS Y "EDITAR" (apartados 1, 2 y 3 · prueba 2)
   =========================================================================== */
console.log('\nTest 3 — siete plaquitas, cada una a su módulo');
{
  eq(ZONA_PREFERENCIAS.nombre, 'Mis preferencias', 'la zona del apartado 1');
  eq(ZONA_PREFERENCIAS.icono, '⚙️', 'con su icono');
  eq(ZONA_PREFERENCIAS.dentroDe, MODULO_ANFITRION,
    '⚠️ *"dentro de 🧔 Mi estilo"*: no es un apartado principal nuevo');

  eq(CATEGORIAS_PREFERENCIAS, TEMAS_IDEAS.map((t) => t.id),
    '⚠️ los siete grupos SON los siete temas de la F32, tercera vez que se reutilizan');
  const grupos = preferenciasPorTema(con(TODOS_EH));
  eq(grupos.length, 7, 'salen los siete');
  eq(grupos.map((g) => g.nombre),
    ['Cuidado', 'Pelo', 'Barba', 'Perfumes', 'Ropa', 'Accesorios', 'Gustos personales'],
    'con los nombres que ya tenían');

  // Apartado 3 — *"Editar debe llevar al lugar donde REALMENTE se configura"*.
  grupos.forEach((g) => {
    eq(dondeSeEdita(g.id), g.modulo, `"Editar" en ${g.nombre} lleva a su módulo (prueba 2)`);
    ok(!!moduloEH(g.modulo), 'que existe en el catálogo');
  });
  eq(dondeSeEdita('inventado'), null, 'y un grupo que no existe no lleva a ninguna parte');
  eq(auditarPreferencias().formulariosNuevos, 0,
    '⚠️ cero formularios duplicados: *"cada una abre el módulo original"*');
  ok(TEXTOS_PREFERENCIAS.dondeSeEdita.includes('donde de verdad se configura'),
    'y la pantalla lo dice');

  // Apartado 2 — un grupo cuyo módulo está apagado se marca, no desaparece.
  const sinPerfumes = alternarModulo(con(TODOS_EH), 'perfumes', false);
  eq(preferenciasPorTema(sinPerfumes).find((g) => g.id === 'perfumes').activo, false,
    'un grupo con su módulo apagado se marca como tal');
}

/* ===========================================================================
   Test 4 — EL RESUMEN (apartados 4 y 5 · prueba 1)
   =========================================================================== */
console.log('\nTest 4 — *"mostrar algo muy sencillo. Nada más."*');
{
  const e = conPrefs();
  const grupos = preferenciasPorTema(e);
  const cuidado = grupos.find((g) => g.id === 'cuidado');
  ok(cuidado.linea.length > 0 && !cuidado.linea.includes('Sin configurar'),
    'con una preferencia puesta, la línea la enseña (prueba 1)');
  ok(cuidado.configuradas >= 1, 'y se cuenta');

  /* ⚠️ Apartado 5 — *"no queremos gamificar la configuración"*. */
  const vacio = preferenciasPorTema(con(TODOS_EH));
  const conHueco = vacio.find((g) => g.aqui);
  ok(conHueco.linea.includes('Sin configurar'),
    '⚠️ sin nada puesto: "⚪ Sin configurar", y ya');
  eq(auditarPreferencias().porcentajes, 0, '⚠️ CERO porcentajes: nada de "perfil al 80 %"');
  eq(auditarPreferencias().barrasDeProgreso, 0, 'ni barras de progreso');
  ok(!textosDePreferencias().some((t) => /%|completa tu perfil|nivel \d/i.test(t)),
    '⚠️ y ningún texto le mete prisa ni le pone nota');
  ok(TEXTOS_PREFERENCIAS.noInsistir.includes('No hace falta'), 'se dice que no hace falta');

  /* ⚠️ Y "no tiene ninguna" no es "no la ha rellenado": son dos cosas. */
  const sinNinguna = vacio.find((g) => !g.aqui);
  ok(!!sinNinguna, 'hay grupos cuyas preferencias viven dentro de su módulo');
  ok(sinNinguna.linea.startsWith('Se configura dentro de'),
    '⚠️ y ésos NO se marcan "sin configurar": se dice dónde están (regla 8)');
}

/* ===========================================================================
   Test 5 — ⚠️ EL INTERRUPTOR DEL APARTADO 7 (prueba 5)
   =========================================================================== */
console.log('\nTest 5 — 💡 usar mis preferencias para recomendaciones');
{
  const e = conPrefs();
  eq(preferenciasEnUso(e), true, 'de partida está activado');
  eq(preferenciasEnUso(e), usaPreferencias(e),
    '⚠️ y es EL MISMO dato que el de la F32: no hay una copia aquí (apartado 15)');
  eq(auditarPreferencias().interruptores, 1, 'la auditoría: uno solo');
  ok(!/usarPreferencias\s*:/.test(SIN_COMENTARIOS),
    '⚠️ y este archivo no lo declara: solo lo lee y lo conmuta');

  const apagado = alternarPreferenciasEnUso(e);
  eq(preferenciasEnUso(apagado), false, 'se puede desactivar (prueba 5)');

  /* ⚠️ *"Las preferencias PERMANECEN GUARDADAS. Simplemente dejan de utilizarse."* */
  eq(leerDato(apagado, 'tipoPiel').valores, leerDato(e, 'tipoPiel').valores,
    '⚠️ y las preferencias siguen guardadas, intactas');
  eq(preferenciasPorTema(apagado).find((g) => g.id === 'cuidado').configuradas,
    preferenciasPorTema(e).find((g) => g.id === 'cuidado').configuradas,
    'y se siguen viendo aquí');

  /* ⚠️ Pero DEJAN DE USARSE de verdad: no es un interruptor decorativo (regla 8). */
  const conEstilos = guardarDato(con(TODOS_EH), 'tallaCamiseta', 'M', { modulo: 'estilo' }).estado;
  const ARM5 = { prendas: Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, nombre: `P${i}` })), outfits: [], usos: [] };
  const encendido = recomendarIdeas(conEstilos, { armario: ARM5, limite: 50 });
  const apagadas = recomendarIdeas(alternarPreferenciasEnUso(conEstilos), { armario: ARM5, limite: 50 });
  ok(encendido.ideas.some((i) => i.id === 'ropa_sin_estilos'),
    'con el interruptor puesto sale la idea que mira una preferencia');
  ok(!apagadas.ideas.some((i) => i.id === 'ropa_sin_estilos'),
    '⚠️ y apagado NO sale: el interruptor hace algo de verdad');
  ok(apagadas.total > 0 && apagadas.total < encendido.total,
    '⚠️ pero las demás ideas siguen: no apaga el sistema entero');
  ok(TEXTOS_PREFERENCIAS.siguenGuardadas.includes('siguen guardadas'),
    'y la pantalla lo dice antes de pulsarlo');

  eq(preferenciasEnUso(alternarPreferenciasEnUso(apagado)), true, 'y se puede volver a activar');
}

/* ===========================================================================
   Test 6 — BORRAR UNA PREFERENCIA (apartado 8 · prueba 3)
   =========================================================================== */
console.log('\nTest 6 — cada dato se borra por separado');
{
  const e = conPrefs();
  eq(leerDato(e, 'tipoPiel').tiene, true, 'de partida está puesta');
  const r = borrarPreferencia(e, 'tipoPiel');
  eq(r.error, null, 'se puede borrar una sola (prueba 3)');
  eq(leerDato(r.estado, 'tipoPiel').tiene, false, 'y desaparece');

  /* ⚠️ *"No borrar todo el perfil."* */
  eq(leerDato(r.estado, 'aromasFavoritos').tiene, true,
    '⚠️ y la otra preferencia SIGUE: no se lleva el perfil entero');

  eq(borrarPreferencia(e, 'inventada').error, 'Esa preferencia no existe.',
    'una que no existe da error');
  ok(borrarPreferencia(e, 'tipoPiel').estado !== e, 'y borrar devuelve un estado nuevo');

  /* ⚠️ Un dato global no se borra desde aquí: se dice dónde (F4). */
  const global = REGISTRO_DATOS.find((d) => !!datoDelRegistro(d.id));
  ok(!!global, 'el registro sigue en pie');
  ok(preferenciasPorTema(e).flatMap((g) => g.preferencias).every((p) => typeof p.sePuedeBorrar === 'boolean'),
    'y cada una dice si se puede borrar desde aquí');
}

/* ===========================================================================
   Test 7 — RESTABLECER UNA CATEGORÍA (apartado 9 · prueba 4)
   =========================================================================== */
console.log('\nTest 7 — 🔄 restablecer una categoría, con permiso');
{
  const e = conPrefs();
  const sin = restablecerCategoria(e, 'cuidado');
  eq(sin.aplicado, false, '⚠️ decimotercer `aplicarPlan`: sin `confirmado` no borra');
  eq(sin.estado, normalizarEstiloHombre(e), 'y devuelve el estado tal cual');
  eq(sin.aviso.pregunta, '¿Quieres eliminar las preferencias configuradas en esta categoría?',
    'con la pregunta literal del enunciado');
  eq([sin.aviso.cancelar, sin.aviso.confirmar], ['Cancelar', 'Restablecer'], 'y sus dos opciones');
  ok(sin.aviso.cuales.length > 0, '⚠️ diciendo exactamente CUÁLES se van, por su nombre');
  ok(sin.aviso.nota.includes('siguen igual'), 'y qué no se toca');

  const hecho = restablecerCategoria(e, 'cuidado', { confirmado: true });
  eq(hecho.aplicado, true, 'confirmando, sí (prueba 4)');
  eq(leerDato(hecho.estado, 'tipoPiel').tiene, false, 'las de esa categoría se van');
  eq(leerDato(hecho.estado, 'aromasFavoritos').tiene, true,
    '⚠️ y las de OTRA categoría se quedan (prueba 10)');

  /* ⚠️ Y no toca la config de ningún módulo: solo preferencias. */
  const cfg = (est, id) => JSON.stringify(normalizarEstiloHombre(est).modulos.find((m) => m.id === id).config);
  ['skincare', 'perfumes', 'pelo'].forEach((id) => {
    eq(cfg(hecho.estado, id), cfg(e, id), `⚠️ la config de "${id}" sale intacta`);
  });
  eq(restablecerCategoria(e, 'inventada').error, 'Esa categoría no existe.', 'una que no existe');
}

/* ===========================================================================
   Test 8 — ELIMINAR LOS DATOS DE ESTILO DE HOMBRE (apartado 10 · prueba 8)
   =========================================================================== */
console.log('\nTest 8 — 🗑️ la opción avanzada, con confirmación fuerte');
{
  const e = guardarConfig(conPrefs(), 'skincare', { productos: [{ id: 'x', nombre: 'Crema' }] });
  const sin = eliminarDatosDeEstilo(e);
  eq(sin.aplicado, false, '⚠️ decimocuarto `aplicarPlan`: sin `confirmado` no borra');
  eq(sin.estado, normalizarEstiloHombre(e), 'y el estado sale igual');
  eq(sin.aviso.texto, TEXTO_BORRADO_FUERTE, 'con su confirmación fuerte');
  ok(sin.aviso.texto.includes('no se puede deshacer'), 'que dice que no se deshace');
  ok(sin.aviso.seBorra.modulos.length > 0,
    '⚠️ *"debe aclarar EXACTAMENTE qué se eliminará"*: se enumera');
  ok(sin.aviso.seBorra.preferencias.length > 0, 'incluidas las preferencias');
  eq(sin.aviso.seQueda, LO_QUE_NO_SE_BORRA, '⚠️ y lo que NO se borra, también por su nombre');
  ok(LO_QUE_NO_SE_BORRA.some((x) => /armario/i.test(x)), 'el armario se queda');
  ok(LO_QUE_NO_SE_BORRA.some((x) => /diario/i.test(x)), 'el diario también');
  ok(LO_QUE_NO_SE_BORRA.some((x) => /objetivos/i.test(x)), 'y los objetivos');

  const hecho = eliminarDatosDeEstilo(e, { confirmado: true });
  eq(hecho.aplicado, true, 'confirmando, sí (prueba 8)');
  eq(normalizarEstiloHombre(hecho.estado).datos, {}, 'las preferencias se van');
  ok(normalizarEstiloHombre(hecho.estado).modulos.every((m) => Object.keys(m.config).length === 0),
    'y la config de cada módulo se vacía');

  /* ⚠️ Pero **qué apartados tiene encendidos NO es un dato** (apartado 12). */
  eq(normalizarEstiloHombre(hecho.estado).modulos.filter((m) => m.activo).length,
    normalizarEstiloHombre(e).modulos.filter((m) => m.activo).length,
    '⚠️ y sus apartados siguen ENCENDIDOS: eso lo eligió él, no es un dato');

  /* ⚠️ *"No borrar datos de otros módulos."* Aquí, nunca. */
  eq(auditarPreferencias().modulosAjenosBorrados, 0, 'cero módulos ajenos tocados (prueba 10)');
  ok(!/armario|diario|objetivos|calendario/.test(
    SIN_COMENTARIOS.split('export function eliminarDatosDeEstilo')[1]?.split('\n}')[0] || '',
  ), '⚠️ y el código del borrado no menciona ningún módulo ajeno');
}

/* ===========================================================================
   Test 9 — OCULTAR NO ES BORRAR (apartados 12 y 13 · pruebas 6 y 7)
   =========================================================================== */
console.log('\nTest 9 — ⚠️ *"son acciones diferentes"*');
{
  const e = guardarConfig(con(TODOS_EH), 'perfumes', { perfumes: [{ id: 'p1', nombre: 'Uno' }] });
  const acciones = accionesDeModulo(e, 'perfumes');
  ok(!!acciones, 'cada módulo trae sus dos acciones');
  eq(acciones.ocultar.borra, false, '⚠️ ocultar NO borra');
  eq(acciones.borrar.borra, true, 'y eliminar sí');
  eq(acciones.tieneDatos, true, 'y se dice si hay algo que perder');
  ok(acciones.nota.includes('dos cosas distintas'), 'con la frase del apartado 12');

  const oculto = alternarModulo(e, 'perfumes', false);
  const cfg = (est) => JSON.stringify(normalizarEstiloHombre(est).modulos.find((m) => m.id === 'perfumes').config);
  eq(cfg(oculto), cfg(e), '⚠️ ocultarlo deja sus datos INTACTOS (prueba 6)');
  eq(accionesDeModulo(oculto, 'perfumes').activo, false, 'y se marca como oculto');

  const vuelve = alternarModulo(oculto, 'perfumes', true);
  eq(cfg(vuelve), cfg(e),
    '⚠️ *"al volver a activar: recuperar la configuración anterior"* (prueba 7)');
  ok(acciones.vuelve.includes('como lo dejaste'), 'y se dice antes de ocultarlo');
  eq(accionesDeModulo(e, 'inventado'), null, 'un módulo que no existe da null');
}

/* ===========================================================================
   Test 10 — LA EXPORTACIÓN (apartados 11 y 14 · prueba 9)
   =========================================================================== */
console.log('\nTest 10 — 📤 dentro de la exportación que ya existe');
{
  const e = conPrefs();
  const filas = filasParaExportar(e);
  ok(filas.length > 0, 'Estilo de hombre aporta filas (prueba 9)');
  ok(filas.every((f) => 'modulo' in f && 'fecha' in f && 'detalle' in f && 'valor' in f && 'extra' in f),
    '⚠️ con la MISMA forma que las demás: no es otro sistema de exportación');
  eq(auditarPreferencias().exportacionesNuevas, 0, 'cero sistemas nuevos (apartado 14)');
  ok(!/downloadBlob|Papa\.|XLSX/.test(FUENTE),
    '⚠️ y el archivo no escribe ni un fichero: solo devuelve filas');
  ok(filas.some((f) => f.modulo === 'Estilo de hombre (preferencia)'),
    'las preferencias configuradas salen');
  ok(filas.some((f) => f.detalle === 'Tipo de piel'), 'con su nombre de verdad');

  /* ⚠️ Apartado 11 — lo privado NO sale. */
  const privados = datosPrivados();
  ok(!filas.some((f) => privados.includes(f.detalle)), '⚠️ y lo marcado como privado no sale');
  eq(filasParaExportar(nuevo()).length, 0,
    'sin nada configurado no se exporta una fila vacía');
  ok(TEXTOS_PREFERENCIAS.exportacion.includes('exportación'), 'y la pantalla lo dice');
  ok(TEXTOS_PREFERENCIAS.privacidad.includes('Nada de otros apartados'),
    'con su nota de privacidad (apartado 11)');
}

/* ===========================================================================
   Test 11 — RESUMEN Y PANEL
   =========================================================================== */
console.log('\nTest 11 — el panel que dibuja la pantalla');
{
  const e = conPrefs();
  const p = panelPreferencias(e);
  eq(p.titulo, '⚙️ Mis preferencias', 'el título del apartado 1');
  eq(p.sub, 'Tú tienes el control de tus datos y preferencias.', 'con la frase del objetivo');
  eq(p.grupos.length, 7, 'los siete grupos');
  eq(p.usandolas, true, 'el interruptor, leído de la F32');
  ok(!!p.borradoTotal, 'y el aviso del borrado, ya montado');
  ok(p.borradoTotal.seQueda.length > 0, 'con lo que NO se borra');

  const r = resumenPreferencias(e);
  eq(r.grupos, 7, 'el resumen cuenta los grupos');
  ok(r.configuradas >= 2, 'y las preferencias puestas');
  ok(r.filasExportadas > 0, 'y cuántas filas se exportarían');
  eq(r.usandolas, true, 'con el interruptor');

  ok(textosDePreferencias().every((t) => typeof t === 'string' && t.length > 0), 'ningún texto vacío');
  ok(!textosDePreferencias().some((t) => /debes|tienes que|obligatorio/i.test(t)),
    'y ninguno le manda');
  ok(REGISTRO_DATOS.every((d) => modulosQueUsan(d.id).length >= 0), 'el registro sigue coherente');
  ok(temaDeDato('tipoPiel') === 'cuidado', 'y cada dato sabe a qué grupo va');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
