import { Injectable } from '@angular/core';
import { IConig } from '../models/config.model';

@Injectable()
export class ConfigService implements IConig {
  fullWidth = false;
  socksHostAndPort = 'localhost:12345';
  a32nxMcduUrl = 'http://localhost:8380/interfaces/mcdu/';

  constructor() {}
}
