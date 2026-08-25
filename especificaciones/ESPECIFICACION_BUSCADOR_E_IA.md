> **Nota de procedencia:** transcripción íntegra y sin resumir del bloque «BUSCADOR GLOBAL + IA + DESPLEGABLE DE INICIO — 4 fases» del documento
> `JC_FITNESS___ESTILO_DE_HOMBRE.txt` que Josué pegó en el chat (líneas 25495–27162 del original completo,
> conservado sin tocar en `ORIGINAL_JC_FITNESS_ESTILO_DE_HOMBRE.txt`).
>
> **No editar ni resumir este contenido.** Si Josué amplía o corrige el texto, añadir lo nuevo o
> sustituir el apartado afectado, nunca recortar apartados existentes. El análisis y las conclusiones
> van en `docs/`, nunca aquí.
>
> ⚠️ **El documento original está en orden inverso** dentro de cada módulo (la última fase aparece
> primero) y contiene fragmentos de conversación intercalados. Eso es intencionado y se conserva.

---

Debe construirse como un sistema completo de fondos integrado dentro del sistema de apariencia de JC Fitness, preparado para evolucionar durante las siguientes 11 fases.
Antes de modificar funcionalidades existentes, conservar todo lo que ya funciona correctamente.
No eliminar ni sustituir funcionalidades actuales que no estén relacionadas con esta fase.
Al terminar, comprobar que JC Fitness sigue funcionando exactamente igual que antes en todas las áreas que no afectan al sistema de fondos.

Vamos con la Fase 4, la última de este bloque. Aquí unimos lo anterior para que el sistema no parezca dos funciones pegadas, sino una única experiencia: buscar algo, encontrarlo o preguntárselo a JC.
FASE 4 — INTEGRACIÓN FINAL: BUSCADOR + IA + INTENCIÓN DEL USUARIO
OBJETIVO
Integrar definitivamente las tres capas desarrolladas anteriormente:
1. Interfaz del buscador.
2. Motor de búsqueda interno.
3. Inteligencia artificial.
El resultado debe ser un único sistema desde el botón superior izquierdo de JC Fitness.
El usuario no debería tener que pensar:
“¿Tengo que buscar esto o preguntárselo a la IA?”
Simplemente escribe lo que necesita y JC Fitness determina la mejor forma de ayudarle.
 
⸻
 
1. EXPERIENCIA PRINCIPAL
El flujo debe ser:
BOTÓN 🔍
      ↓
BUSCADOR
      ↓
USUARIO ESCRIBE
      ↓
ANALIZAR INTENCIÓN
      ↓
┌───────────────────────────┐
│ ¿Existe una función?      │
│ ¿Es una pregunta?         │
│ ¿Existen ambas opciones?  │
└───────────────────────────┘
      ↓
RESULTADO MÁS ÚTIL
La interfaz debe mantenerse sencilla.
No mostrar al usuario toda la complejidad interna del sistema.
 
⸻
 
2. CASO: EL USUARIO BUSCA UNA FUNCIÓN
Ejemplo:
colores
El sistema detecta que existe una función relacionada.
Mostrar:
Colores
Ajustes → Apariencia
Personaliza los colores de JC Fitness.
[ Abrir ]
Al pulsar:
→ abrir directamente la configuración de colores.
No pasar por pantallas intermedias innecesarias.
 
⸻
 
3. CASO: EL USUARIO HACE UNA PREGUNTA
Ejemplo:
¿Cómo puedo mejorar mi entrenamiento?
El sistema detecta intención de pregunta.
Mostrar:
Preguntar a JC
¿Cómo puedo mejorar mi entrenamiento?
[ Preguntar ]
Al pulsarlo:
→ abrir la interfaz de IA.
→ introducir automáticamente la pregunta.
→ permitir que la IA responda.
El usuario NO debe volver a escribirla.
 
⸻
 
4. CASO: EXISTEN LAS DOS POSIBILIDADES
Este caso es especialmente importante.
Ejemplo:
¿Cómo cambio los colores?
El sistema puede detectar:
Función encontrada
Colores
Ajustes → Apariencia
[ Abrir ]
Y también:
Preguntar a JC
¿Cómo cambio los colores?
[ Preguntar a JC ]
Esto proporciona dos caminos.
Si el usuario quiere hacerlo directamente:
→ Abrir.
Si quiere una explicación:
→ IA.
 
⸻
 
5. DETECCIÓN DE INTENCIÓN
Crear una lógica de intención sencilla y robusta.
No hace falta construir un sistema de IA complejo únicamente para decidir esto.
Categorías principales:
NAVEGACIÓN
El usuario quiere encontrar algo.
Ejemplos:
* “colores”
* “sueño”
* “economía”
* “racha”
* “sonidos”
PREGUNTA
El usuario quiere una respuesta.
Ejemplos:
* “¿cómo puedo mejorar?”
* “¿qué debería hacer?”
* “¿por qué?”
* “¿cómo hago esto?”
ACCIÓN
El usuario quiere realizar algo.
Ejemplos:
* “quiero cambiar los colores”
* “quiero añadir un objetivo”
* “quiero registrar un entrenamiento”
En este caso, si existe una función compatible:
→ mostrar el acceso directo.
Si necesita explicación:
→ ofrecer también IA.
 
⸻
 
6. DETECCIÓN HÍBRIDA
No confiar únicamente en palabras como:
¿
para determinar que algo es una pregunta.
Por ejemplo:
cambiar colores
No tiene signo de interrogación, pero claramente expresa una intención de acción.
Por tanto, analizar:
* Palabras clave.
* Verbos.
* Estructura de la frase.
* Coincidencias del índice.
* Longitud.
* Preguntas explícitas.
* Intención de navegación.
 
⸻
 
7. PRIORIDAD
Cuando exista una función claramente relacionada, debe tener prioridad.
Ejemplo:
cambiar colores
Resultado:
Cambiar colores
[ Abrir ]
y debajo:
Preguntar a JC
Esto evita utilizar IA para tareas que la aplicación ya puede resolver directamente.
 
⸻
 
8. PREGUNTAS ABIERTAS
Si el usuario escribe:
¿Qué ejercicios puedo hacer para mejorar mi planche?
No existe necesariamente una pantalla específica que responda exactamente a eso.
Entonces:
Preguntar a JC
debe ser el resultado principal.
La IA recibe la consulta completa.
 
⸻
 
