using System.Diagnostics;
using System.Net;
using Microsoft.AspNetCore.Mvc;
using VirtualCockpit.Lib.Models;
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

        // Kesterel
        builder.WebHost.ConfigureKestrel((context, serverOptions) =>
        {
            var kestrelSection = context.Configuration.GetSection("Kestrel");

            serverOptions.Configure(kestrelSection)
                .Endpoint("Https", listenOptions =>
                {
                    Debug.Assert(listenOptions.ListenOptions.IPEndPoint != null,
                        "listenOptions.ListenOptioCertificatens.IPEndPoint != null");
                    listenOptions.ListenOptions.IPEndPoint.Address = IPAddress.Parse("127.0.0.20");
                });
        });

        // Cors
        services.AddCors(options =>
        {
            options.AddDefaultPolicy(
                builder =>
                {
                    builder
                        .WithOrigins("http://localhost:4200", "https://vcockpit-local.osz.one", "https://vcockpit.osz.one")
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
        });

        // Add services to the container
        var simConnectService = new SimConnectService();
        services.AddSingleton(simConnectService);
        services.AddScoped<WebSocketService>();

        var app = builder.Build();

        // Configure the HTTP request pipeline.

        app.UseCors();
        app.UseWebSockets();

        app.MapGet("/status", async (HttpContext context) =>
        {
            return Results.Ok(true);
        });

        app.MapPost("/connect", async (HttpContext context, [FromServices] SimConnectService simConnectService, [FromBody] ConnectRequest request) =>
        {
            simConnectService.Connect();
            return Results.Ok();
        });

        app.MapPost("/disconnect", async (HttpContext context, [FromServices] SimConnectService simConnectService, [FromBody] DisconnectRequest request) =>
        {
            simConnectService.Disconnect();
            return Results.Ok();
        });

        app.MapPost("/reset", async (HttpContext context, [FromServices] SimConnectService simConnectService, [FromBody] ResetRequest request) =>
        {
            simConnectService.Reset();
            return Results.Ok();
        });

        app.MapPost("/add", async (HttpContext context, [FromServices] SimConnectService simConnectService, [FromBody] AddRequest[] requests) =>
        {
            simConnectService.Add(requests);
            return Results.Ok();
        });

        app.MapPost("/send", async (HttpContext context, [FromServices] SimConnectService simConnectService, [FromBody] SendRequest request) =>
        {
            simConnectService.Send();
            return Results.Ok();
        });

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

        app.MapPut("/simvar", async (HttpContext context, [FromServices] SimConnectService simConnectService, [FromBody] PutSimvarRequest request) =>
        {
            return simConnectService.SetVariable(request.Name, request.Value);
        });

        var cts = new CancellationTokenSource();
        var ct = cts.Token;
        var appTask = app.RunAsync(ct);

        // Forms

        ApplicationConfiguration.Initialize();
        var mainForm = new MainForm(simConnectService, cts);
        Application.Run(mainForm);

        // App
        
        await appTask;
    }
}