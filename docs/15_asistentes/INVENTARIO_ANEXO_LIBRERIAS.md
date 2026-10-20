# Anexo del inventario · qué librerías usa cada pantalla

> Parte de [`INVENTARIO.md`](INVENTARIO.md). **Generado el 2026-10-19 sobre la v3.158.0 (commit
> `200f8b4`) leyendo el código con `@babel/parser` (nivel V1): no se edita a mano.** Es una foto: si
> el código cambia, se queda vieja. El método está en el anexo A de `INVENTARIO.md`.
>
> Para cada módulo: las pantallas y componentes que lo forman; cada librería de `src/lib/` que esas
> pantallas **importan y usan de verdad** (el nombre aparece en el cuerpo del archivo, no solo en el
> `import`), con los nombres usados; y qué suites de `scripts/` importan esa librería. **Importar no
> es comprobar valores**: el nivel de cada prueba está en las fichas de `INVENTARIO.md` §7.
> «**ninguna**» = ninguna suite importa la librería (puede probarse de forma indirecta pintando la
> pantalla en el banco de renderizado).

### Inicio

Pantallas: `views/DashboardView.jsx`, `components/quickAdd.jsx`, `components/avatarPerfil.jsx`, `views/HubView.jsx`, `views/AgrupadorView.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `accionesHoyAgenda.js` | 9: contextoDeAdd, tipoQuickAdd, validarTarea, validarEvento, validarApunte, campoConError, accionesDe, avisoDe, SEGUNDOS_AVISO | test-acciones-hoy-agenda.mjs, test-gestion-tareas.mjs, test-motion-f9.mjs, test-cumpleanos.mjs (+2) |
| `helpers.js` | 7: calcularDuracion, formatHoras, hexToRgba, diasHasta, formatFecha, todayISO, addDays | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `motion.js` | 4: transicion, duracionMs, contextoDelDocumento, escalonado | test-motion-f1.mjs, test-motion-f10.mjs, test-motion-f14.mjs, test-motion-f16.mjs (+19) |
| `fotoPerfil.js` | 3: saludoCompleto, esFotoValida, inicialesDe | test-foto-perfil.mjs |
| `centroDelDia.js` | 2: TEXTOS_APUNTES, MAX_APUNTE | test-centro-dia.mjs, test-tareas.mjs |
| `salud.js` | 2: imcDe, NOMBRE_MODULO | test-bienestar.mjs |
| `calendario.js` | 2: resumenDelDia, eventosDelDia | test-calendario.mjs, test-nutricion-dias.mjs, test-cumpleanos.mjs |
| `puntuacion.js` | 2: puntuacionDelDia, mensajePuntuacion | test-puntuacion.mjs |
| `rachas.js` | 1: resumenHabito | test-rachas.mjs, test-habitos.mjs, test-rachas-hoy.mjs, test-rachas-gamificacion.mjs (+1) |
| `integracionPR.js` | 1: resumenParaHoy | test-integracion-pr.mjs, test-gestion-tareas.mjs |
| `sueno.js` | 1: calidadDe | test-sueno.mjs, test-robustez-fitness.mjs, test-sueno-grafica.mjs |
| `notificaciones.js` | 1: notificarSiCorresponde | **ninguna** |
| `avisosPlanificacion.js` | 1: avisosPendientes | test-avisos-planificacion.mjs |
| `profundidad.js` | 1: desenfoque | test-motion-f6.mjs |

### Salud física

Pantallas: `views/HealthView.jsx`, `components/fotosProgreso.jsx`, `components/comparadorFotos.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `comparadorFotos.js` | 35: pantallaComparador, ENTRADAS_COMPARADOR, MODOS_COMPARACION, ALINEACIONES, SLIDER_MIN, SLIDER_MAX, SLIDER_PASO, SLIDER_PASO_GRANDE, ARIA_SLIDER, posicionSlider, moverSlider, ZOOM_PASO… | test-arquitectura-fitness.mjs, test-comparador-fotos.mjs, smoke-vistas.jsx |
| `salud.js` | 14: NOMBRE_MODULO, SUBTITULO_MODULO, SECCIONES_BIENESTAR, aperturaInicialBN, estadoActual, avisoDeRegistro, evolucionPeso, resumenDeMedida, resumenDeSeccion, filtrosDeHistorial, filtrarHistorial, ordenarHistorial… | test-bienestar.mjs |
| `fotosProgreso.js` | 11: TAGS_FOTO, tagFoto, VACIO_FOTOS, ERRORES_FOTO, FOTOS_POR_TANDA, LADO_MAXIMO, CALIDAD_JPEG, dimensionesOptimizadas, etiquetaDeDia, sesionDeFoto, vecinasDeFoto | test-arquitectura-fitness.mjs, test-fotos-progreso.mjs, test-comparador-fotos.mjs, test-auditoria-fitness.mjs (+6) |
| `helpers.js` | 4: uid, formatFecha, todayISO, hexToRgba | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `motion.js` | 2: escalonado, transicion | test-motion-f1.mjs, test-motion-f10.mjs, test-motion-f14.mjs, test-motion-f16.mjs (+19) |
| `seleccionArchivos.js` | 2: eventoDeArchivos, MB | test-seleccion-archivos.mjs |
| `acabadoFitness.js` | 2: HOJA, acentoLegible | test-acabado-fitness.mjs, test-arquitectura-fitness.mjs, test-motion-f15.mjs, test-explicacion-rangos.mjs (+5) |
| `supabase.js` | 1: getSignedPhotoUrl | **ninguna** |
| `datosMotion.js` | 1: dominioEstable | test-motion-f17.mjs, test-motion-f4.mjs, test-motion-f19.mjs |
| `fisicaMotion.js` | 1: punteroQueCuenta | test-motion-f14.mjs, test-motion-f8.mjs, test-motion-f19.mjs, test-motion-f11.mjs |

### Sueño

Pantallas: `views/SleepView.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `sueno.js` | 20: CALIDADES, PREGUNTA_CALIDAD, PREGUNTA_INTERRUPCIONES, PREGUNTA_SIESTA, INTERRUPCIONES, MAX_SIESTA_MIN, HORA_DORMIR_DEFECTO, HORA_DESPERTAR_DEFECTO, crearRegistroSueno, valorDeCalidad, textoDuracion, resumenNoche… | test-sueno.mjs, test-robustez-fitness.mjs, test-sueno-grafica.mjs |
| `helpers.js` | 3: formatHoras, formatFecha, hexToRgba | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `datosMotion.js` | 1: dominioEstable | test-motion-f17.mjs, test-motion-f4.mjs, test-motion-f19.mjs |

### Nutrición

Pantallas: `views/NutritionView.jsx`, `components/jarraAgua.jsx`, `components/BarcodeScanner.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `objetivosNutricion.js` | 15: DATOS_DEL_PERFIL, SEXO_BMR, sexoDesdePerfil, NIVELES_ACTIVIDAD, OBJETIVOS_NUTRICION, PASOS_CONFIG, validar, planObjetivos, editarObjetivo, coherencia, objetivosParaResumen, avisoDePeso… | test-objetivos-nutricion.mjs, test-estadisticas-nutricion.mjs |
| `alimentos.js` | 15: alimentoDesdeOFF, escalar, validarCantidad, crearComidaDesdeAlimento, cambiarCantidad, cambiarMomento, unidad, UNIDADES, textoCantidad, lineaDeMomento, estadoDeIndicador, excesoDe… | test-alimentos.mjs, test-mis-alimentos.mjs |
| `misAlimentos.js` | 15: CATEGORIAS_ALIMENTO, CATEGORIA_POR_DEFECTO, CAMPOS_PROPIO, validarPropio, crearAlimentoPropio, editarAlimentoPropio, esFavorito, recientesPorDia, reutilizarComida, catalogoCompleto, buscarEnTodos, resumenNutricional… | test-mis-alimentos.mjs |
| `estadisticasNutricion.js` | 15: PERIODOS_NUT, PERIODO_NUT_POR_DEFECTO, promediosDelPeriodo, cumplimientoDelPeriodo, evolucion, MACROS_EVOLUCION, constancia, NO_ES_RACHA, mejorYPeorDia, analisisProteina, analisisCalorias, hayEstadisticas… | test-estadisticas-nutricion.mjs |
| `nutricion.js` | 11: MOMENTOS, resumenDelDia, porMomento, hayAlgoRegistrado, VACIO_DIA, VACIO_MOMENTO, tiraDeDias, mesDeNutricion, tituloDeMes, tituloDelDia, estadoDeDia | test-estadisticas-nutricion.mjs, test-gestion-tareas.mjs, test-nutricion.mjs, test-alimentos.mjs (+4) |
| `aguaNutricion.js` | 8: objetivoDeAgua, progresoAgua, mlDelDia, validarObjetivoAgua, guardarObjetivoAgua, textoDeLitros, fraseDeAgua, TEXTOS_AGUA | test-agua-nutricion.mjs |
| `helpers.js` | 5: uid, todayISO, addDays, hexToRgba, calcularEdad | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `inteligenciaNutricion.js` | 4: TITULO_PANEL, analizarNutricion, resumenParaHoy, contextoIANutricion | test-inteligencia-nutricion.mjs |
| `openFoodFacts.js` | 2: buscarProductoPorCodigoBarras, buscarAlimentosPorNombre | **ninguna** |
| `ai.js` | 2: askAIWithImage, AI_SYSTEM | test-disponibilidad-ia.mjs |
| `disponibilidadIA.js` | 2: estadoDeErrorIA, registrarErrorIA | test-disponibilidad-ia.mjs |
| `seleccionArchivos.js` | 2: eventoDeArchivos, MB | test-seleccion-archivos.mjs |
| `motion.js` | 1: escalonado | test-motion-f1.mjs, test-motion-f10.mjs, test-motion-f14.mjs, test-motion-f16.mjs (+19) |
| `datosMotion.js` | 1: dominioEstable | test-motion-f17.mjs, test-motion-f4.mjs, test-motion-f19.mjs |
| `sincronizacion.js` | 1: textoDeFalloAlGuardar | test-motion-f16.mjs, test-editar-examenes.mjs |
| `estadosAsincronos.js` | 1: estadoDePermiso | test-motion-f16.mjs, test-motion-f19.mjs, test-cumpleanos.mjs, test-editar-examenes.mjs |

