// ============================================================================
// EH · Fase 1/65 — Pruebas de la arquitectura base
//
// El apartado 15 enumera ocho pruebas obligatorias. Aquí están las siete
// comprobables sin navegador, marcadas «TEST», más lo que las sostiene.
//
// Las dos que más importan, porque romperlas no da un error sino una pérdida
// silenciosa:
//   · **TEST 6: desactivar un módulo NO borra sus datos** (apartado 7).
//   · **TEST 7: añadir un módulo nuevo no rompe los existentes** (apartado 15).
// ============================================================================

import {
  MODULOS_EH, moduloEH, IDS_EH, VERSION_EH, DEFAULT_ESTILO_HOMBRE,
  normalizarEstiloHombre, modulosActivos, todosLosModulos, estaActivo,
  configurarPrimeraVez, alternarModulo, reordenar, guardarConfig,
  FUENTES_GLOBALES, fuenteDe, esDatoGlobal,
  ESTADOS_PANTALLA, estadoPantalla, resumenEstiloHombre,
} from '../src/lib/estiloDeHombre.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

const HOY = '2026-08-27';

/* ===========================================================================
   EL CATÁLOGO
   =========================================================================== */
console.log('\n═══ El catálogo de módulos ═══\n');
{
  /* ⚠️ **Aquí había un `=== 13` repetido nueve veces, y el catálogo está hecho
     para crecer**: el Test 7 de más abajo se llama literalmente *"un estado
     viejo NO se rompe al crecer el catálogo"*. EH F23 añadió `sonrisa` con todo
     el derecho y saltaron las nueve. Lo que importa es **que estén los que
     Josué escribió en su Fase 2** y que el normalizador devuelva SIEMPRE el
     catálogo entero, sea del tamaño que sea. */
  comprobar('Están los trece módulos que escribió Josué en la Fase 2',
    ['estilo', 'pelo', 'barba', 'skincare', 'higiene', 'cuerpo', 'fitness', 'sueno',
      'salud', 'habitos', 'progreso', 'educacion', 'productos']
      .every((id) => MODULOS_EH.some((m) => m.id === id)));
  comprobar('Y ninguno se ha quedado sin categoría ni sin sinónimos',
    MODULOS_EH.every((m) => m.categoria && Array.isArray(m.terminos) && m.terminos.length > 0));
  comprobar('CLAVE · Cada uno con icono, nombre y descripción corta',
    MODULOS_EH.every((m) => m.icono && m.nombre && m.sub));
  comprobar('⚠️ CLAVE · Y con la FASE en la que se construye su contenido',
    MODULOS_EH.every((m) => m.fase >= 2 && m.fase <= 65));
  comprobar('CLAVE · ...que es lo que permite decir la verdad sobre lo que aún está vacío',
    MODULOS_EH.every((m) => m.fase > 1));
  comprobar('Ningún id repetido', new Set(IDS_EH).size === IDS_EH.length);
  comprobar('Un módulo inventado no existe', moduloEH('zzz') === null);
  comprobar('Están los que enumera el enunciado',
    ['estilo', 'pelo', 'skincare', 'higiene', 'barba', 'fitness', 'productos'].every((id) => !!moduloEH(id)));
}

/* ===========================================================================
   TEST 1 — USUARIO NUEVO
   =========================================================================== */
console.log('\n═══ Test 1 · Usuario nuevo ═══\n');
{
  const nuevo = normalizarEstiloHombre(null);
  comprobar('TEST 1 · Un usuario nuevo entra SIN configurar', nuevo.configurado === false);
  comprobar('CLAVE · ...y la pantalla lo sabe', estadoPantalla(nuevo) === 'sin_configurar');
  comprobar('⚠️ CLAVE · Todos los módulos nacen APAGADOS: encenderlos sería decidir por él',
    nuevo.modulos.every((m) => m.activo === false));
  comprobar('CLAVE · Pero están todos, listos para elegir', nuevo.modulos.length === MODULOS_EH.length);
  comprobar('Hay tres estados de pantalla', ESTADOS_PANTALLA.length === 3);
  comprobar('El estado por defecto es el correcto', DEFAULT_ESTILO_HOMBRE.configurado === false);
}

/* ===========================================================================
   TEST 2 — SELECCIONAR TRES MÓDULOS
   =========================================================================== */
