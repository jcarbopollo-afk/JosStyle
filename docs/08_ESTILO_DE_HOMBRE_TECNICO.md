# ESTILO DE HOMBRE — DOCUMENTACIÓN TÉCNICA

> **EH Fase 53/65.** Si dentro de meses queremos modificar Estilo de hombre, hay que poder entenderlo sin rehacer todo el análisis.
>
> 🚨 **Este documento se genera desde `src/lib/documentacionEH.js`.** El documento se deriva del código. Si el código cambia y el documento no lo recoge, la prueba se pone roja.
> No lo edites a mano: edita la librería y vuelve a generarlo.

---

## 1 · Qué hace y qué no hace

**Qué hace.** Estilo de hombre guarda lo que Josué quiere cuidar de sí mismo —piel, pelo, barba, cuerpo, higiene, perfumes, accesorios y gustos—, lo organiza en apartados que enciende y apaga él, y le propone ideas y rutinas a partir de lo que ha contestado.

**Qué NO hace.** No guarda su peso, su calendario, sus objetivos, sus tareas, sus fotos, sus rachas ni lo que borra: todo eso ya lo hace JosStyle, y aquí solo se consulta o se apunta su id.

> **La regla.** Los módulos guardan los datos. Los sistemas globales gestionan sus funciones. Las plaquitas muestran.

### Cómo está organizado

| Capa | Qué es | Dónde |
|---|---|---|
| **Datos** | Una clave de Supabase, `estiloHombre`, con un objeto por módulo. | `src/lib/estiloDeHombre.js` |
| **Catálogo** | Los módulos son LÍNEAS de `MODULOS_EH`. Añadir uno es añadir una línea. | `src/lib/estiloDeHombre.js` |
| **Motores** | Rutinas, recomendaciones, productos y cuestionarios: compartidos, nunca duplicados. | `src/lib/motor*.js` |
| **Pantalla** | Una vista con un componente por apartado. | `src/views/EstiloHombreView.jsx` |
| **Revisores** | Las fases 43-53 no añaden funciones: comprueban las que hay. | `src/lib/{privacidad,rendimiento,coherenciaVisual,...}` |

## 2 · Mapa de módulos

*Derivado de `MODULOS_EH`. Añadir un módulo es añadir una línea allí; aquí aparece solo.*

**👕 Estilo**
- 👕 Estilo y armario *(F2)*
- 🌫️ Perfumes *(F24)*
- 🕶️ Accesorios *(F26)*

**🧴 Cuidado**
- 💇 Pelo *(F12)*
- 🧔 Barba *(F15)*
- 🧴 Skincare *(F6)*
- 🧼 Higiene *(F18)*
- 🧍 Cuidado corporal *(F21)*
- 😁 Sonrisa *(F23)*

**🏋️ Físico**
- 🏋️ Fitness *(F26)*
- 😴 Sueño *(F30)*

**❤️ Salud**
- 🧬 Salud *(F33)*

**❤️ Personal**
- ❤️ Mis gustos *(F27)*
- 🧠 Hábitos y rutinas *(F37)*
- 📊 Progreso *(F45)*

**📚 Conocimiento**
- 📚 Educación *(F50)*

**🛒 Compras**
- 🛒 Productos *(F55)*

**Pantallas que no son un módulo:**

- **Descubrir** *(F32)* — Tarjetas de ideas que se pueden rechazar.
- **Preferencias** *(F38)* — Lo que ha contestado, editable y borrable.
- **Buscador** *(F39)* — Busca en todos los apartados a la vez.
- **Gestionar apartados** *(F36)* — Encender, apagar, ocultar y reordenar.
- **Progreso** *(F35)* — Métricas sin puntuaciones ni porcentajes.
- **Mis datos** *(F43)* — Qué se guarda, cómo se exporta y cómo se borra.

## 3 · Dependencias globales

