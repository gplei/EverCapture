import './header';
import '../scss/main.scss';
import * as DataProvider from './db/dataProvider';
import * as CommonUtil from './common';

window.onload = async () => {
    await CommonUtil.validateAuthentication();
    if (CommonUtil.GlobalStore.userId) {
        DataProvider.redirectPage('pages/crumbs.html', '');
    }
    await CommonUtil.loadComponents();

    const a = CommonUtil.getQueryString('a');
    if (a === 'register') {
        CommonUtil.loadComponent('main-placeholder', 'src/components/secure/register.html');
    } else if (a === 'reset') {
        CommonUtil.loadComponent('main-placeholder', 'src/components/secure/reset.html');
    } else if (a === 'invalidLogin') {
        CommonUtil.setInnerHTML('errorMsg', `Invalid username or password. <a href="/login">Try again</a>`);
    } else if (a === 'resetU') {
        CommonUtil.setInnerHTML('errorMsg', `Invalid username.   <a href="/?a=reset">Try again</a>`);
    } else if (a === 'resetP') {
        CommonUtil.setInnerHTML('errorMsg', `The old and new password are not match. <a href="/?a=reset">Try again</a>`);
    } else {
        CommonUtil.loadComponent('main-placeholder', 'src/components/secure/login.html');
    }
}
