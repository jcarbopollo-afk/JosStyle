> **Nota de procedencia:** transcripción íntegra y sin resumir del bloque «HORARIO TOP — 12 fases» del documento
> `JC_FITNESS___ESTILO_DE_HOMBRE.txt` que Josué pegó en el chat (líneas 28171–39771 del original completo,
> conservado sin tocar en `ORIGINAL_JC_FITNESS_ESTILO_DE_HOMBRE.txt`).
>
> **No editar ni resumir este contenido.** Si Josué amplía o corrige el texto, añadir lo nuevo o
> sustituir el apartado afectado, nunca recortar apartados existentes. El análisis y las conclusiones
> van en `docs/`, nunca aquí.
>
> ⚠️ **El documento original está en orden inverso** dentro de cada módulo (la última fase aparece
> primero) y contiene fragmentos de conversación intercalados. Eso es intencionado y se conserva.

---

INTRODUCCIÓN GENERAL — HORARIO TOP
IMPORTANTE: este documento no debe ejecutarse de golpe. Se debe desarrollar fase por fase, respetando el orden establecido. No avances a la siguiente fase hasta que la anterior esté completamente implementada, comprobada y funcionando.
CONTEXTO
Vamos a desarrollar HORARIO TOP, un módulo avanzado del Sistema Operativo Personal.
HORARIO TOP no debe entenderse como una simple tabla de horarios escolares. Su objetivo es convertirse en el motor temporal y de planificación del Sistema Operativo Personal: un sistema capaz de entender qué ocurre cada día, qué tienes que hacer, qué necesitas preparar, cuánto tiempo tienes disponible y cómo ayudarte a organizarlo.
El módulo deberá estar diseñado desde el principio pensando en:
* móvil como dispositivo principal;
* diseño premium;
* rapidez;
* facilidad de uso;
* personalización;
* sincronización Cloud;
* funcionamiento offline;
* multidispositivo;
* integración con IA;
* seguridad;
* escalabilidad;
* y futura conexión con el resto de módulos del Sistema Operativo Personal.
 
⸻
 
OBJETIVO PRINCIPAL
El usuario debe poder entrar en HOY y entender inmediatamente:
¿Qué tengo que hacer ahora, qué viene después y qué me queda pendiente?
El sistema deberá utilizar la hora real y la fecha real para actualizar automáticamente el contenido.
Por ejemplo:
08:00 — Matemáticas
09:00 — Inglés
10:00 — Biología
Cuando sean las 09:00, Matemáticas dejará de aparecer como actividad futura y pasará a Pasado/Completado, mientras Inglés se convierte en la actividad actual.
No queremos una aplicación estática.
Queremos un sistema vivo y consciente del tiempo.
 
⸻
 
EL HORARIO
El usuario podrá crear un horario de forma extremadamente sencilla.
Deberá poder:
* elegir cuántas columnas quiere;
* añadir columnas;
* eliminar columnas;
* configurar filas;
* establecer horas;
* crear bloques;
* modificar bloques;
* asignar materias;
* elegir colores;
* elegir iconos;
* añadir notas;
* duplicar horarios;
* crear distintos horarios;
* activar/desactivar horarios.
El diseño deberá ser flexible y no asumir que todos los horarios tienen exactamente siete columnas o una estructura determinada.
 
⸻
 
DIFERENTES TIPOS DE HORARIO
El sistema deberá permitir crear:
* Horario escolar
* Horario personal
* Horario de entrenamiento
* Horario de trabajo
* Horario personalizado
Y deberá estar preparado para futuros tipos.
 
⸻
 
HOY — CENTRO DEL SISTEMA
El apartado HOY será una de las partes más importantes.
Deberá reunir automáticamente la información relevante de:
* horario;
* calendario;
* tareas;
* exámenes;
* eventos;
* entrenamiento;
* objetivos;
* mochila;
* recordatorios;
* actividades pendientes.
La intención es que el usuario no tenga que entrar en diez apartados diferentes para saber qué tiene que hacer.
 
⸻
 
SISTEMA TEMPORAL
El sistema deberá entender:
* hora actual;
* fecha actual;
* día de la semana;
* duración;
* comienzo;
* finalización;
* actividades futuras;
* actividades actuales;
* actividades pasadas.
Las actividades podrán pasar automáticamente por estados como:
PROGRAMADA
↓
ACTUAL
↓
PASADA
↓
COMPLETADA
También deberá contemplar:
CANCELADA
REPROGRAMADA
OMITIDA
 
⸻
 
CALENDARIO + TAREAS + HORARIO
HORARIO TOP deberá estar conectado con el calendario y las tareas.
Ejemplo:
Examen de Biología el viernes.
El sistema deberá poder entender que:
* existe un examen;
* quedan determinados días;
* hay determinadas horas disponibles;
* puede ser necesario estudiar;
* puede ser necesario preparar material;
* puede ser necesario modificar la planificación.
 
⸻
 
MOCHILA
Una de las funciones diferenciales será la mochila inteligente.
El usuario podrá establecer qué necesita para determinadas materias.
Ejemplo:
Biología
→ bata

Matemáticas
→ calculadora

Dibujo
→ material específico
El sistema podrá utilizar el horario del día siguiente para preparar automáticamente una lista de lo que necesita llevar.
 
⸻
 
PLANIFICADOR
HORARIO TOP también incorporará un planificador inteligente.
Podrá encontrar huecos disponibles y ayudar a distribuir:
* estudio;
* tareas;
* entrenamiento;
* proyectos;
* objetivos;
* descansos.
No deberá llenar todos los huecos disponibles.
El sistema deberá entender que el tiempo libre también es importante.
 
⸻
 
IA
La IA será una capa inteligente sobre los datos reales.
El usuario podrá preguntar:
“¿Qué tengo mañana?”
“¿Cuándo puedo estudiar Física?”
“Organízame la tarde.”
“Tengo un examen el viernes, ¿cómo me organizo?”
“Tengo demasiadas cosas esta semana.”
La IA deberá consultar los datos reales antes de responder.
No deberá inventar información.
Y cuando quiera modificar datos importantes, deberá presentar una propuesta y solicitar confirmación cuando corresponda.
 
⸻
 
NOTIFICACIONES
El sistema tendrá un motor inteligente de notificaciones.
No queremos spam.
Las notificaciones deberán ser:
* contextuales;
* relevantes;
* configurables;
* cancelables;
* reprogramables;
* conscientes de los cambios.
Ejemplo:
Si un entrenamiento estaba a las 18:00 y se mueve a las 19:00, el recordatorio deberá actualizarse automáticamente.
 
⸻
 
ANALÍTICA
HORARIO TOP también analizará cómo se utiliza el tiempo.
Podrá estudiar:
* actividades planificadas;
* actividades completadas;
* tareas aplazadas;
* duración estimada;
* duración real;
* carga semanal;
* tiempo libre;
* cumplimiento de objetivos;
* patrones de planificación.
El objetivo no será juzgar al usuario, sino ayudarle a planificar mejor.
 
⸻
 
CLOUD Y SINCRONIZACIÓN
Desde el principio, la arquitectura deberá estar preparada para Cloud.
Se utilizará la arquitectura del Sistema Operativo Personal, incluyendo:
* autenticación;
* Supabase;
* PostgreSQL;
* Row Level Security;
* sincronización;
* almacenamiento;
* backups;
* migraciones;
* funcionamiento offline;
* sincronización multidispositivo.
No queremos construir primero una versión que después haya que rehacer completamente para conectarla a Cloud.
 
⸻
 
ARQUITECTURA MODULAR
El código deberá estar preparado para crecer.
No se debe crear un único componente gigantesco.
Se deberán separar responsabilidades como:
Horario
Calendario
Tareas
Exámenes
Mochila
Notificaciones
Planificador
Analítica
IA
Sincronización
Cada parte debe poder evolucionar sin romper las demás.
 
⸻
 
REGLA FUNDAMENTAL DE DESARROLLO
Durante todo el proyecto:
No simplificar funcionalidades importantes por comodidad de implementación.
Si una característica está especificada, debe implementarse correctamente.
Si una función necesita una arquitectura adicional, se debe construir esa arquitectura.
Si algo todavía no puede conectarse con otro módulo porque ese módulo aún no existe, deberá dejarse preparado mediante interfaces y estructuras compatibles.
 
⸻
 
DESARROLLO POR FASES
HORARIO TOP está dividido en 12 fases.
Cada fase desarrolla una parte concreta y, progresivamente, se conecta con las anteriores.
La progresión general será:
FASE 1
Base del sistema

↓
FASES 2–4
Horario + estructura + personalización

↓
FASES 5–7
HOY + tiempo + calendario + mochila

↓
FASES 8–9
Planificación + IA

↓
FASE 10
Notificaciones

↓
FASE 11
Analítica y aprendizaje

↓
FASE 12
Cloud + Supabase + arquitectura definitiva
 
⸻
 
INSTRUCCIÓN PARA CLAUDE
A partir de este punto, cuando se entregue una fase, debes trabajar exclusivamente en esa fase.
No debes saltarte fases.
No debes implementar únicamente una versión superficial.
Debes:
1. analizar la fase;
2. revisar cómo afecta a lo construido anteriormente;
3. implementar todas sus funcionalidades;
4. mantener compatibilidad con las fases anteriores;
5. preparar las conexiones necesarias con fases futuras;
6. comprobar estados, errores y casos límite;
7. mantener el diseño premium;
8. mantener la experiencia móvil como prioridad;
9. evitar duplicar lógica;
10. dejar el código preparado para la siguiente fase.
Cuando una fase esté terminada, indica claramente:
FASE X — COMPLETADA
y espera la orden:
“Sigue”
para continuar.
 
⸻
 
RESULTADO FINAL QUE BUSCAMOS
Al finalizar las 12 fases, HORARIO TOP deberá ser mucho más que un horario.
Deberá convertirse en un sistema temporal capaz de responder:
¿Qué tengo?
¿Qué estoy haciendo ahora?
¿Qué viene después?
¿Qué me queda?
¿Qué necesito llevar?
¿Cuándo tengo tiempo?
¿Cómo debería organizarme?
¿Qué estoy haciendo bien?
¿Dónde me estoy sobrecargando?
¿Cómo puedo mejorar mi planificación?
Y todo ello deberá funcionar integrado dentro del Sistema Operativo Personal, conectado con calendario, tareas, estudios, entrenamiento, objetivos, mochila, notificaciones, analítica, Cloud e IA.
 
⸻
 
ORDEN DE EJECUCIÓN
Esta introducción es únicamente el contexto general.
Después de ella se debe proporcionar:
FASE 1 — FUNDAMENTOS Y ARQUITECTURA BASE DE HORARIO TOP
Y comenzar la implementación desde cero sobre la arquitectura existente del Sistema Operativo Personal, sin saltarse ninguna de las especificaciones definidas en las fases posteriores.

HORARIO TOP
FASE 12 — CLOUD + SUPABASE + SINCRONIZACIÓN + ARQUITECTURA DEFINITIVA
Esta es la última fase del módulo HORARIO TOP. Aquí vamos a convertir todo lo diseñado anteriormente en una arquitectura técnica preparada para que Claude pueda implementarla dentro del Sistema Operativo Personal.
La regla será:
HORARIO TOP no será una función aislada. Será un sistema conectado al núcleo del Sistema Operativo Personal.
 
⸻
 
1. ARQUITECTURA GENERAL
La arquitectura definitiva será:
                ┌─────────────────────┐
                │     USUARIO         │
                └──────────┬──────────┘
                           ↓
                ┌─────────────────────┐
                │   SISTEMA PERSONAL  │
                │      FRONTEND       │
                └──────────┬──────────┘
                           ↓
                ┌─────────────────────┐
                │ MOTOR HORARIO TOP   │
                └──────────┬──────────┘
                           ↓
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
   CALENDARIO           TAREAS             MOCHILA
        ↓                  ↓                  ↓
   EXÁMENES          OBJETIVOS          NOTIFICACIONES
        └──────────────────┼──────────────────┘
                           ↓
                   MOTOR IA / REGLAS
                           ↓
                      SUPABASE
                           ↓
                    POSTGRESQL
 
⸻
 
2. FUENTE CENTRAL DE VERDAD
La aplicación tendrá una fuente principal de datos.
La regla será:
No puede haber versiones diferentes del horario dependiendo de dónde abras la aplicación.
Todos los dispositivos deberán sincronizarse.
 
⸻
 
3. AUTENTICACIÓN
HORARIO TOP utilizará el sistema de autenticación general del Sistema Personal.
No se creará un login independiente.
 
⸻
 
4. USUARIO
Cada registro estará asociado al usuario autenticado.
Conceptualmente:
user_id
   ↓
sus horarios
sus tareas
sus eventos
sus materias
sus configuraciones
 
⸻
 
5. AISLAMIENTO DE DATOS
Un usuario jamás podrá consultar los datos de otro usuario.
Esto se protegerá principalmente mediante:
Row Level Security (RLS).
 
⸻
 
6. TABLA DE HORARIOS
Existirá una estructura para almacenar los horarios personalizados.
Ejemplo conceptual:
schedules
- id
- user_id
- name
- type
- active
- created_at
- updated_at
Tipos:
school
personal
work
custom
 
⸻
 
7. MÚLTIPLES HORARIOS
No estaremos limitados a un único horario.
Podrás tener:
* Colegio
* Entrenamiento
* Personal
* Verano
* Otro
 
⸻
 
8. HORARIO ACTIVO
El sistema sabrá cuál está activo en cada momento.
 
⸻
 
9. PERIODOS DE VALIDEZ
Un horario podrá tener:
Fecha de inicio
Fecha de finalización
Esto permitirá guardar horarios por cursos.
 
⸻
 
10. CURSO ESCOLAR
Ejemplo:
2026–2027
Y posteriormente:
2027–2028
El horario antiguo no tiene que eliminarse.
 
⸻
 
11. COLUMNAS
El sistema debe soportar el diseño flexible que definimos.
No estará limitado a 7 columnas.
Podrá existir:
Lunes
Martes
Miércoles
...
y añadir o eliminar columnas.
 
⸻
 
12. FILAS
Igualmente, las filas serán configurables.
Podrán representar:
* horas;
* periodos;
* bloques;
* franjas personalizadas.
 
⸻
 
13. BLOQUES DE HORARIO
Cada celda o bloque tendrá información estructurada:
schedule_block
- id
- schedule_id
- day
- start_time
- end_time
- title
- subject_id
- color
- notes
 
⸻
 
14. HORAS
La hora se almacenará estructuradamente.
No como texto:
“8 de la mañana”
sino:
08:00
Esto permite al motor temporal trabajar correctamente.
 
⸻
 
15. HORARIO RECURRENTE
Podremos definir:
Matemáticas todos los lunes a las 08:00.
Sin tener que crear manualmente cientos de eventos.
 
⸻
 
16. EXCEPCIONES
Si un lunes concreto no hay clase:
El sistema permitirá crear una excepción.
Ejemplo:
Regla:
Matemáticas → lunes 08:00

Excepción:
14/09 → cancelada
 
⸻
 
17. CAMBIO TEMPORAL
También:
Matemáticas el lunes pasa excepcionalmente a las 10:00.
La regla general permanece intacta.
 
⸻
 
18. MATERIAS
Las materias tendrán su propia entidad.
Ejemplo:
subjects
- id
- user_id
- name
- color
- icon
- active
 
⸻
 
19. COLORES
Cada materia podrá tener color propio.
Esto alimentará:
* horario;
* calendario;
* HOY;
* estadísticas;
* mochila.
 
⸻
 
20. IDENTIDAD VISUAL
Podrás personalizar:
* color;
* icono;
* nombre;
* abreviatura.
 
⸻
 
21. TAREAS
Las tareas estarán conectadas con materias.
Ejemplo:
Tarea:
Ejercicios página 45

Materia:
Física
 
⸻
 
22. EXÁMENES
Los exámenes también podrán relacionarse con materias.
Esto permite que:
Biología → examen → estudio → horario → mochila
estén conectados.
 
⸻
 
23. EVENTOS
Los eventos generales utilizarán una estructura independiente.
Ejemplo:
event
- title
- start
- end
- location
- notes
- category
 
⸻
 
24. RECURRENCIA
Los eventos podrán repetirse:
* diariamente;
* semanalmente;
* mensualmente;
* determinados días;
* mediante reglas personalizadas.
 
⸻
 
25. MOCHILA
La mochila tendrá:
bag_items
- id
- user_id
- name
- subject_id
- priority
- active
 
⸻
 
26. REGLAS DE MOCHILA
Ejemplo:
Si mañana hay Física
→ añadir calculadora
 
⸻
 
27. MOTOR DE REGLAS
Estas reglas no dependerán exclusivamente de la IA.
Habrá un motor determinista.
SI condición
ENTONCES acción
 
⸻
 
28. EJEMPLO
SI
mañana hay laboratorio

ENTONCES
mostrar bata en mochila
 
⸻
 
29. VENTAJA
Esto hace que el sistema sea:
* rápido;
* barato;
* fiable;
* predecible.
La IA se utilizará cuando realmente aporte valor.
 
⸻
 
30. MOTOR TEMPORAL
Será el corazón del sistema.
Deberá conocer:
* fecha;
* hora;
* día de semana;
* zona horaria;
* eventos;
* recurrencias;
* excepciones.
 
⸻
 
31. ZONA HORARIA
Se almacenará correctamente la zona horaria del usuario.
No debemos asumir que todos están en la misma.
 
⸻
 
32. CAMBIO DE HORA
El sistema deberá soportar correctamente cambios de horario de verano/invierno.
 
⸻
 
33. ESTADO DE ACTIVIDAD
Cada actividad podrá estar:
scheduled
active
completed
skipped
cancelled
rescheduled
 
⸻
 
34. REGLA DE PASADO
Cuando:
hora actual > hora final
la actividad pasa a:
Pasada.
 
⸻
 
35. HOY
HOY consultará el motor temporal.
No tendrá una lista independiente que pueda quedarse desactualizada.
 
⸻
 
36. TABLÓN DE HOY
Mostrará:
AHORA
lo que está ocurriendo.
PRÓXIMO
lo siguiente.
PENDIENTE
lo que queda por hacer.
PASADO
si el usuario quiere consultarlo.
 
⸻
 
37. CAMBIO AUTOMÁTICO
Cuando el reloj avance:
08:00 Matemáticas
        ↓
09:00 termina
        ↓
Matemáticas → pasada
        ↓
09:00 Inglés → actual
 
⸻
 
38. SIN REFRESCAR MANUALMENTE
El sistema deberá actualizar el estado temporal aunque el usuario permanezca dentro de la aplicación.
 
⸻
 
39. CALENDARIO
El calendario consultará las mismas fuentes.
No tendrá datos duplicados.
 
⸻
 
40. TAREAS
Las tareas también podrán aparecer en HOY.
 
⸻
 
41. EVENTOS
Los eventos aparecerán según su fecha y hora.
 
⸻
 
42. EXÁMENES
Los próximos exámenes podrán destacarse.
 
⸻
 
43. MOCHILA
HOY podrá mostrar:
🎒 Mochila de mañana.
 
⸻
 
44. IA
Claude no tendrá acceso directo e ilimitado a la base de datos.
Existirá una capa intermedia.
 
⸻
 
45. CAPA IA
Conceptualmente:
Usuario
 ↓
IA
 ↓
Herramientas autorizadas
 ↓
Sistema Personal
 ↓
Datos
 
⸻
 
46. TOOLS DE IA
La IA podrá tener herramientas como:
get_today()
get_schedule()
get_tasks()
get_events()
get_exams()
get_free_slots()
get_bag()
create_task()
create_event()
move_event()
create_study_block()
 
⸻
 
47. PERMISOS
Cada herramienta tendrá permisos.
Ejemplo:
La IA puede:
consultar horario
pero no necesariamente:
eliminar horario.
 
⸻
 
48. ACCIONES PELIGROSAS
Acciones como:
* borrar;
* modificar grandes cantidades;
* cambiar reglas;
requerirán confirmación.
 
⸻
 
49. TRANSACCIONES
Si una acción requiere varios cambios:
crear sesión
+
actualizar objetivo
+
crear recordatorio
deberá ejecutarse como una operación consistente.
 
⸻
 
50. EVITAR DATOS A MEDIAS
Si falla una parte:
No queremos:
Sesión creada pero recordatorio inexistente.
Se deberá controlar mediante transacciones cuando corresponda.
 
⸻
 
51. NOTIFICACIONES
Las notificaciones estarán conectadas con los datos.
Ejemplo:
evento actualizado
↓
recalcular recordatorio
↓
cancelar antiguo
↓
crear nuevo
 
⸻
 
52. NOTIFICACIONES PROGRAMADAS
Se podrá almacenar:
notification
- id
- user_id
- type
- target_id
- scheduled_at
- status
 
⸻
 
53. IDEMPOTENCIA
Si una operación se ejecuta dos veces:
No deberá crear duplicados.
 
⸻
 
54. SINCRONIZACIÓN
Cada cambio tendrá:
* ID;
* versión;
* timestamp;
* usuario.
 
⸻
 
55. CAMBIOS LOCALES
Si estás sin conexión:
Podrás modificar datos compatibles localmente.
 
⸻
 
56. COLA OFFLINE
Los cambios podrán entrar en:
pending_sync
 
⸻
 
57. AL VOLVER INTERNET
La aplicación sincronizará:
LOCAL
↓
cola de cambios
↓
CLOUD
↓
confirmación
↓
estado sincronizado
 
⸻
 
58. CONFLICTOS
Si dos dispositivos modifican el mismo elemento:
El sistema deberá detectarlo.
 
⸻
 
59. RESOLUCIÓN
Dependiendo del dato:
* último cambio;
* versión;
* combinación;
* intervención del usuario.
No se utilizará una regla única para todo.
 
⸻
 
60. INDICADOR DE SINCRONIZACIÓN
La interfaz podrá mostrar discretamente:
🟢 Sincronizado
🟡 Sincronizando
🔴 Sin conexión
 
⸻
 
61. OFFLINE
Aunque no haya Internet, deberá seguir funcionando:
* visualización del horario;
* HOY;
* tareas locales;
* calendario;
* acciones básicas.
 
⸻
 
62. CLOUD COMO RESPALDO
Cloud almacenará los datos para:
* recuperación;
* sincronización;
* múltiples dispositivos.
 
⸻
 
63. BACKUPS
La arquitectura deberá permitir copias de seguridad.
 
⸻
 
64. MIGRACIONES
La base de datos tendrá migraciones versionadas.
Nunca se deberá modificar producción de forma improvisada.
 
⸻
 
65. ÍNDICES
Se crearán índices para consultas frecuentes:
* user_id;
* fecha;
* horario;
* tareas;
* eventos;
* notificaciones.
 
⸻
 
66. RENDIMIENTO
HOY debe cargar rápidamente.
No deberá descargar toda la base de datos cada vez.
 
⸻
 
67. CONSULTAS POR RANGO
Ejemplo:
Datos de hoy.
No:
Todos los datos del usuario desde 2026.
 
⸻
 
68. PAGINACIÓN
Historiales grandes:
* notificaciones;
* actividades;
* analítica;
utilizarán paginación.
 
⸻
 
69. CACHÉ
Los datos que no cambien frecuentemente podrán mantenerse temporalmente en caché.
 
⸻
 
70. SEGURIDAD DE CLAVES
Las claves privadas de servicios externos no estarán dentro del frontend.
 
⸻
 
71. CLAUDE API
La clave de Anthropic deberá estar detrás de un backend seguro.
Nunca:
frontend → API key
Sino:
frontend
 ↓
backend / Edge Function
 ↓
Anthropic
 
⸻
 
72. CONTROL DE USO DE IA
Se podrán establecer:
* límites;
* rate limits;
* cuotas;
* protección contra abuso.
 
⸻
 
73. COSTES
El sistema evitará llamadas innecesarias a IA.
 
⸻
 
74. CONTEXTO MÍNIMO
Solo se enviarán los datos necesarios.
 
⸻
 
75. LOGS
Se registrarán errores técnicos importantes.
Pero no se deberá guardar indiscriminadamente contenido privado.
 
⸻
 
76. MONITORIZACIÓN
La arquitectura deberá permitir detectar:
* errores;
* fallos de sincronización;
* errores de notificación;
* problemas de IA.
 
⸻
 
77. RECUPERACIÓN
Si falla una sincronización:
Reintentar.
Con límites y backoff.
 
⸻
 
78. OPERACIONES SEGURAS
Las operaciones importantes deberán poder reintentarse sin duplicar datos.
 
⸻
 
79. BORRADO
Cuando el usuario elimine un horario:
Deberá definirse qué ocurre con:
* tareas;
* eventos;
* materias;
* mochila;
* estadísticas.
 
⸻
 
80. ARCHIVADO
Preferiremos archivar cuando sea útil.
Ejemplo:
Horario 2025–2026 → archivado.
 
⸻
 
81. RESTAURACIÓN
Los elementos archivados podrán restaurarse.
 
⸻
 
82. IMPORTACIÓN
HORARIO TOP deberá poder prepararse para importar horarios desde:
* datos manuales;
* CSV;
* otros formatos compatibles.
 
⸻
 
83. EXPORTACIÓN
Podrá exportarse el horario.
 
⸻
 
84. DUPLICAR HORARIO
Una función especialmente útil:
Duplicar horario
Ejemplo:
2026–2027
↓
Duplicar
↓
2027–2028
Después solo se modifican las diferencias.
 
⸻
 
85. PLANTILLAS
Podrán existir plantillas:
* colegio;
* universidad;
* trabajo;
* entrenamiento;
* personalizado.
 
⸻
 
86. MOTOR DE RECURRENCIA
Deberá soportar correctamente:
* días;
* semanas;
* excepciones;
* periodos;
* fechas de inicio/finalización.
 
⸻
 
87. CALENDARIO ESCOLAR
En una evolución futura podrá incorporarse un calendario escolar con:
* festivos;
* vacaciones;
* días no lectivos.
 
⸻
 
88. IMPORTACIÓN DE CALENDARIO
También deberá quedar preparada la arquitectura para integrar calendarios externos.
 
⸻
 
89. FUTURAS INTEGRACIONES
La arquitectura deberá permitir posteriormente integrar:
* Google Calendar;
* Apple Calendar;
* Outlook;
* otros servicios.
No es obligatorio implementarlo ahora.
 
⸻
 
90. API INTERNA
El módulo tendrá una API interna clara.
Ejemplo:
scheduleService
calendarService
taskService
examService
bagService
notificationService
planningService
analyticsService
aiService
syncService
 
⸻
 
91. SEPARACIÓN DE RESPONSABILIDADES
No queremos 1.000 líneas de código donde todo haga de todo.
Cada servicio tendrá una responsabilidad.
 
⸻
 
92. COMPONENTES DE UI
También se separarán:
ScheduleGrid
ScheduleCell
TodayBoard
TaskCard
ExamCard
BagCard
NotificationCenter
AnalyticsDashboard
 
⸻
 
93. DISEÑO RESPONSIVE
HORARIO TOP debe funcionar:
* móvil;
* tablet;
* escritorio.
 
⸻
 
94. MÓVIL COMO PRIORIDAD
La interfaz estará pensada primero para móvil.
 
⸻
 
95. GRID
El horario podrá adaptarse al tamaño de pantalla.
En móvil:
* desplazamiento horizontal;
* columnas compactas;
* vista del día.
En escritorio:
* vista completa.
 
⸻
 
96. ACCESIBILIDAD
Debe existir:
* navegación táctil;
* teclado;
* lectores de pantalla;
* tamaños de texto;
* contraste.
 
⸻
 
97. ANIMACIONES
Animaciones ligeras:
* cambio de día;
* actividad actual;
* completado;
* aparición de avisos.
Nunca deben perjudicar el rendimiento.
 
⸻
 
98. MODO OSCURO
Integrado con el sistema visual global del Sistema Personal.
 
⸻
 
99. DISEÑO PREMIUM
El módulo deberá mantener:
* jerarquía visual;
* iconografía;
* espacios;
* tarjetas;
* microanimaciones;
* feedback visual.
Sin sacrificar velocidad.
 
⸻
 
100. ARQUITECTURA FINAL
El resultado completo será:
                     HORARIO TOP
                          │
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
     HORARIO           CALENDARIO          HOY
        ↓                 ↓                 ↓
     MATERIAS          EVENTOS            TAREAS
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ↓
                    MOTOR TEMPORAL
                          ↓
             ┌────────────┼────────────┐
             ↓            ↓            ↓
          MOCHILA      EXÁMENES    OBJETIVOS
             └────────────┼────────────┘
                          ↓
                 MOTOR PLANIFICADOR
                          ↓
                  MOTOR NOTIFICACIONES
                          ↓
                         IA
                          ↓
                    SUPABASE
                          ↓
                     POSTGRESQL
 
⸻
 
101. RESULTADO FINAL
Cuando terminemos esta arquitectura, HORARIO TOP deberá poder hacer algo como esto:
Son las 17:42.
El sistema sabe:
* qué has terminado;
* qué te queda;
* qué tienes mañana;
* qué tareas están pendientes;
* qué examen se aproxima;
* qué necesitas para la mochila;
* cuánto tiempo tienes libre;
* qué entrenamiento tienes;
* qué objetivos tienes;
* qué notificaciones siguen siendo válidas.
Y en HOY te muestra únicamente lo relevante.
 
⸻
 
102. EL SISTEMA COMPLETO
La experiencia final será:
                  HOY
                   ↓
             ¿QUÉ TENGO?
                   ↓
              HORARIO
                   ↓
             ¿QUÉ SIGUE?
                   ↓
               TAREAS
                   ↓
             ¿QUÉ NECESITO?
                   ↓
              MOCHILA
                   ↓
             ¿QUÉ DEBO HACER?
                   ↓
            PLANIFICADOR
                   ↓
            ¿ME ACORDARÉ?
                   ↓
           NOTIFICACIONES
                   ↓
            ¿CÓMO VOY?
                   ↓
              ANALÍTICA
                   ↓
          ¿CÓMO MEJORO?
                   ↓
                  IA
 
⸻
 
103. CRITERIOS DE FINALIZACIÓN DE HORARIO TOP
El módulo se considerará técnicamente definido cuando Claude pueda implementar:
* horarios ilimitados;
* horarios personalizados;
* columnas configurables;
* filas configurables;
* materias;
* colores;
* iconos;
* bloques;
* horas;
* recurrencias;
* excepciones;
* periodos escolares;
* calendario;
* tareas;
* exámenes;
* eventos;
* mochila;
* reglas automáticas;
* HOY;
* estado temporal;
* pasado;
* completado;
* reprogramación;
* planificador;
* IA;
* notificaciones;
* recordatorios;
* analítica;
* objetivos;
* carga;
* aprendizaje;
* preferencias;
* memoria;
* offline;
* sincronización;
* multidispositivo;
* Cloud;
* Supabase;
* PostgreSQL;
* RLS;
* autenticación;
* backups;
* migraciones;
* API interna;
* Edge Functions;
* seguridad;
* control de costes;
* monitorización;
* accesibilidad;
* responsive;
* modo oscuro;
* diseño premium.
 
⸻
 
104. Y LO MÁS IMPORTANTE
HORARIO TOP queda preparado para crecer.
No lo vamos a diseñar como:
“Una tabla para ver las clases.”
Lo estamos diseñando como un motor temporal del Sistema Operativo Personal.
Por eso posteriormente podremos conectar:
Horario → Estudios → Mochila → Tareas → Objetivos → Entrenamiento → Productividad → IA → Notificaciones → Analítica.
Eso permitirá que, cuando añadamos nuevas partes del Sistema Personal, no tengamos que rehacer HORARIO TOP desde cero.
 
⸻
 
🟢 HORARIO TOP — 100 % / 100 %
Módulo completamente definido a nivel funcional y arquitectónico.
El siguiente paso ya no sería otra fase de HORARIO TOP, sino integrarlo con el Documento Maestro del Sistema Operativo Personal y convertir todas estas especificaciones en instrucciones de implementación para Claude.

HORARIO TOP
FASE 10 — NOTIFICACIONES + RECORDATORIOS + CONTEXTO PROACTIVO
Esta fase convierte todo lo anterior en un sistema que te avisa cuando realmente importa, utilizando el horario, la hora actual, las tareas, la mochila, los exámenes y los eventos.
La idea no es llenar el móvil de avisos.
La idea es:
Que el sistema se adelante a lo que necesitas, pero sin molestarte.
 
⸻
 
1. OBJETIVO PRINCIPAL
Crear un motor central de notificaciones capaz de decidir:
* qué avisar;
* cuándo avisar;
* con qué prioridad;
* por qué canal;
* si merece la pena avisar;
* si ya se avisó;
* si la situación cambió;
* si debe cancelar un aviso previamente programado.
 
⸻
 
2. TIPOS DE NOTIFICACIÓN
Habrá diferentes categorías:
⏰ Recordatorio
📚 Estudio
🎒 Mochila
📅 Calendario
📝 Tarea
⚠️ Alerta
💪 Entrenamiento
🎯 Objetivo
🤖 IA
 
⸻
 
3. PRIORIDADES
Cada notificación tendrá:
🔴 Crítica
Algo importante que requiere atención.
🟠 Alta
Importante pero no urgente.
🟡 Normal
Información útil.
⚪ Baja
Información secundaria.
 
⸻
 
