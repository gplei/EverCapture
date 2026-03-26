import './header';
import './quickLink';
import * as DataProvider from './db/dataProvider.ts';
import * as CommonUtil from './common.ts';

let allTags:string[] = [];
const tagCrumb:Array<CommonUtil.CrumbByTag> = []; // array of {tagc, crumbs: []}
/**
 * This page displays all crumbs tagged by 'Uncategorized' by default, 
 * and second tag will be displayed by group.
 * 
 * If the item has more tags, it will be displayed under that tag category.
 * Some items have only one tag, and if that tag is displayed, the items will be 
 * listed under that category.
 */
window.onload = async () => {
    await CommonUtil.validateAuthentication();
    if (!CommonUtil.GlobalStore.userId) {
        DataProvider.redirectPage('/');
    }
    await CommonUtil.loadComponents();
    await CommonUtil.loadComponent('main-placeholder', 'components/compact.html');
    await CommonUtil.loadComponent('imgPopup-placeholder', 'components/popup/imagePopup.html');
    CommonUtil.baseOnLoad();

    allTags = await DataProvider.getUserTags(CommonUtil.GlobalStore.userId);

    initEventHandler();
    const l = document.querySelector('.long');
    if (l) {
        (l as HTMLAnchorElement).href = window.location.href.replace('compact', 'crumbs');
    }
    const crumbData = await CommonUtil.getDataFromQueryString();
    const dtContainer = document.getElementById('dtContainer')!;
    if (dtContainer.innerHTML === "") {
        if (CommonUtil.getQueryString('type') === 'image') {
            await displayImage(crumbData);
        } else {
            await populateCrumbsGroupByTag(crumbData);
        }
    }
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
}
/**
 * 
 * @param {*} searchTag 
 * 
 * get all crumbs by searchTag.  Display all crumbs under other tags associated with these crumbs.
 * One crumb may appear in different tags if the crumb has multiple tags other than the searchTag
 * 
 */
const populateCrumbsGroupByTag = async (crumbData:CommonUtil.CrumbByTag) => {
    const { crumbs, tagName } = crumbData;
    if (!crumbs) return;

    crumbs.forEach((item:CommonUtil.Crumb) => {
        if (item.tags?.length === 0) {
            item.tags = [CommonUtil.NO_TAG];
        }
        item.tags?.forEach(tag => {
            if (item.tags && item.tags.length === 1 || tag !== tagName) {
                let entry = tagCrumb.find(x => x.tagName === tag);
                if (!entry) {
                    entry = { tagName:tag, crumbs: [] };
                    tagCrumb.push(entry);
                }
                entry.crumbs?.push({ id: item.id, title: item.title, url: item.url, description: item.description });
            }
        });
    });

    const nShown = displayAllTag(tagCrumb);
    const count = document.getElementById('count')! as HTMLAnchorElement;
    count.innerHTML = `There are ${crumbs.length} crumbs returned (${nShown})`;
}
const displayAllTag = (tagCrumb:CommonUtil.CrumbByTag[]) => {
    let n = 0;
    const sortedTagCrumb = tagCrumb.sort((a, b) => b.crumbs.length - a.crumbs.length);
    sortedTagCrumb.forEach(crumb => {
        n += crumb.crumbs.length;
        displayTagCrumb(crumb.tagName, crumb.crumbs);
    })
    return n;
}
const displayTagCrumb = (tag:string | null, crumbs:CommonUtil.Crumb[]) => {
    let innerHTML = '';
    const tagCount = `<a class='category' href='/pages/compact.html?tag=${tag}'>${tag}</a><span class='lbl-title'> (${crumbs.length})</span>`;
    const toggleHideShow = `<a class='up' id='btnShowHide${tag}' onclick='showHideBlock("${tag}")'></a>`;
    const tagHeader = `<div class='title'>${tagCount}<div class='right'>${toggleHideShow}</div></div>`;
    let tagCrumbs = '';
    crumbs.forEach((r) => {
        const type = CommonUtil.getTypeLink(r);
        const tooltip = (tag === 'qLink' && r.description) ? ` title="${r.description}"` : '';
        const title = `<a class="pretty-anchor"${tooltip} href='/pages/crumb.html?id=${r.id}' >${r.title || '[no title]'}</a>`;
        tagCrumbs += `<div>${type}${title}</div>`;
    });
    innerHTML += `<div class='crumbBlock'>${tagHeader}<div id='block${tag}' class='crumbContainer'>${tagCrumbs}</div></div>`;
    const dtContainer = document.getElementById('dtContainer')!
    dtContainer.innerHTML += innerHTML;
}
const displayImage = async (allImages:CommonUtil.CrumbByTag) => {
    let i = 0;
    let imgs = '';
    for (const item of allImages.crumbs) {
        i++;
        const type = '';
        const img = await CommonUtil.populateImage(item, false);
        const count = document.getElementById('count')! as HTMLAnchorElement;
        count.innerHTML = `There are ${i} images returned`;
        imgs += `${img}${type}`;
    };
    const dtContainer = document.getElementById('dtContainer')!
    dtContainer.innerHTML = `<div class='image-gallery'>${imgs}</div>`;
}
const searchDateChanged = async () => {
    const dtSearchDate = document.getElementById('dtSearchDate')! as HTMLInputElement;
    DataProvider.redirectPage(`/pages/compact.html`, `d=${dtSearchDate.value}`);
}

const searchCrumb = async (event:KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
    const searchTagDropdown = document.getElementById('searchTagDropdown')! as HTMLDivElement;
        searchTagDropdown.style.display = 'none';
        const input = event.target as HTMLInputElement;
        const searchText = input.value.trim();
        DataProvider.redirectPage(`/pages/compact.html`, `s=${searchText}`);
    }
}
const gotoCrumbByTag = async (tag:string) => {
    DataProvider.redirectPage(`/pages/compact.html`, `tag=${tag}`);
}
const filterTag = async () => {
        const searchTagInput = document.getElementById('searchTagInput')! as HTMLInputElement;
    const searchTagDropdown = document.getElementById('searchTagDropdown')! as HTMLDivElement;

    await CommonUtil.filterDropdown(searchTagInput, searchTagDropdown, allTags, gotoCrumbByTag, 1);
}
// window.toggleTag = (tag:string) => {
//     const upDown = document.getElementById(tag)!;
//     const divTag = document.getElementById(`div${tag}`)!;
//     let currClass = upDown.className;
//     if (currClass === 'up') {
//         divTag.className = `hidden`;
//         upDown.className = 'down';
//     } else {
//         divTag.className = 'crumbContainer';
//         upDown.className = 'up';
//     }
// }

/**
 * handle the top level show/hide all crumbs when no id present
 * handle single level show/hide of each crumb when id passed in
 */
window.showHideBlock = (id:number) => {
    CommonUtil.showHideBlock(id);
}
