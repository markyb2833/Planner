const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Socket.io handler for real-time collaboration
 */
const setupSocketHandlers = (io) => {
    // In-memory storage for active users per page
    const activeUsersPerPage = new Map(); // pageId -> Map of userId -> { username, socketId, lastHeartbeat }

    // Configure socket.io with shorter timeouts for faster disconnect detection
    io.engine.on("connection", (rawSocket) => {
        rawSocket.on("heartbeat", () => {
            // Update heartbeat timestamp when we receive a ping
            const socket = io.sockets.sockets.get(rawSocket.id);
            if (socket && socket.currentPageId && socket.userId) {
                const pageUsers = activeUsersPerPage.get(socket.currentPageId);
                if (pageUsers && pageUsers.has(socket.userId)) {
                    const user = pageUsers.get(socket.userId);
                    user.lastHeartbeat = Date.now();
                }
            }
        });
    });

    // Periodic cleanup of stale connections (every 10 seconds)
    setInterval(() => {
        const now = Date.now();
        const staleTimeout = 30000; // 30 seconds without heartbeat = stale

        activeUsersPerPage.forEach((users, pageId) => {
            const staleUsers = [];
            users.forEach((user, userId) => {
                if (now - user.lastHeartbeat > staleTimeout) {
                    staleUsers.push({ userId, username: user.username });
                    users.delete(userId);
                }
            });

            // Clean up empty page entries
            if (users.size === 0) {
                activeUsersPerPage.delete(pageId);
            }

            // Broadcast updated active users if anyone was removed
            if (staleUsers.length > 0) {
                const activeUsers = Array.from(users.values()).map(u => ({
                    userId: u.userId,
                    username: u.username
                }));
                io.to(`page-${pageId}`).emit('active-users', activeUsers);

                console.log(`Removed ${staleUsers.length} stale user(s) from page ${pageId}`);
            }
        });
    }, 10000); // Check every 10 seconds

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

    /**
     * Helper: Get active users for a page
     */
    const getActiveUsers = (pageId) => {
        const users = activeUsersPerPage.get(pageId);
        if (!users) return [];
        return Array.from(users.values()).map(u => ({
            userId: u.userId,
            username: u.username
        }));
    };

    /**
     * Helper: Add user to active users list
     */
    const addActiveUser = (pageId, userId, username, socketId) => {
        if (!activeUsersPerPage.has(pageId)) {
            activeUsersPerPage.set(pageId, new Map());
        }
        const pageUsers = activeUsersPerPage.get(pageId);
        pageUsers.set(userId, { userId, username, socketId, lastHeartbeat: Date.now() });
    };

    /**
     * Helper: Remove user from active users list
     */
    const removeActiveUser = (pageId, userId) => {
        const pageUsers = activeUsersPerPage.get(pageId);
        if (pageUsers) {
            pageUsers.delete(userId);
            if (pageUsers.size === 0) {
                activeUsersPerPage.delete(pageId);
            }
        }
    };

    /**
     * Helper: Remove user from all pages (on disconnect)
     */
    const removeUserFromAllPages = (socketId) => {
        const pagesToCleanup = [];
        activeUsersPerPage.forEach((users, pageId) => {
            const userToRemove = Array.from(users.values()).find(u => u.socketId === socketId);
            if (userToRemove) {
                pagesToCleanup.push({ pageId, userId: userToRemove.userId });
            }
        });
        return pagesToCleanup;
    };

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.username} (${socket.userId})`);

        /**
         * Handle heartbeat to update last activity timestamp
         */
        socket.on('heartbeat', () => {
            if (socket.currentPageId && socket.userId) {
                const pageUsers = activeUsersPerPage.get(socket.currentPageId);
                if (pageUsers && pageUsers.has(socket.userId)) {
                    const user = pageUsers.get(socket.userId);
                    user.lastHeartbeat = Date.now();
                }
            }
        });

        /**
         * Join a page room
         */
        socket.on('join-page', (pageId) => {
            socket.join(`page-${pageId}`);
            socket.currentPageId = pageId;
            console.log(`${socket.username} joined page ${pageId}`);

            // Add to active users
            addActiveUser(pageId, socket.userId, socket.username, socket.id);

            // Get updated list of active users
            const activeUsers = getActiveUsers(pageId);

            // Send active users to the joining user
            socket.emit('active-users', activeUsers);

            // Notify others in the room
            socket.to(`page-${pageId}`).emit('user-joined', {
                userId: socket.userId,
                username: socket.username
            });

            // Broadcast updated active users list to all in room
            io.to(`page-${pageId}`).emit('active-users', activeUsers);
        });

        /**
         * Leave a page room
         */
        socket.on('leave-page', (pageId) => {
            socket.leave(`page-${pageId}`);
            socket.currentPageId = null;
            console.log(`${socket.username} left page ${pageId}`);

            // Remove from active users
            removeActiveUser(pageId, socket.userId);

            // Get updated list of active users
            const activeUsers = getActiveUsers(pageId);

            // Notify others in the room
            socket.to(`page-${pageId}`).emit('user-left', {
                userId: socket.userId,
                username: socket.username
            });

            // Broadcast updated active users list to all in room
            io.to(`page-${pageId}`).emit('active-users', activeUsers);
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
         * Kick a user from a page (owner only - verified via backend API)
         */
        socket.on('kick-user', ({ pageId, userId, kickedByUserId }) => {
            console.log(`User ${kickedByUserId} attempting to kick user ${userId} from page ${pageId}`);

            // Find the socket of the user to be kicked
            const roomSockets = io.sockets.adapter.rooms.get(`page-${pageId}`);
            if (roomSockets) {
                roomSockets.forEach((socketId) => {
                    const targetSocket = io.sockets.sockets.get(socketId);
                    if (targetSocket && targetSocket.userId === userId) {
                        // Remove from active users
                        removeActiveUser(pageId, userId);

                        // Notify the kicked user
                        targetSocket.emit('kicked-from-page', {
                            pageId,
                            message: 'You have been removed from this page'
                        });

                        // Force leave the room
                        targetSocket.leave(`page-${pageId}`);

                        // Update active users for remaining users
                        const activeUsers = getActiveUsers(pageId);
                        io.to(`page-${pageId}`).emit('active-users', activeUsers);
                    }
                });
            }
        });

        /**
         * Disconnect
         */
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.username} (${socket.userId})`);

            // Remove user from all pages they were viewing
            const pagesToCleanup = removeUserFromAllPages(socket.id);

            // Notify each page room about the user leaving
            pagesToCleanup.forEach(({ pageId, userId }) => {
                const activeUsers = getActiveUsers(pageId);

                socket.to(`page-${pageId}`).emit('user-left', {
                    userId,
                    username: socket.username
                });

                io.to(`page-${pageId}`).emit('active-users', activeUsers);
            });
        });
    });
};

module.exports = setupSocketHandlers;
