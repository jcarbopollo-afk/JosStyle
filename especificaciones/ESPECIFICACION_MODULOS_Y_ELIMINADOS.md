> **Nota de procedencia:** transcripción íntegra y sin resumir del bloque «LIBERTAD DE APARTADOS + ELIMINADOS RECIENTEMENTE — 4 fases» del documento
> `JC_FITNESS___ESTILO_DE_HOMBRE.txt` que Josué pegó en el chat (líneas 27163–28170 del original completo,
> conservado sin tocar en `ORIGINAL_JC_FITNESS_ESTILO_DE_HOMBRE.txt`).
>
> **No editar ni resumir este contenido.** Si Josué amplía o corrige el texto, añadir lo nuevo o
> sustituir el apartado afectado, nunca recortar apartados existentes. El análisis y las conclusiones
> van en `docs/`, nunca aquí.
>
> ⚠️ **El documento original está en orden inverso** dentro de cada módulo (la última fase aparece
> primero) y contiene fragmentos de conversación intercalados. Eso es intencionado y se conserva.

---

Sí. Y con lo que acabas de añadir, yo no lo haría como una sola fase, porque aquí hay dos sistemas relacionados pero distintos:

1. Libertad de apartados → decidir qué módulos quieres utilizar.
2. Papelera / Eliminados recientemente → recuperar elementos borrados.

Además, ambos deben quedar preparados para que funcionen también con futuras funcionalidades.

Yo lo dividiría en 4 fases internas:

* FASE 1 — Sistema de módulos: activar/desactivar apartados.
* FASE 2 — Personalización: ordenar módulos y personalizar Dashboard/navegación.
* FASE 3 — Eliminados recientemente: papelera, recuperación y borrado definitivo.
* FASE 4 — Integración y auditoría: conectar todo con la arquitectura actual y comprobar que cualquier módulo futuro respete estas reglas.

Te dejo la prompt completa para Claude:

NUEVA FASE — LIBERTAD TOTAL DE APARTADOS + SISTEMA DE ELIMINADOS

Quiero implementar una mejora estructural muy importante en toda la aplicación.

La web ya es muy extensa y contiene muchos apartados diferentes. Precisamente por eso, no quiero obligar al usuario a utilizar todos los módulos existentes.

Cada persona debe poder decidir qué partes de la aplicación quiere utilizar, cuáles quiere ocultar, cómo quiere organizar su sistema y, además, debe poder recuperar elementos eliminados accidentalmente.

Esta funcionalidad debe construirse como un sistema global y reutilizable, no como una solución aislada para los módulos actuales.

⸻

ESTRUCTURA GENERAL

Esta mejora se desarrollará en 4 fases:

FASE 1

SISTEMA DE MÓDULOS ACTIVABLES/DESACTIVABLES

Crear el sistema que permita activar o desactivar cualquier apartado.

FASE 2

PERSONALIZACIÓN DE LA EXPERIENCIA

Permitir que el usuario pueda decidir el orden, Dashboard y navegación que quiere utilizar.

FASE 3

ELIMINADOS RECIENTEMENTE / PAPELERA

Crear una papelera dentro de Ajustes donde aparezcan los elementos eliminados y puedan recuperarse.

FASE 4

INTEGRACIÓN GLOBAL + AUDITORÍA

Integrar todo con la aplicación actual y garantizar que las futuras funcionalidades respeten automáticamente estas reglas.

⸻

FASE 1 — SISTEMA DE MÓDULOS ACTIVABLES/DESACTIVABLES

OBJETIVO

El usuario debe poder decidir qué apartados quiere utilizar.

Ejemplo:

Salud

* Sueño → ACTIVADO
* Nutrición → ACTIVADO
* Skincare → DESACTIVADO

Deporte

* Calistenia → ACTIVADO
* Fútbol → DESACTIVADO

Productividad

* Tareas → ACTIVADO
* Hábitos → ACTIVADO
* Objetivos → ACTIVADO

⸻

