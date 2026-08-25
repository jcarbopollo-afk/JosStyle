> **Nota de procedencia:** transcripción íntegra y sin resumir del bloque «ARMARIO JC LIFESTYLE — 4 fases» del documento
> `JC_FITNESS___ESTILO_DE_HOMBRE.txt` que Josué pegó en el chat (líneas 39772–43518 del original completo,
> conservado sin tocar en `ORIGINAL_JC_FITNESS_ESTILO_DE_HOMBRE.txt`).
>
> **No editar ni resumir este contenido.** Si Josué amplía o corrige el texto, añadir lo nuevo o
> sustituir el apartado afectado, nunca recortar apartados existentes. El análisis y las conclusiones
> van en `docs/`, nunca aquí.
>
> ⚠️ **El documento original está en orden inverso** dentro de cada módulo (la última fase aparece
> primero) y contiene fragmentos de conversación intercalados. Eso es intencionado y se conserva.

---

INTRODUCCIÓN GENERAL — ARMARIO JC LIFESTYLE
# JC LIFESTYLE — SISTEMA DE ARMARIO INTELIGENTE

Vamos a desarrollar dentro de JC Lifestyle un sistema completo de gestión inteligente del armario.

El objetivo no es crear simplemente un inventario de ropa, sino convertir el armario en un sistema capaz de conocer las prendas del usuario, crear y gestionar Outfits, registrar cuándo se utilizan y, finalmente, ayudar al usuario a aprovechar toda su ropa evitando repeticiones innecesarias.

El desarrollo se realizará en 4 fases independientes y consecutivas:

## FASE 1 — ARMARIO DIGITAL + GESTIÓN DE PRENDAS
Crear el armario digital completo:
- Añadir, editar y eliminar prendas.
- Categorías.
- Fotografías opcionales.
- Nombre, color, marca, temporada, estado y demás información.
- Búsqueda y filtros.
- Organización visual del armario.
- Persistencia y seguridad.
- Base preparada para relacionar posteriormente las prendas con Outfits.

## FASE 2 — CONSTRUCTOR Y GESTIÓN DE OUTFITS
Construir el sistema para crear Outfits utilizando las prendas existentes:
- Crear Outfits.
- Añadir múltiples prendas.
- Editar y duplicar.
- Favoritos.
- Búsqueda y filtros.
- Fotografías/representación visual.
- Relación correcta entre Outfits y prendas.
- Evitar duplicar prendas.
- Preparar la arquitectura para registrar posteriormente cuándo se utiliza cada Outfit.

## FASE 3 — CALENDARIO + HISTORIAL DE USO
Convertir el armario en un sistema de seguimiento:
- Calendario.
- Registrar cuándo se utiliza un Outfit.
- Registrar fecha, hora, lugar, personas, ocasión y notas.
- Historial completo de utilización.
- Consultar cuándo se utilizó por última vez cada Outfit.
- Consultar cuándo se utilizó por última vez cada prenda.
- Varios Outfits en un mismo día.
- Edición y eliminación de registros.
- Persistencia y seguridad.
- Base de datos preparada para analizar posteriormente los hábitos de utilización.

## FASE 4 — INTELIGENCIA DEL ARMARIO + ANTI-REPETICIÓN
Utilizar todos los datos anteriores para crear el sistema inteligente:
- Detectar repetición de Outfits.
- Detectar repetición de prendas.
- Detectar combinaciones repetidas.
- Detectar prendas y Outfits olvidados.
- Estadísticas de utilización.
- Cobertura del armario.
- Diversidad.
- Modo "No repetir".
- Recomendaciones de qué ponerse.
- Recomendaciones según ocasión, temporada y disponibilidad.
- Sistema de puntuación explicable.
- Insights personalizados.
- Integración completa con calendario, historial, prendas y Outfits.

## REGLAS GENERALES

Las 4 fases forman un único sistema y deben construirse sobre la misma arquitectura.

No crear sistemas independientes ni duplicar información.

Las prendas deben existir como entidades independientes y los Outfits deben relacionarse con ellas.

El historial debe conservar los usos reales y servir posteriormente como fuente de datos para las estadísticas y recomendaciones.

La seguridad y el aislamiento entre usuarios deben mantenerse durante todas las fases.

La interfaz debe mantener el diseño premium, rápido, limpio y coherente de JC Lifestyle, especialmente optimizado para móvil.

IMPORTANTE:

Las fases deben desarrollarse EN ORDEN.

No implementar funcionalidades de una fase posterior antes de que corresponda.

Yo te proporcionaré cada fase mediante una instrucción independiente.

Cuando te entregue una fase, desarrolla esa fase completamente, comprueba su funcionamiento, corrige los errores que encuentres y deja preparada la arquitectura para la siguiente.

NO avances automáticamente a la siguiente fase.

Al terminar cada fase, informa del porcentaje REAL de finalización y espera mi instrucción para continuar.

A continuación te voy a proporcionar:

# FASE 1 — ARMARIO DIGITAL + GESTIÓN DE PRENDAS

Desarrolla exclusivamente esa fase.
Orden que le pasarás a Claude:
Introducción general → Prompt Fase 1 → Prompt Fase 2 → Prompt Fase 3 → Prompt Fase 4.
Así Claude tiene desde el principio el mapa completo, pero no se pone a desarrollar las cuatro cosas de golpe.

Sí. Ahora sí: pasamos directamente a la FASE 4/4, que es la última del sistema de Armario. Aquí construimos la parte diferencial: anti-repetición, estadísticas y recomendaciones inteligentes.
No voy a hacer más continuaciones artificiales de la Fase 3. Esta será la prompt maestra de cierre del Armario.
PROMPT 4 — JC LIFESTYLE
FASE 4/4 — SISTEMA INTELIGENTE ANTI-REPETICIÓN + ESTADÍSTICAS + RECOMENDACIONES
Continúa desde el estado actual de JC Lifestyle.
Ya se han desarrollado:
FASE 1 — Armario Digital
FASE 2 — Constructor de Outfits
FASE 3 — Calendario + Historial de Uso
Ahora comienza la:
FASE 4/4 — SISTEMA INTELIGENTE DEL ARMARIO
Esta es la última fase del sistema de Armario.
El objetivo es transformar todos los datos recopilados en información útil para ayudar al usuario a:
* no repetir demasiado los mismos Outfits;
* no repetir constantemente las mismas prendas;
* descubrir ropa que lleva mucho tiempo sin utilizar;
* aprovechar mejor todo su armario;
* elegir rápidamente qué ponerse;
* conocer sus hábitos de vestimenta.
NO destruir ni sustituir las funcionalidades anteriores.
Todo debe integrarse con:
Prendas + Outfits + Calendario + Historial.
 
⸻
 
1. OBJETIVO PRINCIPAL
El sistema debe responder automáticamente a preguntas como:
¿Cuánto hace que no me pongo este Outfit?
¿Qué prendas llevo mucho tiempo sin utilizar?
¿Qué Outfit he repetido recientemente?
¿Qué pantalones estoy utilizando demasiado?
¿Qué ropa tengo prácticamente olvidada?
¿Qué puedo ponerme hoy para no repetir?
¿Qué combinaciones llevo demasiado poco?
La finalidad no es juzgar al usuario.
La finalidad es ayudarle a utilizar mejor todo su armario.
 
⸻
 
2. PANEL INTELIGENTE
Dentro de:
Gestión → Armario
crear una zona:
Inteligencia del Armario
o un nombre visual equivalente que encaje con JC Lifestyle.
Debe mostrar información útil y resumida.
Ejemplo:
👕 Tu armario hoy
87 prendas
24 Outfits
Último uso medio: 9 días
12 prendas poco utilizadas
3 Outfits repetidos recientemente
Estos datos deben ser reales.
NO utilizar datos simulados.
 
⸻
 
3. “¿QUÉ ME PONGO HOY?”
Crear una función:
¿Qué me pongo hoy?
El sistema analiza:
* historial;
* fecha;
* Outfits utilizados recientemente;
* prendas utilizadas recientemente;
* disponibilidad;
* ocasión;
* temporada;
* favoritos.
Y propone varios Outfits.
Ejemplo:
Recomendación 1
Casual Gris
No lo utilizas desde hace 18 días.
Recomendación 2
Black Night
Solo lo has utilizado 2 veces.
Recomendación 3
Universidad Azul
Evita prendas utilizadas durante los últimos días.
 
⸻
 
4. NO HACER RECOMENDACIONES ALEATORIAS
Las recomendaciones deben basarse en datos reales.
Priorizar Outfits:
* que llevan tiempo sin utilizarse;
* que no contienen prendas utilizadas recientemente;
* que están disponibles;
* adecuados para la ocasión seleccionada;
* adecuados para la temporada;
* que el usuario ha marcado como favoritos cuando tenga sentido.
No seleccionar simplemente un Outfit al azar.
 
⸻
 
5. SISTEMA ANTI-REPETICIÓN
Crear una lógica para detectar repetición.
Debe diferenciar:
REPETICIÓN DEL OUTFIT
Ejemplo:
Has utilizado este Outfit hace 2 días.
REPETICIÓN DE PRENDA
Ejemplo:
Has utilizado este vaquero 4 veces en los últimos 7 días.
REPETICIÓN DE COMBINACIÓN
Ejemplo:
Has combinado esta camiseta + pantalón 3 veces recientemente.
Son tres niveles diferentes.
 
⸻
 
6. DISTANCIA TEMPORAL
Calcular:
días desde último uso
Para:
* Outfit;
* prenda.
Ejemplo:
Outfit A
Último uso → hace 2 días

Outfit B
Último uso → hace 14 días

Outfit C
Último uso → hace 43 días
El sistema debe poder identificar fácilmente cuál está más olvidado.
 
⸻
 
7. OUTFITS “OLVIDADOS”
Crear una categoría:
Hace tiempo que no los usas
Mostrar Outfits con mayor tiempo desde su último uso.
Ejemplo:
Más olvidados
1. Outfit Verano → 61 días
2. Casual Azul → 47 días
3. Cena Negra → 39 días
Si nunca se han utilizado:
mostrar:
Nunca utilizado
y darle prioridad adecuada.
 
⸻
 
8. PRENDAS “OLVIDADAS”
Crear una sección:
Prendas que estás desaprovechando
Analizar prendas que:
* llevan mucho tiempo sin aparecer en un Outfit utilizado;
* tienen pocos usos;
* nunca se han utilizado.
Ejemplo:
Camisa azul — 52 días sin utilizar
Sudadera beige — 41 días sin utilizar
Pantalón negro — 35 días sin utilizar
 
⸻
 
9. PRENDAS MUY REPETIDAS
Crear también el análisis contrario.
Ejemplo:
Prendas que estás usando demasiado
Vaquero gris — 8 usos en 14 días
Camiseta blanca — 7 usos en 14 días
Esto no debe significar que esté prohibido utilizarlas.
Simplemente informar.
 
⸻
 
10. NIVEL DE REPETICIÓN
Crear una clasificación interna:
BAJA REPETICIÓN
MEDIA REPETICIÓN
ALTA REPETICIÓN
Basada en el historial real.
No utilizar números arbitrarios sin documentar el criterio.
Define umbrales razonables y fáciles de modificar posteriormente.
 
⸻
 
11. PUNTUACIÓN DE DIVERSIDAD
Crear opcionalmente una métrica:
Diversidad de armario
Ejemplo:
82 / 100
Esta puntuación debe considerar:
* variedad de Outfits;
* variedad de prendas;
* repetición reciente;
* cantidad de prendas utilizadas;
* tiempo sin utilizar determinadas prendas.
NO convertirlo en una métrica obsesiva.
Debe ser una herramienta visual para motivar al usuario a aprovechar mejor su armario.
 
⸻
 
12. COBERTURA DEL ARMARIO
Calcular qué porcentaje del armario se está utilizando.
Ejemplo:
Has utilizado 64 de tus 87 prendas
Cobertura: 74 %
Esto permite saber si realmente está aprovechando su ropa.
Definir correctamente qué significa “utilizada”:
una prenda cuenta como utilizada si aparece en al menos un Outfit que tenga un registro de uso.
 
⸻
 
13. OUTFITS SIN USAR
Mostrar:
Outfits nunca utilizados
Esto puede ser especialmente útil después de crear muchos Outfits.
Ejemplo:
Tienes 6 Outfits que todavía no has utilizado.
Botón:
Ver Outfits
 
⸻
 
14. RECOMENDACIÓN POR OCASIÓN
Permitir seleccionar:
¿Para qué es?
* Diario
* Universidad
* Trabajo
* Cena
* Fiesta
* Deporte
* Evento
* Viaje
* Otro
Después recomendar Outfits compatibles.
No recomendar un Outfit de gimnasio para una cena formal si la información disponible indica lo contrario.
 
⸻
 
15. RECOMENDACIÓN POR TEMPORADA
Utilizar:
* primavera;
* verano;
* otoño;
* invierno;
* todo el año.
Priorizar Outfits adecuados para la temporada actual.
No eliminar completamente otros Outfits si el usuario quiere verlos.
 
