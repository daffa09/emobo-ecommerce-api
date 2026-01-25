"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const uuid_1 = require("uuid");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const router = (0, express_1.Router)();
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '../../../uploads');
promises_1.default.mkdir(uploadsDir, { recursive: true }).catch(console.error);
// Configure multer for memory storage (we'll process with sharp)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
        }
    },
});
/**
 * Upload single image
 * POST /api/upload/image
 * Protected: Admin only
 */
router.post('/image', auth_middleware_1.authMiddleware, role_middleware_1.adminOnly, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }
        // Generate unique filename
        const filename = `${(0, uuid_1.v4)()}.webp`;
        const filepath = path_1.default.join(uploadsDir, filename);
        // Convert and save as WebP with optimization
        await (0, sharp_1.default)(req.file.buffer)
            .webp({ quality: 85 }) // High quality WebP
            .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true,
        })
            .toFile(filepath);
        // Return the URL path (relative to backend)
        const imageUrl = `/uploads/${filename}`;
        res.status(200).json({
            message: 'Image uploaded successfully',
            url: imageUrl,
            filename: filename,
        });
    }
    catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ message: 'Failed to upload image', error: error.message });
    }
});
/**
 * Upload multiple images
 * POST /api/upload/images
 * Protected: Admin only
 */
router.post('/images', auth_middleware_1.authMiddleware, role_middleware_1.adminOnly, upload.array('images', 5), async (req, res) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ message: 'No image files provided' });
        }
        const uploadedImages = await Promise.all(req.files.map(async (file) => {
            const filename = `${(0, uuid_1.v4)()}.webp`;
            const filepath = path_1.default.join(uploadsDir, filename);
            await (0, sharp_1.default)(file.buffer)
                .webp({ quality: 85 })
                .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true,
            })
                .toFile(filepath);
            return {
                url: `/uploads/${filename}`,
                filename: filename,
            };
        }));
        res.status(200).json({
            message: 'Images uploaded successfully',
            images: uploadedImages,
        });
    }
    catch (error) {
        console.error('Images upload error:', error);
        res.status(500).json({ message: 'Failed to upload images', error: error.message });
    }
});
/**
 * Delete image
 * DELETE /api/upload/:filename
 * Protected: Admin only
 */
router.delete('/:filename', auth_middleware_1.authMiddleware, role_middleware_1.adminOnly, async (req, res) => {
    try {
        const { filename } = req.params;
        // Security: ensure filename doesn't contain path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ message: 'Invalid filename' });
        }
        const filepath = path_1.default.join(uploadsDir, filename);
        // Check if file exists
        try {
            await promises_1.default.access(filepath);
        }
        catch {
            return res.status(404).json({ message: 'Image not found' });
        }
        // Delete the file
        await promises_1.default.unlink(filepath);
        res.status(200).json({ message: 'Image deleted successfully' });
    }
    catch (error) {
        console.error('Image delete error:', error);
        res.status(500).json({ message: 'Failed to delete image', error: error.message });
    }
});
exports.default = router;
