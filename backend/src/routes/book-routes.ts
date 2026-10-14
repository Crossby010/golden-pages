import { Router } from 'express';
import {
  list,
  getOne,
  create,
  update,
  remove,
  stats,
  authors,
  readBook,
} from '../controllers/book-controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { uploadImage, uploadPdf } from '../middleware/upload.js';
import {
  uploadImageBuffer,
  uploadPdfBuffer,
} from '../services/upload-service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// ============================================
// PUBLIC
// ============================================
router.get('/', list);
router.get('/stats', stats);
router.get('/authors', authors);
router.get('/:id/read', requireAuth, readBook);
router.get('/:id', getOne);

// ============================================
// ADMIN
// ============================================
router.post('/', requireAuth, requireAdmin, create);
router.patch('/:id', requireAuth, requireAdmin, update);
router.delete('/:id', requireAuth, requireAdmin, remove);

// ============================================
// UPLOADS
// ============================================
router.post(
  '/upload/cover',
  requireAuth,
  requireAdmin,
  uploadImage.single('file'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }
      const result = await uploadImageBuffer(
        req.file.buffer,
        'golden-pages/covers'
      );
      res.json({ url: result.url, publicId: result.publicId });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/upload/pdf',
  requireAuth,
  requireAdmin,
  uploadPdf.single('file'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }
      const result = await uploadPdfBuffer(
        req.file.buffer,
        'golden-pages/books'
      );
      res.json({ url: result.url, publicId: result.publicId });
    } catch (error) {
      next(error);
    }
  }
);

export default router;