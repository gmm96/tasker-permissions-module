class PermissionStatus
{
    static GRANTED = new Status('GRANTED');
    static NOTGRANTED = new Status('NOTGRANTED');

    constructor(name)
    {
        this.name = name;
        Object.freeze(this);
    }

    toString()
    {
        return `Status.${this.name}`;
    }
}
