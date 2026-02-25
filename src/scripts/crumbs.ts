import '.././scss/main.scss';

import './header';
import './quickLink';
import * as CommonUtil from './common';
import * as DataProvider from './db/dataProvider';

let
    //    userId: number,
    allTags: string[] = [],
    data: Array<CommonUtil.Crumb>,
    limit = 50,
    offset = 0;

window.onload = async () => {
    await CommonUtil.validateAuthentication();
    if (!CommonUtil.GlobalStore.userId) {
        DataProvider.redirectPage('/');
    }

    const userId = CommonUtil.GlobalStore.userId;
    await CommonUtil.loadComponents();
    await CommonUtil.loadComponent("main-placeholder", "components/crumbs.html");
    await CommonUtil.loadComponent('imgPopup-placeholder', 'components/popup/imagePopup.html');
    CommonUtil.baseOnLoad();

    initEventHandler();
    allTags = await DataProvider.getUserTags(userId);

    (document.querySelector('.short') as HTMLAnchorElement)!.href = window.location.href.replace('crumbs', 'compact');
    data = (await CommonUtil.getDataFromQueryString()).crumbs;
    await populateCrumbs();
}
const initEventHandler = () => {
    // tag related handler
    const searchTagInput = document.getElementById('searchTagInput') as HTMLInputElement;
    searchTagInput.addEventListener("input", () => {
        filterTag();
    })
    searchTagInput.addEventListener("click", () => {
        filterTag();
    })
    searchTagInput.addEventListener("keypress", (event: KeyboardEvent) => {
        searchCrumb(event);
    })

    const dtSearchDate = document.getElementById('dtSearchDate') as HTMLInputElement;
    dtSearchDate.addEventListener("change", () => {
        searchDateChanged();
    })

    document.getElementById('dtContainer')?.addEventListener("scroll", async (event: Event) => {
        const dtContainer = event.target as HTMLDivElement; //document.getElementById('dtContainer')!
        const { scrollTop, scrollHeight, clientHeight } = dtContainer;
        if (scrollTop + clientHeight + 1.0 >= scrollHeight) {
            await loadMore();
        }
    })
}
const populateCrumbs = async () => {
    await loadMore();
}
const loadMore = async () => {
    if (offset > data.length) {
        return;
    }
    const count = document.getElementById('count')! as HTMLAnchorElement;
    const dtContainer = document.getElementById('dtContainer')!
    const displayNum = offset + limit < data.length ? offset + limit : `${data.length}`;
    count.innerHTML = `${displayNum}/${data.length} returned`;

    for (let i = offset; i < Math.min(data.length, offset + limit); i++) {
        const row = data[i];
        dtContainer.append(await createCrumbElem(row));
    }
    offset += limit;
}
/**
 * Dynamically create crumb element for each crumb
 * 
 * @param {*} row 
 * @returns 
 */
