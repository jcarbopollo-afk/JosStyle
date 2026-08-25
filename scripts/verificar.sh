#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Verificación automática de JC Fitness.
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

if node scripts/smoke.mjs test-modulos.jsx >/tmp/jc_mod.log 2>&1; then
  ok "Módulos activables (ME F1) — $(grep -c '✓' /tmp/jc_mod.log) comprobaciones"
else
  fallo "Fallan pruebas del sistema de módulos"; grep '✗' /tmp/jc_mod.log
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

# --- Regla 3: ningún color hexadecimal suelto fuera de tokens.js ---
# Exclusiones, todas documentadas y justificadas (ver docs/01 §11 y CHANGELOG v1.11.0):
#   · tokens.js      — es la definición del sistema de tokens
#   · colorEngine.js — es el motor de color; sus candidatos de texto SON el sistema
#   · #EDEFF2        — icono de borrar foto sobre un scrim oscuro fijo, intencionado
#   · líneas de comentario — mencionar un hex al explicar una decisión no es usarlo
HEX=$(grep -rEn "#[0-9A-Fa-f]{6}" src/ --include=*.jsx --include=*.js \
      | grep -v '^src/tokens.js:' \
      | grep -v '^src/lib/colorEngine.js:' \
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
node scripts/comprobar-navegacion.mjs || FALLOS=$((FALLOS+1))

echo ""
if [ "$FALLOS" -eq 0 ]; then
  printf '\033[32m═══ TODO CORRECTO ═══\033[0m\n\n'; exit 0
else
  printf '\033[31m═══ %s COMPROBACIÓN(ES) FALLIDA(S) ═══\033[0m\n\n' "$FALLOS"; exit 1
fi
