class AppStatus
{
    static ALLGRANTED = new AppStatus('ALLGRANTED');
    static NONEGRANTED = new AppStatus('NONEGRANTED');
    static PARTIAL = new AppStatus('PARTIAL');
    static NOTINSTALLED = new AppStatus('NOTINSTALLED');
    static ERROR = new AppStatus('ERROR');

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
