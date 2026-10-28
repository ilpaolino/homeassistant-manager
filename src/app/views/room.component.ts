import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HomeStore } from '../core/home-store';
import { Category, DeviceGroup } from '../core/models';
import { UiPreferences } from '../core/ui-preferences';
import { DeviceViewToggleComponent } from '../shared/device-view-toggle.component';
import { RoomActionsComponent } from '../shared/room-actions.component';
import { IconComponent } from '../shared/icon.component';
@Component({selector:'ham-room',imports:[RouterLink,IconComponent,DeviceViewToggleComponent,RoomActionsComponent],template:`
  @if(room();as r){
  <a class="breadcrumb" routerLink="/casa"><ham-icon name="back"/>Panoramica casa <span>/</span> {{floorName()}} <span>/</span> {{r.name}}</a>
  <div class="page-heading room-page-heading"><div class="room-title"><span class="room-icon large"><ham-icon [name]="r.icon"/></span><div><div class="eyebrow">{{floorName()}}</div><h1>{{r.name}}<span class="mint">.</span></h1><p>{{r.description}}</p></div></div><ham-room-actions [devices]="devices()"/></div>
  <section class="room-summary"><span><ham-icon name="thermometer"/><strong>{{r.temperature===null?'—':r.temperature+' °C'}}</strong>Temperatura</span><span><ham-icon name="drop"/><strong>{{r.humidity===null?'—':r.humidity+'%'}}</strong>Umidità</span><span><ham-icon name="power"/><strong>{{activeCount()}} {{activeCount() === 1 ? 'acceso' : 'accesi'}}</strong>Su {{devices().length}} dispositivi</span><span class="room-health"><span [class]="offlineCount()>0?'warning-dot':'status-dot'"></span>{{devices().length===0?'Nessun dispositivo':offlineCount()>0 ? offlineCount()+(offlineCount()===1?' non disponibile':' non disponibili') : 'Tutti disponibili'}}</span></section>
  <div class="room-columns"><section class="devices-panel"><div class="section-heading"><div><h2>Dispositivi <span class="count">{{devices().length}}</span></h2><p>Piccoli controlli, grande comfort.</p></div><div class="device-display-options">@if(devices().length){<ham-device-view-toggle/>}<span class="pill">DEMO</span></div></div>@if(devices().length){<div class="category-tabs" role="group" aria-label="Filtra dispositivi per categoria">@for(c of categories;track c){<button [class.active]="category()===c" (click)="category.set(c)">{{c}}<span>{{categoryCount(c)}}</span></button>}</div>}
  @for(c of visibleCategories();track c){<div class="device-category-heading"><h3>{{c}}</h3><span>{{categoryCount(c)}} {{categoryCount(c) === 1 ? 'dispositivo' : 'dispositivi'}}</span></div><div class="device-list" [class.device-cards]="ui.deviceView()==='cards'">@for(d of devicesFor(c);track d.id){<div class="device-row" [class.device-offline]="!d.online" [class.light-device]="d.category==='Luci'&&d.controllable" [class.switchable-device]="d.controllable" [class.device-active]="d.on&&d.controllable&&d.online"><span class="device-icon" [class.is-on]="d.on&&d.controllable&&d.online"><ham-icon [name]="d.icon"/></span><div class="device-text"><strong>{{d.name}}</strong><small>{{d.online&&d.controllable&&!d.on?(d.category==='Luci'?'Pronta da accendere':d.category==='Prese'?'Presa disattivata':'Climatizzazione disattivata'):d.detail}}</small></div>@if(d.controllable){<span class="device-state" [id]="'device-state-'+d.id">{{!d.online?'Offline':d.category==='Luci'?(d.on?'Accesa':'Spenta'):(d.on?'Acceso':'Spento')}}</span><button class="toggle" role="switch" [attr.aria-checked]="d.on" [attr.aria-label]="d.name" [attr.aria-describedby]="'device-state-'+d.id" [attr.title]="!d.online?'Dispositivo non disponibile':d.on?'Spegni '+d.name:'Accendi '+d.name" [class.on]="d.on" [disabled]="!d.online" (click)="store.setDevices([d.id],!d.on)"><span></span></button>}@else{<span class="sensor-badge" [class.unavailable]="!d.online">{{d.online?'Disponibile':'Offline'}}</span>}</div>}</div>}
  @if(visibleCategories().length===0){<div class="empty-state compact"><ham-icon name="sensor"/><h3>{{devices().length?'Nessun dispositivo in questa categoria':'Uno spazio pronto per i tuoi dispositivi'}}</h3>@if(devices().length){<button class="text-button" (click)="category.set('Tutti')">Mostra tutti</button>}@else{<p>I dispositivi arriveranno con la futura integrazione Home Assistant.</p><a routerLink="/connessione" class="setup-room-link">Rivedi la casa <ham-icon name="arrow"/></a>}</div>}
  </section><aside class="groups-panel"><div class="section-heading"><div><h2>Gruppi <span class="count">{{groups().length}}</span></h2><p>Più dispositivi, un solo gesto.</p></div><ham-icon name="group"/></div>@for(g of groups();track g.id){<div class="group-card" [class.light-group]="isLightGroup(g)" [class.group-active]="groupOn(g)" [class.group-partial]="groupActiveCount(g)>0&&!groupOn(g)"><div class="group-card-top"><span class="group-icon"><ham-icon [name]="g.icon"/></span><button class="toggle" role="switch" [attr.aria-checked]="groupOn(g)" [attr.aria-label]="g.name" [attr.aria-describedby]="'group-state-'+g.id" [disabled]="!groupAvailable(g)" [class.on]="groupOn(g)" (click)="store.setDevices(g.deviceIds,!groupOn(g))"><span></span></button></div><h3>{{g.name}}</h3><p>{{g.description}}</p><div class="group-members">@for(id of g.deviceIds;track id){<span>{{deviceName(id)}}</span>}</div><div class="group-card-footer"><span>{{g.deviceIds.length}} dispositivi</span><span class="group-state-label" [id]="'group-state-'+g.id">{{groupState(g)}}</span></div></div>}
  @if(groups().length===0){<div class="empty-groups"><ham-icon name="group"/><h3>Spazio alle tue abitudini</h3><p>I gruppi riuniscono i dispositivi di una stanza. Al momento questo ambiente non ne contiene.</p>@if(hasDemoGroups()){<a routerLink="/stanze/soggiorno" class="text-button">Esplora i gruppi del soggiorno <ham-icon name="arrow"/></a>}</div>}
  @if(groups().length){<div class="group-tip"><ham-icon name="info"/><p>I gruppi riuniscono i dispositivi della stanza. Prova ad accenderli insieme: lo stato si aggiorna anche nelle categorie.</p></div>}</aside></div>
  }@else{<div class="empty-state"><ham-icon name="house"/><h1>Stanza non trovata</h1><p>Scegli un ambiente dalla panoramica della casa.</p><a routerLink="/casa" class="button primary">Torna alla casa</a></div>}
`})
export class RoomComponent {
  readonly ui=inject(UiPreferences);
  readonly store=inject(HomeStore); private params=toSignal(inject(ActivatedRoute).paramMap);
  readonly room=computed(()=>this.store.home().rooms.find(r=>r.id===this.params()?.get('id')));
  readonly floorName=computed(()=>this.store.home().floors.find(f=>f.id===this.room()?.floorId)?.name??'');
  readonly devices=computed(()=>this.store.home().devices.filter(d=>d.roomId===this.room()?.id));
  readonly groups=computed(()=>this.store.home().groups.filter(g=>g.roomId===this.room()?.id));
  readonly activeCount=computed(()=>this.devices().filter(d=>d.on&&d.controllable&&d.online).length);
  readonly offlineCount=computed(()=>this.devices().filter(d=>!d.online).length);
  readonly categories=['Tutti','Luci','Clima','Prese','Sensori'] as const;
  readonly category=signal<Category|'Tutti'>('Tutti');
  readonly visibleCategories=computed(()=>this.categories.filter((c):c is Category=>c!=='Tutti'&&(this.category()==='Tutti'||this.category()===c)&&this.categoryCount(c)>0));
  hasDemoGroups(){return this.store.home().groups.some(g=>g.roomId==='soggiorno')&&this.room()?.id!=='soggiorno';}
  categoryCount(c:string){return this.devices().filter(d=>c==='Tutti'||d.category===c).length;}
  devicesFor(c:Category){return this.devices().filter(d=>d.category===c);}
  deviceName(id:string){return this.store.home().devices.find(d=>d.id===id)?.name??id;}
  groupActiveCount(g:DeviceGroup){return this.store.home().devices.filter(d=>g.deviceIds.includes(d.id)&&d.on&&d.online&&d.controllable).length;}
  isLightGroup(g:DeviceGroup){return g.deviceIds.length>0&&g.deviceIds.every(id=>this.store.home().devices.find(d=>d.id===id)?.category==='Luci');}
  groupAvailable(g:DeviceGroup){return this.store.home().devices.some(d=>g.deviceIds.includes(d.id)&&d.online&&d.controllable);}
  groupOn(g:DeviceGroup){return g.deviceIds.length>0&&this.groupActiveCount(g)===g.deviceIds.length;}
  groupState(g:DeviceGroup){if(!this.groupAvailable(g))return 'Offline';const n=this.groupActiveCount(g);return n===g.deviceIds.length?(this.isLightGroup(g)?'Tutte accese':'Tutti accesi'):n===0?(this.isLightGroup(g)?'Tutte spente':'Tutti spenti'):'Parziale · '+n+'/'+g.deviceIds.length+' accesi';}
}
