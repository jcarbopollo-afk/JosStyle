> **Nota de procedencia:** este documento es la transcripción íntegra y sin resumir de la nota "SISTEMA OPERATIVO PERSONAL — ESPECIFICACIÓN FUNCIONAL — MÓDULO AJUSTES — ENTREGA 1" que Josué pegó en el chat. Se conserva aquí completo, apartado por apartado (1 a 1300), tal como fue recibido, para que cualquier conversación futura con Claude pueda retomarlo sin depender del historial de chat. **No editar ni resumir este contenido** — si Josué amplía o corrige la nota, añadir el texto nuevo o sustituir el apartado afectado, nunca recortar apartados existentes.
>
> Es la **Entrega 1** de un documento más amplio (el propio texto se titula "Entrega 1 — Arquitectura general (Parte 1)"), centrada en el módulo **Ajustes** de AXION (nombre que esta especificación da al motor de IA del Sistema Operativo Personal — en el proyecto real hasta ahora simplemente "IA"). Se esperan más entregas para otros módulos. Ver `HANDOFF.md` sección "Especificación extendida (post-v1.0)" para el análisis de viabilidad, el plan de fases propuesto (Fase 22 en adelante) y las contradicciones detectadas frente a las reglas ya vigentes en `HANDOFF.md` sección 17.

---

# SISTEMA OPERATIVO PERSONAL
# ESPECIFICACIÓN FUNCIONAL
# MÓDULO AJUSTES
# ENTREGA 1 — ARQUITECTURA GENERAL (PARTE 1)

Versión: 1.0
Estado: Especificación funcional para implementación.

---

## 1. Objetivo del módulo

El módulo Ajustes constituye el centro de configuración del Sistema Operativo Personal. Su finalidad es proporcionar al usuario un lugar único desde el que controlar el comportamiento visual, funcional y técnico de toda la aplicación.

No debe concebirse como una pantalla secundaria ni como un listado de preferencias. Debe actuar como el "panel de control" del sistema, desde el cual cualquier cambio realizado tenga un efecto inmediato, consistente y reversible sobre el resto de módulos.

Toda configuración almacenada en Ajustes deberá persistir entre sesiones y sincronizarse entre dispositivos cuando el usuario disponga de sincronización en la nube.

---

## 2. Objetivos de diseño

El módulo debe cumplir simultáneamente los siguientes principios:

- Configuración rápida.
- Organización intuitiva.
- Descubrimiento sencillo.
- Escalabilidad ilimitada.
- Consistencia visual.
- Cambios instantáneos.
- Persistencia automática.
- Sin recargas.
- Sin botones de guardar.
- Compatible con futuras funciones.

El usuario nunca debe pensar "¿dónde estaba esa opción?". La arquitectura debe permitir encontrar cualquier ajuste en menos de tres interacciones o mediante el buscador.

---

## 3. Estructura general

La pantalla se divide en tres grandes zonas:

### Cabecera

Incluye:

- fotografía del usuario;
- nombre;
- saludo contextual;
- nivel del sistema;
- acceso rápido al perfil;
- buscador de ajustes.

La cabecera permanece fija durante los primeros píxeles de desplazamiento y posteriormente se contrae de forma progresiva.

### Zona de categorías

Contiene todas las secciones principales.

Cada categoría se representa mediante una tarjeta con:

- icono;
- nombre;
- descripción breve;
- indicador visual cuando exista alguna configuración pendiente o especial;
- flecha de navegación.

Todas las tarjetas mantienen la misma altura y espaciado para conservar una jerarquía visual uniforme.

### Pie

Contiene únicamente información secundaria:

- versión instalada;
- número de compilación;
- enlaces legales;
- créditos;
- información técnica.

Nunca debe mezclarse con las opciones de configuración.

---

## 4. Orden de categorías

El orden debe mantenerse estable para facilitar la memoria muscular del usuario.

1. Perfil.
2. Apariencia.
3. Pantalla principal.
4. Preferencias generales.
5. Notificaciones.
6. Inteligencia Artificial.
7. Seguridad.
8. Privacidad.
9. Datos.
10. Sincronización.
11. Integraciones.
12. Accesibilidad.
13. Funciones experimentales.
14. Información.

No se permite reordenar estas categorías automáticamente.

---

## 5. Diseño de las tarjetas

Cada categoría utiliza un componente reutilizable.

La tarjeta incluye:

- icono circular;
- color asociado;
- título;
- descripción;
- indicador de estado;
- flecha.

Puede incorporar indicadores adicionales como:

- configuración incompleta;
- nueva función;
- sincronización desactivada;
- error;
- actualización disponible.

Las animaciones nunca deben superar los 220 ms.

---

## 6. Jerarquía visual

Las categorías más utilizadas deben encontrarse en la parte superior.

El orden responde a la frecuencia de uso prevista:

Perfil.
Apariencia.
Dashboard.
Notificaciones.
IA.

El usuario no debería tener que desplazarse para acceder a las opciones utilizadas semanalmente.

---

## 7. Comportamiento general

Todos los ajustes comparten el mismo comportamiento:

- modificación inmediata;
- guardado automático;
- actualización instantánea;
- sincronización diferida cuando sea necesario.

No existen botones "Guardar", "Aceptar" o "Aplicar".

Cada interacción representa una modificación definitiva, aunque siempre podrá revertirse.

---

## 8. Componentes permitidos

Para mantener coherencia únicamente podrán utilizarse los siguientes componentes de interfaz:

- Switch.
- Segmented Control.
- Radio Button.
- Checkbox.
- Slider.
- Selector horizontal.
- Lista.
- Stepper.
- Campo de texto.
- Selector de color.
- Selector de fecha.
- Selector de hora.
- Modal.
- Bottom Sheet.
- Diálogo de confirmación.

No deben introducirse componentes específicos para un único ajuste salvo que exista una justificación funcional clara.

---

## 9. Tipos de ajustes

Todo ajuste pertenece exactamente a una de las siguientes categorías técnicas:

**Booleano** — Activado o desactivado. Ejemplo: Modo oscuro.

**Selección única** — Una única opción disponible. Ejemplo: Idioma.

**Selección múltiple** — Varias opciones simultáneas. Ejemplo: Módulos visibles en el Dashboard.

**Numérico** — Valor entero o decimal. Ejemplo: Tamaño de fuente.

**Texto** — Información editable. Ejemplo: Nombre del usuario.

**Acción** — No modifica un valor; ejecuta una operación. Ejemplos: Exportar datos. Cerrar sesión. Eliminar cuenta.

---

## 10. Estados de cada ajuste

Todos los controles deben contemplar los mismos estados:

- reposo;
- pulsado;
- activo;
- desactivado;
- bloqueado;
- cargando;
- sincronizando;
- error.

El aspecto visual será consistente en toda la aplicación.

---

## 11. Descripciones

Cada ajuste incorpora una descripción corta.

Longitud máxima recomendada: 80 caracteres.

La descripción explica únicamente el efecto principal. Nunca describe cómo utilizar el control.

Ejemplo correcto: "Reduce las animaciones para mejorar el rendimiento."
Ejemplo incorrecto: "Pulsa este botón para activar las animaciones."

---

## 12. Navegación

La navegación entre categorías debe realizarse mediante transición lateral.

Duración: 200–250 ms.
Curva: Ease Out.

El botón de retroceso debe devolver siempre exactamente a la posición de scroll anterior. El usuario nunca perderá el contexto al volver.

---

## 13. Organización interna de las categorías

Cada categoría puede dividirse en bloques.

Ejemplo — Apariencia:
- Tema.
- Colores.
- Tipografía.
- Iconografía.
- Animaciones.

