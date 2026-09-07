import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import {
  Camera, AlertCircle, HeartPulse, ChevronDown, ChevronRight, Ruler, ClipboardList, Plus, Stethoscope,
} from 'lucide-react';
import { COLORS, TIPOS_HISTORIAL_MEDICO } from '../tokens';
import { uid, formatFecha, todayISO, hexToRgba } from '../lib/helpers';
import { getSignedPhotoUrl } from '../lib/supabase';
import {
  NOMBRE_MODULO, SUBTITULO_MODULO, SECCIONES_BIENESTAR, aperturaInicialBN, estadoActual,
  avisoDeRegistro, evolucionPeso, resumenDeMedida, resumenDeSeccion, filtrosDeHistorial,
  filtrarHistorial, ordenarHistorial, lesionesDe, LESIONES,
} from '../lib/salud';
import {
  BotonBorrar, BotonBorrarDefinitivo, Card, SectionTitle, Field, TextInput, Select, PrimaryButton,
  EmptyHint, AIPanel, PinGate,
} from '../components/ui';

/* Entrega 3 · Fase 30 (BN) — «Rediseño y reorganización del apartado Bienestar».
   ═══════════════════════════════════════════════════════════════════════════

   🚨 **NO SE HA QUITADO NI UNA FUNCIÓN.** Registrar y borrar medidas, añadir y
   borrar entradas del historial, subir y borrar fotos, el PIN de las fotos
   privadas y *Analizar mi salud* siguen siendo exactamente las mismas props que
   `App.jsx` ya pasaba. `LO_QUE_SE_CONSERVA` las nombra una a una y hay una
   prueba que lee este archivo buscándolas.

   Lo que cambia es la **jerarquía**: antes eran tres pestañas que obligaban a
   elegir una y escondían las otras dos, con el título «Salud» dentro del área
   «Salud» (la redundancia del apartado 3). Ahora es **una sola pantalla**: el
   estado de un vistazo arriba, tres secciones plegables debajo —Medidas, Fotos,
   Historial, en el orden *"qué puedo consultar → qué puedo registrar → dónde
   está mi historial"* del apartado 10— y el panel de IA al final, intacto.

   ⚠️ **Ni un nivel de navegación nuevo**: se pliega y se despliega en el sitio.
   Y la sección de Medidas nace abierta, así que la pantalla nunca sale en
   blanco (la lección de la E3 F26). */

/* ── Una sección plegable ───────────────────────────────────────────────────
   ⚠️ Mismo lenguaje visual que el resto de la aplicación (apartado 8): la
   cascada `.hub-card`, el radio y los tokens de siempre. Nada aislado que
   parezca de otra app. */
