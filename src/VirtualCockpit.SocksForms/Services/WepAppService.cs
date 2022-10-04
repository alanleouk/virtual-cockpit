using System.Net;

namespace VirtualCockpit.SocksForms.Services
{
    public class WepAppService
    {
        // TODO: Implement Logging
        public delegate void LoggingEventHandler(string message);
        public event LoggingEventHandler LoggingEvent;

        private WebApplicationBuilder _builder;
        private ConfigurationManager _configuration;
        private IServiceCollection _services;
        private WebApplication _app;

        public WebApplication App => _app;

        public WepAppService()
        {
            _builder = WebApplication.CreateBuilder();
            _configuration = _builder.Configuration;
            _services = _builder.Services;

            // Kesterel
            _builder.WebHost.ConfigureKestrel((context, serverOptions) =>
            {
                var kestrelSection = context.Configuration.GetSection("KestrelApp");

                serverOptions.Configure(kestrelSection)
                    .Endpoint("Https", listenOptions =>
                    {
                        if (listenOptions.ListenOptions.IPEndPoint != null)
                        {
                            // listenOptions.ListenOptions.IPEndPoint.Address = IPAddress.Parse("127.0.0.20");
                            listenOptions.ListenOptions.IPEndPoint.Address = IPAddress.Any;
                            listenOptions.ListenOptions.IPEndPoint.Port = 4444;
                        }
                    });
            });

            _app = _builder.Build();
            _app.UseDefaultFiles();
            _app.UseStaticFiles();

            _app.UseRouting();
            _app.UseEndpoints(endpoints =>
            {
                endpoints.MapFallbackToFile(@"{*path:nonfile}", @"index.html");
            });
        }

        public void SendStatusMessage()
        {
            var message = "Listening on: " + String.Join(';', _app.Urls.Select(item => item).ToList());
            LoggingEvent?.Invoke(message);
        }
    }
}
