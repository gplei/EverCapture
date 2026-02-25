import '../scss/main.scss';

import './header';
import './quickLink';
import * as DataProvider from './db/dataProvider.ts';
import * as CommonUtil from './common.ts';

let
    crumb: CommonUtil.Crumb,
    allTags: string[] = [],
    tags: string[] = [],
    defaultTextColor = '#4f5f5c',
    dateTime: Date, // local time
    fmtDateTime: string; // yyyy-mm-dd

window.onload = async () => {
    const strId = CommonUtil.getQueryString('id');
    await initAddEditCrumb(strId ? parseInt(strId, 10) : undefined);
}
export const initAddEditCrumb = async (crumbId?: number) => {
    await CommonUtil.validateAuthentication();
    const userId = Number(CommonUtil.GlobalStore.userId ?? 0);
    if (!userId) {
        DataProvider.redirectPage('/');
    }
    await CommonUtil.loadComponents(); // pageLayout, header and footer
    await CommonUtil.loadComponent("main-placeholder", "components/addEditCrumb.html");
    await CommonUtil.loadComponent('editor', 'components/editor.html');
    await CommonUtil.loadComponent('imgPopup-placeholder', 'components/popup/imagePopup.html');
    await CommonUtil.loadComponent('addImgPopup-placeholder', 'components/popup/addImgPopup.html');

    CommonUtil.baseOnLoad();

    initEventHandler(userId, crumbId);

    allTags = await DataProvider.getAllTags();

    // initialize elements

    const addTagInput = document.getElementById('addTagInput')!;
    const addTagDropdown = document.getElementById('addTagDropdown')!;
    if (!addTagInput || !addTagDropdown) {
        alert("can't find addTagInput");
    }
    CommonUtil.hideDropdown(addTagInput, addTagDropdown);

    await loadCrumbById(crumbId);
}
const initEventHandler = (userId: number, crumbId:number|undefined) => {
    // manage insert/upload image popup
    document.getElementById('btnUploadImage')?.addEventListener('click', async () => {
        const uploadImage = document.getElementById('uploadImage')!;
        uploadImage.style.display = 'flex';
    })

    document.getElementById('btnDelToggle')?.addEventListener('click', async () => {
        if (crumbId !== undefined) {
            await DataProvider.deleteCrumbById(crumbId);
            loadCrumbById(crumbId);
        }
    })

    document.getElementById('btnCreateUpdate')?.addEventListener('click', async () => {
        createUpdateCrumb(userId, crumbId);
    })

    document.getElementById('btnCancel')?.addEventListener('click', async () => {
        DataProvider.redirectPage(document.referrer);
    })

    // tag related handler
    const addTagInput = document.getElementById('addTagInput') as HTMLInputElement;
    addTagInput.addEventListener("input", () => {
        filterAddTag();
    })
    addTagInput.addEventListener("click", () => {
        filterAddTag();
    })
    addTagInput.addEventListener("keypress", (event: KeyboardEvent) => {
        addNewTag(event);
    })

    // event on addImgPopup.html
    const btnImagePick = document.getElementById('btnImagePick') as HTMLInputElement;
    btnImagePick.addEventListener("click", () => {
        processPopup('pick');
    })
    const btnImageUpload = document.getElementById('btnImageUpload') as HTMLInputElement;
    btnImageUpload.addEventListener("click", () => {
        processPopup('upload');
    })
    const btnImageCancel = document.getElementById('btnImageCancel') as HTMLInputElement;
    btnImageCancel.addEventListener("click", () => {
        processPopup('cancel');
    })

}
async function loadCrumbById(id?: number) {
    // the id maybe not auth user's id
    const data = !id ? [] : await DataProvider.getCrumbById(id);
    const dtCrumbDate = document.getElementById('dtCrumbDate')! as HTMLInputElement;
    const imgContent = document.getElementById('imgContent')!;
    const btnCreateUpdate = document.getElementById('btnCreateUpdate')!;
    const pageTitle = document.getElementById('pageTitle')!;
    const image = document.getElementById('image')!;
    const colorPicker = document.getElementById('colorPicker')! as HTMLInputElement;
    const btnDelToggle = document.getElementById('btnDelToggle')!;
    const txtTitle = document.getElementById('txtTitle')! as HTMLInputElement;
    const txtUrl = document.getElementById('txtUrl')! as HTMLInputElement;
    const designTextArea = document.getElementById('designTextArea')! as HTMLTextAreaElement;
    if (!data || data.length === 0) {
        imgContent.className = "hidden";
        btnCreateUpdate.textContent = "Create";
        pageTitle.textContent = 'Create a Crumb';
        dtCrumbDate.value = CommonUtil.formatDateTime(new Date());
        tags = [];
    } else {
        const htmlTextArea = document.getElementById('htmlTextArea')! as HTMLTextAreaElement;
        crumb = data[0];
        image.innerHTML = await CommonUtil.populateImage(crumb, true);
        colorPicker.value = crumb.color || defaultTextColor;
        btnDelToggle.className = 'link-button';
        btnDelToggle.textContent = crumb.deleted ? 'Undelete' : 'delete';
        btnCreateUpdate.textContent = "Update";
        pageTitle.textContent = 'Update a Crumb';
        txtTitle.value = crumb.title;
        txtUrl.value = crumb.url ?? "";
        dateTime = new Date(crumb.date ?? new Date()); // becomes local time
        fmtDateTime = CommonUtil.formatDateTime(dateTime);
        dtCrumbDate.value = fmtDateTime;
        htmlTextArea.value = crumb.description ?? "";
        designTextArea.innerHTML = CommonUtil.sanitizeHtml(crumb.description ?? "");
        const event = new Event('input', { bubbles: true, cancelable: true });
        htmlTextArea.dispatchEvent(event);
        tags = crumb.tags ?? [];
    }
    renderTags();
}