Cada bloque debe estar claramente separado mediante espacio vertical y un encabezado de sección.

---

## 14. Reglas de consistencia

Un mismo tipo de configuración nunca podrá representarse con componentes diferentes en distintas partes del sistema.

Por ejemplo: si la selección del idioma utiliza un selector de lista, ninguna otra selección equivalente utilizará botones horizontales.

Esta consistencia reduce la carga cognitiva y mejora la velocidad de aprendizaje del usuario.

---

## 15. Principios de escalabilidad

La arquitectura del módulo debe permitir añadir nuevas categorías y nuevas opciones sin modificar las existentes.

Para ello, cada categoría debe comportarse como un módulo independiente, desacoplado del resto a nivel de interfaz y lógica.

Esto facilitará la incorporación de nuevas funcionalidades en futuras versiones del Sistema Operativo Personal sin necesidad de rediseñar el módulo Ajustes completo.

---

## 16. Arquitectura general del módulo Ajustes

El módulo Ajustes actuará como el centro de configuración global de todo el Sistema Operativo Personal.

No contendrá únicamente preferencias visuales, sino cualquier configuración persistente que modifique el comportamiento de la aplicación.

Su diseño deberá estar preparado para albergar decenas de categorías sin perder claridad.

La estructura será jerárquica.

**Nivel 1:**
- Perfil
- Apariencia
- Notificaciones
- Privacidad
- Seguridad
- IA
- Datos
- Sincronización
- Accesibilidad
- Unidades
- Idioma
- Personalización
- Integraciones
- Información
- Experimental (cuando exista)

Cada categoría abrirá una pantalla independiente. Nunca se mostrarán decenas de ajustes en una única pantalla infinita.

---

## 17. Organización interna de cada categoría

Todas las categorías deberán compartir exactamente la misma estructura visual.

Orden:
1. Encabezado
2. Descripción breve
3. Bloques de configuración
4. Información contextual
5. Acciones secundarias
6. Acciones críticas (si existen)

Ejemplo — Perfil:
```
Perfil
────────────────────
Tu información personal utilizada por el sistema.
────────────────────
Datos básicos
Foto
Nombre
Fecha de nacimiento
Altura
Peso
Sexo
────────────────────
Información física
Objetivos
Actividad
Nivel deportivo
────────────────────
Acciones
Exportar perfil
Eliminar fotografía
────────────────────
```

Cada pantalla deberá ser reconocible inmediatamente como parte del mismo ecosistema.

---

## 18. Bloques (Settings Sections)

Las configuraciones nunca aparecerán como una lista interminable. Siempre deberán agruparse mediante bloques.

Cada bloque representa una temática concreta.

Ejemplo — Privacidad:
```
Biometría / PIN / Face ID / Huella
Permisos: Fotos / Cámara / Micrófono / Ubicación
Datos: Exportación / Importación / Borrado
```

Esto mejora enormemente la organización mental del usuario.

---

## 19. Tipos de elementos permitidos

El sistema utilizará un conjunto cerrado de componentes. No podrán inventarse componentes nuevos para resolver casos similares.

Los únicos tipos serán: Interruptor (ON/OFF), Selector (opciones mutuamente excluyentes), Lista de navegación (abre otra pantalla), Campo editable (texto), Selector numérico (edades, pesos, alturas, objetivos, valores), Selector de fecha, Selector de hora, Selector de color (solo para acento, nunca para información crítica), Botón de acción (Exportar/Importar/Sincronizar/Restablecer), Botón destructivo (Eliminar cuenta/Borrar datos/Cerrar sesión — siempre separado visualmente del resto).

---

## 20. Espaciado y ritmo visual

- Entre bloques: 32 px
- Entre elementos de un bloque: 16 px
- Entre título y descripción: 8 px
- Entre icono y texto: 12 px
- Padding interno: 20–24 px

Nunca deberán existir elementos visualmente pegados. La interfaz debe respirar.

---

## 21. Jerarquía tipográfica

Título principal (mayor tamaño/peso), Subtítulos (peso medio), Texto descriptivo (menor contraste), Labels (compactos), Valores (más visibles), Botones destructivos (color de advertencia).

Nunca se utilizarán tamaños arbitrarios. Toda la aplicación compartirá exactamente la misma escala tipográfica.

---

## 22. Sistema de iconografía

Cada categoría tendrá un icono representativo, no únicamente decorativo.

Ejemplos: Perfil 👤, Apariencia 🎨, Seguridad 🔒, IA ✨, Datos 💾, Privacidad 🛡️, Notificaciones 🔔, Idioma 🌐, Accesibilidad ♿, Información ℹ️.

Los iconos deberán proceder de una única librería (por ejemplo, Lucide) para mantener consistencia visual. No se mezclarán estilos (outline, filled, skeuomorphic, etc.).

---

## 23. Estados de un ajuste

Como mínimo: reposo, modificado, deshabilitado, cargando, guardando, sincronizado, sin conexión, con error, restaurado.

La representación visual de estos estados será consistente en toda la aplicación. El usuario nunca deberá preguntarse si un cambio se ha aplicado, está pendiente o ha fallado.

---

## 24. Persistencia de configuración

Ciclo de vida de cada modificación:
1. El usuario interactúa con el componente.
2. La interfaz refleja inmediatamente el nuevo valor (optimistic UI cuando sea posible).
3. Se valida el dato.
4. Se guarda localmente.
5. Se sincroniza con la base de datos cuando exista conexión.
6. Se confirma visualmente que el cambio ha sido persistido.
7. Si ocurre un error, se revierte el estado o se ofrece una acción clara para reintentar.

Este comportamiento será común a todos los módulos del Sistema Operativo Personal para evitar inconsistencias entre configuraciones.

---

## 25. Confirmación visual de cambios

El usuario nunca deberá preguntarse si un cambio ha sido guardado correctamente. Las confirmaciones nunca interrumpirán el flujo de navegación salvo cuando exista riesgo de pérdida de información.

Tipos: cambio aplicado instantáneamente, indicador de guardado, confirmación silenciosa, mensaje de éxito, confirmación mediante animación, confirmación mediante vibración háptica cuando el dispositivo lo permita.

No se utilizarán ventanas emergentes para acciones rutinarias.

---

## 26. Sistema de deshacer (Undo)

Siempre que una modificación pueda revertirse sin consecuencias, el sistema ofrecerá la posibilidad de deshacerla durante unos segundos (ej. eliminar una fotografía, restablecer un color, ocultar un módulo, cambiar una configuración visual).

La opción "Deshacer" tendrá prioridad frente a los diálogos de confirmación innecesarios. Las acciones irreversibles seguirán requiriendo confirmación explícita.

---

## 27. Dependencias entre configuraciones

Algunas opciones modificarán el comportamiento de otras, de forma completamente transparente para el usuario.

Ejemplo: Activar Face ID → desactiva automáticamente la solicitud de PIN al abrir la aplicación si así está configurado.
Ejemplo: Modo ahorro extremo → reduce animaciones, disminuye frecuencia de sincronización, limita procesos en segundo plano.

Estas relaciones deberán comunicarse mediante texto contextual, nunca mediante cambios invisibles.

---

## 28. Configuración contextual

No todas las opciones estarán siempre visibles. Ejemplo: si las notificaciones están desactivadas a nivel de sistema operativo, mostrar "Para modificar esta opción primero debes permitir las notificaciones desde el sistema" en lugar de controles inutilizables. Lo mismo con permisos, Bluetooth, ubicación, micrófono, cámara, biometría, sincronización, servicios externos.

---