console.log('\n═══ Test 2 · Selecciona 3 módulos ═══\n');
{
  const e = configurarPrimeraVez(null, ['skincare', 'pelo', 'habitos'], { hoy: HOY });

  comprobar('TEST 2 · Aparecen únicamente esos 3', modulosActivos(e).length === 3);
  comprobar('CLAVE · ...y son los que eligió', modulosActivos(e).map((m) => m.id).join() === 'skincare,pelo,habitos');
  comprobar('⚠️ CLAVE · En EL ORDEN en que los eligió, no en el del catálogo',
    modulosActivos(e)[0].id === 'skincare');
  comprobar('CLAVE · Los demás siguen ahí, apagados', normalizarEstiloHombre(e).modulos.length === MODULOS_EH.length);
  comprobar('Ya está configurado', e.configurado === true && estadoPantalla(e) === 'con_modulos');
  comprobar('CLAVE · Y se guarda cuándo', e.creadoEn === HOY);
  comprobar('Las plaquitas traen su icono y su nombre',
    modulosActivos(e).every((m) => !!m.icono && !!m.nombre));

  comprobar('CLAVE · Un id inventado se descarta al configurar',
    modulosActivos(configurarPrimeraVez(null, ['skincare', 'zzz'])).length === 1);
  comprobar('⚠️ CLAVE · Configurar SIN elegir nada es válido: la pantalla lo dirá',
    estadoPantalla(configurarPrimeraVez(null, [])) === 'sin_modulos');
}

/* ===========================================================================
   TEST 3 — LA CONFIGURACIÓN SE CONSERVA
   =========================================================================== */
console.log('\n═══ Test 3 · Cierra y vuelve a entrar ═══\n');
{
  const e = configurarPrimeraVez(null, ['skincare', 'barba'], { hoy: HOY });
  // Cerrar y volver a entrar es exactamente esto: guardar y normalizar de nuevo.
  const tras = normalizarEstiloHombre(JSON.parse(JSON.stringify(e)));

  comprobar('TEST 3 · La configuración se conserva', modulosActivos(tras).length === 2);
  comprobar('CLAVE · ...con los mismos módulos', modulosActivos(tras).map((m) => m.id).join() === 'skincare,barba');
  comprobar('CLAVE · Y sigue marcado como configurado', tras.configurado === true);
  comprobar('⚠️ CLAVE · Sobrevive a DOS guardados seguidos',
    modulosActivos(normalizarEstiloHombre(tras)).length === 2);
}

/* ===========================================================================
   TESTS 4 Y 5 — DESACTIVAR Y VOLVER A ACTIVAR
   =========================================================================== */
console.log('\n═══ Tests 4 y 5 · Desactivar y volver a activar ═══\n');
{
  const e = configurarPrimeraVez(null, ['skincare', 'pelo', 'barba'], { hoy: HOY });

  const sinPelo = alternarModulo(e, 'pelo', false);
  comprobar('TEST 4 · Desactivar un módulo lo quita de la pantalla', modulosActivos(sinPelo).length === 2);
  comprobar('CLAVE · ...y ya no está activo', estaActivo(sinPelo, 'pelo') === false);
  comprobar('CLAVE · Pero SIGUE en la lista de gestionar', todosLosModulos(sinPelo).length === MODULOS_EH.length);

  const conPelo = alternarModulo(sinPelo, 'pelo', true);
  comprobar('TEST 5 · Volver a activarlo lo devuelve', modulosActivos(conPelo).length === 3);
  comprobar('CLAVE · ...en su sitio de siempre', modulosActivos(conPelo)[1].id === 'pelo');

  comprobar('Sin decir si sí o no, se alterna', estaActivo(alternarModulo(e, 'barba'), 'barba') === false);
  comprobar('Un id inventado no revienta ni cambia nada',
    modulosActivos(alternarModulo(e, 'zzz', true)).length === 3);
}

/* ===========================================================================
   TEST 6 — ⚠️ DESACTIVAR NO BORRA DATOS
   =========================================================================== */
