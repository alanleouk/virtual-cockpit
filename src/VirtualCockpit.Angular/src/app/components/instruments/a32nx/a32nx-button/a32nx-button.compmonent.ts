import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { ParamaterType } from 'src/app/models/paramater-type';
import { ValueProperties } from 'src/app/models/value-properties';
import { SimConnectService } from 'src/app/services/simconnect.service';

@Component({
  selector: 'app-a32nx-button',
  templateUrl: './a32nx-button.component.html',
})
export class A32NxButtonComponent implements OnInit {
  label = 'BTN';

  readFrom = ['DEBUG COMMAND'];
  writeTo = [];

  public value: number = 0;
  valueProperties: ValueProperties[] = [
    { value: 0, color: 'default' },
    { value: 1, color: 'green' },
  ];

  constructor(private simConnect: SimConnectService) {}

  ngOnInit(): void {
    this.simConnect.subscribeTo(this.readFrom).subscribe((result) => {
      this.value = result.valueAsDecimal;
    });

    /*
    this.simConnect;
      .add([
        {
          paramaterType: ParamaterType.LVar,
          name: 'A32NX_FLAPS_HANDLE_INDEX',
          units: 'number',
          precision: 0,
        },
      ])
      .pipe(
        switchMap((_) => this.simConnect.connect()),
        switchMap((_) => this.simConnect.send())
      )
      .subscribe();
      */
  }

  public setValue(value: number): void {
    /*
    this.simConnect
      .setVariable('A32NX_FLAPS_HANDLE_INDEX', value)
      .subscribe((result) => console.log(result));
      */
  }
}
