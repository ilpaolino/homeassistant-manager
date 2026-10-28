import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HomeStore } from './home-store';
import { isHome, prepareHome, validateAddress, validateConfiguration, validateStructure } from './configuration';
import { ConnectionResult, Home, Room } from './models';

export type SetupSource = 'import' | 'manual';
interface Draft { version: 1; step: number; source: SetupSource; home: Home; connection: ConnectionResult | null; detected: boolean; selectedIds: string[]; address: string; }
const DRAFT_KEY = 'ham.setup-draft.v1';
const emptyHome = (): Home => ({ name:'La mia casa', floors:[{id:'terra',name:'Piano terra',label:''}], rooms:[], devices:[], groups:[] });
const freshDraft = (): Draft => ({ version:1, step:0, source:'import', home:emptyHome(), connection:null, detected:false, selectedIds:[], address:'http://homeassistant.local:8123' });

function restoreDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return freshDraft();
    const d = JSON.parse(raw);
    if (d.version !== 1 || !['import','manual'].includes(d.source) || !Number.isInteger(d.step) || d.step < 0 || d.step > 4 || !isHome(d.home) || !Array.isArray(d.selectedIds) || !d.selectedIds.every((id: unknown) => typeof id === 'string') || typeof d.address !== 'string' || typeof d.detected !== 'boolean') return freshDraft();
    if (d.connection !== null && (d.connection?.mode !== 'demo' || typeof d.connection?.address !== 'string' || typeof d.connection?.name !== 'string')) return freshDraft();
    if (d.step > 1 && d.source === 'import' && (!d.detected || !d.connection)) d.step = 1;
    if (d.step > 2 && validateStructure(d.home).length) d.step = 2;
    if (d.step === 4 && validateConfiguration(prepareHome(d.home,d.selectedIds)).length) d.step = 3;
    if(d.source==='manual'&&(d.step===1||d.step===3))d.step=d.step===1?2:4;
    return d;
  } catch { return freshDraft(); }
}

@Injectable({providedIn:'root'})
export class SetupStore {
  private readonly store = inject(HomeStore);
  readonly draft = signal<Draft>(restoreDraft());
  readonly busy = signal(false);
  readonly errors = signal<string[]>([]);
  readonly draftWarning = signal('');
  readonly lastRemoved = signal<{room:Room;deviceIds:string[]} | null>(null);
  readonly home = computed(() => this.draft().home);
  readonly included = computed(() => this.home().devices.filter(d => this.draft().selectedIds.includes(d.id)));
  readonly unassigned = computed(() => this.included().filter(d => !this.home().rooms.some(r => r.id === d.roomId)));
  readonly prepared = computed(() => prepareHome(this.home(),this.draft().selectedIds));
  readonly canContinue = computed(() => {
    const d=this.draft();
    if(d.step===1) return d.source==='manual'||d.detected;
    if(d.step===2) return validateStructure(d.home).length===0;
    if(d.step===3||d.step===4) return validateConfiguration(this.prepared()).length===0;
    return true;
  });