console.log('\n═══ Test 6 · Desactivar NO borra datos ═══\n');
{
  let e = configurarPrimeraVez(null, ['skincare'], { hoy: HOY });
  // Una fase futura le guarda su configuración a Skincare.
  e = guardarConfig(e, 'skincare', { tipoPiel: 'mixta', rutinaManana: true });

  const apagado = alternarModulo(e, 'skincare', false);
  const suConfig = normalizarEstiloHombre(apagado).modulos.find((m) => m.id === 'skincare').config;

  comprobar('⚠️ TEST 6 · Desactivar CONSERVA la configuración del módulo',
    suConfig.tipoPiel === 'mixta' && suConfig.rutinaManana === true);
  comprobar('⚠️ CLAVE · ...también después de guardar y recargar',
    normalizarEstiloHombre(JSON.parse(JSON.stringify(apagado)))
      .modulos.find((m) => m.id === 'skincare').config.tipoPiel === 'mixta');
  comprobar('⚠️ CLAVE · Y al volver a activarlo, sus datos siguen ahí',
    normalizarEstiloHombre(alternarModulo(apagado, 'skincare', true))
      .modulos.find((m) => m.id === 'skincare').config.tipoPiel === 'mixta');

  comprobar('CLAVE · Guardar config FUSIONA, no sustituye: una fase no borra lo de otra',
    Object.keys(guardarConfig(e, 'skincare', { spf: 50 }).modulos.find((m) => m.id === 'skincare').config).length === 3);
  comprobar('Guardar en un módulo que no existe no revienta',
    normalizarEstiloHombre(guardarConfig(e, 'zzz', { x: 1 })).modulos.length === MODULOS_EH.length);
}

/* ===========================================================================
   TEST 7 — ⚠️ UN MÓDULO NUEVO NO ROMPE LOS EXISTENTES
   =========================================================================== */
console.log('\n═══ Test 7 · Un módulo nuevo no rompe nada ═══\n');
{
  const e = configurarPrimeraVez(null, ['skincare', 'pelo'], { hoy: HOY });

  // Así se ve un estado guardado ANTES de que el catálogo creciera: le faltan
  // módulos que hoy sí existen.
  const viejo = {
    configurado: true,
    modulos: [
      { id: 'skincare', activo: true, orden: 0, config: { tipoPiel: 'seca' } },
      { id: 'pelo', activo: true, orden: 1, config: {} },
    ],
  };
  const migrado = normalizarEstiloHombre(viejo);

  comprobar('⚠️ TEST 7 · Un estado viejo NO se rompe al crecer el catálogo', migrado.modulos.length === MODULOS_EH.length);
  comprobar('⚠️ CLAVE · Lo que ya tenía sigue activo', modulosActivos(migrado).length === 2);
  comprobar('⚠️ CLAVE · ...con su configuración intacta',
    migrado.modulos.find((m) => m.id === 'skincare').config.tipoPiel === 'seca');
  comprobar('⚠️ CLAVE · Y los módulos nuevos aparecen APAGADOS, sin decidir por él',
    migrado.modulos.find((m) => m.id === 'productos').activo === false);

  // Y al revés: un módulo guardado que ya no está en el catálogo.
  const conFantasma = normalizarEstiloHombre({
    configurado: true,
    modulos: [...viejo.modulos, { id: 'modulo_retirado', activo: true, orden: 2 }],
  });
  comprobar('⚠️ CLAVE · Un módulo guardado que YA NO EXISTE se descarta, no revienta',
    !conFantasma.modulos.some((m) => m.id === 'modulo_retirado'));
  comprobar('CLAVE · ...y los demás siguen intactos', modulosActivos(conFantasma).length === 2);

  comprobar('Basura entera no revienta', normalizarEstiloHombre('hola').modulos.length === MODULOS_EH.length);
  comprobar('Un módulo guardado sin id se descarta',
    normalizarEstiloHombre({ modulos: [{ activo: true }] }).modulos.length === MODULOS_EH.length);
}

/* ===========================================================================
   ORDEN (apartado 9)
   =========================================================================== */
console.log('\n═══ El orden de las plaquitas ═══\n');
{
  const e = configurarPrimeraVez(null, ['skincare', 'pelo', 'habitos', 'fitness'], { hoy: HOY });

  const reordenado = reordenar(e, ['fitness', 'skincare', 'pelo', 'habitos']);
  comprobar('CRITERIO · Se puede reordenar (apartado 9)', modulosActivos(reordenado)[0].id === 'fitness');
  comprobar('CLAVE · ...y el resto se conserva', modulosActivos(reordenado).length === 4);

  const parcial = reordenar(e, ['habitos']);
  comprobar('⚠️ CLAVE · Un módulo que NO viene en el orden NO desaparece: se queda detrás',
    modulosActivos(parcial).length === 4);
  comprobar('CLAVE · ...y el que sí venía va primero', modulosActivos(parcial)[0].id === 'habitos');
  comprobar('Un orden con basura se limpia', modulosActivos(reordenar(e, ['zzz', 'pelo'])).length === 4);
}

