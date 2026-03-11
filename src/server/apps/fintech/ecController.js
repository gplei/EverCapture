import * as dbExec from './db/dbExec.js';
import { logger } from '../../logger.js';
/**
 * In this controller module, process the fetch parameters and pass down to dbExec
 * 
 * Handle res.json on this level only
 */
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
const quoteCache = new Map();
const QUOTE_CACHE_TTL_MS = 60 * 1000; // 1 min

/********************************************************************************
 * transaction
 */
export const getCategory = catchAsync(async (req, res) => {
    const results = await dbExec.getCategory();
    res.json(results);
})
export const getTransaction = catchAsync(async (req, res) => {
    const results = await dbExec.getTransaction();
    return res.json(results);
})
export const getUncategorizedTrans = catchAsync(async (req, res) => {
    const results = await dbExec.getUncategorizedTrans();
    return res.json(results);
})
export const addTransaction = catchAsync(async (req, res) => {
    await dbExec.addTransaction();
    res.json('addTransaction');
})
export const getTranDetailById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const results = await dbExec.getTranDetailById(id);
    return res.json(results);
})
export const getTranSummary = catchAsync(async (req, res) => {
    const { id } = req.params;
    const results = await dbExec.getTranSummary(id);
    return res.json(results);
})
export const addTranDetail = catchAsync(async (req, res) => {
    const {transaction_id, description, amount, category_id, subcategory_id} = req.body;
    const results = await dbExec.addTranDetail(transaction_id, description, amount, category_id, subcategory_id);
    res.json(results);
})
export const updateTranCategoryByIds = catchAsync(async (req, res)=>{
    const { catId, subcatId, ids } = req.body;
    if (!Array.isArray(ids)) {
        return res.status(400).json({ message: 'ids must be an array' });
    }
    const results = await dbExec.updateTranCategoryByIds(catId, subcatId, ids);
    res.json(results);
})
// category
export const getTranCategory = catchAsync(async (req, res)=>{
    const { }=req.params;
    const results = await dbExec.getTranCategory();
    res.json(results);
})
export const addTranCategory = catchAsync(async (req, res)=>{
    const { }=req.params;
    await dbExec.addTranCategory();
    res.json('addTranCategory');
})
export const updateTranCategory = catchAsync(async (req, res)=>{
    const {id, newVal, column }=req.params;
    await dbExec.updateTranCategory(id, newVal, column);
    res.json('updateTranCategory');
})
export const deleteTranCategory = catchAsync(async (req, res)=>{
    const { }=req.params;
    await dbExec.deleteTranCategory();
    res.json('deleteTranCategory');
})
// event
export const getTranEvent = catchAsync(async (req, res)=>{
    const { }=req.params;
    const results = await dbExec.getTranEvent();
    res.json(results);
})
export const addTranEvent = catchAsync(async (req, res)=>{
    const { }=req.params;
    await dbExec.addTranEvent();
    res.json('addTranEvent');
})
export const updateTranEvent = catchAsync(async (req, res)=>{
    const {id, newVal, column }=req.params;
    await dbExec.updateTranEvent(id, newVal, column);
    res.json('updateTranEvent');
})
export const deleteTranEvent = catchAsync(async (req, res)=>{
    const { }=req.params;
    await dbExec.deleteTranEvent();
    res.json('deleteTranEvent');
})
// payment method
export const getTranPaymentMethod = catchAsync(async (req, res)=>{
    const { }=req.params;
    const results = await dbExec.getTranPaymentMethod();
    res.json(results);
})
export const addTranPaymentMethod = catchAsync(async (req, res)=>{
    const { }=req.params;
    await dbExec.addTranPaymentMethod();
    res.json('addTranPaymentMethod');
})
export const updateTranPaymentMethod = catchAsync(async (req, res)=>{
    const {id, newVal, column }=req.params;
    await dbExec.updateTranPaymentMethod(id, newVal, column);
    res.json('updateTranPaymentMethod');
})
export const deleteTranPaymentMethod = catchAsync(async (req, res)=>{
    const { }=req.params;
    await dbExec.deleteTranPaymentMethod();
    res.json('deleteTranPaymentMethod');
})

/**
 * fintech
 */
export const getTrade = catchAsync(async (req, res) => {
    const results = await dbExec.getTrade();
    return res.json(results);
})
export const addSymbol = catchAsync(async (req, res) => {
    const { symbol, company_name, asset_type } = req.body
    const result = await dbExec.addSymbol(symbol, company_name, asset_type);
    res.json({ message: 'symbol added', id: result.insertId });
})
export const addTrade = catchAsync(async (req, res) => {
    const { tradeDate, accountId, symbolId, tradeType, share, price, lot } = req.body;
    const result = await dbExec.addTrade(tradeDate, accountId, symbolId, tradeType, share, price, lot);
    res.json({ message: 'trade added', id: result.insertId });
})
/**
 * get current market price and update table
 * take only 1 or no symbol
 */
