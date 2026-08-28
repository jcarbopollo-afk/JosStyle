#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Verificación automática de JosStyle.
#
# Comprueba dos cosas distintas:
#   1. Que el proyecto COMPILA (vite build) y que la función serverless es
#      sintácticamente válida.
#   2. Que no se ha roto ninguna de las REGLAS INVARIANTES del proyecto
#      (docs/01_ESPECIFICACION_MAESTRA.md §11), que hasta ahora solo se
#      comprobaban a mano fase a fase.
#
# Uso:  bash scripts/verificar.sh
# Sale con código 1 si algo falla, para poder encadenarlo en un hook o CI.
# ---------------------------------------------------------------------------
set -uo pipefail
cd "$(dirname "$0")/.."

FALLOS=0
ok ()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fallo() { printf '  \033[31m✗\033[0m %s\n' "$1"; FALLOS=$((FALLOS+1)); }
aviso() { printf '  \033[33m!\033[0m %s\n' "$1"; }

echo ""
echo "═══ 1. COMPILACIÓN ═══"

if [ ! -d node_modules ]; then
  aviso "node_modules no existe — ejecuta 'npm install' primero"
  exit 1
fi

if npm run build >/tmp/jc_build.log 2>&1; then
  ok "vite build sin errores ($(grep -o '✓ [0-9]* modules transformed' /tmp/jc_build.log | head -1))"
else
  fallo "vite build FALLA — ver /tmp/jc_build.log"
  tail -25 /tmp/jc_build.log
fi

if node --input-type=module -e "$(cat api/ask-ai.js)" 2>/tmp/jc_api.log; then
  ok "api/ask-ai.js sintácticamente válido"
else
  fallo "api/ask-ai.js tiene un error de sintaxis"; cat /tmp/jc_api.log
fi

echo ""
echo "═══ 2. PRUEBAS ═══"

if node --import ./scripts/resolver-vite.mjs scripts/test-puntuacion.mjs >/tmp/jc_test.log 2>&1; then
  ok "puntuacion.js — $(grep -c '✓' /tmp/jc_test.log) comprobaciones"
else
  fallo "Fallan pruebas de puntuacion.js"; grep '✗' /tmp/jc_test.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-personalizacion.mjs >/tmp/jc_pers.log 2>&1; then
  ok "Personalización (ME F2) — $(grep -c '✓' /tmp/jc_pers.log) comprobaciones"
else
  fallo "Fallan pruebas de personalización"; grep '✗' /tmp/jc_pers.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-papelera.mjs >/tmp/jc_pap.log 2>&1; then
  ok "Papelera (ME F3) — $(grep -c '✓' /tmp/jc_pap.log) comprobaciones"
else
  fallo "Fallan pruebas de la papelera"; grep '✗' /tmp/jc_pap.log
fi

if node scripts/smoke.mjs test-modulos.jsx >/tmp/jc_mod.log 2>&1; then
  ok "Módulos activables (ME F1) — $(grep -c '✓' /tmp/jc_mod.log) comprobaciones"
else
  fallo "Fallan pruebas del sistema de módulos"; grep '✗' /tmp/jc_mod.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-buscador.mjs >/tmp/jc_busc.log 2>&1; then
  ok "Buscador, motor e intención (BI F2-F4) — $(grep -c '✓' /tmp/jc_busc.log) comprobaciones"
else
  fallo "Fallan pruebas del buscador de funciones"; grep '✗' /tmp/jc_busc.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-armario.mjs >/tmp/jc_arm.log 2>&1; then
  ok "Armario, outfits e historial (AR F1-F3) — $(grep -c '✓' /tmp/jc_arm.log) comprobaciones"
else
  fallo "Fallan pruebas del armario"; grep '✗' /tmp/jc_arm.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-armario-inteligencia.mjs >/tmp/jc_arm4.log 2>&1; then
  ok "Estadísticas y recomendaciones (AR F4) — $(grep -c '✓' /tmp/jc_arm4.log) comprobaciones"
