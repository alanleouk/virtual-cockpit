import { Component } from '@angular/core';
import { ConfigService } from './services/config.service';
import { SimConnectService } from './services/simconnect.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'virtual-cockpit';

  constructor(public config: ConfigService, private simConnect: SimConnectService) {}

  public toggleFullWidth(): void {
    this.config.current.layout.fullWidth = !this.config.current.layout.fullWidth;
  }

  public refresh(): void {
    this.simConnect.send({ simvarKeys: this.simConnect.allSimvars.map((item) => item.name) }).subscribe();
  }
}
