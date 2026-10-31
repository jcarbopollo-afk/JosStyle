# Corpus de la Fase 2.x — las 130 preguntas y las 37 de ejemplo

> Preparado el 2026-10-31 (paso 21 de la recuperación) en la copia de trabajo del paso 17. Acompaña a
> `ESPECIFICACION_FASE_2X.md`. **Las preguntas de las 130 son las originales; sus resultados esperados no.** Lo que aquí se
> llama «línea base reconstruida» es una salida generada hoy, no la que se guardó entonces.

## 0. Resumen

| | Recuperable | Estado |
|---|---|---|
| **Las 130 preguntas** del corpus (texto y orden) | ✅ Sí, enteras | Leídas de la salida de un comando del 25/10 a las 11:21 (§1). Anexo A |
| El script que las ejecutaba | ⚠️ En parte | Se conservan sus líneas 1–30 y 120–179 (las preguntas y la forma de imprimir). Las 31–119 no se vieron nunca; todo lo visible coincide con los datos de prueba de `test-asistentes-chat.mjs` (§2) |
| **Los resultados esperados originales** (130 líneas) | ❌ No | Solo se vieron 7 líneas de salida (§2). El archivo `corpus_antes.txt` y los anteriores (`c_22c.txt`…) se perdieron con el reinicio del contenedor |
| Los cambios del corpus en 2.1 (17) y 2.2 (8) | ❌ No | Solo consta la cifra, en el resumen de las 11:09 |
| **Las 37 preguntas de ejemplo** | ✅ Sí | No son parte de las 130: son el `ejemplo` de cada una de las 37 capacidades, en el código. Anexo B |

## 1. Qué es el corpus y de dónde salen las preguntas

- Era una **línea base temporal**, no una prueba del proyecto: un script en el scratchpad (`corpus.mjs.txt`, 179 líneas)
  que cargaba los datos de prueba de `scripts/test-asistentes-chat.mjs` (el día fijado: viernes 23/10/2026) y ejecutaba
  130 mensajes en conversaciones seguidas, una línea de salida por mensaje: `asistente > mensaje => [capacidades] texto`
  (cortado a 400 caracteres).
- Se usó para comparar antes y después de B0, B1 y B2 [conversación rescatada, entradas 113–128, 229–234, 643–686]:
  - B0: «130… EJEMPLOS_IGUALES», idéntico a la línea base;
  - B1: idéntico;
  - B2: **cambia una línea** (la 51, «compara esta semana con la pasada» en Fitness).
- **Las preguntas** salen de la salida de `sed -n 120,179p corpus.mjs.txt` del 25/10 a las 11:21:12 (entradas 124–125), que
  trae las 10 llamadas `S(...)` completas. Reparto: Sueño 36, Fitness 30, Nutrición 22, Estudios 23, Productividad 19.
  Las conversaciones encadenan contexto dentro de cada llamada, así que **el orden importa**.

## 2. Qué falta y por qué

1. **Los resultados esperados.** Se conservan solo 7 líneas originales:
   - las líneas 1–5 (las cinco primeras de Sueño), de un `head -5` del 25/10 a las 11:21:05, estado final de la 2.2;
   - la línea 51 antes y después de B2, de un `diff` del 25/10 a las 19:14.
2. **Las líneas 31–119 del script.** No aparecen en ninguna salida. Lo que sí se vio —las importaciones (líneas 1–30) y el
   final de los datos de prueba (desde los registros de estudio)— coincide línea a línea con `test-asistentes-chat.mjs`
   (salvo las importaciones que B1 y B2 ampliaron después). Que lo no visto también coincida **es una suposición**, apoyada
   en §3.
3. **La historia de los cambios de 2.1 y 2.2**: cuáles fueron las 17 y las 8 líneas que cambiaron no consta.

## 3. Medición del 2026-10-31: las preguntas recuperadas, ejecutadas en cada etapa