⸻
 
16. DISPONIBILIDAD
No recomendar automáticamente prendas marcadas como:
* En lavandería;
* En reparación;
* No disponible.
Si un Outfit contiene una prenda no disponible:
mostrar:
1 prenda no disponible
y reducir su prioridad.
No eliminar el Outfit del armario.
 
⸻
 
17. RECOMENDACIÓN POR HISTORIAL
El algoritmo debe tener en cuenta el uso reciente.
Ejemplo:
Si el usuario utilizó:
Vaquero gris
ayer,
un Outfit que utiliza ese vaquero debería tener menor prioridad hoy.
Pero no necesariamente quedar completamente prohibido.
 
⸻
 
18. PENALIZACIÓN POR REPETICIÓN
Crear un sistema interno de puntuación.
Conceptualmente:
PUNTUACIÓN OUTFIT
+
tiempo sin utilizar
+
diversidad de prendas
+
disponibilidad
+
adecuación a ocasión
+
adecuación a temporada
-
repetición reciente
Los pesos deben estar centralizados y ser fácilmente modificables.
No dispersar números mágicos por todo el código.
 
⸻
 
19. RECOMENDACIONES EXPLICABLES
MUY IMPORTANTE.
Nunca mostrar únicamente:
“Te recomendamos este Outfit.”
Explicar brevemente por qué.
Ejemplos:
Hace 24 días que no lo utilizas.
No contiene ninguna prenda que hayas usado en los últimos 3 días.
Es adecuado para verano.
Lo has utilizado muy pocas veces.
Esto hace que la inteligencia parezca útil y no aleatoria.
 
⸻
 
20. EVITAR REPETICIONES CON PERSONAS
El historial contiene información sobre personas.
Utilizarla para una recomendación opcional.
Ejemplo:
Si el usuario ha utilizado recientemente un Outfit con determinadas personas:
el sistema puede reducir ligeramente su prioridad para evitar una repetición cercana.
NO prohibir automáticamente.
Ejemplo:
“Este mismo Outfit lo utilizaste hace 3 días con este grupo.”
La decisión final siempre es del usuario.
 
⸻
 
21. EVITAR REPETICIONES POR LUGAR
Aplicar una lógica similar para lugares.
Ejemplo:
“Utilizaste este Outfit recientemente en este mismo lugar.”
Puede reducir la prioridad.
No bloquearlo.
 
⸻
 
22. MODO “NO REPETIR”
Crear una opción:
Modo no repetir
Cuando esté activada, el sistema priorizará fuertemente:
* Outfits no utilizados recientemente;
* prendas no utilizadas recientemente;
* combinaciones diferentes.
Debe poder desactivarse.
No imponer este comportamiento permanentemente.
 
⸻
 
23. AJUSTE DE SENSIBILIDAD
Si es posible, crear una preferencia:
Sensibilidad a la repetición
* Relajada
* Equilibrada
* Estricta
Relajada
Permite repetir más.
Equilibrada
Recomendación normal.
Estricta
Evita fuertemente repeticiones cercanas.
Guardar esta configuración en los ajustes del usuario.
 
⸻
 
24. ESTADÍSTICAS
Crear una sección:
Estadísticas del Armario
Mostrar:
* prendas totales;
* Outfits totales;
* prendas utilizadas;
* cobertura del armario;
* Outfits utilizados;
* Outfits nunca utilizados;
* prenda más utilizada;
* prenda menos utilizada;
* Outfit más utilizado;
* Outfit menos utilizado;
* días desde último uso;
* diversidad.
 
⸻
 
25. PERÍODOS
Permitir analizar:
* 7 días;
* 30 días;
* 90 días;
* este año;
* todo el historial.
Las estadísticas deben recalcularse según el período seleccionado cuando tenga sentido.
 
⸻
 
26. GRÁFICOS
Utilizar gráficos únicamente cuando aporten valor.
Por ejemplo:
Uso de prendas por semana
Diversidad de Outfits
Prendas utilizadas
No llenar la pantalla de gráficos.
JC Lifestyle debe seguir siendo limpio.
 
⸻
 
27. RANKING
Crear rankings:
Outfits más utilizados
Outfits menos utilizados
Prendas más utilizadas
Prendas menos utilizadas
Mostrar número de usos y, cuando proceda, última utilización.
 
⸻
 
28. “TU ARMARIO TE ESTÁ DICIENDO…”
Crear una pequeña sección de insights.
Ejemplos:
Llevas 12 días usando principalmente los mismos pantalones.
Tienes 8 prendas que todavía no has utilizado este mes.
Tu camiseta blanca es tu prenda más utilizada.
Hay 5 Outfits que no has utilizado nunca.
Estos mensajes deben generarse a partir de datos reales.
No mostrar frases falsas.
 
⸻
 
29. PRIVACIDAD
Los datos del Armario son privados.
No compartir:
* prendas;
* Outfits;
* historial;
* personas;
* lugares;
con otros usuarios.
Mantener el aislamiento completo por usuario.
 
⸻
 
30. RENDIMIENTO
El sistema inteligente no debe recalcular todo el historial cada vez que el usuario abre una tarjeta.
Utilizar:
* consultas eficientes;
* agregaciones;
* índices;
* caché cuando tenga sentido;
* cálculos derivados.
Pero mantener una única fuente de verdad.
No duplicar datos sin necesidad.
 
⸻
 
31. CONSISTENCIA DE DATOS
Si se elimina:
un uso
deben actualizarse correctamente:
* último uso;
* número de usos;
* estadísticas;
* recomendaciones.
Si se cambia la fecha:
todos los cálculos deben reflejar la nueva fecha.
Si se elimina un Outfit:
gestionar correctamente sus datos históricos según la estrategia definida en la Fase 3.
No dejar datos huérfanos.
 
⸻
 
32. IA
NO es necesario llamar a una IA externa para calcular:
* días desde último uso;
* frecuencia;
* repetición;
* estadísticas;
* ranking.
Estas funciones deben ser deterministas y calculadas por el sistema.
Si posteriormente se quiere utilizar IA generativa para sugerencias de estilo, deberá ser una capa independiente.
No dependas de una API de IA para que funcione el sistema básico.
 
⸻
 
33. BOTÓN “SORPRÉNDEME”
Añadir opcionalmente:
✨ Sorpréndeme
Debe seleccionar una recomendación poco obvia pero válida.
Por ejemplo:
* Outfit poco utilizado;
* combinación diferente;
* prendas olvidadas.
Debe respetar:
* disponibilidad;
* temporada;
* contexto cuando exista;
* modo de repetición.
 
⸻
 
34. REGISTRO DESDE LA RECOMENDACIÓN
Si el usuario decide utilizar la recomendación:
mostrar:
Me lo pongo
y permitir registrar inmediatamente el uso.
El flujo debe ser:
Recomendación
↓
Me lo pongo
↓
Registrar uso
↓
Calendario actualizado
No crear un segundo sistema de registro.
Utilizar el sistema de la Fase 3.
 
⸻
 
35. APRENDIZAJE DEL COMPORTAMIENTO
No modificar automáticamente las preferencias del usuario sin permiso.
El sistema puede observar datos para calcular recomendaciones, pero:
* no cambiar la sensibilidad sin permiso;
* no eliminar prendas;
* no modificar Outfits;
* no cambiar favoritos.
Las decisiones finales pertenecen al usuario.
 
⸻
 
36. INTEGRACIÓN CON EL RESTO DE JC LIFESTYLE
Integrar la nueva función respetando:
* diseño;
* navegación;
* modo oscuro;
* sistema de colores;
* autenticación;
* Supabase;
* componentes;
* responsive.
No crear una aplicación separada.
 
⸻
 
37. NO ROMPER FUNCIONALIDADES
Antes de terminar comprobar que siguen funcionando:
* Armario;
* prendas;
* fotografías;
* categorías;
* búsqueda;
* filtros;
* Outfits;
* edición;
* duplicación;
* favoritos;
* calendario;
* historial.
 
⸻
 
38. PRUEBA COMPLETA DEL SISTEMA
Simula:
Datos
5 prendas.
3 Outfits.
Varios registros históricos.
Después:
1. Registrar varios usos.
2. Crear una nueva utilización reciente.
3. Comprobar que cambian las recomendaciones.
4. Eliminar un uso.
5. Comprobar que se recalculan.
6. Cambiar la fecha de un uso.
7. Comprobar estadísticas.
8. Marcar una prenda como no disponible.
9. Comprobar que baja su prioridad.
10. Activar modo no repetir.
11. Generar recomendación.
12. Utilizar la recomendación.
13. Comprobar que el calendario recibe el nuevo uso.
14. Comprobar que el historial se actualiza.
 
⸻
 
39. CASO CLAVE
Utiliza este ejemplo:
PRENDAS

Camiseta blanca
Camiseta negra
Vaquero gris
Pantalón negro
Zapatillas blancas

OUTFITS

Casual Gris
Black Night
Universidad Blanca
Historial:
Casual Gris → ayer
Black Night → hace 15 días
Universidad Blanca → hace 30 días
Si las prendas están disponibles y la ocasión es adecuada:
el sistema debería priorizar:
Universidad Blanca
o:
Black Night
sobre:
Casual Gris
porque llevan más tiempo sin utilizarse.
No tiene que coincidir exactamente con este orden si el algoritmo considera otros factores, pero debe existir una lógica explicable.
 
⸻
 
40. CALIDAD DEL ALGORITMO
No quiero un sistema que simplemente diga:
“Elige el Outfit que hace más días que no utilizas.”
Debe combinar varios factores.
Como mínimo:
* antigüedad del último uso;
* repetición reciente;
* disponibilidad;
* utilización de prendas;
* temporada;
* ocasión;
* diversidad.
Los pesos deben estar centralizados y ser modificables.
 
⸻
 
41. TRANSPARENCIA
En el código documenta brevemente cómo se calcula la puntuación.
Ejemplo conceptual:
score =
  tiempoSinUso
  + diversidad
  + disponibilidad
  + adecuación
  - repeticiónReciente
No ocultar la lógica dentro de múltiples componentes.
Crear una función o servicio centralizado.
 
⸻
 
42. SEGURIDAD
Toda la inteligencia debe operar únicamente sobre los datos del usuario autenticado.
No utilizar datos de otros usuarios.
No enviar innecesariamente el armario completo a servicios externos.
Si en algún momento se utiliza una API externa de IA:
deberá hacerse posteriormente y con una arquitectura segura.
 
⸻
 
43. EXPERIENCIA MÓVIL
El usuario debe poder:
abrir Armario → ¿Qué me pongo hoy? → recibir 3 opciones → elegir una → registrar uso
en muy pocos pasos.
Esta debe ser una de las experiencias principales de JC Lifestyle.
 
⸻
 
44. CRITERIO DE FINALIZACIÓN
La Fase 4 solo está terminada cuando exista funcionalmente:
ARMARIO
✓ Prendas
OUTFITS
✓ Constructor
CALENDARIO
✓ Registro de uso
HISTORIAL
✓ Outfits y prendas
INTELIGENCIA
✓ Anti-repetición
✓ Recomendaciones
✓ Estadísticas
✓ Prendas olvidadas
✓ Outfits olvidados
✓ Prendas muy repetidas
✓ Modo no repetir
✓ Diversidad
✓ Cobertura
✓ Insights
 
⸻
 
45. NO DEJAR MAQUETAS
No quiero:
* botones que no hagan nada;
* estadísticas falsas;
* recomendaciones simuladas;
* números escritos manualmente;
* datos de ejemplo visibles en producción.
Todo debe utilizar datos reales del sistema.
 
⸻
 
46. AUDITORÍA FINAL
Antes de declarar la fase terminada:
revisa:
* errores TypeScript;
* errores de compilación;
* errores de consola;
* consultas;
* RLS;
* rendimiento;
* responsive;
* persistencia;
* relaciones;
* cálculos;
* estados vacíos;
* errores de conexión.
Corrige los problemas encontrados.
 
⸻
 
47. INFORME FINAL
Cuando hayas terminado, devuelve:
ARMARIO INTELIGENTE — ESTADO
FASE 4: XX / 100 %
FUNCIONALIDADES IMPLEMENTADAS
Resumen completo.
ALGORITMO
Explica brevemente cómo funciona el sistema de puntuación y anti-repetición.
ESTADÍSTICAS
Qué estadísticas existen.
RECOMENDACIONES
Cómo se generan.
BASE DE DATOS
Qué cambios se han realizado.
SEGURIDAD
Cómo se protege la información.
PRUEBAS
Qué pruebas se han realizado.
ERRORES CORREGIDOS
Problemas encontrados y solucionados.
ESTADO DEL SISTEMA DE ARMARIO
Indica:
FASE 1 — %
FASE 2 — %
FASE 3 — %
FASE 4 — %
ARMARIO COMPLETO — %
Si todo funciona correctamente:
ARMARIO JC LIFESTYLE — COMPLETADO 100 %
NO empieces ninguna nueva funcionalidad fuera del sistema de Armario.
Espera nuevas instrucciones.

