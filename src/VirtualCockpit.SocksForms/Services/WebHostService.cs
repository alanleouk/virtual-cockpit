using Microsoft.AspNetCore.Mvc;
using System.Net;
using VirtualCockpit.Lib.Models;
using VirtualCockpit.Lib.Sevices;

namespace VirtualCockpit.SocksForms.Services
{
    public class WebHostService
    {
        // TODO: Implement Logging
        public delegate void LoggingEventHandler(string message);
        public event LoggingEventHandler LoggingEvent;

        private WebApplicationBuilder _builder;
        private ConfigurationManager _configuration;
        private IServiceCollection _services;
        private WebApplication _app;
        private SimConnectService _simConnectService;

        public WebApplication App => _app;
        public SimConnectService SimConnectService => _simConnectService;

        public WebHostService()
        {
            _builder = WebApplication.CreateBuilder();
            _configuration = _builder.Configuration;
            _services = _builder.Services;

            // Kesterel
            _builder.WebHost.ConfigureKestrel((context, serverOptions) =>
            {
                var kestrelSection = context.Configuration.GetSection("KestrelHost");

                serverOptions.Configure(kestrelSection)
                    .Endpoint("Https", listenOptions =>
                    {
                        if (listenOptions.ListenOptions.IPEndPoint != null)
                        {
                            // listenOptions.ListenOptions.IPEndPoint.Address = IPAddress.Parse("127.0.0.20");
                            listenOptions.ListenOptions.IPEndPoint.Address = IPAddress.Any;
                            listenOptions.ListenOptions.IPEndPoint.Port = 4445;
                        }
                    });
            });

            // Cors
            _services.AddCors(options =>
            {
                options.AddDefaultPolicy(
                    builder =>
                    {
                        builder
                            .WithOrigins(
                                "http://localhost:4200",
                                "https://vcockpit-local.osz.one", "https://vcockpit-local.osz.one:4444",
                                "https://vcockpit.osz.one", "https://vcockpit.osz.one:4444")
                            .AllowAnyHeader()
                            .AllowAnyMethod();
                    });
            });

            // Add services to the container
            _simConnectService = new SimConnectService();
            _services.AddSingleton(_simConnectService);
            _services.AddScoped<WebSocketService>();

            _app = _builder.Build();

            // Configure the HTTP request pipeline.

            _app.UseCors();
            _app.UseWebSockets();

            _app.MapGet("/status", async (HttpContext context) => { return Results.Ok(true); });

            _app.MapPost("/connect",
                async (HttpContext context, [FromServices] SimConnectService simConnectService,
                    [FromBody] ConnectRequest request) =>
                {
                    simConnectService.Connect();
                    return Results.Ok();
                });

            _app.MapPost("/disconnect", async (HttpContext context, [FromServices] SimConnectService simConnectService,
                [FromBody] DisconnectRequest request) =>
            {
                simConnectService.Disconnect();
                return Results.Ok();
            });

            _app.MapPost("/reset",
                async (HttpContext context, [FromServices] SimConnectService simConnectService,
                    [FromBody] ResetRequest request) =>
                {
                    simConnectService.Reset();
                    return Results.Ok();
                });

            _app.MapPost("/add",
                async (HttpContext context, [FromServices] SimConnectService simConnectService,
                    [FromBody] AddRequest requests) =>
                {
                    simConnectService.Add(requests);
                    return Results.Ok();
                });

            _app.MapPost("/send",
                async (HttpContext context, [FromServices] SimConnectService simConnectService,
                    [FromBody] SendRequest request) =>
                {
                    simConnectService.Send(request);
                    return Results.Ok();
                });

            _app.Map("/ws", async (HttpContext context, [FromServices] WebSocketService webSocketService) =>
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

            _app.MapPut("/simvar",
                async (HttpContext context, [FromServices] SimConnectService simConnectService,
                    [FromBody] PutSimvarRequest request) =>
                {
                    return simConnectService.SetVariable(request.Name, request.Value);
                });
        }

        public void SendStatusMessage()
        {
            var message = "Listening on: " + String.Join(';', _app.Urls.Select(item => item).ToList());
            LoggingEvent?.Invoke(message);
        }
    }
}