Script regenerado fuera del proyecto (las líneas 9–181 de `test-asistentes-chat.mjs` de cada copia más las 10 llamadas
recuperadas). Sin tocar ningún archivo de las copias ni del repositorio.

| Etapa | Huella de la salida (sha256, 16 primeros) | Frente a la anterior | Líneas originales que coinciden |
|---|---|---|---|
| `ea7bc4a` (v3.161.3, antes de 2.1) | `8686ce9321be755e` | — | — |
| Repositorio real `14f225c` | `8686ce9321be755e` | 0 (el arreglo C no cambia nada) | 3 de 6 (las 1–3; la 4, la 5 y la 51 cambian con la 2.1/2.2) |
| Etapa 1: 2.1/2.2 | `b7377b3abb07fe7b` | 23 líneas | 6 de 6 (1–5 y la 51 de antes de B2) |
| Etapa 2: B0 | `b7377b3abb07fe7b` | **0** (original: idéntico) | 6 de 6 |
| Etapa 3: B1 | `b7377b3abb07fe7b` | **0** (original: idéntico) | 6 de 6 |
| Etapa 4: B2 | `48ad517653b627a9` | **1, la línea 51** (original: una, la 51) | 1–5 y la 51 de después de B2 |
| Etapa 5: paso 4 | `48ad517653b627a9` | 0 | Ídem |
| **Paso 17 (E2)** | `48ad517653b627a9` | 0 | Ídem |

- **Las 7 líneas originales coinciden** en la etapa que les toca, y **el patrón de cambios es el mismo que el original**
  (B0 y B1 sin cambios; B2 solo la 51).
- De `ea7bc4a` a la 2.1/2.2 cambian **23 líneas**; el registro original habla de 17 cambios en 2.1 y 8 en 2.2 (hasta 25, si
  alguna línea cambió en las dos). **Es compatible, pero no se puede demostrar** que sean las mismas.
- Las 37 preguntas de ejemplo dan **la misma salida en todas las etapas medidas** —repositorio real, 2.1/2.2, B2, paso 4 y
  paso 17— (huella `82573d29a82b33e6`), como decía el original («dan lo mismo que antes»).

## 4. Las 37 preguntas de ejemplo (separadas del corpus)

Son el campo `ejemplo` de cada capacidad (11 de Sueño, 7 de Fitness, 7 de Nutrición, 6 de Estudios y 6 de Productividad).
Viven en el código de cada asistente, no en este documento; las enseña el chat («Prueba con:») y la sección 7 de
`test-asistentes-chat.mjs` las ejecuta sin datos. La lista está en el Anexo B, con la capacidad que las contesta hoy.

## 5. Propuesta: una línea base nueva y verificable (no construida)

Pendiente de aprobación de Josué. Nada de esto se ha hecho.

1. **Dejar el corpus en el proyecto como prueba permanente** (por ejemplo `scripts/test-corpus-chat.mjs`, en `verificar.sh`):
   las 130 preguntas en su orden y con sus cadenas de conversación, y las 37 de ejemplo **en un bloque aparte**, con los
   datos de prueba importados de un único sitio (no copiados).
2. **Guardar la salida esperada en un archivo de datos** del proyecto, rotulado como **«línea base reconstruida el
   2026-10-31 desde la copia del paso 17»**, nunca como la original. La de partida sería la de la tabla de §3
   (`48ad517653b627a9`).
3. **Anclar lo que sí es original:** la prueba comprueba aparte las 7 líneas conservadas (1–5 y la 51 en su estado de
   después de B2) y el patrón de B0/B1/B2, para que nadie pueda sustituir la base sin que se note.
4. **Regla de cambio:** cualquier diferencia pone la prueba roja; para aceptarla hay que regenerar la base con una orden
   explícita, y cada línea cambiada se revisa y se anota (como pedía B7). Nada de umbrales.
5. **Para B7:** añadir, separadas, las preguntas de comparación que se propusieron (unas 25, **propuesta**), sin mezclarlas
   con las 130.
6. **Integración:** ejecutar el corpus tras cada etapa; las huellas esperadas son las de §3.

