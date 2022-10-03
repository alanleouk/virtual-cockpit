import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { ParamaterType } from 'src/app/models/paramater-type';
import { SimConnectService } from 'src/app/services/simconnect.service';

@Component({
  selector: 'app-a32nx-flaps',
  templateUrl: './a32nx-flaps.component.html',
})
export class A32NxFlapsComponent implements OnInit {
  minValue = 0;
  maxValue = 4;
  step = 1;

  readFrom: string[] = ['A32NX_FLAPS_HANDLE_INDEX', 'DEBUG COMMAND'];
  writeTo: string[] = ['A32NX_FLAPS_HANDLE_INDEX'];

  public value: number = 0;

  constructor(private simConnect: SimConnectService) {}

  ngOnInit(): void {
    this.simConnect.subscribeTo(this.readFrom).subscribe((result) => {
      this.value = result.valueAsDecimal;
    });

    const simvars = this.simConnect.allSimvars.filter((item) => this.readFrom.includes(item.name) || this.writeTo.includes(item.name));

    this.simConnect
      .add({ simvarDefinitions: simvars })
      .pipe(
        switchMap((_) => this.simConnect.connect()),
        switchMap((_) => this.simConnect.send({ simvarKeys: this.readFrom }))
      )
      .subscribe();
  }

  public setValue(value: number): void {
    this.simConnect.setVariable('A32NX_FLAPS_HANDLE_INDEX', value).subscribe();
  }
}
