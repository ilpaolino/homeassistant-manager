import { Injectable, computed, inject, signal } from '@angular/core';
import { HOME_ADAPTER } from './home-adapter';
import { validateConfiguration } from './configuration';
import { ConnectionResult, Home, HouseConfiguration } from './models';

@Injectable({providedIn:'root'})
export class HomeStore {
  private readonly adapter = inject(HOME_ADAPTER);
  readonly home = signal<Home>({name:'Casa di esempio',floors:[],rooms:[],devices:[],groups:[]});
  readonly configuration = signal<HouseConfiguration | null>(null);
  readonly connection = computed(() => this.configuration()?.connection ?? null);
  readonly storageWarning = signal('');
  readonly notice = signal('');
  readonly active = computed(() => this.home().devices.filter(d => d.on && d.controllable && d.online).length);
  readonly offline = computed(() => this.home().devices.filter(d => !d.online).length);
  private timer?: ReturnType<typeof setTimeout>;

  async load() {
    this.home.set(await this.adapter.loadHome());
    try {this.configuration.set(await this.adapter.loadConfiguration());this.storageWarning.set('');}
    catch {this.configuration.set(null);this.storageWarning.set('La configurazione locale non è leggibile. Stai visualizzando la casa di esempio; puoi creare e salvare una nuova configurazione.');}
  }
  discover(address:string) {return this.adapter.discoverHome(address);}
  async saveConfiguration(home:Home,connection:ConnectionResult|null,source:'import'|'manual') {
    const errors=validateConfiguration(home);if(errors.length)throw new Error(errors[0]);
    await this.adapter.saveConfiguration({version:1,home,connection,source,savedAt:new Date().toISOString()});
    await this.load();
  }
  async setDevices(ids: string[], on: boolean) {
    try { await this.adapter.setDevices(ids,on); await this.load(); this.notify(on ? 'Dispositivi accesi nella demo' : 'Dispositivi spenti nella demo'); }
    catch { this.notify('Aggiornamento non salvato. Verifica lo spazio sul dispositivo e riprova.'); }
  }
  notify(message: string) {this.notice.set(message);clearTimeout(this.timer);this.timer=setTimeout(()=>this.notice.set(''),3500);}
}
