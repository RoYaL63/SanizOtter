import { contextBridge } from "electron";
contextBridge.exposeInMainWorld("anonymotter", { platform: "desktop" });
