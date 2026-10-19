# Registro de decisiones — asistentes, patrones y planes

> Parte de [`../15_ASISTENTES_MAESTRO.md`](../15_ASISTENTES_MAESTRO.md). Tres listas:
> **DA-** decisiones, **P-** preguntas abiertas, **CX-** contradicciones.
> Las decisiones globales del proyecto (D2-…, C-…, DEP-…) siguen en `docs/03` y `CLAUDE.md`; aquí
> solo se **referencian**, no se copian.
>
> Estados: **propuesta · confirmada · aplazada · descartada**. Una decisión no se borra: si cambia,
> se marca y se añade la nueva (como hace `docs/03`).

---

## Decisiones (DA-)

| ID | Fecha | Decisión | Por qué | Estado | Afecta a | Consecuencias / pendiente |
|---|---|---|---|---|---|---|
| **DA-01** | 2026-10-19 | Orden: (1) app personal estable → (2) diseñar asistentes por reglas → (3) construirlos → (4) probar e integrar → (5) resto de la app → (6) IA libre → (7) comercialización. | Lo dijo Josué en la Fase maestra 0. | Confirmada | Maestro §1, §7 | Ninguna fase de IA libre ni de planes antes de su turno. |
| **DA-02** | 2026-10-19 | JosStyle es, por ahora, **de uso personal y gratuito**. Sin restricciones comerciales. | *«No quiero que la complejidad de convertir la aplicación en un producto comercial retrase el desarrollo actual.»* | Confirmada | Maestro §1 | Lo personal (CX-06) no se generaliza todavía. |
| **DA-03** | 2026-10-19 | **Visión** de planes: Demo (gratis, limitado) · Pro (todos los apartados + asistentes; orientativo 5–10 €/mes) · Premium (Pro + IA libre). | Estrategia de Josué. | Confirmada **como propuesta futura** | Maestro §1, §7 | Precios, límites, consumo y forma de cobro: **sin decidir**. No se implementa nada. |
| **DA-04** | 2026-10-19 | El propietario tendrá **acceso completo sin pagar**. | Requisito de Josué. | Confirmada como requisito | Fase Final B | El mecanismo se diseña en su fase, **autorizado en el servidor**. No se da por hecho que baste un correo ni que haga falta otra contraseña. Nada de listas blancas o negras ahora. |
| **DA-05** | 2026-10-19 | La **IA generativa libre se desarrolla al final**; en la etapa personal, el propietario la prueba **gratis**, sin sistema de cobro. | Prioridad de Josué. | Confirmada | Fase Final A | Encaja con DEP-30/IA «al final» de `CLAUDE.md` y con el bloqueo de AXION (`docs/02` R10). |
| **DA-06** | 2026-10-19 | La inteligencia gratuita **por reglas no depende de una API generativa**. | Principio de la Fase maestra 0. | Confirmada | Capa 2 | Tensión con los `AIPanel` actuales, que sí usan la API (CX-05). |
| **DA-07** | 2026-10-19 | **Principios de diseño** de los asistentes: datos reales; reutilizar motores; deterministas y con pruebas; decir los límites cuando faltan datos; correlación ≠ causa; respuestas breves, prudentes y personalizadas con opción de ampliar; contextuales dentro de su módulo; el general cruza solo si está permitido y hace falta; **las áreas privadas conservan su protección**; lo proactivo es opcional y controlable; **nada importante sin confirmación**; la IA libre es una capa aparte; **una respuesta programada no se presenta como IA libre**; interfaz, animación y navegación con las convenciones de JosStyle (Motion System sellado). | Sección 6 del prompt de la Fase maestra 0. | Confirmada | Todo el sistema | Cada ficha de patrón se revisa contra esta lista en la Fase 6. |
| **DA-08** | 2026-10-19 | **El repositorio es la fuente de verdad**: maestro `docs/15_ASISTENTES_MAESTRO.md` + carpeta `docs/15_asistentes/`; el seguimiento se actualiza al cerrar cada fase. | *«No quiero que dependas de tu memoria conversacional.»* | Confirmada | Toda la documentación | Se sigue la convención numerada de `docs/` y se añade una fila en `docs/00_INDICE.md`. |

## Preguntas abiertas (P-) — necesarias antes de la Fase 2

Se formularon el 2026-10-19 y **no tienen respuesta todavía**. No se inventa ninguna.