### Fitness

Pantallas: `views/FitnessView.jsx`, `views/TuPlanView.jsx`, `views/ProgresoView.jsx`, `views/RangosView.jsx`, `views/ClasificacionView.jsx`, `views/EjerciciosView.jsx`, `views/BibliotecaPlanesView.jsx`, `views/PlantillasView.jsx`, `views/ConstructorView.jsx`, `views/EntrenamientoVivoView.jsx`, `views/FinalizacionView.jsx`, `views/HistorialView.jsx`, `views/DetalleMuscularView.jsx`, `components/actividadEntrenamiento.jsx`, `components/bibliotecaEjercicios.jsx`, `components/colaClasificacion.jsx`, `components/contribucionMuscular.jsx`, `components/detalleEjercicio.jsx`, `components/explicacionRango.jsx`, `components/historialRango.jsx`, `components/objetivosFitness.jsx`, `components/planificacionSemanal.jsx`, `components/rangos.jsx`, `components/resumenProgreso.jsx`, `components/resumenRangos.jsx`, `components/siguienteRango.jsx`, `components/sustitucion.jsx`, `components/estadosFitness.jsx`, `components/piezasFitness.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `entrenamiento.js` | 30: empezarSesion, guardarSesion, sesionActiva, descartarSesion, sesionEnCursoDelMismoOrigen, ejerciciosDeSesion, ejercicioActual, duracionSesion, duracionCreible, reloj, irAEjercicio, siguienteEjercicio… | test-arquitectura-fitness.mjs, test-entrenamiento.mjs, smoke-vistas.jsx, test-actividad-entrenamiento.mjs (+36) |
| `constructor.js` | 26: crearRutina, planARutina, leerBorrador, borrarBorrador, textoDeSeries, textoDeCarga, musculosResumidos, DESCANSOS, MODOS_LINEA, TIPOS_CARGA, MAX_SERIES, nombreDeLinea… | test-constructor.mjs, test-entrenamiento.mjs, test-release-fitness.mjs, smoke-vistas.jsx (+33) |
| `entrenamientoUx.js` | 20: cabeceraEnSesion, serieActiva, ajustarValor, PASOS, completarSerie, desmarcarSerie, alternarDescansoAuto, iniciarDescanso, pausarDescansoSesion, reanudarDescansoSesion, terminarDescanso, sumarDescanso… | test-entrenamiento-ux.mjs, test-auditoria-fitness.mjs, test-entrenamiento.mjs, test-motion-f5.mjs (+1) |
| `planes.js` | 19: usarPlan, personalizarPreset, alternarFavoritoPlan, quitarPlanActivo, diaARutina, CATALOGO_PLANES, FILTRO_TODOS, planPorId, fichaDePlan, fichaDeDia, planesVisibles, pastillasDeFiltro… | test-arquitectura-fitness.mjs, test-planes.mjs, test-planificacion-semanal.mjs, test-tu-plan.mjs (+9) |
| `bibliotecaEjercicios.js` | 19: consultarBiblioteca, opcionesDeFiltroBiblioteca, paginaDeBiblioteca, POR_PAGINA_BIBLIOTECA, bloquesDeBiblioteca, fichaDeBiblioteca, favoritosDeEjercicios, alternarFavoritoEjercicio, entrenamientosParaAnadir, anadirAEntrenamiento, rutinaNuevaCon, sesionParaAnadir… | test-biblioteca-ejercicios.mjs, test-validacion-catalogo.mjs, smoke-vistas.jsx, test-persistencia-fitness.mjs (+2) |
| `historial.js` | 13: detalleDeSesion, sesionDelHistorial, sesionesDelHistorial, fichaDeHistorial, consultarHistorial, FILTROS_FECHA, ORDENES_HISTORIAL, FILTROS_POR_DEFECTO, PAGINA_HISTORIAL, HISTORIAL_VACIO, SIN_RESULTADOS, AVISO_ELIMINAR_SESION… | test-historial.mjs, smoke-vistas.jsx, test-actividad-entrenamiento.mjs, test-auditoria-fitness.mjs (+11) |
| `plantillas.js` | 12: duplicarPlantilla, ORDENACIONES, ORDEN_POR_DEFECTO, MINIMO_PARA_BUSCAR, FILTRO_TODOS, filtrosDeEntorno, fichaDePlantilla, lineasDePlantilla, plantillasVisibles, contarPorEntorno, avisoDeEliminar, ESTADO_VACIO_PLANTILLAS | test-arquitectura-fitness.mjs, test-plantillas.mjs, test-auditoria-fitness.mjs, test-acabado-fitness.mjs |
| `finalizacion.js` | 12: sesionEnFinalizacion, AVISO_RECUPERAR_FINAL, descartarEntrenamiento, pasarAFinalizacion, resumenDeSesion, pantallaDeExito, guardarEntrenamiento, AVISO_SIN_SERIES, AVISO_DESCARTAR_FINAL, TEXTO_GUARDANDO, MEDIA_PENDIENTE, FOTO_DEL_ENTRENAMIENTO | test-acabado-fitness.mjs, test-arquitectura-fitness.mjs, test-finalizacion.mjs, test-auditoria-fitness.mjs (+35) |
| `fitness.js` | 10: AREAS_FITNESS, AREA_INICIAL, ESTADOS_VACIOS, ACCESOS_ENTRENAMIENTO, rachaDeFitness, resumenProgreso, CTA_CLASIFICAR, SIN_RANGO, nivelRango, VISIBILIDADES | test-arquitectura-fitness.mjs, test-fitness.mjs, test-cola-clasificacion.mjs, test-detalle-muscular.mjs (+38) |
| `ejercicios.js` | 9: nombreDeEjercicio, ejercicioPorId, nombreCompleto, nombreSinCatalogo, ENTORNOS, musculoPrincipal, dificultad, equipo, entorno | test-ejercicios.mjs, test-validacion-catalogo.mjs, test-sustitucion.mjs, test-biblioteca-ejercicios.mjs (+20) |
| `objetivosProgreso.js` | 9: cancelarObjetivo, listaDeObjetivos, metricasDeEjercicio, tipoObjetivo, editarObjetivo, FILTROS_OBJETIVOS, OBJETIVOS_VACIO, AVISO_CANCELAR_OBJETIVO, AVISO_ELIMINAR_OBJETIVO | test-objetivos-progreso.mjs, test-objetivos-fitness.mjs, smoke-vistas.jsx, test-auditoria-fitness.mjs (+8) |
| `objetivosFitness.js` | 8: objetivoEnVivo, detalleDeObjetivo, crearObjetivoConAviso, reactivarObjetivo, AVISO_DUPLICADO, FECHA_SUPERADA, CELEBRACION, SIN_PORCENTAJE | test-objetivos-fitness.mjs, test-auditoria-fitness.mjs, smoke-vistas.jsx, test-robustez-fitness.jsx (+1) |
| `progresoEjercicios.js` | 8: tarjetasDeProgreso, consultarProgreso, resumenDeProgreso, geometriaGrafica, indicesConMarca, FILTROS_PROGRESO, RANGOS_GRAFICA, PROGRESO_VACIO | test-progreso-ejercicios.mjs, test-resumen-progreso.mjs, smoke-vistas.jsx, test-actividad-entrenamiento.mjs (+2) |
| `clasificacion.js` | 7: preguntaDeEjercicio, clasificarEjercicio, estadoDeClasificacion, musculosQueRecibe, resumenFinal, AVISO_ESTIMACION, AVISO_RECLASIFICAR | test-clasificacion.mjs, test-cola-clasificacion.mjs, smoke-vistas.jsx, test-auditoria-fitness.mjs (+8) |
| `sustitucion.js` | 7: configuracionDeSesion, pantallaDeSustitucion, sustitucionElegida, necesitaConfirmar, nivelCompatibilidad, TEXTOS_SUSTITUCION, AVISO_OBJETIVO | test-arquitectura-fitness.mjs, test-sustitucion.mjs, smoke-vistas.jsx, test-auditoria-fitness.mjs (+2) |
| `tuPlan.js` | 6: planActivoCompleto, sesionDelDia, tuPlan, SIN_PLAN, PLAN_PERDIDO, DESCANSO_HOY | test-planificacion-semanal.mjs, test-tu-plan.mjs, test-finalizacion.mjs, test-auditoria-fitness.mjs (+3) |
| `resumenRangos.js` | 6: resumenDeRangos, DESTINO_GLOBAL, BLOQUES_RANGOS, ETIQUETA_DESTACADOS, SUBTITULO_DESTACADOS, SIN_EVOLUCION | test-arquitectura-fitness.mjs, test-resumen-rangos.mjs, smoke-vistas.jsx, test-persistencia-fitness.mjs (+1) |
| `actividadEntrenamiento.js` | 5: resumenDeActividad, mesDeActividad, sesionesDelDiaDeActividad, PERIODOS_ACTIVIDAD, PERIODO_ACTIVIDAD_POR_DEFECTO | test-actividad-entrenamiento.mjs, smoke-vistas.jsx, test-acabado-fitness.mjs, test-planificacion-semanal.mjs (+4) |
| `progresoMuscular.js` | 5: resumenMuscular, ejerciciosDeMusculo, ejercicioEnGrupo, FILTROS_GRUPO, AVISO_RENDIMIENTO | test-progreso-muscular.mjs, test-contribucion-muscular.mjs, test-rendimiento-fitness.mjs, smoke-vistas.jsx |
| `historialRangos.js` | 5: pantallaDeHistorial, detalleDeCambio, PERIODOS_HISTORIAL, PERIODO_POR_DEFECTO, HISTORIAL_INSUFICIENTE | test-arquitectura-fitness.mjs, test-historial-rangos.mjs, test-actividad-entrenamiento.mjs, test-rendimiento-fitness.mjs (+3) |
| `feedbackFitness.js` | 4: resultadoDeGuardado, subidasDeRango, TEXTOS_GUARDADO, TEXTOS_SUBIDA | test-feedback-fitness.mjs, test-acabado-fitness.mjs, test-arquitectura-fitness.mjs, test-movil-fitness.mjs (+5) |
| `vueltaFitness.js` | 4: crearOrigen, origenVigente, vueltaDelDetalle, vueltaDeSesion | test-auditoria-fitness.mjs |
| `colaClasificacion.js` | 4: pantallaDeClasificacion, avisoDeReclasificar, VACIOS_COLA, estadoDato | test-arquitectura-fitness.mjs, test-cola-clasificacion.mjs, test-resumen-rangos.mjs, test-sustitucion.mjs (+1) |
| `detalleMuscular.js` | 4: detalleDeGrupo, detalleDeSubgrupo, FILTROS_EJERCICIOS, filtrarPorTendencia | test-arquitectura-fitness.mjs, test-detalle-muscular.mjs, smoke-vistas.jsx |
| `resumenProgreso.js` | 4: centroDeProgreso, PERIODOS_RESUMEN, VER_TODO, FOTOS_RESUMEN_MAX | test-arquitectura-fitness.mjs, test-resumen-progreso.mjs, test-actividad-entrenamiento.mjs, smoke-vistas.jsx (+2) |
| `acabadoFitness.js` | 3: acentoLegible, HOJA, CERRAR_HOJA | test-acabado-fitness.mjs, test-arquitectura-fitness.mjs, test-motion-f15.mjs, test-explicacion-rangos.mjs (+5) |
| `movilFitness.js` | 3: ultimaVezEnVivo, PROPS_CAMPO_NUMERICO, PROPS_CAMPO_BUSQUEDA | test-movil-fitness.mjs, test-motion-f15.mjs |
| `detalleEjercicio.js` | 3: detalleCompletoDeEjercicio, OBJETIVO_CONSEGUIDO, VER_HISTORIAL_RANGO | test-detalle-ejercicio.mjs, test-validacion-catalogo.mjs, smoke-vistas.jsx, test-robustez-fitness.mjs (+2) |
| `contribucionMuscular.js` | 3: contribucionesDeMusculo, contribucionesPorSubgrupo, ETIQUETA_PARTICIPACION | test-arquitectura-fitness.mjs, test-contribucion-muscular.mjs, test-validacion-catalogo.mjs, smoke-vistas.jsx (+1) |
| `helpers.js` | 2: hexToRgba, todayISO | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `persistenciaFitness.js` | 2: avisoDeFallo, motivoDeFallo | test-persistencia-fitness.mjs, test-feedback-fitness.mjs |
| `planificacionSemanal.js` | 2: planificacionDeTuPlan, PLAN_INVALIDO | test-planificacion-semanal.mjs, smoke-vistas.jsx, test-auditoria-fitness.mjs |
| `fotosProgreso.js` | 2: pantallaDeFotos, fotosEnOrden | test-arquitectura-fitness.mjs, test-fotos-progreso.mjs, test-comparador-fotos.mjs, test-auditoria-fitness.mjs (+6) |
| `numerosFitness.js` | 1: decimal | test-arquitectura-fitness.mjs |
| `pantallaRangos.js` | 1: detalleDeRango | test-pantalla-rangos.mjs, smoke-vistas.jsx, test-integracion-fitness.mjs, test-validacion-catalogo.mjs |
| `explicacionRangos.js` | 1: explicacionDeRango | test-explicacion-rangos.mjs, smoke-vistas.jsx, test-resumen-rangos.mjs |
| `rendimientoFitness.js` | 1: RETARDO_AUTOGUARDADO_MS | test-rendimiento-fitness.mjs, test-persistencia-fitness.mjs |
| `eventos.js` | 1: emitir | test-audio.mjs |
| `accesibilidadMotion.js` | 1: desplazarHasta | test-motion-f12.mjs, test-motion-f13.mjs, test-cumpleanos.mjs |
| `siguienteRango.js` | 1: tarjetaSiguienteRango | test-arquitectura-fitness.mjs, test-siguiente-rango.mjs, smoke-vistas.jsx |
| `fechasFitness.js` | 1: fechaEtiqueta | test-acabado-fitness.mjs |

### Imagen personal

Pantallas: `views/EstiloHombreView.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `sonrisa.js` | 29: MODULO_SONRISA, TEXTOS_SONRISA, PASOS_SONRISA, MOMENTOS_SONRISA, momentoSonrisa, TIPOS_PRODUCTO_SONRISA, FRECUENCIAS_CEPILLO, avisoRevision, configurarSonrisa, decirAhoraNoSonrisa, alternarParteSonrisa, crearRutinaSonrisa… | test-sonrisa.mjs, smoke-vistas.jsx |
| `productosPiel.js` | 25: PARTE_PRODUCTOS, CATEGORIAS_PRODUCTO_PIEL, categoriaPiel, productosPiel, crearProductoPiel, eliminarProductoPiel, alternarFavoritoPiel, alternarMioPiel, valorarProductoPiel, enlacesDePiel, marcarNoDisponiblePiel, alternativasDePiel… | smoke-vistas.jsx, test-productos-piel.mjs, test-accesorios.mjs, test-integrales.mjs (+7) |
| `cortesPelo.js` | 24: PARTES_LONGITUD, perfilDeCorte, progresoCorte, contestarCorte, guardarReferencia, referenciaDe, cortesDisponibles, anadirCorte, alternarFavoritoCorte, fijarCorteActual, corteActual, marcarQuieroProbar… | test-cortes-pelo.mjs, smoke-vistas.jsx |
| `rutinasPelo.js` | 22: PLAQUITAS_PELO, PARTES_PELO, ACCIONES_PELO, FRECUENCIAS_PELO, COMO_LO_NOTAS, datosPelo, parteActiva, alternarParte, crearRutina, editarRutina, impactoEliminarRutina, eliminarRutina… | test-rutinas-pelo.mjs, test-rutinas-piel.mjs, smoke-vistas.jsx, test-peluqueria.mjs (+3) |
| `rutinasPiel.js` | 22: PLAQUITAS_PIEL, PARTES_PIEL, parteActivaPiel, alternarPartePiel, pasosParaNivel, MOMENTOS_PIEL, FRECUENCIAS_PIEL, datosRutinasPiel, crearRutinaPiel, impactoEliminarRutinaPiel, eliminarRutinaPiel, rutinasDeHoyPiel… | test-productos-piel.mjs, test-rutinas-piel.mjs, smoke-vistas.jsx, test-recomendaciones-piel.mjs (+2) |
| `perfilBarba.js` | 21: TEXTOS_BARBA, PARTES_BARBA, PLAQUITAS_BARBA, datosBarba, decirAhoraNoBarba, configurarBarba, elegirPartesBarba, parteActivaBarba, alternarParteBarba, estadoDeEntradaBarba, contestarBarba, borrarBarba… | test-perfil-barba.mjs, smoke-vistas.jsx, test-rutinas-barba.mjs |
| `configuracionInicial.js` | 19: pasoAsistente, puedeOmitir, TEXTO_OMITIR, estadoAsistente, normalizarAsistente, iniciarAsistente, avanzar, retroceder, marcarEnSeleccion, seleccionarTodos, limpiarSeleccion, contadorSeleccion… | test-configuracion-inicial.mjs, test-primer-uso.mjs, smoke-vistas.jsx, test-datos-estilo-hombre.mjs |
| `peluqueria.js` | 19: PREFERENCIAS_CORTE, ANTELACIONES_AVISO, MODOS_PROXIMO, panelPeluqueria, historialDeCortes, registrarCorte, borrarCorte, planificarCorte, editarCita, avisoEliminarCita, eliminarCita, marcarCorteRealizado… | smoke-vistas.jsx, test-cortes-pelo.mjs, test-peluqueria.mjs |
| `perfumes.js` | 19: MODULO_PERFUMES, TEXTOS_PERFUMES, aroma, ocasion, configurarPerfumes, decirAhoraNoPerfumes, alternarPartePerfumes, contestarPerfume, anadirPerfume, alternarFavoritoPerfume, valorarPerfume, ponerPerfumeActual… | test-perfumes.mjs, test-recomendaciones-perfumes.mjs, test-accesorios.mjs, smoke-vistas.jsx (+11) |
| `accesorios.js` | 19: MODULO_ACCESORIOS, TEXTOS_ACCESORIOS, CASILLAS_ACCESORIOS, configurarAccesorios, decirAhoraNoAccesorios, elegirCategoriasAccesorios, alternarParteAccesorios, prepararAltaAccesorio, aplicarAltaAccesorio, usarPrendaComoAccesorio, editarAccesorio, alternarFavoritoAccesorio… | test-accesorios.mjs, test-integracion-estilo.mjs, test-rendimiento.mjs, smoke-vistas.jsx (+1) |
| `rutinasBarba.js` | 18: PASOS_BARBA, FRECUENCIAS_BARBA, frecuenciaBarba, ESCALA_BARBA, ASPECTOS_BARBA, usarPlantillaBarba, crearRutinaBarba, alternarFavoritaBarba, alternarRecordatorioBarba, impactoEliminarRutinaBarba, eliminarRutinaBarba, marcarPasoBarba… | smoke-vistas.jsx, test-rutinas-barba.mjs |
| `rutinasCuerpo.js` | 18: panelRutinasCuerpo, crearRutinaCuerpo, usarPlantillaCuerpo, editarRutinaCuerpo, marcarPasoCuerpo, omitirPasoCuerpo, marcarRutinaCuerpoEntera, quitarPasoCuerpo, anadirPasoCuerpo, alternarRecordatorioCuerpo, impactoEliminarRutinaCuerpo, eliminarRutinaCuerpo… | test-rutinas-cuerpo.mjs, test-integrales.mjs |
| `manosPies.js` | 18: panelMP, configurarSeccion, alternarCosaSeccion, alternarRecordatorioSeccion, alternarSeguimientoMP, usarPlantillaMP, crearRutinaMP, marcarPasoMP, marcarRutinaMPEntera, alternarRecordatorioRutinaMP, impactoEliminarRutinaMP, eliminarRutinaMP… | test-manos-pies.mjs |
| `productosPelo.js` | 17: CATEGORIAS_PRODUCTO_PELO, categoriaProducto, CATALOGO_VACIO_PORQUE, productosPelo, crearProductoPelo, alternarFavorito, alternarMio, marcarNoDisponible, alternativasDe, enlacesDe, recomendarProductos, packsPelo… | test-productos-pelo.mjs, test-productos-piel.mjs, smoke-vistas.jsx, test-peluqueria.mjs (+1) |
| `gustos.js` | 15: MODULO_GUSTOS, TEXTOS_GUSTOS, DESTINO_DIARIO, configurarGustos, decirAhoraNoGustos, alternarParteGustos, anadirGusto, editarGusto, alternarFavoritoGusto, cambiarEstadoGusto, ponerFechaGusto, completarSuelto… | test-gustos.mjs, test-objetivos-eh.mjs, test-estados-estilo.mjs, test-estructura-datos.mjs (+7) |
| `perfilPiel.js` | 14: MODULO_PIEL, TEXTOS_PIEL, panelPiel, contestarPiel, progresoPiel, estadoDeEntrada, decirAhoraNo, volverAConfigurar, anadirProductoPiel, quitarProductoPiel, resumenPiel, respuestaPiel… | test-perfil-piel.mjs, test-productos-piel.mjs, test-recomendaciones-piel.mjs, test-rutinas-piel.mjs (+8) |
| `ideasEstilo.js` | 12: TEXTOS_IDEAS, FRECUENCIAS_IDEAS, panelIdeas, ocultarIdeas, mostrarIdeas, cambiarFrecuencia, responderIdea, guardarIdea, quitarGuardada, marcarVistas, borrarHistorialIdeas, datosIdeas | test-descubrir.mjs, test-ideas-estilo.mjs, test-preferencias-estilo.mjs, smoke-vistas.jsx (+1) |
| `descubrir.js` | 12: TEXTOS_DESCUBRIR, FRECUENCIAS_DESCUBRIR, panelDescubrir, ocultarDescubrir, mostrarDescubrir, cambiarFrecuenciaDescubrir, alternarFiltro, descartarTarjeta, guardarTarjeta, quitarTarjetaGuardada, marcarVistasDescubrir, datosDescubrir | test-descubrir.mjs, smoke-vistas.jsx, test-primer-uso.mjs, test-gestion-estilo.mjs |
| `gestionModulos.js` | 11: modulosAgrupados, resultadosAgrupados, avisoDesactivar, subirModulo, bajarModulo, puedeMover, recomendados, fichaModulo, TEXTOS_GESTION, resumenGestion, moverA | test-gestion-modulos.mjs, test-pantalla-eh.mjs, test-buscador-estilo.mjs, test-mi-estilo.mjs |
| `perfilEstilo.js` | 10: ZONA_MI_ESTILO, perfilDeEstilo, alternarValor, anadirLibre, limpiarCampo, estadoDelPerfil, loQueReflejaTuArmario, contrasteConElArmario, nombreDeValor, NIVELES_ESTILO | test-mi-estilo.mjs, test-perfil-estilo.mjs, test-accesorios.mjs, test-accesibilidad-eh.mjs (+10) |
| `pantallaEH.js` | 10: CABECERA_EH, TEXTOS_PANTALLA, alternarAcceso, alternarVerAccesos, panelPantalla, cambiarTamano, alternarLinea, restablecerDiseno, personalizarAutomaticamente, panelPersonalizar | test-pantalla-eh.mjs, test-gestion-estilo.mjs, test-acciones-rapidas.mjs, test-ideas-estilo.mjs (+6) |
| `primerUso.js` | 10: TEXTOS_PRIMER_USO, panelPrimerUso, verTutorial, avanzarTutorial, saltarTutorial, pasoDelTutorial, cerrarIdea, aceptarSugerencia, rechazarSugerencia, anadirAEstilo | test-primer-uso.mjs, smoke-vistas.jsx |
| `seguimientoPiel.js` | 9: ESCALA_PIEL, TEXTO_NO_REGISTRAR, ASPECTOS_PIEL, NIVELES_ASPECTO, registrarPiel, PERIODOS_PIEL, panelSeguimientoPiel, resumenSeguimientoPiel, desdeQueUsas | smoke-vistas.jsx, test-seguimiento-piel.mjs, test-recomendaciones-piel.mjs |
| `objetivosEnEstiloHombre.js` | 9: TEXTOS_PUENTE, DESTINO_OBJETIVOS, FOCO_OBJETIVOS, PARTE_EXPERIENCIAS, estadoDelObjetivo, prepararObjetivo, aplicarObjetivo, marcarYaLoHice, panelPuente | test-objetivos-eh.mjs, test-productividad-launcher.mjs, smoke-vistas.jsx |
| `avisosEstilo.js` | 9: TEXTOS_AVISOS_EH, panelAvisosEH, alternarTipo, alternarSilencio, desactivarAvisosEH, activarAvisosEH, crearRecordatorio, borrarRecordatorio, repeticion | test-auditoria-final.mjs, test-avisos-estilo.mjs, test-integrales.mjs, test-manos-pies.mjs (+2) |
| `estadosEstilo.js` | 9: MENSAJES_HECHO, DURACION_FEEDBACK_MS, TARJETAS_DE_CARGA, estadoDeColeccion, avisoDeCorrupto, estadoDeAcceso, estadoDeConexion, avisoDeBorrado, COLECCIONES_EH | test-accesibilidad-eh.mjs, test-estados-estilo.mjs, smoke-vistas.jsx, test-motion-f16.mjs (+7) |
| `cuerpoHigiene.js` | 9: MODULO_HIGIENE, MODULO_CUERPO, panelCH, elegirPartesCH, alternarParteCH, alternarCosaHigiene, decirAhoraNoCH, contestarCH, respuestaCH | test-cuerpo-higiene.mjs, test-integrales.mjs, test-manos-pies.mjs, test-rutinas-cuerpo.mjs (+1) |
| `recomendacionesPelo.js` | 8: MOTIVOS_DESCARTE, recomendarPelo, descartar, guardarRecomendacion, guardadasDePelo, aplicarARutina, PUENTE_PRODUCTOS_PELO, resumenRecomendacionesPelo | test-recomendaciones-pelo.mjs, smoke-vistas.jsx, test-recomendaciones-piel.mjs, test-cortes-pelo.mjs |
| `recomendacionesPiel.js` | 8: PARTE_RECOMENDACIONES, MOTIVOS_DESCARTE_PIEL, recomendarPiel, descartarPiel, guardarRecomendacionPiel, quitarGuardadaPiel, anadirARutina, resumenRecsPiel | test-recomendaciones-piel.mjs |
| `gestionEstilo.js` | 8: TEXTOS_GESTION_EH, panelGestionEstilo, alternarOculto, desactivarModulo, activarModulo, alternarParteDe, avisoEliminarDatos, restablecerEstilo | test-accesibilidad-eh.mjs, test-coherencia-visual.mjs, test-gestion-estilo.mjs, test-avisos-estilo.mjs (+5) |
| `datosEstiloHombre.js` | 7: todosLosDatos, resumenDatos, guardarDato, eliminarDato, antiguedadDato, TEXTO_SIN_DATO, ACCION_ANADIR | test-datos-estilo-hombre.mjs, test-accesorios.mjs, test-armario-estilo-hombre.mjs, test-cuerpo-higiene.mjs (+12) |
| `perfilCapilar.js` | 7: MODULO_PELO, TEXTOS_PELO, perfilCapilar, contestarPelo, borrarPelo, progresoPelo, dudasDelPerfil | test-cortes-pelo.mjs, test-peluqueria.mjs, test-perfil-capilar.mjs, test-productos-pelo.mjs (+4) |
| `preferenciasEstilo.js` | 7: ZONA_PREFERENCIAS, TEXTOS_PREFERENCIAS, panelPreferencias, alternarPreferenciasEnUso, borrarPreferencia, restablecerCategoria, eliminarDatosDeEstilo | test-preferencias-estilo.mjs, smoke-vistas.jsx |
| `estiloDeHombre.js` | 6: modulosActivos, todosLosModulos, alternarModulo, estadoPantalla, resumenEstiloHombre, normalizarEstiloHombre | test-renombrado-estilo.mjs, test-escalabilidad.mjs, test-gestion-modulos.mjs, test-pantalla-eh.mjs (+54) |
| `recomendacionesPerfumes.js` | 6: panelRecsPerfume, compararPerfumes, descartarPerfume, ponerEnRotacion, ponerEspera, MAX_COMPARAR | test-recomendaciones-perfumes.mjs, smoke-vistas.jsx |
| `progresoEstilo.js` | 6: TEXTOS_PROGRESO, panelProgreso, ocultarProgreso, mostrarProgreso, alternarMetrica, cambiarPeriodo | test-progreso-estilo.mjs, test-insights.mjs, test-auditoria-final.mjs, test-integrales.mjs (+4) |
| `miEstilo.js` | 4: TEXTOS_MI_ESTILO, ocultarMiEstilo, mostrarMiEstilo, panelMiEstilo | test-avisos-estilo.mjs, test-buscador-estilo.mjs, test-descubrir.mjs, test-ideas-estilo.mjs (+10) |
| `buscadorEstilo.js` | 4: TEXTOS_BUSCADOR, panelBuscador, resolverApartado, apuntarReciente | test-buscador-estilo.mjs, test-cuerpo-higiene.mjs, test-manos-pies.mjs, test-rutinas-cuerpo.mjs (+3) |
| `armarioEnEstiloHombre.js` | 3: MODULO_EH_ESTILO, DESTINO_ARMARIO, resumenEstiloArmario | test-armario-estilo-hombre.mjs |
| `integracionEstilo.js` | 3: TEXTOS_INTEGRACION, panelIntegracion, prepararTarea | test-integracion-estilo.mjs, smoke-vistas.jsx |
| `rendimiento.js` | 3: DEBOUNCE_BUSQUEDA_MS, paginar, POR_PAGINA | test-rendimiento.mjs, test-integrales.mjs, test-biblioteca-global.mjs, test-documentos.mjs (+3) |
| `privacidadEstilo.js` | 2: TEXTOS_PRIVACIDAD, panelPrivacidad | test-privacidad-estilo.mjs, test-auditoria-final.mjs, test-manos-pies.mjs, test-rutinas-cuerpo.mjs (+3) |
| `helpers.js` | 1: hexToRgba | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `accesibilidadMotion.js` | 1: desplazarHasta | test-motion-f12.mjs, test-motion-f13.mjs, test-cumpleanos.mjs |

