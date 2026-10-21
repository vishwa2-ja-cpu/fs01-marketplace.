const router = require('express').Router();
const c = require('../controllers/admin.controller');
const validateId = require('../middleware/validateId');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('admin'));
router.get('/vendors', c.listVendors);
router.patch('/vendors/:id/approve', validateId, c.approve);
router.patch('/vendors/:id/suspend', validateId, c.suspend);

module.exports = router;