4. NO TODO DEBE NOTIFICAR
Esto será una regla fundamental.
Que exista un evento no significa automáticamente que haya que enviar una notificación.
 
⸻
 
5. MOTOR DE DECISIÓN
Antes de mandar cualquier aviso:
¿Es importante?
↓
¿Está configurado?
↓
¿Es el momento adecuado?
↓
¿Ya se avisó?
↓
¿La situación sigue siendo válida?
↓
ENVIAR
 
⸻
 
6. NOTIFICACIÓN CONTEXTUAL
Ejemplo:
Tienes:
Calistenia 18:00
A las 17:00:
💪 Calistenia en 1 hora.
Pero si cancelas el entrenamiento:
se cancela automáticamente la notificación.
 
⸻
 
7. CAMBIOS EN TIEMPO REAL
Si mueves el entrenamiento:
18:00 → 19:00
el recordatorio pasa automáticamente:
17:00 → 18:00
No se crean dos notificaciones.
 
⸻
 
8. EVITAR DUPLICADOS
Si tienes:
* evento;
* recordatorio;
* automatización;
todos apuntando a la misma cosa, el sistema deberá agruparlos.
No:
3 notificaciones iguales.
Sino:
Una notificación inteligente.
 
⸻
 
9. RECORDATORIOS PERSONALIZADOS
Cada actividad podrá configurar:
Avisarme X minutos antes.
Opciones:
* 5 min;
* 10 min;
* 15 min;
* 30 min;
* 1 hora;
* personalizado.
 
⸻
 
10. VARIOS RECORDATORIOS
Una actividad importante podrá tener:
1 día antes
1 hora antes
15 minutos antes
Pero el sistema deberá evitar saturación.
 
⸻
 
11. NOTIFICACIÓN DE INICIO
También:
🟢 Empieza ahora: Biología.
 
⸻
 
12. NOTIFICACIÓN DE FINALIZACIÓN
Normalmente no será necesaria.
Pero podrá configurarse:
Avisarme cuando termine.
 
⸻
 
13. ACTIVIDADES PASADAS
Una vez que una actividad pasa a:
Pasada
no deberá seguir generando recordatorios.
 
⸻
 
14. TAREAS
Las tareas tendrán un sistema diferente.
Ejemplo:
Entregar trabajo de Física mañana.
Podrá avisar:
1 día antes
y:
2 horas antes
si el usuario lo configura.
 
⸻
 
15. TAREAS VENCIDAS
Si llega la fecha límite:
🔴 Tarea vencida.
Pero no desaparecerá.
 
⸻
 
16. RECORDATORIO DE TAREA PENDIENTE
Si una tarea importante sigue sin completar:
⚠️ Te queda pendiente el trabajo de Física.
La frecuencia será limitada.
 
⸻
 
17. EXÁMENES
Los exámenes podrán generar avisos progresivos:
7 días antes
📚 Examen en una semana

3 días antes
⚠️ Examen en 3 días

1 día antes
🔴 Examen mañana

1 hora antes
📝 Examen en 1 hora
Todo será configurable.
 
⸻
 
18. INTELIGENCIA DE EXÁMENES
Si no has estudiado nada:
“Tienes un examen en 3 días y no hay ninguna sesión programada.”
No simplemente:
“Examen en 3 días.”
 
⸻
 
19. PROPUESTA
Podrá ofrecer:
Organizar estudio
y abrir la IA.
 
⸻
 
20. MOCHILA
La mochila tendrá sus propios avisos.
Ejemplo:
21:00
🎒 ¿Has preparado la mochila para mañana?
 
⸻
 
21. MOCHILA INCOMPLETA
Si quedan elementos:
⚠️ Tu mochila no está completa.
 
⸻
 
22. MATERIAL CRÍTICO
Si falta un objeto importante:
🔴 Te falta la calculadora para mañana.
Esto tendrá mayor prioridad.
 
⸻
 
23. CAMBIO DE NECESIDADES
Si se cancela Biología:
La notificación:
“Lleva la bata mañana”
se cancela automáticamente.
 
⸻
 
24. NUEVA NECESIDAD
Si se añade:
Laboratorio de Biología
el sistema puede generar:
🥼 Necesitas la bata mañana.
 
⸻
 
25. NOTIFICACIONES DE CAMBIOS
Si el horario cambia:
📅 Tu horario de mañana ha cambiado.
Mostrará qué cambió.
 
⸻
 
26. CAMBIO IMPORTANTE
Ejemplo:
❗ Biología pasa de 10:00 a 12:00.
 
⸻
 
27. CANCELACIÓN
❌ Se ha cancelado Matemáticas a las 08:00.
 
⸻
 
28. CONFLICTOS
Si aparecen dos actividades:
⚠️ Tienes dos actividades programadas a las 18:00.
 
⸻
 
29. RESOLUCIÓN
La IA podrá ofrecer:
“¿Quieres que te ayude a resolver el conflicto?”
 
⸻
 
30. RECORDATORIOS DE EVENTOS
Ejemplo:
Cumpleaños sábado.
El sistema podrá avisar:
🎂 Cumpleaños de Jorge mañana.
 
⸻
 
31. RECORDATORIOS DE PREPARACIÓN
Eventos importantes podrán tener:
Preparación previa.
Ejemplo:
Viaje sábado
Viernes:
🧳 Preparar viaje.
 
⸻
 
32. LISTA DE PREPARACIÓN
La notificación podrá abrir directamente:
Preparación del evento
en lugar de llevar simplemente al calendario.
 
⸻
 
33. NOTIFICACIONES DE HÁBITOS
Podrán existir:
📚 Estudiar
💧 Beber agua
😴 Prepararse para dormir
Pero serán completamente configurables.
 
⸻
 
34. NO CREAR CIENTOS DE RECORDATORIOS
Los hábitos tendrán límites de frecuencia.
El sistema podrá agrupar avisos.
 
⸻
 
35. RESUMEN INTELIGENTE
En lugar de varias notificaciones:
📋 Tu tarde
2 tareas pendientes Entrenamiento a las 18:00 Examen en 3 días
Una sola notificación.
 
⸻
 
36. RESUMEN DE MAÑANA
Podrá enviarse:
☀️ Mañana
5 clases 1 examen próximo Mochila pendiente
 
⸻
 
37. RESUMEN NOCTURNO
Opcionalmente:
🌙 Cierre del día
* actividades completadas;
* tareas pendientes;
* mochila;
* mañana.
 
⸻
 
38. RESUMEN MATUTINO
Por la mañana:
☀️ Buenos días.
Y:
Primera clase 08:00 — Matemáticas.
 
⸻
 
39. NO MOLESTAR
El sistema tendrá:
Horario silencioso
Ejemplo:
22:30–07:00
 
⸻
 
40. EXCEPCIONES
Una notificación crítica podrá, si el usuario lo permite, saltarse el silencio.
Pero esto deberá estar bajo control explícito.
 
⸻
 
41. FINES DE SEMANA
Podrá existir una configuración diferente:
Lunes–viernes
Sábado–domingo
 
⸻
 
42. VACACIONES
Durante vacaciones:
Desactivar avisos escolares.
Pero mantener:
* eventos;
* recordatorios personales;
* entrenamientos.
 
⸻
 
43. DÍAS ESPECIALES
Se podrán definir:
* vacaciones;
* festivos;
* días sin clase;
* excursiones;
* eventos especiales.
 
⸻
 
44. CONTEXTO DE UBICACIÓN
En una futura versión podrá utilizarse la ubicación, con permiso.
Ejemplo:
Llegaste al gimnasio.
Podría mostrar:
💪 ¿Quieres comenzar el entrenamiento?
Pero será completamente opcional.
 
⸻
 
45. CONTEXTO DE DISPOSITIVO
La aplicación podrá tener en cuenta:
* app abierta;
* app cerrada;
* modo offline;
* conexión;
* permisos de notificaciones.
 
⸻
 
46. NOTIFICACIONES OFFLINE
Las notificaciones locales básicas deberán poder funcionar sin Internet siempre que el sistema operativo lo permita.
 
⸻
 
47. PUSH CLOUD
Para eventos que dependan de Cloud:
Cloud
↓
Motor de notificaciones
↓
Push
↓
Móvil
 
⸻
 
48. SINCRONIZACIÓN
Si marcas una tarea como completada desde otro dispositivo:
La notificación pendiente deberá cancelarse.
 
⸻
 
49. MULTIDISPOSITIVO
Ejemplo:
iPhone + ordenador.
No debería recibir avisos duplicados innecesariamente.
 
⸻
 
50. ESTADO DE NOTIFICACIÓN
Cada aviso tendrá:
* programado;
* enviado;
* abierto;
* descartado;
* cancelado;
* fallido.
 
⸻
 
51. HISTORIAL
Podrás consultar:
Notificaciones recientes.
No será necesario mostrarlo siempre.
 
⸻
 
52. CANCELACIÓN AUTOMÁTICA
Una notificación se cancelará si su motivo desaparece.
Ejemplo:
“Tarea pendiente”
La completas.
→ Notificación cancelada.
 
⸻
 
53. REPETICIÓN INTELIGENTE
Si ignoras un aviso, no significa necesariamente que haya que repetirlo.
Se configurará por tipo.
 
⸻
 
54. SNOOZE
Podrás:
Recordarme en 10 min.
Opciones configurables.
 
⸻
 
55. POSPONER
También:
Recordarme esta tarde.
 
⸻
 
56. MARCAR COMO HECHO
Desde la propia notificación, cuando el sistema operativo lo permita:
✅ Completar tarea.
 
⸻
 
57. ACCIONES RÁPIDAS
Ejemplo:
🎒 Mochila

[Ver]
[Preparar]
[Recordar luego]
 
⸻
 
58. DEEP LINKS
Cada notificación abrirá directamente el lugar correspondiente.
No:
Abre la aplicación y busca.
Sino:
Notificación → pantalla exacta.
 
⸻
 
59. NOTIFICACIONES DE IA
La IA podrá generar avisos contextuales.
Ejemplo:
“Tienes 90 minutos libres antes de entrenar. ¿Quieres aprovecharlos para Física?”
Pero tendrán límites estrictos.
 
⸻
 
60. LA IA NO PODRÁ SPAMEAR
La IA tendrá:
* límite diario;
* prioridades;
* horario;
* preferencias;
* cooldown.
 
⸻
 
61. COOLDOWN
Si acaba de aparecer una sugerencia:
No volverá a aparecer inmediatamente.
 
⸻
 
62. AGRUPACIÓN
Varias cosas relacionadas podrán agruparse.
Ejemplo:
📚 Estudios
Física pendiente Biología mañana Examen viernes
 
⸻
 
63. SISTEMA DE IMPORTANCIA
Cada aviso tendrá una puntuación interna:
Urgencia
Importancia
Proximidad
Consecuencia
Preferencias
 
⸻
 
64. DECISIÓN FINAL
El motor decidirá:
Enviar
o:
No enviar
 
⸻
 
65. PREVENCIÓN DE NOTIFICACIONES OBSOLETAS
Antes de enviar:
¿Sigue siendo cierto?
Si el evento cambió:
cancelar.
Esto será especialmente importante con horarios dinámicos.
 
⸻
 
66. EJEMPLO COMPLETO
Tienes:
Biología 10:00
A las 09:30:
📚 Biología en 30 minutos.
A las 09:45 se cancela.
El sistema recibe el cambio:
❌ Notificación cancelada.
No recibirás:
“Biología en 15 minutos.”
 
⸻
 
67. OTRO EJEMPLO
Tienes:
Examen viernes
Miércoles:
⚠️ Examen de Biología en 2 días.
La IA detecta que no hay sesiones de estudio.
Puede añadir:
¿Quieres organizar dos sesiones?
 
⸻
 
68. MOCHILA + NOTIFICACIONES + HORARIO
Todo queda conectado:
HORARIO
   ↓
ACTIVIDADES
   ↓
MATERIALES
   ↓
MOCHILA
   ↓
ESTADO
   ↓
NOTIFICACIÓN
 
⸻
 
69. TAREAS + HORARIO
TAREA
↓
FECHA LÍMITE
↓
TIEMPO DISPONIBLE
↓
PLANIFICACIÓN
↓
RECORDATORIO
 
⸻
 
70. EXAMEN + ESTUDIO
EXAMEN
↓
DÍAS RESTANTES
↓
PLAN DE ESTUDIO
↓
SEGUIMIENTO
↓
RECORDATORIOS
 
⸻
 
71. CONEXIÓN CON HOY
HOY será el centro de todo.
Podrá mostrar:
🟢 Ahora ⏰ Próximo 📝 Pendientes 🎒 Mochila ⚠️ Importante
 
⸻
 
72. CENTRO DE NOTIFICACIONES INTERNO
Además de las notificaciones del móvil habrá:
🔔 CENTRO DE AVISOS
Donde estarán:
* avisos;
* cambios;
* alertas;
* sugerencias;
* recordatorios.
 
⸻
 
73. LEÍDO / NO LEÍDO
Cada aviso:
🔵 No leído
⚪ Leído
 
⸻
 
74. ARCHIVAR
Podrás limpiar avisos antiguos.
 
⸻
 
75. FILTROS
Por:
* tareas;
* horario;
* estudios;
* entrenamiento;
* mochila;
* IA.
 
⸻
 
76. CONFIGURACIÓN GLOBAL
El usuario podrá decidir:
Notificaciones activadas
Notificaciones desactivadas
 
⸻
 
77. CONFIGURACIÓN POR MÓDULO
Ejemplo:
Horario        ✅
Tareas         ✅
Mochila        ✅
Entrenamiento  ❌
IA             ⚠️
 
⸻
 
78. CONFIGURACIÓN POR IMPORTANCIA
Podrá decir:
Solo quiero notificaciones importantes.
 
⸻
 
79. CONFIGURACIÓN POR HORARIO
Podrá establecer:
No notificar durante clases.
 
⸻
 
80. EXCEPCIONES
Podrá establecer:
Permitir exámenes aunque esté en silencio.
 
⸻
 
81. PERSONALIZACIÓN VISUAL
Las notificaciones internas podrán utilizar:
* iconos;
* colores de prioridad;
* etiquetas;
* animaciones discretas.
 
⸻
 
82. SONIDO
El sistema podrá conectarse posteriormente con el módulo de sonidos.
Por ejemplo:
sonido específico para una alerta importante.
Pero el usuario tendrá control total del volumen.
 
⸻
 
83. VIBRACIÓN
Si el dispositivo lo permite, podrá utilizarse según prioridad.
 
⸻
 
84. MODO SILENCIOSO
Si el usuario desactiva sonidos:
Las notificaciones visuales seguirán funcionando.
 
⸻
 
85. ACCESIBILIDAD
Deberá funcionar correctamente:
* con tamaños de letra grandes;
* lectores de pantalla;
* contraste;
* animaciones reducidas.
 
⸻
 
86. CLOUD
En Cloud se podrán almacenar:
* preferencias;
* reglas;
* recordatorios;
* notificaciones programadas;
* historial;
* permisos;
* configuración.
 
⸻
 
87. LOCAL + CLOUD
No dependeremos exclusivamente de Cloud.
La arquitectura será:
DATOS LOCALES
      ↕
SINCRONIZACIÓN
      ↕
CLOUD
 
⸻
 
88. CONFLICTOS DE SINCRONIZACIÓN
Si cambias un recordatorio en dos dispositivos:
El sistema deberá resolver el conflicto mediante:
* timestamps;
* versión;
* prioridad;
* estado.
 
⸻
 
89. SEGURIDAD
Las notificaciones deberán respetar:
* usuario autenticado;
* permisos;
* datos privados;
* reglas de acceso.
 
⸻
 
90. AUDITORÍA
Para acciones importantes:
Qué generó la notificación.
Ejemplo:
Generada por: Examen Biología / regla “3 días antes”.
 
⸻
 
91. CRITERIOS DE ACEPTACIÓN
La Fase 10 estará completa cuando exista:
* motor de notificaciones;
* prioridades;
* recordatorios;
* recordatorios personalizados;
* múltiples recordatorios;
* cancelación automática;
* reprogramación;
* detección de cambios;
* notificaciones de tareas;
* notificaciones de exámenes;
* notificaciones de mochila;
* notificaciones de eventos;
* avisos de conflictos;
* avisos de cambios de horario;
* resumen diario;
* resumen semanal;
* horario de silencio;
* vacaciones;
* excepciones;
* snooze;
* acciones rápidas;
* deep links;
* centro interno de avisos;
* leído/no leído;
* filtros;
* configuración por módulo;
* configuración por prioridad;
* push;
* notificaciones locales cuando sea posible;
* sincronización multidispositivo;
* integración con Cloud;
* integración con IA;
* integración con sonidos;
* accesibilidad;
* seguridad;
* prevención de duplicados;
* prevención de avisos obsoletos.
 
⸻
 
SIGUIENTE FASE
FASE 11 — ANALÍTICA PERSONAL + CARGA + PROGRESO + APRENDIZAJE DEL SISTEMA
Aquí iremos un paso más allá.
El sistema dejará de limitarse a decirte qué tienes que hacer y empezará a analizar cómo está funcionando tu vida organizada.
Podremos construir:
* estadísticas de cumplimiento;
* tiempo planificado vs. realizado;
* carga diaria/semanal;
* horas libres;
* tareas completadas;
* tareas aplazadas;
* exámenes;
* estudio;
* entrenamiento;
* hábitos;
* cumplimiento de objetivos;
* patrones de organización;
* análisis de semanas;
* detección de sobrecarga;
* evolución;
* informes;
* recomendaciones de IA;
* tendencias;
* comparativas;
* y un sistema de aprendizaje que mejore las sugerencias sin convertirlo en una caja negra.
PROGRESO DEL MÓDULO: 
83,3 % / 100 %

Perfecto. A partir de ahora lo incorporamos como requisito oficial del sistema: las actividades no se borran; pasan automáticamente a “Pasado / Completado” y desaparecen del tablón principal de HOY cuando termina su hora.
HORARIO TOP
FASE 8 — MOTOR TEMPORAL + AUTOMATIZACIONES INTELIGENTES
Esta fase será la encargada de hacer que el horario reaccione al paso del tiempo y empiece a funcionar de forma realmente automática.
 
⸻
 
1. OBJETIVO
Crear un motor central que entienda:
* qué hora es;
* qué día es;
* qué está ocurriendo ahora;
* qué ya ha terminado;
* qué viene después;
* qué queda pendiente;
* qué debe aparecer en HOY;
* qué debe desaparecer del tablón;
* qué información debe preparar para las siguientes horas/días.
La aplicación dejará de ser una agenda estática.
Será un sistema temporal vivo.
 
⸻
 
2. ESTADOS DE UNA ACTIVIDAD
Cada actividad tendrá un estado temporal.
PROGRAMADA
     ↓
PRÓXIMA
     ↓
EN CURSO
     ↓
PASADA
     ↓
COMPLETADA
Pero PASADA y COMPLETADA no serán exactamente lo mismo.
 
⸻
 
3. PROGRAMADA
La actividad existe pero todavía no ha llegado.
Ejemplo:
Biología — 10:00
A las 08:00:
Programada.
 
⸻
 
4. PRÓXIMA
Cuando sea la siguiente actividad relevante:
⏰ Próxima: Biología · 10:00
Se destacará.
 
⸻
 
5. EN CURSO
Cuando llegue la hora:
🟢 AHORA Biología · 10:00–11:00
La interfaz la destacará automáticamente.
 
⸻
 
6. PASADA
Cuando termine la hora:
Biología · 10:00–11:00
pasa a:
Pasada
y desaparece del tablón principal.
 
⸻
 
7. COMPLETADA
Si el usuario confirma que realmente se realizó:
✅ Completada
Esto permite diferenciar:
“La hora terminó”
de:
“La actividad se realizó.”
 
⸻
 
8. ¿POR QUÉ DIFERENCIARLAS?
Ejemplo:
Tenías:
18:00 Calistenia
Llega 19:00.
El sistema sabe que la hora terminó.
Pero no sabe necesariamente si entrenaste.
Por tanto:
Pasada
no significa automáticamente:
Realizada correctamente.
 
⸻
 
9. CONFIRMACIÓN OPCIONAL
Dependiendo del tipo de actividad:
¿Has completado Calistenia?
Sí
No
Omitir
Esto podrá ser configurable.
 
⸻
 
10. CLASES ESCOLARES
Para el horario escolar probablemente no será necesario preguntar cada vez.
Cuando termine:
Matemáticas → Pasada
sin generar una pregunta molesta.
 
⸻
 
11. TAREAS
Las tareas funcionarán diferente.
Una tarea:
Hacer ejercicios de Biología
no se considera completada simplemente porque haya pasado la hora.
Podrá quedar:
Pendiente
aunque haya terminado el día.
 
⸻
 
12. EVENTOS
Un evento con hora:
18:00 Cumpleaños
pasará a:
Pasado
cuando termine.
 
⸻
 
13. RECORDATORIOS
Un recordatorio vencido podrá pasar a:
Pendiente / Vencido
en lugar de desaparecer.
 
⸻
 
14. EXÁMENES
Después de la hora del examen:
Examen → Pasado
pero permanecerá en el historial.
 
⸻
 
15. EL TABLÓN DE HOY
El tablón principal utilizará filtros inteligentes.
Por defecto:
PASADO
❌ Oculto

AHORA
🟢 Visible

PRÓXIMO
⏰ Visible

RESTO DEL DÍA
📅 Visible
 
⸻
 
16. BOTÓN «VER PASADO»
Si quieres consultar lo anterior:
Ver actividades pasadas
y aparecerá:
08:00 Matemáticas ✓
09:00 Inglés ✓
10:00 Biología ✓
 
⸻
 
17. HISTORIAL DEL DÍA
Al final del día se podrá consultar:
HOY — HISTORIAL
08:00 Matemáticas
09:00 Inglés
10:00 Biología
12:00 Física
18:00 Calistenia
 
⸻
 
18. LÍNEA DE TIEMPO DINÁMICA
Visualmente:
07:00 ─────
08:00 ✓ Matemáticas
09:00 ✓ Inglés
10:00 🟢 Biología
11:00 ─ Descanso
12:00 ⏰ Física
18:00 ⏰ Calistenia
La línea se actualizará conforme avance el tiempo.
 
⸻
 
19. INDICADOR DE HORA ACTUAL
Habrá una línea que indique:
Ahora 10:34
y se moverá automáticamente.
No será necesario recargar la página.
 
⸻
 
20. ACTUALIZACIÓN AUTOMÁTICA
El sistema comprobará el tiempo periódicamente.
Pero no estará recalculando innecesariamente toda la aplicación.
Se actualizarán únicamente los componentes dependientes del tiempo.
 
⸻
 
21. CAMBIO DE HORA
Cuando llegue:
11:00
automáticamente:
ANTES
🟢 Biología

DESPUÉS
✓ Biología
🟢 Descanso
 
⸻
 
22. CAMBIO DE DÍA
A las 00:00:
HOY → nuevo día
El sistema:
1. archiva el día anterior;
2. calcula el nuevo día;
3. carga el horario correspondiente;
4. carga tareas;
5. carga eventos;
6. genera mochila;
7. calcula prioridades.
 
⸻
 
23. NO DEPENDER DE ABRIR LA APP
Si la app está cerrada desde las 07:00 hasta las 12:00:
Al abrirla a las 12:05 no debe mostrar:
“Ahora Matemáticas”
porque lo haya calculado con información antigua.
Debe calcular:
Ahora Física.
 
⸻
 
24. REANUDACIÓN
Cada vez que la aplicación vuelve a primer plano:
recalcular estado temporal.
Esto será obligatorio.
 
⸻
 
25. ZONA HORARIA
El sistema almacenará correctamente la zona horaria.
Esto será especialmente importante para:
* viajes;
* cambios de país;
* sincronización;
* Cloud.
 
⸻
 
26. HORARIO DE VERANO
La arquitectura deberá soportar cambios de hora.
No dependerá de cálculos manuales de 24 horas.
 
⸻
 
27. ACTIVIDADES SIN HORA
Una actividad puede ser:
“Estudiar Biología hoy”
sin hora.
No entrará en el mismo motor que una clase de 10:00.
Se mostrará como:
Pendiente hoy.
 
⸻
 
28. ACTIVIDADES CON RANGO
También:
15:00–17:00 Estudiar.
El motor reconocerá:
Inicio → En curso → Finalización.
 
⸻
 
29. ACTIVIDADES DE TODO EL DÍA
Ejemplo:
Cumpleaños de Jorge
será:
Evento de todo el día
y no tendrá estado “en curso” por horas.
 
⸻
 
30. ACTIVIDADES FLEXIBLES
Podremos tener:
Estudiar 1 hora hoy.
sin hora concreta.
El sistema podrá mostrarla en:
Pendientes de hoy
 
⸻
 
31. BLOQUES FLEXIBLES
En el futuro:
Tengo 2 horas libres.
El sistema podrá proponer:
Colocar estudio de Biología de 16:00–17:00.
Esto conectará con la IA.
 
⸻
 
32. AUTOMATIZACIONES
Aquí comienza el auténtico motor:
SI condición
↓
ENTONCES acción
 
⸻
 
33. EJEMPLO 1
SI
Mañana hay Biología.
ENTONCES
Añadir automáticamente materiales de Biología a la mochila virtual.
 
⸻
 
34. EJEMPLO 2
SI
Mañana hay examen.
ENTONCES
Mostrarlo como prioridad alta en HOY.
 
⸻
 
35. EJEMPLO 3
SI
Una actividad se cancela.
ENTONCES
Recalcular:
* agenda;
* huecos;
* mochila;
* recordatorios.
 
⸻
 
36. EJEMPLO 4
SI
Una tarea vence mañana.
ENTONCES
Mostrar:
⚠️ Vence mañana.
 
⸻
 
37. EJEMPLO 5
SI
Una tarea está vencida.
ENTONCES
No eliminarla.
Mostrar:
🔴 Vencida.
 
⸻
 
38. EJEMPLO 6
SI
La mochila está incompleta.
ENTONCES
Recordatorio configurable.
 
⸻
 
39. EJEMPLO 7
SI
Mañana hay colegio.
ENTONCES
Por la noche mostrar:
🎒 Preparar mochila.
 
⸻
 
40. EJEMPLO 8
SI
Hay entrenamiento en 30 minutos.
ENTONCES
Mostrar:
💪 Entrenamiento en 30 min.
 
⸻
 
41. EJEMPLO 9
SI
Hay dos actividades simultáneas.
ENTONCES
Detectar conflicto.
 
⸻
 
42. EJEMPLO 10
SI
Una actividad termina.
ENTONCES
Moverla automáticamente a:
Pasado
y retirarla del tablón principal.
 
⸻
 
43. MOTOR DE REGLAS
Las reglas tendrán estructura:
TRIGGER
CONDICIONES
ACCIÓN
Ejemplo:
TRIGGER:
Cambio de día

CONDICIÓN:
Mañana es día escolar

ACCIÓN:
Generar mochila
 
⸻
 
44. MÚLTIPLES CONDICIONES
Ejemplo:
SI:
Actividad = Biología

Y:
Tipo = Laboratorio

Y:
Fecha = día escolar

ENTONCES:
Añadir bata
 
⸻
 
45. PRIORIDADES ENTRE REGLAS
Si varias reglas actúan sobre el mismo elemento, el sistema necesitará prioridades.
Ejemplo:
Regla general:
Añadir bata.
Excepción:
No llevar bata el 15 de septiembre.
La excepción gana.
 
⸻
 
46. REGLAS Y EXCEPCIONES
La arquitectura tendrá:
Regla
* ● 
Excepción
Esto evitará tener que borrar reglas completas.
 
⸻
 
47. ACTIVAR/DESACTIVAR
Cada automatización podrá tener:
🟢 Activa
⚪ Desactivada
 
⸻
 
48. EJECUCIÓN MANUAL
También podremos tener:
Ejecutar ahora.
Para probar una automatización.
 
⸻
 
49. REGISTRO DE AUTOMATIZACIONES
El sistema podrá guardar:
21:00
Regla "Preparar mochila"
Ejecutada correctamente
 
⸻
 
50. HISTORIAL DE ACCIONES
Esto será importante para depurar.
Ejemplo:
21:00 → Añadida bata automáticamente.
 
⸻
 
51. DESHACER AUTOMATIZACIÓN
Si una regla hizo algo incorrecto:
Deshacer
deberá poder revertir la acción cuando sea posible.
 
⸻
 
52. EXPLICACIÓN
Cuando algo aparezca automáticamente:
🥼 Bata
podrá aparecer:
Añadida automáticamente por Biología.
Esto evitará confusión.
 
⸻
 
53. AUTOMATIZACIONES SEGURAS
No todas las acciones tendrán el mismo nivel.
Informativas
Sin confirmación.
Reversibles
Podrán ejecutarse automáticamente.
Importantes
Podrán requerir confirmación.
Críticas
Nunca deberán ejecutarse sin autorización.
 
⸻
 
54. IA + AUTOMATIZACIONES
La IA podrá proponer:
“He detectado que cada jueves tienes laboratorio. ¿Quieres que añada automáticamente la bata?”
Botones:
Sí
No
 
⸻
 
55. IA NO ES EL MOTOR
Muy importante:
La IA no será responsable de calcular la hora.
El motor determinista sabrá:
Son las 10:32.
La IA únicamente interpretará, resumirá o propondrá.
Esto hará el sistema mucho más fiable.
 
⸻
 
56. MOTOR TEMPORAL + IA
Arquitectura:
                 CLOUD
                   │
          ┌────────▼────────┐
          │ DATOS DEL USUARIO│
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │ MOTOR TEMPORAL  │
          └────────┬────────┘
                   │
       ┌───────────┼───────────┐
       ↓           ↓           ↓
     HOY       AUTOMATIZACIÓN  IA
       │           │           │
       └───────────┼───────────┘
                   ↓
             EXPERIENCIA
 
⸻
 
57. OBJETIVO FINAL DE ESTA FASE
Que el usuario no tenga que actualizar nada manualmente.
El sistema debe saber:
Dónde estás temporalmente dentro de tu día.
Y mostrarte únicamente aquello que tiene sentido ahora.
 
⸻
 
58. EJEMPLO FINAL
A las 07:50:
⏰ Matemáticas en 10 min.
A las 08:30:
🟢 Matemáticas Termina en 30 min.
A las 09:05:
✓ Matemáticas — pasada 🟢 Inglés — ahora
A las 10:05:
✓ Inglés — pasada 🟢 Biología — ahora
A las 19:30:
✓ Todo el horario escolar 🎒 Mochila de mañana ⚠️ Examen en 3 días
Y mañana, automáticamente, comienza un nuevo ciclo.
 
⸻
 
59. CRITERIOS DE ACEPTACIÓN
La Fase 8 estará completa cuando:
* el tiempo se actualice automáticamente;
* exista actividad actual;
* exista próxima actividad;
* las actividades terminadas desaparezcan de HOY;
* permanezcan como históricas;
* exista estado Pasada;
* exista estado Completada;
* se diferencien ambos estados;
* se puedan consultar actividades pasadas;
* HOY se recalcule al abrir la aplicación;
* exista cambio automático de día;
* existan actividades con y sin hora;
* existan actividades de todo el día;
* exista detección de conflictos;
* exista motor de reglas;
* existan condiciones;
* existan acciones;
* existan excepciones;
* existan prioridades;
* exista historial de automatizaciones;
* exista deshacer cuando sea posible;
* exista explicación de acciones automáticas;
* exista integración con mochila;
* exista integración con tareas;
* exista integración con calendario;
* exista integración con entrenamientos;
* exista integración con IA;
* funcione offline;
* sincronice correctamente con Cloud;
* sea seguro;
* y todo esté preparado para las siguientes fases.
 
⸻
 
SIGUIENTE
FASE 9 — IA DE HORARIO + PLANIFICADOR PERSONAL
Aquí ya entraremos en la parte realmente potente:
La IA podrá entender tu horario completo, tus tareas, exámenes, objetivos y tiempo disponible y ayudarte a organizarlo.
Por ejemplo:
“Tengo examen de Biología el viernes y hoy tengo dos horas libres. ¿Qué hago?”
La IA podrá analizar el contexto real y proponerte un plan.
También:
“Organízame mañana.”
“¿Dónde tengo un hueco para estudiar?”
“Tengo demasiadas cosas esta semana.”
“Quiero preparar Biología antes del viernes.”
Y, muy importante, la IA podrá proponer cambios pero no modificará cosas importantes sin tu autorización.
PROGRESO: 
66,7 % / 100 %
La siguiente fase será la que convierta HORARIO TOP en un planificador personal inteligente, no simplemente en un calendario.

HORARIO TOP
FASE 9 — IA DE HORARIO + PLANIFICADOR PERSONAL INTELIGENTE
Ahora entramos en una de las fases más importantes.
Hasta aquí hemos construido el sistema temporal. Ahora vamos a hacer que la IA pueda entenderlo y ayudarte a tomar decisiones, utilizando los datos reales de tu sistema.
La regla fundamental será:
La IA propone y explica; el motor del sistema ejecuta de forma controlada.
No queremos una IA que invente horarios. Queremos una IA que consulte los datos reales y trabaje sobre ellos.
 
⸻
 
1. OBJETIVO
La IA deberá comprender:
* horario;
* calendario;
* tareas;
* exámenes;
* entrenamientos;
* objetivos;
* hábitos;
* mochila;
* eventos;
* tiempo disponible;
* prioridades;
* actividades pasadas;
* actividades futuras.
Y utilizar todo ello para ayudarte a organizarte.
 