| Sistema | ¿Se usa? | Cómo / por qué no | Dónde |
|---|---|---|---|
| **Calendario** | ✅ | Los eventos de las rutinas se derivan; nunca se materializan (regla 11). | `calendarioIntegracion.js` |
| **Objetivos** | ✅ | Se guarda el id del objetivo, no una copia. | `objetivosEnEstiloHombre.js` |
| **Tareas** | ✅ | Una acción como "Comprar producto X" crea una tarea en Productividad; aquí queda solo su id. | `integracionEstilo.js` |
| **Notificaciones** | ✅ | Las genera el sistema global. Estilo de hombre solo dice qué y cuándo. | `avisosEstilo.js` |
| **Favoritos** | ❌ | 🚨 No hay un sistema global de favoritos: cada módulo tiene los suyos. Unificarlos es una fase (F39), no un arreglo, y está en el backlog de la F48. | — |
| **Productos** | ✅ | El inventario de productos es el de la aplicación, con `motorProductos`. | `motorProductos.js` |
| **Diario** | ❌ | El puente entre una experiencia y el Diario no lo ha pedido ninguna fase. La F47 lo declaró como lo que es: pendiente, no roto. | — |
| **Armario** | ✅ | Se consultan las prendas; no se copia ninguna. | `armarioEnEstiloHombre.js` |
| **Eliminados** | ✅ | La papelera global de ME F3. Estilo de hombre NO tiene la suya. | `papelera.js` |
| **Búsqueda** | ✅ | El índice global, más el buscador propio de la F39 dentro del módulo. | `indiceBusqueda.js · buscadorEstilo.js` |
| **Autenticación** | ✅ | La sesión de Supabase. Estilo de hombre no toca el login. | `supabase.js` |
| **Sincronización** | ✅ | `loadData` y `saveData`. ⚠️ `saveData` SOBRESCRIBE (regla 5). | `supabase.js` |

## 4 · Dónde vive cada dato

> Antes de guardar un dato nuevo, mirar `FUENTES_GLOBALES`. Si ya existe fuera, se consulta; no se copia.

| Dato | Vive en | Módulo | Clave |
|---|---|---|---|
| peso | 🌍 global | salud | `salud` |
| perfil | 🌍 global | perfil | `perfil` |
| objetivos | 🌍 global | objetivos | `objetivos` |
| entrenamientos | 🌍 global | entreno | `calistenia` |
| sueno | 🌍 global | sueno | `sueno` |
| nutricion | 🌍 global | nutricion | `nutricion` |
| diario | 🌍 global | diario | `diario` |
| calendario | 🌍 global | calendario | `calendario` |
| rachas | 🌍 global | rachas | `rachas` |
| armario | 🌍 global | armario | `armario` |
| registros | 🧔 Estilo de hombre | skincare | `estiloHombre.skincare.registros` |
| rutinas | 🧔 Estilo de hombre | barba | `estiloHombre.barba.rutinas` |
| registros | 🧔 Estilo de hombre | barba | `estiloHombre.barba.registros` |
| rutinas | 🧔 Estilo de hombre | sonrisa | `estiloHombre.sonrisa.rutinas` |
| revisiones | 🧔 Estilo de hombre | sonrisa | `estiloHombre.sonrisa.revisiones` |
| perfumes | 🧔 Estilo de hombre | perfumes | `estiloHombre.perfumes.perfumes` |
| historial | 🧔 Estilo de hombre | perfumes | `estiloHombre.perfumes.historial` |
| accesorios | 🧔 Estilo de hombre | accesorios | `estiloHombre.accesorios.accesorios` |
| deseos | 🧔 Estilo de hombre | accesorios | `estiloHombre.accesorios.deseos` |
| entradas | 🧔 Estilo de hombre | gustos | `estiloHombre.gustos.entradas` |

## 5 · Estados

| | Estado | De | Qué significa |
|---|---|---|---|
| 🟢 | **Activo** | un módulo | Se usa y se ve en la pantalla principal. |
| ⚪ | **Oculto** | un módulo | No se ve, pero SIGUE FUNCIONANDO: da ideas, tarjetas y métricas. |
| ⏸️ | **Desactivado** | un módulo | Apagado. **No borra nada**: su `config` se conserva entera. |
| 🗑️ | **Eliminado** | un elemento | Está en la papelera global, con 30 días para volver. |

## 6 · Cómo se elimina

1. **Eliminar** — `eliminarConPapelera(...)` — nunca un `filter` a mano.
2. **Eliminados recientemente** — La papelera global, 30 días.
3. **Recuperar** — `restaurar(...)`, que devuelve el elemento a su colección.
4. **Eliminar definitivamente** — Solo desde la papelera, y solo a mano.

> 🚨 Una colección nueva que se pueda borrar necesita su entrada en `CATALOGO_PAPELERA`. Sin ella, el borrado es IRREVERSIBLE y no lo avisa nadie: ya pasó con las rutinas de Skincare, las de Pelo y los perfumes por probar.

