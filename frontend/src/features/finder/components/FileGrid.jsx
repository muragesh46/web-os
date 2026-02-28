import React, { useState, useRef, useEffect } from 'react';
import useFinderStore from '@store/finder';
import { useShallow } from 'zustand/react/shallow';
import usewindowstore from '@store/window';

// Format bytes helper
function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function FileGrid({ onFileContextMenu }) {
    const { files, isLoading, viewMode, sortBy, navigateTo, searchQuery, moveItem } = useFinderStore(useShallow(state => ({
        files: state.files,
        isLoading: state.isLoading,
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        navigateTo: state.navigateTo,
        searchQuery: state.searchQuery,
        moveItem: state.moveItem
    })));

    const { openwindow } = usewindowstore();
    const [selectedId, setSelectedId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);

    // Filtering and Sorting logic
    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const sortedFiles = [...filteredFiles].sort((a, b) => {
        // Folders always first unless sorting strictly? MacOS keeps folders together usually.
        if (a.type !== b.type && sortBy === 'kind') {
            return a.type === 'folder' ? -1 : 1;
        }

        switch (sortBy) {
            case 'name': return a.name.localeCompare(b.name);
            case 'date': return new Date(b.updatedAt) - new Date(a.updatedAt);
            case 'size': return (b.size || 0) - (a.size || 0);
            case 'kind': return a.fileType.localeCompare(b.fileType);
            default: return 0;
        }
    });

    const handleDoubleClick = (file) => {
        if (file.type === 'folder') navigateTo(file._id);
        else {
            // Open file based on type
            if (file.fileType === 'pdf') return openwindow("resume"); // currently hardcoded resume pdf
            if (file.fileType === 'url' && file.content) return globalThis.window.open(file.content, "_blank");
            if (file.fileType === 'txt') return openwindow("txtfile", file);
            if (file.fileType === 'img') return openwindow("imgfile", file);
            // fallback
            openwindow(`${file.fileType}${file.type}`, file);
        }
    };

    // Drag and Drop Handlers
    const handleDragStart = (e, file) => {
        e.dataTransfer.setData("application/json", JSON.stringify({ id: file._id, type: file.type }));
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, file) => {
        if (file.type === 'folder') {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dragOverId !== file._id) setDragOverId(file._id);
        }
    };

    const handleDragLeave = () => setDragOverId(null);

    const handleDrop = (e, targetFolder) => {
        e.preventDefault();
        setDragOverId(null);
        if (targetFolder.type !== 'folder') return;

        try {
            const data = JSON.parse(e.dataTransfer.getData("application/json"));
            if (data && data.id !== targetFolder._id) {
                moveItem(data.id, targetFolder._id);
            }
        } catch (err) { }
    };

    if (isLoading) {
        return <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>;
    }

    if (!isLoading && sortedFiles.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                {searchQuery ? 'No files match your search' : 'This folder is empty'}
            </div>
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="flex-1 overflow-y-auto bg-white select-none relative" onClick={() => setSelectedId(null)}>
                <table className="w-full text-left border-collapse cursor-default">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 shadow-sm z-10">
                        <tr>
                            <th className="font-medium py-1.5 pl-6 pr-4 font-normal">Name</th>
                            <th className="font-medium px-4 py-1.5 font-normal">Date Modified</th>
                            <th className="font-medium px-4 py-1.5 font-normal">Size</th>
                            <th className="font-medium px-4 py-1.5 font-normal">Kind</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {sortedFiles.map(file => (
                            <tr
                                key={file._id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, file)}
                                onDragOver={(e) => handleDragOver(e, file)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, file)}
                                onClick={(e) => { e.stopPropagation(); setSelectedId(file._id); }}
                                onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(file); }}
                                onContextMenu={(e) => onFileContextMenu(e, file)}
                                className={`border-b border-gray-100 last:border-none
                                    ${dragOverId === file._id ? 'bg-blue-200 outline outline-2 outline-blue-400' : ''}
                                    ${selectedId === file._id && dragOverId !== file._id ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                            >
                                <td className="py-1.5 pl-6 pr-4 flex items-center gap-2">
                                    <img src={file.icon || (file.type === 'folder' ? '/images/folder.png' : '/images/txt.png')} className="w-4 h-4 object-contain pointer-events-none" alt="icon" />
                                    <span className="truncate max-w-[200px]">{file.name}</span>
                                </td>
                                <td className="px-4 py-1.5 text-gray-500">{new Date(file.updatedAt).toLocaleDateString()}</td>
                                <td className="px-4 py-1.5 text-gray-500">{file.type === 'folder' ? '--' : formatBytes(file.size)}</td>
                                <td className="px-4 py-1.5 text-gray-500">{file.type === 'folder' ? 'Folder' : file.fileType.toUpperCase()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-white p-6 select-none relative" onClick={() => setSelectedId(null)}>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-6">
                {sortedFiles.map(file => (
                    <div
                        key={file._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, file)}
                        onDragOver={(e) => handleDragOver(e, file)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, file)}
                        onClick={(e) => { e.stopPropagation(); setSelectedId(file._id); }}
                        onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(file); }}
                        onContextMenu={(e) => onFileContextMenu(e, file)}
                        className={`flex flex-col items-center gap-1 cursor-default p-2 rounded-lg
                        ${dragOverId === file._id ? 'bg-blue-200 outline outline-2 outline-blue-400' : ''}
                        ${selectedId === file._id && dragOverId !== file._id ? 'bg-blue-100/50 outline outline-1 outline-blue-300' : 'hover:bg-gray-50'}`}
                    >
                        <img
                            src={file.icon || (file.type === 'folder' ? '/images/folder.png' : '/images/txt.png')}
                            className="w-16 h-16 object-contain drop-shadow-sm mb-1 pointer-events-none"
                            alt={file.name}
                        />
                        <span className={`text-[13px] text-center leading-snug break-words px-1 w-full line-clamp-2 pointer-events-none
                            ${selectedId === file._id && dragOverId !== file._id ? 'bg-blue-500 text-white rounded' : 'text-gray-800'}`}>
                            {file.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FileGrid;
