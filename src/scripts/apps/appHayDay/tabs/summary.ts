import $ from "jquery";
import * as DataProvider from '../../../db/dataProvider.js';
import * as AppCommonTable from '../../appCommon/commonTable.js';
// import { showMessage } from "./manage.js";
// import { requests } from "../request";

export const initSummary = function () {
    const requestSelect = document.getElementById('requestSelect') as HTMLSelectElement;
    const btnShowSummary = document.getElementById('btnShowSummary') as HTMLButtonElement;

    requests.forEach(req => {
        const option = document.createElement('option');
        option.value = req.name;
        option.textContent = req.name;
        requestSelect.appendChild(option);
    });

    requestSelect.addEventListener("change", () => {
        // Use the CSS attribute selector to find all elements with ID starting with 'param'
        const elements = document.querySelectorAll('[id^="param"]');

        // Remove each found element from the DOM
        elements.forEach(element => element.remove());
        btnShowSummary.classList.add('hidden');
        const req = requests.find(req => req.name === requestSelect.value);
        if (req !== undefined && req !== null) {
            if (!req.params) {
                loadTable(req.sql);
            } else {
                let i = 1;
                req.params.forEach(p => {
                    const inputBox = document.createElement('input');
                    inputBox.id = `param${i}`;
                    inputBox.type = 'text';
                    inputBox.placeholder = `Input ${p}`;
                    requestSelect.insertAdjacentElement('afterend', inputBox);
                });

                btnShowSummary.classList.remove('hidden');
            }
        }
        const dtContainer = document.getElementById('dtContainer')!;
        dtContainer.innerHTML = "";
    })
    btnShowSummary.addEventListener("click", () => {
        const req = requests.find(req => req.name === requestSelect.value);
        let i = 1;
        let sql;
        if (req && req.params) {
            const param = $(`#param${i++}`)[0] as HTMLInputElement;
            sql = formatString(req.sql, param.value);
        }


        loadTable(sql);
    })
}

function formatString(template: string, ...params: string[]) {
    return template.replace(/{}/g, () => params.shift() ?? "");
}

async function loadTable(sql?: string) {
    if (!sql) return;

    const data = await DataProvider.getSqlResult(sql);
    if (data.error) {
        DataProvider.showMessage(data.message);
        return;
    }
    (document.getElementById("count")! as HTMLSpanElement).textContent = `Total count: ${data.length}`

    const dtContainer = document.getElementById('dtContainer')!;
    dtContainer.innerHTML = "";
    dtContainer.append(AppCommonTable.createTable(data));
}

const db='hayday';
const requests = [
    {
        name: 'Buildings by level',
        sql: `
      select * from ${db}.buildings order by level
    `
    },
    {
        name: 'Buildings by type',
        sql: `
      select * from ${db}.buildings order by type
      `
    },
    {
        name: 'Products',
        sql: `
      select * from ${db}.products order by level
    `
    },
    {
        name: 'Product ingredient counts',
        sql: `
      select 
        b.name as 'Building Name', 
        p.name as 'Product Name', 
        count(*) as 'Ingredient Type'
      from ${db}.buildings b, ${db}.products p, ${db}.ingredients o, ${db}.products i
      where b.id=p.building_id and p.id=o.product_id and ingredient_id = i.id
      group by b.name, p.name
      order by b.name, p.name
  `
    },
    {
        name: 'Buildings, products and ingredients',
        sql: `
      select 
        b.name as 'Building Name', 
        p.name as 'Product Name', 
        i.name as 'Ingredient Name', 
        o.count as 'Ingredient Count' 
      from ${db}.buildings b, ${db}.products p, ${db}.ingredients o, ${db}.products i
      where b.id=p.building_id and p.id=o.product_id and ingredient_id = i.id
      order by b.name, p.name, i.name
    `,
    },
    {
        name: 'Find the building from a given product',
        sql: `
      select 
        b.name as 'Building Name',
        p.name as 'Product Name'
      from ${db}.buildings b, ${db}.products p
      where p.building_id=b.id and p.name= '{}'
    `,
        params: ['product name']
    },
    {
        name: 'Product that has no ingredient',
        sql: `
      select b.type, b.name as 'Building Name', p.name as 'Product Name' 
      from ${db}.buildings b, ${db}.products p
      left join ${db}.ingredients pi on p.id=pi.product_id
      left join ${db}.products i on i.id=pi.ingredient_id
      where b.id=p.building_id and i.name is null
    `
    },
    {
        name: 'Buildings don’t have prodcuts',
        sql: `
      select b.name as 'Building Name' from ${db}.buildings b
      left join ${db}.products p on p.building_id =b.id
      where p.name is null
    `
    },
    {
        name: 'Products has a certain ingredient',
        sql: `
      select p.name as 'Product Name', i.name as 'Ingredient Name', pi.count 
      from ${db}.products p, ${db}.ingredients pi, ${db}.products i
      where p.id=pi.product_id and pi.ingredient_id=i.id
      and i.name='{}'
    `,
        params: ['Ingredient name']
    },
    {
        name: 'Buildings of given type',
        sql: `
      select p.name, p.level
      from ${db}.buildings b, ${db}.products p
      where b.id=p.building_id and b.type={}} order by p.level
    `,
        params: ['Building type']
    },
    {
        name: 'building machine count',
        sql: `
      select b.name, count(*) 
      from ${db}.buildings b, ${db}.products p 
      where b.id=p.building_id and b.type='product machine' 
      group by b.name
      order by b.level
    `
    },
    {
        name: 'type building count',
        sql: `
      select b.type, b.name, count(*)
      from ${db}.buildings b, ${db}.products p 
      where b.id=p.building_id 
      group by b.type, b.name
      order by b.type, b.level;
    `
    }
];

