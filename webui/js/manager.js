// Only the permissions listed here are backed by an App Ops check
// instead of (or in addition to) the dumpsys "granted=" flag.
// The op name is NOT always the same string as the permission name.
const PERMISSION_APPOPS_MAP =
{
    "android.permission.PACKAGE_USAGE_STATS": "GET_USAGE_STATS"
};

let appsData = (typeof APPS_DATA !== 'undefined') ? APPS_DATA : [];
let appsStatusMap = {};
let currentFilter = 'all';
let activeTargetApp = null;

// alertUi / confirmUi ahora viven en js/dialogs.js (se cargan antes que este script)

function getCleanPermName(fullPerm)
{
    return fullPerm.replace(/^android\.permission\./i, '');
}

function getPermDescription(fullPerm)
{
    return PERMISSION_INFO[fullPerm] || "";
}

async function tryBridgeCall()
{
    if (window.Shizuku && typeof window.Shizuku.exec === 'function')
    {
        return {
            name: 'Shizuku.exec',
            run: (cmd) => window.Shizuku.exec(cmd)
        };
    }
    return null;
}

async function getModuleTrustInfo()
{
    if (!window.Shizuku || typeof window.Shizuku.getModuleInfo !== 'function') return null;
    try
    {
        return JSON.parse(window.Shizuku.getModuleInfo());
    }
    catch (e) {
        return null;
    }
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

async function executeShell(command)
{
    try
    {
        const bridge = await tryBridgeCall();
        if (!bridge) return null;

        const raw = await bridge.run(command);
        if (typeof raw !== 'string') return null;

        let parsed;
        try
        {
            parsed = JSON.parse(raw);
        }
        catch (e)
        {
            return raw;
        }

        if (parsed && typeof parsed === 'object')
        {
            if (parsed.ok === false)
            {
                console.warn('Shizuku.exec reported failure for:', command, parsed.stderr);
                return '';
            }
            return (parsed.stdout != null ? String(parsed.stdout) : '').trim();
        }
        return String(raw);
    }
    catch (err)
    {
        console.error("Shell execution error:", err);
        return null;
    }
}

// Matches a line like "  android.permission.DUMP: granted=true"
// Requires the ": granted=" suffix on the SAME line as the permission
// name, so a permission that is merely *requested* (listed under
// "requested permissions:" with no granted= status at all) is never
// mistaken for a granted one.
function isPermissionGrantedInDump(dumpResult, permission) {
    if (!dumpResult) return false;
    const escaped = permission.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const grantedRegex = new RegExp(`^\\s*${escaped}:\\s*granted=true`, 'm');
    return grantedRegex.test(dumpResult);
}

async function isPermissionGrantedViaAppOps(app, permission)
{
    const opName = PERMISSION_APPOPS_MAP[permission];
    if (!opName) return null; // not an app-ops-backed permission
    const appOpsResult = await executeShell(`appops get ${app.package} ${opName}`);
    if (!appOpsResult) return false;
    // "appops get" prints e.g. "GET_USAGE_STATS: allow" when granted.
    return /:\s*allow\b/i.test(appOpsResult);
}

async function inspectAppStatus(app)
{
    const bridge = await tryBridgeCall();

    if (!bridge)
    {
        showBridgeDebug('No window.Shizuku bridge object found.');
        return {
            statusKey: 'error',
            text: 'Unavailable',
            class: 'badge-error',
            permsState: {}
        };
    }

    const trustInfo = await getModuleTrustInfo();
    if (trustInfo && trustInfo.trusted === false)
    {
        showBridgeDebug(
            `Module "${trustInfo.id || 'tasker-permissions'}" is not trusted (mode: ${trustInfo.accessMode || 'unknown'}). ` +
            `Long-press this module's card in Shevery and grant Full Trust / Full Access.`
        );
        return{
            statusKey: 'error',
            text: 'Module not trusted',
            class: 'badge-error',
            permsState: {}
        };
    }

    try
    {
        const pkgResult = await executeShell(`pm list packages ${app.package}`);
        if (pkgResult === null)
            {
            // The bridge object exists but the call itself failed/threw.
            showBridgeDebug();
            return { statusKey: 'error', text: 'Unavailable', class: 'badge-error', permsState: {} };
        }
        if (!pkgResult.includes(`package:${app.package}`))
        {
            return {
                statusKey: 'not-installed',
                text: 'Not installed',
                class: 'badge-not-installed',
                permsState: {}
            };
        }

        const dumpResult = await executeShell(`dumpsys package ${app.package}`);
        const permsState = {};
        let grantedCount = 0;

        for (const permission of app.permissions)
        {
            const appOpsGranted = await isPermissionGrantedViaAppOps(app, permission);
            const isGranted = (appOpsGranted !== null)
                ? appOpsGranted
                : isPermissionGrantedInDump(dumpResult, permission);

            permsState[permission] = isGranted;
            if (isGranted) grantedCount++;
        }

        const total = app.permissions.length;
        let key = 'partial';
        let text = `Partial (${grantedCount}/${total})`;
        let cssClass = 'badge-partial';

        if (grantedCount === 0)
        {
            key = 'no-perms'; text = 'None granted'; cssClass = 'badge-no-perms';
        } else if (grantedCount === total)
        {
            key = 'all-perms'; text = 'All granted'; cssClass = 'badge-all';
        }

        return { statusKey: key, text, class: cssClass, permsState };
    }
    catch (e)
    {
        console.error("Error inspecting " + app.id, e);
        return {
            statusKey: 'error',
            text: 'Verification failed',
            class: 'badge-error',
            permsState: {}
        };
    }
}

async function init()
{
    try
    {
        setupTabs();
        renderList();
        renderMainButtons();
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
        const statusInfo = appsStatusMap[app.id] || { statusKey: 'loading', text: 'Checking...', class: 'badge-loading' };
        
        if (currentFilter !== 'all' && statusInfo.statusKey !== currentFilter) 
        {
            return;
        }
        visibleCount++;

        const item = document.createElement('div');
        item.className = 'app-item';
        item.onclick = () => openAppDetailView(app);

        const leftSec = document.createElement('div');
        leftSec.className = 'app-item-left';

        const icon = document.createElement('img');
        icon.className = 'app-icon';
        icon.src = app.icon;
        icon.alt = app.name;
        icon.onerror = () =>
        { 
            icon.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="%23b3b3b3"><path d="M5 3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5zm0 2h14v14H5V5zm4 2v2h6V7H9zm0 4v2h6v-2H9zm0 4v2h6v-2H9z"/></svg>'; 
        };

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
    const uiDisabled = Object.values(appsStatusMap).every(statusInfo =>
        statusInfo.statusKey === 'not-installed' ||
        statusInfo.statusKey === 'error'
    );
    
    document.getElementById('revokeAllBtn').disabled = uiDisabled;
    document.getElementById('grantAllBtn').disabled = uiDisabled;
}

async function updateAllStatuses()
{
    const counts = {
        'all': appsData.length,
        'no-perms': 0,
        'partial': 0,
        'all-perms': 0,
        'not-installed': 0
    };

    for (const app of appsData)
    {
        const status = await inspectAppStatus(app);
        appsStatusMap[app.id] = status;
        if (counts[status.statusKey] !== undefined)
        {
            counts[status.statusKey]++;
        }
    }

    document.getElementById('count-all').textContent = counts['all'];
    document.getElementById('count-no-perms').textContent = counts['no-perms'];
    document.getElementById('count-partial').textContent = counts['partial'];
    document.getElementById('count-all-perms').textContent = counts['all-perms'];
    document.getElementById('count-not-installed').textContent = counts['not-installed'];

    renderList();
}

function renderDetailContent(app, statusInfo)
{
    const uiDisabled =
        statusInfo.statusKey === 'not-installed' ||
        statusInfo.statusKey === 'error';
    
    document.getElementById('detailTitle').textContent = app.name;
    document.getElementById('detailPackage').textContent = app.package;
    document.getElementById('detailIcon').src = app.icon;

    const badge = document.getElementById('detailBadge');
    badge.className = `status-badge ${statusInfo.class || 'badge-loading'}`;
    badge.textContent = statusInfo.text || 'Checking...';

    const permListContainer = document.getElementById('detailPermsList');
    permListContainer.innerHTML = '';

    if (!app.permissions || app.permissions.length === 0)
    {
        permListContainer.innerHTML = '<div class="empty-message">No permissions declared for this app</div>';
        return;
    }

    document.getElementById('selectAllBtn').disabled = uiDisabled;
    document.getElementById('deselectAllBtn').disabled = uiDisabled;
    document.getElementById('applySelectedBtn').disabled = uiDisabled;
    document.getElementById('revokeSelectedBtn').disabled = uiDisabled;

    app.permissions.forEach(perm =>
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
        nameSpan.textContent = getCleanPermName(perm);

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
}

async function openAppDetailView(app)
{
    activeTargetApp = app;
    let statusInfo = appsStatusMap[app.id] || { text: 'Checking...', class: 'badge-loading', permsState: {} };

    renderDetailContent(app, statusInfo);
    
    document.getElementById('mainView').classList.remove('active');
    document.getElementById('detailView').classList.add('active');
    window.scrollTo(0, 0);

    if (!appsStatusMap[app.id] || statusInfo.statusKey === 'loading')
    {
        const freshStatus = await inspectAppStatus(app);
        appsStatusMap[app.id] = freshStatus;
        if (activeTargetApp && activeTargetApp.id === app.id)
        {
            renderDetailContent(app, freshStatus);
        }
    }
}

function showMainView()
{
    document.getElementById('detailView').classList.remove('active');
    document.getElementById('mainView').classList.add('active');
    activeTargetApp = null;
}

document.getElementById('backBtn').onclick = showMainView;

document.getElementById('selectAllBtn').onclick = () =>
{
    const checkboxes = document.querySelectorAll('#detailPermsList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
};

document.getElementById('deselectAllBtn').onclick = () =>
{
    const checkboxes = document.querySelectorAll('#detailPermsList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
};

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

document.getElementById('applySelectedBtn').onclick = async () =>
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

    await processPermissions(activeTargetApp.package, selectedPerms, 'grant');

    alertUi(`Permissions successfully processed for ${activeTargetApp.name}`);
    await updateAllStatuses();
    showMainView();
};

document.getElementById('grantAllBtn').onclick = async () =>
{
    if (appsData.length === 0) return;
    const ok = await confirmUi("Are you sure you want to grant all permissions to all installed applications?", {
        title: "Grant all",
        confirmText: "Grant all"
    });
    if (!ok) return;

    if (!(await ensureBridgeReady())) return;

    for (const app of appsData)
    {
        await processPermissions(app.package,app.permissions,'grant');
    }
    await updateAllStatuses();
    alertUi("Operation completed successfully.");
};

async function processPermissions(pkg, perms, action){
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

document.getElementById('revokeSelectedBtn').onclick = async () =>
{
    if (!activeTargetApp) return;
    const perms = [...document.querySelectorAll('#detailPermsList input[type="checkbox"]:checked')].map(x => x.value);
    if (!perms.length)
    {
        alertUi("No permissions selected.");
        return;
    }
    if (!(await ensureBridgeReady())) return;
    await processPermissions(activeTargetApp.package,perms,'revoke');
    alertUi(`Permissions successfully processed for ${activeTargetApp.name}`);
    await updateAllStatuses();
    showMainView();
};

document.getElementById('revokeAllBtn').onclick = async () =>
{
    const ok = await confirmUi("Are you sure you want to revoke all permissions from all installed applications?", {
        title: "Revoke all",
        confirmText: "Revoke all",
        danger: true
    });
    if (!ok) return;
    if (!(await ensureBridgeReady())) return;
    for (const app of appsData)
    {
        await processPermissions(app.package,app.permissions,'revoke');
    }
    await updateAllStatuses();
    alertUi("Operation completed successfully.");
};

window.onload = init;
