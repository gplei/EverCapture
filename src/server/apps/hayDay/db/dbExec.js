import { createPool } from 'mysql2';
import { mysqlHD } from './config.js';
import * as dbQuery from './dbQuery.js';
import * as parExec from '../../../db/dbExec.js'

let dbHD;
const getDB = () => {
    return dbHD === undefined ? createPool(mysqlHD) : dbHD;
}
const execSql = async (name, sql, sqlParams) => {
    return await parExec.execSql(name,sql,sqlParams, getDB());
}

/********************************************************************************/

export const getSqlResult = async (sql) => {
    return await execSql('getSqlResult',  sql);
}

export const getBuilding = async () => {
    return await execSql('getBuilding',  dbQuery.getBuilding());
}
export const getBuildingType = async () => {
    return await execSql('getBuildingType',  dbQuery.getBuildingType());
}
export const getBuildingByType = async (type) => {
    return await execSql('getBuildingByType',  dbQuery.getBuildingByType(), [type]);
}
export const addBuillding = async (type, name, level) => {
    return await execSql('addBuillding',  dbQuery.addBuillding(), [type, name, level]);
}
export const updateBuilding = async (id, type, name, level) => {
    return await execSql('updateBuilding',  dbQuery.updateBuilding(), [type, name, level, id]);
}
export const deleteBuilding = async (id) => {
    return await execSql('deleteBuilding',  dbQuery.deleteBuilding(), [id]);
}

export const getProduct = async () => {
    return await execSql('getProduct',  dbQuery.getProduct());
}
export const getProductByBuildingId = async (buildingId) => {
    return await execSql('getProductByBuildingId',  dbQuery.getProductByBuildingId(),[buildingId]);
}
export const addProduct = async (name, minute, building_id, product_level, barn_product_ratio) => {
    return await execSql('addProduct',  dbQuery.addProduct(),[name, minute, building_id, product_level, barn_product_ratio]);
}
export const updateProduct =async (id,name, minute, buildingId, level, barn_product_ratio) => {
    return await execSql('updateProduct',  dbQuery.updateProduct(), [name, minute, buildingId, level == "" ? -1 : level, barn_product_ratio, id]);
}
export const deleteProduct =async (id) => {
    return await execSql('deleteProduct',  dbQuery.deleteProduct(),[id]);
}
export const deleteProductIngredient =async (id) => {
    return await execSql('deleteProductIngredient',  dbQuery.deleteProductIngredient(),[id]);
}
export const updateProductBuilding =async (buildingId, prodId ) => {
    return await execSql('updateProductBuilding',  dbQuery.updateProductBuilding(),[buildingId, prodId]);
}

export const getIngredientByProductId =async (id) => {
    return await execSql('getIngredientByProductId',  dbQuery.getIngredientByProductId(),[id]);
}
export const addIngredientForProduct =async (product_id, ingredients, count) => {
    return await execSql('addIngredientForProduct',  dbQuery.addIngredientForProduct(),
    [product_id, ingredients, count]);

    // if (ingredients.length === 0) {
    //     res.json(({ id: product_id, ingredients }));
    //     return;
    // }

    // let i = 0;
    // const ingredientValues = ingredients.map(ingredient_id => [product_id, ingredient_id, counts[i++]]);
    // pool.query('INSERT INTO ingredients (product_id, ingredient_id, count) VALUES ?', [ingredientValues], (error, results) => {
    //     if (error) return processError(res, error);
    //     res.json({ id: product_id, ingredients });
    // });
}
export const deleteIngredient =async (id) => {
    return await execSql('deleteIngredient',  dbQuery.deleteIngredient(),[id]);
}
export const getAllBuildingProduct =async (sql) => {
    return await execSql('getAllBuildingProduct',  dbQuery.getAllBuildingProduct());
} // not used
