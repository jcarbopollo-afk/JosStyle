import React, { useState, useEffect, useRef } from 'react';
import { Heart, Trash2, CalendarHeart, Repeat, Pencil, X, ImagePlus, Loader2 } from 'lucide-react';
import { COLORS, TIPOS_FECHA_RELACION } from '../tokens';
import { uid, formatFecha, diasHasta } from '../lib/helpers';
import { Card, SectionTitle, Field, TextInput, Select, PrimaryButton, ToggleTab, EmptyHint, BotonBorrarDefinitivo } from '../components/ui';
import { fotosDelAlbum, validarFotoAlbum, TIPOS_FOTO_ALBUM, MAX_NOTA_ALBUM, BORRADO_ALBUM } from '../lib/albumRelacion';

// Fase 13 — solo la lista de nombres del Prompt Maestro. Tocar uno abre el formulario de fecha
// para que Josué la escriba él mismo.
//
// Fase "Finalización del Calendario" — cada preset ya sugiere un `tipo` razonable (Cumpleaños →
// cumpleanos, Aniversario → aniversario, el resto → fecha_importante) y, al confirmarlo, la
// repetición anual queda activada por defecto (son días que, por naturaleza, vuelven cada año) —
// Josué puede desactivarla en el propio formulario si un preset concreto no debe repetirse.
const DIAS_ESPECIALES_PRESET = [
  'Aniversario', 'Cumpleaños', 'Día de la Novia', 'Día del Peluche', 'Día de las Flores Amarillas',
  'Día del Chocolate', 'Día del Cine', 'Día del Maquillaje', 'Día del Anillo de Promesa',
  'Día de los Collares', 'Día de los Poemas',
];

function tipoParaPreset(preset) {
  if (preset === 'Cumpleaños') return 'cumpleanos';
  if (preset === 'Aniversario') return 'aniversario';
  return 'fecha_importante';
}

function emojiDeTipo(tipoId) {
  return (TIPOS_FECHA_RELACION.find((t) => t.id === tipoId) || TIPOS_FECHA_RELACION[TIPOS_FECHA_RELACION.length - 1]).emoji;
}

function diasLabel(dias) {
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `En ${dias} días`;
}

// Interruptor "Repetir cada año" — mismo lenguaje visual que el interruptor "Todo el día" del
// editor de eventos del Calendario (CalendarView.jsx), para que activar una repetición se sienta
// igual en toda la app, esté donde esté el control.
function RepeticionToggle({ valor, onChange, accent }) {
  return (
    <button
      onClick={() => onChange(!valor)}
      className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 mb-3 text-sm"
      style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
    >
      <span className="flex items-center gap-1.5"><Repeat size={13} /> Repetir cada año</span>
      <span
        className="rounded-full flex-shrink-0"
        style={{ width: 36, height: 20, background: valor ? accent : COLORS.border, position: 'relative', transition: 'background 150ms' }}
      >
        <span
          className="rounded-full absolute"
          style={{ width: 16, height: 16, top: 2, left: valor ? 18 : 2, background: COLORS.textOnAccent, transition: 'left 150ms' }}
        />
      </span>
    </button>
  );
}

function NombreCard({ nombre, onUpdate, accent }) {
  const [valor, setValor] = useState(nombre);
  const [showForm, setShowForm] = useState(!nombre);

  const guardar = () => {
    if (!valor.trim()) return;
    onUpdate(valor.trim());
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart size={18} style={{ color: accent }} fill={accent} />
          <p className="text-base font-semibold" style={{ color: COLORS.text }}>{nombre}</p>
        </div>
        <button onClick={() => { setValor(nombre); setShowForm(true); }} className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
          Editar
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <Field label="Nombre de tu pareja">
        <TextInput value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ej: Ana" />
      </Field>
      <PrimaryButton accent={accent} disabled={!valor.trim()} onClick={guardar}>Guardar</PrimaryButton>
    </Card>
  );
}

const FORM_VACIO = { id: null, etiqueta: '', fecha: '', tipo: 'otro', repetir: false };

