# Procedencia del código del chat en esta copia (paso 15, actualizada en el paso 17 con E2)

Árbol: `paso17/trabajo/` = la copia del paso 15 más E2 (paso 17). La del paso 15 era una copia del ensayo del paso 12 (14f225c + 2.1/2.2 + B0 + B1 + B2 + correcciones del paso 4, sin A ni B), más lo que añade el paso 15 (estas marcas y las pruebas de entidades). Los números de línea son los de esta copia.
Generado por `paso15/herramientas/procedencia.py`, `paso17/herramientas/procedencia_e2.py` e `informe_procedencia_17.py`; el mapa
línea a línea, con el motivo de cada línea, está en `paso17/registros/procedencia.json`. **Este documento describe; no cambia nada del código.**

## Clases

| Clase | Abrev. | Qué significa aquí |
|---|---|---|
| ORIGINAL VERIFICADO | OV | Texto literal del trabajo perdido **y** su sitio demostrado: (a) líneas de 2.1/2.2 leídas en salidas de las 11:17–11:30 *antes* del primer parche B sobre ese archivo, en el mismo número de línea; (b) en el motor, las líneas de la lectura de las 11:20:36 (`sed -n 366,392p` y `786,840p`, antes del primer B sobre el motor, 11:23:30) que caen, iguales y en el mismo orden, entre dos líneas ya fijadas por el mapa cuyo hueco original esa lectura cubre entero (entre ellas, el bloque A2 que el paso 4 restauró); (c) líneas de B0, B1 y B2: texto literal de los parches del paquete de rescate (SHA-256 comprobado), colocadas donde casa su ancla (el `old_string` del propio parche, único en el archivo). Cuando un parche B cambia media línea, el resto de esa línea era OV o texto sin cambios; se comprobó (`herramientas/mixtas.py`). |
| EDITADO A PARTIR DE ORIGINAL | ED | Texto de ea7bc4a con el cambio que describe el resumen de las 11:11 (A7 `.map(corregirFecha)`, A9, P7). El contenido del cambio está descrito; la forma la escribió el paso 2. |
| RECONSTRUIDO | RC | Escrito en el paso 2 a partir de la especificación (funciones o listas que no se recuperaron, JSDoc, secciones de prueba con menos comprobaciones que las originales). |
| PROVISIONAL | PV | (a) Texto de ea7bc4a puesto en un hueco del que no hay ninguna lectura de 2.1/2.2: puede ser igual al original o no. (b) Texto original verificado cuyo **sitio** no está demostrado: solo aparece en salidas posteriores al primer parche B sobre el archivo (motor: 11:27:40 y 19:11:28; `test-asistentes-chat`: grep de las 19:13:36). |
| NUEVO | NV | No es código original: C (corrección de 14f225c, paso 9) y las correcciones del paso 4 de la recuperación. Las marcas y las pruebas del paso 15 también son NUEVO. |
| SIN CAMBIOS | SC | Fuera de alcance: texto de 14f225c en un archivo que la 2.1/2.2 no tocó (el mensaje de las 11:11 lista los seis que sí tocó). |

Las cifras cuentan líneas no vacías; las marcas de procedencia del paso 15 no se cuentan en ninguna clase (van en su apartado).

## Evidencia usada

- Trazas del paso 2 (`paso1/herr2/traza_*.json`) con la clase de cada línea, y los mapas forenses (`forense/mapas/*.mapa.txt`): lo ORIGINAL del motor se acepta solo si su texto está en el mapa **en el mismo número de línea** (si no, PROVISIONAL de la clase b).
- Las salidas de órdenes de la conversación de rescate (`rescate/original/conversacion-be18ed71.jsonl`) anteriores al primer parche B sobre cada archivo (motor 11:23:30, Sueño 11:23:14, `test-motor` 11:28:48, `test-asistentes` 11:30:53).
- El paquete de rescate (`rescate/paquete`, `SHA256SUMS` 116) para el texto de B0, B1 y B2, y las etapas del ensayo del paso 12 (`paso12/etapas/1_2.1-2.2` … `5_paso4`) para seguir cada línea de una etapa a la siguiente (difflib, sin autojunk).
- El mensaje de las 11:11 para saber qué archivos tocó la 2.1/2.2 (seis: motor, fechas, Estudios, Sueño y las dos suites).
- La comprobación de que `paso15/trabajo` es la etapa 5 más líneas insertadas y nada más (`procedencia.py` la exige).

## Marcas en el código

Comentarios de una línea, en la columna 0, encima de una declaración o de una sección (y encima de su comentario). Quitándolas, cada archivo es idéntico byte a byte al del ensayo del paso 12 (`marcar.py` lo comprueba). No hay marcas donde no aportan (texto de ea7bc4a o de 14f225c sin tocar, ni en los asistentes que solo llevan B).

| Archivo | Línea | Marca |
|---|---|---|
| `src/lib/motorConversacion.js` | 1 | Archivo reconstruido: lo de B0–B2 y lo leído antes de B es ORIGINAL VERIFICADO; lo que no se leyó es PROVISIONAL (texto de ea7bc4a, igual que 14f225c). Mapa línea a línea en el documento. |
| `src/lib/motorConversacion.js` | 63 | RECONSTRUIDO (paso 2, A7) de aquí a `palabrasParecidasAFecha`, salvo las firmas de las funciones (originales) y `NO_SON_FECHA` (NUEVO, paso 4). |
| `src/lib/motorConversacion.js` | 105 | EDITADO (paso 2, A7: `.map(corregirFecha)`) + C (NUEVO, 14f225c); el resto, PROVISIONAL. |
| `src/lib/motorConversacion.js` | 132 | EDITADO (paso 2, A9): `RELLENO` y `compiladas`. |
| `src/lib/motorConversacion.js` | 206 | PROVISIONAL de otra clase: texto original, pero leído solo a las 11:27:40, después del primer parche B; su sitio no está demostrado (hasta parte de `LEXICO_COMUN`). |
| `src/lib/motorConversacion.js` | 274 | EDITADO (paso 2, por el resumen de las 11:11) de aquí a `resolverEntidad`; `nombraAlgoMas` y una línea de `resolverEntidad` son NUEVO (paso 4). |
| `src/lib/motorConversacion.js` | 485 | EDITADO (paso 2): el cuerpo. La firma es ORIGINAL VERIFICADO. |
| `src/lib/motorConversacion.js` | 605 | RECONSTRUIDO (paso 2, A2): el final de `indicesConsumidos`, `PREPOSICIONES_DE_MENCION`, `NO_ES_MENCION` y `mencionSinResolver` salvo su firma. |
| `src/lib/motorConversacion.js` | 921 | ORIGINAL VERIFICADO de aquí a `noEncontrada`: lectura de las 11:20:37, antes de B (restaurado en el paso 4). |
| `src/lib/motorConversacion.js` | 972 | PROVISIONAL de otra clase: el cuerpo de `ejecutarConArgs` y el principio de `capacidadParaPeriodo` son texto original leído a las 19:11:28, después de B; su sitio no está demostrado. |
| `src/lib/fechasConversacion.js` | 1 | Casi todo es PROVISIONAL (texto de ea7bc4a, igual que 14f225c: no consta si la 2.2 lo cambió). ORIGINAL VERIFICADO: `unidadDePeriodo` (su JSDoc es RECONSTRUIDO), `periodoPrevio` y `periodoAnterior`. |
| `src/lib/asistenteEstudios.js` | 224 | P7: el léxico `agenda` y su uso en `proximos` son EDITADO (paso 2, por el resumen de las 11:11); el resto del archivo, PROVISIONAL. |
| `src/lib/asistenteSueno.js` | 634 | P7: el «=a medias» del léxico `incompleto` es EDITADO (paso 2); del archivo, ORIGINAL VERIFICADO lo leído antes de B y lo de B0, PROVISIONAL el resto. |
| `scripts/test-asistentes-chat.mjs` | 972 | Mezcla ORIGINAL VERIFICADO, RECONSTRUIDO (paso 2) y algunas líneas originales cuyo sitio no está demostrado. |

