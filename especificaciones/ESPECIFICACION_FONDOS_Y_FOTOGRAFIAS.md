> **Nota de procedencia:** transcripción íntegra y sin resumir del bloque «FONDOS Y FOTOGRAFÍAS (Aspecto) — 12 fases» del documento
> `JC_FITNESS___ESTILO_DE_HOMBRE.txt` que Josué pegó en el chat (líneas 19528–25494 del original completo,
> conservado sin tocar en `ORIGINAL_JC_FITNESS_ESTILO_DE_HOMBRE.txt`).
>
> **No editar ni resumir este contenido.** Si Josué amplía o corrige el texto, añadir lo nuevo o
> sustituir el apartado afectado, nunca recortar apartados existentes. El análisis y las conclusiones
> van en `docs/`, nunca aquí.
>
> ⚠️ **El documento original está en orden inverso** dentro de cada módulo (la última fase aparece
> primero) y contiene fragmentos de conversación intercalados. Eso es intencionado y se conserva.

---

FASE 12 DE 12 — ELIMINADOS RECIENTEMENTE, RECUPERACIÓN Y CIERRE DEL SISTEMA

Esta es la última fase. Aquí terminamos el sistema de Fotos Fondo asegurando que el usuario pueda eliminar, recuperar y gestionar sus configuraciones sin miedo a perderlas.

1. OBJETIVO

Crear un sistema completo de:

* eliminación;
* papelera;
* recuperación;
* eliminación definitiva;
* restauración;
* protección contra errores.

Debe funcionar con:

* fotografías;
* presets;
* configuraciones de apariencia;
* fondos personalizados.

La filosofía es:

Nada importante debería desaparecer accidentalmente.

⸻

2. «ELIMINADOS RECIENTEMENTE»

Dentro de:

Ajustes → Eliminados recientemente

crear un apartado específico para todos los elementos eliminados relacionados con la personalización.

Debe mostrar:

* fotografías eliminadas;
* presets eliminados;
* configuraciones eliminadas.

⸻

3. INFORMACIÓN DEL ELEMENTO

Cada elemento eliminado debe mostrar:

* nombre;
* miniatura;
* tipo;
* fecha de eliminación;
* información básica.

Ejemplo:

Mi fondo azul

📷 Fotografía

Eliminado hace 2 días

⸻

4. RECUPERAR

Cada elemento debe disponer de:

↩️ Recuperar

Al recuperarlo:

* vuelve a su ubicación anterior;
* conserva su configuración;
* conserva sus colores;
* conserva sus ajustes fotográficos;
* conserva su relación con el preset cuando corresponda.

⸻

5. ELIMINAR DEFINITIVAMENTE

También debe existir:

Eliminar definitivamente

Esta acción sí debe ser irreversible.

Antes de ejecutarla:

¿Eliminar definitivamente este elemento?

Cancelar

Eliminar

⸻

6. VACIAR ELIMINADOS RECIENTEMENTE

Añadir:

Vaciar eliminados recientemente

Debe requerir confirmación.

Ejemplo:

Se eliminarán definitivamente todos los elementos de Eliminados recientemente. Esta acción no se puede deshacer.

⸻

7. TIEMPO DE RETENCIÓN

Establecer un periodo de retención razonable para los elementos eliminados.

Por ejemplo:

30 días

Durante ese periodo:

Eliminar → Papelera → Recuperar

Después:

Eliminación definitiva automática

La duración debe poder cambiarse posteriormente si el sistema lo requiere.

⸻

8. NO ELIMINAR EL FONDO ACTIVO ACCIDENTALMENTE

Si una fotografía está siendo utilizada actualmente como fondo:

Eliminar fotografía

debe gestionarse correctamente.

Opciones:

* impedir temporalmente la eliminación;
* sustituir el fondo por el predeterminado;
* conservar internamente el recurso hasta que deje de utilizarse.

Nunca dejar:

Fondo roto / imagen inexistente.

⸻

9. PRESETS QUE UTILIZAN FOTOGRAFÍAS

Si:

Preset A → utiliza Foto A

y el usuario elimina:

Foto A

el sistema debe detectar la dependencia.

No permitir que el preset quede silenciosamente roto.

Debe gestionar correctamente la relación entre ambos elementos.

⸻

10. RECUPERACIÓN DE DEPENDENCIAS

Si se recupera:

Foto A

el sistema debe poder restaurar también su relación con:

Preset A

cuando corresponda.

No crear duplicados.

⸻

11. ELIMINAR UN PRESET

Eliminar un preset debe eliminar:

el preset

pero NO necesariamente la fotografía que utilizaba.

La fotografía debe seguir existiendo si el usuario la conserva.

Esto es importante porque una fotografía puede ser utilizada por varios presets.

⸻

12. ELIMINAR UNA FOTOGRAFÍA

Eliminar una fotografía no debe eliminar automáticamente todos los presets que la utilizan.

En su lugar:

Foto eliminada

→ detectar presets afectados.

Los presets pueden quedar marcados como:

⚠️ Fondo no disponible

hasta que:

* se recupere la foto;
* se sustituya la fotografía;
* se elimine el preset.

⸻

13. SUSTITUIR FOTOGRAFÍA

Si un preset ha perdido su fotografía:

Cambiar fondo

permitir seleccionar otra imagen.

Los colores y demás configuración del preset deben mantenerse siempre que sea posible.

⸻

14. CONFIRMACIÓN INTELIGENTE

No mostrar confirmaciones constantemente.

Cambiar color

No confirmar.

Cambiar foto

No confirmar.

Eliminar preset

Confirmar si procede.

Eliminar foto

Confirmar si tiene dependencias importantes.

Eliminación definitiva

Siempre confirmar.

Vaciar papelera

Siempre confirmar.

⸻

15. RECUPERAR CONFIGURACIÓN COMPLETA

Cuando se recupere un preset, no recuperar solamente el nombre.

Debe recuperar:

* fotografía;
* zoom;
* posición;
* desenfoque;
* overlay;
* colores;
* botones;
* tarjetas;
* navegación;
* transparencias;
* demás parámetros.

Debe quedar exactamente como estaba cuando se eliminó.

⸻

16. RECUPERACIÓN DE FOTOGRAFÍAS

Al recuperar una fotografía:

Foto recuperada

debe volver a estar disponible inmediatamente para:

* fondos;
* presets;
* editor;
* selector de fotografías.

⸻

17. ESTADOS

Cada elemento debe poder encontrarse en estados claros:

Activo

Guardado

Eliminado recientemente

Eliminado definitivamente

No mezclar estos estados.

⸻

18. PROTECCIÓN CONTRA DUPLICADOS

Al recuperar un elemento cuyo nombre ya existe, no crear accidentalmente conflictos.

Ejemplo:

Gym

eliminado.

Después el usuario crea otro:

Gym

Luego recupera el anterior.

El sistema debe gestionar el conflicto correctamente.

Puede utilizar:

Gym (recuperado)

o permitir al usuario elegir.

⸻

19. SINCRONIZACIÓN FUTURA

La arquitectura debe quedar preparada para que cuando JC Fitness utilice Supabase:

Móvil A

y

Móvil B

puedan mantener sincronizados:

* presets;
* fotografías;
* configuración;
* eliminados recientemente.

Las acciones deben mantener estados coherentes.

⸻

20. SEGURIDAD

Las fotografías personales y configuraciones deben almacenarse de forma segura.

No exponer archivos privados públicamente.

Si se utiliza almacenamiento remoto, aplicar correctamente:

* autenticación;
* permisos;
* políticas de acceso;
* separación por usuario.

⸻

21. COPIAS Y RESTAURACIÓN

No confundir:

Eliminados recientemente

con:

Backup completo.

La papelera sirve para recuperar elementos eliminados.

Los backups son un mecanismo independiente para recuperación ante problemas mayores.

La arquitectura debe permitir incorporar backups posteriormente.

⸻

22. EXPERIENCIA VISUAL

El apartado:

Ajustes → Eliminados recientemente

debe sentirse integrado con JC Fitness.

Debe ser sencillo.

Ejemplo:

Eliminados recientemente

📷 Foto Gym
Eliminado hace 3 días
Recuperar

🎨 Mi tema azul
Eliminado hace 7 días
Recuperar

⸻

23. ELEMENTOS VACÍOS

Si no existe ningún elemento eliminado:

Mostrar:

✨ No hay elementos eliminados

No mostrar una pantalla rota o vacía.

⸻

24. CIERRE DEL SISTEMA

Al terminar esta fase debe revisarse el flujo completo:

Galería
↓
Elegir fotografía
↓
Editar
↓
Analizar colores
↓
Recomendado
↓
Elegir combinación
↓
Personalizar
↓
Comprobar legibilidad
↓
Guardar preset
↓
Aplicar
↓
Editar posteriormente
↓
Eliminar
↓
Eliminados recientemente
↓
Recuperar

Todo debe funcionar como un único sistema.

⸻

25. PRUEBA FINAL OBLIGATORIA

Claude debe realizar una prueba completa del sistema.

PRUEBA 1

Seleccionar fotografía.

PRUEBA 2

Editar zoom y posición.

PRUEBA 3

Analizar colores.

PRUEBA 4

Generar recomendaciones.

PRUEBA 5

Aplicar una recomendación.

PRUEBA 6

Modificar manualmente colores.

PRUEBA 7

Guardar como preset.

PRUEBA 8

Cambiar a otro preset.

PRUEBA 9

Volver al anterior.

PRUEBA 10

Eliminar el preset.

PRUEBA 11

Recuperarlo.

PRUEBA 12

Comprobar que mantiene exactamente su configuración.

PRUEBA 13

Eliminar una fotografía utilizada por un preset.

PRUEBA 14

Comprobar que el sistema detecta la dependencia.

PRUEBA 15

Recuperar la fotografía.

PRUEBA 16

Comprobar que el preset vuelve a funcionar.

⸻

26. CRITERIOS DE FINALIZACIÓN

La FASE 12 está terminada cuando:

* Existe «Eliminados recientemente».
* Se pueden eliminar fotografías.
* Se pueden eliminar presets.
* Se pueden recuperar.
* Se pueden eliminar definitivamente.
* Existe vaciado de papelera.
* Existe protección contra eliminaciones accidentales.
* Se gestionan correctamente las dependencias.
* No se rompen presets cuando falta una fotografía.
* Se pueden recuperar configuraciones completas.
* Se evitan duplicados.
* La estructura está preparada para Supabase.
* La información privada está protegida.
* Se ha probado todo el flujo completo.
* No se rompe ninguna función existente.

⸻

27. RESULTADO FINAL DE LAS 12 FASES

Al terminar las 12 fases, Fotos Fondo debe convertirse en un sistema completo de personalización:

📷 GALERÍA
→ elegir cualquier fotografía.

✂️ EDITOR
→ zoom, posición, blur, overlay, etc.

🎨 DETECTOR
→ analiza sus colores.

✨ RECOMENDADO
→ propone combinaciones.

🎨 PERSONALIZAR
→ libertad manual absoluta.

💾 PRESETS
→ guardar configuraciones.

🛡️ LEGIBILIDAD
→ detectar problemas y ayudar.

⚡ OPTIMIZACIÓN
→ todo rápido y fluido.

🗑️ ELIMINADOS RECIENTEMENTE
→ recuperar lo borrado.

Y, sobre todo:

El usuario puede hacer que JC Fitness tenga prácticamente el aspecto que quiera sin perder la facilidad de uso.

FASES COMPLETADAS: 12/12 — 100%
Sí. Te hago una prompt maestra de contexto para pasarle primero a Claude. Después podrás enviarle simplemente «FASE 1», «FASE 2», etc., y ya tendrá claro el proyecto, el objetivo y las 12 fases.
PROMPT MAESTRA — SISTEMA «FOTOS FONDO» | JC FITNESS

Quiero desarrollar e integrar en JC Fitness un sistema avanzado de personalización visual llamado «Fotos Fondo».

IMPORTANTE:
Este documento NO es para que ejecutes las 12 fases de golpe.

Primero debes leer y comprender TODO este contexto.

Después, yo te iré pasando cada fase individualmente:
«FASE 1»
«FASE 2»
«FASE 3»
...
«FASE 12»

Cuando te pase una fase, debes ejecutar ÚNICAMENTE esa fase, respetando todo lo definido en este documento y sin adelantarte a fases posteriores.

Si una fase necesita utilizar estructuras creadas en fases anteriores, debes integrarse con ellas correctamente.

NO elimines funcionalidades existentes de JC Fitness.
NO rompas módulos existentes.
NO sustituyas funcionalidades simplemente porque sea más fácil.
NO inventes comportamientos que contradigan este documento.

==================================================
OBJETIVO GENERAL
==================================================

Quiero transformar el apartado:

AJUSTES → ASPECTO

en un sistema de personalización visual extremadamente completo.

La idea principal es permitir que cada usuario pueda conseguir que JC Fitness tenga prácticamente el aspecto que quiera.

Debe existir una combinación entre:

- libertad manual;
- personalización mediante fotografías;
- detección inteligente de colores;
- recomendaciones automáticas;
- presets;
- control avanzado;
- legibilidad;
- rendimiento;
- recuperación de elementos eliminados.

La filosofía general es:

«La aplicación recomienda, pero el usuario decide.»

El usuario debe tener una libertad enorme.

==================================================
FLUJO GENERAL
==================================================

El sistema completo debe permitir:

FOTO
↓
GALERÍA
↓
EDITOR DE FOTO
↓
ANÁLISIS DE COLORES
↓
RECOMENDADO
↓
VARIAS PROPUESTAS
↓
PREVISUALIZAR
↓
APLICAR
↓
PERSONALIZAR MANUALMENTE
↓
COMPROBAR LEGIBILIDAD
↓
GUARDAR COMO PRESET
↓
CAMBIAR ENTRE PRESETS
↓
ELIMINAR
↓
ELIMINADOS RECIENTEMENTE
↓
RECUPERAR

Pero el usuario NO está obligado a seguir este flujo.

También debe poder hacer:

FOTO
↓
PERSONALIZAR MANUALMENTE

o:

PREDTERMINADO
↓
PERSONALIZAR

o:

PRESET
↓
EDITAR

==================================================
PRINCIPIO FUNDAMENTAL
==================================================

La personalización automática nunca debe quitar libertad al usuario.

Si JC Fitness recomienda:

AZUL + BLANCO + NARANJA

el usuario debe poder cambiar:

NARANJA → VERDE

y mantenerlo.

El sistema no debe volver automáticamente al naranja.

La IA/recomendación debe ayudar, no imponer.

==================================================
ESTRUCTURA DE LAS 12 FASES
==================================================

FASE 1 — SISTEMA BASE DE FONDOS Y FOTOGRAFÍAS

Crear la base del sistema de fondos personalizados.

Debe permitir:

- elegir una fotografía;
- utilizar una imagen como fondo;
- utilizar una imagen de la galería del dispositivo;
- mantener fondo predeterminado;
- cambiar entre fondo fotográfico y otros tipos de fondo;
- guardar correctamente la selección;
- integrar el fondo con la interfaz actual.

El sistema debe estar preparado para las siguientes fases.

NO implementar todavía todo el sistema inteligente.

--------------------------------------------------

FASE 2 — GALERÍA Y GESTIÓN DE FOTOGRAFÍAS

Crear la experiencia de selección y gestión de fotografías.

Debe permitir:

- acceder a fotografías;
- seleccionar una;
- visualizarla;
- cambiar de fotografía;
- gestionar las imágenes utilizadas como fondo;
- mostrar miniaturas;
- mantener una experiencia móvil excelente.

Debe contemplar fotografías verticales, horizontales y cuadradas.

Preparar la estructura para el editor de la FASE 3.

--------------------------------------------------

FASE 3 — EDITOR DE FOTOGRAFÍAS

Crear el editor visual de la fotografía utilizada como fondo.

Debe permitir controlar, según las posibilidades técnicas:

- zoom;
- posición horizontal;
- posición vertical;
- encuadre;
- desenfoque;
- oscurecimiento;
- luminosidad;
- overlay;
- intensidad del overlay;
- transparencia;
- otros ajustes visuales apropiados.

Debe existir una previsualización en tiempo real.

IMPORTANTE:
Los ajustes de la fotografía deben guardarse independientemente de los colores.

Modificar colores no debe modificar el encuadre.

Modificar el encuadre no debe eliminar los colores.

--------------------------------------------------

FASE 4 — SISTEMA AVANZADO DE COLORES

Crear el sistema para personalizar los colores de JC Fitness.

Debe permitir controlar, cuando corresponda:

- color principal;
- color secundario;
- color de acento;
- botones;
- tarjetas;
- navegación;
- textos;
- iconos;
- superficies;
- bordes;
- transparencias;
- degradados.

Debe mantenerse la posibilidad de utilizar colores predeterminados.

Debe existir selector avanzado con HEX y otros formatos cuando resulte útil.

La arquitectura debe permitir que los colores puedan combinarse posteriormente con los colores detectados de una fotografía.

--------------------------------------------------

FASE 5 — DETECTOR INTELIGENTE DE COLORES

