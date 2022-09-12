using System.Net;
using Microsoft.AspNetCore.Mvc;
using VirtualCockpit.Lib.Sevices;

namespace VirtualCockpit.SocksForms;

static class Program
{
    [STAThread]
    static async Task Main()
    {
        var builder = WebApplication.CreateBuilder();
        var configuration = builder.Configuration;
        var services = builder.Services;

        // Add services to the container
        var simConnectService = new SimConnectService();
        services.AddSingleton(simConnectService);
        services.AddScoped<WebSocketService>();

        builder.WebHost.UseUrls("http://localhost:12345");
        var app = builder.Build();

        // Configure the HTTP request pipeline.

        app.UseWebSockets();
        app.Map("/ws", async (HttpContext context, [FromServices] WebSocketService webSocketService) =>
        {
            if (context.WebSockets.IsWebSocketRequest)
            {
                using (var webSocket = await context.WebSockets.AcceptWebSocketAsync())
                {
                    await webSocketService.Handle(webSocket);
                }
            }
            else
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            }
        });
        var appTask =  app.RunAsync();

        // Forms

        ApplicationConfiguration.Initialize();
        var mainForm = new MainForm(simConnectService);
        Application.Run(mainForm);

        // App
        
        await appTask;
    }
}