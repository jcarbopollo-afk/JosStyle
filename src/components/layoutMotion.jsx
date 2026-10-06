import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { contextoDelDocumento, duracionMs, distancia, escala, CURVAS_MOTION } from '../lib/motion';
import {
  PRESUPUESTO_LAYOUT, planDeLista, cambioDeDiseno, escalaDe, FUENTES_DE_LA_APP, TOPE_FUENTES_MS,
} from '../lib/layoutMotion';
import { animarOrquestado, cancelarDe, planificarLinea } from '../lib/orquestadorMotion';

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F10 — LAS PIEZAS DE REACT DEL DISEÑO QUE CAMBIA

   El plan (qué entra, qué sale, qué se recoloca, cuánto) lo decide
   `src/lib/layoutMotion.js`; aquí solo se mide y se aplica.

   · `ListaAnimada` — una lista que él edita. Cada fila lleva `data-flip-id`
     con su id (nunca el índice). Mide JUSTO ANTES de cada cambio
     (`getSnapshotBeforeUpdate`) y justo después, así que nunca compara con una
     medida vieja y, si llega un cambio a mitad de otro, sale desde donde se ve
     la fila en ese momento (apartado 44: ni saltos ni teletransportes).
   · `Plegable` — algo que se abre y se cierra en su sitio: la altura crece y
     decrece con `grid-template-rows` (la técnica de los acordeones de Inicio,
     SC F1), así que lo de debajo se mueve con ella.
   · `useFuentesListas` — no pintar la aplicación hasta que estén las fuentes
     (o hasta un tope), para que el primer Hoy no cambie de ancho.
   ═══════════════════════════════════════════════════════════════════════════ */

const useEfectoDeDiseno = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function filasDe(raiz) {
  if (!raiz || typeof raiz.querySelectorAll !== 'function') return [];
  /* Solo las suyas: una lista dentro de otra mide las de dentro ella sola. */
  return [...raiz.querySelectorAll('[data-flip-id]')].filter((el) => el.closest('[data-lista-animada]') === raiz);
}

/** Las medidas de una lista: cada fila relativa a su bloque (o a la lista) y a la lista. */
export function medirLista(raiz) {
  if (!raiz || typeof raiz.getBoundingClientRect !== 'function') return null;
  const filas = filasDe(raiz);
  if (filas.length > PRESUPUESTO_LAYOUT.maxMedidos) return null;
  const caja = raiz.getBoundingClientRect();
  const esc = escalaDe(caja.width, raiz.offsetWidth);
  const enLista = new Set(filas);
  const rects = new Map(filas.map((el) => [el, el.getBoundingClientRect()]));
  const borde = { left: raiz.clientLeft || 0, top: raiz.clientTop || 0 };
  const medidas = {};
  const nodos = {};
  filas.forEach((el) => {
    const r = rects.get(el);
    const arriba = el.parentElement ? el.parentElement.closest('[data-flip-id]') : null;
    const padre = arriba && enLista.has(arriba) ? arriba : null;
    const base = padre ? rects.get(padre) : caja;
    const id = el.dataset.flipId;
    medidas[id] = {
      x: (r.left - base.left) / esc,
      y: (r.top - base.top) / esc,
      w: r.width / esc,
      h: r.height / esc,
      padre: padre ? padre.dataset.flipId : null,
      xr: (r.left - caja.left) / esc - borde.left,
      yr: (r.top - caja.top) / esc - borde.top,
    };
    nodos[id] = el;
  });
  return { medidas, nodos, ancho: raiz.offsetWidth, arriba: caja.top };
}

function sacarCopia(raiz, nodo, m, ctx) {
  if (!nodo || nodo.isConnected || typeof nodo.cloneNode !== 'function') return;
  const copia = nodo.cloneNode(true);
  [copia, ...copia.querySelectorAll('[data-flip-id], [id]')].forEach((n) => {
    n.removeAttribute('data-flip-id');
    n.removeAttribute('id');
  });
  /* Inerte: ni el lector de pantalla ni el foco la encuentran (apartado 41). */
  copia.setAttribute('aria-hidden', 'true');
  copia.setAttribute('inert', '');
  copia.setAttribute('data-lista-saliendo', 'si');
  Object.assign(copia.style, {
    position: 'absolute', left: `${m.xr}px`, top: `${m.yr}px`, width: `${m.w}px`, height: `${m.h}px`,
    margin: '0', pointerEvents: 'none', boxSizing: 'border-box',
  });
  raiz.appendChild(copia);
  const quitar = () => { if (copia.parentNode) copia.parentNode.removeChild(copia); };
  const fotogramas = ctx.espacial
    ? [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: `scale(${escala('micro', ctx)})` }]
    : [{ opacity: 1 }, { opacity: 0 }];
  const ms = duracionMs('fast', ctx);
  const a = animarOrquestado(copia, fotogramas, { duration: ms, easing: CURVAS_MOTION.exit, fill: 'forwards' }, { sistema: 'layout', id: 'lista-sale' });
  if (!a) { quitar(); return; }
  a.onfinish = quitar;
  a.oncancel = quitar;
  /* Por si la pestaña se esconde a mitad: una copia nunca se queda. */
  setTimeout(quitar, ms + 250);
}

