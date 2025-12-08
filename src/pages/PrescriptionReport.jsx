import React, { useState, useMemo, useEffect } from 'react';
import {
    Calendar,
    Filter,
    Download,
    ArrowLeft,
    Search,
    ChevronDown,
    FileText,
    CheckCircle,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { utils, writeFile } from 'xlsx';

const PrescriptionReport = () => {
    const navigate = useNavigate();

    // --- Mock Data Generation (Daily for 2025) ---
    const generateData = () => {
        const data = [];
        const startDate = new Date(2025, 0, 1);
        const endDate = new Date(); // Stop at today

        const statuses = ['Decoded', 'Not Decoded', 'Returned'];
        const types = ['Normal', 'Green'];
        const employees = ["Alice Cooper", "Bob Martin", "Charlie Day", "Diana Prince", "Evan Wright"];

        for (let i = 0; i < 2000; i++) {
            const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
            const date = new Date(randomTime);
            const dateStr = date.toISOString().split('T')[0];

            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const type = types[Math.floor(Math.random() * types.length)];

            data.push({
                id: i,
                prescriptionId: `RX-${10000 + i}`,
                date: dateStr,
                timestamp: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                patientName: `Patient ${i}`,
                employeeName: status === 'Not Decoded' ? '-' : employees[Math.floor(Math.random() * employees.length)],
                status: status,
                type: type,
                timeTaken: status === 'Decoded' ? `${Math.floor(Math.random() * 5) + 1}m ${Math.floor(Math.random() * 60)}s` : '-'
            });
        }
        return data.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const [allData] = useState(generateData());

    // --- Filter State ---
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const [selectedDates, setSelectedDates] = useState([todayStr]);
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const [filters, setFilters] = useState({
        status: 'All',
        type: 'All',
        search: ''
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Drag Selection State
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartDate, setDragStartDate] = useState(null);

    // --- Calendar Helpers ---
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const handleMouseDown = (day) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Prevent selecting future dates
        if (date > today) return;

        setIsDragging(true);
        const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        setDragStartDate(date);
        setSelectedDates([dateStr]);
    };

    const handleMouseEnter = (day) => {
        if (!isDragging || !dragStartDate) return;
        const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

        // Restrict to 2025
        if (currentDate.getFullYear() !== 2025) return;

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

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const changeMonth = (offset) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
        // Restrict navigation to 2025
        if (newDate.getFullYear() === 2025) {
            setCurrentMonth(newDate);
        }
    };

    // --- Filtering Logic ---
    const filteredData = useMemo(() => {
        return allData.filter(row => {
            // Date Filter
            if (selectedDates.length > 0 && !selectedDates.includes(row.date)) return false;

            // Status Filter
            if (filters.status !== 'All' && row.status !== filters.status) return false;

            // Type Filter
            if (filters.type !== 'All' && row.type !== filters.type) return false;

            // Search Filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                return (
                    row.prescriptionId.toLowerCase().includes(searchLower) ||
                    row.patientName.toLowerCase().includes(searchLower) ||
                    row.employeeName.toLowerCase().includes(searchLower)
                );
            }

            return true;
        });
    }, [allData, selectedDates, filters]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, selectedDates]);

    // --- Export Logic ---
    const handleExport = () => {
        const exportData = filteredData.map(row => ({
            "Prescription ID": row.prescriptionId,
            "Date": row.date,
            "Time": row.timestamp,
            "Patient Name": row.patientName,
            "Employee": row.employeeName,
            "Status": row.status,
            "Type": row.type,
            "Time Taken": row.timeTaken
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Prescription Report");
        writeFile(wb, "Prescription_Report.xlsx");
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
                                <FileText className="text-indigo-600" size={24} />
                                Prescription Report
                            </h1>
                            <p className="text-xs text-slate-500">Detailed prescription logs for 2025</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date Filter */}
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
                                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30" disabled={currentMonth.getMonth() === 0}>
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

                                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30" disabled={currentMonth.getMonth() === 11}>
                                            <ChevronDown size={16} className="-rotate-90" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                            <div key={d} className="text-xs font-bold text-slate-400">{d}</div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
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
                                                    className={`h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors select-none ${isFuture ? 'text-slate-300 cursor-not-allowed' : isSelected ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                                        <button onClick={() => setSelectedDates([todayStr])} className="text-xs text-slate-500 hover:text-red-600 font-medium">Clear Selection</button>
                                        <button onClick={() => setIsCalendarOpen(false)} className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700">Done</button>
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

                {/* Secondary Filters Bar */}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, Patient, or Employee..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">Status:</span>
                        <select
                            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Decoded">Decoded</option>
                            <option value="Not Decoded">Not Decoded</option>
                            <option value="Returned">Returned</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">Type:</span>
                        <select
                            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                            value={filters.type}
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        >
                            <option value="All">All Types</option>
                            <option value="Normal">Normal</option>
                            <option value="Green">Green Channel</option>
                        </select>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Prescription ID</th>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Patient Name</th>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Time Taken</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row) => (
                                        <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-medium text-indigo-600">{row.prescriptionId}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">{row.date}</span>
                                                    <span className="text-xs text-slate-500">{row.timestamp}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{row.patientName}</td>
                                            <td className="px-6 py-4">{row.employeeName}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit
                                                    ${row.status === 'Decoded' ? 'bg-emerald-50 text-emerald-700' :
                                                        row.status === 'Returned' ? 'bg-red-50 text-red-700' :
                                                            'bg-slate-100 text-slate-600'}`}>
                                                    {row.status === 'Decoded' && <CheckCircle size={12} />}
                                                    {row.status === 'Returned' && <XCircle size={12} />}
                                                    {row.status === 'Not Decoded' && <AlertTriangle size={12} />}
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold 
                                                    ${row.type === 'Green' ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-700'}`}>
                                                    {row.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">{row.timeTaken}</td>
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
                        <span>Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} - {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records</span>
                        <div className="flex gap-2 items-center">
                            <span className="mr-2">Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default PrescriptionReport;
