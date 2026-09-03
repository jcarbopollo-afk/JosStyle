// ============================================================================
// EH · Fase 63/65 — Seguridad, privacidad y control de datos
//
// *"Privacidad por diseño. No añadir seguridad al final."*
//
// Lo que vigila esta prueba:
//   · 🚨 que el hallazgo del endpoint sin autenticación NO se dé por resuelto
//   · que el aislamiento sea de la base de datos, no de la pantalla
//   · que borrar lo que la IA dedujo no toque un solo dato suyo
//   · y que las cinco formas de atacar tengan su respuesta, o su motivo
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { CAMPOS_PRIVADOS as PRIVADOS_F43, LO_QUE_GUARDA as GUARDA_F43 } from '../src/lib/privacidadEstilo.js';
import { GRAVEDADES as GRAVEDADES_F47 } from '../src/lib/pruebasIntegrales.js';
import { CAMPOS_PROHIBIDOS as PROHIBIDOS_F54 } from '../src/lib/recuperacion.js';
import {
  INVENTARIO, SENSIBLES, PROTECCION_EXTRA, REGLA_INVENTARIO,
  POLITICAS, revisarAislamiento, AUDITORIA_DE_ACCESO,
  ENDPOINT_IA, LIMITES_ENTRADA, HALLAZGO_ENDPOINT,
  CONTRA_INYECCIONES, revisarInyecciones,
  separacionDeDatos,
  FORMAS_DE_QUITAR, formaDeQuitar,
  REGISTROS, DATOS_LOCALES, SECRETOS_LOCALES,
  BORRADO_DE_CUENTA, COPIAS,
  ATAQUES, ataque, ataquesQueNoSeParan,
  APARTADOS_SEGURIDAD, apartadoSeguridad, CONDICION,
  auditarSeguridad, panelSeguridad,
  CAMPOS_PRIVADOS, GRAVEDADES, CAMPOS_PROHIBIDOS, LO_QUE_GUARDA,
} from '../src/lib/seguridadEH.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const lee = (f) => readFileSync(join(RAIZ, f), 'utf8');
const SQL = lee('supabase/schema.sql');
const API = lee('api/ask-ai.js');
const VISTA = lee('src/views/EstiloHombreView.jsx');
const SUPA = lee('src/lib/supabase.js');
const opciones = { sql: SQL, api: API, fuentes: { vista: VISTA, supabase: SUPA } };

console.log('\n🔒 EH · Fase 63/65 — Seguridad, privacidad y control de datos\n');

/* ---------------------------------------------------------------------------
   1 · 🚨 EL HALLAZGO: EL ENDPOINT NO PIDE QUIÉN ERES (apartado 14)
   --------------------------------------------------------------------------- */
{
  console.log('1 · El endpoint de la IA');
  eq(ENDPOINT_IA.autenticacion, false,
    '🚨 `/api/ask-ai` NO tiene autenticación: cualquiera con la URL puede llamarlo');
  eq(ENDPOINT_IA.limiteDeUso, false, '🚨 ni límite de uso');
  eq(auditarSeguridad(opciones).ataquesQueNoSeParan, ['endpoint_sin_auth'],
    '🚨 ⚠️ y es el único de los cinco ataques que NO se para');
  eq(auditarSeguridad(opciones).sinCumplir, [14],
    '🚨 el apartado 14 se queda SIN CUMPLIR: contarlo como verde sería el error de esta fase entera');

  ok(/gastar el dinero/.test(HALLAZGO_ENDPOINT.que), 'con lo que de verdad pasa: se paga');
  ok(/no se puede leer nada/.test(HALLAZGO_ENDPOINT.noEs),
    '⚠️ y lo que NO es: no es una fuga de datos');
  eq(HALLAZGO_ENDPOINT.esUna, 'Una factura.', 'es una factura');
  ok(/Authorization/.test(HALLAZGO_ENDPOINT.arreglo), '⚠️ con el arreglo escrito: el token de Supabase');
  ok(/seis módulos|toda la aplicación/.test(HALLAZGO_ENDPOINT.porQueNoSeHaceAqui),
    '🚨 y por qué NO se arregla desde una fase de Estilo de hombre: lo usan otros seis módulos');
  ok(!!gravedadValida(HALLAZGO_ENDPOINT.gravedad), 'con una gravedad de las de la F47');
  ok(GRAVEDADES === GRAVEDADES_F47, 'importadas');
}

