# Catálogo de patrones

> Parte de [`../15_ASISTENTES_MAESTRO.md`](../15_ASISTENTES_MAESTRO.md).
> **Estado: 🟡 iniciado (Fase 0). NO está completo.** Contiene el método, la plantilla, el índice de
> fuentes de patrones ya existentes y **tres fichas completas** (las correlaciones, leídas línea a
> línea en `src/lib/correlaciones.js`) como ejemplo del nivel exigido. El catálogo exhaustivo es la
> **Fase 3** (por módulo) y la **Fase 4** (cruces).

---

## 1. Identificadores y estados

- **ID:** `PAT-<MÓDULO>-<NNN>` (p. ej. `PAT-NUT-004`); los cruces entre módulos, `PAT-X-<NNN>`.
  Un ID **no se reutiliza nunca**: un patrón descartado conserva el suyo.
- **Estados** (los del prompt de la Fase 0):
  - **existente** — está en el código; la ficha describe lo que hace hoy.
  - **verificado** — existente **y** su ficha se ha contrastado con sus pruebas (o se han escrito).
  - **diseñado** — ficha completa, sin código.
  - **pendiente** — idea con fuente de datos real localizada, ficha sin terminar.
  - **descartado** — con su motivo (datos que no existen, choca con una regla, no aporta).

## 2. Método (cómo se descubren y se documentan)

1. **Partir de los datos, no de la idea.** Para cada módulo, la Fase 1 lista sus claves de
   `app_data`, sus campos y qué significa `null` en cada uno. Un patrón que necesite un dato que no
   se guarda se **descarta** o se apunta como dependencia, nunca se inventa.
2. **Partir de los motores.** Cada función de análisis existente (catálogo de asistentes §2) genera
   como mínimo una ficha **existente**. Antes de diseñar uno nuevo, comprobar que no lo calcula ya
   otro motor (DA-07: reutilizar).
3. **Ficha completa de 15 campos** (plantilla §3). Sin los campos 7–9 (lógica, mínimos, cuándo no
   activarse) un patrón no pasa de **pendiente**.
4. **Contraste con las reglas del proyecto:** regla 7 (nada de objetivos calóricos o de peso
   estrictos, la IA no se dispara sola), regla 8 (ni cifras inventadas), D2-02 (sin gamificación),
   privacidad (regla 6, `CAMPOS_PRIVADOS`, P-06), «correlación ≠ causa» y «`null` no es cero».
5. **Pruebas definidas** antes de pasar a **diseñado**: un caso normal, el mínimo de datos justo por
   debajo y justo por encima, datos corruptos y el falso positivo más probable.
6. **Al cerrar cada lote, actualizar** [`SEGUIMIENTO.md`](SEGUIMIENTO.md).

## 3. Plantilla de ficha

```
### PAT-XXX-NNN · Nombre
| Campo | Contenido |
|---|---|
| 1. Nombre y propósito | |
| 2. Módulos | |
| 3. Pregunta que resuelve | |
| 4. Datos y fuentes reales | clave de app_data → campo; función que lo lee |
| 5. Condiciones de activación | |
| 6. Ventana y frecuencia | |
| 7. Cálculo / umbral / lógica | |
| 8. Mínimo de datos | |
| 9. Cuándo NO debe activarse | |
| 10. Respuesta esperada | |
| 11. Ejemplo (datos FICTICIOS) | |
| 12. Casos límite y falsos positivos | |
| 13. Privacidad y seguridad | |
| 14. Pruebas necesarias | |
| 15. Estado | existente · verificado · diseñado · pendiente · descartado |
```

## 4. Índice de fuentes de patrones ya existentes (fichas pendientes)

Cada línea es una función de análisis **localizada en el código** el 2026-10-19 que dará al menos una
ficha **existente** en la Fase 3. Las firmas y la forma de lo que devuelven **no están verificadas**
todavía (salvo `correlaciones.js`).

