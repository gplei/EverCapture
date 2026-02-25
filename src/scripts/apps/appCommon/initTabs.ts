import * as stock from '../appFintech/tabs/stock';
import * as trip from '../appFintech/tabs/trip';
import * as tool from '../appFintech/tabs/tool.js';
import * as transaction from '../appFintech/tabs/transaction';
import * as analysis from '../appHayDay/tabs/analysis.js';
import * as manage from '../appHayDay/tabs/manage.js';
import * as summary from '../appHayDay/tabs/summary.js';

export function initTab(appName:string) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabs = document.querySelectorAll('.tab');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            
            const target = button.getAttribute('data-tab');

            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to the clicked button
            button.classList.add('active');

            // Hide all tabs
            tabs.forEach(tab => tab.classList.remove('active'));

            // Show the target tab and load its content
            if (!target) {
                return;
            }
            const targetTab = document.getElementById(target)!;
            targetTab.classList.add('active');
            loadTabContent(appName, target);
        });
    });

    (tabButtons[0] as any).click();
}

function loadTabContent(appName:string, tabId:string) {
    const tabPath = `${import.meta.env.BASE_URL}components/apps/${appName}/tabs/${tabId}.html`;
    fetch(tabPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch ${tabPath}: ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            document.getElementById(tabId)!.innerHTML = html;
            initTabScript(appName, tabId);
            // loadTabScript(appName, tabId);
        })
        .catch(error => {
            console.error('Error fetching tab content:', error);
            document.getElementById(tabId)!.innerHTML = `<p style="color: red;">Error loading content: ${error.message}</p>`;
        });
}
const initTabScript = (appName:string, tabId:string) => {
    if (appName == "appFintech") {
        if (tabId === 'stock') {
            stock.initStock();
        } else if (tabId === 'trip') {
            trip.initTrip();
        } else if ( tabId === 'transaction') {
            transaction.initTransaction();
        } else if (tabId === 'tool') {
            tool.initTool();
        }
    } else if (appName === 'appHayDay') {
        if (tabId === 'analysis') {
            analysis.initAnalysis();
        } else if (tabId === 'manage') {
            manage.initManage();
        } else if (tabId === 'summary') {
            summary.initSummary();
        }
    }

}
