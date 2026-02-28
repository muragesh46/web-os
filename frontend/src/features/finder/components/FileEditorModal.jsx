import React, { useState, useEffect } from 'react';

function FileEditorModal({ file, onSave, onClose }) {
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (file) setContent(file.content || '');
    }, [file]);

    if (!file) return null;

    const handleSave = async () => {
        setSaving(true);
        await onSave(file._id, content);
        setSaving(false);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[20000] flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-white/97 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/60 w-[520px] max-w-[95vw] overflow-hidden flex flex-col"
                style={{ maxHeight: '80vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200/60 bg-gray-50/70 shrink-0">
                    <div className="flex items-center gap-2">
                        <img
                            src={file.icon || '/images/txt.png'}
                            className="w-6 h-6 object-contain"
                            alt="file"
                        />
                        <span className="text-[14px] font-semibold text-gray-800">{file.name}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200"
                    >
                        ×
                    </button>
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-hidden p-4">
                    <textarea
                        className="w-full h-full resize-none text-[13px] text-gray-800 bg-gray-50/50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all font-mono leading-relaxed"
                        style={{ minHeight: '260px' }}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Start typing..."
                        autoFocus
                        spellCheck={false}
                    />
                </div>

                {/* Footer */}
                <div className="flex gap-2 px-5 pb-4 pt-1 shrink-0">
                    <button
                        className="flex-1 py-2 text-[13px] font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        className="flex-1 py-2 text-[13px] font-medium bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-white disabled:opacity-60"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FileEditorModal;
