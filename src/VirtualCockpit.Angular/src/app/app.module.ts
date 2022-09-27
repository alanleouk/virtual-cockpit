import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { DeveloperCockpitComponent } from './components/developer/developer-cockpit/developer-cockpit.component';
import { SimvarsComponent } from './components/developer/simvars.component';
import { A32NxButtonComponent } from './components/instruments/a32nx/a32nx-button/a32nx-button.compmonent';
import { A32NxFlapsComponent } from './components/instruments/a32nx/a32nx-flaps/a32nx-flaps.component';
import { A32NxSpeedBrakesComponent } from './components/instruments/a32nx/a32nx-speed-brakes/a32nx-speed-brakes.component';
import { AirspeedIndicatorComponent } from './components/instruments/shared/airspeed-indicator/airspeed-indicator.component';
import { LandingGearComponent } from './components/instruments/shared/landing-gear/landing-gear.component';
import { ParkingBrakeComponent } from './components/instruments/shared/parking-brake/parking-brake.component';
import { SimConnectService } from './services/simconnect.service';
import { SvgService } from './services/svg.service';

@NgModule({
  declarations: [
    AppComponent,
    A32NxButtonComponent,
    A32NxFlapsComponent,
    A32NxSpeedBrakesComponent,
    AirspeedIndicatorComponent,
    DeveloperCockpitComponent,
    LandingGearComponent,
    ParkingBrakeComponent,
    SimvarsComponent,
  ],
  imports: [
    RouterModule.forRoot([
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'developer/simvars',
      },
      {
        path: 'components/instruments/a32nx/a32nx-flaps',
        pathMatch: 'full',
        component: A32NxFlapsComponent,
      },
      {
        path: 'developer/simvars',
        pathMatch: 'full',
        component: SimvarsComponent,
      },
      {
        path: 'developer/cockpit',
        pathMatch: 'full',
        component: DeveloperCockpitComponent,
      },
    ]),
    BrowserModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [SimConnectService, SvgService],
  bootstrap: [AppComponent],
})
export class AppModule {}
