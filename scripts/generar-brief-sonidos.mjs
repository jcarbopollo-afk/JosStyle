/* Genera docs/10_SONIDOS_PARA_FL_STUDIO.md a partir de especificacionSonidos.js.
   ⚠️ Igual que los otros documentos generados: sale del código. Si mañana cambia
   la biblioteca, se regenera y el brief sigue siendo verdad. */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  FAMILIAS, TRAMOS, CARACTER, EVITAR, FIRMA, CON_FIRMA,
  CARPETA, FORMATO, MAX_KB, ARCHIVOS, listaDeArchivos, queFalta, briefing,
} from '../src/lib/especificacionSonidos.js';

const L = [];
const p = (s = '') => L.push(s);
const lista = listaDeArchivos();
const falta = queFalta([]);

p('# LOS SONIDOS — lo que hay que producir');
p();
p('> **Para ti, Josué, con el FL Studio delante.** Esto no es una idea de cómo deberían sonar: es la');
p('> lista exacta de archivos que la aplicación va a buscar, con su nombre, su duración y su');
p('> carácter. **El día que estén en la carpeta, suenan sin tocar una línea de código.**');
p('>');
p('> 🚨 Se genera desde `src/lib/especificacionSonidos.js`. No lo edites a mano.');
p();
p('---');
p();

/* Lo práctico primero. */
p('## Lo primero, en tres líneas');
p();
p(`1. Exporta cada sonido en **${FORMATO.toUpperCase()}**, con el nombre exacto de la lista de abajo.`);
p(`2. Déjalos todos en la carpeta **\`${CARPETA}/\`** del proyecto.`);
p(`3. Ninguno debe pasar de **${MAX_KB} KB**. Son sonidos cortos: si uno pesa más, es que dura de más.`);
p();
p('**No hace falta que estén todos para empezar a oír algo.** Con los cinco de interfaz ya se nota al');
p('usar la aplicación, y el resto puede ir llegando.');
p();

/* Carácter. */
p('## Cómo tienen que sonar');
p();
p(`**Sí:** ${CARACTER.join(' · ')}.`);
p();
p(`**No:** ${EVITAR.join(' · ')}.`);
p();
p('> ⚠️ El que más se cuela es **"demasiado largo"**. Un clic de interfaz se va a oír doscientas');
p('> veces al día: si dura 300 ms en vez de 80, cansa a la semana. Cuando dudes, corta.');
p();

/* La firma. */
p(`## ${FIRMA.nombre}`);
p();
p(`**${FIRMA.notas} notas**, definidas como **intervalos** y no como notas concretas —así puedes`);
p('tocarlas en la tonalidad que quieras y siguen reconociéndose:');
p();
p(`\`\`\``);
p(`intervalos: ${FIRMA.intervalos.join(' · ')}  (semitonos desde la nota base)`);
p(`ejemplo en Do:  Do → Fa → Sol`);
p(`\`\`\``);
p();
p('Es una **cuarta justa ascendente más una segunda mayor**: abierta, sin resolver. Deja sitio para');
p('que las versiones grandes la completen hacia arriba.');
p();
p('**Cómo aparece según la importancia del momento:**');
p();
p('| Nivel | Cómo suena la firma |');
p('|---|---|');
FIRMA.evoluciones.forEach((e) => p(`| ${e.en} | ${e.como} |`));
p();
p('Y estos son los **ocho sonidos donde tiene que aparecer** — son los que hacen que todo suene del');
p('mismo producto:');
p();
p(CON_FIRMA.map((x) => `\`${x}\``).join(' · '));
p();

/* Duraciones. */
p('## Cuánto dura cada cosa');
p();
p('| Tramo | Duración |');
p('|---|---|');
TRAMOS.forEach((t) => p(`| ${t.label} | ${t.min}–${t.max} ms |`));
p();
p('| Familia | Duración | Nota |');
p('|---|---|---|');
FAMILIAS.forEach((f) => p(`| ${f.label} (\`${f.id}\`) | ${f.min}–${f.max} ms | |`));
p();
p('> ⚠️ Cuando las dos cosas se pisan, **manda la más estricta**. Un `ui_click` cumpliría "feedback"');
p('> con 300 ms y aun así se solaparía con el siguiente toque. En la lista de abajo ya está resuelto:');
p('> el rango que aparece es el bueno.');
p();

/* La lista, por familia. */
p('## Los archivos');
p();
p(`**${falta.total} en total.** Los marcados 🔒 son **únicos**: sin variantes, a propósito. Un récord`);
p('con tres versiones deja de ser un momento.');
p();
FAMILIAS.forEach((fam) => {
  const suyos = lista.filter((a) => a.familia === fam.id);
  if (suyos.length === 0) return;
  p(`### ${fam.label}`);
  p();
  p('| Archivo | Duración | |');
  p('|---|---|---|');
  suyos.forEach((a) => {
    const marcas = [a.unico ? '🔒 único' : '', a.conFirma ? '🎵 lleva la firma' : ''].filter(Boolean).join(' · ');
    p(`| \`${a.nombre}\` | ${a.minMs}–${a.maxMs} ms | ${marcas} |`);
  });
  p();
});

/* Por dónde empezar. */
p('## Por dónde empezar');
p();
p('Si vas a hacer cinco y parar, que sean estos — son los que se oyen al usar la aplicación:');
p();
falta.primeros.forEach((a) => p(`- \`${a.nombre}\` (${a.minMs}–${a.maxMs} ms)`));
p();
p('Después, por orden de lo que más se nota: las confirmaciones (`success`, `error`, `save`), los');
p('completar (`task_complete`, `habit_complete`) y ya los grandes.');
p();

/* Variantes. */
p('## Las variantes');
p();
p('Los sonidos que se repiten mucho llevan **varias versiones numeradas** (`ui_click_01`,');
p('`ui_click_02`, `ui_click_03`). La aplicación va alternando sola.');
p();
p('No tienen que ser sonidos distintos: **el mismo con un pelín de variación** —medio semitono, un');
p('poco menos de cuerpo— basta. Lo que cansa es la repetición idéntica, no el sonido.');
p();

p('---');
p();
p('## Cuando los tengas');
p();
p(`Déjalos en \`${CARPETA}/\` y enciende el sonido en **Ajustes → Sonido y respuesta**. Ahí mismo`);
p('tienes un **▶ Escuchar** por categoría que reproduce exactamente lo que sonará en la aplicación.');
p();
p('Si alguno no cumple su ficha —dura de más, pesa de más, se llama de otra forma— hay un validador');
p('que lo dice: `validarArchivo()` en `especificacionSonidos.js`.');
p();

writeFileSync(join(fileURLToPath(new URL('..', import.meta.url)), 'docs/10_SONIDOS_PARA_FL_STUDIO.md'), L.join(String.fromCharCode(13, 10)));
console.log(`✅ brief generado — ${L.length} líneas · ${falta.total} archivos, ${falta.criticos.length} únicos`);
