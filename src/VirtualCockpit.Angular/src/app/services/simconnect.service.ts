import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { filter, Observable, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { AddRequest } from '../models/add-request';
import { ParamaterType } from '../models/paramater-type';
import { Simvar } from '../models/simvar';
import { SimvarRequest } from '../models/simvar-request';
import { ConfigService } from './config.service';

@Injectable()
export class SimConnectService {
  socket: WebSocketSubject<SimvarRequest>;
  subject = new Subject<SimvarRequest>();

  public allSimvars: Simvar[] = [
    // Debug Commands
    {
      category: 'Debug',
      paramaterType: ParamaterType.LVar,
      name: 'DEBUG COMMAND',
      description: 'Command used for debugging',
      units: 'number',
      precision: 6,
    },
    // Flaps
    {
      category: 'Flaps',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_FLAPS_HANDLE_INDEX',
      description: 'A32NX flaps handle position, 0...4',
      units: 'number',
      precision: 0,
    },
    {
      category: 'Flaps',
      paramaterType: ParamaterType.SimVar,
      name: 'FLAPS HANDLE INDEX',
      description: 'Current flaps position, 1..5', // Value TBC
      units: 'number',
      precision: 0,
    },
    // Gear
    {
      category: 'Landing Gear',
      paramaterType: ParamaterType.SimVar,
      name: 'GEAR HANDLE POSITION',
      description: 'Current gear handle position',
      units: 'number',
      precision: 0,
      writable: true,
    },
    // Speed
    {
      category: 'Speed',
      paramaterType: ParamaterType.SimVar,
      name: 'AIRSPEED INDICATED',
      units: 'knots',
      precision: 1,
    },
    // Spoliers
    {
      category: 'Spoilers',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_SPOILERS_HANDLE_POSITION',
      units: 'number',
      precision: 2,
    },
    {
      category: 'Spoilers',
      paramaterType: ParamaterType.SimVar,
      name: 'SPOILERS HANDLE POSITION',
      units: 'number',
      precision: 0,
    },
    {
      category: 'Spoilers',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_SPOILERS_ARMED',
      units: 'bool',
      precision: 0,
    },
    {
      category: 'Spoilers',
      paramaterType: ParamaterType.SimVar,
      name: 'SPOILERS ARMED',
      units: 'number',
      precision: 0,
      writable: true,
    },
    {
      category: 'Spoilers',
      paramaterType: ParamaterType.KEvent,
      name: 'SPOILERS_ARM_TOGGLE',
      units: 'number',
      precision: 0,
    },
    {
      category: 'Spoilers',
      paramaterType: ParamaterType.KEvent,
      name: 'SPOILERS_SET',
      units: 'number',
      precision: 0,
    },
    // EFIS Control Panel
    {
      category: 'EFIS Control Panel',
      paramaterType: ParamaterType.SimVar,
      name: 'KOHLSMAN SETTING MB:1',
      units: 'number',
      precision: 0,
    },
    {
      category: 'EFIS Control Panel',
      paramaterType: ParamaterType.SimVar,
      name: 'KOHLSMAN SETTING HG:1',
      units: 'number',
      precision: 0,
    },
    {
      category: 'EFIS Control Panel',
      paramaterType: ParamaterType.KEvent,
      name: 'KOHLSMAN_INC',
      units: 'number',
      precision: 0,
    },
    {
      category: 'EFIS Control Panel',
      paramaterType: ParamaterType.KEvent,
      name: 'KOHLSMAN_DEC',
      units: 'number',
      precision: 0,
    },
    {
      category: 'EFIS Control Panel',
      paramaterType: ParamaterType.KEvent,
      name: 'KOHLSMAN_SET',
      units: 'number',
      precision: 0,
    },
    {
      category: 'EFIS Control Panel',
      paramaterType: ParamaterType.LVar,
      name: 'XMLVAR_Baro1_Mode',
      units: 'number',
      precision: 0,
      writable: true,
    },
    {
      category: 'EFIS Control Panel',
      paramaterType: ParamaterType.LVar,
      name: 'XMLVAR_BARO_SELECTOR_HPA_1',
      units: 'number',
      precision: 0,
      writable: true,
    },
    {
      category: 'EFIS Control Panel',
      paramaterType: ParamaterType.SimVar,
      name: 'AUTOPILOT FLIGHT DIRECTOR ACTIVE',
      units: 'number',
      precision: 0,
      writable: false,
    },
    {
      category: 'EFIS Control Panel',
      paramaterType: ParamaterType.KEvent,
      name: 'TOGGLE_FLIGHT_DIRECTOR',
      units: 'number',
      precision: 0,
      writable: true,
    },
    {
      category: 'EFIS Control Panel',
      paramaterType: ParamaterType.LVar,
      name: 'BTN_LS_1_FILTER_ACTIVE',
      units: 'number',
      precision: 0,
      writable: true,
    },
    {
      category: 'EFIS Control Panel',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_EFIS_L_OPTION',
      description: '0=none, 1=CSTR, 2=VOR, 3=WPT, 4=NDB, 5=ARPT',
      units: 'number',
      precision: 0,
      writable: true,
    },
    {
      category: 'EFIS Control Panel',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_EFIS_L_ND_MODE',
      description: '0=ROSE ILS, 1=ROSE VOR, 2=ROSE NAV. 3=ARC, 4=PLAN',
      units: 'number',
      precision: 0,
      writable: true,
    },
    {
      category: 'EFIS Control Panel',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_EFIS_L_ND_RANGE',
      description: '0=10, ..., 5=320',
      units: 'number',
      precision: 0,
      writable: true,
    },
    // FCU Panel (Speed)
    {
      category: 'FCU Panel (Speed)',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_AUTOPILOT_SPEED_SELECTED',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Speed)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_SPD_INC',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Speed)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_SPD_DEC',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Speed)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_SPD_SET',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Speed)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_SPD_PUSH',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Speed)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_SPD_PULL',
      units: 'number',
      precision: 0,
    },
    // FCU Panel (Heading)
    {
      category: 'FCU Panel (Heading)',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_AUTOPILOT_HEADING_SELECTED',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Heading)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_HDG_INC',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Heading)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_HDG_DEC',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Heading)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_HDG_SET',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Heading)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_HDG_PUSH',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Heading)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_HDG_PULL',
      units: 'number',
      precision: 0,
    },
    // FCU Panel (LOC)
    {
      category: 'FCU Panel (LOC)',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_FCU_LOC_MODE_ACTIVE',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (LOC)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_LOC_PUSH',
      units: 'number',
      precision: 0,
    },
    // FCU Panel (Altitude)
    {
      category: 'FCU Panel (Altitude)',
      paramaterType: ParamaterType.SimVar,
      name: 'AUTOPILOT ALTITUDE LOCK VAR:3',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Altitude)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_ALT_INC',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Altitude)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_ALT_DEC',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Altitude)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_ALT_SET',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Altitude)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_ALT_PUSH',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Altitude)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_ALT_PULL',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Altitude)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_ALT_INCREMENT_TOGGLE',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Altitude)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_ALT_INCREMENT_SET',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Altitude)',
      paramaterType: ParamaterType.LVar,
      name: 'XMLVAR_AUTOPILOT_ALTITUDE_INCREMENT',
      units: 'number',
      precision: 0,
    },
    // FCU Panel (Expedite)
    {
      category: 'FCU Panel (Expedite)',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_FMA_EXPEDITE_MODE',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Expedite)',
      paramaterType: ParamaterType.KEvent,
      name: '	A32NX.FCU_EXPED_PUSH',
      units: 'number',
      precision: 0,
    },
    // FCU Panel (Vertical)
    {
      category: 'FCU Panel (Vertical)',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_AUTOPILOT_VS_SELECTED',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Vertical)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_VS_INC',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Vertical)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_VS_DEC',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Vertical)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_VS_SET',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Vertical)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_VS_PUSH',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Vertical)',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.FCU_VS_PULL',
      units: 'number',
      precision: 0,
    },
    // FCU Panel (Approach)
    {
      category: 'FCU Panel (Approach)',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_FCU_APPR_MODE_ACTIVE',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Approach)',
      paramaterType: ParamaterType.KEvent,
      name: '	A32NX.FCU_APPR_PUSH',
      units: 'number',
      precision: 0,
    },
    // FCU Panel (Autopilot)
    {
      category: 'FCU Panel (Autopilot)',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_AUTOPILOT_1_ACTIVE',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Autopilot)',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_AUTOPILOT_2_ACTIVE',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Autopilot)',
      paramaterType: ParamaterType.KEvent,
      name: '	A32NX.FCU_AP_1_PUSH',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Autopilot)',
      paramaterType: ParamaterType.KEvent,
      name: '	A32NX.FCU_AP_2_PUSH',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Autopilot)',
      paramaterType: ParamaterType.KEvent,
      name: '	A32NX.FCU_AP_DISCONNECT_PUSH',
      units: 'number',
      precision: 0,
    },
    // FCU Panel (Auto Thrust)
    {
      category: 'FCU Panel (Auto Thrust)',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_AUTOTHRUST_STATUS',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Auto Thrust)',
      paramaterType: ParamaterType.KEvent,
      name: '	A32NX.FCU_ATHR_PUSH',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Auto Thrust)',
      paramaterType: ParamaterType.KEvent,
      name: '	A32NX.FCU_ATHR_DISCONNECT_PUSH',
      units: 'number',
      precision: 0,
    },
    // FCU Panel (Speed/Mach)
    {
      category: 'FCU Panel (Speed/Mach)',
      paramaterType: ParamaterType.SimVar,
      name: 'AUTOPILOT MANAGED SPEED IN MACH',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Speed/Mach)',
      paramaterType: ParamaterType.KEvent,
      name: '	A32NX.FCU_SPD_MACH_TOGGLE_PUSH',
      units: 'number',
      precision: 0,
    },
    // FCU Panel (Heading Track / VS FPA)
    {
      category: 'FCU Panel (Heading Track / VS FPA)',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_TRK_FPA_MODE_ACTIVE',
      units: 'number',
      precision: 0,
    },
    {
      category: 'FCU Panel (Heading Track / VS FPA)',
      paramaterType: ParamaterType.KEvent,
      name: '	A32NX.FCU_TRK_FPA_TOGGLE_PUSH',
      units: 'number',
      precision: 0,
    },
    // Brakes
    {
      category: 'Brakes',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_AUTOBRAKES_ARMED_MODE',
      units: 'number',
      precision: 0,
    },
    {
      category: 'Brakes',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_AUTOBRAKES_ARMED_MODE_SET',
      units: 'number',
      precision: 0,
    },
    {
      category: 'Brakes',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_AUTOBRAKES_ACTIVE',
      units: 'number',
      precision: 0,
    },
    {
      category: 'Brakes',
      paramaterType: ParamaterType.KEvent,
      name: 'AUTOBRAKE_SET',
      units: 'A32NX.AUTOBRAKE_SET',
      precision: 0,
    },
    {
      category: 'Brakes',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.AUTOBRAKE_SET_DISARM	-',
      units: 'number',
      precision: 0,
    },
    {
      category: 'Brakes',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.AUTOBRAKE_SET_LO',
      units: 'number',
      precision: 0,
    },
    {
      category: 'Brakes',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.AUTOBRAKE_SET_MED',
      units: 'number',
      precision: 0,
    },
    {
      category: 'Brakes',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.AUTOBRAKE_SET_MAX',
      units: 'number',
      precision: 0,
    },
    {
      category: 'Brakes',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.AUTOBRAKE_BUTTON_LO',
      units: 'number',
      precision: 0,
    },
    {
      category: 'Brakes',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.AUTOBRAKE_BUTTON_MED',
      units: 'number',
      precision: 0,
    },
    {
      category: 'Brakes',
      paramaterType: ParamaterType.KEvent,
      name: 'A32NX.AUTOBRAKE_BUTTON_MAX',
      units: 'number',
      precision: 0,
    },
    {
      category: 'Brakes',
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_PARK_BRAKE_LEVER_POS',
      units: 'number',
      precision: 0,
    },
    // Rudder Trim
    {
      category: 'Rudder Trim',
      paramaterType: ParamaterType.SimVar,
      name: 'RUDDER TRIM PCT',
      units: 'number',
      precision: 2,
      writable: true,
    },
    // Throttle
    {
      category: 'Throttle',
      paramaterType: ParamaterType.SimVar,
      name: 'GENERAL ENG THROTTLE LEVER POSITION:1',
      units: 'percent',
      precision: 0,
    },
    {
      category: 'Throttle',
      paramaterType: ParamaterType.SimVar,
      name: 'GENERAL ENG THROTTLE LEVER POSITION:2',
      units: 'percent',
      precision: 0,
    },
  ];

  constructor(private http: HttpClient, private config: ConfigService) {
    this.socket = webSocket<SimvarRequest>(
      'ws://' + config.socksHostAndPort + '/ws'
    );
    this.socket.subscribe(
      (msg) => this.subject.next(msg),
      (err) => console.log(err),
      () => console.log('complete')
    );
  }

  subscribeTo(simvars: string[]): Observable<SimvarRequest> {
    return this.subject.pipe(filter((item) => simvars.includes(item.name)));
  }

  subscribeToAll(): Observable<SimvarRequest> {
    return this.subject;
  }

  setVariable(name: string, value: number): Observable<any> {
    return this.http.put('http://' + this.config.socksHostAndPort + '/simvar', {
      name,
      value,
    });
  }

  connect(): Observable<any> {
    return this.http.post(
      'http://' + this.config.socksHostAndPort + '/connect',
      {}
    );
  }

  disconnect(): Observable<any> {
    return this.http.post(
      'http://' + this.config.socksHostAndPort + '/disconnect',
      {}
    );
  }

  reset(): Observable<any> {
    return this.http.post(
      'http://' + this.config.socksHostAndPort + '/reset',
      {}
    );
  }

  add(requests: AddRequest[]): Observable<any> {
    return this.http.post(
      'http://' + this.config.socksHostAndPort + '/add',
      requests
    );
  }

  addAll(): Observable<any> {
    return this.http.post(
      'http://' + this.config.socksHostAndPort + '/add',
      this.allSimvars
    );
  }

  send(): Observable<any> {
    return this.http.post(
      'http://' + this.config.socksHostAndPort + '/send',
      {}
    );
  }
}
