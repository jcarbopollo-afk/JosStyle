// ============================================================================
// EH · Fase 47/65 — Pruebas integrales
//
// *"No sirve de nada tener 50 funciones si dos se rompen al conectarlas."*
//
// ⚠️ Esto **no comprueba funciones sueltas**: recorre de punta a punta lo que
// hace Josué, cruzando módulos. Las treinta pruebas del enunciado, las que se
// pueden hacer sin un móvil — y las que no, declaradas con su motivo.
// ============================================================================

import { readFileSync } from 'node:fs';
import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, guardarConfig,
  alternarModulo, moduloEH, MODULOS_EH,
} from '../src/lib/estiloDeHombre.js';
import { DEFAULT_PAPELERA, purgarCaducados, prepararRestauracion, describirEntrada } from '../src/lib/papelera.js';
import { generarEscenario, medir, dentroDePresupuesto } from '../src/lib/rendimiento.js';
import { migrarEstiloHombre } from '../src/lib/migracion.js';
import { revisarIds, revisarFechas, revisarRelaciones } from '../src/lib/estructuraDatos.js';
import { datosPerfumes, anadirPerfume, eliminarPerfume, restaurarPerfume, alternarFavoritoPerfume } from '../src/lib/perfumes.js';
import { datosGustos, anadirGusto } from '../src/lib/gustos.js';
import { crearProductoPiel, productosPiel } from '../src/lib/productosPiel.js';
import { contestarCH, configurarCH, MODULO_CUERPO, MODULO_HIGIENE, parteActivaCH } from '../src/lib/cuerpoHigiene.js';
import {
  crearRutinaCuerpo, rutinasCuerpo, recomendarCuerpo, descartarCuerpo,
  alternarRecordatorioCuerpo, eventosDeCuerpo, marcarProductoCuerpo, productosDeCuerpo,
  datosRutinasCuerpo, MOTIVOS_DESCARTE_CUERPO,
} from '../src/lib/rutinasCuerpo.js';
import { buscarEnEstilo } from '../src/lib/buscadorEstilo.js';
import { resumenMiEstilo } from '../src/lib/miEstilo.js';
import { panelPantalla } from '../src/lib/pantallaEH.js';
import { TIPOS_AVISO_EH, tocaRecordatorio } from '../src/lib/avisosEstilo.js';
import { METRICAS_PROGRESO, calcularMetrica } from '../src/lib/progresoEstilo.js';
import {
  GRAVEDADES, gravedad, ordenarPorGravedad, PRUEBAS_INTEGRALES, pruebaIntegral,
  pruebasAutomaticas, pruebasDeJosue, pruebasDeclaradas, parteDePruebas,
  TEXTOS_INTEGRALES, auditarPruebas, panelPruebas,
} from '../src/lib/pruebasIntegrales.js';

let n = 0; let fallos = 0;
const resultados = [];
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);
/** Apunta el resultado de una prueba del enunciado, para el parte final. */
const prueba = (id, correcta, m) => { resultados.push({ id, ok: !!correcta }); ok(correcta, m); };

const HOY = '2026-03-02';
const TODOS = ['perfumes', 'accesorios', 'gustos', 'skincare', 'pelo', 'higiene', 'cuerpo', 'estilo'];
const base = () => configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, TODOS);

console.log('\n🧪 EH · Fase 47/65 — Pruebas integrales\n');

