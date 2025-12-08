import React, { useState, useEffect } from 'react';
import { Play, Clock, Coffee, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BreakManagement = () => {
    const navigate = useNavigate();
    const [breakTime, setBreakTime] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setBreakTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleResume = () => {
        navigate('/decoder');
    };

    return (
        <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="z-10 flex flex-col items-center max-w-md w-full p-8 text-center">
                <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Coffee size={48} className="text-amber-400" />
                </div>

                <h1 className="text-4xl font-bold mb-2 tracking-tight">On Break</h1>
                <p className="text-slate-400 mb-8 text-lg">You are currently not available for assignments.</p>

                <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 w-full mb-8">
                    <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2">Break Duration</div>
                    <div className="text-5xl font-mono font-bold text-white flex items-center justify-center gap-3">
                        <Clock size={32} className="text-amber-500" />
                        {formatTime(breakTime)}
                    </div>
                </div>

                <button
                    onClick={handleResume}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold py-4 px-8 rounded-xl shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Play size={24} fill="currentColor" />
                    Resume Work
                </button>

                <p className="mt-4 text-xs text-slate-500 flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    Clicking resume will immediately assign a new prescription.
                </p>
            </div>
        </div>
    );
};

export default BreakManagement;