## 1. Resumen por archivo

| Archivo | OV | ED | RC | PV | NV | SC |
|---|---|---|---|---|---|---|
| `src/lib/motorConversacion.js` | 1219 | 144 | 56 | 332 | 103 | — |
| `src/lib/fechasConversacion.js` | 53 | — | 5 | 298 | — | — |
| `src/lib/asistenteEstudios.js` | — | 4 | — | 220 | 10 | — |
| `src/lib/asistenteSueno.js` | 90 | 1 | — | 541 | — | — |
| `src/lib/asistenteNutricion.js` | 11 | — | — | — | — | 276 |
| `src/lib/asistenteFitness.js` | 38 | — | — | — | — | 237 |
| `src/lib/asistenteProductividad.js` | 38 | — | — | — | — | 164 |
| `src/components/asistenteChat.jsx` | 9 | — | — | — | — | 253 |
| `scripts/smoke-vistas.jsx` | 21 | — | — | — | — | 4763 |
| `scripts/test-motor-conversacion.mjs` | 436 | — | 144 | 119 | 405 | — |
| `scripts/test-asistentes-chat.mjs` | 355 | — | 169 | 763 | 356 | — |

## 2. `entender` y sus dependencias (motor)

Funciones del motor a las que llega `entender` directa o indirectamente, con la procedencia de sus líneas.

| Función | Líneas | Composición | Llama a |
|---|---|---|---|
| `MAX_OPCIONES` | 42–42 | PV 1 |  |
| `RELLENO` | 132–135 | ED 2 |  |
| `compiladas` | 136–138 | ED 3 |  |
| `compilar` | 139–154 | OV 1 · PV 14 | `RELLENO`, `compiladas` |
| `coincide` | 155–167 | OV 1 · PV 11 |  |
| `buscarExpresion` | 168–188 | OV 1 · PV 19 | `RELLENO`, `coincide`, `compilar` |
| `detectarConceptos` | 189–205 | OV 1 · PV 15 | `buscarExpresion` |
| `LEXICO_COMUN` | 222–245 | PV 23 |  |
| `NO_ENTIDAD` | 286–292 | ED 6 |  |
| `piezasDeNombre` | 293–293 | ED 1 | `RELLENO` |
| `mismasPalabras` | 294–295 | ED 2 |  |
| `nombraAlgoMas` | 296–309 | NV 12 | `NO_ENTIDAD`, `RELLENO` |
| `resolverEntidad` | 310–382 | OV 1 · ED 69 · NV 1 | `MAX_OPCIONES`, `NO_ENTIDAD`, `coincide`, `mismasPalabras`, `nombraAlgoMas`, `piezasDeNombre` |
| `LEXICOS` | 457–458 | PV 2 |  |
| `lexicoDe` | 459–463 | OV 1 · PV 3 | `LEXICOS` |
| `tiposDeEntidad` | 464–467 | OV 1 · PV 2 |  |
| `puntuar` | 468–484 | OV 1 · PV 15 |  |
| `entender` | 485–524 | OV 1 · ED 34 · PV 4 | `LEXICO_COMUN`, `detectarConceptos`, `fechas:interpretarFechas`, `indicesConsumidos`, `lexicoDe`, `mencionSinResolver`, `puntuar`, `referenciaAnterior`, `resolverEntidad`, `tiposDeEntidad` |
| `ARTICULO_DE_REFERENCIA` | 525–530 | OV 4 · RC 2 |  |
| `referenciaAnterior` | 531–545 | OV 14 | `ARTICULO_DE_REFERENCIA` |
| `indicesConsumidos` | 605–614 | OV 5 · RC 3 |  |
| `PREPOSICIONES_DE_MENCION` | 615–619 | RC 5 |  |
| `NO_ES_MENCION` | 620–620 | RC 1 |  |
| `mencionSinResolver` | 621–643 | OV 1 · RC 11 · NV 10 | `NO_ENTIDAD`, `NO_ES_MENCION`, `PREPOSICIONES_DE_MENCION`, `RELLENO` |

Dependencias en `fechasConversacion.js`:

