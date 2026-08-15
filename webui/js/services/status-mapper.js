class StatusMapper
{
    static #appToTab = new Map
    ([
        [AppStatus.NONEGRANTED.name, TabStatus.NONEGRANTED],
        [AppStatus.PARTIAL.name, TabStatus.PARTIAL],
        [AppStatus.ALLGRANTED.name, TabStatus.ALLGRANTED],
        [AppStatus.NOTINSTALLED.name, TabStatus.NOTINSTALLED]
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
