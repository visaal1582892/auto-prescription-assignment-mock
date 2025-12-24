import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { utils, writeFile } from 'xlsx';
import { DayPicker } from 'react-day-picker';
import { format, subDays, startOfMonth, startOfDay, isSameDay, isWithinInterval, addDays, differenceInMinutes, parseISO } from 'date-fns';
import {
    ArrowLeft,
    Coffee,
    Download,
    Search,
    Calendar,
    ChevronDown,
    X,
    Filter
} from 'lucide-react';
import 'react-day-picker/style.css';

const BreakMonitoring = () => {
    const navigate = useNavigate();

    // Mock Data Generation
    const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const EMPLOYEES = [
        { id: "EMP-1001", name: "Tallapalli Sampath" },
        { id: "EMP-1002", name: "Kasapuram Anuradha" },
        { id: "EMP-1003", name: "Gillalla Vanitha Reddy" },
        { id: "EMP-1004", name: "Kolla Santosh Kumar" },
        { id: "EMP-1005", name: "Sudip Chatterjee" },
        { id: "EMP-1006", name: "Ramesh Pawar" },
        { id: "EMP-1007", name: "Sita Mahalakshmi" },
        { id: "EMP-1008", name: "Venkata Rao" }
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

        // If before 9 AM, no work done
        if (now < startOfWork) {
            return EMPLOYEES.map(emp => ({
                empId: emp.id,
                hoursWorked: 0,
                dailyBreakCount: 0,
                dailyBreakDuration: 0,
                isOnBreak: false
            }));
        }

        const minutesPassed = differenceInMinutes(now, startOfWork);

        return EMPLOYEES.map(emp => {
            // Randomly active or late
            const hasStarted = Math.random() > 0.05;
            if (!hasStarted) {
                return { empId: emp.id, hoursWorked: 0, dailyBreakCount: 0, dailyBreakDuration: 0, isOnBreak: false };
            }

            // Simulate break time (approx 10-15% of time)
            const breakTimeMinutes = Math.floor(minutesPassed * (0.1 + Math.random() * 0.05));
            const workTimeMinutes = minutesPassed - breakTimeMinutes;

            // Breaks count (approx 1 per 2-3 hours)
            const breakCount = Math.max(0, Math.floor(breakTimeMinutes / 15) + (Math.random() > 0.5 ? 1 : 0));

            return {
                empId: emp.id,
                hoursWorked: workTimeMinutes / 60,
                dailyBreakCount: breakCount,
                dailyBreakDuration: breakTimeMinutes,
                isOnBreak: Math.random() > 0.8 // 20% likely to be on break right now
            };
        });
    };

    const [todaysData, setTodaysData] = useState(generateInitialTodayData);

    // Real-time Simulation Effect
    useEffect(() => {
        const interval = setInterval(() => {
            // Check if Today is part of the selected range (strictly visualization update)
            // But we update state regardless so it's ready

            setTodaysData(prev => prev.map(emp => {
                let newHours = emp.hoursWorked;
                let newBreakDuration = emp.dailyBreakDuration;
                let newBreakCount = emp.dailyBreakCount;
                let newIsOnBreak = emp.isOnBreak;

                if (emp.isOnBreak) {
                    // On break
                    newBreakDuration += (1 / 60); // +1 second
                    if (Math.random() > 0.98) newIsOnBreak = false; // chance to return
                } else {
                    // Working
                    newHours += (1 / 3600); // +1 second
                    if (Math.random() > 0.995) { // chance to take break
                        newIsOnBreak = true;
                        newBreakCount += 1;
                    }
                }

                return {
                    ...emp,
                    hoursWorked: newHours,
                    dailyBreakCount: newBreakCount,
                    dailyBreakDuration: newBreakDuration,
                    isOnBreak: newIsOnBreak
                };
            }));

        }, 1000);
        return () => clearInterval(interval);
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

            const isTodayInRange = isWithinInterval(new Date(), { start: from, end: addDays(to, 1) }); // approximate check

            // 1. Historical Sum
            let iter = new Date(from);
            while (iter <= to) {
                if (isSameDay(iter, new Date())) {
                    // Add Last Today's Data
                    const todayRec = todaysData.find(t => t.empId === emp.id);
                    if (todayRec) {
                        totalHours += todayRec.hoursWorked;
                        totalBreaks += todayRec.dailyBreakCount;
                        totalDuration += todayRec.dailyBreakDuration;
                    }
                } else {
                    const dStr = format(iter, 'yyyy-MM-dd');
                    const dayRecords = historicalData[dStr];
                    if (dayRecords) {
                        const rec = dayRecords.find(r => r.empId === emp.id);
                        if (rec) {
                            totalHours += rec.hoursWorked;
                            totalBreaks += rec.dailyBreakCount;
                            totalDuration += rec.dailyBreakDuration;
                        }
                    }
                }
                iter.setDate(iter.getDate() + 1);
            }

            return {
                empId: emp.id,
                empName: emp.name,
                hoursWorked: totalHours,
                dailyBreakCount: totalBreaks,
                dailyBreakDuration: totalDuration
            };
        }).filter(item =>
            item.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.empId.toLowerCase().includes(searchTerm.toLowerCase())
        );

    }, [dateRange, todaysData, historicalData, searchTerm]);

    // Helpers
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

    const handleExport = () => {
        const exportData = reportData.map(row => ({
            "Emp ID": row.empId,
            "Emp Name": row.empName,
            "Hours Worked": formatDurationHours(row.hoursWorked),
            "No. of Breaks": row.dailyBreakCount,
            "Break Duration": formatDurationMin(row.dailyBreakDuration),
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Break_Performance_Report");
        writeFile(wb, "Break_Performance_Report.xlsx");
    }

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(reportData.length / itemsPerPage);
    const paginatedData = reportData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, dateRange]);


    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/supervisor')}
                            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Coffee className="text-amber-600" size={24} />
                                Break Monitoring
                            </h1>
                            <p className="text-xs text-slate-500">
                                This report is Generate to support live tracking of employee performance in Excel Format
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date Calendar Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                            >
                                <Calendar size={16} className="text-slate-500" />
                                <span>
                                    {dateRange?.from ? (
                                        <>
                                            {format(dateRange.from, 'MMM dd')}
                                            {dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime() ? ` - ${format(dateRange.to, 'MMM dd')}` : ''}
                                        </>
                                    ) : 'Select Dates'}
                                </span>
                                <ChevronDown size={14} className="text-slate-400" />
                            </button>

                            {isCalendarOpen && (
                                <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-slate-100 p-2 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="flex justify-end p-2 border-b border-slate-100 mb-2">
                                        <button onClick={() => setIsCalendarOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                                    </div>
                                    <DayPicker
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={(range) => {
                                            if (range?.from) {
                                                setDateRange(range);
                                            }
                                        }}
                                        disabled={{ after: new Date() }}
                                        pagedNavigation
                                        showOutsideDays
                                        classNames={{
                                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                            month: "space-y-3",
                                            caption: "flex justify-between pt-1 relative items-center px-2",
                                            caption_label: "text-xs font-bold text-slate-700",
                                            nav: "flex items-center space-x-1",
                                            nav_button: "h-6 w-6 bg-transparent hover:bg-slate-100 p-0 rounded-md transition-colors flex items-center justify-center text-slate-500 hover:text-indigo-600",
                                            nav_button_previous: "absolute left-0",
                                            nav_button_next: "absolute right-0",
                                            table: "w-full border-collapse space-y-1",
                                            head_row: "flex",
                                            head_cell: "text-slate-400 rounded-md w-7 font-normal text-[0.65rem] uppercase",
                                            row: "flex w-full mt-1",
                                            cell: "text-slate-600 rounded-md h-7 w-7 text-[0.7rem] relative [&:has([aria-selected])]:bg-indigo-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 p-0",
                                            day: "h-7 w-7 p-0 font-medium aria-selected:opacity-100 hover:bg-indigo-50 focus:bg-indigo-50 rounded-md transition-all",
                                            day_selected: "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white rounded-md",
                                            day_today: "bg-slate-100 text-slate-900 font-bold",
                                            day_outside: "text-slate-300 opacity-50",
                                            day_disabled: "text-slate-300 opacity-30",
                                            day_range_middle: "!bg-indigo-50 !text-indigo-600 !rounded-none",
                                            day_range_start: "!bg-indigo-600 !text-white !rounded-l-md !rounded-r-none",
                                            day_range_end: "!bg-indigo-600 !text-white !rounded-r-md !rounded-l-none",
                                            day_hidden: "invisible",
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[200px]">
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
                                    <th className="px-6 py-4">Emp Name</th>
                                    <th className="px-6 py-4 text-center">Hours Worked</th>
                                    <th className="px-6 py-4 text-center">No. of Breaks</th>
                                    <th className="px-6 py-4 text-center">Break Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row) => (
                                        <tr key={row.empId} className="bg-white hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-600">{row.empId}</td>
                                            <td className="px-6 py-4 font-medium text-slate-800">{row.empName}</td>
                                            <td className="px-6 py-4 text-center">{formatDurationHours(row.hoursWorked)}</td>
                                            <td className="px-6 py-4 text-center">{row.dailyBreakCount}</td>
                                            <td className="px-6 py-4 text-center">{formatDurationMin(row.dailyBreakDuration)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                            No records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                        <span>Showing {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, reportData.length)} of {reportData.length} records</span>
                        <div className="flex gap-2 items-center">
                            <span className="mr-2 text-slate-400">Page {currentPage} of {totalPages}</span>
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
