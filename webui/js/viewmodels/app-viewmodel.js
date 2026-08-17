class AppViewModel
{
    constructor(appModel, appStatus)
    {
        this.id = appModel.id;
        this.name = appModel.name;
        this.package = appModel.package;
        this.icon = appModel.icon;
        
        this.status = appStatus.status;
        
        this.ui = this.#_buildUiProperties(appModel.permissions.length, appStatus.permissions);
        
        this.permissionsList = (appModel.permissions || [])
            .map(permString => {
                const domainModel = new Permission(permString, PERMISSION_INFO[permString]);
                const isGranted = !!appStatus.permissions[permString];
                return new PermissionViewModel(domainModel, isGranted, this.ui.disabled);
            })
            .sort((a, b) => a.cleanName.localeCompare(b.cleanName));
    }

    #_buildUiProperties(totalPerms, grantedPermissionsMap)
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
                const granted = Object.values(grantedPermissionsMap).filter(Boolean).length;
                return { text: `Partial (${granted}/${totalPerms})`, cssClass: 'badge-partial', disabled: false };
            default:
                return { text: 'Unknown', cssClass: 'badge-error', disabled: true };
        }
    }
}
