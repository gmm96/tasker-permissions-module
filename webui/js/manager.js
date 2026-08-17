let appStore = (typeof APP_STORE !== 'undefined') ? APP_STORE : [];
appStore.sort((a, b) => a.name.localeCompare(b.name));
let appViewModelDict = {};
let currentTab = TabStatus.ALLAPPS;
let currentSearchQuery = '';
let activeTargetApp = null;

function getAppIconPath(iconFileName)
{
    return `assets/app_icons/${iconFileName}`;
}

function showBridgeDebug(extraLine)
{
    const el = document.getElementById('bridgeDebug');
    if (!el) return;
    el.style.display = 'block';
    let html = window.Shizuku
        ? 'Detected on window: <br>' + JSON.stringify(window.Shizuku, null, 2)
        : 'No Shizuku shell bridge object found on window.';
    if (extraLine) html = extraLine + '<br><br>' + html;
    el.innerHTML = html;
}

async function ensureBridgeReady()
{
    const bridge = await tryBridgeCall();
    if (!bridge)
    {
        showBridgeDebug('No window.Shizuku bridge object found — nothing was granted.');
        alertUi("Could not reach the Shevery shell bridge — nothing was granted. See the debug info under the header.");
        return false;
    }
    const trustInfo = await getModuleTrustInfo();
    if (trustInfo && trustInfo.trusted === false)
    {
        showBridgeDebug(
            `Module "${trustInfo.id || 'tasker-permissions'}" is not trusted — nothing was granted. ` +
            `Long-press this module's card in Shevery and grant Full Trust / Full Access.`
        );
        alertUi("This module isn't trusted yet in Shevery — nothing was granted. See the debug info under the header.");
        return false;
    }
    return true;
}


///////////////////////////////////////////////////////////////////////////////
// #region MAIN VIEW

function setupTabs()
{
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab =>
    {
        tab.onclick = () =>
        {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.getAttribute('data-filter');
            renderList();
        };
    });
}

function renderList() {
    const list = document.getElementById('appsList');
    if (!list) return;
    list.innerHTML = '';
    let visibleCount = 0;

    appStore.forEach(app =>
    {
        const viewModel = appViewModelDict[app.id] || new AppViewModel(app, new AppSnapshot(AppStatus.LOADING));
        
        if (currentTab !== TabStatus.ALLAPPS)
        {
            const targetAppStatus = StatusMapper.toAppStatus(currentTab);
            if (viewModel.status !== targetAppStatus) return;
        }

        if (currentSearchQuery)
        {
            const nameMatch = viewModel.name.toLowerCase().includes(currentSearchQuery);
            const pkgMatch = viewModel.package.toLowerCase().includes(currentSearchQuery);
            if (!nameMatch && !pkgMatch) return;
        }
        
        visibleCount++;

        const item = document.createElement('div');
        item.className = 'app-item';
        item.onclick = () => openAppDetailView(app);

        const leftSec = document.createElement('div');
        leftSec.className = 'app-item-left';

        const icon = document.createElement('img');
        icon.className = 'app-icon';
        icon.src = getAppIconPath(viewModel.icon);
        icon.alt = viewModel.name;
        icon.onerror = () => { icon.src = 'assets/android.png'; };

        const info = document.createElement('div');
        info.className = 'app-info';

        const name = document.createElement('p');
        name.className = 'app-name';
        name.textContent = viewModel.name;

        const pkg = document.createElement('p');
        pkg.className = 'app-package';
        pkg.textContent = viewModel.package;

        info.appendChild(name);
        info.appendChild(pkg);

        leftSec.appendChild(icon);
        leftSec.appendChild(info);

        const badge = document.createElement('span');
        badge.className = `status-badge ${viewModel.ui.cssClass}`;
        badge.textContent = viewModel.ui.text;

        item.appendChild(leftSec);
        item.appendChild(badge);
        list.appendChild(item);
    });

    if (visibleCount === 0)
    {
        list.innerHTML = '<div class="empty-message">No applications found in this category</div>';
    }
}

function renderMainButtons()
{
    let revokeAllBtnDisabled = true;
    let grantAllBtnDisabled = true;

    for (const viewModel of Object.values(appViewModelDict))
    {
        if (!viewModel.ui.disabled)
        {
            if (viewModel.status !== AppStatus.NONEGRANTED) revokeAllBtnDisabled = false;
            if (viewModel.status !== AppStatus.ALLGRANTED) grantAllBtnDisabled = false;
        }
    }

    document.getElementById('revokeAllBtn').disabled = revokeAllBtnDisabled;
    document.getElementById('grantAllBtn').disabled = grantAllBtnDisabled;
}

