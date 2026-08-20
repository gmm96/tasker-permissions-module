class AppCondition
{
    constructor(status, grantedPermissionsMap)
    {
        this.status = status || AppStatus.ERROR;
        this.permissions = grantedPermissionsMap || {}; 
    }
}
