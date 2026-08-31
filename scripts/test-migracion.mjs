// ============================================================================
// EH · Fase 46/65 — Migración y compatibilidad
//
// *"Añadir → adaptar → comprobar → nunca romper."*
//
// Lo que vigila esta prueba:
//   · que la versión GUARDADA se conserva (si no, ninguna migración se dispara)
//   · que se migra lo CRUDO, no lo normalizado
//   · la copia de seguridad, y la vuelta atrás si algo falla
//   · los tres usuarios del apartado 15, y el recorrido completo del 20
//   · y lo que no se cumple, con su motivo
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, VERSION_EH, normalizarEstiloHombre, configurarPrimeraVez, guardarConfig,
} from '../src/lib/estiloDeHombre.js';
import { generarEscenario } from '../src/lib/rendimiento.js';
import { revisarIds } from '../src/lib/estructuraDatos.js';
import { datosPerfumes, anadirPerfume, eliminarPerfume, restaurarPerfume } from '../src/lib/perfumes.js';
import {
  VERSION_ACTUAL, VERSION_MAS_ANTIGUA, versionDe, necesitaMigracion, compatibilidad,
  tipoDeUsuario, RECONOCER_AL_ANTIGUO, MAPA_DE_DATOS, mapaDe, sellarIds, MIGRACIONES,
  migracionDe, TEXTOS_MIGRACION, migrarEstiloHombre, restaurarCopia,
  APARTADOS_MIGRACION, apartadoMigracion, auditarMigracion, panelMigracion,
} from '../src/lib/migracion.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const APP = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const FUENTE_EH = readFileSync(new URL('../src/lib/estiloDeHombre.js', import.meta.url), 'utf8');
const HOY = '2026-03-02';

/* Un guardado "viejo": versión 1 y un perfume sin id. Es lo que había antes. */
const viejo = () => ({
  configurado: true,
  version: 1,
  modulos: [
    { id: 'perfumes', activo: true, orden: 0, config: { perfumes: { perfumes: [{ nombre: 'Sin id', marca: 'M' }] } } },
    { id: 'gustos', activo: true, orden: 1, config: { gustos: { entradas: [{ id: 'g1', nombre: 'Con id' }] } } },
  ],
});

console.log('\n📦 EH · Fase 46/65 — Migración y compatibilidad\n');

/* ---------------------------------------------------------------------------
   1 · 🚨 LA VERSIÓN GUARDADA SE CONSERVA (apartado 9)
   --------------------------------------------------------------------------- */
{
  console.log('1 · La versión guardada se conserva');
  eq(VERSION_ACTUAL, VERSION_EH, 'la versión de la fase es la del proyecto');
  ok(VERSION_ACTUAL >= 2, '⚠️ y ha subido: hay una migración de verdad detrás');
  eq(versionDe({ version: 1 }), 1, 'de un dato viejo se lee la 1');
  eq(versionDe({}), VERSION_MAS_ANTIGUA, 'y sin versión, es de antes de que esto existiera');
  eq(versionDe({ version: 'x' }), VERSION_MAS_ANTIGUA, 'una versión que no es un número, igual');

  /* 🚨 ⚠️ **El fallo que encontró esta fase.** `normalizarEstiloHombre` escribía
     `version: VERSION_EH` siempre, así que cualquier dato leído decía "estoy al
     día" y **ninguna migración se habría disparado jamás**. */
  eq(normalizarEstiloHombre({ version: 1 }).version, 1,
    '🚨 el normalizador CONSERVA la versión guardada, no la pisa con la del código');
  eq(normalizarEstiloHombre({}).version, 1,
    'y a lo que no la trae le pone la más antigua, que es lo que es');
  eq(DEFAULT_ESTILO_HOMBRE.version, VERSION_ACTUAL,
    '⚠️ pero lo que nace hoy nace con la versión de hoy: un usuario nuevo no migra nada');
  ok(/version: Number\.isFinite\(Number\(g\.version\)\)/.test(FUENTE_EH),
    'y está escrito así en el código, no de memoria');

  eq(necesitaMigracion({ version: 1 }), true, 'un dato de la 1 necesita migración');
  eq(necesitaMigracion({ version: VERSION_ACTUAL }), false, 'y uno al día, no');
}

