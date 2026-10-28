import { Injectable, signal } from '@angular/core';

type Theme = 'dark' | 'light';
type DeviceView = 'list' | 'cards';
const KEY = 'ham.appearance.v1';

@Injectable({providedIn:'root'})
export class UiPreferences {
  readonly theme = signal<Theme>('dark');
  readonly deviceView = signal<DeviceView>('list');

  constructor() {
    try {
      const saved=JSON.parse(localStorage.getItem(KEY)??'null');
      if(saved?.theme==='light'||saved?.theme==='dark')this.theme.set(saved.theme);
      if(saved?.deviceView==='cards'||saved?.deviceView==='list')this.deviceView.set(saved.deviceView);
    } catch { /* Preferences are optional; the house configuration has its own storage. */ }
    this.applyTheme();
  }
  setTheme(theme:Theme) {this.theme.set(theme);this.applyTheme();this.save();}
  setDeviceView(view:DeviceView) {this.deviceView.set(view);this.save();}
  private applyTheme() {
    document.documentElement.dataset['theme']=this.theme();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',this.theme()==='light'?'#f4f6f3':'#101416');
  }
  private save() {
    try {localStorage.setItem(KEY,JSON.stringify({theme:this.theme(),deviceView:this.deviceView()}));}
    catch { /* The current window keeps working if preference storage is unavailable. */ }
  }
}