| Función | Líneas | Composición | Llama a |
|---|---|---|---|
| `DIAS_SEMANA_CONVERSACION` | 27–27 | PV 1 |  |
| `NOMBRES_DIA` | 28–28 | PV 1 |  |
| `MESES_CONVERSACION` | 29–30 | PV 1 |  |
| `NUMEROS` | 31–37 | PV 7 |  |
| `NUM` | 38–38 | PV 1 | `NUMEROS` |
| `numero` | 39–40 | PV 1 | `NUMEROS` |
| `lunesDeFecha` | 41–46 | PV 5 | `iso` |
| `diaDeLaSemana` | 47–49 | PV 2 | `iso` |
| `ultimoDiaDelMes` | 50–50 | PV 1 |  |
| `iso` | 51–51 | PV 1 | `dia` |
| `partes` | 52–53 | PV 1 |  |
| `rangoDeMes` | 54–57 | PV 3 | `iso`, `ultimoDiaDelMes` |
| `etiquetaDeDia` | 58–71 | PV 13 | `MESES_CONVERSACION`, `NOMBRES_DIA`, `diaDeLaSemana`, `partes` |
| `diaYMesConversacion` | 72–79 | PV 7 | `MESES_CONVERSACION`, `partes` |
| `etiquetaDeRango` | 80–90 | PV 10 | `MESES_CONVERSACION`, `diaYMesConversacion`, `etiquetaDeDia`, `partes` |
| `dia` | 105–112 | PV 8 |  |
| `rango` | 113–116 | PV 3 | `dia` |
| `finDeSemana` | 117–126 | PV 9 | `diaDeLaSemana`, `lunesDeFecha`, `rango` |
| `diaDeSemanaNombrado` | 127–142 | PV 15 | `dia`, `diaDeLaSemana` |
| `fechaConDiaYMes` | 143–158 | PV 15 | `MESES_CONVERSACION`, `dia`, `iso`, `partes` |
| `diaSuelto` | 159–172 | PV 13 | `dia`, `iso`, `partes` |
| `MES` | 173–173 | PV 1 | `MESES_CONVERSACION` |
| `mesNumero` | 174–174 | PV 1 | `MESES_CONVERSACION` |
| `UNIDADES_NO_FECHA` | 175–176 | PV 1 |  |
| `REGLAS` | 177–275 | PV 98 | `DIAS_SEMANA_CONVERSACION`, `MES`, `NUM`, `UNIDADES_NO_FECHA`, `dia`, `diaDeSemanaNombrado`, `diaSuelto`, `fechaConDiaYMes`, `finDeSemana`, `iso`, `lunesDeFecha`, `mesNumero`, `numero`, `partes`, `rango`, `rangoDeMes` |
| `interpretarFechas` | 276–309 | PV 33 | `REGLAS`, `etiquetaDeRango` |

## `src/lib/motorConversacion.js`

Composición: OV 1219 · ED 144 · RC 56 · PV 332 · NV 103.

| Declaración | Líneas | Composición | Líneas que no son OV ni SC (clase: tramos) |
|---|---|---|---|
| `MAX_MENSAJE` | 38–38 | PV 1 | PV: 38 |
| `MAX_MENSAJES_CONVERSACION` | 39–39 | PV 1 | PV: 39 |
| `MAX_INTENCIONES` | 40–40 | PV 1 | PV: 40 |
| `MAX_ITEMS_LISTA` | 41–41 | PV 1 | PV: 41 |
| `MAX_OPCIONES` | 42–42 | PV 1 | PV: 42 |
| `TURNOS_CONTEXTO` | 43–43 | PV 1 | PV: 43 |
| `MINUTOS_CONTEXTO` | 44–44 | PV 1 | PV: 44 |
| `PUNTOS_MINIMOS` | 45–45 | PV 1 | PV: 45 |
| `VENTAJA_MINIMA` | 46–51 | PV 4 | PV: 46, 48–50 |
| `ABREVIATURAS` | 52–62 | PV 10 | PV: 52–61 |
| `ERRATAS_FECHA` | 63–76 | RC 12 | RC: 64–75 |
| `PALABRAS_DE_FECHA` | 77–80 | RC 4 | RC: 77–80 |
| `NO_SON_FECHA` | 81–84 | NV 3 | NV: 81–83 |
| `corregirFecha` | 85–92 | OV 1 · RC 6 | RC: 85–87, 89–91 |
| `palabrasParecidasAFecha` | 93–104 | OV 1 · RC 11 | RC: 93–95, 97–104 |
| `normalizarMensaje` | 105–131 | OV 1 · ED 18 · PV 2 · NV 3 | PV: 106–107; ED: 109–113, 117–126, 128–130; NV: 114–116 |
| `RELLENO` | 132–135 | ED 2 | ED: 133–134 |
| `compiladas` | 136–138 | ED 3 | ED: 136–138 |
| `compilar` | 139–154 | OV 1 · PV 14 | PV: 140–153 |
| `coincide` | 155–167 | OV 1 · PV 11 | PV: 156–166 |
| `buscarExpresion` | 168–188 | OV 1 · PV 19 | PV: 168, 170–187 |
| `detectarConceptos` | 189–205 | OV 1 · PV 15 | PV: 189–193, 195–204 |
| `LEXICO_GENERAL` | 206–221 | OV 1 · PV 13 | PV: 207–214, 216–220 |
| `LEXICO_COMUN` | 222–245 | PV 23 | PV: 222–244 |
| `CONECTORES` | 246–247 | PV 1 | PV: 246 |
| `ESCRITURA_AMBIGUA` | 248–253 | PV 6 | PV: 248–253 |
| `INTERROGATIVAS` | 254–255 | PV 1 | PV: 254 |
| `esOrdenDeEscritura` | 256–267 | OV 1 · PV 10 | PV: 256, 258–266 |
| `CONSEJO_DEBIL` | 268–273 | OV 1 · PV 5 | PV: 268, 270–273 |
| `consejoCubierto` | 274–279 | OV 1 · ED 4 | ED: 276–279 |
| `ORDINALES` | 280–285 | ED 4 | ED: 280, 282–284 |
| `NO_ENTIDAD` | 286–292 | ED 6 | ED: 286–291 |
| `piezasDeNombre` | 293–293 | ED 1 | ED: 293 |
| `mismasPalabras` | 294–295 | ED 2 | ED: 294–295 |
| `nombraAlgoMas` | 296–309 | NV 12 | NV: 296–307 |
| `resolverEntidad` | 310–382 | OV 1 · ED 69 · NV 1 | ED: 310–316, 318–365, 367–377, 379–381; NV: 366 |
| `nuevaConversacion` | 383–387 | OV 2 · ED 1 · PV 1 | ED: 383; PV: 386 |
| `bLista` | 418–423 | OV 1 · PV 5 | PV: 419–423 |
| `plural` | 424–425 | PV 1 | PV: 424 |
| `textoDeRespuesta` | 426–438 | OV 1 · PV 11 | PV: 426, 428–437 |
| `PALABRAS_PROHIBIDAS_CHAT` | 439–447 | PV 9 | PV: 439–447 |
| `incumpleHonestidad` | 448–456 | OV 1 · PV 6 | PV: 449–451, 453–455 |
| `LEXICOS` | 457–458 | PV 2 | PV: 457–458 |
| `lexicoDe` | 459–463 | OV 1 · PV 3 | PV: 460–462 |
| `tiposDeEntidad` | 464–467 | OV 1 · PV 2 | PV: 465–466 |
| `puntuar` | 468–484 | OV 1 · PV 15 | PV: 469–483 |
| `entender` | 485–524 | OV 1 · ED 34 · PV 4 | PV: 486–489; ED: 491–524 |
| `ARTICULO_DE_REFERENCIA` | 525–530 | OV 4 · RC 2 | RC: 525–526 |
| `indicesConsumidos` | 605–614 | OV 5 · RC 3 | RC: 611–613 |
| `PREPOSICIONES_DE_MENCION` | 615–619 | RC 5 | RC: 615–619 |
| `NO_ES_MENCION` | 620–620 | RC 1 | RC: 620 |
| `mencionSinResolver` | 621–643 | OV 1 · RC 11 · NV 10 | NV: 622, 633–639, 641–642; RC: 623–632, 640 |
| `CIRCUNSTANCIAS` | 644–664 | NV 21 | NV: 644–664 |
| `CATEGORIA_DE_CIRCUNSTANCIA` | 665–669 | NV 5 | NV: 665–669 |
| `PREPOSICIONES_DE_NOMBRE` | 670–672 | NV 2 | NV: 670–671 |
| `clasificarMencion` | 673–699 | NV 26 | NV: 673–698 |
| `mencionQueManda` | 700–705 | RC 1 · NV 5 | NV: 700–704; RC: 705 |
| `ganadora` | 706–714 | OV 1 · PV 7 | PV: 707–713 |
| `trozos` | 715–743 | OV 1 · PV 26 | PV: 715, 717–738, 740–742 |
| `argumentosPara` | 854–894 | OV 31 · NV 9 | NV: 865–871, 874–875 |
| `textosDeOpciones` | 895–914 | OV 9 · PV 11 | PV: 904–914 |
| `nombreRepetido` | 915–920 | PV 5 | PV: 915–919 |
| `ejecutarConArgs` | 972–1003 | OV 1 · PV 23 · NV 6 | PV: 974–981, 988–1002; NV: 982–987 |
| `capacidadParaPeriodo` | 1004–1032 | OV 1 · PV 27 | PV: 1004–1008, 1010–1031 |
| `fechasDistintas` | 1033–1044 | OV 4 · PV 7 | PV: 1033, 1035–1040 |

