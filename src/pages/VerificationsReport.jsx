import React, { useState, useEffect, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import {
    Calendar as CalendarIcon,
    Download,
    Search,
    X,
    AlertCircle,
    ArrowRight,
    CheckCircle,
    Eye,
    Filter,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import * as xlsx from 'xlsx';

// --- Shared Components ---
const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md",
        secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
        outline: "bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-50",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
        danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
    };
    return (
        <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

// --- Mock Data Generator ---
const NAMES = [
    "Aarav Sharma", "Vihaan Gupta", "Aditya Patel", "Sai Krishna", "Reyansh Reddy",
    "Ishaan Kumar", "Ananya Reddy", "Diya Rao", "Saanvi Nair", "Kiara Singh",
    "Rohan Verma", "Karthik Iyer", "Rahul Menon", "Vikram Malhotra", "Arjun Das"
];

const DRUGS = [
    "Dolo 650mg", "Azithral 500mg", "Pan D", "Shelcal 500", "Montair LC",
    "Telma 40", "Augmentin 625", "Ascoril LS", "Wikoryl", "Allegra 120",
    "Dolo 650mg", "Crocint 650", "Zincovit", "Limcee", "Cheston Cold"
];

const generateVerifications = () => {
    const data = [];
    const today = new Date();

    // Generate for last 30 days
    for (let i = 0; i < 30; i++) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');

        const dailyCount = Math.floor(Math.random() * 30) + 20;

        for (let j = 0; j < dailyCount; j++) {
            // 1. Correct Products
            const numProducts = Math.floor(Math.random() * 4) + 2;
            const correctProducts = [];
            for (let k = 0; k < numProducts; k++) {
                correctProducts.push({
                    name: DRUGS[Math.floor(Math.random() * DRUGS.length)],
                    qty: Math.floor(Math.random() * 10) + 1,
                    dosage: "1-0-1"
                });
            }

            // 2. Decoder Products (add errors)
            const decoderProducts = JSON.parse(JSON.stringify(correctProducts));
            const hasModifications = Math.random() > 0.6;
            let modificationsCount = 0;

            if (hasModifications) {
                const numErrors = Math.floor(Math.random() * 2) + 1;
                for (let e = 0; e < numErrors; e++) {
                    const errorType = Math.random();
                    const targetIdx = Math.floor(Math.random() * decoderProducts.length);

                    if (errorType < 0.33) {
                        decoderProducts[targetIdx].qty += (Math.random() > 0.5 ? 2 : -2);
                        if (decoderProducts[targetIdx].qty < 1) decoderProducts[targetIdx].qty = 1;
                        modificationsCount++;
                    } else if (errorType < 0.66) {
                        decoderProducts[targetIdx].name = DRUGS[Math.floor(Math.random() * DRUGS.length)];
                        modificationsCount++;
                    } else {
                        if (decoderProducts.length > 1) {
                            decoderProducts.splice(targetIdx, 1);
                            modificationsCount++;
                        }
                    }
                }
            }

            data.push({
                id: `VER-${dateStr}-${1000 + j}`,
                rxId: `RX-${dateStr.replace(/-/g, '')}-${1000 + j}`, // New Prescription ID
                verifiedById: `EMP${Math.floor(Math.random() * 1000) + 1000}`,
                verifiedByName: NAMES[Math.floor(Math.random() * NAMES.length)],
                decodedById: `DEC${Math.floor(Math.random() * 1000) + 1000}`,
                decodedByName: NAMES[Math.floor(Math.random() * NAMES.length)],
                verificationTime: `${dateStr} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                productsVerified: correctProducts.length,
                modifications: modificationsCount,
                decoderProducts,
                supervisorProducts: correctProducts,
                prescriptionUrl: "https://placehold.co/600x400/e2e8f0/475569?text=Prescription+Preview"
            });
        }
    }
    return data;
};

// --- Comparison Modal ---
const ComparisonModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-slate-800">Correction Details</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${data.modifications > 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                {data.modifications > 0 ? `${data.modifications} Modifications` : 'Perfect Match'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                            Rx ID: {data.rxId} • Verified on {data.verificationTime}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left: Prescription Image */}
                    <div className="lg:w-1/3 bg-slate-100 border-r border-slate-200 p-4 flex flex-col">
                        <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">
                            <Eye size={16} /> Prescription
                        </h4>
                        <div className="flex-1 bg-white rounded-lg border border-slate-300 shadow-inner flex items-center justify-center overflow-hidden relative group p-2">
                            {/* Placeholder pattern for realistic feel */}
                            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none"></div>
                            <img
                                src={data.prescriptionUrl}
                                alt="Prescription"
                                className="max-w-full max-h-full object-contain shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Right: Comparison Tables */}
                    <div className="lg:w-2/3 p-6 overflow-y-auto bg-slate-50/30">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Decoder Entry */}
                            <div className="flex flex-col space-y-3">
                                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Decoder Entry</p>
                                        <p className="font-bold text-slate-700 text-sm">{data.decodedByName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400">ID: {data.decodedById}</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2">Product Name</th>
                                                <th className="px-4 py-2 w-16 text-center">Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {data.decoderProducts.map((p, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 font-medium text-slate-600">{p.name}</td>
                                                    <td className="px-4 py-3 text-center text-slate-500 font-medium">{p.qty}</td>
                                                </tr>
                                            ))}
                                            {data.decoderProducts.length === 0 && (
                                                <tr><td colSpan="2" className="text-center py-6 text-slate-400 italic">No products entered</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Supervisor Correction */}
                            <div className="flex flex-col space-y-3">
                                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-emerald-100 shadow-sm ring-1 ring-emerald-500/20">
                                    <div>
                                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Supervisor Correction</p>
                                        <p className="font-bold text-slate-700 text-sm">{data.verifiedByName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400">ID: {data.verifiedById}</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden shadow-sm relative">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-emerald-50 text-xs uppercase text-emerald-700 font-bold border-b border-emerald-100">
                                            <tr>
                                                <th className="px-4 py-2">Product Name</th>
                                                <th className="px-4 py-2 w-16 text-center">Qty</th>
                                                <th className="px-4 py-2 w-20 text-center">Info</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-emerald-50/30">
                                            {data.supervisorProducts.map((p, idx) => {
                                                const match = data.decoderProducts.find(dp => dp.name === p.name);
                                                let status = 'MATCH';
                                                if (!match) status = 'ADDED';
                                                else if (match.qty !== p.qty) status = 'QTY_CHANGE';

                                                return (
                                                    <tr key={idx} className={`
                                                        ${status === 'ADDED' ? 'bg-green-50' : ''}
                                                        ${status === 'QTY_CHANGE' ? 'bg-amber-50' : ''}
                                                        hover:bg-slate-50 transition-colors
                                                    `}>
                                                        <td className="px-4 py-3 font-medium text-slate-700">{p.name}</td>
                                                        <td className={`px-4 py-3 text-center font-bold ${status === 'QTY_CHANGE' ? 'text-amber-600' : 'text-slate-600'}`}>{p.qty}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            {status === 'MATCH' && <CheckCircle size={14} className="text-slate-200 inline" />}
                                                            {status === 'ADDED' && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold border border-green-200">NEW</span>}
                                                            {status === 'QTY_CHANGE' && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200">QTY</span>}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const VerificationsReport = () => {
    const navigate = useNavigate();

    // State
    const [allData, setAllData] = useState(() => generateVerifications());
    const [dateRange, setDateRange] = useState({
        from: subDays(new Date(), 6),
        to: new Date()
    });
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedVerification, setSelectedVerification] = useState(null);

    // Column Filters
    const [filters, setFilters] = useState({
        rxId: '',
        verifiedById: '',
        verifiedByName: '',
        decodedById: '',
        decodedByName: ''
    });

    const handleFilterChange = (key, val) => {
        setFilters(prev => ({ ...prev, [key]: val }));
    };

    // --- Real-time updates for Today ---
    useEffect(() => {
        const interval = setInterval(() => {
            setAllData(prev => {
                const updated = [...prev];
                if (Math.random() > 0.7) {
                    const now = new Date();
                    const dateStr = format(now, 'yyyy-MM-dd');
                    const timeStr = format(now, 'yyyy-MM-dd HH:mm');

                    const numProducts = Math.floor(Math.random() * 4) + 2;
                    const correctProducts = [];
                    for (let k = 0; k < numProducts; k++) {
                        correctProducts.push({
                            name: DRUGS[Math.floor(Math.random() * DRUGS.length)],
                            qty: Math.floor(Math.random() * 10) + 1,
                            dosage: "1-0-1"
                        });
                    }

                    const decoderProducts = JSON.parse(JSON.stringify(correctProducts));
                    const hasModifications = Math.random() > 0.6;
                    let modificationsCount = 0;

                    if (hasModifications) {
                        const numErrors = Math.floor(Math.random() * 2) + 1;
                        for (let e = 0; e < numErrors; e++) {
                            const errorType = Math.random();
                            const targetIdx = Math.floor(Math.random() * decoderProducts.length);

                            if (errorType < 0.33) {
                                decoderProducts[targetIdx].qty += (Math.random() > 0.5 ? 2 : -2);
                                if (decoderProducts[targetIdx].qty < 1) decoderProducts[targetIdx].qty = 1;
                                modificationsCount++;
                            } else if (errorType < 0.66) {
                                decoderProducts[targetIdx].name = DRUGS[Math.floor(Math.random() * DRUGS.length)];
                                modificationsCount++;
                            } else {
                                if (decoderProducts.length > 1) {
                                    decoderProducts.splice(targetIdx, 1);
                                    modificationsCount++;
                                }
                            }
                        }
                    }

                    const newRecord = {
                        id: `VER-${dateStr}-${1000 + Math.floor(Math.random() * 9000)}`,
                        rxId: `RX-${dateStr.replace(/-/g, '')}-${1000 + Math.floor(Math.random() * 9000)}`,
                        verifiedById: `EMP${Math.floor(Math.random() * 1000) + 1000}`,
                        verifiedByName: NAMES[Math.floor(Math.random() * NAMES.length)],
                        decodedById: `DEC${Math.floor(Math.random() * 1000) + 1000}`,
                        decodedByName: NAMES[Math.floor(Math.random() * NAMES.length)],
                        verificationTime: timeStr,
                        productsVerified: correctProducts.length,
                        modifications: modificationsCount,
                        decoderProducts,
                        supervisorProducts: correctProducts,
                        prescriptionUrl: "https://placehold.co/600x400/e2e8f0/475569?text=Prescription+Preview"
                    };
                    updated.unshift(newRecord);
                }
                return updated;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Filter Logic
    const filteredData = useMemo(() => {
        if (!dateRange?.from) return [];
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(from);

        return allData.filter(item => {
            const itemDate = parseISO(item.verificationTime.split(' ')[0]);
            const matchesDate = isWithinInterval(itemDate, { start: from, end: to });

            const matchesFilters =
                item.rxId.toLowerCase().includes(filters.rxId.toLowerCase()) &&
                item.verifiedById.toLowerCase().includes(filters.verifiedById.toLowerCase()) &&
                item.verifiedByName.toLowerCase().includes(filters.verifiedByName.toLowerCase()) &&
                item.decodedById.toLowerCase().includes(filters.decodedById.toLowerCase()) &&
                item.decodedByName.toLowerCase().includes(filters.decodedByName.toLowerCase());

            return matchesDate && matchesFilters;
        }).sort((a, b) => new Date(b.verificationTime) - new Date(a.verificationTime));
    }, [allData, dateRange, filters]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Export
    const handleExport = () => {
        const exportData = filteredData.map(row => ({
            "Rx ID": row.rxId,
            "Verification ID": row.id,
            "Verified By (ID)": row.verifiedById,
            "Verified By (Name)": row.verifiedByName,
            "Decoded By (ID)": row.decodedById,
            "Decoded By (Name)": row.decodedByName,
            "Date & Time": row.verificationTime,
            "Products Verified": row.productsVerified,
            "Modifications": row.modifications,
            "Status": row.modifications === 0 ? "Perfect" : "Corrected"
        }));
        const ws = xlsx.utils.json_to_sheet(exportData);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Verifications");
        xlsx.writeFile(wb, "Verifications_Report.xlsx");
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            {/* Sticky Header - Matching Performance Report */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-16 flex items-center justify-between">
                        {/* Title & Back */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/supervisor')}
                                className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                    <CheckCircle className="text-indigo-600" size={20} />
                                    Verifications Report
                                </h1>
                            </div>
                        </div>

                        {/* Actions: Date Picker & Export */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 font-medium hover:bg-slate-50 hover:border-indigo-300 transition-all focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <CalendarIcon size={16} className="text-slate-500" />
                                    {dateRange?.from ? (
                                        <>
                                            {format(dateRange.from, 'MMM dd')}
                                            {dateRange.to && ` - ${format(dateRange.to, 'MMM dd')}`}
                                        </>
                                    ) : 'Select Dates'}
                                </button>
                                {isCalendarOpen && (
                                    <div className="absolute top-full right-0 mt-2 p-3 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                                        <DayPicker
                                            mode="range"
                                            selected={dateRange}
                                            onSelect={(range) => {
                                                if (range?.from) setDateRange(range);
                                            }}
                                            styles={{
                                                head_cell: { width: '40px' },
                                                cell: { width: '40px' },
                                                day: { width: '40px' }
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="h-6 w-px bg-slate-300" />

                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
                            >
                                <Download size={16} />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1800px] mx-auto p-6 w-full animate-in fade-in duration-500">
                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-center text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    {/* Rx ID Column */}
                                    <th className="px-4 py-4 min-w-[140px]">
                                        <div className="flex flex-col gap-2">
                                            <span className="font-bold text-slate-500">Prescription ID</span>
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search Rx ID..."
                                                    value={filters.rxId}
                                                    onChange={(e) => handleFilterChange('rxId', e.target.value)}
                                                    className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </th>

                                    {/* Verified By ID */}
                                    <th className="px-4 py-4 min-w-[130px]">
                                        <div className="flex flex-col gap-2">
                                            <span className="font-bold text-slate-500">Verified By (ID)</span>
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Filter ID..."
                                                    value={filters.verifiedById}
                                                    onChange={(e) => handleFilterChange('verifiedById', e.target.value)}
                                                    className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </th>

                                    {/* Verified By Name */}
                                    <th className="px-4 py-4 min-w-[160px]">
                                        <div className="flex flex-col gap-2">
                                            <span className="font-bold text-slate-500">Verified By (Name)</span>
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Filter Name..."
                                                    value={filters.verifiedByName}
                                                    onChange={(e) => handleFilterChange('verifiedByName', e.target.value)}
                                                    className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </th>

                                    {/* Decoded By ID */}
                                    <th className="px-4 py-4 min-w-[130px]">
                                        <div className="flex flex-col gap-2">
                                            <span className="font-bold text-slate-500">Decoded By (ID)</span>
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Filter ID..."
                                                    value={filters.decodedById}
                                                    onChange={(e) => handleFilterChange('decodedById', e.target.value)}
                                                    className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </th>

                                    {/* Decoded By Name */}
                                    <th className="px-4 py-4 min-w-[160px]">
                                        <div className="flex flex-col gap-2">
                                            <span className="font-bold text-slate-500">Decoded By (Name)</span>
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Filter Name..."
                                                    value={filters.decodedByName}
                                                    onChange={(e) => handleFilterChange('decodedByName', e.target.value)}
                                                    className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </th>

                                    <th className="px-4 py-4 font-bold text-slate-500 align-top pt-4">Date & Time</th>
                                    <th className="px-4 py-4 font-bold text-slate-500 align-top pt-4">Products</th>
                                    <th className="px-4 py-4 font-bold text-slate-500 align-top pt-4">Modifications</th>
                                    <th className="px-4 py-4 font-bold text-slate-500 align-top pt-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row) => (
                                        <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors group">
                                            <td className="px-4 py-3 font-medium text-indigo-600 text-xs">{row.rxId}</td>
                                            <td className="px-4 py-3 font-medium text-slate-600">{row.verifiedById}</td>
                                            <td className="px-4 py-3 text-slate-800 font-semibold">{row.verifiedByName}</td>
                                            <td className="px-4 py-3 text-slate-500">{row.decodedById}</td>
                                            <td className="px-4 py-3 text-slate-700">{row.decodedByName}</td>
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{row.verificationTime}</td>
                                            <td className="px-4 py-3 font-bold text-slate-700">{row.productsVerified}</td>
                                            <td className="px-4 py-3">
                                                {row.modifications > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                                        {row.modifications} Modified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        Perfect
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => setSelectedVerification(row)}
                                                    className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${row.modifications > 0
                                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                                            : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {row.modifications > 0 ? 'View Correction' : 'View Details'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-12 text-center text-slate-400">
                                            No verifications found for the selected range.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
                        </span>
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold transition-all ${currentPage === p
                                                ? 'bg-indigo-600 text-white shadow-md'
                                                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Modal */}
                <ComparisonModal
                    isOpen={!!selectedVerification}
                    onClose={() => setSelectedVerification(null)}
                    data={selectedVerification}
                />
            </main>
        </div>
    );
};

export default VerificationsReport;
