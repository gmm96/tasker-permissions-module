class Permission
{
    constructor(rawName, description) 
    {
        this.rawName = rawName;
        this.description = description || "No available description.";
        this.cleanName = this.rawName.replace(/^android\.permission\./i, '');
        Object.freeze(this);
    }
}