CENTRO DE MÓDULOS

Crear dentro de Ajustes un apartado:

Personalizar mi sistema

Dentro aparecerán todos los módulos disponibles.

Cada módulo tendrá:

* icono;
* nombre;
* descripción;
* estado;
* interruptor ON/OFF.

Ejemplo:

🧴 Skincare

“Gestiona tu rutina de cuidado personal.”

[ ACTIVADO ]

⸻

DESACTIVAR NO SIGNIFICA ELIMINAR

Esta regla es MUY importante.

Cuando el usuario desactive un módulo:

NO SE BORRAN SUS DATOS.

Simplemente:

* deja de aparecer en navegación;
* deja de aparecer en Dashboard;
* deja de aparecer en accesos rápidos;
* deja de ocupar espacio visual;
* deja de mostrarse como módulo activo.

Pero todos sus datos permanecen almacenados.

Si meses después vuelve a activarlo:

TODO DEBE SEGUIR AHÍ.

⸻

NAVEGACIÓN DINÁMICA

La navegación debe adaptarse automáticamente.

Si el usuario desactiva:

Skincare

no debe continuar apareciendo:

* en menú inferior;
* menú lateral;
* Dashboard;
* accesos rápidos;
* widgets;
* estadísticas;
* buscador, cuando corresponda.

La interfaz debe reconstruirse automáticamente según los módulos activos.

⸻

FASE 2 — PERSONALIZACIÓN TOTAL

No quiero limitar la personalización únicamente a ON/OFF.

El usuario también debe poder decidir cómo quiere organizar sus módulos.

ORDEN DE MÓDULOS

Permitir cambiar el orden.

Por ejemplo:

ANTES:

Hoy → Estudios → Entrenamiento → Economía → Sueño

DESPUÉS:

Hoy → Entrenamiento → Estudios → Sueño → Economía

Cuando tenga sentido, utilizar:

drag & drop

especialmente en móvil.

⸻

DASHBOARD PERSONALIZABLE

El usuario debe poder decidir qué información quiere ver en la pantalla principal.

Crear algo como:

MI DASHBOARD

☑ Sueño
☑ Entrenamiento
☑ Economía
☐ Skincare
☐ Nutrición
☑ Estudios

Esto significa que:

Módulo activado ≠ necesariamente visible en Dashboard.

El usuario debe tener libertad para decidirlo.

⸻

NAVEGACIÓN PERSONALIZABLE

Siempre que sea técnicamente viable, permitir que el usuario decida qué módulos aparecen como accesos principales.

La aplicación debe priorizar:

libertad + simplicidad + limpieza visual.

No quiero que el usuario tenga una interfaz saturada.

⸻

CONFIGURACIONES PREDEFINIDAS

Como mejora opcional, crear perfiles rápidos:

COMPLETO

Todos los módulos activados.

ESTUDIANTE

Estudios + Productividad + Salud.

FITNESS

Entrenamiento + Nutrición + Sueño + Salud.

MINIMALISTA

Solo módulos esenciales.

Pero estos perfiles NO deben bloquear la personalización.

El usuario puede seleccionar uno y después modificarlo manualmente.

⸻

GUARDADO DE LA PERSONALIZACIÓN

La configuración debe guardarse asociada a la cuenta del usuario.

Debe mantenerse al:

* cerrar sesión;
* volver a entrar;
* cambiar de dispositivo;
* utilizar otro navegador;
* instalar la PWA.

La configuración debe sincronizarse mediante la arquitectura/backend actual.

⸻

DEPENDENCIAS

Hay módulos que pueden depender de otros.

Por ejemplo:

Nutrición
↓
Macros
↓
Objetivos nutricionales

Si un módulo depende de otro, gestionar correctamente esa dependencia.

Nunca dejar la aplicación en un estado roto.

Si es necesario:

“Este módulo necesita X para funcionar. ¿Quieres activarlo también?”

⸻

FASE 3 — SISTEMA DE ELIMINADOS RECIENTEMENTE

