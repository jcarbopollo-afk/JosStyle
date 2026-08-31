// ============================================================================
// EH · Fase 45/65 — Estructura interna de datos
//
// *"Una información = un único lugar = muchas formas de mostrarla."*
//
// Lo que vigila esta prueba:
//   · ni una tercera lista de colecciones: se recorren las de la F41 y ME F3
//   · las fechas, los ids y las relaciones, sobre datos DE VERDAD
//   · lo que no se cumple —los conflictos— declarado con su motivo
//   · y las diez pruebas del apartado 16, una a una
// ============================================================================

import {
  DEFAULT_ESTILO_HOMBRE, configurarPrimeraVez, normalizarEstiloHombre, guardarConfig,
  MODULOS_EH, IDS_EH,
} from '../src/lib/estiloDeHombre.js';
import { COLECCIONES_EH } from '../src/lib/estadosEstilo.js';
import { CATALOGO_PAPELERA, prepararEliminacion, prepararRestauracion } from '../src/lib/papelera.js';
import { generarEscenario } from '../src/lib/rendimiento.js';
import { datosPerfumes, anadirPerfume, eliminarPerfume, restaurarPerfume } from '../src/lib/perfumes.js';
import { datosGustos, anadirGusto } from '../src/lib/gustos.js';
import {
  CLAVES_POR_MODULO, clavesDe, COMO_SE_GUARDA, DONDE_VIVEN_LAS_PREFERENCIAS,
  coleccionesDeEstilo, sinRecuperacion, FORMATO_FECHA, CAMPOS_FECHA, revisarFechas,
  revisarIds, CAMPOS_RELACION, revisarRelaciones, APARTADOS_ESTRUCTURA,
  apartadoEstructura, TEXTOS_ESTRUCTURA, auditarEstructura, panelEstructura,
} from '../src/lib/estructuraDatos.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const HOY = '2026-03-02';
const TODOS = ['perfumes', 'accesorios', 'gustos', 'skincare', 'pelo', 'barba', 'sonrisa', 'higiene', 'cuerpo', 'estilo'];

/* Un estado con datos de verdad: el escenario medio de la F44, que pasa por los
   normalizadores de cada módulo. ⚠️ Auditar un estado vacío no prueba nada. */
const conDatos = () => {
  const c = generarEscenario('medio', { hoy: HOY });
  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, TODOS);
  e = guardarConfig(e, 'perfumes', { perfumes: c.perfumes });
  e = guardarConfig(e, 'accesorios', { accesorios: c.accesorios });
  e = guardarConfig(e, 'gustos', { gustos: c.gustos });
  return e;
};

console.log('\n🗂️ EH · Fase 45/65 — Estructura interna de datos\n');

/* ---------------------------------------------------------------------------
   1 · DÓNDE VIVE CADA COSA (apartados 1, 2, 3 y 4)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Dónde vive cada cosa');
  const a = auditarEstructura(conDatos());
  eq(a.modulosSinDeclarar, [], '⚠️ todos los módulos del catálogo dicen dónde guardan');
  eq(a.modulosSinDatos.length, 7, '⚠️ y los siete que todavía no guardan nada están DICHOS, no olvidados');
  eq(a.sinDonde, [], 'y los dieciséis apartados dicen dónde se cumplen');
  eq(APARTADOS_ESTRUCTURA.length, 16, 'los dieciséis del enunciado');
  eq(APARTADOS_ESTRUCTURA.map((x) => x.apartado), Array.from({ length: 16 }, (_, i) => i + 1),
    'y en su orden');
  ok(clavesDe('perfumes').includes('perfumes'), 'las claves de un módulo se buscan por su id');
  eq(clavesDe('inventado'), [], 'y uno que no existe no tiene ninguna');

  /* ⚠️ Las claves declaradas son las que se usan DE VERDAD: se comprueba
     guardando y volviendo a leer. */
  const e = guardarConfig(configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, TODOS), 'perfumes', { perfumes: { perfumes: [] } });
  const cfg = normalizarEstiloHombre(e).modulos.find((m) => m.id === 'perfumes').config;
  ok('perfumes' in cfg, '⚠️ y la clave declarada para Perfumes es la que se escribe');

  // Apartado 2 — la separación es lógica, y se dice.
  ok(COMO_SE_GUARDA.tabla === 'app_data' && !!COMO_SE_GUARDA.limite,
    '⚠️ se declara CÓMO se guarda de verdad, con su límite');
  ok(/no es una tabla por módulo/i.test(COMO_SE_GUARDA.limite),
    '⚠️ y el límite se dice con todas las letras, en vez de prometer una tabla por módulo');
  ok(!!COMO_SE_GUARDA.porque, 'con el motivo de por qué no se cambia aquí (apartado 15)');

  // Apartado 4 — la preferencia vive en su módulo.
  ok(DONDE_VIVEN_LAS_PREFERENCIAS.fuentes > 0,
    'apartado 4 — `FUENTES_GLOBALES` dice de dónde sale lo que no es de aquí');
  ok(/consulta/.test(DONDE_VIVEN_LAS_PREFERENCIAS.regla),
    'y la regla, con las palabras del enunciado: Mi estilo lo CONSULTA');
}

