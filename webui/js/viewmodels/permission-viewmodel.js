class PermissionViewModel
{
    constructor(permissionModel, isGranted, isAppUiDisabled)
    {
        this.rawName = permissionModel.rawName;
        this.cleanName = permissionModel.cleanName;
        this.description = permissionModel.description;

        this.isGranted = isGranted;

        this.tagText = isGranted ? 'Granted' : 'Not granted';
        this.tagClass = isGranted ? 'perm-tag-granted' : 'perm-tag-missing';
        this.isCheckable = !isAppUiDisabled && !isGranted;
        this.isDisabled = isAppUiDisabled;
    }
}
