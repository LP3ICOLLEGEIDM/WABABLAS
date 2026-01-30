import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx'; 
import { useAuth } from '../context/AuthContext';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Trash2, RefreshCw, Plus, Edit3, Save, Search, School, Phone, User, Bug, AlertCircle, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { parseExcel, RawContact } from '../services/excelService';
import { sanitizePhoneNumber } from '../utils/formatter';
import { contactService, ContactStatus } from '../services/contactService';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const Database: React.FC = () => {
    const { user } = useAuth();
    
    // --- STATE UTAMA ---
    const [activeTab, setActiveTab] = useState<ContactStatus>('pending');
    const [contacts, setContacts] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    
    // Pagination & Search
    const [totalContacts, setTotalContacts] = useState(0);
    const [offset, setOffset] = useState(0);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const LIMIT = 50;
    
    // Import & Selection State
    const [isDragging, setIsDragging] = useState(false);
    const [previewData, setPreviewData] = useState<RawContact[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [debugFile, setDebugFile] = useState<File | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<any | null>(null);
    const [formData, setFormData] = useState({ name: '', phone: '', school: '' });
    const [isResetting, setIsResetting] = useState(false);

    // --- DEBOUNCE SEARCH ---
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchKeyword);
            setOffset(0); // Reset ke halaman 1 saat search berubah
        }, 500); // Tunggu 500ms setelah user berhenti mengetik
        return () => clearTimeout(timer);
    }, [searchKeyword]);

    // --- LOAD DATA ---
    useEffect(() => {
        loadContacts();
    }, [user, activeTab, offset, debouncedSearch]);

    const loadContacts = async () => {
        if (!user) return;
        setLoadingData(true);
        try {
            const res = await contactService.getContacts(user.$id, activeTab, LIMIT, offset, debouncedSearch);
            setContacts(res.documents);
            setTotalContacts(res.total);
        } catch (error) {
            console.error("Gagal load data", error);
        } finally {
            setLoadingData(false);
        }
    };

    // --- PAGINATION CONTROLS ---
    const handleNextPage = () => {
        if (offset + LIMIT < totalContacts) setOffset(offset + LIMIT);
    };

    const handlePrevPage = () => {
        if (offset - LIMIT >= 0) setOffset(offset - LIMIT);
    };

    const currentPage = Math.floor(offset / LIMIT) + 1;
    const totalPages = Math.ceil(totalContacts / LIMIT);

    // --- ACTIONS LAIN (Tetap Sama) ---
    const handleResetDatabase = async () => {
        if (!user) return;
        if (!window.confirm("PERINGATAN: Hapus SEMUA data?")) return;
        if (!window.confirm("Yakin? Data akan hilang permanen.")) return;

        setIsResetting(true);
        setProgress(0);
        try {
            await contactService.deleteAllContacts(user.$id, (p) => setProgress(p));
            loadContacts();
            alert('Database berhasil dikosongkan.');
        } catch (error) {
            alert('Gagal mereset database.');
        } finally {
            setIsResetting(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            const { clean, isValid } = sanitizePhoneNumber(formData.phone);
            if (!isValid) throw new Error('Nomor WhatsApp tidak valid.');

            if (editingContact) {
                await contactService.updateContact(editingContact.$id, { ...formData, phone: clean });
            } else {
                await contactService.addContact(user.$id, formData.name, clean, formData.school);
            }
            setIsModalOpen(false);
            loadContacts(); 
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Hapus data ini?')) {
            await contactService.deleteContact(id);
            loadContacts(); // Refresh
        }
    };

    const handleFile = async (file: File) => {
        setErrorMsg('');
        setDebugFile(file);
        try {
            const data = await parseExcel(file);
            setPreviewData(data);
            setSelectedIndices(new Set()); 
        } catch (error: any) {
            setErrorMsg(error.message);
        }
    };

    const handleDebugSpy = () => {
        if (!debugFile) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: 'KOSONG' });
            alert("HASIL SPY (Header + 2 Data):\n" + JSON.stringify(json.slice(0, 3), null, 2));
        };
        reader.readAsBinaryString(debugFile);
    };

    const executeImport = async () => {
        if (!user || selectedIndices.size === 0) return;
        const dataToImport = previewData.filter((_, index) => selectedIndices.has(index));
        
        setUploading(true);
        setStatusText(`Menyiapkan ${dataToImport.length} data terpilih...`);
        try {
            await contactService.bulkImportContacts(user.$id, dataToImport, (p) => setProgress(p), (msg) => setStatusText(msg));
            setPreviewData([]);
            setSelectedIndices(new Set());
            loadContacts();
            alert('Import Sukses!');
        } catch (error) {
            alert('Gagal mengimpor data.');
        } finally {
            setUploading(false);
            setStatusText('');
        }
    };

    // --- SELECTION LOGIC ---
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIndices = new Set(previewData.map((_, i) => i));
            setSelectedIndices(allIndices);
        } else {
            setSelectedIndices(new Set());
        }
    };

    const handleSelectRow = (index: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        setSelectedIndices(newSet);
    };

    const handleQuickSelect = (count: number) => {
        const limit = Math.min(count, previewData.length);
        const newSet = new Set<number>();
        for (let i = 0; i < limit; i++) newSet.add(i);
        setSelectedIndices(newSet);
    };

    const removePreviewRow = (index: number) => {
        setPreviewData(prev => prev.filter((_, i) => i !== index));
        const newSet = new Set(selectedIndices);
        newSet.delete(index);
        setSelectedIndices(newSet);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-32">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Database Kontak</h2>
                    <p className="text-slate-500 mt-1">Kelola target audiens berdasarkan status pengiriman.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleResetDatabase} disabled={isResetting} className="bg-red-50 text-red-600 px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-100 transition-all active:scale-95 border border-red-100 disabled:opacity-50">
                        {isResetting ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} />}
                        {isResetting ? `${progress}%` : 'Reset DB'}
                    </button>
                    <button onClick={() => { setEditingContact(null); setFormData({name:'', phone:'', school:''}); setIsModalOpen(true); }} className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95">
                        <Plus size={18} /> Tambah
                    </button>
                </div>
            </div>

            {/* TAB & STATS */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                    {(['pending', 'sent', 'failed'] as const).map((tab) => (
                        <button key={tab} onClick={() => { setActiveTab(tab); setOffset(0); }} className={clsx("px-6 py-2.5 rounded-lg text-sm font-bold transition-all relative capitalize", activeTab === tab ? "text-slate-900 shadow-sm bg-white" : "text-slate-500 hover:text-slate-700")}>
                            {activeTab === tab && <motion.div layoutId="tab-bg" className="absolute inset-0 bg-white rounded-lg shadow-sm" transition={{ duration: 0.2 }} />}
                            <span className="relative z-10 flex items-center gap-2">
                                {tab === 'pending' ? 'Data Mentah' : tab === 'sent' ? 'Terkirim' : 'Gagal'}
                            </span>
                        </button>
                    ))}
                </div>
                {/* SEARCH BAR */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Cari nama, nomor, atau sekolah..." 
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium"
                    />
                </div>
            </div>

            {/* ERROR MSG */}
            <AnimatePresence>
                {errorMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                        <AlertCircle className="w-5 h-5" />
                        {errorMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* IMPORT ZONE (Hanya muncul jika tidak ada file preview) */}
            {activeTab === 'pending' && !previewData.length && (
                <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }}
                    className={clsx("relative border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer overflow-hidden group bg-slate-50/50 hover:bg-blue-50/30", isDragging ? 'border-blue-500 scale-[1.01]' : 'border-slate-300 hover:border-blue-400')}
                >
                    <input type="file" accept=".xlsx, .xls" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                    <div className="flex flex-col items-center gap-4 relative z-10">
                        <div className="p-5 bg-white text-blue-600 rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform"><FileSpreadsheet size={32} /></div>
                        <div><p className="text-lg font-bold text-slate-800">Import Excel</p><p className="text-slate-400 text-sm mt-1">Tarik file .xlsx ke sini.</p></div>
                    </div>
                </div>
            )}

            {/* PREVIEW TABLE (Jika ada file import) */}
            {previewData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3"><div className="bg-green-100 p-2 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div><div><h3 className="font-bold text-slate-800">Preview Data</h3><p className="text-xs text-slate-500">{selectedIndices.size} dari {previewData.length} data dipilih.</p></div></div>
                        <div className="flex gap-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase mr-2 self-center">Quick Select:</span>
                            <button onClick={() => handleQuickSelect(10)} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:text-blue-600">10</button>
                            <button onClick={() => handleQuickSelect(50)} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:text-blue-600">50</button>
                            <button onClick={() => handleQuickSelect(100)} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:text-blue-600">100</button>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleDebugSpy} className="px-3 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg flex gap-1"><Bug size={14} /> SPY</button>
                            <button onClick={() => setPreviewData([])} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-red-600">Batal</button>
                            <button onClick={executeImport} disabled={uploading || selectedIndices.size === 0} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]">
                                {uploading ? <div className="flex flex-col items-center leading-tight"><div className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /><span>{progress}%</span></div><span className="text-[10px] font-normal opacity-90">{statusText}</span></div> : <><Upload className="w-4 h-4" /> Simpan ({selectedIndices.size})</>}
                            </button>
                        </div>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-4 w-10 text-center"><input type="checkbox" className="rounded border-slate-300 text-blue-600" onChange={(e) => handleSelectAll(e.target.checked)} checked={selectedIndices.size === previewData.length && previewData.length > 0} /></th>
                                    <th className="px-6 py-4 w-20">Status</th>
                                    <th className="px-6 py-4">Nama</th>
                                    <th className="px-6 py-4">Sekolah</th>
                                    <th className="px-6 py-4">HP</th>
                                    <th className="px-6 py-4 text-right w-20">Hapus</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {previewData.map((row, idx) => {
                                    const isSelected = selectedIndices.has(idx);
                                    return (
                                        <tr key={idx} className={clsx("transition-colors group cursor-pointer", isSelected ? "bg-blue-50/60" : "hover:bg-slate-50")} onClick={() => handleSelectRow(idx)}>
                                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={isSelected} onChange={() => handleSelectRow(idx)} className="rounded border-slate-300 text-blue-600 cursor-pointer" /></td>
                                            <td className="px-6 py-3">{row.isValid ? <div className="w-2 h-2 rounded-full bg-green-500 ring-4 ring-green-100"></div> : <div className="w-2 h-2 rounded-full bg-red-500 ring-4 ring-red-100"></div>}</td>
                                            <td className="px-6 py-3 font-medium text-slate-700">{row.name}</td>
                                            <td className="px-6 py-3 text-slate-600">{row.school || '-'}</td>
                                            <td className="px-6 py-3 font-mono text-blue-600">{row.phone}</td>
                                            <td className="px-6 py-3 text-right"><button onClick={(e) => { e.stopPropagation(); removePreviewRow(idx); }} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* MAIN TABLE (DATA DB) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[400px]">
                {loadingData ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
                        {/* Loading Skeleton */}
                        <div className="w-full max-w-md space-y-4 animate-pulse px-8">
                            <div className="h-4 bg-slate-100 rounded w-3/4 mx-auto"></div>
                            <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto"></div>
                            <div className="h-4 bg-slate-100 rounded w-5/6 mx-auto"></div>
                        </div>
                        <p className="mt-4 text-sm font-medium">Memuat data...</p>
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-12">
                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                            <Search size={32} className="text-slate-300" />
                        </div>
                        <p className="text-lg font-medium text-slate-600">Data tidak ditemukan</p>
                        <p className="text-sm mt-1">Coba kata kunci lain atau ubah filter.</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 sticky top-0 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-4 w-16 text-center">#</th>
                                        <th className="px-6 py-4">Nama Lengkap</th>
                                        <th className="px-6 py-4">Nomor WhatsApp</th>
                                        <th className="px-6 py-4">Asal Sekolah</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {contacts.map((c, i) => (
                                        <tr key={c.$id} className="hover:bg-blue-50/30 transition-colors group odd:bg-white even:bg-slate-50/30">
                                            <td className="px-6 py-4 text-center text-slate-400 text-xs font-mono">{i + 1 + offset}</td>
                                            <td className="px-6 py-4 font-bold text-slate-700 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                                                    {c.name.charAt(0)}
                                                </div>
                                                {c.name}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-blue-600 font-medium tracking-wide">{c.phone}</td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {c.school ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium"><School size={12}/> {c.school}</span> : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingContact(c); setFormData({name:c.name, phone:c.phone, school:c.school||''}); setIsModalOpen(true); }} className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg"><Edit3 size={16}/></button>
                                                    <button onClick={() => handleDelete(c.$id)} className="p-2 hover:bg-red-100 text-red-600 rounded-lg"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION CONTROLS */}
                        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center text-sm sticky bottom-0 z-10">
                            <span className="text-slate-500">
                                Halaman <span className="font-bold text-slate-900">{currentPage}</span> dari {totalPages || 1}
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handlePrevPage} 
                                    disabled={offset === 0}
                                    className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                                >
                                    <ChevronLeft size={16} /> Prev
                                </button>
                                <button 
                                    onClick={handleNextPage} 
                                    disabled={offset + LIMIT >= totalContacts}
                                    className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden border border-slate-100">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-slate-800">{editingContact ? 'Edit Kontak' : 'Kontak Baru'}</h3>
                                <button onClick={() => setIsModalOpen(false)}><XCircle className="text-slate-400 hover:text-slate-600" size={20}/></button>
                            </div>
                            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none" placeholder="Nama Siswa" /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nomor WhatsApp</label><input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none" placeholder="0812..." /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sekolah (Opsional)</label><input type="text" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none" placeholder="Nama Sekolah" /></div>
                                <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors">Simpan</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Database;
