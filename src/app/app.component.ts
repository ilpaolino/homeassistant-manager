import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { HomeStore } from './core/home-store';
import { ThemeToggleComponent } from './shared/theme-toggle.component';
import { IconComponent } from './shared/icon.component';
@Component({selector:'ham-root',imports:[RouterLink,RouterLinkActive,RouterOutlet,IconComponent,ThemeToggleComponent],template:`
  <div class="app-shell" [class.setup-mode]="isSetup()">
    <aside class="sidebar">
      <a class="brand" routerLink="/casa" aria-label="Home Assistant Manager, panoramica"><span class="brand-mark"><ham-icon name="house"/></span><span>home assistant<small>MANAGER</small></span></a>
      <div class="workspace"><span class="workspace-icon"><ham-icon name="house"/></span><div>{{store.home().name}}<small>{{store.configuration()?'Casa configurata · locale':'Casa di esempio'}}</small></div><span class="demo-dot"></span></div>
      <div class="nav-label">IL TUO SPAZIO</div>
      <nav aria-label="Navigazione principale">
        <a routerLink="/casa" routerLinkActive="selected"><ham-icon name="grid"/>Panoramica casa</a>
        <a routerLink="/connessione" routerLinkActive="selected"><ham-icon name="settings"/>Configura la casa<span class="nav-dot"></span></a>
      </nav>
      <div class="nav-label room-label">STANZE <span>{{store.home().rooms.length}}</span></div>
      <nav class="room-nav" aria-label="Stanze">
        @for(room of store.home().rooms;track room.id){<a [routerLink]="['/stanze',room.id]" routerLinkActive="selected"><ham-icon [name]="room.icon"/>{{room.name}}</a>}
      </nav>
      <div class="sidebar-bottom"><div class="demo-box"><span class="demo-dot"></span> Comandi demo<small>{{store.configuration()?'Configurazione salvata sul dispositivo.':'Esplora e configura la tua casa.'}}</small></div><div class="profile"><span class="avatar">{{store.home().name.charAt(0).toUpperCase()}}</span><div>Il tuo spazio<small>Tutto parte da casa.</small></div><span class="version">v0.1</span></div></div>
    </aside>
    <div class="main-shell"><header class="topbar"><span>Home Assistant Manager <span class="slash">/</span> Il tuo spazio</span><span class="topbar-right"><ham-theme-toggle/><span class="pill"><span class="demo-dot"></span>Demo locale</span><span class="avatar small">{{store.home().name.charAt(0).toUpperCase()}}</span></span></header><main>@if(store.storageWarning()){<div class="storage-alert" role="alert">{{store.storageWarning()}}</div>}<router-outlet/></main><footer><span>Progettato per farti sentire a casa</span><span><ham-icon name="shield"/> {{store.configuration()?'Casa salvata sul dispositivo · comandi simulati':'Casa di esempio · nessun server collegato'}}</span></footer></div>
    @if(store.notice()){<div class="toast" role="status"><ham-icon name="check"/>{{store.notice()}}</div>}
  </div>
`})
export class AppComponent {
  readonly store=inject(HomeStore);
  private readonly router=inject(Router);
  private readonly url=toSignal(this.router.events.pipe(filter((event):event is NavigationEnd=>event instanceof NavigationEnd),map(event=>event.urlAfterRedirects),startWith(this.router.url)));
  readonly isSetup=computed(()=>this.url()?.startsWith('/connessione'));
}
