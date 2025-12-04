import React, { useEffect, useRef } from 'react';
import '../../styles/ContextMenu.css';

const ContextMenu = ({ x, y, onClose, options, hoveredCard }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
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
