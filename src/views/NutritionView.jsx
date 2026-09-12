import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Camera, Droplet, Star, Loader2, Barcode, Plus, Trash2, ChevronLeft, ChevronRight, CalendarDays, Settings, Check, Search, Pencil, Repeat, BarChart3 } from 'lucide-react';
import { COLORS, VASO_ML } from '../tokens';
import { uid, todayISO, addDays, hexToRgba, calcularEdad } from '../lib/helpers';
/* Entrega 3 · F33 (NU F1) — el catálogo de indicadores y momentos, el resumen del
   día y los estados vacíos. 🚨 Los objetivos NO están: son la Fase 3, y aquí no
   se inventa ninguno (`NO_EN_NU1`). */
import {
  MOMENTOS, resumenDelDia, porMomento, hayAlgoRegistrado,
  VACIO_DIA, VACIO_MOMENTO,
  /* Entrega 3 · F34 (NU F2) — el sistema de días: la tira, el calendario mensual
     —que reutiliza `celdasMes`, no una cuadrícula nueva— y el estado de un día. */
  tiraDeDias, mesDeNutricion, tituloDeMes, tituloDelDia, estadoDeDia,
} from '../lib/nutricion';
/* Entrega 3 · F35 (NU F3) — los objetivos, que la NU F1 dejó declarados como
   «los pondrá él». 🔒 La app **propone**; sin confirmar no escribe, y los cuatro
   números se pueden cambiar uno a uno. */
import {
  DATOS_DEL_PERFIL, SEXO_BMR, sexoDesdePerfil, NIVELES_ACTIVIDAD, OBJETIVOS_NUTRICION,
  PASOS_CONFIG, validar, planObjetivos, editarObjetivo, coherencia,
  objetivosParaResumen, avisoDePeso, CTA_SIN_CONFIGURAR, AVISO_ORIENTATIVO,
  normalizarObjetivosNut,
} from '../lib/objetivosNutricion';
/* Entrega 3 · F36 (NU F4) — el registro de alimentos: la base con sus valores de
   referencia, el buscador, la cantidad y el cálculo proporcional. 🚨 `escalar()`
   sale del escáner, que ya lo hacía: no es una cuenta nueva. */
import {
  BASE_ALIMENTOS, buscarAlimentos, alimentoDesdeOFF, escalar, validarCantidad,
  crearComidaDesdeAlimento, cambiarCantidad, cambiarMomento, unidad, UNIDADES, textoCantidad,
  lineaDeMomento, estadoDeIndicador, excesoDe, AVISO_REFERENCIA, VACIO_MOMENTO_F4,
  MINIMO_BUSQUEDA,
} from '../lib/alimentos';
/* Entrega 3 · F37 (NU F5) — los alimentos propios, los favoritos y los recientes.
   🚨 Este archivo NO redefine nada de `alimentos.js`: el buscador, el escalado y
   las unidades son suyos y se importan de allí. */
import {
  CATEGORIAS_ALIMENTO, CATEGORIA_POR_DEFECTO, CAMPOS_PROPIO, validarPropio,
  crearAlimentoPropio, editarAlimentoPropio, esFavorito, recientesPorDia,
  reutilizarComida, catalogoCompleto, buscarEnTodos, resumenNutricional,
  SECCIONES_SELECTOR, seccionSelector, ACCION_CREAR, selectorInicial,
} from '../lib/misAlimentos';
/* Entrega 3 · F38 (NU F6) — las estadísticas. 🚨 No guardan ni una cifra: se
   cuentan en el momento sobre las comidas que ya existen. */
import {
  PERIODOS_NUT, PERIODO_NUT_POR_DEFECTO, promediosDelPeriodo, cumplimientoDelPeriodo,
  evolucion, MACROS_EVOLUCION, constancia, NO_ES_RACHA, mejorYPeorDia,
  analisisProteina, analisisCalorias, hayEstadisticas,
  VACIO_ESTADISTICAS, ACCESO_ESTADISTICAS, TEXTO_SIN_DATOS_NUT,
} from '../lib/estadisticasNutricion';
/* Entrega 3 · F39 (NU F7) — el análisis. 🚨 Es LOCAL y de reglas: no llama a la
   IA en ningún renderizado (apartado 13), así que si la IA no contesta la
   pantalla no pierde nada (apartado 15). */
import {
  TITULO_PANEL, analizarNutricion, resumenParaHoy, contextoIANutricion,
} from '../lib/inteligenciaNutricion';
import { buscarProductoPorCodigoBarras, buscarAlimentosPorNombre } from '../lib/openFoodFacts';
import { askAIWithImage, AI_SYSTEM } from '../lib/ai';
import { BotonBorrar, Card, SectionTitle, Field, TextInput, PrimaryButton, GhostBtn, ToggleTab, EmptyHint, AIPanel } from '../components/ui';
import BarcodeScanner from '../components/BarcodeScanner';

const emptyForm = () => ({ nombre: '', calorias: '', proteinas: '', carbohidratos: '', grasas: '', fibra: '' });
const round1 = (v) => Math.round((v || 0) * 10) / 10;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* 🚨 E3 F33 (NU F1) — el formulario recibe **el día que se está mirando y el
   momento desde el que se ha abierto**. Antes escribía `todayISO()` a pelo, así
   que con un selector de días que funciona habría guardado siempre en hoy: el
   selector habría sido decorativo (regla 8). */
