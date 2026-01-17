'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    MoreHorizontal,
    Building2,
    Users,
    ExternalLink,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchOrganizations();
    }, [page, statusFilter]);

    const fetchOrganizations = async () => {
        setLoading(true);
        try {
            let url = `${API_URL}/api/superadmin/organizations?page=${page}&limit=10`;
            if (statusFilter !== 'all') {
                url += `&status=${statusFilter}`;
            }

            const res = await fetch(url, { credentials: 'include' });
            const data = await res.json();

            setOrganizations(data.organizations || []);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch (error) {
            console.error('Error fetching organizations:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Organizations</h1>
                    <p className="text-gray-500 mt-1">Manage all organizations on the platform</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#12121a] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 bg-[#12121a] border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="trialing">Trialing</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="past_due">Past Due</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#12121a] border border-gray-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left py-4 px-5 text-gray-500 font-medium text-sm">Organization</th>
                                <th className="text-left py-4 px-5 text-gray-500 font-medium text-sm">Plan</th>
                                <th className="text-left py-4 px-5 text-gray-500 font-medium text-sm">Status</th>
                                <th className="text-left py-4 px-5 text-gray-500 font-medium text-sm">Members</th>
                                <th className="text-left py-4 px-5 text-gray-500 font-medium text-sm">Created</th>
                                <th className="text-right py-4 px-5 text-gray-500 font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center">
                                        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredOrgs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-500">
                                        No organizations found
                                    </td>
                                </tr>
                            ) : (
                                filteredOrgs.map((org) => (
                                    <tr key={org._id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center text-violet-400 font-semibold">
                                                    {org.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{org.name}</p>
                                                    <p className="text-gray-500 text-sm">{org.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className="text-white capitalize">{org.plan}</span>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${org.planStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    org.planStatus === 'trialing' ? 'bg-cyan-500/20 text-cyan-400' :
                                                        org.planStatus === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                                            'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {org.planStatus}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-1 text-gray-300">
                                                <Users className="w-4 h-4 text-gray-500" />
                                                {org.memberCount || 0}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 text-gray-400">
                                            {formatDate(org.createdAt)}
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            <button className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-gray-800">
                        <p className="text-gray-500 text-sm">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
