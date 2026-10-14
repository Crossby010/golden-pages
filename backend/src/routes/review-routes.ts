import { Router } from 'express';
import {
  listForBook,
  create,
  remove,
} from '../controllers/review-controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/book/:bookId', listForBook);
router.post('/', requireAuth, create);
router.delete('/:id', requireAuth, remove);

export default router;