import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import ImageGallery from '../common/ImageGallery';

const Card = ({ card, onMove, onUpdate, onDelete, onClick, onStartLink, linkingMode, zoom }) => {
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });
    const cardRef = useRef(null);
    const [isDraggingCard, setIsDraggingCard] = useState(false);
    const justResizedRef = useRef(false);
    const [showGallery, setShowGallery] = useState(false);
    
    // Parse images for image type cards
    const cardImages = useMemo(() => {
        if (card.card_type !== 'image') return [];
        
        let images = [];
        // Try to parse from list_items first (multiple images)
        if (card.list_items) {
            try {
                const parsed = typeof card.list_items === 'string' 
                    ? JSON.parse(card.list_items) 
                    : card.list_items;
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                    images = parsed;
                }
            } catch (e) {}
        }
        // Fallback to background_image
        if (images.length === 0 && card.background_image) {
            images = [card.background_image];
        }
        return images;
    }, [card.card_type, card.list_items, card.background_image]);

    const [{ isDragging }, drag, preview] = useDrag({
        type: 'CARD',
        item: () => {
            setIsDraggingCard(true);
            return { 
                id: card.id, 
                x: parseFloat(card.x_position), 
                y: parseFloat(card.y_position) 
            };
        },
        canDrag: !isResizing && !linkingMode,
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        }),
        end: (item, monitor) => {
            setIsDraggingCard(false);
            const dropResult = monitor.getDropResult();
            
            if (dropResult && dropResult.moved) {
                console.log('Moving card to:', { cardId: card.id, x: dropResult.x, y: dropResult.y });
                onMove(card.id, dropResult.x, dropResult.y);
            } else {
                // Fallback: try to get delta directly
                const delta = monitor.getDifferenceFromInitialOffset();
                console.log('Drag ended (fallback):', { item, delta, zoom });
                if (delta) {
                    const newX = Math.round(item.x + delta.x / zoom);
                    const newY = Math.round(item.y + delta.y / zoom);
                    console.log('Moving card to:', { cardId: card.id, newX, newY });
                    onMove(card.id, newX, newY);
                }
            }
        }
    });

    // Remove the default drag preview
    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, [preview]);

    const handleResizeStart = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        setResizeStart({
            width: card.width,
            height: card.height,
            x: e.clientX,
            y: e.clientY
        });
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleResizeMove = (e) => {
            e.preventDefault();
            const deltaX = (e.clientX - resizeStart.x) / zoom;
            const deltaY = (e.clientY - resizeStart.y) / zoom;
            const newWidth = Math.max(150, resizeStart.width + deltaX);
            const newHeight = Math.max(100, resizeStart.height + deltaY);

            if (cardRef.current) {
                cardRef.current.style.width = `${newWidth}px`;
                cardRef.current.style.height = `${newHeight}px`;
            }
        };

        const handleResizeEnd = () => {
            setIsResizing(false);
            // Prevent click from firing after resize
            justResizedRef.current = true;
            setTimeout(() => {
                justResizedRef.current = false;
            }, 100);
            
            if (cardRef.current) {
                const newWidth = parseInt(cardRef.current.style.width);
                const newHeight = parseInt(cardRef.current.style.height);
                onUpdate(card.id, { width: newWidth, height: newHeight });
            }
        };

        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);

        return () => {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [isResizing, resizeStart, card.id, onUpdate, zoom]);

    const renderCardContent = () => {
        switch (card.card_type) {
            case 'text':
                return (
                    <div className="card-text-content">
                        <div className="card-text" style={{ color: card.text_color, fontSize: `${card.font_size}px` }}>
                            {card.content || 'Empty card'}
                        </div>
                    </div>
                );

            case 'image':
                return (
                    <div className="card-image-content">
                        {cardImages.length > 0 ? (
                            <>
                                <div className="card-image-wrapper">
                                    <img src={cardImages[0]} alt={card.title} className="card-image" />
                                    {cardImages.length > 1 && (
                                        <div className="image-count-badge">
                                            +{cardImages.length - 1}
                                        </div>
                                    )}
                                    <button 
                                        className="gallery-quick-view"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowGallery(true);
                                        }}
                                        title="View gallery"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                            <circle cx="8.5" cy="8.5" r="1.5"/>
                                            <polyline points="21,15 16,10 5,21"/>
                                        </svg>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="card-image-placeholder">🖼️</div>
                        )}
                        {card.content && (
                            <div className="card-image-caption" style={{ color: card.text_color }}>
                                {card.content}
                            </div>
                        )}
                    </div>
                );

            case 'list':
                let listItems = [];
                try {
                    if (card.list_items) {
                        // Handle case where list_items is already an array
                        if (Array.isArray(card.list_items)) {
                            listItems = card.list_items;
                        } else if (typeof card.list_items === 'string' && card.list_items.trim() && card.list_items !== '[]') {
                            listItems = JSON.parse(card.list_items);
                        }
                    }
                } catch (e) {
                    console.warn('Failed to parse list items:', e);
                    listItems = [];
                }

                // Sort list items: uncompleted first, then completed
                const sortedListItems = [...listItems].sort((a, b) => {
                    if (a.completed === b.completed) return 0;
                    return a.completed ? 1 : -1;
                });

                return (
                    <div className="card-list-content">
                        {sortedListItems.length > 0 ? (
                            <ul className="card-list" style={{ color: card.text_color }}>
                                {sortedListItems.map((item, index) => (
                                    <li key={index} className={item.completed ? 'completed' : ''}>
                                        <span className="list-checkbox">{item.completed ? '☑' : '☐'}</span>
                                        <span className="list-text">{item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="card-list-empty">Empty list</div>
                        )}
                    </div>
                );

            default:
                return <div className="card-text-content">{card.content}</div>;
        }
    };

    return (
        <div
            ref={cardRef}
            className={`canvas-card ${isDragging ? 'dragging' : ''} ${linkingMode ? 'linking-mode' : ''}`}
            style={{
                position: 'absolute',
                left: `${card.x_position}px`,
                top: `${card.y_position}px`,
                width: `${card.width}px`,
                height: `${card.height}px`,
                backgroundColor: card.background_color,
                zIndex: card.z_index || 1,
                opacity: isDragging ? 0.5 : 1,
                cursor: linkingMode ? 'crosshair' : isDragging ? 'grabbing' : 'default'
            }}
            onClick={() => {
                if (!isResizing && !isDraggingCard && !justResizedRef.current) {
                    onClick();
                }
            }}
        >
            {/* Card Header */}
            <div
                ref={drag}
                className="card-header"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                <h4 className="card-title" style={{ color: card.text_color }}>{card.title || 'Untitled'}</h4>
                <div className="card-actions">
                    {!linkingMode && (
                        <>
                            <button
                                className="card-action-btn link-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStartLink(card.id);
                                }}
                                title="Create link"
                            >
                                🔗
                            </button>
                            <button
                                className="card-action-btn delete-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Are you sure you want to delete this card?')) {
                                        onDelete(card.id);
                                    }
                                }}
                                title="Delete card"
                            >
                                ×
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Card Content */}
            <div className="card-body">
                {renderCardContent()}
            </div>

            {/* Resize Handle */}
            {!linkingMode && (
                <div
                    className="card-resize-handle"
                    onMouseDown={handleResizeStart}
                    title="Drag to resize"
                >
                    ⋰
                </div>
            )}

            {/* Work Dates Indicator */}
            {(card.work_start_date || card.work_end_date) && (
                <div className="card-dates" style={{ color: card.text_color }}>
                    📅 {card.work_start_date && new Date(card.work_start_date).toLocaleDateString()}
                    {card.work_end_date && ` - ${new Date(card.work_end_date).toLocaleDateString()}`}
                </div>
            )}
            
            {/* Image Gallery Modal - Render via portal for fullscreen */}
            {showGallery && cardImages.length > 0 && ReactDOM.createPortal(
                <ImageGallery
                    images={cardImages}
                    initialIndex={0}
                    onClose={() => setShowGallery(false)}
                />,
                document.body
            )}
        </div>
    );
};

export default Card;
