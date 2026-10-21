const router = require('express').Router();
const c = require('../controllers/upload.controller');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/presign', authenticate, requireRole('vendor', 'admin'), validate(c.schemas.presign), c.presign);

module.exports = router;
