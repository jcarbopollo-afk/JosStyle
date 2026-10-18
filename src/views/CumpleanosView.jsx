/* ============================================================================
   🎂 CUMPLEAÑOS — la cuarta sección de Mente (2026-10-18)

   La lógica entera vive en `src/lib/cumpleanos.js`: aquí solo se pinta. La lista
   va por el próximo que llega; cada uno se edita en su sitio (el mismo formulario
   de crear) y se elimina a Eliminados recientemente, de donde vuelve.

   🎬 Movimiento, del sistema y sin escribir uno propio: la lista es
   `ListaAnimada` (lo que entra se funde, lo que sale deja su copia y lo demás se
   recoloca), el formulario de añadir es `Plegable`, pasar de la tarjeta a su
   edición es `CambioDeContenido`, el vacío es `EmptyHint` y los avisos son el
   `AvisoAccion` de siempre. «Reducir movimiento» lo gobiernan ellos.
   =========================================================================== */
import React, { useState, useEffect } from 'react';
import { Cake, Pencil, Plus } from 'lucide-react';
import { COLORS } from '../tokens';
import { hexToRgba, todayISO } from '../lib/helpers';
import { Card, SectionTitle, Field, TextInput, SelectInput, PrimaryButton, EmptyHint, BotonBorrar, MensajeDeCampo } from '../components/ui';
import { ListaAnimada, Plegable } from '../components/layoutMotion';
import { CambioDeContenido } from '../components/motion';
import { AvisoAccion } from '../components/quickAdd';
import { useTurnos } from '../components/estadosAsincronos';
import { textoDeFalloAlGuardar } from '../lib/sincronizacion';
import { desplazarHasta } from '../lib/accesibilidadMotion';
import {
  MESES, RELACIONES_SUGERIDAS, MAX_NOMBRE_CUMPLE, MAX_RELACION_CUMPLE,
  validarCumpleanos, crearCumpleanos, editarCumpleanos, formularioDeCumpleanos,
  ordenarPorProximo, textoDelProximo, textoDeLaFecha, diasDelMes,
} from '../lib/cumpleanos';

const VACIO = { nombre: '', dia: '', mes: '', anio: '', relacion: '' };

/* El formulario de crear y de editar. Si `onGuardar` devuelve una promesa (el
   `{ ok }` de saveData), espera con el botón en «Guardando…», no se cierra si no
   ha llegado y una respuesta vieja no pinta nada (MS F16). */
