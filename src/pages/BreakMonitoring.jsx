import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { utils, writeFile } from 'xlsx';
import { DayPicker } from 'react-day-picker';
import { format, subDays, startOfMonth, startOfDay, isSameDay, isWithinInterval, addDays, differenceInMinutes, parseISO, differenceInSeconds } from 'date-fns';
import {
    ArrowLeft,
    Coffee,
    Download,
    Search,
    Calendar,
    ChevronDown,
    X,
    Filter,
    Phone,
    Clock,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import 'react-day-picker/style.css';

const BREAK_TYPES = {
    NORMAL: { id: 'NORMAL', label: 'Normal Break', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 icon-emerald-500' },
    WITHOUT_INTIMATION: { id: 'WITHOUT_INTIMATION', label: 'Without Intimation', color: 'bg-red-50 text-red-700 border-red-200 icon-red-500' },
    CALL: { id: 'CALL', label: 'Call Break', color: 'bg-blue-50 text-blue-700 border-blue-200 icon-blue-500' },
    VERIFY: { id: 'VERIFY', label: 'Verify Break', color: 'bg-amber-50 text-amber-700 border-amber-200 icon-amber-500' }
};

const BreakMonitoring = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [activeTab, setActiveTab] = useState('HISTORICAL'); // 'HISTORICAL' | 'LIVE'
    const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Column Filters for Live Mode
    const [searchName, setSearchName] = useState('');
    const [searchPhone, setSearchPhone] = useState('');
    const [searchBreakType, setSearchBreakType] = useState('ALL');

    // Handle Query Params
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('mode') === 'LIVE') {
            setActiveTab('LIVE');
        }
    }, [location]);

    const EMPLOYEES = [
        { id: "EMP-1001", name: "Tallapalli Sampath", phone: "9876543210" },
        { id: "EMP-1002", name: "Kasapuram Anuradha", phone: "9876543211" },
        { id: "EMP-1003", name: "Gillalla Vanitha Reddy", phone: "9876543212" },
        { id: "EMP-1004", name: "Kolla Santosh Kumar", phone: "9876543213" },
        { id: "EMP-1005", name: "Sudip Chatterjee", phone: "9876543214" },
        { id: "EMP-1006", name: "Ramesh Pawar", phone: "9876543215" },
        { id: "EMP-1007", name: "Sita Mahalakshmi", phone: "9876543216" },
        { id: "EMP-1008", name: "Venkata Rao", phone: "9876543217" }
    ];

    // Generate static historical data for past 30 days
    const generateHistoricalData = () => {
        const data = {};
        const today = new Date();
        // Generate for last 30 days
        for (let i = 1; i <= 30; i++) {
            const d = subDays(today, i);
            const dateStr = format(d, 'yyyy-MM-dd');
            data[dateStr] = EMPLOYEES.map(emp => ({
                empId: emp.id,
                // Random realistic past data
                hoursWorked: Math.random() * 3 + 5, // 5-8 hours
                dailyBreakCount: Math.floor(Math.random() * 3) + 2, // 2-4 breaks
                dailyBreakDuration: Math.floor(Math.random() * 30) + 30 // 30-60 mins
            }));
        }
        return data;
    };

    const [historicalData] = useState(generateHistoricalData());

    // Generate realistic initial values for Today (assuming shift starts 9 AM)
    const generateInitialTodayData = () => {
        const now = new Date();
        const startOfWork = new Date();
        startOfWork.setHours(9, 0, 0, 0); // 9:00 AM

        // Check if we have a specific target count from dashboard navigation
        const targetOnBreakCount = location.state?.onBreakCount;

        // If before 9 AM, no work done
        if (now < startOfWork) {
            return EMPLOYEES.map(emp => ({
                empId: emp.id,
                hoursWorked: 0,
                dailyBreakCount: 0,
                dailyBreakDuration: 0,
                isOnBreak: false,
                breakType: null,
                breakStartTime: null
            }));
        }

        const minutesPassed = differenceInMinutes(now, startOfWork);

        // If target count is provided, select exactly that many random employees
        let preselectedBreakIndices = new Set();
        if (targetOnBreakCount !== undefined) {
            const indices = Array.from({ length: EMPLOYEES.length }, (_, i) => i);
            // Shuffle
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            // Take first N
            preselectedBreakIndices = new Set(indices.slice(0, targetOnBreakCount));
        }

        return EMPLOYEES.map((emp, index) => {
            // Randomly active or late
            const hasStarted = Math.random() > 0.05;
            if (!hasStarted) {
                return { empId: emp.id, hoursWorked: 0, dailyBreakCount: 0, dailyBreakDuration: 0, isOnBreak: false, breakType: null, breakStartTime: null };
            }

            // Simulate break time (approx 10-15% of time)
            const breakTimeMinutes = Math.floor(minutesPassed * (0.1 + Math.random() * 0.05));
            const workTimeMinutes = minutesPassed - breakTimeMinutes;

            // Breaks count (approx 1 per 2-3 hours)
            const breakCount = Math.max(0, Math.floor(breakTimeMinutes / 15) + (Math.random() > 0.5 ? 1 : 0));

            // Determine if on break: use preselected if available, else random
            let isOnBreak = false;
            if (targetOnBreakCount !== undefined) {
                isOnBreak = preselectedBreakIndices.has(index);
            } else {
                isOnBreak = Math.random() > 0.75;
            }

            let breakType = null;
            let breakStartTime = null;

            if (isOnBreak) {
                const types = Object.keys(BREAK_TYPES);
                breakType = types[Math.floor(Math.random() * types.length)];
                // Break started 1-15 mins ago
                breakStartTime = new Date(now.getTime() - Math.floor(Math.random() * 15 * 60000));
            }

            return {
                empId: emp.id,
                hoursWorked: workTimeMinutes / 60,
                dailyBreakCount: breakCount,
                dailyBreakDuration: breakTimeMinutes,
                isOnBreak: isOnBreak,
                breakType: breakType,
                breakStartTime: breakStartTime
            };
        });
    };

    const [todaysData, setTodaysData] = useState(generateInitialTodayData);

    // Real-time Simulation Effect
    useEffect(() => {
        const interval = setInterval(() => {
            setTodaysData(prev => prev.map(emp => {
                let newHours = emp.hoursWorked;
                let newBreakDuration = emp.dailyBreakDuration;
                let newBreakCount = emp.dailyBreakCount;
                let newIsOnBreak = emp.isOnBreak;
                let newBreakType = emp.breakType;
                let newBreakStartTime = emp.breakStartTime;

                if (emp.isOnBreak) {
                    // On break
                    newBreakDuration += (1 / 60); // +1 second

                    // Small chance to return from break
                    if (Math.random() > 0.99) {
                        newIsOnBreak = false;
                        newBreakType = null;
                        newBreakStartTime = null;
                    }
                } else {
                    // Working
                    newHours += (1 / 3600); // +1 second

                    // Small chance to take a break
                    if (Math.random() > 0.995) {
                        newIsOnBreak = true;
                        newBreakCount += 1;
                        const types = Object.keys(BREAK_TYPES);
                        newBreakType = types[Math.floor(Math.random() * types.length)];
                        newBreakStartTime = new Date();
                    }
                }

                return {
                    ...emp,
                    hoursWorked: newHours,
                    dailyBreakCount: newBreakCount,
                    dailyBreakDuration: newBreakDuration,
                    isOnBreak: newIsOnBreak,
                    breakType: newBreakType,
                    breakStartTime: newBreakStartTime
                };
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Live Timer for Display
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const reportData = useMemo(() => {
        if (!dateRange?.from) return [];

        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? startOfDay(dateRange.to) : from;

        // Iterate through each employee and aggregate stats for the range
        return EMPLOYEES.map(emp => {
            let totalHours = 0;
            let totalBreaks = 0;
            let totalDuration = 0;
            let isOnBreakToday = false;

            // Check if "Today" is in range
            const today = startOfDay(new Date());
            const isTodayInRange = isWithinInterval(today, { start: from, end: to });

            if (isTodayInRange) {
                // Find today's data for this emp
                const todayEmp = todaysData.find(e => e.empId === emp.id);
                if (todayEmp) {
                    totalHours += todayEmp.hoursWorked;
                    totalBreaks += todayEmp.dailyBreakCount;
                    totalDuration += todayEmp.dailyBreakDuration;
                    isOnBreakToday = todayEmp.isOnBreak;
                }
            }

            // Iterate past days
            let iter = from;
            while (iter <= to) {
                if (isSameDay(iter, today)) {
                    iter = addDays(iter, 1);
                    continue; // Handled above
                }
                const dateStr = format(iter, 'yyyy-MM-dd');
                const pastDayData = historicalData[dateStr];
                if (pastDayData) {
                    const pastEmp = pastDayData.find(e => e.empId === emp.id);
                    if (pastEmp) {
                        totalHours += pastEmp.hoursWorked;
                        totalBreaks += pastEmp.dailyBreakCount;
                        totalDuration += pastEmp.dailyBreakDuration;
                    }
                }
                iter = addDays(iter, 1);
            }

            return {
                empId: emp.id,
                empName: emp.name,
                phone: emp.phone,
                hoursWorked: totalHours,
                dailyBreakCount: totalBreaks,
                dailyBreakDuration: totalDuration,
                isOnBreak: isOnBreakToday // Only meaningful if Today is included
            };
        }).filter(item => {
            return item.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.empName.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [dateRange, todaysData, historicalData, searchTerm]);

    // Live Data Filtered
    const liveMonitorData = useMemo(() => {
        return todaysData.map(d => {
            const emp = EMPLOYEES.find(e => e.id === d.empId);
            return { ...d, empName: emp.name, phone: emp.phone }; // Explicitly map empName
        }).filter(item => {
            // ID Search (Global)
            const matchesId = item.empId.toLowerCase().includes(searchTerm.toLowerCase());

            // Column Filters
            const matchesName = item.empName.toLowerCase().includes(searchName.toLowerCase());
            const matchesPhone = item.phone.includes(searchPhone);
            const matchesType = searchBreakType === 'ALL' || (item.isOnBreak && item.breakType === searchBreakType);

            return matchesId && matchesName && matchesPhone && matchesType;
        }).sort((a, b) => (b.isOnBreak ? 1 : 0) - (a.isOnBreak ? 1 : 0));
    }, [todaysData, searchTerm, searchName, searchPhone, searchBreakType]);

    // Format helpers
    const formatDurationHours = (val) => {
        const h = Math.floor(val);
        const m = Math.floor((val - h) * 60);
        if (m === 0 && h === 0) return "0hrs";
        if (m === 0) return `${h}hrs`;
        return `${h}:${m.toString().padStart(2, '0')}hrs`;
    }

    const formatDurationMin = (mins) => {
        const h = Math.floor(mins / 60);
        const m = Math.floor(mins % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}Min`;
    }

    const formatLiveDuration = (startTime) => {
        if (!startTime) return "-";
        const diff = differenceInSeconds(now, startTime);
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        return `${m}m ${s}s`;
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Adjusted to show ONLY people on break if that's the main intent, or provide a filter. 
    // Let's show ONLY ON BREAK rows for valid "Live Monitor" feel as per "show all the people on break"

    const finalDisplayData = activeTab === 'LIVE'
        ? liveMonitorData.filter(d => d.isOnBreak)
        : reportData;

    const paginatedData = finalDisplayData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(finalDisplayData.length / itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, dateRange, activeTab, searchName, searchPhone, searchBreakType]);

    const handleExport = () => {
        const ws = utils.json_to_sheet(reportData.map(r => ({
            "Emp ID": r.empId,
            "Emp Name": r.empName,
            "Hours Worked": formatDurationHours(r.hoursWorked),
            "No. of Breaks": r.dailyBreakCount,
            "Break Duration": formatDurationMin(r.dailyBreakDuration),
        })));

        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Break_Performance_Report");
        writeFile(wb, "Break_Performance_Report.xlsx");
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/supervisor')}
                                className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <Coffee className="text-indigo-600" size={24} />
                                Break Monitoring
                            </h1>
                        </div>

                        {/* Tabs acting as Mode Switcher */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('HISTORICAL')}
                                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'HISTORICAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Historical Report
                            </button>
                            <button
                                onClick={() => setActiveTab('LIVE')}
                                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'LIVE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <span className={`flex h-2 w-2 relative`}>
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                                Live Monitor
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            {activeTab === 'HISTORICAL' && (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 font-medium hover:bg-slate-50 hover:border-indigo-300 transition-all focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <Calendar size={16} className="text-slate-500" />
                                        {dateRange?.from ? (
                                            <>
                                                {format(dateRange.from, 'MMM dd')}
                                                {dateRange.to && ` - ${format(dateRange.to, 'MMM dd')}`}
                                            </>
                                        ) : 'Select Dates'}
                                    </button>
                                    {isCalendarOpen && (
                                        <div className="absolute top-full right-0 mt-2 p-3 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                                            <DayPicker
                                                mode="range"
                                                selected={dateRange}
                                                onSelect={(range) => {
                                                    if (range?.from) setDateRange(range);
                                                }}
                                                styles={{
                                                    head_cell: { width: '40px' },
                                                    cell: { width: '40px' },
                                                    day: { width: '40px' }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
                            >
                                <Download size={16} />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">

                {/* Live Mode Filters: Now integrated into columns */}

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-sm text-center text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-left min-w-[200px]">
                                        <div className="flex flex-col gap-2">
                                            <span>Emp ID</span>
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search ID..."
                                                    className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal normal-case"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </th>

                                    {activeTab === 'LIVE' ? (
                                        <>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-left min-w-[200px]">
                                                <div className="flex flex-col gap-2">
                                                    <span>Emp Name</span>
                                                    <div className="relative">
                                                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search Name..."
                                                            className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal normal-case"
                                                            value={searchName}
                                                            onChange={(e) => setSearchName(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-left min-w-[150px]">
                                                <div className="flex flex-col gap-2">
                                                    <span>Phone Number</span>
                                                    <div className="relative">
                                                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search Phone..."
                                                            className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal normal-case"
                                                            value={searchPhone}
                                                            onChange={(e) => setSearchPhone(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-left min-w-[150px]">
                                                <div className="flex flex-col gap-2">
                                                    <span>Break Type</span>
                                                    <select
                                                        className="w-full p-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal normal-case"
                                                        value={searchBreakType}
                                                        onChange={(e) => setSearchBreakType(e.target.value)}
                                                    >
                                                        <option value="ALL">All Active</option>
                                                        {Object.values(BREAK_TYPES).map(type => (
                                                            <option key={type.id} value={type.id}>{type.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 font-bold text-indigo-900">Live Duration</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-4 text-left">Emp Name</th>
                                            <th className="px-6 py-4">Hours Worked</th>
                                            <th className="px-6 py-4">No. of Breaks</th>
                                            <th className="px-6 py-4">Break Duration</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row) => (
                                        <tr key={row.empId} className="bg-white hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-600 text-left">{row.empId}</td>
                                            <td className="px-6 py-4 font-medium text-slate-800 text-left">{row.empName}</td>

                                            {activeTab === 'LIVE' && (
                                                <td className="px-6 py-4 text-left">
                                                    <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
                                                        <Phone size={12} />
                                                        {row.phone}
                                                    </div>
                                                </td>
                                            )}

                                            {activeTab === 'LIVE' ? (
                                                <>
                                                    <td className="px-6 py-4 text-left">
                                                        {row.breakType && BREAK_TYPES[row.breakType] ? (
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${BREAK_TYPES[row.breakType].color}`}>
                                                                {BREAK_TYPES[row.breakType].label}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2 text-indigo-600 font-mono font-bold bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                                            <Clock size={14} className="animate-pulse" />
                                                            {formatLiveDuration(row.breakStartTime)}
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4">{formatDurationHours(row.hoursWorked)}</td>
                                                    <td className="px-6 py-4">{row.dailyBreakCount}</td>
                                                    <td className="px-6 py-4">{formatDurationMin(row.dailyBreakDuration)}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={activeTab === 'LIVE' ? 5 : 5} className="px-6 py-12 text-center text-slate-400">
                                            {activeTab === 'LIVE' ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <CheckCircle2 size={32} className="text-emerald-400" />
                                                    <p>All clear! No employees currently on break.</p>
                                                </div>
                                            ) : (
                                                "No records found."
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                        <span>Showing {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, finalDisplayData.length)} of {finalDisplayData.length} records</span>
                        <div className="flex gap-2 items-center">
                            <span className="mr-2 text-slate-400">Page {currentPage} of {totalPages || 1}</span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 border border-slate-300 rounded bg-white hover:bg-slate-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 border border-slate-300 rounded bg-white hover:bg-slate-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BreakMonitoring;