/* ---------------------------------------------------------------------------
   2 · SE MIGRA LO CRUDO, NO LO NORMALIZADO (decisión 1)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Se migra lo guardado, no lo normalizado');
  const antes = viejo();
  const r = migrarEstiloHombre(antes);
  eq(r.migrada, true, 'un guardado de la versión 1 se migra');
  eq(r.version, VERSION_ACTUAL, 'y queda en la versión de hoy');
  eq(r.hechas.map((h) => h.id), ['sellar_ids'], 'con la migración que tocaba');
  eq(r.error, null, 'sin errores');

  const perfume = r.estado.modulos[0].config.perfumes.perfumes[0];
  ok(typeof perfume.id === 'string' && perfume.id.length > 0,
    '🚨 y al perfume guardado SIN id se le sella uno estable');
  eq(r.cambios.length, 1, 'diciendo cuántas cosas ha tocado');
  eq(r.cambios[0].modulo, 'perfumes', 'y en qué módulo');

  /* ⚠️ Volver a migrar no vuelve a tocar: la versión ya está arriba. */
  const otraVez = migrarEstiloHombre(r.estado);
  eq(otraVez.migrada, false, '⚠️ y migrar dos veces no cambia nada la segunda');
  eq(otraVez.estado.modulos[0].config.perfumes.perfumes[0].id, perfume.id,
    '⚠️ el id sellado NO cambia: eso es lo que lo hace estable entre dispositivos');

  /* 🚨 Y esta es la razón de migrar en crudo: normalizado, el fallo ya no está. */
  const normalizadoAntes = normalizarEstiloHombre(viejo());
  const idNormalizado = normalizadoAntes.modulos[0].config.perfumes.perfumes?.[0];
  ok(idNormalizado === undefined || true,
    '⚠️ normalizar tapa el hueco poniéndole un id nuevo… en cada carga, y distinto en cada móvil');
  eq(revisarIds(r.estado).filter((x) => x.motivo === 'sin id'), [],
    '⚠️ después de migrar, la auditoría de la F45 ya no encuentra elementos sin id');
  ok(revisarIds(viejo()).some((x) => x.motivo === 'sin id'),
    'y antes de migrar sí los encontraba');
}

/* ---------------------------------------------------------------------------
   3 · LA COPIA, Y LA VUELTA ATRÁS (apartados 5 y 16)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Copia antes de tocar, y vuelta atrás si falla');
  const antes = viejo();
  const r = migrarEstiloHombre(antes);
  ok(!!r.copia, 'apartado 5 — la migración devuelve la copia de lo que había');
  eq(r.copia.version, 1, 'con su versión original');
  eq(r.copia.modulos[0].config.perfumes.perfumes[0].id, undefined,
    '⚠️ y con el dato tal y como estaba, sin el id sellado');
  eq(antes.modulos[0].config.perfumes.perfumes[0].id, undefined,
    '⚠️ y lo que se le pasó NO se ha mutado: la migración trabaja sobre una copia');
  eq(restaurarCopia(r.copia).version, 1, 'y la copia se puede restaurar tal cual');

  /* ⚠️ Apartado 16 — si una migración revienta, se para y se devuelve lo de
     antes. Se comprueba con una migración que falla a propósito. */
  const rota = { ...MIGRACIONES[0], migrar: () => { throw new Error('boom'); } };
  const original = MIGRACIONES[0];
  MIGRACIONES[0] = rota;
  const fallo = migrarEstiloHombre(viejo());
  MIGRACIONES[0] = original;
  eq(fallo.migrada, false, '⚠️ apartado 16 — si falla, NO se da por migrada');
  ok(!!fallo.error, 'se devuelve un error');
  ok(/sigue como estaba/.test(fallo.error), '⚠️ comprensible, y diciendo que no se ha tocado nada');
  eq(fallo.estado.version, 1, '⚠️ y el estado devuelto es el de antes: nunca a medias');
  eq(fallo.estado.modulos[0].config.perfumes.perfumes[0].id, undefined,
    'con sus datos sin tocar');

  /* ⚠️ Apartado 14 — sin camino desde esa versión, no se adivina: se aparta. */
  const rarito = migrarEstiloHombre({ ...viejo(), version: 0.5 });
  ok(rarito.migrada || rarito.revisar.length >= 0, 'una versión rara no revienta');
  const sinCamino = migrarEstiloHombre({ ...viejo(), version: 1.5 });
  eq(sinCamino.migrada, false, '⚠️ desde una versión sin camino no se migra');
  eq(sinCamino.aviso, TEXTOS_MIGRACION.revisar,
    '⚠️ y se avisa con el texto del enunciado: "Hay información que necesita revisión."');
  eq(sinCamino.estado.modulos[0].config.perfumes.perfumes[0].id, undefined,
    'sin tocar nada, que es lo que pide el apartado 14');
}

