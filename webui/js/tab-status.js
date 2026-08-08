class TabStatus
{
    static ALLAPPS = new AppStatus('ALLAPPS');
    static NONEGRANTED = new AppStatus('NONEGRANTED');
    static PARTIAL = new AppStatus('PARTIAL');
    static ALLGRANTED = new AppStatus('ALLGRANTED');
    static NOTINSTALLED = new AppStatus('NOTINSTALLED');

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
