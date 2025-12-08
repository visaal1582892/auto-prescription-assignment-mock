import React, { useState, useEffect } from 'react';
import {
    Users,
    Clock,
    AlertTriangle,
    Activity,
    TrendingUp,
    AlertOctagon,
    Briefcase,
    Coffee,
    LogOut,
    FileText,
    CheckCircle,
    XCircle,
    Calendar,
    Home,
    Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SupervisorDashboard = () => {
    const navigate = useNavigate();
    // State for live metrics
    const [stats, setStats] = useState({
        totalEmployees: 124,
        loggedIn: 89,
        working: 76,
        onBreak: 13,
        prescriptionsReceived: 1450,
        pending: 42,
        avgDecodeTime: "1m 45s",
        greenChannelCount: 142,
        returnedCount: 12,
        // Efficiency Metrics
        lessThan1Min: 450,
        oneToThreeMin: 600,
        threeToFiveMin: 150,
        exceeded5Min: 35,
        exceeded7Min: 18,
        exceeded10Min: 13
    });

    // Simulate live updates
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => {
                const newWorking = Math.min(prev.loggedIn, Math.max(50, prev.working + (Math.random() > 0.5 ? 1 : -1)));
                const newPrescriptions = Math.floor(Math.random() * 3);

                return {
                    ...prev,
                    prescriptionsReceived: prev.prescriptionsReceived + newPrescriptions,
                    pending: Math.max(0, prev.pending + Math.floor(Math.random() * 5) - 2),
                    working: newWorking,
                    onBreak: prev.loggedIn - newWorking,
                    greenChannelCount: prev.greenChannelCount + (Math.random() > 0.7 ? 1 : 0),
                    // Update efficiency metrics
                    lessThan1Min: prev.lessThan1Min + (Math.random() > 0.4 ? newPrescriptions : 0),
                    oneToThreeMin: prev.oneToThreeMin + (Math.random() <= 0.4 ? newPrescriptions : 0),
                    threeToFiveMin: prev.threeToFiveMin + (Math.random() > 0.8 ? 1 : 0),
                    exceeded5Min: prev.exceeded5Min + (Math.random() > 0.9 ? 1 : 0),
                    exceeded7Min: prev.exceeded7Min + (Math.random() > 0.95 ? 1 : 0),
                    exceeded10Min: prev.exceeded10Min + (Math.random() > 0.98 ? 1 : 0)
                };
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const breakList = [
        { name: "Sarah Jenkins", time: "12:45", status: "On Break", type: "In-House" },
        { name: "Mike Ross", time: "05:20", status: "On Break", type: "WFH" },
        { name: "Rachel Green", time: "02:15", status: "On Break", type: "In-House" },
    ];



    const [currentTime, setCurrentTime] = useState(Date.now());
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [showReassign, setShowReassign] = useState(false);
    const [reassignUser, setReassignUser] = useState('');

    // Update timer every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDuration = (startTime) => {
        const diff = Math.max(0, currentTime - startTime);
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    const [criticalAlerts, setCriticalAlerts] = useState([
        {
            id: 1,
            type: 'pending',
            message: "RX-9921 pending",
            severity: 'high',
            startTime: Date.now() - (8 * 60 * 1000 + 45 * 1000), // 8m 45s ago
            assignedTo: "Alice Cooper",
            patientName: "John Smith",
            imageUrl: "https://placehold.co/600x400/e2e8f0/475569?text=Prescription+RX-9921"
        },
        {
            id: 2,
            type: 'idle',
            message: "User 'J.Doe' idle for 2m 15s (No Break Logged) - KPI Impact Alert",
            severity: 'high',
            startTime: Date.now() - (2 * 60 * 1000 + 15 * 1000), // 2m 15s ago
            assignedTo: "J. Doe",
            patientName: "N/A",
            imageUrl: null
        },
        {
            id: 3,
            type: 'pending',
            message: "RX-8822 pending",
            severity: 'high',
            startTime: Date.now() - (6 * 60 * 1000 + 10 * 1000), // 6m 10s ago
            assignedTo: "Bob Martin",
            patientName: "Jane Doe",
            imageUrl: "https://placehold.co/600x400/e2e8f0/475569?text=Prescription+RX-8822"
        },
    ]);

    // Load reports from localStorage
    useEffect(() => {
        const loadReports = () => {
            const savedReports = JSON.parse(localStorage.getItem('medplus_reports') || '[]');
            if (savedReports.length > 0) {
                setCriticalAlerts(prev => {
                    // Merge saved reports with initial mock alerts, avoiding duplicates by ID
                    const initialIds = new Set([1, 2, 3]);
                    const newAlerts = savedReports.filter(r => !initialIds.has(r.id));
                    return [...newAlerts, ...prev.filter(p => initialIds.has(p.id))];
                });
            }
        };

        loadReports();
        // Poll for changes every 2 seconds to simulate live sync
        const interval = setInterval(loadReports, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleResetDemo = () => {
        localStorage.removeItem('medplus_reports');
        window.location.reload();
    };

    const leaderboard = [
        { name: "Alice Cooper", total: 145, perHour: 42, accuracy: "99.5%", greenCount: 24, greenStatus: "Expert" },
        { name: "Bob Martin", total: 132, perHour: 38, accuracy: "98.2%", greenCount: 15, greenStatus: "Active" },
        { name: "Charlie Day", total: 128, perHour: 36, accuracy: "99.1%", greenCount: 8, greenStatus: "Active" },
        { name: "Diana Prince", total: 120, perHour: 35, accuracy: "99.8%", greenCount: 32, greenStatus: "Expert" },
    ];

    // Filter alerts > 5 mins
    // Filter alerts > 5 mins and type is 'pending'
    const filteredAlerts = criticalAlerts.filter(alert => {
        const duration = Date.now() - alert.startTime;
        return duration > 5 * 60 * 1000 && alert.type === 'pending';
    });

    const handleDismiss = (id, e) => {
        e.stopPropagation();
        setCriticalAlerts(prev => prev.filter(alert => alert.id !== id));
        if (selectedAlert?.id === id) {
            setSelectedAlert(null);
            setShowReassign(false);
        }
    };

    const handleForceComplete = (id) => {
        setCriticalAlerts(prev => prev.filter(alert => alert.id !== id));
        setStats(prev => ({
            ...prev,
            prescriptionsReceived: prev.prescriptionsReceived + 1,
            pending: Math.max(0, prev.pending - 1)
        }));
        setSelectedAlert(null);
        setShowReassign(false);
    };

    const handleReassign = () => {
        if (!reassignUser) return;

        setCriticalAlerts(prev => prev.map(alert => {
            if (alert.id === selectedAlert.id) {
                return { ...alert, assignedTo: reassignUser, startTime: Date.now() }; // Reset time on reassign
            }
            return alert;
        }));

        setSelectedAlert(null);
        setShowReassign(false);
        setReassignUser('');
    };

    const availableUsers = [
        "Alice Cooper", "Bob Martin", "Charlie Day", "Diana Prince", "Evan Wright", "Fiona Gallagher"
    ].filter(user => user !== selectedAlert?.assignedTo);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 text-white p-2 rounded-lg">
                        <Activity size={20} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Supervisor Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/performance-report')}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <Calendar size={14} />
                        Decoders Performance Report
                    </button>
                    <button
                        onClick={() => navigate('/prescription-report')}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <FileText size={14} />
                        Prescription Report
                    </button>
                    <button
                        onClick={handleResetDemo}
                        className="text-xs text-slate-500 hover:text-red-600 font-medium border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        Reset Demo
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        <LogOut size={14} />
                        Logout
                    </button>
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Live Feed Active
                    </div>
                    <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-xs">
                        SV
                    </div>
                </div>
            </nav>

            <div className="p-6 max-w-7xl mx-auto space-y-6">

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-slate-500 text-sm font-medium">Total Employees</h3>
                            <Users size={18} className="text-indigo-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{stats.totalEmployees}</p>
                        <div className="flex gap-2 mt-2 text-xs">
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">{stats.loggedIn} Logged In</span>
                            <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{stats.totalEmployees - stats.loggedIn} Offline</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-slate-500 text-sm font-medium">Active Workforce</h3>
                            <Briefcase size={18} className="text-emerald-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{stats.working}</p>
                        <p className="text-xs text-slate-500 mt-1">Currently decoding prescriptions</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-slate-500 text-sm font-medium">On Break</h3>
                            <Coffee size={18} className="text-amber-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{stats.onBreak}</p>
                        <p className="text-xs text-amber-600 mt-1 font-medium">1 Critical Duration (&gt;15m)</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-slate-500 text-sm font-medium">Pending Queue</h3>
                            <AlertTriangle size={18} className="text-red-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                        <p className="text-xs text-slate-500 mt-1">Avg Wait: <span className="font-mono font-bold">45s</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Row 1: High Level Stats (Employee Status) */}
                    <div className="col-span-12 lg:col-span-3 space-y-4">
                        {/* Break Duration Tracking */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-1 h-full">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Clock size={14} /> Break Watch
                            </h2>
                            <div className="space-y-2">
                                {breakList.map((person, idx) => (
                                    <div key={idx} className={`flex items-center justify-between text-sm p-2 rounded border ${person.type === 'WFH' ? 'bg-indigo-200/50 border-indigo-100' : 'bg-slate-200/50 border-slate-200'}`}>
                                        <div className="flex items-center gap-2">
                                            {person.type === 'WFH' ? (
                                                <Home size={14} className="text-indigo-500" title="Work From Home" />
                                            ) : (
                                                <Building size={14} className="text-slate-500" title="In-House" />
                                            )}
                                            <span className="font-medium text-slate-700">{person.name}</span>
                                        </div>
                                        <span className={`font-mono font-bold ${parseInt(person.time) > 10 ? 'text-red-600' : 'text-amber-600'}`}>
                                            {person.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Row 1: Real-Time Efficiency & Alerts */}
                    <div className="col-span-12 lg:col-span-6 space-y-6">
                        {/* Efficiency Panel */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <TrendingUp size={16} className="text-indigo-600" />
                                    Prescription Velocity
                                </h2>
                                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded">
                                    Total: {stats.prescriptionsReceived}
                                </span>
                            </div>

                            <div className="grid grid-cols-6 gap-2 text-center">
                                <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                                    <div className="text-lg font-bold text-emerald-700">{stats.lessThan1Min}</div>
                                    <div className="text-[10px] text-emerald-600 font-medium">&lt; 1 min</div>
                                </div>
                                <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                                    <div className="text-lg font-bold text-emerald-700">{stats.oneToThreeMin}</div>
                                    <div className="text-[10px] text-emerald-600 font-medium">1-3 min</div>
                                </div>
                                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                    <div className="text-lg font-bold text-blue-700">{stats.threeToFiveMin}</div>
                                    <div className="text-[10px] text-blue-600 font-medium">3-5 min</div>
                                </div>
                                <div className="bg-amber-50 p-2 rounded border border-amber-100">
                                    <div className="text-lg font-bold text-amber-700">{stats.exceeded5Min}</div>
                                    <div className="text-[10px] text-amber-600 font-bold">5+ min</div>
                                </div>
                                <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                    <div className="text-lg font-bold text-orange-700">{stats.exceeded7Min}</div>
                                    <div className="text-[10px] text-orange-600 font-bold">7+ min</div>
                                </div>
                                <div className="bg-red-50 p-2 rounded border border-red-100 animate-pulse">
                                    <div className="text-lg font-bold text-red-700">{stats.exceeded10Min}</div>
                                    <div className="text-[10px] text-red-600 font-bold">10+ min</div>
                                </div>
                            </div>
                        </div>

                        {/* Critical Alerts */}
                        <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
                            <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex justify-between items-center">
                                <h2 className="text-sm font-bold text-red-800 flex items-center gap-2">
                                    <AlertOctagon size={16} />
                                    Critical Attention Required
                                </h2>
                                <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">{filteredAlerts.length} Active (&gt;5m)</span>
                            </div>
                            <div className="divide-y divide-red-50">
                                {filteredAlerts.length === 0 ? (
                                    <div className="p-4 text-center text-slate-500 text-sm">
                                        No critical alerts pending for more than 5 minutes.
                                    </div>
                                ) : (
                                    filteredAlerts.map((alert) => (
                                        <div key={alert.id} className="p-3 flex items-start gap-3 hover:bg-red-50/50 transition-colors">
                                            <AlertTriangle size={18} className={alert.type === 'idle' ? 'text-amber-500' : 'text-red-600'} />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-800">{alert.message}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <button
                                                        onClick={() => setSelectedAlert(alert)}
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        Investigate
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDismiss(alert.id, e)}
                                                        className="text-xs text-slate-500 hover:underline"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono font-bold text-red-600">
                                                {formatDuration(alert.startTime)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Row 1: Leaderboard & Metrics */}
                    <div className="col-span-12 lg:col-span-3 space-y-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-full">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Activity size={14} /> Top Performers
                            </h2>
                            <div className="space-y-3">
                                {leaderboard.map((user, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx === 0 ? 'bg-amber-400' : 'bg-slate-300'}`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-800">{user.name}</div>
                                                <div className="text-[10px] text-slate-500 flex gap-2">
                                                    <span>Acc: {user.accuracy}</span>
                                                    <span className="text-emerald-600 font-bold">Green: {user.greenCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-indigo-600">{user.total}</div>
                                            <div className="text-[10px] text-slate-400">{user.perHour}/hr</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quality Control</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-green-50 p-2 rounded border border-green-100">
                                        <div className="text-xl font-bold text-green-700">{stats.greenChannelCount}</div>
                                        <div className="text-[10px] text-green-600">Green Priority</div>
                                    </div>
                                    <div className="bg-red-50 p-2 rounded border border-red-100">
                                        <div className="text-xl font-bold text-red-700">{stats.returnedCount}</div>
                                        <div className="text-[10px] text-red-600">Returned</div>
                                    </div>
                                </div>
                                <div className="mt-3 bg-indigo-50 p-2 rounded border border-indigo-100">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-indigo-700 font-medium">Accuracy Rate</span>
                                        <span className="text-indigo-700 font-bold">98.4%</span>
                                    </div>
                                    <div className="w-full bg-indigo-200 rounded-full h-1.5">
                                        <div className="bg-indigo-600 h-1.5 rounded-full w-[98.4%]"></div>
                                    </div>
                                    <div className="text-[10px] text-indigo-500 mt-1 text-center">
                                        142 Edits / 8900 Decodes
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Investigate Modal */}
            {selectedAlert && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <AlertOctagon className="text-red-600" size={20} />
                                Investigation Required
                            </h2>
                            <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex gap-6">
                                {/* Left: Image Placeholder */}
                                <div className="w-1/2 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center min-h-[200px]">
                                    {selectedAlert.imageUrl ? (
                                        <img src={selectedAlert.imageUrl} alt="Prescription" className="max-w-full max-h-full rounded" />
                                    ) : (
                                        <div className="text-slate-400 flex flex-col items-center">
                                            <FileText size={48} />
                                            <span className="text-sm mt-2">No Image Available</span>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Details */}
                                <div className="w-1/2 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Alert Details</h3>
                                            <p className="text-sm font-medium text-slate-800">{selectedAlert.message}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${selectedAlert.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {selectedAlert.severity} Priority
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned To</h3>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {selectedAlert.assignedTo.charAt(0)}
                                                </div>
                                                <span className="text-sm text-slate-700">{selectedAlert.assignedTo}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Patient</h3>
                                            <span className="text-sm text-slate-700">{selectedAlert.patientName}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Received At</h3>
                                            <span className="text-sm text-slate-700 font-mono">
                                                {new Date(selectedAlert.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prescription ID</h3>
                                            <span className="text-sm text-slate-700 font-mono">RX-{9000 + selectedAlert.id}</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">History</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>Arrived in Queue</span>
                                                <span className="font-mono">{new Date(selectedAlert.startTime - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>Assigned to {selectedAlert.assignedTo}</span>
                                                <span className="font-mono">{new Date(selectedAlert.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-red-600 font-bold">
                                                <span>SLA Breach Detected</span>
                                                <span className="font-mono">{new Date(selectedAlert.startTime + 5 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                        <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Pending Duration</h3>
                                        <div className="text-2xl font-mono font-bold text-red-600">
                                            {formatDuration(selectedAlert.startTime)}
                                        </div>
                                        <p className="text-[10px] text-red-500 mt-1">Exceeds critical threshold of 5m</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                            {showReassign ? (
                                <div className="flex items-center gap-3 w-full justify-end animate-in fade-in slide-in-from-right-4 duration-200">
                                    <span className="text-sm font-medium text-slate-700">Reassign to:</span>
                                    <select
                                        value={reassignUser}
                                        onChange={(e) => setReassignUser(e.target.value)}
                                        className="text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        autoFocus
                                    >
                                        <option value="">Select Employee...</option>
                                        {availableUsers.map(user => (
                                            <option key={user} value={user}>{user}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setShowReassign(false)}
                                        className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReassign}
                                        disabled={!reassignUser}
                                        className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Confirm Reassign
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setSelectedAlert(null)}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => setShowReassign(true)}
                                        className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                                    >
                                        Reassign Task
                                    </button>
                                    <button
                                        onClick={() => handleForceComplete(selectedAlert.id)}
                                        className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                                    >
                                        Force Complete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupervisorDashboard;
