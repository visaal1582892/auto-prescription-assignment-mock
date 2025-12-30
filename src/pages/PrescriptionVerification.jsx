import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Check, Shield, FileText, RotateCcw, Search, Eye, EyeOff, ZoomIn, ZoomOut } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

// Mock Product Database
const MOCK_PRODUCT_DB = [
    { name: "Dolo 650mg Tablet" },
    { name: "Pan 40 Tablet" },
    { name: "Azithral 500mg Tablet" },
    { name: "Crocian 650mg Tablet" },
    { name: "Augmentin 625 Duo" },
    { name: "Telma 40" },
    { name: "Metrogyl 400" },
    { name: "Allegra 120mg" },
    { name: "Shelcal 500" },
    { name: "Ascoril LS Syrup" },
];

const PrescriptionVerification = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    // Get prescription data from navigation state or fallback
    const selectedPrescription = location.state?.prescription || {
        id: id,
        empName: 'Unknown Decoder',
    };

    // Detail View State
    const [items, setItems] = useState([
        { id: 1, name: "Dolo 650mg Tablet" },
        { id: 2, name: "Pan 40 Tablet" },
        { id: 3, name: "Azithral 500mg Tablet" },
    ]);
    const [verifiedItems, setVerifiedItems] = useState([]);

    // Image Viewer State
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);

    // Add Product / Search State
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedNewProduct, setSelectedNewProduct] = useState(null);

    // Initialize verified items
    useEffect(() => {
        if (selectedPrescription) {
            // Create a deep copy for verification, tracking original ID
            setVerifiedItems(items.map(item => ({
                ...item,
                originalId: item.id,
                status: 'verified' // verified, incorrect, new, deleted
            })));
        }
    }, [selectedPrescription, items]);

    // Handle Search - Updated to show all if empty
    useEffect(() => {
        if (searchQuery.trim().length === 0) {
            // Show all products if query is empty
            setSearchResults(MOCK_PRODUCT_DB);
        } else {
            const results = MOCK_PRODUCT_DB.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchResults(results);
        }
    }, [searchQuery, isAddingProduct]);

    const handleSelectNewProduct = (product) => {
        setSelectedNewProduct(product);
        setSearchQuery(product.name);
        setSearchResults([]); // Hide suggestions
    };

    const handleConfirmAddProduct = () => {
        if (!selectedNewProduct) return;

        const newId = Date.now();
        setVerifiedItems([...verifiedItems, {
            id: newId,
            name: selectedNewProduct.name,
            originalId: null,
            status: 'new'
        }]);

        // Reset
        setIsAddingProduct(false);
        setSearchQuery('');
        setSelectedNewProduct(null);
    };

    const toggleIncorrect = (id) => {
        setVerifiedItems(prev => prev.map(item => {
            if (item.id === id) {
                if (item.status === 'incorrect') {
                    return { ...item, status: 'verified' };
                } else if (item.status === 'verified') {
                    return { ...item, status: 'incorrect' };
                }
                return item;
            }
            return item;
        }));
    };

    const handleDeleteItem = (id) => {
        setVerifiedItems(prev => {
            const item = prev.find(i => i.id === id);

            // If it's a NEW item, we just remove it completely from list
            if (!item.originalId) {
                return prev.filter(i => i.id !== id);
            }
            // For original items, we can mark as deleted or keep as is. 
            return prev.map(i => i.id === id ? { ...item, status: 'deleted' } : i);
        });
    };

    const handleRestoreItem = (id) => {
        setVerifiedItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, status: 'verified' };
            }
            return item;
        }));
    };

    const handleSubmitVerification = () => {
        console.log("Submitting verification for:", selectedPrescription?.id);
        navigate('/verification');
    };

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
            {/* Left Panel: Image Viewer */}
            <div className="w-1/2 flex flex-col border-r border-slate-200 bg-black/5 relative">
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    <button
                        onClick={() => navigate('/verification')}
                        className="bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-sm hover:bg-black/80 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Back to Queue
                    </button>
                    <div className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 backdrop-blur-sm">
                        <Shield size={12} />
                        <span>Secure View: Download Restricted</span>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                    <button
                        onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                        className={`p-2 rounded-lg shadow-lg transition-all ${isPrivacyMode ? 'bg-indigo-600 text-white' : 'bg-white/90 text-slate-700 hover:bg-white'}`}
                        title="Privacy Mode (Blur PII)"
                    >
                        {isPrivacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button className="bg-white/90 p-2 rounded-lg shadow-lg hover:bg-white text-slate-700 transition-all" title="Zoom In">
                        <ZoomIn size={16} />
                    </button>
                    <button className="bg-white/90 p-2 rounded-lg shadow-lg hover:bg-white text-slate-700 transition-all" title="Zoom Out">
                        <ZoomOut size={16} />
                    </button>
                    <button className="bg-white/90 p-2 rounded-lg shadow-lg hover:bg-white text-slate-700 transition-all" title="Reset">
                        <RotateCcw size={16} />
                    </button>
                </div>

                {/* Image Container */}
                <div className="flex-1 bg-slate-800 relative overflow-hidden flex items-center justify-center group">
                    <div className={`relative bg-white shadow-2xl min-w-[400px] min-h-[500px] flex items-center justify-center transition-all duration-300 ${isPrivacyMode ? 'blur-sm' : ''}`}>
                        <FileText size={64} className="text-slate-300" />
                        <p className="absolute bottom-4 text-slate-300 text-sm font-mono">RX-IMAGE-SOURCE</p>

                        {/* Simulated Rx Content */}
                        <div className="absolute inset-0 p-8 font-handwriting text-slate-600 opacity-60 pointer-events-none select-none">
                            <h2 className="text-xl mb-4 border-b border-slate-300 pb-2">Dr. Smith Clinic</h2>
                            <p className="mb-2">Patient: John Doe</p>
                            <p className="mb-4">Age: 45 | Sex: M</p>
                            <ul className="list-disc pl-5 space-y-4 text-lg">
                                <li>Tab. Dolo 650mg <br /><span className="text-sm">1-0-1 x 5 days</span></li>
                                <li>Tab. Azithral 500mg <br /><span className="text-sm">1-0-0 x 3 days</span></li>
                                <li>Tab. Pan 40mg <br /><span className="text-sm">1-0-0 (BBF)</span></li>
                            </ul>
                        </div>

                        {/* Watermark - Repeated User ID (Overlay) */}
                        <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-4 gap-12 opacity-20 select-none overflow-hidden p-8">
                            {Array(12).fill('EMP-VERIFIER-001').map((text, i) => (
                                <div key={i} className="flex items-center justify-center">
                                    <span className="-rotate-45 text-slate-900 font-bold text-sm whitespace-nowrap">
                                        {text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Verification Interface */}
            <div className="w-1/2 flex flex-col bg-white">
                {/* Header */}
                <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white z-10">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Shield className="text-emerald-500" size={20} />
                            Verify Prescription
                        </h2>
                        <p className="text-xs text-slate-500">Decoded by <span className="font-semibold">{selectedPrescription.empName}</span></p>
                    </div>
                    <div className="flex gap-2">
                        <div className="text-right mr-4 border-r border-slate-200 pr-4">
                            <p className="text-xs font-bold text-slate-700">Elapsed Time</p>
                            <p className="text-sm font-mono text-indigo-600">01:45</p>
                        </div>
                        <button
                            onClick={handleSubmitVerification}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                        >
                            <Check size={16} />
                            Approve & Next
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <div className="max-w-3xl mx-auto space-y-6">

                        {/* Items List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Product Verification</h3>
                                {!isAddingProduct && (
                                    <button
                                        onClick={() => setIsAddingProduct(true)}
                                        className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                                    >
                                        <Plus size={16} /> Add Product
                                    </button>
                                )}
                            </div>

                            {/* Add Product Block */}
                            {isAddingProduct && (
                                <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-lg animate-in fade-in slide-in-from-top-2 z-20 relative">
                                    <h4 className="text-xs font-bold text-indigo-800 uppercase mb-3">Add New Product</h4>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onFocus={() => {
                                                    if (searchQuery.trim().length === 0) setSearchResults(MOCK_PRODUCT_DB);
                                                }}
                                                placeholder="Search medicine database..."
                                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                                autoFocus
                                            />
                                            {/* Search Results Dropdown */}
                                            {searchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                                                    {searchResults.map((product, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => handleSelectNewProduct(product)}
                                                            className="p-2 hover:bg-indigo-50 cursor-pointer text-sm border-b last:border-0 border-slate-50 transition-colors"
                                                        >
                                                            <div className="font-bold text-slate-700">{product.name}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {selectedNewProduct && (
                                            <div className="bg-indigo-50 p-2 rounded border border-indigo-100 flex justify-between items-center">
                                                <span className="text-xs font-bold text-indigo-700">Selected: {selectedNewProduct.name}</span>
                                                <button
                                                    onClick={() => setSelectedNewProduct(null)}
                                                    className="text-indigo-400 hover:text-indigo-600 transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setIsAddingProduct(false);
                                                    setSearchQuery('');
                                                    setSelectedNewProduct(null);
                                                }}
                                                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleConfirmAddProduct}
                                                disabled={!selectedNewProduct}
                                                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-200"
                                            >
                                                Add Product
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {verifiedItems.map((item, index) => {
                                // Simplified Item Card
                                return (
                                    <div
                                        key={item.id}
                                        className={`bg-white rounded-xl border transition-all overflow-hidden ${item.status === 'deleted' ? 'border-red-100 bg-red-50/20 opacity-60' :
                                            item.status === 'incorrect' ? 'border-red-500 bg-red-50 shadow-md ring-1 ring-red-100' :
                                                item.status === 'new' ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-100' :
                                                    'border-slate-200 shadow-sm'
                                            }`}
                                    >
                                        <div className="p-4 flex items-center justify-between">
                                            {/* Left: Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">

                                                    {item.status === 'incorrect' && (
                                                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">Incorrect</span>
                                                    )}
                                                    {item.status === 'new' && (
                                                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">New Added</span>
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    <p className={`font-bold text-sm ${item.status === 'incorrect' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                                        {item.name}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex items-center gap-2 ml-4">
                                                {item.status === 'deleted' ? (
                                                    <button
                                                        onClick={() => handleRestoreItem(item.id)}
                                                        className="text-slate-400 hover:text-emerald-600 text-xs font-medium flex items-center gap-1 transition-colors"
                                                    >
                                                        <RotateCcw size={14} /> Restore
                                                    </button>
                                                ) : (
                                                    <>
                                                        {item.originalId && (
                                                            <button
                                                                onClick={() => toggleIncorrect(item.id)}
                                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${item.status === 'incorrect'
                                                                    ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                                    : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300'
                                                                    }`}
                                                            >
                                                                {item.status === 'incorrect' ? 'Revert' : 'Mark Incorrect'}
                                                            </button>
                                                        )}
                                                        {!item.originalId && (
                                                            <button
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                className="text-blue-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionVerification;
