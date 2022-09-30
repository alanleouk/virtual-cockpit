import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { SimvarRequest } from 'src/app/models/simvar-request';
import { SimConnectService } from 'src/app/services/simconnect.service';

export class A32NxFcuProperties {
  ap1Color: string;
  ap2Color: string;
  athrColor: string;
  locColor: string;
  expedColor: string;
  apprColor: string;
  //
  lateralSpeed: number;
  heading: number;
  altitude: number;
  verticalSpeed: number;

  constructor() {
    this.ap1Color = 'default';
    this.ap2Color = 'default';
    this.athrColor = 'default';
    this.locColor = 'default';
    this.expedColor = 'default';
    this.apprColor = 'default';
    //
    this.lateralSpeed = 0;
    this.heading = 0;
    this.altitude = 0;
    this.verticalSpeed = 0;
  }
}

@Component({
  selector: 'app-a32nx-fcu',
  templateUrl: './a32nx-fcu.component.html',
})
export class A32NxFcuComponent implements OnInit {
  properties = new A32NxFcuProperties();

  readFrom = [
    'A32NX_AUTOPILOT_SPEED_SELECTED',
    'A32NX_AUTOPILOT_HEADING_SELECTED',
    'AUTOPILOT ALTITUDE LOCK VAR:3',
    'A32NX_AUTOPILOT_VS_SELECTED',
    //
    'A32NX_FCU_LOC_MODE_ACTIVE',
    'A32NX_FMA_EXPEDITE_MODE',
    'A32NX_FCU_APPR_MODE_ACTIVE',
    'A32NX_AUTOPILOT_1_ACTIVE',
    'A32NX_AUTOPILOT_2_ACTIVE',
    'A32NX_AUTOTHRUST_STATUS',
    'A32NX_TRK_FPA_MODE_ACTIVE',
  ];
  writeTo = [
    'A32NX.FCU_SPD_SET',
    'A32NX.FCU_SPD_PUSH',
    'A32NX.FCU_SPD_PULL',
    'A32NX.FCU_HDG_SET',
    'A32NX.FCU_HDG_PUSH',
    'A32NX.FCU_HDG_PULL',
    'A32NX.FCU_ALT_SET',
    'A32NX.FCU_ALT_PUSH',
    'A32NX.FCU_ALT_PULL',
    'A32NX.FCU_VS_SET',
    'A32NX.FCU_VS_PUSH',
    'A32NX.FCU_VS_PULL',
    //
    'A32NX.FCU_AP_1_PUSH',
    'A32NX.FCU_AP_2_PUSH',
    'A32NX.FCU_ATHR_PUSH',
    'A32NX.FCU_LOC_PUSH',
    'A32NX.FCU_EXPED_PUSH',
    'A32NX.FCU_APPR_PUSH',
    'A32NX.FCU_TRK_FPA_TOGGLE_PUSH',
  ];

  public value: number = 0;

  constructor(private simConnect: SimConnectService) {}

  ngOnInit(): void {
    this.simConnect.subscribeTo(this.readFrom).subscribe((request) => this.parseSimvarRequest(request));

    const simVars = this.simConnect.allSimvars.filter((item) => this.readFrom.includes(item.name) || this.writeTo.includes(item.name));

    this.simConnect
      .add(simVars)
      .pipe(
        switchMap((_) => this.simConnect.connect()),
        switchMap((_) => this.simConnect.send())
      )
      .subscribe();
  }

  parseSimvarRequest(request: SimvarRequest): void {
    switch (request.name) {
      case 'A32NX_FCU_LOC_MODE_ACTIVE':
        switch (request.valueAsDecimal) {
          case 0:
            this.properties.locColor = 'default';
            break;
          case 1:
            this.properties.locColor = 'green';
            break;
        }
        break;
      case 'A32NX_FMA_EXPEDITE_MODE':
        switch (request.valueAsDecimal) {
          case 0:
            this.properties.expedColor = 'default';
            break;
          case 1:
            this.properties.expedColor = 'green';
            break;
        }
        break;
      case 'A32NX_FCU_APPR_MODE_ACTIVE':
        switch (request.valueAsDecimal) {
          case 0:
            this.properties.apprColor = 'default';
            break;
          case 1:
            this.properties.apprColor = 'green';
            break;
        }
        break;
      case 'A32NX_AUTOPILOT_1_ACTIVE':
        switch (request.valueAsDecimal) {
          case 0:
            this.properties.ap1Color = 'default';
            break;
          case 1:
            this.properties.ap1Color = 'green';
            break;
        }
        break;
      case 'A32NX_AUTOPILOT_2_ACTIVE':
        switch (request.valueAsDecimal) {
          case 0:
            this.properties.ap2Color = 'default';
            break;
          case 1:
            this.properties.ap2Color = 'green';
            break;
        }
        break;
      case 'A32NX_AUTOTHRUST_STATUS':
        switch (request.valueAsDecimal) {
          case 0:
            this.properties.athrColor = 'default';
            break;
          case 1:
            this.properties.athrColor = 'amber';
            break;
          case 2:
            this.properties.athrColor = 'green';
            break;
        }
        break;
    }
  }

  offsetLateralSpeed(offset: number) {
    var newValue = this.properties.lateralSpeed + offset;
    if (newValue < 0) {
      newValue = 0;
    }
    if (newValue > 399) {
      newValue = 399;
    }
    this.simConnect.setVariable('A32NX.FCU_SPD_SET', newValue).subscribe();
  }

  offsetHeading(offset: number) {
    var newValue = (this.properties.lateralSpeed + offset) % 360;
    this.simConnect.setVariable('A32NX.FCU_HDG_SET', newValue).subscribe();
  }

  offsetAltitude(offset: number) {
    var newValue = this.properties.lateralSpeed + offset;
    if (newValue < 100) {
      newValue = 100;
    }
    if (newValue > 49000) {
      newValue = 49000;
    }
    this.simConnect.setVariable('A32NX.FCU_ALT_SET', newValue).subscribe();
  }

  offsetVerticalSpeed(offset: number) {
    var newValue = this.properties.lateralSpeed + offset;
    if (newValue < -6000) {
      newValue = -6000;
    }
    if (newValue > 6000) {
      newValue = 6000;
    }
    this.simConnect.setVariable('A32NX.FCU_VS_SET', newValue).subscribe();
  }

  sendEvent(name: string, value: number = 0) {
    this.simConnect.setVariable(name, value).subscribe();
  }
}
