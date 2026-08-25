> **Nota de procedencia:** transcripción íntegra y sin resumir del bloque «SISTEMA DE SONIDO Y RACHAS — 5 + 4 fases» del documento
> `JC_FITNESS___ESTILO_DE_HOMBRE.txt` que Josué pegó en el chat (líneas 43519–50016 del original completo,
> conservado sin tocar en `ORIGINAL_JC_FITNESS_ESTILO_DE_HOMBRE.txt`).
>
> **No editar ni resumir este contenido.** Si Josué amplía o corrige el texto, añadir lo nuevo o
> sustituir el apartado afectado, nunca recortar apartados existentes. El análisis y las conclusiones
> van en `docs/`, nunca aquí.
>
> ⚠️ **El documento original está en orden inverso** dentro de cada módulo (la última fase aparece
> primero) y contiene fragmentos de conversación intercalados. Eso es intencionado y se conserva.

---

PROMPT MAESTRO — IMPLEMENTACIÓN DEL SISTEMA DE SONIDO Y RACHA DE JC LIFESTYLE
Quiero que implementes en JC Lifestyle un sistema completo de sonido + rachas + feedback + recompensas, siguiendo exactamente las especificaciones que aparecen en este prompt.
No quiero que simplemente me expliques cómo hacerlo. Quiero que lo implementes directamente en el proyecto existente, respetando la arquitectura, diseño, funcionalidades y estilo visual actuales de JC Lifestyle.
CONTEXTO
JC Lifestyle es una aplicación personal tipo “sistema operativo de vida”, con módulos de productividad, entrenamiento, hábitos, objetivos, progreso, etc.
Quiero añadir un sistema de sonido que convierta determinadas acciones de la aplicación en feedback audiovisual.
El sonido NO debe ser una colección de pitidos aleatorios.
Debe existir una identidad sonora propia de JC Lifestyle, con sonidos diferentes para:
* interacción;
* éxito;
* progreso;
* XP;
* recompensas;
* niveles;
* logros;
* rachas;
* milestones;
* récords personales;
* avisos;
* errores;
* eventos del sistema.
Además, quiero que el sistema de racha tenga una identidad especialmente importante y reconocible.
 
⸻
 
REGLA PRINCIPAL DE TRABAJO
Divide toda la implementación en las siguientes fases:
FASE 1 — BASE DEL SISTEMA
FASE 2 — MOTOR DE SONIDO
FASE 3 — EVENTOS, FEEDBACK Y RECOMPENSAS
FASE 4 — DISEÑO Y ESPECIFICACIÓN DE LOS SONIDOS
FASE 5 — PRODUCCIÓN, INTEGRACIÓN Y TEST FINAL
NO ejecutes todas las fases de golpe.
Empieza únicamente por la FASE 1.
Cuando termines una fase:
1. Implementa realmente todo lo correspondiente a esa fase.
2. Comprueba que funciona.
3. Comprueba que no has roto funcionalidades existentes.
4. Explícame brevemente qué has hecho.
5. Indica claramente:
FASE X COMPLETADA
y espera.
Cuando yo escriba:
SIGUE
debes continuar automáticamente con la siguiente fase.
No vuelvas a empezar desde cero.
No repitas fases ya completadas.
No me pidas que vuelva a pegar este prompt.
Debes mantener el contexto de todo lo realizado anteriormente.
 
⸻
 
FASE 1 — BASE DEL SISTEMA
Crear la infraestructura inicial para soportar sonido en toda la aplicación.
Debe existir una arquitectura centralizada.
No quiero que cada componente cree sus propios objetos de audio.
El sistema deberá poder utilizar posteriormente algo equivalente a:
soundEngine.play("task_complete")
o:
soundEngine.play("streak_milestone_30")
La interfaz debe estar desacoplada del sistema de audio.
Crear la estructura necesaria para:
* SoundEngine
* SoundRegistry
* SoundSettings
* SoundEvents
* SoundQueue
* SoundCooldown
* HapticEngine
* configuración de perfiles.
Debe quedar preparada para crecer.
 
⸻
 
FASE 2 — MOTOR DE SONIDO
Crear el motor real.
Debe soportar:
* reproducción;
* pausa;
* parada;
* volumen maestro;
* volumen por categoría;
* activación/desactivación;
* cooldown;
* prioridades;
* cola;
* anti-spam;
* fallback;
* variantes;
* precarga;
* caché cuando sea conveniente;
* errores de reproducción sin romper la aplicación.
La aplicación nunca debe quedar bloqueada porque un sonido falle.
Si un archivo no existe:
sound unavailable
→ fallback
→ continuar aplicación
Nunca debe provocar un crash.
También debe contemplarse el comportamiento específico de navegadores móviles y la necesidad de una primera interacción del usuario antes de inicializar correctamente el audio.
 
⸻
 
FASE 3 — EVENTOS, FEEDBACK, RECOMPENSAS Y RACHA
Crear todos los eventos necesarios.
Como mínimo:
ui_click
ui_toggle_on
ui_toggle_off
ui_open
ui_close

success
error
warning
save

task_complete
habit_complete
goal_progress
goal_complete

xp_small
xp_medium
xp_large

level_up
reward_small
reward_medium
reward_major
badge_unlocked

streak_start
streak_increment
streak_milestone_03
streak_milestone_07
streak_milestone_14
streak_milestone_21
streak_milestone_30
streak_milestone_50
streak_milestone_75
streak_milestone_100
streak_milestone_180
streak_milestone_365

personal_record
streak_at_risk
streak_freeze_used
streak_recovered

achievement_unlocked
grand_achievement

sync_complete
connection_lost
connection_restored
El sistema debe entender que no todos los eventos tienen la misma importancia.
Prioridad aproximada:
5 = Grand Achievement
4 = Personal Record / Major Milestone
3 = Level Up / Achievement
2 = Reward / Streak
1 = Normal Feedback
0 = UI
Si ocurren varios eventos simultáneamente, no quiero cinco sonidos superpuestos.
Ejemplo:
completar tarea
→ +XP
→ subir de nivel
→ alcanzar milestone
→ nuevo récord
El sistema deberá seleccionar el evento sonoro dominante.
En este ejemplo:
PERSONAL_RECORD
debe tener prioridad sobre los eventos menores.
La interfaz puede mostrar visualmente todos los acontecimientos, pero el audio debe mantener jerarquía.
 
⸻
 
SISTEMA DE RACHA
La racha debe ser una de las partes más importantes del sistema.
Debe existir una progresión sonora.
Ejemplo:
Día 1
→ streak_start

Día 2-6
→ streak_increment

Día 7
→ streak_milestone_07

Día 14
→ streak_milestone_14

Día 30
→ streak_milestone_30

Día 50
→ streak_milestone_50

Día 100
→ streak_milestone_100

Día 365
→ streak_milestone_365
Los milestones deben ser progresivamente más especiales.
No quiero simplemente el mismo sonido con más volumen.
Debe existir una evolución real de la identidad sonora.
Además:
personal_record
debe ser independiente de los milestones.
La aplicación debe poder reconocer:
“Has alcanzado un milestone.”
y:
“Has superado tu propio récord.”
Son acontecimientos diferentes.
 
⸻
 
FASE 4 — DISEÑO DE LOS SONIDOS
Definir y preparar la biblioteca sonora.
Las familias serán:
UI
FEEDBACK
PROGRESS
REWARD
STREAK
ACHIEVEMENT
WARNING
SYSTEM
Duraciones orientativas:
Microinteracción:
40-150 ms

Feedback:
100-300 ms

Recompensa:
250-700 ms

Milestone:
500-1200 ms

Gran logro:
800-2000 ms
Los sonidos deben transmitir:
* premium;
* tecnológico;
* deportivo;
* elegante;
* motivacional;
* progreso;
* satisfacción.
Evitar:
* sonidos infantiles;
* sonidos arcade excesivos;
* sonidos molestos;
* sonidos demasiado largos;
* sonidos genéricos;
* alarmas agresivas.
 
⸻
 
IDENTIDAD SONORA
Crear una pequeña firma sonora de JC Lifestyle.
Debe existir un pequeño motivo de aproximadamente:
2-4 notas
que pueda aparecer de forma evolucionada en:
* level up;
* milestones;
* logros;
* récords;
* grandes recompensas.
La identidad debe hacer que diferentes sonidos parezcan pertenecer al mismo producto.
 
⸻
 
VARIANTES
Para sonidos que se repiten mucho, se pueden crear variantes:
ui_click_01
ui_click_02
ui_click_03
o:
streak_increment_01
streak_increment_02
Pero los sonidos importantes deben ser únicos:
* level up;
* milestones;
* personal record;
* grand achievement;
* 365 días.
 
⸻
 
FASE 5 — INTEGRACIÓN Y TEST
Integrar definitivamente el sistema con JC Lifestyle.
Crear una estructura similar a:
src/
└── audio/
    ├── engine/
    ├── config/
    ├── hooks/
    ├── haptics/
    └── assets/
        ├── ui/
        ├── feedback/
        ├── progress/
        ├── reward/
        ├── streak/
        ├── achievement/
        └── system/
La estructura concreta puede adaptarse a la arquitectura actual del proyecto si existe una mejor solución.
No quiero que rompas la arquitectura existente solo para copiar esta estructura literalmente.
 
⸻
 
AJUSTES DE SONIDO
Añadir en Ajustes una sección:
SONIDO Y RESPUESTA
Debe incluir:
Sonidos
ON/OFF

Volumen maestro
0-100%

Sonidos de interfaz
ON/OFF

Sonidos de progreso
ON/OFF

Sonidos de recompensas
ON/OFF

Sonidos de racha
ON/OFF

Vibración
ON/OFF
Añadir perfiles:
Silencioso
Equilibrado
Inmersivo
Personalizado
EQUILIBRADO
Debe ser el perfil recomendado.
INMERSIVO
Utiliza toda la identidad sonora.
SILENCIOSO
Desactiva el audio, pero NO desactiva ninguna funcionalidad.
PERSONALIZADO
Permite controlar individualmente las categorías.
Cada categoría importante debe tener:
▶ Probar
para que el usuario pueda escuchar el sonido.
 
⸻
 
HAPTICS
Cuando el dispositivo lo permita, combinar:
AUDIO
+
HAPTIC
+
ANIMACIÓN
Ejemplo:
click
→ haptic ligero

task_complete
→ haptic ligero

milestone
→ haptic medio

personal_record
→ haptic especial

grand_achievement
→ haptic importante
El sonido y la vibración deben ser sistemas independientes.
El usuario debe poder tener:
sonido OFF
vibración ON
sin ningún problema.
 
⸻
 
ACCESIBILIDAD
El sonido nunca debe ser la única forma de comunicar información importante.
Todo acontecimiento importante debe seguir siendo visible mediante:
* texto;
* iconos;
* animación;
* estados visuales.
Si el usuario desactiva completamente el sonido:
JC Lifestyle debe seguir funcionando al 100%.
 
⸻
 
ANTI-SPAM
El sistema debe impedir:
100 clicks
↓
100 sonidos molestos
Debe utilizar:
* cooldown;
* agrupación;
* prioridad;
* cola;
* descarte de eventos redundantes.
Los eventos importantes siempre deben poder atravesar el sistema anti-spam.
 
⸻
 
MOBILE FIRST
Todo debe estar especialmente probado para:
* iPhone;
* iOS Safari;
* PWA;
* Android;
* Chrome móvil.
Hay que tener en cuenta:
* bloqueo de reproducción automática;
* suspensión de la aplicación;
* recuperación del audio;
* cambio de aplicación;
* bloqueo/desbloqueo del teléfono;
* auriculares Bluetooth;
* volumen del dispositivo.
 
⸻
 
NO ROMPER JC LIFESTYLE
Esta condición es crítica.
Antes de modificar cualquier cosa:
1. Analiza la arquitectura existente.
2. Identifica cómo están organizados actualmente los módulos.
3. No reemplaces funcionalidades existentes innecesariamente.
4. No elimines código funcional.
5. No cambies diseños que no estén relacionados con esta implementación.
6. Mantén compatibilidad con los módulos existentes.
7. Integra el sistema de sonido de forma modular.
 
⸻
 
TESTS OBLIGATORIOS
Antes de considerar cada fase terminada, comprobar:
* sonido activado;
* sonido desactivado;
* volumen 0;
* volumen 50;
* volumen 100;
* múltiples eventos simultáneos;
* cooldown;
* prioridades;
* cola;
* fallback;
* errores de audio;
* racha;
* milestones;
* récord;
* recompensas;
* level up;
* haptics;
* suspensión y recuperación de la aplicación.
No des por terminada una fase simplemente porque el código compile.
 
⸻
 
REGLA DE IMPLEMENTACIÓN
Quiero que seas autónomo.
Si encuentras una decisión técnica que no está especificada exactamente:
elige la solución más robusta, escalable y compatible con la arquitectura actual de JC Lifestyle.
No detengas el desarrollo por pequeñas decisiones técnicas.
Solo pregunta si existe una decisión que pueda cambiar radicalmente la arquitectura o destruir datos existentes.
 
⸻
 
FORMATO DE RESPUESTA AL TERMINAR CADA FASE
Cuando termines una fase, NO me devuelvas una explicación gigantesca.
Dime:
1. Qué has implementado.
2. Qué archivos/componentes has creado o modificado.
3. Qué has comprobado.
4. Qué porcentaje llevamos.
5. Qué fase toca después.
Después espera a que yo diga:
SIGUE
y continúa.
 
⸻
 
OBJETIVO FINAL
Al terminar las 5 fases quiero que JC Lifestyle tenga un sistema completo de:
SONIDO + RACHA + RECOMPENSAS + HAPTICS + FEEDBACK
con una identidad sonora propia, escalable y profesional.
El usuario debe poder sentir:
ACCION
↓
FEEDBACK
↓
PROGRESO
↓
RECOMPENSA
↓
RACHA
↓
MILESTONE
↓
RÉCORD
El sistema debe hacer que JC Lifestyle se sienta más vivo, más premium y más satisfactorio de utilizar, pero sin resultar infantil, molesto o adictivo de forma agresiva.
EMPIEZA AHORA
Empieza exclusivamente por:
FASE 1 — BASE DEL SISTEMA
No continúes a la Fase 2 hasta que yo escriba:
SIGUE.

PROMPT PARA CLAUDE — FASE 1
Sistema de Rachas: arquitectura, reglas y lógica central
Estás trabajando sobre el proyecto JC Fitness / JC Lifestyle, una aplicación web/PWA personal cuyo objetivo es convertirse en un sistema operativo personal para gestionar entrenamiento, salud, hábitos, estudios, productividad, economía y objetivos.
En esta fase NO quiero que desarrolles todavía la interfaz visual completa ni el sistema de sonidos. Quiero construir primero una arquitectura sólida y reutilizable para el sistema de RACHAS, porque posteriormente se conectará con diferentes módulos de la aplicación.
Esta fase es exclusivamente para diseñar e implementar correctamente la lógica central de las rachas.
 
⸻
 
1. OBJETIVO PRINCIPAL
Crear un sistema de rachas:
* fiable;
* persistente;
* sincronizable;
* independiente de la interfaz;
* reutilizable por cualquier módulo;
* preparado para Supabase;
* preparado para futuras notificaciones;
* preparado para logros y recompensas;
* preparado para estadísticas;
* preparado para múltiples tipos de racha;
* preparado para futuras funcionalidades sin tener que rehacer su arquitectura.
La lógica de rachas NO debe estar acoplada al Dashboard.
Debe existir como un sistema independiente que posteriormente pueda ser utilizado desde:
* entrenamiento;
* hábitos;
* estudio;
* nutrición;
* sueño;
* objetivos;
* productividad;
* economía;
* cualquier módulo futuro.
 
⸻
 
2. CONCEPTO FUNDAMENTAL
Una racha representa una secuencia consecutiva de días en los que el usuario cumple una determinada condición.
Ejemplo:
Entrenamiento:
Día 1 ✅ Día 2 ✅ Día 3 ✅ Día 4 ❌
Resultado:
* racha actual = 0
* racha anterior = 4
* mejor racha = 4
Pero no quiero que asumas que todas las rachas funcionarán exactamente igual.
Diseña el sistema para permitir diferentes reglas posteriormente.
 
⸻
 
3. TIPOS DE RACHAS
La arquitectura debe permitir identificar cada racha mediante un identificador estable.
Ejemplos:
training
sleep
study
nutrition
habits
goals
productivity
savings
custom
No es necesario implementar todavía todos estos módulos.
Pero la arquitectura debe permitir añadirlos sin modificar el núcleo.
Por ejemplo:
streak_type = "training"
o:
streak_type = "study"
El sistema debe tratar cada una como una entidad independiente.
 
⸻
 
4. REGLA DE DÍA
Define claramente qué significa “un día”.
No dependas exclusivamente de:
new Date()
porque la aplicación será utilizada en móviles y diferentes zonas horarias.
La arquitectura debe contemplar:
* zona horaria del usuario;
* cambio de día;
* medianoche;
* horario de verano;
* viajes;
* sincronización entre dispositivos;
* fechas almacenadas en UTC cuando corresponda;
* representación del día en la zona horaria del usuario.
La racha debe calcularse respecto al día local del usuario, no respecto a la hora UTC del servidor.
Ejemplo:
Si el usuario está en España y completa una actividad a las 23:59, debe contar para ese día.
Si la completa a las 00:01, debe contar para el día siguiente.
Diseña esto de forma consistente.
 
⸻
 
5. QUÉ SIGNIFICA “COMPLETAR UN DÍA”
No quiero que una racha dependa simplemente de que exista cualquier actividad.
Cada tipo de racha debe poder definir posteriormente una condición de cumplimiento.
Por ejemplo:
training → completar entrenamiento
study → estudiar al menos X minutos
sleep → registrar sueño
habit → completar hábito
savings → realizar la condición económica correspondiente
Por ello crea una abstracción similar a:
Streak
StreakRule
StreakDay
StreakEvent
No tienes que utilizar exactamente estos nombres si existe una arquitectura mejor, pero debe existir una separación conceptual equivalente.
 
⸻
 
6. EVENTOS DE RACHA
No guardes únicamente el número:
currentStreak = 17
Eso sería insuficiente.
El sistema debe poder reconstruir la racha a partir del historial.
Debe existir un concepto de evento o cumplimiento diario.
Ejemplo:
2026-08-14 → completed
2026-08-15 → completed
2026-08-16 → completed
2026-08-17 → completed
De esta manera podremos calcular:
* racha actual;
* mejor racha;
* rachas anteriores;
* días cumplidos;
* días fallidos;
* porcentaje de cumplimiento;
* calendario;
* récords;
* estadísticas futuras.
 
⸻
 
7. RACHA ACTUAL
Define una función central equivalente a:
calculateCurrentStreak()
Debe:
1. identificar el día actual del usuario;
2. comprobar si hoy está cumplido;
3. recorrer hacia atrás los días consecutivos;
4. detenerse cuando encuentre un día no cumplido;
5. devolver la racha actual.
Debe existir una política clara para el caso en el que el día actual todavía no se haya completado.
Por ejemplo:
Si llevo:
Lunes ✅
Martes ✅
Miércoles ❌
el miércoles por la mañana la aplicación no debería necesariamente mostrar que he “perdido” la racha si todavía tengo todo el día para cumplir.
Diseña una lógica que distinga:
racha activa
día pendiente
racha rota
Esto es MUY importante.
 
⸻
 
8. NO PENALIZAR PREMATURAMENTE
Un día que todavía está en curso no debe considerarse automáticamente fallido.
Ejemplo:
Son las 10:00.
El usuario todavía no ha entrenado.
No quiero:
🔥 Racha perdida
Quiero que el sistema entienda:
Día pendiente de completar.
La ruptura de la racha debe producirse únicamente cuando realmente corresponda según la regla definida.
 
