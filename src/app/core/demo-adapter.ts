import { Injectable } from '@angular/core';
import { HomeAdapter } from './home-adapter';
import { DiscoveryResult, Home, HouseConfiguration } from './models';
import { readConfiguration, writeConfiguration } from './configuration-storage';

const DEMO_HOME: Home = {
  name: 'Casa di Paolino',
  floors: [{id:'terra',name:'Piano terra',label:'Zona giorno'},{id:'primo',name:'Primo piano',label:'Zona notte'},{id:'esterni',name:'Esterni',label:'Spazi aperti'}],
  rooms: [
    {id:'soggiorno',name:'Soggiorno',floorId:'terra',icon:'sofa',temperature:'22,4',humidity:46,description:'Il cuore della casa, tutto sotto controllo.'},
    {id:'cucina',name:'Cucina',floorId:'terra',icon:'kitchen',temperature:'23,1',humidity:50,description:'Spazio alle tue abitudini quotidiane.'},
    {id:'studio',name:'Studio',floorId:'terra',icon:'monitor',temperature:'21,8',humidity:43,description:'La giusta atmosfera per concentrarsi.'},
    {id:'ingresso',name:'Ingresso',floorId:'terra',icon:'door',temperature:'21,2',humidity:45,description:'Benvenuto a casa.'},
    {id:'camera',name:'Camera da letto',floorId:'primo',icon:'bed',temperature:'20,5',humidity:48,description:'Il tuo spazio per rallentare.'},
    {id:'bagno',name:'Bagno',floorId:'primo',icon:'bath',temperature:'23,0',humidity:58,description:'Comfort, in ogni momento.'},
    {id:'giardino',name:'Giardino',floorId:'esterni',icon:'leaf',temperature:'18,6',humidity:61,description:'La casa continua all’aperto.'}
  ],
  devices: [
    {id:'l1',name:'Lampada divano',roomId:'soggiorno',category:'Luci',icon:'lamp',detail:'Luminosità 75% · luce calda',on:true,controllable:true,online:true},
    {id:'l2',name:'Luce soffitto',roomId:'soggiorno',category:'Luci',icon:'light',detail:'Luminosità 100% · luce calda',on:false,controllable:true,online:true},
    {id:'l3',name:'Striscia LED TV',roomId:'soggiorno',category:'Luci',icon:'light',detail:'Luminosità 40% · ambra',on:true,controllable:true,online:true},
    {id:'c1',name:'Termostato soggiorno',roomId:'soggiorno',category:'Clima',icon:'thermometer',detail:'Obiettivo 22 °C · automatico',on:true,controllable:true,online:true},
    {id:'p1',name:'Presa TV',roomId:'soggiorno',category:'Prese',icon:'plug',detail:'Consumo simulato · 42 W',on:true,controllable:true,online:true},
    {id:'s1',name:'Sensore ambiente',roomId:'soggiorno',category:'Sensori',icon:'sensor',detail:'22,4 °C · umidità 46%',on:true,controllable:false,online:true},
    {id:'s2',name:'Sensore finestra',roomId:'soggiorno',category:'Sensori',icon:'door',detail:'Finestra chiusa · batteria 92%',on:false,controllable:false,online:true},
    {id:'k1',name:'Luce piano di lavoro',roomId:'cucina',category:'Luci',icon:'light',detail:'Luminosità 80%',on:true,controllable:true,online:true},
    {id:'k2',name:'Presa macchina caffè',roomId:'cucina',category:'Prese',icon:'plug',detail:'In standby',on:false,controllable:true,online:true},
    {id:'k3',name:'Sensore cucina',roomId:'cucina',category:'Sensori',icon:'sensor',detail:'23,1 °C · umidità 50%',on:true,controllable:false,online:true},
    {id:'st1',name:'Lampada scrivania',roomId:'studio',category:'Luci',icon:'lamp',detail:'Luminosità 65%',on:true,controllable:true,online:true},
    {id:'st2',name:'Presa monitor',roomId:'studio',category:'Prese',icon:'plug',detail:'Consumo simulato · 28 W',on:true,controllable:true,online:true},
    {id:'i1',name:'Luce ingresso',roomId:'ingresso',category:'Luci',icon:'light',detail:'Luminosità 100%',on:false,controllable:true,online:true},
    {id:'i2',name:'Sensore porta',roomId:'ingresso',category:'Sensori',icon:'door',detail:'Porta chiusa',on:false,controllable:false,online:true},
    {id:'b1',name:'Abat-jour',roomId:'camera',category:'Luci',icon:'lamp',detail:'Luminosità 30%',on:false,controllable:true,online:true},
    {id:'b2',name:'Termostato camera',roomId:'camera',category:'Clima',icon:'thermometer',detail:'Obiettivo 20 °C',on:true,controllable:true,online:true},
    {id:'ba1',name:'Luce specchio',roomId:'bagno',category:'Luci',icon:'light',detail:'Luminosità 100%',on:false,controllable:true,online:true},
    {id:'ba2',name:'Sensore umidità',roomId:'bagno',category:'Sensori',icon:'sensor',detail:'Batteria esaurita · non disponibile',on:false,controllable:false,online:false},
    {id:'g1',name:'Luci vialetto',roomId:'giardino',category:'Luci',icon:'light',detail:'Luminosità 70%',on:false,controllable:true,online:true},
    {id:'g2',name:'Sensore esterno',roomId:'giardino',category:'Sensori',icon:'sensor',detail:'18,6 °C · umidità 61%',on:true,controllable:false,online:true}
  ],
  groups: [
    {id:'relax',roomId:'soggiorno',name:'Angolo relax',description:'Le luci intorno al divano',icon:'sofa',deviceIds:['l1','l3']},
    {id:'all-lights',roomId:'soggiorno',name:'Tutte le luci',description:'Un solo comando per la stanza',icon:'light',deviceIds:['l1','l2','l3']},
    {id:'work',roomId:'studio',name:'Postazione lavoro',description:'Lampada e monitor, insieme',icon:'monitor',deviceIds:['st1','st2']}
  ]
};
@Injectable()
export class DemoHomeAdapter implements HomeAdapter {
  private home = structuredClone(DEMO_HOME);
  private configuration: HouseConfiguration | null = null;
  private restoreError = false;

