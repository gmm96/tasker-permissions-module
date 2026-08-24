const MainView = (() =>
{
    function show()
    {
        document.getElementById('detailView').classList.remove('active');
        document.getElementById('mainView').classList.add('active');
        window.scrollTo(0, 0);
    }
    
    function setupTabs(onTabChange)
    {
        const tabs = document.querySelectorAll('.tab-btn');

        tabs.forEach(tab =>
        {
            tab.onclick = () =>
            {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                onTabChange(tab.getAttribute('data-filter'));
            };
        });
    }

    function renderList(tabApps, appViewModelDict, onAppClick)
    {
        const list = document.getElementById('appsList');
        if (!list) return;
        list.innerHTML = '';

        tabApps.forEach(app =>
        {
            const appViewModel = appViewModelDict[app.id];
            if (!appViewModel) return;

            const item = document.createElement('div');
            item.className = 'app-item';
            item.onclick = () => onAppClick(app);

            const leftSec = document.createElement('div');
            leftSec.className = 'app-item-left';

            const icon = document.createElement('img');
            icon.className = 'app-icon';
            icon.src = appViewModel.iconPath;
            icon.alt = appViewModel.name;
            icon.onerror = () => { icon.src = 'assets/android.png'; };

            const info = document.createElement('div');
            info.className = 'app-info';

            const name = document.createElement('p');
            name.className = 'app-name';
            name.textContent = appViewModel.name;

            const pkg = document.createElement('p');
            pkg.className = 'app-package';
            pkg.textContent = appViewModel.package;

            info.appendChild(name);
            info.appendChild(pkg);

            leftSec.appendChild(icon);
            leftSec.appendChild(info);

            const badge = document.createElement('span');
            badge.className = `status-badge ${appViewModel.tagClass}`;
            badge.textContent = appViewModel.tagText;

            item.appendChild(leftSec);
            item.appendChild(badge);
            list.appendChild(item);
        });

        if (tabApps.length === 0)
        {
            list.innerHTML = '<div class="empty-message">No applications found in this category</div>';
        }
    }

    function updateTabCounts(counts)
    {
        for (const tab of Object.values(TabStatus))
        {
            const element = document.getElementById(`count-${tab}`);
            if (element) element.textContent = counts[tab];
        }
    }

    function renderMainActionButtons(appViewModels)
    {
        let revokeAllBtnDisabled = true;
        let grantAllBtnDisabled = true;

        for (const appVM of appViewModels)
        {
            if (!appVM.disabled)
            {
                if (appVM.status !== AppStatus.NONEGRANTED) revokeAllBtnDisabled = false;
                if (appVM.status !== AppStatus.ALLGRANTED) grantAllBtnDisabled = false;
            }
        }

        document.getElementById('revokeAllBtn').disabled = revokeAllBtnDisabled;
        document.getElementById('grantAllBtn').disabled = grantAllBtnDisabled;
    }


    return {
        show,
        setupTabs,
        renderList,
        updateTabCounts,
        renderMainActionButtons
    };

})();