Enteras OV o SC (64): `MAX_ACLARACIONES_VIVAS`, `aclaracionesVivas`, `contextoVigente`, `heredable`, `NATURALEZAS`, `bTexto`, `bNota`, `bCifra`, `referenciaAnterior`, `posicionDe`, `fechaCalculada`, `completarSobreentendida`, `UNIDAD_DE_ANTERIOR`, `relativizarAnteriores`, `sugerenciasDe`, `respuestaFija`, `TEXTOS_LIMITE`, `periodoParaCapacidad`, `ejecutarCapacidad`, `registrarErrorAsistente`, `palabrasOriginales`, `textoOriginal`, `opcionesDeEntidades`, `aclaracionDeEntidad`, `faltaEntidad`, `pluralDe`, `noEncontrada`, `opcionDePendiente`, `responderMensaje`, `conversacionVacia`, `conversarCon`, `safe`, `TEXTO_SIN_DIFERENCIA`, `etiquetaDeRangoSimple`, `aEtiqueta`, `senalesPropias`, `itemUnicoConPeriodo`, `periodoValido`, `parejaValida`, `comparacionVigente`, `etiquetaDe`, `mayuscula`, `desplazarPareja`, `aclaracionDePareja`, `capacidadDeLaUltima`, `ejemplosConFechas`, `resolverAnterior`, `preguntaQueComparar`, `recordar`, `sinCapacidad`, `buscarAjeno`, `TIPOS_DE_METRICA`, `AGREGACIONES_DE_METRICA`, `medidaDePeriodo`, `validarMetrica`, `metricasComparables`, `metricaPara`, `limpiar`, `numeroLegible`, `decimalesDe`, `valorConUnidad`, `porcentajeLegible`, `compararMedidas`, `compararMetrica`.

Por motivo:

- **EDITADO A PARTIR DE ORIGINAL** — ea7bc4a + cambio de la especificación de las 11:11: 144 líneas (109–113, 117–126, 128–130, 133–134, 136–138, 276–280, 282–284, 286–291, 293–295, 310–316, 318–365, 367–377, 379–381, 383, 491–524)
- **NUEVO** — C · corrección de 14f225c (paso 9): 3 líneas (114–116)
- **NUEVO** — paso 17 · E2 (código nuevo): 7 líneas (622, 982–987)
- **NUEVO** — paso 17 · E2 (código nuevo) — sustituye a 1 línea(s) ORIGINAL VERIFICADO: 9 líneas (865–871, 874–875)
- **NUEVO** — paso 17 · E2 (código nuevo) — sustituye a 1 línea(s) RECONSTRUIDO: 68 líneas (633–639, 641–642, 644–671, 673–698, 700–704)
- **NUEVO** — paso 4 de la recuperación (no es código original): 16 líneas (81–83, 296–307, 366)
- **PROVISIONAL** — texto de ea7bc4a en un hueco: 276 líneas (2–3, 5–9, 11–14, 18–25, 27–29, 34–36, 38–46, 48–50, 52–61, 106–107, 140–153, 156–166, 168, 170–187, 189–193, 195–204, 207, 236–244, 246, 248–254, 256, 258–266, 268, 270–273, 386, 419–424, 426, 428–437, 439–447, 449–451, 453–455, 457–458, 460–462, 465–466, 469–483, 486–489, 707–713, 715, 717–738, 740–742, 904–919, 1012–1031, 1033, 1035–1040)
- **PROVISIONAL** — texto original verificado; posición no demostrada (salida posterior al primer parche B: 11:27:40 o 19:11:28): 56 líneas (208–214, 216–220, 222–235, 974–981, 988–1002, 1004–1008, 1010–1011)
- **RECONSTRUIDO** — escrito en el paso 2 por especificación: 56 líneas (64–75, 77–80, 85–87, 89–91, 93–95, 97–104, 525–526, 611–613, 615–620, 623–632, 640, 705)

## `src/lib/fechasConversacion.js`

Composición: OV 53 · RC 5 · PV 298.

