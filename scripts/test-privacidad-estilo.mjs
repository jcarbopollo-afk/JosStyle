// ============================================================================
// EH · Fase 43/65 — Seguridad, privacidad y control de datos
//
// Las trece pruebas del apartado 16, y lo que gobierna la fase:
//   · Estilo de hombre NO crea sistemas paralelos de contraseñas, papelera,
//     exportación, sincronización ni cuentas
//   · el aislamiento es de la base de datos (RLS), no de la pantalla
//   · ni un secreto en el cliente
//   · lo más privado no viaja: ni a la IA, ni a un aviso
//   · cerrar sesión invalida el acceso de verdad
//   · y lo que no existe (afiliación, analítica) se dice
// ============================================================================

import { readFileSync, existsSync } from 'node:fs';
import { REGISTRO_DATOS, datoDelRegistro } from '../src/lib/datosEstiloHombre.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { IDS_EH } from '../src/lib/estiloDeHombre.js';
import { contextoDePiel } from '../src/lib/perfilPiel.js';
import { DEFAULT_ESTILO_HOMBRE } from '../src/lib/estiloDeHombre.js';
import {
  SISTEMAS_CENTRALIZADOS, sistemaCentralizado, LIBRERIAS_EH, LO_QUE_GUARDA,
  CAMPOS_PRIVADOS, datosQueNoViajan, puedeSalirEnUnAviso, NO_EXISTE,
  TEXTOS_PRIVACIDAD, auditarDuplicados, OPERACIONES_RLS, revisarAislamiento,
  PATRONES_SECRETO, buscarSecretos, auditarPrivacidad, textosDePrivacidad,
  panelPrivacidad,
} from '../src/lib/privacidadEstilo.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const leer = (r) => readFileSync(new URL(r, import.meta.url), 'utf8');
const APP = leer('../src/App.jsx');
const SCHEMA = leer('../supabase/schema.sql');
const VISTA = leer('../src/views/EstiloHombreView.jsx');
const SUPABASE = leer('../src/lib/supabase.js');
const AI = leer('../src/lib/ai.js');

/** Las librerías de Estilo de hombre, leídas de verdad. */
const FUENTES = {};
LIBRERIAS_EH.forEach((nombre) => {
  const url = new URL(`../src/lib/${nombre}.js`, import.meta.url);
  if (existsSync(url)) FUENTES[nombre] = readFileSync(url, 'utf8');
});

console.log('\n🔒 EH · Fase 43/65 — Seguridad, privacidad y control de datos\n');

