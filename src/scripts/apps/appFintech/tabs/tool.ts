import * as DataProvider from '../../../db/dataProvider.js';
import * as CommonUtil from '../../../common.js';
import * as AppCommonTable from '../../appCommon/commonTable';

const tools = [
    'Generate_Fetch_Code',
    'Generate_Tool_CSS',
    'sql result',
    'Generate_Merge_Tran_SQL',
];
const ecTables = ['-- select a table --', 'ec_user', 'ec_crumb', 'ec_tag', 'ec_crumb_tag', 'ec_media'];

let selTool: HTMLSelectElement;
export const initTool = async () => {
    selTool = document.getElementById('selTool') as HTMLSelectElement;
    const selSql = document.getElementById('selSql') as HTMLSelectElement;
    const toolMap = tools.map(t => { return { value: t, textContent: t.replaceAll('_', ' ') } });
    CommonUtil.populateSelect(selTool, toolMap);
    // remove params from sqls
    const newData = sqls.map(({ params, ...rest }) => rest) as any as { [key: string]: string; }[]
    // CommonUtil.populateSelect(selSql, CommonUtil.mapObjectToOption(newData, 'name', 'name'));
    CommonUtil.populateSelect(selSql, CommonUtil.mapObjectToOption(newData, 'name', 'name'));

    selTool.addEventListener("change", () => {
        reset();
        let placeholder: string[] = [];
        if (selTool.value === tools[0]) {
            placeholder = ['fetch Name', 'table name for CRUD'];
        }
        const codeParam = document.getElementById("codeParam");
        if (codeParam) {
            codeParam.innerHTML = "";
        } else { return; }
        placeholder.forEach((item, i) => {
            if (item === 'table name') {
                codeParam.innerHTML += `<input id='tableName' type="text" placeholder='${item}'>`;
            } else {
                codeParam.innerHTML += `<input id='param${i}' type="text" placeholder='${item}'>`;
            }
        })
        if (selTool.selectedIndex === 0 || selTool.value === tools[2]) {
            CommonUtil.showHideContainer("code", true);
        } else {
            CommonUtil.showHideContainer("code", false);
        }
        if (selTool.value === tools[3]) {
            generateMergeTranSQL();
        }
    })
    const btnGenerate = document.getElementById('btnGenerate');
    btnGenerate?.addEventListener("click", () => {
        if (selTool.value === tools[0]) {
            const ids = ['param0', 'param1'];
            const params = ids.map(id => document.getElementById(id) as HTMLInputElement);
            // const params = document.querySelectorAll('input');
            const crud = document.getElementById('crud') as HTMLInputElement;
            const code = document.getElementById('code') as HTMLInputElement;
            if (crud.checked)
                code.value = generateCRUDCode(params[0].value, params[1].value);
            else
                code.value = generateFetchCode(params[0].value);
        } else if (selTool.value === tools[1]) {
            createToolCSS();
        }
    })
    const code = document.getElementById('code') as HTMLTextAreaElement;
    if (!code) return;

    selSql.addEventListener("change", () => {
        reset();
        const sqlItem = sqls.find(item => selSql.value === item.name) as any;
        if (!sqlItem) return;

        const sqlParam = document.getElementById('sqlParam') as HTMLElement;
        sqlParam.innerHTML = "";
        if (sqlItem.params.length === 0) {
            code.value = sqlItem.sql;
        } else {
            sqlItem.params.forEach((item: string) => {
                if (item === 'table name') {
                    const sel = document.createElement('select');
                    sel.id = 'selTable';
                    CommonUtil.populateSelect(sel, CommonUtil.mapArrayToOption(ecTables));
                    sqlParam.appendChild(sel);
                    // can add change listner to replace the param ? etc
                } else {
                    sqlParam.innerHTML += `<input type="text" placeholder='${item}'>`;
                }
                code.value = sqlItem.sql;
            })
        }
    })

    const btnShowData = document.getElementById('btnShowData');
    btnShowData?.addEventListener("click", async () => {
        const sqlResult = document.getElementById('sqlResult');
        if (!sqlResult) return;

        sqlResult.innerHTML = "";
        const selVal = (document.getElementById('selTable') as HTMLSelectElement).value;
        const sqlItem = sqls.find(item => selSql.value === item.name) as any;
        code.value = `${sqlItem.sql.replace('?', selVal)}`;;//`desc ${document.getElementById('selTable').value}`;

        let data = await DataProvider.getSqlResult(code.value);
        sqlResult.appendChild(AppCommonTable.createTable(data));
    })

    // sql
    const selSchema = document.getElementById('selSchema')! as HTMLSelectElement;
    const sqlSchema = `
SELECT schema_name AS database_name 
FROM information_schema.schemata 
WHERE schema_name NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys')
`;debugger
    const schemas =  await DataProvider.getSqlResult(sqlSchema);
    CommonUtil.populateSelect(selSchema, CommonUtil.mapObjectToOption(schemas, 'database_name', 'database_name'));
    const selTable = document.getElementById('selTable')! as HTMLSelectElement;
    let table = "";
    selSchema.addEventListener("change", async () => {
        // await DataProvider.getSqlResult(`use ${selSchema.value}`);
        const tables = await DataProvider.getSqlResult(`show tables from ${selSchema.value}`);
        CommonUtil.populateSelect(selTable, CommonUtil.mapObjectToOption(tables, `Tables_in_${selSchema.value}`, `Tables_in_${selSchema.value}`));

    })
    selTable.addEventListener("change", async () => {
        table = `${selSchema.value}.${selTable.value}`;
        const data = await DataProvider.getSqlResult(`select * from ${table}`);
        const sqlResult = document.getElementById('sqlResult') as HTMLDivElement;
        const count = document.getElementById('count') as HTMLDivElement;
        count.textContent = `There are ${data.length} rows`;
        sqlResult.innerHTML = "";
        sqlResult.appendChild(AppCommonTable.createTable(data, {
            table: {
                onchange: updateData,
                ondelete: deleteData,
                sort: true
            }
        }));
    })
    const updateData = async (id: string, newValue: string, column: string) => {
        await AppCommonTable.updateTable(table, id, column, newValue);
    }
    const deleteData = async (id: string) => {
        await AppCommonTable.deleteTable(table, id);
    }
}
const reset = () => {
    const code = document.getElementById('code') as HTMLInputElement;
    code.value = "";
    const sqlResult = document.getElementById('sqlResult') as HTMLElement;
    sqlResult.innerHTML = "";
}
const generateCRUDCode = (fName: string, tableName: string) => {
    let ret = '';
    ret += `
export const get${fName} = () => {return 'SELECT  FROM ${tableName}';}
export const add${fName} = () => {return 'INSERT INTO ${tableName} (name) values (?)';}
export const update${fName} = (column) => {return \`UPDATE ${tableName} SET \${column} = ? WHERE id = ?\`;}
export const delete${fName} = () => {return 'DELETE FROM ${tableName} WHERE id=?';}

export const get${fName} =async (id) => {
    return await execMySqlHD('get${fName}',  dbQuery.get${fName}());
}
export const add${fName} =async (id) => {
    return await execMySqlHD('add${fName}',  dbQuery.add${fName}(),[]);
}
export const update${fName} =async (id, newValue, column) => {
    return await execMySqlHD('update${fName}',  dbQuery.update${fName}(column),[newValue, id]);
}
export const delete${fName} =async (id) => {
    return await execMySqlHD('delete${fName}',  dbQuery.delete${fName}(),[id]);
}

export const get${fName} = catchAsync(async (req, res)=>{
    const { }=req.params;
    const results = await dbExec.get${fName}();
    res.json(results);
})
export const add${fName} = catchAsync(async (req, res)=>{
    const { }=req.params;
    await dbExec.add${fName}();
    res.json('add${fName}');
})
export const update${fName} = catchAsync(async (req, res)=>{
    const {id, newVal, column }=req.params;
    await dbExec.update${fName}(id, newVal, column);
    res.json('update${fName}');
})
export const delete${fName} = catchAsync(async (req, res)=>{
    const { }=req.params;
    await dbExec.delete${fName}();
    res.json('delete${fName}');
})

router.get('/', ecController.get${fName});
router.post('/', ecController.add${fName});
router.put('/', ecController.update${fName});
router.delete('/', ecController.delete${fName});
`;
    return ret;
}
const generateFetchCode = (fName: string) => {
    let ret = '';
    ret +=
        `export const ${fName} = () => {return ;}
`;
    ret +=
        `export const ${fName} =async (id) => {
    return await execMySqlHD('${fName}',  dbQuery.${fName}(),[id]);
}
`;
    let method = 'get';
    if (fName.indexOf('update') !== -1)
        method = 'put';
    else if (fName.indexOf('add') !== -1)
        method = 'post';
    else if (fName.indexOf('delete') !== -1)
        method = 'delete';
    let resJson = fName.indexOf('get') !== -1 ? 'return res.json(results);' : `res.json('${fName}')`;
    ret +=
        `export const ${fName} = catchAsync(async (req, res)=>{
    const { }=req.${method === 'get' ? 'params' : 'body'};
    const results = await dbExec.${fName}();
    ${resJson};
})
`;
    ret +=
        `router.${method}('/', ecController.${fName});
`;
    return ret;
}