| Declaración | Líneas | Composición | Líneas que no son OV ni SC (clase: tramos) |
|---|---|---|---|
| `DIAS_SEMANA_CONVERSACION` | 27–27 | PV 1 | PV: 27 |
| `NOMBRES_DIA` | 28–28 | PV 1 | PV: 28 |
| `MESES_CONVERSACION` | 29–30 | PV 1 | PV: 29 |
| `NUMEROS` | 31–37 | PV 7 | PV: 31–37 |
| `NUM` | 38–38 | PV 1 | PV: 38 |
| `numero` | 39–40 | PV 1 | PV: 39 |
| `lunesDeFecha` | 41–46 | PV 5 | PV: 41–45 |
| `diaDeLaSemana` | 47–49 | PV 2 | PV: 47–48 |
| `ultimoDiaDelMes` | 50–50 | PV 1 | PV: 50 |
| `iso` | 51–51 | PV 1 | PV: 51 |
| `partes` | 52–53 | PV 1 | PV: 52 |
| `rangoDeMes` | 54–57 | PV 3 | PV: 54–56 |
| `etiquetaDeDia` | 58–71 | PV 13 | PV: 58–70 |
| `diaYMesConversacion` | 72–79 | PV 7 | PV: 72–78 |
| `etiquetaDeRango` | 80–90 | PV 10 | PV: 80–89 |
| `diasDelRango` | 91–97 | OV 1 · PV 5 | PV: 91, 93–96 |
| `fechasDelRango` | 98–104 | PV 6 | PV: 98–103 |
| `dia` | 105–112 | PV 8 | PV: 105–112 |
| `rango` | 113–116 | PV 3 | PV: 113–115 |
| `finDeSemana` | 117–126 | PV 9 | PV: 117–125 |
| `diaDeSemanaNombrado` | 127–142 | PV 15 | PV: 127–141 |
| `fechaConDiaYMes` | 143–158 | PV 15 | PV: 143–157 |
| `diaSuelto` | 159–172 | PV 13 | PV: 159–171 |
| `MES` | 173–173 | PV 1 | PV: 173 |
| `mesNumero` | 174–174 | PV 1 | PV: 174 |
| `UNIDADES_NO_FECHA` | 175–176 | PV 1 | PV: 175 |
| `REGLAS` | 177–275 | PV 98 | PV: 177–274 |
| `interpretarFechas` | 276–309 | PV 33 | PV: 276–308 |
| `periodoPorDefecto` | 310–326 | PV 16 | PV: 310–325 |
| `unidadDePeriodo` | 327–343 | OV 11 · RC 5 | RC: 327–331 |

Enteras OV o SC (2): `periodoPrevio`, `periodoAnterior`.

Por motivo:

- **PROVISIONAL** — texto de ea7bc4a en un hueco: 298 líneas (2–3, 5–8, 10–14, 16–19, 21–23, 25, 27–29, 31–39, 41–45, 47–48, 50–52, 54–56, 58–70, 72–78, 80–89, 91, 93–96, 98–103, 105–115, 117–125, 127–141, 143–157, 159–171, 173–175, 177–274, 276–308, 310–325)
- **RECONSTRUIDO** — escrito en el paso 2 (JSDoc): 5 líneas (327–331)

## `src/lib/asistenteEstudios.js`

Composición: ED 4 · PV 220 · NV 10.

| Declaración | Líneas | Composición | Líneas que no son OV ni SC (clase: tramos) |
|---|---|---|---|
| `lista` | 27–27 | PV 1 | PV: 27 |
| `mayuscula` | 28–28 | PV 1 | PV: 28 |
| `etiquetaP` | 29–29 | PV 1 | PV: 29 |
| `horasTexto` | 30–30 | PV 1 | PV: 30 |
| `FUENTE` | 31–32 | PV 1 | PV: 31 |
| `ALIAS` | 33–50 | PV 17 | PV: 33–49 |
| `asignaturasDe` | 51–53 | PV 3 | PV: 51–53 |
| `nombreDeAsignatura` | 54–55 | PV 1 | PV: 54 |
| `LEXICO_TIPO` | 56–61 | PV 6 | PV: 56–61 |
| `tiposPedidos` | 62–67 | PV 5 | PV: 62–66 |
| `lineaDeFecha` | 68–78 | PV 9 | PV: 68–73, 75–77 |
| `proximos` | 79–103 | PV 24 | PV: 79–102 |
| `cuando` | 104–125 | PV 21 | PV: 104–124 |
| `horas` | 126–153 | PV 27 | PV: 126–152 |
| `notas` | 154–172 | PV 18 | PV: 154–171 |
| `temas` | 173–184 | PV 11 | PV: 173–183 |
| `asignaturas` | 185–191 | PV 6 | PV: 185–190 |
| `entidades` | 192–211 | PV 19 | PV: 192–210 |
| `conTipos` | 212–213 | PV 1 | PV: 212 |
| `VOCABULARIO_ASIGNATURAS` | 214–223 | NV 9 | NV: 214–222 |
| `ASISTENTE_ESTUDIOS` | 224–257 | ED 4 · PV 26 · NV 1 | PV: 225–229, 231–241, 245–246, 248–255; NV: 230; ED: 242–244, 247 |

Por motivo:

- **EDITADO A PARTIR DE ORIGINAL** — P7 · ea7bc4a + cambio descrito en el resumen de las 11:11 (forma escrita en el paso 2): 4 líneas (242–244, 247)
- **NUEVO** — paso 17 · E2 (código nuevo): 10 líneas (214–222, 230)
- **PROVISIONAL** — texto de ea7bc4a; de la 2.2 de este archivo no hay ninguna lectura: 220 líneas (1–2, 4–8, 10–12, 14–16, 18–25, 27–31, 33–49, 51–54, 56–66, 68–73, 75–77, 79–102, 104–124, 126–152, 154–171, 173–183, 185–190, 192–210, 212, 225–229, 231–241, 245–246, 248–255)

## `src/lib/asistenteSueno.js`

Composición: OV 90 · ED 1 · PV 541.

| Declaración | Líneas | Composición | Líneas que no son OV ni SC (clase: tramos) |
|---|---|---|---|
| `mayuscula` | 28–28 | PV 1 | PV: 28 |
| `DIAS_CORTOS` | 29–34 | PV 6 | PV: 29–34 |
| `minutosTexto` | 35–35 | PV 1 | PV: 35 |
| `tieneDuracion` | 36–37 | PV 1 | PV: 36 |
| `TEXTO_ANALIZAR_SUENO` | 38–42 | PV 4 | PV: 38–41 |
| `nochesDeSueno` | 43–72 | PV 29 | PV: 43–71 |
| `delPeriodo` | 73–78 | PV 5 | PV: 73–77 |
| `notasDeCalidadDeDatos` | 79–85 | PV 6 | PV: 79–84 |
| `fuente` | 86–87 | PV 1 | PV: 86 |
| `anteriorA` | 88–93 | PV 5 | PV: 88–92 |
| `caraTexto` | 94–98 | PV 4 | PV: 94–97 |
| `NOMBRE_HORA` | 99–100 | PV 1 | PV: 99 |
| `queLeFalta` | 101–106 | PV 5 | PV: 101–105 |
| `horaODesconocida` | 107–108 | PV 1 | PV: 107 |
| `notaSinHoras` | 109–117 | PV 8 | PV: 109–116 |
| `evaluarNoches` | 118–143 | PV 25 | PV: 118–142 |
| `ventanaDeUltimas` | 144–150 | PV 6 | PV: 144–149 |
| `periodoDeNoches` | 151–152 | PV 1 | PV: 151 |
| `dondeSeMira` | 153–162 | PV 8 | PV: 153–157, 159–161 |
| `noche` | 163–200 | PV 37 | PV: 163–199 |
| `sinNochesEn` | 201–212 | PV 11 | PV: 201–211 |
| `etiquetaP` | 213–214 | PV 1 | PV: 213 |
| `resumenCaras` | 215–222 | PV 7 | PV: 215–221 |
| `sinNingunaDuracion` | 223–234 | PV 11 | PV: 223–233 |
| `media` | 235–273 | PV 38 | PV: 235–272 |
| `calidad` | 274–293 | PV 19 | PV: 274–292 |
| `quiere` | 294–296 | PV 3 | PV: 294–296 |
| `reciente` | 297–298 | PV 1 | PV: 297 |
| `extremos` | 299–340 | PV 41 | PV: 299–339 |
| `minutosDeNoche` | 341–346 | PV 6 | PV: 341–346 |
| `minutosDeManana` | 347–351 | PV 4 | PV: 347–350 |
| `horarios` | 352–388 | PV 36 | PV: 352–387 |
| `despertares` | 389–419 | OV 19 · PV 11 | PV: 389–399 |
| `comparar` | 420–488 | OV 65 · PV 3 | PV: 485–487 |
| `registro` | 489–511 | PV 22 | PV: 489–510 |
| `ultimas` | 512–578 | OV 4 · PV 62 | PV: 512–516, 518–528, 530–534, 536–575, 577 |
| `incompletas` | 579–607 | PV 28 | PV: 579–606 |
| `fiabilidad` | 608–633 | OV 1 · PV 23 | PV: 608–626, 628, 630–632 |
| `ASISTENTE_SUENO` | 634–674 | OV 1 · ED 1 · PV 37 | PV: 635–655, 657–666, 668–673; ED: 656 |

