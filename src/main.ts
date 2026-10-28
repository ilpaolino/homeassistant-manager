import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideAppInitializer, inject } from '@angular/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/routes';
import { HOME_ADAPTER } from './app/core/home-adapter';
import { DemoHomeAdapter } from './app/core/demo-adapter';
import { HomeStore } from './app/core/home-store';

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes, withHashLocation()),
    { provide: HOME_ADAPTER, useClass: DemoHomeAdapter },
    provideAppInitializer(() => inject(HomeStore).load())]
}).catch(console.error);