Sí, tienes razón. Me he pasado dividiendo la Fase 2 en demasiadas entregas. La Fase 2 ya la damos por cerrada. No vamos a hacer más prompts de revisión sobre ella.
Ahora toca directamente:
FASE 3/4 — CALENDARIO + HISTORIAL DE USO
Aquí empieza la parte realmente importante de tu idea: que JC Lifestyle sepa cuándo te has puesto cada Outfit y cada prenda, cuánto tiempo lleva sin utilizarse y en qué contexto.
Esta fase la haría en una única prompt maestra, suficientemente completa para que Claude la implemente de principio a fin. Si Claude se queda sin contexto o no puede terminar técnicamente alguna parte, entonces sí te diré que continuemos, pero no voy a crear partes artificiales.
PROMPT 3 — JC LIFESTYLE
FASE 3/4 — CALENDARIO + HISTORIAL DE USO DEL ARMARIO
Continúa desde el estado actual de JC Lifestyle.
La FASE 1 — Armario Digital está terminada.
La FASE 2 — Constructor de Outfits está terminada.
Ahora comienza exclusivamente:
FASE 3 — CALENDARIO + HISTORIAL DE USO
La Fase 4 será posteriormente:
Sistema inteligente anti-repetición + estadísticas + recomendaciones.
NO empieces la Fase 4 en esta instrucción.
 
⸻
 
OBJETIVO PRINCIPAL
Ahora vamos a convertir el Armario y los Outfits en un sistema capaz de registrar cuándo utilizo mi ropa realmente.
La idea central es:
No quiero simplemente guardar qué ropa tengo. Quiero saber cuánto tiempo hace que no utilizo cada Outfit y cada prenda.
El sistema debe registrar cada utilización de forma independiente y conservar un historial completo.
 
⸻
 
1. CONCEPTO PRINCIPAL
Debe existir una nueva entidad:
USO DE OUTFIT
Cada vez que el usuario se pone un Outfit y quiere registrarlo, se crea un nuevo registro.
Ejemplo:
Outfit: Casual Gris

01/08/2026
05/08/2026
12/08/2026
20/08/2026
Estos son cuatro usos independientes.
NO guardar únicamente la última fecha.
Debemos conservar el historial completo.
 
⸻
 
2. CALENDARIO
Dentro de:
Gestión → Armario
añadir una navegación clara:
Prendas | Outfits | Calendario
El calendario debe mostrar visualmente los días en los que se ha registrado un Outfit.
Debe ser cómodo especialmente en móvil.
 
⸻
 
3. VISTA MENSUAL
La vista principal será un calendario mensual.
Debe mostrar:
* mes;
* año;
* días;
* días con Outfit registrado;
* indicador visual en los días utilizados.
Permitir:
mes anterior
mes siguiente
volver a hoy
 
⸻
 
4. DÍA CON OUTFIT
Si un día tiene un Outfit registrado:
mostrar un indicador.
Al pulsar ese día:
abrir el detalle.
Ejemplo:
12 de agosto
Outfit Casual Gris
Prendas:
* Camiseta blanca
* Sudadera gris
* Vaquero gris
* Zapatillas negras
* Reloj
 
⸻
 
5. VARIOS OUTFITS EN UN MISMO DÍA
No limitar el sistema a un solo Outfit por día.
Puede ocurrir:
12 de agosto
09:00
Outfit Universidad
20:00
Outfit Cena
Por tanto, un día puede contener múltiples usos.
 
⸻
 
6. REGISTRAR USO
Añadir un botón visible:
+ Registrar Outfit
Debe permitir:
Seleccionar Outfit
Mostrar los Outfits existentes.
Fecha
Por defecto:
hoy
pero editable.
Hora
Opcional.
Lugar
Opcional.
Personas
Opcional.
Evento/ocasión
Opcional.
Notas
Opcional.
El único dato obligatorio debe ser:
Outfit + fecha
 
⸻
 
7. REGISTRAR DESDE EL OUTFIT
Desde el detalle de cualquier Outfit añadir:
Registrar uso
Esto debe abrir directamente el formulario de registro con ese Outfit ya seleccionado.
Ejemplo:
Outfit Casual Gris
Botón:
✓ Me lo he puesto
Al pulsarlo:
fecha = hoy.
El usuario puede confirmar rápidamente.
Esto debe hacer que registrar un Outfit tarde unos segundos.
 
⸻
 
8. REGISTRAR DESDE EL CALENDARIO
También debe poder hacerse:
Calendario
↓
Seleccionar día
↓
+ Añadir Outfit
↓
Seleccionar Outfit
↓
Guardar.
 
⸻
 
9. FECHA Y HORA
Guardar correctamente:
* fecha;
* hora si existe;
* zona horaria del usuario.
MUY IMPORTANTE:
No utilizar UTC de forma que un Outfit registrado por la noche pueda aparecer en otro día.
Utilizar correctamente la zona horaria/localización de la aplicación.
 
⸻
 
10. LUGAR
Permitir:
Lugar
Ejemplos:
* Casa
* Universidad
* Madrid
* Restaurante
* Gimnasio
* Fiesta
* Trabajo
* Otro
Puede ser texto libre o selector, según la arquitectura actual.
Debe quedar almacenado en cada uso.
 
⸻
 
11. PERSONAS
Permitir indicar con quién se utilizó el Outfit.
Debe poder existir más de una persona.
Ejemplo:
Con:
* Jorge
* Pablo
* María
No crear todavía un sistema social complejo.
Simplemente almacenar la información de forma estructurada para futuras consultas.
 
⸻
 
12. EVENTO / OCASIÓN
Permitir asociar el uso a:
* Diario
* Universidad
* Trabajo
* Cena
* Fiesta
* Deporte
* Viaje
* Evento
* Otro
Esto es diferente del campo de ocasión general del Outfit.
El Outfit puede estar marcado como:
Cena
pero un uso concreto podría registrarse como:
Cena de cumpleaños de Jorge
 
⸻
 
13. NOTAS
Campo opcional:
Notas
Ejemplo:
Hacía bastante calor.
o:
Primera vez que lo combino con estas zapatillas.
 
⸻
 
14. HISTORIAL
Desde un Outfit debe existir:
Historial de uso
Mostrar:
* última utilización;
* número total de usos;
* lista cronológica de usos.
Ejemplo:
Outfit Casual Gris

Usado 12 veces

Último uso:
20 de agosto de 2026

Historial:

20 agosto — Madrid — Cena
12 agosto — Universidad
05 agosto — Casa
01 agosto — Madrid
...
 
⸻
 
15. “HACE X DÍAS”
Cada Outfit debe mostrar automáticamente:
Último uso: hace 2 días
o:
Último uso: hoy
o:
Último uso: hace 3 semanas
o:
Nunca utilizado
El cálculo debe realizarse dinámicamente a partir del historial.
NO introducir manualmente estos valores.
 
⸻
 
16. HISTORIAL DE CADA PRENDA
Esta parte es MUY IMPORTANTE.
Desde una prenda del Armario:
Vaquero gris
debe poder verse:
Historial de uso
Aunque el usuario nunca haya registrado directamente la prenda.
La aplicación debe poder deducir su utilización a través de:
PRENDA
↓
OUTFIT
↓
USO DEL OUTFIT
Ejemplo:
Vaquero gris
Usado:
18 veces
Último uso:
hace 3 días
Esto será fundamental para la Fase 4.
 
⸻
 
17. CONTADOR DE USOS DE PRENDA
No guardar manualmente:
usageCount
si puede calcularse de manera fiable desde el historial.
La fuente de verdad debe ser:
OUTFIT_USAGE
relacionado con:
OUTFIT_ITEMS
y:
GARMENTS
Evitar inconsistencias entre contadores y registros reales.
Si se utilizan contadores cacheados por rendimiento, deben mantenerse sincronizados de forma segura.
 
⸻
 
18. ÚLTIMO USO DE PRENDA
Debe poder calcularse:
último uso de la prenda
=
último uso de cualquier Outfit que contenga esa prenda
Ejemplo:
Vaquero gris

Outfit A → 01/08
Outfit B → 12/08
Outfit C → 20/08

Último uso = 20/08
 
⸻
 
19. DETALLE DE UN DÍA
Al pulsar un día del calendario:
mostrar una vista limpia.
Ejemplo:
20 DE AGOSTO
09:00
Outfit Universidad
20:30
Outfit Cena
Cada registro debe permitir:
* abrir Outfit;
* editar registro;
* eliminar registro.
 
⸻
 
20. EDITAR UN USO
El usuario debe poder modificar:
* fecha;
* hora;
* lugar;
* personas;
* evento;
* notas.
También poder cambiar el Outfit asociado si fuera necesario.
 
⸻
 
21. ELIMINAR UN USO
Permitir eliminar un registro de utilización.
Eliminarlo debe:
* eliminar ese uso;
* NO eliminar el Outfit;
* NO eliminar ninguna prenda.
Después de eliminarlo, todos los cálculos de:
* último uso;
* número de usos;
* historial;
deben actualizarse correctamente.
 
⸻
 
22. CAMBIO DE FECHA
Si un uso se mueve:
10 agosto → 15 agosto
el calendario debe actualizarse.
El historial debe reflejar la nueva fecha.
 
⸻
 
23. CALENDARIO COMO CENTRO VISUAL
El calendario no debe ser simplemente una tabla.
Queremos que el usuario pueda mirar rápidamente y pensar:
“¿Qué me he puesto este mes?”
Por ello, los días con Outfit deben tener una representación visual elegante.
Si es posible, mostrar:
* miniatura del Outfit;
* icono;
* color;
* pequeño indicador.
No saturar el calendario.
 
⸻
 
24. VISTA DE LISTA
Además del calendario, permitir una vista:
Lista
Ejemplo:
20 AGO
Outfit Cena

18 AGO
Outfit Universidad

17 AGO
Outfit Casual

15 AGO
Outfit Deportivo
Esto permite revisar el historial cronológicamente.
 
⸻
 
25. FILTROS DEL HISTORIAL
Preparar filtros por:
* Outfit;
* prenda;
* lugar;
* personas;
* ocasión;
* rango de fechas.
Ejemplo:
Últimos 30 días
o:
Todos los usos del Vaquero gris
 
⸻
 
26. RANGO DE FECHAS
Permitir consultar:
* esta semana;
* este mes;
* últimos 30 días;
* últimos 90 días;
* este año;
* personalizado.
No desarrollar todavía estadísticas avanzadas.
Esto será utilizado principalmente para consultar historial.
 
⸻
 
27. OUTFITS SIN HISTORIAL
Si un Outfit nunca se ha utilizado:
mostrar:
Todavía no has registrado este Outfit.
Botón:
Registrar primer uso
 
⸻
 
28. PRENDAS SIN HISTORIAL
Si ninguna de sus prendas aparece en un Outfit utilizado:
mostrar:
Todavía no hay datos de uso.
No mostrar:
0 días
ni inventar una fecha.
 
⸻
 
29. RELACIÓN CON PRENDAS
La lógica debe ser:
USUARIO
   ↓
PRENDA
   ↓
OUTFIT_ITEM
   ↓
OUTFIT
   ↓
OUTFIT_USAGE
Esto permite obtener el historial de cada prenda sin duplicar información.
 
⸻
 
30. MODELO DE DATOS
Crear una tabla/entidad equivalente a:
OUTFIT_USAGE

id
user_id
outfit_id
used_at
location
people
event
occasion
notes
created_at
updated_at
Utilizar nombres coherentes con la arquitectura real de JC Lifestyle.
No crear duplicados si ya existe una estructura equivalente.
 
⸻
 
31. SEGURIDAD
Aplicar exactamente el mismo aislamiento de usuario.
Un usuario solo puede:
* crear sus usos;
* ver sus usos;
* editar sus usos;
* eliminar sus usos.
Nunca acceder a registros de otro usuario.
Si se utiliza Supabase:
implementar/revisar RLS.
No confiar solamente en frontend.
 
⸻
 
32. BORRADO DE OUTFIT
Define correctamente qué sucede si se elimina un Outfit que tiene historial.
IMPORTANTE:
No perder accidentalmente integridad de la base de datos.
Elige la estrategia más adecuada:
* impedir eliminación;
* borrado lógico;
* conservar registros históricos;
* otra solución sólida.
Prioridad:
no romper el historial.
Documenta la decisión.
 
⸻
 
33. EDICIÓN DE PRENDA
Si una prenda cambia:
* nombre;
* fotografía;
* color;
* categoría;
el historial pasado debe seguir apuntando a la misma prenda.
No crear una nueva entidad automáticamente.
 
⸻
 
34. RENDIMIENTO
Diseñar pensando en:
* cientos de prendas;
* cientos de Outfits;
* miles de usos históricos.
No cargar todo el historial de todos los usuarios.
Utilizar:
* consultas eficientes;
* índices;
* paginación/carga progresiva cuando sea necesaria;
* filtros en backend cuando sea apropiado.
 
