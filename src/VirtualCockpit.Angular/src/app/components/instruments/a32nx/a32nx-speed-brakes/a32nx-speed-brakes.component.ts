import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { SimvarRequest } from 'src/app/models/simvar-request';
import { SimConnectService } from 'src/app/services/simconnect.service';

const MAX_VALUE = 16384;

export class A32NxSpeedBrakesProperties {
  public maxValue: number;
  public value: number;
  public valueLoaded: boolean;
  public rangeValue: number;
  public armed: boolean;

  constructor() {
    this.maxValue = MAX_VALUE;
    this.value = 0;
    this.valueLoaded = false;
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

  readFrom: string[] = ['A32NX_SPOILERS_HANDLE_POSITION', 'A32NX_SPOILERS_ARMED'];
  writeTo: string[] = ['SPOILERS_SET', 'SPOILERS_ARM_TOGGLE'];

  private rangeValueChangedSubject = new BehaviorSubject<number>(0);

  constructor(private simConnect: SimConnectService) {}

  ngOnInit(): void {
    this.rangeValueChangedSubject.pipe(distinctUntilChanged(), debounceTime(100)).subscribe((rangeValue) => {
      if (!this.properties.valueLoaded) {
        return;
      }
      this.setValue(this.properties.maxValue - rangeValue);
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
      case 'A32NX_SPOILERS_HANDLE_POSITION':
        this.properties.value = request.valueAsDecimal * this.properties.maxValue;
        this.properties.rangeValue = this.properties.maxValue - this.properties.value;
        this.properties.valueLoaded = true;
        break;
      case 'A32NX_SPOILERS_ARMED':
        this.properties.armed = request.valueAsDecimal > 0;
        break;
    }
  }

  public updateValue(value: number) {
    const rangeValue = this.properties.maxValue - value;
    this.rangeValueChanged(rangeValue);
  }

  public rangeValueChanged(rangeValue: number) {
    if (!this.properties.valueLoaded) {
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
