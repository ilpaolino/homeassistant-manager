import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIGURATION_KEY, readConfiguration, writeConfiguration } from '../src/app/core/configuration-storage.ts';
import type { HouseConfiguration } from '../src/app/core/models.ts';

const configuration=():HouseConfiguration=>({version:1,source:'manual',connection:null,savedAt:new Date().toISOString(),home:{name:'Casa nuova',floors:[{id:'f',name:'Terra',label:''}],rooms:[{id:'r',name:'Sala',floorId:'f',icon:'sofa',temperature:null,humidity:null,description:''}],devices:[],groups:[]}});
const storage=()=>{const values=new Map<string,string>();return{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}};};

test('saved configuration survives a new reader and remains independent of the draft',()=>{const s=storage();const c=configuration();writeConfiguration(s,c);c.home.name='Bozza modificata';assert.equal(readConfiguration(s)?.home.name,'Casa nuova');});
test('an empty storage starts without a configured home',()=>{assert.equal(readConfiguration(storage()),null);});
test('malformed JSON, unknown versions and orphan devices are rejected',()=>{const s=storage();s.setItem(CONFIGURATION_KEY,'{broken');assert.throws(()=>readConfiguration(s));const c=configuration();s.setItem(CONFIGURATION_KEY,JSON.stringify({...c,version:2}));assert.throws(()=>readConfiguration(s));c.home.devices.push({id:'d',name:'Lampada',roomId:'missing',category:'Luci',icon:'light',detail:'',on:false,controllable:true,online:true});s.setItem(CONFIGURATION_KEY,JSON.stringify(c));assert.throws(()=>readConfiguration(s));});
test('failed writes preserve the previous saved home',()=>{const s=storage();writeConfiguration(s,configuration());const failing={setItem:()=>{throw new Error('Quota exceeded');}};assert.throws(()=>writeConfiguration(failing,{...configuration(),home:{...configuration().home,name:'Non salvata'}}));assert.equal(readConfiguration(s)?.home.name,'Casa nuova');});
test('invalid imported connection cannot be written',()=>{const s=storage();const c=configuration();c.source='import';assert.throws(()=>writeConfiguration(s,c));c.connection={name:'Demo',mode:'demo',address:'http://user:secret@ha.local'};assert.throws(()=>writeConfiguration(s,c));assert.equal(s.getItem(CONFIGURATION_KEY),null);});
