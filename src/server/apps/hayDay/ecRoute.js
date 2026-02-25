import express from 'express';
import * as ecController from './ecController.js';

const router = express.Router();
const app = express();


/**
 * HD
 */

/********************************************************************************/

router.get('/summary/:sql', ecController.getSqlResult);
router.get('/allBuildings', ecController.getBuilding);
router.get('/types', ecController.getBuildingType);
router.get('/buildings/:type', ecController.getBuildingByType);
router.post('/buildings', ecController.addBuillding);
router.put('/buildings/:id', ecController.updateBuilding);
router.delete('/buildings/:id', ecController.deleteBuilding);

router.get('/products', ecController.getProduct);
router.get('/buildingProducts/:buildingId', ecController.getProductByBuildingId);
router.post('/products', ecController.addProduct);
router.put('/products/:id', ecController.updateProduct);
router.delete('/products/:id', ecController.deleteProduct);
router.delete('/productIngredents/:id', ecController.deleteProductIngredient);
router.put('/productBuilding/:prodId', ecController.updateProductBuilding);

router.get('/products/:id/ingredients', ecController.getIngredientByProductId);
router.post('/ingredients', ecController.addIngredientForProduct);
router.delete('/ingredients/:id', ecController.deleteIngredient);
router.get('/buildings', ecController.getAllBuildingProduct); // not used

export default router; 