/* ---------------------------------------------------------------------------
   2 · NI UNA TERCERA LISTA (decisión 1)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Se recorren las listas que ya existen');
  eq(auditarEstructura(conDatos()).listasNuevas, 0, '⚠️ ni una lista de colecciones nueva');
  eq(coleccionesDeEstilo().length, COLECCIONES_EH.length,
    '⚠️ se recorren las de la F41, no una copia');
  ok(coleccionesDeEstilo().every((c) => typeof c.leer === 'function'),
    'con la función que declaró cada fase para leerlas');
  eq(auditarEstructura(conDatos()).camposNuevos, 0, 'y ni un campo nuevo (apartado 15)');
  eq(auditarEstructura(conDatos()).almacenesNuevos, 0, 'ni un almacén');

  // Apartado 8 — todas se recuperan.
  eq(sinRecuperacion(), [], '⚠️ apartado 8 — todas las colecciones están en la papelera global');
  ok(coleccionesDeEstilo().every((c) => !!CATALOGO_PAPELERA[c.id]),
    'y cruzadas con `CATALOGO_PAPELERA`, no con una lista escrita a mano');
}

/* ---------------------------------------------------------------------------
   3 · LAS FECHAS (apartado 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Las fechas, todas AAAA-MM-DD');
  const e = conDatos();
  eq(revisarFechas(e), [], '⚠️ ni una fecha con otra forma en todo lo guardado');
  ok(CAMPOS_FECHA.includes('fecha') && CAMPOS_FECHA.includes('creadoEn'),
    'se miran los campos que de verdad son fechas');
  ok(FORMATO_FECHA.test('2026-03-02') && !FORMATO_FECHA.test('02/03/2026'),
    'y el formato es el del proyecto entero');

  /* ⚠️ La comprobación de la comprobación: con una fecha mala, salta. Sin esto,
     una auditoría con la expresión mal escrita daría siempre cero. */
  const roto = guardarConfig(e, 'gustos', {
    gustos: { entradas: [{ id: 'g1', nombre: 'X', creadoEn: '02/03/2026' }] },
  });
  const problemas = revisarFechas(roto);
  ok(problemas.some((p) => p.campo === 'creadoEn'), '⚠️ y con una fecha en otro formato, SALTA');
  ok(problemas[0].coleccion && problemas[0].id, 'diciendo en qué colección y en qué elemento');

  // `null` es una respuesta válida: "todavía no".
  const sinFecha = guardarConfig(e, 'gustos', {
    gustos: { entradas: [{ id: 'g2', nombre: 'Y', creadoEn: null }] },
  });
  eq(revisarFechas(sinFecha), [], '⚠️ pero `null` no es un error: es "todavía no"');
}

/* ---------------------------------------------------------------------------
   4 · LOS IDS (apartado 11 · pruebas 5, 6 y 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Identificadores estables');
  const e = conDatos();
  eq(revisarIds(e), [], '⚠️ ni un id repetido, ni uno que cambie al releer');
  eq(datosPerfumes(e).perfumes.length, 50, 'sobre los cincuenta perfumes del escenario medio');

  /* Prueba 6 — *"abrirlo desde otro dispositivo"*: normalizar dos veces es
     exactamente lo que hace el otro dispositivo al cargar. */
  const ida = datosPerfumes(e).perfumes.map((p) => p.id);
  const vuelta = datosPerfumes(normalizarEstiloHombre(JSON.parse(JSON.stringify(e)))).perfumes.map((p) => p.id);
  eq(ida, vuelta, '⚠️ prueba 6 — los ids son los mismos al abrirlo desde otro dispositivo');

  // Prueba 10 — sin duplicados.
  eq(ida.length, [...new Set(ida)].length, 'prueba 10 — y ninguno repetido');

  /* ⚠️ La comprobación de la comprobación, otra vez. */
  const repetidos = guardarConfig(e, 'gustos', {
    gustos: { entradas: [{ id: 'x', nombre: 'A' }, { id: 'x', nombre: 'B' }] },
  });
  ok(revisarIds(repetidos).some((p) => p.motivo === 'repetido'), '⚠️ con dos ids iguales, SALTA');
  /* 🐛 ⚠️ **Y esto es lo que la auditoría en crudo encuentra y la normalizada
     no**: un elemento GUARDADO sin id. Al leerlo, su normalizador le pone uno
     nuevo… **y otro distinto en el otro dispositivo**, que es exactamente el
     duplicado que el apartado 11 quiere evitar. Mirándolo normalizado no se ve
     nunca: es la lección de la F41, por tercera vez. */
  const sinId = guardarConfig(e, 'perfumes', { perfumes: { perfumes: [{ nombre: 'Sin id' }] } });
  ok(revisarIds(sinId).some((x) => x.motivo === 'sin id'),
    '⚠️ un elemento guardado SIN id salta: al releerlo le tocaría uno nuevo en cada dispositivo');
  eq(revisarIds(sinId).some((x) => x.coleccion === 'perfumes.perfumes'), true,
    'diciendo en qué colección está');
}

