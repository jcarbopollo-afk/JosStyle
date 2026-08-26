# JosStyle — CHECKLIST GLOBAL · ENTREGA 2 (7 MÓDULOS NUEVOS, 106 FASES)

> **Qué es esto.** El desglose verificable de la segunda tanda de especificaciones que Josué ha
> entregado: un único documento de **953 KB / 50 016 líneas** que contiene **siete
> especificaciones de módulo independientes**, con **106 fases** en total.
>
> **Estado: 19 de las 106 fases construidas y verificadas** — ME 4/4, BI 4/4, **AR 4/4 (cerrado)**
> y FO 7/12 (hasta v1.42.0). Quedan **87**. Cada fase completada lleva su marca `✅ COMPLETADA (vX.Y.0)` en su
> encabezado, y ninguna casilla se marca sin estar implementada, comprobada y sin romper nada.
>
> **Fuente:** `especificaciones/` — transcripción íntegra, dividida por módulo, más el archivo
> original sin tocar en `especificaciones/ORIGINAL_JC_FITNESS_ESTILO_DE_HOMBRE.txt`.
>
> **Leyenda:** `[ ]` pendiente · `[x]` construido y verificado en código · `[~]` parcial ·
> `[-]` descartado o imposible · `[?]` construido sin verificar en ejecución real.

---

## Cómo leer esta checklist

