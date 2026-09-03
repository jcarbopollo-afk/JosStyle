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

if node --import ./scripts/resolver-vite.mjs scripts/test-perfil-barba.mjs >/tmp/jc_eh20.log 2>&1; then
  ok "Barba y afeitado: perfil y configuración (EH F20) — $(grep -c '✓' /tmp/jc_eh20.log) comprobaciones"
else
  fallo "Falla el perfil de barba"; grep '✗' /tmp/jc_eh20.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-rutinas-barba.mjs >/tmp/jc_eh21.log 2>&1; then
  ok "Rutinas y seguimiento de barba (EH F21) — $(grep -c '✓' /tmp/jc_eh21.log) comprobaciones"
else
  fallo "Fallan las rutinas de barba"; grep '✗' /tmp/jc_eh21.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-sonrisa.mjs >/tmp/jc_eh23.log 2>&1; then
  ok "Higiene bucal y sonrisa (EH F23) — $(grep -c '✓' /tmp/jc_eh23.log) comprobaciones"
else
  fallo "Falla el módulo de sonrisa"; grep '✗' /tmp/jc_eh23.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-perfumes.mjs >/tmp/jc_eh24.log 2>&1; then
  ok "Perfumes y fragancias (EH F24) — $(grep -c '✓' /tmp/jc_eh24.log) comprobaciones"
else
  fallo "Falla el módulo de perfumes"; grep '✗' /tmp/jc_eh24.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-recomendaciones-perfumes.mjs >/tmp/jc_eh25.log 2>&1; then
  ok "Recomendaciones, rotación y colección de perfumes (EH F25) — $(grep -c '✓' /tmp/jc_eh25.log) comprobaciones"
else
  fallo "Fallan las recomendaciones de perfumes"; grep '✗' /tmp/jc_eh25.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-accesorios.mjs >/tmp/jc_eh26.log 2>&1; then
  ok "Accesorios y estilo personal (EH F26) — $(grep -c '✓' /tmp/jc_eh26.log) comprobaciones"
else
  fallo "Fallan los accesorios"; grep '✗' /tmp/jc_eh26.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-gustos.mjs >/tmp/jc_eh27.log 2>&1; then
  ok "Gustos, intereses y cosas que quiero hacer (EH F27) — $(grep -c '✓' /tmp/jc_eh27.log) comprobaciones"
else
  fallo "Fallan los gustos"; grep '✗' /tmp/jc_eh27.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-objetivos-eh.mjs >/tmp/jc_eh28.log 2>&1; then
  ok "Objetivos y experiencias personales (EH F28) — $(grep -c '✓' /tmp/jc_eh28.log) comprobaciones"
else
  fallo "Falla el puente con Objetivos"; grep '✗' /tmp/jc_eh28.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-mi-estilo.mjs >/tmp/jc_eh29.log 2>&1; then
  ok "Perfil de estilo personal (EH F29) — $(grep -c '✓' /tmp/jc_eh29.log) comprobaciones"
else
  fallo "Falla Mi estilo"; grep '✗' /tmp/jc_eh29.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-pantalla-eh.mjs >/tmp/jc_eh30.log 2>&1; then
  ok "Pantalla, organización y personalización (EH F30-F31) — $(grep -c '✓' /tmp/jc_eh30.log) comprobaciones"
else
  fallo "Falla la pantalla principal"; grep '✗' /tmp/jc_eh30.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-ideas-estilo.mjs >/tmp/jc_eh32.log 2>&1; then
  ok "Recomendaciones generales de estilo (EH F32) — $(grep -c '✓' /tmp/jc_eh32.log) comprobaciones"
else
  fallo "Fallan las ideas de estilo"; grep '✗' /tmp/jc_eh32.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-descubrir.mjs >/tmp/jc_eh33.log 2>&1; then
  ok "Descubrir e inspiración (EH F33) — $(grep -c '✓' /tmp/jc_eh33.log) comprobaciones"
else
  fallo "Falla Descubrir"; grep '✗' /tmp/jc_eh33.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-preferencias-estilo.mjs >/tmp/jc_eh34.log 2>&1; then
  ok "Perfil y preferencias avanzadas (EH F34) — $(grep -c '✓' /tmp/jc_eh34.log) comprobaciones"
