import React, { useState } from 'react';
import { Trash2, RotateCcw, Moon, Dumbbell, Wallet, HeartPulse, Apple, GraduationCap,
  Briefcase, ListTodo, Target, Calendar, BookOpen, Library, Church, Smartphone, Heart } from 'lucide-react';
import { COLORS } from '../tokens';
import { Card, EmptyHint, Switch } from '../components/ui';
import { describirEntrada, tiempoDesde, diasRestantes, ordenarPapelera, OPCIONES_RETENCION } from '../lib/papelera';

// Cada entrada de la papelera guarda una clave de icono; aquí se resuelve al componente real,
// mismo patrón string→componente que ya usa `ICONOS_PERSONALIZABLES_MAP` (los componentes de
// React no son serializables, así que nunca se guardan en Supabase).
const ICONOS = {
  sueno: Moon, entreno: Dumbbell, economia: Wallet, salud: HeartPulse, nutricion: Apple,
  estudios: GraduationCap, negocio: Briefcase, productividad: ListTodo, objetivos: Target,
  calendario: Calendar, diario: BookOpen, biblioteca: Library, fe: Church,
  bienestar: Smartphone, relacion: Heart,
};

// Entrega 2 · ME Fase 3 — "Eliminados recientemente".
//
// Papelera global: no es una lista por módulo, es una única lista con todo lo borrado,
// ordenada por cuándo se borró. Cada elemento se puede recuperar (vuelve exactamente a su
// sitio) o eliminar definitivamente.
//
// PRIVACIDAD
// `relacionDesbloqueada` decide si se ve la etiqueta de un elemento de Relación. Es el único
// módulo protegido de principio a fin, y esta pantalla se abre desde Ajustes sin pedir PIN —
// enseñar aquí "Aniversario con María" sería una fuga real. Bloqueado, se muestra como
// "Elemento privado" y no se puede restaurar (restaurarlo sin identificarlo sería a ciegas).
// Mismo mecanismo y mismo criterio que ya se aplicó al integrar Relación en el Calendario.
export default function PapeleraView({ papelera, relacionDesbloqueada, onRestaurar, onEliminarDefinitivo, onVaciar, onSetRetencion, accent }) {
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(null);
  const [confirmandoVaciar, setConfirmandoVaciar] = useState(false);

  const elementos = ordenarPapelera(papelera?.elementos);
  const retencion = papelera?.retencionDias ?? 30;

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: COLORS.text }}>
          <Trash2 size={16} style={{ color: accent }} /> Eliminados recientemente
        </p>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          Lo que borras pasa por aquí antes de desaparecer del todo, por si te arrepientes.
          {retencion > 0
            ? ` Se borra solo a los ${retencion} días.`
            : ' No se borra solo: lo eliminas tú cuando quieras.'}
        </p>
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Cuánto tiempo se conserva</p>
        <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
          Pasado ese tiempo, los elementos se eliminan definitivamente sin preguntar.
        </p>
        <div className="flex gap-2 flex-wrap">
          {OPCIONES_RETENCION.map((o) => {
            const activo = retencion === o.value;
            return (
              <button
                key={o.value}
                onClick={() => onSetRetencion(o.value)}
                className="text-xs px-3 py-2 rounded-xl font-semibold"
                style={{
                  background: activo ? accent : COLORS.surface2,
                  color: activo ? COLORS.textOnAccent : COLORS.textMuted,
                  border: `1px solid ${activo ? accent : COLORS.border}`,
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
            {elementos.length === 0 ? 'Vacío' : `${elementos.length} ${elementos.length === 1 ? 'elemento' : 'elementos'}`}
          </p>
          {elementos.length > 0 && !confirmandoVaciar && (
            <button onClick={() => setConfirmandoVaciar(true)} className="text-xs font-semibold" style={{ color: COLORS.negative }}>
              Vaciar papelera
            </button>
          )}
        </div>

        {confirmandoVaciar && (
          <div className="mb-3 px-3 py-2.5 rounded-xl" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.negative}` }}>
            <p className="text-xs font-semibold" style={{ color: COLORS.text }}>¿Vaciar eliminados recientemente?</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: COLORS.textMuted }}>
              Se eliminarán permanentemente los {elementos.length} elementos de la papelera y no podrán recuperarse.
            </p>
            <div className="flex gap-2 justify-end mt-2">
              <button onClick={() => setConfirmandoVaciar(false)} className="text-xs font-semibold px-2.5 py-1.5" style={{ color: COLORS.textMuted }}>Cancelar</button>
              <button
                onClick={() => { onVaciar(); setConfirmandoVaciar(false); }}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                style={{ background: COLORS.negative, color: COLORS.textOnAccent }}
              >
                Vaciar
              </button>
            </div>
          </div>
        )}

        {elementos.length === 0 && (
          <EmptyHint text="No has eliminado nada últimamente. Lo que borres aparecerá aquí." />
        )}

        {elementos.map((e, i) => {
          const Icono = ICONOS[e.icono] || Trash2;
          const bloqueado = e.privado && !relacionDesbloqueada;
          const restantes = diasRestantes(e, retencion);
          const confirmandoEste = confirmandoBorrado === e.id;

          return (
            <div key={e.id} className="py-2.5" style={{ borderBottom: i < elementos.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: COLORS.surface2 }}>
                  <Icono size={15} style={{ color: COLORS.textMuted }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: COLORS.text }}>
                    {describirEntrada(e, { relacionDesbloqueada })}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                    {e.tipo} · Eliminado {tiempoDesde(e.eliminadoEn)}
                    {restantes !== null && ` · ${restantes === 0 ? 'se borra hoy' : `${restantes} ${restantes === 1 ? 'día' : 'días'} para borrarse`}`}
                  </p>
                  {/* Si al borrarlo se llevó otras cosas por delante, decirlo: al recuperarlo
                      vuelven también, y saberlo cambia la decisión. */}
                  {(e.relacionados || []).length > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted, opacity: 0.8 }}>
                      Incluye {e.relacionados.reduce((n, r) => n + r.elementos.length, 0)} elementos relacionados
                    </p>
                  )}
                </div>
                {!confirmandoEste && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onRestaurar(e.id)}
                      disabled={bloqueado}
                      className="p-1.5 rounded-lg disabled:opacity-30"
                      style={{ background: COLORS.surface2 }}
                      aria-label="Recuperar"
                      title={bloqueado ? 'Desbloquea Relación para recuperarlo' : 'Recuperar'}
                    >
                      <RotateCcw size={14} style={{ color: accent }} />
                    </button>
                    <button
                      onClick={() => setConfirmandoBorrado(e.id)}
                      className="p-1.5 rounded-lg"
                      style={{ background: COLORS.surface2 }}
                      aria-label="Eliminar definitivamente"
                    >
                      <Trash2 size={14} style={{ color: COLORS.negative }} />
                    </button>
                  </div>
                )}
              </div>

              {confirmandoEste && (
                <div className="mt-2 px-3 py-2.5 rounded-xl" style={{ background: COLORS.surface2 }}>
                  <p className="text-xs font-semibold" style={{ color: COLORS.text }}>¿Eliminar definitivamente?</p>
                  <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                    Este elemento no podrá recuperarse después.
                  </p>
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => setConfirmandoBorrado(null)} className="text-xs font-semibold px-2.5 py-1.5" style={{ color: COLORS.textMuted }}>Cancelar</button>
                    <button
                      onClick={() => { onEliminarDefinitivo(e.id); setConfirmandoBorrado(null); }}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                      style={{ background: COLORS.negative, color: COLORS.textOnAccent }}
                    >
                      Eliminar definitivamente
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {elementos.some((e) => e.privado) && !relacionDesbloqueada && (
        <Card>
          <p className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>
            Hay elementos de Relación en la papelera. Para verlos y recuperarlos, entra antes en
            Relación e introduce tu PIN.
          </p>
        </Card>
      )}
    </div>
  );
}
