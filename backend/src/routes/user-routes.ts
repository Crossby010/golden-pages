import { Router } from 'express';
import { listUsers } from '../controllers/user-controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireAdmin, listUsers);

export default router;