Ahora añadiremos un sistema independiente de recuperación.

Dentro de:

AJUSTES

crear:

🗑️ ELIMINADOS RECIENTEMENTE

Este apartado funcionará como una papelera.

⸻

OBJETIVO

Cuando el usuario elimine un elemento:

NO debe desaparecer inmediatamente para siempre.

Primero pasa a:

Eliminados recientemente

Esto permitirá recuperarlo si se ha eliminado por error.

⸻

CONTENIDO DE LA PAPELERA

Cada elemento eliminado debe mostrar información suficiente para identificarlo.

Ejemplo:

📚 Examen de Biología

Eliminado hace 2 horas

🏋️ Entrenamiento de calistenia

Eliminado ayer

💰 Movimiento económico

Eliminado hace 3 días

📝 Tarea

Eliminada hace 5 días

Dependiendo del tipo de elemento, mostrar los datos relevantes.

⸻

ACCIONES

Cada elemento tendrá:

RECUPERAR

Devuelve el elemento exactamente a donde estaba.

ELIMINAR DEFINITIVAMENTE

Lo elimina permanentemente.

⸻

RECUPERACIÓN

Cuando el usuario pulse:

RECUPERAR

debe ocurrir lo siguiente:

1. El elemento vuelve a su módulo original.
2. Recupera sus datos.
3. Recupera sus relaciones cuando sea posible.
4. Vuelve a aparecer en estadísticas.
5. Vuelve a aparecer en Dashboard si correspondía.
6. Se sincroniza con la cuenta.
7. Desaparece de Eliminados recientemente.

La recuperación debe ser una recuperación REAL, no simplemente volver a mostrar una copia.

⸻

BORRADO DEFINITIVO

Dentro de Eliminados recientemente debe existir:

Eliminar definitivamente

Esta acción sí elimina el elemento de forma permanente.

Antes de hacerlo:

¿Eliminar definitivamente?

Este elemento no podrá recuperarse después.

Botones:

Cancelar

Eliminar definitivamente

⸻

VACIAR PAPELERA

Añadir también:

Vaciar papelera

Pero esta acción debe requerir confirmación.

Ejemplo:

¿Vaciar eliminados recientemente?

Se eliminarán permanentemente todos los elementos de la papelera y no podrán recuperarse.

⸻

TIEMPO DE RETENCIÓN

Preparar el sistema para poder establecer un tiempo de retención.

Por ejemplo:

30 días

Durante ese tiempo:

Eliminado → Papelera

Después:

Papelera → Eliminación definitiva

La duración debe quedar preparada para poder cambiarse fácilmente en el futuro.

Si se considera mejor técnicamente, permitir también una opción:

Conservar hasta que yo lo elimine definitivamente.

⸻

INFORMACIÓN DEL ELEMENTO ELIMINADO

Cada elemento enviado a la papelera debería conservar metadatos como:

* ID original;
* tipo de elemento;
* módulo;
* fecha de creación;
* fecha de eliminación;
* datos necesarios para recuperación;
* usuario propietario;
* relaciones necesarias;
* información de posición/origen cuando corresponda.

No almacenar simplemente una etiqueta que diga “eliminado”.

Debe existir suficiente información para poder restaurarlo correctamente.

⸻

FASE 4 — INTEGRACIÓN GLOBAL

Esta fase es fundamental.

Quiero que revises TODA la aplicación actual.

Para cada módulo pregunta:

1.

¿Se puede activar/desactivar?

2.

¿Sus datos permanecen al desactivarlo?

3.

¿Sus elementos creados por el usuario se pueden eliminar?

4.

¿Cuando se eliminan pasan a Eliminados recientemente?

5.

¿Pueden recuperarse?

6.

¿Pueden eliminarse definitivamente?

7.

¿Las estadísticas se actualizan?

8.

¿La navegación se actualiza?

9.

¿Funciona en móvil?

10.

¿Funciona correctamente con Supabase/backend?

⸻