La papelera global cubre **49 colecciones**, de las cuales **21** son de Estilo de hombre.

## 7 · Estructura de datos

| | |
|---|---|
| **Tabla** | `app_data (user_id uuid, key text, value jsonb, updated_at timestamptz)` |
| **Clave primaria** | `(user_id, key)` |
| **Clave de este módulo** | `estiloHombre` |
| **Relaciones** | `user_id` referencia a `auth.users(id)` con `on delete cascade`. |
| **Índices** | Ninguno aparte de la clave primaria: todas las consultas son por (user_id, key). |
| **Identificadores** | Cada elemento lleva un `id` propio, sellado por la migración v1→v2 de la F46. |
| **Versión del esquema de datos** | v2 |
| **Módulos con clave propia** | 17 |

> Aquí no hay ni una clave, ni una URL de proyecto, ni un token. Las variables están en `PUBLICAR.md` por su nombre, sin su valor.

## 8 · Migraciones

| De | A | Qué cambió | Por qué |
|---|---|---|---|
| v1 | v2 | Poner un id estable a lo que se guardó sin él | Sin id, cada dispositivo le pone uno distinto y el elemento se duplica al sincronizar. |

## 9 · Componentes que se reutilizan

*No crear componentes duplicados sin motivo.*

| Para | Se usa | Vive en |
|---|---|---|
| Plaquitas | `Plaquita` | EstiloHombreView.jsx |
| Modales | `createPortal` | react-dom · regla invariante del proyecto |
| Buscador | `BuscadorEstiloEH` | EstiloHombreView.jsx |
| Selectores | `SelectInput` | ui.jsx |
| Botones | `PrimaryButton` | ui.jsx |
| Estados vacíos | `VacioEH` | EstiloHombreView.jsx |

## 10 · Reglas de diseño

*Siempre los tokens globales de JC Fitness.*

- **Colores** — Solo `COLORS`. Ni un hex suelto, y nunca desestructurar el objeto: es un singleton mutable. *(invariante)*
- **Texto sobre el acento** — `COLORS.textOnAccent`, nunca `#fff`: con un acento claro sería blanco sobre claro. *(F49)*
- **Espaciados** — Los de Tailwind que ya usa el resto de la aplicación. `-m-1.5` es la única excepción, y es de la F42 (área táctil de 44 px). *(F49)*
- **Tipografía** — Los tamaños del resto de JosStyle. Nada por debajo de lo que la F42 fijó como legible. *(F42)*
- **Iconos** — Emoji para los módulos, `lucide-react` para la interfaz. Volver es siempre `ArrowLeft size={16}`. *(F50)*
- **Bordes** — Los radios del resto de la aplicación. `rounded-t-3xl` y `rounded-3xl` son la misma familia. *(F49)*
- **Animaciones** — Nada por encima de 500 ms, nada decorativo, y `active:scale` vive en `ui.jsx`, no en la vista. *(F50)*
- **Modo oscuro** — Sale solo si no hay colores literales. Verlo sigue siendo cosa de Josué. *(F49)*

## 11 · Reglas de UX

- **Nada obligatorio.** Ningún apartado se enciende solo, y ninguno hace falta para que funcione otro.
- **Todo lo posible se puede ocultar.** La pantalla es suya: qué aparece, en qué orden y de qué tamaño.
- **Ocultar no elimina.** Un módulo oculto sigue dando ideas, tarjetas y métricas. Solo deja de pintarse.
- **Desactivar no elimina.** `alternarModulo` no toca `config`. Volver a encenderlo devuelve todo.
- **Recomendaciones subjetivas.** Se sugiere, no se diagnostica. Ni una palabra médica.
- **No duplicar sistemas globales.** La papelera, el calendario, las tareas y los productos son los de JosStyle.

## 12 · Notificaciones

- **Qué genera Estilo de hombre:** Recordatorios de rutinas, avisos de seguimiento y sugerencias por uso.
- **Qué usa del sistema global:** El sistema global de notificaciones. Estilo de hombre no habla con el navegador.
- **Qué requiere que él lo encienda:** 🚨 TODAS. Cada recordatorio nace APAGADO y lo enciende él. Nunca se pide el permiso dos veces.
- **Frecuencia:** Configurable desde ⋮ Personalizar → Avisos.

