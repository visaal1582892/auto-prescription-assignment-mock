import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Clock,
    Calendar,
    ChevronDown,
    XCircle,
    Download,
    User
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { DayPicker } from 'react-day-picker';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import 'react-day-picker/style.css';

const DecoderEfficiencyReport = () => {
    const navigate = useNavigate();

    // --- Mock Data Generation ---
    const generateData = () => {
        const data = [];
        const today = new Date();
        const NAMES = [
            "Kolla Santosh Kumar", "Seeta Balaratnam", "Gillalla Vanitha Reddy", "Perumala Rajesh", "Kasapuram Anuradha",
            "Bachu Sagar", "Sudip Chatterjee", "Saivally Panduga", "Fayaz Ahmed", "Gattagalla Pruthvi",
            "KATGENORE SHIVA", "Shaik Jaffer Ahmed", "Devulapelly Anila Kumar", "Undrakonda Renuka Devi", "Pallipati Sukumar",
            "N Umesh", "Sudha Karaturi", "D AJAY RAO", "Mohd Abdul Jabbar Khan", "PAVAN KUMAR GUPTA",
            "MIRZA ALTAF BAIG", "Ramineni Mahender", "Suresh Kumar", "Ramesh Babu", "Venkatesh Rao",
            "Lakshmi Narayana", "Srinivas Murthy", "Manish Pandey", "Deepak Chopra", "Amitabh Bachan",
            "Shahrukh Khan", "Salman Khan", "Priya Varrier", "Samantha Ruth", "Rashmika Mandanna",
            "Keerthy Suresh", "Sai Pallavi", "Naga Chaitanya", "Vijay Devarakonda", "Prabhas Raju",
            "Allu Arjun", "Mahesh Babu", "Ram Charan", "Jr NTR", "Pawan Kalyan"
        ];

        // Generate Daily Records for past 30 days for each employee
        for (let d = 1; d <= 30; d++) {
            const date = subDays(today, d);
            const dateStr = format(date, 'yyyy-MM-dd');

            NAMES.forEach((name, idx) => {
                // Determine randomized totals for the day matching image scale (100s)
                const grandTotal = Math.floor(Math.random() * 400) + 150; // 150-550 total per day

                // Break down into buckets (values similar to image: 0-25 range)
                const b5_6 = Math.floor(Math.random() * 20);
                const b6_7 = Math.floor(Math.random() * 19);
                const b7_8 = Math.floor(Math.random() * 15);
                const b8_9 = Math.floor(Math.random() * 10);
                const b9_10 = Math.floor(Math.random() * 8);
                const bOver10 = Math.floor(Math.random() * 25); // Can be higher sometimes

                // Ensure total >= sum of buckets (the rest are < 5 mins)
                const sumBuckets = b5_6 + b6_7 + b7_8 + b8_9 + b9_10 + bOver10;
                const safeTotal = Math.max(grandTotal, sumBuckets + Math.floor(Math.random() * 50));

                data.push({
                    id: `${dateStr}-${idx}`,
                    date: dateStr,
                    empId: `EMP${10000 + idx}`,
                    empName: name,
                    b5_6,
                    b6_7,
                    b7_8,
                    b8_9,
                    b9_10,
                    bOver10,
                    grandTotal: safeTotal
                });
            });
        }
        return data;
    };

    const [allData] = useState(generateData());

    // --- State ---
    const [dateRange, setDateRange] = useState({
        from: subDays(new Date(), 1),
        to: subDays(new Date(), 1)
    });
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // --- Aggregation Logic ---
    const { processedData, globalTotal } = useMemo(() => {
        if (!dateRange?.from) return { processedData: [], globalTotal: null };

        const fromDate = startOfDay(dateRange.from);
        const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(fromDate);

        // 1. Filter raw rows
        const filtered = allData.filter(row => {
            const rowDate = parseISO(row.date);
            return isWithinInterval(rowDate, { start: fromDate, end: toDate });
        });

        // 2. Aggregate by Employee
        const empMap = {};

        filtered.forEach(row => {
            if (!empMap[row.empId]) {
                empMap[row.empId] = {
                    empId: row.empId,
                    empName: row.empName,
                    b5_6: 0, b6_7: 0, b7_8: 0, b8_9: 0, b9_10: 0, bOver10: 0,
                    grandTotal: 0
                };
            }
            const emp = empMap[row.empId];
            emp.b5_6 += row.b5_6;
            emp.b6_7 += row.b6_7;
            emp.b7_8 += row.b7_8;
            emp.b8_9 += row.b8_9;
            emp.b9_10 += row.b9_10;
            emp.bOver10 += row.bOver10;
            emp.grandTotal += row.grandTotal;
        });

        // 3. Compute Calculated Columns & Global Total
        let global = {
            empId: 'Grand Total', empName: '',
            b5_6: 0, b6_7: 0, b7_8: 0, b8_9: 0, b9_10: 0, bOver10: 0,
            grandTotal: 0, above5Min: 0
        };

        const result = Object.values(empMap).map(emp => {
            const above5Min = emp.b5_6 + emp.b6_7 + emp.b7_8 + emp.b8_9 + emp.b9_10 + emp.bOver10;
            const percentage = emp.grandTotal > 0 ? ((above5Min / emp.grandTotal) * 100).toFixed(2) : "0.00";

            // Add to global
            global.b5_6 += emp.b5_6;
            global.b6_7 += emp.b6_7;
            global.b7_8 += emp.b7_8;
            global.b8_9 += emp.b8_9;
            global.b9_10 += emp.b9_10;
            global.bOver10 += emp.bOver10;
            global.grandTotal += emp.grandTotal;
            global.above5Min += above5Min;

            return { ...emp, above5Min, percentage };
        });

        // Final Global Percentage (Weighted Average)
        global.percentage = global.grandTotal > 0 ? ((global.above5Min / global.grandTotal) * 100).toFixed(2) : "0.00";

        return { processedData: result, globalTotal: global };
    }, [allData, dateRange]);


    // Pagination
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return processedData.slice(start, start + itemsPerPage);
    }, [processedData, currentPage]);

    const totalPages = Math.ceil(processedData.length / itemsPerPage);

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [dateRange]);


    const handleExport = () => {
        // Export Logic including Grand Total
        const exportList = [...processedData, { ...globalTotal, empId: 'Grand Total', empName: '' }];

        const exportData = exportList.map(row => ({
            "Emp Id": row.empId,
            "Emp Name": row.empName,
            "5-6 minute": row.b5_6,
            "6-7 minute": row.b6_7,
            "7-8 minute": row.b7_8,
            "8-9 minute": row.b8_9,
            "9-10 minute": row.b9_10,
            "Over 10 minutes": row.bOver10,
            "Grand Total": row.grandTotal,
            "Above 5 Minute Decoded": row.above5Min,
            "Percentage": `${row.percentage}%`
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Decoder_Efficiency");
        writeFile(wb, "Decoder_Efficiency_Report.xlsx");
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/supervisor')}
                            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Clock className="text-indigo-600" size={24} />
                                Decoder Efficiency Report
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
                                        disabled={{ after: subDays(new Date(), 1) }}
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
                            <thead className="text-xs text-slate-700 font-bold uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-4 w-24">Emp Id</th>
                                    <th className="px-4 py-4">Emp Name</th>
                                    <th className="px-3 py-4 text-center">5-6 minute</th>
                                    <th className="px-3 py-4 text-center">6-7 minute</th>
                                    <th className="px-3 py-4 text-center">7-8 minute</th>
                                    <th className="px-3 py-4 text-center">8-9 minute</th>
                                    <th className="px-3 py-4 text-center">9-10 minute</th>
                                    <th className="px-3 py-4 text-center">Over 10 minutes</th>
                                    <th className="px-3 py-4 text-center bg-slate-100 text-slate-900">Grand Total</th>
                                    <th className="px-3 py-4 text-center">Above 5 Minute<br />Decoded</th>
                                    <th className="px-3 py-4 text-center">Percentage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {/* Pinned Grand Total Row */}
                                {globalTotal && (
                                    <tr className="bg-indigo-50 font-bold border-b-2 border-indigo-100 text-indigo-900">
                                        <td className="px-4 py-3" colSpan="2">Grand Total</td>
                                        <td className="px-3 py-3 text-center">{globalTotal.b5_6}</td>
                                        <td className="px-3 py-3 text-center">{globalTotal.b6_7}</td>
                                        <td className="px-3 py-3 text-center">{globalTotal.b7_8}</td>
                                        <td className="px-3 py-3 text-center">{globalTotal.b8_9}</td>
                                        <td className="px-3 py-3 text-center">{globalTotal.b9_10}</td>
                                        <td className="px-3 py-3 text-center">{globalTotal.bOver10}</td>
                                        <td className="px-3 py-3 text-center bg-indigo-100">{globalTotal.grandTotal}</td>
                                        <td className="px-3 py-3 text-center">{globalTotal.above5Min}</td>
                                        <td className="px-3 py-3 text-center">{globalTotal.percentage}%</td>
                                    </tr>
                                )}

                                {/* Paginated Data */}
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row) => (
                                        <tr key={row.empId} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-medium">{row.empId}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{row.empName}</td>
                                            <td className="px-3 py-3 text-center text-slate-500">{row.b5_6}</td>
                                            <td className="px-3 py-3 text-center text-slate-500">{row.b6_7}</td>
                                            <td className="px-3 py-3 text-center text-slate-500">{row.b7_8}</td>
                                            <td className="px-3 py-3 text-center text-slate-500">{row.b8_9}</td>
                                            <td className="px-3 py-3 text-center text-slate-500">{row.b9_10}</td>
                                            <td className="px-3 py-3 text-center text-slate-500">{row.bOver10}</td>
                                            <td className="px-3 py-3 text-center font-bold bg-slate-50 text-slate-900">{row.grandTotal}</td>
                                            <td className="px-3 py-3 text-center font-medium text-indigo-600">{row.above5Min}</td>
                                            <td className="px-3 py-3 text-center">{row.percentage}%</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="11" className="px-6 py-12 text-center text-slate-400">
                                            No data available for the selected range.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                        <span>Showing {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} employees</span>
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
        </div>
    );
};

export default DecoderEfficiencyReport;
