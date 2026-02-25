import { dbType, mysql, sqlite } from './config.js';
import sqlite3 from 'sqlite3';
import { createPool } from 'mysql2';
import bcrypt from 'bcrypt';
import * as dbQuery from './dbQuery.js';
import { logger } from '../logger.js';

let db;

const connectDB = () => {
    if (dbType === 'mysql') {
        db = createPool(mysql);
        db.getConnection((err, connection) => {
            if (err) {
                logger.logError('Error creating MySQL pool:', err);
            } else {
                logger.logInfo('MySQL Pool created successfully');
                connection.release(); // Release the connection back to the pool
            }
        });
    } else if (dbType === 'sqlite') {
        db = new sqlite3.Database(sqlite.filename, (err) => {
            if (err) {
                logger.logError(err.message);
            } else {
                logger.logInfo('sqlite database connected.');
            }
            // enable cascade delete
            db.run("PRAGMA foreign_keys = ON;", (err) => {
                if (err) {
                    logger.logError('⚠️ Failed to enable foreign keys:', err.message);
                } else {
                    logger.logInfo('🔗 Foreign key support enabled.');
                }
            });
        });
    } else {
        throw new Error(`Unsupported database type: ${dbType}`);
    }
    return db;
};

const getDB = () => {
    return db === undefined ? connectDB() : db;
}
export const execLog = (name, sql, sqlParams) => {
    logger.logDebug(`
========== ${name} ==========
sql: ${sql}
params: ${sqlParams && sqlParams.length > 0 ? sqlParams : 'no params'}`);
}
export const execSql = async (name, sql, sqlParams, db=getDB(), method = 'get') => {
    execLog(name, sql, sqlParams);
    const processResult = (error, results, resolve, reject) => {
        // if (error) return res.status(500).json({ error: err.message });
        if (error) {
            return reject(error);
        }
        return resolve(results);
    }
    return new Promise((resolve, reject) => {
        if (dbType === 'mysql') {
            return db.query(sql, sqlParams, (error, results) => {
                return processResult(error, results, resolve, reject);
            })
        } else if (dbType === 'sqlite') {
            if (method === 'run') {
                return db.run(sql, sqlParams, (error, results) => {
                    return processResult(error, results, resolve, reject);
                })
            } else {
                return db.all(sql, sqlParams, (error, results) => {
                    return processResult(error, results, resolve, reject);
                })
            }
        } else {

        }
    })
}

