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

# 🚨 Los archivos de audio de verdad, contra su ficha. Abre cada MP3 de
# public/sonidos/ y mide su duración leyendo las cabeceras de trama — sin ffmpeg,
# que la suite no puede depender de nada externo. Hasta que existió, la ficha se
# probaba contra números escritos a mano y un sonido de 400 ms habría pasado.
if node --import ./scripts/resolver-vite.mjs scripts/test-archivos-sonido.mjs >/tmp/jc_audiofiles.log 2>&1; then
  ok "Los archivos de audio cumplen su ficha — $(grep -c '✓' /tmp/jc_audiofiles.log) comprobaciones"
else
  fallo "Algún archivo de audio se sale de su ficha"; grep '✗' /tmp/jc_audiofiles.log
fi

# 🚨 El hallazgo de la F63, cerrado el 2026-09-04 por decisión de Josué. Importa
# el handler de verdad y le pasa un req falso: sin sesión tiene que dar 401 y NO
# llegar a Anthropic. Va sin resolver-vite: api/ está fuera de src/.
if node scripts/test-endpoint-ia.mjs >/tmp/jc_endpoint.log 2>&1; then
  ok "El endpoint de la IA pide sesión (F63) — $(grep -c '✓' /tmp/jc_endpoint.log) comprobaciones"
