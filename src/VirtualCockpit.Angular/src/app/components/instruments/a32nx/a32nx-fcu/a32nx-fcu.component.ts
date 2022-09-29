import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { SimvarRequest } from 'src/app/models/simvar-request';
import { SimConnectService } from 'src/app/services/simconnect.service';

export class A32NxFcuProperties {
  ap1Color: string;
  ap2Color: string;
  athrColor: string;

  constructor() {
    this.ap1Color = 'default';
    this.ap2Color = 'default';
    this.athrColor = 'default';
  }
}

@Component({
  selector: 'app-a32nx-fcu',
  templateUrl: './a32nx-fcu.component.html',
})
export class A32NxFcuComponent implements OnInit {
  properties = new A32NxFcuProperties();

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
