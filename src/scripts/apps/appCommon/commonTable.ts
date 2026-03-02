import * as DataProvider from '../../db/dataProvider.js';
import * as CommonUtil from '../../common.js';
export interface ColumnSpec {
    columnName: string;
    type?:
    'STRING' | 'NUMBER' | 'CURRENCY' | 'PERCENT' | 'DATE' |  // default to 'STRING'
    'SELECT' | // trade_type as 'BUY'/'SELL'
    'SELECT_SUB'; // such as category/subcategory
    optionData?: Array<CommonUtil.OptionData>;     // for 'SELECT'
    onValue?: {
        value: any;
        action: (...args: any[]) => Promise<any>;
    };
    enableColor?: boolean; // color to red if include '-'
    onSelChange?: (...args: any[]) => Promise<any>;
    // onSelChange?: (id:string, newValue:string|null, column:string) => any;
    onSelSubChange?: (...args: any[]) => Promise<any>;
};
export interface TableParam {
    table?: {
        keyName?: string; // default 'id'
        columnListToHide?: Array<string>; // defaulte 'created_on' and 'updated_on'
        style?: string; // 'inline' etc
        thType?: 'sub'; // header <th> style
        header?: Array<string>; // default to transformed column name
        edit?: boolean;
        showEmptyTable?: boolean;
        sort?: boolean; // default true
        resize?: boolean; // default true
        onchange?: (id: string, newValue: string, columnName: string) => Promise<any>; // need to be more specic
        ondelete?: (id: string) => Promise<any>;
        // generic argument test?: (...args: any[]) => any
    };
    column?: Array<ColumnSpec>;
}
export interface DataRow {
    [key: string]: any;   // allow dynamic keys
}

const getColumnSpecMap = (featureParam?: TableParam): Map<string, ColumnSpec> => {
    const map = new Map<string, ColumnSpec>();
    (featureParam?.column ?? []).forEach(spec => map.set(spec.columnName, spec));
    return map;
}
/**
 * Create table element from data and optional TableParam
 */
