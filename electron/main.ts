import { app, BrowserWindow, clipboard, ipcMain, session } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Wipe transient on-disk data (cache, shader cache, indexeddb, service workers)
// while preserving localStorage so the reusable custom rules survive.
const transientStorages = ["cachestorage", "indexdb", "serviceworkers", "shadercache", "websql", "filesystem"] as const;
const purgeTransient = async () => {
  try {
    await session.defaultSession.clearCache();
    await session.defaultSession.clearStorageData({ storages: [...transientStorages] });
  } catch { /* best effort */ }
};
ipcMain.handle("sanizotter:purge-cache", async () => {
  try { clipboard.clear(); } catch { /* best effort */ }
  await purgeTransient();
});
const iconPath = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.cwd(), "build", "icon.ico")
  : path.join(__dirname, "..", "dist", "sanizotter-logo.png");
const createWindow = () => { const win = new BrowserWindow({ width: 1280, height: 860, minWidth: 920, minHeight: 680, title: "SanizOtter", icon: iconPath, backgroundColor: "#E7F0EC", webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false } }); if (process.env.VITE_DEV_SERVER_URL) void win.loadURL(process.env.VITE_DEV_SERVER_URL); else void win.loadFile(path.join(__dirname, "../dist/index.html")); };
app.whenReady().then(() => { createWindow(); app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

// On quit, scrub transient on-disk data so no session trace lingers.
let cleaned = false;
app.on("will-quit", (event) => {
  if (cleaned) return;
  event.preventDefault();
  void purgeTransient().finally(() => { cleaned = true; app.quit(); });
});
