using VirtualCockpit.Lib.Models;
using VirtualCockpit.Lib.Sevices;

namespace VirtualCockpit.SocksForms;

public partial class MainForm : Form
{
    private readonly SimConnectService _simConnectService;
    private readonly CancellationTokenSource _cts;

    public MainForm(SimConnectService simConnectService, CancellationTokenSource cts)
    {
        _simConnectService = simConnectService;
        _cts = cts;

        InitializeComponent();

        Load += MainForm_Load;
    }

    private void MainForm_Load(object sender, EventArgs e)
    {
        FormClosing += MainForm_FormClosing;

        _simConnectService.MessageReceivedEvent += SimConnectServiceOnMessageReceivedEvent;
        _simConnectService.SetWindowHandle(Handle);

        /*
        // _simConnectService.AddRequest(ParamaterType.SimVar, "GENERAL ENG THROTTLE LEVER POSITION:1", "percent", 0);
        // _simConnectService.AddRequest(ParamaterType.SimVar, "GENERAL ENG THROTTLE LEVER POSITION:2", "percent", 0);
        _simConnectService.Add(ParamaterType.SimVar, "FLAPS HANDLE INDEX", "number", 0);
        _simConnectService.Add(ParamaterType.LVar, "A32NX_FLAPS_HANDLE_INDEX", "number", 0);
        // _simConnectService.AddRequest(ParamaterType.SimVar, "RUDDER POSITION", "position", 2);
        _simConnectService.Connect();
        */
    }

    private void MainForm_FormClosing(object? sender, FormClosingEventArgs e)
    {
        if (!_cts.IsCancellationRequested)
        {
            _cts.Cancel();
        }
    }

    private void SimConnectServiceOnMessageReceivedEvent(SimvarRequest request)
    {
        var value = request.Name + ": " + request.ValueAsString;
        outputTextbox.Invoke(() => outputTextbox.AppendText(value + "\r\n"));
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