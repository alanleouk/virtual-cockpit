using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace VirtualCockpit.Lib.Sevices
{
    public class WebSocketService
    {
        private readonly SimConnectService _simConnectService;
        
        public WebSocketService(SimConnectService simConnectService)
        {
            _simConnectService = simConnectService;
        }
        
        private readonly JsonSerializerOptions _jsonSerializerOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        public async Task<HttpStatusCode> Handle(WebSocket webSocket)
        {
            try
            {
                _simConnectService.MessageReceivedEvent += async request =>
                {
                    var responseString = JsonSerializer.Serialize(request, _jsonSerializerOptions);
                    await webSocket.SendAsync(Encoding.ASCII.GetBytes(responseString), WebSocketMessageType.Text, true,
                        CancellationToken.None);
                };
                
                while (true)
                {
                    // var response = new { TimeOfDay = DateTime.UtcNow };
                    // var responseString = JsonSerializer.Serialize(response, _jsonSerializerOptions);
                    // await webSocket.SendAsync(Encoding.ASCII.GetBytes(responseString), WebSocketMessageType.Text, true, CancellationToken.None);
                    await Task.Delay(1000);
                }
                
                return HttpStatusCode.OK;
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                return HttpStatusCode.BadGateway;
            }
        }
    }
}
