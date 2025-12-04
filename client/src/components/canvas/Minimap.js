import React, { useRef, useEffect, useState } from 'react';
import '../../styles/Minimap.css';

const Minimap = ({ cards, page, zoom, pan, onJumpTo, canvasRef }) => {
    const minimapRef = useRef(null);
    const [minimapDimensions, setMinimapDimensions] = useState({ width: 200, height: 150 });

    // Calculate minimap dimensions to match canvas aspect ratio
    useEffect(() => {
        if (!page) return;

        const canvasWidth = page.canvas_max_width || 5000;
        const canvasHeight = page.canvas_max_height || 5000;
        const aspectRatio = canvasWidth / canvasHeight;

        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;

        let width, height;

        if (aspectRatio > 1) {
            // Landscape - width is limiting factor
            width = MAX_WIDTH;
            height = MAX_WIDTH / aspectRatio;
        } else {
            // Portrait or square - height is limiting factor
            height = MAX_HEIGHT;
            width = MAX_HEIGHT * aspectRatio;
        }

        setMinimapDimensions({ width: Math.round(width), height: Math.round(height) });
    }, [page]);

    useEffect(() => {
        if (!minimapRef.current || !page) return;

        const canvas = minimapRef.current;
        const ctx = canvas.getContext('2d');
        const { width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT } = minimapDimensions;

        // Clear canvas
        ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

        // Calculate scale
        const canvasWidth = page.canvas_max_width || 5000;
        const canvasHeight = page.canvas_max_height || 5000;
        const scaleX = MINIMAP_WIDTH / canvasWidth;
        const scaleY = MINIMAP_HEIGHT / canvasHeight;
        const scale = Math.min(scaleX, scaleY);

        // Draw canvas background (use page background color)
        ctx.fillStyle = page.background_color || '#ffffff';
        ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

        // Draw border around canvas area
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
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
    }, [cards, page, zoom, pan, canvasRef, minimapDimensions]);

    const handleMinimapClick = (e) => {
        if (!page || !canvasRef?.current) return;

        const rect = minimapRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const canvasWidth = page.canvas_max_width || 5000;
        const canvasHeight = page.canvas_max_height || 5000;
        const { width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT } = minimapDimensions;
        const scaleX = MINIMAP_WIDTH / canvasWidth;
        const scaleY = MINIMAP_HEIGHT / canvasHeight;
        const scale = Math.min(scaleX, scaleY);

        // Convert minimap coordinates to canvas coordinates
        const targetX = x / scale;
        const targetY = y / scale;

        // Calculate viewport center offset
        const viewportWidth = canvasRef.current.clientWidth;
        const viewportHeight = canvasRef.current.clientHeight;
        let centerX = targetX - (viewportWidth / zoom) / 2;
        let centerY = targetY - (viewportHeight / zoom) / 2;

        // Clamp to canvas boundaries to prevent panning off edge
        const minX = 0;
        const minY = 0;
        const maxX = Math.max(0, canvasWidth - viewportWidth / zoom);
        const maxY = Math.max(0, canvasHeight - viewportHeight / zoom);

        centerX = Math.max(minX, Math.min(maxX, centerX));
        centerY = Math.max(minY, Math.min(maxY, centerY));

        onJumpTo(centerX, centerY);
    };

    if (!page) return null;

    return (
        <div className="minimap-container">
            <canvas
                ref={minimapRef}
                width={minimapDimensions.width}
                height={minimapDimensions.height}
                onClick={handleMinimapClick}
                className="minimap-canvas"
            />
        </div>
    );
};

export default Minimap;
