# 🎁 Amigo Secreto con ruleta

Aplicación web estática (solo HTML + JS, sin servidor) para jugar amigo secreto.
Cada persona entra con su nombre y su PIN, gira la ruleta y descubre a quién le regala.
Funciona gratis en **GitHub Pages**.

## ¿Cómo funciona el "bloqueo" sin servidor?

GitHub Pages no tiene base de datos, así que no hay dónde guardar "quién ya giró".
La solución es que **el sorteo se hace una sola vez**, cuando el organizador genera `config.js`:

1. El organizador escribe los nombres en `admin.html` y pulsa *Generar sorteo*.
2. En ese momento se asigna a cada persona su amigo secreto y un PIN.
3. Cada asignación se guarda **cifrada con el PIN de esa persona** (AES-GCM + PBKDF2).
   Sin el PIN no se puede leer, ni abriendo el archivo del repositorio, ni siendo el organizador.
4. La ruleta es la animación: siempre cae en la persona que ya le tocó.

Por eso volver a girar no sirve de nada: el resultado es el mismo. Además, la app recuerda en el
navegador (`localStorage`) que esa persona ya giró y le muestra el resultado sin el botón de girar.

> Ese recuerdo es por navegador. Si alguien entra desde otro celular, verá el botón de girar otra vez,
> pero la ruleta caerá en la misma persona. Para un bloqueo real entre dispositivos haría falta un
> backend (por ejemplo Firebase), que se puede agregar después si lo necesitan.

## Archivos

| Archivo      | Para qué sirve                                                   |
|--------------|------------------------------------------------------------------|
| `index.html` | La app que usan los participantes (ruleta).                      |
| `admin.html` | Panel del organizador: genera el sorteo, los PIN y `config.js`.  |
| `config.js`  | El sorteo cifrado. Se reemplaza con el que genera `admin.html`.  |
| `common.js`  | Funciones de cifrado compartidas.                                |

El `config.js` incluido es un **ejemplo** para probar (PIN: Ana 1111, Carlos 2222, Daniela 3333,
Esteban 4444, Laura 5555, Mateo 6666).

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (por ejemplo `amigo-secreto`) y sube estos archivos.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   rama `main`, carpeta `/ (root)`. Guarda.
3. En un minuto la app queda en `https://TU-USUARIO.github.io/amigo-secreto/`.

## Uso (organizador)

1. Abre `https://TU-USUARIO.github.io/amigo-secreto/admin.html` (o el archivo local).
2. Escribe el nombre del evento y los participantes, uno por línea. Pulsa **Generar sorteo**.
3. Envía a cada persona su PIN **en privado** (botón *Copiar lista de PIN*).
4. Descarga `config.js`, reemplaza el del repositorio y sube el cambio.
5. Comparte el enlace de la app. ¡Listo!

⚠️ No vuelvas a generar después de repartir los PIN: cambiarían las asignaciones.

## Personalizar

- Colores y tipografía: variables `--rosa`, `--acento`, etc. al inicio de `index.html`.
- Colores de la ruleta: constante `COLORES` en `index.html`.
- Duración del giro: `duracion` (ms) en la función `girar()`.