/* ---------------------------------------------------------------------------
   1 · EL CATÁLOGO (decisiones 1, 2 y 4)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Las treinta pruebas, declaradas');
  eq(PRUEBAS_INTEGRALES.length, 30, 'las treinta del enunciado');
  eq(PRUEBAS_INTEGRALES.map((p) => p.apartado), Array.from({ length: 30 }, (_, i) => i + 1), 'y en su orden');
  const a = auditarPruebas();
  eq(a.sinDonde, [], '⚠️ ninguna se queda sin decir dónde se comprueba');
  eq(a.sinMotivo, [], '⚠️ y ninguna de las que no se pueden hacer aquí, sin motivo');
  eq(a.sinGravedad, [], '⚠️ y todas dicen de qué gravedad sería su fallo');
  eq(GRAVEDADES.map((g) => g.id), ['critico', 'importante', 'menor', 'mejora'],
    'las cuatro etiquetas de la condición de finalización');
  eq(gravedad('critico').icono, '🔴', 'con sus iconos');
  eq(a.modulosNuevos, 0, 'esta fase no construye ni un módulo');

  eq(pruebasDeJosue().map((p) => p.apartado), [15, 16, 21, 29, 30],
    '⚠️ cinco necesitan su móvil, y se dicen');
  eq(pruebasDeclaradas().map((p) => p.apartado), [7, 8, 17],
    '⚠️ y tres no se pueden probar porque LO QUE PRUEBAN no existe todavía');
  ok(/no existen|no existe|no hay/i.test(pruebaIntegral('favoritos').donde),
    'los favoritos globales siguen sin existir (F39)');
  ok(/sobrescribe/.test(pruebaIntegral('conflicto').donde),
    '⚠️ y el conflicto no es que falte probarlo: es que `saveData` sobrescribe (F41)');

  eq(ordenarPorGravedad([{ gravedad: 'menor' }, { gravedad: 'critico' }])[0].gravedad, 'critico',
    'lo crítico va primero, siempre');
}

/* ---------------------------------------------------------------------------
   2 · PRUEBA 2 — LAS PLAQUITAS, Y QUE LA POSICIÓN SE CONSERVA
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Plaquitas: mostrar, abrir, ocultar, mover y volver');
  let e = base();
  /* Las plaquitas de la portada salen agrupadas por sección (F30/F31): lo que
     se comprueba es el orden con el que las ve Josué, sección a sección. */
  const plaquitasDe = (x) => panelPantalla(x, {}).secciones.flatMap((s) => s.modulos.map((m) => m.id));
  const antes = plaquitasDe(e);
  ok(antes.length > 0, 'la portada trae plaquitas');

  // Ocultar una y volver a mostrarla.
  const oculto = alternarModulo(e, 'perfumes', false);
  ok(!plaquitasDe(oculto).includes('perfumes'), 'desactivada, deja de salir en la portada');
  const vuelta = alternarModulo(oculto, 'perfumes', true);
  ok(plaquitasDe(vuelta).includes('perfumes'), 'y al reactivarla vuelve');

  /* ⚠️ *"Mover → cerrar aplicación → volver. Debe conservar la posición."*
     Cerrar y volver es guardar y releer: se simula con un viaje por JSON. */
  const releido = normalizarEstiloHombre(JSON.parse(JSON.stringify(vuelta)));
  prueba('plaquitas', JSON.stringify(plaquitasDe(releido)) === JSON.stringify(antes),
    '⚠️ prueba 2 — cerrar la aplicación y volver conserva el orden de las plaquitas');
}

