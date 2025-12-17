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
        const todayStr = new Date().toISOString().split('T')[0];

        const statuses = ['Decoded', 'Not Decoded', 'Returned'];
        const types = ['Normal', 'Green'];
        const employees = ["Alice Cooper", "Bob Martin", "Charlie Day", "Diana Prince", "Evan Wright"];

        for (let i = 0; i < 200; i++) { // Generate meaningful amount for today
            const date = new Date();
            // Random time today
            date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

            const dateStr = todayStr;

            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const type = types[Math.floor(Math.random() * types.length)];

            data.push({
                id: i,
                prescriptionId: `RX-${10000 + i}`,
                date: dateStr,
                timestamp: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                patientName: `Patient ${i}`,
                employeeName: status === 'Not Decoded' ? '-' : employees[Math.floor(Math.random() * employees.length)],
                empId: status === 'Not Decoded' ? '-' : `EMP-${1000 + Math.floor(Math.random() * 100)}`, // New Field
                status: status,
                type: type,
                timeTaken: status === 'Decoded' ? `${Math.floor(Math.random() * 5) + 1}m ${Math.floor(Math.random() * 60)}s` : '-'
            });
        }
        return data.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    };

    const [allData] = useState(generateData());

    // --- Filter State ---
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Removed detailed calendar state


    const [filters, setFilters] = useState({
        status: 'All',
        type: 'All',
        search: ''
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
        return allData.filter(row => {
            // Date Filter (Strictly Today)
            if (row.date !== todayStr) return false;

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
    }, [allData, filters]);

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
                            <p className="text-xs text-slate-500">Detailed prescription logs for 2025</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date Filter */}
                        {/* Date Display (Static) */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-sm font-bold text-indigo-700">
                            <Calendar size={16} className="text-indigo-600" />
                            {today.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
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
        </div>
    );
};

export default PrescriptionReport;
