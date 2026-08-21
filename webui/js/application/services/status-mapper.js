class StatusMapper
{
    static #appToTab = new Map
    ([
        [AppStatus.NONEGRANTED, TabStatus.NONEGRANTED],
        [AppStatus.PARTIAL, TabStatus.PARTIAL],
        [AppStatus.ALLGRANTED, TabStatus.ALLGRANTED],
        [AppStatus.NOTINSTALLED, TabStatus.NOTINSTALLED]
    ]);

    static #tabToApp = new Map
    ([
        [TabStatus.NONEGRANTED, AppStatus.NONEGRANTED],
        [TabStatus.PARTIAL, AppStatus.PARTIAL],
        [TabStatus.ALLGRANTED, AppStatus.ALLGRANTED],
        [TabStatus.NOTINSTALLED, AppStatus.NOTINSTALLED]
    ]);

    static toTabStatus(appStatus)
    {
        return this.#appToTab.get(appStatus) ?? null;
    }

    static toAppStatus(tabStatus)
    {
        return this.#tabToApp.get(tabStatus) ?? null;
    }
}