Analizar automáticamente la fotografía seleccionada.

Debe detectar información cromática útil:

- colores dominantes;
- colores secundarios;
- colores claros;
- colores oscuros;
- saturación;
- luminosidad;
- colores neutros;
- colores destacables aunque no sean predominantes;
- información suficiente para crear recomendaciones posteriores.

Debe generar una paleta estructurada.

IMPORTANTE:
Esta fase solamente analiza.

NO debe cambiar automáticamente los colores del usuario.

Debe preparar los datos para la FASE 6.

Debe evitar repetir análisis innecesariamente mediante caché cuando sea posible.

--------------------------------------------------

FASE 6 — SISTEMA «RECOMENDADO»

Convertir el análisis de la FASE 5 en recomendaciones visuales.

Debe existir una opción:

✨ RECOMENDADO

Debe generar varias propuestas diferentes.

No solamente un color.

Cada propuesta puede incluir:

- principal;
- secundario;
- acento;
- botones;
- tarjetas;
- navegación;
- textos;
- iconos;
- superficies;
- overlay;
- transparencias;
- demás parámetros necesarios.

Las propuestas deben tener en cuenta la fotografía.

Deben existir estilos diferentes, por ejemplo:

- equilibrado;
- energético;
- minimalista.

El usuario debe poder:

- previsualizar;
- probar;
- aplicar;
- cancelar;
- generar otras propuestas.

IMPORTANTE:
Recomendado no debe sustituir la personalización manual.

--------------------------------------------------

FASE 7 — PERSONALIZACIÓN MANUAL AVANZADA

Crear un editor completo para modificar cualquier recomendación o configuración.

El usuario debe poder modificar libremente:

- colores;
- botones;
- tarjetas;
- navegación;
- iconos;
- textos;
- transparencias;
- overlays;
- degradados;
- bordes;
- sombras;
- superficies;
- demás elementos visuales compatibles.

Debe existir:

- vista previa;
- aplicar;
- cancelar;
- deshacer;
- rehacer cuando sea viable;
- restablecer.

Si el usuario modifica una recomendación, JC Fitness NO debe sobrescribir sus cambios automáticamente.

La filosofía es:

MÁXIMA LIBERTAD.

--------------------------------------------------

FASE 8 — PRESETS Y CONFIGURACIONES GUARDADAS

Crear un sistema para guardar apariencias completas.

Un preset NO es solamente una paleta.

Debe guardar toda la configuración necesaria:

- fotografía;
- zoom;
- posición;
- blur;
- overlay;
- colores;
- botones;
- tarjetas;
- navegación;
- transparencias;
- degradados;
- sombras;
- demás parámetros visuales.

Debe permitir:

- crear;
- nombrar;
- guardar;
- editar;
- duplicar;
- guardar como nuevo;
- aplicar;
- previsualizar;
- marcar favorito;
- eliminar.

Debe existir diferenciación entre:

- presets oficiales;
- presets del usuario;
- favoritos;
- recientes;
- preset activo.

Los presets oficiales no deben modificarse directamente.

--------------------------------------------------

FASE 9 — LEGIBILIDAD Y CONTRASTE INTELIGENTE

Crear un sistema que compruebe que la personalización siga siendo usable.

Debe analizar:

- texto sobre fotografía;
- texto sobre colores;
- botones;
- tarjetas;
- navegación;
- iconos;
- estados activos;
- superficies.

Debe detectar problemas de contraste y mostrar avisos comprensibles.

Debe poder sugerir:

- cambio de color;
- overlay;
- transparencia;
- fondo;
- contraste;
- otros ajustes.

Puede existir:

🛡️ LEGIBILIDAD AUTOMÁTICA

Pero:

NO debe impedir al usuario utilizar una combinación que él haya elegido.

Debe:

DETECTAR → AVISAR → SUGERIR → AYUDAR.

No convertirse en un «policía del diseño».

También debe integrarse con:

- Recomendado;
- Personalización;
- Presets.

--------------------------------------------------

FASE 10 — INTEGRACIÓN COMPLETA EN ASPECTO

Unificar las fases anteriores dentro de:

AJUSTES → ASPECTO

Debe existir un único centro de personalización.

Estructura conceptual:

APARIENCIA

Fondo
- Foto
- Color
- Degradado
- Predeterminado

Colores
- Paleta actual
- Personalizar

✨ Recomendado

🎨 Personalizar

Presets
- Guardados
- Favoritos
- Oficiales
- Recientes

🛡️ Legibilidad

Modo
- Claro
- Oscuro
- Automático, si corresponde

No mostrar todo abierto al mismo tiempo.

Utilizar una interfaz limpia, móvil y premium.

Debe existir una vista previa global.

Todos los cambios deben reflejarse inmediatamente en toda la aplicación.

Debe existir un sistema central de apariencia para evitar que diferentes pantallas tengan configuraciones diferentes por errores de estado.

--------------------------------------------------

FASE 11 — RENDIMIENTO Y OPTIMIZACIÓN

Optimizar todo el sistema.

Especialmente:

- fotografías grandes;
- miniaturas;
- caché;
- análisis de colores;
- blur;
- overlays;
- transparencias;
- presets;
- renderizado;
- memoria;
- animaciones.

No cargar fotografías enormes innecesariamente.

Cuando sea apropiado utilizar:

ORIGINAL
OPTIMIZADA
MINIATURA

Evitar repetir análisis.

Evitar renders innecesarios.

Debe funcionar correctamente en:

- iPhone;
- Safari;
- PWA;
- Android;
- Chrome;
- escritorio.

Debe soportar situaciones sin conexión para recursos ya disponibles cuando la arquitectura PWA lo permita.

La experiencia debe sentirse:

RÁPIDA + FLUIDA + BONITA + ESTABLE.

--------------------------------------------------

FASE 12 — ELIMINADOS RECIENTEMENTE Y RECUPERACIÓN

Crear:

AJUSTES → ELIMINADOS RECIENTEMENTE

Debe incluir:

- fotografías eliminadas;
- presets eliminados;
- configuraciones eliminadas.

Debe permitir:

- recuperar;
- eliminar definitivamente;
- vaciar papelera.

Los elementos pueden mantenerse durante un periodo razonable, por ejemplo 30 días, antes de la eliminación definitiva.

Debe gestionarse correctamente la relación entre:

FOTOGRAFÍAS
y
PRESETS.

Si un preset utiliza una fotografía que se elimina:

NO romper silenciosamente el preset.

Debe detectarse la dependencia.

Si la fotografía se recupera, debe poder recuperarse su funcionamiento.

Eliminar un preset NO debe eliminar automáticamente la fotografía que utiliza.

Eliminar una fotografía NO debe eliminar automáticamente todos los presets que la utilizan.

--------------------------------------------------
SISTEMA DE SEGURIDAD Y PERSISTENCIA
--------------------------------------------------

Toda configuración debe conservarse correctamente.

La apariencia activa debe sobrevivir a:

- cerrar la aplicación;
- abrirla de nuevo;
- reiniciar el dispositivo;
- actualizar la aplicación.

La arquitectura debe estar preparada para sincronización mediante Supabase.

Las fotografías personales deben almacenarse de manera segura.

No exponer recursos privados públicamente.

--------------------------------------------------
SISTEMA DE ERRORES
--------------------------------------------------

Nunca permitir que una personalización rota deje JC Fitness inutilizable.

Si una imagen no puede cargarse:

→ utilizar fondo predeterminado.

Si un preset tiene una fotografía que ya no existe:

→ marcarlo correctamente.

Si una operación falla:

→ mantener la configuración anterior.

Si una recomendación falla:

→ permitir continuar manualmente.

Nunca dejar:

- pantalla rota;
- fondo inexistente;
- configuración parcialmente aplicada;
- pérdida accidental de datos.

--------------------------------------------------
EXPERIENCIA DE USUARIO
--------------------------------------------------

El sistema debe sentirse PREMIUM.

Debe ser:

- elegante;
- rápido;
- intuitivo;
- visual;
- móvil;
- fluido.

No convertir el apartado Aspecto en una pantalla técnica llena de controles.

La complejidad debe estar organizada mediante:

- tarjetas;
- secciones;
- acordeones;
- hojas inferiores;
- pantallas secundarias.

El usuario nuevo debe poder hacer algo sencillo:

FOTO → RECOMENDADO → APLICAR

Mientras que un usuario avanzado debe poder hacer:

FOTO → EDITAR → COLORES → PERSONALIZAR TODO → GUARDAR PRESET.

--------------------------------------------------
REGLAS ABSOLUTAS
--------------------------------------------------

1. NO romper funcionalidades existentes.

2. NO eliminar módulos actuales.

3. NO implementar las 12 fases de golpe.

4. Ejecutar únicamente la fase que yo indique.

5. Mantener compatibilidad con las fases anteriores.

6. Preparar las estructuras necesarias para fases posteriores sin implementar prematuramente toda su funcionalidad.

7. El usuario siempre debe conservar control manual.

8. Recomendado nunca debe sobrescribir modificaciones manuales.

9. Las fotografías originales no deben modificarse destructivamente.

10. Los presets deben conservar configuraciones completas.

11. Las eliminaciones importantes deben poder recuperarse.

12. La interfaz debe seguir siendo premium y sencilla.

13. Todo debe funcionar correctamente en móvil/PWA.

14. Optimizar antes de introducir efectos innecesariamente pesados.

15. Si existe una funcionalidad ya implementada que puede reutilizarse, reutilizarla en lugar de duplicarla.

16. Si una fase requiere modificar arquitectura existente, hacerlo de forma compatible y segura.

17. Antes de terminar una fase, comprobar que las funcionalidades existentes siguen funcionando.

--------------------------------------------------
RESULTADO FINAL ESPERADO
--------------------------------------------------

Al completar las 12 fases, JC Fitness debe disponer de un sistema de apariencia en el que el usuario pueda:

📷 Elegir cualquier fotografía de su galería.

✂️ Ajustarla como fondo.

🎨 Analizar automáticamente sus colores.

✨ Obtener recomendaciones de combinaciones.

🎨 Modificar absolutamente lo que quiera.

💾 Guardar configuraciones completas.

⭐ Crear favoritos.

🔄 Cambiar rápidamente entre apariencias.

🛡️ Recibir ayuda para mantener una buena legibilidad.

⚡ Utilizar todo el sistema sin perder rendimiento.

🗑️ Eliminar configuraciones.

↩️ Recuperarlas desde «Eliminados recientemente».

Y todo esto debe integrarse de forma natural dentro de:

AJUSTES → ASPECTO

sin perder la estética, velocidad ni funcionalidad del JC Fitness existente.

==================================================
INSTRUCCIÓN FINAL
==================================================

Lee y comprende este documento completo.

NO ejecutes ninguna fase todavía.

Espera a que te indique:

«FASE 1»

o cualquier otra fase.

Cuando te indique una fase, ejecuta únicamente esa fase y realiza una implementación completa, funcional y compatible con todo este contexto.

Cuando una fase termine, no avances automáticamente a la siguiente.

Espera mi siguiente instrucción:
«SIGUE».

Vamos con la FASE 11 de 12. Aquí nos centramos en que todo lo construido hasta ahora no haga que JC Fitness se vuelva pesada, especialmente en iPhone/PWA y cuando el usuario utilice fotografías grandes.

FASE 11 — RENDIMIENTO, OPTIMIZACIÓN Y EXPERIENCIA

1. OBJETIVO

Optimizar todo el sistema de personalización visual desarrollado en las FASES 1–10.

El objetivo es que el usuario pueda utilizar:

* fotografías;
* efectos;
* colores;
* recomendaciones;
* presets;
* transparencias;
* overlays;
* detección de colores;

sin que JC Fitness pierda velocidad o fluidez.

La personalización visual debe mejorar la aplicación, nunca convertirla en una aplicación pesada.

⸻

2. PRINCIPIO FUNDAMENTAL

La aplicación debe diferenciar entre:

Calidad visual

y

coste de rendimiento.

No utilizar una fotografía de resolución gigantesca en cada componente de la aplicación si no es necesario.

Mantener la fotografía original cuando corresponda, pero utilizar versiones optimizadas para mostrarla.

⸻

3. OPTIMIZACIÓN DE FOTOGRAFÍAS

Cuando el usuario seleccione una fotografía:

* detectar sus dimensiones;
* comprobar su tamaño;
* generar una versión adecuada para utilizarla como fondo;
* mantener la original cuando sea necesario.

Evitar cargar innecesariamente una imagen de varios megabytes a máxima resolución.

⸻

4. DIFERENTES VERSIONES DE UNA FOTO

Cuando sea útil, preparar:

Original

Para conservar la fotografía.

Optimizada

Para utilizarla normalmente como fondo.

Miniatura

Para listas de presets y selecciones.

Esto evita utilizar siempre el archivo más pesado.

⸻

5. CARGA DIFERIDA

No cargar todas las fotografías y presets al abrir Aspecto.

Cargar únicamente:

* fondo activo;
* información necesaria;
* elementos visibles.

Las miniaturas y recursos secundarios pueden cargarse cuando sean necesarios.

⸻

6. CACHÉ

Utilizar caché cuando sea apropiado para:

* fotografías;
* miniaturas;
* análisis cromáticos;
* presets;
* configuraciones.

Si una fotografía ya está disponible localmente, no volver a procesarla innecesariamente.

⸻

7. CACHÉ DEL DETECTOR DE COLORES

Si una fotografía ya ha sido analizada:

NO repetir automáticamente el análisis

si la fotografía no ha cambiado.

Utilizar el resultado almacenado.

Solo recalcular cuando sea necesario.

⸻

8. PREVISUALIZACIÓN OPTIMIZADA

El editor de fotografías debe utilizar una representación optimizada durante la edición.

No procesar continuamente la fotografía original a máxima resolución para cada pequeño movimiento.

El objetivo es conseguir:

movimiento fluido → resultado final de calidad.

⸻

9. APLICACIÓN FINAL

Cuando el usuario pulse:

Aplicar

utilizar la configuración definitiva y la calidad apropiada.

No confundir la calidad de la previsualización con la calidad final.

⸻

10. EFECTOS VISUALES

Optimizar especialmente:

* blur;
* overlays;
* transparencias;
* sombras;
* degradados.

No aplicar efectos costosos repetidamente si no es necesario.

⸻

11. ANIMACIONES

Las transiciones deben ser fluidas.

Evitar animaciones excesivamente complejas que provoquen:

* tirones;
* calentamiento;
* consumo elevado;
* pérdida de fluidez.

Priorizar animaciones cortas y sencillas.

⸻

12. RENDERIZADO

Revisar que modificar:

un color

no obligue a recalcular innecesariamente:

* toda la fotografía;
* todos los presets;
* todos los análisis.

Actualizar solamente los componentes afectados cuando sea posible.

⸻

13. ESTADO CENTRALIZADO

Mantener un sistema central de apariencia, pero evitar que cada pequeño cambio provoque renders innecesarios en toda la aplicación.

La arquitectura debe separar correctamente:

* fondo;
* colores;
* fotografía;
* presets;
* preferencias.

⸻

14. APERTURA DE ASPECTO

Al abrir:

Ajustes → Aspecto

la pantalla debe aparecer rápidamente.

No esperar a que se carguen todos los recursos antes de mostrar la interfaz.

Mostrar primero la estructura y cargar recursos progresivamente.

⸻

15. APERTURA DE PRESETS

La lista de presets debe ser ligera.

Utilizar:

* miniaturas;
* información resumida;
* carga progresiva.

No cargar todas las fotografías completas solamente para mostrar una lista.

⸻

16. USO DE MEMORIA

Controlar especialmente el uso de memoria en dispositivos móviles.

Evitar mantener simultáneamente demasiadas fotografías de alta resolución en memoria.

Liberar recursos que ya no sean necesarios.

⸻

17. COMPATIBILIDAD CON IPHONE

Probar específicamente:

* Safari.
* PWA instalada.
* Diferentes tamaños de pantalla.
* Pantallas con notch/Dynamic Island.
* Orientación vertical.
* Cambios de orientación cuando sean compatibles.

El fondo nunca debe invadir incorrectamente las zonas del sistema.

⸻

18. COMPATIBILIDAD CON ANDROID

Comprobar:

* Chrome.
* PWA.
* Diferentes resoluciones.
* Diferentes proporciones.
* Dispositivos de menor potencia.

No asumir que todos los móviles tienen la misma capacidad.

⸻

19. RED

Si existe conexión con Supabase:

No descargar innecesariamente la misma fotografía o configuración varias veces.

Utilizar almacenamiento y sincronización de forma eficiente.

La personalización visual debe seguir siendo razonablemente funcional incluso con una conexión lenta, especialmente para recursos ya almacenados localmente.

⸻

20. FUNCIONAMIENTO OFFLINE

Si JC Fitness ya dispone de comportamiento PWA/offline, el sistema de apariencia debe respetarlo.

Una configuración visual previamente cargada debería continuar funcionando aunque temporalmente no haya conexión.

No depender de una llamada al servidor para mostrar constantemente el fondo.

⸻

21. SEGURIDAD Y VALIDACIÓN

Validar correctamente las imágenes seleccionadas.