export function FormularioCumpleanos({ inicial = null, lista = [], accent, onGuardar, onCancelar, hoy = todayISO() }) {
  const [f, setF] = useState(inicial ? formularioDeCumpleanos(inicial) : VACIO);
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState(null);
  const turnos = useTurnos();
  const id = inicial?.id || 'nuevo';
  const v = validarCumpleanos(f, { lista, id: inicial?.id || null, hoy });
  const errores = intentado ? v.errores : {};
  const cambia = (campo) => (e) => setF((x) => ({ ...x, [campo]: e.target.value }));
  const mes = Number(f.mes) || null;
  const anio = /^\d{4}$/.test(f.anio) ? Number(f.anio) : null;
  const diasMes = mes ? diasDelMes(mes, anio) : 31;

  const guardar = async () => {
    if (guardando) return;
    setIntentado(true);
    setFallo(null);
    const nuevo = inicial ? editarCumpleanos(inicial, f, { lista, hoy }) : crearCumpleanos(f, { lista, hoy });
    if (!nuevo) return;
    const turno = turnos.nuevo();
    setGuardando(true);
    try {
      const res = await Promise.resolve(onGuardar(nuevo, nuevo === inicial));
      if (!turno.vigente()) return;
      if (res && res.ok === false) setFallo(textoDeFalloAlGuardar(res));
    } catch (e) {
      if (turno.vigente()) setFallo(textoDeFalloAlGuardar(null));
    } finally {
      if (turno.vigente()) setGuardando(false);
    }
  };

  return (
    <Card>
      <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>
        {inicial ? 'Editar cumpleaños' : 'Nuevo cumpleaños'}
      </p>
      <Field label="Nombre">
        <TextInput
          value={f.nombre} onChange={cambia('nombre')} maxLength={MAX_NOMBRE_CUMPLE} placeholder="Ej: Marta"
          aria-invalid={errores.nombre ? true : undefined} aria-describedby={errores.nombre ? `cumple-nombre-${id}` : undefined}
          autoComplete="off"
        />
        <MensajeDeCampo id={`cumple-nombre-${id}`}>{errores.nombre}</MensajeDeCampo>
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Día">
          <SelectInput value={f.dia} onChange={cambia('dia')} aria-label="Día" aria-invalid={errores.fecha ? true : undefined}>
            <option value="">—</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={String(d)} disabled={d > diasMes}>{d}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Mes">
          <SelectInput value={f.mes} onChange={cambia('mes')} aria-label="Mes" aria-invalid={errores.fecha ? true : undefined}>
            <option value="">—</option>
            {MESES.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
          </SelectInput>
        </Field>
        <Field label="Año (opcional)">
          <TextInput
            value={f.anio} onChange={cambia('anio')} inputMode="numeric" maxLength={4} placeholder="Si lo sabes"
            aria-label="Año de nacimiento (opcional)" aria-invalid={errores.fecha ? true : undefined}
            aria-describedby={errores.fecha ? `cumple-fecha-${id}` : undefined} autoComplete="off"
          />
        </Field>
      </div>
      <MensajeDeCampo id={`cumple-fecha-${id}`} className="-mt-2 mb-3">{errores.fecha}</MensajeDeCampo>
      <Field label="Relación (opcional)">
        <TextInput
          value={f.relacion} onChange={cambia('relacion')} maxLength={MAX_RELACION_CUMPLE}
          placeholder="Amigo, familia…" list={`cumple-relaciones-${id}`} autoComplete="off"
        />
        <datalist id={`cumple-relaciones-${id}`}>
          {RELACIONES_SUGERIDAS.map((r) => <option key={r} value={r} />)}
        </datalist>
      </Field>
      <PrimaryButton accent={accent} estado={guardando ? 'cargando' : undefined} onClick={guardar}>
        {inicial ? 'Guardar cambios' : 'Guardar cumpleaños'}
      </PrimaryButton>
      <MensajeDeCampo id={`cumple-fallo-${id}`}>{fallo}</MensajeDeCampo>
      <button
        onClick={onCancelar} className="w-full mt-2 rounded-xl py-2 text-xs font-semibold"
        style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}
      >
        Cancelar
      </button>
    </Card>
  );
}

/* La tarjeta de un cumpleaños: quién, cuándo es el próximo y qué día nació. */
export function TarjetaCumpleanos({ c, accent, onEditar, onEliminar }) {
  const p = c.proximo;
  return (
    <Card style={{ padding: '0.85rem' }}>
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: hexToRgba(accent, p && p.esHoy ? 0.28 : 0.14) }}
        >
          <Cake size={17} style={{ color: accent }} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>
            {c.nombre}
            {c.relacion && <span className="text-[11px] font-medium" style={{ color: COLORS.textMuted }}> · {c.relacion}</span>}
          </p>
          <p className="text-xs" style={{ color: p && p.dias <= 7 ? accent : COLORS.textMuted }}>
            {p && p.esHoy ? '🎉 ' : ''}{textoDelProximo(p)}
          </p>
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>Nació el {textoDeLaFecha(c)}</p>
        </div>
        <button
          onClick={onEditar} className="toque-44 p-1.5 -m-1 rounded-lg flex-shrink-0"
          style={{ background: COLORS.surface2 }} aria-label={`Editar el cumpleaños de ${c.nombre}`}
        >
          <Pencil size={13} style={{ color: COLORS.textMuted }} />
        </button>
        <BotonBorrar onClick={onEliminar} label={`Eliminar el cumpleaños de ${c.nombre}`} />
      </div>
    </Card>
  );
}

