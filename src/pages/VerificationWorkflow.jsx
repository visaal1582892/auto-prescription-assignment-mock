import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Shield, Search, User, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VerificationWorkflow = () => {
    const navigate = useNavigate();

    // Mock Data for Team Prescriptions
    const [inbox, setInbox] = useState(Array.from({ length: 28 }, (_, i) => ({
        id: `RX-99${281 + i}`,
        empName: ['Alice Cooper', 'Bob Martin', 'Charlie Day', 'Diana Prince', 'Evan Wright', 'Fiona Gallagher', 'George Costanza'][i % 7],
        time: `${10 + Math.floor(i / 10)}:${(30 + i) % 60} AM`,
        items: (i % 5) + 1,
        status: 'Pending'
    })));

    const handleSelectPrescription = (rx) => {
        console.log("Navigating to verification for:", rx.id);
        navigate(`/verification/${rx.id}`, { state: { prescription: rx } });
    };

    // --- Pagination Logic ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9; // 3x3 grid

    const totalPages = Math.ceil(inbox.length / itemsPerPage);
    const paginatedInbox = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return inbox.slice(start, start + itemsPerPage);
    }, [inbox, currentPage]);

    // Reset pagination when inbox changes
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [inbox.length, totalPages]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/decoder')} className="text-slate-400 hover:text-slate-600">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Shield className="text-emerald-500" size={24} />
                            Team Verification
                        </h1>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search Prescription ID..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedInbox.map((rx) => (
                        <div
                            key={rx.id}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold font-mono">
                                    {rx.id}
                                </div>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock size={12} /> {rx.time}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <User size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">{rx.empName}</p>
                                    <p className="text-xs text-slate-500">Junior Decoder</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                <div className="text-xs text-slate-500">
                                    <span className="font-bold text-slate-700">{rx.items}</span> items decoded
                                </div>
                                <button
                                    onClick={() => handleSelectPrescription(rx)}
                                    className="text-indigo-600 text-xs font-medium flex items-center group-hover:translate-x-1 transition-transform bg-transparent border-none p-0 cursor-pointer"
                                >
                                    Verify <ArrowRight size={14} className="ml-1" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination Controls */}
                {inbox.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 text-xs text-slate-500 flex justify-between items-center shadow-sm">
                        <span>Showing {paginatedInbox.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, inbox.length)} of {inbox.length} records</span>
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
                )}
            </div>
        </div>
    );
};

export default VerificationWorkflow;
