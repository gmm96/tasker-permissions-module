let appsData = (typeof APPS_DATA !== 'undefined') ? APPS_DATA : [];
appsData.sort((a, b) => a.name.localeCompare(b.name));
let appsStatusMap = {};
let currentFilter = 'all-apps';
let currentSearchQuery = '';
let activeTargetApp = null;

function getPermCleanName(fullPerm)
{
    return fullPerm.replace(/^android\.permission\./i, '');
}

function getPermDescription(fullPerm)
{
    return PERMISSION_INFO[fullPerm] || "";
}

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

// Control del Spinner
function showLoadingSpinner(text = 'Processing...') 
{
    const overlay = document.getElementById('loadingOverlay');
    const textEl = document.getElementById('loadingText');
    if (overlay && textEl) {
        textEl.textContent = text;
        overlay.classList.add('active');
        // Bloquea el scroll del fondo
        document.body.style.overflow = 'hidden';
    }
}

function hideLoadingSpinner() 
{
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        // Restaura el scroll del fondo
        document.body.style.overflow = '';
    }
}

function isPermissionGrantedInDumpsys(dumpResult, permission) {
    if (!dumpResult) return false;
    const escaped = permission.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const grantedRegex = new RegExp(`^\\s*${escaped}:\\s*granted=true`, 'm');
    return grantedRegex.test(dumpResult);
}

async function inspectAppStatus(app)
{
    const bridge = await tryBridgeCall();

    if (!bridge)
    {
        showBridgeDebug('No window.Shizuku bridge object found.');
        return { statusKey: AppStatus.ERROR, text: 'Unavailable', class: 'badge-error', permsState: {} };
    }

    const trustInfo = await getModuleTrustInfo();
    if (trustInfo && trustInfo.trusted === false)
    {
        showBridgeDebug(
            `Module "${trustInfo.id || 'hidden-permissions'}" is not trusted (mode: ${trustInfo.accessMode || 'unknown'}). ` +
            `Long-press this module's card in Shevery/Nightzuku/Shizuku ADB Module Manager and grant Full Trust / Full Access.`
        );
        return{ statusKey: AppStatus.ERROR, text: 'Module not trusted', class: 'badge-error', permsState: {} };
    }

    try
    {
        const pkgResult = await executeShell(`pm list packages ${app.package}`);
        if (pkgResult === null)
        {
            showBridgeDebug();
            return { statusKey: AppStatus.ERROR, text: 'Unavailable', class: 'badge-error', permsState: {} };
        }
        if (!pkgResult.includes(`package:${app.package}`))
        {
            return { statusKey: AppStatus.NOTINSTALLED, text: 'Not installed', class: 'badge-not-installed', permsState: {} };
        }

        const dumpsysResult = await executeShell(`dumpsys package ${app.package}`);
        const permsState = {};
        let grantedCount = 0;

        for (const permission of app.permissions)
        {
            const isGranted = isPermissionGrantedInDumpsys(dumpsysResult, permission);

            permsState[permission] = isGranted;
            if (isGranted) grantedCount++;
        }

        const total = app.permissions.length;
        let key = AppStatus.PARTIAL; let text = `Partial (${grantedCount}/${total})`; let cssClass = 'badge-partial';

        if (grantedCount === 0)
        {
            key = AppStatus.NONEGRANTED; text = 'None granted'; cssClass = 'badge-none-granted';
        }
        else if (grantedCount === total)
        {
            key = AppStatus.ALLGRANTED; text = 'All granted'; cssClass = 'badge-all-granted';
        }

        return { statusKey: key, text, class: cssClass, permsState };
    }
    catch (e)
    {
        console.error("Error inspecting " + app.id, e);
        return { statusKey: AppStatus.ERROR, text: 'Verification failed', class: 'badge-error', permsState: {} };
    }
}

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
            list.innerHTML = '<div class="empty-message">Error de inicialización: ' + e.message + '</div>';
        }
    }
}

