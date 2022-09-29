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

  readFrom = ['DEBUG COMMAND'];
  writeTo = ['DEBUG COMMAND'];

  public value: number = 0;

  constructor(private simConnect: SimConnectService) {}

  ngOnInit(): void {
    this.simConnect
      .subscribeTo(this.readFrom)
      .subscribe((request) => this.parseSimvarRequest(request));

    const simVars = this.simConnect.allSimvars.filter(
      (item) =>
        this.readFrom.includes(item.name) || this.writeTo.includes(item.name)
    );

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
}