⸻
 
35. MÓVIL
Diseñar especialmente para iPhone.
El flujo:
Me lo he puesto → confirmar
debe ser extremadamente rápido.
No quiero abrir cinco pantallas para registrar que me he puesto un Outfit.
 
⸻
 
36. ACCESO RÁPIDO
Si encaja con el diseño de JC Lifestyle, añadir una acción rápida desde el Outfit:
✓ Registrar uso
Y desde el calendario:
+ Registrar Outfit
No crear accesos duplicados innecesarios.
 
⸻
 
37. INTEGRACIÓN CON FASE 1 Y FASE 2
No romper:
* Armario;
* prendas;
* categorías;
* búsqueda;
* filtros;
* Outfits;
* edición;
* duplicación;
* favoritos.
El calendario debe utilizar las entidades existentes.
No crear copias.
 
⸻
 
38. PREPARACIÓN PARA FASE 4
Esta fase debe dejar disponibles los datos necesarios para que posteriormente podamos calcular:
Outfit
* número de usos;
* último uso;
* días desde último uso;
* frecuencia.
Prenda
* número de usos;
* último uso;
* días desde último uso;
* frecuencia.
Combinaciones
* Outfits utilizados recientemente;
* prendas utilizadas recientemente;
* combinaciones repetidas.
Contexto
* lugares;
* personas;
* ocasiones.
NO implementar todavía el algoritmo inteligente.
 
⸻
 
39. EXPERIENCIA FINAL
El usuario debe poder hacer esto en pocos segundos:
Abrir Outfit
↓
"Me lo he puesto"
↓
Confirmar
↓
Registrado
Y posteriormente abrir el calendario y verlo.
 
⸻
 
40. PRUEBAS OBLIGATORIAS
Realiza pruebas reales de:
* registrar Outfit hoy;
* registrar Outfit en fecha pasada;
* registrar dos Outfits el mismo día;
* registrar varios Outfits diferentes;
* editar un uso;
* cambiar fecha;
* eliminar un uso;
* comprobar historial;
* comprobar último uso;
* comprobar contador;
* comprobar historial de una prenda;
* comprobar filtros;
* comprobar calendario;
* comprobar vista lista;
* comprobar persistencia;
* comprobar seguridad.
 
⸻
 
41. PRUEBA CRÍTICA
Haz esta prueba:
PRENDA
Vaquero gris
OUTFITS
Casual Gris
Cena Negra
USOS
Casual Gris → 10 agosto
Cena Negra → 15 agosto
Casual Gris → 20 agosto
El sistema debe poder determinar:
Vaquero gris
Último uso:
20 agosto
Usos:
3
Y:
Casual Gris
Último uso:
20 agosto
Usos:
2
Cena Negra
Último uso:
15 agosto
Usos:
1
No introducir estos valores manualmente.
Deben derivarse del historial real.
 
⸻
 
42. ERRORES
Si encuentras cualquier error durante las pruebas:
corrígelo.
No me devuelvas simplemente una lista de errores.
Quiero que dejes la implementación funcionando.
 
⸻
 
43. NO HACER
NO implementar todavía:
* algoritmo anti-repetición;
* recomendaciones;
* ranking de prendas;
* puntuación;
* avisos inteligentes;
* análisis avanzado;
* IA de moda.
Todo eso será la:
FASE 4.
 
⸻
 
44. CRITERIO DE FINALIZACIÓN
La Fase 3 solo se considera terminada cuando:
Calendario + registro de uso + historial de Outfits + historial de prendas
funcionen realmente.
No quiero una maqueta.
No quiero datos simulados.
Quiero persistencia real.
 
⸻
 
45. INFORME FINAL
Cuando termines, responde:
FASE 3 — ESTADO
COMPLETADA / PENDIENTE
PORCENTAJE
XX / 100 %
IMPLEMENTADO
Resumen de funcionalidades.
BASE DE DATOS
Tablas, relaciones, índices y cambios.
SEGURIDAD
RLS/permisos.
PRUEBAS
Pruebas realizadas y resultados.
PREPARACIÓN FASE 4
Qué datos quedan preparados para:
ANTI-REPETICIÓN + ESTADÍSTICAS + RECOMENDACIONES
PROBLEMAS CORREGIDOS
Lista breve.
PENDIENTES
Solo problemas reales que impidan terminar la fase.
NO empieces la FASE 4 automáticamente.
Espera instrucciones.

Sí. Pasamos a FASE 2/4 — CONSTRUCTOR DE OUTFITS.
Esta fase se apoya directamente en el armario que acabamos de definir. Aquí vamos a conseguir que las prendas de la Fase 1 dejen de ser elementos aislados y puedan combinarse para crear Outfits reales, que después podremos registrar en el calendario en la Fase 3.
PROMPT 2 — JC LIFESTYLE · FASE 2 — CONSTRUCTOR DE OUTFITS
CONTEXTO
Estamos desarrollando JC Lifestyle, un sistema operativo personal web/PWA.
Ya existe la:
GESTIÓN → ARMARIO
y se ha desarrollado la FASE 1 — Armario Digital, donde el usuario puede guardar sus prendas, editarlas, clasificarlas y gestionarlas.
Ahora comenzamos:
FASE 2 DE 4 — CONSTRUCTOR DE OUTFITS
Las cuatro fases completas son:
1. Armario digital
2. Constructor de Outfits ← ESTAMOS AQUÍ
3. Calendario + historial de uso
4. Sistema inteligente anti-repetición + estadísticas
En esta fase debemos permitir que el usuario cree combinaciones completas utilizando las prendas que ya tiene guardadas.
NO desarrolles todavía el calendario completo ni el sistema inteligente de repetición. La arquitectura debe quedar preparada para ello.
 
⸻
 
1. OBJETIVO
Convertir el Armario en un sistema donde el usuario pueda crear y guardar sus propios Outfits.
Ejemplo:
OUTFIT — Casual gris
* Camiseta blanca
* Sudadera gris
* Vaquero gris
* Nike Air Force 1
* Reloj
* Cadena
El Outfit debe ser una entidad independiente que referencia las prendas existentes.
NO duplicar las prendas dentro del Outfit.
Si una prenda cambia de nombre, color, foto o información, el Outfit debe seguir apuntando a esa misma prenda.
 
⸻
 
2. ACCESO
Dentro de:
Gestión → Armario
crear una navegación clara entre:
Prendas | Outfits
o un sistema equivalente que encaje mejor con el diseño actual.
Debe quedar claro en todo momento si el usuario está viendo:
* sus prendas;
* sus Outfits.
No crear una sección independiente fuera de Gestión.
 
⸻
 
3. PANTALLA DE OUTFITS
Mostrar:
Mis Outfits
Subtítulo:
Combina tus prendas y crea tu propio estilo.
Mostrar:
* número total de Outfits;
* buscador;
* filtros;
* botón + Crear Outfit.
Los Outfits deben visualizarse de forma visual y premium.
 
⸻
 
4. CREAR OUTFIT
Botón:
+ Crear Outfit
Abrir un flujo sencillo.
Primero:
Nombre
Ejemplos:
* Casual gris
* Universidad
* Cena
* Verano
* Deportivo
* Noche
* Outfit negro
El nombre debe ser editable.
 
⸻
 
5. SELECCIÓN DE PRENDAS
El usuario debe poder seleccionar prendas existentes de su armario.
Mostrar categorías:
* Parte superior
* Parte inferior
* Calzado
* Abrigo
* Accesorios
* Otros
IMPORTANTE:
No limitar artificialmente el número de prendas.
Un Outfit puede contener:
* 1 camiseta;
* 2 camisetas;
* 1 camiseta + 1 sudadera;
* varios accesorios;
* etc.
El sistema debe permitir múltiples prendas de la misma categoría.
Por ejemplo:
Camiseta + camiseta interior + sudadera + pantalón + zapatillas + reloj + cadena
 
⸻
 
6. BUSCADOR DE PRENDAS
Dentro del selector debe existir búsqueda.
Ejemplo:
El usuario escribe:
gris
y aparecen las prendas relacionadas.
También permitir filtrar por:
* categoría;
* color;
* marca;
* favoritos.
Reutilizar el sistema de búsqueda/filtros de la Fase 1 siempre que sea posible.
No crear sistemas duplicados innecesariamente.
 
⸻
 
7. SELECCIÓN VISUAL
Las prendas deben mostrarse mediante tarjetas visuales.
Si tienen foto:
mostrar foto.
Si no tienen foto:
utilizar el mismo fallback visual de la Fase 1.
Al seleccionar una prenda:
mostrar claramente que está seleccionada.
Debe existir una forma sencilla de:
Añadir
y posteriormente:
Quitar
 
⸻
 
8. VISTA PREVIA DEL OUTFIT
Mientras el usuario construye el Outfit, debe poder ver una vista previa.
Ejemplo:
        [ Camiseta ]
        [ Sudadera ]
        [ Pantalón ]
        [ Zapatillas ]
        [ Accesorios ]
No es necesario crear una representación fotográfica artificial del cuerpo.
La prioridad es mostrar claramente qué prendas forman el Outfit.
Si las prendas tienen fotografías, utilizarlas para crear una composición visual atractiva.
 
⸻
 
9. FOTO DEL OUTFIT
Permitir añadir una fotografía propia del Outfit.
La foto es:
OPCIONAL.
El usuario puede:
* hacer una foto;
* seleccionar una imagen;
* no utilizar ninguna.
Si no existe foto propia, generar una representación basada en las prendas seleccionadas.
No obligar nunca a subir una foto.
 
⸻
 
10. INFORMACIÓN DEL OUTFIT
Permitir:
Nombre
Obligatorio.
Descripción
Opcional.
Ocasión
Opciones iniciales:
* Diario
* Casual
* Deporte
* Universidad/estudios
* Trabajo
* Cena
* Fiesta
* Evento
* Formal
* Viaje
* Otro
Temporada
* Primavera
* Verano
* Otoño
* Invierno
* Todo el año
Lugar
Campo opcional.
Ejemplos:
* Madrid
* Universidad
* Gimnasio
* Casa
* Restaurante
IMPORTANTE:
El campo de lugar se prepara porque en la Fase 3 tendrá importancia para el historial.
 
⸻
 
11. PERSONAS
Preparar un campo:
Personas
Debe permitir asociar posteriormente un Outfit con determinadas personas.
Por ejemplo:
* Amigos
* Familia
* Persona concreta
* Evento concreto
No crear todavía un sistema social complejo.
Simplemente dejar la estructura preparada.
En la Fase 3 utilizaremos esta información para analizar cuándo y con quién se utilizó un Outfit.
 
⸻
 
12. FAVORITOS
Permitir marcar un Outfit como:
⭐ Favorito
Debe poder filtrarse posteriormente:
Solo favoritos
 
⸻
 
13. EDITAR OUTFIT
Todos los Outfits deben poder editarse.
El usuario debe poder modificar:
* nombre;
* prendas;
* fotografía;
* descripción;
* ocasión;
* temporada;
* lugar;
* personas;
* favorito.
Los cambios deben conservarse correctamente.
 
⸻
 
14. DUPLICAR OUTFIT
Crear una acción:
Duplicar Outfit
Esto permitirá crear rápidamente una variación.
Ejemplo:
Outfit:
Casual gris
Duplicar →
Casual gris + chaqueta
La copia debe ser un Outfit independiente, pero debe utilizar las mismas prendas hasta que el usuario cambie alguna.
 
⸻
 
15. ELIMINAR
Permitir eliminar Outfits.
Mostrar confirmación antes de eliminar.
IMPORTANTE:
Eliminar un Outfit NO debe eliminar las prendas que contiene.
Las prendas pertenecen al Armario.
Los Outfits solamente las referencian.
 
⸻
 
16. DETALLE DE OUTFIT
Al abrir un Outfit mostrar:
* nombre;
* fotografía;
* composición;
* prendas;
* ocasión;
* temporada;
* lugar;
* personas;
* descripción;
* favorito.
Y acciones:
Editar
Duplicar
Eliminar
 
⸻
 
17. ACCESO DIRECTO A LAS PRENDAS
Desde un Outfit, si el usuario pulsa una prenda:
abrir el detalle de esa prenda.
Ejemplo:
Outfit:
Casual gris
Pulsar:
Vaquero gris
→ abrir el detalle de Vaquero gris.
Esto debe utilizar el mismo sistema de prendas de la Fase 1.
 
⸻
 
18. INFORMACIÓN DE USO — PREPARACIÓN
Aunque el calendario pertenece a la Fase 3, cada Outfit debe estar preparado para almacenar posteriormente información como:
lastUsedAt
usageCount
usageHistory
No implementar todavía el sistema completo de historial.
Pero la estructura debe permitirlo.
En la Fase 3 necesitaremos poder responder:
¿Cuándo utilicé este Outfit por última vez?
¿Cuántas veces lo he utilizado?
¿Dónde lo utilicé?
¿Con quién?
 
