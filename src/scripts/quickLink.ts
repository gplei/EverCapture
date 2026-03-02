import * as DataProvider from './db/dataProvider.ts';
import * as CommonUtil from './common.ts';
import { initQuickLink } from '../personal/qIcon/initQIcon.ts';

CommonUtil.InitRegistry.initSidePanel = async  () => {
    initQuickLink();
    await loadCrumbPinned();
    if (CommonUtil.isMobileDevice()) {
        showHideSideBlock();
    }

}

const loadCrumbPinned = async () => {
    const userId = CommonUtil.GlobalStore.userId;
    if (!userId) return;

    const data = await DataProvider.getPinnedCrumb(userId);
    const pinnedCrumb = document.getElementById("pinnedCrumb") as HTMLDivElement;
    pinnedCrumb.innerHTML = data.length === 0?'' : `<div class="side-divider"><div class="group-name">Pinned crubms</div></div>`;
    let n = 0;
    data.forEach((row) => {
        if (n++ > 100) {
            return;
        }
        const elemHover = `onmouseover='window.showHidePin(${row.id}, true)' onmouseout='window.showHidePin(${row.id}, false)'`;
        const elemPin = `<a id='btnPinned${row.id}' onclick=window.unPin(${row.id})></a>`;
        const elemTitle = CommonUtil.getTitle(row);
        pinnedCrumb.innerHTML += `<div ${elemHover} id=sideCrumb${row.id}>${elemTitle}${elemPin}</div>`;
    });
}

export const unPin = (id:number) => {
    const pinnedLnk = document.getElementById(`sideCrumb${id}`) as HTMLButtonElement;
    pinnedLnk.outerHTML = '';
    DataProvider.updatePin(id, 0);
}


export const showHidePin = (id:number, pin: boolean) => {
    const elemPin = document.getElementById(`btnPinned${id}`) as HTMLButtonElement;
    elemPin.className = '';
    if (pin) {
        elemPin.classList.add('pin');
    } else {
        elemPin.classList.add('hidden');
    }
}


export const showHideSideBlock = (id?:number) => {
    CommonUtil.showHideBlock(id, 'showHideSide', 'sideBlock');
}
