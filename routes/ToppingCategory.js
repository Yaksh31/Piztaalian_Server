const express = require('express');
const router = express.Router();
const toppingCategoryController = require('../controllers/Topping/ToppingCategory');


router.get('/auth/toppingcategory/get/:_id', toppingCategoryController.getToppingCategory);


router.post('/auth/toppingcategory/create', toppingCategoryController.createToppingCategory);


router.get('/auth/toppingcategory/list', toppingCategoryController.listToppingCategory);


router.get('/auth/toppingcategory/listActive', toppingCategoryController.listActiveToppingCategory);


router.post('/auth/toppingcategory/listByParams', toppingCategoryController.listToppingCategoryByParams);

router.put('/auth/toppingcategory/update/:_id', toppingCategoryController.updateToppingCategory);


router.delete('/auth/toppingcategory/remove/:_id', toppingCategoryController.removeToppingCategory);

module.exports = router;