⸻
 
9. MEJOR RACHA
Debe existir:
currentStreak
longestStreak
Pero longestStreak debe poder calcularse a partir del historial.
No debe depender únicamente de un contador mutable.
Ejemplo:
5 días
8 días
12 días
3 días
Resultado:
currentStreak = 3
longestStreak = 12
Si posteriormente se alcanza:
20 días
debe actualizarse el récord.
 
⸻
 
10. HISTORIAL
La arquitectura debe permitir consultar:
* días completados;
* días no completados;
* días pendientes;
* fecha de inicio de cada racha;
* fecha de finalización;
* duración;
* mejor racha;
* racha actual.
No quiero que para mostrar un calendario futuro haya que reconstruir toda la aplicación.
El historial debe ser una fuente de verdad independiente.
 
⸻
 
11. DÍAS PERDIDOS
Define explícitamente qué ocurre cuando el usuario no cumple.
Debe existir una diferencia clara entre:
Día pendiente
Todavía puede cumplirlo.
Día completado
Ha cumplido la condición.
Día perdido
Ha terminado el día sin cumplir.
Racha rota
El día perdido rompe la secuencia consecutiva.
No mezcles estos estados.
 
⸻
 
12. FUTURA FLEXIBILIDAD
La arquitectura debe poder soportar posteriormente reglas como:
Regla diaria
Hay que cumplir todos los días.
Regla semanal
Hay que cumplir X veces por semana.
Regla mínima
Hay que superar un valor determinado.
Ejemplo:
estudiar >= 30 minutos
Regla de cantidad
Ejemplo:
hacer >= 50 flexiones
Regla personalizada
Ejemplo:
completar objetivo X
No es necesario implementar todas estas reglas ahora.
Pero la arquitectura NO debe impedirlas.
 
⸻
 
13. GRACIAS A ESTO, EL SISTEMA PODRÁ CRECER
Quiero que pienses en este sistema como una infraestructura.
Posteriormente podremos tener:
Racha de entrenamiento: 18 días
Racha de estudio: 12 días
Racha de sueño: 7 días
Racha de hábitos: 24 días
Y una:
Racha global: 18 días
La racha global no debe sustituir a las individuales.
Debe poder calcularse como una capa superior.
 
⸻
 
14. RACHAS FUTURAS PERSONALIZADAS
El usuario deberá poder tener en el futuro rachas creadas por él mismo.
Por ejemplo:
“Leer todos los días”
o:
“Entrenar 4 días por semana”
No implementes todavía toda la interfaz para esto.
Pero deja preparada la arquitectura.
 
⸻
 
15. SUPABASE
La aplicación terminará utilizando Supabase como backend.
Por ello, diseña la arquitectura teniendo en cuenta que los datos de rachas pertenecerán a un usuario.
Conceptualmente debe existir una relación:
user
  ↓
streak
  ↓
streak days / events
Cada dato debe estar correctamente vinculado al usuario autenticado.
NO diseñes una solución basada únicamente en:
localStorage
La lógica puede tener una capa local/cache, pero la fuente persistente futura debe ser compatible con Supabase.
 
⸻
 
16. SEGURIDAD
Desde esta fase quiero que tengas presente:
* cada usuario solo puede acceder a sus propias rachas;
* nunca confiar en un user_id enviado desde el cliente;
* utilizar el usuario autenticado como identidad;
* preparar la arquitectura para Row Level Security;
* no exponer datos de otros usuarios;
* no permitir manipulación sencilla del récord desde la interfaz.
No necesito todavía implementar todas las políticas de Supabase si eso corresponde a la fase técnica de base de datos, pero la arquitectura debe respetarlas.
 
⸻
 
17. CONSISTENCIA
Evita situaciones como:
Dashboard → 15 días
Centro de rachas → 16 días
Base de datos → 14 días
Debe existir una única fuente de verdad.
Crea funciones o servicios centrales para obtener:
getCurrentStreak()
getLongestStreak()
getStreakStatus()
getStreakHistory()
getStreakStats()
Los diferentes componentes de la aplicación deberán consumir esas funciones en lugar de crear sus propios cálculos.
 
⸻
 
18. IDEMPOTENCIA
Esto es importante.
Si el usuario pulsa varias veces:
Completar entrenamiento
no quiero que se creen:
3 días completados
para el mismo día.
Debe existir un identificador único lógico:
user + streak + localDate
De manera que un día solo pueda contabilizarse una vez para una determinada racha.
 
⸻
 
19. SINCRONIZACIÓN
Piensa en el futuro escenario:
El usuario abre JC Fitness en:
* iPhone;
* iPad;
* ordenador.
Completa una actividad en uno de ellos.
Los demás dispositivos deben terminar viendo la misma racha.
Por ello, evita una arquitectura en la que el estado de la racha exista exclusivamente en memoria del componente.
 
⸻
 
20. OFFLINE
La aplicación es una PWA.
Por tanto, considera que puede existir temporalmente ausencia de conexión.
La arquitectura debe poder evolucionar hacia:
acción local
↓
cola de sincronización
↓
Supabase
↓
confirmación
No quiero que una mala conexión provoque accidentalmente la pérdida de una racha.
No hace falta construir ahora todo el sistema offline si pertenece a otra fase, pero deja claramente identificados los puntos de integración.
 
⸻
 
21. CASOS EXTREMOS
Antes de considerar esta fase terminada, analiza y prepara la arquitectura para:
* cambio de zona horaria;
* horario de verano;
* usuario que abre la aplicación después de varios días;
* actividad duplicada;
* sincronización simultánea;
* dos dispositivos;
* día actual sin completar;
* usuario que completa la actividad justo antes de medianoche;
* usuario que completa justo después de medianoche;
* datos duplicados;
* datos fuera de orden;
* edición o eliminación de una actividad que generaba una racha;
* restauración de datos;
* cuenta nueva;
* usuario sin historial.
 
⸻
 
22. NO QUIERO GAMIFICACIÓN TODAVÍA
En esta fase NO implementes:
* niveles;
* medallas;
* logros;
* recompensas;
* confeti;
* animaciones grandes;
* sonidos;
* efectos visuales;
* leaderboard;
* rankings.
Eso llegará después.
Ahora queremos construir el motor de rachas.
 
⸻
 
23. RESULTADO ESPERADO DE ESTA FASE
Al terminar esta fase quiero tener:
Arquitectura
Una estructura clara para el sistema.
Modelo conceptual
Definición de:
Streak
StreakRule
StreakEvent/Day
StreakStatus
o equivalentes.
Motor
Funciones centrales para:
crear racha
registrar cumplimiento
consultar racha
calcular racha actual
calcular récord
consultar historial
determinar estado del día
Preparación
El sistema debe quedar preparado para:
* Supabase;
* autenticación;
* sincronización;
* offline;
* múltiples módulos;
* gamificación;
* notificaciones;
* sonidos;
* futuras rachas personalizadas.
 
⸻
 
24. REGLA FUNDAMENTAL PARA IMPLEMENTARLO
No hagas una solución rápida que simplemente incremente un contador.
Quiero un sistema profesional basado en historial y reglas, donde los contadores sean resultados derivados del estado real.
La prioridad es:
integridad de datos > escalabilidad > mantenibilidad > rendimiento > interfaz.
 
⸻
 
25. ANTES DE MODIFICAR EL PROYECTO
Primero inspecciona la arquitectura actual de JC Fitness/Lifestyle.
Identifica:
* framework;
* estructura de carpetas;
* sistema de autenticación;
* conexión actual con Supabase;
* modelos existentes;
* servicios;
* hooks;
* estado global;
* almacenamiento;
* módulos de entrenamiento/hábitos/objetivos;
* componentes reutilizables.
No reemplaces arquitectura existente innecesariamente.
Adapta el sistema de rachas a la arquitectura actual.
Si existe una implementación parcial de algo relacionado con rachas, reutilízala o refactorízala en lugar de duplicarla.
 
⸻
 
26. DOCUMENTACIÓN DE LA IMPLEMENTACIÓN
Al terminar, explícame brevemente:
1. Qué has encontrado en el proyecto.
2. Qué arquitectura has elegido.
3. Qué archivos has creado o modificado.
4. Qué lógica de rachas has implementado.
5. Qué queda preparado para futuras fases.
6. Qué NO has implementado porque corresponde a fases posteriores.
7. Cómo puedo probar que el motor funciona correctamente.
No me des una explicación enorme de código.
Quiero un resumen técnico claro y después la implementación.
 
⸻
 
27. CRITERIO DE FINALIZACIÓN
Considera esta fase terminada únicamente cuando el sistema tenga una base suficientemente sólida para que las siguientes fases puedan construir encima sin tener que rehacer el motor de rachas.
No avances todavía al diseño visual avanzado ni a las recompensas.
Esta es la FASE 1 — ARQUITECTURA Y LÓGICA DEL SISTEMA DE RACHAS.
Cuando termines, detente y espera instrucciones para la siguiente fase.

Cuenta que esto es lo último que te voy a dar porque literalmente esto lo voy a hacer cuando la web ya tenga todos los botones activos y todo no te lo voy a dar aún eso es lo último que es lo último que te voy a dar vale entonces eso
Seguimos. Esta es la FASE 5, donde cerramos la parte técnica de producción e integración del sistema de sonido para que quede preparado para llevarlo a la web de JC Lifestyle.
JC LIFESTYLE — SISTEMA DE SONIDO
FASE 5 — PRODUCCIÓN, INTEGRACIÓN Y TEST FINAL
1. OBJETIVO
Convertir toda la especificación de las fases anteriores en un sistema de audio real, organizado, optimizado y preparado para producción.
Esta fase debe dejar resuelto:
* dónde estarán los archivos;
* cómo se cargarán;
* cómo se reproducirán;
* cómo se optimizarán;
* cómo se conectarán con los eventos;
* cómo se comprobará su funcionamiento;
* cómo se evitarán errores;
* cómo se podrá sustituir cualquier sonido en el futuro.
 
⸻
 
2. ESTRUCTURA DE ARCHIVOS
Crear una estructura centralizada:
src/
├── audio/
│   ├── engine/
│   │   ├── SoundEngine
│   │   ├── SoundQueue
│   │   ├── SoundCooldown
│   │   └── SoundRegistry
│   │
│   ├── config/
│   │   ├── soundConfig
│   │   └── soundProfiles
│   │
│   ├── hooks/
│   │   └── useSound
│   │
│   ├── haptics/
│   │   └── HapticEngine
│   │
│   └── assets/
│       ├── ui/
│       ├── feedback/
│       ├── progress/
│       ├── reward/
│       ├── streak/
│       ├── achievement/
│       └── system/
Los sonidos NO deben estar dispersos por diferentes módulos de la aplicación.
 
⸻
 
3. NOMBRES DE ARCHIVO
Todos los archivos seguirán una nomenclatura uniforme.
Ejemplo:
ui_click_01
ui_click_02
ui_toggle_on
ui_toggle_off

feedback_success
feedback_error
feedback_warning

progress_task_complete
progress_habit_complete

reward_xp_small
reward_xp_medium
reward_xp_large
reward_level_up
reward_badge_unlock

streak_start
streak_increment_01
streak_increment_02
streak_milestone_03
streak_milestone_07
streak_milestone_14
streak_milestone_21
streak_milestone_30
streak_milestone_50
streak_milestone_75
streak_milestone_100
streak_milestone_180
streak_milestone_365
streak_personal_record
streak_at_risk
streak_freeze_used
streak_recovered

achievement_unlocked
achievement_grand

system_sync_complete
system_connection_lost
system_connection_restored
 
⸻
 
4. FORMATOS DE AUDIO
Priorizar formatos adecuados para web.
Principal:
WebM / Opus
Fallback:
MP3
Para sonidos extremadamente pequeños también se puede valorar:
WAV
durante el proceso de producción, pero no mantener archivos innecesariamente pesados en producción.
 
⸻
 
5. CALIDAD
Los sonidos deben conservar suficiente calidad para que:
* no aparezcan artefactos;
* no se escuchen chasquidos;
* no haya clipping;
* no haya silencios innecesarios;
* las colas sean limpias.
Pero la prioridad en sonidos de interfaz será:
calidad suficiente + tamaño reducido + reproducción rápida.
 
⸻
 
6. OPTIMIZACIÓN
No cargar archivos enormes para sonidos de 100 ms.
Cada archivo debe ser lo más pequeño posible sin degradar perceptiblemente su calidad.
Especialmente:
ui/
feedback/
xp/
porque se utilizarán con mucha frecuencia.
Los sonidos especiales pueden permitir archivos ligeramente mayores.
 
⸻
 
7. PRELOAD
No todos los sonidos deben cargarse inmediatamente.
Dividir:
GRUPO A — USO FRECUENTE
Preload:
* click;
* toggle;
* success;
* task complete;
* XP.
GRUPO B — USO MODERADO
Carga rápida cuando sea necesario:
* reward;
* level up;
* badge;
* streak.
GRUPO C — EVENTOS RAROS
Carga bajo demanda:
* 100 días;
* 180 días;
* 365 días;
* grand achievement.
Esto reduce el coste inicial.
 
⸻
 
8. CACHE
Los sonidos utilizados frecuentemente deberán permanecer disponibles en caché cuando la arquitectura de la aplicación lo permita.
Objetivo:
primera reproducción
↓
carga
↓
cache
↓
reproducciones posteriores prácticamente instantáneas
 
⸻
 
9. SOUND ENGINE
El motor será el único encargado de reproducir audio.
Las pantallas NO deberán hacer:
new Audio(...)
directamente cada vez que ocurre una acción.
En su lugar:
soundEngine.play("task_complete")
 
⸻
 
10. API DEL MOTOR
El motor deberá ofrecer una interfaz sencilla.
Conceptualmente:
play(soundId)
stop(soundId)
stopAll()
setMasterVolume(volume)
setCategoryVolume(category, volume)
setEnabled(enabled)
Y, cuando sea necesario:
playWithOptions(soundId, options)
 
⸻
 
11. HOOK DE REACT
La aplicación podrá utilizar un hook:
useSound()
para que los componentes puedan solicitar sonidos sin conocer la implementación interna.
Ejemplo conceptual:
const { play } = useSound()

play("task_complete")
El componente solamente conoce el evento.
 
⸻
 
12. NO ACOPLAR UI Y AUDIO
Ejemplo correcto:
TrainingModule
      ↓
training_completed
      ↓
Gamification
      ↓
SoundEngine
Ejemplo incorrecto:
TrainingButton
      ↓
import sound.wav
      ↓
new Audio()
      ↓
play()
La primera arquitectura permite cambiar todo el sistema sonoro sin modificar los componentes.
 
⸻
 
13. EVENT BUS
Los acontecimientos importantes pueden centralizarse mediante eventos.
Ejemplo:
EVENT:
TRAINING_COMPLETED
El sistema puede reaccionar:
Gamificación → XP
Racha → actualizar
Objetivos → actualizar
Estadísticas → actualizar
Sonido → feedback
Haptic → vibración
Esto permite que el sonido sea una consecuencia del evento, no parte de la lógica principal.
 
⸻
 
14. ORDEN DE PROCESAMIENTO
Cuando ocurre una acción:
1. usuario realiza acción
2. aplicación valida acción
3. se actualiza estado
4. se genera evento
5. gamificación procesa evento
6. se calculan recompensas
7. se determina prioridad
8. sonido decide qué reproducir
9. haptic decide qué vibración utilizar
10. interfaz muestra feedback
 
⸻
 
15. SISTEMA DE PRIORIDADES
La prioridad final será:
5 — GRAND ACHIEVEMENT
4 — PERSONAL RECORD / MAJOR MILESTONE
3 — LEVEL UP / ACHIEVEMENT
2 — REWARD / STREAK
1 — NORMAL FEEDBACK
0 — UI
Si dos sonidos compiten:
mayor prioridad
↓
gana
 
⸻
 
16. SISTEMA DE INTERRUPCIÓN
Un sonido de prioridad alta podrá interrumpir un sonido de prioridad baja.
Ejemplo:
UI_CLICK
    ↓
PERSONAL_RECORD
    ↓
RECORD interrumpe CLICK
Pero dos sonidos de prioridad alta no deberán reproducirse simultáneamente salvo que estén diseñados específicamente como una secuencia.
 
⸻
 
17. SISTEMA DE SECUENCIAS
Algunos acontecimientos utilizarán una secuencia.
Ejemplo:
LEVEL UP
↓
impact
↓
ascending tone
↓
resolution
El motor debe tratarlo como un único acontecimiento, no como tres sonidos independientes.
Esto permite:
* cancelar;
* ajustar volumen;
* priorizar;
* sincronizar;
* aplicar haptic.
 
⸻
 
18. RACHA + RECOMPENSA
Ejemplo:
Usuario completa hábito
↓
+20 XP
↓
racha pasa a 30 días
No:
XP
+
success
+
streak
+
milestone
Sino:
STREAK_MILESTONE_30
y visualmente:
+20 XP
🔥 30 DÍAS
 
⸻
 
19. RÉCORD + MILESTONE
Si simultáneamente ocurre:
30 días
+
nuevo récord
el evento principal será:
PERSONAL_RECORD
La interfaz puede mostrar ambos acontecimientos.
El audio utiliza únicamente el evento dominante.
 
⸻
 
20. MULTITAREA
El motor deberá soportar múltiples eventos consecutivos sin crear una reproducción caótica.
Ejemplo:
complete
complete
complete
reward
milestone
El sistema puede:
complete → reproducir
complete → cooldown
complete → cooldown
reward → reproducir
milestone → prioridad superior
 
⸻
 
21. MODO SILENCIOSO
Cuando:
soundEnabled = false
el motor:
NO reproduce audio
pero continúa procesando eventos.
Esto es importante.
No debemos eliminar el evento porque el sonido esté desactivado.
Ejemplo:
milestone
↓
gamificación actualiza
↓
UI muestra milestone
↓
soundEnabled = false
↓
audio no reproduce
 
⸻
 
22. HAPTICS INDEPENDIENTES
El usuario puede querer:
sonido OFF
vibración ON
Por tanto:
SoundEngine
y:
HapticEngine
deben estar separados.
 
⸻
 
23. CONTROL DE VOLUMEN
El volumen final deberá calcularse mediante:
master
×
category
×
event
Nunca modificar directamente el archivo original.
 
⸻
 
24. AJUSTES
Crear una sección:
Sonido y respuesta
Con:
🔊 Sonidos
ON/OFF

🔉 Volumen
────────●──

🎛 Perfil
Equilibrado

🔥 Sonidos de racha
ON/OFF

🏆 Sonidos de recompensas
ON/OFF

✨ Sonidos de interfaz
ON/OFF

📳 Vibración
ON/OFF
 
⸻
 
25. PERFILES
SILENCIOSO
Todo sonido desactivado.
EQUILIBRADO
Configuración recomendada.
INMERSIVO
Todos los sonidos importantes activos.
PERSONALIZADO
El usuario controla cada categoría.
 
⸻
 
26. BOTONES DE PRUEBA
Cada categoría debe permitir:
▶ Escuchar
El botón debe reproducir exactamente el sonido que utilizaría el sistema.
No crear un sonido diferente solamente para la pantalla de ajustes.
 
⸻
 
27. INDICADOR DE VOLUMEN
El slider debe mostrar visualmente:
0%
25%
50%
75%
100%
Pero no es necesario mostrar números constantemente.
El control debe ser cómodo para móvil.
 
⸻
 
28. ACCESIBILIDAD
Todos los controles deberán tener:
* etiqueta;
* estado;
* feedback visual;
* compatibilidad con lectores de pantalla;
* tamaño táctil suficiente.
Nunca depender del sonido para comunicar el estado de un control.
 
