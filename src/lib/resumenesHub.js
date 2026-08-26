// Fase N1 — Nueva navegación por áreas (sustituye la barra inferior de 4+Más plana).
//
// Cada tarjeta de un hub (Salud/Vida/Gestión/Más) muestra dos líneas de resumen calculadas
// sobre datos que ya existen — nunca una cifra inventada. Si un módulo todavía no tiene datos,
// se dice así abiertamente ("Sin registros todavía, toca para añadir el primero"), mismo
// criterio que el resto de la app desde la Fase 1 (nunca simular algo que no existe).
//
// Fase N4 — cada resumen añade `estado`, el "indicador de estado" que Josué pidió en la
// especificación original de las tarjetas (icono, nombre, resumen, indicador de estado) y que
// no se había construido todavía. Tres valores, deliberadamente honestos y sin inventar
// urgencia que no existe: 'activo' (hay datos recientes/reales que mostrar — punto del color
// de acento), 'vacio' (el módulo todavía no tiene nada que mostrar hoy — punto apagado, del
// color del borde), 'info' (módulos de solo lectura/configuración sin un "dato propio" que
// pueda estar vacío o no — Estadísticas, Predicciones, Logros, Ajustes — sin punto).
import { calcularDuracion, formatHoras, diasHasta, todayISO, addDays } from './helpers';
import { ESTADOS_ANIMO } from '../tokens';
import { resumenDelDia, eventosFuturos } from './calendario';
import { eventosDerivados } from './calendarioIntegracion';
import { resumenHistorial } from './armario';
import { resumenHabito } from './rachas';
import { panelRachas, panelHabitos } from './rachasServicio';

function ultimoPorFecha(lista) {
  if (!lista || lista.length === 0) return null;
  return [...lista].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
}

function diasDesde(fechaISO) {
  if (!fechaISO) return null;
  return Math.max(0, Math.round((Date.now() - new Date(`${fechaISO}T00:00:00`).getTime()) / 86400000));
}

function plural(n, singular, pluralForm) {
  return n === 1 ? singular : pluralForm;
}

