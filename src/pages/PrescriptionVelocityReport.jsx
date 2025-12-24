import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { utils, writeFile } from 'xlsx';
import { DayPicker } from 'react-day-picker';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import {
    ArrowLeft,
    TrendingUp,
    Download,
    Calendar,
    ChevronDown,
    X,
    Filter
} from 'lucide-react';
import 'react-day-picker/style.css';

const PrescriptionVelocityReport = () => {
    const navigate = useNavigate();

    // --- Mock Data Generation ---
    const generateData = () => {
        const data = [];
        const today = new Date();

        // Generate for past 30 days
        for (let i = 0; i <= 30; i++) {
            const date = subDays(today, i);
            const dateStr = format(date, 'yyyy-MM-dd');

            // Random realistic distributions
            const total = Math.floor(Math.random() * 1000) + 1000;

            // Generate 11 buckets: 0-1, 1-2, ... 9-10, >10
            const buckets = {};
            let currentSum = 0;

            // Buckets 0-9 (representing 0-1 min to 9-10 min)
            // Target distribution sums to ~95%, ensuring remainder for >10 min
            const distributions = [0.20, 0.18, 0.15, 0.12, 0.10, 0.08, 0.05, 0.04, 0.02, 0.01];

            for (let j = 0; j < 10; j++) {
                const basePercent = distributions[j];
                const val = Math.floor(total * basePercent + (Math.random() * 20 - 10));
                buckets[`b${j}_${j + 1}`] = Math.max(0, val);
                currentSum += buckets[`b${j}_${j + 1}`];
            }

            // Remainder goes to >10 min
            const bOver10 = Math.max(0, total - currentSum);

            data.push({
                date: dateStr,
                total,
                ...buckets, // Spread b0_1, b1_2, ... b9_10
                bOver10
            });
        }
        return data;
    };

    const [allData, setAllData] = useState(generateData());

    // --- Real-time Simulation for Today ---
    useEffect(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        const interval = setInterval(() => {
            setAllData(prevData => {
                return prevData.map(row => {
                    if (row.date === todayStr) {
                        // Simulate new prescriptions coming in (1-3 every update)
                        const newPrescriptions = Math.floor(Math.random() * 3) + 1;

                        // Create a clone of current buckets
                        const updatedRow = { ...row, total: row.total + newPrescriptions };

                        // Distribute the new prescriptions into buckets
                        for (let k = 0; k < newPrescriptions; k++) {
                            // Weight random selection towards lower minutes
                            const r = Math.random();
                            let bucketIndex = 0;
                            if (r < 0.3) bucketIndex = 0; // 0-1
                            else if (r < 0.55) bucketIndex = 1; // 1-2
                            else if (r < 0.70) bucketIndex = 2; // 2-3
                            else if (r < 0.80) bucketIndex = 3; // 3-4
                            else if (r < 0.88) bucketIndex = 4; // 4-5
                            else if (r < 0.94) bucketIndex = 5; // 5-6
                            else if (r < 0.97) bucketIndex = 6; // 6-7
                            else if (r < 0.985) bucketIndex = 7; // 7-8
                            else if (r < 0.995) bucketIndex = 8; // 8-9
                            else bucketIndex = 9; // 9-10 (approx)

                            // 5% chance for > 10 min
                            if (Math.random() > 0.95) {
                                updatedRow.bOver10 += 1;
                            } else {
                                updatedRow[`b${bucketIndex}_${bucketIndex + 1}`] += 1;
                            }
                        }
                        return updatedRow;
                    }
                    return row;
                });
            });
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, []);

    // --- Filter State ---
    const [dateRange, setDateRange] = useState({
        from: subDays(new Date(), 6), // Default to last 7 days
        to: new Date()
    });
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // --- Aggregation Logic ---
    const { reportData, summaryStats } = useMemo(() => {
        if (!dateRange?.from) return { reportData: [], summaryStats: null };

        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(from);

        const filtered = allData.filter(row => isWithinInterval(parseISO(row.date), { start: from, end: to }));

        // Sort by date descending
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Compute Totals
        const initialTotals = {
            total: 0,
            b0_1: 0, b1_2: 0, b2_3: 0, b3_4: 0, b4_5: 0,
            b5_6: 0, b6_7: 0, b7_8: 0, b8_9: 0, b9_10: 0,
            bOver10: 0
        };

        const totals = filtered.reduce((acc, row) => {
            const newAcc = { ...acc, total: acc.total + row.total, bOver10: acc.bOver10 + row.bOver10 };
            for (let j = 0; j < 10; j++) {
                const key = `b${j}_${j + 1}`;
                newAcc[key] += row[key];
            }
            return newAcc;
        }, initialTotals);

        return { reportData: filtered, summaryStats: totals };

    }, [allData, dateRange]);

    // Helpers
    const getPercent = (val, total) => total > 0 ? Math.round((val / total) * 100) : 0;

    const handleExport = () => {
        const exportData = reportData.map(row => {
            const r = { "Date": row.date, "Total Prescriptions": row.total };
            for (let j = 0; j < 10; j++) {
                const val = row[`b${j}_${j + 1}`];
                r[`${j}-${j + 1} min`] = val;
                r[`${j}-${j + 1} min %`] = row.total > 0 ? ((val / row.total) * 100).toFixed(1) + '%' : '0%';
            }
            const valOver10 = row.bOver10;
            r["> 10 min"] = valOver10;
            r["> 10 min %"] = row.total > 0 ? ((valOver10 / row.total) * 100).toFixed(1) + '%' : '0%';
            return r;
        });

        // Add Total Row
        if (summaryStats) {
            const totalRow = { "Date": "TOTAL", "Total Prescriptions": summaryStats.total };
            for (let j = 0; j < 10; j++) {
                const val = summaryStats[`b${j}_${j + 1}`];
                totalRow[`${j}-${j + 1} min`] = val;
                totalRow[`${j}-${j + 1} min %`] = summaryStats.total > 0 ? ((val / summaryStats.total) * 100).toFixed(1) + '%' : '0%';
            }
            const valOver10 = summaryStats.bOver10;
            totalRow["> 10 min"] = valOver10;
            totalRow["> 10 min %"] = summaryStats.total > 0 ? ((valOver10 / summaryStats.total) * 100).toFixed(1) + '%' : '0%';
            exportData.push(totalRow);
        }

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Velocity_Report");
        writeFile(wb, "Prescription_Velocity_Report.xlsx");
    }

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(reportData.length / itemsPerPage);
    const paginatedData = reportData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [dateRange]);

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
                                <TrendingUp className="text-indigo-600" size={24} />
                                Prescription Velocity Report
                            </h1>
                            <p className="text-xs text-slate-500">
                                Analyze processing speeds minute-by-minute.
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

            <main className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">

                {/* Summary Cards */}
                {summaryStats && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                Velocity Summary ({format(dateRange.from, 'MMM dd')} - {dateRange.to ? format(dateRange.to, 'MMM dd') : ''})
                            </h2>
                            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded">
                                Total: {summaryStats.total}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2 text-center">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                <div key={i} className={`p-2 rounded-lg border flex flex-col items-center justify-center ${i < 5 ? 'bg-emerald-50 border-emerald-100' : (i < 8 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100')}`}>
                                    <div className={`text-lg font-bold ${i < 5 ? 'text-emerald-700' : (i < 8 ? 'text-amber-700' : 'text-red-700')}`}>
                                        {summaryStats[`b${i}_${i + 1}`]}
                                    </div>
                                    <div className={`text-[10px] font-bold uppercase ${i < 5 ? 'text-emerald-600' : (i < 8 ? 'text-amber-600' : 'text-red-600')}`}>
                                        {i}-{i + 1} Min
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium">
                                        {getPercent(summaryStats[`b${i}_${i + 1}`], summaryStats.total)}%
                                    </div>
                                </div>
                            ))}
                            <div className="p-2 rounded-lg border bg-red-100 border-red-200 flex flex-col items-center justify-center">
                                <div className="text-lg font-bold text-red-900">{summaryStats.bOver10}</div>
                                <div className="text-[10px] font-bold uppercase text-red-800">&gt; 10 Min</div>
                                <div className="text-[10px] text-red-700 font-medium">{getPercent(summaryStats.bOver10, summaryStats.total)}%</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-center text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider min-w-[120px]">Date</th>
                                    <th className="px-2 py-3 text-slate-800 font-bold bg-slate-100">Total</th>
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                        <th key={i} className="px-2 py-3 font-semibold text-slate-600 whitespace-nowrap">{i}-{i + 1} m</th>
                                    ))}
                                    <th className="px-2 py-3 font-bold text-red-600 bg-red-50 whitespace-nowrap">&gt; 10 m</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row) => (
                                        <tr key={row.date} className="bg-white hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-left font-medium text-slate-800 whitespace-nowrap">{row.date}</td>
                                            <td className="px-2 py-3 font-bold text-slate-900 bg-slate-50">{row.total}</td>
                                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                                <td key={i} className="px-2 py-3 text-xs text-slate-600">
                                                    <div>{row[`b${i}_${i + 1}`]}</div>
                                                    <div className="text-[10px] text-slate-400">
                                                        ({getPercent(row[`b${i}_${i + 1}`], row.total)}%)
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="px-2 py-3 font-bold text-red-700 bg-red-50/50 text-xs">
                                                <div>{row.bOver10}</div>
                                                <div className="text-[10px] text-red-500 font-normal">
                                                    ({getPercent(row.bOver10, row.total)}%)
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="13" className="px-6 py-12 text-center text-slate-400">
                                            No records found for the selected range.
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

                            {/* Numbered Pagination */}
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
        </div>
    );
};

export default PrescriptionVelocityReport;
