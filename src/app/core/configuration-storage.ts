import type { HouseConfiguration } from './models';
import { isHome, validateAddress, validateConfiguration } from './configuration';

export const CONFIGURATION_KEY = 'ham.house.v1';

export function isConfiguration(value: unknown): value is HouseConfiguration {
  if (!value || typeof value !== 'object') return false;
  const c=value as HouseConfiguration;
  return c.version===1 && ['import','manual'].includes(c.source) && typeof c.savedAt==='string' && Number.isFinite(Date.parse(c.savedAt))
    && isHome(c.home) && validateConfiguration(c.home).length===0
    && (c.connection===null ? c.source==='manual' : c.connection?.mode==='demo' && typeof c.connection.name==='string' && typeof c.connection.address==='string' && validateAddress(c.connection.address)!==null);
}

export function readConfiguration(storage: Pick<Storage,'getItem'>): HouseConfiguration | null {
  const raw=storage.getItem(CONFIGURATION_KEY);
  if(raw===null) return null;
  const value:unknown=JSON.parse(raw);
  if(!isConfiguration(value)) throw new Error('Configurazione locale non valida');
  return value;
}

export function writeConfiguration(storage: Pick<Storage,'setItem'>,configuration:HouseConfiguration):void {
  if(!isConfiguration(configuration)) throw new Error('Configurazione non valida');
  storage.setItem(CONFIGURATION_KEY,JSON.stringify(configuration));
}