## 29. Configuración avanzada

Las opciones complejas no deberán mezclarse con las configuraciones habituales. Cada categoría podrá disponer de un apartado "Configuración avanzada" destinado a usuarios con mayor conocimiento técnico: frecuencia de sincronización, exportaciones automáticas, modo desarrollador, logs, diagnóstico, funciones experimentales.

---

## 30. Modo desarrollador

Oculto durante el uso normal. Activación mediante secuencia específica (ej. múltiples pulsaciones sobre la versión). Permite: ver información técnica, comprobar sincronizaciones, tiempos de carga, analizar almacenamiento, activar logs de depuración, simular errores, forzar sincronizaciones, reiniciar cachés, probar funciones experimentales. Aislado de la configuración habitual para evitar modificaciones accidentales.

---

## 31. Información contextual (Helper Text)

Texto explicativo breve, claro, comprensible, sin tecnicismos. Nunca sustituirá una mala interfaz, solo complementará la comprensión.

---

## 32. Búsqueda de ajustes

Buscador global que indexa nombre, descripción, categoría, palabras clave y sinónimos. Filtrado instantáneo y sin recargar la interfaz.

---

## 33. Favoritos y ajustes frecuentes

Sección "Ajustes frecuentes" identificada automáticamente por uso, más favoritos marcados manualmente por el usuario (⭐). Completamente personalizable, nunca sustituye la organización principal.

---

## 34. Historial de cambios

Registro interno de modificaciones importantes (cambio de contraseña, PIN, correo, idioma, tema, dispositivo principal) con fecha, hora, configuración modificada, valor anterior, valor nuevo y dispositivo.

---

## 35. Restablecimiento de configuraciones

Cada categoría restaurable de forma independiente, más una opción global "Restablecer todas las configuraciones". Resumen previo claro de qué se ve afectado. Copia de seguridad automática previa a la restauración.

---

## 36. Copias de seguridad de la configuración

Exportable e importable sin afectar a los datos de uso del resto de módulos: preferencias visuales, idioma, unidades, personalización, configuración de IA, accesibilidad, seguridad (excepto secretos sensibles), notificaciones, integraciones autorizadas. Formato versionado.

---

## 37. Compatibilidad entre versiones

Compatibilidad hacia atrás: configuraciones antiguas siguen siendo válidas, nuevos parámetros con valores por defecto seguros, nunca se elimina una configuración existente sin proceso de migración.

---

## 38. Sistema de migración de configuraciones

Al cambiar de dispositivo/reinstalar/nuevo login: autenticación → descarga de configuración → validación de compatibilidad → conversión de versiones → aplicación de preferencias → verificación de integridad → confirmación visual. Nunca sobrescribe datos incompatibles sin advertir.

---

## 39. Configuración dependiente del dispositivo

**Configuración global** (se sincroniza): idioma, tema, color principal, perfil, objetivos, configuración de IA, accesibilidad.
**Configuración local** (solo este dispositivo): permisos del sistema, notificaciones del dispositivo, Face ID, huella, caché, archivos temporales, ruta de almacenamiento, información de depuración.

---

## 40. Resolución de conflictos

Política por defecto: última modificación válida. Configuraciones críticas (correo, contraseña, PIN, dispositivo principal) podrán requerir confirmación del usuario. Toda resolución de conflictos queda registrada.

---

## 41. Configuración offline

Funciona completamente sin conexión. Al volver la conexión: detectar cambios pendientes → validar integridad → sincronizar → resolver conflictos → confirmar sincronización.

---

## 42. Gestión de errores

Cada error debe mostrar: qué ha ocurrido, qué consecuencias tiene, cómo solucionarlo. Nunca mensajes técnicos al usuario final ("Error 502" → "No hemos podido guardar este cambio. Se volverá a intentar automáticamente.").

---

## 43. Accesibilidad completa

Compatibilidad con lectores de pantalla, navegación por teclado, contraste adecuado, áreas táctiles amplias, escalado de texto, tamaños dinámicos, indicadores no dependientes solo del color, animaciones opcionales, reducción de movimiento. Requisito de arquitectura, no mejora posterior.

---

## 44. Rendimiento

Carga inicial prácticamente inmediata, cambio de pantalla fluido, búsqueda instantánea, guardado inmediato, animaciones suaves. Las categorías cargan solo lo necesario en cada momento.

---

## 45. Consumo energético

Especial atención a sincronización, IA, animaciones, servicios en segundo plano, monitorización, procesos automáticos. Ajuste automático según modo ahorro/batería baja/inactividad prolongada.

---

## 46. Seguridad del módulo Ajustes

PIN, tokens, credenciales, integraciones, API Keys, dispositivos autorizados, configuraciones privadas: nunca en texto plano. Uso de mecanismos seguros del sistema operativo.

---

## 47. Registro de auditoría

Modificaciones importantes (login, cambio de contraseña/PIN, exportación, importación, eliminación de cuenta, restablecimiento, revocación de dispositivos) con fecha, hora, dispositivo, usuario, tipo de acción y resultado.

---

## 48. Filosofía de diseño del módulo Ajustes

El objetivo no es ofrecer cientos de opciones, sino que cada configuración sea fácil de encontrar, comprender, modificar, revertir, y difícil de romper. La interfaz debe resultar evidente desde el primer uso.

---

## 49–78. Categoría: Perfil

**49. Objetivo del módulo.** Identidad principal del usuario; toda la información aquí almacenada la usan múltiples módulos. Modificar cualquier dato se propaga automáticamente a los módulos dependientes.

**50. Objetivos funcionales.** Centralizar información personal, evitar duplicidad (Single Source of Truth), facilitar personalización automática, permitir ampliaciones futuras sin romper la estructura.

**51. Estructura.** Bloques: Identidad (fotografía, nombre, apellidos, nombre mostrado, fecha de nacimiento, edad calculada, sexo, pronombres opcional), Información física (altura, peso actual, peso objetivo, nivel de actividad, mano dominante opcional), Información deportiva (objetivo principal, deportes practicados, nivel deportivo, años de experiencia, lesiones relevantes opcional), Información académica (nivel educativo, estudios actuales, profesión opcional), Información general (idioma principal, zona horaria, país, región, sistema de unidades), Acciones (exportar perfil, importar perfil, restablecer perfil, eliminar fotografía).

**52. Fotografía de perfil.** Tomar/elegir de galería/eliminar/sustituir. Recorte cuadrado, vista previa, compresión automática, optimización para sincronización, caché local. Sin foto → avatar con iniciales.

**53. Nombre del usuario.** Usado en saludo, Dashboard, IA, recordatorios, objetivos, exportaciones, informes, compartición. Validación: no vacío, longitud máxima, normalización de espacios, compatible con caracteres internacionales.

**54. Fecha de nacimiento.** A partir de ella se calculan edad, BMR, TDEE, recomendaciones deportivas, objetivos nutricionales, estadísticas, evolución temporal. La edad nunca es editable manualmente, siempre calculada.

**55. Sexo.** Solo se usa para cálculos fisiológicos (metabolismo basal, fórmulas nutricionales, estimaciones energéticas).

**56. Altura.** Unidad configurable (cm / ft-in), con rango mín/máx y conversión automática. Internamente una única unidad estándar.

**57. Peso.** Usado en IMC, BMR, TDEE, Nutrición, evolución, Calistenia, Salud, estadísticas. Se registra peso actual + fecha + origen (manual/sincronizado/importado). El historial vive en Salud; Perfil guarda solo el valor vigente de referencia global.

**58. Peso objetivo.** Meta que no modifica el peso actual. Usado por Nutrición, Objetivos, IA, Dashboard, Estadísticas.

