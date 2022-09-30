import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { SimvarRequest } from 'src/app/models/simvar-request';
import { SimConnectService } from 'src/app/services/simconnect.service';

export class A32NxThrustProperties {
  locked: boolean;
  value1: number;
  value2: number;

  constructor() {
    this.locked = true;
    this.value1 = 50;
    this.value2 = 50;
  }
}

@Component({
  selector: 'app-a32nx-thrust',
  templateUrl: './a32nx-thrust.component.html',
})
export class A32NxThrustComponent implements OnInit {
  properties = new A32NxThrustProperties();
  detentHit: number = 0;

  readFrom = ['DEBUG COMMAND'];
  writeTo = ['DEBUG COMMAND'];

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
    }
  }

  setValue(value: number) {
    this.properties.value1 = value;
    this.properties.value2 = value;
  }
}
