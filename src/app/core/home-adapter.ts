import { InjectionToken } from '@angular/core';
import { DiscoveryResult, Home, HouseConfiguration } from './models';

// The UI depends on this contract; discovery and local persistence are separate from committing a configuration.
export interface HomeAdapter {
  loadHome(): Promise<Home>;
  loadConfiguration(): Promise<HouseConfiguration | null>;
  discoverHome(address: string): Promise<DiscoveryResult>;
  saveConfiguration(configuration: HouseConfiguration): Promise<void>;
  setDevices(ids: string[], on: boolean): Promise<void>;
}
export const HOME_ADAPTER = new InjectionToken<HomeAdapter>('HOME_ADAPTER');