### Estudios

Pantallas: `views/EstudiosView.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `estudiosApps.js` | 34: ICONOS_ESTUDIOS, ICONO_POR_DEFECTO, sugerirIcono, iconoDeApp, MAX_NOMBRE_APP, crearApp, nombreYaUsado, moverApp, AVISO_OCULTAR, alternarOcultaApp, appsOrdenadas, appsVisibles… | test-estudios-apps.mjs, test-apps-aprendizaje.mjs, test-asignaturas.mjs, test-cierre-estudios.mjs (+1) |
| `asignaturas.js` | 30: ACENTOS_COLECCION, ICONOS_ASIGNATURA, ICONO_ASIGNATURA_POR_DEFECTO, sugerirIconoAsignatura, iconoDeAsignatura, MAX_NOMBRE_ASIGNATURA, MAX_NOMBRE_TEMA, MAX_DESCRIPCION_TEMA, estadoTema, crearAsignatura, editarAsignatura, alternarOcultaAsignatura… | test-asignaturas.mjs, test-asignaturas-compartidas.mjs, test-cierre-estudios.mjs, test-usos-asignatura.mjs (+1) |
| `fechasAcademicas.js` | 24: TIPOS_EVENTO_ACADEMICO, TIPO_EVENTO_POR_DEFECTO, tipoEventoAcademico, tipoDeFecha, ESTADOS_EXAMEN, ESTADOS_ENTREGA, estadoExamen, estadoEntrega, MAX_NOMBRE_FECHA, MAX_NOTAS_FECHA, cuentaAtras, fechasAcademicas… | test-fechas-academicas.mjs, test-editar-examenes.mjs, test-cierre-estudios.mjs |
| `appsAprendizaje.js` | 14: PLANTILLAS_APP, DESDE_CERO, plantillaApp, plantillaParaTipo, ramasDePlantilla, objetivosDeApp, planObjetivoDeApp, desvincularObjetivo, progresoDeApp, SIN_DATOS, MAX_TITULO_ACTIVIDAD, crearActividadEstudio… | test-apps-aprendizaje.mjs |
| `cierreEstudios.js` | 8: panelDelHome, VACIO_PROXIMO, FILTROS_EVENTOS, todasLasFechas, resumenRapido, proximoDeAsignatura, proximoDeApp, rutaDeFecha | test-cierre-estudios.mjs |
| `helpers.js` | 4: uid, formatFecha, todayISO, hexToRgba | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `ai.js` | 2: askAI, AI_SYSTEM | test-disponibilidad-ia.mjs |
| `usosAsignatura.js` | 2: usosDeAsignatura, avisoEliminarAsignatura | test-usos-asignatura.mjs |
| `disponibilidadIA.js` | 2: estadoDeErrorIA, registrarErrorIA | test-disponibilidad-ia.mjs |
| `correlaciones.js` | 1: correlacionSuenoEstudio | test-sueno-grafica.mjs |
| `metasObjetivos.js` | 1: PLAZOS_OBJETIVO | test-metas-objetivos.mjs, smoke-vistas.jsx, test-integracion-pr.mjs |
| `sincronizacion.js` | 1: resumenSincronizacion | test-motion-f16.mjs, test-editar-examenes.mjs |
| `accesibilidadMotion.js` | 1: desplazarHasta | test-motion-f12.mjs, test-motion-f13.mjs, test-cumpleanos.mjs |

### Productividad

Pantallas: `views/ProductivityView.jsx`, `views/RachasView.jsx`, `views/ObjectivesView.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `rutinas.js` | 42: CABECERA_RUTINAS, VACIO_RUTINAS, ICONOS_RUTINA, ICONO_RUTINA_POR_DEFECTO, CATEGORIAS_RUTINA, categoriaRutina, TIPOS_PASO, TIPO_PASO_POR_DEFECTO, tipoPaso, PROGRAMACIONES, programacion, crearRutina… | test-rutinas.mjs, smoke-vistas.jsx, test-integracion-pr.mjs |
| `metasObjetivos.js` | 34: TIPOS_META, TIPO_META_POR_DEFECTO, tipoMeta, crearMeta, editarMeta, completarMeta, actualizarProgreso, progresoDeMeta, metaCompletada, textoDeFechaMeta, FILTROS_META, filtrarMetas… | test-metas-objetivos.mjs, smoke-vistas.jsx, test-integracion-pr.mjs |
| `habitos.js` | 30: FRECUENCIAS_HABITO, FRECUENCIA_POR_DEFECTO, frecuenciaDe, reglaDe, describirRegla, CATEGORIAS_HABITO, ICONOS_HABITO, ICONO_HABITO_POR_DEFECTO, crearHabito, editarHabito, pausarHabito, reanudarHabito… | test-habitos.mjs, smoke-vistas.jsx |
| `pomodoro.js` | 25: tipoSesion, DURACIONES_SUGERIDAS, normalizarConfig, duracionDe, iniciarSesion, normalizarSesionEnCurso, estaPausada, restanteMs, haTerminado, progreso, formatearTiempo, pausar… | test-pomodoro.mjs, smoke-vistas.jsx, test-tareas.mjs |
| `tareas.js` | 24: PRIORIDADES, PRIORIDAD_POR_DEFECTO, etiquetaDePrioridad, CATEGORIAS_TAREA, categoriaTarea, crearTarea, editarTarea, reprogramar, DESTINOS_REPROGRAMAR, estadoDeFecha, textoDeFecha, SECCIONES_TAREAS… | test-tareas.mjs, test-metas-objetivos.mjs, smoke-vistas.jsx, test-integracion-pr.mjs (+1) |
| `integracionPR.js` | 12: panelSeguro, resumenDelDia, queMeQueda, paraHoyPR, PESOS_PRIORIDAD, ACCIONES_RAPIDAS_PR, cadenas, progresoGlobal, PERIODOS_PR, estadisticasPR, rachaProductividad, DEFINICION_DIA_PRODUCTIVO | test-integracion-pr.mjs, test-gestion-tareas.mjs |
| `rachasGamificacion.js` | 7: panelGamificacion, diasDelMes, progresoHaciaHito, ESTADOS_LOGRO, definicionLogro, EVENTOS_GAMIFICACION, NIVELES_CELEBRACION | test-rachas-gamificacion.mjs, smoke-vistas.jsx, test-audio.mjs |
| `rachas.js` | 5: alternarHabito, TIPOS_RACHA, ESTADOS_RACHA, ESTADOS_DIA, CLASES_REGLA | test-rachas.mjs, test-habitos.mjs, test-rachas-hoy.mjs, test-rachas-gamificacion.mjs (+1) |
| `rachasHoy.js` | 4: mantenimientoHoy, textoMantenimiento, feedbackDeSubida, esperaDelFeedback | test-rachas-hoy.mjs, test-motion-f20.mjs |
| `helpers.js` | 3: todayISO, formatFecha, hexToRgba | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `productividad.js` | 3: MINI_APPS_PR, miniAppPR, CLASE_TARJETA_PR | test-auditoria-dist.mjs, test-habitos.mjs, test-integracion-pr.mjs, test-pomodoro.mjs (+4) |
| `motion.js` | 3: escalonado, transicion, contextoDelDocumento | test-motion-f1.mjs, test-motion-f10.mjs, test-motion-f14.mjs, test-motion-f16.mjs (+19) |
| `rachasServicio.js` | 2: panelRachas, panelHabitos | test-rachas-gamificacion.mjs, test-rachas-servicio.mjs, smoke-vistas.jsx |
| `ai.js` | 2: askAI, AI_SYSTEM | test-disponibilidad-ia.mjs |
| `disponibilidadIA.js` | 2: estadoDeErrorIA, registrarErrorIA | test-disponibilidad-ia.mjs |
| `eventos.js` | 1: emitir | test-audio.mjs |
| `accesibilidadMotion.js` | 1: desplazarHasta | test-motion-f12.mjs, test-motion-f13.mjs, test-cumpleanos.mjs |

