// ---------------------------------------------------------------------------
// Hook de resolución para poder ejecutar con Node los módulos de src/ tal y
// como están escritos.
//
// EL PROBLEMA
// Todo el proyecto importa sin extensión (`from './helpers'`), porque Vite lo
// resuelve solo. Node, en modo ESM, exige la extensión (`from './helpers.js'`).
// Eso significaba que las funciones puras del proyecto — que son perfectamente
// testeables — no se podían ejecutar fuera del navegador.
//
// LA SOLUCIÓN
// Este hook añade la extensión cuando falta, exactamente igual que hace Vite.
// Así se pueden escribir pruebas de verdad sin tocar ni una línea de src/ ni
// cambiar la convención de imports del proyecto.
//
// Uso:  node --import ./scripts/resolver-vite.mjs scripts/test-loquesea.mjs
// ---------------------------------------------------------------------------
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

const EXTENSIONES = ['.js', '.jsx', '.mjs', '/index.js'];

export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    // Solo intervenimos cuando el fallo es "no encuentro el módulo" y el
    // especificador es relativo: cualquier otro error se propaga tal cual.
    if (error.code !== 'ERR_MODULE_NOT_FOUND' || !especificador.startsWith('.')) throw error;

    const base = new URL(especificador, contexto.parentURL);
    for (const ext of EXTENSIONES) {
      const candidato = new URL(base.href + ext);
      if (existsSync(candidato)) return siguiente(especificador + ext, contexto);
    }
    throw error;
  }
}

// Al importarse con `node --import`, se registra a sí mismo como hook.
register(pathToFileURL(import.meta.filename));
