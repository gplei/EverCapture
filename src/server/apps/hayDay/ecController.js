import { logger } from '../../logger.js';
import * as dbExec from './db/dbExec.js';

/**
 * In this controller module, process the fetch parameters and pass down to dbExec
 * 
 * Handle res.json on this level only
 */
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/********************************************************************************/

export const getSqlResult = catchAsync(async (req, res) => {
    const { sql } = req.params;
    const result = await dbExec.getSqlResult(sql);
    return res.json(result);
})

export const getBuilding = catchAsync(async (req, res) => {
    const result = await dbExec.getBuilding();
    return res.json(result);
})
export const getBuildingType = catchAsync(async (req, res) => {
    const result = await dbExec.getBuildingType();
    return res.json(result);
})
export const getBuildingByType = catchAsync(async (req, res) => {
    const { type } = req.params;
    const result = await dbExec.getBuildingByType(type);
    return res.json(result);
})
export const addBuillding = catchAsync(async (req, res) => {
    const { type, name, level } = req.body;
    const result = await dbExec.addBuillding(type, name, level);
    logger.logError(JSON.stringify(result));
    return res.json(result);
})
export const updateBuilding = catchAsync(async (req, res) => {
    logger.logInfo('updateBuilding');
    console.log('ddd');
    const { id } = req.params;
    const { type, name, level } = req.body;

    const result = await dbExec.updateBuilding(id, type, name, level);
    return res.json(result);
})
export const deleteBuilding = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await dbExec.deleteBuilding(id);
    return res.json(result);
})

export const getProduct = catchAsync(async (req, res) => {
    const result = await dbExec.getProduct();
    return res.json(result);
})
export const getProductByBuildingId = catchAsync(async (req, res) => {
    const { buildingId } = req.params;
    const result = await dbExec.getProductByBuildingId(buildingId);
    return res.json(result);
})
export const addProduct = catchAsync(async (req, res) => {
    const { name, minute, building_id, level, barn_product_ratio } = req.body;
    const result = await dbExec.addProduct(name, minute, building_id, level, barn_product_ratio);
    return res.json(result);
})
export const updateProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, minute, building_id, level, barn_product_ratio } = req.body;
    const result = await dbExec.updateProduct(id, name, minute, building_id, level, barn_product_ratio);
    return res.json(result);
})
export const deleteProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await dbExec.deleteProduct(id);
    return res.json(result);
})
export const deleteProductIngredient = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await dbExec.deleteProductIngredient(id);
    return res.json(result);
})
export const updateProductBuilding =  catchAsync(async (req, res) => {
    const {prodId }=req.params;
    const {buildingId} = req.body;
    const result = await dbExec.updateProductBuilding(buildingId, prodId);
    return res.json(result);
})

export const getIngredientByProductId = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await dbExec.getIngredientByProductId(id);
    return res.json(result);
})
export const addIngredientForProduct = catchAsync(async (req, res) => {
    const { product_id, ingredient, count } = req.body;
    const result = await dbExec.addIngredientForProduct(product_id, ingredient, count);
    return res.json(result);
})
export const deleteIngredient = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await dbExec.deleteIngredient(id);
    return res.json(result);
})
export const getAllBuildingProduct = catchAsync(async (req, res) => {
    const result = await dbExec.getAllBuildingProduct();
    return res.json(result);
}) // not used

