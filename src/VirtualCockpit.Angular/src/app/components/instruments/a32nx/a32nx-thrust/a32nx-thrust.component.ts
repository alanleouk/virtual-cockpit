import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { SimvarRequest } from 'src/app/models/simvar-request';
import { SimConnectService } from 'src/app/services/simconnect.service';

const MIN_VALUE = 25;
const MAX_VALUE = 100;

export class A32NxThrustProperties {
  public locked: boolean;
  public minValue = MIN_VALUE;
  public maxValue = MAX_VALUE;
  public value1: number;
  public value2: number;

  constructor() {
    this.locked = true;
    this.value1 = 0;
    this.value2 = 0;
  }
}

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
    this.rangeValue1ChangedSubject.pipe(distinctUntilChanged(), debounceTime(200)).subscribe((value) => {
      // this.properties.value1 = value;
      this.setValue1(value);
      if (this.properties.locked) {
        // this.properties.value2 = value;
        this.setValue2(value);
      }
    });
    this.rangeValue2ChangedSubject.pipe(distinctUntilChanged(), debounceTime(200)).subscribe((value) => {
      // this.properties.value2 = value;
      this.setValue2(value);
      if (this.properties.locked) {
        // this.properties.value1 = value;
        this.setValue1(value);
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
    switch (request.name) {
      case 'GENERAL ENG THROTTLE LEVER POSITION:1':
        this.properties.value1 = request.valueAsDecimal;
        break;
      case 'GENERAL ENG THROTTLE LEVER POSITION:2':
        this.properties.value2 = request.valueAsDecimal;
        break;
    }
  }

  public updateValue(value: number) {
    this.rangeValue1ChangedSubject.next(value);
    this.rangeValue2ChangedSubject.next(value);
  }

  public setValue1(value: number): void {
    this.simConnect.setVariable('THROTTLE1_AXIS_SET_EX1', value).subscribe();
  }
  public setValue2(value: number): void {
    this.simConnect.setVariable('THROTTLE1_AXIS_SET_EX2', value).subscribe();
  }
}
