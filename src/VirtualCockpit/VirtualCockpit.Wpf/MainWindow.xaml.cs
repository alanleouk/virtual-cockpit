using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Navigation;

namespace Simvars
{
    interface IBaseSimConnectWrapper
    {
        int GetUserSimConnectWinEvent();
        void ReceiveSimConnectMessage();
        void SetWindowHandle(IntPtr _hWnd);
        void Disconnect();
    }
    public partial class MainWindow : Window
    {
        public SimvarsViewModel Model => (SimvarsViewModel)this.DataContext;

        public MainWindow()
        {
            DataContext = new SimvarsViewModel();

            InitializeComponent();
        }

        protected HwndSource GetHWinSource()
        {
            return PresentationSource.FromVisual(this) as HwndSource;
        }

        protected override void OnSourceInitialized(EventArgs e)
        {
            base.OnSourceInitialized(e);
            GetHWinSource().AddHook(WndProc);
            if (DataContext is IBaseSimConnectWrapper oBaseSimConnectWrapper)
            {
                oBaseSimConnectWrapper.SetWindowHandle(GetHWinSource().Handle);
            }
        }

        private IntPtr WndProc(IntPtr hWnd, int iMsg, IntPtr hWParam, IntPtr hLParam, ref bool bHandled)
        {
            if (DataContext is IBaseSimConnectWrapper oBaseSimConnectWrapper)
            {
                try
                {
                    if (iMsg == oBaseSimConnectWrapper.GetUserSimConnectWinEvent())
                    {
                        oBaseSimConnectWrapper.ReceiveSimConnectMessage();
                    }
                }
                catch
                {
                    oBaseSimConnectWrapper.Disconnect();
                }
            }

            return IntPtr.Zero;
        }

        private void LinkOnRequestNavigate(object sender, RequestNavigateEventArgs e)
        {
            System.Diagnostics.Process.Start(e.Uri.ToString());
        }

        private void NumberValidationTextBox(object sender, TextCompositionEventArgs e)
        {
            string sText = e.Text;
            foreach (char c in sText)
            {
                if ( ! (('0' <= c && c <= '9') || c == '+' || c == '-' || c == ',') )
                {
                    e.Handled = true;
                    break;
                }
            }
        }

        private void BRAKE_PARKING_POSITION_Click(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("BRAKE PARKING POSITION", Model.BRAKE_PARKING_POSITION ? "0" : "1");
        }

        private void FLAPS_HANDLE_INDEX_0_Click(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("FLAPS HANDLE INDEX", "0");
        }

        private void FLAPS_HANDLE_INDEX_1_Click(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("FLAPS HANDLE INDEX", "1");
        }

        private void FLAPS_HANDLE_INDEX_2_Click(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("FLAPS HANDLE INDEX", "2");
        }

        private void FLAPS_HANDLE_INDEX_3_Click(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("FLAPS HANDLE INDEX", "3");
        }

        private void FLAPS_HANDLE_INDEX_4_Click(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("FLAPS HANDLE INDEX", "4");
        }

        private void SPOILERS_ARMED_Click(object sender, RoutedEventArgs e)
        {
            // Model.TrySetValue("SPOILERS ARMED", Model.SPOILERS_ARMED ? "0" : "1");
        }

        private void SPOILERS_HANDLE_POSITION_0_Click(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("SPOILERS HANDLE POSITION", "0");
        }

        private void SPOILERS_HANDLE_POSITION_1_Click(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("SPOILERS HANDLE POSITION", "25");
        }

        private void SPOILERS_HANDLE_POSITION_2_Click(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("SPOILERS HANDLE POSITION", "50");
        }

        private void SPOILERS_HANDLE_POSITION_3_Click(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("SPOILERS HANDLE POSITION", "75");
        }

        private void SPOILERS_HANDLE_POSITION_4_Click(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("SPOILERS HANDLE POSITION", "100");
        }

        private void Throttle_CL_Click(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("GENERAL ENG THROTTLE LEVER POSITION:1", "89");
            Model.TrySetValue("GENERAL ENG THROTTLE LEVER POSITION:2", "89");
        }

        private void NOSE_L_Click(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("RUDDER TRIM PCT", (Model.RUDDER_TRIM_PCT - 1).ToString());
        }

        private void NOSE_R_Click(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("RUDDER TRIM PCT", (Model.RUDDER_TRIM_PCT + 1).ToString());
        }

        private void RUDDER_RESET(object sender, RoutedEventArgs e)
        {
            Model.TrySetValue("RUDDER TRIM PCT", "0");
        }
    }
}
