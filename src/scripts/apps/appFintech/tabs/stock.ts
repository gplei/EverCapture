import * as DataProvider from '../../../db/dataProvider';
import * as CommonUtil from '../../../common';
import * as AppCommonTable from '../../appCommon/commonTable';

//#region interface
interface Trade {
    id: string;
    account_id: string;
    symbol_id: string;
    trade_date: string;
    trade_type: 'BUY' | 'SELL';
    share: number;
    price: number;
    lot: number;
    // extra property
    comment?: string
}
interface Symbol {
    id: string;
    symbol: string;
    company_name: string;
    price: number;
    previous_price: number;
    asset_type: "Stock" | "Fund" | "ETF" | "Bond";
}
interface Account {
    id: string;
    account_name: string;
    institute: string;
}
interface AccountBalance {
    id: string;
    account_id: string;
    total_balance?: number;
    market_value?: number;
    cash_balance?: number;
    cost_basis?: number;
    notes?: string;
}

/** 
 *  unrealized summary for all symbols 
*/
interface allSummary {
    symbol: string;
    share?: number;
    price?: number;
    diff?: number;
    pct?: string;
    value: number;
    cost_basis: number;
    gain_loss: string;
}
interface GainLossSummary {
    cost_basis: number;
    gain_loss: number;
    summary: string; // gain_loss(pct)
}
/**
 * historical summary for one symbol
 */
interface SingleSummary {
    remaining_share: number;
    current_value: number;
    unrealized: GainLossSummary;
    realized: GainLossSummary;
    total: GainLossSummary;
}
//#endregion
//#region table and data
const ACCOUNT_TABLE = 'trade_account';
const ACCOUNT_BALANCE_TABLE = 'trade_account_balances';
const SYMBOL_TABLE = 'trade_symbol';
const TRADE_TABLE = 'trade_log';

// data from table
let dataAccount: Account[];
let dataSymbol: Symbol[];
let dataTrade: Trade[];
let dataAcctBalance: AccountBalance[];
//#endregion
let acctBalSumData: any;
let selectedSymbol: Symbol | undefined; // selected symbol object corresponding with dropdown

