import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            // Mock successful login
            if (email && password) {
                sessionStorage.clear(); // Ensure fresh session
                localStorage.setItem('isAuthenticated', 'true');
                // Redirect based on role (simulated)
                if (email === 'clusterhead@medplus.com') {
                    localStorage.setItem('userRole', 'cluster_head');
                    navigate('/decoder');
                } else if (email.includes('admin')) {
                    localStorage.setItem('userRole', 'supervisor');
                    navigate('/supervisor');
                } else {
                    localStorage.setItem('userRole', 'decoder');
                    navigate('/decoder');
                }
            } else {
                alert("Please enter any email and password to demo.");
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">

                {/* Header / Branding */}
                <div className="bg-indigo-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')]"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
                            <ShieldCheck size={32} className="text-emerald-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Medplus Secure</h1>
                        <p className="text-indigo-200 text-sm mt-2">Prescription Decoding System</p>
                    </div>
                </div>

                {/* Login Form */}
                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    list="email-options"
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setEmail(val);
                                        if (val === 'admin@medplus.com' || val === 'decoder@medplus.com') {
                                            setPassword('password123');
                                        }
                                    }}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                    placeholder="user@medplus.com"
                                    required
                                />
                                <datalist id="email-options">
                                    <option value="admin@medplus.com">Admin Access</option>
                                    <option value="decoder@medplus.com">Decoder Access</option>
                                    <option value="clusterhead@medplus.com">Cluster Head Access</option>
                                </datalist>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                                <span className="text-slate-600">Remember me</span>
                            </label>
                            <a href="#" className="text-indigo-600 hover:text-indigo-800 font-medium">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    Sign In <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-400">
                            Restricted Access System. <br />
                            Unauthorized access is prohibited and monitored.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
