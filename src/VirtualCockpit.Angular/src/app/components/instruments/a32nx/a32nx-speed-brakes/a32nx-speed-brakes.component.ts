import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { SimvarRequest } from 'src/app/models/simvar-request';
import { SimConnectService } from 'src/app/services/simconnect.service';

const MAX_VALUE = 16384;

export class A32NxSpeedBrakesProperties {
  public maxValue: number;
  public value: number;
  public loadedValue: boolean;
  public rangeValue: number;
  public armed: boolean;

  constructor() {
    this.maxValue = MAX_VALUE;
    this.value = 0;
    this.loadedValue = false;
    this.rangeValue = MAX_VALUE;
    this.armed = false;
  }
}

@Component({
  selector: 'app-a32nx-speed-brakes',
  templateUrl: './a32nx-speed-brakes.component.html',
})
export class A32NxSpeedBrakesComponent implements OnInit {
  properties = new A32NxSpeedBrakesProperties();

  readFrom = ['A32NX_SPOILERS_HANDLE_POSITION', 'A32NX_SPOILERS_ARMED'];
  writeTo = ['SPOILERS_SET', 'SPOILERS_ARM_TOGGLE'];

  private rangeValueChangedSubject = new BehaviorSubject<number>(0);

  constructor(private simConnect: SimConnectService) {}

  ngOnInit(): void {
    this.rangeValueChangedSubject.pipe(distinctUntilChanged(), debounceTime(100)).subscribe((rangeValue) => {
      if (!this.properties.loadedValue) {
        return;
      }
      this.setValue(this.properties.maxValue - rangeValue);
    });

    this.simConnect.subscribeTo(this.readFrom).subscribe((request) => this.parseSimvarRequest(request));

    const simVars = this.simConnect.allSimvars.filter((item) => this.readFrom.includes(item.name) || this.writeTo.includes(item.name));

    this.simConnect.add(simVars).pipe(
      switchMap((_) => this.simConnect.connect()),
      switchMap((_) => this.simConnect.send())
    );
  }

  parseSimvarRequest(request: SimvarRequest): void {
    switch (request.name) {
      case 'A32NX_SPOILERS_HANDLE_POSITION':
        this.properties.loadedValue = true;
        this.properties.value = request.valueAsDecimal * this.properties.maxValue;
        this.properties.rangeValue = this.properties.maxValue - this.properties.value;
        break;
      case 'A32NX_SPOILERS_ARMED':
        this.properties.armed = request.valueAsDecimal > 0;
        break;
    }
  }

  public updateValue(value: number) {
    if (!this.properties.loadedValue) {
      return;
    }
    this.rangeValueChangedSubject.next(this.properties.maxValue - value);
  }

  public rangeValueChanged(rangeValue: number) {
    if (!this.properties.loadedValue) {
      return;
    }
    this.rangeValueChangedSubject.next(rangeValue);
  }

  public setValue(value: number): void {
    this.simConnect.setVariable('SPOILERS_SET', value).subscribe();
  }
  public setSpoilersArmed(): void {
    this.simConnect.setVariable('SPOILERS_ARM_TOGGLE', 0).subscribe();
  }
}
