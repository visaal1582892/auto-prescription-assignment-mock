import React, { useState } from 'react';
import { Search, Package, Clock, User, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StoreOrderSearch = () => {
    const navigate = useNavigate();
    const [storeId, setStoreId] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [orders, setOrders] = useState([]);

    const handleSearch = (e) => {
        e.preventDefault();
        setHasSearched(true);
        // Mock data generation based on Store ID
        const mockOrders = [
            { id: 'ORD-001', time: '10:30 AM', status: 'In Processing', assignedTo: 'Decoder John' },
            { id: 'ORD-002', time: '10:45 AM', status: 'In Processing', assignedTo: 'Decoder Sarah' },
            { id: 'ORD-003', time: '11:00 AM', status: 'Pending', assignedTo: null },
            { id: 'ORD-004', time: '11:15 AM', status: 'Pending', assignedTo: null },
        ];
        // Sort chronological (newest first as per requirements? "Chronological order, with the newest prescription listed first" -> Reverse Chronological really)
        // Let's assume the times above are representative and we just sort.
        // For the mock, I'll just provide them.
        setOrders(mockOrders);
    };

    const handleClaim = (orderId) => {
        // Mock claim logic
        // Redirect to decoder workflow with intent to start
        navigate('/decoder', { state: { startWorkflow: true, orderId: orderId } });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/decoder')}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-6">Store Order Search</h1>
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={storeId}
                                onChange={(e) => setStoreId(e.target.value)}
                                placeholder="Enter Store ID (e.g., ST-1005)"
                                className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!storeId}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {hasSearched && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-700 mb-4">
                            Orders for {storeId} <span className="text-sm font-normal text-slate-500 ml-2">(Today)</span>
                        </h2>

                        {orders.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
                                No orders found for this Store ID.
                            </div>
                        ) : (
                            orders.map((order) => (
                                <div key={order.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-6">
                                        <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{order.id}</div>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Clock size={14} />
                                                {order.time}
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${order.status === 'In Processing'
                                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            }`}>
                                            {order.status}
                                        </div>
                                    </div>

                                    {order.status === 'In Processing' ? (
                                        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-4 py-2 rounded-lg">
                                            <User size={16} />
                                            <span className="text-sm font-medium">Assigned to: {order.assignedTo}</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleClaim(order.id)}
                                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
                                        >
                                            <CheckCircle size={16} />
                                            Claim & Submit
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreOrderSearch;
