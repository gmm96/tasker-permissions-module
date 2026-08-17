class AppModel
{
    constructor(status, text, cssClass, permissions) 
    {
        this.status = status || AppStatus.ERROR;
        this.text = text || '';
        this.cssClass = cssClass;
        this.permissions = permissions || {};
    }
}
