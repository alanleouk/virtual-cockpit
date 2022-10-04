using VirtualCockpit.SocksForms.Services;

namespace VirtualCockpit.SocksForms;

internal static class Program
{
    [STAThread]
    private static async Task Main()
    {
        var cts = new CancellationTokenSource();
        var ct = cts.Token;

        // Web Host
        var webHost = new WebHostService();
        var webHostTask = webHost.App.RunAsync(ct);

#if !DEBUG
        // Web App
        var webApp = new WepAppService();
        var webAppTask = webApp.App.RunAsync(ct);
#endif

        // Forms
        ApplicationConfiguration.Initialize();

#if !DEBUG
        var mainForm = new MainForm(webHost, webApp, cts);
#else
        var mainForm = new MainForm(webHost, null, cts);
#endif
        Application.Run(mainForm);

        // Wait for Host
        await webHostTask;

#if !DEBUG
        // Wait for App
        await webAppTask;
#endif
    }
}