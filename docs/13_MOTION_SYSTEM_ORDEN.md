# docs/13_MOTION_SYSTEM_ORDEN.md — las 21 fases del Motion System

> **Qué es esto.** Josué pasó el 2026-10-04 un documento de **17 913 líneas** con **21 fases** (de la
> F0 a la F20) para construir *"el sistema de movimiento de Jos Style"*: no añadir animaciones, sino
> un lenguaje de movimiento propio, con tokens, jerarquía, accesibilidad y pruebas. La especificación
> literal está en `especificaciones/ORIGINAL_MOTION_SYSTEM.txt` 🔒 **intocable**.

## 🚨 LAS FASES VIENEN DESORDENADAS, Y ÉL LO AVISÓ

*"Están desordenadas, pero ordenadlas. Y volverás y ejecutarás todas y no pares hasta acabarlo."*

El archivo empieza por la **F16** (línea 1), sigue con la **F17, F18, F19 y F20**, y solo entonces
viene la **F0** (línea 4046) y de ahí la **F1 a la F15**. Esta tabla existe para eso: **se construye de
la F0 a la F20**, y aquí está dónde vive cada una.

⚠️ **No se reordena el archivo.** Es transcripción literal, como `ORIGINAL_ENTREGA4_FITNESS.txt`. Lo que
se ordena es **el trabajo**.

## El orden de construcción

| | Fase | Líneas | Tamaño |
|---|---|---|---|
| **F0** ✅ **v3.130.0** | Auditoría total, arquitectura y plan maestro | 4046–4899 | 854 |
| **F1** | Motor de movimiento + tokens + primitivas | 4900–5490 | 591 |
| **F2** | Navegación, transiciones y continuidad espacial | 6038–6770 | 733 |
| **F3** | Microinteracciones, componentes y feedback | 6771–7586 | 816 |
| **F4** | Datos dinámicos, listas, gráficas y estados | 7587–8404 | 818 |
| **F5** | Física, gestos, touch y comportamiento táctil | 8405–9145 | 741 |
| **F6** | Profundidad, capas, z-index y contexto visual | 9146–9922 | 777 |
| **F7** | Continuidad espacial, shared elements y transiciones entre vistas | 9923–10687 | 765 |
| **F8** | Física, springs, gestos e interacción directa | 10688–11379 | 692 |
| **F9** | Microinteracciones, estados y feedback de interfaz | 11380–12127 | 748 |
| **F10** | Layout motion, scroll, listas y contenido dinámico | 12128–12784 | 657 |
| **F11** | Orquestación global, coordinación y motion engine avanzado | 13290–14127 | 838 |
| **F12** | Accesibilidad, reduced motion, adaptive motion y calidad de experiencia | 14966–15717 | 752 |
| **F13** | Rendimiento extremo, GPU, frame budget y optimización | 15718–16452 | 735 |
| **F14** | Easings, curvas, ritmo, aceleración y lenguaje visual del movimiento | 16453–17154 | 702 |
| **F15** | Motion responsive, orientación, safe areas y multidispositivo | 17155–17913 | 759 |
| **F16** | Estados de sistema, loading, error, offline, sync y transiciones asíncronas | 1–759 | 759 |
| **F17** | Motion de datos, dashboard, métricas, gráficas y visualización | 760–1458 | 699 |
| **F18** | Motion visual polish, brand language y coherencia sensorial | 1459–2241 | 783 |
| **F19** | Testing extremo, validación, regresión y motion QA automatizado | 2242–3117 | 876 |
| **F20** | Finalización, consolidación, contratos y sellado | 3118–4045 | 928 |

🏁 **La F20 es la última**: su texto dice *"No generar una FASE 21 del Motion System"*.

## Lo que el documento trae repetido (C-51)

| Líneas | Qué es | Qué se hace |
|---|---|---|
| 5491–6037 | **Una primera versión de la F2**, cortada a media palabra (*"naveg"*) | Se construye la segunda (6038–6770), que está entera y dice lo mismo con más detalle. |
| 12785–13289 | **Una F11 distinta**: *"Navegación global, back, routing y transiciones de sistema"*, cortada en su apartado 41 (*"Si el proyecto"*) | La F11 que se construye es la de **orquestación**, que está entera y es a la que encadena la F10. Lo que pedía el borrador —back, routing, swipe-back, foco al navegar— lo cubren la **F2** y la pila de navegación de **NAVO F1**, y la F11 lo repasa al orquestar. |
| 14128–14965 | **La F11 de orquestación, copiada otra vez** | Idéntica línea por línea (comprobado con `diff`). Se ignora la copia. |

Y **cinco temas que se pisan entre fases** (navegación, microinteracciones, física, listas y datos,
lenguaje). Cómo se reparten está en `SOLAPES_ROADMAP` (`src/lib/motionMapa.js`) y en `docs/03`.

## Dónde vive el sistema

| Pieza | Dónde |
|---|---|
| El inventario, la jerarquía, el presupuesto, el plan y la auditoría | `src/lib/motionMapa.js` (F0) |
| El documento del sistema (las reglas, para cualquier pantalla nueva) | `docs/MOTION_SYSTEM.md` |
| El mapa elemento a elemento (**generado**, no se edita a mano) | `docs/MOTION_MAP.md` ← `scripts/generar-motion-map.mjs` |
| La prueba de la F0 | `scripts/test-motion-f0.mjs` |
