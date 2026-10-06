/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 8 — física, muelles, gestos e interacción directa

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f8.mjs

   Lo que se comprueba aquí es la DECISIÓN —la jerarquía de muelles y que
   ninguno de los que se usan rebote, la máquina de estados de un gesto, el velo
   que se aclara con el dedo, la regla de un solo dedo, los puntos hápticos— y
   que las piezas que tocan el DOM la cableen. Lo que necesita un navegador —que
   el velo se aclare de verdad al arrastrar, que vuelva al soltar y que un
   segundo dedo no mueva nada— está en la sección «MS F8» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  JERARQUIA_MUELLES, sobrepasoDe, cruces, MUELLES_EN_USO, muelleSinRebote, SOBREPASO_MAXIMO,
  ESTADOS_GESTO, siguienteEstadoGesto, ACLARADO_MAXIMO, veloDuranteArrastre,
  punteroQueCuenta, GESTO_ABANDONADO_MS, gestoAbandonado,
  PUNTOS_HAPTICOS, POR_QUE_NO_VIBRA_EL_GESTO, AUDITORIA_F8, NO_EN_F8,
} from '../src/lib/fisicaMotion.js';
import { SPRINGS_MOTION, contextoMotion, duracionMs } from '../src/lib/motion.js';
import { vueltaConMuelle, salidaConInercia, MUELLE_POR_MASA } from '../src/lib/gestosMotion.js';
import { UMBRALES_GESTO } from '../src/lib/umbralesGesto.js';
import { definicionEvento } from '../src/lib/audio.js';
import { EVENTO_SERIE_HECHA, EVENTO_FIN_DESCANSO } from '../src/lib/entrenamiento.js';
import { MOTION_MAP, auditarMotion } from '../src/lib/motionMapa.js';
import { DEPENDENCIAS_PERMITIDAS } from '../src/lib/arquitecturaFitness.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}

const NORMAL = contextoMotion();
const REDUCIDO = contextoMotion({ reducirMovimiento: true });
const SISTEMA = contextoMotion({ sistemaReduce: true });
const GESTOS = leer('src/components/gestosMotion.jsx');
const GESTOS_LIMPIO = sinComentarios(GESTOS);
const COMPARADOR = sinComentarios(leer('src/components/comparadorFotos.jsx'));

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. La jerarquía de muelles (apartados 3-8) ──');

