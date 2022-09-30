import { ConfigCockpitA3Nx } from './config-cockpit-a3nx';

export class ConfigCockpits {
  a3nx: ConfigCockpitA3Nx;

  constructor() {
    this.a3nx = new ConfigCockpitA3Nx();
  }
}
