import React, { useState, useEffect, useMemo } from 'react';
import { utils, writeFile } from 'xlsx';
import {
    Clock,
    Search,
    Filter,
    Download,
    ArrowLeft,
    Phone,
    MoreVertical,
    Coffee,
    Home,
    Building,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BreakMonitoring = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'IN_HOUSE', 'WFH'
    const [filterBreak, setFilterBreak] = useState('ALL'); // 'ALL', 'Call Break', 'Verify Break', 'Normal Break', 'No Intimation'

    // Mock Data
    const [employees, setEmployees] = useState([
        { id: 1, name: "Sarah Jenkins", type: "IN_HOUSE", phone: "+91 98765 43210", breakType: "Normal Break", startTime: Date.now() - 1000 * 60 * 12 }, // 12 mins ago
        { id: 2, name: "Mike Ross", type: "WFH", phone: "+91 99887 76655", breakType: "Call Break", startTime: Date.now() - 1000 * 60 * 5 }, // 5 mins ago
        { id: 3, name: "Rachel Green", type: "IN_HOUSE", phone: "+91 91234 56789", breakType: "No Intimation", startTime: Date.now() - 1000 * 60 * 25 }, // 25 mins ago (Critical)
        { id: 4, name: "Harvey Specter", type: "WFH", phone: "+91 98765 09876", breakType: "Verify Break", startTime: Date.now() - 1000 * 60 * 8 },
        { id: 5, name: "Donna Paulsen", type: "IN_HOUSE", phone: "+91 90123 45678", breakType: "Normal Break", startTime: Date.now() - 1000 * 60 * 2 },
        { id: 6, name: "Louis Litt", type: "IN_HOUSE", phone: "+91 94567 89012", breakType: "Call Break", startTime: Date.now() - 1000 * 60 * 18 },
        { id: 7, name: "Jessica Pearson", type: "WFH", phone: "+91 93210 54321", breakType: "Verify Break", startTime: Date.now() - 1000 * 60 * 4 },
        { id: 8, name: "Alex Williams", type: "WFH", phone: "+91 87654 32109", breakType: "No Intimation", startTime: Date.now() - 1000 * 60 * 45 }, // 45 mins!
    ]);

    // Live Clock for Duration
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

    // Filter Logic
    const filteredEmployees = useMemo(() => employees.filter(emp => {
        if (filterType !== 'ALL' && emp.type !== filterType) return false;
        if (filterBreak !== 'ALL' && emp.breakType !== filterBreak) return false;
        return true;
    }), [employees, filterType, filterBreak]);

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

    const paginatedEmployees = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredEmployees.slice(start, start + itemsPerPage);
    }, [filteredEmployees, currentPage]);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterType, filterBreak]);

    const getBreakColor = (type) => {
        switch (type) {
            case 'Call Break': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Verify Break': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'No Intimation': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const handleExport = () => {
        const exportData = filteredEmployees.map(emp => {
            const durationMs = currentTime - emp.startTime;
            const minutes = Math.floor(durationMs / 60000);
            const seconds = Math.floor((durationMs % 60000) / 1000);

            return {
                "Employee Name": emp.name,
                "Employee ID": `EMP-${emp.id + 1000}`,
                "Type": emp.type,
                "Contact": emp.phone,
                "Break Type": emp.breakType,
                "Start Time": new Date(emp.startTime).toLocaleTimeString(),
                "Duration": `${minutes}m ${seconds}s`,
                "Is Critical": minutes >= 15 ? "Yes" : "No"
            };
        });

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Break_Log");
        writeFile(wb, "Break_Monitoring_Log.xlsx");
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Header */}
            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Coffee className="text-amber-500" size={24} />
                            Break Monitoring
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">Live tracking of employee break status</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100 text-sm font-bold">
                        <span>Total on Break:</span>
                        <span className="text-lg">{employees.length}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-100 text-sm font-bold">
                        <span>Critical (&gt;15m):</span>
                        <span className="text-lg">{employees.filter(e => (currentTime - e.startTime) > 15 * 60000).length}</span>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto p-6 space-y-6">

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Break Type Filter */}
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                            <Filter size={14} className="text-slate-400" />
                            <select
                                value={filterBreak}
                                onChange={(e) => setFilterBreak(e.target.value)}
                                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
                            >
                                <option value="ALL">All Break Types</option>
                                <option value="Normal Break">Normal Break</option>
                                <option value="Call Break">Call Break</option>
                                <option value="Verify Break">Verify Break</option>
                                <option value="No Intimation">No Intimation</option>
                            </select>
                        </div>

                        {/* Location Filter */}
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                            <Building size={14} className="text-slate-400" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
                            >
                                <option value="ALL">All Locations</option>
                                <option value="IN_HOUSE">In-House</option>
                                <option value="WFH">Work From Home</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors text-sm"
                    >
                        <Download size={16} />
                        Export Log
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Break Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Live Duration</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedEmployees.length > 0 ? (
                                paginatedEmployees.map((emp) => {
                                    const durationMs = currentTime - emp.startTime;
                                    const isCritical = durationMs > 15 * 60000; // 15 mins

                                    return (
                                        <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{emp.name}</div>
                                                <div className="text-xs text-slate-500">ID: EMP-{emp.id + 1000}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {emp.type === 'IN_HOUSE' ? (
                                                    <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                                                        <Building size={16} className="text-indigo-500" />
                                                        In-House
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                                                        <Home size={16} className="text-purple-500" />
                                                        WFH
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600 text-sm font-mono">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {emp.phone}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBreakColor(emp.breakType)}`}>
                                                    {emp.breakType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-2 font-mono font-bold text-lg ${isCritical ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
                                                    {formatDuration(emp.startTime)}
                                                    {isCritical && <AlertCircle size={16} className="text-red-500" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center">
                                            <Coffee size={48} className="mb-4 text-slate-200" />
                                            <p className="text-lg font-medium text-slate-500">No employees found matching current filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {/* Pagination Controls */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                        <span>Showing {paginatedEmployees.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} records</span>
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
            </div>
        </div>
    );
};

export default BreakMonitoring;