else
  fallo "El endpoint de la IA deja pasar a quien no debe"; grep '✗' /tmp/jc_endpoint.log
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
# 🐛 ⚠️ **Y desde FIT F7 se quitan los comentarios DE VERDAD, no por el principio
# de la línea.** Esto excluía las líneas que EMPIEZAN por `//`, `*` o `/*`, así
# que una línea intermedia de un bloque `/* … */` sin asterisco al margen —el
# estilo que usa medio proyecto— hacía saltar la regla **con el código bien**:
# la cabecera de `entrenamiento.js` promete que ninguna pantalla hace
# `new Audio(...)`, y era justamente esa promesa la que la ponía roja. Es el
# mismo fallo que el barrido de hex en NAV F3 y el de los portales en FIT F5, por
# vigesimonovena vez. Ahora lo hace Node, que sí sabe dónde empieza y acaba un
# comentario — y también quita las CADENAS, porque `sonidoProduccion.js` NOMBRA
# el patrón dentro de un texto para prometer que no está, y nombrarlo no es
# hacerlo (la misma distinción de EH F48).
# 🚨 ⚠️ **Y de paso se descubrió que la exclusión vieja valía para CUALQUIER
# sitio de la línea, no para su principio**: `:[[:space:]]*(//|\*|/\*)` encajaba
# con un `: **negrita` o con un `http://` en mitad de un texto, así que una
# línea con un `new Audio()` DE VERDAD y una URL al lado se habría colado.
# ⚠️ Comprobado que la nueva **sigue cazando un `new Audio()` de verdad**.
MALAUDIO=$(node -e '
  import("node:fs").then(({ readdirSync, readFileSync, statSync }) => {
    const walk = (d) => readdirSync(d).flatMap((f) => {
      const p = d + "/" + f;
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
    /* Quita comentarios y cadenas: nombrar el patron no es hacerlo. */
    const soloCodigo = (t) => t
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
      .replace(/(^|[^:])\/\/.*$/gm, "$1 ")
      .replace(/\x27(?:[^\x27\\\n]|\\.)*\x27/g, "\x27\x27")
      .replace(/"(?:[^"\\\n]|\\.)*"/g, "\"\"")
      .replace(/`(?:[^`\\]|\\.)*`/g, "``");
    const malos = [];
    for (const f of walk("src").filter((x) => /\.jsx?$/.test(x))) {
      if (f.includes("audioEngine.js")) continue;
      soloCodigo(readFileSync(f, "utf8")).split("\n").forEach((l, i) => {
        if (!/new Audio\(|AudioContext|webkitAudioContext/.test(l)) return;
        if (/prohibido:/.test(l)) return;
        malos.push(" " + f + ":" + (i + 1) + ":" + l.trim());
      });
    }
    process.stdout.write(malos.join("\n"));
  });
')
if [ -n "$MALAUDIO" ]; then
  fallo "Alguien toca el audio fuera de audioEngine.js:"; echo "$MALAUDIO"
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
      | grep -v '#EDEFF2' \
      | grep -v 'ejemploMalo:' \
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
# 🐛 ⚠️ Y LA LECCIÓN DE SIEMPRE, POR VIGESIMOSEXTA VEZ: una regla que comprueba
# que el código NO hace algo tiene que quitar los COMENTARIOS antes de barrer, o
# salta con la frase que promete justamente eso. Aquí lo hizo la cabecera de
# `BibliotecaPlanesView.jsx` (FIT F5), que explica que sus menús se despliegan
# dentro de la tarjeta "sin `fixed inset-0` ni portal" — y esa vista no tiene un
# solo overlay. ⚠️ Y `PlantillasView.jsx` decía lo mismo sin saltar **solo porque
# el salto de línea le partía la frase**: la regla llevaba desde que existe
# dependiendo de dónde cayera el ajuste de línea de un comentario.
SINPORTAL=$(node -e '
  const { readdirSync, readFileSync, statSync } = require("fs");
  const { join } = require("path");
  const jsx = [];
  (function recorrer(d) {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) recorrer(p);
      else if (p.endsWith(".jsx")) jsx.push(p);
    }
  })("src");
  const sinComentarios = (t) => t
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1 ");
  const malos = jsx.filter((f) => {
    const t = readFileSync(f, "utf8");
    return /fixed inset-0/.test(sinComentarios(t)) && !/createPortal/.test(t);
  });
  process.stdout.write(malos.map((f) => " " + f).join(""));
')
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
# 🚨 DIST F1 — el reparto cambió, la regla NO. Antes eran Inicio + 4 áreas; ahora
# son Inicio + 3 áreas + Ajustes, porque Josué eliminó «Además» como categoría y
# puso Ajustes directamente en la barra. Lo que la regla 10 protege es que sean
# CINCO, no que haya cuatro áreas: se cuenta lo que de verdad importa.
AREAS=$(grep -c "id: 'area-" src/App.jsx || echo 0)
PESTANAS=$((AREAS + 2))   # + Inicio + Ajustes
if [ "$PESTANAS" -eq 5 ]; then
  ok "Inicio + $AREAS áreas + Ajustes = 5 pestañas en la barra inferior"
else
  fallo "La barra inferior tendría $PESTANAS pestañas ($AREAS áreas + Inicio + Ajustes); deben ser 5"
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

# ⚠️ Entrega 3 · F1, apartado 2 — un botón de eliminar que no elimina. Economía →
# Movimientos llamaba a una prop que App.jsx nunca le pasaba: la pantalla se
# pintaba perfecta y al tocar la papelera no pasaba nada.
if node scripts/test-borrados.mjs >/tmp/jc_borr.log 2>&1; then
  ok "Botones de eliminar — $(grep -o '[0-9]* en [0-9]* archivos' /tmp/jc_borr.log | head -1 | cut -d' ' -f1) revisados, todos cableados"
else
  fallo "Hay un botón de eliminar que no hace nada"; grep '✗' /tmp/jc_borr.log
fi

# ⚠️ Entrega 3 · F1, apartados 1 y 4-6 — la Safe Area del iPhone y los títulos
# duplicados de los desplegables. Las dos son de presentación y solo se ven en
# el móvil, que es donde no llega ninguna otra prueba.
# SF F1 — el barrido de Safari: lo que Chromium perdona y Safari no. Nace de la
# SC F1, donde un fallo llevaba meses invisible porque todas las pruebas corren
# en Chromium y la aplicación solo se usa en un iPhone.
if node --import ./scripts/resolver-vite.mjs scripts/test-safari.mjs >/tmp/jc_safari.log 2>&1; then
  ok "El barrido de Safari (SF F1) — $(grep -c '✓' /tmp/jc_safari.log) comprobaciones"
else
  fallo "Falla el barrido de Safari"; grep '✗' /tmp/jc_safari.log
fi

# NAVO F1 — atrás vuelve de donde viniste, no al área a la que pertenece el
# módulo. Una pila real en vez de `areaActual.id`, que era la línea del fallo.
if node --import ./scripts/resolver-vite.mjs scripts/test-navegacion.mjs >/tmp/jc_navorigen.log 2>&1; then
  ok "Navegación por origen (NAVO F1) — $(grep -c '✓' /tmp/jc_navorigen.log) comprobaciones"
else
  fallo "Falla la navegación por origen"; grep '✗' /tmp/jc_navorigen.log
fi

# FIT F1 — la fundación de Fitness (Entrega 4). Lo que más se vigila no es lo que
# se ha construido, sino lo que NO se ha duplicado: las fotos de progreso ya son
# `saludFotos` y las habilidades ya son `calistenia`.
if node --import ./scripts/resolver-vite.mjs scripts/test-fitness.mjs >/tmp/jc_fitness.log 2>&1; then
  ok "Fundación de Fitness (FIT F1) — $(grep -c '✓' /tmp/jc_fitness.log) comprobaciones"
else
  fallo "Falla la fundación de Fitness"; grep '✗' /tmp/jc_fitness.log
fi

# FIT F2 — el catálogo maestro de ejercicios. Las cuatro validaciones del
# apartado 29 que no se pueden mirar a ojo con cien fichas: ids únicos,
# porcentajes que suman 100, referencias que existen y ni un enlace inventado.
if node --import ./scripts/resolver-vite.mjs scripts/test-ejercicios.mjs >/tmp/jc_ejercicios.log 2>&1; then
  ok "Catálogo maestro de ejercicios (FIT F2) — $(grep -c '✓' /tmp/jc_ejercicios.log) comprobaciones"
else
  fallo "Falla el catálogo de ejercicios"; grep '✗' /tmp/jc_ejercicios.log
fi

# FIT F3 — el constructor de entrenamientos. Lo que más se vigila es el apartado
# 28, que el propio enunciado marca como CRÍTICO: `Exercise` es el catálogo y
# `WorkoutExercise` la configuración dentro de UNA rutina. Y el ida y vuelta:
# un normalizador que no conoce un campo lo BORRA en la siguiente carga.
if node --import ./scripts/resolver-vite.mjs scripts/test-constructor.mjs >/tmp/jc_constructor.log 2>&1; then
  ok "Constructor de entrenamientos (FIT F3) — $(grep -c '✓' /tmp/jc_constructor.log) comprobaciones"
else
  fallo "Falla el constructor de entrenamientos"; grep '✗' /tmp/jc_constructor.log
fi

# FIT F4 — la gestión de plantillas propias. Lo que más se vigila es el apartado
# 7, que el enunciado pide comprobar EXPLÍCITAMENTE: editar la copia no puede
# tocar el original — y para eso cada LÍNEA necesita su propio id, no solo el
# plan.
if node --import ./scripts/resolver-vite.mjs scripts/test-plantillas.mjs >/tmp/jc_plantillas.log 2>&1; then
  ok "Tus plantillas (FIT F4) — $(grep -c '✓' /tmp/jc_plantillas.log) comprobaciones"
else
  fallo "Falla la gestión de plantillas"; grep '✗' /tmp/jc_plantillas.log
fi

# FIT F5 — la biblioteca de planificaciones. Lo que más se vigila son dos cosas
# que el enunciado subraya: que cada plan esté compuesto por ejercicios que
# EXISTEN en el catálogo de la F2 (las 297 líneas, una a una) y que personalizar
# uno no toque el original — lo que él llama "MUY IMPORTANTE".
if node --import ./scripts/resolver-vite.mjs scripts/test-planes.mjs >/tmp/jc_planes.log 2>&1; then
  ok "Biblioteca de planificaciones (FIT F5) — $(grep -c '✓' /tmp/jc_planes.log) comprobaciones"
else
  fallo "Falla la biblioteca de planificaciones"; grep '✗' /tmp/jc_planes.log
fi

# FIT F6 — Tu Plan. Lo que más se vigila: que el estado «Completado» NO salga de
# ningún día (sin historial de sesiones no se puede afirmar, apartado 8), que la
# semana funcione con planes de 2 a 7 días y con una plantilla suya de una sola
# sesión, y que sin fecha de activación no se invente una semana (apartado 16).
if node --import ./scripts/resolver-vite.mjs scripts/test-tu-plan.mjs >/tmp/jc_tuplan.log 2>&1; then
  ok "Tu Plan (FIT F6) — $(grep -c '✓' /tmp/jc_tuplan.log) comprobaciones"
else
  fallo "Falla Tu Plan"; grep '✗' /tmp/jc_tuplan.log
fi

# FIT F7 — el motor de entrenamiento en vivo. Lo que más se vigila: que el
# cronómetro salga de MARCAS DE TIEMPO (hay una comprobación que simula bloquear
# el móvil diez minutos), que planificado y realizado no se pisen, que una serie
# del plan se OMITA en vez de destruirse, y que sustituir un ejercicio no toque
# ni el plan ni la plantilla — lo que el apartado 26 marca como MUY IMPORTANTE.
if node --import ./scripts/resolver-vite.mjs scripts/test-entrenamiento.mjs >/tmp/jc_entreno.log 2>&1; then
  ok "Entrenamiento en vivo (FIT F7) — $(grep -c '✓' /tmp/jc_entreno.log) comprobaciones"
else
  fallo "Falla el motor de entrenamiento en vivo"; grep '✗' /tmp/jc_entreno.log
fi

# FIT F9 — la UX avanzada del entrenamiento en vivo. Lo que más se vigila: que
# no rehaga el motor de la F7, que el descanso (ahora dentro de la sesión)
# sobreviva al guardado, que planificado y realizado sigan separados y que el
# sonido y la vibración pasen por el motor de audio y no por la pantalla.
if node --import ./scripts/resolver-vite.mjs scripts/test-entrenamiento-ux.mjs >/tmp/jc_entreno_ux.log 2>&1; then
  ok "UX del entrenamiento en vivo (FIT F9) — $(grep -c '✓' /tmp/jc_entreno_ux.log) comprobaciones"
else
  fallo "Falla la UX del entrenamiento en vivo"; grep '✗' /tmp/jc_entreno_ux.log
fi

# FIT F21 — qué ejercicios sostienen un rango muscular. Lo que más se vigila: que se
# use el porcentaje DEL MÚSCULO que se mira (no el del ejercicio entero), que la
# participación no se sume entre ejercicios, y que los que no tienen datos vayan aparte.
# FIT F29 — el análisis avanzado por ejercicio. Lo que más se vigila: que NO se cree una
# lógica de progreso nueva (todo sale de la F11 y llega por la F12), que no se guarde
# nada, que el periodo filtre la gráfica y NO el historial ni el rango, que el selector de
# métrica no aparezca con una sola métrica y que al cambiarla cambie la unidad, y que un
# ejercicio archivado conserve sus resultados y sus fechas.
if node --import ./scripts/resolver-vite.mjs scripts/test-detalle-ejercicio.mjs >/tmp/jc_detalle_ejercicio.log 2>&1; then
  ok "Análisis por ejercicio (FIT F29) — $(grep -c '✓' /tmp/jc_detalle_ejercicio.log) comprobaciones"
else
  fallo "Falla el análisis por ejercicio"; grep '✗' /tmp/jc_detalle_ejercicio.log
fi

# FIT F28 — la integración completa del progreso físico. Lo que más se vigila: que NO
# exista ninguna métrica que mezcle dos sistemas —«fotos + fuerza + rangos = 82 %» es el
# ejemplo que prohíbe el apartado 10—, que cada bloque lea de UN solo motor, que el
# periodo filtre lo que se ve y no toque ni el rango ni los objetivos, que la línea
# temporal se derive y no se guarde, y que un error en Fotos no esconda los
# entrenamientos.
if node --import ./scripts/resolver-vite.mjs scripts/test-resumen-progreso.mjs >/tmp/jc_resumen_progreso.log 2>&1; then
  ok "Integración del progreso físico (FIT F28) — $(grep -c '✓' /tmp/jc_resumen_progreso.log) comprobaciones"
else
  fallo "Falla la integración del progreso"; grep '✗' /tmp/jc_resumen_progreso.log
fi

# FIT F27 — el comparador. Lo que más se vigila: que NO se escriba una segunda
# comparación (la de la F26 se importa), que el rótulo «Antes» viaje con la foto al
# intercambiar los lados, que sin etiqueta de orientación no se afirme nada del encuadre,
# que el swipe no se coma el divisor, que el zoom de un lado no mueva el otro, que una
# foto borrada cierre la comparación en vez de romperla, y que ni un texto hable del
# cuerpo. Y que el comparador NO vuelva a firmar las URLs que la galería ya tiene.
if node --import ./scripts/resolver-vite.mjs scripts/test-comparador-fotos.mjs >/tmp/jc_comparador_fotos.log 2>&1; then
  ok "Comparador de progreso físico (FIT F27) — $(grep -c '✓' /tmp/jc_comparador_fotos.log) comprobaciones"
else
  fallo "Falla el comparador de fotos"; grep '✗' /tmp/jc_comparador_fotos.log
fi

# FIT F26 — el progreso físico en fotos. Lo que más se vigila: que NO exista una
# segunda lista de fotos (son `saludFotos` desde la Fase 3), que no se guarde ninguna
# URL firmada —caducan en una hora—, que toda foto sea privada y ninguna salga hacia
# una API externa, que la comparación diga solo las dos fechas y el tiempo entre ellas,
# y que una foto que no se puede leer NO se lleve por delante la galería entera.
if node --import ./scripts/resolver-vite.mjs scripts/test-fotos-progreso.mjs >/tmp/jc_fotos_progreso.log 2>&1; then
  ok "Progreso físico en fotos (FIT F26) — $(grep -c '✓' /tmp/jc_fotos_progreso.log) comprobaciones"
else
  fallo "Falla el progreso en fotos"; grep '✗' /tmp/jc_fotos_progreso.log
fi

# FIT F25 — el resumen de la pantalla de Rangos. Lo que más se vigila: que no se guarde
# ningún «dashboard summary», que la cobertura y la confianza sean las del motor y no
# una segunda fórmula, que sin historial no se invente una tendencia, que con la cola
# vacía no quede una tarjeta de tarea pendiente, y que un grupo destacado NUNCA diga
# «Sin datos» de tendencia —eso es lo que se reserva para un grupo sin datos—.
if node --import ./scripts/resolver-vite.mjs scripts/test-resumen-rangos.mjs >/tmp/jc_resumen_rangos.log 2>&1; then
  ok "Resumen inteligente de rangos (FIT F25) — $(grep -c '✓' /tmp/jc_resumen_rangos.log) comprobaciones"
else
  fallo "Falla el resumen de rangos"; grep '✗' /tmp/jc_resumen_rangos.log
fi

# FIT F24 — la priorización de la clasificación. Lo que más se vigila: que la cola no
# la calcule ninguna pantalla ni se guarde en `fitness`, que los umbrales de «datos
# suficientes» sean los de la F19 y no unos nuevos, que un ejercicio con sesiones reales
# NO se pida clasificar, y que saltar uno no le asigne un nivel arbitrario.
if node --import ./scripts/resolver-vite.mjs scripts/test-cola-clasificacion.mjs >/tmp/jc_cola_clasificacion.log 2>&1; then
  ok "Priorización de la clasificación (FIT F24) — $(grep -c '✓' /tmp/jc_cola_clasificacion.log) comprobaciones"
else
  fallo "Falla la priorización de la clasificación"; grep '✗' /tmp/jc_cola_clasificacion.log
fi

# FIT F23 — el objetivo del siguiente rango. Lo que más se vigila: que el progreso se
# mida ENTRE los dos umbrales (no score/máximo), que los puntos que faltan solo se
# afirmen con datos reales detrás, y que NINGÚN texto convierta esos puntos en kilos
# ni en repeticiones — el score combina varias métricas.
if node --import ./scripts/resolver-vite.mjs scripts/test-siguiente-rango.mjs >/tmp/jc_siguiente_rango.log 2>&1; then
  ok "Objetivo del siguiente rango (FIT F23) — $(grep -c '✓' /tmp/jc_siguiente_rango.log) comprobaciones"
else
  fallo "Falla el objetivo del siguiente rango"; grep '✗' /tmp/jc_siguiente_rango.log
fi

# FIT F22 — el historial de rangos. Lo que más se vigila: que no se invente ni un
# punto, que un cambio solo exista si cambió el RANGO (no el score), que el pasado
# conserve su confianza baja, y que borrar la sesión que causó una subida se lleve
# esa subida por delante — sin una línea de invalidación, porque no se guarda nada.
if node --import ./scripts/resolver-vite.mjs scripts/test-historial-rangos.mjs >/tmp/jc_historial_rangos.log 2>&1; then
  ok "Historial y evolución de rangos (FIT F22) — $(grep -c '✓' /tmp/jc_historial_rangos.log) comprobaciones"
else
  fallo "Falla el historial de rangos"; grep '✗' /tmp/jc_historial_rangos.log
fi

if node --import ./scripts/resolver-vite.mjs scripts/test-contribucion-muscular.mjs >/tmp/jc_contribucion.log 2>&1; then
  ok "Contribución a los rangos musculares (FIT F21) — $(grep -c '✓' /tmp/jc_contribucion.log) comprobaciones"
else
  fallo "Falla la contribución muscular"; grep '✗' /tmp/jc_contribucion.log
fi

# FIT F20 — la explicación de un rango. Lo que más se vigila: que NO se prometa una
# cifra («te faltan 5 kg»), que no se compare con un pasado que no existe, y que la
# métrica sea la del ejercicio (segundos en un isométrico, nunca kilos).
if node --import ./scripts/resolver-vite.mjs scripts/test-explicacion-rangos.mjs >/tmp/jc_explicacion_rangos.log 2>&1; then
  ok "Explicación de rangos (FIT F20) — $(grep -c '✓' /tmp/jc_explicacion_rangos.log) comprobaciones"
else
  fallo "Falla la explicación de rangos"; grep '✗' /tmp/jc_explicacion_rangos.log
fi

# FIT F19 — el motor de rangos. Lo que más se vigila: que una mala sesión NO baje el
# rango, que una sola sesión no sustituya de golpe la estimación, y que borrar o editar
# una sesión se note en la siguiente lectura (no hay rangos guardados).
if node --import ./scripts/resolver-vite.mjs scripts/test-motor-rangos.mjs >/tmp/jc_motor_rangos.log 2>&1; then
  ok "Motor de rangos (FIT F19) — $(grep -c '✓' /tmp/jc_motor_rangos.log) comprobaciones"
else
  fallo "Falla el motor de rangos"; grep '✗' /tmp/jc_motor_rangos.log
fi

# FIT F18 — el detalle de un grupo muscular. Lo que más se vigila: que los ejercicios
# salgan del CATÁLOGO (no de una lista a mano), que la tendencia sea la de la F11, que un
# subgrupo sin datos no reciba rango, y que un ejercicio borrado no rompa la pantalla.
if node --import ./scripts/resolver-vite.mjs scripts/test-detalle-muscular.mjs >/tmp/jc_detalle_muscular.log 2>&1; then
  ok "Detalle de rankings musculares (FIT F18) — $(grep -c '✓' /tmp/jc_detalle_muscular.log) comprobaciones"
else
  fallo "Falla el detalle muscular"; grep '✗' /tmp/jc_detalle_muscular.log
fi

# FIT F17 — el cuestionario de clasificación. Lo que más se vigila: que una estimación
# NO gane a una sesión real (ni siquiera cuando la sesión sale peor), que no toque el
# historial, y que la confianza de contestar una pregunta nunca sea alta.
if node --import ./scripts/resolver-vite.mjs scripts/test-clasificacion.mjs >/tmp/jc_clasificacion.log 2>&1; then
  ok "Clasificación por cuestionario (FIT F17) — $(grep -c '✓' /tmp/jc_clasificacion.log) comprobaciones"
else
  fallo "Falla la clasificación de ejercicios"; grep '✗' /tmp/jc_clasificacion.log
fi

# FIT F16 — la pantalla de Rangos. Lo que más se vigila: que la pantalla NO calcule
# (ni umbrales ni fórmulas dentro de la vista) y que no aparezca un dato falso —un rango
# global con dos ejercicios, un grupo sin datos con rango, o un contador de clasificados
# que cuente series sin marcar.
if node --import ./scripts/resolver-vite.mjs scripts/test-pantalla-rangos.mjs >/tmp/jc_pantalla_rangos.log 2>&1; then
  ok "Pantalla de Rangos (FIT F16) — $(grep -c '✓' /tmp/jc_pantalla_rangos.log) comprobaciones"
else
  fallo "Falla la pantalla de Rangos"; grep '✗' /tmp/jc_pantalla_rangos.log
fi

# FIT F15 — la base de Rangos. Lo que más se vigila: que sin datos sea «Sin Rango»
# y no el rango 1, que un grupo sin entrenar no cuente como cero, que un ejercicio
# aislado no dé rango global, y que un mal día no baje el rango.
if node --import ./scripts/resolver-vite.mjs scripts/test-rangos.mjs >/tmp/jc_rangos.log 2>&1; then
  ok "Sistema base de rangos (FIT F15) — $(grep -c '✓' /tmp/jc_rangos.log) comprobaciones"
else
  fallo "Falla el sistema de rangos"; grep '✗' /tmp/jc_rangos.log
fi

# FIT F14 — los objetivos de rendimiento. Lo que más se vigila: el criterio literal
# (15 dominadas hasta «✓ Objetivo conseguido»), que sin datos no sea 0 %, que la
# unidad dependa del ejercicio y que eliminar un objetivo no toque entrenamientos.
if node --import ./scripts/resolver-vite.mjs scripts/test-objetivos-progreso.mjs >/tmp/jc_objetivos.log 2>&1; then
  ok "Objetivos de rendimiento (FIT F14) — $(grep -c '✓' /tmp/jc_objetivos.log) comprobaciones"
else
  fallo "Fallan los objetivos de rendimiento"; grep '✗' /tmp/jc_objetivos.log
fi

# FIT F13 — el progreso por grupos musculares. Lo que más se vigila: que un grupo
# sin entrenar sea «Sin datos» y nunca «Descenso», que cada ejercicio cuente según
# su porcentaje, que un solo ejercicio no decida un grupo con varios, y que no se
# afirme nada del músculo con datos de rendimiento.
if node --import ./scripts/resolver-vite.mjs scripts/test-progreso-muscular.mjs >/tmp/jc_progreso_mus.log 2>&1; then
  ok "Progreso por grupos musculares (FIT F13) — $(grep -c '✓' /tmp/jc_progreso_mus.log) comprobaciones"
else
  fallo "Falla el progreso por grupos musculares"; grep '✗' /tmp/jc_progreso_mus.log
fi

# FIT F12 — Fitness → Progreso. Lo que más se vigila: que la pantalla no tenga
# matemática propia (todo sale de la F11), que diga lo mismo que el historial, y
# que la gráfica no mezcle métricas ni rompa con 0, 1, 2 o muchos puntos.
if node --import ./scripts/resolver-vite.mjs scripts/test-progreso-ejercicios.mjs >/tmp/jc_progreso_ej.log 2>&1; then
  ok "Progreso por ejercicio (FIT F12) — $(grep -c '✓' /tmp/jc_progreso_ej.log) comprobaciones"
else
  fallo "Falla el progreso por ejercicio"; grep '✗' /tmp/jc_progreso_ej.log
fi

# FIT F11 — la progresión. Lo que más se vigila: los siete casos del apartado 38,
# que variantes y medidas distintas NO se comparen, que las series incompletas no
# penalicen y que ningún cálculo toque las sesiones guardadas.
if node --import ./scripts/resolver-vite.mjs scripts/test-progresion.mjs >/tmp/jc_progresion.log 2>&1; then
  ok "Progresión del rendimiento (FIT F11) — $(grep -c '✓' /tmp/jc_progresion.log) comprobaciones"
else
  fallo "Falla la progresión del rendimiento"; grep '✗' /tmp/jc_progresion.log
fi

# FIT F10 — el historial. Lo que más se vigila: que solo entren las sesiones
# completadas, que no cuente nada por su cuenta (dice lo mismo que la F8), que los
# filtros se combinen y se limpien, y que eliminar vaya a la papelera.
if node --import ./scripts/resolver-vite.mjs scripts/test-historial.mjs >/tmp/jc_historial.log 2>&1; then
  ok "Historial de entrenamientos (FIT F10) — $(grep -c '✓' /tmp/jc_historial.log) comprobaciones"
else
  fallo "Falla el historial de entrenamientos"; grep '✗' /tmp/jc_historial.log
fi

# FIT F8 — la finalización y el guardado. Lo que más se vigila: que el guardado
# sea IDEMPOTENTE (se pulsa cinco veces y hay UNA sesión), que una serie cuente
# solo si él la marcó, que el volumen NO salga cuando no se puede calcular —unas
# dominadas a peso corporal no son 0 kg— y que completar un entrenamiento no
# toque ni el plan ni la plantilla (apartado 24).
if node --import ./scripts/resolver-vite.mjs scripts/test-finalizacion.mjs >/tmp/jc_final.log 2>&1; then
  ok "Finalización del entrenamiento (FIT F8) — $(grep -c '✓' /tmp/jc_final.log) comprobaciones"
else
  fallo "Falla la finalización del entrenamiento"; grep '✗' /tmp/jc_final.log
fi

# SC F1 — scroll, cabeceras fijas y el acordeón que dejaba un hueco en el iPhone.
# Los tres los reportó Josué usando la aplicación, y los tres tenían una causa
# real: la cabecera no era `sticky`, la banda no existía y al elemento de rejilla
# del acordeón le faltaba `min-height: 0`.
if node --import ./scripts/resolver-vite.mjs scripts/test-scroll-cabecera.mjs >/tmp/jc_scroll.log 2>&1; then
  ok "Scroll, cabeceras y acordeones (SC F1) — $(grep -c '✓' /tmp/jc_scroll.log) comprobaciones"
else
  fallo "Falla el scroll/cabeceras"; grep '✗' /tmp/jc_scroll.log
fi

# DIST F2 — la auditoría de la reorganización: la aplicación se mide contra el
# árbol que escribió Josué, no solo contra sí misma.
if node --import ./scripts/resolver-vite.mjs scripts/test-auditoria-dist.mjs >/tmp/jc_auditdist.log 2>&1; then
  ok "Auditoría de la reorganización (DIST F2) — $(grep -c '✓' /tmp/jc_auditdist.log) comprobaciones"
else
  fallo "Falla la auditoría de la reorganización"; grep '✗' /tmp/jc_auditdist.log
fi

# AS F2 — quitar no es eliminar: los usos en los DOS módulos antes de borrar.
if node --import ./scripts/resolver-vite.mjs scripts/test-usos-asignatura.mjs >/tmp/jc_usosasig.log 2>&1; then
  ok "Usos y eliminación de asignaturas (AS F2) — $(grep -c '✓' /tmp/jc_usosasig.log) comprobaciones"
else
  fallo "Falla la eliminación de asignaturas"; grep '✗' /tmp/jc_usosasig.log
fi

# AS F1 — el catálogo compartido de asignaturas entre Horario y Estudio.
if node --import ./scripts/resolver-vite.mjs scripts/test-asignaturas-compartidas.mjs >/tmp/jc_asigcomp.log 2>&1; then
  ok "Asignaturas compartidas (AS F1) — $(grep -c '✓' /tmp/jc_asigcomp.log) comprobaciones"
else
  fallo "Falla el catálogo compartido de asignaturas"; grep '✗' /tmp/jc_asigcomp.log
fi

# GE F2 — el solapamiento falso del Horario: duplicar dejaba dos horarios
# activos con las mismas clases, así que cada clase se resolvía dos veces.
if node --import ./scripts/resolver-vite.mjs scripts/test-solapamientos-horario.mjs >/tmp/jc_solapes.log 2>&1; then
  ok "Solapamientos del horario (GE F2) — $(grep -c '✓' /tmp/jc_solapes.log) comprobaciones"
else
  fallo "Falla la detección de solapamientos del horario"; grep '✗' /tmp/jc_solapes.log
fi

# GE F1 — tareas (marcar, desmarcar, eliminar), Día sin duplicar Productividad
# y los tres macros de Nutrición en una sola fila.
if node --import ./scripts/resolver-vite.mjs scripts/test-gestion-tareas.mjs >/tmp/jc_gestion.log 2>&1; then
  ok "Gestión: tareas, Día y macros (GE F1) — $(grep -c '✓' /tmp/jc_gestion.log) comprobaciones"
else
  fallo "Falla la gestión de tareas o la fila de macros"; grep '✗' /tmp/jc_gestion.log
fi

# NAV F3 — el Álbum dentro de Relación: fotos reales en su propio bucket
# privado, con el camino guardado (nunca una URL firmada, que caduca).
if node --import ./scripts/resolver-vite.mjs scripts/test-album-relacion.mjs >/tmp/jc_album.log 2>&1; then
  ok "Álbum de Relación (NAV F3) — $(grep -c '✓' /tmp/jc_album.log) comprobaciones"
else
  fallo "Falla el Álbum de Relación"; grep '✗' /tmp/jc_album.log
fi

# NAV F2 — «Estilo de hombre» pasa a llamarse «Imagen personal». Comprueba que
# no quede el nombre viejo en nada que se lea, y que NI UN ID se haya tocado.
if node --import ./scripts/resolver-vite.mjs scripts/test-renombrado-estilo.mjs >/tmp/jc_renombre.log 2>&1; then
  ok "Renombrado a «Imagen personal» (NAV F2) — $(grep -c '✓' /tmp/jc_renombre.log) comprobaciones"
else
  fallo "Falla el renombrado del apartado de estilo"; grep '✗' /tmp/jc_renombre.log
fi

# NAV F4 — eliminar una tarea desde la fila (ya existía, pero escondida en el
# detalle) y el icono de Hábitos, que era la llama de Rachas.
if node --import ./scripts/resolver-vite.mjs scripts/test-tareas-habitos.mjs >/tmp/jc_tarhab.log 2>&1; then
  ok "Tareas y Hábitos (NAV F4) — $(grep -c '✓' /tmp/jc_tarhab.log) comprobaciones"
else
  fallo "Falla el borrado de tareas o el icono de Hábitos"; grep '✗' /tmp/jc_tarhab.log
fi

# NAV F1 — la nueva arquitectura (Vida/Gestión/Bienestar/Además) y el apartado
# Números, que agrupa Estadísticas, Predicciones y Logros sin reescribirlas.
if node --import ./scripts/resolver-vite.mjs scripts/test-numeros-navegacion.mjs >/tmp/jc_numeros.log 2>&1; then
  ok "Navegación y Números (NAV F1) — $(grep -c '✓' /tmp/jc_numeros.log) comprobaciones"
else
  fallo "Falla la navegación o el apartado Números"; grep '✗' /tmp/jc_numeros.log
fi

# Ajustes · Perfil — la foto de perfil y el nombre de los saludos.
if node --import ./scripts/resolver-vite.mjs scripts/test-foto-perfil.mjs >/tmp/jc_fotoperfil.log 2>&1; then
  ok "Ajustes: foto de perfil y saludos — $(grep -c '✓' /tmp/jc_fotoperfil.log) comprobaciones"
else
  fallo "Falla la foto de perfil o el nombre de los saludos"; grep '✗' /tmp/jc_fotoperfil.log
fi

# Entrega 3 · F46 — Estudios: integración, cierre y auditoría final del bloque.
if node --import ./scripts/resolver-vite.mjs scripts/test-cierre-estudios.mjs >/tmp/jc_cierrees.log 2>&1; then
  ok "Estudios: integración y cierre (E3 F46) — $(grep -c '✓' /tmp/jc_cierrees.log) comprobaciones"
else
  fallo "Falla el cierre de Estudios (E3 F46)"; grep '✗' /tmp/jc_cierrees.log
fi

# Entrega 3 · F45 — Estudios: apps de aprendizaje, plantillas, objetivos y actividades.
if node --import ./scripts/resolver-vite.mjs scripts/test-apps-aprendizaje.mjs >/tmp/jc_apps5.log 2>&1; then
  ok "Estudios: apps de aprendizaje (E3 F45) — $(grep -c '✓' /tmp/jc_apps5.log) comprobaciones"
else
  fallo "Fallan las apps de aprendizaje (E3 F45)"; grep '✗' /tmp/jc_apps5.log
fi

# Entrega 3 · F44 — Estudios: exámenes, entregas y fechas académicas.
if node --import ./scripts/resolver-vite.mjs scripts/test-fechas-academicas.mjs >/tmp/jc_fechas.log 2>&1; then
  ok "Estudios: exámenes, entregas y fechas (E3 F44) — $(grep -c '✓' /tmp/jc_fechas.log) comprobaciones"
else
  fallo "Fallan las fechas académicas (E3 F44)"; grep '✗' /tmp/jc_fechas.log
fi

# Entrega 3 · F43 — Estudios: asignaturas, temario y gestión académica.
if node --import ./scripts/resolver-vite.mjs scripts/test-asignaturas.mjs >/tmp/jc_asig.log 2>&1; then
  ok "Estudios: asignaturas y temario (E3 F43) — $(grep -c '✓' /tmp/jc_asig.log) comprobaciones"
else
  fallo "Falla el sistema de asignaturas (E3 F43)"; grep '✗' /tmp/jc_asig.log
fi

# Entrega 3 · F41 — Estudios: el home tipo teléfono y la arquitectura en árbol.
if node --import ./scripts/resolver-vite.mjs scripts/test-estudios-apps.mjs >/tmp/jc_esapps.log 2>&1; then
  ok "Estudios: el home y el árbol (E3 F41-F42) — $(grep -c '✓' /tmp/jc_esapps.log) comprobaciones"
else
  fallo "Falla el home o el árbol de Estudios (E3 F41-F42)"; grep '✗' /tmp/jc_esapps.log
fi

# Entrega 3 · F40 — Nutrición: el cierre, la QA y el informe final.
if node --import ./scripts/resolver-vite.mjs scripts/test-cierre-nutricion.mjs >/tmp/jc_cierrenu.log 2>&1; then
  ok "Nutrición: cierre y QA (E3 F40) — $(grep -c '✓' /tmp/jc_cierrenu.log) comprobaciones"
else
  fallo "Falla el cierre de Nutrición (E3 F40)"; grep '✗' /tmp/jc_cierrenu.log
fi

# Entrega 3 · F39 — Nutrición: la inteligencia y el análisis.
if node --import ./scripts/resolver-vite.mjs scripts/test-inteligencia-nutricion.mjs >/tmp/jc_intnu.log 2>&1; then
  ok "Nutrición: inteligencia y análisis (E3 F39) — $(grep -c '✓' /tmp/jc_intnu.log) comprobaciones"
else
  fallo "Falla la inteligencia nutricional (E3 F39)"; grep '✗' /tmp/jc_intnu.log
fi

# Entrega 3 · F38 — Nutrición: las estadísticas y la evolución.
if node --import ./scripts/resolver-vite.mjs scripts/test-estadisticas-nutricion.mjs >/tmp/jc_statsnu.log 2>&1; then
  ok "Nutrición: estadísticas y evolución (E3 F38) — $(grep -c '✓' /tmp/jc_statsnu.log) comprobaciones"
else
  fallo "Fallan las estadísticas de Nutrición (E3 F38)"; grep '✗' /tmp/jc_statsnu.log
fi

# Entrega 3 · F37 — Nutrición: la base de alimentos, los propios y los favoritos.
if node --import ./scripts/resolver-vite.mjs scripts/test-mis-alimentos.mjs >/tmp/jc_misalim.log 2>&1; then
  ok "Nutrición: alimentos propios y favoritos (E3 F37) — $(grep -c '✓' /tmp/jc_misalim.log) comprobaciones"
else
  fallo "Fallan los alimentos propios (E3 F37)"; grep '✗' /tmp/jc_misalim.log
fi

# Entrega 3 · F36 — Nutrición: el registro de alimentos.
if node --import ./scripts/resolver-vite.mjs scripts/test-alimentos.mjs >/tmp/jc_alim.log 2>&1; then
  ok "Nutrición: el registro de alimentos (E3 F36) — $(grep -c '✓' /tmp/jc_alim.log) comprobaciones"
else
  fallo "Falla el registro de alimentos (E3 F36)"; grep '✗' /tmp/jc_alim.log
fi

# Entrega 3 · F35 — Nutrición: los objetivos nutricionales.
if node --import ./scripts/resolver-vite.mjs scripts/test-objetivos-nutricion.mjs >/tmp/jc_nuobj.log 2>&1; then
  ok "Nutrición: los objetivos (E3 F35) — $(grep -c '✓' /tmp/jc_nuobj.log) comprobaciones"
else
  fallo "Fallan los objetivos de Nutrición (E3 F35)"; grep '✗' /tmp/jc_nuobj.log
fi

# Entrega 3 · F34 — Nutrición: el sistema de días e historial.
if node --import ./scripts/resolver-vite.mjs scripts/test-nutricion-dias.mjs >/tmp/jc_nudias.log 2>&1; then
  ok "Nutrición: el sistema de días (E3 F34) — $(grep -c '✓' /tmp/jc_nudias.log) comprobaciones"
else
  fallo "Falla el sistema de días de Nutrición (E3 F34)"; grep '✗' /tmp/jc_nudias.log
fi

# Entrega 3 · F33 — Nutrición: el rediseño del apartado.
if node --import ./scripts/resolver-vite.mjs scripts/test-nutricion.mjs >/tmp/jc_nutricion.log 2>&1; then
  ok "Nutrición: rediseño del apartado (E3 F33) — $(grep -c '✓' /tmp/jc_nutricion.log) comprobaciones"
else
  fallo "Falla el apartado Nutrición (E3 F33)"; grep '✗' /tmp/jc_nutricion.log
fi

# Entrega 3 · F32 — Sueño: la ventana móvil de 7 días.
if node --import ./scripts/resolver-vite.mjs scripts/test-sueno-grafica.mjs >/tmp/jc_suenograf.log 2>&1; then
  ok "Sueño: la ventana móvil de 7 días (E3 F32) — $(grep -c '✓' /tmp/jc_suenograf.log) comprobaciones"
else
  fallo "Falla la ventana móvil de Sueño (E3 F32)"; grep '✗' /tmp/jc_suenograf.log
fi

# Entrega 3 · F31 — Sueño: el registro simple.
if node --import ./scripts/resolver-vite.mjs scripts/test-sueno.mjs >/tmp/jc_sueno.log 2>&1; then
  ok "Sueño: registro simple (E3 F31) — $(grep -c '✓' /tmp/jc_sueno.log) comprobaciones"
else
  fallo "Falla el registro de Sueño (E3 F31)"; grep '✗' /tmp/jc_sueno.log
fi

# Entrega 3 · F30 — el apartado Bienestar.
if node --import ./scripts/resolver-vite.mjs scripts/test-bienestar.mjs >/tmp/jc_bienestar.log 2>&1; then
  ok "Bienestar: rediseño del apartado (E3 F30) — $(grep -c '✓' /tmp/jc_bienestar.log) comprobaciones"
else
  fallo "Falla el apartado Bienestar (E3 F30)"; grep '✗' /tmp/jc_bienestar.log
fi

# Entrega 3 · F29 — Productividad: integración global.
if node --import ./scripts/resolver-vite.mjs scripts/test-integracion-pr.mjs >/tmp/jc_intpr.log 2>&1; then
  ok "Productividad: integración global (E3 F29) — $(grep -c '✓' /tmp/jc_intpr.log) comprobaciones"
else
  fallo "Falla la integración de Productividad (E3 F29)"; grep '✗' /tmp/jc_intpr.log
fi

# Entrega 3 · F28 — Productividad: Rutinas.
if node --import ./scripts/resolver-vite.mjs scripts/test-rutinas.mjs >/tmp/jc_rutinas.log 2>&1; then
  ok "Productividad: Rutinas (E3 F28) — $(grep -c '✓' /tmp/jc_rutinas.log) comprobaciones"
else
  fallo "Falla la mini-app Rutinas (E3 F28)"; grep '✗' /tmp/jc_rutinas.log
fi

# Entrega 3 · F27 — Productividad: Metas + Objetivos.
if node --import ./scripts/resolver-vite.mjs scripts/test-metas-objetivos.mjs >/tmp/jc_metasobj.log 2>&1; then
  ok "Productividad: Metas + Objetivos (E3 F27) — $(grep -c '✓' /tmp/jc_metasobj.log) comprobaciones"
else
  fallo "Fallan Metas y Objetivos (E3 F27)"; grep '✗' /tmp/jc_metasobj.log
fi

# Entrega 3 · F26 — Productividad: Tareas.
if node --import ./scripts/resolver-vite.mjs scripts/test-tareas.mjs >/tmp/jc_tareas.log 2>&1; then
  ok "Productividad: Tareas (E3 F26) — $(grep -c '✓' /tmp/jc_tareas.log) comprobaciones"
else
  fallo "Falla la mini-app Tareas (E3 F26)"; grep '✗' /tmp/jc_tareas.log
fi

# Entrega 3 · F25 — Productividad: Pomodoro.
if node --import ./scripts/resolver-vite.mjs scripts/test-pomodoro.mjs >/tmp/jc_pomodoro.log 2>&1; then
  ok "Productividad: Pomodoro (E3 F25) — $(grep -c '✓' /tmp/jc_pomodoro.log) comprobaciones"
else
  fallo "Falla la mini-app Pomodoro (E3 F25)"; grep '✗' /tmp/jc_pomodoro.log
fi

# Entrega 3 · F24 — Productividad: Hábitos.
if node --import ./scripts/resolver-vite.mjs scripts/test-habitos.mjs >/tmp/jc_habitos.log 2>&1; then
  ok "Productividad: Hábitos (E3 F24) — $(grep -c '✓' /tmp/jc_habitos.log) comprobaciones"
else
  fallo "Falla la mini-app Hábitos (E3 F24)"; grep '✗' /tmp/jc_habitos.log
fi

# Entrega 3 · F23 — Productividad como lanzador de mini-apps.
if node --import ./scripts/resolver-vite.mjs scripts/test-productividad-launcher.mjs >/tmp/jc_pr1.log 2>&1; then
  ok "Productividad: el lanzador (E3 F23) — $(grep -c '✓' /tmp/jc_pr1.log) comprobaciones"
else
  fallo "Falla el lanzador de Productividad (E3 F23)"; grep '✗' /tmp/jc_pr1.log
fi

# Entrega 3 · F22 — Biblioteca: integración y experiencia global.
if node --import ./scripts/resolver-vite.mjs scripts/test-biblioteca-global.mjs >/tmp/jc_blglobal.log 2>&1; then
  ok "Biblioteca: integración global (E3 F22) — $(grep -c '✓' /tmp/jc_blglobal.log) comprobaciones"
else
  fallo "Falla la integración de la Biblioteca (E3 F22)"; grep '✗' /tmp/jc_blglobal.log
fi

# Entrega 3 · F21 — Biblioteca: Colecciones.
if node --import ./scripts/resolver-vite.mjs scripts/test-colecciones.mjs >/tmp/jc_cols.log 2>&1; then
  ok "Biblioteca: Colecciones (E3 F21) — $(grep -c '✓' /tmp/jc_cols.log) comprobaciones"
else
  fallo "Falla la mini-app Colecciones (E3 F21)"; grep '✗' /tmp/jc_cols.log
fi

# Entrega 3 · F20 — Biblioteca: Documentos.
if node --import ./scripts/resolver-vite.mjs scripts/test-documentos.mjs >/tmp/jc_docs.log 2>&1; then
  ok "Biblioteca: Documentos (E3 F20) — $(grep -c '✓' /tmp/jc_docs.log) comprobaciones"
else
  fallo "Falla la mini-app Documentos (E3 F20)"; grep '✗' /tmp/jc_docs.log
fi

# Entrega 3 · F19 — Biblioteca: Ideas.
if node --import ./scripts/resolver-vite.mjs scripts/test-ideas.mjs >/tmp/jc_ideas.log 2>&1; then
  ok "Biblioteca: Ideas (E3 F19) — $(grep -c '✓' /tmp/jc_ideas.log) comprobaciones"
else
  fallo "Falla la mini-app Ideas (E3 F19)"; grep '✗' /tmp/jc_ideas.log
fi

# Entrega 3 · F18 — Biblioteca: Guardados.
if node --import ./scripts/resolver-vite.mjs scripts/test-guardados.mjs >/tmp/jc_guardados.log 2>&1; then
  ok "Biblioteca: Guardados (E3 F18) — $(grep -c '✓' /tmp/jc_guardados.log) comprobaciones"
else
  fallo "Falla la mini-app Guardados (E3 F18)"; grep '✗' /tmp/jc_guardados.log
fi

# Entrega 3 · F17 — Biblioteca: Libros.
if node --import ./scripts/resolver-vite.mjs scripts/test-libros.mjs >/tmp/jc_libros.log 2>&1; then
  ok "Biblioteca: Libros (E3 F17) — $(grep -c '✓' /tmp/jc_libros.log) comprobaciones"
else
  fallo "Falla la mini-app Libros (E3 F17)"; grep '✗' /tmp/jc_libros.log
fi

# Entrega 3 · F16 — la Biblioteca como lanzador de seis mini-apps.
if node --import ./scripts/resolver-vite.mjs scripts/test-biblioteca.mjs >/tmp/jc_bib.log 2>&1; then
  ok "Biblioteca: el lanzador de mini-apps (E3 F16) — $(grep -c '✓' /tmp/jc_bib.log) comprobaciones"
else
  fallo "Falla el lanzador de la Biblioteca (E3 F16)"; grep '✗' /tmp/jc_bib.log
fi

# Entrega 3 · F15 — PWA, iPhone y aislamiento: la auditoría que cierra el bloque HC.
if node --import ./scripts/resolver-vite.mjs scripts/test-auditoria-pwa.mjs >/tmp/jc_pwa.log 2>&1; then
  ok "PWA, iPhone y auditoría final (E3 F15) — $(grep -c '✓' /tmp/jc_pwa.log) comprobaciones"
else
  fallo "Falla la auditoría de PWA (E3 F15)"; grep '✗' /tmp/jc_pwa.log
fi

# Entrega 3 · F14 — pulido: esqueletos, vacíos, errores y el revisor de las cinco pantallas.
if node --import ./scripts/resolver-vite.mjs scripts/test-pulido-hc.mjs >/tmp/jc_pul.log 2>&1; then
  ok "Pulido visual y UX (E3 F14) — $(grep -c '✓' /tmp/jc_pul.log) comprobaciones"
else
  fallo "Falla el pulido del bloque Hoy/Calendario (E3 F14)"; grep '✗' /tmp/jc_pul.log
fi

# Entrega 3 · F13 — estadísticas de planificación, contadas sin guardar nada.
if node --import ./scripts/resolver-vite.mjs scripts/test-estadisticas-plan.mjs >/tmp/jc_est.log 2>&1; then
  ok "Estadísticas de planificación (E3 F13) — $(grep -c '✓' /tmp/jc_est.log) comprobaciones"
else
  fallo "Fallan las estadísticas de planificación (E3 F13)"; grep '✗' /tmp/jc_est.log
fi

# Entrega 3 · F12 — calendarios externos: el archivo .ics y lo que necesita Josué.
if node --import ./scripts/resolver-vite.mjs scripts/test-calendarios-externos.mjs >/tmp/jc_cex.log 2>&1; then
  ok "Calendarios externos (E3 F12) — $(grep -c '✓' /tmp/jc_cex.log) comprobaciones"
else
  fallo "Fallan los calendarios externos (E3 F12)"; grep '✗' /tmp/jc_cex.log
fi

# Entrega 3 · F11 — los avisos de eventos y tareas, y lo que la plataforma no puede.
if node --import ./scripts/resolver-vite.mjs scripts/test-avisos-planificacion.mjs >/tmp/jc_avp.log 2>&1; then
  ok "Notificaciones y recordatorios (E3 F11) — $(grep -c '✓' /tmp/jc_avp.log) comprobaciones"
else
  fallo "Fallan los avisos de planificación (E3 F11)"; grep '✗' /tmp/jc_avp.log
fi

# Entrega 3 · F10 — la semana y las tareas que se repiten.
if node --import ./scripts/resolver-vite.mjs scripts/test-semana.mjs >/tmp/jc_sem.log 2>&1; then
  ok "Planificación y vista semanal (E3 F10) — $(grep -c '✓' /tmp/jc_sem.log) comprobaciones"
else
  fallo "Falla la vista semanal (E3 F10)"; grep '✗' /tmp/jc_sem.log
fi

# Entrega 3 · F9 — el ＋ compartido por Hoy, la Agenda y el Calendario.
if node --import ./scripts/resolver-vite.mjs scripts/test-acciones-hoy-agenda.mjs >/tmp/jc_aha.log 2>&1; then
  ok "Acciones rápidas Hoy/Agenda/Calendario (E3 F9) — $(grep -c '✓' /tmp/jc_aha.log) comprobaciones"
else
  fallo "Fallan las acciones rápidas (E3 F9)"; grep '✗' /tmp/jc_aha.log
fi

# Entrega 3 · F8 — el Calendario: las tareas con fecha, el resumen y crear desde ahí.
if node --import ./scripts/resolver-vite.mjs scripts/test-calendario-mes.mjs >/tmp/jc_cmes.log 2>&1; then
  ok "Calendario, vista temporal (E3 F8) — $(grep -c '✓' /tmp/jc_cmes.log) comprobaciones"
else
  fallo "Falla la vista temporal del Calendario (E3 F8)"; grep '✗' /tmp/jc_cmes.log
fi

# Entrega 3 · F7 — la agenda de un día: línea temporal, sin hora, ahora y próximo.
if node --import ./scripts/resolver-vite.mjs scripts/test-agenda-dia.mjs >/tmp/jc_agd.log 2>&1; then
  ok "Agenda de un día (E3 F7) — $(grep -c '✓' /tmp/jc_agd.log) comprobaciones"
else
  fallo "Falla la agenda del día (E3 F7)"; grep '✗' /tmp/jc_agd.log
fi

# Entrega 3 · F6 — Hoy: resumen del día, progreso y apuntes.
if node --import ./scripts/resolver-vite.mjs scripts/test-centro-dia.mjs >/tmp/jc_cdia.log 2>&1; then
  ok "Hoy, centro del día (E3 F6) — $(grep -c '✓' /tmp/jc_cdia.log) comprobaciones"
else
  fallo "Falla el centro del día (E3 F6)"; grep '✗' /tmp/jc_cdia.log
fi

# Entrega 3 · F5 — el borrado real de horarios y la jerarquía de Horario.
if node --import ./scripts/resolver-vite.mjs scripts/test-mis-horarios.mjs >/tmp/jc_mish.log 2>&1; then
  ok "Mis horarios y borrado real (E3 F5) — $(grep -c '✓' /tmp/jc_mish.log) comprobaciones"
else
  fallo "Falla la gestión de horarios (E3 F5)"; grep '✗' /tmp/jc_mish.log
fi

# Entrega 3 · F4 — la hucha de Economía: objetivo, frecuencia y seguimiento.
if node --import ./scripts/resolver-vite.mjs scripts/test-hucha.mjs >/tmp/jc_hucha.log 2>&1; then
  ok "Hucha de Economía (E3 F4) — $(grep -c '✓' /tmp/jc_hucha.log) comprobaciones"
else
  fallo "Falla la hucha de Economía (E3 F4)"; grep '✗' /tmp/jc_hucha.log
fi

# Entrega 3 · F3 — la iconografía del armario y la categoría de ropa interior.
if node scripts/smoke.mjs test-iconos-armario.jsx >/tmp/jc_icon.log 2>&1; then
  ok "Iconografía del armario (E3 F3) — $(grep -c '✓' /tmp/jc_icon.log) comprobaciones"
else
  fallo "Falla la iconografía del armario (E3 F3)"; grep '✗' /tmp/jc_icon.log
fi

# Entrega 3 · F2 — el bloque de mantenimiento de rachas en Hoy y el "+1".
if node --import ./scripts/resolver-vite.mjs scripts/test-rachas-hoy.mjs >/tmp/jc_rhoy.log 2>&1; then
  ok "Mantenimiento de rachas en Hoy (E3 F2) — $(grep -c '✓' /tmp/jc_rhoy.log) comprobaciones"
else
  fallo "Falla el mantenimiento de rachas (E3 F2)"; grep '✗' /tmp/jc_rhoy.log
fi

if node scripts/test-pulido-global.mjs >/tmp/jc_pulido.log 2>&1; then
  ok "Pulido global (E3 F1) — $(grep -c '✓' /tmp/jc_pulido.log) comprobaciones (safe area, acordeones, confirmaciones)"
else
  fallo "Falla el pulido global (safe area / acordeones / confirmaciones)"; grep '✗' /tmp/jc_pulido.log
fi

echo ""
if [ "$FALLOS" -eq 0 ]; then
  printf '\033[32m═══ TODO CORRECTO ═══\033[0m\n\n'; exit 0
else
  printf '\033[31m═══ %s COMPROBACIÓN(ES) FALLIDA(S) ═══\033[0m\n\n' "$FALLOS"; exit 1
fi
