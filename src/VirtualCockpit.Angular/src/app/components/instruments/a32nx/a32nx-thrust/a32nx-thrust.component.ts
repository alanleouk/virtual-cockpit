import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { SimvarRequest } from 'src/app/models/simvar-request';
import { SimConnectService } from 'src/app/services/simconnect.service';

const MIN_VALUE = -25;
const MAX_VALUE = 100;

export class A32NxThrustProperties {
  public locked: boolean;
  public minValue = MIN_VALUE;
  public maxValue = MAX_VALUE;
  public value1: number;
  public loadedValue1: boolean;
  public value2: number;
  public loadedValue2: boolean;
  public throttleAdjustTime: number;

  constructor() {
    this.locked = true;
    this.value1 = 0;
    this.loadedValue1 = false;
    this.value2 = 0;
    this.loadedValue2 = false;
    this.throttleAdjustTime = new Date().getTime();
  }
}

/*
  Detents
  TO/GA 0.97 to 1.00
  FLX 0.80 to 0.90
  CLB 0.65 to 0.75
  IDLE 0.00 to -0.10
  REV IDLE -0.11 to -0.01
  REV FULL -1.00 to -0.94
*/

@Component({
  selector: 'app-a32nx-thrust',
  templateUrl: './a32nx-thrust.component.html',
})
export class A32NxThrustComponent implements OnInit {
  properties = new A32NxThrustProperties();

  readFrom = ['GENERAL ENG THROTTLE LEVER POSITION:1', 'GENERAL ENG THROTTLE LEVER POSITION:2'];
  writeTo = ['THROTTLE1_AXIS_SET_EX1', 'THROTTLE2_AXIS_SET_EX1'];

  private rangeValue1ChangedSubject = new BehaviorSubject<number>(0);
  private rangeValue2ChangedSubject = new BehaviorSubject<number>(0);

  constructor(private simConnect: SimConnectService) {}

  ngOnInit(): void {
    this.rangeValue1ChangedSubject.pipe(distinctUntilChanged(), debounceTime(100)).subscribe((rangeValue) => {
      if (!this.properties.loadedValue1) {
        return;
      }

      if (rangeValue < 0) {
        rangeValue = rangeValue * 4;
      }

      this.setValue1(rangeValue);
      if (this.properties.locked) {
        this.setValue2(rangeValue);
      }
    });
    this.rangeValue2ChangedSubject.pipe(distinctUntilChanged(), debounceTime(100)).subscribe((rangeValue) => {
      if (!this.properties.loadedValue2) {
        return;
      }

      if (rangeValue < 0) {
        rangeValue = rangeValue * 4;
      }

      this.setValue2(rangeValue);
      if (this.properties.locked) {
        this.setValue1(rangeValue);
      }
    });

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
    const time = new Date().getTime();
    const timeOffset = time - this.properties.throttleAdjustTime;
    if (timeOffset < 3000) {
      return;
    }

    switch (request.name) {
      case 'GENERAL ENG THROTTLE LEVER POSITION:1':
        this.properties.loadedValue1 = true;
        this.properties.value1 = Math.round(request.valueAsDecimal);
        break;
      case 'GENERAL ENG THROTTLE LEVER POSITION:2':
        this.properties.loadedValue2 = true;
        this.properties.value2 = Math.round(request.valueAsDecimal);
        break;
    }
  }

  public updateValue(value: number) {
    this.properties.throttleAdjustTime = new Date().getTime();
    this.properties.value1 = value;
    this.properties.value2 = value;

    this.rangeValue1ChangedSubject.next(value);
    this.rangeValue2ChangedSubject.next(value);
  }

  public rangeValue1Changed(rangeValue: number) {
    if (!this.properties.loadedValue1) {
      return;
    }
    this.properties.throttleAdjustTime = new Date().getTime();
    this.rangeValue1ChangedSubject.next(rangeValue);
  }

  public rangeValue2Changed(rangeValue: number) {
    if (!this.properties.loadedValue2) {
      return;
    }
    this.properties.throttleAdjustTime = new Date().getTime();
    this.rangeValue2ChangedSubject.next(rangeValue);
  }

  public setValue1(value: number): void {
    this.simConnect.setVariable('THROTTLE1_AXIS_SET_EX1', this.parseValue((value * 16383) / 100)).subscribe();
  }
  public setValue2(value: number): void {
    this.simConnect.setVariable('THROTTLE2_AXIS_SET_EX1', this.parseValue((value * 16383) / 100)).subscribe();
  }

  private parseValue(value: number): number {
    if (value < -16355) {
      return -16355;
    }
    if (value > 16383) {
      return 16383;
    }
    return value;
  }
}
