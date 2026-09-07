// ============================================================================
// LA VERSIÓN QUE ESTÁS VIENDO
//
// 🚨 Nació de tres días perdidos. Josué tenía el sonido mudo en su iPhone
// mientras funcionaba en su PC y en otros dos móviles, y **no había forma de
// saber qué versión tenía delante**. Su iPhone la tiene añadida a la pantalla de
// inicio, y en iOS eso puede seguir sirviendo la página vieja mucho después de
// publicar.
//
// Sin este dato, "el arreglo no funciona" y "el arreglo no le ha llegado" se ven
// exactamente igual — y se investigan de manera opuesta. Con él, se distingue en
// una frase.
//
// ⚠️ Los dos valores los pone Vite al compilar (`define` en `vite.config.js`), y
// la versión sale de `package.json`, que es donde ya vivía. En Node —las
// pruebas— esos nombres no existen, y por eso se miran con `typeof` antes de
// usarlos en vez de dar por hecho que están.
// ============================================================================

/* eslint-disable no-undef */
export const VERSION = typeof __JOSSTYLE_VERSION__ !== 'undefined' ? __JOSSTYLE_VERSION__ : 'desarrollo';
export const COMPILADA = typeof __JOSSTYLE_BUILD__ !== 'undefined' ? __JOSSTYLE_BUILD__ : '';
/* eslint-enable no-undef */

/** Una línea corta para enseñar en pantalla. `v3.55.0 · 2026-09-07 18:04` */
export const sello = () => (COMPILADA ? `v${VERSION} · ${COMPILADA}` : `v${VERSION}`);
