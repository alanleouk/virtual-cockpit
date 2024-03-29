﻿using Microsoft.FlightSimulator.SimConnect;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Runtime.InteropServices;
using VirtualCockpit.Lib.Models;

namespace VirtualCockpit.Lib.Sevices
{
    public class SimConnectService
    {
        private const UInt16 AUTO_ID = 0xFFFF;
        private const UInt16 NOTUSED_ID = 0xFFFE;

        private DEFINITION _currentDefinition = 0;
        private REQUEST _currentRequest = (REQUEST)10;
        public uint _objectIdRequest = 0;

        private readonly object _simvarRequestsLock = new();
        private readonly ConcurrentBag<SimvarRequest> _simvarRequests;
        private readonly ConcurrentDictionary<string, CacheData> _cache;
        // private readonly ConcurrentDictionary<string, decimal> _cacheCutoff;

        // Client Area Data names
        private const string CLIENT_DATA_NAME_LVARS = "HABI_WASM.LVars";
        private const string CLIENT_DATA_NAME_COMMAND = "HABI_WASM.Command";
        private const string CLIENT_DATA_NAME_ACKNOWLEDGE = "HABI_WASM.Acknowledge";
        private const string CLIENT_DATA_NAME_RESULT = "HABI_WASM.Result";

        public const int WM_USER_SIMCONNECT = 0x0402;
        private IntPtr _hWnd = new(0);

        private readonly object _simConnectLock = new();
        private SimConnect _simConnect = null;

        private SIMCONNECT_SIMOBJECT_TYPE _simObjectType = SIMCONNECT_SIMOBJECT_TYPE.USER;

        private bool _FSXcompatible = false;
        private bool _connected = false;

        public delegate void MessageReceivedEventHandler(SimvarRequest request);
        public event MessageReceivedEventHandler MessageReceivedEvent;

        // TODO: Implement Logging
        public delegate void LoggingEventHandler(string message);
        public event LoggingEventHandler LoggingEvent;

        // Currently we are using fixed size strings of 256 characters
        private const int MESSAGE_SIZE = 256;