REGLA PARA TODAS LAS FUNCIONES FUTURAS

Esta parte debe convertirse en una regla arquitectónica permanente.

Cada vez que se cree una nueva funcionalidad, deberá cumplir:

MÓDULO

Activar / Desactivar

ELEMENTO

Crear / Editar / Eliminar

ELIMINACIÓN

Eliminar → Eliminados recientemente

PAPELERA

Recuperar / Eliminar definitivamente

PERSONALIZACIÓN

Dashboard / Navegación / Orden

Por tanto, ninguna futura funcionalidad debería añadirse al proyecto sin respetar esta estructura cuando corresponda.

⸻

DIFERENCIA FUNDAMENTAL

No confundir:

DESACTIVAR MÓDULO

Oculta temporalmente una sección.

NO elimina datos.

ELIMINAR ELEMENTO

El usuario elimina un elemento concreto.

Pasa a:

ELIMINADOS RECIENTEMENTE

ELIMINAR DEFINITIVAMENTE

El usuario lo elimina de la papelera.

Entonces desaparece permanentemente.

⸻

EXPERIENCIA DE USUARIO

Todo debe sentirse sencillo.

El usuario no debería tener que entender cómo funciona la base de datos.

Para él simplemente debe ser:

“No quiero este apartado.”

→ Lo desactivo.

“He borrado algo por error.”

→ Voy a Ajustes → Eliminados recientemente → Recuperar.

“Quiero borrarlo para siempre.”

→ Eliminados recientemente → Eliminar definitivamente.

⸻

DISEÑO

Mantener completamente el lenguaje visual actual:

* premium;
* moderno;
* limpio;
* elegante;
* responsive;
* mobile-first;
* modo oscuro;
* animaciones suaves;
* iconografía consistente;
* feedback visual.

Los interruptores y controles deben sentirse integrados con el diseño de la aplicación.

No crear una pantalla de configuración que parezca una aplicación diferente.

⸻

SEGURIDAD

La personalización y la papelera deben estar protegidas por usuario.

Un usuario nunca debe poder:

* ver módulos configurados de otra cuenta;
* recuperar elementos de otro usuario;
* eliminar elementos de otro usuario;
* modificar configuraciones ajenas.

Si utilizamos Supabase:

* Auth;
* RLS;
* políticas SELECT;
* políticas INSERT;
* políticas UPDATE;
* políticas DELETE;
* ownership mediante user ID.

Todo debe estar correctamente protegido.

⸻

NO ROMPER FUNCIONES EXISTENTES

Antes de implementar:

1. Analiza la arquitectura actual.
2. Identifica los módulos existentes.
3. Identifica cómo se almacenan.
4. Identifica las relaciones entre datos.
5. Identifica la navegación.
6. Identifica el Dashboard.
7. Identifica los sistemas actuales de eliminación.

Después integra esta nueva arquitectura sin romper funcionalidades existentes.

No rehagas innecesariamente partes que ya funcionan correctamente.

⸻

AUDITORÍA FINAL

Cuando termines, realiza una auditoría completa.

Comprueba que:

PERSONALIZACIÓN

* Se puede activar cualquier módulo.
* Se puede desactivar cualquier módulo.
* Desactivar no borra datos.
* Volver a activar recupera el módulo correctamente.
* La navegación se adapta.
* El Dashboard se adapta.
* La configuración se sincroniza.

ELIMINADOS

* Los elementos eliminados pasan a la papelera.
* Se pueden recuperar.
* Se pueden eliminar definitivamente.
* Se puede vaciar la papelera.
* La recuperación restaura correctamente las relaciones.
* Las estadísticas se actualizan.
* La eliminación definitiva es realmente definitiva.

FUTURO

* El sistema es reutilizable.
* Un nuevo módulo puede registrarse fácilmente.
* Un nuevo tipo de elemento puede utilizar la papelera.
* No es necesario crear una solución diferente para cada módulo.

⸻

PRINCIPIO FINAL