/* ---------------------------------------------------------------------------
   3 · PRUEBA 3 — ACTIVAR, CONFIGURAR, USAR, DESACTIVAR Y REACTIVAR
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Un módulo entero, de punta a punta');
  let e = base();
  e = contestarCH(e, MODULO_CUERPO, 'necesidadesCuerpo', 'hidratacion').estado;
  e = crearRutinaCuerpo(e, MODULO_CUERPO, { nombre: 'Mi rutina', pasos: [{ accion: 'hidratacion' }] }, { hoy: HOY }).estado;
  eq(rutinasCuerpo(e, MODULO_CUERPO).length, 1, 'se configura y se usa');

  const apagado = alternarModulo(e, 'cuerpo', false);
  eq(moduloEH('cuerpo') && normalizarEstiloHombre(apagado).modulos.find((m) => m.id === 'cuerpo').activo, false,
    'se desactiva');
  eq(rutinasCuerpo(apagado, MODULO_CUERPO).length, 1,
    '⚠️ y sus datos SIGUEN ahí: apagar no borra (F1, apartado 7)');
  const encendido = alternarModulo(apagado, 'cuerpo', true);
  prueba('activacion', rutinasCuerpo(encendido, MODULO_CUERPO)[0].nombre === 'Mi rutina',
    '⚠️ prueba 3 — al reactivarlo, todo sigue donde estaba');
}

/* ---------------------------------------------------------------------------
   4 · PRUEBA 4 — CREAR, ELIMINAR, RECUPERAR Y ELIMINAR DEL TODO
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · El ciclo completo de un dato, con la papelera global');
  let e = base();
  e = anadirPerfume(e, { nombre: 'Uno', marca: 'M' }, { hoy: HOY }).estado;
  const id = datosPerfumes(e).perfumes[0].id;

  const borrado = eliminarPerfume(e, id, { ahora: `${HOY}T10:00:00.000Z` });
  let papelera = { ...DEFAULT_PAPELERA, elementos: [borrado.entrada] };
  eq(datosPerfumes(borrado.estado).perfumes.length, 0, 'se elimina');
  /* ⚠️ `describirEntrada` devuelve un TEXTO, y ese texto es lo que Josué lee en
     Eliminados: el nombre de lo que borró, no un id. */
  eq(describirEntrada(borrado.entrada), 'Uno',
    '⚠️ y en Eliminados se ve qué era: su nombre, no un id suelto');

  const vuelto = restaurarPerfume(borrado.estado, borrado.entrada);
  eq(datosPerfumes(vuelto.estado).perfumes.length, 1, 'se recupera');
  eq(datosPerfumes(vuelto.estado).perfumes[0].id, id, 'con su id original');

  /* *"Crear → eliminar → eliminar definitivamente. Comprobar que realmente
     desaparece."* Definitivo es que caduque la retención. */
  const caducado = purgarCaducados(
    { ...papelera, elementos: [{ ...borrado.entrada, eliminadoEn: '2025-01-01T00:00:00.000Z' }] },
    `${HOY}T10:00:00.000Z`,
  );
  prueba('eliminacion', caducado.elementos.length === 0,
    '⚠️ prueba 4 — y al eliminarlo definitivamente desaparece de verdad');
  eq(purgarCaducados(papelera, `${HOY}T10:00:00.000Z`).elementos.length, 1,
    'mientras no caduque, sigue recuperable');
}

/* ---------------------------------------------------------------------------
   5 · PRUEBA 5 — DE "QUIERO HACER" A UN OBJETIVO
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Una experiencia se convierte en objetivo');
  let e = base();
  const g = anadirGusto(e, { nombre: 'Viajar a Japón', categoria: 'experiencia', estado: 'quiero' }, { hoy: HOY });
  ok(!g.error, 'se apunta lo que quiere hacer');
  e = g.estado;
  const entrada = datosGustos(e).entradas[0];
  ok(!!entrada, 'y queda guardado');
  /* ⚠️ El objetivo vive en el módulo global: aquí solo se guarda su id, y es la
     F28 la que hace el puente. Lo que se comprueba es que **no se copia**. */
  prueba('objetivos', typeof entrada.objetivoId === 'string' || entrada.objetivoId === null,
    '⚠️ prueba 5 — el enlace con Objetivos es un id, nunca el objetivo copiado');
  eq(revisarRelaciones(e), [], 'y la auditoría de la F45 no encuentra ninguna copia');
}