No asumir que cualquier archivo seleccionado es válido.

Controlar:

* formato;
* tamaño;
* dimensiones;
* errores de lectura.

Si una imagen no puede utilizarse:

No romper la aplicación.

Mostrar un mensaje claro y permitir seleccionar otra.

⸻

22. LÍMITES RAZONABLES

Establecer límites técnicos cuando sean necesarios para proteger el rendimiento.

Por ejemplo:

* tamaño máximo razonable de imagen;
* número de operaciones simultáneas;
* procesamiento de análisis;
* cantidad de recursos mantenidos en memoria.

Estos límites deben ser suficientemente amplios para no perjudicar la libertad del usuario.

⸻

23. RECUPERACIÓN DE ERRORES

Si una operación falla:

Procesamiento
→ error

La aplicación debe:

* recuperar el estado anterior;
* evitar configuraciones incompletas;
* permitir volver a intentarlo;
* no perder el fondo anterior.

Nunca dejar una configuración parcialmente aplicada.

⸻

24. CAMBIOS RÁPIDOS

Probar situaciones como:

Foto A
→ Foto B
→ Foto C
→ Foto A

rápidamente.

La aplicación debe gestionar correctamente los cambios y evitar que un procesamiento anterior sobrescriba accidentalmente uno más reciente.

⸻

25. CAMBIOS RÁPIDOS DE COLORES

Igualmente:

Azul
→ Rojo
→ Verde
→ Morado

El sistema debe mantenerse fluido y mostrar siempre la configuración actual.

⸻

26. GENERACIÓN DE RECOMENDACIONES

El sistema de Recomendado debe evitar generar demasiados análisis simultáneos.

Si el usuario solicita nuevas propuestas rápidamente:

* cancelar procesos anteriores cuando sea apropiado;
* utilizar resultados existentes;
* evitar duplicación de cálculos.

⸻

27. PERSISTENCIA EFICIENTE

No guardar una nueva copia completa de una fotografía cada vez que el usuario modifica:

Zoom

o:

Color

Guardar referencias y configuraciones de forma eficiente.

Esto evitará duplicar datos innecesariamente.

⸻

28. PRUEBAS

Realizar pruebas con:

Fotografías

* pequeñas;
* grandes;
* verticales;
* horizontales;
* cuadradas;
* muy claras;
* muy oscuras;
* muy coloridas;
* monocromáticas.

Configuraciones

* muchos efectos;
* transparencia alta;
* blur alto;
* varios presets;
* muchos cambios seguidos.

Dispositivos

* iPhone;
* Android;
* escritorio.

⸻

29. PRUEBAS DE REGRESIÓN

Después de optimizar, comprobar que siguen funcionando correctamente:

* Dashboard.
* Sueño.
* Entrenamiento.
* Economía.
* Ajustes.
* Navegación.
* Modo oscuro.
* Modo claro.
* Sistema de colores.
* Fondos.
* Presets.

La optimización no puede romper funcionalidades existentes.

⸻

30. MÉTRICAS

Siempre que la arquitectura lo permita, comprobar:

* tiempo de carga;
* tiempo de aplicación del fondo;
* tiempo de análisis;
* uso de memoria;
* fluidez de animaciones;
* tamaño de recursos.

No convertir estas métricas en una funcionalidad visible para el usuario final.

⸻

31. OBJETIVO DE EXPERIENCIA

El usuario debería percibir:

Selecciono foto → aparece rápido.

Cambio color → cambia inmediatamente.

Muevo la foto → responde al instante.

Pruebo un preset → cambia fluidamente.

Pulso recomendado → no se queda bloqueado.

La tecnología debe quedar prácticamente invisible.

⸻

32. CRITERIOS DE FINALIZACIÓN

La FASE 11 está terminada cuando:

* Las fotografías están optimizadas.
* Existen versiones apropiadas cuando sea necesario.
* Se utilizan miniaturas para listas.
* Existe caché.
* El detector evita análisis repetidos.
* La previsualización es fluida.
* Los efectos están optimizados.
* No existen renders innecesarios evidentes.
* El uso de memoria está controlado.
* Funciona correctamente en iPhone.
* Funciona correctamente en Android.
* Funciona correctamente como PWA.
* Se manejan correctamente errores de imágenes.
* La persistencia es eficiente.
* No se duplican fotografías innecesariamente.
* Los cambios rápidos no provocan estados incorrectos.
* Se han realizado pruebas de regresión.
* No se rompe ninguna funcionalidad existente.

⸻

33. REGLA PARA CLAUDE

No sacrificar la experiencia visual para conseguir rendimiento, ni sacrificar rendimiento para conseguir efectos innecesarios.

La prioridad debe ser:

Rápido + fluido + bonito + estable.

La personalización debe sentirse instantánea incluso cuando el usuario utilice fotografías grandes y configuraciones complejas.

La siguiente y última fase será la FASE 12 — GUARDADO, ELIMINADOS RECIENTEMENTE Y RECUPERACIÓN.
Vamos con la FASE 10 de 12. Aquí ya no añadimos una función aislada: unimos todo lo desarrollado hasta ahora dentro del apartado Aspecto, para que al usuario le parezca un único sistema y no 7 herramientas separadas.

FASE 10 — INTEGRACIÓN COMPLETA EN ASPECTO | JC FITNESS

1. OBJETIVO

Integrar todos los sistemas desarrollados en las FASES 1–9 dentro del apartado Aspecto de JC Fitness.

El resultado debe sentirse como un único centro de personalización visual.

El usuario debe poder entrar en:

Ajustes → Aspecto

y controlar desde un mismo lugar:

* fondo;
* fotografías;
* editor;
* colores;
* recomendaciones;
* personalización manual;
* presets;
* legibilidad;
* modo claro/oscuro.

No crear menús independientes y desconectados.

⸻

2. ESTRUCTURA PRINCIPAL

Rediseñar el apartado Aspecto para que tenga una estructura clara.

Propuesta:

APARIENCIA

Fondo

* Foto.
* Color.
* Degradado.
* Predeterminado.
* Ninguno.

Colores

* Paleta actual.
* Personalizar.

✨ Recomendado

* Generar propuestas.
* Probar.
* Aplicar.

🎨 Personalizar

* Editor completo.

Presets

* Guardados.
* Favoritos.
* Oficiales.
* Recientes.

🛡️ Legibilidad

* Estado.
* Correcciones.
* Configuración automática.

Modo

* Claro.
* Oscuro.
* Automático, si ya existe.

⸻

3. NO SATURAR LA PANTALLA

Aunque existan muchas opciones, no mostrar absolutamente todo al mismo tiempo.

Utilizar:

* tarjetas;
* secciones;
* acordeones;
* menús desplegables;
* pantallas secundarias;
* hojas inferiores en móvil.

La interfaz debe seguir siendo limpia.

⸻

4. FONDO ACTUAL

En la parte superior de Aspecto debe existir una representación clara del aspecto actual.

Mostrar:

Vista previa

y debajo:

Fondo actual

Ejemplo:

📷 Mi fotografía

o:

🎨 Azul JC Fitness

o:

✨ Predeterminado

Esto permite saber inmediatamente qué está activo.

⸻

5. ACCESO RÁPIDO

Desde la vista principal de Aspecto debe ser posible realizar las acciones más habituales rápidamente:

Cambiar fondo

Personalizar colores

Recomendado

Personalizar

Cambiar preset

No obligar al usuario a entrar en cinco menús para realizar una modificación sencilla.

⸻

6. VISTA PREVIA GLOBAL

Crear una vista previa visual representativa de JC Fitness.

Debe mostrar:

* fondo;
* tarjeta;
* botón;
* texto;
* iconos;
* navegación.

La vista previa debe actualizarse cuando cambien los parámetros.

No es necesario mostrar toda la aplicación.

⸻

7. NAVEGACIÓN ENTRE EDITORES

Desde Aspecto:

Fondo → Editar foto

debe llevar directamente al editor de la FASE 3.

Desde:

Colores → Personalizar

debe abrir la personalización de la FASE 7.

Desde:

Recomendado

debe abrir el sistema de la FASE 6.

Desde:

Presets

debe abrir el sistema de la FASE 8.

No duplicar los editores.

⸻

8. FLUJO COMPLETO

Debe ser posible realizar este recorrido sin contradicciones:

Aspecto
↓
Elegir foto
↓
Editar foto
↓
Recomendado
↓
Elegir combinación
↓
Personalizar
↓
Modificar colores
↓
Comprobar legibilidad
↓
Guardar como preset
↓
Aplicar

Todo debe formar parte del mismo sistema.

⸻

9. CAMBIAR DE FONDO SIN PERDER CONFIGURACIONES

Si el usuario cambia:

Foto A → Foto B

no eliminar:

* presets;
* colores guardados;
* configuraciones anteriores.

Simplemente cambia el fondo activo.

Esto permitirá experimentar libremente.

⸻

10. CAMBIAR COLORES SIN CAMBIAR FOTO

Igualmente:

Foto A + Azul

→ cambiar colores

Foto A + Verde

La fotografía y sus ajustes deben mantenerse.

⸻

11. RECOMENDADO COMO OPCIÓN, NO COMO OBLIGACIÓN

El usuario debe poder saltarse completamente el sistema automático.

Puede hacer:

Foto → Personalizar manualmente

sin utilizar:

Recomendado.

Esto es esencial para mantener la libertad que busca el sistema.

⸻

12. PERSONALIZACIÓN MANUAL COMO ÚLTIMO NIVEL

La estructura debe transmitir:

Fácil

→ Predeterminado.

Automático

→ Recomendado.

Avanzado

→ Personalizar.

Así un usuario nuevo puede tener una experiencia sencilla mientras un usuario que quiera máxima libertad puede acceder a todos los controles.

⸻

13. SISTEMA DE ESTADOS

El apartado Aspecto debe poder identificar claramente el estado actual.

Ejemplos:

Predeterminado

Foto personalizada

Recomendado

Personalizado

Preset

Esto evita confusión sobre qué configuración está activa.

⸻

14. PRESETS Y PERSONALIZACIÓN

Si el usuario carga un preset y posteriormente modifica algo:

El sistema debe poder indicar:

Preset modificado

en lugar de fingir que sigue siendo exactamente el preset original.

Opciones:

Guardar cambios

o

Guardar como nuevo

⸻

15. LEGIBILIDAD INTEGRADA

La información de legibilidad debe aparecer dentro de Aspecto sin resultar invasiva.

Por ejemplo:

🟢 Aspecto correcto

o:

⚠️ 1 elemento puede mejorar

Al pulsarlo:

Ver problemas

Esto lleva al sistema de la FASE 9.

⸻

16. MODO OSCURO/CLARO

Mantener el selector actual de modo de apariencia.

Debe integrarse dentro del mismo sistema.

Cambiar:

Claro ↔ Oscuro

no debe eliminar:

* fotografías;
* presets;
* colores personalizados;
* ajustes fotográficos.

⸻

17. CONFIGURACIÓN PREDETERMINADA

Debe existir siempre una opción clara:

Restablecer Aspecto

Debe devolver JC Fitness a la apariencia oficial.

Debe existir una confirmación antes de hacerlo si el usuario tiene una configuración personalizada importante.

⸻

18. CONFIRMACIÓN INTELIGENTE

No mostrar confirmaciones innecesarias.

Por ejemplo:

Cambiar un color:

NO necesita confirmación.

Eliminar una configuración importante:

SÍ puede necesitar confirmación.

Restablecer toda la apariencia:

SÍ debe advertir de las consecuencias.

⸻

19. EXPERIENCIA MÓVIL

Aspecto debe estar diseñado pensando principalmente en:

* iPhone;
* Android;
* PWA.

Los controles deben ser táctiles.

Evitar:

* botones pequeños;
* menús difíciles de tocar;
* paneles excesivamente densos;
* ventanas que no se adapten a la pantalla.

⸻

20. ANIMACIONES

Utilizar transiciones suaves cuando:

* se cambia de fondo;
* se abre un editor;
* se aplica un preset;
* se prueba una recomendación;
* se cambia una paleta.

No utilizar animaciones innecesarias que ralenticen la aplicación.

⸻

21. COHERENCIA VISUAL

El apartado Aspecto debe utilizar el propio sistema visual de JC Fitness.

No crear una interfaz diferente para personalizar la interfaz.

Debe sentirse como una parte natural de la aplicación.

⸻

22. SISTEMA CENTRAL

Todos los componentes deben recibir la configuración desde el mismo sistema central.

No permitir:

Dashboard usa una configuración

mientras:

Entreno usa otra

por errores de estado.

Toda la aplicación debe consumir:

Apariencia activa

⸻

23. ACTUALIZACIÓN EN TIEMPO REAL

Cuando el usuario aplica una configuración:

Aspecto → Aplicar

los cambios deben reflejarse inmediatamente en toda la aplicación.

No requerir:

* cerrar sesión;
* recargar;
* reiniciar;
* volver a abrir la aplicación.

⸻

24. PERSISTENCIA

La apariencia activa debe conservarse.

Al volver a abrir JC Fitness:

Apariencia anterior

debe seguir activa.

Si posteriormente existe sincronización mediante Supabase, la configuración debe poder sincronizarse entre dispositivos.

⸻

25. MANEJO DE ERRORES

Si una fotografía, preset o configuración no puede cargarse:

No mostrar una pantalla rota.

Utilizar:

Fondo predeterminado

y mostrar un aviso comprensible si es necesario.

La aplicación debe continuar funcionando.

⸻

26. ACCESIBILIDAD

El apartado Aspecto debe ser usable independientemente de la personalización elegida.

Los controles deben tener:

* nombres claros;
* áreas táctiles adecuadas;
* estados visibles;
* etiquetas comprensibles.

No depender únicamente del color para indicar una acción.

⸻

27. RENDIMIENTO

La integración no debe cargar simultáneamente:

* todas las fotografías;
* todos los presets;
* todos los editores;
* todos los análisis.

Cargar lo necesario cuando se necesite.

Esto prepara el terreno para la optimización específica de la FASE 11.

⸻

28. CRITERIOS DE FINALIZACIÓN

La FASE 10 está terminada cuando:

* Todas las funciones de las FASES 1–9 están integradas.
* Existe un único centro de Aspecto.
* El usuario entiende fácilmente qué fondo está activo.
* Puede cambiar rápidamente de fondo.
* Puede editar fotografías.
* Puede modificar colores.
* Puede utilizar Recomendado.
* Puede personalizar manualmente.
* Puede utilizar presets.
* Puede consultar problemas de legibilidad.
* Puede cambiar modo claro/oscuro.
* Puede restablecer la apariencia.
* Todos los cambios se reflejan globalmente.
* La configuración persiste.
* Los estados no se contradicen.
* No existen sistemas duplicados.
* La experiencia funciona correctamente en móvil.
* No se rompe ninguna pantalla existente.

⸻

29. REGLA PARA CLAUDE

No interpretar esta fase como simplemente «poner todos los botones juntos».

La finalidad es crear una experiencia de personalización coherente.

El usuario debe sentir que existe un único sistema:

ASPECTO

dentro del cual puede hacer absolutamente todo.

La jerarquía debe ser:

Predeterminado → Fácil

Recomendado → Automático

Personalizar → Libertad total

Presets → Guardar y cambiar

Legibilidad → Protección inteligente

Las siguientes fases se centrarán en rendimiento, almacenamiento, eliminación y recuperación para completar todo el sistema.

Vamos con la FASE 9 de 12. Esta es especialmente importante porque aquí hacemos que toda esa libertad no destruya la legibilidad. El usuario puede elegir prácticamente cualquier foto y color, pero JC Fitness debe detectar problemas y ayudar a corregirlos.

FASE 9 — LEGIBILIDAD Y CONTRASTE INTELIGENTE

1. OBJETIVO

Crear un sistema inteligente que compruebe si la combinación entre:

Fondo + fotografía + colores + textos + botones + tarjetas + navegación

mantiene una buena legibilidad.

La filosofía debe ser:

Libertad total para personalizar, pero con protección inteligente para que la interfaz siga siendo usable.

El sistema no debe quitarle el control al usuario.

⸻

2. COMPROBACIÓN AUTOMÁTICA

Cada vez que se aplique o modifique una configuración visual importante, el sistema debe poder comprobar:

* contraste;
* legibilidad;
* diferenciación entre elementos;
* visibilidad de textos;
* visibilidad de iconos;
* separación entre superficies.

No es necesario recalcular todo constantemente si no existe ningún cambio relevante.

⸻

3. TEXTO SOBRE FOTOGRAFÍAS

Analizar especialmente las zonas donde aparezca texto directamente sobre una fotografía.

Ejemplo:

Texto blanco + fondo muy claro

→ posible problema.

El sistema debe detectarlo.

⸻

4. TEXTO SOBRE COLORES

Comprobar también:

Texto + botón

Texto + tarjeta

Icono + navegación

Texto + superficies

Cada combinación debe tener contraste suficiente.

⸻

5. INDICADOR DE LEGIBILIDAD

Cuando exista un problema, mostrar una indicación clara.

Ejemplo:

⚠️ Legibilidad baja

