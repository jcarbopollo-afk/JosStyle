// ═══════════════════════════════════════════════════════════════════════════
// 🛡 HORARIOS · E1-R, R3 — EL DOBLE DE LAS FUNCIONES PROTEGIDAS DEL SERVIDOR (R1) PARA EL RECORRIDO DE CHROMIUM.
//
// Imita `protegido_aplicar`, `protegido_estado`, `protegido_leer`, `protegido_protocolo`, `protegido_copia_*` y
// `protegido_espacio` de `supabase/horarios-protegido.sql` sobre el MISMO almacén que el doble de `app_data` del
// recorrido (`almacen` de test-app-real.mjs): una operación se aplica ENTERA o no se aplica, con el registro de
// idempotencia (su huella), la revisión nueva del horario como segunda capa, las condiciones por elemento y, si una
// falla y es manual, la copia apartada en la misma «transacción». La validación y los cambios por elemento son los del
// cliente (`operacionesProtegidas.js`), cuya paridad con el servidor de verdad demuestra el nivel 3
// (`test-escritor-operaciones-postgrest.mjs`: 37 operaciones y 400 cambios al azar, el mismo resultado o el mismo fallo).
//
// No sustituye al laboratorio: es para que la APLICACIÓN entera, en Chromium y con dos aparatos, hable con algo que se
// comporta como R1. La transacción de verdad se prueba contra Postgres (nivel 3).
// ═══════════════════════════════════════════════════════════════════════════
await import('./resolver-vite.mjs');
const { validarOperacion, aplicarCambios } = await import('../src/lib/operacionesProtegidas.js');
const { textoCanonico } = await import('../src/lib/guardiaHorario.js');

const copia = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const esObjeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const tamano = (v) => Buffer.byteLength(JSON.stringify(v ?? null), 'utf8');

/**
 * `almacen`: el objeto clave → valor del doble de `app_data` (una clave que no está, o vale `null`, no existe).
 * Devuelve las funciones (cada una devuelve lo que devolvería el servidor) y su estado para las comprobaciones.
 */
export function crearDobleProtegido(almacen) {
  const S = {
    registro: new Map(),   // opId → { huella, resultado, revision, copiaId, motivo, claves }
    copias: new Map(),     // copiaId → { op, meta, vista, tipo, creadaEn }
    corte: null,
    protocolo: { version: 1, versionMinima: null, reglas: { horarioTop: false } },
    aplicaciones: 0,
  };
  const existe = (k) => almacen[k] !== undefined && almacen[k] !== null;
  const revision = () => (existe('horarioTop') && esObjeto(almacen.horarioTop.testigo) ? almacen.horarioTop.testigo.revision ?? null : null);

  function aplicar(op) {
    const motivo = validarOperacion(op);
    if (motivo) return { estado: 'invalida', motivo };
    const huella = textoCanonico(op);
    const reg = S.registro.get(op.opId);
    if (reg) {
      if (reg.huella !== huella) return { estado: 'invalida', motivo: 'op_distinta', opId: op.opId };
      return { estado: reg.resultado, registrada: true, opId: op.opId, revision: reg.revision, copiaId: reg.copiaId, motivo: reg.motivo };
    }
    if (S.corte && op.creadaEn < S.corte) return { estado: 'caducada', opId: op.opId, corte: S.corte };
    const claves = [...(op.claves || [])].map((c) => c.clave).sort();
    const conHorario = esObjeto(op.horario);
    const hExiste = existe('horarioTop');
    const revActual = revision();
    let fallo = null;
    if (conHorario) {
      const revNueva = op.horario.valor && op.horario.valor.testigo ? op.horario.valor.testigo.revision : null;
      if (hExiste && revActual === revNueva) return { estado: 'aplicada', reconocidaPor: 'revision', opId: op.opId, revision: revNueva };
      const b = op.horario.base;
      const bien = (b === null && !op.horario.baseExiste && !hExiste) || (b === null && op.horario.baseExiste && hExiste && revActual === null) || (b !== null && hExiste && revActual === b);
      if (!bien) fallo = { motivo: 'revision', clave: 'horarioTop', esperada: b, actual: revActual, existe: hExiste };
    }
    const nuevos = {};
    if (!fallo) {
      for (const k of claves) {
        const c = op.claves.find((x) => x.clave === k);
        let valor = existe(k) ? copia(almacen[k]) : copia(c.inicial || {});
        for (const cb of c.cambios) {
          const r = aplicarCambios(valor, [cb], k);
          if (r.fallo) { fallo = r.fallo; break; }
          valor = r.nuevo;
        }
        if (fallo) break;
        nuevos[k] = valor;
      }
    }
    if (fallo) {
      let copiaId = null;
      if (op.manual) {
        copiaId = op.opId;
        if (!S.copias.has(copiaId)) {
          S.copias.set(copiaId, {
            tipo: 'conflicto', op: copia(op), vista: false, creadaEn: new Date().toISOString(),
            meta: { tipoOperacion: op.tipo, claves, conHorario, motivo: fallo, contraRevision: revActual, aparatoSuyo: hExiste && esObjeto(almacen.horarioTop.testigo) ? almacen.horarioTop.testigo.aparato || null : null, creadaEn: op.creadaEn },
          });
        }
      }
      S.registro.set(op.opId, { huella, resultado: 'conflicto', revision: null, copiaId, motivo: fallo, claves });
      return { estado: 'conflicto', opId: op.opId, motivo: fallo, copiaId, actual: conHorario ? { existe: hExiste, valor: hExiste ? copia(almacen.horarioTop) : null } : null };
    }
    if (conHorario) almacen.horarioTop = copia(op.horario.valor);
    for (const k of Object.keys(nuevos)) almacen[k] = nuevos[k];
    S.aplicaciones += 1;
    const revNueva = conHorario ? op.horario.valor.testigo.revision : null;
    S.registro.set(op.opId, { huella, resultado: 'aplicada', revision: revNueva, copiaId: null, motivo: null, claves });
    return { estado: 'aplicada', opId: op.opId, revision: revNueva, aplicadaEn: new Date().toISOString() };
  }

  const estado = (opId) => {
    const reg = S.registro.get(opId);
    return reg ? { estado: reg.resultado, opId, revision: reg.revision, copiaId: reg.copiaId, motivo: reg.motivo } : { estado: 'desconocida', opId, corte: S.corte };
  };
  const leer = (claves) => {
    const res = {};
    for (const k of claves || []) {
      if (!['horarioTop', 'estudios', 'papelera'].includes(k)) return { estado: 'invalida', motivo: 'clave_no_permitida', clave: k };
      res[k] = { existe: existe(k), valor: existe(k) ? copia(almacen[k]) : null, sello: null };
    }
    return { estado: 'leidas', claves: res, ahora: new Date().toISOString() };
  };
  const copiaEliminar = (id) => {
    const c = S.copias.get(id);
    if (!c) return { estado: 'no_existe', id };
    S.copias.delete(id);
    return { estado: 'eliminada', id, tamano: tamano(c.op) };
  };
  const copiaVista = (id) => {
    const c = S.copias.get(id);
    if (!c) return { estado: 'no_existe', id };
    c.vista = true;
    return { estado: 'vista', id };
  };
  const espacio = () => ({ estado: 'espacio', copias: S.copias.size, bytes: [...S.copias.values()].reduce((t, c) => t + tamano(c.op), 0) });
  const protocolo = () => ({ ...S.protocolo, ahora: new Date().toISOString() });

  return { S, aplicar, estado, leer, copiaEliminar, copiaVista, espacio, protocolo };
}