const createToolCSS = () => {
    let toolClass = [
        'Bookmark',
        'Note',
        'Image',
        'up',
        'down',
        'refresh',
        'order',
        'orderH',
        'plus',
        'minus',
        'copy',
        'unpinCopy',
        'manage',
        'copyC',
        'pubLink',
        'next',
        'prev',
        'dot',
        'unpinDot',
        'edit',
        'unpinEdit',
        'pin',
        'unpin',
        'drop',
        'delete',
        'private',
        'public',
        'send',
        'long',
        'short',
        'Memo',
        'ShoppingList',
        'GoList',
        'editHTML',
        'undelete',
        'save',
        'pinC',
        'unpinC',
        'comment',
        'cabinet',
        'pinboard',
        'buddy',
        'more',
        'less',
        'help',
        'td',
        'tdMinus',
        'merge',
        'star',
        'starMinus',
        'remove',
        'share',
        'moveBM',
        'moveCat',
        'fItem',
        'dropImg',
        'folder',
        'board',
        'list',
        'none'
    ];
    const normalStyle = `
{
    position:relative;
    top:4px;
    display:inline-block;
    border:1px solid Transparent;
    width: 15px;
    height: 15px;
    background: url("../image/tools.gif") no-repeat 0 0;
    text-decoration:none;
}
`;
    const hoverStyle = `
{
    text-decoration:none;
    cursor: pointer;
}
`;

    let cssData = '';
    let htmlData = '<link rel="stylesheet" href="./tools.css">';
    toolClass.forEach((cls) => {
        cssData += `.${cls}, `;
    });
    const normalClass = cssData.substring(0, cssData.length - 2); // remove last ', '
    const hoverClass = `${normalClass}:hover`;
    cssData = `${normalClass} ${normalStyle}\n${hoverClass} ${hoverStyle}`;

    for (let i = 0; i < toolClass.length; i++) {
        cssData += `
.${toolClass[i]} {
background-position: 0px -${i * 16}px;
}
.${toolClass[i]}:hover {
background-position: -16px -${i * 16}px;
}
`;
        htmlData += `<a class='${toolClass[i]}'></a>`;
    }
    const code = document.getElementById('code') as HTMLTextAreaElement;
    if (code) {
        code.value = cssData;
        code.value += htmlData;
    }
    // writeFile('./files/', 'tools.css', cssData);
    // writeFile('./files/', 'tools.html', htmlData);
}
// function formatString(template, ...params) {
//     return template.replace(/{}/g, () => params.shift());
// }

