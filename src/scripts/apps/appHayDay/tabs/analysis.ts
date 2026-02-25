import * as DataProvider from "../../../db/dataProvider";
import * as CommonUtil from '../../../common';

export const initAnalysis = async function () {
    initCapacity();

    document.getElementById('formExchange')?.addEventListener("submit", (event) => {
        event.preventDefault();
        const raIn = Number((document.getElementById('ratioIn')! as HTMLInputElement).value);
        const raOut = Number((document.getElementById('ratioOut')! as HTMLInputElement).value);
        let reIn = Number((document.getElementById('resultIn')! as HTMLInputElement).value);
        let reOut = Number((document.getElementById('resultOut')! as HTMLInputElement).value);

        if (raIn === 0 || raOut === 0) {
            alert('specify ratio');
        } else {
            if (reIn) {
                reOut = reIn * raOut / raIn;
                (document.getElementById('resultOut')! as HTMLInputElement).value = reOut.toString();
                return;
            }
            if (reOut) {
                reIn = reOut * raIn / raOut;
                (document.getElementById('resultIn')! as HTMLInputElement).value = reIn.toString();
                return;
            }
        }
        DataProvider.showMessage("Specify one of in or out result");
    })

    // exchange

    document.getElementById('ratioOut')?.addEventListener("input", (event: Event) => {
        const raOut = event.target as HTMLInputElement;
        const divExchangeProducts = document.getElementById("divExchangeProducts") as HTMLDivElement;
        divExchangeProducts.innerHTML = "";

        if (raOut.value === "0") {
            // divExchangeProducts.innerHTML = prodductByExchangeRate[0].products.map(p=>(`<span>${p}</span>: <image src='/upload_media/apps/hayday/${p}/>`)).join('');
            prodductByExchangeRate[0].products.forEach((p: string) => {
                divExchangeProducts.innerHTML += `<image src='/upload_media/apps/hayday/${p}.webp' width="50" title=${p}/>`;
            })
        } else if (raOut.value === "1") {
            prodductByExchangeRate[1].products.forEach((p: string) => {
                divExchangeProducts.innerHTML += `<image src='/upload_media/apps/hayday/products/${p}.png' width="50" title=${p}/>`;
            })
        }
    })

    const allProduct = await DataProvider.fetchData('products');
    const selProduct = document.getElementById('selProduct')! as HTMLSelectElement;
    CommonUtil.populateSelect(selProduct, CommonUtil.mapObjectToOption(allProduct as any[], 'id', 'name'));
    selProduct?.addEventListener("change", () => {
        const prodName = selProduct.selectedOptions[0].textContent ?? "";
        const product = allProduct.find((b: { name: string; }) => (b.name === prodName));
        const ratioOut = document.getElementById('ratioOut')! as HTMLInputElement;
        ratioOut.value = product.barn_product_ratio;
        (document.getElementById("selectedProduct")! as HTMLSpanElement).textContent = ` : ${prodName}`;
    })
};
const targetCap = 10000;
function initCapacity() {
    const initSel = (sel: HTMLSelectElement) => {
        let inc = 25;
        for (let i = 50; i <= targetCap; i += inc) {
            const opt = document.createElement('option');
            opt.value = i.toString();
            opt.textContent = i.toString();
            sel.appendChild(opt);
            if (i >= 1000) { inc = 50; }
        }
    }
    const capacitySelect = document.getElementById('capacitySelect') as HTMLSelectElement;
    const fromCapacitySelect = document.getElementById('fromCapacitySelect') as HTMLSelectElement;
    const toCapacitySelect = document.getElementById('toCapacitySelect') as HTMLSelectElement;
    const totalKitNum = document.getElementById('totalKitNum') as HTMLLabelElement;
    const kitNum = document.getElementById('kitNum') as HTMLLabelElement;
    const fromKit = document.getElementById('fromKit') as HTMLInputElement;

    // Add an event listener for the 'change' event
    fromKit.addEventListener('change', function (event) {
        totalKitNum.textContent = (event.target as HTMLInputElement).value;
    });
    initSel(capacitySelect);
    initSel(fromCapacitySelect);
    fromCapacitySelect.value = '50';
    initSel(toCapacitySelect);

    fromCapacitySelect.addEventListener("change", () => {
        const fromKitNum = parseInt(fromCapacitySelect.value, 10);
        const inc = fromKitNum < 1000 ? 25 : 50;
        let totalKit = 0;
        for (let i = fromKitNum; i <= targetCap; i += inc) {
            totalKit += i <= 1000 ? (i) / 25 - 2 : i / 50 + 18;
        }
        totalKitNum.textContent = totalKit.toString();
    })

    toCapacitySelect.addEventListener("change", () => {
        const fromKitNum = parseInt(fromCapacitySelect.value, 10);
        const toKitNum = parseInt(toCapacitySelect.value, 10);
        const inc = fromKitNum < 1000 ? 25 : 50;
        let totalKit = 0;
        for (let i = fromKitNum; i <= toKitNum; i += inc) {
            totalKit += i <= 1000 ? (i) / 25 - 2 : i / 50 + 18;
        }
        totalKitNum.textContent = totalKit.toString();
    })

    capacitySelect.addEventListener("change", () => {
        const cap = parseInt(capacitySelect.value, 10);
        kitNum.textContent = (cap <= 1000 ? (cap) / 25 - 2 : cap / 50 + 18).toString();
    })
}
interface ProductByExchangeRatio {
    ratio: number;
    products: Array<string>;
}
const prodductByExchangeRate: ProductByExchangeRatio[] = [
    {
        ratio: 1,
        products: ["Candle_Maker", "Pillow", "Blanket", "Mushroom_Pasta"
            , "Birthday_Bouquet", "Bright_Bouquet", "Candle_Maker", "Candy_Bouquet", "Gracious_Bouquet", "Mushroom_Pasta", "Rustic_Bouquet", "Soft_Bouquet", "Veggie_Bouquet",

        ]
    },
    {
        ratio: 2,
        products: ["image_3", "image_4", "image_5"]
    }
]