⸻
 
29. PRIMERA INTERACCIÓN
Debido a las políticas de reproducción de los navegadores:
app opened
↓
NO intentar reproducir audio automáticamente
Esperar:
tap
click
touch
y entonces inicializar el contexto de audio.
 
⸻
 
30. ERROR DE AUDIO
Si la reproducción falla:
try
   play()
catch
   log warning
   continue application
Nunca:
audio error
↓
pantalla blanca
↓
aplicación rota
 
⸻
 
31. FALLBACK
Si un sonido no está disponible:
requested sound
↓
file unavailable
↓
fallback family sound
Ejemplo:
streak_milestone_100
si no está disponible temporalmente:
streak_milestone
La aplicación debe seguir funcionando.
 
⸻
 
32. TELEMETRÍA
No registrar datos innecesarios.
Si en el futuro existe analítica:
sound_event
puede registrar únicamente información técnica agregada, como:
* evento;
* éxito/fallo de reproducción;
* versión del sonido.
Nunca registrar contenido personal innecesario.
 
⸻
 
33. TEST AUTOMÁTICO
Crear pruebas para:
play()
stop()
volume()
cooldown()
priority()
queue()
fallback()
disabled()
 
⸻
 
34. TEST DE RACHA
Probar:
día 1
día 2
día 3
día 7
día 14
día 30
día 50
día 100
día 365
Y verificar que cada milestone activa exactamente el evento correcto.
 
⸻
 
35. TEST DE RÉCORD
Probar:
récord = 10
actual = 11
Debe producir:
PERSONAL_RECORD
Pero:
récord = 20
actual = 19
no.
 
⸻
 
36. TEST DE RACHA EN RIESGO
Verificar:
racha válida
↓
usuario no completa actividad
↓
streak_at_risk
Debe generar un aviso.
Nunca debe marcar directamente la racha como perdida si existe todavía margen de recuperación.
 
⸻
 
37. TEST DE RECUPERACIÓN
Verificar:
racha en riesgo
↓
usuario completa actividad
↓
racha recuperada
Debe utilizar:
STREAK_RECOVERED
y no:
ERROR
 
⸻
 
38. TEST DE MODO SILENCIOSO
Activar:
soundEnabled = false
Realizar:
* tareas;
* entrenamientos;
* recompensas;
* milestones;
* récords.
Resultado esperado:
audio = 0
funcionalidad = 100%
 
⸻
 
39. TEST DE HAPTICS
Probar:
haptics ON
haptics OFF
El segundo debe funcionar exactamente igual salvo por la vibración.
 
⸻
 
40. TEST DE CAMBIO DE VOLUMEN
Cambiar:
100%
50%
10%
0%
durante la ejecución.
El motor debe actualizarse sin necesidad de reiniciar la aplicación.
 
⸻
 
41. TEST DE CAMBIO DE PERFIL
Cambiar:
Equilibrado
↓
Inmersivo
↓
Silencioso
↓
Personalizado
sin reiniciar.
 
⸻
 
42. TEST EN MÓVIL
Especial prioridad:
* iPhone Safari;
* iOS PWA;
* Android Chrome.
Comprobar:
* primera interacción;
* reproducción;
* volumen;
* vibración;
* suspensión;
* volver a la aplicación;
* cambio de pestaña;
* bloqueo/desbloqueo del teléfono.
 
⸻
 
43. TEST DE AURICULARES
Probar:
* altavoz;
* AirPods;
* auriculares Bluetooth;
* auriculares cableados cuando proceda.
No debe existir una diferencia de comportamiento lógica entre dispositivos de salida.
 
⸻
 
44. TEST DE INTERRUPCIÓN
Durante un sonido:
llamada
notificación
bloqueo
cambio de aplicación
La aplicación debe recuperarse correctamente.
No asumir que el contexto de audio permanecerá activo permanentemente.
 
⸻
 
45. TEST DE RECUPERACIÓN
Después de volver a la aplicación:
app suspended
↓
app resumed
↓
audio engine check
↓
reinitialize if necessary
 
⸻
 
46. TEST DE CARGA
Simular:
100 eventos
en pocos segundos.
Comprobar:
* memoria;
* CPU;
* cola;
* número de instancias de audio;
* retrasos;
* bloqueos.
 
⸻
 
47. CRITERIO DE CALIDAD
Antes de aprobar cualquier sonido:
Debe responder “sí” a:
* ¿Se reconoce?
* ¿Es suficientemente corto?
* ¿Tiene volumen adecuado?
* ¿Encaja con JC Lifestyle?
* ¿No molesta después de repetirlo?
* ¿Se distingue de otros?
* ¿Tiene sentido para el evento?
* ¿Funciona con el resto del sistema?
Si alguna respuesta es “no”:
el sonido no está aprobado.
 
⸻
 
48. CONTROL DE VERSIONES
Los sonidos deben tener versiones.
Ejemplo:
streak_milestone_30_v1
streak_milestone_30_v2
Pero en producción:
streak_milestone_30
apunta siempre a la versión aprobada.
Esto permite reemplazar un sonido sin cambiar el código.
 
⸻
 
49. SISTEMA DE REEMPLAZO
Si mañana se decide:
“No me gusta el sonido del milestone de 30 días.”
No se modifica la lógica.
Simplemente:
old asset
↓
new asset
El evento continúa siendo:
streak_milestone_30
 
⸻
 
50. CHECKLIST FINAL DE PRODUCCIÓN
Antes de cerrar el sistema:
* Todos los sonidos tienen nombre.
* Todos los sonidos tienen categoría.
* Todos tienen prioridad.
* Todos tienen volumen.
* Todos tienen cooldown.
* Todos tienen duración definida.
* Todos los sonidos importantes tienen haptic asociado.
* Todos los archivos están optimizados.
* Existe fallback.
* Existe caché.
* Existe control maestro.
* Existe control por categorías.
* Existe modo silencioso.
* Existe modo equilibrado.
* Existe modo inmersivo.
* Existe modo personalizado.
* Existe cola.
* Existe sistema anti-spam.
* Existe sistema de prioridades.
* Existe sistema de interrupción.
* Existe soporte para suspensión/resume.
* Se ha probado en móvil.
* Se ha probado con auriculares.
* Se ha probado con volumen 0.
* Se ha probado con sonidos desactivados.
* Los errores de audio no rompen la aplicación.
 
⸻
 
51. ARQUITECTURA FINAL
El sistema completo queda:
                         JC LIFESTYLE
                              │
                              ▼
                         APP EVENT
                              │
                              ▼
                       EVENT MANAGER
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
          GAMIFICATION      STREAK          GOALS
              │               │               │
              └───────────────┼───────────────┘
                              ▼
                       SOUND DECISION
                              │
                   ┌──────────┼──────────┐
                   ▼          ▼          ▼
                PRIORITY   COOLDOWN    QUEUE
                   │          │          │
                   └──────────┼──────────┘
                              ▼
                        SOUND ENGINE
                              │
                  ┌───────────┴───────────┐
                  ▼                       ▼
                AUDIO                   HAPTIC
                  │                       │
                  └───────────┬───────────┘
                              ▼
                         USER FEEDBACK
 
⸻
 
52. RESULTADO
Con esta fase queda definido el camino completo:
EVENTO
↓
DECISIÓN
↓
PRIORIDAD
↓
SONIDO
↓
HAPTIC
↓
ANIMACIÓN
↓
FEEDBACK
El sistema queda preparado para crecer junto a JC Lifestyle.
Si posteriormente se añade:
* nutrición;
* estudios;
* productividad;
* economía;
* fútbol;
* calistenia;
* objetivos;
* nuevos tipos de racha;
* nuevas recompensas;
no habrá que reconstruir el sistema.
Simplemente se podrá registrar:
nuevo evento
+
nuevo sonido
 
⸻
 
53. ESTADO FINAL DEL SISTEMA DE SONIDO
Las cinco fases quedan:
FASE 1
Concepto e identidad
             ✓

FASE 2
Arquitectura del sistema
             ✓

FASE 3
Motor de eventos y feedback
             ✓

FASE 4
Diseño y especificación de sonidos
             ✓

FASE 5
Producción + integración + testing
             ✓
SISTEMA DE SONIDO: 100% COMPLETADO
El sistema ya está definido desde el concepto hasta la integración y las pruebas.
La siguiente ampliación, si se quiere llevar JC Lifestyle a un nivel todavía superior, ya no sería otra fase obligatoria del motor de sonido, sino una fase independiente de producción creativa de los propios sonidos: crear la biblioteca sonora definitiva de JC Lifestyle y decidir exactamente qué audio se genera para cada ID.

Sí. Seguimos con la FASE 4 del sistema de sonido de JC Lifestyle, justo desde donde lo dejamos. Aquí ya pasamos de la lógica del motor a definir cómo debe ser cada sonido y cómo se construye la identidad sonora.
JC LIFESTYLE — SISTEMA DE SONIDO
FASE 4 — DISEÑO Y ESPECIFICACIÓN DE LOS SONIDOS
1. OBJETIVO
Definir exactamente qué sonidos necesita JC Lifestyle, cómo deben sonar, cuánto deben durar, qué intensidad deben tener y cómo deben relacionarse entre sí.
Esta fase NO consiste todavía en implementar archivos definitivos.
Consiste en crear la especificación que permitirá posteriormente generar, seleccionar o sustituir cada sonido sin modificar la arquitectura del sistema.
 
⸻
 
2. IDENTIDAD SONORA DE JC LIFESTYLE
La identidad debe transmitir:
* progreso;
* disciplina;
* energía;
* elegancia;
* satisfacción;
* tecnología;
* sensación premium.
Debe evitar:
* sonidos infantiles;
* sonidos excesivamente arcade;
* sonidos molestos;
* sonidos demasiado largos;
* sonidos genéricos de aplicaciones;
* efectos exagerados para acciones pequeñas.
La sensación general debe estar entre:
premium + deportivo + tecnológico + motivacional.
 
⸻
 
3. REGLA DE DURACIÓN
Los sonidos de interfaz deben ser muy cortos.
Microinteracción
40–150 ms
Feedback
100–300 ms
Recompensa
250–700 ms
Milestone
500–1.200 ms
Gran logro
800–2.000 ms
Récord excepcional
1.000–2.500 ms
Nunca utilizar sonidos largos para acciones que el usuario realiza continuamente.
 
⸻
 
4. FAMILIAS SONORAS
Todos los sonidos estarán divididos en familias.
JC SOUND SYSTEM
│
├── UI
├── FEEDBACK
├── PROGRESS
├── REWARD
├── STREAK
├── ACHIEVEMENT
├── WARNING
└── SYSTEM
Cada familia debe compartir características acústicas.
 
⸻
 
5. FAMILIA UI
Sonidos extremadamente discretos.
UI_CLICK
Uso:
* botón;
* selección;
* interacción.
Duración:
50–100 ms
Características:
* ataque rápido;
* sonido limpio;
* poca cola;
* volumen bajo.
 
⸻
 
UI_TOGGLE_ON
Debe tener una pequeña sensación ascendente.
Conceptualmente:
tap
↗
Representa:
activado.
 
⸻
 
UI_TOGGLE_OFF
Debe ser ligeramente descendente.
tap
↘
Representa:
desactivado.
No debe parecer un error.
 
⸻
 
UI_OPEN
Para abrir elementos.
Duración aproximada:
100–180 ms
Sensación:
expansión.
 
⸻
 
UI_CLOSE
Para cerrar.
Sensación:
resolución.
 
⸻
 
6. FAMILIA FEEDBACK
Más perceptible que UI.
SUCCESS
Representa:
acción realizada correctamente.
Duración:
150–250 ms
Debe ser uno de los sonidos más reconocibles de toda la aplicación.
No debe confundirse con una recompensa.
 
⸻
 
SAVE
Para guardar datos.
Duración:
100–200 ms
Debe transmitir:
guardado correctamente.
 
⸻
 
ERROR
Duración:
150–300 ms
Características:
* corto;
* claramente diferente;
* no agresivo.
No utilizar sonidos de alarma.
 
⸻
 
WARNING
Para situaciones que requieren atención.
Debe transmitir:
cuidado.
No:
has fracasado.
 
⸻
 
7. FAMILIA PROGRESS
Aquí empieza la parte motivacional.
TASK_COMPLETE
Cuando se completa una tarea.
Duración:
200–350 ms
Debe sentirse ligeramente superior a SUCCESS.
 
⸻
 
HABIT_COMPLETE
Cuando se completa un hábito.
Duración:
250–400 ms
Debe comenzar a introducir la identidad de progreso.
 
⸻
 
GOAL_PROGRESS
Cuando se produce progreso significativo.
No debe sonar cada vez que un porcentaje cambia.
Solo cuando se alcanza un punto relevante.
Ejemplo:
25%
50%
75%
100%
 
⸻
 
8. XP
XP_SMALL
Para cantidades pequeñas.
Ejemplo:
+5 XP
+10 XP
Duración:
50–120 ms
 
⸻
 
XP_MEDIUM
Para recompensas intermedias.
Duración:
150–250 ms
 
⸻
 
XP_LARGE
Para recompensas importantes.
Duración:
250–450 ms
Los tres deben pertenecer a la misma familia.
 
⸻
 
9. LEVEL UP
El LEVEL_UP debe ser uno de los sonidos importantes.
Debe contener:
inicio
+
ascenso
+
resolución
Conceptualmente:
▁ ▃ ▅ ▇
        ✦
Duración:
600–1.000 ms
Debe poder reconocerse inmediatamente incluso sin mirar la pantalla.
 
⸻
 
10. RECOMPENSA
REWARD_SMALL
Para pequeñas recompensas.
Duración:
250–350 ms
 
⸻
 
REWARD_MEDIUM
Duración:
400–600 ms
 
⸻
 
REWARD_MAJOR
Duración:
600–900 ms
Debe sentirse claramente superior.
 
⸻
 
11. INSIGNIAS
BADGE_UNLOCK
Debe transmitir:
algo nuevo ha sido desbloqueado.
Estructura:
impacto pequeño
↓
ascenso
↓
brillo
↓
resolución
Duración:
600–1.000 ms
 
⸻
 
12. OBJETIVO COMPLETADO
GOAL_COMPLETE
Debe tener personalidad propia.
No utilizar exactamente el mismo sonido que:
TASK_COMPLETE
Debe transmitir:
has terminado algo importante.
Duración:
400–700 ms
 
⸻
 
13. SISTEMA DE RACHA
La racha será la familia más importante de JC Lifestyle.
Aquí construiremos una evolución.
STREAK
│
├── START
├── INCREMENT
├── MILESTONE
├── RECORD
├── AT_RISK
├── FREEZE
└── RECOVERED
 
⸻
 
14. STREAK_START
Primer día de racha.
Debe transmitir:
empieza algo.
Duración:
200–350 ms
No debe ser demasiado épico.
 
⸻
 
15. STREAK_INCREMENT
Cada día consecutivo.
Debe ser reconocible pero pequeño.
Duración:
100–200 ms
Importante:
No aumentar la intensidad todos los días.
Si el usuario lleva:
día 2
día 3
día 4
día 5
día 6
no debemos convertir cada día en una celebración enorme.
 
⸻
 
16. STREAK MILESTONES
Se establecerán inicialmente:
3 días
7 días
14 días
21 días
30 días
50 días
75 días
100 días
180 días
365 días
Cada milestone tendrá un nivel de importancia.
 
⸻
 
17. MILESTONE 3
Duración:
300–450 ms
Primera pequeña celebración.
Sensación:
“Ya has empezado a crear continuidad.”
 
⸻
 
18. MILESTONE 7
Duración:
500–700 ms
Debe ser claramente más especial.
Una semana completa debe sentirse como un primer gran logro.
 
⸻
 
19. MILESTONE 14
Duración:
600–800 ms
Aquí comienza una evolución musical más evidente.
 
⸻
 
20. MILESTONE 21
Duración:
650–850 ms
Debe sentirse más desarrollado que el de 14.
 
⸻
 
21. MILESTONE 30
Uno de los milestones principales.
Duración:
800–1.100 ms
Debe producir una sensación clara de:
“30 días.”
Este sonido debe poder reconocerse incluso con los ojos cerrados.
 
⸻
 
22. MILESTONE 50
Duración:
900–1.300 ms
Aquí se añade una segunda capa sonora.
 
⸻
 
23. MILESTONE 75
Duración:
900–1.400 ms
Debe ser una evolución del sonido de 50.
 
⸻
 
24. MILESTONE 100
Uno de los sonidos principales de toda la aplicación.
Duración:
1.000–1.600 ms
Debe sentirse como un acontecimiento.
No debe sonar simplemente como:
milestone_30
pero más fuerte.
Debe tener una evolución musical real.
 
⸻
 
25. MILESTONE 180
Duración:
1.200–1.800 ms
Representa una constancia extraordinaria.
Debe utilizar una estructura más compleja.
 
⸻
 
26. MILESTONE 365
El sonido más especial de la familia estándar.
Duración:
1.500–2.500 ms
Debe sentirse como:
un año completo.
Debe ser único.
 
⸻
 
27. RÉCORD PERSONAL
PERSONAL_RECORD
Este sonido debe ser diferente de los milestones.
Porque:
milestone
=
alcanzaste un número importante.
Mientras:
personal_record
=
superaste TU propio récord.
Por tanto, el sonido debe transmitir:
superación.
Duración:
800–1.500 ms
 
⸻
 
28. RACHA EN RIESGO
STREAK_AT_RISK
Duración:
200–400 ms
Debe ser sutil.
No utilizar:
* sirenas;
* alarmas;
* sonidos de fracaso;
* tonos agresivos.
Debe generar atención sin generar ansiedad.
 
⸻
 
29. STREAK FREEZE
STREAK_FREEZE_USED
Debe transmitir:
protección.
Duración:
300–500 ms
Puede utilizar una textura más suave.
 
⸻
 
30. STREAK RECOVERED
STREAK_RECOVERED
Duración:
500–800 ms
Debe ser claramente positivo.
Conceptualmente:
tensión
↓
resolución
↓
alivio
 
⸻
 
31. ACHIEVEMENT
ACHIEVEMENT_UNLOCKED
Duración:
700–1.200 ms
Debe ser una familia distinta de las rachas.
Porque un logro puede pertenecer a:
* entrenamiento;
* estudios;
* economía;
* hábitos;
* nutrición;
* productividad.
 
⸻
 
32. GRAND ACHIEVEMENT
GRAND_ACHIEVEMENT
Duración:
1.200–2.000 ms
Reservado para logros excepcionales.
Debe utilizarse muy poco.
Si aparece constantemente pierde su valor.
 
⸻
 
33. SONIDOS DE SISTEMA
SYNC_COMPLETE
Muy corto.
Representa:
datos sincronizados.
 
⸻
 
CONNECTION_LOST
Sutil.
No debe parecer un error grave si simplemente no hay conexión.
 
⸻
 
CONNECTION_RESTORED
Positivo pero discreto.
 
⸻
 
UPDATE_AVAILABLE
Opcional.
Debe ser discreto.
 
⸻
 
34. HAPTICS
Cada sonido importante podrá tener un patrón háptico asociado.
Ejemplo:
UI_CLICK
→ haptic ligero

TASK_COMPLETE
→ haptic ligero

MILESTONE
→ haptic medio

PERSONAL_RECORD
→ patrón especial

GRAND_ACHIEVEMENT
→ patrón largo
El usuario podrá desactivar completamente los hápticos.
 
⸻
 