else
  fallo "Fallan pruebas de la inteligencia del armario"; grep '✗' /tmp/jc_arm4.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-fondos.mjs >/tmp/jc_fondos.log 2>&1; then
  ok "Fondos, fotografía y editor (FO F1-F3) — $(grep -c '✓' /tmp/jc_fondos.log) comprobaciones"
else
  fallo "Fallan pruebas del sistema de fondos"; grep '✗' /tmp/jc_fondos.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-tema-colores.mjs >/tmp/jc_tema.log 2>&1; then
  ok "Colores y personalización manual (FO F4+F7) — $(grep -c '✓' /tmp/jc_tema.log) comprobaciones"
else
  fallo "Fallan pruebas del sistema de colores"; grep '✗' /tmp/jc_tema.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-detector-colores.mjs >/tmp/jc_det.log 2>&1; then
  ok "Detector de colores (FO F5) — $(grep -c '✓' /tmp/jc_det.log) comprobaciones"
else
  fallo "Fallan pruebas del detector de colores"; grep '✗' /tmp/jc_det.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-recomendador-apariencia.mjs >/tmp/jc_reco.log 2>&1; then
  ok "Sistema Recomendado (FO F6) — $(grep -c '✓' /tmp/jc_reco.log) comprobaciones"
else
  fallo "Fallan pruebas del recomendador de apariencia"; grep '✗' /tmp/jc_reco.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-presets-apariencia.mjs >/tmp/jc_pre.log 2>&1; then
  ok "Presets de apariencia (FO F8) — $(grep -c '✓' /tmp/jc_pre.log) comprobaciones"
else
  fallo "Fallan pruebas de los presets"; grep '✗' /tmp/jc_pre.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-legibilidad.mjs >/tmp/jc_leg.log 2>&1; then
  ok "Legibilidad y contraste (FO F9) — $(grep -c '✓' /tmp/jc_leg.log) comprobaciones"
else
  fallo "Fallan pruebas de legibilidad"; grep '✗' /tmp/jc_leg.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-imagenes.mjs >/tmp/jc_img.log 2>&1; then
  ok "Optimización de imágenes (FO F11) — $(grep -c '✓' /tmp/jc_img.log) comprobaciones"
else
  fallo "Fallan pruebas de optimización de imágenes"; grep '✗' /tmp/jc_img.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-rachas.mjs >/tmp/jc_rachas.log 2>&1; then
  ok "Motor de rachas (RA F1) — $(grep -c '✓' /tmp/jc_rachas.log) comprobaciones"
else
  fallo "Falla el motor de rachas"; grep '✗' /tmp/jc_rachas.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-rachas-servicio.mjs >/tmp/jc_rachas2.log 2>&1; then
  ok "Persistencia y servicio de rachas (RA F2) — $(grep -c '✓' /tmp/jc_rachas2.log) comprobaciones"
else
  fallo "Falla la capa persistente de rachas"; grep '✗' /tmp/jc_rachas2.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-rachas-gamificacion.mjs >/tmp/jc_rachas3.log 2>&1; then
  ok "Gamificación de rachas (RA F3) — $(grep -c '✓' /tmp/jc_rachas3.log) comprobaciones"
else
  fallo "Falla la gamificación de rachas"; grep '✗' /tmp/jc_rachas3.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-horario.mjs >/tmp/jc_horario.log 2>&1; then
  ok "Arquitectura de Horario Top (HT F1) — $(grep -c '✓' /tmp/jc_horario.log) comprobaciones"
else
  fallo "Falla la arquitectura de Horario Top"; grep '✗' /tmp/jc_horario.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-horario-datos.mjs >/tmp/jc_horario2.log 2>&1; then
  ok "Modelo de datos de Horario Top (HT F2) — $(grep -c '✓' /tmp/jc_horario2.log) comprobaciones"
