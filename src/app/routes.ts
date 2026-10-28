import { inject } from '@angular/core';
import { HomeStore } from './core/home-store';
import { Routes } from '@angular/router';
import { ConnectionComponent } from './views/connection.component';
import { OverviewComponent } from './views/overview.component';
import { RoomComponent } from './views/room.component';
export const routes: Routes = [
  {path:'connessione',component:ConnectionComponent},
  {path:'casa',component:OverviewComponent},
  {path:'stanze/:id',component:RoomComponent},
  {path:'',pathMatch:'full',redirectTo:()=>inject(HomeStore).configuration()?'casa':'connessione'},
  {path:'**',redirectTo:'casa'}
];
