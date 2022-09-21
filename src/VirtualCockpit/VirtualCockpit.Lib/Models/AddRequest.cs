
namespace VirtualCockpit.Lib.Models
{
    public class AddRequest
    {
        public ParamaterType ParamaterType { get; set; }
        public string Name { get; set; }
        public string Units { get; set; }
        public int Precision { get; set; }
    }
}
