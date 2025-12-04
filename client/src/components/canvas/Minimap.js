import React, { useRef, useEffect } from 'react';
import '../../styles/Minimap.css';

const Minimap = ({ cards, page, zoom, pan, onJumpTo, canvasRef }) => {
    const minimapRef = useRef(null);
    const MINIMAP_WIDTH = 200;
    const MINIMAP_HEIGHT = 150;

    useEffect(() => {
        if (!minimapRef.current || !page) return;

        const canvas = minimapRef.current;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

        // Calculate scale
        const canvasWidth = page.canvas_max_width || 5000;
        const canvasHeight = page.canvas_max_height || 5000;
        const scaleX = MINIMAP_WIDTH / canvasWidth;
        const scaleY = MINIMAP_HEIGHT / canvasHeight;
        const scale = Math.min(scaleX, scaleY);

        // Draw background
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

        // Draw border
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

        // Draw cards
        cards.forEach(card => {
            const x = card.x_position * scale;
            const y = card.y_position * scale;
            const w = card.width * scale;
            const h = card.height * scale;

            ctx.fillStyle = card.background_color || '#ffffff';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, w, h);
        });

        // Draw viewport indicator
        if (canvasRef?.current) {
            const viewportWidth = canvasRef.current.clientWidth;
            const viewportHeight = canvasRef.current.clientHeight;

            // Calculate viewport position in canvas coordinates
            const viewX = (-pan.x / zoom) * scale;
            const viewY = (-pan.y / zoom) * scale;
            const viewW = (viewportWidth / zoom) * scale;
            const viewH = (viewportHeight / zoom) * scale;

            ctx.strokeStyle = '#4f46e5';
            ctx.lineWidth = 2;
            ctx.strokeRect(viewX, viewY, viewW, viewH);
            ctx.fillStyle = 'rgba(79, 70, 229, 0.1)';
            ctx.fillRect(viewX, viewY, viewW, viewH);
        }
    }, [cards, page, zoom, pan, canvasRef]);

    const handleMinimapClick = (e) => {
        if (!page || !canvasRef?.current) return;

        const rect = minimapRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const canvasWidth = page.canvas_max_width || 5000;
        const canvasHeight = page.canvas_max_height || 5000;
        const scaleX = MINIMAP_WIDTH / canvasWidth;
        const scaleY = MINIMAP_HEIGHT / canvasHeight;
        const scale = Math.min(scaleX, scaleY);

        // Convert minimap coordinates to canvas coordinates
        const targetX = x / scale;
        const targetY = y / scale;

        // Calculate viewport center offset
        const viewportWidth = canvasRef.current.clientWidth;
        const viewportHeight = canvasRef.current.clientHeight;
        const centerX = targetX - (viewportWidth / zoom) / 2;
        const centerY = targetY - (viewportHeight / zoom) / 2;

        onJumpTo(centerX, centerY);
    };

    if (!page) return null;

    return (
        <div className="minimap-container">
            <canvas
                ref={minimapRef}
                width={MINIMAP_WIDTH}
                height={MINIMAP_HEIGHT}
                onClick={handleMinimapClick}
                className="minimap-canvas"
            />
        </div>
    );
};

export default Minimap;
