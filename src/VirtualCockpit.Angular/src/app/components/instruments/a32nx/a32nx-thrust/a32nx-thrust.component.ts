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
  public value1Loaded: boolean;
  public value2: number;
  public value2Loaded: boolean;

  constructor() {
    this.locked = true;
    this.value1 = 0;
    this.value1Loaded = false;
    this.value2 = 0;
    this.value2Loaded = false;
  }
}

/*
  Detents
  TO/GA 0.95 to 1.00
  FLX 0.85 to 0.95
  CLB 0.75 to 0.85
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

  readFrom: string[] = ['GENERAL ENG THROTTLE LEVER POSITION:1', 'GENERAL ENG THROTTLE LEVER POSITION:2'];
  writeTo: string[] = ['THROTTLE1_AXIS_SET_EX1', 'THROTTLE2_AXIS_SET_EX1'];

  private rangeValue1ChangedSubject = new BehaviorSubject<number>(0);
  private rangeValue2ChangedSubject = new BehaviorSubject<number>(0);

  constructor(private simConnect: SimConnectService) {}

  ngOnInit(): void {
    this.rangeValue1ChangedSubject.pipe(distinctUntilChanged(), debounceTime(100)).subscribe((rangeValue) => {
      if (!this.properties.value1Loaded) {
        return;
      }

      this.setValue1(rangeValue);
      if (this.properties.locked) {
        this.setValue2(rangeValue);
      }
    });
    this.rangeValue2ChangedSubject.pipe(distinctUntilChanged(), debounceTime(100)).subscribe((rangeValue) => {
      if (!this.properties.value2Loaded) {
        return;
      }

      this.setValue2(rangeValue);
      if (this.properties.locked) {
        this.setValue1(rangeValue);
      }
    });

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
      case 'GENERAL ENG THROTTLE LEVER POSITION:1':
        if (!this.properties.value1Loaded) {
          console.log(request.valueAsDecimal);
          this.properties.value1 = Math.round(request.valueAsDecimal);
        }
        this.properties.value1Loaded = true;
        break;
      case 'GENERAL ENG THROTTLE LEVER POSITION:2':
        if (!this.properties.value2Loaded) {
          this.properties.value2 = Math.round(request.valueAsDecimal);
        }
        this.properties.value2Loaded = true;
        break;
    }
  }

  public updateValue(value: number) {
    this.properties.value1 = value;
    this.properties.value2 = value;

    this.setValue1(value);
    this.setValue2(value);
  }

  public rangeValue1Changed(rangeValue: number) {
    this.rangeValue1ChangedSubject.next(rangeValue);
  }

  public rangeValue2Changed(rangeValue: number) {
    this.rangeValue2ChangedSubject.next(rangeValue);
  }

  public setValue1(value: number): void {
    this.simConnect.setVariable('THROTTLE1_AXIS_SET_EX1', this.parseValue((value * 16383) / 100)).subscribe();
  }
  public setValue2(value: number): void {
    this.simConnect.setVariable('THROTTLE2_AXIS_SET_EX1', this.parseValue((value * 16383) / 100)).subscribe();
  }

  private parseValue(rangeValue: number): number {
    if (rangeValue < 0) {
      rangeValue = rangeValue * 4;
    }
    if (rangeValue < -16355) {
      return -16355;
    }
    if (rangeValue > 16383) {
      return 16383;
    }
    return rangeValue;
  }
}
