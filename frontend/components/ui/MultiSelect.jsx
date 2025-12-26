import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Check, ChevronDown, Plus } from 'lucide-react';

export default function MultiSelect({
    options = [],
    selected = [],
    onChange,
    placeholder = 'Select options...',
    label = '',
    allowCreate = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        return options.filter(opt =>
            opt.toLowerCase().includes(query.toLowerCase()) &&
            !selected.includes(opt)
        );
    }, [options, query, selected]);

    const handleSelect = (option) => {
        onChange([...selected, option]);
        setQuery('');
        // Keep open for multiple selections
    };

    const handleRemove = (option, e) => {
        e.stopPropagation();
        onChange(selected.filter(item => item !== option));
    };

    const handleCreate = () => {
        if (query.trim() && !selected.includes(query.trim())) {
            handleSelect(query.trim());
        }
    };

    return (
        <div className="space-y-1" ref={containerRef}>
            {label && <label className="text-xs text-slate-400">{label}</label>}

            <div className="relative">
                <div
                    className={`min-h-[38px] bg-slate-950 border rounded-lg flex flex-wrap gap-1.5 p-1.5 cursor-text transition-all
                        ${isOpen ? 'border-primary-500 ring-1 ring-primary-500/20' : 'border-slate-700 hover:border-slate-600'}`}
                    onClick={() => {
                        setIsOpen(true);
                        // Focus logic could go here
                    }}
                >
                    {selected.map(item => (
                        <span key={item} className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded-md border border-slate-700 animate-in zoom-in-95 duration-200">
                            {item}
                            <button
                                onClick={(e) => handleRemove(item, e)}
                                className="hover:text-red-400 rounded-full focus:outline-none"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}

                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setIsOpen(true);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && query) {
                                e.preventDefault();
                                if (filteredOptions.length > 0) handleSelect(filteredOptions[0]);
                                else if (allowCreate) handleCreate();
                            }
                            if (e.key === 'Backspace' && !query && selected.length > 0) {
                                handleRemove(selected[selected.length - 1], { stopPropagation: () => { } });
                            }
                        }}
                        placeholder={selected.length === 0 ? placeholder : ''}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 min-w-[120px] placeholder:text-slate-600"
                    />

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto w-full animate-in slide-in-from-top-1 duration-200">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <div
                                    key={option}
                                    onClick={() => handleSelect(option)}
                                    className="px-3 py-2 hover:bg-slate-800 cursor-pointer text-sm text-slate-300 flex items-center justify-between group transition-colors"
                                >
                                    <span>{option}</span>
                                    <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary-400" />
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-sm text-slate-500 text-center">
                                {query ? (allowCreate ? (
                                    <button onClick={handleCreate} className="flex items-center gap-2 text-primary-400 hover:text-primary-300 mx-auto w-full justify-center py-1">
                                        <Plus className="w-3 h-3" /> Create "{query}"
                                    </button>
                                ) : 'No matches found') : 'Type to search...'}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
