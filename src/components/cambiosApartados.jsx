/**
 * 🛡 HORARIOS · E1-R, R4 — LA PANTALLA DE CAMBIOS APARTADOS (docs/19 §18.18).
 *
 * Consultar las copias que el servidor apartó, inspeccionar cada una antes de decidir, recuperarla como un cambio
 * NUEVO y protegido (por el escritor de R2, sobre lo que hay ahora), y eliminarla solo cuando él lo pida. La lógica
 * está en `src/lib/cambiosApartados.js`; aquí solo se pinta y se pide. Quien habla con el servidor es `servicio`
 * (lo arma `App.jsx` sobre `transporteProtegido`):
 *   `listar()`, `espacio()`, `copia(id)`, `actual()` → `{ ok, data }` o `{ ok: false, sinRespuesta | sesion | sinFunciones }`;
 *   `marcarVista(id)`, `eliminar(id)` y `recuperar(fila, preparacion)` → lo que contestó, sin decidir nada.
 * Motion: el desplegable es `Plegable`, la lista `ListaAnimada` (cada copia con `data-flip-id`), los botones que
 * esperan llevan `estado="cargando"` (o `TextoDeBoton`) y el giro de carga su texto (`GiroDeCarga`). Nada propio.
 * 🛟 R5: las copias de rescate y de versión antigua se recuperan ELIGIENDO elemento a elemento (`ListaDePiezas`), y lo
 * que una versión anterior intentó guardar sin aplicarse se avisa sin abrir la pantalla (`servicio.nuevasDeVersionAntigua`).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Archive, CircleAlert, RotateCw } from 'lucide-react';
import { ChevronDespliegue } from './motion';
import { Plegable, ListaAnimada } from './layoutMotion';
import { GiroDeCarga } from './accesibilidadMotion';
import { useTurnos } from './estadosAsincronos';
import { Card, EmptyHint, TextoDeBoton } from './ui';
import { COLORS } from '../tokens';
import { hexToRgba } from '../lib/helpers';
import {
  TEXTOS_CAMBIOS_APARTADOS as T, describirCopia, textoDelEspacio, resumenDeCopia,
  prepararRecuperacion, estadoDeCopia, ESTADOS_COPIA, motivoDeLectura, motivoParaNoRecuperar, avisoDeVersionesAntiguas,
} from '../lib/cambiosApartados';

/** Las copias de un conflicto que sigue abierto: se eliminan con «Descartar mi cambio» de su aviso, no desde aquí. */
const copiasDelConflictoAbierto = (escritor) => new Set(escritor && escritor.conflicto ? (escritor.conflicto.copias || []).map((c) => c.copiaId).filter(Boolean) : []);

function Linea({ children, color = COLORS.textMuted, role }) {
  return <p role={role} className="text-[11px]" style={{ color }}>{children}</p>;
}

function BotonTexto({ onClick, children, color, estado, textoCargando, disabled, ariaLabel, destructivo = false }) {
  const ocupado = estado === 'cargando';
  return (
    <button
      type="button" onClick={ocupado ? undefined : onClick} disabled={disabled} aria-busy={ocupado || undefined} aria-label={ariaLabel}
      className={`text-xs font-semibold toque-44 disabled:opacity-40 ${destructivo ? 'toque-destructivo' : ''}`.trim()} style={{ color }}
    >
      {estado !== undefined ? <TextoDeBoton estado={estado} textoCargando={textoCargando}>{children}</TextoDeBoton> : children}
    </button>
  );
}

