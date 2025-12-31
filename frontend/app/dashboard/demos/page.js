'use client';

import { useState, useEffect } from 'react';
import {
    Calendar,
    Building2,
    Mail,
    Phone,
    CheckCircle,
    XCircle,
    Clock,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Search
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DemosPage() {
    const [demos, setDemos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedDemo, setSelectedDemo] = useState(null);

    useEffect(() => {
        fetchDemos();
    }, [page, statusFilter]);

    const fetchDemos = async () => {
        setLoading(true);
        try {
            let url = `${API_URL}/api/superadmin/demo-requests?page=${page}&limit=10`;
            if (statusFilter !== 'all') {
                url += `&status=${statusFilter}`;
            }

            const res = await fetch(url, { credentials: 'include' });
            const data = await res.json();

            setDemos(data.requests || []);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch (error) {
            console.error('Error fetching demos:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await fetch(`${API_URL}/api/superadmin/demo-requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status }),
            });
            fetchDemos();
            setSelectedDemo(null);
        } catch (error) {
            console.error('Error updating demo:', error);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const statusColors = {
        pending: 'bg-amber-500/20 text-amber-400',
        contacted: 'bg-cyan-500/20 text-cyan-400',
        scheduled: 'bg-violet-500/20 text-violet-400',
        completed: 'bg-emerald-500/20 text-emerald-400',
        cancelled: 'bg-red-500/20 text-red-400',
    };

    const priorityColors = {
        high: 'bg-red-500/20 text-red-400',
        medium: 'bg-amber-500/20 text-amber-400',
        low: 'bg-gray-500/20 text-gray-400',
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Demo Requests</h1>
                <p className="text-gray-500 mt-1">Manage incoming demo and sales inquiries</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 bg-[#12121a] border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Demos Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full py-12 text-center">
                        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
                    </div>
                ) : demos.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        No demo requests found
                    </div>
                ) : (
                    demos.map((demo) => (
                        <div
                            key={demo._id}
                            className="bg-[#12121a] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors cursor-pointer"
                            onClick={() => setSelectedDemo(demo)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 font-semibold">
                                        {demo.companyName?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">{demo.companyName}</p>
                                        <p className="text-gray-500 text-sm">{demo.contactName}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[demo.priority]}`}>
                                    {demo.priority}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Mail className="w-4 h-4" />
                                    {demo.email}
                                </div>
                                {demo.phone && (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <Phone className="w-4 h-4" />
                                        {demo.phone}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Building2 className="w-4 h-4" />
                                    {demo.companySize} employees
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[demo.status]}`}>
                                    {demo.status}
                                </span>
                                <span className="text-gray-500 text-xs">
                                    {formatDate(demo.createdAt)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-gray-400">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Demo Detail Modal */}
            {selectedDemo && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDemo(null)}>
                    <div className="bg-[#12121a] border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-800">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">{selectedDemo.companyName}</h2>
                                <button onClick={() => setSelectedDemo(null)} className="text-gray-400 hover:text-white">
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-gray-500 mt-1">{selectedDemo.contactName} • {selectedDemo.jobTitle || 'N/A'}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-gray-500 text-sm">Email</label>
                                <p className="text-white">{selectedDemo.email}</p>
                            </div>
                            {selectedDemo.phone && (
                                <div>
                                    <label className="text-gray-500 text-sm">Phone</label>
                                    <p className="text-white">{selectedDemo.phone}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-gray-500 text-sm">Company Size</label>
                                <p className="text-white">{selectedDemo.companySize} employees</p>
                            </div>
                            <div>
                                <label className="text-gray-500 text-sm">Interested In</label>
                                <p className="text-white capitalize">{selectedDemo.interestedIn?.replace('_', ' ')}</p>
                            </div>
                            {selectedDemo.useCase && (
                                <div>
                                    <label className="text-gray-500 text-sm">Use Case</label>
                                    <p className="text-white">{selectedDemo.useCase}</p>
                                </div>
                            )}
                            {selectedDemo.message && (
                                <div>
                                    <label className="text-gray-500 text-sm">Message</label>
                                    <p className="text-white">{selectedDemo.message}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-800 flex flex-wrap gap-2">
                            <button
                                onClick={() => updateStatus(selectedDemo._id, 'contacted')}
                                className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
                            >
                                <Mail className="w-4 h-4" />
                                Mark Contacted
                            </button>
                            <button
                                onClick={() => updateStatus(selectedDemo._id, 'scheduled')}
                                className="px-4 py-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4" />
                                Mark Scheduled
                            </button>
                            <button
                                onClick={() => updateStatus(selectedDemo._id, 'completed')}
                                className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
