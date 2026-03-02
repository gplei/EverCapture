import express from 'express';
import * as ecController from './ecController.js';

const router = express.Router();

/*******************************************************************************
 * tranction
*/
router.get('/category', ecController.getCategory);
router.get('/transaction', ecController.getTransaction);
router.get('/uncategorizedTransaction', ecController.getUncategorizedTrans);
router.get('/tranDetail/:id', ecController.getTranDetailById);
router.post('/transaction', ecController.addTransaction);
router.get('/tranSummary', ecController.getTranSummary);
router.post('/tranDetail', ecController.addTranDetail);
router.put('/updateTranCategory', ecController.updateTranCategoryByIds);

/**
 * stock
 */
router.get('/trade', ecController.getTrade);
// router.get('/symbol', ecController.getSymbol);
// router.get('/tradeSymbol/:symbol', ecController.getTradeBySymbol);
// router.post('/symbol', ecController.addSymbol);
// router.post('/trade', ecController.addTrade);
// router.post('/account', ecController.addAccount);
// router.get('/account', ecController.getAccount);
router.put('/price', ecController.updatePrice);
// router.put('/trade', ecController.updateTrade);
router.get('/acctBalance/:date', ecController.getAccountBalanceByDate);
// table
router.get('/table/:table', ecController.getTable);
router.post('/table/:table', ecController.addTable);
router.put('/table', ecController.updateTable);
router.delete('/table/:id/:table', ecController.deleteTable);

export default router;
