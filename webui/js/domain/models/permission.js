class Permission
{
    constructor(name, description) 
    {
        this.name = name;
        this.description = description || "No available description.";
        Object.freeze(this);
    }
    
    get cleanName()
    {
        return this.name.replace(/^android\.permission\./i, '');
    }
}
