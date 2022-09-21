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

        services.AddCors(options =>
        {
            options.AddDefaultPolicy(
                builder =>
                {
                    builder.WithOrigins("http://localhost:4200", "http://localhost:12345")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
                });
        });

        // Add services to the container
        var simConnectService = new SimConnectService();
        services.AddSingleton(simConnectService);
        services.AddScoped<WebSocketService>();

        builder.WebHost.UseUrls("http://localhost:12345");
        var app = builder.Build();

        // Configure the HTTP request pipeline.

        app.UseCors();
        app.UseWebSockets();

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