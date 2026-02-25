import '../../../scss/apps/apps.scss';
import * as DataProvider from '../../db/dataProvider';
import * as CommonUtil from '../../common';
import * as Tab from '../appCommon/initTabs.js';

document.addEventListener('DOMContentLoaded', async () => {
        await CommonUtil.validateAuthentication();
        if (!CommonUtil.GlobalStore.userId) {
            DataProvider.redirectPage('/');
        }
    
        // userId = window.userId;
    
    Tab.initTab('appFintech');
});

window.addEventListener("error", (event) => {
    CommonUtil.showMessage(`Global error caught: ${event.message}.\n File: ${event.filename}, LIne: ${event.lineno}`);
});

window.addEventListener("unhandledrejection", (event) => {
  CommonUtil.showMessage(`Unhandled promise rejection: ${event.reason}`);
});