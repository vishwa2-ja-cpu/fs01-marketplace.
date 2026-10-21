const router = require('express').Router();
const c = require('../controllers/product.controller');
const validate = require('../middleware/validate');
const validateId = require('../middleware/validateId');
const approvedVendor = require('../middleware/vendor');
const { authenticate, requireRole } = require('../middleware/auth');

const vendorOnly = [authenticate, requireRole('vendor'), approvedVendor];

router.get('/', c.list);
router.get('/mine', ...vendorOnly, c.mine); // must stay above '/:id'
router.get('/:id', validateId, c.getOne);
router.post('/', ...vendorOnly, validate(c.schemas.create), c.create);
router.patch('/:id', ...vendorOnly, validateId, validate(c.schemas.update), c.update);
router.delete('/:id', ...vendorOnly, validateId, c.remove);

module.exports = router;