9. RESPUESTA DE LA IA
La interfaz de IA debe respetar el diseño actual de JC Fitness.
No crear una experiencia completamente diferente.
Debe conservar:
* Tipografía.
* Espaciado.
* Bordes.
* Iconografía.
* Modo oscuro.
* Animaciones.
* Identidad visual.
La IA debe parecer una parte natural del sistema.
 
⸻
 
10. CONTEXTO DE JC FITNESS
Cuando sea necesario, la IA puede utilizar el contexto permitido de la aplicación.
Por ejemplo, si la arquitectura actual ya permite que la IA conozca determinados datos del usuario, mantener ese comportamiento.
Pero:
NO enviar información privada innecesariamente.
NO enviar toda la base de datos en cada consulta.
Utilizar únicamente la información necesaria y autorizada.
 
⸻
 
11. NAVEGACIÓN DE VUELTA
Después de utilizar la IA o abrir una función:
El usuario debe poder volver fácilmente al lugar anterior.
No perder el contexto de navegación.
Ejemplo:
Inicio
 ↓
Buscar
 ↓
Colores
 ↓
Ajustes
Al volver:
→ regresar al punto lógico anterior.
 
⸻
 
12. CIERRE DEL SISTEMA
El buscador debe poder cerrarse en cualquier momento.
Al cerrar:
* Desaparece el panel.
* Se conserva la aplicación exactamente como estaba.
* No se modifican datos.
* No se ejecutan acciones accidentalmente.
 
⸻
 
13. ESTADOS DE LA INTERFAZ
Definir correctamente todos los estados:
Estado 1
Buscador cerrado.
Estado 2
Buscador abierto sin texto.
Mostrar sugerencias/recentemente utilizados si existen.
Estado 3
Usuario escribiendo.
Mostrar resultados dinámicos.
Estado 4
Resultados encontrados.
Mostrar funciones relevantes.
Estado 5
Pregunta detectada.
Mostrar acceso a IA.
Estado 6
Sin resultados.
Ofrecer IA.
Estado 7
IA abierta.
Mostrar conversación/respuesta.
Estado 8
Error.
Mostrar mensaje claro y permitir reintentar.
 
⸻
 
14. ESTADO DE CARGA
Si la IA tarda en responder:
Mostrar un estado de carga elegante.
Por ejemplo:
JC está pensando…
No bloquear toda la aplicación.
El usuario debe poder cancelar o salir si corresponde.
 
⸻
 
15. ERRORES DE IA
Si la IA falla:
No mostrar errores técnicos como:
500 Internal Server Error
al usuario.
Mostrar algo como:
No he podido responder ahora mismo.
[ Reintentar ]
Y mantener intacto el buscador.
 
⸻
 
16. SEGURIDAD DE LA IA
La integración debe respetar la arquitectura segura de JC Fitness.
Especialmente:
* No exponer API keys en el cliente.
* No introducir secretos en el código frontend.
* Utilizar el backend/proxy existente cuando corresponda.
* Respetar autenticación.
* Respetar permisos.
* No enviar datos privados innecesarios.
Si actualmente existe una arquitectura de IA provisional propia del entorno de Claude Artifact, NO asumir que es adecuada para producción.
Mantener separada la lógica de interfaz de la lógica de acceso a la IA.
 
⸻
 
17. RENDIMIENTO
El usuario debe sentir que el sistema responde inmediatamente.
Búsqueda interna
Debe ser prácticamente instantánea.
IA
Mostrar carga únicamente cuando sea necesaria.
No bloquear:
* Dashboard.
* Navegación.
* Otras funciones.
No realizar llamadas de red innecesarias.
 
⸻
 
18. DISEÑO MÓVIL
Comprobar especialmente:
* Teclado iOS.
* Área segura superior.
* Botón de cerrar.
* Campo de búsqueda.
* Scroll de resultados.
* Scroll de conversación.
* Pantallas pequeñas.
* Modo oscuro.
La interfaz debe poder utilizarse completamente con una mano cuando sea razonable.
 
⸻
 
19. MICROINTERACCIONES
Añadir únicamente las necesarias:
* Pulsación del botón de búsqueda.
* Apertura del panel.
* Aparición de resultados.
* Selección.
* Entrada en IA.
* Cierre.
Todo debe ser rápido y elegante.
Evitar animaciones excesivas.
 
⸻
 
20. PRUEBAS COMPLETAS
Realizar una prueba final con casos reales.
Caso 1
Usuario:
colores
Resultado:
→ Colores.
Caso 2
Usuario:
dormir
Resultado:
→ Sueño.
Caso 3
Usuario:
¿Cómo cambio los colores?
Resultado:
→ Colores + IA.
Caso 4
Usuario:
¿Cómo puedo mejorar mi planche?
Resultado:
→ IA.
Caso 5
Usuario:
sonidos
Resultado:
→ Sonidos si existe.
Caso 6
Usuario:
racha
Resultado:
→ Rachas si existe.
Caso 7
Usuario:
quiero añadir un objetivo
Resultado:
→ Objetivos si existe.
Caso 8
Usuario:
asdfghjkl
Resultado:
→ Sin resultados + opción de IA.
 
⸻
 
21. PRUEBA DE NO REGRESIÓN
Después de integrar todo:
Comprobar que siguen funcionando:
* Dashboard.
* Sueño.
* Entrenamiento.
* Economía.
* Ajustes.
* Navegación.
* Modo oscuro.
* Perfil.
* Persistencia de datos.
* Todas las funciones existentes.
No aceptar una implementación que arregle el buscador pero rompa otra parte de JC Fitness.
 
⸻
 
22. NO SOBREDISEÑAR
El buscador debe ser potente por dentro y sencillo por fuera.
El usuario debería entenderlo en segundos.
La experiencia ideal es:
Pulso 🔍 → escribo → encuentro → entro.
o:
Pulso 🔍 → pregunto → JC responde.
No crear menús adicionales innecesarios.
 
⸻
 
23. RESULTADO FINAL
Al terminar las cuatro fases, JC Fitness debe disponer de:
Arriba izquierda
🔍 Buscador inteligente
Arriba derecha
Mantener la función existente correspondiente.
Parte inferior
Mantener el acceso actual de IA/recomendaciones si existe.
El nuevo buscador NO debe eliminar ni romper el acceso inferior existente.
El buscador superior sirve principalmente como:
NAVEGADOR INTELIGENTE + ACCESO A IA
mientras que el botón inferior mantiene su función específica actual.
 
⸻
 
