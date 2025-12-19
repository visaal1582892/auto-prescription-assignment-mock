import React, { useState, useMemo, useEffect } from 'react';
import {
    Calendar,
    Filter,
    Download,
    ArrowLeft,
    Search,
    ChevronDown,
    Check,
    X,
    Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { utils, writeFile } from 'xlsx';
import { DayPicker } from 'react-day-picker';
import { format, subDays, isAfter, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import 'react-day-picker/style.css';

const PerformanceReport = () => {
    const navigate = useNavigate();

    const EMPLOYEES = ["Alice Cooper", "Bob Martin", "Charlie Day", "Diana Prince", "Evan Wright", "Frank Castle", "Grace Ho", "Henry Wu"];

    // --- Mock Data Generation (Daily for 2025) ---
    // --- Mock Data Generation (Daily for past 30 days) ---
    const generateData = () => {
        const data = [];
        const today = new Date();

        // Generate for past 30 days
        for (let i = 0; i < 30; i++) {
            const date = subDays(today, i);
            const dateStr = format(date, 'yyyy-MM-dd');

            EMPLOYEES.forEach((name, idx) => {
                // Randomly skip some employees on some days (simulating weekends/leave)
                if (i > 0 && Math.random() > 0.8) return;

                data.push({
                    id: `${dateStr}-${idx}`, // Unique ID based on date and employee
                    name,
                    date: dateStr,
                    hours: Math.floor(Math.random() * 6) + 2,
                    rxDecoded: Math.floor(Math.random() * 50) + 10,
                    productsDecoded: Math.floor(Math.random() * 100) + 20,
                    greenCount: Math.floor(Math.random() * 10),
                    breakHours: parseFloat((Math.random() * 1).toFixed(2)),
                    awayHours: i === 0 ? 0 : parseFloat((Math.random() * 0.5).toFixed(2)), // Some away hours in past
                    breakCount: Math.floor(Math.random() * 3),
                    submitAndCall: Math.floor(Math.random() * 10),
                    greenSentCount: Math.floor(Math.random() * 8)
                });
            });
        }
        return data;
    };

    const [allData, setAllData] = useState(generateData());

    // --- Filter State ---
    // Default to Today
    const [dateRange, setDateRange] = useState({
        from: new Date(),
        to: new Date()
    });
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [filters, setFilters] = useState({ name: "" });

    // --- Real-time Simulation for Today ---
    useEffect(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        const interval = setInterval(() => {
            setAllData(prevData => {
                return prevData.map(row => {
                    if (row.date === todayStr) {
                        // Simulate work happening
                        const newHours = row.hours + (1 / 3600);

                        // Metrics update RARELY
                        const newRx = row.rxDecoded + (Math.random() > 0.998 ? 1 : 0);
                        const newProducts = row.productsDecoded + (Math.random() > 0.998 ? 1 : 0);

                        const newBreak = Math.min(row.breakHours + (Math.random() > 0.999 ? 0.01 : 0), 2);
                        const newAway = Math.min(row.awayHours + (Math.random() > 0.999 ? 0.01 : 0), 1);
                        const newGreen = row.greenCount + (Math.random() > 0.999 ? 1 : 0);
                        const newSubmitCall = (row.submitAndCall || 0) + (Math.random() > 0.999 ? 1 : 0);
                        const newGreenSent = (row.greenSentCount || 0) + (Math.random() > 0.999 ? 1 : 0);

                        const newBreakCount = row.breakCount + (Math.random() > 0.9995 ? 1 : 0);
                        return {
                            ...row,
                            rxDecoded: newRx,
                            productsDecoded: newProducts,
                            greenCount: newGreen,
                            submitAndCall: newSubmitCall,
                            greenSentCount: newGreenSent,
                            hours: newHours,
                            breakHours: newBreak,
                            awayHours: newAway,
                            breakCount: newBreakCount
                        };
                    }
                    return row;
                });
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);



    const handleColumnFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // --- Mock Call Data Generator ---
    const generateMockCalls = (count) => {
        const calls = [];
        let startTime = new Date();
        startTime.setHours(9, 0, 0, 0); // Start at 9 AM

        for (let i = 1; i <= count; i++) {
            // Random duration between 1 and 10 minutes
            const durationMinutes = Math.floor(Math.random() * 9) + 1;
            const durationSeconds = Math.floor(Math.random() * 60);

            const endTime = new Date(startTime.getTime() + durationMinutes * 60000 + durationSeconds * 1000);

            calls.push({
                sno: i,
                startTime: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
                endTime: endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
            });

            // Next call starts 2-20 mins later
            startTime = new Date(endTime.getTime() + (Math.floor(Math.random() * 18) + 2) * 60000);
        }
        return calls;
    };

    const [selectedCallsEmployee, setSelectedCallsEmployee] = useState(null);
    const [callLogs, setCallLogs] = useState([]);

    const handleCallClick = (employee) => {
        if (!employee.submitAndCall || employee.submitAndCall === 0) return;
        const logs = generateMockCalls(employee.submitAndCall);
        setCallLogs(logs);
        setSelectedCallsEmployee(employee);
    };

    const closeCallModal = () => {
        setSelectedCallsEmployee(null);
        setCallLogs([]);
    };

    // --- Filtering & Aggregation Logic ---
    const filteredData = useMemo(() => {
        // If no date range selected, return empty or default
        if (!dateRange?.from) return [];

        const fromDate = startOfDay(dateRange.from);
        const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

        return EMPLOYEES.map((name, index) => {
            // Find all records for this employee within date range
            const employeeRecords = allData.filter(row => {
                const rowDate = parseISO(row.date);
                return row.name === name && isWithinInterval(rowDate, { start: fromDate, end: toDate });
            });

            // Apply name filter
            if (filters.name && !name.toLowerCase().includes(filters.name.toLowerCase())) return null;

            if (employeeRecords.length === 0) {
                // If filtering by name and no records, we might still want to show the row if the name matches? 
                // But usually if no data in range, show zeros.
                if (filters.name && !name.toLowerCase().includes(filters.name.toLowerCase())) return null;

                return {
                    id: index,
                    empId: `EMP-${1000 + index}`,
                    name,
                    hours: 0,
                    rxDecoded: 0,
                    productsDecoded: 0,
                    greenCount: 0,
                    breakHours: 0,
                    awayHours: 0,
                    breakCount: 0,
                    submitAndCall: 0,
                    greenSentCount: 0,
                    avgRxDecoded: 0
                };
            }

            // Aggregate data
            const totalHours = employeeRecords.reduce((sum, row) => sum + row.hours, 0);
            const totalRx = employeeRecords.reduce((sum, row) => sum + row.rxDecoded, 0);
            const totalProducts = employeeRecords.reduce((sum, row) => sum + row.productsDecoded, 0);
            const totalGreen = employeeRecords.reduce((sum, row) => sum + row.greenCount, 0);
            const totalSubmitCall = employeeRecords.reduce((sum, row) => sum + (row.submitAndCall || 0), 0);
            const totalGreenSent = employeeRecords.reduce((sum, row) => sum + (row.greenSentCount || 0), 0);
            const totalBreak = employeeRecords.reduce((sum, row) => sum + (row.breakHours || 0), 0);
            const totalAway = employeeRecords.reduce((sum, row) => sum + (row.awayHours || 0), 0);
            const totalBreakCount = employeeRecords.reduce((sum, row) => sum + (row.breakCount || 0), 0);

            // Calculate Average Prescriptions Decoded per Hour
            const avgRxDecoded = totalHours > 0 ? (totalRx / totalHours) : 0;

            return {
                id: index,
                empId: `EMP-${1000 + index}`,
                name,
                hours: totalHours,
                rxDecoded: totalRx,
                avgRxDecoded,
                productsDecoded: totalProducts,
                greenCount: totalGreen,
                submitAndCall: totalSubmitCall,
                greenSentCount: totalGreenSent,
                breakHours: totalBreak,
                awayHours: totalAway,
                breakCount: totalBreakCount
            };
        }).filter(Boolean);
    }, [allData, filters, dateRange]);

    // --- Pagination Logic ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // --- Export Logic ---
    const handleExport = () => {
        const exportData = filteredData.map(row => ({
            "Employee ID": row.empId, // New Export Column
            "Employee Name": row.name,
            "Hours Worked": row.hours,
            "Rx Decoded": row.rxDecoded,
            "Avg Rx Decoded": row.avgRxDecoded.toFixed(2), // New Export Column
            "Products": row.productsDecoded,
            "Green Decoded": row.greenCount,
            "Green Sent": row.greenSentCount || 0,
            "Calls (Submit & Call)": row.submitAndCall,
            "break hours": row.breakHours,
            "away hours": row.awayHours,
            "No. of Breaks": row.breakCount
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Performance Report");
        writeFile(wb, "Performance_Report.xlsx");
    };



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
                                <Calendar className="text-indigo-600" size={24} />
                                Performance Report
                            </h1>
                            <p className="text-xs text-slate-500">
                                {dateRange?.from ? (
                                    <>
                                        {format(dateRange.from, 'MMM dd, yyyy')}
                                        {dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime() && ` - ${format(dateRange.to, 'MMM dd, yyyy')}`}
                                    </>
                                ) : 'Select Date Range'}
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
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

                        <div className="h-8 w-px bg-slate-300 mx-2" />

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
                                    <th className="px-6 py-4 min-w-[200px]">
                                        <div className="flex flex-col gap-2">
                                            <span>Employee Name</span>
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Filter..."
                                                    className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                                                    value={filters.name}
                                                    onChange={(e) => handleColumnFilterChange('name', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span>Hours Worked</span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span>No. of Breaks</span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span>Hours Break Taken</span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span>Hours Away Without Intimation</span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span>Rx Decoded</span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span>Avg Rx/Hr</span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span>Products</span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span className="text-emerald-700">Green Decoded</span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span className="text-emerald-700">Green Sent</span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span>Calls (Submit & Call)</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row) => (
                                        <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">{row.name}</span>
                                                    <span className="text-xs text-slate-500">{row.empId}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                                                {/* Format decimal hours to HH:MM:SS */}
                                                {(() => {
                                                    const h = Math.floor(row.hours);
                                                    const m = Math.floor((row.hours - h) * 60);
                                                    const s = Math.floor(((row.hours - h) * 60 - m) * 60);
                                                    return `${h}h ${m}m ${s}s`;
                                                })()}
                                            </td>
                                            <td className="px-6 py-4">{row.breakCount}</td>
                                            <td className="px-6 py-4">{row.breakHours.toFixed(2)} hrs</td>
                                            <td className="px-6 py-4 text-red-600 font-bold">{row.awayHours.toFixed(2)} hrs</td>
                                            <td className="px-6 py-4">{row.rxDecoded}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-700">
                                                {row.avgRxDecoded.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">{row.productsDecoded}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-bold text-xs">
                                                    {row.greenCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-emerald-600 font-bold text-sm">
                                                    {row.greenSentCount || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {row.submitAndCall > 0 ? (
                                                    <button
                                                        onClick={() => handleCallClick(row)}
                                                        className="text-indigo-600 font-bold hover:text-indigo-800 hover:underline focus:outline-none"
                                                    >
                                                        {row.submitAndCall}
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-400 font-medium">0</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="11" className="px-6 py-12 text-center text-slate-400">
                                            <Filter size={48} className="mx-auto mb-4 opacity-20" />
                                            <p>No records found matching your filters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                        <span>Showing {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records</span>

                        <div className="flex gap-2 items-center">
                            <span className="mr-2 text-slate-400">Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 border border-slate-300 rounded bg-white hover:bg-slate-50"
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
                                className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 border border-slate-300 rounded bg-white hover:bg-slate-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Calls Detail Modal */}
            {
                selectedCallsEmployee && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Call Logs</h2>
                                    <p className="text-sm text-slate-500">
                                        {selectedCallsEmployee.name} <span className="font-mono text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-600 ml-2">{selectedCallsEmployee.empId}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={closeCallModal}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-0 max-h-[60vh] overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold">S.No</th>
                                            <th className="px-6 py-3 font-semibold">Start Time</th>
                                            <th className="px-6 py-3 font-semibold">End Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {callLogs.map((log) => (
                                            <tr key={log.sno} className="hover:bg-slate-50">
                                                <td className="px-6 py-3 font-medium text-slate-600">{log.sno}</td>
                                                <td className="px-6 py-3 text-slate-700 font-mono">{log.startTime}</td>
                                                <td className="px-6 py-3 text-slate-700 font-mono">{log.endTime}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={closeCallModal}
                                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PerformanceReport;
