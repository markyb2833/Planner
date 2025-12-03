import React, { useState, useRef, useCallback } from 'react';
import { uploadAPI } from '../../services/api';

const ImageUpload = ({ value, onChange, label = "Image", placeholder = "Drop image here or click to upload" }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleUpload = useCallback(async (file) => {
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setError('File too large. Maximum size is 10MB.');
            return;
        }

        setError(null);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 100);

            const response = await uploadAPI.uploadImage(file);
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            // Call onChange with the new URL
            onChange(response.data.url);
            
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 500);
        } catch (err) {
            console.error('Upload failed:', err);
            setError(err.response?.data?.error || 'Failed to upload image');
            setIsUploading(false);
            setUploadProgress(0);
        }
    }, [onChange]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleUpload(files[0]);
        }
    }, [handleUpload]);

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleUpload(files[0]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setError(null);
    };

    const handleUrlInput = (e) => {
        onChange(e.target.value);
    };

    return (
        <div className="image-upload-container">
            <label className="form-label-modern">{label}</label>
            
            {/* Drop Zone */}
            <div
                className={`image-dropzone ${isDragging ? 'dragging' : ''} ${value ? 'has-image' : ''} ${isUploading ? 'uploading' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {isUploading ? (
                    <div className="upload-progress">
                        <div className="progress-spinner"></div>
                        <span>Uploading... {uploadProgress}%</span>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    </div>
                ) : value ? (
                    <div className="image-preview-container">
                        <img src={value} alt="Preview" className="image-preview" />
                        <div className="image-overlay">
                            <button className="change-image-btn" onClick={handleClick}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                    <polyline points="17,8 12,3 7,8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                Change
                            </button>
                            <button className="remove-image-btn" onClick={handleClear}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                                Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="dropzone-content">
                        <div className="dropzone-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21,15 16,10 5,21"/>
                            </svg>
                        </div>
                        <p className="dropzone-text">{placeholder}</p>
                        <p className="dropzone-hint">JPEG, PNG, GIF, WebP • Max 10MB</p>
                    </div>
                )}
            </div>

            {/* URL Input */}
            <div className="url-input-section">
                <span className="url-divider">or paste URL</span>
                <input
                    type="text"
                    value={value}
                    onChange={handleUrlInput}
                    placeholder="https://example.com/image.jpg"
                    className="input-modern url-input"
                />
            </div>

            {/* Error Message */}
            {error && (
                <div className="upload-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                </div>
            )}

            <style>{`
                .image-upload-container {
                    margin-bottom: 20px;
                }

                .image-dropzone {
                    border: 2px dashed rgba(102, 126, 234, 0.3);
                    border-radius: 16px;
                    padding: 24px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: rgba(102, 126, 234, 0.02);
                    min-height: 160px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .image-dropzone:hover {
                    border-color: rgba(102, 126, 234, 0.5);
                    background: rgba(102, 126, 234, 0.05);
                }

                .image-dropzone.dragging {
                    border-color: #667eea;
                    background: rgba(102, 126, 234, 0.1);
                    transform: scale(1.02);
                }

                .image-dropzone.has-image {
                    padding: 0;
                    border-style: solid;
                    border-color: rgba(102, 126, 234, 0.2);
                }

                .image-dropzone.uploading {
                    pointer-events: none;
                }

                .dropzone-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }

                .dropzone-icon {
                    color: #667eea;
                    opacity: 0.6;
                }

                .dropzone-text {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 600;
                    color: #1a1a2e;
                }

                .dropzone-hint {
                    margin: 0;
                    font-size: 12px;
                    color: #888;
                }

                .upload-progress {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    color: #667eea;
                    font-weight: 500;
                }

                .progress-spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid rgba(102, 126, 234, 0.2);
                    border-top-color: #667eea;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .progress-bar {
                    width: 200px;
                    height: 6px;
                    background: rgba(102, 126, 234, 0.2);
                    border-radius: 3px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 3px;
                    transition: width 0.2s ease;
                }

                .image-preview-container {
                    position: relative;
                    width: 100%;
                    height: 200px;
                    overflow: hidden;
                    border-radius: 14px;
                }

                .image-preview {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .image-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .image-preview-container:hover .image-overlay {
                    opacity: 1;
                }

                .change-image-btn,
                .remove-image-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 16px;
                    border: none;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .change-image-btn {
                    background: white;
                    color: #1a1a2e;
                }

                .change-image-btn:hover {
                    background: #667eea;
                    color: white;
                }

                .remove-image-btn {
                    background: rgba(239, 68, 68, 0.9);
                    color: white;
                }

                .remove-image-btn:hover {
                    background: #dc2626;
                }

                .url-input-section {
                    margin-top: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .url-divider {
                    font-size: 12px;
                    color: #888;
                    text-align: center;
                    position: relative;
                }

                .url-divider::before,
                .url-divider::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    width: 40%;
                    height: 1px;
                    background: rgba(102, 126, 234, 0.15);
                }

                .url-divider::before {
                    left: 0;
                }

                .url-divider::after {
                    right: 0;
                }

                .url-input {
                    font-size: 13px;
                }

                .upload-error {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 12px;
                    padding: 10px 14px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    border-radius: 10px;
                    color: #dc2626;
                    font-size: 13px;
                }
            `}</style>
        </div>
    );
};

export default ImageUpload;

