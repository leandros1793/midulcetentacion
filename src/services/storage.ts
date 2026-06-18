/**
 * Generic localStorage service.
 * Swap `get`/`set` for Supabase/fetch calls to migrate to a real DB.
 */

function get<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function set<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getAll<T>(key: string): T[] {
  return get<T>(key);
}

export function getById<T extends { id: string }>(key: string, id: string): T | undefined {
  return get<T>(key).find((item) => item.id === id);
}

export function create<T extends { id: string }>(key: string, item: T): T {
  const items = get<T>(key);
  items.push(item);
  set(key, items);
  return item;
}

export function update<T extends { id: string }>(key: string, updated: T): T {
  const items = get<T>(key).map((item) => (item.id === updated.id ? updated : item));
  set(key, items);
  return updated;
}

export function remove<T extends { id: string }>(key: string, id: string): void {
  const items = get<T>(key).filter((item) => item.id !== id);
  set(key, items);
}

export function getByField<T>(key: string, field: keyof T, value: unknown): T[] {
  return get<T>(key).filter((item) => item[field] === value);
}
