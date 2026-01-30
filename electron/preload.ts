import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// Expose API WhatsApp ke Frontend
contextBridge.exposeInMainWorld('electron', {
  waConnect: (userId: string) => ipcRenderer.invoke('wa-connect', userId),
  waLogout: (userId: string) => ipcRenderer.invoke('wa-logout', userId),
  onWaQr: (callback: (data: any) => void) => ipcRenderer.on('wa-qr', (_, data) => callback(data)),
  onWaStatus: (callback: (data: any) => void) => ipcRenderer.on('wa-status', (_, data) => callback(data)),
  onWaLogout: (callback: (data: any) => void) => ipcRenderer.on('wa-logout', (_, data) => callback(data))
})