**59. Nivel de actividad.** Sedentario/Ligero/Moderado/Alto/Muy alto. Influye en TDEE, recomendaciones nutricionales, objetivos, IA, predicciones. Recalcula automáticamente todas las métricas dependientes al modificarse.

**60. Objetivo principal.** Ganar masa muscular / Perder grasa / Mantener peso / Mejorar rendimiento / Salud general / Calistenia / Fútbol / Productividad / Bienestar. Usado para priorizar sugerencias, métricas y contenido.

**61. Deportes practicados.** Selección múltiple y escalable (Calistenia, Fútbol, Running, Gimnasio, Natación, Ciclismo, Escalada, Baloncesto...). Cada deporte puede activar módulos/métricas/recomendaciones específicas.

**62. Nivel deportivo.** Principiante/Intermedio/Avanzado/Experto — personaliza recomendaciones y dificultad, nunca limita acceso a funcionalidades.

**63. Años de experiencia.** <1 / 1–2 / 3–5 / 5–10 / >10 años. Complementa el nivel deportivo.

**64. Lesiones relevantes.** Opcional: zona corporal, estado (activa/recuperación/histórica), fecha aproximada, observaciones. Solo la usan los módulos que la necesiten (Entrenamiento, IA).

**65. Nivel educativo.** Secundaria/Bachillerato/FP/Universidad/Máster/Doctorado/Otros.

**66. Estudios actuales.** Texto estructurado (ej. "Bachillerato Científico").

**67. Profesión.** Opcional, sin impacto directo en la mayoría de módulos; contextualiza sugerencias de IA.

**68. Idioma principal.** Idioma por defecto de toda la app; actualiza interfaz, fechas, horas, formatos y textos de IA. Arquitectura ampliable a nuevos idiomas.

**69. Zona horaria.** Automática (detectada) o manual. Todos los registros internos en UTC, conversión solo en visualización.

**70. País y región.** Formato de fecha, primer día de la semana, moneda, sistema métrico, idioma sugerido. No altera automáticamente otros ajustes ya personalizados.

**71. Sistema de unidades.** Longitud (cm / ft-in), Peso (kg / lb), Temperatura (°C/°F), Distancia (km/mi). Internamente una unidad base, conversión solo en presentación.

**72. Exportación del perfil.** Incluye datos personales, física, deportiva, académica, regional. Nunca contraseñas/tokens/biometría. Formato preparado para migraciones.

**73. Importación del perfil.** Valida versión e integridad, muestra resumen de cambios, permite sustituir completo o fusionar bloques. Nunca elimina datos sin consentimiento explícito.

**74. Restablecimiento del perfil.** Parcial (solo ciertos campos) o completo (borra todo el perfil, conserva la cuenta). Advertencia clara previa.

**75. Validaciones globales.** Campos obligatorios, rangos, longitudes, formatos, compatibilidad entre campos, normalización. Errores junto al campo, siempre explicando el motivo.

**76. Arquitectura de datos.** Perfil = Single Source of Truth; el resto de módulos consume por referencia. Cambios se propagan mediante eventos/sincronización reactiva.

**77. Sincronización del Perfil.** Actualización inmediata de interfaz → validación local → persistencia local → sincronización con la nube → confirmación → resolución de conflictos → actualización en el resto de módulos. Transparente para el usuario.

**78. Finalización de la categoría Perfil.** Debe ser escalable, modular, consistente, independiente y ampliable sin romper compatibilidad.

---

## 79–110. Categoría: Apariencia

**79. Objetivo.** Personalización visual completa sin comprometer coherencia ni experiencia. Solo afecta presentación, nunca lógica de negocio. Cambios en tiempo real.

**80. Objetivos.** Personalización, consistencia visual, accesibilidad, rendimiento, escalabilidad.

**81. Estructura.** Bloques: Tema (Claro/Oscuro/Automático), Colores (principal/secundario/acento + vista previa), Tipografía (tamaño/escala/espaciado), Interfaz (densidad/bordes/radios/transparencias), Animaciones (intensidad/duración/reducción de movimiento), Dashboard (orden de tarjetas/widgets visibles/favoritas), Avanzado (restablecer/exportar/importar apariencia).

**82. Tema.** Claro (luminoso), Oscuro (nocturno, reduce fatiga visual), Automático (sigue al sistema operativo, sin reiniciar la app).

**83. Arquitectura del sistema de temas.** Basada en tokens de diseño (fondo principal, superficie, texto principal/secundario, borde, separación, éxito/advertencia/error/informativo). Cada componente consume tokens, no colores fijos — permite añadir temas futuros sin tocar cada pantalla.

**84. Sistema de colores de acento.** Azul/Verde/Morado/Naranja/Rojo/Turquesa/Rosa/Gris. Solo afecta elementos interactivos/decorativos (botones, interruptores, progreso, seleccionados, enlaces, gráficas, estados activos, resaltados). Nunca para estados críticos (error/advertencia/éxito), que mantienen paleta semántica fija.

**85. Vista previa en tiempo real.** Antes de confirmar, previsualización inmediata de colores/botones/tarjetas/navegación/tipografía/iconos/gráficas sin salir de Ajustes. Cancelar restaura la configuración anterior.

**86. Paletas predefinidas.** Combinaciones completas (Clásico, Océano, Bosque, Medianoche, Grafito, Arena, Aurora), cada una con un conjunto coherente de colores derivados.

**87. Personalización avanzada del color.** Futuro modo avanzado con selección manual de ciertos colores no críticos, con validación automática de contraste/legibilidad (rechazo o alternativa segura si no cumple mínimos).

**88. Tipografía.** Una única familia tipográfica principal; Apariencia solo permite ajustar tamaño, escala general, espaciado entre líneas y densidad tipográfica — nunca sustituir la familia.

**89. Tamaño del texto.** Muy pequeño/Pequeño/Predeterminado/Grande/Muy grande. Recalcula automáticamente altura de componentes, márgenes, espaciados, botones y tarjetas para evitar solapamientos/cortes.

**90. Escalado inteligente.** El escalado de texto también adapta proporcionalmente iconos, botones, campos, listas, separadores, tarjetas y barras de navegación.

**91. Densidad de interfaz.** Compacta (más información, usuarios avanzados) / Estándar (recomendada) / Cómoda (más separación, botones más grandes, accesibilidad y pantallas grandes).

**92. Radios de borde.** Rectas/Suaves/Redondeadas — consumido globalmente desde el sistema de diseño, nunca definido pantalla a pantalla.

**93. Transparencias y materiales.** Efectos translúcidos opcionales (barras de navegación, paneles, diálogos, tarjetas flotantes) cuando la plataforma lo permita; se desactivan automáticamente si el dispositivo no tiene recursos suficientes.

**94. Sistema de animaciones.** Deben comunicar cambio de estado, guiar atención, mostrar continuidad, confirmar acción o reducir sensación de espera — nunca ser solo decorativas.

**95. Intensidad de las animaciones.** Completa / Reducida / Mínima / Desactivadas (solo si la plataforma o el usuario lo permite explícitamente).

**96. Duración de las transiciones.** Microinteracciones 100–150 ms, cambio de estado 150–250 ms, cambio de pantalla 250–350 ms, apertura de paneles 200–300 ms, diálogos 200–250 ms. Nunca duraciones arbitrarias.

**97. Curvas de animación.** Entrada = Ease Out, Salida = Ease In, Cambio de estado = Ease In-Out. Consistencia temporal tan importante como visual.

