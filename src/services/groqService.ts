import Groq from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

// Inisialisasi Groq Client
// Jika API Key belum ada, client akan null, kita handle nanti
const groq = apiKey ? new Groq({ apiKey, dangerouslyAllowBrowser: true }) : null;

export type RewriteStyle = 'formal' | 'casual' | 'persuasive' | 'urgent' | 'bait';

export const groqService = {
    /**
     * Menulis ulang pesan menggunakan AI dengan gaya tertentu.
     */
    async rewriteMessage(originalText: string, style: RewriteStyle): Promise<string> {
        if (!groq) {
            throw new Error("Groq API Key belum dikonfigurasi. Silakan tambahkan VITE_GROQ_API_KEY di .env");
        }

        if (!originalText.trim()) return "";

        let systemPrompt = "Kamu adalah asisten marketing profesional untuk sekolah/kampus LP3I.";
        
        switch (style) {
            case 'formal':
                systemPrompt += " Tulis ulang pesan ini dengan bahasa Indonesia yang baku, sopan, profesional, dan hormat. Cocok untuk orang tua atau instansi.";
                break;
            case 'casual':
                systemPrompt += " Tulis ulang pesan ini dengan gaya bahasa gaul Gen Z, santai, akrab, menggunakan emoji yang relevan. Cocok untuk calon mahasiswa baru.";
                break;
            case 'persuasive':
                systemPrompt += " Tulis ulang pesan ini dengan teknik copywriting persuasif, fokus pada manfaat, dan mengajak bertindak (Call to Action) yang kuat.";
                break;
            case 'urgent':
                systemPrompt += " Tulis ulang pesan ini dengan nada mendesak (FOMO), mengingatkan bahwa penawaran/waktu terbatas, tapi tidak kasar.";
                break;
            case 'bait':
                systemPrompt += " Tulis ulang pesan ini menjadi sangat singkat, misterius, dan memancing rasa penasaran (Clickbait) agar penerima mau membalas.";
                break;
        }

        systemPrompt += " PENTING: Jangan tambahkan pembuka seperti 'Berikut adalah...' langsung berikan hasil tulis ulang saja. Pertahankan variabel seperti {name}, {panggilan}, {sekolah} jangan diubah.";

        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: originalText }
                ],
                model: "llama3-8b-8192",
                temperature: 0.7,
                max_tokens: 1024,
            });

            return completion.choices[0]?.message?.content || originalText;
        } catch (error) {
            console.error("Groq AI Error:", error);
            throw new Error("Gagal memproses AI. Cek koneksi atau kuota API.");
        }
    }
};