⸻
 
2. CONTEXTO TEMPORAL REAL
Cuando preguntes:
“¿Qué tengo hoy?”
la IA no deberá responder desde memoria.
Primero consultará:
FECHA ACTUAL
↓
HORA ACTUAL
↓
HORARIO
↓
EVENTOS
↓
TAREAS
↓
EXÁMENES
↓
ENTRENAMIENTO
↓
OTROS DATOS RELEVANTES
 
⸻
 
3. PREGUNTAS NATURALES
Podrás escribir:
¿Qué tengo mañana?
¿Qué tengo esta tarde?
¿Cuándo tengo Biología?
¿Tengo algo importante esta semana?
¿Qué me queda por hacer hoy?
¿Cuánto tiempo libre tengo?
La IA responderá utilizando datos reales.
 
⸻
 
4. PLANIFICACIÓN AUTOMÁTICA
Podrás decir:
“Organízame mañana.”
La IA analizará:
* horario fijo;
* tareas;
* eventos;
* descansos;
* entrenamiento;
* prioridades.
Y propondrá una planificación.
 
⸻
 
5. EJEMPLO
Supongamos:
08:00 Matemáticas
09:00 Inglés
10:00 Biología
12:00 Física
18:00 Calistenia
Y además:
* tarea de Física;
* estudiar Biología;
* examen el viernes.
La IA podría proponer:
16:00–16:45
📚 Estudiar Biología

16:45–17:00
☕ Descanso

17:00–17:30
⚛️ Tarea de Física

18:00
💪 Calistenia
 
⸻
 
6. NUNCA SOBREESCRIBIRÁ SIN PERMISO
La propuesta aparecerá como:
Plan sugerido
Botones:
Aceptar
Modificar
Cancelar
 
⸻
 
7. ACEPTAR PLAN
Si aceptas:
La aplicación convierte la propuesta en elementos reales:
* bloques;
* tareas;
* recordatorios;
* eventos.
 
⸻
 
8. MODIFICAR PLAN
Podrás decir:
“No quiero estudiar antes de entrenar.”
La IA recalculará.
 
⸻
 
9. REPLANIFICACIÓN
Si algo cambia:
“Hoy no puedo entrenar.”
La IA podrá decir:
“He encontrado dos huecos posibles para moverlo.”
 
⸻
 
10. REPLANIFICACIÓN INTELIGENTE
No simplemente moverá una actividad a cualquier hora.
Tendrá en cuenta:
* otras actividades;
* duración;
* prioridades;
* descansos;
* conflictos;
* preferencias.
 
⸻
 
11. DURACIÓN
Las tareas podrán tener una duración estimada.
Ejemplo:
Física — 45 min.
La IA no intentará meter 45 minutos en un hueco de 20.
 
⸻
 
12. TIEMPO DISPONIBLE
El motor calculará:
16:00–17:30
LIBRE = 90 minutos
La IA podrá aprovecharlo.
 
⸻
 
13. HUECOS
Podrá preguntar:
“¿Cuándo tengo tiempo para estudiar?”
Respuesta:
Hoy tienes un hueco de 16:00 a 17:30 y otro de 20:30 a 21:15.
 
⸻
 
14. HUECOS ADECUADOS
No todos los huecos serán iguales.
La IA podrá valorar:
* duración;
* cercanía a otras actividades;
* tipo de tarea;
* energía/preferencia configurada.
 
⸻
 
15. BLOQUES DE ESTUDIO
Podrá proponer:
* estudio;
* descanso;
* repaso;
* ejercicios;
* preparación.
 
⸻
 
16. EXÁMENES
Aquí la IA tendrá una función especialmente importante.
Si existe:
Examen de Biología — viernes
podrá analizar:
* días restantes;
* contenido;
* tiempo disponible;
* otras obligaciones.
 
⸻
 
17. PLAN DE ESTUDIO
Ejemplo:
Lunes
Tema 1

Martes
Tema 2

Miércoles
Tema 3

Jueves
Repaso

Viernes
Examen
 
⸻
 
18. PLAN ADAPTATIVO
Si el martes no estudias:
La IA podrá recalcular:
“Te quedan dos sesiones antes del examen. Propongo dividir el contenido de otra forma.”
 
⸻
 
19. NO CASTIGAR
No dirá:
“Has fallado.”
Simplemente:
“El plan necesita reajustarse.”
 
⸻
 
20. PRIORIDADES
La IA podrá ordenar tareas según:
* fecha límite;
* importancia;
* duración;
* relación con objetivos;
* proximidad de examen.
 
⸻
 
21. PUNTUACIÓN DE PRIORIDAD
Internamente podrá existir un cálculo.
Por ejemplo:
Urgencia
Importancia
Duración
Dependencias
Fecha límite
Pero no será necesario mostrar números complejos al usuario.
 
⸻
 
22. TAREAS GRANDES
Una tarea:
“Estudiar Biología”
podrá dividirse:
Tema 1
Tema 2
Tema 3
Ejercicios
Repaso
 
⸻
 
23. DESCOMPOSICIÓN INTELIGENTE
Podrás decir:
“Tengo que preparar todo el tema 4.”
La IA podrá proponer:
1. leer;
2. resumir;
3. estudiar;
4. practicar;
5. repasar.
 
⸻
 
24. DEPENDENCIAS
Algunas tareas dependen de otras.
Ejemplo:
Hacer ejercicios
requiere:
estudiar teoría.
La IA podrá detectar esa relación si está configurada.
 
⸻
 
25. OBJETIVOS
La IA también podrá utilizar objetivos.
Ejemplo:
Objetivo: mejorar planche
La IA podrá considerar las sesiones de entrenamiento existentes.
 
⸻
 
26. ENTRENAMIENTO
Podrá responder:
“¿Dónde puedo meter calistenia esta semana?”
Analizará los huecos disponibles.
 
⸻
 
27. DESCANSO
El planificador no deberá llenar todos los huecos.
Debe poder decir:
“No te recomiendo meter otra actividad aquí; tienes poco margen antes del entrenamiento.”
 
⸻
 
28. TIEMPO DE TRANSICIÓN
Entre actividades podrá existir:
Tiempo de transición
Ejemplo:
Entrenamiento termina:
19:00
Siguiente actividad:
19:15
La aplicación puede considerar:
15 minutos de margen.
 
⸻
 
29. TIEMPO DE DESPLAZAMIENTO
Si existe ubicación:
Colegio → gimnasio
podrá considerar el desplazamiento.
 
⸻
 
30. MARGEN
El usuario podrá configurar:
Quiero 15 minutos de margen antes de actividades importantes.
 
⸻
 
31. PREFERENCIAS DE PLANIFICACIÓN
Se podrán configurar preferencias como:
* estudiar por la tarde;
* no estudiar después de cierta hora;
* descansar después del colegio;
* entrenar determinados días;
* evitar bloques demasiado largos.
 
⸻
 
32. PLANIFICACIÓN PERSONALIZADA
La IA deberá aprender estas preferencias solo si están configuradas o autorizadas.
No asumirá cosas personales sin base.
 
⸻
 
33. MODO «TENGO MUCHO QUE HACER»
Podrás decir:
“Tengo demasiadas cosas.”
La IA analizará la carga.
Podrá responder:
“Hoy tienes 7 actividades y 4 tareas. Te propongo priorizar estas 2 y mover estas otras.”
 
⸻
 
34. CARGA SEMANAL
Podrá calcular:
* actividades;
* horas ocupadas;
* tareas;
* exámenes;
* entrenamientos.
Y mostrar:
Semana de carga alta.
 
⸻
 
35. MAPA DE CARGA
La semana podría representarse:
Lunes       🟢
Martes      🟡
Miércoles   🔴
Jueves      🟢
Viernes     🔴
 
⸻
 
36. DETECCIÓN DE SOBRECARGA
Si el sistema detecta demasiadas obligaciones:
⚠️ Miércoles está especialmente cargado.
Y podrá sugerir reorganización.
 
⸻
 
37. NO DECIDIRÁ POR TI
La IA nunca deberá eliminar:
* clases;
* exámenes;
* eventos importantes;
para liberar tiempo.
Podrá proponer cambios únicamente sobre elementos modificables.
 
⸻
 
38. ELEMENTOS BLOQUEADOS
Cada actividad podrá indicar:
Fija
o:
Flexible
Ejemplo:
Clase:
🔒 Fija
Estudio:
🔓 Flexible
 
⸻
 
39. INTELIGENCIA SOBRE BLOQUES FIJOS
El planificador primero colocará:
1. clases;
2. eventos;
3. entrenamientos fijos;
4. otras obligaciones.
Después buscará huecos.
 
⸻
 
40. PLANIFICACIÓN POR CAPAS
CAPA 1
Obligaciones

CAPA 2
Prioridades

CAPA 3
Objetivos

CAPA 4
Tareas

CAPA 5
Descanso

CAPA 6
Tiempo libre
Esto evitará que el sistema intente llenar todo indiscriminadamente.
 
⸻
 
41. PLANIFICACIÓN POR COMANDOS
Podrás escribir:
“Quiero estudiar 2 horas esta semana.”
La IA buscará huecos.
 
⸻
 
42. MÚLTIPLES CONDICIONES
“Quiero estudiar Biología dos horas antes del viernes y no quiero hacerlo después de las 21:00.”
El sistema buscará huecos compatibles.
 
⸻
 
43. RESTRICCIONES
Podrás decir:
“No pongas nada los domingos.”
El planificador deberá respetarlo.
 
⸻
 
44. PREFERENCIAS PERMANENTES
Podrá guardarse:
No programar estudio después de las 22:00.
 
⸻
 
45. PREFERENCIAS TEMPORALES
También:
Esta semana no quiero entrenar el miércoles.
Solo afectará esa semana.
 
⸻
 
46. CHAT CONTEXTUAL
La IA podrá aparecer dentro de HOY.
Ejemplo:
🤖 ASISTENTE

Tienes 2 horas libres esta tarde.

¿Quieres que te ayude a organizarlas?
 
⸻
 
47. ACCIONES RÁPIDAS
Botones:
Organizar tarde
Ver tareas
Preparar examen
Ver semana
 
⸻
 
48. RESPUESTAS CONTEXTUALES
Si pulsas:
Organizar tarde
la IA ya conocerá:
* hora actual;
* actividades restantes;
* tareas;
* entrenamiento.
No tendrás que explicárselo.
 
⸻
 
49. CONSULTA DE DATOS
La IA deberá utilizar herramientas internas para consultar datos estructurados.
Por ejemplo:
get_today_schedule()
get_tasks()
get_events()
get_exams()
get_free_time()
get_bag()
 
⸻
 
50. NO MANDAR TODO A LA IA
No se enviará innecesariamente toda la base de datos.
Solo el contexto relevante.
Esto mejorará:
* privacidad;
* coste;
* velocidad;
* precisión.
 
⸻
 
51. RESPUESTAS BASADAS EN DATOS
La IA podrá responder:
“Tienes 1 h 20 min libres.”
porque el motor temporal lo ha calculado.
No porque la IA lo haya estimado.
 
⸻
 
52. MOTOR DETERMINISTA + IA
La arquitectura será:
DATOS
 ↓
MOTOR TEMPORAL
 ↓
MOTOR DE PLANIFICACIÓN
 ↓
IA
 ↓
PROPUESTA
 ↓
CONFIRMACIÓN
 ↓
CAMBIOS
 
⸻
 
53. ACCIONES DE LA IA
La IA podrá proponer acciones estructuradas:
CREATE_TASK
MOVE_EVENT
CREATE_STUDY_BLOCK
CREATE_REMINDER
PREPARE_BAG
 
⸻
 
54. VALIDACIÓN
Antes de ejecutar:
¿La acción es válida?
¿Hay conflicto?
¿Tiene permiso?
¿Está dentro de las reglas?
 
⸻
 
55. CONFIRMACIÓN
Ejemplo:
Voy a añadir 3 sesiones de estudio esta semana.
Confirmar
Modificar
Cancelar
 
⸻
 
56. PREVISUALIZACIÓN
Antes de modificar el calendario:
PROPUESTA

Martes
17:00–18:00 Biología

Jueves
17:00–18:00 Biología

[Aplicar]
 
⸻
 
57. DESHACER
Después de aplicar:
Cambios aplicados.
Deshacer
 
⸻
 
58. HISTORIAL
Se guardará:
Plan creado por IA · 22 agosto · 20:31.
Esto permitirá revertir o revisar.
 
⸻
 
59. MODO MANUAL
La IA nunca será obligatoria.
Todo seguirá pudiéndose hacer manualmente.
 
⸻
 
60. MODO IA
Si se activa:
La IA podrá ofrecer sugerencias contextuales.
 
⸻
 
61. NIVEL DE AUTONOMÍA
Se podrá configurar:
Nivel 1 — Solo sugerencias
La IA nunca modifica.
Nivel 2 — Acciones sencillas
Puede ejecutar acciones previamente autorizadas.
Nivel 3 — Automatización avanzada
Puede ejecutar determinadas reglas automáticamente.
El usuario tendrá control total.
 
⸻
 
62. PRIVACIDAD
La IA solo recibirá información necesaria para la acción solicitada.
Ejemplo:
Pregunta:
“¿Qué tengo mañana?”
No necesita acceder a economía.
 
⸻
 
63. PERMISOS
Podrán existir permisos de contexto:
☑ Calendario ☑ Tareas ☑ Horario ☑ Entrenamientos ☐ Economía ☐ Notas privadas
 
⸻
 
64. DATOS SENSIBLES
La IA no deberá acceder automáticamente a módulos privados si no son necesarios.
 
⸻
 
65. MEMORIA DE IA
Podrá existir una memoria específica de planificación:
* preferencias;
* reglas;
* estilos de planificación.
Pero separada de los datos principales.
 
⸻
 
66. EJEMPLO DE PREFERENCIA
“Prefiero estudiar en sesiones de 45 minutos.”
La IA podrá utilizarlo posteriormente.
 
⸻
 
67. EXPLICACIÓN DEL PLAN
La IA podrá decir:
He colocado Biología el martes porque tienes 90 minutos libres y el examen es el viernes.
Esto hará que el usuario entienda la decisión.
 
⸻
 
68. PLAN ALTERNATIVO
Podrá ofrecer:
Opción A — Más estudio
Opción B — Más descanso
 
⸻
 
69. COMPARACIÓN
Ejemplo:
Opción A termina antes pero deja menos descanso.
Opción B distribuye el estudio en dos días.
 
⸻
 
70. PLANIFICACIÓN SEMANAL
Podrás pedir:
“Organízame la semana.”
La IA primero mostrará:
Resumen
y después:
Propuesta.
No aplicará directamente todo.
 
⸻
 
71. PLANIFICACIÓN DIARIA
También:
“Organízame hoy.”
 
⸻
 
72. PLANIFICACIÓN DE UN PROYECTO
Ejemplo:
“Tengo que terminar este trabajo el jueves.”
La IA podrá dividirlo.
 
⸻
 
73. FECHA LÍMITE
La fecha límite será una restricción.
No programará trabajo después de la entrega.
 
⸻
 
74. MARGEN DE SEGURIDAD
Podrá configurar:
Terminar las tareas al menos 1 día antes.
Esto permitirá planificar con margen.
 
⸻
 
75. IMPREVISTOS
Si surge:
“Hoy no puedo estudiar.”
La IA podrá recalcular sin destruir el plan original.
 
⸻
 
76. PLAN ORIGINAL
Se conservará:
Plan original
y:
Plan actual
Esto permite comparar.
 
⸻
 
77. CAMBIOS
Ejemplo:
PLAN ORIGINAL
Martes → Biología

CAMBIO
Martes cancelado

NUEVO PLAN
Miércoles → Biología
 
⸻
 
78. OBJETIVOS A LARGO PLAZO
La IA podrá considerar objetivos de varias semanas.
Ejemplo:
Mejorar una habilidad de calistenia.
No solamente lo que ocurre mañana.
 
⸻
 
79. PROGRESIÓN
Los objetivos podrán tener:
* meta;
* fecha;
* progreso;
* sesiones necesarias.
 
⸻
 
80. CONEXIÓN CON EL RESTO DEL SISTEMA PERSONAL
La IA de HORARIO TOP deberá poder consultar, con permisos:
* sueño;
* entrenamiento;
* estudios;
* productividad;
* objetivos;
* economía cuando sea necesario;
* calendario.
Pero no mezclará información irrelevante.
 
⸻
 
81. EJEMPLO REAL
Usuario:
“Esta semana quiero preparar Biología, entrenar cuatro veces y terminar el trabajo de Física.”
La IA analiza:
HORARIO
+
ENTRENAMIENTO
+
TAREAS
+
EXAMEN
+
HUECOS
Y devuelve:
Te propongo 3 sesiones de Biología, 4 entrenamientos y 2 bloques para Física. Hay un conflicto el miércoles, así que he dejado el cuarto entrenamiento para el sábado.
Aplicar plan
 
⸻
 
82. PLANIFICADOR PROACTIVO
La IA podrá detectar:
“Tienes un examen el viernes y todavía no tienes ninguna sesión de estudio programada.”
Y ofrecer:
Preparar plan
 
⸻
 
83. PERO SIN SPAM
No estará constantemente avisando.
Habrá límites:
* frecuencia;
* importancia;
* horario;
* preferencias.
 
⸻
 
84. CENTRO DE SUGERENCIAS
Podrá existir:
🤖 SUGERENCIAS
⚠️ Examen en 3 días
📚 No tienes estudio programado

🎒 Mochila de mañana incompleta

📅 Tienes un hueco de 90 min esta tarde
 
⸻
 
85. ACCIONES DESDE SUGERENCIAS
Cada sugerencia podrá tener:
Resolver
Ignorar
Recordar más tarde
 
⸻
 
86. APRENDIZAJE DE PREFERENCIAS
Si repetidamente ignoras una clase de sugerencias:
La IA podrá reducirlas.
Pero no deberá asumir preferencias sensibles.
 
⸻
 
87. SISTEMA DE FEEDBACK
Después de una planificación:
¿Te ha servido este plan?
Opciones:
👍 Sí
👎 No
Esto permitirá mejorar la experiencia.
 
⸻
 
88. PLANES FALLIDOS
Si un plan no funciona:
La IA podrá preguntar:
¿Qué quieres cambiar?
* menos bloques;
* más descanso;
* sesiones más cortas;
* otro horario.
 
⸻
 
89. CALIDAD DEL PLAN
El motor podrá comprobar:
* conflictos;
* tiempos insuficientes;
* exceso de carga;
* fechas imposibles;
* duplicados.
 
⸻
 
90. REGLA DE ORO
Nunca crear una planificación imposible.
Si no existe espacio:
“No hay suficientes huecos para cumplirlo sin modificar algo.”
En lugar de inventar tiempo.
 
⸻
 
91. CRITERIOS DE ACEPTACIÓN
La Fase 9 estará completa cuando exista:
* IA contextual;
* consultas naturales;
* planificación diaria;
* planificación semanal;
* búsqueda de huecos;
* creación de propuestas;
* reprogramación;
* gestión de prioridades;
* planificación de exámenes;
* división de tareas;
* restricciones;
* preferencias;
* actividades fijas;
* actividades flexibles;
* detección de sobrecarga;
* tiempos de transición;
* propuestas alternativas;
* previsualización;
* confirmación;
* deshacer;
* historial;
* permisos de contexto;
* niveles de autonomía;
* integración con horario;
* calendario;
* tareas;
* exámenes;
* entrenamiento;
* objetivos;
* mochila;
* motor temporal;
* Cloud;
* seguridad;
* funcionamiento offline cuando sea posible.
 
⸻
 
SIGUIENTE FASE
FASE 10 — NOTIFICACIONES + RECORDATORIOS + CONTEXTO PROACTIVO
Aquí construiremos cómo el sistema te avisa en el momento adecuado.
No será simplemente:
“Alarma a las 18:00.”
Será un sistema contextual.
Por ejemplo:
17:30
💪 Entrenamiento en 30 minutos.
20:30
🎒 Mañana tienes Biología. Te faltan 2 cosas por preparar.
21:00
📚 Tienes un examen el viernes y todavía no has preparado el estudio de mañana.
Y, sobre todo, evitaremos convertirlo en una aplicación que esté mandando notificaciones constantemente.
La siguiente fase definirá:
* motor de notificaciones;
* recordatorios inteligentes;
* prioridades;
* agrupación;
* silencio;
* horarios;
* notificaciones de mochila;
* exámenes;
* tareas;
* cambios de horario;
* conflictos;
* notificaciones contextuales;
* permisos;
* preferencias;
* notificaciones push;
* funcionamiento con app cerrada;
* sincronización Cloud;
* y la conexión con la IA.
PROGRESO DEL MÓDULO: 
75 % / 100 %

HORARIO TOP
FASE 7 — MOCHILA INTELIGENTE + MATERIALES + PREPARACIÓN AUTOMÁTICA
Esta fase convierte la conexión entre horario + actividades + HOY en un sistema real de preparación.
La idea es que la aplicación pueda responder automáticamente:
“Mañana, ¿qué tengo que llevar?”
sin que tengas que pensar asignatura por asignatura.
 
⸻
 
1. OBJETIVO PRINCIPAL
La mochila será un sistema inteligente que calculará:
Día → actividades → materiales → excepciones → mochila
Ejemplo:
MAÑANA

08:00 Matemáticas
10:00 Biología
12:00 Física

↓

MATERIALES

📐 Calculadora
📘 Libro Biología
📓 Libreta
🥼 Bata
⚛️ Libro Física

↓

🎒 MOCHILA
 
⸻
 
2. LA MOCHILA COMO ENTIDAD
La mochila no será simplemente una lista.
Tendrá su propia estructura:
MOCHILA
├── Elementos
├── Estado
├── Fecha
├── Preparación
└── Historial
Esto permitirá saber qué se ha preparado y cuándo.
 
⸻
 
3. ELEMENTO DE MOCHILA
Cada objeto tendrá información.
Ejemplo:
📘 Libro de Biología

Cantidad: 1
Obligatorio: Sí
Asignatura: Biología
 
⸻
 
4. TIPOS DE MATERIAL
Se podrán clasificar:
* libros;
* libretas;
* carpetas;
* documentos;
* calculadoras;
* material deportivo;
* material artístico;
* dispositivos;
* cargadores;
* ropa;
* accesorios;
* objetos personales;
* otros.
 
⸻
 
5. MATERIAL PERSONALIZADO
El usuario podrá crear cualquier elemento.
Ejemplo:
“Bata blanca”
o:
“Cable USB-C”.
No habrá que depender de categorías predefinidas.
 
⸻
 
6. MATERIAL ASOCIADO A ACTIVIDAD
Una actividad podrá tener materiales permanentes.
Ejemplo:
Biología
📘 Libro
📓 Libreta
🥼 Bata
Cada vez que aparezca Biología, el sistema podrá considerarlos.
 
⸻
 
7. MATERIAL OPCIONAL
Cada material podrá marcarse:
Obligatorio
o:
Opcional
Ejemplo:
Biología:
☑ Libro ☑ Bata ☐ Tablet
 
⸻
 
8. MATERIAL TEMPORAL
Podrá existir un material que solo se necesite durante un periodo.
Ejemplo:
Llevar cartulina esta semana.
Después dejará de aparecer automáticamente.
 
⸻
 
9. MATERIAL POR FECHA
También se podrá decir:
“Necesito esto el jueves.”
Ejemplo:
Jueves
☑ Documento de excursión.
No afectará al resto de días.
 
⸻
 
10. MATERIAL POR EVENTO
Un evento podrá exigir material.
Ejemplo:
Excursión
Evento
↓
Excursión
↓
Material
├── DNI
├── Agua
├── Almuerzo
└── Autorización
 
⸻
 
11. MATERIAL POR EXAMEN
Un examen podrá tener requisitos.
Ejemplo:
Examen Matemáticas
☑ Calculadora ☑ Regla ☑ Documento de identidad
La mochila podrá detectarlo.
 
⸻
 
12. MATERIAL DE ENTRENAMIENTO
La misma arquitectura servirá para deporte.
Calistenia
☑ Botella ☑ Toalla ☑ Muñequeras
Fútbol
☑ Botas ☑ Espinilleras ☑ Camiseta
 
⸻
 
13. MATERIAL DE ENTRENAMIENTO ESPECÍFICO
Una sesión concreta podrá requerir algo diferente.
Ejemplo:
Entrenamiento de fútbol
Hoy necesitas botas de césped artificial.
No modificará la configuración habitual de fútbol.
 
⸻
 
14. MOCHILA DE HOY
HOY mostrará:
🎒 MOCHILA
☐ Libro de Biología
☐ Libreta
☐ Bata
☑ Calculadora
 
⸻
 
15. MOCHILA DE MAÑANA
Por la noche será especialmente importante.
El sistema podrá mostrar:
🎒 PARA MAÑANA
☐ Libro de Biología
☐ Bata
☐ Libreta
 
⸻
 
16. PREPARACIÓN
Cada elemento tendrá un estado:
* pendiente;
* preparado;
* no necesario;
* descartado.
 
⸻
 
17. MARCAR COMO PREPARADO
Al pulsar:
☐ Bata
se convierte en:
☑ Bata
Y el sistema guarda que ha sido preparada.
 
⸻
 
18. PROGRESO DE MOCHILA
Podrá mostrar:
3/5 preparados
o:
60 % preparado
 
⸻
 
19. MOCHILA COMPLETA
Cuando todo esté preparado:
🎒 MOCHILA LISTA
Esto dará una confirmación clara.
 
⸻
 
20. MOCHILA INCOMPLETA
Si falta algo importante:
⚠️ Falta material obligatorio.
Y se mostrará:
🥼 Bata
 
⸻
 
21. DIFERENCIAR OBLIGATORIO
Ejemplo:
OBLIGATORIO
☐ Libro
☐ Bata

OPCIONAL
☐ Tablet
Esto evita que el usuario confunda recomendaciones con necesidades reales.
 
⸻
 
22. PREPARAR TODO
Botón:
Preparar todo
permitirá marcar varios elementos rápidamente.
Antes de hacerlo podrá existir una confirmación si hay muchos elementos.
 
⸻
 
23. DESMARCAR TODO
También:
Vaciar preparación
para empezar de nuevo.
 
⸻
 
24. ELEMENTOS PERSISTENTES
Algunos objetos pueden estar siempre en la mochila.
Ejemplo:
* cartera;
* llaves;
* estuche.
Se podrá definir:
Siempre en mochila
Estos no desaparecerán cada día.
 
⸻
 
25. ELEMENTOS NO PERSISTENTES
Otros deberán volver a marcarse.
Ejemplo:
* libro de Biología;
* bata;
* material de examen.
 
⸻
 
26. MOCHILA BASE
Se podrá configurar una:
MOCHILA BASE
☑ Estuche
☑ Botella
☑ Cargador
☑ Auriculares
Estos elementos estarán siempre presentes.
 
⸻
 
27. MOCHILA ESCOLAR
Podrá existir una categoría:
Colegio
 
⸻
 
28. MOCHILA DEPORTIVA
Otra:
Deporte
 
⸻
 
29. OTRAS MOCHILAS
La arquitectura permitirá:
* mochila de colegio;
* mochila de entrenamiento;
* mochila de viaje;
* bolsa de gimnasio;
* mochila personalizada.
No se limitará a una sola mochila física.
 
⸻
 
30. SELECCIÓN DE MOCHILA
Un evento podrá especificar:
Usar mochila deportiva.
Así los elementos se asignarán correctamente.
 
⸻
 
31. MATERIAL COMPARTIDO
Un objeto podrá utilizarse en diferentes contextos.
Ejemplo:
Botella
puede ser necesaria para:
* colegio;
* calistenia;
* fútbol.
No se deberán crear tres botellas diferentes.
 
⸻
 
32. INVENTARIO
Podrá existir un inventario global:
MIS MATERIALES

📘 Libros
📓 Libretas
🥼 Bata
🎒 Mochilas
💻 Dispositivos
Esto permitirá reutilización.
 
⸻
 
33. CANTIDAD DISPONIBLE
El inventario podrá guardar:
Bata
Cantidad:
1
Esto será útil posteriormente.
 
⸻
 
34. MATERIAL PRESTADO
Podrá marcarse:
Prestado.
Ejemplo:
Calculadora → prestada
El sistema podrá avisar:
“Mañana necesitas la calculadora, pero está marcada como prestada.”
 
⸻
 
35. MATERIAL PERDIDO
Podrá marcarse:
Perdido.
Esto impedirá que el sistema simplemente asuma que está disponible.
 
⸻
 
36. MATERIAL ROTO
Estado:
No disponible.
También podrá existir.
 
⸻
 
37. DISPONIBILIDAD
Cada objeto podrá tener:
* disponible;
* preparado;
* prestado;
* perdido;
* no disponible.
 
⸻
 
38. ALERTA DE DISPONIBILIDAD
Ejemplo:
⚠️ Calculadora

Necesaria mañana.
Estado: prestada.
Esto es mucho más útil que una simple checklist.
 
⸻
 
39. COMPARTIR MATERIAL
En futuras versiones podrá existir:
“Este material está en otra mochila.”
La aplicación podrá evitar duplicados conceptuales.
 
⸻
 
40. UBICACIÓN DEL MATERIAL
Podrá guardarse:
Dónde está físicamente.
Ejemplo:
Bata → armario.
Calculadora → escritorio.
Esto permitirá una futura función:
“¿Dónde está mi bata?”
 
⸻
 
41. UBICACIONES DE ALMACENAMIENTO
Se podrán crear:
* habitación;
* escritorio;
* armario;
* mochila;
* coche;
* taquilla.
 
⸻
 
42. CAMBIO DE UBICACIÓN
Cuando el usuario prepare:
Libro de Biología
la aplicación podrá registrar:
Ubicación actual → mochila.
 
⸻
 
43. HISTORIAL
Se podrá saber:
Libro Biología

Ayer → escritorio
Hoy → mochila
No será obligatorio mostrarlo siempre.
 
⸻
 
44. PREPARACIÓN AUTOMÁTICA
Cada noche el sistema podrá generar automáticamente:
PARA MAÑANA
utilizando:
* horario;
* eventos;
* tareas;
* exámenes;
* entrenamientos;
* materiales.
 
⸻
 
45. GENERACIÓN ANTICIPADA
No esperará necesariamente a las 00:00.
Podrá preparar la mochila virtual con antelación.
Ejemplo:
A partir de las 18:00 se genera la preparación del día siguiente.
El usuario podrá configurar el momento.
 
⸻
 
46. HORA DE PREPARACIÓN
Configuración:
Recordarme preparar mochila a las 21:00.
 
⸻
 
47. RECORDATORIO
A las 21:00:
🎒 ¿Has preparado la mochila para mañana?
 
⸻
 
48. RECORDATORIO INTELIGENTE
Si ya está todo preparado:
🎒 Mochila lista ✅
No tendrá sentido enviar otro recordatorio.
 
⸻
 
49. RECORDATORIO CON FALTANTES
Si faltan cosas:
⚠️ Te faltan 2 materiales para mañana.
 
⸻
 
50. PRIORIDAD DEL MATERIAL
Cada material podrá tener prioridad:
* crítico;
* obligatorio;
* recomendado;
* opcional.
 
⸻
 
51. MATERIAL CRÍTICO
Ejemplo:
DNI para excursión
Si falta:
🔴 IMPRESCINDIBLE
 
⸻
 
52. MATERIAL RECOMENDADO
Ejemplo:
Tablet
No bloqueará la preparación.
 
⸻
 
53. EXCEPCIONES
Si mañana hay una excursión:
El sistema deberá poder sustituir las necesidades normales.
Ejemplo:
Horario normal
↓
Excursión
↓
Material especial
 
⸻
 
54. DÍA ESPECIAL
Un día podrá tener configuración especial:
Jornada deportiva
El sistema generará la mochila correspondiente.
 
⸻
 
55. CAMBIO DE HORARIO
Si se cambia una clase:
La mochila deberá recalcularse.
Ejemplo:
Biología pasa del martes al miércoles.
La bata:
martes → miércoles
automáticamente.
 
⸻
 
56. CANCELACIÓN
Si se cancela Biología:
El material relacionado dejará de ser obligatorio para ese día.
El usuario deberá poder verlo claramente:
Biología cancelada → bata ya no necesaria.
 
⸻
 
57. NO BORRAR MATERIAL MANUAL
Si el usuario había añadido manualmente:
“Llevar bata igualmente.”
el sistema no deberá borrarlo automáticamente.
Debe distinguir:
material automático
de:
material añadido manualmente.
 
⸻
 
58. ORIGEN DEL ELEMENTO
Cada elemento podrá indicar:
Origen:
Horario
Evento
Examen
Manual
Entrenamiento
Esto permitirá comprender por qué aparece.
 
⸻
 
59. EXPLICACIÓN
Si aparece:
🥼 Bata
el usuario podrá tocarla y ver:
Necesaria porque mañana tienes Laboratorio de Biología.
Esto hará que el sistema sea transparente.
 
⸻
 
60. MATERIAL DUPLICADO
Si dos actividades necesitan:
libreta
el sistema deberá mostrar:
1 libreta
y no:
2 libretas.
 
⸻
 
61. CANTIDADES INTELIGENTES
Si dos actividades requieren:
2 hojas
y:
3 hojas
se podrá calcular:
5 hojas.
 
