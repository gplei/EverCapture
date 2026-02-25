import * as dbExec from './db/dbExec.js';
import yahooFinance from "yahoo-finance2";
import { logger } from '../../logger.js';
/**
 * In this controller module, process the fetch parameters and pass down to dbExec
 * 
 * Handle res.json on this level only
 */
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

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
export const updatePrice = catchAsync(async (req, res) => {
    const { symbol } = req.body;
    if (!symbol) {
        const delay = (ms) => new Promise(res => setTimeout(res, ms));

        const allSymbol = await dbExec.getTable('trade_symbol');
        for (const item of allSymbol) {
            const q = await getStockQuote(item.symbol);
            await dbExec.updatePrice(item.symbol, q.c, q.pc);
            await delay(1500);
        }
        res.json({ message: 'all prices are updated' });
    } else {
        const q = await getStockQuote(symbol);
        await dbExec.updatePrice(symbol, q.c, q.pc);
        res.json({ price: q.c });
    }
})
// get quote and return
export const getSymbolQuotes = catchAsync(async (req, res) => {
    const symbols = req.params.symbols.split(',');
    try {
        const results = await Promise.all(
            // symbols.map(ticker => yahooFinance.quote(ticker))
            symbols.map(ticker => getStockQuote(ticker))
        );
        res.json(results);
    } catch (err) {
        logger.logError(err.message);
        res.status(502).json({ message: 'Failed to fetch stock quotes' });
    }
})
async function getStockPrice(ticker) {
    const q = await getStockQuote(ticker);
    if (q.c) {
        return q.c;
    }
}
async function getStockQuote(ticker) {
    const API_KEY = process.env.FINNHUB_API_KEY;
    if (!API_KEY) {
        throw new Error('FINNHUB_API_KEY is not configured');
    }
    const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${API_KEY}`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Finnhub returns 'c' for Current Price
        if (data.c) {
            // console.log(`--- ${ticker} ---`);
            // console.log(`Current Price: $${data.c}`);
            // console.log(`High of Day: $${data.h}`);
            // console.log(`Low of Day: $${data.l}`);
            // console.log(`Previous Close: $${data.pc}`);
            return data;
        } else {
            throw new Error("No data found. Check your ticker symbol.");
        }

    } catch (error) {
        throw new Error(`Failed to fetch stock data: ${error.message}`);
    }
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