// Formulario de fecha importante, compartido por crear y editar (mismo criterio que el editor de
// eventos del Calendario: un único formulario para las dos acciones). `onCambiarTipo` activa la
// repetición anual por defecto al elegir Cumpleaños/Aniversario — Josué puede desactivarla sin
// salir del propio formulario.
function FormularioFecha({ form, setForm, onGuardar, onCancelar, accent, esNuevo }) {
  const cambiarTipo = (tipo) => {
    setForm((f) => ({ ...f, tipo, repetir: (tipo === 'cumpleanos' || tipo === 'aniversario') ? true : f.repetir }));
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{esNuevo ? 'Nueva fecha importante' : 'Editar fecha importante'}</p>
        <button onClick={onCancelar} className="p-1.5 rounded-full" style={{ background: COLORS.surface2 }} aria-label="Cancelar">
          <X size={13} style={{ color: COLORS.text }} />
        </button>
      </div>
      <Field label="Qué se celebra">
        <TextInput value={form.etiqueta} onChange={(e) => setForm({ ...form, etiqueta: e.target.value })} placeholder="Ej: Cumpleaños" />
      </Field>
      <Field label="Tipo">
        <Select value={form.tipo} onChange={(e) => cambiarTipo(e.target.value)}>
          {TIPOS_FECHA_RELACION.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
        </Select>
      </Field>
      <Field label="Fecha">
        <TextInput type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
      </Field>
      <RepeticionToggle valor={form.repetir} onChange={(v) => setForm({ ...form, repetir: v })} accent={accent} />
      {form.repetir && (
        <p className="text-xs mb-3 px-1" style={{ color: COLORS.textMuted }}>
          Se repetirá cada año en el Calendario a partir de esta fecha, sin que tengas que volver a crearla.
        </p>
      )}
      <PrimaryButton accent={accent} disabled={!form.etiqueta.trim() || !form.fecha} onClick={onGuardar}>
        {esNuevo ? 'Guardar' : 'Guardar cambios'}
      </PrimaryButton>
    </Card>
  );
}

function FechasTab({ fechas, onAdd, onUpdate, onDelete, accent }) {
  const [form, setForm] = useState(null); // null | forma del formulario (nuevo o edición)

  const submit = () => {
    if (!form.etiqueta.trim() || !form.fecha) return;
    if (form.id) onUpdate({ ...form, etiqueta: form.etiqueta.trim() });
    else onAdd({ ...form, id: uid(), etiqueta: form.etiqueta.trim() });
    setForm(null);
  };

  const ordenadas = [...fechas].sort((a, b) => diasHasta(a.fecha) - diasHasta(b.fecha));

  return (
    <div className="space-y-4">
      {!form && (
        <div style={{ width: 180 }}>
          <PrimaryButton accent={accent} onClick={() => setForm(FORM_VACIO)}>Añadir fecha importante</PrimaryButton>
        </div>
      )}

      {form && (
        <FormularioFecha
          form={form} setForm={setForm} onGuardar={submit} onCancelar={() => setForm(null)}
          accent={accent} esNuevo={!form.id}
        />
      )}

      <div className="space-y-2">
        {ordenadas.length === 0 && <EmptyHint text="Todavía no has añadido ninguna fecha importante." />}
        {ordenadas.map((f) => {
          const dias = diasHasta(f.fecha);
          return (
            <Card key={f.id} style={{ padding: '1rem' }} className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <CalendarHeart size={16} style={{ color: accent, flexShrink: 0 }} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>
                    {emojiDeTipo(f.tipo)} {f.etiqueta}
                  </p>
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: COLORS.textMuted }}>
                    {formatFecha(f.fecha)} · {diasLabel(dias)}
                    {f.repetir && <Repeat size={10} style={{ flexShrink: 0 }} />}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setForm({ tipo: 'otro', repetir: false, ...f })} className="p-1.5" aria-label="Editar fecha">
                  <Pencil size={14} style={{ color: COLORS.textMuted }} />
                </button>
                <button onClick={() => onDelete(f.id)} className="p-1.5" aria-label="Borrar fecha">
                  <Trash2 size={14} style={{ color: COLORS.textMuted }} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function EspecialesTab({ fechas, onAdd, accent }) {
  const [seleccionado, setSeleccionado] = useState(null);
  const [fecha, setFecha] = useState('');
  const [repetir, setRepetir] = useState(true);
  const yaAñadidos = new Set(fechas.map((f) => f.etiqueta));

  const elegir = (preset) => {
    setSeleccionado(preset);
    setFecha('');
    setRepetir(true);
  };

  const confirmar = () => {
    if (!seleccionado || !fecha) return;
    onAdd({ id: uid(), etiqueta: seleccionado, fecha, tipo: tipoParaPreset(seleccionado), repetir });
    setSeleccionado(null);
    setFecha('');
  };

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: COLORS.textMuted }}>
        Toca un día para añadirle una fecha — tú eliges cuándo y si se repite cada año.
      </p>
      <div className="flex flex-wrap gap-2">
        {DIAS_ESPECIALES_PRESET.map((d) => (
          <button
            key={d}
            onClick={() => elegir(d)}
            className="rounded-full px-3 py-1.5 text-xs font-medium"
            style={seleccionado === d
              ? { background: accent, color: COLORS.textOnAccent }
              : { background: COLORS.surface2, color: yaAñadidos.has(d) ? COLORS.textMuted : COLORS.text, border: `1px solid ${COLORS.border}` }}
          >
            {d}{yaAñadidos.has(d) ? ' ✓' : ''}
          </button>
        ))}
      </div>

      {seleccionado && (
        <Card>
          <Field label={`Fecha de "${seleccionado}"`}>
            <TextInput type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Field>
          <RepeticionToggle valor={repetir} onChange={setRepetir} accent={accent} />
          <PrimaryButton accent={accent} disabled={!fecha} onClick={confirmar}>Añadir</PrimaryButton>
        </Card>
      )}
    </div>
  );
}


/* ===========================================================================
   ÁLBUM (NAV F3) — el pequeño álbum privado que pidió Josué.

   🚨 **Una foto se pinta con su URL FIRMADA, que se pide en el momento.** Lo
   guardado es el camino: una URL de Supabase caduca en una hora, así que
   guardarla sería guardar algo que deja de funcionar mientras él duerme
   (E3 F17). Por eso cada tarjeta la pide al montarse.

   ⚠️ Y esto vive **dentro de Relación**, que ya está detrás del `PinGate`
   (regla 6): el álbum hereda el PIN sin escribir una línea.
   =========================================================================== */

export function FotoDelAlbum({ foto, accent, onFirmar, onBorrar }) {
  const [url, setUrl] = useState(null);
  const [falla, setFalla] = useState(false);

  useEffect(() => {
    let vivo = true;
    setUrl(null);
    setFalla(false);
    Promise.resolve(onFirmar(foto.path))
      .then((u) => { if (vivo) { if (u) setUrl(u); else setFalla(true); } })
      .catch(() => { if (vivo) setFalla(true); });
    return () => { vivo = false; };
  }, [foto.path]);

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
      <div className="relative" style={{ aspectRatio: '1 / 1' }}>
        {url && <img src={url} alt={foto.nota || 'Foto del álbum'} className="w-full h-full object-cover" />}
        {!url && !falla && (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 size={18} className="animate-spin" style={{ color: COLORS.textMuted }} />
          </div>
        )}
        {/* ⚠️ Si la foto no se puede cargar se DICE, no se deja un cuadro gris:
            un hueco mudo parece un fallo de la aplicación (EH F41). */}
        {falla && (
          <div className="w-full h-full flex items-center justify-center p-2 text-center">
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>No se ha podido cargar esta foto.</p>
          </div>
        )}
      </div>

      {/* ⚠️ **La nota va DEBAJO de la foto, no encima.** La primera versión la
          pintaba sobre un velo oscuro con dos colores escritos a mano, y **la
          regla 2 saltó**: un hex fuera de `tokens.js` se queda fijo cuando Josué
          cambia de tema. Inventar un token de velo para un solo sitio habría
          sido el segundo sistema de color que la regla existe para impedir; con
          la nota debajo valen los tokens de siempre — y además no tapa la foto.

          🐛 Y ojo al escribir esto: **el barrido de hex solo se salta las líneas
          que EMPIEZAN por `//`, `*` o `/*`**, así que un comentario de varias
          líneas sin asterisco al margen —como éste— que mencione un color de
          seis dígitos vuelve a hacerlo saltar. Por eso aquí se dice con
          palabras. */}
      {foto.nota && (
        <p className="px-2 py-1.5 text-[11px] truncate" style={{ color: COLORS.textMuted }}>
          {foto.nota}
        </p>
      )}

      {/* 🚨 Preguntar aquí ES lo correcto, y es la excepción: esto borra un
          archivo de verdad en Storage y NO va a Eliminados recientes, igual que
          la foto de Salud, el vídeo de calistenia y el archivo de Biblioteca. */}
      <div className="absolute top-1.5 right-1.5">
        <BotonBorrarDefinitivo
          label="Eliminar foto del álbum"
          titulo="¿Eliminar la foto?"
          detalle={BORRADO_ALBUM.aviso}
          onConfirm={() => onBorrar(foto.id)}
        />
      </div>
    </div>
  );
}