24. CRITERIO DEFINITIVO DE ÉXITO
La implementación completa se considera terminada cuando el usuario puede entrar en JC Fitness y pensar:
“No sé dónde está algo.”
Pulsa la lupa.
Escribe:
“colores”
JC Fitness encuentra la opción.
Pulsa:
“Abrir”
Y llega directamente allí.
O escribe:
“¿Cómo puedo mejorar mi entrenamiento?”
JC Fitness entiende que quiere ayuda.
Pulsa:
“Preguntar a JC”
Y la IA recibe directamente la pregunta.
Todo ello sin crear navegación innecesaria y sin romper ninguna función existente.
 
⸻
 
FINAL DEL BLOQUE DE 4 FASES
Una vez terminada esta Fase 4:
1. No crear nuevas fases automáticamente.
2. No modificar otros módulos sin necesidad.
3. Realizar una prueba completa del sistema.
4. Comprobar móvil.
5. Comprobar rendimiento.
6. Comprobar navegación.
7. Comprobar IA.
8. Comprobar seguridad.
9. Comprobar que las cuatro fases funcionan conjuntamente.
El resultado final debe sentirse como una única función nativa de JC Fitness:
BUSCAR → ENCONTRAR → ABRIR
o
BUSCAR → PREGUNTAR → RESPONDER
Y no como cuatro funcionalidades independientes pegadas entre sí.

Seguimos con la Fase 3. Aquí vamos a construir la parte que hará que la búsqueda de verdad conozca JC Fitness: el índice global de funciones, rutas, ajustes, acciones y palabras relacionadas. Es importante porque si esto se deja superficial, la lupa acabará siendo poco más que un filtro de texto.
FASE 3 — MOTOR DE BÚSQUEDA GLOBAL E ÍNDICE INTELIGENTE DE JC FITNESS
OBJETIVO
Construir el sistema interno que alimenta el buscador de JC Fitness.
La Fase 2 creó la interfaz y el acceso a la búsqueda.
Ahora hay que crear el sistema que permite que esa búsqueda conozca realmente la aplicación.
El objetivo es que el usuario pueda escribir una palabra, una frase corta o un concepto y JC Fitness sea capaz de localizar las funciones relacionadas y llevar al usuario directamente al lugar correcto.
 
⸻
 
1. PRINCIPIO FUNDAMENTAL
El buscador NO debe buscar únicamente coincidencias de texto.
Debe funcionar mediante un índice global de funcionalidades.
Conceptualmente:
USUARIO ESCRIBE
       ↓
NORMALIZACIÓN
       ↓
ANÁLISIS DE LA CONSULTA
       ↓
ÍNDICE DE JC FITNESS
       ↓
CÁLCULO DE RELEVANCIA
       ↓
RESULTADOS
       ↓
ACCIÓN DIRECTA
La búsqueda debe ser rápida y determinista para las funciones internas.
NO depender de una llamada a la IA para encontrar una función que ya existe en la aplicación.
 
⸻
 
2. ÍNDICE GLOBAL
Crear una fuente central de verdad para registrar las funciones que pueden aparecer en el buscador.
Cada entrada debe contener información suficiente para encontrarla y abrirla.
Estructura conceptual:
{
  id,
  title,
  description,
  category,
  keywords,
  synonyms,
  icon,
  target,
  action,
  searchable,
  priority
}
La estructura exacta puede adaptarse a la arquitectura actual.
 
⸻
 
3. INFORMACIÓN DE CADA FUNCIÓN
Cada función debe poder definir:
ID
Identificador único.
Ejemplo:
settings-colors
TITLE
Nombre visible.
Ejemplo:
Colores
DESCRIPTION
Descripción corta.
Ejemplo:
Personaliza los colores de JC Fitness.
CATEGORY
Ubicación lógica.
Ejemplo:
Ajustes
KEYWORDS
Palabras que pueden utilizarse para encontrarla.
Ejemplo:
["color", "colores", "tema", "personalizar"]
SYNONYMS
Términos alternativos.
Ejemplo:
["apariencia", "diseño", "estilo"]
TARGET
Destino de navegación.
Debe permitir llegar al lugar correcto.
PRIORITY
Permitir establecer qué resultados tienen mayor importancia.
 
⸻
 
4. NORMALIZACIÓN DE TEXTO
Antes de buscar, normalizar la consulta del usuario.
El sistema debería:
* Convertir a minúsculas.
* Eliminar espacios innecesarios.
* Gestionar acentos.
* Gestionar caracteres especiales.
* Evitar diferencias entre singular y plural cuando sea posible.
* Ignorar diferencias irrelevantes.
Ejemplo:
"  COLORES  "
debe tratarse igual que:
"colores"
Y:
"Configuración"
debe poder relacionarse con:
"configuracion"
La búsqueda en español debe ser especialmente tolerante con los acentos.
 
⸻
 
5. COINCIDENCIA EXACTA
La primera prioridad debe ser la coincidencia exacta.
Ejemplo:
Usuario:
colores
Resultado principal:
Colores
No debe aparecer antes una función secundaria que simplemente contenga “color” en su descripción.
 
⸻
 
6. COINCIDENCIA PARCIAL
Permitir búsquedas incompletas.
Ejemplo:
colo
Debe poder encontrar:
Colores
Otro ejemplo:
entren
Debe poder encontrar:
Entrenamiento
 
⸻
 
7. PALABRAS RELACIONADAS
Añadir un sistema de palabras clave y sinónimos.
Ejemplo:
dormir
↓
Sueño
dinero
↓
Economía
entrenar
↓
Entrenamiento
tema
↓
Apariencia
noche
↓
Modo oscuro
Esto debe hacerse de forma controlada.
NO convertirlo en un sistema impredecible.
 
⸻
 
8. RANKING DE RESULTADOS
Crear una puntuación de relevancia.
Por ejemplo:
Coincidencia exacta del título       → máxima prioridad
Coincidencia parcial del título      → alta
Coincidencia en keywords             → media-alta
Coincidencia en sinónimos            → media
Coincidencia en descripción          → menor
La puntuación concreta puede adaptarse.
Lo importante es que los resultados más útiles aparezcan primero.
 
⸻
 
9. DESAMBIGUACIÓN
Una búsqueda puede tener varios significados.
Ejemplo:
objetivo
Puede estar relacionado con:
* Objetivos.
* Entrenamiento.
* Estudios.
* Productividad.
En estos casos:
No elegir arbitrariamente uno si existe ambigüedad importante.
Mostrar los resultados ordenados.
Ejemplo:
Objetivos Gestión de objetivos personales
Objetivos de entrenamiento Metas de entrenamiento
Objetivos de estudio Metas académicas
 
⸻
 
