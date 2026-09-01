// ============================================================================
// EH · Fase 52/65 — Preparación para producción
//
// *"Si algo sale mal, tenemos una forma segura de volver atrás."*
//
// Lo que vigila esta prueba:
//   · que la clave de la IA NO viaje al navegador, ni aquí ni en `src/`
//   · que el `schema.sql` diga de verdad lo que esta fase declara que dice
//   · que Estilo de hombre escriba en SU clave y en ninguna otra (apartado 6)
//   · y que lo que no existe —el entorno de pruebas, la monitorización— esté
//     dicho con su riesgo, en vez de dado por hecho
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { GRAVEDADES as GRAVEDADES_F47 } from '../src/lib/pruebasIntegrales.js';
import { MIGRACIONES as MIGRACIONES_F46, VERSION_ACTUAL } from '../src/lib/migracion.js';
import { estadoEH } from '../src/lib/estadosEstilo.js';
import {
  ENTORNOS, entorno, entornosQueFaltan,
  VARIABLES, variable, secretasExpuestas, variablesDeServidorEnElNavegador,
  SIN_SQL_NUEVO, REVISION_BASE_DE_DATOS, revisionBD, revisarEsquema,
  CLAVE_DE_ESTILO, DATOS_QUE_NO_SE_TOCAN, escrituraFueraDeSuClave,
  PRUEBAS_DE_PRODUCCION, pruebaDeProduccion,
  MONITORIZACION,
  CAIDAS, caida, caidasSinAviso,
  DESPLIEGUE_GRADUAL, PLAN_DE_VUELTA_ATRAS,
  CHECKLIST_PUBLICACION, lineaChecklist, checklistAutomatico, checklistDeJosue,
  DESPUES_DE_PUBLICAR, REACCION_ANTE_ERROR, BACKLOG, TEXTOS_PRODUCCION,
  auditarProduccion, panelProduccion, GRAVEDADES, MIGRACIONES,
} from '../src/lib/produccion.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const lee = (f) => readFileSync(join(RAIZ, f), 'utf8');
const SQL = lee('supabase/schema.sql');
const SUPA = lee('src/lib/supabase.js');
const API = lee('api/ask-ai.js');
const VISTA = lee('src/views/EstiloHombreView.jsx');
const APP = lee('src/App.jsx');
const ENVEJ = lee('.env.example');

console.log('\n🚀 EH · Fase 52/65 — Preparación para producción\n');

/* ---------------------------------------------------------------------------
   1 · LOS ENTORNOS QUE HAY DE VERDAD (apartado 1)
   --------------------------------------------------------------------------- */
{
  console.log('1 · Los entornos');
  eq(ENTORNOS.map((e) => e.id), ['desarrollo', 'pruebas', 'produccion'], 'los tres del enunciado');
  eq(entornosQueFaltan().map((e) => e.id), ['pruebas'],
    '🚨 ⚠️ y el de PRUEBAS no existe: se dice, no se inventa');
  ok(/mismo|misma base/i.test(entorno('pruebas').porque),
    '⚠️ con el motivo exacto: las vistas previas de Vercel apuntan a la MISMA base de datos');
  ok(/copia/i.test(entorno('pruebas').riesgo),
    '⚠️ y con lo que lo sustituye: la copia de seguridad de la F46');
  eq(auditarProduccion().sinRiesgo, [],
    '🚨 ningún entorno que falte se queda sin decir el riesgo que deja');
  ok(/simulador|test-app-real/.test(entorno('desarrollo').aviso),
    '⚠️ y desarrollo avisa de que escribe en los datos de verdad');
  ok(!entorno('inventado'), 'los entornos se buscan por id');
  ok(/No hay entorno de pruebas/.test(TEXTOS_PRODUCCION.sinEntornoDePruebas), 'con su frase');
}

