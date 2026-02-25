import * as DataProvider from '../../../db/dataProvider';
import * as CommonUtil from '../../../common';
import * as AppCommonTable from '../../appCommon/commonTable';

// interface from tables
interface Trade {
    symbol: string;
    trade_date: string;
    trade_type: 'BUY' | 'SELL';
    account_id: number;
    symbol_id: number;
    share: number;
    price: number;
    lot: number;
    // extra property
    comment?: string
}
interface Symbol {
    id: number;
    asset_type: "Stock" | "Fund" | "ETF" | "Bond";
    company_name: string;
    price: number;
    previous_price: number;
    current_price: number;
    previous_close_price: number;
    symbol: string;
}
interface Account {
    id: string;
    account_name: string;
    institute: string;
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
// tables
const ACCOUNT_TABLE = 'trade_account';
const SYMBOL_TABLE = 'trade_symbol';
const TRADE_TABLE = 'trade_log';

// data from table
let accountData: Account[];
let symbolData: Symbol[];
let tradeData: Trade[];

let selectedSymbol: Symbol | undefined; // selected symbol object corresponding with dropdown

export const initStock = async () => {
    await loadAssetType('Stock');
    await loadStockSymbol();
    await loadAccount();
    await loadTrade();
    CommonUtil.getInputElement('tradeDate').value = (new Date()).toISOString().split('T')[0];
    createAllSummary(symbolData);
    initEventHandler();
}
const loadAssetType = async (selectedValue?: string) => {
    const assetType = await AppCommonTable.getEnumValue('fintech', 'trade_symbol', 'asset_type');
    const selAssetType = CommonUtil.getSelectElement('selAssetType');
    CommonUtil.populateSelect(selAssetType, CommonUtil.mapArrayToOption(assetType));
    if (selectedValue !== undefined) {
        selAssetType.value = selectedValue;
    }
}
const loadStockSymbol = async (selectedValue?: string) => {
    const selSymbol = CommonUtil.getSelectElement('selSymbol');
    const allSymbolData = await AppCommonTable.getTable(SYMBOL_TABLE);
    symbolData = allSymbolData.filter((s: Symbol) => s.asset_type === 'Stock');
    // const symbols = symbolData.map(symbol => { return symbol.symbol }); 
    // const symbolPrices: CurrentSymbolPrice[] = await DataProvider.getSymbolQuotes(symbols);
    symbolData.forEach((symbol) => {
        symbol.current_price = symbol.price;
        symbol.previous_close_price = symbol.previous_price;
    });
    CommonUtil.populateSelect(selSymbol, CommonUtil.mapObjectToOption(symbolData as any, 'id', 'symbol'));
    if (selectedValue !== undefined) {
        selSymbol.value = selectedValue;
    }
}
// const displayIndex = async () => {
//     const indexEl = document.getElementById('index')!;
//     indexEl.innerHTML = "";
//     const tickers = ["SPY", "DIA", "QQQ"];// ["^GSPC", "^DJI", "^IXIC"];
//     const r = await DataProvider.getSymbolQuotes(tickers);
//     let i = 0;
//     r.forEach((t: any) => {
//         const symbol = tickers[i++];
//         const yLnk = getYahooLink(symbol);
//         const priceSpan = `<span><b>$${t.c}</b></span>`
//         const diff = Number((t.c - t.pc).toFixed(2));
//         const pct = convertPercent(t.pc, diff);
//         const pctSpan = `(<span style="color:${diff >= 0 ? 'green' : 'red'};">${pct}</span>)`
//         const diffSpan = `<span style="color:${diff >= 0 ? 'green' : 'red'};">$${diff}</span>`
//         indexEl.innerHTML += `<p>${symbol}(${yLnk}): ${priceSpan} ${diffSpan} ${pctSpan}</p>`;
//     });
// }
const getYahooLink = (symbol: string) => {
    return `<a class="inlineButton" href="https://finance.yahoo.com/quote/${symbol}/" target="_blank">${symbol}</a>`;
}
const loadAccount = async () => {
    const selAccount = CommonUtil.getSelectElement('selAccount');
    // selAccount.options.length = 1; // keep the place holder
    accountData = await AppCommonTable.getTable(ACCOUNT_TABLE);
    CommonUtil.populateSelect(selAccount, CommonUtil.mapObjectToOption(accountData as any, 'id', 'account_name'));
}
const loadTrade = async () => {
    const allTrade = CommonUtil.getElement('allTrade')!;
    allTrade.innerHTML = "";
    if (!tradeData) {
        tradeData = await DataProvider.fetchData('trade');
    }
    displayTradeTable(tradeData);
}
const initEventHandler = () => {
    const assetTypeChanged = () => {
        const selAssetType = CommonUtil.getSelectElement('selAssetType');
        const assetSelected: Symbol[] = symbolData.filter(item => item.asset_type === selAssetType.value)
        CommonUtil.populateSelect(CommonUtil.getSelectElement('selSymbol'), CommonUtil.mapObjectToOption(assetSelected as any, 'id', 'symbol'));
        createAllSummary(symbolData);

        CommonUtil.showHideContainer('divAddSymbol', selAssetType.selectedIndex === 0 ? true : false);
        CommonUtil.showHideContainer('divAddTrade', true);
    }
    CommonUtil.getElement('selAssetType')?.addEventListener("change", async () => {
        assetTypeChanged();
    })
    const symbolChanged = async () => {
        const selSymbol = CommonUtil.getSelectElement('selSymbol');
        if (selSymbol.selectedIndex === 0) {
            CommonUtil.showHideContainer('btnUpdPrices', false);
            createAllSummary(symbolData);
        } else {
            CommonUtil.showHideContainer('btnUpdPrices', true);
            const currSymbol = selSymbol.selectedOptions[0].textContent!;
            selectedSymbol = findSymbol(currSymbol);
            // fetch current price and update symbol table
            CommonUtil.getInputElement('txtCurrPrice').value = await DataProvider.getCurrentPrice(currSymbol);

            const yLink = CommonUtil.getAnchorElement('yLink');
            yLink.href = `https://finance.yahoo.com/quote/${currSymbol}/`;
            yLink.innerHTML = currSymbol;

            if (selectedSymbol)
                createSingleSummary(selectedSymbol);
        }
        CommonUtil.showHideContainer('divAddTrade', selSymbol.selectedIndex === 0 ? true : false);
    }
    document.getElementById('selSymbol')?.addEventListener("change", async () => {
        await symbolChanged()
    })
    document.getElementById('btnUsePrice')?.addEventListener("click", () => {
        const selSymbol = CommonUtil.getSelectElement('selSymbol');
        const txtCurrPrice = CommonUtil.getInputElement('txtCurrPrice');
        if (selSymbol.selectedIndex === 0) {
            createAllSummary(symbolData);
        } else {
            if (selectedSymbol) {
                selectedSymbol.current_price = Number(txtCurrPrice.value) * 1
                createSingleSummary(selectedSymbol);
            }
        }
    })
    document.getElementById('btnUpdPrices')?.addEventListener("click", async () => {
        const selSymbol = CommonUtil.getSelectElement('selSymbol');
        const txtCurrPrice = CommonUtil.getInputElement('txtCurrPrice');
        
        if (selSymbol.selectedIndex === 0) {
            await DataProvider.updateAllPrices();
await loadStockSymbol();
            createAllSummary(symbolData);
        } else {
            if (selectedSymbol) {
                selectedSymbol.current_price = Number(txtCurrPrice.value) * 1
                createSingleSummary(selectedSymbol);
            }
        }
    })

    document.getElementById("formAddSymbol")?.addEventListener("submit", async function (event) {
        event.preventDefault();
        const symbol = CommonUtil.getInputElement("txtSymbol").value;
        const company_name = CommonUtil.getInputElement("txtCompanyNname").value;
        const asset_type = CommonUtil.getInputElement('selAssetType').value;
        await DataProvider.fetchData('symbol', 'POST', { symbol, company_name, asset_type });
        (event.target as HTMLFormElement)?.reset();
        await loadStockSymbol(symbol);
    });

    document.getElementById("formAddTrade")?.addEventListener("submit", async function (event) {
        event.preventDefault();
        const tradeDate = CommonUtil.getInputElement("tradeDate").value;
        const tradeType = CommonUtil.getInputElement("selTradeType").value;
        const symbolId = CommonUtil.getInputElement("selSymbol").value;
        const share = CommonUtil.getInputElement("share").value;
        const price = CommonUtil.getInputElement("price").value;
        const lot = CommonUtil.getInputElement("lot").value;
        const accountId = CommonUtil.getInputElement("selAccount").value;

        DataProvider.fetchData('trade', 'POST', { tradeDate, accountId, symbolId, tradeType, share, price, lot });
        // CommonUtil.getElement("message").innerText = result.message;
        (event.target as HTMLFormElement)?.reset();
        await loadTrade(); // refresh trade data
        createSingleSummary(selectedSymbol)
    });
    document.getElementById("accountForm")?.addEventListener("submit", async function (event) {
        event.preventDefault();
        const account_name = CommonUtil.getInputElement("account_name").value;
        const institute = CommonUtil.getInputElement("institute").value;

        const response = await fetch("/account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ account_name, institute })
        });

        await loadAccount();

        const result = await response.json();
        document.getElementById("accountMessage")!.innerHTML = result.message;
    });

