import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { ParamaterType } from 'src/app/models/paramater-type';
import { SimConnectService } from 'src/app/services/simconnect.service';

@Component({
  selector: 'app-landing-gear',
  templateUrl: './landing-gear.component.html',
})
export class LandingGearComponent implements OnInit {
  readFrom: string[] = ['GEAR HANDLE POSITION'];
  writeTo: string[] = [];

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

  public toggleValue(): void {
    this.simConnect.setVariable('GEAR HANDLE POSITION', this.value === 0 ? 1 : 0).subscribe();
  }
}