        // Structure sent back from WASM module to acknowledge for LVars
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi, Pack = 1)]
        public struct LVarAck
        {
            public UInt16 DefineID;
            public UInt16 Offset;

            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)]
            public String str;

            public float value;
        };

        // Structure to get the result of execute_calculator_code
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi, Pack = 1)]
        public struct Result
        {
            public double exeF;
            public Int32 exeI;

            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)]
            public String exeS;
        };

        private enum CLIENT_DATA_ID
        {
            LVARS = 0,
            CMD = 1,
            ACK = 2,
            RESULT = 3
        }

        // Client Data Area RequestID's for receiving Acknowledge and LVARs
        private enum CLIENTDATA_REQUEST_ID
        {
            ACK,
            RESULT,
            START_LVAR
        }

        private enum CLIENTDATA_DEFINITION_ID
        {
            CMD,
            ACK,
            RESULT
        }

        public SimConnectService()
        {
            _simvarRequests = new ConcurrentBag<SimvarRequest>();
            _cache = new ConcurrentDictionary<string, CacheData>();
            // _cacheCutoff = new ConcurrentDictionary<string, decimal>();
        }

        public void SetWindowHandle(IntPtr hWnd)
        {
            _hWnd = hWnd;
        }

        public void ReceiveSimConnectMessage()
        {
            if (_simConnect == null)
            {
                return;
            }

            _simConnect.ReceiveMessage();
        }

        public int GetUserSimConnectWinEvent()
        {
            return WM_USER_SIMCONNECT;
        }

        public bool HandleWindowMessage(int msg)
        {
            try
            {
                if (msg == GetUserSimConnectWinEvent())
                {
                    ReceiveSimConnectMessage();
                    return true;
                }
            }
            catch (Exception ex)
            {
                LoggingEvent?.Invoke("Handle Window Message failed: " + ex);
                Disconnect();
            }

            return false;
        }

        public void Connect()
        {
            if (_simConnect != null)
            {
                return;
            }
            lock (_simConnectLock)
            {
                if (_simConnect != null)
                {
                    return;
                }

                try
                {
                    _simConnect = new SimConnect("Simconnect", _hWnd, WM_USER_SIMCONNECT, null,
                        _FSXcompatible ? (uint)1 : 0);
                    _simConnect.OnRecvOpen += SimConnect_OnReceiveOpen;
                    _simConnect.OnRecvQuit += SimConnect_OnReceiveQuit;
                    _simConnect.OnRecvException += SimConnect_OnReceiveException;
                    _simConnect.OnRecvSimobjectData += SimConnect_OnReceiveSimObjectData;
                    _simConnect.OnRecvClientData += SimConnect_OnRecvClientData;
                }
                catch (COMException ex)
                {
                    LoggingEvent?.Invoke("Connection to Flight Simulator failed: " + ex.Message);
                }
            }
        }

        public void Disconnect()
        {
            LoggingEvent?.Invoke("Disconnect");


            _cache.Clear();
            // _cacheCutoff.Clear();

            if (_simConnect != null)
            {
                _simConnect.Dispose();
                _simConnect = null;
            }

            _connected = false;
        }

        public void Reset()
        {
            lock (_simvarRequestsLock)
            {
                Disconnect();
                _simvarRequests.Clear();
            }
        }

        public void Add(AddRequest request)
        {
            lock (_simvarRequestsLock)
            {
                foreach (SimvarDefinition simvarDefinition in request.SimvarDefinitions)
                {
                    SimvarRequest? simvarRequest = _simvarRequests.FirstOrDefault(item => item.Name == simvarDefinition.Name);

                    if (simvarRequest == null)
                    {
                        LoggingEvent?.Invoke("Add: " + simvarDefinition.Name);

                        simvarRequest = new SimvarRequest
                        {
                            DefinitionId = DEFINITION.Dummy,
                            RequestId = REQUEST.Dummy,
                            ParamaterType = simvarDefinition.ParamaterType,
                            Name = simvarDefinition.Name,
                            Units = simvarDefinition.Units,
                            Precision = simvarDefinition.Precision
                        };
                        _simvarRequests.Add(simvarRequest);

                        simvarRequest.Pending = !RegisterToSimConnect(simvarRequest);
                    }
                    else
                    {
                        LoggingEvent?.Invoke("Updated: " + simvarDefinition.Name);

                        simvarRequest.Units = simvarDefinition.Units;
                        simvarRequest.Precision = simvarDefinition.Precision;
                    }

                    _cache.Remove(simvarRequest.Name, out CacheData _);
                }
            }
        }

        public void Send(SendRequest request)
        {
            LoggingEvent?.Invoke("Send");

            List<SimvarRequest> simvarRequests = _simvarRequests.Where(item =>
                    request.SimvarKeys.Any(key => key.Equals(item.Name, StringComparison.InvariantCultureIgnoreCase)))
                .ToList();

            foreach (SimvarRequest? simvarRequest in simvarRequests)
            {
                MessageReceivedEvent?.Invoke(simvarRequest);
            }
        }

        private bool RegisterToSimConnect(SimvarRequest request)
        {
            if (_simConnect == null || !_connected)
            {
                return false;
            }

            LoggingEvent?.Invoke($"Register to SimConnect: {request.Name}");

            switch (request.ParamaterType)
            {
                case ParamaterType.SimVar:
                    request.DefinitionId = _currentDefinition;
                    request.RequestId = _currentRequest;

                    if (request.Units == null)
                    {
                        _simConnect.AddToDataDefinition(request.DefinitionId, request.Name, "",
                            SIMCONNECT_DATATYPE.STRING256, 0.0f, SimConnect.SIMCONNECT_UNUSED);
                        _simConnect.RegisterDataDefineStruct<String256>(request.DefinitionId);
                    }
                    else
                    {
                        _simConnect.AddToDataDefinition(request.DefinitionId, request.Name, request.Units,
                            SIMCONNECT_DATATYPE.FLOAT64, 0.0f, SimConnect.SIMCONNECT_UNUSED);
                        _simConnect.RegisterDataDefineStruct<double>(request.DefinitionId);
                    }

                    _simConnect?.RequestDataOnSimObject(request.RequestId, request.DefinitionId,
                        SimConnect.SIMCONNECT_OBJECT_ID_USER, SIMCONNECT_PERIOD.SIM_FRAME,
                        SIMCONNECT_DATA_REQUEST_FLAG.CHANGED, 0, 0, 0);

                    ++_currentDefinition;
                    ++_currentRequest;
                    break;

                case ParamaterType.LVar:
                    SendWASMCmd($"HW.Reg.(L:{request.Name})");
                    break;

                case ParamaterType.KEvent:
                    request.DefinitionId = _currentDefinition;
                    request.RequestId = (REQUEST)NOTUSED_ID;

                    _simConnect.MapClientEventToSimEvent(request.DefinitionId, request.Name);
                    ++_currentDefinition;
                    break;
            }

            return true;
        }

        private void SimConnect_OnReceiveOpen(SimConnect sender, SIMCONNECT_RECV_OPEN data)
        {
            Console.WriteLine("SimConnect_OnReceiveOpen");
            Console.WriteLine("Connected to KH");

            _connected = true;

            InitializeClientDataAreas();

            // Register pending requests
            foreach (SimvarRequest simvarRequest in _simvarRequests)
            {
                if (simvarRequest.Pending)
                {
                    simvarRequest.Pending = !RegisterToSimConnect(simvarRequest);
                }
            }
        }

        /// The case where the user closes game
        private void SimConnect_OnReceiveQuit(SimConnect sender, SIMCONNECT_RECV data)
        {
            Disconnect();
        }

        private void SimConnect_OnReceiveException(SimConnect sender, SIMCONNECT_RECV_EXCEPTION data)
        {
            SIMCONNECT_EXCEPTION eException = (SIMCONNECT_EXCEPTION)data.dwException;
            LoggingEvent?.Invoke("SimConnect_OnReceiveException: " + eException);
        }

        private void SimConnect_OnReceiveSimObjectData(SimConnect sender, SIMCONNECT_RECV_SIMOBJECT_DATA data)
        {
            Console.WriteLine("SimConnect_OnReceiveSimObjectData");

            SimvarRequest? request = _simvarRequests.FirstOrDefault(item =>
                item.ParamaterType == ParamaterType.SimVar && (UInt16)item.DefinitionId == data.dwDefineID);
            if (request == null)
            {
                return;
            }

            UpdateRequestValue(request, data);
            ProcessRequestEvents(request);
        }

        private void SimConnect_OnRecvClientData(SimConnect sender, SIMCONNECT_RECV_CLIENT_DATA data)
        {
            Debug.WriteLine($"SimConnect_OnRecvClientData() - RequestID = {data.dwRequestID}");

            if (data.dwRequestID == (uint)CLIENTDATA_REQUEST_ID.ACK)
            {
                LVarAck ackData = (LVarAck)data.dwData[0];
                Debug.WriteLine(
                    $"----> Acknowledge: ID: {ackData.DefineID}, Offset: {ackData.Offset}, String: {ackData.str}, value: {ackData.value}");

                // if LVar DefineID already exists, ignore it, otherwise we will get "DUPLICATE_ID" exception
                SimvarRequest? request = _simvarRequests.FirstOrDefault(item =>
                    item.ParamaterType == ParamaterType.LVar && $"(L:{item.Name})" == ackData.str);
                if (request == null || request.Registered)
                {
                    return;
                }

                // find the LVar, and update it with ackData
                // simvarRequest.uOffset = ackData.Offset;
                request.DefinitionId = (DEFINITION)ackData.DefineID;
                request.RequestId = ++_currentRequest;
                request.ValueAsDecimal = (decimal)ackData.value;
                request.ValueAsString = request.ValueAsDecimal.ToString($"F{request.Precision}");

                _simConnect?.AddToClientDataDefinition((DEFINITION)ackData.DefineID, ackData.Offset, sizeof(float), 0,
                    0);
                _simConnect?.RegisterStruct<SIMCONNECT_RECV_CLIENT_DATA, float>(request.DefinitionId);
                _simConnect?.RequestClientData(
                    CLIENT_DATA_ID.LVARS,
                    request.RequestId,
                    request.DefinitionId,
                    SIMCONNECT_CLIENT_DATA_PERIOD
                        .ON_SET, // data will be sent whenever SetClientData is used on this client area (even if this defineID doesn't change)
                    SIMCONNECT_CLIENT_DATA_REQUEST_FLAG
                        .CHANGED, // if this is used, this defineID only is sent when its value has changed
                    0, 0, 0);

                UpdateRequestValue(request, data);
                ProcessRequestEvents(request);

                request.Registered = true;
            }
            else if (data.dwRequestID == (uint)CLIENTDATA_REQUEST_ID.RESULT)
            {
                SimvarRequest? request = _simvarRequests.FirstOrDefault(item =>
                    item.ParamaterType == ParamaterType.LVar && (UInt16)item.DefinitionId == data.dwDefineID);
                if (request == null)
                {
                    return;
                }

                UpdateRequestValue(request, data);
                ProcessRequestEvents(request);
            }
            else if (data.dwRequestID >= (uint)CLIENTDATA_REQUEST_ID.START_LVAR)
            {
                SimvarRequest? request = _simvarRequests.FirstOrDefault(item =>
                    item.ParamaterType == ParamaterType.LVar && (UInt16)item.DefinitionId == data.dwDefineID);

                if (request != null)
                {
                    UpdateRequestValue(request, data);
                    ProcessRequestEvents(request);
                }
            }
        }

        private void InitializeClientDataAreas()
        {
            // register Client Data (for LVars)
            _simConnect.MapClientDataNameToID(CLIENT_DATA_NAME_LVARS, CLIENT_DATA_ID.LVARS);
            _simConnect.CreateClientData(CLIENT_DATA_ID.LVARS, SimConnect.SIMCONNECT_CLIENTDATA_MAX_SIZE,
                SIMCONNECT_CREATE_CLIENT_DATA_FLAG.DEFAULT);

            // register Client Data (for WASM Module Commands)
            _simConnect.MapClientDataNameToID(CLIENT_DATA_NAME_COMMAND, CLIENT_DATA_ID.CMD);
            _simConnect.CreateClientData(CLIENT_DATA_ID.CMD, MESSAGE_SIZE, SIMCONNECT_CREATE_CLIENT_DATA_FLAG.DEFAULT);
            _simConnect.AddToClientDataDefinition(CLIENTDATA_DEFINITION_ID.CMD, 0, MESSAGE_SIZE, 0, 0);

            // register Client Data (for LVar acknowledge)
            _simConnect.MapClientDataNameToID(CLIENT_DATA_NAME_ACKNOWLEDGE, CLIENT_DATA_ID.ACK);
            _simConnect.CreateClientData(CLIENT_DATA_ID.ACK, (uint)Marshal.SizeOf<LVarAck>(),
                SIMCONNECT_CREATE_CLIENT_DATA_FLAG.DEFAULT);
            _simConnect.AddToClientDataDefinition(CLIENTDATA_DEFINITION_ID.ACK, 0, (uint)Marshal.SizeOf<LVarAck>(), 0,
                0);
            _simConnect.RegisterStruct<SIMCONNECT_RECV_CLIENT_DATA, LVarAck>(CLIENTDATA_DEFINITION_ID.ACK);
            _simConnect.RequestClientData(
                CLIENT_DATA_ID.ACK,
                CLIENTDATA_REQUEST_ID.ACK,
                CLIENTDATA_DEFINITION_ID.ACK,
                SIMCONNECT_CLIENT_DATA_PERIOD.ON_SET,
                SIMCONNECT_CLIENT_DATA_REQUEST_FLAG.DEFAULT,
                0, 0, 0);

            // register Client Data (for RESULT)
            _simConnect.MapClientDataNameToID(CLIENT_DATA_NAME_RESULT, CLIENT_DATA_ID.RESULT);
            _simConnect.CreateClientData(CLIENT_DATA_ID.RESULT, (uint)Marshal.SizeOf<Result>(),
                SIMCONNECT_CREATE_CLIENT_DATA_FLAG.DEFAULT);
            _simConnect.AddToClientDataDefinition(CLIENTDATA_DEFINITION_ID.RESULT, 0, (uint)Marshal.SizeOf<Result>(), 0,
                0);
            _simConnect.RegisterStruct<SIMCONNECT_RECV_CLIENT_DATA, Result>(CLIENTDATA_DEFINITION_ID.RESULT);
            _simConnect.RequestClientData(
                CLIENT_DATA_ID.RESULT,
                CLIENTDATA_REQUEST_ID.RESULT,
                CLIENTDATA_DEFINITION_ID.RESULT,
                SIMCONNECT_CLIENT_DATA_PERIOD.ON_SET,
                SIMCONNECT_CLIENT_DATA_REQUEST_FLAG.DEFAULT,
                0, 0, 0);
        }

        private void UpdateRequestValue(SimvarRequest request, SIMCONNECT_RECV_SIMOBJECT_DATA dataWrapper)
        {
            if (dataWrapper.dwData == null || dataWrapper.dwData.Length == 0)
            {
                return;
            }

            object data = dataWrapper.dwData[0];

            if (request.Units == null)
            {
                String256 result = (String256)data;
                request.ValueAsDecimal = 0;
                request.ValueAsString = result.Value;
            }
            else
            {
                decimal valueAsDecimal = 0;

                if (data is LVarAck)
                {
                    valueAsDecimal = (decimal)((LVarAck)data).value;
                }
                else if (data is float)
                {
                    valueAsDecimal = (decimal)(float)data;
                }
                else
                {
                    valueAsDecimal = (decimal)(double)data;
                }

                request.ValueAsDecimal = valueAsDecimal;
                request.ValueAsString = valueAsDecimal.ToString($"F{request.Precision}");
            }
        }

        private void ProcessRequestEvents(SimvarRequest request)
        {
            bool sendMessage = false;

            /*
            var precisionCutoff = 10000; // TODO

            var requestPrecisionCutoff = Math.Floor(request.ValueAsDecimal * precisionCutoff);
            if (!_cacheCutoff.TryGetValue(request.Name, out var cacheCutoffData))
            {
                _cacheCutoff.TryAdd(request.Name, requestPrecisionCutoff);
            }
            else
            {
                if (requestPrecisionCutoff == cacheCutoffData)
                {
                    return;
                }
            }
            */

            _cache.TryGetValue(request.Name, out CacheData? cacheData);
            if (cacheData == null)
            {
                _cache.TryAdd(request.Name, new CacheData
                {
                    ValueAsString = request.ValueAsString,
                    ValueAsDecimal = request.ValueAsDecimal,
                    UpdatedUtc = DateTime.UtcNow
                });
                sendMessage = true;
            }
            else
            {
                if (cacheData.ValueAsString == request.ValueAsString)
                {
                    /*
                    if (DateTime.UtcNow.Subtract(cacheData.UpdatedUtc).TotalSeconds > 1)
                    {
                        sendMessage = true;
                        cacheData.ValueAsDecimal = request.ValueAsDecimal;
                        cacheData.ValueAsString = request.ValueAsString;
                        cacheData.UpdatedUtc = DateTime.UtcNow;
                    }
                    */
                }
                else
                {
                    sendMessage = true;
                    cacheData.ValueAsDecimal = request.ValueAsDecimal;
                    cacheData.ValueAsString = request.ValueAsString;
                    cacheData.UpdatedUtc = DateTime.UtcNow;
                }
            }

            if (sendMessage)
            {
                MessageReceivedEvent?.Invoke(request);
            }
        }

        public void InvokeEvent(SimvarRequest request)
        {
            MessageReceivedEvent?.Invoke(request);
        }

        public void SendWASMCmd(String command)
        {
            if (!_connected)
            {
                return;
            }

            String256 cmd;
            cmd.Value = command;

            _simConnect.SetClientData(CLIENT_DATA_ID.CMD, CLIENTDATA_DEFINITION_ID.CMD,
                SIMCONNECT_CLIENT_DATA_SET_FLAG.DEFAULT, 0, cmd);
        }

        public static dynamic Cast(dynamic obj, Type castTo)
        {
            return Convert.ChangeType(obj, castTo);
        }

        public bool SetVariable(string name, decimal? value)
        {
            if (!_connected)
            {
                return false;
            }

            SimvarRequest? request = _simvarRequests.FirstOrDefault(item => item.Name == name);
            if (request == null || (request.ParamaterType == ParamaterType.SimVar && !request.Registered))
            {
                return false;
            }

            switch (request.ParamaterType)
            {
                case ParamaterType.SimVar:
                    request.ValueAsObject = Cast(value, request.ValueAsObject.GetType());
                    _simConnect.SetDataOnSimObject(request.DefinitionId, 0, SIMCONNECT_DATA_SET_FLAG.DEFAULT,
                        request.ValueAsObject);
                    break;

                case ParamaterType.LVar:
                    SendWASMCmd($"HW.Set.{value} (>L:{request.Name})");
                    break;

                case ParamaterType.KEvent:
                    byte[] bytes = BitConverter.GetBytes(Convert.ToInt32(value ?? 0));
                    uint param = BitConverter.ToUInt32(bytes, 0);

                    _simConnect.TransmitClientEvent(
                        0,
                        (EVENT)request.DefinitionId,
                        param,
                        (EVENT)SimConnect.SIMCONNECT_GROUP_PRIORITY_HIGHEST,
                        SIMCONNECT_EVENT_FLAG.GROUPID_IS_PRIORITY);
                    break;
            }

            return true;
        }

        public void ExecuteCalculatorCode(string sExe)
        {
            SendWASMCmd($"HW.Exe.{sExe}");
        }
    }
}
