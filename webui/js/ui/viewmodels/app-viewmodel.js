import { AppStatus } from '../../domain/enums/app-status.js';
import { PermissionViewModel } from './permission-viewmodel.js';


export class AppViewModel
{
    constructor(app, appCondition)
    {
        this.id = app.id;
        this.name = app.name;
        this.package = app.package;
        this.icon = app.icon || '';
        this.status = appCondition.status;
        this.#buildUiProperties(
            app.permissions.length,
            Object.values(appCondition.permissions).filter(Boolean).length
        );
        this.permissionViewModels = (app.permissions || [])
            .map(perm => new PermissionViewModel(perm, !!appCondition.permissions[perm.name], this.disabled))
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
                this.tagText = 'Checking...'; this.tagClass = 'badge-loading'; this.disabled = true; break;
            case AppStatus.ERROR:
                this.tagText = 'Unavailable'; this.tagClass = 'badge-error'; this.disabled = true; break;
            case AppStatus.NOTINSTALLED:
                this.tagText = 'Not installed'; this.tagClass = 'badge-not-installed'; this.disabled = true; break;
            case AppStatus.NONEGRANTED:
                this.tagText = 'None granted'; this.tagClass = 'badge-none-granted'; this.disabled = false; break;
            case AppStatus.ALLGRANTED:
                this.tagText = 'All granted'; this.tagClass = 'badge-all-granted'; this.disabled = false; break;
            case AppStatus.PARTIAL:
                this.tagText = `Partial (${totalGranted}/${totalPerms})`; this.tagClass = 'badge-partial'; this.disabled = false; break;
            default:
                this.tagText = 'Unknown'; this.tagClass = 'badge-error'; this.disabled = true; break;
        }
    }
}
