import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { SimvarRequest } from 'src/app/models/simvar-request';
import { SimConnectService } from 'src/app/services/simconnect.service';

export class A32NxEfisProperties {
  fdColor: string;
  lsColor: string;
  //
  ndFilterCstrColor: string;
  ndFilterWptColor: string;
  ndFilterVordColor: string;
  ndFilterNdbColor: string;
  ndFilterArptColor: string;
  //
  ndModeLsColor: string;
  ndModeVorColor: string;
  ndModeNavColor: string;
  ndModeArcColor: string;
  ndModePlanColor: string;
  //
  ndRange10Color: string;
  ndRange20Color: string;
  ndRange40Color: string;
  ndRange80Color: string;
  ndRange160Color: string;
  ndRange320Color: string;
  //
  qnhValue: number;

  constructor() {
    this.fdColor = 'default';
    this.lsColor = 'default';
    //
    this.ndFilterCstrColor = 'default';
    this.ndFilterWptColor = 'default';
    this.ndFilterVordColor = 'default';
    this.ndFilterNdbColor = 'default';
    this.ndFilterArptColor = 'default';
    //
    this.ndModeLsColor = 'default';
    this.ndModeVorColor = 'default';
    this.ndModeNavColor = 'default';
    this.ndModeArcColor = 'default';
    this.ndModePlanColor = 'default';
    //
    this.ndRange10Color = 'default';
    this.ndRange20Color = 'default';
    this.ndRange40Color = 'default';
    this.ndRange80Color = 'default';
    this.ndRange160Color = 'default';
    this.ndRange320Color = 'default';
    //
    this.qnhValue = 1000;
  }
}

@Component({
  selector: 'app-a32nx-efis',
  templateUrl: './a32nx-efis.component.html',
})
export class A32NxEfisComponent implements OnInit {
  properties = new A32NxEfisProperties();

  readFrom: string[] = [
    'KOHLSMAN SETTING MB:1',
    'AUTOPILOT FLIGHT DIRECTOR ACTIVE',
    'BTN_LS_1_FILTER_ACTIVE',
    'A32NX_EFIS_L_OPTION',
    'A32NX_EFIS_L_ND_MODE',
    'A32NX_EFIS_L_ND_RANGE',
  ];
  writeTo: string[] = [
    'KOHLSMAN_INC',
    'KOHLSMAN_DEC',
    'KOHLSMAN_SET',
    'TOGGLE_FLIGHT_DIRECTOR',
    'BTN_LS_1_FILTER_ACTIVE',
    'A32NX_EFIS_L_OPTION',
    'A32NX_EFIS_L_ND_MODE',
    'A32NX_EFIS_L_ND_RANGE',
  ];

  public value: number = 0;

  constructor(private simConnect: SimConnectService) {}

  ngOnInit(): void {
    this.simConnect.subscribeTo(this.readFrom).subscribe((request) => this.parseSimvarRequest(request));

    const simvars = this.simConnect.allSimvars.filter((item) => this.readFrom.includes(item.name) || this.writeTo.includes(item.name));

    this.simConnect
      .add({ simvarDefinitions: simvars })
      .pipe(
        switchMap((_) => this.simConnect.connect()),
        switchMap((_) => this.simConnect.send({ simvarKeys: this.readFrom }))
      )
      .subscribe();
  }

  parseSimvarRequest(request: SimvarRequest): void {
    switch (request.name) {
      case 'KOHLSMAN SETTING MB:1':
        this.properties.qnhValue = Math.floor(request.valueAsDecimal / 100);
        break;

      case 'AUTOPILOT FLIGHT DIRECTOR ACTIVE':
        this.properties.fdColor = request.valueAsDecimal == 0 ? 'default' : 'green';
        break;

      case 'BTN_LS_1_FILTER_ACTIVE':
        this.properties.lsColor = request.valueAsDecimal == 0 ? 'default' : 'green';
        break;

      case 'A32NX_EFIS_L_OPTION':
        this.properties.ndFilterCstrColor = 'default';
        this.properties.ndFilterVordColor = 'default';
        this.properties.ndFilterWptColor = 'default';
        this.properties.ndFilterNdbColor = 'default';
        this.properties.ndFilterArptColor = 'default';

        switch (request.valueAsDecimal) {
          case 1:
            this.properties.ndFilterCstrColor = 'green';
            break;
          case 2:
            this.properties.ndFilterVordColor = 'green';
            break;
          case 3:
            this.properties.ndFilterWptColor = 'green';
            break;
          case 4:
            this.properties.ndFilterNdbColor = 'green';
            break;
          case 5:
            this.properties.ndFilterArptColor = 'green';
            break;
        }
        break;

      case 'A32NX_EFIS_L_ND_MODE':
        this.properties.ndModeLsColor = 'default';
        this.properties.ndModeVorColor = 'default';
        this.properties.ndModeNavColor = 'default';
        this.properties.ndModeArcColor = 'default';
        this.properties.ndModePlanColor = 'default';

        switch (request.valueAsDecimal) {
          case 0:
            this.properties.ndModeLsColor = 'green';
            break;
          case 1:
            this.properties.ndModeVorColor = 'green';
            break;
          case 2:
            this.properties.ndModeNavColor = 'green';
            break;
          case 3:
            this.properties.ndModeArcColor = 'green';
            break;
          case 4:
            this.properties.ndModePlanColor = 'green';
            break;
        }
        break;

      case 'A32NX_EFIS_L_ND_RANGE':
        this.properties.ndRange10Color = 'default';
        this.properties.ndRange20Color = 'default';
        this.properties.ndRange40Color = 'default';
        this.properties.ndRange80Color = 'default';
        this.properties.ndRange160Color = 'default';
        this.properties.ndRange320Color = 'default';

        switch (request.valueAsDecimal) {
          case 0:
            this.properties.ndRange10Color = 'green';
            break;
          case 1:
            this.properties.ndRange20Color = 'green';
            break;
          case 2:
            this.properties.ndRange40Color = 'green';
            break;
          case 3:
            this.properties.ndRange80Color = 'green';
            break;
          case 4:
            this.properties.ndRange160Color = 'green';
            break;
          case 5:
            this.properties.ndRange320Color = 'green';
            break;
        }
        break;
    }
  }

  public toggleFd(): void {
    this.simConnect.setVariable('TOGGLE_FLIGHT_DIRECTOR', 0).subscribe();
  }

  public toggleLs(): void {
    this.simConnect.setVariable('BTN_LS_1_FILTER_ACTIVE', this.properties.lsColor === 'default' ? 1 : 0).subscribe();
  }

  public setNdFilter(value: number): void {
    this.simConnect.setVariable('A32NX_EFIS_L_OPTION', value).subscribe();
  }

  public setNdMode(value: number): void {
    this.simConnect.setVariable('A32NX_EFIS_L_ND_MODE', value).subscribe();
  }

  public setNdRange(value: number): void {
    this.simConnect.setVariable('A32NX_EFIS_L_ND_RANGE', value).subscribe();
  }

  public increaseQnh(): void {
    this.simConnect.setVariable('KOHLSMAN_SET', (this.properties.qnhValue + 1) * 16).subscribe();
  }

  public decreaseQnh(): void {
    this.simConnect.setVariable('KOHLSMAN_SET', (this.properties.qnhValue - 1) * 16).subscribe();
  }
}
