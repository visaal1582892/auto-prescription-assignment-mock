import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Check, Shield, Search, User, Clock, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VerificationWorkflow = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
    const [selectedPrescription, setSelectedPrescription] = useState(null);

    // Mock Data for Team Prescriptions
    const [inbox, setInbox] = useState([
        { id: 'RX-99281', empName: 'Alice Cooper', time: '10:30 AM', items: 3, status: 'Pending' },
        { id: 'RX-99282', empName: 'Bob Martin', time: '10:32 AM', items: 5, status: 'Pending' },
        { id: 'RX-99283', empName: 'Charlie Day', time: '10:35 AM', items: 2, status: 'Pending' },
        { id: 'RX-99284', empName: 'Diana Prince', time: '10:40 AM', items: 4, status: 'Pending' },
        { id: 'RX-99285', empName: 'Evan Wright', time: '10:45 AM', items: 1, status: 'Pending' }
    ]);

    // Detail View State
    const [items, setItems] = useState([
        { id: 1, name: "Dolo 650mg Tablet", quantity: 15, dosage: "1-0-1" },
        { id: 2, name: "Pan 40 Tablet", quantity: 10, dosage: "1-0-0" },
        { id: 3, name: "Azithral 500mg Tablet", quantity: 5, dosage: "1-0-0" },
    ]);
    const [corrections, setCorrections] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newCorrection, setNewCorrection] = useState({ lineNumber: '', correctProduct: '' });

    const handleSelectPrescription = (rx) => {
        setSelectedPrescription(rx);
        setViewMode('detail');
        // Reset corrections for new selection
        setCorrections([]);
    };

    const handleAddCorrection = () => {
        if (!newCorrection.lineNumber || !newCorrection.correctProduct) return;
        setCorrections([...corrections, { ...newCorrection, id: Date.now() }]);
        setNewCorrection({ lineNumber: '', correctProduct: '' });
        setIsAdding(false);
    };

    const handleDeleteCorrection = (id) => {
        setCorrections(corrections.filter(c => c.id !== id));
    };

    const handleSubmitVerification = () => {
        // Remove from inbox
        setInbox(inbox.filter(rx => rx.id !== selectedPrescription.id));
        setViewMode('list');
        setSelectedPrescription(null);
    };

    // --- RENDER: List View ---
    if (viewMode === 'list') {
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

                {/* List Content */}
                <div className="max-w-5xl mx-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {inbox.map((rx) => (
                            <div
                                key={rx.id}
                                onClick={() => handleSelectPrescription(rx)}
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
                                    <div className="text-indigo-600 text-xs font-medium flex items-center group-hover:translate-x-1 transition-transform">
                                        Verify <ArrowRight size={14} className="ml-1" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER: Detail View ---
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setViewMode('list')}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Shield className="text-emerald-500" size={24} />
                            Verifying {selectedPrescription?.id}
                        </h1>
                        <p className="text-xs text-slate-500">Decoded by {selectedPrescription?.empName}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSubmitVerification}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                    >
                        Approve & Submit
                    </button>
                </div>
            </div>

            <div className="flex-1 max-w-6xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Original Decoded Items */}
                <div className="space-y-4">
                    {/* Image Placeholder */}
                    <div className="bg-slate-200 rounded-xl h-48 w-full flex items-center justify-center text-slate-400 border border-slate-300">
                        <div className="text-center">
                            <FileText size={32} className="mx-auto mb-2 opacity-50" />
                            <span className="text-sm font-medium">Prescription Image Preview</span>
                        </div>
                    </div>

                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Decoded Items</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 w-12">#</th>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3 w-20">Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-slate-400 font-mono">{index + 1}</td>
                                        <td className="px-4 py-3 font-medium text-slate-700">{item.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Corrections */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Corrections</h2>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="text-indigo-600 hover:text-indigo-700 text-sm font-bold flex items-center gap-1"
                        >
                            <Plus size={16} />
                            Add Correction
                        </button>
                    </div>

                    <div className="space-y-3">
                        {isAdding && (
                            <div className="bg-white p-4 rounded-xl shadow-md border-2 border-indigo-100 animate-in fade-in slide-in-from-top-2">
                                <h3 className="text-sm font-bold text-slate-800 mb-3">New Correction</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Row Number</label>
                                        <input
                                            type="number"
                                            value={newCorrection.lineNumber}
                                            onChange={(e) => setNewCorrection({ ...newCorrection, lineNumber: e.target.value })}
                                            placeholder="e.g. 3"
                                            className="w-full text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Correct Product Name</label>
                                        <input
                                            type="text"
                                            value={newCorrection.correctProduct}
                                            onChange={(e) => setNewCorrection({ ...newCorrection, correctProduct: e.target.value })}
                                            placeholder="e.g. Dolo 650mg"
                                            className="w-full text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end pt-2">
                                        <button
                                            onClick={() => setIsAdding(false)}
                                            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddCorrection}
                                            className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                                        >
                                            Add Correction
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {corrections.length === 0 && !isAdding && (
                            <div className="text-center py-12 bg-slate-100/50 rounded-xl border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm">No corrections added yet.</p>
                                <p className="text-xs text-slate-400 mt-1">If everything is correct, click Approve & Submit.</p>
                            </div>
                        )}

                        {corrections.map((c) => (
                            <div key={c.id} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex items-start gap-3">
                                <div className="h-8 w-8 bg-red-50 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                                    #{c.lineNumber}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-400 uppercase font-bold mb-0.5">Should be:</p>
                                    <p className="text-slate-800 font-medium">{c.correctProduct}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteCorrection(c.id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationWorkflow;
