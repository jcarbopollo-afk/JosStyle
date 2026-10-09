import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  contextoDelDocumento, EVENTO_MOTION, animar, siguientePresencia, estaMontado,
  deltaFlip, duracionMs, CURVAS_MOTION,
} from '../lib/motion';
import { giroDeChevron, siguienteLatido, claseDeLatido, siguienteIcono } from '../lib/microinteraccionesMotion';
import { animarOrquestado } from '../lib/orquestadorMotion';
import { animacionDeGrafica, animacionDeTooltip, planDeCifra, interpolarCifra, curvaDeCuenta, reservarCuenta, liberarCuenta } from '../lib/datosMotion';

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F1 — LAS PIEZAS DE REACT DEL MOTOR

   La lógica vive en `src/lib/motion.js` (se prueba en Node); aquí solo está lo
   que necesita React: leer el contexto y volver a pintar cuando cambia,
   montar y desmontar con su animación (`Presencia`) y el FLIP de una lista
   (`useFlip`).

   🚨 **Ningún componente nuevo escribe su propia animación** (apartado 24): usa
   una clase de `index.css`, `transicion()`/`escalonado()` o estas piezas.
   =========================================================================== */

/* En el servidor (el banco de renderizado) `useLayoutEffect` no hace nada y
   React lo avisa por consola: allí basta con `useEffect`, que tampoco corre. */
const useEfectoDeDiseno = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * El contexto de movimiento de ahora —modo, velocidad, intensidad, si está
 * reducido— y se vuelve a leer cuando él cambia un ajuste (el aviso que lanza
 * `App.jsx`) o cuando cambia el «Reducir movimiento» del sistema.
 */
export function useMotion() {
  const [ctx, setCtx] = useState(() => contextoDelDocumento());
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const leer = () => setCtx(contextoDelDocumento());
    window.addEventListener(EVENTO_MOTION, leer);
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', leer); else if (mq.addListener) mq.addListener(leer); }
    return () => {
      window.removeEventListener(EVENTO_MOTION, leer);
      if (mq) { if (mq.removeEventListener) mq.removeEventListener('change', leer); else if (mq.removeListener) mq.removeListener(leer); }
    };
  }, []);
  return ctx;
}

/**
 * Monta y desmonta su contenido con una animación de entrada y otra de salida
 * (apartado 9), con la máquina de `siguientePresencia`:
 *   · al ocultar NO desaparece de golpe: sale, y solo entonces se desmonta;
 *   · desmontado, no ocupa espacio;
 *   · si se vuelve a mostrar a mitad de la salida, **invierte desde donde está**
 *     (apartado 12) sin desmontarse ni volver a montarse: ni parpadeo ni doble
 *     montaje.
 * Con «Sin movimiento» entra y sale al instante; en Reducido, con un fundido.
 */
export function Presencia({ visible, entrada = 'modalEnter', salida = 'modalExit', animarAlMontar = true, onSalida, className, style, children, ...resto }) {
  const [estado, setEstado] = useState(() => (visible ? (animarAlMontar ? 'entrando' : 'visible') : 'oculto'));
  const ref = useRef(null);
  const onSalidaRef = useRef(onSalida);
  onSalidaRef.current = onSalida;

  useEffect(() => {
    setEstado((e) => siguientePresencia(e, visible ? 'mostrar' : 'ocultar'));
  }, [visible]);

  useEfectoDeDiseno(() => {
    const el = ref.current;
    if (!el || (estado !== 'entrando' && estado !== 'saliendo')) return undefined;
    const a = animar(el, estado === 'entrando' ? entrada : salida);
    const terminar = () => {
      setEstado((e) => siguientePresencia(e, 'fin'));
      if (estado === 'saliendo' && onSalidaRef.current) onSalidaRef.current();
    };
    if (!a) { terminar(); return undefined; }
    let vivo = true;
    a.finished.then(() => { if (vivo) terminar(); }, () => { /* cancelada por una interrupción: la sigue la nueva */ });
    return () => { vivo = false; };
  }, [estado, entrada, salida]);

  if (!estaMontado(estado)) return null;
  return (
    <div ref={ref} className={className} style={style} data-presencia={estado} {...resto}>
      {children}
    </div>
  );
}