⸻
 
62. CONSUMIBLES
Se podrá distinguir material consumible:
* hojas;
* bolígrafos;
* tinta;
* papel.
Posteriormente podrá existir inventario.
 
⸻
 
63. INVENTARIO BAJO
Ejemplo:
Quedan 2 hojas.
Pero mañana necesitas 5.
La aplicación podrá mostrar:
⚠️ Te faltan 3.
 
⸻
 
64. LISTA DE COMPRA
Esto permitirá conectar mochila con economía/compras.
Ejemplo:
Comprar hojas.
 
⸻
 
65. CONEXIÓN CON ECONOMÍA
Si el usuario marca:
Comprar calculadora
se podrá crear posteriormente un elemento en:
Economía / Compras.
No se duplicará información.
 
⸻
 
66. CONEXIÓN CON TAREAS
Ejemplo:
Comprar cartulina.
Podrá convertirse en tarea.
 
⸻
 
67. CONEXIÓN CON RECORDATORIOS
Ejemplo:
Comprar bata antes del viernes.
 
⸻
 
68. MOCHILA + HOY
HOY mostrará únicamente lo relevante.
No deberá enseñar todo el inventario.
 
⸻
 
69. MOCHILA + CALENDARIO
Al abrir un día:
🎒 Ver mochila
mostrará las necesidades calculadas para esa fecha.
 
⸻
 
70. MOCHILA + SEMANA
La vista semanal podrá tener un indicador:
Lunes 🎒
Martes 🎒
Miércoles 🎒
Jueves 🎒
Viernes 🎒
 
⸻
 
71. ESTADO DE PREPARACIÓN SEMANAL
Podrá mostrar:
LUNES     ✅
MARTES    ⚠️
MIÉRCOLES —
JUEVES    ❌
VIERNES   —
 
⸻
 
72. PREPARACIÓN DE VARIOS DÍAS
El usuario podrá preparar:
mañana
o:
toda la semana.
 
⸻
 
73. PLANIFICACIÓN ANTICIPADA
Ejemplo:
Domingo por la tarde:
Preparar mochilas de lunes y martes.
 
⸻
 
74. MOCHILA POR PERFIL
Si en el futuro existen diferentes contextos:
Colegio
Entrenamiento
Trabajo
cada uno podrá tener reglas diferentes.
 
⸻
 
75. REGLAS
Ejemplo:
SI:
Actividad = Biología

ENTONCES:
Añadir libro
Añadir libreta
Estas reglas serán el comienzo del sistema de automatización.
 
⸻
 
76. REGLAS CON CONDICIONES
Ejemplo:
SI:
Biología
Y:
Tipo = laboratorio

ENTONCES:
Añadir bata
 
⸻
 
77. REGLAS TEMPORALES
Ejemplo:
Durante septiembre:
Añadir agenda
Después se desactiva automáticamente.
 
⸻
 
78. REGLAS POR DÍA
Ejemplo:
Viernes:
Añadir material de fútbol
 
⸻
 
79. REGLAS POR UBICACIÓN
En futuras versiones:
Si estoy saliendo del colegio → comprobar mochila.
 
⸻
 
80. IA PARA CONFIGURAR REGLAS
El usuario podrá decir:
“Cada vez que tenga laboratorio de biología, acuérdate de la bata.”
La IA podrá convertirlo en una regla.
Pero:
mostrar → confirmar → guardar.
 
⸻
 
81. EXPLICABILIDAD
Cada automatización deberá poder explicar:
“He añadido la bata porque la actividad Biología tiene asociada la regla Laboratorio.”
Esto será importante para evitar comportamientos misteriosos.
 
⸻
 
82. IA PARA DETECTAR PATRONES
La IA podrá observar:
Normalmente llevas bata los jueves.
Podrá sugerir:
“¿Quieres asociar automáticamente la bata a los laboratorios?”
No lo hará automáticamente.
 
⸻
 
83. PREDICCIÓN
Posteriormente:
“Mañana probablemente necesitarás…”
Pero las predicciones deberán distinguirse de las obligaciones reales.
 
⸻
 
84. NIVELES DE CERTEZA
La aplicación podrá diferenciar:
Confirmado
Material configurado explícitamente.
Sugerido
Detectado por patrón.
Predicho
Inferido por IA.
Esto será muy importante.
 
⸻
 
85. MOCHILA MANUAL + AUTOMÁTICA
Las dos fuentes convivirán.
AUTOMÁTICO
☑ Libro
☑ Bata

MANUAL
☐ Auriculares
 
⸻
 
86. EVITAR SOBRESCRITURA
Si el usuario modifica manualmente algo:
La automatización no deberá volver a cambiarlo inmediatamente.
 
⸻
 
87. BLOQUEO MANUAL
Podrá existir:
No añadir automáticamente
Ejemplo:
No añadir tablet para Biología.
 
⸻
 
88. BLOQUEO TEMPORAL
También:
No añadir bata mañana.
Esto permitirá excepciones sin eliminar la regla permanente.
 
⸻
 
89. REGLA GLOBAL
El usuario podrá configurar:
“Nunca añadir auriculares automáticamente.”
 
⸻
 
90. PREPARACIÓN FÍSICA
En el futuro, cuando se marque:
☑ Libro
el sistema podría registrar:
Libro → mochila.
Esto prepara el camino para un sistema físico de inventario.
 
⸻
 
91. ESCÁNER FUTURO
La arquitectura deberá permitir posteriormente:
* cámara;
* código de barras;
* QR;
* reconocimiento visual.
Así se podría registrar material rápidamente.
 
⸻
 
92. FOTO DEL MATERIAL
El usuario podrá asociar una imagen:
Bata
📷 foto.
Esto ayudará a identificar objetos.
 
⸻
 
93. RECONOCIMIENTO VISUAL FUTURO
La IA podría llegar a detectar:
“Esta parece ser tu bata.”
Pero no se deberá considerar fiable sin confirmación.
 
⸻
 
94. MATERIAL DIGITAL
No todo tiene que ser físico.
Ejemplo:
PDF de Biología
Podrá marcarse como:
Digital
 
⸻
 
95. DISPOSITIVOS
Ejemplo:
💻 Portátil
📱 iPad
🎧 Auriculares
El sistema podrá saber que son objetos necesarios para determinadas actividades.
 
⸻
 
96. CARGADORES
Podrán existir relaciones:
iPad → cargador USB-C
Si se lleva el iPad a una actividad, el sistema podrá sugerir su cargador.
 
⸻
 
97. DEPENDENCIAS
Esto permite:
iPad
↓
Cargador
↓
Cable
No necesariamente habrá que añadirlos uno por uno.
 
⸻
 
98. KIT
Podrá existir un concepto:
Kit
Ejemplo:
Kit de laboratorio
* bata;
* gafas;
* guantes.
Al añadir el kit:
se añaden sus componentes.
 
⸻
 
99. KIT DEPORTIVO
Ejemplo:
Kit fútbol
* botas;
* espinilleras;
* camiseta;
* pantalón.
 
⸻
 
100. KIT PERSONALIZADO
El usuario podrá crear:
Kit examen
o:
Kit viaje.
 
⸻
 
101. PREPARACIÓN POR KITS
Esto hará la preparación mucho más rápida.
“Añadir Kit de entrenamiento.”
y listo.
 
⸻
 
102. HISTORIAL DE PREPARACIÓN
El sistema podrá guardar:
22 agosto
Mochila preparada 21:34

23 agosto
Mochila preparada 20:58
Esto podrá utilizarse para estadísticas.
 
⸻
 
103. ESTADÍSTICAS
Posteriormente:
* porcentaje de días preparados;
* olvidos;
* materiales olvidados;
* preparación media.
 
⸻
 
104. DETECCIÓN DE OLVIDOS
Si el usuario suele olvidar:
calculadora
el sistema podrá sugerir:
“¿Quieres marcar la calculadora como material crítico?”
 
⸻
 
105. SIN CASTIGO
No se utilizará el sistema para penalizar.
Será una herramienta de ayuda.
 
⸻
 
106. RACHAS FUTURAS
La mochila podrá conectarse posteriormente con el sistema de rachas.
Ejemplo:
🎒 7 días preparando la mochila.
Pero será opcional y no deberá convertir una función práctica en una obligación.
 
⸻
 
107. GAMIFICACIÓN OPCIONAL
Podrán existir:
* rachas;
* puntos;
* insignias.
Solo si el usuario lo activa.
 
⸻
 
108. DISEÑO VISUAL
La mochila deberá tener una interfaz muy rápida.
Ejemplo:
┌──────────────────────────┐
│ 🎒 MOCHILA               │
│ Martes · 5 elementos     │
├──────────────────────────┤
│                          │
│ ☑ 📘 Libro               │
│ ☑ 📓 Libreta             │
│ ☐ 🥼 Bata                │
│ ☐ 📐 Calculadora         │
│ ☐ 💻 iPad                │
│                          │
├──────────────────────────┤
│ 2 pendientes             │
│                          │
│ [ PREPARAR TODO ]        │
└──────────────────────────┘
 
⸻
 
109. INDICADORES
La interfaz podrá mostrar:
🟢 Lista 🟡 Casi lista 🔴 Falta material obligatorio
 
⸻
 
110. GESTOS MÓVILES
Deberá ser rápido:
* deslizar para completar;
* mantener pulsado para editar;
* tocar para detalles.
 
⸻
 
111. WIDGET FUTURO
La arquitectura deberá quedar preparada para un widget móvil:
🎒 Mochila de hoy
Sin abrir toda la aplicación.
 
⸻
 
112. LOCK SCREEN FUTURO
También podrá quedar preparado para mostrar:
🎒 2 cosas pendientes.
dependiendo de las capacidades del sistema operativo.
 
⸻
 
113. CLOUD
La información deberá sincronizarse:
* materiales;
* mochilas;
* reglas;
* preparación;
* inventario;
* kits.
 
⸻
 
114. OFFLINE
La mochila debe funcionar perfectamente sin Internet.
Marcar:
☑ Bata
debe funcionar localmente.
Después se sincroniza.
 
⸻
 
115. SEGURIDAD
Los materiales, inventario y mochilas pertenecerán al usuario autenticado.
Las reglas de Cloud deberán impedir acceso cruzado.
 
⸻
 
116. RENDIMIENTO
No se deberá recalcular todo el inventario cada vez que se abre HOY.
Se podrá generar una preparación para una fecha y actualizarla cuando cambien sus dependencias.
 
⸻
 
117. MOTOR DE CÁLCULO
Conceptualmente:
Fecha
↓
Eventos del día
↓
Actividades
↓
Materiales
↓
Reglas
↓
Excepciones
↓
Inventario
↓
Disponibilidad
↓
MOCHILA FINAL
 
⸻
 
118. EJEMPLO REAL COMPLETO
Mañana:
08:00 Matemáticas
Material:
* calculadora.
10:00 Biología
Material:
* libro;
* libreta;
* bata.
18:00 Calistenia
Material:
* botella;
* toalla.
El sistema genera:
🎒 MOCHILA DE MAÑANA

COLEGIO

☐ 📐 Calculadora
☐ 📘 Libro Biología
☐ 📓 Libreta
☐ 🥼 Bata

ENTRENAMIENTO

☐ 💧 Botella
☐ 🧻 Toalla

━━━━━━━━━━━━

0/6 preparados
El usuario pulsa:
Preparar todo
y después comprueba:
☑ Calculadora
☑ Libro
☑ Libreta
☑ Bata
☑ Botella
☑ Toalla

🎒 MOCHILA LISTA
 
⸻
 
119. EJEMPLO CON EXCEPCIÓN
Supongamos que:
Biología se cancela mañana.
La aplicación recalcula:
ANTES
☐ Libro Biología
☐ Libreta
☐ Bata

DESPUÉS
❌ Biología cancelada

Libro → eliminado de automático
Libreta → eliminada de automático
Bata → eliminada de automático
Pero si el usuario había añadido manualmente:
☐ Bata
esa permanecerá.
 
⸻
 
120. EJEMPLO CON MATERIAL NO DISPONIBLE
Mañana necesitas:
Calculadora
pero está marcada:
Prestada
La aplicación mostrará:
⚠️ CALCULADORA

Necesaria mañana.

Estado:
PRESTADA

[Marcar como disponible]
[Buscar alternativa]
 
⸻
 
121. EJEMPLO CON EXAMEN
Mañana:
Examen de Matemáticas
Configurado:
* calculadora;
* regla;
* DNI.
La mochila genera:
🔴 EXAMEN

☐ Calculadora
☐ Regla
☐ DNI
 
⸻
 
122. EJEMPLO CON IA
Usuario:
“¿Qué tengo que llevar mañana?”
Sistema:
Mañana tienes Matemáticas, Biología y Calistenia.
Para el colegio necesitas calculadora, libro y libreta de Biología y bata.
Para Calistenia: botella y toalla.
La calculadora aparece como prestada. ⚠️
Esto es exactamente el tipo de respuesta contextual que buscamos.
 
⸻
 
123. CRITERIOS DE ACEPTACIÓN DE LA FASE 7
La fase estará completa cuando exista:
* entidad mochila;
* múltiples mochilas;
* materiales;
* inventario;
* categorías;
* cantidades;
* materiales obligatorios;
* materiales opcionales;
* materiales temporales;
* materiales por fecha;
* materiales por actividad;
* materiales por evento;
* materiales por examen;
* materiales deportivos;
* kits;
* dependencias;
* disponibilidad;
* material prestado;
* material perdido;
* ubicación física;
* mochila base;
* preparación diaria;
* preparación semanal;
* progreso;
* estados;
* elementos manuales;
* elementos automáticos;
* excepciones;
* reglas;
* bloqueos;
* historial;
* integración con HOY;
* integración con calendario;
* integración con tareas;
* integración con economía;
* integración con entrenamiento;
* integración con IA;
* funcionamiento offline;
* sincronización Cloud;
* seguridad por usuario.
 
⸻
 
124. SIGUIENTE FASE
FASE 8 — REGLAS + AUTOMATIZACIONES + MOTOR INTELIGENTE
Aquí daremos un salto importante.
Hasta ahora hemos definido qué información existe.
En la Fase 8 definiremos:
qué puede hacer automáticamente el sistema con esa información.
Crearemos un auténtico motor de reglas:
SI ocurre X
+
SI se cumple Y
↓
HACER Z
Ejemplos:
Si mañana tengo laboratorio → añadir bata.
Si tengo examen en 3 días → sugerir sesiones de estudio.
Si se cancela una clase → recalcular mochila.
Si una tarea vence mañana → elevar prioridad.
Si son las 21:00 y mañana hay colegio → mostrar preparación de mochila.
Si tengo entrenamiento a las 18:00 → preparar recordatorio.
Y lo importante:
las automatizaciones serán configurables, explicables, reversibles y preparadas para Cloud + IA.
 
⸻
 
PROGRESO
FASES COMPLETADAS: 1–7
PROGRESO REAL: 58 % / 100 %
La parte más visible del sistema ya está prácticamente definida. Las siguientes fases serán las que harán que HORARIO TOP deje de ser una agenda avanzada y empiece a comportarse como un asistente personal temporal inteligente.

HORARIO TOP
FASE 6 — CALENDARIO + AGENDA + SISTEMA «HOY»
OBJETIVO
Esta fase convierte todo lo construido hasta ahora en una experiencia diaria unificada.
La idea central es:
El usuario no debería tener que pensar en qué módulo tiene que entrar. Abre “HOY” y el sistema le enseña todo lo relevante de ese día.
HORARIO TOP será la fuente temporal y, a partir de ella, se conectarán:
* horario;
* calendario;
* agenda;
* tareas;
* exámenes;
* eventos;
* entrenamientos;
* hábitos;
* objetivos;
* recordatorios;
* mochila;
* prioridades;
* información contextual.
 
⸻
 
1. EL CENTRO: «HOY»
Se creará una vista principal:
HOY
Ejemplo:
SÁBADO · 22 AGOSTO

Buenos días, Josué 👋

━━━━━━━━━━━━━━━━

AHORA
18:00 · Calistenia
⏱ 60 min

━━━━━━━━━━━━━━━━

SIGUIENTE
20:00 · Estudio
📚 Biología

━━━━━━━━━━━━━━━━

PENDIENTE
□ Terminar tarea
□ Preparar mochila

━━━━━━━━━━━━━━━━

MAÑANA
📚 Biología
🎒 3 materiales
La información será dinámica.
No será una página estática.
 
⸻
 
2. LÍNEA TEMPORAL DEL DÍA
HOY tendrá una línea temporal.
Ejemplo:
08:00 ─ Matemáticas
09:00 ─ Inglés
10:00 ─────────
11:00 ─ Biología
12:00 ─ Descanso
13:00 ─ Física
14:00 ─────────
18:00 ─ Calistenia
La hora actual tendrá un indicador visual.
 
⸻
 
3. BLOQUE ACTUAL
Si en este momento existe una actividad:
AHORA
🧬 Biología
10:00–11:00
Aula 2.14
se destacará automáticamente.
 
⸻
 
4. PRÓXIMO BLOQUE
Debajo aparecerá:
Siguiente
para que el usuario sepa inmediatamente qué viene después.
 
⸻
 
5. TIEMPO RESTANTE
Cuando sea relevante:
Biología termina en 23 min.
o:
Calistenia empieza en 42 min.
El contador deberá actualizarse automáticamente sin recargar la página.
 
⸻
 
6. ESTADO DEL DÍA
HOY podrá generar un pequeño resumen:
Hoy

6 actividades
2 tareas
1 entrenamiento
1 evento
3 prioridades
Esto dará una visión instantánea de la carga.
 
⸻
 
7. AGENDA DEL DÍA
Además de la cuadrícula, existirá una vista tipo agenda.
08:00
Matemáticas

09:00
Inglés

10:00
Descanso

11:00
Biología

18:00
Calistenia
El usuario podrá cambiar entre:
* cuadrícula;
* agenda;
* timeline.
 
⸻
 
8. VISTA DIARIA
Permitirá centrarse únicamente en un día.
Contendrá:
* horario;
* eventos;
* tareas;
* entrenamientos;
* recordatorios.
 
⸻
 
9. VISTA SEMANAL
Mostrará los siete días.
Será la vista principal de planificación.
 
⸻
 
10. VISTA MENSUAL
Permitirá observar:
* exámenes;
* eventos;
* fechas importantes;
* entregas;
* objetivos;
* actividades relevantes.
No se intentará meter todo el horario dentro de cada día mensual.
La vista mensual estará orientada a fechas y planificación.
 
⸻
 
11. VISTA ANUAL
Podrá existir una vista anual simplificada.
Especialmente útil para:
* cursos;
* vacaciones;
* periodos;
* objetivos;
* exámenes;
* eventos importantes.
 
⸻
 
12. NAVEGACIÓN TEMPORAL
El usuario podrá:
← Día anterior
HOY
Día siguiente →
También:
Semana anterior / siguiente
y:
Mes anterior / siguiente
 
⸻
 
13. BOTÓN «VOLVER A HOY»
Cuando el usuario navegue a otra fecha:
Volver a HOY
deberá estar siempre fácilmente accesible.
 
⸻
 
14. SELECCIÓN DE FECHA
Se podrá abrir un selector de fecha.
El usuario podrá saltar directamente a:
22 septiembre
sin navegar día por día.
 
⸻
 
15. CALENDARIO COMO CAPA
El calendario no sustituirá al horario.
Será otra capa temporal.
Conceptualmente:
HORARIO
   +
EVENTOS
   +
TAREAS
   +
EXÁMENES
   +
ENTRENAMIENTOS
   +
HÁBITOS
   ↓
CALENDARIO
   ↓
HOY
 
⸻
 
16. DIFERENCIA ENTRE HORARIO Y EVENTO
Esto será fundamental.
Horario
Representa algo recurrente.
Ejemplo:
Matemáticas todos los lunes a las 08:00.
Evento
Representa algo concreto.
Ejemplo:
Examen de Matemáticas el 15 de septiembre.
No deberán confundirse.
 
⸻
 
17. TAREAS
Las tareas tendrán fecha opcional.
Ejemplo:
Hacer ejercicios de Biología
Fecha límite:
25 agosto
En HOY aparecerá cuando corresponda.
 
⸻
 
18. FECHA DE INICIO Y FECHA LÍMITE
Una tarea podrá tener:
* fecha de creación;
* fecha de inicio;
* fecha límite;
* fecha de finalización.
Esto permitirá tareas que duren varios días.
 
⸻
 
19. TAREAS PROGRAMADAS
No todas las tareas aparecerán únicamente el día de entrega.
Ejemplo:
Examen el viernes.
El sistema podrá sugerir:
Martes → estudiar tema 1
Miércoles → estudiar tema 2
Jueves → repaso
Esto será especialmente importante para la futura IA.
 
⸻
 
20. EXÁMENES
Los exámenes tendrán entidad propia.
Podrán incluir:
* asignatura;
* fecha;
* hora;
* aula;
* contenido;
* prioridad;
* preparación;
* archivos.
 
⸻
 
21. CUENTA ATRÁS
HOY podrá mostrar:
🧬 Examen de Biología En 4 días
Y cuando se acerque:
⚠️ Examen de Biología Mañana
 
⸻
 
22. EVENTOS
Los eventos podrán representar:
* citas;
* excursiones;
* cumpleaños;
* reuniones;
* viajes;
* actividades;
* acontecimientos personales.
 
⸻
 
23. EVENTOS DE TODO EL DÍA
Ejemplo:
Cumpleaños
sin hora concreta.
Se mostrará como:
📅 Cumpleaños de mamá
en la parte superior del día.
 
⸻
 
24. RECURRENCIA
Los eventos podrán repetirse.
Ejemplos:
* diariamente;
* semanalmente;
* mensualmente;
* anualmente;
* días concretos;
* patrón personalizado.
 
⸻
 
25. EXCEPCIONES
Una recurrencia podrá tener excepciones.
Ejemplo:
Matemáticas todos los lunes.
Pero:
El lunes 12 no hay clase.
El sistema deberá poder representar esa excepción sin destruir la recurrencia original.
 
⸻
 
26. CANCELACIONES
Un bloque podrá marcarse:
Cancelado
sin eliminarlo.
Ejemplo:
10:00
❌ Biología
Clase cancelada
Esto será importante para mantener el historial.
 
⸻
 
27. CAMBIOS TEMPORALES
También podrá ocurrir:
Esta semana Matemáticas pasa del lunes al martes.
El sistema deberá permitir un cambio puntual.
La recurrencia original continuará intacta.
 
⸻
 
28. SUSTITUCIONES
En un horario escolar:
Matemáticas
podrá ser sustituida temporalmente por:
Física
Solo ese día.
 
⸻
 
29. REPROGRAMACIÓN
El usuario podrá mover un evento mediante:
* arrastrar;
* editar;
* cambiar hora;
* cambiar fecha.
En móvil deberá existir una alternativa sencilla al drag & drop.
 
⸻
 
30. ARRASTRAR BLOQUES
En dispositivos compatibles:
Mantener pulsado → mover.
Al mover:
Lunes 10:00
↓
Martes 11:00
el sistema deberá mostrar una previsualización.
 
⸻
 
31. CONFIRMACIÓN DE CAMBIOS
Para cambios importantes:
¿Mover solo este evento o toda la serie?
Opciones:
* solo este;
* este y siguientes;
* toda la serie.
 
⸻
 
32. HOY + TAREAS
HOY tendrá una sección:
PENDIENTE
Mostrará tareas relevantes.
Orden:
1. vencidas;
2. para hoy;
3. próximas;
4. baja prioridad.
 
⸻
 
33. TAREAS VENCIDAS
Si una tarea no se terminó:
🔴 Vencida hace 2 días
No desaparecerá.
El usuario podrá:
* completar;
* reprogramar;
* eliminar.
 
⸻
 
34. REPROGRAMACIÓN RÁPIDA
Desde HOY:
Reprogramar → Mañana
o:
Este fin de semana
o:
Elegir fecha
Esto deberá requerir pocos toques.
 
⸻
 
35. COMPLETAR DESDE HOY
El usuario podrá marcar:
☑ tarea completada
sin abrir el módulo de productividad.
 
⸻
 
36. PRIORIDADES
HOY podrá destacar:
🔴 Alta 🟡 Media ⚪ Normal
La prioridad podrá provenir de:
* tarea;
* evento;
* objetivo;
* recordatorio.
 
⸻
 
37. PUNTUACIÓN DEL DÍA
El Sistema Personal podrá calcular posteriormente un indicador:
Día: 82/100
basándose en elementos como:
* tareas;
* hábitos;
* objetivos;
* entrenamiento;
* descanso;
* planificación.
No deberá convertirse en una obligación ni penalizar al usuario injustamente.
 
⸻
 
38. CARGA DEL DÍA
El sistema podrá detectar:
Carga baja
Carga normal
Carga alta
Ejemplo:
⚠️ Mañana tienes 8 actividades y 4 tareas pendientes.
Esto será muy útil para la IA.
 
⸻
 
39. DETECCIÓN DE CONFLICTOS
Se deberán detectar:
* dos eventos simultáneos;
* entrenamiento durante una clase;
* tarea imposible de completar;
* eventos superpuestos.
Ejemplo:
18:00
Calistenia

18:00
Examen
→ Conflicto detectado.
 
⸻
 
40. CONFLICTOS INTELIGENTES
No todos los solapamientos son errores.
Ejemplo:
Un evento de todo el día puede coincidir con cualquier actividad.
Por tanto, el sistema deberá distinguir:
* conflicto real;
* solapamiento permitido;
* información no conflictiva.
 
⸻
 
41. MOCHILA
Aquí empieza una de las conexiones más importantes.
Si mañana hay:
Biología
y Biología requiere:
* libro;
* libreta;
* bata;
HOY podrá mostrar:
🎒 MOCHILA DE MAÑANA
☐ Libro ☐ Libreta ☐ Bata
 
⸻
 
42. MOCHILA AUTOMÁTICA
El usuario no tendrá que crear manualmente la mochila cada día.
El sistema podrá generar una lista basada en:
Horario + actividad + materiales + excepciones
 
⸻
 
43. MOCHILA POR DÍA
Ejemplo:
Lunes
🎒 Matemáticas 📘 Libro 📐 Calculadora
Martes
🎒 Biología 📕 Libro 🥼 Bata
 
⸻
 
44. MOCHILA MANUAL
El usuario podrá añadir:
+ Añadir a mochila
Ejemplo:
☐ Botella de agua ☐ Cargador ☐ Auriculares
 
⸻
 
45. ELEMENTOS TEMPORALES
Podrá marcar:
“Llevar esto solo mañana.”
Esto no modificará la configuración permanente de la asignatura.
 
⸻
 
46. MOCHILA INTELIGENTE
El sistema podrá recordar:
“Normalmente llevas bata los días de laboratorio.”
Pero las sugerencias no deberán ejecutarse sin permiso.
 
⸻
 
47. RECORDATORIOS
Los recordatorios podrán estar asociados a:
* hora;
* actividad;
* evento;
* tarea;
* ubicación;
* fecha.
 
⸻
 
48. RECORDATORIOS CONTEXTUALES
Ejemplo:
15 minutos antes de Biología:
🎒 ¿Has preparado la mochila?
Esto podrá activarse como preferencia.
 
⸻
 
49. RECORDATORIOS DE SALIDA
Posteriormente:
“Sal de casa a las 17:30 para llegar a entrenamiento.”
Para esto se podrán utilizar:
* duración del trayecto;
* ubicación;
* hora de inicio.
 
⸻
 
50. UBICACIÓN
Si una actividad tiene ubicación:
Polideportivo
HOY podrá mostrarla.
En fases posteriores se podrá integrar navegación.
 
⸻
 
51. TIEMPO DE DESPLAZAMIENTO
El sistema podrá guardar un tiempo estimado:
Casa → colegio: 20 min
y utilizarlo para recordatorios inteligentes.
 
⸻
 
52. ZONAS
Se podrán definir lugares frecuentes:
* casa;
* colegio;
* gimnasio;
* trabajo.
Esto permitirá contextualizar eventos.
 
⸻
 
53. HÁBITOS
Los hábitos podrán aparecer en HOY.
Ejemplo:
HÁBITOS
☑ Beber agua ☐ Leer ☑ Entrenar
No se mezclará visualmente con las clases.
 
⸻
 
54. OBJETIVOS
También:
OBJETIVOS
Preparar examen de Biología
Progreso:
65 %
 
⸻
 
55. RELACIÓN OBJETIVO → TAREA
Un objetivo podrá contener tareas.
Ejemplo:
OBJETIVO
Preparar examen

↓
Tema 1
Tema 2
Tema 3
Repaso
HOY mostrará solamente lo relevante.
 
⸻
 
56. ENTRENAMIENTO
Si existe:
Calistenia — 18:00
HOY podrá mostrar:
* duración;
* tipo;
* objetivo;
* sesión.
 
⸻
 
57. CONTEXTO DEL ENTRENAMIENTO
Ejemplo:
18:00
CALISTENIA

Sesión:
Pecho + habilidades

Objetivo:
Planche

Duración:
45 min
El usuario podrá entrar directamente a la sesión.
 
⸻
 
58. ESTUDIO
Si existe:
Estudio Biología — 19:30
HOY podrá mostrar:
* materia;
* objetivo;
* duración;
* tarea asociada.
 
⸻
 
59. AUTOMATIZACIÓN DEL ESTUDIO
En fases posteriores la IA podrá utilizar:
* fecha de examen;
* contenido;
* tiempo disponible;
* carga del horario;
para proponer un plan.
 
⸻
 
60. RESUMEN INTELIGENTE
HOY podrá tener una sección:
RESUMEN
Hoy tienes una jornada bastante cargada. Tienes 5 clases, entrenamiento a las 18:00 y dos tareas pendientes.
La IA no deberá inventar información.
Todo resumen deberá basarse en los datos reales disponibles.
 
⸻
 
61. IA PROACTIVA
La IA podrá detectar situaciones.
Ejemplo:
“Mañana tienes examen de Biología y todavía tienes 3 tareas pendientes relacionadas.”
Podrá sugerir:
Crear plan de estudio
 
⸻
 
62. APROBACIÓN
La IA deberá separar:
Información
“Tienes examen el viernes.”
de:
Acción
“He creado un plan de estudio.”
La segunda requerirá autorización cuando implique modificar datos.
 
⸻
 
63. PREGUNTAS RÁPIDAS
Desde HOY podrá existir un botón de IA:
Preguntar
Ejemplos:
¿Qué tengo mañana?
¿Qué necesito para clase?
¿Cuándo tengo Biología?
¿Cuánto tiempo tengo libre hoy?
¿Tengo algo importante esta semana?
 
⸻
 
64. RESPUESTA CONTEXTUAL
Si preguntas:
“¿Qué tengo que llevar mañana?”
La IA deberá consultar:
1. fecha actual;
2. horario de mañana;
3. actividades;
4. materiales;
5. excepciones;
6. mochila ya preparada.
No deberá responder únicamente basándose en texto generado.
 
⸻
 
65. TIEMPO LIBRE
HOY podrá identificar huecos.
Ejemplo:
10:00–11:00 Clase
11:00–12:30 LIBRE
12:30–13:30 Clase
Y mostrar:
1 h 30 min libres
 
⸻
 
66. USO DEL TIEMPO LIBRE
Posteriormente podrá sugerir:
* estudiar;
* descansar;
* completar tareas;
* entrenar.
Pero siempre como sugerencia.
 
⸻
 
67. PLANIFICACIÓN RÁPIDA
Desde un hueco libre:
+ Planificar
y elegir:
* tarea;
* estudio;
* entrenamiento;
* evento;
* descanso.
 
⸻
 
68. BLOQUES DE DESCANSO
El descanso será una actividad válida.
Ejemplo:
12:00–12:30 Descanso
No deberá considerarse automáticamente como tiempo perdido.
 
⸻
 
69. DÍA SIN ACTIVIDADES
Si no hay nada:
HOY

No tienes actividades programadas.

🎯 ¿Quieres planificar tu día?
La pantalla no deberá parecer rota o vacía.
 
⸻
 
70. FIN DE SEMANA
El sistema deberá reconocer que determinados horarios pueden no aplicar.
No deberá mostrar:
“Clase pendiente”
si el horario escolar está configurado únicamente de lunes a viernes.
 
⸻
 
71. VACACIONES
Podrán definirse periodos:
Vacaciones
Durante ellos se podrán ocultar determinadas recurrencias.
Ejemplo:
Horario escolar suspendido durante vacaciones.
 
⸻
 
72. FESTIVOS
El sistema deberá poder soportar días no lectivos.
Una fecha marcada como:
No lectivo
podrá modificar la presentación del horario.
 
⸻
 
73. CALENDARIO ACADÉMICO
Posteriormente podrá existir:
* inicio de curso;
* fin de curso;
* vacaciones;
* festivos;
* evaluaciones.
Esto permitirá que el horario escolar sea mucho más inteligente.
 
⸻
 
74. EXCEPCIONES ACADÉMICAS
Ejemplos:
* día no lectivo;
* excursión;
* jornada reducida;
* examen;
* cambio de horario.
 
⸻
 
75. IMPORTACIÓN FUTURA
La arquitectura deberá poder recibir datos desde:
* CSV;
* Excel;
* calendarios;
* otros sistemas;
* IA.
 
⸻
 
