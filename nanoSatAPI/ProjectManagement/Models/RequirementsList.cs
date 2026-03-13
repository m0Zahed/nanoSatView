using system.componentmodel.dataannotations;

namespace projectmanagement.models;

public class RequirementsList
{
    [key]
    public guid id { get; set; } = guid.newguid();

    public icollection<requirement> requirements { get; set; } = new list<requirement>();
}