Este color puede dificultar la lectura sobre tu fondo.

No utilizar mensajes técnicos para el usuario.

⸻

6. PROPUESTA DE CORRECCIÓN

Cuando se detecte un problema, ofrecer:

Corregir automáticamente

El sistema puede modificar únicamente el parámetro problemático.

Por ejemplo:

Texto blanco
→ fondo demasiado claro

JC Fitness puede proponer:

Texto oscuro

sin cambiar:

* fotografía;
* colores principales;
* preset;
* demás elementos.

⸻

7. NO CAMBIAR SIN PERMISO

La corrección automática no debe modificar la apariencia sin que el usuario lo haya solicitado.

Debe existir una diferencia clara entre:

Detectar

y

Corregir automáticamente

⸻

8. MODO AUTOMÁTICO

El usuario puede activar una opción equivalente a:

🛡️ Legibilidad automática

Cuando esté activa, JC Fitness podrá realizar ajustes automáticos para mantener una lectura adecuada.

Cuando esté desactivada:

El usuario tiene el control completo.

⸻

9. CONTROL MANUAL

Incluso con la protección activada, permitir al usuario realizar cambios manuales.

No crear un sistema que impida elegir un color concreto simplemente porque el algoritmo considere que no es ideal.

Si el usuario insiste en una combinación de bajo contraste, mostrar el aviso correspondiente.

⸻

10. OVERLAY INTELIGENTE

Cuando una fotografía dificulte la lectura, el sistema debe poder recomendar un overlay.

Ejemplo:

Fotografía clara

→

Overlay oscuro 15%

→

Texto blanco más legible

El usuario puede aceptar o rechazar la modificación.

⸻

11. DESENFOQUE COMO RECURSO

Si la fotografía contiene muchos detalles detrás de la interfaz, el sistema puede recomendar:

Desenfoque ligero

No aplicarlo automáticamente sin autorización salvo que el usuario haya activado expresamente el modo automático.

⸻

12. TARJETAS Y SUPERFICIES

No intentar resolver todos los problemas modificando el texto.

También puede utilizarse:

* fondo translúcido;
* superficie opaca;
* borde;
* sombra;
* overlay.

La solución debe buscar mantener la estética de la fotografía.

⸻

13. NAVEGACIÓN

La barra de navegación merece una comprobación específica.

Debe garantizar que:

* iconos activos;
* iconos inactivos;
* texto;
* fondo;

sean distinguibles.

Esto es especialmente importante si la fotografía ocupa toda la pantalla.

⸻

14. BOTONES

Comprobar:

* fondo del botón;
* texto;
* icono;
* estado activo;
* estado seleccionado.

Evitar botones que visualmente desaparezcan contra el fondo.

⸻

15. ICONOS

Comprobar también los iconos.

Un icono pequeño puede necesitar más contraste que un texto grande.

No utilizar únicamente el tamaño de la fuente como referencia.

⸻

16. CONTRASTE LOCAL

Cuando exista una fotografía, el contraste puede variar dentro de la misma imagen.

Por ello, no basta con analizar únicamente el color promedio de toda la fotografía.

Siempre que sea técnicamente viable, analizar la zona concreta donde aparece cada elemento.

Ejemplo:

Texto en la parte superior

→ analizar parte superior.

Botón en la parte inferior

→ analizar parte inferior.

⸻

17. DIFERENCIACIÓN ENTRE ELEMENTOS

Comprobar que dos elementos consecutivos no sean prácticamente iguales.

Ejemplo:

Tarjeta gris
sobre
fondo gris

→ puede desaparecer visualmente.

El sistema puede recomendar:

* aumentar contraste;
* modificar transparencia;
* añadir borde;
* modificar ligeramente el color.

⸻

18. ESTADOS ACTIVOS

Los elementos seleccionados deben distinguirse claramente de los no seleccionados.

Por ejemplo:

Inicio activo

debe diferenciarse de:

Entreno inactivo

No depender únicamente del color.

Cuando sea necesario, utilizar:

* intensidad;
* fondo;
* icono;
* borde;
* peso visual.

⸻

19. MODO CLARO Y OSCURO

Realizar las comprobaciones independientemente en:

* modo claro;
* modo oscuro.

Una configuración puede funcionar perfectamente en uno y no en otro.

Si el sistema actual mantiene una configuración común, adaptar únicamente los elementos necesarios sin destruir la personalización.

⸻

20. AVISOS NO INTRUSIVOS

Los avisos no deben resultar molestos.

No mostrar ventanas emergentes constantemente.

Preferir:

* pequeños indicadores;
* mensajes dentro del editor;
* avisos contextuales;
* recomendaciones opcionales.

El usuario debe poder continuar personalizando.

⸻

21. RESUMEN DE PROBLEMAS

Dentro del editor puede existir una sección:

Comprobación

Ejemplo:

✓ Texto principal
✓ Botones
⚠️ Navegación
✓ Tarjetas

Esto permite detectar rápidamente qué parte necesita atención.

⸻

22. NIVEL DE SEGURIDAD VISUAL

Opcionalmente, mostrar un estado general:

🟢 Excelente

Todo funciona correctamente.

🟡 Mejorable

Existe algún elemento con contraste reducido.

🔴 Problema

Algún elemento presenta una legibilidad claramente deficiente.

No convertir esto en una puntuación obsesiva.

Debe servir para ayudar.

⸻

23. INTEGRACIÓN CON «RECOMENDADO»

Las propuestas de la FASE 6 deben pasar por este sistema antes de considerarse válidas.

Flujo:

Detector
→ colores

Recomendador
→ propuestas

Legibilidad
→ comprobar

Propuesta final
→ mostrar al usuario.

Así se evita que «Recomendado» genere una combinación bonita pero inutilizable.

⸻

24. INTEGRACIÓN CON PRESETS

Cuando se cargue un preset:

Preset
→ comprobar

Si todo está correcto:

✓

Si existe algún problema:

⚠️

No eliminar ni modificar automáticamente el preset simplemente por contener un problema.

⸻

25. INTEGRACIÓN CON PERSONALIZACIÓN MANUAL

Cuando el usuario cambie manualmente un color:

Nuevo color
→ comprobar

Si existe un problema:

Aviso

Pero el usuario puede mantenerlo si quiere.

Esto conserva la libertad total.

⸻

26. ACCESIBILIDAD

Además de la estética, contemplar principios básicos de accesibilidad visual.

Especialmente:

* contraste suficiente;
* elementos activos distinguibles;
* textos secundarios que sigan siendo legibles;
* iconos visibles;
* controles reconocibles.

No sacrificar la usabilidad por conseguir una apariencia determinada.

⸻

27. RENDIMIENTO

El sistema no debe analizar cada píxel continuamente.

Optimizar:

* cuándo analizar;
* qué zonas analizar;
* qué elementos comprobar;
* cuándo recalcular.

Si una configuración no ha cambiado, no volver a calcular innecesariamente.

⸻

28. CRITERIOS DE FINALIZACIÓN

La FASE 9 se considera terminada cuando:

* Existe comprobación automática de contraste.
* Se comprueba texto sobre fotografías.
* Se comprueba texto sobre colores.
* Se comprueban botones.
* Se comprueban tarjetas.
* Se comprueba navegación.
* Se comprueban iconos.
* Se detectan problemas de legibilidad.
* Existen avisos comprensibles.
* Se pueden proponer correcciones.
* Existe opción de corrección automática.
* La corrección no se aplica sin permiso salvo que el usuario haya activado el modo automático.
* Se puede mantener manualmente una combinación aunque sea considerada mejorable.
* Se comprueba el contraste local cuando sea necesario.
* Se comprueban estados activos.
* Funciona con modo claro y oscuro.
* Se integra con Recomendado.
* Se integra con presets.
* Se integra con la personalización manual.
* No provoca ralentizaciones perceptibles.
* No rompe ninguna funcionalidad existente.

⸻

29. REGLA PARA CLAUDE

Este sistema no debe convertirse en un policía del diseño.

Su función es:

Detectar → avisar → sugerir → ayudar.

No debe impedir que el usuario personalice JC Fitness.

La regla principal sigue siendo:

Máxima libertad + protección inteligente de la legibilidad.

La siguiente fase será la integración completa de todo este sistema dentro del apartado Aspecto de JC Fitness.
Vamos con la FASE 8 de 12. Aquí convertimos las personalizaciones que el usuario ha creado en temas/presets guardables, para poder cambiar de apariencia en segundos sin volver a configurarlo todo.

FASE 8 — PRESETS Y CONFIGURACIONES GUARDADAS

1. OBJETIVO

Crear un sistema para guardar configuraciones completas de apariencia.

El usuario podrá crear diferentes estilos de JC Fitness y cambiar entre ellos rápidamente.

Ejemplo:

Mi foto
→ fondo personalizado + colores personalizados.

Gym
→ fondo oscuro + colores intensos.

Minimal
→ fondo sencillo + colores neutros.

Predeterminado
→ apariencia oficial de JC Fitness.

La finalidad es que el usuario no tenga que volver a configurar la aplicación cada vez.

⸻

2. QUÉ ES UN PRESET

Un preset es una configuración completa de apariencia.

Debe poder incluir:

* Tipo de fondo.
* Fotografía.
* Ajustes de fotografía.
* Colores.
* Degradados.
* Transparencias.
* Overlay.
* Botones.
* Tarjetas.
* Navegación.
* Iconos.
* Textos.
* Sombras.
* Bordes.
* Cualquier otro parámetro visual compatible.

Debe guardar una configuración completa, no solamente un color.

⸻

3. CREAR PRESET

Dentro de Aspecto debe existir:

Guardar apariencia

Al pulsarlo:

Nombre del preset

Ejemplo:

Mi fondo azul

Después:

Guardar

La configuración actual queda almacenada.

⸻

4. NOMBRES PERSONALIZADOS

El usuario debe poder poner el nombre que quiera.

Ejemplos:

* Mi estilo.
* Gym.
* Verano.
* Oscuro.
* Mi foto.
* Azul.
* Minimalista.
* Entreno.
* Mi configuración.

No imponer nombres técnicos.

⸻

5. LISTA DE PRESETS

Mostrar las configuraciones guardadas de forma visual.

Cada preset debería mostrar una pequeña representación de:

* fondo;
* colores;
* fotografía;
* estilo general.

Ejemplo:

Mi estilo

[miniatura]

Azul Gym

[miniatura]

Esto permitirá reconocerlos rápidamente.

⸻

6. PRESET ACTIVO

Identificar claramente cuál está activo.

Por ejemplo:

✓ Activo

El usuario debe saber inmediatamente qué apariencia está utilizando.

⸻

7. CAMBIAR DE PRESET

Al seleccionar otro preset:

Preset A
→
Preset B

La aplicación debe cambiar toda la apariencia correspondiente.

Debe ser inmediato y fluido.

No recargar la aplicación completa.

⸻

8. VISTA PREVIA

Antes de cambiar definitivamente, permitir visualizar el preset.

El usuario puede:

Probar

y comprobar cómo queda.

Después:

Aplicar

o

Cancelar

⸻

9. DUPLICAR PRESET

Permitir:

Duplicar

Esto crea una copia independiente.

Ejemplo:

Gym

→ Duplicar

→ Gym 2

El usuario puede modificar Gym 2 sin modificar Gym.

⸻

10. EDITAR PRESET

Permitir modificar un preset existente.

Ejemplo:

Mi estilo
→ Editar
→ modificar colores
→ modificar fondo
→ Guardar

Debe poder actualizarse sin necesidad de crear otro preset.

⸻

11. GUARDAR COMO NUEVO

Cuando se edite un preset, ofrecer también:

Guardar como nuevo

Así se puede conservar el original.

Ejemplo:

Gym

→ modificar

→ Guardar como nuevo

→ Gym oscuro

⸻

12. ELIMINAR PRESET

Permitir eliminar configuraciones guardadas.

Pero la eliminación no debe ser inmediatamente irreversible.

La FASE 12 conectará esto con:

Eliminados recientemente

para poder recuperar elementos eliminados.

⸻

13. PRESETS PREDETERMINADOS

JC Fitness puede proporcionar algunos presets incluidos.

Por ejemplo:

* JC Fitness.
* Dark.
* Light.
* Minimal.
* Energy.

Estos deben diferenciarse de los creados por el usuario.

⸻

14. NO MODIFICAR PRESETS OFICIALES

Los presets oficiales de JC Fitness no deben poder modificarse directamente.

Si el usuario quiere personalizar uno:

Preset oficial
→ Duplicar
→ Personalizar

Así se conserva el original.

⸻

15. FAVORITOS

Permitir marcar presets como favoritos.

Por ejemplo:

♡

Los favoritos pueden aparecer arriba de la lista.

Esto será especialmente útil si el usuario tiene muchas configuraciones.

⸻

16. ORDEN

Permitir una organización lógica de los presets.

Prioridad:

1. Activo.
2. Favoritos.
3. Recientes.
4. Resto.

No crear una interfaz complicada.

⸻

17. PRESETS RECIENTES

Registrar los últimos presets utilizados.

Esto permitirá cambiar rápidamente entre configuraciones.

Por ejemplo:

Recientes

* Gym.
* Azul.
* Minimal.

⸻

18. CONFIGURACIÓN COMPLETA

Al guardar un preset, no olvidar ninguna propiedad.

Debe incluir todo lo necesario para reproducir exactamente la apariencia.

Ejemplo:

Preset

* Fondo: fotografía A.
* Zoom: 1.2.
* Posición X: 35%.
* Posición Y: 48%.
* Blur: 4.
* Overlay: negro 20%.
* Principal: azul.
* Secundario: blanco.
* Acento: naranja.
* Tarjetas: translúcidas.
* Navegación: oscura.
* Botones: azul.
* Texto: blanco.

Al cargarlo, debe reproducirse esa configuración.

⸻

19. INDEPENDENCIA ENTRE PRESETS

Modificar un preset no debe modificar los demás.

Cada configuración debe ser independiente.

Ejemplo:

Gym
y
Minimal

pueden utilizar la misma fotografía, pero tener colores y ajustes completamente diferentes.

⸻

20. FOTOGRAFÍAS Y PRESETS

Si un preset utiliza una fotografía, debe conservar correctamente la referencia necesaria para mostrarla.

Si la fotografía deja de estar disponible, el sistema debe detectar el problema y evitar que aparezca un fondo roto.

Debe existir una alternativa segura:

Fondo predeterminado

hasta resolver la situación.

⸻

21. PERSISTENCIA

Los presets deben mantenerse después de:

* cerrar la aplicación;
* reiniciar el dispositivo;
* actualizar la aplicación.

Cuando exista autenticación y sincronización mediante Supabase, la arquitectura debe estar preparada para sincronizarlos con la cuenta del usuario.

⸻

22. EXPERIENCIA DE CAMBIO

Cambiar entre presets debe ser visualmente agradable.

Utilizar una transición suave.

Evitar:

* pantallas en blanco;
* parpadeos;
* cargas innecesarias;
* pérdida temporal del fondo.

⸻

23. LÍMITE DE PRESETS

Si técnicamente resulta necesario establecer un límite, hacerlo de manera razonable.

Pero no establecer un límite artificialmente bajo.

La arquitectura debe poder soportar numerosos presets sin deteriorar el rendimiento.

⸻

24. EXPORTACIÓN FUTURA

Preparar la estructura para que en fases futuras pueda existir:

Exportar apariencia

y

Importar apariencia

No implementar todavía estas funciones si no forman parte de esta fase.

⸻

25. PREPARACIÓN PARA LA FASE 9

Los presets deben poder utilizarse junto con el sistema de legibilidad inteligente.

Por ejemplo:

Preset
→ analizar contraste
→ detectar problema
→ corregir o avisar.

La FASE 9 será la encargada de garantizar que cualquier configuración siga siendo visualmente legible.

⸻

26. CRITERIOS DE FINALIZACIÓN

La FASE 8 está terminada cuando:

* Se pueden crear presets.
* Se pueden nombrar.
* Se pueden guardar.
* Se pueden visualizar.
* Se pueden aplicar.
* Se pueden editar.
* Se pueden duplicar.
* Se pueden guardar como nuevos.
* Se pueden marcar como favoritos.
* Se pueden ordenar lógicamente.
* Se pueden eliminar.
* Se diferencian presets oficiales y personales.
* Los presets oficiales no se modifican directamente.
* Cada preset conserva toda la configuración visual necesaria.
* Los presets son independientes entre sí.
* Las fotografías asociadas funcionan correctamente.
* La configuración persiste.
* El cambio entre presets es fluido.
* La arquitectura queda preparada para sincronización futura.
* No se rompe ninguna funcionalidad existente.

⸻

27. REGLA PARA CLAUDE

Un preset no debe ser simplemente:

«guardar colores».

Debe ser una fotografía completa del aspecto visual de JC Fitness.

La experiencia final debe permitir:

Crear → Guardar → Probar → Aplicar → Editar → Duplicar → Cambiar

sin perder ninguna configuración.

