export type Category = 'Luci' | 'Clima' | 'Prese' | 'Sensori';
export interface Device { id: string; name: string; roomId: string; category: Category; icon: string; detail: string; on: boolean; controllable: boolean; online: boolean; }
export interface Room { id: string; name: string; floorId: string; icon: string; temperature: string | null; humidity: number | null; description: string; }
export interface Floor { id: string; name: string; label: string; }
export interface DeviceGroup { id: string; roomId: string; name: string; description: string; icon: string; deviceIds: string[]; }
export interface Home { name: string; floors: Floor[]; rooms: Room[]; devices: Device[]; groups: DeviceGroup[]; }
export interface ConnectionResult { name: string; address: string; mode: 'demo'; }
export interface DiscoveryResult { home: Home; connection: ConnectionResult; }
export interface HouseConfiguration { version: 1; home: Home; connection: ConnectionResult | null; source: 'import' | 'manual'; savedAt: string; }
