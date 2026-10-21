const router = require('express').Router();
const c = require('../controllers/vendor.controller');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('vendor'));
router.post('/apply', validate(c.schemas.apply), c.apply);
router.get('/me', c.getMe);
router.patch('/me', validate(c.schemas.update), c.updateMe);

module.exports = router;
