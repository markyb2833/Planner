import { io } from 'socket.io-client';

// In production, use same origin for socket. In development, use localhost
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 
    (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin);

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.pendingJoins = []; // Queue for pending room joins
        this.heartbeatInterval = null;
    }

    connect(token) {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(SOCKET_URL, {
            auth: { token },
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('Socket connected');
            this.connected = true;

            // Start heartbeat to keep connection alive and detect stale connections
            this.startHeartbeat();

            // Process any pending room joins
            while (this.pendingJoins.length > 0) {
                const pageId = this.pendingJoins.shift();
                console.log(`Processing pending join for page ${pageId}`);
                this.socket.emit('join-page', pageId);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
            this.connected = false;
            this.stopHeartbeat();
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return this.socket;
    }

    startHeartbeat() {
        // Stop any existing heartbeat
        this.stopHeartbeat();

        // Send a heartbeat every 15 seconds
        this.heartbeatInterval = setInterval(() => {
            if (this.socket?.connected) {
                // Socket.io has built-in ping/pong, but we can also send custom heartbeat
                this.socket.emit('heartbeat');
            }
        }, 15000); // Every 15 seconds
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    disconnect() {
        this.stopHeartbeat();
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    // Page operations
    joinPage(pageId) {
        if (this.socket?.connected) {
            console.log(`Joining page ${pageId}`);
            this.socket.emit('join-page', pageId);
        } else if (this.socket) {
            // Socket exists but not yet connected - queue the join
            console.log(`Socket not ready, queueing join for page ${pageId}`);
            if (!this.pendingJoins.includes(pageId)) {
                this.pendingJoins.push(pageId);
            }
        } else {
            console.warn('Socket not initialized, cannot join page');
        }
    }

    emit(event, data) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        }
    }

    leavePage(pageId) {
        // Remove from pending joins if it was queued
        this.pendingJoins = this.pendingJoins.filter(id => id !== pageId);
        
        if (this.socket?.connected) {
            this.socket.emit('leave-page', pageId);
        }
    }

    // Card operations
    emitCardCreated(pageId, card) {
        if (this.socket?.connected) {
            this.socket.emit('card-created', { pageId, card });
        }
    }

    emitCardUpdated(pageId, cardId, updates) {
        if (this.socket?.connected) {
            this.socket.emit('card-updated', { pageId, cardId, updates });
        }
    }

    emitCardDeleted(pageId, cardId) {
        if (this.socket?.connected) {
            this.socket.emit('card-deleted', { pageId, cardId });
        }
    }

    emitCardMoving(pageId, cardId, x, y) {
        if (this.socket?.connected) {
            this.socket.emit('card-moving', { pageId, cardId, x, y });
        }
    }

    emitCardMoved(pageId, cardId, x, y) {
        if (this.socket?.connected) {
            this.socket.emit('card-moved', { pageId, cardId, x, y });
        }
    }

    emitCardResized(pageId, cardId, width, height) {
        if (this.socket?.connected) {
            this.socket.emit('card-resized', { pageId, cardId, width, height });
        }
    }

    // Link operations
    emitLinkCreated(pageId, link) {
        if (this.socket?.connected) {
            this.socket.emit('link-created', { pageId, link });
        }
    }

    emitLinkUpdated(pageId, linkId, updates) {
        if (this.socket?.connected) {
            this.socket.emit('link-updated', { pageId, linkId, updates });
        }
    }

    emitLinkDeleted(pageId, linkId) {
        if (this.socket?.connected) {
            this.socket.emit('link-deleted', { pageId, linkId });
        }
    }

    // Page operations
    emitPageUpdated(pageId, updates) {
        if (this.socket?.connected) {
            this.socket.emit('page-updated', { pageId, updates });
        }
    }

    // Event listeners
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    getSocket() {
        return this.socket;
    }

    isConnected() {
        return this.connected;
    }
}

const socketService = new SocketService();
export default socketService;
