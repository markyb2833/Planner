import React, { useState, useEffect, useCallback } from 'react';
import { authAPI, pagesAPI } from '../../services/api';

const ShareModal = ({ page, onClose, onShare }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [permissionLevel, setPermissionLevel] = useState('view');
    const [isInviting, setIsInviting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [sharedUsers, setSharedUsers] = useState([]);

    // Debounced search
    const searchUsers = useCallback(async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await authAPI.searchUsers(query);
            // Filter out users who already have access
            const filtered = response.data.users.filter(
                user => !sharedUsers.some(su => su.id === user.id)
            );
            setSearchResults(filtered);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    }, [sharedUsers]);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchUsers(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, searchUsers]);

    // Load currently shared users
    useEffect(() => {
        // This would need a backend endpoint to get shared users for a page
        // For now, we'll just show the UI
    }, [page.id]);

    const handleInvite = async () => {
        if (!selectedUser) {
            setError('Please select a user to invite');
            return;
        }

        setIsInviting(true);
        setError('');
        setSuccess('');

        try {
            await pagesAPI.inviteUser(page.id, {
                user_id: selectedUser.id,
                permission_level: permissionLevel
            });

            setSuccess(`Invitation sent to ${selectedUser.username}!`);
            setSharedUsers(prev => [...prev, { ...selectedUser, permission_level: permissionLevel }]);
            setSelectedUser(null);
            setSearchQuery('');
            setSearchResults([]);

            if (onShare) onShare();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to send invitation');
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div className="share-modal-overlay" onClick={onClose}>
            <div className="share-modal" onClick={e => e.stopPropagation()}>
                <div className="share-modal-header">
                    <div className="share-header-content">
                        <h2>Share "{page.name}"</h2>
                        <p>Invite others to view or edit this page</p>
                    </div>
                    <button className="share-close-btn" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div className="share-modal-body">
                    {/* Search and invite */}
                    <div className="share-invite-section">
                        <div className="share-search-row">
                            <div className="share-search-input-wrapper">
                                <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8"/>
                                    <path d="M21 21l-4.35-4.35"/>
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="share-search-input"
                                />
                                {isSearching && <div className="search-spinner"></div>}
                            </div>
                            <select
                                value={permissionLevel}
                                onChange={(e) => setPermissionLevel(e.target.value)}
                                className="share-permission-select"
                            >
                                <option value="view">Can view</option>
                                <option value="edit">Can edit</option>
                            </select>
                        </div>

                        {/* Search results dropdown */}
                        {searchResults.length > 0 && (
                            <div className="share-search-results">
                                {searchResults.map(user => (
                                    <div
                                        key={user.id}
                                        className={`share-search-result ${selectedUser?.id === user.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <div className="share-user-avatar">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="share-user-info">
                                            <span className="share-user-name">{user.username}</span>
                                            <span className="share-user-email">{user.email}</span>
                                        </div>
                                        {selectedUser?.id === user.id && (
                                            <svg className="check-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected user preview */}
                        {selectedUser && (
                            <div className="share-selected-user">
                                <div className="share-user-avatar large">
                                    {selectedUser.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="share-user-info">
                                    <span className="share-user-name">{selectedUser.username}</span>
                                    <span className="share-user-email">{selectedUser.email}</span>
                                </div>
                                <span className={`permission-badge ${permissionLevel}`}>
                                    {permissionLevel === 'edit' ? '✏️ Editor' : '👁️ Viewer'}
                                </span>
                                <button
                                    className="share-remove-btn"
                                    onClick={() => setSelectedUser(null)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Invite button */}
                        {selectedUser && (
                            <button
                                className="share-invite-btn"
                                onClick={handleInvite}
                                disabled={isInviting}
                            >
                                {isInviting ? (
                                    <>
                                        <span className="btn-spinner"></span>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                                        </svg>
                                        Send Invitation
                                    </>
                                )}
                            </button>
                        )}

                        {/* Messages */}
                        {error && <div className="share-error">{error}</div>}
                        {success && <div className="share-success">{success}</div>}
                    </div>

                    {/* Permission levels explanation */}
                    <div className="share-permissions-info">
                        <h4>Permission Levels</h4>
                        <div className="permission-item">
                            <span className="permission-icon">👁️</span>
                            <div>
                                <strong>Viewer</strong>
                                <p>Can view the page and cards, but cannot make changes</p>
                            </div>
                        </div>
                        <div className="permission-item">
                            <span className="permission-icon">✏️</span>
                            <div>
                                <strong>Editor</strong>
                                <p>Can view, create, edit, and delete cards</p>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    .share-modal-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(4px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 9000;
                        animation: fadeIn 0.2s ease;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    .share-modal {
                        background: white;
                        border-radius: 20px;
                        width: 100%;
                        max-width: 520px;
                        max-height: 90vh;
                        overflow: hidden;
                        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
                        animation: slideUp 0.3s ease;
                    }

                    @keyframes slideUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    .share-modal-header {
                        padding: 24px 28px;
                        border-bottom: 1px solid rgba(102, 126, 234, 0.1);
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
                    }

                    .share-header-content h2 {
                        margin: 0 0 4px 0;
                        font-size: 20px;
                        color: #1a1a2e;
                    }

                    .share-header-content p {
                        margin: 0;
                        color: #666;
                        font-size: 14px;
                    }

                    .share-close-btn {
                        background: rgba(0, 0, 0, 0.05);
                        border: none;
                        width: 36px;
                        height: 36px;
                        border-radius: 10px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #666;
                        transition: all 0.2s ease;
                    }

                    .share-close-btn:hover {
                        background: rgba(0, 0, 0, 0.1);
                        color: #333;
                    }

                    .share-modal-body {
                        padding: 24px 28px;
                        overflow-y: auto;
                        max-height: calc(90vh - 100px);
                    }

                    .share-invite-section {
                        margin-bottom: 24px;
                    }

                    .share-search-row {
                        display: flex;
                        gap: 12px;
                    }

                    .share-search-input-wrapper {
                        flex: 1;
                        position: relative;
                        display: flex;
                        align-items: center;
                    }

                    .search-icon {
                        position: absolute;
                        left: 14px;
                        color: #999;
                    }

                    .share-search-input {
                        width: 100%;
                        padding: 14px 14px 14px 44px;
                        border: 2px solid rgba(102, 126, 234, 0.2);
                        border-radius: 12px;
                        font-size: 14px;
                        transition: all 0.2s ease;
                    }

                    .share-search-input:focus {
                        outline: none;
                        border-color: #667eea;
                        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                    }

                    .search-spinner {
                        position: absolute;
                        right: 14px;
                        width: 18px;
                        height: 18px;
                        border: 2px solid #667eea;
                        border-top-color: transparent;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }

                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }

                    .share-permission-select {
                        padding: 14px 16px;
                        border: 2px solid rgba(102, 126, 234, 0.2);
                        border-radius: 12px;
                        font-size: 14px;
                        background: white;
                        cursor: pointer;
                        min-width: 130px;
                    }

                    .share-permission-select:focus {
                        outline: none;
                        border-color: #667eea;
                    }

                    .share-search-results {
                        margin-top: 8px;
                        border: 2px solid rgba(102, 126, 234, 0.2);
                        border-radius: 12px;
                        max-height: 200px;
                        overflow-y: auto;
                    }

                    .share-search-result {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px 16px;
                        cursor: pointer;
                        transition: background 0.2s ease;
                    }

                    .share-search-result:hover {
                        background: rgba(102, 126, 234, 0.05);
                    }

                    .share-search-result.selected {
                        background: rgba(102, 126, 234, 0.1);
                    }

                    .share-user-avatar {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 16px;
                    }

                    .share-user-avatar.large {
                        width: 48px;
                        height: 48px;
                        font-size: 18px;
                    }

                    .share-user-info {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    }

                    .share-user-name {
                        font-weight: 600;
                        color: #1a1a2e;
                    }

                    .share-user-email {
                        font-size: 13px;
                        color: #666;
                    }

                    .check-icon {
                        color: #667eea;
                    }

                    .share-selected-user {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin-top: 16px;
                        padding: 16px;
                        background: rgba(102, 126, 234, 0.05);
                        border-radius: 12px;
                        border: 2px solid rgba(102, 126, 234, 0.2);
                    }

                    .permission-badge {
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                    }

                    .permission-badge.view {
                        background: rgba(59, 130, 246, 0.1);
                        color: #3b82f6;
                    }

                    .permission-badge.edit {
                        background: rgba(34, 197, 94, 0.1);
                        color: #22c55e;
                    }

                    .share-remove-btn {
                        width: 32px;
                        height: 32px;
                        border-radius: 8px;
                        border: none;
                        background: rgba(220, 53, 69, 0.1);
                        color: #dc3545;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                    }

                    .share-remove-btn:hover {
                        background: rgba(220, 53, 69, 0.2);
                    }

                    .share-invite-btn {
                        width: 100%;
                        margin-top: 16px;
                        padding: 14px 20px;
                        border: none;
                        border-radius: 12px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        transition: all 0.2s ease;
                    }

                    .share-invite-btn:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.35);
                    }

                    .share-invite-btn:disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                    }

                    .btn-spinner {
                        width: 18px;
                        height: 18px;
                        border: 2px solid white;
                        border-top-color: transparent;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }

                    .share-error {
                        margin-top: 12px;
                        padding: 12px 16px;
                        background: rgba(220, 53, 69, 0.1);
                        border-radius: 10px;
                        color: #dc3545;
                        font-size: 14px;
                    }

                    .share-success {
                        margin-top: 12px;
                        padding: 12px 16px;
                        background: rgba(34, 197, 94, 0.1);
                        border-radius: 10px;
                        color: #22c55e;
                        font-size: 14px;
                    }

                    .share-permissions-info {
                        padding: 20px;
                        background: rgba(102, 126, 234, 0.03);
                        border-radius: 12px;
                        border: 1px solid rgba(102, 126, 234, 0.1);
                    }

                    .share-permissions-info h4 {
                        margin: 0 0 16px 0;
                        font-size: 14px;
                        color: #1a1a2e;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .permission-item {
                        display: flex;
                        gap: 12px;
                        margin-bottom: 12px;
                    }

                    .permission-item:last-child {
                        margin-bottom: 0;
                    }

                    .permission-icon {
                        font-size: 20px;
                    }

                    .permission-item strong {
                        display: block;
                        color: #1a1a2e;
                        margin-bottom: 2px;
                    }

                    .permission-item p {
                        margin: 0;
                        font-size: 13px;
                        color: #666;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default ShareModal;

