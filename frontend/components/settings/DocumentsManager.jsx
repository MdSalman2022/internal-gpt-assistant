"use client"
import MultiSelect from '../ui/MultiSelect';
import AccessControlSettings from './AccessControlSettings';
import { documentsApi, usersApi } from '@/lib/api';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
    Upload, FileText, Search, Trash2, CheckCircle, Clock, AlertCircle, X, File,
    ExternalLink, Grid3X3, List, Lock, Building, Users, Globe, Edit2, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DocumentsManager() {
    // ... items omitted ... (at line 16)
    const { user, hasPermission, isAdmin } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    useEffect(() => {
        if (user) loadDocuments();
    }, [user, statusFilter]);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const data = await documentsApi.getDocuments(1, statusFilter || null);
            setDocuments(data.documents || []);
        } catch (error) {
            console.error('Failed to load documents:', error);
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (files, aclSettings) => {
        setUploading(true);
        try {
            for (const file of files) {
                await documentsApi.uploadDocument(file, aclSettings);
            }
            setShowUploadModal(false);
            loadDocuments();
            toast.success('Documents uploaded successfully');
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateDocument = async (docId, updates) => {
        try {
            await documentsApi.updateDocument(docId, updates);
            loadDocuments();
            toast.success('Document updated successfully');
            setSelectedDocument(prev => ({ ...prev, ...updates }));
            return true;
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update document');
            return false;
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();

        if (!isAdmin) {
            toast.error('Only administrators can delete documents.');
            return;
        }

        if (!confirm('Delete this document?')) return;
        try {
            await documentsApi.deleteDocument(id);
            setDocuments(prev => prev.filter(d => d._id !== id));
            if (selectedDocument?._id === id) setSelectedDocument(null);
            toast.success('Document deleted');
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete document');
        }
    };

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const statusBadge = (status) => {
        const styles = {
            completed: 'bg-primary-500/10 text-primary-400',
            processing: 'bg-amber-500/10 text-amber-400',
            failed: 'bg-red-500/10 text-red-400',
            pending: 'bg-slate-500/10 text-slate-400',
        };
        const icons = {
            completed: <CheckCircle className="w-3 h-3" />,
            processing: <Clock className="w-3 h-3 animate-pulse" />,
            failed: <AlertCircle className="w-3 h-3" />,
            pending: <Clock className="w-3 h-3" />,
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${styles[status] || styles.pending}`}>
                {icons[status] || icons.pending}
                {status}
            </span>
        );
    };

    const getAccessIcon = (doc) => {
        if (doc.isGlobal && doc.accessLevel === 'public') return <Globe className="w-3 h-3 text-green-400" />;
        if (doc.accessLevel === 'department') return <Building className="w-3 h-3 text-blue-400" />;
        if (doc.allowedTeams?.length > 0) return <Users className="w-3 h-3 text-amber-400" />;
        return <Lock className="w-3 h-3 text-slate-400" />; // Private
    };

    const getAccessLabel = (doc) => {
        if (doc.isGlobal && doc.accessLevel === 'public') return 'Public';
        if (doc.accessLevel === 'department') return 'Department';
        if (doc.allowedTeams?.length > 0) return 'Restricted';
        return 'Private';
    };

    return (
        <div className="flex flex-col h-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <div className="w-full md:w-auto">
                    <h2 className="text-lg font-medium text-foreground">Documents</h2>
                    <p className="text-muted-foreground text-sm">{documents.length} files in knowledge base.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-secondary/50 border border-border/50 rounded-lg pl-9 pr-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-secondary/50 border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="processing">Processing</option>
                        <option value="failed">Failed</option>
                    </select>
                    <button onClick={() => setShowUploadModal(true)} className="btn-primary py-1.5 text-sm">
                        <Upload className="w-4 h-4" />
                        Upload
                    </button>
                </div>
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-xl">
                        <FileText className="w-10 h-10 text-muted-foreground opacity-20 mx-auto mb-3" />
                        <p className="text-muted-foreground">No documents found.</p>
                    </div>
                ) : (
                    <div className="bg-card/50 border border-border/50 rounded-xl overflow-hidden">
                        <div className="divide-y divide-border/50">
                            {filteredDocs.map(doc => (
                                <div
                                    key={doc._id}
                                    onClick={() => setSelectedDocument(doc)}
                                    className="flex items-center gap-4 p-4 hover:bg-secondary/50 cursor-pointer transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                                        <File className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-foreground truncate text-sm">{doc.title}</h3>
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-secondary rounded text-[10px] text-muted-foreground border border-border" title={`Access: ${getAccessLabel(doc)}`}>
                                                {getAccessIcon(doc)}
                                                <span>{getAccessLabel(doc)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span>{(doc.size / 1024).toFixed(1)} KB</span>
                                            <span>•</span>
                                            <span>{doc.chunkCount || 0} chunks</span>
                                            <span>•</span>
                                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    {statusBadge(doc.status)}
                                    <button
                                        onClick={(e) => handleDelete(e, doc._id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all"
                                        title="Delete Document"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <UploadModal
                    onClose={() => setShowUploadModal(false)}
                    onUpload={handleUpload}
                    uploading={uploading}
                    isAdmin={isAdmin}
                />
            )}

            {/* Document Preview Modal */}
            {selectedDocument && (
                <DocumentPreviewModal
                    document={selectedDocument}
                    onClose={() => setSelectedDocument(null)}
                    onUpdate={(id, updates) => handleUpdateDocument(id, updates)}
                />
            )}

        </div>
    );
}

function DocumentPreviewModal({ document, onClose, onUpdate }) {
    const { isAdmin, user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);

    // ACL State for editing
    const [accessLevel, setAccessLevel] = useState(document.accessLevel || 'private');
    const [selectedDepartments, setSelectedDepartments] = useState(document.allowedDepartments || []);
    const [selectedTeams, setSelectedTeams] = useState(document.allowedTeams || []);
    const [selectedUsers, setSelectedUsers] = useState(document.allowedUserEmails || []);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const handleEsc = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Can edit if Admin or Owner (simple check)
    const canEdit = isAdmin || (user && document.uploadedBy?._id === user.id) || (user && document.uploadedBy === user.id); // Handles populated or unpopulated

    const handleSave = async () => {
        setSaving(true);
        const updates = {
            accessLevel,
            allowedDepartments: accessLevel === 'department' ? selectedDepartments : [],
            allowedTeams: accessLevel === 'team' ? selectedTeams : [],
            allowedUserEmails: accessLevel === 'users' ? selectedUsers : []
        };

        const success = await onUpdate(document._id, updates);
        if (success) {
            setIsEditing(false);
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-scale-in flex flex-col" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground text-lg">{document.title}</h3>
                            <p className="text-sm text-muted-foreground">{document.originalName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canEdit && !isEditing && (
                            <button onClick={() => setIsEditing(true)} className="btn-secondary text-xs">
                                <Edit2 className="w-3 h-3 mr-1" /> Edit
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-secondary/30 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-1">Metadata</p>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground flex justify-between"><span>Size:</span> <span className="text-foreground font-medium">{(document.size / 1024).toFixed(1)} KB</span></p>
                                <p className="text-sm text-muted-foreground flex justify-between"><span>Type:</span> <span className="text-foreground font-medium capitalize">{document.mimeType?.split('/')[1] || 'Unknown'}</span></p>
                                <p className="text-sm text-muted-foreground flex justify-between"><span>Chunks:</span> <span className="text-foreground font-medium">{document.chunkCount || 0}</span></p>
                                <p className="text-sm text-muted-foreground flex justify-between"><span>Uploaded:</span> <span className="text-foreground font-medium">{new Date(document.createdAt).toLocaleDateString()}</span></p>
                            </div>
                        </div>
                        <div className="p-4 bg-secondary/30 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-1">Uploaded By</p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                    {(document.uploadedBy?.name || 'U').charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm text-foreground font-medium">{document.uploadedBy?.name || 'Unknown User'}</p>
                                    <p className="text-xs text-muted-foreground">{document.uploadedBy?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border my-4" />

                    {/* Permissions Section */}
                    {isEditing ? (
                        <div className="bg-secondary/20 p-4 rounded-xl border border-border/50">
                            <AccessControlSettings
                                accessLevel={accessLevel}
                                setAccessLevel={setAccessLevel}
                                selectedDepartments={selectedDepartments}
                                setSelectedDepartments={setSelectedDepartments}
                                selectedTeams={selectedTeams}
                                setSelectedTeams={setSelectedTeams}
                                selectedUsers={selectedUsers}
                                setSelectedUsers={setSelectedUsers}
                            />
                            <div className="mt-4 flex justify-end gap-2">
                                <button onClick={() => setIsEditing(false)} className="btn-secondary text-xs">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="btn-primary text-xs">
                                    {saving ? <Clock className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-primary" />
                                Permissions
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                <div className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-muted-foreground flex items-center gap-2">
                                    {document.accessLevel === 'public' ? <Globe className="w-3 h-3 text-primary" /> :
                                        document.accessLevel === 'department' ? <Building className="w-3 h-3 text-primary" /> :
                                            document.accessLevel === 'team' ? <Users className="w-3 h-3 text-primary" /> :
                                                <Lock className="w-3 h-3 text-muted-foreground opacity-50" />}
                                    <span className="capitalize">{document.accessLevel}</span>
                                </div>

                                {document.accessLevel === 'department' && document.allowedDepartments?.map(dept => (
                                    <span key={dept} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
                                        {dept}
                                    </span>
                                ))}

                                {document.accessLevel === 'team' && document.allowedTeams?.map(team => (
                                    <span key={team} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
                                        {team}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-5 border-t border-border bg-secondary/50">
                    <button onClick={onClose} className="btn-secondary">Close</button>
                    {document.source?.url && (
                        <a
                            href={documentsApi.getDownloadUrl(document._id)}
                            className="btn-primary"
                        >
                            <FileText className="w-4 h-4" />Download Original
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

function UploadModal({ onClose, onUpload, uploading, isAdmin }) {
    const [dragOver, setDragOver] = useState(false);
    const [files, setFiles] = useState([]);

    // ACL State (using AccessControlSettings)
    const [accessLevel, setAccessLevel] = useState('private');
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    useEffect(() => {
        const handleEsc = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }, []);

    const submitUpload = () => {
        const aclSettings = {
            accessLevel: accessLevel === 'public' ? 'public' :
                accessLevel === 'department' ? 'department' :
                    accessLevel === 'users' ? 'users' : 'private',

            allowedDepartments: accessLevel === 'department' && selectedDepartments.length > 0 ? selectedDepartments : [],
            allowedTeams: accessLevel === 'team' && selectedTeams.length > 0 ? selectedTeams : [],
            allowedUserEmails: accessLevel === 'users' && selectedUsers.length > 0 ? selectedUsers : []
        };

        onUpload(files, aclSettings);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 animate-scale-in flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">Upload Documents</h2>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
                </div>

                <div className="p-4 overflow-y-auto">
                    {/* Drag Drop Zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragOver ? 'border-primary bg-primary/10' : 'border-border'}`}
                    >
                        <Upload className="w-8 h-8 text-muted-foreground opacity-50 mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm mb-2">Drag and drop files here</p>
                        <label className="btn-secondary text-xs cursor-pointer inline-flex">
                            Browse Files
                            <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.md,.csv" onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files)])} className="hidden" />
                        </label>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-4 space-y-2 mb-4">
                            {files.map((file, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg text-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <File className="w-4 h-4 text-primary flex-shrink-0" />
                                        <span className="text-foreground truncate">{file.name}</span>
                                    </div>
                                    <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    )}

                    {isAdmin && (
                        <>
                            <div className="h-px bg-border my-4" />
                            <AccessControlSettings
                                accessLevel={accessLevel}
                                setAccessLevel={setAccessLevel}
                                selectedDepartments={selectedDepartments}
                                setSelectedDepartments={setSelectedDepartments}
                                selectedTeams={selectedTeams}
                                setSelectedTeams={setSelectedTeams}
                                selectedUsers={selectedUsers}
                                setSelectedUsers={setSelectedUsers}
                            />
                        </>
                    )}

                </div>

                <div className="flex justify-end gap-3 p-4 border-t border-border bg-secondary/50 rounded-b-2xl">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={submitUpload} disabled={files.length === 0 || uploading} className="btn-primary">
                        {uploading ? 'Uploading...' : 'Upload Files'}
                    </button>
                </div>
            </div>
        </div>
    );
}
