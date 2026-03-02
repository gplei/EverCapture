import { createPool } from 'mysql2';
import { mysqlFintech } from './config.js';
import * as dbQuery from './dbQuery.js';
import * as parExec from '../../../db/dbExec.js';
import { logger } from '../../../logger.js';
/**
 * common
 */
let dbHD = null;
let connCnt = 0;
const getDB = () => {
    if (dbHD === null) {
        dbHD = createPool(mysqlFintech);
        connCnt++;
        logger.logInfo(`dbConn count ${connCnt}`);
    } else {
        //        logger.logInfo(`reuse dbConn`);
    }
    return dbHD;
}
const execSql = async (name, sql, sqlParams) => {
    execLog(name, sql, sqlParams);
    return await parExec.execSql(name, sql, sqlParams, getDB());
}
export const execLog = (name, sql, sqlParams) => {
    logger.logDebug(`
========== ${name} ==========
sql: ${sql}
params: ${sqlParams && sqlParams.length > 0 ? sqlParams : 'no params'}
`);
}

/**
 * pure  sql
 */
export const getSqlResult = async (sql) => {
    return await execSql('getSqlResult', sql);
}

/**
 * transaction
*/
export const getCategory = async () => {
    return await execSql('getCategory', dbQuery.getCategory());
}
export const getTransaction = async (id) => {
    return await execSql('getTransaction', dbQuery.getTransaction(), [id]);
}
export const getUncategorizedTrans = async (id) => {
    return await execSql('getUncategorizedTrans', dbQuery.getUncategorizedTrans(), [id]);
}
export const addTransaction = async () => {
    return await execSql('addTransaction', dbQuery.addTransaction());
}
export const getTranDetailById = async (id) => {
    return await execSql('getTranDetailById', dbQuery.getTranDetailById(), [id]);
}
export const getTranSummary = async (id) => {
    return await execSql('getTranSummary', dbQuery.getTranSummary(), [id]);
}
export const addTranDetail = async (transaction_id, description, amount, category_id, subcategory_id) => {
    return await execSql('addTranDetail', dbQuery.addTranDetail(), [transaction_id, description, amount, category_id, subcategory_id]);
}
export const updateTranCategoryByIds = async (catId, subcatId, ids) => {
    if (ids.length === 0) {
        return { affectedRows: 0 };
    }
    return await execSql('updateCategoryByIds', dbQuery.updateTranCategoryByIds(ids.length), [catId, subcatId, ...ids]);
}
/**
 * stock
 */
export const getTrade = async () => {
    return await execSql('getTrade', dbQuery.getTrade());
}
export const addSymbol = async (symbol, company_name, asset_type) => {
    return await execSql('addSymbol', dbQuery.addSymbol(), [symbol, company_name, asset_type]);
}
export const addTrade = async (tradeDate, accountId, symbolId, tradeType, share, price, lot) => {
    return await execSql('addTrade', dbQuery.addTrade(), [tradeDate, accountId, symbolId, tradeType, share, price, lot]);
}
export const updatePrice = async (symbol, price, previous_price) => {
    return await execSql('updatePrice', dbQuery.updatePrice(), [price, previous_price, symbol]);
}
export const addAccount = async (institute, account_name) => {
    return await execSql('addAccount', dbQuery.addAccount(), [institute, account_name]);
}
export const getAccount = async () => {
    return await execSql('getAccount', dbQuery.getAccount());
}
export const getAccountBalanceByDate = async (date) => {
    return await execSql('getAccount', dbQuery.getAccountBalanceByDate(), [date]);
}

/**
 * generic table
 */
export const getTable = async (table) => {
    return await execSql('getTable', dbQuery.getTable(table));
}
export const addTable = async (table) => {
    return await execSql('addTable', dbQuery.addTable(table), []);
}
export const updateTable = async (id, column, newValue, table) => {
    return await execSql('updateTable', dbQuery.updateTable(table, column), [newValue, id]);
}
export const deleteTable = async (id, table) => {
    return await execSql('deleteTable', dbQuery.deleteTable(table), [id]);
}
