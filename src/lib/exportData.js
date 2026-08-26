import * as XLSX from 'xlsx';
import { resumenHabito } from './rachas';
import Papa from 'papaparse';
import { calcularDuracion, formatHoras, todayISO } from './helpers';

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildExportRows({ sueno, calistenia, futbol, economia, salud, nutricion, estudios, negocio, productividad, objetivos, calendario, diario, biblioteca, fe, bienestar }) {
  const rows = [];
  sueno.forEach((e) =>
    rows.push({
      modulo: 'Sueño',
      fecha: e.fecha,
      detalle: `Dormir ${e.horaDormir} - Despertar ${e.horaDespertar}`,
      valor: `${formatHoras(calcularDuracion(e.horaDormir, e.horaDespertar))} h`,
      extra: `calidad ${e.calidad}/5, interrupciones ${e.interrupciones}, siesta ${e.siesta}min`,
    })
  );
  Object.entries(calistenia).forEach(([skill, d]) => {
    rows.push({
      modulo: 'Calistenia',
      fecha: '',
      detalle: skill,
      valor: `${d.nivel}%`,
      extra: `${(d.progresion || []).length} pasos de progresión, ${(d.sesiones || []).length} sesiones registradas`,
    });
    (d.prs || []).forEach((pr) =>
      rows.push({ modulo: 'Calistenia (PR)', fecha: pr.fecha, detalle: skill, valor: pr.valor, extra: pr.nota || '' })
    );
  });
  futbol.forEach((p) => rows.push({ modulo: 'Fútbol', fecha: p.fecha, detalle: 'Partido', valor: '', extra: p.nota || '' }));
  economia.movimientos.forEach((m) =>
    rows.push({
      modulo: 'Economía',
      fecha: m.fecha,
      detalle: m.concepto,
      valor: `${m.tipo === 'ingreso' ? '+' : '-'}${m.cantidad.toFixed(2)} €`,
      extra: m.tipo,
    })
  );
  if (salud) {
    salud.medidas.forEach((m) =>
      rows.push({
        modulo: 'Salud (medidas)',
        fecha: m.fecha,
        detalle: [m.peso && `${m.peso} kg`, m.grasaCorporal && `${m.grasaCorporal}% grasa`, m.frecuenciaCardiaca && `${m.frecuenciaCardiaca} ppm`].filter(Boolean).join(', '),
        valor: m.tensionSistolica ? `${m.tensionSistolica}/${m.tensionDiastolica || '?'}` : '',
        extra: m.notas || '',
      })
    );
    salud.historial.forEach((h) =>
      rows.push({ modulo: 'Salud (historial)', fecha: h.fecha, detalle: h.tipo, valor: '', extra: h.descripcion })
    );
  }
  // Las fotos de progreso no se incluyen en CSV/Excel: son archivos binarios en Supabase Storage,
  // no datos tabulares — se gestionan y borran directamente desde la pestaña Fotos.

  if (nutricion) {
    nutricion.comidas.forEach((c) =>
      rows.push({
        modulo: 'Nutrición (comida)',
        fecha: c.fecha,
        detalle: c.nombre,
        valor: `${c.calorias} kcal`,
        extra: `${c.proteinas}g prot., ${c.carbohidratos}g carb., ${c.grasas}g grasa, ${c.fibra}g fibra`,
      })
    );
    Object.entries(nutricion.agua).forEach(([fecha, ml]) =>
      rows.push({ modulo: 'Nutrición (agua)', fecha, detalle: 'Agua', valor: `${ml} ml`, extra: '' })
    );
  }

  if (estudios) {
    const nombreAsignatura = (id) => estudios.asignaturas.find((a) => a.id === id)?.nombre || '';
    estudios.examenes.forEach((ex) =>
      rows.push({
        modulo: 'Estudios (examen)',
        fecha: ex.fecha,
        detalle: `${nombreAsignatura(ex.asignaturaId)} — ${ex.tema}`,
        valor: ex.notaObtenida || (ex.notaObjetivo ? `objetivo ${ex.notaObjetivo}` : ''),
        extra: `${(ex.planRepaso || []).filter((p) => p.hecho).length}/${(ex.planRepaso || []).length} pasos de repaso hechos`,
      })
    );
    estudios.horas.forEach((h) =>
      rows.push({ modulo: 'Estudios (horas)', fecha: h.fecha, detalle: nombreAsignatura(h.asignaturaId), valor: `${h.horas} h`, extra: '' })
    );
  }

  if (negocio) {
    negocio.proyectos.forEach((p) =>
      rows.push({
        modulo: 'Negocio',
        fecha: p.fecha,
        detalle: p.nombre,
        valor: `${p.estado}`,
        extra: `ingresos ${p.ingresos}€, gastos ${p.gastos}€${p.notas ? ` — ${p.notas}` : ''}`,
      })
    );
  }

  if (productividad) {
    // RA Fase 1 — la racha exportada se deriva del historial, igual que la que se ve
    // en pantalla. Antes salía del contador guardado, así que una exportación podía
    // no cuadrar con lo que la app enseñaba.
    productividad.habitos.forEach((h) => {
      const r = resumenHabito(h);
      rows.push({ modulo: 'Productividad (hábito)', fecha: '', detalle: h.nombre, valor: `racha ${r.actual}`, extra: `mejor racha: ${r.record}` });
    });
    productividad.tareas.forEach((t) =>
      rows.push({ modulo: 'Productividad (tarea)', fecha: t.fechaLimite || '', detalle: t.texto, valor: t.hecha ? 'hecha' : 'pendiente', extra: '' })
    );
    productividad.metas.forEach((m) =>
      rows.push({ modulo: 'Productividad (meta)', fecha: '', detalle: m.nombre, valor: `${m.progreso}/${m.objetivo}`, extra: m.periodo })
    );
  }

  if (objetivos) {
    objetivos.lista.forEach((o) =>
      rows.push({ modulo: 'Objetivos', fecha: o.fechaCreacion || '', detalle: o.texto, valor: o.cumplido ? 'cumplido' : 'activo', extra: o.plazo })
    );
  }

  // Fase 1 del Calendario Universal — texto puro, sin PIN, mismo criterio que Objetivos/Diario:
  // se exporta entero. Solo los eventos creados a mano en esta fase (origen 'calendario'); una
  // Fase 2 futura que traiga eventos de solo lectura de otros módulos no debería duplicarlos aquí
  // (ya se exportan desde su propio módulo de origen).
  if (calendario) {
    calendario.eventos
      .filter((e) => e.origen === 'calendario')
      .forEach((e) =>
        rows.push({
          modulo: 'Calendario',
          fecha: e.fecha,
          detalle: `${e.titulo} (${e.tipo})`,
          valor: e.todoElDia ? 'Todo el día' : (e.horaInicio || ''),
          extra: [e.ubicacion, e.notas].filter(Boolean).join(' — '),
        })
      );
  }

  if (diario) {
    diario.entradas.forEach((e) =>
      rows.push({
        modulo: 'Diario',
        fecha: e.fecha,
        detalle: e.comoMeSiento || '',
        valor: `ánimo ${e.animo}/5`,
        extra: [e.queHeAprendido && `Aprendido: ${e.queHeAprendido}`, e.queMejorareManana && `Mejorar: ${e.queMejorareManana}`].filter(Boolean).join(' — '),
      })
    );
  }

  // Fase 11 — Biblioteca: solo apuntes y enlaces son datos tabulares. Los archivos (pdf/vídeo/foto)
  // no se incluyen, mismo criterio que las fotos de progreso de Salud — son binarios en Supabase
  // Storage, se gestionan y borran directamente desde la propia pestaña Biblioteca.
  if (biblioteca) {
    biblioteca.apuntes.forEach((a) =>
      rows.push({ modulo: 'Biblioteca (apunte)', fecha: a.fecha, detalle: a.titulo, valor: '', extra: (a.contenido || '').slice(0, 200) })
    );
    biblioteca.enlaces.forEach((e) =>
      rows.push({ modulo: 'Biblioteca (enlace)', fecha: e.fecha, detalle: e.titulo, valor: e.url, extra: e.descripcion || '' })
    );
  }

  // Fase 14 — Fe: sin PIN, mismo criterio que Diario/Biblioteca — texto puro, se exporta entero.
  // Solo servicio y calendario llevan fecha propia; diario/objetivos usan las mismas claves que
  // sus equivalentes generales (fecha/texto y texto/plazo/cumplido respectivamente).
  if (fe) {
    fe.servicio.forEach((s) =>
      rows.push({ modulo: 'Fe (servicio)', fecha: s.fecha, detalle: s.tipo, valor: '', extra: s.notas || '' })
    );
    fe.eventos.forEach((e) =>
      rows.push({ modulo: 'Fe (calendario)', fecha: e.fecha, detalle: `${e.tipo} — ${e.titulo}`, valor: '', extra: e.notas || '' })
    );
    fe.diario.forEach((d) =>
      rows.push({ modulo: 'Fe (diario espiritual)', fecha: d.fecha, detalle: (d.texto || '').slice(0, 200), valor: '', extra: '' })
    );
    fe.objetivos.forEach((o) =>
      rows.push({ modulo: 'Fe (objetivo)', fecha: o.fechaCreacion || '', detalle: o.texto, valor: o.cumplido ? 'cumplido' : 'activo', extra: o.plazo })
    );
  }

  // Fase 15 — Bienestar digital: sin PIN ni archivos, mismo criterio que Fe/Diario/Biblioteca —
  // texto puro, se exporta entero. registros/sesiones son numéricos; reflexiones es texto libre.
  if (bienestar) {
    bienestar.registros.forEach((r) =>
      rows.push({ modulo: 'Bienestar (tiempo de uso)', fecha: r.fecha, detalle: r.app || r.categoria, valor: `${r.minutos} min`, extra: r.categoria })
    );
    bienestar.sesiones.forEach((s) =>
      rows.push({ modulo: 'Bienestar (concentración)', fecha: s.fecha, detalle: 'Sesión completada', valor: `${s.minutos} min`, extra: '' })
    );
    bienestar.reflexiones.forEach((r) =>
      rows.push({ modulo: 'Bienestar (reflexión)', fecha: r.fecha, detalle: (r.texto || '').slice(0, 200), valor: '', extra: '' })
    );
  }

  return rows;
}

export function exportCSV(state) {
  const csv = Papa.unparse(buildExportRows(state));
  downloadBlob(`mis-datos-${todayISO()}.csv`, csv, 'text/csv;charset=utf-8;');
}

export function exportXLSX(state) {
  const ws = XLSX.utils.json_to_sheet(buildExportRows(state));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadBlob(`mis-datos-${todayISO()}.xlsx`, out, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
