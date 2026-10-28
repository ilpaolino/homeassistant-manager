import { Component, inject } from '@angular/core';
import { UiPreferences } from '../core/ui-preferences';
import { IconComponent } from './icon.component';

@Component({selector:'ham-device-view-toggle',imports:[IconComponent],template:`
  <div class="appearance-switch device-view-switch" role="group" aria-label="Visualizzazione dispositivi">
    <button type="button" [class.active]="ui.deviceView()==='list'" [attr.aria-pressed]="ui.deviceView()==='list'" (click)="ui.setDeviceView('list')" aria-label="Vista elenco" title="Vista elenco"><ham-icon name="list"/><span>Elenco</span></button>
    <button type="button" [class.active]="ui.deviceView()==='cards'" [attr.aria-pressed]="ui.deviceView()==='cards'" (click)="ui.setDeviceView('cards')" aria-label="Vista schede" title="Vista schede quadrate"><ham-icon name="grid"/><span>Schede</span></button>
  </div>
`})
export class DeviceViewToggleComponent {readonly ui=inject(UiPreferences);}
