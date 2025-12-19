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
import { DayPicker } from 'react-day-picker';
import { format, subDays, isAfter, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import 'react-day-picker/style.css';

const PrescriptionReport = () => {
    const navigate = useNavigate();

    // --- Mock Data Generation (Daily for past 30 days) ---
    const generateData = () => {
        const data = [];
        const today = new Date();
        const statuses = ['Decoded', 'Not Decoded', 'Returned'];
        const types = ['Normal', 'Green'];
        const employees = ["Alice Cooper", "Bob Martin", "Charlie Day", "Diana Prince", "Evan Wright"];

        // Generate for past 30 days
        for (let d = 0; d < 30; d++) {
            const date = subDays(today, d);
            const dateStr = format(date, 'yyyy-MM-dd');

            // Generate 10-50 prescriptions per day
            const count = Math.floor(Math.random() * 40) + 10;

            for (let i = 0; i < count; i++) {
                const time = new Date(date);
                time.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const type = types[Math.floor(Math.random() * types.length)];

                data.push({
                    id: `${dateStr}-${i}`,
                    prescriptionId: `RX-${10000 + startOfDay(date).getTime() + i}`, // Pseudo-unique ID
                    date: dateStr,
                    timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    patientName: `Patient ${Math.floor(Math.random() * 1000)}`,
                    employeeName: status === 'Not Decoded' ? '-' : employees[Math.floor(Math.random() * employees.length)],
                    empId: status === 'Not Decoded' ? '-' : `EMP-${1000 + Math.floor(Math.random() * 100)}`,
                    status: status,
                    type: type,
                    timeTaken: status === 'Decoded' ? `${Math.floor(Math.random() * 5) + 1}m ${Math.floor(Math.random() * 60)}s` : '-'
                });
            }
        }
        return data.sort((a, b) => b.date.localeCompare(a.date) || b.timestamp.localeCompare(a.timestamp));
    };

    const [allData] = useState(generateData());

    // Date Range State
    const [dateRange, setDateRange] = useState({
        from: new Date(),
        to: new Date()
    });
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const [filters, setFilters] = useState({
        status: 'All',
        type: 'All',
        prescriptionId: '',
        employee: ''
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;



    const changeMonth = (offset) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
        // Restrict navigation to 2025
        if (newDate.getFullYear() === 2025) {
            setCurrentMonth(newDate);
        }
    };

    // --- Filtering Logic ---
    const filteredData = useMemo(() => {
        // Validation: If no range, return empty (shouldn't happen due to enforcement)
        if (!dateRange?.from) return [];

        const fromDate = startOfDay(dateRange.from);
        const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(fromDate);

        return allData.filter(row => {
            // Date Range Filter
            const rowDate = parseISO(row.date);
            if (!isWithinInterval(rowDate, { start: fromDate, end: toDate })) return false;

            // Status Filter
            if (filters.status !== 'All' && row.status !== filters.status) return false;

            // Type Filter
            if (filters.type !== 'All' && row.type !== filters.type) return false;

            // Prescription ID Filter
            if (filters.prescriptionId && !row.prescriptionId.toLowerCase().includes(filters.prescriptionId.toLowerCase())) return false;

            // Employee Filter (Name or ID)
            if (filters.employee) {
                const search = filters.employee.toLowerCase();
                const empName = row.employeeName.toLowerCase();
                const empId = row.empId.toLowerCase();
                if (!empName.includes(search) && !empId.includes(search)) return false;
            }

            return true;
        });
    }, [allData, filters, dateRange]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // --- Export Logic ---
    const handleExport = () => {
        const exportData = filteredData.map(row => ({
            "Prescription ID": row.prescriptionId,
            "Date": row.date,
            "Time": row.timestamp,
            "Patient Name": row.patientName,
            "Employee Name": row.employeeName,
            "Employee ID": row.empId, // New Export Column
            "Status": row.status,
            "Type": row.type,
            "Time Taken": row.timeTaken
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Prescription Report");
        writeFile(wb, "Prescription_Report.xlsx");
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
                                <FileText className="text-indigo-600" size={24} />
                                Prescription Report
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
                                        <button onClick={() => setIsCalendarOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={16} /></button>
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

                        {(filters.status !== 'All' || filters.type !== 'All' || filters.prescriptionId || filters.employee) && (
                            <button
                                onClick={() => setFilters({ status: 'All', type: 'All', prescriptionId: '', employee: '' })}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all"
                            >
                                <XCircle size={16} />
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-4 min-w-[140px]">
                                        <div className="flex flex-col gap-2">
                                            <span>Prescription ID</span>
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search ID..."
                                                    className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal"
                                                    value={filters.prescriptionId}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, prescriptionId: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 w-32">Date & Time</th>
                                    <th className="px-4 py-4 min-w-[180px]">
                                        <div className="flex flex-col gap-2">
                                            <span>Employee</span>
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search Name/ID..."
                                                    className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal"
                                                    value={filters.employee}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, employee: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 text-center min-w-[140px]">
                                        <div className="flex flex-col gap-2">
                                            <span>Status</span>
                                            <select
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal"
                                                value={filters.status}
                                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                            >
                                                <option value="All">All</option>
                                                <option value="Decoded">Decoded</option>
                                                <option value="Not Decoded">Not Decoded</option>
                                                <option value="Returned">Returned</option>
                                            </select>
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 text-center min-w-[130px]">
                                        <div className="flex flex-col gap-2">
                                            <span>Type</span>
                                            <select
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal"
                                                value={filters.type}
                                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                            >
                                                <option value="All">All</option>
                                                <option value="Normal">Normal</option>
                                                <option value="Green">Green</option>
                                            </select>
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 text-center">Time Taken</th>
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
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">{row.employeeName}</span>
                                                    <span className="text-xs text-slate-500">{row.empId}</span>
                                                </div>
                                            </td>
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
                            <span className="mr-2 text-slate-400">Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 border border-slate-300 rounded bg-white hover:bg-slate-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div >
    );
};

export default PrescriptionReport;
