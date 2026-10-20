import { resumenHabito } from './rachas';
/* 🔓 Fase 1C — «Primer PR» también con un récord verificable de Fitness (F11). */
import { primerRecordPersonal } from './progresion';

// Fase 20 — Centro de logros: igual que predicciones.js y correlaciones.js, este motor no
// guarda nada propio — calcula insignias al vuelo a partir de datos que ya existen en otros
// módulos. Cada logro es {id, titulo, desc, conseguido, progreso, meta} — "progreso"/"meta" son
// opcionales (solo para los logros con una cifra que tenga sentido mostrar como "3/10").
// Deliberadamente sin puntos, niveles ni monedas — son insignias binarias (conseguido o no),
// mismo espíritu "no sobregamificar" que ya se aplicó a Bienestar digital en la Fase 15.
export function calcularLogros({ productividad, diario, objetivos, bienestar, fe, nutricion, salud, calistenia, fitness = null, economia, sueno }) {
  // RA Fase 1 — la mejor racha se DERIVA del historial de cada hábito. Antes se leía
  // `h.mejorRacha`, un contador guardado que se podía inflar desmarcando y volviendo
  // a marcar el mismo día: bastaba con eso para desbloquear "Un mes de constancia"
  // sin haber cumplido nada. Ahora un logro solo se consigue cumpliendo de verdad.
  const mejorRacha = (productividad?.habitos || []).reduce((max, h) => Math.max(max, resumenHabito(h).record), 0);
  const entradasDiario = (diario?.entradas || []).length;
  const objetivosCumplidos = (objetivos?.lista || []).filter((o) => o.cumplido).length;
  const sesionesConcentracion = (bienestar?.sesiones || []).length;
  const registrosServicioFe = (fe?.servicio || []).length;
  const comidasRegistradas = (nutricion?.comidas || []).length;
  const medidasSalud = (salud?.medidas || []).length;
  /* 🔓 Fase 1C — «Primer PR» ERA IMPOSIBLE para una cuenta nueva: pedía un récord de
     calistenia y desde la v3.158.0 no hay dónde registrarlo (regla 8). La Fase 1B lo dejó tal
     cual porque «la primera vez que se hace un ejercicio ya es su mejor marca»; eso se resuelve
     pidiendo lo que de verdad es un récord: **superar** la mejor marca anterior de un ejercicio,
     medida igual (`primerRecordPersonal`, FIT F11). Así:
       · quien lo consiguió con un PR de calistenia **lo conserva** (sus `prs` siguen ahí y
         siguen contando; no hay nada guardado que migrar: los logros se calculan);
       · ninguna marca de antes se convierte en una de Fitness, ni al revés: son dos caminos
         al mismo logro, cada uno con su propio dato;
       · el total sigue siendo el mismo para todos (12) y todos se pueden conseguir.
     Anotado en `docs/15_asistentes/DECISIONES.md` (DA-11). */
  const prsCalistenia = Object.values(calistenia || {}).reduce((sum, s) => sum + (Array.isArray(s?.prs) ? s.prs.length : 0), 0);
  const recordFitness = primerRecordPersonal(fitness);
  const prConseguido = prsCalistenia >= 1 || !!recordFitness;
  const descPR = prsCalistenia >= 1 && !recordFitness
    ? 'Registraste un récord personal de calistenia'
    : 'Supera tu mejor marca en un ejercicio de Fitness';
  const movimientosEconomia = (economia?.movimientos || []).length;
  const nochesSueno = (sueno || []).length;

  return [
    { id: 'racha7', titulo: 'Una semana seguida', desc: 'Mantén un hábito 7 días', conseguido: mejorRacha >= 7, progreso: Math.min(mejorRacha, 7), meta: 7 },
    { id: 'racha30', titulo: 'Un mes de constancia', desc: 'Mantén un hábito 30 días', conseguido: mejorRacha >= 30, progreso: Math.min(mejorRacha, 30), meta: 30 },
    { id: 'diario10', titulo: 'Empieza a escribir', desc: '10 entradas en el Diario', conseguido: entradasDiario >= 10, progreso: Math.min(entradasDiario, 10), meta: 10 },
    { id: 'diario50', titulo: 'Cronista de tu vida', desc: '50 entradas en el Diario', conseguido: entradasDiario >= 50, progreso: Math.min(entradasDiario, 50), meta: 50 },
    { id: 'objetivo1', titulo: 'Primer objetivo cumplido', desc: 'Marca un objetivo como cumplido', conseguido: objetivosCumplidos >= 1, progreso: Math.min(objetivosCumplidos, 1), meta: 1 },
    { id: 'concentracion5', titulo: 'Modo concentración', desc: '5 sesiones de concentración', conseguido: sesionesConcentracion >= 5, progreso: Math.min(sesionesConcentracion, 5), meta: 5 },
    { id: 'servicio5', titulo: 'Al servicio', desc: '5 registros de servicio en Fe', conseguido: registrosServicioFe >= 5, progreso: Math.min(registrosServicioFe, 5), meta: 5 },
    { id: 'nutricion10', titulo: 'Registrando lo que comes', desc: '10 comidas registradas', conseguido: comidasRegistradas >= 10, progreso: Math.min(comidasRegistradas, 10), meta: 10 },
    { id: 'salud1', titulo: 'Primer chequeo', desc: 'Registra tu primera medida de Salud', conseguido: medidasSalud >= 1, progreso: Math.min(medidasSalud, 1), meta: 1 },
    { id: 'pr1', titulo: 'Primer PR', desc: descPR, conseguido: prConseguido, progreso: prConseguido ? 1 : 0, meta: 1 },
    { id: 'economia10', titulo: 'Controlando el dinero', desc: '10 movimientos económicos registrados', conseguido: movimientosEconomia >= 10, progreso: Math.min(movimientosEconomia, 10), meta: 10 },
    { id: 'sueno20', titulo: 'Rutina de sueño', desc: '20 noches de sueño registradas', conseguido: nochesSueno >= 20, progreso: Math.min(nochesSueno, 20), meta: 20 },
  ];
}
