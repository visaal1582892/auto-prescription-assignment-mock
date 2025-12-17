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
    // --- Mock Data Generation (Daily for 2025) ---
    const generateData = () => {
        const data = [];
        const todayStr = new Date().toISOString().split('T')[0];

        // Ensure every employee has an entry for Today with initial VALID values (started day)
        EMPLOYEES.forEach((name, idx) => {
            data.push({
                id: 2000 + idx, // Unique IDs
                name,
                date: todayStr,
                hours: Math.floor(Math.random() * 4) + 2, // Already worked 2-6 hours
                rxDecoded: Math.floor(Math.random() * 30) + 10, // already decoded some
                productsDecoded: Math.floor(Math.random() * 80) + 20,
                greenCount: Math.floor(Math.random() * 5),
                breakHours: parseFloat((Math.random() * 0.5).toFixed(2)),
                awayHours: 0,
                breakCount: Math.floor(Math.random() * 2),

                submitAndCall: Math.floor(Math.random() * 15), // "Submit and Call" clicks
                greenSentCount: Math.floor(Math.random() * 10) // New 'Green Sent' Metric
            });
        });

        return data;
    };

    const [allData, setAllData] = useState(generateData());

    // --- Filter State ---
    // Default to Today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // We only care about Today's data now
    const [filters, setFilters] = useState({ name: "" });

    // --- Real-time Simulation for Today ---
    useEffect(() => {
        const interval = setInterval(() => {
            setAllData(prevData => {
                return prevData.map(row => {
                    if (row.date === todayStr) {
                        // Simulate work happening
                        // Time updates every second (Realistically)
                        const newHours = row.hours + (1 / 3600);

                        // Metrics update RARELY (Slowly)
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
                            // Store full precision
                            hours: newHours,
                            breakHours: newBreak,
                            awayHours: newAway,
                            breakCount: newBreakCount
                        };
                    }
                    return row;
                });
            });
        }, 1000); // Live updates every 1 second (Realistic Time)

        return () => clearInterval(interval);
    }, [todayStr]);



    const handleColumnFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // --- Filtering & Aggregation Logic ---
    const filteredData = useMemo(() => {
        return EMPLOYEES.map((name, index) => {
            // Find all records for this employee that match selected dates
            const employeeRecords = allData.filter(row => row.date === todayStr && row.name === name);

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
                    breakHours: 0,
                    awayHours: 0,
                    breakCount: 0
                };
            }

            // Aggregate data (though for Today there's only 1 record, reduce keeps it safe)
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
            // Avoid division by zero
            const avgRxDecoded = totalHours > 0 ? (totalRx / totalHours) : 0;

            return {
                id: index,
                empId: `EMP-${1000 + index}`, // New Field
                name,
                hours: totalHours, // Keep precision
                rxDecoded: totalRx,
                avgRxDecoded, // New Field
                productsDecoded: totalProducts,
                greenCount: totalGreen,
                submitAndCall: totalSubmitCall,
                greenSentCount: totalGreenSent,
                breakHours: totalBreak,
                awayHours: totalAway,
                breakCount: totalBreakCount
            };
        }).filter(Boolean); // Remove nulls from name filter
    }, [allData, filters]); // Remove selectedDates dependency

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
            "Green Channel": row.greenCount,
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
                            <p className="text-xs text-slate-500">Daily performance metrics for 2025</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-3">
                        {/* Custom Calendar Filter */}
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
                                        <span className="text-emerald-700">Green Channel</span>
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
                                                <span className="text-slate-700 font-medium">
                                                    {row.submitAndCall || 0}
                                                </span>
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
            </main >
        </div >
    );
};

export default PerformanceReport;
