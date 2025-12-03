import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAuth } from '../../contexts/AuthContext';
import { pagesAPI } from '../../services/api';
import Sidebar from './Sidebar';
import PageGroup from './PageGroup';
import InvitationsPanel from '../common/InvitationsPanel';
import '../../styles/Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [pages, setPages] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [newPageName, setNewPageName] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pagesResponse, groupsResponse] = await Promise.all([
                pagesAPI.getPages(),
                pagesAPI.getGroups()
            ]);
            setPages(pagesResponse.data.pages);
            setGroups(groupsResponse.data.groups);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePage = async (e) => {
        e.preventDefault();
        if (!newPageName.trim()) return;

        try {
            await pagesAPI.createPage({
                name: newPageName,
                group_id: selectedGroup
            });
            setNewPageName('');
            setSelectedGroup(null);
            setShowCreateModal(false);
            fetchData();
        } catch (error) {
            console.error('Failed to create page:', error);
            alert('Failed to create page');
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        try {
            await pagesAPI.createGroup({ name: newGroupName });
            setNewGroupName('');
            setShowCreateGroupModal(false);
            fetchData();
        } catch (error) {
            console.error('Failed to create group:', error);
            alert('Failed to create group');
        }
    };

    const handleDeletePage = async (pageId) => {
        if (!window.confirm('Are you sure you want to delete this page?')) return;

        try {
            await pagesAPI.deletePage(pageId);
            fetchData();
        } catch (error) {
            console.error('Failed to delete page:', error);
            alert('Failed to delete page');
        }
    };

    const openPage = (pageId) => {
        navigate(`/page/${pageId}`);
    };

    const handleMoveToGroup = async (pageId, targetGroupName) => {
        try {
            // Find the page to check if user owns it
            const page = pages.find(p => p.id === pageId);
            if (!page) return;

            // Find the group ID from the group name
            const targetGroup = groups.find(g => g.name === targetGroupName);
            const groupId = targetGroupName === 'Ungrouped' ? null : targetGroup?.id;

            // If the user owns the page, update the page directly
            // If the user doesn't own it (shared page), update user's personal preference
            if (page.permission === 'owner') {
                await pagesAPI.updatePage(pageId, { group_id: groupId });
            } else {
                // For shared pages, use the user-specific group preference endpoint
                await pagesAPI.updateUserPageGroup(pageId, groupId);
            }

            fetchData(); // Refresh the page list
        } catch (error) {
            console.error('Failed to move page:', error);
            alert('Failed to move page to group');
        }
    };

    const handleDeleteGroup = async (groupId, groupName) => {
        if (!window.confirm(`Delete the group "${groupName}"?`)) return;

        try {
            await pagesAPI.deleteGroup(groupId);
            fetchData(); // Refresh to update groups list
        } catch (error) {
            console.error('Failed to delete group:', error);
            alert(error.response?.data?.error || 'Failed to delete group');
        }
    };

    // Group pages by group - include all groups even if empty
    const groupedPages = {};

    // Add all groups first (even empty ones) - these are the user's groups
    groups.forEach(group => {
        groupedPages[group.name] = [];
    });

    // Add ungrouped as well
    groupedPages['Ungrouped'] = [];

    // Now add pages to their groups
    pages.forEach(page => {
        const groupName = page.group_name || 'Ungrouped';
        // Only add to groups that we've already defined (user's groups + Ungrouped)
        // This prevents showing groups from other users
        if (groupedPages[groupName] !== undefined) {
            groupedPages[groupName].push(page);
        } else {
            // If the page has a group_name that doesn't exist in our groups, treat as Ungrouped
            groupedPages['Ungrouped'].push(page);
        }
    });

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <DndProvider backend={HTML5Backend} key="dashboard-dnd">
            <div className="dashboard-container">
                <Sidebar
                pages={pages}
                groups={groups}
                onPageClick={openPage}
                onCreatePage={() => setShowCreateModal(true)}
                onCreateGroup={() => setShowCreateGroupModal(true)}
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <header className="dashboard-header">
                    <h1>My Planner</h1>
                    <div className="header-actions">
                        <span className="user-name">Hello, {user?.username}</span>
                        <button onClick={logout} className="btn-secondary">
                            Logout
                        </button>
                    </div>
                </header>

                <div className="dashboard-content">
                    {/* Pending Invitations */}
                    <InvitationsPanel onInvitationResponse={(action) => {
                        if (action === 'accept') {
                            fetchData(); // Refresh pages list when invitation is accepted
                        }
                    }} />
                    
                    <div className="dashboard-actions">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary btn-large"
                        >
                            + Create New Page
                        </button>
                        <button
                            onClick={() => setShowCreateGroupModal(true)}
                            className="btn-secondary"
                        >
                            Create Group
                        </button>
                    </div>

                    {pages.length === 0 ? (
                        <div className="empty-state">
                            <h2>No pages yet</h2>
                            <p>Create your first page to get started!</p>
                        </div>
                    ) : (
                        <div className="pages-grid">
                            {Object.entries(groupedPages).map(([groupName, groupPages]) => {
                                const group = groups.find(g => g.name === groupName);
                                return (
                                    <PageGroup
                                        key={groupName}
                                        groupName={groupName}
                                        groupId={group?.id}
                                        pages={groupPages}
                                        onPageOpen={openPage}
                                        onPageDelete={handleDeletePage}
                                        onPageDrop={handleMoveToGroup}
                                        onGroupDelete={handleDeleteGroup}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Page Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Create New Page</h2>
                        <form onSubmit={handleCreatePage}>
                            <div className="form-group">
                                <label htmlFor="pageName">Page Name</label>
                                <input
                                    type="text"
                                    id="pageName"
                                    value={newPageName}
                                    onChange={(e) => setNewPageName(e.target.value)}
                                    placeholder="Enter page name"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="pageGroup">Group (Optional)</label>
                                <select
                                    id="pageGroup"
                                    value={selectedGroup || ''}
                                    onChange={(e) => setSelectedGroup(e.target.value || null)}
                                >
                                    <option value="">No Group</option>
                                    {groups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateGroupModal && (
                <div className="modal-overlay" onClick={() => setShowCreateGroupModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Create New Group</h2>
                        <form onSubmit={handleCreateGroup}>
                            <div className="form-group">
                                <label htmlFor="groupName">Group Name</label>
                                <input
                                    type="text"
                                    id="groupName"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Enter group name"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateGroupModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </DndProvider>
    );
};

export default Dashboard;
