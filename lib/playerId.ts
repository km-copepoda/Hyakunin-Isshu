const PLAYER_ID_KEY = 'hyakunin:playerId';
const NAME_KEY = 'hyakunin:name';

export function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = window.crypto.randomUUID();
    window.localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getStoredName(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(NAME_KEY) ?? '';
}

export function setStoredName(name: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NAME_KEY, name);
}