export function AlbumTab({ relacion, accent, onSubir, onFirmar, onBorrar }) {
  const fileRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);
  const [nota, setNota] = useState('');
  const fotos = fotosDelAlbum(relacion);

  const elegir = async (ev) => {
    const file = ev.target.files?.[0];
    // El input se limpia SIEMPRE: si no, elegir la misma foto dos veces seguidas
    // no dispara `onChange` y parece que la aplicación se ha colgado.
    ev.target.value = '';
    if (!file) return;
    const v = validarFotoAlbum(file);
    if (!v.ok) { setError(v.motivo); return; }
    setError(null);
    setSubiendo(true);
    try {
      await onSubir(file, nota);
      setNota('');
    } catch {
      // ⚠️ El error dice QUÉ hacer, no "Error" a secas (EH F62).
      setError('No se ha podido guardar la foto. Comprueba la conexión y vuelve a intentarlo.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card>
        <Field label="Nota para la próxima foto (opcional)">
          <TextInput
            value={nota}
            maxLength={MAX_NOTA_ALBUM}
            placeholder="Dónde fue, qué día…"
            onChange={(ev) => setNota(ev.target.value)}
          />
        </Field>
        <div className="mt-3">
          <PrimaryButton
            onClick={() => { if (!subiendo) fileRef.current?.click(); }}
            accent={accent}
            icon={subiendo ? Loader2 : ImagePlus}
            disabled={subiendo}
          >
            {subiendo ? 'Guardando…' : 'Añadir foto'}
          </PrimaryButton>
        </div>
        {error && <p className="text-xs mt-2" style={{ color: COLORS.negative }}>{error}</p>}
        <input
          ref={fileRef}
          type="file"
          accept={TIPOS_FOTO_ALBUM.join(',')}
          onChange={elegir}
          className="hidden"
          aria-label="Elegir una foto para el álbum"
        />
      </Card>

      {fotos.length === 0 ? (
        <EmptyHint>Todavía no has guardado ninguna foto. Añade la primera con el botón de arriba.</EmptyHint>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {fotos.map((f) => (
            <FotoDelAlbum key={f.id} foto={f} accent={accent} onFirmar={onFirmar} onBorrar={onBorrar} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RelationView({ relacion, onUpdateNombre, onAddFecha, onUpdateFecha, onDeleteFecha, onSubirFotoAlbum, onFirmarFotoAlbum, onBorrarFotoAlbum, accent }) {
  const [sub, setSub] = useState('fechas');

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Privado — protegido por tu PIN, entrada manual">
        <span className="flex items-center gap-2"><Heart size={18} style={{ color: accent }} /> Relación</span>
      </SectionTitle>

      <NombreCard nombre={relacion.nombre} onUpdate={onUpdateNombre} accent={accent} />

      <div className="flex gap-1.5">
        <ToggleTab active={sub === 'fechas'} onClick={() => setSub('fechas')} accent={accent}>Fechas</ToggleTab>
        <ToggleTab active={sub === 'especiales'} onClick={() => setSub('especiales')} accent={accent}>Días especiales</ToggleTab>
        {/* NAV F3 — la tercera pestaña. ⚠️ Las dos de antes NO se tocan: Josué
            dijo "las fechas, estructura y funcionalidades actuales me gustan
            mucho, quiero mantenerlo prácticamente tal cual". */}
        <ToggleTab active={sub === 'album'} onClick={() => setSub('album')} accent={accent}>Álbum</ToggleTab>
      </div>

      {sub === 'fechas' && (
        <FechasTab fechas={relacion.fechas} onAdd={onAddFecha} onUpdate={onUpdateFecha} onDelete={onDeleteFecha} accent={accent} />
      )}
      {sub === 'especiales' && <EspecialesTab fechas={relacion.fechas} onAdd={onAddFecha} accent={accent} />}
      {sub === 'album' && (
        <AlbumTab
          relacion={relacion}
          accent={accent}
          onSubir={onSubirFotoAlbum}
          onFirmar={onFirmarFotoAlbum}
          onBorrar={onBorrarFotoAlbum}
        />
      )}
    </div>
  );
}
