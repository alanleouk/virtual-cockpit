import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { A32NxCockpitComponent } from './components/cockpits/a32nx-cockpit/a32nx-cockpit.component';
import { Cessna172CockpitComponent } from './components/cockpits/cessna-172-cockpit/cessna-172-cockpit.component';
import { DeveloperCockpitComponent } from './components/developer/developer-cockpit/developer-cockpit.component';
import { SimvarsComponent } from './components/developer/simvars.component';
import { HomeComponent } from './components/home.component';
import { A32NxAutobrakeGearComponent } from './components/instruments/a32nx/a32nx-autobrake-gear/a32nx-autobrake-gear.component';
import { A32NxButtonComponent } from './components/instruments/a32nx/a32nx-button/a32nx-button.compmonent';
import { A32NxEfisComponent } from './components/instruments/a32nx/a32nx-efis/a32nx-efis.component';
import { A32NxFcuComponent } from './components/instruments/a32nx/a32nx-fcu/a32nx-fcu.component';
import { A32NxFlapsComponent } from './components/instruments/a32nx/a32nx-flaps/a32nx-flaps.component';
import { A32NxMcduComponent } from './components/instruments/a32nx/a32nx-mcdu/a32nx-mcdu.component';
import { A32NxParkingBrakeComponent } from './components/instruments/a32nx/a32nx-parking-brake/a32nx-parking-brake.component';
import { A32NxRudderTrimComponent } from './components/instruments/a32nx/a32nx-rudder-trim/a32nx-rudder-trim.component';
import { A32NxSpeedBrakesComponent } from './components/instruments/a32nx/a32nx-speed-brakes/a32nx-speed-brakes.component';
import { A32NxThrustComponent } from './components/instruments/a32nx/a32nx-thrust/a32nx-thrust.component';
import { A32NxTrimComponent } from './components/instruments/a32nx/a32nx-trim/a32nx-trim.component';
import { AirspeedIndicatorComponent } from './components/instruments/shared/airspeed-indicator/airspeed-indicator.component';
import { LandingGearComponent } from './components/instruments/shared/landing-gear/landing-gear.component';
import { ParkingBrakeComponent } from './components/instruments/shared/parking-brake/parking-brake.component';
import { ConfigService } from './services/config.service';
import { SimConnectService } from './services/simconnect.service';
import { SvgService } from './services/svg.service';

@NgModule({
  declarations: [
    AppComponent,
    A32NxAutobrakeGearComponent,
    A32NxButtonComponent,
    A32NxCockpitComponent,
    A32NxEfisComponent,
    A32NxFcuComponent,
    A32NxFlapsComponent,
    A32NxMcduComponent,
    A32NxParkingBrakeComponent,
    A32NxRudderTrimComponent,
    A32NxSpeedBrakesComponent,
    A32NxThrustComponent,
    A32NxTrimComponent,
    Cessna172CockpitComponent,
    AirspeedIndicatorComponent,
    DeveloperCockpitComponent,
    HomeComponent,
    LandingGearComponent,
    ParkingBrakeComponent,
    SimvarsComponent,
  ],
  imports: [
    RouterModule.forRoot([
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
      },
      {
        path: 'home',
        pathMatch: 'full',
        component: HomeComponent,
      },
      {
        path: 'components/instruments/a32nx/a32nx-flaps',
        pathMatch: 'full',
        component: A32NxFlapsComponent,
      },
      {
        path: 'cockpits/developer',
        pathMatch: 'full',
        component: DeveloperCockpitComponent,
      },
      {
        path: 'cockpits/a32nx',
        pathMatch: 'full',
        component: A32NxCockpitComponent,
      },
      {
        path: 'cockpits/cessna-172',
        pathMatch: 'full',
        component: Cessna172CockpitComponent,
      },
      {
        path: 'instruments/a32nx/efis',
        pathMatch: 'full',
        component: A32NxEfisComponent,
      },
      {
        path: 'instruments/a32nx/fcu',
        pathMatch: 'full',
        component: A32NxFcuComponent,
      },
      {
        path: 'instruments/a32nx/mcdu',
        pathMatch: 'full',
        component: A32NxMcduComponent,
      },
      {
        path: 'instruments/a32nx/thrust',
        pathMatch: 'full',
        component: A32NxThrustComponent,
      },
      {
        path: 'developer/simvars',
        pathMatch: 'full',
        component: SimvarsComponent,
      },
    ]),
    BrowserModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [ConfigService, SimConnectService, SvgService],
  bootstrap: [AppComponent],
})
export class AppModule {}
