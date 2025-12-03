import React, { useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';

const PageCard = ({ page, onOpen, onDelete }) => {
    const cardRef = useRef(null);
    
    const [{ isDragging }, drag] = useDrag({
        type: 'PAGE',
        item: { id: page.id, name: page.name },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    });

    // Connect drag ref safely
    useEffect(() => {
        if (cardRef.current) {
            drag(cardRef.current);
        }
    }, [drag]);

    return (
        <div
            ref={cardRef}
            className="page-card"
            onClick={(e) => {
                // Don't open if clicking delete button
                if (e.target.closest('.page-delete-btn')) return;
                onOpen(page.id);
            }}
            style={{
                opacity: isDragging ? 0.5 : 1,
                cursor: isDragging ? 'grabbing' : 'pointer'
            }}
        >
            <div
                className="page-card-preview"
                style={{ backgroundColor: page.background_color }}
            >
                {page.background_image && (
                    <img
                        src={page.background_image}
                        alt=""
                        className="page-bg-image"
                    />
                )}
            </div>
            <div className="page-card-info">
                <h4>{page.name}</h4>
                <div className="page-meta">
                    <span className="page-permission">
                        {page.permission === 'owner'
                            ? '👑 Owner'
                            : page.permission === 'edit'
                            ? '✏️ Edit'
                            : '👁️ View'}
                    </span>
                    <span className="page-date">
                        {new Date(page.updated_at).toLocaleDateString()}
                    </span>
                </div>
            </div>
            {page.permission === 'owner' && (
                <button
                    className="page-delete-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(page.id);
                    }}
                    title="Delete page"
                >
                    ×
                </button>
            )}
        </div>
    );
};

export default PageCard;