Además, nunca eliminar definitivamente un preset del sistema si posteriormente debe poder recuperarse mediante el sistema de «Eliminados recientemente».
Vamos con la FASE 7 de 12. Aquí hacemos que el usuario pueda coger cualquier recomendación —o cualquier configuración— y modificar absolutamente lo que quiera, sin que el sistema automático le vuelva a cambiar las cosas.
FASE 7 — PERSONALIZACIÓN MANUAL AVANZADA | JC FITNESS
1. OBJETIVO
Crear el sistema de personalización manual avanzada que permita al usuario modificar libremente la apariencia de JC Fitness.
El usuario debe poder partir de:
* una configuración predeterminada;
* una fotografía;
* una paleta manual;
* una recomendación automática;
* un preset.
Y modificarla posteriormente sin restricciones innecesarias.
La filosofía es:
La recomendación ayuda. El usuario decide.
 
⸻
 
2. ACCESO AL EDITOR COMPLETO
Dentro de Aspecto debe existir una entrada claramente identificable:
🎨 Personalizar
Al entrar, mostrar la configuración visual completa.
Debe poder dividirse en categorías para no saturar la pantalla.
 
⸻
 
3. ESTRUCTURA DEL EDITOR
Organizar la personalización en secciones:
Fondo
* Tipo de fondo.
* Fotografía.
* Color.
* Degradado.
* Ajustes de fotografía.
Colores
* Principal.
* Secundario.
* Acento.
* Botones.
* Tarjetas.
* Textos.
* Iconos.
Superficies
* Tarjetas.
* Navegación.
* Modales.
* Paneles.
Detalles
* Bordes.
* Sombras.
* Transparencias.
* Overlays.
No mostrar necesariamente todos los controles abiertos simultáneamente.
Utilizar secciones desplegables.
 
⸻
 
4. LIBERTAD TOTAL SOBRE LOS COLORES
El usuario debe poder modificar cualquier color que el sistema permita técnicamente.
No limitarlo a las recomendaciones de JC Fitness.
Por ejemplo:
Recomendación:
Azul + blanco + naranja.
El usuario puede convertirla en:
Azul + negro + verde.
La aplicación debe respetar la decisión.
 
⸻
 
5. EDICIÓN DE UNA RECOMENDACIÓN
Si el usuario selecciona una recomendación:
Recomendado → Personalizar
Debe abrirse esa configuración concreta.
Todos sus valores deben estar disponibles para edición.
No generar una nueva recomendación automáticamente cada vez que el usuario cambie algo.
 
⸻
 
6. CONTROL INDIVIDUAL
Cada elemento debe poder modificarse independientemente cuando sea posible.
Por ejemplo:
Botones
Color: #123456
Texto: #FFFFFF
Borde: #789ABC
Mientras que:
Tarjetas
pueden tener una configuración completamente diferente.
 
⸻
 
7. COLOR MANUAL
Mantener el selector avanzado creado en la FASE 4.
Debe permitir:
* selector visual;
* HEX;
* RGB;
* HSL cuando sea útil;
* transparencia cuando proceda.
El valor elegido debe verse inmediatamente.
 
⸻
 
8. TRANSPARENCIA
Permitir controlar la transparencia de elementos compatibles.
Por ejemplo:
Tarjeta
Opacidad ─────●──
Esto permite crear efectos como:
* vidrio;
* superficies semitransparentes;
* tarjetas sobre fotografías;
* navegación translúcida.
No implementar efectos visuales artificiales si perjudican el rendimiento.
 
⸻
 
9. OVERLAY
El usuario debe poder modificar el overlay de la fotografía.
Controles:
* activar/desactivar;
* color;
* intensidad;
* transparencia.
Esto permite conseguir diferentes estilos sin modificar la imagen original.
 
⸻
 
10. BORDES
Cuando el componente lo permita, controlar:
* color;
* intensidad;
* transparencia.
No introducir bordes innecesarios en componentes que actualmente no los utilizan.
La personalización debe respetar la estructura visual de JC Fitness.
 
⸻
 
11. SOMBRAS
Preparar control sobre las sombras de superficies compatibles.
Debe existir la posibilidad de:
* activar/desactivar;
* intensidad;
* profundidad, si procede.
Evitar que el usuario pueda crear configuraciones visualmente exageradas que hagan que la aplicación parezca desordenada.
 
⸻
 
12. DEGRADADOS
Permitir personalizar degradados:
* color inicial;
* color final;
* dirección;
* intensidad;
* transparencia.
Si la implementación actual permite más puntos de color, podrá ampliarse.
La experiencia debe mantenerse sencilla.
 
⸻
 
13. MODIFICAR LA NAVEGACIÓN
Permitir personalizar:
* fondo;
* iconos activos;
* iconos inactivos;
* texto activo;
* texto inactivo;
* borde/divisor.
La navegación nunca debe perder su función principal.
 
⸻
 
14. MODIFICAR TARJETAS
Permitir controlar:
* fondo;
* transparencia;
* borde;
* texto;
* detalles;
* sombra.
La modificación debe aplicarse de manera coherente a las tarjetas del sistema.
 
⸻
 
15. MODIFICAR BOTONES
Permitir configurar:
* fondo;
* texto;
* icono;
* borde;
* estado activo;
* estado seleccionado.
Cuando existan diferentes tipos de botones, mantener su jerarquía.
No convertir todos los botones de la aplicación en el mismo estilo si eso destruye la UX.
 
⸻
 
16. MODIFICAR ICONOS
Permitir controlar los iconos cuando corresponda.
Diferenciar:
* normales;
* activos;
* seleccionados;
* destacados.
 
⸻
 
17. MODIFICAR TEXTOS
Mantener jerarquía entre:
* títulos;
* texto principal;
* texto secundario;
* texto atenuado;
* texto sobre botones.
El usuario puede personalizar los colores, pero el sistema debe mantener la jerarquía tipográfica existente.
Esta fase trata de apariencia, no de rediseñar completamente la tipografía.
 
⸻
 
18. VISTA PREVIA GLOBAL
Mientras el usuario modifica cualquier parámetro, debe poder comprobar el resultado.
La vista previa debe mostrar suficientes elementos para entender cómo quedará la aplicación.
Por ejemplo:
* Dashboard.
* Tarjeta.
* Botón.
* Navegación.
* Texto.
* Iconos.
* Fotografía.
No es necesario cargar toda la aplicación real dentro del editor.
 
⸻
 
19. DESHACER
Añadir un sistema de:
Deshacer
El usuario debe poder volver atrás después de realizar cambios.
Idealmente permitir varios niveles de deshacer.
Ejemplo:
Cambiar azul → rojo
Cambiar tarjeta → negra
Cambiar botón → verde
Deshacer
→ botón vuelve a rojo.
Otro Deshacer
→ tarjeta vuelve a su configuración anterior.
 
⸻
 
20. REHACER
Cuando sea posible, añadir:
Rehacer
para recuperar cambios que se hayan deshecho.
Esto mejora mucho la experiencia cuando el usuario está experimentando.
 
⸻
 
21. CANCELAR
Debe existir:
Cancelar cambios
Que devuelva toda la configuración al estado anterior a la sesión de edición.
No aplicar cambios parcialmente.
 
⸻
 
22. APLICAR
Debe existir:
Aplicar cambios
Esto guarda la configuración completa.
La aplicación debe actualizarse inmediatamente.
 
⸻
 
23. RESTABLECER
Añadir:
Restablecer configuración
Debe devolver los valores al estado correspondiente.
Debe diferenciar entre:
Restablecer colores
y
Restablecer todo el aspecto
para evitar eliminar accidentalmente una fotografía.
Si una acción puede provocar pérdida de personalización, solicitar confirmación.
 
⸻
 
24. BLOQUEO DE RECOMENDACIONES
Una vez que el usuario modifica manualmente una recomendación, el sistema no debe sobrescribir sus cambios automáticamente.
Ejemplo:
Recomendado → azul + naranja
Usuario cambia:
naranja → verde
JC Fitness debe respetar el verde.
No volver automáticamente al naranja.
 
⸻
 
25. INDICADOR DE CAMBIOS MANUALES
Opcionalmente, el sistema puede identificar que una configuración ha sido modificada manualmente.
Por ejemplo:
Personalizado
en lugar de:
Recomendado
Esto permitirá entender fácilmente qué configuración está activa.
 
⸻
 
26. COPIAR CONFIGURACIÓN
Preparar una función para poder duplicar una configuración.
Ejemplo:
Configuración A → Duplicar
Resultado:
Configuración A — copia
Esto será especialmente útil en la FASE 8, cuando se desarrollen los presets.
 
⸻
 
27. NO DESTRUIR LA CONFIGURACIÓN ANTERIOR
Antes de aplicar cambios importantes, el sistema debe mantener suficiente información para poder:
* cancelar;
* deshacer;
* restaurar;
* volver atrás.
Nunca modificar directamente la configuración persistida antes de que el usuario confirme.
 
⸻
 
28. COMPATIBILIDAD CON FOTO
Todos los controles deben funcionar conjuntamente con:
* zoom;
* posición;
* desenfoque;
* oscurecimiento;
* opacidad;
* overlay.
Modificar colores no debe modificar la fotografía.
Modificar la fotografía no debe eliminar los colores.
 
⸻
 
29. COMPATIBILIDAD CON RECOMENDADO
El usuario debe poder hacer:
Foto → Recomendado → Aplicar → Personalizar → Modificar → Aplicar
Este flujo debe ser completamente válido.
 
⸻
 
30. PREPARACIÓN PARA PRESETS
La configuración debe poder convertirse posteriormente en un preset completo.
Por ello, almacenar conjuntamente:
* fondo;
* fotografía;
* ajustes fotográficos;
* colores;
* transparencias;
* overlays;
* demás parámetros visuales.
La FASE 8 utilizará esta estructura.
 
⸻
 
31. CRITERIOS DE FINALIZACIÓN
La FASE 7 está terminada cuando:
* Existe un editor manual completo.
* El usuario puede modificar colores individualmente.
* Puede modificar botones.
* Puede modificar tarjetas.
* Puede modificar textos.
* Puede modificar iconos.
* Puede modificar navegación.
* Puede modificar transparencias.
* Puede modificar overlays.
* Puede modificar degradados.
* Puede modificar bordes cuando corresponda.
* Puede modificar sombras cuando corresponda.
* Existe vista previa.
* Existe deshacer.
* Existe rehacer cuando sea viable.
* Existe cancelar.
* Existe aplicar.
* Existe restablecer.
* Las modificaciones manuales no son sobrescritas automáticamente.
* Se mantiene la fotografía y sus ajustes.
* La configuración puede convertirse posteriormente en un preset.
* No se rompe ninguna funcionalidad existente.
 
⸻
 
32. REGLA PARA CLAUDE
Esta fase debe llevar la filosofía de personalización al máximo.
El sistema automático puede recomendar.
Pero nunca debe imponerse sobre el usuario.
El usuario debe poder coger cualquier configuración y modificarla hasta conseguir exactamente el aspecto que quiere.
La siguiente fase será el SISTEMA DE PRESETS Y CONFIGURACIONES GUARDADAS, donde estas personalizaciones podrán almacenarse y cambiarse rápidamente.

Vamos con la FASE 6 de 12. Aquí convertimos el análisis de la Fase 5 en algo realmente útil: JC Fitness propondrá automáticamente varias combinaciones completas y el usuario podrá elegir cuál quiere aplicar.

FASE 6 — SISTEMA «RECOMENDADO» | JC FITNESS

1. OBJETIVO

Crear el sistema inteligente que utiliza la información obtenida en la FASE 5 para generar automáticamente diferentes propuestas de apariencia.

La idea principal es:

Foto
→ Analizar
→ Generar combinaciones
→ Mostrar propuestas
→ Previsualizar
→ Elegir
→ Aplicar

El usuario no debe estar obligado a elegir manualmente cada color si no quiere hacerlo.

⸻

2. BOTÓN «RECOMENDADO»

Dentro del apartado de personalización debe existir una opción claramente visible:

✨ RECOMENDADO

Al utilizarla, JC Fitness analiza la fotografía y genera propuestas visuales.

Si la fotografía todavía no ha sido analizada, primero ejecutar el análisis necesario.

⸻

3. NO GENERAR UNA ÚNICA PROPUESTA

El sistema no debe limitarse a decir:

«Este es el color recomendado.»

Debe generar varias alternativas.

Por ejemplo:

PROPUESTA 1

Equilibrada

PROPUESTA 2

Intensa

PROPUESTA 3

Minimalista

Las denominaciones exactas pueden adaptarse al diseño.

La finalidad es que el usuario tenga libertad para elegir.

⸻

4. COMBINACIÓN COMPLETA

Cada recomendación debe ser una configuración completa de la interfaz.

No recomendar únicamente el color principal.

Una propuesta puede contener:

* Color principal.
* Color secundario.
* Color de acento.
* Color de botones.
* Texto sobre botones.
* Color de tarjetas.
* Color de navegación.
* Iconos.
* Overlay.
* Transparencias.
* Configuración de contraste.

La recomendación debe funcionar como un tema completo.

⸻

5. UTILIZAR LA FOTOGRAFÍA COMO BASE

Las propuestas deben tener en cuenta la fotografía real.

Ejemplo:

Fotografía predominantemente azul:

Propuesta A
→ azul oscuro + azul claro + blanco.

Propuesta B
→ azul + naranja complementario + blanco.

Propuesta C
→ azul desaturado + gris + blanco.

No utilizar colores completamente aleatorios.

⸻

6. ARMONÍA CROMÁTICA

El sistema debe considerar relaciones entre colores.

Cuando sea apropiado, utilizar conceptos como:

* complementarios;
* análogos;
* monocromáticos;
* triádicos;
* contrastes;
* colores neutros.

No es obligatorio utilizar una única teoría de color.

El objetivo es conseguir combinaciones visualmente coherentes.

⸻

7. CONTRASTE

Cada propuesta debe comprobar que los elementos principales sean legibles.

Antes de mostrar una recomendación:

Color
→ comprobar contraste
→ ajustar si es necesario
→ generar propuesta.

Esto no sustituye al sistema avanzado de legibilidad de la FASE 9.

Pero las propuestas iniciales no deben ser obviamente ilegibles.

⸻

8. PROPUESTAS DIFERENTES

Las alternativas deben ser realmente diferentes.

Evitar generar:

Azul #123456

Azul #123457

Azul #123458

Eso no proporciona libertad real.

Las propuestas deben tener diferencias visuales perceptibles.

⸻

9. PREVISUALIZACIÓN

Cada propuesta debe mostrar una pequeña representación de cómo quedaría JC Fitness.

Debe incluir:

* fotografía;
* botones;
* tarjetas;
* navegación;
* textos;
* iconos;
* colores.

El usuario debe poder comparar visualmente antes de aplicar.

⸻

10. APLICAR PROPUESTA

Cada propuesta debe disponer de una acción:

Aplicar

Al pulsarla:

* se convierte en la configuración activa;
* se guardan los colores;
* se mantienen los ajustes de la fotografía;
* se actualiza la aplicación inmediatamente.

No modificar la fotografía original.

⸻

11. PREVISUALIZAR SIN APLICAR

Idealmente el usuario debe poder tocar una propuesta y verla temporalmente en la interfaz.

Por ejemplo:

Probar

Esto permite comprobar cómo se siente la aplicación antes de guardarla.

Debe existir:

Probar → Me gusta → Aplicar

o

Probar → Volver

⸻

12. CANCELAR

Si el usuario está probando una recomendación y decide no utilizarla:

Cancelar

Debe restaurar exactamente la apariencia anterior.

No perder la configuración personalizada que tenía antes.

⸻

13. GENERAR NUEVAS PROPUESTAS

Añadir una opción equivalente a:

🔄 Generar otras

Esto permite que el usuario no quede limitado a las primeras propuestas.

Cada nueva generación debe intentar producir alternativas diferentes y válidas.

⸻

14. FAVORITO

Preparar la posibilidad de marcar una propuesta como favorita.

Por ejemplo:

♡ Guardar

Esto permitirá posteriormente reutilizarla.

La gestión completa de presets se desarrollará en la FASE 8.

⸻

15. MODO AUTOMÁTICO

Preparar una opción que pueda representar:

Usar recomendación automáticamente

Si se activa, una nueva fotografía podría generar una propuesta automáticamente.

IMPORTANTE:

Esta opción debe ser opcional.

Nunca obligar al usuario a utilizar colores automáticos.

⸻

16. RESPETAR LA LIBERTAD MANUAL

El sistema recomendado nunca debe bloquear el sistema manual.

El usuario debe poder:

Recomendado → aplicar → modificar manualmente

Por ejemplo:

JC Fitness recomienda:

Azul + blanco + naranja

El usuario puede cambiar:

naranja → rojo

sin que la aplicación vuelva a imponer automáticamente el naranja.

⸻

17. COMPATIBILIDAD CON EL EDITOR FOTOGRÁFICO

Las recomendaciones deben funcionar junto con los ajustes realizados en la FASE 3.

Por ejemplo:

Foto

* Zoom personalizado.
* Posición personalizada.
* Desenfoque.
* Overlay.

Paleta recomendada

La recomendación no debe restablecer accidentalmente:

