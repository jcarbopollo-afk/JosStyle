// Fase A5 — Seguridad avanzada (Entrega 1 de la especificación extendida, apartados 139-172):
// biometría confirmada por Josué (Face ID / Touch ID / huella, apartados 144-145).
//
// Límite honesto, muy importante — léase antes de tocar esto: usa WebAuthn (`navigator.credentials`)
// del navegador, pero SIN servidor que genere el "challenge" ni verifique la firma criptográfica
// — no hay backend de autenticación para eso en este proyecto (sería la "arquitectura de
// autenticación" completa del apartado 169, que no existe aquí). Por eso esto es un GESTO DE
// DESBLOQUEO RÁPIDO LOCAL, con el mismo nivel de confianza que el PIN ya existente (que también
// se compara en el propio dispositivo, en texto plano) — no una autenticación remota más segura
// ni un sustituto de la sesión real de Supabase. Lo que sí aporta de verdad: el sistema operativo
// exige Face ID/Touch ID/huella real antes de resolver la promesa (`userVerification: 'required'`),
// así que nadie desbloquea las secciones protegidas solo con acceso físico al móvil desbloqueado
// — hace falta tu cara o tu huella. El PIN sigue siendo obligatorio como respaldo (apartado 145)
// y como paso previo para poder activar la biometría (apartado 141: Acceso = PIN/Biometría).

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
function base64ToBuffer(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

export function biometriaSoportada() {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}

// Crea una credencial WebAuthn ligada a este dispositivo/navegador (no viaja a ningún servidor).
// Devuelve el id de la credencial en base64 para guardarlo en `ajustes.seguridad.biometriaCredencialId`.
export async function registrarBiometria(userId, nombre) {
  if (!biometriaSoportada()) throw new Error('Este navegador no soporta biometría (WebAuthn).');
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Sistema Operativo Personal' },
      user: { id: new TextEncoder().encode(userId), name: nombre || 'usuario', displayName: nombre || 'usuario' },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
      timeout: 60000,
      attestation: 'none',
    },
  });
  if (!credential) throw new Error('No se pudo crear la credencial biométrica.');
  return bufferToBase64(credential.rawId);
}

// Pide la verificación biométrica real al sistema operativo. Devuelve true/false — nunca lanza
// (cancelar, fallo biométrico repetido o credencial no disponible en este dispositivo → false).
export async function verificarBiometria(credencialId) {
  if (!biometriaSoportada() || !credencialId) return false;
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: base64ToBuffer(credencialId), type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}
