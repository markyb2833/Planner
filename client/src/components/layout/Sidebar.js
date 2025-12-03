import React, { useState } from 'react';
import '../../styles/Sidebar.css';

const Sidebar = ({ pages, groups, onPageClick, onCreatePage, onCreateGroup, collapsed, onToggle }) => {
    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroup = (groupName) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    // Group pages by group - include all groups even if empty
    const groupedPages = {};

    // Add all groups first (even empty ones)
    groups.forEach(group => {
        groupedPages[group.name] = [];
    });

    // Add ungrouped as well
    groupedPages['Ungrouped'] = [];

    // Now add pages to their groups
    pages.forEach(page => {
        const groupName = page.group_name || 'Ungrouped';
        if (!groupedPages[groupName]) {
            groupedPages[groupName] = [];
        }
        groupedPages[groupName].push(page);
    });

    return (
        <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
                    {collapsed ? '→' : '←'}
                </button>
                {!collapsed && <h2>Planner</h2>}
            </div>

            {!collapsed && (
                <>
                    <div className="sidebar-actions">
                        <button onClick={onCreatePage} className="btn-primary btn-block">
                            + New Page
                        </button>
                        <button onClick={onCreateGroup} className="btn-secondary btn-block btn-small">
                            + Group
                        </button>
                    </div>

                    <div className="sidebar-content">
                        {Object.entries(groupedPages).map(([groupName, groupPages]) => (
                            <div key={groupName} className="sidebar-group">
                                <div
                                    className="sidebar-group-header"
                                    onClick={() => toggleGroup(groupName)}
                                >
                                    <span className="group-arrow">
                                        {expandedGroups[groupName] ? '▼' : '▶'}
                                    </span>
                                    <span className="group-name">{groupName}</span>
                                    <span className="group-count">{groupPages.length}</span>
                                </div>
                                {expandedGroups[groupName] && (
                                    <div className="sidebar-pages">
                                        {groupPages.length === 0 ? (
                                            <div className="sidebar-empty-group">
                                                No pages in this group
                                            </div>
                                        ) : (
                                            groupPages.map((page) => (
                                                <div
                                                    key={page.id}
                                                    className="sidebar-page"
                                                    onClick={() => onPageClick(page.id)}
                                                >
                                                    <div
                                                        className="page-color"
                                                        style={{ backgroundColor: page.background_color }}
                                                    />
                                                    <span className="page-name">{page.name}</span>
                                                    <span className="page-icon">
                                                        {page.permission === 'owner'
                                                            ? '👑'
                                                            : page.permission === 'edit'
                                                            ? '✏️'
                                                            : '👁️'}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {pages.length === 0 && (
                            <div className="sidebar-empty">
                                <p>No pages yet</p>
                                <p>Create your first page to get started</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Sidebar;
