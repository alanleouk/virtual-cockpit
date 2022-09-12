using System.Collections.ObjectModel;
using System.Runtime.InteropServices;
using Microsoft.FlightSimulator.SimConnect;
using VirtualCockpit.Lib.Models;

namespace VirtualCockpit.Lib.Sevices
{
    public class SimConnectService
    {
        private uint _currentDefinition = 0;
        private uint _currentRequest = 0;
        public uint _objectIdRequest = 0;

        private readonly ObservableCollection<uint> _objectIds;
        private readonly ObservableCollection<SimvarRequest> _simvarRequests;
        private readonly ObservableCollection<string> _errorMessages;

        public const int WM_USER_SIMCONNECT = 0x0402;
        private IntPtr _hWnd = new(0);
        private SimConnect _simConnect = null;

        private bool _objectIDSelectionEnabled = false;
        private SIMCONNECT_SIMOBJECT_TYPE _simObjectType = SIMCONNECT_SIMOBJECT_TYPE.USER;

        private bool _FSXcompatible = false;
        private bool _connected = false;
        
        public delegate void MessageReceivedEventHandler(SimvarRequest request); 
        public event MessageReceivedEventHandler MessageReceivedEvent;
        
        public SimConnectService()
        {
            _objectIds = new ObservableCollection<uint>();
            _simvarRequests = new ObservableCollection<SimvarRequest>();
            _errorMessages = new ObservableCollection<string>();

            _objectIds.Add(1);
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
            Console.WriteLine("Connect");

            try
            {
                _simConnect = new SimConnect("Simconnect - Simvar test", _hWnd, WM_USER_SIMCONNECT, null, _FSXcompatible ? (uint)1 : 0);
                _simConnect.OnRecvOpen += SimConnect_OnReceiveOpen;
                _simConnect.OnRecvQuit += SimConnect_OnReceiveQuit;
                _simConnect.OnRecvException += SimConnect_OnReceiveException;
                _simConnect.OnRecvSimobjectDataBytype += SimConnect_OnReceiveSimObjectDataByType;
                _simConnect.OnRecvSimobjectData += SimConnect_OnReceiveSimObjectData;
            }
            catch (COMException ex)
            {
                Console.WriteLine("Connection to KH failed: " + ex.Message);
            }
        }

        public void Disconnect()
        {
            Console.WriteLine("Disconnect");
            if (_simConnect != null)
            {
                _simConnect.Dispose();
                _simConnect = null;
            }

            _connected = false;

            // Set all requests as pending
            foreach (var oSimvarRequest in _simvarRequests)
            {
                oSimvarRequest.Pending = true;
                oSimvarRequest.StillPending = true;
            }
        }

        public void AddRequest(string name, string? units, int precision)
        {
            var simvarRequest = new SimvarRequest
            {
                eDef = (DEFINITION)_currentDefinition,
                eRequest = (REQUEST)_currentRequest,
                Name = name,
                Units = units,
                Precision = precision
            };

            simvarRequest.Pending = !RegisterToSimConnect(simvarRequest);
            simvarRequest.StillPending = simvarRequest.Pending;

            _simvarRequests.Add(simvarRequest);

            ++_currentDefinition;
            ++_currentRequest;
        }

        private bool RegisterToSimConnect(SimvarRequest request)
        {
            if (_simConnect != null)
            {
                if (request.Units == null)
                {
                    _simConnect.AddToDataDefinition(request.eDef, request.Name, "", SIMCONNECT_DATATYPE.STRING256, 0.0f, SimConnect.SIMCONNECT_UNUSED);
                    _simConnect.RegisterDataDefineStruct<Struct1>(request.eDef);
                }
                else
                {
                    _simConnect.AddToDataDefinition(request.eDef, request.Name, request.Units, SIMCONNECT_DATATYPE.FLOAT64, 0.0f, SimConnect.SIMCONNECT_UNUSED);
                    _simConnect.RegisterDataDefineStruct<double>(request.eDef);
                }

                return true;
            }

            return false;
        }

