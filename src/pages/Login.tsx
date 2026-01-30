import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const { checkUserStatus } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            await authService.login(email, password);
            await checkUserStatus();
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Akun tidak ditemukan atau password salah.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
            {/* --- BACKGROUND LAYERS (Modern Tech Mesh Gradient with Noise) --- */}
            
            {/* Layer 1: Animated Gradient Blobs */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 -left-4 w-[500px] h-[500px] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-[500px] h-[500px] bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-[500px] h-[500px] bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            {/* Layer 2: Grid Pattern */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Layer 3: Noise Texture (Matte Finish) */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}></div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-sm bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 sm:p-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600 tracking-tighter mb-2">
                        WABABLAS
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Welcome back, Master.</p>
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium border border-red-100 mb-6 text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="relative group">
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="peer w-full px-4 pt-6 pb-2 rounded-xl bg-white/50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-0 outline-none transition-all text-slate-900 placeholder-transparent text-sm"
                            placeholder="Email"
                        />
                        <label className="absolute left-4 top-4 text-slate-400 text-xs transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-1.5 peer-valid:text-xs pointer-events-none">
                            Email Address
                        </label>
                    </div>

                    <div className="relative group">
                        <input 
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="peer w-full px-4 pt-6 pb-2 rounded-xl bg-white/50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-0 outline-none transition-all text-slate-900 placeholder-transparent text-sm pr-10"
                            placeholder="Password"
                        />
                        <label className="absolute left-4 top-4 text-slate-400 text-xs transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-1.5 peer-valid:text-xs pointer-events-none">
                            Password
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button 
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transform active:scale-95 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Logging in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-sm text-slate-600">
                        Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:text-blue-700">Sign up</Link>
                    </p>
                </div>
            </motion.div>

            {/* Footer Branding */}
            <div className="absolute bottom-6 left-0 right-0 text-center z-10">
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase opacity-70 hover:opacity-100 transition-opacity cursor-default">
                    Developed by <span className="font-bold text-slate-800">Ahdi Aghni</span>
                </p>
            </div>
        </div>
    );
};

export default Login;