/** R5 — las piezas de una copia de rescate o de versión antigua: lo que sigue como estaba se elige; lo demás se dice. */
function ListaDePiezas({ copia, piezas, elegidas, onElegir, deshabilitada }) {
  return (
    <ul className="mt-1 space-y-0.5" aria-label={`Qué recuperar de: ${copia.titulo}`}>
      {piezas.map((p) => (p.estado === 'aplicable' && onElegir ? (
        <li key={p.id}>
          <label className="flex items-start gap-1.5 text-xs toque-44" style={{ color: COLORS.text }}>
            <input type="checkbox" checked={elegidas.includes(p.id)} onChange={() => onElegir(p.id)} disabled={deshabilitada}
              aria-label={p.texto} className="mt-0.5" data-pieza={p.id} />
            <span>{p.texto}</span>
          </label>
        </li>
      ) : (
        <li key={p.id} className="text-xs" style={{ color: p.estado === 'aplicable' ? COLORS.text : COLORS.textMuted }} data-pieza-estado={p.estado}>
          {p.texto}{p.estado === 'hecha' ? ` · ${T.piezaHecha}` : p.estado === 'choque' ? ` · ${T.piezaChoque}` : ''}
        </li>
      )))}
    </ul>
  );
}

/** El detalle de una copia: qué contiene, qué pasaría si se recupera ahora, y las dos acciones. Se exporta para probarlo. */
export function DetalleCopia({ copia, detalle, accion, puedeRecuperar, enConflictoAbierto, accent, onRecuperar, onEliminar, onConfirmar, onCancelar, onReintentar, elegidas = [], onElegir, onElegirTodo, onElegirNada }) {
  const color = accent || COLORS.info;
  if (!detalle || detalle.estado === 'cargando') return <div className="py-2 flex items-center gap-2"><GiroDeCarga texto="Leyendo la copia…" size={14} /><Linea>Leyendo la copia…</Linea></div>;
  if (detalle.estado === 'error') {
    return (
      <div className="py-1">
        <Linea role="alert" color={COLORS.negative}>{T[detalle.motivo] || T.error}</Linea>
        <BotonTexto onClick={onReintentar} color={color}><span className="inline-flex items-center gap-1"><RotateCw size={12} aria-hidden="true" /> {T.reintentar}</span></BotonTexto>
      </div>
    );
  }
  const fila = detalle.fila;
  const prep = detalle.prep;
  const estado = detalle.motivoActual ? ESTADOS_COPIA.sin_comprobar : estadoDeCopia(prep);
  const resumen = resumenDeCopia(fila);
  const porElementos = !!(prep && prep.estado === 'por_elementos');
  const aplicables = porElementos ? prep.piezas.filter((p) => p.estado === 'aplicable').map((p) => p.id) : [];
  const confirmando = accion && accion.fase !== 'listo' ? accion : null;
  return (
    <div className="pt-1 space-y-2" data-estado-copia={estado.id}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted }}>Qué contiene</p>
        {resumen.length === 0 ? <Linea>Nada que se pueda leer.</Linea> : (
          <ul className="space-y-0.5">
            {resumen.map((r) => <li key={r.clave} className="text-xs" style={{ color: COLORS.text }}><span className="font-semibold">{r.nombre}:</span> {r.frases.join(', ') || 'sin cambios'}</li>)}
          </ul>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted }}>Si la recuperas ahora</p>
        <p className="text-xs font-semibold" style={{ color: estado.id === 'pendiente' ? COLORS.text : estado.id === 'recuperada' ? COLORS.positive : COLORS.warning }}>{estado.nombre}</p>
        {detalle.motivoActual ? <Linea>{T[detalle.motivoActual] || T.error}</Linea> : null}
        {prep && prep.estado === 'recuperable' && <ul className="mt-0.5 space-y-0.5">{prep.resumen.map((l) => <li key={l} className="text-xs" style={{ color: COLORS.text }}>{l}</li>)}</ul>}
        {prep && prep.estado === 'ya_aplicada' && <Linea>{prep.resumen.join(' ')} {ESTADOS_COPIA.recuperada.explica}</Linea>}
        {prep && prep.estado === 'no_recuperable' && <Linea>{prep.texto}{prep.detalle ? ` ${prep.detalle}` : ''}</Linea>}
        {porElementos && <Linea>{T.elegirExplica}</Linea>}
        {prep && Array.isArray(prep.piezas) && prep.piezas.length > 0 && (
          <ListaDePiezas copia={copia} piezas={prep.piezas} elegidas={elegidas} onElegir={porElementos ? onElegir : null} deshabilitada={!!confirmando} />
        )}
        {porElementos && !confirmando && aplicables.length > 1 && (
          <div className="flex flex-wrap gap-x-4">
            <BotonTexto onClick={onElegirTodo} color={color}>{T.elegirTodo}</BotonTexto>
            {elegidas.length > 0 && <BotonTexto onClick={onElegirNada} color={COLORS.textMuted}>{T.elegirNada}</BotonTexto>}
          </div>
        )}
      </div>

      {accion && accion.resultado && (
        <Linea role={accion.resultado.ok ? 'status' : 'alert'} color={accion.resultado.ok ? COLORS.positive : COLORS.negative}>{accion.resultado.texto}</Linea>
      )}

      {confirmando && confirmando.tipo === 'recuperar' ? (
        <div className="rounded-xl p-2" style={{ background: hexToRgba(color, 0.08) }}>
          {confirmando.plan && Array.isArray(confirmando.plan.resumen) && (
            <ul className="mb-1 space-y-0.5">{confirmando.plan.resumen.map((l) => <li key={l} className="text-xs font-semibold" style={{ color: COLORS.text }}>{l}</li>)}</ul>
          )}
          <p className="text-xs" style={{ color: COLORS.text }}>{T.recuperarExplica}</p>
          <div className="mt-1 flex flex-wrap gap-x-4">
            <BotonTexto onClick={onConfirmar} color={color} estado={confirmando.fase === 'trabajando' ? 'cargando' : 'reposo'} textoCargando={T.recuperando} ariaLabel={`Recuperar ahora: ${copia.titulo}`}>{T.recuperarConfirmar}</BotonTexto>
            <BotonTexto onClick={onCancelar} color={COLORS.textMuted} disabled={confirmando.fase === 'trabajando'}>{T.eliminarNo}</BotonTexto>
          </div>
        </div>
      ) : confirmando && confirmando.tipo === 'eliminar' ? (
        <div className="rounded-xl p-2" style={{ background: hexToRgba(COLORS.negative, 0.08) }}>
          <p className="text-xs" style={{ color: COLORS.text }}>{T.eliminarConfirma}</p>
          <div className="mt-1 flex flex-wrap gap-x-4">
            <BotonTexto onClick={onConfirmar} color={COLORS.negative} destructivo estado={confirmando.fase === 'trabajando' ? 'cargando' : 'reposo'} textoCargando={T.eliminando} ariaLabel={`Eliminar la copia: ${copia.titulo}`}>{T.eliminarSi}</BotonTexto>
            <BotonTexto onClick={onCancelar} color={COLORS.textMuted} disabled={confirmando.fase === 'trabajando'}>{T.eliminarNo}</BotonTexto>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {prep && prep.estado === 'recuperable' && (
            <BotonTexto onClick={onRecuperar} color={color} disabled={!!puedeRecuperar} ariaLabel={`Recuperar: ${copia.titulo}`}>{T.recuperar}</BotonTexto>
          )}
          {porElementos && (
            <BotonTexto onClick={onRecuperar} color={color} disabled={!!puedeRecuperar || elegidas.length === 0} ariaLabel={`Recuperar lo elegido: ${copia.titulo}`}>{T.recuperarElegidos}</BotonTexto>
          )}
          <BotonTexto onClick={onEliminar} color={COLORS.negative} destructivo disabled={enConflictoAbierto} ariaLabel={`Eliminar: ${copia.titulo}`}>{T.eliminar}</BotonTexto>
          {prep && (prep.estado === 'recuperable' || porElementos) && puedeRecuperar ? <p className="w-full text-[11px]" style={{ color: COLORS.textMuted }}>{puedeRecuperar}</p> : null}
          {porElementos && !puedeRecuperar && elegidas.length === 0 ? <p className="w-full text-[11px]" style={{ color: COLORS.textMuted }}>{T.elegidosNinguno}</p> : null}
          {enConflictoAbierto ? <p className="w-full text-[11px]" style={{ color: COLORS.textMuted }}>{T.recuperarConConflicto}</p> : null}
        </div>
      )}
    </div>
  );
}

