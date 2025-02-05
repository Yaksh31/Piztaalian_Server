const express = require("express");
const router = express.Router();
const toppingMasterController = require("../controllers/Topping/ToppingMaster");

router.get('/auth/toppingmaster/get/:_id', toppingMasterController.getToppingMaster);
router.post('/auth/toppingmaster/create', toppingMasterController.createToppingMaster);
router.get('/auth/toppingmaster/list', toppingMasterController.listToppingMaster);
router.get('/auth/auth/toppingmaster/listActive', toppingMasterController.listActiveToppingMaster);
router.post('/auth/toppingmaster/listByParams', toppingMasterController.listToppingMasterByParams);
router.put('/auth/toppingmaster/update/:_id', toppingMasterController.updateToppingMaster);
router.delete('/auth/toppingmaster/remove/:_id', toppingMasterController.removeToppingMaster);

module.exports = router;
