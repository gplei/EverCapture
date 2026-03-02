import './header';
import '../scss/main.scss';
import * as DataProvider from './db/dataProvider';
import * as CommonUtil from './common';

window.onload = async () => {
    await CommonUtil.validateAuthentication();
    if (CommonUtil.GlobalStore.userId) {
        DataProvider.redirectPage('pages/crumbs.html', '');
        return;
    }
    await CommonUtil.loadComponents();

    const a = CommonUtil.getQueryString('a');
    if (a === 'register') {
        await CommonUtil.loadComponent('main-placeholder', 'components/secure/register.html');
    } else if (a === 'reset') {
        await CommonUtil.loadComponent('main-placeholder', 'components/secure/reset.html');
    } else if (a === 'invalidLogin') {
        CommonUtil.setInnerHTML('errorMsg', `Invalid username or password. <a href="/login">Try again</a>`);
    } else if (a === 'resetU') {
        CommonUtil.setInnerHTML('errorMsg', `Invalid username.   <a href="/?a=reset">Try again</a>`);
    } else if (a === 'resetP') {
        CommonUtil.setInnerHTML('errorMsg', `The old and new password are not match. <a href="/?a=reset">Try again</a>`);
    } else {
        await CommonUtil.loadComponent('main-placeholder', 'components/secure/login.html');
    }
}