const dbFintech = 'fintech';
// const dbHayday = 'hayday';
interface SqlObject {
    name: string;
    sql: string;
    params?: Array<string>
}
const sqls: Array<SqlObject> = [
    {
        name: 'show tables',
        sql: 'show tables',
        params: []
    }, {
        name: 'show create table',
        sql: 'SHOW CREATE TABLE ?',
        params: ['table name']
    }, {
        name: 'desc table',
        sql: 'desc ?',
        params: ['table name']
    }, {
        name: 'getTrade',
        sql: `select * from ${dbFintech}.trade_log where trade_type = 'BUY'`,
        params: ['trade type', 'what ever']
    }, {
        name: 'SET FOREIGN_KEY_CHECKS = ?',
        sql: 'SET FOREIGN_KEY_CHECKS = ?',
        params: ['boolean']
    }, {
        name: 'SET SQL_SAFE_UPDATES = 1',
        sql: 'SET SQL_SAFE_UPDATES = 1',
        params: ['boolean']
    }, {
        name: '',
        sql: '',
        params: []
    }, {
        name: '',
        sql: '',
        params: []
    }
];

//#region 
/**
 * Import csv to transaction
 * 
 * amex:
 * Date,Description,Card Member,Account #,Amount
 * 12/31/2024,AUTOPAY PAYMENT - THANK YOU,WEI YUAN,-11006,-1661.31
 * 
 * apple:
 * Transaction Date,Clearing Date,Description,Merchant,Category,Type,Amount (USD),Purchased By
 * 11/30/2025,12/02/2025,"CONTAINERSTOREPALOALTO500 STANFORD SHOPPING CTR PALO ALTO 94304 CA USA","The Container Store","Other","Purchase","7.63","Guangping Lei"
 * 
 * chase chk: 
 * Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #,memo
 * DEBIT,12/31/2025,"AMERICAN EXPRESS ACH PMT    A1990           WEB ID: 9493560001",-748.67,ACH_DEBIT,40298.01,,"a"
 * 
 * chase:
 * Transaction Date,Post Date,Description,Category,Type,Amount,Memo
 * 12/28/2025,12/29/2025,Amazon.com*5K3HJ3XB3,Shopping,Sale,-22.48,
 * 
 * citi dbl cash:
 * Status,Date,Description,Debit,Credit
 * Cleared,12/22/2025,"AUTOPAY 999990000073040RAUTOPAY AUTO-PMT",,-1285.89
 * 
 * citi costco:
 * Status,Date,Description,Debit,Credit,Member Name
 * Cleared,12/26/2025,"COSTCO WHSE #0146 LIVERMORE CA",149.46,,WEI YUAN
 * 
 * total 6 sources
 */
