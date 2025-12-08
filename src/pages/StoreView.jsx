import React, { useState } from 'react';
import {
    UploadCloud,
    FileText,
    CheckCircle,
    AlertCircle,
    Clock,
    ArrowLeft,
    PenTool,
    RotateCcw,
    Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StoreView = () => {
    const navigate = useNavigate();
    const [uploadState, setUploadState] = useState('idle'); // idle, uploading, processing, complete
    const [showMarkingTool, setShowMarkingTool] = useState(false);
    const [markedAreas, setMarkedAreas] = useState([]);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    const handleUpload = () => {
        setUploadState('uploading');
        setTimeout(() => setUploadState('processing'), 1500);
        setTimeout(() => setUploadState('complete'), 3000);
    };

    const toggleMarking = (e) => {
        if (!showMarkingTool) return;
        // Simulate adding a mark at click position
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMarkedAreas([...markedAreas, { x, y }]);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-600 text-white p-2 rounded-lg">
                        <UploadCloud size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Medplus Store Portal</h1>
                        <p className="text-xs text-slate-500">Store ID: MP-HYD-001 | Banjara Hills</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-slate-700">Avg. Response Time</p>
                        <p className="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1">
                            <Clock size={12} /> &lt; 2 Minutes
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6">

                {/* Confidence Banner */}
                <div className="bg-indigo-600 text-white rounded-xl p-6 mb-8 shadow-lg shadow-indigo-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold mb-1">Quick Decode Guarantee</h2>
                        <p className="text-indigo-100 text-sm opacity-90">
                            Our central team is online. Upload unclear prescriptions and get results in under 2 minutes.
                        </p>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                        <span className="text-2xl font-bold">01:45</span>
                        <span className="text-xs block opacity-75">Current Avg Wait</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Upload / View Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <FileText size={18} className="text-slate-400" />
                                Prescription View
                            </h3>
                            {uploadState === 'complete' && (
                                <button
                                    onClick={() => setShowMarkingTool(!showMarkingTool)}
                                    className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 transition-all ${showMarkingTool ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <PenTool size={12} />
                                    {showMarkingTool ? 'Tap to Mark Areas' : 'Mark Unclear Items'}
                                </button>
                            )}
                        </div>

                        <div className="flex-1 bg-slate-100 relative flex items-center justify-center p-4 overflow-hidden">
                            {uploadState === 'idle' && (
                                <div
                                    onClick={handleUpload}
                                    className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group w-full h-full flex flex-col items-center justify-center"
                                >
                                    <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <UploadCloud size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 mb-2">Click to Upload Prescription</h3>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                        Take a photo or upload a file. We support JPG, PNG, and PDF.
                                    </p>
                                </div>
                            )}

                            {uploadState === 'uploading' && (
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="font-bold text-slate-600">Uploading...</p>
                                </div>
                            )}

                            {uploadState === 'processing' && (
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                        <CheckCircle size={24} />
                                    </div>
                                    <p className="font-bold text-slate-600">Processing Image...</p>
                                </div>
                            )}

                            {uploadState === 'complete' && (
                                <div className="relative w-full h-full bg-white shadow-lg flex items-center justify-center overflow-hidden cursor-crosshair" onClick={toggleMarking}>
                                    <FileText size={120} className="text-slate-200" />
                                    <div className="absolute inset-0 p-8 font-handwriting text-slate-400 opacity-50 pointer-events-none select-none">
                                        <h2 className="text-2xl mb-6 border-b border-slate-200 pb-2">Dr. Smith Clinic</h2>
                                        <ul className="space-y-6 text-xl">
                                            <li>Tab. Dolo 650mg <br /><span className="text-sm">1-0-1 x 5 days</span></li>
                                            <li>Tab. Azithral 500mg <br /><span className="text-sm">1-0-0 x 3 days</span></li>
                                            <li>Tab. Pan 40mg <br /><span className="text-sm">1-0-0 (BBF)</span></li>
                                        </ul>
                                    </div>
                                    {/* Render Marks */}
                                    {markedAreas.map((mark, idx) => (
                                        <div
                                            key={idx}
                                            className="absolute w-12 h-12 border-4 border-amber-500 rounded-full opacity-80 animate-in zoom-in duration-200"
                                            style={{ left: mark.x - 24, top: mark.y - 24 }}
                                        />
                                    ))}
                                    {showMarkingTool && (
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm pointer-events-none">
                                            Tap on the image to circle unclear items
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status / Feedback Section */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Clock size={18} className="text-indigo-600" />
                                Decode Status
                            </h3>

                            {uploadState === 'complete' ? (
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-1">
                                            <CheckCircle size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">Prescription Received</h4>
                                            <p className="text-xs text-slate-500">14:23 PM • ID: RX-99283-AC</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0 mt-1 animate-pulse">
                                            <RotateCcw size={16} className="animate-spin-slow" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-indigo-700">Decoding in Progress</h4>
                                            <p className="text-xs text-slate-500">Assigned to Senior Decoder. Expected in &lt; 1 min.</p>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                                                <div className="bg-indigo-500 h-full rounded-full w-2/3 animate-[shimmer_2s_infinite]"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <p>Upload a prescription to track status</p>
                                </div>
                            )}
                        </div>

                        {uploadState === 'complete' && (
                            <div className="bg-amber-50 rounded-xl border border-amber-100 p-6">
                                <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                                    <AlertCircle size={18} />
                                    Not satisfied with the result?
                                </h3>
                                <p className="text-sm text-amber-700/80 mb-4">
                                    If the decoded prescription is incorrect or incomplete, send it back immediately for priority review.
                                </p>
                                <button
                                    onClick={() => setShowFeedbackModal(true)}
                                    className="w-full bg-white border border-amber-200 text-amber-700 font-bold py-3 rounded-lg hover:bg-amber-100 transition-colors shadow-sm"
                                >
                                    Return to Decoder
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                                <RotateCcw className="text-amber-600" />
                                Return for Review
                            </h3>
                            <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Please specify why you are returning this prescription. It will be routed to a <strong>Green Channel Expert</strong> immediately.
                            </p>

                            <div className="space-y-2">
                                {['Incorrect Medicine Name', 'Wrong Dosage/Frequency', 'Missing Items', 'Typo / Spelling Error'].map((reason) => (
                                    <label key={reason} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input type="radio" name="returnReason" className="text-amber-600 focus:ring-amber-500" />
                                        <span className="text-sm font-medium text-slate-700">{reason}</span>
                                    </label>
                                ))}
                            </div>

                            <textarea
                                placeholder="Describe the error..."
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none h-24 resize-none"
                            />
                        </div>

                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowFeedbackModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowFeedbackModal(false);
                                    alert("Sent back to Green Channel! Priority Review Initiated.");
                                }}
                                className="px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-lg shadow-amber-200 flex items-center gap-2"
                            >
                                <Send size={16} />
                                Send Back
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreView;