Por motivo:

- **EDITADO A PARTIR DE ORIGINAL** — P7 · ea7bc4a + cambio descrito en el resumen de las 11:11 (forma escrita en el paso 2): 1 líneas (656)
- **PROVISIONAL** — texto de ea7bc4a en un hueco del mapa forense: 541 líneas (1–2, 4–7, 9–12, 14–17, 19–26, 28–36, 38–41, 43–71, 73–77, 79–84, 86, 88–92, 94–97, 99, 101–105, 107, 109–116, 118–142, 144–149, 151, 153–157, 159–161, 163–199, 201–211, 213, 215–221, 223–233, 235–272, 274–292, 294–297, 299–339, 341–350, 352–387, 389–399, 485–487, 489–510, 512–516, 518–528, 530–534, 536–575, 577, 579–606, 608–626, 628, 630–632, 635–655, 657–666, 668–673)

## `src/lib/asistenteNutricion.js`

Composición: OV 11 · SC 276.

| Declaración | Líneas | Composición | Líneas que no son OV ni SC (clase: tramos) |
|---|---|---|---|
| `compararDias` | 210–271 | OV 11 · SC 50 |  |

Enteras OV o SC (22): `lista`, `mayuscula`, `DIAS_CORTOS`, `etiquetaP`, `decimal`, `FUENTE`, `comidasDe`, `LEXICO_INDICADOR`, `indicadoresPedidos`, `valorConUnidad`, `dia`, `mediaDelRango`, `PERIODOS_DEL_MOTOR`, `promedios`, `media`, `comidas`, `agua`, `constancia`, `extremos`, `conIndicadores`, `ASISTENTE_NUTRICION`, `mediaDelRangoNutricion`.

## `src/lib/asistenteFitness.js`

Composición: OV 38 · SC 237.

| Declaración | Líneas | Composición | Líneas que no son OV ni SC (clase: tramos) |
|---|---|---|---|
| `ASISTENTE_FITNESS` | 265–296 | OV 5 · SC 26 |  |

Enteras OV o SC (20): `lista`, `mayuscula`, `DIAS_CORTOS`, `propiosDe`, `etiquetaP`, `FUENTE`, `completadosHastaHoy`, `hastaHoy`, `notaFuturas`, `lineaDeFicha`, `ultimo`, `dia`, `cuantos`, `plan`, `ejercicio`, `record`, `objetivos`, `medidaDeEntrenos`, `METRICAS_FITNESS`, `entidades`.

## `src/lib/asistenteProductividad.js`

Composición: OV 38 · SC 164.

| Declaración | Líneas | Composición | Líneas que no son OV ni SC (clase: tramos) |
|---|---|---|---|
| `ASISTENTE_PRODUCTIVIDAD` | 192–220 | OV 4 · SC 24 |  |

Enteras OV o SC (14): `lista`, `mayuscula`, `etiquetaP`, `habitosDe`, `habitos`, `seguidos`, `racha`, `pomodoro`, `metas`, `objetivos`, `rutinas`, `medidaDePomodoro`, `METRICAS_PRODUCTIVIDAD`, `entidades`.

## `src/components/asistenteChat.jsx`

Composición: OV 9 · SC 253.

| Declaración | Líneas | Composición | Líneas que no son OV ni SC (clase: tramos) |
|---|---|---|---|
| `RespuestaAsistente` | 85–125 | OV 6 · SC 34 |  |
| `ConversacionAsistente` | 126–208 | OV 3 · SC 75 |  |

Enteras OV o SC (3): `BotonAsistente`, `Bloque`, `HojaAsistente`.

## `scripts/smoke-vistas.jsx`

Solo lo de B0 (OV): líneas 4818–4838. El resto, SC.

## `scripts/test-motor-conversacion.mjs`

Composición: OV 436 · RC 144 · PV 119 · NV 405 (NV 290 hasta el paso 17; +115 del paso 18, ver el último apartado).

| Sección | Líneas | Composición | Líneas que no son OV ni SC (clase: tramos) |
|---|---|---|---|
| `1. Normalizar un mensaje` | 34–43 | OV 8 · PV 1 | PV: 42 |
| `2. Conceptos: raíces, plurales y erratas` | 44–57 | PV 13 | PV: 44–56 |
| `3. Fechas relativas (hoy es viernes 23 de octubre de 2026)` | 58–93 | PV 35 | PV: 58–92 |
| `4. Entidades: nombres, abreviaturas, ambigüedad` | 94–113 | OV 1 · PV 18 | PV: 94, 96–112 |
| `5. Responder: intención, ambigüedad, varias preguntas y cont` | 114–172 | OV 46 · PV 11 | PV: 114, 116, 163–171 |
| `6. Lo común: saludo, ayuda, IA, límites, escribir, otro módu` | 173–199 | OV 1 · PV 25 | PV: 173, 175–198 |
| `7. Datos sin cargar, fallos y determinismo` | 200–217 | OV 1 · PV 16 | PV: 200, 202–216 |
| `8. Fase 2.1 · Motor honesto: ni otra fecha, ni otra entidad,` | 218–327 | OV 3 · RC 84 · NV 16 | RC: 218, 221–233, 235–242, 244–258, 265–268, 270–281, 286–289, 291–296, 298–307, 315–325; NV: 259–263, 282–285, 308–314 |
| `9. Fase 2.2 · Contexto: «la anterior», unidades sobreentendi` | 328–467 | OV 73 · RC 60 | RC: 377–408, 410–416, 418–421, 423–439 |
| `Palabras que son propiedades heredadas («constructor», «__pr` | 468–481 | NV 13 | NV: 468–480 |
| `12. Paso 4 · Auditoría de B0–B2: comprobaciones que faltaban` | 765–792 | NV 27 | NV: 765–791 |
| `13. Paso 15 · Regresión de entidades: lo nombrado es lo que ` | 793–888 | NV 89 | NV: 793–828, 830–835, 837–847, 849–854, 856–866, 868–876, 878–887 |
| `14. Paso 17 · E2: entidad conocida, desconocida, circunstanc` | 889–1048 | OV 2 · NV 145 | NV: 889–896, 898–917, 919–922, 924–928, 930–962, 964–973, 975–980, 982–987, 989–992, 994–1010, 1012–1016, 1018–1027, 1029–1032, 1034–1038, 1040–1047 |
| `15. Paso 18 · Ramas internas: un solo día, ningún día, periodo` | 1049–1169 | NV 115 | NV: 1049–1169 (las 115 no vacías) |