else
  fallo "Falla el modelo de datos de Horario Top"; grep '✗' /tmp/jc_horario2.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-audio.mjs >/tmp/jc_audio.log 2>&1; then
  ok "Sistema global de sonido (SO F1) — $(grep -c '✓' /tmp/jc_audio.log) comprobaciones"
else
  fallo "Falla el sistema global de sonido"; grep '✗' /tmp/jc_audio.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-audio-eventos.mjs >/tmp/jc_audio3.log 2>&1; then
  ok "Catálogo de eventos y jerarquía (SO F3) — $(grep -c '✓' /tmp/jc_audio3.log) comprobaciones"
else
  fallo "Falla el catálogo de eventos de sonido"; grep '✗' /tmp/jc_audio3.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-especificacion-sonidos.mjs >/tmp/jc_audio4.log 2>&1; then
  ok "Biblioteca sonora definida (SO F4) — $(grep -c '✓' /tmp/jc_audio4.log) comprobaciones"
else
  fallo "Falla la especificación de sonidos"; grep '✗' /tmp/jc_audio4.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-estilo-hombre.mjs >/tmp/jc_eh1.log 2>&1; then
  ok "Arquitectura de Estilo de Hombre (EH F1) — $(grep -c '✓' /tmp/jc_eh1.log) comprobaciones"
else
  fallo "Falla la arquitectura de Estilo de Hombre"; grep '✗' /tmp/jc_eh1.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-gestion-modulos.mjs >/tmp/jc_eh2.log 2>&1; then
  ok "Gestión y personalización de módulos (EH F2) — $(grep -c '✓' /tmp/jc_eh2.log) comprobaciones"
else
  fallo "Falla la gestión de módulos de Estilo de Hombre"; grep '✗' /tmp/jc_eh2.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-configuracion-inicial.mjs >/tmp/jc_eh3.log 2>&1; then
  ok "Primera configuración y perfil (EH F3) — $(grep -c '✓' /tmp/jc_eh3.log) comprobaciones"
else
  fallo "Falla la primera configuración de Estilo de Hombre"; grep '✗' /tmp/jc_eh3.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-datos-estilo-hombre.mjs >/tmp/jc_eh4.log 2>&1; then
  ok "Capa de datos compartidos (EH F4) — $(grep -c '✓' /tmp/jc_eh4.log) comprobaciones"
else
  fallo "Falla la capa de datos de Estilo de Hombre"; grep '✗' /tmp/jc_eh4.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-armario-estilo-hombre.mjs >/tmp/jc_eh5.log 2>&1; then
  ok "Armario integrado en Estilo de Hombre (EH F5) — $(grep -c '✓' /tmp/jc_eh5.log) comprobaciones"
else
  fallo "Falla la integración del armario en Estilo de Hombre"; grep '✗' /tmp/jc_eh5.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-perfil-estilo.mjs >/tmp/jc_eh6.log 2>&1; then
  ok "Perfil de estilo y preferencias (EH F6) — $(grep -c '✓' /tmp/jc_eh6.log) comprobaciones"
else
  fallo "Falla el perfil de estilo"; grep '✗' /tmp/jc_eh6.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-perfil-capilar.mjs >/tmp/jc_eh7.log 2>&1; then
  ok "Perfil capilar y motor de cuestionarios (EH F7) — $(grep -c '✓' /tmp/jc_eh7.log) comprobaciones"
else
  fallo "Falla el perfil capilar"; grep '✗' /tmp/jc_eh7.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-rutinas-pelo.mjs >/tmp/jc_eh8.log 2>&1; then
  ok "Rutinas y seguimiento de pelo (EH F8) — $(grep -c '✓' /tmp/jc_eh8.log) comprobaciones"
else
  fallo "Fallan las rutinas de pelo"; grep '✗' /tmp/jc_eh8.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-recomendaciones-pelo.mjs >/tmp/jc_eh9.log 2>&1; then
  ok "Recomendaciones capilares sin IA (EH F9) — $(grep -c '✓' /tmp/jc_eh9.log) comprobaciones"
