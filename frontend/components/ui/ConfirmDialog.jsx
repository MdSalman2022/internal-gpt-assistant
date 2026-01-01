'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Trash2, XCircle } from 'lucide-react';

/**
 * Reusable confirmation dialog component
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {function} props.onOpenChange - Callback when open state changes
 * @param {string} props.title - Dialog title
 * @param {string} props.description - Dialog description
 * @param {string} props.confirmText - Text for confirm button (default: "Confirm")
 * @param {string} props.cancelText - Text for cancel button (default: "Cancel")
 * @param {function} props.onConfirm - Callback when confirmed
 * @param {function} props.onCancel - Optional callback when cancelled
 * @param {string} props.variant - "danger" | "warning" | "default"
 * @param {boolean} props.loading - Show loading state on confirm button
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title = 'Confirm Action',
    description = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'default',
    loading = false,
}) {
    const handleConfirm = () => {
        onConfirm?.();
        onOpenChange?.(false);
    };

    const handleCancel = () => {
        onCancel?.();
        onOpenChange?.(false);
    };

    const getIcon = () => {
        switch (variant) {
            case 'danger':
                return <Trash2 className="w-6 h-6 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
            default:
                return <XCircle className="w-6 h-6 text-muted-foreground" />;
        }
    };

    const getConfirmButtonClass = () => {
        switch (variant) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 text-white';
            case 'warning':
                return 'bg-yellow-600 hover:bg-yellow-700 text-white';
            default:
                return 'bg-primary hover:bg-primary/90 text-primary-foreground';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${variant === 'danger' ? 'bg-red-500/10' :
                                variant === 'warning' ? 'bg-yellow-500/10' : 'bg-muted'
                            }`}>
                            {getIcon()}
                        </div>
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${getConfirmButtonClass()}`}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ConfirmDialog;
