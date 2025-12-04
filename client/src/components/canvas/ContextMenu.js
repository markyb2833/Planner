import React, { useEffect, useRef } from 'react';
import '../../styles/ContextMenu.css';

const ContextMenu = ({ x, y, onClose, options, hoveredCard }) => {
    const menuRef = useRef(null);
    const mouseDownPosRef = useRef(null);

    useEffect(() => {
        const handleMouseDown = (e) => {
            // Record mouse down position
            mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseUp = (e) => {
            // Only close if mouse up is at same position as mouse down (true click, not drag)
            if (menuRef.current && !menuRef.current.contains(e.target) && mouseDownPosRef.current) {
                const dragDistance = Math.sqrt(
                    Math.pow(e.clientX - mouseDownPosRef.current.x, 2) +
                    Math.pow(e.clientY - mouseDownPosRef.current.y, 2)
                );

                // Only close if drag distance is less than 5 pixels (threshold for accidental movement)
                if (dragDistance < 5) {
                    onClose();
                }
            }
            mouseDownPosRef.current = null;
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Filter options based on whether we're hovering a card
    const filteredOptions = options.filter(option => {
        if (option.requiresCard) {
            return hoveredCard !== null;
        }
        return true;
    });

    return (
        <div
            ref={menuRef}
            className="context-menu"
            style={{
                left: `${x}px`,
                top: `${y}px`
            }}
        >
            {filteredOptions.map((option, index) => (
                <React.Fragment key={option.label}>
                    {option.divider && <div className="context-menu-divider" />}
                    <button
                        className={`context-menu-item ${option.danger ? 'danger' : ''}`}
                        onClick={() => {
                            option.onClick();
                            onClose();
                        }}
                        disabled={option.disabled}
                    >
                        <span className="context-menu-icon">{option.icon}</span>
                        <span className="context-menu-label">{option.label}</span>
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
};

export default ContextMenu;
