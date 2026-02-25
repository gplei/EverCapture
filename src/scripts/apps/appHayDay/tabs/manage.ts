import * as DataProvider from '../../../db/dataProvider';
import * as CommonUtil from '../../../common';

interface Building {
    id: number;
    name: string;
    level?: number;
    type?: string
}
interface Product {
    id: number;
    name: string;
    minute?: number;
    level?: number;
    building_id?: number;
    barn_product_ratio?: number;
}
interface Ingredient {
    ingredient_id: number;
    name: string;
    count: number;
}
let allBuilding: Building[];
let allProduct: Product[];
// let selectedType: string, selectedBuilding: string, selectedProduct: string;
export const initManage = async function () {
    await initEventHandler();
    await refreshAllBuilding()
    await refreshAllProduct();
    await refreshType();
};
const refreshAllBuilding = async () => {
    allBuilding = await DataProvider.fetchData('allBuildings');
}
const refreshAllProduct = async () => {
    allProduct = await DataProvider.fetchData('products');
    const selAddIngredient = document.getElementById('selAddIngredient')! as HTMLSelectElement;
    CommonUtil.populateSelect(selAddIngredient, CommonUtil.mapObjectToOption(allProduct as any [], 'id', 'name'));
    DataProvider.showMessage(`${allProduct.length} ingredient products`, 'ingredientNum');
}
const refreshType = async () => {
    const selType = document.getElementById('selType') as HTMLSelectElement;
    const type = ['Product Machine', 'Field', 'Land', 'Animal House', 'Tool Machine', 'Kit'];
    CommonUtil.populateSelect(selType, CommonUtil.mapArrayToOption(type));
    selType.value = type[0];
    selType.dispatchEvent(new Event('change', { bubbles: true }));
}
/**
 * refresh a select option is to reload and set default if provided
 * then dispatch event
 */
