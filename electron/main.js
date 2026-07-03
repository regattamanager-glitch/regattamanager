// Regatta Manager – Desktop (Electron)
// Eigenständige, lokal laufende App (wie MT5 / GitHub Desktop):
//  - INSTALLIERT (paketiert): startet den GEBÜNDELTEN Next.js-Server lokal,
//    kein Vercel, kein Projektordner nötig (nur Internet für die Neon-DB).
//  - DEV (nicht paketiert): startet `next dev` aus dem Projekt.
//  - DESKTOP_URL gesetzt: nutzt stattdessen die gehostete Adresse.
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawn } = require("child_process");

const HOSTED = !!process.env.DESKTOP_URL;
const PORT = Number(process.env.DESKTOP_PORT || (app.isPackaged ? 38123 : 3000));
const BASE_URL = (process.env.DESKTOP_URL || `http://127.0.0.1:${PORT}`).replace(/\/$/, "");
const START_URL = `${BASE_URL}/start`;
const BASE_ORIGIN = (() => { try { return new URL(BASE_URL).origin; } catch { return null; } })();
const PROJECT_ROOT = path.join(__dirname, "..");

let mainWindow = null;
let serverProc = null;
let busyRetry = false;
let retries = 0;
const MAX_RETRIES = 160;

/* ------------------------------- Env-Parser ------------------------------- */
function parseEnvFile(file) {
  const out = {};
  try {
    const txt = fs.readFileSync(file, "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!m || line.trim().startsWith("#")) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[m[1]] = v;
    }
  } catch { /* ignore */ }
  return out;
}

function loadBundledEnv(dir) {
  // .env.local hat Vorrang vor .env (wie bei Next).
  return { ...parseEnvFile(path.join(dir, ".env")), ...parseEnvFile(path.join(dir, ".env.local")) };
}

/* ---------------------------- Server-Management --------------------------- */
function isServerUp() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${PORT}/`, (r) => { r.destroy(); resolve(true); });
    req.on("error", () => resolve(false));
    req.setTimeout(1200, () => { req.destroy(); resolve(false); });
  });
}

async function ensureServer() {
  if (HOSTED) return;                       // gehostet -> nichts starten
  if (await isServerUp()) return;           // läuft bereits

  if (app.isPackaged) {
    // Gebündelter Standalone-Server (resources/standalone/server.js),
    // ausgeführt durch Electrons eigenes Node (ELECTRON_RUN_AS_NODE).
    const dir = path.join(process.resourcesPath, "standalone");
    const serverJs = path.join(dir, "server.js");
    serverProc = spawn(process.execPath, [serverJs], {
      cwd: dir,
      env: {
        ...process.env,
        ...loadBundledEnv(dir),
        ELECTRON_RUN_AS_NODE: "1",
        NODE_ENV: "production",
        PORT: String(PORT),
        HOSTNAME: "127.0.0.1",
      },
      stdio: "ignore",
      windowsHide: true,
    });
  } else {
    // Dev: next aus dem Projekt starten (prod-Build falls vorhanden, sonst dev)
    const built = fs.existsSync(path.join(PROJECT_ROOT, ".next", "BUILD_ID"));
    const nextBin = path.join(
      PROJECT_ROOT, "node_modules", ".bin",
      process.platform === "win32" ? "next.cmd" : "next"
    );
    serverProc = spawn(nextBin, [built ? "start" : "dev", "-p", String(PORT)], {
      cwd: PROJECT_ROOT,
      env: { ...process.env },
      shell: true,
      windowsHide: true,
      stdio: "ignore",
    });
  }
  serverProc.on("error", (e) => console.error("Server-Start fehlgeschlagen:", e));
}

function killServer() {
  if (!serverProc || serverProc.killed) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(serverProc.pid), "/T", "/F"]);
    } else {
      serverProc.kill("SIGTERM");
    }
  } catch { /* ignore */ }
  serverProc = null;
}

/* --------------------------------- Fenster -------------------------------- */
function showConnecting() {
  if (!mainWindow) return;
  const html = "data:text/html;charset=utf-8," + encodeURIComponent(`
    <html><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
      background:#0a2340;color:#cfe2ff;font-family:Segoe UI,Arial,sans-serif;">
      <div style="text-align:center">
        <div style="font-size:20px;font-weight:800;letter-spacing:.5px">Regatta Manager</div>
        <div style="margin-top:10px;opacity:.8">Startet…</div>
      </div></body></html>`);
  mainWindow.loadURL(html);
}

function loadApp() { if (mainWindow) mainWindow.loadURL(START_URL).catch(() => {}); }

function scheduleRetry() {
  if (busyRetry) return;
  busyRetry = true;
  retries += 1;
  if (retries > MAX_RETRIES) { busyRetry = false; return; }
  showConnecting();
  setTimeout(() => { busyRetry = false; loadApp(); }, 1500);
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
      partition: "persist:regatta", // Login bleibt über Neustarts erhalten
    },
  });

  showConnecting();
  loadApp();

  const wc = mainWindow.webContents;
  wc.on("did-fail-load", (_e, errorCode, _desc, validatedURL) => {
    if (errorCode === -3) return;
    if (validatedURL && validatedURL.startsWith(BASE_URL)) scheduleRetry();
  });
  wc.on("did-finish-load", () => { retries = 0; });
  wc.on("render-process-gone", () => setTimeout(loadApp, 800));
  wc.on("unresponsive", () => { try { wc.reloadIgnoringCache(); } catch {} });

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

/* -------------------------------- Lifecycle ------------------------------- */
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
  ensureServer().catch((e) => console.error("ensureServer:", e));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", killServer);
app.on("window-all-closed", () => {
  killServer();
  if (process.platform !== "darwin") app.quit();
});
