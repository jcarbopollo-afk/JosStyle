# ESTILO DE HOMBRE — ESTADO FINAL

> **JC Fitness — Estilo de hombre v1.0** · 65 de 65 · esquema de datos v2
>
> 🚨 **Este informe se genera desde `src/lib/cierre.js`**, y cada línea sale de ejecutar la
> auditoría de su fase. No hay ni un ✅ escrito a mano: si una fase se pone roja, esta página lo
> dice sola. Se regenera con `node --import ./scripts/resolver-vite.mjs scripts/generar-cierre-eh.mjs`.

---

## El informe

| | Apartado | Sale de |
|---|---|---|
| ✅ | **Funcionalidad** | El recorrido completo de esta fase, y la auditoría de la F48 |
| ✅ | **Diseño** | F49 · el vocabulario visual comparado con el resto |
| ✅ | **UX** | F51 (los toques) y F61 (las acciones) |
| ✅ | **Datos** | La regla 5 hecha prueba (F51) y el recorrido completo |
| ✅ | **IA** | F56, F57, F58, F59 y F60 |
| ✅ | **Seguridad** | F43 y F63 |
| ✅ | **Rendimiento** | F44 y F55 |
| 🟡 | **Móvil** | F52 y F62 |
| ✅ | **Integración** | F47 y F48 |

**8 de 9 en verde.**

> 🟡 **Móvil** — 🚨 Nadie ha abierto esto en un iPhone. El simulador de Chromium es lo más cerca que se puede estar sin serlo, y no es lo mismo.

> ⚠️ Los datos están protegidos por RLS, y `/api/ask-ai` ya pide sesión desde el 2026-09-04. Lo que queda: su tope por usuario vive en memoria, no en Supabase, así que frena un bucle de la aplicación pero no a alguien decidido.

> Solo se marca 🟢 FINALIZADO si se cumplen todos los requisitos. Si algo falla: no se oculta, se registra como pendiente.

## Inventario final

| | Estado | Qué significa |
|---|---|---|
| ✅ | **terminado** | Funciona correctamente. |
| 🟡 | **pendiente** | Todavía necesita trabajo, y se puede hacer aquí. |
| 🔴 | **bloqueado** | Depende de otro sistema de JC Fitness, o de una decisión de Josué. |
| 💡 | **futuro** | Deliberadamente no implementado. |

### ✅ Terminado

Los **17 apartados** del catálogo, las **65 fases**, los
**15 sistemas** revisados uno a uno en la F48 y los
**21 recorridos** integrales que se ejecutan solos.

### 🟡 Pendiente

*Se puede hacer aquí, y no se ha hecho.*

- **Enseñar el aviso cuando falla al guardar** *(imprescindible, F52)*
- **Avisar de que la restauración reemplaza una versión más reciente** *(importante, F54)*
- **El "Deshacer" de unos segundos** *(interesante, F61)*
- **Seleccionar varios elementos y actuar sobre todos** *(interesante, F61)*

### 🔴 Bloqueado

*Depende de otro sistema de JC Fitness, o de una decisión de Josué.*

**Detectar conflictos entre dispositivos.**

- Depende de: El esquema de `app_data`: hace falta una columna de versión o marca de tiempo.
- Lo decide: Una decisión de esquema (F41, F45, F46, F54 y F64)
- El arreglo: Añadir la columna y una política de resolución. No es un parche.

**Un sistema global de copias de seguridad.**

- Depende de: JC Fitness entero. Y el enunciado de la F54 prohíbe crear uno separado.
- Lo decide: Josué
- El arreglo: Cuando exista, Estilo de hombre se engancha: ya tiene su `copiaDeSeguridad()`.

**Un sistema de favoritos común a toda la aplicación.**

- Depende de: Los otros módulos, que hoy tienen los suyos.
- Lo decide: Una fase futura
- El arreglo: Unificarlos es una fase, no un arreglo (F39 y F48).

### 🔓 Desbloqueado después de cerrar

*Estaba en 🔴 esperando una decisión. La decisión llegó.*

**`/api/ask-ai` no pedía quién eres. Cualquiera que supiera la URL podía llamarlo y gastar el dinero de Josué en la API de Anthropic.**