76. SINCRONIZACIÓN CLOUD
Toda la información relevante deberá sincronizarse.
Ejemplo:
iPhone:
Crear evento
↓
Cloud
↓
iPad:
Evento aparece
La sincronización deberá manejar cambios y conflictos.
 
⸻
 
77. CONFLICTOS DE SINCRONIZACIÓN
Si dos dispositivos modifican el mismo elemento:
iPhone:
Biología 10:00

iPad:
Biología 11:00
el sistema deberá disponer de una estrategia.
No se deberá sobrescribir información silenciosamente.
 
⸻
 
78. OFFLINE
Si no hay Internet:
* HOY deberá seguir funcionando con datos locales;
* se podrán consultar horarios;
* se podrán marcar tareas;
* se podrán hacer cambios.
Cuando vuelva Internet:
Sincronización automática.
 
⸻
 
79. ESTADO DE SINCRONIZACIÓN
Se podrá mostrar discretamente:
☁️ Sincronizado
o:
⟳ Sincronizando
o:
⚠️ Pendiente de sincronización
Nunca deberá bloquear innecesariamente la experiencia.
 
⸻
 
80. NOTIFICACIONES
La arquitectura deberá quedar preparada para:
* recordatorios;
* eventos;
* tareas;
* exámenes;
* mochila;
* cambios de horario.
Las notificaciones se desarrollarán posteriormente.
 
⸻
 
81. NOTIFICACIONES INTELIGENTES
No se debe bombardear al usuario.
El sistema podrá agrupar:
“Tienes 3 cosas importantes hoy.”
en lugar de enviar tres avisos innecesarios.
 
⸻
 
82. PRIORIDAD DE NOTIFICACIONES
Alta:
Examen mañana
Media:
Tarea pendiente
Baja:
Evento dentro de una semana
 
⸻
 
83. CENTRO DE NOTIFICACIONES
Podrá existir un historial:
HOY
⚠️ Examen mañana

AYER
🎒 Preparar mochila

LUNES
📚 Tarea pendiente
 
⸻
 
84. PERSONALIZACIÓN
El usuario podrá elegir qué quiere recibir.
Ejemplo:
☑ Exámenes
☑ Tareas
☑ Mochila
☐ Hábitos
☑ Entrenamientos
 
⸻
 
85. VISTA «MAÑANA»
Desde HOY habrá acceso rápido a:
MAÑANA
Mostrará:
* horario;
* tareas;
* eventos;
* mochila;
* prioridades.
Esto será especialmente útil por la noche.
 
⸻
 
86. VISTA «ESTA SEMANA»
Permitirá ver rápidamente:
* clases;
* entrenamientos;
* exámenes;
* tareas;
* eventos.
 
⸻
 
87. RESUMEN SEMANAL
El sistema podrá generar:
Esta semana tienes 24 h de clases, 3 entrenamientos, 2 exámenes y 8 tareas.
Esto será útil para planificación.
 
⸻
 
88. RESUMEN DEL FIN DE SEMANA
La IA podrá analizar:
* tareas completadas;
* tareas pendientes;
* horas de estudio;
* entrenamientos;
* objetivos.
Pero deberá distinguir claramente entre:
datos registrados
y:
interpretaciones de IA.
 
⸻
 
89. DISEÑO MOBILE FIRST
HOY estará diseñado primero para móvil.
Elementos principales:
┌────────────────────────┐
│ HOY              🔍 ⚙ │
├────────────────────────┤
│ Fecha                  │
├────────────────────────┤
│ AHORA                  │
│ Biología               │
├────────────────────────┤
│ SIGUIENTE              │
│ Física                 │
├────────────────────────┤
│ TAREAS                 │
│ □ Ejercicios           │
├────────────────────────┤
│ 🎒 MOCHILA             │
│ □ Libro                │
├────────────────────────┤
│ OBJETIVOS              │
│ ███████░░ 70%          │
└────────────────────────┘
 
⸻
 
90. INFORMACIÓN PROGRESIVA
No se mostrará absolutamente todo al mismo tiempo.
El usuario verá primero:
1. ahora;
2. siguiente;
3. importantes;
4. pendientes.
Después podrá expandir.
Esto evita saturación.
 
⸻
 
91. TARJETAS EXPANDIBLES
Ejemplo:
Biología
cerrada:
🧬 Biología · 10:00
abierta:
Aula 2.14 Profesor X 📕 Libro 🥼 Bata 2 tareas
 
⸻
 
92. PERSONALIZAR HOY
El usuario podrá decidir qué secciones aparecen.
Ejemplo:
☑ Horario
☑ Tareas
☑ Mochila
☑ Entrenamiento
☑ Objetivos
☐ Hábitos
 
⸻
 
93. ORDEN PERSONALIZABLE
También podrá cambiar el orden:
1. Horario
2. Mochila
3. Tareas
4. Entrenamiento
5. Objetivos
 
⸻
 
94. MODO MÍNIMO
Una opción:
HOY — Minimal
mostrará solamente:
* ahora;
* siguiente;
* pendientes importantes.
Ideal para consultar rápidamente.
 
⸻
 
95. MODO COMPLETO
Mostrará:
* agenda;
* tareas;
* hábitos;
* objetivos;
* mochila;
* eventos;
* entrenamiento;
* estadísticas.
 
⸻
 
96. MODO ESTUDIO
Podrá priorizar:
* clases;
* tareas;
* exámenes;
* estudio;
* objetivos académicos.
 
⸻
 
97. MODO ENTRENAMIENTO
Podrá priorizar:
* entrenamiento;
* fútbol;
* calistenia;
* recuperación;
* objetivos deportivos.
La arquitectura permitirá distintos contextos sin crear varias aplicaciones.
 
⸻
 
98. SISTEMA DE CONTEXTO
La aplicación podrá determinar qué mostrar primero según:
* hora;
* día;
* ubicación;
* actividades;
* prioridades;
* preferencias.
Ejemplo:
A las 17:30:
Próximo entrenamiento a las 18:00.
A las 21:30:
Preparar mochila para mañana.
 
⸻
 
99. «BUENAS NOCHES»
Por la noche, HOY podrá cambiar su enfoque:
MAÑANA
🎒 Prepara:
* Libro de Biología
* Bata
* Libreta
📚 Primera clase: Matemáticas · 08:00
Esto será exactamente la base de la función de mochila que querías.
 
⸻
 
100. «BUENOS DÍAS»
Por la mañana:
Buenos días 👋
Hoy tienes 6 clases.
Primera: Matemáticas · 08:00
⚠️ Tienes un examen mañana.
La experiencia será contextual.
 
⸻
 
101. MOTOR DE CONTEXTO TEMPORAL
Se deberá crear un servicio central que pueda responder:
¿Qué está ocurriendo ahora?
¿Qué viene después?
¿Qué ocurrió antes?
¿Qué tengo hoy?
¿Qué tengo mañana?
¿Qué tengo esta semana?
¿Qué está pendiente?
¿Qué es importante?
Este motor será reutilizable por:
* HOY;
* IA;
* notificaciones;
* mochila;
* calendario;
* dashboard.
 
⸻
 
102. FUENTE ÚNICA DE VERDAD
HOY no almacenará una copia independiente de todo.
Consultará las entidades originales.
Ejemplo:
HORARIO ─────┐
TAREAS ──────┤
EVENTOS ─────┤
EXÁMENES ────┤
HÁBITOS ─────┼──→ MOTOR TEMPORAL → HOY
OBJETIVOS ───┤
ENTRENOS ────┤
MOCHILA ─────┘
Esto evita inconsistencias.
 
⸻
 
103. RENDIMIENTO
HOY será probablemente una de las pantallas más utilizadas.
Por ello deberá:
* cargar rápido;
* evitar consultas innecesarias;
* usar caché;
* actualizar solo lo necesario;
* mantener animaciones ligeras.
 
⸻
 
104. DATOS CLOUD
Las consultas deberán estar diseñadas para obtener únicamente la información relevante.
Ejemplo:
Para HOY no tiene sentido descargar todo el historial de tres años.
Se consultará:
fecha actual + margen necesario + relaciones relevantes.
 
⸻
 
105. SEGURIDAD
Cada consulta deberá estar limitada al usuario autenticado.
Especialmente:
* calendario;
* tareas;
* horarios;
* eventos;
* archivos;
* notas.
No se confiará únicamente en filtros del frontend.
 
⸻
 
106. AUDITORÍA
Las modificaciones importantes podrán registrar:
* quién;
* cuándo;
* qué cambió.
Esto será útil para sincronización y recuperación.
 
⸻
 
107. DESHACER
Desde HOY:
Completar tarea
podrá existir:
Deshacer
durante unos segundos.
Esto evitará errores accidentales.
 
⸻
 
108. ACCIONES RÁPIDAS
Desde HOY:
+
podrá permitir:
* tarea;
* evento;
* recordatorio;
* nota;
* actividad;
* entrenamiento.
El usuario no tendrá que navegar hasta cada módulo.
 
⸻
 
109. COMANDO RÁPIDO
En fases posteriores podrá existir entrada natural:
“Mañana a las 18 tengo entrenamiento.”
La IA interpretará:
* fecha;
* hora;
* actividad;
* duración si existe.
Y mostrará:
Crear evento → Confirmar.
 
⸻
 
110. INTELIGENCIA SIN AUTOMATISMOS PELIGROSOS
La IA podrá:
* interpretar;
* sugerir;
* organizar;
* detectar conflictos;
* resumir.
Pero las modificaciones importantes deberán requerir confirmación.
 
⸻
 
111. EJEMPLO COMPLETO
Supongamos que mañana es martes.
El horario contiene:
08:00 Matemáticas
09:00 Inglés
10:00 Biología
12:00 Física
18:00 Calistenia
Biología tiene:
* libro;
* libreta;
* bata.
Existe además:
Tarea de Física — entregar mañana
y:
Examen de Biología — viernes
HOY mostrará:
MARTES

08:00
📐 Matemáticas

09:00
🇬🇧 Inglés

10:00
🧬 Biología
Aula 2.14

12:00
⚛️ Física

────────────────

⚠️ IMPORTANTE
Tarea de Física vence hoy.

🎒 MOCHILA
☐ Libro Biología
☐ Libreta
☐ Bata

18:00
💪 Calistenia

────────────────

📚 PRÓXIMO
Examen Biología
En 3 días
Esto es exactamente el comportamiento que queremos conseguir.
 
⸻
 
112. CRITERIOS DE ACEPTACIÓN
La Fase 6 se considerará completa cuando:
* exista HOY;
* exista agenda diaria;
* exista vista semanal;
* exista vista mensual;
* exista navegación temporal;
* exista línea temporal;
* se detecte la actividad actual;
* se muestre la siguiente actividad;
* existan eventos;
* existan tareas;
* existan exámenes;
* exista recurrencia;
* existan excepciones;
* existan cancelaciones;
* puedan reprogramarse elementos;
* existan prioridades;
* se detecten conflictos;
* exista integración con mochila;
* exista integración con hábitos;
* exista integración con objetivos;
* exista integración con entrenamiento;
* exista contexto para IA;
* exista vista de mañana;
* exista resumen semanal;
* exista modo mínimo;
* exista modo completo;
* sea configurable;
* funcione offline;
* sincronice con Cloud;
* mantenga seguridad por usuario;
* tenga una fuente única de verdad;
* esté optimizada para móvil.
 
⸻
 
113. PREPARACIÓN PARA LA FASE 7
La siguiente fase será:
FASE 7 — MOCHILA INTELIGENTE + MATERIALES + PREPARACIÓN AUTOMÁTICA
Aquí vamos a desarrollar a fondo el sistema de mochila que acabamos de conectar con HOY.
No será simplemente una checklist.
La idea será que el sistema pueda saber:
Qué tienes mañana → qué actividades tienes → qué necesitas para esas actividades → qué ya has preparado → qué te falta.
Y además podrá diferenciar:
* material permanente;
* material temporal;
* material obligatorio;
* material opcional;
* material específico para una clase;
* material específico para un examen;
* material para entrenamiento;
* objetos personales.
La mochila podrá convertirse en un sistema predictivo de preparación, no solo en una lista.
 
⸻
 
PROGRESO DEL MÓDULO HORARIO TOP
Fase	Estado
1. Arquitectura general	✅
2. Datos + Cloud + Supabase	✅
3. Editor visual	✅
4. Configuración avanzada	✅
5. Actividades y contexto	✅
6. Calendario + Agenda + HOY	✅
7. Mochila inteligente	⏳
8. Reglas y automatizaciones	⏳
9. IA del horario	⏳
10. Notificaciones y contexto	⏳
11. Integraciones y sincronización avanzada	⏳
12. Optimización, seguridad y acabado final	⏳
PROGRESO REAL: 
50 % / 100 %
Ya hemos llegado al núcleo funcional de HORARIO TOP. A partir de la Fase 7 empezamos a construir las capas inteligentes que harán que el horario no sea simplemente una cuadrícula, sino una herramienta que trabaje por ti.

HORARIO TOP
FASE 5 — ASIGNATURAS, ACTIVIDADES, COLORES, ICONOS Y CONTEXTO
1. OBJETIVO DE LA FASE
Hasta ahora hemos construido la estructura del horario.
Ahora vamos a definir qué representa realmente cada bloque.
La idea es dejar de tratar una actividad como un simple texto.
Por ejemplo:
“Biología”
no será solamente una palabra dentro de una celda.
Será una entidad que pueda tener:
* identidad propia;
* color;
* icono;
* profesor;
* aula;
* descripción;
* materiales;
* tareas;
* exámenes;
* archivos;
* estadísticas;
* eventos;
* notas;
* relación con HOY;
* relación con mochila;
* relación con IA.
Esto permitirá que una misma actividad sea utilizada en todo el Sistema Personal sin tener que volver a crearla.
 
⸻
 
2. CONCEPTO DE ACTIVIDAD
El sistema utilizará una entidad genérica denominada:
Actividad
Una actividad puede ser:
* una asignatura;
* un entrenamiento;
* una sesión de estudio;
* trabajo;
* una reunión;
* una rutina;
* una actividad personal;
* cualquier elemento que el usuario quiera colocar en su horario.
La arquitectura no debe obligar a crear módulos completamente diferentes para cada caso.
 
⸻
 
3. ASIGNATURA COMO TIPO DE ACTIVIDAD
Una asignatura será simplemente una actividad especializada.
Ejemplo:
Actividad
└── Tipo: Asignatura
    └── Biología
Esto permitirá reutilizar el mismo motor.
 
⸻
 
4. IDENTIDAD DE LA ACTIVIDAD
Cada actividad tendrá:
* nombre;
* nombre corto;
* tipo;
* color;
* icono;
* descripción;
* estado;
* fecha de creación;
* fecha de modificación.
Ejemplo:
Biología
🧬
Ciencia
Activa
 
⸻
 
5. NOMBRE
El nombre será el elemento principal.
Ejemplos:
* Matemáticas.
* Biología.
* Inglés.
* Entrenamiento.
* Estudio.
* Trabajo.
Debe poder editarse posteriormente.
Si el usuario cambia:
Biología
por:
Biología y Geología
todos los lugares que utilizan esa entidad deberán poder reflejar el cambio.
No se deberán crear copias independientes.
 
⸻
 
6. NOMBRE CORTO
Se podrá definir un nombre corto.
Ejemplo:
Biología y Geología
Nombre corto:
BIO
Esto permitirá mostrar información compacta en móviles.
 
⸻
 
7. ALIAS
También se podrá añadir un alias.
Ejemplo:
Matemáticas
Alias:
* Mates.
* Matemática.
Esto podrá utilizarse para búsquedas y reconocimiento por IA.
 
⸻
 
8. TIPO
Cada actividad tendrá un tipo.
Ejemplos:
subject
training
study
work
meeting
personal
routine
other
El sistema deberá permitir ampliar esta lista posteriormente.
 
⸻
 
9. ICONO
Cada actividad podrá tener un icono.
Ejemplos:
* Matemáticas → calculadora.
* Biología → microscopio.
* Inglés → globo/libro.
* Entrenamiento → pesa.
* Estudio → libro.
* Trabajo → maletín.
El usuario podrá cambiarlo en cualquier momento.
 
⸻
 
10. ICONOS PERSONALIZADOS
Además de una biblioteca de iconos, se podrá preparar soporte futuro para:
* emojis;
* iconos personalizados;
* imágenes;
* avatares;
* símbolos.
Esto permitirá mayor personalización sin obligarlo desde el principio.
 
⸻
 
11. COLOR PRINCIPAL
Cada actividad tendrá un color principal.
Ejemplo:
Matemáticas → azul
Biología → verde
Inglés → amarillo
Física → morado
El color se utilizará en:
* horario;
* calendario;
* HOY;
* etiquetas;
* filtros;
* estadísticas.
 
⸻
 
12. PALETA PREDEFINIDA
La aplicación podrá ofrecer una paleta inicial.
Debe contener suficiente variedad para que un horario con muchas asignaturas siga siendo legible.
Los colores deberán estar preparados para:
* modo claro;
* modo oscuro;
* accesibilidad;
* contraste.
 
⸻
 
13. COLOR AUTOMÁTICO
Existirá una opción:
Asignar color automáticamente
El sistema elegirá un color disponible intentando evitar que dos actividades importantes tengan colores demasiado parecidos.
Esto acelerará la creación inicial.
 
⸻
 
14. COLOR PERSONALIZADO
El usuario avanzado podrá seleccionar un color personalizado.
El sistema deberá validar que el texto continúe siendo legible.
Si el usuario elige un color demasiado claro, la interfaz podrá adaptar automáticamente:
* color del texto;
* borde;
* contraste;
* fondo.
 
⸻
 
15. COLOR DEL BLOQUE VS ACTIVIDAD
La actividad tendrá un color global.
Pero un bloque concreto podrá tener un color alternativo.
Ejemplo:
Biología → verde
pero:
Examen de Biología → rojo
Esto permitirá diferenciar eventos especiales sin modificar la identidad global de la asignatura.
 
⸻
 
16. SISTEMA DE ESTADOS
Las actividades podrán tener estados.
Ejemplos:
* activa;
* archivada;
* temporal;
* completada;
* cancelada.
Una asignatura del curso actual será:
Activa
Una asignatura de un curso anterior:
Archivada
 
⸻
 
17. ARCHIVADO
Cuando termine un curso:
Biología 2025/26
podrá archivarse.
No se eliminará porque puede tener:
* tareas históricas;
* exámenes;
* notas;
* archivos;
* estadísticas.
 
⸻
 
18. REUTILIZACIÓN
Al crear un nuevo horario se podrá seleccionar:
Utilizar actividad existente
Ejemplo:
Horario 2026/27
↓
Seleccionar
Biología
↓
Reutilizar configuración
Esto evita volver a introducir toda la información.
 
⸻
 
19. PROFESOR
Las actividades escolares podrán tener información del profesor.
Campos:
* nombre;
* apellido;
* alias;
* contacto, si el usuario decide almacenarlo;
* notas privadas.
Esta información deberá tratarse como opcional.
 
⸻
 
20. PROFESOR COMO ENTIDAD FUTURA
Para evitar duplicaciones futuras, la arquitectura podrá evolucionar hacia:
PROFESOR
↓
ASIGNATURA
↓
HORARIO
Así el mismo profesor podría aparecer en varias asignaturas o grupos si fuera necesario.
 
⸻
 
21. AULA
Una actividad podrá tener:
* aula;
* edificio;
* planta;
* ubicación.
Ejemplo:
Aula 2.14
o:
Laboratorio de Biología
 
⸻
 
22. UBICACIÓN COMO ENTIDAD
En una futura ampliación se podrá tener:
UBICACIÓN
├── Nombre
├── Dirección
├── Edificio
├── Planta
└── Notas
Esto permitiría utilizar la misma ubicación en:
* clases;
* entrenamientos;
* reuniones;
* eventos.
 
⸻
 
23. DESCRIPCIÓN
Cada actividad podrá tener una descripción opcional.
Ejemplo:
Biología
Laboratorio y teoría.
No deberá aparecer siempre en la cuadrícula.
Solo cuando el usuario consulte los detalles.
 
⸻
 
24. ETIQUETAS
Se podrán añadir etiquetas.
Ejemplos:
* importante;
* laboratorio;
* examen;
* práctico;
* online;
* presencial;
* grupo;
* recuperación.
Las etiquetas podrán utilizarse después para:
* filtros;
* búsquedas;
* IA;
* automatizaciones.
 
⸻
 
25. FAVORITOS
El usuario podrá marcar actividades como favoritas.
Las favoritas aparecerán primero al crear nuevos bloques.
Esto hará que la creación de horarios sea más rápida.
 
⸻
 
26. ACTIVIDADES RECIENTES
El sistema podrá recordar las actividades utilizadas recientemente.
Ejemplo:
Recientes
* Matemáticas.
* Biología.
* Inglés.
* Física.
Así, añadir una actividad requerirá un solo toque.
 
⸻
 
27. BUSCADOR DE ACTIVIDADES
Al crear un bloque:
Seleccionar actividad
aparecerá un buscador.
El usuario podrá escribir:
bio
y obtener:
Biología
La búsqueda podrá considerar:
* nombre;
* nombre corto;
* alias;
* etiquetas.
 
⸻
 
28. CREACIÓN DESDE EL HORARIO
Si el usuario escribe una actividad que no existe:
+ Crear Biología
se podrá crear directamente sin abandonar el editor.
Esto será fundamental para mantener la experiencia rápida.
 
⸻
 
29. PANEL DE DETALLES
Al tocar una actividad aparecerá un panel con información.
Ejemplo:
🧬 BIOLOGÍA

Lunes · 10:00
Martes · 12:00
Jueves · 09:00

Profesor:
...

Aula:
...

Material:
...

Tareas:
3 pendientes

Exámenes:
1 próximo
El panel será una puerta de entrada al resto de la información relacionada.
 
⸻
 
30. ACTIVIDAD COMO CENTRO DE INFORMACIÓN
La actividad será un nodo central.
Ejemplo:
                BIOLOGÍA
                    │
       ┌────────────┼────────────┐
       ↓            ↓            ↓
   HORARIO       TAREAS       EXÁMENES
       │            │            │
       ↓            ↓            ↓
    MOCHILA      ESTUDIOS      NOTAS
                    │
                    ↓
                   IA
Esto es fundamental para que el Sistema Personal sea realmente integrado.
 
⸻
 
31. TAREAS ASOCIADAS
Una actividad podrá tener tareas.
Ejemplo:
Biología
* Estudiar tema 3.
* Hacer ejercicios.
* Entregar práctica.
Desde la actividad se podrán consultar.
 
⸻
 
32. EXÁMENES ASOCIADOS
También podrá tener exámenes.
Ejemplo:
Biología
📅 3 septiembre
Examen tema 1–3
Esto permitirá que HOY pueda mostrar automáticamente:
“Examen de Biología en 5 días.”
 
⸻
 
33. ARCHIVOS
Una actividad podrá tener archivos relacionados.
Ejemplo:
Biología
* Apuntes.pdf
* Tema 3.pdf
* Práctica.docx
La integración con almacenamiento Cloud se desarrollará en fases posteriores.
 
⸻
 
34. MATERIAL
La actividad podrá tener materiales necesarios.
Ejemplo:
Biología
* Libro.
* Libreta.
* Bata.
Esto alimentará posteriormente la mochila.
 
⸻
 
35. MOCHILA
Cuando mañana aparezca Biología en el horario:
Biología
↓
Material asociado
↓
Libro
Libreta
Bata
↓
MOCHILA
El usuario no tendrá que introducir esos elementos cada día.
 
⸻
 
36. REQUERIDO VS OPCIONAL
Cada material podrá marcarse como:
Obligatorio
o:
Opcional
Ejemplo:
Biología:
* Libro → obligatorio.
* Libreta → obligatorio.
* Bata → obligatoria.
* Tablet → opcional.
Esto permitirá que la mochila sea inteligente.
 
⸻
 
37. CANTIDAD
Algunos materiales pueden necesitar cantidades.
Ejemplo:
* 2 libretas.
* 3 documentos.
* 1 calculadora.
El sistema deberá permitir almacenar cantidad cuando sea necesario.
 
⸻
 
38. CONTEXTO TEMPORAL
La misma actividad puede tener diferentes requisitos dependiendo del día.
Ejemplo:
Biología normalmente:
* Libro.
* Libreta.
Laboratorio de Biología:
* Bata.
* Gafas.
El sistema deberá permitir asociar requisitos especiales a determinados bloques o eventos.
 
⸻
 
39. ACTIVIDADES ESPECIALES
No todo bloque tiene que ser una asignatura.
Ejemplo:
EXCURSIÓN
Puede tener:
* ubicación;
* hora;
* materiales;
* transporte;
* recordatorios;
* documentación.
La arquitectura deberá soportarlo.
 
⸻
 
40. ENTRENAMIENTOS
Un entrenamiento podrá utilizar el mismo sistema.
Ejemplo:
Calistenia
Tipo:
training
Información:
* lugar;
* duración;
* sesión;
* objetivo.
Esto permitirá conectar HORARIO TOP con el módulo de entrenamiento.
 
⸻
 
41. ESTUDIO
Una sesión de estudio:
Biología — estudiar tema 3
podrá ser una actividad o un evento relacionado con una asignatura.
Esto permitirá que el sistema distinga:
Clase de Biología
de:
Estudiar Biología
aunque ambas estén relacionadas con la misma asignatura.
 
⸻
 
42. ACTIVIDADES RECURRENTES
Una actividad podrá aparecer múltiples veces.
No se crearán entidades duplicadas.
Ejemplo:
Biología
 ├── Lunes 10:00
 ├── Miércoles 09:00
 └── Viernes 11:00
Todos los bloques apuntan a la misma actividad.
 
⸻
 
43. CAMBIO GLOBAL
Si el usuario modifica:
Biología → color verde oscuro
el sistema podrá actualizar automáticamente:
* bloques;
* calendario;
* HOY;
* filtros.
Esto será posible porque todos utilizan la misma entidad.
 
⸻
 
44. CAMBIO LOCAL
Si únicamente se quiere cambiar un bloque:
Biología — examen
podrá utilizar un override.
Así no se modifica toda la asignatura.
 
⸻
 
45. ESTADÍSTICAS FUTURAS
La estructura permitirá calcular posteriormente:
* número de clases;
* tiempo semanal;
* tiempo mensual;
* frecuencia;
* distribución por materias;
* horas de estudio;
* horas de entrenamiento.
Ejemplo:
Esta semana tienes 4 h de Biología.
 
⸻
 
46. TIEMPO SEMANAL
El sistema podrá calcular automáticamente:
Matemáticas → 3 h
Biología → 4 h
Inglés → 3 h
Física → 2 h
Esto se podrá utilizar en análisis de carga.
 
⸻
 
47. DETECCIÓN DE CARGA
Posteriormente la IA podrá detectar:
“El jueves tienes demasiadas actividades concentradas.”
La información estará disponible gracias a la estructura de bloques.
 
⸻
 
48. PRIORIDADES
Las actividades podrán tener una prioridad base.
Ejemplo:
* normal;
* importante;
* alta.
Pero la prioridad de un evento concreto podrá ser diferente.
 
⸻
 
49. ESTADO DE ACTIVIDAD
Una actividad podrá tener:
active
archived
hidden
Oculta significa que no se muestra en determinadas vistas, pero no se elimina.
 
⸻
 
50. VISIBILIDAD
Podrá configurarse:
Mostrar en horario
Mostrar en HOY
Mostrar en calendario
Mostrar en mochila
Esto permitirá controlar cómo se utiliza la información.
 
⸻
 
51. REGLAS DE VISIBILIDAD
Ejemplo:
Una actividad:
Trabajo personal
puede aparecer en:
* HOY;
* calendario;
pero no necesariamente en:
* horario escolar.
El mismo sistema podrá manejar ambos casos.
 
⸻
 
52. NOTAS PRIVADAS
Una actividad podrá tener notas privadas.
Ejemplo:
Profesor de Matemáticas
→ “Recordar preguntar por recuperación.”
Estas notas no tendrán que aparecer en HOY.
 
⸻
 
53. CONTEXTO PARA IA
La IA podrá consultar la ficha completa de una actividad cuando sea necesario.
Ejemplo:
BIOLOGÍA

Horario:
L-X-V

Profesor:
...

Aula:
...

Material:
Libro + libreta + bata

Tareas:
2 pendientes

Examen:
3 septiembre
Esto permitirá respuestas mucho más útiles.
 
⸻
 
54. IA COMO ASISTENTE DEL HORARIO
Posteriormente el usuario podrá preguntar:
“¿Qué necesito para Biología mañana?”
La IA podrá consultar:
1. horario;
2. bloque concreto;
3. materiales;
4. excepciones;
5. tareas.
Y responder correctamente.
 
⸻
 
55. CREACIÓN MEDIANTE IA
También se podrá permitir:
“Añade Física los martes y jueves de 10 a 11.”
La IA podrá preparar la modificación.
Pero deberá pasar por:
validación → previsualización → confirmación
antes de realizar cambios importantes.
 
⸻
 
56. DETECCIÓN DE DUPLICADOS
Si el usuario intenta crear:
Biología
cuando ya existe:
Biología
el sistema deberá sugerir:
“Ya existe una actividad llamada Biología. ¿Quieres utilizarla?”
Esto evita duplicaciones.
 
⸻
 
57. ACTIVIDADES PARECIDAS
Si existen:
* Biología.
* Biología 2.
* Biología y Geología.
la aplicación podrá mostrar coincidencias para que el usuario elija.
No deberá fusionar automáticamente entidades ambiguas.
 
⸻
 
58. ELIMINACIÓN
Eliminar una actividad será diferente de eliminar un bloque.
Si el usuario elimina:
un bloque
solo desaparece ese bloque.
Si elimina:
la actividad
se deberá mostrar el impacto:
“Biología está utilizada en 6 bloques, 4 tareas y 1 examen.”
Se ofrecerá:
* archivar;
* eliminar;
* cancelar.
La opción recomendada será archivar.
 
⸻
 
59. ARCHIVADO INTELIGENTE
Cuando una actividad deje de utilizarse, archivarla permitirá conservar:
* historial;
* tareas;
* exámenes;
* estadísticas;
* archivos.
No desaparecerá información histórica.
 
⸻
 
60. RESTAURACIÓN
Una actividad archivada podrá recuperarse.
Esto será útil al comenzar un nuevo curso.
 
⸻
 
61. DUPLICAR ACTIVIDAD
Podrá existir:
Duplicar actividad
Ejemplo:
Biología 2026/27
↓
Biología 2027/28
Se copiará la configuración seleccionada, pero se creará una entidad nueva.
Esto evitará modificar accidentalmente la actividad histórica.
 
⸻
 
62. RELACIONES ENTRE ACTIVIDADES
En el futuro una actividad podrá relacionarse con otra.
Ejemplo:
Estudiar Biología
→ relacionada con:
Biología
Esto permitirá construir sistemas de planificación más avanzados.
 
⸻
 
63. ACTIVIDADES PADRE E HIJAS
Se podrá contemplar:
Entrenamiento
→ Sesión de fuerza
→ Sesión de habilidades
→ Sesión de movilidad
O:
Estudios
→ Biología
→ Física
→ Matemáticas.
No será obligatorio utilizar esta jerarquía, pero la arquitectura deberá poder soportarla.
 
⸻
 
64. AGRUPACIONES
El usuario podrá agrupar actividades.
Ejemplo:
Colegio
* Matemáticas.
* Física.
* Biología.
* Inglés.
Fitness
* Calistenia.
* Fútbol.
Esto permitirá filtros y organización.
 
⸻
 
65. COLORES DE GRUPO
Un grupo podrá tener un color general.
Las actividades individuales podrán:
* heredar;
* sobrescribir;
* utilizar un color propio.
Esto facilitará organizar grandes cantidades de información.
 
⸻
 
66. SISTEMA DE FILTROS
Se podrá filtrar por:
* tipo;
* grupo;
* color;
* etiqueta;
* estado;
* horario;
* periodo.
Ejemplo:
Mostrar solo estudios.
 
⸻
 
67. BÚSQUEDA GLOBAL
La búsqueda del Sistema Personal podrá encontrar actividades de HORARIO TOP.
Buscar:
Biología
podrá mostrar:
* actividad;
* próximos bloques;
* tareas;
* exámenes;
* materiales.
Esto permitirá integrar HORARIO TOP con la búsqueda global de la aplicación.
 
⸻
 
68. ACCESO DESDE HOY
En HOY, tocar:
Biología
deberá poder abrir su ficha.
Esto evitará navegar manualmente por diferentes módulos.
 
⸻
 
69. ACCESO DESDE CALENDARIO
Igualmente, tocar un evento:
Clase de Biología
podrá mostrar:
* actividad;
* aula;
* profesor;
* material;
* tareas;
* examen próximo.
 
⸻
 
70. ACCESO DESDE MOCHILA
Si la mochila muestra:
Libro de Biología
el usuario podrá tocarlo y acceder a:
Biología
para ver dónde se necesita.
Esto creará un ecosistema conectado.
 
⸻
 
71. ACCESO DESDE TAREAS
Una tarea:
Estudiar tema 3
estará relacionada con:
Biología
y podrá mostrar:
Próxima clase: lunes 10:00
Esto permitirá organizar mejor las prioridades.
 
⸻
 
