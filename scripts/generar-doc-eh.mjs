/* Genera docs/08_ESTILO_DE_HOMBRE_TECNICO.md a partir de documentacionEH.js.
   ⚠️ El documento SALE del código, no se teclea al lado. */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  QUE_HACE, QUE_NO_HACE, LA_REGLA, COMO_ESTA_ORGANIZADO,
  mapaDeModulos, PANTALLAS_TRANSVERSALES, DEPENDENCIAS_GLOBALES,
  fuenteDeCadaDato, REGLA_DE_FUENTE, ESTADOS_DOC, CICLO_DE_ELIMINACION, AVISO_ELIMINACION,
  coleccionesConPapelera, coleccionesTotalesEnLaPapelera, ESTRUCTURA, registroDeMigraciones,
  COMPONENTES_REUTILIZABLES, REGLAS_DE_DISENO, REGLAS_UX, NOTIFICACIONES_DOC, PRIVACIDAD_DOC,
  SUITE_DE_PRUEBAS, HISTORIAL, IDEAS_FUTURAS, REGLA_PARA_CLAUDE, MANTENIMIENTO,
  SECCIONES_DOC, TEXTOS_DOC,
} from '../src/lib/documentacionEH.js';

const L = [];
const p = (s = '') => L.push(s);

p('# ESTILO DE HOMBRE — DOCUMENTACIÓN TÉCNICA');
p();
p(`> **EH Fase 53/65.** ${TEXTOS_DOC.porQue}`);
p('>');
p(`> 🚨 **Este documento se genera desde \`src/lib/documentacionEH.js\`.** ${TEXTOS_DOC.actualizado}`);
p('> No lo edites a mano: edita la librería y vuelve a generarlo.');
p();
p('---');
p();

/* 1 */
p('## 1 · Qué hace y qué no hace');
p();
p(`**Qué hace.** ${QUE_HACE}`);
p();
p(`**Qué NO hace.** ${QUE_NO_HACE}`);
p();
p(`> **La regla.** ${LA_REGLA}`);
p();
p('### Cómo está organizado');
p();
p('| Capa | Qué es | Dónde |');
p('|---|---|---|');
COMO_ESTA_ORGANIZADO.forEach((c) => p(`| **${c.capa}** | ${c.que} | \`${c.donde}\` |`));
p();

/* 2 */
p('## 2 · Mapa de módulos');
p();
p('*Derivado de `MODULOS_EH`. Añadir un módulo es añadir una línea allí; aquí aparece solo.*');
p();
mapaDeModulos().forEach((c) => {
  p(`**${c.icono} ${c.nombre}**`);
  c.modulos.forEach((m) => p(`- ${m.icono} ${m.nombre} *(F${m.fase})*`));
  p();
});
p('**Pantallas que no son un módulo:**');
p();
PANTALLAS_TRANSVERSALES.forEach((t) => p(`- **${t.nombre}** *(F${t.fase})* — ${t.que}`));
p();

/* 3 */
p('## 3 · Dependencias globales');
p();
p('| Sistema | ¿Se usa? | Cómo / por qué no | Dónde |');
p('|---|---|---|---|');
DEPENDENCIAS_GLOBALES.forEach((d) => {
  p(`| **${d.nombre}** | ${d.usa ? '✅' : '❌'} | ${d.usa ? d.como : d.porque} | ${d.donde ? `\`${d.donde}\`` : '—'} |`);
});
p();

/* 4 */
p('## 4 · Dónde vive cada dato');
p();
p(`> ${REGLA_DE_FUENTE}`);
p();
p('| Dato | Vive en | Módulo | Clave |');
p('|---|---|---|---|');
fuenteDeCadaDato().forEach((f) => {
  p(`| ${f.dato} | ${f.vive === 'global' ? '🌍 global' : '🧔 Estilo de hombre'} | ${f.modulo} | \`${f.clave}\` |`);
});
p();

/* 5 */
p('## 5 · Estados');
p();
p('| | Estado | De | Qué significa |');
p('|---|---|---|---|');
ESTADOS_DOC.forEach((e) => p(`| ${e.icono} | **${e.nombre}** | ${e.de === 'modulo' ? 'un módulo' : 'un elemento'} | ${e.que} |`));
p();

/* 6 */
p('## 6 · Cómo se elimina');
p();
CICLO_DE_ELIMINACION.forEach((c) => p(`${c.paso}. **${c.que}** — ${c.como}`));
p();
p(`> ${AVISO_ELIMINACION}`);
p();
p(`La papelera global cubre **${coleccionesTotalesEnLaPapelera()} colecciones**, de las cuales **${coleccionesConPapelera()}** son de Estilo de hombre.`);
p();

