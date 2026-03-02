import { Preferences } from '@capacitor/preferences';

const isTauri = typeof window !== 'undefined' && (!!(window as any).__TAURI_INTERNALS__ || !!(window as any).__TAURI__);

// We keep a *promise* that resolves once the store is ready.
// Every operation awaits this promise, so we never race against initialization.
let tauriStorePromise: Promise<any> | null = null;

function getTauriStore(): Promise<any> {
  if (!tauriStorePromise) {
    tauriStorePromise = import('@tauri-apps/plugin-store')
      .then(({ load }) => load('twilight_session.bin', { autoSave: true, defaults: {} }))
      .catch(e => {
        console.error('Failed to init Tauri store', e);
        tauriStorePromise = null; // allow retry
        return null;
      });
  }
  return tauriStorePromise;
}

export const CapacitorStorage = {
  async getItem(key: string): Promise<string | null> {
    if (isTauri) {
      const store = await getTauriStore();
      if (!store) return localStorage.getItem(key); // fallback
      const val = await store.get(key);
      return val ? String(val) : null;
    }
    const { value } = await Preferences.get({ key });
    return value;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (isTauri) {
      const store = await getTauriStore();
      if (!store) { localStorage.setItem(key, value); return; } // fallback
      await store.set(key, value);
      return;
    }
    await Preferences.set({ key, value });
  },
  async removeItem(key: string): Promise<void> {
    if (isTauri) {
      const store = await getTauriStore();
      if (!store) { localStorage.removeItem(key); return; } // fallback
      await store.delete(key);
      return;
    }
    await Preferences.remove({ key });
  },
};