Enteras OV o SC (3): `Fase 2 · Núcleo conversacional y fechas `, `10. Fase 2.3 · B0 · Comparaciones como p`, `11. Fase 2.3 · B1 · Comparador común: di`.

Por motivo:

- **NUEVO** — C · corrección de 14f225c (paso 9): 13 líneas (468–480)
- **NUEVO** — paso 15 · pruebas de regresión de entidades: 89 líneas (793–828, 830–835, 837–847, 849–854, 856–866, 868–876, 878–887)
- **NUEVO** — paso 17 · pruebas de E2: 145 líneas (889–896, 898–917, 919–922, 924–928, 930–962, 964–973, 975–980, 982–987, 989–992, 994–1010, 1012–1016, 1018–1027, 1029–1032, 1034–1038, 1040–1047)
- **NUEVO** — paso 18 · las cinco ramas internas sin recorrer: 115 líneas (1049–1169)
- **NUEVO** — paso 4 de la recuperación (no es código original): 43 líneas (259–263, 282–285, 308–314, 765–791)
- **PROVISIONAL** — texto de ea7bc4a en un hueco: 119 líneas (42, 44–56, 58–92, 94, 96–112, 114, 116, 163–171, 173, 175–198, 200, 202–216)
- **RECONSTRUIDO** — escrito en el paso 2 (sección con menos comprobaciones que la original): 144 líneas (218, 221–233, 235–242, 244–258, 265–268, 270–281, 286–289, 291–296, 298–307, 315–325, 377–408, 410–416, 418–421, 423–439)

## `scripts/test-asistentes-chat.mjs`

Composición: OV 355 · RC 169 · PV 763 · NV 356 (NV 227 hasta el paso 17; +129 del paso 19). Rangos desde la línea 1238 corregidos en el paso 22 (+134, ver el último apartado).

| Sección | Líneas | Composición | Líneas que no son OV ni SC (clase: tramos) |
|---|---|---|---|
| `1. Sueño` | 185–241 | OV 16 · PV 40 | PV: 201–240 |
| `2. Fitness` | 242–288 | PV 46 | PV: 242–287 |
| `3. Nutrición` | 289–330 | PV 41 | PV: 289–329 |
| `4. Estudios` | 331–362 | PV 31 | PV: 331–361 |
| `5. Productividad` | 363–389 | PV 26 | PV: 363–388 |
| `5a. Un día frente a un rango` | 390–429 | PV 39 | PV: 390–428 |
| `5b. Corpus de variantes (sin contexto previo)` | 430–489 | PV 59 | PV: 430–488 |
| `6. Escenarios adversariales` | 490–525 | PV 35 | PV: 490–524 |
| `7. Datos vacíos, corruptos, sin cargar y extremos` | 526–571 | PV 45 | PV: 526–570 |
| `8. Honestidad: ni causas, ni consejos, ni predicciones, ni j` | 572–587 | PV 15 | PV: 572–586 |
| `9. Lista blanca, privacidad y matriz` | 588–608 | PV 20 | PV: 588–607 |
| `10. Sin red, sin IA, sin claves; los paneles e Imagen person` | 609–675 | PV 66 | PV: 609–674 |
| `11. Integración en App.jsx` | 676–693 | PV 17 | PV: 676–692 |
| `12. Correcciones de la auditoría (D1–D10)` | 694–870 | PV 163 | PV: 694–703, 705–719, 721–733, 735–747, 749–769, 771–798, 800–814, 816–819, 821–829, 831–840, 842–851, 853–860, 862–866, 868–869 |
| `13. Fase 2.1 · Fechas, entidades y preguntas honestas (los c` | 871–971 | OV 1 · RC 85 · NV 8 | RC: 871–879, 881–895, 897–905, 907–919, 921–927, 929–935, 941–942, 944–948, 950–962, 966–967, 969–971; NV: 936–940, 963–965 |
| `14. Fase 2.2 · Contexto conversacional (los cinco asistentes` | 972–1116 | OV 48 · RC 84 · PV 8 | RC: 973–975, 977, 996–1018, 1020, 1022, 1024–1043, 1058, 1060–1093; PV: 1044–1047, 1052, 1054–1056 |
| `Palabras que son propiedades heredadas («constructor», «__pr` | 1117–1128 | NV 11 | NV: 1117–1127 |
| `Paso 19 · las cuatro comprobaciones de B0 (dentro de la sección 15)` | 1238–1371 | NV 129 | NV: 1238–1370 (las 129 no vacías) |
| `17. Paso 4 · Auditoría de B0–B2: comprobaciones que faltaban` | 1505–1528 | NV 23 | NV: 1505–1527 |
| `18. Paso 15 · Regresión de entidades en Estudios: lo nombrad` | 1529–1614 | NV 79 | NV: 1529–1558, 1560–1565, 1567–1577, 1579–1584, 1586–1596, 1598–1602, 1604–1613 |
| `19. Paso 17 · E2 en los cinco asistentes: circunstancias, de` | 1615–1728 | OV 2 · NV 106 | NV: 1615–1643, 1645–1697, 1699–1708, 1710–1719, 1721–1724 |

Enteras OV o SC (3): `Fase 2 · Los asistentes del primer lote`, `15. Fase 2.3 · B0 · Comparaciones como p`, `16. Fase 2.3 · B2 · Métricas de Fitness `. (La 15 lleva dentro, desde el paso 19, el bloque NUEVO de las líneas 1238–1371; y la línea 12, la importación del motor, se amplió en el paso 19 con `TURNOS_CONTEXTO` y `MINUTOS_CONTEXTO`.)