35. DISEÑO DE LA ESCALA SONORA
La aplicación debe utilizar una escala sonora coherente.
No significa que todos los sonidos sean melodías.
Se puede crear una “firma” basada en determinados intervalos.
Ejemplo conceptual:
JC
↓
nota raíz
↓
intervalo de progreso
↓
resolución
Los sonidos de éxito podrán compartir esa firma.
Los sonidos de racha podrán evolucionarla.
Los grandes logros podrán desarrollar una versión más completa.
 
⸻
 
36. MOTIVO SONORO DE JC LIFESTYLE
Crear un pequeño motivo de identidad.
Debe ser extremadamente corto.
Por ejemplo:
2–4 notas
Ese motivo podrá aparecer de distintas maneras en:
* level up;
* milestone;
* achievement;
* récord;
* grandes recompensas.
Así se crea una identidad sonora reconocible.
 
⸻
 
37. REGLA DE NO REPETICIÓN
Un mismo sonido no debe utilizarse para demasiados acontecimientos.
Ejemplo incorrecto:
SUCCESS
=
tarea
=
objetivo
=
racha
=
logro
=
recompensa
Debe existir una jerarquía.
 
⸻
 
38. VARIANTES
Para sonidos que se repiten mucho, crear pequeñas variantes.
Ejemplo:
task_complete_01
task_complete_02
task_complete_03
El motor puede seleccionar una variante aleatoriamente.
Pero:
* deben pertenecer a la misma familia;
* deben tener volumen equivalente;
* no deben cambiar de significado.
 
⸻
 
39. REGLA PARA LA ALEATORIEDAD
La aleatoriedad nunca debe utilizarse en:
* milestones;
* récords;
* level up;
* grandes logros.
Estos deben tener un sonido único.
La variación se utilizará principalmente en:
* clicks;
* feedback;
* pequeñas recompensas;
* tareas.
 
⸻
 
40. TRANSICIONES
No hacer cortes bruscos.
Los sonidos que tengan cola deben tener una pequeña caída.
Especialmente:
* recompensas;
* milestones;
* logros;
* rachas.
 
⸻
 
41. MASTERING
Todos los sonidos deberán normalizarse para que no existan diferencias absurdas de volumen.
Ejemplo:
click = bajo
success = medio
reward = medio-alto
milestone = alto
Pero nunca:
click = 20%
milestone = 500%
El volumen debe estar controlado por el motor.
 
⸻
 
42. FORMATO
Los archivos deberán utilizar un formato adecuado para web y móvil.
Prioridad:
Web-friendly + tamaño reducido + buena calidad.
No utilizar archivos innecesariamente pesados.
La implementación final podrá mantener diferentes formatos cuando sea necesario para compatibilidad.
 
⸻
 
43. NOMENCLATURA
Todos los archivos deben seguir una convención.
Ejemplo:
ui_click_01
ui_toggle_on
ui_toggle_off

feedback_success
feedback_error
feedback_warning

progress_task_complete
progress_habit_complete

reward_xp_small
reward_xp_medium
reward_xp_large

reward_level_up
reward_badge_unlock

streak_start
streak_increment
streak_milestone_03
streak_milestone_07
streak_milestone_14
streak_milestone_21
streak_milestone_30
streak_milestone_50
streak_milestone_75
streak_milestone_100
streak_milestone_180
streak_milestone_365

streak_personal_record
streak_at_risk
streak_freeze_used
streak_recovered

achievement_unlocked
achievement_grand

system_sync_complete
system_connection_lost
system_connection_restored
 
⸻
 
44. REGISTRO DEFINITIVO
El SoundRegistry debe conocer cada sonido.
Cada entrada deberá contener conceptualmente:
id
category
priority
duration
volumeMultiplier
cooldown
allowOverlap
allowQueue
haptic
Ejemplo:
{
  id: "streak_milestone_30",
  category: "streak",
  priority: 4,
  duration: 1000,
  volumeMultiplier: 1,
  cooldown: 1500,
  allowOverlap: false,
  allowQueue: true,
  haptic: "major"
}
 
⸻
 
45. TESTING
Cada sonido deberá probarse en:
* iPhone;
* Android;
* Safari;
* Chrome;
* modo silencio;
* auriculares;
* altavoz;
* volumen bajo;
* volumen medio;
* volumen alto.
También deberá comprobarse que:
sonido OFF
no rompe ninguna funcionalidad.
 
⸻
 
46. TEST DE SATURACIÓN
Realizar pruebas artificiales:
100 clicks
50 tareas
20 recompensas
10 eventos simultáneos
5 milestones simultáneos
El sistema nunca debe:
* quedarse reproduciendo sonidos indefinidamente;
* acumular una cola absurda;
* bloquear la interfaz;
* producir sonidos superpuestos de manera caótica.
 
⸻
 
47. TEST DE EVENTOS SIMULTÁNEOS
Ejemplo:
Usuario completa tarea
↓
+10 XP
↓
sube de nivel
↓
alcanza milestone de racha
↓
nuevo récord
El sistema debe resolver:
nuevo récord
      ↓
prioridad máxima
      ↓
reproducir RECORD
      ↓
no reproducir 4 sonidos encima
La interfaz sí puede mostrar visualmente:
+10 XP
LEVEL UP
30 DÍAS
NUEVO RÉCORD
Pero sonoramente debe existir jerarquía.
 
⸻
 
48. OBJETIVO FINAL
Cuando termine esta fase, el equipo que implemente JC Lifestyle debe poder recibir una tabla como:
EVENTO
↓
SONIDO
↓
DURACIÓN
↓
PRIORIDAD
↓
VOLUMEN
↓
HAPTIC
↓
COOLDOWN
y saber exactamente qué debe implementar.
No debe existir ninguna decisión importante sobre sonido que tenga que improvisarse durante la programación.
 
⸻
 
49. CRITERIOS DE ACEPTACIÓN DE LA FASE 4
La fase se considera terminada cuando:
* están definidas todas las familias;
* están definidos los sonidos principales;
* están definidos los sonidos de racha;
* están definidos los milestones;
* está definido el récord personal;
* están definidos los logros;
* está definido el sistema de XP;
* está definido el level up;
* están definidos los sonidos de error;
* están definidos los sonidos de sistema;
* están definidas las duraciones;
* están definidas las prioridades;
* está definida la nomenclatura;
* está definido el sistema de variantes;
* está definido el comportamiento háptico;
* está definida la identidad sonora;
* está definido el motivo sonoro de JC Lifestyle;
* están definidas las reglas de testing.
 
⸻
 
50. RESULTADO
La arquitectura sonora queda ahora dividida en cuatro capas:
CAPA 1
MOTOR
↓
decide qué ocurre

CAPA 2
EVENTOS
↓
determina qué debe sonar

CAPA 3
DISEÑO SONORO
↓
determina cómo suena

CAPA 4
CONFIGURACIÓN
↓
determina cuánto y cuándo lo escucha el usuario
Con esto, JC Lifestyle puede tener un sistema sonoro completamente escalable.
La siguiente fase ya puede entrar en la parte de producción y generación de los sonidos, incluyendo cómo crear los archivos, cómo mantener una firma sonora coherente, cómo preparar variantes y cómo integrarlos físicamente en la aplicación.
FIN DE FASE 4
PROGRESO DEL SISTEMA DE SONIDO: 75% / 100%
SIGUIENTE: FASE 5 — PRODUCCIÓN, ARCHIVOS DE AUDIO, INTEGRACIÓN Y TEST FINAL.

🔊 JC FITNESS / LIFESTYLE — SISTEMA DE SONIDO
FASE 2 — BIBLIOTECA DE SONIDOS + CATEGORÍAS + ASIGNACIONES
Continúa exactamente desde la FASE 1 del Sistema Global de Sonido.
Ya existe el motor central de audio. Ahora vamos a construir la biblioteca de sonidos del sistema y la lógica que determina qué sonido corresponde a cada evento.
Esta fase NO construye todavía la pantalla completa de Ajustes ni la subida de sonidos personalizados. Eso será posterior.
 
⸻
 
1. OBJETIVO
Quiero que JC Fitness/Lifestyle deje de tener sonidos definidos directamente en el código.
La arquitectura debe funcionar así:
EVENTO
   ↓
CATEGORÍA
   ↓
ASIGNACIÓN
   ↓
SONIDO
   ↓
AUDIO ENGINE
   ↓
REPRODUCCIÓN
Ejemplo:
STREAK_MILESTONE
↓
STREAK
↓
milestone_01
↓
AudioEngine
↓
reproducir
 
⸻
 
2. BIBLIOTECA CENTRAL
Crea una biblioteca central de sonidos.
Conceptualmente:
SoundLibrary
Debe poder contener:
* sonidos del sistema;
* sonidos predeterminados;
* futuros sonidos personalizados.
Cada sonido debe tener una identificación única.
Ejemplo:
ui_click_01
success_01
streak_01
milestone_01
record_01
achievement_01
error_01
No utilices nombres ambiguos como:
sound1
sound2
sound3
 
⸻
 
3. CATEGORÍAS
Organiza la biblioteca como mínimo en:
UI
FEEDBACK
STREAK
ACHIEVEMENT
TRAINING
NOTIFICATION
SYSTEM
CUSTOM
No es necesario que todas tengan sonidos desde el principio.
La estructura debe estar preparada para crecer.
 
⸻
 
4. BIBLIOTECA INICIAL
Crea una selección inicial pequeña pero de calidad.
No quiero 100 sonidos.
Prefiero aproximadamente:
UI
* click;
* toggle;
* back;
* select.
Feedback
* success;
* error;
* confirmation.
Rachas
* inicio de racha;
* continuación;
* hito;
* récord;
* racha rota.
Logros
* desbloqueo;
* logro importante.
Entrenamiento
* ejercicio completado;
* objetivo completado.
La cantidad exacta debe depender de lo que realmente necesite la aplicación.
 
⸻
 
5. FILOSOFÍA DEL SONIDO
Los sonidos deben sentirse:
premium + limpios + modernos + deportivos + satisfactorios.
NO quiero:
* sonidos infantiles;
* sonidos excesivamente estridentes;
* efectos de casino;
* sonidos demasiado largos;
* sonidos molestos;
* sonidos que parezcan de una aplicación genérica.
Especialmente los sonidos de racha deben tener una identidad propia.
 
⸻
 
6. JERARQUÍA SONORA
No todos los sonidos deben tener la misma intensidad.
Nivel 1 — Microfeedback
Ejemplo:
click
toggle
Muy discreto.
Nivel 2 — Feedback
Ejemplo:
success
confirmation
Claramente audible pero corto.
Nivel 3 — Progreso
Ejemplo:
streak started
milestone
Más satisfactorio.
Nivel 4 — Especial
Ejemplo:
new record
major achievement
100 días
Debe sentirse realmente especial.
 
⸻
 
7. DURACIÓN
Como regla general:
UI
Muy cortos.
Feedback
Cortos.
Rachas
Cortos/medios.
Grandes logros
Pueden ser ligeramente más largos.
Evita sonidos largos para acciones frecuentes.
 
⸻
 
8. NO HACER LOUDNESS EXCESIVO
Normaliza los sonidos para que:
click
success
milestone
record
no tengan diferencias de volumen incómodas.
El usuario no debería tener que modificar el volumen del teléfono cada vez que ocurre un evento diferente.
 
⸻
 
9. ASIGNACIONES
Crea una configuración central:
SoundAssignments
Ejemplo:
UI_CLICK
→ ui_click_01

SUCCESS
→ success_01

STREAK_STARTED
→ streak_start_01

STREAK_MILESTONE
→ milestone_01

NEW_RECORD
→ record_01

ACHIEVEMENT_UNLOCKED
→ achievement_01
Esto debe poder cambiarse posteriormente.
 
⸻
 
10. NO CODIFICAR ASIGNACIONES EN COMPONENTES
Prohibido:
if event === "STREAK_MILESTONE":
   play("milestone_01")
dentro de un componente.
El componente solo debe emitir:
STREAK_MILESTONE
El sistema global decide el sonido.
 
⸻
 
11. SONIDO PREDETERMINADO
Cada evento importante debe tener un sonido predeterminado.
Ejemplo:
defaultSound
Esto garantiza que la aplicación siempre tenga una respuesta sonora cuando el sonido esté activado.
 
⸻
 
12. FALLBACK
La resolución debe ser:
sonido personalizado
      ↓
sonido asignado
      ↓
sonido predeterminado
      ↓
silencio
Nunca debe producir un error fatal.
 
⸻
 
13. PREPARACIÓN PARA PERSONALIZACIÓN
Aunque todavía NO vamos a implementar la subida de archivos, la biblioteca debe distinguir:
SYSTEM
CUSTOM
Ejemplo:
SoundSource
{
    type: "system"
    id: "milestone_01"
}
En el futuro:
SoundSource
{
    type: "custom"
    id: "user_sound_123"
}
 
⸻
 
14. METADATA
Cada sonido debe poder tener:
id
name
category
event
source
path/url
duration
volume
enabled
No añadas campos que no tengan utilidad.
 
⸻
 
15. PRESETS
Prepara la posibilidad de crear conjuntos de sonidos.
Por ejemplo:
Default
Minimal
Sport
Energetic
Custom
No es obligatorio implementar todos ahora.
Pero la arquitectura debe permitir que el usuario pueda elegir posteriormente un pack de sonidos.
 
⸻
 
16. PACK PREDETERMINADO
El pack principal de JC Fitness/Lifestyle debería sentirse coherente.
Por ejemplo:
JC Core
con sonidos cuidadosamente seleccionados para:
* interfaz;
* éxito;
* rachas;
* récords;
* logros.
No quiero que cada sonido parezca creado por una aplicación diferente.
 
⸻
 
17. SONIDOS DE RACHA
Aquí quiero especial atención.
Los sonidos de:
STREAK_STARTED
STREAK_CONTINUED
STREAK_MILESTONE
NEW_RECORD
STREAK_BROKEN
deben formar una familia sonora.
El usuario debería reconocer:
“Ese sonido es de JC Fitness.”
sin necesidad de mirar la pantalla.
 
⸻
 
18. PROGRESIÓN SONORA
Si es posible, establece una sensación progresiva.
Ejemplo conceptual:
1 día
→ pequeño sonido

7 días
→ sonido más satisfactorio

30 días
→ sonido especial

100 días
→ sonido épico
No hagas sonidos exagerados para todos los días.
La importancia debe aumentar con el logro.
 
⸻
 
19. RÉCORD
El sonido de:
NEW_RECORD
debe ser diferente al sonido normal de:
STREAK_MILESTONE
Porque psicológicamente son eventos diferentes.
 
⸻
 
20. LOGRO
Igualmente:
ACHIEVEMENT_UNLOCKED
debe tener identidad propia.
No reutilices automáticamente el sonido de SUCCESS.
 
⸻
 
21. RUPTURA DE RACHA
El sonido de racha rota debe ser:
* discreto;
* neutro;
* no agresivo;
* no humillante.
La aplicación debe comunicar:
“La racha terminó.”
no:
“Has fracasado.”
 
⸻
 
22. VOLUMEN POR CATEGORÍA
El motor debe poder resolver:
masterVolume
uiVolume
feedbackVolume
streakVolume
achievementVolume
trainingVolume
notificationVolume
Aunque la interfaz de estos controles llegue en una fase posterior.
 
⸻
 
23. MUTE
Debe existir:
soundEnabled = false
Cuando está desactivado:
NINGÚN sonido debe reproducirse.
No debe haber excepciones accidentales.
 
⸻
 
24. VOLUMEN 0
Si:
masterVolume = 0
el resultado debe ser silencio.
No intentes reproducir sonidos innecesariamente.
 
⸻
 
25. MEMORIA
No mantengas todos los archivos decodificados en memoria sin necesidad.
Utiliza una estrategia razonable de:
* preload;
* cache;
* lazy loading.
Los sonidos más utilizados pueden estar disponibles rápidamente.
 
⸻
 
26. CONCURRENCIA
Si ocurre:
SUCCESS
STREAK_CONTINUED
STREAK_MILESTONE
en una misma acción, el sistema debe evitar una mezcla caótica.
Debe existir una estrategia de:
* prioridad;
* agrupación;
* supresión;
* cola;
* sustitución.
Ejemplo:
Si ocurre un hito:
SUCCESS
STREAK_CONTINUED
STREAK_MILESTONE
puede reproducirse solamente:
STREAK_MILESTONE
porque es el evento más relevante.
 
⸻
 
27. COLA DE SONIDOS
Si realmente es necesaria, crea una cola ligera.
Pero:
NO quiero una cola que acumule 30 sonidos.
Debe tener límites.
Los sonidos de UI pueden descartarse si pierden relevancia.
Los eventos importantes pueden conservarse.
 
⸻
 
28. INTERRUPCIÓN
Un sonido importante puede necesitar interrumpir uno anterior.
Ejemplo:
SUCCESS
↓
NEW_RECORD
El récord debe tener prioridad.
Implementa esta lógica solo donde aporte valor.
 
⸻
 
29. TEST DE BIBLIOTECA
Crea pruebas para:
sound exists
sound missing
event exists
event missing
fallback
volume
mute
category volume
priority
cooldown
duplicate events
 
⸻
 
30. ESTRUCTURA DE ARCHIVOS
Mantén una estructura limpia.
Por ejemplo:
audio/
├── engine/
├── library/
├── assignments/
├── types/
├── assets/
│   ├── ui/
│   ├── feedback/
│   ├── streak/
│   ├── achievements/
│   └── training/
Adapta esto a la estructura real del proyecto.
No reorganices todo innecesariamente si el proyecto ya tiene una arquitectura equivalente.
 
⸻
 
31. SUPABASE
En esta fase:
NO subas todavía archivos personalizados a Supabase Storage.
La biblioteca del sistema puede ser estática.
Solo prepara los tipos y abstracciones para que posteriormente puedan coexistir:
system sound
custom sound
 
⸻
 
32. CACHE/PWA
Comprueba que los sonidos incluidos en la aplicación:
* puedan cargarse correctamente;
* no rompan el service worker;
* no aumenten excesivamente el bundle;
* funcionen cuando la PWA esté instalada.
No metas archivos enormes.
 
⸻
 
33. COMPATIBILIDAD
Comprueba:
* Safari iOS;
* Chrome Android;
* Safari/macOS si corresponde;
* Chrome/Edge escritorio.
Especialmente:
* reproducción después de interacción;
* volumen;
* pausa;
* reanudación;
* PWA.
 
⸻
 
34. NO AÑADIR SONIDOS A TODO
No conectes automáticamente:
cada botón
cada input
cada navegación
cada cambio
a un sonido.
Selecciona solamente interacciones donde aporte valor.
La interfaz debe seguir siendo silenciosa en muchas situaciones.
Esto hará que los sonidos importantes destaquen más.
 
⸻
 
35. CRITERIO DE FINALIZACIÓN
La Fase 2 estará terminada cuando exista:
BIBLIOTECA
    ↓
CATEGORÍAS
    ↓
EVENTOS
    ↓
ASIGNACIONES
    ↓
PRIORIDADES
    ↓
VOLUMEN
    ↓
AUDIO ENGINE
y la aplicación pueda determinar de forma fiable:
“Para este evento, ¿qué sonido debo reproducir?”
sin que ningún módulo tenga que conocer el archivo concreto.
 
⸻
 
36. NO IMPLEMENTAR TODAVÍA
No implementes todavía:
* pantalla de Ajustes de sonido;
* sliders visuales;
* subida de archivos;
* sonidos personalizados;
* grabación de audio;
* editor;
* packs descargables;
* marketplace;
* sistema avanzado de vibración.
Eso será para las siguientes fases.
 
⸻
 
