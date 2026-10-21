const router = require('express').Router();
const c = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.post('/register', validate(c.schemas.register), c.register);
router.post('/login', validate(c.schemas.login), c.login);
router.post('/refresh', validate(c.schemas.refresh), c.refresh);
router.post('/logout', authenticate, validate(c.schemas.logout), c.logout);
router.get('/me', authenticate, c.me);

module.exports = router;