/* ---------------------------------------------------------------------------
   1 · NI UN SISTEMA PARALELO (condición de finalización)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Ni un sistema paralelo');
  eq(SISTEMAS_CENTRALIZADOS.map((s) => s.id),
    ['contrasenas', 'papelera', 'exportacion', 'sincronizacion', 'cuentas'],
    'los cinco sistemas que el enunciado prohíbe duplicar');
  ok(SISTEMAS_CENTRALIZADOS.every((s) => !!s.vive), 'y cada uno dice dónde vive de verdad');
  ok(SISTEMAS_CENTRALIZADOS.every((s) => s.prohibido instanceof RegExp),
    'con lo que NO puede aparecer en Estilo de hombre');
  ok(!!sistemaCentralizado('papelera') && !sistemaCentralizado('inventado'), 'se buscan por id');

  eq(Object.keys(FUENTES).length, LIBRERIAS_EH.length,
    'se leen las cuarenta y dos librerías de Estilo de hombre');
  eq(auditarDuplicados(FUENTES), [],
    '⚠️ y NINGUNA monta un sistema paralelo: ni PIN, ni papelera, ni exportación, ni guardado, ni cuentas');

  // ⚠️ La comprobación de la comprobación: con un archivo que sí lo hiciera, salta.
  const inventado = { falso: 'export const x = () => saveData(uid, "estiloHombre", {});' };
  ok(auditarDuplicados(inventado).some((p) => p.sistema === 'sincronizacion'),
    '⚠️ y cazaría una librería que guardase por su cuenta');
  ok(auditarDuplicados({ f: 'const h = crearPinHash(x);' }).some((p) => p.sistema === 'contrasenas'),
    'o que se montase su propio PIN');
  ok(auditarDuplicados({ f: 'exportCSV(filas);' }).some((p) => p.sistema === 'exportacion'),
    'o su propia exportación');

  // Y todas las colecciones de Estilo de hombre están en la papelera GLOBAL.
  const enPapelera = Object.keys(CATALOGO_PAPELERA).filter((k) => IDS_EH.includes(CATALOGO_PAPELERA[k].modulo));
  ok(enPapelera.length >= 10, '⚠️ y sus colecciones están en la papelera global (apartados 6 y 7)');
}

/* ---------------------------------------------------------------------------
   2 · EL AISLAMIENTO ES DE LA BASE DE DATOS (apartados 1, 2 y 10 · prueba 5)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · El aislamiento es de la base de datos, no de la pantalla');
  const a = revisarAislamiento(SCHEMA);
  eq(a.rlsActivada, true, '⚠️ `app_data` tiene la seguridad por filas activada');
  eq(a.faltan, [], '⚠️ y las CUATRO operaciones están atadas a `auth.uid() = user_id`');
  eq(a.permisivas, false,
    '⚠️ y ninguna política es del tipo permisivo `auth.uid() IS NOT NULL`');
  eq(a.aislado, true, '⚠️ un usuario NO puede leer ni tocar la fila de otro');
  eq(OPERACIONES_RLS, ['select', 'insert', 'update', 'delete'], 'se comprueban las cuatro');

  // 🐛 Y la lección: el propio schema explica en un comentario que no hay
  // políticas permisivas, y buscar la frase en el archivo entero saltaba con ella.
  ok(revisarAislamiento(SCHEMA.replace(/--.*$/gm, '')).aislado,
    '⚠️ y sin los comentarios da lo mismo: se comprueba el SQL, no la prosa (11.ª vez)');
  ok(!revisarAislamiento('create policy "x" on app_data for select using (auth.uid() IS NOT NULL);').aislado,
    '⚠️ y una política permisiva DE VERDAD sí la caza');
  ok(!revisarAislamiento('').aislado, 'y sin esquema no se da nada por bueno');

  // Apartado 2 — los datos van con la cuenta, no con el aparato.
  ok(/\.eq\('user_id', userId\)/.test(SUPABASE), 'leer filtra por el usuario');
  ok(/upsert\(\{ user_id: userId/.test(SUPABASE), 'y guardar escribe su id');
  ok(/onConflict: 'user_id,key'/.test(SUPABASE), 'una fila por usuario y clave');
  ok(/loadData\(uidUser, 'estiloHombre'/.test(APP),
    '⚠️ y Estilo de hombre se carga con el id del usuario, como todo lo demás');
}

/* ---------------------------------------------------------------------------
   3 · CERRAR SESIÓN INVALIDA EL ACCESO (apartados 3 y 15 · pruebas 2, 3, 4 y 13)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Cerrar sesión invalida el acceso');
  ok(/if \(!session\) return <Auth \/>;/.test(APP),
    'sin sesión no se pinta nada de la aplicación');
  // 🚨 El fallo que encontró esta fase.
  ok(/setLoaded\(false\);/.test(APP),
    '⚠️ al cambiar de sesión la pantalla vuelve a "cargando"…');
  ok(/\}, \[session\?\.user\?\.id\]\);/.test(APP),
    '⚠️ …y va por el ID DEL USUARIO, no por el objeto `session` (que Supabase renueva solo)');
  ok(/setEstiloHombre\(DEFAULT_ESTILO_HOMBRE\);[\s\S]{0,200}setRelacion\(DEFAULT_RELACION\)/.test(APP),
    '⚠️ y al cerrar sesión lo más privado sale de memoria');
  ok(/if \(!loaded\) return <LoadingScreen \/>;/.test(APP),
    'así que el siguiente usuario ve la pantalla de carga, no los datos del anterior');

  const auditoria = auditarPrivacidad({ fuentes: FUENTES, schemaSql: SCHEMA, app: APP });
  eq(auditoria.reinicioDeSesion, true, '⚠️ y la auditoría lo comprueba sobre el código');
}

/* ---------------------------------------------------------------------------
   4 · NI UN SECRETO EN EL CLIENTE (apartado 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Ni un secreto en el cliente');
  eq(buscarSecretos(FUENTES), [], '⚠️ ninguna librería de Estilo de hombre lleva una clave');
  eq(buscarSecretos({ app: APP, supabase: SUPABASE, ai: AI }), [],
    '⚠️ ni `App.jsx`, ni el cliente de Supabase, ni el de la IA');
  ok(PATRONES_SECRETO.length >= 4, 'hay varios patrones que buscar');
  /* ⚠️ Con la forma REAL de una clave de Anthropic. El primer patrón solo
     aceptaba letras y números después de `sk-`, así que se quedaba en "sk-ant" y
     **no habría reconocido la clave que busca**. */
  ok(buscarSecretos({ f: 'const k = "sk-ant-api03-AbCdEf0123456789xyz";' }).length > 0,
    '⚠️ y una clave de Anthropic escrita a mano SÍ la caza');
  ok(buscarSecretos({ f: 'const k = "sk-0123456789abcdef0123";' }).length > 0,
    'y una de otra forma también');
  eq(buscarSecretos({ f: 'const nota = "sk-corto";' }), [],
    'y algo que solo se le parece, no');
  ok(buscarSecretos({ f: 'const k = process.env.SUPABASE_SERVICE_ROLE;' }).length > 0,
    'igual que una clave de servicio');

  // Y la IA va por el proxy, no con una clave del navegador.
  ok(/fetch\('\/api\/ask-ai'/.test(AI),
    '⚠️ la IA se llama por la función de Vercel, no desde el navegador con una clave');
  ok(!/anthropic\.com/i.test(AI), 'y el navegador no habla con Anthropic directamente');
}

