import { ConfigCockpits } from './config-cockpits';
import { ConfigLayout } from './config-layout';
import { ConfigNetwork } from './config-network';

export class Config {
  layout: ConfigLayout;
  network: ConfigNetwork;
  cockpits: ConfigCockpits;

  constructor() {
    this.layout = new ConfigLayout();
    this.network = new ConfigNetwork();
    this.cockpits = new ConfigCockpits();
  }
}