const initEventHandler = async () => {
    const selType = document.getElementById('selType') as HTMLSelectElement;
    selType.addEventListener("change", async () => {
        refreshBuilding();
    })
    const selBuilding = document.getElementById('selBuilding') as HTMLSelectElement;
    const newBuildingName = document.getElementById('newBuildingName')! as HTMLInputElement;
    const buildingLevel = document.getElementById('buildingLevel')! as HTMLInputElement;
    selBuilding.addEventListener("change", async () => {
        const build = findBuilding(selBuilding.selectedOptions[0].textContent ?? "");
        newBuildingName.value = build?.name ?? "";
        buildingLevel.value = build?.level?.toString() ?? "";
        await refreshProduct();
    })
    const selProduct = document.getElementById('selProduct') as HTMLSelectElement;
    const newProductName = document.getElementById('newProductName') as HTMLInputElement;
    const productLevel = document.getElementById('productLevel') as HTMLInputElement;
    const productTime = document.getElementById('productTime') as HTMLInputElement;
    const barnRatio = document.getElementById('barnRatio') as HTMLInputElement;
    const refreshFormatMinute = () => {
        //      document.getElementById('formatedMinute')!.textContent = formatMinutes(prod?.minute ? prod?.minute : 0)
        document.getElementById('formatedMinute')!.textContent = formatMinutes(Number(productTime.value)
        );
    }
    selProduct.addEventListener("change", async () => {
        const prod = findProduct(selProduct.selectedOptions[0].textContent ?? "");
        newProductName.value = prod?.name ?? "";
        productLevel.value = prod?.level?.toString() ?? "";
        productTime.value = prod?.minute?.toString() ?? "";
        barnRatio.value = prod?.barn_product_ratio?.toString() ?? "";
        refreshFormatMinute();
        await refreshProductIngredients();
    })
    document.getElementById('btnAddUpdateBuilding')?.addEventListener("click", async () => {
        if (selType.value === "") {
            DataProvider.showMessage("Select a valid type");
            return;
        }
        let id = selBuilding.value;
        if (newBuildingName.value === "") {
            DataProvider.showMessage("Provide building name");
            return;
        }
        const building: Building = {
            id: Number(id),
            type: selType.value,
            name: newBuildingName.value,
            level: Number(buildingLevel.value)
        };
        if (id === "") { // add
            // check if building exist
            if (Array.from(selBuilding.options).some(option => option.textContent === newBuildingName.value)) {
                DataProvider.showMessage(`Building '${newBuildingName.value}' already exist"`);
                return;
            }
            const result = await DataProvider.fetchData('buildings', 'POST', building);
            id = result.insertId;
            // newBuildingName.value = "";
            // buildingLevel.value = "";
        } else { // update
            await DataProvider.fetchData(`buildings/${id}`, 'PUT', building);
        }
        await refreshAllBuilding();
        await refreshBuilding(id);
    })
    document.getElementById('btnDelBuilding')?.addEventListener("click", async () => {
        if (selBuilding.value === "") {
            DataProvider.showMessage("No building is selcted");
            return;
        }
        const ok = confirm("Are you sure you want to delete the building?");
        if (!ok) { return; }

        await DataProvider.fetchData(`buildings/${selBuilding.value}`, 'DELETE');
        await refreshBuilding();
    })
    document.getElementById('btnAddUpdProd')?.addEventListener("click", async () => {
        if (selBuilding.value === "") {
            DataProvider.showMessage("Select a valid building");
            return;
        }

        let id = selProduct.value;
        if (newProductName.value === "") {
            DataProvider.showMessage("Provide product name");
            return;
        }
        const product: Product = {
            id: Number(id),
            name: newProductName.value,
            minute: Number(productTime.value),
            level: Number(productLevel.value),
            building_id: Number(selBuilding.value),
            barn_product_ratio: Number(barnRatio.value)
        }
        if (id === "") {
            if (Array.from(selProduct.options).some(option => option.textContent === newProductName.value)) {
                DataProvider.showMessage(`Building '${newProductName.value}' already exist"`);
                return;
            }
            const result = await DataProvider.fetchData('products', 'POST', product);
            id = result.insertId;
            // newProductName.value = "";
            // productTime.value = "";
            // productLevel.value = "";
        } else {
            await DataProvider.fetchData(`products/${id}`, 'PUT', product);
            refreshFormatMinute();
        }
        await refreshAllProduct();
        await refreshProduct(id);
    })
    const selAddIngredient = document.getElementById('selAddIngredient') as HTMLSelectElement
    const buildingName = document.getElementById('buildingName') as HTMLInputElement;
    const ingrdngCount = document.getElementById('ingrdngCount') as HTMLInputElement;

    
    selAddIngredient?.addEventListener("change", async () => {
        buildingName.value = (selAddIngredient.selectedOptions[0] as any)['buildingName'];

    })

    document.getElementById('btnAddUpdIngrdnt')?.addEventListener("click", async () => {
        await addIngredients();
    })
    async function addIngredients() {
        if (selProduct.value == "" || selAddIngredient.value == "") {
            DataProvider.showMessage("Please select a product and count");
            return;
        }

        await DataProvider.fetchData('ingredients', 'POST', {
            product_id: selProduct.value,
            ingredient: selAddIngredient.value,
            count: ingrdngCount.value
        });

        // clean up input
        selAddIngredient.selectedIndex = 0;
        ingrdngCount.value = "";
        await refreshProductIngredients();
    }
    document.getElementById('btnDelProd')?.addEventListener("click", async () => {
        if (selProduct.value == "") {
            DataProvider.showMessage('No product is selected');
            return;
        }
        const ok = confirm("Are you sure you want to delete the product and its ingredients?");
        if (!ok) { return; }

        await DataProvider.fetchData(`productIngredents/${selProduct.value}`, 'DELETE');
        await DataProvider.fetchData(`products/${selProduct.value}`, 'DELETE');

        await refreshProduct();
        //     if (selProduct.selectedOptions[0].value != "Kit") {
        //         refreshProductIngredients()
        //         DataProvider.showMessage(`${selAddIngredient.options.length - 1} ingredient product`, 'ingredientNum');
        //     }
        //     await refreshProduct();
        // }
    })

    document.getElementById('btnChngeProdBld')?.addEventListener("click", async () => {
        const selectedProductId = selAddIngredient.value;
        const buildingId = selBuilding.value;
        buildingName.value = newBuildingName.value;

        if (selectedProductId !== "" && buildingId !== "") {
            await DataProvider.fetchData(`productBuilding/${selectedProductId}`, 'PUT', { buildingId });
        }
        await refreshBuilding();
    })
    document.getElementById('btnDelIngrdnt')?.addEventListener("click", async () => {
        const ingredientId = selAddIngredient.value;
        if (ingredientId) {
            await DataProvider.fetchData(`ingredients/${ingredientId}`, 'DELETE');
        }
        await refreshProductIngredients();
    })
    const refreshBuilding = async (buildingName?: string) => {
        const selType = document.getElementById('selType') as HTMLInputElement;
        const selBuilding = document.getElementById('selBuilding') as HTMLSelectElement;
        if (selType.value === "") {
            CommonUtil.clearOption(selBuilding);
            selBuilding.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }
        const data = await DataProvider.fetchData(`buildings/${selType.value}`);
        DataProvider.showMessage(`${data.length} buildings`, 'buildingNum');
        CommonUtil.populateSelect(selBuilding, CommonUtil.mapObjectToOption(data, 'id', 'name'));
        if (buildingName) {
            selBuilding.value = buildingName;
        }
        selBuilding.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const refreshProduct = async (prodName?: string) => {
        // const selBuilding = document.getElementById('selBuilding') as HTMLSelectElement;
        // const selProduct = document.getElementById('selProduct') as HTMLSelectElement;
        if (selBuilding.value === "") {
            CommonUtil.clearOption(selProduct);
            selProduct.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }
        const data = await DataProvider.fetchData(`buildingProducts/${selBuilding.value}`);
        DataProvider.showMessage(`${data.length} products`, 'productNum');
        CommonUtil.populateSelect(selProduct, CommonUtil.mapObjectToOption(data, 'id', 'name'));
        if (prodName) {
            selProduct.value = prodName;
        }
        selProduct.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const refreshProductIngredients = async () => {
        const divIngrdnt = document.getElementById('divIngrdnt') as HTMLDivElement;
        divIngrdnt.innerHTML = "";
        if (selProduct.value === "") {
            return;
        }
        const ingredients = await DataProvider.fetchData(`products/${selProduct.value}/ingredients`);
        ingredients.forEach((ingredient: Ingredient) => {
            const tag = document.createElement("span");
            tag.className = "tag";
            const a = `<a href="#" id='ingrdnt${ingredient.ingredient_id}'>×</a>`
            tag.innerHTML = `${ingredient.name}(${ingredient.count}) ${a}`;
            divIngrdnt.appendChild(tag);

        });
        divIngrdnt.querySelectorAll<HTMLAnchorElement>("a")!.forEach(a => {
            a.addEventListener("click", async (e: MouseEvent) => {
                e.preventDefault();
                const ingdnt = e?.target as HTMLAnchorElement;
                const ingredientId = ingdnt.id.slice(7);
                await DataProvider.fetchData(`ingredients/${ingredientId}`, 'DELETE');
                await refreshProductIngredients();
            });
        });
    }
    const findBuilding = (bldName: string): Building | undefined => {
        return allBuilding.find(b => b.name === bldName);
    }
    const findProduct = (prodName: string): Product | undefined => {
        return allProduct.find(b => b.name === prodName);
    }
}
// to ? day ? hour ? minute
function formatMinutes(totalMinutes: number): string {
    const days = Math.floor(totalMinutes / 1440);        // 1440 = 24*60
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    const parts = [];

    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

    return parts.join(' ');
}
