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

function renderMainButtons(appViewModels)
{
    let revokeAllBtnDisabled = true;
    let grantAllBtnDisabled = true;

    for (const appVM of Object.values(appViewModels))
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
