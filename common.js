/* common.js — utilidades compartidas por index.html y admin.html
 *
 * Cifrado: cada asignación (a quién le regalas) se guarda cifrada con el PIN
 * de esa persona usando Web Crypto (PBKDF2 + AES-GCM). Sin el PIN no se puede
 * leer, ni siquiera abriendo config.js en el repositorio.
 */
window.AS = (() => {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const ITERACIONES = 200000; // PBKDF2: más alto = más lento adivinar un PIN por fuerza bruta
  const RELLENO = 96;         // bytes; todos los cifrados miden igual para no delatar el largo del nombre

  const b64 = {
    codificar: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))),
    decodificar: (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0)),
  };

  async function derivarClave(pin, salt) {
    const base = await crypto.subtle.importKey('raw', enc.encode(String(pin).trim()), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: ITERACIONES, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function cifrar(texto, pin) {
    const bytes = enc.encode(texto);
    const relleno = new Uint8Array(Math.max(RELLENO, bytes.length)).fill(32); // espacios
    relleno.set(bytes);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const clave = await derivarClave(pin, salt);
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, clave, relleno);
    return { salt: b64.codificar(salt), iv: b64.codificar(iv), data: b64.codificar(data) };
  }

  // Lanza una excepción si el PIN es incorrecto (AES-GCM verifica la integridad).
  async function descifrar(entrada, pin) {
    const clave = await derivarClave(pin, b64.decodificar(entrada.salt));
    const plano = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64.decodificar(entrada.iv) },
      clave,
      b64.decodificar(entrada.data)
    );
    return dec.decode(plano).trim();
  }

  // Entero aleatorio seguro en [0, max), sin sesgo de módulo.
  function aleatorio(max) {
    const limite = Math.floor(2 ** 32 / max) * max;
    let x;
    do { x = crypto.getRandomValues(new Uint32Array(1))[0]; } while (x >= limite);
    return x % max;
  }

  return { cifrar, descifrar, aleatorio };
})();
