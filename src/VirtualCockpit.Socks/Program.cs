using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using VirtualCockpit.Lib.Sevices;

[DllImport("kernel32.dll")]
static extern IntPtr GetConsoleWindow();

[DllImport("user32.dll", SetLastError = true)]                                   
static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr ProcessId);

[DllImport("user32.dll", SetLastError = true)]                                  
static extern IntPtr FindWindow(string lpClassName, string lpWindowName); 
      
[DllImport("user32.dll", SetLastError = true)]
static extern IntPtr SetWindowsHookEx(HookType hookType, HookProc lpfn, IntPtr hMod, uint dwThreadId);

[DllImport("user32.dll")]
static extern int CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

IntPtr MessageHookProc(int code, IntPtr wParam, IntPtr lParam)
{
    return IntPtr.Zero;
}

Console.Title = "Server";

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;
var services = builder.Services;

// Add services to the container
var simConnectService = new SimConnectService();
var handle = GetConsoleWindow();
var threadId = GetWindowThreadProcessId(handle, IntPtr.Zero);
var hookProc = new HookProc(MessageHookProc);
SetWindowsHookEx(HookType.WH_GETMESSAGE, hookProc, IntPtr.Zero, threadId);
simConnectService.SetWindowHandle(handle);
simConnectService.Setup();
simConnectService.Connect();
services.AddSingleton<SimConnectService>();
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
await app.RunAsync();

public enum HookType : int
{
    WH_JOURNALRECORD = 0,
    WH_JOURNALPLAYBACK = 1,
    WH_KEYBOARD = 2,
    WH_GETMESSAGE = 3,
    WH_CALLWNDPROC = 4,
    WH_CBT = 5,
    WH_SYSMSGFILTER = 6,
    WH_MOUSE = 7,
    WH_HARDWARE = 8,
    WH_DEBUG = 9,
    WH_SHELL = 10,
    WH_FOREGROUNDIDLE = 11,
    WH_CALLWNDPROCRET = 12,
    WH_KEYBOARD_LL = 13,
    WH_MOUSE_LL = 14
}

delegate IntPtr HookProc(int code, IntPtr wParam, IntPtr lParam);