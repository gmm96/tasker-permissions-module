import { AppStatus } from '../../domain/enums/app-status.js';


export class AppCondition
{
    constructor(status, grantedPermissionsMap)
    {
        this.status = status || AppStatus.ERROR;
        this.permissions = grantedPermissionsMap || {}; 
    }
}
