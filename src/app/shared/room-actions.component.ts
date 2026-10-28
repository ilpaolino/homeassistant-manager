import { Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { Device } from '../core/models';
import { HomeStore } from '../core/home-store';
import { IconComponent } from './icon.component';

interface RoomAction { label:string; scope:'lights'|'all'; on:boolean; icon:string; }

@Component({
  selector:'ham-room-actions',
  imports:[IconComponent],
  host:{'(document:click)':'outsideClick($event)','(document:keydown.escape)':'escape($event)','(focusout)':'focusOut($event)'},
  template:`
    <div class="room-actions">
      <button #trigger type="button" class="button secondary room-actions-trigger" aria-haspopup="menu" [attr.aria-expanded]="open()" [attr.aria-controls]="open()?'room-actions-menu':null" [disabled]="busy()" (click)="toggle()" (keydown)="triggerKey($event)"><ham-icon name="power"/>Azioni stanza<ham-icon name="down"/></button>
      @if(open()){
        <div #menu id="room-actions-menu" class="room-actions-menu" role="menu" aria-label="Azioni stanza" (keydown)="menuKey($event)">
          @for(action of actions;track action.label){
            <button type="button" role="menuitem" tabindex="-1" [class.action-unavailable]="count(action)===0" [attr.aria-disabled]="count(action)===0" [attr.title]="count(action)===0?'Nessun dispositivo da '+(action.on?'accendere':'spegnere'):null" (click)="run(action)"><span class="room-action-icon" [class.light-action]="action.scope==='lights'" [class.action-on]="action.on"><ham-icon [name]="action.icon"/></span><span>{{action.label}}</span><span class="room-action-count" aria-hidden="true">{{count(action)}}</span></button>
          }
          <p class="room-actions-help" role="none">Solo dispositivi controllabili e disponibili.</p>
        </div>
      }
    </div>
  `
})
export class RoomActionsComponent {
  readonly devices=input.required<Device[]>();
  readonly open=signal(false);
  readonly busy=signal(false);
  readonly actions:RoomAction[]=[
    {label:'Accendi tutte le Luci',scope:'lights',on:true,icon:'light'},
    {label:'Spegni tutte le Luci',scope:'lights',on:false,icon:'light'},
    {label:'Accendi tutti i dispositivi',scope:'all',on:true,icon:'power'},
    {label:'Spegni tutti i dispositivi',scope:'all',on:false,icon:'power'}
  ];
  private readonly host=inject(ElementRef<HTMLElement>);
  private readonly store=inject(HomeStore);
  private readonly trigger=viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menu=viewChild<ElementRef<HTMLElement>>('menu');
  private readonly controllable=computed(()=>this.devices().filter(d=>d.controllable&&d.online));

  private targets(action:RoomAction){return this.controllable().filter(d=>(action.scope==='all'||d.category==='Luci')&&d.on!==action.on);}
  count(action:RoomAction){return this.targets(action).length;}
  toggle(){if(this.open())this.close();else this.show();}
  private show(last=false){
    this.open.set(true);
    requestAnimationFrame(()=>{const buttons=this.items();(last?buttons.at(-1):buttons[0])?.focus();});
  }
  private close(restore=true){this.open.set(false);if(restore)this.trigger()?.nativeElement.focus();}
  private items(){return Array.from(this.menu()?.nativeElement.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')??[]);}
  triggerKey(event:KeyboardEvent){if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();this.show(event.key==='ArrowUp');}}
  menuKey(event:KeyboardEvent){
    const items=this.items();const index=items.indexOf(document.activeElement as HTMLButtonElement);
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;
      items[next]?.focus();
    }else if(event.key==='Tab'){
      event.preventDefault();
      const anchor=this.trigger()?.nativeElement;
      const candidates=Array.from(document.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]'))
        .filter(el=>el.tabIndex>=0&&!el.matches(':disabled')&&el.getClientRects().length>0&&!this.host.nativeElement.contains(el));
      const next=anchor?(event.shiftKey?candidates.reverse().find(el=>Boolean(anchor.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_PRECEDING)):candidates.find(el=>Boolean(anchor.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING))):undefined;
      this.close(false);(next??anchor)?.focus();
    }
  }
  escape(event:Event){if(this.open()){event.preventDefault();this.close();}}
  outsideClick(event:MouseEvent){if(this.open()&&!this.host.nativeElement.contains(event.target as Node))this.close(false);}
  focusOut(event:FocusEvent){if(this.open()&&event.relatedTarget&&!this.host.nativeElement.contains(event.relatedTarget as Node))this.close(false);}
  async run(action:RoomAction){
    const ids=this.targets(action).map(d=>d.id);
    if(!ids.length||this.busy())return;
    this.close();this.busy.set(true);
    try{await this.store.setDevices(ids,action.on);}finally{this.busy.set(false);requestAnimationFrame(()=>this.trigger()?.nativeElement.focus());}
  }
}
