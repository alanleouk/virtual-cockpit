import { Component } from '@angular/core';
import { ConfigService } from './services/config.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'virtual-cockpit';

  constructor(public config: ConfigService) {}

  public toggleFullWidth(): void {
    this.config.current.layout.fullWidth = !this.config.current.layout.fullWidth;
  }
}
