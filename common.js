/* common.js — utilidades compartidas por index.html y admin.html
 *
 * Seguridad del juego (todo ocurre en el navegador, Firestore solo guarda datos cifrados):
 *
 *  - Del PIN de cada persona se derivan (PBKDF2, 200.000 iteraciones) dos cosas:
 *      · token: el "nombre" del documento donde está su asignación. Sin el PIN no se
 *        puede ni siquiera pedir ese documento a Firestore (las reglas prohíben listar).
 *      · clave AES: con la que está cifrada la asignación (a quién le regala).
 *  - Dentro del cifrado viaja también un "nonce" secreto. Para marcar "ya giró" hay que
 *    presentar ese nonce, así nadie puede marcar a otra persona.
 *
 * Ni el organizador ni el dueño del proyecto Firebase pueden ver las asignaciones.
 */
window.AS = (() => {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const ITERACIONES = 200000; // más alto = más lento adivinar un PIN por fuerza bruta
  const RELLENO = 192;        // bytes; todos los cifrados miden igual para no delatar el largo del nombre

  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const b64 = {
    codificar: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))),
    decodificar: (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0)),
  };

  // Salt determinista: cada persona tiene el suyo dentro de cada evento.
  const salt = (idEvento, nombre) => idEvento + ':' + nombre;

  // Deriva { token, clave } a partir del PIN.
  async function derivar(pin, saltTexto) {
    const base = await crypto.subtle.importKey('raw', enc.encode(String(pin).trim()), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(saltTexto), iterations: ITERACIONES, hash: 'SHA-256' },
      base,
      512
    ));
    const token = hex(bits.slice(0, 32));
    const clave = await crypto.subtle.importKey('raw', bits.slice(32), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    return { token, clave };
  }

  async function cifrar(texto, clave) {
    const bytes = enc.encode(texto);
    const relleno = new Uint8Array(Math.max(RELLENO, bytes.length)).fill(32); // espacios
    relleno.set(bytes);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, clave, relleno);
    return { iv: b64.codificar(iv), data: b64.codificar(data) };
  }

  // Lanza una excepción si la clave no corresponde (AES-GCM verifica la integridad).
  async function descifrar(entrada, clave) {
    const plano = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64.decodificar(entrada.iv) },
      clave,
      b64.decodificar(entrada.data)
    );
    return dec.decode(plano).trim();
  }

  async function sha256hex(texto) {
    return hex(await crypto.subtle.digest('SHA-256', enc.encode(texto)));
  }

  // Entero aleatorio seguro en [0, max), sin sesgo de módulo.
  function aleatorio(max) {
    const limite = Math.floor(2 ** 32 / max) * max;
    let x;
    do { x = crypto.getRandomValues(new Uint32Array(1))[0]; } while (x >= limite);
    return x % max;
  }

  const hexAleatorio = (bytes) => hex(crypto.getRandomValues(new Uint8Array(bytes)));

  function idAleatorio(largo) {
    const letras = 'abcdefghjkmnpqrstuvwxyz23456789'; // sin caracteres confusos (0/o, 1/l)
    let id = '';
    for (let i = 0; i < largo; i++) id += letras[aleatorio(letras.length)];
    return id;
  }

  // Firestore reintenta para siempre si no hay conexión; esto pone un límite.
  function conTiempo(promesa, ms) {
    return Promise.race([
      promesa,
      new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('sin-conexion')), ms)),
    ]);
  }
  const MENSAJE_SIN_CONEXION = 'No se pudo conectar con la base de datos. Revisa tu conexión (y, si eres el desarrollador, que Firestore esté creado y las reglas publicadas).';

  // URL base de la app (sirve igual en GitHub Pages, en local o en una subcarpeta).
  const urlBase = () => location.origin + location.pathname.replace(/[^/]*$/, '');

  return { salt, derivar, cifrar, descifrar, sha256hex, aleatorio, hexAleatorio, idAleatorio, urlBase, conTiempo, MENSAJE_SIN_CONEXION };
})();