10. ACCIONES DIRECTAS
Cada resultado debe poder ejecutar una acción.
No basta con mostrar:
Ajustes → Apariencia → Colores
Debe poder abrirlo.
Conceptualmente:
resultado
↓
onSelect()
↓
navegación / apertura
↓
destino
La implementación exacta dependerá de la navegación actual de JC Fitness.
 
⸻
 
11. FUNCIONES SIN RUTA
Algunas funciones pueden ser:
* Modal.
* Panel.
* Ajuste.
* Selector.
* Acción directa.
El índice debe poder manejar distintos tipos de destino.
Por ejemplo:
type: "route"
type: "modal"
type: "setting"
type: "action"
Así el buscador no queda limitado únicamente a páginas.
 
⸻
 
12. ÍNDICE POR CATEGORÍAS
Organizar internamente las entradas por categorías.
Ejemplo:
Inicio
Sueño
Entrenamiento
Nutrición
Economía
Productividad
Estudios
Objetivos
Ajustes
Personalización
Sonidos
Rachas
...
No inventar módulos que todavía no existan.
El índice debe reflejar las funcionalidades reales de la aplicación en cada momento.
 
⸻
 
13. ACTUALIZACIÓN DEL ÍNDICE
El sistema debe ser escalable.
Cuando Claude añada una nueva función a JC Fitness:
Nueva función
↓
Registrar entrada
↓
Añadir keywords
↓
Añadir destino
↓
El buscador la reconoce
Esto debe formar parte del procedimiento normal de desarrollo.
NO crear una enorme lista desconectada de la aplicación que luego nadie actualice.
 
⸻
 
14. BÚSQUEDA DE AJUSTES
Los ajustes son especialmente importantes.
El buscador debe poder localizar configuraciones individuales.
Por ejemplo:
colores
↓
Ajustes → Apariencia → Colores
sonido
↓
Ajustes → Sonidos
volumen
↓
Ajustes → Sonidos → Volumen
notificaciones
↓
Ajustes → Notificaciones
modo oscuro
↓
Ajustes → Apariencia → Modo oscuro
No obligar al usuario a navegar manualmente por Ajustes.
 
⸻
 
15. BÚSQUEDA DE FUNCIONES PROFUNDAS
El buscador debe poder localizar funciones aunque estén varios niveles dentro de la aplicación.
Ejemplo conceptual:
Ajustes
  └── Apariencia
        └── Personalización
              └── Colores
Buscar:
colores
debe poder llegar directamente al último nivel.
 
⸻
 
16. HISTORIAL RECIENTE
Opcionalmente, si encaja con la arquitectura:
Cuando el buscador está vacío, mostrar:
Búsquedas recientes
o
Accesos recientes
Pero debe mantenerse sencillo.
No guardar información sensible.
Si se implementa historial:
* Limitar el número de elementos.
* Permitir limpiarlo.
* Guardarlo localmente si corresponde.
* No enviarlo innecesariamente al servidor.
 
⸻
 
17. SUGERENCIAS INICIALES
Cuando el usuario abra el buscador sin escribir nada, se pueden mostrar sugerencias como:
Buscar rápidamente
* Sueño
* Entrenamiento
* Economía
* Ajustes
* Rachas
* Sonidos
Estas sugerencias deben proceder de funciones reales existentes.
No inventar accesos.
 
⸻
 
18. TOLERANCIA A ERRORES
El sistema debe soportar errores sencillos de escritura.
Ejemplo:
colroes
podría sugerir:
¿Quizá buscas “Colores”?
No hace falta implementar un sistema de corrección lingüística enorme.
Una tolerancia razonable es suficiente.
 
⸻
 
19. RENDIMIENTO
El índice debe estar preparado para crecer sin que la búsqueda se vuelva lenta.
Preferir:
* Datos locales para funciones estáticas.
* Cálculo eficiente de relevancia.
* Evitar llamadas de red para cada letra.
* Evitar llamar a la IA mientras el usuario simplemente busca una función.
La búsqueda interna debe sentirse prácticamente instantánea.
 
⸻
 
20. IA COMO FALLBACK
La IA no debe sustituir al buscador.
El flujo correcto será:
Usuario busca
       ↓
¿Existe una función relacionada?
       ↓
SÍ → mostrar función
       ↓
NO / pregunta → ofrecer IA
Si existen ambas posibilidades:
FUNCIONES ENCONTRADAS
↓
resultado 1
resultado 2

PREGUNTAR A JC
↓
Enviar consulta a IA
 
⸻
 
21. PRIVACIDAD
El motor interno no debe enviar automáticamente cada búsqueda a la IA.
Ejemplo:
Usuario escribe:
colores
Eso debe resolverse localmente.
No enviar:
"colores"
a un servidor solamente para buscar una función interna.
La IA solamente debe intervenir cuando realmente corresponda.
 
⸻
 
22. PRUEBAS OBLIGATORIAS
Crear una batería de pruebas con:
Coincidencias exactas
colores
sueño
entrenamiento
economía
Coincidencias parciales
colo
entren
dormi
Sinónimos
dinero → economía
tema → apariencia
noche → modo oscuro
Errores
colroes
entrenaminto
Preguntas
¿cómo puedo mejorar?
¿cómo cambio los colores?
¿cómo organizo mi entrenamiento?
Sin resultados
xyzabc123
 
⸻
 
23. CRITERIO DE ÉXITO
La Fase 3 se considera terminada únicamente cuando:
* El buscador conoce las funciones registradas.
* Las funciones pueden encontrarse mediante diferentes términos.
* Los resultados están correctamente ordenados.
* Los resultados pueden abrir su destino.
* Los ajustes internos pueden localizarse.
* Las búsquedas funcionan sin conexión cuando la función buscada es local.
* La IA no se utiliza innecesariamente.
* El sistema puede ampliarse fácilmente.
* No se ha roto ninguna funcionalidad existente.
 
⸻
 
24. REGLA FINAL
NO crear un sistema de búsqueda gigante y difícil de mantener.
Debe ser:
CENTRALIZADO
ESCALABLE
RÁPIDO
PREDECIBLE
FÁCIL DE ACTUALIZAR
Y, sobre todo:
Si una nueva función entra en JC Fitness, debe poder incorporarse al buscador añadiendo una única entrada bien definida.
 
⸻
 
FINAL DE FASE 3
Completar y probar todo este motor.
NO avanzar automáticamente a la Fase 4.
La siguiente fase será la integración final entre:
BUSCADOR + IA + INTENCIÓN DEL USUARIO
para conseguir que JC Fitness sepa cuándo debe llevar al usuario a una función y cuándo debe responderle mediante inteligencia artificial.

