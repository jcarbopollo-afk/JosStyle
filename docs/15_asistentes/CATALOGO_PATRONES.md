# Catálogo de patrones

> Parte de [`../15_ASISTENTES_MAESTRO.md`](../15_ASISTENTES_MAESTRO.md).
> **Estado: 🟡 iniciado (Fase 0), con las fuentes verificadas en la Fase 1. NO está completo.**
> Contiene el método, la plantilla, el índice de fuentes de patrones ya existentes y **tres fichas
> completas** (las correlaciones), ya **contrastadas ejecutándolas** en la Fase 1. El catálogo
> exhaustivo es la **Fase 3** (por módulo) y la **Fase 4** (cruces).
>
> 🚨 **DA-09:** todo patrón de este catálogo se calcula y se redacta **sin inferencia generativa**.

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
ficha **existente** en la Fase 3. **Sus firmas y la forma de lo que devuelven se verificaron en la
Fase 1** (V1, y V2 ejecutándolas con datos vacíos para las principales): ver
[`INVENTARIO.md`](INVENTARIO.md) §7. ⚠️ Las de `insights.js`, `resumenPeriodico.js` y las demás
librerías **sin conectar** de Imagen personal (CX-13) existen y tienen pruebas, pero **ninguna
pantalla las usa**: sus fichas serán «existente, sin integrar».

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

**Resultado de la Fase 1** sobre los módulos que faltaban: **Salud física** tiene `salud.js` (estado
actual, aviso de registro, evolución del peso, lesiones); **Sueño** solo tiene presentación
(`ventanaDeDias`) y las correlaciones; **Economía** tiene `hucha.js`, pero el saldo y el mes se
calculan dentro de `FinanceView.jsx`; **Biblioteca** tiene búsqueda y organización, no análisis;
**Fe, Diario, Negocio y Bienestar digital no tienen motor**: sus fuentes de patrones habría que
crearlas.

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
| 12. Casos límite | ✅ **CX-10 resuelta (Fase 1, V3):** un registro de sueño lleva la fecha del día en que se apunta, y se apunta por la mañana (*«¿Has dormido siesta ayer?»*), así que «misma fecha» **sí es** la noche anterior. ⚠️ Se descuadra un día si se apunta al acostarse o pasada la medianoche siguiente. ❌ **CX-11 (V3):** cruza **cada registro de horas**, no cada día: tres asignaturas un día cuentan como tres días y la media sale por entrada (4 días y 1,5 h donde son 2 días y 3 h). ✅ **Corregido en la Fase 1B:** se suma por día antes de cruzar (`horasDeEstudioPorDia`). Pocos días → mucha varianza. Exámenes sesgan |
| 13. Privacidad | Solo datos del propio usuario; sin módulos privados |
| 14. Pruebas | ✅ `test-correlaciones-metricas.mjs` (Fase 1B): varias asignaturas el mismo día y en días distintos, grupos en el límite, horas rotas, sin datos |
| 15. Estado | **existente**, corregido en la Fase 1B (CX-11) |

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
| 12. Casos límite | ✅ **Verificado (Fase 1, V3):** `animo: null` cuenta como 0 y `animo` ausente da `NaN` (la tarjeta pintaría «NaN /5»). **Desde la pantalla no puede pasar**: el Diario pone 3 por defecto y guarda una entrada por día; solo con datos importados o corruptos, porque `diario` se carga sin normalizador. Fechas: lo mismo que PAT-X-001 (bien si el sueño se apunta por la mañana) |
| 13. Privacidad | ⚠️ **Lee el Diario**, que AXION aísla por defecto: un asistente que lo use necesita la decisión **P-06** |
| 14. Pruebas | `test-sueno-grafica` solo comprueba que devuelva un objeto. Faltan: ánimo vacío o ausente, límite de días |
| 15. Estado | **existente**, verificado en la Fase 1 (correcto con los datos que puede crear la pantalla) |

### PAT-X-003 · Entreno y ánimo

| Campo | Contenido |
|---|---|
| 1. Nombre y propósito | Comparar el ánimo los días con entreno y sin entreno. |
| 2. Módulos | Entrenamiento (Fitness y las fechas de la calistenia de antes, desde la Fase 1B), Diario |
| 3. Pregunta | ¿Los días que entreno me siento distinto? |
| 4. Datos y fuentes | `fitness.sesiones` completadas (por `id`) y `calistenia[habilidad].sesiones[].fecha` vía `fechasDeEntreno`; `diario.entradas[]` → `fecha`, `animo` (entero 1–5). `correlacionEntrenoAnimo({ fitness, calistenia }, entradasDiario)` (firma de la Fase 1B; antes `(calistenia, entradasDiario)`) |
| 5. Activación | Al pintar `StatsView` |
| 6. Ventana y frecuencia | Desde la Fase 1C: las semanas (lunes–domingo) con algún entrenamiento registrado, entre el primero y el último; en cada pintado |
| 7. Lógica | Junta las fechas con alguna sesión (sin duplicar); media de ánimo de las entradas de esos días frente al resto |
| 8. Mínimo | ≥ 3 días en cada grupo |
| 9. No activarse | Menos de 3 días en un grupo |
| 10. Respuesta | Dos medias y los días de cada grupo, qué semanas compara y cuántos días deja fuera; sin causalidad |
| 11. Ejemplo (FICTICIO) | Ánimo 4,2 con entreno (5 días) y 3,6 sin entreno (9 días) |
| 12. Casos límite | ❌ **CX-09 verificado (Fase 1, V3): error real.** Solo mira `calistenia`, que ya no se puede registrar (v3.158.0), y nunca `fitness.sesiones`. Con 5 entrenamientos de Fitness: «0 días con sesión». Con 3 sesiones viejas de calistenia en días de ánimo bajo: **ánimo 2,0 con entreno frente a 4,1 sin él, cuando la verdad era al revés**. Propuesta: fechas = unión de Fitness completadas y calistenia antigua (`INVENTARIO.md` §5.2). ✅ **Corregido en la Fase 1B (v3.159.0, DA-10):** días con entreno = Fitness completados + **fechas** de la calistenia de antes, cada día una vez, y solo desde el primer entrenamiento registrado. 🐛 **Fase 1C (DA-11):** dejar de registrar llenaba «sin entreno» con días de los que no se sabe nada (6 días con 4 frente a 134 con 3,1); ahora solo las semanas con algún entrenamiento, entre el primero y el último, y se dice cuántos días quedan fuera. ⚠️ Una semana entera de descanso de verdad también queda fuera |
| 13. Privacidad | Lee el Diario (P-06) |
| 14. Pruebas | ✅ `test-correlaciones-metricas.mjs` (Fase 1B): sesiones de Fitness del flujo real, mezcla con calistenia antigua, en curso, repetidas, sin datos, insuficientes, Diario vacío, ánimo vacío; y la sección «F1B» del recorrido. Fase 1C: `test-correcciones-1c.mjs` (registro interrumpido, hueco en medio, cola de la semana, registro constante, mínimo, ánimos inválidos, ids) y `.jsx` |
| 15. Estado | **existente**, corregido en la Fase 1B y en la 1C (CX-09) |
