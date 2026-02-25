/**
 * test query for quick test
 */
export const test = () => {
    return `
select l.id, date, l.description, l.amount, l.type, concat(ifnull(c.name, ''), '|', ifnull(sc.name, '')) category, l.note, l.account_from, l.account_to, l.source, l.owner
from txn_transactions l
left join txn_categories c on l.category_id=c.id
left join txn_categories sc on l.subcategory_id=sc.id and sc.parent_id=l.category_id
order by l.id desc`}
/**
 * transactions
 */
const year = 2025;
const n = 6;
const tranYearToDate = `WHERE txn_date >= DATE_FORMAT(CURDATE(), '%Y-01-01')  AND txn_date <= CURDATE()`;
const tranLastNMonth = `WHERE txn_date >= DATE_SUB(CURDATE(), INTERVAL ${n} MONTH)`;
const tranYear = `WHERE date >= '${year}-01-01' AND date <  '${year}-01-01'`;

export const getCategory = () => { return 'select id, name, parent_id from txn_categories where active=1'; }
export const getTransaction = () => {
    return `
select date, l.type, l.description, l.amount, concat(ifnull(c.name, ''), '|', ifnull(sc.name, '')) category, l.note, e.name trip, l.account_from, l.account_to, s.name source, l.owner, l.id
from txn_transactions l
left join txn_categories c on l.category_id=c.id
left join txn_categories sc on l.subcategory_id=sc.id and sc.parent_id=c.id
left join txn_trips e on e.id=l.trip_id
left join txn_sources s on s.id=l.source_id
order by l.date desc ;
`}
export const getUncategorizedTrans = () => { return `select * from TXN_TRANSACTIONS where category_id is null or category_id = ''`; }
export const getTranDetailById = (id) => {
    return `
SELECT d.id, d.description, d.amount, concat(ifnull(c.name, ''), '|', ifnull(sc.name, '')) category
from txn_transaction_lines d
left join txn_categories c on c.id=d.category_id
left join txn_categories sc on sc.id=d.subcategory_id and sc.parent_id=d.category_id
where d.transaction_id = ?
`}
export const getTranSummary = () => {
    return `
select t.category, t.subcategory, sum(t.amount) amount from (
select 
t.id,
t.date,
ifnull(tl.description, t.description) description, 
ifnull(tl.amount, t.amount) amount,
IF(tlc.name IS NULL && tc.name!='<split>', tc.name, tlc.name) category, 
ifnull(tlsc.name, tsc.name) subcategory
from txn_transactions t
left join txn_transaction_lines tl on t.id=tl.transaction_id
left join txn_categories tc on tc.id=t.category_id
left join txn_categories tlc on tlc.id=tl.category_id
left join txn_categories tsc on tsc.id=t.subcategory_id and tsc.parent_id=tc.id
left join txn_categories tlsc on tlsc.id=tl.subcategory_id and tlsc.parent_id=tlc.id
where t.type='expense'
) t
group by t.category, t.subcategory 
order by amount desc
`}
export const addTranDetail = () => { return `INSERT INTO txn_transaction_lines (transaction_id, description, amount, category_id, subcategory_id) VALUES (?, ?, ?, ?, ?)`; }
export const updateTranCategoryByIds = (idCount) => {
    const placeholders = new Array(Math.max(0, Number(idCount) || 0)).fill('?').join(', ');
    return `UPDATE TXN_TRANSACTIONS SET category_id = ?, subcategory_id = ? WHERE id IN (${placeholders})`;
}
export const updateTranTripFromTrips = (tripName) => {`
UPDATE txn_transactions tn
JOIN txn_trips tr
ON tn.date >= tr.start_date
AND tn.date <= tr.end_date
SET tn.trip_id = tr.id
WHERE tn.type = 'expense'
AND tr.name = ?;
`}

/**
 * stocks
 */
const allTrade = `select t.id, trade_date, s.symbol, a.account_name, trade_type, share, t.price, t.lot, total, account_id, symbol_id 
from trade_log t, trade_account a, trade_symbol s 
where t.symbol_id=s.id and a.id=t.account_id 
order by symbol, trade_date, trade_type;
`;
export const getTrade = () => { return allTrade; }
export const addSymbol = () => { return `INSERT INTO trade_symbol (symbol, company_name, asset_type) VALUES (?, ?, ?)`; }
export const addTrade = () => { return `INSERT INTO trade_log (trade_date, account_id, symbol_id, trade_type, share, price, lot) VALUES (?, ?, ?, ?, ?, ?, ?)`; }
export const updatePrice = () => { return `UPDATE trade_symbol SET price = ?, previous_price=? WHERE symbol = ?`; }
export const addAccount = () => { return `INSERT INTO trade_account (institute, account_name) VALUES (?, ?)`; }
export const getAccount = () => { return `SELECT id, account_name, institute FROM trade_account`; }

// staging    
export const getCitiTransaction = () => { return 'SELECT * FROM transaction_city'; }

/**
 * Common queries for CRUD one table
 */
export const getTable = (table) => { return `SELECT * FROM ${table}`; } // (${columns.join(',')})
export const addTable = (table) => { return `INSERT INTO ${table} (id) values (NULL)`; }
export const updateTable = (table, column) => { return `UPDATE ${table} SET ${column} = ? WHERE id = ?`; }
export const deleteTable = (table) => { return `DELETE FROM ${table} WHERE id=?`; }