// `s` es un objeto con las mismas claves de estado que ya vive en App.jsx (sueno, salud,
// nutricion, calistenia, futbol, estudios, productividad, objetivos, diario, biblioteca,
// bibliotecaArchivos, economia, negocio, relacion, fe, bienestar) — se le pasa tal cual, sin
// transformarlo antes, para no duplicar cálculos que App.jsx ya tiene en otro sitio.
export function calcularResumenModulo(id, s) {
  switch (id) {
    case 'salud': {
      const ultima = ultimoPorFecha(s.salud?.medidas);
      if (!ultima || !ultima.peso) return { linea1: 'Sin registros todavía', linea2: 'Toca para añadir tu primera medida', estado: 'vacio' };
      const dias = diasDesde(ultima.fecha);
      return { linea1: `Peso: ${ultima.peso} kg`, linea2: dias === 0 ? 'Último registro hoy' : `Último registro hace ${dias} ${plural(dias, 'día', 'días')}`, estado: 'activo' };
    }
    case 'sueno': {
      const ultimo = ultimoPorFecha(s.sueno);
      if (!ultimo) return { linea1: 'Sin registros todavía', linea2: 'Toca para registrar cómo dormiste', estado: 'vacio' };
      const horas = calcularDuracion(ultimo.horaDormir, ultimo.horaDespertar);
      return { linea1: `${formatHoras(horas)} h dormidas`, linea2: `Calidad ${ultimo.calidad}/5`, estado: 'activo' };
    }
    case 'nutricion': {
      const hoy = todayISO();
      const comidasHoy = (s.nutricion?.comidas || []).filter((c) => c.fecha === hoy);
      if (comidasHoy.length === 0) return { linea1: 'Nada registrado hoy', linea2: 'Toca para añadir una comida', estado: 'vacio' };
      const kcal = comidasHoy.reduce((a, c) => a + Number(c.calorias || 0), 0);
      const prote = comidasHoy.reduce((a, c) => a + Number(c.proteinas || 0), 0);
      return { linea1: `${Math.round(kcal)} kcal hoy`, linea2: `${Math.round(prote)} g proteína`, estado: 'activo' };
    }
    case 'entreno': {
      const sesiones = Object.values(s.calistenia || {}).flatMap((sk) => sk.sesiones || []);
      const ultima = ultimoPorFecha(sesiones);
      const activas = Object.values(s.calistenia || {}).filter((sk) => sk.nivel > 0).length;
      const partidos = (s.futbol || []).length;
      if (!ultima && partidos === 0) return { linea1: 'Sin sesiones todavía', linea2: 'Toca para registrar un entreno', estado: 'vacio' };
      const dias = ultima ? diasDesde(ultima.fecha) : null;
      return {
        linea1: activas > 0 ? `${activas} ${plural(activas, 'habilidad activa', 'habilidades activas')}` : `${partidos} ${plural(partidos, 'partido registrado', 'partidos registrados')}`,
        linea2: dias !== null ? (dias === 0 ? 'Última sesión hoy' : `Última sesión hace ${dias} ${plural(dias, 'día', 'días')}`) : 'Toca para ver el detalle',
        estado: 'activo',
      };
    }
    // Fase 1 del Calendario Universal — mismo criterio honesto que el resto: nunca inventa
    // urgencia. `linea1` es el resumen de hoy (resumenDelDia, el mismo motor que usa
    // CalendarView.jsx); `linea2` cuenta lo que viene en los próximos 7 días (sin contar hoy) o
    // invita a abrirlo si no hay nada, para que la tarjeta no se quede en blanco de más.
    case 'calendario': {
      // Fase 2 — mismo criterio que CalendarView.jsx/AccesoCalendario: unión de eventos propios
      // + derivados de solo lectura, calculada al vuelo (Relación queda fuera, por privacidad).
      const eventos = [...(s.calendario?.eventos || []), ...eventosDerivados(s)];
      const resumenHoy = resumenDelDia(eventos, todayISO());
      const proximos = eventosFuturos(eventos, addDays(todayISO(), 1), 6).length;
      return {
        linea1: resumenHoy || 'Sin eventos hoy',
        linea2: proximos > 0 ? `${proximos} ${plural(proximos, 'evento próximo', 'eventos próximos')} esta semana` : 'Toca para ver el mes',
        estado: eventos.length > 0 ? 'activo' : 'vacio',
      };
    }
    case 'estudios': {
      const proximo = (s.estudios?.examenes || [])
        .map((ex) => ({ ex, dias: Math.ceil((new Date(`${ex.fecha}T00:00:00`).getTime() - Date.now()) / 86400000) }))
        .filter((x) => x.dias >= 0)
        .sort((a, b) => a.dias - b.dias)[0];
      const horasHoy = (s.estudios?.horas || []).filter((h) => h.fecha === todayISO()).reduce((a, h) => a + Number(h.horas || 0), 0);
      return {
        linea1: proximo ? `Examen en ${proximo.dias} ${plural(proximo.dias, 'día', 'días')}` : 'Sin exámenes próximos',
        linea2: horasHoy > 0 ? `${horasHoy} h estudiadas hoy` : 'Nada estudiado hoy todavía',
        estado: (proximo || horasHoy > 0) ? 'activo' : 'vacio',
      };
    }
    case 'productividad': {
      const pendientes = (s.productividad?.tareas || []).filter((t) => !t.hecha).length;
      // RA Fase 1 — derivada, no leída de un contador guardado.
      const mejorRacha = Math.max(0, ...(s.productividad?.habitos || []).map((h) => resumenHabito(h).actual));
      return {
        linea1: `${pendientes} ${plural(pendientes, 'tarea pendiente', 'tareas pendientes')}`,
        linea2: mejorRacha > 0 ? `Racha de ${mejorRacha} ${plural(mejorRacha, 'día', 'días')}` : 'Sin rachas activas',
        estado: (pendientes > 0 || mejorRacha > 0) ? 'activo' : 'vacio',
      };
    }
    case 'objetivos': {
      const lista = s.objetivos?.lista || [];
      const activos = lista.filter((o) => !o.cumplido).length;
      const pct = lista.length ? Math.round((lista.filter((o) => o.cumplido).length / lista.length) * 100) : null;
      return {
        linea1: `${activos} ${plural(activos, 'objetivo activo', 'objetivos activos')}`,
        linea2: pct !== null ? `${pct}% completado` : 'Todavía sin objetivos',
        estado: lista.length > 0 ? 'activo' : 'vacio',
      };
    }
    case 'diario': {
      const ultima = ultimoPorFecha(s.diario?.entradas);
      if (!ultima) return { linea1: 'Sin entradas todavía', linea2: 'Toca para escribir hoy', estado: 'vacio' };
      const dias = diasDesde(ultima.fecha);
      const estadoAnimo = ESTADOS_ANIMO.find((e) => e.valor === ultima.animo);
      return { linea1: dias === 0 ? 'Última entrada hoy' : `Última entrada hace ${dias} ${plural(dias, 'día', 'días')}`, linea2: estadoAnimo ? `Estado: ${estadoAnimo.label}` : ' ', estado: 'activo' };
    }
    case 'biblioteca': {
      const total = (s.biblioteca?.apuntes?.length || 0) + (s.biblioteca?.enlaces?.length || 0) + (s.bibliotecaArchivos?.length || 0);
      return { linea1: `${total} ${plural(total, 'documento guardado', 'documentos guardados')}`, linea2: total > 0 ? 'Toca para abrir la biblioteca' : 'Toca para añadir el primero', estado: total > 0 ? 'activo' : 'vacio' };
    }
    case 'economia': {
      const movimientos = s.economia?.movimientos || [];
      const saldo = (s.economia?.saldoInicial || 0) + movimientos.reduce((a, m) => a + (m.tipo === 'ingreso' ? m.cantidad : -m.cantidad), 0);
      const mesActual = todayISO().slice(0, 7);
      const ingresosMes = movimientos
        .filter((m) => m.tipo === 'ingreso' && m.fecha?.slice(0, 7) === mesActual)
        .reduce((a, m) => a + Number(m.cantidad || 0), 0);
      return {
        linea1: `Saldo: ${saldo.toFixed(2)} €`,
        linea2: `${ingresosMes.toFixed(2)} € ingresados este mes`,
        estado: (movimientos.length > 0 || s.economia?.saldoInicial) ? 'activo' : 'vacio',
      };
    }
    case 'negocio': {
      const enMarcha = (s.negocio?.proyectos || []).filter((p) => p.estado === 'En marcha').length;
      const balance = (s.negocio?.proyectos || []).reduce((a, p) => a + (Number(p.ingresos || 0) - Number(p.gastos || 0)), 0);
      if ((s.negocio?.proyectos || []).length === 0) return { linea1: 'Sin proyectos todavía', linea2: 'Toca para añadir el primero', estado: 'vacio' };
      return { linea1: `${enMarcha} ${plural(enMarcha, 'proyecto en marcha', 'proyectos en marcha')}`, linea2: `Balance: ${balance.toFixed(2)} €`, estado: 'activo' };
    }
    // Entrega 2 · AR Fase 1 — Armario. La segunda línea cambia según lo que aporte más:
    // con pocas prendas, cuántas categorías tienes; con muchas, cuántas están disponibles
    // de verdad (lo que la Fase 2 necesitará para proponer outfits).
    // RA Fase 4 — el resumen del Centro de Rachas. Junta las rachas propias y los
    // hábitos, porque para Josué son lo mismo aunque vengan de módulos distintos.
    case 'rachas': {
      const hoy = todayISO();
      const propias = panelRachas(s.rachas, hoy).rachas;
      const deHabitos = panelHabitos(s.productividad?.habitos, hoy).rachas;
      const todas = [...propias, ...deHabitos];
      if (!todas.length) {
        return { linea1: 'Todavía no tienes rachas', linea2: 'Toca para empezar la primera', estado: 'vacio' };
      }
      const mejor = todas.reduce((max, r) => (r.actual > max.actual ? r : max), todas[0]);
      const vivas = todas.filter((r) => r.actual > 0).length;
      return {
        linea1: mejor.actual > 0
          ? `${mejor.actual} ${plural(mejor.actual, 'día', 'días')} · ${mejor.nombre}`
          : 'Ninguna racha viva ahora mismo',
        linea2: vivas > 1
          ? `${vivas} rachas en marcha`
          : mejor.actual > 0 ? `Tu mejor: ${mejor.record} ${plural(mejor.record, 'día', 'días')}` : 'Hoy puedes empezar una nueva',
        estado: mejor.actual > 0 ? 'activo' : 'vacio',
      };
    }
    case 'armario': {
      const prendas = s.armario?.prendas || [];
      if (prendas.length === 0) {
        return { linea1: 'Tu armario está vacío', linea2: 'Toca para añadir tu primera prenda', estado: 'vacio' };
      }
      const disponibles = prendas.filter((p) => p.estado === 'disponible').length;
      const categorias = new Set(prendas.map((p) => p.categoria)).size;
      // AR Fase 3: en cuanto hay historial, lo que más informa de un vistazo es cuándo
      // fue la última vez. Sin historial NO se dice "hace 0 días" (apartado 28): se
      // sigue enseñando lo de antes, que es cierto.
      const hist = resumenHistorial(s.armario);
      return {
        linea1: `${prendas.length} ${plural(prendas.length, 'prenda', 'prendas')}`,
        linea2: hist.total > 0
          ? `Último outfit: ${hist.texto.toLowerCase()}`
          : disponibles < prendas.length
            ? `${disponibles} ${plural(disponibles, 'disponible', 'disponibles')}`
            : `${categorias} ${plural(categorias, 'categoría', 'categorías')}`,
        estado: 'activo',
      };
    }
    case 'relacion': {
      if (!s.relacion?.fechas?.length) return { linea1: s.relacion?.nombre || 'Sin configurar', linea2: 'Toca para añadir una fecha importante', estado: 'vacio' };
      const proxima = [...s.relacion.fechas].sort((a, b) => diasHasta(a.fecha) - diasHasta(b.fecha))[0];
      const dias = diasHasta(proxima.fecha);
      return { linea1: proxima.etiqueta, linea2: dias === 0 ? 'Es hoy' : dias === 1 ? 'Es mañana' : `En ${dias} días`, estado: 'activo' };
    }
    case 'fe': {
      const ultimoServicio = ultimoPorFecha(s.fe?.servicio);
      if (!ultimoServicio) return { linea1: 'Sin registros todavía', linea2: 'Toca para registrar tu servicio', estado: 'vacio' };
      const dias = diasDesde(ultimoServicio.fecha);
      return { linea1: `Último servicio: ${ultimoServicio.tipo}`, linea2: dias === 0 ? 'Hoy' : `Hace ${dias} ${plural(dias, 'día', 'días')}`, estado: 'activo' };
    }
    case 'bienestar': {
      const hoy = todayISO();
      const minutosHoy = (s.bienestar?.registros || []).filter((r) => r.fecha === hoy).reduce((a, r) => a + Number(r.minutos || 0), 0);
      return { linea1: minutosHoy > 0 ? `${minutosHoy} min de pantalla hoy` : 'Nada registrado hoy', linea2: 'Toca para ver el detalle', estado: minutosHoy > 0 ? 'activo' : 'vacio' };
    }
    case 'estadisticas':
      return { linea1: 'Correlaciones entre módulos', linea2: 'Sueño, ánimo, entreno y más', estado: 'info' };
    case 'predicciones':
      return { linea1: 'Estimaciones sobre tus datos', linea2: 'Objetivos, peso, hábitos, notas', estado: 'info' };
    case 'logros':
      return { linea1: 'Insignias y mapa de vida', linea2: 'Toca para ver tu progreso', estado: 'info' };
    case 'ajustes':
      return { linea1: 'Cuenta, apariencia y seguridad', linea2: 'Notificaciones, privacidad y más', estado: 'info' };
    default:
      return { linea1: '', linea2: '', estado: 'info' };
  }
}
