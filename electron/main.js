// Regatta Manager – Desktop (Electron)
// Account-fokussierte Desktop-App: startet direkt in Login/Dashboard (keine
// Startseite). Eingeloggte Nutzer bleiben dank persistenter Session angemeldet.
//
// URL-Quelle:
//   DESKTOP_URL=https://deine-domain.de   -> gehostete (deploye) Version (empfohlen)
//   sonst Fallback http://localhost:3000  -> lokaler Server (Dev)
const { app, BrowserWindow, shell, Menu, session } = require("electron");
const path = require("path");

const BASE_URL = (process.env.DESKTOP_URL || "http://localhost:3000").replace(/\/$/, "");
const START_URL = `${BASE_URL}/start`;
const BASE_ORIGIN = (() => { try { return new URL(BASE_URL).origin; } catch { return null; } })();

let mainWindow = null;
let retalating = false;
let retries = 0;
const MAX_RETRIES = 40; // ~60s warten, falls der Server noch hochfährt

function showConnecting() {
  if (!mainWindow) return;
  const html =
    "data:text/html;charset=utf-8," +
    encodeURIComponent(`
      <html><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
        background:#0a2340;color:#cfe2ff;font-family:Segoe UI,Arial,sans-serif;">
        <div style="text-align:center">
          <div style="font-size:20px;font-weight:800;letter-spacing:.5px">Regatta Manager</div>
          <div style="margin-top:10px;opacity:.8">Verbinde…</div>
        </div>
      </body></html>`);
  mainWindow.loadURL(html);
}

function loadApp() {
  if (!mainWindow) return;
  mainWindow.loadURL(START_URL).catch(() => {});
}

function scheduleRetry() {
  if (retalating) return;
  retalating = true;
  retries += 1;
  if (retries > MAX_RETRIES) { retalating = false; return; }
  showConnecting();
  setTimeout(() => { retalating = false; loadApp(); }, 1500);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0a2340",
    title: "Regatta Manager",
    icon: path.join(__dirname, "..", "public", "app-icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // Standard-Session ist persistent -> Login-Cookie überlebt Neustart.
      partition: "persist:regatta",
    },
  });

  loadApp();

  const wc = mainWindow.webContents;

  // Server noch nicht erreichbar -> erneut versuchen (statt Absturz/Blank).
  wc.on("did-fail-load", (_e, errorCode, _desc, validatedURL) => {
    if (errorCode === -3) return; // abgebrochene Navigation ignorieren
    if (validatedURL && validatedURL.startsWith(BASE_URL)) scheduleRetry();
  });

  // Erfolgreich geladen -> Retry-Zähler zurücksetzen.
  wc.on("did-finish-load", () => { retries = 0; });

  // Renderer abgestürzt/eingefroren -> neu laden statt App killen.
  wc.on("render-process-gone", () => { setTimeout(loadApp, 800); });
  wc.on("unresponsive", () => { try { wc.reloadIgnoringCache(); } catch {} });

  // Externe Links (anderer Origin, z.B. Stripe) im System-Browser öffnen.
  wc.setWindowOpenHandler(({ url }) => {
    try {
      if (!BASE_ORIGIN || new URL(url).origin !== BASE_ORIGIN) {
        shell.openExternal(url);
        return { action: "deny" };
      }
    } catch { /* ignore */ }
    return { action: "allow" };
  });
  wc.on("will-navigate", (event, url) => {
    try {
      if (BASE_ORIGIN && new URL(url).origin !== BASE_ORIGIN) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch { /* ignore */ }
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { label: "Datei", submenu: [{ role: "quit", label: "Beenden" }] },
      {
        label: "Ansicht",
        submenu: [
          { role: "reload", label: "Neu laden" },
          { role: "forceReload", label: "Hart neu laden" },
          { type: "separator" },
          { role: "resetZoom", label: "Zoom zurücksetzen" },
          { role: "zoomIn", label: "Vergrößern" },
          { role: "zoomOut", label: "Verkleinern" },
          { type: "separator" },
          { role: "togglefullscreen", label: "Vollbild" },
          { role: "toggleDevTools", label: "Entwicklertools" },
        ],
      },
    ])
  );

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
