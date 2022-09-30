import { Component, OnInit } from '@angular/core';
import { ConfigService } from '../services/config.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  constructor(private config: ConfigService) {}

  ngOnInit(): void {
    this.config.current.layout.fullWidth = false;
  }
}