/**
 * MS F2, apartado 15 — UNA TRANSICIÓN DE CONTENIDO, NO DE PÁGINA. Envuelve lo
 * que cambia con una pestaña de dentro de una pantalla (Comidas · Agua ·
 * Favoritos…): al cambiar `clave`, lo nuevo entra con un fundido corto y sin
 * moverse (`contenido-cambia`, preset `contentChange`), y la pantalla se queda
 * donde está —ni barra de volver que entre otra vez, ni scroll que salte—.
 *
 * ⚠️ La primera vez no anima: la pantalla ya está entrando con su transición de
 * página, y las dos a la vez serían un doble fundido (apartado 28). Solo cuando
 * la clave cambia.
 */
export function CambioDeContenido({ clave, className = '', children, ...resto }) {
  const inicial = useRef(clave);
  const cambiado = useRef(false);
  if (clave !== inicial.current) cambiado.current = true;
  return (
    <div key={clave} className={`${cambiado.current ? 'contenido-cambia ' : ''}${className}`.trim() || undefined} data-contenido={String(clave)} {...resto}>
      {children}
    </div>
  );
}

/**
 * MS F3, apartados 14 y 27 — EL CHEVRON DE UN DESPLEGABLE GIRA; NO SE CAMBIA POR OTRO.
 * Veinte desplegables cambiaban `ChevronDown` por `ChevronUp` (o por `ChevronRight`)
 * de golpe. Éste es siempre el mismo icono, y su giro (`giroDeChevron`) lo anima la clase
 * `chevron-gira` de `index.css`: en Reducido llega a su sitio sin girar.
 *   · `cerrado`: hacia dónde apunta cerrado (`abajo` o `derecha`);
 *   · `alAbrir`: hacia dónde apunta abierto (`arriba` o `abajo`).
 */
export function ChevronDespliegue({ abierto, cerrado = 'abajo', alAbrir = 'arriba', size = 16, style, className = '', ...resto }) {
  const giro = giroDeChevron({ abierto, cerrado, alAbrir });
  return (
    <ChevronDown
      size={size}
      aria-hidden="true"
      data-abierto={abierto ? 'true' : 'false'}
      className={`chevron-gira ${className}`.trim()}
      style={{ ...style, '--giro': `${giro}deg` }}
      {...resto}
    />
  );
}

/**
 * MS F3, apartado 29 — UNA MARCA LATE AL PONERLA. Envuelve el icono de un favorito (una
 * estrella, un corazón): cuando `activo` pasa de no a sí, late una vez (`favorito-guardado`,
 * `favoritoPulso`). Al quitarla no late —el color ya lo dice— y al pintarse por primera vez
 * tampoco: una lista de favoritos que latiera entera al abrirse no diría nada. En Reducido el
 * pulso es 1 (el token), así que solo cambia el color.
 */
export function LatidoAlMarcar({ activo, children, className = '', latido = 'favorito' }) {
  const estado = useRef(null);
  estado.current = siguienteLatido(estado.current, activo);
  const { veces, late } = estado.current;
  return (
    <span key={veces} className={`inline-flex ${late ? `${claseDeLatido(latido)} ` : ''}${className}`.trim()} data-latido={veces}>
      {children}
    </span>
  );
}

/**
 * MS F18, apartado 20 — UN ICONO QUE CAMBIA DE SENTIDO NO SALTA: play ↔ pausa, ⋯ ↔ ✕, ＋ ↔ ✓. Envuelve el
 * icono y le da su `clave` (lo que significa ahora); cuando cambia después de pintarse, el nuevo aparece en
 * el sitio del de antes (`icono-cambia`). Al abrir la pantalla no se mueve nada. No es un morfismo de
 * trazos —Lucide dibuja cada icono aparte—: es la transición contextual que el apartado acepta en su lugar.
 */
