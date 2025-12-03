import React, { useState, useEffect } from 'react';
import ImageUpload from '../common/ImageUpload';
import ImageGallery from '../common/ImageGallery';

const CardModal = ({ card, onClose, onUpdate, onDelete, pageId }) => {
    const [activeTab, setActiveTab] = useState('content');
    const [formData, setFormData] = useState({
        title: card.title || '',
        content: card.content || '',
        card_type: card.card_type || 'text',
        background_color: card.background_color || '#FFFFFF',
        text_color: card.text_color || '#1a1a2e',
        font_size: card.font_size || 14,
        background_image: card.background_image || '',
        notes: card.notes || '',
        work_start_date: card.work_start_date ? card.work_start_date.split('T')[0] : '',
        work_end_date: card.work_end_date ? card.work_end_date.split('T')[0] : ''
    });

    const [listItems, setListItems] = useState([]);
    const [newListItem, setNewListItem] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Image gallery state
    const [images, setImages] = useState([]);
    const [showGallery, setShowGallery] = useState(false);
    const [galleryStartIndex, setGalleryStartIndex] = useState(0);

    useEffect(() => {
        if (card.card_type === 'list' && card.list_items) {
            try {
                const items = typeof card.list_items === 'string' 
                    ? JSON.parse(card.list_items) 
                    : card.list_items;
                if (Array.isArray(items)) {
                    setListItems(items);
                }
            } catch (e) {
                setListItems([]);
            }
        }
        
        // Load images for image type cards
        if (card.card_type === 'image') {
            let imageList = [];
            // Try to parse images from list_items (for multiple images)
            if (card.list_items) {
                try {
                    const parsed = typeof card.list_items === 'string' 
                        ? JSON.parse(card.list_items) 
                        : card.list_items;
                    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                        imageList = parsed;
                    }
                } catch (e) {}
            }
            // If no images in list_items but has background_image, use that
            if (imageList.length === 0 && card.background_image) {
                imageList = [card.background_image];
            }
            setImages(imageList);
        }
    }, [card]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddListItem = () => {
        if (newListItem.trim()) {
            setListItems(prev => [...prev, { text: newListItem, completed: false }]);
            setNewListItem('');
        }
    };

    const handleToggleListItem = (index) => {
        setListItems(prev => prev.map((item, i) =>
            i === index ? { ...item, completed: !item.completed } : item
        ));
    };

    const handleDeleteListItem = (index) => {
        setListItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updates = { ...formData };

            if (formData.card_type === 'list') {
                updates.list_items = JSON.stringify(listItems);
            } else if (formData.card_type === 'image') {
                // Store images array in list_items
                updates.list_items = JSON.stringify(images);
                // Set first image as background_image (for card preview)
                updates.background_image = images.length > 0 ? images[0] : '';
            }

            await onUpdate(card.id, updates);
            onClose();
        } catch (error) {
            console.error('Failed to save card:', error);
            alert('Failed to save card changes');
        } finally {
            setIsSaving(false);
        }
    };
    
    // Image management functions
    const handleAddImage = (url) => {
        if (url && !images.includes(url)) {
            setImages(prev => [...prev, url]);
        }
    };
    
    const handleRemoveImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleMoveImage = (fromIndex, toIndex) => {
        setImages(prev => {
            const newImages = [...prev];
            const [moved] = newImages.splice(fromIndex, 1);
            newImages.splice(toIndex, 0, moved);
            return newImages;
        });
    };
    
    const openGallery = (index = 0) => {
        setGalleryStartIndex(index);
        setShowGallery(true);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this card?')) {
            await onDelete(card.id);
            onClose();
        }
    };

    const tabs = [
        { id: 'content', label: 'Content', icon: '📝' },
        { id: 'style', label: 'Style', icon: '🎨' },
        { id: 'schedule', label: 'Schedule', icon: '📅' },
        { id: 'notes', label: 'Notes', icon: '📋' }
    ];

    const presetColors = [
        '#FFFFFF', '#F8F9FA', '#FFF3CD', '#D4EDDA', '#CCE5FF', 
        '#E2D9F3', '#F5C6CB', '#1a1a2e', '#16213e', '#0f3460'
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="card-modal-modern" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header-modern">
                    <div className="modal-title-section">
                        <div className="card-type-badge" data-type={formData.card_type}>
                            {formData.card_type === 'text' && '📝'}
                            {formData.card_type === 'list' && '📋'}
                            {formData.card_type === 'image' && '🖼️'}
                            <span>{formData.card_type.charAt(0).toUpperCase() + formData.card_type.slice(1)} Card</span>
                        </div>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Untitled Card"
                            className="modal-title-input"
                        />
                    </div>
                    <button className="modal-close-modern" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="modal-body-modern">
                    {/* Content Tab */}
                    {activeTab === 'content' && (
                        <div className="tab-content">
                            <div className="form-group-modern">
                                <label className="form-label-modern">Card Type</label>
                                <div className="card-type-selector">
                                    {['text', 'list', 'image'].map(type => (
                                        <button
                                            key={type}
                                            className={`type-option ${formData.card_type === type ? 'selected' : ''}`}
                                            onClick={() => handleChange({ target: { name: 'card_type', value: type } })}
                                        >
                                            {type === 'text' && '📝'}
                                            {type === 'list' && '📋'}
                                            {type === 'image' && '🖼️'}
                                            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formData.card_type === 'text' && (
                                <div className="form-group-modern">
                                    <label className="form-label-modern">Content</label>
                                    <textarea
                                        name="content"
                                        value={formData.content}
                                        onChange={handleChange}
                                        placeholder="Write your content here..."
                                        className="textarea-modern"
                                        rows="8"
                                    />
                                </div>
                            )}

                            {formData.card_type === 'image' && (
                                <>
                                    {/* Image Gallery */}
                                    <div className="form-group-modern">
                                        <div className="images-header">
                                            <label className="form-label-modern">Images ({images.length})</label>
                                            {images.length > 0 && (
                                                <button 
                                                    type="button" 
                                                    className="btn-view-gallery"
                                                    onClick={() => openGallery(0)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                        <circle cx="8.5" cy="8.5" r="1.5"/>
                                                        <polyline points="21,15 16,10 5,21"/>
                                                    </svg>
                                                    View Gallery
                                                </button>
                                            )}
                                        </div>
                                        
                                        {/* Image thumbnails */}
                                        {images.length > 0 && (
                                            <div className="images-grid">
                                                {images.map((img, index) => (
                                                    <div key={index} className="image-thumb-container">
                                                        <img 
                                                            src={img} 
                                                            alt={`Gallery item ${index + 1}`}
                                                            className="image-thumb"
                                                            onClick={() => openGallery(index)}
                                                        />
                                                        <div className="image-thumb-actions">
                                                            {index > 0 && (
                                                                <button 
                                                                    type="button"
                                                                    className="thumb-action-btn"
                                                                    onClick={() => handleMoveImage(index, index - 1)}
                                                                    title="Move left"
                                                                >
                                                                    ←
                                                                </button>
                                                            )}
                                                            {index < images.length - 1 && (
                                                                <button 
                                                                    type="button"
                                                                    className="thumb-action-btn"
                                                                    onClick={() => handleMoveImage(index, index + 1)}
                                                                    title="Move right"
                                                                >
                                                                    →
                                                                </button>
                                                            )}
                                                            <button 
                                                                type="button"
                                                                className="thumb-action-btn delete"
                                                                onClick={() => handleRemoveImage(index)}
                                                                title="Remove"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                        {index === 0 && (
                                                            <span className="cover-badge">Cover</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Add new image */}
                                        <ImageUpload
                                            value=""
                                            onChange={handleAddImage}
                                            label={images.length === 0 ? "Add Image" : "Add Another Image"}
                                            placeholder="Drop image here or click to upload"
                                        />
                                    </div>
                                    
                                    <div className="form-group-modern">
                                        <label className="form-label-modern">Caption</label>
                                        <textarea
                                            name="content"
                                            value={formData.content}
                                            onChange={handleChange}
                                            placeholder="Add a caption..."
                                            className="textarea-modern"
                                            rows="3"
                                        />
                                    </div>
                                </>
                            )}

                            {formData.card_type === 'list' && (
                                <div className="form-group-modern">
                                    <label className="form-label-modern">Checklist Items</label>
                                    <div className="list-editor-modern">
                                        <div className="add-item-row">
                                            <input
                                                type="text"
                                                value={newListItem}
                                                onChange={(e) => setNewListItem(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddListItem()}
                                                placeholder="Add a new item..."
                                                className="input-modern"
                                            />
                                            <button 
                                                onClick={handleAddListItem} 
                                                className="btn-add-modern"
                                                disabled={!newListItem.trim()}
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M12 5v14M5 12h14"/>
                                                </svg>
                                            </button>
                                        </div>
                                        <ul className="checklist-modern">
                                            {listItems.map((item, index) => (
                                                <li key={index} className={`checklist-item ${item.completed ? 'completed' : ''}`}>
                                                    <label className="checkbox-modern">
                                                        <input
                                                            type="checkbox"
                                                            checked={item.completed}
                                                            onChange={() => handleToggleListItem(index)}
                                                        />
                                                        <span className="checkmark">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                                <path d="M20 6L9 17l-5-5"/>
                                                            </svg>
                                                        </span>
                                                    </label>
                                                    <span className="item-text">{item.text}</span>
                                                    <button
                                                        onClick={() => handleDeleteListItem(index)}
                                                        className="btn-delete-item-modern"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M18 6L6 18M6 6l12 12"/>
                                                        </svg>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                        {listItems.length === 0 && (
                                            <div className="empty-list">
                                                <span>📋</span>
                                                <p>No items yet. Add your first task above!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Style Tab */}
                    {activeTab === 'style' && (
                        <div className="tab-content">
                            <div className="style-preview-card" style={{
                                backgroundColor: formData.background_color,
                                color: formData.text_color
                            }}>
                                <div className="preview-title" style={{ fontSize: `${formData.font_size}px` }}>
                                    {formData.title || 'Preview'}
                                </div>
                                <div className="preview-content" style={{ fontSize: `${Math.max(formData.font_size - 2, 10)}px` }}>
                                    {formData.content || 'Card content preview...'}
                                </div>
                            </div>

                            <div className="style-grid">
                                <div className="form-group-modern">
                                    <label className="form-label-modern">Background Color</label>
                                    <div className="color-picker-modern">
                                        <div className="color-presets">
                                            {presetColors.map(color => (
                                                <button
                                                    key={color}
                                                    className={`color-preset ${formData.background_color === color ? 'selected' : ''}`}
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => handleChange({ target: { name: 'background_color', value: color } })}
                                                />
                                            ))}
                                        </div>
                                        <div className="color-custom">
                                            <input
                                                type="color"
                                                name="background_color"
                                                value={formData.background_color}
                                                onChange={handleChange}
                                                className="color-input-modern"
                                            />
                                            <input
                                                type="text"
                                                value={formData.background_color}
                                                onChange={(e) => handleChange({ target: { name: 'background_color', value: e.target.value } })}
                                                className="input-modern color-text"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group-modern">
                                    <label className="form-label-modern">Text Color</label>
                                    <div className="color-picker-modern">
                                        <div className="color-presets">
                                            {['#1a1a2e', '#16213e', '#0f3460', '#333333', '#666666', 
                                              '#FFFFFF', '#F8F9FA', '#667eea', '#764ba2', '#f093fb'].map(color => (
                                                <button
                                                    key={color}
                                                    className={`color-preset ${formData.text_color === color ? 'selected' : ''}`}
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => handleChange({ target: { name: 'text_color', value: color } })}
                                                />
                                            ))}
                                        </div>
                                        <div className="color-custom">
                                            <input
                                                type="color"
                                                name="text_color"
                                                value={formData.text_color}
                                                onChange={handleChange}
                                                className="color-input-modern"
                                            />
                                            <input
                                                type="text"
                                                value={formData.text_color}
                                                onChange={(e) => handleChange({ target: { name: 'text_color', value: e.target.value } })}
                                                className="input-modern color-text"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group-modern">
                                    <label className="form-label-modern">Font Size: {formData.font_size}px</label>
                                    <input
                                        type="range"
                                        name="font_size"
                                        min="10"
                                        max="32"
                                        value={formData.font_size}
                                        onChange={handleChange}
                                        className="range-modern"
                                    />
                                    <div className="range-labels">
                                        <span>Small</span>
                                        <span>Large</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Schedule Tab */}
                    {activeTab === 'schedule' && (
                        <div className="tab-content">
                            <div className="schedule-section">
                                <div className="schedule-icon">📅</div>
                                <h3>Work Schedule</h3>
                                <p>Set the start and end dates for this task</p>
                            </div>

                            <div className="date-grid">
                                <div className="form-group-modern">
                                    <label className="form-label-modern">Start Date</label>
                                    <input
                                        type="date"
                                        name="work_start_date"
                                        value={formData.work_start_date}
                                        onChange={handleChange}
                                        className="input-modern date-input"
                                    />
                                </div>
                                <div className="form-group-modern">
                                    <label className="form-label-modern">End Date</label>
                                    <input
                                        type="date"
                                        name="work_end_date"
                                        value={formData.work_end_date}
                                        onChange={handleChange}
                                        className="input-modern date-input"
                                    />
                                </div>
                            </div>

                            {formData.work_start_date && formData.work_end_date && (
                                <div className="duration-display">
                                    <span className="duration-icon">⏱️</span>
                                    <span>Duration: {Math.ceil((new Date(formData.work_end_date) - new Date(formData.work_start_date)) / (1000 * 60 * 60 * 24))} days</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes Tab */}
                    {activeTab === 'notes' && (
                        <div className="tab-content">
                            <div className="form-group-modern">
                                <label className="form-label-modern">Extended Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="Add detailed notes, references, or additional information..."
                                    className="textarea-modern notes-textarea"
                                    rows="12"
                                />
                            </div>
                            <div className="notes-tips">
                                <span>💡</span>
                                <p>Use this space for detailed descriptions, links, or any additional context for this card.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer-modern">
                    <button onClick={handleDelete} className="btn-delete-modern">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                        Delete
                    </button>
                    <div className="footer-actions">
                        <button onClick={onClose} className="btn-cancel-modern">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="btn-save-modern" disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <span className="spinner"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                                        <path d="M17 21v-8H7v8M7 3v5h8"/>
                                    </svg>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Image Gallery Modal */}
            {showGallery && images.length > 0 && (
                <ImageGallery
                    images={images}
                    initialIndex={galleryStartIndex}
                    onClose={() => setShowGallery(false)}
                />
            )}

            <style>{`
                .card-modal-modern {
                    width: 95%;
                    max-width: 640px;
                    max-height: 90vh;
                    background: linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%);
                    border-radius: 24px;
                    box-shadow: 
                        0 25px 50px -12px rgba(102, 126, 234, 0.25),
                        0 0 0 1px rgba(102, 126, 234, 0.1);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: modalSlideIn 0.3s ease-out;
                }

                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .modal-header-modern {
                    padding: 24px 28px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 1px solid rgba(102, 126, 234, 0.1);
                }

                .modal-title-section {
                    flex: 1;
                    margin-right: 16px;
                }

                .card-type-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 12px;
                }

                .modal-title-input {
                    width: 100%;
                    font-size: 24px;
                    font-weight: 700;
                    color: #1a1a2e;
                    border: none;
                    background: transparent;
                    padding: 0;
                    outline: none;
                    font-family: 'Outfit', sans-serif;
                }

                .modal-title-input::placeholder {
                    color: #aaa;
                }

                .modal-close-modern {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    border: none;
                    background: rgba(102, 126, 234, 0.1);
                    color: #667eea;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .modal-close-modern:hover {
                    background: rgba(102, 126, 234, 0.2);
                    transform: rotate(90deg);
                }

                .modal-tabs {
                    display: flex;
                    gap: 4px;
                    padding: 12px 28px;
                    background: rgba(102, 126, 234, 0.03);
                    border-bottom: 1px solid rgba(102, 126, 234, 0.08);
                }

                .modal-tab {
                    flex: 1;
                    padding: 12px 16px;
                    border: none;
                    background: transparent;
                    border-radius: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    color: #666;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .modal-tab:hover {
                    background: rgba(102, 126, 234, 0.1);
                    color: #667eea;
                }

                .modal-tab.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }

                .tab-icon {
                    font-size: 16px;
                }

                .modal-body-modern {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px 28px;
                }

                .tab-content {
                    animation: fadeIn 0.2s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .form-group-modern {
                    margin-bottom: 24px;
                }

                .form-label-modern {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #1a1a2e;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .input-modern, .textarea-modern {
                    width: 100%;
                    padding: 14px 18px;
                    border: 2px solid rgba(102, 126, 234, 0.15);
                    border-radius: 14px;
                    font-size: 15px;
                    color: #1a1a2e;
                    background: white;
                    transition: all 0.2s ease;
                    font-family: inherit;
                    box-sizing: border-box;
                }

                .input-modern:focus, .textarea-modern:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
                }

                .input-modern::placeholder, .textarea-modern::placeholder {
                    color: #aaa;
                }

                .textarea-modern {
                    resize: vertical;
                    min-height: 120px;
                    line-height: 1.6;
                }

                .notes-textarea {
                    min-height: 280px;
                }

                .card-type-selector {
                    display: flex;
                    gap: 12px;
                }

                .type-option {
                    flex: 1;
                    padding: 16px;
                    border: 2px solid rgba(102, 126, 234, 0.15);
                    border-radius: 14px;
                    background: white;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #666;
                    transition: all 0.2s ease;
                }

                .type-option:hover {
                    border-color: #667eea;
                    color: #667eea;
                }

                .type-option.selected {
                    border-color: #667eea;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
                    color: #667eea;
                }

                .list-editor-modern {
                    background: rgba(102, 126, 234, 0.03);
                    border-radius: 16px;
                    padding: 16px;
                }

                .add-item-row {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .btn-add-modern {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    border: none;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .btn-add-modern:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }

                .btn-add-modern:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .checklist-modern {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .checklist-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: white;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                }

                .checklist-item:hover {
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                }

                .checklist-item.completed .item-text {
                    text-decoration: line-through;
                    color: #999;
                }

                .checkbox-modern {
                    position: relative;
                    cursor: pointer;
                }

                .checkbox-modern input {
                    position: absolute;
                    opacity: 0;
                    cursor: pointer;
                }

                .checkmark {
                    width: 24px;
                    height: 24px;
                    border: 2px solid rgba(102, 126, 234, 0.3);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .checkbox-modern input:checked + .checkmark {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-color: transparent;
                }

                .checkmark svg {
                    opacity: 0;
                    color: white;
                    transition: all 0.2s ease;
                }

                .checkbox-modern input:checked + .checkmark svg {
                    opacity: 1;
                }

                .item-text {
                    flex: 1;
                    font-size: 14px;
                    color: #1a1a2e;
                }

                .btn-delete-item-modern {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    color: #ccc;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: all 0.2s ease;
                }

                .checklist-item:hover .btn-delete-item-modern {
                    opacity: 1;
                }

                .btn-delete-item-modern:hover {
                    background: rgba(220, 53, 69, 0.1);
                    color: #dc3545;
                }

                .empty-list {
                    text-align: center;
                    padding: 32px;
                    color: #999;
                }

                .empty-list span {
                    font-size: 32px;
                    display: block;
                    margin-bottom: 12px;
                }

                .image-preview {
                    margin-top: 16px;
                    border-radius: 12px;
                    overflow: hidden;
                    max-height: 200px;
                }

                .image-preview img {
                    width: 100%;
                    height: auto;
                    object-fit: cover;
                }

                .style-preview-card {
                    padding: 20px;
                    border-radius: 16px;
                    margin-bottom: 24px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                }

                .preview-title {
                    font-weight: 600;
                    margin-bottom: 8px;
                }

                .preview-content {
                    opacity: 0.8;
                }

                .style-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .color-picker-modern {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .color-presets {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .color-preset {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    border: 2px solid transparent;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .color-preset:hover {
                    transform: scale(1.1);
                }

                .color-preset.selected {
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
                }

                .color-custom {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .color-input-modern {
                    width: 48px;
                    height: 48px;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    padding: 0;
                    overflow: hidden;
                }

                .color-input-modern::-webkit-color-swatch-wrapper {
                    padding: 0;
                }

                .color-input-modern::-webkit-color-swatch {
                    border: none;
                    border-radius: 12px;
                }

                .color-text {
                    width: 100px;
                    text-transform: uppercase;
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 13px;
                }

                .range-modern {
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    background: rgba(102, 126, 234, 0.2);
                    appearance: none;
                    outline: none;
                }

                .range-modern::-webkit-slider-thumb {
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
                }

                .range-labels {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 8px;
                    font-size: 12px;
                    color: #999;
                }

                .schedule-section {
                    text-align: center;
                    padding: 24px;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
                    border-radius: 16px;
                    margin-bottom: 24px;
                }

                .schedule-icon {
                    font-size: 48px;
                    margin-bottom: 12px;
                }

                .schedule-section h3 {
                    font-size: 20px;
                    color: #1a1a2e;
                    margin: 0 0 8px;
                }

                .schedule-section p {
                    color: #666;
                    margin: 0;
                }

                .date-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .date-input {
                    cursor: pointer;
                }

                .duration-display {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 16px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px;
                    margin-top: 16px;
                    font-weight: 500;
                }

                .notes-tips {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px;
                    background: rgba(102, 126, 234, 0.05);
                    border-radius: 12px;
                    color: #666;
                    font-size: 14px;
                }

                .notes-tips span {
                    font-size: 20px;
                }

                .notes-tips p {
                    margin: 0;
                    line-height: 1.5;
                }

                /* Image Gallery Management */
                .images-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .btn-view-gallery {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    border: none;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-view-gallery:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }

                .images-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .image-thumb-container {
                    position: relative;
                    aspect-ratio: 1;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 2px solid rgba(102, 126, 234, 0.15);
                    transition: all 0.2s ease;
                }

                .image-thumb-container:hover {
                    border-color: #667eea;
                    transform: scale(1.02);
                }

                .image-thumb {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    cursor: pointer;
                }

                .image-thumb-actions {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    display: flex;
                    gap: 4px;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .image-thumb-container:hover .image-thumb-actions {
                    opacity: 1;
                }

                .thumb-action-btn {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    border: none;
                    background: rgba(0, 0, 0, 0.6);
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .thumb-action-btn:hover {
                    background: rgba(0, 0, 0, 0.8);
                }

                .thumb-action-btn.delete:hover {
                    background: #dc3545;
                }

                .cover-badge {
                    position: absolute;
                    bottom: 4px;
                    left: 4px;
                    padding: 3px 8px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    border-radius: 4px;
                }

                .modal-footer-modern {
                    padding: 20px 28px;
                    border-top: 1px solid rgba(102, 126, 234, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(102, 126, 234, 0.02);
                }

                .btn-delete-modern {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 12px;
                    background: rgba(220, 53, 69, 0.1);
                    color: #dc3545;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-delete-modern:hover {
                    background: rgba(220, 53, 69, 0.2);
                }

                .footer-actions {
                    display: flex;
                    gap: 12px;
                }

                .btn-cancel-modern {
                    padding: 12px 24px;
                    border: 2px solid rgba(102, 126, 234, 0.2);
                    border-radius: 12px;
                    background: transparent;
                    color: #666;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-cancel-modern:hover {
                    border-color: rgba(102, 126, 234, 0.4);
                    color: #667eea;
                }

                .btn-save-modern {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-save-modern:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                }

                .btn-save-modern:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 600px) {
                    .card-modal-modern {
                        width: 100%;
                        max-height: 100vh;
                        border-radius: 0;
                    }

                    .modal-tabs {
                        padding: 8px 16px;
                    }

                    .tab-label {
                        display: none;
                    }

                    .modal-tab {
                        padding: 12px;
                    }

                    .card-type-selector {
                        flex-direction: column;
                    }

                    .date-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default CardModal;
