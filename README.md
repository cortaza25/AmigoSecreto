# 🎁 Amigo Secreto con ruleta

Aplicación web para jugar amigo secreto. Cada persona entra con su nombre y su PIN, gira la ruleta
y descubre a quién le regala. Solo puede girar **una vez**, desde cualquier dispositivo.

- La página se publica gratis en **GitHub Pages** (solo HTML + JS).
- Los datos se guardan en **Firebase Firestore** (plan gratuito de Google).
- El organizador crea el juego desde `admin.html` sin tocar código ni el repositorio.

## Archivos

| Archivo              | Para qué sirve                                                        |
|----------------------|-----------------------------------------------------------------------|
| `index.html`         | La app de los participantes (ruleta). Se abre con `#e=ID` del juego.  |
| `admin.html`         | Panel del organizador: crea el juego, muestra PIN y quién ya giró.    |
| `common.js`          | Cifrado y utilidades compartidas.                                     |
| `firebase-config.js` | Claves públicas del proyecto Firebase.                                |
| `firestore.rules`    | Reglas de seguridad de la base de datos (se pegan en la consola).     |

## Configuración inicial (una sola vez, el desarrollador)

1. En https://console.firebase.google.com crea un proyecto y dentro **Firestore Database → Crear base de datos**
   (modo producción).
2. ⚙️ Configuración del proyecto → Tus apps → **Web** → copia el `firebaseConfig` en `firebase-config.js`.
3. Firestore Database → pestaña **Reglas** → pega el contenido de `firestore.rules` → **Publicar**.
4. Sube los archivos a GitHub y activa **Settings → Pages → Deploy from a branch** (`main`, `/ (root)`).

## Uso (organizador, cada vez que haya un juego)

1. Abre `https://TU-USUARIO.github.io/amigosecreto/admin.html`.
2. Escribe el nombre del evento y los participantes (uno por línea) → **Crear juego**.
3. Copia el **enlace del juego** y compártelo con todos.
4. Copia la **lista de PIN** y envía a cada persona el suyo por privado.
   ⚠️ Los PIN solo se muestran en ese navegador; guárdalos en ese momento.
5. Guarda tu **enlace de organizador** para ver en vivo quién ya giró.

## ¿Cómo funciona por dentro?

Todo el sorteo ocurre en el navegador del organizador al crear el juego. Del PIN de cada persona se
derivan (PBKDF2, 200.000 iteraciones) dos cosas:

- un **token**, que es el nombre del documento donde vive su asignación. Sin el PIN no se puede ni pedir
  ese documento (las reglas prohíben listar la colección);
- una **clave AES-GCM**, con la que la asignación está cifrada.

Dentro del cifrado viaja un secreto (`nonce`). Para marcar "ya giró" hay que presentarlo, y las reglas
lo comparan con su hash. Así nadie puede marcar a otra persona ni girar dos veces.

Ni el organizador ni el dueño del proyecto Firebase pueden ver quién le tocó a quién.

Estructura en Firestore:

```
eventos/{id}                      { nombre, creado, participantes: [...] }
eventos/{id}/asignaciones/{token} { nombre, iv, data }        ← cifrado
eventos/{id}/huellas/{nombre}     { huella }                  ← solo lo leen las reglas
eventos/{id}/estado/{nombre}      { giro, fecha, prueba }     ← "ya giró"
```

## Personalizar

- Colores y tipografía: variables `--rosa`, `--acento`, etc. al inicio de `index.html`.
- Colores de la ruleta: constante `COLORES` en `index.html`.
- Duración del giro: `duracion` (ms) en la función `girar()`.