/** Aplica el plan: lo que sale, lo que se recoloca y lo que entra. */
export function animarLista(raiz, antes) {
  const ctx = contextoDelDocumento();
  if (!raiz || !antes || ctx.apagado) return null;
  /* Primero se cancela lo que estaba en marcha (ya se midió dónde se veía),
     para medir dónde queda cada fila de verdad. Es del orquestador (MS F11):
     solo lo suyo —lo de la lista—, nunca lo que otro sistema mueve en la fila. */
  filasDe(raiz).forEach((el) => cancelarDe(el, 'layout'));
  const ahora = medirLista(raiz);
  if (!ahora || cambioDeDiseno(antes.ancho, ahora.ancho)) return null;
  const alto = typeof window !== 'undefined' ? window.innerHeight : Infinity;
  const plan = planDeLista(antes.medidas, ahora.medidas, { arriba: ahora.arriba, alto });
  if (plan.saltar) {
    animarOrquestado(raiz, [{ opacity: 0.4 }, { opacity: 1 }], { duration: duracionMs('fast', ctx), easing: CURVAS_MOTION.standard }, { sistema: 'layout', id: 'lista-entera' });
    return plan;
  }
  plan.salidas.forEach((id) => sacarCopia(raiz, antes.nodos[id], antes.medidas[id], ctx));
  /* MS F11 — la secuencia es una línea de tiempo, no un número suelto: lo que sale empieza, y a MITAD de su
     salida lo demás se recoloca y lo nuevo entra (*"item → exit → remaining items move"*). */
  const linea = planificarLinea([
    { id: 'sale', duracion: plan.salidas.length ? duracionMs('fast', ctx) : 0 },
    { id: 'recoloca', duracion: duracionMs('normal', ctx), despuesDe: 'sale', solape: 0.5 },
  ]);
  const espera = linea.pasos[1].inicio;
  if (ctx.espacial) {
    plan.movidos.forEach(({ id, dx, dy }) => {
      const el = ahora.nodos[id];
      if (!el) return;
      animarOrquestado(el, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: duracionMs('normal', ctx), easing: CURVAS_MOTION.standard, delay: espera, fill: 'backwards' }, { sistema: 'layout', id: 'lista-recoloca' });
    });
  }
  plan.entradas.forEach((id) => {
    const el = ahora.nodos[id];
    if (!el) return;
    const fot = ctx.espacial
      ? [{ opacity: 0, transform: `translateY(${distancia('small', ctx)}px)` }, { opacity: 1, transform: 'none' }]
      : [{ opacity: 0 }, { opacity: 1 }];
    animarOrquestado(el, fot, { duration: duracionMs('normal', ctx), easing: CURVAS_MOTION.entrance, delay: espera, fill: 'backwards' }, { sistema: 'layout', id: 'lista-entra' });
  });
  return plan;
}

/**
 * Una lista que él edita (apartados 10-14). Cada fila —o su envoltorio— lleva
 * `data-flip-id` con su id; un bloque que agrupa filas también puede llevarlo,
 * y entonces la fila se mide dentro de su bloque y no se mueve dos veces.
 *
 *   <ListaAnimada className="space-y-2">
 *     {tareas.map((t) => <div key={t.id} data-flip-id={`t-${t.id}`}>…</div>)}
 *   </ListaAnimada>
 *
 * La primera vez no anima nada: la pantalla ya está entrando.
 */
export class ListaAnimada extends React.Component {
  constructor(props) {
    super(props);
    this.raiz = React.createRef();
  }

  getSnapshotBeforeUpdate() {
    return medirLista(this.raiz.current);
  }

  componentDidUpdate(_props, _estado, antes) {
    animarLista(this.raiz.current, antes);
  }