## Anexo A — las 130 preguntas originales

Recuperadas literalmente (minúsculas y erratas incluidas, a propósito). Cada asistente encadena su conversación en el orden
dado; las de Sueño son tres conversaciones (1–10, 11–19, 20–36), Fitness dos (37–52, 53–66), Nutrición una (67–88),
Estudios dos (89–103, 104–111) y Productividad una (112–130).

**Sueño**

1. cuanto dormi ayer · *salida original conservada*
2. no, me referia a anteayer · *salida original conservada*
3. y la semana pasada? · *salida original conservada*
4. y la anterior? · *salida original conservada*
5. y la peor? · *salida original conservada*
6. compáralo con la de antes
7. cuanto drmi ayer
8. que tal he sobado esta semana
9. como dormi el finde
10. cuanto dormi ayer y cuantas veces me desperte
11. cual fue mi mejor noche
12. y la peor?
13. y el mes pasado?
14. dormí bien?
15. por que duermo mal
16. cuanto dormire mañana
17. cuantas horas he dormido de media este mes
18. media de sueño de octubre
19. noches sin hora
20. qtal dormi aier
21. cuanto e dormio esta semana
22. he descansado bien?
23. a que hora me acoste ayer
24. me levante tarde hoy?
25. asdfgh
26. ???
27. dime algo
28. cuanto dormi el 31 de febrero
29. cuanto dormi el sabado pasado
30. dormi mas ayer o anteayer
31. dormi mas que la semana pasada?
32. cuanto dormi y que tal ayer
33. cuantas noches he dormido mal esta semana y cuanto dormi ayer
34. cuanto dormi y que tal la calidad esta semana
35. cuanto dormi en casa de mi abuela
36. cuanto dormi el lunes y el martes

**Fitness**

37. que entrene ayer
38. y anteayer?
39. cuantas veces he ido al gym este mes
40. y la semana pasada?
41. como voy en press banca
42. y en dominadas?
43. cual es mi record
44. y en press?
45. que me toca hoy
46. y mañana?
47. he entrenado hoy?
48. cuando entrene por ultima vez
49. como va el pres de banca
50. cuanto levanto en press
51. compara esta semana con la pasada · *salida original conservada*
52. cuantos entrenos llevo y que me toca mañana
53. ke entrene ayer
54. e ido al gim esta semana?
55. cuanto llevo sin entrenar
56. cuantos dias entrene en septiembre
57. cual fue mi mejor entreno
58. cuanto he progresado en dominadas pronas este mes
59. como voy en press banca
60. y esta semana?
61. hola
62. y ayer?
63. como van mis objetivos
64. y mis objetivos de fuerza?
65. que me toca el lunes y que entrene el lunes pasado
66. como voy en el gimnasio

**Nutrición**

67. cuantas calorias llevo hoy
68. y ayer?
69. y de proteina?
70. que comi ayer
71. y en la cena?
72. comi mas que ayer?
73. media de calorias esta semana
74. compara esta semana con la pasada
75. cuanta agua he bebido
76. y ayer?
77. cuantos dias he apuntado este mes
78. que dia comi mas
79. cuantas kcal llevo y cuanta agua
80. cuantas calorias me quedan
81. voy bien de proteina?
82. cuantas calorias comi
83. eso
84. y el lunes
85. cuanta proteina tome el lunes y el martes
86. que desayune hoy
87. cuantas kcal llevo y cuanta agua hoy
88. cuanta agua bebi y que comi en casa de mi madre

**Estudios**

89. que examenes tengo
90. y de biologia?
91. cuando es el de mates
92. y la entrega?
93. cuantas horas he estudiado esta semana
94. y de biologia?
95. y la semana pasada?
96. que nota saque en fisica
97. que temas me quedan
98. de historia
99. cuantas horas estudie ayer y cuando es el examen de biologia
100. tengo algo esta semana?
101. cuando es el examen de ingles
102. que notas he sacado este trimestre
103. examenes del mes que viene
104. cuando es el examen
105. mates
106. olvidalo, cuantas horas estudie ayer
107. primera
108. que examenes tengo de aqui a final de mes
109. que temas tengo de lengua castellana
110. cuantas horas he estudiado en total
111. temas de historia y de francés

