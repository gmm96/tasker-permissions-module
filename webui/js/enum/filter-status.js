class FilterStatus
{
    static ALLAPPS = new FilterStatus('all-apps');
    static ALLGRANTED = new FilterStatus('all-granted');
    static NONEGRANTED = new FilterStatus('none-granted');
    static PARTIAL = new FilterStatus('partial');
    static NOTINSTALLED = new FilterStatus('not-installed');

    constructor(name)
    {
        this.name = name;
        Object.freeze(this);
    }

    toString()
    {
        return `FilterStatus.${this.name}`;
    }
}