else
  fallo "Fallan las recomendaciones de pelo"; grep '✗' /tmp/jc_eh9.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-productos-pelo.mjs >/tmp/jc_eh10.log 2>&1; then
  ok "Productos capilares y packs (EH F10) — $(grep -c '✓' /tmp/jc_eh10.log) comprobaciones"
else
  fallo "Fallan los productos capilares"; grep '✗' /tmp/jc_eh10.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-peluqueria.mjs >/tmp/jc_eh11.log 2>&1; then
  ok "Peluquería: calendario y cortes (EH F11) — $(grep -c '✓' /tmp/jc_eh11.log) comprobaciones"
else
  fallo "Falla la peluquería"; grep '✗' /tmp/jc_eh11.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-cortes-pelo.mjs >/tmp/jc_eh12.log 2>&1; then
  ok "Cortes, preferencias y recomendaciones (EH F12) — $(grep -c '✓' /tmp/jc_eh12.log) comprobaciones"
else
  fallo "Fallan los cortes de pelo"; grep '✗' /tmp/jc_eh12.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-perfil-piel.mjs >/tmp/jc_eh13.log 2>&1; then
  ok "Skincare: perfil de piel (EH F13) — $(grep -c '✓' /tmp/jc_eh13.log) comprobaciones"
else
  fallo "Falla el perfil de piel"; grep '✗' /tmp/jc_eh13.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-rutinas-piel.mjs >/tmp/jc_eh14.log 2>&1; then
  ok "Rutinas de skincare y motor común (EH F14) — $(grep -c '✓' /tmp/jc_eh14.log) comprobaciones"
else
  fallo "Fallan las rutinas de piel"; grep '✗' /tmp/jc_eh14.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-seguimiento-piel.mjs >/tmp/jc_eh15.log 2>&1; then
  ok "Seguimiento y evolución de la piel (EH F15) — $(grep -c '✓' /tmp/jc_eh15.log) comprobaciones"
else
  fallo "Falla el seguimiento de la piel"; grep '✗' /tmp/jc_eh15.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-recomendaciones-piel.mjs >/tmp/jc_eh16.log 2>&1; then
  ok "Recomendaciones de skincare sin IA (EH F16) — $(grep -c '✓' /tmp/jc_eh16.log) comprobaciones"
else
  fallo "Fallan las recomendaciones de piel"; grep '✗' /tmp/jc_eh16.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-productos-piel.mjs >/tmp/jc_eh17.log 2>&1; then
  ok "Productos, farmacia, Amazon y packs de skincare (EH F17) — $(grep -c '✓' /tmp/jc_eh17.log) comprobaciones"
else
  fallo "Fallan los productos de piel"; grep '✗' /tmp/jc_eh17.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-horario-editor.mjs >/tmp/jc_horario3.log 2>&1; then
  ok "Editor visual de horarios (HT F3) — $(grep -c '✓' /tmp/jc_horario3.log) comprobaciones"
else
  fallo "Falla el editor visual de horarios"; grep '✗' /tmp/jc_horario3.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-horario-estructura.mjs >/tmp/jc_horario4.log 2>&1; then
  ok "Configuración avanzada del horario (HT F4) — $(grep -c '✓' /tmp/jc_horario4.log) comprobaciones"
else
  fallo "Falla la configuración avanzada del horario"; grep '✗' /tmp/jc_horario4.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-actividades.mjs >/tmp/jc_horario5.log 2>&1; then
  ok "Actividades como entidades (HT F5) — $(grep -c '✓' /tmp/jc_horario5.log) comprobaciones"
else
  fallo "Falla el sistema de actividades"; grep '✗' /tmp/jc_horario5.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-hoy.mjs >/tmp/jc_horario6.log 2>&1; then
  ok "Motor de contexto temporal y HOY (HT F6) — $(grep -c '✓' /tmp/jc_horario6.log) comprobaciones"