async function updateAllStatuses()
{
    const counts =
    {
        [TabStatus.ALLAPPS]: appStore.length,
        [TabStatus.NONEGRANTED]: 0,
        [TabStatus.PARTIAL]: 0,
        [TabStatus.ALLGRANTED]: 0,
        [TabStatus.NOTINSTALLED]: 0
    };

    for (const app of appStore)
    {
        const inspectionResult = await inspectAppPermissions(app);
        const viewModel = new AppViewModel(app, inspectionResult);
        
        appViewModelDict[app.id] = viewModel;
        const tabStatus = StatusMapper.toTabStatus(viewModel.status);

        if (tabStatus && counts[tabStatus] !== undefined) counts[tabStatus]++;
    }

    for (const tab of Object.values(TabStatus))
    {
        document.getElementById(`count-${tab}`).textContent = counts[tab];
    }
    
    renderMainButtons();
    renderList();
}

function showMainView()
{
    document.getElementById('detailView').classList.remove('active');
    document.getElementById('mainView').classList.add('active');
    activeTargetApp = null;
}

// #endregion MAIN VIEW
///////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////
// #region DETAIL VIEW

function renderDetailContent(appViewModel)
{
    document.getElementById('detailTitle').textContent = appViewModel.name;
    document.getElementById('detailPackage').textContent = appViewModel.package;
    const icon = document.getElementById('detailIcon');
    icon.src = getAppIconPath(appViewModel.icon);
    icon.onerror = () => { icon.src = 'assets/android.png'; };

    const badge = document.getElementById('detailBadge');
    badge.className = `status-badge ${appViewModel.ui.cssClass}`;
    badge.textContent = appViewModel.ui.text;

    const permListContainer = document.getElementById('detailPermsList');
    permListContainer.innerHTML = '';

    if (appViewModel.permissionsList.length === 0)
    {
        permListContainer.innerHTML = '<div class="empty-message">No permissions declared for this app</div>';
        document.getElementById('selectAllBtn').disabled = true;
        document.getElementById('deselectAllBtn').disabled = true;
        document.getElementById('detailSearchInput').disabled = true;
        updateDetailActionButtons();
        return;
    }

    document.getElementById('selectAllBtn').disabled = appViewModel.ui.disabled;
    document.getElementById('deselectAllBtn').disabled = appViewModel.ui.disabled;
    document.getElementById('detailSearchInput').disabled = appViewModel.ui.disabled;

    appViewModel.permissionsList.forEach(permVM =>
    {
        const label = document.createElement('label');
        label.className = 'perm-card';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = permVM.rawName;
        checkbox.checked = permVM.isCheckable;
        checkbox.disabled = permVM.isDisabled;

        const info = document.createElement('div');
        info.className = 'perm-info';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'perm-card-header';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'perm-name';
        nameSpan.textContent = permVM.cleanName;

        const tag = document.createElement('span');
        tag.className = `perm-tag ${permVM.tagClass}`;
        tag.textContent = permVM.tagText;

        cardHeader.appendChild(nameSpan);
        cardHeader.appendChild(tag);

        const descSpan = document.createElement('p');
        descSpan.className = 'perm-desc';
        descSpan.textContent = permVM.description;

        info.appendChild(cardHeader);
        info.appendChild(descSpan);

        label.appendChild(checkbox);
        label.appendChild(info);
        permListContainer.appendChild(label);
    });

    const searchEmptyMsg = document.createElement('div');
    searchEmptyMsg.id = 'detailEmptyMessage';
    searchEmptyMsg.className = 'empty-message';
    searchEmptyMsg.textContent = 'No permissions match your search';
    searchEmptyMsg.style.display = 'none';
    permListContainer.appendChild(searchEmptyMsg);

    updateDetailActionButtons();
    applyDetailFilter();
}

async function openAppDetailView(app)
{
    if (!activeTargetApp || activeTargetApp.id !== app.id)
    {
        const searchInput = document.getElementById('detailSearchInput');
        if(searchInput) searchInput.value = '';
        const clearBtn = document.getElementById('clearDetailSearchBtn');
        if(clearBtn) clearBtn.style.display = 'none';
    }

    activeTargetApp = app;
    let viewModel = appViewModelDict[app.id] || new AppViewModel(app, new AppSnapshot(AppStatus.LOADING));

    renderDetailContent(viewModel);
    
    document.getElementById('mainView').classList.remove('active');
    document.getElementById('detailView').classList.add('active');
    window.scrollTo(0, 0);

    if (!appViewModelDict[app.id] || viewModel.status === AppStatus.LOADING)
    {
        const inspectionResult = await inspectAppPermissions(app);
        const freshViewModel = new AppViewModel(app, inspectionResult);
        appViewModelDict[app.id] = freshViewModel;
        
        if (activeTargetApp && activeTargetApp.id === app.id) renderDetailContent(freshViewModel);
    }
}

