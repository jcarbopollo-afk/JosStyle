# Fitness — informe de la auditoría final (Fase 8/8)

> Fecha: 2026-11-06. Rama `claude/fitness-rediseno` (worktree `/home/user/JosStyle-fitness`), **sin commit**: nada en
> `main`, nada desplegado, ni un SQL ejecutado ni un dato real tocado. El detalle de cada fase está en el documento
> maestro (§5.2–§5.7); aquí, solo lo auditado y su resultado.

## 1 · Las ocho fases, comprobadas en el código

| Fase | Qué se comprobó | Cómo | Resultado |
|---|---|---|---|
| 1 · Contexto | El documento maestro describe el código real (motores, archivos, decisiones). | Lectura contrastada con los archivos de §12 del maestro. | ✅ |
| 2 · Arquitectura | Modelo, ids estables, persistencia, migraciones M1 y M2, guardia de versión. | `test-persistencia-fitness`, `test-integracion-final-fitness` §16. | ✅ (sin garantía de servidor: PD-03) |
| 3 · Rutinas y plantillas | Ciclos de 1–30 días, descansos, activación única, edición, duplicado, papelera, 17 planes y 63 plantillas originales. | `test-rutinas-ciclicas`, `test-planes`, «FIT 3/8». | ✅ |
| 4 · Cumplimiento | Pendientes, caducidad por dos posteriores, descansos, una sesión por fecha, «Completar», descartar. | `test-cumplimiento-fitness`, integración §1–8, «FIT 4/8». | ✅ (una por fecha: solo en el cliente) |
| 5 · Progresión | Tres modos, interruptor por línea, comparación por plantilla y línea, medias repeticiones, `plan` ≠ `hecho`. | `test-progresion-fitness`, integración §9, «FIT 5/8». | ✅ |
| 6 · Anotaciones | Tres clases de nota, nota anterior por línea, historial, interrupción. | `test-anotaciones-fitness`, integración §10, «FIT 6/8». | ✅ |
| 7 · Historial y estadísticas | Fórmula, periodos, calendario, detalle, historial y evolución por plantilla. | `test-disciplina-fitness`, integración §11 y §13, «FIT 7/8». | ✅ |
| 8 · Integración | Calendario unificado, racha única, las siete juntas, móvil. | `test-integracion-final-fitness`, «FIT 8/8», `verificar.sh`. | Ver §4 |

## 2 · Integración entre sistemas (prompt 8 §4)

- **Una fuente por pregunta** (maestro §12): ninguna pantalla calcula un estado, un color, un porcentaje ni una racha.
- **Calendario**: el de Progreso se unificó con el de Historial; la ventana de 7 días de Tu Plan, el mes y la semana dicen
  lo mismo de cada día (comprobado).
- **Rachas**: la de Fitness y la global de entrenamiento son idénticas en los 50 días y patrones probados; la de sueño sale
  igual campo a campo; lo guardado de las rachas no cambia al mirarlas.
- **Recuperación e historial**: una recuperación conserva sus dos fechas, cuenta una vez y su día de descanso sale
  sacrificado.
- **Progresión y directo**: las propuestas van en `plan.propuesta`; lo hecho siempre manda; «Completar» no sirve de
  referencia.

## 3 · Datos e integridad (prompt 8 §5)

| Riesgo | Situación |
|---|---|
| Versiones | Versión 3. v1 → v3 conserva campos desconocidos; una versión más nueva no se migra y se abre en solo lectura. |
| Registros que la carga no entiende | Van a la cuarentena con su original; nunca se borran. |
| Sesiones antiguas o ambiguas | Se conservan; sin plantilla reconocible no se asignan a ninguna; antes del seguimiento, «sin seguimiento». |
| Datos derivados guardados | Ninguno: estados, porcentajes, rachas (también la proyectada) y calendario se calculan al leer. |
| Escrituras concurrentes (H-11) | ⚠️ Gana la última escritura del objeto entero. **Pendiente de autorización** (necesita SQL). |
| Una sesión por fecha en el servidor (PD-03) | ⚠️ Solo en el cliente. SQL preparado en `docs/15_FITNESS/sql/fitness_reserva_fechas.sql`, **sin ejecutar**. |

## 4 · Defectos encontrados y corregidos en la Fase 8

1. Un descanso sacrificado **hoy** no cortaba la racha global (el motor de rachas nunca da por perdido el día en curso).
   Corregido con `corta` en la regla `segun_fitness`; ninguna otra regla cambia.
2. La suite `scripts/test-integracion-fitness.mjs` (FIT F36) se pisó al crear la nueva con el mismo nombre. Restaurada de
   git; la nueva es `test-integracion-final-fitness.mjs`.
3. Comprobaciones que medían el calendario retirado (F31) se dieron la vuelta hacia el unificado; ninguna se borró y el
   banco de renderizado no bajó de 4324.

## 5 · Verificación

`bash scripts/verificar.sh` completo en verde (EXIT 0, «TODO CORRECTO»): Chromium 4075 ✓ / 0 ✗, renderizado 4324 ✓, `test-integracion-final-fitness` 52 ✓, «FIT 8/8» 26 ✓; unas 35 000 comprobaciones en total. Las suites de cada fase siguen activas (`test-rutinas-ciclicas`, `test-cumplimiento-fitness`, `test-progresion-fitness`, `test-anotaciones-fitness`, `test-disciplina-fitness` 81, `test-integracion-fitness` 148, `test-integracion-final-fitness` 52) y las de rachas (`test-rachas` 131, `test-rachas-servicio` 105, `test-rachas-hoy` 49, `test-rachas-gamificacion` 121, `test-habitos` 151). La pasada cruzó la medianoche y siguió en verde.

## 6 · Lo que no se ha podido comprobar aquí

- **En un iPhone de verdad** (R1): tacto, teclado, VoiceOver, el cambio de día a medianoche con la app abierta.
- **Con Supabase real**: sincronización entre dispositivos y la garantía de servidor (PD-03, H-11).
- **Decisiones provisionales de la Fase 4** que siguen esperando a Josué: PD-01, PD-02 y PD-08 (C-77).
