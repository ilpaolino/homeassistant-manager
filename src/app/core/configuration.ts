import type { Home } from './models';

const normalized = (name: string) => name.trim().toLocaleLowerCase('it');
const unique = (ids: string[]) => new Set(ids).size === ids.length;

export function validateStructure(home: Home): string[] {
  const errors: string[] = [];
  if (!home.name.trim()) errors.push('Dai un nome alla tua casa.');
  if (!home.floors.length) errors.push('Aggiungi almeno un piano.');
  if (!home.rooms.length) errors.push('Aggiungi almeno una stanza.');
  if (home.floors.some(f => !f.name.trim())) errors.push('Ogni piano deve avere un nome.');
  if (home.rooms.some(r => !r.name.trim())) errors.push('Ogni stanza deve avere un nome.');
  if (!unique(home.floors.map(f => normalized(f.name)))) errors.push('Usa un nome diverso per ogni piano.');
  if (!unique(home.rooms.map(r => `${r.floorId}:${normalized(r.name)}`))) errors.push('Le stanze dello stesso piano devono avere nomi diversi.');
  if (home.rooms.some(r => !home.floors.some(f => f.id === r.floorId))) errors.push('Assegna ogni stanza a un piano esistente.');
  if ([...home.floors,...home.rooms,...home.devices,...home.groups].some(entity => !entity.id.trim())) errors.push('Ogni elemento deve avere un identificativo valido.');
  if (!unique(home.floors.map(f => f.id)) || !unique(home.rooms.map(r => r.id)) || !unique(home.devices.map(d => d.id)) || !unique(home.groups.map(g => g.id))) errors.push('La configurazione contiene identificativi duplicati.');
  return errors;
}

export function prepareHome(draft: Home, selectedIds: string[]): Home {
  const home = structuredClone(draft);
  home.name = home.name.trim();
  home.floors = home.floors.map(f => ({ ...f, name: f.name.trim(), label: f.label.trim() }));
  home.rooms = home.rooms.map(r => ({ ...r, name: r.name.trim() }));
  home.devices = home.devices.filter(d => selectedIds.includes(d.id));
  home.groups = home.groups.map(g => ({ ...g, deviceIds: [...new Set(g.deviceIds.filter(id => home.devices.some(d => d.id === id && d.roomId === g.roomId && d.controllable)))] }))
    .filter(g => home.rooms.some(r => r.id === g.roomId) && g.deviceIds.length > 0);
  return home;
}

export function validateConfiguration(home: Home): string[] {
  const errors = validateStructure(home);
  if (home.devices.some(d => !home.rooms.some(r => r.id === d.roomId))) errors.push('Assegna una stanza a ogni dispositivo incluso oppure escludilo per ora.');
  if (home.groups.some(g => !home.rooms.some(r => r.id === g.roomId) || !g.deviceIds.length || !unique(g.deviceIds) || g.deviceIds.some(id => !home.devices.some(d => d.id === id && d.roomId === g.roomId && d.controllable)))) errors.push('Controlla che i gruppi contengano solo dispositivi della loro stanza.');
  return errors;
}

// Validate persisted JSON before exposing it to the views. No credentials are stored.
export function isHome(value: unknown): value is Home {
  if (!value || typeof value !== 'object') return false;
  const h = value as Record<string, unknown>;
  const text = (x: unknown): x is string => typeof x === 'string';
  const list = (x: unknown): x is Record<string, unknown>[] => Array.isArray(x) && x.every(y => y && typeof y === 'object');
  return text(h['name']) && list(h['floors']) && h['floors'].every(f => text(f['id']) && text(f['name']) && text(f['label']))
    && list(h['rooms']) && h['rooms'].every(r => ['id','name','floorId','icon','description'].every(k => text(r[k])) && (r['temperature'] === null || text(r['temperature'])) && (r['humidity'] === null || (typeof r['humidity'] === 'number' && Number.isFinite(r['humidity']))))
    && list(h['devices']) && h['devices'].every(d => ['id','name','roomId','icon','detail'].every(k => text(d[k])) && ['Luci','Clima','Prese','Sensori'].includes(String(d['category'])) && ['on','controllable','online'].every(k => typeof d[k] === 'boolean'))
    && list(h['groups']) && h['groups'].every(g => ['id','name','roomId','icon','description'].every(k => text(g[k])) && Array.isArray(g['deviceIds']) && g['deviceIds'].every(text));
}

export function validateAddress(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (!['http:','https:'].includes(url.protocol) || !url.hostname || url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) return null;
    return url.origin;
  } catch { return null; }
}
