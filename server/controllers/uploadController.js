const path = require('path');
const fs = require('fs');

// Get uploads directory path (Railway volume in production, local in development)
const getUploadsDir = () => {
    return process.env.NODE_ENV === 'production' && process.env.RAILWAY_VOLUME_MOUNT_PATH
        ? process.env.RAILWAY_VOLUME_MOUNT_PATH
        : path.join(__dirname, '../../uploads');
};

const uploadsDir = getUploadsDir();

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`📁 Created uploads directory at: ${uploadsDir}`);
}

/**
 * Upload a single image
 */
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generate the URL for the uploaded file
        // In production, use relative path; in development, use full URL
        const imageUrl = process.env.NODE_ENV === 'production'
            ? `/uploads/${req.file.filename}`
            : `http://localhost:${process.env.PORT || 3001}/uploads/${req.file.filename}`;

        res.json({
            message: 'Image uploaded successfully',
            url: imageUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
};

/**
 * Delete an uploaded image
 */
const deleteImage = async (req, res) => {
    try {
        const { filename } = req.params;
        
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }

        // Security: Ensure filename doesn't contain path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const filePath = path.join(uploadsDir, filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete the file
        fs.unlinkSync(filePath);

        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
};

module.exports = {
    uploadImage,
    deleteImage
};