else
  fallo "Falla el motor de contexto temporal"; grep '✗' /tmp/jc_horario6.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-mochila.mjs >/tmp/jc_horario7.log 2>&1; then
  ok "Mochila inteligente (HT F7) — $(grep -c '✓' /tmp/jc_horario7.log) comprobaciones"
else
  fallo "Falla la mochila inteligente"; grep '✗' /tmp/jc_horario7.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-automatizaciones.mjs >/tmp/jc_horario8.log 2>&1; then
  ok "Motor temporal y automatizaciones (HT F8) — $(grep -c '✓' /tmp/jc_horario8.log) comprobaciones"
else
  fallo "Falla el motor temporal"; grep '✗' /tmp/jc_horario8.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-planificador.mjs >/tmp/jc_horario9.log 2>&1; then
  ok "Planificador e IA del horario (HT F9) — $(grep -c '✓' /tmp/jc_horario9.log) comprobaciones"
else
  fallo "Falla el planificador"; grep '✗' /tmp/jc_horario9.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-avisos-horario.mjs >/tmp/jc_horario10.log 2>&1; then
  ok "Motor de avisos del horario (HT F10) — $(grep -c '✓' /tmp/jc_horario10.log) comprobaciones"
else
  fallo "Falla el motor de avisos"; grep '✗' /tmp/jc_horario10.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-analitica-horario.mjs >/tmp/jc_horario11.log 2>&1; then
  ok "Analítica personal del horario (HT F11) — $(grep -c '✓' /tmp/jc_horario11.log) comprobaciones"
else
  fallo "Falla la analítica del horario"; grep '✗' /tmp/jc_horario11.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-horario-top.mjs >/tmp/jc_horario12.log 2>&1; then
  ok "Cierre y auditoría de Horario Top (HT F12) — $(grep -c '✓' /tmp/jc_horario12.log) comprobaciones"
else
  fallo "Falla el cierre de Horario Top"; grep '✗' /tmp/jc_horario12.log
fi

if node scripts/smoke.mjs test-inicio.jsx >/tmp/jc_inicio.log 2>&1; then
  ok "Desplegable de Inicio (BI F1) — $(grep -c '✓' /tmp/jc_inicio.log) comprobaciones"
else
  fallo "Falla el desplegable de situación de Inicio"; grep '✗' /tmp/jc_inicio.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/auditar-modulos.mjs >/tmp/jc_aud.log 2>&1; then
  ok "Auditoría de integración (ME F4) — $(grep -c '✓' /tmp/jc_aud.log) comprobaciones"
else
  fallo "La auditoría de integración encuentra huecos"; grep '✗' /tmp/jc_aud.log
fi

if node scripts/smoke.mjs >/tmp/jc_smoke.log 2>&1; then
  ok "Renderizado de vistas — $(grep -c '✓' /tmp/jc_smoke.log) casos (vacío / con datos / parciales)"
else
  fallo "Alguna vista falla al renderizar"; grep '✗' /tmp/jc_smoke.log
fi

echo ""
echo "═══ 3. REGLAS INVARIANTES ═══"

# --- Regla 2: COLORS es un singleton mutable; desestructurarlo rompe el tema ---
if grep -rEn 'const[[:space:]]*\{[^}]*\}[[:space:]]*=[[:space:]]*COLORS' src/ >/tmp/jc_r2.log 2>&1; then
  fallo "Alguien desestructura COLORS (rompe el sistema de temas):"; cat /tmp/jc_r2.log
else
  ok "Nadie desestructura COLORS"
fi

