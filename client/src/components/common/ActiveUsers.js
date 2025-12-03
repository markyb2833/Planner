import React, { useEffect, useState } from 'react';
import socketService from '../../services/socket';
import './ActiveUsers.css';

const ActiveUsers = ({ pageId, currentUserId }) => {
    const [activeUsers, setActiveUsers] = useState([]);

    useEffect(() => {
        if (!pageId) return;

        // Listen for active users updates
        const handleActiveUsers = (users) => {
            // Filter out current user and update state
            setActiveUsers(users.filter(u => u.userId !== currentUserId));
        };

        // Listen for individual user join/leave events
        const handleUserJoined = (user) => {
            if (user.userId !== currentUserId) {
                setActiveUsers(prev => {
                    // Avoid duplicates
                    if (prev.some(u => u.userId === user.userId)) {
                        return prev;
                    }
                    return [...prev, user];
                });
            }
        };

        const handleUserLeft = (user) => {
            setActiveUsers(prev => prev.filter(u => u.userId !== user.userId));
        };

        // Subscribe to socket events
        socketService.on('active-users', handleActiveUsers);
        socketService.on('user-joined', handleUserJoined);
        socketService.on('user-left', handleUserLeft);

        // Request current active users when component mounts
        // This ensures we get the list even if we missed the initial emission
        socketService.emit('request-active-users', { pageId });

        // Cleanup
        return () => {
            socketService.off('active-users', handleActiveUsers);
            socketService.off('user-joined', handleUserJoined);
            socketService.off('user-left', handleUserLeft);
        };
    }, [pageId, currentUserId]);

    if (activeUsers.length === 0) {
        return null;
    }

    return (
        <div className="active-users-container">
            <div className="active-users-label">Currently viewing:</div>
            <div className="active-users-list">
                {activeUsers.map((user) => (
                    <div key={user.userId} className="active-user-avatar" title={user.username}>
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActiveUsers;