Perfecto. Seguimos con la Fase 2, que será bastante más técnica porque aquí no quiero que Claude haga simplemente una lupa visual: tiene que convertirse en un buscador inteligente de toda la aplicación + acceso a la IA.
FASE 2 — BUSCADOR INTELIGENTE + ACCESO A LA IA
OBJETIVO
Crear un nuevo acceso en la parte superior izquierda de la pantalla de inicio de JC Fitness.
Este acceso debe permitir al usuario:
1. Buscar cualquier función, pantalla, ajuste u opción existente dentro de JC Fitness.
2. Encontrar opciones aunque el usuario no escriba exactamente su nombre.
3. Acceder directamente al resultado encontrado.
4. Hacer preguntas a la IA cuando no esté buscando una función concreta.
5. Mantener una experiencia rápida, limpia y premium.
NO quiero una simple lupa que filtre textos.
Quiero un sistema inteligente de navegación y búsqueda contextual dentro de JC Fitness.
 
⸻
 
1. BOTÓN SUPERIOR IZQUIERDO
Añadir un botón pequeño en la zona superior izquierda del Dashboard.
Debe integrarse con el diseño actual.
Utilizar un icono reconocible de:
Lupa / búsqueda
El botón debe:
* Ser compacto.
* Tener una zona táctil cómoda.
* No ocupar demasiado espacio.
* Mantener el diseño premium.
* Respetar modo oscuro/claro.
* Tener una animación sutil al pulsarlo.
No añadir texto permanente junto al icono si esto rompe el diseño del encabezado.
 
⸻
 
2. APERTURA DEL BUSCADOR
Al pulsar el botón, abrir una interfaz de búsqueda.
Puede ser:
* Panel desplegable.
* Modal.
* Sheet desde arriba.
* Overlay.
Elegir la opción que mejor encaje con la arquitectura actual de JC Fitness.
Pero debe sentirse como una función integrada en la aplicación, no como una página completamente independiente.
La apertura debe tener una animación fluida.
 
⸻
 
3. CAMPO DE BÚSQUEDA
El usuario debe encontrarse inmediatamente con un campo de búsqueda.
Ejemplo:
¿Qué buscas o qué necesitas?
Dentro puede aparecer un placeholder como:
Buscar funciones, ajustes o preguntar a JC…
Debe existir:
* Icono de búsqueda.
* Campo de texto.
* Botón para limpiar.
* Botón para cerrar cuando corresponda.
El campo debe recibir el foco automáticamente al abrirse cuando sea apropiado.
 
⸻
 
4. DOS TIPOS DE BÚSQUEDA
El sistema debe entender dos intenciones principales.
A. BUSCAR DENTRO DE JC FITNESS
Ejemplo:
colores
Resultado:
Apariencia
Cambiar colores de la aplicación
[ Abrir ]
Otro ejemplo:
dormir
Resultado:
Sueño
Gestionar sueño y estadísticas
[ Abrir ]
Otro:
racha
Resultado:
Rachas
Ver y configurar tus rachas
[ Abrir ]
 
⸻
 
B. PREGUNTAR A LA IA
Ejemplo:
¿Cómo puedo mejorar mi entrenamiento?
Aquí no debe intentar buscar literalmente una pantalla llamada “mejorar entrenamiento”.
Debe detectar que se trata de una pregunta y ofrecer la IA.
Ejemplo:
Pregunta a JC
¿Cómo puedo mejorar mi entrenamiento?
[ Preguntar a la IA ]
 
⸻
 
5. BÚSQUEDA INTELIGENTE
El sistema NO debe depender únicamente de coincidencias exactas.
Debe utilizar:
* Nombre de la función.
* Descripción.
* Palabras clave.
* Sinónimos.
* Términos relacionados.
Ejemplo:
Usuario:
colores
Debe encontrar:
Ajustes → Apariencia → Colores
Usuario:
modo noche
Debe encontrar:
Ajustes → Apariencia → Modo oscuro
Usuario:
dormir
Debe encontrar:
Sueño
Usuario:
entrenar
Debe encontrar:
Entrenamiento
Usuario:
dinero
Debe encontrar:
Economía
Usuario:
notificaciones
Debe encontrar:
Ajustes → Notificaciones
No obligar al usuario a conocer exactamente cómo se llama cada apartado.
 
⸻
 
6. ÍNDICE INTERNO DE FUNCIONES
Crear una estructura centralizada de búsqueda.
Por ejemplo conceptualmente:
id
title
description
keywords
category
route
action
icon
Cada función importante de JC Fitness debe poder registrarse ahí.
Ejemplo conceptual:
{
  title: "Colores",
  description: "Personaliza los colores de JC Fitness",
  keywords: ["colores", "tema", "apariencia", "personalización"],
  category: "Ajustes",
  action: ...
}
NO duplicar innecesariamente componentes completos.
El buscador debe utilizar esta estructura para localizar y abrir funcionalidades existentes.
 
⸻
 
7. RESULTADOS
Los resultados deben aparecer mientras el usuario escribe.
Ejemplo:
Usuario escribe:
co
Aparecen posibles coincidencias.
Usuario escribe:
colores
Se priorizan los resultados más relevantes.
Cada resultado debe mostrar como mínimo:
* Icono.
* Nombre.
* Categoría o ubicación.
* Descripción breve si es útil.
Ejemplo:
Colores Ajustes → Apariencia
Al pulsarlo:
→ llevar directamente a la opción correspondiente.
 
⸻
 
8. ORDEN DE RESULTADOS
Los resultados deben ordenarse por relevancia.
Prioridad:
1. Coincidencia exacta.
2. Coincidencia con el nombre.
3. Coincidencia con palabras clave.
4. Coincidencia con descripción.
5. Coincidencias semánticamente relacionadas.
Por ejemplo, si el usuario escribe:
color
“Colores” debe aparecer antes que cualquier función que simplemente contenga una palabra relacionada.
 
⸻
 
9. RESULTADO SIN COINCIDENCIAS
Si el usuario busca algo que no existe:
Mostrar un estado vacío elegante.
Ejemplo:
No hemos encontrado esa función
Y debajo:
Puedes preguntarle a JC mediante la IA.
[ Preguntar a JC ]
Esto evita que el buscador termine en una pantalla vacía.
 
⸻
 