⸻
 
19. MODELO DE DATOS
Crear una estructura sólida.
Conceptualmente:
OUTFIT

id
userId
name
description
coverImage
occasion
season
location
people
favorite
createdAt
updatedAt
lastUsedAt
usageCount
Y una relación:
OUTFIT
   ↓
OUTFIT_ITEMS
   ↓
GARMENT / PRENDA
Cada OUTFIT_ITEM debería almacenar como mínimo:
id
outfitId
garmentId
createdAt
NO guardar copias completas de las prendas dentro del Outfit.
Utilizar relaciones.
 
⸻
 
20. USUARIO
Cada Outfit debe pertenecer a un usuario.
Nunca permitir que un usuario pueda consultar o modificar Outfits de otro usuario.
Si JC Lifestyle utiliza Supabase:
* utilizar user_id;
* aplicar Row Level Security;
* mantener la misma arquitectura de seguridad existente.
 
⸻
 
21. IMÁGENES
Si se utiliza almacenamiento externo como Supabase Storage:
* mantener las imágenes asociadas al usuario;
* evitar rutas públicas innecesarias;
* respetar las reglas de seguridad existentes;
* optimizar imágenes.
No duplicar innecesariamente una fotografía de una prenda dentro de cada Outfit.
Si el Outfit utiliza una prenda que ya tiene fotografía, reutilizarla cuando sea apropiado.
 
⸻
 
22. FILTROS DE OUTFITS
Permitir filtrar por:
* favoritos;
* ocasión;
* temporada;
* lugar;
* prendas utilizadas.
Ejemplo:
Outfits que utilizan el vaquero gris
Debe ser posible consultar posteriormente.
 
⸻
 
23. BÚSQUEDA
Buscar por:
* nombre del Outfit;
* descripción;
* ocasión;
* lugar;
* prendas relacionadas.
Ejemplo:
Buscar:
negro
podría encontrar un Outfit llamado:
Total Black
aunque el nombre no contenga “negro”, si contiene una prenda negra.
 
⸻
 
24. ORDENACIÓN
Preparar:
* más recientes;
* más antiguos;
* nombre A-Z;
* nombre Z-A;
* favoritos.
Preparar también para futuras opciones:
* más utilizados;
* menos utilizados;
* utilizados recientemente;
* tiempo sin utilizar.
Estas últimas dependerán de la Fase 3/4.
 
⸻
 
25. EXPERIENCIA RÁPIDA
Crear un Outfit debe ser rápido.
No obligar al usuario a rellenar demasiados campos.
Flujo recomendado:
Crear Outfit
↓
Nombre
↓
Seleccionar prendas
↓
Guardar
Y después poder añadir información adicional.
El usuario avanzado podrá completar:
* ocasión;
* temporada;
* lugar;
* personas;
* descripción;
* fotografía.
 
⸻
 
26. DISEÑO
Mantener exactamente el lenguaje visual de JC Lifestyle.
Debe sentirse como una evolución natural del Armario.
Prioridad:
móvil → tablet → escritorio
Utilizar:
* tarjetas;
* animaciones suaves;
* transiciones;
* iconos;
* estados de selección;
* feedback visual.
Evitar interfaces recargadas.
 
⸻
 
27. ESTADO VACÍO
Si no existen Outfits:
mostrar:
Todavía no tienes Outfits
Texto:
Combina tus prendas y guarda tus looks favoritos para tenerlos siempre preparados.
Botón:
+ Crear mi primer Outfit
 
⸻
 
28. COMPATIBILIDAD CON FASE 3
MUY IMPORTANTE.
No implementar todavía el calendario.
Pero dejar preparado que un Outfit pueda posteriormente recibir:
fecha
hora
lugar
personas
evento
Y que cada utilización genere un registro independiente.
Conceptualmente:
OUTFIT
   ↓
HISTORIAL DE USO
   ↓
FECHA
LUGAR
PERSONAS
EVENTO
Esto permitirá en la Fase 3 construir el calendario sin rehacer los Outfits.
 
⸻
 
29. COMPATIBILIDAD CON FASE 4
La Fase 4 analizará:
* frecuencia;
* repetición;
* prendas;
* Outfits;
* fechas;
* lugares;
* personas;
* tiempo desde último uso.
Por tanto, no diseñes el modelo de datos de forma que perdamos información.
Queremos poder calcular posteriormente:
días desde último uso
número de usos
frecuencia
prendas más repetidas
Outfits menos utilizados
combinaciones utilizadas recientemente
 
⸻
 
30. NO ROMPER NADA
Antes de modificar:
* analizar arquitectura existente;
* analizar componentes;
* analizar navegación;
* analizar Supabase;
* analizar autenticación;
* analizar almacenamiento;
* analizar estilos;
* analizar sistema responsive.
No reemplazar sistemas existentes.
No crear duplicados.
No romper funcionalidades anteriores.
 
⸻
 
31. PRUEBAS OBLIGATORIAS
Antes de terminar esta fase comprobar:
Crear
* crear Outfit;
* seleccionar una prenda;
* seleccionar varias;
* seleccionar varias de la misma categoría;
* añadir fotografía;
* crear sin fotografía.
Editar
* cambiar nombre;
* añadir prendas;
* quitar prendas;
* cambiar información.
Relaciones
* abrir una prenda desde un Outfit;
* modificar una prenda y comprobar que el Outfit continúa correctamente relacionado.
Duplicar
* duplicar Outfit;
* modificar copia;
* comprobar que el original no cambia.
Eliminar
* eliminar Outfit;
* comprobar que las prendas siguen existiendo.
Búsqueda
* buscar por nombre;
* buscar por prenda;
* filtrar.
Seguridad
* comprobar aislamiento por usuario.
Responsive
* móvil;
* tablet;
* escritorio.
Persistencia
* recargar;
* cerrar sesión;
* volver a entrar;
* comprobar que los datos siguen correctamente almacenados.
 
⸻
 
32. REGLA FINAL
NO empieces la FASE 3.
La FASE 3 será:
CALENDARIO + HISTORIAL DE USO
y solamente comenzará cuando yo lo indique.
Esta fase se considera terminada únicamente cuando exista un Constructor de Outfits funcional, persistente, seguro y correctamente conectado con el Armario de la Fase 1.
No quiero una maqueta.
Quiero funcionalidad real.
Al finalizar, proporciona:
IMPLEMENTADO
Resumen de todo lo creado.
ARCHIVOS MODIFICADOS
Archivos afectados.
BASE DE DATOS
Tablas, relaciones y campos.
SEGURIDAD
Medidas aplicadas.
PRUEBAS
Pruebas realizadas y resultado.
PREPARADO PARA FASE 3
Qué información queda preparada para calendario e historial.
No continúes automáticamente a la Fase 3.
Perfecto. Seguimos con la FASE 2 — CONSTRUCTOR DE OUTFITS.
Esta es la continuación de la Fase 2, centrada en que Claude revise, complete y deje sólida toda la funcionalidad antes de pasar a la Fase 3. No empezamos todavía el calendario.
CONTINUACIÓN — FASE 2 · CONSTRUCTOR DE OUTFITS
Continúa exactamente desde la implementación realizada en la anterior instrucción.
NO empieces la FASE 3.
Tu objetivo ahora es revisar, completar, corregir y pulir la FASE 2 hasta que el Constructor de Outfits quede realmente terminado y preparado para conectarse posteriormente con el calendario.
 
⸻
 
1. AUDITORÍA
Antes de modificar nada:
* revisa todo lo implementado;
* comprueba la arquitectura existente;
* comprueba las relaciones entre prendas y Outfits;
* comprueba autenticación;
* comprueba Supabase/almacenamiento si existe;
* comprueba responsive;
* comprueba modo oscuro;
* comprueba navegación.
No rehagas sistemas que ya funcionan correctamente.
 
⸻
 
2. COMPROBAR CREACIÓN
Verifica que se pueda:
* crear un Outfit;
* poner nombre;
* seleccionar prendas;
* seleccionar varias prendas;
* seleccionar varias prendas de una misma categoría;
* añadir fotografía opcional;
* añadir descripción;
* seleccionar ocasión;
* seleccionar temporada;
* añadir lugar;
* añadir personas;
* marcar favorito;
* guardar.
El Outfit debe quedar persistido realmente.
 
⸻
 
3. SELECTOR DE PRENDAS
Pulir especialmente el selector.
Debe ser rápido incluso con cientos de prendas.
Permitir:
* búsqueda;
* filtros;
* selección múltiple;
* quitar selección;
* visualizar claramente las prendas seleccionadas.
No permitir accidentalmente seleccionar dos veces la misma instancia de una prenda dentro del Outfit.
 
⸻
 
4. EXPERIENCIA DE USUARIO
Revisa el flujo completo:
Armario → Outfits → Crear Outfit → Seleccionar prendas → Revisar → Guardar
Debe sentirse natural.
Evita formularios largos.
Si existen demasiados campos secundarios, agrúpalos dentro de:
Información adicional
La creación básica debe poder hacerse rápidamente.
 
⸻
 
5. VISTA DEL OUTFIT
Mejora la presentación de cada Outfit.
Debe ser inmediatamente reconocible:
* nombre;
* imagen/composición;
* prendas utilizadas;
* información principal.
Si no tiene fotografía, utilizar una composición visual generada a partir de las prendas disponibles.
No dejar espacios vacíos antiestéticos.
 
⸻
 
6. DETALLE
Comprueba que el detalle de cada Outfit permita:
* ver todas sus prendas;
* abrir cada prenda;
* editar;
* duplicar;
* eliminar;
* marcar/desmarcar favorito.
Todo debe funcionar sin recargar innecesariamente la aplicación.
 
⸻
 
7. EDICIÓN
Comprueba especialmente:
* añadir una nueva prenda;
* quitar una prenda;
* sustituir una prenda;
* cambiar fotografía;
* cambiar nombre;
* modificar información adicional.
Después de guardar, los cambios deben reflejarse inmediatamente.
 
⸻
 
8. DUPLICACIÓN
Haz una prueba completa:
1. Crear Outfit A.
2. Duplicarlo.
3. Crear Outfit B.
4. Modificar B.
5. Comprobar que A permanece intacto.
Las dos entidades deben ser independientes.
Las prendas, sin embargo, deben continuar siendo referencias a las prendas originales.
 
⸻
 
9. ELIMINACIÓN
Al eliminar un Outfit:
* eliminar únicamente el Outfit y sus relaciones;
* NO eliminar ninguna prenda;
* NO eliminar fotografías pertenecientes exclusivamente a las prendas;
* limpiar correctamente las relaciones correspondientes.
Comprobarlo después de eliminar.
 
⸻
 
10. PRENDAS ELIMINADAS
Prepara correctamente el comportamiento si una prenda utilizada en un Outfit se elimina posteriormente del Armario.
No debe producirse:
* pantalla rota;
* error;
* referencia inválida;
* tarjeta vacía.
Implementa una estrategia coherente con la arquitectura actual.
Por ejemplo:
* impedir eliminar una prenda utilizada sin confirmación adicional;
* o conservar una referencia histórica;
* o mostrarla como no disponible.
Elige la solución técnicamente más sólida para JC Lifestyle y documenta qué has decidido.
 
⸻
 
11. BÚSQUEDA Y FILTROS
Comprueba que funcionen correctamente:
* nombre;
* ocasión;
* temporada;
* lugar;
* prendas;
* favoritos.
La búsqueda debe actualizarse de forma fluida.
 
⸻
 
12. RENDIMIENTO
Revisa que:
* no se hagan consultas innecesarias;
* no se descarguen imágenes gigantes;
* no se rendericen cientos de tarjetas innecesariamente;
* el selector siga siendo usable con un armario grande.
Si la arquitectura actual permite paginación o carga progresiva, úsala cuando tenga sentido.
 
⸻
 
13. MÓVIL
Prueba específicamente una pantalla pequeña.
Comprueba:
* botones;
* modales;
* selector de prendas;
* scroll;
* imágenes;
* formularios;
* teclado;
* navegación.
No debe haber elementos cortados ni botones imposibles de pulsar.
 
⸻
 
14. ESTADOS
Implementa correctamente:
* cargando;
* vacío;
* error;
* guardando;
* guardado correctamente;
* eliminación;
* búsqueda sin resultados.
No mostrar errores técnicos directamente al usuario.
Utilizar mensajes claros.
 
⸻
 
15. BASE DE DATOS
Revisa las relaciones:
USER
 ↓
GARMENTS
 ↓
OUTFITS
 ↓
OUTFIT_ITEMS
Comprueba:
* claves primarias;
* claves foráneas;
* índices necesarios;
* restricciones;
* user_id;
* timestamps;
* eliminación de relaciones.
No dupliques información innecesariamente.
 
⸻
 
