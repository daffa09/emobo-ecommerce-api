import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminOnly } from '../../middleware/role.middleware';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Configure multer for memory storage (we'll process with sharp)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

/**
 * Upload single image
 * POST /api/upload/image
 * Protected: Admin only
 */
router.post('/image', authMiddleware, adminOnly, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Generate unique filename
    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(uploadsDir, filename);

    // Convert and save as WebP with optimization
    await sharp(req.file.buffer)
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
  } catch (error: any) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
});

/**
 * Upload multiple images
 * POST /api/upload/images
 * Protected: Admin only
 */
router.post('/images', authMiddleware, adminOnly, upload.array('images', 5), async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    const uploadedImages = await Promise.all(
      req.files.map(async (file) => {
        const filename = `${uuidv4()}.webp`;
        const filepath = path.join(uploadsDir, filename);

        await sharp(file.buffer)
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
      })
    );

    res.status(200).json({
      message: 'Images uploaded successfully',
      images: uploadedImages,
    });
  } catch (error: any) {
    console.error('Images upload error:', error);
    res.status(500).json({ message: 'Failed to upload images', error: error.message });
  }
});

/**
 * Delete image
 * DELETE /api/upload/:filename
 * Protected: Admin only
 */
router.delete('/:filename', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    // Security: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    const filepath = path.join(uploadsDir, filename);

    // Check if file exists
    try {
      await fs.access(filepath);
    } catch {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete the file
    await fs.unlink(filepath);

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('Image delete error:', error);
    res.status(500).json({ message: 'Failed to delete image', error: error.message });
  }
});

export default router;
