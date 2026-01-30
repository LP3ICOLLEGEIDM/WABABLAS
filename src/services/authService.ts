import { account } from '../lib/appwrite';
import { ID } from 'appwrite';

export const authService = {
    // 1. Register User Baru
    register: async (email: string, password: string, name: string) => {
        try {
            // Appwrite mewajibkan ID unik, kita gunakan ID.unique()
            return await account.create(ID.unique(), email, password, name);
        } catch (error: any) {
            throw new Error(error.message || 'Gagal mendaftarkan akun baru');
        }
    },

    // 2. Login (Menciptakan Sesi)
    login: async (email: string, password: string) => {
        try {
            return await account.createEmailPasswordSession(email, password);
        } catch (error: any) {
            throw new Error(error.message || 'Login gagal, periksa email dan password Anda');
        }
    },

    // 3. Logout (Menghapus Sesi Saat Ini)
    logout: async () => {
        try {
            return await account.deleteSession('current');
        } catch (error: any) {
            throw new Error(error.message || 'Gagal logout');
        }
    },

    // 4. Mengambil Data User yang Sedang Aktif
    getCurrentUser: async () => {
        try {
            return await account.get();
        } catch (error) {
            // Jika tidak ada sesi, kembalikan null (bukan error)
            return null;
        }
    }
};
