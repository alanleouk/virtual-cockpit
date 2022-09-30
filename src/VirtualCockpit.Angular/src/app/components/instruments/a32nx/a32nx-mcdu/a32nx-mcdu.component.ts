import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { switchMap } from 'rxjs';
import { SimvarRequest } from 'src/app/models/simvar-request';
import { ConfigService } from 'src/app/services/config.service';
import { SimConnectService } from 'src/app/services/simconnect.service';

@Component({
  selector: 'app-a32nx-mcdu',
  templateUrl: './a32nx-mcdu.component.html',
})
export class A32NxMcduComponent implements OnInit {
  @ViewChild('frame', { static: true })
  public frameElement!: ElementRef<HTMLIFrameElement>;

  constructor(public config: ConfigService) {}

  ngOnInit(): void {
    if (this.frameElement) {
      this.frameElement.nativeElement.src = this.config.current.cockpits.a3nx.mcduUrl;
    }
  }
}