16. SEGURIDAD
Comprueba que:
* un usuario solo pueda leer sus Outfits;
* un usuario solo pueda crear Outfits propios;
* un usuario solo pueda modificar sus Outfits;
* un usuario solo pueda eliminar sus Outfits;
* las relaciones con prendas respeten también el usuario propietario.
Si utilizas Supabase, revisa las políticas RLS.
No confíes únicamente en comprobaciones del frontend.
 
⸻
 
17. PREPARACIÓN PARA HISTORIAL
No implementes todavía el calendario.
Pero comprueba que el modelo permita posteriormente crear algo equivalente a:
OUTFIT_USAGE

id
user_id
outfit_id
used_at
location
people
event
notes
No es necesario crear todavía esta tabla si corresponde a la Fase 3.
Lo importante es que la arquitectura actual no dificulte su incorporación.
 
⸻
 
18. PREPARACIÓN PARA INTELIGENCIA
Asegúrate de que posteriormente podamos calcular:
* último uso;
* número de usos;
* días sin utilizar;
* prendas más utilizadas;
* Outfits más utilizados;
* combinaciones repetidas;
* lugares;
* personas;
* frecuencia.
No implementes todavía los algoritmos.
 
⸻
 
19. REVISIÓN VISUAL FINAL
Haz una revisión completa del diseño.
Debe parecer una funcionalidad nativa de JC Lifestyle, no una página añadida posteriormente.
Mantén:
* estilo premium;
* consistencia;
* animaciones;
* iconografía;
* modo oscuro;
* responsive;
* jerarquía visual.
 
⸻
 
20. PRUEBA FINAL COMPLETA
Realiza una prueba simulando un usuario real:
1. Entrar en Armario.
2. Entrar en Outfits.
3. Crear Outfit.
4. Seleccionar 5 prendas.
5. Añadir información.
6. Guardar.
7. Abrirlo.
8. Editarlo.
9. Añadir una prenda.
10. Quitar otra.
11. Duplicarlo.
12. Modificar la copia.
13. Buscarlo.
14. Filtrarlo.
15. Marcarlo favorito.
16. Desmarcarlo.
17. Eliminar la copia.
18. Comprobar que el original sigue intacto.
19. Comprobar que todas las prendas siguen en el Armario.
20. Recargar.
21. Comprobar persistencia.
Corrige cualquier error encontrado.
 
⸻
 
21. CRITERIO DE FINALIZACIÓN
No declares la fase terminada simplemente porque la interfaz aparezca.
La Fase 2 solo está terminada cuando:
Crear → Guardar → Ver → Editar → Duplicar → Buscar → Filtrar → Eliminar
funcione correctamente y los datos estén correctamente relacionados y persistidos.
 
⸻
 
22. INFORME FINAL
Cuando termines, responde exactamente con:
ESTADO DE FASE 2
Indica si está completamente terminada.
IMPLEMENTADO
Resumen.
BASE DE DATOS
Tablas y relaciones.
SEGURIDAD
RLS/permisos y protección de datos.
PRUEBAS
Qué has probado.
ERRORES CORREGIDOS
Qué problemas encontraste y solucionaste.
PREPARACIÓN FASE 3
Qué queda preparado para calendario e historial.
NO IMPLEMENTADO
Qué funcionalidades pertenecen deliberadamente a la Fase 3 o 4.
NO empieces la Fase 3.
Seguimos. Esta será otra entrega de cierre de la Fase 2, enfocada en detectar fallos que Claude pueda haber dejado en la implementación y dejar el sistema preparado para que la Fase 3 pueda entrar sin rehacer nada.
JC LIFESTYLE — FASE 2
CIERRE TÉCNICO Y CONTROL DE CALIDAD DEL CONSTRUCTOR DE OUTFITS
Continúa desde TODO lo desarrollado anteriormente.
Esta instrucción sigue perteneciendo exclusivamente a:
FASE 2 — CONSTRUCTOR DE OUTFITS
NO empieces todavía la FASE 3.
El objetivo es realizar una última revisión técnica profunda y solucionar cualquier problema real que todavía exista.
 
⸻
 
1. NO SUPONGAS QUE ESTÁ TERMINADO
Aunque la interfaz parezca funcionar, revisa el código y la arquitectura.
Busca activamente:
* errores;
* estados inconsistentes;
* relaciones incorrectas;
* datos duplicados;
* problemas de persistencia;
* problemas de autenticación;
* problemas de permisos;
* errores de navegación;
* problemas de responsive;
* consultas innecesarias;
* componentes duplicados;
* código muerto;
* errores de TypeScript;
* errores de consola;
* errores de Supabase.
Si encuentras un problema, corrígelo.
No te limites a describirlo.
 
⸻
 
2. INTEGRIDAD ENTRE PRENDAS Y OUTFITS
Comprueba que exista una relación real:
PRENDA
   ↑
OUTFIT_ITEM
   ↓
OUTFIT
Un Outfit no debe almacenar una copia independiente de todos los datos de la prenda.
Debe referenciar la prenda.
Esto permitirá que posteriormente el sistema sepa exactamente qué prendas se utilizaron en cada Outfit.
 
⸻
 
3. CAMBIOS EN PRENDAS
Realiza esta prueba:
1. Crear una prenda.
2. Utilizarla en un Outfit.
3. Cambiar el nombre de la prenda.
4. Cambiar su fotografía.
5. Volver al Outfit.
El Outfit debe mostrar correctamente la información actualizada de la prenda.
No debe existir una copia antigua.
 
⸻
 
4. ELIMINACIÓN DE PRENDAS
Prueba qué sucede cuando una prenda que pertenece a un Outfit se elimina.
La aplicación debe manejarlo de forma segura.
No permitir:
* referencias rotas;
* errores de renderizado;
* Outfits imposibles de abrir;
* consultas fallidas.
Si la arquitectura elegida conserva una referencia histórica, mostrar claramente que esa prenda ya no está disponible.
Si se opta por impedir la eliminación, mostrar una explicación clara al usuario.
Elige la solución más coherente con el sistema y aplícala realmente.
 
⸻
 
5. OUTFITS SIN PRENDAS
Comprueba qué ocurre si un Outfit se queda sin prendas.
Debe poder manejarse correctamente.
No debe aparecer:
* error;
* pantalla rota;
* composición vacía sin explicación.
Mostrar un estado adecuado como:
Este Outfit todavía no tiene prendas.
con:
Añadir prendas
 
⸻
 
6. PRENDAS NO DISPONIBLES
Si una prenda está marcada como:
* En lavandería;
* En reparación;
* No disponible;
el sistema debe poder identificar su estado.
NO desarrolles todavía un algoritmo de recomendaciones.
Pero deja la información disponible para que la Fase 4 pueda evitar recomendar posteriormente una prenda no disponible.
 
⸻
 
7. OUTFIT DUPLICADO
Revisa que duplicar un Outfit:
* cree un nuevo ID;
* conserve las relaciones con las prendas;
* no duplique las prendas;
* no modifique el Outfit original;
* no copie incorrectamente futuras estadísticas de uso.
IMPORTANTE:
Un Outfit duplicado debe comenzar como una entidad nueva.
No debe heredar un supuesto historial de utilización que todavía no le corresponde.
 
⸻
 
8. FUTURO HISTORIAL
Si existen campos como:
lastUsedAt
usageCount
no deben manipularse artificialmente durante esta fase.
La utilización real de un Outfit pertenecerá a la Fase 3.
Si estos campos todavía no son necesarios, no inventes datos.
 
⸻
 
9. DATOS DE LUGAR Y PERSONAS
Revisa los campos:
* lugar;
* personas;
* ocasión;
* temporada.
Deben almacenarse de manera estructurada y coherente.
Especialmente:
personas
No crear todavía un sistema social.
Pero no guardarlo de una manera que haga imposible consultar posteriormente:
“¿Qué Outfit utilicé con esta persona?”
 
⸻
 
10. MODELO PREPARADO PARA EVENTOS
Dejar preparado conceptualmente:
OUTFIT
   ↓
USO
   ↓
EVENTO
No desarrollar eventos todavía.
La Fase 3 podrá utilizar esta información para el calendario.
 
⸻
 
11. EXPERIENCIA DE CREACIÓN
Analiza si el flujo actual puede hacerse todavía más rápido.
El flujo ideal debe ser:
+ Crear Outfit
↓
Nombre
↓
Seleccionar prendas
↓
Guardar
No obligar a completar información secundaria.
Todo lo demás debe ser opcional.
 
⸻
 
12. AUTOGUARDADO Y CANCELACIÓN
Comprueba qué ocurre si el usuario:
* empieza a crear un Outfit;
* selecciona varias prendas;
* pulsa atrás;
* cierra el modal;
* cambia de sección.
No deben guardarse datos incompletos accidentalmente.
Si existen cambios sin guardar, proporcionar una salida segura.
 
⸻
 
13. FEEDBACK
Cada acción importante debe tener feedback:
* Outfit creado;
* Outfit actualizado;
* Outfit duplicado;
* Outfit eliminado;
* error al guardar;
* error de conexión.
Utilizar el sistema visual existente de JC Lifestyle.
No llenar la pantalla de avisos.
 
⸻
 
14. ESTADOS DE CARGA
Evita que durante una consulta aparezcan:
* tarjetas vacías;
* botones duplicados;
* datos antiguos;
* pantallas parpadeando.
Implementa estados de carga adecuados.
 
⸻
 
15. OFFLINE / CONEXIÓN
Si JC Lifestyle tiene mecanismos de funcionamiento offline o caché, integra Armario/Outfits con ellos.
Si no existe todavía un sistema offline completo:
NO inventes uno nuevo.
Simplemente asegúrate de que los errores de conexión se gestionen correctamente.
 
⸻
 
16. SEGURIDAD MULTIUSUARIO
Haz una prueba conceptual completa:
USUARIO A
   ↓
Outfit A

USUARIO B
   ↓
Outfit B
A no debe poder:
* leer B;
* editar B;
* eliminar B;
* utilizar accidentalmente prendas de B.
No confiar exclusivamente en el frontend.
Revisar backend/RLS.
 
⸻
 
17. IMÁGENES
Revisa:
* tamaño;
* formato;
* almacenamiento;
* eliminación;
* sustitución;
* permisos.
Cuando se sustituya una imagen de Outfit, evitar dejar archivos innecesarios abandonados si la arquitectura permite limpiarlos de forma segura.
No borrar fotografías de prendas cuando se elimine un Outfit.
 
⸻
 
18. ACCESIBILIDAD
Comprueba:
* botones suficientemente grandes;
* textos legibles;
* contraste;
* estados de selección visibles;
* elementos con etiquetas;
* navegación usable.
Especialmente en móvil.
 
⸻
 
19. COMPATIBILIDAD CON EL DISEÑO ACTUAL
Compara visualmente:
Armario → Prendas
con:
Armario → Outfits
Deben parecer parte del mismo sistema.
No crear una segunda estética.
 
⸻
 
20. PREPARACIÓN PARA LA FASE 3
Antes de terminar, confirma que la arquitectura permite añadir posteriormente:
OUTFIT
   ↓
OUTFIT_USAGE
   ↓
DATE
TIME
LOCATION
PEOPLE
EVENT
NOTES
Cada uso debe ser un registro independiente.
Ejemplo:
Un mismo Outfit puede utilizarse:
1 agosto
5 agosto
12 agosto
20 agosto
No guardar únicamente una fecha.
La Fase 3 necesitará todo el historial.
 
⸻
 
21. PREPARACIÓN PARA LA FASE 4
La futura Fase 4 necesitará poder analizar:
Outfit A
→ utilizado 12 veces

Outfit B
→ utilizado 3 veces

Prenda X
→ utilizada 18 veces

Prenda Y
→ utilizada 2 veces
Y posteriormente calcular:
* días desde último uso;
* frecuencia;
* repetición;
* prendas infrautilizadas;
* combinaciones repetidas;
* diversidad del armario.
No implementes todavía estos cálculos.
Solo asegúrate de que los datos necesarios puedan obtenerse posteriormente.
 
⸻
 
22. LIMPIEZA DEL CÓDIGO
Si durante la implementación has creado:
* componentes duplicados;
* funciones que ya no se utilizan;
* imports innecesarios;
* variables sin utilizar;
* tipos inconsistentes;
limpia todo lo que sea seguro limpiar.
No hagas una refactorización masiva innecesaria.
Prioriza estabilidad.
 
⸻
 
23. ERROR CHECK FINAL
Antes de declarar la fase terminada:
* ejecuta el proyecto;
* revisa consola;
* revisa errores TypeScript;
* revisa errores de compilación;
* revisa consultas;
* revisa errores de autenticación;
* revisa errores de base de datos.
Corrige los problemas reales que encuentres.
 
⸻
 
24. PRUEBA DE USUARIO REAL
Simula este recorrido completo:
ENTRAR EN JC LIFESTYLE
        ↓
GESTIÓN
        ↓
ARMARIO
        ↓
OUTFITS
        ↓
CREAR OUTFIT
        ↓
SELECCIONAR PRENDAS
        ↓
GUARDAR
        ↓