37. INFORME FINAL
Cuando termines, proporciona:
1. Biblioteca creada.
2. Categorías.
3. Eventos conectados.
4. Asignaciones.
5. Prioridades.
6. Fallback.
7. Control de volumen.
8. Gestión de concurrencia.
9. Compatibilidad PWA/iOS.
10. Pruebas.
11. Problemas encontrados.
12. Qué queda para la Fase 3.
Después:
DETENTE.
No avances automáticamente.
FASE 2 — BIBLIOTECA + ASIGNACIONES + CATEGORÍAS DE SONIDO
FIN DE LA FASE 2

Perfecto. Seguimos con JC Lifestyle — Sistema de Sonido, y mantenemos la estructura que llevábamos: cada fase es una implementación completa, no una lista de ideas sueltas.
En esta FASE 3 vamos a construir la parte que conecta el sonido con el comportamiento de la app: eventos, prioridades, rachas, recompensas y feedback. Esto es importante porque un buen sistema de sonido no debe poner un sonido diferente para cada botón; debe tener una gramática sonora coherente y reconocible. 
JC LIFESTYLE — SISTEMA DE SONIDO
FASE 3 — MOTOR DE EVENTOS, FEEDBACK Y RECOMPENSAS SONORAS
1. OBJETIVO DE LA FASE
Crear el motor que determina:
* cuándo debe reproducirse un sonido;
* qué sonido corresponde a cada evento;
* qué volumen utilizar;
* qué prioridad tiene cada sonido;
* cuándo un sonido puede interrumpir a otro;
* cómo se comportan los sonidos relacionados con rachas;
* cómo funcionan las recompensas y hitos;
* cómo evitar saturar al usuario.
El objetivo no es simplemente “añadir sonidos”.
El objetivo es conseguir que JC Lifestyle tenga una identidad sonora propia, donde el usuario pueda reconocer determinados acontecimientos incluso sin mirar la pantalla.
 
⸻
 
2. PRINCIPIO FUNDAMENTAL
El sistema debe utilizar el sonido como feedback, no como decoración constante.
Cada sonido tiene que responder a una pregunta:
“¿Qué acaba de ocurrir y qué debería sentir/entender el usuario?”
Por tanto:
* acción pequeña → sonido pequeño;
* acción importante → sonido más notable;
* logro → sonido especial;
* racha → identidad sonora propia;
* error → sonido claramente diferente;
* navegación → sonido extremadamente sutil o ninguno;
* acción repetitiva → evitar sonido excesivo.
Esto sigue el principio de que el significado del sonido debe permanecer estable aunque pueda variar su estilo. (uisfx.com⁠)
 
⸻
 
3. CATEGORÍAS DE EVENTOS SONOROS
El motor tendrá estas categorías principales:
A. INTERACCIÓN
Para acciones normales:
* botón pulsado;
* botón activado;
* toggle activado;
* toggle desactivado;
* selección;
* checkbox completado;
* slider;
* cambio de configuración.
B. NAVEGACIÓN
Para:
* abrir sección;
* cerrar sección;
* volver;
* expandir;
* contraer;
* abrir modal;
* cerrar modal.
La mayoría de estos sonidos serán opcionales y extremadamente suaves.
C. PROGRESO
Para:
* completar una tarea;
* completar un hábito;
* completar entrenamiento;
* registrar sueño;
* registrar comida;
* completar objetivo;
* subir progreso.
D. RECOMPENSA
Para:
* XP;
* puntos;
* nivel nuevo;
* insignia;
* logro;
* recompensa especial;
* desbloqueo.
E. RACHA
Categoría independiente.
Eventos:
* iniciar racha;
* aumentar racha;
* alcanzar 3 días;
* alcanzar 7 días;
* alcanzar 14 días;
* alcanzar 30 días;
* alcanzar 50 días;
* alcanzar 100 días;
* récord personal;
* racha en riesgo;
* utilizar protección de racha;
* recuperar racha.
F. ERROR
Para:
* acción inválida;
* formulario incorrecto;
* operación fallida;
* conexión fallida;
* acción bloqueada.
El sonido de error nunca debe parecerse al sonido de éxito.
G. SISTEMA
Para:
* sincronización;
* guardado;
* conexión;
* desconexión;
* actualización;
* notificación importante.
 
⸻
 
4. PRIORIDAD DE LOS SONIDOS
No todos los sonidos tienen la misma importancia.
El motor tendrá cinco niveles:
PRIORIDAD 0 — SILENCIOSO
No produce sonido.
Ejemplo:
* navegación normal;
* desplazamiento;
* abrir una pantalla secundaria.
PRIORIDAD 1 — MICRO
Sonido muy corto.
Ejemplo:
* botón;
* toggle;
* checkbox.
PRIORIDAD 2 — FEEDBACK
Sonido claramente perceptible.
Ejemplo:
* completar tarea;
* guardar información;
* registrar entrenamiento.
PRIORIDAD 3 — RECOMPENSA
Sonido especial.
Ejemplo:
* conseguir XP;
* completar objetivo;
* desbloquear insignia.
PRIORIDAD 4 — ÉPICO
Sonidos reservados para momentos importantes.
Ejemplo:
* racha de 30 días;
* nuevo récord;
* nivel importante;
* logro excepcional.
Esto evita que una acción trivial tenga el mismo impacto que conseguir un récord.
 
⸻
 
5. REGLA DE NO SATURACIÓN
El sistema debe tener un mecanismo de anti-spam sonoro.
Si el usuario realiza muchas acciones consecutivas:
click
click
click
click
click
JC Lifestyle no debe reproducir cinco sonidos fuertes.
El motor debe agrupar o limitar determinados eventos.
Ejemplo:
Usuario completa 10 elementos rápidamente

→ reproducir pequeños feedbacks de forma limitada
→ después reproducir una única confirmación de progreso
Los sonidos de alta prioridad sí pueden atravesar este límite.
Por ejemplo:
10 acciones normales
+
nuevo récord de racha
=
el récord SIEMPRE puede sonar
 
⸻
 
6. COOLDOWN SONORO
Cada sonido tendrá un cooldown configurable.
Ejemplo:
button:
cooldown = 80 ms

success:
cooldown = 300 ms

reward:
cooldown = 500 ms

milestone:
cooldown = 1000 ms
Esto evita sonidos duplicados cuando una misma acción dispara varios renders o eventos internos.
 
⸻
 
7. SISTEMA DE EVENTOS
El sistema deberá trabajar mediante eventos.
Conceptualmente:
soundEngine.play("task_complete")
o:
soundEngine.play("streak_increment")
o:
soundEngine.play("achievement")
La interfaz no debe encargarse directamente de gestionar archivos de audio.
Debe enviar un evento.
Ejemplo:
Usuario completa entrenamiento
        ↓
training_completed
        ↓
motor de gamificación
        ↓
actualiza XP
        ↓
comprueba racha
        ↓
comprueba milestone
        ↓
motor de sonido
        ↓
reproduce feedback correspondiente
Esto permitirá modificar los sonidos posteriormente sin tener que reconstruir cada módulo de la aplicación.
 
⸻
 
8. EVENTOS COMPUESTOS
Algunos acontecimientos generan varias consecuencias.
Por ejemplo:
Completar entrenamiento
        ↓
+ XP
        ↓
+ progreso
        ↓
racha continúa
        ↓
se alcanza Día 7
NO debemos reproducir:
success
xp
streak
milestone
todos simultáneamente.
El sistema debe decidir cuál es el acontecimiento dominante.
Orden de prioridad:
NUEVO RÉCORD
      ↓
MILESTONE
      ↓
LOGRO
      ↓
RACHA
      ↓
RECOMPENSA
      ↓
ÉXITO
      ↓
FEEDBACK NORMAL
Así, si el usuario alcanza simultáneamente un nuevo récord y consigue XP:
suena el récord, no cinco sonidos diferentes.
 
⸻
 
9. SISTEMA ESPECIAL DE RACHA
La racha debe tener una identidad sonora propia.
La racha no será simplemente:
success.wav
La sensación debe evolucionar con el progreso.
Por ejemplo:
Día 1
Sonido corto y limpio.
Sensación:
“Has empezado.”
Día 3
Un poco más energético.
“Estás creando continuidad.”
Día 7
Sonido reconocible de logro.
“Una semana.”
Día 14
Más capas.
“La constancia empieza a ser significativa.”
Día 30
Sonido claramente especial.
“Esto ya es un hábito.”
Día 50
Sonido premium.
Día 100
Sonido épico y único.
La idea es que el usuario vaya asociando la evolución de la racha con una evolución musical.
Los hitos de racha son especialmente útiles cuando celebran progreso real, pero deben evitar convertir la racha en una fuente de presión. (Smashing Magazine⁠)
 
⸻
 
10. RACHA NORMAL VS. MILESTONE
No debemos reproducir el mismo sonido cada día.
Ejemplo:
Día 4
→ streak_increment

Día 5
→ streak_increment

Día 6
→ streak_increment

Día 7
→ streak_milestone_7
El Día 7 sustituye al sonido normal.
Lo mismo:
14
30
50
100
365
 
⸻
 
11. RÉCORD PERSONAL
Crear un evento independiente:
personal_record
Este sonido tendrá una identidad extremadamente reconocible.
Ejemplo:
Racha anterior:
27 días

Nueva racha:
28 días

→ personal_record
Aunque 28 no sea un milestone global, es un logro personal.
Esto es importante porque JC Lifestyle debe recompensar el progreso del propio usuario, no solamente números prefijados.
 
⸻
 
12. RACHA EN RIESGO
No utilizar un sonido agresivo.
Nunca:
alarma
sirena
sonido negativo fuerte
Debe transmitir:
“Todavía puedes mantener tu progreso.”
No:
“Has fallado.”
Esto sigue un enfoque de rachas más saludable: las rachas funcionan mejor como estímulo que como castigo, y es recomendable incorporar mecanismos de gracia o recuperación. (Smashing Magazine⁠)
 
⸻
 
13. RECUPERACIÓN DE RACHA
Crear evento:
streak_recovered
Debe tener una sensación positiva.
Ejemplo conceptual:
Racha perdida
        ↓
usuario utiliza recuperación
        ↓
streak_recovered
        ↓
animación
        ↓
sonido
        ↓
mensaje positivo
Nunca debe sonar como un error.
 
⸻
 
14. PROTECCIÓN DE RACHA
Si en fases posteriores existe un sistema de “freeze”, protección o día de gracia:
streak_freeze_used
El sonido será diferente de:
streak_recovered
Porque uno significa:
“Tu racha se ha protegido.”
y el otro:
“Has recuperado tu racha.”
 
⸻
 
15. RECOMPENSAS
Crear una jerarquía sonora:
RECOMPENSA PEQUEÑA
XP +5
→ micro sonido.
RECOMPENSA MEDIA
XP +50
→ sonido más completo.
GRAN RECOMPENSA
achievement
→ sonido distintivo.
RECOMPENSA ÉPICA
major_achievement
→ secuencia sonora especial.
 
⸻
 
16. XP
El sonido de XP debe ser extremadamente corto.
No debe molestar si el usuario gana XP frecuentemente.
Ejemplo conceptual:
+5 XP
→ tick

+10 XP
→ double tick

+50 XP
→ reward

+100 XP
→ major reward
Pero estos sonidos deben compartir la misma familia sonora.
 
⸻
 
17. NIVELES
Crear:
level_up
Este será uno de los sonidos importantes.
Cuando:
XP actual >= XP necesaria
se dispara:
level_up
No reproducir simultáneamente:
xp
reward
achievement
El level_up domina.
 
⸻
 
18. INSIGNIAS
Crear:
badge_unlocked
Debe tener:
* inicio corto;
* pequeño ascenso;
* resolución brillante;
* cola muy corta.
La intención es que el usuario reconozca inmediatamente:
“He desbloqueado algo.”
 
⸻
 
19. OBJETIVOS
Cuando un objetivo llegue al 100%:
goal_completed
Debe combinarse con:
* animación;
* cambio visual del objetivo;
* feedback sonoro.
Pero no debe parecer un “nivel superado” si simplemente se ha completado una tarea.
 
⸻
 
20. VIBRACIÓN + SONIDO
Cuando el dispositivo lo permita, algunos eventos podrán utilizar:
SONIDO
+
HAPTIC
+
ANIMACIÓN
Ejemplo:
Botón
sonido
Tarea completada
sonido + haptic ligero
Milestone
sonido + haptic medio + animación
Récord
sonido + haptic especial + animación
La combinación de señales visuales, sonoras y hápticas puede hacer que los momentos de recompensa sean más perceptibles. (uxmatters.com⁠)
 
⸻
 
21. CONFIGURACIÓN DEL USUARIO
El usuario debe poder controlar:
Sonidos generales
🔊 Sonidos
ON / OFF
Volumen
0 ━━━━━━━●━━ 100
Sonidos de racha
🔥 Sonidos de racha
ON / OFF
Sonidos de recompensa
🏆 Sonidos de recompensa
ON / OFF
Sonidos de navegación
↔ Sonidos de interfaz
ON / OFF
Vibración
📳 Vibración
ON / OFF
 
⸻
 
22. MODOS DE SONIDO
Crear tres perfiles predefinidos:
SILENCIOSO
Todo OFF
excepto sonidos críticos si el usuario los permite.
EQUILIBRADO
Configuración recomendada.
interfaz → baja
feedback → media
recompensas → alta
rachas → alta
INMERSIVO
Todo el sistema sonoro activado.
Pensado para usuarios que quieren experimentar JC Lifestyle con toda la identidad sonora.
 
⸻
 
23. MODO PERSONALIZADO
El usuario podrá configurar cada categoría individualmente.
Ejemplo:
Interfaz       20%
Feedback       50%
Recompensas    80%
Rachas         100%
Errores        40%
Esto deberá almacenarse en configuración.
 
⸻
 
24. REGLA DE PRIORIDAD DEL VOLUMEN
Nunca superar el volumen maestro.
Fórmula conceptual:
volumen_final =
volumen_maestro × volumen_categoria × volumen_evento
Ejemplo:
Master = 80%

Categoría = 70%

Evento = 100%

Resultado = 56%
 
⸻
 
25. PREVISUALIZACIÓN
En Ajustes → Sonido:
Cada categoría tendrá un botón:
▶ Probar
Ejemplo:
🔥 Racha
[▶ Probar]

🏆 Recompensa
[▶ Probar]

✓ Éxito
[▶ Probar]

⚠ Aviso
[▶ Probar]
Esto permitirá al usuario escuchar el sonido antes de decidir si quiere activarlo.
 
⸻
 
26. SISTEMA DE SILENCIO INTELIGENTE
Debe existir una opción:
Silenciar automáticamente
con posibilidades como:
Nunca
Solo cuando el móvil está en silencio
Solo durante determinadas horas
Siempre
No debemos intentar luchar contra el modo silencio del dispositivo.
 
⸻
 
27. SONIDOS DURANTE SESIONES
Si el usuario está:
* entrenando;
* estudiando;
* haciendo una sesión de concentración;
el motor puede utilizar un perfil especial.
Ejemplo:
Sesión activa
↓
reducir sonidos de interfaz
↓
mantener sonidos de finalización
↓
mantener milestones
Así no se interrumpe constantemente la concentración.
 
⸻
 
28. IDENTIDAD SONORA
Todos los sonidos deben pertenecer a la misma familia.
No queremos:
sonido Apple
+
sonido videojuego
+
sonido Android
+
sonido genérico
Queremos:
JC Lifestyle
│
├── Interacción
├── Feedback
├── Progreso
├── Recompensa
├── Racha
├── Logro
└── Sistema
Todos deben parecer parte del mismo producto.
El sonido debe contribuir a que la aplicación se perciba como un producto cuidado y premium. El diseño sonoro intencional se considera parte de la experiencia de usuario, no un añadido posterior. (audiohooksstudio.com⁠)
 
⸻
 
29. ESTRUCTURA TÉCNICA RECOMENDADA
Crear un módulo:
/sound
con una estructura equivalente a:
sound/
├── SoundEngine
├── SoundRegistry
├── SoundSettings
├── SoundEvents
├── SoundQueue
├── SoundCooldown
├── SoundPreferences
└── sounds/
El objetivo es que el sistema sea modular.
 
⸻
 
30. REGISTRO CENTRAL DE SONIDOS
Debe existir un registro central.
Conceptualmente:
button
toggle
success
error
warning
save
xp
reward
level_up
badge_unlocked
goal_completed
streak_start
streak_increment
streak_milestone
personal_record
streak_at_risk
streak_recovered
streak_freeze_used
major_achievement
No crear llamadas de audio arbitrarias repartidas por toda la aplicación.
 
⸻
 
31. COLA DE SONIDOS
El motor debe tener una cola.
Ejemplo:
Evento A
Evento B
Evento C
El motor determina:
A → reproducir
B → combinar/esperar
C → descartar si es redundante
Pero:
personal_record
debe tener prioridad sobre eventos menores.
 
⸻
 
32. PERSISTENCIA
Guardar:
soundEnabled
masterVolume
interfaceVolume
feedbackVolume
rewardVolume
streakVolume
errorVolume
hapticsEnabled
soundProfile
La configuración debe mantenerse entre sesiones.
 
⸻
 
33. SEGURIDAD Y ROBUSTEZ
Si un archivo de sonido no existe:
NO romper la aplicación.
Debe ocurrir:
sound missing
↓
console warning
↓
continuar aplicación
Nunca:
sound missing
↓
crash
 
⸻
 
34. CARGA DE AUDIO
No cargar todos los sonidos pesados al iniciar la aplicación si no es necesario.
Priorizar:
sonidos pequeños
↓
carga rápida
↓
cache
Los sonidos de uso frecuente deberían estar preparados para evitar retrasos perceptibles.
 
⸻
 
35. PRIMER ARRANQUE
En el primer arranque:
soundEnabled = true
soundProfile = balanced
masterVolume = valor recomendado
Pero el usuario debe poder cambiarlo inmediatamente.
Si el navegador impide reproducción automática de audio, no intentar forzarla.
Esperar a una interacción del usuario.
 
⸻
 
36. EVENTO DE PRIMERA INTERACCIÓN
Cuando el usuario interactúe por primera vez:
userInteraction
↓
unlockAudioContext
↓
motor preparado
Esto es especialmente importante en navegadores móviles.
 
⸻
 
37. REGLA DE ACCESIBILIDAD
El sonido nunca puede ser la única forma de comunicar algo importante.
Por ejemplo:
Racha conseguida
debe aparecer también visualmente.
El sistema debe funcionar completamente:
con sonido
y:
sin sonido
Esto garantiza que desactivar los sonidos no elimine información funcional.
 
⸻
 
38. CRITERIOS DE ACEPTACIÓN
La FASE 3 solamente se considera terminada cuando:
* existe un motor central de sonido;
* existen eventos sonoros definidos;
* existen prioridades;
* existe cooldown;
* existe anti-spam;
* existe cola;
* existen sonidos de racha;
* existen sonidos de milestone;
* existe sonido de récord;
* existen sonidos de recompensa;
* existe sonido de nivel;
* existe sonido de logro;
* existe sonido de error;
* existe control de volumen;
* existen categorías configurables;
* existe modo silencioso;
* existe modo equilibrado;
* existe modo inmersivo;
* existe modo personalizado;
* existe soporte de vibración;
* existe persistencia de configuración;
* los sonidos no pueden romper la aplicación;
* el audio respeta las limitaciones del navegador;
* ninguna información importante depende exclusivamente del sonido.
 
⸻
 
39. RESULTADO FINAL DE LA FASE
Al terminar esta fase, JC Lifestyle ya no tendrá simplemente “archivos de audio”.
Tendrá un sistema inteligente de feedback sonoro.
La arquitectura será:
                    JC LIFESTYLE
                         │
                    EVENTO APP
                         │
                         ▼
                  SOUND ENGINE
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      PRIORIDAD       COOLDOWN        COLA
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                 REGLAS DE EVENTO
                         │
                         ▼
                SONIDO CORRESPONDIENTE
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
            AUDIO                 HAPTIC
              │                     │
              └──────────┬──────────┘
                         ▼
                   FEEDBACK VISUAL