/** Una copia de la lista: su línea y, al abrirla, su detalle (se lee al abrirla, no antes). */
function FilaCopia({ copia, abierta, onAlternar, children }) {
  return (
    <div className="rounded-xl p-2.5" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
      <button type="button" onClick={onAlternar} aria-expanded={abierta} aria-label={`${copia.titulo}, ${copia.fecha}`} className="w-full flex items-start gap-2 text-left toque-44">
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold" style={{ color: COLORS.text }}>
            {copia.titulo}
            {copia.nueva ? <span className="ml-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.warning }}>{T.nueva}</span> : null}
          </span>
          <span className="block text-[11px]" style={{ color: COLORS.textMuted }}>{copia.fecha} · {copia.aparatoTexto}{copia.tamanoTexto ? ` · ${copia.tamanoTexto}` : ''}</span>
          {copia.motivoTexto ? <span className="block text-[11px]" style={{ color: COLORS.textMuted }}>{copia.motivoTexto}</span> : null}
        </span>
        <ChevronDespliegue abierto={abierta} size={16} style={{ color: COLORS.textMuted }} />
      </button>
      <Plegable abierto={abierta}>{() => children}</Plegable>
    </div>
  );
}

/** La pantalla, ya abierta. Se exporta para probarla con un `servicio` falso. */
export function CambiosApartados({ servicio, escritor = null, soloLectura = false, accent = null }) {
  const turnos = useTurnos();
  const vivo = useRef(true);
  /* Con `StrictMode` el efecto se deshace y se rehace sobre el mismo montaje: se vuelve a poner a `true` al rehacerse
     (si no, lo que llega después de abrir una copia no se pintaría nunca: se quedaba en «Leyendo la copia…»). */
  useEffect(() => { vivo.current = true; return () => { vivo.current = false; }; }, []);
  const [carga, setCarga] = useState({ estado: 'cargando', motivo: null });
  const [filas, setFilas] = useState([]);
  const [espacio, setEspacio] = useState(null);
  const [abiertas, setAbiertas] = useState({});
  const [detalles, setDetalles] = useState({});
  const [acciones, setAcciones] = useState({});
  const [avisoLista, setAvisoLista] = useState(null);
  const [elegidas, setElegidas] = useState({});
  const color = accent || COLORS.info;
  const aparato = servicio && servicio.aparato ? servicio.aparato : null;

  async function cargar() {
    if (!servicio) return;
    const t = turnos.nuevo();
    setCarga({ estado: 'cargando', motivo: null });
    try {
      const [rl, re] = await Promise.all([servicio.listar(), servicio.espacio()]);
      if (!t.vigente()) return;
      if (!rl || !rl.ok) { setCarga({ estado: 'error', motivo: motivoDeLectura(rl) }); return; }
      setFilas(Array.isArray(rl.data) ? rl.data : []);
      setEspacio(re && re.ok ? re.data : null);
      setCarga({ estado: 'listo', motivo: null });
    } catch {
      if (t.vigente()) setCarga({ estado: 'error', motivo: 'error' });
    }
  }
  const copiasEscritor = escritor && escritor.cuentas ? escritor.cuentas.copias : 0;
  useEffect(() => { cargar(); /* también cuando el servidor aparta una copia nueva */ }, [servicio, copiasEscritor]); // eslint-disable-line react-hooks/exhaustive-deps

  async function leerDetalle(fila) {
    setDetalles((d) => ({ ...d, [fila.id]: { estado: 'cargando' } }));
    try {
      const [rc, ra] = await Promise.all([servicio.copia(fila.id), servicio.actual()]);
      if (!vivo.current) return;
      if (!rc || !rc.ok) { setDetalles((d) => ({ ...d, [fila.id]: { estado: 'error', motivo: motivoDeLectura(rc) } })); return; }
      if (!rc.data) { setDetalles((d) => ({ ...d, [fila.id]: { estado: 'error', motivo: 'eliminadaYaNoEstaba' } })); return; }
      const actual = ra && ra.ok && ra.data && ra.data.estado === 'leidas' ? ra.data.claves : null;
      const prep = actual ? prepararRecuperacion({ fila: rc.data, actual }) : null;
      setDetalles((d) => ({ ...d, [fila.id]: { estado: 'listo', fila: rc.data, prep, actual, motivoActual: actual ? null : motivoDeLectura(ra) } }));
      /* Lo elegido se queda solo si sigue pudiéndose elegir (la cuenta ha podido cambiar). */
      const siguen = prep && prep.estado === 'por_elementos' ? prep.piezas.filter((p) => p.estado === 'aplicable').map((p) => p.id) : [];
      setElegidas((e) => ({ ...e, [fila.id]: (e[fila.id] || []).filter((id) => siguen.includes(id)) }));
      if (fila.vista === false && typeof servicio.marcarVista === 'function') {
        try { await servicio.marcarVista(fila.id); } catch { /* marcarla vista no es imprescindible */ }
      }
    } catch {
      if (vivo.current) setDetalles((d) => ({ ...d, [fila.id]: { estado: 'error', motivo: 'error' } }));
    }
  }

  const alternar = (fila) => {
    const abre = !abiertas[fila.id];
    setAbiertas((a) => ({ ...a, [fila.id]: abre }));
    if (abre) { setAcciones((x) => ({ ...x, [fila.id]: null })); leerDetalle(fila); }
  };

  const ponerAccion = (id, a) => setAcciones((x) => ({ ...x, [id]: a }));
  const alternarPieza = (id, pieza) => setElegidas((e) => {
    const ya = e[id] || [];
    return { ...e, [id]: ya.includes(pieza) ? ya.filter((x) => x !== pieza) : [...ya, pieza] };
  });
  const elegirTodo = (id) => {
    const det = detalles[id];
    const prep = det && det.prep;
    if (prep && prep.estado === 'por_elementos') setElegidas((e) => ({ ...e, [id]: prep.piezas.filter((p) => p.estado === 'aplicable').map((p) => p.id) }));
  };
  /* Pedir recuperar: en una copia de rescate o de versión antigua, primero se prepara el plan de lo elegido (lo que se
     confirma es exactamente eso); en las demás, la copia entera como en R4. */
  const pedirRecuperar = (id) => {
    const det = detalles[id];
    if (!det || !det.prep) return;
    if (det.prep.estado !== 'por_elementos') { ponerAccion(id, { tipo: 'recuperar', fase: 'confirmar', resultado: null }); return; }
    const plan = prepararRecuperacion({ fila: det.fila, actual: det.actual, elegidas: elegidas[id] || [] });
    if (!plan || plan.estado !== 'recuperable') { ponerAccion(id, { tipo: 'recuperar', fase: 'listo', resultado: { ok: false, texto: T.recuperacionCambio } }); return; }
    ponerAccion(id, { tipo: 'recuperar', fase: 'confirmar', resultado: null, plan });
  };

  async function confirmar(fila) {
    const a = acciones[fila.id];
    const det = detalles[fila.id];
    if (!a || a.fase === 'trabajando') return;
    ponerAccion(fila.id, { ...a, fase: 'trabajando', resultado: null });
    try {
      if (a.tipo === 'eliminar') {
        const r = await servicio.eliminar(fila.id);
        if (!vivo.current) return;
        const estado = r && r.ok && r.data ? r.data.estado : null;
        if (estado === 'eliminada' || estado === 'no_existe') {
          setFilas((fs) => fs.filter((f) => f.id !== fila.id));
          setAbiertas((x) => ({ ...x, [fila.id]: false }));
          setAvisoLista({ ok: true, texto: estado === 'eliminada' ? ESTADOS_COPIA.eliminada.explica : T.eliminadaYaNoEstaba });
          const re = await servicio.espacio();
          if (vivo.current && re && re.ok) setEspacio(re.data);
          return;
        }
        ponerAccion(fila.id, { tipo: 'eliminar', fase: 'listo', resultado: { ok: false, texto: T[motivoDeLectura(r)] || T.errorAccion } });
        return;
      }
      const r = await servicio.recuperar(det.fila, a.plan || det.prep);
      if (!vivo.current) return;
      if (r && r.ok) {
        ponerAccion(fila.id, { tipo: 'recuperar', fase: 'listo', resultado: { ok: true, texto: T.recuperada } });
        setElegidas((e) => ({ ...e, [fila.id]: [] }));
        leerDetalle(fila);
        return;
      }
      const texto = r && r.motivo === 'cambio' ? T.recuperacionCambio
        : r && r.conflicto ? T.recuperadaConflicto
          : r && r.pendiente ? T.recuperarPendiente
            : r && r.motivo && T[r.motivo] ? T[r.motivo] : T.errorAccion;
      ponerAccion(fila.id, { tipo: 'recuperar', fase: 'listo', resultado: { ok: !!(r && r.pendiente), texto } });
      if (r && r.motivo === 'cambio') leerDetalle(fila);
    } catch {
      if (vivo.current) ponerAccion(fila.id, { ...a, fase: 'listo', resultado: { ok: false, texto: T.errorAccion } });
    }
  }

  const noRecuperar = motivoParaNoRecuperar({ escritor, soloLectura });
  const delConflicto = copiasDelConflictoAbierto(escritor);
  const esp = textoDelEspacio(espacio);
  const apartandose = escritor && escritor.apartadasSinGuardar ? escritor.apartadasSinGuardar : 0;
  const copias = filas.map((f) => describirCopia(f, { aparato })).filter(Boolean);

  return (
    <div className="space-y-2">
      <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{T.subtitulo}</p>
      {apartandose > 0 && <Linea role="status" color={COLORS.warning}>{apartandose === 1 ? 'Un cambio tuyo todavía se está apartando: aparecerá aquí cuando llegue a tu cuenta.' : `${apartandose} cambios tuyos todavía se están apartando: aparecerán aquí cuando lleguen a tu cuenta.`}</Linea>}
      {carga.estado === 'cargando' && filas.length === 0 && (
        <div className="py-2 flex items-center gap-2"><GiroDeCarga texto={T.cargando} size={14} /><Linea>{T.cargando}</Linea></div>
      )}
      {carga.estado === 'error' && (
        <div>
          <div role="alert" className="flex items-start gap-2">
            <CircleAlert size={14} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.warning }} aria-hidden="true" />
            <p className="text-xs flex-1" style={{ color: COLORS.text }}>{T[carga.motivo] || T.error}</p>
          </div>
          {carga.motivo !== 'sinFunciones' && (
            <BotonTexto onClick={cargar} color={color}><span className="inline-flex items-center gap-1"><RotateCw size={12} aria-hidden="true" /> {T.reintentar}</span></BotonTexto>
          )}
        </div>
      )}
      {esp && carga.estado !== 'error' && (
        <div data-espacio-copias={esp.bytes}>
          <p className="text-xs font-semibold" style={{ color: COLORS.text }}>{esp.linea}</p>
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{esp.explica}</p>
        </div>
      )}
      {avisoLista && <Linea role="status" color={avisoLista.ok ? COLORS.positive : COLORS.negative}>{avisoLista.texto}</Linea>}
      {carga.estado === 'listo' && copias.length === 0 && <EmptyHint text={T.vacio} />}
      <ListaAnimada className="space-y-2">
        {copias.map((c) => (
          <div key={c.id} data-flip-id={`copia-${c.id}`}>
            <FilaCopia copia={c} abierta={!!abiertas[c.id]} onAlternar={() => alternar(filas.find((f) => f.id === c.id))}>
              <DetalleCopia
                copia={c} detalle={detalles[c.id]} accion={acciones[c.id]} accent={accent}
                puedeRecuperar={noRecuperar} enConflictoAbierto={delConflicto.has(c.id)}
                onRecuperar={() => pedirRecuperar(c.id)}
                elegidas={elegidas[c.id] || []} onElegir={(pieza) => alternarPieza(c.id, pieza)}
                onElegirTodo={() => elegirTodo(c.id)} onElegirNada={() => setElegidas((e) => ({ ...e, [c.id]: [] }))}
                onEliminar={() => ponerAccion(c.id, { tipo: 'eliminar', fase: 'confirmar', resultado: null })}
                onConfirmar={() => confirmar(filas.find((f) => f.id === c.id))}
                onCancelar={() => ponerAccion(c.id, null)}
                onReintentar={() => leerDetalle(filas.find((f) => f.id === c.id))}
              />
            </FilaCopia>
          </div>
        ))}
      </ListaAnimada>
    </div>
  );
}

