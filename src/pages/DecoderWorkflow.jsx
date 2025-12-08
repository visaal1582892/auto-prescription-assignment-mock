import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    AlertCircle,
    Coffee,
    Send,
    ArrowRight,
    RotateCcw,
    Shield,
    FileText,
    User,
    Clock,
    XCircle,
    ZoomIn,
    ZoomOut,
    Maximize,
    LogOut,
    Eye,
    EyeOff,
    Activity,
    Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DecoderWorkflow = () => {
    const navigate = useNavigate();
    const [isSeniorDecoder, setIsSeniorDecoder] = useState(true); // Toggle for demo
    const [showReportModal, setShowReportModal] = useState(false);
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);
    const [isGreenChannel, setIsGreenChannel] = useState(false);
    const [showInactivityModal, setShowInactivityModal] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());

    const [lineItems, setLineItems] = useState([
        { id: 1, name: "Dolo 650mg Tablet", quantity: 10, dosage: "1-0-1", confidence: "High" },
        { id: 2, name: "Azithral 500mg Tablet", quantity: 3, dosage: "1-0-0", confidence: "Medium" },
        { id: 3, name: "Pan 40 Tablet", quantity: 10, dosage: "1-0-0", confidence: "High" },
    ]);

    // Inactivity Tracker
    useEffect(() => {
        const checkInactivity = setInterval(() => {
            if (Date.now() - lastActivity > 10000) { // 10 seconds for demo (representing 5 mins)
                setShowInactivityModal(true);
            }
        }, 1000);

        const resetActivity = () => setLastActivity(Date.now());
        window.addEventListener('mousemove', resetActivity);
        window.addEventListener('keydown', resetActivity);

        return () => {
            clearInterval(checkInactivity);
            window.removeEventListener('mousemove', resetActivity);
            window.removeEventListener('keydown', resetActivity);
        };
    }, [lastActivity]);

    const handleSubmit = () => {
        // Logic for immediate next assignment
        alert("Submission Successful! Loading next assignment...");
        setLastActivity(Date.now());
    };

    const handleSubmitAndBreak = () => {
        // Logic for submit and break
        navigate('/break');
    };

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
            {/* Left Panel: Prescription Viewer */}
            <div className="w-1/2 flex flex-col border-r border-slate-200 bg-black/5 relative">
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    <div className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 backdrop-blur-sm">
                        <Shield size={12} />
                        <span>Secure View: Download Restricted</span>
                    </div>
                    {isSeniorDecoder && (
                        <button
                            onClick={() => setIsGreenChannel(!isGreenChannel)}
                            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-sm transition-all ${isGreenChannel ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-200 text-slate-500'}`}
                        >
                            <Activity size={12} />
                            {isGreenChannel ? 'Green Channel Active' : 'Standard Channel'}
                        </button>
                    )}
                </div>

                {/* Prescription Image with Zoom/Pan */}
                <div className="flex-1 bg-slate-800 relative overflow-hidden group">
                    {/* Watermark */}
                    <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.03] select-none overflow-hidden">
                        <div className="text-9xl font-black text-white -rotate-45 whitespace-nowrap">
                            CONFIDENTIAL • MEDPLUS • CONFIDENTIAL • MEDPLUS
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
                    <div className="w-full h-full flex items-center justify-center overflow-auto cursor-move">
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
                        </div>
                    </div>
                </div>

                {/* Issue Reporting - Bottom Left */}
                <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-slate-500">
                            ID: <span className="font-mono font-bold text-slate-700">RX-99283-AC</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                            <Lock size={10} />
                            SESSION MONITORED
                        </div>
                    </div>
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <AlertCircle size={16} />
                        Report Issue / Release
                    </button>
                </div>
            </div>

            {/* Right Panel: Data Entry & AI */}
            <div className="w-1/2 flex flex-col bg-white">
                {/* Header */}
                <div className={`h-16 border-b flex items-center justify-between px-6 shadow-sm z-10 transition-colors ${isGreenChannel ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${isGreenChannel ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            <RotateCcw size={12} className="animate-spin-slow" />
                            {isGreenChannel ? 'Priority Assignment' : 'Auto-Assigned'}
                        </div>
                        <div className="h-4 w-px bg-slate-300 mx-1" />
                        <div className="flex items-center gap-4 text-slate-500 text-xs">
                            <div className="flex items-center gap-1">
                                <span className="font-medium">Created:</span>
                                <span className="font-mono">14:20</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-medium">Arrived:</span>
                                <span className="font-mono">14:22</span>
                                <span className="text-red-500 font-bold ml-1">(+2m Lag)</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => navigate('/')}
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">
                                JD
                            </div>
                            <div className="text-xs">
                                <p className="font-medium text-slate-900">John Doe</p>
                                <p className="text-slate-500">Decoder L2</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* AI Analysis Panel */}
                    <div className="mb-6 bg-indigo-50/50 rounded-xl border border-indigo-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                AI Analysis
                            </h3>
                            <span className="text-xs text-indigo-600 font-medium bg-indigo-100 px-2 py-0.5 rounded">
                                Confidence: 92%
                            </span>
                        </div>
                        <p className="text-sm text-indigo-800/80 leading-relaxed mb-3">
                            "Patient requires Dolo 650 for fever and Azithral for infection. Pan 40 for acidity."
                        </p>

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-indigo-900/70 uppercase tracking-wider">Probable Line Items</h4>
                            {lineItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-indigo-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                                    <div className={`w-1 h-8 rounded-full ${item.confidence === 'High' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-slate-800">{item.name}</span>
                                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{item.quantity} units</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 flex gap-2">
                                            <span>Dosage: {item.dosage}</span>
                                            {item.confidence === 'High' && <span className="text-emerald-600 flex items-center gap-0.5"><CheckCircle size={10} /> Verified</span>}
                                        </div>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 text-indigo-600 bg-indigo-50 p-1.5 rounded hover:bg-indigo-100 transition-all">
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Manual Entry Form */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h3 className="text-sm font-bold text-slate-900">Transcription Entry</h3>
                            <button className="text-xs text-indigo-600 font-medium hover:underline">+ Add Line Item</button>
                        </div>

                        <div className="space-y-3">
                            {/* Form Header */}
                            <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 px-2">
                                <div className="col-span-1">#</div>
                                <div className="col-span-5">Product Name</div>
                                <div className="col-span-2">Qty</div>
                                <div className="col-span-3">Frequency</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Rows */}
                            {[1, 2, 3].map((row) => (
                                <div key={row} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                                    <div className="col-span-1 text-center font-mono text-slate-400 text-sm">{row}</div>
                                    <div className="col-span-5">
                                        <input
                                            type="text"
                                            placeholder="Search product..."
                                            className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-center"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <select className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500">
                                            <option>1-0-1</option>
                                            <option>1-0-0</option>
                                            <option>0-0-1</option>
                                            <option>SOS</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <button className="text-slate-400 hover:text-red-500 transition-colors">
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-3">
                        {isSeniorDecoder && (
                            <button className="mr-auto text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                                Transfer / Reassign
                            </button>
                        )}

                        <button
                            onClick={handleSubmitAndBreak}
                            className="flex-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <Coffee size={18} />
                            Submit & Take Break
                        </button>

                        <button
                            onClick={handleSubmit}
                            className="flex-[2] bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
                        >
                            <Send size={18} />
                            Submit & Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Issue Modal */}
            {showReportModal && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                                <AlertCircle className="text-red-600" />
                                Report Issue
                            </h3>
                            <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Please select the reason for reporting this prescription. This will release the assignment back to the queue.
                            </p>

                            <div className="space-y-2">
                                {['Image not visible / blurry', 'Incorrect Auto-Assignment', 'Technical Glitch', 'Other'].map((reason) => (
                                    <label key={reason} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input type="radio" name="reportReason" className="text-red-600 focus:ring-red-500" />
                                        <span className="text-sm font-medium text-slate-700">{reason}</span>
                                    </label>
                                ))}
                            </div>

                            <textarea
                                placeholder="Additional comments (optional)..."
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none h-24 resize-none"
                            />
                        </div>

                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const newReport = {
                                        id: Date.now(),
                                        type: 'reported',
                                        message: `Issue Reported: RX-99283-AC - ${document.querySelector('input[name="reportReason"]:checked')?.nextSibling?.textContent || 'General Issue'}`,
                                        severity: 'high',
                                        timestamp: new Date().toISOString()
                                    };

                                    const existingReports = JSON.parse(localStorage.getItem('medplus_reports') || '[]');
                                    localStorage.setItem('medplus_reports', JSON.stringify([newReport, ...existingReports]));

                                    setShowReportModal(false);
                                    alert("Issue Reported. Assignment Released.");
                                    window.dispatchEvent(new Event('storage'));
                                }}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-200"
                            >
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Inactivity Modal */}
            {showInactivityModal && (
                <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden text-center p-8">
                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <Clock size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Are you still working?</h2>
                        <p className="text-slate-500 mb-8">
                            We haven't detected any activity for a while. To prevent reassignment, please confirm you are still here.
                        </p>
                        <button
                            onClick={() => {
                                setShowInactivityModal(false);
                                setLastActivity(Date.now());
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                        >
                            I'm still here
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DecoderWorkflow;
