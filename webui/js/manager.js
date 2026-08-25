import './ui/components/viewport-fix.js';
import { PERMISSIONINFO } from './infrastructure/data/permissions.js';
import { APPSDATA } from './infrastructure/data/apps.js';
import { Permission } from './domain/models/permission.js';
import { App } from './domain/models/app.js';
import { AppCondition } from './domain/models/app-condition.js';
import { AppStatus } from './domain/enums/app-status.js';
import { TabStatus } from './domain/enums/tab-status.js';
import { ViewState } from './ui/view-state.js';
import { AppViewModel } from './ui/viewmodels/app-viewmodel.js';
import * as MainView from './ui/components/main-view.js';
import * as DetailView from './ui/components/detail-view.js';
import * as SearchInput from './ui/components/search-input.js';
import * as StatusMapper from './application/services/status-mapper.js';
import * as PermissionService from './application/services/permission-service.js';

const allPermissions = Object.fromEntries(
    Object.entries((typeof PERMISSIONINFO !== 'undefined') ? PERMISSIONINFO : {})
        .map( ([ name, desc ]) => [ name, new Permission(name, desc) ] )
);

const allApps = ((typeof APPSDATA !== 'undefined') ? APPSDATA : [])
    .map(app =>
    {
        const permissionModels = app.permissions
            .map(perm => allPermissions[perm])
            .filter(Boolean)
            .sort( (a, b) => a.name.localeCompare(b.name) );
        return new App(app.id, app.name, app.package, permissionModels, app.icon);
    })
    .sort( (a, b) => a.name.localeCompare(b.name) );

let viewState = null;


/////////////////////////////////////////////////
// #region MAIN VIEW
//

function getTabApps()
{
    return allApps.filter(app =>
    {
        const appViewModel = viewState.appViewModelDict[app.id];
        if (!appViewModel) return false;

        if (viewState.tab !== TabStatus.ALLAPPS)
        {
            const targetAppStatus = StatusMapper.tabStatustoAppStatus(viewState.tab);
            if (appViewModel.status !== targetAppStatus) return false;
        }
        
        if (viewState.searchQuery)
        {
            const nameMatch = appViewModel.name.toLowerCase().includes(viewState.searchQuery);
            const pkgMatch = appViewModel.package.toLowerCase().includes(viewState.searchQuery);
            if (!nameMatch && !pkgMatch) return false;
        }

        return true;
    });
}

function getValidTabApps()
{
    return getTabApps().filter(app => 
    {
        const appViewModel = viewState.appViewModelDict[app.id];
        if (!appViewModel) return false;

        return appViewModel.status !== AppStatus.NOTINSTALLED
            && appViewModel.status !== AppStatus.ERROR
            && appViewModel.status !== AppStatus.LOADING;
    });
}

async function updateAllStatuses()
{
    const counts =
    {
        [TabStatus.ALLAPPS]: allApps.length,
        [TabStatus.NONEGRANTED]: 0,
        [TabStatus.PARTIAL]: 0,
        [TabStatus.ALLGRANTED]: 0,
        [TabStatus.NOTINSTALLED]: 0
    };

    for (const app of allApps)
    {
        const appCondition = await PermissionService.inspectAppPermissions(app);
        const appViewModel = new AppViewModel(app, appCondition);
        
        viewState.appViewModelDict[app.id] = appViewModel;
        const tabStatus = StatusMapper.appStatustoTabStatus(appViewModel.status);
        if (tabStatus && counts[tabStatus] !== undefined) counts[tabStatus]++;
    }
    
    MainView.updateTabCounts(counts);
    MainView.renderMainActionButtons(Object.values(viewState.appViewModelDict));
    MainView.renderList(getTabApps(), viewState.appViewModelDict, openAppDetailView);
}

function onTabChange(newTab)
{
    viewState.tab = newTab;
    MainView.renderList(getTabApps(), viewState.appViewModelDict, openAppDetailView);
}

SearchInput.wire('searchInput', 'clearSearchBtn', (query) =>
{
    viewState.searchQuery = query;
    MainView.renderList(getTabApps(), viewState.appViewModelDict, openAppDetailView);
});

//
// #endregion MAIN VIEW
/////////////////////////////////////////////////


/////////////////////////////////////////////////
// #region DETAIL VIEW
//

