import * as CommonUtil from './common.ts';
import * as DataProvider from './db/dataProvider.ts';

type USER = { id: string, username: string }

CommonUtil.InitRegistry.initHeader = async () => {
    const apiBase = DataProvider.apiBase;

    // do not redirect in initHeader
    await CommonUtil.validateAuthentication();
    const logInOut = document.getElementById('logInOut') as HTMLAnchorElement;
    const addEdit = document.getElementById('addEdit') as HTMLButtonElement;
    const userSelect = document.getElementById('userSelect') as HTMLSelectElement;
    const userId = CommonUtil.GlobalStore.userId;
    const isDev = import.meta.env.MODE === 'development';
    if (userId && logInOut) {
        logInOut.innerHTML = 'Logout';
        logInOut.href = `${apiBase}/logout`;
        addEdit.className = 'link-button';
    } else {
        userSelect.className = '';

        logInOut.innerHTML = 'Login';
        logInOut.href = `${apiBase}/login`;
    }

    if (!isDev) {
        userSelect.className = 'hidden';
        return;
    }

    const usersResp = await DataProvider.getUser();
    const users: Array<USER> = Array.isArray(usersResp) ? usersResp : [];
    users.unshift({ id: '0', username: '-- Select a user --' });

    // Populate the <select> element with options
    users.forEach(user => {
        const option: HTMLOptionElement = document.createElement('option');
        option.value = user.id; // Set option value
        option.textContent = user.username; // Set display text
        userSelect.appendChild(option); // Add to <select>
    });
    userSelect.value = userId === undefined ? "0" : userId.toString();

    const login = async (userName: string) => {
        const redirectUrl = (!document.referrer || document.referrer === "") ? '/' : document.referrer;
        await DataProvider.login({ username: userName, password: userName, redirectUrl });
    }

    userSelect.addEventListener("change", async (event: Event) => {
        // Cast the event target to HTMLSelectElement
        const target = event.target as HTMLSelectElement;
        if (!target) return;

        if (target.value === "0") {
            DataProvider.redirectPage("logout");
        } else {
            const selectedText = target.options[target.selectedIndex].text;
            await login(selectedText);
        }
    })
}