else
  fallo "Fallan las preferencias de estilo"; grep '✗' /tmp/jc_eh34.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-progreso-estilo.mjs >/tmp/jc_eh35.log 2>&1; then
  ok "Estadísticas y progreso de estilo (EH F35) — $(grep -c '✓' /tmp/jc_eh35.log) comprobaciones"
else
  fallo "Falla el progreso de estilo"; grep '✗' /tmp/jc_eh35.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-gestion-estilo.mjs >/tmp/jc_eh36.log 2>&1; then
  ok "Gestión global de módulos (EH F36) — $(grep -c '✓' /tmp/jc_eh36.log) comprobaciones"
else
  fallo "Falla la gestión de módulos"; grep '✗' /tmp/jc_eh36.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-buscador-estilo.mjs >/tmp/jc_eh37.log 2>&1; then
  ok "Buscador y navegación interna (EH F37) — $(grep -c '✓' /tmp/jc_eh37.log) comprobaciones"
else
  fallo "Falla el buscador de estilo"; grep '✗' /tmp/jc_eh37.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-avisos-estilo.mjs >/tmp/jc_eh38.log 2>&1; then
  ok "Notificaciones y recordatorios (EH F38) — $(grep -c '✓' /tmp/jc_eh38.log) comprobaciones"
else
  fallo "Fallan los avisos de estilo"; grep '✗' /tmp/jc_eh38.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-integracion-estilo.mjs >/tmp/jc_eh39.log 2>&1; then
  ok "Integración con el resto de JosStyle (EH F39) — $(grep -c '✓' /tmp/jc_eh39.log) comprobaciones"
else
  fallo "Falla la integración de Estilo de hombre"; grep '✗' /tmp/jc_eh39.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-primer-uso.mjs >/tmp/jc_eh40.log 2>&1; then
  ok "Primer uso y configuración inicial (EH F40) — $(grep -c '✓' /tmp/jc_eh40.log) comprobaciones"
else
  fallo "Falla el primer uso de Estilo de hombre"; grep '✗' /tmp/jc_eh40.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-estados-estilo.mjs >/tmp/jc_eh41.log 2>&1; then
  ok "Estados vacíos, carga y errores (EH F41) — $(grep -c '✓' /tmp/jc_eh41.log) comprobaciones"
else
  fallo "Fallan los estados de Estilo de hombre"; grep '✗' /tmp/jc_eh41.log
fi

# ⚠️ EH F42 — además de sus propias comprobaciones, esta suite pasa el revisor de
# accesibilidad por TODAS las vistas de JosStyle, no solo por Estilo de hombre.
if node --import ./scripts/resolver-vite.mjs scripts/test-accesibilidad-eh.mjs >/tmp/jc_eh42.log 2>&1; then
  ok "Accesibilidad y usabilidad (EH F42) — $(grep -c '✓' /tmp/jc_eh42.log) comprobaciones"
else
  fallo "Alguna pantalla incumple las reglas de accesibilidad"; grep '✗' /tmp/jc_eh42.log
fi

# ⚠️ EH F43 — comprueba el aislamiento por usuario (RLS de `app_data`), que no haya
# secretos en el cliente y que Estilo de hombre no duplique ningún sistema global.
if node --import ./scripts/resolver-vite.mjs scripts/test-privacidad-estilo.mjs >/tmp/jc_eh43.log 2>&1; then
  ok "Seguridad, privacidad y control de datos (EH F43) — $(grep -c '✓' /tmp/jc_eh43.log) comprobaciones"
else
  fallo "Falla la privacidad de Estilo de hombre"; grep '✗' /tmp/jc_eh43.log
fi

# ⚠️ EH F18 — Higiene y Cuidado corporal son DOS módulos (C-25, contestada por Josué),
# así que lo que más se comprueba aquí es que apagar uno no toca el otro.
if node --import ./scripts/resolver-vite.mjs scripts/test-cuerpo-higiene.mjs >/tmp/jc_eh18.log 2>&1; then
  ok "Cuerpo e higiene: configuración y perfil (EH F18) — $(grep -c '✓' /tmp/jc_eh18.log) comprobaciones"