const createUpdateCrumb = async (userId: number, crumbId:number|undefined) => {
    const dtCrumbDate = document.getElementById('dtCrumbDate')! as HTMLInputElement;
    const htmlTextArea = document.getElementById('htmlTextArea')! as HTMLTextAreaElement;
    const btnCreateUpdate = document.getElementById('btnCreateUpdate')!;
    const colorPicker = document.getElementById('colorPicker')! as HTMLInputElement;
    const txtTitle = document.getElementById('txtTitle')! as HTMLInputElement;
    const txtUrl = document.getElementById('txtUrl')! as HTMLInputElement;
    const designTextArea = document.getElementById('designTextArea')! as HTMLTextAreaElement;

    const newDate = dtCrumbDate.value === fmtDateTime ? dateTime : new Date(`${dtCrumbDate.value} 00:00:00`);
    const crumbDate = CommonUtil.formateDateToSave(newDate);
    const description = htmlTextArea.classList.contains('hidden') ? designTextArea.innerHTML : htmlTextArea.value;
    const color = colorPicker.value === defaultTextColor ? null : colorPicker.value;

    if (btnCreateUpdate.textContent === "Create") {
        const newCrumb = {
            userId,
            title: txtTitle.value,
            url: txtUrl.value,
            crumbDate,
            description,
            color,
            tags
        };
        await DataProvider.createCrumb(newCrumb);
    } else if (btnCreateUpdate.textContent === "Update") {
        const editCrumb = {
            id: crumbId,
            title: txtTitle.value,
            url: txtUrl.value,
            crumbDate,
            description,
            color,
            tags
        }
        await DataProvider.updateCrumb(editCrumb);
    }

    const sleep = (ms: number) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    await sleep(500); // mobile device to work
    DataProvider.redirectPage(document.referrer);
}

/**
 * code to handle 
 *  - tag filter
 *  - select to add exist
 *  - enter to add new
 *  - remove already added
 */

