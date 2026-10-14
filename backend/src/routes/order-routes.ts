import { Router } from 'express';
import {
  create,
  listMine,
  getOne,
  getByNumber,
  listAll,
  stats,
} from '../controllers/order-controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// ============================================
// PUBLIC
// ============================================
router.get('/number/:orderNumber', getByNumber);

// ============================================
// AUTHENTICATED
// ============================================
router.post('/', requireAuth, create);
router.get('/mine', requireAuth, listMine);
router.get('/:id', requireAuth, getOne);

// ============================================
// ADMIN
// ============================================
router.get('/', requireAuth, requireAdmin, listAll);
router.get('/admin/stats', requireAuth, requireAdmin, stats);

export default router;