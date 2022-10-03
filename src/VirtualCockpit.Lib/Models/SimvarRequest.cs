using System.Runtime.InteropServices;

namespace VirtualCockpit.Lib.Models
{
    public enum DEFINITION
    {
        Dummy = 0
    };

    public enum REQUEST
    {
        Dummy = 0,
        String256
    };

    public enum EVENT
    {
        Dummy = 0,
    }

    // Currently we only work with strings with a fixed size of 256
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi, Pack = 1)]
    public struct String256
    {
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)]
        public string Value;
    }

    public class SimvarRequest : ISimvarDefinition
    {
        public DEFINITION DefinitionId = DEFINITION.Dummy;
        public REQUEST RequestId = REQUEST.Dummy;

        public ParamaterType ParamaterType { get; set; }
        public string Name { get; set; }
        public decimal ValueAsDecimal { get; set; }
        public string ValueAsString { get; set; }
        public object ValueAsObject { get; set; }
        public string Units { get; set; }
        public bool Pending = true;
        public int Precision { get; set; }
        public int? PrecisionCutoff { get; set; }
        public bool Registered { get; set; }
    };
}