else
  fallo "Falla Cuerpo e higiene"; grep '✗' /tmp/jc_eh18.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-rutinas-cuerpo.mjs >/tmp/jc_eh19.log 2>&1; then
  ok "Cuerpo e higiene: rutinas y recomendaciones (EH F19) — $(grep -c '✓' /tmp/jc_eh19.log) comprobaciones"
else
  fallo "Fallan las rutinas de cuerpo e higiene"; grep '✗' /tmp/jc_eh19.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-manos-pies.mjs >/tmp/jc_eh22.log 2>&1; then
  ok "Manos, uñas y pies (EH F22) — $(grep -c '✓' /tmp/jc_eh22.log) comprobaciones"
else
  fallo "Falla manos, uñas y pies"; grep '✗' /tmp/jc_eh22.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-rendimiento.mjs >/tmp/jc_eh44.log 2>&1; then
  ok "Rendimiento y optimización (EH F44) — $(grep -c '✓' /tmp/jc_eh44.log) comprobaciones"
else
  fallo "Falla el rendimiento"; grep '✗' /tmp/jc_eh44.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-estructura-datos.mjs >/tmp/jc_eh45.log 2>&1; then
  ok "Estructura interna de datos (EH F45) — $(grep -c '✓' /tmp/jc_eh45.log) comprobaciones"
else
  fallo "Falla la estructura de datos"; grep '✗' /tmp/jc_eh45.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-migracion.mjs >/tmp/jc_eh46.log 2>&1; then
  ok "Migración y compatibilidad (EH F46) — $(grep -c '✓' /tmp/jc_eh46.log) comprobaciones"
else
  fallo "Falla la migración"; grep '✗' /tmp/jc_eh46.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-integrales.mjs >/tmp/jc_eh47.log 2>&1; then
  ok "Pruebas integrales (EH F47) — $(grep -c '✓' /tmp/jc_eh47.log) comprobaciones"
else
  fallo "Fallan las pruebas integrales"; grep '✗' /tmp/jc_eh47.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-auditoria-final.mjs >/tmp/jc_eh48.log 2>&1; then
  ok "Auditoría final de funciones y duplicados (EH F48) — $(grep -c '✓' /tmp/jc_eh48.log) comprobaciones"
else
  fallo "Falla la auditoría final"; grep '✗' /tmp/jc_eh48.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-coherencia-visual.mjs >/tmp/jc_eh49.log 2>&1; then
  ok "Coherencia visual con JosStyle (EH F49) — $(grep -c '✓' /tmp/jc_eh49.log) comprobaciones"
else
  fallo "Falla la coherencia visual"; grep '✗' /tmp/jc_eh49.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-microinteracciones.mjs >/tmp/jc_eh50.log 2>&1; then
  ok "Microinteracciones y animaciones (EH F50) — $(grep -c '✓' /tmp/jc_eh50.log) comprobaciones"
else
  fallo "Fallan las microinteracciones"; grep '✗' /tmp/jc_eh50.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-experiencia-real.mjs >/tmp/jc_eh51.log 2>&1; then
  ok "Control de calidad de la experiencia real (EH F51) — $(grep -c '✓' /tmp/jc_eh51.log) comprobaciones"
else
  fallo "Fallan las pruebas de experiencia real"; grep '✗' /tmp/jc_eh51.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-produccion.mjs >/tmp/jc_eh52.log 2>&1; then
  ok "Preparación para producción (EH F52) — $(grep -c '✓' /tmp/jc_eh52.log) comprobaciones"
else
  fallo "Fallan las comprobaciones de producción"; grep '✗' /tmp/jc_eh52.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-documentacion-eh.mjs >/tmp/jc_eh53.log 2>&1; then
  ok "Documentación técnica y mantenimiento (EH F53) — $(grep -c '✓' /tmp/jc_eh53.log) comprobaciones"