  render() {
    const { as: Etiqueta = 'div', className = '', children, ...resto } = this.props;
    return (
      <Etiqueta ref={this.raiz} className={`lista-animada ${className}`.trim()} data-lista-animada="" {...resto}>
        {children}
      </Etiqueta>
    );
  }
}

/**
 * Algo que se abre y se cierra en su sitio (apartados 17, 18 y 28; C-54). La
 * altura crece de 0 a su contenido —sin escribir ninguna altura— y, al
 * cerrarse, decrece y DESPUÉS se desmonta, así que lo de debajo sube con ella
 * en vez de saltar. Mientras se mueve recorta lo de dentro; quieto, no (un halo
 * de foco no se corta). En Reducido cambia de altura sin animarse.
 *
 * Lo de dentro puede ir como función —`<Plegable abierto={x}>{() => …}</Plegable>`—
 * para que, cerrado, no se calcule nada: es lo que hacía `{x && …}`.
 */
export function Plegable({ abierto, className = '', style, children, ...resto }) {
  const [estado, setEstado] = useState(abierto ? 'abierto' : 'cerrado');
  const caja = useRef(null);

  useEfectoDeDiseno(() => {
    if (abierto) {
      setEstado((e) => (e === 'cerrado' ? 'montado' : e === 'cerrando' ? 'abriendo' : e));
    } else {
      const ctx = contextoDelDocumento();
      /* Sin movimiento (o en Reducido) no hay nada que esperar: se va ya. */
      setEstado((e) => (e === 'cerrado' ? e : (ctx.apagado || !ctx.espacial) ? 'cerrado' : 'cerrando'));
    }
  }, [abierto]);

  /* Mientras se cierra, lo de dentro no se puede alcanzar con el teclado ni con
     el lector de pantalla. `inert` va por el DOM: React 18 no lo conoce. */
  useEfectoDeDiseno(() => {
    const dentro = caja.current && caja.current.firstElementChild;
    if (!dentro) return;
    if (estado === 'cerrando') dentro.setAttribute('inert', '');
    else dentro.removeAttribute('inert');
  }, [estado]);

  useEfectoDeDiseno(() => {
    if (estado === 'montado') {
      /* Se lee la altura en 0 antes de pasar a 1fr: así la transición arranca. */
      if (caja.current) void caja.current.offsetHeight;
      setEstado('abriendo');
      return undefined;
    }
    if (estado !== 'abriendo' && estado !== 'cerrando') return undefined;
    const ctx = contextoDelDocumento();
    const fin = estado === 'abriendo' ? 'abierto' : 'cerrado';
    const terminar = () => setEstado((e) => (e === estado ? fin : e));
    const t = setTimeout(terminar, duracionMs('normal', ctx) + 80);
    const el = caja.current;
    const alAcabar = (ev) => { if (ev.target === el && ev.propertyName === 'grid-template-rows') terminar(); };
    if (el) el.addEventListener('transitionend', alAcabar);
    return () => { clearTimeout(t); if (el) el.removeEventListener('transitionend', alAcabar); };
  }, [estado]);

  if (estado === 'cerrado') return null;
  const expandido = estado === 'abriendo' || estado === 'abierto';
  return (
    <div ref={caja} className="plegable" data-plegable={estado} style={{ gridTemplateRows: expandido ? '1fr' : '0fr' }}>
      <div className="plegable-dentro" aria-hidden={estado === 'cerrando' || undefined}>
        <div className={`despliegue-entra ${className}`.trim()} style={style} {...resto}>
          {typeof children === 'function' ? children() : children}
        </div>
      </div>
    </div>
  );
}

/**
 * Apartado 6 — pide las fuentes mientras se cargan los datos y dice cuándo están
 * (o cuándo se ha llegado al tope). Sin la API de fuentes, ya están.
 */
export function useFuentesListas(tope = TOPE_FUENTES_MS) {
  const [listas, setListas] = useState(() => (
    typeof document === 'undefined' || !document.fonts || typeof document.fonts.load !== 'function'
  ));
  useEffect(() => {
    if (listas) return undefined;
    let vivo = true;
    const hecho = () => { if (vivo) setListas(true); };
    const t = setTimeout(hecho, tope);
    Promise.all(FUENTES_DE_LA_APP.map((f) => document.fonts.load(f).catch(() => null))).then(hecho, hecho);
    return () => { vivo = false; clearTimeout(t); };
  }, [listas, tope]);
  return listas;
}
