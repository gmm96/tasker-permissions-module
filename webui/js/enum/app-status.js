class AppStatus
{
    static ALLGRANTED = new AppStatus('all-granted');
    static NONEGRANTED = new AppStatus('none-granted');
    static PARTIAL = new AppStatus('partial');
    static NOTINSTALLED = new AppStatus('not-installed');
    static ERROR = new AppStatus('error');
    static LOADING = new AppStatus('loading');

    constructor(name)
    {
        this.name = name;
        Object.freeze(this);
    }

    toString()
    {
        return `AppStatus.${this.name}`;
    }
}
