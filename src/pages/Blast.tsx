import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCampaignStore, AudienceFilter, Attachment } from '../store/useCampaignStore';
import { contactService } from '../services/contactService';
import { groqService, RewriteStyle } from '../services/groqService';
import { storage } from '../lib/appwrite';
import { APPWRITE_CONFIG } from '../lib/appwriteConfig';
import { ID } from 'appwrite';
import { 
    User, Database, Target, Zap, ChevronRight, Layers, Trophy, Info,
    PenTool, Sparkles, Paperclip, X, Image as ImageIcon, FileText, Wand2, Loader2, Send
} from 'lucide-react';
import { clsx } from 'clsx';

const Blast: React.FC = () => {
    const { user } = useAuth();
    const { 
        presenterName, setPresenterName, 
        audienceFilter, setAudienceFilter,
        batchSize, setBatchSize,
        targetSuccessCount, setTargetSuccessCount,
        totalAvailable, setTotalAvailable,
        messageBody, setMessageBody,
        attachments, addAttachment, removeAttachment
    } = useCampaignStore();

    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [step, setStep] = useState<1 | 2>(1); // 1: Settings, 2: Content Studio
    
    // AI State
    const [isRewriting, setIsRewriting] = useState(false);
    const [rewriteStyle, setRewriteStyle] = useState<RewriteStyle>('formal');

    // Upload State
    const [isUploading, setIsUploading] = useState(false);

    // Fetch Stats
    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            setIsLoadingStats(true);
            try {
                const res = await contactService.getContacts(user.$id, audienceFilter as any, 1);
                setTotalAvailable(res.total);
            } catch (error) {
                console.error("Gagal ambil stats", error);
            } finally {
                setIsLoadingStats(false);
            }
        };
        fetchStats();
    }, [user, audienceFilter]);

    // Handlers
    const insertVariable = (varName: string) => {
        setMessageBody(messageBody + ` {${varName}} `);
    };

    const handleMagicRewrite = async () => {
        if (!messageBody.trim()) return;
        setIsRewriting(true);
        try {
            const rewritten = await groqService.rewriteMessage(messageBody, rewriteStyle);
            setMessageBody(rewritten);
        } catch (error) {
            alert("Gagal menulis ulang: " + (error as Error).message);
        } finally {
            setIsRewriting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // Upload ke Appwrite
            const res = await storage.createFile(
                APPWRITE_CONFIG.BUCKET_STORAGE_ID,
                ID.unique(),
                file
            );

            // Preview URL (View Only)
            const preview = storage.getFileView(APPWRITE_CONFIG.BUCKET_STORAGE_ID, res.$id);

            const newAttachment: Attachment = {
                id: res.$id,
                name: res.name,
                type: res.mimeType,
                size: res.sizeOriginal,
                previewUrl: preview.toString() // Use toString() or direct value if string
            };

            addAttachment(newAttachment);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Gagal upload file. Pastikan Bucket ID benar.");
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-40">
            {/* PROGRESS HEADER */}
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center font-black text-lg transition-colors", step === 1 ? "bg-blue-600 text-white" : "bg-green-500 text-white")}>
                        {step > 1 ? <Target size={20}/> : "1"}
                    </div>
                    <div className="h-1 w-16 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-blue-600" 
                            initial={{ width: "0%" }}
                            animate={{ width: step === 1 ? "50%" : "100%" }}
                        />
                    </div>
                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center font-black text-lg transition-colors", step === 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400")}>
                        2
                    </div>
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                    {step === 1 ? "Campaign Setup" : "Creative Studio"}
                </h1>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        {/* STEP 1 CONTENT (SETTINGS) */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Presenter Identity</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                    <input 
                                        type="text"
                                        value={presenterName}
                                        onChange={(e) => setPresenterName(e.target.value)}
                                        placeholder="Nama Presenter..."
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Sumber Data Kontak</label>
                                <div className="flex items-center gap-4 px-6 py-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700">
                                    <Database size={20} className="shrink-0" />
                                    <span className="font-bold text-sm uppercase tracking-wide">Ambil dari Database Siswa</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            {/* AUDIENCE SELECTOR */}
                            <div className="md:col-span-5 space-y-6">
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-full">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Target size={20} /></div>
                                        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Target Audience</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'pending', label: 'Data Baru', sub: 'Belum dikontak' },
                                            { id: 'sent', label: 'Follow Up', sub: 'Sudah dikontak' },
                                            { id: 'all', label: 'Semua Data', sub: 'Tanpa filter' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setAudienceFilter(opt.id as AudienceFilter)}
                                                className={clsx(
                                                    "w-full p-5 rounded-2xl border-2 transition-all text-left flex justify-between items-center group",
                                                    audienceFilter === opt.id 
                                                        ? "border-blue-600 bg-blue-50/50" 
                                                        : "border-slate-50 bg-slate-50/30 hover:border-slate-200"
                                                )}
                                            >
                                                <div>
                                                    <p className="font-bold text-slate-800 leading-tight">{opt.label}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-tighter">{opt.sub}</p>
                                                </div>
                                                <div className={clsx(
                                                    "px-3 py-1 rounded-lg text-xs font-bold",
                                                    audienceFilter === opt.id ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                                                )}>
                                                    {isLoadingStats && audienceFilter === opt.id ? '...' : (audienceFilter === opt.id ? totalAvailable : '--')}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* SMART CAMPAIGN MODE */}
                            <div className="md:col-span-7 space-y-6">
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-full">
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><Zap size={20} /></div>
                                        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Smart Campaign Mode</h3>
                                    </div>

                                    <div className="space-y-10">
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                        <Layers size={16} className="text-slate-400" /> Batch Size (Per Sesi)
                                                    </label>
                                                    <p className="text-xs text-slate-400 mt-1">Jumlah kontak yang diproses dalam satu putaran.</p>
                                                </div>
                                                <span className="text-2xl font-black text-blue-600">{batchSize}</span>
                                            </div>
                                            <input 
                                                type="range"
                                                min="1"
                                                max="500"
                                                value={batchSize}
                                                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <Trophy size={16} className="text-slate-400" /> Jumlah Sukses Target
                                                </label>
                                            </div>
                                            <div className="relative">
                                                <input 
                                                    type="number"
                                                    value={targetSuccessCount}
                                                    onChange={(e) => setTargetSuccessCount(parseInt(e.target.value))}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-slate-800 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                                />
                                                <div className="mt-3 flex items-start gap-2 text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                                                    <Info size={14} className="shrink-0 mt-0.5" />
                                                    <p className="text-[10px] leading-relaxed italic">
                                                        <b>Hint:</b> Sistem akan terus mencoba mengirim hingga jumlah pesan yang <b>berhasil</b> terkirim mencapai angka ini.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* LEFT: EDITOR */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><PenTool size={20} /></div>
                                        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Smart Editor</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        {['name', 'panggilan', 'sekolah'].map(v => (
                                            <button 
                                                key={v}
                                                onClick={() => insertVariable(v)}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                {`{${v}}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <textarea 
                                    value={messageBody}
                                    onChange={(e) => setMessageBody(e.target.value)}
                                    placeholder="Tulis pesan blast di sini... Gunakan variabel di atas untuk personalisasi."
                                    className="w-full h-64 p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 resize-none leading-relaxed"
                                />

                                <div className="mt-6 flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm"><Sparkles size={18} /></div>
                                        <div>
                                            <p className="font-bold text-indigo-900 text-sm">Magic Rewrite (AI)</p>
                                            <p className="text-xs text-indigo-600/70">Biarkan AI mempercantik bahasa Anda</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <select 
                                            value={rewriteStyle}
                                            onChange={(e) => setRewriteStyle(e.target.value as RewriteStyle)}
                                            className="bg-white border border-indigo-200 text-indigo-800 text-xs font-bold py-2 px-3 rounded-xl outline-none"
                                        >
                                            <option value="formal">Formal</option>
                                            <option value="casual">Santai (Gen Z)</option>
                                            <option value="persuasive">Persuasif</option>
                                            <option value="urgent">Urgent</option>
                                            <option value="bait">Pancingan</option>
                                        </select>
                                        <button 
                                            onClick={handleMagicRewrite}
                                            disabled={isRewriting || !messageBody}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isRewriting ? <Loader2 className="animate-spin" size={14}/> : <Wand2 size={14}/>}
                                            Rewrite
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: MEDIA & PREVIEW */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* ATTACHMENT */}
                            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><Paperclip size={20} /></div>
                                    <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Attachments</h3>
                                </div>

                                <div className="space-y-4">
                                    {attachments.map((file) => (
                                        <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group relative overflow-hidden">
                                            <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center shrink-0 text-slate-500 overflow-hidden">
                                                {file.type.startsWith('image/') && file.previewUrl ? (
                                                    <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <FileText size={20} />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                                                <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <button 
                                                onClick={() => removeAttachment(file.id)}
                                                className="p-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    <label className={clsx(
                                        "block w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-green-400 hover:bg-green-50/30 group",
                                        isUploading ? "border-slate-200 bg-slate-50" : "border-slate-200"
                                    )}>
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                        <div className="flex flex-col items-center gap-2">
                                            {isUploading ? (
                                                <Loader2 className="animate-spin text-green-600" size={24} />
                                            ) : (
                                                <ImageIcon className="text-slate-300 group-hover:text-green-500 transition-colors" size={24} />
                                            )}
                                            <p className="text-xs font-bold text-slate-500 group-hover:text-green-600">
                                                {isUploading ? "Uploading..." : "Klik untuk Upload Gambar/PDF"}
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* ESTIMATION INFO */}
                            <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white">
                                <h3 className="font-bold uppercase tracking-widest text-xs mb-4 text-slate-400">Campaign Ready</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Total Kontak</span>
                                        <span className="font-bold">{totalAvailable}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Estimasi Waktu</span>
                                        <span className="font-bold">~{Math.ceil(totalAvailable / 10)} menit</span>
                                    </div>
                                    <div className="h-px bg-white/10 my-2"></div>
                                    <button className="w-full bg-green-500 hover:bg-green-400 text-slate-900 py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20">
                                        <Send size={18} />
                                        Mulai Blast
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FLOATING ACTION BAR */}
            <motion.div 
                className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50"
            >
                <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl flex items-center justify-between overflow-hidden relative">
                     <div className="flex items-center gap-4 px-4">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Info size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white uppercase tracking-wide">
                                {step === 1 ? "Langkah 1: Konfigurasi" : "Langkah 2: Konten & Media"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                                {step === 1 ? "Atur target audiens dan kecepatan pengiriman." : "Tulis pesan menarik dan lampirkan file."}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {step === 2 && (
                            <button 
                                onClick={() => setStep(1)}
                                className="px-6 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Kembali
                            </button>
                        )}
                        {step === 1 && (
                            <button 
                                onClick={() => setStep(2)}
                                disabled={!presenterName}
                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wide transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                            >
                                Lanjut
                                <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Blast;