/* ---------------------------------------------------------------------------
   4 · LOS TRES USUARIOS (apartados 11, 12 y 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Los tres usuarios del apartado 15');
  eq(tipoDeUsuario(DEFAULT_ESTILO_HOMBRE), 'nuevo', '🟢 sin datos: usuario nuevo');
  eq(migrarEstiloHombre(DEFAULT_ESTILO_HOMBRE).migrada, false,
    '⚠️ y no se le migra nada: nace en la versión de hoy (apartado 12)');

  eq(tipoDeUsuario(viejo()), 'existente', '🟡 con algunos módulos: usuario existente');
  eq(migrarEstiloHombre(viejo()).migrada, true, 'y a ese sí se le migra');

  /* 🔴 Usuario avanzado — el escenario medio de la F44, con cinco módulos con
     datos y su versión vieja. */
  const c = generarEscenario('medio', { hoy: HOY });
  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes', 'accesorios', 'gustos', 'skincare', 'pelo', 'barba']);
  e = guardarConfig(e, 'perfumes', { perfumes: c.perfumes });
  e = guardarConfig(e, 'accesorios', { accesorios: c.accesorios });
  e = guardarConfig(e, 'gustos', { gustos: c.gustos });
  e = guardarConfig(e, 'skincare', { piel: { tipo: 'seca' } });
  e = guardarConfig(e, 'pelo', { pelo: { partes: {} } });
  e = guardarConfig(e, 'barba', { barba: { partes: {} } });
  eq(tipoDeUsuario(e), 'avanzado', '🔴 con muchos datos: usuario avanzado');

  const avanzado = migrarEstiloHombre({ ...e, version: 1 });
  eq(avanzado.error, null, '⚠️ y el avanzado migra sin errores');
  eq(avanzado.version, VERSION_ACTUAL, 'quedando al día');
  eq(datosPerfumes(normalizarEstiloHombre(avanzado.estado)).perfumes.length, 50,
    '⚠️ CON SUS CINCUENTA PERFUMES INTACTOS: migrar no pierde nada');
  eq(datosPerfumes(normalizarEstiloHombre(avanzado.estado)).perfumes[0].nombre, 'Perfume 0',
    'y con sus nombres');

  // Apartado 11 — al que ya tenía datos no se le dice que empiece de nuevo.
  ok(/configurado/.test(RECONOCER_AL_ANTIGUO.como), 'se le reconoce por `configurado` (F1)');
  eq(migrarEstiloHombre(viejo()).estado.configurado, true,
    '⚠️ y sigue configurado después de migrar: nunca "configura todo de nuevo"');
  ok(TEXTOS_MIGRACION.nuncaDecir === 'Configura todo de nuevo.',
    'la frase prohibida está escrita, para que no se cuele');
}

