import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { SimvarRequest } from 'src/app/models/simvar-request';
import { SimConnectService } from 'src/app/services/simconnect.service';

export class A32NxAutobrakeGearProperties {
  ldg1Color: string;
  ldg2Color: string;
  ldg3Color: string;
  //
  ab1Color: string;
  ab2Color: string;
  ab3Color: string;
  //
  gearUpColor: string;
  gearDownColor: string;

  constructor() {
    this.ldg1Color = 'default';
    this.ldg2Color = 'default';
    this.ldg3Color = 'default';
    //
    this.ab1Color = 'default';
    this.ab2Color = 'default';
    this.ab3Color = 'default';
    //
    this.gearUpColor = 'default';
    this.gearDownColor = 'default';
  }
}

@Component({
  selector: 'app-a32nx-autobrake-gear',
  templateUrl: './a32nx-autobrake-gear.component.html',
})
export class A32NxAutobrakeGearComponent implements OnInit {
  properties = new A32NxAutobrakeGearProperties();

  readFrom = ['GEAR HANDLE POSITION', 'GEAR LEFT POSITION', 'GEAR CENTER POSITION', 'GEAR RIGHT POSITION', 'A32NX_AUTOBRAKES_ARMED_MODE'];
  writeTo = ['GEAR_UP', 'GEAR_DOWN', 'GEAR HANDLE POSITION', 'A32NX_AUTOBRAKES_ARMED_MODE_SET'];

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
      case 'GEAR HANDLE POSITION':
        this.properties.gearDownColor = 'default';
        this.properties.gearUpColor = 'default';
        if (request.valueAsDecimal === 1) {
          this.properties.gearDownColor = 'green';
        } else {
          this.properties.gearUpColor = 'green';
        }
        break;
      case 'GEAR LEFT POSITION':
        console.log(request.valueAsDecimal);
        if (request.valueAsDecimal < 0.5) {
          this.properties.ldg1Color = 'default';
        } else if (request.valueAsDecimal < 1) {
          this.properties.ldg1Color = 'amber';
        } else {
          this.properties.ldg1Color = 'green';
        }
        break;
      case 'GEAR CENTER POSITION':
        if (request.valueAsDecimal < 0.5) {
          this.properties.ldg2Color = 'default';
        } else if (request.valueAsDecimal < 1) {
          this.properties.ldg2Color = 'amber';
        } else {
          this.properties.ldg2Color = 'green';
        }
        break;
      case 'GEAR RIGHT POSITION':
        if (request.valueAsDecimal < 0.5) {
          this.properties.ldg3Color = 'default';
        } else if (request.valueAsDecimal < 1) {
          this.properties.ldg3Color = 'amber';
        } else {
          this.properties.ldg3Color = 'green';
        }
        break;
      case 'A32NX_AUTOBRAKES_ARMED_MODE':
        this.properties.ab1Color = 'default';
        this.properties.ab2Color = 'default';
        this.properties.ab3Color = 'default';

        switch (request.valueAsDecimal) {
          case 1:
            this.properties.ab1Color = 'green';
            break;
          case 2:
            this.properties.ab2Color = 'green';
            break;
          case 3:
            this.properties.ab3Color = 'green';
            break;
        }
        break;
    }
  }

  sendEvent(name: string, value: number = 0) {
    this.simConnect.setVariable(name, value).subscribe();
  }
}
