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
let viewState = new ViewState();


// #region MAIN VIEW

function getTabApps()
{
    return allApps.filter(app =>
    {
        const appViewModel = viewState.appViewModelDict[app.id];
        if (!appViewModel) return false;

        if (viewState.tab !== TabStatus.ALLAPPS)
        {
            const targetAppStatus = StatusMapper.toAppStatus(viewState.tab);
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
        const appCondition = await inspectAppPermissions(app);
        const appViewModel = new AppViewModel(app, appCondition);
        
        viewState.appViewModelDict[app.id] = appViewModel;
        const tabStatus = StatusMapper.toTabStatus(appViewModel.status);
        if (tabStatus && counts[tabStatus] !== undefined) counts[tabStatus]++;
    }
    
    MainView.updateTabCounts(counts);
    MainView.renderMainActionButtons(Object.values(viewState.appViewModelDict));
    MainView.renderList(getTabApps(), viewState.appViewModelDict, openAppDetailView);
}

// #endregion MAIN VIEW


// #region DETAIL VIEW

async function openAppDetailView(app)
{
    if (!viewState.activeApp || viewState.activeApp.id !== app.id) DetailView.clearSearchInput();

    viewState.activeApp = app;
    let appViewModel = viewState.appViewModelDict[app.id] || new AppViewModel(app, new AppCondition(AppStatus.LOADING));

    const onCheckboxChange = () => renderDetailActionButtons(viewState.getActiveAppViewModel());
    DetailView.renderContent(appViewModel, onCheckboxChange);
    DetailView.show();

    const searchInput = document.getElementById('detailSearchInput');
    const currentQuery = searchInput ? searchInput.value.toLowerCase() : '';
    DetailView.filterPermissions(currentQuery);

    if (!viewState.appViewModelDict[app.id] || appViewModel.status === AppStatus.LOADING)
    {
        const appCondition = await inspectAppPermissions(app);
        const freshViewModel = new AppViewModel(app, appCondition);
        viewState.appViewModelDict[app.id] = freshViewModel;
        
        if (viewState.activeApp && viewState.activeApp.id === app.id) DetailView.renderContent(freshViewModel, onCheckboxChange);
    }
}

// #endregion DETAIL VIEW


///////////////////////////////////////////////////////////////////////////////
// #region BUTTONS

async function runBulkPermissionAction(options)
{
    const
    {
        action,
        targets,
        emptyMessage,
        confirmMessage,
        confirmOptions,
        loadingText,
        successMessage,
        goBackAfter = false
    } = options;

    if (!targets || targets.length === 0)
    {
        if (emptyMessage) alertUi(emptyMessage);
        return;
    }

    if (confirmMessage)
    {
        const ok = await confirmUi(confirmMessage, confirmOptions);
        if (!ok) return;
    }

    if (!(await ensureBridgeReady())) return;

    showLoadingSpinner(loadingText);
    await new Promise(r => setTimeout(r, 100));

    try
    {
        for (const target of targets)
        {
            await processPermissions(target.pkg, target.perms, action);
        }
        await updateAllStatuses();
    }
    finally
    {
        hideLoadingSpinner();
    }

    if (goBackAfter)
    {
        viewState.activeApp = null;
        MainView.show();
    }
    alertUi(successMessage);
}

document.getElementById('grantAllBtn').onclick = () =>
    runBulkPermissionAction({
        action: 'grant',
        targets: getTabApps().map(a => ({ pkg: a.package, perms: a.permissions.map(p => p.name) })),
        confirmMessage: "Are you sure you want to grant full permissions to all supported apps?",
        confirmOptions: { title: "Grant all", confirmText: "Grant all" },
        loadingText: "Granting permissions...",
        successMessage: "All permissions granted successfully."
    });

document.getElementById('revokeAllBtn').onclick = () =>
    runBulkPermissionAction({
        action: 'revoke',
        targets: getTabApps().map(a => ({ pkg: a.package, perms: a.permissions.map(p => p.name) })),
        confirmMessage: "Are you sure you want to revoke full permissions from all supported apps?",
        confirmOptions: { title: "Revoke all", confirmText: "Revoke all", danger: true },
        loadingText: "Revoking permissions...",
        successMessage: "All permissions revoked successfully."
    });

function runSelectedPermissionAction(action)
{
    if (!viewState.activeApp) return;

    const selectedPerms = DetailView.getSelectedPermissions();
    const targetName = viewState.activeApp.name;

    const texts = action === 'grant'
        ? { verb: 'grant', ing: 'Granting', done: 'granted', prep: 'to' }
        : { verb: 'revoke', ing: 'Revoking', done: 'revoked', prep: 'from' };

    runBulkPermissionAction({
        action,
        targets: selectedPerms.length ? [{ pkg: viewState.activeApp.package, perms: selectedPerms }] : [],
        emptyMessage: `No permissions selected to ${texts.verb}.`,
        loadingText: `${texts.ing} permissions...`,
        successMessage: `Permissions successfully ${texts.done} ${texts.prep} <b>${targetName}</b> app.`,
        goBackAfter: true
    });
}

document.getElementById('grantSelectedBtn').onclick = () => runSelectedPermissionAction('grant');
document.getElementById('revokeSelectedBtn').onclick = () => runSelectedPermissionAction('revoke');

document.getElementById('backBtn').onclick = () =>
{
    viewState.activeApp = null;
    MainView.show();
};

document.getElementById('detailPermsList').addEventListener('change', () => 
    renderDetailActionButtons(viewState.getActiveAppViewModel())
);

function setAllDetailCheckboxes(checked)
{
    document.querySelectorAll('#detailPermsList .perm-card').forEach(card =>
    {
        if (card.style.display === 'none') return;
        const cb = card.querySelector('input[type="checkbox"]');
        if (cb && !cb.disabled) cb.checked = checked;
    });
    renderDetailActionButtons(viewState.getActiveAppViewModel());
}

document.getElementById('selectAllBtn').onclick = () => setAllDetailCheckboxes(true);
document.getElementById('deselectAllBtn').onclick = () => setAllDetailCheckboxes(false);

function wireSearchInput(inputId, clearBtnId, onChange)
{
    const input = document.getElementById(inputId);
    const clearBtn = document.getElementById(clearBtnId);
    if (!input || !clearBtn) return;

    input.addEventListener('input', (e) =>
    {
        clearBtn.style.display = e.target.value.length > 0 ? 'flex' : 'none';
        onChange(e.target.value.toLowerCase());
    });

    clearBtn.addEventListener('click', () =>
    {
        input.value = '';
        clearBtn.style.display = 'none';
        onChange('');
        input.focus();
    });
}

wireSearchInput('searchInput', 'clearSearchBtn', (query) =>
{
    viewState.searchQuery = query;
    renderList();
});

wireSearchInput('detailSearchInput', 'clearDetailSearchBtn', (query) =>
{
    filterDetailPermissions(query);
});

// #endregion BUTTONS
///////////////////////////////////////////////////////////////////////////////


async function init()
{
    try
    {
        setupTabs();
        renderList();
        await updateAllStatuses();
    }
    catch(e)
    {
        console.error("Initialization error", e);
        const list = document.getElementById('appsList');
        if (list) list.innerHTML = '<div class="empty-message">Initialization error: ' + e.message + '</div>';
    }
}

window.onload = init;





















///////////////////////////////////////////////////////////////////////////////
// #region BUTTONS & EVENTS

// Delegación de eventos general para cuando un checkbox cambia manualmente
document.getElementById('detailPermsList').addEventListener('change', () => 
    renderDetailActionButtons(viewState.getActiveAppViewModel())
);

document.getElementById('selectAllBtn').onclick = () => {
    DetailView.setAllCheckboxes(true, () => renderDetailActionButtons(viewState.getActiveAppViewModel()));
};

document.getElementById('deselectAllBtn').onclick = () => {
    DetailView.setAllCheckboxes(false, () => renderDetailActionButtons(viewState.getActiveAppViewModel()));
};

function wireSearchInput(inputId, clearBtnId, onChange)
{
    const input = document.getElementById(inputId);
    const clearBtn = document.getElementById(clearBtnId);
    if (!input || !clearBtn) return;

    input.addEventListener('input', (e) =>
    {
        clearBtn.style.display = e.target.value.length > 0 ? 'flex' : 'none';
        onChange(e.target.value.toLowerCase());
    });

    clearBtn.addEventListener('click', () =>
    {
        input.value = '';
        clearBtn.style.display = 'none';
        onChange('');
        input.focus();
    });
}

wireSearchInput('searchInput', 'clearSearchBtn', (query) =>
{
    viewState.searchQuery = query;
    MainView.renderList(getTabApps(), viewState.appViewModelDict, openAppDetailView);
});

wireSearchInput('detailSearchInput', 'clearDetailSearchBtn', (query) =>
{
    DetailView.filterPermissions(query);
});

// #endregion BUTTONS & EVENTS
///////////////////////////////////////////////////////////////////////////////


async function init()
{
    try
    {
        // Configuramos la navegación inyectando qué debe hacer el manager
        MainView.setupTabs((newFilter) => {
            viewState.tab = newFilter;
            MainView.renderList(getTabApps(), viewState.appViewModelDict, openAppDetailView);
        });

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

window.onload = init;