### Mente (Fe, Relación, Bienestar digital, Cumpleaños)

Pantallas: `views/FaithView.jsx`, `views/RelationView.jsx`, `views/WellbeingView.jsx`, `views/CumpleanosView.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `cumpleanos.js` | 12: MESES, RELACIONES_SUGERIDAS, MAX_NOMBRE_CUMPLE, MAX_RELACION_CUMPLE, validarCumpleanos, crearCumpleanos, editarCumpleanos, formularioDeCumpleanos, ordenarPorProximo, textoDelProximo, textoDeLaFecha, diasDelMes | test-cumpleanos.mjs |
| `helpers.js` | 6: uid, todayISO, formatFecha, diasHasta, addDays, hexToRgba | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `albumRelacion.js` | 5: fotosDelAlbum, validarFotoAlbum, TIPOS_FOTO_ALBUM, MAX_NOTA_ALBUM, BORRADO_ALBUM | test-album-relacion.mjs |
| `seleccionArchivos.js` | 1: eventoDeArchivos | test-seleccion-archivos.mjs |
| `sincronizacion.js` | 1: textoDeFalloAlGuardar | test-motion-f16.mjs, test-editar-examenes.mjs |
| `accesibilidadMotion.js` | 1: desplazarHasta | test-motion-f12.mjs, test-motion-f13.mjs, test-cumpleanos.mjs |

### Biblioteca

Pantallas: `views/LibraryView.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `colecciones.js` | 40: TIPOS_ELEMENTO, tipoElemento, ICONOS_DISPONIBLES, ACENTOS_COLECCION, ACENTO_POR_DEFECTO, ICONO_POR_DEFECTO, crearColeccion, editarColeccion, alternarFavoritaColeccion, archivarColeccion, desarchivarColeccion, contieneElemento… | test-biblioteca-global.mjs, test-colecciones.mjs, smoke-vistas.jsx |
| `documentos.js` | 26: estadoDocumento, CATEGORIAS_DOCUMENTO, MARCAS_FORMATO, aplicarMarca, crearDocumento, editarDocumento, alternarFavoritoDoc, archivarDocumento, desarchivarDocumento, guardarEnBiblioteca, volverABorrador, RETRASO_AUTOGUARDADO_MS… | test-documentos.mjs, smoke-vistas.jsx, test-biblioteca-global.mjs, test-colecciones.mjs |
| `ideas.js` | 25: ESTADOS_IDEA, estadoIdea, ESTADO_IDEA_POR_DEFECTO, PRIORIDADES_IDEA, prioridadIdea, PRIORIDAD_POR_DEFECTO, CATEGORIAS_IDEA, crearIdea, editarIdea, cambiarEstadoIdea, archivarIdea, desarchivarIdea… | smoke-vistas.jsx, test-ideas.mjs, test-biblioteca-global.mjs, test-colecciones.mjs |
| `libros.js` | 20: ESTADOS_LIBRO, estadoLibro, ESTADO_POR_DEFECTO, crearLibro, editarLibro, progresoDe, actualizarPagina, cambiarEstado, marcarTerminado, lineaResumen, libroActual, FILTROS_LIBROS… | smoke-vistas.jsx, test-libros.mjs, test-biblioteca-global.mjs, test-colecciones.mjs |
| `guardados.js` | 17: TIPOS_GUARDADO, tipoGuardado, dominioDe, faviconDe, nombreDe, crearGuardado, editarGuardado, alternarFavorito, archivar, desarchivar, FILTROS_GUARDADOS, ORDENES_GUARDADOS… | smoke-vistas.jsx, test-guardados.mjs, test-biblioteca-global.mjs, test-colecciones.mjs |
| `bibliotecaGlobal.js` | 10: CABECERA_BIBLIOTECA, tipoBiblioteca, recientes, MAX_RECIENTES, buscarEnBiblioteca, resumenDeBusqueda, LIMITE_RESULTADOS, favoritosDe, ACCIONES_RAPIDAS, totalElementos | test-biblioteca-global.mjs, test-notas.mjs |
| `biblioteca.js` | 6: MINI_APPS, miniApp, elementosDe, indicadorDe, diferenciaDe, CLASE_TARJETA | test-biblioteca.mjs, test-libros.mjs, test-ideas.mjs, test-colecciones.mjs (+5) |
| `notas.js` | 5: crearNota, editarNota, puedeGuardarNota, formularioDeNota, SIN_TITULO | test-notas.mjs |
| `motion.js` | 2: escalonado, transicion | test-motion-f1.mjs, test-motion-f10.mjs, test-motion-f14.mjs, test-motion-f16.mjs (+19) |
| `seleccionArchivos.js` | 2: eventoDeArchivos, MB | test-seleccion-archivos.mjs |
| `helpers.js` | 1: formatFecha | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `supabase.js` | 1: getSignedBibliotecaUrl | **ninguna** |
| `rendimiento.js` | 1: DEBOUNCE_BUSQUEDA_MS | test-rendimiento.mjs, test-integrales.mjs, test-biblioteca-global.mjs, test-documentos.mjs (+3) |