/**
 * El plegable de Horario y de Ajustes → Datos. Cerrado, solo pregunta una cosa pequeña (R5, H-23): si una versión
 * anterior intentó guardar algo que no se aplicó y todavía no lo ha visto; entonces lo avisa con «Ver». Lo demás se
 * lee al abrirlo.
 */
export function CambiosApartadosEntrada({ servicio, escritor = null, soloLectura = false, accent = null }) {
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState(null);
  const turnos = useTurnos();
  useEffect(() => {
    if (abierto || !servicio || typeof servicio.nuevasDeVersionAntigua !== 'function') return;
    const t = turnos.nuevo();
    (async () => {
      try {
        const r = await servicio.nuevasDeVersionAntigua();
        if (t.vigente()) setAviso(r && r.ok ? avisoDeVersionesAntiguas(r.data) : null);
      } catch {
        if (t.vigente()) setAviso(null);
      }
    })();
  }, [servicio, abierto]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!servicio) return null;
  const color = accent || COLORS.info;
  return (
    <Card>
      <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} aria-label={T.titulo} className="w-full flex items-center gap-2 text-left toque-44">
        <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(color, 0.12) }}>
          <Archive size={16} style={{ color }} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold" style={{ color: COLORS.text }}>{T.titulo}</span>
          <span className="block text-[11px]" style={{ color: COLORS.textMuted }}>Consulta, recupera o elimina lo que se apartó. Nada se borra solo.</span>
        </span>
        <ChevronDespliegue abierto={abierto} size={16} style={{ color: COLORS.textMuted }} />
      </button>
      {aviso && !abierto && (
        <div role="status" className="mt-2 flex items-start gap-2" data-aviso-version-antigua={aviso.cuantas}>
          <CircleAlert size={14} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.warning }} aria-hidden="true" />
          <p className="text-xs flex-1" style={{ color: COLORS.text }}>{aviso.texto}</p>
          <BotonTexto onClick={() => setAbierto(true)} color={color} ariaLabel={`${T.avisoVer}: ${T.titulo}`}>{T.avisoVer}</BotonTexto>
        </div>
      )}
      <Plegable abierto={abierto}>{() => <div className="mt-2"><CambiosApartados servicio={servicio} escritor={escritor} soloLectura={soloLectura} accent={accent} /></div>}</Plegable>
    </Card>
  );
}