**98. Reducción automática de movimiento.** Respeta "Reducir movimiento" del sistema operativo: menos desplazamiento, sin animaciones complejas, fundidos simples, sin efectos de profundidad innecesarios.

**99. Microinteracciones.** Activar interruptor, guardar, completar tarea, añadir objetivo, eliminar elemento, cambiar pestaña — muy breves, nunca interfieren con la velocidad de uso.

**100. Sistema de iconografía.** Una única familia (mismo grosor, estilo, proporción, cuadrícula, filosofía visual).

**101. Personalización del estilo de iconos.** Por defecto no editable por el usuario (preserva identidad visual); arquitectura preparada para estilos alternativos futuros (outline/relleno/mixto) manteniendo coherencia.

**102. Fondos de la aplicación.** Color sólido / degradado sutil / textura ligera / material translúcido. Nunca reducen legibilidad; elementos interactivos siempre priorizados visualmente.

**103. Personalización del Dashboard.** Mostrar/ocultar tarjetas, reordenar módulos, fijar elementos importantes, elegir tarjetas destacadas, definir pantalla inicial. Interacción directa (drag&drop) o controles accesibles equivalentes.

**104. Gestión de widgets.** Cada tarjeta del Dashboard = widget independiente con configuración propia (visible/oculto, tamaño, posición, nivel de detalle, información mostrada). Arquitectura ampliable sin modificar el resto del Dashboard.

**105. Ordenación de widgets.** Reorganización libre, animaciones fluidas, reordenación inmediata, persistencia automática, sincronización entre dispositivos. Conflictos → conservar la distribución más reciente o confirmar si hay riesgo de pérdida.

**106. Configuración individual de widgets.** Ejemplo: Widget de Sueño (promedio semanal, horas dormidas, calidad, tendencias); Widget de Economía (balance, últimos movimientos, objetivo de ahorro); Widget de Entrenamiento (próxima sesión, progreso semanal, objetivos activos). Nunca afecta a otros widgets.

**107. Restablecimiento de la apariencia.** Parcial (por bloque) o completo, con resumen previo de qué se pierde.

**108. Exportación e importación de temas.** Tema, colores, tipografía, densidad, animaciones, Dashboard, widgets, preferencias visuales. Validación de compatibilidad antes de aplicar.

**109. Principios finales.** Funcionalidad > decoración; personalización nunca compromete accesibilidad; coherencia visual > personalización extrema; todo cambio reversible; sincronización transparente; rendimiento nunca sacrificado por efectos visuales.

**110. Finalización de la categoría Apariencia.** Base para futuras ampliaciones (temas, paletas, widgets, estilos) sin romper compatibilidad ni escalabilidad.

---

## 111–138. Categoría: Notificaciones

**111. Objetivo.** Centro de gestión de todos los avisos. Prioridad a calidad sobre cantidad — si una notificación no aporta utilidad, no debe enviarse.

**112. Objetivos funcionales.** Centralizar configuración, reducir interrupciones innecesarias, adaptarse a hábitos del usuario, control granular, coherencia entre dispositivos, respetar políticas del sistema operativo.

**113. Arquitectura general.** Toda notificación pertenece a una categoría (Salud, Sueño, Entrenamiento, Nutrición, Economía, Estudios, Productividad, IA, Objetivos, Calendario, Sistema, Seguridad, Sincronización), configurable de forma independiente.

**114. Estructura de la pantalla.** Bloques: Estado general (activadas/permiso del sistema/última sincronización), Categorías, Horarios, Prioridades, Sonidos, Vibración, Resumen diario, Avanzado (diagnóstico/historial/restablecimiento).

**115. Permiso del sistema.** Detección automática del estado (Permitidas/Denegadas/Limitadas/Provisionales). Si está desactivado, no se muestran interruptores inútiles: se explica y se da acceso directo a los ajustes del sistema.

**116. Activación global.** Interruptor principal. Desactivado = todas las notificaciones suspendidas salvo seguridad de cuenta cuando la plataforma y el usuario lo permitan. Reversible en cualquier momento.

**117. Configuración por categorías.** Cada módulo con su propia configuración independiente (ejemplos: Entrenamiento — recordatorio previo/posterior, objetivos semanales, progreso; Sueño — hora de dormir/despertar, resumen semanal; Economía — gastos elevados, objetivo de ahorro, balance mensual; IA — recomendaciones, nuevas sugerencias, análisis disponibles).

**118. Tipos de notificaciones.** Recordatorio, Información, Confirmación, Advertencia, Logro, Resumen, Recomendación, Seguridad, Sincronización, Error — cada uno con presentación coherente y reconocible.

**119. Niveles de prioridad.** Muy alta (seguridad/sincronización crítica/imprescindibles), Alta (eventos importantes/recordatorios críticos), Media (recordatorios habituales/objetivos/hábitos), Baja (consejos/estadísticas/sugerencias).

**120. Programación horaria.** Franjas horarias por día de la semana (ej. 08:00–22:00). Fuera de ellas, notificaciones no críticas se aplazan al siguiente periodo permitido.

**121. Modo silencioso interno.** Independiente del modo silencioso del dispositivo: pausa recordatorios, recomendaciones y agrupa avisos de baja prioridad; solo se mantienen las críticas definidas por el usuario. Manual o programado.

**122. Horas de descanso.** Ej. 23:00–07:00: se suspenden avisos ordinarios, se reagrupan los informativos, solo pasan las excepciones marcadas. Especialmente importante para Sueño/Productividad.

**123. Frecuencia de recordatorios.** Una sola vez / Diariamente / Días laborables / Fines de semana / Semanalmente / Mensualmente / Personalizada, con lenguaje claro, sin jerga de reglas de repetición.

**124. Posponer notificaciones.** 10 min / 30 min / 1 h / Esta tarde / Mañana / Elegir fecha y hora. El sistema registra el aplazamiento para no repetir el mismo recordatorio durante ese periodo.

**125. Resumen inteligente.** Agrupación de avisos de baja importancia en un único resumen (mañana/mediodía/noche/hora personalizada) en vez de múltiples notificaciones sueltas.

**126. Agrupación inteligente de notificaciones.** Evita varias notificaciones consecutivas cuando puedan comunicarse en una sola (ej. "¡Buen trabajo! Hoy has completado tu hábito, alcanzado tu objetivo diario y aumentado tu racha.").

**127. Motor inteligente de notificaciones.** Antes de enviar, evalúa hora, día, estado del usuario, prioridad, historial de interacción, modo concentración, horario de descanso, configuración personalizada y avisos similares recientes. Solo envía si la evaluación es positiva. Motor modular para nuevas reglas futuras.

**128. Adaptación al comportamiento del usuario.** Analiza localmente (respetando privacidad) qué notificaciones abre/ignora, horarios de mayor interacción, categorías más relevantes, recordatorios que suele posponer — para ajustar hora/frecuencia/formato/prioridad. Nunca se aplica sin poder revisarse o desactivarse.

**129. Personalización avanzada por módulo.** Cada módulo define sus propias notificaciones (ej. Salud: recordatorio de peso, hidratación, objetivos; Estudios: inicio de sesión de estudio, descansos, exámenes próximos; Productividad: bloques de trabajo, temporizadores, revisión de pendientes; Economía: presupuesto diario superado, objetivo de ahorro, resumen semanal).

**130. Sonidos.** Sonido del sistema / sonido propio de la app / sin sonido. Sonidos distintos por tipo de aviso, dentro de las limitaciones del SO.

**131. Vibración y respuesta háptica.** Activada / Desactivada / Solo para notificaciones importantes. Sin patrones personalizados molestos.