La aplicación debe dejar de ser una herramienta rígida.

Debe convertirse en:

MI SISTEMA, A MI MANERA.

El usuario decide:

QUÉ QUIERE UTILIZAR.

QUÉ QUIERE VER.

EN QUÉ ORDEN LO QUIERE.

QUÉ QUIERE ELIMINAR.

QUÉ QUIERE RECUPERAR.

Y QUÉ QUIERE BORRAR PARA SIEMPRE.

Esta filosofía debe quedar integrada en la arquitectura de la aplicación para que siga funcionando aunque en el futuro añadamos decenas de módulos nuevos.
FASE — SISTEMA UNIVERSAL DE ELIMINACIÓN
Quiero implementar una mejora obligatoria y transversal en toda la web: cualquier elemento que el usuario pueda crear, añadir, registrar, guardar o personalizar debe poder eliminarse posteriormente.
Esto no debe aplicarse únicamente a las funciones actuales. Quiero que se convierta en una regla estructural de la aplicación, de forma que cualquier funcionalidad que se añada en el futuro tenga automáticamente en cuenta la posibilidad de eliminar sus elementos.
1. PRINCIPIO FUNDAMENTAL
La regla debe ser:
SI EL USUARIO PUEDE CREAR O AÑADIR ALGO, EL USUARIO DEBE PODER ELIMINARLO.
No quiero encontrar ninguna sección donde pueda añadir información pero después no exista ninguna forma de quitarla.
Ejemplos:
* Si puedo crear una tarea → puedo eliminarla.
* Si puedo crear un hábito → puedo eliminarlo.
* Si puedo crear un objetivo → puedo eliminarlo.
* Si puedo añadir una materia → puedo eliminarla.
* Si puedo añadir un evento → puedo eliminarlo.
* Si puedo registrar un entrenamiento → puedo eliminarlo.
* Si puedo añadir un movimiento económico → puedo eliminarlo.
* Si puedo crear una nota → puedo eliminarla.
* Si puedo crear una categoría → puedo eliminarla.
* Si puedo guardar cualquier elemento personalizado → puedo eliminarlo.
Y lo mismo debe ocurrir con cualquier funcionalidad futura.
 
⸻
 
2. PAPELERA / BOTÓN DE ELIMINAR
Todo elemento eliminable debe tener una opción de eliminación claramente accesible.
Preferentemente:
* icono de papelera 🗑️;
* botón “Eliminar”;
* menú de tres puntos → “Eliminar”;
* gesto de deslizar cuando tenga sentido en móvil.
No quiero llenar innecesariamente la interfaz de botones enormes.
En elementos pequeños puede utilizarse simplemente un icono de papelera discreto, pero debe ser fácil de encontrar.
La interfaz debe seguir manteniendo el diseño premium, limpio y minimalista que ya tiene la aplicación.
 
⸻
 
3. CONFIRMACIÓN DE ELIMINACIÓN
No quiero que pulsar accidentalmente la papelera borre información importante inmediatamente.
Para elementos relevantes debe aparecer una confirmación:
¿Eliminar este elemento?
Esta acción eliminará permanentemente este elemento.
Botones:
Cancelar
Eliminar
Para elementos de muy bajo riesgo o acciones repetitivas puede utilizarse un sistema más rápido si resulta más cómodo, pero nunca debe existir riesgo de borrar información importante accidentalmente.
 
⸻
 
4. ELIMINACIÓN PERMANENTE
Cuando el usuario confirme la eliminación:
1. El elemento debe desaparecer inmediatamente de la interfaz.
2. Debe eliminarse también de la base de datos/estado correspondiente.
3. Debe mantenerse sincronizado en todos los dispositivos.
4. No debe reaparecer después de recargar la página.
5. No debe reaparecer después de cerrar y abrir la aplicación.
6. No debe quedar como un elemento “fantasma” en otra sección.
7. Las estadísticas relacionadas deben actualizarse correctamente.
Es decir:
ELIMINAR = ELIMINAR REALMENTE.
No quiero simplemente ocultar visualmente un elemento.
 
