import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HomeStore } from '../core/home-store';
import { SetupSource, SetupStore } from '../core/setup-store';
import { validateStructure } from '../core/configuration';
import { UiPreferences } from '../core/ui-preferences';
import { ThemeToggleComponent } from '../shared/theme-toggle.component';
import { DeviceViewToggleComponent } from '../shared/device-view-toggle.component';
import { IconComponent } from '../shared/icon.component';

@Component({selector:'ham-connection',imports:[FormsModule,RouterLink,IconComponent,ThemeToggleComponent,DeviceViewToggleComponent],templateUrl:'./connection.component.html'})
export class ConnectionComponent {
  readonly ui=inject(UiPreferences);
  readonly setup=inject(SetupStore);
  readonly store=inject(HomeStore);
  private readonly router=inject(Router);
  readonly selectedFloor=signal('');
  readonly deviceFilter=signal<'all'|'unassigned'|'excluded'>('all');
  readonly query=signal('');
  readonly confirmRestart=signal(false);
  readonly completed=signal(false);
  readonly pendingSource=signal<SetupSource|null>(null);
  readonly floorId=computed(()=>this.setup.home().floors.find(f=>f.id===this.selectedFloor())?.id??this.setup.home().floors[0]?.id??'');
  readonly currentFloor=computed(()=>this.setup.home().floors.find(f=>f.id===this.floorId()));
  readonly floorRooms=computed(()=>this.setup.home().rooms.filter(r=>r.floorId===this.floorId()));
  readonly structureIssues=computed(()=>this.setup.draft().step===2 && !this.setup.canContinue());
  readonly structureErrors=computed(()=>validateStructure(this.setup.home()));
  readonly visibleDevices=computed(()=>this.setup.home().devices.filter(d=> {
    const selected=this.setup.draft().selectedIds.includes(d.id);
    return (this.deviceFilter()==='all'||(this.deviceFilter()==='excluded'&&!selected)||(this.deviceFilter()==='unassigned'&&selected&&!this.setup.home().rooms.some(r=>r.id===d.roomId))) && d.name.toLocaleLowerCase('it').includes(this.query().trim().toLocaleLowerCase('it'));
  }));
  readonly steps=[{title:'Come vuoi iniziare',detail:'Importa o crea da zero',icon:'house'},{title:'Riconosci la casa',detail:'Verifica l’origine dei dati',icon:'wifi'},{title:'Disegna gli spazi',detail:'Nome, piani e stanze',icon:'layers'},{title:'Organizza i dispositivi',detail:'Ogni cosa al suo posto',icon:'sensor'},{title:'Controlla e salva',detail:'La tua casa prende forma',icon:'check'}];
  readonly visibleSteps=computed(()=>this.steps.map((step,index)=>({...step,index})).filter(step=>this.setup.draft().source==='import'||[0,2,4].includes(step.index)));
  readonly displayStep=computed(()=>this.visibleSteps().findIndex(s=>s.index===this.setup.draft().step)+1);
  readonly titles=['Ogni casa ha il suo inizio.','Troviamo il tuo Home Assistant.','Facciamo spazio alla tua casa.','Ogni dispositivo, nella sua stanza.','È proprio la tua casa?'];
  readonly descriptions=['Parti da quello che hai già oppure costruisci la tua casa, un ambiente alla volta.','Riconosci la struttura esistente prima di importarla. Decidi tu cosa tenere.','Dai un nome alla casa e organizza piani e stanze. Puoi cambiare ogni dettaglio.','Controlla le assegnazioni riconosciute. Scegli cosa includere e completa quelle mancanti.','Un ultimo sguardo alla struttura. Salva quando ogni cosa è al suo posto.'];
  readonly roomTypes=[{name:'Soggiorno',icon:'sofa'},{name:'Cucina',icon:'kitchen'},{name:'Camera',icon:'bed'},{name:'Bagno',icon:'bath'},{name:'Studio',icon:'monitor'},{name:'Ingresso',icon:'door'},{name:'Giardino',icon:'leaf'}];
  newRoomName='';
  newRoomIcon='house';
  title(){return this.setup.draft().step===1&&this.setup.draft().source==='manual'?'Una casa nuova, a modo tuo.':this.titles[this.setup.draft().step];}
  description(){return this.setup.draft().step===1&&this.setup.draft().source==='manual'?'Puoi organizzare gli spazi anche senza un server. I dispositivi arriveranno quando vorrai collegarli.':this.descriptions[this.setup.draft().step];}
  floorCount(id:string){return this.setup.home().rooms.filter(r=>r.floorId===id).length;}
  included(id:string){return this.setup.draft().selectedIds.includes(id);}
  chooseSource(source:SetupSource){if(source===this.setup.draft().source)return;if(this.setup.home().rooms.length||this.setup.draft().detected)this.pendingSource.set(source);else this.setup.setSource(source);}
  changeSource(){const source=this.pendingSource();if(source)this.setup.setSource(source);this.pendingSource.set(null);}
  roomName(id:string){return this.setup.home().rooms.find(r=>r.id===id)?.name??'Da assegnare';}
  addFloor(){const id=this.setup.addFloor();if(id)this.selectedFloor.set(id);}
  addRoom(name=this.newRoomName,icon=this.newRoomIcon){if(this.setup.addRoom(name,this.floorId(),icon))this.newRoomName='';}
  next(){this.setup.next();this.focusTitle();}
  back(){const d=this.setup.draft();this.setup.go(d.source==='manual'?(d.step===4?2:0):d.step-1);this.focusTitle();}
  go(step:number){this.setup.go(step);this.focusTitle();}
  private focusTitle(){requestAnimationFrame(()=>document.getElementById('setup-title')?.focus());}
  restart(){this.setup.restart();this.confirmRestart.set(false);this.pendingSource.set(null);this.query.set('');this.deviceFilter.set('all');this.newRoomName='';}
  async save(){if(await this.setup.save()){this.completed.set(true);this.focusTitle();}}
  async enter(){await this.router.navigateByUrl('/casa');}
}
