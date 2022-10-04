using VirtualCockpit.Lib.Models;
using VirtualCockpit.Lib.Sevices;
using VirtualCockpit.SocksForms.Services;

namespace VirtualCockpit.SocksForms;

public partial class MainForm : Form
{
    private readonly SimConnectService _simConnectService;
    private readonly CancellationTokenSource _cts;
    private readonly WebHostService _webHost;
    private readonly WepAppService? _webApp;

    public MainForm(WebHostService webHost, WepAppService? webApp, CancellationTokenSource cts)
    {
        _simConnectService = webHost.SimConnectService;
        _webHost = webHost;
        _webApp = webApp;
        _cts = cts;

        InitializeComponent();

        Load += MainForm_Load;

    }

    private void MainForm_Load(object sender, EventArgs e)
    {
        FormClosing += MainForm_FormClosing;

        _simConnectService.MessageReceivedEvent += SimConnectServiceOnMessageReceivedEvent;
        _simConnectService.LoggingEvent += SimConnectServiceOnLoggingEvent;
        _simConnectService.SetWindowHandle(Handle);
        //
        _webHost.LoggingEvent += SimConnectServiceOnLoggingEvent;
        _webHost.SendStatusMessage();
        //
        if (_webApp != null)
        {
            _webApp.LoggingEvent += SimConnectServiceOnLoggingEvent;
            _webApp.SendStatusMessage();
        }
    }

    private void SimConnectServiceOnLoggingEvent(string message)
    {
        outputTextbox.Invoke(() => outputTextbox.AppendText(message + "\r\n"));
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
        var value = request.Name + ": " + request.ValueAsString + " / " + request.ValueAsDecimal;
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

    private void cmdSend_Click(object sender, EventArgs e)
    {
        decimal.TryParse(valueTextbox.Text, out var valueAsDecimal);

        SimvarRequest request = new()
        {
            Name = commandTextbox.Text,
            Units = "unknown",
            ValueAsDecimal = valueAsDecimal,
            ValueAsString = valueTextbox.Text
        };
        _simConnectService.InvokeEvent(request);
    }
}