Y, sobre todo:
el sonido de JC Lifestyle tendrá significado.
No será “un pitido cada vez que pulsas algo”.
Será un lenguaje:
✓ completaste algo → lo notas 🔥 mantienes la racha → lo reconoces 🏆 consigues un logro → lo celebras 📈 superas tu récord → lo recuerdas ⚠ estás en riesgo → te avisa sin castigarte 🚀 alcanzas un gran hito → el sistema lo convierte en un momento especial
FIN DE FASE 3
Progreso del sistema de sonido: 60% / 100%
FASE 4 será: la arquitectura y especificación de los sonidos individuales — qué sonidos exactos necesitamos crear, duración, capas, intensidad, evolución de las rachas, sonidos de 7/14/30/50/100 días y la identidad sonora premium de JC Lifestyle.

PROMPT PARA CLAUDE — FASE 1
Sistema Global de Sonido: arquitectura, motor, eventos y preparación para producción
Continúa trabajando sobre el proyecto JC Fitness / JC Lifestyle.
El Sistema de Rachas ya ha sido desarrollado en sus 5 fases anteriores. Ahora comenzamos un sistema completamente independiente:
🔊 SISTEMA GLOBAL DE SONIDO
IMPORTANTE:
No quiero que el audio se implemente directamente dentro de cada componente.
Quiero crear un motor de audio global, reutilizable por toda la aplicación.
La arquitectura debe permitir posteriormente:
* sonidos de interfaz;
* sonidos de éxito;
* sonidos de entrenamiento;
* sonidos de rachas;
* sonidos de logros;
* sonidos económicos;
* sonidos de estudio;
* sonidos personalizados;
* volumen global;
* volumen por categoría;
* activar/desactivar sonidos;
* vibración;
* subida de sonidos propios;
* asignación de sonidos a eventos;
* futuras preferencias avanzadas.
Esta fase construye exclusivamente la arquitectura y el motor central.
 
⸻
 
1. INSPECCIONA PRIMERO EL PROYECTO
Antes de modificar nada:
* revisa framework;
* estructura de carpetas;
* sistema de estado;
* sistema de ajustes;
* Supabase;
* autenticación;
* PWA;
* componentes;
* sistema de eventos creado para Rachas;
* sistema de notificaciones si existe;
* cualquier audio existente.
NO dupliques arquitecturas.
Si ya existe:
EventBus
SettingsService
Preferences
Context
Store
o equivalente, intégrate con ellos.
 
⸻
 
2. OBJETIVO
Crear una arquitectura conceptual:
COMPONENTE
   ↓
EVENTO
   ↓
AUDIO ENGINE
   ↓
PREFERENCIAS
   ↓
SONIDO
   ↓
REPRODUCTOR
Por ejemplo:
Entrenamiento completado
        ↓
ACTION_COMPLETED
        ↓
AudioEngine
        ↓
¿Sonido activado?
        ↓
¿Volumen permitido?
        ↓
¿Existe sonido asignado?
        ↓
reproducir()
 
⸻
 
3. NO REPRODUCIR AUDIO DIRECTAMENTE
Queda prohibido crear lógica como esta repartida por la aplicación:
new Audio(...)
dentro de:
* Dashboard;
* entrenamiento;
* rachas;
* economía;
* estudios;
* botones individuales.
Todo debe pasar por un servicio central.
Conceptualmente:
AudioService
AudioEngine
AudioManager
Utiliza el nombre que mejor encaje con la arquitectura existente.
 
⸻
 
4. EVENTOS DE AUDIO
Crea un catálogo central de eventos.
Como mínimo:
UI_CLICK
UI_TOGGLE
ACTION_COMPLETED
ACTION_ERROR
SUCCESS
STREAK_STARTED
STREAK_CONTINUED
STREAK_MILESTONE
NEW_RECORD
ACHIEVEMENT_UNLOCKED
STREAK_BROKEN
Deja preparada la posibilidad de añadir:
TRAINING_COMPLETED
STUDY_COMPLETED
SLEEP_LOGGED
GOAL_COMPLETED
SAVING_COMPLETED
CUSTOM
No conectes todavía todos los módulos.
 
⸻
 
5. EVENTO ≠ SONIDO
Esto es fundamental.
No hagas:
STREAK_MILESTONE → streak.mp3
directamente dentro del código.
Debe existir una relación configurable:
EVENT
 ↓
SOUND ASSIGNMENT
 ↓
AUDIO FILE
Esto permitirá que el usuario pueda cambiar posteriormente el sonido.
Ejemplo:
STREAK_MILESTONE
→ default_success_03
y posteriormente:
STREAK_MILESTONE
→ user_custom_sound_07
sin modificar código.
 
⸻
 
6. AUDIO ENGINE
Crea una API interna equivalente a:
play(event)
stop()
pause()
resume()
setVolume()
mute()
unmute()
preload()
No tienen que llamarse exactamente así.
Lo importante es que exista una única interfaz.
Ejemplo conceptual:
AudioEngine.play("SUCCESS")
El componente no necesita saber:
* qué archivo se reproduce;
* dónde está;
* qué volumen tiene;
* si es personalizado;
* cómo se carga.
 
⸻
 
7. CONFIGURACIÓN GLOBAL
El motor debe consultar las preferencias globales.
Conceptualmente:
soundEnabled
masterVolume
Si:
soundEnabled = false
ningún evento debe producir sonido.
No hagas comprobaciones independientes en cada componente.
La decisión debe centralizarse.
 
⸻
 
8. CATEGORÍAS
Prepara categorías:
UI
FEEDBACK
STREAK
ACHIEVEMENT
TRAINING
NOTIFICATION
CUSTOM
Esto permitirá posteriormente:
Volumen general: 70%

Interfaz: 30%
Feedback: 70%
Rachas: 90%
Logros: 100%
No necesitas construir todavía los controles visuales.
Pero el motor debe soportarlo.
 
⸻
 
9. PRIORIDADES
No todos los sonidos tienen la misma importancia.
Prepara prioridades:
LOW
NORMAL
HIGH
CRITICAL
Ejemplo:
UI_CLICK → LOW
SUCCESS → NORMAL
STREAK_MILESTONE → HIGH
NEW_RECORD → HIGH
ACHIEVEMENT_UNLOCKED → HIGH
Esto será útil si varios sonidos se producen prácticamente al mismo tiempo.
 
⸻
 
10. COLISIONES
Evita que 5 sonidos se reproduzcan simultáneamente por una misma acción.
Ejemplo:
ACTION_COMPLETED
STREAK_CONTINUED
SUCCESS
podrían ocurrir prácticamente juntos.
El motor debe poder decidir:
* reproducir uno;
* agruparlos;
* priorizar el más importante;
* aplicar un pequeño delay;
* ignorar sonidos redundantes.
La experiencia debe sentirse elegante.
Nunca como:
una máquina tragaperras.
 
⸻
 
11. COOLDOWN
Implementa una protección contra spam.
Ejemplo:
Si el usuario pulsa rápidamente un botón 20 veces:
20 eventos
no deben convertirse necesariamente en:
20 sonidos
Puede existir:
debounce
cooldown
deduplication
según el evento.
 
⸻
 
12. SONIDOS DE INTERFAZ
Los sonidos de interfaz deben ser especialmente discretos.
Ejemplos:
UI_CLICK
UI_TOGGLE
UI_BACK
UI_SUCCESS
No quiero un sonido fuerte cada vez que se pulsa cualquier botón.
La arquitectura debe permitir decidir qué elementos producen sonido y cuáles no.
 
⸻
 
13. SONIDOS DE IMPORTANCIA
Los sonidos realmente especiales deben reservarse para:
STREAK_MILESTONE
NEW_RECORD
ACHIEVEMENT_UNLOCKED
MAJOR_GOAL_COMPLETED
Esto hará que tengan más impacto.
 
⸻
 
14. WEB AUDIO / HTML AUDIO
Analiza qué tecnología encaja mejor con el proyecto:
* HTMLAudioElement;
* Web Audio API;
* combinación de ambas;
* librería existente si realmente aporta valor.
Prioridades:
1. compatibilidad iOS;
2. compatibilidad Android;
3. PWA;
4. rendimiento;
5. baja latencia;
6. simplicidad;
7. control de volumen.
No añadas una librería pesada sin necesidad.
 
⸻
 
15. RESTRICCIONES DE IOS
Ten especialmente en cuenta Safari/iOS.
Los navegadores pueden bloquear reproducción automática.
El sistema debe respetar las políticas de autoplay.
Si el navegador exige una interacción previa del usuario:
primer tap
↓
inicializar AudioContext
↓
posteriormente reproducir sonidos
No intentes saltarte restricciones del navegador.
 
⸻
 
16. AUDIO CONTEXT
Si utilizas Web Audio API:
Gestiona correctamente:
AudioContext
suspended
running
closed
y su reanudación después de una interacción del usuario.
No crees un nuevo AudioContext cada vez que se reproduce un sonido.
Debe existir una instancia controlada.
 
⸻
 
17. PRELOAD
No cargues todos los sonidos de la aplicación al abrirla.
Los sonidos críticos pueden precargarse.
Los sonidos secundarios pueden cargarse bajo demanda.
La estrategia debe minimizar:
* tiempo inicial;
* memoria;
* consumo de datos.
 
⸻
 
18. CACHE
La PWA puede beneficiarse de cachear determinados sonidos.
Pero:
* no descargues sonidos innecesariamente;
* controla versiones;
* evita archivos obsoletos;
* integra la estrategia con el sistema de cache existente.
No construyas un sistema paralelo de service worker si ya existe uno.
 
⸻
 
19. ARCHIVOS DE AUDIO
Establece una convención.
Por ejemplo:
sounds/
    ui/
    feedback/
    streak/
    achievements/
    training/
    custom/
Adapta la estructura al proyecto.
No mezcles archivos de usuario con archivos del sistema.
 
⸻
 
20. FORMATOS
Evalúa formatos apropiados para web/PWA.
Prioriza:
* tamaño reducido;
* buena calidad;
* compatibilidad.
Puedes considerar:
WebM/Opus
MP3
WAV
según compatibilidad real.
No conviertas todo a formatos innecesariamente pesados.
 
⸻
 
21. SONIDOS DEL SISTEMA
Prepara una definición central:
DEFAULT_SOUNDS
Ejemplo conceptual:
SUCCESS
→ success_01

UI_CLICK
→ click_01

STREAK_MILESTONE
→ milestone_01
Pero NO es necesario crear todavía una biblioteca completa de sonidos.
Esta fase solo necesita dejar la arquitectura lista.
 
⸻
 
22. SONIDOS PERSONALIZADOS
No implementes todavía la subida completa.
Pero diseña la abstracción:
system sound
user sound
El motor debe poder recibir cualquiera.
Ejemplo:
SoundSource:
    type: system | custom
    id
    url/path
    duration
    metadata
 
⸻
 
23. METADATA
Prepara metadata útil:
* id;
* nombre;
* categoría;
* duración;
* formato;
* tamaño;
* origen;
* fecha de creación;
* usuario si es personalizado.
No guardes metadata innecesaria.
 
⸻
 
24. ASIGNACIONES
Debe existir una abstracción equivalente a:
SoundAssignment
Ejemplo:
event = STREAK_MILESTONE
sound = milestone_03
Posteriormente:
event = STREAK_MILESTONE
sound = my_custom_sound
La aplicación debe poder cambiar la asignación sin modificar componentes.
 
⸻
 
25. FALLBACK
Si el sonido asignado:
* no existe;
* está corrupto;
* no carga;
* fue eliminado;
el sistema debe intentar un fallback.
Ejemplo:
custom sound
↓
fallo
↓
default sound
Si tampoco existe:
silencio
La aplicación nunca debe romperse porque falle un sonido.
 
⸻
 
26. ERROR HANDLING
Nunca hagas que:
audio.play()
provoque un error que rompa la interfaz.
Los errores de audio deben ser controlados.
Ejemplo:
AudioError
→ log controlado
→ fallback
→ continuar aplicación
 
⸻
 
27. AJUSTES FUTUROS
La arquitectura debe quedar preparada para:
Sonidos
[ ON ]

Volumen general
████████░░ 80%

Interfaz
████░░░░░░ 40%

Rachas
█████████░ 90%

Logros
██████████ 100%

Vibración
[ ON ]
No construyas todavía toda esta pantalla.
Solo deja el motor preparado para consumir estas preferencias.
 
⸻
 
28. PREFERENCIAS PERSISTENTES
Las preferencias de audio deben poder persistirse.
La arquitectura futura debe soportar:
user_preferences
o el sistema de ajustes existente.
NO dependas únicamente de variables en memoria.
 
⸻
 
29. SINCRONIZACIÓN
Si las preferencias se sincronizan mediante Supabase:
iPhone
↓
preferencia de sonido
↓
Supabase
↓
ordenador
debe poder recuperarse.
Pero si el sistema de ajustes actual utiliza otra arquitectura, intégrate con ella.
 
⸻
 
30. EVENT BUS
Si el proyecto tiene un Event Bus:
ÚSALO.
No crees otro sistema de eventos paralelo.
Si no existe uno suficientemente adecuado, crea una abstracción ligera.
Ejemplo:
emit("STREAK_MILESTONE")
El Audio Engine puede suscribirse.
Posteriormente también podrán suscribirse:
Haptics
Notifications
Analytics
Celebrations
Esto es importante para que la arquitectura no se vuelva un conjunto de sistemas independientes.
 
⸻
 
31. DESACOPLAMIENTO
La arquitectura ideal debe permitir:
Evento
 ↓
 ├── Audio
 ├── Haptics
 ├── Visual
 ├── Notification
 └── Analytics
sin que:
Entrenamiento
tenga que conocer ninguno de ellos.
 
⸻
 
32. TEST MODE
Crea, si resulta útil, una forma interna de probar:
play("UI_CLICK")
play("SUCCESS")
play("STREAK_MILESTONE")
play("NEW_RECORD")
play("ACHIEVEMENT_UNLOCKED")
Puede ser:
* test;
* dev utility;
* función interna.
No expongas una herramienta de desarrollo peligrosa en producción.
 
⸻
 
33. PRUEBAS
Prueba como mínimo:
Sonido activado
Debe reproducir.
Sonido desactivado
No reproduce.
Volumen 0
No debe escucharse.
Volumen 50
Correcto.
Volumen 100
Correcto.
Evento inexistente
No rompe la app.
Archivo inexistente
Utiliza fallback.
AudioContext suspendido
Se recupera tras interacción.
Spam
No reproduce cientos de sonidos simultáneos.
Dos eventos simultáneos
Se aplica prioridad.
PWA
Funciona correctamente.
iOS
No rompe por autoplay.
Android
Funciona correctamente.
Navegador de escritorio
Funciona correctamente.
 
⸻
 
34. RENDIMIENTO
Mide o comprueba:
* memoria;
* número de instancias;
* tiempo de carga;
* tamaño de archivos;
* latencia.
No dejes múltiples Audio o AudioContext abandonados.
Limpia listeners cuando corresponda.
 
⸻
 
35. ACCESIBILIDAD
El sonido nunca debe ser la única forma de comunicar algo.
Ejemplo:
sonido de éxito
+
feedback visual
No:
solo sonido
Esto será especialmente importante para usuarios con el audio desactivado.
 
⸻
 
36. PRIVACIDAD
Los sonidos personalizados pertenecen al usuario.
La arquitectura futura debe garantizar:
usuario A
→ solo sus sonidos
No:
usuario A
→ sonidos privados de usuario B
 
⸻
 
37. SEGURIDAD FUTURA
Cuando posteriormente se implemente subida de archivos:
deberán validarse:
* tipo MIME;
* extensión;
* tamaño;
* duración;
* usuario propietario.
NO confíes únicamente en la extensión del archivo.
No implementes todavía todo el upload, pero deja documentados estos requisitos.
 
⸻
 
38. NO IMPLEMENTAR TODAVÍA
En esta fase NO quiero:
* biblioteca completa de sonidos;
* subida de sonidos;
* editor de audio;
* pantalla final de Ajustes;
* sonidos descargados desde internet;
* sonidos generados por IA;
* sistema completo de vibración;
* notificaciones sonoras externas.
Todo eso pertenece a fases posteriores.
 
⸻
 
39. CRITERIO DE FINALIZACIÓN
La Fase 1 estará terminada cuando exista un motor central capaz de:
evento
↓
resolver sonido
↓
consultar preferencias
↓
resolver volumen
↓
aplicar prioridad/cooldown
↓
reproducir
↓
fallback si falla
sin que los módulos de JC Fitness/Lifestyle tengan que conocer los detalles internos del audio.
 
⸻
 
40. INFORME FINAL
Al terminar, proporciona:
1. Arquitectura elegida.
2. Tecnología de audio utilizada y por qué.
3. Archivos creados/modificados.
4. Eventos soportados.
5. Sistema de prioridades.
6. Sistema de volumen.
7. Sistema de fallback.
8. Gestión de iOS/PWA.
9. Preparación para sonidos personalizados.
10. Pruebas realizadas.
11. Problemas encontrados.
12. Qué queda para la Fase 2.
Después:
DETENTE.
No empieces todavía la biblioteca de sonidos ni la pantalla de Ajustes.
Esta es exclusivamente:
FASE 1 — ARQUITECTURA + MOTOR GLOBAL DE AUDIO

PROMPT PARA CLAUDE — FASE 4
Sistema de Rachas: interfaz, experiencia visual, interacción y Centro de Rachas
Continúa exactamente desde las FASES 1, 2 y 3 del Sistema de Rachas.
Ya existe:
* motor de rachas;
* historial;
* persistencia en Supabase;
* seguridad;
* sincronización;
* hitos;
* récords;
* logros;
* eventos de gamificación.
Ahora quiero construir la experiencia visual y de interacción.
Esta fase debe hacer que el sistema de rachas sea una de las partes más atractivas de JC Fitness/Lifestyle.
La estética debe seguir la identidad actual de la aplicación:
premium + moderna + minimalista + deportiva + elegante + rápida + móvil-first.
No quiero una interfaz infantil ni llena de elementos innecesarios.
 
⸻
 
1. PRIMERO: INSPECCIONA LA APP ACTUAL
Antes de crear componentes:
* revisa el Dashboard actual;
* revisa navegación;
* revisa sistema de colores;
* revisa tipografías;
* revisa iconografía;
* revisa tarjetas;
* revisa animaciones existentes;
* revisa dark/light mode;
* revisa responsive design;
* revisa componentes reutilizables.
La nueva interfaz debe parecer parte de JC Fitness/Lifestyle desde el primer momento.
No crees un diseño visual independiente.
 
⸻
 
2. PRINCIPIO MOBILE-FIRST
La aplicación se utiliza principalmente desde móvil.
Por tanto:
* botones grandes suficientes para tocar;
* jerarquía visual clara;
* nada importante debe depender de hover;
* evitar scroll horizontal;
* animaciones ligeras;
* carga rápida;
* componentes adaptados a pantallas pequeñas;
* respetar safe areas de iPhone;
* evitar elementos que queden debajo de la barra inferior.
 
⸻
 
3. RACHA PRINCIPAL EN DASHBOARD
Integra una representación de la racha principal en la pantalla Hoy/Dashboard.
Debe ser visible pero no dominar toda la pantalla.
Conceptualmente:
🔥 17 DÍAS

Tu mejor racha: 42 días

████████████░░░░

