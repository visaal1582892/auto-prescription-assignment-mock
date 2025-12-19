import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    FileText,
    Calendar,
    ChevronDown,
    XCircle,
    Download,
    DollarSign
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { DayPicker } from 'react-day-picker';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import 'react-day-picker/style.css';

const PrescriptionSaleReport = () => {
    const navigate = useNavigate();

    // --- Mock Data Generation ---
    const generateData = () => {
        const data = [];
        const today = new Date();

        // Generate for past 30 days (ending yesterday)
        for (let d = 1; d <= 30; d++) {
            const date = subDays(today, d);
            const dateStr = format(date, 'yyyy-MM-dd');

            // Generate random number of prescriptions per day
            const dailyCount = Math.floor(Math.random() * 2000) + 800;

            for (let i = 0; i < dailyCount; i++) {
                // Simulate time taken in minutes (weighted towards shorter times)
                const rand = Math.random();
                let timeTaken;
                if (rand < 0.2) timeTaken = Math.random() * 1; // 0-1 min
                else if (rand < 0.45) timeTaken = 1 + Math.random() * 1; // 1-2 min
                else if (rand < 0.65) timeTaken = 2 + Math.random() * 1; // 2-3 min
                else if (rand < 0.8) timeTaken = 3 + Math.random() * 2; // 3-5 min
                else if (rand < 0.9) timeTaken = 5 + Math.random() * 3; // 5-8 min
                else timeTaken = 8 + Math.random() * 7; // 8-15 min

                // Simulate Conversion (High conversion for low time, lower for high time)
                // Probability drops as time increases
                const conversionProb = Math.max(0.1, 0.6 - (timeTaken * 0.03));
                const isConverted = Math.random() < conversionProb;

                const saleValue = isConverted ? Math.floor(Math.random() * 2000) + 100 : 0;

                data.push({
                    id: `${dateStr}-${i}`,
                    date: dateStr,
                    timeTaken: timeTaken,
                    isConverted: isConverted,
                    saleValue: saleValue
                });
            }
        }
        return data;
    };

    const [allData] = useState(generateData());

    // --- State ---
    // Default to Yesterday
    const [dateRange, setDateRange] = useState({
        from: subDays(new Date(), 1),
        to: subDays(new Date(), 1)
    });
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // --- Aggregation Logic ---
    const aggregatedData = useMemo(() => {
        // 1. Filter by Date Range
        if (!dateRange?.from) return [];

        const fromDate = startOfDay(dateRange.from);
        const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(fromDate);

        const filtered = allData.filter(row => {
            const rowDate = parseISO(row.date);
            return isWithinInterval(rowDate, { start: fromDate, end: toDate });
        });

        // 2. Buckets Definition
        const buckets = [
            { label: "0. Within 1 minute", min: 0, max: 1 },
            { label: "1-2 minute", min: 1, max: 2 },
            { label: "2-3 minute", min: 2, max: 3 },
            { label: "3-4 minute", min: 3, max: 4 },
            { label: "4-5 minute", min: 4, max: 5 },
            { label: "5-6 minute", min: 5, max: 6 },
            { label: "6-7 minute", min: 6, max: 7 },
            { label: "7-8 minute", min: 7, max: 8 },
            { label: "8-9 minute", min: 8, max: 9 },
            { label: "9-10 minute", min: 9, max: 10 },
            { label: "Over 10 minutes", min: 10, max: 9999 }
        ];

        // 3. Initialize Bucket Stats
        const stats = buckets.map(b => ({
            ...b,
            totalPresCount: 0,
            saleConvertedCount: 0,
            saleValue: 0
        }));

        // 4. Fill Stats
        filtered.forEach(row => {
            const bucketIndex = buckets.findIndex(b => row.timeTaken >= b.min && row.timeTaken < b.max);
            if (bucketIndex !== -1) {
                stats[bucketIndex].totalPresCount++;
                if (row.isConverted) {
                    stats[bucketIndex].saleConvertedCount++;
                    stats[bucketIndex].saleValue += row.saleValue;
                }
            }
        });

        // 5. Add Grand Total Row
        const totalRow = stats.reduce((acc, curr) => ({
            label: "Grand Total",
            totalPresCount: acc.totalPresCount + curr.totalPresCount,
            saleConvertedCount: acc.saleConvertedCount + curr.saleConvertedCount,
            saleValue: acc.saleValue + curr.saleValue,
            isTotal: true
        }), { label: "Grand Total", totalPresCount: 0, saleConvertedCount: 0, saleValue: 0, isTotal: true });

        return [...stats, totalRow];
    }, [allData, dateRange]);


    const handleExport = () => {
        const exportData = aggregatedData.map(row => ({
            "Remarks": row.label,
            "Total Pres Count": row.totalPresCount,
            "Sale Converted Prescription Count": row.saleConvertedCount,
            "Pres Order Conversion %": row.totalPresCount > 0 ? `${Math.round((row.saleConvertedCount / row.totalPresCount) * 100)}%` : "0%",
            "Sale Value From Pres": row.saleValue
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Prescription_Sale_Report");
        writeFile(wb, "Prescription_Sale_Report.xlsx");
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
                                <DollarSign className="text-indigo-600" size={24} />
                                Prescription Sale Report
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
                                        // Disable today and future dates
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
                                    <th className="px-6 py-4 border-r border-slate-200">Remarks</th>
                                    <th className="px-6 py-4 text-center border-r border-slate-200">Total Pres Count</th>
                                    <th className="px-6 py-4 text-center border-r border-slate-200">Sale Converted<br />Prescription Count</th>
                                    <th className="px-6 py-4 text-center border-r border-slate-200">Pres Order<br />Conversion %</th>
                                    <th className="px-6 py-4 text-right">Sale Value<br />From Pres</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {aggregatedData.map((row, idx) => {
                                    const conversionRate = row.totalPresCount > 0
                                        ? Math.round((row.saleConvertedCount / row.totalPresCount) * 100)
                                        : 0;

                                    return (
                                        <tr
                                            key={idx}
                                            className={`${row.isTotal ? 'bg-slate-100 font-bold text-slate-900' : 'bg-white hover:bg-slate-50'} transition-colors`}
                                        >
                                            <td className="px-6 py-4 border-r border-slate-100">{row.label}</td>
                                            <td className="px-6 py-4 text-center border-r border-slate-100">{row.totalPresCount}</td>
                                            <td className="px-6 py-4 text-center border-r border-slate-100">{row.saleConvertedCount}</td>
                                            <td className="px-6 py-4 text-center border-r border-slate-100">{conversionRate}%</td>
                                            <td className="px-6 py-4 text-right font-mono">{row.saleValue.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PrescriptionSaleReport;
