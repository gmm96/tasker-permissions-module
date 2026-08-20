class App
{
    constructor(id, name, packageName, permissions, icon = null)
    {
        this.id = id;
        this.name = name;
        this.package = packageName;
        this.permissions = permissions || [];
        this.icon = icon;
        Object.freeze(this);
    }
}