const generateMergeTranSQL = () => {
    const stageTables = [
        'amex',
        'apple',
        'chase',
        'chase_chk',
        'citi_costco',
        'citi_dbl_cash',
    ];
    const fmtDate = (date: string) => { return `STR_TO_DATE(\`${date}\`, '%m/%d/%Y')` };
    const stageValues = [
        `${fmtDate('Date')}, 'expense', description, amount, '', 3, \`card member\``,
        `${fmtDate('Transaction Date')}, 'expense', description, \`amount (usd)\`, '', 5, \`purchased by\``,
        `${fmtDate('Transaction Date')}, if(type='sale','expense','transfer'), description, amount, '', 4, ''`,
        `${fmtDate('Posting Date')}, if(details='DEBIT', 'expense', 'income'), description, if(amount>0, amount, -amount), 6, ''`,
        `${fmtDate('Date')}, if(debit='','transfer','expense'), description, if(debit='', credit, debit), 1, \`member name\``,
        `${fmtDate('Date')}, if(debit='','transfer','expense'), description, if(debit='', credit, debit), 1, ''`,
    ];
    const tnxStageTbl = 'tnx_tran_stage';
    const createSql = `create table as ${tnxStageTbl} select * from tnx_transactions where 1=0;`;
    const insertSql = `insert into txn_transactions (date, type, description, amount, note, source_id, owner)`;
    const code = CommonUtil.getTextarea('code');
    code.value = createSql;
    for(let i=0;i<stageTables.length;i++){
        const tbl = `2025_${stageTables[i]}`;
        code.value += ``;
        code.value += `\n\ntruncate ${tbl};\n${insertSql}\nselect ${stageValues[i]} from ${tbl};`
    }
}
//#endregion