* zoom;
* posición;
* encuadre;
* desenfoque.

⸻

18. RECOMENDACIÓN PARA DIFERENTES TIPOS DE FONDO

Aunque la función está especialmente pensada para fotografías, la arquitectura debe permitir que posteriormente pueda utilizarse con:

* fotografías;
* degradados;
* fondos predeterminados;
* colores.

Si no existe suficiente información cromática, utilizar la información disponible.

⸻

19. NOMBRE DE LAS PROPUESTAS

Las propuestas pueden tener una descripción visual sencilla.

Ejemplo:

✨ Equilibrada

Colores extraídos de la fotografía con contraste moderado.

⚡ Energética

Acentos más intensos para una apariencia deportiva.

🧊 Minimalista

Colores neutros y pocos acentos.

No utilizar lenguaje técnico para el usuario final.

⸻

20. SISTEMA DE PUNTUACIÓN INTERNA

Cada propuesta debe poder evaluarse internamente mediante criterios como:

* armonía;
* contraste;
* legibilidad;
* coherencia con la fotografía;
* saturación;
* equilibrio;
* diferencia respecto a otras propuestas.

No es necesario mostrar la puntuación al usuario.

Sirve para seleccionar mejores propuestas.

⸻

21. EVITAR RECOMENDACIONES ABSURDAS

El sistema debe descartar combinaciones evidentemente problemáticas.

Ejemplos:

* texto amarillo sobre fondo amarillo;
* botón blanco con texto blanco;
* acentos excesivamente saturados;
* colores prácticamente indistinguibles;
* combinaciones que destruyan la jerarquía visual.

La FASE 9 hará una comprobación todavía más profunda.

⸻

22. PERSISTENCIA

Si el usuario aplica una recomendación:

Cerrar aplicación
→ Volver

La configuración debe mantenerse.

Debe guardarse como parte de la apariencia activa.

⸻

23. NO SOBRESCRIBIR INFORMACIÓN INNECESARIA

Aplicar una recomendación cromática no debe:

* eliminar fotografías;
* eliminar presets;
* eliminar configuraciones anteriores;
* modificar el archivo original;
* borrar ajustes de encuadre.

Solamente debe cambiar los parámetros que forman parte de la propuesta.

⸻

24. EXPERIENCIA PREMIUM

El proceso de recomendación debe sentirse especial.

Ejemplo:

Analizando tu foto…

→ pequeña transición

Hemos encontrado varias combinaciones para ti

→ aparecen las propuestas

→ el usuario las desliza

→ toca una

→ la prueba

→ aplica.

Debe ser rápido y elegante, no una pantalla técnica.

⸻

25. PREPARACIÓN PARA LA FASE 7

La siguiente fase permitirá que el usuario modifique manualmente cualquier parte de la recomendación.

Por ello, cada propuesta debe estar almacenada como una configuración editable.

Ejemplo:

Propuesta
→ principal
→ secundario
→ acento
→ botones
→ tarjetas
→ navegación
→ textos
→ overlay

La FASE 7 podrá abrirla y modificarla.

⸻

26. CRITERIOS DE FINALIZACIÓN

La FASE 6 está terminada cuando:

* Existe el botón «Recomendado».
* Puede utilizar los datos del detector de la FASE 5.
* Genera varias propuestas.
* Las propuestas son visualmente diferentes.
* Cada propuesta contiene una configuración completa.
* Las propuestas tienen en cuenta la fotografía.
* Existe comprobación básica de contraste.
* Se pueden previsualizar.
* Se pueden probar temporalmente.
* Se pueden aplicar.
* Se pueden cancelar.
* Se pueden generar nuevas propuestas.
* Se puede conservar una propuesta para uso posterior.
* Aplicar una propuesta no modifica la fotografía original.
* Aplicar una propuesta no elimina los ajustes fotográficos.
* La configuración persiste.
* El usuario mantiene siempre la posibilidad de editar manualmente.
* No se rompe ninguna funcionalidad existente.

⸻

27. REGLA PARA CLAUDE

El botón «RECOMENDADO» no debe significar «elige un color automáticamente».

Debe significar:

«Analiza mi fondo y créame una apariencia completa que combine con él.»

La experiencia final debe ser:

Foto → análisis → varias apariencias → probar → elegir → aplicar → modificar si quiero.

El sistema automático debe ayudar al usuario, nunca quitarle libertad.

La personalización manual avanzada se desarrollará en la FASE 7.
Vamos con la FASE 5 de 12. Aquí empieza la parte inteligente: JC Fitness analiza la fotografía y extrae una paleta de colores útil para personalizar la interfaz. Todavía no hacemos el sistema que decide y aplica automáticamente la mejor combinación; eso será la Fase 6.
FASE 5 — DETECTOR INTELIGENTE DE COLORES
1. OBJETIVO
Crear un sistema capaz de analizar automáticamente la fotografía utilizada como fondo y extraer información cromática útil.
El objetivo no es simplemente detectar los colores que aparecen en la imagen.
El sistema debe identificar qué colores pueden servir posteriormente para construir una apariencia coherente de JC Fitness.
Flujo:
Fotografía → Análisis → Colores detectados → Paleta estructurada → Preparada para recomendaciones
La selección y aplicación automática de la mejor combinación se desarrollará en la FASE 6.
 
⸻
 
2. CUÁNDO ANALIZAR LA FOTOGRAFÍA
El análisis debe ejecutarse cuando sea necesario:
* al seleccionar una nueva fotografía;
* al aplicar una fotografía;
* cuando el usuario solicite analizarla;
* cuando se vuelva a procesar una fotografía después de modificarla, si procede.
No analizar continuamente la imagen mientras el usuario mueve el zoom o la posición.
Esto evitará consumo innecesario de recursos.
 
⸻
 
3. COLORES DOMINANTES
Detectar los colores predominantes de la fotografía.
El sistema debe poder obtener varios colores relevantes, no solamente uno.
Por ejemplo:
Color 1 Color 2 Color 3 Color 4 Color 5
La cantidad exacta puede adaptarse técnicamente al algoritmo utilizado.
No mostrar necesariamente todos al usuario.
 
⸻
 
4. PALETA ESTRUCTURADA
Convertir los colores detectados en una estructura organizada.
Por ejemplo:
* Dominante.
* Secundario.
* Complementario.
* Neutro.
* Claro.
* Oscuro.
No asumir que el color más frecuente es automáticamente el mejor color para botones.
La frecuencia y la utilidad visual son conceptos diferentes.
 
⸻
 
5. DETECCIÓN DE TONOS CLAROS Y OSCUROS
El sistema debe identificar si los colores detectados son:
* claros;
* medios;
* oscuros.
Esto será importante para determinar posteriormente qué colores pueden utilizarse como:
* fondos;
* botones;
* textos;
* acentos.
 
⸻
 
6. SATURACIÓN
Analizar también la saturación de los colores.
Diferenciar entre:
* colores muy saturados;
* colores moderados;
* colores apagados;
* colores prácticamente neutros.
Esto permitirá evitar recomendaciones visualmente agresivas en fases posteriores.
 
⸻
 
7. NEUTROS
Detectar posibles colores neutros:
* blancos;
* negros;
* grises;
* tonos cercanos al gris.
Estos colores pueden ser especialmente útiles para:
* texto;
* superficies;
* overlays;
* navegación;
* contraste.
 
⸻
 
8. COLORES DESTACABLES
Además de los colores predominantes, identificar colores que aunque ocupen poca superficie puedan ser visualmente importantes.
Por ejemplo:
Una fotografía predominantemente negra con un pequeño elemento azul eléctrico.
El azul podría ser mucho más interesante como color de acento que un gris predominante.
Por ello, el detector no debe basarse únicamente en frecuencia.
 
⸻
 
9. DISTRIBUCIÓN DEL COLOR
Siempre que sea técnicamente viable, tener en cuenta dónde aparecen los colores.
Por ejemplo:
* parte superior;
* centro;
* parte inferior;
* zonas laterales.
Esto puede ser útil posteriormente para decidir si un color funciona mejor para determinados elementos de la interfaz.
No es necesario crear todavía recomendaciones basadas en posición.
 
⸻
 
10. ANÁLISIS OPTIMIZADO
El análisis debe realizarse sobre una representación optimizada de la fotografía cuando sea suficiente.
No procesar una fotografía de varios megabytes a máxima resolución si no es necesario.
La fotografía original debe conservarse intacta.
El análisis debe utilizar una versión optimizada temporalmente.
 
⸻
 
11. RESULTADO DEL ANÁLISIS
El sistema debe producir una estructura de datos que pueda ser utilizada por las siguientes fases.
Debe contener información equivalente a:
* colores detectados;
* valores HEX/RGB/HSL si resultan útiles;
* luminosidad;
* saturación;
* peso/importancia;
* clasificación;
* información adicional necesaria para recomendaciones.
No es obligatorio utilizar exactamente estos campos.
Lo importante es que la información sea suficientemente rica para las siguientes fases.
 
⸻
 
12. REPRESENTACIÓN VISUAL
Dentro del editor de apariencia debe existir posteriormente una representación de la paleta detectada.
Por ejemplo:
Colores encontrados
● ● ● ● ●
Cada color debe poder visualizarse claramente.
Al tocar uno, el sistema puede mostrar su valor o permitir utilizarlo manualmente.
La aplicación completa de estos colores se desarrollará en la FASE 6.
 
⸻
 
13. ACTUALIZACIÓN DEL ANÁLISIS
Si el usuario cambia completamente la fotografía:
Foto A → análisis A
Después:
Foto B → análisis B
El análisis anterior no debe utilizarse accidentalmente para la nueva fotografía.
Cada fotografía debe estar correctamente asociada con su análisis.
 
⸻
 
14. CACHÉ DEL ANÁLISIS
Si una fotografía ya ha sido analizada y no ha cambiado, evitar repetir innecesariamente el mismo análisis.
Guardar el resultado asociado a esa imagen.
Esto permitirá que el sistema sea más rápido.
Si la fotografía cambia o se reemplaza, generar un nuevo análisis.
 
⸻
 
15. NO MODIFICAR AUTOMÁTICAMENTE LOS COLORES
IMPORTANTE:
En esta fase, detectar colores NO debe cambiar automáticamente la apariencia del usuario.
Ejemplo:
El usuario tiene una fotografía azul y una paleta roja personalizada.
Al analizar la foto:
NO cambiar automáticamente rojo → azul.
Simplemente generar:
Paleta detectada: azul…
La decisión automática se desarrollará en la FASE 6.
 
⸻
 
16. INTEGRACIÓN CON EL SISTEMA DE COLORES
Los colores detectados deben poder enviarse al sistema creado en la FASE 4.
Por ejemplo:
Detector → #123456 → #789ABC → #DEF012
↓
Sistema de colores
Pero el usuario todavía debe conservar el control manual.
 
⸻
 
17. ERROR Y FOTOGRAFÍAS PROBLEMÁTICAS
El sistema debe manejar correctamente fotografías:
* extremadamente oscuras;
* extremadamente claras;
* prácticamente monocromáticas;
* con muy pocos colores;
* con muchos colores;
* con colores muy saturados.
Nunca debe producir una configuración rota.
Si no encuentra suficientes colores útiles, devolver una paleta válida basada en los colores disponibles.
 
⸻
 
18. FOTOGRAFÍAS MONOCROMÁTICAS
Si la fotografía es principalmente:
* negra;
* blanca;
* gris;
el sistema no debe fallar.
Debe identificar que existe una paleta predominantemente neutra.
Esto permitirá que la FASE 6 busque posteriormente colores de acento adecuados.
 
⸻
 
19. PRIVACIDAD
El análisis debe realizarse de la forma más privada y eficiente posible.
Si técnicamente es posible realizarlo localmente en el dispositivo, priorizar esa opción para este análisis básico.
No enviar automáticamente fotografías personales a servicios externos sin necesidad.
Si alguna futura funcionalidad requiere procesamiento externo, deberá justificarse y gestionarse adecuadamente.
 
⸻
 
20. RENDIMIENTO
El análisis no debe bloquear la interfaz.
Mientras se procesa una fotografía, mostrar un estado apropiado, por ejemplo:
Analizando colores…
Al finalizar:
Paleta detectada
Evitar congelar la aplicación.
 
⸻
 
21. PREPARACIÓN PARA LA FASE 6
El resultado debe poder alimentar posteriormente un sistema de recomendaciones.
La siguiente fase necesitará información suficiente para responder preguntas como:
* ¿Qué color combina mejor?
* ¿Qué color puede utilizarse como acento?
* ¿Qué color funciona para botones?
* ¿Qué color necesita texto blanco?
* ¿Qué color necesita texto oscuro?
* ¿Qué combinación es visualmente equilibrada?
La FASE 5 únicamente proporciona los datos.
La FASE 6 será la encargada de convertir esos datos en recomendaciones completas.
 
⸻
 
22. CRITERIOS DE FINALIZACIÓN
La fase se considera terminada cuando:
* JC Fitness puede analizar una fotografía.
* Detecta varios colores relevantes.
* Identifica colores dominantes.
* Identifica colores claros y oscuros.
* Analiza saturación y luminosidad.
* Detecta colores neutros.
* Puede identificar colores destacados aunque no sean predominantes.
* Genera una paleta estructurada.
* La paleta queda asociada a la fotografía correcta.
* El análisis puede reutilizarse sin repetirlo innecesariamente.
* No modifica automáticamente la configuración del usuario.
* No altera la fotografía original.
* Funciona con fotografías muy claras, oscuras y monocromáticas.
* No bloquea la interfaz.
* No rompe ninguna función existente.
* Los resultados quedan preparados para el sistema de recomendaciones de la FASE 6.
 
⸻
 
23. REGLA PARA CLAUDE
No implementar simplemente un selector que extraiga cinco colores aleatorios de la fotografía.
El detector debe generar información cromática útil para diseñar la interfaz.
La finalidad de esta fase es construir el cerebro cromático que posteriormente permitirá:
FOTO → ANÁLISIS → PALETAS → RECOMENDACIÓN → APLICACIÓN
Pero en esta fase NO aplicar automáticamente ninguna recomendación.
El usuario mantiene el control total hasta la siguiente fase.

FASE 4 — SISTEMA AVANZADO DE COLORES

Esta fase crea la capa de personalización cromática que funcionará junto al fondo. Todavía no hacemos el detector automático de colores ni el botón “Recomendado”; eso será la Fase 5 y 6.

FASE 4 — SISTEMA AVANZADO DE COLORES

1. OBJETIVO

Crear un sistema completo que permita al usuario controlar manualmente los colores de la interfaz de JC Fitness.

La fotografía de fondo y los colores deben ser sistemas relacionados, pero independientes.

El usuario debe poder:

* utilizar una fotografía;
* utilizar colores;
* combinar fotografía + colores;
* modificar los colores manualmente;
* volver a los colores predeterminados.

La prioridad en esta fase es ofrecer libertad de personalización.

⸻

2. ESTRUCTURA DE LA PERSONALIZACIÓN

Dentro de Aspecto debe existir una sección claramente organizada:

Fondo

Colores

Modo de apariencia

La sección Colores debe permitir modificar los elementos visuales principales sin necesidad de editar código ni utilizar configuraciones técnicas.

⸻

3. COLOR PRINCIPAL

Permitir seleccionar el color principal de JC Fitness.

Este color debe utilizarse en los elementos que actualmente dependan del color/acento principal.

Por ejemplo:

* elementos destacados;
* indicadores;
* controles seleccionados;
* estados activos;
* determinados botones;
* iconos destacados.

No asumir que absolutamente todos los elementos deben adoptar este color.

Mantener una jerarquía visual coherente.

⸻

4. COLOR SECUNDARIO

Añadir un segundo color configurable.

Debe poder combinarse con el principal para crear una apariencia más rica.

Debe existir independencia entre:

Principal

y

Secundario

para que el usuario pueda crear combinaciones personalizadas.

⸻

5. COLOR DE ACENTO

Permitir definir un color específico para elementos que necesiten mayor protagonismo.

Debe poder utilizarse para:

* llamadas a la acción;
* indicadores;
* elementos importantes;
* estados seleccionados;
* determinados detalles visuales.

La arquitectura debe permitir que el usuario pueda modificarlo independientemente.

⸻

6. COLORES DE BOTONES

Permitir configurar los botones de la aplicación.

Como mínimo contemplar:

* fondo;
* texto;
* icono;
* estado activo;
* estado seleccionado.

No hacer que todos los botones sean obligatoriamente idénticos si el sistema actual permite diferentes jerarquías.

⸻

7. COLORES DE TARJETAS

Permitir personalizar las tarjetas y superficies de contenido.

Contemplar:

* fondo;
* borde;
* transparencia;
* elementos destacados.

Esto será especialmente importante cuando exista una fotografía detrás.

⸻

8. COLORES DE TEXTO

Crear una jerarquía de texto.

Como mínimo:

Texto principal

Para títulos y contenido importante.

Texto secundario

Para información complementaria.

Texto atenuado

Para información de menor prioridad.

Texto sobre elementos destacados

Para botones y superficies de color.

