import React, { useState, useEffect, useCallback } from 'react';
import { pagesAPI } from '../../services/api';

const InvitationsPanel = ({ onInvitationResponse }) => {
    const [invitations, setInvitations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [respondingTo, setRespondingTo] = useState(null);

    const fetchInvitations = useCallback(async () => {
        try {
            const response = await pagesAPI.getPendingInvitations();
            setInvitations(response.data.invitations || []);
        } catch (error) {
            console.error('Failed to fetch invitations:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvitations();
    }, [fetchInvitations]);

    const handleResponse = async (invitationId, action) => {
        setRespondingTo(invitationId);
        try {
            await pagesAPI.respondToInvitation(invitationId, action);
            setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
            if (onInvitationResponse) {
                onInvitationResponse(action);
            }
        } catch (error) {
            console.error('Failed to respond to invitation:', error);
        } finally {
            setRespondingTo(null);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="invitations-panel loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (invitations.length === 0) {
        return null; // Don't show anything if no invitations
    }

    return (
        <div className="invitations-panel">
            <div className="invitations-header">
                <div className="invitations-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                    </svg>
                </div>
                <span>Pending Invitations</span>
                <span className="invitation-count">{invitations.length}</span>
            </div>

            <div className="invitations-list">
                {invitations.map(invitation => (
                    <div key={invitation.id} className="invitation-item">
                        <div className="invitation-info">
                            <div className="invitation-page-name">{invitation.page_name}</div>
                            <div className="invitation-details">
                                <span className="invitation-from">from {invitation.invited_by_username}</span>
                                <span className="invitation-dot">•</span>
                                <span className={`invitation-permission ${invitation.permission_level}`}>
                                    {invitation.permission_level === 'edit' ? '✏️ Editor' : '👁️ Viewer'}
                                </span>
                                <span className="invitation-dot">•</span>
                                <span className="invitation-date">{formatDate(invitation.invited_at)}</span>
                            </div>
                        </div>
                        <div className="invitation-actions">
                            <button
                                className="invitation-btn accept"
                                onClick={() => handleResponse(invitation.id, 'accept')}
                                disabled={respondingTo === invitation.id}
                            >
                                {respondingTo === invitation.id ? (
                                    <span className="btn-spinner"></span>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                        Accept
                                    </>
                                )}
                            </button>
                            <button
                                className="invitation-btn decline"
                                onClick={() => handleResponse(invitation.id, 'decline')}
                                disabled={respondingTo === invitation.id}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .invitations-panel {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
                    border-radius: 16px;
                    border: 1px solid rgba(102, 126, 234, 0.2);
                    overflow: hidden;
                    margin-bottom: 20px;
                }

                .invitations-panel.loading {
                    padding: 40px;
                    display: flex;
                    justify-content: center;
                }

                .loading-spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid rgba(102, 126, 234, 0.2);
                    border-top-color: #667eea;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .invitations-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px 18px;
                    background: rgba(102, 126, 234, 0.1);
                    font-weight: 600;
                    color: #1a1a2e;
                    font-size: 14px;
                }

                .invitations-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .invitation-count {
                    margin-left: auto;
                    background: #667eea;
                    color: white;
                    padding: 3px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 700;
                }

                .invitations-list {
                    padding: 8px;
                }

                .invitation-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 14px 16px;
                    background: white;
                    border-radius: 12px;
                    margin-bottom: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                }

                .invitation-item:last-child {
                    margin-bottom: 0;
                }

                .invitation-info {
                    flex: 1;
                    min-width: 0;
                }

                .invitation-page-name {
                    font-weight: 600;
                    color: #1a1a2e;
                    margin-bottom: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .invitation-details {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 6px;
                    font-size: 12px;
                    color: #666;
                }

                .invitation-dot {
                    color: #ccc;
                }

                .invitation-permission {
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 11px;
                }

                .invitation-permission.view {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                }

                .invitation-permission.edit {
                    background: rgba(34, 197, 94, 0.1);
                    color: #22c55e;
                }

                .invitation-actions {
                    display: flex;
                    gap: 8px;
                }

                .invitation-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 8px 14px;
                    border: none;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .invitation-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .invitation-btn.accept {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .invitation-btn.accept:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }

                .invitation-btn.decline {
                    background: rgba(220, 53, 69, 0.1);
                    color: #dc3545;
                    padding: 8px 10px;
                }

                .invitation-btn.decline:hover:not(:disabled) {
                    background: rgba(220, 53, 69, 0.2);
                }

                .btn-spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid white;
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @media (max-width: 600px) {
                    .invitation-item {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .invitation-actions {
                        width: 100%;
                        margin-top: 12px;
                    }

                    .invitation-btn.accept {
                        flex: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default InvitationsPanel;