/* 7 */
p('## 7 · Estructura de datos');
p();
p('| | |');
p('|---|---|');
p(`| **Tabla** | \`${ESTRUCTURA.tabla}\` |`);
p(`| **Clave primaria** | \`${ESTRUCTURA.clavePrimaria}\` |`);
p(`| **Clave de este módulo** | \`${ESTRUCTURA.claveDeEsteModulo}\` |`);
p(`| **Relaciones** | ${ESTRUCTURA.relaciones} |`);
p(`| **Índices** | ${ESTRUCTURA.indices} |`);
p(`| **Identificadores** | ${ESTRUCTURA.identificadores} |`);
p(`| **Versión del esquema de datos** | v${ESTRUCTURA.versionDelEsquemaDeDatos} |`);
p(`| **Módulos con clave propia** | ${ESTRUCTURA.modulosConClave} |`);
p();
p(`> ${ESTRUCTURA.sinSecretos}`);
p();

/* 8 */
p('## 8 · Migraciones');
p();
p('| De | A | Qué cambió | Por qué |');
p('|---|---|---|---|');
registroDeMigraciones().forEach((m) => p(`| v${m.de} | v${m.a} | ${m.que} | ${m.porque} |`));
p();

/* 9 */
p('## 9 · Componentes que se reutilizan');
p();
p('*No crear componentes duplicados sin motivo.*');
p();
p('| Para | Se usa | Vive en |');
p('|---|---|---|');
COMPONENTES_REUTILIZABLES.forEach((c) => p(`| ${c.nombre} | \`${c.componente}\` | ${c.vive} |`));
p();

/* 10 */
p('## 10 · Reglas de diseño');
p();
p('*Siempre los tokens globales de JC Fitness.*');
p();
REGLAS_DE_DISENO.forEach((r) => p(`- **${r.que}** — ${r.regla} *(${r.fase})*`));
p();

/* 11 */
p('## 11 · Reglas de UX');
p();
REGLAS_UX.forEach((r) => p(`- **${r.regla}** ${r.porque}`));
p();

/* 12 */
p('## 12 · Notificaciones');
p();
p(`- **Qué genera Estilo de hombre:** ${NOTIFICACIONES_DOC.queGenera}`);
p(`- **Qué usa del sistema global:** ${NOTIFICACIONES_DOC.queUsa}`);
p(`- **Qué requiere que él lo encienda:** ${NOTIFICACIONES_DOC.requiereActivacion}`);
p(`- **Frecuencia:** ${NOTIFICACIONES_DOC.frecuencia}`);
p();

/* 13 */
p('## 13 · Privacidad');
p();
p(`- **Qué se guarda:** ${PRIVACIDAD_DOC.queSeGuarda}`);
p(`- **Cómo se protege:** ${PRIVACIDAD_DOC.comoSeProtege}`);
p(`- **Cómo se elimina:** ${PRIVACIDAD_DOC.comoSeElimina}`);
p(`- **Cómo se exporta:** ${PRIVACIDAD_DOC.comoSeExporta}`);
p(`- **Qué no sale de aquí:** ${PRIVACIDAD_DOC.queNoSale}`);
p();

/* 14 */
p('## 14 · Pruebas');
p();
p('```bash');
p(SUITE_DE_PRUEBAS.comando);
p('```');
p();
p(`${SUITE_DE_PRUEBAS.que} La prueba en un navegador de verdad es \`${SUITE_DE_PRUEBAS.navegador}\`, y hay **${SUITE_DE_PRUEBAS.integrales} recorridos integrales** declarados.`);
p();
p(`> ${SUITE_DE_PRUEBAS.regla}`);
p();

/* 15 */
p('## 15 · Historial de cambios');
p();
p(`- **Dónde:** ${HISTORIAL.donde}`);
p(`- **Formato:** ${HISTORIAL.formato}`);
p();
p(`> ${HISTORIAL.regla}`);
p();

/* 16 */
p('## 16 · 💡 Ideas futuras (backlog)');
p();
p('*El mismo `SE_POSPONE` de la F48. No hay una segunda lista.*');
p();
IDEAS_FUTURAS.forEach((i) => p(`- **${i.que}** — ${i.porque}`));
p();

/* 17 */
p('## 17 · Regla para Claude');
p();
p(`> 🚨 **${REGLA_PARA_CLAUDE}**`);
p();
p('Es decir: antes de tocar nada, leer `docs/08_ESTILO_DE_HOMBRE_TECNICO.md`.');
p();

/* 18 */
p('## 18 · Manual de mantenimiento');
p();
MANTENIMIENTO.forEach((m) => {
  p(`### ${m.pregunta}`);
  p();
  p(m.respuesta);
  p();
  p(`*Dónde mirar: \`${m.donde}\`*`);
  p();
});

p('---');
p();
p('## Condición de finalización');
p();
p(`> ${TEXTOS_DOC.condicion}`);
p();
p(`*Los ${SECCIONES_DOC.length} apartados del enunciado están contestados; ${SECCIONES_DOC.filter((s) => s.derivado).length} de ellos se derivan del código y no pueden quedarse viejos.*`);
p();

writeFileSync('C:/Users/clapi/JosStyle/docs/08_ESTILO_DE_HOMBRE_TECNICO.md', L.join('\r\n'));
console.log(`✅ documento generado — ${L.length} líneas`);