  constructor() {
    try { this.configuration=readConfiguration(localStorage); if(this.configuration)this.home=structuredClone(this.configuration.home); }
    catch { this.restoreError=true; }
  }
  async loadHome():Promise<Home> { return structuredClone(this.home); }
  async loadConfiguration():Promise<HouseConfiguration|null> {
    if(this.restoreError)throw new Error('Configurazione locale non leggibile');
    return structuredClone(this.configuration);
  }
  async discoverHome(address:string):Promise<DiscoveryResult> {
    await new Promise(resolve=>setTimeout(resolve,650));
    const home=structuredClone(DEMO_HOME);
    // Missing area assignments are intentional: the setup asks the user to resolve them.
    home.devices=home.devices.map(d=>['s2','ba2'].includes(d.id)?{...d,roomId:''}:d);
    return {home,connection:{name:home.name,address,mode:'demo'}};
  }
  async saveConfiguration(configuration:HouseConfiguration):Promise<void> {
    // Write first. A storage failure must not change the committed in-memory home.
    writeConfiguration(localStorage,configuration);
    this.configuration=structuredClone(configuration);
    this.home=structuredClone(configuration.home);
    this.restoreError=false;
  }
  async setDevices(ids:string[],on:boolean):Promise<void> {
    const home={...this.home,devices:this.home.devices.map(d=>ids.includes(d.id)&&d.controllable&&d.online?{...d,on}:d)};
    if(this.configuration)await this.saveConfiguration({...this.configuration,home});
    else this.home=home;
  }
}