72. SISTEMA DE CONTEXTO
Cada actividad podrá acumular contexto procedente de diferentes módulos.
Ejemplo:
BIOLOGÍA
│
├── Horario
├── Profesor
├── Aula
├── Material
├── Tareas
├── Exámenes
├── Archivos
├── Notas
├── Estadísticas
└── Eventos
La actividad se convierte en un verdadero centro de contexto.
 
⸻
 
73. PRIVACIDAD
La información adicional de una actividad deberá permanecer privada por defecto.
Especialmente:
* notas;
* archivos;
* información personal;
* observaciones.
Si en el futuro se comparte un horario, solo se compartirá lo seleccionado.
 
⸻
 
74. PREPARACIÓN PARA CLOUD
Todas las actividades estarán vinculadas al usuario y protegidas mediante las políticas de seguridad definidas en la Fase 2.
La información deberá sincronizarse entre dispositivos.
Los cambios de:
* nombre;
* color;
* icono;
* profesor;
* aula;
deberán poder propagarse correctamente.
 
⸻
 
75. PREPARACIÓN PARA OFFLINE
La ficha básica de las actividades utilizadas recientemente podrá estar disponible localmente.
Así:
abrir horario → mostrar actividad
no dependerá necesariamente de una conexión inmediata.
 
⸻
 
76. CACHÉ INTELIGENTE
La aplicación podrá priorizar almacenar localmente:
* actividades frecuentes;
* horarios activos;
* información de HOY;
* materiales próximos.
No será necesario cargar todo el histórico continuamente.
 
⸻
 
77. DISEÑO DE LA FICHA
La ficha de actividad deberá priorizar:
CABECERA
Icono + nombre + color.
INFORMACIÓN PRINCIPAL
Próximo horario.
CONTEXTO
Profesor / aula / descripción.
RELACIONES
Tareas / exámenes / materiales.
ACCIONES
Editar / añadir / consultar.
La interfaz deberá ser limpia.
 
⸻
 
78. ACCIONES RÁPIDAS DESDE LA FICHA
Desde la ficha podrán existir acciones como:
+ Tarea
+ Evento
+ Material
+ Recordatorio
Editar
Esto reducirá pasos.
 
⸻
 
79. RESUMEN DE ACTIVIDAD
La aplicación podrá mostrar:
Biología
3 clases esta semana 2 tareas pendientes 1 examen próximo 3 materiales asociados
Esto proporciona contexto inmediato.
 
⸻
 
80. SISTEMA DE COLORES CONSISTENTE
La misma actividad deberá conservar su identidad visual en todo el Sistema Personal.
Ejemplo:
Biología = verde
→ horario verde
→ calendario verde
→ HOY verde
→ tarea con indicador verde
→ examen con indicador verde
No se deberán generar colores diferentes sin motivo.
 
⸻
 
81. CONTRASTE Y ACCESIBILIDAD
El color nunca será la única señal.
Siempre deberá existir:
* nombre;
* icono;
* texto;
* o etiqueta.
Esto garantiza que el sistema siga siendo comprensible aunque el usuario no distinga determinados colores.
 
⸻
 
82. PERSONALIZACIÓN GLOBAL
El usuario podrá establecer:
Mostrar colores: sí/no
Mostrar iconos: sí/no
Mostrar nombres cortos: sí/no
Mostrar aulas: sí/no
Esto permitirá adaptar la densidad visual.
 
⸻
 
83. ORDEN DE ACTIVIDADES
Al seleccionar una actividad, el sistema podrá ordenar:
1. Favoritas.
2. Recientes.
3. Más utilizadas.
4. Alfabéticamente.
El usuario podrá cambiar el criterio.
 
⸻
 
84. ACTIVIDADES MÁS UTILIZADAS
El sistema podrá detectar automáticamente cuáles se utilizan más.
Ejemplo:
Más utilizadas
Matemáticas
Biología
Inglés
Física
Esto acelerará la edición.
 
⸻
 
85. INTELIGENCIA CONTEXTUAL
Con el tiempo el sistema podrá detectar:
“Normalmente los lunes a las 10:00 tienes Biología.”
Si el usuario crea un nuevo horario similar, podrá sugerir esa actividad.
Las sugerencias siempre deberán ser opcionales.
 
⸻
 
86. SUGERENCIAS
Ejemplo:
Al crear:
Martes 10:00
el sistema podría mostrar:
“¿Quieres añadir Biología? La utilizas habitualmente en este horario.”
El usuario decide.
No se deberá modificar el horario automáticamente.
 
⸻
 
87. RECONOCIMIENTO DE PATRONES
En fases posteriores la IA podrá detectar:
* actividades repetidas;
* huecos;
* cambios frecuentes;
* cargas excesivas;
* patrones semanales.
La estructura de esta fase permitirá hacerlo.
 
⸻
 
88. INTEGRACIÓN CON OBJETIVOS
Una actividad podrá relacionarse con objetivos.
Ejemplo:
Estudiar Biología
→ objetivo:
Preparar examen de septiembre
Esto permitirá conectar planificación con objetivos personales.
 
⸻
 
89. INTEGRACIÓN CON HÁBITOS
También podrá relacionarse con hábitos.
Ejemplo:
Estudio
→ hábito:
Estudiar 60 minutos diarios
HORARIO TOP podrá servir como contexto temporal para ese hábito.
 
⸻
 
90. INTEGRACIÓN CON PRODUCTIVIDAD
Las actividades podrán alimentar el sistema de productividad.
Ejemplo:
Horario
→ bloque de estudio
→ tarea
→ objetivo
→ progreso.
 
⸻
 
91. INTEGRACIÓN CON ENTRENAMIENTO
Un bloque:
Calistenia
podrá enlazar con:
* sesión concreta;
* ejercicios;
* duración;
* objetivo;
* progreso.
Así HORARIO TOP no duplicará información del módulo de entrenamiento.
 
⸻
 
92. PRINCIPIO DE REFERENCIA ÚNICA
Si una sesión de entrenamiento existe en el módulo de entrenamiento:
HORARIO TOP no deberá crear otra sesión independiente.
Deberá referenciarla.
Esto evita inconsistencias.
 
⸻
 
93. EJEMPLO
Existe:
Entrenamiento Calistenia — 18:00
El horario mostrará:
18:00 Calistenia
Si el usuario abre el bloque:
podrá acceder a la sesión real.
No se deberán crear dos registros incompatibles.
 
⸻
 
94. EVENTOS EXTERNOS
En el futuro podrán importarse actividades desde:
* calendarios externos;
* archivos;
* integraciones.
Las actividades externas deberán poder identificarse mediante:
source
para saber de dónde proceden.
 
⸻
 
95. NO DUPLICAR IMPORTACIONES
Si un evento externo ya existe, el sistema deberá poder detectar duplicados mediante identificadores externos cuando estén disponibles.
Esto será importante para sincronizaciones futuras.
 
⸻
 
96. HISTORIAL DE ACTIVIDAD
Cambios relevantes podrán quedar registrados:
Biología
Color:
verde → azul

Profesor:
X → Y
Esto facilitará recuperación y debugging.
 
⸻
 
97. ELIMINACIÓN LÓGICA
Al eliminar una actividad importante se preferirá:
archivar
antes que eliminar físicamente.
La eliminación definitiva podrá requerir confirmación explícita.
 
⸻
 
98. SEGURIDAD
Todas las operaciones deberán comprobar que:
* la actividad pertenece al usuario;
* las relaciones pertenecen al usuario;
* no se puede acceder a datos de otros usuarios;
* las operaciones están autorizadas.
La interfaz no será considerada una barrera de seguridad.
 
⸻
 
99. IA Y PERMISOS
La IA podrá sugerir:
“Crear Biología”
pero no deberá poder modificar información privada sin pasar por las mismas validaciones que cualquier otra acción.
Cuando una acción tenga impacto relevante:
previsualización → confirmación → ejecución.
 
⸻
 
100. RESULTADO DE LA FASE
Después de esta fase, una actividad dejará de ser simplemente:
“texto dentro de una celda”.
Será una entidad reutilizable y conectada.
Ejemplo:
🧬 BIOLOGÍA
│
├── Horario
│   ├── Lunes
│   ├── Miércoles
│   └── Viernes
│
├── Profesor
├── Aula
├── Material
│   ├── Libro
│   ├── Libreta
│   └── Bata
│
├── Tareas
│   ├── Tema 3
│   └── Práctica
│
├── Exámenes
│   └── 3 septiembre
│
├── Archivos
├── Objetivos
├── Estadísticas
└── IA
 
⸻
 
101. CRITERIOS DE ACEPTACIÓN
La Fase 5 se considerará completa cuando:
* las actividades sean entidades independientes;
* las asignaturas sean reutilizables;
* existan tipos de actividad;
* exista color;
* exista icono;
* exista nombre corto;
* exista búsqueda;
* exista autocompletado;
* exista detección de duplicados;
* exista información de profesor;
* exista información de aula;
* existan etiquetas;
* existan favoritos;
* existan actividades recientes;
* puedan archivarse;
* puedan restaurarse;
* puedan duplicarse;
* puedan relacionarse con tareas;
* puedan relacionarse con exámenes;
* puedan relacionarse con materiales;
* puedan relacionarse con eventos;
* puedan alimentar la mochila;
* puedan aparecer en HOY;
* puedan utilizarse desde calendario;
* puedan conectarse con entrenamiento, estudios y productividad;
* mantengan identidad visual consistente;
* estén protegidas por usuario;
* estén preparadas para Cloud;
* estén preparadas para IA.
 
⸻
 
102. SIGUIENTE FASE
La siguiente será:
FASE 6 — CALENDARIO + AGENDA + SISTEMA HOY
Esta será una de las fases más importantes de todo HORARIO TOP.
Aquí vamos a convertir todos los datos anteriores en una experiencia diaria.
El objetivo será que al abrir:
HOY
el usuario pueda ver automáticamente:
* lo que tiene en el horario;
* tareas;
* exámenes;
* eventos;
* entrenamientos;
* hábitos;
* objetivos;
* recordatorios;
* mochila;
* prioridades;
* próximos acontecimientos.
Y todo deberá aparecer ordenado cronológicamente y con contexto, sin obligar al usuario a entrar en cada módulo por separado.
 
⸻
 
PROGRESO REAL DEL MÓDULO
FASE 1 — Arquitectura general: completada FASE 2 — Modelo de datos + Cloud + Supabase: completada FASE 3 — Editor visual: completada FASE 4 — Configuración avanzada: completada FASE 5 — Actividades y contexto: completada
PROGRESO REAL: 
42% / 100%
La Fase 5 tiene un peso elevado porque establece el sistema de entidades que conectará HORARIO TOP con prácticamente todo el Sistema Operativo Personal.

HORARIO TOP
FASE 4 — CONFIGURACIÓN AVANZADA DE COLUMNAS, FILAS Y BLOQUES
1. OBJETIVO
La Fase 3 definió el editor visual básico.
Esta fase lleva ese editor a un nivel mucho más potente:
HORARIO TOP no debe asumir cómo tiene que ser un horario. El usuario debe poder decidir cómo quiere estructurarlo.
El sistema deberá servir para un horario escolar tradicional, pero también para:
* horarios universitarios;
* trabajo;
* entrenamiento;
* estudio;
* planificación semanal;
* rutinas;
* proyectos;
* horarios A/B;
* turnos;
* actividades personales;
* estructuras completamente personalizadas.
La cuadrícula será, por tanto, un constructor flexible de estructuras temporales.
 
⸻
 
2. PRINCIPIO DE FLEXIBILIDAD
No se deberá programar:
“Un horario siempre tiene 7 columnas y 8 filas.”
La aplicación deberá entender:
“Un horario tiene una estructura definida por el usuario.”
La plantilla inicial podrá ser:
Lunes → Domingo
pero esa plantilla será solamente una configuración inicial.
 
⸻
 
3. CONFIGURADOR DEL HORARIO
Al editar la estructura del horario existirá una zona de configuración.
Ejemplo:
CONFIGURAR HORARIO

Columnas
[ 5 ]

Filas
[ 8 ]

Formato
[ Semanal ]

Intervalo
[ Personalizado ]

Vista
[ Cuadrícula ]
El usuario podrá cambiar la estructura sin tener que crear un horario nuevo.
 
⸻
 
4. CONFIGURACIÓN DE COLUMNAS
Cada columna tendrá sus propias propiedades.
Columna
├── Nombre
├── Nombre corto
├── Icono
├── Color
├── Posición
├── Visibilidad
└── Tipo
Ejemplo:
Lunes
Nombre corto:
L
Color:
configurable.
 
⸻
 
5. TIPOS DE COLUMNAS
Aunque normalmente representarán días, técnicamente podrán representar cualquier dimensión.
Tipos posibles:
* Día.
* Persona.
* Semana.
* Turno.
* Proyecto.
* Categoría.
* Personalizado.
Esto permitirá utilizar HORARIO TOP para estructuras que no sean estrictamente calendarios.
 
⸻
 
6. COLUMNAS ESPECIALES
El sistema podrá permitir columnas especiales.
Ejemplo:
Lunes
Martes
Miércoles
Jueves
Viernes
Notas
La columna Notas no tendría necesariamente que comportarse como un día.
Podría utilizarse para:
* anotaciones;
* objetivos;
* recordatorios;
* información contextual.
La implementación deberá contemplar esta posibilidad sin romper la lógica temporal.
 
⸻
 
7. OCULTAR COLUMNAS
Una columna podrá estar:
Visible
o:
Oculta
Ocultar no significa eliminar.
Ejemplo:
Durante el verano:
☑ Lunes
☑ Martes
☑ Miércoles
☐ Jueves
☐ Viernes
Los datos permanecen guardados.
 
⸻
 
8. BLOQUEAR COLUMNAS
Una columna podrá configurarse como:
Bloqueada
Esto evitará modificaciones accidentales.
Especialmente útil para:
* horarios terminados;
* columnas importantes;
* estructuras compartidas.
 
⸻
 
9. AGRUPACIÓN DE COLUMNAS
Para estructuras avanzadas se podrá contemplar agrupación.
Ejemplo:
        SEMANA A
Lunes | Martes | Miércoles

        SEMANA B
Lunes | Martes | Miércoles
Visualmente podrían existir encabezados superiores.
Esto permitirá representar horarios alternos sin tener que crear sistemas completamente separados.
 
⸻
 
10. SEMANAS A/B
Se preparará soporte para:
Semana A
y
Semana B.
Ejemplo:
Semana A
Lunes → Matemáticas
Semana B
Lunes → Física
El usuario podrá consultar automáticamente la estructura correspondiente a la semana actual.
 
⸻
 
11. CICLOS PERSONALIZADOS
El sistema no deberá limitarse a A/B.
Podrá prepararse para:
* Semana A/B.
* Semana 1/2/3.
* Ciclo de 4 semanas.
* Turnos.
* Rotaciones.
La arquitectura deberá permitir definir un ciclo.
 
⸻
 
12. FILAS AVANZADAS
Cada fila podrá contener:
* etiqueta;
* hora inicial;
* hora final;
* duración;
* posición;
* visibilidad;
* color;
* tipo.
Ejemplo:
08:00–08:50
08:50–09:40
09:40–10:10
10:10–11:00
 
⸻
 
13. FILAS SIN HORA
En horarios personalizados puede existir una fila que no represente una hora.
Ejemplo:
MAÑANA
TARDE
NOCHE
o:
PRIORIDAD ALTA
PRIORIDAD MEDIA
PRIORIDAD BAJA
Por tanto, la aplicación no deberá obligar a todas las filas a tener una hora.
 
⸻
 
14. FILAS DE SEPARACIÓN
Podrán existir separadores visuales.
Ejemplo:
08:00
09:00
──────────
DESCANSO
──────────
10:00
11:00
Estos elementos podrán utilizarse para dividir visualmente una jornada.
 
⸻
 
15. BLOQUES MULTIFILA
Un bloque podrá ocupar varias franjas.
Ejemplo:
08:00–10:00 Matemáticas
En lugar de crear dos bloques:
08:00 Matemáticas
09:00 Matemáticas
se podrá crear uno:
08:00–10:00 Matemáticas
Esto es importante para mantener los datos limpios.
 
⸻
 
16. BLOQUES MULTICOLUMNA
También deberá contemplarse la posibilidad de que una actividad ocupe más de una columna cuando tenga sentido.
Ejemplo:
Excursión
puede ocupar:
Lunes + Martes
en una planificación especial.
No será una función obligatoria para todos los horarios, pero la arquitectura deberá poder soportarla.
 
⸻
 
17. BLOQUES FLOTANTES
Algunos eventos no estarán necesariamente ligados a una celda concreta.
Ejemplo:
Examen — 16:30
El bloque podrá posicionarse por tiempo real independientemente de la estructura visual.
Esto será especialmente útil para:
* eventos;
* citas;
* exámenes;
* recordatorios.
 
⸻
 
18. BLOQUES ANIDADOS
Para estructuras avanzadas se podrá contemplar información secundaria dentro de un bloque.
Ejemplo:
BIOLOGÍA
10:00–11:00

Laboratorio
Aula 2.3
La información secundaria podrá mostrarse únicamente cuando exista espacio suficiente.
 
⸻
 
19. DENSIDAD DE INFORMACIÓN
El usuario podrá elegir entre:
Compacto
Más elementos visibles.
Normal
Equilibrio.
Cómodo
Bloques más grandes y fáciles de leer.
Esto será especialmente importante en móvil.
 
⸻
 
20. TAMAÑO DE LAS FILAS
Las filas podrán tener altura:
* automática;
* compacta;
* normal;
* grande;
* personalizada.
El sistema deberá evitar que una configuración extrema destruya la usabilidad.
 
⸻
 
21. TAMAÑO DE COLUMNAS
Igualmente:
* compacto;
* normal;
* amplio;
* personalizado.
En móvil se priorizará la legibilidad.
 
⸻
 
22. ZOOM
Podrá existir zoom de la cuadrícula.
Ejemplo:
−  100%  +
Esto permitirá adaptar el horario a diferentes necesidades.
El zoom no deberá modificar los datos, únicamente su representación visual.
 
⸻
 
23. AJUSTE AUTOMÁTICO
Una opción:
Ajustar a pantalla
permitirá que el sistema calcule automáticamente el tamaño de columnas y filas.
Esto será especialmente útil cuando existan muchas columnas.
 
⸻
 
24. REORDENACIÓN MASIVA
El usuario podrá seleccionar varias columnas y reorganizarlas.
Ejemplo:
Seleccionar
Lunes
Martes
Miércoles

Mover
También podrá reordenar filas.
Esto evitará tener que moverlas una por una.
 
⸻
 
25. DUPLICAR ESTRUCTURA
Podrá duplicarse una estructura completa.
Ejemplo:
Horario Colegio
→ Horario Colegio 2027
La copia podrá conservar:
* columnas;
* filas;
* asignaturas;
* colores;
* iconos;
* configuración.
Después el usuario podrá modificar únicamente lo necesario.
 
⸻
 
26. PLANTILLAS PERSONALIZADAS
El usuario podrá guardar una estructura como plantilla.
Ejemplo:
Mi horario escolar
Después podrá crear:
Nuevo horario → Usar mi plantilla
Esto permitirá reutilizar diseños.
 
⸻
 
27. PLANTILLAS DEL SISTEMA
La aplicación podrá incluir plantillas predeterminadas.
Ejemplos:
Colegio
5 días + franjas horarias.
Semana completa
7 días.
Entrenamiento
Lunes–Domingo.
Estudio
Bloques de mañana/tarde.
Trabajo
Turnos.
Personalizado
Completamente vacío.
 
⸻
 
28. CONFIGURACIÓN DE INTERVALOS
El usuario podrá elegir:
30 minutos
45 minutos
50 minutos
60 minutos
o:
Personalizado
Esto será solamente una ayuda para crear la estructura.
Los bloques seguirán pudiendo tener horarios específicos.
 
⸻
 
29. HORARIOS SIN INTERVALOS REGULARES
Ejemplo:
08:15–09:05
09:10–10:00
10:15–11:20
11:45–12:30
El sistema deberá admitirlos sin intentar forzarlos a intervalos estándar.
 
⸻
 
30. CAMBIOS DE ESTRUCTURA CON DATOS EXISTENTES
Este será un punto crítico.
Si el usuario modifica:
08:00–09:00
por:
08:30–09:30
y ya existen actividades dentro, el sistema deberá comprobar los posibles conflictos.
No se deben mover datos silenciosamente.
 
⸻
 
31. PREVISUALIZACIÓN DE CAMBIOS
Cuando un cambio estructural pueda afectar al horario:
Cambiar esta estructura afectará a 7 bloques.

¿Qué quieres hacer?

[Revisar cambios]
[Continuar]
[Cancelar]
El usuario podrá revisar antes de confirmar.
 
⸻
 
32. MIGRACIÓN AUTOMÁTICA
Cuando sea posible, el sistema podrá adaptar automáticamente los bloques.
Ejemplo:
Cambiar una fila de:
08:00–09:00
a:
08:30–09:30
El sistema puede proponer:
“Se han detectado 3 bloques afectados.”
y mostrar qué ocurrirá.
 
⸻
 
33. VALIDACIÓN ESTRUCTURAL
Antes de guardar una configuración deberá comprobarse:
* columnas válidas;
* filas válidas;
* horas coherentes;
* posiciones únicas;
* identificadores correctos;
* bloques existentes;
* conflictos;
* relaciones válidas.
 
⸻
 
34. HORAS SOLAPADAS
Dos filas pueden estar solapadas si el usuario las crea manualmente.
Ejemplo:
08:00–10:00
09:00–11:00
El sistema deberá detectarlo.
Podrá:
* corregir;
* advertir;
* permitir continuar.
La opción recomendada será advertir y permitir al usuario decidir.
 
⸻
 
35. MODO LIBRE
Para usuarios avanzados podrá existir un modo:
Estructura libre
En este modo se permitirá una mayor libertad de posicionamiento.
Esto será especialmente útil para:
* planificación de proyectos;
* mapas de tiempo;
* rutinas;
* sistemas personales.
 
⸻
 
36. REGLAS SEGÚN TIPO DE HORARIO
El sistema podrá cambiar ciertas recomendaciones según el tipo.
Colegio
Priorizar:
* días;
* horas;
* asignaturas;
* aulas;
* profesores.
Entrenamiento
Priorizar:
* sesión;
* duración;
* intensidad;
* ubicación.
Estudio
Priorizar:
* materia;
* objetivo;
* duración;
* prioridad.
Trabajo
Priorizar:
* turno;
* ubicación;
* responsable.
No significa crear cuatro editores distintos.
Se utilizará el mismo motor con diferentes configuraciones.
 
⸻
 
37. METADATOS DEL HORARIO
Cada horario podrá tener:
* nombre;
* descripción;
* tipo;
* icono;
* color;
* periodo;
* zona horaria;
* semana de inicio;
* ciclo;
* configuración visual.
Esto permitirá identificarlo rápidamente.
 
⸻
 
38. COLOR DEL HORARIO
Además de los colores de actividades, cada horario podrá tener identidad propia.
Ejemplo:
Colegio 🔵
Entrenamiento 🟢
Estudio 🟣
Esto será útil en HOY cuando varios horarios aparezcan combinados.
 
⸻
 
39. FILTROS POR HORARIO
En una vista combinada podrá existir:
☑ Colegio
☑ Entrenamiento
☐ Estudio
Así el usuario podrá decidir qué información quiere ver.
 
⸻
 
40. FILTROS POR ACTIVIDAD
También:
☑ Matemáticas
☑ Biología
☐ Inglés
Esto permitirá localizar rápidamente información concreta.
 
⸻
 
41. BÚSQUEDA
HORARIO TOP deberá poder buscar:
* asignaturas;
* actividades;
* aulas;
* profesores;
* etiquetas;
* eventos.
Ejemplo:
Buscar:
Biología
→ aparecen todos los bloques y eventos relacionados.
 
⸻
 
42. ATAJOS
En escritorio:
* copiar;
* pegar;
* deshacer;
* rehacer;
* eliminar;
* seleccionar.
En móvil:
* botones rápidos;
* menús contextuales;
* gestos;
* acciones inferiores.
La funcionalidad será equivalente.
 
⸻
 
43. SISTEMA DE SELECCIÓN
Se deberá diferenciar:
Selección individual
Un bloque.
Selección múltiple
Varios bloques.
Selección de columna
Todo un día.
Selección de fila
Toda una franja.
Selección completa
Todo el horario.
Esto permitirá operaciones masivas.
 
⸻
 
44. ACCIONES SOBRE SELECCIÓN
Podrán aplicarse:
* eliminar;
* duplicar;
* mover;
* cambiar color;
* cambiar icono;
* copiar;
* exportar;
* convertir.
 
⸻
 
45. ELIMINACIÓN SEGURA
Cuando se seleccione una estructura con datos relacionados:
Eliminar columna
el sistema deberá informar:
“Esta columna contiene 8 bloques y 2 eventos asociados.”
No se deberá ocultar el impacto de la acción.
 
⸻
 
46. RESTAURACIÓN
Si una operación importante se ejecuta accidentalmente:
Deshacer
deberá permitir recuperar el estado anterior.
En operaciones mayores también se podrá recurrir al historial.
 
⸻
 
47. VERSIONADO FUTURO
La arquitectura deberá permitir guardar versiones del horario.
Ejemplo:
Versión 1
22 agosto

Versión 2
25 agosto

Versión 3
1 septiembre
Esto podrá desarrollarse posteriormente.
 
⸻
 
48. IMPORTACIÓN DE ESTRUCTURAS
El sistema podrá aceptar estructuras provenientes de:
* plantillas;
* CSV;
* Excel;
* IA;
* otros horarios.
Antes de aplicarlas:
Previsualización → validación → confirmación.
 
⸻
 
49. EXPORTACIÓN
La estructura deberá poder prepararse para exportar posteriormente a:
* PDF;
* imagen;
* CSV;
* calendario;
* formato compatible.
La exportación se desarrollará en fases posteriores, pero el modelo no deberá dificultarla.
 
⸻
 
50. HORARIO PARA IMPRIMIR
Aunque el foco sea móvil, podrá existir posteriormente una vista:
Imprimir horario
que genere una cuadrícula limpia.
Se podrá elegir:
* semana;
* colores;
* información;
* tamaño.
 
⸻
 
51. VISTA PARA COMPARTIR
Posteriormente podrá existir:
Compartir horario
generando una representación limpia.
No se deberá compartir automáticamente información privada como:
* notas;
* tareas privadas;
* datos personales.
Únicamente la información seleccionada.
 
⸻
 
52. PRIVACIDAD
Los horarios pertenecen al usuario.
La arquitectura deberá permitir posteriormente definir:
Privado
Compartible
Solo lectura
Compartido con usuarios autorizados
La capacidad de compartir no deberá implicar que un horario sea público por defecto.
 
⸻
 
53. ZONA HORARIA
Aunque inicialmente el usuario pueda trabajar en una única zona horaria, el horario deberá guardar la zona horaria asociada cuando corresponda.
Esto evitará problemas futuros con:
* viajes;
* cambios de país;
* dispositivos;
* eventos internacionales.
 
⸻
 
54. CAMBIO DE HORA
Las horas deberán almacenarse y mostrarse de forma coherente.
Para un horario recurrente, se deberá distinguir correctamente entre:
* hora local del horario;
* fecha;
* zona horaria.
 
⸻
 
55. CAMBIOS DE CURSO
Una función importante será:
Duplicar horario para nuevo periodo
Ejemplo:
2026/27
↓
Duplicar
↓
2027/28
El sistema podrá conservar:
* estructura;
* colores;
* iconos;
* asignaturas.
Y permitir cambiar:
* profesores;
* aulas;
* asignaturas;
* horarios.
 
⸻
 
56. ARCHIVAR HORARIOS
Cuando un horario deje de utilizarse:
Archivar
en lugar de eliminar.
Ejemplo:
ACTIVOS
Colegio 2026/27

ARCHIVADOS
Colegio 2025/26
Esto conserva el histórico.
 
⸻
 
57. RECUPERACIÓN
Los horarios archivados podrán recuperarse.
Esto será importante para evitar pérdidas accidentales.
 
⸻
 
58. CONFIGURACIÓN POR USUARIO
La aplicación deberá recordar las preferencias:
* última vista;
* último horario abierto;
* zoom;
* densidad;
* columnas visibles;
* filtros;
* modo oscuro;
* orden.
Estas preferencias no deben modificar el horario de otros dispositivos de manera inesperada.
 
⸻
 
59. CONFIGURACIÓN LOCAL VS CLOUD
Se distinguirá entre:
Datos del horario
Deben sincronizarse.
Preferencias puramente visuales
Pueden almacenarse localmente cuando tenga sentido.
Ejemplo:
El usuario prefiere un zoom del 90 % en su móvil.
Eso no debería modificar necesariamente la vista del horario en su ordenador.
 
⸻
 
60. RENDIMIENTO DE GRANDES HORARIOS
Si existen cientos o miles de bloques históricos, la interfaz no deberá cargarlo todo innecesariamente.
Se utilizarán estrategias como:
* carga bajo demanda;
* filtrado;
* memoización;
* virtualización cuando sea necesaria;
* consultas limitadas.
El usuario debe percibir HORARIO TOP como instantáneo.
 
⸻
 
61. ARQUITECTURA PREPARADA PARA FUTUROS MÓDULOS
Esta fase deberá dejar preparado el sistema para conectar posteriormente:
HORARIO
↓
CALENDARIO
↓
HOY
↓
MOCHILA
↓
TAREAS
↓
ESTUDIOS
↓
ENTRENAMIENTO
↓
HÁBITOS
↓
OBJETIVOS
↓
IA
El editor no deberá crear estructuras cerradas que impidan estas conexiones.
 
⸻
 
62. EXPERIENCIA FINAL ESPERADA
El usuario deberá poder hacer algo como:
Crear horario → elegir colegio → seleccionar lunes-viernes → configurar franjas → tocar cada celda → seleccionar asignatura → listo.
Pero un usuario avanzado podrá hacer:
Crear estructura → 10 columnas → ciclo de 4 semanas → franjas irregulares → bloques de duración variable → columnas agrupadas → colores personalizados → filtros → vistas personalizadas.
Ambos estarán utilizando el mismo sistema.
 
⸻
 
63. REGLA DE DISEÑO
Toda función avanzada deberá cumplir:
No complicar la interfaz básica.
La potencia debe aparecer cuando el usuario la necesita.
Por ejemplo:
Usuario básico
Toca una celda.
Escribe:
Matemáticas
Fin.
Usuario avanzado
Abre:
Opciones avanzadas
y puede modificar:
* duración;
* recurrencia;
* color;
* icono;
* aula;
* profesor;
* etiquetas;
* excepciones;
* comportamiento.
 
⸻
 
64. CRITERIOS DE ACEPTACIÓN
La Fase 4 se considerará completa cuando el sistema pueda:
* personalizar columnas;
* personalizar filas;
* ocultar columnas;
* reordenar columnas;
* reordenar filas;
* crear horarios A/B;
* soportar ciclos;
* crear filas sin hora;
* crear bloques de duración variable;
* soportar bloques largos;
* detectar conflictos;
* mostrar advertencias;
* duplicar estructuras;
* guardar plantillas;
* reutilizar plantillas;
* modificar densidad;
* ajustar tamaños;
* utilizar zoom;
* filtrar horarios;
* filtrar actividades;
* seleccionar múltiples elementos;
* realizar operaciones masivas;
* archivar horarios;
* duplicar horarios para nuevos periodos;
* mantener histórico;
* conservar la información al modificar la estructura;
* funcionar correctamente en móvil.
 
⸻
 
65. PREPARACIÓN PARA LA FASE 5
Con esta fase ya tendremos definido prácticamente todo el motor estructural del horario.
La siguiente fase se centrará en algo fundamental:
FASE 5 — ASIGNATURAS, ACTIVIDADES, COLORES, ICONOS Y CONTEXTO
Aquí se desarrollará el sistema que permitirá que una asignatura o actividad deje de ser simplemente un texto y se convierta en una entidad inteligente.
Por ejemplo:
BIOLOGÍA
tendrá:
* identidad;
* color;
* icono;
* profesor;
* aula;
* materiales;
* tareas;
* exámenes;
* archivos;
* estadísticas;
* historial;
* relación con el horario;
* relación con HOY;
* relación con la mochila;
* relación con IA.
Esto será lo que empiece a convertir HORARIO TOP en un sistema verdaderamente conectado con el resto del Sistema Personal.
 
⸻
 
PROGRESO REAL DEL MÓDULO
FASE 1 — Arquitectura general: completada FASE 2 — Modelo de datos + Cloud + Supabase: completada FASE 3 — Editor visual: completada FASE 4 — Configuración avanzada: completada
PROGRESO REAL: 
33% / 100%
El progreso se calcula por el peso funcional y técnico de cada fase, no simplemente por dividir 100 entre 12.

HORARIO TOP
FASE 3 — EDITOR VISUAL DE HORARIOS
1. OBJETIVO DE LA FASE
Esta fase define cómo se construirá el editor visual de HORARIO TOP.
El objetivo principal es que crear un horario completo sea extremadamente sencillo, incluso desde un iPhone, pero que por debajo exista una estructura suficientemente potente para soportar toda la arquitectura definida en las fases anteriores.
La filosofía será:
El usuario ve una cuadrícula sencilla. El sistema se encarga de toda la complejidad.
No queremos un formulario largo donde haya que introducir cada dato manualmente.
Queremos una experiencia parecida a editar una tabla visual:
crear → tocar → escribir → colorear → mover → guardar.
 