10. IA
El buscador debe tener una entrada clara hacia la IA.
La IA debe poder recibir directamente el texto que el usuario ha escrito.
Ejemplo:
Usuario escribe:
¿Cómo puedo organizar mejor mi día?
El sistema puede mostrar:
Preguntar a JC
¿Cómo puedo organizar mejor mi día?
Al pulsarlo, abrir la interfaz de IA con esa pregunta ya preparada.
NO obligar al usuario a escribir la pregunta otra vez.
 
⸻
 
11. DIFERENCIACIÓN ENTRE BÚSQUEDA Y PREGUNTA
El sistema debe intentar detectar la intención.
Ejemplos de preguntas:
* “¿Cómo puedo…?”
* “¿Qué debería…?”
* “¿Cómo hago…?”
* “¿Por qué…?”
* “Recomiéndame…”
* “Ayúdame a…”
Estas deben priorizar la opción de IA.
Pero si existe una función directamente relacionada, también puede mostrarla.
Ejemplo:
¿Cómo cambio los colores?
Resultados:
Cambiar colores Ajustes → Apariencia
y
Preguntar a JC
Esto es mejor que obligar al usuario a elegir entre búsqueda o IA desde el principio.
 
⸻
 
12. ACCESO DIRECTO
Cuando el usuario pulse un resultado:
Debe llevarlo directamente al lugar correspondiente.
No hacer:
Buscar → cerrar → Dashboard → Ajustes → Apariencia → Colores.
Debe hacer:
Buscar → Colores → abrir directamente Colores.
Si es posible técnicamente, utilizar una acción o navegación directa.
 
⸻
 
13. ANIMACIONES
La experiencia debe tener microanimaciones.
Al abrir:
* Fade.
* Slide.
* Focus en buscador.
Al mostrar resultados:
* Aparición progresiva muy ligera.
Al seleccionar:
* Feedback táctil/visual.
* Navegación fluida.
No exagerar las animaciones.
La prioridad es:
VELOCIDAD > EFECTOS
JC Fitness debe sentirse instantáneo.
 
⸻
 
14. MÓVIL
Diseñar primero pensando en móvil.
Comprobar:
* iPhone.
* Pantallas pequeñas.
* Teclado abierto.
* Teclado cerrado.
* Scroll.
* Orientación vertical.
Cuando aparezca el teclado:
El campo de búsqueda debe seguir siendo visible.
Los resultados no deben quedar ocultos detrás del teclado.
 
⸻
 
15. CIERRE
Debe existir una forma clara de cerrar:
* Botón X.
* Gesto si la arquitectura lo permite.
* Pulsación fuera del panel si se utiliza overlay.
Al cerrar:
* El buscador desaparece.
* Se limpia correctamente el estado temporal.
* No debe modificar datos de la aplicación.
 
⸻
 
16. NO MODIFICAR LA IA ACTUAL SIN NECESIDAD
Si JC Fitness ya dispone de una función de IA:
* Reutilizarla cuando sea posible.
* No crear otra implementación duplicada.
* No romper la IA existente.
* No exponer claves API en el frontend.
* Mantener la arquitectura de seguridad existente.
Esta fase crea el punto de acceso inteligente.
La arquitectura interna de la IA podrá perfeccionarse posteriormente si fuera necesario.
 
⸻
 
17. ARQUITECTURA PREPARADA PARA CRECER
El índice de búsqueda debe estar preparado para futuras funciones.
Cuando añadamos nuevos módulos a JC Fitness, debería ser sencillo registrar nuevas entradas.
Por ejemplo:
Nueva función
↓
Añadir al índice
↓
El buscador puede encontrarla
No quiero tener que modificar manualmente toda la lógica del buscador cada vez que aparezca una nueva función.
 
⸻
 
18. SEGURIDAD
No utilizar búsqueda para exponer información privada que el usuario no debería poder consultar.
La búsqueda puede encontrar funcionalidades y navegación, pero no debe revelar:
* Contraseñas.
* Tokens.
* Claves API.
* Información técnica sensible.
* Datos privados de otros usuarios.
 
⸻
 
19. CONTROL DE CALIDAD
Probar como mínimo estas búsquedas:
“colores”
→ debe encontrar colores.
“modo oscuro”
→ debe encontrar modo oscuro.
“dormir”
→ debe encontrar Sueño.
“entrenamiento”
→ debe encontrar Entrenamiento.
“dinero”
→ debe encontrar Economía.
“racha”
→ debe encontrar Rachas si el módulo existe.
“sonidos”
→ debe encontrar Sonidos si el módulo existe.
“¿cómo puedo mejorar mi entrenamiento?”
→ debe ofrecer IA.
“asdfghjkl”
→ debe mostrar correctamente el estado de no resultados.
 
⸻
 
20. REGLA FUNDAMENTAL
NO construir una simple lupa estética.
El resultado final debe ser:
BUSCAR → ENCONTRAR → ABRIR
y también:
PREGUNTAR → IA → RESPUESTA
Todo desde el mismo acceso.
 
⸻
 
FINAL DE FASE 2
Antes de terminar:
* Comprobar navegación.
* Comprobar búsqueda.
* Comprobar resultados.
* Comprobar palabras relacionadas.
* Comprobar búsqueda sin resultados.
* Comprobar acceso a IA.
* Comprobar teclado móvil.
* Comprobar modo oscuro.
* Comprobar que no se han roto otras funciones.
NO avanzar todavía a la Fase 3.
La Fase 3 se encargará de desarrollar de forma más profunda el motor de búsqueda interno y su índice global de funciones, para que el sistema pueda conocer y localizar prácticamente cualquier elemento de JC Fitness.

Perfecto. La Fase 1 se centra exclusivamente en arreglar el desplegable de la pantalla de inicio. La idea es que Claude no toque todavía el buscador/IA de las fases siguientes.
FASE 1 — REDISEÑO DEL DESPLEGABLE DE INICIO: VACACIONES, EXÁMENES Y SITUACIONES
OBJETIVO
Rediseñar completamente el bloque de la pantalla de inicio relacionado con Vacaciones, Exámenes y otras situaciones, porque el diseño actual no cumple el comportamiento esperado.
El objetivo NO es simplemente cambiar colores, tamaños o estilos.
Hay que cambiar principalmente la estructura visual y el comportamiento del componente para convertirlo en un elemento realmente desplegable, compacto y elegante.
Debe sentirse como una función premium de JC Fitness y no como un bloque que ocupa espacio permanentemente.
 
⸻
 