function updateDetailActionButtons()
{
    if (!activeTargetApp) return;
    const viewModel = appViewModelDict[activeTargetApp.id];
    if (!viewModel) return;

    const hasChecked = document.querySelectorAll('#detailPermsList input[type="checkbox"]:checked').length > 0;

    document.getElementById('grantSelectedBtn').disabled = viewModel.ui.disabled || !hasChecked;
    document.getElementById('revokeSelectedBtn').disabled = viewModel.ui.disabled || !hasChecked;
}

function filterDetailPermissions(query)
{
    const cards = document.querySelectorAll('#detailPermsList .perm-card');
    let visibleCount = 0;

    cards.forEach(card =>
    {
        const name = card.querySelector('.perm-name').textContent.toLowerCase();
        const desc = card.querySelector('.perm-desc').textContent.toLowerCase();

        if (name.includes(query) || desc.includes(query))
        {
            card.style.display = 'flex';
            visibleCount++;
        }
        else
        {
            card.style.display = 'none';
        }
    });

    const emptyMsg = document.getElementById('detailEmptyMessage');
    if (emptyMsg)
    {
        emptyMsg.style.display = (visibleCount === 0 && cards.length > 0) ? 'block' : 'none';
    }
}

function applyDetailFilter()
{
    const detailInput = document.getElementById('detailSearchInput');
    if (detailInput)
    {
        const query = (detailInput.value || '').toLowerCase();
        filterDetailPermissions(query);
    }
}

// #endregion DETAIL VIEW
///////////////////////////////////////////////////////////////////////////////


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

    if (goBackAfter) showMainView();
    alertUi(successMessage);
}

document.getElementById('grantAllBtn').onclick = () =>
    runBulkPermissionAction({
        action: 'grant',
        targets: appStore.map(a => ({ pkg: a.package, perms: a.permissions })),
        confirmMessage: "Are you sure you want to grant full permissions to all supported apps?",
        confirmOptions: { title: "Grant all", confirmText: "Grant all" },
        loadingText: "Granting permissions...",
        successMessage: "All permissions granted successfully."
    });

document.getElementById('revokeAllBtn').onclick = () =>
    runBulkPermissionAction({
        action: 'revoke',
        targets: appStore.map(a => ({ pkg: a.package, perms: a.permissions })),
        confirmMessage: "Are you sure you want to revoke full permissions from all supported apps?",
        confirmOptions: { title: "Revoke all", confirmText: "Revoke all", danger: true },
        loadingText: "Revoking permissions...",
        successMessage: "All permissions revoked successfully."
    });

function runSelectedPermissionAction(action)
{
    if (!activeTargetApp) return;
    const selectedPerms = [...document.querySelectorAll('#detailPermsList input[type="checkbox"]:checked')].map(cb => cb.value);
    const targetName = activeTargetApp.name;

    const texts = action === 'grant'
        ? { verb: 'grant', ing: 'Granting', done: 'granted', prep: 'to' }
        : { verb: 'revoke', Revoking: 'Revoking', done: 'revoked', prep: 'from' };

    runBulkPermissionAction({
        action,
        targets: selectedPerms.length ? [{ pkg: activeTargetApp.package, perms: selectedPerms }] : [],
        emptyMessage: `No permissions selected to ${texts.verb}.`,
        loadingText: `${texts.ing} permissions...`,
        successMessage: `Permissions successfully ${texts.done} ${texts.prep} <b>${targetName}</b> app.`,
        goBackAfter: true
    });
}

document.getElementById('grantSelectedBtn').onclick = () => runSelectedPermissionAction('grant');
document.getElementById('revokeSelectedBtn').onclick = () => runSelectedPermissionAction('revoke');

document.getElementById('backBtn').onclick = showMainView;

document.getElementById('detailPermsList').addEventListener('change', () => updateDetailActionButtons());

function setAllDetailCheckboxes(checked)
{
    document.querySelectorAll('#detailPermsList .perm-card').forEach(card =>
    {
        if (card.style.display === 'none') return;
        const cb = card.querySelector('input[type="checkbox"]');
        if (cb && !cb.disabled) cb.checked = checked;
    });
    updateDetailActionButtons();
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
    currentSearchQuery = query;
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
        if (list)
        {
            list.innerHTML = '<div class="empty-message">Initialization error: ' + e.message + '</div>';
        }
    }
}

window.onload = init;
