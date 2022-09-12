import { Component } from '@angular/core';
import { webSocket } from "rxjs/webSocket";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'virtual-cockpit';
  subject = webSocket<any>('ws://localhost:12345/ws');

  constructor(){
    this.subject.subscribe(
      msg => console.log(msg), 
      err => console.log(err), 
      () => console.log('complete') 
    );
  }
}
