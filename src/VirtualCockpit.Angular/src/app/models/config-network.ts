export class ConfigNetwork {
  serviceUrl: string;
  wsUrl: string;

  constructor() {
    this.serviceUrl = 'https://vcockpit-host.osz.one';
    this.wsUrl = 'wss://vcockpit-host.osz.one/ws';
  }
}
