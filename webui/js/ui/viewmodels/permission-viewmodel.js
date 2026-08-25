export class PermissionViewModel
{
    constructor(permission, isGranted, isAppUiDisabled)
    {
        this.name = permission.name;
        this.cleanName = permission.cleanName;
        this.description = permission.description;
        this.isGranted = isGranted;
        
        this.#buildUiProperties(isGranted, isAppUiDisabled);
    }
    
    #buildUiProperties(isGranted, isAppUiDisabled)
    {
        this.tagText = isGranted ? 'Granted' : 'Not granted';
        this.tagClass = isGranted ? 'perm-tag-granted' : 'perm-tag-missing';
        this.checked = !isAppUiDisabled && !isGranted;
        this.disabled = isAppUiDisabled;
    }
}
