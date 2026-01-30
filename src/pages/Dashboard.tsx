import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { whatsappService } from '../services/whatsappService';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, LogOut, User, Zap, RefreshCw, Cpu, Globe, ShieldCheck } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('connecting');
    const [waInfo, setWaInfo] = useState<{ name: string, phone: string } | null>(null);

    useEffect(() => {
        if (!user) return;
        whatsappService.connect(user.$id);

        const interval = setInterval(async () => {
            const data = await whatsappService.getStatus(user.$id);
            if (data.qr) {
                setQrCode(data.qr);
                setStatus('disconnected');
            }
            if (data.status === 'connected') {
                setStatus('connected');
                setWaInfo(data.info);
                setQrCode(null);
            }
            if (data.status === 'error') setStatus('error');
        }, 3000);

        return () => clearInterval(interval);
    }, [user]);

    const handleLogoutWA = async () => {
        if (user && window.confirm("Putuskan koneksi?")) {
            await whatsappService.logout(user.$id);
            setStatus('connecting');
            setQrCode(null);
            setWaInfo(null);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* TOP HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">CONTROL CENTER</h1>
                    <p className="text-slate-500 font-medium">Monitoring sistem dan koneksi WhatsApp Anda.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Network Live</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* PROFILE & CONNECTION AREA (Merged) */}
                <div className="lg:col-span-7">
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden h-full flex flex-col">
                        <AnimatePresence mode="wait">
                            {status === 'connected' && waInfo ? (
                                <motion.div 
                                    key="connected"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex-1 flex flex-col"
                                >
                                    {/* Top Profile Section */}
                                    <div className="p-10 text-center border-b border-slate-50 bg-gradient-to-b from-slate-50/50 to-white">
                                        <div className="relative inline-block mb-6">
                                            <div className="w-28 h-28 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-200 border-4 border-white rotate-3">
                                                <User className="text-white w-12 h-12 -rotate-3" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-2xl shadow-lg">
                                                <div className="w-5 h-5 bg-green-500 rounded-full border-4 border-green-100"></div>
                                            </div>
                                        </div>
                                        <h4 className="text-2xl font-black text-slate-900 leading-none">{waInfo.name}</h4>
                                        <p className="text-blue-600 font-mono font-bold mt-2 text-lg">+{waInfo.phone}</p>
                                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                            <ShieldCheck size={14} /> WhatsApp Connected
                                        </div>
                                    </div>

                                    {/* System Stats Section (Inside the same frame) */}
                                    <div className="grid grid-cols-2 divide-x divide-slate-100 bg-slate-50/30">
                                        <div className="p-8 text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Status Server</p>
                                            <h5 className="text-lg font-bold text-blue-600">AKTIF</h5>
                                        </div>
                                        <div className="p-8 text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Multi-Device</p>
                                            <h5 className="text-lg font-bold text-slate-800">V2.0</h5>
                                        </div>
                                    </div>

                                    {/* Logout Action */}
                                    <button 
                                        onClick={handleLogoutWA}
                                        className="p-6 text-slate-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-all hover:bg-red-50 flex items-center justify-center gap-2"
                                    >
                                        <LogOut size={14} /> Putuskan Koneksi
                                    </button>
                                </motion.div>
                            ) : qrCode ? (
                                <motion.div 
                                    key="qr"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-12 text-center flex-1 flex flex-col justify-center"
                                >
                                    <div className="bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-100 inline-block mx-auto mb-8">
                                        <QRCodeSVG value={qrCode} size={240} level="H" includeMargin={true} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2">Tautkan Perangkat</h3>
                                    <p className="text-slate-400 text-sm px-10 leading-relaxed">
                                        Scan QR Code di atas menggunakan aplikasi WhatsApp Anda untuk memulai integrasi server.
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="p-12 text-center flex-1 flex flex-col justify-center items-center gap-4">
                                    <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
                                    <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Membangun Jembatan Socket...</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* SIDE CARDS (Action & Quick Stats) */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Blast Action Card */}
                    <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
                        <div className="relative z-10">
                            <Zap className="w-12 h-12 mb-6 fill-white opacity-20 group-hover:opacity-100 transition-opacity" />
                            <h4 className="text-2xl font-black leading-tight">Mulai Kirim<br />Blast Pesan</h4>
                            <p className="mt-2 text-blue-100 text-sm font-medium opacity-80">Masuk ke panel pengiriman massal.</p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                            <Cpu className="w-5 h-5 text-slate-400 mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engine</p>
                            <h5 className="text-xl font-bold text-slate-900 mt-1">Baileys</h5>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                            <Globe className="w-5 h-5 text-slate-400 mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Region</p>
                            <h5 className="text-xl font-bold text-slate-900 mt-1">Local</h5>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