**Productividad**

112. que habitos me tocan hoy
113. y ayer?
114. cual es mi racha mas larga
115. y la de beber agua?
116. cuantos pomodoros llevo esta semana
117. y hoy?
118. como van mis metas
119. y mis objetivos?
120. que rutinas tengo hoy
121. he cumplido mis habitos?
122. cuantos pomodoros hice ayer y que habitos tengo hoy
123. que tareas tengo hoy
124. me he saltado algun habito esta semana
125. racha de leer
126. y eso cuanto es comparado con la semana pasada
127. cuantos pomodoros he hecho este mes y el pasado
128. racha de meditar
129. cual es mi racha de dias seguidos
130. racha de agua ayer

## Anexo B — las 37 preguntas de ejemplo (del código)

Asistente · capacidad que contesta hoy (copia del paso 17) · pregunta.

1. sueno · `noche` · ¿Cuánto dormí anoche?
2. sueno · `media` · ¿Cuánto he dormido de media esta semana?
3. sueno · `calidad` · ¿Qué tal la calidad de mis noches este mes?
4. sueno · `extremos` · ¿Cuál fue mi noche más corta este mes?
5. sueno · `horarios` · ¿A qué hora me he acostado esta semana?
6. sueno · `despertares` · ¿Cuántas veces me he despertado esta semana?
7. sueno · `comparar` · ¿Duermo más que la semana pasada?
8. sueno · `ultimas` · ¿Cómo han ido mis últimas noches?
9. sueno · `incompletas` · ¿Qué noches no tienen datos completos?
10. sueno · `fiabilidad` · ¿Por qué no puedes darme una media fiable?
11. sueno · `registro` · ¿Cuántas noches tengo registradas este mes?
12. fitness · `ultimo` · ¿Cuándo fue mi último entrenamiento?
13. fitness · `dia` · ¿Qué entrené ayer?
14. fitness · `cuantos` · ¿Cuántas veces he entrenado esta semana?
15. fitness · `plan` · ¿Qué me toca entrenar hoy?
16. fitness · `ejercicio` · ¿Cómo voy en dominadas pronas?
17. fitness · `record` · ¿Cuál es mi récord en press de banca?
18. fitness · `objetivos` · ¿Cómo van mis objetivos?
19. nutricion · `dia` · ¿Cuántas calorías llevo hoy?
20. nutricion · `media` · ¿Cuál es mi media de proteína esta semana?
21. nutricion · `comidas` · ¿Qué comí ayer?
22. nutricion · `agua` · ¿Cuánta agua llevo hoy?
23. nutricion · `constancia` · ¿Cuántos días he apuntado lo que como este mes?
24. nutricion · `comparar_dias` · ¿Comí más que ayer?
25. nutricion · `extremos` · ¿Qué día comí más esta semana?
26. estudios · `proximos` · ¿Qué exámenes tengo próximamente?
27. estudios · `cuando` · ¿Cuándo es el examen de biología?
28. estudios · `horas` · ¿Cuántas horas he estudiado esta semana?
29. estudios · `notas` · ¿Qué notas he sacado?
30. estudios · `temas` · ¿Qué temas me quedan de historia?
31. estudios · `asignaturas` · ¿Qué asignaturas tengo?
32. productividad · `habitos` · ¿Qué hábitos me tocan hoy?
33. productividad · `racha` · ¿Cuál es mi racha más larga?
34. productividad · `pomodoro` · ¿Cuántos pomodoros he hecho esta semana?
35. productividad · `metas` · ¿Cómo van mis metas?
36. productividad · `objetivos` · ¿Cómo van mis objetivos?
37. productividad · `rutinas` · ¿Qué rutinas tengo hoy?