else
  fallo "La documentación técnica no está al día"; grep '✗' /tmp/jc_eh53.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-recuperacion.mjs >/tmp/jc_eh54.log 2>&1; then
  ok "Backup, restauración y recuperación avanzada (EH F54) — $(grep -c '✓' /tmp/jc_eh54.log) comprobaciones"
else
  fallo "Falla la recuperación avanzada"; grep '✗' /tmp/jc_eh54.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-escalabilidad.mjs >/tmp/jc_eh55.log 2>&1; then
  ok "Escalabilidad y futuras funciones (EH F55) — $(grep -c '✓' /tmp/jc_eh55.log) comprobaciones"
else
  fallo "Falla la escalabilidad"; grep '✗' /tmp/jc_eh55.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-ia-estilo.mjs >/tmp/jc_eh56.log 2>&1; then
  ok "Integración profunda con la IA (EH F56) — $(grep -c '✓' /tmp/jc_eh56.log) comprobaciones"
else
  fallo "Falla la integración con la IA"; grep '✗' /tmp/jc_eh56.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-aprendizaje.mjs >/tmp/jc_eh57.log 2>&1; then
  ok "Aprendizaje y personalización progresiva (EH F57) — $(grep -c '✓' /tmp/jc_eh57.log) comprobaciones"
else
  fallo "Falla el aprendizaje"; grep '✗' /tmp/jc_eh57.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-insights.mjs >/tmp/jc_eh58.log 2>&1; then
  ok "Insights y resúmenes inteligentes (EH F58) — $(grep -c '✓' /tmp/jc_eh58.log) comprobaciones"
else
  fallo "Fallan los insights"; grep '✗' /tmp/jc_eh58.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-resumen-periodico.mjs >/tmp/jc_eh59.log 2>&1; then
  ok "Resumen semanal y mensual (EH F59) — $(grep -c '✓' /tmp/jc_eh59.log) comprobaciones"
else
  fallo "Falla el resumen periódico"; grep '✗' /tmp/jc_eh59.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-contextual.mjs >/tmp/jc_eh60.log 2>&1; then
  ok "Recomendaciones contextuales (EH F60) — $(grep -c '✓' /tmp/jc_eh60.log) comprobaciones"
else
  fallo "Fallan las recomendaciones contextuales"; grep '✗' /tmp/jc_eh60.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-acciones-rapidas.mjs >/tmp/jc_eh61.log 2>&1; then
  ok "Acciones rápidas e inteligentes (EH F61) — $(grep -c '✓' /tmp/jc_eh61.log) comprobaciones"
else
  fallo "Fallan las acciones rápidas"; grep '✗' /tmp/jc_eh61.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-usabilidad.mjs >/tmp/jc_eh62.log 2>&1; then
  ok "Accesibilidad y usabilidad avanzada (EH F62) — $(grep -c '✓' /tmp/jc_eh62.log) comprobaciones"
else
  fallo "Falla la usabilidad avanzada"; grep '✗' /tmp/jc_eh62.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-seguridad-eh.mjs >/tmp/jc_eh63.log 2>&1; then
  ok "Seguridad, privacidad y control de datos (EH F63) — $(grep -c '✓' /tmp/jc_eh63.log) comprobaciones"
else
  fallo "Falla la revisión de seguridad"; grep '✗' /tmp/jc_eh63.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-prueba-final.mjs >/tmp/jc_eh64.log 2>&1; then
  ok "Prueba integral end-to-end (EH F64) — $(grep -c '✓' /tmp/jc_eh64.log) comprobaciones"
else
  fallo "Falla la prueba integral"; grep '✗' /tmp/jc_eh64.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-cierre.mjs >/tmp/jc_eh65.log 2>&1; then
  ok "Cierre, congelación y entrega final (EH F65) — $(grep -c '✓' /tmp/jc_eh65.log) comprobaciones"
else
  fallo "Falla el cierre"; grep '✗' /tmp/jc_eh65.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-sonido-produccion.mjs >/tmp/jc_so5.log 2>&1; then
  ok "Producción, integración y test final (SO F5) — $(grep -c '✓' /tmp/jc_so5.log) comprobaciones"
