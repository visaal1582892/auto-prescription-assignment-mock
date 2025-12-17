import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MapPin,
    Download,
    Search,
    Building,
    FileText,
    Filter
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';

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
        LOCATIONS.forEach(loc => {
            for (let i = 1; i <= loc.stores; i++) {
                // Generate Store ID: IN + StateCode + CityCode + 5 digit number
                // e.g., INTGHYD00608. We'll simulate random IDs for realism but keep them cleaner
                const numSuffix = (10000 + Math.floor(Math.random() * 90000)).toString().substring(1); // 4 digits
                const storeId = `IN${loc.code}0${numSuffix}`; // Total length roughly matches request

                data.push({
                    id: storeId,
                    storeId: storeId,
                    state: loc.state,
                    city: loc.city,
                    rxCount: Math.floor(Math.random() * 300) + 50 // Random prescriptions yesterday
                });
            }
        });
        return data;
    };

    const [allData] = useState(generateStoreData());

    // --- Filters State ---
    const [filters, setFilters] = useState({
        state: "All",
        city: "All",
        search: ""
    });

    const uniqueStates = ["All", ...new Set(allData.map(d => d.state))];
    const uniqueCities = ["All", ...new Set(allData.filter(d => filters.state === "All" || d.state === filters.state).map(d => d.city))];

    // --- Filter Logic ---
    const filteredData = useMemo(() => {
        return allData.filter(row => {
            const matchesState = filters.state === "All" || row.state === filters.state;
            const matchesCity = filters.city === "All" || row.city === filters.city;
            const matchesSearch = row.storeId.toLowerCase().includes(filters.search.toLowerCase()) ||
                row.city.toLowerCase().includes(filters.search.toLowerCase());

            return matchesState && matchesCity && matchesSearch;
        });
    }, [allData, filters]);

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

    const handleExport = () => {
        const exportData = filteredData.map(row => ({
            "Store ID": row.storeId,
            "State": row.state,
            "City": row.city,
            "Prescriptions Received": row.rxCount
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Location_Wise_Report");
        writeFile(wb, "Location_Wise_Report.xlsx");
    };

    // Calculate Totals
    const totalStores = filteredData.length;
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
                            <p className="text-xs text-slate-500">Store-level performance for Yesterday</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
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
                            <p className="text-sm font-bold text-slate-500 uppercase">Stores Displayed</p>
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
                                    <th className="px-6 py-4">Store ID</th>
                                    <th className="px-6 py-4">State</th>
                                    <th className="px-6 py-4">City</th>
                                    <th className="px-6 py-4 text-right">Prescriptions Received</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row) => (
                                        <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-800">{row.storeId}</td>
                                            <td className="px-6 py-4 font-medium text-slate-600">{row.state}</td>
                                            <td className="px-6 py-4 font-medium text-slate-600">{row.city}</td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-indigo-600">{row.rxCount.toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                                            <p>No stores found matching filters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                                <tr>
                                    <td className="px-6 py-4 text-slate-800">Total ({totalStores} Stores)</td>
                                    <td className="px-6 py-4"></td>
                                    <td className="px-6 py-4"></td>
                                    <td className="px-6 py-4 text-right text-indigo-700">{totalRx.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    {/* Pagination Controls */}
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
            </main>
        </div>
    );
};

export default LocationReport;
