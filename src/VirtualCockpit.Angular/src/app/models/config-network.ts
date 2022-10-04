export class ConfigNetwork {
  serviceUrl: string;
  wsUrl: string;

  constructor() {
    this.serviceUrl = 'https://vcockpit-local.osz.one:4445';
    this.wsUrl = 'wss://vcockpit-local.osz.one:4445/ws';
  }
}