| Fuente | Funciones | Ficha futura |
|---|---|---|
| `predicciones.js` | `prediccionObjetivo`, `prediccionAbandonoHabito`, `prediccionPeso`, `prediccionFuerza`, `prediccionAhorro`, `prediccionNotas` | PAT-OBJ, PAT-PRO, PAT-SAL, PAT-FIT, PAT-ECO, PAT-EST (⚠️ `prediccionPeso` choca con la regla 7: revisar) |
| `inteligenciaNutricion.js` | `analisisProteinaInteligente`, `analisisCaloriasInteligente`, `regularidad`, niveles de confianza | PAT-NUT |
| `aguaNutricion.js` | objetivo de agua y su propuesta (P2) | PAT-NUT |
| `actividadEntrenamiento.js` | `adherenciaDelPlan`, `entrenamientosEnPeriodo`, estados de actividad | PAT-FIT |
| `progresion.js` / `progresoMuscular.js` / `motorRangos.js` | progresión comparable, voto muscular, rango y confianza | PAT-FIT |
| `integracionPR.js` | `resumenDelDia`, `queMeQueda`, prioridades, cadenas objetivo→meta→tarea | PAT-PRO |
| `rachas.js` | rachas derivadas del historial | PAT-PRO |
| `estadisticasPlan.js` | cumplimiento por día y periodo | PAT-CAL |
| `puntuacion.js` | `puntuacionDelDia`, `mensajePuntuacion` | PAT-CAL |
| `automatizaciones.js`, `analiticaHorario.js` | estados temporales, disparadores y analítica del horario | PAT-HOR |
| `armarioInteligencia.js` | estadísticas, repetición de outfit, diversidad | PAT-ARM |
| `motorRecomendaciones.js` + `recomendacionesPelo/Piel/Perfumes.js` | reglas con `requiere` | PAT-IMG |
| `insights.js`, `ideasEstilo.js`, `resumenPeriodico.js` | insights por periodo, ideas cruzadas, resumen | PAT-IMG |
| `avisosPlanificacion/Horario/Estilo.js` | qué se avisa y cuándo | patrones **proactivos** (P-04) |

Módulos **sin motor de análisis localizado** todavía (se mira en la Fase 1): Salud física, Sueño
(más allá de las correlaciones), Economía (más allá de `hucha.js`), Fe, Negocio, Biblioteca, Diario,
Bienestar digital.

## 5. Fichas completas

### PAT-X-001 · Sueño y horas de estudio

| Campo | Contenido |
|---|---|
| 1. Nombre y propósito | Comparar cuánto estudia los días que duerme ≥ 7 h y los que duerme menos. |
| 2. Módulos | Sueño, Estudios |
| 3. Pregunta | ¿Estudio más cuando duermo bien? |
| 4. Datos y fuentes | `sueno[]` → `fecha`, `horaDormir`, `horaDespertar` (duración con `calcularDuracion`); `estudios.horas[]` → `fecha`, `horas`. Función: `correlacionSuenoEstudio(sueno, horas)` |
| 5. Activación | Se calcula al pintar `StatsView` y el bloque de Estudios; enseña lectura solo si `suficientesDatos` |
| 6. Ventana y frecuencia | Todo el historial; en cada pintado (no se guarda) |
| 7. Lógica | Cruza **por la misma fecha** (`cruzarPorFecha`); separa días con sueño ≥ 7 h y < 7 h; media de horas de estudio de cada grupo, redondeada a 1 decimal. Descarta sueños sin duración válida (`null < 7` sería verdad) |
| 8. Mínimo | ≥ 2 días en cada grupo |
| 9. No activarse | Con menos de 2 días en algún grupo; sin registros de estudio ese día |
| 10. Respuesta | Dos medias y cuántos días hay en cada grupo; nunca «dormir más te hace estudiar más» |
| 11. Ejemplo (FICTICIO) | 3 días ≥ 7 h con 2,5 h de estudio de media; 2 días < 7 h con 1 h de media |
| 12. Casos límite | ⚠️ **CX-10**: el comentario habla de «la noche anterior» y el código cruza la misma fecha; depende de qué fecha guarda un registro de sueño. Pocos días → mucha varianza. Exámenes (estudio forzado) sesgan |
| 13. Privacidad | Solo datos del propio usuario; sin módulos privados |
| 14. Pruebas | Existe cobertura indirecta (`test-sueno-grafica`). Falta suite propia: grupos en el límite (1 y 2 días), sueño sin hora, fechas sin cruce, y aclarar CX-10 |
| 15. Estado | **existente** (no verificado: CX-10) |