⸻
 
2. ENTRADA AL EDITOR
Al entrar en HORARIO TOP habrá una acción principal:
+ Crear horario
Al pulsarla aparecerá una configuración inicial extremadamente sencilla.
Ejemplo:
Crear horario
Nombre
Colegio
Tipo
Colegio
Días
Lunes → Viernes
¿Quieres añadir sábado y domingo?
Opcional.
Franjas horarias
Personalizar
Crear horario
El sistema podrá ofrecer una plantilla automática para no obligar al usuario a construir todo desde cero.
 
⸻
 
3. PLANTILLAS INICIALES
El usuario podrá comenzar desde diferentes plantillas.
Colegio
Configuración inicial:
* Lunes.
* Martes.
* Miércoles.
* Jueves.
* Viernes.
Semana completa
* Lunes.
* Martes.
* Miércoles.
* Jueves.
* Viernes.
* Sábado.
* Domingo.
Personalizado
El usuario decide absolutamente todo.
Desde cero
Cuadrícula vacía.
La plantilla únicamente será un punto de partida.
Todo deberá poder modificarse posteriormente.
 
⸻
 
4. PRIMERA VISTA
Una vez creado el horario aparecerá una cuadrícula.
Ejemplo:
             L   M   X   J   V
08:00       ┌───┬───┬───┬───┬───┐
             │   │   │   │   │   │
09:00       ├───┼───┼───┼───┼───┤
             │   │   │   │   │   │
10:00       ├───┼───┼───┼───┼───┤
             │   │   │   │   │   │
11:00       └───┴───┴───┴───┴───┘
La cuadrícula deberá ser visualmente limpia.
No deberá parecer una hoja de Excel antigua.
 
⸻
 
5. PRINCIPIO MOBILE-FIRST
El editor deberá diseñarse primero pensando en móvil.
La interfaz tendrá que funcionar perfectamente en:
* iPhone pequeño.
* iPhone grande.
* Android.
* Tablet.
* Escritorio.
Pero el móvil será la referencia principal.
No se deberá obligar al usuario a utilizar una pantalla grande para editar el horario.
 
⸻
 
6. NAVEGACIÓN HORIZONTAL
Cuando existan muchas columnas, la cuadrícula podrá desplazarse horizontalmente.
Por ejemplo:
← Lunes | Martes | Miércoles | Jueves | Viernes →
En móvil podrá existir scroll horizontal manteniendo visible la columna de horas.
La columna de horas deberá poder permanecer fija mientras se desplazan los días.
 
⸻
 
7. COLUMNA DE HORAS FIJA
En una cuadrícula grande:
        L   M   X   J   V   S   D
08:00
09:00
10:00
11:00
Al hacer scroll horizontal:
        X   J   V   S   D
08:00
09:00
10:00
La referencia temporal seguirá visible.
Esto hará que el usuario nunca pierda la orientación.
 
⸻
 
8. AÑADIR COLUMNAS
Existirá una acción:
+ Añadir columna
Al pulsarla podrá aparecer:
* Nombre.
* Nombre corto.
* Icono.
* Color.
* Posición.
Ejemplo:
+ Añadir columna

Nombre:
Sábado

Color:
[selector]

Crear
La nueva columna se incorporará inmediatamente a la cuadrícula.
 
⸻
 
9. ELIMINAR COLUMNAS
Cada columna podrá tener un menú contextual.
Ejemplo:
Lunes ···
Opciones:
* Editar.
* Duplicar.
* Mover izquierda.
* Mover derecha.
* Ocultar.
* Eliminar.
Antes de eliminar una columna con información se deberá solicitar confirmación.
Nunca se deberán borrar bloques silenciosamente.
 
⸻
 
10. REORDENAR COLUMNAS
Las columnas podrán reorganizarse.
Por ejemplo:
Lunes | Martes | Miércoles | Jueves | Viernes
podrá convertirse en:
Lunes | Miércoles | Martes | Jueves | Viernes
mediante:
* drag & drop;
* acciones de mover;
* o controles equivalentes en móvil.
 
⸻
 
11. AÑADIR FILAS
Existirá una acción:
+ Añadir franja
El usuario podrá definir:
Inicio: 08:00
Fin: 09:00
El sistema añadirá la nueva franja.
También podrá insertar una fila entre otras existentes.
 
⸻
 
12. ELIMINAR FILAS
Una fila podrá eliminarse.
Si contiene bloques:
* mostrar advertencia;
* indicar cuántos elementos se verán afectados;
* permitir cancelar;
* permitir confirmar.
La información no deberá perderse accidentalmente.
 
⸻
 
13. EDITAR HORAS
El usuario podrá tocar una franja:
08:00–09:00
y modificar:
Inicio → 08:30
Fin → 09:20
La interfaz deberá validar que las horas sean coherentes.
 
⸻
 
14. FRANJAS IRREGULARES
No se debe obligar a todas las filas a durar lo mismo.
Ejemplo:
08:00–08:50
08:50–09:40
09:40–10:10
10:10–11:00
La cuadrícula deberá representar visualmente estas diferencias.
 
⸻
 
15. CREAR UN BLOQUE
La acción más importante será:
Tocar una celda vacía.
Al tocarla se abrirá un editor rápido.
Ejemplo:
Nueva actividad

Nombre:
[ Matemáticas ]

Hora:
08:00 – 09:00

Color:
[ azul ]

Icono:
[ 🧮 ]

Guardar
Pero el usuario no tendrá que rellenar todos los campos.
 
⸻
 
16. CREACIÓN RÁPIDA
Debe existir una forma todavía más rápida.
Por ejemplo:
Tocar celda → escribir “Matemáticas” → Enter
El sistema podrá:
1. Buscar si ya existe Matemáticas.
2. Si existe, reutilizarla.
3. Si no existe, crearla.
4. Asignar el bloque.
5. Aplicar automáticamente su color.
6. Guardar.
Así se evita introducir la misma asignatura repetidamente.
 
⸻
 
17. AUTOCOMPLETADO
Al escribir:
Mate
el sistema podrá sugerir:
Matemáticas
Si el usuario ya la había utilizado anteriormente.
Esto será especialmente útil al crear un horario completo.
 
⸻
 
18. ASIGNATURAS EXISTENTES
Al seleccionar una actividad existente se reutilizará su configuración.
Ejemplo:
Matemáticas
ya tiene:
* Azul.
* Icono calculadora.
* Profesor.
* Aula.
Al añadirla al jueves:
todo se aplicará automáticamente.
 
⸻
 
19. CREAR NUEVA ACTIVIDAD
Si no existe:
+ Crear nueva actividad
Se podrá definir:
* Nombre.
* Tipo.
* Color.
* Icono.
* Profesor.
* Aula.
* Descripción.
* Material asociado.
Los campos avanzados podrán estar ocultos inicialmente.
 
⸻
 
20. EDICIÓN DE BLOQUES
Al tocar un bloque existente:
MATEMÁTICAS
08:00–09:00
se abrirá su panel.
Acciones:
* Editar.
* Cambiar hora.
* Cambiar día.
* Cambiar color.
* Cambiar icono.
* Duplicar.
* Convertir en otra actividad.
* Eliminar.
 
⸻
 
21. DUPLICAR BLOQUES
Una función fundamental será:
Duplicar
Ejemplo:
Matemáticas está el lunes.
El usuario pulsa:
Duplicar → Martes
El sistema creará el nuevo bloque utilizando la misma actividad.
Esto acelerará enormemente la creación inicial del horario.
 
⸻
 
22. COPIAR Y PEGAR
También deberá existir una lógica de:
Copiar bloque
y:
Pegar bloque
Esto permitirá construir rápidamente horarios complejos.
 
⸻
 
23. COPIAR DÍA COMPLETO
Otra función avanzada:
Duplicar día
Ejemplo:
Lunes
08:00 Matemáticas
09:00 Física
10:00 Inglés
→
Duplicar en Martes
El sistema copiará toda la estructura.
Posteriormente el usuario podrá modificar únicamente lo diferente.
 
⸻
 
24. LIMPIAR DÍA
Existirá:
Vaciar día
Antes de hacerlo:
“Este día contiene 6 bloques. ¿Quieres eliminarlos del horario?”
Esto será especialmente útil al rehacer un horario.
 
⸻
 
25. ARRASTRAR BLOQUES
En dispositivos compatibles, los bloques podrán moverse mediante drag & drop.
Ejemplo:
Lunes 08:00
Matemáticas
arrastrar →
Martes 09:00
El sistema actualizará:
* día;
* hora;
* posición;
* relaciones.
 
⸻
 
26. CONTROL TÁCTIL
En móvil no se dependerá exclusivamente del drag & drop.
También existirán acciones accesibles:
Mover a…
→ Martes → 10:00
Esto garantizará que el sistema siga siendo usable incluso cuando el arrastre resulte incómodo.
 
⸻
 
27. REDIMENSIONAR BLOQUES
Los bloques podrán tener duración variable.
En interfaces compatibles, el usuario podrá ampliar o reducir visualmente el bloque.
Ejemplo:
08:00
████████
████████
09:00
Arrastrar el borde inferior:
08:00
████████
████████
████████
09:30
El sistema actualizará automáticamente la hora de finalización.
 
⸻
 
28. PREVENCIÓN DE SOLAPAMIENTOS
Si el usuario intenta colocar:
08:00–10:00 Matemáticas
y ya existe:
09:00–10:00 Física
el sistema deberá detectar el conflicto.
Podrá:
* impedir la acción;
* mostrar advertencia;
* permitir forzarla.
La opción predeterminada deberá evitar conflictos.
 
⸻
 
29. DETECCIÓN VISUAL DE CONFLICTOS
Cuando exista un solapamiento se deberá mostrar claramente.
Por ejemplo:
⚠️ Conflicto de horario
Matemáticas:
08:00–10:00
Física:
09:00–10:00
Esto deberá ser comprensible sin entrar en configuraciones.
 
⸻
 
30. COLORES
El selector de colores será una parte importante del editor.
El usuario podrá escoger:
* colores predefinidos;
* colores personalizados;
* colores suaves;
* colores intensos.
También deberá existir:
Color automático
para que el sistema asigne colores sin intervención manual.
 
⸻
 
31. CONSISTENCIA DE COLORES
Una vez que una asignatura tenga color:
Matemáticas → azul
todos sus bloques podrán utilizar ese color automáticamente.
Si el usuario cambia el color global de Matemáticas:
el sistema podrá ofrecer:
“¿Quieres actualizar también sus bloques existentes?”
Opciones:
* Sí, todos.
* Solo futuros.
* No.
 
⸻
 
32. ICONOS
Cada actividad podrá tener un icono.
Ejemplos:
* Matemáticas → calculadora.
* Biología → microscopio.
* Inglés → idioma.
* Entrenamiento → pesa.
* Estudio → libro.
* Trabajo → maletín.
La selección deberá ser rápida y visual.
 
⸻
 
33. INFORMACIÓN COMPACTA
El bloque no deberá llenarse de información.
En la cuadrícula deberá aparecer únicamente lo importante:
🧬 Biología
10:00
Información adicional como:
* profesor;
* aula;
* material;
se mostrará al abrirlo.
Esto evita una cuadrícula saturada.
 
⸻
 
34. VISTA PREVISUALIZADA
Antes de guardar cambios importantes, el usuario podrá visualizar cómo quedará el horario.
Esto será especialmente útil al:
* crear un horario;
* importar una estructura;
* duplicar una semana;
* cambiar muchas columnas.
 
⸻
 
35. MODO EDICIÓN VS MODO CONSULTA
Habrá dos estados principales.
MODO CONSULTA
El horario se ve limpio.
No aparecen controles innecesarios.
MODO EDICIÓN
Aparecen:
* botones;
* menús;
* controles;
* opciones de movimiento;
* añadir;
* eliminar.
Esto mantendrá la interfaz normal mucho más limpia.
 
⸻
 
36. GUARDADO
Los cambios deberán guardarse automáticamente.
No se dependerá exclusivamente de un botón:
Guardar
El usuario podrá salir y sus modificaciones deberán persistir.
Podrá existir un indicador discreto:
Guardado ✓
o:
Sincronizando…
 
⸻
 
37. SINCRONIZACIÓN VISUAL
Cuando se modifique algo:
Cambio local
↓
Guardar localmente
↓
Sincronizar Cloud
↓
✓ Sincronizado
Si existe un problema:
⚠ No se pudo sincronizar
pero el cambio local no deberá desaparecer.
 
⸻
 
38. DESHACER
El editor deberá contemplar:
Deshacer
para acciones recientes.
Ejemplos:
* eliminar bloque;
* mover bloque;
* cambiar color;
* eliminar fila;
* eliminar columna.
Especialmente importante en móvil.
 
⸻
 
39. REHACER
También podrá existir:
Rehacer
cuando sea compatible con la arquitectura del historial local.
 
⸻
 
40. CONFIRMACIONES INTELIGENTES
No se deberán mostrar confirmaciones para absolutamente todo.
Por ejemplo:
Cambiar color:
→ inmediato.
Eliminar una columna con información:
→ confirmación.
Eliminar una columna vacía:
→ puede ser inmediato.
Esto reducirá fricción.
 
⸻
 
41. MENÚ CONTEXTUAL
Cada bloque podrá tener un menú ···.
Opciones principales:
Editar
Duplicar
Copiar
Mover
Cambiar color
Cambiar icono
Ver detalles
Eliminar
En móvil deberá aparecer como panel inferior o menú táctil cómodo.
 
⸻
 
42. ACCIONES RÁPIDAS
Se podrán implementar gestos.
Ejemplo:
Deslizar bloque a la izquierda
→ acciones.
Deslizar bloque a la derecha
→ acciones.
Pero los gestos nunca serán la única forma de realizar una acción importante.
 
⸻
 
43. EDICIÓN MASIVA
Para horarios grandes se podrá seleccionar varios bloques.
Ejemplo:
Seleccionar:
* Matemáticas lunes.
* Matemáticas martes.
* Matemáticas jueves.
Acción:
Cambiar color
→ todos.
O:
Eliminar
→ todos.
 
⸻
 
44. SELECCIÓN MÚLTIPLE
El usuario podrá activar:
Seleccionar
y marcar varios elementos.
Después:
* mover;
* duplicar;
* eliminar;
* cambiar color;
* cambiar icono.
Esto será especialmente útil para modificaciones al cambiar de curso.
 
⸻
 
45. CAMBIO DE SEMANA
Aunque el horario base sea recurrente, el editor deberá poder mostrar diferentes periodos.
Ejemplo:
Semana actual
Semana A
Semana B
Esto preparará el sistema para horarios alternos.
 
⸻
 
46. MODO SEMANA COMPLETA
Vista:
L   M   X   J   V   S   D
Ideal para planificación.
 
⸻
 
47. MODO DÍA
En móvil podrá existir una vista:
LUNES 24

08:00
Matemáticas

09:00
Física

10:00
Inglés
Esta vista será especialmente útil cuando haya muchos bloques.
 
⸻
 
48. MODO AGENDA
También podrá existir una visualización cronológica:
08:00 — Matemáticas
09:00 — Física
11:00 — Inglés
17:00 — Entrenamiento
La misma información se mostrará de otra manera.
 
⸻
 
49. CAMBIO ENTRE VISTAS
El usuario podrá cambiar rápidamente:
Semana | Día | Agenda
La información seguirá procediendo de la misma fuente.
No habrá tres horarios independientes.
 
⸻
 
50. MODO HOY
Existirá un acceso rápido:
HOY
que llevará directamente a la fecha actual.
Si estamos en miércoles:
HOY → Miércoles
 
⸻
 
51. NAVEGACIÓN POR FECHAS
Podrá utilizarse:
* día anterior;
* día siguiente;
* selector de fecha;
* volver a hoy.
La navegación deberá ser rápida.
 
⸻
 
52. EDICIÓN DE UNA FECHA CONCRETA
Será importante diferenciar:
Modificar el horario recurrente
de:
Modificar solamente este día.
Ejemplo:
Matemáticas normalmente:
Lunes 08:00.
El usuario puede seleccionar:
“Solo este lunes”.
y cambiarlo a:
09:00.
No deberá modificar todos los lunes.
 
⸻
 
53. OPCIONES AL MODIFICAR
Cuando se modifique un bloque recurrente, el sistema podrá preguntar:
¿Qué quieres cambiar?
Solo este día
Todos los días iguales
Desde esta fecha en adelante
Esto será esencial para evitar errores.
 
⸻
 
54. INFORMACIÓN DE AULA
Los bloques podrán mostrar opcionalmente:
🏫 Aula 2.14
pero solo si el usuario ha configurado el aula.
No se deberá mostrar información vacía.
 
⸻
 
55. INFORMACIÓN DEL PROFESOR
Igualmente:
👤 Profesor
solo aparecerá si existe.
Esto mantiene la interfaz limpia.
 
⸻
 
56. ETIQUETAS
Las actividades podrán tener etiquetas:
* Examen.
* Importante.
* Práctica.
* Laboratorio.
* Online.
* Presencial.
Las etiquetas podrán utilizarse posteriormente para filtros y automatizaciones.
 
⸻
 
57. FILTROS
En horarios grandes podrá existir filtrado.
Ejemplo:
Mostrar solo:
* Estudios.
* Entrenamiento.
* Colegio.
O:
Mostrar solo Matemáticas.
Esto será especialmente útil cuando haya múltiples horarios simultáneos.
 
⸻
 
58. VISIBILIDAD DE HORARIOS
Cada horario podrá tener:
Visible
o:
Oculto
Ejemplo:
☑ Colegio
☑ Entrenamiento
☐ Trabajo
☐ Estudio
HOY podrá utilizar únicamente los activos.
 
⸻
 
59. MODO SOLO CONSULTA
Podrá existir una opción:
Bloquear edición
útil para evitar modificaciones accidentales.
El usuario tendría que pulsar:
Editar horario
para activar los controles.
 
⸻
 
60. ACCESIBILIDAD
El editor deberá contemplar:
* contraste;
* tamaños de texto;
* áreas táctiles grandes;
* etiquetas accesibles;
* navegación por teclado en escritorio;
* soporte para lectores de pantalla;
* no depender únicamente del color.
Por ejemplo:
Una actividad no deberá identificarse únicamente porque sea roja.
También tendrá nombre/icono.
 
⸻
 
61. MODO OSCURO
El editor deberá integrarse con el modo oscuro global del Sistema Personal.
No se deberán crear colores que sean ilegibles en dark mode.
Los colores de las asignaturas deberán adaptarse visualmente.
 
⸻
 
62. DISEÑO PREMIUM
HORARIO TOP deberá mantener el lenguaje visual del Sistema Personal:
* elegante;
* limpio;
* moderno;
* rápido;
* premium;
* animaciones suaves;
* jerarquía visual clara.
No debe parecer una hoja de cálculo incrustada.
 
⸻
 
63. ANIMACIONES
Las animaciones deberán utilizarse únicamente donde aporten claridad.
Ejemplos:
* crear bloque;
* mover bloque;
* abrir detalles;
* cambiar de día;
* añadir columna.
No se deberán utilizar animaciones excesivas que ralenticen el uso.
 
⸻
 
64. RENDIMIENTO
El editor deberá ser rápido incluso con:
* muchos bloques;
* varios horarios;
* muchas asignaturas;
* varias semanas;
* múltiples eventos.
No deberá recalcular toda la aplicación por cada pequeño cambio.
 
⸻
 
65. ESTADO LOCAL
Durante la edición se utilizará un estado local para proporcionar respuesta inmediata.
Después:
Estado local
↓
Persistencia
↓
Cloud
Esto evita que cada toque dependa de una petición de red.
 
⸻
 
66. MANEJO DE ERRORES
Si falla Cloud:
El usuario deberá seguir viendo sus cambios locales.
Ejemplo:
Cambio guardado en el dispositivo.
Sin conexión: se sincronizará automáticamente cuando vuelva Internet.
Nunca deberá desaparecer un horario simplemente porque falle la red.
 
⸻
 
67. CAMBIOS SIMULTÁNEOS
Si otro dispositivo modifica el horario mientras el usuario está editando, la aplicación deberá poder detectar la situación.
No deberá sobrescribir automáticamente información nueva sin comprobar el conflicto.
La resolución detallada quedará vinculada al sistema de sincronización definido en la Fase 2.
 
⸻
 
68. IMPORTACIÓN FUTURA
Aunque la importación se desarrollará posteriormente, el editor deberá estar preparado para recibir horarios procedentes de:
* CSV.
* Excel.
* PDF.
* imagen.
* introducción manual.
* IA.
Esto será especialmente interesante para un usuario que ya tenga un horario hecho.
 
⸻
 
69. IMPORTACIÓN MEDIANTE IA
En el futuro el usuario podrá proporcionar:
“Mi horario es este…”
y la IA podrá transformar la información en:
Lunes → Matemáticas 08:00
Martes → Inglés 09:00
...
para después mostrar una vista previa antes de guardar.
La arquitectura del editor deberá permitir que los datos lleguen desde una fuente externa y sean revisados antes de insertarse.
 
⸻
 
70. PREVISUALIZACIÓN ANTES DE IMPORTAR
Nunca se deberá permitir que una importación automática modifique el horario directamente sin revisión.
Flujo:
IA / Importador
↓
Datos detectados
↓
PREVISUALIZACIÓN
↓
Usuario revisa
↓
Confirmar
↓
Guardar
Esto reducirá errores.
 
⸻
 
71. AUTOGUARDADO
La aplicación deberá guardar cambios automáticamente.
Pero se evitarán cientos de peticiones a Cloud por cada pulsación.
Se podrá utilizar:
* debounce;
* cola de cambios;
* sincronización agrupada.
Ejemplo conceptual:
Usuario modifica
↓
Cambio local inmediato
↓
espera breve
↓
agrupa cambios
↓
sincroniza
 
⸻
 
72. ESTADO DE SINCRONIZACIÓN
El usuario podrá saber si todo está correctamente sincronizado.
Estados:
✓ Sincronizado
↻ Sincronizando
⚠ Pendiente
✕ Error
La información será discreta.
 
⸻
 
73. CREACIÓN ULTRARRÁPIDA
El flujo ideal para crear un horario completo será:
Crear horario
↓
Elegir plantilla
↓
Crear columnas
↓
Crear franjas
↓
Tocar celda
↓
Escribir asignatura
↓
Guardar
Con autocompletado y duplicación:
Crear una vez
↓
Duplicar
↓
Modificar
El usuario no tendrá que repetir información innecesariamente.
 
⸻
 
74. EJEMPLO COMPLETO
El usuario crea:
Colegio
Selecciona:
Lunes–Viernes
El sistema genera la cuadrícula.
El usuario toca:
Lunes 08:00
Escribe:
Matemáticas
El sistema detecta que no existe.
Crea Matemáticas.
El usuario selecciona:
Azul + calculadora
Después:
Duplicar → Martes
y:
Duplicar → Jueves
Después crea:
Biología
y:
Inglés
En pocos minutos tiene todo el horario.
 
⸻
 
75. RESULTADO ESPERADO
El editor debe conseguir algo fundamental:
Que configurar un horario de una semana completa sea una tarea de minutos, no de media hora.
Y al mismo tiempo:
Que un usuario avanzado pueda personalizar prácticamente cualquier aspecto.
 
⸻
 
76. CRITERIOS DE ACEPTACIÓN
La Fase 3 se considerará correctamente implementada cuando:
* se pueda crear un horario;
* se puedan crear y eliminar columnas;
* se puedan crear y eliminar filas;
* se puedan modificar horarios;
* se puedan crear bloques;
* se puedan editar;
* se puedan mover;
* se puedan duplicar;
* se puedan copiar;
* se puedan eliminar;
* se puedan asociar actividades;
* se puedan utilizar colores;
* se puedan utilizar iconos;
* se puedan detectar conflictos;
* se pueda editar desde móvil;
* exista modo semana;
* exista modo día;
* exista vista agenda;
* exista acceso a HOY;
* exista guardado automático;
* exista persistencia;
* exista sincronización;
* los errores de red no destruyan cambios;
* la interfaz sea usable en dark mode;
* el sistema sea rápido.
 
⸻
 
77. RESULTADO TÉCNICO DE LA FASE
Al finalizar esta fase quedará definido el comportamiento completo del editor visual.
La estructura será:
HORARIO TOP
│
├── Crear horario
│
├── Plantillas
│
├── Cuadrícula
│   ├── Columnas
│   ├── Filas
│   └── Bloques
│
├── Actividades
│
├── Edición
│
├── Movimiento
│
├── Duplicación
│
├── Colores
│
├── Iconos
│
├── Conflictos
│
├── Vistas
│   ├── Semana
│   ├── Día
│   └── Agenda
│
└── Sincronización
 
⸻
 
78. CONEXIÓN CON LAS SIGUIENTES FASES
Esta fase deja preparado el editor para que las siguientes fases puedan añadir funcionalidades mucho más potentes.
La siguiente será especialmente importante:
FASE 4 — CONFIGURACIÓN AVANZADA DE COLUMNAS, FILAS Y BLOQUES
Ahí se profundizará en:
* estructuras totalmente personalizables;
* diferentes tipos de cuadrícula;
* horarios irregulares;
* semanas A/B;
* periodos;
* plantillas avanzadas;
* bloques que ocupan varias franjas;
* columnas especiales;
* estructuras no escolares;
* configuración visual avanzada;
* comportamiento responsive;
* reglas de edición;
* reorganización masiva.
La Fase 4 llevará el editor desde un horario escolar normal hasta un constructor de horarios prácticamente universal.
 
⸻
 
PROGRESO REAL DEL MÓDULO
FASE 1 — Arquitectura general: completada FASE 2 — Modelo de datos + Cloud + Supabase: completada FASE 3 — Editor visual: completada
PROGRESO REAL: 
24% / 100%
La Fase 3 tiene un peso importante porque define una de las partes que más interacción tendrá con el usuario, pero todavía quedan las fases de personalización avanzada, calendario/HOY, mochila, tareas, automatizaciones, IA, seguridad, sincronización profunda e integración final.

HORARIO TOP
FASE 2 — MODELO DE DATOS + CLOUD + SUPABASE
1. OBJETIVO
En esta fase se transforma la arquitectura conceptual de la Fase 1 en una arquitectura de datos real, preparada para que HORARIO TOP funcione correctamente dentro del Sistema Operativo Personal.
El objetivo no es crear simplemente una tabla llamada horarios.
El objetivo es construir una estructura capaz de soportar:
* múltiples horarios;
* múltiples tipos de horario;
* asignaturas;
* actividades;
* bloques horarios;
* calendario;
* tareas;
* eventos;
* excepciones;
* material escolar;
* mochila;
* recurrencias;
* prioridades;
* notificaciones;
* sincronización;
* IA;
* historial;
* varios dispositivos;
* cambios futuros.
La arquitectura deberá evitar duplicaciones y permitir que los diferentes módulos del Sistema Personal compartan información.
 
⸻
 
2. PRINCIPIO DE LA BASE DE DATOS
La regla principal será:
Cada dato importante debe existir una sola vez y poder ser reutilizado por los módulos que lo necesiten.
Por ejemplo:
No crear:
Matemáticas en horario
Matemáticas en tareas
Matemáticas en mochila
Matemáticas en exámenes
como cuatro textos independientes.
Crear una entidad:
ASIGNATURA
Matemáticas
y permitir que otros sistemas la relacionen.
Así:
MATEMÁTICAS
│
├── Horario
├── Tareas
├── Exámenes
├── Material
├── Mochila
├── Archivos
└── Estadísticas
 
⸻
 
3. USUARIO
Toda la información de HORARIO TOP estará asociada al usuario autenticado.
Conceptualmente:
USER
 │
 ├── Horarios
 ├── Actividades
 ├── Asignaturas
 ├── Eventos
 ├── Tareas
 ├── Material
 ├── Excepciones
 └── Configuración
Nunca se deberá confiar únicamente en identificadores enviados desde el cliente.
Supabase deberá utilizar el usuario autenticado como raíz de seguridad.
 
⸻
 
4. IDENTIFICADORES
Todas las entidades importantes tendrán un identificador único.
Se recomienda utilizar UUID.
Ejemplo:
user_id
schedule_id
subject_id
block_id
event_id
task_id
material_id
exception_id
Esto permitirá relacionar información de forma segura y evitar conflictos entre dispositivos.
 
⸻
 
5. TABLA 
schedules
Representará cada horario creado.
Campos conceptuales:
id
user_id
name
type
description
is_active
is_default
start_date
end_date
timezone
created_at
updated_at
name
Ejemplos:
* Colegio.
* Entrenamiento.
* Estudio.
* Trabajo.
type
Ejemplos:
school
training
study
work
personal
custom
Deberá poder ampliarse en el futuro.
is_active
Permitirá activar/desactivar un horario.
is_default
Permitirá identificar el horario principal.
 
⸻
 
6. HORARIOS SIMULTÁNEOS
La base de datos deberá permitir:
Colegio
+
Entrenamiento
+
Estudio
sin necesidad de mezclar físicamente los tres horarios.
Después HOY podrá consultar todos los horarios activos.
 
⸻
 
7. PERIODOS DE VALIDEZ
Cada horario podrá tener:
start_date
end_date
Esto permitirá:
Horario curso 2026/27
y posteriormente:
Horario curso 2027/28
sin borrar el anterior.
También permitirá horarios temporales.
 
⸻
 
8. TABLA 
schedule_columns
La cuadrícula no debe depender de que existan exactamente siete días.
Cada horario podrá tener sus propias columnas.
Campos:
id
schedule_id
name
short_name
position
day_of_week
is_visible
color
icon
Para el colegio:
Lunes
Martes
Miércoles
Jueves
Viernes
Pero otro horario podría tener:
Semana A
Semana B
o cualquier estructura personalizada.
 
⸻
 
9. TABLA 
schedule_rows
Las filas representan las franjas o divisiones del horario.
Campos:
id
schedule_id
label
start_time
end_time
position
is_visible
Ejemplo:
08:00–09:00
09:00–10:00
10:00–11:00
Pero también:
08:00–08:50
08:50–09:40
o cualquier configuración personalizada.
 
⸻
 
10. NO LIMITAR LAS FILAS
La interfaz podrá comenzar con una estructura predeterminada, por ejemplo:
7 columnas
8 filas
pero la base de datos nunca deberá asumir esos límites.
Debe permitir:
3 columnas
5 columnas
7 columnas
8 columnas
10 columnas
y tantas filas como necesite el usuario.
 
⸻
 
11. TABLA 
subjects
Esta será una de las entidades principales.
Representará asignaturas o actividades reutilizables.
Campos conceptuales:
id
user_id
name
short_name
type
color
icon
teacher
room
description
is_active
created_at
updated_at
Ejemplos:
Matemáticas
Biología
Inglés
Física
Calistenia
Entrenamiento
Trabajo
 
⸻
 
12. TIPOS DE ACTIVIDAD
type permitirá diferenciar:
subject
training
work
study
personal
meeting
other
La arquitectura deberá permitir añadir nuevos tipos posteriormente.
 
⸻
 
13. TABLA 
schedule_blocks
Esta tabla representará cada elemento colocado dentro del horario.
Campos:
id
schedule_id
subject_id
column_id
row_id
start_time
end_time
title
description
location
color_override
icon_override
position
created_at
updated_at
La relación principal será:
Horario
 ↓
Bloque
 ↓
Actividad/Asignatura
 
⸻
 
14. BLOQUES CON DURACIONES DIFERENTES
No todos los bloques tienen que ocupar exactamente una fila.
Por ello deberá contemplarse:
start_time
end_time
en lugar de depender exclusivamente de row_id.
Ejemplo:
08:00–09:00 Matemáticas
09:00–09:30 Recreo
09:30–11:00 Física
La interfaz podrá representar correctamente estas diferencias.
 
⸻
 
15. COLOR GLOBAL VS COLOR DEL BLOQUE
Una asignatura podrá tener un color general:
Matemáticas → azul
pero un bloque concreto podrá sobrescribirlo:
Matemáticas → azul
Bloque especial → amarillo
Por eso existirán:
subject.color
schedule_block.color_override
Si no existe override, se utiliza el color de la asignatura.
 
⸻
 
16. ICONOS
El mismo principio se aplicará a los iconos.
Una asignatura podrá tener:
icon = calculator
pero un evento especial podrá tener otro icono.
Esto permitirá mantener una identidad visual consistente.
 
⸻
 
17. TABLA 
schedule_exceptions
Será una pieza fundamental.
Representará modificaciones puntuales al horario recurrente.
Ejemplos:
No hay clase.
Cambio de hora.
Cambio de aula.
Actividad especial.
Profesor diferente.
Clase cancelada.
Clase añadida.
Campos conceptuales:
id
user_id
schedule_id
original_block_id
date
type
new_start_time
new_end_time
new_subject_id
new_title
new_location
reason
created_at
updated_at
 
⸻
 
18. TIPOS DE EXCEPCIÓN
Se contemplarán como mínimo:
cancel
move
replace
add
modify
Ejemplo:
Lunes normal:
09:00 Matemáticas

Excepción:
lunes 12 → Matemáticas cancelada
El horario original no se destruye.
 
⸻
 
