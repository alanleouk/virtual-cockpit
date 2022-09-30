import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ParamaterType } from 'src/app/models/paramater-type';
import { SimConnectService } from 'src/app/services/simconnect.service';

const MAX_VALUE = 16384;

@Component({
  selector: 'app-a32nx-speed-brakes',
  templateUrl: './a32nx-speed-brakes.component.html',
})
export class A32NxSpeedBrakesComponent implements OnInit {
  readFrom = ['A32NX_SPOILERS_HANDLE_POSITION', 'A32NX_SPOILERS_ARMED', 'SPOILERS ARMED'];
  writeTo = [];

  private rangeValueChangedSubject = new BehaviorSubject<number>(0);

  public maxValue = MAX_VALUE;
  public value: number = 0;
  public rangeValue: number = MAX_VALUE;
  public armed: boolean = false;

  constructor(private simConnect: SimConnectService) {}

  ngOnInit(): void {
    this.rangeValueChangedSubject.pipe(distinctUntilChanged(), debounceTime(200)).subscribe((rangeValue) => {
      this.value = this.maxValue - rangeValue;
      this.rangeValue = rangeValue;
      this.setValue(this.value);
    });

    this.simConnect.subscribeTo(this.readFrom).subscribe((result) => {
      switch (result.name) {
        case 'A32NX_SPOILERS_HANDLE_POSITION':
          this.value = result.valueAsDecimal * this.maxValue;
          this.rangeValue = this.maxValue - this.value;
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

  public updateValue(value: number) {
    this.rangeValueChangedSubject.next(this.maxValue - value);
  }

  public setValue(value: number): void {
    this.simConnect.setVariable('SPOILERS_SET', value).subscribe((result) => console.log(result));
  }
  public setSpoilersArmed(): void {
    this.simConnect.setVariable('SPOILERS_ARM_TOGGLE', 0).subscribe((result) => console.log(result));
  }

  public rangeValueChanged(rangeValue: number) {
    this.rangeValueChangedSubject.next(rangeValue);
  }
}