function onPermissionCheckboxChange()
{
    DetailView.renderDetailActionButtons(viewState.getActiveAppViewModel());
}

async function openAppDetailView(app)
{
    if (!viewState.activeApp || viewState.activeApp.id !== app.id) DetailView.clearSearchInput();

    viewState.activeApp = app;
    let appViewModel = viewState.appViewModelDict[app.id] || new AppViewModel(app, new AppCondition(AppStatus.LOADING));

    DetailView.renderContent(appViewModel, onPermissionCheckboxChange);
    DetailView.show();

    const searchInput = document.getElementById('detailSearchInput');
    const currentQuery = searchInput ? searchInput.value.toLowerCase() : '';
    DetailView.filterPermissions(currentQuery);

    if (!viewState.appViewModelDict[app.id] || appViewModel.status === AppStatus.LOADING)
    {
        const appCondition = await PermissionService.inspectAppPermissions(app);
        const freshViewModel = new AppViewModel(app, appCondition);
        viewState.appViewModelDict[app.id] = freshViewModel;
        if (viewState.activeApp && viewState.activeApp.id === app.id)
        {
            DetailView.renderContent(freshViewModel, onPermissionCheckboxChange);
        }
    }
}

function onBackButton()
{
    viewState.activeApp = null;
    MainView.show();
}

SearchInput.wire('detailSearchInput', 'clearDetailSearchBtn', (query) =>
{
    DetailView.filterPermissions(query);
});

//
// #endregion DETAIL VIEW
/////////////////////////////////////////////////


/////////////////////////////////////////////////
// #region ACTIONS
//

document.getElementById('grantAllBtn').onclick = () =>
{
    PermissionService.runBulkAction(
        {
            action: 'grant',
            targets: getValidTabApps().map(a => ({ pkg: a.package, perms: a.permissions.map(p => p.name) })),
            confirmMessage: "Are you sure you want to grant full permissions to all supported apps?",
            confirmOptions: { title: "Grant all", confirmText: "Grant all" },
            loadingText: "Granting permissions...",
            successMessage: "All permissions granted successfully."
        },
        updateAllStatuses,
        onBackButton
    );
};
document.getElementById('revokeAllBtn').onclick = () =>
{
    PermissionService.runBulkAction(
        {
            action: 'revoke',
            targets: getValidTabApps().map(a => ({ pkg: a.package, perms: a.permissions.map(p => p.name) })),
            confirmMessage: "Are you sure you want to revoke full permissions from all supported apps?",
            confirmOptions: { title: "Revoke all", confirmText: "Revoke all", danger: true },
            loadingText: "Revoking permissions...",
            successMessage: "All permissions revoked successfully."
        },
        updateAllStatuses,
        onBackButton
    );
};

document.getElementById('grantSelectedBtn').onclick = () =>
{
    PermissionService.runSelectedAction(
        'grant', 
        viewState.activeApp, 
        DetailView.getSelectedPermissions(), 
        updateAllStatuses, 
        onBackButton
    );
};
document.getElementById('revokeSelectedBtn').onclick = () =>
{
    PermissionService.runSelectedAction(
        'revoke', 
        viewState.activeApp, 
        DetailView.getSelectedPermissions(), 
        updateAllStatuses, 
        onBackButton
    );
};

document.getElementById('backBtn').onclick = onBackButton;
document.getElementById('detailPermsList').addEventListener('change', onPermissionCheckboxChange);
document.getElementById('selectAllBtn').onclick = () => DetailView.setAllCheckboxes(true, onPermissionCheckboxChange);
document.getElementById('deselectAllBtn').onclick = () => DetailView.setAllCheckboxes(false, onPermissionCheckboxChange);

//
// #endregion ACTIONS
/////////////////////////////////////////////////


/////////////////////////////////////////////////
// #region INIT
//

async function init()
{
    try
    {
        viewState = new ViewState();
        MainView.setupTabs(onTabChange);
        MainView.renderList(getTabApps(), viewState.appViewModelDict, openAppDetailView);
        await updateAllStatuses();
    }
    catch(e)
    {
        console.error("Initialization error", e);
        const list = document.getElementById('appsList');
        if (list) list.innerHTML = '<div class="empty-message">Initialization error: ' + e.message + '</div>';
    }
}

//
// #endregion INIT
/////////////////////////////////////////////////

window.onload = init;
