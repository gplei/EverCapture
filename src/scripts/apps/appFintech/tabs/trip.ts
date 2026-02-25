import * as CommonUtil from '../../../common.js';
import * as AppCommonTable from '../../appCommon/commonTable.js';

const TRIP_TABLE = 'TXN_TRIPS', TRIP_TRAN_TABLE = 'trip_transactions';
let tripData: AppCommonTable.DataRow[], tripTranData: AppCommonTable.DataRow[];

let tripTable: HTMLDivElement, tripTranTable: HTMLDivElement;
let selTrip: HTMLSelectElement;

// const categoryData: Record<string, string[]> = {
//     "-- Select a category -- ": [],
//     Transportation: [
//         "Flight",
//         "Train",
//         "Taxi/Uber",
//         "Metro/Subway",
//         "Bus",
//         "Car Rental",
//         "Gas",
//         "Parking",
//     ],

//     Lodging: ["Hotel", "Airbnb", "Resort", "Hostel"],

//     "Food & Drink": [
//         "Restaurant",
//         "Cafe",
//         "Groceries",
//         "Snacks",
//         "Bar/Drinks",
//     ],

//     Activities: ["Museum", "Tour", "Theme Park", "Outdoor Activity"],

//     Shopping: ["Souvenirs", "Clothing", "Gifts", "Local Products"],

//     "Fees & Admin": ["Visa Fee", "Tips", "Insurance", "Service Fee"],

//     Other: ["Miscellaneous"],
// };

export const initTrip = async () => {
    tripTable = document.getElementById('tripTable') as HTMLDivElement;
    tripData = await AppCommonTable.getTable(TRIP_TABLE);
    tripData.sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    await loadTrip(tripData);

    tripTranTable = document.getElementById('tripTranTable') as HTMLDivElement;
    tripTranData = await AppCommonTable.getTable(TRIP_TRAN_TABLE);

    const btnCostByYear = document.getElementById('btnCostByYear') as HTMLButtonElement;
    btnCostByYear.addEventListener("click", async () => {
        CommonUtil.showHodeObject("Cost by year", btnCostByYear, [document.getElementById("divSummary")!] );
    })

    const btnAddTrip = document.getElementById('btnAddTrip') as HTMLInputElement;
    btnAddTrip.addEventListener("click", async () => {
        await addTrip();
    })

    let btnAddTripTran = document.getElementById('btnAddTripTran') as HTMLInputElement;
    btnAddTripTran.addEventListener("click", async () => {
        await addTrip('tripTran');
    })

    selTrip = document.getElementById('selTrip') as HTMLSelectElement;
    CommonUtil.populateSelect(selTrip, CommonUtil.mapObjectToOption(tripData, 'id', 'title'));
    selTrip.addEventListener("change", async () => {
        tripSelected();
    })

}

const loadTrip = async (data: any[]) => {
    const divSummary = document.getElementById('divSummary')!;
    divSummary.innerHTML = "";

    const yearSummary: YearTotal[] = summarizeByYear(data);

    yearSummary.forEach(s => {
        divSummary.innerHTML += `<p>${s.year}: $${s.total}`;
    })

    tripTable.innerHTML = "";
    tripTable.appendChild(AppCommonTable.createTable(data, {
        table: {
            edit: true,
            onchange: updateTrip,
            ondelete: deleteTrip
        }
    }));
}

interface YearTotal {
    year: number;
    total: number;
}
const summarizeByYear = (data: any[]): YearTotal[] => {
    const map = new Map<number, number>();

    data.forEach(row => {
        const date = new Date(row.start_date);
        const year = date.getFullYear();

        if (!map.has(year)) {
            map.set(year, 0);
        }
        map.set(year, map.get(year)! + row.cost);
    });

    // Convert to an array and sort by year.
    return Array.from(map.entries())
        .map(([year, total]) => ({ year, total }))
        .sort((a, b) => a.year - b.year);
}


const createTripTranTable = (data: any[]) => {
    tripTranTable.innerHTML = "";
    tripTranTable.appendChild(AppCommonTable.createTable(data, {
        table: {
            onchange: updateTripTran,
            ondelete: deleteTripTran
        },
        column: [
            {
                columnName: 'subcategory',
                type: 'SELECT_SUB',
                // optionData: categoryData,
                onSelSubChange: updateSubcategory
            }
        ]
    }));
}

const updateSubcategory = async (rowId: string, newValue: string, columnName: string) : Promise<any>=> {
    return await AppCommonTable.updateTable(TRIP_TRAN_TABLE, rowId, columnName, newValue);
}

const addTrip = async (type?: string) => {
    if (!type) {
        await AppCommonTable.addTable(TRIP_TABLE, tripData); // new data appended while adding
        tripData = await AppCommonTable.getTable(TRIP_TABLE);
        await loadTrip(tripData);
    } else {
        tripTranTable.innerHTML = "";
        const id = await AppCommonTable.addTable(TRIP_TRAN_TABLE, tripTranData);
        await AppCommonTable.updateTable(TRIP_TRAN_TABLE, id, 'trip_id', Number(selTrip.value), tripTranData);
        tripTranData = await AppCommonTable.getTable(TRIP_TRAN_TABLE);
        tripSelected();
    }
}
const updateTrip = async (id: string, newValue: string, column: string) => {
    await AppCommonTable.updateTable(TRIP_TABLE, id, column, newValue, tripData);
}
const deleteTrip = async (id: string) => {
    await AppCommonTable.deleteTable(TRIP_TABLE, id);
}
const updateTripTran = async (id: string, newValue: string, column: string) => {
    await AppCommonTable.updateTable(TRIP_TRAN_TABLE, id, column, newValue, tripTranData);
}
const deleteTripTran = async (id: string) => {
    await AppCommonTable.deleteTable(TRIP_TRAN_TABLE, id);
}
const tripSelected = () => {
    CommonUtil.showHideContainer('btnAddTripTran', selTrip.value === "" ? true : false);

    const tripTranSelected = AppCommonTable.findItemById(selTrip.value, tripTranData, 'trip_id', 'FILTER') || [];
    if (tripTranSelected.length === 0) {
        return resetTripTranTable();
    }

    const totalCost = document.getElementById('totalCost')!;
    totalCost.textContent = "";
    // total = sum of all item.price in tripTranSelected
    const total = tripTranSelected.reduce((sum: number, item: any) => Number(sum) + Number(item.amount), 0);
    totalCost.textContent = `This trip cost is $${total.toFixed(2)}`;
    createTripTranTable(tripTranSelected);
}
const resetTripTranTable = () => {
    tripTranTable.innerHTML = "";
}