## 13 · Privacidad

- **Qué se guarda:** Lo que él escribe: rutinas, registros, productos, perfumes, gustos y las respuestas de los cuestionarios.
- **Cómo se protege:** RLS en Supabase (`auth.uid() = user_id`) y, si lo enciende, el PIN de la aplicación.
- **Cómo se elimina:** Por elemento (papelera), por módulo, o Estilo de hombre entero desde Mis datos.
- **Cómo se exporta:** Desde Mis datos, en JSON, con todo lo que hay.
- **Qué no sale de aquí:** Nada sale del dispositivo salvo a Supabase. La IA solo recibe lo que él manda, y no se le manda un registro entero.

## 14 · Pruebas

```bash
bash scripts/verificar.sh
```

Build de Vite, las comprobaciones de Node, los casos de renderizado, las reglas invariantes y la aplicación de verdad en Chromium. La prueba en un navegador de verdad es `scripts/test-app-real.mjs`, y hay **30 recorridos integrales** declarados.

> ⚠️ Cada cambio en Estilo de hombre pasa por ahí ANTES de darse por hecho. Una fase sin su archivo de pruebas no está terminada.

## 15 · Historial de cambios

- **Dónde:** CHANGELOG.md, una entrada por fase, y `docs/02_ORDEN_DE_FASES.md`, una fila por versión.
- **Formato:** vX.Y.0 — EH Fase N/65: qué se construyó, qué se decidió y qué se encontró.

> ⚠️ Una fase sin entrada en el CHANGELOG no está terminada.

## 16 · 💡 Ideas futuras (backlog)

*El mismo `SE_POSPONE` de la F48. No hay una segunda lista.*

- **Un sistema de favoritos común a toda la aplicación** — Hoy cada módulo tiene los suyos. Unificarlos es una fase, no un arreglo (F39).
- **El puente entre una experiencia y el Diario** — Ninguna fase lo ha pedido todavía; la F47 lo declaró como lo que es.
- **Detectar conflictos entre dispositivos** — Exige versión o marca de tiempo en `app_data`: es una decisión de esquema (F41, F45 y F46).
- **Un catálogo de productos de verdad** — D2-03: arquitectura sí, catálogo no. Entra el día que Josué dé los datos.
- **Los sonidos de Estilo de hombre** — El motor está entero; faltan los archivos, que dará Josué (C-23).

## 17 · Regla para Claude

> 🚨 **Antes de modificar Estilo de hombre: leer `docs/08_ESTILO_DE_HOMBRE_TECNICO.md` y comprobar las dependencias globales. Si el dato ya vive fuera, se consulta; no se copia.**

Es decir: antes de tocar nada, leer `docs/08_ESTILO_DE_HOMBRE_TECNICO.md`.

## 18 · Manual de mantenimiento

### ¿Qué hago si falla una migración?

Nada a mano. `migrarEstiloHombre` hace copia ANTES de tocar, y si algo revienta devuelve el estado original con `error`. Para volver atrás desde fuera: `restaurarCopia(copia)`.

*Dónde mirar: `src/lib/migracion.js`*

### ¿Qué hago si aparece un duplicado?

Mirar `SISTEMAS_REVISADOS` (F48): dice quién es el dueño de cada sistema. El duplicado se borra, no se sincroniza — dos sistemas que hacen lo mismo se separan solos con el tiempo.

*Dónde mirar: `src/lib/auditoriaFinal.js`*

### ¿Qué hago si se rompe una integración?

Buscarla en `DEPENDENCIAS_GLOBALES`: dice en qué archivo vive el puente. Si lo que falla es un dato, la regla es que Estilo de hombre guarda **el id**, no la copia: el arreglo casi siempre está al otro lado.

*Dónde mirar: `src/lib/documentacionEH.js`*

### ¿Qué pruebas ejecuto después de un cambio?

`bash scripts/verificar.sh`, entero. No la del archivo que tocaste: entero. Los tres fallos más caros de este proyecto los cazó una prueba de otro sitio.

*Dónde mirar: `scripts/verificar.sh`*

---

## Condición de finalización

> Quien vuelva dentro de meses debe poder entender: qué existe → dónde está → cómo funciona → con qué se conecta → qué no debe tocarse.

*Los 18 apartados del enunciado están contestados; 5 de ellos se derivan del código y no pueden quedarse viejos.*