Por motivo:

- **NUEVO** — C · corrección de 14f225c (paso 9): 11 líneas (1117–1127)
- **NUEVO** — paso 15 · pruebas de regresión de entidades: 79 líneas (1529–1558, 1560–1565, 1567–1577, 1579–1584, 1586–1596, 1598–1602, 1604–1613)
- **NUEVO** — paso 19 · las cuatro comprobaciones de B0 con el asistente de Sueño: 129 líneas (1238–1370)
- **NUEVO** — paso 17 · pruebas de E2: 106 líneas (1615–1643, 1645–1697, 1699–1708, 1710–1719, 1721–1724)
- **NUEVO** — paso 4 de la recuperación (no es código original): 31 líneas (936–940, 963–965, 1505–1527)
- **PROVISIONAL** — texto de ea7bc4a en un hueco: 755 líneas (41–47, 49–60, 62–72, 74–97, 99–112, 114–137, 139–158, 201–240, 242–287, 289–329, 331–361, 363–388, 390–428, 430–488, 490–524, 526–570, 572–586, 588–607, 609–674, 676–692, 694–703, 705–719, 721–733, 735–747, 749–769, 771–798, 800–814, 816–819, 821–829, 831–840, 842–851, 853–860, 862–866, 868–869)
- **PROVISIONAL** — texto original verificado; posición no demostrada (grep de las 19:13:36, posterior a B sobre este archivo): 8 líneas (1044–1047, 1052, 1054–1056)
- **RECONSTRUIDO** — escrito en el paso 2 (sección con menos comprobaciones que la original): 169 líneas (871–879, 881–895, 897–905, 907–919, 921–927, 929–935, 941–942, 944–948, 950–962, 966–967, 969–971, 973–975, 977, 996–1018, 1020, 1022, 1024–1043, 1058, 1060–1093)

## Paso 17 · E2: qué cambió respecto al paso 15

Todo lo de E2 es **NUEVO** (no es código original). Fuera de las inserciones, solo se sustituyeron estas líneas:

| Archivo | Línea en el paso 15 | Clase que tenía | Texto sustituido |
|---|---|---|---|
| `src/lib/motorConversacion.js` | 632 | RECONSTRUIDO | `if (indices.some((k) => tokens[k].length >= 3)) return { indices, texto: indices.map((k) =` |
| `src/lib/motorConversacion.js` | 634 | RECONSTRUIDO | `return null;` |
| `src/lib/motorConversacion.js` | 795 | ORIGINAL VERIFICADO | `const r = propia?.estado !== 'ninguna' ? propia : (trozo.mencion ? null : entero.entidades` |
| `src/lib/motorConversacion.js` | 798 | ORIGINAL VERIFICADO | `else if (trozo.mencion) args.desconocida = textoOriginal(trozo.mencion.texto, entero.origi` |

- Las dos de `mencionSinResolver` eran RECONSTRUIDAS (paso 2): ahora guarda la preposición de cada mención y las devuelve todas (`todas`); la primera sigue arriba, como antes.
- Las dos de `argumentosPara` eran ORIGINAL VERIFICADO: la mención se clasifica antes (`mencionQueManda`) y solo la desconocida y la no filtrable cortan la herencia; la regla de herencia original sigue debajo sin tocar.
- `recordar`, la elipsis y el resto del código original no cambian. `ejecutarConArgs` (PROVISIONAL) solo gana una rama nueva para la mención no filtrable.

Funciones y reglas nuevas (E2):

- `CIRCUNSTANCIAS` (lugar, compañía, medio) y `PREPOSICIONES_DE_NOMBRE` (de, del, sobre), en el motor; un asistente puede ampliar las circunstancias con `circunstancias`.
- `clasificarMencion(mencion, { asistente, tipo, obligatoria, eliptica })`: vocabulario del tipo → desconocida; circunstancia → circunstancia; «con» → compañía (circunstancia); de/del/sobre → desconocida; entidad obligatoria → desconocida; «¿y en X?» que solo cambia eso → desconocida; el resto → no filtrable.
- `mencionQueManda`: entre varias menciones manda la primera desconocida; si no hay, la primera no filtrable; si solo hay circunstancias, ninguna corta nada.
- `VOCABULARIO_ASIGNATURAS` y `vocabulario: { asignatura }` en el asistente de Estudios.
- Pruebas: sección 14 de `test-motor-conversacion.mjs` y sección 19 de `test-asistentes-chat.mjs`.

## Paso 22 · pasos 18 y 19, y rangos corregidos (2026-10-31)

Actualización hecha al integrar en la rama local `claude/chatbots-fase-2x` (desde `14f225c`), autorizada por Josué. **No cambia
ninguna clase ni ninguna decisión anterior**: añade las pruebas de los pasos 18 y 19, que este documento no recogía, y corrige
los números de línea que esas inserciones desplazaron. El código de la aplicación no cambió en los pasos 18 y 19, así que sus
números de línea y las 14 marcas siguen igual.

| Archivo | Qué se insertó | Dónde | Efecto en los rangos |
|---|---|---|---|
| `scripts/test-motor-conversacion.mjs` | Paso 18: sección 15, las cinco ramas internas (115 líneas no vacías, todas NUEVO) | 1049–1169, antes del cierre | La sección 14 termina en la 1048 (antes 1051: sus tres últimas líneas eran el cierre del archivo, ahora en 1170–1172). Ningún otro rango cambia |
| `scripts/test-asistentes-chat.mjs` | Paso 19: las cuatro comprobaciones de B0 con Sueño (129 líneas no vacías, todas NUEVO), dentro de la sección 15 | 1238–1371 | Todo lo que estaba desde la 1238 baja 134 líneas (secciones 17, 18 y 19, y sus tramos) |
| `scripts/test-asistentes-chat.mjs` | Paso 19: la importación del motor gana `TURNOS_CONTEXTO` y `MINUTOS_CONTEXTO` | línea 12 | Ninguno (cambia en su sitio) |

**Valores anteriores, para el registro:** `test-motor-conversacion.mjs` NV 290 (sección 14: 889–1051); `test-asistentes-chat.mjs`
NV 227 (sección 17: 1371–1394; 18: 1395–1480; 19: 1481–1594, con sus tramos 134 líneas más arriba).

**Lo que sigue siendo del paso 15:** la frase de «Marcas en el código» —quitándolas, cada archivo es idéntico al ensayo del paso
12— describe el estado del paso 15; desde entonces los archivos llevan además E2 (paso 17) y las pruebas de los pasos 17, 18 y
19, cada una con su fila aquí. El mapa línea a línea (`paso17/registros/procedencia.json`) está en el espacio de trabajo de la
recuperación y no se regeneró: para estos dos archivos mandan los rangos de este documento.
