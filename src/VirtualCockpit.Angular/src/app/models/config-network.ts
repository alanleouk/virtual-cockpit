export class ConfigNetwork {
  serviceUrl: string;
  wsUrl: string;

  constructor() {
    this.serviceUrl = 'http://localhost:12345';
    this.wsUrl = 'ws://localhost:12345/ws';
  }
}