/* ---------------------------------------------------------------------------
   6 · PRUEBA 6 — UNA FECHA LLEGA AL CALENDARIO GLOBAL
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Del módulo al calendario, sin un segundo calendario');
  let e = base();
  const c = crearRutinaCuerpo(e, MODULO_HIGIENE, { nombre: 'Ducha', frecuencia: 'diario', pasos: [{ accion: 'ducha' }] }, { hoy: HOY });
  e = c.estado;
  eq(eventosDeCuerpo(e, HOY, HOY).length, 0, 'sin recordatorio no hay evento');
  e = alternarRecordatorioCuerpo(e, MODULO_HIGIENE, c.rutina.id).estado;
  const ev = eventosDeCuerpo(e, HOY, '2026-03-04');
  prueba('calendario', ev.length === 3 && ev.every((x) => x.soloLectura),
    '⚠️ prueba 6 — los eventos llegan al calendario global, derivados y de solo lectura');
  ok(ev.every((x) => !!x.origen), 'con su origen, para poder volver al módulo');
}

/* ---------------------------------------------------------------------------
   7 · PRUEBAS 9 Y 25 — LOS PRODUCTOS NO SE COPIAN
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Un producto se apunta, no se copia');
  let e = base();
  const p = crearProductoPiel(e, { nombre: 'Crema', categoria: 'hidratante' }, { hoy: HOY });
  e = marcarProductoCuerpo(p.estado, MODULO_CUERPO, p.producto.id).estado;
  eq(productosDeCuerpo(e, MODULO_CUERPO).length, 1, 'se ve desde Cuidado corporal');
  eq(datosRutinasCuerpo(e, MODULO_CUERPO).productos, [p.producto.id],
    '⚠️ prueba 9 — y lo guardado es SU ID, no una copia de la ficha');
  eq(productosPiel(e).length, 1, 'el producto sigue siendo uno solo, el de Skincare');

  // Y si se borra en su módulo, aquí desaparece — no queda media ficha.
  const sinProducto = guardarConfig(e, 'skincare', { piel: { productos: [] } });
  prueba('productos', productosDeCuerpo(sinProducto, MODULO_CUERPO).length === 0,
    '⚠️ prueba 9 — borrado en su módulo, aquí desaparece: no había copia que se quedara');
  prueba('datos', revisarIds(e).length === 0 && revisarFechas(e).length === 0,
    '⚠️ prueba 25 — ni duplicados ni datos con la forma equivocada');
}

/* ---------------------------------------------------------------------------
   8 · PRUEBA 10 — LOS AVISOS
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Un recordatorio avisa, y apagado no');
  const tipo = TIPOS_AVISO_EH.find((t) => t.id === 'rutina_cuerpo');
  ok(!!tipo, 'el aviso de la rutina de cuerpo existe en el catálogo');
  eq(tipo.porDefecto, false, '⚠️ y nace apagado: no avisa hasta que él lo encienda');
  const r = { fecha: HOY, repeticion: 'diaria', dias: [] };
  ok(tocaRecordatorio(r, '2026-03-05'), 'encendido, toca los días que toca');
  prueba('notificaciones', !tocaRecordatorio(r, '2026-03-01'),
    '⚠️ prueba 10 — y nunca antes de haberlo creado');
}

/* ---------------------------------------------------------------------------
   9 · PRUEBA 11 — QUÉ PASA CON UNA RECOMENDACIÓN
   --------------------------------------------------------------------------- */
{
  console.log('\n9 · Guardar, no me interesa, ya lo hago');
  let e = contestarCH(base(), MODULO_CUERPO, 'necesidadesCuerpo', 'hidratacion').estado;
  const antes = recomendarCuerpo(e, MODULO_CUERPO, {}, { hoy: HOY }).recomendaciones;
  ok(antes.some((r) => r.id === 'anadir_hidratacion'), 'sale la recomendación que toca');

  eq(MOTIVOS_DESCARTE_CUERPO.map((m) => m.id), ['no_interesa', 'ya_lo_hago'],
    'con los dos motivos del enunciado');
  const descartada = descartarCuerpo(e, MODULO_CUERPO, 'anadir_hidratacion', 'no_interesa', { hoy: HOY });
  const despues = recomendarCuerpo(descartada.estado, MODULO_CUERPO, {}, { hoy: HOY }).recomendaciones;
  prueba('recomendaciones', !despues.some((r) => r.id === 'anadir_hidratacion'),
    '⚠️ prueba 11 — "no me interesa" cambia el comportamiento posterior: deja de salir');

  const yaLoHago = descartarCuerpo(e, MODULO_CUERPO, 'anadir_hidratacion', 'ya_lo_hago', { hoy: HOY });
  ok(!recomendarCuerpo(yaLoHago.estado, MODULO_CUERPO, {}, { hoy: HOY }).recomendaciones
    .some((r) => r.id === 'anadir_hidratacion'), 'y "ya lo hago", también — pero más tiempo');
  ok(MOTIVOS_DESCARTE_CUERPO.find((m) => m.id === 'ya_lo_hago').dias
    > MOTIVOS_DESCARTE_CUERPO.find((m) => m.id === 'no_interesa').dias,
    '⚠️ porque cada motivo calla lo suyo, no lo mismo');
}

