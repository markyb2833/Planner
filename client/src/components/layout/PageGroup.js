import React, { useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import PageCard from './PageCard';

const PageGroup = ({ groupName, pages, onPageOpen, onPageDelete, onPageDrop }) => {
    const groupRef = useRef(null);
    
    const [{ isOver, canDrop }, drop] = useDrop({
        accept: 'PAGE',
        drop: (item) => {
            if (onPageDrop) {
                onPageDrop(item.id, groupName);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop()
        })
    });

    // Connect drop ref safely
    useEffect(() => {
        if (groupRef.current) {
            drop(groupRef.current);
        }
    }, [drop]);

    const dropZoneActive = isOver && canDrop;

    return (
        <div
            ref={groupRef}
            className={`page-group ${dropZoneActive ? 'drop-active' : ''}`}
            style={{
                borderColor: dropZoneActive ? 'rgba(102, 126, 234, 0.8)' : 'rgba(255, 255, 255, 0.2)',
                backgroundColor: dropZoneActive
                    ? 'rgba(102, 126, 234, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)'
            }}
        >
            <h3 className="group-title">
                {groupName}
                {dropZoneActive && <span className="drop-indicator"> ⬅ Drop here</span>}
            </h3>
            {pages.length === 0 && !dropZoneActive ? (
                <div className="empty-group-message">
                    No pages in this group. Drag pages here to add them.
                </div>
            ) : (
                <div className="pages-list">
                    {pages.map((page) => (
                        <PageCard
                            key={page.id}
                            page={page}
                            onOpen={onPageOpen}
                            onDelete={onPageDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PageGroup;
