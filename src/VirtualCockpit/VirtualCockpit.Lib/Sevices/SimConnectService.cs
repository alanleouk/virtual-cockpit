using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Runtime.InteropServices;
using Microsoft.FlightSimulator.SimConnect;
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

        private readonly ObservableCollection<SimvarRequest> _simvarRequests;
        private readonly ObservableCollection<string> _errorMessages;
        private readonly Dictionary<string, string> _cache;

        // Client Area Data names
        private const string CLIENT_DATA_NAME_LVARS = "HABI_WASM.LVars";
        private const string CLIENT_DATA_NAME_COMMAND = "HABI_WASM.Command";
        private const string CLIENT_DATA_NAME_ACKNOWLEDGE = "HABI_WASM.Acknowledge";
        private const string CLIENT_DATA_NAME_RESULT = "HABI_WASM.Result";

        public const int WM_USER_SIMCONNECT = 0x0402;
        private IntPtr _hWnd = new(0);
        private SimConnect _simConnect = null;

        private SIMCONNECT_SIMOBJECT_TYPE _simObjectType = SIMCONNECT_SIMOBJECT_TYPE.USER;

        private bool _FSXcompatible = false;
        private bool _connected = false;
        
        public delegate void MessageReceivedEventHandler(SimvarRequest request); 
        public event MessageReceivedEventHandler MessageReceivedEvent;

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
            _simvarRequests = new ObservableCollection<SimvarRequest>();
            _errorMessages = new ObservableCollection<string>();
            _cache = new Dictionary<string, string>();
        }

        public void SetWindowHandle(IntPtr hWnd)
        {
            _hWnd = hWnd;
        }
        
        public void ReceiveSimConnectMessage()
        {
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
            catch
            {
                Disconnect();
            }

            return false;
        }

        public void Setup()
        {
            /*
            AddRequest("GENERAL ENG THROTTLE LEVER POSITION:1", "percent", false);
            AddRequest("GENERAL ENG THROTTLE LEVER POSITION:2", "percent", false);
            AddRequest("FLAPS HANDLE INDEX", "number", false);
            AddRequest("AILERON POSITION", "position", false);
            AddRequest("AILERON TRIM PCT", "percent", false);
            AddRequest("ELEVATOR POSITION", "position", false);
            AddRequest("ELEVATOR TRIM PCT", "percent", false);
            AddRequest("RUDDER POSITION", "position", false);
            AddRequest("RUDDER TRIM", "degrees", false);
            AddRequest("RUDDER TRIM PCT", "percent", false);
            AddRequest("BRAKE PARKING POSITION", "Bool", false);
            AddRequest("GEAR POSITION", "percent", false);
            AddRequest("GEAR POSITION:1", "percent", false);
            AddRequest("GEAR POSITION:2", "percent", false);
            AddRequest("SPOILERS ARMED", "Bool", false);
            AddRequest("SPOILERS HANDLE POSITION", "percent", false);
            AddRequest("AUTOBRAKES ACTIVE", "Bool", false);
            AddRequest("AUTO BRAKE SWITCH CB", "number", false);
            AddRequest("AUTOPILOT FLIGHT DIRECTOR ACTIVE", "Bool", false);
            AddRequest("AUTOPILOT AIRSPEED HOLD", "Bool", false);
            AddRequest("AUTOPILOT AIRSPEED HOLD VAR", "Knots", false);
            AddRequest("AUTOPILOT ALTITUDE LOCK", "Bool", false);
            AddRequest("AUTOPILOT ALTITUDE LOCK VAR", "Feet", false);
            AddRequest("AUTOPILOT APPROACH HOLD", "Bool", false);
            // AddRequest("AUTOPILOT ATTITUDE HOLD", "Bool", false);
            // AddRequest("AUTOPILOT BANK HOLD", "Bool", false);
            // AddRequest("AUTOPILOT BANK HOLD REF", "Degrees", false);
            AddRequest("AUTOPILOT GLIDESLOPE HOLD", "Bool", false);
            AddRequest("AUTOPILOT MACH HOLD", "Bool", false);
            AddRequest("AUTOPILOT MACH HOLD VAR", "Number", false);
            // AddRequest("AUTOPILOT PITCH HOLD", "Bool", false);
            // AddRequest("AUTOPILOT PITCH HOLD REF", "Radians", false);
            // AddRequest("AUTOPILOT RPM HOLD", "Bool", false);
            // AddRequest("AUTOPILOT RPM HOLD VAR", "Number", false);
            AddRequest("AUTOPILOT VERTICAL HOLD", "Bool", false);
            AddRequest("AUTOPILOT VERTICAL HOLD VAR", "feet per minute", false);
            AddRequest("AUTOPILOT MANAGED THROTTLE ACTIVE", "Bool", false);
            */
        }

        public void Connect()
        {
            if (_simConnect != null)
            {
                return;
            }

            try
            {
                _simConnect = new SimConnect("Simconnect", _hWnd, WM_USER_SIMCONNECT, null, _FSXcompatible ? (uint)1 : 0);
                _simConnect.OnRecvOpen += SimConnect_OnReceiveOpen;
                _simConnect.OnRecvQuit += SimConnect_OnReceiveQuit;
                _simConnect.OnRecvException += SimConnect_OnReceiveException;
                _simConnect.OnRecvSimobjectData += SimConnect_OnReceiveSimObjectData;
                _simConnect.OnRecvClientData += SimConnect_OnRecvClientData;
            }
            catch (COMException ex)
            {
                Console.WriteLine("Connection to KH failed: " + ex.Message);
            }
        }

        public void Disconnect()
        {
            _cache.Clear();

            if (_simConnect != null)
            {
                _simConnect.Dispose();
                _simConnect = null;
            }

            _connected = false;
        }

        public void Reset()
        {
            Disconnect();
            _simvarRequests.Clear();
        }

        public void Add(ParamaterType paramaterType, string name, string units, int precision)
        {
            Add(new[] { new AddRequest {
                ParamaterType = paramaterType,
                Name = name,
                Units = units,
                Precision = precision
            }});
        }

        public void Add(AddRequest[] requests)
        {
            foreach (var request in requests)
            {
                if (!_simvarRequests.Any(item => item.Name == request.Name))
                {
                    var simvarRequest = new SimvarRequest
                    {
                        DefinitionId = DEFINITION.Dummy,
                        RequestId = REQUEST.Dummy,
                        ParamaterType = request.ParamaterType,
                        Name = request.Name,
                        Units = request.Units,
                        Precision = request.Precision
                    };
                    _simvarRequests.Add(simvarRequest);

                    simvarRequest.Pending = !RegisterToSimConnect(simvarRequest);
                }
            }
        }

        public void Send()
        {
            foreach (var request in _simvarRequests)
            {
                MessageReceivedEvent?.Invoke(request);
            }
        }

        private bool RegisterToSimConnect(SimvarRequest request)
        {
            if (_simConnect == null || !_connected)
            {
                return false;
            }

            switch (request.ParamaterType)
            {
                case ParamaterType.SimVar:
                    request.DefinitionId = _currentDefinition;
                    request.RequestId = _currentRequest;

                    if (request.Units == null)
                    {
                        _simConnect.AddToDataDefinition(request.DefinitionId, request.Name, "", SIMCONNECT_DATATYPE.STRING256, 0.0f, SimConnect.SIMCONNECT_UNUSED);
                        _simConnect.RegisterDataDefineStruct<String256>(request.DefinitionId);
                    }
                    else
                    {
                        _simConnect.AddToDataDefinition(request.DefinitionId, request.Name, request.Units, SIMCONNECT_DATATYPE.FLOAT64, 0.0f, SimConnect.SIMCONNECT_UNUSED);
                        _simConnect.RegisterDataDefineStruct<double>(request.DefinitionId);
                    }
                    _simConnect?.RequestDataOnSimObject(request.RequestId, request.DefinitionId, SimConnect.SIMCONNECT_OBJECT_ID_USER, SIMCONNECT_PERIOD.SIM_FRAME, SIMCONNECT_DATA_REQUEST_FLAG.CHANGED, 0, 0, 0);

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
            foreach (SimvarRequest oSimvarRequest in _simvarRequests)
            {
                if (oSimvarRequest.Pending)
                {
                    oSimvarRequest.Pending = !RegisterToSimConnect(oSimvarRequest);
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
            Console.WriteLine("SimConnect_OnReceiveException: " + eException.ToString());

            _errorMessages.Add("SimConnect : " + eException.ToString());
        }

        private void SimConnect_OnReceiveSimObjectData(SimConnect sender, SIMCONNECT_RECV_SIMOBJECT_DATA data)
        {
            Console.WriteLine("SimConnect_OnReceiveSimObjectData");

            var request = _simvarRequests.FirstOrDefault(item => item.ParamaterType == ParamaterType.SimVar && (UInt16)item.DefinitionId == data.dwDefineID);
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
                var ackData = (LVarAck)(data.dwData[0]);
                Debug.WriteLine($"----> Acknowledge: ID: {ackData.DefineID}, Offset: {ackData.Offset}, String: {ackData.str}, value: {ackData.value}");

                // if LVar DefineID already exists, ignore it, otherwise we will get "DUPLICATE_ID" exception
                var request = _simvarRequests.FirstOrDefault(item => item.ParamaterType == ParamaterType.LVar && $"(L:{item.Name})" == ackData.str);
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

                _simConnect?.AddToClientDataDefinition((DEFINITION)ackData.DefineID, ackData.Offset, sizeof(float), 0, 0);
                _simConnect?.RegisterStruct<SIMCONNECT_RECV_CLIENT_DATA, float>(request.DefinitionId);
                _simConnect?.RequestClientData(
                    CLIENT_DATA_ID.LVARS,
                    request.RequestId,
                    request.DefinitionId,
                    SIMCONNECT_CLIENT_DATA_PERIOD.ON_SET, // data will be sent whenever SetClientData is used on this client area (even if this defineID doesn't change)
                    SIMCONNECT_CLIENT_DATA_REQUEST_FLAG.CHANGED, // if this is used, this defineID only is sent when its value has changed
                    0, 0, 0);

                UpdateRequestValue(request, data);
                ProcessRequestEvents(request);

                request.Registered = true;
            }
            else if (data.dwRequestID == (uint)CLIENTDATA_REQUEST_ID.RESULT)
            {
                var request = _simvarRequests.FirstOrDefault(item => item.ParamaterType == ParamaterType.LVar && (UInt16)item.DefinitionId == data.dwDefineID);
                if (request == null)
                {
                    return;
                }

                UpdateRequestValue(request, data);
                ProcessRequestEvents(request);
            }
            else if (data.dwRequestID >= (uint)CLIENTDATA_REQUEST_ID.START_LVAR)
            {
                var request = _simvarRequests.FirstOrDefault(item => item.ParamaterType == ParamaterType.LVar && (UInt16)item.DefinitionId == data.dwDefineID);

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
            _simConnect.CreateClientData(CLIENT_DATA_ID.LVARS, SimConnect.SIMCONNECT_CLIENTDATA_MAX_SIZE, SIMCONNECT_CREATE_CLIENT_DATA_FLAG.DEFAULT);

            // register Client Data (for WASM Module Commands)
            _simConnect.MapClientDataNameToID(CLIENT_DATA_NAME_COMMAND, CLIENT_DATA_ID.CMD);
            _simConnect.CreateClientData(CLIENT_DATA_ID.CMD, MESSAGE_SIZE, SIMCONNECT_CREATE_CLIENT_DATA_FLAG.DEFAULT);
            _simConnect.AddToClientDataDefinition(CLIENTDATA_DEFINITION_ID.CMD, 0, MESSAGE_SIZE, 0, 0);

            // register Client Data (for LVar acknowledge)
            _simConnect.MapClientDataNameToID(CLIENT_DATA_NAME_ACKNOWLEDGE, CLIENT_DATA_ID.ACK);
            _simConnect.CreateClientData(CLIENT_DATA_ID.ACK, (uint)Marshal.SizeOf<LVarAck>(), SIMCONNECT_CREATE_CLIENT_DATA_FLAG.DEFAULT);
            _simConnect.AddToClientDataDefinition(CLIENTDATA_DEFINITION_ID.ACK, 0, (uint)Marshal.SizeOf<LVarAck>(), 0, 0);
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
            _simConnect.CreateClientData(CLIENT_DATA_ID.RESULT, (uint)Marshal.SizeOf<Result>(), SIMCONNECT_CREATE_CLIENT_DATA_FLAG.DEFAULT);
            _simConnect.AddToClientDataDefinition(CLIENTDATA_DEFINITION_ID.RESULT, 0, (uint)Marshal.SizeOf<Result>(), 0, 0);
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

            var data = dataWrapper.dwData[0];

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
            _cache.TryGetValue(request.Name, out var valueAsString);
            if (valueAsString != request.ValueAsString)
            {
                MessageReceivedEvent?.Invoke(request);
                _cache[request.Name] = request.ValueAsString;
            }
        }

        public void SendWASMCmd(String command)
        {
            if (!_connected)
            {
                return;
            }

            String256 cmd;
            cmd.Value = command;

            _simConnect.SetClientData(CLIENT_DATA_ID.CMD, CLIENTDATA_DEFINITION_ID.CMD, SIMCONNECT_CLIENT_DATA_SET_FLAG.DEFAULT, 0, cmd);
        }

        public static dynamic Cast(dynamic obj, Type castTo)
        {
            return Convert.ChangeType(obj, castTo);
        }

        public bool SetVariable(string name, decimal value)
        {
            if (!_connected)
            {
                return false;
            }

            var request = _simvarRequests.FirstOrDefault(item => item.Name == name);
            if (request == null || !request.Registered)
            {
                return false;
            }

            switch (request.ParamaterType)
            {
                case ParamaterType.SimVar:
                    request.ValueAsObject = Cast(value, request.ValueAsObject.GetType());
                    _simConnect.SetDataOnSimObject(request.DefinitionId, 0, SIMCONNECT_DATA_SET_FLAG.DEFAULT, request.ValueAsObject);
                    break;

                case ParamaterType.LVar:
                    SendWASMCmd($"HW.Set.{value} (>L:{request.Name})");
                    break;

                case ParamaterType.KEvent:
                    _simConnect.TransmitClientEvent(
                             0,
                             (EVENT)request.DefinitionId,
                             (uint)value,
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