**132. Indicadores internos de la aplicación.** No todo debe ser una notificación del sistema: badges, puntos de aviso, contadores, banners, mensajes temporales, alertas en el Dashboard.

**133. Historial de notificaciones.** Fecha, hora, categoría, tipo, estado (entregada/leída/descartada/pendiente), dispositivo. Borrado manual o automático configurable.

**134. Sincronización entre dispositivos.** Sincronizable: categorías activadas, horarios, prioridades, preferencias generales. Local: permisos del SO, sonidos específicos, háptica, ajustes de hardware.

**135. Diagnóstico de notificaciones.** Estado del permiso, última sincronización, restricciones del SO, modo ahorro de energía, horario silencioso activo, último intento de envío, errores detectados — en lenguaje comprensible.

**136. Exportación e importación de preferencias.** Categorías, horarios, prioridades, resúmenes, configuración avanzada. No incluye el historial (temporal).

**137. Restablecimiento de la categoría.** Independiente del resto del sistema, con resumen previo de qué se elimina y qué permisos hay que volver a conceder.

**138. Principios finales.** Notificar solo con beneficio claro, minimizar interrupciones, control detallado sin complejidad, adaptación respetuosa con la privacidad, consistencia entre dispositivos, separación config global/local, control total del usuario sobre cuándo, cómo y por qué recibe cada notificación.

---

## 139–172. Categoría: Seguridad

**139. Objetivo.** Proteger acceso, datos e identidad. Principio de Secure by Default: protección elevada desde el primer uso, sin fricción innecesaria.

**140. Objetivos funcionales.** Proteger acceso, confidencialidad, prevenir accesos no autorizados, gestionar autenticación, administrar dispositivos autorizados, facilitar recuperación de acceso, registrar eventos relevantes.

**141. Estructura.** Bloques: Acceso (PIN/Biometría/Bloqueo automático), Cuenta (Contraseña/Correo/Verificación), Dispositivos (autorizados/último acceso/revocar), Sesiones (actual/cerrar otras/historial), Recuperación (métodos/códigos de emergencia), Avanzado (registro de seguridad/exportación/restablecimiento).

**142. PIN de acceso.** Longitud configurable, teclado numérico seguro, ocultación durante la escritura, confirmación al crearlo, modificable/eliminable tras autenticación. Solo desbloquea la app, nunca sustituye credenciales de cuenta.

**143. Gestión segura del PIN.** Nunca en texto plano — representación criptográfica comparada, nunca recuperación del original. Límite de intentos consecutivos, tiempo de espera progresivo, intentos fallidos relevantes registrados.

**144. Autenticación biométrica.** Face ID / Touch ID / huella / reconocimiento facial del SO. La app nunca accede a datos biométricos — solo recibe válido/no válido vía las APIs oficiales del sistema.

**145. Prioridad entre PIN y biometría.** Biometría = desbloqueo rápido; PIN = respaldo obligatorio tras reinicio, tras desactivar biometría, tras varios fallos biométricos, cuando lo requiera el SO o si el usuario decide usar el PIN manualmente.

**146. Bloqueo automático.** Inmediatamente / 30 s / 1 min / 5 min / 15 min / Nunca (no recomendado). Adaptable según sensibilidad de los datos.

**147. Contraseña de la cuenta.** Cambio requiere: autenticación previa → nueva contraseña → confirmación → validación de requisitos mínimos. Puede exigir nueva autenticación en el resto de dispositivos.

**148. Requisitos de la contraseña.** Longitud mínima, complejidad, evitar contraseñas conocidas como inseguras, evitar reutilizar contraseñas recientes (si la arquitectura futura lo soporta). Indicador visual comprensible, no técnico.

**149. Verificación del correo electrónico.** Verificado / Pendiente / Error. Reenvío disponible. Determinadas acciones críticas pueden requerir correo verificado.

**150. Dispositivos autorizados.** Lista con nombre, plataforma, primer acceso, última actividad, estado, dispositivo actual. Revocación con una única acción, sin afectar al resto de sesiones.

**151. Sesión actual.** Dispositivo, plataforma, versión de la app, fecha de inicio de sesión, última actividad, método de autenticación, estado de sincronización.

**152. Gestión de sesiones activas.** Nombre del dispositivo, SO, fecha de inicio, última actividad, ubicación aproximada (si está disponible y autorizada), estado. Sesión actual claramente diferenciada.

**153. Revocación de sesiones.** Cerrar una sesión concreta o todas las remotas ("Cerrar todas excepto este dispositivo"). Invalida inmediatamente el token asociado.

**154. Historial de accesos.** Fecha, hora, dispositivo, plataforma, método de autenticación, resultado (correcto/fallido). Ayuda a detectar accesos sospechosos.

**155. Alertas de seguridad.** Inicio de sesión desde dispositivo desconocido, cambio de contraseña, revocación de dispositivo, desactivación de biometría, exportación de datos sensibles — explicando qué, cuándo y qué hacer si no se reconoce.

**156. Recuperación de la cuenta.** Mecanismos seguros que priorizan la identidad del usuario sin comprometer la seguridad de la cuenta.

**157. Métodos de recuperación.** Correo verificado, código de recuperación, segundo dispositivo autorizado (futuro), otros mecanismos compatibles. Activables/desactivables/actualizables desde esta categoría.

**158. Códigos de recuperación.** Uso individual, alta entropía, generación criptográficamente segura, regenerables. Uso único, se invalidan tras usarse.

**159. Confirmación para acciones críticas.** Cambiar contraseña, modificar correo, eliminar cuenta, desactivar biometría, revocar todos los dispositivos, exportar datos sensibles — requieren PIN/biometría/contraseña según nivel de riesgo.

**160. Cifrado de la información.** Datos personales, credenciales, tokens, configuraciones sensibles, claves de integración — cifrado en reposo, protección en tránsito, gestión adecuada en memoria temporal. Usar siempre las soluciones recomendadas por la plataforma (iOS/Android/web), evitando criptografía propia salvo justificación técnica sólida.

**161. Gestión de secretos.** Tokens, claves de sesión, API Keys privadas, secretos criptográficos, claves de cifrado, códigos de recuperación, identificadores internos de autenticación — nunca junto al resto de configuraciones generales, gestionados por un subsistema específico.

**162. Almacenamiento seguro.** iOS: Keychain. Android: Keystore. Web: almacenamiento seguro respaldado por el backend. Nunca un sistema propietario si la plataforma ya ofrece uno equivalente.

**163. Gestión de tokens de autenticación.** Ciclo: emisión → almacenamiento seguro → uso → renovación → revocación → eliminación. Nunca visibles al usuario ni en logs/mensajes de error/herramientas de depuración accesibles.

**164. Renovación automática de sesión.** Antes de expirar, para evitar cierres inesperados. Si falla: reintentos limitados → registro del incidente → nueva autenticación solo si es imprescindible.

**165. Política de bloqueo por intentos fallidos.** Incremento gradual del tiempo de espera tras errores consecutivos; bloqueo temporal y posible autenticación reforzada si la actividad es claramente anómala.

**166. Protección frente a capturas de pantalla.** Pantallas sensibles (códigos de recuperación, información altamente sensible, secretos temporales, claves de integración) protegidas frente a capturas/grabaciones cuando la plataforma lo permita.

**167. Protección frente a ingeniería social.** Explicar claramente acciones críticas, evitar mensajes ambiguos, advertencias comprensibles, confirmar operaciones irreversibles, identificar claramente el origen de cada acción importante.

**168. Auditoría de eventos de seguridad.** Login, logout, cambio de contraseña/PIN, activación/desactivación de biometría, exportación de datos, revocación de dispositivos, restauración de configuraciones sensibles — con identificador, fecha/hora UTC, dispositivo, usuario, tipo, resultado, nivel de riesgo.

