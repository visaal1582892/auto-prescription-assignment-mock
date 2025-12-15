import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    AlertCircle,
    Coffee,
    Send,
    ArrowRight,
    RotateCcw,
    Shield,
    FileText,
    User,
    Clock,
    XCircle,
    ZoomIn,
    ZoomOut,
    Maximize,
    LogOut,
    Eye,
    EyeOff,
    Activity,
    Lock,
    ChevronDown,
    Loader2,
    Bell,
    Volume2,
    LayoutDashboard,

    Store,
    PlayCircle,
    Users,
    TrendingUp,
    Calendar,
    ShieldCheck
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const DecoderWorkflow = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSeniorDecoder, setIsSeniorDecoder] = useState(true); // Toggle for demo
    const [showReportModal, setShowReportModal] = useState(false);
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);
    const [isGreenChannel, setIsGreenChannel] = useState(false);
    const [showInactivityModal, setShowInactivityModal] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());



    // Workflow State
    const [workflowStatus, setWorkflowStatus] = useState(() => {
        return sessionStorage.getItem('workflowStatus') || 'waiting';
    }); // 'waiting' | 'active' | 'dashboard'
    const [assignmentAlert, setAssignmentAlert] = useState(false);

    const playAlertSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.3);
            oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.4);

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.4);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    };

    const loadNextPrescription = () => {
        const mockPrescriptions = [
            [
                { id: Date.now(), name: "Augmentin 625 Duo", quantity: 6, dosage: "1-0-1", confidence: "High" },
                { id: Date.now() + 1, name: "Calpol 500mg", quantity: 15, dosage: "SOS", confidence: "High" },
                { id: Date.now() + 2, name: "Ascoril LS Syrup", quantity: 1, dosage: "10ml-0-10ml", confidence: "Medium" }
            ],
            [
                { id: Date.now(), name: "Rablet-D Capsule", quantity: 10, dosage: "1-0-0", confidence: "High" },
                { id: Date.now() + 1, name: "Zerodol-P Tablet", quantity: 10, dosage: "1-0-1", confidence: "High" }
            ],
            [
                { id: Date.now(), name: "Amoxyclav 625", quantity: 6, dosage: "1-0-1", confidence: "Medium" },
                { id: Date.now() + 1, name: "Metrogyl 400", quantity: 15, dosage: "1-0-1", confidence: "High" },
                { id: Date.now() + 2, name: "Pantocid 40", quantity: 10, dosage: "1-0-0", confidence: "High" }
            ]
        ];

        const randomPrescription = mockPrescriptions[Math.floor(Math.random() * mockPrescriptions.length)];
        setLineItems(randomPrescription);
        setLastActivity(Date.now());
    };

    const requestNotificationPermission = () => {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    };

    // Simulate Assignment Delay
    useEffect(() => {
        if (workflowStatus === 'waiting') {
            document.title = "Waiting for Assignment...";

            const delay = Math.random() * (5000 - 2000) + 2000; // 2-5 seconds
            const timer = setTimeout(() => {
                playAlertSound();
                setAssignmentAlert(true);

                // Browser Notification & Title update
                if (Notification.permission === 'granted') {
                    new Notification("New Prescription Assigned!", {
                        body: "A new priority task has been assigned to you.",
                        icon: "/vite.svg" // Placeholder icon
                    });
                }
                document.title = "(1) New Assignment! - Action Required";

                // Load new data just before showing the main screen
                setTimeout(() => {
                    loadNextPrescription();
                    setAssignmentAlert(false);
                    setWorkflowStatus('active');
                    document.title = "Decoder Dashboard";
                }, 1500); // Show alert for 1.5s
            }, delay);
            return () => {
                clearTimeout(timer);
                document.title = "Decoder Dashboard";
            };
        }
    }, [workflowStatus]);

    // Persist State
    useEffect(() => {
        sessionStorage.setItem('workflowStatus', workflowStatus);
    }, [workflowStatus]);

    // User Role Logic
    const [userRole, setUserRole] = useState('decoder');
    const [showSubmitMenu, setShowSubmitMenu] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem('userRole') || 'decoder';
        setUserRole(role);

        // Check for incoming intent from other pages (e.g. Store Search Claim)
        if (location.state?.startWorkflow) {
            setWorkflowStatus('waiting');
            if (location.state?.orderId) {
                // In a real app, we'd queue this specific ID
                console.log(`Queued Order ID: ${location.state.orderId}`);
            }
            // Clear the state so it doesn't re-trigger on reload
            navigate(location.pathname, { replace: true, state: {} });
        } else if (role === 'cluster_head' && !sessionStorage.getItem('init_done')) {
            // Only set default if not already initialized or saved
            // Actually, if we use the useState lazy init with sessionStorage, we just need to ensure we don't overwrite it here 
            // unless it's a fresh mounting where we *want* to force dashboard (e.g. first login).
            // But first login comes with empty session.
            // If I reload, session has 'active'. useState gets 'active'. 
            // !sessionStorage.getItem('workflowStatus') will be false. So we skip this. Correct.
            // But wait, if I reload, useState runs first. 
            // Then effect runs. 
            // If I do `!sessionStorage.getItem('workflowStatus')`, it might check the value I JUST saved in the previous effect?
            // No, effects run after render.

            // Let's use a separate flag or just relying on the fact that if useState found something, it's good.
            // If useState found 'waiting' (default), was it because it was 'waiting' or because it was empty?
            // If empty, we want 'dashboard'.
            // If 'waiting' (explicit), we want 'waiting'.

            // Safer check:
            const saved = sessionStorage.getItem('workflowStatus');
            if (!saved) {
                setWorkflowStatus('dashboard');
            }
        }
        sessionStorage.setItem('init_done', 'true'); // simple marker? No, logic above is enough if we trust useState.
    }, [location.state]);

    const [submitAction, setSubmitAction] = useState('next');



    const [lineItems, setLineItems] = useState([
        { id: 1, name: "Dolo 650mg Tablet", quantity: 10, dosage: "1-0-1", confidence: "High" },
        { id: 2, name: "Azithral 500mg Tablet", quantity: 3, dosage: "1-0-0", confidence: "Medium" },
        { id: 3, name: "Pan 40 Tablet", quantity: 10, dosage: "1-0-0", confidence: "High" },
    ]);

    // Inactivity Tracker
    useEffect(() => {
        const checkInactivity = setInterval(() => {
            if (Date.now() - lastActivity > 300000) { // 5 minutes
                setShowInactivityModal(true);
            }
        }, 1000);

        const resetActivity = () => setLastActivity(Date.now());
        window.addEventListener('mousemove', resetActivity);
        window.addEventListener('keydown', resetActivity);

        return () => {
            clearInterval(checkInactivity);
            window.removeEventListener('mousemove', resetActivity);
            window.removeEventListener('keydown', resetActivity);
        };
    }, [lastActivity]);



    const handleSubmit = () => {
        // Logic for immediate next assignment
        setLineItems([]); // Clear current items
        setWorkflowStatus('waiting'); // Trigger waiting screen loop
        setLastActivity(Date.now());
    };

    const handleSubmitAndBreak = () => {
        // Logic for submit and break
        navigate('/break');
    };

    const handleTransfer = () => {
        if (window.confirm("Are you sure you want to release this assignment back to the queue?")) {
            handleSubmit(); // Reuse submit logic to clear and wait
        }
    };

    const submitOptions = {
        next: { label: 'Submit & Next', icon: Send, color: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200', handler: handleSubmit },
        break: { label: 'Submit & Break', icon: Coffee, color: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200', handler: handleSubmitAndBreak },
        call: { label: 'Submit & Call', icon: CheckCircle, color: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200', handler: () => navigate('/store-search') },
        verify: { label: 'Submit & Verify', icon: Shield, color: 'bg-purple-600 hover:bg-purple-700 shadow-purple-200', handler: () => navigate('/verification') }
    };

    const currentOption = submitOptions[submitAction];

    if (workflowStatus === 'dashboard') {
        const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        return (
            <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
                {/* Top Navigation Bar */}
                <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-200">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Medplus<span className="text-indigo-600">Secure</span></h1>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Cluster Head Access</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                                        <Clock size={14} className="text-indigo-500" />
                                        {currentDate}
                                    </span>
                                </div>
                                <div className="h-8 w-px bg-slate-200 hidden md:block" />
                                <div className="flex items-center gap-3">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-bold text-slate-800">John Doe</p>
                                        <p className="text-xs text-slate-500">Cluster Head (EMP-001)</p>
                                    </div>
                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">
                                        JD
                                    </div>
                                    <button
                                        onClick={() => {
                                            sessionStorage.clear();
                                            navigate('/');
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                        title="Sign Out"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
                        <p className="text-slate-500 mt-1">Here's what's happening in your cluster today.</p>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {/* Metric 1 */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-slate-500">Pending Verification</span>
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <Shield size={18} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-900">12</span>
                                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">+4 new</span>
                            </div>
                        </div>

                        {/* Metric 2 */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-slate-500">Active Decoders</span>
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Users size={18} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-900">8</span>
                                <span className="text-sm text-slate-400">/ 10 online</span>
                            </div>
                        </div>

                        {/* Metric 3 */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-slate-500">Avg. Decode Time</span>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <TrendingUp size={18} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-900">4.2</span>
                                <span className="text-sm text-slate-400">mins</span>
                            </div>
                        </div>

                        {/* Metric 4 */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-slate-500">Accuracy Rate</span>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Activity size={18} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-900">98.5%</span>
                                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                                    <TrendingUp size={12} /> +0.2%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Action 1: Accept Prescriptions */}
                        <div className="lg:col-span-2 group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            <div className="p-8 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-6">
                                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                                            <PlayCircle size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">Accept Prescriptions</h3>
                                            <p className="text-slate-500 mb-6 max-w-lg leading-relaxed">
                                                Start auto-assignment mode to receive and process new prescriptions from the priority queue. Use this logic to act as a decoder when volume is high.
                                            </p>
                                            <button
                                                onClick={() => setWorkflowStatus('waiting')}
                                                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:transform active:scale-95"
                                            >
                                                Start Session <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action 2: Verification Queue */}
                        <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-100 transition-all p-8 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-8 -mb-8 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                            <div>
                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Shield size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Verification Queue</h3>
                                <p className="text-sm text-slate-500 mb-6">Review pending decoding tasks from your team. Ensure quality standards.</p>
                            </div>
                            <button
                                onClick={() => navigate('/verification')}
                                className="w-full flex items-center justify-between bg-white border-2 border-slate-100 hover:border-purple-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 px-4 py-3 rounded-xl font-bold transition-all group-hover:shadow-sm"
                            >
                                Go to Inbox <ArrowRight size={16} />
                            </button>
                        </div>

                        {/* Action 3: Store Search */}
                        <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all p-8 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-8 -mb-8 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                            <div>
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Store size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Search by Store</h3>
                                <p className="text-sm text-slate-500 mb-6">Locate specific orders using Store ID. Useful for resolving store-raised tickets.</p>
                            </div>
                            <button
                                onClick={() => navigate('/store-search')}
                                className="w-full flex items-center justify-between bg-white border-2 border-slate-100 hover:border-blue-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-4 py-3 rounded-xl font-bold transition-all group-hover:shadow-sm"
                            >
                                Find Order <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (workflowStatus === 'waiting' || assignmentAlert) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="text-center z-10 p-8 max-w-md w-full">
                    {assignmentAlert ? (
                        <div className="animate-in zoom-in fade-in duration-300">
                            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200 animate-bounce">
                                <Bell size={48} className="fill-current" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">New Prescription Assigned!</h2>
                            <p className="text-slate-500 text-lg">Loading secure data...</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            <div className="relative w-24 h-24 mx-auto mb-8">
                                <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                                <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping delay-150 opacity-10"></div>
                                <div className="relative bg-white p-6 rounded-full shadow-xl shadow-indigo-100 border border-indigo-50 z-10">
                                    <Loader2 size={40} className="text-indigo-600 animate-spin" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 mb-3">Waiting for Assignment</h2>
                            <div className="flex flex-col gap-2 items-center">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100">
                                    <Activity size={14} className="animate-pulse" />
                                    Searching Priority Queue...
                                </span>
                                <p className="text-slate-400 text-sm mt-4">
                                    Please keep this tab active. You will be notified when a task is assigned.
                                </p>
                            </div>

                            <div className="mt-8 flex flex-col items-center gap-3">
                                <button
                                    onClick={playAlertSound}
                                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    <Volume2 size={12} />
                                    Test Alert Sound
                                </button>

                                {userRole === 'cluster_head' && (
                                    <button
                                        onClick={() => setWorkflowStatus('dashboard')}
                                        className="text-xs text-slate-500 hover:text-slate-700 underline mt-2"
                                    >
                                        Cancel & Return to Dashboard
                                    </button>
                                )}

                                {Notification.permission === 'default' && (
                                    <button
                                        onClick={requestNotificationPermission}
                                        className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors font-medium border border-indigo-200"
                                    >
                                        Enable Desktop Notifications
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
            {/* Left Panel: Prescription Viewer */}
            <div className="w-1/2 flex flex-col border-r border-slate-200 bg-black/5 relative">
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    <div className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 backdrop-blur-sm">
                        <Shield size={12} />
                        <span>Secure View: Download Restricted</span>
                    </div>
                    {isSeniorDecoder && (
                        <button
                            onClick={() => setIsGreenChannel(!isGreenChannel)}
                            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-sm transition-all ${isGreenChannel ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-200 text-slate-500'}`}
                        >
                            <Activity size={12} />
                            {isGreenChannel ? 'Green Channel Active' : 'Standard Channel'}
                        </button>
                    )}
                </div>

                {/* Prescription Image with Zoom/Pan */}
                <div className="flex-1 bg-slate-800 relative overflow-hidden group">
                    {/* Watermark */}

                    {/* Toolbar */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                        <button
                            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                            className={`p-2 rounded-lg shadow-lg transition-all ${isPrivacyMode ? 'bg-indigo-600 text-white' : 'bg-white/90 text-slate-700 hover:bg-white'}`}
                            title="Privacy Mode (Blur PII)"
                        >
                            {isPrivacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button className="bg-white/90 p-2 rounded-lg shadow-lg hover:bg-white text-slate-700 transition-all" title="Zoom In">
                            <ZoomIn size={16} />
                        </button>
                        <button className="bg-white/90 p-2 rounded-lg shadow-lg hover:bg-white text-slate-700 transition-all" title="Zoom Out">
                            <ZoomOut size={16} />
                        </button>
                        <button className="bg-white/90 p-2 rounded-lg shadow-lg hover:bg-white text-slate-700 transition-all" title="Reset">
                            <RotateCcw size={16} />
                        </button>
                    </div>

                    {/* Image Container */}
                    <div className="w-full h-full flex items-center justify-center overflow-auto cursor-move">
                        <div className={`relative bg-white shadow-2xl min-w-[400px] min-h-[500px] flex items-center justify-center transition-all duration-300 ${isPrivacyMode ? 'blur-sm' : ''}`}>
                            <FileText size={64} className="text-slate-300" />
                            <p className="absolute bottom-4 text-slate-300 text-sm font-mono">RX-IMAGE-SOURCE</p>

                            {/* Watermark - Repeated User ID (Overlay) */}
                            <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-4 gap-12 opacity-20 select-none overflow-hidden p-8">
                                {Array(12).fill('EMP-JD-4492').map((text, i) => (
                                    <div key={i} className="flex items-center justify-center">
                                        <span className="-rotate-45 text-slate-900 font-bold text-sm whitespace-nowrap">
                                            {text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Simulated Rx Content */}
                            <div className="absolute inset-0 p-8 font-handwriting text-slate-600 opacity-60 pointer-events-none select-none">
                                <h2 className="text-xl mb-4 border-b border-slate-300 pb-2">Dr. Smith Clinic</h2>
                                <p className="mb-2">Patient: John Doe</p>
                                <p className="mb-4">Age: 45 | Sex: M</p>
                                <ul className="list-disc pl-5 space-y-4 text-lg">
                                    <li>Tab. Dolo 650mg <br /><span className="text-sm">1-0-1 x 5 days</span></li>
                                    <li>Tab. Azithral 500mg <br /><span className="text-sm">1-0-0 x 3 days</span></li>
                                    <li>Tab. Pan 40mg <br /><span className="text-sm">1-0-0 (BBF)</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Issue Reporting - Bottom Left */}
                <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-slate-500">
                            ID: <span className="font-mono font-bold text-slate-700">RX-99283-AC</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                            <Lock size={10} />
                            SESSION MONITORED
                        </div>
                    </div>
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <AlertCircle size={16} />
                        Report Issue / Release
                    </button>
                </div>
                {/* Disclaimer */}
                <div className="bg-red-50 text-red-600 text-[10px] text-center py-1 font-medium border-t border-red-100 select-none">
                    No photos allowed. Violaters may face legal action
                </div>
            </div>

            {/* Right Panel: Data Entry & AI */}
            <div className="w-1/2 flex flex-col bg-white">
                {/* Header */}
                <div className={`h-16 border-b flex items-center justify-between px-6 shadow-sm z-10 transition-colors ${isGreenChannel ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${isGreenChannel ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            <RotateCcw size={12} className="animate-spin-slow" />
                            {isGreenChannel ? 'Priority Assignment' : 'Auto-Assigned'}
                        </div>
                        <div className="h-4 w-px bg-slate-300 mx-1" />
                        <div className="flex items-center gap-4 text-slate-500 text-xs">
                            <div className="flex items-center gap-1">
                                <span className="font-medium">Created:</span>
                                <span className="font-mono">14:20</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-medium">Arrived:</span>
                                <span className="font-mono">14:22</span>
                                <span className="text-red-500 font-bold ml-1">(+2m Lag)</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => navigate('/')}
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">
                                JD
                            </div>
                            <div className="text-xs">
                                <p className="font-medium text-slate-900">John Doe</p>
                                <p className="text-slate-500">Decoder L2</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* AI Analysis Panel */}
                    <div className="mb-6 bg-indigo-50/50 rounded-xl border border-indigo-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                AI Analysis
                            </h3>
                            <span className="text-xs text-indigo-600 font-medium bg-indigo-100 px-2 py-0.5 rounded">
                                Confidence: 92%
                            </span>
                        </div>
                        <p className="text-sm text-indigo-800/80 leading-relaxed mb-3">
                            "Patient requires Dolo 650 for fever and Azithral for infection. Pan 40 for acidity."
                        </p>

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-indigo-900/70 uppercase tracking-wider">Probable Line Items</h4>
                            {lineItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-indigo-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                                    <div className={`w-1 h-8 rounded-full ${item.confidence === 'High' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-slate-800">{item.name}</span>
                                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{item.quantity} units</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 flex gap-2">
                                            <span>Dosage: {item.dosage}</span>
                                            {item.confidence === 'High' && <span className="text-emerald-600 flex items-center gap-0.5"><CheckCircle size={10} /> Verified</span>}
                                        </div>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 text-indigo-600 bg-indigo-50 p-1.5 rounded hover:bg-indigo-100 transition-all">
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Manual Entry Form */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h3 className="text-sm font-bold text-slate-900">Transcription Entry</h3>
                            <button className="text-xs text-indigo-600 font-medium hover:underline">+ Add Line Item</button>
                        </div>

                        <div className="space-y-3">
                            {/* Form Header */}
                            <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 px-2">
                                <div className="col-span-1">#</div>
                                <div className="col-span-5">Product Name</div>
                                <div className="col-span-2">Qty</div>
                                <div className="col-span-3">Frequency</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Rows */}
                            {[1, 2, 3].map((row) => (
                                <div key={row} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                                    <div className="col-span-1 text-center font-mono text-slate-400 text-sm">{row}</div>
                                    <div className="col-span-5">
                                        <input
                                            type="text"
                                            placeholder="Search product..."
                                            className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-center"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <select className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500">
                                            <option>1-0-1</option>
                                            <option>1-0-0</option>
                                            <option>0-0-1</option>
                                            <option>SOS</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <button className="text-slate-400 hover:text-red-500 transition-colors">
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-3">
                        {isSeniorDecoder && (
                            <button
                                onClick={handleTransfer}
                                className="mr-auto text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                                Transfer / Reassign
                            </button>
                        )}

                        {/* Unified Submit Dropdown for All Roles */}
                        {/* Split Button Implementation */}
                        <div className="relative flex-[2] flex gap-0.5 shadow-lg shadow-slate-200 rounded-lg transition-all active:scale-[0.98]">
                            <button
                                onClick={currentOption.handler}
                                className={`flex-1 ${currentOption.color} text-white px-4 py-2.5 rounded-l-lg font-bold text-sm flex items-center justify-center gap-2 transition-all`}
                            >
                                <currentOption.icon size={18} />
                                {currentOption.label}
                            </button>
                            <button
                                onClick={() => setShowSubmitMenu(!showSubmitMenu)}
                                className={`${currentOption.color} text-white px-1.5 py-2.5 rounded-r-lg border-l border-white/20 hover:brightness-110 transition-all flex items-center justify-center`}
                            >
                                <ChevronDown size={16} className={`transition-transform duration-200 ${showSubmitMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showSubmitMenu && (
                                <div className="absolute bottom-full right-0 mb-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
                                    {Object.entries(submitOptions)
                                        .filter(([key]) => userRole === 'cluster_head' || key !== 'verify')
                                        .map(([key, option]) => (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    setSubmitAction(key);
                                                    setShowSubmitMenu(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0 ${submitAction === key ? 'bg-slate-50 text-slate-900' : 'text-slate-600'}`}
                                            >
                                                <option.icon size={16} className={key === 'next' ? 'text-emerald-500' : key === 'break' ? 'text-amber-500' : key === 'call' ? 'text-indigo-500' : 'text-purple-500'} />
                                                {option.label}
                                                {submitAction === key && <CheckCircle size={14} className="ml-auto text-slate-400" />}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Issue Modal */}
            {
                showReportModal && (
                    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                                    <AlertCircle className="text-red-600" />
                                    Report Issue
                                </h3>
                                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-sm text-slate-600">
                                    Please select the reason for reporting this prescription. This will release the assignment back to the queue.
                                </p>

                                <div className="space-y-2">
                                    {['Image not visible / blurry', 'Incorrect Auto-Assignment', 'Technical Glitch', 'Other'].map((reason) => (
                                        <label key={reason} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                            <input type="radio" name="reportReason" className="text-red-600 focus:ring-red-500" />
                                            <span className="text-sm font-medium text-slate-700">{reason}</span>
                                        </label>
                                    ))}
                                </div>

                                <textarea
                                    placeholder="Additional comments (optional)..."
                                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none h-24 resize-none"
                                />
                            </div>

                            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        const newReport = {
                                            id: Date.now(),
                                            type: 'reported',
                                            message: `Issue Reported: RX-99283-AC - ${document.querySelector('input[name="reportReason"]:checked')?.nextSibling?.textContent || 'General Issue'}`,
                                            severity: 'high',
                                            timestamp: new Date().toISOString()
                                        };

                                        const existingReports = JSON.parse(localStorage.getItem('medplus_reports') || '[]');
                                        localStorage.setItem('medplus_reports', JSON.stringify([newReport, ...existingReports]));

                                        setShowReportModal(false);
                                        // alert("Issue Reported. Assignment Released.");
                                        handleSubmit(); // Release assignment and go to waiting
                                        window.dispatchEvent(new Event('storage'));
                                    }}
                                    className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-200"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }



            {/* Inactivity Modal */}
            {
                showInactivityModal && (
                    <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden text-center p-8">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <Clock size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Are you still working?</h2>
                            <p className="text-slate-500 mb-8">
                                We haven't detected any activity for a while. To prevent reassignment, please confirm you are still here.
                            </p>
                            <button
                                onClick={() => {
                                    setShowInactivityModal(false);
                                    setLastActivity(Date.now());
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                            >
                                I'm still here
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default DecoderWorkflow;
