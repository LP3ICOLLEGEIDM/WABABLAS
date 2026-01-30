// Fungsi sanitasi nomor HP standar Internasional (Indonesia Focused)
// Menerima input apapun, mengembalikan format 628xxx
export const sanitizePhoneNumber = (phone: any): { clean: string, isValid: boolean } => {
    if (!phone) return { clean: '', isValid: false };

    // 1. Ubah ke string dan hapus semua karakter non-angka
    let clean = String(phone).replace(/\D/g, '');

    // 2. Koreksi awalan
    if (clean.startsWith('08')) {
        clean = '628' + clean.slice(2);
    } else if (clean.startsWith('8')) {
        clean = '628' + clean.slice(1);
    } else if (clean.startsWith('6208')) { // Case langka: user nulis 6208
        clean = '628' + clean.slice(4);
    }

    // 3. Validasi Panjang (Indonesia umumnya 10-15 digit termasuk kode negara)
    const isValid = clean.startsWith('62') && clean.length >= 10 && clean.length <= 15;

    return { clean, isValid };
};
