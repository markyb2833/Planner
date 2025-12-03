import React, { useState, useEffect, useCallback } from 'react';

const ImageGallery = ({ images, initialIndex = 0, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isZoomed, setIsZoomed] = useState(false);

    const currentImage = images[currentIndex];

    const goToPrevious = useCallback(() => {
        setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
        setIsZoomed(false);
    }, [images.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
        setIsZoomed(false);
    }, [images.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') goToPrevious();
            if (e.key === 'ArrowRight') goToNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, goToPrevious, goToNext]);

    // Prevent body scroll when gallery is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    if (!images || images.length === 0) return null;

    return (
        <div className="gallery-overlay" onClick={onClose}>
            <div className="gallery-container" onClick={(e) => e.stopPropagation()}>
                {/* Close button */}
                <button className="gallery-close" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>

                {/* Navigation arrows */}
                {images.length > 1 && (
                    <>
                        <button className="gallery-nav gallery-prev" onClick={goToPrevious}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15,18 9,12 15,6"/>
                            </svg>
                        </button>
                        <button className="gallery-nav gallery-next" onClick={goToNext}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9,18 15,12 9,6"/>
                            </svg>
                        </button>
                    </>
                )}

                {/* Main image */}
                <div 
                    className={`gallery-image-container ${isZoomed ? 'zoomed' : ''}`}
                    onClick={() => setIsZoomed(!isZoomed)}
                >
                    <img 
                        src={currentImage} 
                        alt={`Gallery view ${currentIndex + 1}`}
                        className="gallery-image"
                        draggable={false}
                    />
                </div>

                {/* Image counter */}
                <div className="gallery-counter">
                    {currentIndex + 1} / {images.length}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                    <div className="gallery-thumbnails">
                        {images.map((img, index) => (
                            <button
                                key={index}
                                className={`gallery-thumbnail ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => {
                                    setCurrentIndex(index);
                                    setIsZoomed(false);
                                }}
                            >
                                <img src={img} alt={`Thumbnail ${index + 1}`} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .gallery-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.2s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .gallery-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .gallery-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: none;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    z-index: 10;
                }

                .gallery-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: rotate(90deg);
                }

                .gallery-nav {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    border: none;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    z-index: 10;
                }

                .gallery-nav:hover {
                    background: rgba(102, 126, 234, 0.8);
                    transform: translateY(-50%) scale(1.1);
                }

                .gallery-prev {
                    left: 20px;
                }

                .gallery-next {
                    right: 20px;
                }

                .gallery-image-container {
                    max-width: calc(100% - 160px);
                    max-height: calc(100% - 160px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: zoom-in;
                    transition: all 0.3s ease;
                }

                .gallery-image-container.zoomed {
                    cursor: zoom-out;
                    max-width: none;
                    max-height: none;
                    overflow: auto;
                }

                .gallery-image {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    border-radius: 8px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    animation: imageSlideIn 0.3s ease;
                }

                .gallery-image-container.zoomed .gallery-image {
                    max-width: none;
                    max-height: none;
                    width: auto;
                    height: auto;
                }

                @keyframes imageSlideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .gallery-counter {
                    position: absolute;
                    top: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.6);
                    color: white;
                    padding: 8px 20px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                    font-variant-numeric: tabular-nums;
                }

                .gallery-thumbnails {
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 8px;
                    padding: 12px;
                    background: rgba(0, 0, 0, 0.6);
                    border-radius: 16px;
                    max-width: calc(100% - 40px);
                    overflow-x: auto;
                }

                .gallery-thumbnail {
                    width: 60px;
                    height: 60px;
                    border-radius: 8px;
                    border: 2px solid transparent;
                    padding: 0;
                    cursor: pointer;
                    overflow: hidden;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                    background: transparent;
                }

                .gallery-thumbnail:hover {
                    border-color: rgba(255, 255, 255, 0.5);
                }

                .gallery-thumbnail.active {
                    border-color: #667eea;
                    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.5);
                }

                .gallery-thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                @media (max-width: 768px) {
                    .gallery-nav {
                        width: 44px;
                        height: 44px;
                    }

                    .gallery-prev {
                        left: 10px;
                    }

                    .gallery-next {
                        right: 10px;
                    }

                    .gallery-image-container {
                        max-width: calc(100% - 100px);
                        max-height: calc(100% - 180px);
                    }

                    .gallery-thumbnail {
                        width: 48px;
                        height: 48px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ImageGallery;

