import React, { useState, useMemo, useEffect } from 'react';
import {
    Calendar,
    Filter,
    Download,
    ArrowLeft,
    Search,
    ChevronDown,
    Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { utils, writeFile } from 'xlsx';

const PerformanceReport = () => {
    const navigate = useNavigate();

    const EMPLOYEES = ["Alice Cooper", "Bob Martin", "Charlie Day", "Diana Prince", "Evan Wright", "Frank Castle", "Grace Ho", "Henry Wu"];

    // --- Mock Data Generation (Daily for 2025) ---
    const generateData = () => {
        const data = [];

        // Generate data for the full year of 2025, but stop at today
        const startDate = new Date(2025, 0, 1);
        const endDate = new Date(); // Stop at today

        for (let i = 0; i < 1500; i++) { // Increased count to ensure coverage
            const name = EMPLOYEES[Math.floor(Math.random() * EMPLOYEES.length)];

            // Random date between start and end
            const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
            const date = new Date(randomTime);
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

            data.push({
                id: i,
                name,
                date: dateStr,
                hours: Math.floor(Math.random() * 8) + 4, // 4-12 hours per day
                rxDecoded: Math.floor(Math.random() * 50) + 20, // 20-70
                productsDecoded: Math.floor(Math.random() * 150) + 50, // 50-200
                greenCount: Math.floor(Math.random() * 10),
                accuracy: (95 + Math.random() * 5).toFixed(2)
            });
        }

        // Ensure every employee has an entry for Today with initial values
        EMPLOYEES.forEach((name, idx) => {
            data.push({
                id: 2000 + idx, // Unique IDs
                name,
                date: endDate.toISOString().split('T')[0],
                hours: 0,
                rxDecoded: 0,
                productsDecoded: 0,
                greenCount: 0,
                accuracy: "100.00"
            });
        });

        return data.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const [allData, setAllData] = useState(generateData());

    // --- Filter State ---
    // Default to Today (Dec 3rd, 2025 based on current context)
    const today = new Date();
    // For simulation purposes, let's fix "Today" to a specific date if the system time isn't 2025, 
    // but since the prompt says current time is 2025-12-03, we use that.
    const todayStr = today.toISOString().split('T')[0];

    const [selectedDates, setSelectedDates] = useState([todayStr]); // Default to Today
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1)); // Default to current month
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [filters, setFilters] = useState({ name: "" });

    // Drag Selection State
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartDate, setDragStartDate] = useState(null);

    // --- Real-time Simulation for Today ---
    useEffect(() => {
        const interval = setInterval(() => {
            setAllData(prevData => {
                return prevData.map(row => {
                    if (row.date === todayStr) {
                        // Simulate work happening
                        const newRx = row.rxDecoded + (Math.random() > 0.7 ? 1 : 0);
                        const newProducts = row.productsDecoded + (Math.random() > 0.6 ? Math.floor(Math.random() * 3) : 0);
                        const newHours = Math.min(row.hours + 0.01, 12); // Increment hours slowly, cap at 12

                        return {
                            ...row,
                            rxDecoded: newRx,
                            productsDecoded: newProducts,
                            hours: parseFloat(newHours.toFixed(2)),
                            // Occasionally update accuracy
                            accuracy: (Math.random() > 0.9) ? (95 + Math.random() * 5).toFixed(2) : row.accuracy
                        };
                    }
                    return row;
                });
            });
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, [todayStr]);

    // --- Calendar Helpers ---
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const handleDateClick = (day) => {
        // Kept for single click, but drag logic supersedes if dragging occurs
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        setSelectedDates([dateStr]); // Single click selects just that day (resetting others)
    };

    const handleMouseDown = (day) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Prevent selecting future dates
        if (date > today) return;

        setIsDragging(true);
        const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        setDragStartDate(date);
        setSelectedDates([dateStr]); // Start fresh selection
    };

    const handleMouseEnter = (day) => {
        if (!isDragging || !dragStartDate) return;

        const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

        // Calculate range
        let start = dragStartDate < currentDate ? dragStartDate : currentDate;
        let end = dragStartDate < currentDate ? currentDate : dragStartDate;

        // Cap end date at today
        if (end > today) end = today;
        if (start > today) start = today;

        const newSelection = [];
        const loopDate = new Date(start);
        while (loopDate <= end) {
            const dateStr = new Date(loopDate.getTime() - (loopDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            newSelection.push(dateStr);
            loopDate.setDate(loopDate.getDate() + 1);
        }
        setSelectedDates(newSelection);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragStartDate(null);
    };

    // Add global mouse up to stop dragging if released outside
    React.useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const changeMonth = (offset) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const handleColumnFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // --- Filtering & Aggregation Logic ---
    const filteredData = useMemo(() => {
        return EMPLOYEES.map((name, index) => {
            // Find all records for this employee that match selected dates
            const employeeRecords = allData.filter(row =>
                row.name === name &&
                (selectedDates.length === 0 || selectedDates.includes(row.date))
            );

            // Apply name filter
            if (filters.name && !name.toLowerCase().includes(filters.name.toLowerCase())) return null;

            if (employeeRecords.length === 0) {
                return {
                    id: index,
                    name,
                    hours: 0,
                    rxDecoded: 0,
                    productsDecoded: 0,
                    greenCount: 0,
                    accuracy: "0.00"
                };
            }

            // Aggregate data
            const totalHours = employeeRecords.reduce((sum, row) => sum + row.hours, 0);
            const totalRx = employeeRecords.reduce((sum, row) => sum + row.rxDecoded, 0);
            const totalProducts = employeeRecords.reduce((sum, row) => sum + row.productsDecoded, 0);
            const totalGreen = employeeRecords.reduce((sum, row) => sum + row.greenCount, 0);
            const avgAccuracy = employeeRecords.reduce((sum, row) => sum + parseFloat(row.accuracy), 0) / employeeRecords.length;

            return {
                id: index,
                name,
                hours: parseFloat(totalHours.toFixed(2)),
                rxDecoded: totalRx,
                productsDecoded: totalProducts,
                greenCount: totalGreen,
                accuracy: avgAccuracy.toFixed(2)
            };
        }).filter(Boolean); // Remove nulls from name filter
    }, [allData, selectedDates, filters]);

    // --- Export Logic ---
    const handleExport = () => {
        const exportData = filteredData.map(row => ({
            "Employee Name": row.name,
            "Hours Worked": row.hours,
            "Rx Decoded": row.rxDecoded,
            "Products": row.productsDecoded,
            "Green Channel": row.greenCount,
            "Accuracy %": row.accuracy
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Performance Report");
        writeFile(wb, "Performance_Report.xlsx");
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);

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
                            <p className="text-xs text-slate-500">Daily performance metrics for 2025</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-3">
                        {/* Custom Calendar Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
                            >
                                <Calendar size={16} className="text-slate-500" />
                                {selectedDates.length > 0 ? `${selectedDates.length} Days Selected` : "Select Dates"}
                                <ChevronDown size={14} />
                            </button>

                            {isCalendarOpen && (
                                <div className="absolute top-full mt-2 right-0 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded">
                                            <ChevronDown size={16} className="rotate-90" />
                                        </button>

                                        {/* Month Selection Dropdown */}
                                        <div className="relative group">
                                            <button className="font-bold text-slate-700 flex items-center gap-1 hover:bg-slate-50 px-2 py-1 rounded">
                                                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                <ChevronDown size={12} className="text-slate-400" />
                                            </button>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-50 hidden group-hover:block max-h-48 overflow-y-auto">
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentMonth(new Date(2025, i, 1))}
                                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 ${currentMonth.getMonth() === i ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-700'}`}
                                                    >
                                                        {new Date(2025, i, 1).toLocaleString('default', { month: 'long' })}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 rounded">
                                            <ChevronDown size={16} className="-rotate-90" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                            <div key={d} className="text-xs font-bold text-slate-400">{d}</div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {Array.from({ length: firstDay }).map((_, i) => (
                                            <div key={`empty-${i}`} />
                                        ))}
                                        {Array.from({ length: days }).map((_, i) => {
                                            const day = i + 1;
                                            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                            const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                                            const isSelected = selectedDates.includes(dateStr);
                                            const isFuture = date > today;

                                            return (
                                                <button
                                                    key={day}
                                                    disabled={isFuture}
                                                    onMouseDown={() => !isFuture && handleMouseDown(day)}
                                                    onMouseEnter={() => !isFuture && handleMouseEnter(day)}
                                                    className={`
                                                        h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors select-none
                                                        ${isFuture ? 'text-slate-300 cursor-not-allowed' :
                                                            isSelected
                                                                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                                                                : 'text-slate-700 hover:bg-slate-100'}
                                                    `}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                                        <button
                                            onClick={() => setSelectedDates([todayStr])}
                                            className="text-xs text-slate-500 hover:text-red-600 font-medium"
                                        >
                                            Clear Selection
                                        </button>
                                        <button
                                            onClick={() => setIsCalendarOpen(false)}
                                            className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700"
                                        >
                                            Done
                                        </button>
                                    </div>
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
                                        <span>Rx Decoded</span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span>Products</span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span className="text-emerald-700">Green Channel</span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span>Accuracy %</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.length > 0 ? (
                                    filteredData.map((row) => (
                                        <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                                            <td className="px-6 py-4">{row.hours} hrs</td>
                                            <td className="px-6 py-4">{row.rxDecoded}</td>
                                            <td className="px-6 py-4">{row.productsDecoded}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-bold text-xs">
                                                    {row.greenCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${parseFloat(row.accuracy) >= 98 ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {row.accuracy}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                            <Filter size={48} className="mx-auto mb-4 opacity-20" />
                                            <p>No records found matching your filters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                        <span>Showing {filteredData.length} records</span>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50">Previous</button>
                            <button className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PerformanceReport;
