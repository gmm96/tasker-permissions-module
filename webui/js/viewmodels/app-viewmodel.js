class AppViewModel
{
    constructor(app, appCondition)
    {
        this.id = app.id;
        this.name = app.name;
        this.package = app.package;
        this.icon = app.icon || '';
        this.status = appCondition.status;
        this.ui = this.#buildUiProperties(
            app.permissions.length,
            Object.values(appCondition.permissions).filter(Boolean).length
        );
        this.permissionViewModels = (app.permissions || [])
            .map(perm => new PermissionViewModel(perm, !!appCondition.permissions[perm.name], this.ui.disabled))
            .sort((a, b) => a.cleanName.localeCompare(b.cleanName));
    }
    
    get iconPath()
    {
        return `assets/app_icons/${this.icon}`;
    }

    #buildUiProperties(totalPerms, totalGranted)
    {
        switch (this.status)
        {
            case AppStatus.LOADING:
                return { text: 'Checking...', cssClass: 'badge-loading', disabled: true };
            case AppStatus.ERROR:
                return { text: 'Unavailable', cssClass: 'badge-error', disabled: true };
            case AppStatus.NOTINSTALLED:
                return { text: 'Not installed', cssClass: 'badge-not-installed', disabled: true };
            case AppStatus.NONEGRANTED:
                return { text: 'None granted', cssClass: 'badge-none-granted', disabled: false };
            case AppStatus.ALLGRANTED:
                return { text: 'All granted', cssClass: 'badge-all-granted', disabled: false };
            case AppStatus.PARTIAL:
                return { text: `Partial (${totalGranted}/${totalPerms})`, cssClass: 'badge-partial', disabled: false };
            default:
                return { text: 'Unknown', cssClass: 'badge-error', disabled: true };
        }
    }
}
