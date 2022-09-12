using VirtualCockpit.Lib.Sevices;

namespace VirtualCockpit.SocksForms;

public partial class MainForm : Form
{
    private readonly SimConnectService _simConnectService;

    public MainForm(SimConnectService simConnectService)
    {
        _simConnectService = simConnectService;

        InitializeComponent();

        Load += MainForm_Load;
    }

    private void MainForm_Load(object sender, EventArgs e)
    {
        _simConnectService.SetWindowHandle(Handle);
        _simConnectService.AddRequest("RUDDER POSITION", "position", 2);
        _simConnectService.Connect();
    }

    protected override void WndProc(ref Message m)
    {
        if (_simConnectService.HandleWindowMessage(m.Msg))
        {
            return;
        }

        base.WndProc(ref m);
    }
}