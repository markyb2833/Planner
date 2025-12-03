const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Socket.io handler for real-time collaboration
 */
const setupSocketHandlers = (io) => {
    // Middleware to authenticate socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            socket.username = decoded.username;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.username} (${socket.userId})`);

        /**
         * Join a page room
         */
        socket.on('join-page', (pageId) => {
            socket.join(`page-${pageId}`);
            console.log(`${socket.username} joined page ${pageId}`);

            // Notify others in the room
            socket.to(`page-${pageId}`).emit('user-joined', {
                userId: socket.userId,
                username: socket.username
            });
        });

        /**
         * Leave a page room
         */
        socket.on('leave-page', (pageId) => {
            socket.leave(`page-${pageId}`);
            console.log(`${socket.username} left page ${pageId}`);

            // Notify others in the room
            socket.to(`page-${pageId}`).emit('user-left', {
                userId: socket.userId,
                username: socket.username
            });
        });

        /**
         * Card created
         */
        socket.on('card-created', ({ pageId, card }) => {
            socket.to(`page-${pageId}`).emit('card-created', {
                card,
                userId: socket.userId,
                username: socket.username
            });
        });

        /**
         * Card updated
         */
        socket.on('card-updated', ({ pageId, cardId, updates }) => {
            socket.to(`page-${pageId}`).emit('card-updated', {
                cardId,
                updates,
                userId: socket.userId,
                username: socket.username
            });
        });

        /**
         * Card deleted
         */
        socket.on('card-deleted', ({ pageId, cardId }) => {
            socket.to(`page-${pageId}`).emit('card-deleted', {
                cardId,
                userId: socket.userId,
                username: socket.username
            });
        });

        /**
         * Card moved (real-time drag)
         */
        socket.on('card-moving', ({ pageId, cardId, x, y }) => {
            socket.to(`page-${pageId}`).emit('card-moving', {
                cardId,
                x,
                y,
                userId: socket.userId
            });
        });

        /**
         * Card move completed
         */
        socket.on('card-moved', ({ pageId, cardId, x, y }) => {
            socket.to(`page-${pageId}`).emit('card-moved', {
                cardId,
                x,
                y,
                userId: socket.userId,
                username: socket.username
            });
        });

        /**
         * Card resized
         */
        socket.on('card-resized', ({ pageId, cardId, width, height }) => {
            socket.to(`page-${pageId}`).emit('card-resized', {
                cardId,
                width,
                height,
                userId: socket.userId,
                username: socket.username
            });
        });

        /**
         * Link created
         */
        socket.on('link-created', ({ pageId, link }) => {
            socket.to(`page-${pageId}`).emit('link-created', {
                link,
                userId: socket.userId,
                username: socket.username
            });
        });

        /**
         * Link updated
         */
        socket.on('link-updated', ({ pageId, linkId, updates }) => {
            socket.to(`page-${pageId}`).emit('link-updated', {
                linkId,
                updates,
                userId: socket.userId,
                username: socket.username
            });
        });

        /**
         * Link deleted
         */
        socket.on('link-deleted', ({ pageId, linkId }) => {
            socket.to(`page-${pageId}`).emit('link-deleted', {
                linkId,
                userId: socket.userId,
                username: socket.username
            });
        });

        /**
         * Page updated
         */
        socket.on('page-updated', ({ pageId, updates }) => {
            socket.to(`page-${pageId}`).emit('page-updated', {
                updates,
                userId: socket.userId,
                username: socket.username
            });
        });

        /**
         * User is typing/editing (for showing cursor or activity indicator)
         */
        socket.on('user-activity', ({ pageId, cardId, activity }) => {
            socket.to(`page-${pageId}`).emit('user-activity', {
                userId: socket.userId,
                username: socket.username,
                cardId,
                activity
            });
        });

        /**
         * Disconnect
         */
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.username} (${socket.userId})`);
        });
    });
};

module.exports = setupSocketHandlers;
