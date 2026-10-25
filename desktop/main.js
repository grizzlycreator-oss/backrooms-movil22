// Backrooms - Móvil 22 · versión PC (ventana propia, sin navegador ni instalación)
const { app, BrowserWindow, protocol, net, session, Menu } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

// esquema propio "app://" con contexto seguro: permite micrófono y cargar los archivos del juego
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }
]);

function crear() {
  const www = path.join(__dirname, "www");
  protocol.handle("app", (req) => {
    const u = new URL(req.url);
    let p = decodeURIComponent(u.pathname);
    if (p === "/" || p === "") p = "/index.html";
    const archivo = path.normalize(path.join(www, p));
    if (!archivo.startsWith(www)) return new Response("no", { status: 403 });
    return net.fetch(pathToFileURL(archivo).toString());
  });
  session.defaultSession.setPermissionRequestHandler((wc, permiso, cb) => {
    cb(permiso === "media" || permiso === "pointerLock" || permiso === "fullscreen");
  });
  session.defaultSession.setPermissionCheckHandler((wc, permiso) => permiso === "media");
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    width: 1280, height: 720, backgroundColor: "#000000", title: "Backrooms Móvil 22",
    icon: path.join(__dirname, "www", "assets", "icon512.png"),
    webPreferences: { contextIsolation: true, backgroundThrottling: false }
  });
  win.webContents.on("before-input-event", (e, input) => {
    if (input.type === "keyDown" && input.key === "F11") { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  win.loadURL("app://juego/index.html");
}

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.whenReady().then(crear);
app.on("window-all-closed", () => app.quit());