⸻
 
5. CUIDADO CON LAS RELACIONES
Si un elemento está relacionado con otros elementos, analiza antes qué debe ocurrir.
Por ejemplo:
* eliminar una materia;
* eliminar un objetivo;
* eliminar un hábito;
* eliminar una categoría;
* eliminar un entrenamiento;
* eliminar una cuenta o configuración.
No se deben producir errores por referencias inexistentes.
Utiliza correctamente:
* IDs;
* relaciones;
* foreign keys;
* ON DELETE;
* limpieza de datos relacionados cuando corresponda;
* estados vacíos;
* validaciones.
Nunca debe quedar una referencia apuntando a un elemento que ya no existe.
 
⸻
 
6. ELIMINAR ELEMENTOS PERSONALIZADOS
Especialmente importante:
Todo aquello que el usuario pueda crear personalmente debe ser eliminable.
No quiero que la aplicación permita crear cosas que después queden permanentemente bloqueadas dentro de ella.
Ejemplo:
Si el usuario crea:
“Estudiar anatomía”
y posteriormente ya no lo quiere, debe poder eliminarlo.
Si crea:
“Entrenamiento de fuerza”
debe poder eliminarlo.
Si crea:
“Examen de biología”
debe poder eliminarlo.
Esto debe aplicarse a cualquier módulo.
 
⸻
 
7. EDITAR + ELIMINAR
Siempre que exista una acción de:
Editar
debe comprobarse si también debe existir:
Eliminar
En la mayoría de elementos creados por el usuario deberán existir ambas opciones:
Editar
Eliminar
Esto debe convertirse en un patrón de diseño reutilizable.
 
⸻
 
8. COMPONENTE REUTILIZABLE
No quiero que implementes esta funcionalidad manualmente de forma diferente en cada sección.
Crea un sistema/componentes reutilizables.
Por ejemplo, conceptualmente:
DeleteButton
DeleteConfirmation
useDeleteItem
o una arquitectura equivalente que encaje mejor con el proyecto.
La idea es que en el futuro, cuando se cree una nueva funcionalidad, el desarrollador pueda implementar fácilmente:
Crear → Editar → Eliminar
sin tener que inventar un sistema nuevo cada vez.
 
⸻
 
9. MENÚ DE ACCIONES
Cuando tenga sentido, utiliza un menú contextual:
⋯
Dentro:
* Editar
* Duplicar (si corresponde)
* Eliminar
Esto permitirá mantener la interfaz limpia.
No pongas una papelera gigante en todas partes.
Quiero que la eliminación sea siempre posible, pero visualmente discreta.
 
⸻
 
10. BORRADO EN TODOS LOS MÓDULOS
Haz una auditoría completa de TODA la aplicación.
No te limites a las pantallas principales.
Busca:
* Dashboard
* Calendario
* Estudios
* Entrenamiento
* Calistenia
* Fútbol
* Economía
* Nutrición
* Sueño
* Hábitos
* Objetivos
* Productividad
* Tareas
* Eventos
* Notas
* Diario
* Biblioteca
* Negocio
* Relaciones
* Configuración
* cualquier módulo adicional
* cualquier modal
* cualquier formulario
* cualquier lista dinámica
* cualquier elemento creado por el usuario
Para cada uno pregunta:
¿El usuario puede crear esto?
Si la respuesta es sí:
¿Puede eliminarlo?
Si la respuesta es no:
IMPLEMENTARLO.
 
⸻
 
11. DATOS HISTÓRICOS
Ten especial cuidado con los registros históricos.
Si el usuario registra algo y después quiere eliminarlo, debe poder hacerlo.
Por ejemplo:
* entrenamiento registrado;
* partido registrado;
* movimiento económico;
* comida registrada;
* noche de sueño;
* tarea completada;
* evento;
* sesión de estudio;
* registro diario.
No quiero que la aplicación acumule datos que el usuario no pueda gestionar.
 
