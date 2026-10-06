/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 9 — microinteracciones, estados y feedback de interfaz

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f9.mjs

   Lo que se comprueba aquí es la DECISIÓN —los estados estándar y quién los
   pone, el estado de un botón, el inventario, la auditoría que caza lo que no
   puede volver— y que las piezas lo cableen. Lo que necesita un navegador —que
   un campo enfocado cambie de borde (también dentro de una hoja), que un botón
   que espera no cambie de ancho ni se apague y no repita la acción, que el
   error aparezca bajo su campo y que el aviso salga— está en la sección «MS F9»
   de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ESTADOS_COMPONENTE, RETARDO_INDICADOR, RETARDO_INDICADOR_MS, TIEMPOS_F9, ESTADOS_BOTON, estadoDeBoton,
  TEXTOS_ESTADO_BOTON, INVENTARIO_F9, PATRONES_F9, auditarEstadosInteraccion, AUDITORIA_F9, NO_EN_F9, CUANDO_F9,
} from '../src/lib/estadosInteraccion.js';
import { DURACIONES_MOTION, PRESETS_MOTION, fotogramas, contextoMotion } from '../src/lib/motion.js';
import { validarTarea, validarEvento, campoConError } from '../src/lib/accionesHoyAgenda.js';
import { MOTION_MAP, auditarMotion } from '../src/lib/motionMapa.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}

const UI = leer('src/components/ui.jsx');
const UI_LIMPIO = sinComentarios(UI);
const CSS = leer('src/index.css');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Los estados estándar (apartados 2 y 3) ──');

const ids = ESTADOS_COMPONENTE.map((e) => e.id);
ok(['default', 'hover', 'focus', 'pressed', 'active', 'selected', 'disabled', 'loading', 'success', 'error'].every((e) => ids.includes(e)), 'los diez estados del apartado 2, cada uno con su línea');
ok(ESTADOS_COMPONENTE.every((e) => e.como && e.quien && typeof e.usado === 'boolean'), '…y cada uno dice cómo se ve en JosStyle y quién lo pone');
ok(ESTADOS_COMPONENTE.filter((e) => !e.usado).every((e) => e.porque), '⚠️ los que NO se usan dicen por qué: *"no inventar estados innecesarios"*');
ok(ESTADOS_COMPONENTE.filter((e) => !e.usado).map((e) => e.id).sort().join() === 'active,hover', '…y son dos: `hover` (no hay puntero en un iPhone) y `active` (es pulsar)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. El estado de un botón (apartados 4, 6 y 7) ──');