ABRIR OUTFIT
        ↓
EDITAR
        ↓
DUPLICAR
        ↓
MODIFICAR COPIA
        ↓
BUSCAR
        ↓
FILTRAR
        ↓
VOLVER A ABRIR
        ↓
ELIMINAR COPIA
        ↓
COMPROBAR ORIGINAL
Todo debe funcionar.
 
⸻
 
25. CRITERIO DEFINITIVO DE CIERRE
Solo declara:
FASE 2 COMPLETADA
si realmente has verificado que el Constructor de Outfits funciona.
Si encuentras problemas:
corrígelos antes de declarar la fase terminada.
No quiero que simplemente me digas qué habría que corregir.
Quiero que lo corrijas.
 
⸻
 
26. INFORME FINAL
Al acabar, devuelve:
FASE 2 — ESTADO
COMPLETADA / NO COMPLETADA
FUNCIONALIDADES
Lista de funcionalidades realmente implementadas.
BASE DE DATOS
Tablas, relaciones, campos e índices relevantes.
SEGURIDAD
Políticas y aislamiento por usuario.
PRUEBAS
Pruebas realizadas.
ERRORES CORREGIDOS
Problemas encontrados durante esta revisión.
PREPARACIÓN FASE 3
Explica exactamente qué queda preparado para:
CALENDARIO + HISTORIAL DE USO
PORCENTAJE DE FASE 2
Indica el porcentaje real de finalización de la Fase 2.
NO empieces la Fase 3 automáticamente.
Seguimos con la FASE 2. Esta entrega es la última capa de pulido funcional y UX antes de darla por cerrada. Todavía no entramos en la Fase 3.
JC LIFESTYLE — FASE 2
PULIDO FINAL — EXPERIENCIA DE OUTFITS
Continúa exactamente desde el estado actual del proyecto.
Seguimos trabajando EXCLUSIVAMENTE en:
FASE 2 — CONSTRUCTOR DE OUTFITS
NO empieces la FASE 3.
El objetivo de esta entrega es conseguir que el sistema no solo funcione técnicamente, sino que resulte realmente cómodo para utilizar el armario todos los días.
 
⸻
 
1. REVISIÓN DE LA EXPERIENCIA COMPLETA
Utiliza el Constructor de Outfits como si fueras el usuario.
Quiero que analices:
* cuántos clics hacen falta;
* cuánto tarda crear un Outfit;
* si es fácil encontrar una prenda;
* si se entiende qué prendas están seleccionadas;
* si es fácil quitar una prenda;
* si es fácil editar;
* si es fácil duplicar;
* si es fácil volver al Armario.
Si alguna parte resulta innecesariamente complicada, simplifícala.
No añadas pasos solo por añadir funcionalidades.
 
⸻
 
2. SELECTOR DE PRENDAS MEJORADO
El selector de prendas debe ser una de las partes más cómodas de todo el sistema.
Cuando se abra:
Mostrar claramente:
Selecciona las prendas
Y debajo:
* buscador;
* categorías;
* filtros;
* prendas.
Las prendas seleccionadas deben permanecer visibles o ser fácilmente identificables aunque el usuario cambie de categoría o realice una búsqueda.
 
⸻
 
3. CONTADOR DE SELECCIÓN
Mostrar dinámicamente:
5 prendas seleccionadas
o:
1 prenda seleccionada
Esto debe actualizarse instantáneamente.
Añadir una acción:
Ver seleccionadas
para poder revisar rápidamente la selección.
 
⸻
 
4. SELECCIÓN RÁPIDA
Permitir seleccionar una prenda pulsando sobre toda su tarjeta.
No obligar a acertar un pequeño checkbox.
Debe existir un estado visual evidente:
* seleccionada;
* no seleccionada.
Al volver a pulsar:
deseleccionar.
 
⸻
 
5. RESUMEN ANTES DE GUARDAR
Antes de guardar un Outfit, mostrar un pequeño resumen:
Tu Outfit
* prendas seleccionadas;
* nombre;
* fotografía si existe;
* información principal.
Botón:
Guardar Outfit
Esto evita guardar accidentalmente una combinación incorrecta.
 
⸻
 
6. OUTFIT SIN FOTO
Cuando no exista fotografía:
crear una representación visual basada en las fotografías disponibles de las prendas.
Ejemplo:
┌─────────────────┐
│   camiseta      │
│   sudadera      │
│   pantalón      │
│   zapatillas    │
└─────────────────┘
La composición debe ser estética.
Si algunas prendas tienen foto y otras no, utilizar las disponibles.
No crear una imagen artificial compleja si no es necesario.
 
⸻
 
7. ORDEN DE LAS PRENDAS
Dentro de un Outfit, mostrar las prendas agrupadas lógicamente:
Parte superior
Parte inferior
Calzado
Abrigos
Accesorios
Otros
Aunque internamente las prendas puedan almacenarse mediante relaciones independientes.
Esto facilitará posteriormente la lectura del Outfit.
 
⸻
 
8. ACCESO RÁPIDO A EDITAR
Desde la tarjeta del Outfit debe existir una acción clara para:
Editar
No obligar al usuario a entrar en varias pantallas para modificarlo.
 
⸻
 
9. DUPLICAR DESDE TARJETA
Añadir una acción rápida:
Duplicar
si encaja con el diseño existente.
El usuario podrá crear variaciones rápidamente.
Ejemplo:
Outfit verano
↓
Duplicar
↓
Outfit verano 2
↓
Cambiar zapatillas.
 
⸻
 
10. ACCIONES DESTRUCTIVAS
Eliminar debe estar separado visualmente de las acciones normales.
No colocar:
Eliminar
junto a:
Editar
de forma que pueda pulsarse accidentalmente.
Utilizar confirmación.
 
⸻
 
11. FAVORITOS
El favorito debe ser rápido.
Permitir marcar/desmarcar desde:
* tarjeta;
* detalle.
Utilizar una animación ligera.
No hacer una navegación adicional para marcarlo.
 
⸻
 
12. FILTROS PERSISTENTES
Si el usuario está viendo:
Favoritos
y abre un Outfit y vuelve atrás, conservar el contexto cuando tenga sentido.
No reiniciar todos los filtros constantemente.
 
⸻
 
13. BÚSQUEDA INTELIGENTE
La búsqueda debe poder encontrar un Outfit mediante:
* nombre;
* ocasión;
* temporada;
* lugar;
* nombre de una prenda;
* marca de una prenda;
* color de una prenda.
Ejemplo:
Si existe:
Outfit: Cena elegante
con:
Pantalón negro
al buscar:
negro
debe poder aparecer.
 
⸻
 
14. OUTFITS CON PRENDAS NO DISPONIBLES
Si una prenda está:
En lavandería
o:
No disponible
el Outfit debe poder seguir existiendo.
Pero mostrar un indicador discreto:
1 prenda no disponible
Esto será especialmente importante para las futuras recomendaciones.
NO implementar todavía recomendaciones automáticas.
 
⸻
 
15. ESTADÍSTICAS BÁSICAS
No implementar todavía el sistema inteligente de la Fase 4.
Sin embargo, si ya existe información disponible de forma segura, puedes mostrar únicamente información estructural:
* número de prendas;
* número de Outfits;
* favoritos.
NO mostrar todavía:
* frecuencia de uso;
* último uso;
* días sin utilizar.
Eso pertenece a la Fase 3/4.
 
⸻
 
16. RESPONSIVE
Haz una revisión específica de:
iPhone
Debe poder utilizarse con una sola mano siempre que sea razonable.
Tablet
Aprovechar mejor el espacio disponible.
Escritorio
Utilizar una cuadrícula más amplia sin que las tarjetas sean gigantes.
La misma información debe mantenerse en todos los tamaños.
 
⸻
 
17. ANIMACIONES
Añadir únicamente animaciones útiles:
* selección;
* apertura;
* eliminación;
* favorito;
* guardado.
Evitar animaciones constantes que hagan lenta la aplicación.
Priorizar sensación premium y rapidez.
 
⸻
 
18. ACCESIBILIDAD
Comprueba:
* etiquetas de botones;
* contraste;
* tamaño táctil;
* navegación por teclado en escritorio;
* mensajes de error;
* foco;
* lectura de formularios.
No sacrificar accesibilidad por diseño.
 
⸻
 
19. MANEJO DE ERRORES
Si falla el guardado:
mostrar algo como:
No hemos podido guardar el Outfit. Comprueba tu conexión e inténtalo de nuevo.
No perder silenciosamente las prendas seleccionadas.
Si es técnicamente posible, conservar temporalmente el estado del formulario hasta que el usuario decida salir.
 
⸻
 
20. CONFIRMACIÓN DE GUARDADO
Después de guardar correctamente:
mostrar feedback breve:
Outfit guardado ✓
y llevar al usuario al Outfit creado o cerrar el flujo de forma coherente con el diseño.
No utilizar alertas invasivas del navegador si existe un sistema de notificaciones propio.
 
⸻
 
21. DATOS
Comprueba nuevamente:
* user_id;
* outfit_id;
* garment_id;
* relaciones;
* timestamps.
No debe existir ninguna relación que permita mezclar información entre usuarios.
 
⸻
 
22. NO DUPLICAR PRENDAS
Este punto es crítico.
Si el usuario utiliza:
Vaquero gris
en:
* Outfit A;
* Outfit B;
* Outfit C;
debe existir:
1 sola prenda
y:
3 relaciones Outfit → Prenda.
No crear tres copias.
 
⸻
 
23. PREPARACIÓN PARA EL CALENDARIO
No desarrolles todavía el calendario.
Pero verifica que un futuro registro pueda identificar inequívocamente:
usuario
outfit
fecha
hora
lugar
personas
evento
Esto será la base de la Fase 3.
 
⸻
 
24. PREPARACIÓN PARA LA REPETICIÓN
No implementes todavía el algoritmo.
Pero conserva correctamente las relaciones:
OUTFIT
   ↓
PRENDAS
y posteriormente:
OUTFIT
   ↓
HISTORIAL DE USO
   ↓
FECHAS
Esto permitirá posteriormente analizar tanto la repetición del Outfit completo como la repetición de prendas individuales.
 
⸻
 
25. PRUEBA FINAL DE EXPERIENCIA
Haz esta prueba:
ESCENARIO
El usuario tiene:
100 prendas
y:
20 Outfits
Debe poder:
1. Entrar en Outfits.
2. Buscar una prenda.
3. Crear un Outfit.
4. Seleccionar rápidamente 6 prendas.
5. Guardarlo.
6. Abrirlo.
7. Duplicarlo.
8. Cambiar una prenda.
9. Guardarlo.
10. Buscarlo.
11. Marcarlo favorito.
12. Filtrar favoritos.
13. Abrirlo.
14. Volver al Armario.
Todo debe resultar fluido.
 
⸻
 
26. OPTIMIZACIÓN FINAL
Si encuentras cualquier parte innecesariamente complicada:
mejórala.
Pero no hagas cambios arquitectónicos grandes que puedan poner en riesgo lo ya desarrollado.
La estabilidad tiene prioridad.
 
⸻
 
27. CRITERIO DE FINALIZACIÓN
Cuando hayas terminado:
* no debe haber errores conocidos importantes;
* crear Outfit debe funcionar;
* editar debe funcionar;
* duplicar debe funcionar;
* eliminar debe funcionar;
* búsqueda debe funcionar;
* filtros deben funcionar;
* favoritos deben funcionar;
* relaciones con prendas deben funcionar;
* persistencia debe funcionar;
* seguridad debe funcionar;
* móvil debe funcionar.
 
⸻
 
28. INFORME
Devuelve:
FASE 2
Porcentaje real de finalización: XX%
IMPLEMENTADO
Resumen de todo.
MEJORAS REALIZADAS
Qué has mejorado en esta revisión.
PRUEBAS
Qué has probado.
PROBLEMAS
Qué problemas encontraste y corregiste.
PREPARACIÓN FASE 3
Qué queda preparado para:
CALENDARIO + HISTORIAL DE USO
BLOQUEOS
Si existe algún problema que impida considerar la Fase 2 terminada, indícalo claramente.
NO empieces la Fase 3.

Perfecto. Vamos con la FASE 1 — ARMARIO DIGITAL. Esta primera fase la planteo para que Claude construya la base completa y funcional del armario, dejando preparada la estructura para las fases 2, 3 y 4.
Te doy una única prompt completa. Si Claude no puede ejecutarla entera por extensión, entonces la continuaremos por entregas sin cambiar la arquitectura.
PROMPT 1 — JC LIFESTYLE · FASE 1 — ARMARIO DIGITAL
CONTEXTO
Estamos desarrollando JC Lifestyle, un sistema operativo personal web/PWA diseñado para centralizar diferentes áreas de la vida del usuario.
Quiero añadir una nueva funcionalidad dentro de:
Gestión → Armario
Esta es la FASE 1 de 4 del nuevo sistema de armario.
Las 4 fases globales serán:
1. Armario digital
2. Constructor de Outfits
3. Calendario + historial de uso
4. Sistema inteligente anti-repetición + estadísticas
En esta fase NO desarrolles todavía el constructor completo de Outfits, el calendario ni el sistema inteligente. Sin embargo, debes diseñar la arquitectura de datos y componentes de forma que esas fases puedan añadirse posteriormente sin tener que rehacer el sistema.
 