const papeles = JERARQUIA_MUELLES.map((j) => j.papel);
ok(['snappy', 'standard', 'soft', 'responsive', 'heavy', 'bouncy'].every((p) => papeles.includes(p)), 'los seis papeles del apartado 3, cada uno con su línea');
ok(JERARQUIA_MUELLES.every((j) => j.usa && j.porque), '…y cada uno dice para qué es y por qué');
ok(JERARQUIA_MUELLES.filter((j) => j.muelle).every((j) => SPRINGS_MOTION[j.muelle]), 'cada muelle de la jerarquía existe en `SPRINGS_MOTION` (F1): ni uno escrito aparte');
ok(new Set(JERARQUIA_MUELLES.filter((j) => j.muelle).map((j) => j.muelle)).size === Object.keys(SPRINGS_MOTION).length, '…y la jerarquía los nombra todos: ni uno sin papel (apartado 42, una jerarquía pequeña)');
ok(JERARQUIA_MUELLES.find((j) => j.papel === 'snappy').muelle === null, '🚨 «snappy» NO es un muelle: un toque va por tiempo (apartado 4, *"no todo debe ser spring"*)');
ok(MUELLES_EN_USO.length > 0 && MUELLES_EN_USO.every((m) => SPRINGS_MOTION[m]), `los muelles que usa la aplicación salen de \`MUELLE_POR_MASA\` (F5): ${MUELLES_EN_USO.join(', ')}`);
ok(MUELLES_EN_USO.every(muelleSinRebote), `🚨 ninguno de los que se usan rebota: se pasan como mucho un ${SOBREPASO_MAXIMO * 100} % del recorrido (apartado 8)`);
ok(MUELLES_EN_USO.every((m) => sobrepasoDe(m) === 0), '…medido: ninguno se pasa de su destino');
ok(MUELLES_EN_USO.every((m) => cruces(m) === 0), '…y ninguno cruza el destino ni una vez (sin oscilación)');
ok(!MUELLES_EN_USO.includes('bouncy') && !Object.values(MUELLE_POR_MASA).includes('bouncy'), '`bouncy` no lo usa ninguna masa');
ok(sobrepasoDe('bouncy') > 0 && cruces('bouncy') >= 1, '…y es el único que rebota: la comprobación SÍ caza un muelle que se pasa (no puede ponerse verde sin mirar)');
ok(!muelleSinRebote('bouncy'), '…y `muelleSinRebote` lo distingue');
{
  /* Ninguna pieza fuera del motor pide el muelle que rebota (apartado 8: solo con una razón escrita). */
  const usos = [];
  const recorrer = (dir) => {
    for (const n of readdirSync(join(RAIZ, dir), { withFileTypes: true })) {
      const p = `${dir}/${n.name}`;
      if (n.isDirectory()) recorrer(p);
      else if (/\.(jsx?|mjs)$/.test(n.name) && !/lib\/(motion|fisicaMotion|motionMapa)\.js$/.test(p) && /['"]bouncy['"]/.test(sinComentarios(leer(p)))) usos.push(p);
    }
  };
  recorrer('src');
  ok(usos.length === 0, `🚨 ninguna pantalla ni librería pide 'bouncy' (${usos.join(', ') || 'ninguna'})`);
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. La velocidad cuenta (apartado 9) y Reducido quita los muelles (apartado 38) ──');

const rapida = salidaConInercia({ desde: 40, hasta: 500, velocidad: 3, ctx: NORMAL }).duracionMs;
const lenta = salidaConInercia({ desde: 40, hasta: 500, velocidad: 0.5, ctx: NORMAL }).duracionMs;
ok(rapida < lenta, `un lanzamiento rápido sale antes que uno lento (${rapida} ms frente a ${lenta} ms): no es *"la misma animación para todos los casos"*`);
ok(rapida >= duracionMs('fast', NORMAL) && lenta <= duracionMs('normal', NORMAL), '…entre `fast` y `normal`: ni un parpadeo ni una salida arrastrada');
const vSin = vueltaConMuelle({ desde: 120, velocidad: 0, ctx: NORMAL });
const vCon = vueltaConMuelle({ desde: 120, velocidad: -1.5, ctx: NORMAL });
ok(vCon.valores[1] !== vSin.valores[1], 'la vuelta conserva la velocidad del dedo: un mismo sitio con otra velocidad sale distinto');
ok(vSin.valores.every((v) => v >= -0.5 && v <= 120.5), '…y vuelve sin pasarse de su sitio (`responsive`, sin rebote)');
ok(vueltaConMuelle({ desde: 120, velocidad: -1, ctx: REDUCIDO }).duracionMs === 0 && salidaConInercia({ desde: 0, hasta: 400, velocidad: 2, ctx: REDUCIDO }).duracionMs === 0, '🚨 en Reducido no hay muelle perceptible ni inercia (apartado 38)');
ok(vueltaConMuelle({ desde: 120, velocidad: -1, ctx: SISTEMA }).duracionMs === 0, '…tampoco con «Reducir movimiento» del iPhone');
ok(Object.isFrozen(UMBRALES_GESTO) && UMBRALES_GESTO.velocidadCierre > UMBRALES_GESTO.velocidadMinima, 'los umbrales de velocidad están en UN sitio (`UMBRALES_GESTO`, apartado 31) y no se contradicen');
ok(!/\b0\.\d+\s*\)\s*\/\*?|velocidad\s*[<>]=?\s*\d/.test(GESTOS_LIMPIO), 'las piezas de los gestos no comparan una velocidad con un número escrito a mano');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. La máquina de estados de un gesto (apartados 33, 35 y 36) ──');

ok(['quieta', 'arrastrando', 'umbral', 'volviendo', 'cerrando', 'cerrada'].every((e) => ESTADOS_GESTO.includes(e)), 'los seis estados: quieta (IDLE), arrastrando, umbral, volviendo / cerrando (SETTLING) y cerrada (DISMISSED)');
const paso = (estado, ...eventos) => eventos.reduce(siguienteEstadoGesto, estado);
ok(paso('quieta', 'empezar', 'soltarVolver', 'fin') === 'quieta', 'idle → dragging → released → settling → idle (apartado 35)');
ok(paso('quieta', 'empezar', 'pasarUmbral', 'soltarCerrar', 'fin') === 'cerrada', 'arrastrar, pasar el umbral, soltar y cerrarse');
ok(paso('quieta', 'empezar', 'pasarUmbral', 'volverDelUmbral') === 'arrastrando', 'volver por encima del umbral sin soltar: sigue arrastrando (*"gesture reversal"*)');
ok(paso('quieta', 'empezar', 'soltarVolver', 'empezar') === 'arrastrando', '🚨 *"settling → new gesture"*: agarrarla mientras vuelve es otra transición, no un caso raro');
ok(paso('quieta', 'empezar', 'soltarCerrar', 'empezar') === 'arrastrando', '…y también mientras se va');
ok(paso('quieta', 'empezar', 'pasarUmbral', 'cancelar') === 'volviendo', 'un gesto que el sistema cancela vuelve: nunca se cierra solo (apartado 33)');
ok(siguienteEstadoGesto('quieta', 'fin') === 'quieta' && siguienteEstadoGesto('quieta', 'soltarCerrar') === 'quieta', 'un evento que no toca en ese estado lo deja como está');
ok(siguienteEstadoGesto('cerrada', 'empezar') === 'cerrada', 'una hoja cerrada no se arrastra');
ok(siguienteEstadoGesto('cerrada', 'recuperar') === 'quieta', '…y su única salida es volver a su sitio si quien la abrió no la cierra (F5, apartado 37)');
ok(siguienteEstadoGesto('inventado', 'fin') === 'quieta' && siguienteEstadoGesto(undefined, 'empezar') === 'arrastrando', 'un estado que no existe se lee como quieta: nunca un estado imposible');
{
  const eventos = ['empezar', 'pasarUmbral', 'volverDelUmbral', 'soltarVolver', 'soltarCerrar', 'cancelar', 'fin', 'recuperar', 'otro'];
  const todos = ESTADOS_GESTO.flatMap((e) => eventos.map((v) => siguienteEstadoGesto(e, v)));
  ok(todos.every((e) => ESTADOS_GESTO.includes(e)), `de ningún estado y con ningún evento se sale de los seis (${ESTADOS_GESTO.length * eventos.length} combinaciones)`);
}
ok(/siguienteEstadoGesto\(caja\.dataset\.arrastre \|\| 'quieta', evento\)/.test(GESTOS_LIMPIO), 'la hoja pasa por la máquina: `pasar(caja, evento)` es quien escribe `data-arrastre`');
ok((GESTOS_LIMPIO.match(/dataset\.arrastre = /g) || []).length === 1, '🚨 …y es el ÚNICO sitio que lo escribe: ni un booleano disperso ni un estado puesto a mano (apartado 36)');
ok(/pasar\(caja, 'recuperar'\)/.test(GESTOS_LIMPIO), 'la vuelta de emergencia también pasa por la máquina');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. El velo responde al gesto (apartados 15, 16 y 33) ──');

ok(veloDuranteArrastre('rgba(15, 15, 18, 0.5)', 0) === 'rgba(15, 15, 18, 0.5)', 'con la hoja en su sitio, el velo de siempre');
ok(veloDuranteArrastre('rgba(15, 15, 18, 0.5)', 1) === `rgba(15, 15, 18, ${Math.round(0.5 * (1 - ACLARADO_MAXIMO) * 1000) / 1000})`, `con la hoja abajo del todo, un ${Math.round(ACLARADO_MAXIMO * 100)} % más claro: lo de debajo recupera protagonismo`);
{
  const alfa = (c) => Number(/,\s*([\d.]+)\)$/.exec(c)[1]);
  const serie = [0, 0.25, 0.5, 0.75, 1].map((p) => alfa(veloDuranteArrastre('rgba(0, 0, 0, 0.6)', p)));
  ok(serie.every((a, i) => i === 0 || a < serie[i - 1]), `se aclara en proporción a lo que baja la hoja (${serie.join(' → ')}): *"gesture 50 % → element 50 %"* (apartado 10)`);
  ok(alfa(veloDuranteArrastre('rgba(0, 0, 0, 0.6)', 7)) === alfa(veloDuranteArrastre('rgba(0, 0, 0, 0.6)', 1)) && alfa(veloDuranteArrastre('rgba(0, 0, 0, 0.6)', -3)) === 0.6, 'se topa: ni más claro que el máximo, ni más oscuro que el suyo');
}
ok(veloDuranteArrastre('rgb(0, 0, 0)', 0.5) === 'rgba(0, 0, 0, 0.7)', 'un color sin alfa se lee como opaco');
ok(veloDuranteArrastre('transparent', 0.5) === null && veloDuranteArrastre(null, 0.5) === null, 'un fondo que no sabe leer no se toca (devuelve `null`)');
ok(/aclarar\(g, g\.actual \/ g\.alto\)/.test(GESTOS_LIMPIO), 'el asa aclara el velo mientras el dedo arrastra, con lo que ha bajado la hoja');
ok(/id: 'asa-velo'/.test(GESTOS_LIMPIO) && /duration: duracionMs, easing: CURVAS_MOTION\.standard, id: 'asa-velo'/.test(GESTOS_LIMPIO), 'si la hoja vuelve, el velo vuelve con ella y en su mismo tiempo');
ok(/a\.id === 'asa-velo' \|\| a\.id === 'capa-velo'/.test(GESTOS_LIMPIO), 'agarrar la hoja para la vuelta del velo y su entrada (F6): manda el dedo (apartado 35)');
ok(/veloOriginal/.test(GESTOS_LIMPIO), 'el color de partida se apunta UNA vez: un segundo gesto no toma por bueno el velo aclarado del primero');
ok(/g\.velo\.style\.backgroundColor = g\.fondo;\s*pasar\(caja, 'recuperar'\)/.test(GESTOS_LIMPIO), '🚨 si la hoja vuelve de emergencia, su velo también: nada de un velo a medias (apartado 33)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Un solo dedo (apartado 34) y un gesto que se pierde (apartado 33) ──');

ok(punteroQueCuenta(null, { pointerId: 3 }), 'sin gesto, cualquier dedo puede empezar uno');
ok(punteroQueCuenta({ id: 3 }, { pointerId: 3 }), 'el dedo que lo empezó lo mueve');
ok(!punteroQueCuenta({ id: 3 }, { pointerId: 7 }), '🚨 un segundo dedo no: ni lo mueve ni lo suelta');
ok(punteroQueCuenta({ id: 3 }, {}) && punteroQueCuenta({}, { pointerId: 7 }), 'sin id que comparar (un evento sin puntero), se deja pasar: mejor que dejar el gesto colgado');
ok(!punteroQueCuenta({ id: 3 }, null), 'sin evento, no cuenta');
const g = { muestras: [{ t: 1000 }] };
ok(!gestoAbandonado(g, { timeStamp: 1000 + GESTO_ABANDONADO_MS - 1 }), 'un gesto con muestras recientes es de alguien: no se le quita');
ok(gestoAbandonado(g, { timeStamp: 1000 + GESTO_ABANDONADO_MS + 1 }), `uno que lleva más de ${GESTO_ABANDONADO_MS} ms sin muestras es un dedo que se levantó donde no se le oyó: no bloquea el siguiente`);
ok(!gestoAbandonado(g, { timeStamp: 999999 }, true), '🚨 …salvo que su puntero siga capturado: un dedo QUIETO tampoco manda muestras, y un segundo dedo no se lo quita');
ok(gestoAbandonado(null, { timeStamp: 5 }), 'sin gesto, no hay nada que proteger');
ok(!gestoAbandonado({ muestras: [] }, { timeStamp: 5000 }) && !gestoAbandonado(g, {}), 'sin una hora que comparar, no se da por perdido');
ok((GESTOS_LIMPIO.match(/gestoAbandonado\(gesto\.current, ev, capturando\(gesto\.current\)\)/g) || []).length === 2, 'el asa y el deslizar entre ejercicios no empiezan un segundo gesto encima del primero');
ok((GESTOS_LIMPIO.match(/punteroQueCuenta\(g, ev\)/g) || []).length >= 4, '…y solo el dedo del gesto lo mueve y lo suelta (asa y deslizar)');
ok(/hasPointerCapture\(g\.id\)/.test(GESTOS_LIMPIO) && /captor/.test(GESTOS_LIMPIO), 'el dedo sigue apoyado mientras el elemento tenga su puntero capturado (`hasPointerCapture`)');
ok(/if \(!g \|\| !caja \|\| \(ev && !punteroQueCuenta\(g, ev\)\)\) return;\s*gesto\.current = null;/.test(GESTOS_LIMPIO), '🐛 el `pointerup` de otro dedo ya no borra el gesto ANTES de mirar de quién es');
ok(/arrastrando\.current = \{ id: ev\.pointerId \}/.test(COMPARADOR) && !/arrastrando\.current = true/.test(COMPARADOR), '🐛 el divisor del comparador guarda QUÉ dedo lo lleva, no un booleano que encendía cualquiera (apartado 36)');
ok((COMPARADOR.match(/punteroQueCuenta\(/g) || []).length >= 4, '…y el divisor y la imagen ampliada solo obedecen a ese dedo: con dos, ya no saltan entre ellos');
ok((COMPARADOR.match(/onPointerCancel=/g) || []).length >= 2, '…y un gesto que cancela el sistema los suelta');
ok(DEPENDENCIAS_PERMITIDAS.some((d) => d.modulo === 'fisicaMotion' && d.solo && d.solo.includes('punteroQueCuenta')), 'Fitness declara la dependencia, con lo único que presta (FIT F44)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Los puntos hápticos (apartado 22) ──');

ok(PUNTOS_HAPTICOS.length >= 5 && PUNTOS_HAPTICOS.every((p) => p.punto && p.cuando && p.porque && typeof p.seEmite === 'boolean'), 'cada punto semántico dice cuándo, si se emite y por qué');
ok(PUNTOS_HAPTICOS.filter((p) => p.seEmite).every((p) => p.evento && definicionEvento(p.evento)), '🚨 los que se emiten lo hacen con un evento que EXISTE en el bus (FIT F9: un evento que no existe no suena)');
ok(PUNTOS_HAPTICOS.some((p) => p.evento === EVENTO_SERIE_HECHA) && PUNTOS_HAPTICOS.some((p) => p.evento === EVENTO_FIN_DESCANSO), '…y son los que ya emite el entrenamiento en vivo, leídos de su constante');
ok(PUNTOS_HAPTICOS.filter((p) => !p.seEmite).every((p) => p.evento === null), 'los que no se emiten no fingen un evento');
ok(!/navigator\.vibrate|emitir\(/.test(GESTOS_LIMPIO), 'ningún gesto vibra ni suena por su cuenta: lo que vibra va por el bus');
ok(/iOS 17\.4/.test(leer('src/lib/fisicaMotion.js')) && /palancaHaptica/.test(leer('src/lib/audioEngine.js')), '⚠️ y se dice la verdad: el iPhone SÍ puede dar un toque (el interruptor de iOS 17.4+ del motor de audio)');
ok(/botón/.test(POR_QUE_NO_VIBRA_EL_GESTO), '…y por qué el gesto no lo da: no puede sentirse distinto que el botón que hace lo mismo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Accesibilidad (apartado 39): ningún gesto es la única forma ──');

ok(/aria-hidden/.test(GESTOS) && /sm:hidden/.test(GESTOS), 'el asa es un añadido para el dedo: sin nombre ni foco, y sin asa en una pantalla ancha');
{
  const conAsa = [];
  const recorrer = (dir) => {
    for (const n of readdirSync(join(RAIZ, dir), { withFileTypes: true })) {
      const p = `${dir}/${n.name}`;
      if (n.isDirectory()) recorrer(p);
      else if (/\.jsx$/.test(n.name) && p !== 'src/components/gestosMotion.jsx' && /<AsaHoja\b/.test(leer(p))) conAsa.push(p);
    }
  };
  recorrer('src');
  const sinBoton = conAsa.filter((p) => !/aria-label="Cerrar|aria-label=\{`Cerrar|BotonCerrarHoja|label="Cerrar|Cerrar<|>Cancelar</.test(leer(p)));
  ok(conAsa.length >= 6, `${conAsa.length} archivos con hojas que se arrastran`);
  ok(sinBoton.length === 0, `🚨 todos tienen también un botón para cerrar (${sinBoton.join(', ') || 'ninguno sin él'})`);
}
ok(/onKeyDown=\{teclado\}|onKeyDown=\{\(ev\)/.test(leer('src/components/comparadorFotos.jsx')), 'el divisor del comparador también se mueve con las flechas del teclado');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. El mapa, la auditoría y lo que no se hace ──');

const mapa = (id) => MOTION_MAP.find((e) => e.id === id);
ok(mapa('velo_sigue_al_dedo')?.fase === 8 && mapa('velo_sigue_al_dedo')?.componente === 'AsaHoja', 'el MOTION_MAP tiene el velo que sigue al dedo');
ok(/UN dedo/.test(mapa('comparador')?.interaccion || ''), '…y el comparador dice que es de un dedo');
const aud = auditarMotion({ css: leer('src/index.css'), vistas: {} });
ok(aud.sinMapa.length === 0 && aud.keyframesHuerfanos.length === 0, 'la auditoría de la F0 sigue limpia');
ok(AUDITORIA_F8.length >= 8 && AUDITORIA_F8.every((a) => a.que && a.fisica && a.queda), `la auditoría de la física actual (apartado 1): ${AUDITORIA_F8.length} piezas con lo que hacen y lo que queda`);
ok(NO_EN_F8.length >= 4 && NO_EN_F8.every((n) => n.que && n.porque), 'lo que no se construye, con su motivo');
ok(NO_EN_F8.some((n) => /anclaje/i.test(n.que)) && NO_EN_F8.some((n) => /C-32/.test(n.porque)), '…los puntos de anclaje (ninguna hoja tiene dos alturas) y el pellizco (C-32, de Josué)');

console.log('\n── 9. La documentación ──');
const SIS = leer('docs/MOTION_SYSTEM.md');
ok(/siguienteEstadoGesto/.test(SIS) && /punteroQueCuenta/.test(SIS) && /JERARQUIA_MUELLES/.test(SIS), 'MOTION_SYSTEM.md tiene las reglas de la F8: muelles, estados y un solo dedo');
ok(/\*\*F8\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F8');
ok(/C-59/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), 'C-59 está escrita');

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