- Lo decidió: **Josué**, el 2026-09-04
- Cómo se cerró: `api/ask-ai.js` le pregunta a Supabase de quién es el token de la cabecera `Authorization`, que `src/lib/ai.js` ya manda en sus tres llamadas. Sin token válido: 401, y no se llama a Anthropic.
- ⚠️ Lo que sigue abierto: El límite por usuario vive en memoria, y Vercel levanta y tira instancias: para un límite de verdad haría falta una tabla en Supabase. Para en seco lo que de verdad puede pasar —un bucle de la aplicación, una pestaña reintentando sola—, no a alguien decidido a saltárselo.

### 💡 Futuro

*Deliberadamente no implementado.*

- **Un sistema de favoritos común a toda la aplicación** — Hoy cada módulo tiene los suyos. Unificarlos es una fase, no un arreglo (F39).
- **El puente entre una experiencia y el Diario** — Ninguna fase lo ha pedido todavía; la F47 lo declaró como lo que es.
- **Detectar conflictos entre dispositivos** — Exige versión o marca de tiempo en `app_data`: es una decisión de esquema (F41, F45 y F46).
- **Un catálogo de productos de verdad** — D2-03: arquitectura sí, catálogo no. Entra el día que Josué dé los datos.
- **Los sonidos de Estilo de hombre** — El motor está entero; faltan los archivos, que dará Josué (C-23).

## Congelado

Estilo de hombre está **cerrado** a funciones nuevas.

**No se puede:**

- ❌ Funciones nuevas
- ❌ Módulos nuevos
- ❌ Cambios de arquitectura innecesarios

**Sí se puede:**

- **Corregir algo que está mal** — Un texto que se corta, una cuenta que sale al revés.
- **Arreglar un error** — Algo que revienta o pierde datos.
- **Un ajuste imprescindible** — Encender el aviso de "no se pudo guardar" (F52), que es la única cosa marcada como imprescindible en el backlog.
  - ⚠️ Si hace falta una pantalla nueva para hacerlo, no es un ajuste: es una función.

> Cualquier cambio futuro parte de esta versión y pasa por `bash scripts/verificar.sh` antes de darse por hecho.

## La versión

| | |
|---|---|
| **Nombre** | JC Fitness — Estilo de hombre v1.0 |
| **Fecha** | 2026-09-04 |
| **Fases** | 65 de 65 |
| **Esquema de datos** | v2 |
| **Estado** | Base estable. Cerrado a funciones nuevas. |
| **SQL** | Ninguno. Sesenta y cinco fases y cero cambios de esquema. |
| **Usa** | Calendario · Objetivos · Tareas · Notificaciones · Productos · Armario · Eliminados · Búsqueda · Autenticación · Sincronización |
| **No usa** | Favoritos · Diario |

## Módulo oficial de JC Fitness

**Qué hace.** Estilo de hombre guarda lo que Josué quiere cuidar de sí mismo —piel, pelo, barba, cuerpo, higiene, perfumes, accesorios y gustos—, lo organiza en apartados que enciende y apaga él, y le propone ideas y rutinas a partir de lo que ha contestado.

**Qué no hace.** No guarda su peso, su calendario, sus objetivos, sus tareas, sus fotos, sus rachas ni lo que borra: todo eso ya lo hace JosStyle, y aquí solo se consulta o se apunta su id.

> Los módulos guardan los datos. Los sistemas globales gestionan sus funciones. Las plaquitas muestran.

Usa **10 de los 12** sistemas globales que existen.

## Dónde está todo

- **Cómo funciona por dentro:** `docs/08_ESTILO_DE_HOMBRE_TECNICO.md` (18 apartados)
- **Cómo publicarlo:** `PUBLICAR.md`
- **Qué se hizo en cada fase:** `CHANGELOG.md` y `docs/07_CHECKLIST_ENTREGA2.md`
- **Las 11 ideas del backlog:** backlog() en `escalabilidad.js`, derivado de la F48, la F52 y la F54.

> Ninguna idea descartada se queda en un comentario: todas están en esa lista, con prioridad y motivo.

---

## Condición final

> Estilo de hombre queda cerrado como módulo funcional. No significa que jamás pueda evolucionar: significa que hay una BASE ESTABLE v1.0 sobre la que construir sin volver a empezar.

> Lo que falta no está escondido: está en el inventario, con quién lo decide y cuál es el arreglo.

*Sesenta y cinco fases: arquitectura → módulos → personalización → datos → UX → IA → contexto → accesibilidad → seguridad → copias → escalabilidad → pruebas → producción → cierre.*

*Los 18 apartados de esta fase están contestados; el informe y el inventario se derivan del código.*
