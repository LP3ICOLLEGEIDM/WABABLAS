import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { app, ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { Boom } from '@hapi/boom';
import pino from 'pino';

// Map untuk menyimpan socket aktif per user
const sessions = new Map<string, any>();

export async function connectToWhatsApp(userId: string, mainWindow: BrowserWindow) {
    console.log(`[SISTEM] Memulai koneksi WhatsApp untuk user: ${userId}...`);

    try {
        const sessionDir = path.join(app.getPath('userData'), 'sessions', userId);
        
        // 1. Cek Folder Sesi
        if (!fs.existsSync(sessionDir)) {
            console.log(`[SISTEM] Membuat folder sesi baru di: ${sessionDir}`);
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        console.log('[SISTEM] Memuat MultiFileAuthState...');
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();
        
        console.log(`[SISTEM] Menggunakan WA Web versi: ${version.join('.')}`);

        // 2. Inisialisasi Socket Baileys
        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }), // Tetap silent agar tidak spam, kita pakai log manual
            browser: ['WABABLAS', 'Chrome', '1.0.0'],
            connectTimeoutMs: 60000,
        });

        sessions.set(userId, sock);

        // 3. Event Listener: Credential Update (Save Session)
        sock.ev.on('creds.update', saveCreds);

        // 4. Event Listener: Connection Update
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            console.log(`[SISTEM] Status Update: ${connection || 'Connecting...'}`);

            if (qr) {
                console.log(`[SISTEM] QR Code DITEMUKAN! Mengirim ke UI...`);
                mainWindow.webContents.send('wa-qr', { userId, qr });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(`[SISTEM] Koneksi Terputus. Reconnect? ${shouldReconnect}`, lastDisconnect?.error);
                
                mainWindow.webContents.send('wa-status', { userId, status: 'disconnected' });

                if (shouldReconnect) {
                    connectToWhatsApp(userId, mainWindow);
                } else {
                    if (fs.existsSync(sessionDir)) {
                        fs.rmSync(sessionDir, { recursive: true, force: true });
                    }
                    mainWindow.webContents.send('wa-logout', { userId });
                }
            } else if (connection === 'open') {
                console.log(`[SISTEM] BERHASIL TERHUBUNG! User: ${userId}`);
                const userJid = sock.user?.id.split(':')[0];
                const userName = sock.user?.name || 'WhatsApp User';
                
                mainWindow.webContents.send('wa-status', { 
                    userId, 
                    status: 'connected', 
                    info: { name: userName, phone: userJid } 
                });
            }
        });
    } catch (error: any) {
        console.error('[SISTEM FATAL ERROR]', error);
        mainWindow.webContents.send('wa-error', { userId, message: error.message });
    }
}

// 5. Fungsi Logout Manual
export async function logoutWhatsApp(userId: string, mainWindow: BrowserWindow) {
    const sock = sessions.get(userId);
    const sessionDir = path.join(app.getPath('userData'), 'sessions', userId);

    if (sock) {
        await sock.logout();
        sessions.delete(userId);
    } else if (fs.existsSync(sessionDir)) {
        // Force delete jika socket tidak aktif tapi folder ada
        fs.rmSync(sessionDir, { recursive: true, force: true });
    }

    mainWindow.webContents.send('wa-logout', { userId });
    // Mulai ulang untuk generate QR baru
    connectToWhatsApp(userId, mainWindow);
}