export function IconoQueCambia({ clave, children, className = '' }) {
  const estado = useRef(null);
  estado.current = siguienteIcono(estado.current, clave);
  const { veces, cambia } = estado.current;
  return (
    <span key={veces} className={`inline-flex ${cambia ? 'icono-cambia ' : ''}${className}`.trim()} data-icono={clave}>
      {children}
    </span>
  );
}

/**
 * MS F4, apartados 21-27 — LAS PROPS DE MOVIMIENTO DE UNA GRÁFICA DE RECHARTS. Recharts anima
 * con JavaScript y no se enteraba de los modos ni de «Reducir movimiento»: se le pasan a la
 * serie (`linea`) y al tooltip (`tooltip`), y se vuelven a leer si él cambia un ajuste.
 */
export function useAnimacionDeGrafica() {
  const ctx = useMotion();
  return { linea: animacionDeGrafica(ctx), tooltip: animacionDeTooltip(ctx) };
}

/**
 * MS F4, apartados 2-6 — UNA CIFRA QUE CAMBIA. `valor` es el número; lo que se pinta es
 * `children` (el texto ya formateado, con su símbolo y sus separadores) o `formato(valor)`.
 *   · `modo="relevo"` (por defecto): el valor nuevo ya está escrito, y entra con un fundido
 *     corto desde abajo si sube o desde arriba si baja;
 *   · `modo="cuenta"`: recorre los valores intermedios con la precisión de la cifra, y
 *     `formato` es lo que la escribe en cada paso (si no hay, con sus decimales). Al acabar
 *     se pinta exactamente `children`, así que el formato final no depende de la cuenta.
 * Nunca al aparecer, nunca desde un hueco (`null`), y como mucho `CUENTAS_A_LA_VEZ` a la vez.
 */