13 días para el siguiente hito
El diseño real debe adaptarse al estilo actual.
 
⸻
 
4. TARJETA DE RACHA
Crea un componente reutilizable equivalente a:
StreakCard
Debe aceptar datos como:
* nombre;
* icono;
* racha actual;
* récord;
* siguiente hito;
* progreso;
* estado;
* tipo de racha.
No codifiques una tarjeta exclusivamente para entrenamiento.
Debe funcionar para:
Entrenamiento
Estudio
Sueño
Hábitos
Nutrición
etc.
 
⸻
 
5. ESTADOS VISUALES
La tarjeta debe poder representar claramente:
Activa
🔥 Racha funcionando.
Pendiente
El usuario todavía puede completar el día.
Completada hoy
Mostrar feedback positivo.
En riesgo
Todavía puede salvar la racha, pero el día está próximo a terminar.
Rota
La cadena terminó.
Nueva racha
Acaba de empezar.
No uses únicamente colores.
Combina:
* iconos;
* texto;
* animación;
* jerarquía;
* estados.
 
⸻
 
6. CENTRO DE RACHAS
Al tocar la tarjeta principal:
→ Centro de Rachas
Crea una sección/pantalla dedicada.
Debe incluir:
Resumen
🔥 17
Racha actual

🏆 42
Mejor racha
Progreso
Siguiente hito.
Todas las rachas
Por ejemplo:
🏋️ Entrenamiento     17 días
📚 Estudio             8 días
😴 Sueño               21 días
🥗 Nutrición            5 días
 
⸻
 
7. JERARQUÍA
No quiero que 10 tarjetas ocupen toda la pantalla.
Utiliza:
* secciones;
* cards compactas;
* listas;
* expansión;
* scroll vertical.
La racha principal debe tener más protagonismo.
Las secundarias deben ser fácilmente consultables.
 
⸻
 
8. DETALLE DE UNA RACHA
Al tocar una racha:
Detalle de Racha
Debe mostrar:
* nombre;
* icono;
* racha actual;
* mejor racha;
* fecha de inicio;
* última actividad;
* siguiente hito;
* días totales;
* historial.
 
⸻
 
9. CALENDARIO DE RACHA
Integra una representación visual del historial.
Ejemplo conceptual:
L M X J V S D
🔥 🔥 🔥 🔥 🔥 🔥 🔥
🔥 🔥 ❌ 🔥 🔥 🔥 🔥
Pero quiero algo más elegante que simples emojis si el sistema de iconografía actual permite algo mejor.
Estados:
* completado;
* perdido;
* pendiente;
* futuro.
El calendario debe permitir navegar entre meses.
 
⸻
 
10. NO HACER UN CALENDARIO GIGANTE
Debe ser compacto.
El usuario debe poder ver:
* patrón de constancia;
* días completados;
* días perdidos.
Y poder abrir una vista más detallada si quiere.
 
⸻
 
11. PROGRESO HACIA EL SIGUIENTE HITO
Debe ser visual.
Ejemplo:
🔥 17 / 30

████████████░░░░░░░

13 días restantes
El porcentaje debe calcularse dinámicamente.
 
⸻
 
12. RÉCORD PERSONAL
Destaca el récord sin competir visualmente con la racha actual.
Ejemplo:
🏆 Récord personal 42 días
Si el usuario está batiendo su récord:
🔥 NUEVO RÉCORD
Utiliza una animación pequeña y elegante.
 
⸻
 
13. LOGROS
Crea una sección:
Logros
Debe mostrar:
Desbloqueados
Con apariencia destacada.
Bloqueados
Más discretos.
Ejemplo:
🔥 Primera Llama
7 días
✓ Desbloqueado
🏆 Imparable
30 días
13 / 30
Los logros bloqueados pueden mostrar progreso cuando exista.
 
⸻
 
14. DETALLE DE LOGRO
Al tocar un logro:
Mostrar:
* nombre;
* icono;
* descripción;
* condición;
* fecha de desbloqueo si está desbloqueado;
* progreso si corresponde.
No hagas una ventana enorme.
Debe sentirse como una interacción premium.
 
⸻
 
15. CELEBRACIONES
Cuando el usuario alcanza un hito:
7 días
14 días
30 días
100 días
mostrar una celebración.
Pero evita pantallas invasivas.
Una opción puede ser:
──────────────

🔥 30 DÍAS

¡Racha completada!

🏆 Nuevo logro desbloqueado

──────────────
Con una animación breve.
 
⸻
 
16. NIVELES DE CELEBRACIÓN
Normal
Microanimación.
Hito pequeño
Animación + feedback.
Hito importante
Animación más elaborada.
Récord
Celebración especial.
No hagas la celebración máxima para cada acción.
 
⸻
 
17. ANIMACIONES
Utiliza animaciones:
* cortas;
* fluidas;
* suaves;
* respetuosas con rendimiento.
Evita:
* animaciones permanentes;
* loops innecesarios;
* demasiados efectos;
* consumo elevado de batería.
Si el sistema soporta:
prefers-reduced-motion
respétalo.
Los usuarios que reduzcan movimiento deben recibir una experiencia equivalente sin animaciones intensas.
 
⸻
 
18. FEEDBACK AL COMPLETAR
Cuando el usuario complete una acción que alimenta una racha:
Mostrar inmediatamente:
✓ Día completado
🔥 Racha: 18 días
Si ha conseguido un récord:
🏆 Nuevo récord
Si ha alcanzado un hito:
🔥 30 días
La información debe provenir del motor real de las fases anteriores.
 
⸻
 
19. NO DUPLICAR FEEDBACK
Si una misma acción provoca:
* racha;
* récord;
* logro;
* hito;
no muestres cuatro pop-ups diferentes.
Agrupa la celebración.
Ejemplo:
🔥 30 DÍAS Nuevo récord personal 🏆 Imparable desbloqueado
Una única experiencia.
 
⸻
 
20. SONIDO
IMPORTANTE:
Aunque estamos preparando el sistema para sonidos, NO implementes todavía el sistema global de audio.
La UI solo debe emitir eventos que posteriormente pueda escuchar el sistema de sonido.
Ejemplo:
STREAK_MILESTONE_REACHED
El sistema de audio futuro decidirá qué sonido reproducir.
No pongas archivos de audio directamente en los componentes.
 
⸻
 
21. HAPTICS
Igualmente, prepara eventos.
Por ejemplo:
STREAK_COMPLETED
ACHIEVEMENT_UNLOCKED
NEW_RECORD
El futuro sistema háptico podrá responder a ellos.
No implementes todavía un sistema global de vibración si corresponde a otra fase.
 
⸻
 
22. COLORES
Utiliza el sistema de tokens existente.
No hardcodees colores por toda la aplicación.
Si actualmente existe:
COLORS
ACCENTS
o equivalente:
reutilízalo.
La racha puede utilizar un acento cálido para representar energía, pero debe respetar la personalización cromática global de JC Fitness/Lifestyle.
 
⸻
 
23. DARK MODE
Debe funcionar perfectamente en:
* dark mode;
* light mode.
No diseñes una interfaz que solo funcione sobre fondo oscuro.
Comprueba:
* contraste;
* legibilidad;
* iconos;
* estados;
* cards;
* progreso;
* logros bloqueados.
 
⸻
 
24. ACCESIBILIDAD
Incluye:
* labels;
* botones accesibles;
* contraste;
* navegación razonable;
* estados que no dependan únicamente del color;
* aria-label cuando corresponda;
* soporte para reduced motion.
 
⸻
 
25. EMPTY STATES
Si el usuario todavía no tiene rachas:
No mostrar una pantalla vacía.
Mostrar algo como:
🔥 Empieza tu primera racha Completa una actividad y comienza a construir tu cadena.
Debe existir un CTA claro.
 
⸻
 
26. PRIMER DÍA
El primer día debe sentirse especial.
Cuando se completa por primera vez:
🔥 ¡Has empezado tu primera racha!
No debe parecer que la aplicación simplemente cambió:
0 → 1
Debe existir una pequeña sensación de comienzo.
 
⸻
 
27. RACHA ROTA
No quiero un mensaje agresivo.
Evita:
❌ HAS FALLADO
Prefiero algo como:
La racha terminó. Hoy puedes empezar una nueva.
El objetivo es motivar, no castigar.
 
⸻
 
28. RECUPERACIÓN
Cuando una racha se rompe:
Racha anterior: 17 días
Nueva racha: 0
Pero conserva:
Mejor racha: 42
Y muestra el historial.
El usuario nunca debe sentir que su progreso histórico desapareció.
 
⸻
 
29. RECORDATORIO VISUAL
Si el día está pendiente:
🔥 17 días Completa tu objetivo de hoy para mantener la racha.
No mostrar esto si ya está completado.
 
⸻
 
30. MÓVIL
Prueba específicamente:
* iPhone pequeño;
* iPhone grande;
* Android estándar.
Comprueba:
* tarjetas;
* botones;
* modales;
* calendario;
* navegación inferior;
* safe area;
* scroll.
 
⸻
 
31. RENDIMIENTO
Evita:
* renderizados innecesarios;
* grandes librerías para animaciones simples;
* imágenes innecesarias;
* efectos pesados;
* cálculos repetidos.
La pantalla debe cargar rápidamente.
 
⸻
 
32. COMPONENTES
Organiza componentes reutilizables.
Conceptualmente:
StreakCard
StreakSummary
StreakProgress
StreakCalendar
StreakList
AchievementCard
AchievementDetail
MilestoneCelebration
StreakDetail
Adapta los nombres a la arquitectura existente.
No dupliques componentes similares.
 
⸻
 
33. NAVEGACIÓN
Integra el Centro de Rachas con la navegación existente.
No crees una navegación paralela.
El usuario debe poder:
Hoy
 ↓
Racha
 ↓
Detalle
 ↓
volver
sin perder contexto.
 
⸻
 
34. MICROINTERACCIONES
Añade pequeños detalles:
* progreso que se actualiza suavemente;
* icono que reacciona al completar;
* número de días que cambia de forma fluida;
* pequeño feedback al desbloquear;
* transición entre estados.
Pero mantén la estética premium.
 
⸻
 
35. NO SOBRECARCAR
Regla fundamental:
si una animación o componente no mejora la comprensión o satisfacción del usuario, elimínalo.
Quiero calidad, no cantidad.
 
⸻
 
36. PRUEBAS VISUALES
Comprueba como mínimo:
Sin racha
Estado inicial.
1 día
Primera racha.
7 días
Primer hito.
29 → 30
Hito + logro.
Nuevo récord
Celebración correspondiente.
Racha rota
Estado correcto.
Múltiples rachas
La interfaz sigue siendo limpia.
Muchos logros
No se rompe el diseño.
Dark mode
Correcto.
Light mode
Correcto.
Reduced motion
Correcto.
Móvil
Correcto.
 
⸻
 
37. CRITERIO DE FINALIZACIÓN
La Fase 4 estará terminada cuando el usuario pueda:
abrir Hoy
↓
ver su racha
↓
entrar al Centro de Rachas
↓
consultar sus rachas
↓
abrir una concreta
↓
ver historial
↓
ver progreso
↓
ver récord
↓
ver logros
↓
recibir feedback al completar
Todo ello utilizando los datos reales de las fases anteriores.
 
⸻
 
38. NO AVANCES A SONIDO
El sistema de sonido será un proyecto independiente.
Aunque prepares eventos para él:
NO IMPLEMENTES AUDIO EN ESTA FASE.
 
⸻
 
39. INFORME FINAL
Al terminar, proporciona:
1. Componentes creados/modificados.
2. Pantallas creadas/modificadas.
3. Integración con Dashboard.
4. Sistema de estados.
5. Calendario.
6. Logros.
7. Celebraciones.
8. Animaciones.
9. Adaptación móvil.
10. Accesibilidad.
11. Pruebas realizadas.
12. Qué queda para la Fase 5.
Después:
DETENTE.
No avances automáticamente.
Esta es exclusivamente:
FASE 4 — UI/UX + CENTRO DE RACHAS + EXPERIENCIA VISUAL

PROMPT PARA CLAUDE — FASE 3
Sistema de Rachas: gamificación, hitos, récords y progresión
Continúa exactamente desde las FASES 1 y 2 del Sistema de Rachas.
Ya existe una arquitectura de rachas con lógica central, persistencia, Supabase, seguridad y sincronización.
Ahora vamos a construir la capa de gamificación.
El objetivo no es hacer una simple pantalla con medallas. Quiero crear un sistema que haga que el progreso del usuario sea visible, satisfactorio y motivador, pero sin convertir JC Fitness/Lifestyle en una aplicación infantil o excesivamente cargada.
La sensación debe ser:
premium + limpia + motivadora + adictiva de forma saludable + orientada al progreso.
 
⸻
 
1. REGLA PRINCIPAL
NO modifiques innecesariamente el motor de rachas de las fases anteriores.
La gamificación debe consumir los datos existentes.
Arquitectura conceptual:
Actividad
   ↓
Racha
   ↓
Progreso
   ↓
Hito
   ↓
Logro / recompensa
   ↓
Feedback visual
La gamificación debe ser una capa superior, no una sustitución del sistema de rachas.
 
⸻
 
2. SISTEMA DE HITOS
Crea un sistema configurable de hitos.
Por defecto, prepara como mínimo:
1 día
3 días
7 días
14 días
21 días
30 días
50 días
75 días
100 días
150 días
200 días
365 días
Pero NO codifiques estos números directamente por todas partes.
Crea una configuración central:
STREAK_MILESTONES
para poder modificarlos posteriormente.
 
⸻
 
3. MÚLTIPLES TIPOS DE RACHA
Los hitos deben funcionar con cualquier racha.
Ejemplo:
Entrenamiento → 30 días
Estudio → 30 días
Hábitos → 30 días
Sueño → 30 días
No crees una lógica separada para cada módulo.
Debe existir un sistema genérico.
 
⸻
 
4. LOGROS
Crea una arquitectura para logros.
Conceptualmente:
Achievement
AchievementDefinition
UserAchievement
Un logro puede depender de:
* alcanzar una racha;
* superar un récord;
* completar X días;
* conseguir X rachas;
* mantener una racha durante X tiempo;
* cumplir determinadas condiciones.
Ejemplo:
🔥 Primera Llama
7 días consecutivos
🔥 Imparable
30 días consecutivos
🏆 Leyenda
100 días consecutivos
 
⸻
 
5. LOGROS DESBLOQUEADOS
Cuando el usuario cumple una condición:
condición
↓
achievement unlocked
El logro debe persistirse.
NO quiero que cada render vuelva a crear el logro.
Debe existir una identificación única.
Conceptualmente:
user_id + achievement_id
debe ser único.
 
⸻
 
6. NO REPETIR RECOMPENSAS
Si el usuario alcanza 30 días:
🏆 logro desbloqueado
y después actualiza la aplicación, no debe volver a desbloquearlo.
Debe existir un estado persistente:
locked
unlocked
y opcionalmente:
unlocked_at
 
⸻
 
7. HITO ≠ LOGRO
Mantén separados ambos conceptos.
Hito
Representa un punto de progreso.
Ejemplo:
30 días
Logro
Es una recompensa/conquista asociada a una condición.
Ejemplo:
"Imparable"
Esto permitirá posteriormente crear logros que no dependan exclusivamente de rachas.
 
⸻
 
8. PROGRESIÓN
Quiero que el usuario pueda ver cuánto falta para el siguiente hito.
Ejemplo:
🔥 17 días

Siguiente hito:
30 días

████████████░░░░░░

13 días restantes
La lógica debe calcularlo dinámicamente.
No guardar simplemente:
daysRemaining = 13
porque cambiaría con el tiempo.
Debe derivarse del estado actual.
 
⸻
 
9. RÉCORD PERSONAL
Debe existir una representación clara del récord.
Ejemplo:
🔥 Racha actual
17 días

🏆 Mejor racha
42 días
El récord debe provenir de la arquitectura de la Fase 2.
No inventes un segundo contador independiente.
 
⸻
 
10. RÉCORD SUPERADO
Cuando:
currentStreak > longestStreak anterior
debe detectarse:
NEW_PERSONAL_RECORD
Esto será importante para la futura capa de animaciones y sonidos.
No implementes todavía sonidos.
Pero crea un evento o estado claro que pueda consumir la interfaz.
 
⸻
 
11. EVENTOS DE GAMIFICACIÓN
Prepara eventos como:
STREAK_STARTED
STREAK_CONTINUED
STREAK_MILESTONE_REACHED
STREAK_PERSONAL_RECORD
STREAK_BROKEN
ACHIEVEMENT_UNLOCKED
No quiero que cada componente tenga que descubrir por su cuenta qué ha ocurrido.
Debe existir una capa central.
 
⸻
 
12. TRANSICIONES
Ten cuidado con los estados.
Ejemplo:
9 días
↓
10 días
No debe generar:
hito 10
hito 10
hito 10
Debe generarse una sola vez.
Igualmente:
29 → 30
debe detectar exactamente el paso de hito.
 
⸻
 
13. RECOMPENSAS
Deja preparado el sistema para futuras recompensas.
Una recompensa podría ser:
badge
theme
icon
animation
title
No es necesario implementar un sistema enorme de recompensas todavía.
Pero la arquitectura debe poder soportarlo.
 
⸻
 
14. NIVELES
No conviertas automáticamente las rachas en niveles si no es necesario.
Si implementas una progresión global, debe estar separada de la racha.
Por ejemplo:
Racha → 17 días
Nivel global → 8
No:
17 días = nivel 17
porque son conceptos diferentes.
 
⸻
 
15. PUNTOS / XP
Si decides preparar XP, hazlo como sistema independiente.
Por ejemplo:
complete action
↓
XP event
La racha puede generar XP, pero no debe depender de él.
No implementes todavía una economía compleja de XP.
Solo deja la arquitectura extensible si resulta útil.
 
⸻
 
16. RACHAS ESPECIALES
La arquitectura debe permitir posteriormente condiciones especiales como:
“Primera racha”
Primera vez que alcanza 7 días.
“Récord”
Superar el récord personal.
“Constancia”
Completar 30 días en un período determinado.
“Maestro”
Alcanzar 100 días.
No es necesario implementar cientos de logros.
Prefiero una base sólida y extensible.
 
⸻
 
17. LOGROS OCULTOS
Deja preparada la posibilidad de logros ocultos.
Ejemplo:
??? 
Se revela cuando se desbloquea.
No hace falta implementar todavía una biblioteca enorme.
 
⸻
 
18. ESTADOS
Cada logro debe poder tener estados como:
locked
unlocked
Y opcionalmente:
hidden
visible
Esto permite crear logros especiales posteriormente.
 
⸻
 
19. PROGRESO HACIA LOGROS
Cuando tenga sentido, el usuario debería poder saber:
🔥 17 / 30 días
o:
📚 8 / 10 sesiones
No todos los logros tienen que mostrar progreso.
Pero la arquitectura debe permitirlo.
 
⸻
 
20. ESTADÍSTICAS
Prepara datos para futuras estadísticas:
* días totales completados;
* mejor racha;
* racha actual;
* número de rachas completadas;
* hitos alcanzados;
* logros desbloqueados;
* porcentaje de cumplimiento;
* días consecutivos históricos.
No construyas todavía un dashboard estadístico enorme.
Solo proporciona datos fiables.
 
⸻
 
21. CALENDARIO FUTURO
La gamificación debe ser compatible con una futura vista calendario.
Por ejemplo:
L M X J V S D
🔥 🔥 🔥 🔥 🔥 🔥 🔥
El sistema debe poder proporcionar el estado de cada día.
No construyas todavía el calendario visual completo.
 
⸻
 