ok(ESTADOS_BOTON.join() === 'reposo,cargando,hecho,fallo', 'cuatro estados: reposo, cargando, hecho y fallo');
ok(estadoDeBoton('cargando').ocupado === true && estadoDeBoton('cargando').ariaBusy === true, '🚨 cargando está OCUPADO: el toque no repite la acción, y `aria-busy` lo dice (apartado 6)');
ok(['reposo', 'hecho', 'fallo'].every((e) => estadoDeBoton(e).ocupado === false && estadoDeBoton(e).ariaBusy === undefined), '…y ningún otro lo está: después de un fallo se puede reintentar');
ok(estadoDeBoton('inventado').estado === 'reposo' && estadoDeBoton(undefined).capa === 'texto' && estadoDeBoton(null).ocupado === false, 'un estado que no existe se lee como reposo: nunca un botón bloqueado por un valor raro');
ok(estadoDeBoton('hecho').capa === 'hecho' && estadoDeBoton('reposo').capa === 'texto', 'cada estado dice qué capa se ve');
ok(TEXTOS_ESTADO_BOTON.cargando === 'Guardando…' && TEXTOS_ESTADO_BOTON.hecho && TEXTOS_ESTADO_BOTON.fallo, 'con un texto por defecto para cada uno, que el botón puede cambiar');
ok(/export function PrimaryButton\(\{[^}]*estado, textoCargando, textoHecho, textoFallo \}\)/.test(UI) && /export function GhostBtn\(\{[^}]*estado, textoCargando, textoHecho, textoFallo \}\)/.test(UI), '`PrimaryButton` y `GhostBtn` aceptan `estado` y sus textos');
ok((UI_LIMPIO.match(/onClick=\{ocupado \? undefined : onClick\}/g) || []).length === 2 && (UI_LIMPIO.match(/aria-busy=\{ariaBusy\}/g) || []).length === 2, '🚨 …y los dos dejan de escuchar el toque mientras cargan, con `aria-busy`');
ok(!/disabled=\{disabled \|\| ocupado\}|disabled=\{ocupado/.test(UI_LIMPIO), '🐛 …sin apagarse: un botón a medio color mientras trabaja parece roto');
ok(/conEstado\s*\?\s*<TextoDeBoton/.test(UI_LIMPIO) && /:\s*<>\{icono\}\{children\}<\/>/.test(UI_LIMPIO), 'sin `estado`, el botón es exactamente el de siempre (ningún uso anterior cambia)');
ok(/\['texto', <>\{icono\}\{children\}<\/>\]/.test(UI_LIMPIO), 'el icono va DENTRO de la capa del texto: cambiar de capa no mueve nada');
ok(/className="boton-capas"/.test(UI_LIMPIO) && /className="boton-capa"/.test(UI_LIMPIO) && /data-visible=\{capa === id \? 'si' : 'no'\}/.test(UI_LIMPIO), 'las capas van apiladas (`boton-capas`) y solo una se ve');
ok(/aria-hidden=\{capa === id \? undefined : true\}/.test(UI_LIMPIO), '…y las que no se ven, tampoco las lee VoiceOver');
ok(/if \(capa === 'hecho'\) capas\.push/.test(UI_LIMPIO), '«hecho» y «fallo» solo se apilan cuando tocan: no ensanchan un botón que no los usa');

console.log('\n── 3. Los tiempos y el CSS (apartados 6, 21, 31 y 45) ──');
ok(RETARDO_INDICADOR === 'slow' && RETARDO_INDICADOR_MS === DURACIONES_MOTION.slow, `el giro aparece solo si la acción dura más que \`slow\` (${RETARDO_INDICADOR_MS} ms): *"no mostrar spinner para operaciones prácticamente instantáneas"*`);
ok(/\.boton-capa\[data-visible='si'\] \.boton-giro \{[^}]*transition-delay: var\(--motion-dur-slow\)/.test(CSS), '…y lo pone el CSS con un retraso de transición del token, sin un temporizador en cada botón');
ok(/\.boton-capa\[data-visible='no'\] \{ opacity: 0; visibility: hidden; \}/.test(CSS), 'la capa que no se ve está `visibility: hidden`: fuera de lo que se lee');
ok(/\.boton-capa \{[^}]*grid-area: 1 \/ 1;[^}]*transition: opacity var\(--motion-dur-fast\)/.test(CSS), 'las capas, en la misma celda, se funden en `fast`');
ok(/\.campo \{\s*transition: border-color var\(--motion-dur-fast\) var\(--ease-premium\), box-shadow var\(--motion-dur-fast\)/.test(CSS), '🐛 un campo enfocado cambia de borde y de halo en `fast` (apartado 21)');
ok(/\.campo:focus \{\s*border-color: var\(--accent, currentColor\) !important;/.test(CSS), '…al acento, por encima del borde que cada campo lleva en su `style`');
ok(/\.campo\[aria-invalid='true'\] \{\s*border-color: var\(--color-negativo, currentColor\) !important;/.test(CSS), '…y con `aria-invalid`, en rojo');
ok(['TextInput', 'Textarea', 'SelectInput', 'Select'].every((c) => new RegExp(`(?:function|const) ${c}[\\s\\S]{0,600}className=[{"\`]*\\s*\`?campo `).test(UI)), 'los cuatro campos de `ui.jsx` llevan `campo`');
ok(!/font-size|fontSize/.test((CSS.match(/\.campo[^{]*\{[^}]*\}/g) || []).join('')), '⚠️ …sin tocar la letra ni su tamaño: eso es la C-32, de Josué');
ok(/@keyframes campoMensajeEntra \{\s*from \{ opacity: 0; transform: translateY\(calc\(-1 \* var\(--motion-dist-micro\)\)\); \}/.test(CSS), 'el error de un campo baja un poco desde él (`--motion-dist-micro`: 0 en Reducido)');
ok(/\.campo-mensaje-entra \{\s*animation: campoMensajeEntra var\(--motion-dur-fast\) var\(--ease-premium\) backwards;/.test(CSS), '…en `fast`, con `backwards`');
ok(/\.aviso-entra \{\s*animation: avisoEntra var\(--motion-dur-medium\) var\(--ease-premium\) backwards;/.test(CSS), '🐛 la entrada del aviso termina con `backwards`, no con `both` (la lección de la F3)');
ok(TIEMPOS_F9.every((t) => DURACIONES_MOTION[t.token] !== undefined && t.porque), 'cada tiempo de la fase es un token del motor, con su porqué (apartado 45)');

console.log('\n── 4. El acento en el documento, para las hojas ──');
const APP = leer('src/App.jsx');
ok(/document\.documentElement\.style\.setProperty\('--accent', accent\)/.test(APP) && /document\.documentElement\.style\.setProperty\('--color-negativo', COLORS\.negative\)/.test(APP), '🐛 el acento y el rojo también en el documento: las hojas son portales sobre el `body`, fuera del contenedor que tenía las variables');
{
  const i = APP.indexOf("setProperty('--accent', accent)");
  const primerReturn = APP.search(/\n  if \(session === undefined\) return/);
  ok(i > 0 && primerReturn > 0 && i < primerReturn, '…y su efecto va ANTES de los `return` condicionales (regla 4)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. El error, debajo de su campo (apartados 8, 20, 22 y 23) ──');

ok(/export function MensajeDeCampo\(\{ tipo = 'error', id, children, className = '' \}\)/.test(UI), '`MensajeDeCampo` en `ui.jsx`');
ok(/role=\{error \? 'alert' : 'status'\}/.test(UI) && /campo-mensaje-entra/.test(UI) && /if \(!children\) return null;/.test(UI), '…anunciado (`alert` si es un error), con su entrada y sin pintar nada vacío');
ok(campoConError('evento', { titulo: 'Partido', fecha: '2026-10-06', horaInicio: '10:00', horaFin: '09:00' }) === 'fin', 'la hora de fin antes que la de inicio es culpa de la hora de FIN');
ok(campoConError('evento', { titulo: 'Partido', fecha: '2026-10-06', horaInicio: '25:99', horaFin: '' }) === 'inicio', '…una hora de inicio imposible, de la de inicio');
ok(campoConError('evento', { titulo: '', fecha: '2026-10-06' }) === 'titulo' && campoConError('tarea', { texto: 'x', fecha: '2026-10-06', hora: '99:00' }) === 'hora', '…sin título, del título; en una tarea, de su hora');
ok(campoConError('evento', { titulo: 'Partido', fecha: '2026-10-06', horaInicio: '10:00', horaFin: '11:00' }) === null && campoConError('evento', { titulo: 'x', fecha: '2026-10-06', todoElDia: true, horaFin: '01:00', horaInicio: '23:00' }) === null, 'con todo bien —o todo el día—, ninguno');
ok(campoConError('tarea', { texto: 'x', fecha: '2026-13-45' }) === null && validarTarea({ texto: 'x', fecha: '2026-13-45' }), 'una fecha imposible es del formulario entero: no se pinta un campo que él no puede tocar');
ok(validarEvento({ titulo: 'Partido', fecha: '2026-10-06', horaInicio: '10:00', horaFin: '09:00' }) === 'La hora de fin es anterior a la de inicio.' && validarTarea({ texto: '', fecha: '2026-10-06' }) === 'Escribe un título para la tarea.', '…y el texto de cada error es el de siempre: el texto y el campo salen de la MISMA regla');
const QA = sinComentarios(leer('src/components/quickAdd.jsx'));
ok((QA.match(/\{\.\.\.errorEn\(campoMal, '(titulo|hora|inicio|fin)', 'motivo-(tarea|evento)'\)\}/g) || []).length === 5, 'el ＋ de Hoy marca el campo culpable en sus dos formularios, unido al mensaje para VoiceOver (`aria-describedby`)');
ok(/<MensajeDeCampo id=\{id\}/.test(QA), '…y su motivo es un `MensajeDeCampo`');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. El aviso entra y SE VA (apartados 33 y 34) ──');

ok(PRESETS_MOTION.toastExit && PRESETS_MOTION.toastExit.duracion === 'fast' && PRESETS_MOTION.toastExit.curva === 'exit', 'el preset `toastExit`: `fast`, con la curva de salida');
{
  const f = fotogramas('toastExit', contextoMotion());
  ok(f && f.keyframes && f.keyframes.length === 2 && f.keyframes[1].opacity === '0', `…sale hacia donde vino y se apaga (${JSON.stringify(f && f.keyframes && f.keyframes[1])})`);
  const r = fotogramas('toastExit', contextoMotion({ reducirMovimiento: true }));
  ok(r && r.keyframes && !/translate/.test(JSON.stringify(r.keyframes)), '…y en Reducido solo se funde');
}
ok(PRESETS_MOTION.toastEnter && PRESETS_MOTION.toastEnter.clase === 'aviso-entra', 'su entrada es la clase que ya tenía (`aviso-entra`)');
ok(/<Presencia visible=\{!!avisoActual\} animarAlMontar=\{false\} salida="toastExit" onSalida=\{\(\) => setUltimo\(null\)\}>/.test(QA), '`AvisoAccion` sale con `Presencia` y se queda con el último aviso mientras sale');
ok(/aviso\.deshacer && onDeshacer && avisoActual &&/.test(QA), '…y mientras sale, «Deshacer» ya no se ofrece: la acción ya no es la de ahora (apartado 34)');
for (const [archivo, nombre] of [['src/views/FitnessView.jsx', 'aviso'], ['src/views/DashboardView.jsx', 'avisoHoy'], ['src/views/CalendarView.jsx', 'aviso']]) {
  const v = sinComentarios(leer(archivo));
  ok(new RegExp(`<AvisoAccion accion=\\{${nombre}\\}`).test(v) && !new RegExp(`\\{${nombre} && <AvisoAccion`).test(v), `${archivo.split('/').pop()} monta el aviso SIEMPRE: si lo desmontara, no podría salir`);
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Lo que no puede volver (apartado 51) ──');

const vistas = {};
for (const d of ['src/views', 'src/components']) {
  for (const f of readdirSync(join(RAIZ, d))) if (/\.jsx?$/.test(f)) vistas[`${d}/${f}`] = leer(`${d}/${f}`);
}
vistas['src/index.css'] = CSS;
const aud = auditarEstadosInteraccion({ vistas });
ok(aud.cuentas.cargando_a_mano === 0, `🚨 ni un botón escribe a mano su «Guardando…», «Subiendo…» o «Analizando…» (${aud.hallazgos.filter((h) => h.tipo === 'cargando_a_mano').map((h) => `${h.archivo}:${h.linea}`).join(', ') || 'ninguno'})`);
ok(aud.cuentas.temblor === 0, `ni un temblor como respuesta a un error (apartado 23) (${aud.hallazgos.filter((h) => h.tipo === 'temblor').map((h) => `${h.archivo}:${h.linea}`).join(', ') || 'ninguno'})`);
{
  const malo = { 'x.jsx': "<PrimaryButton onClick={g}>\n  {subiendo ? 'Subiendo…' : 'Subir'}\n</PrimaryButton>\n<label><div>{a ? 'Analizando…' : 'Foto'}</div></label>" };
  const r = auditarEstadosInteraccion({ vistas: malo });
  ok(r.cuentas.cargando_a_mano === 2 && r.hallazgos[0].linea === 2, 'la auditoría SÍ caza uno escrito a mano, con su línea —también en el selector de un archivo— (no puede ponerse verde sin mirar)');
  const bien = { 'y.jsx': "<PrimaryButton estado={s ? 'cargando' : 'reposo'} textoCargando={pdf ? 'Subiendo y leyendo…' : 'Subiendo…'}>Subir</PrimaryButton>\n<p>{nota ? 'Guardada' : 'Guardando…'}</p>" };
  ok(auditarEstadosInteraccion({ vistas: bien }).cuentas.cargando_a_mano === 0, '…y no confunde el texto que se le PASA al botón, ni el estado de guardado de una nota, con uno escrito a mano');
  ok(auditarEstadosInteraccion({ vistas: { 'z.css': '@keyframes shake { from {} }' } }).cuentas.temblor === 1 && auditarEstadosInteraccion({ vistas: { 'z.jsx': '/* nada de shake aquí */ const a = 1;' } }).cuentas.temblor === 0, '…caza un temblor de verdad y no el comentario que lo prohíbe');
}
ok(PATRONES_F9.every((p) => p.id && p.que), 'cada patrón dice qué usar en su lugar');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. El inventario, la auditoría y lo que no se hace ──');

ok(INVENTARIO_F9.length >= 15 && INVENTARIO_F9.every((i) => i.que && i.hay && i.queda && i.estados.every((e) => ids.includes(e))), `el inventario del apartado 1: ${INVENTARIO_F9.length} clases de elemento, con sus estados (todos de la lista estándar)`);
ok(['Botones', 'Campos de texto y áreas', 'Avisos (toasts)', 'Interruptores', 'Acciones destructivas y de confirmación'].every((q) => INVENTARIO_F9.some((i) => i.que === q)), '…con los botones, los campos, los avisos, los interruptores y lo destructivo');
ok(AUDITORIA_F9.length >= 6 && AUDITORIA_F9.every((a) => a.apartados.length && a.que && a.antes && a.queda), 'la auditoría de lo que pide el enunciado: qué había y qué queda');
ok(NO_EN_F9.length >= 5 && NO_EN_F9.every((n) => n.que && n.porque), 'lo que no se construye, con su motivo');
ok(NO_EN_F9.some((n) => /F10/.test(n.porque)) && NO_EN_F9.some((n) => /F16/.test(n.porque)) && NO_EN_F9.some((n) => /F17/.test(n.porque)), '…y la fase de cada cosa: las listas (F10), el sistema (F16) y las cifras (F17)');
ok(CUANDO_F9.length >= 4 && CUANDO_F9.every((c) => c.patron && c.cuando), 'cuándo usar cada pieza');

const mapa = (id) => MOTION_MAP.find((e) => e.id === id);
ok(mapa('campos')?.estado === 'existe' && mapa('campos')?.clase === 'campo', 'el MOTION_MAP: los campos ya no están «sin movimiento»');
ok(mapa('boton_estado')?.fase === 9 && mapa('boton_giro')?.clase === 'boton-giro' && mapa('mensaje_campo')?.keyframe === 'campoMensajeEntra', '…y tiene el botón que espera, su giro y el mensaje de un campo');
ok(/toastExit/.test(mapa('aviso_anadido')?.salida || ''), '…y el aviso dice cómo se va');
const audM = auditarMotion({ css: CSS, vistas: {} });
ok(audM.sinMapa.length === 0 && audM.keyframesHuerfanos.length === 0 && audM.mapaSinCss.length === 0 && audM.curvasAjenas.length === 0, 'la auditoría de la F0 sigue limpia: cada regla nueva está en el mapa, con la curva y los tokens de siempre');

console.log('\n── 9. La documentación ──');
const SIS = leer('docs/MOTION_SYSTEM.md');
ok(/estado="cargando"/.test(SIS) && /MensajeDeCampo/.test(SIS) && /toastExit/.test(SIS), 'MOTION_SYSTEM.md tiene las reglas de la F9');
ok(/\*\*F9\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F9');
ok(/C-60/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), 'C-60 está escrita');

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