1. COMPORTAMIENTO PRINCIPAL
El componente debe tener dos estados:
ESTADO CERRADO
Cuando el usuario entra en la pantalla de inicio, el componente debe aparecer cerrado por defecto, salvo que exista una razón funcional para mantenerlo abierto.
En este estado:
* Debe ocupar muy poco espacio vertical.
* Debe mostrarse como un botón/tarjeta compacta.
* No debe enseñar todo su contenido.
* No debe ocupar el mismo espacio que cuando está desplegado.
* Debe quedar perfectamente integrado en el Dashboard.
* Debe ser fácil de identificar.
* Debe dejar claro visualmente que se puede pulsar para expandir.
Ejemplo conceptual:
[ Situación actual ˅ ]
o una variante visual equivalente que encaje mejor con el diseño actual.
NO quiero una tarjeta grande vacía esperando a ser expandida.
El estado cerrado tiene que ser realmente compacto.
 
⸻
 
2. ESTADO ABIERTO
Al pulsar el botón:
* El componente se expande.
* Aparece todo su contenido.
* Se muestran las opciones correspondientes.
* El contenido aparece de forma progresiva y fluida.
* El resto del Dashboard se desplaza de forma natural si es necesario.
* No debe aparecer contenido de golpe de manera brusca.
* No debe producirse un salto visual extraño.
Cuando está abierto debe poder utilizarse normalmente.
 
⸻
 
3. ANIMACIÓN DE APERTURA
La animación es una parte FUNDAMENTAL de esta fase.
NO hacer simplemente:
display: none → display: block
porque eso genera una aparición brusca.
La apertura debe sentirse como un verdadero componente desplegable.
Debe existir una transición fluida de:
compacto → expandido
y posteriormente:
expandido → compacto
La animación debe incluir, si encaja con el sistema visual:
* Expansión vertical.
* Opacidad progresiva del contenido.
* Ligero desplazamiento/fade del contenido.
* Animación del icono de expandir/contraer.
* Transición suave del contenedor.
La animación debe ser rápida pero premium.
No quiero una animación lenta o exagerada.
Debe sentirse similar a una interfaz moderna de iOS.
 
⸻
 
4. BOTÓN DE EXPANSIÓN
Debe existir un elemento claramente pulsable.
Puede utilizar:
* Chevron.
* Flecha.
* Icono equivalente.
Cuando esté cerrado:
⌄
Cuando esté abierto:
⌃
El icono debe rotar mediante una animación suave en lugar de cambiar bruscamente.
Toda la zona principal del botón puede ser pulsable, no únicamente el icono.
Esto es especialmente importante en móvil.
 
⸻
 
5. CONTENIDO DEL DESPLEGABLE
Al expandirse deben aparecer las opciones que ya existan actualmente para:
* Vacaciones.
* Exámenes.
* Otras situaciones/modos.
NO eliminar ninguna funcionalidad existente.
Esta fase es principalmente una mejora de UX/UI y comportamiento, no una eliminación de funcionalidades.
Si actualmente existen datos, estados, formularios o acciones asociados a estas opciones, deben seguir funcionando exactamente igual después del rediseño.
 
⸻
 
6. DISEÑO VISUAL
Mantener el lenguaje visual actual de JC Fitness.
Debe sentirse:
* Premium.
* Minimalista.
* Moderno.
* Limpio.
* Rápido.
* Elegante.
* Adaptado a móvil.
No convertirlo en una tarjeta gigante.
No añadir elementos decorativos innecesarios.
No utilizar demasiados bordes, sombras o efectos.
El componente debe integrarse visualmente con el resto del Dashboard.
 
⸻
 
7. PRIORIDAD: ESPACIO EN PANTALLA
Este punto es CRÍTICO.
El usuario debe poder ver una parte mucho mayor de la pantalla de inicio cuando el componente está cerrado.
Por tanto:
CERRADO
Debe ocupar únicamente el espacio necesario para mostrar:
* Nombre/estado.
* Icono o indicador.
* Botón de expansión.
ABIERTO
Debe ocupar únicamente el espacio necesario para mostrar el contenido.
Nunca reservar desde el principio el espacio correspondiente al estado abierto.
 
⸻
 
8. RESPONSIVE / MÓVIL
JC Fitness está pensado principalmente para utilizarse desde móvil.
Por tanto, comprobar específicamente:
* iPhone.
* Pantallas pequeñas.
* Pantallas medianas.
* Diferentes alturas de pantalla.
* Modo oscuro.
* Modo claro si existe.
No debe producir:
* Scroll horizontal.
* Texto cortado.
* Botones demasiado pequeños.
* Contenido desbordado.
* Animaciones que deformen la pantalla.
* Saltos del Dashboard.
La zona táctil debe ser suficientemente grande para pulsarla cómodamente con el dedo.
 
⸻
 
9. ESTADO Y PERSISTENCIA
El estado del desplegable debe estar correctamente controlado.
Utilizar un estado claro del tipo:
isExpanded
o equivalente.
No crear soluciones improvisadas.
Al abrir:
isExpanded = true
Al cerrar:
isExpanded = false
La aplicación debe actualizarse correctamente sin afectar a otros componentes.
No es necesario guardar permanentemente la apertura/cierre en la base de datos salvo que la arquitectura actual ya lo requiera.
No crear datos innecesarios.
 
⸻
 
10. ACCESIBILIDAD Y USABILIDAD
El componente debe ser accesible.
El botón debe indicar claramente:
* Que puede expandirse.
* Que puede contraerse.
* Su estado actual.
Utilizar atributos apropiados, por ejemplo:
aria-expanded
y un identificador del contenido relacionado mediante:
aria-controls
si corresponde a la arquitectura utilizada.
El contraste debe seguir siendo correcto.
 
⸻
 
11. NO ROMPER NADA EXISTENTE
Antes de modificar el componente:
1. Localiza cómo está implementado actualmente.
2. Identifica todos los estados relacionados.
3. Identifica todos los datos que utiliza.
4. Identifica todas las acciones que ejecuta.
5. Mantén esas funcionalidades.
6. Cambia únicamente la presentación y el comportamiento necesario para conseguir el nuevo sistema desplegable.
NO rehacer innecesariamente otras partes del Dashboard.
NO modificar todavía:
* Buscador.
* Lupa.
* IA.
* Rachas.
* Sonidos.
* Otros módulos.
Esas funcionalidades pertenecen a fases posteriores.
 
⸻
 
