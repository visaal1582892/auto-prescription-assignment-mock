import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MapPin,
    Download,
    Search,
    Building,
    FileText,
    Filter,
    ChevronDown,
    Calendar,
    XCircle
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { DayPicker } from 'react-day-picker';
import { format, subDays, isAfter, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import 'react-day-picker/style.css';

const LocationReport = () => {
    const navigate = useNavigate();

    // --- Mock Data Generation --
    // We will generate multiple stores for each city to show the "Store Level" detail
    const LOCATIONS = [
        { state: "Telangana", city: "Hyderabad", code: "TGHYD", stores: 12 },
        { state: "Telangana", city: "Warangal", code: "TGWAR", stores: 5 },
        { state: "Andhra Pradesh", city: "Vijayawada", code: "APVJA", stores: 8 },
        { state: "Andhra Pradesh", city: "Visakhapatnam", code: "APVIZ", stores: 7 },
        { state: "Karnataka", city: "Bangalore", code: "KABLR", stores: 15 },
        { state: "Karnataka", city: "Mysore", code: "KAMYS", stores: 4 },
        { state: "Tamil Nadu", city: "Chennai", code: "TNCHN", stores: 10 },
        { state: "Maharashtra", city: "Mumbai", code: "MHMUM", stores: 14 },
    ];

    const generateStoreData = () => {
        const data = [];
        const today = new Date();

        // Generate daily data for past 30 days (excluding today maybe, but lets generate up to today and filter later, 
        // OR just generate up to yesterday as requested implicitly by "only data until yesterday")

        // Actually, let's generate past 30 days ending YESTERDAY
        for (let d = 1; d <= 30; d++) {
            const date = subDays(today, d);
            const dateStr = format(date, 'yyyy-MM-dd');

            LOCATIONS.forEach(loc => {
                for (let i = 1; i <= loc.stores; i++) {
                    const numSuffix = (10000 + i).toString().substring(1);
                    const storeId = `IN${loc.code}0${numSuffix}`; // Consistent ID per store across days

                    data.push({
                        id: `${dateStr}-${storeId}`,
                        date: dateStr,
                        storeId: storeId,
                        state: loc.state,
                        city: loc.city,
                        rxCount: Math.floor(Math.random() * 300) + 50
                    });
                }
            });
        }
        return data;
    };

    const [allData] = useState(generateStoreData());

    // Default to Yesterday
    const [dateRange, setDateRange] = useState({
        from: subDays(new Date(), 1),
        to: subDays(new Date(), 1)
    });
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // --- Filters State ---
    const [filters, setFilters] = useState({
        state: "All",
        city: "All",
        search: ""
    });

    // Helper: Get unique states from actual data
    const uniqueStates = ["All", ...new Set(allData.map(d => d.state))];
    const uniqueCities = ["All", ...new Set(allData.filter(d => filters.state === "All" || d.state === filters.state).map(d => d.city))];

    // --- Filter Logic ---
    const filteredData = useMemo(() => {
        // Validation: If no range, return empty 
        if (!dateRange?.from) return [];

        const fromDate = startOfDay(dateRange.from);
        const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(fromDate);

        return allData.filter(row => {
            // Date Filter
            const rowDate = parseISO(row.date);
            if (!isWithinInterval(rowDate, { start: fromDate, end: toDate })) return false;

            const matchesState = filters.state === "All" || row.state === filters.state;
            const matchesCity = filters.city === "All" || row.city === filters.city;
            const matchesSearch = row.storeId.toLowerCase().includes(filters.search.toLowerCase()) ||
                row.city.toLowerCase().includes(filters.search.toLowerCase());

            return matchesState && matchesCity && matchesSearch;
        });
    }, [allData, filters, dateRange]);

    // --- Grouping Logic ---
    const groupedData = useMemo(() => {
        const groups = {};
        filteredData.forEach(row => {
            const key = `${row.state}-${row.city}`;
            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    state: row.state,
                    city: row.city,
                    uniqueStores: new Set(),
                    rxCount: 0
                };
            }
            groups[key].uniqueStores.add(row.storeId);
            groups[key].rxCount += row.rxCount;
        });

        return Object.values(groups).map(group => ({
            ...group,
            storeCount: group.uniqueStores.size
        }));
    }, [filteredData]);

    // --- Pagination Logic ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(groupedData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return groupedData.slice(start, start + itemsPerPage);
    }, [groupedData, currentPage]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const handleExport = () => {
        const exportData = groupedData.map(row => ({
            "State": row.state,
            "City": row.city,
            "Total Stores": row.storeCount,
            "Total Prescriptions": row.rxCount
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Location_Wise_Report");
        writeFile(wb, "Location_Wise_Report.xlsx");
    };

    // Calculate Totals
    const totalStores = new Set(filteredData.map(d => d.storeId)).size;
    const totalRx = filteredData.reduce((sum, row) => sum + row.rxCount, 0);

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
                                <MapPin className="text-indigo-600" size={24} />
                                Location Wise Report
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

                    <div className="flex flex-wrap items-center gap-3">
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
                                        // Disable today and future dates (start disabling from Today)
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

                        {/* State Filter */}
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                            <Filter size={14} className="text-slate-400" />
                            <select
                                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
                                value={filters.state}
                                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value, city: "All" }))} // Reset city on state change
                            >
                                {uniqueStates.map(state => (
                                    <option key={state} value={state}>{state === "All" ? "All States" : state}</option>
                                ))}
                            </select>
                        </div>

                        {/* City Filter */}
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                            <MapPin size={14} className="text-slate-400" />
                            <select
                                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
                                value={filters.city}
                                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                            >
                                {uniqueCities.map(city => (
                                    <option key={city} value={city}>{city === "All" ? "All Cities" : city}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Store ID..."
                                className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 w-48"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
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

            <main className="max-w-7xl mx-auto p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase">Total Stores</p>
                            <p className="text-2xl font-bold text-slate-900">{totalStores.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Building size={24} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase">Total Prescriptions</p>
                            <p className="text-2xl font-bold text-slate-900">{totalRx.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <FileText size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">State</th>
                                    <th className="px-6 py-4">City</th>
                                    <th className="px-6 py-4 text-right">Total Stores</th>
                                    <th className="px-6 py-4 text-right">Total Prescriptions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row) => (
                                        <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-800">{row.state}</td>
                                            <td className="px-6 py-4 font-medium text-slate-600">{row.city}</td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-600">{row.storeCount}</td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-indigo-600">{row.rxCount.toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                                            <p>No locations found matching filters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                        </table>
                    </div>
                    {/* Pagination Controls */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                        <span>Showing {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, groupedData.length)} of {groupedData.length} records</span>
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

export default LocationReport;
