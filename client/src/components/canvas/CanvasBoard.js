import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { pagesAPI, cardsAPI } from '../../services/api';
import socketService from '../../services/socket';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../card/Card';
import CardModal from '../card/CardModal';
import CustomDragLayer from '../card/CustomDragLayer';
import PageSettings from './PageSettings';
import ShareModal from '../common/ShareModal';
import ActiveUsers from '../common/ActiveUsers';
import '../../styles/Canvas.css';

const CanvasBoardContent = () => {
    const { pageId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Page and cards state
    const [page, setPage] = useState(null);
    const [pageDefaults, setPageDefaults] = useState(null);
    const [cards, setCards] = useState([]);
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI state
    const [selectedCard, setSelectedCard] = useState(null);
    const [showCardModal, setShowCardModal] = useState(false);
    const [showPageSettings, setShowPageSettings] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [linkingMode, setLinkingMode] = useState(false);
    const [linkStart, setLinkStart] = useState(null);

    // Zoom and pan state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const canvasRef = useRef(null);
    const canvasContentRef = useRef(null);
    const [canvasBounds, setCanvasBounds] = useState(null);
    const canvasBoundsRef = useRef(null);
    
    // Keep refs for use in drop handler (avoids stale closures)
    const cardsRef = useRef(cards);
    const pageRef = useRef(page);
    const zoomRef = useRef(zoom);
    
    useEffect(() => {
        cardsRef.current = cards;
    }, [cards]);
    
    useEffect(() => {
        pageRef.current = page;
    }, [page]);
    
    useEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);

    // Helper to update canvas bounds
    const updateCanvasBounds = useCallback(() => {
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const bounds = {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height
            };
            setCanvasBounds(bounds);
            canvasBoundsRef.current = bounds;
        }
    }, []);

    // Update canvas bounds for drag layer clamping (visible workspace area)
    useEffect(() => {
        // Update bounds on resize
        window.addEventListener('resize', updateCanvasBounds);
        
        // Initial update after delays to ensure DOM is ready
        const timeouts = [
            setTimeout(updateCanvasBounds, 0),
            setTimeout(updateCanvasBounds, 100),
            setTimeout(updateCanvasBounds, 300)
        ];
        
        return () => {
            window.removeEventListener('resize', updateCanvasBounds);
            timeouts.forEach(t => clearTimeout(t));
        };
    }, [updateCanvasBounds]);
    
    // Update bounds when zoom/pan/page/loading changes
    useEffect(() => {
        updateCanvasBounds();
    }, [zoom, pan, page, loading, updateCanvasBounds]);

    // Fetch page data
    const fetchPageData = useCallback(async () => {
        try {
            const [pageResponse, cardsResponse] = await Promise.all([
                pagesAPI.getPage(pageId),
                cardsAPI.getCards(pageId)
            ]);

            setPage(pageResponse.data.page);
            setPageDefaults(pageResponse.data.defaults);
            setCards(cardsResponse.data.cards);
            setLinks(cardsResponse.data.links);
        } catch (error) {
            console.error('Failed to fetch page data:', error);
            if (error.response?.status === 404 || error.response?.status === 403) {
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    }, [pageId, navigate]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    // Drop target for the canvas
    const [, drop] = useDrop({
        accept: 'CARD',
        drop: (item, monitor) => {
            // Use refs for latest data (avoids stale closures)
            const currentCards = cardsRef.current;
            const currentPage = pageRef.current;
            const currentZoom = zoomRef.current;
            
            // Find the card being dropped to get its dimensions
            const draggedCard = currentCards.find(c => c.id === item.id);
            const cardWidth = parseFloat(draggedCard?.width) || 200;
            const cardHeight = parseFloat(draggedCard?.height) || 150;
            
            // Get canvas max dimensions from current page
            const maxWidth = currentPage?.canvas_max_width || 5000;
            const maxHeight = currentPage?.canvas_max_height || 5000;
            const padding = 10;

            const delta = monitor.getDifferenceFromInitialOffset();
            if (delta) {
                const rawX = Math.round(parseFloat(item.x) + delta.x / currentZoom);
                const rawY = Math.round(parseFloat(item.y) + delta.y / currentZoom);
                // Clamp position within canvas bounds
                const newX = Math.max(padding, Math.min(rawX, maxWidth - cardWidth - padding));
                const newY = Math.max(padding, Math.min(rawY, maxHeight - cardHeight - padding));
                return { moved: true, x: Math.round(newX), y: Math.round(newY) };
            }
            
            // Fallback: use getSourceClientOffset if delta is null
            const clientOffset = monitor.getSourceClientOffset();
            if (clientOffset && canvasContentRef.current) {
                const rect = canvasContentRef.current.getBoundingClientRect();
                const rawX = Math.round((clientOffset.x - rect.left) / currentZoom);
                const rawY = Math.round((clientOffset.y - rect.top) / currentZoom);
                // Clamp position within canvas bounds
                const newX = Math.max(padding, Math.min(rawX, maxWidth - cardWidth - padding));
                const newY = Math.max(padding, Math.min(rawY, maxHeight - cardHeight - padding));
                return { moved: true, x: Math.round(newX), y: Math.round(newY) };
            }
            
            return { moved: false };
        },
        collect: (monitor) => ({
            isOver: monitor.isOver()
        })
    });

    // Socket.io real-time updates
    useEffect(() => {
        if (!pageId) return;

        socketService.joinPage(pageId);

        // Listen for real-time events
        socketService.on('card-created', handleCardCreated);
        socketService.on('card-updated', handleCardUpdated);
        socketService.on('card-deleted', handleCardDeleted);
        socketService.on('card-moved', handleCardMoved);
        socketService.on('link-created', handleLinkCreated);
        socketService.on('link-deleted', handleLinkDeleted);
        socketService.on('page-updated', handlePageUpdated);

        // Handle being kicked from the page
        socketService.on('kicked-from-page', ({ pageId: kickedPageId, message }) => {
            if (kickedPageId === pageId) {
                alert(message);
                navigate('/');
            }
        });

        return () => {
            socketService.leavePage(pageId);
            socketService.off('card-created', handleCardCreated);
            socketService.off('card-updated', handleCardUpdated);
            socketService.off('card-deleted', handleCardDeleted);
            socketService.off('card-moved', handleCardMoved);
            socketService.off('link-created', handleLinkCreated);
            socketService.off('link-deleted', handleLinkDeleted);
            socketService.off('page-updated', handlePageUpdated);
            socketService.off('kicked-from-page');
        };
    }, [pageId, navigate]);

    // Real-time event handlers
    const handleCardCreated = ({ card }) => {
        setCards(prev => [...prev, card]);
    };

    const handleCardUpdated = ({ cardId, updates }) => {
        setCards(prev => prev.map(card =>
            card.id === cardId ? { ...card, ...updates } : card
        ));
    };

    const handleCardDeleted = ({ cardId }) => {
        setCards(prev => prev.filter(card => card.id !== cardId));
    };

    const handleCardMoved = ({ cardId, x, y }) => {
        setCards(prev => prev.map(card =>
            card.id === cardId ? { ...card, x_position: x, y_position: y } : card
        ));
    };

    const handleLinkCreated = ({ link }) => {
        setLinks(prev => [...prev, link]);
    };

    const handleLinkDeleted = ({ linkId }) => {
        setLinks(prev => prev.filter(link => link.id !== linkId));
    };

    const handlePageUpdated = ({ updates }) => {
        setPage(prev => ({ ...prev, ...updates }));
    };

    // Card operations
    const handleCreateCard = async (type = 'text') => {
        try {
            const newCard = {
                card_type: type,
                x_position: (-pan.x + 100) / zoom,
                y_position: (-pan.y + 100) / zoom,
                width: pageDefaults?.default_card_width || 200,
                height: pageDefaults?.default_card_height || 150,
                background_color: pageDefaults?.default_card_background_color || '#FFFFFF',
                title: 'New Card',
                content: ''
            };

            const response = await cardsAPI.createCard(pageId, newCard);
            const createdCard = response.data.card;

            setCards(prev => [...prev, createdCard]);
            socketService.emitCardCreated(pageId, createdCard);
        } catch (error) {
            console.error('Failed to create card:', error);
            alert('Failed to create card');
        }
    };

    const handleCardMove = async (cardId, x, y) => {
        try {
            // Update local state immediately for responsiveness
            setCards(prev => prev.map(card =>
                card.id === cardId ? { ...card, x_position: x, y_position: y } : card
            ));

            // Then update backend
            await cardsAPI.updateCard(cardId, { x_position: x, y_position: y });
            socketService.emitCardMoved(pageId, cardId, x, y);
        } catch (error) {
            console.error('Failed to move card:', error);
            // Revert on error by re-fetching
            fetchPageData();
        }
    };

    const handleCardUpdate = async (cardId, updates) => {
        try {
            await cardsAPI.updateCard(cardId, updates);
            setCards(prev => prev.map(card =>
                card.id === cardId ? { ...card, ...updates } : card
            ));
            socketService.emitCardUpdated(pageId, cardId, updates);
        } catch (error) {
            console.error('Failed to update card:', error);
        }
    };

    const handleCardDelete = async (cardId) => {
        // Note: confirmation is already handled by the calling component (CardModal)
        try {
            await cardsAPI.deleteCard(cardId);
            setCards(prev => prev.filter(card => card.id !== cardId));
            socketService.emitCardDeleted(pageId, cardId);
        } catch (error) {
            console.error('Failed to delete card:', error);
        }
    };

    // Link operations
    const handleStartLinking = (cardId) => {
        setLinkingMode(true);
        setLinkStart(cardId);
    };

    const handleCompleteLinking = async (targetCardId) => {
        if (!linkStart || linkStart === targetCardId) {
            setLinkingMode(false);
            setLinkStart(null);
            return;
        }

        try {
            const response = await cardsAPI.createLink(pageId, {
                card_from_id: linkStart,
                card_to_id: targetCardId,
                line_color: '#667eea'
            });

            // Construct full link object with all required fields
            const newLink = {
                id: response.data.linkId,
                card_from_id: linkStart,
                card_to_id: targetCardId,
                line_color: '#667eea',
                line_width: 2,
                line_style: 'solid'
            };
            setLinks(prev => [...prev, newLink]);
            socketService.emitLinkCreated(pageId, newLink);
        } catch (error) {
            console.error('Failed to create link:', error);
        } finally {
            setLinkingMode(false);
            setLinkStart(null);
        }
    };

    const handleDeleteLink = async (linkId) => {
        try {
            await cardsAPI.deleteLink(linkId);
            setLinks(prev => prev.filter(link => link.id !== linkId));
            socketService.emitLinkDeleted(pageId, linkId);
        } catch (error) {
            console.error('Failed to delete link:', error);
        }
    };

    // Zoom and pan handlers
    const handleWheel = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY * -0.01;
            const newZoom = Math.min(Math.max(0.1, zoom + delta * 0.1), 3);
            setZoom(newZoom);
        }
    }, [zoom]);

    const handleMouseDown = useCallback((e) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    }, [pan]);

    const handleMouseMove = useCallback((e) => {
        if (isPanning) {
            setPan({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        }
    }, [isPanning, panStart]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    const resetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    if (loading) {
        return <div className="loading">Loading page...</div>;
    }

    if (!page) {
        return <div className="loading">Page not found</div>;
    }

    return (
        <div className="canvas-container">
                {/* Custom Drag Layer for visual feedback */}
                <CustomDragLayer cards={cards} zoom={zoom} canvasBounds={canvasBounds} />

                {/* Modern Toolbar */}
                <div className="canvas-toolbar-modern">
                    <div className="toolbar-left">
                        <button onClick={() => navigate('/')} className="toolbar-back-btn" title="Back to Dashboard">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <div className="toolbar-divider"></div>
                        <div className="page-info">
                            <h1 className="page-title-modern">{page.name}</h1>
                            <span className="page-cards-count">{cards.length} card{cards.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    <div className="toolbar-center">
                        <div className="toolbar-actions-modern">
                            <div className="action-group">
                                <button onClick={() => handleCreateCard('text')} className="toolbar-action-btn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                                    </svg>
                                    <span>Text</span>
                                </button>
                                <button onClick={() => handleCreateCard('list')} className="toolbar-action-btn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
                                    </svg>
                                    <span>List</span>
                                </button>
                                <button onClick={() => handleCreateCard('image')} className="toolbar-action-btn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                        <circle cx="8.5" cy="8.5" r="1.5"/>
                                        <path d="M21 15l-5-5L5 21"/>
                                    </svg>
                                    <span>Image</span>
                                </button>
                            </div>
                            <div className="toolbar-divider"></div>
                            <button 
                                onClick={() => setLinkingMode(!linkingMode)}
                                className={`toolbar-action-btn ${linkingMode ? 'active' : ''}`}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                                </svg>
                                <span>{linkingMode ? 'Cancel' : 'Link'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="toolbar-right">
                        <div className="zoom-controls-modern">
                            <button 
                                onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} 
                                className="zoom-btn"
                                title="Zoom Out"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8"/>
                                    <path d="M21 21l-4.35-4.35M8 11h6"/>
                                </svg>
                            </button>
                            <div className="zoom-display">
                                <span className="zoom-value">{Math.round(zoom * 100)}%</span>
                            </div>
                            <button 
                                onClick={() => setZoom(Math.min(3, zoom + 0.1))} 
                                className="zoom-btn"
                                title="Zoom In"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8"/>
                                    <path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
                                </svg>
                            </button>
                            <button 
                                onClick={resetView} 
                                className="zoom-btn reset-btn"
                                title="Reset View"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
                                    <path d="M3 3v5h5"/>
                                </svg>
                            </button>
                        </div>
                        <div className="toolbar-divider"></div>
                        <button 
                            onClick={() => setShowShareModal(true)} 
                            className="toolbar-share-btn"
                            title="Share Page"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="18" cy="5" r="3"/>
                                <circle cx="6" cy="12" r="3"/>
                                <circle cx="18" cy="19" r="3"/>
                                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
                            </svg>
                            <span>Share</span>
                        </button>
                        <button 
                            onClick={() => setShowPageSettings(true)} 
                            className="toolbar-settings-btn"
                            title="Page Settings"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Link Mode Banner */}
                {linkingMode && (
                    <div className="link-mode-banner">
                        <span className="link-icon">🔗</span>
                        <span>Click on a card to create a connection{linkStart ? ' (source selected)' : ''}</span>
                        <button onClick={() => { setLinkingMode(false); setLinkStart(null); }} className="banner-close">
                            Cancel
                        </button>
                    </div>
                )}

                {/* Canvas */}
                <div
                    ref={canvasRef}
                    className="canvas-workspace"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{
                        backgroundColor: page.background_color || '#FFFFFF',
                        backgroundImage: page.background_image ? `url(${page.background_image})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: isPanning ? 'grabbing' : 'default'
                    }}
                >
                    <div
                        ref={(node) => {
                            drop(node);
                            canvasContentRef.current = node;
                        }}
                        className="canvas-content"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            width: `${page.canvas_max_width}px`,
                            height: `${page.canvas_max_height}px`
                        }}
                    >
                        {/* Render links */}
                        <svg className="canvas-links" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
                            {links.map(link => {
                                // Use loose comparison to handle string/number type differences
                                const fromCard = cards.find(c => String(c.id) === String(link.card_from_id));
                                const toCard = cards.find(c => String(c.id) === String(link.card_to_id));

                                if (!fromCard || !toCard) return null;

                                const x1 = Number(fromCard.x_position) + Number(fromCard.width) / 2;
                                const y1 = Number(fromCard.y_position) + Number(fromCard.height) / 2;
                                const x2 = Number(toCard.x_position) + Number(toCard.width) / 2;
                                const y2 = Number(toCard.y_position) + Number(toCard.height) / 2;

                                // Skip rendering if any value is NaN
                                if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return null;

                                return (
                                    <g key={link.id}>
                                        <line
                                            x1={x1}
                                            y1={y1}
                                            x2={x2}
                                            y2={y2}
                                            stroke={link.line_color || '#667eea'}
                                            strokeWidth={link.line_width || 2}
                                            strokeDasharray={link.line_style === 'dashed' ? '5,5' : 'none'}
                                        />
                                        <circle
                                            cx={(x1 + x2) / 2}
                                            cy={(y1 + y2) / 2}
                                            r="8"
                                            fill="red"
                                            opacity="0"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleDeleteLink(link.id)}
                                            onMouseOver={(e) => e.target.style.opacity = '0.7'}
                                            onMouseOut={(e) => e.target.style.opacity = '0'}
                                        />
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Render cards */}
                        {cards.map(card => (
                            <Card
                                key={card.id}
                                card={card}
                                onMove={handleCardMove}
                                onUpdate={handleCardUpdate}
                                onDelete={handleCardDelete}
                                onClick={() => {
                                    if (linkingMode) {
                                        handleCompleteLinking(card.id);
                                    } else {
                                        setSelectedCard(card);
                                        setShowCardModal(true);
                                    }
                                }}
                                onStartLink={handleStartLinking}
                                linkingMode={linkingMode}
                                zoom={zoom}
                            />
                        ))}
                    </div>
                </div>

                {/* Card Detail Modal */}
                {showCardModal && selectedCard && (
                    <CardModal
                        card={cards.find(c => c.id === selectedCard.id) || selectedCard}
                        onClose={() => {
                            setShowCardModal(false);
                            setSelectedCard(null);
                        }}
                        onUpdate={handleCardUpdate}
                        onDelete={handleCardDelete}
                        pageId={pageId}
                    />
                )}

                {/* Page Settings Modal */}
                {showPageSettings && (
                    <PageSettings
                        page={page}
                        defaults={pageDefaults}
                        onClose={() => setShowPageSettings(false)}
                        onUpdate={(updates) => {
                            // Update page settings
                            const { defaults, ...pageUpdates } = updates;
                            setPage(prev => ({ ...prev, ...pageUpdates }));
                            socketService.emitPageUpdated(pageId, pageUpdates);
                            
                            // Update page defaults if provided
                            if (defaults) {
                                setPageDefaults(prev => ({ ...prev, ...defaults }));
                            }
                        }}
                    />
                )}

                {/* Active Users Indicator */}
                {page && user && (
                    <ActiveUsers pageId={pageId} currentUserId={user.id} />
                )}

                {/* Share Modal */}
                {showShareModal && page && user && (
                    <ShareModal
                        page={page}
                        onClose={() => setShowShareModal(false)}
                        onShare={() => {
                            // Could refresh shared users list here
                        }}
                        currentUserId={user.id}
                        isOwner={page.owner_id === user.id}
                    />
                )}
        </div>
    );
};

const CanvasBoard = () => {
    return (
        <DndProvider backend={HTML5Backend}>
            <CanvasBoardContent />
        </DndProvider>
    );
};

export default CanvasBoard;
