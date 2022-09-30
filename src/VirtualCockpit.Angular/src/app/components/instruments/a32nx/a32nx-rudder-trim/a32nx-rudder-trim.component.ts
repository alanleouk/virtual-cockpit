import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { SimvarRequest } from 'src/app/models/simvar-request';
import { SimConnectService } from 'src/app/services/simconnect.service';

export class A32NxRudderTrimProperties {
  constructor() {}
}

@Component({
  selector: 'app-a32nx-rudder-trim',
  templateUrl: './a32nx-rudder-trim.component.html',
})
export class A32NxRudderTrimComponent implements OnInit {
  properties = new A32NxRudderTrimProperties();

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