# --- Regla 10 (SO F1): el audio SOLO se toca en audioEngine.js ---
# El apartado 3 de la especificación de Sonido lo dice literalmente: "Queda
# prohibido crear lógica como `new Audio(...)` repartida por la aplicación...
# Todo debe pasar por un servicio central". Sin esta regla, el primer botón que
# quiera sonar se traerá su propio `new Audio()` y el motor dejará de ser central:
# el volumen por categoría, el cooldown y las colisiones no se le aplicarían.
# Se miran LÍNEAS DE CÓDIGO, no comentarios: `audio.js` explica en su cabecera
# que el motor es el único que puede tocar un AudioContext, y esa frase no es
# una violación de la regla. Un `new Audio()` de verdad sí lo sería.
if grep -rEn 'new Audio\(|AudioContext|webkitAudioContext' src/ --include=*.js --include=*.jsx \
   | grep -v 'src/lib/audioEngine.js' \
   | grep -vE ':[[:space:]]*(//|\*|/\*)' >/tmp/jc_r10.log 2>&1; then
  fallo "Alguien toca el audio fuera de audioEngine.js:"; cat /tmp/jc_r10.log
else
  ok "El audio solo se toca en audioEngine.js"
fi

# --- Regla 3: ningún color hexadecimal suelto fuera de tokens.js ---
# Exclusiones, todas documentadas y justificadas (ver docs/01 §11 y CHANGELOG v1.11.0):
#   · tokens.js      — es la definición del sistema de tokens
#   · colorEngine.js — es el motor de color; sus candidatos de texto SON el sistema
#   · #EDEFF2        — icono de borrar foto sobre un scrim oscuro fijo, intencionado
#   · armario.js      — el color de una PRENDA no es un color de interfaz: una camiseta
#                       negra es negra en tema claro y en tema oscuro, así que no puede
#                       salir del sistema de temas. Es un dato de la prenda, como su talla,
#                       y solo se usa para pintar su muestra cuando no hay fotografía.
#                       La exclusión es del archivo entero a propósito: si mañana hace falta
#                       un color nuevo, tiene que poder añadirse ahí y en ningún otro sitio.
#   · horarioEditor.js — MISMO CASO que armario.js: el color de una ASIGNATURA es un
#                       dato suyo, como su profesor o su aula, no un color de interfaz.
#                       Matemáticas es azul en tema claro y en tema oscuro; si saliera del
#                       sistema de temas cambiaría al cambiar el tema y dejaría de
#                       identificar la asignatura. Se usa tintado al 16 % detrás del texto
#                       del tema, así que la legibilidad la sigue dando `COLORS`.
#   · líneas de comentario — mencionar un hex al explicar una decisión no es usarlo
HEX=$(grep -rEn "#[0-9A-Fa-f]{6}" src/ --include=*.jsx --include=*.js \
      | grep -v '^src/tokens.js:' \
      | grep -v '^src/lib/colorEngine.js:' \
      | grep -v '^src/lib/armario.js:' \
      | grep -v '^src/lib/horarioEditor.js:' \
      | grep -v '#EDEFF2' \
      | grep -vE ':[0-9]+:[[:space:]]*(//|\*|/\*)' \
      || true)
if [ -n "$HEX" ]; then
  fallo "Colores hexadecimales sueltos fuera de tokens.js:"; echo "$HEX"
else
  ok "Ningún hex suelto fuera de tokens.js"
fi

# --- Regla 4: todo overlay 'fixed inset-0' debe montarse con createPortal ---
# Si un archivo tiene un overlay a pantalla completa pero no importa createPortal,
# reintroduce el bug del containing block (ver docs/01 §5.7).
SINPORTAL=""
for f in $(grep -rl "fixed inset-0" src/ --include=*.jsx 2>/dev/null); do
  grep -q "createPortal" "$f" || SINPORTAL="$SINPORTAL $f"
done
if [ -n "$SINPORTAL" ]; then
  fallo "Overlays 'fixed inset-0' sin createPortal (bug de containing block):$SINPORTAL"
else
  ok "Todos los overlays a pantalla completa usan createPortal"
fi

# --- Regla 45: nada de notas internas de desarrollo en texto visible ---
# Busca solo en strings de JSX visibles, no en comentarios de código.
NOTAS=$(grep -rEn ">[^<]*(Fase [0-9]|apartados [0-9]+-[0-9]+|queda pendiente|todavía no está construid)" \
        src/views/ src/components/ --include=*.jsx 2>/dev/null | grep -v '^\s*//' || true)