### Diario

Pantallas: `views/DiaryView.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `helpers.js` | 3: uid, todayISO, formatFecha | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |

### Organización (Tareas, Calendario, Horario)

Pantallas: `views/CalendarView.jsx`, `views/HorarioView.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `horarioEditor.js` | 27: PLANTILLAS_HORARIO, crearDesdePlantilla, columnasDe, filasDe, contarEnColumna, contarEnFila, anadirColumna, alternarColumna, moverColumna, anadirFila, editarFila, eliminarFila… | test-horario-editor.mjs, smoke-vistas.jsx, test-actividades.mjs, test-analitica-horario.mjs (+8) |
| `horarioEstructura.js` | 19: DENSIDADES, densidad, leerVisual, guardarVisual, cicloDe, guardarCiclo, semanaDelCiclo, gruposDe, INTERVALOS, generarFranjas, impactoRegenerarFranjas, regenerarFranjas… | test-horario-estructura.mjs, smoke-vistas.jsx, test-solapamientos-horario.mjs, test-mis-horarios.mjs |
| `estadisticasPlan.js` | 16: PERIODOS, PERIODO_POR_DEFECTO, TEXTO_SIN_DATOS, resumenPlanificacion, grafico, cumplimientoPorDia, cargaPorDiaSemana, diasMasCargados, distribucionPorTipo, distribucionHoraria, horasPlanificadas, tareasAtrasadas… | test-estadisticas-nutricion.mjs, test-estadisticas-plan.mjs |
| `actividades.js` | 11: ICONOS_ACTIVIDAD, iconoDe, fichaActividad, impactoEliminarActividad, horasYMinutos, editarActividad, alternarFavorita, archivarActividad, duplicarActividad, eliminarActividadDefinitiva, actividadesOrdenadas | test-actividades.mjs, smoke-vistas.jsx, test-automatizaciones.mjs, test-hoy.mjs (+1) |
| `calendario.js` | 9: celdasMes, eventosDelDia, resumenDelDia, expandirRecurrentes, isoDeFecha, diasDelMes, intervaloDe, describirRecurrencia, saltarOcurrencia | test-calendario.mjs, test-nutricion-dias.mjs, test-cumpleanos.mjs |
| `calendarioMes.js` | 9: nuevaTareaDeCalendario, tareasDelDia, indicadoresDelDia, resumenDeDia, cargaDelDia, marcaDeHoy, VACIO_MES, mesVacio, accesosDelDia | test-calendario-mes.mjs, test-tareas.mjs |
| `automatizaciones.js` | 9: tablonDelDia, marcarCompletada, previsualizar, ejecutar, deshacer, ejecutarTodo, historialDe, explicarAccion, puedeDeshacerse | test-automatizaciones.mjs, test-analitica-horario.mjs, smoke-vistas.jsx, test-horario-top.mjs |
| `avisosHorario.js` | 8: avisosAMandar, registrarEnviado, centroDeAvisos, marcarLeido, archivarAviso, marcarTodosLeidos, posponer, tipoAviso | test-avisos-horario.mjs, test-avisos-estilo.mjs, smoke-vistas.jsx |
| `agendaDia.js` | 7: agendaDelDia, tituloDelDia, tiraDeDias, diaAnterior, diaSiguiente, VACIO_AGENDA, tipoAgenda | test-agenda-dia.mjs |
| `mochila.js` | 7: mochilaDeFecha, progresoMochila, marcarPreparado, prepararTodo, vaciarPreparacion, anadirAMano, quitarDeMochila | test-mochila.mjs, smoke-vistas.jsx |
| `semana.js` | 6: semanaDe, semanaAnterior, semanaSiguiente, TEXTO_DIA_LIBRE, marcarInstancia, seRepite | test-semana.mjs, test-tareas.mjs |
| `planificador.js` | 6: planDeEstudio, explicarPlan, planAlternativo, compararPlanes, detectarSobrecarga, aplicarPlan | test-planificador.mjs, smoke-vistas.jsx |
| `helpers.js` | 4: uid, todayISO, addDays, hexToRgba | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `horario.js` | 4: TIPOS_HORARIO, DIAS_SEMANA, diaDeFecha, duracionMinutos | test-horario.mjs, test-horario-estructura.mjs, test-tu-plan.mjs, test-horario-datos.mjs (+14) |
| `misHorarios.js` | 4: seccionHorario, impactoEliminarHorario, eliminarDeVerdad, VACIO_HORARIOS | test-mis-horarios.mjs, test-solapamientos-horario.mjs |
| `avisosPlanificacion.js` | 3: ANTICIPACIONES, estadoPermiso, avisoPorDefecto | test-avisos-planificacion.mjs |
| `hoy.js` | 3: contextoTemporal, describirMinutos, opcionesReprogramar | test-hoy.mjs, smoke-vistas.jsx, test-solapamientos-horario.mjs |
| `horarioTop.js` | 3: exportarHorario, revisarImportacion, importarHorario | test-horario-top.mjs |
| `accionesHoyAgenda.js` | 2: tareaEnFecha, tareaEnHora | test-acciones-hoy-agenda.mjs, test-gestion-tareas.mjs, test-motion-f9.mjs, test-cumpleanos.mjs (+2) |
| `analiticaHorario.js` | 2: informe, recomendaciones | test-analitica-horario.mjs, smoke-vistas.jsx |
| `calendarioIntegracion.js` | 1: NOMBRES_ORIGEN | test-armario.mjs, test-cumpleanos.mjs, test-gustos.mjs, test-objetivos-eh.mjs (+3) |
| `notificaciones.js` | 1: notificarSiCorresponde | **ninguna** |