function MealForm({ onSave, onSaveFavorite, accent, fecha, momentoId }) {
  const [form, setForm] = useState(emptyForm());
  const [scanning, setScanning] = useState(false);
  const [productoEscaneado, setProductoEscaneado] = useState(null);
  const [gramos, setGramos] = useState('100');
  const [analizandoFoto, setAnalizandoFoto] = useState(false);
  const [aviso, setAviso] = useState('');

  const handleBarcodeDetected = async (codigo) => {
    setScanning(false);
    setAviso('Buscando el producto…');
    try {
      const producto = await buscarProductoPorCodigoBarras(codigo);
      if (!producto) {
        setAviso('No he encontrado ese código en Open Food Facts — rellena los datos a mano.');
        return;
      }
      setProductoEscaneado(producto);
      setGramos('100');
      setForm({
        nombre: producto.nombre,
        calorias: producto.por100g.calorias,
        proteinas: producto.por100g.proteinas,
        carbohidratos: producto.por100g.carbohidratos,
        grasas: producto.por100g.grasas,
        fibra: producto.por100g.fibra,
      });
      setAviso('');
    } catch (e) {
      setAviso('No se pudo consultar la base de datos de productos. Prueba otra vez o rellena a mano.');
    }
  };

  const aplicarGramos = (g) => {
    setGramos(g);
    if (!productoEscaneado) return;
    const factor = Number(g) / 100;
    const p = productoEscaneado.por100g;
    setForm((f) => ({
      ...f,
      calorias: Math.round(p.calorias * factor),
      proteinas: round1(p.proteinas * factor),
      carbohidratos: round1(p.carbohidratos * factor),
      grasas: round1(p.grasas * factor),
      fibra: round1(p.fibra * factor),
    }));
  };

  const handleFotoComida = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAnalizandoFoto(true);
    setAviso('');
    setProductoEscaneado(null);
    try {
      const base64 = await fileToBase64(file);
      const respuesta = await askAIWithImage(
        AI_SYSTEM,
        'Mira esta foto de comida. Devuelve SOLO un JSON, sin texto antes ni después ni marcas de código, con este formato exacto: {"nombre":"...", "calorias":N, "proteinas":N, "carbohidratos":N, "grasas":N, "fibra":N} — valores aproximados del plato completo visible. Si no hay comida identificable, responde {"nombre":"", "calorias":0, "proteinas":0, "carbohidratos":0, "grasas":0, "fibra":0}.',
        base64,
        file.type || 'image/jpeg'
      );
      const limpio = respuesta.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(limpio);
      if (!parsed.nombre) {
        setAviso('No he podido identificar comida en esa foto — prueba con otra o rellena a mano.');
      } else {
        setForm({
          nombre: parsed.nombre,
          calorias: parsed.calorias || '',
          proteinas: parsed.proteinas || '',
          carbohidratos: parsed.carbohidratos || '',
          grasas: parsed.grasas || '',
          fibra: parsed.fibra || '',
        });
        setAviso('Estimación de la IA a partir de la foto — revisa los números antes de guardar, no es una medición exacta.');
      }
    } catch (err) {
      setAviso('No he podido analizar la foto ahora mismo. Prueba otra vez o rellena a mano.');
    } finally {
      setAnalizandoFoto(false);
    }
  };

  const submit = (guardarFavorito) => {
    if (!form.nombre) return;
    const entry = {
      id: uid(),
      fecha: fecha || todayISO(),
      momento: momentoId || null,
      nombre: form.nombre,
      calorias: Number(form.calorias) || 0,
      proteinas: Number(form.proteinas) || 0,
      carbohidratos: Number(form.carbohidratos) || 0,
      grasas: Number(form.grasas) || 0,
      fibra: Number(form.fibra) || 0,
    };
    onSave(entry);
    if (guardarFavorito) onSaveFavorite(entry);
    setForm(emptyForm());
    setProductoEscaneado(null);
    setAviso('');
  };

  return (
    <Card>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <GhostBtn onClick={() => setScanning(true)} icon={Barcode}>Escanear código</GhostBtn>
        <label className="block">
          <div
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer"
            style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}`, opacity: analizandoFoto ? 0.6 : 1 }}
          >
            {analizandoFoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {analizandoFoto ? 'Analizando…' : 'Foto del plato'}
          </div>
          <input type="file" accept="image/*" capture="environment" onChange={handleFotoComida} disabled={analizandoFoto} className="hidden" />
        </label>
      </div>

      {aviso && <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>{aviso}</p>}

      {productoEscaneado && (
        <div className="rounded-xl p-3 mb-3" style={{ background: COLORS.surface2 }}>
          <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
            {productoEscaneado.marca && `${productoEscaneado.marca} — `}valores de la etiqueta por 100 g. Ajusta a la cantidad que comes de verdad:
          </p>
          <Field label="Cantidad consumida (g)">
            <TextInput type="number" value={gramos} onChange={(e) => aplicarGramos(e.target.value)} />
          </Field>
        </div>
      )}

      <Field label="Nombre">
        <TextInput value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. tortilla de patatas" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Calorías (kcal)">
          <TextInput type="number" value={form.calorias} onChange={(e) => setForm({ ...form, calorias: e.target.value })} />
        </Field>
        <Field label="Proteínas (g)">
          <TextInput type="number" value={form.proteinas} onChange={(e) => setForm({ ...form, proteinas: e.target.value })} />
        </Field>
        <Field label="Carbohidratos (g)">
          <TextInput type="number" value={form.carbohidratos} onChange={(e) => setForm({ ...form, carbohidratos: e.target.value })} />
        </Field>
        <Field label="Grasas (g)">
          <TextInput type="number" value={form.grasas} onChange={(e) => setForm({ ...form, grasas: e.target.value })} />
        </Field>
      </div>
      <Field label="Fibra (g)">
        <TextInput type="number" value={form.fibra} onChange={(e) => setForm({ ...form, fibra: e.target.value })} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <PrimaryButton accent={accent} onClick={() => submit(false)}>Guardar comida</PrimaryButton>
        <GhostBtn onClick={() => submit(true)} icon={Star}>Guardar y marcar favorita</GhostBtn>
      </div>

      {scanning && <BarcodeScanner accent={accent} onDetected={handleBarcodeDetected} onClose={() => setScanning(false)} />}
    </Card>
  );
}

/* ── El resumen del día — apartados 2, 3 y 4 ───────────────────────────────
   🚨 **Sin objetivo no se pinta un objetivo.** `resumenDelDia` deja `objetivo` y
   `porcentaje` en `null` mientras no exista la Fase 3, así que aquí se ve lo
   consumido y ya: ni un «/ 2.400» inventado, ni una barra al 0 %. El día que la
   Fase 3 traiga los objetivos, esta pantalla **no cambia**. */
function Indicador({ dato, accent, principal = false, indice = 0 }) {
  const estado = estadoDeIndicador(dato);
  const sobra = excesoDe(dato);
  return (
    <div
      className="hub-card rounded-2xl p-3"
      style={{
        animationDelay: `${indice * 60}ms`,
        background: principal
          ? `linear-gradient(135deg, ${hexToRgba(accent, 0.14)}, ${hexToRgba(accent, 0.04)})`
          : COLORS.surface2,
        border: `1px solid ${principal ? hexToRgba(accent, 0.3) : COLORS.border}`,
      }}
    >
      {/* GE F1 — en la fila de tres, el rótulo corto; en la tarjeta grande de
          kcal, el de siempre. ⚠️ `?? dato.nombre` para que un indicador sin
          `corto` siga pintando algo: un catálogo puede crecer, y un hueco no
          falla en ninguna parte (E3 F16). */}
      <p className="text-xs flex items-center gap-1 whitespace-nowrap" style={{ color: COLORS.textMuted }}>
        <span>{dato.emoji}</span>{principal ? dato.nombre : (dato.corto ?? dato.nombre)}
      </p>
      <p
        className={`${principal ? 'text-3xl' : 'text-xl'} font-extrabold mt-1 leading-none`}
        style={{ color: principal ? accent : COLORS.text, fontFamily: "'Manrope', sans-serif" }}
      >
        {dato.consumido}
        <span className={`${principal ? 'text-sm' : 'text-xs'} font-bold ml-1`} style={{ color: COLORS.textMuted }}>{dato.unidad}</span>
      </p>
      {/* Solo cuando de verdad hay un objetivo (apartados 3 y 4). */}
      {dato.objetivo !== null && (
        <>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>de {dato.objetivo} {dato.unidad}</p>
          {/* 🚨 E3 F36 (NU F4), apartado 11 — *"no romper la barra ni generar
              porcentajes visualmente absurdos"*: el ancho es `porcentajePintado`,
              que se topa en 100 desde la F35, y el dato de al lado **no**. */}
          <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: COLORS.border }}>
            <div
              className="h-full rounded-full nu-progreso"
              style={{ width: `${dato.porcentajePintado}%`, background: estado.id === 'superado' ? COLORS.warning : accent }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: estado.id === 'superado' ? COLORS.warning : COLORS.textMuted }}>
            {dato.porcentaje} %{sobra !== null ? ` · ${sobra} ${dato.unidad} por encima` : ''}
          </p>
        </>
      )}
    </div>
  );
}

/* ── El calendario del mes — apartado 10 ───────────────────────────────────
   🚨 **La cuadrícula NO se escribe otra vez**: `mesDeNutricion` se apoya en
   `celdasMes`, que existe desde el Calendario Universal y ya resuelve el hueco
   antes del día 1 y los meses de cuatro a seis filas.

   ⚠️ Y es un panel que se despliega, no una pantalla a pantalla completa: *"No
   crear una pantalla gigante que ocupe innecesariamente todo el espacio"*. */
const INICIALES_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function CalendarioNutricion({ comidas, fecha, hoy, accent, onElegir }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date(`${fecha}T00:00:00`);
    return { anio: d.getFullYear(), mes: d.getMonth() };
  });
  const celdas = mesDeNutricion(comidas, { anio: cursor.anio, mes: cursor.mes, seleccionado: fecha, hoy });
  const mover = (n) => setCursor((c) => {
    const d = new Date(c.anio, c.mes + n, 1);
    return { anio: d.getFullYear(), mes: d.getMonth() };
  });

  return (
    <Card style={{ padding: '0.9rem' }}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <button onClick={() => mover(-1)} aria-label="Mes anterior" className="toque-44 p-1.5 -m-1.5 rounded-xl" style={{ color: COLORS.text }}>
          <ChevronLeft size={16} />
        </button>
        <p className="text-xs font-bold uppercase" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>{tituloDeMes(cursor.anio, cursor.mes)}</p>
        <button onClick={() => mover(1)} aria-label="Mes siguiente" className="toque-44 p-1.5 -m-1.5 rounded-xl" style={{ color: COLORS.text }}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {INICIALES_SEMANA.map((d, i) => (
          <p key={i} className="text-center text-[10px] font-bold" style={{ color: COLORS.textMuted }}>{d}</p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celdas.map((c, i) => {
          if (!c) return <div key={`h${i}`} />;
          return (
            <button
              key={c.fecha}
              onClick={() => onElegir(c.fecha)}
              aria-label={`Ir al ${c.dia}`}
              aria-current={c.seleccionado ? 'date' : undefined}
              className="aspect-square rounded-xl flex flex-col items-center justify-center transition-transform active:scale-90"
              style={{
                background: c.seleccionado ? hexToRgba(accent, 0.18) : 'transparent',
                border: `1px solid ${c.seleccionado ? hexToRgba(accent, 0.45) : (c.hoy ? hexToRgba(accent, 0.3) : 'transparent')}`,
                /* ⚠️ Un día futuro se distingue (apartado 7) y uno sin registros
                   también, pero **con más de un color**: el futuro va apagado y
                   los que tienen datos llevan un punto (EH F42). */
                opacity: c.futuro ? 0.45 : 1,
              }}
            >
              <span
                className={`text-xs ${c.hoy || c.seleccionado ? 'font-extrabold' : 'font-medium'}`}
                style={{ color: c.seleccionado || c.hoy ? accent : COLORS.text }}
              >
                {c.dia}
              </span>
              <span
                className="w-1 h-1 rounded-full mt-0.5"
                style={{ background: c.conRegistros ? accent : 'transparent' }}
              />
            </button>
          );
        })}
      </div>
      <p className="text-[10px] mt-2 text-center" style={{ color: COLORS.textMuted }}>
        El punto marca los días con comidas registradas.
      </p>
    </Card>
  );
}

/* ── El selector de días y el mini-historial — apartados 1, 2, 3, 8 y 9 ──── */
function SelectorDia({ comidas, fecha, hoy, accent, onCambiar, calendarioAbierto, onAlternarCalendario }) {
  const tira = tiraDeDias(comidas, fecha, { hoy });
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => onCambiar(addDays(fecha, -1))}
          aria-label="Día anterior"
          className="toque-44 p-1.5 -m-1.5 rounded-xl"
          style={{ color: COLORS.text }}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center min-w-0">
          {/* Apartado 8 — «HOY · 7 SEPT»: la etiqueta relativa Y la fecha, para
              que sepa siempre qué día está mirando (apartado 2). */}
          <p className="text-sm font-bold truncate" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
            {tituloDelDia(fecha, hoy)}
          </p>
          {fecha !== hoy && (
            <button onClick={() => onCambiar(hoy)} className="text-xs font-semibold toque-44" style={{ color: accent }}>
              Volver a hoy
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAlternarCalendario}
            aria-label={calendarioAbierto ? 'Cerrar el calendario' : 'Elegir una fecha'}
            aria-expanded={calendarioAbierto}
            className="toque-44 p-1.5 -m-1.5 rounded-xl"
            style={{ color: calendarioAbierto ? accent : COLORS.textMuted }}
          >
            <CalendarDays size={17} />
          </button>
          <button
            onClick={() => onCambiar(addDays(fecha, 1))}
            aria-label="Día siguiente"
            className="toque-44 p-1.5 -m-1.5 rounded-xl"
            style={{ color: COLORS.text }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Apartado 9 — la tira de días. ⚠️ *"No convertir esto en una gráfica
          compleja"*: son siete botones con su inicial, su número y un punto. */}
      <div className="flex gap-1.5">
        {tira.map((d) => (
          <button
            key={d.fecha}
            onClick={() => onCambiar(d.fecha)}
            aria-label={`Ir al día ${d.dia}`}
            aria-current={d.seleccionado ? 'date' : undefined}
            className="flex-1 rounded-xl py-1.5 flex flex-col items-center transition-transform active:scale-95"
            style={{
              background: d.seleccionado ? hexToRgba(accent, 0.16) : COLORS.surface2,
              border: `1px solid ${d.seleccionado ? hexToRgba(accent, 0.4) : COLORS.border}`,
              opacity: d.futuro ? 0.5 : 1,
            }}
          >
            <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{d.inicial}</span>
            <span
              className={`text-xs ${d.seleccionado || d.hoy ? 'font-extrabold' : 'font-semibold'}`}
              style={{ color: d.seleccionado || d.hoy ? accent : COLORS.text }}
            >
              {d.dia}
            </span>
            <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: d.conRegistros ? accent : 'transparent' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Un momento del día, con sus comidas — apartado 6 ──────────────────────
   🚨 *"Ahora mismo los botones pueden ser visuales/no funcionales si es
   necesario"*, dice el enunciado — pero **el registro de comidas ya funciona**
   desde la Fase 4 del proyecto, así que un botón que no hiciera nada sería un
   control decorativo (regla 8). Cada «Añadir» abre el formulario que ya existe,
   con su escáner de códigos y su foto, y guarda **en ese momento y en ese día**. */
/* ── Añadir alimento — Entrega 3 · F36 (NU F4), apartados 2, 3, 4 y 5 ──────
   El flujo del apartado 2, en dos pasos y sin un formulario gigantesco:

       Buscar alimento → Cantidad → Añadir

   ⚠️ **El formulario a mano no desaparece**: es la salida para lo que no está en
   ninguna base —la tortilla de su madre—, y sigue teniendo el escáner y la foto,
   que existen desde la Fase 4 del proyecto (apartado 18: *"no implementar"* no
   es *"quitar"*). */
/* ── Crear un alimento propio — Entrega 3 · F37 (NU F5), apartados 4 y 5 ───
   *"Permitir al usuario crear un alimento propio… un formulario sencillo"*, con
   sus cinco campos obligatorios y la marca opcional.

   ⚠️ Un alimento propio tiene **la misma forma** que uno de la base, así que el
   buscador, el escalado y el registro de la F4 lo tratan igual, sin un `if`. */
function FormularioAlimento({ accent, inicial, onGuardar, onCancelar }) {
  const [campos, setCampos] = useState(() => ({
    nombre: inicial?.nombre || '',
    marca: inicial?.marca || '',
    tipo: inicial?.tipo || CATEGORIA_POR_DEFECTO,
    unidad: inicial?.unidad || 'g',
    calorias: inicial?.por100?.calorias ?? '',
    proteinas: inicial?.por100?.proteinas ?? '',
    carbohidratos: inicial?.por100?.carbohidratos ?? '',
    grasas: inicial?.por100?.grasas ?? '',
  }));
  const [tocado, setTocado] = useState(false);
  const { errores, valido } = validarPropio(campos);

  const guardar = () => {
    setTocado(true);
    if (!valido) return;
    const r = inicial
      ? editarAlimentoPropio(inicial, campos)
      : crearAlimentoPropio(campos);
    if (r.ok) onGuardar(r.alimento);
  };

  const campo = (id) => (
    <div key={id}>
      <span className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>
        {CAMPOS_PROPIO.find((c) => c.id === id).nombre}
        {CAMPOS_PROPIO.find((c) => c.id === id).por ? ` (por ${CAMPOS_PROPIO.find((c) => c.id === id).por})` : ''}
        {CAMPOS_PROPIO.find((c) => c.id === id).nota ? ` · ${CAMPOS_PROPIO.find((c) => c.id === id).nota}` : ''}
      </span>
      <TextInput
        type={CAMPOS_PROPIO.find((c) => c.id === id).tipo === 'numero' ? 'number' : 'text'}
        inputMode={CAMPOS_PROPIO.find((c) => c.id === id).tipo === 'numero' ? 'numeric' : undefined}
        value={campos[id]}
        onChange={(e) => setCampos({ ...campos, [id]: e.target.value })}
      />
      {tocado && errores[id] && <span className="text-xs block mt-1" style={{ color: COLORS.warning }}>{errores[id]}</span>}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {inicial ? 'Editar alimento' : ACCION_CREAR}
        </p>
        <button onClick={onCancelar} className="toque-44 text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cancelar</button>
      </div>

      {campo('nombre')}
      {campo('marca')}

      {/* La categoría: una línea de `CATEGORIAS_ALIMENTO`, no un mapa aparte. */}
      <div>
        <span className="text-xs block mb-1.5" style={{ color: COLORS.textMuted }}>Categoría</span>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIAS_ALIMENTO.map((c) => (
            <button
              key={c.id} onClick={() => setCampos({ ...campos, tipo: c.id })}
              aria-pressed={campos.tipo === c.id}
              className="toque-44 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
              style={{
                background: campos.tipo === c.id ? hexToRgba(accent, 0.16) : COLORS.surface2,
                color: campos.tipo === c.id ? accent : COLORS.textMuted,
                border: `1px solid ${campos.tipo === c.id ? hexToRgba(accent, 0.4) : COLORS.border}`,
              }}
            >
              {c.emoji} {c.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* La unidad de referencia (apartado 10). */}
      <div>
        <span className="text-xs block mb-1.5" style={{ color: COLORS.textMuted }}>Se mide en</span>
        <div className="flex gap-1.5">
          {UNIDADES.map((u) => (
            <button
              key={u.id} onClick={() => setCampos({ ...campos, unidad: u.id })}
              aria-pressed={campos.unidad === u.id}
              className="flex-1 toque-44 rounded-xl px-2.5 py-2 text-xs font-semibold"
              style={{
                background: campos.unidad === u.id ? hexToRgba(accent, 0.16) : COLORS.surface2,
                color: campos.unidad === u.id ? accent : COLORS.textMuted,
                border: `1px solid ${campos.unidad === u.id ? hexToRgba(accent, 0.4) : COLORS.border}`,
              }}
            >
              {u.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {campo('calorias')}
        {campo('proteinas')}
        {campo('carbohidratos')}
        {campo('grasas')}
      </div>

      <PrimaryButton accent={accent} icon={Check} onClick={guardar} disabled={tocado && !valido}>
        {inicial ? 'Guardar cambios' : 'Crear alimento'}
      </PrimaryButton>
    </div>
  );
}


/* Una fila de alimento del selector, con su ★ (apartado 7). */
function FilaAlimento({ alimento, accent, favorito, onElegir, onFavorito, onEditar, onEliminar }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onElegir(alimento)}
        className="flex-1 min-w-0 text-left rounded-xl px-3 py-2.5 toque-44 transition-transform active:scale-[0.98]"
        style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
      >
        <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>
          {alimento.nombre}{alimento.propio ? ' ·' : ''}
          {alimento.propio && <span className="text-xs font-normal" style={{ color: accent }}> tuyo</span>}
        </p>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          {alimento.marca ? `${alimento.marca} · ` : ''}{resumenNutricional(alimento)}
        </p>
      </button>
      {onFavorito && (
        <button
          onClick={() => onFavorito(alimento.id)}
          aria-label={favorito ? `Quitar ${alimento.nombre} de favoritos` : `Marcar ${alimento.nombre} como favorito`}
          className="toque-44 p-1.5 -m-1.5 flex-shrink-0"
        >
          <Star size={16} style={{ color: favorito ? accent : COLORS.textMuted }} fill={favorito ? accent : 'none'} />
        </button>
      )}
      {onEditar && (
        <button onClick={() => onEditar(alimento)} aria-label={`Editar ${alimento.nombre}`} className="toque-44 p-1.5 -m-1.5 flex-shrink-0">
          <Pencil size={15} style={{ color: COLORS.textMuted }} />
        </button>
      )}
      {onEliminar && <BotonBorrar onClick={() => onEliminar(alimento.id)} label={`Eliminar ${alimento.nombre}`} />}
    </div>
  );
}


function AnadirAlimento({ momentoId, fecha, accent, onAdd, onAddFavorito, onCerrar, nutricion, onGuardarAlimentoPropio, onEliminarAlimentoPropio, onAlternarFavoritoAlimento }) {
  const [texto, setTexto] = useState('');
  const [elegido, setElegido] = useState(null);
  const [cantidad, setCantidad] = useState('');
  /* E3 F37 (NU F5) — crear o editar un alimento propio, y qué sección se ve. */
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [resultadosOFF, setResultadosOFF] = useState([]);
  const [buscandoOFF, setBuscandoOFF] = useState(false);
  const [avisoOFF, setAvisoOFF] = useState('');
  const [aMano, setAMano] = useState(false);

  /* 🚨 E3 F37 (NU F5) — el buscador es **el mismo de la F4**, que ya recibía la
     base por parámetro precisamente para esto: ahora busca en la base global
     **y en los alimentos que ha creado Josué**, con los suyos primero. */
  const propios = nutricion?.alimentosPropios;
  const favoritosAlim = nutricion?.favoritosAlimentos;
  const resultados = buscarEnTodos(texto, propios);
  const inicio = selectorInicial({ favoritos: favoritosAlim, alimentosPropios: propios, comidas: nutricion?.comidas, hoy: todayISO() });
  const recientesDias = recientesPorDia(nutricion?.comidas, catalogoCompleto(propios), todayISO());
  const errorCantidad = cantidad === '' ? null : validarCantidad(cantidad);
  const previsualizacion = elegido && !errorCantidad ? escalar(elegido.por100, cantidad, elegido.unidad || 'g') : null;

  /* Apartado 3 — la segunda fuente, la misma de siempre y sin clave. ⚠️ **A
     petición**, no en cada tecla: cada búsqueda es una llamada de red. */
  const buscarEnOFF = async () => {
    setBuscandoOFF(true);
    setAvisoOFF('');
    try {
      const productos = await buscarAlimentosPorNombre(texto);
      const comoAlimentos = productos.map(alimentoDesdeOFF).filter(Boolean);
      setResultadosOFF(comoAlimentos);
      if (comoAlimentos.length === 0) setAvisoOFF('No he encontrado ningún producto con ese nombre. Puedes escribirlo a mano.');
    } catch (e) {
      setAvisoOFF('No he podido consultar la base de productos ahora mismo. Puedes escribirlo a mano.');
    } finally {
      setBuscandoOFF(false);
    }
  };

  const elegir = (a) => {
    setElegido(a);
    /* ⚠️ La cantidad **no viene puesta**: 100 g de aceite y 100 g de lechuga no
       son el mismo plato, y darle un valor por defecto sería registrar algo que
       él no ha dicho. Lo que sí se hereda es la unidad del alimento. */
    setCantidad('');
  };

  const confirmar = () => {
    const comida = crearComidaDesdeAlimento({ alimento: elegido, cantidad, momentoId, fecha });
    if (!comida) return;
    onAdd(comida);
    setElegido(null); setTexto(''); setCantidad(''); setResultadosOFF([]); setAvisoOFF('');
    onCerrar();
  };

  if (aMano) {
    return (
      <div className="space-y-2">
        <button onClick={() => setAMano(false)} className="toque-44 text-xs font-semibold" style={{ color: accent }}>
          ← Volver al buscador
        </button>
        <MealForm onSave={onAdd} onSaveFavorite={onAddFavorito} accent={accent} fecha={fecha} momentoId={momentoId} />
      </div>
    );
  }

  /* Paso 2 — la cantidad, con los números calculándose delante (apartados 4 y 5). */
  if (elegido) {
    const u = unidad(elegido.unidad || 'g');
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: COLORS.text }}>{elegido.nombre}</p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              {elegido.marca ? `${elegido.marca} · ` : ''}{elegido.por100.calorias} kcal por {u.referencia} {u.corto}
            </p>
          </div>
          <button onClick={() => setElegido(null)} className="toque-44 text-xs font-semibold flex-shrink-0" style={{ color: COLORS.textMuted }}>
            Cambiar
          </button>
        </div>

        <Field label={`Cantidad (${u.corto})`}>
          <TextInput
            type="number" inputMode="numeric" value={cantidad} autoFocus
            onChange={(e) => setCantidad(e.target.value)}
            placeholder={u.id === 'ud' ? 'Ej. 2' : 'Ej. 60'}
          />
        </Field>
        {errorCantidad && <p className="text-xs" style={{ color: COLORS.warning }}>{errorCantidad}</p>}

        {previsualizacion && (
          <div className="rounded-2xl p-3" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
            <p className="text-lg font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
              {previsualizacion.calorias} kcal
            </p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              {previsualizacion.proteinas} g proteína · {previsualizacion.carbohidratos} g carbohidratos · {previsualizacion.grasas} g grasas
            </p>
          </div>
        )}

        <p className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>{AVISO_REFERENCIA}</p>

        <PrimaryButton accent={accent} icon={Plus} onClick={confirmar} disabled={!previsualizacion}>
          Añadir alimento
        </PrimaryButton>
      </div>
    );
  }

  /* E3 F37 (NU F5), apartados 4, 5 y 6 — crear o editar un alimento propio. */
  if (creando || editando) {
    return (
      <FormularioAlimento
        accent={accent} inicial={editando}
        onGuardar={(a) => { onGuardarAlimentoPropio(a); setCreando(false); setEditando(null); }}
        onCancelar={() => { setCreando(false); setEditando(null); }}
      />
    );
  }

  /* Paso 1 — el selector (apartados 3 y 12). */
  return (
    <div className="space-y-2.5">
      <TextInput
        value={texto} autoFocus placeholder="Busca: pollo, arroz, avena, plátano…"
        onChange={(e) => { setTexto(e.target.value); setResultadosOFF([]); setAvisoOFF(''); }}
      />

      {texto.trim().length > 0 && texto.trim().length < MINIMO_BUSQUEDA && (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>Escribe al menos {MINIMO_BUSQUEDA} letras.</p>
      )}

      {/* 🚨 Apartado 12 — **sin escribir nada** se ven sus favoritos y sus
          recientes, que es lo que le ahorra la búsqueda. Con texto escrito, los
          resultados; nunca las dos cosas a la vez, que sería una pantalla larga. */}
      {texto.trim().length < MINIMO_BUSQUEDA && (
        <>
          {inicio.favoritos.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>
                ★ {seccionSelector('favoritos').nombre}
              </p>
              {inicio.favoritos.map((a) => (
                <FilaAlimento
                  key={a.id} alimento={a} accent={accent} favorito
                  onElegir={elegir} onFavorito={onAlternarFavoritoAlimento}
                />
              ))}
            </div>
          )}

          {/* Apartado 8 — *"Hoy: Avena, Leche · Ayer: Pollo, Arroz"*. ⚠️ No se
              guardan: salen de las comidas, que ya llevan su `alimentoId`. */}
          {recientesDias.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>
                🕒 {seccionSelector('recientes').nombre}
              </p>
              {recientesDias.slice(0, 3).map((d) => (
                <div key={d.fecha} className="space-y-1.5">
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>{d.etiqueta}</p>
                  {d.alimentos.map((a) => (
                    <FilaAlimento
                      key={a.id} alimento={a} accent={accent}
                      favorito={esFavorito(favoritosAlim, a.id)}
                      onElegir={elegir} onFavorito={onAlternarFavoritoAlimento}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Apartado 6 — los suyos, con editar y eliminar. Los de la base NO
              se pueden tocar: son valores de referencia (apartado 6). */}
          {inicio.propios.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>Mis alimentos</p>
              {inicio.propios.map((a) => (
                <FilaAlimento
                  key={a.id} alimento={a} accent={accent}
                  favorito={esFavorito(favoritosAlim, a.id)}
                  onElegir={elegir} onFavorito={onAlternarFavoritoAlimento}
                  onEditar={setEditando} onEliminar={onEliminarAlimentoPropio}
                />
              ))}
            </div>
          )}

          {inicio.favoritos.length === 0 && recientesDias.length === 0 && (
            <p className="text-xs" style={{ color: COLORS.textMuted }}>{seccionSelector('recientes').vacio}</p>
          )}
        </>
      )}

      {resultados.length > 0 && (
        <div className="space-y-1.5">
          {resultados.slice(0, 8).map((a) => (
            <FilaAlimento
              key={a.id} alimento={a} accent={accent}
              favorito={esFavorito(favoritosAlim, a.id)}
              onElegir={elegir} onFavorito={onAlternarFavoritoAlimento}
              onEditar={a.propio ? setEditando : null}
            />
          ))}
        </div>
      )}

      {resultadosOFF.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>Productos con marca</p>
          {resultadosOFF.map((a) => (
            <button
              key={a.id} onClick={() => elegir(a)}
              className="w-full text-left rounded-xl px-3 py-2.5 toque-44 transition-transform active:scale-[0.98]"
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
            >
              <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{a.nombre}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                {a.marca ? `${a.marca} · ` : ''}{a.por100.calorias} kcal / 100 g — valores de la etiqueta
              </p>
            </button>
          ))}
        </div>
      )}

      {avisoOFF && <p className="text-xs" style={{ color: COLORS.textMuted }}>{avisoOFF}</p>}

      {texto.trim().length >= 3 && (
        <GhostBtn onClick={buscarEnOFF} icon={buscandoOFF ? Loader2 : Search} disabled={buscandoOFF}>
          {buscandoOFF ? 'Buscando…' : 'Buscar productos con marca'}
        </GhostBtn>
      )}

      {texto.trim().length >= MINIMO_BUSQUEDA && resultados.length === 0 && resultadosOFF.length === 0 && !buscandoOFF && (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          Nada en la lista básica. Prueba con los productos con marca, o escríbelo a mano.
        </p>
      )}

      {/* Apartado 12 — el botón de crear, siempre a la vista. */}
      <GhostBtn onClick={() => setCreando(true)} icon={Plus}>{ACCION_CREAR}</GhostBtn>

      <button onClick={() => setAMano(true)} className="toque-44 text-xs font-semibold" style={{ color: accent }}>
        Escribirlo a mano, escanear un código o hacer una foto
      </button>
    </div>
  );
}


/* ── Un alimento ya registrado — apartados 7 y 8 ──────────────────────────
   *"Cada alimento registrado debe poder editarse, cambiar cantidad, cambiar de
   comida y eliminarse. **No obligar al usuario a eliminar y volver a crear.**"*

   🚨 Cambiar la cantidad **recalcula**, y solo se ofrece si hay `por100` de
   dónde calcular: una comida escrita a mano antes de esta fase no lo tiene, así
   que se dice en vez de enseñar un control que no haría nada (regla 8). */
function AlimentoRegistrado({ comida, accent, onActualizar, onEliminar, onRepetir }) {
  const [abierto, setAbierto] = useState(false);
  const [cant, setCant] = useState(comida.cantidad != null ? String(comida.cantidad) : '');
  const [error, setError] = useState(null);
  const cantidadTexto = textoCantidad(comida);
  const puedeEscalar = !!comida.por100;

  const guardarCantidad = () => {
    const r = cambiarCantidad(comida, cant);
    setError(r.error);
    if (r.ok) { onActualizar(r.comida); setAbierto(false); }
  };

  return (
    <div className="rounded-xl" style={{ background: abierto ? COLORS.surface2 : 'transparent' }}>
      <div className="flex items-center justify-between gap-2 p-1.5">
        <button
          onClick={() => setAbierto(!abierto)}
          className="min-w-0 flex-1 text-left toque-44"
          aria-expanded={abierto}
          aria-label={`Editar ${comida.nombre}`}
        >
          <p className="text-sm truncate" style={{ color: COLORS.text }}>
            {comida.nombre}{cantidadTexto ? ` · ${cantidadTexto}` : ''}
          </p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            {round1(comida.proteinas)}g prot. · {round1(comida.carbohidratos)}g carb. · {round1(comida.grasas)}g grasa
          </p>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <p className="text-sm font-bold" style={{ color: COLORS.text }}>{comida.calorias} kcal</p>
          <BotonBorrar onClick={() => onEliminar(comida.id)} label={`Eliminar ${comida.nombre}`} />
        </div>
      </div>

      {abierto && (
        <div className="px-2.5 pb-2.5 space-y-2.5">
          {puedeEscalar ? (
            <>
              <Field label={`Cantidad (${unidad(comida.unidad || 'g').corto})`}>
                <TextInput type="number" inputMode="numeric" value={cant} onChange={(e) => setCant(e.target.value)} />
              </Field>
              {error && <p className="text-xs" style={{ color: COLORS.warning }}>{error}</p>}
              <button
                onClick={guardarCantidad}
                className="toque-44 rounded-xl px-3 py-2 text-xs font-semibold"
                style={{ background: hexToRgba(accent, 0.14), color: accent, border: `1px solid ${hexToRgba(accent, 0.3)}` }}
              >
                Guardar cantidad
              </button>
            </>
          ) : (
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              Esto se escribió a mano, así que no hay valores por 100 g de los que calcular. Para cambiar los números, bórralo y vuelve a añadirlo desde el buscador.
            </p>
          )}

          {/* 🚨 E3 F37 (NU F5), apartado 9 — *"desde una comida registrada
              anteriormente, volver a añadir el mismo alimento rápidamente"*, con
              su cantidad ya puesta. ⚠️ Funciona **también con las escritas a
              mano**, que son justo las que más cuesta volver a escribir. */}
          {onRepetir && (
            <button
              onClick={() => { onRepetir(comida); setAbierto(false); }}
              className="toque-44 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5"
              style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            >
              <Repeat size={13} /> Repetir hoy{cantidadTexto ? ` · ${cantidadTexto}` : ''}
            </button>
          )}

          {/* Apartado 7 — *"cambiar de comida"*, sin tocar ni un número. */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: COLORS.textMuted }}>Moverlo a:</p>
            <div className="flex flex-wrap gap-1.5">
              {MOMENTOS.filter((m) => m.id !== (comida.momento || 'extras')).map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onActualizar(cambiarMomento(comida, m.id)); setAbierto(false); }}
                  className="toque-44 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                  style={{ background: COLORS.surface, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
                >
                  {m.emoji} {m.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function MomentoDelDia({ mom, comidas, abierto, onAbrir, onCerrar, accent, fecha, onAdd, onAddFavorito, onDeleteComida, onActualizarComida, onRepetirComida, nutricion, onGuardarAlimentoPropio, onEliminarAlimentoPropio, onAlternarFavoritoAlimento, indice }) {
  /* Apartado 9 — el resumen de la comida, **derivado**: guardarlo mentiría en
     cuanto él borre un alimento. Y sin alimentos es `null`, no una línea de
     ceros. */
  const linea = lineaDeMomento(comidas);
  return (
    <div
      className="hub-card rounded-2xl overflow-hidden"
      style={{ animationDelay: `${indice * 60}ms`, background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-2 p-3.5">
        <span className="text-base">{mom.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{mom.nombre}</p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            {linea ? `${linea.kcal} · ${linea.macros}` : VACIO_MOMENTO}
          </p>
        </div>
        <button
          onClick={() => (abierto ? onCerrar() : onAbrir(mom.id))}
          aria-label={`Añadir alimento a ${mom.nombre}`}
          className="toque-44 rounded-xl px-3 py-2 text-xs font-semibold flex-shrink-0 transition-transform active:scale-95"
          style={{ background: abierto ? COLORS.surface2 : hexToRgba(accent, 0.14), color: abierto ? COLORS.textMuted : accent, border: `1px solid ${abierto ? COLORS.border : hexToRgba(accent, 0.3)}` }}
        >
          {abierto ? 'Cerrar' : '+ Añadir'}
        </button>
      </div>

      {comidas.length > 0 && (
        <div className="px-2.5 pb-3 space-y-0.5">
          {comidas.map((c) => (
            <AlimentoRegistrado
              key={c.id} comida={c} accent={accent}
              onActualizar={onActualizarComida} onEliminar={onDeleteComida}
              onRepetir={onRepetirComida}
            />
          ))}
        </div>
      )}

      {/* Apartado 14 — el estado vacío de una comida, con su salida. */}
      {comidas.length === 0 && !abierto && (
        <div className="px-3.5 pb-3.5">
          <p className="text-xs" style={{ color: COLORS.textMuted }}>{VACIO_MOMENTO_F4.titulo}</p>
        </div>
      )}

      {abierto && (
        <div className="px-3.5 pb-3.5">
          <AnadirAlimento
            momentoId={mom.id} fecha={fecha} accent={accent}
            onAdd={onAdd} onAddFavorito={onAddFavorito} onCerrar={onCerrar}
            nutricion={nutricion}
            onGuardarAlimentoPropio={onGuardarAlimentoPropio}
            onEliminarAlimentoPropio={onEliminarAlimentoPropio}
            onAlternarFavoritoAlimento={onAlternarFavoritoAlimento}
          />
        </div>
      )}
    </div>
  );
}


/* ── La configuración de objetivos — Entrega 3 · F35 (NU F3) ───────────────
   🔒 **La app PROPONE y él confirma.** `planObjetivos` sin `confirmado` devuelve
   los números y **no escribe nada**; los cuatro se pueden cambiar a mano en el
   propio resumen, y lo editado manda sobre lo calculado.

   ⚠️ Los datos físicos **salen del perfil** (apartado 2): aquí no se guarda ni
   una copia de la altura ni del peso. Lo que se escriba en estos campos vale
   para el cálculo de ahora; el perfil se sigue editando en Ajustes. */
function ConfiguracionNutricion({ nutricion, perfil, accent, onGuardar, onCerrar }) {
  const guardados = normalizarObjetivosNut(nutricion?.objetivos);
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState(() => ({
    sexo: sexoDesdePerfil(perfil),
    edad: perfil?.fechaNacimiento ? String(calcularEdad(perfil.fechaNacimiento)) : '',
    altura: perfil?.altura != null ? String(perfil.altura) : '',
    peso: perfil?.peso != null ? String(perfil.peso) : '',
    actividad: guardados.actividad || perfil?.actividad || null,
    objetivo: guardados.objetivo || null,
  }));
  const [borrador, setBorrador] = useState(null);
  const [errorEdicion, setErrorEdicion] = useState(null);

  const plan = planObjetivos({ datos, actual: guardados, hoy: todayISO() });
  const propuesta = borrador || (plan.ok ? plan.resultado : null);
  const coh = propuesta ? coherencia(propuesta) : null;
  const actual = PASOS_CONFIG[paso];

  const cambiarNumero = (campo, valor) => {
    const base = propuesta;
    if (!base) return;
    const r = editarObjetivo(base, campo, valor);
    setErrorEdicion(r.error);
    if (!r.error) setBorrador(r.objetivos);
  };

  const confirmar = () => {
    /* 🚨 El plan solo escribe con `confirmado`. Si él tocó un número, se parte de
       su versión, que lleva su marca de `manual`. */
    const definitivo = planObjetivos({ datos, actual: borrador || guardados, hoy: todayISO(), confirmado: true });
    if (definitivo.ok) { onGuardar(definitivo.objetivos); onCerrar(); }
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>
            Paso {paso + 1} de {PASOS_CONFIG.length}
          </p>
          <p className="text-base font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>{actual.nombre}</p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>{actual.que}</p>
        </div>
        <button onClick={onCerrar} className="toque-44 text-xs font-semibold" style={{ color: COLORS.textMuted }}>Cerrar</button>
      </div>

      {/* Paso 1 — los datos, que vienen del perfil (apartado 2). */}
      {actual.id === 'datos' && (
        <div className="space-y-3">
          {/* 🐛 Aquí había un `<Opcion>`, que **vive en `SleepView.jsx`, no aquí**:
              React habría lanzado al pintar este paso y la pantalla se habría
              quedado en blanco — el fallo de la E3 F17 y la EH F39. Lo cazó la
              regla invariante de `test-imports.mjs`, no el build. Se usa el mismo
              botón que los otros dos pasos, que además los deja iguales. */}
          <div className="flex gap-2">
            {SEXO_BMR.map((x) => (
              <button
                key={x.id}
                onClick={() => setDatos({ ...datos, sexo: x.id })}
                aria-pressed={datos.sexo === x.id}
                className="flex-1 rounded-2xl px-3 py-2.5 text-sm toque-44 transition-transform active:scale-95"
                style={{
                  background: datos.sexo === x.id ? hexToRgba(accent, 0.16) : COLORS.surface2,
                  color: datos.sexo === x.id ? accent : COLORS.textMuted,
                  border: `1px solid ${datos.sexo === x.id ? hexToRgba(accent, 0.45) : COLORS.border}`,
                  fontWeight: datos.sexo === x.id ? 700 : 500,
                }}
              >
                {x.nombre}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DATOS_DEL_PERFIL.filter((d) => d.id !== 'sexo').map((d) => (
              <label key={d.id} className="block">
                <span className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>{d.nombre}{d.unidad ? ` (${d.unidad})` : ''}</span>
                <TextInput
                  type="number" inputMode="numeric" value={datos[d.id]}
                  onChange={(e) => setDatos({ ...datos, [d.id]: e.target.value })}
                />
                {validar(d.id, datos[d.id]) && (
                  <span className="text-xs block mt-1" style={{ color: COLORS.warning }}>{validar(d.id, datos[d.id])}</span>
                )}
              </label>
            ))}
          </div>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            Salen de tu perfil. Si cambian de verdad, cámbialos en Ajustes → Perfil: aquí solo se usan para este cálculo.
          </p>
        </div>
      )}

      {/* Paso 2 — la actividad, con su explicación (apartado 3). */}
      {actual.id === 'actividad' && (
        <div className="space-y-2">
          {NIVELES_ACTIVIDAD.map((n) => (
            <button
              key={n.id}
              onClick={() => setDatos({ ...datos, actividad: n.id })}
              aria-pressed={datos.actividad === n.id}
              className="w-full text-left rounded-2xl px-3.5 py-3 toque-44 transition-transform active:scale-95"
              style={{
                background: datos.actividad === n.id ? hexToRgba(accent, 0.14) : COLORS.surface2,
                border: `1px solid ${datos.actividad === n.id ? hexToRgba(accent, 0.4) : COLORS.border}`,
              }}
            >
              <p className="text-sm font-bold" style={{ color: datos.actividad === n.id ? accent : COLORS.text }}>{n.nombre}</p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{n.explica}</p>
            </button>
          ))}
        </div>
      )}

      {/* Paso 3 — el objetivo (apartado 4). ⚠️ Ninguno viene elegido. */}
      {actual.id === 'objetivo' && (
        <div className="space-y-2">
          {OBJETIVOS_NUTRICION.map((o) => (
            <button
              key={o.id}
              onClick={() => { setDatos({ ...datos, objetivo: o.id }); setBorrador(null); }}
              aria-pressed={datos.objetivo === o.id}
              className="w-full text-left rounded-2xl px-3.5 py-3 toque-44 transition-transform active:scale-95"
              style={{
                background: datos.objetivo === o.id ? hexToRgba(accent, 0.14) : COLORS.surface2,
                border: `1px solid ${datos.objetivo === o.id ? hexToRgba(accent, 0.4) : COLORS.border}`,
              }}
            >
              <p className="text-sm font-bold" style={{ color: datos.objetivo === o.id ? accent : COLORS.text }}>{o.nombre}</p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{o.explica}</p>
            </button>
          ))}
        </div>
      )}

      {/* Paso 4 — el resumen antes de guardar (apartado 8), con todo editable. */}
      {actual.id === 'resumen' && (
        <div className="space-y-3">
          {!plan.ok && (
            <div className="space-y-1">
              {Object.values(plan.errores).map((e, i) => (
                <p key={i} className="text-xs" style={{ color: COLORS.warning }}>{e}</p>
              ))}
            </div>
          )}
          {propuesta && (
            <>
              <p className="text-xs font-bold uppercase" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>Tu objetivo diario</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { campo: 'kcal', nombre: '🔥 Calorías', unidad: 'kcal' },
                  { campo: 'proteinas', nombre: '💪 Proteína', unidad: 'g' },
                  { campo: 'carbohidratos', nombre: '🍚 Carbohidratos', unidad: 'g' },
                  { campo: 'grasas', nombre: '🥑 Grasas', unidad: 'g' },
                ].map((f) => (
                  <label key={f.campo} className="block rounded-2xl p-2.5" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
                    <span className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>{f.nombre} ({f.unidad})</span>
                    <TextInput
                      type="number" inputMode="numeric" value={propuesta[f.campo] ?? ''}
                      onChange={(e) => cambiarNumero(f.campo, e.target.value)}
                    />
                  </label>
                ))}
              </div>
              {errorEdicion && <p className="text-xs" style={{ color: COLORS.warning }}>{errorEdicion}</p>}
              {/* 🚨 Apartado 7 — si los macros dejan de cuadrar con las kcal, se DICE. */}
              {coh && !coh.cuadra && <p className="text-xs" style={{ color: COLORS.warning }}>{coh.texto}</p>}
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                Objetivo: {OBJETIVOS_NUTRICION.find((o) => o.id === datos.objetivo)?.nombre} · Actividad: {NIVELES_ACTIVIDAD.find((n) => n.id === datos.actividad)?.nombre}
              </p>
              {/* 🔒 La frase que hace que esto sea orientativo y no una dieta. */}
              <p className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>{AVISO_ORIENTATIVO}</p>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {paso > 0 && (
          <button onClick={() => setPaso((p) => p - 1)} className="toque-44 px-4 rounded-xl text-sm font-semibold" style={{ color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>
            Atrás
          </button>
        )}
        <div className="flex-1">
          {actual.id === 'resumen'
            ? <PrimaryButton accent={accent} icon={Check} onClick={confirmar} disabled={!plan.ok}>Guardar objetivos</PrimaryButton>
            : <PrimaryButton accent={accent} onClick={() => setPaso((p) => p + 1)}>Continuar</PrimaryButton>}
        </div>
      </div>
    </Card>
  );
}

function ComidasTab({ comidas, nutricion, perfil, onAdd, onAddFavorito, onDeleteComida, onActualizarComida, onGuardarObjetivos, onGuardarAlimentoPropio, onEliminarAlimentoPropio, onAlternarFavoritoAlimento, accent }) {
  const hoy = todayISO();
  /* 🚨 Apartado 2 — *"Abrir automáticamente en HOY"*, siempre: el día que se
     estaba mirando no se guarda, es de la pantalla (EH F40). */
  const [fecha, setFecha] = useState(hoy);
  const [momentoAbierto, setMomentoAbierto] = useState(null);
  const [calendario, setCalendario] = useState(false);
  const [configurando, setConfigurando] = useState(false);

  /* 🚨 Los números salen de las comidas de verdad, del día que se está mirando.
     ➕ E3 F35 (NU F3) — y desde aquí, **con sus objetivos si los ha configurado**.
     `objetivosParaResumen` devuelve `null` mientras no lo haya hecho, así que la
     pantalla sigue enseñando lo consumido a secas, como en la NU F1. */
  const objetivos = objetivosParaResumen(nutricion);
  const resumen = resumenDelDia(comidas, fecha, objetivos);
  const avisoPeso = avisoDePeso(nutricion, perfil);
  const principal = resumen.find((r) => r.principal);
  const macros = resumen.filter((r) => !r.principal);
  const grupos = porMomento(comidas, fecha);
  const hayComidas = hayAlgoRegistrado(comidas, fecha);

  const estado = estadoDeDia(comidas, fecha, hoy);
  const cambiarDia = (f) => { setFecha(f); setMomentoAbierto(null); };

  return (
    <div className="space-y-4">
      <SelectorDia
        comidas={comidas} fecha={fecha} hoy={hoy} accent={accent} onCambiar={cambiarDia}
        calendarioAbierto={calendario} onAlternarCalendario={() => setCalendario((v) => !v)}
      />

      {calendario && (
        <CalendarioNutricion
          comidas={comidas} fecha={fecha} hoy={hoy} accent={accent}
          onElegir={(f) => { cambiarDia(f); setCalendario(false); }}
        />
      )}

      {/* Apartado 1 — el acceso a la configuración, y el CTA si todavía no la ha
          hecho. ⚠️ Sin objetivos la pantalla NO se rompe: enseña lo consumido. */}
      {configurando ? (
        <ConfiguracionNutricion
          nutricion={nutricion} perfil={perfil} accent={accent}
          onGuardar={onGuardarObjetivos} onCerrar={() => setConfigurando(false)}
        />
      ) : (
        !objetivos && (
          <Card>
            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{CTA_SIN_CONFIGURAR.titulo}</p>
            <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>{CTA_SIN_CONFIGURAR.detalle}</p>
            <div style={{ width: 200 }}>
              <PrimaryButton accent={accent} icon={Settings} onClick={() => setConfigurando(true)}>{CTA_SIN_CONFIGURAR.accion}</PrimaryButton>
            </div>
          </Card>
        )
      )}

      {/* Apartado 12 — si su peso ha cambiado, se le DICE; no se recalcula solo. */}
      {avisoPeso && !configurando && (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>{avisoPeso}</p>
      )}

      {/* Apartado 4 — las kcal con jerarquía superior y los tres macros debajo
          (apartado 9: móvil primero, sin desplazamiento horizontal).

          🐛 **GE F1 — esto era `grid-cols-2` con TRES macros**, así que Grasas
          caía sola a una segunda fila y dejaba un hueco a su derecha. Lo reportó
          Josué: *"no quiero que una de ellas pase a una segunda fila dejando un
          hueco vacío"*. Son tres y ahora van en **tres columnas**, que es lo que
          hace que la fila cuadre.

          ⚠️ **El número de columnas sale de `macros.length`, no está escrito a
          mano**: el día que `INDICADORES` gane un cuarto macro —fibra, por
          ejemplo— volvería a descuadrar solo. Con esto, cuatro caen en 2×2 y
          tres en una fila, sin tocar esta línea.

          ⚠️ Y se mantiene `gap-2` en vez de `gap-2.5` porque con tres columnas
          el ancho de cada tarjeta baja: en un iPhone pequeño, el separador de
          antes dejaba las cifras demasiado justas.

          ⚠️ `key={fecha}` repite la cascada de entrada al cambiar de día
          (apartado 11 de la F2): transición suave, sin recargar nada. */}
      <div className="space-y-2.5" key={fecha}>
        <Indicador dato={principal} accent={accent} principal indice={0} />
        <div className={`grid gap-2 ${macros.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {macros.map((m, i) => <Indicador key={m.id} dato={m} accent={accent} indice={i + 1} />)}
        </div>
      </div>

      {/* Apartado 11 — se puede volver a la configuración cuando quiera. */}
      {objetivos && !configurando && (
        <button
          onClick={() => setConfigurando(true)}
          className="toque-44 text-xs font-semibold flex items-center gap-1.5"
          style={{ color: accent }}
        >
          <Settings size={13} /> Configurar nutrición
        </button>
      )}

      {/* Apartado 7 de la F1 — el estado vacío, que no es un mensaje de error.
          ⚠️ Y desde la F2 (apartados 6 y 7) **un día futuro se distingue de uno
          vacío**: no es que no registrara nada, es que no ha llegado. */}
      {!hayComidas && (
        <Card>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
            {estado.id === 'futuro' ? estado.nombre : VACIO_DIA.titulo}
          </p>
          <p className="text-xs mt-1 mb-3" style={{ color: COLORS.textMuted }}>
            {estado.id === 'futuro' ? estado.texto : VACIO_DIA.detalle}
          </p>
          {estado.id !== 'futuro' && (
            <div style={{ width: 170 }}>
              <PrimaryButton accent={accent} icon={Plus} onClick={() => setMomentoAbierto(MOMENTOS[0].id)}>{VACIO_DIA.accion}</PrimaryButton>
            </div>
          )}
        </Card>
      )}

      {/* Apartado 6 — la zona de comidas, con los cinco momentos. */}
      <div className="space-y-2.5">
        {MOMENTOS.map((m, i) => (
          <MomentoDelDia
            key={m.id}
            mom={m}
            comidas={grupos[m.id]}
            abierto={momentoAbierto === m.id}
            onAbrir={setMomentoAbierto}
            onCerrar={() => setMomentoAbierto(null)}
            accent={accent}
            fecha={fecha}
            onAdd={onAdd}
            onAddFavorito={onAddFavorito}
            onDeleteComida={onDeleteComida}
            onActualizarComida={onActualizarComida}
            /* E3 F37 (NU F5), apartado 9 — repetir una comida la añade AL DÍA QUE
               SE ESTÁ MIRANDO, con su cantidad: es la misma decisión que el ＋ de
               la E3 F9, donde el contexto viaja con la acción. */
            onRepetirComida={(c) => onAdd(reutilizarComida(c, { fecha, momentoId: c.momento }))}
            nutricion={nutricion}
            onGuardarAlimentoPropio={onGuardarAlimentoPropio}
            onEliminarAlimentoPropio={onEliminarAlimentoPropio}
            onAlternarFavoritoAlimento={onAlternarFavoritoAlimento}
            indice={i}
          />
        ))}
      </div>
    </div>
  );
}

