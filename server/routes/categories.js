const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoryController');

router.get('/', ctrl.listCategories);
router.post('/', ctrl.createCategory);
router.get('/:id', ctrl.getCategory);
router.put('/:id', ctrl.updateCategory);
router.delete('/:id', ctrl.deleteCategory);

module.exports = router;
