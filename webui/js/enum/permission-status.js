class PermissionStatus
{
    static GRANTED = new Status('granted');
    static NOTGRANTED = new Status('not-granted');

    constructor(name)
    {
        this.name = name;
        Object.freeze(this);
    }

    toString()
    {
        return `PermissionStatus.${this.name}`;
    }
}
