class TabStatus
{
    static ALLAPPS = "all-apps";
    static ALLGRANTED = "all-granted";
    static NONEGRANTED = "none-granted";
    static PARTIAL = "partial";
    static NOTINSTALLED = "not-installed";

    constructor(name)
    {
        this.name = name;
        Object.freeze(this);
    }

    toString()
    {
        return `TabStatus.${this.name}`;
    }
}