else
  fallo "Falla la producción de sonido"; grep '✗' /tmp/jc_so5.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-calendario.mjs >/tmp/jc_cal.log 2>&1; then
  ok "Calendario Universal · recurrencias — $(grep -c '✓' /tmp/jc_cal.log) comprobaciones"
else
  fallo "Fallan las recurrencias del calendario"; grep '✗' /tmp/jc_cal.log
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
# ⚠️ Y desde EH F48 tampoco cuenta una REGLA: `auditoriaFinal.js` lleva ese
# patrón escrito para BUSCARLO, y buscarlo no es hacerlo. Son las líneas que
# declaran `prohibido:`.
if grep -rEn 'new Audio\(|AudioContext|webkitAudioContext' src/ --include=*.js --include=*.jsx \
   | grep -v 'src/lib/audioEngine.js' \
   | grep -v 'prohibido:' \
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
#   · `ejemploMalo:` — EH F49: un revisor guarda EJEMPLOS de lo que busca. Un
#                     ejemplo de una violación no es una violación (igual que
#                     `prohibido:` en la regla del audio).
HEX=$(grep -rEn "#[0-9A-Fa-f]{6}" src/ --include=*.jsx --include=*.js \
      | grep -v '^src/tokens.js:' \
      | grep -v '^src/lib/colorEngine.js:' \
      | grep -v '^src/lib/armario.js:' \
      | grep -v '^src/lib/horarioEditor.js:' \
      | grep -v '#EDEFF2' \n      | grep -v 'ejemploMalo:' \
      | grep -vE ':[0-9]+:[[:space:]]*(//|\*|/\*)' \
      || true)
if [ -n "$HEX" ]; then
  fallo "Colores hexadecimales sueltos fuera de tokens.js:"; echo "$HEX"
else
  ok "Ningún hex suelto fuera de tokens.js"
fi

# ─── INVARIANTE 12 · 🐛 NUNCA `toISOString()` PARA UNA FECHA LOCAL ────────────
# Sexta vez que este proyecto pisa la misma trampa, y la última que puede pasar
# desapercibida. `new Date('2026-06-01T00:00:00')` es medianoche LOCAL, y
# `toISOString()` la pasa a UTC restando el huso: en España el resultado
# retrocede un día. Ha roto, por orden: los recordatorios de rutinas
# (motorRutinas), los eventos derivados (calendarioIntegracion), los avisos de
# Estilo de hombre, cuatro pruebas, y —lo más caro— **las tres recurrencias del
# calendario**: un evento diario que no avanzaba nunca, uno semanal que avanzaba
# seis días y uno mensual del 31 que se atascaba en el día 3.
#
# La regla: para una fecha local se usa `fechaLocalISO` (helpers.js). Se
# excluyen los comentarios, que hablan justamente de esto.
UTC=$(grep -rn "toISOString()" src/ --include=*.jsx --include=*.js \
      | grep -E "slice\(0, ?10\)|split\('T'\)" \
      | grep -vE ':[0-9]+:[[:space:]]*(//|\*|/\*)' \
      | grep -v 'Antes esto era' \
      || true)
if [ -n "$UTC" ]; then
  fallo "🐛 toISOString() usado para una fecha local (usa fechaLocalISO):"; echo "$UTC"
else
  ok "Ninguna fecha local sale de toISOString() (la trampa que rompió el calendario)"
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

# ⚠️ Dos reglas: una función de `src/lib/` sin importar (EH F15) y un componente
# JSX sin importar (EH F39) — las dos revientan en el móvil y no las ve el build.
if node scripts/test-imports.mjs >/tmp/jc_imports.log 2>&1; then
  ok "Nadie usa una función de src/lib/ ni un componente JSX sin importarlo"
else
  fallo "Hay algo usado sin importar (ReferenceError en el móvil)"; grep '✗' /tmp/jc_imports.log
fi

echo ""
if [ "$FALLOS" -eq 0 ]; then
  printf '\033[32m═══ TODO CORRECTO ═══\033[0m\n\n'; exit 0
else
  printf '\033[31m═══ %s COMPROBACIÓN(ES) FALLIDA(S) ═══\033[0m\n\n' "$FALLOS"; exit 1
fi