22. RACHAS GLOBALES
Prepara la posibilidad de una:
Racha Global
Pero NO permitas que sustituya las rachas específicas.
Ejemplo:
🔥 Global       17 días
🏋️ Entrenamiento 12 días
📚 Estudio       8 días
😴 Sueño         21 días
La racha global debe tener una regla definida y no ser simplemente:
max(streaks)
Debe existir una condición real.
 
⸻
 
23. FILOSOFÍA DE GAMIFICACIÓN
No quiero que el usuario sienta:
“Tengo que usar la app para ganar puntos.”
Quiero que sienta:
“Estoy progresando en mi vida y la app me ayuda a verlo.”
Por eso:
* evita exceso de pop-ups;
* evita recompensas constantes;
* reserva las celebraciones grandes para hitos importantes;
* utiliza microfeedback para acciones normales;
* utiliza celebraciones especiales para logros reales.
 
⸻
 
24. CELEBRACIONES
Prepara diferentes niveles de celebración.
Micro
Para acciones normales.
Ejemplo:
✓ Completado
Media
Para hitos pequeños.
Ejemplo:
🔥 7 días
Grande
Para:
30
100
365
La interfaz y los sonidos se implementarán posteriormente.
Ahora solo define los estados/eventos necesarios.
 
⸻
 
25. PREPARACIÓN PARA SONIDOS
NO implementes sonidos en esta fase.
Pero los eventos deben poder ser consumidos posteriormente por el sistema global de audio.
Por ejemplo:
STREAK_MILESTONE_REACHED
podrá posteriormente producir:
visual feedback
+
sound
+
haptic
sin modificar el motor de rachas.
 
⸻
 
26. PREPARACIÓN PARA NOTIFICACIONES
Igualmente:
STREAK_AT_RISK
STREAK_MILESTONE_REACHED
ACHIEVEMENT_UNLOCKED
deben poder ser consumidos por el futuro sistema de notificaciones.
 
⸻
 
27. ANTI-EXPLOIT
No permitas que el usuario desbloquee logros simplemente modificando valores desde el frontend.
Ejemplo:
currentStreak = 1000
no debe desbloquear automáticamente un logro sin que exista evidencia real de los días correspondientes.
Los logros deben derivarse de datos válidos.
 
⸻
 
28. RECÁLCULO
Si se modifica el historial:
racha
↓
recalcular
↓
¿sigue cumpliendo el logro?
Define qué comportamiento tendrá el sistema.
Importante:
Los logros ya desbloqueados deberían tratarse con cuidado.
No borres automáticamente el histórico de que un logro fue conseguido solo porque posteriormente cambió una actividad.
Si existe una necesidad de revocación, debe ser una decisión explícita del sistema.
 
⸻
 
29. MODELO DE DATOS
Si la arquitectura de Supabase necesita nuevas entidades, crea las migraciones necesarias.
Conceptualmente:
achievement_definitions
user_achievements
streak_milestones
No uses exactamente estos nombres si contradicen las convenciones existentes.
Implementa:
* claves;
* relaciones;
* índices;
* unique constraints;
* RLS;
* timestamps;
* tipos correctos.
 
⸻
 
30. RENDIMIENTO
No calcules todos los logros de todos los usuarios.
Cada operación debe estar limitada al usuario autenticado.
Evita consultas innecesarias.
Si determinadas definiciones son globales y estáticas, pueden cachearse.
 
⸻
 
31. TIPADO
Mantén tipos fuertes.
Conceptualmente:
Achievement
AchievementDefinition
UserAchievement
Milestone
GamificationEvent
Evita any.
 
⸻
 
32. SERVICIO CENTRAL
Crea una capa equivalente a:
GamificationService
con operaciones como:
evaluateMilestones()
evaluateAchievements()
getUnlockedAchievements()
getNextMilestone()
getGamificationStats()
No pongas esta lógica en los componentes visuales.
 
⸻
 
33. HOOK
Si corresponde con la arquitectura React:
useGamification()
o equivalente.
Debe exponer los datos necesarios para la futura UI.
 
⸻
 
34. PRUEBAS OBLIGATORIAS
Prueba como mínimo:
1 día
Debe detectar el primer hito.
7 días
Debe desbloquear el logro correspondiente si existe.
30 días
Debe detectar el hito y el logro.
100 días
Debe detectar correctamente el milestone.
Récord
Debe generar STREAK_PERSONAL_RECORD.
Duplicación
No debe desbloquear dos veces el mismo logro.
Recarga
El logro debe seguir desbloqueado.
Dispositivo diferente
Debe recuperarse correctamente.
Cambio de racha
Si existen varias rachas, cada una debe mantener sus propios hitos.
Usuario diferente
No debe acceder a logros ajenos.
 
⸻
 
35. NO IMPLEMENTAR TODAVÍA
No quiero en esta fase:
* diseño visual final;
* Centro de Rachas completo;
* calendario completo;
* confeti;
* sonidos;
* vibraciones;
* animaciones avanzadas;
* sistema de notificaciones;
* tienda de recompensas;
* ranking;
* redes sociales;
* competición.
Todo eso podrá utilizar esta arquitectura posteriormente.
 
⸻
 
36. CRITERIO DE FINALIZACIÓN
Esta fase estará terminada cuando el sistema sea capaz de:
racha
↓
progreso
↓
hito
↓
detección
↓
evento
↓
logro
↓
persistencia
de forma segura, consistente e independiente de la interfaz.
La siguiente fase será la construcción de la experiencia visual del sistema de Rachas, por lo que deja disponibles todos los datos necesarios para que la UI pueda representar:
* racha actual;
* récord;
* progreso;
* siguiente hito;
* logros;
* estadísticas;
* historial;
* estado diario.
 
⸻
 
37. INFORME FINAL
Al terminar:
1. Resume qué has implementado.
2. Indica las tablas/migraciones nuevas.
3. Indica los servicios/hooks.
4. Indica los eventos creados.
5. Indica los logros/hitos configurados.
6. Indica las pruebas realizadas.
7. Explica brevemente cualquier decisión arquitectónica importante.
8. Indica qué queda para la Fase 4.
Después DETENTE.
No avances automáticamente.
Esta es exclusivamente:
FASE 3 — GAMIFICACIÓN + HITOS + LOGROS + PROGRESIÓN

PROMPT PARA CLAUDE — FASE 2
Sistema de Rachas: persistencia, Supabase, seguridad y sincronización
Continúa exactamente desde la FASE 1 — Arquitectura y lógica del sistema de Rachas.
NO rehagas el motor de rachas si ya funciona correctamente.
En esta fase quiero convertir esa arquitectura en un sistema de datos persistente, seguro y preparado para producción, utilizando la arquitectura backend de JC Fitness/Lifestyle.
La prioridad de esta fase es:
integridad de datos → seguridad → sincronización → consistencia → rendimiento.
No desarrolles todavía la gamificación avanzada ni el diseño visual final.
 
⸻
 
1. PRIMERO: INSPECCIONA EL PROYECTO
Antes de modificar nada:
* revisa la implementación realizada en la Fase 1;
* localiza el sistema actual de autenticación;
* localiza la configuración existente de Supabase;
* identifica las tablas actuales;
* identifica los servicios/repositorios existentes;
* identifica el sistema de estado global;
* identifica hooks relacionados;
* identifica cualquier sistema existente de persistencia/local cache;
* identifica los módulos que posteriormente generarán eventos de racha.
No dupliques sistemas existentes.
Si ya existe una abstracción para acceso a Supabase, reutilízala.
Si existe una estructura equivalente a repositorios/servicios, integra el sistema de rachas dentro de ella.
 
⸻
 
2. OBJETIVO
Crear la capa persistente del sistema:
Usuario
   ↓
Racha
   ↓
Reglas
   ↓
Días/eventos de cumplimiento
Debe ser posible recuperar exactamente el estado de una racha después de:
* cerrar sesión;
* cerrar la PWA;
* cambiar de dispositivo;
* reinstalar la aplicación;
* perder temporalmente la conexión;
* iniciar sesión desde otro dispositivo.
 
⸻
 
3. MODELO DE DATOS
Diseña el modelo de Supabase siguiendo la arquitectura creada en la Fase 1.
Como referencia conceptual, deberían existir entidades equivalentes a:
streaks
streak_days / streak_events
streak_rules
No copies estos nombres obligatoriamente si el proyecto ya utiliza otra convención.
Lo importante es que exista una separación clara entre:
Racha
Información estable:
* id;
* user_id;
* tipo;
* nombre;
* estado;
* fecha de creación;
* configuración;
* reglas;
* timestamps.
Cumplimientos diarios/eventos
Información histórica:
* id;
* streak_id;
* user_id;
* fecha local;
* estado;
* momento de cumplimiento;
* origen del evento;
* metadata si fuese necesaria.
 
⸻
 
4. USER_ID
Toda información debe estar asociada al usuario autenticado.
NO permitas que el cliente pueda elegir libremente:
user_id
para consultar o modificar datos de otro usuario.
Utiliza la identidad proporcionada por Supabase Auth.
 
⸻
 
5. ROW LEVEL SECURITY
Implementa o prepara correctamente RLS.
Objetivo:
usuario A → solo puede acceder a sus rachas
usuario B → solo puede acceder a sus rachas
Las operaciones deben cubrir:
* SELECT;
* INSERT;
* UPDATE;
* DELETE.
No quiero políticas excesivamente permisivas del estilo:
auth.uid() IS NOT NULL
si permiten acceder a registros de otros usuarios.
La regla debe vincular el registro con:
auth.uid() = user_id
y, cuando sea necesario, verificar también la relación indirecta:
streak → user_id
streak_day → streak → user_id
 
⸻
 
6. INTEGRIDAD DE DATOS
Implementa restricciones que impidan inconsistencias.
Especialmente:
un usuario no puede tener dos registros de cumplimiento para la misma racha y el mismo día lógico.
Debe existir una restricción equivalente a:
UNIQUE(streak_id, local_date)
siempre que encaje con el modelo final.
Esto evita duplicados aunque:
* el usuario pulse varias veces;
* dos dispositivos envíen el mismo evento;
* se repita una petición;
* haya reintentos de red.
 
⸻
 
7. FECHAS
Diferencia claramente entre:
Fecha lógica del día
El día local al que pertenece el cumplimiento.
Ejemplo:
2026-08-18
Timestamp real
Momento exacto en el que se registró.
Ejemplo:
2026-08-18 21:43:12 UTC
No uses únicamente timestamps para determinar el día de la racha.
La fecha lógica debe poder reconstruirse correctamente según la zona horaria del usuario.
 
⸻
 
8. ZONA HORARIA
Integra la lógica definida en la Fase 1.
El sistema debe conocer la zona horaria relevante para calcular:
hoy
ayer
mañana
No dependas de la zona horaria del servidor.
Evita errores como:
usuario completa a las 00:30
servidor interpreta el evento como el día anterior
La fecha lógica debe quedar determinada correctamente antes de persistir el evento.
 
⸻
 
9. CREACIÓN DE RACHAS
Crea un servicio central equivalente a:
createStreak()
Debe:
* validar usuario;
* validar tipo;
* validar regla;
* evitar configuraciones inválidas;
* crear la entidad;
* devolver el objeto creado.
No permitas crear rachas huérfanas.
 
⸻
 
10. REGISTRAR CUMPLIMIENTO
Crea una operación equivalente a:
completeStreakDay()
Debe ser:
Idempotente.
Si se ejecuta dos veces para el mismo día:
resultado = un único cumplimiento
No:
resultado = dos cumplimientos
Utiliza la restricción de base de datos y/o un upsert correctamente diseñado.
 
⸻
 
11. NO CONFÍES EN EL CLIENTE
El frontend puede solicitar:
“Quiero completar esta racha.”
Pero no debe poder alterar arbitrariamente:
longest_streak
current_streak
enviando:
{
  "currentStreak": 9999
}
Los valores derivados deben calcularse a partir de los eventos reales o mediante lógica backend segura.
 
⸻
 
12. CONTADORES DERIVADOS
Si decides almacenar:
current_streak
longest_streak
debe quedar claro que son valores derivados/cache.
La fuente de verdad debe continuar siendo el historial.
Si existe una discrepancia:
contador ≠ historial
debe existir una forma de recalcular correctamente el contador.
Crea una función equivalente a:
recalculateStreak()
 
⸻
 
13. SERVICIO DE RECÁLCULO
Implementa una función central que pueda reconstruir:
currentStreak
longestStreak
currentStartDate
lastCompletedDate
a partir del historial.
Esto será fundamental para:
* restauraciones;
* correcciones;
* migraciones;
* sincronización;
* detectar corrupción de datos.
 
⸻
 
14. SINCRONIZACIÓN
Crea una capa clara:
UI
 ↓
Streak Service
 ↓
Local state/cache
 ↓
Supabase
Evita que cada componente llame directamente a Supabase.
Por ejemplo:
Dashboard
CentroRachas
Entrenamiento
Hábitos
no deberían implementar cada uno su propio:
supabase.from(...)
para las rachas.
Todos deben utilizar el servicio central.
 
⸻
 
15. CACHE LOCAL
La PWA debe poder mostrar rápidamente el estado conocido de las rachas.
Puedes utilizar el mecanismo de almacenamiento ya existente en el proyecto.
Pero:
el cache local no debe convertirse en la fuente definitiva de verdad.
Debe existir una estrategia clara para:
leer cache
↓
mostrar UI
↓
sincronizar
↓
actualizar cache
 
⸻
 
16. OFFLINE
Prepara la arquitectura para poder registrar acciones durante una desconexión.
Ejemplo:
usuario completa entrenamiento
↓
sin conexión
↓
evento guardado localmente
↓
cola pendiente
↓
vuelve internet
↓
sincronización
↓
Supabase
Si el proyecto ya dispone de una cola offline, intégrala.
Si no existe, crea una abstracción preparada para ella, pero no construyas un sistema offline gigantesco si corresponde a otra parte de la arquitectura global.
 
⸻
 
17. CONFLICTOS
Contempla:
iPhone → completa día
ordenador → completa el mismo día
Resultado:
1 día completado
No:
2 días
La base de datos debe resolver el conflicto mediante las restricciones apropiadas.
 
⸻
 
18. ELIMINACIÓN O MODIFICACIÓN DE EVENTOS
Esto es importante.
Imagina:
Entrenamiento
↓
genera cumplimiento
↓
racha = 15
Después se elimina ese entrenamiento.
La racha no debería permanecer artificialmente en 15 si ese evento era la única razón por la que ese día estaba cumplido.
Diseña el sistema para que posteriormente podamos recalcular las rachas cuando se modifiquen o eliminen eventos de origen.
No acoples todavía el entrenamiento completo a esta lógica si pertenece a otra fase, pero deja definido el mecanismo.
 
⸻
 
19. EVENT SOURCE
Cada cumplimiento debería poder identificar su origen.
Ejemplo:
source_type = "training"
source_id = "..."
o:
source_type = "habit"
source_id = "..."
Esto permitirá posteriormente saber:
¿Por qué se completó esta racha?
Y permitirá invalidarlo correctamente si el evento original desaparece.
 
⸻
 
20. AUDITORÍA BÁSICA
Cuando sea razonable, conserva:
* created_at;
* completed_at;
* updated_at;
* source;
* usuario.
No guardes información innecesaria.
El objetivo es poder investigar:
¿Por qué esta racha tiene este estado?
 
⸻
 
21. MIGRACIONES
Cualquier modificación de base de datos debe realizarse mediante migraciones reproducibles.
NO hagas cambios manuales irreproducibles.
Si el proyecto ya tiene una estructura de migraciones:
* respétala;
* añade la nueva migración;
* documenta qué crea/modifica.
 
⸻
 
22. TIPOS TYPESCRIPT
Los tipos del frontend deben corresponder con el modelo real.
Evita:
any
para las entidades principales.
Define tipos equivalentes a:
Streak
StreakDay
StreakRule
StreakStatus
y utiliza esos tipos en:
* servicios;
* hooks;
* componentes;
* respuestas de Supabase.
 
⸻
 
23. HOOK CENTRAL
Si la arquitectura del proyecto utiliza React hooks, crea un hook central equivalente a:
useStreak()
o:
useStreaks()
Debe permitir posteriormente:
obtener racha
obtener todas
registrar cumplimiento
actualizar
recalcular
No pongas toda la lógica directamente dentro del componente visual.
 
⸻
 
24. RENDIMIENTO
No recalcules todas las rachas constantemente.
Evita:
cada render
↓
consulta Supabase
↓
recalcular todo
Utiliza:
* cache;
* memoización cuando proceda;
* consultas específicas;
* actualización optimista cuando sea segura;
* invalidación controlada.
La aplicación debe sentirse instantánea en móvil.
 
⸻
 
25. PREPARACIÓN PARA NOTIFICACIONES
No implementes todavía el sistema completo de notificaciones.
Pero deja eventos claros que posteriormente puedan generar:
streak_at_risk
streak_completed
streak_broken
streak_milestone
Por ejemplo:
Racha en riesgo
↓
sistema de notificaciones
Esto permitirá integrar esa funcionalidad posteriormente sin rehacer el motor.
 
⸻
 
26. PREPARACIÓN PARA GAMIFICACIÓN
Tampoco implementes todavía:
* XP;
* niveles;
* medallas;
* logros.
Pero el motor debe poder emitir información como:
streak.current = 30
para que una futura capa de gamificación pueda decir:
Has alcanzado un hito de 30 días.
 
⸻
 
27. PRUEBAS
Crea pruebas para los casos fundamentales.
Como mínimo:
Caso 1
Un día completado.
Resultado:
current = 1
longest = 1
Caso 2
Tres días consecutivos.
Resultado:
current = 3
longest = 3
Caso 3
Tres días + día perdido.
Resultado:
current = 0
longest = 3
Caso 4
Tres días + perdido + dos días.
Resultado:
current = 2
longest = 3
Caso 5
Duplicar cumplimiento.
Resultado:
un único día
Caso 6
Dos dispositivos completando el mismo día.
Resultado:
un único día
Caso 7
El día actual aún está pendiente.
Resultado:
pending
y no debe romper prematuramente la racha.
Caso 8
Cambio de zona horaria.
Verificar que la fecha lógica sea correcta.
Caso 9
Usuario sin historial.
Resultado:
current = 0
longest = 0
Caso 10
Corrupción o discrepancia de contadores.
Resultado:
recalculate()
debe reconstruir correctamente el estado.
 
⸻
 
28. NO IMPLEMENTAR TODAVÍA
En esta fase NO quiero:
* diseño final del Centro de Rachas;
* animaciones;
* confeti;
* sonidos;
* logros;
* niveles;
* recompensas;
* rankings;
* gamificación;
* notificaciones completas.
Eso pertenece a fases posteriores.
 
⸻
 
29. CRITERIO DE FINALIZACIÓN
La Fase 2 estará terminada únicamente cuando exista una capa persistente capaz de:
crear racha
↓
registrar cumplimiento
↓
persistirlo
↓
sincronizarlo
↓
recuperarlo
↓
calcular racha
↓
calcular récord
↓
evitar duplicados
↓
mantener aislamiento entre usuarios
Y todo ello debe quedar preparado para que las siguientes fases puedan construir encima.
 
⸻
 
30. INFORME FINAL
Cuando termines, detente y dame un resumen breve con:
1. Arquitectura utilizada.
2. Tablas/migraciones creadas o modificadas.
3. Políticas RLS implementadas.
4. Servicios/hooks creados.
5. Sistema de sincronización.
6. Pruebas realizadas.
7. Problemas encontrados.
8. Qué queda pendiente para la Fase 3.
No avances automáticamente a la Fase 3.
Esta es exclusivamente:
FASE 2 — BASE DE DATOS + SUPABASE + SEGURIDAD + SINCRONIZACIÓN