No permitir combinaciones que hagan desaparecer visualmente el texto.

El sistema de legibilidad inteligente de la FASE 9 realizará controles automáticos más avanzados.

⸻

9. ICONOS

Permitir configurar el color de los iconos cuando corresponda.

Diferenciar entre:

* iconos normales;
* iconos activos;
* iconos destacados;
* iconos secundarios.

No forzar un único color para todos si eso perjudica la jerarquía visual.

⸻

10. NAVEGACIÓN

La barra de navegación inferior debe integrarse con el sistema de colores.

Debe poder definir:

* fondo;
* icono activo;
* iconos inactivos;
* texto activo;
* texto inactivo;
* borde/divisor si existe.

La navegación debe seguir siendo perfectamente legible.

⸻

11. DEGRADADOS

Preparar soporte para degradados.

El usuario debe poder utilizar posteriormente configuraciones como:

Color A → Color B

y elegir, cuando proceda:

* dirección;
* intensidad;
* transparencia.

La implementación debe estar preparada para combinar degradados con el resto del sistema.

⸻

12. TRANSPARENCIA

Los elementos visuales que técnicamente puedan admitir transparencia deben poder utilizarla.

Especialmente:

* tarjetas;
* navegación;
* overlays;
* superficies;
* determinados botones.

Esto permitirá conseguir efectos visuales como:

Fotografía + tarjeta translúcida + color de acento

sin necesidad de crear diseños independientes.

⸻

13. SELECTOR DE COLOR

El usuario debe disponer de un selector de color cómodo.

Debe poder:

* elegir visualmente;
* modificar el tono;
* modificar saturación;
* modificar luminosidad;
* introducir un valor hexadecimal cuando resulte conveniente;
* visualizar el color seleccionado.

No limitar al usuario a una pequeña lista de colores predeterminados.

La finalidad es ofrecer verdadera libertad.

⸻

14. COLORES PREDETERMINADOS

Mantener las paletas actuales de JC Fitness.

Además, poder ofrecer algunas combinaciones predeterminadas.

Por ejemplo:

* JC Fitness.
* Azul.
* Oscuro.
* Minimalista.
* Alto contraste.

Estos presets no deben eliminar la posibilidad de personalización manual.

⸻

15. RESTABLECER COLORES

Añadir:

Restablecer colores

Esta acción devuelve todos los colores a la configuración oficial de JC Fitness.

Debe existir confirmación si existe riesgo de perder una configuración personalizada.

Restablecer colores NO debe eliminar:

* fotografías;
* fondos;
* configuraciones fotográficas.

Debe afectar exclusivamente al sistema cromático.

⸻

16. GUARDADO INDEPENDIENTE

La configuración de colores debe guardarse independientemente de la fotografía.

Por ejemplo:

Foto A + Paleta azul

Después:

Foto A + Paleta roja

El usuario debe poder cambiar de una configuración a otra sin que la fotografía sea modificada.

Esta separación será fundamental para las fases posteriores.

⸻

17. COMBINACIÓN FOTO + COLOR

El sistema debe permitir explícitamente:

Fondo fotográfico
+
Colores personalizados

La fotografía no debe obligar a utilizar los colores detectados automáticamente.

El usuario siempre debe poder decidir manualmente.

⸻

18. VISTA PREVIA

Cada cambio de color debe visualizarse inmediatamente.

El usuario debe poder comprobar:

* fondo;
* botones;
* tarjetas;
* navegación;
* textos;
* iconos;
* elementos destacados.

No obligar a guardar antes de poder visualizar el resultado.

⸻

19. CANCELAR CAMBIOS

Debe existir una opción para cancelar una edición de colores.

Si el usuario entra en:

Editar colores

y realiza cambios pero pulsa:

Cancelar

se debe recuperar exactamente la configuración anterior.

No aplicar cambios parcialmente.

⸻

20. APLICAR

Al pulsar:

Aplicar

se guarda la nueva configuración cromática y se convierte en la configuración activa.

La aplicación debe actualizarse inmediatamente.

No recargar toda la página.

⸻

21. COMPATIBILIDAD CON EL FONDO

Los colores deben funcionar independientemente de que el fondo sea:

* ninguno;
* sólido;
* degradado;
* fotografía;
* predeterminado.

No crear reglas rígidas que impidan utilizar cualquier combinación.

La fase 9 se encargará posteriormente de detectar y corregir automáticamente problemas de legibilidad.

⸻

22. MODO OSCURO Y CLARO

Los colores personalizados deben integrarse con el modo claro/oscuro existente.

Cambiar el modo no debe destruir la configuración personalizada.

Si la arquitectura actual requiere diferentes valores para cada modo, permitirlo.

Pero no duplicar configuraciones innecesariamente.

⸻

23. SISTEMA CENTRALIZADO

Todos los componentes deben obtener sus colores del mismo sistema.

No permitir que cada pantalla tenga colores codificados individualmente.

La arquitectura debe seguir una lógica equivalente a:

Tema global
↓
Tokens de color
↓
Componentes
↓
Pantallas

Esto permitirá cambiar toda la apariencia desde un único lugar.

⸻

24. PREPARACIÓN PARA EL DETECTOR

La estructura debe permitir que posteriormente la FASE 5 pueda proporcionar automáticamente una paleta.

Por ejemplo:

Foto
→ colores detectados
→ colores candidatos
→ sistema de colores
→ interfaz

Pero en esta fase NO implementar el detector.

⸻

25. PREPARACIÓN PARA «RECOMENDADO»

También debe quedar preparado el mecanismo para que posteriormente una configuración automática pueda sustituir temporalmente o proponer:

* color principal;
* secundario;
* acento;
* botones;
* tarjetas;
* textos;
* navegación.

La arquitectura debe permitir recibir una configuración completa y aplicarla como una unidad.

⸻

26. CRITERIOS DE FINALIZACIÓN

La FASE 4 se considera terminada cuando:

* Existe un sistema centralizado de colores.
* Se puede cambiar el color principal.
* Se puede cambiar el secundario.
* Se puede cambiar el acento.
* Se pueden personalizar botones.
* Se pueden personalizar tarjetas.
* Se pueden personalizar textos.
* Se pueden personalizar iconos.
* Se puede personalizar la navegación.
* Existe soporte para degradados.
* Existe soporte para transparencia donde corresponda.
* Existe selector de color avanzado.
* Se pueden introducir valores HEX.
* Existe vista previa en tiempo real.
* Se pueden cancelar cambios.
* Se pueden aplicar cambios.
* Se pueden restablecer los colores.
* La configuración persiste.
* Los colores funcionan junto a fotografías.
* No se rompe el modo claro/oscuro.
* No se rompe ninguna funcionalidad existente.
* La arquitectura queda preparada para recibir paletas automáticas.

⸻

27. REGLA PARA CLAUDE

No reducir esta fase a cambiar un único color de acento.

El objetivo es crear un sistema de personalización cromática completo.

El usuario debe sentir que tiene control real sobre la apariencia de JC Fitness.

Sin embargo, no introducir todavía:

* detección automática de colores;
* IA;
* botón «Recomendado»;
* análisis de fotografía;
* contraste automático avanzado.

Eso comenzará en las siguientes fases.
FASE 3 — EDITOR DE FOTOGRAFÍA
Ahora vamos a convertir la foto seleccionada en un fondo totalmente configurable. La idea es que no importe si la foto es vertical, horizontal, tiene al sujeto en un lado concreto o necesita oscurecerse: el usuario debe poder adaptarla a su gusto.
FASE 3 — EDITOR DE FOTOGRAFÍA
1. OBJETIVO
Desarrollar el editor visual de fotografías que aparecen como fondo de JC Fitness.
El usuario debe poder modificar cómo se presenta la fotografía sin modificar el archivo original de su galería.
La experiencia debe ser:
Elegir foto → Editar → Vista previa en tiempo real → Aplicar
Esta fase debe trabajar sobre el sistema creado en las FASES 1 y 2.
 
⸻
 
2. REGLA PRINCIPAL
La fotografía original nunca debe modificarse.
Los ajustes deben guardarse como configuración del fondo.
Por ejemplo:
Foto original + posición + zoom + opacidad + desenfoque + oscurecimiento + overlay
De esta forma, el usuario puede volver a modificar los ajustes posteriormente.
 
⸻
 
3. VISTA PREVIA EN TIEMPO REAL
El editor debe mostrar una representación de JC Fitness con la fotografía aplicada.
Cada modificación debe verse inmediatamente.
No obligar al usuario a guardar y volver atrás para comprobar el resultado.
Ejemplo:
Zoom +
→ la imagen aumenta inmediatamente.
Desenfoque +
→ el desenfoque aparece inmediatamente.
Oscurecer +
→ la imagen se oscurece inmediatamente.
 
⸻
 
4. ZOOM
Añadir control de zoom.
Debe permitir:
* Alejar.
* Acercar.
* Volver al zoom inicial.
El zoom debe tener límites razonables para evitar configuraciones absurdas.
Debe poder utilizarse tanto mediante control deslizante como mediante gestos si la implementación móvil lo permite.
 
⸻
 
5. POSICIÓN HORIZONTAL
Permitir desplazar la fotografía horizontalmente.
Esto es especialmente importante cuando el sujeto principal de una fotografía está situado a la izquierda o derecha.
Ejemplo:
←────────●────────→
El usuario decide qué parte de la fotografía queda visible.
 
⸻
 
6. POSICIÓN VERTICAL
Permitir desplazar la fotografía verticalmente.
Esto permite corregir fotografías en las que:
* la cara queda demasiado arriba;
* el cuerpo queda cortado;
* hay demasiado espacio vacío;
* el elemento principal queda oculto.
 
⸻
 
7. ENCUADRE
El sistema debe conservar un encuadre coherente.
Nunca deformar la fotografía.
Nunca estirarla artificialmente.
La relación de aspecto original debe conservarse.
 
⸻
 
8. DESENFOQUE
Añadir un control opcional de desenfoque.
Por ejemplo:
Desenfoque
──────●──────
El usuario puede utilizarlo para conseguir un fondo más discreto y permitir que la interfaz destaque.
Debe existir una posición equivalente a:
0 = sin desenfoque
 
⸻
 
9. OSCURECIMIENTO
Añadir control para oscurecer la fotografía.
Esto permitirá utilizar fotografías claras sin que dificulten la lectura de la interfaz.
Ejemplo:
Oscurecimiento
────●────────
Debe poder utilizarse desde un valor mínimo hasta uno suficientemente alto para crear un fondo oscuro.
 
⸻
 
10. ACLARADO
Si la arquitectura lo permite sin duplicar innecesariamente controles, también debe contemplarse un ajuste equivalente para aclarar ligeramente una fotografía oscura.
No debe provocar pérdida exagerada de contraste.
 
⸻
 
11. OPACIDAD
Añadir control de opacidad de la fotografía.
Esto permite combinar la fotografía con el fondo de JC Fitness.
Ejemplo:
Opacidad
────────●──
Esto será especialmente útil cuando posteriormente se combinen:
foto + colores de interfaz + overlay
 
⸻
 
12. OVERLAY
Preparar un sistema de capa superpuesta sobre la fotografía.
El overlay podrá utilizar posteriormente:
* color;
* transparencia;
* intensidad.
En esta fase puede implementarse el mecanismo básico.
Su objetivo es permitir que la fotografía pueda integrarse visualmente con el resto de la interfaz.
 
⸻
 
13. RESTABLECER AJUSTES
Debe existir una acción:
Restablecer
que devuelva la fotografía a sus valores originales:
* Zoom inicial.
* Posición centrada.
* Sin desenfoque.
* Sin oscurecimiento.
* Opacidad normal.
* Overlay desactivado.
Esto no elimina la fotografía.
Simplemente elimina sus ajustes.
 
⸻
 
14. CANCELAR CAMBIOS
El usuario debe poder editar una fotografía y pulsar:
Cancelar
En ese caso:
* no se aplican los cambios;
* se mantiene la configuración anterior;
* no se modifica el fondo activo.
Esto debe funcionar correctamente incluso después de realizar muchos cambios.
 
⸻
 
15. APLICAR CAMBIOS
Cuando el usuario pulse:
Aplicar
se guardará la configuración actual.
El fondo activo deberá actualizarse inmediatamente.
No debería ser necesario recargar la aplicación.
 
⸻
 
16. CAMBIAR DE FOTO DESDE EL EDITOR
El editor debe permitir volver a seleccionar otra fotografía.
Flujo:
Editar → Cambiar foto → Seleccionar nueva foto → Nuevo editor → Aplicar
Los ajustes de la fotografía anterior no deben transferirse accidentalmente a la nueva imagen si no tiene sentido hacerlo.
 
⸻
 
17. INTERFAZ DEL EDITOR
La interfaz debe ser sencilla.
Priorizar:
Vista previa
Grande y protagonista.
Controles
Debajo o mediante panel desplegable.
Controles principales:
* Zoom.
* Horizontal.
* Vertical.
* Desenfoque.
* Oscurecimiento.
* Aclarado, si procede.
* Opacidad.
* Overlay.
No llenar la pantalla de controles simultáneamente.
Utilizar secciones desplegables si resulta necesario.
 
⸻
 
18. EXPERIENCIA MÓVIL
El editor debe estar diseñado principalmente para móvil.
Debe funcionar correctamente mediante:
* toque;
* desplazamiento;
* sliders;
* gestos cuando sea posible.
Los controles deben tener suficiente tamaño para poder utilizarlos cómodamente con el dedo.
No crear una interfaz pensada únicamente para escritorio.
 
⸻
 
19. RENDIMIENTO
Los cambios del editor deben ser fluidos.
Evitar:
* congelaciones;
* parpadeos;
* recargas;
* renders innecesarios;
* pérdida de posición;
* retrasos perceptibles.
Si aplicar determinados efectos directamente resulta demasiado costoso, utilizar una estrategia de previsualización optimizada sin modificar la calidad final de la fotografía más de lo necesario.
 
⸻
 
20. GUARDADO DE CONFIGURACIÓN
La configuración debe quedar vinculada a la fotografía correspondiente.
Por ejemplo:
Foto A
* Zoom: X
* Posición: X/Y
* Blur: X
* Overlay: X
* Opacidad: X
Si posteriormente se vuelve a utilizar esa fotografía, la arquitectura debe permitir recuperar sus ajustes.
 
⸻
 
21. COMPATIBILIDAD CON LAS FASES ANTERIORES
No romper:
* Sistema de fondos.
* Selección de fotografías.
* Colores existentes.
* Modo oscuro.
* Modo claro.
* Navegación.
* Dashboard.
* Entrenamiento.
* Economía.
* Sueño.
* Ajustes.
El editor debe funcionar encima del sistema existente, no sustituirlo.
 
⸻
 
22. PREPARACIÓN PARA LA FASE 4
La siguiente fase será el SISTEMA DE COLORES.
Por ello, el editor debe dejar preparada la posibilidad de combinar posteriormente:
Fotografía + Overlay + Paleta de colores + Botones + Textos + Iconos + Tarjetas
No implementar todavía el detector inteligente ni las recomendaciones automáticas.
 
⸻
 
23. CRITERIOS DE FINALIZACIÓN
La fase está terminada cuando:
* Se puede editar una fotografía seleccionada.
* Se puede modificar el zoom.
* Se puede modificar la posición horizontal.
* Se puede modificar la posición vertical.
* Se puede ajustar el encuadre.
* Se puede aplicar desenfoque.
* Se puede oscurecer.
* Se puede ajustar la opacidad.
* Existe sistema de overlay.
* Existe restablecimiento.
* Existe cancelación.
* Existe aplicación de cambios.
* La vista previa funciona en tiempo real.
* Los ajustes se conservan correctamente.
* La fotografía original no se modifica.
* La experiencia funciona correctamente en móvil.
* No se rompe ninguna funcionalidad existente.
 
⸻
 
24. REGLA PARA CLAUDE
No convertir el editor en un conjunto de filtros independientes sin conexión.
Debe existir una única configuración coherente del fondo fotográfico.
El usuario debe sentir que está colocando y adaptando su fotografía dentro de JC Fitness, no simplemente aplicándole filtros.
La siguiente fase se encargará específicamente del sistema de colores.

FASE 2 — GALERÍA Y SELECCIÓN DE FOTOGRAFÍAS

Esta fase se centra exclusivamente en conseguir que el usuario pueda elegir una fotografía de su propio dispositivo y utilizarla como fondo de JC Fitness de una forma premium, sencilla y totalmente integrada con el sistema creado en la Fase 1.

No desarrollar todavía el detector de colores ni las recomendaciones automáticas. Eso vendrá después.

FASE 2 — GALERÍA Y SELECCIÓN DE FOTOGRAFÍAS

1. OBJETIVO

Implementar el sistema mediante el cual el usuario puede seleccionar una fotografía de su dispositivo y convertirla en el fondo de JC Fitness.

La experiencia debe ser:

Aspecto → Fondo → Foto → Galería → Seleccionar → Vista previa → Aplicar

Debe sentirse como una función nativa, sencilla y premium.

⸻

2. ACCESO A LA GALERÍA