**169. Arquitectura de autenticación.** Servicio independiente responsable de identificación, sesiones, tokens, renovación, revocación y recuperación. El resto de módulos lo consumen sin implementar lógica propia.

**170. Principios de seguridad por capas.** Defensa en profundidad: autenticación, autorización, cifrado, almacenamiento seguro, auditoría, validación de entradas, protección de sesiones, gestión de permisos, supervisión de eventos.

**171. Seguridad orientada al usuario.** El objetivo es generar confianza, no transmitir complejidad técnica: información protegida, estado comprensible, control sobre dispositivos autorizados, recuperación sin fricción innecesaria, confirmación en acciones críticas.

**172. Finalización de la categoría Seguridad.** Base para autenticación multifactor, passkeys, dispositivos de confianza, autenticación adaptativa, detección avanzada de anomalías — priorizando siempre protección de datos, simplicidad, compatibilidad, escalabilidad, mantenibilidad y seguridad por defecto.

---

## 173–202. Categoría: Privacidad

**173. Objetivo.** Mientras Seguridad responde "¿quién puede acceder?", Privacidad responde "¿qué información se usa, para qué y bajo qué condiciones?". Transparencia absoluta y control completo, sin configuraciones ocultas.

**174. Objetivos funcionales.** Controlar tratamiento de datos, mostrar claramente qué usa cada módulo, gestionar permisos/consentimientos, minimizar recopilación, preparar cumplimiento normativo presente y futuro.

**175. Estructura.** Bloques: Permisos (Cámara/Micrófono/Fotografías/Ubicación/Calendario/Contactos/Notificaciones), Datos personales (información utilizada/categorías/finalidad/estado de uso), Inteligencia Artificial (uso de datos/memoria personalizada/personalización de respuestas/aprendizaje local), Compartición (integraciones/exportaciones/datos compartidos), Eliminación (borrar datos/eliminar historial/restablecer privacidad), Información (política de privacidad/registro de consentimientos/cambios recientes).

**176. Principio de minimización de datos.** Solo se solicitan los datos estrictamente necesarios, ningún módulo accede a información que no requiera, toda recopilación con finalidad identificada.

**177. Transparencia del tratamiento de datos.** Cada dato debe responder: ¿qué es?, ¿para qué se usa?, ¿dónde se almacena?, ¿cuánto tiempo se conserva? — en lenguaje claro, sin jerga jurídica.

**178. Gestión de permisos.** Estado, finalidad, módulos que lo usan, última utilización, acceso directo a ajustes del sistema. Nunca se solicitan en la instalación salvo imprescindibles — solo en el momento de uso real.

**179. Permiso de fotografías.** Explicación de por qué, qué imágenes se usan, qué ocurre si se deniega. Respeta acceso limitado de iOS/Android.

**180. Permiso de cámara.** Solo cuando el usuario inicia voluntariamente una acción que la requiere (foto de perfil, escaneo de códigos, captura de documentos, registro fotográfico de progreso). Nunca se activa automáticamente.

**181. Permiso de micrófono.** Solo para funciones que realmente requieren voz (dictado, notas de voz, conversación con IA, comandos de voz). Interfaz debe indicar claramente cuando el micrófono está activo.

**182. Permiso de ubicación.** Solo si aporta beneficio directo (zona horaria automática, meteorología, estadísticas de actividades al aire libre, funciones futuras). Opciones: no permitir / una vez / mientras se usa / otras modalidades del SO. Nunca más precisión de la necesaria.

**183. Permiso de calendario.** Si se integra planificación futura: leer eventos necesarios, crear recordatorios, sincronizar tareas autorizadas. Usuario controla qué calendarios.

**184. Permiso de contactos.** Solo si hay funcionalidad real que lo requiera (compartir, invitar, colaborar). Nunca recopila la agenda completa como requisito de uso.

**185. Gestión del consentimiento.** Uso de IA personalizada, sincronización en la nube, compartición con servicios externos, procesamiento de determinados datos. Principios: libre, específico, informado, reversible.

**186. Registro de consentimientos.** Fecha, hora, finalidad, versión del consentimiento, estado actual. Cambios sustanciales de política requieren nuevo consentimiento antes de continuar usando la función afectada.

**187. Privacidad de la Inteligencia Artificial.** Qué información recibe la IA, para qué, si el procesamiento es local o externo, qué se almacena para personalización, qué nunca se utiliza. Funciones de personalización activables/desactivables de forma independiente.

**188. Memoria personalizada de la IA.** Categoría independiente de datos. El usuario puede consultar, eliminar elementos concretos, vaciar toda la memoria, desactivarla completamente. Explicación clara de ventajas y limitaciones antes de activarla.

**189. Anonimización de datos.** Cuando una funcionalidad no requiera identificar directamente al usuario, priorizar información anonimizada/seudonimizada antes de cualquier tratamiento que no necesite datos identificativos.

**190. Compartición de datos.** Nunca con terceros sin finalidad definida y consentimiento cuando sea necesario. Por integración: servicio destinatario, datos compartidos, finalidad, fecha de autorización, estado. Revocable en cualquier momento (sin garantizar borrado retroactivo en el proveedor externo — se explica claramente esta limitación).

**191. Control granular de la información compartida.** Cada integración solicita solo los datos imprescindibles, concedibles/revocables de forma independiente por categoría.

**192. Visualización de datos utilizados.** Panel que muestra, por ejemplo, "Peso → utilizado por: Salud, Nutrición, IA, Dashboard" o "Fecha de nacimiento → utilizada por: Perfil, cálculo del BMR, Objetivos".

**193. Historial de acceso a datos sensibles.** Exportación de datos, consulta de información protegida, acceso desde nuevo dispositivo, uso de determinadas integraciones — con fecha, hora, acción, dispositivo, resultado. Orientado a transparencia y diagnóstico, no a supervisión continua.

**194. Exportación de datos personales.** Perfil, configuración, historiales, objetivos, datos de módulos, preferencias — explicando qué se incluye y qué queda excluido por motivos técnicos/de seguridad. Formato estructurado preparado para migraciones.

**195. Eliminación de datos específicos.** Categorías concretas (historial de sueño, de entrenamiento, económico, conversaciones con IA, fotografías, registros temporales) sin afectar al resto de módulos.

**196. Retención de datos.** Política de conservación por tipo (configuración hasta modificación/eliminación, historiales hasta borrado manual/automático, registros temporales con periodo limitado, logs técnicos con conservación mínima) explicada en lenguaje comprensible.

**197. Eliminación de la cuenta.** Resumen previo de qué se elimina, qué deja de estar disponible, consecuencias sobre sincronización/dispositivos, posible periodo de recuperación. Requiere autenticación reforzada.

**198. Derecho al olvido.** Tras eliminación definitiva, proceso de supresión conforme a política de conservación; datos personales eliminados de producción cuando sea técnica y legalmente posible; transparencia si algún registro debe conservarse por motivos legales/de seguridad.

**199. Auditoría de privacidad.** Otorgamiento/revocación de consentimientos, exportación de datos, eliminación de categorías, solicitud de eliminación de cuenta, activación/desactivación de IA personalizada.

**200. Panel de transparencia.** Resumen global: permisos concedidos, consentimientos activos, integraciones autorizadas, funciones de IA activas, estado de sincronización, configuración de exportación, nivel general de privacidad — comprensible de un vistazo.