### Economía

Pantallas: `views/FinanceView.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `hucha.js` | 9: FRECUENCIAS_HUCHA, panelHucha, normalizarObjetivoHucha, anadirAhorro, guardarObjetivoHucha, quitarObjetivoHucha, motivoAportacion, motivoTotal, motivoObjetivo | test-hucha.mjs |
| `helpers.js` | 3: uid, formatFecha, todayISO | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |

### Negocio

Pantallas: `views/BusinessView.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `helpers.js` | 3: uid, todayISO, formatFecha | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |

### Armario

Pantallas: `views/ArmarioView.jsx`, `components/iconosPrenda.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `armario.js` | 39: CATEGORIAS_ARMARIO, COLORES_ARMARIO, ESTADOS_PRENDA, TEMPORADAS_PRENDA, prendasVisibles, marcasDe, conteoPorCategoria, ordenesDisponibles, categoriaDe, colorDe, estadoDe, ZONAS_OUTFIT… | test-accesorios.mjs, test-armario-estilo-hombre.mjs, test-armario.mjs, test-iconos-armario.jsx (+4) |
| `armarioInteligencia.js` | 13: PERIODOS_ARMARIO, desdeDelPeriodo, usosDelPeriodo, estadisticasOutfits, estadisticasPrendas, diversidadArmario, estadoRepeticion, prendasMuyRepetidas, combinacionesRepetidas, outfitsOlvidados, prendasInfrautilizadas, recomendarOutfits… | test-armario-inteligencia.mjs |
| `helpers.js` | 3: hexToRgba, todayISO, formatFecha | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `imagenes.js` | 2: optimizarImagen, urlFirmada | test-imagenes.mjs |
| `supabase.js` | 1: getSignedPrendaUrl | **ninguna** |
| `calendario.js` | 1: celdasMes | test-calendario.mjs, test-nutricion-dias.mjs, test-cumpleanos.mjs |
| `seleccionArchivos.js` | 1: MB | test-seleccion-archivos.mjs |

### Progreso (Estadísticas, Predicciones, Logros)

Pantallas: `views/NumbersView.jsx`, `views/StatsView.jsx`, `views/PredictionsView.jsx`, `views/AchievementsView.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `predicciones.js` | 6: prediccionObjetivo, prediccionAbandonoHabito, prediccionPeso, prediccionFuerza, prediccionAhorro, prediccionNotas | **ninguna** |
| `numeros.js` | 5: APPS_NUMEROS, appNumeros, panelNumeros, NOMBRE_PROGRESO, SUBTITULO_PROGRESO | test-numeros-navegacion.mjs, test-auditoria-dist.mjs |
| `correlaciones.js` | 3: correlacionSuenoEstudio, correlacionSuenoAnimo, correlacionEntrenoAnimo | test-sueno-grafica.mjs |
| `helpers.js` | 2: hexToRgba, formatFecha | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `logros.js` | 1: calcularLogros | **ninguna** |