const createCrumbElem = async (row: CommonUtil.Crumb) => {
    const rowId = Number(row.id);
    const crumb = document.createElement('div');
    crumb.id = `crumb${rowId}`;
    crumb.classList.add('crumbBlock');
    crumb.addEventListener("mouseover", () => {
        const r = document.getElementById(`r${crumb.id.substring(5)}`)!;
        r.classList = 'right';
    });
    crumb.addEventListener("mouseout", () => {
        const r = document.getElementById(`r${crumb.id.substring(5)}`)!;
        r.classList = 'hidden';
    });

    // title
    const title = CommonUtil.getTitle(row);

    let dispTagHtml = CommonUtil.getTag(row);
    // date
    const date = new Date(`${row.date}`);
    const formattedDate = CommonUtil.formatDateTimeLong(date);

    // right elements including pin, edit, del and showHide
    const pin = `<a class=${row.pin ? 'pin' : 'unpin'} id='btnPin${rowId}' onclick=window.togglePin(${rowId})></a>`;
    const edit = `<a class='edit' href='/pages/addeditcrumb.html?id=${rowId}'></a>`;
    const del = `<a class='delete' id='btnDel${rowId}' onclick=window.delCrumb(${rowId})></a>`;
    const showHide = `<a class='up' id='btnShowHide${rowId}' onclick=window.showHideBlock(${rowId})></a>`;
    const elemRight = `<div id='r${rowId}' class="hidden"> <span class='lbl-title'>${pin} ${edit} ${del}&nbsp;&nbsp;</span> ${showHide}</div>`;

    // description
    const imageLnk = await CommonUtil.populateImage(row, false);
    const urlImg = imageLnk === '' ? '' : `<div class="image-gallery">${imageLnk}</div>`;
    const safeDesc = CommonUtil.sanitizeHtml(row.description ?? '');
    const description = `<div>${safeDesc}</div>`;
    let elemDesc = `<div id=block${rowId} class='desc'>${urlImg}${description}</div>`;

    crumb.innerHTML = `<div class='title'><b>${title}</b> <span class='lbl-title'>${formattedDate}</span> ${dispTagHtml}${elemRight}</div>${elemDesc}`;

    return crumb;
}

/**
 * toggle crumb livel pin
 * 
 * @param {*} btnPinId 
 */
window.togglePin = async (id: number) => {
    const elemPin = document.getElementById(`btnPin${id}`)!;
    let pin = elemPin.classList.contains('pin') ? 1 : 0;
    elemPin.className = '';
    elemPin.classList.add(pin ? 'unpin' : 'pin');
    pin = pin ? 0 : 1;
    await DataProvider.updatePin(id, pin);
}

/**
 * delete the crumb
 * 
 * @param {*} id 
 */
window.delCrumb = async (id: number) => {
    await DataProvider.deleteCrumbById(id);
    const div = document.getElementById(`crumb${id}`)!;
    div.outerHTML = '';
}

/**
 * handle the top level show/hide all crumbs when no id present
 * handle single level show/hide of each crumb when id passed in
 * @param {*} id 
 */
window.showHideBlock = (id: number) => {
    CommonUtil.showHideBlock(id);
}

/**
 * show crumbs of the month of the selected date
 * @returns 
 */
const searchDateChanged = async () => {
    const dtSearchDate = document.getElementById('dtSearchDate')! as HTMLInputElement;
    DataProvider.redirectPage(`/pages/crumbs.html`, `d=${dtSearchDate.value}`);
}

const searchCrumb = async (event: KeyboardEvent) => {
    offset = 0;
    if (event.key === "Enter") {
        event.preventDefault();
        const searchTagDropdown = document.getElementById('searchTagDropdown')!;
        searchTagDropdown.style.display = 'none';
        const input = event.target as HTMLInputElement;
        const searchText = input.value.trim();
        DataProvider.redirectPage(`/pages/crumbs.html`, `s=${searchText}`);
    }
}
const gotoCrumbByTag = async (tag: string) => {
    DataProvider.redirectPage(`/pages/crumbs.html`, `tag=${tag}`);
}
/**
 * type in the input to show related tags
 */
const filterTag = async () => {

    const searchTagInput = document.getElementById('searchTagInput')! as HTMLInputElement;
    const searchTagDropdown = document.getElementById('searchTagDropdown')! as HTMLDivElement;

    await CommonUtil.filterDropdown(searchTagInput, searchTagDropdown, allTags, gotoCrumbByTag, 1);
}

// window.dataScrolled = async (event: UIEvent) => {
//     const dtContainer = event.target as HTMLDivElement; //document.getElementById('dtContainer')!
//     const { scrollTop, scrollHeight, clientHeight } = dtContainer;
//     console.log(`{left: ${scrollTop + clientHeight + 1.0}, right: ${scrollHeight}}`)
//     if (scrollTop + clientHeight + 1.0 >= scrollHeight) {
//         await loadMore();
//     }
// }
