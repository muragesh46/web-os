import React from 'react';

function ContextMenu({ x, y, isVisible, closeMenu, options, targetFile, containerRef }) {
    if (!isVisible) return null;

    // Calculate relative coordinates to avoid transform issues
    let left = x;
    let top = y;
    if (containerRef && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        left = x - rect.left;
        top = y - rect.top;
    }

    return (
        <div
            className="absolute bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 rounded-lg py-1 z-[999] min-w-[160px] text-sm text-gray-800"
            style={{
                top: Math.min(top, (containerRef?.current?.clientHeight || window.innerHeight) - 200),
                left: Math.min(left, (containerRef?.current?.clientWidth || window.innerWidth) - 180)
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {options.map((option, index) => {
                if (option === 'divider') {
                    return <div key={`div-${index}`} className="h-px bg-gray-200 my-1 mx-2" />;
                }
                return (
                    <button
                        key={option.label}
                        className="w-full text-left px-4 py-1 hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-between"
                        onClick={() => {
                            // Pass the targetFile (or nothing for background options)
                            option.onClick(targetFile);
                            closeMenu();
                        }}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

export default ContextMenu;