  constructor() {
    effect(() => {
      const draft=this.draft();
      try { sessionStorage.setItem(DRAFT_KEY,JSON.stringify(draft)); this.draftWarning.set(''); }
      catch { this.draftWarning.set('La bozza resta disponibile finché questa finestra è aperta. Il ripristino dopo una ricarica non è disponibile.'); }
    });
  }
  private updateHome(fn:(home:Home)=>Home) { this.draft.update(d=>({...d,home:fn(d.home)})); this.errors.set([]); }
  setSource(source:SetupSource) {
    if(this.draft().source===source) return;
    // Returning to an earlier step never changes the committed home.
    this.draft.set({...freshDraft(),source}); this.lastRemoved.set(null); this.errors.set([]);
  }
  setName(name:string) { this.updateHome(h=>({...h,name})); }
  setAddress(address:string) { this.draft.update(d=>({...d,address,detected:false,connection:null})); this.errors.set([]); }
  async detect() {
    if(this.busy()) return;
    const address=validateAddress(this.draft().address);
    if(!address) { this.errors.set(['Indica solo l’indirizzo HTTP o HTTPS del server, senza credenziali, percorsi o parametri.']); return; }
    this.busy.set(true); this.errors.set([]);
    try {
      const result=await this.store.discover(address);
      this.draft.update(d=>({...d,address,home:result.home,connection:result.connection,detected:true,selectedIds:result.home.devices.map(device=>device.id)}));
      this.lastRemoved.set(null);
    } catch { this.errors.set(['Il rilevamento demo non è riuscito. Riprova; la casa salvata non è stata modificata.']); }
    finally { this.busy.set(false); }
  }
  editCurrent() {
    const config=this.store.configuration(); if(!config) return;
    this.draft.set({...freshDraft(),step:2,source:config.source,home:structuredClone(config.home),connection:config.connection,detected:!!config.connection,selectedIds:config.home.devices.map(d=>d.id)});
    this.errors.set([]); this.lastRemoved.set(null);
  }
  go(step:number) { if(this.busy()||step<0||step>4) return; if(step<=this.draft().step) {this.draft.update(d=>({...d,step}));this.errors.set([]);} }
  next() {
    if(this.busy()) return;
    const step=this.draft().step;
    if(step===2) this.errors.set(validateStructure(this.home()));
    else if(step===3) this.errors.set(validateConfiguration(this.prepared()));
    if(!this.canContinue()) return;
    this.draft.update(d=>({...d,step:d.source==='manual'?(d.step===0?2:4):Math.min(4,d.step+1)})); this.errors.set([]);
  }
  addFloor() {
    const existing=new Set(this.home().floors.map(f=>f.name.toLocaleLowerCase('it')));
    let name='Nuovo piano'; let suffix=2; while(existing.has(name.toLocaleLowerCase('it'))) name=`Nuovo piano ${suffix++}`;
    const id=crypto.randomUUID(); this.updateHome(h=>({...h,floors:[...h.floors,{id,name,label:''}]})); return id;
  }
  patchFloor(id:string,patch:{name?:string;label?:string}) { this.updateHome(h=>({...h,floors:h.floors.map(f=>f.id===id?{...f,...patch}:f)})); }
  removeFloor(id:string) {
    if(this.home().floors.length<=1||this.home().rooms.some(r=>r.floorId===id)) return;
    this.updateHome(h=>({...h,floors:h.floors.filter(f=>f.id!==id)}));
  }
  addRoom(name:string,floorId:string,icon='house') {
    if(!name.trim()||!this.home().floors.some(f=>f.id===floorId)) {this.errors.set(['Scegli un piano e inserisci il nome della stanza.']);return false;}
    if(this.home().rooms.some(r=>r.floorId===floorId&&r.name.trim().toLocaleLowerCase('it')===name.trim().toLocaleLowerCase('it'))) {this.errors.set(['Questa stanza esiste già nel piano selezionato.']);return false;}
    this.updateHome(h=>({...h,rooms:[...h.rooms,{id:crypto.randomUUID(),name:name.trim(),floorId,icon,temperature:null,humidity:null,description:'Il tuo spazio, da configurare come vuoi.'}]}));return true;
  }
  patchRoom(id:string,patch:Partial<Pick<Room,'name'|'floorId'|'icon'>>) { this.updateHome(h=>({...h,rooms:h.rooms.map(r=>r.id===id?{...r,...patch}:r)})); }
  removeRoom(id:string) {
    const room=this.home().rooms.find(r=>r.id===id); if(!room) return;
    this.lastRemoved.set({room:structuredClone(room),deviceIds:this.home().devices.filter(d=>d.roomId===id).map(d=>d.id)});
    this.updateHome(h=>({...h,rooms:h.rooms.filter(r=>r.id!==id),devices:h.devices.map(d=>d.roomId===id?{...d,roomId:''}:d)}));
  }
  undoRemove() {
    const removed=this.lastRemoved();if(!removed) return;
    if(!this.home().floors.some(f=>f.id===removed.room.floorId)) {this.errors.set(['Il piano originale non esiste più. Crea di nuovo la stanza nel piano desiderato.']);return;}
    if(this.home().rooms.some(r=>r.floorId===removed.room.floorId&&r.name.trim().toLocaleLowerCase('it')===removed.room.name.trim().toLocaleLowerCase('it'))) {this.errors.set(['Esiste già una stanza con questo nome nel piano originale. Rinominala prima di annullare.']);return;}
    this.updateHome(h=>({...h,rooms:[...h.rooms,removed.room],devices:h.devices.map(d=>removed.deviceIds.includes(d.id)&&!d.roomId?{...d,roomId:removed.room.id}:d)})); this.lastRemoved.set(null);
  }
  include(id:string,include:boolean) {this.draft.update(d=>({...d,selectedIds:include?[...new Set([...d.selectedIds,id])]:d.selectedIds.filter(x=>x!==id)}));this.errors.set([]);}
  assign(id:string,roomId:string) {this.updateHome(h=>({...h,devices:h.devices.map(d=>d.id===id?{...d,roomId}:d)}));}
  excludeUnassigned() {const ids=this.unassigned().map(d=>d.id);this.draft.update(d=>({...d,selectedIds:d.selectedIds.filter(id=>!ids.includes(id))}));this.errors.set([]);}
  restart() {this.draft.set(freshDraft());this.errors.set([]);this.lastRemoved.set(null);}
  async save():Promise<boolean> {
    if(this.busy()) return false;
    const errors=validateConfiguration(this.prepared());this.errors.set(errors);if(errors.length) return false;
    this.busy.set(true);
    try {await this.store.saveConfiguration(this.prepared(),this.draft().connection,this.draft().source);this.restart();return true;}
    catch {this.errors.set(['Non è stato possibile salvare la casa sul dispositivo. La bozza è intatta: verifica lo spazio disponibile e riprova.']);return false;}
    finally {this.busy.set(false);}
  }
}