/* ---------------------------------------------------------------------------
   2 · LO QUE SÍ SE HA ARREGLADO (apartado 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Validar lo que manda el cliente');
  eq(ENDPOINT_IA.validaEntradas, true, 'el endpoint ya valida las entradas…');
  eq(auditarSeguridad(opciones).endpointValida, true, '…y se comprueba leyendo `api/ask-ai.js`');
  ok(/LIMITE_PROMPT/.test(API), 'con su límite de texto');
  ok(/LIMITE_IMAGENES/.test(API), 'y de imágenes');
  ok(/demasiado larga/.test(API), 'y un mensaje que se entiende, no un 500');
  ok(LIMITES_ENTRADA.prompt >= 20000,
    `⚠️ holgado (${LIMITES_ENTRADA.prompt}): no cambia nada para Josué y pone un techo`);
  ok(/No cambian nada/i.test(LIMITES_ENTRADA.porque), 'y se dice por qué es holgado');
  ok(/ANTHROPIC_API_KEY/.test(API) && !/VITE_ANTHROPIC/.test(API),
    '⚠️ y la clave sigue siendo de servidor, sin prefijo VITE_ (F52)');
  eq(ENDPOINT_IA.ocultaLaClave, true, 'el navegador nunca la ve');
}

/* ---------------------------------------------------------------------------
   3 · EL AISLAMIENTO ES DE LA BASE DE DATOS (apartados 3, 5 y 19)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Quién puede leer qué');
  const r = revisarAislamiento(SQL);
  eq(r.rlsActivado, true, '🚨 RLS activado en `app_data`, comprobado sobre el schema.sql');
  eq(r.politicas.length, 4, 'las cuatro políticas, una por operación');
  eq(r.politicas, POLITICAS, 'con sus nombres');
  eq(r.permisivas, false,
    '🚨 ⚠️ y NINGUNA del tipo permisivo `auth.uid() IS NOT NULL`, que dejaría leer a cualquiera');
  eq(r.cascada, true, 'y la cascada al borrar la cuenta');
  eq(revisarAislamiento('').rlsActivado, false, 'sin esquema, no se da nada por hecho');

  eq(AUDITORIA_DE_ACCESO.length, 4, 'apartado 19 — quién puede leer, crear, modificar y eliminar');
  ok(AUDITORIA_DE_ACCESO.every((a) => /RLS/.test(a.lo_impone)),
    '⚠️ y las cuatro lo imponen en la BASE DE DATOS, no en la pantalla');
}

/* ---------------------------------------------------------------------------
   4 · LAS ENTRADAS DEL USUARIO (apartado 16)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Inyecciones');
  eq(revisarInyecciones({ vista: VISTA, supabase: SUPA }), [],
    '🚨 ni un `dangerouslySetInnerHTML` ni una consulta construida a mano');
  eq(CONTRA_INYECCIONES.length, 3, 'los tres riesgos: HTML, SQL e IA');
  ok(revisarInyecciones({ malo: '<div dangerouslySetInnerHTML={{__html: x}} />' }).length === 1,
    '⚠️ el detector caza el caso');
  ok(/React escapa/.test(CONTRA_INYECCIONES[0].lo_para), 'el HTML lo para React');
  ok(/valores aparte/.test(CONTRA_INYECCIONES[1].lo_para), 'y el SQL, el cliente de Supabase');
  eq(CONTRA_INYECCIONES[2].comprobable, false,
    '⚠️ y el tercero se responde con honestidad, no con una comprobación falsa');
  ok(/no le hace daño a nadie/.test(CONTRA_INYECCIONES[2].lo_para),
    '🚨 la IA solo le contesta a él: darse instrucciones a sí mismo no es un ataque');
}

/* ---------------------------------------------------------------------------
   5 · LO INFERIDO Y LO SUYO (apartado 7)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Separar lo deducido de lo suyo');
  eq(auditarSeguridad(opciones).borrarInferidoDejaLoSuyo, true,
    '🚨 borrar lo que la IA dedujo NO toca sus datos');
  const s = separacionDeDatos({});
  eq(s.modulosAntes, s.modulosDespues, 'los módulos siguen enteros');
  eq(s.deLaFase, 'F57', '⚠️ y esto ya lo hizo la F57: aquí se comprueba, no se rehace');
  eq(INVENTARIO.filter((x) => x.esInferido).length, 1,
    '⚠️ y lo inferido está en el inventario MARCADO como inferido, separado de lo suyo');
  eq(SENSIBLES, PRIVADOS_F43, 'los datos sensibles son los de la F43');
  eq(CAMPOS_PRIVADOS, PRIVADOS_F43, 'importados');
  ok(/ni con el interruptor/.test(PROTECCION_EXTRA.como),
    '🚨 apartado 2 — y su protección extra: no salen ni con el permiso de la IA encendido');
  ok(LO_QUE_GUARDA === GUARDA_F43, 'y el inventario parte del de la F43');
  ok(/porque sea posible/.test(REGLA_INVENTARIO), 'con la regla del apartado 1');
  ok(INVENTARIO.length > GUARDA_F43.length, 'más lo que las fases nuevas añadieron');
}

/* ---------------------------------------------------------------------------
   6 · LAS TRES FORMAS DE QUITAR (apartados 8 y 9)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Ocultar, eliminar y eliminar del todo');
  eq(FORMAS_DE_QUITAR.map((f) => f.id), ['ocultar', 'temporal', 'definitivo'],
    'las tres, distintas de verdad');
  eq(formaDeQuitar('ocultar').borra, false, 'ocultar no borra…');
  eq(formaDeQuitar('temporal').borra, false, '…eliminar tampoco: va a la papelera…');
  eq(formaDeQuitar('definitivo').borra, true, '…y solo la tercera borra');
  eq(FORMAS_DE_QUITAR.filter((f) => f.confirma).map((f) => f.id), ['definitivo'],
    '🚨 apartado 9 — solo la irreversible pide confirmación');
  eq(formaDeQuitar('definitivo').porGesto, false,
    '🚨 ⚠️ y NO se hace con un gesto: el apartado 9 lo prohíbe expresamente, y no hay gestos (F61)');
  ok(!formaDeQuitar('inventada'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   7 · REGISTROS, DATOS LOCALES, CUENTA Y COPIAS (12, 13, 17 y 18)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Registros, dispositivo, cuenta y copias');
  eq(REGISTROS.queNo, PROHIBIDOS_F54, 'apartado 13 — lo que un registro nunca lleva (F54)');
  eq(CAMPOS_PROHIBIDOS, PROHIBIDOS_F54, 'importado');
  ok(/cuántos elementos/.test(REGISTROS.queSeApunta), 'y lo que sí: qué, cuándo y cuántos');

  eq(SECRETOS_LOCALES(), ['sesion'],
    '⚠️ apartado 12 — lo único con valor guardado en el dispositivo es el token de sesión…');
  ok(/librería de Supabase/.test(DATOS_LOCALES.find((d) => d.id === 'sesion').porque),
    '…que lo pone Supabase y caduca, no Estilo de hombre');
  ok(/ninguna librería de Estilo de hombre toca/.test(DATOS_LOCALES.find((d) => d.id === 'estiloHombre').porque),
    '🚨 y Estilo de hombre no guarda NADA en el dispositivo, comprobado por la F43');

  ok(/on delete cascade/.test(BORRADO_DE_CUENTA.arrastra),
    '🚨 apartado 17 — al borrar la cuenta se van todas sus filas, por la cascada');
  eq(BORRADO_DE_CUENTA.huerfano, 'Nada. Ni una fila queda sin dueño.', 'sin información huérfana');
  ok(/Storage/.test(BORRADO_DE_CUENTA.loQueFalta),
    '⚠️ y lo que la cascada NO se lleva —los archivos de Storage— se dice, aunque no sea de aquí');
  ok(/mismo objeto/.test(COPIAS.seguridad),
    'apartado 18 — la copia no abre una segunda puerta: es el mismo objeto del mismo usuario');
}

/* ---------------------------------------------------------------------------
   8 · LA PRUEBA FINAL Y EL VEREDICTO (apartado 20)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Los cinco ataques');
  eq(ATAQUES.length, 5, 'los cinco que el apartado 20 nombra');
  ok(ATAQUES.every((a) => !!a.loPara), '⚠️ y cada uno dice QUÉ lo para');
  ok(ATAQUES.filter((a) => !a.seProbaraAqui).every((a) => !!a.porque),
    'los que no se pueden intentar desde aquí dicen por qué');
  ok(/cero filas, no un error/.test(ataque('leer_de_otro').loPara),
    '⚠️ leer los datos de otro devuelve cero filas: la política, no un mensaje');
  ok(/no manda `user_id`/.test(ataque('cambiar_id').loPara),
    '🚨 y el cliente ni siquiera manda el `user_id`: lo pone la sesión');
  eq(ataque('datos_invalidos').pasa, true, 'los datos inválidos se paran');
  eq(ataque('endpoint_sin_auth').pasa, false, '🚨 y el del endpoint NO, y así queda escrito');
  ok(!ataque('inventado'), 'se buscan por id');

  eq(APARTADOS_SEGURIDAD.length, 20, 'los veinte apartados');
  eq(auditarSeguridad(opciones).sinDonde, [], 'todos dicen dónde se contestan');
  ok(/HALLAZGO_ENDPOINT/.test(apartadoSeguridad(14).donde), 'y el 14 remite al hallazgo');
  ok(!apartadoSeguridad(99), 'se buscan por id');

  const panel = panelSeguridad(opciones);
  eq(panel.protegido, true,
    '🎯 los datos están protegidos donde importa: en la base de datos');
  eq(panel.pendienteDeJosue.id, 'endpoint_sin_auth',
    '🚨 ⚠️ y lo que falta va en el panel como PENDIENTE DE JOSUÉ, no escondido');
  ok(/no se añade al final/.test(panel.condicion), 'con la condición de finalización');
}

function gravedadValida(id) { return GRAVEDADES.some((g) => g.id === id); }

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
