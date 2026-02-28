import React, { useState } from 'react';
import useFinderStore from '@store/finder';
import { useShallow } from 'zustand/react/shallow';

function Toolbar() {
    const {
        viewMode, setViewMode,
        sortBy, setSortBy,
        goBack, goForward, history, historyIndex,
        searchQuery, setSearchQuery
    } = useFinderStore(useShallow(state => ({
        viewMode: state.viewMode,
        setViewMode: state.setViewMode,
        sortBy: state.sortBy,
        setSortBy: state.setSortBy,
        goBack: state.goBack,
        goForward: state.goForward,
        history: state.history,
        historyIndex: state.historyIndex,
        searchQuery: state.searchQuery,
        setSearchQuery: state.setSearchQuery
    })));

    const canGoBack = historyIndex >= 0;
    const canGoForward = historyIndex < history.length - 1;

    return (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-300 select-none">
            {/* Navigation & View Toggles */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                    <button
                        onClick={goBack}
                        disabled={!canGoBack}
                        className={`p-1 rounded ${canGoBack ? 'hover:bg-gray-200 text-gray-700' : 'text-gray-400'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                        onClick={goForward}
                        disabled={!canGoForward}
                        className={`p-1 rounded ${canGoForward ? 'hover:bg-gray-200 text-gray-700' : 'text-gray-400'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                {/* View Modes */}
                <div className="flex items-center bg-gray-200 rounded p-0.5">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Grid View"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        title="List View"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>

                {/* Sort Dropdown */}
                <div className="relative group">
                    <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-200">
                        Sort by <span className="capitalize text-xs font-semibold">{sortBy}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <div className="absolute hidden group-hover:block top-full left-0 mt-1 w-32 bg-white border border-gray-200 shadow-lg rounded py-1 z-50">
                        {['name', 'date', 'size', 'kind'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setSortBy(s)}
                                className={`block w-full text-left px-4 py-1 text-sm ${sortBy === s ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <svg className="w-4 h-4 absolute left-2.5 top-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-sm bg-gray-200 border border-transparent rounded-md focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none w-48 transition-all"
                />
            </div>
        </div>
    );
}

export default Toolbar;