function SeccionBN({ seccion, resumen, abierta, onAlternar, accent, indice, children }) {
  const Icono = ICONOS_SECCION[seccion.id] || HeartPulse;
  return (
    <div className="hub-card rounded-3xl overflow-hidden" style={{ animationDelay: `${indice * 70}ms`, background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      <button
        onClick={() => onAlternar(seccion.id)}
        aria-expanded={abierta}
        aria-label={`${abierta ? 'Plegar' : 'Desplegar'} ${seccion.nombre}`}
        className="w-full flex items-center gap-3 p-4 text-left toque-44"
      >
        <span
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: hexToRgba(accent, 0.14), border: `1px solid ${hexToRgba(accent, 0.25)}` }}
        >
          <Icono size={20} style={{ color: accent }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-base font-bold block truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {seccion.nombre}
          </span>
          <span className="text-xs block truncate" style={{ color: COLORS.textMuted }}>
            {resumen ? resumen.texto : seccion.descripcion}
          </span>
        </span>
        {abierta
          ? <ChevronDown size={18} style={{ color: COLORS.textMuted }} className="flex-shrink-0" />
          : <ChevronRight size={18} style={{ color: COLORS.textMuted }} className="flex-shrink-0" />}
      </button>
      {abierta && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}

/* ⚠️ La otra mitad del catálogo: `SECCIONES_BIENESTAR` es datos y esto son
   componentes de React, el mismo reparto que `CATEGORIAS_ARMARIO` /
   `ICONOS_CATEGORIA` (E3 F3). Un icono que falte aquí sale como un hueco y no
   falla en ninguna parte, así que hay una prueba que compara las dos listas. */
const ICONOS_SECCION = {
  medidas: Ruler,
  fotos: Camera,
  historial: ClipboardList,
  analisis: HeartPulse,
};

/* ── El estado de un vistazo ────────────────────────────────────────────────
   ⚠️ Todo derivado y **nada inventado**: sin peso no hay peso, sin altura no hay
   IMC. `imcDe` devuelve `null` en vez del `Infinity` que saldría de dividir
   entre cero, que se pintaría tal cual en la pantalla. */
function EstadoBN({ estado, aviso, accent, onRegistrar }) {
  if (estado.vacio) {
    return (
      <Card>
        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Todavía no has registrado nada</p>
        <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>
          Con una medida ya se puede ver tu evolución. Se escribe a mano y la IA solo la interpreta.
        </p>
        <div style={{ width: 180 }}>
          <PrimaryButton accent={accent} icon={Plus} onClick={onRegistrar}>Registrar medidas</PrimaryButton>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-end gap-5">
        {estado.peso && (
          <div>
            <p className="text-3xl font-extrabold leading-none" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
              {estado.peso}<span className="text-base font-bold ml-1" style={{ color: COLORS.textMuted }}>kg</span>
            </p>
            <p className="text-xs mt-1.5" style={{ color: COLORS.textMuted }}>
              {estado.desdeElPerfil
                ? 'De tu perfil'
                : estado.dias === 0 ? 'Registrado hoy' : `Hace ${estado.dias} ${estado.dias === 1 ? 'día' : 'días'}`}
            </p>
          </div>
        )}
        {estado.imc && (
          <div>
            <p className="text-2xl font-bold leading-none" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
              {estado.imc.toFixed(1)}
            </p>
            <p className="text-xs mt-1.5" style={{ color: COLORS.textMuted }}>IMC</p>
          </div>
        )}
      </div>
      {aviso.avisa && aviso.texto && (
        <p className="text-xs mt-3 flex items-start gap-1.5" style={{ color: COLORS.textMuted }}>
          <AlertCircle size={14} style={{ color: COLORS.warning, flexShrink: 0, marginTop: 1 }} />
          {aviso.texto}
        </p>
      )}
    </Card>
  );
}

/* ── Medidas ────────────────────────────────────────────────────────────────
   Las mismas que había: mismos campos, mismo guardado, misma gráfica y el mismo
   botón de borrar (que va a la papelera, así que no pregunta). */
function BloqueMedidas({ medidas, onAdd, onDeleteMedida, accent, abrirFormulario, onFormularioAbierto }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ peso: '', grasaCorporal: '', frecuenciaCardiaca: '', tensionSistolica: '', tensionDiastolica: '', notas: '' });

  /* El botón del estado vacío abre esta sección Y su formulario: pedirle dos
     toques para lo mismo sería el «control decorativo» de la regla 8. */
  useEffect(() => {
    if (abrirFormulario) { setShowForm(true); onFormularioAbierto(); }
  }, [abrirFormulario, onFormularioAbierto]);

  const chartData = evolucionPeso(medidas);

  const submit = () => {
    if (!form.peso && !form.grasaCorporal && !form.frecuenciaCardiaca && !form.tensionSistolica) return;
    onAdd({ id: uid(), fecha: todayISO(), ...form });
    setShowForm(false);
    setForm({ peso: '', grasaCorporal: '', frecuenciaCardiaca: '', tensionSistolica: '', tensionDiastolica: '', notas: '' });
  };

  return (
    <>
      <div style={{ width: 180 }}>
        <PrimaryButton accent={accent} icon={Plus} onClick={() => setShowForm((s) => !s)}>Registrar medidas</PrimaryButton>
      </div>

      {showForm && (
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Peso (kg)">
              <TextInput type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} />
            </Field>
            <Field label="Grasa corporal (%)">
              <TextInput type="number" step="0.1" value={form.grasaCorporal} onChange={(e) => setForm({ ...form, grasaCorporal: e.target.value })} />
            </Field>
            <Field label="Frecuencia cardíaca (ppm)">
              <TextInput type="number" value={form.frecuenciaCardiaca} onChange={(e) => setForm({ ...form, frecuenciaCardiaca: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Tensión sist.">
                <TextInput type="number" value={form.tensionSistolica} onChange={(e) => setForm({ ...form, tensionSistolica: e.target.value })} />
              </Field>
              <Field label="Tensión diast.">
                <TextInput type="number" value={form.tensionDiastolica} onChange={(e) => setForm({ ...form, tensionDiastolica: e.target.value })} />
              </Field>
            </div>
          </div>
          <Field label="Notas (dolores, cómo te encuentras...)">
            <TextInput value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </Field>
          <PrimaryButton accent={accent} onClick={submit}>Guardar</PrimaryButton>
        </Card>
      )}

      {chartData.length > 1 && (
        <Card>
          <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>Evolución del peso</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={COLORS.border} vertical={false} />
              <XAxis dataKey="fecha" stroke={COLORS.textMuted} fontSize={11} />
              <YAxis stroke={COLORS.textMuted} fontSize={11} width={30} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }} />
              <Line type="monotone" dataKey="peso" stroke={accent} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="space-y-2">
        {medidas.length === 0 && <EmptyHint text="Todavía no has registrado ninguna medida." />}
        {[...medidas].reverse().slice(0, 6).map((e) => (
          <Card key={e.id} style={{ padding: '1rem' }}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{formatFecha(e.fecha)}</p>
              <BotonBorrar onClick={() => onDeleteMedida(e.id)} label="Eliminar medida" />
            </div>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{resumenDeMedida(e)}</p>
            {e.notas && <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{e.notas}</p>}
          </Card>
        ))}
      </div>
    </>
  );
}

/* ── Historial, con las lesiones dentro ─────────────────────────────────────
   🚨 Apartado 9: *"NO crear una sección independiente de Lesiones"*. Se ven aquí,
   de las dos fuentes que ya existían, **sin copiar ninguna**: las del historial
   se editan aquí y las del perfil dicen dónde se editan. */
function BloqueHistorial({ historial, lesiones, onAdd, onDeleteHistorial, accent }) {
  const [showForm, setShowForm] = useState(false);
  const [filtro, setFiltro] = useState('todos');
  const [form, setForm] = useState({ tipo: TIPOS_HISTORIAL_MEDICO[0], descripcion: '' });

  const filtros = filtrosDeHistorial(historial);
  /* Si el filtro puesto deja de existir porque él borró la última entrada de ese
     tipo, se vuelve a «Todo»: un filtro que ya no está no puede dejar la lista
     vacía para siempre (la lección de la E3 F24). */
  const filtroValido = filtros.some((f) => f.id === filtro) ? filtro : 'todos';
  const visibles = ordenarHistorial(filtrarHistorial(historial, filtroValido));

  const submit = () => {
    if (!form.descripcion.trim()) return;
    onAdd({ id: uid(), fecha: todayISO(), ...form });
    setShowForm(false);
    setForm({ tipo: TIPOS_HISTORIAL_MEDICO[0], descripcion: '' });
  };

  return (
    <>
      <div style={{ width: 180 }}>
        <PrimaryButton accent={accent} icon={Plus} onClick={() => setShowForm((s) => !s)}>Añadir al historial</PrimaryButton>
      </div>

      {showForm && (
        <Card>
          <Field label="Tipo">
            <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {TIPOS_HISTORIAL_MEDICO.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Descripción">
            <TextInput value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: esguince de tobillo derecho jugando al fútbol" />
          </Field>
          <PrimaryButton accent={accent} onClick={submit}>Guardar</PrimaryButton>
        </Card>
      )}

      {filtros.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filtros.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 toque-44"
              style={{
                background: filtroValido === f.id ? hexToRgba(accent, 0.16) : COLORS.surface2,
                color: filtroValido === f.id ? accent : COLORS.textMuted,
                border: `1px solid ${filtroValido === f.id ? hexToRgba(accent, 0.3) : COLORS.border}`,
              }}
            >
              {f.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {visibles.length === 0 && (
          <EmptyHint text={historial.length === 0 ? 'Todavía no hay nada en tu historial médico.' : 'Nada de ese tipo todavía.'} />
        )}
        {visibles.map((e) => (
          <Card key={e.id} style={{ padding: '1rem' }}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold min-w-0 truncate" style={{ color: COLORS.text }}>{e.tipo}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="text-xs" style={{ color: COLORS.textMuted }}>{formatFecha(e.fecha)}</p>
                <BotonBorrar onClick={() => onDeleteHistorial(e.id)} label="Eliminar entrada médica" />
              </div>
            </div>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{e.descripcion}</p>
          </Card>
        ))}
      </div>

      {lesiones.perfil.length > 0 && (
        <Card>
          <p className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.text }}>
            <Stethoscope size={15} style={{ color: accent }} />
            {LESIONES.fuentes[1].titulo}
          </p>
          <div className="space-y-1.5 mt-2">
            {lesiones.perfil.map((l) => (
              <p key={l.id} className="text-xs" style={{ color: COLORS.textMuted }}>
                {[l.zona, l.estado].filter(Boolean).join(' · ')}
                {l.fecha ? ` — ${formatFecha(l.fecha)}` : ''}
              </p>
            ))}
          </div>
          <p className="text-xs mt-2.5" style={{ color: COLORS.textMuted }}>{LESIONES.fuentes[1].nota}</p>
        </Card>
      )}
    </>
  );
}

/* ── Fotos ──────────────────────────────────────────────────────────────────
   Igual que estaba, incluida la confirmación al borrar: la foto se va de verdad
   de Storage y no vuelve, así que aquí sí se pregunta (E3 F1). */
function BloqueFotos({ fotos, onAddFoto, onDeleteFoto, accent }) {
  const [urls, setUrls] = useState({});
  const [uploading, setUploading] = useState(false);
  const [nota, setNota] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(fotos.map(async (f) => [f.id, await getSignedPhotoUrl(f.path)]));
      if (!cancelled) setUrls(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [fotos]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      await onAddFoto(file, nota);
      setNota('');
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Card>
        <Field label="Nota (opcional, para esta próxima foto)">
          <TextInput value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej: después de 3 meses de rutina" />
        </Field>
        <label className="block">
          <div
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold w-full cursor-pointer"
            style={{ background: accent, color: COLORS.textOnAccent, opacity: uploading ? 0.6 : 1 }}
          >
            <Camera size={16} strokeWidth={2.5} />
            {uploading ? 'Subiendo…' : 'Añadir foto de progreso'}
          </div>
          <input type="file" accept="image/*" capture="environment" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
      </Card>

      {fotos.length === 0 && <EmptyHint text="Todavía no has subido ninguna foto de progreso." />}
      <div className="grid grid-cols-2 gap-3">
        {[...fotos].reverse().map((f) => (
          <div key={f.id} className="rounded-2xl overflow-hidden relative" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            {urls[f.id]
              ? <img src={urls[f.id]} alt={f.nota || f.fecha} className="w-full aspect-square object-cover" />
              : <div className="w-full aspect-square" />}
            <div className="p-2">
              <p className="text-xs font-semibold" style={{ color: COLORS.text }}>{formatFecha(f.fecha)}</p>
              {f.nota && <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{f.nota}</p>}
            </div>
            {/* Entrega 3 · F1, apartado 3 — la foto se borra de verdad del almacenamiento y
                no pasa por la papelera, así que aquí sí se pregunta antes. */}
            <BotonBorrarDefinitivo
              onConfirm={() => onDeleteFoto(f.id, f.path)}
              label="Borrar foto"
              titulo="¿Eliminar esta foto?"
              detalle="La foto se borra del todo y no se puede recuperar."
              className="absolute top-2 right-2 rounded-full p-2 transition-transform active:scale-90"
              style={{ border: `1px solid ${COLORS.border}` }}
            />
          </div>
        ))}
      </div>
    </>
  );
}

// Fase de Seguridad Centralizada — "Ver fotos privadas" pasa de protección fija (siempre, sin
// opción) a protección de FUNCIÓN configurable (apartado 2): `protegidoFotos` viene de
// `seguridad.protectedActions.includes('fotos_privadas')` en vez de "siempre true". Si Josué la
// desactiva desde Seguridad, esta pestaña se ve directo, sin PinGate — el resto de props
// (`pinHash`/`pinSalt`/`desbloqueadoFotos`/`onDesbloquearFotos`/`onOlvidoPin`) vienen de App.jsx,
// que es quien de verdad decide y guarda el estado de protección (un único sistema).
export default function HealthView({ salud, fotos, perfil, onAddMedida, onDeleteMedida, onAddHistorial, onDeleteHistorial, onAddFoto, onDeleteFoto, protegidoFotos, pinHash, pinSalt, desbloqueadoFotos, onDesbloquearFotos, onOlvidoPin, accent }) {
  const [abiertas, setAbiertas] = useState(() => aperturaInicialBN());
  const [pedirMedida, setPedirMedida] = useState(false);

  const alternar = (id) => setAbiertas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const estado = estadoActual({ salud, perfil });
  const aviso = avisoDeRegistro({ salud });
  const lesiones = lesionesDe({ salud, perfil });
  const plegables = SECCIONES_BIENESTAR.filter((s) => s.plegable);

  const abrirMedidas = () => {
    setAbiertas((prev) => (prev.includes('medidas') ? prev : [...prev, 'medidas']));
    setPedirMedida(true);
  };

  const contenido = {
    medidas: (
      <BloqueMedidas
        medidas={salud.medidas} onAdd={onAddMedida} onDeleteMedida={onDeleteMedida} accent={accent}
        abrirFormulario={pedirMedida} onFormularioAbierto={() => setPedirMedida(false)}
      />
    ),
    fotos: protegidoFotos ? (
      <PinGate
        pinHash={pinHash} pinSalt={pinSalt} accent={accent}
        desbloqueado={desbloqueadoFotos} onDesbloquear={onDesbloquearFotos} onOlvidoPin={onOlvidoPin}
      >
        <BloqueFotos fotos={fotos} onAddFoto={onAddFoto} onDeleteFoto={onDeleteFoto} accent={accent} />
      </PinGate>
    ) : (
      <BloqueFotos fotos={fotos} onAddFoto={onAddFoto} onDeleteFoto={onDeleteFoto} accent={accent} />
    ),
    historial: (
      <BloqueHistorial
        historial={salud.historial} lesiones={lesiones} onAdd={onAddHistorial}
        onDeleteHistorial={onDeleteHistorial} accent={accent}
      />
    ),
  };

  return (
    <div className="space-y-4 pb-4">
      {/* 🚨 Apartado 3 — el área ya se llama Bienestar, así que aquí NO se repite:
          la pantalla es «Mi salud». Antes ponía «Salud» dentro del área «Salud». */}
      <SectionTitle sub={SUBTITULO_MODULO}>
        <span className="flex items-center gap-2"><HeartPulse size={18} style={{ color: accent }} /> {NOMBRE_MODULO}</span>
      </SectionTitle>

      <EstadoBN estado={estado} aviso={aviso} accent={accent} onRegistrar={abrirMedidas} />

      <div className="space-y-3">
        {plegables.map((s, i) => (
          <SeccionBN
            key={s.id}
            seccion={s}
            resumen={resumenDeSeccion(s.id, { salud, fotos, perfil })}
            abierta={abiertas.includes(s.id)}
            onAlternar={alternar}
            accent={accent}
            indice={i}
          >
            {contenido[s.id]}
          </SeccionBN>
        ))}
      </div>

      <AIPanel
        label="Analizar mi salud"
        accent={accent}
        buildPrompt={() =>
          `Medidas de salud de Josué, 16 años, en desarrollo (JSON): ${JSON.stringify(salud.medidas.slice(-15))}. ` +
          `Historial médico reciente (JSON): ${JSON.stringify(salud.historial.slice(-10))}. ` +
          `No des objetivos de peso ni calóricos estrictos, ni interpretes esto como diagnóstico médico. ` +
          `Si detectas un patrón simple en los datos, dilo citando el dato concreto; si no hay suficientes datos, dilo abiertamente.`
        }
      />
    </div>
  );
}