⸻
 
12. ELIMINACIÓN Y ESTADÍSTICAS
Cuando se elimina un registro, comprueba todas las estadísticas que dependan de él.
Ejemplo:
Si existen:
10 entrenamientos
y elimino uno:
10 → 9
Las estadísticas, gráficas, medias, puntuaciones y contadores relacionados deben recalcularse correctamente.
Nunca debe ocurrir:
Registro eliminado = estadísticas incorrectas.
 
⸻
 
13. PAPELERA / UNDO
Cuando sea útil, puedes implementar una pequeña opción de recuperación temporal:
Elemento eliminado
Deshacer
Esto sería especialmente bueno para acciones rápidas.
Pero no quiero que esto sustituya al borrado real.
El sistema debe poder eliminar definitivamente cuando corresponda.
 
⸻
 
14. SEGURIDAD
La eliminación debe comprobar que el usuario tiene permiso para eliminar ese elemento.
Nunca debe ser posible eliminar mediante una manipulación del frontend información perteneciente a otro usuario.
La autorización debe comprobarse también en backend/base de datos.
Especialmente si estamos utilizando Supabase:
* Row Level Security;
* políticas de DELETE;
* autenticación;
* ownership del registro.
 
⸻
 
15. FUTURAS FUNCIONALIDADES
ESTA PARTE ES MUY IMPORTANTE.
A partir de ahora, quiero que esta regla forme parte de la arquitectura y filosofía de desarrollo de la aplicación.
Cada vez que en el futuro se añada una funcionalidad nueva, antes de considerarla terminada debes comprobar:
CHECKLIST DE CADA NUEVA FUNCIÓN
Crear → ¿puedo añadir el elemento?
Editar → ¿puedo modificarlo?
Eliminar → ¿puedo borrarlo?
Confirmación → ¿la eliminación está protegida cuando sea necesario?
Base de datos → ¿se elimina realmente?
Relaciones → ¿se limpian correctamente?
Estadísticas → ¿se actualizan?
Sincronización → ¿se refleja en todos los dispositivos?
UI móvil → ¿la opción funciona correctamente en móvil?
Si falta la eliminación, la funcionalidad no se considera terminada.
 
⸻
 
16. NO ROMPER NADA EXISTENTE
Implementa este sistema sin eliminar ni modificar accidentalmente funcionalidades que ya funcionan.
Antes de modificar:
* revisa la arquitectura existente;
* identifica cómo se almacenan los datos;
* identifica qué componentes reutilizables existen;
* identifica qué elementos pueden eliminarse;
* identifica relaciones entre datos.
Después implementa el sistema de forma consistente.
 
⸻
 
17. AUDITORÍA FINAL
Cuando termines, realiza una auditoría completa de la aplicación.
Busca específicamente:
“¿Existe algún elemento que el usuario pueda crear y que después no pueda eliminar?”
Si encuentras uno:
CORRÍGELO.
Después comprueba:
* móvil;
* escritorio;
* modo oscuro;
* animaciones;
* modales;
* base de datos;
* sincronización;
* estadísticas;
* errores de consola;
* estados vacíos;
* permisos;
* seguridad.
 
⸻
 
RESULTADO FINAL
Quiero que la aplicación tenga una regla clara:
TODO LO QUE EL USUARIO PUEDA AÑADIR, DEBE PODER ELIMINARLO.
La eliminación debe ser:
* universal;
* consistente;
* segura;
* real;
* sincronizada;
* visualmente limpia;
* fácil de encontrar;
* protegida contra errores;
* preparada para futuras funcionalidades.
Y, sobre todo:
NO IMPLEMENTES ESTO SOLO PARA LAS FUNCIONES ACTUALES.
Quiero que construyas el sistema de manera que cualquier nueva función que añadamos en el futuro pueda incorporar automáticamente:
CREAR → EDITAR → ELIMINAR
como estándar obligatorio de toda la aplicación.