export const initStock = async () => {
    await initData();
    initElement();
}
const initData = async () => {
    const defaultSymbolType = 'Stock';
    await fetchAndRenderAssetType(defaultSymbolType);
    await fetchAccount();
    await fetchSymbol();
    await fetchTrade();
    await fetchAccountBalance((new Date()).toISOString().split('T')[0]);
}
//#region fetch
const fetchAndRenderAssetType = async (selectedValue?: string) => {
    const assetType = await AppCommonTable.getEnumValue('fintech', 'trade_symbol', 'asset_type');
    const selAssetType = CommonUtil.getSelectElement('selAssetType');
    CommonUtil.populateSelect(selAssetType, CommonUtil.mapArrayToOption(assetType));
    if (selectedValue !== undefined) {
        selAssetType.value = selectedValue;
    }
}
const fetchAccount = async () => {
    dataAccount = await AppCommonTable.getTable(ACCOUNT_TABLE);
}
const fetchSymbol = async () => {
    dataSymbol = await AppCommonTable.getTable(SYMBOL_TABLE);
}
const fetchTrade = async () => {
    dataTrade = await AppCommonTable.getTable(TRADE_TABLE);
}
const fetchAccountBalance = async (date: string) => {
    dataAcctBalance = await AppCommonTable.getTable(ACCOUNT_BALANCE_TABLE);
    acctBalSumData = await DataProvider.fetchData(`acctBalance/${date}`);
}
//#endregion
const initElement = () => {
    const selSymbol = CommonUtil.getSelectElement('selSymbol');
    const renderSelSymbol = (selSymbol: HTMLSelectElement) => {
        CommonUtil.populateSelect(selSymbol, CommonUtil.mapObjectToOption(dataSymbol as any, 'id', 'symbol'));
    }

    const initAccountSymbolManager = () => {
        const initManageType = () => {
            const selManageType = CommonUtil.getSelectElement('selManageType');
            CommonUtil.populateSelect(selManageType, CommonUtil.mapArrayToOption(['Account', 'Symbol']));
            selManageType.addEventListener('change', () => {
                if (selManageType.selectedIndex === 0) {
                    CommonUtil.showHideContainer('divAccountManager', true);
                    CommonUtil.showHideContainer('divSymbolMgr', true);
                    return;
                }

                const mode = selManageType.value;
                const isAccount = mode === 'Account';
                const isSymbol = mode === 'Symbol';

                CommonUtil.showHideContainer('divAccountManager', !isAccount);
                CommonUtil.showHideContainer('divSymbolMgr', !isSymbol);
            });
        }
        const initAcctMgr = () => {
            const selAccountMgr = CommonUtil.getSelectElement('selAccountMgr');
            const txtAccountMgr = CommonUtil.getInputElement('txtAccountMgr');
            const txtInstituteMgr = CommonUtil.getInputElement('txtInstituteMgr');
            const btnSaveAccount = CommonUtil.getButtonElement('btnSaveAccount');
            const accountMgrMessage = CommonUtil.getSpanElement('accountMgrMessage');
            const balanceMsg = CommonUtil.getSpanElement('balanceMsg');
            const dtBalence = CommonUtil.getInputElement('dtBalence');
            const divAccountBalance = CommonUtil.getDivElement('divAccountBalance');

            dtBalence.value = (new Date()).toISOString().split('T')[0];

            const renderAccountBalance = async (accountId: string) => {
                divAccountBalance.innerHTML = "";

                let dataBalance = dataAcctBalance.filter((x: any) => x.account_id?.toString() === accountId);
                if (!dataBalance || dataBalance.length === 0) {
                    divAccountBalance.innerHTML = "<span class='lightLabel'>No account balance data.</span>";
                    return;
                }

                const updateBalance = async (id: string, newValue: string, columnName: string) => {
                    await AppCommonTable.updateTable(ACCOUNT_BALANCE_TABLE, id, columnName, newValue)
                }

                divAccountBalance.appendChild(
                    AppCommonTable.createTable(dataBalance, {
                        table: {
                            onchange: updateBalance
                        },
                        column: [
                            { columnName: 'date', type: 'DATE' },
                            { columnName: 'total_balance', type: 'CURRENCY' },
                            { columnName: 'cost_basis', type: 'CURRENCY' },
                            { columnName: 'market_value', type: 'CURRENCY' },
                            { columnName: 'gain_loss', type: 'CURRENCY' },
                        ]
                    })
                );
            };
            const renderBalanceSummary = () => {
                divAccountBalance.innerHTML = '';
                divAccountBalance.appendChild(AppCommonTable.createTable(acctBalSumData));
                const total = acctBalSumData.reduce(
                    (sum: number, acc: any) => sum + (acc.total_balance ?? 0),
                    0
                );
                balanceMsg.textContent = `Total balance: ${CommonUtil.usdFormatter.format(total)} as of `;
            }

            const renderSelAccountMgr = () => {
                CommonUtil.populateSelect(selAccountMgr, CommonUtil.mapObjectToOption(dataAccount as any, 'id', 'account_name'));
            }

            renderSelAccountMgr();
            selAccountMgr.addEventListener('change', async () => {
                if (selAccountMgr.selectedIndex === 0) {
                    btnAddBalance.classList.add('hidden');
                    renderBalanceSummary();
                } else {
                    btnAddBalance.classList.remove('hidden');
                    balanceMsg.textContent = '';
                    const selected = selAccountMgr.selectedOptions[0]?.textContent ?? '';
                    txtAccountMgr.value = selAccountMgr.selectedIndex > 0 ? selected : '';
                    txtInstituteMgr.value = dataAccount.find((x: any) => x.id?.toString() === selAccountMgr.value)?.institute ?? '';
                    await renderAccountBalance(selAccountMgr.value);
                }
            });

            dtBalence.addEventListener('change', async () => {
                await fetchAccountBalance(dtBalence.value);
                renderBalanceSummary();
            })
            btnSaveAccount.addEventListener('click', async () => {
                if (txtAccountMgr.classList.contains('hidden')) {
                    txtAccountMgr.classList.remove('hidden');
                    txtInstituteMgr.classList.remove('hidden');
                    return;
                }
                const accountName = txtAccountMgr.value.trim();
                const institute = txtInstituteMgr.value.trim();
                if (!accountName || !institute) {
                    if (accountMgrMessage) accountMgrMessage.textContent = 'Please enter account name/institue';
                    return;
                }

                if (selAccountMgr.selectedIndex === 0) {
                    await DataProvider.fetchData('account', 'POST', { account_name: accountName, institute });
                } else {
                    if (confirm(`Are you sure you want to update account_name to '${accountName}' and institue to '${institute}'?`)) {
                        await AppCommonTable.updateTable(ACCOUNT_TABLE, selAccountMgr.value, 'account_name', accountName);
                        await AppCommonTable.updateTable(ACCOUNT_TABLE, selAccountMgr.value, 'institute', institute);
                    }
                }
                await fetchAccount();
                renderSelAccountMgr();

                const match = dataAccount.find(a => a.account_name === accountName);
                selAccountMgr.value = match?.id ?? '';
                if (accountMgrMessage) accountMgrMessage.textContent = 'Saved';
                await renderAccountBalance(selAccountMgr.value);

                txtAccountMgr.classList.add('hidden');
                txtInstituteMgr.classList.add('hidden');

            });

            const btnAddBalance = CommonUtil.getButtonElement('btnAddBalance');
            const addAccountBalance = async () => {
                if (selAccountMgr.selectedIndex === 0) {
                    CommonUtil.showMessage('Select an account before add a record.');
                    return;
                }
                const id = await AppCommonTable.addTable(ACCOUNT_BALANCE_TABLE);
                AppCommonTable.updateTable(ACCOUNT_BALANCE_TABLE, id, 'account_id', selAccountMgr.value);
                await fetchAccountBalance(dtBalence.value);
                renderAccountBalance(selAccountMgr.value);
            }
            btnAddBalance.addEventListener('click', addAccountBalance);
            renderBalanceSummary();
        }
        const initSymbolMgr = () => {
            const btnAddSymbol = CommonUtil.getButtonElement('btnAddSymbol');
            const divSymbol = CommonUtil.getDivElement('divSymbol');
            btnAddSymbol.addEventListener('click', async () => {
                await AppCommonTable.addTable(SYMBOL_TABLE);
            });

            const RenderSymbolMgr = () => {
                const updateSymbol = async (id: string, newValue: string, column: string) => {
                    await AppCommonTable.updateTable(SYMBOL_TABLE, id, column, newValue);
                    await fetchSymbol();
                    RenderSymbolMgr()
                }
                divSymbol.appendChild(AppCommonTable.createTable(dataSymbol,
                    {
                        table: {
                            onchange: updateSymbol
                        }
                    }
                ))
            }
            RenderSymbolMgr();
        }

        initManageType();
        initAcctMgr();
        initSymbolMgr();

        const selAssetType = CommonUtil.getSelectElement('selAssetType');
        const assetTypeChanged = () => { // need more work if there are multiple assets types
            const assetSelected: Symbol[] = dataSymbol.filter(item => item.asset_type === selAssetType.value)
            CommonUtil.populateSelect(selSymbol, CommonUtil.mapObjectToOption(assetSelected as any, 'id', 'symbol'));
            createAllSummary();
        }
        selAssetType.addEventListener("change", async () => {
            assetTypeChanged();
        })
        const symbolChanged = async () => {
            if (selSymbol.selectedIndex === 0) {
                CommonUtil.showHideContainer('btnUpdPrices', false);
                createAllSummary();
            } else {
                CommonUtil.showHideContainer('btnUpdPrices', true);
                const currSymbol = selSymbol.selectedOptions[0].textContent!;
                selectedSymbol = dataSymbol.find(stock => stock.symbol === currSymbol);
                // fetch current price and update symbol table
                CommonUtil.getInputElement('txtCurrPrice').value = await DataProvider.getCurrentPrice(currSymbol);

                const yLink = CommonUtil.getAnchorElement('yLink');
                yLink.href = getYahooLink(currSymbol);
                yLink.innerHTML = currSymbol;

                if (selectedSymbol) createSingleSummary(selectedSymbol);
            }
            CommonUtil.showHideContainer('divAddTrade', selSymbol.selectedIndex === 0 ? true : false);
        }
        document.getElementById('selSymbol')?.addEventListener("change", async () => {
            await symbolChanged()
        })
        const btnAddTrade = CommonUtil.getButtonElement('btnAddTrade');
        btnAddTrade.addEventListener('click', async () => {

            if (selSymbol.selectedIndex === 0) {
                CommonUtil.showMessage('Select a symbol to add a trade');
                return;
            }
            const id = await AppCommonTable.addTable(TRADE_TABLE);
            await AppCommonTable.updateTable(TRADE_TABLE, id, 'symbol_id', selSymbol.selectedOptions[0].text);
            await symbolChanged();
        });
    };
    const initTradeSummary = () => {
        renderSelSymbol(selSymbol);

        document.getElementById('btnUsePrice')?.addEventListener("click", () => {
            const txtCurrPrice = CommonUtil.getInputElement('txtCurrPrice');
            if (selSymbol.selectedIndex === 0) {
                createAllSummary();
            } else {
                if (selectedSymbol) {
                    selectedSymbol.price = Number(txtCurrPrice.value) * 1
                    createSingleSummary(selectedSymbol);
                }
            }
        })
        const splitStock = () => {
            const splitSpec = CommonUtil.getInputElement('txtSplitRatio').value.split(':');
            const beforeShare = Number(splitSpec[0]);
            const afterShare = Number(splitSpec[1]);
            const spiltRatio = beforeShare / afterShare;

            for (let i = 0; i < remainingLots.length; i++) {
                const { trade_date, account_id, symbol_id, share, price, lot } = remainingLots[i];
                const tradeDate = new Date(trade_date).toISOString().split('T')[0];
                let dummyTrade = {
                    tradeDate,
                    accountId: account_id,
                    symbolId: symbol_id,
                    tradeType: 'SELL',
                    share,
                    price,
                    lot
                };
                DataProvider.fetchData('trade', 'POST', dummyTrade);
                dummyTrade.tradeType = "BUY";
                dummyTrade.share = share / spiltRatio;
                dummyTrade.price = price * spiltRatio;
                dummyTrade.lot += 100; // splitedd dummy trade
                DataProvider.fetchData('trade', 'POST', dummyTrade);
            }
        }
        document.getElementById('btnSplit')?.addEventListener("click", async () => {
            splitStock();
        })
        document.getElementById('btnUpdPrices')?.addEventListener("click", async () => {
            const txtCurrPrice = CommonUtil.getInputElement('txtCurrPrice');
            if (selSymbol.selectedIndex === 0) {
                DataProvider.showMessage("Fetching stock prices...");
                try {
                    const response = await DataProvider.updateAllPrices();
                    if (response?.failed && response.failed.length > 0) {
                        const failedMsg = response.failed.map((f: any) => `${f.symbol}: ${f.error}`).join(', ');
                        DataProvider.showMessage(`Updated with failures: ${failedMsg}`);
                    } else {
                        DataProvider.showMessage("All quotes are updated");
                    }
                    await fetchSymbol();
                    renderSelSymbol(selSymbol);
                    createAllSummary();
                } catch (error) {
                    const err = error as Error;
                    DataProvider.showMessage(`Failed to fetch prices: ${err.message}`);
                }
            } else {
                if (selectedSymbol) {
                    selectedSymbol.price = Number(txtCurrPrice.value) * 1
                    createSingleSummary(selectedSymbol);
                }
            }
        })
        createAllSummary();
    }

    // could be reomoved
    CommonUtil.getElement('btnToggleTrade').addEventListener("click", async (e: Event) => {
        const allTrade = CommonUtil.getDivElement('allTrade')!;
        allTrade.innerHTML = "";
        renderTradeTable(allTrade, dataTrade);
        CommonUtil.showHodeObject('Trade', e.target as HTMLButtonElement, [CommonUtil.getElement('manageTrade')]);
    })

    initAccountSymbolManager();
    initTradeSummary();
}

