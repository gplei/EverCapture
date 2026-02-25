import '.././scss/main.scss';

import * as DataProvider from "./db/dataProvider";
// import initHeader from './header.ts';
// import initSidePannel from './quickLink';

export interface OptionData {
    value: string;
    textContent: string;
}
export interface OptionDataNode extends OptionData {
    children?: OptionDataNode[];
}
export interface Crumb {
    id: number;
    title: string;
    date?: string;
    url?: string;
    description?: string;
    color?: string;
    tags?: string[];
    deleted?: boolean;
    pin?: boolean;
}
export interface CrumbByTag {
    tagName: string | null;
    crumbs: Array<Crumb>;
}
export interface CrumbImage {
    id: string | number;
    media_url: string;
}
export interface CrumbImageResult {
    media_dir: string;
    imgUrls: CrumbImage[];
}

/**
 * Start code
 */
export const InitRegistry = {
    initSidePanel: () => { },  // default empty function
    initHeader: () => { }
};

export const GlobalStore = {
    userId: 0,
};
export const NO_TAG = "--- no tag ---";
export const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
});

// Extend window to include those dynamically created inline event handler
declare global {
    interface Window {
        // addEditCrumb.ts
        deleteCrumbImage?: (id: number) => Promise<void>;
        removeTag: (tag: string) => Promise<void>;
        updateTag: (oldName: string) => Promise<void>;

        // compact.ts
        showHideBlock: (id: number) => void;

        // crumbs.ts
        togglePin: (id: number) => void;
        delCrumb: (id: number) => void;
    }
}
export const compRoot = '';
export const loadComponent = async (containerId: string, url: string, init?: () => void): Promise<void> => {
    try {
        const response = await fetch(`${compRoot}/${url}`);
        const html = await response.text();

        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = html;

        if (init) {
            init();
        }

        // scrips embeded in html needs to be executed
        const scripts = container.querySelectorAll<HTMLScriptElement>("script");
        for (const script of scripts) {
            await new Promise<void>((resolve) => {
                const newScript = document.createElement("script");
                newScript.textContent = script.textContent; // Copy inline script content
                Array.from(script.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value); // Copy script attributes
                });
                document.body.appendChild(newScript);
                document.body.removeChild(newScript);
                resolve();
            });
        }
    } catch (err) {
        console.error("Error loading component:", containerId, url, err);
    }
}

export const loadComponents = async (): Promise<void> => {
    await loadComponent(
        "userPage-placeholder",
        `src/Components/common/${GlobalStore.userId ? "member" : "user"}.html`
    );
    await loadComponent("header-placeholder", `src/Components/common/header.html`, InitRegistry.initHeader);
    await loadComponent("footer-placeholder", `src/Components/common/footer.html`);
    if (GlobalStore.userId) {
        await loadComponent("quick-link-placeholder", `src/Components/common/side.html`, InitRegistry.initSidePanel);
    }
};

export const baseOnLoad = (): void => {
    const bodyElem = document.querySelector<HTMLElement>(".body");
    if (bodyElem) bodyElem.style.display = isMobileDevice() ? "block" : "flex";

    const htmlBody = document.querySelector<HTMLElement>("body");
    if (htmlBody) htmlBody.style.margin = isMobileDevice() ? "0px" : "10px";
};

export const validateAuthentication = async (): Promise<void> => {
    const authUser = await DataProvider.getAuthUser();
    GlobalStore.userId = Number(authUser?.userId ?? 0);
};

export const getDataFromQueryString = async (): Promise<CrumbByTag> => {
    if (!GlobalStore.userId) return { tagName: NO_TAG, crumbs: [] };

    const id = Number(getQueryString("id") ?? 0);
    const del = getQueryString("del");
    const search = getQueryString("s");
    const date = getQueryString("d");
    const type = getQueryString("type"); // 'image'
    const tagName = getQueryString("tag"); // null means all crumbs

    const userId = Number(GlobalStore.userId ?? 0);
    let crumbs: Crumb[] = [];
    if (id) {
        crumbs = await DataProvider.getCrumbById(id);
    } else if (del) {
        crumbs = await DataProvider.getDeletedCrumb(userId);
    } else if (search) {
        crumbs = await DataProvider.getSearchCrumb(search);
    } else if (date) {
        crumbs = await DataProvider.getCrumbByDate(userId, date);
    } else if (type === "image") {
        crumbs = await DataProvider.getImageCrumbTag(userId);
    } else {
        if (tagName === null) {
            crumbs = await DataProvider.getAllCrumb(userId);
        } else if (tagName === NO_TAG) {
            crumbs = await DataProvider.getCrumbNoTag(userId);
        } else {
            crumbs = await DataProvider.getCrumbByTag(userId, tagName);
        }
    }
    return { tagName, crumbs };
};

