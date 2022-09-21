import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { filter, Observable, Subject } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { AddRequest } from '../models/add-request';
import { ParamaterType } from '../models/paramater-type';
import { Simvar } from '../models/simvar';
import { SimvarRequest } from '../models/simvar-request';

@Injectable()
export class SimConnectService {
  socket = webSocket<SimvarRequest>('ws://localhost:12345/ws');
  subject = new Subject<SimvarRequest>();

  public allSimvars: Simvar[] = [
    {
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_FLAPS_HANDLE_INDEX',
      description: 'A32NX flaps handle position, 0...4',
      units: 'number',
      precision: 0,
    },
    {
      paramaterType: ParamaterType.SimVar,
      name: 'FLAPS HANDLE INDEX',
      description: 'Current flaps position, 1..5', // Value TBC
      units: 'number',
      precision: 0,
    },
    {
      paramaterType: ParamaterType.SimVar,
      name: 'GEAR HANDLE POSITION',
      description: 'Current gear handle position',
      units: 'number',
      precision: 0,
    },
    {
      paramaterType: ParamaterType.LVar,
      name: 'A32NX_AUTOBRAKES_ARMED_MODE',
      description: 'A32NX auto brakes armed mode, 0=DIS, 1=LO, 2=MED, 3=MAX',
      units: 'number',
      precision: 0,
    },
  ];

  constructor(private http: HttpClient) {
    this.socket.subscribe(
      (msg) => this.subject.next(msg),
      (err) => console.log(err),
      () => console.log('complete')
    );
  }

  subscribeTo(simvars: string[]): Observable<SimvarRequest> {
    return this.subject.pipe(filter((item) => simvars.includes(item.name)));
  }

  subscribeToAll(): Observable<SimvarRequest> {
    return this.subject;
  }

  setVariable(name: string, value: number): Observable<any> {
    return this.http.put('http://localhost:12345/simvar', { name, value });
  }

  connect(): Observable<any> {
    return this.http.post('http://localhost:12345/connect', {});
  }

  disconnect(): Observable<any> {
    return this.http.post('http://localhost:12345/disconnect', {});
  }

  reset(): Observable<any> {
    return this.http.post('http://localhost:12345/reset', {});
  }

  add(requests: AddRequest[]): Observable<any> {
    return this.http.post('http://localhost:12345/add', requests);
  }

  addAll(): Observable<any> {
    return this.http.post('http://localhost:12345/add', this.allSimvars);
  }

  send(): Observable<any> {
    return this.http.post('http://localhost:12345/send', {});
  }
}