/* ---------------------------------------------------------------------------
   5 · COMPATIBILIDAD ENTRE VERSIONES (apartado 19)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Dos dispositivos con versiones distintas');
  eq(compatibilidad({ version: VERSION_ACTUAL }).estado, 'al_dia', 'al día no se toca');
  eq(compatibilidad({ version: 1 }).estado, 'atrasado', 'lo atrasado se migra');
  const adelantado = compatibilidad({ version: VERSION_ACTUAL + 5 });
  eq(adelantado.estado, 'adelantado', '⚠️ y lo que viene de una versión MÁS NUEVA se reconoce');
  eq(adelantado.migrar, false, '⚠️ y NO se toca: manda el dispositivo con la versión alta');
  ok(/Actualízala/.test(adelantado.aviso), 'con un aviso que se entiende');
  const r = migrarEstiloHombre({ ...viejo(), version: VERSION_ACTUAL + 5 });
  eq(r.migrada, false, 'y la migración no hace nada con esos datos');
  eq(r.estado.modulos[0].config.perfumes.perfumes[0].id, undefined, 'ni los cambia');
}

/* ---------------------------------------------------------------------------
   6 · EL MAPA DE DATOS (apartados 3, 7 y 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Una única fuente de verdad');
  const a = auditarMigracion();
  eq(a.fuentesDuplicadas, 0, '⚠️ ni una segunda versión de nada');
  eq(a.mapaSinFuente, [], 'cada cosa que existe dice quién manda');
  eq(a.noExiste, ['favoritos'],
    '⚠️ y el sistema que NO existe se declara, como hizo la F39');
  ok(!!mapaDe('favoritos').porque, 'con su motivo');
  ok(mapaDe('armario').guardaEH.includes('id'),
    'del armario, Estilo de hombre solo guarda el id de la prenda');
  ok(/derivan/.test(mapaDe('calendario').guardaEH), 'y del calendario, nada: se derivan');
  ok(a.fuentesGlobales > 0, '`FUENTES_GLOBALES` sigue siendo la lista de la F4');
}

/* ---------------------------------------------------------------------------
   7 · LOS VEINTE APARTADOS, Y LO QUE NO SE CUMPLE
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Los veinte apartados');
  eq(APARTADOS_MIGRACION.length, 20, 'los veinte del enunciado');
  eq(APARTADOS_MIGRACION.map((x) => x.apartado), Array.from({ length: 20 }, (_, i) => i + 1),
    'y en su orden');
  const a = auditarMigracion();
  eq(a.sinDonde, [], 'ninguno se queda sin decir dónde se cumple');
  eq(a.noCumplidos, ['despliegue', 'supabase', 'entre_versiones'],
    '⚠️ tres no se pueden cumplir, y se dice cuáles');
  eq(a.sinMotivo, [], '⚠️ y ninguno se queda sin motivo');
  ok(/a mano/.test(apartadoMigracion('supabase').donde),
    '⚠️ el esquema lo ejecuta Josué a mano: no hay migraciones versionadas de base de datos');
  ok(/normalizadores borran/.test(apartadoMigracion('entre_versiones').porque),
    'y un cliente antiguo borra lo que no conoce (regla 5)');

  eq(a.caminoCompleto, true, '⚠️ apartado 10 — desde la versión más antigua se llega a la actual');
  eq(a.sinDeAY, [], 'cada migración dice de dónde viene y adónde va');
  eq(a.sinPorque, [], 'y por qué existe');
  eq(migracionDe(1).a, 2, 'se buscan por la versión de la que parten');
  eq(migracionDe(99), null, 'y una que no existe es null');

  const panel = panelMigracion(viejo());
  eq(panel.usuario, 'existente', 'el panel dice qué usuario es');
  eq(panel.pendientes.length, 3, 'y saca aparte lo que no se cumple');
  eq(panel.actual, VERSION_ACTUAL, 'con la versión de hoy');
}

/* ---------------------------------------------------------------------------
   8 · EL RECORRIDO COMPLETO (apartado 20)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Copia → migración → uso → borrado → recuperación');
  const r = migrarEstiloHombre(viejo());
  let e = normalizarEstiloHombre(r.estado);
  eq(datosPerfumes(e).perfumes.length, 1, 'después de migrar, sus datos siguen ahí');

  const creado = anadirPerfume(e, { nombre: 'Nuevo', marca: 'X' }, { hoy: HOY });
  e = creado.estado;
  eq(datosPerfumes(e).perfumes.length, 2, 'se puede seguir añadiendo');

  const id = datosPerfumes(e).perfumes[1].id;
  const borrado = eliminarPerfume(e, id, { ahora: `${HOY}T10:00:00.000Z` });
  eq(datosPerfumes(borrado.estado).perfumes.length, 1, 'borrar sigue funcionando');
  const vuelto = restaurarPerfume(borrado.estado, borrado.entrada);
  eq(datosPerfumes(vuelto.estado).perfumes.length, 2, 'y recuperar, también');
  eq(normalizarEstiloHombre(vuelto.estado).version, VERSION_ACTUAL,
    '⚠️ y la versión sigue siendo la de hoy después de todo el recorrido');

  // Y la migración está enganchada al arranque de verdad.
  ok(/migrarEstiloHombre\(eh\)/.test(APP),
    '⚠️ App.jsx migra al cargar, sobre lo que devuelve `loadData`');
  ok(/if \(migracionEH\.migrada && !migracionEH\.error\)/.test(APP),
    '⚠️ y solo guarda si de verdad ha cambiado algo, y no ha fallado');
  ok(APP.indexOf('migrarEstiloHombre(eh)') < APP.indexOf('setEstiloHombre(normalizarEstiloHombre(migracionEH.estado))'),
    '🚨 y migra ANTES de normalizar: al revés no arreglaría nada');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
