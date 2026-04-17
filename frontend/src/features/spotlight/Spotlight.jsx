import { useEffect, useRef, useState, useMemo } from 'react';
import useSpotlightStore from '@store/spotlight';
import usewindowstore from '@store/window';
import { launchpadApps, locations } from '@constants/data';

// Build a flat searchable index from apps + finder locations
function buildSearchIndex() {
    const results = [];

    // Apps
    launchpadApps.forEach((app) => {
        results.push({
            id: `app-${app.id}`,
            label: app.name,
            subtitle: 'Application',
            icon: `/images/${app.icon}`,
            type: 'app',
            windowKey: app.windowKey,
        });
    });

    // Settings app (added separately)
    results.push({
        id: 'app-settings',
        label: 'Settings',
        subtitle: 'Application',
        icon: `/icons/settings.svg`,
        type: 'app',
        windowKey: 'settings',
    });

    // Finder locations (top-level folders)
    Object.values(locations).forEach((loc) => {
        results.push({
            id: `location-${loc.id}`,
            label: loc.name,
            subtitle: 'Finder Location',
            icon: loc.icon || '/images/folder.png',
            type: 'finder',
            windowKey: 'finder',
            data: loc,
        });

        // Sub-folders
        if (loc.children) {
            loc.children.forEach((child) => {
                results.push({
                    id: `file-${child.id}-${loc.id}`,
                    label: child.name,
                    subtitle: `in ${loc.name}`,
                    icon: child.icon || '/images/txt.png',
                    type: 'file',
                    windowKey: 'finder',
                    data: child,
                });
            });
        }
    });

    return results;
}

const ALL_ITEMS = buildSearchIndex();

function fuzzyMatch(query, text) {
    return text.toLowerCase().includes(query.toLowerCase());
}

export default function SpotlightSearch() {
    const { isOpen, query, closeSpotlight, setQuery } = useSpotlightStore();
    const { openwindow } = usewindowstore();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    const results = useMemo(() => {
        if (!query.trim()) return ALL_ITEMS.slice(0, 8);
        return ALL_ITEMS.filter(
            (item) => fuzzyMatch(query, item.label) || fuzzyMatch(query, item.subtitle)
        ).slice(0, 10);
    }, [query]);

    // Reset selected index when results change
    useEffect(() => setSelectedIndex(0), [results]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Global keyboard shortcut: Cmd+Space / Ctrl+Space
    useEffect(() => {
        const handler = (e) => {
            // Use e.code === 'Space' as it is more reliable across different keyboard layouts
            if ((e.metaKey || e.ctrlKey || e.altKey) && (e.key === ' ' || e.code === 'Space')) {
                e.preventDefault();
                useSpotlightStore.getState().toggleSpotlight();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleSelect = (item) => {
        openwindow(item.windowKey, item.data || null);
        closeSpotlight();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') { closeSpotlight(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
        if (e.key === 'Enter' && results[selectedIndex]) { handleSelect(results[selectedIndex]); }
    };

    if (!isOpen) return null;

    return (
        <div
            className="spotlight-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) closeSpotlight(); }}
        >
            <div className="spotlight-container">
                {/* Search Input */}
                <div className="spotlight-input-row">
                    <img src="/icons/search.svg" alt="search" className="spotlight-search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="spotlight-input"
                        placeholder="Spotlight Search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {query && (
                        <button className="spotlight-clear" onClick={() => setQuery('')}>✕</button>
                    )}
                </div>

                {/* Results */}
                {results.length > 0 && (
                    <ul className="spotlight-results">
                        {results.map((item, idx) => (
                            <li
                                key={item.id}
                                className={`spotlight-result-item ${idx === selectedIndex ? 'spotlight-result-selected' : ''}`}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                onClick={() => handleSelect(item)}
                            >
                                <img
                                    src={item.icon}
                                    alt={item.label}
                                    className="spotlight-result-icon"
                                    onError={(e) => { e.target.src = '/images/folder.png'; }}
                                />
                                <div className="spotlight-result-text">
                                    <span className="spotlight-result-label">{item.label}</span>
                                    <span className="spotlight-result-subtitle">{item.subtitle}</span>
                                </div>
                                <span className="spotlight-result-type">
                                    {item.type === 'app' ? '⌘ Open' : item.type === 'finder' ? '📁' : '📄'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                {query && results.length === 0 && (
                    <div className="spotlight-no-results">
                        No results for "<strong>{query}</strong>"
                    </div>
                )}

                <div className="spotlight-footer">
                    <span>↑↓ navigate</span>
                    <span>↵ open</span>
                    <span>esc close</span>
                    <span>⌘/⌥/⌃ Space toggle</span>
                </div>
            </div>
        </div>
    );
}
