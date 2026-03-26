import * as DataProvider from '../../../db/dataProvider';
import * as CommonUtil from '../../../common';
import * as AppCommonTable from '../../appCommon/commonTable';

// #region Interface for table data
interface Category {
    id: string;
    name: string;
    parent_id?: number | null;
}
interface Trip {
    id: string;
    name: string;
    start_date: Date;
    end_date: Date;
    days: number;
    amount: number;
    notes: string
}
interface Source {
    id: string,
    name: string,
    notes: string
}
interface Transaction {
    id: string;
    date: Date;
    description: string;
    amount: number;
    trip: string;
    type: string;
    category: string;
    note: string;
    account_from: string;
    account_to: string;
    source: string;
    owner: string;
}
interface TranLine {
    id: string,
    description: string,
    amount: number,
    category: string
}
// #endregion

const TRIP_TABLE = 'TXN_TRIPS';
const SOURCE_TABLE = 'TXN_SOURCES';
const CATEGORY_TABLE = 'TXN_CATEGORIES';
const TRANSACTIONS_TABLE = 'TXN_TRANSACTIONS';
const TRANSACTION_LINES_TABLE = 'TXN_TRANSACTION_LINES';

const SPLIT_CATEGORY_IND = '<Split>'; // on this value, category has sub items in more details
const UNCATEGORIZED = '<Uncategorized>';

const arrPeriod = ['Year to date', ...Array.from({length: 5}, (_, i) => (new Date().getFullYear() - i - 1).toString())];
const dataType = ['expense', 'income', 'transfer'];

let dataTransaction: Array<Transaction>;
let dataCategory: Array<Category>;
let dataTrip: Array<Trip>;
let dataSource: Array<Source>;


let filteredTranData: Array<Transaction>; // filtered data by Trip or Type and Source
// cat/subcat or desc filter on filteredTranData
let renderedData: Array<Transaction>; // data shown on screen
let catSubcatTreeData: Array<CommonUtil.OptionDataNode>; // cat/subcat tree converted from dataCategory

