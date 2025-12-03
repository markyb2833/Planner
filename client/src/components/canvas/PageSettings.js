import React, { useState } from 'react';
import { pagesAPI } from '../../services/api';
import ImageUpload from '../common/ImageUpload';

const PageSettings = ({ page, defaults, onClose, onUpdate }) => {
    const [pageSettings, setPageSettings] = useState({
        name: page.name || '',
        background_color: page.background_color || '#FFFFFF',
        background_image: page.background_image || '',
        canvas_max_width: page.canvas_max_width || 5000,
        canvas_max_height: page.canvas_max_height || 5000
    });

    const [defaultSettings, setDefaultSettings] = useState({
        default_card_width: defaults?.default_card_width || 200,
        default_card_height: defaults?.default_card_height || 150,
        default_card_background_color: defaults?.default_card_background_color || '#FFFFFF',
        default_card_text_color: defaults?.default_card_text_color || '#000000',
        default_card_font_size: defaults?.default_card_font_size || 14
    });

    const [activeTab, setActiveTab] = useState('page');
    const [isSaving, setIsSaving] = useState(false);

    const handlePageChange = (e) => {
        const { name, value } = e.target;
        setPageSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleDefaultsChange = (e) => {
        const { name, value } = e.target;
        setDefaultSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update page settings
            await pagesAPI.updatePage(page.id, pageSettings);

            // Update page defaults (fixed: use updateDefaults instead of updatePageDefaults)
            await pagesAPI.updateDefaults(page.id, defaultSettings);

            // Call parent update handler
            onUpdate({ ...pageSettings });

            onClose();
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const presetColors = [
        '#FFFFFF', '#F8F9FA', '#E9ECEF', '#1a1a2e', '#16213e', 
        '#0f3460', '#667eea', '#764ba2', '#f093fb', '#f5576c'
    ];

    const canvasSizes = [
        { label: 'Small', width: 2000, height: 2000 },
        { label: 'Medium', width: 5000, height: 5000 },
        { label: 'Large', width: 10000, height: 10000 },
        { label: 'Extra Large', width: 20000, height: 20000 }
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="settings-modal-modern" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="settings-header">
                    <div className="settings-title-section">
                        <div className="settings-icon">⚙️</div>
                        <div>
                            <h2>Page Settings</h2>
                            <p>Configure your canvas and card defaults</p>
                        </div>
                    </div>
                    <button className="settings-close" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="settings-tabs-modern">
                    <button
                        className={`settings-tab ${activeTab === 'page' ? 'active' : ''}`}
                        onClick={() => setActiveTab('page')}
                    >
                        <span className="tab-icon">🎨</span>
                        <span className="tab-text">Canvas</span>
                    </button>
                    <button
                        className={`settings-tab ${activeTab === 'defaults' ? 'active' : ''}`}
                        onClick={() => setActiveTab('defaults')}
                    >
                        <span className="tab-icon">🃏</span>
                        <span className="tab-text">Card Defaults</span>
                    </button>
                </div>

                {/* Content */}
                <div className="settings-body">
                    {/* Page Settings Tab */}
                    {activeTab === 'page' && (
                        <div className="settings-content-modern">
                            <div className="settings-section">
                                <div className="form-group-modern">
                                    <label className="form-label-modern">Page Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={pageSettings.name}
                                        onChange={handlePageChange}
                                        placeholder="My Awesome Page"
                                        className="input-modern"
                                    />
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3 className="section-title">
                                    <span>🎨</span> Background
                                </h3>
                                
                                <div className="form-group-modern">
                                    <label className="form-label-modern">Background Color</label>
                                    <div className="color-picker-modern">
                                        <div className="color-presets">
                                            {presetColors.map(color => (
                                                <button
                                                    key={color}
                                                    className={`color-preset ${pageSettings.background_color === color ? 'selected' : ''}`}
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => handlePageChange({ target: { name: 'background_color', value: color } })}
                                                />
                                            ))}
                                        </div>
                                        <div className="color-custom">
                                            <input
                                                type="color"
                                                name="background_color"
                                                value={pageSettings.background_color}
                                                onChange={handlePageChange}
                                                className="color-input-modern"
                                            />
                                            <input
                                                type="text"
                                                value={pageSettings.background_color}
                                                onChange={(e) => handlePageChange({ target: { name: 'background_color', value: e.target.value } })}
                                                className="input-modern color-text"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <ImageUpload
                                    value={pageSettings.background_image}
                                    onChange={(url) => setPageSettings(prev => ({ ...prev, background_image: url }))}
                                    label="Background Image"
                                    placeholder="Drop background image here or click to upload"
                                />
                            </div>

                            <div className="settings-section">
                                <h3 className="section-title">
                                    <span>📐</span> Canvas Size
                                </h3>

                                <div className="canvas-size-presets">
                                    {canvasSizes.map(size => (
                                        <button
                                            key={size.label}
                                            className={`size-preset ${
                                                pageSettings.canvas_max_width === size.width && 
                                                pageSettings.canvas_max_height === size.height ? 'selected' : ''
                                            }`}
                                            onClick={() => {
                                                handlePageChange({ target: { name: 'canvas_max_width', value: size.width } });
                                                handlePageChange({ target: { name: 'canvas_max_height', value: size.height } });
                                            }}
                                        >
                                            <span className="size-label">{size.label}</span>
                                            <span className="size-dims">{size.width} × {size.height}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="size-inputs">
                                    <div className="form-group-modern">
                                        <label className="form-label-modern">Width (px)</label>
                                        <input
                                            type="number"
                                            name="canvas_max_width"
                                            value={pageSettings.canvas_max_width}
                                            onChange={handlePageChange}
                                            min="1000"
                                            max="50000"
                                            className="input-modern"
                                        />
                                    </div>
                                    <div className="form-group-modern">
                                        <label className="form-label-modern">Height (px)</label>
                                        <input
                                            type="number"
                                            name="canvas_max_height"
                                            value={pageSettings.canvas_max_height}
                                            onChange={handlePageChange}
                                            min="1000"
                                            max="50000"
                                            className="input-modern"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Card Defaults Tab */}
                    {activeTab === 'defaults' && (
                        <div className="settings-content-modern">
                            <div className="defaults-info">
                                <span>💡</span>
                                <p>These settings apply to all new cards created on this page.</p>
                            </div>

                            <div className="settings-section">
                                <h3 className="section-title">
                                    <span>📏</span> Default Size
                                </h3>

                                <div className="card-preview-container">
                                    <div 
                                        className="card-preview"
                                        style={{
                                            width: `${Math.min(defaultSettings.default_card_width / 2, 150)}px`,
                                            height: `${Math.min(defaultSettings.default_card_height / 2, 100)}px`,
                                            backgroundColor: defaultSettings.default_card_background_color,
                                            color: defaultSettings.default_card_text_color,
                                            fontSize: `${defaultSettings.default_card_font_size * 0.7}px`
                                        }}
                                    >
                                        <div className="preview-header">Preview</div>
                                        <div className="preview-body">Card content</div>
                                    </div>
                                </div>

                                <div className="size-inputs">
                                    <div className="form-group-modern">
                                        <label className="form-label-modern">Width: {defaultSettings.default_card_width}px</label>
                                        <input
                                            type="range"
                                            name="default_card_width"
                                            value={defaultSettings.default_card_width}
                                            onChange={handleDefaultsChange}
                                            min="100"
                                            max="600"
                                            className="range-modern"
                                        />
                                    </div>
                                    <div className="form-group-modern">
                                        <label className="form-label-modern">Height: {defaultSettings.default_card_height}px</label>
                                        <input
                                            type="range"
                                            name="default_card_height"
                                            value={defaultSettings.default_card_height}
                                            onChange={handleDefaultsChange}
                                            min="80"
                                            max="500"
                                            className="range-modern"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3 className="section-title">
                                    <span>🎨</span> Default Colors
                                </h3>

                                <div className="color-settings-row">
                                    <div className="form-group-modern">
                                        <label className="form-label-modern">Background</label>
                                        <div className="color-picker-compact">
                                            <input
                                                type="color"
                                                name="default_card_background_color"
                                                value={defaultSettings.default_card_background_color}
                                                onChange={handleDefaultsChange}
                                                className="color-input-modern"
                                            />
                                            <input
                                                type="text"
                                                value={defaultSettings.default_card_background_color}
                                                onChange={(e) => handleDefaultsChange({ target: { name: 'default_card_background_color', value: e.target.value } })}
                                                className="input-modern color-text"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group-modern">
                                        <label className="form-label-modern">Text</label>
                                        <div className="color-picker-compact">
                                            <input
                                                type="color"
                                                name="default_card_text_color"
                                                value={defaultSettings.default_card_text_color}
                                                onChange={handleDefaultsChange}
                                                className="color-input-modern"
                                            />
                                            <input
                                                type="text"
                                                value={defaultSettings.default_card_text_color}
                                                onChange={(e) => handleDefaultsChange({ target: { name: 'default_card_text_color', value: e.target.value } })}
                                                className="input-modern color-text"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3 className="section-title">
                                    <span>🔤</span> Typography
                                </h3>

                                <div className="form-group-modern">
                                    <label className="form-label-modern">Font Size: {defaultSettings.default_card_font_size}px</label>
                                    <input
                                        type="range"
                                        name="default_card_font_size"
                                        value={defaultSettings.default_card_font_size}
                                        onChange={handleDefaultsChange}
                                        min="10"
                                        max="24"
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
                </div>

                {/* Footer */}
                <div className="settings-footer">
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
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                .settings-modal-modern {
                    width: 95%;
                    max-width: 580px;
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

                .settings-header {
                    padding: 24px 28px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(102, 126, 234, 0.1);
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
                }

                .settings-title-section {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .settings-icon {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }

                .settings-title-section h2 {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 700;
                    color: #1a1a2e;
                }

                .settings-title-section p {
                    margin: 4px 0 0;
                    font-size: 14px;
                    color: #666;
                }

                .settings-close {
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

                .settings-close:hover {
                    background: rgba(102, 126, 234, 0.2);
                    transform: rotate(90deg);
                }

                .settings-tabs-modern {
                    display: flex;
                    gap: 4px;
                    padding: 12px 28px;
                    background: rgba(102, 126, 234, 0.02);
                    border-bottom: 1px solid rgba(102, 126, 234, 0.08);
                }

                .settings-tab {
                    flex: 1;
                    padding: 14px 20px;
                    border: none;
                    background: transparent;
                    border-radius: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    color: #666;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }

                .settings-tab:hover {
                    background: rgba(102, 126, 234, 0.1);
                    color: #667eea;
                }

                .settings-tab.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }

                .tab-icon {
                    font-size: 18px;
                }

                .settings-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px 28px;
                }

                .settings-content-modern {
                    animation: fadeIn 0.2s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .settings-section {
                    margin-bottom: 28px;
                }

                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 16px;
                    font-weight: 700;
                    color: #1a1a2e;
                    margin: 0 0 16px;
                }

                .section-title span {
                    font-size: 20px;
                }

                .form-group-modern {
                    margin-bottom: 20px;
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

                .input-modern {
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

                .input-modern:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
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
                    width: 36px;
                    height: 36px;
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
                    width: 52px;
                    height: 52px;
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
                    width: 110px;
                    text-transform: uppercase;
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 13px;
                }

                .image-preview-small {
                    margin-top: 12px;
                    border-radius: 12px;
                    overflow: hidden;
                    height: 80px;
                }

                .image-preview-small img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .canvas-size-presets {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .size-preset {
                    padding: 12px 8px;
                    border: 2px solid rgba(102, 126, 234, 0.15);
                    border-radius: 12px;
                    background: white;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    transition: all 0.2s ease;
                }

                .size-preset:hover {
                    border-color: #667eea;
                }

                .size-preset.selected {
                    border-color: #667eea;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
                }

                .size-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: #1a1a2e;
                }

                .size-dims {
                    font-size: 10px;
                    color: #666;
                }

                .size-inputs {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .defaults-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
                    border-radius: 14px;
                    margin-bottom: 24px;
                }

                .defaults-info span {
                    font-size: 24px;
                }

                .defaults-info p {
                    margin: 0;
                    color: #666;
                    font-size: 14px;
                }

                .card-preview-container {
                    display: flex;
                    justify-content: center;
                    padding: 24px;
                    background: rgba(102, 126, 234, 0.05);
                    border-radius: 16px;
                    margin-bottom: 20px;
                }

                .card-preview {
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s ease;
                }

                .card-preview .preview-header {
                    padding: 6px 10px;
                    background: rgba(0, 0, 0, 0.08);
                    font-weight: 600;
                }

                .card-preview .preview-body {
                    padding: 8px 10px;
                    flex: 1;
                    opacity: 0.8;
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

                .color-settings-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .color-picker-compact {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .settings-footer {
                    padding: 20px 28px;
                    border-top: 1px solid rgba(102, 126, 234, 0.1);
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    background: rgba(102, 126, 234, 0.02);
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

                @media (max-width: 500px) {
                    .canvas-size-presets {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .size-inputs {
                        grid-template-columns: 1fr;
                    }

                    .color-settings-row {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default PageSettings;
