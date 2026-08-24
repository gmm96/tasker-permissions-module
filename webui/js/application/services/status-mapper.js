const StatusMapper = (() =>
{
    const appToTab = new Map
    ([
        [AppStatus.NONEGRANTED, TabStatus.NONEGRANTED],
        [AppStatus.PARTIAL, TabStatus.PARTIAL],
        [AppStatus.ALLGRANTED, TabStatus.ALLGRANTED],
        [AppStatus.NOTINSTALLED, TabStatus.NOTINSTALLED]
    ]);

    const tabToApp = new Map
    ([
        [TabStatus.NONEGRANTED, AppStatus.NONEGRANTED],
        [TabStatus.PARTIAL, AppStatus.PARTIAL],
        [TabStatus.ALLGRANTED, AppStatus.ALLGRANTED],
        [TabStatus.NOTINSTALLED, AppStatus.NOTINSTALLED]
    ]);

    function appStatustoTabStatus(appStatus)
    {
        return appToTab.get(appStatus) ?? null;
    }

    function tabStatustoAppStatus(tabStatus)
    {
        return tabToApp.get(tabStatus) ?? null;
    }

    
    return {
        appStatustoTabStatus,
        tabStatustoAppStatus
    }

})();