export const initTransaction = async () => {
    await initData();
    await initElement();
}
const initData = async () => {
    const fetchTrips = async () => {
        let data: Trip[] = await AppCommonTable.getTable(TRIP_TABLE);
        data.sort((a: Trip, b: Trip) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        return data;
    }
    const fetchSources = async () => {
        let data: Trip[] = await AppCommonTable.getTable(SOURCE_TABLE);
        data.sort((a: Source, b: Source) => a.name.localeCompare(b.name));
        return data;
    }
    const initAndConvertCategoryData = async () => {
        const buildCategoryTree = (data: Category[]): CommonUtil.OptionDataNode[] => {
            let roots: CommonUtil.OptionDataNode[] = [];
            roots.push(... (data.filter(x => !x.parent_id)).map(x => { return { value: x.id.toString(), textContent: x.name, children: [] } }));
            // find splitItem
            const splitItem = roots.filter((x: any) => x.textContent === SPLIT_CATEGORY_IND);
            // move splitItem to top
            roots = [splitItem[0], ...roots.filter((x: any) => x.textContent !== SPLIT_CATEGORY_IND)];
            roots.unshift({ value: '0', textContent: '-- Select category --' });
            data.forEach(item => {
                const parId = item.parent_id;
                delete item.parent_id;
                if (parId !== null) {
                    const par = roots.find(x => x.value === parId?.toString());
                    if (par?.children?.length === 0) {
                        par?.children.push({ value: '0', textContent: '-- Select subcategory --' })
                    }
                    par?.['children']?.push({ value: item.id.toString(), textContent: item.name });
                }
            })
            return roots;
        }

        // fetch category data
        dataCategory = await DataProvider.fetchData("category");
        dataCategory.sort((a: Category, b: Category) => {
            if (a.name === "Other") return 1;   // a should go after b
            if (b.name === "Other") return -1;
            return a.name.localeCompare(b.name);
        })
        catSubcatTreeData = buildCategoryTree(dataCategory);
    }
    dataTrip = await fetchTrips();
    dataSource = await fetchSources();
    await initAndConvertCategoryData();
    dataTransaction = await fetchTransactions();
}
const fetchTransactions = async () => {
    let data: Array<Transaction> = await DataProvider.fetchData("transaction");
    data.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
    filteredTranData = data.slice();
    return filterTranByDates(filteredTranData, '2016-01-01', '2026-12-01');
}

const initElement = async () => {
    const selPeriod = CommonUtil.getSelectElement('selPeriod');
    const selTrip = CommonUtil.getSelectElement('selTrip');
    const selType = CommonUtil.getSelectElement('selType');
    const selSource = CommonUtil.getSelectElement('selSource');
    const selCategory = CommonUtil.getSelectElement('selCategory');
    const selSubcategory = CommonUtil.getSelectElement('selSubcategory');
    const txtDesc = CommonUtil.getInputElement('txtDesc');

    const initCatTripMgr = async () => {
        const selOptType = CommonUtil.getSelectElement('selOptType');
        const divCatMgr = CommonUtil.getDivElement('divCatMgr');
        const divTripMgr = CommonUtil.getDivElement('divTripMgr');

        CommonUtil.populateSelect(selOptType, CommonUtil.mapArrayToOption(['Category', 'Trip', 'Source'], 'type'));
        const divOptType = CommonUtil.getDivElement('divOptType');
        // show/hide opt mgr div
        selOptType.addEventListener("change", async () => {
            if (selOptType.selectedIndex === 0) {
                divOptType.classList.toggle('hidden');
            } else {
                divOptType.classList.remove('hidden');
                divCatMgr.classList.add('hidden');
                divTripMgr.classList.add('hidden');
                if (selOptType.selectedOptions[0].text === 'Category') {
                    divCatMgr.classList.remove('hidden');
                }
                if (selOptType.selectedOptions[0].text === 'Trip') {
                    divTripMgr.classList.remove('hidden');
                    await initTripMgr('trip');
                }
                if (selOptType.selectedOptions[0].text === 'Source') {
                    divTripMgr.classList.remove('hidden');
                    await initTripMgr('source');
                }
            }
        })

        const initCategoryMgr = () => {
            const selCategoryMgr = CommonUtil.getSelectElement('selCategoryMgr');
            const selSubcategoryMgr = CommonUtil.getSelectElement('selSubcategoryMgr');
            const btnAddUpdCat = CommonUtil.getButtonElement('btnAddUpdCat');
            const btnAddUpdSubcat = CommonUtil.getButtonElement('btnAddUpdSubcat');
            initSelCatSubCat(selCategoryMgr, selSubcategoryMgr);
            btnAddUpdCat.addEventListener('click', async () => {
                const cat = CommonUtil.getInputElement('txtCatMgr').value;
                if (!cat) return;

                let catId = selCategoryMgr.value;
                if (selCategoryMgr.selectedIndex === 0) {
                    catId = await AppCommonTable.addTable(CATEGORY_TABLE);
                }
                AppCommonTable.updateTable(CATEGORY_TABLE, catId, 'NAME', cat);
            })
            btnAddUpdSubcat.addEventListener('click', async () => {
                const subcat = CommonUtil.getInputElement('txtSubcatMgr').value;
                if (!subcat) return;

                const catId = selCategoryMgr.value;
                let subcatId = selSubcategoryMgr.value;
                if (selSubcategoryMgr.selectedIndex === 0) {
                    subcatId = await AppCommonTable.addTable(CATEGORY_TABLE);
                }
                AppCommonTable.updateTable(CATEGORY_TABLE, subcatId, 'PARENT_ID', catId);
                AppCommonTable.updateTable(CATEGORY_TABLE, subcatId, 'NAME', subcat);
            })
        }
        const initTripMgr = async (type: 'trip' | 'source') => {
            const table = type === 'trip' ? TRIP_TABLE : SOURCE_TABLE;
            const updateTrip = async (id: string, newValue: string, column: string) => {
                await AppCommonTable.updateTable(table, id, column, newValue);
            }
            const data = type === 'trip' ? dataTrip : dataSource;
            divTripMgr.innerHTML = '';
            if (type === 'trip') {

                interface YearlyTotal {
                    [year: number]: number;
                }

                function calculateYearlyTotals(trips: Trip[]): YearlyTotal {
                    const totals: YearlyTotal = {};

                    for (const trip of trips) {
                        const year: number = new Date(trip.start_date).getFullYear();

                        if (totals[year] === undefined) {
                            totals[year] = 0;
                        }

                        totals[year] += trip.amount;
                    }

                    return totals;
                }
                function formatYearlyTotals(yearlyTotals: YearlyTotal): string {
                    return Object.entries(yearlyTotals)
                        .map(([year, total]: [string, number]) => `${year}: ${CommonUtil.usdFormatter.format(total)}`)
                        .join('<br/>');
                }
                divTripMgr.innerHTML = formatYearlyTotals(calculateYearlyTotals(dataTrip));
            }
            divTripMgr.appendChild(AppCommonTable.createTable(data, { table: { edit: true, onchange: updateTrip } }));

        }

        initCategoryMgr();
    }

    //#region reset filters
    const resetPeriodFilter = () => {
        selPeriod.selectedIndex = 0;
    }
    const resetTripFilter = () => {
        selTrip.selectedIndex = 0;
    }
    const resetTypeSourceFilter = () => {
        selType.selectedIndex = 0;
        selSource.selectedIndex = 0;
    }
    const resetCatDescFilter = () => {
        selCategory.selectedIndex = 0;
        selSubcategory.selectedIndex = 0;
        txtDesc.value = '';
    }
    //#endregion

    const applyAndRender = () => {
        // Base filters: period/trip/type/source
        let data = dataTransaction.slice();

        if (selPeriod.selectedIndex > 0) {
            const selectedPeriod = selPeriod.selectedOptions[0].text;
            const today = new Date();
            const formatDate = (d: Date) => d.toISOString().slice(0, 10);
            let startDate = '';
            let endDate = '';

            if (selectedPeriod.toLowerCase() === 'year to date') {
                const year = today.getFullYear();
                startDate = `${year}-01-01`;
                endDate = formatDate(today);
            } else if (/^\d{4}$/.test(selectedPeriod)) {
                startDate = `${selectedPeriod}-01-01`;
                endDate = `${selectedPeriod}-12-31`;
            }
            if (startDate && endDate) {
                data = filterTranByDates(data, startDate, endDate);
            }
        }

        if (selTrip.selectedIndex > 0) {
            data = data.filter(x => x.trip === selTrip.selectedOptions[0].text);
        }
        if (selType.selectedIndex > 0) {
            data = data.filter(x => x.type === selType.value);
        }
        if (selSource.selectedIndex > 0) {
            data = data.filter(x => x.source === selSource.selectedOptions[0].text);
        }

        // Keep this snapshot because category/subcategory filters are downstream of base filters.
        filteredTranData = data.slice();

        if (selCategory.selectedIndex > 0) {
            const getCat = (d: Transaction) => (d.category ?? '').split('|')[0] ?? '';
            if (selCategory.value === UNCATEGORIZED) {
                data = data.filter((d) => (getCat(d) === '' || getCat(d) === '0'));
            } else {
                const selectedCategory = selCategory.selectedOptions[0].text;
                data = data.filter((d) => getCat(d) === selectedCategory);
            }
        }
        if (selSubcategory.selectedIndex > 0) {
            const selectedSubcategory = selSubcategory.selectedOptions[0].text;
            data = data.filter((d) => (((d.category ?? '').split('|')[1] ?? '') === selectedSubcategory));
        }

        const desc = txtDesc.value.trim().toLowerCase();
        if (desc) {
            data = data.filter(x => x.description?.toLowerCase().includes(desc));
        }

        renderTransactions(data);
    }

    //#region init and implement filters 
    const initPeriodFilter = () => {
        CommonUtil.populateSelect(selPeriod, CommonUtil.mapArrayToOption(arrPeriod));
        selPeriod.addEventListener("change", async () => {
            resetTripFilter();
            resetTypeSourceFilter();
            resetCatDescFilter();
            applyAndRender();
        })
    }
    const initTripFilter = () => {
        CommonUtil.populateSelect(selTrip, CommonUtil.mapObjectToOption(dataTrip, 'id', 'name', 'trip'));
        selTrip.addEventListener("change", async () => {
            resetPeriodFilter(); // only trip reset period
            resetTypeSourceFilter();
            resetCatDescFilter();
            applyAndRender();
        })
    }
    const initTypeSourceFilter = () => {
        CommonUtil.populateSelect(selType, CommonUtil.mapArrayToOption(dataType));
        selType.addEventListener("change", async () => {
            //            resetTripFilter();
            resetCatDescFilter();
            applyAndRender();
        })
        CommonUtil.populateSelect(selSource, CommonUtil.mapObjectToOption(dataSource, 'id', 'name', 'source'));
        selSource.addEventListener("change", async () => {
            //          resetTripFilter();
            resetCatDescFilter();
            applyAndRender();
        })
    }

    const initCategoryFilter = () => {
        initSelCatSubCat(selCategory, selSubcategory);
        selCategory.options.add(new Option(UNCATEGORIZED, UNCATEGORIZED), 1);

        selCategory.addEventListener("change", async () => {
            applyAndRender();
        })
        selSubcategory.addEventListener("change", async () => {
            applyAndRender();
        })
    }
    const initDescFilter = () => {
        txtDesc.addEventListener('blur', () => {
            applyAndRender();
        })
    }
    // set up option type mangement
    // setup cal/subcal helper function
    const initSelCatSubCat = (sel: HTMLSelectElement, selSub: HTMLSelectElement) => {
        CommonUtil.populateSelect(sel, catSubcatTreeData);
        sel.addEventListener('change', (e) => {
            const selOpt = e.target as HTMLSelectElement;
            const selVal = selOpt.value;
            const subcatData = ((catSubcatTreeData as any[]).find(x => x.value === selVal));
            if (subcatData) {
                CommonUtil.populateSelect(selSub, subcatData.children);
            }
        })
    }

    const initFilters = () => {
        initPeriodFilter();
        initTripFilter();
        initTypeSourceFilter();
        initCategoryFilter();
        initDescFilter();
    }
    //#endregion

    const initRefreshSummary = () => {

        const btnRefreshTran = CommonUtil.getButtonElement('btnRefreshTran');
        btnRefreshTran.addEventListener("click", async () => {
            // refresh data and reset all filters, and render refreshed data
            selType.selectedIndex = 0;
            selSource.selectedIndex = 0;
            resetCatDescFilter();
            dataTransaction = await fetchTransactions();
            applyAndRender();
        })
        const btnSummary = CommonUtil.getButtonElement('btnSummary');
        btnSummary.addEventListener("click", async () => {
            const summary = await DataProvider.fetchData("tranSummary");

            type Item = {
                category: string
                subcategory: string
                amount: number
            }

            type ChildNode = {
                subcategory: string
                amount: number
            }

            type CategoryNode = {
                category: string
                amount: number
                children: ChildNode[]
            }
            function buildTree(data: Item[]): CategoryNode[] {
                const map = new Map<string, CategoryNode>()

                for (const { category, subcategory, amount } of data) {

                    if (!map.has(category)) {
                        map.set(category, {
                            category,
                            amount: 0,
                            children: []
                        })
                    }

                    const node = map.get(category)!
                    node.amount += amount

                    let child = node.children.find(c => c.subcategory === subcategory)

                    if (!child) {
                        child = { subcategory, amount: 0 }
                        node.children.push(child)
                    }

                    child.amount += amount
                }

                return Array.from(map.values())
            }
            const treeSummary = buildTree(summary);
            const categorySummaryMap = new Map(treeSummary.map(node => [node.category, node]));
            const divTransaction = CommonUtil.getDivElement('divTransaction') as HTMLDivElement;
            divTransaction.innerHTML = "";
            const catTable = AppCommonTable.createTable(treeSummary, { column: [{ columnName: 'amount', type: 'CURRENCY' }] });
            const rows = catTable.querySelectorAll('tr')

            for (let i = 1; i < rows?.length; i++) {
                const cells = rows[i].querySelectorAll('td');
                cells[2].innerHTML = "";
                const categoryNode = categorySummaryMap.get(cells[0].textContent ?? "");
                cells[2].append(AppCommonTable.createTable((categoryNode?.children ?? []) as any, {
                    table: {
                        style: 'inline',
                        thType: 'sub'
                    },
                    column: [{ columnName: 'amount', type: 'CURRENCY' }]
                }))
            }
            divTransaction.append(catTable);
        })
    }
    const initUpdateCategory = async () => {
        const selCategoryUpd = CommonUtil.getSelectElement('selCategoryUpd');
        const selSubcategoryUpd = CommonUtil.getSelectElement('selSubcategoryUpd');
        const btnUpdCatSubcat = CommonUtil.getSelectElement('btnUpdCatSubcat');

        initSelCatSubCat(selCategoryUpd, selSubcategoryUpd);
        btnUpdCatSubcat.addEventListener('click', async () => {
            const catId = selCategoryUpd.value === '' ? '0' : selCategoryUpd.value;
            let subcatId = selSubcategoryUpd.value === '' ? '0' : selSubcategoryUpd.value;
            subcatId = catId === '0' ? '0' : subcatId;
            const ids: string[] = renderedData.map(x => x.id);
            if (confirm(`Are you sure you want to do the batch update for ${ids.length} transactions?`)) {
                await DataProvider.fetchData(`updateTranCategory`, 'PUT', { catId, subcatId, ids });
            }
            dataTransaction = await fetchTransactions();
            applyAndRender();
        })
    }
    const initAddTran = () => {
        const btnAddTran = CommonUtil.getButtonElement('btnAddTran');
        btnAddTran.addEventListener("click", async () => {
            const id = await AppCommonTable.addTable(TRANSACTIONS_TABLE);
            AppCommonTable.updateTable(TRANSACTIONS_TABLE, id, 'date', new Date().toISOString().slice(0, 10));
            renderedData.unshift({
                date: new Date(),
                type: '',
                description: '',
                amount: 0,
                category: '',
                note: '',
                trip: '',
                account_from: '',
                account_to: '',
                source: '',
                owner: '',
                id: id.toString()
            });
            renderTransactions(renderedData);
        })
    }

    initCatTripMgr();
    initFilters();
    initRefreshSummary();
    initUpdateCategory();
    initAddTran();

    applyAndRender();
}
const renderTransactions = async (data: Array<Transaction>) => {
    renderedData = data;
    const divTransaction = CommonUtil.getDivElement('divTransaction') as HTMLDivElement;
    divTransaction.innerHTML = "";

    const updateTransaction = async (id: string, newValue: string, column: string) => {
        column = getOptId(column);
        if (column === 'amount') {
            const normalized = (newValue ?? '').toString().replace(/[^0-9.-]/g, '').trim();
            if (normalized === '' || Number.isNaN(Number(normalized))) {
                const current = renderedData.find(item => item.id === id)?.amount;
                newValue = current === null || current === undefined ? '0' : `${current}`;
            } else {
                newValue = `${Number(normalized)}`;
            }
        }
        await AppCommonTable.updateTable(TRANSACTIONS_TABLE, id, column, newValue);
    }

    const optType = CommonUtil.mapArrayToOption(dataType, 'type');
    const optTrip = CommonUtil.mapObjectToOption(dataTrip, 'id', 'name', 'trip');
    const optSource = CommonUtil.mapObjectToOption(dataSource, 'id', 'name', 'source');
    const optAcctFrm = CommonUtil.mapObjectToOption(dataSource, 'id', 'name', 'account from');
    const optAcctTo = CommonUtil.mapObjectToOption(dataSource, 'id', 'name', 'account to');

    const showItemDetail = async (id: string, tdSelect: HTMLTableCellElement, bOnValue: boolean = true) => {
        if (bOnValue) {
            let link = CommonUtil.createInlineButton('  >');
            link.classList.add('right');
            link.addEventListener('click', async (event) => {
                const btn = event.target as HTMLAnchorElement;
                const currTd = btn?.parentElement as HTMLTableCellElement;
                const currTr = currTd.parentNode as HTMLTableRowElement;

                let lnkAdd: HTMLAnchorElement;
                if (currTd.querySelector('tr') === null) { // first time to expend split table
                    const splitTbl = await createSplitTable(id, currTr, currTd);
                    currTd.appendChild(splitTbl);
                    link.textContent = '  <';
                } else { // show/hide split table if already created
                    lnkAdd = ([...currTd.querySelectorAll("a")].find(el => el.textContent?.trim() === "+")) as HTMLAnchorElement; // thread operator turn object into array
                    lnkAdd.style.display = lnkAdd.style.display === 'none' ? '' : 'none';
                    const tbl = currTd.querySelector('table') as HTMLElement;
                    tbl.style.display = tbl.style.display === 'none' ? '' : 'none';
                    link.textContent = tbl.style.display === 'none' ? '  >' : '  <';
                }
            });
            tdSelect.appendChild(link);
        }
    }
    const table = AppCommonTable.createTable(data, {
        table: {
            columnListToHide: ['account_from', 'account_to', 'owner'],
            onchange: updateTransaction,
            edit: true
        },
        column: [
            {
                columnName: 'amount',
                type: 'CURRENCY'
            },
            {
                columnName: 'type',
                type: 'SELECT',
                optionData: optType,
                onSelChange: updateTransaction
            },
            {
                columnName: 'category',
                type: 'SELECT_SUB',
                optionData: catSubcatTreeData,
                // type: 'SELECT',
                // option: optCategory,
                onSelChange: updateTransaction,
                onValue: { value: SPLIT_CATEGORY_IND, action: showItemDetail }
            },
            {
                columnName: 'trip',
                type: 'SELECT',
                optionData: optTrip,
                onSelChange: updateTransaction
            },
            {
                columnName: 'source',
                type: 'SELECT',
                optionData: optSource,
                onSelChange: updateTransaction
            },
            {
                columnName: 'account_from',
                type: 'SELECT',
                optionData: optAcctFrm,
                onSelChange: updateTransaction,
            },
            {
                columnName: 'account_to',
                type: 'SELECT',
                optionData: optAcctTo,
                onSelChange: updateTransaction,
            },
        ]
    });

    // calculate and format as expense: $150.00, income: $300.00, transfer: $200.00
    const totalSum =
        Object.entries(
            data.reduce((acc: Record<string, number>, cur) => {
                acc[cur.type] = (acc[cur.type] ?? 0) + cur.amount;
                return acc;
            }, {} as Record<string, number>)
        )
            .map(([k, v]) =>
                `${k}: ${CommonUtil.usdFormatter.format(v as number)}`
            )
            .join(', ');
    const spnCount = document.createElement('span');
    spnCount.textContent = `There are total ${data.length} transactions with ${totalSum}`;
    divTransaction.append(spnCount);
    divTransaction.append(table);
}
const createSplitTable = async (tranId: string, parTr: HTMLTableRowElement, parTd: HTMLTableCellElement) => {
    let splitData: Array<TranLine> = await DataProvider.fetchData(`tranDetail/${tranId}`);

    const addTranDetail = async (parTr: HTMLTableRowElement, parTd: HTMLTableCellElement) => {
        let splitData: Array<TranLine> = await DataProvider.fetchData(`tranDetail/${tranId}`);
        const totalAmt = dataTransaction.find(x => x.id === tranId)?.amount ?? 0;
        const splitAmt = splitData.reduce((sum: number, item: TranLine) => Number(sum) + Number(item.amount), 0);
        const leftAmt = totalAmt - splitAmt;
        if (leftAmt <= 0) {
            throw (new Error(`Split table sub amount ${splitAmt} exceeds or equal total amount ${totalAmt}`));
        }
        const category = catSubcatTreeData.find(x => x.textContent === 'Food');
        const subcategory = category?.children?.find(x => x.textContent === 'Grocery');
        // add an empty line then edit to save
        await DataProvider.fetchData('tranDetail', 'POST', {
            transaction_id: tranId,
            description: 'Costco',
            amount: leftAmt, category_id:
                category?.value,
            subcategory_id: subcategory?.value
        });
        await refreshSplitTable(parTr, parTd);
    }

    const updateTranDetail = async (id: string, newValue: string, column: string) => {
        column = getOptId(column);
        await AppCommonTable.updateTable(TRANSACTION_LINES_TABLE, id, column, newValue);
    }

    const deleteTranDetail = async (parTr: HTMLTableRowElement, parTd: HTMLTableCellElement, id: string) => {
        await AppCommonTable.deleteTable(TRANSACTION_LINES_TABLE, id);
        await refreshSplitTable(parTr, parTd);
    }

    const refreshSplitTable = async (parTr: HTMLTableRowElement, parTd: HTMLTableCellElement) => {
        let tbl = parTd.querySelector('table');
        if (tbl)
            parTd.removeChild(tbl);
        parTd.appendChild(await createSplitTable(tranId, parTr, parTd));
    }
    let splitTable = AppCommonTable.createTable(splitData, {
        table: {
            header: ['id', 'description', 'amount', 'category'],
            style: 'inline',
            thType: 'sub',
            onchange: updateTranDetail,
            edit: true,
            showEmptyTable: true
        },
        column: [
            { columnName: 'amount', type: 'CURRENCY', },
            {
                columnName: 'category',
                type: 'SELECT_SUB',
                optionData: catSubcatTreeData,
                onSelChange: updateTranDetail
            }
        ]
    });

    const trList = splitTable.querySelectorAll('tr');
    for (let i = 0; i < trList.length; i++) {
        let elem;
        let actTd = document.createElement('td');
        if (i === 0) {
            // add new tran detail btn
            elem = CommonUtil.createInlineButton('+');
            elem.addEventListener('click', (event) => {
                event.preventDefault();
                const parTd = actTd.parentElement?.parentElement?.parentElement?.parentElement as HTMLTableCellElement;
                const parTr = parTd?.parentElement as HTMLTableRowElement;
                addTranDetail(parTr, parTd);
            })
            actTd.appendChild(elem);
        } else {
            elem = CommonUtil.createInlineButton('-');
            elem.addEventListener('click', () => deleteTranDetail(parTr, parTd, trList[i].cells[0].textContent ?? ""));
            actTd.appendChild(elem);
        }
        trList[i].appendChild(actTd);
    }
    return splitTable;
}
/**
 * Option could be category, event, source etc.  
 * Convert to it's id if appropriate
 * 
 * @param opt : option name
 * @returns 
 */
const getOptId = (opt: string): string => {
    if (opt === 'category' || opt === 'subcategory' || opt === 'trip' || opt === 'source') {
        return `${opt}_id`;
    } else {
        return opt;
    }
}
const filterTranByDates = (data: Transaction[], start: string, end: string) => { // yyyy-mm-dd
    const startDate = new Date(`${start}T00:00:00.000Z`).getTime()
    const endDate = new Date(`${end}T23:59:59.999Z`).getTime()

    const result = data.filter(item => {
        const time = new Date(item.date).getTime()
        return time >= startDate && time <= endDate
    })

    return result;
}
