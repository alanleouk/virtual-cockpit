import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { DebugCockpitComponent } from './components/debug/debug-cockpit/debug-cockpit.component';
import { SimvarsComponent } from './components/debug/simvars.component';
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
    A32NxFlapsComponent,
    A32NxSpeedBrakesComponent,
    AirspeedIndicatorComponent,
    DebugCockpitComponent,
    LandingGearComponent,
    ParkingBrakeComponent,
    SimvarsComponent,
  ],
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
      {
        path: 'debug/cockpit',
        pathMatch: 'full',
        component: DebugCockpitComponent,
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