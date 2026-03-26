/**
 * When fetching crumbs, always fetch tags of crumbs
 */

const ecTable = {
    u: 'ec_user u',
    c: 'ec_crumb c',
    t: 'ec_tag t',
    x: 'ec_crumb_tag x',
    m: 'ec_media m'
};

const userSelect = `SELECT u.id, u.username FROM ${ecTable.u}`;
const userAuthSelect = `SELECT u.id, u.username, u.password FROM ${ecTable.u}`;
const crumbTagFileds = 'c.id, c.user_id, c.date, c.title, c.url, c.description, c.pin, c.color, c.deleted, t.tag_name';
const crumbSelect = `SELECT ${crumbTagFileds} FROM ${ecTable.c} LEFT JOIN ${ecTable.x} on c.id = x.crumb_id LEFT JOIN ${ecTable.t} on x.tag_id=t.id`;
const crumbSelectId = `SELECT c.id FROM ${ecTable.c} LEFT JOIN ${ecTable.x} on c.id = x.crumb_id LEFT JOIN ${ecTable.t} on x.tag_id=t.id`;
const crumbWhere = `c.user_id = ? AND c.deleted=0`;
const imgUrl = `c.url like '%gif%' or c.url like '%png%' or c.url like '%jpg%'`;
const crumbWithImg = `c.id in (select distinct crumb_id from ec_media WHERE media_type='image')`;
const crumbOrder = 'ORDER BY c.date desc';
const tagFields = 't.id, t.tag_name';
const tagOrder = 'ORDER BY t.tag_name';
const limitOffset = 'LIMIT 10 OFFSET 20'; //  SELECT * FROM ec_crumb LIMIT 10 OFFSET 20;

export const getAllUser = () => { return userSelect }
export const login = () => { return `${userAuthSelect} WHERE u.username= ?` }
// export const login = () => { return `${userSelect} WHERE u.username= ? AND u.password = ?` }
export const register = () => { return `INSERT INTO ec_user (username, password) VALUES (?, ?)`; }
export const resetPassword = () => { return `UPDATE ec_user SET password = ? WHERE username=?`; }

export const getPopularTag = () => {
    return `SELECT tag_name, count(*) c 
FROM ec_crumb c, ec_crumb_tag x, ec_tag t
WHERE t.id=x.tag_id and x.crumb_id=c.id AND c.user_id=?
GROUP BY tag_name
ORDER BY c desc`;
}
export const getCrumbPinned = () => { return `${crumbSelect} WHERE ${crumbWhere} AND c.pin=1 ${crumbOrder}`; }
export const getCrumb = () => { return `${crumbSelect} WHERE ${crumbWhere} ${crumbOrder}`; } // all crumbs with tag.
export const getDeletedCrumb = () => { return `${crumbSelect} WHERE c.user_id = ? AND c.deleted=1 ${crumbOrder}`; } // all crumbs with tag.
export const getImageCrumbTag = () => { return `${crumbSelect} WHERE ${crumbWhere} and (${imgUrl} OR ${crumbWithImg}) ${crumbOrder}`; }
export const getCrumbByTag = () => {
    return `${crumbSelect} WHERE c.id in (${crumbSelectId} WHERE ${crumbWhere} AND t.tag_name=? ${crumbOrder}) ${crumbOrder}`;
}
export const getCrumbNoTag = () => { return `${crumbSelect} WHERE ${crumbWhere} AND t.tag_name IS NULL ${crumbOrder}`; }
export const getCrumbByDate = (dbType) => {
    const sql = dbType === 'mysql' ?
        `${crumbSelect} 
      WHERE c.user_id= ? AND c.deleted=0 
      AND MONTH(c.date) = MONTH(?) 
      AND YEAR(c.date) = YEAR(?)
      ${crumbOrder}` :
        `${crumbSelect} 
      WHERE c.user_id= ? AND c.deleted=0
      AND strftime('%m', c.date) = strftime('%m', ?)
      AND strftime('%Y', c.date) = strftime('%Y', ?) 
      ${crumbOrder}`;
    return sql;
}
export const getSearchCrumb = () => { return `${crumbSelect} WHERE ${crumbWhere} AND ( c.title like ? OR c.description like ?) ${crumbOrder}`; }
export const getCrumbById = () => { return `${crumbSelect} WHERE c.id = ?`; }
export const getAllTag = () => { return `SELECT ${tagFields} FROM ${ecTable.t} ${tagOrder}`; }
export const getTagByUserId = () => { return `SELECT DISTINCT ${tagFields} FROM ${ecTable.t} LEFT JOIN ${ecTable.x} ON x.tag_id=t.id LEFT JOIN ${ecTable.c} ON c.id=x.crumb_id WHERE c.user_id= ? and c.deleted = 0 ${tagOrder}`; }
export const addCrumb = () => { return `INSERT INTO ec_crumb (user_id, title, url, date, description, color) VALUES (?, ?, ?, ?, ?, ?)`; }
export const updateCrumb = () => { return `UPDATE ec_crumb SET title=?, url=?, date=?, description=?, color=?, updated_at = CURRENT_TIMESTAMP WHERE id=?`; }
export const updatePin = () => { return `UPDATE ec_crumb SET pin=?, updated_at = CURRENT_TIMESTAMP WHERE id=?`; }
// export const deleteCrumb = () => { return `DELETE FROM ec_crumb WHERE id = ?`; }
export const deleteCrumb = () => { return `UPDATE ec_crumb SET deleted=if(deleted=0,1,0) WHERE id = ?`; }
export const unDeleteCrumb = () => { return `UPDATE ec_crumb SET deleted=0 WHERE id = ?`; }
export const getTagIdFromName = (tagCount) => {
    const placeholders = new Array(Math.max(0, Number(tagCount) || 0)).fill('?').join(', ');
    return `SELECT id, tag_name FROM ec_tag WHERE tag_name IN (${placeholders})`;
}
export const addNewTag = (dbType, columns, placeholders) => {
    let sql = dbType === 'mysql' ?
        `INSERT IGNORE INTO ec_tag (${columns.join(', ')}) VALUES ${placeholders}` :
        `INSERT OR IGNORE INTO ec_tag (${columns.join(', ')}) VALUES ${placeholders}`;
    return sql;
}
export const updateTag = () => { return `UPDATE ec_tag SET tag_name = ? where tag_name = ?`; }
export const deleteCrumbTagByCrumbId = () => { return `DELETE FROM EC_CRUMB_TAG WHERE crumb_id = ?`; }
export const addCrumbTag = (columns, placeholders) => { return `INSERT INTO ec_crumb_tag (${columns.join(', ')}) VALUES ${placeholders}`; }
export const addImage = (imageCount) => {
    const placeholders = new Array(Math.max(0, Number(imageCount) || 0)).fill('(?, ?)').join(', ');
    return `INSERT INTO ec_media (crumb_id, media_url) VALUES ${placeholders}`;
}
export const getCrumbImage = () => { return `SELECT id, media_url FROM ec_media WHERE crumb_id = ?`; }
export const deleteCrumbImage = () => { return `DELETE FROM ec_media WHERE id = ?`; }
