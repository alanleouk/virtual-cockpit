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
        Struct1
    };

    // String properties must be packed inside of a struct
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi, Pack = 1)]
    struct Struct1
    {
        // this is how you declare a fixed size string
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)]
        public String sValue;

        // other definitions can be added to this struct
        // ...
    };

    public class SimvarRequest
    {
        public DEFINITION eDef = DEFINITION.Dummy;
        public REQUEST eRequest = REQUEST.Dummy;

        public string Name { get; set; }
        public decimal ValueAsDecimal { get; set; }
        public string ValueAsString { get; set; }
        public string Units { get; set; }
        public bool Pending = true;
        public bool StillPending { get; set; }
        public int Precision { get; set; }
    };
}