export function createTable(data: Array<DataRow>, featureParam?: TableParam): HTMLTableElement {
    const table = document.createElement('table');
    // request show table but no header and data
    if (featureParam?.table?.showEmptyTable === true &&
        !featureParam?.table?.header && (!data || data.length === 0)) {
        CommonUtil.showMessage('Provid hearders or data to create a table');
        return table;
    }
    // check if empty table is shown
    if ((!data || data.length === 0) && featureParam?.table?.showEmptyTable !== true) {
        CommonUtil.showMessage('No data to display');
        return table;
    }

    // remove timestamp columns and hidden columns
    const columnListToHide = featureParam?.table?.columnListToHide ?? [];
    data = data.map((item: DataRow): DataRow => {
        const newRow = { ...item };               // avoid mutating original
        ['created_at', 'updated_at', ...columnListToHide].forEach(col => delete newRow[col]);
        return newRow;
    });

    const thead = createHeader(data, featureParam);
    const tbody = document.createElement('tbody');
    createRows(tbody, data, featureParam, getColumnSpecMap(featureParam));

    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
}
const createRows = (tbody: HTMLTableSectionElement, data: DataRow[], featureParam?: TableParam, columnSpecMap: Map<string, ColumnSpec> = getColumnSpecMap(featureParam)) => {
    attachEditableCellFocusoutHandler(tbody, featureParam?.table?.onchange);
    const fragment = document.createDocumentFragment();
    // A tray where you prepare multiple dishes in the kitchen
    // Then you carry the tray once to the table
    // Instead of walking back and forth 1000 times.
    data.forEach(row => fragment.appendChild(createRow(row, featureParam, columnSpecMap)));
    tbody.appendChild(fragment);
}
const attachEditableCellFocusoutHandler = (
    tbody: HTMLTableSectionElement,
    onchange?: (id: string, newValue: string, columnName: string) => Promise<any>
) => {
    if (!onchange || tbody.dataset.focusoutBound === '1') return;

    tbody.addEventListener("focusout", (event) => {
        const td = event.target as HTMLTableCellElement;
        if (!td || td.tagName !== 'TD' || td.dataset.editable !== '1') return;

        const rowId = td.dataset.rowId ?? '';
        const colName = td.dataset.colName ?? '';
        let newValue = td.textContent ?? "";

        if (td.dataset.currency === '1') {
            if (newValue.trim() !== '' && !isNaN(Number(newValue))) {
                newValue = (0 + parseFloat(newValue.replace(/[^0-9.-]/g, ""))).toString();
            } else {
                newValue = '';
            }
        }
        onchange(rowId, newValue, colName);
    });

    tbody.dataset.focusoutBound = '1';
}
const createHeader = (data: Array<DataRow>, featureParam?: TableParam) => {
    const ondelete = featureParam?.table?.ondelete ?? false;
    const onchange = featureParam?.table?.onchange;

    const thead = document.createElement('thead');
    const tr = document.createElement('tr');

    // user headers if provided.  otherwise create header from field list
    let headers = featureParam?.table?.header;
    if (!headers) {
        headers = Object.keys(data[0]);// must have data to create header if there is no defined header
        headers = headers.map(key => key.replace('_', ' '));
    }

    headers.forEach(header => {
        const th = document.createElement('th');
        if (featureParam?.table?.thType) { // customize th style
            th.setAttribute("type", featureParam?.table?.thType);
        }

        th.textContent = header;
        if (featureParam?.table?.sort ?? true) {
            // Add indicator to this column
            th.onclick = () => sortTable(data, header, th, featureParam);
        }
        if (featureParam?.table?.resize ?? true) enableResize(th);
        tr.appendChild(th);
    });

    // last column for edit/delete if specified.  if row is always editable, no need for last action column
    if (featureParam?.table?.edit === undefined && (ondelete || onchange)) { // if the row is edit enabled, no need for the action column
        // create action column for update/delete
        const th = document.createElement('th');
        th.textContent = 'Action';
        tr.appendChild(th);
    }
    thead.append(tr);
    return thead;
}
const createRow = (row: DataRow, featureParam?: TableParam, columnSpecMap: Map<string, ColumnSpec> = getColumnSpecMap(featureParam)): HTMLTableRowElement => {
    const isTableEditable = featureParam?.table?.edit ?? false;
    const ondelete = featureParam?.table?.ondelete;
    const onchange = featureParam?.table?.onchange;
    const tr = document.createElement('tr');

    Object.entries(row).forEach(([colName, colVal]) => {
        const keyName = featureParam?.table?.keyName ?? 'id';
        colVal = colVal?.toString() ?? "";
        const columnSpec = columnSpecMap.get(colName);
        const td = document.createElement('td');

        if (columnSpec?.enableColor) {
            if (colVal?.indexOf('-') !== -1) {
                td.style.color = "red";
            }
        }


        const canEditCell = !(
            colName === keyName ||
            columnSpec?.type === 'SELECT' ||
            columnSpec?.type === 'SELECT_SUB' ||
            isColumnDate(colName, columnSpec)
        );
        let isTdEditable = isTableEditable && canEditCell;

        if (columnSpec?.type === 'SELECT') {
            renderSelect(row.id, td, colVal, columnSpec);
        } else if (columnSpec?.type === 'SELECT_SUB') {
            renderSelectSub(row.id, td, colVal, columnSpec);
        } else if (isColumnDate(colName, columnSpec)) {
            renderDate(row.id, td, colVal, colName, onchange);
        } else if (isColumnCurrency(colName, columnSpec)) {
            renderCurrency(td, colVal?.toString());
        } else {
            td.innerHTML = colVal;
        }

        td.contentEditable = isTdEditable.toString();
        if (canEditCell && onchange) {
            td.dataset.editable = '1';
            td.dataset.rowId = String(row.id);
            td.dataset.colName = colName;
            if (isColumnCurrency(colName, columnSpec)) {
                td.dataset.currency = '1';
            }
        }
        tr.appendChild(td);
    });

    // add action cell for update and delete button
    if (isTableEditable !== true && (onchange || ondelete)) {
        tr.appendChild(createActionCell(row.id, featureParam));
    }
    return tr;
}
const createActionCell = (id: string, featureParam?: TableParam) => {
    // add edit/done button 
    const td = document.createElement('td');
    const editBtnTxt = ['edit', 'done'];
    if (featureParam?.table?.onchange) {
        const delBtn = document.createElement('button');
        delBtn.textContent = editBtnTxt[0];
        delBtn.addEventListener('click', (event) => {
            const btn = event.target as HTMLButtonElement;
            const row = btn.parentElement?.parentElement as HTMLTableRowElement
            if (btn.textContent === editBtnTxt[0]) {
                btn.textContent = editBtnTxt[1];
                enableCellEdit(row, featureParam?.column, true);
            } else {
                btn.textContent = editBtnTxt[0];
                enableCellEdit(row, featureParam?.column, false);
            }
        });
        td.appendChild(delBtn);
    }
    // add delete button 
    if (featureParam?.table?.ondelete) {
        const delBtn = document.createElement('button');
        delBtn.textContent = 'del';
        delBtn.addEventListener('click', async (event) => {
            if (confirm("Are you sure you want to delete this row?")) {
                const btn = event.target as HTMLButtonElement;
                const row = btn.parentElement?.parentElement as HTMLTableRowElement
                row?.parentElement?.removeChild(row);
                if (featureParam?.table?.ondelete) {
                    await featureParam?.table?.ondelete(id);
                }
            }
        });
        td.appendChild(delBtn);
    }
    return td;
}
const renderCurrency = (td: HTMLTableCellElement, value: string) => {
    function isNumeric(str: string): boolean {
        return str?.trim() !== "" && !isNaN(Number(str));
    }
    const formatCurrency = (amt: number) => {
        return CommonUtil.usdFormatter.format(amt as number)
    }

    if (isNumeric(value)) {
        const amt = Number(value.trim());
        value = formatCurrency(amt)
        if (amt < 0) {
            td.style.color = "red";
        }
    }
    td.textContent = value;
}
const enableCellEdit = (row: HTMLTableRowElement, column?: Array<ColumnSpec>, bEdit = false) => {
    const th = row?.parentElement?.parentElement?.childNodes[0] as HTMLTableCellElement;
    Array.from(row.cells).forEach((c, i) => {
        if (column !== undefined && column !== null) {
            const colName = th.children[0].childNodes[i].textContent;
            const columnSpec = column?.find(spec => spec.columnName.replace('_', ' ') === colName);
            if (columnSpec) {
                if (columnSpec.type === 'SELECT') {
                    if (bEdit) {
                        // enableSelect(c, columnSpec);
                    } else {
                        const optSel = c.childNodes[0] as HTMLSelectElement;
                        if (optSel.selectedIndex === -1) {
                            c.textContent = '';
                        } else {
                            c.textContent = optSel.selectedOptions[0].textContent;
                        }
                    }
                }
            }
        }
        c.contentEditable = bEdit.toString();
    })
}