/**
 * @param cumpleanos  `{ lista }`, ya normalizado
 * @param onAdd       (c) => { ok } | Promise<{ ok }>
 * @param onUpdate    (c) => { ok } | Promise<{ ok }>
 * @param onDelete    (id) => void — a Eliminados recientemente (papelera de siempre)
 * @param foco        `{ id }` desde el Calendario: se abre en su sitio
 */
export default function CumpleanosView({ cumpleanos, desactivado = false, onAdd, onUpdate, onDelete, accent, foco = null, onFocoConsumido = null, hoy = todayISO() }) {
  const lista = (cumpleanos && cumpleanos.lista) || [];
  const ordenados = ordenarPorProximo(lista, hoy);
  const [anadiendo, setAnadiendo] = useState(false);
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    if (!foco || !foco.id) return;
    const el = typeof document !== 'undefined' ? document.getElementById(`cumple-${foco.id}`) : null;
    if (el) desplazarHasta(el, { block: 'center' });
    if (onFocoConsumido) onFocoConsumido();
  }, [foco]); // eslint-disable-line react-hooks/exhaustive-deps

  const alGuardarNuevo = async (c) => {
    const res = await Promise.resolve(onAdd(c));
    if (!res || res.ok !== false) { setAnadiendo(false); setAviso('cumpleanos_guardado'); }
    return res;
  };
  const alGuardarEdicion = async (c, sinCambios) => {
    const res = sinCambios ? { ok: true } : await Promise.resolve(onUpdate(c));
    if (!res || res.ok !== false) { setEditando(null); if (!sinCambios) setAviso('cambios_guardados'); }
    return res;
  };

  /* Desactivado (Ajustes → Pantalla principal) no se pinta nada suyo, y se dice: los datos siguen. */
  if (desactivado) {
    return (
      <Card>
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Cumpleaños está desactivado</p>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
          Tus cumpleaños siguen guardados. Actívalo en Ajustes → Pantalla principal para verlos.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div>
        <SectionTitle>Cumpleaños</SectionTitle>
        <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
          Se repiten cada año en tu Calendario, el día que toca.
        </p>
      </div>

      {ordenados.length === 0 && !anadiendo && (
        <EmptyHint text="Todavía no has apuntado ningún cumpleaños." />
      )}

      <ListaAnimada className="space-y-2">
        {ordenados.map((c) => (
          <div key={c.id} data-flip-id={`cumple-${c.id}`} id={`cumple-${c.id}`}>
            <CambioDeContenido clave={editando === c.id ? 'editar' : 'ver'}>
              {editando === c.id ? (
                <FormularioCumpleanos
                  inicial={lista.find((x) => x.id === c.id)} lista={lista} accent={accent} hoy={hoy}
                  onGuardar={alGuardarEdicion} onCancelar={() => setEditando(null)}
                />
              ) : (
                <TarjetaCumpleanos
                  c={c} accent={accent}
                  onEditar={() => { setAnadiendo(false); setEditando(c.id); }}
                  onEliminar={() => { if (editando === c.id) setEditando(null); onDelete(c.id); setAviso('cumpleanos_eliminado'); }}
                />
              )}
            </CambioDeContenido>
          </div>
        ))}
      </ListaAnimada>

      <Plegable abierto={anadiendo}>{() => (
        <FormularioCumpleanos
          lista={lista} accent={accent} hoy={hoy}
          onGuardar={alGuardarNuevo} onCancelar={() => setAnadiendo(false)}
        />
      )}</Plegable>

      {!anadiendo && (
        <button
          onClick={() => { setEditando(null); setAnadiendo(true); }}
          className="w-full rounded-2xl p-3 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
          style={{ background: COLORS.surface2, border: `1px dashed ${COLORS.border}` }}
        >
          <Plus size={16} style={{ color: accent }} />
          <span className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>Añadir cumpleaños</span>
        </button>
      )}

      <AvisoAccion accion={aviso} accent={accent} onCerrar={() => setAviso(null)} />
    </div>
  );
}