function AguaTab({ agua, onSetAgua, accent }) {
  const hoy = todayISO();
  const mlHoy = agua[hoy] || 0;
  const vasos = Math.round(mlHoy / VASO_ML);

  return (
    <div className="space-y-4">
      <Card className="flex flex-col items-center py-8">
        <Droplet size={32} style={{ color: accent }} />
        <p className="text-3xl font-extrabold mt-3" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {(mlHoy / 1000).toFixed(2)} L
        </p>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{vasos} vasos de {VASO_ML} ml hoy</p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => onSetAgua(hoy, Math.max(0, mlHoy - VASO_ML))}
            className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
          >
            −
          </button>
          <button
            onClick={() => onSetAgua(hoy, mlHoy + VASO_ML)}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: accent, color: COLORS.textOnAccent }}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </Card>
    </div>
  );
}

function FavoritosTab({ favoritos, onRegistrar, onEliminar, accent }) {
  return (
    <div className="space-y-2">
      {favoritos.length === 0 && <EmptyHint text="Guarda una comida como favorita desde 'Comidas' para verla aquí." />}
      {[...favoritos].reverse().map((f) => (
        <Card key={f.id} style={{ padding: '1rem' }} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{f.nombre}</p>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{f.calorias} kcal · {round1(f.proteinas)}g prot.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onRegistrar(f)} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: accent, color: COLORS.textOnAccent }}>
              Registrar hoy
            </button>
            <button onClick={() => onEliminar(f.id)} aria-label="Eliminar favorito">
              <Trash2 size={15} style={{ color: COLORS.textMuted }} />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ── Análisis nutricional — Entrega 3 · F39 (NU F7) ───────────────────────
   🔒 **Toda frase de aquí mira su objetivo** (apartado 10) y **habla de sus
   REGISTROS**, nunca de lo que comió (apartados 6 y 7, marcados como *"MUY
   IMPORTANTE"*): *"la merienda no suele aparecer en tus registros"*, jamás
   *"nunca meriendas"*.

   ⚠️ *"Evitar textos largos"* y *"no convertirlo en un chatbot gigante"*
   (apartados 1 y 16): un resumen de dos frases, lo detectado en líneas sueltas,
   y una recomendación con su número. */
function AnalisisNutricional({ nutricion, periodoId, accent }) {
  const a = useMemo(() => analizarNutricion(nutricion, periodoId), [nutricion, periodoId]);
  const paraHoy = useMemo(() => resumenParaHoy(nutricion), [nutricion]);

  return (
    <Card>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {TITULO_PANEL}
        </p>
        {/* Apartado 11 — el resumen pequeño y reutilizable. Vive aquí y el día
            que Hoy lo quiera, llama a la misma función. */}
        {paraHoy && (
          <span className="text-xs font-semibold flex-shrink-0" style={{ color: accent }}>
            {paraHoy.emoji} {paraHoy.texto}
          </span>
        )}
      </div>

      {/* 🚨 Apartado 8 — con pocos datos NO se dice nada específico. */}
      {a.sinDatos ? (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>{a.sinDatos}</p>
      ) : (
        <>
          <p className="text-sm" style={{ color: COLORS.text }}>{a.resumen}</p>

          {a.patrones.length > 0 && (
            <div className="mt-2.5 space-y-1">
              {a.patrones.map((p, i) => (
                <p key={`${p.id}-${i}`} className="text-xs" style={{ color: COLORS.textMuted }}>· {p.texto}</p>
              ))}
            </div>
          )}

          {/* Apartado 3 — la proteína, con su estado y su acción. */}
          {a.proteina.hay && (
            <div className="mt-2.5 rounded-2xl p-2.5" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <p className="text-xs font-bold" style={{ color: COLORS.text }}>💪 {a.proteina.titulo}</p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{a.proteina.texto}</p>
            </div>
          )}

          {/* 🔒 Apartado 10 — qué significa esa desviación PARA SU objetivo. */}
          {a.calorias.hay && a.calorias.segunObjetivo && (
            <div className="mt-2 rounded-2xl p-2.5" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <p className="text-xs font-bold" style={{ color: COLORS.text }}>🔥 {a.calorias.texto}</p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{a.calorias.segunObjetivo}</p>
            </div>
          )}

          {/* Apartado 5 — la regularidad, con su matiz. */}
          {a.regularidad.hay && !a.regularidad.estable && (
            <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
              {a.regularidad.texto} {a.regularidad.matiz}
            </p>
          )}

          {/* Apartado 9 — la recomendación, simple y con su cifra. */}
          {a.recomendaciones.map((r, i) => (
            <p key={i} className="text-xs mt-2 leading-relaxed" style={{ color: accent }}>{r}</p>
          ))}
        </>
      )}

      {/* 🚨 Apartados 6 y 7 — la frase que sostiene todo el panel. */}
      <p className="text-xs mt-3 leading-relaxed" style={{ color: COLORS.textMuted }}>{a.aviso}</p>
    </Card>
  );
}


/* ── Estadísticas de Nutrición — Entrega 3 · F38 (NU F6) ──────────────────
   *"¿Estoy cumpliendo mis objetivos nutricionales y cómo estoy evolucionando?"*

   🚨 **Ni una cifra guardada** (apartado 16): todo se cuenta en el momento sobre
   las comidas que ya existen. Y **ni un dato inventado** (apartado 13): un día
   sin registrar es un hueco, no un cero.

   ⚠️ El apartado 17 pide no recalcular en cada pintado, así que los siete
   cálculos salen de **un solo `useMemo`** por periodo. */
function EstadisticasNutricion({ nutricion, accent }) {
  const [periodoId, setPeriodoId] = useState(PERIODO_NUT_POR_DEFECTO);
  const [macro, setMacro] = useState(MACROS_EVOLUCION[0]);

  const datos = useMemo(() => ({
    hay: hayEstadisticas(nutricion?.comidas, periodoId),
    prom: promediosDelPeriodo(nutricion?.comidas, periodoId),
    cump: cumplimientoDelPeriodo(nutricion, periodoId),
    kcalEvo: evolucion(nutricion, 'calorias', periodoId),
    macroEvo: evolucion(nutricion, macro, periodoId),
    cons: constancia(nutricion?.comidas, periodoId),
    mp: mejorYPeorDia(nutricion, periodoId),
    prot: analisisProteina(nutricion, periodoId),
    kcal: analisisCalorias(nutricion, periodoId),
  }), [nutricion, periodoId, macro]);

  const selectorPeriodo = (
    <div className="flex gap-1.5">
      {PERIODOS_NUT.map((p) => (
        <button
          key={p.id} onClick={() => setPeriodoId(p.id)} aria-pressed={periodoId === p.id}
          className="flex-1 toque-44 rounded-xl px-2 py-2 text-xs font-semibold transition-transform active:scale-95"
          style={{
            background: periodoId === p.id ? hexToRgba(accent, 0.16) : COLORS.surface2,
            color: periodoId === p.id ? accent : COLORS.textMuted,
            border: `1px solid ${periodoId === p.id ? hexToRgba(accent, 0.4) : COLORS.border}`,
          }}
        >
          {p.dias} días
        </button>
      ))}
    </div>
  );

  /* 🚨 Apartado 12 — *"no mostrar gráficas vacías"*: con menos de dos días
     registrados, la pantalla entera es el estado vacío. */
  if (!datos.hay) {
    return (
      <div className="space-y-3">
        {selectorPeriodo}
        <Card>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{VACIO_ESTADISTICAS.titulo}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{VACIO_ESTADISTICAS.detalle}</p>
        </Card>
      </div>
    );
  }

  const grafica = (evo, color) => (
    <div style={{ height: 170 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={evo.puntos}>
          <CartesianGrid stroke={COLORS.border} vertical={false} />
          <XAxis dataKey="etiqueta" stroke={COLORS.textMuted} fontSize={11} interval="preserveStartEnd" />
          <YAxis stroke={COLORS.textMuted} fontSize={11} width={38} />
          <Tooltip
            contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: COLORS.textMuted }}
            formatter={(v) => [`${v} ${evo.indicador.unidad}`, evo.indicador.nombre]}
          />
          {/* El objetivo como línea de referencia (apartado 4): se ve de un
              vistazo si el día quedó por encima o por debajo. */}
          {evo.objetivo !== null && (
            <ReferenceLine y={evo.objetivo} stroke={COLORS.textMuted} strokeDasharray="4 4" />
          )}
          {/* 🚨 `connectNulls` en falso: un día sin registrar es un HUECO, y la
              línea no lo cruza — cruzarlo inventaría un dato (E3 F32). */}
          <Line type="monotone" dataKey="valor" stroke={color} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="space-y-3">
      {selectorPeriodo}

      {/* Entrega 3 · F39 (NU F7) — el análisis, arriba del todo: es lo que
          contesta la pregunta, y los números de abajo lo sostienen. */}
      <AnalisisNutricional nutricion={nutricion} periodoId={periodoId} accent={accent} />

      {/* Apartado 2 — el promedio diario, con sus cuatro indicadores. */}
      <Card>
        <p className="text-xs font-bold uppercase mb-2" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>
          Promedio diario
        </p>
        <div className="grid grid-cols-2 gap-2">
          {datos.cump.lineas.map((l) => (
            <div key={l.id} className="rounded-2xl p-2.5" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <p className="text-xs flex items-center gap-1.5" style={{ color: COLORS.textMuted }}>
                <span>{l.emoji}</span>{l.nombre}
              </p>
              <p className="text-lg font-extrabold mt-0.5 leading-none" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
                {l.promedio === null ? '—' : l.promedio}
                <span className="text-xs font-bold ml-1" style={{ color: COLORS.textMuted }}>{l.unidad}</span>
              </p>
              {/* Apartado 3 — el cumplimiento, con el mismo lenguaje visual que
                  la pantalla principal. ⚠️ Solo si de verdad hay objetivo. */}
              {l.objetivo !== null && (
                <>
                  <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: COLORS.border }}>
                    <div className="h-full rounded-full" style={{ width: `${l.porcentajePintado}%`, background: accent }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{l.porcentaje} % de {l.objetivo} {l.unidad}</p>
                </>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs mt-2.5" style={{ color: COLORS.textMuted }}>
          Media de los {datos.prom.diasConDatos} {datos.prom.diasConDatos === 1 ? 'día' : 'días'} que registraste, de {datos.prom.diasDelRango}.
        </p>
        {!datos.cump.hayObjetivos && (
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            Configura tus objetivos en Comidas para ver también el cumplimiento.
          </p>
        )}
      </Card>

      {/* Apartado 8 — la constancia. 🚨 Es un RECUENTO, no una racha. */}
      <Card>
        <p className="text-sm font-bold" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {datos.cons.texto}
        </p>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{NO_ES_RACHA}</p>
      </Card>

      {/* Apartado 4 — la evolución de las kcal. */}
      <Card>
        <p className="text-xs font-bold uppercase mb-1" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>
          Calorías por día
        </p>
        {grafica(datos.kcalEvo, accent)}
        {datos.kcalEvo.huecos > 0 && (
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            {datos.kcalEvo.huecos} {datos.kcalEvo.huecos === 1 ? 'día sin registrar' : 'días sin registrar'}: la línea se corta ahí.
          </p>
        )}
      </Card>

      {/* Apartado 5 — los macros, con su selector: tres gráficas a la vez no se
          leen en un móvil, y el enunciado lo dice. */}
      <Card>
        <div className="flex gap-1.5 mb-2">
          {MACROS_EVOLUCION.map((id) => {
            const ind = datos.cump.lineas.find((l) => l.id === id);
            return (
              <button
                key={id} onClick={() => setMacro(id)} aria-pressed={macro === id}
                className="flex-1 toque-44 rounded-xl px-2 py-1.5 text-xs font-semibold"
                style={{
                  background: macro === id ? hexToRgba(accent, 0.16) : COLORS.surface2,
                  color: macro === id ? accent : COLORS.textMuted,
                  border: `1px solid ${macro === id ? hexToRgba(accent, 0.4) : COLORS.border}`,
                }}
              >
                {ind?.emoji} {ind?.nombre}
              </button>
            );
          })}
        </div>
        {grafica(datos.macroEvo, COLORS.info)}
      </Card>

      {/* Apartado 10 — la proteína, que «merece especial atención». */}
      <Card>
        <p className="text-xs font-bold uppercase" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>💪 Proteína</p>
        <p className="text-xl font-extrabold mt-1 leading-none" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {datos.prot.texto || '—'}
        </p>
        {datos.prot.porcentaje !== null && (
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            {datos.prot.porcentaje} % del objetivo · alcanzado {datos.prot.diasAlcanzados} de {datos.prot.diasConDatos} {datos.prot.diasConDatos === 1 ? 'día' : 'días'}
          </p>
        )}
      </Card>

      {/* Apartado 11 — las calorías. 🚨 La diferencia NO se interpreta. */}
      <Card>
        <p className="text-xs font-bold uppercase" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>🔥 Calorías</p>
        <p className="text-xl font-extrabold mt-1 leading-none" style={{ color: COLORS.text, fontFamily: "'Manrope', sans-serif" }}>
          {datos.kcal.promedio} <span className="text-xs font-bold" style={{ color: COLORS.textMuted }}>kcal de media</span>
        </p>
        {datos.kcal.objetivo !== null && (
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            Objetivo: {datos.kcal.objetivo} kcal · diferencia media: {datos.kcal.diferencia > 0 ? '+' : ''}{datos.kcal.diferencia} kcal
          </p>
        )}
        {datos.kcal.tendencia && (
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            {datos.kcal.tendencia.flecha} {datos.kcal.tendencia.diferencia > 0 ? '+' : ''}{datos.kcal.tendencia.diferencia} kcal respecto al periodo anterior
          </p>
        )}
      </Card>

      {/* Apartado 9 — mejor y peor día, o la frase honesta. */}
      <Card>
        <p className="text-xs font-bold uppercase mb-2" style={{ color: COLORS.textMuted, letterSpacing: '0.06em' }}>Por días</p>
        {datos.mp.hay ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl p-2.5" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Mayor cumplimiento</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: COLORS.text }}>{datos.mp.mejor.nombre}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>{datos.mp.mejor.cumplimiento} %</p>
            </div>
            <div className="rounded-2xl p-2.5" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Menor cumplimiento</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: COLORS.text }}>{datos.mp.peor.nombre}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>{datos.mp.peor.cumplimiento} %</p>
            </div>
          </div>
        ) : (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            {datos.mp.motivo === 'sin_objetivos'
              ? 'Para comparar días hacen falta tus objetivos. Los configuras en Comidas.'
              : TEXTO_SIN_DATOS_NUT}
          </p>
        )}
      </Card>
    </div>
  );
}


export default function NutritionView({ nutricion, perfil, onAddComida, onDeleteComida, onActualizarComida, onAddFavorito, onRegistrarFavorito, onEliminarFavorito, onSetAgua, onGuardarObjetivos, onGuardarAlimentoPropio, onEliminarAlimentoPropio, onAlternarFavoritoAlimento, accent }) {
  const [sub, setSub] = useState('comidas');

  return (
    <div className="space-y-4 pb-4">
      <SectionTitle sub="Registra para que la IA vea tus hábitos, no para perseguir cifras exactas">Nutrición</SectionTitle>

      {/* 🐛 GE F1 — `flex-wrap`, y lo encontró la comprobación nueva de esta fase.
          Las cuatro pestañas **no caben en 375 px** —el ancho del iPhone de
          Josué—: «📊 Estadísticas» necesita 123 px y le tocaban 80, así que se
          salía 6 px y **la página entera se podía arrastrar a lo ancho**. Es un
          fallo anterior a esta fase, de cuando la E3 F38 añadió la cuarta.

          ⚠️ **No se recorta con `truncate`**: dejaría «📊 Esta…» y una pestaña
          que no se puede leer no dice a dónde lleva (regla 8). Al envolver, la
          cuarta baja a su propia línea **entera**, y en una pantalla ancha
          siguen las cuatro en fila porque `flex-wrap` solo actúa si no caben.

          ⚠️ Y va aquí, no en `ToggleTab`: ese componente lo usan **diez vistas**
          y cambiarlo sería tocar toda la aplicación desde una fase de Nutrición. */}
      <div className="flex flex-wrap gap-2">
        <ToggleTab active={sub === 'comidas'} onClick={() => setSub('comidas')} accent={accent}>Comidas</ToggleTab>
        <ToggleTab active={sub === 'agua'} onClick={() => setSub('agua')} accent={accent}>Agua</ToggleTab>
        <ToggleTab active={sub === 'favoritos'} onClick={() => setSub('favoritos')} accent={accent}>Favoritos</ToggleTab>
        {/* Entrega 3 · F38 (NU F6), apartado 1 — el acceso a las estadísticas,
            dentro de Nutrición y con la navegación de siempre. */}
        <ToggleTab active={sub === 'stats'} onClick={() => setSub('stats')} accent={accent}>
          {ACCESO_ESTADISTICAS.emoji} {ACCESO_ESTADISTICAS.nombre}
        </ToggleTab>
      </div>

      {sub === 'comidas' && (
        <ComidasTab
          comidas={nutricion.comidas} nutricion={nutricion} perfil={perfil}
          onAdd={onAddComida} onAddFavorito={onAddFavorito} onDeleteComida={onDeleteComida}
          onActualizarComida={onActualizarComida}
          onGuardarObjetivos={onGuardarObjetivos}
          onGuardarAlimentoPropio={onGuardarAlimentoPropio}
          onEliminarAlimentoPropio={onEliminarAlimentoPropio}
          onAlternarFavoritoAlimento={onAlternarFavoritoAlimento} accent={accent}
        />
      )}
      {sub === 'agua' && <AguaTab agua={nutricion.agua} onSetAgua={onSetAgua} accent={accent} />}
      {sub === 'favoritos' && (
        <FavoritosTab favoritos={nutricion.favoritos} onRegistrar={onRegistrarFavorito} onEliminar={onEliminarFavorito} accent={accent} />
      )}
      {sub === 'stats' && <EstadisticasNutricion nutricion={nutricion} accent={accent} />}

      {/* 🚨 Entrega 3 · F39 (NU F7), apartados 13 y 14 — la IA sigue siendo **de
          un toque** (regla 7), y ahora se le manda **el análisis**, no las
          comidas una a una: *"no enviar datos innecesarios"*. Veinte fichas de
          comida con su marca y sus gramos no le dicen nada que no diga el
          promedio, y salen de aquí sin necesidad. */}
      <AIPanel
        label="Analizar mi semana"
        accent={accent}
        buildPrompt={() =>
          `Análisis nutricional de Josué, 16 años, con SUS datos ya resumidos (JSON): ` +
          `${JSON.stringify(contextoIANutricion(nutricion))}. ` +
          `Agua de los últimos días (JSON, ml por fecha): ${JSON.stringify(nutricion.agua)}. ` +
          `No des objetivos calóricos estrictos ni un plan de dieta — céntrate en hábitos, constancia, variedad y energía. ` +
          `Ten en cuenta SU objetivo: una desviación no significa lo mismo para perder grasa que para ganar masa. ` +
          `Y lo que no está registrado no es lo mismo que no consumido: no supongas que se salta comidas. ` +
          `Si detectas un patrón simple, cítalo con el dato concreto; si hay pocos datos, dilo abiertamente.`
        }
      />
    </div>
  );
}