| ID | Pregunta | Opciones planteadas | Bloquea |
|---|---|---|---|
| **P-01** | ¿Qué es un «asistente»? | a) uno por módulo · b) uno general desde 🔍 · c) los dos | Fase 2 |
| **P-02** | ¿Cómo se le habla? | a) preguntas preparadas · b) texto libre interpretado por reglas · c) las dos | Fases 2 y 5 |
| **P-03** | ¿Los asistentes del Pro usan IA o solo reglas? | solo reglas (DA-06) · reglas + IA para redactar | Fase 2, CX-05 |
| **P-04** | ¿Pueden hablar sin que se pregunte (resúmenes, avisos)? | sí, opcional · no | Fase 2, CX-04 |
| **P-05** | ¿Pueden ejecutar acciones (crear tarea, objetivo) con confirmación? | sí · solo informar | Fase 2 |
| **P-06** | ¿Pueden cruzar módulos? ¿Relación, Diario y perfil de piel siempre fuera? ¿algún otro? | — | Fase 4, CX-02 |
| **P-07** | ¿Memoria? | a) ninguna · b) historial visible y borrable · c) + preferencias aprendidas editables | Fase 2 |
| **P-08** | ¿Qué 3–5 módulos primero? | Con motor ya: Nutrición, Fitness, Sueño, Estudios, Imagen personal, Horario, Productividad | Fase 3 (orden) |
| **P-09** | ¿Tono? | el actual: prudente y directo, 3–4 frases, citando el dato · otro | Fase 5 |
| **P-10** | IA del propietario en la etapa personal: ¿clave puesta en Vercel? ¿tope de gasto o de preguntas? | — | Final A (y uso actual de los `AIPanel`) |

### Aplazadas hasta la comercialización (no hace falta contestarlas ahora)

Qué apartados son Demo · qué incluye exactamente Pro · precios · forma de cobro (web, App Store…) ·
modelo de consumo de Premium · mecanismo de propietario/cuentas autorizadas · generalizar lo personal
(nombre, edad, reglas pensadas para un chico de 16 años) · privacidad, condiciones y protección de
datos para terceros · **la edad del propietario y la titularidad de los cobros** (probablemente haga
falta un adulto; hay que comprobarlo) · límites por usuario persistentes en la base de datos (SQL).

## Contradicciones y dudas (CX-)

| ID | Qué choca | Detalle | Estado |
|---|---|---|---|
| **CX-01** | Regla 8 de `CLAUDE.md` («nada de próximamente») ↔ P3 (`IAProximamente` dice «Estará disponible próximamente») | La P3 lo pidió Josué expresamente, así que hoy manda la P3. | Anotada; conviene registrarla también en `docs/03` cuando se autorice tocarlo |
| **CX-02** | AXION aísla Diario y Relaciones **por defecto** ↔ el **panel del Diario** y el **buscador 🔍** (que pasa `currentState` entero, Diario y Fe incluidos) ya los mandan a la IA a un toque | Relación sí está fuera de `currentState` (`App.jsx`). El perfil de piel no viaja (EH F13/F43/F56). | Abierta → P-06 |
| **CX-03** | D2-02 (no gamificar fuera de Sonido/Rachas) ↔ posibles «créditos» de IA en Premium | Si existen, tendrán que ser consumo, nunca premio. | Aplazada (comercialización) |
| **CX-04** | Regla 7 (la IA nunca se dispara sola) ↔ resúmenes/avisos proactivos | Lectura propuesta: lo proactivo serían **reglas**, opcional y apagado por defecto (como `avisosEstilo`); la IA generativa sigue solo a un toque. | Propuesta → P-04 |
| **CX-05** | DA-06 (lo gratuito no depende de la API) ↔ los 12 `AIPanel` (13 hasta la v3.158.0, que retiró el de calistenia), el buscador y las sugerencias, que **sí** usan la API | ¿Se quedan como están en la etapa personal? ¿Pasan a Premium? ¿Se sustituyen por la capa 2? | Abierta → P-03 |
| **CX-06** | `AI_SYSTEM` y unos 189 archivos de `src/` nombran a Josué; reglas pensadas para 16 años | Correcto ahora (DA-02); bloqueante el día que haya otros usuarios. | Aplazada |
| **CX-07** | El texto literal de AXION no está en el repositorio | `docs/01` §10.1: «nunca construir solo desde el resumen». | Aplazada (Final A) — Josué tendrá que volver a pasarlo |
| **CX-08** | El límite de la IA vive en memoria del servidor | No sirve para cobrar ni para un tope de gasto fiable. | Aplazada (Final A/B) |
| **CX-09** | `correlacionEntrenoAnimo` lee `calistenia` (sistema anterior) y no `fitness.sesiones` (Entrega 4) | Puede estar dando «sin datos» con entrenamientos registrados en Fitness. **No verificado**. | Por verificar en la Fase 1 |
| **CX-10** | `correlacionSuenoEstudio` dice comparar con «la noche anterior» y cruza por **la misma fecha** | Depende de qué fecha guarda un registro de sueño (`crearRegistroSueno`). **No verificado**. | Por verificar en la Fase 1 |