12. CONTROL DE CALIDAD
Antes de considerar terminada esta fase, comprobar manualmente:
Cerrado
* ¿Ocupa poco espacio?
* ¿Se entiende que es desplegable?
* ¿El Dashboard queda limpio?
Apertura
* ¿Se abre suavemente?
* ¿La animación es fluida?
* ¿El contenido aparece correctamente?
* ¿El resto de la pantalla se adapta?
Cierre
* ¿Se cierra suavemente?
* ¿Vuelve exactamente al estado compacto?
* ¿No queda espacio vacío?
Móvil
* ¿Se puede pulsar cómodamente?
* ¿No hay desbordamientos?
* ¿No rompe el scroll?
Funcionalidad
* ¿Vacaciones sigue funcionando?
* ¿Exámenes sigue funcionando?
* ¿Las demás situaciones siguen funcionando?
* ¿Los datos existentes se conservan?
 
⸻
 
13. REGLA IMPORTANTE
NO quiero una solución que simplemente haga que la tarjeta parezca más pequeña.
Quiero un componente verdaderamente colapsable/expandible.
La diferencia fundamental es:
❌ Tarjeta grande que visualmente oculta contenido.
✅ Componente compacto que realmente cambia de tamaño y revela su contenido mediante una animación.
El espacio ocupado por el componente debe cambiar físicamente entre ambos estados.
 
⸻
 
14. RESULTADO FINAL ESPERADO
Al entrar en Inicio, el usuario debe encontrarse algo parecido conceptualmente a:
Estado cerrado
Situación actual · Vacaciones ›
Muy compacto.
Al pulsarlo:
Estado abierto
Situación actual · Vacaciones ˄
────────────────────────
Vacaciones
[ opciones / configuración ]
Exámenes
[ opciones / configuración ]
Otras situaciones
[ opciones / configuración ]
Todo ello con una transición suave y premium.
La implementación visual concreta puede adaptarse al diseño existente de JC Fitness, pero debe respetar obligatoriamente el principio:
CERRADO = COMPACTO
ABIERTO = CONTENIDO COMPLETO
TRANSICIÓN = FLUIDA
 
⸻
 
FINAL DE FASE 1
Cuando termines esta fase:
1. Comprueba que no se ha roto ninguna funcionalidad existente.
2. Comprueba el comportamiento en móvil.
3. Comprueba apertura y cierre repetidos.
4. Comprueba modo oscuro/claro si ambos existen.
5. Comprueba que no quedan espacios vacíos al cerrar.
6. No avances automáticamente a la Fase 2.
Deja la Fase 1 completamente terminada y lista para que posteriormente se pueda implementar la Fase 2 — Buscador inteligente + acceso a la IA.

Sí. Antes de escribirte la prompt, yo lo separaría en varias fases, porque aquí realmente hay dos sistemas importantes y si se lo das todo de golpe a Claude puede hacer una solución superficial.

Lo que voy a desarrollar es esto:

FASE 1 — Rediseño del desplegable de Inicio

Vamos a rehacer completamente el bloque de “Vacaciones / Exámenes / otras situaciones”.

* Botón pequeño y discreto.
* No ocupa el espacio completo cuando está cerrado.
* Al pulsarlo, se expande mediante una animación fluida.
* Al cerrarlo, vuelve a su tamaño mínimo.
* Nada de bloques enormes ocupando media pantalla.
* Transición visual premium, coherente con JC Fitness.
* Debe funcionar correctamente en móvil.
* Se mantiene todo el contenido y funcionalidad actual, pero se cambia la presentación.
* Se tendrá en cuenta el estado abierto/cerrado para que no produzca saltos raros en el resto del Dashboard.

FASE 2 — Nuevo acceso superior izquierdo: búsqueda/IA

Aquí quiero que construyamos un sistema mucho más potente que una simple lupa.

El botón superior izquierdo abrirá un buscador inteligente de JC Fitness.

Por ejemplo, el usuario escribe:

“colores”

Y el sistema encuentra las opciones relacionadas con colores y permite entrar directamente a ellas.

Si escribe:

“dormir”

puede mostrar Sueño, configuración relacionada, estadísticas, etc.

Si escribe:

“racha”

muestra todo lo relacionado con rachas.

Y si escribe:

“¿cómo puedo mejorar mi sueño?”

entonces entra en el modo de pregunta a la IA.

Es decir, habrá que diferenciar entre:

🔎 Buscar dentro de la aplicación

* Ajustes
* Funciones
* Pantallas
* Opciones
* Herramientas
* Datos relevantes

y

🤖 Preguntar a la IA

* Preguntas
* Recomendaciones
* Cómo hacer algo
* Explicaciones
* Ayuda personalizada

FASE 3 — Motor de búsqueda interno

Esta parte es importante para que no sea una falsa lupa.

Crearemos un sistema de búsqueda que conozca la estructura de JC Fitness:

* Todas las pantallas.
* Todos los módulos.
* Ajustes.
* Funciones.
* Opciones configurables.
* Objetivos.
* Entrenamiento.
* Sueño.
* Nutrición.
* Economía.
* Etc.

Y tendrá sinónimos y palabras relacionadas, para que no tengas que escribir exactamente el nombre de una función.

Por ejemplo:

“colores” → Apariencia → Colores
“modo noche” → Apariencia → Modo oscuro
“dormir” → Sueño
“pesas” → Entrenamiento
“racha” → Rachas
“sonidos” → Sonidos

Además, cada resultado debería poder llevarte directamente al sitio correspondiente, no simplemente enseñarte el nombre.

FASE 4 — IA integrada en ese mismo acceso

Finalmente hacemos la parte inteligente.

Desde ese mismo botón podrás escribir algo como:

“¿Cómo puedo organizar mejor mi entrenamiento?”

o

“¿Dónde cambio los colores?”

o

“Quiero añadir un objetivo nuevo.”

La aplicación determinará si lo que buscas es una función existente o una pregunta para la IA.

Y cuando sea una función existente, idealmente podrá ofrecer:

“He encontrado esto → Abrir”

para llevarte directamente a la pantalla.

⸻

Así que yo haría 4 fases.

Y además hay una cosa importante: no le diría a Claude simplemente “haz un buscador y una IA”, porque puede terminar haciendo una caja de búsqueda bonita que realmente no conozca toda la aplicación.

Primero le damos una introducción general de las 4 fases, y después le pasamos Fase 1, Fase 2, Fase 3 y Fase 4 por separado. Así puede desarrollar y comprobar cada sistema antes de pasar al siguiente.

Si quieres hacerlo bien de verdad, empezaría por la Fase 1 y la haría extremadamente específica, incluyendo exactamente cómo debe comportarse cerrado, al pulsarlo, durante la animación y al volver a cerrarlo.