/* ---------------------------------------------------------------------------
   2 · LOS SECRETOS (apartado 2)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Variables y secretos');
  eq(secretasExpuestas(), [], '🚨 ninguna variable secreta lleva prefijo VITE_');
  eq(variable('ANTHROPIC_API_KEY').donde, 'servidor', 'la clave de la IA es de servidor');
  ok(!variable('ANTHROPIC_API_KEY').prefijoVite, '⚠️ y NO lleva prefijo VITE_: se publicaría entera');
  ok(variable('VITE_SUPABASE_ANON_KEY').secreta === false,
    '⚠️ y la anon key NO es un secreto: lo que protege los datos es RLS');
  ok(/RLS|políticas/.test(variable('VITE_SUPABASE_ANON_KEY').porque), 'y se dice por qué');

  /* 🚨 La comprobación de verdad: contra el código que se descarga el navegador. */
  eq(variablesDeServidorEnElNavegador({ 'EstiloHombreView.jsx': VISTA, 'App.jsx': APP, 'supabase.js': SUPA }), [],
    '🚨 ⚠️ y ninguna variable de servidor aparece en `src/`, que es lo que se descarga el navegador');
  ok(/ANTHROPIC_API_KEY/.test(API), 'la clave solo se nombra en `api/ask-ai.js`…');
  ok(/process\.env\.ANTHROPIC_API_KEY/.test(API), '…y se lee de `process.env`, que en el servidor');
  ok(/NUNCA la pongas con prefijo VITE_/.test(ENVEJ), 'y `.env.example` lo deja escrito');

  /* La comprobación de la comprobación. */
  eq(variablesDeServidorEnElNavegador({ malo: 'const k = ANTHROPIC_API_KEY;' }).length, 1,
    '⚠️ y el detector caza el caso: si apareciera en `src/`, salta');
}