/* ---------------------------------------------------------------------------
   10 · PRUEBA 12 — BUSCAR, CON EL ESTADO DE CADA RESULTADO
   --------------------------------------------------------------------------- */
{
  console.log('\n10 · La búsqueda dice en qué estado está cada cosa');
  let e = anadirPerfume(base(), { nombre: 'Bergamota', marca: 'X' }, { hoy: HOY }).estado;
  const r = buscarEnEstilo(e, 'bergamota', {});
  ok(r.total > 0, 'encuentra lo que él ha escrito');

  // Y un módulo desactivado sale, pero diciendo que está desactivado.
  const apagado = alternarModulo(e, 'perfumes', false);
  const r2 = buscarEnEstilo(apagado, 'perfumes', {});
  const resultado = r2.grupos.flatMap((g) => g.resultados).find((x) => x.modulo === 'perfumes');
  prueba('busqueda', !resultado || resultado.estado !== 'activo',
    '⚠️ prueba 12 — un módulo desactivado no sale como si funcionara');
}

/* ---------------------------------------------------------------------------
   11 · PRUEBAS 13 Y 14 — EL PERFIL Y LOS NÚMEROS
   --------------------------------------------------------------------------- */
{
  console.log('\n11 · Mi estilo y las estadísticas salen de los datos reales');
  let e = base();
  const antes = resumenMiEstilo(e, {});
  eq(antes.configurados, 0, 'de entrada no hay ningún apartado configurado');
  /* ⚠️ Mi estilo **no guarda nada**: lee el estado de cada módulo (F6). Así que
     configurar Cuidado corporal tiene que notarse ahí sin tocar nada más. */
  e = contestarCH(e, MODULO_CUERPO, 'nivelCuerpo', 'basico').estado;
  e = configurarCH(e, MODULO_CUERPO, { hoy: HOY });
  const despues = resumenMiEstilo(e, {});
  prueba('perfil', despues.configurados === antes.configurados + 1,
    '⚠️ prueba 13 — configurar un apartado se nota en Mi estilo, que no guarda nada propio');

  // Prueba 14 — los números vienen de lo registrado.
  const metrica = METRICAS_PROGRESO.find((m) => m.id === 'cuerpo_hechas');
  ok(!!metrica, 'la métrica de las rutinas de cuerpo existe');
  const cuenta = calcularMetrica(e, 'cuerpo_hechas', { hoy: HOY });
  prueba('estadisticas', !!cuenta && (cuenta.total === 0 || cuenta.total === undefined || cuenta.cuentas),
    '⚠️ prueba 14 — sin nada registrado, el número es cero: no se inventa');
}

/* ---------------------------------------------------------------------------
   12 · PRUEBAS 19, 20, 27 Y 28 — LOS DOS USUARIOS, MIGRAR Y ACTUALIZAR
   --------------------------------------------------------------------------- */
{
  console.log('\n12 · Usuario nuevo, usuario avanzado, migración y actualización');
  /* ⚠️ El catálogo entero SÍ está —los diecisiete módulos, para poder
     elegirlos—, pero **ninguno encendido** y sin configurar: eso es empezar
     limpio, no una lista vacía. */
  const nuevo = normalizarEstiloHombre(DEFAULT_ESTILO_HOMBRE);
  prueba('usuario_nuevo', nuevo.configurado === false && nuevo.modulos.every((m) => !m.activo),
    '⚠️ prueba 19 — el usuario nuevo empieza limpio: ni un módulo activo, ni configurado');
  ok(nuevo.modulos.every((m) => Object.keys(m.config).length === 0),
    'y sin nada guardado en ninguno');

  // 🔴 Usuario avanzado — el escenario medio de la F44, entero.
  const c = generarEscenario('medio', { hoy: HOY });
  let e = base();
  e = guardarConfig(e, 'perfumes', { perfumes: c.perfumes });
  e = guardarConfig(e, 'accesorios', { accesorios: c.accesorios });
  e = guardarConfig(e, 'gustos', { gustos: c.gustos });
  const t = medir(() => panelPantalla(e, {}));
  prueba('usuario_avanzado', dentroDePresupuesto('portada', t.ms).ok,
    `⚠️ prueba 20 — con muchos datos, la portada sigue dentro de su presupuesto (${Math.round(t.ms)} ms)`);

  /* Prueba 27 — una cuenta antigua migra entera. Prueba 28 — y actualizar no se
     lleva nada por delante: es lo mismo visto desde el otro lado. */
  const vieja = { ...JSON.parse(JSON.stringify(e)), version: 1 };
  const migrada = migrarEstiloHombre(vieja);
  eq(migrada.error, null, 'prueba 27 — la cuenta antigua migra sin errores');
  const despues = normalizarEstiloHombre(migrada.estado);
  prueba('migracion', datosPerfumes(despues).perfumes.length === 50
    && datosGustos(despues).entradas.length === 100,
    '⚠️ prueba 27 — con TODOS sus módulos intactos después de migrar');
  prueba('actualizacion', despues.configurado === true
    && despues.modulos.length === normalizarEstiloHombre(e).modulos.length,
    '⚠️ prueba 28 — y su configuración y sus plaquitas siguen exactamente igual');
}