if [ -n "$NOTAS" ]; then
  fallo "Notas internas de desarrollo visibles para el usuario:"; echo "$NOTAS"
else
  ok "Sin notas internas de desarrollo en la interfaz"
fi

# --- Regla 17: 'relacion' nunca en la exportación ---
if grep -n "relacion" src/lib/exportData.js >/dev/null 2>&1; then
  fallo "exportData.js menciona 'relacion' — el módulo privado NUNCA se exporta"
else
  ok "'relacion' excluida de la exportación"
fi

# --- Regla 16: el PinGate de Relación no puede quitarse ---
if grep -q "tab === 'relacion'" src/App.jsx; then
  ok "Relación sigue forzando PIN incondicionalmente"
else
  fallo "Se ha perdido la condición que fuerza el PIN en Relación"
fi

# --- Regla 39: exactamente 5 pestañas en la barra inferior ---
AREAS=$(grep -c "id: 'area-" src/App.jsx || echo 0)
if [ "$AREAS" -eq 4 ]; then
  ok "4 áreas + Inicio = 5 pestañas en la barra inferior"
else
  fallo "AREAS_NAV tiene $AREAS áreas (deberían ser 4, para 5 pestañas con Inicio)"
fi

# --- Coherencia: todo ajuste de Apariencia que se guarda como atributo data-* del <html>
#     tiene que tener reglas CSS que lo usen. Sin esta comprobación se puede dar (y se dio,
#     con la densidad) el caso de un ajuste que se guarda, se anuncia como funcional en un
#     comentario del código y no hace absolutamente nada.
SIN_CSS=""
for attr in radio densidad animaciones; do
  grep -q "dataset\.$attr" src/App.jsx || { SIN_CSS="$SIN_CSS $attr(no-se-aplica)"; continue; }
  grep -q "data-$attr" src/index.css   || SIN_CSS="$SIN_CSS $attr(sin-CSS)"
done
if [ -n "$SIN_CSS" ]; then
  fallo "Ajustes de apariencia sin efecto real:$SIN_CSS"
else
  ok "Todos los ajustes de apariencia tienen efecto CSS real"
fi

# --- Coherencia: todo case de renderTab tiene entrada de navegación y viceversa ---
node --import ./scripts/resolver-vite.mjs scripts/comprobar-navegacion.mjs || FALLOS=$((FALLOS+1))

# --- ⚠️ LA APLICACIÓN DE VERDAD, EN UN NAVEGADOR ---
# Existe porque la app estuvo meses SIN ARRANCAR y ninguna de las otras 5 800
# comprobaciones lo vio: `App.jsx` no se renderizaba en ninguna prueba.
if node scripts/test-app-real.mjs >/tmp/jc_app.log 2>&1; then
  if grep -q "OMITIDA" /tmp/jc_app.log; then
    aviso "Prueba de navegador omitida (falta Playwright, no hace falta para desplegar)"
  else
    ok "La aplicación arranca, carga lo guardado y persiste — $(grep -c '✓' /tmp/jc_app.log) comprobaciones en Chromium"
  fi
else
  fallo "LA APLICACIÓN NO ARRANCA O NO GUARDA"; grep '✗' /tmp/jc_app.log
fi

if node scripts/test-imports.mjs >/tmp/jc_imports.log 2>&1; then
  ok "Nadie usa una función de src/lib/ sin importarla"
else
  fallo "Hay una función usada sin importar (ReferenceError en el móvil)"; grep '✗' /tmp/jc_imports.log
fi

echo ""
if [ "$FALLOS" -eq 0 ]; then
  printf '\033[32m═══ TODO CORRECTO ═══\033[0m\n\n'; exit 0
else
  printf '\033[31m═══ %s COMPROBACIÓN(ES) FALLIDA(S) ═══\033[0m\n\n' "$FALLOS"; exit 1
fi
