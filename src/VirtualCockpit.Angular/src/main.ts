import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { ConfigRuntime } from './app/models/config-runtime';

fetch(`/config-runtime.json?v=${new Date().getTime()}`)
  .then((response) => response.json())
  .then((config: ConfigRuntime) => {
    if (config.production) {
      enableProdMode();
    }

    platformBrowserDynamic([{ provide: ConfigRuntime, useValue: config }])
      .bootstrapModule(AppModule)
      .catch((err) => console.log(err));
  })
  .catch(() => {
    const roots = document.getElementsByTagName('app-root');
    if (roots && roots.length) {
      var root = roots[0];
      let element = document.createElement('p');
      element.className = 'container text-center';
      element.innerHTML = 'Unknown network error: Please refresh your browser to reload!';
      root.appendChild(element);
    }
  });
