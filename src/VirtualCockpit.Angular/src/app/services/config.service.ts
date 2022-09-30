import { Injectable } from '@angular/core';
import { Config } from '../models/config.model';

@Injectable()
export class ConfigService {
  current: Config;

  constructor() {
    this.current = new Config();
  }
}
