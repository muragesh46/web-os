import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import useFinderStore from '@store/finder';
import useAuthStore from '@store/auth';
import usewindowstore from '@store/window';
import { useShallow } from 'zustand/react/shallow';
import clsx from 'clsx';

// ─── Small inline name input modal ───────────────────────────────────────────
function NameModal({ visible, title, defaultValue, onConfirm, onCancel }) {
    const [value, setValue] = useState(defaultValue || '');

    useEffect(() => {
        if (visible) setValue(defaultValue || '');
    }, [visible, defaultValue]);

    if (!visible) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (value.trim()) onConfirm(value.trim());
    };

    return (
        <div
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/20 backdrop-blur-sm"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-xl shadow-2xl border border-gray-200 w-64 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-4 pt-4 pb-3">
                    <h3 className="text-[13px] font-semibold text-gray-800 mb-2 text-center">{title}</h3>
                    <form onSubmit={handleSubmit}>
                        <input
                            autoFocus
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') onCancel(); }}
                            className="w-full text-[13px] px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-center"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </form>
                </div>
                <div className="flex border-t border-gray-200 bg-gray-50">
                    <button
                        className="flex-1 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 border-r border-gray-200 transition-colors"
                        onClick={onCancel}
                    >Cancel</button>
                    <button
                        className="flex-1 py-2 text-[13px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                        onClick={() => { if (value.trim()) onConfirm(value.trim()); }}
                    >Create</button>
                </div>
            </div>
        </div>
    );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar() {
    const { currentFolder, navigateTo, moveItem, createItem, moveItemToTrash, permanentlyDelete } =
        useFinderStore(useShallow(state => ({
            currentFolder: state.currentFolder,
            navigateTo: state.navigateTo,
            moveItem: state.moveItem,
            createItem: state.createItem,
            moveItemToTrash: state.moveItemToTrash,
            permanentlyDelete: state.permanentlyDelete,
        })));

    const [favorites, setFavorites] = useState([]);   // root folders
    const [projects, setProjects] = useState([]);     // subfolders of Work
    const [dragOverId, setDragOverId] = useState(null);

    // Context menu
    const [ctxMenu, setCtxMenu] = useState({ visible: false, x: 0, y: 0, item: null, isBg: false });

    // Name input modal
    const [nameModal, setNameModal] = useState({ visible: false, title: '', defaultValue: '', type: '', parentId: null });

    // ── Fetch sidebar data ─────────────────────────────────────────────────────
    const fetchSidebarData = async () => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const stored = localStorage.getItem('user');
            if (!stored) return;
            const headers = { Authorization: `Bearer ${JSON.parse(stored).token}` };

            const rootRes = await fetch(`${API_BASE_URL}/finder?parentId=root`, { headers });
            if (!rootRes.ok) return;
            const rootData = await rootRes.json();
            const rootItems = rootData.filter(item => item.name !== 'Trash');
            setFavorites(rootItems);

            const workFolder = rootItems.find(f => f.name === 'Work' && f.type === 'folder');
            if (workFolder) {
                const projRes = await fetch(`${API_BASE_URL}/finder?parentId=${workFolder._id}`, { headers });
                const projData = await projRes.json();
                setProjects(projData);
            } else {
                setProjects([]);
            }
        } catch (e) {
            console.error('Failed to load sidebar data', e);
        }
    };

    const { user } = useAuthStore();
    const { window } = usewindowstore();

    useEffect(() => {
        if (user && window?.finder?.isOpen) {
            fetchSidebarData();
        }
    }, [user, window?.finder?.isOpen]);

    // Close context menu on outside click
    useEffect(() => {
        const close = () => setCtxMenu(prev => ({ ...prev, visible: false }));
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, []);

    // ── Drag helpers ───────────────────────────────────────────────────────────
    const handleDragOver = (e, id) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverId !== id) setDragOverId(id);
    };
    const handleDragLeave = () => setDragOverId(null);
    const handleDrop = (e, id) => {
        e.preventDefault();
        setDragOverId(null);
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data?.id) {
                if (id === 'trash') moveItemToTrash(data.id);
                else moveItem(data.id, id === 'root' ? null : id);
            }
        } catch { }
    };

    // ── Context menu open ──────────────────────────────────────────────────────
    const openCtxMenu = (e, item = null, isBg = false) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ visible: true, x: e.clientX, y: e.clientY, item, isBg });
    };

    // ── Create new item ────────────────────────────────────────────────────────
    // parentId = the folder to create inside (null = root)
    const openCreateModal = (type, parentId) => {
        setCtxMenu(prev => ({ ...prev, visible: false }));
        setNameModal({
            visible: true,
            title: type === 'folder' ? 'New Folder' : 'New Text File',
            defaultValue: type === 'folder' ? 'New Folder' : 'New File.txt',
            type,
            parentId,
        });
    };

    const handleCreateConfirm = async (name) => {
        const { type, parentId } = nameModal;
        setNameModal(prev => ({ ...prev, visible: false }));
        await createItem({
            name,
            type,
            parentId: parentId ?? null,
            fileType: type === 'folder' ? 'folder' : 'txt',
        });
        // Re-fetch sidebar so new item appears
        await fetchSidebarData();
        // Also navigate into the target folder so the file grid updates
        if (parentId !== null) {
            useFinderStore.getState().fetchFiles(parentId, false);
        } else {
            useFinderStore.getState().fetchFiles(null, false);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleMoveToTrash = async () => {
        const { item } = ctxMenu;
        if (!item || item.isTrash) return;
        setCtxMenu(prev => ({ ...prev, visible: false }));
        await moveItemToTrash(item.id);
        await fetchSidebarData();
    };

    const handlePermanentDelete = async () => {
        const { item } = ctxMenu;
        if (!item || item.isTrash) return;
        setCtxMenu(prev => ({ ...prev, visible: false }));
        await permanentlyDelete(item.id);
        await fetchSidebarData();
    };

    // ── Build nav items ────────────────────────────────────────────────────────
    const navItems = [
        ...favorites.map(f => ({ id: f._id, name: f.name, icon: f.icon || (f.type === 'folder' ? '/images/folder.png' : '/images/txt.png'), isTrash: false, rawId: f._id })),
        { id: 'trash', name: 'Trash', icon: '/icons/trash.svg', isTrash: true },
    ];

    const renderItem = (item) => (
        <li
            key={item.id}
            onClick={() => navigateTo(item.id)}
            onContextMenu={(e) => item.isTrash ? e.preventDefault() : openCtxMenu(e, item)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.id)}
            className={clsx(
                'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-[13px] font-medium tracking-wide',
                dragOverId === item.id ? 'bg-blue-200' :
                    currentFolder === item.id ? 'bg-blue-500 text-white' :
                        'text-gray-700 hover:bg-gray-200'
            )}
        >
            <img src={item.icon} className="w-4 h-4 object-contain" alt={item.name} />
            <span className="truncate flex-1">{item.name}</span>
        </li>
    );

    return (
        <>
            <div
                className="w-48 bg-gray-50/80 backdrop-blur-md border-r border-gray-200 flex flex-col pt-4 h-full select-none overflow-y-auto"
                onContextMenu={(e) => openCtxMenu(e, null, true)}
            >
                {/* Favorites */}
                <div className="px-4 mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2">Favorites</h3>
                    <ul className="space-y-0.5">
                        {navItems.map(item => renderItem(item))}
                    </ul>
                </div>

                {/* My Projects */}
                {projects.length > 0 && (
                    <div className="px-4 mb-2">
                        <h3 className="text-xs font-semibold text-gray-500 mb-2">My Projects</h3>
                        <ul className="space-y-0.5">
                            {projects.map(proj => renderItem({
                                id: proj._id, name: proj.name,
                                icon: proj.icon || (proj.type === 'folder' ? '/images/folder.png' : '/images/txt.png'), isTrash: false
                            }))}
                        </ul>
                    </div>
                )}
            </div>

            {/* ── Context Menu (fixed, always on top) ── */}
            {ctxMenu.visible && createPortal(
                <div
                    className="fixed bg-white/95 backdrop-blur-md shadow-xl border border-gray-200 rounded-xl py-1.5 z-[999999] min-w-[185px] text-[13px] text-gray-800"
                    style={{ top: ctxMenu.y, left: ctxMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Background right-click → create in root or current folder */}
                    {ctxMenu.isBg && (
                        <>
                            <button
                                className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white transition-colors"
                                onClick={() => openCreateModal('folder', null)}
                            >New Folder (Root)</button>
                            <button
                                className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white transition-colors"
                                onClick={() => openCreateModal('file', null)}
                            >New Text File (Root)</button>
                        </>
                    )}

                    {/* Item right-click */}
                    {ctxMenu.item && !ctxMenu.isBg && (
                        <>
                            <button
                                className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white transition-colors"
                                onClick={() => { navigateTo(ctxMenu.item.id); setCtxMenu(p => ({ ...p, visible: false })); }}
                            >Open</button>
                            <div className="h-px bg-gray-200 my-1 mx-2" />
                            <button
                                className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white transition-colors"
                                onClick={() => openCreateModal('folder', ctxMenu.item.id)}
                            >New Folder Inside</button>
                            <button
                                className="w-full text-left px-4 py-1.5 hover:bg-blue-500 hover:text-white transition-colors"
                                onClick={() => openCreateModal('file', ctxMenu.item.id)}
                            >New Text File Inside</button>
                            <div className="h-px bg-gray-200 my-1 mx-2" />
                            <button
                                className="w-full text-left px-4 py-1.5 hover:bg-red-500 hover:text-white transition-colors text-red-600"
                                onClick={handleMoveToTrash}
                            >Move to Trash</button>
                            <button
                                className="w-full text-left px-4 py-1.5 hover:bg-red-600 hover:text-white transition-colors text-red-700"
                                onClick={handlePermanentDelete}
                            >Delete Immediately</button>
                        </>
                    )}
                </div>,
                document.body
            )}

            {/* ── Name input modal ── */}
            <NameModal
                visible={nameModal.visible}
                title={nameModal.title}
                defaultValue={nameModal.defaultValue}
                onConfirm={handleCreateConfirm}
                onCancel={() => setNameModal(prev => ({ ...prev, visible: false }))}
            />
        </>
    );
}

export default Sidebar;