/* ===========================================================================
   ⚠️ APARTADO 10 — NO COPIAR LOS DATOS GLOBALES
   =========================================================================== */
console.log('\n═══ Apartado 10 · No copiar los datos globales ═══\n');
{
  comprobar('CRITERIO · Están declaradas las fuentes globales', Object.keys(FUENTES_GLOBALES).length >= 10);
  comprobar('CLAVE · Cada una dice de qué módulo sale',
    Object.values(FUENTES_GLOBALES).every((f) => !!f.modulo && !!f.clave && !!f.que));
  comprobar('CRITERIO · Están las que enumera el enunciado',
    ['peso', 'perfil', 'objetivos', 'sueno', 'calendario', 'rachas'].every((k) => !!fuenteDe(k)));
  comprobar('CLAVE · Y también el armario, que ya es un módulo del proyecto', !!fuenteDe('armario'));

  comprobar('⚠️ CLAVE · Si una fase futura quiere guardar "peso", se le dice que YA EXISTE',
    esDatoGlobal('pesoActual').global === true);
  comprobar('CLAVE · ...diciendo dónde está', esDatoGlobal('peso').modulo === 'salud');
  comprobar('CLAVE · Algo que de verdad es suyo pasa', esDatoGlobal('tipoDePiel').global === false);
  comprobar('Sin nombre no se afirma nada', esDatoGlobal('').global === false);

  comprobar('⚠️ CLAVE · Esta fase NO guarda ni un dato global: solo declara de dónde saldrán',
    !JSON.stringify(DEFAULT_ESTILO_HOMBRE).includes('peso'));
}

/* ===========================================================================
   ESTADOS DE PANTALLA Y RESUMEN
   =========================================================================== */
console.log('\n═══ Estados de pantalla y resumen ═══\n');
{
  comprobar('CRITERIO · Sin configurar', estadoPantalla(null) === 'sin_configurar');
  comprobar('CRITERIO · Configurado pero sin módulos', estadoPantalla(configurarPrimeraVez(null, [])) === 'sin_modulos');
  comprobar('CRITERIO · Con módulos', estadoPantalla(configurarPrimeraVez(null, ['pelo'])) === 'con_modulos');
  comprobar('⚠️ CLAVE · Desactivar el último devuelve a "sin módulos", no a una pantalla en blanco',
    estadoPantalla(alternarModulo(configurarPrimeraVez(null, ['pelo']), 'pelo', false)) === 'sin_modulos');

  const r = resumenEstiloHombre(configurarPrimeraVez(null, ['skincare', 'pelo'], { hoy: HOY }));
  comprobar('El resumen cuenta los activos', r.activos === 2 && r.total === MODULOS_EH.length);
  comprobar('...y los apagados', r.apagados === MODULOS_EH.length - 2);
  comprobar('⚠️ CLAVE · Y dice que HOY NINGUNO tiene contenido todavía', r.conContenido === 0);
  comprobar('CLAVE · ...porque el enunciado prohíbe construirlo en esta fase', r.proximaFase === 2);
  /* ⚠️ Era 1 cuando se escribió esto. La **F46** la subió a 2 con la primera
     migración de verdad, así que lo que se comprueba ahora es lo que importa:
     que hay una versión, que es un número y que **nunca baja**. */
  comprobar('La versión está declarada', Number.isInteger(VERSION_EH) && VERSION_EH >= 1);
}

/* ===========================================================================
   RESUMEN
   =========================================================================== */
console.log('\n  ⚠️ Test 8 (que funcione en móvil) no se puede comprobar aquí: es del');
console.log('     navegador real, mismo límite que R1.\n');
console.log('  ⚠️ Y lo que el propio enunciado prohíbe en esta fase: Skincare, Pelo, Barba,');
console.log('     Productos, Hábitos, Salud, Educación… Aquí solo está la infraestructura.\n');

if (fallos) { console.log(`  ${fallos} fallo(s).\n`); process.exit(1); }
console.log('  Todo correcto.\n');