/* ---------------------------------------------------------------------------
   3 · LA BASE DE DATOS (apartado 3)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · La base de datos, contra el `schema.sql` de verdad');
  eq(SIN_SQL_NUEVO, true, '⚠️ Estilo de hombre no añade ni una línea de SQL en 65 fases');
  eq(revisarEsquema(SQL).filter((r) => !r.encontrado).map((r) => r.id), [],
    '🚨 y las seis cosas que esta fase declara están DE VERDAD en `supabase/schema.sql`');
  eq(REVISION_BASE_DE_DATOS.length, 7, 'los siete puntos del apartado 3');
  eq(revisionBD('politicas').estado, 'ok', 'las cuatro políticas, una por operación');
  ok(/auth\.uid\(\) = user_id/.test(SQL), '⚠️ todas con `auth.uid() = user_id`, ninguna permisiva');
  /* ⚠️ Sin los comentarios: el archivo EXPLICA por qué no usa el tipo permisivo,
     y esa explicación lo nombra. Buscarlo en el texto entero cazaría la nota que
     dice que no se usa — la misma confusión que la F48 arregló tres veces. */
  const SOLO_SQL = SQL.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  ok(!/auth\.uid\(\) IS NOT NULL/i.test(SOLO_SQL), '⚠️ y ni una del tipo que el proyecto prohíbe');
  eq(revisionBD('version_esquema').estado, 'parcial',
    '⚠️ el versionado del esquema es PARCIAL, y se dice: el de datos existe, el de la base no');
  ok(/if not exists/.test(revisionBD('version_esquema').aviso),
    '⚠️ con el aviso que muerde de verdad: los `create policy` no lo llevan');
  /* Y eso es cierto en el archivo, no una suposición. */
  ok(!/create policy if not exists/i.test(SQL),
    '🐛 comprobado en el archivo: volver a ejecutarlo entero daría error de política duplicada');
  ok(/primary key \(user_id, key\)/.test(SQL), 'y el índice que hace falta es la clave primaria');
  ok(!revisionBD('inventado'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   4 · NADA DE LO QUE YA HABÍA DESAPARECE (apartados 4, 5 y 6)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Lo que ya tenía Josué');
  eq(DATOS_QUE_NO_SE_TOCAN.length, 7, 'las siete cosas que el apartado 6 enumera');
  eq(CLAVE_DE_ESTILO, 'estiloHombre', 'Estilo de hombre vive en una sola clave');
  eq(escrituraFueraDeSuClave({ 'EstiloHombreView.jsx': VISTA }), [],
    '🚨 ⚠️ y la vista no escribe en la clave de ningún otro módulo (regla 5)');
  eq(escrituraFueraDeSuClave({ malo: "saveData(uid, 'armario', x)" }).length, 1,
    '⚠️ el detector caza el caso: escribir en `armario` desde aquí sería perder el armario entero');

  eq(MIGRACIONES, MIGRACIONES_F46, '⚠️ las migraciones son las de la F46, importadas');
  ok(MIGRACIONES.length >= 1, `con la que existe (v1 → v${VERSION_ACTUAL})`);
  ok(auditarProduccion().migraciones === MIGRACIONES_F46.length, 'y el parte las cuenta de allí');
}

/* ---------------------------------------------------------------------------
   5 · LO QUE SOLO PUEDE HACER ÉL (apartados 7 a 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Las cuatro que necesitan su cuenta y su móvil');
  eq(PRUEBAS_DE_PRODUCCION.map((p) => p.apartado), [7, 8, 9, 10], 'los cuatro apartados');
  ok(PRUEBAS_DE_PRODUCCION.every((p) => p.como === 'josue'), 'las cuatro son suyas');
  eq(auditarProduccion().sinMotivo, [], '⚠️ y ninguna se queda sin decir por qué');
  ok(/iPhone en el metro|metro/.test(pruebaDeProduccion('movil').porque),
    '⚠️ con el motivo de verdad: un navegador de escritorio sin conexión no es un iPhone en el metro');
  ok(pruebaDeProduccion('cuenta_nueva').cerca === 'test-app-real.mjs',
    'y cada una dice qué es lo más cerca que se puede llegar sin ella');
  ok(!pruebaDeProduccion('inventada'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   6 · MONITORIZACIÓN (apartado 11)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Monitorización');
  eq(MONITORIZACION.existe, false, '⚠️ el "si JC Fitness dispone" tiene respuesta, y es NO');
  ok(/consola|Vercel/.test(MONITORIZACION.hay), 'con lo que sí hay, dicho');
  ok(/se decide, no se cuela|se decide/.test(MONITORIZACION.porque),
    '⚠️ y por qué no se añade una en la última fase antes de publicar');
  ok(/ni nombres|ni fotos/.test(MONITORIZACION.regla),
    '⚠️ con la regla lista para el día que se añada: nada privado');
  eq(MONITORIZACION.seDecide, 'Josué', 'y quién lo decide');
}

/* ---------------------------------------------------------------------------
   7 · CUANDO ALGO SE CAE (apartado 12) — el hallazgo de la fase
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · Recuperación');
  eq(CAIDAS.length, 4, 'las cuatro caídas que el enunciado simula');
  ok(CAIDAS.every((c) => c.puedeSeguir), '✅ en las cuatro el usuario puede seguir usando la aplicación');
  ok(CAIDAS.every((c) => !!estadoEH(c.estado)), '⚠️ y cada una apunta a un estado que EXISTE (F41)');

  /* 🚨 El fallo de esta fase, con lo que se arregló y lo que no. */
  ok(/no devolvía nada|se tragaba/.test(caida('fallo_guardado').hoy),
    '🚨 guardar podía fallar y no se enteraba nadie');
  ok(/\{ ok, error \}/.test(SUPA),
    '🚨 ⚠️ ARREGLADO A MEDIAS: `saveData` ya DEVUELVE el resultado…');
  ok(/return \{ ok: !error/.test(SUPA), 'con `{ ok, error }`, sin lanzar, sin romper a quien la llama');
  eq(caida('fallo_guardado').avisa, false,
    '⚠️ …pero el aviso todavía no se enciende, y por eso NO se marca como resuelto');
  eq(estadoEH('error_guardado').detectable, false,
    '⚠️ y `error_guardado` sigue con `detectable: false`: fingirlo sería la regla 8');
  ok(caidasSinAviso().length === 3,
    `⚠️ ${caidasSinAviso().length} caídas siguen sin aviso en pantalla, y se dicen en vez de disimularse`);
  ok(!caida('inventada'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   8 · PUBLICAR Y SABER VOLVER (apartados 13, 14 y 15)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · El plan de vuelta atrás y la lista de publicación');
  eq(PLAN_DE_VUELTA_ATRAS.map((p) => p.paso), [1, 2, 3, 4], 'los cuatro pasos, en orden');
  ok(PLAN_DE_VUELTA_ATRAS.every((p) => !!p.como && !!p.que),
    '⚠️ cada uno con CÓMO se hace: un plan que no se puede ejecutar no es un plan');
  ok(/Instant Rollback/.test(PLAN_DE_VUELTA_ATRAS[0].como), 'el código, con el rollback de Vercel');
  ok(/restaurarCopia/.test(PLAN_DE_VUELTA_ATRAS[2].como), 'los datos, con la copia de la F46');
  ok(/no cambia el esquema/.test(PLAN_DE_VUELTA_ATRAS[3].como),
    '⚠️ y la base de datos no necesita vuelta atrás porque no se toca');
  ok(/MISMA base de datos/.test(DESPLIEGUE_GRADUAL.limite),
    '⚠️ y el despliegue gradual dice su límite: las vistas previas no ensayan datos');

  eq(CHECKLIST_PUBLICACION.length, 11, 'las once líneas del apartado 15');
  eq(checklistAutomatico().length, 7, 'siete se comprueban con un comando');
  eq(checklistDeJosue().length, 4, '⚠️ y cuatro necesitan su móvil: NO se marcan aquí');
  ok(checklistAutomatico().every((c) => !!c.comando), 'cada automática con su comando');
  ok(checklistDeJosue().every((c) => !!c.porque), '⚠️ y cada manual con por qué lo es');
  ok(/verificar\.sh/.test(lineaChecklist('tests').comando), 'los tests, con `verificar.sh`');
  ok(!lineaChecklist('inventada'), 'se buscan por id');
}

/* ---------------------------------------------------------------------------
   9 · DESPUÉS DE PUBLICAR (16, 17 y 18) Y EL VEREDICTO
   --------------------------------------------------------------------------- */
{
  console.log('\n9 · Después de publicar');
  eq(DESPUES_DE_PUBLICAR.map((d) => d.id), ['errores', 'rendimiento', 'sincronizacion', 'usuarios'],
    'las cuatro cosas que se revisan los primeros días');
  ok(GRAVEDADES === GRAVEDADES_F47, '⚠️ las cuatro gravedades son las de la F47, importadas');
  ok(GRAVEDADES.every((g) => !!REACCION_ANTE_ERROR[g.id]),
    'y cada una con su reacción: crítico es volver atrás, mejora es al backlog');
  ok(/no se toca producción por un impulso/i.test(BACKLOG.regla),
    '⚠️ y el apartado 18, con sus palabras');

  const panel = panelProduccion({ sql: SQL, fuentesEH: { 'EstiloHombreView.jsx': VISTA } });
  eq(panel.listoParaPublicar, true, '🎯 se puede publicar, y se sabe volver atrás');
  ok(panel.paraJosue.length === 8,
    `⚠️ con las ${panel.paraJosue.length} cosas que son suyas fuera del veredicto, no marcadas`);
  ok(/volver atrás/.test(panel.condicion), 'con la condición de finalización, entera');
  ok(/no añade funciones nuevas/.test(TEXTOS_PRODUCCION.noAnadir),
    'y recordando que esta fase no añade funciones');
}

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n - fallos}/${n} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
