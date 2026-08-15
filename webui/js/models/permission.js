class Permission 
{
    constructor(rawName, description) 
    {
        this.rawName = rawName;
        this.description = description || "No available description.";
        Object.freeze(this);
    }

    get cleanName() 
    {
        return this.rawName.replace(/^android\.permission\./i, '');
    }
}
