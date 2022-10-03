using VirtualCockpit.SocksForms.Services;

namespace VirtualCockpit.SocksForms;

internal static class Program
{
    [STAThread]
    private static async Task Main()
    {
        // Web Host
        WebHostService webHost = new();
        CancellationTokenSource cts = new();
        CancellationToken ct = cts.Token;
        Task appTask = webHost.App.RunAsync(ct);

        // Forms
        ApplicationConfiguration.Initialize();
        MainForm mainForm = new(webHost, cts);
        Application.Run(mainForm);

        // Wait for App
        await appTask;
    }
}