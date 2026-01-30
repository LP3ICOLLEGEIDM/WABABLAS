import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    Database, 
    BarChart2, 
    FileText, 
    Zap, 
    BookOpen, 
    Settings,
    ChevronLeft,
    Menu,
    LogOut
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const menuItems = [
    { path: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
    { path: '/database', label: 'Database', icon: Database },
    { path: '/statistics', label: 'Statistik', icon: BarChart2 },
    { path: '/reports', label: 'Laporan Hasil OKR', icon: FileText },
    { path: '/blast', label: 'Mulai Bablas', icon: Zap },
    { path: '/guide', label: 'Cara Penggunaan', icon: BookOpen },
    { path: '/settings', label: 'Setting', icon: Settings },
];

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const location = useLocation();
    const { checkUserStatus } = useAuth();

    const handleLogout = async () => {
        await authService.logout();
        await checkUserStatus();
    };

    return (
        <motion.div 
            animate={{ width: isOpen ? 280 : 80 }}
            className="h-screen bg-slate-900 text-white flex flex-col border-r border-slate-800 shadow-2xl relative transition-all duration-300 ease-in-out"
        >
            {/* Header */}
            <div className="p-6 flex items-center justify-between">
                <AnimatePresence mode='wait'>
                    {isOpen && (
                        <motion.h1 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent"
                        >
                            WABABLAS
                        </motion.h1>
                    )}
                </AnimatePresence>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Menu */}
            <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink 
                            key={item.path} 
                            to={item.path}
                            className={({ isActive }) => twMerge(clsx(
                                "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                isActive 
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-medium" 
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            ))}
                        >
                            <item.icon size={22} className={clsx("min-w-[22px]", isActive ? "animate-pulse" : "")} />
                            
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {/* Active Indicator Line */}
                            {isActive && (
                                <motion.div 
                                    layoutId="activeTab"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-white/20"
                                />
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800">
                <button 
                    onClick={handleLogout}
                    className={twMerge(clsx(
                        "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-300",
                        !isOpen && "justify-center px-0"
                    ))}
                >
                    <LogOut size={20} />
                    {isOpen && <span>Logout</span>}
                </button>
            </div>
        </motion.div>
    );
}