// filter tags with input text
const filterAddTag = async () => {
    const addTagInput = document.getElementById('addTagInput')! as HTMLInputElement;
    const addTagDropdown = document.getElementById('addTagDropdown')! as HTMLDivElement;

    CommonUtil.filterDropdown(addTagInput, addTagDropdown, allTags, addExistTags, 1);
}

// Add a tag
const addNewTag = async (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        const input = event.target as HTMLInputElement;
        const newTag = input.value.trim();
        if (newTag && !tags.includes(newTag)) {
            tags.push(newTag);
            input.value = ""; // Clear the input
            renderTags();
        }
    }
}

// Remove a tag
window.removeTag = async (tag: string) => {
    tags = tags.filter((t) => t !== tag);
    renderTags();
}
window.updateTag = async (oldName: string) => {
    const newName = prompt(`Enter the new name for tag '${oldName}'`, oldName);
    if (newName) {
        await DataProvider.updateTag(newName, oldName);
    }
}
// Update the tags display
function renderTags() {
    const tagAdded = document.getElementById('tags')!;
    tagAdded.innerHTML = '';
    tags.forEach(tag => {
        const tagWrap = document.createElement('span');
        tagWrap.className = 'tag';

        const updTag = document.createElement('a');
        updTag.className = 'update-tag';
        updTag.title = 'rename tag';
        updTag.textContent = tag;
        updTag.addEventListener('click', () => {
            window.updateTag(tag);
        });

        const removeTag = document.createElement('a');
        removeTag.className = 'remove-tag';
        removeTag.title = 'delete tag';
        removeTag.textContent = '×';
        removeTag.addEventListener('click', () => {
            window.removeTag(tag);
        });

        tagWrap.appendChild(updTag);
        tagWrap.appendChild(removeTag);
        tagAdded.appendChild(tagWrap);
    });
}

// action on enter
async function addExistTags(tag: string) {
    if (tag && !tags.includes(tag)) {
        const addTagInput = document.getElementById('addTagInput')! as HTMLInputElement;
        const addTagDropdown = document.getElementById('addTagDropdown')! as HTMLDivElement;

        tags.push(tag);
        renderTags();
        addTagInput.value = '';
        addTagDropdown.style.display = 'none';
    }
}

window.deleteCrumbImage = async (id: number) => {
    const image = document.getElementById('image')!;
    await CommonUtil.deleteCrumbImage(id, crumb, image);
}

// clicked a button of a popup
const processPopup = async (action: 'pick' | 'upload' | 'cancel') => {
    let imgUrls = [];
    if (action === 'cancel') {
        hidePopup();
        return;
    } else {
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput.files?.length === 0) {
            alert('No file selected.');
            return;
        }
        let data = new FormData();
        for (const file of fileInput.files ?? []) {
            // const isImage = file.type.startsWith('image/');
            // const isVideo = file.type.startsWith('video/');
            // const fileType = isImage ? 'image' : isVideo ? 'video' : 'unknown';
            if (action === 'pick') {
                imgUrls.push(`${file.name}`);
            } else if (action === 'upload') {
                data.append('upload', file);
            }
        }
        if (action !== 'pick') {
            // const response = await fetch(`${DataProvider.apiMediaBase}/upload_media`, { method: 'POST', body: data });
            const pathMedia = `${DataProvider.mediaHost}/media`;
            const response = await fetch(pathMedia, { method: 'POST', body: data });
            const result = await response.json();
            imgUrls = result.files;
        }
    }
    await DataProvider.addImage(crumb.id, imgUrls);
    const image = document.getElementById('image')!;
    image.innerHTML = await CommonUtil.populateImage(crumb, true);
    hidePopup();
}
const hidePopup = () => {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    const uploadImage = document.getElementById('uploadImage')!;
    uploadImage.style.display = 'none';
    fileInput.value = '';
}
