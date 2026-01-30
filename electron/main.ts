import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startServer } from './server'
import { connectToWhatsApp, logoutWhatsApp } from './whatsapp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// The built directory structure
//
// ├─┬─ dist
// │ ├─ index.html
// │ ├─ assets
// │ └── index.html
//
// ├─┬─ dist-electron
// │ ├── main.js
// │ └── preload.js
//
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC!, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  startServer()
  createWindow()

  // --- WHATSAPP IPC HANDLERS ---
  ipcMain.handle('wa-connect', async (event, userId) => {
    console.log(`[IPC] Menerima request wa-connect dari ${userId}`);
    if (win) {
      try {
        await connectToWhatsApp(userId, win);
        return { success: true };
      } catch (err: any) {
        console.error('[IPC ERROR]', err);
        return { success: false, error: err.message };
      }
    }
  });

  ipcMain.handle('wa-logout', async (event, userId) => {
    console.log(`[IPC] Menerima request wa-logout dari ${userId}`);
    if (win) {
      try {
        await logoutWhatsApp(userId, win);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
  });
})