export const getSqlResult = async (sql) => {
    return await execSql('getAllUser', sql);
};
export const getAllUsers = async () => {
    return await execSql('getAllUser', dbQuery.getAllUser(), []);
};
export const login = async (username) => {
    return await execSql(`post /login`, dbQuery.login(), [username]);
};
export const register = async (username, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await execSql(`post /login`, dbQuery.register(), [username, hashedPassword]);
};
export const resetPassword = async (username, oldPassword, newPassword) => {
    const results = await execSql('login', dbQuery.login(), [username]);
    const user = results.length > 0 ? results[0] : null;
    if (user) {
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) return { error: 'resetP', message: 'The old and new password are not match' };
        if (oldPassword === newPassword) return { error: 'resetP', message: 'New password must differ from old password' };
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await execSql('get resetPassword', dbQuery.resetPassword(), [hashedPassword, username]);
        return { message: 'Password has been reset' };
    } else {
        return { error: 'resetU', message: 'Invalid user name' };
    }
}
export const getPopularTag = async (userId) => {
    return await execSql('getPopularTag', dbQuery.getPopularTag(), [userId]);
}
export const getCrumbPinned = async (userId) => {
    return await execSql('getCrumbPinned', dbQuery.getCrumbPinned(), [userId]);
}
export const getCrumb = async (userId) => {
    return await execSql('getCrumb', dbQuery.getCrumb(), [userId]);
}
export const getDeletedCrumb = async (userId) => {
    return await execSql('getDeletedCrumb', dbQuery.getDeletedCrumb(), [userId]);
}
export const getImageCrumbTag = async (userId) => {
    return await execSql('getImageCrumbTag', dbQuery.getImageCrumbTag(), [userId]);
}
export const getCrumbByTag = async (userId, tagName) => {
    return await execSql('getCrumbByTag', dbQuery.getCrumbByTag(), [userId, tagName]);
}
export const getCrumbNoTag = async (userId) => {
    return await execSql('getCrumbNoTag', dbQuery.getCrumbNoTag(), [userId]);
}
export const getCrumbByDate = async (userId, date) => {
    return await execSql('getCrumbByDate', dbQuery.getCrumbByDate(dbType), [userId, date, date]);
}
export const getSearchCrumb = async (userId, searchText) => {
    return await execSql('getSearchCrumb', dbQuery.getSearchCrumb(), [userId, `%${searchText}%`, `%${searchText}%`]);
}
export const getCrumbById = async (id) => {
    return await execSql('getCrumbById', dbQuery.getCrumbById(), [id]);
}
export const getAllTag = async () => {
    return await execSql('getAllTag', dbQuery.getAllTag(), []);
}
export const getTagByUserId = async (userId) => {
    return await execSql('getTagByUserId', dbQuery.getTagByUserId(), [userId]);
}
export const addCrumb = async (userId, title, url, crumbDate, description, color, tags) => {
    const sql = dbQuery.addCrumb();
    let insertID;
    if (dbType === 'sqlite') {
        getDB().run(sql, [userId, title, url, crumbDate, description, color], async function (err) {
            if (err) {
                return;
            } else {
                insertID = this.lastID;
                await updateTags(insertID, tags);
            }
        });
    } else {
        const results = await execSql('addCrumb', sql, [userId, title, url, crumbDate, description, color]);
        insertID = results.insertId;
        await updateTags(insertID, tags);
    }
}
export const updateCrumb = async (id, title, url, crumbDate, description, color, tags) => {
    const results = await execSql('put /crumb', dbQuery.updateCrumb(), [title, url, crumbDate, description, color, id], getDB(), 'run');
    await updateTags(id, tags);
    return results;
}
export const updatePin = async (id, pin) => {
    return await execSql('updatePin', dbQuery.updatePin(), [pin, id], getDB(), 'run');
}
export const deleteCrumb = async (id) => {
    return await execSql('deleteCrumb', dbQuery.deleteCrumb(), [id], getDB(), 'run');
}
const updateTags = async (id, tags) => {
    logger.logTrace('---------- updateTags ----------');
    // delete tags of the crumb
    await execSql('delete tags by crumbId', dbQuery.deleteCrumbTagByCrumbId(), [id], getDB(), 'run');

    if (!tags || tags.length === 0) {
        return;
    }

    // insert tags
    const crumbId = id; // save for later use
    let columns = ['tag_name'];
    let placeholders = tags.map(() => '(?)').join(', ');
    let sql = dbQuery.addNewTag(dbType, columns, placeholders);
    let flattenedValues = tags.flat();
    logger.logDebug(`tags: ${tags}`);
    let results = await execSql('put /crumb - insert tags', sql, flattenedValues, getDB(), 'run');

    // get all tag ids
    sql = dbQuery.getTagIdFromName(tags.length);
    results = await execSql('put /crumb - get tag  ids', sql, tags);
    const tagIds = results.map(results => results.id);
    logger.logDebug(`tagIds: ${tagIds}`);

    // insert crumb_tag
    columns = ['crumb_id', 'tag_id'];
    placeholders = tagIds.map(() => '(?, ?)').join(', ');
    sql = dbQuery.addCrumbTag(columns, placeholders);
    const values = tagIds.map((tagId) => { return [parseInt(crumbId, 10), tagId] });
    // Flatten the values array to match the placeholders
    flattenedValues = values.flat();
    logger.logDebug(`values: ${values}, Flat: ${flattenedValues}`);
    await execSql('insert crumbTag', sql, flattenedValues, getDB(), 'run');
}
export const updateTag = async (newName, oldName) => {
    return await execSql('put /updateTag', dbQuery.updateTag(), [newName, oldName], getDB(), 'run');
}
export const addImage = async (crumbId, imgUrls) => {
    if (!imgUrls || imgUrls.length === 0) {
        return { affectedRows: 0 };
    }
    const sql = dbQuery.addImage(imgUrls.length);
    const params = imgUrls.flatMap(url => [crumbId, url]);
    return await execSql('addImage', sql, params, getDB(), 'run');
}
export const getCrumbImage = async (crumbId) => {
    return await execSql('getCrumbImage', dbQuery.getCrumbImage(), [crumbId]);
}
export const deleteCrumbImage = async (id) => {
    return await execSql('deleteCrumbImage', dbQuery.deleteCrumbImage(), [id], getDB(), 'run');
}
