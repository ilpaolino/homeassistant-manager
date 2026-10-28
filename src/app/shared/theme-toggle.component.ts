import { Component, inject } from '@angular/core';
import { UiPreferences } from '../core/ui-preferences';
import { IconComponent } from './icon.component';

@Component({selector:'ham-theme-toggle',imports:[IconComponent],template:`
  <div class="appearance-switch" role="group" aria-label="Tema interfaccia">
    <button type="button" [class.active]="ui.theme()==='light'" [attr.aria-pressed]="ui.theme()==='light'" (click)="ui.setTheme('light')" aria-label="Tema chiaro" title="Tema chiaro"><ham-icon name="sun"/><span>Chiaro</span></button>
    <button type="button" [class.active]="ui.theme()==='dark'" [attr.aria-pressed]="ui.theme()==='dark'" (click)="ui.setTheme('dark')" aria-label="Tema scuro" title="Tema scuro"><ham-icon name="moon"/><span>Scuro</span></button>
  </div>
`})
export class ThemeToggleComponent {readonly ui=inject(UiPreferences);}
