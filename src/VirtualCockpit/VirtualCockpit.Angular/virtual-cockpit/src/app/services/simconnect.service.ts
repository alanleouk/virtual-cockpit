import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { filter, Observable, Subject } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { AddRequest } from '../models/add-request';
import { ParamaterType } from '../models/paramater-type';
import { SimvarRequest } from '../models/simvar-request';

@Injectable()
export class SimConnectService {
  socket = webSocket<SimvarRequest>('ws://localhost:12345/ws');
  subject = new Subject<SimvarRequest>();

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

  send(): Observable<any> {
    return this.http.post('http://localhost:12345/send', {});
  }
}