### Ajustes y personalización

Pantallas: `views/SettingsView.jsx`, `views/PersonalizationView.jsx`, `views/PapeleraView.jsx`, `components/GestionTemas.jsx`, `components/TemaBuilder.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `fondos.js` | 21: TIPOS_FONDO, FONDOS_INCLUIDOS, seleccionarFondo, ajustarFondo, restablecerFondo, describirFondo, tieneFondoGuardado, resolverFondo, estilosDeFondo, estilosDeVelo, datosDeFoto, validarFotoFondo… | test-fondos.mjs, test-legibilidad.mjs, test-presets-apariencia.mjs |
| `presetsApariencia.js` | 10: MAX_PRESETS, crearPreset, aplicarPreset, listaPresets, presetActivo, duplicarPreset, actualizarPreset, alternarFavorito, esEditable, presetTieneFoto | test-presets-apariencia.mjs |
| `motion.js` | 6: contextoMotion, modoMotion, velocidadMotion, valorSelector, escalonado, sistemaPideReducir | test-motion-f1.mjs, test-motion-f10.mjs, test-motion-f14.mjs, test-motion-f16.mjs (+19) |
| `legibilidad.js` | 5: revisarLegibilidad, propuestasSobreFoto, correccionesDe, hayCorrecciones, resumenLegibilidad | test-legibilidad.mjs |
| `papelera.js` | 5: describirEntrada, tiempoDesde, diasRestantes, ordenarPapelera, OPCIONES_RETENCION | test-papelera.mjs, smoke-vistas.jsx, test-integrales.mjs, test-rutinas-barba.mjs (+34) |
| `helpers.js` | 4: calcularEdad, shade, hexToRgba, uid | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `fotoPerfil.js` | 4: prepararFotoPerfil, esFotoValida, nombreParaSaludo, TIPOS_ACEPTADOS | test-foto-perfil.mjs |
| `sonidoProduccion.js` | 4: CONTROLES, MARCAS_VOLUMEN, ejemploDe, normalizarAudio | test-sonido-produccion.mjs, test-motion-f12.mjs, test-audio.mjs |
| `detectorColores.js` | 4: analizarImagen, analisisValidoPara, sellarAnalisis, describirColor | test-detector-colores.mjs |
| `calendariosExternos.js` | 3: PROVEEDORES, leerICS, planDeImportacion | test-calendarios-externos.mjs |
| `audioEngine.js` | 3: reproducir, diagnosticoAudio, soporteVibracion | test-audio.mjs |
| `temaColores.js` | 3: normalizarTema, restablecerColores, tieneColoresPersonalizados | test-tema-colores.mjs |
| `recomendadorApariencia.js` | 3: generarPropuestas, aplicarPropuesta, guardarApariencia | test-recomendador-apariencia.mjs |
| `notificaciones.js` | 2: permisoNotificaciones, pedirPermisoNotificaciones | **ninguna** |
| `biometria.js` | 2: biometriaSoportada, registrarBiometria | **ninguna** |
| `avisosPlanificacion.js` | 1: CAPACIDADES | test-avisos-planificacion.mjs |
| `version.js` | 1: sello | **ninguna** |
| `eventos.js` | 1: suscribir | test-audio.mjs |
| `imagenes.js` | 1: optimizarImagen | test-imagenes.mjs |
| `profundidad.js` | 1: desenfoque | test-motion-f6.mjs |
| `seleccionArchivos.js` | 1: eventoDeArchivos | test-seleccion-archivos.mjs |
| `agrupadores.js` | 1: APPS_DE_AGRUPADORES | test-cumpleanos.mjs, test-auditoria-dist.mjs, comprobar-navegacion.mjs, test-numeros-navegacion.mjs |
| `colorEngine.js` | 1: PASOS_ESCALA | test-recomendador-apariencia.mjs, test-acabado-fitness.mjs, test-legibilidad.mjs, test-tema-colores.mjs |

### Transversal (App, buscador, IA)

Pantallas: `App.jsx`, `components/ui.jsx`

| Librería | Nombres usados | Pruebas que la importan (todas en verificar.sh salvo marca) |
|---|---|---|
| `supabase.js` | 19: getSession, onAuthChange, onAuthEvent, sendPasswordReset, loadData, saveData, signOut, uploadProgressPhoto, deleteProgressPhoto, uploadBibliotecaArchivo, deleteBibliotecaArchivo, uploadPrendaFoto… | **ninguna** |
| `armario.js` | 8: DEFAULT_ARMARIO, crearPrenda, actualizarPrenda, crearOutfit, actualizarOutfit, duplicarOutfit, crearUso, actualizarUso | test-accesorios.mjs, test-armario-estilo-hombre.mjs, test-armario.mjs, test-iconos-armario.jsx (+4) |
| `helpers.js` | 7: uid, todayISO, addDays, hexToRgba, fechaLocalISO, shade, fileToBase64 | test-sueno.mjs, test-robustez-fitness.mjs, test-armario.mjs, test-detalle-muscular.mjs (+23) |
| `rachasServicio.js` | 7: ESTADO_INICIAL, normalizarEstado, panelRachas, crearRacha, completarDia, deshacerDia, eliminarRacha | test-rachas-gamificacion.mjs, test-rachas-servicio.mjs, smoke-vistas.jsx |
| `navegacion.js` | 7: RAIZ, tabDe, origen, abrir, irAPrincipal, atras, puedeVolver | test-navegacion.mjs, test-motion-f2.mjs |
| `transicionNavegacion.js` | 6: tipoDeNavegacion, claseDeNavegacion, claveDeScroll, indiceDePestana, estiloDelIndicador, ultimoDePila | test-motion-f2.mjs, test-motion-f7.mjs |
| `sincronizacion.js` | 6: empezarSesionDeDatos, usuarioDeLaSesion, clavesSinCargar, consumirSalidaPedida, resumenSincronizacion, resultadoDeGuardados | test-motion-f16.mjs, test-editar-examenes.mjs |
| `perfumes.js` | 6: quitarPorProbarConPapelera, restaurarPorProbar, eliminarPerfume, restaurarPerfume, eliminarUso, restaurarUso | test-perfumes.mjs, test-recomendaciones-perfumes.mjs, test-accesorios.mjs, smoke-vistas.jsx (+11) |
| `sonrisa.js` | 6: eliminarRutinaSonrisa, restaurarRutinaSonrisa, eliminarRevision, restaurarRevision, eliminarRegistroSonrisa, restaurarRegistroSonrisa | test-sonrisa.mjs, smoke-vistas.jsx |
| `albumRelacion.js` | 5: normalizarRelacion, anadirFotoAlAlbum, quitarFotoDelAlbum, pathDeFoto, crearFotoAlbum | test-album-relacion.mjs |
| `fondos.js` | 5: normalizarFondo, resolverFondo, estilosDeFondo, estilosDeVelo, estilosDeLuminosidad | test-fondos.mjs, test-legibilidad.mjs, test-presets-apariencia.mjs |
| `audioEngine.js` | 5: iniciarAudio, conectarAlBus, conectarLosToques, actualizarPreferencias, detener | test-audio.mjs |
| `papelera.js` | 5: DEFAULT_PAPELERA, purgarCaducados, prepararEliminacion, prepararRestauracion, conArrastrados | test-papelera.mjs, smoke-vistas.jsx, test-integrales.mjs, test-rutinas-barba.mjs (+34) |
| `motion.js` | 5: atributoMotion, velocidadMotion, avisarCambioDeMotion, contextoDelDocumento, transicion | test-motion-f1.mjs, test-motion-f10.mjs, test-motion-f14.mjs, test-motion-f16.mjs (+19) |
| `hucha.js` | 4: normalizarEconomiaHucha, eurosDelTotal, centimosGuardados, economiaPermitida | test-hucha.mjs |
| `centroDelDia.js` | 4: anadirApunte, resumenDelDia, progresoDelDia, apuntesDe | test-centro-dia.mjs, test-tareas.mjs |
| `rachasGamificacion.js` | 4: GAMIFICACION_INICIAL, normalizarGamificacion, evaluar, olvidarRacha | test-rachas-gamificacion.mjs, smoke-vistas.jsx, test-audio.mjs |
| `rutinasBarba.js` | 4: eliminarRegistroBarba, restaurarRegistroBarba, eliminarRutinaConPapelera, restaurarRutinaBarba | smoke-vistas.jsx, test-rutinas-barba.mjs |
| `accesorios.js` | 4: eliminarAccesorio, restaurarAccesorio, eliminarDeseoAccesorio, restaurarDeseoAccesorio | test-accesorios.mjs, test-integracion-estilo.mjs, test-rendimiento.mjs, smoke-vistas.jsx (+1) |
| `tareas.js` | 3: completarTarea, normalizarTareasDe, planConcentrarse | test-tareas.mjs, test-metas-objetivos.mjs, smoke-vistas.jsx, test-integracion-pr.mjs (+1) |
| `cumpleanos.js` | 3: DEFAULT_CUMPLEANOS, normalizarCumpleanos, cumpleanosActivo | test-cumpleanos.mjs |
| `fotosProgreso.js` | 3: crearFotoProgreso, normalizarFotosProgreso, editarFotoProgreso | test-arquitectura-fitness.mjs, test-fotos-progreso.mjs, test-comparador-fotos.mjs, test-auditoria-fitness.mjs (+6) |
| `audio.js` | 3: DEFAULT_AUDIO, normalizarAudio, migrarSonidoEncendido | test-audio.mjs, test-sonido-produccion.mjs, test-audio-eventos.mjs, test-entrenamiento-ux.mjs (+2) |
| `pomodoro.js` | 3: contadorDesdeSesiones, normalizarConfig, iniciarSesion | test-pomodoro.mjs, smoke-vistas.jsx, test-tareas.mjs |
| `agrupadores.js` | 3: agrupador, appProtegida, agrupadorDeApp | test-cumpleanos.mjs, test-auditoria-dist.mjs, comprobar-navegacion.mjs, test-numeros-navegacion.mjs |
| `indiceBusqueda.js` | 3: construirIndice, resolverConsulta, sugerenciasIniciales | test-buscador.mjs, comprobar-navegacion.mjs, test-productividad-launcher.mjs, test-renombrado-estilo.mjs (+1) |
| `manosPies.js` | 3: eliminarRutinaMP, eliminarRegistroMP, restaurarEnMP | test-manos-pies.mjs |
| `ai.js` | 3: askAI, askAIWithImage, AI_SYSTEM | test-disponibilidad-ia.mjs |
| `disponibilidadIA.js` | 3: TEXTOS_PROXIMAMENTE, estadoDeErrorIA, registrarErrorIA | test-disponibilidad-ia.mjs |
| `misAlimentos.js` | 2: normalizarMisAlimentosDe, alternarFavoritoAlimento | test-mis-alimentos.mjs |
| `usosAsignatura.js` | 2: limpiarHorarioDeAsignatura, desligarPrograma | test-usos-asignatura.mjs |
| `metasObjetivos.js` | 2: normalizarObjetivosDe, normalizarMetasDe | test-metas-objetivos.mjs, smoke-vistas.jsx, test-integracion-pr.mjs |
| `exportData.js` | 2: exportCSV, exportXLSX | test-persistencia-fitness.mjs |
| `pin.js` | 2: crearPinHash, verificarPin | **ninguna** |
| `persistenciaFitness.js` | 2: migrarFitness, apartarLoQueNoCarga | test-persistencia-fitness.mjs, test-feedback-fitness.mjs |
| `imagenes.js` | 2: urlFirmada, urlEnCache | test-imagenes.mjs |
| `rachas.js` | 2: resumenHabito, enRiesgo | test-rachas.mjs, test-habitos.mjs, test-rachas-hoy.mjs, test-rachas-gamificacion.mjs (+1) |
| `estadosAsincronos.js` | 2: arranqueSinDatos, motivoDeSalida | test-motion-f16.mjs, test-motion-f19.mjs, test-cumpleanos.mjs, test-editar-examenes.mjs |
| `horario.js` | 2: DEFAULT_HORARIO_TOP, normalizarHorarioTop | test-horario.mjs, test-horario-estructura.mjs, test-tu-plan.mjs, test-horario-datos.mjs (+14) |
| `estiloDeHombre.js` | 2: DEFAULT_ESTILO_HOMBRE, normalizarEstiloHombre | test-renombrado-estilo.mjs, test-escalabilidad.mjs, test-gestion-modulos.mjs, test-pantalla-eh.mjs (+54) |
| `seguimientoPiel.js` | 2: eliminarRegistroPiel, restaurarRegistroPiel | smoke-vistas.jsx, test-seguimiento-piel.mjs, test-recomendaciones-piel.mjs |
| `rutinasCuerpo.js` | 2: eliminarRutinaCuerpo, restaurarRutinaCuerpo | test-rutinas-cuerpo.mjs, test-integrales.mjs |
| `rutinasPiel.js` | 2: eliminarRutinaPielConPapelera, restaurarRutinaPiel | test-productos-piel.mjs, test-rutinas-piel.mjs, smoke-vistas.jsx, test-recomendaciones-piel.mjs (+2) |
| `rutinasPelo.js` | 2: eliminarRutinaConPapeleraPelo, restaurarRutinaPelo | test-rutinas-pelo.mjs, test-rutinas-piel.mjs, smoke-vistas.jsx, test-peluqueria.mjs (+3) |
| `gustos.js` | 2: eliminarGusto, restaurarGusto | test-gustos.mjs, test-objetivos-eh.mjs, test-estados-estilo.mjs, test-estructura-datos.mjs (+7) |
| `profundidad.js` | 2: desenfoque, sombra | test-motion-f6.mjs |
| `estadosInteraccion.js` | 2: estadoDeBoton, TEXTOS_ESTADO_BOTON | test-motion-f9.mjs, test-motion-f16.mjs, test-motion-f18.mjs |
| `seleccionArchivos.js` | 2: eventoDeArchivos, ACEPTA_IMAGEN_O_PDF | test-seleccion-archivos.mjs |
| `sueno.js` | 1: normalizarSueno | test-sueno.mjs, test-robustez-fitness.mjs, test-sueno-grafica.mjs |
| `nutricion.js` | 1: normalizarNutricionDe | test-estadisticas-nutricion.mjs, test-gestion-tareas.mjs, test-nutricion.mjs, test-alimentos.mjs (+4) |
| `objetivosNutricion.js` | 1: normalizarNutricionObjetivos | test-objetivos-nutricion.mjs, test-estadisticas-nutricion.mjs |
| `alimentos.js` | 1: normalizarNutricionF4 | test-alimentos.mjs, test-mis-alimentos.mjs |
| `estudiosApps.js` | 1: normalizarAppsDe | test-estudios-apps.mjs, test-apps-aprendizaje.mjs, test-asignaturas.mjs, test-cierre-estudios.mjs (+1) |
| `asignaturas.js` | 1: normalizarAsignaturasDe | test-asignaturas.mjs, test-asignaturas-compartidas.mjs, test-cierre-estudios.mjs, test-usos-asignatura.mjs (+1) |
| `fechasAcademicas.js` | 1: normalizarFechasDe | test-fechas-academicas.mjs, test-editar-examenes.mjs, test-cierre-estudios.mjs |
| `rutinas.js` | 1: normalizarRutinasDe | test-rutinas.mjs, smoke-vistas.jsx, test-integracion-pr.mjs |
| `calendarioMes.js` | 1: nuevaTareaDeCalendario | test-calendario-mes.mjs, test-tareas.mjs |
| `accionesHoyAgenda.js` | 1: eventoDesdeQuickAdd | test-acciones-hoy-agenda.mjs, test-gestion-tareas.mjs, test-motion-f9.mjs, test-cumpleanos.mjs (+2) |
| `pulidoHC.js` | 1: esqueleto | test-pulido-hc.mjs, test-feedback-fitness.mjs, test-motion-f0.mjs, test-motion-f1.mjs (+1) |
| `fotoPerfil.js` | 1: normalizarPerfilFoto | test-foto-perfil.mjs |
| `pdfText.js` | 1: extractPdfText | **ninguna** |
| `predicciones.js` | 1: prediccionObjetivo | **ninguna** |
| `biometria.js` | 1: verificarBiometria | **ninguna** |
| `resumenesHub.js` | 1: calcularResumenModulo | smoke-vistas.jsx, test-inicio.jsx, test-modulos.jsx, test-numeros-navegacion.mjs (+1) |
| `fitness.js` | 1: DEFAULT_FITNESS | test-arquitectura-fitness.mjs, test-fitness.mjs, test-cola-clasificacion.mjs, test-detalle-muscular.mjs (+38) |
| `entrenamiento.js` | 1: normalizarFitnessConSesiones | test-arquitectura-fitness.mjs, test-entrenamiento.mjs, smoke-vistas.jsx, test-actividad-entrenamiento.mjs (+36) |
| `calendarioIntegracion.js` | 1: eventosDerivados | test-armario.mjs, test-cumpleanos.mjs, test-gustos.mjs, test-objetivos-eh.mjs (+3) |
| `eventos.js` | 1: emitir | test-audio.mjs |
| `continuidad.js` | 1: hayOrigen | test-motion-f7.mjs, test-motion-f13.mjs |
| `biblioteca.js` | 1: normalizarBiblioteca | test-biblioteca.mjs, test-libros.mjs, test-ideas.mjs, test-colecciones.mjs (+5) |
| `ideas.js` | 1: convertirIdea | smoke-vistas.jsx, test-ideas.mjs, test-biblioteca-global.mjs, test-colecciones.mjs |
| `migracion.js` | 1: migrarEstiloHombre | test-migracion.mjs, test-produccion.mjs, test-recuperacion.mjs, test-documentacion-eh.mjs (+2) |
| `integracionEstilo.js` | 1: aplicarTarea | test-integracion-estilo.mjs, smoke-vistas.jsx |
