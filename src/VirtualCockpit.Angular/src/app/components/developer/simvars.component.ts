import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { ParamaterType } from 'src/app/models/paramater-type';
import { Simvar } from 'src/app/models/simvar';
import { SimvarRequest } from 'src/app/models/simvar-request';
import { SimConnectService } from 'src/app/services/simconnect.service';

@Component({
  selector: 'app-simvars',
  templateUrl: './simvars.component.html',
})
export class SimvarsComponent implements OnInit {
  constructor(private simConnect: SimConnectService) {}

  simvars: Simvar[] = [];
  public ParamaterType = ParamaterType;

  ngOnInit(): void {
    this.simvars = this.simConnect.allSimvars.sort((a, b) => {
      const categoryCompare = a.category.localeCompare(b.category);
      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      return a.name.localeCompare(b.name);
    });

    this.simConnect.subscribeToAll().subscribe((request) => {
      let item = this.simvars.find((item) => item.name == request.name);
      if (item) {
        item.valueAsDecimal = request.valueAsDecimal;
        item.valueAsString = request.valueAsString;
      } else {
        this.simvars.push({
          category: 'N/A',
          name: request.name,
          valueAsString: request.valueAsString,
          valueAsDecimal: request.valueAsDecimal,
        });
      }
    });

    this.simConnect
      .addAll()
      .pipe(
        switchMap((_) => this.simConnect.connect()),
        switchMap((_) => this.simConnect.send())
      )
      .subscribe();
  }

  send(simvar: Simvar): void {
    const valueToSend = parseFloat(simvar.valueToSend || '');
    this.simConnect.setVariable(simvar.name, valueToSend).subscribe();
  }
}