export function CifraQueCambia({ valor, children, formato, modo = 'relevo', duracion = 'auto', className = '' }) {
  const previo = useRef(valor);
  /* MS F17, apartado 6 — lo que se VE ahora mismo mientras cuenta: si el valor cambia a mitad, la
     cuenta nueva sale de aquí, no del objetivo de antes (ni de cero). */
  const visible = useRef(null);
  /* MS F17, apartado 7 — cuándo fue el último relevo: los que llegan seguidos se agrupan. */
  const ultimoRelevo = useRef(null);
  const [paso, setPaso] = useState(null);
  const [relevo, setRelevo] = useState({ n: 0, clase: '' });
  /* 🐛 MS F19 — se decide ANTES de pintar (efecto de diseño, como `useFlip`). Con `useEffect` el
     navegador pintaba un fotograma con el valor NUEVO quieto y después la cuenta volvía al de antes
     para subir (400 → 100 → 142…), y un relevo enseñaba el número nuevo un fotograma antes de su
     fundido. Lo cazó el recorrido de la F17 al dejar de leer a los 70 ms fijos. */
  useEfectoDeDiseno(() => {
    const desde = visible.current !== null ? visible.current : previo.current;
    previo.current = valor;
    const quiereContar = modo === 'cuenta';
    const turno = quiereContar ? reservarCuenta() : false;
    const ahora = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const plan = planDeCifra(desde, valor, {
      modo, ctx: contextoDelDocumento(), duracion, hayTurno: turno,
      desdeUltimo: ultimoRelevo.current === null ? null : ahora - ultimoRelevo.current,
    });
    if (!plan || plan.tipo !== 'cuenta') {
      if (turno) liberarCuenta();
      visible.current = null;
      setPaso(null);
      if (plan && plan.tipo === 'relevo') {
        ultimoRelevo.current = ahora;
        setRelevo((r) => ({ n: r.n + 1, clase: plan.clase }));
      }
      return undefined;
    }
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function' || plan.duracion <= 0) {
      liberarCuenta();
      visible.current = null;
      return undefined;
    }
    /* Un relevo de antes se quita: si su clase volviera a ponerse al acabar la cuenta, el
       navegador repetiría su animación. */
    setRelevo((r) => (r.clase ? { n: r.n, clase: '' } : r));
    let vivo = true;
    let inicio = null;
    let id = 0;
    const escribir = formato || ((v) => v.toFixed(plan.decimales));
    /* El primer fotograma ya es el de partida: el valor nuevo no se asoma antes de contar. */
    visible.current = plan.desde;
    setPaso(escribir(plan.desde));
    const avanzar = (instante) => {
      if (!vivo) return;
      if (inicio === null) inicio = instante;
      const t = (instante - inicio) / plan.duracion;
      if (t >= 1) { visible.current = null; setPaso(null); liberarCuenta(); vivo = false; return; }
      const v = interpolarCifra(plan.desde, plan.hasta, curvaDeCuenta(t), plan.decimales);
      visible.current = v;
      setPaso(escribir(v));
      id = window.requestAnimationFrame(avanzar);
    };
    id = window.requestAnimationFrame(avanzar);
    return () => {
      if (vivo) { vivo = false; liberarCuenta(); }
      window.cancelAnimationFrame(id);
      setPaso(null);
    };
  }, [valor]);
  const final = children !== undefined ? children : (formato ? formato(valor) : valor);
  const contando = paso !== null;
  const texto = contando ? paso : final;
  /* ♿ MS F17, apartado 9 — mientras cuenta, lo que se ve es decoración (`aria-hidden`) y el lector de
     pantalla tiene el valor FINAL al lado: no lee cada fotograma. Quieta, una sola cifra. */
  return (
    <>
      <span
        key={relevo.n}
        className={`cifra ${contando ? '' : relevo.clase} ${className}`.replace(/\s+/g, ' ').trim()}
        data-cifra={contando ? 'cuenta' : (relevo.clase || 'quieta')}
        aria-hidden={contando || undefined}
      >
        {texto}
      </span>
      {contando && <span className="sr-only">{final}</span>}
    </>
  );
}

/* La caja de un elemento relativa a su contenedor: así un desplazamiento de la
   página entre dos pintados no se confunde con un cambio de sitio. */
function cajaRelativa(el, base) {
  const r = el.getBoundingClientRect();
  return { left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height };
}

/**
 * El FLIP de una lista (apartado 10): cada hijo con `data-flip-id` que cambia
 * de sitio entre dos pintados viaja desde donde estaba, en vez de saltar. Se
 * mide DESPUÉS de cada cambio y se compara con lo medido la vez anterior, así
 * que no hace falta avisar antes de cambiar nada. En Reducido no se desplaza
 * nada (aparece en su sitio) y con «Sin movimiento» tampoco.
 */
export function useFlip(contenedorRef, clave) {
  const antes = useRef(new Map());
  useEfectoDeDiseno(() => {
    const cont = contenedorRef.current;
    if (!cont || typeof cont.querySelectorAll !== 'function') return;
    const base = cont.getBoundingClientRect();
    const hijos = [...cont.querySelectorAll('[data-flip-id]')];
    const ahora = new Map(hijos.map((el) => [el.dataset.flipId, cajaRelativa(el, base)]));
    const ctx = contextoDelDocumento();
    if (antes.current.size > 0 && ctx.espacial) {
      hijos.forEach((el) => {
        const d = deltaFlip(antes.current.get(el.dataset.flipId), ahora.get(el.dataset.flipId));
        if (!d) return;
        animarOrquestado(el, [{ transform: `translate(${d.dx}px, ${d.dy}px)` }, { transform: 'none' }],
          { duration: duracionMs('medium', ctx), easing: CURVAS_MOTION.standard }, { sistema: 'layout' });
      });
    }
    antes.current = ahora;
  }, [clave]);
}