    const btnToggleTrade = CommonUtil.getElement('btnToggleTrade');
    btnToggleTrade.addEventListener("click", async () => {
        await loadTrade();
        CommonUtil.showHodeObject('Trade', btnToggleTrade, [CommonUtil.getElement('manageTrade')]);
    })

}

const updateTrade = async (id: string, newValue: string, column: string) => {
    await AppCommonTable.updateTable(TRADE_TABLE, id, column, newValue, tradeData);
}
const deleteTrade = async (id: string) => {
    await AppCommonTable.deleteTable(TRADE_TABLE, id);
}
document.getElementById('btnSplit')?.addEventListener("click", async () => {
    splitStock();
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
// create all trade table
const displayTradeTable = (data: Trade[]) => {
    CommonUtil.getElement('allTrade').append(AppCommonTable.createTable(data as any[],
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
const resetSummary = () => {
    CommonUtil.getElement('divStockSummary').innerHTML = "";
}
const findSymbol = (symbol: string) => {
    return (symbolData.find(stock => stock.symbol === symbol));
}
const filterTradeData = (symbol: string) => {
    return tradeData.filter((item: Trade) => item.symbol === symbol);
}
// const displaySelSymbolData = () => {
//     // const selTradeSymbol = CommonUtil.getSelectElement('selTradeSymbol');
//     // const selData = selTradeSymbol.selectedIndex === 0 ? tradeData :
//     //     filterTradeData(selTradeSymbol.selectedOptions[0].text);
//     const allTrade = CommonUtil.getElement('allTrade');
//     allTrade.innerHTML = "";
//     // displayTradeTable(selData);
// }
/**
 * show all remaining gain/loss and the summery as
 * Symbol, Share, Price, Value, Cost Basis, Gain Loss (Pct), Total Gain/Loss
 * And then total (assum all remaining share sold at current price)
 * remaining value
 * cost basis
 * gain/loss (pct) 
 */
const createAllSummary = async (symbolData: Symbol[]) => {
    const allSummary: allSummary[] = [];
    let totalCostBasis = 0, totalGainLoss = 0, totalValue = 0;
    symbolData.forEach(symbol => {
        const singleSum = createSingleSummary(symbol, false);
        if (!singleSum) { return; }

        const diff = Number((symbol.current_price - symbol.previous_close_price).toFixed(2));
        const pct = convertPercent(symbol.current_price, diff);
        allSummary.push({
            symbol: getYahooLink(symbol.symbol),
            share: singleSum.remaining_share,
            price: symbol.current_price,
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
        gain_loss: `${formatCurrency(totalGainLoss)} (${pct})`,
    };
    allSummary.push(totalLine);

    const stockSummaryDiv = CommonUtil.getElement('divStockSummary');
    stockSummaryDiv.innerHTML = "";
    stockSummaryDiv.appendChild(createH3('All Remaining Gain/Loss'));
    stockSummaryDiv.appendChild(AppCommonTable.createTable(allSummary));
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
    resetSummary();
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
    const trades = filterTradeData(symbol.symbol)
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
                    alert(`${trade.symbol}'s lot ${lot} does not have enough share to sell.  the sell share is ${share}`);
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
        sum.current_value += share * (display ? currentPrice : symbol.current_price); // currentPrice is not valid when being called from createAllSummary
        sum.unrealized.cost_basis += share * price;
    });
    sum.unrealized.gain_loss = sum.current_value - sum.unrealized.cost_basis;
    sum.total.cost_basis = sum.realized.cost_basis + sum.unrealized.cost_basis;
    sum.total.gain_loss = sum.realized.gain_loss + sum.unrealized.gain_loss;
    convertGainLossSummery(sum.unrealized);
    convertGainLossSummery(sum.realized);
    convertGainLossSummery(sum.total);

    if (display) {
        displaySingleSummary(sum);
        displayRemainingShares(currentPrice, remainingLots);
        displayTradeLog(trades);
    }
    return sum;
}
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
            key.indexOf('share') !== -1 ? value : formatCurrency(value);
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
            Unrealized_Gain_Loss: `${formatCurrency(gainLoss)} (${convertPercent(lotCost, gainLoss)})`
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
    const divStockSummary = CommonUtil.getElement('divStockSummary');
    divStockSummary.appendChild(createH3('Trading history'));
    divStockSummary.appendChild(AppCommonTable.createTable(tradeDataBySymbol));
}

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
const formatCurrency = (amt: number) => {
    return amt.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
const convertPercent = (base: number, gainLoss: number) => {
    return `${base === 0 ? 0 : (100 * gainLoss / base).toFixed(2)}%`;
}
const convertGainLossSummery = (gainLoss: GainLossSummary) => {
    const pct = gainLoss.cost_basis === 0 ? 0 : (100 * gainLoss.gain_loss / gainLoss.cost_basis).toFixed(2);
    gainLoss.summary = `${formatCurrency(gainLoss.gain_loss)}(${pct}%)`;
    return gainLoss.summary
}
