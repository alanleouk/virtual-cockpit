import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { SimvarsComponent } from './components/debug/simvars.component';
import { A32NxFlapsComponent } from './components/instruments/a32nx/a32nx-flaps/a32nx-flaps.component';
import { SimConnectService } from './services/simconnect.service';

@NgModule({
  declarations: [AppComponent, A32NxFlapsComponent, SimvarsComponent],
  imports: [
    RouterModule.forRoot([
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'debug/simvars',
      },
      {
        path: 'components/instruments/a32nx/a32nx-flaps',
        pathMatch: 'full',
        component: A32NxFlapsComponent,
      },
      {
        path: 'debug/simvars',
        pathMatch: 'full',
        component: SimvarsComponent,
      },
    ]),
    BrowserModule,
    HttpClientModule,
  ],
  providers: [SimConnectService],
  bootstrap: [AppComponent],
})
export class AppModule {}
