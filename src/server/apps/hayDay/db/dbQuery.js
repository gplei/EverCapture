/**
 * HD
 */

export const getBuilding = () => {return `SELECT * from buildings`;}
export const getBuildingType = () => {return `SELECT distinct type from buildings`;}
export const getBuildingByType = () => {return `select * from buildings where type = ? order by level`;}
export const addBuillding = () => {return 'INSERT INTO buildings (type, name, level) VALUES (?, ?, ?)';}
export const updateBuilding = () => {return `UPDATE buildings SET type = ?, name = ?, level = ? WHERE id = ?`;}
export const deleteBuilding = () => {return 'DELETE FROM buildings WHERE id = ?';}

export const getProduct = () => {return `
    SELECT p.id, p.name, p.minute, p.level, b.name as building_name, barn_product_ratio
        FROM products p, buildings b 
        where b.id=p.building_id and b.type != 'Kit' order by p.name
    `;
}
export const getProductByBuildingId = () => {return 'SELECT * from products where building_id = ? order by level';}
export const addProduct = () => {return `INSERT INTO products (name, minute, building_id, level, barn_product_ratio) VALUES (?, ?, ?, ?, ?)`;}
export const updateProduct = () => {return `UPDATE products SET name = ?, minute=?, building_id = ?, level = ?, barn_product_ratio=? WHERE id = ?`;}
export const deleteProduct= () => {return 'DELETE FROM products WHERE id = ?';}
export const deleteProductIngredient = () => {return 'DELETE FROM ingredients WHERE product_id = ?';}
export const updateProductBuilding = () => { return 'update products set building_id=? where id=?';}
export const getIngredientByProductId = () => {return `
    SELECT i.id as ingredient_id, p.id as product_id, p.name, i.count count 
                FROM ingredients i 
                JOIN products p ON i.ingredient_id = p.id 
                WHERE i.product_id = ?`;}
export const addIngredientForProduct = () => {return 'INSERT INTO ingredients (product_id, ingredient_id, count) VALUES (?, ?, ?)';}
export const deleteIngredient = () => {return 'DELETE FROM ingredients WHERE id = ?';}
export const getAllBuildingProduct = () => {return `
    SELECT b.id as building_id, b.name as building_name, b.level as building_level, 
                p.id as product_id, p.name as product_name, p.level as product_level 
                FROM buildings b 
                LEFT JOIN products p ON b.id = p.building_id
    `;
} // not used