Dentro del apartado de fondos debe existir una opción claramente identificable:

📷 Fotos

Al pulsarla, se debe utilizar el mecanismo correspondiente del dispositivo para permitir al usuario seleccionar una imagen de su galería.

Debe funcionar correctamente en:

* iPhone.
* Android.
* Navegadores móviles compatibles.
* PWA instalada.

No solicitar permisos innecesarios.

⸻

3. SELECCIÓN DE IMAGEN

El usuario debe poder seleccionar una fotografía de su dispositivo.

Una vez seleccionada:

NO aplicar inmediatamente la fotografía.

Primero debe aparecer una vista previa.

Flujo:

Seleccionar foto
↓
Vista previa
↓
Editar/ajustar
↓
Aplicar

Esto evita que el usuario tenga que aceptar una configuración que no le gusta.

⸻

4. VISTA PREVIA

La fotografía debe mostrarse dentro de una representación visual de JC Fitness.

La vista previa debe enseñar aproximadamente cómo quedará:

* Fondo.
* Barra de navegación.
* Botones.
* Tarjetas.
* Textos.
* Iconos.

El objetivo es que el usuario pueda comprobar inmediatamente si la fotografía funciona bien como fondo.

No crear todavía el sistema inteligente de colores.

⸻

5. ADAPTACIÓN A LA PANTALLA

La fotografía debe adaptarse automáticamente a la pantalla del dispositivo.

Debe contemplar:

* Fotografías verticales.
* Fotografías horizontales.
* Fotografías cuadradas.
* Fotografías panorámicas.

Nunca debe deformarse la imagen.

Utilizar un comportamiento equivalente a:

cover

cuando sea apropiado.

La imagen debe mantener siempre sus proporciones.

⸻

6. ENCUADRE INICIAL

Cuando se seleccione una fotografía, JC Fitness debe generar automáticamente un encuadre inicial razonable.

Por ejemplo:

* Centrar la imagen.
* Mantener la proporción.
* Cubrir correctamente la pantalla.
* Evitar espacios vacíos.

Este será solamente el encuadre inicial.

El usuario podrá modificarlo en la FASE 3.

⸻

7. FOTOGRAFÍA ACTIVA

Cuando el usuario pulse:

Aplicar

la fotografía pasará a convertirse en el fondo activo.

El sistema de la FASE 1 deberá actualizarse.

Debe quedar registrado que:

Tipo de fondo = fotografía

y cuál es la fotografía seleccionada.

⸻

8. CAMBIAR DE FOTOGRAFÍA

Debe existir una opción:

Cambiar foto

El usuario podrá seleccionar otra fotografía sin tener que eliminar primero la actual.

Flujo:

Foto actual
→ Cambiar
→ Galería
→ Nueva foto
→ Vista previa
→ Aplicar

⸻

9. ELIMINAR FONDO FOTOGRÁFICO

Debe existir una acción:

Quitar foto

Al hacerlo:

* La fotografía deja de ser el fondo activo.
* JC Fitness vuelve al fondo anterior o al fondo predeterminado según la lógica establecida en la FASE 1.
* La fotografía no debe eliminarse definitivamente del sistema si posteriormente se quiere implementar recuperación.

La gestión completa de eliminados se desarrollará en la FASE 12.

⸻

10. ESTADO SIN FOTOGRAFÍA

Si el usuario todavía no ha seleccionado ninguna fotografía, mostrar una interfaz clara.

Ejemplo conceptual:

Fondo fotográfico

«Personaliza JC Fitness con una foto de tu galería.»

[ Elegir foto ]

No mostrar espacios rotos ni elementos vacíos.

⸻

11. INFORMACIÓN DE LA FOTO

La arquitectura debe poder conservar información básica de la imagen seleccionada.

Por ejemplo:

* Identificador.
* Fuente.
* Formato.
* Anchura.
* Altura.
* Proporción.
* Tamaño.
* Fecha de incorporación, si resulta útil.

No mostrar toda esta información al usuario necesariamente.

Debe existir principalmente para que el sistema pueda gestionar correctamente la fotografía.

⸻

12. OPTIMIZACIÓN INICIAL

No cargar innecesariamente una imagen gigantesca si el dispositivo no lo necesita.

La arquitectura debe estar preparada para trabajar con fotografías de alta resolución sin provocar:

* bloqueos;
* consumo excesivo de memoria;
* desplazamientos lentos;
* tiempos de carga innecesarios.

La optimización avanzada se desarrollará específicamente en la FASE 11.

⸻

13. PERSISTENCIA

Una vez aplicada la fotografía:

Cerrar JC Fitness
↓
Volver a abrir
↓
La fotografía continúa como fondo

Utilizar el sistema de persistencia establecido en la FASE 1.

No crear un sistema paralelo.

⸻

14. CAMBIO ENTRE TIPOS DE FONDO

El usuario debe poder cambiar libremente entre:

Foto
↔
Color
↔
Degradado
↔
Predeterminado
↔
Sin fondo

Seleccionar una fotografía no debe borrar la configuración de color existente.

Esto es especialmente importante porque en fases posteriores el usuario podrá volver a utilizar esa configuración.

⸻

15. EXPERIENCIA DE USUARIO

La interfaz debe ser clara y visual.

Dentro del selector de fondos, mostrar opciones diferenciadas:

📷 Foto

🎨 Color

🌈 Degradado

✨ Predeterminado

○ Ninguno

La fotografía actualmente seleccionada debe aparecer claramente marcada.

⸻

16. TRANSICIÓN VISUAL

Cuando se aplique una nueva fotografía:

* No hacer un cambio brusco.
* Utilizar una transición suave.
* Evitar parpadeos.
* Evitar que la pantalla quede momentáneamente sin fondo.

La transición debe ser rápida y elegante.

⸻

17. COMPATIBILIDAD CON EL SISTEMA ACTUAL

Esta fase no debe modificar ni romper:

* Dashboard.
* Entrenamiento.
* Economía.
* Sueño.
* Ajustes.
* Navegación.
* Modo oscuro.
* Modo claro.
* Colores actuales.
* Componentes existentes.

La nueva fotografía debe incorporarse al sistema visual sin alterar funcionalidades no relacionadas.

⸻

18. PREPARACIÓN PARA LA FASE 3

La información obtenida de la fotografía debe quedar preparada para que la siguiente fase pueda implementar:

* Zoom.
* Posición.
* Encuadre.
* Desplazamiento.
* Desenfoque.
* Oscurecimiento.
* Transparencia.
* Overlay.
* Ajustes visuales.

No desarrollar esas herramientas todavía.

La FASE 2 solamente debe proporcionar una fotografía correctamente seleccionada, almacenada y mostrada.

⸻

19. CRITERIOS DE FINALIZACIÓN

La fase se considera terminada cuando:

* El usuario puede seleccionar una fotografía desde su galería.
* La fotografía aparece correctamente en una vista previa.
* La fotografía mantiene sus proporciones.
* Se adapta correctamente a diferentes tamaños de pantalla.
* El usuario puede cancelar la selección.
* El usuario puede aplicar la fotografía.
* El usuario puede cambiarla.
* El usuario puede quitarla.
* La selección persiste al cerrar y abrir la aplicación.
* Se puede cambiar entre foto, color, degradado y predeterminado.
* No se pierde accidentalmente la configuración anterior.
* No se rompe ninguna funcionalidad existente.
* La experiencia funciona correctamente en móvil.
* La arquitectura queda preparada para el editor avanzado de la FASE 3.

⸻

20. REGLA PARA CLAUDE

No convertir esta fase en un simple selector de archivos.

La fotografía debe formar parte del sistema de personalización visual de JC Fitness creado en la FASE 1.

La experiencia debe sentirse integrada, premium, rápida y preparada para las siguientes fases.

No implementar todavía:

* detector de colores;
* recomendaciones;
* paletas automáticas;
* editor fotográfico avanzado;
* presets;
* sistema de contraste inteligente.

Esas funciones pertenecen a fases posteriores.
Perfecto. Empezamos por la FASE 1 de 12. Esta primera fase no debe intentar hacer todavía el detector de colores, recomendaciones ni editor avanzado: su objetivo es dejar construida la arquitectura sólida del sistema de fondos para que las siguientes fases se apoyen sobre ella.
FASE 1 — ARQUITECTURA DEL SISTEMA DE FONDOS
1. OBJETIVO DE ESTA FASE
Crear la arquitectura completa y escalable del nuevo sistema de fondos visuales de JC Fitness.
El objetivo es preparar la aplicación para que el usuario pueda personalizar completamente el fondo de la interfaz mediante diferentes tipos de fondo, sin romper el sistema actual de apariencia, colores, modo oscuro, tarjetas, botones, navegación ni demás elementos visuales.
IMPORTANTE: en esta fase NO se deben desarrollar todavía las funciones avanzadas de edición fotográfica, detección inteligente de colores ni recomendaciones automáticas. Esas funcionalidades pertenecen a fases posteriores.
Esta fase debe dejar preparada la estructura necesaria para incorporarlas posteriormente sin tener que rehacer el sistema.
 
⸻
 
2. PRINCIPIO FUNDAMENTAL
El fondo debe convertirse en un elemento independiente dentro del sistema global de apariencia.
La aplicación no debe tratar una fotografía simplemente como una imagen colocada detrás de la interfaz.
Debe existir un sistema centralizado capaz de determinar:
* qué tipo de fondo está activo;
* qué fondo concreto utiliza el usuario;
* cómo debe mostrarse;
* qué configuración visual tiene;
* qué colores utiliza la interfaz sobre él;
* qué ajustes adicionales podrán añadirse posteriormente.
La arquitectura debe estar preparada para crecer.
 
⸻
 
3. TIPOS DE FONDO
El sistema debe contemplar desde el principio estos tipos:
A. Sin fondo
La interfaz utiliza el fondo normal de JC Fitness.
B. Color sólido
El usuario puede utilizar posteriormente un color como fondo.
C. Degradado
Preparar la arquitectura para fondos con degradados.
No es necesario desarrollar todavía un editor avanzado de degradados.
D. Fotografía
Preparar el sistema para utilizar una fotografía personal del usuario.
La fotografía podrá proceder posteriormente de la galería del dispositivo.
E. Fondo predeterminado
Preparar un sistema para que JC Fitness pueda ofrecer fondos incluidos de forma predeterminada.
 
⸻
 
4. MODELO CENTRAL DEL FONDO
Crear un único estado/configuración central para controlar el fondo actual.
Conceptualmente debe poder almacenar información equivalente a:
* type
* source
* image
* color
* gradient
* position
* scale
* opacity
* blur
* overlay
* isActive
No es obligatorio utilizar exactamente estos nombres si la arquitectura existente utiliza otra nomenclatura, pero debe existir la misma capacidad funcional.
El modelo debe ser extensible.
Por ejemplo, en fases posteriores podremos añadir:
* análisis de colores;
* paleta recomendada;
* contraste automático;
* presets;
* filtros;
* ajustes fotográficos;
* configuraciones guardadas.
 
⸻
 
5. SISTEMA ÚNICO DE APARIENCIA
El nuevo sistema de fondos debe integrarse con el sistema de apariencia existente.
No crear un sistema independiente que compita con el actual.
Debe existir una relación clara:
APARIENCIA GLOBAL → modo claro/oscuro → colores → fondo → botones → tarjetas → navegación → textos → iconos → demás elementos visuales
El fondo debe poder cambiar sin romper el resto de la apariencia.
 
⸻
 
6. PRIORIDAD DEL FONDO
Definir claramente qué fondo tiene prioridad cuando existan diferentes configuraciones.
La lógica inicial debe ser:
Fondo seleccionado por el usuario ↓ si no existe ↓ fondo predeterminado ↓ si tampoco existe ↓ fondo normal de JC Fitness
Nunca debe aparecer un fondo vacío, roto o indefinido.
 
⸻
 
7. PREPARACIÓN PARA FOTOGRAFÍAS
Aunque la selección desde galería se desarrollará en la FASE 2, esta fase debe dejar preparada la arquitectura para almacenar y representar una fotografía.
La aplicación debe poder identificar:
* fotografía activa;
* identificador de la fotografía;
* origen;
* tamaño;
* proporción;
* configuración visual asociada.
No implementar todavía el editor de fotografía.
 
⸻
 
8. PREPARACIÓN PARA COLORES
El sistema debe estar preparado para que posteriormente una fotografía pueda generar información cromática.
Por ejemplo:
Fotografía → colores detectados → paleta → recomendación → aplicación de colores
En esta fase solamente se prepara la arquitectura necesaria.
NO desarrollar todavía el detector.
 
⸻
 
9. PREPARACIÓN PARA RECOMENDACIONES
La estructura debe permitir posteriormente guardar algo equivalente a:
Fondo actual + Paleta recomendada + Configuración de interfaz recomendada
Esto permitirá que en fases posteriores el sistema pueda generar automáticamente una apariencia completa basada en la fotografía.
 
⸻
 
10. COMPATIBILIDAD CON MODO OSCURO Y CLARO
El sistema de fondos debe funcionar independientemente del modo:
* Claro.
* Oscuro.
* Sistema/automático si ya existe en JC Fitness.
Cambiar entre claro y oscuro no debe eliminar ni modificar accidentalmente el fondo seleccionado.
La arquitectura debe permitir que posteriormente se puedan definir comportamientos específicos para cada modo si fuese necesario.
 
⸻
 
11. COMPONENTE CENTRALIZADO
Crear, adaptar o establecer un componente/controlador central encargado de proporcionar el fondo actual a toda la aplicación.
La finalidad es evitar que cada pantalla gestione su propio fondo.
Todas las pantallas deben obtener la información del mismo sistema.
Ejemplo conceptual:
Sistema de apariencia ↓ Sistema de fondos ↓ Fondo activo ↓ Toda la aplicación
Esto será especialmente importante cuando se incorporen fotografías y configuraciones complejas.
 
⸻
 
12. PERSISTENCIA
La configuración seleccionada debe poder guardarse.
Si el usuario:
elige un fondo → cierra JC Fitness → vuelve a abrirlo
el fondo debe continuar seleccionado.
Utilizar el sistema de persistencia que corresponda a la arquitectura actual de JC Fitness.
No crear una segunda base de datos innecesaria si ya existe un sistema adecuado.
Si la aplicación utiliza Supabase para la configuración del usuario, la arquitectura debe quedar preparada para sincronizar posteriormente esta información.
 
⸻
 
13. CAMBIO DE FONDO
Preparar una función central equivalente a:
Seleccionar fondo
que permita cambiar posteriormente entre:
* ninguno;
* color;
* degradado;
* fotografía;
* predeterminado.
El cambio debe actualizar la interfaz de forma reactiva.
No debería ser necesario recargar la página completa.
 
⸻
 
14. RESTABLECER
Debe existir desde la arquitectura una acción de:
Restablecer fondo
Esta acción devolverá la aplicación al fondo predeterminado de JC Fitness.
No debe eliminar definitivamente fotografías ni configuraciones guardadas.
Simplemente cambia el fondo activo.
La gestión avanzada de eliminados y recuperación se desarrollará posteriormente.
 
⸻
 
15. PREPARACIÓN PARA LAS SIGUIENTES FASES
La arquitectura creada en esta fase debe permitir incorporar posteriormente, sin rehacer el sistema:
FASE 2
Galería y selección de fotografías.
FASE 3
Editor fotográfico.
FASE 4
Sistema avanzado de colores.
FASE 5
Detector inteligente de colores.
FASE 6
Sistema de recomendaciones.
FASE 7
Personalización manual.
FASE 8
Presets.
FASE 9
Legibilidad automática.
FASE 10
Integración completa con Aspecto.
FASE 11
Rendimiento y optimización.
FASE 12
Guardado, eliminación y recuperación.
 
⸻
 
16. RESTRICCIONES IMPORTANTES
En esta fase NO implementar:
* detector de colores;
* IA de recomendaciones;
* editor fotográfico avanzado;
* filtros fotográficos;
* presets completos;
* sistema de eliminados;
* análisis automático de contraste;
* editor avanzado de degradados.
Todo eso pertenece a fases posteriores.
Esta fase debe centrarse exclusivamente en construir una base limpia, estable y escalable.
 
⸻
 
17. CRITERIOS DE FINALIZACIÓN
La FASE 1 se considera terminada únicamente cuando:
* Existe un sistema central de fondos.
* Se pueden representar los diferentes tipos de fondo previstos.
* El fondo está integrado con el sistema global de apariencia.
* La configuración puede persistir.
* El cambio de fondo es reactivo.
* Existe una opción de restablecimiento.
* La arquitectura está preparada para fotografías.
* La arquitectura está preparada para colores y degradados.
* La arquitectura permite añadir posteriormente análisis y recomendaciones.
* No se rompe el modo claro/oscuro.
* No se rompe ninguna pantalla existente.
* No se duplican sistemas de apariencia innecesariamente.
* El código queda organizado para que las siguientes fases puedan desarrollarse encima de esta base.
 
⸻
 
18. REGLA PRINCIPAL PARA CLAUDE
No limitar esta arquitectura a la implementación mínima de una imagen de fondo.
