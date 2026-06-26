// Minimaler, sicherer Preload (contextIsolation an, keine Node-APIs im Renderer).
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("regattaDesktop", {
  isDesktop: true,
  platform: process.platform,
});