const isColumnCurrency = (columnName: string, columnSpec?: ColumnSpec) => {
    const currencyNames = [
        'price',
        'cost',
        'total',
        'value',
        'diff',
        'gain'
        //        'pct',
    ];

    return (columnSpec && columnSpec.type === 'CURRENCY' ||
        currencyNames.some(item => columnName.toLowerCase().indexOf(item) !== -1)
    ) ? true : false;
}
const isColumnDate = (columnName: string, columnSpec?: ColumnSpec): boolean => {
    return (columnSpec && columnSpec.type === 'DATE' || columnName.indexOf('date') !== -1) ? true : false;
}
function renderSelect(id: string, tdSelect: HTMLElement, cellValue: string, columnSpec: ColumnSpec) {
    // to create and render a simple select in tdSelect
    const { columnName, optionData, onSelChange } = columnSpec;
    if (optionData === undefined) return;

    tdSelect.innerHTML = "";
    const select = CommonUtil.createInlineSelect(optionData, cellValue);
    if (onSelChange) {
        select.addEventListener("change", (event) => {
            onSelChange(id, (event.target as HTMLSelectElement).value, columnName);
        });
    }
    tdSelect.appendChild(select);
}

function renderSelectSub(id: string, tdSelect: HTMLElement, value: string /* sel|selSub */, columnSpec: ColumnSpec) {
    // to create a select and selectSub in tdSelect
    const { columnName, optionData, onSelChange, onValue } = columnSpec;
    if (optionData === undefined || onSelChange === undefined) return;

    tdSelect.style.width = "400px";
    let selSubSel = value.trim().split('|');
    // if (currentValue === undefined || currentValue === null) return;
    const selectedCat = selSubSel[0];

    const createSelectCat = (id: string) => {
        tdSelect.innerHTML = "";
        const select = CommonUtil.createInlineSelect(optionData, selectedCat);
        tdSelect.appendChild(select);

        select.addEventListener("change", async (event: Event) => {
            // update cat/subcat
            const selOpt = event.target as HTMLSelectElement;
            const newValue = selOpt.value; // new id
            await onSelChange(id, newValue, columnName, columnSpec);
            await onSelChange(id, null, `sub${columnName}`, columnSpec);

            // remove split table
            const splitTable = tdSelect.querySelector('table');
            if (splitTable) {
                tdSelect.removeChild(splitTable);
            }
            // remove show/hide split ind
            const showHideInd = tdSelect.querySelector('a');
            if (showHideInd) {
                tdSelect.removeChild(showHideInd);
            }
            // remove subSel
            const selCollection = tdSelect.querySelectorAll('select');
            if (selCollection?.length && selCollection?.length > 1) {
                tdSelect.removeChild(selCollection[1]); // remove subcat
            }
            const cellValue = selOpt.selectedOptions[0].textContent; // new category
            // create subcategory
            createSubcat(id, cellValue);

            // handle split
            onValueAction(cellValue);
        });
    }
    // subSel
    const createSubcat = (id: string, catSel: string | null) => {
        // find subcatData based on selected opt
        const subcatData = ((optionData as any[]).find(x => x.textContent === catSel))?.children;
        if (subcatData?.length > 0) { // find children
            const subcatSel = selSubSel[1];
            const selectSub = CommonUtil.createInlineSelect(subcatData, subcatSel);
            tdSelect.appendChild(selectSub);

            if (onSelChange) {
                selectSub.addEventListener("change", async (event) => {
                    const selOpt = event.target as HTMLSelectElement;
                    const cellValue = selOpt.selectedOptions[0].textContent;
                    const bOnValue = cellValue === columnSpec?.onValue?.value ? true : false;
                    const newValue = selOpt.value;
                    onSelChange(id, newValue, `sub${columnName}`, columnSpec, tdSelect, bOnValue);
                });
            }
        }
    }
    const onValueAction = (selectedCat: string | null) => {
        // handle split
        if (onValue && onValue.value === selectedCat) {
            onValue.action(id, tdSelect);
        }
    }

    createSelectCat(id);
    createSubcat(id, selectedCat);
    onValueAction(selectedCat);
}