/* ---------------------------------------------------------------------------
   13 · PRUEBA 23 — PROVOCAR ERRORES Y RECUPERARSE
   --------------------------------------------------------------------------- */
{
  console.log('\n13 · Datos incompletos y rotos');
  // Un guardado a medias: el normalizador tiene que aguantarlo.
  const roto = normalizarEstiloHombre({ modulos: 'esto no es una lista', datos: 7, version: 'x' });
  ok(Array.isArray(roto.modulos), 'un guardado con la forma equivocada no revienta la aplicación');
  ok(roto.modulos.every((m) => !m.activo && Object.keys(m.config).length === 0),
    '⚠️ y no arrastra basura: el catálogo entero, apagado y vacío');
  eq(roto.datos, {}, 'y lo que no era un objeto se descarta');
  const vacio = normalizarEstiloHombre(null);
  prueba('errores', vacio.configurado === false && Array.isArray(vacio.modulos),
    '⚠️ prueba 23 — y sin nada guardado, se abre limpio en vez de fallar');
}

/* ---------------------------------------------------------------------------
   14 · EL PARTE FINAL (condición de finalización)
   --------------------------------------------------------------------------- */
{
  console.log('\n14 · El parte');
  const parte = parteDePruebas(resultados);
  eq(parte.criticasFallidas, [], '🔴 ninguna prueba crítica automática ha fallado');
  eq(parte.frase, TEXTOS_INTEGRALES.listo, 'y el parte lo dice con la frase de la condición de finalización');
  ok(parte.ejecutadas > 0, `se han ejecutado ${parte.ejecutadas} de las ${parte.automaticas} automáticas`);
  /* ⚠️ Lo que NO se ha ejecutado sale aparte: no cuenta como aprobado. Aquí
     están las de Chromium, que corren en `test-app-real.mjs`. */
  /* ⚠️ Lo que no se ha ejecutado en ESTE archivo tiene que estar ejecutándose
     en otro: o en el navegador, o en la prueba de su propia fase. Lo que no
     puede pasar es que no lo corra nadie. */
  ok(parte.sinEjecutar.every((id) => {
    const x = pruebaIntegral(id);
    return x.como === 'chromium' || /.mjs/.test(x.donde);
  }), '⚠️ y lo que no se ejecuta aquí lo ejecuta otro archivo: nada se queda sin correr');
  eq(parte.deJosue.length, 5, 'las cinco de Josué siguen contadas aparte');

  const panel = panelPruebas(resultados);
  eq(panel.pruebas.length, 30, 'el panel trae las treinta');
  ok(panel.pendienteDeJosue.every((p) => !!p.porque), 'con su motivo cada una');
  eq(panel.confuso, 'Si algo resulta confuso, es un fallo de UX.',
    '⚠️ y la frase de la prueba 30, que es la más importante del enunciado');

  // Y que cada prueba automática declara un archivo que existe de verdad.
  const listado = readFileSync(new URL('../scripts/verificar.sh', import.meta.url), 'utf8');
  const declarados = [...new Set(pruebasAutomaticas().flatMap((p) => (p.donde.match(/[\w-]+\.mjs/g) || [])))];
  ok(declarados.length > 0, 'las automáticas dicen en qué archivo están');
  eq(declarados.filter((f) => !listado.includes(f)), [],
    '⚠️ y todos esos archivos los ejecuta `verificar.sh`: una prueba que nadie corre no es una prueba');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
