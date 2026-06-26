// Regatta Manager – Desktop (Electron)
// Öffnet die Web-App in einem nativen Fenster.
// Standard-URL: lokaler Dev/Prod-Server. Für eine deploye Version:
//   DESKTOP_URL=https://deine-domain.de  setzen.
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

const APP_URL = process.env.DESKTOP_URL || "http://localhost:3000";
const APP_ORIGIN = (() => {
  try { return new URL(APP_URL).origin; } catch { return null; }
})();

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#0a2340",
    title: "Regatta Manager",
    icon: path.join(__dirname, "..", "public", "app-icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(APP_URL);

  // Externe Links (anderer Origin, z.B. Stripe) im System-Browser öffnen.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      if (!APP_ORIGIN || new URL(url).origin !== APP_ORIGIN) {
        shell.openExternal(url);
        return { action: "deny" };
      }
    } catch { /* ignore */ }
    return { action: "allow" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    try {
      if (APP_ORIGIN && new URL(url).origin !== APP_ORIGIN) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch { /* ignore */ }
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(() => {
  // Schlankes Menü (Reload, Zoom, DevTools, Beenden)
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "Datei",
        submenu: [{ role: "quit", label: "Beenden" }],
      },
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
