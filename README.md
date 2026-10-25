# The Backrooms – Móvil 22

Terror cooperativo para celular. Cuatro policías esqueleto atrapados en los Backrooms:
6 capítulos de historia, modo supervivencia, multijugador por código de sala entre
Android y iPhone, chat de voz por cercanía y radio, y un doppelgänger que imita a tus amigos.

## Descargar

- **Android:** descargá el APK de la última versión →
  [Backrooms-Movil22.apk](../../releases/latest/download/Backrooms-Movil22.apk)
  (la primera vez Android pide permitir "instalar apps de origen desconocido").
- **PC (Windows):** [Backrooms-Movil22.exe](../../releases/latest/download/Backrooms-Movil22.exe)
  — doble clic y juega, no se instala nada. Si Windows muestra "Windows protegió su PC",
  tocá *Más información → Ejecutar de todas formas* (pasa con cualquier programa sin firma paga).
- **iPhone:** abrí la página del juego en Safari (ver *Settings → Pages* del repositorio),
  tocá Compartir → **Agregar a pantalla de inicio**. Queda como app a pantalla completa.

## Cómo se arma

Cada vez que se sube un cambio a `main`, GitHub Actions:
1. copia `www/` dentro del proyecto Android (`android/`) y compila el APK firmado;
2. lo publica en *Releases*;
3. publica `www/` en GitHub Pages para jugar desde iPhone o cualquier navegador.

## Estructura

- `www/` – el juego (WebGL2 propio, sin librerías): `js/world.js` niveles e iluminación,
  `js/sim.js` IA e historia, `js/gfx.js` motor 3D, `js/game.js` juego y controles,
  `js/net.js` salas (MQTT público), `js/voice.js` voz (WebRTC).
- `android/` – app Android mínima (WebView a pantalla completa con permiso de micrófono).

La clave `android/app/juego.keystore` es solo para firmar estas descargas caseras; no sirve
para publicar en Play Store.