function enableResize(th: HTMLElement) {
    let resizer = document.createElement("div");
    resizer.classList.add("resizer");
    th.appendChild(resizer);
    resizer.addEventListener("mousedown", function (event) {

        let startX = event.pageX;
        let startWidth = th.offsetWidth;

        function resize(event: MouseEvent) {
            let newWidth = startWidth + (event.pageX - startX);
            th.style.width = newWidth + "px";
        }

        function stopResize() {
            document.removeEventListener("mousemove", resize);
            document.removeEventListener("mouseup", stopResize);
        }

        document.addEventListener("mousemove", resize);
        document.addEventListener("mouseup", stopResize);
    });
}

let sortDirection: Record<string, "asc" | "desc"> = {};
function sortTable(data: Array<DataRow>, columnName: string, th: HTMLHeadElement, featureParam?: TableParam) {

    // Toggle the sort direction
    const column = columnName.replace(' ', '_');
    const currentDirection = sortDirection[column] ?? "desc"; // initial sort asc
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc'; // Toggle

    // Sort the data array based on the selected column
    data.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];


        // Convert values to appropriate types for sorting
        if (typeof valA === "string" && typeof valB === "string") {
            return newDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else if (typeof valA === "number" && typeof valB === "number") {
            return newDirection === 'asc' ? valA - valB : valB - valA;
        } else {
            return 0; // If types don't match, don't change order
        }
    });

    // Save the new sort direction
    sortDirection[column] = newDirection;

    // After sorting, rebuild the table with the updated data
    const tbody = (th?.parentNode?.parentNode?.parentNode?.childNodes[1]) as HTMLTableSectionElement;
    tbody.innerHTML = "";
    createRows(tbody, data, featureParam, getColumnSpecMap(featureParam));
    tbody.parentElement?.querySelectorAll("th").forEach(h => h.classList.remove("sorted-asc", "sorted-desc"));
    th.classList.add(currentDirection === 'asc' ? "sorted-desc" : "sorted-asc");
}
export const renderDate = (id: string, td: HTMLTableCellElement, date: string | undefined, key: string, onchange: Function | undefined) => {
    td.innerHTML = "";
    const elem = document.createElement('input');
    elem.type = 'date';
    elem.value = CommonUtil.formatDateTime(new Date(date ?? new Date()));
    elem.addEventListener("change", (event) => {
        const dateElem = event.target as HTMLDataElement;
        // id, newValue, column
        if (onchange) {
            onchange(id, dateElem.value, key);
        }
    });
    td.appendChild(elem);
}
// these helper functions stay here because the router is in fintech
export const addTable = async (table: string, data?: Array<any>) => {
    const result = await DataProvider.fetchData(`table/${table}`, 'POST');
    data?.push({ id: result.id });
    return result.id;
}
export const getTable = async (table: string) => {
    try {
        return await DataProvider.fetchData(`table/${table}`);
    } catch (error) {
        const err = error as Error;
        CommonUtil.showMessage(`Failed to get table '${table}': ${err.message}`);
        throw err;
    }
}
export const deleteTable = async (table: string, id: string) => {
    try {
        await DataProvider.fetchData(`table/${id}/${table}`, 'delete');
    } catch (error) {
        const err = error as Error;
        CommonUtil.showMessage(`Failed to delete row ${id} from '${table}': ${err.message}`);
        throw err;
    }
}
export const updateTable = async (table: string, id: string, column: string, newValue: any, data?: Array<any>) => {
    try {
        await DataProvider.fetchData(`table`, 'PUT', { id, table, column, newValue });
        // mutate data to reflect change
        if (data) {
            const item = findItemById(id, data, 'id', 'FIND');
            if (item.length > 0 && item[0][column] != newValue) {
                item[0][column] = newValue;
            }
        }
    } catch (error) {
        const err = error as Error;
        CommonUtil.showMessage(`Failed to update '${table}.${column}' for row ${id}: ${err.message}`);
        throw err;
    }
}
export const findItemById = (id: string, items: Array<any>, colName: string, type: 'FIND' | 'FILTER' = 'FILTER'): any[] => {
    if (type === 'FIND') {
        const foundItem = items.find(item => Number(item[colName]) === Number(id));
        return foundItem === undefined ? [] : [foundItem];
    }
    else { // if (type === 'FILTER') {
        return items.filter(item => Number(item[colName]) === Number(id));
    }
}
export const getEnumValue = async (schema: string, table: string, column: string) => {
    const sql = `
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${schema}'
        AND TABLE_NAME = '${table}'
        AND COLUMN_NAME = '${column}'
    `;
    let rows = await DataProvider.getSqlResult(sql);
    if (rows.length > 0) {
        const enumValues = rows[0].COLUMN_TYPE
            .match(/'([^']+)'/g) // Extract the quoted values
            .map((val: string) => val.replace(/'/g, '')); // Remove quotes
        return enumValues;
    }
}
