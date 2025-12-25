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
    Clock,
    User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { utils, writeFile } from 'xlsx';
import { DayPicker } from 'react-day-picker';
import { format, subDays, isAfter, startOfDay, endOfDay, isWithinInterval, parseISO, isSameDay } from 'date-fns';
import 'react-day-picker/style.css';

const NewStorePrescriptionsReport = () => {
    const navigate = useNavigate();

    // --- Mock Data Generation ---
    const generateData = () => {
        const data = [];
        const today = new Date();
        const statuses = ['Pending', 'Completed'];
        const states = ['Telangana', 'Andhra Pradesh', 'Karnataka', 'Tamil Nadu'];
        const citiesMap = {
            'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar'],
            'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur'],
            'Karnataka': ['Bangalore', 'Mysore'],
            'Tamil Nadu': ['Chennai', 'Coimbatore']
        };
        const employees = ["EMP-101", "EMP-102", "EMP-103", "EMP-104", "EMP-105"];

        // Generate for past 30 days
        for (let d = 0; d < 30; d++) {
            const date = subDays(today, d);
            const dateStr = format(date, 'yyyy-MM-dd');

            // Generate 15-40 prescriptions per day
            const count = Math.floor(Math.random() * 25) + 15;

            for (let i = 0; i < count; i++) {
                const receivedTime = new Date(date);
                receivedTime.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60)); // 8 AM to 10 PM

                // 70% completed, 30% pending
                const status = Math.random() > 0.3 ? 'Completed' : 'Pending';

                let completedTime = null;
                let decodedBy = '-';

                if (status === 'Completed') {
                    completedTime = new Date(receivedTime);
                    completedTime.setMinutes(receivedTime.getMinutes() + Math.floor(Math.random() * 120) + 5); // 5m to 2h later
                    decodedBy = employees[Math.floor(Math.random() * employees.length)];
                }

                const prescriptionType = Math.random() > 0.5 ? 'Emergency' : 'Save';

                const stateCodes = {
                    'Telangana': 'TG',
                    'Andhra Pradesh': 'AP',
                    'Karnataka': 'KA',
                    'Tamil Nadu': 'TN'
                };

                const cityCodes = {
                    'Hyderabad': 'HYD',
                    'Warangal': 'WAR',
                    'Karimnagar': 'KAR',
                    'Visakhapatnam': 'VIZ',
                    'Vijayawada': 'VIJ',
                    'Guntur': 'GNT',
                    'Bangalore': 'BLR',
                    'Mysore': 'MYS',
                    'Chennai': 'CHN',
                    'Coimbatore': 'CBE'
                };

                const state = states[Math.floor(Math.random() * states.length)];
                const city = citiesMap[state][Math.floor(Math.random() * citiesMap[state].length)];

                // Format: IN + StateCode + CityCode + 4 Digits (e.g., INAPHYD1234)
                const randomNum = Math.floor(Math.random() * 9000) + 1000;
                const storeId = `IN${stateCodes[state]}${cityCodes[city]}${randomNum}`;

                data.push({
                    id: `NSP-${d}-${i}`,
                    prescriptionId: `RX-${20000 + startOfDay(date).getTime() + i}`,
                    prescriptionType: prescriptionType,
                    storeId: storeId,
                    state: state,
                    city: city,
                    status: status,
                    receivedAt: receivedTime.toISOString(),
                    completedAt: completedTime ? completedTime.toISOString() : null,
                    decodedBy: decodedBy
                });
            }
        }
        return data.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
    };

    const [allData] = useState(generateData());

    // Top Calendar Date Range (Filters Received Date)
    const [dateRange, setDateRange] = useState({
        from: subDays(new Date(), 7),
        to: new Date()
    });
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Column Filters
    const [filters, setFilters] = useState({
        prescriptionId: '',
        prescriptionType: 'All', // New Filter
        storeId: '',
        state: 'All',
        city: 'All',
        status: 'All',
        completedDate: '', // YYYY-MM-DD string
        decodedBy: ''
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Derived Lists for Dropdowns
    const uniqueStates = useMemo(() => ['All', ...new Set(allData.map(d => d.state))], [allData]);
    const uniqueCities = useMemo(() => {
        if (filters.state === 'All') return ['All', ...new Set(allData.map(d => d.city))];
        return ['All', ...new Set(allData.filter(d => d.state === filters.state).map(d => d.city))];
    }, [allData, filters.state]);


    // --- Filtering Logic ---
    const filteredData = useMemo(() => {
        if (!dateRange?.from) return [];

        const fromDate = startOfDay(dateRange.from);
        const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(fromDate);

        return allData.filter(row => {
            // 1. Top Level Filter: Received Date
            const receivedDate = parseISO(row.receivedAt);
            if (!isWithinInterval(receivedDate, { start: fromDate, end: toDate })) return false;

            // 2. Column Filters
            // Prescription ID
            if (filters.prescriptionId && !row.prescriptionId.toLowerCase().includes(filters.prescriptionId.toLowerCase())) return false;

            // Prescription Type
            if (filters.prescriptionType !== 'All' && row.prescriptionType !== filters.prescriptionType) return false;

            // Store ID
            if (filters.storeId && !row.storeId.toLowerCase().includes(filters.storeId.toLowerCase())) return false;

            // State
            if (filters.state !== 'All' && row.state !== filters.state) return false;

            // City
            if (filters.city !== 'All' && row.city !== filters.city) return false;

            // Status
            if (filters.status !== 'All' && row.status !== filters.status) return false;

            // Decoded By
            if (filters.decodedBy && !row.decodedBy.toLowerCase().includes(filters.decodedBy.toLowerCase())) return false;

            // Completed Date
            if (filters.completedDate) {
                if (!row.completedAt) return false; // Filter is set but row has no completed date
                const rowCompletedDate = parseISO(row.completedAt);
                const filterDate = parseISO(filters.completedDate); // input type="date" returns YYYY-MM-DD
                if (!isSameDay(rowCompletedDate, filterDate)) return false;
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
    }, [filters, dateRange]);

    // Check if any filters are active
    const hasActiveFilters = useMemo(() => {
        return (
            filters.prescriptionId !== '' ||
            filters.prescriptionType !== 'All' ||
            filters.storeId !== '' ||
            filters.state !== 'All' ||
            filters.city !== 'All' ||
            filters.status !== 'All' ||
            filters.completedDate !== '' ||
            filters.decodedBy !== ''
        );
    }, [filters]);

    const clearFilters = () => {
        setFilters({
            prescriptionId: '',
            prescriptionType: 'All',
            storeId: '',
            state: 'All',
            city: 'All',
            status: 'All',
            completedDate: '',
            decodedBy: ''
        });
    };

    // --- Export Logic ---
    const handleExport = () => {
        const exportData = filteredData.map(row => ({
            "Prescription ID": row.prescriptionId,
            "Prescription Type": row.prescriptionType,
            "Store ID": row.storeId,
            "State": row.state,
            "City": row.city,
            "Status": row.status,
            "Received At": format(parseISO(row.receivedAt), 'dd/MM/yyyy HH:mm'),
            "Completed At": row.completedAt ? format(parseISO(row.completedAt), 'dd/MM/yyyy HH:mm') : '-',
            "Decoded By": row.decodedBy
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "NewStorePrescriptions");
        writeFile(wb, "New_Store_Prescriptions_Report.xlsx");
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
                                New Store Prescriptions Report
                            </h1>
                            <p className="text-xs text-slate-500">
                                Filtering by Received Date:
                                <span className="font-medium ml-1">
                                    {dateRange?.from ? (
                                        <>
                                            {format(dateRange.from, 'MMM dd, yyyy')}
                                            {dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime() && ` - ${format(dateRange.to, 'MMM dd, yyyy')}`}
                                        </>
                                    ) : 'Select Date Range'}
                                </span>
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
                                            if (range?.from) setDateRange(range);
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
                                            table: "w-full border-collapse space-y-1",
                                            head_row: "flex",
                                            head_cell: "text-slate-400 rounded-md w-7 font-normal text-[0.65rem] uppercase",
                                            row: "flex w-full mt-1",
                                            cell: "text-slate-600 rounded-md h-7 w-7 text-[0.7rem] relative p-0",
                                            day: "h-7 w-7 p-0 font-medium hover:bg-indigo-50 rounded-md transition-all",
                                            day_selected: "bg-indigo-600 text-white hover:bg-indigo-600 rounded-md",
                                            day_today: "bg-slate-100 text-slate-900 font-bold",
                                            day_outside: "text-slate-300 opacity-50",
                                            day_disabled: "text-slate-300 opacity-30",
                                            day_range_middle: "!bg-indigo-50 !text-indigo-600 !rounded-none",
                                            day_range_start: "!bg-indigo-600 !text-white !rounded-l-md !rounded-r-none",
                                            day_range_end: "!bg-indigo-600 !text-white !rounded-r-md !rounded-l-none",
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

                        {/* Clear Filters Button */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all"
                            >
                                <XCircle size={16} />
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            </header >

            <main className="max-w-[95%] mx-auto p-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    {/* Prescription ID Filter */}
                                    <th className="px-4 py-4 min-w-[140px]">
                                        <div className="flex flex-col gap-2">
                                            <span>Prescription ID</span>
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal"
                                                    value={filters.prescriptionId}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, prescriptionId: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </th>

                                    {/* Prescription Type Filter */}
                                    <th className="px-4 py-4 min-w-[140px]">
                                        <div className="flex flex-col gap-2">
                                            <span>Prescription Type</span>
                                            <select
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal"
                                                value={filters.prescriptionType}
                                                onChange={(e) => setFilters(prev => ({ ...prev, prescriptionType: e.target.value }))}
                                            >
                                                <option value="All">All</option>
                                                <option value="Emergency">Emergency</option>
                                                <option value="Save">Save</option>
                                            </select>
                                        </div>
                                    </th>

                                    {/* Store ID Filter */}
                                    <th className="px-4 py-4 min-w-[120px]">
                                        <div className="flex flex-col gap-2">
                                            <span>Store ID</span>
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal"
                                                    value={filters.storeId}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, storeId: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </th>

                                    {/* State Filter */}
                                    <th className="px-4 py-4 min-w-[140px]">
                                        <div className="flex flex-col gap-2">
                                            <span>State</span>
                                            <select
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal"
                                                value={filters.state}
                                                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value, city: 'All' }))}
                                            >
                                                {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </th>

                                    {/* City Filter */}
                                    <th className="px-4 py-4 min-w-[140px]">
                                        <div className="flex flex-col gap-2">
                                            <span>City</span>
                                            <select
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal"
                                                value={filters.city}
                                                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                                            >
                                                {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </th>

                                    {/* Status Filter */}
                                    <th className="px-4 py-4 min-w-[110px]">
                                        <div className="flex flex-col gap-2">
                                            <span>Status</span>
                                            <select
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal"
                                                value={filters.status}
                                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                            >
                                                <option value="All">All</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </div>
                                    </th>

                                    {/* Received At (No Column Filter) */}
                                    <th className="px-4 py-4 min-w-[120px]">
                                        <div className="flex flex-col gap-2 h-full justify-start">
                                            <span>Received At</span>
                                            <span className="text-[10px] text-slate-400 font-normal mt-1">(Use Top Filter)</span>
                                        </div>
                                    </th>

                                    {/* Completed At Filter */}
                                    <th className="px-4 py-4 min-w-[140px]">
                                        <div className="flex flex-col gap-2">
                                            <span>Completed At</span>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal text-slate-500"
                                                    value={filters.completedDate}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, completedDate: e.target.value }))}
                                                />
                                                {filters.completedDate && (
                                                    <button
                                                        onClick={() => setFilters(prev => ({ ...prev, completedDate: '' }))}
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                                    >
                                                        <XCircle size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </th>

                                    {/* Decoded By Filter */}
                                    <th className="px-4 py-4 min-w-[140px]">
                                        <div className="flex flex-col gap-2">
                                            <span>Decoded By</span>
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search ID..."
                                                    className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-normal"
                                                    value={filters.decodedBy}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, decodedBy: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row) => (
                                        <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-4 font-mono font-medium text-indigo-600 text-xs">{row.prescriptionId}</td>
                                            <td className="px-4 py-4 text-xs font-medium">
                                                <span className={`px-2 py-0.5 rounded-full border ${row.prescriptionType === 'Emergency'
                                                    ? 'bg-red-50 text-red-600 border-red-100'
                                                    : 'bg-blue-50 text-blue-600 border-blue-100'
                                                    }`}>
                                                    {row.prescriptionType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 font-mono text-xs text-slate-500">{row.storeId}</td>
                                            <td className="px-4 py-4 text-xs">{row.state}</td>
                                            <td className="px-4 py-4 text-xs">{row.city}</td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 w-fit
                                                    ${row.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                                                        'bg-amber-50 text-amber-700'}`}>
                                                    {row.status === 'Completed' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-xs">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">{format(parseISO(row.receivedAt), 'dd MMM yyyy')}</span>
                                                    <span className="text-slate-500 text-[10px]">{format(parseISO(row.receivedAt), 'HH:mm')}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-xs">
                                                {row.completedAt ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900">{format(parseISO(row.completedAt), 'dd MMM yyyy')}</span>
                                                        <span className="text-slate-500 text-[10px]">{format(parseISO(row.completedAt), 'HH:mm')}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 text-[10px] italic">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-xs">
                                                {row.decodedBy !== '-' ? (
                                                    <div className="flex items-center gap-1.5 text-slate-700">
                                                        <User size={12} className="text-slate-400" />
                                                        <span>{row.decodedBy}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                                            <Filter size={48} className="mx-auto mb-4 opacity-20" />
                                            <p>No records found matching your filters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                        <span>Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} - {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records</span>
                        <div className="flex gap-1 items-center">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-2 py-1 text-xs font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 border border-slate-300 rounded bg-white hover:bg-slate-50 mr-2"
                            >
                                Previous
                            </button>

                            {/* Page Numbers */}
                            <div className="flex gap-1">
                                {(() => {
                                    const pages = [];
                                    const maxVisiblePages = 5; // Total buttons to show before using ellipsis (excluding first/last)

                                    if (totalPages <= 7) {
                                        // If few pages, show all
                                        for (let i = 1; i <= totalPages; i++) {
                                            pages.push(i);
                                        }
                                    } else {
                                        // Always show first page
                                        pages.push(1);

                                        if (currentPage > 3) {
                                            pages.push('...');
                                        }

                                        // Calculate start and end of visible range around current page
                                        let start = Math.max(2, currentPage - 1);
                                        let end = Math.min(totalPages - 1, currentPage + 1);

                                        // Adjust if near start
                                        if (currentPage <= 3) {
                                            end = 4;
                                        }

                                        // Adjust if near end
                                        if (currentPage >= totalPages - 2) {
                                            start = totalPages - 3;
                                        }

                                        for (let i = start; i <= end; i++) {
                                            pages.push(i);
                                        }

                                        if (currentPage < totalPages - 2) {
                                            pages.push('...');
                                        }

                                        // Always show last page
                                        pages.push(totalPages);
                                    }

                                    return pages.map((p, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => typeof p === 'number' && setCurrentPage(p)}
                                            disabled={p === '...'}
                                            className={`w-7 h-7 flex items-center justify-center text-xs rounded transition-colors
                                                ${p === currentPage
                                                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                                                    : p === '...'
                                                        ? 'text-slate-400 cursor-default'
                                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                                        >
                                            {p}
                                        </button>
                                    ));
                                })()}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-2 py-1 text-xs font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 border border-slate-300 rounded bg-white hover:bg-slate-50 ml-2"
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

export default NewStorePrescriptionsReport;
