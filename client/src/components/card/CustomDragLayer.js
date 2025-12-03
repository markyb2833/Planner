import React from 'react';
import { useDragLayer } from 'react-dnd';

const layerStyles = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 10000,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%'
};

const getItemStyles = (initialOffset, currentOffset, zoom, canvasBounds, cardWidth, cardHeight) => {
    if (!initialOffset || !currentOffset) {
        return { display: 'none' };
    }

    let { x, y } = currentOffset;

    // Use canvas bounds if available, otherwise use fallback viewport bounds
    const bounds = canvasBounds || {
        left: 0,
        top: 60, // Approximate toolbar height
        right: window.innerWidth,
        bottom: window.innerHeight
    };
    
    const scaledCardWidth = cardWidth * zoom;
    const scaledCardHeight = cardHeight * zoom;
    const padding = 10; // Small padding from edges
    
    // Clamp X position - keep card fully within visible area
    const minX = bounds.left + padding;
    const maxX = bounds.right - scaledCardWidth - padding;
    x = Math.max(minX, Math.min(x, maxX));
    
    // Clamp Y position - keep card fully within visible area (below toolbar)
    const minY = bounds.top + padding;
    const maxY = bounds.bottom - scaledCardHeight - padding;
    y = Math.max(minY, Math.min(y, maxY));

    return {
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
        transformOrigin: 'top left'
    };
};

const CustomDragLayer = ({ cards, zoom = 1, canvasBounds = null }) => {
    const { itemType, isDragging, item, initialOffset, currentOffset } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging()
    }));

    if (!isDragging || itemType !== 'CARD') {
        return null;
    }

    // Find the card being dragged
    const card = cards.find(c => c.id === item?.id);
    if (!card) {
        return null;
    }

    const cardWidth = parseFloat(card.width) || 200;
    const cardHeight = parseFloat(card.height) || 150;

    // Check if cursor is outside bounds - show indicator
    let isOutOfBounds = false;
    if (canvasBounds && currentOffset) {
        isOutOfBounds = 
            currentOffset.x < canvasBounds.left ||
            currentOffset.x > canvasBounds.right ||
            currentOffset.y < canvasBounds.top ||
            currentOffset.y > canvasBounds.bottom;
    }

    return (
        <div style={layerStyles}>
            <div style={getItemStyles(initialOffset, currentOffset, zoom, canvasBounds, cardWidth, cardHeight)}>
                <div
                    className="canvas-card dragging-preview"
                    style={{
                        width: `${cardWidth}px`,
                        height: `${cardHeight}px`,
                        backgroundColor: card.background_color || '#FFFFFF',
                        boxShadow: isOutOfBounds 
                            ? '0 8px 32px rgba(239, 68, 68, 0.5), 0 0 0 3px rgba(239, 68, 68, 0.8)'
                            : '0 8px 32px rgba(102, 126, 234, 0.4)',
                        opacity: isOutOfBounds ? 0.7 : 0.9,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        transition: 'box-shadow 0.15s ease, opacity 0.15s ease'
                    }}
                >
                    <div 
                        className="card-header"
                        style={{ 
                            padding: '8px 12px',
                            borderBottom: '1px solid rgba(0,0,0,0.1)',
                            background: isOutOfBounds ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,0,0,0.05)'
                        }}
                    >
                        <h4 
                            className="card-title" 
                            style={{ 
                                color: card.text_color || '#333',
                                margin: 0,
                                fontSize: '14px',
                                fontWeight: 600
                            }}
                        >
                            {card.title || 'Untitled'}
                        </h4>
                    </div>
                    <div 
                        className="card-body"
                        style={{
                            padding: '12px',
                            color: card.text_color || '#333',
                            fontSize: '13px',
                            overflow: 'hidden'
                        }}
                    >
                        {card.card_type === 'list' ? (
                            <div>📋 List card</div>
                        ) : (
                            <div style={{ 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {card.content || 'Empty card'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomDragLayer;
