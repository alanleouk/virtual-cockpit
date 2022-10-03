import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { SimvarRequest } from 'src/app/models/simvar-request';
import { SimConnectService } from 'src/app/services/simconnect.service';

export class A32NxTrimProperties {
  constructor() {}
}

@Component({
  selector: 'app-a32nx-trim',
  templateUrl: './a32nx-trim.component.html',
})
export class A32NxTrimComponent implements OnInit {
  properties = new A32NxTrimProperties();

  readFrom: string[] = ['DEBUG COMMAND'];
  writeTo: string[] = ['DEBUG COMMAND'];

  public value: number = 0;

  constructor(private simConnect: SimConnectService) {}

  ngOnInit(): void {
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
    }
  }
}
