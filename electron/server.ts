import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';

const server = express();
const PORT = 3000;
const HOST = '0.0.0.0';

server.use(cors());
server.use(express.json());

// Map untuk manajemen sesi tunggal per user
const sessions = new Map<string, any>();
const qrCodes = new Map<string, string>();
const connectionStatus = new Map<string, any>();
const isInitializing = new Set<string>(); // Flag untuk mencegah double trigger

async function initWhatsApp(userId: string) {
    // Jika sedang inisialisasi, batalkan request baru
    if (isInitializing.has(userId)) return;
    
    // Jika sudah connected, jangan inisialisasi lagi
    if (connectionStatus.get(userId)?.status === 'connected') return;

    isInitializing.add(userId);
    console.log(`[SERVER] >>> Memulai Mesin WhatsApp: ${userId}`);

    const sessionDir = path.join(app.getPath('userData'), 'sessions', userId);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

    // Bersihkan instance lama jika ada (Clean up zombie)
    const oldSock = sessions.get(userId);
    if (oldSock) {
        try { oldSock.ev.removeAllListeners(); oldSock.end(); } catch (e) {}
    }

    const sock = makeWASocket({
        version: version as [number, number, number],
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['WABABLAS Pro', 'Chrome', '1.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
    });

    sessions.set(userId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrCodes.set(userId, qr);
            console.log(`[SERVER] QR Ready untuk ${userId}`);
            isInitializing.delete(userId); // Selesai tahap init
        }

        if (connection === 'open') {
            console.log(`[SERVER] WhatsApp TERHUBUNG STABIL: ${userId}`);
            qrCodes.delete(userId);
            isInitializing.delete(userId);
            connectionStatus.set(userId, { 
                status: 'connected', 
                info: { name: sock.user?.name, phone: sock.user?.id.split(':')[0] } 
            });
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log(`[SERVER] Koneksi Tertutup (${statusCode}). Reconnect: ${shouldReconnect}`);
            
            connectionStatus.set(userId, { status: 'disconnected' });
            isInitializing.delete(userId);

            if (shouldReconnect) {
                // Gunakan delay agar tidak spamming reconnect
                setTimeout(() => initWhatsApp(userId), 5000);
            } else {
                console.log(`[SERVER] User Logged Out. Membersihkan sesi...`);
                sessions.delete(userId);
                if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
            }
        }
    });
}

// --- API ENDPOINTS ---

server.get('/wa/connect/:userId', (req, res) => {
    const { userId } = req.params;
    initWhatsApp(userId);
    res.json({ message: 'Request diterima' });
});

server.get('/wa/status/:userId', (req, res) => {
    const { userId } = req.params;
    const qr = qrCodes.get(userId);
    const status = connectionStatus.get(userId) || { status: 'disconnected' };
    res.json({ userId, qr: qr || null, ...status });
});

server.get('/wa/logout/:userId', async (req, res) => {
    const { userId } = req.params;
    const sock = sessions.get(userId);
    if (sock) {
        try { await sock.logout(); } catch(e) {}
        sessions.delete(userId);
        qrCodes.delete(userId);
        connectionStatus.delete(userId);
    }
    res.json({ success: true });
});

export function startServer() {
    server.listen(PORT, HOST, () => {
        console.log(`[SERVER] API Aktif di http://${HOST}:${PORT}`);
    });
}
