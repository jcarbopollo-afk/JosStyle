// Fase de Seguridad Centralizada — hashing del PIN con la Web Crypto API nativa del navegador
// (SHA-256 + salt aleatorio de 16 bytes por usuario), sin dependencias nuevas ni backend propio
// más allá del proxy de IA ya existente. Sustituye la comparación en texto plano que tenía el PIN
// hasta ahora (ver HANDOFF.md / CHANGELOG.md de esta fase para el detalle de la migración).
//
// Nota honesta sobre el límite real de esta mejora: SHA-256 simple es un hash RÁPIDO, no una
// función pensada para contraseñas (tipo bcrypt/argon2/scrypt, con coste computacional ajustable).
// Sin acceso a npm en este entorno no hay forma de instalar una librería de ese tipo, así que esta
// solución no es resistente a fuerza bruta si alguien consiguiera una copia directa de la fila de
// Supabase — pero ya no es legible a simple vista como antes, que es la mejora real y honesta que
// se puede dar aquí. El salt por usuario sí evita ataques de tabla precalculada (rainbow tables)
// entre distintas cuentas.

function bytesAHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generarSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return bytesAHex(bytes);
}

export async function hashPin(pin, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bytesAHex(new Uint8Array(hashBuffer));
}

// Genera un par (hash, salt) nuevo para un PIN en claro recién introducido — usado al crear o
// cambiar el PIN, y en la migración de un PIN antiguo en texto plano (App.jsx).
export async function crearPinHash(pin) {
  const salt = generarSalt();
  const pinHash = await hashPin(pin, salt);
  return { pinHash, pinSalt: salt };
}

// Compara un intento contra el hash guardado. Nunca expone el PIN real: solo devuelve true/false.
export async function verificarPin(intento, pinHash, pinSalt) {
  if (!intento || !pinHash || !pinSalt) return false;
  const hashIntento = await hashPin(intento, pinSalt);
  return hashIntento === pinHash;
}
