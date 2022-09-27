import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { ParamaterType } from 'src/app/models/paramater-type';
import { SimConnectService } from 'src/app/services/simconnect.service';

@Component({
  selector: 'app-parking-brake',
  templateUrl: './parking-brake.component.html',
})
export class ParkingBrakeComponent implements OnInit {
  readFrom = ['A32NX_PARK_BRAKE_LEVER_POS'];
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
          paramaterType: ParamaterType.LVar,
          name: 'A32NX_PARK_BRAKE_LEVER_POS',
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
    this.simConnect
      .setVariable('A32NX_PARK_BRAKE_LEVER_POS', this.value === 0 ? 1 : 0)
      .subscribe((result) => console.log(result));
  }
}