// create all trade table
const renderTradeTable = (div: HTMLDivElement, data: Trade[]) => {
    const updateTrade = async (id: string, newValue: string, column: string) => {
        await AppCommonTable.updateTable(TRADE_TABLE, id, column, newValue, dataTrade);
    }
    const deleteTrade = async (id: string) => {
        await AppCommonTable.deleteTable(TRADE_TABLE, id);
    }
    div.append(AppCommonTable.createTable(data as any[],
        {
            table: {
                onchange: updateTrade,
                ondelete: deleteTrade,
                // onsplit: window.split,
                // spiltRatio: [20, 1],
                columnListToHide: ['account_id', 'symbol_id']
            },
            column: [
                {
                    columnName: 'trade_type',
                    type: 'SELECT',
                    optionData: CommonUtil.mapArrayToOption(['BUY', 'SELL']),
                    onSelChange: updateTrade
                }
            ]
        }
    ));
}
/**
 * show all remaining gain/loss and the summery as
 * Symbol, Share, Price, Value, Cost Basis, Gain Loss (Pct), Total Gain/Loss
 * And then total (assum all remaining share sold at current price)
 * remaining value
 * cost basis
 * gain/loss (pct) 
 */
const createAllSummary = async () => {
    const allSummary: allSummary[] = [];
    let totalCostBasis = 0, totalGainLoss = 0, totalValue = 0;
    dataSymbol.forEach(symbol => {
        const singleSum = createSingleSummary(symbol, false);
        if (!singleSum) { return; }

        const diff = Number((symbol.price - symbol.previous_price).toFixed(2));
        const pct = convertPercent(symbol.price, diff);
        allSummary.push({
            symbol: `<a class="inlineButton" href="${getYahooLink(symbol.symbol)}" target="_blank">${symbol.symbol}</a>`,
            share: singleSum.remaining_share,
            price: symbol.price,
            diff,
            pct,
            value: singleSum.current_value,
            cost_basis: singleSum.unrealized.cost_basis,
            gain_loss: convertGainLossSummery(singleSum.unrealized),
        });
        totalValue += singleSum.current_value;
        totalCostBasis += singleSum.realized.cost_basis + singleSum.unrealized.cost_basis;
        totalGainLoss += singleSum.realized.gain_loss + singleSum.unrealized.gain_loss;
    });
    const pct = convertPercent(totalCostBasis, totalGainLoss);
    const totalLine: allSummary = {
        symbol: 'Total',
        share: undefined,
        price: undefined,
        diff: undefined,
        pct: undefined,
        value: totalValue,
        cost_basis: totalCostBasis,
        gain_loss: `${CommonUtil.usdFormatter.format(totalGainLoss)}(${pct})`
    };
    allSummary.push(totalLine);

    const stockSummaryDiv = CommonUtil.getElement('divStockSummary');
    stockSummaryDiv.innerHTML = "";
    stockSummaryDiv.appendChild(createH3('All Remaining Gain/Loss'));
    stockSummaryDiv.appendChild(AppCommonTable.createTable(allSummary, { column: [{ columnName: 'gain_loss', enableColor: true }] }));
}

