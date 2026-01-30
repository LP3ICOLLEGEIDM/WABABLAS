import * as XLSX from 'xlsx';
import { sanitizePhoneNumber } from '../utils/formatter';

export interface RawContact {
    name: string;
    phone: string;
    school: string;
    isValid: boolean;
    originalPhone: string;
}

export const parseExcel = async (file: File): Promise<RawContact[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                
                // --- 1. PILIH SHEET YANG BENAR ---
                // Cari sheet yang namanya mengandung "SISWA" atau "DATA"
                let targetSheetName = workbook.SheetNames.find(name => 
                    /siswa|data|murid/i.test(name) && !/ref|master/i.test(name)
                );

                // Jika tidak ketemu, pakai sheet pertama sebagai fallback
                if (!targetSheetName) {
                    targetSheetName = workbook.SheetNames[0];
                }

                console.log(`[Excel] Membaca Sheet: ${targetSheetName}`);
                const sheet = workbook.Sheets[targetSheetName];
                
                // --- 2. BACA DATA ---
                // raw: false (PENTING untuk Kolom A yang pakai rumus)
                const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { 
                    header: 1, 
                    raw: false,
                    defval: ''
                });

                if (jsonData.length < 2) {
                    reject(new Error('Sheet kosong atau tidak ada data.'));
                    return;
                }

                // --- 3. HARDCODED MAPPING (A=NAMA, B=HP) ---
                // Asumsi: Baris 1 adalah Header, Data mulai baris 2
                const contacts: RawContact[] = [];
                
                // Mulai loop dari index 1 (Baris ke-2 di Excel)
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;

                    // Kolom A (Index 0): NAMA (Hasil Rumus)
                    const rawName = String(row[0] || '').trim();
                    
                    // Kolom B (Index 1): HP (Manual Input)
                    const rawPhone = String(row[1] || '').trim();
                    
                    // Kolom C (Index 2): SEKOLAH (Opsional)
                    const rawSchool = String(row[2] || '').trim();

                    // Validasi Minimal: Harus ada nomor HP
                    if (rawPhone) {
                        const { clean, isValid } = sanitizePhoneNumber(rawPhone);
                        
                        contacts.push({
                            name: rawName || `Tanpa Nama (${clean.slice(-4)})`,
                            phone: clean,
                            school: rawSchool,
                            originalPhone: rawPhone,
                            isValid: isValid
                        });
                    }
                }

                console.log(`[Excel] Selesai. ${contacts.length} kontak valid ditemukan.`);
                resolve(contacts);

            } catch (err: any) {
                console.error("[Excel Error]", err);
                reject(new Error('Gagal membaca file. Pastikan format .xlsx valid.'));
            }
        };

        reader.onerror = () => reject(new Error('Gagal membaca file.'));
        reader.readAsBinaryString(file);
    });
};