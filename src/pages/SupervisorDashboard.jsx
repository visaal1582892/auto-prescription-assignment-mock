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
    Building,
    ChevronDown,
    Menu,
    Smartphone,

    Bell,
    MapPin,
    Phone,
    User,
    DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SupervisorDashboard = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('ALL'); // 'ALL', 'IN_HOUSE', 'WFH'
    const [channelMode, setChannelMode] = useState('ALL'); // 'ALL', 'GREEN', 'NORMAL'

    // State for live metrics - Split by Location x Channel
    // 4 buckets: inHouseGreen, inHouseNormal, wfhGreen, wfhNormal
    const [stats, setStats] = useState(() => {
        // Initialize with realistic distribution matching Prescription Velocity Report
        // Distribution: <1(20%), 1-3(33%), 3-5(22%), 5-7(13%), 7-10(7%), >10(5%)
        const total = Math.floor(Math.random() * 1000) + 1000;

        return {
            inHouseGreen: { total: 30, loggedIn: 25, working: 22, onBreak: 3 },
            inHouseNormal: { total: 54, loggedIn: 35, working: 30, onBreak: 5 },
            wfhGreen: { total: 15, loggedIn: 12, working: 10, onBreak: 2 },
            wfhNormal: { total: 25, loggedIn: 17, working: 14, onBreak: 3 },
            // Shared/Global Metrics
            prescriptionsReceived: total,
            pending: 42,
            avgDecodeTime: "1m 45s",
            greenChannelCount: Math.floor(total * 0.12),
            returnedCount: Math.floor(total * 0.01),
            // Efficiency Metrics - Matched with Velocity Report Distribution
            lessThan1Min: Math.floor(total * 0.20),
            oneToThreeMin: Math.floor(total * 0.33),
            threeToFiveMin: Math.floor(total * 0.22),
            exceeded5Min: Math.floor(total * 0.13),
            exceeded7Min: Math.floor(total * 0.07),
            exceeded10Min: Math.floor(total * 0.05),
            // Pending Breakdown
            pendingGreen: 8,
            pendingRed: 5,
            pendingNormal: 29
        };
    });



    // --- Mock Data Generators ---
    const NAMES = [
        "Aarav Sharma", "Vihaan Gupta", "Aditya Patel", "Sai Krishna", "Reyansh Reddy",
        "Ishaan Kumar", "Ananya Reddy", "Diya Rao", "Saanvi Nair", "Kiara Singh",
        "Rohan Verma", "Karthik Iyer", "Rahul Menon", "Vikram Malhotra", "Arjun Das",
        "Meera Joshi", "Nia Kapoor", "Riya Jain", "Kavya Choudhury", "Pooja Hegde",
        "Suresh Babu", "Ramesh Yadav", "Venkatesh Rao", "Srinivas Murthy", "Lakshmi Narayana",
        "Manish Pandey", "Deepak Chopra", "Amitabh Bachan", "Shahrukh Khan", "Salman Khan",
        "Priya Varrier", "Samantha Ruth", "Rashmika Mandanna", "Keerthy Suresh", "Sai Pallavi",
        "Naga Chaitanya", "Vijay Devarakonda", "Prabhas Raju", "Allu Arjun", "Mahesh Babu",
        "Ram Charan", "Jr NTR", "Pawan Kalyan", "Ravi Teja", "Nani Ghanta",
        "Kabir Singh", "Preeti Sikka", "Arjun Reddy", "Shiva Gamini", "Amarendra Baahubali"
    ];

    const generateOfflineUsers = (count) => {
        return Array.from({ length: count }, (_, i) => {
            const name = NAMES[i % NAMES.length]; // Cycle through names if count > formatted names
            // Generate realistic Indian mobile number starting with 9, 8, 7, or 6
            const prefix = [9, 8, 7, 6][Math.floor(Math.random() * 4)];
            const suffix = Math.floor(Math.random() * 900000000) + 100000000;
            return {
                id: `OFF_${i}`,
                empId: `EMP${(10000 + i + Math.floor(Math.random() * 5000)).toString().substring(1)}`, // Mock Emp ID
                name: `${name}${i >= NAMES.length ? ` (${Math.floor(i / NAMES.length) + 1})` : ''}`, // Append number if recycling names
                phone: `+91 ${prefix}${suffix.toString().substring(0, 4)} ${suffix.toString().substring(4)}`
            };
        });
    };

    const [offlineModalState, setOfflineModalState] = useState({ isOpen: false, users: [] });

    const handleOfflineClick = (offlineCount) => {
        const users = generateOfflineUsers(offlineCount);
        setOfflineModalState({ isOpen: true, users });
    };

    // Helper to get displayed counts based on viewMode AND channelMode
    const getDisplayStats = () => {
        let buckets = [];

        // 1. Filter by Location (viewMode)
        if (viewMode === 'ALL') {
            buckets = ['inHouseGreen', 'inHouseNormal', 'wfhGreen', 'wfhNormal'];
        } else if (viewMode === 'IN_HOUSE') {
            buckets = ['inHouseGreen', 'inHouseNormal'];
        } else if (viewMode === 'WFH') {
            buckets = ['wfhGreen', 'wfhNormal'];
        }

        // 2. Filter by Channel (channelMode) within selected location buckets
        if (channelMode === 'GREEN') {
            buckets = buckets.filter(b => b.includes('Green'));
        } else if (channelMode === 'NORMAL') {
            buckets = buckets.filter(b => b.includes('Normal'));
        }

        // 3. Sum up the selected buckets
        return buckets.reduce((acc, key) => {
            const bucket = stats[key];
            return {
                total: acc.total + bucket.total,
                loggedIn: acc.loggedIn + bucket.loggedIn,
                working: acc.working + bucket.working,
                onBreak: acc.onBreak + bucket.onBreak
            };
        }, { total: 0, loggedIn: 0, working: 0, onBreak: 0 });
    };

    const displayStats = getDisplayStats();

    // Simulate live updates
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => {
                const updateBucket = (bucket) => {
                    const newWorking = Math.min(bucket.loggedIn, Math.max(Math.floor(bucket.loggedIn * 0.6), bucket.working + (Math.random() > 0.5 ? 1 : -1)));
                    return {
                        ...bucket,
                        working: newWorking,
                        onBreak: bucket.loggedIn - newWorking
                    };
                };

                // New Logic Breakdown:
                // Red (Fresh): New arrivals (~40%)
                // Green (Complex): Hard to decode (~30%)
                // White (>5min): Stale/Escalated (Remainder)
                const newPending = Math.max(0, prev.pending + Math.floor(Math.random() * 5) - 2);
                const newPendingRed = Math.floor(newPending * 0.4); // Fresh
                const newPendingGreen = Math.floor(newPending * 0.3); // Complex
                const newPendingNormal = newPending - newPendingRed - newPendingGreen; // >5min

                // Weighted Velocity Updates based on Report Distribution
                const r = Math.random();
                let velocityUpdate = {};

                // 70% chance to process a prescription this tick
                if (Math.random() > 0.3) {
                    if (r < 0.20) velocityUpdate = { lessThan1Min: prev.lessThan1Min + 1 };
                    else if (r < 0.53) velocityUpdate = { oneToThreeMin: prev.oneToThreeMin + 1 };
                    else if (r < 0.75) velocityUpdate = { threeToFiveMin: prev.threeToFiveMin + 1 };
                    else if (r < 0.88) velocityUpdate = { exceeded5Min: prev.exceeded5Min + 1 };
                    else if (r < 0.95) velocityUpdate = { exceeded7Min: prev.exceeded7Min + 1 };
                    else velocityUpdate = { exceeded10Min: prev.exceeded10Min + 1 };
                }

                return {
                    ...prev,
                    inHouseGreen: updateBucket(prev.inHouseGreen),
                    inHouseNormal: updateBucket(prev.inHouseNormal),
                    wfhGreen: updateBucket(prev.wfhGreen),
                    wfhNormal: updateBucket(prev.wfhNormal),

                    prescriptionsReceived: prev.prescriptionsReceived + (velocityUpdate.lessThan1Min || velocityUpdate.oneToThreeMin || velocityUpdate.threeToFiveMin || velocityUpdate.exceeded5Min || velocityUpdate.exceeded7Min || velocityUpdate.exceeded10Min ? 1 : 0),
                    pending: newPending,
                    // Simulate breakdown of pending
                    pendingGreen: newPendingGreen,
                    pendingRed: newPendingRed,
                    pendingNormal: newPendingNormal,

                    greenChannelCount: prev.greenChannelCount + (Math.random() > 0.8 ? 1 : 0),
                    ...velocityUpdate
                };
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);





    const [currentTime, setCurrentTime] = useState(Date.now());

    // Update current time every second for relative timestamps
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const [selectedAlert, setSelectedAlert] = useState(null);
    const [showReassign, setShowReassign] = useState(false);
    const [reassignUser, setReassignUser] = useState('');
    const [performerMode, setPerformerMode] = useState('NORMAL'); // 'NORMAL' | 'GREEN'
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (Top) | 'asc' (Least)
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [alertPage, setAlertPage] = useState(1);
    const alertItemsPerPage = 3;

    // --- Top Performers Data Generation (Last 7 Days) ---
    // We'll simulate this data once on mount, as 7-day trailing data doesn't change second-by-second like live stats
    const [leaderboardData] = useState(() => {
        // Use the global NAMES array to generate data for ALL users
        const data = NAMES.map(name => {
            // Simulate 7-day totals
            const totalRx = Math.floor(Math.random() * 300) + 1500; // 1500-1800 range
            const greenRx = Math.floor(Math.random() * 50) + 100;   // 100-150 range
            const avgProd = (Math.random() * 20 + 40).toFixed(1);   // 40-60 products/hr

            return {
                name,
                total7Days: totalRx,
                green7Days: greenRx,
                avgProdPerHour: avgProd
            };
        });

        // Current implementation expects pre-sorted arrays for different modes, 
        // but we will now sort dynamically in the render. 
        // We just return the full dataset in both keys for compatibility with existing structure if needed,
        // or just clean it up. Let's keep the structure but populated with ALL data.
        return {
            normal: data, // Unsorted initially, wil be sorted on render
            green: data
        };
    });

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
            message: "RX-9921",
            severity: 'high',
            startTime: Date.now() - (8 * 60 * 1000 + 45 * 1000), // 8m 45s ago
            assignedTo: "Alice Cooper",
            patientName: "John Smith",
            imageUrl: "https://placehold.co/600x400/e2e8f0/475569?text=Prescription+RX-9921"
        },
        {
            id: 2,
            type: 'idle',
            message: "User 'J.Doe' (Idle)",
            severity: 'high',
            startTime: Date.now() - (2 * 60 * 1000 + 15 * 1000), // 2m 15s ago
            assignedTo: "J. Doe",
            patientName: "N/A",
            imageUrl: null
        },
        {
            id: 3,
            type: 'pending',
            message: "RX-8822",
            severity: 'high',
            startTime: Date.now() - (6 * 60 * 1000 + 10 * 1000), // 6m 10s ago
            assignedTo: "Bob Martin",
            patientName: "Jane Doe",
            imageUrl: "https://placehold.co/600x400/e2e8f0/475569?text=Prescription+RX-8822"
        },
        {
            id: 4,
            type: 'pending',
            message: "RX-7743",
            severity: 'high',
            startTime: Date.now() - (12 * 60 * 1000), // 12m ago
            assignedTo: "Diana Prince",
            patientName: "Robert Ford",
            imageUrl: "https://placehold.co/600x400/e2e8f0/475569?text=Prescription+RX-7743"
        },
        {
            id: 5,
            type: 'pending',
            message: "RX-6632",
            severity: 'high',
            startTime: Date.now() - (9 * 60 * 1000 + 30 * 1000), // 9m 30s ago
            assignedTo: "Evan Wright",
            patientName: "Sarah Connor",
            imageUrl: "https://placehold.co/600x400/e2e8f0/475569?text=Prescription+RX-6632"
        },
        {
            id: 6,
            type: 'pending',
            message: "RX-5591",
            severity: 'high',
            startTime: Date.now() - (7 * 60 * 1000), // 7m ago
            assignedTo: "Frank Castle",
            patientName: "Bruce Wayne",
            imageUrl: "https://placehold.co/600x400/e2e8f0/475569?text=Prescription+RX-5591"
        }
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
        { name: "Alice Cooper", total: 145, perHour: 42, greenCount: 24, greenStatus: "Expert" },
        { name: "Bob Martin", total: 132, perHour: 38, greenCount: 15, greenStatus: "Active" },
        { name: "Charlie Day", total: 128, perHour: 36, greenCount: 8, greenStatus: "Active" },
        { name: "Diana Prince", total: 120, perHour: 35, greenCount: 32, greenStatus: "Expert" },
    ];

    // Filter alerts > 5 mins
    // Filter alerts > 5 mins and type is 'pending'
    const filteredAlerts = criticalAlerts.filter(alert => {
        const duration = Date.now() - alert.startTime;
        return duration > 5 * 60 * 1000 && alert.type === 'pending';
    });

    // Pagination for Alerts
    const totalAlertPages = Math.ceil(filteredAlerts.length / alertItemsPerPage);
    const paginatedAlerts = filteredAlerts.slice(
        (alertPage - 1) * alertItemsPerPage,
        alertPage * alertItemsPerPage
    );

    // Reset alert page if out of bounds (e.g. after dismissal)
    useEffect(() => {
        if (alertPage > totalAlertPages && totalAlertPages > 0) {
            setAlertPage(totalAlertPages);
        } else if (totalAlertPages === 0 && alertPage !== 1) {
            setAlertPage(1);
        }
    }, [totalAlertPages, alertPage]);

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
        // "Move to Queue" - Remove from alerts, add back to pending stats
        setCriticalAlerts(prev => prev.filter(alert => alert.id !== selectedAlert.id));
        setStats(prev => ({
            ...prev,
            pending: prev.pending + 1,
            // We can distribute it back to Normal/Red bucket as per logic, 
            // but for simplicity we just increment pending & pendingNormal (since it was likely old)
            pendingNormal: prev.pendingNormal + 1
        }));
        setSelectedAlert(null);
        setShowReassign(false);
        setReassignUser('');
    };

    const availableUsers = [
        "Alice Cooper", "Bob Martin", "Charlie Day", "Diana Prince", "Evan Wright", "Fiona Gallagher"
    ].filter(user => user !== selectedAlert?.assignedTo);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800" onClick={() => setIsMenuOpen(false)}>
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 text-white p-2 rounded-lg">
                        <Activity size={20} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Supervisor Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                    {/* Menu Dropdown */}
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            <Menu size={14} />
                            Reports & Actions
                            <ChevronDown size={14} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation</p>
                                </div>
                                <button
                                    onClick={() => navigate('/performance-report')}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                                >
                                    <Calendar size={16} />
                                    Decoders Performance
                                </button>
                                <button
                                    onClick={() => navigate('/prescription-report')}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                                >
                                    <FileText size={16} />
                                    Prescription Report
                                </button>
                                <button
                                    onClick={() => navigate('/new-store-prescriptions-report')}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                                >
                                    <FileText size={16} />
                                    New Store Prescriptions Report
                                </button>
                                <button
                                    onClick={() => navigate('/break-monitoring')}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                                >
                                    <Coffee size={16} />
                                    Break Monitoring
                                </button>
                                <button
                                    onClick={() => navigate('/location-report')}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                                >
                                    <MapPin size={16} />
                                    Location Wise Report
                                </button>
                                <button
                                    onClick={() => navigate('/prescription-sale-report')}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                                >
                                    <DollarSign size={16} />
                                    Prescription Sale Report
                                </button>
                                <button
                                    onClick={() => navigate('/verifications-report')}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                                >
                                    <CheckCircle size={16} />
                                    Verifications Report
                                </button>
                                <button
                                    onClick={() => navigate('/decoder-efficiency-report')}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                                >
                                    <Clock size={16} />
                                    Decoder Efficiency Report
                                </button>
                                <button
                                    onClick={() => navigate('/prescription-velocity-report')}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                                >
                                    <TrendingUp size={16} />
                                    Prescription Velocity Report
                                </button>
                                <div className="border-t border-slate-100 my-1"></div>
                                <button
                                    onClick={handleResetDemo}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Activity size={16} />
                                    Reset Demo Data
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        <LogOut size={14} />
                        Logout
                    </button>
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Live
                    </div>
                </div>
            </nav>

            <div className="p-6 max-w-7xl mx-auto space-y-6">

                {/* Toggle & Metrics Grid */}
                {/* Top Section: Operations & Pending Queue */}
                <div className="grid grid-cols-12 gap-6 mb-6">

                    {/* LEFT: Operations Panel (Filters + Staff Metrics) */}
                    <div className="col-span-12 lg:col-span-8 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex flex-col h-full justify-between">
                            {/* Top: Filters & Live Status */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <div className="flex flex-wrap gap-3">
                                    <div className="bg-slate-100 p-1 rounded-lg flex shadow-inner">
                                        <button onClick={() => setViewMode('ALL')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All Locs</button>
                                        <button onClick={() => setViewMode('IN_HOUSE')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'IN_HOUSE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>In-House</button>
                                        <button onClick={() => setViewMode('WFH')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'WFH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>WFH</button>
                                    </div>
                                    <div className="bg-slate-100 p-1 rounded-lg flex shadow-inner">
                                        <button onClick={() => setChannelMode('ALL')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${channelMode === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All Types</button>
                                        <button onClick={() => setChannelMode('GREEN')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${channelMode === 'GREEN' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Green</button>
                                        <button onClick={() => setChannelMode('NORMAL')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${channelMode === 'NORMAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Normal</button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg text-indigo-700 text-xs font-bold border border-indigo-100 animate-pulse">
                                    <div className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                    </div>
                                    Live Operations
                                </div>
                            </div>

                            {/* Bottom: Staff Metrics Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Workforce</p>
                                        <p className="text-2xl font-bold text-slate-800">{displayStats.total}</p>
                                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                                            <span className="text-emerald-600 font-bold">{displayStats.loggedIn} Online</span>
                                            <span className="text-slate-400">|</span>
                                            <button
                                                onClick={() => handleOfflineClick(displayStats.total - displayStats.loggedIn)}
                                                className="font-bold text-blue-500 underline decoration-blue-500 hover:text-red-600 hover:decoration-red-600 cursor-pointer transition-colors"
                                                title="View Offline Staff"
                                            >
                                                {displayStats.total - displayStats.loggedIn} Offline
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-white rounded-full text-slate-400 shadow-sm">
                                        <Users size={18} />
                                    </div>
                                </div>
                                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Active Workforce</p>
                                        <p className="text-2xl font-bold text-emerald-700">{displayStats.working}</p>
                                    </div>
                                    <div className="p-2 bg-white rounded-full text-emerald-500 shadow-sm">
                                        <Briefcase size={18} />
                                    </div>
                                </div>
                                <div
                                    onClick={() => navigate('/break-monitoring?mode=LIVE', { state: { onBreakCount: displayStats.onBreak } })}
                                    className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors group"
                                >
                                    <div>
                                        <p className="text-xs text-amber-600 font-bold uppercase tracking-wider group-hover:underline">On Break</p>
                                        <p className="text-2xl font-bold text-amber-700">{displayStats.onBreak}</p>
                                    </div>
                                    <div className="p-2 bg-white rounded-full text-amber-500 shadow-sm group-hover:scale-110 transition-transform">
                                        <Coffee size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Enhanced Pending Queue */}
                    <div className="col-span-12 lg:col-span-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Pending Queue</h3>
                                <p className="text-xs text-slate-400">Real-time backlog</p>
                            </div>
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-700">
                                <span className="text-3xl font-bold">{stats.pending}</span>
                            </div>
                        </div>

                        {/* Detailed Buckets with Bells */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-red-600 rounded-lg p-2 text-center text-white shadow-sm flex flex-col items-center justify-center relative group">
                                {/* Red Bucket: Fresh */}
                                <div className="flex items-center gap-1 mb-1">
                                    <Bell size={12} className="text-red-100" />
                                </div>
                                <div className="text-lg font-bold leading-none">{stats.pendingRed}</div>
                                <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap transition-opacity">
                                    Freshly Added
                                </div>
                            </div>

                            <div className="bg-emerald-600 rounded-lg p-2 text-center text-white shadow-sm flex flex-col items-center justify-center relative group">
                                {/* Green Bucket: Complex */}
                                <div className="flex items-center gap-1 mb-1">
                                    <Bell size={12} className="text-emerald-100" />
                                </div>
                                <div className="text-lg font-bold leading-none">{stats.pendingGreen}</div>
                                <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap transition-opacity">
                                    Complex/Hard
                                </div>
                            </div>

                            <div className="bg-slate-600 rounded-lg p-2 text-center text-white shadow-sm flex flex-col items-center justify-center relative group">
                                {/* Normal Bucket: >5min */}
                                <div className="flex items-center gap-1 mb-1">
                                    <Bell size={12} className="text-slate-200" />
                                </div>
                                <div className="text-lg font-bold leading-none">{stats.pendingNormal}</div>
                                <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap transition-opacity">
                                    &gt; 5 min Pending
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 flex justify-between items-center text-xs text-slate-400">
                            <span>Avg Wait: <span className="font-mono font-bold text-slate-600">45s</span></span>
                            <span>Max: <span className="font-mono font-bold text-red-500">12m</span></span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Row 1: Real-Time Efficiency & Alerts (Expanded to 8 cols) */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
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
                                {/* Calculate percentages based on the sum of these specific metrics to ensure 100% total */}
                                {(() => {
                                    const velocityTotal = stats.lessThan1Min + stats.oneToThreeMin + stats.threeToFiveMin +
                                        stats.exceeded5Min + stats.exceeded7Min + stats.exceeded10Min;
                                    const getPercent = (val) => velocityTotal > 0 ? Math.round((val / velocityTotal) * 100) : 0;

                                    return (
                                        <>
                                            <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                                                <div className="text-lg font-bold text-emerald-700">{stats.lessThan1Min} <span className="text-sm font-medium opacity-80">({getPercent(stats.lessThan1Min)}%)</span></div>
                                                <div className="text-[10px] text-emerald-600 font-medium">&lt; 1 min</div>
                                            </div>
                                            <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                                                <div className="text-lg font-bold text-emerald-700">{stats.oneToThreeMin} <span className="text-sm font-medium opacity-80">({getPercent(stats.oneToThreeMin)}%)</span></div>
                                                <div className="text-[10px] text-emerald-600 font-medium">1-3 min</div>
                                            </div>
                                            <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                                <div className="text-lg font-bold text-blue-700">{stats.threeToFiveMin} <span className="text-sm font-medium opacity-80">({getPercent(stats.threeToFiveMin)}%)</span></div>
                                                <div className="text-[10px] text-blue-600 font-medium">3-5 min</div>
                                            </div>
                                            <div className="bg-amber-50 p-2 rounded border border-amber-100">
                                                <div className="text-lg font-bold text-amber-700">{stats.exceeded5Min} <span className="text-sm font-medium opacity-80">({getPercent(stats.exceeded5Min)}%)</span></div>
                                                <div className="text-[10px] text-amber-600 font-bold">5+ min</div>
                                            </div>
                                            <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                                <div className="text-lg font-bold text-orange-700">{stats.exceeded7Min} <span className="text-sm font-medium opacity-80">({getPercent(stats.exceeded7Min)}%)</span></div>
                                                <div className="text-[10px] text-orange-600 font-bold">7+ min</div>
                                            </div>
                                            <div className="bg-red-50 p-2 rounded border border-red-100 animate-pulse">
                                                <div className="text-lg font-bold text-red-700">{stats.exceeded10Min} <span className="text-sm font-medium opacity-80">({getPercent(stats.exceeded10Min)}%)</span></div>
                                                <div className="text-[10px] text-red-600 font-bold">10+ min</div>
                                            </div>
                                        </>
                                    );
                                })()}
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
                            <div className="divide-y divide-red-50 min-h-[220px]">
                                {paginatedAlerts.length === 0 ? (
                                    <div className="p-4 text-center text-slate-500 text-sm flex flex-col items-center justify-center h-full">
                                        <CheckCircle size={24} className="text-emerald-400 mb-2" />
                                        No critical alerts pending for more than 5 minutes.
                                    </div>
                                ) : (
                                    paginatedAlerts.map((alert) => (
                                        <div key={alert.id} className="p-3 flex items-start gap-3 hover:bg-red-50/50 transition-colors animate-in fade-in duration-300">
                                            <AlertTriangle size={18} className={alert.type === 'idle' ? 'text-amber-500' : 'text-red-600'} />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-800">{alert.message}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedAlert(alert);
                                                        }}
                                                        className="text-xs text-blue-600 hover:underline font-bold"
                                                    >
                                                        Investigate
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDismiss(alert.id, e)}
                                                        className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono font-bold text-red-600 whitespace-nowrap">
                                                {formatDuration(alert.startTime)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                            {/* Pagination Footer */}
                            {totalAlertPages > 1 && (
                                <div className="bg-red-50/50 px-4 py-2 border-t border-red-50 flex items-center justify-between text-xs">
                                    <div className="flex gap-1 items-center">
                                        <button
                                            onClick={() => setAlertPage(p => Math.max(1, p - 1))}
                                            disabled={alertPage === 1}
                                            className="px-2 py-1 bg-white border border-red-100 rounded hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-white text-slate-600"
                                        >
                                            Prev
                                        </button>

                                        {/* Page Numbers */}
                                        <div className="flex gap-1 mx-2">
                                            {Array.from({ length: totalAlertPages }, (_, i) => i + 1).map(pageNum => (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setAlertPage(pageNum)}
                                                    className={`w-6 h-6 flex items-center justify-center rounded border transition-colors ${alertPage === pageNum
                                                        ? 'bg-red-600 text-white border-red-600 font-bold'
                                                        : 'bg-white text-slate-600 border-red-100 hover:bg-red-50'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => setAlertPage(p => Math.min(totalAlertPages, p + 1))}
                                            disabled={alertPage === totalAlertPages}
                                            className="px-2 py-1 bg-white border border-red-100 rounded hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-white text-slate-600"
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <span className="text-slate-400">
                                        Total {filteredAlerts.length}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 1: Leaderboard & Metrics (Expanded to 4 cols) */}
                    <div className="col-span-12 lg:col-span-4 space-y-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Activity size={14} /> Decoders Performance
                                </h2>
                                {/* Toggle for Normal/Green */}
                                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                    <button
                                        onClick={() => {
                                            setPerformerMode('NORMAL');
                                            setCurrentPage(1); // Reset page on mode switch
                                        }}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${performerMode === 'NORMAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Normal
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPerformerMode('GREEN');
                                            setCurrentPage(1); // Reset page on mode switch
                                        }}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${performerMode === 'GREEN' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Green
                                    </button>
                                </div>
                            </div>

                            {/* Sorting Controls */}
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-[10px] text-slate-400 italic">
                                    *Data based on last 7 days (until yesterday)
                                </p>
                                <button
                                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                    className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 bg-slate-50 px-2 py-1 rounded border border-slate-200"
                                >
                                    Sort: {sortOrder === 'desc' ? 'Top Performers' : 'Least Performers'}
                                    <ChevronDown size={12} className={`transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            <div className="space-y-3 min-h-[300px]">
                                {(() => {
                                    // 1. Get correct dataset
                                    const data = performerMode === 'NORMAL' ? leaderboardData.normal : leaderboardData.green;

                                    // 2. Sort
                                    const sortedData = [...data].sort((a, b) => {
                                        const valA = a.total7Days;
                                        const valB = b.total7Days;
                                        return sortOrder === 'desc' ? valB - valA : valA - valB;
                                    });

                                    // 3. Paginate
                                    const indexOfLastItem = currentPage * itemsPerPage;
                                    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                                    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
                                    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

                                    return (
                                        <>
                                            {currentItems.map((user, idx) => {
                                                // Calculate overall rank based on sort
                                                const rank = sortOrder === 'desc'
                                                    ? indexOfFirstItem + idx + 1
                                                    : sortedData.length - (indexOfFirstItem + idx);

                                                return (
                                                    <div key={user.name} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded transition-colors group">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${rank <= 3 ? 'bg-amber-400' : 'bg-slate-300'}`}>
                                                                {rank}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-slate-800">{user.name}</div>
                                                                {performerMode === 'NORMAL' && (
                                                                    <div className="text-[10px] text-slate-500">
                                                                        Avg: <span className="font-bold text-indigo-600">{user.avgProdPerHour}</span> prod/hr
                                                                    </div>
                                                                )}
                                                                {performerMode === 'GREEN' && (
                                                                    <div className="text-[10px] text-slate-500">
                                                                        Green Recs: <span className="font-bold text-emerald-600">{user.green7Days}</span> <span className="mx-1">|</span> Avg: <span className="font-bold text-indigo-600">{user.avgProdPerHour}</span>/hr
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {performerMode === 'NORMAL' ? (
                                                                <>
                                                                    <div className="text-sm font-bold text-slate-700">{user.total7Days}</div>
                                                                    <div className="text-[10px] text-slate-400">Total Rx (7d)</div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="text-sm font-bold text-slate-700">{user.total7Days}</div>
                                                                    <div className="text-[10px] text-slate-400">Total Rx (7d)</div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Pagination Controls */}
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500"
                                                >
                                                    Previous
                                                </button>

                                                <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] scrollbar-hide py-1">
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setCurrentPage(pageNum)}
                                                            className={`min-w-[24px] h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all ${currentPage === pageNum
                                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200 hover:border-indigo-200'
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
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
                                                    {selectedAlert.assignedTo ? selectedAlert.assignedTo.charAt(0) : '?'}
                                                </div>
                                                <span className="text-sm text-slate-700">{selectedAlert.assignedTo || 'Unassigned'}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Received At</h3>
                                            <span className="text-sm text-slate-700 font-mono">
                                                {new Date(selectedAlert.startTime).toLocaleString()}
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
                                                <span className="font-mono">{new Date(selectedAlert.startTime - 60000).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>Assigned to {selectedAlert.assignedTo}</span>
                                                <span className="font-mono">{new Date(selectedAlert.startTime).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-red-600 font-bold">
                                                <span>Crit. Time Exceeded</span>
                                                <span className="font-mono">{new Date(selectedAlert.startTime + 5 * 60000).toLocaleString()}</span>
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
                            <button
                                onClick={() => setSelectedAlert(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleReassign}
                                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                            >
                                Move to Queue
                            </button>
                            <button
                                onClick={() => handleForceComplete(selectedAlert.id)}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                            >
                                Force Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Offline Users Modal */}
            {offlineModalState.isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOfflineModalState(prev => ({ ...prev, isOpen: false }))}>
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Users size={18} className="text-slate-500" />
                                Offline Staff ({offlineModalState.users.length})
                            </h3>
                            <button onClick={() => setOfflineModalState(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
                            {offlineModalState.users.map((user, index) => (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-indigo-100 hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100/50 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-700 text-sm">{user.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">ID: {user.empId}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                        <Phone size={12} />
                                        {user.phone}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-3 bg-slate-50 text-right">
                            <button
                                onClick={() => setOfflineModalState(prev => ({ ...prev, isOpen: false }))}
                                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupervisorDashboard;