/**
 * Each lot of remaining shares' unrealized gain/loss and its percentage as 
 * share, purchase price, unrealized gain/loss (%)
 * 
 * Summary as
 * Total remaing share
 * Current value
 * Unrealized cost basis
 * Unrealized gain/loss (%)
 * Realized cost basis
 * Realized gain/loss (%)
 * Total gain/loss (%)
 *  
 * Raw trading history
 * 
 * @param {*} stock 
 */
let remainingLots: any[] = []; // remaining lots
const createSingleSummary = (symbol?: Symbol, display = true) => {
    CommonUtil.getElement('divStockSummary').innerHTML = "";
    if (!symbol) {
        return;
    }
    const sum: SingleSummary = {
        remaining_share: 0,
        current_value: 0,
        unrealized: { cost_basis: 0, gain_loss: 0, summary: "" },
        realized: { cost_basis: 0, gain_loss: 0, summary: "" },
        total: { cost_basis: 0, gain_loss: 0, summary: "" }
    };
    const trades = dataTrade.filter((item: Trade) => item.symbol_id === symbol.id);
    if (trades.length === 0) {
        return sum;
    }

    /**
     * 
     * @param {*} trade 
     * @returns trade + comment for cost basis
     */
    const buy = (trade: Trade, remainingLots: any[]): Trade => {
        remainingLots.push(structuredClone(trade));
        trade.comment = `Cost Basis: $${formatNumber(trade.share * trade.price)}`;
        return trade;
    }
    /**
     * 
     * Assume sell share is no more than a lot
     * Each buy has a unique lot number within the same symbol
     * Each Sell specifies sell from a buy lot.  
     * The sell share must be no more(or equal) than the share of the specified lot
     * Once the lot is sold, it will be removed from lots
     * 
     * @param {*} trade 
     * @returns trade + comment for realized gain/loss
     */
    const sellByLot = (trade: Trade, remainingLots: any[]): Trade => {
        let { share, price, lot } = trade;
        let lotCostBasis = 0;
        let lotGainLoss = 0;

        // find specified lot
        for (let i = 0; i < remainingLots.length; i++) {
            if (remainingLots[i].lot === lot) {
                remainingLots[i].share -= share;
                if (remainingLots[i].share < 0) { // * Assume sell share is no more than a lot
                    alert(`${trade.symbol_id}'s lot ${lot} does not have enough share to sell.  the sell share is ${share}`);
                }
                lotCostBasis = share * remainingLots[i].price;
                lotGainLoss = share * price - lotCostBasis;
                remainingLots.splice(i, 1);
                break;
            }
        }

        // Calculate realized gain/loss
        sum.realized.cost_basis += lotCostBasis;
        sum.realized.gain_loss += lotGainLoss;

        trade.comment = `Realized Gain/Loss: $${formatNumber(lotGainLoss)} (${convertPercent(lotCostBasis, lotGainLoss)})`;
        return trade;
    }

    remainingLots = [];
    const currentPrice = Number(CommonUtil.getInputElement('txtCurrPrice').value) * 1;
    trades.forEach((t: any) => {
        t.trade_type === 'BUY' ? buy(t, remainingLots) : sellByLot(t, remainingLots);
    });

    // calculate unrealized gain/loss
    remainingLots.forEach(t => {
        const { share, price } = t;
        sum.remaining_share += share;
        sum.current_value += share * (display ? currentPrice : symbol.price); // currentPrice is not valid when being called from createAllSummary
        sum.unrealized.cost_basis += share * price;
    });
    sum.unrealized.gain_loss = sum.current_value - sum.unrealized.cost_basis;
    sum.total.cost_basis = sum.realized.cost_basis + sum.unrealized.cost_basis;
    sum.total.gain_loss = sum.realized.gain_loss + sum.unrealized.gain_loss;
    convertGainLossSummery(sum.unrealized);
    convertGainLossSummery(sum.realized);
    convertGainLossSummery(sum.total);

    const displaySingleSummary = (singleSum: SingleSummary) => {
        const snakeToTitle = (str: string) => {
            // convert total_amount to Total Amount
            return str.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        }

        const divStockSummary = CommonUtil.getElement('divStockSummary');
        divStockSummary.appendChild(createH3('Summary'));
        const sum = Object.entries(singleSum).map(([key, value]) => {
            const item = snakeToTitle(key);
            let gain_loss = (typeof value === "object") ?
                (value as GainLossSummary).summary :
                key.indexOf('share') !== -1 ? value : CommonUtil.usdFormatter.format(value);
            return { item, gain_loss };
        });
        divStockSummary.appendChild(AppCommonTable.createTable(sum));
    }
    const displayRemainingShares = (currentPrice: number, lots: any[]) => {
        const divStockSummary = CommonUtil.getElement('divStockSummary');
        divStockSummary.appendChild(createH3('Remaining share (FIFO)'));

        const remainingShareBySymbol = [];
        for (let lot of lots) {
            let lotValue = lot.share * currentPrice;
            let lotCost = lot.share * lot.price;
            let gainLoss = lotValue - lotCost;
            remainingShareBySymbol.push({
                share: lot.share,
                Purchase_price: `${formatNumber(lot.price)}`,
                Current_price: `${formatNumber(currentPrice)}`,
                Unrealized_Gain_Loss: `${CommonUtil.usdFormatter.format(gainLoss)} (${convertPercent(lotCost, gainLoss)})`
            }
            );
        }

        divStockSummary.appendChild(AppCommonTable.createTable(
            remainingShareBySymbol,
            {
                table: {
                    header: ['share', 'purchase price', 'current price', 'unrealized gain/loss'],
                }
            }
        ));
    }
    const displayTradeLog = (tradeDataBySymbol: Trade[]) => {
        const divStockSummary = CommonUtil.getDivElement('divStockSummary');
        divStockSummary.appendChild(createH3('Trading history'));
        renderTradeTable(divStockSummary, tradeDataBySymbol);
    }

    if (display) {
        displaySingleSummary(sum);
        displayRemainingShares(currentPrice, remainingLots);
        displayTradeLog(trades);
    }
    return sum;
}
//#region helper
const createH3 = (title: string) => {
    let fragment = document.createDocumentFragment();
    let h3Elem = document.createElement("h3");
    h3Elem.textContent = title;
    fragment.appendChild(h3Elem);
    return fragment;
}
const formatNumber = (amt: number) => {
    return amt.toLocaleString();
};
const convertPercent = (base: number, gainLoss: number) => {
    return `${base === 0 ? 0 : (100 * gainLoss / base).toFixed(2)}%`;
}
const convertGainLossSummery = (gainLoss: GainLossSummary) => {
    const pct = gainLoss.cost_basis === 0 ? 0 : (100 * gainLoss.gain_loss / gainLoss.cost_basis).toFixed(2);
    gainLoss.summary = `${CommonUtil.usdFormatter.format(gainLoss.gain_loss)}(${pct}%)`;
    return gainLoss.summary
}
const getYahooLink = (symbol: string) => {
    return `https://finance.yahoo.com/quote/${symbol}/`;
}
//#endregion