        private void SimConnect_OnReceiveOpen(SimConnect sender, SIMCONNECT_RECV_OPEN data)
        {
            Console.WriteLine("SimConnect_OnReceiveOpen");
            Console.WriteLine("Connected to KH");

            _connected = true;

            // Register pending requests
            foreach (SimvarRequest oSimvarRequest in _simvarRequests)
            {
                if (oSimvarRequest.Pending)
                {
                    oSimvarRequest.Pending = !RegisterToSimConnect(oSimvarRequest);
                    oSimvarRequest.StillPending = oSimvarRequest.Pending;
                    _simConnect?.RequestDataOnSimObject(oSimvarRequest.eRequest, oSimvarRequest.eDef, SimConnect.SIMCONNECT_OBJECT_ID_USER, SIMCONNECT_PERIOD.SIM_FRAME, SIMCONNECT_DATA_REQUEST_FLAG.CHANGED, 0, 0, 0);
                }
            }
        }

        /// The case where the user closes game
        private void SimConnect_OnReceiveQuit(SimConnect sender, SIMCONNECT_RECV data)
        {
            Console.WriteLine("SimConnect_OnReceiveQuit");
            Console.WriteLine("KH has exited");

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

            uint iRequest = data.dwRequestID;
            uint iObject = data.dwObjectID;
            if (!_objectIds.Contains(iObject))
            {
                _objectIds.Add(iObject);
            }

            decimal valueAsDecimal = 0;
            if (data.dwData.Length > 0)
            {
                valueAsDecimal = (decimal)(double)data.dwData[0];
            }

            foreach (SimvarRequest oSimvarRequest in _simvarRequests)
            {
                if (iRequest == (uint)oSimvarRequest.eRequest && (!_objectIDSelectionEnabled || iObject == _objectIdRequest))
                {
                    if (oSimvarRequest.Units == null)
                    {
                        Struct1 result = (Struct1)data.dwData[0];
                        oSimvarRequest.ValueAsDecimal = 0;
                        oSimvarRequest.ValueAsString = result.sValue;
                    }
                    else
                    {
                        oSimvarRequest.ValueAsDecimal = valueAsDecimal;
                        oSimvarRequest.ValueAsString = valueAsDecimal.ToString($"F{oSimvarRequest.Precision}");

                    }

                    oSimvarRequest.Pending = false;
                    oSimvarRequest.StillPending = false;
                }
            }

            var request = _simvarRequests[(int)data.dwRequestID];
            if (MessageReceivedEvent != null)
            {
                MessageReceivedEvent(request);
            }
            // Console.WriteLine(request.sName);
        }

        private void SimConnect_OnReceiveSimObjectDataByType(SimConnect sender, SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE data)
        {
            Console.WriteLine("SimConnect_OnReceiveSimObjectDataByType");

            uint iRequest = data.dwRequestID;
            uint iObject = data.dwObjectID;
            if (!_objectIds.Contains(iObject))
            {
                _objectIds.Add(iObject);
            }
            foreach (SimvarRequest oSimvarRequest in _simvarRequests)
            {
                if (iRequest == (uint)oSimvarRequest.eRequest && (!_objectIDSelectionEnabled || iObject == _objectIdRequest))
                {
                    if (oSimvarRequest.Units == null)
                    {
                        Struct1 result = (Struct1)data.dwData[0];
                        oSimvarRequest.ValueAsDecimal = 0;
                        oSimvarRequest.ValueAsString = result.sValue;
                    }
                    else
                    {
                        var valueAsDecimal = (decimal)(double)data.dwData[0];
                        oSimvarRequest.ValueAsDecimal = valueAsDecimal;
                        oSimvarRequest.ValueAsString = valueAsDecimal.ToString($"F{oSimvarRequest.Precision}");

                    }

                    oSimvarRequest.Pending = false;
                    oSimvarRequest.StillPending = false;
                }
            }
        }
    }
}
