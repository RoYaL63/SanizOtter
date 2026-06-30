import { contextBridge } from "electron";
contextBridge.exposeInMainWorld("sanizotter", { platform: "desktop" });
