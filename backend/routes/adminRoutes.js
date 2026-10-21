import { Router } from 'express';
import {
  getAdminOverview,
  getAdminUsers,
  toggleUserStatus,
  getAdminReports,
  getAdminAuditLogs,
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { authorizeRole } from '../middleware/authorizeRole.js';

const router = Router();

// All admin routes require an authenticated user with ADMIN role
router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

router.get('/overview', getAdminOverview);
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/reports', getAdminReports);
router.get('/audit-logs', getAdminAuditLogs);

export default router;