/* ---------------------------------------------------------------------------
   5 · LO MÁS PRIVADO NO VIAJA (apartados 5 y 11)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Lo más privado no viaja');
  ok(CAMPOS_PRIVADOS.length > 0, 'hay campos declarados como privados');
  ok(CAMPOS_PRIVADOS.every((id) => !!datoDelRegistro(id)),
    'y todos existen en el registro de la F4');
  eq(datosQueNoViajan().map((d) => d.id), CAMPOS_PRIVADOS, 'la lista se lee entera');

  /* ⚠️ Y el módulo sigue marcando su perfil como privado (F13, apartado 17).
     Es `contextoDePiel` —el que se pasaría a otro sitio— quien lo lleva escrito,
     no `perfilPiel`, que es el avance del cuestionario. */
  const contexto = contextoDePiel(DEFAULT_ESTILO_HOMBRE);
  eq(contexto.paraIA, false, '⚠️ el contexto de piel sigue diciendo que NO va a la IA');
  eq(contexto.privado, true, 'y que es privado');

  eq(puedeSalirEnUnAviso('tipoPiel').puede, false,
    '⚠️ el tipo de piel NO puede salir en una notificación (apartado 5)');
  ok(!!puedeSalirEnUnAviso('tipoPiel').porque, 'y se dice por qué');
  eq(puedeSalirEnUnAviso('tallaCamiseta').puede, true, 'una talla sí puede');
  eq(puedeSalirEnUnAviso('inventado').puede, false, 'y lo que no está en el registro, no');

  // ⚠️ La decisión de la F34: `estiloHombre` va APARTE de `currentState`.
  ok(/const paraExportar = \{ \.\.\.currentState, estiloHombre \};/.test(APP),
    '⚠️ y `estiloHombre` va aparte de `currentState`, que es lo que se manda a la IA (F34)');
}

/* ---------------------------------------------------------------------------
   6 · LO QUE NO EXISTE, DICHO (apartados 11 y 12)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Lo que no existe');
  eq(NO_EXISTE.map((x) => x.id), ['afiliacion', 'analitica'],
    '⚠️ no hay afiliación ni analítica');
  ok(NO_EXISTE.every((x) => typeof x.porque === 'string' && x.porque.length > 30),
    'y cada una lo explica en una frase entera');
  // Y de verdad no las hay.
  eq(buscarSecretos({ app: APP }).length, 0, 'ni una clave de terceros');
  ok(!/gtag|analytics|mixpanel|posthog|plausible/i.test(APP),
    '⚠️ y en `App.jsx` no hay ni una línea de analítica');
}

/* ---------------------------------------------------------------------------
   7 · LA AUDITORÍA Y LA PANTALLA
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · La auditoría y la pantalla');
  const a = auditarPrivacidad({ fuentes: FUENTES, schemaSql: SCHEMA, app: APP });
  eq(a.duplicados, [], 'sin duplicados');
  eq(a.secretos, [], 'sin secretos');
  eq(a.aislamiento.aislado, true, 'con el aislamiento en pie');
  eq(a.noViajan, CAMPOS_PRIVADOS, 'y con lo que no viaja');
  eq(a.catalogoVacio, true, 'y el catálogo de productos sigue vacío a propósito (D2-03)');

  const p = panelPrivacidad();
  eq(p.titulo, TEXTOS_PRIVACIDAD.titulo, 'el panel trae su título');
  eq(p.guarda.length, LO_QUE_GUARDA.length, 'y lo que se guarda');
  eq(p.sistemas.length, 5, 'y dónde vive cada sistema');
  ok(p.avisos.length >= 6, 'y las frases sobre qué pasa con sus datos');
  ok(p.noExiste.length === 2, 'y lo que no existe');

  const textos = textosDePrivacidad();
  ok(textos.every((t) => typeof t === 'string' && t.length > 0), 'ningún texto vacío');
  ok(!textos.some((t) => /fase \d|apartado \d|RLS|auth\.uid/i.test(t)),
    '⚠️ y ninguno habla en técnico: son frases para Josué (regla 9)');
  ok(/no se puede deshacer/i.test(TEXTOS_PRIVACIDAD.definitivo),
    'y el borrado definitivo lo dice con esas palabras (apartado 8)');

  ok(/export function PrivacidadEH/.test(VISTA), 'la pantalla existe');
  ok(/import \{ TEXTOS_PRIVACIDAD, panelPrivacidad \} from '\.\.\/lib\/privacidadEstilo'/.test(VISTA),
    '⚠️ y la vista IMPORTA la librería (la lección de la F15)');
  ok(/onPrivacidad/.test(VISTA), 'y se entra desde ⋮ Personalizar');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
