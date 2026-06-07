import Store from 'electron-store';

const CHECK_INTERVAL_MS = 1 * 24 * 60 * 60 * 1000;

let store: Store<{ lastUpdateCheck: number }> | null = null;

function getStore(): Store<{ lastUpdateCheck: number }> {
  if (!store) {
    store = new Store<{ lastUpdateCheck: number }>({
      name: 'updater',
      defaults: { lastUpdateCheck: 0 },
    });
  }
  return store;
}

export function shouldAutoCheck(): boolean {
  const lastCheck = getStore().get('lastUpdateCheck');
  if (!lastCheck) {
    return true;
  }
  return Date.now() - lastCheck > CHECK_INTERVAL_MS;
}

export function recordCheckedNow(): void {
  getStore().set('lastUpdateCheck', Date.now());
}
