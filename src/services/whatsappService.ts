// Service WhatsApp menggunakan Jalur Server API (Bisa diakses Network/HP)
const API_BASE = `http://${window.location.hostname}:3000`;

export const whatsappService = {
    // Memulai koneksi
    connect: async (userId: string) => {
        try {
            await fetch(`${API_BASE}/wa/connect/${userId}`);
        } catch (e) {
            console.error("Gagal panggil server API", e);
        }
    },

    // Ambil Status & QR secara berkala (Polling)
    getStatus: async (userId: string) => {
        try {
            const res = await fetch(`${API_BASE}/wa/status/${userId}`);
            return await res.json();
        } catch (e) {
            return { status: 'error' };
        }
    },

    // Logout
    logout: async (userId: string) => {
        try {
            await fetch(`${API_BASE}/wa/logout/${userId}`);
        } catch (e) {
            console.error("Gagal logout", e);
        }
    }
};