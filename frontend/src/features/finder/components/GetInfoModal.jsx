import React from 'react';

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function Row({ label, value }) {
    return (
        <div className="flex gap-2 py-1.5 border-b border-gray-100 last:border-none text-[13px]">
            <span className="text-gray-500 w-28 shrink-0 font-medium">{label}</span>
            <span className="text-gray-800 break-all">{value ?? '—'}</span>
        </div>
    );
}

function GetInfoModal({ file, isFolder, onClose }) {
    if (!file && !isFolder) return null;

    // folder-level: show generic folder info
    const isGeneric = !file;

    return (
        <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[20000] flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/60 w-80 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200/60 bg-gray-50/70">
                    <img
                        src={isGeneric ? '/images/folder.png' : (file.icon || (file.type === 'folder' ? '/images/folder.png' : '/images/txt.png'))}
                        className="w-10 h-10 object-contain drop-shadow-sm"
                        alt="icon"
                    />
                    <div>
                        <p className="text-[14px] font-semibold text-gray-800 leading-tight">
                            {isGeneric ? 'Folder Info' : file.name}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                            {isGeneric ? 'Current folder' : (file.type === 'folder' ? 'Folder' : `${file.fileType?.toUpperCase?.() || ''} File`)}
                        </p>
                    </div>
                </div>

                {/* Info rows */}
                <div className="px-5 py-3">
                    {isGeneric ? (
                        <Row label="Kind" value="Folder" />
                    ) : (
                        <>
                            <Row label="Kind" value={file.type === 'folder' ? 'Folder' : `${file.fileType?.toUpperCase?.() || 'File'} Document`} />
                            <Row label="Size" value={file.type === 'folder' ? '—' : formatBytes(file.size || 0)} />
                            <Row label="Created" value={file.createdAt ? new Date(file.createdAt).toLocaleString() : '—'} />
                            <Row label="Modified" value={file.updatedAt ? new Date(file.updatedAt).toLocaleString() : '—'} />
                            {file.tags?.length > 0 && (
                                <Row label="Tags" value={file.tags.join(', ')} />
                            )}
                            {file.content && file.type === 'file' && (
                                <Row label="Content" value={file.content.length > 60 ? file.content.slice(0, 60) + '…' : file.content} />
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 pb-4 pt-1">
                    <button
                        className="w-full py-1.5 text-[13px] font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GetInfoModal;
