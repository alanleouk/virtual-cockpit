import { Injectable } from '@angular/core';
import { IConig } from '../models/config.model';

@Injectable()
export class ConfigService implements IConig {
  fullWidth = false;

  constructor() {}
}