export const getQueryString = (name: string): string | null => {
    const queryString = window.location.search;
    const params = new URLSearchParams(queryString);
    return params.get(name);
};

export const formatDateTime = (dateTime: Date): string => {
    return `${dateTime.getFullYear()}-${String(dateTime.getMonth() + 1).padStart(2, "0")}-${String(
        dateTime.getDate()
    ).padStart(2, "0")}`;
};

export const formatDateTimeLong = (dateTime: Date): string => {
    return dateTime.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

export const formateDateToSave = (dateTime: Date): string => {
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, "0");
    const day = String(dateTime.getDate()).padStart(2, "0");
    const hours = String(dateTime.getHours()).padStart(2, "0");
    const minutes = String(dateTime.getMinutes()).padStart(2, "0");
    const seconds = String(dateTime.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * as user type search tag in the input control, the filtered dropdown containding the string shows
 * click a to select a tag will call the  'f'
 * 
 * @param {*} tagInput 
 * @param {*} dropdown 
 * @param {*} allTags 
 * @param {*} f 
 * @param {*} bAsync 
 */

export const filterDropdown = async (
    tagInput: HTMLInputElement,
    dropdown: HTMLDivElement,
    allTags: string[],
    f: (item: string) => Promise<void>,
    adjust = 0
): Promise<string[] | undefined> => {
    if (adjust) {
        // adjust dropdown position
        const inputRect = tagInput.getBoundingClientRect();
        dropdown.style.top = `${inputRect.bottom + window.scrollY}px`;
        dropdown.style.left = `${inputRect.left + window.scrollX}px`;
        dropdown.style.width = `${inputRect.width}px`;
    }

    const query = tagInput.value.toLowerCase();
    dropdown.innerHTML = ''; // Clear previous results

    if (query || query === '') {
        const filteredTags = allTags.filter(item => item.toLowerCase().includes(query));
        filteredTags.unshift('--- no tag ---');

        if (filteredTags.length) {
            dropdown.style.display = 'block';
            filteredTags.forEach(item => {
                const div = document.createElement('div');
                div.textContent = item;
                div.addEventListener('click', async () => {
                    tagInput.value = item;
                    dropdown.style.display = 'none';
                    await f(item);
                });
                dropdown.appendChild(div);
            });
            return filteredTags;
        } else {
            dropdown.style.display = 'none';
        }
    } else {
        dropdown.style.display = 'none';
    }
};

// Hide dropdown
export const hideDropdown = (tagInput: HTMLElement, dropdown: HTMLElement) => {
    document.addEventListener('click', (event: MouseEvent) => {
        const target = event.target as Node;
        if (!tagInput.contains(target) && !dropdown.contains(target)) {
            dropdown.style.display = 'none';
        }
    });
};

export const isUrlImage = (url?: string): boolean => {
    if (!url) return false;

    url = url.toLowerCase();
    return url.includes('jpg') || url.includes('png') || url.includes('gif');
};

export const escapeHtml = (value: string): string => {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export const sanitizeUrl = (url?: string): string => {
    if (!url) return '';
    const trimmed = url.trim();
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:')) return '#';
    return trimmed;
}

export const sanitizeHtml = (dirty: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(dirty || '', 'text/html');
    const blocked = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'];
    blocked.forEach(tag => doc.querySelectorAll(tag).forEach(node => node.remove()));

    doc.querySelectorAll('*').forEach((el) => {
        const attrs = [...el.attributes];
        attrs.forEach((attr) => {
            const name = attr.name.toLowerCase();
            const value = attr.value.trim();
            if (name.startsWith('on')) {
                el.removeAttribute(attr.name);
                return;
            }
            if (name === 'style') {
                el.removeAttribute(attr.name);
                return;
            }
            if ((name === 'href' || name === 'src') && /^javascript:|^data:/i.test(value)) {
                el.removeAttribute(attr.name);
            }
        });
    });

    return doc.body.innerHTML;
}

const sanitizeColor = (color?: string): string => {
    if (!color) return '';
    const c = color.trim();
    return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : '';
}

export const getTypeLink = (row: Crumb): string => {
    const url = row.url;
    const type = url ? (isUrlImage(url) ? 'Image' : 'Bookmark') : 'Note';
    const href = type === 'Note' ? `crumb.html?id=${row.id}` : sanitizeUrl(url);
    return `<a class='${type}' href='${href}' target='_blank'></a>`;
};

export const getTitle = (row: Crumb): string => {
    const lnkType = getTypeLink(row);
    const color = sanitizeColor(row.color);
    const titleStyle = color ? `style="color:${color}" class="lnk-title"` : `class="lnk-title"`;
    return `${lnkType}<a ${titleStyle} href='crumb.html?id=${row.id}'>${escapeHtml(row.title)}</a>`;
};

export const getTag = (row: Crumb): string => {
    let dispTagHtml = `<span id='tag${row.id}'>`;
    row.tags?.forEach(item => {
        const safeTag = escapeHtml(item);
        const qTag = encodeURIComponent(item);
        dispTagHtml += ` <a class='lnk-tag' href='/pages/crumbs.html?tag=${qTag}'>#${safeTag}</a>`;
    });
    dispTagHtml += '</span>';
    return dispTagHtml;
};

// Show uploaded images/videos
export const getUrlImage = (row: Crumb, showPopup: boolean, currImg: number): string => {
    const imgPopup = showPopup ? ` onclick="openPopup(${currImg})"` : '';
    const safeUrl = sanitizeUrl(row.url);
    return isUrlImage(safeUrl) ? `<img id='${row.id}' src='${safeUrl}' ${imgPopup}>` : '';
};
let currImg = 0;

export const populateImage = async (
    crumb: Crumb,
    resetImgCnt: boolean
): Promise<string> => {
    if (resetImgCnt) currImg = 0;
    const showDel = resetImgCnt;

    // show url image
    let imgPopup = `onclick="openPopup(${currImg})"`;
    const safeCrumbUrl = sanitizeUrl(crumb.url);
    let img = safeCrumbUrl && isUrlImage(safeCrumbUrl) ? `<img id='${crumb.id}' src='${safeCrumbUrl}' ${imgPopup}>` : '';

    currImg += img === '' ? 0 : 1;

    const results: CrumbImageResult = await DataProvider.getCrumbImage(crumb.id);
    const media_dir = results.media_dir;
    const imageUrls = results.imgUrls;

    if (imageUrls.length > 0) {
        imageUrls.forEach((crumbImage: CrumbImage) => {
            imgPopup = ` onclick="openPopup(${currImg})"`;
            const del = showDel
                ? `<button id='del${crumbImage.id}' class="delete-button" onclick='deleteCrumbImage(${crumbImage.id})'>Delete</button>`
                : '';

            // const imgUrl = `/${media_dir}/${crumbImage.media_url}`;
            const imgUrl = sanitizeUrl(`${DataProvider.mediaHost}/${media_dir}/${crumbImage.media_url}`);
            img += crumbImage.media_url.toUpperCase().includes('MOV')
                ? `<div class="image-wrapper">
                    <video id='${crumb.id}-${crumbImage.id}' width="320" ${imgPopup} controls>
                        <source src="${imgUrl}" type="video/mp4">
                    </video>${del}
                  </div>`
                : `<div class="image-wrapper">
                    <img id='${crumb.id}-${crumbImage.id}' src='${imgUrl}' ${imgPopup}>
                    ${del}
                  </div>`;

            currImg++;
        });
    }

    return img;
};

export const deleteCrumbImage = async (
    imageId: number,
    crumb: Crumb,
    imageContainer: HTMLElement
): Promise<void> => {
    await DataProvider.deleteCrumbImage(imageId);
    imageContainer.innerHTML = await populateImage(crumb, true);
};

// Toggle show/hide block(s)
export const showHideBlock = (
    blockId?: number,
    btnShowHideId = 'btnShowHide',
    blockPrefix = 'block'
): void => {
    const toggleShowHide = (
        lnk: HTMLElement | null,
        block: HTMLElement | null,
        bHide?: boolean
    ): boolean => {
        if (!lnk) return false;

        if (bHide || (bHide === undefined && lnk.classList.contains('up'))) {
            // hide
            if (block) block.style.display = 'none';
            lnk.classList.remove('up');
            lnk.classList.add('down');
            return true;
        } else {
            // show
            if (block) block.style.display = '';
            lnk.classList.remove('down');
            lnk.classList.add('up');
            return false;
        }
    };

    let lnk: HTMLElement | null, block: HTMLElement | null;
    if (blockId) {
        // individual crumb
        lnk = document.getElementById(`btnShowHide${blockId}`);
        block = document.getElementById(`block${blockId}`);
        toggleShowHide(lnk, block);
    } else {
        // show/hide all desc
        lnk = document.getElementById(btnShowHideId);
        const bHide = toggleShowHide(lnk, null); // no description

        // Select all elements whose ID starts with 'block'
        const elemAllDesc = document.querySelectorAll<HTMLElement>(`[id^="${blockPrefix}"]`);

        elemAllDesc.forEach(block => {
            const crumbId = block.id.substring(5);
            const lnk = document.getElementById(`btnShowHide${crumbId}`);
            toggleShowHide(lnk, block, bHide);
        });
    }
};
// click a button to toggle a container and change the button face based on objName
export const showHodeObject = (objName: string, btnToggle: HTMLElement, objContainers: Array<HTMLElement>) => {
    if (btnToggle.textContent === objName) {
        btnToggle.textContent = `Hide ${objName}`;
    } else {
        btnToggle.textContent = objName;
    }
    objContainers.forEach(container => container.classList.toggle('hidden'));
}
// show/hide the container based on bHide
export const showHideContainer = (containerId: string, bHide: boolean) => {
    const dt = document.getElementById(containerId)!;
    const bContainHidden = dt?.classList.contains('hidden');
    if (bHide && !bContainHidden || !bHide && bContainHidden) {
        dt.classList.toggle('hidden');
    }
}
// Mobile detection
export const isMobileDevice = (): boolean => {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const populateSelect = (
    selContainer: HTMLSelectElement, // sel may or may not have option as '-- select <type> --' already
    arr: Array<OptionData>,
): void => {
    clearOption(selContainer);
    let bPopulateAll = true;
    if (selContainer.options && selContainer.options.length > 0) {
        bPopulateAll = false;
    }
    arr.forEach(item => {
        if (bPopulateAll || item.textContent.indexOf('-- Select') === -1) {
            // array may or may not contain the '-- Select ...' option
            selContainer.appendChild(new Option(item.textContent, item.value));
        }
    });
}
export const clearOption = (selContainer: HTMLSelectElement) => {
    if (selContainer.options?.length > 0) {
        selContainer.innerHTML = `<option value="">${selContainer.options[0].textContent}</option>`;
    }
}
export const mapArrayToOption = (
    arr: Array<string>,
    optName?: string
): Array<OptionData> => {
    const opt = arr.map(item => {
        return { value: item, textContent: item };
    });
    if (optName !== undefined) {
        opt.unshift({ value: '0', textContent: `-- Select ${optName} --` });
    }
    return opt;
}
export const mapObjectToOption = (
    arr: any[],
    valueName: string,
    textContentName: string,
    optName?: string // a type, an account etc for -- select a type --
): Array<OptionData> => {
    const opt = arr.map(item => {
        return { value: item[valueName], textContent: item[textContentName] };

    });
    if (optName !== undefined) {
        opt.unshift({ value: '0', textContent: `-- Select ${optName} --` });
    }
    return opt;
};

/**
 * Set innerHTML for an element from an id
 * @param id 
 * @param html 
 * @returns 
 */
export const setInnerHTML = (id: string, html: string) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
    return el;
}
// export const converUserId = (id?: string): number => {
//     return Number(id ?? 0);
// }
export const getElement = (id: string): HTMLElement => {
    return document.getElementById(id)!;
}

export const getSpanElement = (id: string): HTMLSpanElement => {
    return document.getElementById(id) as HTMLSpanElement;
}
export const getDivElement = (id: string): HTMLDivElement => {
    return document.getElementById(id) as HTMLDivElement;
}
export const getInputElement = (id: string): HTMLInputElement => {
    return document.getElementById(id) as HTMLInputElement;
}
export const getButtonElement = (id: string): HTMLButtonElement => {
    return document.getElementById(id) as HTMLButtonElement;
}
export const getSelectElement = (id: string): HTMLSelectElement => {
    return document.getElementById(id) as HTMLSelectElement;
}
export const getAnchorElement = (id: string) => {
    return document.getElementById(id) as HTMLAnchorElement;
}

export const getTextarea = (id: string): HTMLTextAreaElement => {
    return document.getElementById(id) as HTMLTextAreaElement;
}
export const createInlineButton = (textContent: string) => {
    const elem = document.createElement('a');
    elem.textContent = textContent;
    elem.className = 'inlineButton';
    return elem;
}
export const createInlineSelect = (data: Array<OptionData> | undefined, selectedVal?: string): HTMLSelectElement => {
    const elem = document.createElement('select');
    elem.className = 'inlineSelect';
    if (data) {
        populateSelect(elem, data);
    }
    // set up selCat
    const selectedId = data?.find(c => c.textContent === selectedVal)?.value;
    if (selectedId !== undefined) {
        elem.value = selectedId.toString();
    }

    return elem;
}

export const showMessage = (
    msg: string,
    msgId: string = "manageError",
    timeout: number = 50000
) => {
    DataProvider.showMessage(msg, msgId, timeout);
}
