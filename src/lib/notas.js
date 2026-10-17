/* ============================================================================
   📝 NOTAS — crear y editar una nota de la Biblioteca (v3.151.0)

   Josué, 2026-10-17: *"tenemos que solucionar lo de editar las notas"*. Una
   nota se creaba, se leía y se borraba desde la Fase 11, y la BL F8 lo dejó
   escrito en rojo en su propia auditoría (`CAPACIDADES_MINI_APP`). Es lo único
   que le faltaba a la mini-app, y es la Fase 3 de Biblioteca que no venía en el
   documento (C-27): él no tiene ese texto, así que se construye lo que falta.

   🚨 **Una nota ES un apunte de la Fase 11** (`biblioteca.apuntes`, con la forma
   `{ id, fecha, titulo, contenido }`). Aquí no nace una lista nueva ni un campo
   que se llame distinto: editar devuelve **la misma nota, con su id y su fecha**,
   y `App.jsx` la sustituye en su sitio por `snapshotAndSave` —así que Deshacer
   la devuelve como estaba—.

   ⚠️ **Crear y editar comparten la regla**, y por eso viven juntas: una nota
   necesita título o contenido, y sin título se llama «Sin título». Con la regla
   escrita dos veces —una en el formulario y otra al editar— acabarían
   aceptando cosas distintas.

   ⚠️ **`actualizado`** es el campo que ya usan Guardados, Ideas y Documentos, y
   el que lee `cuandoDe` para los Recientes de la Biblioteca (BL F8): una nota
   que se acaba de editar sale arriba. La `fecha` es cuándo se escribió y no se
   toca. El normalizador (`normalizarBiblioteca`) guarda los apuntes enteros, así
   que el campo no se pierde al recargar (regla 5).
   =========================================================================== */

import { uid, todayISO, fechaLocalISO } from './helpers';

/** El nombre que se le pone a una nota sin título (el de la Fase 11). */
export const SIN_TITULO = 'Sin título';

const txt = (x) => (typeof x === 'string' ? x : '');

/** Una nota se puede guardar si tiene título o contenido. Vaciarla del todo no
 *  es editarla: para eso está «Eliminar», que la lleva a Eliminados recientes. */
export function puedeGuardarNota(form) {
  return Boolean(txt(form && form.titulo).trim() || txt(form && form.contenido).trim());
}

/** La nota nueva del formulario rápido, o `null` si no hay nada que guardar. */
export function crearNota(form) {
  if (!puedeGuardarNota(form)) return null;
  return {
    id: uid(),
    fecha: todayISO(),
    titulo: txt(form.titulo).trim() || SIN_TITULO,
    contenido: txt(form.contenido),
  };
}

/** Lo que el formulario enseña al empezar a editar. «Sin título» no es un título
 *  que él escribiera: el campo empieza vacío y el marcador ya lo dice. */
export function formularioDeNota(nota) {
  const titulo = txt(nota && nota.titulo);
  return {
    titulo: titulo === SIN_TITULO ? '' : titulo,
    contenido: txt(nota && nota.contenido),
  };
}

/**
 * La nota con los cambios del formulario.
 *  · `null` si no hay nota o si se quedaría vacía (no se guarda nada).
 *  · **la misma nota, sin tocar**, si no ha cambiado nada: así guardar sin
 *    cambios no la sube a Recientes ni deja un paso de Deshacer vacío.
 *  · si no, la misma nota —mismo `id`, misma `fecha`, el resto de sus campos—
 *    con el título y el contenido nuevos y `actualizado` a hoy, en local.
 */
export function editarNota(nota, form) {
  if (!nota || !nota.id) return null;
  if (!puedeGuardarNota(form)) return null;
  const titulo = txt(form.titulo).trim() || SIN_TITULO;
  const contenido = txt(form.contenido);
  const antes = formularioDeNota(nota);
  if ((antes.titulo || SIN_TITULO) === titulo && antes.contenido === contenido) return nota;
  return { ...nota, titulo, contenido, actualizado: fechaLocalISO(new Date()) };
}
