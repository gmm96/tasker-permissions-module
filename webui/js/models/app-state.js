class AppState
{
    constructor(status, text, cssClass, permissions) 
    {
        this.status = status;
        this.text = text;
        this.cssClass = cssClass;
        this.permissions = permissions || [];
    }
}
