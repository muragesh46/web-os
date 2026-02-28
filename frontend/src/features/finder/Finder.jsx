import React, { useEffect, useState, useRef, useCallback } from "react";
import WindowWrapper from "@hoc/WindowWrapper.jsx";
import usewindowstore from "@store/window.js";
import WindowControls from "@components/common/WindowControl.jsx";
import useFinderStore from "../../store/finder.js";
import Sidebar from "./components/Sidebar.jsx";
import Toolbar from "./components/Toolbar.jsx";
import FileGrid from "./components/FileGrid.jsx";
import ContextMenu from "./components/ContextMenu.jsx";
import GetInfoModal from "./components/GetInfoModal.jsx";
import FileEditorModal from "./components/FileEditorModal.jsx";
import useAuthStore from "../../store/auth.js";

// ─── Action Modal (name input for rename/create) ─────────────────────────────
function ActionModal({ actionModal, setActionModal, onSubmit }) {
    if (!actionModal.visible) return null;

    const title = actionModal.type === 'rename' ? 'Rename' :
        actionModal.type === 'createFolder' ? 'New Folder' : 'New File';

    const handleCancel = (e) => {
        e.stopPropagation();
        setActionModal({ visible: false, type: '', file: null, inputValue: '' });
    };

    const handleSave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit();
    };

    return (
        <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[10000] flex items-center justify-center"
            onClick={handleCancel}
            onContextMenu={(e) => e.stopPropagation()}
        >
            <div
                className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 w-72 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 pt-4 pb-4">
                    <h3 className="text-[13px] font-semibold text-gray-800 mb-3 text-center">{title}</h3>
                    <form onSubmit={handleSave}>
                        <input
                            autoFocus
                            type="text"
                            value={actionModal.inputValue}
                            onChange={(e) =>
                                setActionModal((prev) => ({ ...prev, inputValue: e.target.value }))
                            }
                            onFocus={(e) => e.target.select()}
                            className="w-full text-[13px] px-3 py-1.5 bg-gray-100/80 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all text-center"
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Escape') handleCancel(e);
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </form>
                </div>
                <div className="flex border-t border-gray-200/60 bg-gray-50/50">
                    <button
                        type="button"
                        className="flex-1 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100/50 transition-colors border-r border-gray-200/60"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="flex-1 py-2 text-[13px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                        onClick={handleSave}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Finder Component ──────────────────────────────────────────────────
function Finder() {
    const { window } = usewindowstore();
    const {
        fetchFiles, currentFolder, createItem, moveItemToTrash,
        renameItem, permanentlyDelete, restoreItem, updateFileContent, files
    } = useFinderStore();
    const { user } = useAuthStore();

    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, target: null });
    const [actionModal, setActionModal] = useState({ visible: false, type: '', file: null, inputValue: '' });

    // Get Info modal state
    const [infoModal, setInfoModal] = useState({ visible: false, file: null, isFolder: false });

    // File editor state
    const [editorModal, setEditorModal] = useState({ visible: false, file: null });

    const finderRef = useRef(null);

    // Initial fetch
    useEffect(() => {
        if (window?.finder?.isOpen && user) {
            fetchFiles(currentFolder, currentFolder === 'trash');
        }
    }, [window?.finder?.isOpen, user]);

    // Re-fetch when folder changes
    useEffect(() => {
        if (user) {
            if (currentFolder === 'trash') {
                fetchFiles(null, true);
            } else {
                fetchFiles(currentFolder, false);
            }
        }
    }, [currentFolder]);

    // Handle global click to close context menu
    useEffect(() => {
        const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const handleContextMenu = (e) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            target: { type: 'background' }
        });
    };

    const handleFileContextMenu = (e, file) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            target: { type: 'file', file }
        });
    };

    // ─── Modal open helpers ───────────────────────────────────────────────────
    const handleCreateFolder = () =>
        setActionModal({ visible: true, type: 'createFolder', file: null, inputValue: 'New Folder' });

    const handleCreateFile = () =>
        setActionModal({ visible: true, type: 'createFile', file: null, inputValue: 'New File.txt' });

    const handleRename = (file) =>
        setActionModal({ visible: true, type: 'rename', file, inputValue: file.name });

    // ─── Get Info handlers ────────────────────────────────────────────────────
    const handleGetInfoBackground = () => {
        setInfoModal({ visible: true, file: null, isFolder: true });
    };

    const handleGetInfoFile = (file) => {
        // Get the latest version of the file from the store
        const latestFile = files.find(f => f._id === file._id) || file;
        setInfoModal({ visible: true, file: latestFile, isFolder: false });
    };

    // ─── Edit file content (open editor) ─────────────────────────────────────
    const handleEditFile = (file) => {
        const latestFile = files.find(f => f._id === file._id) || file;
        setEditorModal({ visible: true, file: latestFile });
    };

    // ─── Modal submit ─────────────────────────────────────────────────────────
    const handleModalSubmit = useCallback(async () => {
        const { type, file, inputValue } = actionModal;
        if (!inputValue.trim()) return;

        if (type === 'createFolder') {
            const parentId = currentFolder === 'trash' ? null : (currentFolder ?? null);
            await createItem({ name: inputValue.trim(), type: 'folder', parentId });
        } else if (type === 'createFile') {
            const parentId = currentFolder === 'trash' ? null : (currentFolder ?? null);
            // Create the file first, then open the editor
            const payload = { name: inputValue.trim(), type: 'file', parentId, fileType: 'txt', content: '' };
            await createItem(payload);
            // After creation, find the new file in the store and open editor
            // Use a brief timeout to let the store update
            setTimeout(() => {
                const store = useFinderStore.getState();
                const newFile = store.files.find(f => f.name === inputValue.trim() && f.type === 'file');
                if (newFile) {
                    setEditorModal({ visible: true, file: newFile });
                }
            }, 300);
        } else if (type === 'rename') {
            if (inputValue.trim() !== file.name) {
                renameItem(file._id, inputValue.trim());
            }
        }

        setActionModal({ visible: false, type: '', file: null, inputValue: '' });
    }, [actionModal, currentFolder, createItem, renameItem]);

    // ─── Delete / Restore ─────────────────────────────────────────────────────
    const handleDelete = (file) => {
        if (currentFolder === 'trash') {
            permanentlyDelete(file._id);
        } else {
            moveItemToTrash(file._id);
        }
    };

    const handleRestore = (file) => {
        restoreItem(file._id);
    };

    // ─── Save file content ────────────────────────────────────────────────────
    const handleSaveContent = async (id, content) => {
        await updateFileContent(id, content);
    };

    // ─── Context menu option arrays ───────────────────────────────────────────
    const bgMenuOptions = [
        { label: 'New Folder', onClick: () => handleCreateFolder() },
        { label: 'New Text File', onClick: () => handleCreateFile() },
        'divider',
        { label: 'Get Info', onClick: () => handleGetInfoBackground() },
    ];

    const fileMenuOptions = [
        { label: 'Open', onClick: (file) => handleEditFile(file) },
        { label: 'Edit File', onClick: (file) => handleEditFile(file) },
        'divider',
        { label: 'Rename', onClick: (file) => handleRename(file) },
        ...(currentFolder === 'trash'
            ? [
                { label: 'Restore', onClick: (file) => handleRestore(file) },
                { label: 'Delete Immediately', onClick: (file) => handleDelete(file) },
            ]
            : [
                { label: 'Move to Trash', onClick: (file) => handleDelete(file) },
            ]
        ),
        'divider',
        { label: 'Get Info', onClick: (file) => handleGetInfoFile(file) },
    ];

    return (
        <>
            <div id="window-header" className="bg-gray-100/90 backdrop-blur rounded-t-lg">
                <WindowControls target="finder" />
            </div>

            <div className="flex flex-col h-full bg-white relative" ref={finderRef} onContextMenu={handleContextMenu}>
                <Toolbar />

                <div className="flex flex-1 overflow-hidden h-full">
                    <Sidebar />
                    <FileGrid onFileContextMenu={handleFileContextMenu} />
                </div>

                <ContextMenu
                    isVisible={contextMenu.visible}
                    x={contextMenu.x}
                    y={contextMenu.y}
                    containerRef={finderRef}
                    closeMenu={() => setContextMenu(prev => ({ ...prev, visible: false }))}
                    options={contextMenu.target?.type === 'file' ? fileMenuOptions : bgMenuOptions}
                    targetFile={contextMenu.target?.file}
                />

                <ActionModal
                    actionModal={actionModal}
                    setActionModal={setActionModal}
                    onSubmit={handleModalSubmit}
                />
            </div>

            {/* Get Info Panel (rendered outside the window div so it's not clipped) */}
            {infoModal.visible && (
                <GetInfoModal
                    file={infoModal.file}
                    isFolder={infoModal.isFolder}
                    onClose={() => setInfoModal({ visible: false, file: null, isFolder: false })}
                />
            )}

            {/* File Content Editor */}
            {editorModal.visible && editorModal.file && (
                <FileEditorModal
                    file={editorModal.file}
                    onSave={handleSaveContent}
                    onClose={() => setEditorModal({ visible: false, file: null })}
                />
            )}
        </>
    );
}

const FinderWindow = WindowWrapper(Finder, "finder");
export default FinderWindow;
