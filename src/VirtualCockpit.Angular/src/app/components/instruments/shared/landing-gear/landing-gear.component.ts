import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { ParamaterType } from 'src/app/models/paramater-type';
import { SimConnectService } from 'src/app/services/simconnect.service';

@Component({
  selector: 'app-landing-gear',
  templateUrl: './landing-gear.component.html',
})
export class LandingGearComponent implements OnInit {
  readFrom = ['GEAR HANDLE POSITION'];
  writeTo = [];

  public value: number = 0;

  constructor(private simConnect: SimConnectService) {}

  ngOnInit(): void {
    this.simConnect.subscribeTo(this.readFrom).subscribe((result) => {
      this.value = result.valueAsDecimal;
    });

    this.simConnect
      .add([
        {
          paramaterType: ParamaterType.SimVar,
          name: 'GEAR HANDLE POSITION',
          units: 'number',
          precision: 0,
        },
      ])
      .pipe(
        switchMap((_) => this.simConnect.connect()),
        switchMap((_) => this.simConnect.send())
      )
      .subscribe();
  }

  public toggleValue(): void {
    this.simConnect.setVariable('GEAR HANDLE POSITION', this.value === 0 ? 1 : 0).subscribe();
  }
}