### PAT-X-002 · Sueño y ánimo

| Campo | Contenido |
|---|---|
| 1. Nombre y propósito | Comparar el ánimo del Diario los días con sueño ≥ 7 h y < 7 h. |
| 2. Módulos | Sueño, Diario |
| 3. Pregunta | ¿Me siento mejor cuando duermo bien? |
| 4. Datos y fuentes | `sueno[]` (duración); `diario.entradas[]` → `fecha`, `animo`. `correlacionSuenoAnimo(sueno, entradasDiario)` |
| 5. Activación | Al pintar `StatsView`; lectura solo con `suficientesDatos` |
| 6. Ventana y frecuencia | Todo el historial; en cada pintado |
| 7. Lógica | Igual que PAT-X-001, con `Number(e.animo)` como valor |
| 8. Mínimo | ≥ 2 días en cada grupo |
| 9. No activarse | Sin entradas de Diario con ánimo; menos de 2 días en un grupo |
| 10. Respuesta | Medias de ánimo por grupo y días; sin causalidad |
| 11. Ejemplo (FICTICIO) | Ánimo medio 4,0 con ≥ 7 h (4 días) y 3,1 con < 7 h (3 días) |
| 12. Casos límite | `Number(null)` es 0: una entrada sin ánimo puede contar como 0 (**por verificar** en la Fase 1); mismo problema de fechas que CX-10 |
| 13. Privacidad | ⚠️ **Lee el Diario**, que AXION aísla por defecto: un asistente que lo use necesita la decisión **P-06** |
| 14. Pruebas | Sin suite propia localizada. Faltan: ánimo vacío, límite de días, fechas |
| 15. Estado | **existente** (no verificado) |

### PAT-X-003 · Entreno y ánimo

| Campo | Contenido |
|---|---|
| 1. Nombre y propósito | Comparar el ánimo los días con entreno y sin entreno. |
| 2. Módulos | Entrenamiento (calistenia), Diario |
| 3. Pregunta | ¿Los días que entreno me siento distinto? |
| 4. Datos y fuentes | `calistenia[habilidad].sesiones[].fecha`; `diario.entradas[]` → `fecha`, `animo`. `correlacionEntrenoAnimo(calistenia, entradasDiario)` |
| 5. Activación | Al pintar `StatsView` |
| 6. Ventana y frecuencia | Todo el historial; en cada pintado |
| 7. Lógica | Junta las fechas con alguna sesión (sin duplicar); media de ánimo de las entradas de esos días frente al resto |
| 8. Mínimo | ≥ 3 días en cada grupo |
| 9. No activarse | Menos de 3 días en un grupo |
| 10. Respuesta | Dos medias y los días de cada grupo; sin causalidad |
| 11. Ejemplo (FICTICIO) | Ánimo 4,2 con entreno (5 días) y 3,6 sin entreno (9 días) |
| 12. Casos límite | ⚠️ **CX-09**: solo mira `calistenia`, no `fitness.sesiones` (Entrega 4); con los entrenamientos de Fitness podría decir que no hay datos. Mismo `Number(null)` que PAT-X-002 |
| 13. Privacidad | Lee el Diario (P-06) |
| 14. Pruebas | Sin suite propia. Faltan: sesiones de Fitness, días duplicados, ánimo vacío |
| 15. Estado | **existente** (no verificado: CX-09) |