function setupTabs()
{
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab =>
    {
        tab.onclick = () =>
        {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-filter');
            renderList();
        };
    });
}

function renderList()
{
    const list = document.getElementById('appsList');
    if (!list) return;
    list.innerHTML = '';
    let visibleCount = 0;

    appsData.forEach(app =>
    {
        const statusInfo = appsStatusMap[app.id] || { statusKey: AppStatus.LOADING, text: 'Checking...', class: 'badge-loading' };
        
        if (currentFilter !== 'all-apps') 
        {
            const targetStatus = getStatusFromFilter(currentFilter);
            if (statusInfo.statusKey !== targetStatus) return;
        }

        if (currentSearchQuery)
        {
            const nameMatch = app.name.toLowerCase().includes(currentSearchQuery);
            const pkgMatch = app.package.toLowerCase().includes(currentSearchQuery);
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
        icon.src = getAppIconPath(app.icon);
        icon.alt = app.name;
        icon.onerror = () => { icon.src = 'assets/android.png'; };

        const info = document.createElement('div');
        info.className = 'app-info';

        const name = document.createElement('p');
        name.className = 'app-name';
        name.textContent = app.name;

        const pkg = document.createElement('p');
        pkg.className = 'app-package';
        pkg.textContent = app.package;

        info.appendChild(name);
        info.appendChild(pkg);

        leftSec.appendChild(icon);
        leftSec.appendChild(info);

        const badge = document.createElement('span');
        badge.className = `status-badge ${statusInfo.class}`;
        badge.textContent = statusInfo.text;

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
    const revokeAllBtnDisabled = Object.values(appsStatusMap).every(statusInfo =>
        statusInfo.statusKey === AppStatus.NOTINSTALLED ||
        statusInfo.statusKey === AppStatus.ERROR ||
        statusInfo.statusKey === AppStatus.NONEGRANTED
    );
    const grantAllBtnDisabled = Object.values(appsStatusMap).every(statusInfo =>
        statusInfo.statusKey === AppStatus.NOTINSTALLED ||
        statusInfo.statusKey === AppStatus.ERROR ||
        statusInfo.statusKey == AppStatus.ALLGRANTED
    );
    
    document.getElementById('revokeAllBtn').disabled = revokeAllBtnDisabled;
    document.getElementById('grantAllBtn').disabled = grantAllBtnDisabled;
}

async function updateAllStatuses()
{
    const counts = {
        'all-apps': appsData.length,
        'none-granted': 0,
        'partial': 0,
        'all-granted': 0,
        'not-installed': 0
    };

    for (const app of appsData)
    {
        const status = await inspectAppStatus(app);
        appsStatusMap[app.id] = status;
        const filterStr = getFilterFromStatus(status.statusKey);

        if (filterStr && counts[filterStr] !== undefined)
        {
            counts[filterStr]++;
        }
    }

    document.getElementById('count-all-apps').textContent = counts['all-apps'];
    document.getElementById('count-none-granted').textContent = counts['none-granted'];
    document.getElementById('count-partial').textContent = counts['partial'];
    document.getElementById('count-all-granted').textContent = counts['all-granted'];
    document.getElementById('count-not-installed').textContent = counts['not-installed'];
    
    renderMainButtons();
    renderList();
}

function renderDetailContent(app, statusInfo)
{
    const uiDisabled =
        statusInfo.statusKey === AppStatus.NOTINSTALLED ||
        statusInfo.statusKey === AppStatus.ERROR;
    
    const perms = [...document.querySelectorAll('#detailPermsList input[type="checkbox"]:checked')].map(x => x.value);
    
    document.getElementById('detailTitle').textContent = app.name;
    document.getElementById('detailPackage').textContent = app.package;
    const icon = document.getElementById('detailIcon');
    icon.src = getAppIconPath(app.icon);
    icon.onerror = () => { icon.src = 'assets/android.png'; };

    const badge = document.getElementById('detailBadge');
    badge.className = `status-badge ${statusInfo.class || 'badge-loading'}`;
    badge.textContent = statusInfo.text || 'Checking...';

    const permListContainer = document.getElementById('detailPermsList');
    permListContainer.innerHTML = '';

    if (!app.permissions || app.permissions.length === 0)
    {
        permListContainer.innerHTML = '<div class="empty-message">No permissions declared for this app</div>';
        document.getElementById('selectAllBtn').disabled = true;
        document.getElementById('deselectAllBtn').disabled = true;
        document.getElementById('detailSearchInput').disabled = true;
        updateDetailActionButtons();
        return;
    }

    document.getElementById('selectAllBtn').disabled = uiDisabled;
    document.getElementById('deselectAllBtn').disabled = uiDisabled;
    document.getElementById('detailSearchInput').disabled = uiDisabled;

    const sortedPermissions = [...app.permissions].sort((a, b) => 
        getPermCleanName(a).localeCompare(getPermCleanName(b))
    );

    sortedPermissions.forEach(perm =>
    {
        const isGranted = statusInfo.permsState ? !!statusInfo.permsState[perm] : false;

        const label = document.createElement('label');
        label.className = 'perm-card';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = perm;
        checkbox.checked = !isGranted;
        checkbox.disabled = uiDisabled;

        const info = document.createElement('div');
        info.className = 'perm-info';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'perm-card-header';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'perm-name';
        nameSpan.textContent = getPermCleanName(perm);

        const tag = document.createElement('span');
        tag.className = `perm-tag ${isGranted ? 'perm-tag-granted' : 'perm-tag-missing'}`;
        tag.textContent = isGranted ? 'Granted' : 'Not granted';

        cardHeader.appendChild(nameSpan);
        cardHeader.appendChild(tag);

        const descSpan = document.createElement('p');
        descSpan.className = 'perm-desc';
        descSpan.textContent = getPermDescription(perm);

        info.appendChild(cardHeader);
        info.appendChild(descSpan);

        label.appendChild(checkbox);
        label.appendChild(info);
        permListContainer.appendChild(label);
    });

    // Crear el mensaje oculto de "no hay resultados" para la búsqueda
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
    // Reseteamos el buscador si entramos a una aplicación distinta a la anterior
    if (!activeTargetApp || activeTargetApp.id !== app.id)
    {
        const searchInput = document.getElementById('detailSearchInput');
        if(searchInput) searchInput.value = '';
        const clearBtn = document.getElementById('clearDetailSearchBtn');
        if(clearBtn) clearBtn.style.display = 'none';
    }

    activeTargetApp = app;
    let statusInfo = appsStatusMap[app.id] || { key: AppStatus.LOADING, text: 'Checking...', class: 'badge-loading', permsState: {} };

    renderDetailContent(app, statusInfo);
    
    document.getElementById('mainView').classList.remove('active');
    document.getElementById('detailView').classList.add('active');
    window.scrollTo(0, 0);

    if (!appsStatusMap[app.id] || statusInfo.statusKey === AppStatus.LOADING)
    {
        const freshStatus = await inspectAppStatus(app);
        appsStatusMap[app.id] = freshStatus;
        if (activeTargetApp && activeTargetApp.id === app.id)
        {
            renderDetailContent(app, freshStatus);
        }
    }
}

function updateDetailActionButtons()
{
    if (!activeTargetApp) return;

    const statusInfo = appsStatusMap[activeTargetApp.id] || {};
    const uiDisabled = statusInfo.statusKey === AppStatus.NOTINSTALLED || 
                       statusInfo.statusKey === AppStatus.ERROR;

    const hasChecked = document.querySelectorAll('#detailPermsList input[type="checkbox"]:checked').length > 0;

    document.getElementById('grantSelectedBtn').disabled = uiDisabled || !hasChecked;
    document.getElementById('revokeSelectedBtn').disabled = uiDisabled || !hasChecked;
}

function filterDetailPermissions(query)
{
    const cards = document.querySelectorAll('#detailPermsList .perm-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const name = card.querySelector('.perm-name').textContent.toLowerCase();
        const desc = card.querySelector('.perm-desc').textContent.toLowerCase();

        if (name.includes(query) || desc.includes(query)) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const emptyMsg = document.getElementById('detailEmptyMessage');
    if (emptyMsg) {
        if (visibleCount === 0 && cards.length > 0) {
            emptyMsg.style.display = 'block';
        } else {
            emptyMsg.style.display = 'none';
        }
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

function getStatusFromFilter(filterId)
{
    switch (filterId)
    {
        case 'none-granted':  return AppStatus.NONEGRANTED;
        case 'partial':       return AppStatus.PARTIAL;
        case 'all-granted':   return AppStatus.ALLGRANTED;
        case 'not-installed': return AppStatus.NOTINSTALLED;
        default:              return null;
    }
}

function getFilterFromStatus(appStatus)
{
    switch (appStatus)
    {
        case AppStatus.NONEGRANTED:  return 'none-granted';
        case AppStatus.PARTIAL:      return 'partial';
        case AppStatus.ALLGRANTED:   return 'all-granted';
        case AppStatus.NOTINSTALLED: return 'not-installed';
        default:                     return null;
    }
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

async function processPermissions(pkg, perms, action)
{
    for (const perm of perms)
    {
        try
        {
            await executeShell(`pm ${action} ${pkg} ${perm}`);
        }
        catch(e)
        {
            console.error(`Failed ${action} ${perm} for ${pkg}`, e);
        }
    }
}


///////////////////////////////////////////////////////////////////////////////
// #region BUTTONS

document.getElementById('grantAllBtn').onclick = async () =>
{
    if (appsData.length === 0) return;
    const ok = await confirmUi(
        "Are you sure you want to grant all permissions to all installed applications?",
        {
            title: "Grant all",
            confirmText: "Grant all"
        }
    );
    if (!ok) return;

    if (!(await ensureBridgeReady())) return;
    
    showLoadingSpinner("Granting all permissions...");
    
    // CRÍTICO: Ceder el control al WebView 100ms para pintar el UI antes de colapsar el event loop
    await new Promise(r => setTimeout(r, 100)); 
    
    try {
        for (const app of appsData)
        {
            await processPermissions(app.package, app.permissions, 'grant');
        }
        await updateAllStatuses();
    } finally {
        hideLoadingSpinner();
    }
    
    alertUi("All permissions granted successfully.");
};

document.getElementById('grantSelectedBtn').onclick = async () =>
{
    if (!activeTargetApp) return;

    const checkboxes = document.querySelectorAll('#detailPermsList input[type="checkbox"]:checked');
    const selectedPerms = Array.from(checkboxes).map(cb => cb.value);

    if (selectedPerms.length === 0)
    {
        alertUi("No permissions selected to grant.");
        return;
    }

    if (!(await ensureBridgeReady())) return;

    // Guardamos el nombre antes de que se limpie la variable global
    const targetName = activeTargetApp.name;

    showLoadingSpinner(`Granting permissions to ${targetName}...`);
    
    // CRÍTICO: Ceder el control al WebView 100ms
    await new Promise(r => setTimeout(r, 100)); 
    
    try {
        await processPermissions(activeTargetApp.package, selectedPerms, 'grant');
        await updateAllStatuses();
    } finally {
        hideLoadingSpinner();
    }

    showMainView();
    alertUi(`Permissions successfully granted to ${targetName}`);
};

document.getElementById('revokeAllBtn').onclick = async () =>
{
    const ok = await confirmUi(
        "Are you sure you want to revoke all permissions from all installed applications?",
        {
            title: "Revoke all",
            confirmText: "Revoke all",
            danger: true
        }
    );
    if (!ok) return;
    
    if (!(await ensureBridgeReady())) return;
    
    showLoadingSpinner("Revoking all permissions...");
    
    // CRÍTICO: Ceder el control al WebView 100ms
    await new Promise(r => setTimeout(r, 100));
    
    try {
        for (const app of appsData)
        {
            await processPermissions(app.package, app.permissions, 'revoke');
        }
        await updateAllStatuses();
    } finally {
        hideLoadingSpinner();
    }
    
    alertUi("All permissions revoked successfully.");
};

document.getElementById('revokeSelectedBtn').onclick = async () =>
{
    if (!activeTargetApp) return;

    const perms = [...document.querySelectorAll('#detailPermsList input[type="checkbox"]:checked')].map(x => x.value);
    if (!perms.length)
    {
        alertUi("No permissions selected to revoke.");
        return;
    }

    if (!(await ensureBridgeReady())) return;
    
    // Guardamos el nombre antes de que se limpie la variable global
    const targetName = activeTargetApp.name;

    showLoadingSpinner(`Revoking permissions from ${targetName}...`);
    
    // CRÍTICO: Ceder el control al WebView 100ms
    await new Promise(r => setTimeout(r, 100));
    
    try {
        await processPermissions(activeTargetApp.package, perms, 'revoke');
        await updateAllStatuses();
    } finally {
        hideLoadingSpinner();
    }

    showMainView();
    alertUi(`Permissions successfully revoked from ${targetName}`);
};

function showMainView()
{
    document.getElementById('detailView').classList.remove('active');
    document.getElementById('mainView').classList.add('active');
    activeTargetApp = null;
}

document.getElementById('backBtn').onclick = showMainView;

document.getElementById('detailPermsList').addEventListener('change', () =>
{
    updateDetailActionButtons();
});

// Los botones Select All / Clear All ahora sólo aplican a los permisos VISIBLES en la búsqueda
document.getElementById('selectAllBtn').onclick = () =>
{
    const cards = document.querySelectorAll('#detailPermsList .perm-card');
    cards.forEach(card => {
        if (card.style.display !== 'none') {
            const cb = card.querySelector('input[type="checkbox"]');
            if (cb && !cb.disabled) cb.checked = true;
        }
    });
    updateDetailActionButtons();
};

document.getElementById('deselectAllBtn').onclick = () =>
{
    const cards = document.querySelectorAll('#detailPermsList .perm-card');
    cards.forEach(card => {
        if (card.style.display !== 'none') {
            const cb = card.querySelector('input[type="checkbox"]');
            if (cb && !cb.disabled) cb.checked = false;
        }
    });
    updateDetailActionButtons();
};

// Search listeners para la vista principal
document.getElementById('searchInput').addEventListener('input', (e) =>
{
    currentSearchQuery = e.target.value.toLowerCase();
    const clearBtn = document.getElementById('clearSearchBtn');
    
    if (e.target.value.length > 0)
    {
        clearBtn.style.display = 'flex';
    }
    else
    {
        clearBtn.style.display = 'none';
    }
    
    renderList();
});

document.getElementById('clearSearchBtn').addEventListener('click', () =>
{
    const input = document.getElementById('searchInput');
    input.value = '';
    currentSearchQuery = '';
    document.getElementById('clearSearchBtn').style.display = 'none';
    
    renderList();
    input.focus();
});

// Search listeners para la vista de detalle
document.getElementById('detailSearchInput').addEventListener('input', (e) =>
{
    const query = e.target.value.toLowerCase();
    const clearBtn = document.getElementById('clearDetailSearchBtn');
    
    if (e.target.value.length > 0)
    {
        clearBtn.style.display = 'flex';
    }
    else
    {
        clearBtn.style.display = 'none';
    }
    
    filterDetailPermissions(query);
});

document.getElementById('clearDetailSearchBtn').addEventListener('click', () =>
{
    const input = document.getElementById('detailSearchInput');
    input.value = '';
    document.getElementById('clearDetailSearchBtn').style.display = 'none';
    
    filterDetailPermissions('');
    input.focus();
});

// #endregion BUTTONS
///////////////////////////////////////////////////////////////////////////////

window.onload = init;
