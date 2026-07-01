import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("sanizotter", {
  platform: "desktop",
  purgeCache: () => ipcRenderer.invoke("sanizotter:purge-cache"),
});