/* ---------------------------------------------------------------------------
   5 · LAS RELACIONES (apartado 7 · pruebas 7 y 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Relaciones, no copias');
  const e = conDatos();
  eq(revisarRelaciones(e), [], '⚠️ nada guarda una ficha entera donde debería haber un id');
  ok(CAMPOS_RELACION.includes('prendaId') && CAMPOS_RELACION.includes('objetivoId'),
    'se miran los campos que son relaciones de verdad');

  /* Prueba 7 — relacionar con otro módulo es guardar SU id. */
  const conObjetivo = anadirGusto(e, { nombre: 'Viajar a Japón', categoria: 'experiencia' }, { hoy: HOY });
  ok(!conObjetivo.error, 'prueba 7 — se puede crear algo que se relacione con otro módulo');

  /* ⚠️ Y la comprobación de la comprobación: con la ficha copiada, salta. */
  const copiado = guardarConfig(e, 'accesorios', {
    accesorios: {
      accesorios: [{
        id: 'a1', prendaId: 'p1', nota: 'x',
        // Alguien guardó la prenda entera en vez de su id.
        productoId: { id: 'prod1', nombre: 'Reloj', marca: 'X' },
      }],
    },
  });
  const problemas = revisarRelaciones(copiado);
  ok(problemas.some((p) => p.campo === 'productoId'),
    '⚠️ y si aparece la ficha entera donde debería ir un id, SALTA');
  ok(/su id/.test(problemas[0]?.motivo || ''), 'diciendo exactamente qué está mal');
}

/* ---------------------------------------------------------------------------
   6 · CREAR, EDITAR, BORRAR Y RECUPERAR (pruebas 1, 2, 3, 4 y 9)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · El ciclo completo de un registro');
  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, TODOS);
  const creado = anadirPerfume(e, { nombre: 'Uno', marca: 'M' }, { hoy: HOY });
  eq(creado.error, null, 'prueba 1 — crear registro');
  e = creado.estado;
  const id = datosPerfumes(e).perfumes[0].id;
  ok(!!id, 'con su id');

  const borrado = eliminarPerfume(e, id, { ahora: `${HOY}T10:00:00.000Z` });
  eq(datosPerfumes(borrado.estado).perfumes.length, 0, 'prueba 3 — eliminarlo');
  ok(!!borrado.entrada, 'y la papelera guarda su entrada');
  /* ⚠️ Apartado 8 — *"sin perder su estructura original"*: la entrada lleva el
     elemento entero, no solo su nombre. */
  eq(borrado.entrada.datos.nombre, 'Uno', '⚠️ apartado 8 — con el elemento ENTERO dentro');
  eq(borrado.entrada.idOriginal, id, 'y su id original, para que vuelva siendo el mismo');
  ok(Number.isInteger(borrado.entrada.indice), '⚠️ y hasta la posición que ocupaba: vuelve a su sitio, no al final');

  const vuelto = restaurarPerfume(borrado.estado, borrado.entrada);
  eq(datosPerfumes(vuelto.estado).perfumes.length, 1, 'prueba 4 — recuperarlo');
  eq(datosPerfumes(vuelto.estado).perfumes[0].id, id,
    '⚠️ y vuelve con el MISMO id: por eso no se duplica al sincronizar (prueba 5)');

  // Prueba 9 — los permisos.
  const seguridad = apartadoEstructura('seguridad');
  ok(/RLS|auth\.uid/.test(seguridad.donde), 'prueba 9 — los permisos son las políticas de la base de datos');
  ok(apartadoEstructura('usuario').donde.includes('user_id'), 'y todo cuelga del `user_id`');
}

/* ---------------------------------------------------------------------------
   7 · LO QUE NO SE CUMPLE, DICHO (apartado 12 · decisión 3)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Los conflictos: lo único que no se puede cumplir');
  const a = auditarEstructura(conDatos());
  eq(a.noCumplidos, ['conflictos'], '⚠️ uno solo de los dieciséis, y se dice cuál');
  eq(a.sinMotivo, [], '⚠️ y no se queda sin motivo');
  const c = apartadoEstructura('conflictos');
  ok(/sobrescribe sin leer/.test(c.donde), 'el motivo es el mismo que declaró la F41');
  ok(/esquema/.test(c.porque), 'y lo que haría falta para arreglarlo: tocar el esquema');
  ok(!!c.texto && c.texto === TEXTOS_ESTRUCTURA.conflicto,
    '⚠️ con su texto YA ESCRITO, para el día que se pueda enseñar');

  const panel = panelEstructura(conDatos());
  eq(panel.pendientes.length, 1, 'el panel lo saca aparte, para que se vea');
  eq(panel.apartados.length, 16, 'con los dieciséis dentro');
  ok(/un único lugar/.test(panel.regla), 'y la regla de la fase, con sus palabras');
  ok(/plaquitas simplemente muestran|plaquitas muestran/.test(panel.reparto),
    'y el reparto de la condición de finalización');
  eq(panel.colecciones.every((x) => x.recuperable), true, 'todas las colecciones se recuperan');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
