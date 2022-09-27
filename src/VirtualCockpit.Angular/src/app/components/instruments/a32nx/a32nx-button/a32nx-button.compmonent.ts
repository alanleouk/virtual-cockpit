import { Component, Input, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { SimvarRequest } from 'src/app/models/simvar-request';
import { ValueProperties } from 'src/app/models/value-properties';
import { SimConnectService } from 'src/app/services/simconnect.service';

const defaultProperty: ValueProperties = { value: 0, feebackColor: 'default' };

@Component({
  selector: 'app-a32nx-button',
  templateUrl: './a32nx-button.component.html',
})
export class A32NxButtonComponent implements OnInit {
  @Input()
  label = 'BTN';

  @Input()
  readFrom = ['DEBUG COMMAND'];

  @Input()
  writeTo = ['DEBUG COMMAND'];

  public properties: ValueProperties = defaultProperty;
  public value: number = 0;
  valueProperties: ValueProperties[] = [
    defaultProperty,
    { value: 1, feebackColor: 'green' },
  ];

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

    this.parseProperties();
  }

  parseSimvarRequest(request: SimvarRequest): void {
    this.value = request.valueAsDecimal;
    this.parseProperties();
  }

  parseProperties() {
    this.properties =
      this.valueProperties.find((item) => item.value === this.value) ??
      defaultProperty;
  }

  public setValue(value: number): void {
    this.writeTo.forEach((element) => {
      console.log('setValue');
      this.simConnect.setVariable(element, value).subscribe();
    });
  }
}
