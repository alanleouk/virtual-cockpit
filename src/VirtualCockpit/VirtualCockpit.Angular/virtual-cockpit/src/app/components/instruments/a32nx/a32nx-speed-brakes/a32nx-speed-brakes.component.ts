import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { ParamaterType } from 'src/app/models/paramater-type';
import { SimConnectService } from 'src/app/services/simconnect.service';

@Component({
  selector: 'app-a32nx-speed-brakes',
  templateUrl: './a32nx-speed-brakes.component.html',
})
export class A32NxSpeedBrakesComponent implements OnInit {
  readFrom = [
    'A32NX_SPOILERS_HANDLE_POSITION',
    'A32NX_SPOILERS_ARMED',
    'SPOILERS ARMED',
  ];
  writeTo = [];

  public value: number = 0;
  public armed: boolean = false;

  constructor(private simConnect: SimConnectService) {}

  ngOnInit(): void {
    this.simConnect.subscribeTo(this.readFrom).subscribe((result) => {
      switch (result.name) {
        case 'A32NX_SPOILERS_HANDLE_POSITION':
          this.value = result.valueAsDecimal;
          break;
        case 'A32NX_SPOILERS_ARMED':
        case 'SPOILERS ARMED':
          this.armed = result.valueAsDecimal > 0;
          break;
      }
    });

    this.simConnect
      .add([
        {
          paramaterType: ParamaterType.LVar,
          name: 'A32NX_SPOILERS_HANDLE_POSITION',
          units: 'number',
          precision: 2,
        },
        {
          paramaterType: ParamaterType.SimVar,
          name: 'SPOILERS HANDLE POSITION',
          units: 'number',
          precision: 0,
        },
        {
          paramaterType: ParamaterType.LVar,
          name: 'A32NX_SPOILERS_ARMED',
          units: 'bool',
          precision: 0,
        },
        {
          paramaterType: ParamaterType.SimVar,
          name: 'SPOILERS ARMED',
          units: 'number',
          precision: 0,
        },
        {
          paramaterType: ParamaterType.KEvent,
          name: 'SPOILERS_ARM_TOGGLE',
          units: 'number',
          precision: 0,
        },
        {
          paramaterType: ParamaterType.KEvent,
          name: 'SPOILERS_SET',
          units: 'number',
          precision: 0,
        },
      ])
      .pipe(
        switchMap((_) => this.simConnect.connect()),
        switchMap((_) => this.simConnect.send())
      )
      .subscribe();
  }

  public setValue(value: number): void {
    this.simConnect
      .setVariable('SPOILERS_SET', value * 16383 + 1)
      .subscribe((result) => console.log(result));
  }
  public setSpoilersArmed(): void {
    this.simConnect
      .setVariable('SPOILERS_ARM_TOGGLE', 0)
      .subscribe((result) => console.log(result));
  }
}