⸻
 
OBJETIVO DE ESTA FASE
Crear un armario digital completo, visual, rápido y premium donde el usuario pueda introducir todas sus prendas y posteriormente utilizarlas para crear Outfits.
La aplicación no debe sentirse como una simple tabla de productos.
Debe sentirse como un armario personal digital integrado dentro de JC Lifestyle.
 
⸻
 
1. ACCESO
Crear una nueva sección:
Gestión → Armario
Debe integrarse con la navegación y diseño actual de JC Lifestyle.
No crear una aplicación independiente.
Mantener:
* diseño premium;
* modo oscuro;
* sistema de colores existente;
* tipografías;
* iconografía;
* animaciones;
* espaciados;
* componentes reutilizables;
* responsive design;
* experiencia móvil prioritaria.
La interfaz debe funcionar perfectamente en iPhone y Android.
 
⸻
 
2. PANTALLA PRINCIPAL DEL ARMARIO
Al entrar en Armario mostrar:
Cabecera
Título:
Mi Armario
Subtítulo:
Todo tu estilo, organizado en un solo lugar.
En la parte superior:
* buscador;
* botón para añadir prenda;
* filtros;
* contador total de prendas.
Ejemplo:
87 prendas
 
⸻
 
3. CATEGORÍAS
Crear categorías iniciales:
* Camisetas
* Camisas
* Polos
* Sudaderas
* Jerséis
* Chaquetas
* Abrigos
* Pantalones
* Shorts
* Chándal
* Zapatillas
* Zapatos
* Accesorios
* Otros
Las categorías deben poder ampliarse en el futuro.
No diseñar la arquitectura de forma que estas categorías queden rígidamente bloqueadas.
 
⸻
 
4. AÑADIR PRENDA
Crear un flujo claro:
+ Añadir prenda
Formulario:
Información básica
Nombre Ejemplo:
Vaquero gris
El nombre debe poder editarse posteriormente.
Categoría
Selector de categoría.
Subcategoría
Dejar preparada la arquitectura para poder añadir subcategorías posteriormente.
Color
Permitir seleccionar/escribir color.
Ejemplos:
* Negro
* Blanco
* Gris
* Azul
* Rojo
* Verde
* Beige
* Marrón
* Otro
Marca
Campo opcional.
Talla
Campo opcional.
Foto
La foto debe ser opcional.
El usuario debe poder:
* añadir foto;
* hacer foto desde el móvil cuando el navegador lo permita;
* seleccionar una imagen;
* continuar sin fotografía.
IMPORTANTE:
No obligar al usuario a fotografiar sus prendas.
El armario debe funcionar perfectamente aunque no haya ninguna fotografía.
 
⸻
 
5. INFORMACIÓN ADICIONAL
Dejar preparada la estructura para:
* temporada;
* material;
* color secundario;
* notas;
* precio;
* fecha de adquisición;
* estado de la prenda.
Estos campos pueden ser opcionales.
No sobrecargar visualmente el formulario.
La prioridad es que añadir una prenda sea extremadamente rápido.
 
⸻
 
6. TARJETA DE PRENDA
Cada prenda debe visualizarse mediante una tarjeta moderna.
Si tiene fotografía:
mostrar la fotografía.
Si no tiene fotografía:
mostrar una representación visual elegante basada en:
* categoría;
* color;
* icono.
Nunca dejar un enorme espacio vacío por no tener imagen.
La tarjeta debe mostrar como mínimo:
Nombre
Categoría
Color
Y permitir acceder a sus detalles.
 
⸻
 
7. DETALLE DE PRENDA
Al pulsar una prenda abrir una vista/modal/página de detalle.
Mostrar:
* fotografía;
* nombre;
* categoría;
* color;
* marca;
* talla;
* notas;
* estado;
* resto de información disponible.
Acciones:
Editar
Eliminar
La eliminación debe tener confirmación.
 
⸻
 
8. EDICIÓN
Todas las prendas deben poder modificarse posteriormente.
El usuario debe poder cambiar:
* nombre;
* categoría;
* color;
* marca;
* talla;
* fotografía;
* información adicional.
Los cambios deben guardarse correctamente.
 
⸻
 
9. BÚSQUEDA
Implementar búsqueda instantánea.
Ejemplos:
Si escribo:
gris
debe encontrar prendas cuyo nombre, color, categoría o información relevante coincida.
Si escribo:
Nike
debe encontrar prendas de Nike.
No hacer una búsqueda únicamente por nombre.
 
⸻
 
10. FILTROS
Crear filtros por:
* categoría;
* color;
* marca;
* temporada;
* estado.
Los filtros deben poder combinarse.
Ejemplo:
Pantalones + Gris + Nike
 
⸻
 
11. ORDENACIÓN
Preparar diferentes formas de ordenar:
* más recientes;
* más antiguos;
* nombre A-Z;
* nombre Z-A;
* categoría.
Además, dejar preparada la arquitectura para añadir posteriormente:
* más utilizados;
* menos utilizados;
* usados recientemente;
* tiempo desde último uso.
Estas últimas opciones pertenecen a las fases 3 y 4 y NO deben implementarse todavía salvo que sea necesario dejar el campo preparado.
 
⸻
 
12. FAVORITOS
Preparar la estructura para que una prenda pueda marcarse como:
Favorita
No es necesario desarrollar todavía un sistema avanzado de favoritos, pero el modelo de datos debe poder soportarlo.
 
⸻
 
13. ESTADOS DE LAS PRENDAS
Preparar estados:
* Disponible
* En lavandería
* En reparación
* Guardada
* No disponible
Esto será importante para el futuro sistema de Outfits.
 
⸻
 
14. ARQUITECTURA DE DATOS
Crear una estructura de datos sólida.
Cada prenda debería disponer de un identificador único.
Ejemplo conceptual:
id
name
category
subcategory
color
secondaryColor
brand
size
image
season
material
notes
price
purchaseDate
status
favorite
createdAt
updatedAt
IMPORTANTE:
Añadir desde esta fase los campos necesarios para que en futuras fases podamos relacionar una prenda con:
* Outfits;
* fechas de utilización;
* lugares;
* personas;
* historial;
* frecuencia de uso.
No implementar todavía toda esa lógica, pero no diseñar una estructura que obligue a rehacer las prendas posteriormente.
 
⸻
 
15. FUTURO SISTEMA DE USO
Preparar conceptualmente el modelo para poder responder posteriormente a:
¿Cuándo utilicé esta prenda por última vez?
¿Cuántas veces la he utilizado?
¿Con qué Outfits la he utilizado?
¿Con qué personas?
¿En qué lugares?
¿Cuánto tiempo lleva sin utilizarse?
En esta fase solamente debe quedar correctamente preparada la arquitectura.
 
⸻
 
16. EXPERIENCIA DE AÑADIR PRENDAS
Esta parte es MUY IMPORTANTE.
Añadir ropa debe ser rápido.
No quiero que el usuario tenga que rellenar 15 campos cada vez que añade una camiseta.
Por defecto mostrar únicamente:
* Nombre
* Categoría
* Color
* Foto opcional
Y un apartado:
Más información
que permita desplegar el resto.
Objetivo:
añadir una prenda en pocos segundos.
 
⸻
 
17. DISEÑO VISUAL
El diseño debe seguir el lenguaje visual existente de JC Lifestyle.
Debe sentirse:
* premium;
* limpio;
* moderno;
* minimalista;
* masculino/elegante;
* tecnológico;
* rápido.
Evitar:
* tablas aburridas;
* formularios gigantes;
* exceso de texto;
* botones innecesarios;
* pantallas saturadas.
La fotografía debe tener bastante protagonismo cuando exista.
 
⸻
 
18. MÓVIL
Diseñar pensando primero en móvil.
Debe ser cómodo:
* pulsar;
* deslizar;
* buscar;
* filtrar;
* añadir prendas;
* editar prendas;
* navegar por categorías.
El botón de añadir debe ser fácilmente accesible.
 
⸻
 
19. DATOS VACÍOS
Si el usuario todavía no tiene prendas, mostrar una pantalla atractiva.
Ejemplo conceptual:
Tu armario está esperando.
Añade tu primera prenda y empieza a construir tu armario digital.
Botón:
+ Añadir primera prenda
No mostrar una pantalla vacía sin explicación.
 
⸻
 
20. RENDIMIENTO
El sistema debe estar preparado para cientos de prendas.
No asumir que el usuario tendrá únicamente 20 o 30 prendas.
Evitar renders innecesarios.
Optimizar imágenes cuando sea posible.
No cargar imágenes gigantes sin necesidad.
 
⸻
 
21. PERSISTENCIA
Los datos deben persistir correctamente utilizando la arquitectura/backend actual de JC Lifestyle.
NO crear una segunda base de datos independiente.
NO duplicar sistemas de almacenamiento.
Si el proyecto ya utiliza Supabase, utilizar la estructura existente.
Si existe autenticación, cada usuario debe ver únicamente su propio armario.
Nunca mezclar datos entre usuarios.
 
⸻
 
22. SEGURIDAD
Las prendas pertenecen al usuario.
Aplicar las mismas reglas de seguridad existentes en JC Lifestyle.
Si se utiliza Supabase:
* aplicar Row Level Security;
* relacionar cada prenda con el usuario correspondiente;
* impedir acceso a prendas de otros usuarios.
No almacenar datos sensibles innecesarios.
 
⸻
 
23. COMPATIBILIDAD CON FUTURAS FASES
Esta es una condición fundamental.
NO crear una implementación rápida que después haya que tirar.
La arquitectura debe permitir posteriormente:
FASE 2
Outfits.
FASE 3
Calendario + historial.
FASE 4
Sistema inteligente anti-repetición.
La relación conceptual debe ser:
USUARIO
   ↓
ARMARIO
   ↓
PRENDAS
   ↓
OUTFITS
   ↓
USO
   ↓
CALENDARIO / HISTORIAL
   ↓
ANÁLISIS INTELIGENTE
 
⸻
 
24. NO IMPLEMENTAR TODAVÍA
En esta fase NO desarrollar completamente:
* constructor de Outfits;
* calendario;
* recomendaciones;
* sistema anti-repetición;
* estadísticas avanzadas;
* algoritmo de frecuencia;
* avisos inteligentes.
Solo preparar la arquitectura necesaria para que puedan añadirse después.
 
⸻
 
25. CALIDAD
Antes de considerar esta fase terminada, comprueba:
* añadir prenda;
* editar prenda;
* eliminar prenda;
* subir fotografía;
* añadir prenda sin fotografía;
* buscar;
* filtrar;
* ordenar;
* cambiar categorías;
* persistencia;
* responsive;
* modo oscuro;
* navegación;
* estados vacíos;
* errores;
* carga;
* seguridad.
No me entregues una demo visual sin funcionalidad real.
Todo lo implementado debe funcionar realmente.
 
⸻
 
26. REGLA FUNDAMENTAL
No rompas ninguna funcionalidad existente de JC Lifestyle.
Antes de modificar código:
1. analiza la arquitectura actual;
2. identifica cómo está implementada la navegación;
3. identifica el sistema de datos;
4. identifica los componentes reutilizables;
5. identifica el sistema de autenticación;
6. identifica el sistema de estilos;
7. integra Armario siguiendo esos sistemas.
No reemplaces sistemas existentes simplemente para facilitar esta funcionalidad.
 
⸻
 
27. ENTREGA
Cuando termines esta fase:
1. implementa la funcionalidad completa;
2. revisa que no haya errores;
3. comprueba que los datos persisten;
4. comprueba móvil;
5. comprueba escritorio;
6. comprueba modo oscuro;
7. comprueba que no has roto funcionalidades existentes.
Después proporciona un resumen:
IMPLEMENTADO
Qué has creado.
ARCHIVOS MODIFICADOS
Qué archivos has tocado.
BASE DE DATOS
Qué tablas/campos has creado o modificado.
SEGURIDAD
Qué medidas has aplicado.
PRUEBAS
Qué has comprobado.
PENDIENTE PARA FASE 2
Qué queda preparado pero todavía no implementado.
NO empieces la FASE 2.
La FASE 2 comenzará únicamente cuando yo te lo indique.
CRITERIO DE FINALIZACIÓN
La FASE 1 solo se considera terminada cuando exista un Armario Digital funcional y realmente integrado en JC Lifestyle, no simplemente una maqueta.
Prioriza siempre:
funcionalidad real → arquitectura sólida → UX → diseño visual.

Sí. Lo mejor es darle a Claude un único prompt maestro, dejando claro que debe ejecutar las fases una por una, que no se adelante y que cada vez que le digas “SIGUE” continúe exactamente donde terminó.