export const updatePrice = catchAsync(async (req, res) => {
    const { symbol } = req.body;
    if (!symbol) {
        // no symbol is provided. fetch and update all prices
        const delay = (ms) => new Promise(res => setTimeout(res, ms));

        const allSymbol = await dbExec.getTable('trade_symbol');
        const failed = [];
        for (const item of allSymbol) {
            try {
                const q = await getStockQuote(item.symbol);
                await dbExec.updatePrice(item.symbol, q.c, q.pc);
            } catch (error) {
                failed.push({ symbol: item.symbol, error: error.message });
                logger.logError(`Failed to update ${item.symbol}: ${error.message}`);
            }
            await delay(1500);
        }
        res.json({
            message: failed.length === 0 ? 'all prices are updated' : 'prices updated with some failures',
            failed
        });
    } else {
        // fetch and update price for the symbol
        logger.logDebug('update single price');
        try {
            const q = await getStockQuote(symbol);
            await dbExec.updatePrice(symbol, q.c, q.pc);
            res.json({ price: q.c, previousClose: q.pc, symbol: String(symbol).toUpperCase() });
        } catch (error) {
            logger.logError(`Failed to update ${symbol}: ${error.message}`);
            res.status(502).json({
                error: 'Quote Fetch Error',
                message: error.message,
                symbol: String(symbol).toUpperCase()
            });
        }
    }
})
/**
 * this is the real deal to get stock quote one at a time
 * @param {*} ticker 
 * @returns 
 */
async function getStockQuote(ticker) {
    const normalizedTicker = String(ticker).trim().toUpperCase();
    const cached = quoteCache.get(normalizedTicker);
    if (cached && Date.now() - cached.ts < QUOTE_CACHE_TTL_MS) {
        return cached.quote;
    }

    const API_KEY = process.env.FINNHUB_API_KEY;
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const saveToCache = (quote) => {
        quoteCache.set(normalizedTicker, { quote, ts: Date.now() });
        return quote;
    };
    if (!API_KEY) {
        throw new Error('FINNHUB_API_KEY is missing. Set it in your .env and restart server.');
    }

    // the end point of finnhub can get only 1 quote at a time
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(normalizedTicker)}&token=${API_KEY}`;
    logger.logDebug(url);
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            if (typeof data?.c === 'number' && data.c > 0 && typeof data?.pc === 'number' && data.pc > 0) {
                return saveToCache(data);
            }
            throw new Error(`Invalid quote data: c=${data?.c}, pc=${data?.pc}`);
        } catch (error) {
            lastError = error;
            logger.logError(`Finnhub quote failed for ${normalizedTicker} (attempt ${attempt + 1}/3): ${error.message}`);
            if (attempt < 2) {
                await sleep(700 * (attempt + 1));
            }
        }
    }
    throw new Error(`Finnhub quote failed for ${normalizedTicker}: ${lastError?.message ?? 'Unknown error'}`);
}
export const addAccount = catchAsync(async (req, res) => {
    const { institute, account_name } = req.body;
    const result = await dbExec.addAccount(institute, account_name);
    res.json({ message: 'account added', id: result.insertId });
})
export const getAccount = catchAsync(async (req, res) => {
    const results = await dbExec.getAccount();
    return res.json(results);
})
export const getAccountBalanceByDate = catchAsync(async (req, res) => {
    const { date } = req.params;
    const results = await dbExec.getAccountBalanceByDate(date);
    return res.json(results);
})

// table
export const getTable = catchAsync(async (req, res) => {
    const { table } = req.params;
    const results = await dbExec.getTable(table);
    res.json(results);
})
export const addTable = catchAsync(async (req, res) => {
    const { table } = req.params;
    const result = await dbExec.addTable(table);
    res.status(201).json({ message: `new row is added into table ${table}`, id: result.insertId });
})
export const updateTable = catchAsync(async (req, res) => {
    const { id, column, newValue, table } = req.body;
    await dbExec.updateTable(id, column, newValue, table);
    res.json(`updateTable ${table}`);
})
export const deleteTable = catchAsync(async (req, res) => {
    const { id, table } = req.params;
    await dbExec.deleteTable(id, table);
    res.json(`deleteTable ${table}`);
})