**201. Principios de privacidad por diseño.** Minimización, transparencia, consentimiento cuando corresponda, control del usuario, configuración segura por defecto, revocación posible, separación privacidad/seguridad, preparación para futuras normativas — requisitos de revisión de cualquier nuevo módulo.

**202. Finalización de la categoría Privacidad.** Marco de control del usuario sobre su información: transparencia, simplicidad, control, minimización, respeto, independencia de proveedores externos.

---

## 203–1300. Categoría: Inteligencia Artificial ("AXION")

> Esta especificación llama **AXION** al motor de inteligencia artificial transversal del Sistema Operativo Personal (en el proyecto real construido hasta la Fase 21, este componente es simplemente "IA": `AIPanel`, `ai.js`, `api/ask-ai.js`, un único proxy serverless a la API de Anthropic). Es, con enorme diferencia, la sección más extensa de toda la nota (apartados 203 a 1300, aproximadamente 1100 de los 1300 apartados totales de esta Entrega 1) y describe una **arquitectura de IA de nivel empresarial**: orquestación multiagente, bus de eventos, arquitectura orientada a servicios, múltiples proveedores de modelos con enrutamiento inteligente, motor de políticas y permisos granulares, presupuestos económicos, observabilidad y auditoría exhaustivas, memoria estructurada multinivel, planificación y ejecución autónoma con niveles de autonomía configurables, funcionamiento offline-first, etc.
>
> **Por su volumen, esta sección no se transcribe apartado por apartado en este documento** (duplicaría íntegramente el texto ya pegado por Josué en el chat de esta conversación). Se resume aquí su estructura temática para referencia rápida; el contenido literal completo de los apartados 203–1300 debe tratarse como parte de esta especificación con el mismo rango que el resto — si una fase futura lo implementa, debe releerse el texto original de la conversación (o pedírselo de nuevo a Josué) antes de construir esa fase, no trabajar solo del resumen.
>
> **Bloques temáticos identificados dentro de 203–1300** (numeración aproximada de inicio de cada bloque):
> - 203–330: Fundamentos de AXION — objetivos, principios de diseño, estructura de la categoría IA, activación general, selección de modelo, nivel de asistencia, personalidad, contexto disponible por módulo, memoria personalizada, explicabilidad, control humano.
> - 331–350: Sistema de iniciativas y recomendaciones — agrupación, prioridad, caducidad, seguimiento, objetivos derivados, matriz impacto/esfuerzo, prevención de agotamiento del usuario.
> - 351–390: Trazabilidad, arquitectura desacoplada de IA, múltiples proveedores (OpenAI/Anthropic/Google/Mistral/Meta/xAI/locales), balanceador inteligente, caché, priorización de consultas, recuperación ante fallos, entorno de pruebas.
> - 391–410: Privacidad e integración con el sistema de permisos — contexto con privilegios mínimos, clasificación de sensibilidad, procesamiento local preferente, anonimización previa, protección frente a automatizaciones peligrosas, sistema de deshacer inteligente.
> - 411–430: Observabilidad — métricas, registro estructurado de eventos, autodiagnóstico, detección de anomalías, modo seguro, panel de diagnóstico avanzado.
> - 431–450: Arquitectura de eventos — catálogo de eventos, suscripción, publicación desacoplada, procesamiento asíncrono, prevención de bucles, eventos compuestos/derivados/temporales/persistentes.
> - 451–470: Arquitectura orientada a servicios — catálogo central de servicios, ciclo de vida, descubrimiento dinámico, inyección de dependencias, contratos de servicio versionados.
> - 471–520: Bus de servicios, enrutamiento inteligente, balanceo de carga, Circuit Breaker, reintentos, fallback, presupuestos económicos por módulo/agente/proveedor, alertas de consumo, modo sin costes externos.
> - 501–540: Capa multimodal (imagen, voz, documentos), extracción estructurada, memoria contextual multimodal, memoria de corto/largo plazo, prevención de alucinaciones, principio de "verdad operacional" (nunca confundir intención con acción ejecutada).
> - 541–620: Motor de planificación personal — descomposición de objetivos, capacidad diaria, planificación adaptativa, plan mínimo viable/de contingencia, ejecución de planes, estados de ejecución, idempotencia, modos manual/asistido/autónomo limitado/autónomo avanzado, alcance y permisos granulares por agente.
> - 601–670: Centro de control de agentes — activación/pausa/reinicio individual, perfiles de comportamiento (conservador/equilibrado/proactivo/autónomo), parada de emergencia, panel de actividad, explicación de decisiones, clasificación de riesgo (0 a 4) y confirmación escalonada según riesgo.
> - 671–730: Aprendizaje personalizado con límites, separación aprendizaje/memoria, aprendizaje explicable y reversible, control de proactividad, frecuencia máxima de recomendaciones, modo concentración/descanso/vacaciones.
> - 731–800: Funcionamiento offline — capacidades offline vs. online, IA local, cola offline, sincronización incremental, resolución de conflictos, modo ahorro/máximo rendimiento, principio "offline-first".
> - 761–830: Arquitectura de privacidad de IA — minimización, identidad abstracta para proveedores externos, filtrado/sanitización de contexto antes de enviar a modelos, catálogo de modelos, selección por capacidad/coste/calidad/privacidad.
> - 800–850: Arquitectura híbrida (reglas deterministas + IA), arquitectura modular, herramientas internas con validación de parámetros, aislamiento entre agentes, prohibición explícita de "autonomía emergente" (varios agentes combinados no pueden superar restricciones individuales).
> - 851–900: Integración de IA con cada módulo de la app (Dashboard, Salud, Sueño, Nutrición, Entrenamiento, Fútbol, Estudios, Productividad, Objetivos, Economía, Proyectos/Negocio, Diario, Relaciones, Espiritualidad, Biblioteca) — con aislamiento explícito del Diario y Relaciones por defecto.
> - 901–1000: Centro de Inteligencia AXION (panel de control), niveles de autonomía (0 a 4) por módulo y por acción, matriz de riesgo, confirmación reforzada, expiración/revocación de permisos, principio de "confianza verificable" (nunca pedir al usuario que confíe ciegamente).
> - 1001–1100: Configuración avanzada por niveles (básico/intermedio/avanzado), perfiles de IA predefinidos y personalizados, identidad visual de las acciones de IA en la interfaz, principio de honestidad de IA (nunca afirmar que ejecutó algo que no ejecutó).
> - 1101–1150: Motor de memoria — tipos de memoria (sesión/temporal/contextual/persistente/preferencias), consentimiento y edición de memoria, resolución de contradicciones, memoria por agente y aislada entre agentes, principio de "memoria mínima".
> - 1151–1220: Motor de privacidad de IA — clasificación de datos, política de mínimo acceso, filtrado previo al modelo, protección contra extracción indirecta, panel de privacidad de IA, procesamiento local prioritario, principio de eficiencia económica.
> - 1221–1250: Motor de sincronización de IA entre dispositivos — sincronización incremental/por eventos, revocación inmediata de permisos entre dispositivos, resolución de conflictos de configuración, principio de "continuidad inteligente".
> - 1251–1300: Arquitectura preparada para nuevos modelos y modalidades futuras (visión, audio, vídeo, sensores), validación de respuestas externas, protección contra ejecución retardada con contexto obsoleto, cierre con el **principio de evolución segura**: la IA puede volverse más capaz, pero nunca debe reducir el control humano, la privacidad, la seguridad, la trazabilidad, la reversibilidad ni la autonomía del usuario.

---

*(Fin de la transcripción de la Entrega 1. Ver HANDOFF.md para el análisis de viabilidad frente a la arquitectura real del proyecto y el plan de fases propuesto.)*
