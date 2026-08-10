import React, { useState } from 'react';
import { Church, Trash2, ChevronDown, ChevronUp, CheckCircle2, Circle, Plus } from 'lucide-react';
import { COLORS, TIPOS_SERVICIO_FE, TIPOS_EVENTO_FE, PLAZOS_OBJETIVO } from '../tokens';
import { uid, todayISO, formatFecha } from '../lib/helpers';
import { Card, SectionTitle, Field, TextInput, Textarea, Select, PrimaryButton, ToggleTab, EmptyHint, AIPanel } from '../components/ui';

// Instrucción de seguridad para cualquier AIPanel de este módulo: AIPanel usa el mismo
// AI_SYSTEM general de la app (ui.jsx), así que la restricción doctrinal va dentro del propio
// prompt, igual que otras vistas ya meten sus propias restricciones ahí (ej. ObjectivesView).
const AVISO_DOCTRINAL =
  'No des nunca autoridad doctrinal ni zanjes preguntas de fe profundas o de interpretación religiosa — ' +
  'si el texto las roza, dilo abiertamente y recomienda hablarlo con su comunidad o responsable de pastoral. ' +
  'Limítate a reflejar patrones o ánimo a partir de estos datos concretos, con el mismo cuidado que un diario personal.';

function ServicioTab({ servicio, onAdd, onDelete, accent }) {
  const [form, setForm] = useState({ tipo: TIPOS_SERVICIO_FE[0], fecha: todayISO(), notas: '' });

  const submit = () => {
    if (!form.fecha) return;
    onAdd({ id: uid(), ...form });
    setForm({ tipo: TIPOS_SERVICIO_FE[0], fecha: todayISO(), notas: '' });
  };

  const ordenado = [...servicio].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  return (
    <div className="space-y-4">
      <Card>
        <Field label="Tipo de servicio">
          <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            {TIPOS_SERVICIO_FE.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Fecha">
          <TextInput type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
        </Field>
        <Field label="Notas (opcional)">
          <Textarea rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Algo que quieras recordar de este servicio…" />
        </Field>
        <PrimaryButton accent={accent} icon={Plus} onClick={submit}>Registrar servicio</PrimaryButton>
      </Card>

      {ordenado.length === 0 ? (
        <EmptyHint text="Todavía no has registrado ningún servicio." />
      ) : (
        <div className="space-y-2">
          {ordenado.map((s) => (
            <Card key={s.id} style={{ padding: '1rem' }} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{s.tipo}</p>
                <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{formatFecha(s.fecha)}{s.notas ? ` · ${s.notas}` : ''}</p>
              </div>
              <button onClick={() => onDelete(s.id)} aria-label="Eliminar servicio"><Trash2 size={14} style={{ color: COLORS.textMuted }} /></button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function estadoEvento(fecha) {
  const hoy = todayISO();
  if (fecha === hoy) return { label: 'Hoy', pasado: false };
  if (fecha < hoy) return { label: 'Pasado', pasado: true };
  const dias = Math.round((new Date(fecha + 'T00:00:00') - new Date(hoy + 'T00:00:00')) / 86400000);
  return { label: dias === 1 ? 'Mañana' : `En ${dias} días`, pasado: false };
}

function CalendarioTab({ eventos, onAdd, onDelete, accent }) {
  const [form, setForm] = useState({ tipo: TIPOS_EVENTO_FE[0], titulo: '', fecha: todayISO(), notas: '' });

  const submit = () => {
    if (!form.titulo.trim() || !form.fecha) return;
    onAdd({ id: uid(), ...form, titulo: form.titulo.trim() });
    setForm({ tipo: TIPOS_EVENTO_FE[0], titulo: '', fecha: todayISO(), notas: '' });
  };

  // A diferencia de las fechas de Relación, un evento aquí es puntual — un retiro que ya pasó no
  // "vuelve" solo el año que viene, así que se ordena por fecha literal, sin recalcular ninguna
  // recurrencia (ver nota en tokens.js).
  const ordenados = [...eventos].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const proximos = ordenados.filter((e) => !estadoEvento(e.fecha).pasado);
  const pasados = ordenados.filter((e) => estadoEvento(e.fecha).pasado).reverse();

  return (
    <div className="space-y-4">
      <Card>
        <Field label="Tipo">
          <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            {TIPOS_EVENTO_FE.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Título">
          <TextInput value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Retiro de Adviento" />
        </Field>
        <Field label="Fecha">
          <TextInput type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
        </Field>
        <Field label="Notas (opcional)">
          <Textarea rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Lugar, hora, quién más va…" />
        </Field>
        <PrimaryButton accent={accent} icon={Plus} onClick={submit}>Añadir al calendario</PrimaryButton>
      </Card>

      {eventos.length === 0 && <EmptyHint text="Todavía no has añadido nada al calendario." />}

      {proximos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold px-1" style={{ color: COLORS.textMuted }}>PRÓXIMOS</p>
          {proximos.map((e) => {
            const estado = estadoEvento(e.fecha);
            return (
              <Card key={e.id} style={{ padding: '1rem' }} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{e.titulo}</p>
                  <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{e.tipo} · {formatFecha(e.fecha)} · {estado.label}</p>
                  {e.notas && <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{e.notas}</p>}
                </div>
                <button onClick={() => onDelete(e.id)} aria-label="Eliminar evento"><Trash2 size={14} style={{ color: COLORS.textMuted }} /></button>
              </Card>
            );
          })}
        </div>
      )}

      {pasados.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold px-1" style={{ color: COLORS.textMuted }}>PASADOS</p>
          {pasados.map((e) => (
            <Card key={e.id} style={{ padding: '1rem' }} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>{e.titulo}</p>
                <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{e.tipo} · {formatFecha(e.fecha)}</p>
              </div>
              <button onClick={() => onDelete(e.id)} aria-label="Eliminar evento"><Trash2 size={14} style={{ color: COLORS.textMuted }} /></button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DiarioFeCard({ entrada, accent, onDelete }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <Card style={{ padding: '1rem' }}>
      <button onClick={() => setAbierta(!abierta)} className="w-full flex items-center justify-between text-left">
        <div>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{formatFecha(entrada.fecha)}</p>
          {!abierta && <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{entrada.texto.slice(0, 50)}{entrada.texto.length > 50 ? '…' : ''}</p>}
        </div>
        {abierta ? <ChevronUp size={16} style={{ color: COLORS.textMuted }} /> : <ChevronDown size={16} style={{ color: COLORS.textMuted }} />}
      </button>
      {abierta && (
        <div className="mt-3 pt-3 space-y-2.5" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <p className="text-sm leading-relaxed" style={{ color: COLORS.text }}>{entrada.texto}</p>
          <button onClick={() => onDelete(entrada.id)} className="flex items-center gap-1.5 text-xs font-medium pt-1" style={{ color: COLORS.textMuted }}>
            <Trash2 size={13} /> Eliminar entrada
          </button>
        </div>
      )}
    </Card>
  );
}

function DiarioEspiritualTab({ diario, onAdd, onDelete, accent }) {
  const hoy = todayISO();
  const [texto, setTexto] = useState('');
  const entradaHoy = diario.find((e) => e.fecha === hoy);

  const guardar = () => {
    if (!texto.trim()) return;
    onAdd({ id: uid(), fecha: hoy, texto: texto.trim() });
    setTexto('');
  };

  const anteriores = diario.filter((e) => e.fecha !== hoy).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  return (
    <div className="space-y-4">
      {entradaHoy ? (
        <EmptyHint text={`Ya has escrito tu entrada de hoy (${formatFecha(hoy)}). Ábrela abajo si quieres releerla.`} />
      ) : (
        <Card>
          <Field label={`Entrada de hoy · ${formatFecha(hoy)}`}>
            <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Cómo ha ido tu día en tu vida de fe, qué te ha hablado, qué te llevas…" />
          </Field>
          <PrimaryButton accent={accent} disabled={!texto.trim()} onClick={guardar}>Guardar entrada de hoy</PrimaryButton>
        </Card>
      )}

      <AIPanel
        label="Reflexionar sobre mis últimas entradas"
        accent={accent}
        buildPrompt={() =>
          `Últimas entradas del diario espiritual de Josué, de más reciente a más antigua (JSON, máximo 15): ${JSON.stringify(
            [...(entradaHoy ? [{ fecha: hoy, texto }] : []), ...anteriores].slice(0, 15).map((e) => ({ fecha: e.fecha, texto: e.texto }))
          )}. Refleja con calidez qué temas o ánimos se repiten, basándote solo en estos datos concretos; si hay muy pocas entradas para ver un patrón real, dilo abiertamente. ${AVISO_DOCTRINAL}`
        }
      />

      {anteriores.length === 0 ? (
        <EmptyHint text="Todavía no hay entradas anteriores." />
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold px-1" style={{ color: COLORS.textMuted }}>ENTRADAS ANTERIORES</p>
          {anteriores.map((e) => <DiarioFeCard key={e.id} entrada={e} accent={accent} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}

function ObjetivosFeTab({ objetivos, onAdd, onUpdate, onDelete, accent }) {
  const [texto, setTexto] = useState('');
  const [plazo, setPlazo] = useState(PLAZOS_OBJETIVO[0]);

  const submit = () => {
    if (!texto.trim()) return;
    onAdd({ id: uid(), texto: texto.trim(), plazo, cumplido: false, fechaCreacion: todayISO() });
    setTexto('');
  };

  return (
    <div className="space-y-4">
      <Card>
        <Field label="Objetivo espiritual">
          <TextInput value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej: rezar cada noche antes de dormir" />
        </Field>
        <Field label="Plazo">
          <Select value={plazo} onChange={(e) => setPlazo(e.target.value)}>
            {PLAZOS_OBJETIVO.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <PrimaryButton accent={accent} icon={Plus} onClick={submit}>Añadir objetivo</PrimaryButton>
      </Card>

      {objetivos.length === 0 && <EmptyHint text="Todavía no tienes objetivos espirituales." />}

      {PLAZOS_OBJETIVO.map((p) => {
        const delPlazo = objetivos.filter((o) => o.plazo === p);
        if (delPlazo.length === 0) return null;
        return (
          <div key={p} className="space-y-2">
            <p className="text-xs font-semibold px-1" style={{ color: COLORS.textMuted }}>{p.toUpperCase()}</p>
            {delPlazo.map((o) => (
              <Card key={o.id} className="flex items-center justify-between" style={{ padding: '1rem' }}>
                <button onClick={() => onUpdate({ ...o, cumplido: !o.cumplido })} className="flex items-center gap-3 flex-1 text-left">
                  {o.cumplido ? <CheckCircle2 size={19} style={{ color: accent }} /> : <Circle size={19} style={{ color: COLORS.textMuted }} />}
                  <p className="text-sm" style={{ color: o.cumplido ? COLORS.textMuted : COLORS.text, textDecoration: o.cumplido ? 'line-through' : 'none' }}>
                    {o.texto}
                  </p>
                </button>
                <button onClick={() => onDelete(o.id)} aria-label="Eliminar objetivo"><Trash2 size={15} style={{ color: COLORS.textMuted }} /></button>
              </Card>
            ))}
          </div>
        );
      })}

      <AIPanel
        label="¿Voy por buen camino?"
        accent={accent}
        buildPrompt={() =>
          `Objetivos espirituales de Josué (JSON): ${JSON.stringify(objetivos.map((o) => ({ texto: o.texto, plazo: o.plazo, cumplido: o.cumplido })))}. ` +
          `Valora brevemente si parece ir avanzando según lo que tiene marcado como cumplido, sin inventar datos que no tengas. ${AVISO_DOCTRINAL}`
        }
      />
    </div>
  );
}

export default function FaithView({ fe, onAddServicio, onDeleteServicio, onAddEvento, onDeleteEvento, onAddDiarioFe, onDeleteDiarioFe, onAddObjetivoFe, onUpdateObjetivoFe, onDeleteObjetivoFe, accent }) {
  const [sub, setSub] = useState('servicio');

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Mi servicio, calendario, diario espiritual y objetivos">
        <span className="flex items-center gap-2"><Church size={18} style={{ color: accent }} /> Fe</span>
      </SectionTitle>

      <div className="flex gap-1.5 flex-wrap">
        <ToggleTab active={sub === 'servicio'} onClick={() => setSub('servicio')} accent={accent}>Servicio</ToggleTab>
        <ToggleTab active={sub === 'calendario'} onClick={() => setSub('calendario')} accent={accent}>Calendario</ToggleTab>
        <ToggleTab active={sub === 'diario'} onClick={() => setSub('diario')} accent={accent}>Diario</ToggleTab>
        <ToggleTab active={sub === 'objetivos'} onClick={() => setSub('objetivos')} accent={accent}>Objetivos</ToggleTab>
      </div>

      {sub === 'servicio' && <ServicioTab servicio={fe.servicio} onAdd={onAddServicio} onDelete={onDeleteServicio} accent={accent} />}
      {sub === 'calendario' && <CalendarioTab eventos={fe.eventos} onAdd={onAddEvento} onDelete={onDeleteEvento} accent={accent} />}
      {sub === 'diario' && <DiarioEspiritualTab diario={fe.diario} onAdd={onAddDiarioFe} onDelete={onDeleteDiarioFe} accent={accent} />}
      {sub === 'objetivos' && <ObjetivosFeTab objetivos={fe.objetivos} onAdd={onAddObjetivoFe} onUpdate={onUpdateObjetivoFe} onDelete={onDeleteObjetivoFe} accent={accent} />}
    </div>
  );
}