19. REGLA DE PRIORIDAD
Cuando exista una excepción:
EXCEPCIÓN
tendrá prioridad sobre:
HORARIO RECURRENTE
Por tanto:
Horario base
     ↓
¿Existe excepción?
     ↓
Sí → utilizar excepción
No → utilizar horario normal
 
⸻
 
20. CALENDARIO
HORARIO TOP deberá integrarse con el sistema global de calendario.
No se recomienda crear un calendario completamente independiente.
Debe existir una capa común de eventos.
Conceptualmente:
CALENDAR_EVENT
podrá representar:
* examen;
* cita;
* entrenamiento;
* evento;
* tarea con fecha;
* actividad especial;
* evento derivado del horario.
 
⸻
 
21. TABLA 
calendar_events
Campos:
id
user_id
title
description
start_at
end_at
all_day
type
priority
location
color
source
source_id
created_at
updated_at
source permitirá conocer de dónde procede.
Ejemplo:
schedule
task
training
manual
system
 
⸻
 
22. EVITAR DUPLICACIONES
Un bloque recurrente del horario no debería convertirse automáticamente en miles de registros físicos.
Por ejemplo:
Matemáticas
todos los lunes
08:00
deberá almacenarse como una regla recurrente.
Cuando HOY necesite consultar el lunes actual, el sistema calculará la ocurrencia correspondiente.
Esto reduce almacenamiento y facilita cambios.
 
⸻
 
23. RECURRENCIA
Se deberá preparar soporte para:
* diariamente;
* semanalmente;
* determinados días;
* cada dos semanas;
* semanas A/B;
* fechas de inicio;
* fechas de finalización;
* excepciones.
La arquitectura podrá utilizar una representación estructurada de reglas recurrentes.
 
⸻
 
24. TABLA 
tasks
Aunque las tareas pertenecerán al módulo de productividad/estudios, HORARIO TOP deberá poder relacionarse con ellas.
Campos relevantes:
id
user_id
title
description
subject_id
due_at
priority
status
completed_at
created_at
updated_at
Así:
Tarea
 ↓
Biología
 ↓
HOY
 
⸻
 
25. TABLA 
materials
Permitirá crear materiales asociados a una asignatura o actividad.
Ejemplo:
Libro de Biología
Libreta
Calculadora
Carpeta
Ordenador
Bata
Campos:
id
user_id
name
description
type
icon
color
is_active
created_at
updated_at
 
⸻
 
26. RELACIÓN ACTIVIDAD ↔ MATERIAL
No todos los materiales pertenecen exclusivamente a una asignatura.
Por ello se recomienda una tabla intermedia:
subject_materials
Campos:
subject_id
material_id
quantity
required
notes
Ejemplo:
Biología
→ Libro
→ Libreta
→ Carpeta
 
⸻
 
27. PREPARACIÓN DE LA MOCHILA
Posteriormente el sistema podrá hacer:
Horario de mañana
        ↓
Asignaturas
        ↓
Material asociado
        ↓
Material requerido
        ↓
MOCHILA
La mochila será, por tanto, una consecuencia de los datos existentes y no una lista completamente independiente.
 
⸻
 
28. TABLA 
backpack_items
La mochila podrá tener elementos concretos para una fecha.
Campos:
id
user_id
date
material_id
required
packed
source_subject_id
created_at
updated_at
Esto permitirá saber:
Mañana
☑ Libro Matemáticas
☐ Calculadora
☑ Libreta
 
⸻
 
29. RECORDATORIOS
Los recordatorios deberán poder vincularse a cualquier entidad.
Ejemplo:
recordatorio
 ↓
tarea
o:
recordatorio
 ↓
clase
o:
recordatorio
 ↓
evento
Esto evitará crear sistemas de recordatorios separados para cada módulo.
 
⸻
 
30. NOTIFICACIONES FUTURAS
La base de datos deberá permitir programar posteriormente:
notification
con:
user_id
type
title
body
scheduled_at
source
source_id
status
read_at
Esto permitirá que la aplicación construya notificaciones a partir del contexto.
 
⸻
 
31. VISTA 
HOY
HOY no debería tener una tabla independiente con copias de todos los datos.
Será una vista lógica/agregadora.
Recibirá información de:
Horario
+
Eventos
+
Tareas
+
Recordatorios
+
Entrenamiento
+
Hábitos
+
Objetivos
y construirá la agenda diaria.
 
⸻
 
32. EJEMPLO DE GENERACIÓN DE HOY
Fecha:
24/08/2026
El sistema consulta:
Horario
08:00 Matemáticas
09:00 Inglés
10:00 Física
Calendario
17:00 Entrenamiento
Tareas
Entregar trabajo de Biología.
Recordatorios
Llevar calculadora.
Resultado:
HOY
08:00 Matemáticas
09:00 Inglés
10:00 Física

📌 Entregar trabajo de Biología

17:00 Entrenamiento

🎒 Llevar calculadora
Todo se presenta en una única experiencia.
 
⸻
 
33. SUPABASE
La implementación Cloud se preparará para Supabase.
La arquitectura deberá contemplar:
Supabase Auth
        ↓
PostgreSQL
        ↓
RLS
        ↓
API / cliente
        ↓
Aplicación
El cliente nunca deberá tener acceso indebido a información de otros usuarios.
 
⸻
 
34. ROW LEVEL SECURITY
Todas las tablas que contengan datos personales deberán estar protegidas mediante RLS.
Regla conceptual:
Un usuario únicamente puede leer, crear, modificar o eliminar los registros que le pertenecen, salvo relaciones explícitamente autorizadas.
Ejemplo:
user_id = auth.uid()
será una de las bases de las políticas.
 
⸻
 
35. SEGURIDAD
Nunca se deberá confiar en:
* user_id enviado desde la interfaz;
* campos ocultos;
* IDs manipulables;
* comprobaciones exclusivamente JavaScript.
La seguridad deberá existir en la capa Cloud.
 
⸻
 
36. ÍNDICES
Se deberán preparar índices para las consultas más frecuentes.
Especialmente:
user_id
schedule_id
date
start_at
subject_id
is_active
Esto permitirá que HOY siga siendo rápido incluso cuando aumente mucho la cantidad de información.
 
⸻
 
37. 
created_at
Y 
updated_at
Todas las entidades importantes deberán guardar:
created_at
updated_at
Esto será necesario para:
* sincronización;
* debugging;
* historial;
* conflictos;
* auditoría;
* recuperación.
 
⸻
 
38. SOFT DELETE
Para determinadas entidades será preferible no eliminarlas físicamente inmediatamente.
Se podrá utilizar:
deleted_at
Esto permitirá:
* recuperar información;
* evitar problemas de sincronización;
* mantener referencias;
* realizar restauraciones.
 
⸻
 
39. SINCRONIZACIÓN MULTIDISPOSITIVO
El sistema deberá estar preparado para:
iPhone
   ↓
Supabase
   ↓
iPad
   ↓
Supabase
   ↓
Otro dispositivo
Los cambios deberán poder propagarse correctamente.
 
⸻
 
40. CONFLICTOS
Deberá existir una estrategia para conflictos.
Ejemplo:
Dispositivo A modifica:
Matemáticas → 09:00
Dispositivo B modifica:
Matemáticas → 10:00
La arquitectura deberá tener información suficiente para detectar el conflicto y aplicar una política definida posteriormente.
No se deberá sobrescribir información silenciosamente sin criterio.
 
⸻
 
41. CACHE LOCAL
La aplicación podrá mantener una copia local de los datos necesarios para que HORARIO TOP sea instantáneo.
Flujo:
Usuario abre HOY
       ↓
Datos locales disponibles
       ↓
Mostrar inmediatamente
       ↓
Sincronizar con Cloud
       ↓
Actualizar si hay cambios
Esto será especialmente importante para la experiencia móvil.
 
⸻
 
42. DATOS MÍNIMOS VS DATOS AVANZADOS
La creación de un horario deberá poder ser sencilla.
El usuario no estará obligado a rellenar:
* profesor;
* aula;
* descripción;
* material;
* icono;
* etiquetas.
Podrá empezar simplemente con:
Matemáticas
08:00
Lunes
Y posteriormente completar la información.
La base de datos sí estará preparada para almacenar todos esos datos adicionales.
 
⸻
 
43. CONFIGURACIÓN DEL USUARIO
La personalización del horario deberá almacenarse por usuario.
Ejemplos:
vista semanal
vista diaria
inicio de semana
formato 12/24 horas
mostrar aulas
mostrar iconos
mostrar colores
densidad
tamaño de texto
Esto permitirá personalizar la experiencia sin alterar los datos reales.
 
⸻
 
44. HISTORIAL
En fases posteriores podrá existir un historial de cambios.
Ejemplo:
24/08 17:30
Matemáticas
09:00 → 10:00
Esto puede ser útil para:
* recuperar cambios;
* resolver conflictos;
* detectar modificaciones;
* mostrar actividad.
No será obligatorio implementarlo completamente ahora, pero la arquitectura no debe impedirlo.
 
⸻
 
45. ESTRUCTURA RELACIONAL GENERAL
La arquitectura conceptual queda así:
USER
│
├── SCHEDULES
│   │
│   ├── COLUMNS
│   ├── ROWS
│   ├── BLOCKS
│   │     │
│   │     └── SUBJECTS
│   │
│   └── EXCEPTIONS
│
├── SUBJECTS
│   │
│   └── MATERIALS
│
├── CALENDAR EVENTS
│
├── TASKS
│
├── BACKPACK
│
├── REMINDERS
│
└── NOTIFICATIONS
 
⸻
 
46. FLUJO DE INFORMACIÓN
La arquitectura permitirá este flujo:
HORARIO
   ↓
BLOQUES
   ↓
ASIGNATURAS
   ↓
MATERIALES
   ↓
MOCHILA
Paralelamente:
HORARIO
   ↓
HOY
   ↑
CALENDARIO
   ↑
TAREAS
   ↑
ENTRENAMIENTO
   ↑
RECORDATORIOS
Y por encima:
                  IA
                  ↑
                  │
HORARIO ←→ HOY ←→ CALENDARIO
   ↓               ↓
MOCHILA          TAREAS
 
⸻
 
47. PREPARACIÓN PARA IA AVANZADA
La estructura deberá permitir que posteriormente la IA consulte información estructurada.
Ejemplo:
Usuario:
"¿Qué tengo mañana?"

Sistema:
1. Obtiene fecha.
2. Consulta horarios activos.
3. Calcula recurrencias.
4. Aplica excepciones.
5. Obtiene eventos.
6. Obtiene tareas.
7. Obtiene recordatorios.
8. Obtiene material.
9. Construye contexto.
10. Genera respuesta.
Esto será mucho más fiable que enviar a la IA únicamente el contenido visual de la pantalla.
 
⸻
 
48. FUTURA CAPA DE ACCIONES DE IA
La arquitectura también deberá permitir que la IA no solamente consulte.
Posteriormente podrá:
Crear horario.
Modificar horario.
Crear tarea.
Crear evento.
Añadir recordatorio.
Preparar mochila.
Detectar conflictos.
Reorganizar bloques.
Todas las acciones deberán pasar por las mismas reglas de validación y seguridad que las acciones manuales.
La IA no tendrá permisos especiales para saltarse las reglas.
 
⸻
 
49. VALIDACIONES
El backend deberá validar aspectos como:
* horarios pertenecientes al usuario;
* fechas válidas;
* horas válidas;
* relaciones existentes;
* permisos;
* entidades activas;
* conflictos cuando corresponda.
La interfaz puede ayudar al usuario, pero el backend deberá ser la autoridad final.
 
⸻
 
50. PREPARACIÓN PARA ESCALABILIDAD
La arquitectura deberá permitir posteriormente añadir:
* profesores;
* aulas;
* centros;
* cursos;
* grupos;
* compañeros;
* proyectos;
* etiquetas;
* documentos;
* recursos educativos;
* estadísticas;
* asistencia;
* notas;
* planificación académica.
No se implementarán necesariamente ahora.
Pero la estructura no deberá bloquear esas posibilidades.
 
⸻
 
51. REGLA DE COMPATIBILIDAD CON EL SISTEMA PERSONAL
HORARIO TOP no podrá crear una arquitectura incompatible con los demás módulos.
Antes de implementar las tablas definitivas en producción se deberá comprobar:
* nombres de tablas;
* convenciones de IDs;
* autenticación;
* RLS;
* timestamps;
* estructura de usuarios;
* sistema de almacenamiento;
* patrones de Supabase existentes;
* sistema de sincronización.
La implementación final deberá adaptarse a la arquitectura global del Sistema Personal.
 
⸻
 
52. RESULTADO DE LA FASE 2
Al terminar esta fase queda definido el modelo técnico conceptual necesario para construir HORARIO TOP.
Tenemos:
USUARIO
↓
HORARIOS
↓
COLUMNAS
↓
FILAS
↓
BLOQUES
↓
ASIGNATURAS
↓
MATERIALES
y además:
HORARIO
↓
EXCEPCIONES
↓
CALENDARIO
↓
HOY
↓
TAREAS
↓
MOCHILA
↓
NOTIFICACIONES
Todo ello preparado para:
* Supabase.
* RLS.
* sincronización.
* múltiples dispositivos.
* IA.
* futuras automatizaciones.
* ampliaciones del Sistema Personal.
 
⸻
 
53. LO QUE NO SE IMPLEMENTA TODAVÍA
Esta fase define la estructura.
Todavía NO se debe construir definitivamente:
* el editor visual;
* la cuadrícula interactiva;
* el drag & drop;
* el sistema de colores;
* la interfaz final;
* la mochila inteligente;
* las notificaciones;
* las automatizaciones de IA.
Eso llegará en las siguientes fases.
 
⸻
 
54. SIGUIENTE FASE
La FASE 3 estará dedicada al EDITOR VISUAL DE HORARIOS.
Ahí se definirá exactamente cómo el usuario:
* crea un horario;
* elige el número de columnas;
* añade y elimina columnas;
* crea filas;
* cambia horarios;
* añade bloques;
* mueve bloques;
* edita bloques;
* cambia colores;
* añade iconos;
* duplica información;
* reorganiza la cuadrícula;
* utiliza el sistema desde móvil;
* y consigue crear un horario completo con el mínimo número de toques.
La prioridad será que sea potente por dentro y absurdamente sencillo por fuera.
 
⸻
 
PROGRESO REAL DEL MÓDULO
FASE 1 — Arquitectura general: completada FASE 2 — Datos + Cloud + Supabase: completada
PROGRESO REAL: 
16% / 100%
La Fase 2 tiene más peso que la Fase 1 porque establece una parte crítica de la infraestructura que permitirá que HORARIO TOP funcione correctamente a largo plazo.

HORARIO TOP
FASE 1 — ARQUITECTURA GENERAL DEL SISTEMA
1. OBJETIVO DE ESTA FASE
HORARIO TOP no se desarrollará como una simple pantalla donde el usuario consulta sus clases.
Se diseñará como un sistema central de planificación temporal integrado dentro del Sistema Operativo Personal.
La idea fundamental es:
El usuario introduce su horario una vez y el resto del Sistema Personal puede utilizar automáticamente esa información.
El horario deberá poder alimentar y relacionarse con:
* HOY.
* Calendario.
* Agenda.
* Tareas.
* Exámenes.
* Recordatorios.
* Estudios.
* Mochila.
* Hábitos.
* Entrenamientos.
* Objetivos.
* Rutinas.
* Notificaciones.
* Automatizaciones.
* IA.
La arquitectura deberá ser suficientemente flexible para soportar tanto un horario escolar sencillo como sistemas de horarios mucho más complejos en el futuro.
 
⸻
 
2. PRINCIPIO FUNDAMENTAL
HORARIO TOP tendrá dos conceptos separados:
A. EL HORARIO
Representa una estructura temporal recurrente.
Ejemplo:
Hora	Lunes	Martes	Miércoles	Jueves	Viernes
08:00	Matemáticas	Inglés	Historia	Física	Matemáticas
09:00	Física	Matemáticas	Inglés	Lengua	Historia
Esto representa lo que normalmente ocurre.
B. LAS ACTIVIDADES DEL DÍA
Representan cosas concretas que ocurren una fecha determinada.
Ejemplo:
* Lunes 24 → examen de Matemáticas.
* Lunes 24 → entregar trabajo.
* Lunes 24 → entrenamiento.
* Lunes 24 → cita.
* Lunes 24 → tarea.
* Lunes 24 → recordatorio.
Esto representa lo que realmente hay que hacer ese día.
Ambos sistemas estarán conectados, pero no serán el mismo objeto.
 
⸻
 
3. ESTRUCTURA GENERAL
HORARIO TOP se construirá alrededor de cinco capas:
CAPA 1 — HORARIOS
Contendrá todos los horarios creados por el usuario.
Ejemplos:
* Colegio.
* Entrenamiento.
* Estudio.
* Trabajo.
* Rutina.
* Personalizado.
Un usuario podrá tener más de un horario.
 
⸻
 
CAPA 2 — BLOQUES HORARIOS
Cada horario estará formado por bloques.
Un bloque tendrá conceptualmente:
* Identificador.
* Día.
* Hora de inicio.
* Hora de finalización.
* Título.
* Tipo.
* Color.
* Icono.
* Descripción.
* Ubicación.
* Etiquetas.
* Información adicional.
Esto permitirá que una clase, entrenamiento o actividad pueda representarse de la misma forma a nivel técnico.
 
⸻
 
CAPA 3 — CALENDARIO
El calendario recogerá acontecimientos asociados a fechas concretas.
Un evento podrá estar:
* Vinculado a un bloque horario.
* Vinculado a una asignatura.
* Vinculado a una tarea.
* Vinculado a un objetivo.
* Vinculado a un entrenamiento.
* Sin vinculación.
 
⸻
 
CAPA 4 — HOY
HOY será la capa que reúna toda la información relevante.
Al abrir HOY, el sistema deberá ser capaz de construir automáticamente una línea temporal del día.
Ejemplo:
08:00 — Matemáticas
09:00 — Física
10:00 — Recreo
11:00 — Inglés
16:00 — Entregar trabajo de Historia
18:00 — Entrenamiento
20:00 — Estudiar Biología
El usuario no debería tener que entrar en cinco módulos diferentes para saber qué tiene que hacer.
 
⸻
 
CAPA 5 — INTELIGENCIA
Sobre las capas anteriores se construirá posteriormente la lógica inteligente.
Esta capa podrá interpretar:
* Qué tiene el usuario hoy.
* Qué tiene mañana.
* Qué tareas están pendientes.
* Qué necesita preparar.
* Qué conflictos existen.
* Qué actividades se repiten.
* Qué debería aparecer como prioridad.
Esta capa será desarrollada en fases posteriores, pero desde la Fase 1 se dejará preparada la arquitectura para ella.
 
⸻
 
4. TIPOS DE HORARIO
El sistema no debe asumir que únicamente existe el horario escolar.
Se establecerá un sistema genérico de tipos.
HORARIO ESCOLAR
Pensado para:
* Instituto.
* Colegio.
* Universidad.
* Formación.
Podrá contener asignaturas, aulas, profesores y material.
HORARIO PERSONALIZADO
El usuario podrá crear cualquier estructura.
Ejemplos:
* Horario de estudio.
* Horario de entrenamiento.
* Horario de trabajo.
* Rutina diaria.
* Plan semanal.
* Otro.
MÚLTIPLES HORARIOS
El sistema deberá permitir tener varios horarios simultáneamente.
Por ejemplo:
Horario Colegio
* ● 
Horario Entrenamiento
* ● 
Horario Estudio
Posteriormente podrán mostrarse juntos dentro de HOY.
 
⸻
 
5. HORARIO RECURRENTE VS. HORARIO REAL
Esta distinción será fundamental.
Un horario recurrente puede decir:
Martes — 10:00 — Biología.
Pero puede existir una excepción:
Martes 15 — no hay Biología.
O:
Martes 22 — Biología cambia a 12:00.
Por ello el sistema deberá soportar:
REGLA BASE
Lo que ocurre normalmente.
EXCEPCIÓN
Un cambio puntual.
EVENTO REAL
Lo que finalmente ocurre en una fecha concreta.
Esto permitirá manejar:
* Vacaciones.
* Festivos.
* Días sin clase.
* Excursiones.
* Cambios de aula.
* Cambios de profesor.
* Exámenes.
* Sustituciones.
* Horarios especiales.
* Semanas diferentes.
 
⸻
 
6. DISEÑO DE LA CUADRÍCULA
La interfaz deberá partir de una cuadrícula visual.
Ejemplo inicial:
7 columnas × 8 filas
Pero esta estructura NO estará bloqueada.
El usuario podrá:
* Añadir columnas.
* Eliminar columnas.
* Añadir filas.
* Eliminar filas.
* Modificar nombres.
* Modificar horarios.
* Cambiar tamaños.
* Editar bloques.
La cuadrícula será un editor, no una imagen estática.
 
⸻
 
7. COLUMNAS
Las columnas podrán representar:
* Lunes.
* Martes.
* Miércoles.
* Jueves.
* Viernes.
* Sábado.
* Domingo.
Pero el sistema no dependerá obligatoriamente de esos nombres.
En un horario personalizado podrían representar:
* Persona 1.
* Persona 2.
* Semana A.
* Semana B.
* Proyecto 1.
* Proyecto 2.
Por tanto, técnicamente deberán ser columnas configurables.
 
⸻
 
8. FILAS
Las filas representarán normalmente franjas temporales.
Ejemplo:
* 08:00.
* 09:00.
* 10:00.
* 11:00.
* 12:00.
Pero tampoco se limitarán a una hora fija.
El sistema deberá poder soportar:
* 30 minutos.
* 45 minutos.
* 50 minutos.
* 60 minutos.
* Franjas personalizadas.
Incluso bloques cuya duración sea diferente.
 
⸻
 
9. BLOQUES VISUALES
Cada actividad dentro de la cuadrícula será un bloque independiente.
Ejemplo:
MATEMÁTICAS
08:00–09:00
El bloque podrá contener:
* Nombre.
* Color.
* Icono.
* Hora.
* Ubicación.
* Etiquetas.
Al tocarlo se abrirá su información completa.
 
⸻
 
10. PERSONALIZACIÓN VISUAL
El usuario tendrá control sobre la apariencia.
Se contemplará:
COLORES
Cada actividad podrá tener su propio color.
Ejemplo:
* Matemáticas → azul.
* Inglés → verde.
* Física → morado.
* Entrenamiento → rojo.
ICONOS
Cada actividad podrá tener un icono.
TIPOGRAFÍA
Se podrá definir:
* Tamaño.
* Grosor.
* Alineación.
La arquitectura no deberá depender de una única tipografía.
ESTILO
Preparado para:
* Bordes.
* Esquinas.
* Espaciado.
* Densidad.
* Contraste.
* Modo oscuro.
* Modo claro.
 
⸻
 
11. IDENTIDAD DE LAS ACTIVIDADES
No se deberán almacenar simplemente textos repetidos.
Por ejemplo, si aparece:
Matemáticas
lunes, martes y jueves,
el sistema deberá poder entender que esos tres bloques hacen referencia a la misma entidad:
Asignatura: Matemáticas
Esto será especialmente importante para fases posteriores.
Permitirá conectar:
Matemáticas
→ horario
→ tareas
→ exámenes
→ notas
→ archivos
→ mochila
→ estadísticas
→ IA.
 
⸻
 
12. SISTEMA DE ENTIDADES
La arquitectura conceptual deberá separar:
HORARIO
Contenedor.
BLOQUE
Instancia temporal dentro del horario.
ASIGNATURA / ACTIVIDAD
Entidad reutilizable.
EVENTO
Acontecimiento concreto.
TAREA
Acción pendiente.
RECORDATORIO
Aviso.
MATERIAL
Objeto que puede asociarse a una actividad.
UBICACIÓN
Lugar asociado.
Esto evitará crear un sistema rígido difícil de ampliar.
 
⸻
 
13. CONEXIÓN CON EL SISTEMA PERSONAL
HORARIO TOP deberá funcionar como un módulo transversal.
No se creará aislado.
La arquitectura deberá contemplar conexiones futuras con los módulos existentes y los que se incorporen posteriormente.
Ejemplo:
Horario → Estudios
Si aparece Biología:
→ mostrar tareas de Biología.
Horario → Entrenamiento
Si aparece entrenamiento:
→ mostrar sesión correspondiente.
Horario → Productividad
Si existe una tarea:
→ mostrarla en HOY.
Horario → Mochila
Si mañana hay Física:
→ consultar material de Física.
Horario → IA
La IA podrá interpretar la agenda completa.
 
⸻
 
14. EL SISTEMA “HOY”
Aunque se desarrollará profundamente más adelante, desde esta fase se establece como uno de los objetivos principales.
HOY no será simplemente:
“Fecha actual”.
Será una vista agregadora inteligente.
Deberá poder responder visualmente:
¿QUÉ TENGO?
Horario.
¿QUÉ TENGO QUE HACER?
Tareas.
¿QUÉ NO PUEDO OLVIDAR?
Recordatorios.
¿QUÉ VIENE DESPUÉS?
Próximo bloque.
¿QUÉ NECESITO?
Mochila/material.
¿QUÉ ES PRIORITARIO?
Sistema de prioridades.
 
⸻
 
15. SISTEMA DE PRIORIDADES
Los elementos podrán tener prioridad.
Por ejemplo:
* Baja.
* Normal.
* Alta.
* Urgente.
Esto permitirá que HOY no muestre simplemente una lista enorme.
Podrá ordenar la información según:
Tiempo + importancia + urgencia + contexto.
 
⸻
 
16. PREPARACIÓN PARA LA MOCHILA
La mochila no se desarrollará todavía en esta fase.
Pero HORARIO TOP deberá almacenar la relación:
Actividad → Material necesario
Ejemplo:
Biología
* Libro.
* Libreta.
* Carpeta.
Matemáticas
* Libro.
* Calculadora.
* Libreta.
Entonces posteriormente el sistema podrá consultar:
“¿Qué tengo mañana?”
y transformar automáticamente el horario en:
“Mañana necesitas llevar…”
 
⸻
 
17. PREPARACIÓN PARA NOTIFICACIONES
El sistema deberá poder generar posteriormente eventos notificables.
Ejemplos:
07:45
“En 15 minutos tienes Matemáticas.”
21:00
“Mañana tienes Física. Necesitas calculadora.”
22:00
“Tienes una tarea de Historia pendiente.”
Las notificaciones no se implementarán todavía en profundidad, pero la estructura deberá admitirlas.
 
⸻
 
18. PREPARACIÓN PARA IA
La IA no deberá recibir simplemente una lista de textos.
La información deberá estar estructurada.
Ejemplo conceptual:
Fecha
↓
Horario
↓
Bloques
↓
Asignaturas
↓
Tareas
↓
Eventos
↓
Material
↓
Prioridades
Así, posteriormente la IA podrá recibir contexto estructurado y realizar acciones útiles.
Ejemplos:
“¿Qué tengo mañana?”
“¿Qué necesito preparar?”
“¿Cuándo tengo un hueco para estudiar?”
“Tengo demasiadas cosas mañana, ¿cómo organizo la tarde?”
“¿Qué tareas de Biología tengo pendientes?”
 
⸻
 
19. PREPARACIÓN PARA SUPABASE
La estructura se diseñará desde el principio pensando en:
* Autenticación.
* Base de datos.
* Relaciones.
* RLS.
* Sincronización.
* Multi-dispositivo.
* Persistencia.
* Recuperación.
* Escalabilidad.
No se creará una estructura provisional que después haya que rehacer.
La aplicación actual está evolucionando hacia una arquitectura PWA con Supabase y despliegue en Vercel, por lo que HORARIO TOP deberá integrarse dentro de esa dirección técnica.
 
⸻
 
20. SINCRONIZACIÓN
El sistema deberá estar preparado para que:
iPhone
↕️
Cloud
↕️
Otro dispositivo
Todos puedan acceder a la misma información.
El horario no deberá depender exclusivamente del almacenamiento local del dispositivo.
 
⸻
 
21. OFFLINE
La arquitectura deberá contemplar posteriormente funcionamiento offline.
El usuario podrá consultar información aunque momentáneamente no tenga conexión.
Cuando vuelva la conexión:
Local → sincronización → Cloud
Esto será especialmente importante para que HOY y el horario sean rápidos.
 
⸻
 
22. ESCALABILIDAD
HORARIO TOP no deberá diseñarse pensando únicamente:
“Una persona + un horario escolar”.
Deberá poder crecer hacia:
* Varios horarios.
* Varias estructuras.
* Semanas diferentes.
* Periodos académicos.
* Horarios temporales.
* Actividades recurrentes.
* Excepciones.
* Múltiples ubicaciones.
* Diferentes tipos de actividades.
 
⸻
 
23. PERIODOS Y SEMANAS
Posteriormente se podrá trabajar con:
* Semana normal.
* Semana A.
* Semana B.
* Horario de verano.
* Horario de invierno.
* Trimestre.
* Curso académico.
Por eso la arquitectura no debe asumir que existe un único horario eterno.
 
⸻
 
24. CAMBIO DE HORARIO
El usuario podrá eventualmente definir:
Horario 2026–2027
y posteriormente:
Horario 2027–2028
sin destruir el anterior.
Esto permitirá conservar histórico y cambiar de curso de forma limpia.
 
⸻
 
25. PRINCIPIO DE NO DUPLICACIÓN
Una regla fundamental:
El mismo dato no debería tener que introducirse varias veces.
Si el usuario crea:
Biología
no debería tener que volver a escribir “Biología” para:
* Horario.
* Tareas.
* Exámenes.
* Mochila.
* Estudios.
Todos los módulos deberán poder referenciar la misma entidad.
 
⸻
 
26. EXPERIENCIA DE USUARIO
El sistema deberá seguir una regla:
Máxima potencia con mínima fricción.
Crear una clase debería ser rápido.
Modificarla debería ser rápido.
Consultar el horario debería ser inmediato.
Crear un horario personalizado debería poder hacerse sin conocimientos técnicos.
El usuario no debería sentirse como si estuviera configurando una base de datos.
La complejidad deberá existir por debajo de la interfaz, no delante del usuario.
 
⸻
 
27. DISEÑO MOBILE-FIRST
El sistema se diseñará prioritariamente para móvil.
Especialmente:
* iPhone.
* Pantallas pequeñas.
* Uso con una mano.
* Toques.
* Scroll.
* Gestos.
* Edición rápida.
La vista de escritorio podrá aprovechar más espacio, pero no será el punto de partida.
 
⸻
 
28. ARQUITECTURA MODULAR
HORARIO TOP deberá dividirse conceptualmente en componentes independientes.
Por ejemplo:
HORARIO TOP
│
├── Gestor de horarios
│
├── Editor
│
├── Cuadrícula
│
├── Bloques
│
├── Actividades
│
├── Calendario
│
├── HOY
│
├── Tareas
│
├── Eventos
│
├── Mochila
│
├── Notificaciones
│
└── Motor inteligente
Esto permitirá modificar una parte sin romper las demás.
 
⸻
 
29. EVENTOS DEL SISTEMA
La arquitectura deberá permitir que los módulos se comuniquen.
Ejemplo conceptual:
USUARIO CREA EVENTO
        ↓
EVENTO GUARDADO
        ↓
CALENDARIO
        ↓
HOY
        ↓
NOTIFICACIONES
        ↓
IA
O:
USUARIO MODIFICA HORARIO
        ↓
HORARIO ACTUALIZADO
        ↓
HOY ACTUALIZADO
        ↓
MOCHILA ACTUALIZADA
        ↓
NOTIFICACIONES ACTUALIZADAS
La finalidad es evitar que cada módulo funcione como una isla.
 
⸻
 
30. FUTURO SISTEMA DE AUTOMATIZACIONES
La arquitectura deberá permitir reglas como:
Si mañana tengo Física → preparar mochila.
Si tengo examen → aumentar prioridad.
Si tengo una tarea para mañana → mostrarla en HOY.
Si cambia una clase → actualizar las vistas relacionadas.
Si estoy fuera de horario → mostrar la siguiente actividad.
Estas reglas no se implementan completamente todavía, pero se diseñará el sistema para soportarlas.
 
⸻
 
31. RESULTADO ESPERADO DE ESTA FASE
Al finalizar la Fase 1 debe quedar definida la arquitectura conceptual completa de HORARIO TOP.
No estamos construyendo todavía:
* La interfaz definitiva.
* La base de datos definitiva.
* El editor definitivo.
* La mochila.
* Las notificaciones.
* La IA.
Estamos estableciendo cómo debe funcionar todo el ecosistema antes de empezar a construirlo.
La siguiente fase será la traducción de esta arquitectura a una estructura técnica de datos y Cloud/Supabase, definiendo exactamente qué entidades existirán, cómo se relacionarán, qué información almacenará cada una, cómo se sincronizarán y cómo se protegerán.
 
⸻
 
PROGRESO REAL DEL MÓDULO
FASE 1 / 12 — COMPLETADA
Progreso estimado: 7% / 100%
El porcentaje no representa simplemente 1/12. Esta primera fase tiene un peso menor que las fases técnicas posteriores, especialmente las relacionadas con Cloud, sincronización, lógica, IA e integración.

Claro. Lo ideal es darle a Claude una introducción única y corta antes de pasarle la Prompt 1. Así entiende desde el principio que el proyecto completo tiene 4 fases y que debe ejecutarlas en orden, pero solo desarrolla la fase que tú le entregues.