Cada casilla corresponde a un **apartado numerado** de la especificación original. Las casillas se
han extraído automáticamente del texto y **conservan su redacción literal**, así que algunas son
títulos de bloque ("PRUEBAS OBLIGATORIAS") y otras son requisitos concretos ("Desactivar un módulo
NO elimine sus datos"). Ambas cosas son verificables.

⚠️ **Una casilla marcada no significa "he leído el apartado", significa "está implementado,
comprobado y no rompe nada anterior".** Antes de marcar cualquier casilla hay que **leer la fase
completa en `especificaciones/`** — la checklist es el índice, no la especificación.

---

## Los 7 módulos, de un vistazo

| Cód. | Módulo | Fases | Líneas | Especificación | Naturaleza |
|---|---|---|---|---|---|
| **EH** | **Estilo de Hombre** | 65 | 19 527 | `ESPECIFICACION_ESTILO_DE_HOMBRE.md` | Módulo nuevo enorme: central de salud, cuidado, bienestar y estilo masculino |
| **FO** | **Fondos y Fotografías** (Aspecto) | 12 | 5 967 | `ESPECIFICACION_FONDOS_Y_FOTOGRAFIAS.md` | Amplía el sistema de apariencia existente con fondos fotográficos y color derivado de la foto |
| **BI** | **Buscador global + IA + Inicio** | 4 | 1 668 | `ESPECIFICACION_BUSCADOR_E_IA.md` | Rediseña el desplegable de Inicio y convierte el botón superior izquierdo en buscador + IA |
| **ME** | **Módulos activables + Eliminados** | 4 | 1 008 | `ESPECIFICACION_MODULOS_Y_ELIMINADOS.md` | Libertad total de apartados + papelera universal con recuperación |
| **HT** | **Horario Top** | 12 | 11 601 | `ESPECIFICACION_HORARIO_TOP.md` | Motor temporal y de planificación: horario, HOY, mochila, planificador, analítica |
| **AR** | **Armario JC Lifestyle** | 4 | 3 747 | `ESPECIFICACION_ARMARIO.md` | Armario digital, outfits, historial de uso y sistema anti-repetición |
| **SR** | **Sonido y Rachas** | 5 + 4 | 6 498 | `ESPECIFICACION_SONIDO_Y_RACHAS.md` | Identidad sonora propia + sistema de rachas reutilizable |

**Total: 106 fases · 3 761 casillas verificables.**

---

## ⚠️ Cinco avisos antes de empezar a implementar

### 1. Esto no es una continuación del Prompt Maestro — es un proyecto varias veces mayor

Para dimensionarlo con honestidad: el Prompt Maestro completo (las 21 fases que construyeron
Dashboard, Sueño, Salud, Nutrición, Calistenia, Estudios, Negocio, Productividad, Objetivos, Diario,
Biblioteca, Relación, Fe, Bienestar, Estadísticas, Predicciones, IA y Personalización) cabía en
**~40 líneas de especificación**. Estas 106 fases ocupan **50 016**.

**Estilo de Hombre por sí solo (65 fases) es más grande que todo JC Fitness construido hasta hoy.**
No es una crítica a la ambición del proyecto — es el dato que hace falta para planificar. Ver
`docs/06_ENTREGA2_ANALISIS.md` para el análisis de viabilidad.

### 2. El documento original está en orden inverso y mezcla conversación con especificación

Dentro de cada módulo, **la última fase aparece primero** (Estilo de Hombre empieza por la Fase
65/65 y termina por la 1/65). Además hay fragmentos de conversación de Josué intercalados entre
fases, y algunas fases aparecen duplicadas o parcialmente repetidas.

Esta checklist ya está **reordenada ascendentemente** (Fase 1 → Fase N). La especificación original
se conserva tal cual, sin reordenar, porque reordenarla sería editarla.

### 3. El bloque SR mezcla DOS especificaciones con numeración solapada

`ESPECIFICACION_SONIDO_Y_RACHAS.md` contiene en realidad **dos sistemas distintos**:

- **Sistema de Sonido** — 5 fases (Base · Motor de sonido · Eventos/feedback/recompensas · Diseño de
  los sonidos · Producción/integración/test).
- **Sistema de Rachas** — 4 fases (Arquitectura y lógica · Base de datos/Supabase/seguridad ·
  Gamificación/hitos/logros · UI/Centro de rachas).

Sus números de fase **colisionan** ("Fase 2" existe en los dos), y en el documento original están
intercalados. La checklist los ha fusionado bajo el código `SR` porque no hay forma automática de
separarlos con certeza.

> **❓ Pregunta abierta para Josué:** ¿son dos módulos independientes que quieres construir por
> separado, o un único sistema "Sonido + Rachas" de 5 fases? **Antes de tocar este bloque hay que
> aclararlo** — construirlos mezclados sería un error caro de deshacer.

### 4. Hay solapamiento fuerte con lo que JC Fitness YA tiene

La propia especificación de Estilo de Hombre insiste en ello (sus apartados 4 y 5 son literalmente
*"JC Fitness ya tiene muchas funciones"* y *"regla absoluta contra duplicaciones"*). Los solapamientos
detectados están catalogados en `docs/06_ENTREGA2_ANALISIS.md`, pero los cuatro más grandes son:

| Especificación nueva | Ya existe en JC Fitness |
|---|---|
| **ME** · módulos activables + personalización | `PersonalizationView` + `personalizacion.ocultos` (Fase 19) |
| **BI** · buscador global + IA | `UniversalSearchModal` + `SuggestionsButton` (Fase 18) |
| **FO** · sistema de color derivado de foto | Motor de color completo `colorEngine.js` + `TemaBuilder` + `GestionTemas` (V1–V4) |
| **HT** · calendario, HOY, tareas, exámenes | Calendario Universal (C1–C3) + Productividad + Estudios + Dashboard Centro de Control |

🔒 **La regla es CONECTAR / INTEGRAR / REUTILIZAR antes que CREAR.** Está escrita por Josué en la
propia especificación. Implementar estos módulos ignorando lo que ya existe crearía sistemas
duplicados que después habría que fusionar.

### 5. Nada de lo construido hasta hoy está verificado en ejecución real

Las Fases 8–21 del Prompt Maestro y **todo** lo posterior (v1.1.0 → v1.22.0) siguen sin haberse
ejecutado nunca en un navegador. Añadir 106 fases encima de una base sin verificar multiplica el
riesgo: cuando algo falle, no se sabrá si el fallo es de lo nuevo o de lo que ya había.

> **Recomendación:** ejecutar el bloque **R0** (correcciones críticas) y al menos parte de **R1**
> (verificación real) de `docs/02_ORDEN_DE_FASES.md` **antes** de empezar la Entrega 2.

---

## Orden de ejecución propuesto para la Entrega 2

Este orden **no** es el orden en que aparecen en el documento. Está ordenado por **dependencia
técnica** y por **cuánto desbloquea cada módulo**:

```
E2-0  R0 + R1 de la Entrega 1        ← arreglar lo roto y verificar la base ANTES de añadir
E2-1  ME · Módulos activables + Eliminados (4)    ← la infraestructura que EH da por supuesta
E2-2  BI · Buscador + IA + Inicio (4)             ← amplía lo que ya existe, no lo duplica
E2-3  AR · Armario (4)                            ← EH lo da por construido ("NO rehacer el armario")
E2-4  FO · Fondos y Fotografías (12)              ← se apoya en el motor de color ya existente
E2-5  SR · Sonido y Rachas (5+4)   ⚠️ aclarar primero si son uno o dos módulos
E2-6  HT · Horario Top (12)                       ← el más acoplado al Calendario existente
E2-7  EH · Estilo de Hombre (65)                  ← el mayor; depende de casi todos los anteriores
```

**Por qué EH va el último aunque sea el que Josué entregó primero:** su propia especificación
declara que depende del armario ya construido (ap. 16), del sistema de fotos existente (ap. 17), del
calendario y recordatorios globales (ap. 11), del sistema de módulos activables (ap. 2) y del sistema
de productos transversal (ap. 10). Construirlo antes que sus dependencias obligaría a rehacerlo.

---

## Reglas transversales que TODAS estas fases comparten

Extraídas de los cuatro documentos de contexto general. Son de Josué, no interpretaciones:

1. **Una fase por turno.** No avanzar hasta que la anterior esté implementada, comprobada y
   funcionando. *(Se repite literalmente en los 4 contextos generales.)*
2. **Comprobar primero si JC Fitness ya lo tiene.** CONECTAR → INTEGRAR → REUTILIZAR → CREAR, en ese
   orden. Nunca duplicar por comodidad de implementación.
3. **Todo es modular y opcional.** El usuario decide qué usa. **Desactivar un módulo NUNCA elimina
   sus datos.**
4. **Interfaz limpia por fuera, compleja por dentro.** Plaquitas pequeñas en la pantalla principal;
   la complejidad vive dentro de cada módulo.
5. **La IA queda prácticamente fuera de Estilo de Hombre.** Las recomendaciones salen de datos,
   formularios, preferencias y reglas integradas — no de preguntarle a un modelo cada vez.
   *(En HT y BI la IA sí participa, pero siempre sobre datos reales y sin inventar.)*
6. **El usuario tiene el control.** Recomendar, nunca obligar. Poder elegir, rechazar, cambiar,
   ocultar, activar, desactivar.
7. **No preguntar dos veces lo mismo.** Lo que el usuario ya ha dicho se guarda y se reutiliza.
8. **Sistemas transversales únicos**: un solo sistema de productos, un solo calendario, un solo
   sistema de recordatorios, un solo sistema de fotos. Nunca uno por módulo.
9. **Nada de diagnósticos médicos automáticos.** Cuando algo requiera atención profesional, decirlo
   claramente.
10. **Funciones dependientes de wearables solo aparecen si hay dispositivo conectado.** Nunca datos
    inventados ni campos para simularlos.
11. **Móvil primero**, diseño premium, rápido y coherente con lo existente.
12. **No romper nada.** Cada fase deja el proyecto funcionando y preparado para la siguiente.
13. **No implementar fases futuras** aunque aparezcan mencionadas en el contexto general.
14. **Si una funcionalidad necesita arquitectura adicional, se construye esa arquitectura** — no se
    simplifica por comodidad *(regla explícita de HT)*.

---

## Peticiones sueltas detectadas fuera de las 106 fases

Al final del contexto de Estilo de Hombre hay una petición de Josué **que no está formalizada como
fase** y que conviene no perder:

- ⬜ **Rediseño de la pantalla de Inicio.** Literal: *"la veo muy cargada… quiero que la pantalla de
  inicio se pueda tocar un montón, poner la acción que quiera —por ejemplo un ingreso, un gasto, una
  fecha importante— y que se pueda quitar… que cada uno se ajuste la experiencia como la quiera"*.
  Marcado en el propio documento como **"ESTÀ EN CHAT Y ES REDISEÑAR PANTALLA DE INICIO"**.
  → Se solapa fuertemente con **BI · Fase 1** y con **ME · Fase 2**, y con el editor de
  `dashboardOcultos` ya pendiente (**R3.1** de la Entrega 1). **Unificar las cuatro cosas en una
  sola conversación antes de construir.**

---

# LAS 106 FASES


## EH · ESTILO DE HOMBRE — 65 fases

El módulo más grande de todo el proyecto. Una central personal de salud, cuidado, bienestar, físico y estilo masculino, completamente modular: el usuario elige qué apartados usa y el resto no ocupa espacio. **Fases 1–6** son la arquitectura base; **7–29** los módulos de contenido (pelo, peluquería, skincare, cuerpo, barba, manos, higiene bucal, perfumes, accesorios, gustos, objetivos, perfil de estilo); **30–39** organización, recomendaciones e integración; **40–55** calidad, rendimiento, datos y producción; **56–61** IA e insights; **62–65** accesibilidad, seguridad y cierre.

#### EH · Fase 1/65 — ARQUITECTURA BASE Y SISTEMA MODULAR
- [ ] Se pueda entrar en Estilo de hombre.
- [ ] Aparezca una pantalla inicial limpia.
- [ ] Se pueda configurar qué módulos quiere utilizar el usuario.
- [ ] Los módulos seleccionados aparezcan como plaquitas.
- [ ] Los módulos no seleccionados no ocupen espacio.
- [ ] Se puedan activar/desactivar posteriormente.
- [ ] Desactivar un módulo NO elimine sus datos.
- [ ] La configuración permanezca guardada.
- [ ] La arquitectura permita añadir decenas de módulos posteriormente sin rehacer este sistema.
- [ ] CREAR LA ESTRUCTURA PRINCIPAL
- [ ] PANTALLA PRINCIPAL
- [ ] PRIMERA CONFIGURACIÓN
- [ ] SELECCIÓN DE MÓDULOS
- [ ] PLAQUITAS
- [ ] GESTIONAR APARTADOS
- [ ] DESACTIVACIÓN
- [ ] DATOS Y CONFIGURACIÓN
- [ ] ORDEN DE LOS MÓDULOS
- [ ] Skincare
- [ ] Pelo
- [ ] Hábitos
- [ ] Fitness
- [ ] CONEXIÓN CON JC FITNESS
- [ ] SISTEMA PREPARADO PARA CRECER
- [ ] RESPONSIVE
- [ ] ESTADOS VACÍOS
- [ ] NO IMPLEMENTAR TODAVÍA
- [ ] PRUEBAS OBLIGATORIAS
- [ ] OBJETIVO GENERAL
- [ ] PRINCIPIO FUNDAMENTAL: TODO ES MODULAR
- [ ] INTERFAZ: PEQUEÑAS PLAQUITAS
- [ ] JC FITNESS YA TIENE MUCHAS FUNCIONES
- [ ] REGLA ABSOLUTA CONTRA DUPLICACIONES
- [ ] IA: PRÁCTICAMENTE FUERA DE ESTE APARTADO
- [ ] EL USUARIO TIENE EL CONTROL
- [ ] FORMULARIOS Y PREFERENCIAS
- [ ] SISTEMA DE RECOMENDACIONES
- [ ] SISTEMA DE PRODUCTOS
- [ ] CALENDARIO Y RECORDATORIOS
- [ ] EDUCACIÓN Y GUÍAS
- [ ] SALUD
- [ ] DISPOSITIVOS WEARABLES
- [ ] MÓDULOS ESPECIALMENTE IMPORTANTES
- [ ] ESTILO Y ARMARIO
- [ ] FOTOS
- [ ] PRIVACIDAD
- [ ] DESACTIVACIÓN DE MÓDULOS IMPORTANTES
- [ ] ARQUITECTURA DE DESARROLLO
- [ ] REGLA DE ORO DURANTE TODAS LAS FASES
- [ ] OBJETIVO FINAL

#### EH · Fase 2/65 — SISTEMA DE GESTIÓN Y PERSONALIZACIÓN DE MÓDULOS
- [ ] ACCESO A “GESTIONAR APARTADOS”
- [ ] LISTADO COMPLETO
- [ ] AGRUPACIÓN
- [ ] ACTIVAR UN MÓDULO
- [ ] El módulo pasa a estar activo.
- [ ] Aparece en la pantalla principal.
- [ ] Se guarda automáticamente.
- [ ] No es necesario volver a realizar la configuración inicial.
- [ ] DESACTIVAR UN MÓDULO
- [ ] AVISO AL DESACTIVAR
- [ ] REACTIVACIÓN
- [ ] FILTRO DE MÓDULOS ACTIVOS
- [ ] REORDENACIÓN
- [ ] ESTADO VACÍO
- [ ] MÓDULOS RECOMENDADOS
- [ ] BÚSQUEDA DE MÓDULOS
- [ ] INFORMACIÓN DEL MÓDULO
- [ ] CONFIGURACIÓN PERSISTENTE
- [ ] NO CREAR BASES DE DATOS DUPLICADAS
- [ ] PREPARACIÓN PARA FUTUROS MÓDULOS
- [ ] CASOS LÍMITE
- [ ] PRUEBAS

#### EH · Fase 3/65 — SISTEMA DE PRIMERA CONFIGURACIÓN Y PERFIL DE USUARIO
- [ ] PRIMERA ENTRADA
- [ ] EXPLICACIÓN BREVE
- [ ] SELECCIÓN INICIAL
- [ ] CONTADOR
- [ ] PODER SALTAR
- [ ] NO PREGUNTAR LO QUE YA SABEMOS
- [ ] FORMULARIOS PROGRESIVOS
- [ ] CADA MÓDULO ES INDEPENDIENTE
- [ ] INFORMACIÓN OPCIONAL
- [ ] PREFERENCIAS
- [ ] REUTILIZACIÓN DE INFORMACIÓN
- [ ] MODIFICAR INFORMACIÓN
- [ ] COMPLETAR CONFIGURACIÓN
- [ ] CONFIGURACIÓN PARCIAL
- [ ] VOLVER A CONFIGURAR
- [ ] NO CREAR TODAVÍA LOS FORMULARIOS INTERNOS
- [ ] PRUEBAS

#### EH · Fase 4/65 — SISTEMA DE DATOS, PERFIL Y REUTILIZACIÓN GLOBAL
- [ ] CREAR UNA CAPA DE DATOS COMPARTIDOS
- [ ] COMPROBAR QUÉ EXISTE YA
- [ ] FUENTE ÚNICA DE VERDAD
- [ ] DATOS PROPIOS DE ESTILO DE HOMBRE
- [ ] PREFERENCIAS
- [ ] INFORMACIÓN DESCONOCIDA
- [ ] NO PREGUNTAR DOS VECES
- [ ] DATOS MODIFICABLES
- [ ] HISTORIAL CUANDO SEA NECESARIO
- [ ] FECHA DE ACTUALIZACIÓN
- [ ] CONSENTIMIENTO Y PRIVACIDAD
- [ ] ELIMINACIÓN
- [ ] DESACTIVAR NO ES ELIMINAR
- [ ] DEPENDENCIAS
- [ ] DATOS FALTANTES
- [ ] SINCRONIZACIÓN
- [ ] COMPATIBILIDAD FUTURA
- [ ] PRUEBAS

#### EH · Fase 5/65 — ESTILO + ARMARIO: INTEGRACIÓN CON EL SISTEMA EXISTENTE
- [ ] CONECTAR EL ARMARIO EXISTENTE
- [ ] MANTENER LOS DATOS EXISTENTES
- [ ] TALLAS
- [ ] INFORMACIÓN DEL PERFIL
- [ ] PREFERENCIAS DE ESTILO
- [ ] RECOMENDACIONES
- [ ] EL USUARIO DECIDE
- [ ] INFORMACIÓN FALTANTE
- [ ] ARMARIO COMO FUENTE DE INFORMACIÓN
- [ ] ACTIVACIÓN/DESACTIVACIÓN
- [ ] NO CREAR IA DE ESTILO
- [ ] CONEXIÓN FUTURA CON PRODUCTOS
- [ ] CONEXIÓN CON OCASIONES
- [ ] CONEXIÓN CON EL PERFIL FÍSICO
- [ ] PRUEBAS DE INTEGRACIÓN

#### EH · Fase 6/65 — PERFIL DE ESTILO Y PREFERENCIAS PERSONALES
- [ ] ACCESO
- [ ] PRIORIDADES
- [ ] COLORES
- [ ] MARCAS
- [ ] OCASIONES
- [ ] COSAS QUE LE GUSTAN
- [ ] COSAS QUE LE GUSTARÍA HACER
- [ ] IMAGEN PERSONAL
- [ ] NIVELES
- [ ] RECOMENDACIONES
- [ ] EL USUARIO SIEMPRE PUEDE CAMBIARLO
- [ ] NO OBLIGAR A COMPLETAR TODO
- [ ] CONEXIÓN CON EL ARMARIO
- [ ] PRIVACIDAD
- [ ] PRUEBAS

#### EH · Fase 7/65 — PELO: PERFIL CAPILAR Y NECESIDADES
- [ ] ENTRADA AL MÓDULO
- [ ] TIPO DE PELO
- [ ] GROSOR
- [ ] DENSIDAD
- [ ] LONGITUD ACTUAL
- [ ] CUERO CABELLUDO
- [ ] NECESIDADES
- [ ] PREFERENCIAS
- [ ] PEINADO
- [ ] TIEMPO DISPONIBLE
- [ ] PRODUCTOS
- [ ] BARBERÍA / PELUQUERÍA
- [ ] FRECUENCIA DE CORTE
- [ ] DATOS DESCONOCIDOS
- [ ] EDITAR INFORMACIÓN
- [ ] CONEXIÓN CON EL SISTEMA DE DATOS
- [ ] RECOMENDACIONES FUTURAS
- [ ] PRUEBAS

#### EH · Fase 8/65 — PELO: RUTINA, CUIDADOS Y SEGUIMIENTO
- [ ] PANEL PRINCIPAL DE PELO
- [ ] RUTINA CAPILAR
- [ ] CREAR UNA RUTINA
- [ ] FRECUENCIAS
- [ ] SIN RECORDATORIOS OBLIGATORIOS
- [ ] CHECKLIST
- [ ] NO CASTIGAR AL USUARIO
- [ ] HISTORIAL
- [ ] CAMBIOS
- [ ] FOTOS
- [ ] PRODUCTOS UTILIZADOS
- [ ] PRODUCTOS SIN REGISTRAR
- [ ] RECOMENDACIONES
- [ ] PERSONALIZACIÓN
- [ ] ACTIVAR/DESACTIVAR COMPONENTES
- [ ] DATOS CONSERVADOS
- [ ] INTEGRACIÓN CON CALENDARIO
- [ ] PRUEBAS

#### EH · Fase 9/65 — PELO: SISTEMA DE RECOMENDACIONES
- [ ] ZONA DE RECOMENDACIONES
- [ ] UTILIZAR TODA LA INFORMACIÓN DISPONIBLE
- [ ] REGLAS INTERNAS
- [ ] RECOMENDACIONES NO OBLIGATORIAS
- [ ] MOSTRAR EL MOTIVO
- [ ] NIVEL DE RECOMENDACIÓN
- [ ] CANTIDAD
- [ ] DESCARTAR
- [ ] GUARDAR
- [ ] NO MODIFICAR AUTOMÁTICAMENTE LA RUTINA
- [ ] PRODUCTOS
- [ ] INFORMACIÓN INSUFICIENTE
- [ ] ACTUALIZACIÓN
- [ ] EVITAR REPETICIONES
- [ ] CONEXIÓN CON EL RESTO DE ESTILO DE HOMBRE
- [ ] PRIVACIDAD
- [ ] PRUEBAS
- [ ] Usuario con perfil completo → recomendaciones personalizadas.
- [ ] Perfil incompleto → recomendaciones básicas.
- [ ] Cambiar tipo de pelo → recomendaciones actualizadas.
- [ ] Ignorar → no insistir inmediatamente.
- [ ] Guardar → aparece en guardados.
- [ ] Añadir recomendación a rutina → solo si el usuario lo confirma.
- [ ] Desactivar recomendaciones → desaparecen.
- [ ] Reactivar → configuración conservada.
- [ ] No utilizar IA.
- [ ] No crear datos duplicados.

#### EH · Fase 10/65 — PELO: PRODUCTOS, CATÁLOGO Y RECOMENDACIONES
- [ ] SECCIÓN DE PRODUCTOS
- [ ] CATEGORÍAS
- [ ] FICHA DE PRODUCTO
- [ ] PRODUCTOS RECOMENDADOS
- [ ] MOTIVO DE LA RECOMENDACIÓN
- [ ] COMPARAR
- [ ] FAVORITOS
- [ ] PRODUCTOS QUE YA UTILIZA
- [ ] AÑADIR PRODUCTO PERSONAL
- [ ] PRODUCTOS NO DISPONIBLES
- [ ] AMAZON
- [ ] AFILIACIÓN
- [ ] OTRAS TIENDAS
- [ ] PACKS
- [ ] PACK PERSONALIZADO
- [ ] Producto A
- [ ] Producto B
- [ ] Producto C
- [ ] PRECIO
- [ ] VALORACIÓN PERSONAL
- [ ] RECOMENDACIONES CONTROLADAS
- [ ] NO COMPRAR AUTOMÁTICAMENTE
- [ ] PRUEBAS

#### EH · Fase 11/65 — PELUQUERÍA: CALENDARIO Y SEGUIMIENTO DE CORTES
- [ ] PLAQUITA DE PELUQUERÍA
- [ ] REGISTRAR ÚLTIMO CORTE
- [ ] PRÓXIMO CORTE
- [ ] FRECUENCIA
- [ ] RECORDATORIOS
- [ ] CALENDARIO GENERAL
- [ ] CANCELAR / CAMBIAR
- [ ] REGISTRAR CORTE REALIZADO
- [ ] HISTORIAL
- [ ] NOTAS
- [ ] PREFERENCIAS DEL CORTE
- [ ] PELUQUERÍA / BARBERÍA
- [ ] RECORDATORIOS DESACTIVADOS
- [ ] DESACTIVAR PELUQUERÍA
- [ ] ELIMINAR EVENTO
- [ ] PRÓXIMO CORTE INTELIGENTE
- [ ] PRUEBAS
- [ ] Registrar último corte.
- [ ] Elegir próximo corte.
- [ ] Crear frecuencia.
- [ ] Modificar frecuencia.
- [ ] Crear recordatorio.
- [ ] Desactivar recordatorio.
- [ ] Marcar corte realizado.
- [ ] Ver historial.
- [ ] Editar evento.
- [ ] Eliminar evento.
- [ ] Integrarlo con calendario general.
- [ ] Desactivar Peluquería.
- [ ] Reactivarla.
- [ ] Confirmar que todos los datos permanecen.

#### EH · Fase 12/65 — PELUQUERÍA: CORTES, PREFERENCIAS Y RECOMENDACIONES
- [ ] PERFIL DE CORTE
- [ ] LONGITUD
- [ ] ESTILO DE CORTE
- [ ] CÓMO QUIERE PEINARLO
- [ ] TIEMPO PARA PEINARSE
- [ ] MANTENIMIENTO
- [ ] RECOMENDACIONES DE CORTE
- [ ] EXPLICACIÓN
- [ ] COMPARACIÓN
- [ ] FAVORITOS
- [ ] CORTE ACTUAL
- [ ] CORTE QUE QUIERE PROBAR
- [ ] HISTORIAL
- [ ] VALORACIÓN
- [ ] RECOMENDACIONES BASADAS EN HISTORIAL
- [ ] CONEXIÓN CON PELO
- [ ] CONEXIÓN CON ESTILO
- [ ] USUARIO SIEMPRE DECIDE
- [ ] PRUEBAS

#### EH · Fase 13/65 — SKINCARE: PERFIL DE PIEL Y CONFIGURACIÓN INICIAL
- [ ] ENTRADA A SKINCARE
- [ ] FORMULARIO
- [ ] TIPO DE PIEL
- [ ] NECESIDADES
- [ ] SENSIBILIDAD
- [ ] ZONAS
- [ ] OBJETIVO PRINCIPAL
- [ ] TIEMPO DISPONIBLE
- [ ] COMPLEJIDAD
- [ ] PRODUCTOS ACTUALES
- [ ] PREFERENCIAS DE PRODUCTOS
- [ ] PRESUPUESTO
- [ ] PROTECCIÓN SOLAR
- [ ] FORMULARIO ADAPTATIVO
- [ ] INFORMACIÓN EXISTENTE
- [ ] DATOS EDITABLES
- [ ] PRIVACIDAD
- [ ] PRUEBAS
- [ ] Usuario que completa todo.
- [ ] Usuario que responde parcialmente.
- [ ] Usuario que pulsa “No lo sé”.
- [ ] Usuario que salta el formulario.
- [ ] Usuario con información existente.
- [ ] Usuario sin productos.
- [ ] Usuario con productos.
- [ ] Cambiar preferencias.
- [ ] Cambiar nivel.
- [ ] Desactivar Skincare.
- [ ] Reactivar Skincare.
- [ ] Comprobar que no se pierde información.
- [ ] Probar móvil.

#### EH · Fase 14/65 — SKINCARE: RUTINAS Y CUIDADO DIARIO
- [ ] PANEL DE SKINCARE
- [ ] CREAR RUTINA
- [ ] Limpieza
- [ ] Hidratación
- [ ] Protección solar
- [ ] MAÑANA Y NOCHE
- [ ] PASOS
- [ ] ORDEN
- [ ] PRODUCTOS
- [ ] FRECUENCIA
- [ ] RECORDATORIOS
- [ ] CHECKLIST
- [ ] OMITIR PASOS
- [ ] CAMBIAR RUTINA
- [ ] RUTINAS PREDEFINIDAS
- [ ] PERSONALIZACIÓN
- [ ] NIVELES
- [ ] SEGUIMIENTO
- [ ] HISTORIAL
- [ ] CONEXIÓN CON CALENDARIO
- [ ] ACTIVAR/DESACTIVAR
- [ ] NO DUPLICAR
- [ ] PRUEBAS
- [ ] Crear rutina.
- [ ] Crear rutina mañana.
- [ ] Crear rutina noche.
- [ ] Añadir pasos.
- [ ] Cambiar orden.
- [ ] Asociar productos.
- [ ] Cambiar frecuencia.
- [ ] Activar/desactivar recordatorios.
- [ ] Marcar pasos.
- [ ] Omitir rutina.
- [ ] Editar rutina.
- [ ] Eliminar rutina.
- [ ] Consultar historial.
- [ ] Conectar con calendario.
- [ ] Desactivar módulo.
- [ ] Reactivarlo.
- [ ] Comprobar que no existen duplicados.

#### EH · Fase 15/65 — SKINCARE: SEGUIMIENTO Y EVOLUCIÓN
- [ ] PLAQUITA DE SEGUIMIENTO
- [ ] VALORACIÓN RÁPIDA
- [ ] ASPECTOS CONCRETOS
- [ ] NOTA PERSONAL
- [ ] REGISTRO DE PRODUCTOS
- [ ] CAMBIOS DE RUTINA
- [ ] EVOLUCIÓN
- [ ] PERIODOS
- [ ] NO OBLIGAR A REGISTRAR CADA DÍA
- [ ] FOTOS
- [ ] CONEXIÓN CON EL DIARIO
- [ ] CONEXIÓN CON PRODUCTOS
- [ ] ELIMINAR REGISTROS
- [ ] EXPORTACIÓN
- [ ] DESACTIVAR
- [ ] PRUEBAS
- [ ] Crear valoración.
- [ ] Editarla.
- [ ] Eliminarla.
- [ ] Añadir nota.
- [ ] Asociar producto.
- [ ] Registrar cambio de rutina.
- [ ] Consultar evolución.
- [ ] Cambiar periodo.
- [ ] Sin registros suficientes.
- [ ] Desactivar seguimiento.
- [ ] Reactivarlo.
- [ ] Comprobar que no se crea otro diario.
- [ ] Comprobar integración con eliminados recientemente.
- [ ] Comprobar móvil.

#### EH · Fase 16/65 — SKINCARE: MOTOR DE RECOMENDACIONES
- [ ] PLAQUITA
- [ ] PRIORIDADES
- [ ] REGLAS
- [ ] RECOMENDACIONES DE RUTINA
- [ ] RECOMENDACIONES DE PRODUCTOS
- [ ] EXPLICACIÓN
- [ ] NIVEL
- [ ] CANTIDAD
- [ ] DESCARTAR
- [ ] GUARDAR
- [ ] AÑADIR A RUTINA
- [ ] AÑADIR PRODUCTO
- [ ] INFORMACIÓN INSUFICIENTE
- [ ] ACTUALIZACIÓN
- [ ] HISTORIAL DE RECOMENDACIONES
- [ ] NO IA
- [ ] DESACTIVAR
- [ ] PRUEBAS

#### EH · Fase 17/65 — SKINCARE: SISTEMA DE PRODUCTOS, FARMACIA, AMAZON Y PACKS
- [ ] PLAQUITA DE PRODUCTOS
- [ ] CATEGORÍAS
- [ ] FICHA DEL PRODUCTO
- [ ] AMAZON
- [ ] FARMACIA
- [ ] SI NO ESTÁ EN AMAZON
- [ ] AFILIACIÓN
- [ ] PRODUCTOS RECOMENDADOS
- [ ] MOTIVO
- [ ] FILTROS
- [ ] BUSCADOR
- [ ] FAVORITOS
- [ ] PRODUCTOS QUE YA TIENE
- [ ] PRODUCTOS PERSONALIZADOS
- [ ] COMPARACIÓN
- [ ] PACKS
- [ ] PACK PERSONALIZADO
- [ ] ALTERNATIVAS
- [ ] PRECIO
- [ ] VALORACIÓN PERSONAL
- [ ] DESACTIVAR PRODUCTOS
- [ ] NO COMPRA AUTOMÁTICA
- [ ] PRUEBAS

#### EH · Fase 18/65 — CUERPO E HIGIENE MASCULINA: CONFIGURACIÓN Y PERFIL
- [ ] ACTIVACIÓN INICIAL
- [ ] FORMULARIO
- [ ] HIGIENE DIARIA
- [ ] PREFERENCIAS
- [ ] TIPO DE PRODUCTO
- [ ] FRAGANCIAS
- [ ] SENSIBILIDAD
- [ ] NECESIDADES ESPECÍFICAS
- [ ] TIEMPO
- [ ] NIVEL
- [ ] PRODUCTOS EXISTENTES
- [ ] RUTINAS
- [ ] RECORDATORIOS
- [ ] RECOMENDACIONES
- [ ] PRODUCTOS
- [ ] FARMACIA Y TIENDAS
- [ ] ACTIVAR Y DESACTIVAR CADA PARTE
- [ ] NO DUPLICAR CON OTROS MÓDULOS
- [ ] ELIMINACIÓN
- [ ] PRUEBAS
- [ ] Entrar sin configurar.
- [ ] Saltar formulario.
- [ ] Activar solo una sección.
- [ ] Activar varias.
- [ ] Desactivar una.
- [ ] Reactivarla.
- [ ] Crear rutina.
- [ ] Editarla.
- [ ] Asociar productos existentes.
- [ ] Añadir un producto nuevo.
- [ ] Activar/desactivar recordatorios.
- [ ] Ver recomendaciones.
- [ ] Utilizar productos de farmacia.
- [ ] Utilizar productos de Amazon.
- [ ] Comprobar que no existen catálogos duplicados.
- [ ] Comprobar que los datos permanecen al desactivar módulos.
- [ ] Probar todo en móvil.

#### EH · Fase 19/65 — CUERPO E HIGIENE: RUTINAS Y RECOMENDACIONES
- [ ] PLAQUITA «MI RUTINA»
- [ ] RUTINA BÁSICA
- [ ] RUTINAS PERSONALIZADAS
- [ ] PEQUEÑAS PLAQUITAS
- [ ] CHECKLIST
- [ ] FRECUENCIA
- [ ] RECORDATORIOS
- [ ] RECOMENDACIONES
- [ ] RECOMENDACIONES SEGÚN PERFIL
- [ ] RECOMENDACIONES DE PRODUCTOS
- [ ] PRODUCTOS QUE YA TIENE
- [ ] ALTERNATIVAS
- [ ] PACKS
- [ ] NIVEL
- [ ] EDITAR
- [ ] OMITIR
- [ ] DESACTIVAR
- [ ] CONEXIONES GLOBALES
- [ ] PRUEBAS
- [ ] Crear rutina.
- [ ] Usar plantilla.
- [ ] Personalizar plantilla.
- [ ] Crear desde cero.
- [ ] Añadir pasos.
- [ ] Reordenarlos.
- [ ] Asociar productos.
- [ ] Cambiar frecuencia.
- [ ] Activar/desactivar recordatorio.
- [ ] Marcar rutina.
- [ ] Omitir paso.
- [ ] Recibir recomendación.
- [ ] Ignorar recomendación.
- [ ] Guardar producto.
- [ ] Crear pack.
- [ ] Desactivar módulos.
- [ ] Reactivarlos.
- [ ] Comprobar persistencia.

#### EH · Fase 20/65 — BARBA Y AFEITADO: PERFIL Y CONFIGURACIÓN
- [ ] ACTIVACIÓN
- [ ] QUÉ UTILIZA
- [ ] TIPO DE BARBA
- [ ] LONGITUD
- [ ] ESTILO
- [ ] OBJETIVO
- [ ] AFEITADO
- [ ] FRECUENCIA
- [ ] PREFERENCIAS
- [ ] SENSIBILIDAD
- [ ] PROBLEMAS PERCIBIDOS
- [ ] PRODUCTOS ACTUALES
- [ ] NIVEL
- [ ] RUTINA
- [ ] RECORDATORIOS
- [ ] ACTIVAR/DESACTIVAR
- [ ] CONEXIONES
- [ ] PRUEBAS
- [ ] Activar módulo.
- [ ] Saltarlo.
- [ ] Elegir barba.
- [ ] Elegir afeitado.
- [ ] Configurar ambos.
- [ ] Editar preferencias.
- [ ] Añadir productos existentes.
- [ ] Crear rutina.
- [ ] Desactivar recordatorios.
- [ ] Desactivar módulo.
- [ ] Reactivarlo.
- [ ] Comprobar que todo sigue guardado.
- [ ] Comprobar que no existen datos duplicados.

#### EH · Fase 21/65 — BARBA Y AFEITADO: RUTINAS Y SEGUIMIENTO
- [ ] PLAQUITA «MI RUTINA»
- [ ] RUTINA DE AFEITADO
- [ ] Preparación.
- [ ] Afeitado.
- [ ] Limpieza.
- [ ] Cuidado posterior.
- [ ] RUTINA DE BARBA
- [ ] PERFILADO
- [ ] RUTINAS PERSONALIZADAS
- [ ] CHECKLIST
- [ ] OMITIR
- [ ] RECORDATORIOS
- [ ] SEGUIMIENTO
- [ ] VALORACIÓN DEL AFEITADO
- [ ] NOTAS
- [ ] HISTORIAL
- [ ] PRODUCTOS
- [ ] CALENDARIO
- [ ] RECOMENDACIONES BÁSICAS
- [ ] GUARDAR COMO FAVORITA
- [ ] DESACTIVAR SEGUIMIENTO
- [ ] DESACTIVAR TODO
- [ ] ELIMINAR
- [ ] PRUEBAS

#### EH · Fase 22/65 — MANOS, UÑAS Y PIES: CONFIGURACIÓN
- [ ] ACTIVACIÓN
- [ ] UÑAS
- [ ] LONGITUD
- [ ] MANOS
- [ ] PIES
- [ ] FRECUENCIA
- [ ] RECORDATORIOS
- [ ] RUTINAS
- [ ] CHECKLIST
- [ ] CALENDARIO
- [ ] PRODUCTOS
- [ ] SEGUIMIENTO
- [ ] NOTAS
- [ ] DESACTIVACIÓN INDIVIDUAL
- [ ] DATOS CONSERVADOS
- [ ] ELIMINADOS RECIENTEMENTE
- [ ] PRUEBAS
- [ ] Activar uñas.
- [ ] Activar manos.
- [ ] Activar pies.
- [ ] Activar solo una.
- [ ] Crear rutina.
- [ ] Configurar frecuencia.
- [ ] Crear recordatorio.
- [ ] Añadir producto.
- [ ] Registrar seguimiento.
- [ ] Editar.
- [ ] Eliminar.
- [ ] Recuperar.
- [ ] Desactivar individualmente.
- [ ] Reactivar.
- [ ] Comprobar que no existen duplicados.

#### EH · Fase 23/65 — HIGIENE BUCAL Y SONRISA
- [ ] ACTIVACIÓN
- [ ] HIGIENE DIARIA
- [ ] PRODUCTOS
- [ ] FRECUENCIA
- [ ] RECORDATORIOS
- [ ] CAMBIO DE CEPILLO
- [ ] REVISIONES DENTALES
- [ ] RECORDATORIO DE REVISIÓN
- [ ] SEGUIMIENTO
- [ ] RACHAS
- [ ] CONSEJOS
- [ ] PRODUCTOS RECOMENDADOS
- [ ] COMPRAS
- [ ] DESACTIVAR
- [ ] CALENDARIO
- [ ] ELIMINACIÓN
- [ ] PRUEBAS
- [ ] Activar higiene.
- [ ] Crear rutina.
- [ ] Editar pasos.
- [ ] Registrar productos.
- [ ] Programar cambio de cepillo.
- [ ] Crear revisión.
- [ ] Añadir recordatorio.
- [ ] Añadir evento al calendario.
- [ ] Activar/desactivar seguimiento.
- [ ] Utilizar rachas globales.
- [ ] Desactivar cada plaquita individualmente.
- [ ] Reactivar.
- [ ] Eliminar.
- [ ] Recuperar.
- [ ] Comprobar que no hay calendarios/productos/rachas duplicados.

#### EH · Fase 24/65 — PERFUMES Y FRAGANCIAS: PERFIL PERSONAL
- [ ] ACTIVACIÓN
- [ ] PERFIL DE FRAGANCIA
- [ ] AROMAS QUE NO LE GUSTAN
- [ ] INTENSIDAD
- [ ] DURACIÓN
- [ ] OCASIONES
- [ ] ESTACIONES
- [ ] PRESUPUESTO
- [ ] PERFUMES QUE YA TIENE
- [ ] FAVORITOS
- [ ] VALORACIÓN
- [ ] PERFUME ACTUAL
- [ ] PERFUME PARA CADA OCASIÓN
- [ ] PERFUMES QUE QUIERE PROBAR
- [ ] HISTORIAL
- [ ] RECOMENDACIONES
- [ ] PRODUCTOS
- [ ] DESACTIVACIÓN
- [ ] PRUEBAS
- [ ] Activar módulo.
- [ ] Configurar gustos.
- [ ] Configurar disgustos.
- [ ] Añadir perfume.
- [ ] Marcar favorito.
- [ ] Valorar.
- [ ] Asignar ocasión.
- [ ] Asignar temporada.
- [ ] Crear lista “Quiero probar”.
- [ ] Configurar perfume actual.
- [ ] Consultar historial.
- [ ] Ver recomendaciones.
- [ ] Desactivar partes.
- [ ] Reactivar.
- [ ] Comprobar que no se duplica el catálogo de productos.

#### EH · Fase 25/65 — PERFUMES: RECOMENDACIONES, OCASIONES Y COLECCIÓN
- [ ] PLAQUITA «MIS PERFUMES»
- [ ] AÑADIR PERFUME
- [ ] DISPONIBILIDAD
- [ ] PERFUME ACTIVO
- [ ] OCASIONES
- [ ] TEMPORADA
- [ ] RECOMENDACIÓN
- [ ] OTRA OPCIÓN
- [ ] COMPARACIÓN
- [ ] ROTACIÓN
- [ ] NO REPETIR
- [ ] PERFUMES FAVORITOS
- [ ] QUIERO PROBAR
- [ ] RECOMENDACIONES DE COMPRA
- [ ] ALTERNATIVAS
- [ ] HISTORIAL
- [ ] ESTADÍSTICAS
- [ ] DESACTIVACIÓN
- [ ] PRUEBAS
- [ ] Añadir perfume.
- [ ] Añadir manualmente.
- [ ] Marcar favorito.
- [ ] Seleccionar actual.
- [ ] Asignar ocasión.
- [ ] Asignar temporada.
- [ ] Recomendar.
- [ ] Pedir otra opción.
- [ ] Comparar.
- [ ] Activar rotación.
- [ ] Evitar repetición.
- [ ] Gestionar colección.
- [ ] Añadir “Quiero probar”.
- [ ] Ver alternativas.
- [ ] Consultar historial.
- [ ] Desactivar partes.
- [ ] Reactivar.
- [ ] Comprobar integración con catálogo global.

#### EH · Fase 26/65 — ACCESORIOS Y ESTILO PERSONAL
- [ ] ACTIVACIÓN
- [ ] QUÉ QUIERE GESTIONAR
- [ ] IMPORTANTE: CONEXIÓN CON ARMARIO
- [ ] AÑADIR ACCESORIO
- [ ] ESTILO
- [ ] OCASIONES
- [ ] FAVORITOS
- [ ] ACCESORIO ACTUAL
- [ ] COMBINACIONES
- [ ] RECOMENDACIONES
- [ ] QUÉ NO HACEMOS
- [ ] PRODUCTOS
- [ ] LISTA DE DESEADOS
- [ ] DESACTIVACIÓN INDIVIDUAL
- [ ] PRUEBAS
- [ ] Activar accesorios.
- [ ] Seleccionar categorías.
- [ ] Añadir accesorio.
- [ ] Editarlo.
- [ ] Añadir preferencias.
- [ ] Marcar favorito.
- [ ] Añadir a deseos.
- [ ] Asociarlo al catálogo.
- [ ] Comprobar duplicados con Armario.
- [ ] Desactivar una categoría.
- [ ] Reactivarla.
- [ ] Desactivar todo.
- [ ] Reactivar.
- [ ] Comprobar persistencia.
- [ ] Probar móvil.

#### EH · Fase 27/65 — GUSTOS, INTERESES Y COSAS QUE QUIERO HACER
- [ ] PLAQUITA PRINCIPAL
- [ ] CATEGORÍAS
- [ ] PRIORIDAD
- [ ] ESTADO
- [ ] FECHA
- [ ] LUGARES
- [ ] FAVORITOS
- [ ] NOTAS
- [ ] CONEXIÓN CON EL RESTO DE JC FITNESS
- [ ] EJEMPLO
- [ ] DESACTIVAR
- [ ] ELIMINAR
- [ ] PRUEBAS
- [ ] Añadir gusto.
- [ ] Editarlo.
- [ ] Eliminarlo.
- [ ] Recuperarlo.
- [ ] Añadir interés.
- [ ] Añadir algo que quiere hacer.
- [ ] Cambiar estado.
- [ ] Añadir fecha.
- [ ] Conectarlo con calendario.
- [ ] Añadir favorito.
- [ ] Añadir nota.
- [ ] Abrir nota extensa en Diario.
- [ ] Desactivar cada plaquita.
- [ ] Reactivar.
- [ ] Comprobar persistencia.

#### EH · Fase 28/65 — OBJETIVOS Y EXPERIENCIAS PERSONALES
- [ ] DESDE «QUIERO HACER»
- [ ] UTILIZAR OBJETIVOS GLOBAL
- [ ] INFORMACIÓN
- [ ] EXPERIENCIAS
- [ ] COMPLETADO
- [ ] DIARIO
- [ ] FOTOS
- [ ] CALENDARIO
- [ ] RECORDATORIOS
- [ ] PROGRESO
- [ ] FAVORITOS
- [ ] DESACTIVACIÓN
- [ ] ELIMINACIÓN
- [ ] PRUEBAS
- [ ] Crear “Quiero hacer”.
- [ ] Convertirlo en objetivo.
- [ ] Abrir Objetivos global.
- [ ] Añadir fecha.
- [ ] Añadir calendario.
- [ ] Crear recordatorio.
- [ ] Completar objetivo.
- [ ] Actualizar automáticamente “Ya lo hice”.
- [ ] Abrir Diario.
- [ ] Añadir fotos mediante sistema existente.
- [ ] Desactivar módulo.
- [ ] Reactivarlo.
- [ ] Comprobar que no se duplican objetivos, tareas, calendario, diario ni fotos.

#### EH · Fase 29/65 — PERFIL DE ESTILO PERSONAL
- [ ] PLAQUITA «MI ESTILO»
- [ ] PERFIL VISUAL
- [ ] PREFERENCIAS GENERALES
- [ ] COLORES
- [ ] ESTILO DE ROPA
- [ ] CUIDADO PERSONAL
- [ ] PERFUMES
- [ ] ACCESORIOS
- [ ] GUSTOS
- [ ] COMPLETAMENTE OPCIONAL
- [ ] PERSONALIZACIÓN
- [ ] ORDEN
- [ ] Skincare.
- [ ] Pelo.
- [ ] Perfumes.
- [ ] Barba.
- [ ] Armario.
- [ ] Accesorios.
- [ ] ESTADO DE CONFIGURACIÓN
- [ ] NO CREAR UN «TEST DE ESTILO»
- [ ] PRIVACIDAD Y CONTROL
- [ ] PRUEBAS
- [ ] Entrar sin datos.
- [ ] Entrar con un solo módulo.
- [ ] Activar varios.
- [ ] Mostrar resumen.
- [ ] Cambiar preferencias.
- [ ] Comprobar actualización automática.
- [ ] Reordenar plaquitas.
- [ ] Ocultar una.
- [ ] Reactivarla.
- [ ] Desactivar “Mi estilo”.
- [ ] Comprobar que los módulos originales siguen intactos.
- [ ] Verificar que no existen datos duplicados.

#### EH · Fase 30/65 — PANTALLA PRINCIPAL Y ORGANIZACIÓN
- [ ] CABECERA
- [ ] PLAQUITAS PRINCIPALES
- [ ] DISEÑO DE PLAQUITAS
- [ ] ESTADO
- [ ] ORDEN PERSONALIZABLE
- [ ] MENOS ES MÁS
- [ ] ACCESO RÁPIDO
- [ ] PERSONALIZACIÓN TOTAL
- [ ] REORDENAR
- [ ] ANIMACIONES
- [ ] VACÍO INICIAL
- [ ] PROGRESIVIDAD
- [ ] NO DUPLICAR INFORMACIÓN
- [ ] CONFIGURACIÓN GLOBAL
- [ ] ELIMINACIÓN
- [ ] PRUEBAS DE UX
- [ ] Usuario nuevo.
- [ ] Usuario con un módulo.
- [ ] Usuario con 5 módulos.
- [ ] Usuario con todos.
- [ ] Ocultar.
- [ ] Mostrar.
- [ ] Reordenar.
- [ ] Añadir.
- [ ] Quitar.
- [ ] Accesos rápidos.
- [ ] Modo oscuro.
- [ ] Pantallas pequeñas.
- [ ] Pantallas grandes.
- [ ] Rotación.
- [ ] Animaciones.
- [ ] Persistencia.

#### EH · Fase 31/65 — PERSONALIZACIÓN PROFUNDA DE LAS PLAQUITAS
- [ ] MODO «PERSONALIZAR»
- [ ] CADA PLAQUITA
- [ ] ARRASTRAR
- [ ] TAMAÑO
- [ ] CONTENIDO
- [ ] ACCESOS RÁPIDOS
- [ ] LÍMITE DE ACCESOS
- [ ] OCULTAR
- [ ] RECUPERAR
- [ ] RESTABLECER
- [ ] CONFIGURACIÓN POR USUARIO
- [ ] NO AFECTAR A OTROS MÓDULOS
- [ ] DATOS CONSERVADOS
- [ ] ANIMACIONES
- [ ] MÓVIL
- [ ] PREVENIR ERRORES
- [ ] PERSONALIZACIÓN RÁPIDA
- [ ] PRUEBAS
- [ ] Mover.
- [ ] Ocultar.
- [ ] Mostrar.
- [ ] Cambiar tamaño.
- [ ] Cambiar contenido.
- [ ] Crear acceso rápido.
- [ ] Eliminar acceso rápido.
- [ ] Restablecer.
- [ ] Salir y volver a entrar.
- [ ] Cerrar sesión y volver.
- [ ] Probar otro dispositivo.
- [ ] Modo oscuro.
- [ ] Pantalla pequeña.
- [ ] Comprobar que los datos internos no cambian.

#### EH · Fase 32/65 — RECOMENDACIONES GENERALES DE ESTILO
- [ ] PLAQUITA
- [ ] TIPO DE CONSEJO
- [ ] NO REPETIR
- [ ] ACCIONES
- [ ] FRECUENCIA
- [ ] CONSEJO EXPLICADO
- [ ] PERSONALIZACIÓN
- [ ] CONSEJOS SUBJETIVOS
- [ ] CONSEJOS DE PRODUCTOS
- [ ] CONSEJOS DE OUTFITS
- [ ] CONSEJOS DE RUTINA
- [ ] DIARIO
- [ ] GUARDAR CONSEJO
- [ ] OCULTAR SISTEMA
- [ ] PRIVACIDAD
- [ ] PRUEBAS
- [ ] Activar recomendaciones.
- [ ] Recibir sugerencia.
- [ ] Ver motivo.
- [ ] Marcar “me interesa”.
- [ ] Marcar “no me interesa”.
- [ ] Marcar “ya lo hago”.
- [ ] Guardar.
- [ ] Abrir módulo relacionado.
- [ ] Abrir Diario.
- [ ] Desactivar recomendaciones.
- [ ] Reactivarlas.
- [ ] Comprobar que no se repiten innecesariamente.
- [ ] Comprobar que no aparecen recomendaciones contradictorias.

#### EH · Fase 33/65 — DESCUBRIR E INSPIRACIÓN
- [ ] PLAQUITA «DESCUBRIR»
- [ ] QUÉ PUEDE DESCUBRIR
- [ ] TARJETAS PEQUEÑAS
- [ ] PERSONALIZACIÓN
- [ ] FILTROS
- [ ] GUARDAR
- [ ] ABRIR MÓDULO
- [ ] PRODUCTOS
- [ ] SIN COMPRAS FORZADAS
- [ ] FRECUENCIA
- [ ] OCULTAR
- [ ] CONTENIDO REPETIDO
- [ ] CONTENIDO SUBJETIVO
- [ ] SIN RED SOCIAL
- [ ] PRUEBAS
- [ ] Activar Descubrir.
- [ ] Mostrar tarjetas.
- [ ] Filtrar categorías.
- [ ] Guardar.
- [ ] Descartar.
- [ ] Abrir módulo.
- [ ] Abrir producto.
- [ ] Cambiar frecuencia.
- [ ] Ocultar.
- [ ] Reactivar.
- [ ] Comprobar que no aparecen categorías desactivadas.
- [ ] Comprobar que no se duplican favoritos ni productos.

#### EH · Fase 34/65 — PERFIL Y PREFERENCIAS AVANZADAS
- [ ] PLAQUITA «MIS PREFERENCIAS»
- [ ] CATEGORÍAS
- [ ] EDITAR
- [ ] RESUMEN
- [ ] INFORMACIÓN NO CONFIGURADA
- [ ] PREFERENCIAS UTILIZADAS
- [ ] CONTROL DE RECOMENDACIONES
- [ ] BORRAR UNA PREFERENCIA
- [ ] RESTABLECER CATEGORÍA
- [ ] BORRAR TODO ESTILO
- [ ] PRIVACIDAD
- [ ] DESACTIVACIÓN
- [ ] REACTIVACIÓN
- [ ] EXPORTACIÓN
- [ ] SIN DUPLICADOS
- [ ] PRUEBAS
- [ ] Ver preferencias.
- [ ] Editarlas.
- [ ] Eliminar una.
- [ ] Restablecer categoría.
- [ ] Desactivar recomendaciones.
- [ ] Ocultar módulo.
- [ ] Reactivar módulo.
- [ ] Eliminar datos.
- [ ] Exportar.
- [ ] Comprobar que no se modifican otros módulos.
- [ ] Comprobar que no existen duplicados.

#### EH · Fase 35/65 — ESTADÍSTICAS Y PROGRESO DE ESTILO
- [ ] PLAQUITA «PROGRESO»
- [ ] NO PUNTUAR AL USUARIO
- [ ] RESUMEN
- [ ] PERIODOS
- [ ] GRÁFICOS
- [ ] OBJETIVOS
- [ ] RACHAS
- [ ] COMPARACIONES
- [ ] DATOS INCOMPLETOS
- [ ] PERSONALIZACIÓN
- [ ] DESACTIVACIÓN
- [ ] HISTORIAL
- [ ] PRIVACIDAD
- [ ] PRUEBAS
- [ ] Registrar rutina.
- [ ] Registrar afeitado.
- [ ] Registrar perfume.
- [ ] Ver estadísticas.
- [ ] Cambiar periodo.
- [ ] Ocultar una métrica.
- [ ] Ocultar todo.
- [ ] Reactivar.
- [ ] Comprobar datos sin registros.
- [ ] Comprobar integración con rachas.
- [ ] Comprobar integración con objetivos.
- [ ] Verificar que las estadísticas no duplican datos.

#### EH · Fase 36/65 — GESTIÓN GLOBAL DE MÓDULOS
- [ ] CENTRO «GESTIONAR ESTILO»
- [ ] CADA MÓDULO
- [ ] OCULTAR
- [ ] DESACTIVAR
- [ ] ELIMINAR
- [ ] RECUPERACIÓN
- [ ] REACTIVAR
- [ ] RESTABLECER
- [ ] ACTIVACIÓN POR PARTES
- [ ] MÓDULOS OBLIGATORIOS
- [ ] DEPENDENCIAS
- [ ] NO BORRAR POR DESACTIVAR
- [ ] CONFIGURACIÓN POR DEFECTO
- [ ] BÚSQUEDA
- [ ] ORDEN
- [ ] INDICADOR DE ESTADO
- [ ] PRUEBAS CRÍTICAS
- [ ] Ocultar módulo.
- [ ] Volver a mostrarlo.
- [ ] Desactivarlo.
- [ ] Reactivarlo.
- [ ] Eliminarlo.
- [ ] Recuperarlo.
- [ ] Eliminarlo definitivamente.
- [ ] Restablecer diseño.
- [ ] Comprobar que los datos no se pierden al ocultar.
- [ ] Comprobar que no se pierden al desactivar.
- [ ] Comprobar dependencias.
- [ ] Comprobar móvil.
- [ ] Cerrar sesión.
- [ ] Volver a entrar.
- [ ] Comprobar persistencia.

#### EH · Fase 37/65 — BUSCADOR Y NAVEGACIÓN INTERNA
- [ ] BUSCADOR
- [ ] RESULTADOS AGRUPADOS
- [ ] BÚSQUEDA RÁPIDA
- [ ] SIN RESULTADOS
- [ ] ACCESOS RECIENTES
- [ ] FAVORITOS
- [ ] NAVEGACIÓN INTERNA
- [ ] BREADCRUMBS MÓVILES
- [ ] BOTÓN «VOLVER»
- [ ] ENLACES ENTRE MÓDULOS
- [ ] BÚSQUEDA GLOBAL
- [ ] RESULTADOS CONTEXTUALES
- [ ] MÓDULOS OCULTOS
- [ ] MÓDULOS DESACTIVADOS
- [ ] ELIMINADOS
- [ ] RENDIMIENTO
- [ ] PRUEBAS
- [ ] Buscar módulo.
- [ ] Buscar elemento.
- [ ] Buscar producto.
- [ ] Buscar favorito.
- [ ] Buscar un módulo oculto.
- [ ] Buscar uno desactivado.
- [ ] Buscar elemento eliminado.
- [ ] Búsqueda sin resultados.
- [ ] Resultados parciales.
- [ ] Abrir resultado.
- [ ] Volver atrás.
- [ ] Mantener posición anterior.
- [ ] Probar teclado móvil.
- [ ] Probar modo oscuro.
- [ ] Comprobar que no se duplican resultados.

#### EH · Fase 38/65 — NOTIFICACIONES Y RECORDATORIOS
- [ ] CENTRO DE NOTIFICACIONES
- [ ] TIPOS DE AVISO
- [ ] NADA AUTOMÁTICO SIN PERMISO
- [ ] CREAR RECORDATORIO
- [ ] REPETICIÓN
- [ ] SILENCIAR
- [ ] HORARIO DE SILENCIO
- [ ] LÍMITE DE NOTIFICACIONES
- [ ] NOTIFICACIONES INTELIGENTES
- [ ] RECOMENDACIONES
- [ ] CONTROL GLOBAL
- [ ] DESACTIVACIÓN TOTAL
- [ ] HISTORIAL
- [ ] ACCIÓN DESDE LA NOTIFICACIÓN
- [ ] PRUEBAS
- [ ] Activar aviso.
- [ ] Crear recordatorio.
- [ ] Programarlo.
- [ ] Recibirlo.
- [ ] Abrirlo.
- [ ] Comprobar que lleva al módulo correcto.
- [ ] Silenciar categoría.
- [ ] Desactivar todo.
- [ ] Reactivar.
- [ ] Probar repetición.
- [ ] Probar varios avisos.
- [ ] Comprobar agrupación.
- [ ] Comprobar horario de silencio.
- [ ] Comprobar persistencia.

#### EH · Fase 39/65 — INTEGRACIÓN CON EL RESTO DE JC FITNESS
- [ ] CALENDARIO 📅
- [ ] OBJETIVOS 🎯
- [ ] TAREAS ✅
- [ ] RECORDATORIOS 🔔
- [ ] FAVORITOS ❤️
- [ ] PRODUCTOS 🛒
- [ ] ARMARIO 👕
- [ ] DIARIO 📝
- [ ] FOTOS 📷
- [ ] RACHAS 🔥
- [ ] SONIDOS 🔊
- [ ] ELIMINADOS 🗑️
- [ ] BÚSQUEDA 🔍
- [ ] NOTIFICACIONES 🔔
- [ ] AJUSTES ⚙️
- [ ] AUTENTICACIÓN 👤
- [ ] SINCRONIZACIÓN ☁️
- [ ] FUENTE ÚNICA DE VERDAD
- [ ] ELIMINACIÓN EN CASCADA
- [ ] DESACTIVACIÓN
- [ ] PRUEBA MAESTRA

#### EH · Fase 40/65 — PRIMER USO Y CONFIGURACIÓN INICIAL
- [ ] PRIMERA ENTRADA
- [ ] SALTAR
- [ ] CONFIGURACIÓN PROGRESIVA
- [ ] NADA DE «PERFIL 100%»
- [ ] PANTALLA RESULTANTE
- [ ] RECOMENDACIONES INICIALES
- [ ] APRENDER CON EL USO
- [ ] VOLVER A CONFIGURAR
- [ ] USUARIO QUE YA TIENE DATOS
- [ ] IMPORTAR
- [ ] USUARIO QUE NO QUIERE NADA
- [ ] VOLVER MÁS TARDE
- [ ] TUTORIAL
- [ ] Plaquitas.
- [ ] Personalización.
- [ ] Conexiones con otros módulos.
- [ ] Cómo ocultar/desactivar.
- [ ] RECORDAR EL ESTADO
- [ ] PRUEBAS
- [ ] Usuario nuevo.
- [ ] Empezar.
- [ ] Seleccionar un módulo.
- [ ] Seleccionar varios.
- [ ] Saltar.
- [ ] Salir.
- [ ] Volver.
- [ ] Añadir posteriormente módulos.
- [ ] Usuario con datos existentes.
- [ ] Importar referencias.
- [ ] Comprobar que no hay duplicados.
- [ ] Repetir tutorial.
- [ ] Saltar tutorial.
- [ ] Comprobar persistencia.

#### EH · Fase 41/65 — ESTADOS VACÍOS, CARGA, ERRORES Y RECUPERACIÓN
- [ ] SIN DATOS
- [ ] PRIMERA VEZ
- [ ] CARGANDO
- [ ] ERROR DE CONEXIÓN
- [ ] MODO SIN CONEXIÓN
- [ ] ERROR DE GUARDADO
- [ ] EVITAR PÉRDIDA DE DATOS
- [ ] SINCRONIZACIÓN
- [ ] CONFLICTOS
- [ ] MÓDULO DESACTIVADO
- [ ] ELEMENTO ELIMINADO
- [ ] PERMISO DENEGADO
- [ ] ERROR IRRECUPERABLE
- [ ] DATOS CORRUPTOS
- [ ] ACCIONES DESTRUCTIVAS
- [ ] FEEDBACK VISUAL
- [ ] PRUEBAS
- [ ] Sin datos.
- [ ] Sin conexión.
- [ ] Con conexión lenta.
- [ ] Error de servidor.
- [ ] Error de guardado.
- [ ] Sincronización.
- [ ] Conflicto.
- [ ] Permiso denegado.
- [ ] Elemento eliminado.
- [ ] Módulo desactivado.
- [ ] Recuperación.
- [ ] Reintento.
- [ ] Cierre durante guardado.
- [ ] Volver a abrir.
- [ ] Comprobar que no se pierden datos.

#### EH · Fase 42/65 — ACCESIBILIDAD Y USABILIDAD
- [ ] BOTONES
- [ ] PLAQUITAS
- [ ] TEXTO
- [ ] ICONOS
- [ ] CONTRASTE
- [ ] COLOR
- [ ] ANIMACIONES
- [ ] NAVEGACIÓN
- [ ] SCROLL
- [ ] TECLADO
- [ ] FORMULARIOS
- [ ] ERRORES
- [ ] CONFIRMACIONES
- [ ] ACCESIBILIDAD DEL TEXTO
- [ ] TAMAÑO DE FUENTE
- [ ] ORIENTACIÓN
- [ ] DISPOSITIVOS
- [ ] RENDIMIENTO
- [ ] PRUEBAS
- [ ] Modo claro.
- [ ] Modo oscuro.
- [ ] Texto grande.
- [ ] Lector de pantalla.
- [ ] Teclado abierto.
- [ ] Pantalla pequeña.
- [ ] Pantalla grande.
- [ ] Scroll.
- [ ] Arrastrar plaquitas.
- [ ] Formularios.
- [ ] Errores.
- [ ] Confirmaciones.
- [ ] Animaciones.
- [ ] Rotación.
- [ ] Rendimiento.

#### EH · Fase 43/65 — SEGURIDAD, PRIVACIDAD Y CONTROL DE DATOS
- [ ] DATOS PRIVADOS
- [ ] CUENTA
- [ ] ACCESO
- [ ] PRIVACIDAD POR MÓDULO
- [ ] DATOS SENSIBLES
- [ ] ELIMINAR
- [ ] RECUPERAR
- [ ] ELIMINACIÓN DEFINITIVA
- [ ] EXPORTAR
- [ ] SINCRONIZACIÓN SEGURA
- [ ] PRODUCTOS Y AFILIACIÓN
- [ ] ANALÍTICA
- [ ] BORRADO DE CUENTA
- [ ] COPIAS DE SEGURIDAD
- [ ] SESIONES
- [ ] PRUEBAS
- [ ] Crear datos.
- [ ] Cerrar sesión.
- [ ] Iniciar sesión.
- [ ] Verificar recuperación.
- [ ] Probar otro dispositivo.
- [ ] Eliminar.
- [ ] Recuperar.
- [ ] Eliminar definitivamente.
- [ ] Exportar.
- [ ] Comprobar permisos.
- [ ] Comprobar privacidad.
- [ ] Eliminar cuenta en entorno de pruebas.
- [ ] Verificar que no quedan datos accesibles.

#### EH · Fase 44/65 — RENDIMIENTO Y OPTIMIZACIÓN
- [ ] CARGAR SOLO LO NECESARIO
- [ ] CARGA PROGRESIVA
- [ ] LISTAS GRANDES
- [ ] FOTOS
- [ ] CACHÉ
- [ ] DATOS LOCALES
- [ ] SINCRONIZACIÓN EFICIENTE
- [ ] DEBOUNCE
- [ ] ANIMACIONES
- [ ] MEMORIA
- [ ] COMPONENTES
- [ ] DATOS DUPLICADOS
- [ ] ACTUALIZACIONES
- [ ] ERROR DE RENDIMIENTO
- [ ] DISPOSITIVOS ANTIGUOS
- [ ] PRUEBAS DE CARGA
- [ ] PRUEBAS DE RED
- [ ] PRUEBAS DE MEMORIA

#### EH · Fase 45/65 — ESTRUCTURA INTERNA DE DATOS
- [ ] USUARIO
- [ ] MÓDULOS
- [ ] CONFIGURACIÓN DE PLAQUITAS
- [ ] PREFERENCIAS
- [ ] GUSTOS
- [ ] EXPERIENCIAS
- [ ] RELACIONES
- [ ] ELIMINACIÓN
- [ ] HISTORIAL
- [ ] FECHAS
- [ ] SINCRONIZACIÓN
- [ ] CONFLICTOS
- [ ] SEGURIDAD
- [ ] ESCALABILIDAD
- [ ] NO SOBREDISEÑAR
- [ ] PRUEBAS
- [ ] Crear registro.
- [ ] Modificarlo.
- [ ] Eliminarlo.
- [ ] Recuperarlo.
- [ ] Sincronizarlo.
- [ ] Abrirlo desde otro dispositivo.
- [ ] Relacionarlo con otro módulo.
- [ ] Eliminar la relación.
- [ ] Comprobar permisos.
- [ ] Comprobar que no existen duplicados.

#### EH · Fase 46/65 — MIGRACIÓN Y COMPATIBILIDAD
- [ ] NO REHACER LA APP
- [ ] ANALIZAR ANTES DE MODIFICAR
- [ ] MAPEAR DATOS EXISTENTES
- [ ] MIGRACIÓN
- [ ] BACKUP ANTES DE MIGRAR
- [ ] COMPATIBILIDAD
- [ ] FUNCIONES ANTIGUAS
- [ ] DUPLICADOS
- [ ] VERSIONADO
- [ ] MIGRACIONES FUTURAS
- [ ] USUARIO ANTIGUO
- [ ] USUARIO NUEVO
- [ ] MIGRACIÓN PARCIAL
- [ ] DATOS INCOMPATIBLES
- [ ] PRUEBAS
- [ ] FALLA DURANTE MIGRACIÓN
- [ ] DESPLIEGUE
- [ ] COMPATIBILIDAD CON SUPABASE
- [ ] COMPATIBILIDAD ENTRE VERSIONES
- [ ] PRUEBA FINAL

#### EH · Fase 47/65 — PRUEBAS INTEGRALES
- [ ] PRUEBA DE ENTRADA
- [ ] PRUEBA DE PLAQUITAS
- [ ] PRUEBA DE ACTIVACIÓN
- [ ] PRUEBA DE ELIMINACIÓN
- [ ] PRUEBA DE OBJETIVOS
- [ ] PRUEBA DE CALENDARIO
- [ ] PRUEBA DE DIARIO
- [ ] PRUEBA DE FAVORITOS
- [ ] PRUEBA DE PRODUCTOS
- [ ] PRUEBA DE NOTIFICACIONES
- [ ] PRUEBA DE RECOMENDACIONES
- [ ] PRUEBA DE BÚSQUEDA
- [ ] PRUEBA DE PERFIL
- [ ] PRUEBA DE ESTADÍSTICAS
- [ ] PRUEBA DE DESCONEXIÓN
- [ ] PRUEBA DE DOS DISPOSITIVOS
- [ ] PRUEBA DE CONFLICTO
- [ ] PRUEBA DE CUENTA
- [ ] PRUEBA DE USUARIO NUEVO
- [ ] PRUEBA DE USUARIO AVANZADO
- [ ] PRUEBA DE INTERFAZ
- [ ] PRUEBA DE ACCESIBILIDAD
- [ ] PRUEBA DE ERRORES
- [ ] PRUEBA DE RENDIMIENTO
- [ ] PRUEBA DE DATOS
- [ ] PRUEBA DE SEGURIDAD
- [ ] PRUEBA DE MIGRACIÓN
- [ ] PRUEBA DE ACTUALIZACIÓN
- [ ] PRUEBA DE DESINSTALACIÓN / REINSTALACIÓN
- [ ] PRUEBA FINAL DEL USUARIO

#### EH · Fase 48/65 — AUDITORÍA FINAL DE FUNCIONES Y DUPLICADOS
- [ ] INVENTARIO COMPLETO
- [ ] CLASIFICAR CADA FUNCIÓN
- [ ] REVISAR DUPLICADOS
- [ ] PLAQUITAS DUPLICADAS
- [ ] PREFERENCIAS DUPLICADAS
- [ ] DATOS DUPLICADOS
- [ ] SISTEMAS QUE DEBEN SALIR DE ESTILO
- [ ] SISTEMAS QUE DEBEN QUEDARSE
- [ ] REVISAR EL FLUJO
- [ ] REVISAR NAVEGACIÓN
- [ ] REVISAR NOMBRES
- [ ] REVISAR ICONOS
- [ ] REVISAR ACCIONES
- [ ] REVISAR CONFIGURACIÓN
- [ ] REVISAR ELIMINACIÓN
- [ ] REVISAR RECOMENDACIONES
- [ ] REVISAR ESTADÍSTICAS
- [ ] REVISAR NOTIFICACIONES
- [ ] REVISAR PANTALLA PRINCIPAL
- [ ] DOCUMENTAR DECISIONES
- [ ] NO AÑADIR FUNCIONES DURANTE LA AUDITORÍA
- [ ] RESULTADO FINAL

#### EH · Fase 49/65 — REVISIÓN VISUAL FINAL Y COHERENCIA
- [ ] IDENTIDAD JC FITNESS
- [ ] PERSONALIDAD PROPIA
- [ ] PLAQUITAS
- [ ] JERARQUÍA
- [ ] ESPACIO
- [ ] ICONOS
- [ ] MODO OSCURO
- [ ] ANIMACIONES
- [ ] ESTADOS
- [ ] BOTONES
- [ ] MODALES
- [ ] FORMULARIOS
- [ ] NAVEGACIÓN
- [ ] ICONO Y TÍTULO
- [ ] MICRODETALLES
- [ ] RESPONSIVE
- [ ] NO SOBREDECORAR
- [ ] REVISIÓN VISUAL COMPLETA
- [ ] COMPARACIÓN CON JC FITNESS
- [ ] RESULTADO

#### EH · Fase 50/65 — MICROINTERACCIONES Y ANIMACIONES
- [ ] TOCAR UNA PLAQUITA
- [ ] MANTENER PULSADO
- [ ] ARRASTRAR
- [ ] AÑADIR
- [ ] OCULTAR
- [ ] DESACTIVAR
- [ ] RECUPERAR
- [ ] GUARDAR
- [ ] ELIMINAR
- [ ] CAMBIAR TAMAÑO
- [ ] ABRIR MÓDULO
- [ ] VOLVER
- [ ] BUSCADOR
- [ ] FILTROS
- [ ] CHECKBOX / SELECTORES
- [ ] SLIDERS
- [ ] ERRORES
- [ ] ÉXITO
- [ ] CARGA
- [ ] REDUCIR ANIMACIONES
- [ ] VELOCIDAD
- [ ] CONSISTENCIA
- [ ] SIN ANIMACIONES GRATUITAS
- [ ] PRUEBA DE MICROINTERACCIONES

#### EH · Fase 51/65 — CONTROL DE CALIDAD DE LA EXPERIENCIA REAL
- [ ] PRUEBA DEL PRIMER DÍA
- [ ] PRUEBA DEL TERCER DÍA
- [ ] PRUEBA DE USO RÁPIDO
- [ ] PRUEBA DE DESCUBRIMIENTO
- [ ] PRUEBA DE SOBRECARGA
- [ ] PRUEBA DE USUARIO SIMPLE
- [ ] PRUEBA DE USUARIO AVANZADO
- [ ] PRUEBA DE PERSONALIZACIÓN
- [ ] PRUEBA DE «NO QUIERO ESTO»
- [ ] PRUEBA DE «QUIERO RECUPERARLO»
- [ ] PRUEBA DE ERRORES HUMANOS
- [ ] PRUEBA DE VELOCIDAD
- [ ] PRUEBA DE NOTIFICACIONES
- [ ] PRUEBA DE RECOMENDACIONES
- [ ] PRUEBA DE CONFIANZA
- [ ] PRUEBA DE COHERENCIA
- [ ] PRUEBA DE «¿REALMENTE HACE FALTA?»
- [ ] LISTA DE FALLOS
- [ ] PRUEBA FINAL SIN INSTRUCCIONES

#### EH · Fase 52/65 — PREPARACIÓN PARA PRODUCCIÓN
- [ ] SEPARAR ENTORNOS
- [ ] VARIABLES Y SECRETOS
- [ ] BASE DE DATOS
- [ ] BACKUP
- [ ] MIGRACIONES
- [ ] DATOS EXISTENTES
- [ ] CUENTA NUEVA
- [ ] CUENTA EXISTENTE
- [ ] PRODUCCIÓN MÓVIL
- [ ] RENDIMIENTO REAL
- [ ] MONITORIZACIÓN
- [ ] RECUPERACIÓN
- [ ] DESPLIEGUE GRADUAL
- [ ] PLAN DE RETROCESO
- [ ] CHECKLIST DE PUBLICACIÓN
- [ ] DESPUÉS DE PUBLICAR
- [ ] SI APARECE UN ERROR
- [ ] NO AÑADIR FUNCIONES POST-LANZAMIENTO SIN CONTROL

#### EH · Fase 53/65 — DOCUMENTACIÓN TÉCNICA Y MANTENIMIENTO
- [ ] DOCUMENTO DEL MÓDULO
- [ ] MAPA DE MÓDULOS
- [ ] SISTEMAS GLOBALES UTILIZADOS
- [ ] FUENTE DE CADA DATO
- [ ] ESTADOS
- [ ] ELIMINACIÓN
- [ ] ESTRUCTURA DE DATOS
- [ ] MIGRACIONES
- [ ] COMPONENTES REUTILIZABLES
- [ ] REGLAS DE DISEÑO
- [ ] REGLAS DE UX
- [ ] NOTIFICACIONES
- [ ] PRIVACIDAD
- [ ] PRUEBAS
- [ ] CAMBIOS FUTUROS
- [ ] BACKLOG
- [ ] REGLA PARA CLAUDE
- [ ] DOCUMENTACIÓN PARA MANTENIMIENTO

#### EH · Fase 54/65 — BACKUP, RESTAURACIÓN Y RECUPERACIÓN AVANZADA
- [ ] BACKUP GLOBAL
- [ ] COPIAS AUTOMÁTICAS
- [ ] BACKUP ANTES DE CAMBIOS IMPORTANTES
- [ ] RESTAURACIÓN
- [ ] NO RESTAURAR TODA LA APP SIN NECESIDAD
- [ ] RECUPERACIÓN DE UN ELEMENTO
- [ ] RECUPERACIÓN DE UN MÓDULO
- [ ] RESTAURACIÓN COMPLETA
- [ ] HISTORIAL DE CAMBIOS
- [ ] RECUPERACIÓN DE CONFIGURACIÓN
- [ ] RESTAURACIÓN Y SINCRONIZACIÓN
- [ ] CONFLICTOS DE RESTAURACIÓN
- [ ] SEGURIDAD
- [ ] EXPORTACIÓN
- [ ] IMPORTACIÓN
- [ ] PRUEBA DE RESTAURACIÓN
- [ ] PRUEBA DE DESASTRE
- [ ] REGISTRO

#### EH · Fase 55/65 — ESCALABILIDAD Y FUTURAS FUNCIONES
- [ ] MÓDULOS MODULARES
- [ ] NUEVAS PLAQUITAS
- [ ] FUNCIONES FUTURAS
- [ ] SISTEMA DE PLUGINS NO NECESARIO
- [ ] DATOS EXTENSIBLES
- [ ] CATEGORÍAS
- [ ] CONFIGURACIÓN
- [ ] INTEGRACIONES
- [ ] IA
- [ ] PERSONALIZACIÓN
- [ ] COMPATIBILIDAD
- [ ] VERSIONADO
- [ ] RENDIMIENTO
- [ ] CONTROL DE COMPLEJIDAD
- [ ] BACKLOG
- [ ] PRIORIDADES
- [ ] PRUEBA DE CRECIMIENTO

#### EH · Fase 56/65 — INTEGRACIÓN PROFUNDA CON LA IA
- [ ] CONTEXTO PERSONAL
- [ ] RECOMENDACIONES PERSONALIZADAS
- [ ] APRENDER DE LAS RESPUESTAS
- [ ] NO REPETIR
- [ ] CONTEXTO
- [ ] CONEXIÓN CON OTROS MÓDULOS
- [ ] OBJETIVOS
- [ ] IA CONVERSACIONAL
- [ ] EXPLICACIONES
- [ ] NIVEL DE CONFIANZA
- [ ] PRIVACIDAD
- [ ] CONTROL DEL USUARIO
- [ ] MEMORIA DE LA IA
- [ ] CORRECCIÓN DEL USUARIO
- [ ] EVITAR AUTOMATISMOS
- [ ] ACCIONES SUGERIDAS
- [ ] APRENDIZAJE PROGRESIVO
- [ ] PRUEBAS DE IA

#### EH · Fase 57/65 — APRENDIZAJE Y PERSONALIZACIÓN PROGRESIVA
- [ ] APRENDER DE FORMA NATURAL
- [ ] PREFERENCIAS EXPLÍCITAS
- [ ] PREFERENCIAS INFERIDAS
- [ ] CONFIRMACIÓN
- [ ] NIVEL DE CONFIANZA
- [ ] CAMBIO DE GUSTOS
- [ ] PREFERENCIAS ACTUALES
- [ ] CONTRADICCIONES
- [ ] EXPLICAR RECOMENDACIONES
- [ ] CORREGIR EL SISTEMA
- [ ] CONTROL DE MEMORIA
- [ ] BORRAR APRENDIZAJE
- [ ] NO PERFILAR EN EXCESO
- [ ] NO TOMAR DECISIONES IMPORTANTES
- [ ] APRENDIZAJE ENTRE MÓDULOS
- [ ] PRIVACIDAD
- [ ] PRUEBAS

#### EH · Fase 58/65 — INSIGHTS Y RESÚMENES INTELIGENTES
- [ ] RESUMEN PERSONAL
- [ ] EVOLUCIÓN
- [ ] CAMBIOS DESTACADOS
- [ ] HÁBITOS
- [ ] PREFERENCIAS
- [ ] OBJETIVOS
- [ ] RECOMENDACIÓN INTELIGENTE
- [ ] INSIGHTS PEQUEÑOS
- [ ] NO INVENTAR PATRONES
- [ ] CONFIDENCIALIDAD
- [ ] CONTROL DE FRECUENCIA
- [ ] INSIGHT → ACCIÓN
- [ ] HISTORIAL
- [ ] OCULTAR INSIGHTS
- [ ] ESTADÍSTICAS AVANZADAS
- [ ] IA + INSIGHTS
- [ ] COMPARACIONES
- [ ] DATOS VACÍOS

#### EH · Fase 59/65 — RESUMEN SEMANAL Y MENSUAL
- [ ] RESUMEN SEMANAL
- [ ] RESUMEN MENSUAL
- [ ] SIN INFORMACIÓN INNECESARIA
- [ ] PERSONALIZACIÓN
- [ ] CONFIGURACIÓN
- [ ] PRIVACIDAD
- [ ] NOTIFICACIÓN
- [ ] RESUMEN DENTRO DE LA APP
- [ ] ESTRUCTURA
- [ ] COMPARACIÓN
- [ ] IA
- [ ] CORRECCIONES
- [ ] COMPARTIR
- [ ] HISTORIAL
- [ ] RENDIMIENTO
- [ ] PRUEBAS

#### EH · Fase 60/65 — RECOMENDACIONES CONTEXTUALES
- [ ] CONTEXTO TEMPORAL
- [ ] CONTEXTO DE EVENTOS
- [ ] CONTEXTO DE RUTINA
- [ ] CONTEXTO CLIMÁTICO
- [ ] CONTEXTO DE VIAJE
- [ ] CONTEXTO DE OCASIONES
- [ ] NO ASUMIR
- [ ] FRECUENCIA
- [ ] PRIORIZACIÓN
- [ ] RECHAZAR
- [ ] GUARDAR
- [ ] CONVERTIR EN OBJETIVO
- [ ] CONVERTIR EN TAREA
- [ ] IA
- [ ] PRIVACIDAD
- [ ] MODO SILENCIOSO
- [ ] PRUEBA DE RELEVANCIA

#### EH · Fase 61/65 — ACCIONES RÁPIDAS E INTELIGENTES
- [ ] ACCIONES RÁPIDAS PRINCIPALES
- [ ] ACCESO RÁPIDO
- [ ] BOTÓN +
- [ ] ACCIONES CONTEXTUALES
- [ ] DESLIZAR
- [ ] MANTENER PULSADO
- [ ] ATAJOS
- [ ] ACCIONES DESDE RECOMENDACIONES
- [ ] ACCIONES DESDE INSIGHTS
- [ ] ACCIONES GLOBALES
- [ ] CONFIRMACIONES
- [ ] DESHACER
- [ ] ACCIONES EN LOTE
- [ ] ACCIONES INTELIGENTES
- [ ] VELOCIDAD
- [ ] ACCESIBILIDAD
- [ ] PRUEBA

#### EH · Fase 62/65 — ACCESIBILIDAD Y USABILIDAD AVANZADA
- [ ] TAMAÑO DEL TEXTO
- [ ] CONTRASTE
- [ ] ZONAS TÁCTILES
- [ ] ICONOS
- [ ] ESTADOS
- [ ] REDUCIR MOVIMIENTO
- [ ] NAVEGACIÓN
- [ ] TECLADO
- [ ] FORMULARIOS
- [ ] MENSAJES
- [ ] GESTOS
- [ ] USO CON UNA MANO
- [ ] ORIENTACIÓN
- [ ] PANTALLAS PEQUEÑAS
- [ ] ESTADOS VACÍOS
- [ ] ERRORES DE RED
- [ ] LECTORES DE PANTALLA
- [ ] ORDEN DE LECTURA
- [ ] PRUEBA REAL

#### EH · Fase 63/65 — SEGURIDAD, PRIVACIDAD Y CONTROL DE DATOS
- [ ] INVENTARIO DE DATOS
- [ ] DATOS SENSIBLES
- [ ] ACCESO
- [ ] AUTENTICACIÓN
- [ ] AUTORIZACIÓN
- [ ] IA
- [ ] MEMORIA
- [ ] ELIMINACIÓN
- [ ] ELIMINACIÓN DEFINITIVA
- [ ] EXPORTACIÓN
- [ ] PRIVACIDAD DE IA
- [ ] DATOS LOCALES
- [ ] LOGS
- [ ] SEGURIDAD DE API
- [ ] VALIDACIÓN
- [ ] INYECCIONES Y ENTRADAS MALICIOSAS
- [ ] BORRADO DE CUENTA
- [ ] COPIAS DE SEGURIDAD
- [ ] AUDITORÍA
- [ ] PRUEBA FINAL

#### EH · Fase 64/65 — PRUEBA INTEGRAL END-TO-END
- [ ] USUARIO NUEVO
- [ ] USUARIO EXISTENTE
- [ ] NAVEGACIÓN COMPLETA
- [ ] PERSONALIZACIÓN
- [ ] DATOS
- [ ] ELIMINACIÓN
- [ ] IA
- [ ] RECOMENDACIONES
- [ ] INSIGHTS
- [ ] RESUMEN SEMANAL
- [ ] RESUMEN MENSUAL
- [ ] CONTEXTO
- [ ] ACCIONES RÁPIDAS
- [ ] OFFLINE
- [ ] SINCRONIZACIÓN
- [ ] CONFLICTOS
- [ ] MÓVIL
- [ ] MODO OSCURO
- [ ] ACCESIBILIDAD
- [ ] SEGURIDAD
- [ ] RENDIMIENTO
- [ ] DATOS MASIVOS
- [ ] ERRORES
- [ ] BACKUP
- [ ] PRUEBA DE REGRESIÓN
- [ ] PRUEBA FINAL DEL USUARIO

#### EH · Fase 65/65 — CIERRE, CONGELACIÓN Y ENTREGA FINAL
- [ ] CONGELAR FUNCIONALIDADES
- [ ] INVENTARIO FINAL
- [ ] COMPROBAR QUE NO HAYA DUPLICADOS
- [ ] REVISIÓN DE DISEÑO
- [ ] REVISIÓN DE UX
- [ ] REVISIÓN DE DATOS
- [ ] REVISIÓN DE IA
- [ ] REVISIÓN DE SEGURIDAD
- [ ] REVISIÓN MULTIDISPOSITIVO
- [ ] RENDIMIENTO FINAL
- [ ] BACKUP FINAL
- [ ] ETIQUETAR VERSIÓN
- [ ] DOCUMENTACIÓN FINAL
- [ ] BACKLOG FUTURO
- [ ] NO ROMPER LO TERMINADO
- [ ] INTEGRACIÓN CON JC FITNESS
- [ ] CRITERIO DE ENTREGA
- [ ] INFORME FINAL PARA EL PROYECTO

---

## FO · FONDOS Y FOTOGRAFÍAS (ASPECTO) — 12 fases

Amplía el sistema de apariencia ya existente para permitir usar una fotografía como fondo y derivar de ella una paleta coherente. **Se apoya directamente en `colorEngine.js`, `ColorPicker`, `TemaBuilder` y `GestionTemas` (fases V1–V4, ya construidas): no debe crear un segundo motor de color.**

#### FO · Fase 1/12 — SISTEMA BASE DE FONDOS Y FOTOGRAFÍAS ✅ COMPLETADA (v1.36.0)

Todo el modelo vive en `src/lib/fondos.js`, un motor puro nuevo que solo depende de
`colorEngine.js`. El fondo se guarda dentro de `apariencia`, **no en una clave suya**.

- [x] **1 · Objetivo** — arquitectura completa y escalable, sin las funciones avanzadas de las
      fases 2-12. Ninguna de ellas obligará a rehacer esta base.
- [x] **2 · Principio fundamental** — el fondo es un elemento propio, no "una imagen detrás".
      Un solo sistema sabe qué fondo está activo, cuál usa, cómo se muestra y con qué ajustes.
- [x] **3 · Tipos de fondo** — los cinco desde el primer día: sin fondo, color sólido, degradado,
      fotografía e incluido. **Solo se ofrecen en Ajustes los cuatro que ya funcionan**: la
      fotografía es de la Fase 2, y un "Fotografía (próximamente)" sería el control decorativo
      que prohíbe la regla 8. Existe en el modelo; la interfaz la ofrecerá cuando exista.
- [x] **4 · Modelo central** — los once campos del apartado, con los nombres del proyecto y la
      correspondencia documentada al lado (`type→tipo`, `overlay→velo`, `isActive→activo`…).
- [x] **5 · Sistema único de apariencia** — el fondo vive en `apariencia`, junto a tema,
      densidad, radio y alto contraste, y se resuelve en el mismo sitio y el mismo momento que
      el tema. **No hay un segundo sistema de apariencia.**
- [x] **6 · Prioridad** — la cadena del apartado, y `resolverFondo` **nunca devuelve null**: el
      peor caso es el fondo normal de JosStyle. Un color roto, un degradado a medias o una foto
      que ya no está bajan un escalón en vez de dejar un hueco, y dicen por qué (`motivo`).
- [x] **7 · Preparado para fotografías** — `foto` declara id, ruta, origen, ancho, alto y
      proporción. Nace vacía; la llena la Fase 2.
- [x] **8 · Preparado para colores** — `analisis` y `paleta`, en `null`. Sin detector, que es
      de la Fase 5.
- [x] **9 · Preparado para recomendaciones** — `recomendacion`, en `null`, para la Fase 6.
- [x] **10 · Claro y oscuro** — cambiar de tema **no puede tocar el fondo**, y no es una promesa:
      los fondos incluidos se definen con TOKENS, no con hex, así que se pintan distinto en cada
      tema sin que la configuración guardada cambie. Hay prueba que pinta el mismo fondo con dos
      paletas y comprueba que sale distinto y que lo guardado sigue igual.
- [x] **11 · Componente centralizado** — una sola resolución en `App.jsx`, justo después de
      `aplicarTema`. Ninguna pantalla gestiona su propio fondo.
- [x] **12 · Persistencia** — el `saveData` que ya existe. **Ninguna base de datos nueva.**
- [x] **13 · Cambio de fondo** — `seleccionarFondo` es la función central, y el cambio es
      reactivo: se ve al instante, sin recargar.
- [x] **14 · Restablecer** — vuelve al fondo normal **sin borrar nada**, y la interfaz lo dice
      para que nadie evite el botón por miedo a perder lo que eligió.
- [x] **15 · Preparado para las fases 2-12** — sí, y por un motivo concreto: la regla 5 del
      proyecto dice que `loadData` NO fusiona con el valor por defecto. Un campo que aparezca en
      la Fase 5 no lo tendría la configuración ya guardada, y arreglarlo entonces exige una
      migración a mano. Declararlo hoy, vacío, cuesta cero. Es la misma decisión que las 21
      propiedades de la prenda en AR Fase 1.
- [x] **16 · Restricciones** — ni detector de colores, ni IA, ni editor fotográfico, ni filtros,
      ni presets, ni eliminados, ni análisis de contraste, ni editor de degradados avanzado.
- [x] **17 · Criterios de finalización** — los trece, con 101 comprobaciones propias y 882 en
      total en verde.

**Un fallo de apilamiento CSS corregido al escribirlo:** una capa `position: fixed; z-index: 0`
se pinta en el paso 6 del orden de pintado, **por encima** del contenido en flujo normal (paso 3).
Tal cual, el fondo habría tapado la aplicación entera. Se arregla con `isolation: isolate` en el
contenedor —que lo convierte en contexto de apilamiento propio— y `z-index: -1` en las capas, que
las deja entre el `background` del contenedor y el contenido. `isolation` no crea bloque contenedor
para `position: fixed`, así que los overlays fijos de la app no se ven afectados, y los modales van
por `createPortal` a `document.body`, fuera de este contenedor.

**Por qué el velo va en su propia capa y no en la del fondo:** si compartieran capa, subir el
desenfoque difuminaría también el velo y dejaría de proteger la lectura, que es justo para lo que
existe.

**Un hueco de cobertura que se cerró de paso:** `SettingsView` no se renderizaba en ninguna prueba.
Ahora su bloque de fondo sí, con cuatro escenarios — incluido **un fondo guardado por una versión
anterior, sin los campos nuevos**, que es exactamente lo que devuelve `loadData` y lo que la regla
5 obliga a soportar.

#### FO · Fase 2/12 — GALERÍA Y SELECCIÓN DE FOTOGRAFÍAS ✅ COMPLETADA (v1.37.0)

- [x] **1 · Objetivo** — el flujo completo: Ajustes → Apariencia → Fondo → Foto → galería →
      vista previa → aplicar.
- [x] **2 · Acceso a la galería** — `<input type="file" accept="image/*">`, que en iPhone abre
      la galería nativa y en escritorio el selector del sistema. **No pide ningún permiso**: el
      navegador solo entrega el archivo que el usuario elige.
- [x] **3 · Selección** — la foto **NO se aplica al elegirla**. Primero la vista previa, después
      "Aplicar". Y la subida a Storage ocurre al APLICAR, no al elegir: si subiera al elegir,
      cada foto que Josué mirara y descartara dejaría un archivo huérfano en su bucket para
      siempre. La previa se hace con `URL.createObjectURL`, local e instantánea.
- [x] **4 · Vista previa** — la foto **dentro de una representación de JosStyle**, con una
      tarjeta y su texto secundario encima. Un rectángulo con la foto solo enseña la foto; lo
      que hay que poder juzgar es si el contenido se sigue leyendo.
- [x] **5 · Adaptación a la pantalla** — `cover` siempre, así que **la imagen nunca se deforma**.
      Verticales, horizontales, cuadradas y panorámicas, deducidas de las medidas reales.
- [x] **6 · Encuadre inicial** — no es "centrar y ya": una foto muy vertical se ancla **arriba**,
      que es donde está el cielo o el rostro en la inmensa mayoría de fotos de móvil, en vez de
      cortar por la cintura. El resto se centran.
- [x] **7 · Fotografía activa** — al aplicar, el tipo pasa a `foto` y queda registrada cuál es.
- [x] **8 · Cambiar de fotografía** — sin tener que quitar la anterior primero.
- [x] **9 · Quitar foto** — vuelve al fondo anterior (el color o el degradado que hubiera, y si
      no, al fondo normal), y **la fotografía no se elimina**: se conserva en el modelo para la
      recuperación de la Fase 12. La interfaz lo dice.
- [x] **10 · Estado sin fotografía** — con el texto de la especificación y un botón. Ni un hueco
      ni un elemento roto.
- [x] **11 · Información de la foto** — id, ruta, origen, formato, ancho, alto, proporción, peso
      y fecha. La proporción **se calcula**, no se pide.
- [x] **12 · Optimización inicial** — se rechaza lo que no es imagen y lo que pesa más de 12 MB,
      diciendo cuánto pesa y cuál es el máximo. Un archivo sin `type` declarado **no** se rechaza
      por formato: algunos navegadores no lo rellenan, y rechazar una foto válida por eso es peor
      que aceptar una rara. La optimización avanzada es de la Fase 11.
- [x] **13 · Persistencia** — el `saveData` de la Fase 1. Hay prueba que simula el viaje entero:
      guardar → JSON → cargar → normalizar.
- [x] **14 · Cambio entre tipos** — y lo que importa: **elegir una foto NO borra el color ni el
      degradado** que hubiera configurados. Comprobado con prueba propia.
- [x] **15 · Experiencia** — los cinco tipos en una fila, con el activo marcado.
- [x] **16 · Transición visual** — mientras la URL se firma, `resolverFondo` baja al fondo
      incluido, así que **nunca se ve la pantalla sin fondo** mientras carga la imagen.
- [x] **17 · Compatibilidad** — 941 comprobaciones en verde; ninguna pantalla existente tocada.
- [x] **18 · Preparado para la Fase 3** — zoom, posición, encuadre, desenfoque, oscurecimiento y
      overlay ya existen en el modelo y en `estilosDeFondo`; la Fase 3 les pone controles.
- [x] **19 · Criterios de finalización** — los catorce.
- [x] **20 · Regla para Claude** — no es un selector de archivos: la foto entra en el sistema de
      la Fase 1, con su encuadre, su validación, su persistencia y su cadena de prioridad.

**Bucket nuevo `fondos` en `supabase/schema.sql`**, con las tres políticas RLS por carpeta de
usuario, mismo patrón que `armario`. Va en su propio bucket y no dentro de `armario` a propósito:
son cosas con ciclos de vida distintos (una prenda se borra con la prenda; el fondo se sustituye
al elegir otra foto), y mezclarlas obligaría a distinguirlas por convenio de nombre de archivo,
que es el tipo de acuerdo implícito que se rompe solo.
⚠️ **Josué tiene que ejecutar ese bloque en el SQL Editor.** Hasta entonces funciona todo menos
la fotografía — color, degradado e incluidos no tocan Storage.

**Dos detalles que no son evidentes y estaban mal si no se piensan:**

1. **`URL.createObjectURL` sin `revokeObjectURL` es memoria retenida** hasta recargar la página.
   Se suelta al desmontar y cada vez que se sustituye por otra foto.
2. **Una firma en vuelo puede pisar a la siguiente.** Si Josué cambia de foto mientras la URL
   anterior se estaba firmando, la respuesta lenta de la vieja llegaría después y sobrescribiría
   a la nueva. El efecto lleva una bandera `cancelado` que descarta el resultado obsoleto.

#### FO · Fase 3/12 — EDITOR DE FOTOGRAFÍAS ✅ COMPLETADA (v1.38.0)

- [x] **1 · Objetivo** — elegir → editar → vista previa en tiempo real → aplicar, encima del
      sistema de las fases 1 y 2.
- [x] **2 · Regla principal** — **la fotografía original nunca se modifica**. Los ajustes son
      configuración del fondo: misma ruta, mismas medidas, mismo id después de editar.
- [x] **3 · Vista previa en tiempo real** — el editor lee su propio borrador, así que cada
      deslizador se ve al instante sin haber guardado nada.
- [x] **4 · Zoom** — de 100 a 300 %. El mínimo es 100 porque por debajo la foto dejaría huecos:
      100 % es `cover`, no "tamaño original".
- [x] **5 · Posición horizontal** y **6 · Posición vertical** — encuadre libre en porcentajes.
- [x] **7 · Encuadre** — `cover` o un único porcentaje, **nunca `100% 100%`**: la relación de
      aspecto se conserva siempre.
- [x] **8 · Desenfoque** — 0 a 40 px, con el 0 como "sin desenfoque".
- [x] **9 · Oscurecimiento** y **10 · Aclarado** — **un solo control bipolar** en vez de dos
      deslizadores. Dos controles para dos mitades del mismo eje se contradicen en cuanto los dos
      valen algo (¿qué es "oscurecer 40 y aclarar 30"?), y el apartado 17 pide no llenar la
      pantalla de controles. El aclarado llega menos lejos a propósito (apartado 10: "no debe
      provocar pérdida exagerada de contraste").
- [x] **11 · Opacidad** — 10 a 100 %.
- [x] **12 · Overlay** — capa de color con intensidad. Sin color elegido usa el del tema, que es
      lo que hacía el `velo` de la Fase 1.
- [x] **13 · Restablecer ajustes** — devuelve todo a fábrica **sin eliminar la fotografía**, y el
      encuadre vuelve al **inicial de su orientación**, no a "centro" a secas: para una foto
      vertical, "original" es anclada arriba, que es como se aplicó. El botón solo aparece si hay
      algo que restablecer.
- [x] **14 · Cancelar cambios** — el editor trabaja sobre un **borrador local**: mientras está
      abierto no se llama a `onCambiar` ni una vez. Hay prueba que hace 40 cambios seguidos y
      comprueba que el fondo guardado no se ha tocado.
- [x] **15 · Aplicar cambios** — guarda y se ve al instante, sin recargar.
- [x] **16 · Cambiar de foto desde el editor** — y la parte que importa: *"los ajustes no deben
      transferirse accidentalmente si no tiene sentido"*. La línea está en si el ajuste habla de
      ESA imagen o del gusto de quien mira: **encuadre y zoom se recalculan** (el encuadre bueno
      de un retrato vertical no significa nada en una panorámica); **desenfoque, luz, opacidad y
      overlay se heredan** (si querías la foto discreta y oscura para leer mejor, la sigues
      queriendo así con otra imagen).
- [x] **17 · Interfaz** — vista previa grande arriba, controles debajo, y el editor entero detrás
      de "Ajustar foto" para no llenar Ajustes de deslizadores.
- [x] **18 · Experiencia móvil** — deslizadores nativos, botones grandes, nada pensado para ratón.
- [x] **19 · Rendimiento** — el borrador es un objeto plano y las capas son CSS puro; no se
      recodifica la imagen ni se toca un canvas.
- [x] **20 · Guardado por fotografía** — los ajustes quedan **vinculados a su foto** por id, así
      que volver a una imagen ya usada recupera su encuadre en vez de heredar el de otra. Limitado
      a las últimas 10 para que no crezca sin fin dentro de la configuración.
- [x] **21 · Compatibilidad** — 1000 comprobaciones en verde.
- [x] **22 · Preparado para la Fase 4** — el overlay ya acepta color, que es por donde entrará la
      paleta.
- [x] **23 · Criterios de finalización** — los diecisiete.
- [x] **24 · Regla para Claude** — no son filtros sueltos: es **una sola configuración coherente**
      del fondo (`AJUSTES_PRESENTACION`, una única lista que usan restablecer, cambiar de foto y
      guardar por foto — si cada una tuviera la suya, acabarían discrepando).

**Una decisión de modelo que había que tomar y no era neutral:** la Fase 1 guardaba `posicion` con
cinco valores fijos; esta fase necesita un encuadre libre. **No conviven**: dos formas de decir
dónde va la foto son dos fuentes de verdad. `posicion` se ha traducido a `encuadre {x, y}` y
`normalizarFondo` migra lo guardado por v1.36/37. Lo mismo con `velo`, que era el overlay sin
color: ahora es `overlay.intensidad`.

**Un fallo real que encontró la prueba de esa migración:** el traslado de `velo` a `overlay` estaba
escrito como `f.overlay?.intensidad ?? f.velo`, y **nunca se ejecutaba**. `f` ya viene fusionado con
`DEFAULT_FONDO`, así que `f.overlay` siempre existe con `intensidad: 0`, y `??` no salta con 0. A
quien tuviera un velo puesto se le habría perdido en silencio al actualizar. Se arregla mirando el
objeto **guardado**, no el fusionado.

**Y otro que cazó la regla invariante de colores:** la capa de luz usaba `#000000`/`#FFFFFF`
sueltos. No son colores de interfaz —oscurecer es acercar al negro en tema claro y en oscuro— así
que no pertenecen a `tokens.js`; pero añadir una excepción al comprobador lo habría debilitado. Se
usan las palabras clave de CSS `black` y `white`, que lo dicen al leerlo y no son un hex.

**Tres capas y no una**, y el orden importa: foto → luz → overlay. "Oscurecer la foto" no debe
oscurecer el overlay que va encima, y el overlay no debe desenfocarse con la foto. Tampoco se usa
`filter: brightness()` sobre la capa de la foto por el mismo motivo.

#### FO · Fase 4/12 — SISTEMA AVANZADO DE COLORES ✅ COMPLETADA (v1.39.0)

**Esta fase AMPLÍA el sistema de color que ya existía** (`colorEngine.js`, `aplicarTema`,
`ColorPicker`, `TemaBuilder`, temas guardados — fases V1-V4). El apartado 23 pide un sistema
centralizado y ya lo había; crear otro habría sido exactamente lo que prohíbe.

- [x] **1 · Objetivo** — fondo y colores son sistemas **relacionados pero independientes**: se
      guardan en claves distintas, así que se pueden combinar libremente.
- [x] **2 · Estructura** — dentro de Apariencia: Tema · Fondo · Tarjetas y barra · Color de
      acento · Constructor de temas.
- [x] **3, 4, 5 · Principal, secundario y acento** — ya existían y siguen igual.
- [x] **6 · Botones** — fondo, texto e iconos ya salen de `buildRolesFromAccent`.
- [x] **7 · Tarjetas** — fondo, borde y **transparencia**. Esta es la pieza que faltaba.
- [x] **8 · Jerarquía de texto** — principal, secundario (nuevo), atenuado y sobre acento. Con
      red de seguridad: un texto secundario del color del fondo **no se queda invisible**,
      `ensureContrast` lo corrige. El apartado lo pide literalmente.
- [x] **9 · Iconos** — activo e inactivo **por separado**: forzar un solo color para los dos
      destruye la jerarquía, que es lo que el apartado pide no hacer.
- [x] **10 · Navegación** — la barra inferior sale ya del sistema de colores.
- [x] **11 · Degradados** — ya soportados desde FO F1.
- [x] **12 · Transparencia** — tarjetas y barra, con `backdropFilter` para que el texto se siga
      leyendo sobre una foto con detalle.
- [x] **13 · Selector de color** — `ColorPicker` ya da espectro completo y hex.
- [x] **14 · Colores predeterminados** — `PALETAS_PREDEFINIDAS` ya existían; se añade
      `aplicarPresetColor`, que **conserva la transparencia** que el preset no menciona.
- [x] **15 · Restablecer colores** — con confirmación, y **sin tocar la fotografía**.
- [x] **16 · Guardado independiente** — `fondo` y `temaPersonalizado` son claves distintas (de
      hecho, claves distintas de Supabase). Hay prueba que lo comprueba estructuralmente.
- [x] **17 · Foto + colores** — explícitamente válido: nada obliga a usar colores detectados.
- [x] **18 · Vista previa** — inmediata, como ya lo era.
- [x] **19 · Cancelar** — el constructor de temas ya trabajaba así; el restablecer lleva
      confirmación propia.
- [x] **20 · Aplicar** — al instante, sin recargar.
- [x] **21 · Compatibilidad con el fondo** — los colores funcionan con los cinco tipos.
- [x] **22 · Claro y oscuro** — la transparencia se aplica **sobre el color de superficie de cada
      tema**, y lo personalizado sobrevive al cambio. Con prueba.
- [x] **23 · Sistema centralizado** — un solo `COLORS`, mutado en un solo sitio.
- [x] **24 · Preparado para el detector** — `fondo.analisis` y `fondo.paleta` esperan a la Fase 5.
- [x] **25 · Preparado para "Recomendado"** — `fondo.recomendacion`, para la Fase 6.

**LA TRANSPARENCIA NO ES UN EFECTO BONITO, ERA LA PIEZA QUE FALTABA.** Con una fotografía detrás,
las tarjetas opacas la tapan entera y solo se ve en los márgenes: sin esto, las fases 2 y 3
quedaban a medias — podías poner tu foto y no verla. Por eso se ha llevado hasta los tokens de
verdad (`COLORS.surfaceAlpha`, `COLORS.navBgAlpha`) y hasta los componentes (`Card`, la barra
inferior), no solo al modelo. **Al 100 % es exactamente el color sólido de siempre**, así que sin
tocar nada nada cambia.

**Un fallo real corregido de paso:** la barra de navegación tenía un `rgba(5,6,10,0.75)` fijo en el
código, así que **en tema claro seguía siendo negra**. Ahora sale de `COLORS.navBgAlpha` y respeta
el tema.

**Y un fallo que estas pruebas existen para que no vuelva:** `Object.assign(COLORS, base)`
sobrescribe las claves de `base` pero **no borra** las que no están en él. `iconActive`, `iconMuted`
y `navBg` no existen en `COLORS_OSCURO`/`COLORS_CLARO`, así que sin limpiarlos antes se quedaban
pegados del render anterior — quitar un color personalizado habría parecido que no funcionaba.

**Por qué "Restablecer colores" no puede tocar la fotografía:** no es que se acuerde de no hacerlo,
es que **ni siquiera la recibe**. `restablecerColores()` no tiene parámetros. Hay una prueba que
comprueba justamente eso (`restablecerColores.length === 0`), porque una garantía que depende de
acordarse no es una garantía.

**El mínimo de opacidad es 20 y no 0**, y la interfaz lo explica cuando te acercas: por debajo, una
tarjeta sobre una foto no es "translúcida", es texto suelto encima de una imagen. La Fase 9 afinará
esto con medidas de contraste reales.

#### FO · Fase 5/12 — DETECTOR INTELIGENTE DE COLORES ✅ COMPLETADA (v1.40.0)

Todo en `src/lib/detectorColores.js`. **Aritmética sobre píxeles, no IA.**

- [x] **1 · Objetivo** — foto → análisis → colores → paleta estructurada, lista para la Fase 6.
- [x] **2 · Cuándo analizar** — al cambiar de fotografía, **no** mientras se mueve el zoom: eso
      sería analizar decenas de veces por segundo para nada.
- [x] **3 · Colores dominantes** — hasta 6, agrupados en una rejilla de 4×4×4 por canal. El color
      de cada grupo es la **media de sus píxeles**, no el centro de la caja, así que es un color
      que de verdad está en la foto.
- [x] **4 · Paleta estructurada** — dominante, acento, secundario, neutro, claro y oscuro. Cada
      papel se elige por lo que ese papel necesita: **"no asumir que el color más frecuente es
      automáticamente el mejor color para botones"**, literal del apartado.
- [x] **5 · Claros, medios y oscuros** — por luminancia percibida.
- [x] **6 · Saturación** — neutro, apagado, moderado y vivo.
- [x] **7 · Neutros** — blancos, negros, grises y lo que se les parece.
- [x] **8 · Colores destacables** — **la prueba que define esta fase.** Cada color lleva dos
      números distintos: `peso` (cuánta superficie ocupa) e `interes` (cuánto destaca). El ejemplo
      literal del apartado está automatizado: una foto 95 % negra con un 5 % de azul eléctrico
      devuelve el **negro como dominante y el azul como acento**.
- [x] **9 · Distribución** — en qué tercio vertical vive cada color.
- [x] **10 · Análisis optimizado** — sobre una miniatura de 96 px de lado (~9.000 píxeles). **La
      fotografía original no se toca.**
- [x] **11 · Resultado** — hex, luminosidad, saturación, tono, peso, interés, zona y clasificación.
- [x] **12 · Representación visual** — las muestras en Ajustes, con su descripción, y tocar una la
      copia.
- [x] **13 · Actualización** — cada análisis va **sellado con el id de su fotografía**. Cambiar de
      foto y seguir viendo la paleta de la anterior es imposible por construcción.
- [x] **14 · Caché** — una foto ya analizada no se vuelve a analizar.
- [x] **15 · NO cambiar colores automáticamente** — detectar no es aplicar. Una foto azul con una
      paleta roja deja la paleta roja **intacta**, y la interfaz lo dice: *"Solo te los enseño:
      tus colores no cambian solos"*. Decidir es la Fase 6.
- [x] **16 · Integración con el sistema de colores** — tocar un color lo copia, y de ahí al
      selector que ya existe. El control sigue siendo de Josué.
- [x] **17 · Fotografías problemáticas** — ocho casos automatizados (toda negra, toda blanca, gris
      plano, extremadamente oscura, extremadamente clara, dos colores, un solo píxel, saturadísima)
      y ninguno produce una configuración rota.
- [x] **18 · Monocromáticas** — se identifican como paleta neutra y **no se inventa un acento que
      la foto no tiene**: `acento` es `null`, y eso es información honesta que la Fase 6 podrá usar.
- [x] **19 · Privacidad** — **la foto no sale del teléfono**. Ni IA, ni servicio externo, ni una
      sola petición: es `getImageData` sobre un `<canvas>` local.
- [x] **20 · Rendimiento** — "Analizando colores…" mientras trabaja, y una miniatura de 96 px en
      vez de la foto entera.

**Un fallo real, y de los que no dan ningún error:** `rgbToHsl`/`hexToHsl` de `colorEngine.js`
devuelven la saturación y la luminosidad en **0-100, no en 0-1**. Mis umbrales estaban en la escala
equivocada, así que **todo color con más de un 0,6 % de saturación salía como "vivo"** y solo un
gris exacto contaba como neutro: la clasificación entera habría sido inútil, y la Fase 6 habría
construido recomendaciones sobre datos sin sentido. Lo cazó la prueba que clasifica el propio
acento de la app (`#5C7E9A`, s = 25,2). La conversión está ahora en **un solo sitio**, con el aviso
escrito al lado.

**Por qué `interes` y `peso` son dos números y no uno:** el color que más superficie ocupa suele ser
el peor candidato a acento — en una foto nocturna es "casi negro" y en una de playa "casi blanco".
Fundirlos en una sola cifra habría hecho imposible la prueba del apartado 8.

**Los píxeles transparentes no cuentan.** Un agujero no es un color: contarlo metería un falso
negro en toda imagen con transparencia. Con prueba propia.

#### FO · Fase 6/12 — SISTEMA «RECOMENDADO» ✅ COMPLETADA (v1.41.0)

En `src/lib/recomendadorApariencia.js`. **Sin IA**: teoría del color sobre los colores reales que
sacó el detector de la Fase 5.

- [x] **1 · Objetivo** — foto → analizar → generar → mostrar → previsualizar → elegir → aplicar.
- [x] **2 · Botón "Recomendado"** — dentro de Apariencia, y **solo aparece si hay una foto
      analizada**: sin ella no hay nada que recomendar y un botón vacío sería decorativo.
- [x] **3 · Varias propuestas** — cinco: Equilibrada, Con contraste, Serena, Intensa y
      Minimalista.
- [x] **4 · Combinación completa** — cada propuesta es un tema entero: principal, secundario,
      terciario, transparencia de tarjetas, de la barra, overlay del fondo, texto sobre acento y
      su ratio de contraste.
- [x] **5 · La fotografía como base** — los tres ejemplos del apartado (azul+azul claro /
      azul+naranja complementario / azul desaturado+gris) son literalmente las tres primeras
      estrategias. **Nada aleatorio**: hay prueba de que generar dos veces da lo mismo.
- [x] **6 · Armonía cromática** — análogos, complementarios, desaturación y neutros.
- [x] **7 · Contraste** — cada propuesta pasa por `ensureContrast` **antes** de enseñarse, en los
      dos temas. Hay pruebas con acentos deliberadamente horribles (casi negro, casi blanco,
      saturadísimo) que comprueban que ninguna sale ilegible.
- [x] **8 · Propuestas realmente diferentes** — el apartado lo dice con un ejemplo: azul #123456,
      #123457 y #123458 **no son tres opciones, son una**. Por eso cada propuesta parte de una
      **estrategia cromática distinta**, no de un retoque de la anterior; se comprueba que no hay
      dos acentos iguales y que la distancia entre ellas es perceptible.
- [x] **9 · Previsualización** — muestras de color por propuesta, y "Probar" la aplica de verdad.
- [x] **10 · Aplicar** — cambia acento, tema y overlay. **No toca la fotografía**, y no porque se
      acuerde: `aplicarPropuesta` ni siquiera la recibe.
- [x] **11 · Probar sin aplicar** — tocar "Probar" la pone en la app al instante, sin guardarla.
- [x] **12 · Cancelar** — "Volver" recupera **exactamente** lo anterior.
- [x] **13 · Generar otras** — con una semilla **determinista**, no aleatoria: da algo distinto
      pero igual de justificable, y la misma semilla da siempre lo mismo (que es lo que permite
      probarlo).
- [x] **14 · Favorito** — la gestión de presets es de la Fase 8; el modelo ya lo permite.
- [x] **15 · Modo automático** — no se implementa: el apartado dice que **debe ser opcional** y
      "nunca obligar", y activarlo por defecto sería justo lo contrario. Entra con los presets.
- [x] **16 · Libertad manual** — aplicar una propuesta deja todo editable como siempre.

**Cómo se garantiza que "Volver" funciona:** no deshaciendo cambio por cambio, sino haciendo una
**copia profunda de la apariencia ANTES de tocar nada** y restaurándola entera — el mismo patrón
que el borrador del editor de fotos (FO F3). Y la copia se hace **una sola vez**, al empezar a
probar: si se rehiciera en cada prueba, la segunda guardaría la apariencia de la primera y "Volver"
devolvería a una propuesta en vez de a lo que Josué tenía.

**Una foto en blanco y negro sigue dando propuestas.** La Fase 5 dejó `acento: null` como dato
honesto; aquí se usa: en vez de inventar un color, se parte del que Josué **ya tenía**.

**UN FALLO REAL Y PREEXISTENTE, encontrado por las pruebas de contraste de esta fase:**
`ensureContrast` en `colorEngine.js` elegía la dirección con `l <= bgL ? -1 : 1`, o sea por el
**orden relativo** entre los dos colores. Sobre un fondo oscuro, un color aún más oscuro se
oscurecía todavía más: lo empujaba hasta el negro puro y salía del bucle **sin contraste ninguno**.
Afectaba también a la red de seguridad de `aplicarTema` — un texto personalizado casi negro sobre
el fondo oscuro de la app se habría quedado ilegible. Ahora la dirección la decide **el fondo**:
sobre fondo oscuro se aclara, sobre fondo claro se oscurece. Para los casos normales el resultado
es idéntico al de antes, y hay prueba de las dos cosas.

**Y otro hex duplicado que cazó la regla invariante:** el recomendador comparaba el contraste contra
`'#0A0C10'` y `'#F3F4F7'` escritos a mano, que son literalmente `COLORS_OSCURO.bg` y
`COLORS_CLARO.bg`. Ahora se importan: si los temas base cambian, el recomendador se entera solo.

#### FO · Fase 7/12 — PERSONALIZACIÓN MANUAL AVANZADA ✅ COMPLETADA (v1.42.0)

**Esta fase cierra un hueco que las anteriores habían abierto.** FO F4 metió en el modelo el texto
secundario, los iconos activo e inactivo y el fondo de la barra — pero **sin control**: se podían
guardar y no había forma de tocarlos. Aquí se les pone uno.

- [x] **1 · Objetivo** — se puede partir de lo predeterminado, de una foto, de una paleta manual,
      de una recomendación o de un preset, y modificarlo después. *"La recomendación ayuda. El
      usuario decide."*
- [x] **2 · Acceso al editor completo** — el constructor de temas que ya existía (fase V3), ahora
      con los diez campos.
- [x] **3 · Estructura** — Fondo · Colores · Tarjetas, bordes y barra · Estados, en secciones
      plegables.
- [x] **4 · Libertad total** — nada limita a las recomendaciones: se aplican y se editan encima.
- [x] **5 · Editar una recomendación** — aplicar una propuesta deja todos sus valores editables, y
      **no se regenera** nada al cambiar algo: aplicar solo escribe el tema.
- [x] **6 · Control individual** — diez campos de color independientes más cuatro de estados.
- [x] **7 · Color manual** — `ColorPicker` con espectro completo y HEX, de la Fase 4.
- [x] **8 · Transparencia** — tarjetas, barra y ahora **bordes**.
- [x] **9 · Overlay** — activar, color e intensidad, desde el editor de fotografía (FO F3).
- [x] **10 · Bordes** — color (ya estaba) e **intensidad** (nueva). Un borde al 100 % sobre una
      tarjeta translúcida encima de una foto se ve como una caja pegada; bajarlo la integra sin
      quitarle la separación.
- [x] **11 · Sombras** — con tope bajo **a propósito**: el propio apartado pide *"evitar que el
      usuario pueda crear configuraciones visualmente exageradas que hagan que la aplicación
      parezca desordenada"*. De fábrica están apagadas, así que sin tocar nada nada cambia.
- [x] **12 · Degradados** — color inicial, final y dirección, desde FO F1.
- [x] **13 · Navegación** — fondo, iconos activos e inactivos, y su transparencia.
- [x] **14 · Tarjetas** — fondo, transparencia, borde, texto y sombra.
- [x] **15 · Botones** — salen de `buildRolesFromAccent`, que ya deriva fondo, texto y estados.

**El detalle que hace que todo esto sea seguro:** cada añadido nuevo tiene su valor de fábrica
igual al comportamiento anterior — sombra 0, borde al 100 %, transparencias al 100 %. **Sin tocar
nada, la app se ve exactamente como antes.** Es lo que permite añadir controles sin arriesgar una
regresión visual.

**Y el que evita un coste inútil:** sin sombra, `cardShadow` es `'none'`, no una sombra de opacidad
cero. Una sombra invisible sigue costando pintado en cada tarjeta, y hay muchas por pantalla.

#### FO · Fase 8/12 — PRESETS Y CONFIGURACIONES GUARDADAS
- [ ] OBJETIVO
- [ ] QUÉ ES UN PRESET
- [ ] CREAR PRESET
- [ ] NOMBRES PERSONALIZADOS
- [ ] LISTA DE PRESETS
- [ ] PRESET ACTIVO
- [ ] CAMBIAR DE PRESET
- [ ] VISTA PREVIA
- [ ] DUPLICAR PRESET
- [ ] EDITAR PRESET
- [ ] GUARDAR COMO NUEVO
- [ ] ELIMINAR PRESET
- [ ] PRESETS PREDETERMINADOS
- [ ] NO MODIFICAR PRESETS OFICIALES
- [ ] FAVORITOS
- [ ] ORDEN
- [ ] Activo.
- [ ] Favoritos.
- [ ] Recientes.
- [ ] Resto.
- [ ] PRESETS RECIENTES
- [ ] CONFIGURACIÓN COMPLETA
- [ ] INDEPENDENCIA ENTRE PRESETS
- [ ] FOTOGRAFÍAS Y PRESETS
- [ ] PERSISTENCIA
- [ ] EXPERIENCIA DE CAMBIO
- [ ] LÍMITE DE PRESETS
- [ ] EXPORTACIÓN FUTURA
- [ ] PREPARACIÓN PARA LA FASE 9
- [ ] CRITERIOS DE FINALIZACIÓN
- [ ] REGLA PARA CLAUDE

#### FO · Fase 9/12 — LEGIBILIDAD Y CONTRASTE INTELIGENTE
- [ ] OBJETIVO
- [ ] COMPROBACIÓN AUTOMÁTICA
- [ ] TEXTO SOBRE FOTOGRAFÍAS
- [ ] TEXTO SOBRE COLORES
- [ ] INDICADOR DE LEGIBILIDAD
- [ ] PROPUESTA DE CORRECCIÓN
- [ ] NO CAMBIAR SIN PERMISO
- [ ] MODO AUTOMÁTICO
- [ ] CONTROL MANUAL
- [ ] OVERLAY INTELIGENTE
- [ ] DESENFOQUE COMO RECURSO
- [ ] TARJETAS Y SUPERFICIES
- [ ] NAVEGACIÓN
- [ ] BOTONES
- [ ] ICONOS
- [ ] CONTRASTE LOCAL
- [ ] DIFERENCIACIÓN ENTRE ELEMENTOS
- [ ] ESTADOS ACTIVOS
- [ ] MODO CLARO Y OSCURO
- [ ] AVISOS NO INTRUSIVOS
- [ ] RESUMEN DE PROBLEMAS
- [ ] NIVEL DE SEGURIDAD VISUAL
- [ ] INTEGRACIÓN CON «RECOMENDADO»
- [ ] INTEGRACIÓN CON PRESETS
- [ ] INTEGRACIÓN CON PERSONALIZACIÓN MANUAL
- [ ] ACCESIBILIDAD
- [ ] RENDIMIENTO
- [ ] CRITERIOS DE FINALIZACIÓN
- [ ] REGLA PARA CLAUDE

#### FO · Fase 10/12 — INTEGRACIÓN COMPLETA EN ASPECTO | JC FITNESS
- [ ] OBJETIVO
- [ ] ESTRUCTURA PRINCIPAL
- [ ] NO SATURAR LA PANTALLA
- [ ] FONDO ACTUAL
- [ ] ACCESO RÁPIDO
- [ ] VISTA PREVIA GLOBAL
- [ ] NAVEGACIÓN ENTRE EDITORES
- [ ] FLUJO COMPLETO
- [ ] CAMBIAR DE FONDO SIN PERDER CONFIGURACIONES
- [ ] CAMBIAR COLORES SIN CAMBIAR FOTO
- [ ] RECOMENDADO COMO OPCIÓN, NO COMO OBLIGACIÓN
- [ ] PERSONALIZACIÓN MANUAL COMO ÚLTIMO NIVEL
- [ ] SISTEMA DE ESTADOS
- [ ] PRESETS Y PERSONALIZACIÓN
- [ ] LEGIBILIDAD INTEGRADA
- [ ] MODO OSCURO/CLARO
- [ ] CONFIGURACIÓN PREDETERMINADA
- [ ] CONFIRMACIÓN INTELIGENTE
- [ ] EXPERIENCIA MÓVIL
- [ ] ANIMACIONES
- [ ] COHERENCIA VISUAL
- [ ] SISTEMA CENTRAL
- [ ] ACTUALIZACIÓN EN TIEMPO REAL
- [ ] PERSISTENCIA
- [ ] MANEJO DE ERRORES
- [ ] ACCESIBILIDAD
- [ ] RENDIMIENTO
- [ ] CRITERIOS DE FINALIZACIÓN
- [ ] REGLA PARA CLAUDE

#### FO · Fase 11/12 — RENDIMIENTO, OPTIMIZACIÓN Y EXPERIENCIA
- [ ] OBJETIVO
- [ ] PRINCIPIO FUNDAMENTAL
- [ ] OPTIMIZACIÓN DE FOTOGRAFÍAS
- [ ] DIFERENTES VERSIONES DE UNA FOTO
- [ ] CARGA DIFERIDA
- [ ] CACHÉ
- [ ] CACHÉ DEL DETECTOR DE COLORES
- [ ] PREVISUALIZACIÓN OPTIMIZADA
- [ ] APLICACIÓN FINAL
- [ ] EFECTOS VISUALES
- [ ] ANIMACIONES
- [ ] RENDERIZADO
- [ ] ESTADO CENTRALIZADO
- [ ] APERTURA DE ASPECTO
- [ ] APERTURA DE PRESETS
- [ ] USO DE MEMORIA
- [ ] COMPATIBILIDAD CON IPHONE
- [ ] COMPATIBILIDAD CON ANDROID
- [ ] RED
- [ ] FUNCIONAMIENTO OFFLINE
- [ ] SEGURIDAD Y VALIDACIÓN
- [ ] LÍMITES RAZONABLES
- [ ] RECUPERACIÓN DE ERRORES
- [ ] CAMBIOS RÁPIDOS
- [ ] CAMBIOS RÁPIDOS DE COLORES
- [ ] GENERACIÓN DE RECOMENDACIONES
- [ ] PERSISTENCIA EFICIENTE
- [ ] PRUEBAS
- [ ] PRUEBAS DE REGRESIÓN
- [ ] MÉTRICAS
- [ ] OBJETIVO DE EXPERIENCIA
- [ ] CRITERIOS DE FINALIZACIÓN
- [ ] REGLA PARA CLAUDE

#### FO · Fase 12/12 — ELIMINADOS RECIENTEMENTE, RECUPERACIÓN Y CIERRE DEL SISTEMA
- [ ] OBJETIVO
- [ ] INFORMACIÓN DEL ELEMENTO
- [ ] RECUPERAR
- [ ] ELIMINAR DEFINITIVAMENTE
- [ ] VACIAR ELIMINADOS RECIENTEMENTE
- [ ] TIEMPO DE RETENCIÓN
- [ ] NO ELIMINAR EL FONDO ACTIVO ACCIDENTALMENTE
- [ ] PRESETS QUE UTILIZAN FOTOGRAFÍAS
- [ ] RECUPERACIÓN DE DEPENDENCIAS
- [ ] ELIMINAR UN PRESET
- [ ] ELIMINAR UNA FOTOGRAFÍA
- [ ] SUSTITUIR FOTOGRAFÍA
- [ ] CONFIRMACIÓN INTELIGENTE
- [ ] RECUPERAR CONFIGURACIÓN COMPLETA
- [ ] RECUPERACIÓN DE FOTOGRAFÍAS
- [ ] ESTADOS
- [ ] PROTECCIÓN CONTRA DUPLICADOS
- [ ] SINCRONIZACIÓN FUTURA
- [ ] SEGURIDAD
- [ ] COPIAS Y RESTAURACIÓN
- [ ] EXPERIENCIA VISUAL
- [ ] ELEMENTOS VACÍOS
- [ ] CIERRE DEL SISTEMA
- [ ] PRUEBA FINAL OBLIGATORIA
- [ ] CRITERIOS DE FINALIZACIÓN
- [ ] RESULTADO FINAL DE LAS 12 FASES
- [ ] NO romper funcionalidades existentes.
- [ ] NO eliminar módulos actuales.
- [ ] NO implementar las 12 fases de golpe.
- [ ] Ejecutar únicamente la fase que yo indique.
- [ ] Mantener compatibilidad con las fases anteriores.
- [ ] Preparar las estructuras necesarias para fases posteriores sin implementar prematuramente toda su funcionalidad.
- [ ] El usuario siempre debe conservar control manual.
- [ ] Recomendado nunca debe sobrescribir modificaciones manuales.
- [ ] Las fotografías originales no deben modificarse destructivamente.
- [ ] Los presets deben conservar configuraciones completas.
- [ ] Las eliminaciones importantes deben poder recuperarse.
- [ ] La interfaz debe seguir siendo premium y sencilla.
- [ ] Todo debe funcionar correctamente en móvil/PWA.
- [ ] Optimizar antes de introducir efectos innecesariamente pesados.
- [ ] Si existe una funcionalidad ya implementada que puede reutilizarse, reutilizarla en lugar de duplicarla.
- [ ] Si una fase requiere modificar arquitectura existente, hacerlo de forma compatible y segura.
- [ ] Antes de terminar una fase, comprobar que las funcionalidades existentes siguen funcionando.
- [ ] RESTRICCIONES IMPORTANTES
- [ ] REGLA PRINCIPAL PARA CLAUDE

---

## BI · BUSCADOR GLOBAL + IA + DESPLEGABLE DE INICIO — 4 fases

Rediseña el desplegable de Inicio y convierte el botón superior izquierdo en un acceso único de búsqueda + IA. **Amplía `UniversalSearchModal` y `SuggestionsButton` (Fase 18), no los sustituye.** La Fase 1 se solapa con el `IndicadorContexto` del Dashboard ya construido.

#### BI · Fase 1/4 — REDISEÑO DEL DESPLEGABLE DE INICIO ✅ COMPLETADA (v1.28.0)
- [x] COMPORTAMIENTO PRINCIPAL — cerrado por defecto, una sola fila de alto.
- [x] ESTADO ABIERTO — muestra las tres situaciones **y sus consejos**.
- [x] ANIMACIÓN DE APERTURA — `grid-template-rows` 0fr↔1fr + opacidad + desplazamiento de 4px,
      con `--ease-premium`. **No** es `display:none → block`.
- [x] BOTÓN DE EXPANSIÓN — chevron que rota 180° con transición; **toda la cabecera** es pulsable,
      no solo el icono.
- [x] CONTENIDO DEL DESPLEGABLE — **este era el hueco real de la fase.** Antes solo se podían LEER
      consejos; para cambiar de situación había que salir a Personalización. Ahora las tres
      situaciones se activan desde el propio desplegable.
- [x] DISEÑO VISUAL — mismo lenguaje que el resto: `COLORS.surface`, borde de 1px, `rounded-3xl`,
      sin sombras ni adornos nuevos.
- [x] PRIORIDAD: ESPACIO EN PANTALLA — el alto cambia **físicamente**; cerrado no reserva nada.
- [x] RESPONSIVE / MÓVIL — zona táctil de fila completa, chips con `flex-wrap`, `truncate` en la
      etiqueta. ⚠️ El aspecto final en un iPhone real sigue pendiente de Josué (**R1**).
- [x] ESTADO Y PERSISTENCIA — un único `expandido` local. **No se guarda en Supabase**: la
      especificación dice que no se creen datos innecesarios, y abrir/cerrar no es una preferencia.
- [x] ACCESIBILIDAD Y USABILIDAD — `aria-expanded`, `aria-controls` apuntando a un id que existe de
      verdad, `role="region"` con nombre, y `aria-pressed` en cada situación (son interruptores).
- [x] NO ROMPER NADA EXISTENTE
  - [x] Localiza cómo está implementado actualmente. — `IndicadorContexto` en `DashboardView.jsx`.
  - [x] Identifica todos los estados relacionados. — `personalizacion.modo` y el `expandido` local.
  - [x] Identifica todos los datos que utiliza. — `MODOS_APP` de `tokens.js`. Nada más.
  - [x] Identifica todas las acciones que ejecuta. — `setModoApp` (toggle) en `App.jsx`.
  - [x] Mantén esas funcionalidades. — cero datos nuevos; el selector de Personalización sigue ahí
        y toca el mismo interruptor (decisión **D2-07**: integrar, no duplicar).
  - [x] Cambia únicamente la presentación y el comportamiento necesario. — un solo componente
        tocado, más la prop `onSetModo` que lo alimenta.
- [x] CONTROL DE CALIDAD — 18 comprobaciones automáticas (`scripts/test-inicio.jsx`), en
      `verificar.sh`.
- [x] REGLA IMPORTANTE — el espacio ocupado cambia de verdad, no es una tarjeta grande que recorta
      contenido.
- [x] RESULTADO FINAL ESPERADO — cerrado: `Situación · etiqueta ⌄`. Abierto: las tres situaciones
      con sus opciones y consejos.
- [x] Comprueba que no se ha roto ninguna funcionalidad existente. — 223 comprobaciones en verde.
- [ ] Comprueba el comportamiento en móvil. — ⚠️ **solo lo puede hacer Josué** (R1).
- [x] Comprueba apertura y cierre repetidos. — es un booleano con transición CSS, sin estado
      acumulado que se pueda desincronizar.
- [ ] Comprueba modo oscuro/claro si ambos existen. — ⚠️ **pendiente de verificación visual**. El
      componente solo usa tokens de `COLORS`, así que sigue el tema por construcción.
- [x] Comprueba que no quedan espacios vacíos al cerrar. — el contenedor colapsa a 0fr; el padding
      inferior vive **dentro** del panel, no en el contenedor.
- [x] No avances automáticamente a la Fase 2. — respetado: BI F2 va en su propio turno.

**Hallazgo de esta fase, apuntado para no repetirlo:** el componente entero era un `<button>`. Meter
dentro los selectores de situación habría dado **botones anidados** — HTML inválido que no rompe el
render y que en iOS hace que el toque interior se lo coma el exterior. Ahora la cabecera es el botón
y el contenido su hermano, y `scripts/smoke-vistas.jsx` comprueba lo mismo en **las 13 vistas × 4
escenarios**, para que no vuelva a colarse en ningún sitio.

#### BI · Fase 2/4 — Acceso superior izquierdo: búsqueda/IA ✅ COMPLETADA (v1.29.0)
- [x] Buscar cualquier función, pantalla, ajuste u opción existente. — 19 módulos + 14 funciones
      de dentro de Ajustes.
- [x] Encontrar opciones aunque el usuario no escriba exactamente su nombre. — "dinero" → Economía,
      "dormir" → Sueño, "modo noche" → Colores y tema. Sin tildes y sin mayúsculas también.
- [x] Acceder directamente al resultado encontrado. — pulsar abre el sitio exacto, categoría de
      Ajustes incluida; no deja a Josué en la lista para que la busque él.
- [x] Hacer preguntas a la IA cuando no esté buscando una función concreta.
- [x] Mantener una experiencia rápida, limpia y premium. — búsqueda local sobre ~33 entradas, sin
      red y sin debounce.
- [x] BOTÓN SUPERIOR IZQUIERDO — la lupa se muda a la izquierda; el panel de sugerencias se va a la
      derecha. **Se intercambian, no se elimina ninguno**: son cosas distintas y la especificación
      prohíbe quitar funcionalidad.
- [x] APERTURA DEL BUSCADOR — el mismo modal con `createPortal` de siempre (regla 3).
- [x] CAMPO DE BÚSQUEDA — icono, campo, botón de limpiar, botón de cerrar y foco automático al
      abrirse.
- [x] DOS TIPOS DE BÚSQUEDA — funciones (índice local) y preguntas (IA sobre los datos).
- [x] BÚSQUEDA INTELIGENTE — nombre, descripción y palabras clave, con sinónimos escritos a mano
      porque no se pueden derivar de nada ("dinero" no aparece en ningún sitio del código).
- [x] ÍNDICE INTERNO DE FUNCIONES — `src/lib/indiceBusqueda.js`, con `id/titulo/descripcion/
      palabras/categoria/tab/icono`, tal cual pide el apartado 6.
- [x] RESULTADOS — aparecen mientras escribe, con icono, nombre, ubicación y descripción.
- [x] ORDEN DE RESULTADOS — los cinco escalones del apartado 8, con los pesos lo bastante separados
      como para que ninguna suma de coincidencias débiles adelante a una fuerte:
  - [x] Coincidencia exacta. (1000)
  - [x] Coincidencia con el nombre. (800 empieza / 600 contiene)
  - [x] Coincidencia con palabras clave. (500 / 400 / 300)
  - [x] Coincidencia con descripción. (150)
  - [x] Coincidencias semánticamente relacionadas. (80 — todas las palabras sueltas presentes)
- [x] RESULTADO SIN COINCIDENCIAS — "No hemos encontrado esa función" + ofrecer la IA. Nunca una
      pantalla vacía.
- [x] IA — recibe el texto ya escrito; no se le pide que lo repita.
- [x] DIFERENCIACIÓN ENTRE BÚSQUEDA Y PREGUNTA — detecta la intención y, cuando hay las dos cosas,
      **enseña las dos**. "¿cómo cambio los colores?" saca la IA arriba y Apariencia debajo.
- [x] ACCESO DIRECTO — reutiliza `navegarDesdeHoy`, el deep-link que ya existía. Ni un sistema de
      navegación nuevo.
- [x] ANIMACIONES — `active:scale` en la lupa y en cada resultado. Sin efectos de entrada por
      resultado: el apartado 13 dice "VELOCIDAD > EFECTOS" y animar una lista que cambia con cada
      tecla la haría parecer más lenta, no más premium.
- [x] MÓVIL — la lista de resultados scrollea dentro de `46vh`, así que con el teclado abierto el
      campo sigue visible y los resultados no quedan detrás. ⚠️ Comprobación real en iPhone:
      pendiente de Josué (**R1**).
- [x] CIERRE — botón X, toque fuera del panel, y el estado temporal se va con el modal.
- [x] NO MODIFICAR LA IA ACTUAL SIN NECESIDAD — se **amplía** `UniversalSearchModal`; `askAI` y la
      función serverless no se tocan, y ninguna clave sale al frontend.
- [x] ARQUITECTURA PREPARADA PARA CRECER — el índice se **deriva de `MORE_NAV`**, así que un módulo
      que una fase futura añada ahí aparece solo. Y `comprobar-navegacion.mjs` falla si alguien
      añade un módulo sin palabras clave, o deja palabras de uno que ya no existe.
- [x] SEGURIDAD — el índice es de funciones, **no contiene ni un dato de Josué**. Relación se
      encuentra como pantalla, pero abrirla sigue pasando por su PIN: el buscador navega, no salta
      protecciones.
- [x] CONTROL DE CALIDAD — las nueve búsquedas del apartado 19, automatizadas en
      `scripts/test-buscador.mjs` (58 comprobaciones).
- [x] REGLA FUNDAMENTAL — BUSCAR → ENCONTRAR → ABRIR, y PREGUNTAR → IA → RESPUESTA, desde el mismo
      acceso.

**Decisión de honestidad, apuntada:** el control de calidad pide que "racha" y "sonidos" encuentren
sus módulos *"si el módulo existen"*. Rachas y Sonido son fases futuras y **no se han fingido**
(regla 8). "racha" lleva a Productividad, que es donde están hoy las rachas de hábitos de verdad;
"sonidos" no devuelve nada. La prueba comprueba justo eso: que no aparezca un módulo inventado.

**Un fallo silencioso corregido de paso:** `TextInput` era un componente de función normal, así que
se tragaba la `ref` sin decir nada — el foco automático del campo simplemente no habría ocurrido, sin
error ni aviso. Ahora usa `forwardRef`. Es aditivo: ninguno de los ~60 usos anteriores pasa `ref`.

#### BI · Fase 3/4 — MOTOR DE BÚSQUEDA GLOBAL E ÍNDICE INTELIGENTE ✅ COMPLETADA (v1.30.0)
- [x] PRINCIPIO FUNDAMENTAL — el flujo del apartado 1, entero y **local**: normalizar → analizar →
      índice → relevancia → resultados → acción. La IA no interviene para encontrar una función.
- [x] ÍNDICE GLOBAL — `src/lib/indiceBusqueda.js`, una única fuente de verdad.
- [x] INFORMACIÓN DE CADA FUNCIÓN — `id`, `titulo`, `descripcion`, `categoria`, `palabras`,
      `sinonimos`, `icono`, `tab`, `foco`, `tipo` y `prioridad`. Los once campos del apartado 3,
      con nombres en castellano como el resto del proyecto.
- [x] NORMALIZACIÓN DE TEXTO — minúsculas, tildes, espacios, signos de puntuación y **singular /
      plural**. "Configuración" y "configuracion" son lo mismo; "colores" y "color", también.
- [x] COINCIDENCIA EXACTA — máxima prioridad, por delante de cualquier descripción.
- [x] COINCIDENCIA PARCIAL — "colo" → Colores, "entren" → Entrenamiento, "dormi" → Sueño.
- [x] PALABRAS RELACIONADAS — palabras clave **y** sinónimos, en dos escalones distintos.
      Controlado y escrito a mano; nada de asociaciones automáticas impredecibles.
- [x] RANKING DE RESULTADOS — nueve escalones, del título exacto (1000) a la errata (40).
- [x] DESAMBIGUACIÓN — "objetivo" devuelve varias opciones ordenadas, con Objetivos primero. No
      elige arbitrariamente, y el orden es **determinista**: la misma consulta da siempre lo mismo.
- [x] ACCIONES DIRECTAS — "nueva tarea" no abre Productividad para que Josué busque el botón: abre
      el formulario.
- [x] FUNCIONES SIN RUTA — tres tipos de destino: `pantalla`, `ajuste` (abre su categoría) y
      `accion` (abre un formulario). El buscador ya no está limitado a páginas.
- [x] ÍNDICE POR CATEGORÍAS — Módulo / Ajustes / Acción. **Sin inventar Rachas ni Sonidos**, que
      todavía no existen (lo dice el propio apartado 12).
- [x] ACTUALIZACIÓN DEL ÍNDICE — los módulos se **derivan de `MORE_NAV`**, así que uno nuevo
      aparece solo. Y `comprobar-navegacion.mjs` falla si se añade sin palabras clave: el índice no
      puede quedarse desconectado de la aplicación, que es lo que el apartado 13 quiere evitar.
- [x] BÚSQUEDA DE AJUSTES — 15 entradas de configuración, cada una abriendo su categoría.
- [x] BÚSQUEDA DE FUNCIONES PROFUNDAS — el ejemplo literal del apartado 15: "modo oscuro" tiene
      entrada propia aunque viva dentro de Apariencia, y abre directamente ahí.
- [x] HISTORIAL RECIENTE — 4 accesos, con botón de limpiar. **Guarda ids de funciones, nunca el
      texto escrito** (una búsqueda puede ser una pregunta personal) y vive en `localStorage`, no
      en Supabase: no es un dato que merezca sincronizarse ni entrar en la copia de seguridad.
- [x] SUGERENCIAS INICIALES — Sueño, Entrenamiento, Economía y Ajustes, **sacadas del índice real**;
      un módulo desactivado no se sugiere.
- [x] TOLERANCIA A ERRORES — "colroes" encuentra Colores y avisa con "¿Quizá buscas…?".
- [x] RENDIMIENTO — todo local sobre ~38 entradas normalizadas una sola vez al construir el índice.
      Ni red, ni IA, ni debounce.
- [x] IA COMO FALLBACK — el flujo del apartado 20 exacto: si hay función, se muestra; si no la hay
      o es una pregunta, se ofrece la IA. Y si hay las dos cosas, se enseñan las dos.
- [x] PRIVACIDAD — escribir "colores" **no sale del dispositivo**. La prueba lo comprueba leyendo
      el propio archivo del motor: no importa `askAI` ni hace `fetch`.
- [x] PRUEBAS OBLIGATORIAS — las seis categorías del apartado 22 (exactas, parciales, sinónimos,
      erratas, preguntas y sin resultados), en `scripts/test-buscador.mjs` — 99 comprobaciones.
- [x] CRITERIO DE ÉXITO — los nueve puntos del apartado 23.
- [x] REGLA FINAL — añadir una función al buscador es **una entrada** en el índice; un módulo nuevo
      en `MORE_NAV` ni eso.

**Dos bugs reales que encontraron las pruebas de esta fase:**

1. **El singular/plural atropellaba palabras clave escritas literalmente.** Buscar "pantallas"
   abría *Pantalla principal* (que solo coincide después de quitarle la 's') en vez de Bienestar,
   que tiene "pantallas" tal cual entre sus palabras. La causa era estructural: `puntuar` iba
   devolviendo el primer acierto por campos, así que una coincidencia floja en el título ganaba a
   una fuerte en las palabras clave. Ahora se evalúan todos los escalones y se coge el mayor, y el
   plural tiene su propio escalón por debajo de la coincidencia literal.
2. **La raíz destrozaba palabras cortas acabadas en 's'**: "tres" se quedaba en "tre", "mes" en
   "me". El umbral pasó de 3 a 4 letras.

**Y una decisión de diseño que salió de una prueba fallida:** la distancia de edición es de
**Damerau**-Levenshtein, no Levenshtein a secas. Con Levenshtein, "colroes" está a 2 errores de
"colores" y no se encontraba; contando el intercambio de dos letras seguidas como UN error, se
encuentra. Las transposiciones son con diferencia la errata más común escribiendo deprisa en un
móvil — y es justo el ejemplo que pone la especificación.

#### BI · Fase 4/4 — INTEGRACIÓN FINAL: BUSCADOR + IA + INTENCIÓN ✅ COMPLETADA (v1.31.0)
- [x] EXPERIENCIA PRINCIPAL — un solo sistema desde la lupa. Josué no tiene que decidir si busca o
      pregunta: escribe y JosStyle decide.
- [x] CASO: EL USUARIO BUSCA UNA FUNCIÓN — resultado + abrir directo, sin pantallas intermedias.
- [x] CASO: EL USUARIO HACE UNA PREGUNTA — la IA arriba, con la pregunta ya escrita.
- [x] CASO: EXISTEN LAS DOS POSIBILIDADES — "¿Cómo cambio los colores?" enseña **las dos**.
- [x] DETECCIÓN DE INTENCIÓN — las tres categorías del apartado 5: navegación, pregunta y **acción**.
- [x] DETECCIÓN HÍBRIDA — no depende del signo '¿'. "cambiar colores" se detecta como acción por el
      verbo; una frase larga sin verbo ni interrogación va a la IA.
- [x] PRIORIDAD — con una función encontrada y una intención que no sea preguntar, **la función va
      primero** y la IA queda debajo. No se gasta una llamada a la IA en algo que la app hace sola.
- [x] PREGUNTAS ABIERTAS — "¿Qué ejercicios para mejorar mi planche?" → la IA manda.
- [x] RESPUESTA DE LA IA — dentro del mismo modal, con los mismos tokens, tipografía y bordes. No
      hay una segunda experiencia visual.
- [x] CONTEXTO DE JOSSTYLE — se mantiene el `buildContext` de siempre; ni más datos ni menos.
- [x] NAVEGACIÓN DE VUELTA — **arreglado un hueco real**: buscar "colores" desde Inicio y pulsar
      atrás dejaba a Josué en el hub de "Más", donde no había estado. Ahora vuelve a donde estaba.
- [x] CIERRE DEL SISTEMA — cerrar no toca ningún dato ni ejecuta nada.
- [x] ESTADOS DE LA INTERFAZ — los ocho:
  - [x] 1 cerrado · [x] 2 abierto sin texto (recientes + sugerencias) · [x] 3 escribiendo
  - [x] 4 con resultados · [x] 5 pregunta detectada · [x] 6 sin resultados
  - [x] 7 respuesta de la IA · [x] 8 error con reintentar
- [x] ESTADO DE CARGA — "Pensando…" con su rueda; el resto de la app sigue viva.
- [x] ERRORES DE IA — **nada técnico**: un mensaje con pinta de código o número de estado se
      sustituye por "No he podido responder ahora mismo", con **Reintentar** y el buscador intacto.
- [x] SEGURIDAD DE LA IA — sigue pasando por `api/ask-ai.js`; ninguna clave en el frontend.
- [x] RENDIMIENTO — la búsqueda es local e instantánea; la IA solo cuando se pulsa.
- [x] DISEÑO MÓVIL — lista con scroll propio, campo siempre visible con el teclado abierto.
      ⚠️ Comprobación real en iPhone: pendiente de Josué (**R1**).
- [x] MICROINTERACCIONES — solo las que pide el apartado: pulsación, apertura, selección, cierre.
- [x] PRUEBAS COMPLETAS — **los ocho casos del apartado 20, literales**, en
      `scripts/test-buscador.mjs`.
- [x] PRUEBA DE NO REGRESIÓN — 352 comprobaciones en verde: build, 52 casos de renderizado de las
      13 vistas y las 9 reglas invariantes.
- [x] NO SOBREDISEÑAR — un campo, una lista, un botón de IA. Sin menús ni pestañas dentro.
- [x] RESULTADO FINAL — lupa arriba a la izquierda, sugerencias arriba a la derecha, y **los paneles
      de IA de cada módulo intactos**: el apartado 23 pide expresamente que el buscador nuevo no
      rompa el acceso inferior existente.
- [x] CRITERIO DEFINITIVO DE ÉXITO — "no sé dónde está algo" → lupa → "colores" → abrir → allí.

**Lo que hacía falta para cumplir el apartado 7, y no era obvio:** buscar la frase entera no
encontraba nada. "quiero añadir un objetivo" no coincide con ninguna entrada, porque ninguna
contiene la palabra "quiero". Sin quitar ese envoltorio, la prioridad de la función sobre la IA era
imposible de cumplir: no había función que priorizar. Ahora `nucleoDeConsulta` deja "anadir
objetivo" y el resultado sale — pero solo **si la frase entera no ha encontrado nada**, para no
aflojar una búsqueda que ya era precisa.

**La decisión sobre toda la lógica de intención:** vive en `indiceBusqueda.js`, no en el componente.
Así los ocho casos del apartado 20 son ocho llamadas a `resolverConsulta()` que se prueban sin
renderizar nada, y la interfaz solo pinta lo que le dicen.

---

---

## ME · LIBERTAD DE APARTADOS + ELIMINADOS RECIENTEMENTE — 4 fases

Sistema global de módulos activables/desactivables, personalización y papelera universal con recuperación. **Las fases 1 y 2 se solapan casi por completo con `PersonalizationView` y `personalizacion.ocultos` (Fase 19), ya construidos** — aquí el trabajo real es la papelera (fase 3) y la auditoría de integración global (fase 4).

#### ME · Fase 1/4 — SISTEMA DE MÓDULOS ACTIVABLES/DESACTIVABLES ✅ **COMPLETADA (v1.24.0)**

> **Qué se construyó:** "Personalizar mi sistema" en Ajustes → Pantalla principal — centro de
> módulos agrupado por área, con icono, nombre, **descripción**, estado e **interruptor ON/OFF**
> real (nuevo componente `Switch` compartido). Confirmación al desactivar que insiste en que los
> datos se conservan; ninguna al reactivar.
>
> **La parte importante:** desactivar ahora **reconstruye de verdad la interfaz**. Antes de esta
> fase `personalizacion.ocultos` solo filtraba los hubs, así que un módulo desactivado seguía
> apareciendo en "Hoy". Ahora desaparece también de las tarjetas de Nivel 1/2/3, de los avisos, de
> los accesos a Calendario y Agenda, del recordatorio de Relación, de las acciones rápidas (y la
> fila entera se va si no queda ninguna) y **de la puntuación diaria** — si has dicho que no usas
> Sueño, no te baja la nota por no registrarlo.
>
> **Verificado con 16 pruebas de comportamiento** sobre el HTML renderizado (`scripts/test-modulos.jsx`),
> no solo "no revienta": se comprueba que lo desactivado *desaparece* y que lo demás sigue ahí.

**Objetivo**
- [x] El usuario puede decidir qué apartados quiere utilizar

**Centro de módulos**
- [x] Apartado dentro de Ajustes: "Personalizar mi sistema"
- [x] Aparecen todos los módulos disponibles
- [x] Cada módulo con **icono**
- [x] Cada módulo con **nombre**
- [x] Cada módulo con **descripción** (nueva constante `DESCRIPCIONES_MODULOS`, ≤80 caracteres)
- [x] Cada módulo con **estado** visible
- [x] Cada módulo con **interruptor ON/OFF** (nuevo componente `Switch`, accesible por teclado)
- [x] Agrupado por áreas, como muestra la especificación
- [x] Contador de cuántos módulos están activos

**Desactivar no significa eliminar**
- [x] Desactivar **NO borra los datos**
- [x] Deja de aparecer en navegación
- [x] Deja de aparecer en el Dashboard
- [x] Deja de aparecer en accesos rápidos
- [x] Deja de ocupar espacio visual (la fila entera se retira si queda vacía)
- [x] Deja de mostrarse como módulo activo
- [x] Al reactivarlo, todo sigue ahí
- [x] Confirmación al desactivar que dice explícitamente que no se borra nada
- [x] Sin confirmación al reactivar (acción segura y reversible)

**Navegación dinámica**
- [x] Hubs de área (ya funcionaba desde la Fase 19)
- [x] Dashboard — tarjetas de Nivel 1, 2 y 3
- [x] Avisos automáticos (sueño corto, racha en riesgo, examen sin horas)
- [x] Accesos a Calendario y Agenda
- [x] Recordatorio de Relación
- [x] Acciones rápidas
- [x] Puntuación diaria (un módulo desactivado no cuenta ni penaliza)
- [x] "Ajustes" nunca se puede desactivar (regla 40 — sin él no habría vuelta atrás)
- [-] Menú lateral — no existe en esta app (la navegación es de 5 pestañas + hubs)
- [ ] Buscador universal — sigue buscando sobre datos, no sobre funciones. Se aborda en **BI Fase 3**, que es donde se construye el índice de funciones
- [ ] Estadísticas — `StatsView` calcula correlaciones sobre datos, no muestra módulos; se revisará si al construir **ME Fase 2** aparece un caso real

#### ME · Fase 2/4 — PERSONALIZACIÓN TOTAL ✅ **COMPLETADA (v1.25.0)**

**Orden de módulos**
- [x] Permitir cambiar el orden (flechas arriba/abajo, ya existentes desde la Fase 19)
- [ ] **Drag & drop** — decisión documentada: el apartado 103 de Ajustes admite explícitamente
      "controles accesibles equivalentes", y las flechas lo son. Pendiente solo si Josué lo pide

**Dashboard personalizable ("Mi pantalla de inicio")**
- [x] Elegir qué información se ve en la pantalla principal
- [x] Lista de módulos con casilla/interruptor por cada uno
- [x] **Módulo activado ≠ necesariamente visible en Dashboard** (dos listas separadas)
- [x] Contador de cuántos están visibles
- [x] Solo se listan módulos activos (no ofrecer un control que no haría nada)
- [x] Estado vacío honesto si no hay ningún módulo activo

**Navegación personalizable**
- [x] El contenido de cada hub respeta orden, iconos y módulos activos
- [-] Accesos principales configurables — **choca con una regla del propio Josué** (barra inferior
      de exactamente 5 pestañas, nunca una sexta, repetida en dos prompts). Requiere que él decida

**Configuraciones predefinidas**
- [x] Perfil **Completo** (todos los módulos activados)
- [x] Perfil **Estudiante** (Estudios + Productividad + Salud)
- [x] Perfil **Fitness** (Entrenamiento + Nutrición + Sueño + Salud)
- [x] Perfil **Minimalista** (solo lo esencial)
- [x] Los perfiles **NO bloquean** la personalización posterior
- [x] Confirmación previa que dice cuántos apartados quedarán activos
- [x] Un perfil solo cambia qué módulos están activos, nunca el orden/iconos/PIN/favoritas

**Guardado de la personalización**
- [x] Asociada a la cuenta (clave `personalizacion` en Supabase, ya existente)
- [x] Se mantiene al cerrar sesión y volver a entrar
- [x] Se mantiene al cambiar de dispositivo o navegador
- [x] Se mantiene al instalar la PWA
- [x] Sincronizada por la arquitectura actual, sin backend nuevo

**Dependencias entre módulos**
- [x] Modeladas explícitamente (`DEPENDENCIAS_MODULOS`) y verificables por script
- [x] Aviso al desactivar un módulo del que dependen otros activos
- [x] El aviso nombra los módulos afectados
- [x] Nunca deja la app en un estado roto: avisa, no bloquea ni desactiva en cascada
- [x] No avisa de dependientes que Josué ya tiene desactivados (sería ruido)

#### ME · Fase 3/4 — SISTEMA DE ELIMINADOS RECIENTEMENTE ✅ **COMPLETADA (v1.26.0)**

**Objetivo**
- [x] Al eliminar, el elemento NO desaparece para siempre: pasa a la papelera
- [x] Apartado "🗑️ Eliminados recientemente" dentro de Ajustes
- [x] Sistema **global y reutilizable**, no una solución por módulo (26 colecciones)

**Contenido de la papelera**
- [x] Cada elemento muestra información suficiente para identificarlo
- [x] Tipo de elemento visible ("Tarea", "Examen", "Movimiento"...)
- [x] Cuánto hace que se eliminó ("hace 2 horas", "ayer", "hace 3 días")
- [x] Datos relevantes según el tipo de elemento
- [x] Cuántos días le quedan antes de borrarse solo

**Acciones**
- [x] **Recuperar** — devuelve el elemento exactamente donde estaba
- [x] **Eliminar definitivamente** — permanente
- [x] Confirmación previa: "¿Eliminar definitivamente? Este elemento no podrá recuperarse después"
- [x] **Vaciar papelera** con su propia confirmación

**Recuperación (los 7 puntos de la especificación)**
- [x] 1. El elemento vuelve a su módulo original
- [x] 2. Recupera sus datos (el objeto íntegro, no una copia nueva)
- [x] 3. Recupera sus relaciones cuando es posible (cascada asignatura → exámenes + horas)
- [x] 4. Vuelve a aparecer en estadísticas (al volver a su módulo, los cálculos lo recogen solos)
- [x] 5. Vuelve a aparecer en el Dashboard si correspondía
- [x] 6. Se sincroniza con la cuenta (clave `papelera` en Supabase)
- [x] 7. Desaparece de Eliminados recientemente
- [x] **Es una recuperación REAL**, no volver a mostrar una copia — verificado comprobando que el
      estado restaurado es idéntico al de partida

**Tiempo de retención**
- [x] Sistema preparado para establecer un tiempo de retención
- [x] 30 días por defecto
- [x] Fácil de cambiar (constante + selector en la interfaz)
- [x] Opción "Conservar hasta que yo lo elimine definitivamente"
- [x] La purga se aplica al abrir la app y al acortar el plazo

**Información del elemento eliminado (metadatos)**
- [x] ID original
- [x] Tipo de elemento
- [x] Módulo (y colección)
- [x] Fecha de creación
- [x] Fecha de eliminación
- [x] Datos necesarios para la recuperación (el objeto completo)
- [x] Usuario propietario (implícito: la clave vive bajo su `user_id` con RLS)
- [x] Relaciones necesarias (`relacionados`, para el borrado en cascada)
- [x] Información de posición/origen (`indice`)
- [x] **NO se almacena simplemente una etiqueta de "eliminado"**

**Decisiones y límites**
- [x] La papelera entra en el snapshot del deshacer, para que los dos sistemas no se pisen
- [x] Borrado definitivo y vaciado quedan fuera del deshacer (sería contradictorio)
- [x] Privacidad: las entradas de Relación se ocultan mientras el módulo esté bloqueado
- [-] Fotos, vídeos y archivos de Biblioteca — fuera, igual que ya lo estaban del deshacer:
      viven en Storage y mandarlos a la papelera dejaría ficheros huérfanos

#### ME · Fase 4/4 — INTEGRACIÓN GLOBAL ✅ COMPLETADA (v1.27.0)
- [x] Analiza la arquitectura actual. — 21 módulos de datos en `app_data`, sin router, 5 pestañas.
- [x] Identifica los módulos existentes. — 19 en `MORE_NAV`, 4 áreas, 20 `case` de `renderTab`.
- [x] Identifica cómo se almacenan. — `saveData` sobrescribe, `loadData` no fusiona; 22 claves.
- [x] Identifica las relaciones entre datos. — dos cascadas reales: programa → asignatura →
      exámenes/horas. Ninguna otra colección referencia ids de otra.
- [x] Identifica la navegación. — comprobada automáticamente por `scripts/comprobar-navegacion.mjs`.
- [x] Identifica el Dashboard. — respeta `dashboardOcultos` y `modulosDesactivados` desde ME F1/F2.
- [x] Identifica los sistemas actuales de eliminación. — eran 22 `.filter()` repetidos; hoy hay
      **uno**: `eliminarConPapelera(modulo, coleccion, id)`, más 2 cascadas.
- [x] PRINCIPIO FUNDAMENTAL — todo lo que Josué crea, Josué lo puede borrar. Verificado por
      `scripts/auditar-modulos.mjs` (P3), no a ojo.
- [x] PAPELERA / BOTÓN DE ELIMINAR — `BotonBorrar` en `components/ui.jsx`, mismo control en todas
      las listas.
- [x] CONFIRMACIÓN DE ELIMINACIÓN — deliberadamente **no** la pide el borrado normal (es
      reversible vía papelera); sí la piden el borrado definitivo y vaciar la papelera.
- [x] ELIMINACIÓN PERMANENTE — `eliminarDefinitivo` + `vaciarPapelera` + purga por retención.
- [x] El elemento debe desaparecer inmediatamente de la interfaz. — estado local + `snapshotAndSave`.
- [x] Debe eliminarse también de la base de datos/estado correspondiente. — misma llamada.
- [x] Debe mantenerse sincronizado en todos los dispositivos. — va por `app_data`, como el resto.
- [x] No debe reaparecer después de recargar la página.
- [x] No debe reaparecer después de cerrar y abrir la aplicación.
- [x] No debe quedar como un elemento “fantasma” en otra sección. — las cascadas se llevan los
      hijos; comprobado por P5 de la auditoría.
- [x] Las estadísticas relacionadas deben actualizarse correctamente. — todas se derivan del estado,
      no se guardan agregados.
- [x] CUIDADO CON LAS RELACIONES — `conArrastrados` guarda los hijos en la MISMA entrada de
      papelera, así que restaurar devuelve el árbol entero (asignatura → exámenes + horas;
      programa → asignaturas + exámenes + horas).
- [x] ELIMINAR ELEMENTOS PERSONALIZADOS — temas de color guardados y favoritos de Nutrición tienen
      su propio borrado; documentado por qué no van a la papelera.
- [x] EDITAR + ELIMINAR — conviven en la misma fila, sin menú intermedio.
- [x] COMPONENTE REUTILIZABLE — `BotonBorrar`.
- [x] MENÚ DE ACCIONES — **descartado a propósito**: con una sola acción destructiva por fila, un
      menú de tres puntos añade un toque sin añadir nada (regla 8).
- [x] BORRADO EN TODOS LOS MÓDULOS — **la auditoría encontró 7 huecos reales** y se taparon los 7:
  - [x] Sueño — registros de noche
  - [x] Economía — movimientos
  - [x] Salud — medidas
  - [x] Salud — historial médico
  - [x] Nutrición — comidas
  - [x] Fútbol — partidos
  - [x] Estudios — horas de estudio
  - [x] Estudios — **programas** (lo encontró el script, no la revisión a mano)
- [x] DATOS HISTÓRICOS — nada se borra en cascada "por antigüedad"; solo la purga de la papelera.
- [x] ELIMINACIÓN Y ESTADÍSTICAS — ver arriba: derivadas, se recalculan solas.
- [x] PAPELERA / UNDO — los dos sistemas conviven: `papelera` entra en el snapshot de deshacer, así
      que no pueden desincronizarse.
- [x] SEGURIDAD — lo borrado de Relación se enmascara en la papelera mientras el módulo esté
      bloqueado (`describirEntrada` + `privado: true`).
- [x] FUTURAS FUNCIONALIDADES — añadir un módulo a la papelera es **una línea** en
      `CATALOGO_PAPELERA`; la auditoría avisa si alguien olvida ponerla.
- [x] NO ROMPER NADA EXISTENTE — 205 comprobaciones verdes (`bash scripts/verificar.sh`).
- [x] AUDITORÍA FINAL — **ejecutable**, no un documento: `scripts/auditar-modulos.mjs` responde las
      preguntas P3, P5, P7, P7b y P9 en cada verificación.

---

---

## HT · HORARIO TOP — 12 fases

Motor temporal y de planificación: horario configurable, pantalla HOY consciente del tiempo real, mochila inteligente, planificador de huecos, notificaciones contextuales y analítica de uso del tiempo. **Es el módulo más acoplado a lo existente**: Calendario Universal (C1–C3), Productividad, Estudios y el Dashboard Centro de Control cubren ya parte de su superficie.

#### HT · Fase 1/12 — ARQUITECTURA GENERAL DEL SISTEMA
- [ ] OBJETIVO DE ESTA FASE
- [ ] PRINCIPIO FUNDAMENTAL
- [ ] ESTRUCTURA GENERAL
- [ ] TIPOS DE HORARIO
- [ ] HORARIO RECURRENTE VS. HORARIO REAL
- [ ] DISEÑO DE LA CUADRÍCULA
- [ ] COLUMNAS
- [ ] FILAS
- [ ] BLOQUES VISUALES
- [ ] PERSONALIZACIÓN VISUAL
- [ ] IDENTIDAD DE LAS ACTIVIDADES
- [ ] SISTEMA DE ENTIDADES
- [ ] CONEXIÓN CON EL SISTEMA PERSONAL
- [ ] EL SISTEMA “HOY”
- [ ] SISTEMA DE PRIORIDADES
- [ ] PREPARACIÓN PARA LA MOCHILA
- [ ] PREPARACIÓN PARA NOTIFICACIONES
- [ ] PREPARACIÓN PARA IA
- [ ] PREPARACIÓN PARA SUPABASE
- [ ] SINCRONIZACIÓN
- [ ] OFFLINE
- [ ] ESCALABILIDAD
- [ ] PERIODOS Y SEMANAS
- [ ] CAMBIO DE HORARIO
- [ ] PRINCIPIO DE NO DUPLICACIÓN
- [ ] EXPERIENCIA DE USUARIO
- [ ] DISEÑO MOBILE-FIRST
- [ ] ARQUITECTURA MODULAR
- [ ] EVENTOS DEL SISTEMA
- [ ] FUTURO SISTEMA DE AUTOMATIZACIONES
- [ ] RESULTADO ESPERADO DE ESTA FASE

#### HT · Fase 2/12 — MODELO DE DATOS + CLOUD + SUPABASE
- [ ] OBJETIVO
- [ ] PRINCIPIO DE LA BASE DE DATOS
- [ ] USUARIO
- [ ] IDENTIFICADORES
- [ ] TABLA
- [ ] HORARIOS SIMULTÁNEOS
- [ ] PERIODOS DE VALIDEZ
- [ ] NO LIMITAR LAS FILAS
- [ ] TIPOS DE ACTIVIDAD
- [ ] BLOQUES CON DURACIONES DIFERENTES
- [ ] COLOR GLOBAL VS COLOR DEL BLOQUE
- [ ] ICONOS
- [ ] TIPOS DE EXCEPCIÓN
- [ ] REGLA DE PRIORIDAD
- [ ] CALENDARIO
- [ ] EVITAR DUPLICACIONES
- [ ] RECURRENCIA
- [ ] RELACIÓN ACTIVIDAD ↔ MATERIAL
- [ ] PREPARACIÓN DE LA MOCHILA
- [ ] RECORDATORIOS
- [ ] NOTIFICACIONES FUTURAS
- [ ] VISTA
- [ ] EJEMPLO DE GENERACIÓN DE HOY
- [ ] SUPABASE
- [ ] ROW LEVEL SECURITY
- [ ] SEGURIDAD
- [ ] ÍNDICES
- [ ] SOFT DELETE
- [ ] SINCRONIZACIÓN MULTIDISPOSITIVO
- [ ] CONFLICTOS
- [ ] CACHE LOCAL
- [ ] DATOS MÍNIMOS VS DATOS AVANZADOS
- [ ] CONFIGURACIÓN DEL USUARIO
- [ ] HISTORIAL
- [ ] ESTRUCTURA RELACIONAL GENERAL
- [ ] FLUJO DE INFORMACIÓN
- [ ] PREPARACIÓN PARA IA AVANZADA
- [ ] Obtiene fecha.
- [ ] Consulta horarios activos.
- [ ] Calcula recurrencias.
- [ ] Aplica excepciones.
- [ ] Obtiene eventos.
- [ ] Obtiene tareas.
- [ ] Obtiene recordatorios.
- [ ] Obtiene material.
- [ ] Construye contexto.
- [ ] Genera respuesta.
- [ ] FUTURA CAPA DE ACCIONES DE IA
- [ ] VALIDACIONES
- [ ] PREPARACIÓN PARA ESCALABILIDAD
- [ ] REGLA DE COMPATIBILIDAD CON EL SISTEMA PERSONAL
- [ ] RESULTADO DE LA FASE 2
- [ ] LO QUE NO SE IMPLEMENTA TODAVÍA
- [ ] SIGUIENTE FASE

#### HT · Fase 3/12 — EDITOR VISUAL DE HORARIOS
- [ ] OBJETIVO DE LA FASE
- [ ] ENTRADA AL EDITOR
- [ ] PLANTILLAS INICIALES
- [ ] PRIMERA VISTA
- [ ] PRINCIPIO MOBILE-FIRST
- [ ] NAVEGACIÓN HORIZONTAL
- [ ] COLUMNA DE HORAS FIJA
- [ ] AÑADIR COLUMNAS
- [ ] ELIMINAR COLUMNAS
- [ ] REORDENAR COLUMNAS
- [ ] AÑADIR FILAS
- [ ] ELIMINAR FILAS
- [ ] EDITAR HORAS
- [ ] FRANJAS IRREGULARES
- [ ] CREAR UN BLOQUE
- [ ] CREACIÓN RÁPIDA
- [ ] Buscar si ya existe Matemáticas.
- [ ] Si existe, reutilizarla.
- [ ] Si no existe, crearla.
- [ ] Asignar el bloque.
- [ ] Aplicar automáticamente su color.
- [ ] Guardar.
- [ ] AUTOCOMPLETADO
- [ ] ASIGNATURAS EXISTENTES
- [ ] CREAR NUEVA ACTIVIDAD
- [ ] EDICIÓN DE BLOQUES
- [ ] DUPLICAR BLOQUES
- [ ] COPIAR Y PEGAR
- [ ] COPIAR DÍA COMPLETO
- [ ] LIMPIAR DÍA
- [ ] ARRASTRAR BLOQUES
- [ ] CONTROL TÁCTIL
- [ ] REDIMENSIONAR BLOQUES
- [ ] PREVENCIÓN DE SOLAPAMIENTOS
- [ ] DETECCIÓN VISUAL DE CONFLICTOS
- [ ] COLORES
- [ ] CONSISTENCIA DE COLORES
- [ ] ICONOS
- [ ] INFORMACIÓN COMPACTA
- [ ] VISTA PREVISUALIZADA
- [ ] MODO EDICIÓN VS MODO CONSULTA
- [ ] GUARDADO
- [ ] SINCRONIZACIÓN VISUAL
- [ ] DESHACER
- [ ] REHACER
- [ ] CONFIRMACIONES INTELIGENTES
- [ ] MENÚ CONTEXTUAL
- [ ] ACCIONES RÁPIDAS
- [ ] EDICIÓN MASIVA
- [ ] SELECCIÓN MÚLTIPLE
- [ ] CAMBIO DE SEMANA
- [ ] MODO SEMANA COMPLETA
- [ ] MODO DÍA
- [ ] MODO AGENDA
- [ ] CAMBIO ENTRE VISTAS
- [ ] MODO HOY
- [ ] NAVEGACIÓN POR FECHAS
- [ ] EDICIÓN DE UNA FECHA CONCRETA
- [ ] OPCIONES AL MODIFICAR
- [ ] INFORMACIÓN DE AULA
- [ ] INFORMACIÓN DEL PROFESOR
- [ ] ETIQUETAS
- [ ] FILTROS
- [ ] VISIBILIDAD DE HORARIOS
- [ ] MODO SOLO CONSULTA
- [ ] ACCESIBILIDAD
- [ ] MODO OSCURO
- [ ] DISEÑO PREMIUM
- [ ] ANIMACIONES
- [ ] RENDIMIENTO
- [ ] ESTADO LOCAL
- [ ] MANEJO DE ERRORES
- [ ] CAMBIOS SIMULTÁNEOS
- [ ] IMPORTACIÓN FUTURA
- [ ] IMPORTACIÓN MEDIANTE IA
- [ ] PREVISUALIZACIÓN ANTES DE IMPORTAR
- [ ] AUTOGUARDADO
- [ ] ESTADO DE SINCRONIZACIÓN
- [ ] CREACIÓN ULTRARRÁPIDA
- [ ] EJEMPLO COMPLETO
- [ ] RESULTADO ESPERADO
- [ ] CRITERIOS DE ACEPTACIÓN
- [ ] RESULTADO TÉCNICO DE LA FASE
- [ ] CONEXIÓN CON LAS SIGUIENTES FASES

#### HT · Fase 4/12 — CONFIGURACIÓN AVANZADA DE COLUMNAS, FILAS Y BLOQUES
- [ ] OBJETIVO
- [ ] PRINCIPIO DE FLEXIBILIDAD
- [ ] CONFIGURADOR DEL HORARIO
- [ ] CONFIGURACIÓN DE COLUMNAS
- [ ] TIPOS DE COLUMNAS
- [ ] COLUMNAS ESPECIALES
- [ ] OCULTAR COLUMNAS
- [ ] BLOQUEAR COLUMNAS
- [ ] AGRUPACIÓN DE COLUMNAS
- [ ] SEMANAS A/B
- [ ] CICLOS PERSONALIZADOS
- [ ] FILAS AVANZADAS
- [ ] FILAS SIN HORA
- [ ] FILAS DE SEPARACIÓN
- [ ] BLOQUES MULTIFILA
- [ ] BLOQUES MULTICOLUMNA
- [ ] BLOQUES FLOTANTES
- [ ] BLOQUES ANIDADOS
- [ ] DENSIDAD DE INFORMACIÓN
- [ ] TAMAÑO DE LAS FILAS
- [ ] TAMAÑO DE COLUMNAS
- [ ] ZOOM
- [ ] AJUSTE AUTOMÁTICO
- [ ] REORDENACIÓN MASIVA
- [ ] DUPLICAR ESTRUCTURA
- [ ] PLANTILLAS PERSONALIZADAS
- [ ] PLANTILLAS DEL SISTEMA
- [ ] CONFIGURACIÓN DE INTERVALOS
- [ ] HORARIOS SIN INTERVALOS REGULARES
- [ ] CAMBIOS DE ESTRUCTURA CON DATOS EXISTENTES
- [ ] PREVISUALIZACIÓN DE CAMBIOS
- [ ] MIGRACIÓN AUTOMÁTICA
- [ ] VALIDACIÓN ESTRUCTURAL
- [ ] HORAS SOLAPADAS
- [ ] MODO LIBRE
- [ ] REGLAS SEGÚN TIPO DE HORARIO
- [ ] METADATOS DEL HORARIO
- [ ] COLOR DEL HORARIO
- [ ] FILTROS POR HORARIO
- [ ] FILTROS POR ACTIVIDAD
- [ ] BÚSQUEDA
- [ ] ATAJOS
- [ ] SISTEMA DE SELECCIÓN
- [ ] ACCIONES SOBRE SELECCIÓN
- [ ] ELIMINACIÓN SEGURA
- [ ] RESTAURACIÓN
- [ ] VERSIONADO FUTURO
- [ ] IMPORTACIÓN DE ESTRUCTURAS
- [ ] EXPORTACIÓN
- [ ] HORARIO PARA IMPRIMIR
- [ ] VISTA PARA COMPARTIR
- [ ] PRIVACIDAD
- [ ] ZONA HORARIA
- [ ] CAMBIO DE HORA
- [ ] CAMBIOS DE CURSO
- [ ] ARCHIVAR HORARIOS
- [ ] RECUPERACIÓN
- [ ] CONFIGURACIÓN POR USUARIO
- [ ] CONFIGURACIÓN LOCAL VS CLOUD
- [ ] RENDIMIENTO DE GRANDES HORARIOS
- [ ] ARQUITECTURA PREPARADA PARA FUTUROS MÓDULOS
- [ ] EXPERIENCIA FINAL ESPERADA
- [ ] REGLA DE DISEÑO
- [ ] CRITERIOS DE ACEPTACIÓN
- [ ] PREPARACIÓN PARA LA FASE 5

#### HT · Fase 5/12 — ASIGNATURAS, ACTIVIDADES, COLORES, ICONOS Y CONTEXTO
- [ ] OBJETIVO DE LA FASE
- [ ] CONCEPTO DE ACTIVIDAD
- [ ] ASIGNATURA COMO TIPO DE ACTIVIDAD
- [ ] IDENTIDAD DE LA ACTIVIDAD
- [ ] NOMBRE
- [ ] NOMBRE CORTO
- [ ] ALIAS
- [ ] TIPO
- [ ] ICONO
- [ ] ICONOS PERSONALIZADOS
- [ ] COLOR PRINCIPAL
- [ ] PALETA PREDEFINIDA
- [ ] COLOR AUTOMÁTICO
- [ ] COLOR PERSONALIZADO
- [ ] COLOR DEL BLOQUE VS ACTIVIDAD
- [ ] SISTEMA DE ESTADOS
- [ ] ARCHIVADO
- [ ] REUTILIZACIÓN
- [ ] PROFESOR
- [ ] PROFESOR COMO ENTIDAD FUTURA
- [ ] AULA
- [ ] UBICACIÓN COMO ENTIDAD
- [ ] DESCRIPCIÓN
- [ ] ETIQUETAS
- [ ] FAVORITOS
- [ ] ACTIVIDADES RECIENTES
- [ ] BUSCADOR DE ACTIVIDADES
- [ ] CREACIÓN DESDE EL HORARIO
- [ ] PANEL DE DETALLES
- [ ] ACTIVIDAD COMO CENTRO DE INFORMACIÓN
- [ ] TAREAS ASOCIADAS
- [ ] EXÁMENES ASOCIADOS
- [ ] ARCHIVOS
- [ ] MATERIAL
- [ ] MOCHILA
- [ ] REQUERIDO VS OPCIONAL
- [ ] CANTIDAD
- [ ] CONTEXTO TEMPORAL
- [ ] ACTIVIDADES ESPECIALES
- [ ] ENTRENAMIENTOS
- [ ] ESTUDIO
- [ ] ACTIVIDADES RECURRENTES
- [ ] CAMBIO GLOBAL
- [ ] CAMBIO LOCAL
- [ ] ESTADÍSTICAS FUTURAS
- [ ] TIEMPO SEMANAL
- [ ] DETECCIÓN DE CARGA
- [ ] PRIORIDADES
- [ ] ESTADO DE ACTIVIDAD
- [ ] VISIBILIDAD
- [ ] REGLAS DE VISIBILIDAD
- [ ] NOTAS PRIVADAS
- [ ] CONTEXTO PARA IA
- [ ] IA COMO ASISTENTE DEL HORARIO
- [ ] CREACIÓN MEDIANTE IA
- [ ] DETECCIÓN DE DUPLICADOS
- [ ] ACTIVIDADES PARECIDAS
- [ ] ELIMINACIÓN
- [ ] ARCHIVADO INTELIGENTE
- [ ] RESTAURACIÓN
- [ ] DUPLICAR ACTIVIDAD
- [ ] RELACIONES ENTRE ACTIVIDADES
- [ ] ACTIVIDADES PADRE E HIJAS
- [ ] AGRUPACIONES
- [ ] COLORES DE GRUPO
- [ ] SISTEMA DE FILTROS
- [ ] BÚSQUEDA GLOBAL
- [ ] ACCESO DESDE HOY
- [ ] ACCESO DESDE CALENDARIO
- [ ] ACCESO DESDE MOCHILA
- [ ] ACCESO DESDE TAREAS
- [ ] SISTEMA DE CONTEXTO
- [ ] PRIVACIDAD
- [ ] PREPARACIÓN PARA CLOUD
- [ ] PREPARACIÓN PARA OFFLINE
- [ ] CACHÉ INTELIGENTE
- [ ] DISEÑO DE LA FICHA
- [ ] ACCIONES RÁPIDAS DESDE LA FICHA
- [ ] RESUMEN DE ACTIVIDAD
- [ ] SISTEMA DE COLORES CONSISTENTE
- [ ] CONTRASTE Y ACCESIBILIDAD
- [ ] PERSONALIZACIÓN GLOBAL
- [ ] ORDEN DE ACTIVIDADES
- [ ] Favoritas.
- [ ] Recientes.
- [ ] Más utilizadas.
- [ ] Alfabéticamente.
- [ ] ACTIVIDADES MÁS UTILIZADAS
- [ ] INTELIGENCIA CONTEXTUAL
- [ ] SUGERENCIAS
- [ ] RECONOCIMIENTO DE PATRONES
- [ ] INTEGRACIÓN CON OBJETIVOS
- [ ] INTEGRACIÓN CON HÁBITOS
- [ ] INTEGRACIÓN CON PRODUCTIVIDAD
- [ ] INTEGRACIÓN CON ENTRENAMIENTO
- [ ] PRINCIPIO DE REFERENCIA ÚNICA
- [ ] EJEMPLO
- [ ] EVENTOS EXTERNOS
- [ ] NO DUPLICAR IMPORTACIONES
- [ ] HISTORIAL DE ACTIVIDAD
- [ ] ELIMINACIÓN LÓGICA
- [ ] SEGURIDAD
- [ ] IA Y PERMISOS
- [ ] RESULTADO DE LA FASE
- [ ] CRITERIOS DE ACEPTACIÓN
- [ ] SIGUIENTE FASE

#### HT · Fase 6/12 — CALENDARIO + AGENDA + SISTEMA «HOY»
- [ ] EL CENTRO: «HOY»
- [ ] LÍNEA TEMPORAL DEL DÍA
- [ ] BLOQUE ACTUAL
- [ ] PRÓXIMO BLOQUE
- [ ] TIEMPO RESTANTE
- [ ] ESTADO DEL DÍA
- [ ] AGENDA DEL DÍA
- [ ] VISTA DIARIA
- [ ] VISTA SEMANAL
- [ ] VISTA MENSUAL
- [ ] VISTA ANUAL
- [ ] NAVEGACIÓN TEMPORAL
- [ ] BOTÓN «VOLVER A HOY»
- [ ] SELECCIÓN DE FECHA
- [ ] CALENDARIO COMO CAPA
- [ ] DIFERENCIA ENTRE HORARIO Y EVENTO
- [ ] TAREAS
- [ ] FECHA DE INICIO Y FECHA LÍMITE
- [ ] TAREAS PROGRAMADAS
- [ ] EXÁMENES
- [ ] CUENTA ATRÁS
- [ ] EVENTOS
- [ ] EVENTOS DE TODO EL DÍA
- [ ] RECURRENCIA
- [ ] EXCEPCIONES
- [ ] CANCELACIONES
- [ ] CAMBIOS TEMPORALES
- [ ] SUSTITUCIONES
- [ ] REPROGRAMACIÓN
- [ ] ARRASTRAR BLOQUES
- [ ] CONFIRMACIÓN DE CAMBIOS
- [ ] HOY + TAREAS
- [ ] TAREAS VENCIDAS
- [ ] REPROGRAMACIÓN RÁPIDA
- [ ] COMPLETAR DESDE HOY
- [ ] PRIORIDADES
- [ ] PUNTUACIÓN DEL DÍA
- [ ] CARGA DEL DÍA
- [ ] DETECCIÓN DE CONFLICTOS
- [ ] CONFLICTOS INTELIGENTES
- [ ] MOCHILA
- [ ] MOCHILA AUTOMÁTICA
- [ ] MOCHILA POR DÍA
- [ ] MOCHILA MANUAL
- [ ] ELEMENTOS TEMPORALES
- [ ] MOCHILA INTELIGENTE
- [ ] RECORDATORIOS
- [ ] RECORDATORIOS CONTEXTUALES
- [ ] RECORDATORIOS DE SALIDA
- [ ] UBICACIÓN
- [ ] TIEMPO DE DESPLAZAMIENTO
- [ ] ZONAS
- [ ] HÁBITOS
- [ ] OBJETIVOS
- [ ] RELACIÓN OBJETIVO → TAREA
- [ ] ENTRENAMIENTO
- [ ] CONTEXTO DEL ENTRENAMIENTO
- [ ] ESTUDIO
- [ ] AUTOMATIZACIÓN DEL ESTUDIO
- [ ] RESUMEN INTELIGENTE
- [ ] IA PROACTIVA
- [ ] APROBACIÓN
- [ ] PREGUNTAS RÁPIDAS
- [ ] RESPUESTA CONTEXTUAL
- [ ] TIEMPO LIBRE
- [ ] USO DEL TIEMPO LIBRE
- [ ] PLANIFICACIÓN RÁPIDA
- [ ] BLOQUES DE DESCANSO
- [ ] DÍA SIN ACTIVIDADES
- [ ] FIN DE SEMANA
- [ ] VACACIONES
- [ ] FESTIVOS
- [ ] CALENDARIO ACADÉMICO
- [ ] EXCEPCIONES ACADÉMICAS
- [ ] IMPORTACIÓN FUTURA
- [ ] SINCRONIZACIÓN CLOUD
- [ ] CONFLICTOS DE SINCRONIZACIÓN
- [ ] OFFLINE
- [ ] ESTADO DE SINCRONIZACIÓN
- [ ] NOTIFICACIONES
- [ ] NOTIFICACIONES INTELIGENTES
- [ ] PRIORIDAD DE NOTIFICACIONES
- [ ] CENTRO DE NOTIFICACIONES
- [ ] PERSONALIZACIÓN
- [ ] VISTA «MAÑANA»
- [ ] VISTA «ESTA SEMANA»
- [ ] RESUMEN SEMANAL
- [ ] RESUMEN DEL FIN DE SEMANA
- [ ] DISEÑO MOBILE FIRST
- [ ] INFORMACIÓN PROGRESIVA
- [ ] TARJETAS EXPANDIBLES
- [ ] PERSONALIZAR HOY
- [ ] ORDEN PERSONALIZABLE
- [ ] Horario
- [ ] Mochila
- [ ] Tareas
- [ ] Entrenamiento
- [ ] Objetivos
- [ ] MODO MÍNIMO
- [ ] MODO COMPLETO
- [ ] MODO ESTUDIO
- [ ] MODO ENTRENAMIENTO
- [ ] SISTEMA DE CONTEXTO
- [ ] MOTOR DE CONTEXTO TEMPORAL
- [ ] FUENTE ÚNICA DE VERDAD
- [ ] RENDIMIENTO
- [ ] DATOS CLOUD
- [ ] SEGURIDAD
- [ ] AUDITORÍA
- [ ] DESHACER
- [ ] ACCIONES RÁPIDAS
- [ ] COMANDO RÁPIDO
- [ ] INTELIGENCIA SIN AUTOMATISMOS PELIGROSOS
- [ ] EJEMPLO COMPLETO
- [ ] CRITERIOS DE ACEPTACIÓN
- [ ] PREPARACIÓN PARA LA FASE 7

#### HT · Fase 7/12 — MOCHILA INTELIGENTE + MATERIALES + PREPARACIÓN AUTOMÁTICA
- [ ] OBJETIVO PRINCIPAL
- [ ] LA MOCHILA COMO ENTIDAD
- [ ] ELEMENTO DE MOCHILA
- [ ] TIPOS DE MATERIAL
- [ ] MATERIAL PERSONALIZADO
- [ ] MATERIAL ASOCIADO A ACTIVIDAD
- [ ] MATERIAL OPCIONAL
- [ ] MATERIAL TEMPORAL
- [ ] MATERIAL POR FECHA
- [ ] MATERIAL POR EVENTO
- [ ] MATERIAL POR EXAMEN
- [ ] MATERIAL DE ENTRENAMIENTO
- [ ] MATERIAL DE ENTRENAMIENTO ESPECÍFICO
- [ ] MOCHILA DE HOY
- [ ] MOCHILA DE MAÑANA
- [ ] PREPARACIÓN
- [ ] MARCAR COMO PREPARADO
- [ ] PROGRESO DE MOCHILA
- [ ] MOCHILA COMPLETA
- [ ] MOCHILA INCOMPLETA
- [ ] DIFERENCIAR OBLIGATORIO
- [ ] PREPARAR TODO
- [ ] DESMARCAR TODO
- [ ] ELEMENTOS PERSISTENTES
- [ ] ELEMENTOS NO PERSISTENTES
- [ ] MOCHILA BASE
- [ ] MOCHILA ESCOLAR
- [ ] MOCHILA DEPORTIVA
- [ ] OTRAS MOCHILAS
- [ ] SELECCIÓN DE MOCHILA
- [ ] MATERIAL COMPARTIDO
- [ ] INVENTARIO
- [ ] CANTIDAD DISPONIBLE
- [ ] MATERIAL PRESTADO
- [ ] MATERIAL PERDIDO
- [ ] MATERIAL ROTO
- [ ] DISPONIBILIDAD
- [ ] ALERTA DE DISPONIBILIDAD
- [ ] COMPARTIR MATERIAL
- [ ] UBICACIÓN DEL MATERIAL
- [ ] UBICACIONES DE ALMACENAMIENTO
- [ ] CAMBIO DE UBICACIÓN
- [ ] HISTORIAL
- [ ] PREPARACIÓN AUTOMÁTICA
- [ ] GENERACIÓN ANTICIPADA
- [ ] HORA DE PREPARACIÓN
- [ ] RECORDATORIO
- [ ] RECORDATORIO INTELIGENTE
- [ ] RECORDATORIO CON FALTANTES
- [ ] PRIORIDAD DEL MATERIAL
- [ ] MATERIAL CRÍTICO
- [ ] MATERIAL RECOMENDADO
- [ ] EXCEPCIONES
- [ ] DÍA ESPECIAL
- [ ] CAMBIO DE HORARIO
- [ ] CANCELACIÓN
- [ ] NO BORRAR MATERIAL MANUAL
- [ ] ORIGEN DEL ELEMENTO
- [ ] EXPLICACIÓN
- [ ] MATERIAL DUPLICADO
- [ ] CANTIDADES INTELIGENTES
- [ ] CONSUMIBLES
- [ ] INVENTARIO BAJO
- [ ] LISTA DE COMPRA
- [ ] CONEXIÓN CON ECONOMÍA
- [ ] CONEXIÓN CON TAREAS
- [ ] CONEXIÓN CON RECORDATORIOS
- [ ] MOCHILA + HOY
- [ ] MOCHILA + CALENDARIO
- [ ] MOCHILA + SEMANA
- [ ] ESTADO DE PREPARACIÓN SEMANAL
- [ ] PREPARACIÓN DE VARIOS DÍAS
- [ ] PLANIFICACIÓN ANTICIPADA
- [ ] MOCHILA POR PERFIL
- [ ] REGLAS
- [ ] REGLAS CON CONDICIONES
- [ ] REGLAS TEMPORALES
- [ ] REGLAS POR DÍA
- [ ] REGLAS POR UBICACIÓN
- [ ] IA PARA CONFIGURAR REGLAS
- [ ] EXPLICABILIDAD
- [ ] IA PARA DETECTAR PATRONES
- [ ] PREDICCIÓN
- [ ] NIVELES DE CERTEZA
- [ ] MOCHILA MANUAL + AUTOMÁTICA
- [ ] EVITAR SOBRESCRITURA
- [ ] BLOQUEO MANUAL
- [ ] BLOQUEO TEMPORAL
- [ ] REGLA GLOBAL
- [ ] PREPARACIÓN FÍSICA
- [ ] ESCÁNER FUTURO
- [ ] FOTO DEL MATERIAL
- [ ] RECONOCIMIENTO VISUAL FUTURO
- [ ] MATERIAL DIGITAL
- [ ] DISPOSITIVOS
- [ ] CARGADORES
- [ ] DEPENDENCIAS
- [ ] KIT
- [ ] KIT DEPORTIVO
- [ ] KIT PERSONALIZADO
- [ ] PREPARACIÓN POR KITS
- [ ] HISTORIAL DE PREPARACIÓN
- [ ] ESTADÍSTICAS
- [ ] DETECCIÓN DE OLVIDOS
- [ ] SIN CASTIGO
- [ ] RACHAS FUTURAS
- [ ] GAMIFICACIÓN OPCIONAL
- [ ] DISEÑO VISUAL
- [ ] INDICADORES
- [ ] GESTOS MÓVILES
- [ ] WIDGET FUTURO
- [ ] LOCK SCREEN FUTURO
- [ ] CLOUD
- [ ] OFFLINE
- [ ] SEGURIDAD
- [ ] RENDIMIENTO
- [ ] MOTOR DE CÁLCULO
- [ ] EJEMPLO REAL COMPLETO
- [ ] EJEMPLO CON EXCEPCIÓN
- [ ] EJEMPLO CON MATERIAL NO DISPONIBLE
- [ ] EJEMPLO CON EXAMEN
- [ ] EJEMPLO CON IA
- [ ] CRITERIOS DE ACEPTACIÓN DE LA FASE 7
- [ ] SIGUIENTE FASE
- [ ] Arquitectura general	✅
- [ ] Datos + Cloud + Supabase	✅
- [ ] Editor visual	✅
- [ ] Configuración avanzada	✅
- [ ] Actividades y contexto	✅
- [ ] Calendario + Agenda + HOY	✅
- [ ] Mochila inteligente	⏳
- [ ] Reglas y automatizaciones	⏳
- [ ] IA del horario	⏳
- [ ] Notificaciones y contexto	⏳
- [ ] Integraciones y sincronización avanzada	⏳
- [ ] Optimización, seguridad y acabado final	⏳

#### HT · Fase 8/12 — MOTOR TEMPORAL + REGLAS + AUTOMATIZACIONES INTELIGENTES
- [ ] OBJETIVO
- [ ] ESTADOS DE UNA ACTIVIDAD
- [ ] PROGRAMADA
- [ ] PRÓXIMA
- [ ] EN CURSO
- [ ] PASADA
- [ ] COMPLETADA
- [ ] CONFIRMACIÓN OPCIONAL
- [ ] CLASES ESCOLARES
- [ ] TAREAS
- [ ] EVENTOS
- [ ] RECORDATORIOS
- [ ] EXÁMENES
- [ ] EL TABLÓN DE HOY
- [ ] BOTÓN «VER PASADO»
- [ ] HISTORIAL DEL DÍA
- [ ] LÍNEA DE TIEMPO DINÁMICA
- [ ] INDICADOR DE HORA ACTUAL
- [ ] ACTUALIZACIÓN AUTOMÁTICA
- [ ] CAMBIO DE HORA
- [ ] CAMBIO DE DÍA
- [ ] NO DEPENDER DE ABRIR LA APP
- [ ] REANUDACIÓN
- [ ] ZONA HORARIA
- [ ] HORARIO DE VERANO
- [ ] ACTIVIDADES SIN HORA
- [ ] ACTIVIDADES CON RANGO
- [ ] ACTIVIDADES DE TODO EL DÍA
- [ ] ACTIVIDADES FLEXIBLES
- [ ] BLOQUES FLEXIBLES
- [ ] AUTOMATIZACIONES
- [ ] EJEMPLO 1
- [ ] EJEMPLO 2
- [ ] EJEMPLO 3
- [ ] EJEMPLO 4
- [ ] EJEMPLO 5
- [ ] EJEMPLO 6
- [ ] EJEMPLO 7
- [ ] EJEMPLO 8
- [ ] EJEMPLO 9
- [ ] EJEMPLO 10
- [ ] MOTOR DE REGLAS
- [ ] MÚLTIPLES CONDICIONES
- [ ] PRIORIDADES ENTRE REGLAS
- [ ] REGLAS Y EXCEPCIONES
- [ ] ACTIVAR/DESACTIVAR
- [ ] EJECUCIÓN MANUAL
- [ ] REGISTRO DE AUTOMATIZACIONES
- [ ] HISTORIAL DE ACCIONES
- [ ] DESHACER AUTOMATIZACIÓN
- [ ] EXPLICACIÓN
- [ ] AUTOMATIZACIONES SEGURAS
- [ ] IA + AUTOMATIZACIONES
- [ ] IA NO ES EL MOTOR
- [ ] MOTOR TEMPORAL + IA
- [ ] OBJETIVO FINAL DE ESTA FASE
- [ ] EJEMPLO FINAL
- [ ] CRITERIOS DE ACEPTACIÓN

#### HT · Fase 9/12 — IA DE HORARIO + PLANIFICADOR PERSONAL INTELIGENTE
- [ ] OBJETIVO
- [ ] CONTEXTO TEMPORAL REAL
- [ ] PREGUNTAS NATURALES
- [ ] PLANIFICACIÓN AUTOMÁTICA
- [ ] EJEMPLO
- [ ] NUNCA SOBREESCRIBIRÁ SIN PERMISO
- [ ] ACEPTAR PLAN
- [ ] MODIFICAR PLAN
- [ ] REPLANIFICACIÓN
- [ ] REPLANIFICACIÓN INTELIGENTE
- [ ] DURACIÓN
- [ ] TIEMPO DISPONIBLE
- [ ] HUECOS
- [ ] HUECOS ADECUADOS
- [ ] BLOQUES DE ESTUDIO
- [ ] EXÁMENES
- [ ] PLAN DE ESTUDIO
- [ ] PLAN ADAPTATIVO
- [ ] NO CASTIGAR
- [ ] PRIORIDADES
- [ ] PUNTUACIÓN DE PRIORIDAD
- [ ] TAREAS GRANDES
- [ ] DESCOMPOSICIÓN INTELIGENTE
- [ ] DEPENDENCIAS
- [ ] OBJETIVOS
- [ ] ENTRENAMIENTO
- [ ] DESCANSO
- [ ] TIEMPO DE TRANSICIÓN
- [ ] TIEMPO DE DESPLAZAMIENTO
- [ ] MARGEN
- [ ] PREFERENCIAS DE PLANIFICACIÓN
- [ ] PLANIFICACIÓN PERSONALIZADA
- [ ] MODO «TENGO MUCHO QUE HACER»
- [ ] CARGA SEMANAL
- [ ] MAPA DE CARGA
- [ ] DETECCIÓN DE SOBRECARGA
- [ ] NO DECIDIRÁ POR TI
- [ ] ELEMENTOS BLOQUEADOS
- [ ] INTELIGENCIA SOBRE BLOQUES FIJOS
- [ ] PLANIFICACIÓN POR CAPAS
- [ ] PLANIFICACIÓN POR COMANDOS
- [ ] MÚLTIPLES CONDICIONES
- [ ] RESTRICCIONES
- [ ] PREFERENCIAS PERMANENTES
- [ ] PREFERENCIAS TEMPORALES
- [ ] CHAT CONTEXTUAL
- [ ] ACCIONES RÁPIDAS
- [ ] RESPUESTAS CONTEXTUALES
- [ ] CONSULTA DE DATOS
- [ ] NO MANDAR TODO A LA IA
- [ ] RESPUESTAS BASADAS EN DATOS
- [ ] MOTOR DETERMINISTA + IA
- [ ] ACCIONES DE LA IA
- [ ] VALIDACIÓN
- [ ] CONFIRMACIÓN
- [ ] PREVISUALIZACIÓN
- [ ] DESHACER
- [ ] HISTORIAL
- [ ] MODO MANUAL
- [ ] MODO IA
- [ ] NIVEL DE AUTONOMÍA
- [ ] PRIVACIDAD
- [ ] PERMISOS
- [ ] DATOS SENSIBLES
- [ ] MEMORIA DE IA
- [ ] EJEMPLO DE PREFERENCIA
- [ ] EXPLICACIÓN DEL PLAN
- [ ] PLAN ALTERNATIVO
- [ ] COMPARACIÓN
- [ ] PLANIFICACIÓN SEMANAL
- [ ] PLANIFICACIÓN DIARIA
- [ ] PLANIFICACIÓN DE UN PROYECTO
- [ ] FECHA LÍMITE
- [ ] MARGEN DE SEGURIDAD
- [ ] IMPREVISTOS
- [ ] PLAN ORIGINAL
- [ ] CAMBIOS
- [ ] OBJETIVOS A LARGO PLAZO
- [ ] PROGRESIÓN
- [ ] CONEXIÓN CON EL RESTO DEL SISTEMA PERSONAL
- [ ] EJEMPLO REAL
- [ ] PLANIFICADOR PROACTIVO
- [ ] PERO SIN SPAM
- [ ] CENTRO DE SUGERENCIAS
- [ ] ACCIONES DESDE SUGERENCIAS
- [ ] APRENDIZAJE DE PREFERENCIAS
- [ ] SISTEMA DE FEEDBACK
- [ ] PLANES FALLIDOS
- [ ] CALIDAD DEL PLAN
- [ ] REGLA DE ORO
- [ ] CRITERIOS DE ACEPTACIÓN

#### HT · Fase 10/12 — NOTIFICACIONES + RECORDATORIOS + CONTEXTO PROACTIVO
- [ ] OBJETIVO PRINCIPAL
- [ ] TIPOS DE NOTIFICACIÓN
- [ ] PRIORIDADES
- [ ] NO TODO DEBE NOTIFICAR
- [ ] MOTOR DE DECISIÓN
- [ ] NOTIFICACIÓN CONTEXTUAL
- [ ] CAMBIOS EN TIEMPO REAL
- [ ] EVITAR DUPLICADOS
- [ ] RECORDATORIOS PERSONALIZADOS
- [ ] VARIOS RECORDATORIOS
- [ ] NOTIFICACIÓN DE INICIO
- [ ] NOTIFICACIÓN DE FINALIZACIÓN
- [ ] ACTIVIDADES PASADAS
- [ ] TAREAS
- [ ] TAREAS VENCIDAS
- [ ] RECORDATORIO DE TAREA PENDIENTE
- [ ] EXÁMENES
- [ ] INTELIGENCIA DE EXÁMENES
- [ ] PROPUESTA
- [ ] MOCHILA
- [ ] MOCHILA INCOMPLETA
- [ ] MATERIAL CRÍTICO
- [ ] CAMBIO DE NECESIDADES
- [ ] NUEVA NECESIDAD
- [ ] NOTIFICACIONES DE CAMBIOS
- [ ] CAMBIO IMPORTANTE
- [ ] CANCELACIÓN
- [ ] CONFLICTOS
- [ ] RESOLUCIÓN
- [ ] RECORDATORIOS DE EVENTOS
- [ ] RECORDATORIOS DE PREPARACIÓN
- [ ] LISTA DE PREPARACIÓN
- [ ] NOTIFICACIONES DE HÁBITOS
- [ ] NO CREAR CIENTOS DE RECORDATORIOS
- [ ] RESUMEN INTELIGENTE
- [ ] RESUMEN DE MAÑANA
- [ ] RESUMEN NOCTURNO
- [ ] RESUMEN MATUTINO
- [ ] NO MOLESTAR
- [ ] EXCEPCIONES
- [ ] FINES DE SEMANA
- [ ] VACACIONES
- [ ] DÍAS ESPECIALES
- [ ] CONTEXTO DE UBICACIÓN
- [ ] CONTEXTO DE DISPOSITIVO
- [ ] NOTIFICACIONES OFFLINE
- [ ] PUSH CLOUD
- [ ] SINCRONIZACIÓN
- [ ] MULTIDISPOSITIVO
- [ ] ESTADO DE NOTIFICACIÓN
- [ ] HISTORIAL
- [ ] CANCELACIÓN AUTOMÁTICA
- [ ] REPETICIÓN INTELIGENTE
- [ ] SNOOZE
- [ ] POSPONER
- [ ] MARCAR COMO HECHO
- [ ] ACCIONES RÁPIDAS
- [ ] DEEP LINKS
- [ ] NOTIFICACIONES DE IA
- [ ] LA IA NO PODRÁ SPAMEAR
- [ ] COOLDOWN
- [ ] AGRUPACIÓN
- [ ] SISTEMA DE IMPORTANCIA
- [ ] DECISIÓN FINAL
- [ ] PREVENCIÓN DE NOTIFICACIONES OBSOLETAS
- [ ] EJEMPLO COMPLETO
- [ ] OTRO EJEMPLO
- [ ] MOCHILA + NOTIFICACIONES + HORARIO
- [ ] TAREAS + HORARIO
- [ ] EXAMEN + ESTUDIO
- [ ] CONEXIÓN CON HOY
- [ ] CENTRO DE NOTIFICACIONES INTERNO
- [ ] LEÍDO / NO LEÍDO
- [ ] ARCHIVAR
- [ ] FILTROS
- [ ] CONFIGURACIÓN GLOBAL
- [ ] CONFIGURACIÓN POR MÓDULO
- [ ] CONFIGURACIÓN POR IMPORTANCIA
- [ ] CONFIGURACIÓN POR HORARIO
- [ ] PERSONALIZACIÓN VISUAL
- [ ] SONIDO
- [ ] VIBRACIÓN
- [ ] MODO SILENCIOSO
- [ ] ACCESIBILIDAD
- [ ] CLOUD
- [ ] LOCAL + CLOUD
- [ ] CONFLICTOS DE SINCRONIZACIÓN
- [ ] SEGURIDAD
- [ ] AUDITORÍA
- [ ] CRITERIOS DE ACEPTACIÓN

#### HT · Fase 11/12 — ANALÍTICA PERSONAL + CARGA + PROGRESO + APRENDIZAJE DEL SISTEMA
- [ ] *(sin apartados numerados extraídos — leer la fase completa en la especificación)*

#### HT · Fase 12/12 — CLOUD + SUPABASE + SINCRONIZACIÓN + ARQUITECTURA DEFINITIVA
- [ ] ARQUITECTURA GENERAL
- [ ] FUENTE CENTRAL DE VERDAD
- [ ] AUTENTICACIÓN
- [ ] USUARIO
- [ ] AISLAMIENTO DE DATOS
- [ ] TABLA DE HORARIOS
- [ ] MÚLTIPLES HORARIOS
- [ ] HORARIO ACTIVO
- [ ] PERIODOS DE VALIDEZ
- [ ] CURSO ESCOLAR
- [ ] COLUMNAS
- [ ] FILAS
- [ ] BLOQUES DE HORARIO
- [ ] HORAS
- [ ] HORARIO RECURRENTE
- [ ] EXCEPCIONES
- [ ] CAMBIO TEMPORAL
- [ ] MATERIAS
- [ ] COLORES
- [ ] IDENTIDAD VISUAL
- [ ] TAREAS
- [ ] EXÁMENES
- [ ] EVENTOS
- [ ] RECURRENCIA
- [ ] MOCHILA
- [ ] REGLAS DE MOCHILA
- [ ] MOTOR DE REGLAS
- [ ] EJEMPLO
- [ ] VENTAJA
- [ ] MOTOR TEMPORAL
- [ ] ZONA HORARIA
- [ ] CAMBIO DE HORA
- [ ] ESTADO DE ACTIVIDAD
- [ ] REGLA DE PASADO
- [ ] HOY
- [ ] TABLÓN DE HOY
- [ ] CAMBIO AUTOMÁTICO
- [ ] SIN REFRESCAR MANUALMENTE
- [ ] CALENDARIO
- [ ] IA
- [ ] CAPA IA
- [ ] TOOLS DE IA
- [ ] PERMISOS
- [ ] ACCIONES PELIGROSAS
- [ ] TRANSACCIONES
- [ ] EVITAR DATOS A MEDIAS
- [ ] NOTIFICACIONES
- [ ] NOTIFICACIONES PROGRAMADAS
- [ ] IDEMPOTENCIA
- [ ] SINCRONIZACIÓN
- [ ] CAMBIOS LOCALES
- [ ] COLA OFFLINE
- [ ] AL VOLVER INTERNET
- [ ] CONFLICTOS
- [ ] RESOLUCIÓN
- [ ] INDICADOR DE SINCRONIZACIÓN
- [ ] OFFLINE
- [ ] CLOUD COMO RESPALDO
- [ ] BACKUPS
- [ ] MIGRACIONES
- [ ] ÍNDICES
- [ ] RENDIMIENTO
- [ ] CONSULTAS POR RANGO
- [ ] PAGINACIÓN
- [ ] CACHÉ
- [ ] SEGURIDAD DE CLAVES
- [ ] CLAUDE API
- [ ] CONTROL DE USO DE IA
- [ ] COSTES
- [ ] CONTEXTO MÍNIMO
- [ ] LOGS
- [ ] MONITORIZACIÓN
- [ ] RECUPERACIÓN
- [ ] OPERACIONES SEGURAS
- [ ] BORRADO
- [ ] ARCHIVADO
- [ ] RESTAURACIÓN
- [ ] IMPORTACIÓN
- [ ] EXPORTACIÓN
- [ ] DUPLICAR HORARIO
- [ ] PLANTILLAS
- [ ] MOTOR DE RECURRENCIA
- [ ] CALENDARIO ESCOLAR
- [ ] IMPORTACIÓN DE CALENDARIO
- [ ] FUTURAS INTEGRACIONES
- [ ] API INTERNA
- [ ] SEPARACIÓN DE RESPONSABILIDADES
- [ ] COMPONENTES DE UI
- [ ] DISEÑO RESPONSIVE
- [ ] MÓVIL COMO PRIORIDAD
- [ ] GRID
- [ ] ACCESIBILIDAD
- [ ] ANIMACIONES
- [ ] MODO OSCURO
- [ ] DISEÑO PREMIUM
- [ ] ARQUITECTURA FINAL
- [ ] RESULTADO FINAL
- [ ] EL SISTEMA COMPLETO
- [ ] CRITERIOS DE FINALIZACIÓN DE HORARIO TOP
- [ ] Y LO MÁS IMPORTANTE

---

## AR · ARMARIO JC LIFESTYLE — 4 fases

Armario digital, constructor de outfits, calendario e historial de uso, y sistema inteligente anti-repetición. **Estilo de Hombre lo da por construido** (su apartado 16 dice literalmente *"NO rehacer el armario"*), así que debe existir antes que EH.

#### AR · Fase 1/4 — ARMARIO DIGITAL + GESTIÓN DE PRENDAS ✅ COMPLETADA (v1.32.0)

*(La extracción automática no encontró apartados numerados en esta fase; el desglose de abajo sale
de leer la especificación entera, apartado a apartado.)*

- [x] **1 · Acceso** — Gestión → Armario, con la navegación y los componentes de siempre. Dado de
      alta en `MORE_NAV`, `AREAS_NAV`, su `case` de `renderTab`, `DESCRIPCIONES_MODULOS`,
      `PALABRAS_MODULOS`, `SINONIMOS_MODULOS`, `CATALOGO_PAPELERA` y `resumenesHub`.
- [x] **2 · Pantalla principal** — cabecera con el contador de prendas, buscador, filtros y botón
      de añadir.
- [x] **3 · Categorías** — las 14 de la especificación, en una lista ampliable. Una categoría
      desconocida no rompe la prenda: cae en "Otros".
- [x] **4 · Añadir prenda** — nombre, categoría, color y foto **opcional**.
- [x] **5 · Información adicional** — temporada, material, color secundario, notas, precio, fecha de
      compra y estado, todo detrás de "Más información".
- [x] **6 · Tarjeta de prenda** — con foto si la hay; si no, un degradado del color de la prenda con
      su categoría. **Del mismo alto en los dos casos**, para que la rejilla no se desalinee según
      quién tenga fotografía.
- [x] **7 · Detalle** — todos los campos que tenga, editar y eliminar con confirmación.
- [x] **8 · Edición** — todo modificable. `usos`, `ultimoUso` y `outfits` NO se dejan sobrescribir
      desde el formulario: editar la talla no puede borrar cuántas veces te has puesto la prenda.
- [x] **9 · Búsqueda** — explícitamente no solo por nombre: "gris" encuentra por color y "Nike" por
      marca. También por categoría, talla, estado y notas, sin acentos ni mayúsculas.
- [x] **10 · Filtros combinables** — categoría, color, marca, temporada, estado y favoritas. El
      ejemplo literal de la especificación ("Pantalones + Gris + Nike") está en las pruebas.
- [x] **11 · Ordenación** — cinco activas. Las tres que dependen del uso están **escritas y
      probadas**, pero la interfaz no las ofrece mientras no haya ni un uso registrado: un
      "Más usadas" sobre un armario sin usos sería un control decorativo (regla 8).
- [x] **12 · Favoritos** — el modelo lo soporta y la tarjeta ya lo marca.
- [x] **13 · Estados** — los cinco. Solo "Disponible" cambia algo hoy; el resto existen porque la
      Fase 2 los necesita para no proponer una prenda que está en la lavadora.
- [x] **14 · Arquitectura de datos** — los 21 campos, **todos desde el primer día**.
- [x] **15 · Futuro sistema de uso** — `usos`, `ultimoUso` y `outfits` ya están, vacíos.
- [x] **16 · Experiencia de añadir** — cuatro campos visibles y el resto plegado. El objetivo de la
      especificación es "añadir una prenda en pocos segundos", y eso es lo que manda en la pantalla.
- [x] **17 · Diseño visual** — tokens, tipografía y componentes de siempre. La foto manda cuando
      existe.
- [x] **18 · Móvil** — rejilla de dos columnas, filtros plegables, categorías con scroll
      horizontal. ⚠️ Comprobación real en iPhone: pendiente de Josué (**R1**).
- [x] **19 · Datos vacíos** — "Tu armario está esperando" con su botón, no una pantalla en blanco.
- [x] **20 · Rendimiento** — búsqueda, filtro y orden memoizados; la URL de cada foto se firma una
      vez por prenda y dura una hora.
- [x] **21 · Persistencia** — clave `armario` en la tabla `app_data` de siempre. **Ninguna segunda
      base de datos.**
- [x] **22 · Seguridad** — RLS de `app_data` heredada, y el bucket `armario` con las mismas
      políticas por carpeta de usuario que `progreso` y `entrenamiento-videos`.
- [x] **23 · Compatibilidad con futuras fases** — `outfits` y `usos` ya declarados en
      `DEFAULT_ARMARIO`.
- [x] **24 · No implementar todavía** — respetado: ni outfits, ni calendario, ni recomendaciones,
      ni anti-repetición, ni estadísticas.
- [x] **25 · Calidad** — 87 comprobaciones automáticas + 4 casos de renderizado.
- [x] **26 · No romper nada** — 443 comprobaciones en verde.

**Decisión que hubo que tomar, y su porqué:** la eliminación de una prenda **sí pide confirmación**,
a diferencia del resto de la app, donde ME Fase 3 la quitó porque la papelera lo hace todo
reversible. No es una excepción caprichosa: la papelera guarda el objeto de la prenda, pero **la
fotografía vive en Supabase Storage y no vuelve** — igual que las fotos de Salud y los vídeos de
Calistenia, excluidos de la papelera desde ME Fase 3. Borrar una prenda con foto es en parte
irreversible, y eso es justo lo que la regla del proyecto reserva para la confirmación. El texto de
la confirmación lo dice: cambia según la prenda tenga foto o no.

**Dos cosas nuevas que hicieron falta:**

1. **`SelectInput`** — el proyecto no tenía ni un `<select>`: todas las elecciones se hacían con
   filas de botones, que funcionan con 3 o 4 opciones. El Armario tiene 14 categorías y 13 colores,
   y catorce pastillas en fila no caben en un iPhone. Un desplegable nativo abre además la rueda de
   iOS, que se maneja con el pulgar mucho mejor.
2. **El bucket `armario`** en `supabase/schema.sql`. ⚠️ **Josué tiene que ejecutar ese bloque en el
   SQL Editor de Supabase.** Hasta que lo haga, el Armario funciona **entero sin fotos** — la
   fotografía es opcional por diseño; lo único que fallará es subir una imagen, y la prenda se
   guarda igual con un aviso en vez de perder lo escrito.

**Un fallo que destapó el smoke test:** `ArmarioView` es la primera vista de la prueba de
renderizado que toca Storage, y `lib/supabase.js` lee `import.meta.env` al cargarse — algo que solo
existe dentro de Vite. Ahora está stubeado, y de paso queda comprobado algo que importa: ninguna
vista debe necesitar la red para pintarse.

#### AR · Fase 2/4 — CONSTRUCTOR Y GESTIÓN DE OUTFITS ✅ COMPLETADA (v1.33.0)

- [x] **1 · Objetivo** — un outfit es una entidad propia que **referencia** prendas. Cambiar el
      nombre, el color o la foto de una prenda se ve en todos sus outfits, sin tocarlos.
- [x] **2 · Acceso** — pestañas **Prendas | Outfits** dentro de Gestión → Armario, con el mismo
      `ToggleTab` que ya separa Mes/Agenda en el Calendario. Con el contador en cada pestaña.
- [x] **3 · Pantalla de outfits** — título, subtítulo, total, buscador, filtros y botón de crear.
- [x] **4 · Crear outfit** — nombre editable, con su flujo propio.
- [x] **5 · Selección de prendas** — agrupadas por **zona del cuerpo** (superior, inferior, calzado,
      abrigo, accesorios, otros), no por las 14 categorías: es como se piensa al vestirse. **Sin
      límite de prendas** ni por outfit ni por zona — camiseta + camiseta + sudadera es válido.
- [x] **6 · Buscador de prendas** — **reutiliza `prendasVisibles` de la Fase 1 tal cual**. Ni un
      segundo sistema de búsqueda.
- [x] **7 · Selección visual** — mismo fallback de la Fase 1 sin foto; borde de acento y ✓ en la
      esquina al elegirla; volver a pulsar la quita.
- [x] **8 · Vista previa** — las prendas agrupadas por zona mientras se construye. Sin silueta
      artificial: la especificación dice expresamente que no hace falta.
- [x] **9 · Foto del outfit** — opcional. Sin ella, la portada se compone con las fotos de sus
      prendas.
- [x] **10 · Información** — nombre (obligatorio), descripción, ocasión (11), estación (5) y lugar.
- [x] **11 · Personas** — lista de texto libre, **no un sistema social** (lo prohíbe el apartado).
      Se guarda como array para que la Fase 3 pueda preguntar "¿qué outfit usé con esta persona?".
- [x] **12 · Favoritos** — marcables desde la tarjeta y desde el detalle, y filtrables.
- [x] **13 · Editar** — los nueve campos.
- [x] **14 · Duplicar** — desde la tarjeta y desde el detalle.
- [x] **15 · Eliminar** — con confirmación, y **sin tocar ninguna prenda**. La interfaz lo dice.
- [x] **16 · Detalle** — todo lo que tenga, más editar / duplicar / eliminar / favorito.
- [x] **17 · Acceso directo a las prendas** — pulsar una prenda dentro del outfit cambia a la
      pestaña Prendas y abre **su** detalle, el mismo de la Fase 1.
- [x] **18 · Información de uso** — `usos` y `ultimoUso` existen, vacíos. **No se tocan** en esta
      fase (apartado 8 del cierre: "no inventes datos").
- [x] **19 · Modelo de datos** — los 14 campos, con `prendaIds` como única relación.
- [x] **20 · Usuario** — clave `armario` en `app_data`, con la RLS por `user_id` de siempre.
- [x] **21 · Imágenes** — bucket `armario`, URLs firmadas de una hora. **La foto de una prenda no
      se copia dentro del outfit**: se reutiliza la de la prenda.
- [x] **22 · Filtros** — favoritos, ocasión, estación, lugar y **prenda utilizada**.
- [x] **23 · Búsqueda** — con el ejemplo literal funcionando: **"negro" encuentra "Total Black"**
      porque contiene una prenda negra, aunque su nombre no lleve esa palabra.
- [x] **24 · Ordenación** — 5 activas; las 3 que dependen del uso están escritas y probadas pero
      no se ofrecen hasta que haya un uso registrado (regla 8).
- [x] **25 · Experiencia rápida** — nombre → prendas → guardar. Todo lo demás, plegado.
- [x] **26 · Diseño** — mismos componentes, tokens y tarjetas que la pestaña de Prendas.
- [x] **27 · Estado vacío** — con el texto exacto de la especificación.
- [x] **28 · Compatibilidad con Fase 3** — `armario.usos` ya está declarado como lista: cada uso
      será **un registro independiente** con fecha, lugar, personas y evento. Un outfit podrá
      tener muchos usos, no una sola fecha.
- [x] **29 · Compatibilidad con Fase 4** — nada de lo necesario se pierde: `prendaIds` permite
      contar prendas más repetidas, y `usos`/`ultimoUso` esperan a la Fase 3 sin datos inventados.
- [x] **30 · No romper nada** — 545 comprobaciones en verde.
- [x] **31 · Pruebas obligatorias** — las de crear, editar, relaciones, duplicar, eliminar y
      búsqueda están automatizadas (185 comprobaciones del armario). Las de responsive y
      persistencia real en Supabase siguen siendo de Josué (**R1**).

**La decisión que la especificación dejaba abierta (apartado 10 de la continuación): qué pasa al
borrar una prenda que está en un outfit.** De las tres salidas posibles se elige **conservar la
referencia y mostrarla como no disponible**, y el motivo es concreto: desde ME Fase 3 borrar una
prenda la manda a la papelera, así que **se puede restaurar**. Si al borrarla le quitáramos su id a
todos los outfits, restaurarla dejaría los outfits rotos para siempre — el dato volvería pero el
vínculo no. Conservando la referencia, **restaurar la prenda cura los outfits solos**, sin ningún
código de reparación. Mientras tanto el outfit lo dice, y el detalle explica que se recupera desde
Eliminados recientemente. Además, la confirmación de borrado avisa: *"está en 2 outfits"*.

**Del pulido final (los tres bloques de la fase):** contador de selección, quitar una prenda
volviendo a pulsarla, aviso de "Outfit guardado ✓" que se va solo, editar y duplicar a un toque
desde la tarjeta, eliminar **separado** de esas dos y solo dentro del detalle con confirmación,
indicador de "1 prenda no disponible" (que cuenta tanto la lavadora como una prenda borrada), y el
detalle releyéndose del array para que un cambio se vea al instante sin recargar.

**Un fallo mío corregido durante la fase:** al escribir el detalle del outfit dejé un `</div>` de
más, y el proyecto dejó de compilar. Lo cazó `scripts/smoke.mjs` antes de llegar a ninguna parte.

#### AR · Fase 3/4 — CALENDARIO + HISTORIAL DE USO DEL ARMARIO ✅ COMPLETADA (v1.34.0)

- [x] **1 · Concepto principal** — cada uso es **un registro independiente**. Ponerse el mismo
      outfit el 1, el 5 y el 12 son tres registros, no una fecha que se pisa.
- [x] **2 · Calendario** — tercera pestaña del Armario: **Prendas | Outfits | Calendario**.
      Reutiliza `celdasMes` del Calendario Universal; **ni un segundo motor de calendario**.
- [x] **3 · Vista mensual** — rejilla del mes con navegación, "hoy" marcado y vuelta a hoy
      pulsando el nombre del mes.
- [x] **4 · Día con outfit** — se pinta la **miniatura de la prenda** al 55 % detrás del número,
      no un punto de color.
- [x] **5 · Varios outfits en un mismo día** — se admiten y se cuentan: una insignia con el número
      en la esquina de la celda, y el detalle del día los lista todos.
- [x] **6 · Registrar uso** — outfit + fecha es lo único obligatorio; el resto es opcional.
- [x] **7 · Registrar desde el outfit** — botón **"Me lo he puesto hoy"** en su detalle, a un toque.
- [x] **8 · Registrar desde el calendario** — pulsar un día vacío abre el formulario con esa fecha
      ya puesta.
- [x] **9 · Fecha y hora** — la fecha es un **día local "AAAA-MM-DD"**, nunca un instante UTC. Aquí
      se destapó el fallo de `todayISO()` que afectaba a toda la app (ver abajo).
- [x] **10 · Lugar** — texto libre; los lugares escritos alimentan el filtro sin repetirse.
- [x] **11 · Personas** — lista de texto libre, **no un sistema social**.
- [x] **12 · Evento / ocasión** — los 9 del apartado, **distintos de la ocasión del outfit**: el
      outfit puede ser "de cena"; este uso concreto, "la cena de cumpleaños de Jorge".
- [x] **13 · Notas** — opcionales, visibles en la fila del historial.
- [x] **14 · Editar un uso** — todos los campos, desde el calendario y desde la lista.
- [x] **15 · Eliminar un uso** — pasa por la papelera (`armario.usos`), así que se puede restaurar.
- [x] **16 · Cambio de fecha** — editar la fecha mueve el uso de día sin duplicarlo.
- [x] **17 · Calendario como centro visual** — es la pestaña que abre la vista mensual por defecto.
- [x] **18 · Vista de lista** — alternativa cronológica al mes, con los 60 más recientes.
- [x] **19 · Filtros del historial** — outfit, **prenda**, ocasión, lugar y persona, combinables.
- [x] **20 · Rango de fechas** — los 5 del apartado (todo / 7 / 30 / 90 / 365 días).
- [x] **21 · Outfits sin historial** — lo dicen con una frase y un botón para registrar el primero.
- [x] **22 · Prendas sin historial** — **"Todavía no hay datos de uso."**, nunca "0 días" ni una
      fecha inventada (apartado 28, literal).
- [x] **23 · Relación con prendas** — el historial de una prenda **se deduce**: sus outfits → los
      usos de esos outfits. Josué nunca registra una prenda suelta y aun así la prenda tiene
      historial.
- [x] **24 · Modelo de datos** — 10 campos por uso. **Ningún contador guardado** (apartado 17): se
      quitaron `usos`/`ultimoUso` de prenda y outfit.
- [x] **25 · Seguridad** — clave `armario` en `app_data` con la RLS por `user_id` de siempre. Un
      uso viaja dentro del mismo paquete que las prendas y los outfits: **no hay una tabla nueva
      ni una vía nueva de acceso**, así que hereda el aislamiento ya verificado. Ninguna clave de
      API en el cliente; nada nuevo sale del dispositivo.
- [x] **26 · Borrado de outfit** — **el historial se conserva** (ver la decisión, abajo).
- [x] **27 · Edición de prenda** — no toca ningún uso: los usos apuntan al outfit, no a la prenda.
- [x] **28 · Rendimiento** — las ordenaciones por uso van contra un **índice construido en una
      pasada** (`indiceUsoPrendas` / `indiceUsoOutfits`), no recorriendo el historial dentro de
      cada comparación del `sort`.
- [x] **29 · Móvil** — mismos componentes, celdas cuadradas y modales por `createPortal`.
- [x] **30 · Acceso rápido** — el uso aparece en el **Calendario Universal** como fuente
      **derivada** (regla 11): se genera en cada render desde `armario.usos`, nunca se copia.
      Borrar un uso lo quita del calendario en el mismo render, sin código de limpieza.
- [x] **31 · Integración con Fase 1 y Fase 2** — las tres ordenaciones por uso que la Fase 1 dejó
      escondidas **ya se ofrecen** en cuanto hay un uso, y ahora salen del historial real.
- [x] **32 · Preparación para Fase 4** — todo lo que el anti-repetición necesita ya está y es
      consultable: `diasDesde`, `usosDePrenda`, `usosDeOutfit`, los índices de uso y los filtros
      por persona y por lugar.
- [x] **33 · Experiencia final** — un toque para registrar lo de hoy; todo lo demás, plegado.
- [x] **34 · Pruebas obligatorias** — la batería del apartado 40 está automatizada.
- [x] **35 · Prueba crítica** — la del apartado 41, número a número:
      `Vaquero gris → 3 usos, último 2026-08-20` · `Casual Gris → 2, 2026-08-20` ·
      `Cena Negra → 1, 2026-08-15`. Todo derivado; nada escrito a mano.
- [x] **36 · No romper nada** — **661 comprobaciones en verde**.

**La decisión del apartado 32 (borrar un outfit que tiene historial):** se **conserva el
historial**, igual que la Fase 2 conservó las prendas dentro de los outfits y por el mismo motivo:
el outfit va a la papelera, o sea que puede volver. Si al borrarlo se borraran sus usos,
restaurarlo devolvería el outfit pero no su historia. Conservándolos, **restaurar lo cura todo
solo**. Mientras el outfit no esté, la fila del historial dice *"Outfit eliminado"* en vez de
fingir que ese día no pasó nada, y la confirmación de borrado avisa de cuántos usos hay.

**Dos fallos reales de toda la app que destapó esta fase** (los dos en `src/lib/helpers.js`, los
dos por usar `toISOString()`, que da siempre UTC):

1. **`todayISO()` devolvía AYER entre las 00:00 y las 01:00/02:00** en España. Registrar el sueño a
   las 00:30 lo archivaba en el día anterior — y lo mismo un gasto, una comida, un hábito o una
   entrada del diario. Lo avisaba el apartado 9 para el armario; el fallo era de todo el proyecto.
2. **`addDays()` restaba un día entero**: `addDays('2026-08-25', 1)` devolvía `'2026-08-25'`, y
   `addDays('2026-01-15', 7)` devolvía el 21 en vez del 22. Lo usan la recurrencia del Calendario y
   las predicciones.

#### AR · Fase 4/4 — SISTEMA INTELIGENTE ANTI-REPETICIÓN + ESTADÍSTICAS + RECOMENDACIONES ✅ COMPLETADA (v1.35.0)

Cierra el bloque **AR (4/4)**. Todo vive en `src/lib/armarioInteligencia.js`, un módulo puro nuevo
que **consume** lo de las fases 1-3 y no recalcula ni una relación por su cuenta.

- [x] **1 · Fuente de verdad** — cero contadores nuevos. Los índices se construyen al vuelo, se
      consultan y se tiran al acabar el render: nunca se guardan, así que nunca se desincronizan.
- [x] **2 · "Hace X días"** — ahora también en la tarjeta de prenda y en la de outfit, no solo en
      el detalle. Calculado, nunca guardado. Sin historial no se pinta: "Nunca utilizado" en cada
      tarjeta de un armario recién creado es ruido, no información.
- [x] **3 · Estadísticas de outfits** — total, usados, sin estrenar, más usado, menos usado,
      último usado y rankings.
- [x] **4 · Estadísticas de prendas** — más usadas, nunca usadas, la más reciente y las que llevan
      más tiempo sin aparecer en un outfit. **El uso de una prenda se deriva de sus outfits**, con
      el ejemplo literal del apartado comprobado: 3 usos + 5 usos = 8, y sigue siendo UNA prenda.
- [x] **5 · Diversidad del armario** — `prendas usadas ÷ prendas disponibles`, una división que
      cualquiera puede rehacer a mano. **No cuenta las que están en la lavandería**: una camiseta
      que ha estado el mes entero en el cesto no se ha usado, pero eso no es falta de diversidad.
- [x] **6 · Anti-repetición** — cuatro estados (sin estrenar / usado hace poco / usado esta semana
      / hace tiempo que no lo usas). **Ninguno prohíbe nada**: solo cambia lo que se dice.
- [x] **7 · Recomendación de outfit** — con sus **motivos en texto**, sacados de los mismos números
      que la ordenaron. Si no se puede explicar, no se enseña.
- [x] **8 · Contexto** — lugar, ocasión, personas y temporada **suman señales, nunca excluyen**. El
      lugar se mira en el HISTORIAL REAL, no solo en la etiqueta del outfit: haberlo llevado tres
      veces a la universidad pesa más que una etiqueta puesta al crearlo.
- [x] **9 · Prendas no disponibles** — penalización fuerte, no veto: cualquier alternativa completa
      gana, pero el outfit sigue apareciendo y **dice qué prenda concreta le falta**.
- [x] **10 · Repetición de prendas** — "la has usado 8 veces en los últimos 14 días", como
      información. Solo mira la ventana reciente: 40 usos en dos años no es sobreutilización.
- [x] **11 · Combinaciones repetidas** — detecta el mismo CONJUNTO de prendas aunque esté guardado
      en outfits distintos (el caso de un outfit duplicado y renombrado). No crea outfits nuevos.
- [x] **12 · Outfits poco utilizados** — los que existen y llevan 30 días o más sin usarse. Los
      que nunca se han estrenado **no** entran: eso es otra cosa y tiene su propia lista.
- [x] **13 · Prendas infrautilizadas** — nunca usadas primero, después las olvidadas. Las que están
      en la lavandería quedan fuera: sugerirlas no es una sugerencia, es un despiste.
- [x] **14 · Panel inteligente** — "Tu armario hoy", con frases generadas de los números reales.
      Cada frase aparece solo si su dato existe.
- [x] **15 · Filtros temporales** — 7 / 30 / 90 días, este año, todo y desde una fecha. "Este año"
      empieza el 1 de enero, que no es lo mismo que "hace 365 días".
- [x] **16 · Puntuación** — la única que hay es la diversidad, y es una fracción explicada con sus
      dos números crudos a la vista. No se ha inventado ningún "índice de estilo" sin sentido.
- [x] **17 · Privacidad** — ni una consulta nueva, ni una tabla nueva. Todo se calcula en el
      dispositivo sobre el `armario` que ya viajaba con la RLS por `user_id`.
- [x] **18 · Rendimiento** — un índice por rejilla, no un recorrido por tarjeta; los períodos
      recortan antes de agregar. **Se corrigió un fallo mío de este tipo** durante la fase.
- [x] **19 · Móvil** — tarjetas compactas, bloques plegables y el flujo rápido entero:
      **Recomiéndame → outfit con sus motivos → "Me lo pongo"**, tres toques.
- [x] **20 · Integración** — cuatro subpestañas con `flex-wrap`, el mismo patrón que Productividad
      ya usa con cinco. Las estadísticas se abren **desde Prendas y desde Outfits**, y son LAS
      MISMAS: un solo sistema, no tres pantallas de estadísticas.
- [x] **21 · Estados vacíos** — sin historial, la pestaña dice qué hacer para tenerlo.
- [x] **22 · Datos insuficientes** — por debajo de 5 usos **no se recomienda**, y se dice cuántos
      faltan. Con menos, "el que hace más tiempo que no usas" es solo el que registraste primero.
- [x] **23 · Pruebas obligatorias** — automatizadas las que no necesitan navegador.
- [x] **24 · Prueba crítica** — el escenario literal del apartado, comprobado número a número.
- [x] **25 · No implementar** — ni IA de moda, ni generación por IA, ni compras, ni tiendas, ni
      nada social. **Ninguna llamada a la IA en toda la fase.**
- [x] **26 · Calidad** — código muerto eliminado (un import sin usar), imports revisados, y las
      fases 1-3 intactas.
- [x] **27 · Criterio de finalización** — 777 comprobaciones en verde.

**Un fallo real encontrado y corregido durante la fase:** `noDisponiblesDeOutfit` devuelve un
**número**, y yo lo estaba tratando como una lista. `noDisponibles.length` era `undefined`, así que
`> 0` era siempre falso y **la penalización del apartado 9 no se aplicaba nunca**: el outfit con una
prenda en la lavandería salía como primera recomendación. No daba error ni en consola ni al
compilar — lo cazó la prueba del apartado 9. Arreglado en el origen: se ha añadido
`prendasNoDisponiblesDeOutfit`, que devuelve la lista, y `noDisponiblesDeOutfit` pasa a ser su
longitud, para que las dos respuestas salgan siempre del mismo cálculo.

**Dos cosas más que se corrigieron al releer el código antes de cerrar:**

1. **La recomendación se guardaba en el estado**, así que registrar un uso desde la propia tarjeta
   dejaba en pantalla un "hace 20 días" que acababa de dejar de ser verdad — la tarjeta se
   contradecía con el botón que se acababa de pulsar. Ahora solo se guarda *si* se ha pedido; el
   resultado se deriva del historial actual.
2. **"Más usados" y "menos usados" mostraban la misma lista al revés** cuando había 5 outfits
   usados o menos. Ahora el segundo ranking solo aparece cuando hay más de 5, que es cuando las
   dos listas contienen outfits distintos.

**Por qué las estadísticas están en una pestaña y no repartidas:** el apartado 3 las pide "dentro
del área de Outfits" y el 4 "dentro del Armario", pero las dos se apoyan en el mismo historial y
comparten el filtro temporal del apartado 15. Partirlas obligaría a mantener dos veces el mismo
selector de período y a que Josué eligiera "30 días" dos veces para ver una foto coherente. Están
juntas en **Ideas** y se llega desde las dos pestañas, con el botón "Ver estadísticas" que cada una
tiene arriba. El apartado 20 lo pide expresamente: no duplicar sistemas.

## SR · SONIDO Y RACHAS — 5 + 4 fases

⚠️ **Este bloque contiene DOS especificaciones con numeración solapada** (Sistema de Sonido, 5 fases; Sistema de Rachas, 4 fases). La checklist las fusiona porque no hay forma automática de separarlas con certeza. **Aclarar con Josué si son uno o dos módulos antes de tocar nada** — ver aviso 3 arriba.

#### SR · Fase 1/5+4 — ARQUITECTURA + MOTOR GLOBAL DE AUDIO
- [ ] OBJETIVO PRINCIPAL
- [ ] CONCEPTO FUNDAMENTAL
- [ ] TIPOS DE RACHAS
- [ ] REGLA DE DÍA
- [ ] QUÉ SIGNIFICA “COMPLETAR UN DÍA”
- [ ] EVENTOS DE RACHA
- [ ] RACHA ACTUAL
- [ ] NO PENALIZAR PREMATURAMENTE
- [ ] MEJOR RACHA
- [ ] HISTORIAL
- [ ] DÍAS PERDIDOS
- [ ] FUTURA FLEXIBILIDAD
- [ ] GRACIAS A ESTO, EL SISTEMA PODRÁ CRECER
- [ ] RACHAS FUTURAS PERSONALIZADAS
- [ ] SUPABASE
- [ ] SEGURIDAD
- [ ] CONSISTENCIA
- [ ] IDEMPOTENCIA
- [ ] SINCRONIZACIÓN
- [ ] OFFLINE
- [ ] CASOS EXTREMOS
- [ ] NO QUIERO GAMIFICACIÓN TODAVÍA
- [ ] RESULTADO ESPERADO DE ESTA FASE
- [ ] REGLA FUNDAMENTAL PARA IMPLEMENTARLO
- [ ] ANTES DE MODIFICAR EL PROYECTO
- [ ] DOCUMENTACIÓN DE LA IMPLEMENTACIÓN
- [ ] Qué has encontrado en el proyecto.
- [ ] Qué arquitectura has elegido.
- [ ] Qué archivos has creado o modificado.
- [ ] Qué lógica de rachas has implementado.
- [ ] Qué queda preparado para futuras fases.
- [ ] Qué NO has implementado porque corresponde a fases posteriores.
- [ ] Cómo puedo probar que el motor funciona correctamente.
- [ ] CRITERIO DE FINALIZACIÓN
- [ ] PRIMERO: INSPECCIONA LA APP ACTUAL
- [ ] PRINCIPIO MOBILE-FIRST
- [ ] RACHA PRINCIPAL EN DASHBOARD
- [ ] TARJETA DE RACHA
- [ ] ESTADOS VISUALES
- [ ] CENTRO DE RACHAS
- [ ] JERARQUÍA
- [ ] DETALLE DE UNA RACHA
- [ ] CALENDARIO DE RACHA
- [ ] NO HACER UN CALENDARIO GIGANTE
- [ ] PROGRESO HACIA EL SIGUIENTE HITO
- [ ] RÉCORD PERSONAL
- [ ] LOGROS
- [ ] DETALLE DE LOGRO
- [ ] CELEBRACIONES
- [ ] NIVELES DE CELEBRACIÓN
- [ ] ANIMACIONES
- [ ] FEEDBACK AL COMPLETAR
- [ ] NO DUPLICAR FEEDBACK
- [ ] SONIDO
- [ ] HAPTICS
- [ ] COLORES
- [ ] DARK MODE
- [ ] ACCESIBILIDAD
- [ ] EMPTY STATES
- [ ] PRIMER DÍA
- [ ] RACHA ROTA
- [ ] RECUPERACIÓN
- [ ] RECORDATORIO VISUAL
- [ ] MÓVIL
- [ ] RENDIMIENTO
- [ ] COMPONENTES
- [ ] NAVEGACIÓN
- [ ] MICROINTERACCIONES
- [ ] NO SOBRECARCAR
- [ ] PRUEBAS VISUALES
- [ ] NO AVANCES A SONIDO
- [ ] INFORME FINAL
- [ ] Componentes creados/modificados.
- [ ] Pantallas creadas/modificadas.
- [ ] Integración con Dashboard.
- [ ] Sistema de estados.
- [ ] Calendario.
- [ ] Logros.
- [ ] Celebraciones.
- [ ] Animaciones.
- [ ] Adaptación móvil.
- [ ] Accesibilidad.
- [ ] Pruebas realizadas.
- [ ] Qué queda para la Fase 5.

#### SR · Fase 2/5+4 — BASE DE DATOS + SUPABASE + SEGURIDAD + SINCRONIZACIÓN
- [ ] OBJETIVO
- [ ] BIBLIOTECA CENTRAL
- [ ] CATEGORÍAS
- [ ] BIBLIOTECA INICIAL
- [ ] FILOSOFÍA DEL SONIDO
- [ ] JERARQUÍA SONORA
- [ ] DURACIÓN
- [ ] NO HACER LOUDNESS EXCESIVO
- [ ] ASIGNACIONES
- [ ] NO CODIFICAR ASIGNACIONES EN COMPONENTES
- [ ] SONIDO PREDETERMINADO
- [ ] FALLBACK
- [ ] PREPARACIÓN PARA PERSONALIZACIÓN
- [ ] METADATA
- [ ] PRESETS
- [ ] PACK PREDETERMINADO
- [ ] SONIDOS DE RACHA
- [ ] PROGRESIÓN SONORA
- [ ] RÉCORD
- [ ] LOGRO
- [ ] RUPTURA DE RACHA
- [ ] VOLUMEN POR CATEGORÍA
- [ ] MUTE
- [ ] VOLUMEN 0
- [ ] MEMORIA
- [ ] CONCURRENCIA
- [ ] COLA DE SONIDOS
- [ ] INTERRUPCIÓN
- [ ] TEST DE BIBLIOTECA
- [ ] ESTRUCTURA DE ARCHIVOS
- [ ] SUPABASE
- [ ] CACHE/PWA
- [ ] COMPATIBILIDAD
- [ ] NO AÑADIR SONIDOS A TODO
- [ ] CRITERIO DE FINALIZACIÓN
- [ ] NO IMPLEMENTAR TODAVÍA
- [ ] INFORME FINAL
- [ ] Biblioteca creada.
- [ ] Categorías.
- [ ] Eventos conectados.
- [ ] Asignaciones.
- [ ] Prioridades.
- [ ] Fallback.
- [ ] Control de volumen.
- [ ] Gestión de concurrencia.
- [ ] Compatibilidad PWA/iOS.
- [ ] Pruebas.
- [ ] Problemas encontrados.
- [ ] Qué queda para la Fase 3.

#### SR · Fase 3/5+4 — MOTOR DE EVENTOS, FEEDBACK Y RECOMPENSAS SONORAS
- [ ] OBJETIVO DE LA FASE
- [ ] PRINCIPIO FUNDAMENTAL
- [ ] CATEGORÍAS DE EVENTOS SONOROS
- [ ] PRIORIDAD DE LOS SONIDOS
- [ ] REGLA DE NO SATURACIÓN
- [ ] COOLDOWN SONORO
- [ ] SISTEMA DE EVENTOS
- [ ] EVENTOS COMPUESTOS
- [ ] SISTEMA ESPECIAL DE RACHA
- [ ] RACHA NORMAL VS. MILESTONE
- [ ] RÉCORD PERSONAL
- [ ] RACHA EN RIESGO
- [ ] RECUPERACIÓN DE RACHA
- [ ] PROTECCIÓN DE RACHA
- [ ] RECOMPENSAS
- [ ] XP
- [ ] NIVELES
- [ ] INSIGNIAS
- [ ] OBJETIVOS
- [ ] VIBRACIÓN + SONIDO
- [ ] CONFIGURACIÓN DEL USUARIO
- [ ] MODOS DE SONIDO
- [ ] MODO PERSONALIZADO
- [ ] REGLA DE PRIORIDAD DEL VOLUMEN
- [ ] PREVISUALIZACIÓN
- [ ] SISTEMA DE SILENCIO INTELIGENTE
- [ ] SONIDOS DURANTE SESIONES
- [ ] IDENTIDAD SONORA
- [ ] ESTRUCTURA TÉCNICA RECOMENDADA
- [ ] REGISTRO CENTRAL DE SONIDOS
- [ ] COLA DE SONIDOS
- [ ] PERSISTENCIA
- [ ] SEGURIDAD Y ROBUSTEZ
- [ ] CARGA DE AUDIO
- [ ] PRIMER ARRANQUE
- [ ] EVENTO DE PRIMERA INTERACCIÓN
- [ ] REGLA DE ACCESIBILIDAD
- [ ] CRITERIOS DE ACEPTACIÓN
- [ ] RESULTADO FINAL DE LA FASE
- [ ] PRIMERO: INSPECCIONA EL PROYECTO
- [ ] OBJETIVO
- [ ] MODELO DE DATOS
- [ ] USER_ID
- [ ] ROW LEVEL SECURITY
- [ ] INTEGRIDAD DE DATOS
- [ ] FECHAS
- [ ] ZONA HORARIA
- [ ] CREACIÓN DE RACHAS
- [ ] REGISTRAR CUMPLIMIENTO
- [ ] NO CONFÍES EN EL CLIENTE
- [ ] CONTADORES DERIVADOS
- [ ] SERVICIO DE RECÁLCULO
- [ ] SINCRONIZACIÓN
- [ ] CACHE LOCAL
- [ ] OFFLINE
- [ ] CONFLICTOS
- [ ] ELIMINACIÓN O MODIFICACIÓN DE EVENTOS
- [ ] EVENT SOURCE
- [ ] AUDITORÍA BÁSICA
- [ ] MIGRACIONES
- [ ] TIPOS TYPESCRIPT
- [ ] HOOK CENTRAL
- [ ] RENDIMIENTO
- [ ] PREPARACIÓN PARA NOTIFICACIONES
- [ ] PREPARACIÓN PARA GAMIFICACIÓN
- [ ] PRUEBAS
- [ ] NO IMPLEMENTAR TODAVÍA
- [ ] CRITERIO DE FINALIZACIÓN
- [ ] INFORME FINAL
- [ ] Arquitectura utilizada.
- [ ] Tablas/migraciones creadas o modificadas.
- [ ] Políticas RLS implementadas.
- [ ] Servicios/hooks creados.
- [ ] Sistema de sincronización.
- [ ] Pruebas realizadas.
- [ ] Problemas encontrados.
- [ ] Qué queda pendiente para la Fase 3.

#### SR · Fase 4 — DISEÑO Y ESPECIFICACIÓN DE LOS SONIDOS INDIVIDUALES
- [ ] OBJETIVO
- [ ] IDENTIDAD SONORA DE JC LIFESTYLE
- [ ] REGLA DE DURACIÓN
- [ ] FAMILIAS SONORAS
- [ ] FAMILIA UI
- [ ] FAMILIA FEEDBACK
- [ ] FAMILIA PROGRESS
- [ ] XP
- [ ] LEVEL UP
- [ ] RECOMPENSA
- [ ] INSIGNIAS
- [ ] OBJETIVO COMPLETADO
- [ ] SISTEMA DE RACHA
- [ ] STREAK_START
- [ ] STREAK_INCREMENT
- [ ] STREAK MILESTONES
- [ ] MILESTONE 3
- [ ] MILESTONE 7
- [ ] MILESTONE 14
- [ ] MILESTONE 21
- [ ] MILESTONE 30
- [ ] MILESTONE 50
- [ ] MILESTONE 75
- [ ] MILESTONE 100
- [ ] MILESTONE 180
- [ ] MILESTONE 365
- [ ] RÉCORD PERSONAL
- [ ] RACHA EN RIESGO
- [ ] STREAK FREEZE
- [ ] STREAK RECOVERED
- [ ] ACHIEVEMENT
- [ ] GRAND ACHIEVEMENT
- [ ] SONIDOS DE SISTEMA
- [ ] HAPTICS
- [ ] DISEÑO DE LA ESCALA SONORA
- [ ] MOTIVO SONORO DE JC LIFESTYLE
- [ ] REGLA DE NO REPETICIÓN
- [ ] VARIANTES
- [ ] REGLA PARA LA ALEATORIEDAD
- [ ] TRANSICIONES
- [ ] MASTERING
- [ ] FORMATO
- [ ] NOMENCLATURA
- [ ] REGISTRO DEFINITIVO
- [ ] TESTING
- [ ] TEST DE SATURACIÓN
- [ ] TEST DE EVENTOS SIMULTÁNEOS
- [ ] OBJETIVO FINAL
- [ ] CRITERIOS DE ACEPTACIÓN DE LA FASE 4
- [ ] RESULTADO
- [ ] INSPECCIONA PRIMERO EL PROYECTO
- [ ] NO REPRODUCIR AUDIO DIRECTAMENTE
- [ ] EVENTOS DE AUDIO
- [ ] EVENTO ≠ SONIDO
- [ ] AUDIO ENGINE
- [ ] CONFIGURACIÓN GLOBAL
- [ ] CATEGORÍAS
- [ ] PRIORIDADES
- [ ] COLISIONES
- [ ] COOLDOWN
- [ ] SONIDOS DE INTERFAZ
- [ ] SONIDOS DE IMPORTANCIA
- [ ] WEB AUDIO / HTML AUDIO
- [ ] PWA;
- [ ] RESTRICCIONES DE IOS
- [ ] AUDIO CONTEXT
- [ ] PRELOAD
- [ ] CACHE
- [ ] ARCHIVOS DE AUDIO
- [ ] FORMATOS
- [ ] SONIDOS DEL SISTEMA
- [ ] SONIDOS PERSONALIZADOS
- [ ] METADATA
- [ ] ASIGNACIONES
- [ ] FALLBACK
- [ ] ERROR HANDLING
- [ ] AJUSTES FUTUROS
- [ ] PREFERENCIAS PERSISTENTES
- [ ] SINCRONIZACIÓN
- [ ] EVENT BUS
- [ ] DESACOPLAMIENTO
- [ ] TEST MODE
- [ ] PRUEBAS
- [ ] RENDIMIENTO
- [ ] ACCESIBILIDAD
- [ ] PRIVACIDAD
- [ ] SEGURIDAD FUTURA
- [ ] NO IMPLEMENTAR TODAVÍA
- [ ] CRITERIO DE FINALIZACIÓN
- [ ] INFORME FINAL
- [ ] Arquitectura elegida.
- [ ] Tecnología de audio utilizada y por qué.
- [ ] Archivos creados/modificados.
- [ ] Eventos soportados.
- [ ] Sistema de prioridades.
- [ ] Sistema de volumen.
- [ ] Sistema de fallback.
- [ ] Gestión de iOS/PWA.
- [ ] Preparación para sonidos personalizados.
- [ ] Pruebas realizadas.
- [ ] Problemas encontrados.
- [ ] Qué queda para la Fase 2.
- [ ] REGLA PRINCIPAL
- [ ] SISTEMA DE HITOS
- [ ] MÚLTIPLES TIPOS DE RACHA
- [ ] LOGROS
- [ ] LOGROS DESBLOQUEADOS
- [ ] NO REPETIR RECOMPENSAS
- [ ] HITO ≠ LOGRO
- [ ] PROGRESIÓN
- [ ] RÉCORD SUPERADO
- [ ] EVENTOS DE GAMIFICACIÓN
- [ ] RECOMPENSAS
- [ ] NIVELES
- [ ] PUNTOS / XP
- [ ] RACHAS ESPECIALES
- [ ] LOGROS OCULTOS
- [ ] ESTADOS
- [ ] PROGRESO HACIA LOGROS
- [ ] ESTADÍSTICAS
- [ ] CALENDARIO FUTURO
- [ ] RACHAS GLOBALES
- [ ] FILOSOFÍA DE GAMIFICACIÓN
- [ ] CELEBRACIONES
- [ ] PREPARACIÓN PARA SONIDOS
- [ ] PREPARACIÓN PARA NOTIFICACIONES
- [ ] ANTI-EXPLOIT
- [ ] RECÁLCULO
- [ ] MODELO DE DATOS
- [ ] TIPADO
- [ ] SERVICIO CENTRAL
- [ ] HOOK
- [ ] PRUEBAS OBLIGATORIAS
- [ ] Resume qué has implementado.
- [ ] Indica las tablas/migraciones nuevas.
- [ ] Indica los servicios/hooks.
- [ ] Indica los eventos creados.
- [ ] Indica los logros/hitos configurados.
- [ ] Indica las pruebas realizadas.
- [ ] Explica brevemente cualquier decisión arquitectónica importante.
- [ ] Indica qué queda para la Fase 4.

#### SR · Fase 5/5+4 — PRODUCCIÓN, INTEGRACIÓN Y TEST FINAL
- [ ] Implementa realmente todo lo correspondiente a esa fase.
- [ ] Comprueba que funciona.
- [ ] Comprueba que no has roto funcionalidades existentes.
- [ ] Explícame brevemente qué has hecho.
- [ ] Indica claramente:
- [ ] Analiza la arquitectura existente.
- [ ] Identifica cómo están organizados actualmente los módulos.
- [ ] No reemplaces funcionalidades existentes innecesariamente.
- [ ] No elimines código funcional.
- [ ] No cambies diseños que no estén relacionados con esta implementación.
- [ ] Mantén compatibilidad con los módulos existentes.
- [ ] Integra el sistema de sonido de forma modular.
- [ ] Qué has implementado.
- [ ] Qué archivos/componentes has creado o modificado.
- [ ] Qué has comprobado.
- [ ] Qué porcentaje llevamos.
- [ ] Qué fase toca después.
- [ ] OBJETIVO
- [ ] ESTRUCTURA DE ARCHIVOS
- [ ] NOMBRES DE ARCHIVO
- [ ] FORMATOS DE AUDIO
- [ ] CALIDAD
- [ ] OPTIMIZACIÓN
- [ ] PRELOAD
- [ ] CACHE
- [ ] SOUND ENGINE
- [ ] API DEL MOTOR
- [ ] HOOK DE REACT
- [ ] NO ACOPLAR UI Y AUDIO
- [ ] EVENT BUS
- [ ] ORDEN DE PROCESAMIENTO
- [ ] SISTEMA DE PRIORIDADES
- [ ] SISTEMA DE INTERRUPCIÓN
- [ ] SISTEMA DE SECUENCIAS
- [ ] RACHA + RECOMPENSA
- [ ] RÉCORD + MILESTONE
- [ ] MULTITAREA
- [ ] MODO SILENCIOSO
- [ ] HAPTICS INDEPENDIENTES
- [ ] CONTROL DE VOLUMEN
- [ ] AJUSTES
- [ ] PERFILES
- [ ] BOTONES DE PRUEBA
- [ ] INDICADOR DE VOLUMEN
- [ ] ACCESIBILIDAD
- [ ] PRIMERA INTERACCIÓN
- [ ] ERROR DE AUDIO
- [ ] FALLBACK
- [ ] TELEMETRÍA
- [ ] TEST AUTOMÁTICO
- [ ] TEST DE RACHA
- [ ] TEST DE RÉCORD
- [ ] TEST DE RACHA EN RIESGO
- [ ] TEST DE RECUPERACIÓN
- [ ] TEST DE MODO SILENCIOSO
- [ ] TEST DE HAPTICS
- [ ] TEST DE CAMBIO DE VOLUMEN
- [ ] TEST DE CAMBIO DE PERFIL
- [ ] TEST EN MÓVIL
- [ ] TEST DE AURICULARES
- [ ] TEST DE INTERRUPCIÓN
- [ ] TEST DE CARGA
- [ ] CRITERIO DE CALIDAD
- [ ] CONTROL DE VERSIONES
- [ ] SISTEMA DE REEMPLAZO
- [ ] CHECKLIST FINAL DE PRODUCCIÓN
- [ ] ARQUITECTURA FINAL
- [ ] RESULTADO
- [ ] ESTADO FINAL DEL SISTEMA DE SONIDO
