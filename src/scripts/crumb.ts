import './header';
import './quickLink';
import * as CommonUtil from './common.js';
import * as DataProvider from './db/dataProvider.ts';

let crumb: CommonUtil.Crumb;
window.onload = async () => {
    const viewType = document.getElementById('viewType');
    viewType?.addEventListener("click", () => {
        viewType.className = viewType.className === 'Note' ? 'Image' : 'Note';
        displayCrumb();
    })
    const del = document.getElementById('del');
    del?.addEventListener("click", () => {
        DataProvider.deleteCrumbById(crumb.id);
        DataProvider.redirectPage(document.referrer);
    })

    await CommonUtil.validateAuthentication();
    if (!CommonUtil.GlobalStore.userId) {
        DataProvider.redirectPage('/');
    }

    await CommonUtil.loadComponents();
    await CommonUtil.loadComponent('main-placeholder', 'src/Components/crumb.html')
    await CommonUtil.loadComponent('imgPopup-placeholder', 'src/Components/popup/imagePopup.html');
    // await CommonUtil.loadComponent('addImgPopup-placeholder', 'src/Components/popup/addImgPopup.html');

    CommonUtil.baseOnLoad();

    displayCrumb();
}
const displayCrumb = async () => {
    const results = await DataProvider.getCrumbById(parseInt(CommonUtil.getQueryString('id') ?? "0", 10));
    if (!results || results.length === 0) {
        return;
    }

    const title = document.getElementById("title");
    const date = document.getElementById("date");
    const edt = document.getElementById("edt") as HTMLAnchorElement;
    const image = document.getElementById("image");
    const crumbContainer = document.getElementById("crumbContainer");

    crumb = results[0];
    document.title = crumb.title;
    if (!title || !date || !edt || !image || !crumbContainer) {
        alert("Missing html element");
        return;
    }
    const tags = CommonUtil.getTag(crumb);
    title.innerHTML = `${CommonUtil.getTitle(crumb)} ${tags}`;
    date.textContent = CommonUtil.formatDateTimeLong(crumb.date ? new Date(crumb.date):new Date());
    edt.href = `/pages/addeditcrumb.html?id=${crumb.id}`;
    image.innerHTML = await CommonUtil.populateImage(crumb, true);
    if (crumb.description && crumb.description !== "" && image.innerHTML !== "") {
        crumbContainer.innerHTML = '<hr>';
    }
    crumbContainer.innerHTML += CommonUtil.sanitizeHtml(crumb.description ?? '');

    applyBackground((crumb.tags ?? []).join(','));
}
const applyBackground = (tags: string) => {
    let newTag = '';
    let vipTags = ['Food', 'Art', 'Travel'];
    vipTags.forEach(tag => {
        if (tags.includes(tag)) {
            newTag = tag;
            return;
        }
    });

    const viewType = document.getElementById("viewType");
    const dtContainer = document.getElementById("dtContainer");
    const crumbContainer = document.getElementById("crumbContainer") as HTMLAnchorElement;
    if (!viewType || !dtContainer || !crumbContainer) {
        return;
    }
    // apply appropriate class for the viewType, and background image for the special tag
    if (viewType.className === 'Note') { // in image view
        dtContainer.className = 'crumb-detail';
        crumbContainer.className = 'recipe';
        dtContainer.style['background'] = `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url('../images/bkg${newTag}.jpg') center/cover no-repeat`;
    } else { // in note view
        dtContainer.className = 'scrollContainer';
        crumbContainer.className = 'crumb-desc';
        dtContainer.style['background'] = '';
    }
}

window.deleteCrumbImage = async (id: number) => {
    const image = document.getElementById('image')!; // ! means trust me, this is not null
    await CommonUtil.deleteCrumbImage(id, crumb, image);
}
