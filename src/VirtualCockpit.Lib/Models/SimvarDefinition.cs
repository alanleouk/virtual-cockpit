namespace VirtualCockpit.Lib.Models
{
    public interface ISimvarDefinition
    {
        ParamaterType ParamaterType { get; set; }
        string Name { get; set; }
        string Units { get; set; }
        int Precision { get; set; }
    }

    public class SimvarDefinition : ISimvarDefinition
    {
        public ParamaterType ParamaterType { get; set; }
        public string Name { get; set; }
        public string Units { get; set; }
        public int Precision { get; set; }
    }
}