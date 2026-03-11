import * as CommUtil from './common.ts';
import * as account from '../../../personal/account.ts';

export const initQuickLink = () => {
    initIconLink(account.accounts);
}
/**
 * input object has type {name, url, imgUrl, tip}
 * output anchor object has type {
 *  name (name + tip),
 *  url ? or http://www.${name}.com)
 *  imgUrl ? or imgUrl or http://www.${name}.com/favicon.ico or /images/other/${name).ico}
 * }
 * 
 * Group 'Other' is the last group.  Link in this group use ec.ico by default.
 */
const initIconLink = (qLinkAccounts: Array<account.MiniIcon>) => {
    const qLinkCollection = qLinkAccounts.map((item) => {
        let name = item.name;
        const url = item.url ?? `http://www.${item.name}.com`;
        let imgUrl = item.imgUrl;
        if (imgUrl === undefined) {
            imgUrl = `${url}/favicon.ico`;
            imgUrl = `/images/favicons/${item.name.toLocaleLowerCase()}.ico`;
        } else if (imgUrl === '') {
            imgUrl = `/src/personal/qIcon/other/${item.name}.ico`;
        }
        const tip = (CommUtil.GlobalStore.userId === 2 || CommUtil.GlobalStore.userId === 8) ? item.tip : '';
        
        return (item.name === '-' || item.name === '|' || item.name === '--') ? item : { name, url, tip, imgUrl };
    });

    // each object should be filled with {name, url, imgUrl} already
    var otherSec = false;
    const qLinkArr = qLinkCollection.map((lnk) => {
        if (lnk.name === '-') {
            return '<br/>';
        } else if (lnk.name === '|') {
            return '<span style="border-left: 1px solid #eee; margin: 0 10px;"></span>';//`&nbsp;`;
        } else if (lnk.name === '--') {
            // use ec.ico in group 'Other'
            if (lnk.groupName === 'Other') {
                otherSec = true;
            }
            return `<div class="side-divider"><div class="group-name">${lnk.groupName}</div></div>`
        } else {
            if (otherSec) {
                // on mac, tip shown as img's title while on mobile device tip shown as anchor's title
                return `<div><a class='lnk-title' title='${lnk.tip}' href='${lnk.url}' target='_blank'>
                ${lnk.name}</a></div> `;
            } else {
                const innerHTML = `<img title='${lnk.name}: ${lnk.tip}' src='${lnk.imgUrl}' alt="${lnk.name}" style="padding: 1px; height:16px;width:16px;border-width:0px;"></img>`;
                // on mac, tip shown as img's title while on mobile device tip shown as anchor's title
                return `<a class='has-tooltip' title='${lnk.name}' href='${lnk.url}' target='_blank'
            ontouchstart='window.touchstart(event, this)' ontouchend='window.touchend()', ontouchmove='window.touchmove()'>
                ${innerHTML}</a> `;
            }
        }
    });
    const qLink = document.getElementById("qLink") as HTMLDivElement;
    qLink.innerHTML += qLinkArr.join('');
}

window.addEventListener("touchstart", (event: TouchEvent) => {
    console.log("Touch started!", event.touches);
    const anchor = event.target as HTMLAnchorElement;
    const title = anchor.getAttribute('title');
    if (title) {
        const tooltip = document.getElementById('tooltip') as HTMLDivElement;
        tooltip.textContent = title;
        const rect = anchor.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
        tooltip.style.display = 'block';
        anchor.setAttribute('data-title', title); // Save title temporarily
        anchor.removeAttribute('title'); // Prevent default behavior
    }
});
window.addEventListener("touchend", (event: TouchEvent) => {
    const anchor = event.target as HTMLAnchorElement;
    const tooltip = document.getElementById('tooltip') as HTMLDivElement;
    tooltip.style.display = 'none';
    if (anchor.getAttribute('data-title')) {
        anchor.setAttribute('title', anchor.getAttribute('data-title') || "");
    }
});
window.addEventListener("touchmove", () => {
    const tooltip = document.getElementById('tooltip') as HTMLDivElement;
    tooltip.style.display = 'none';
});

