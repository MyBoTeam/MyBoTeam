import type { GoogleAccount, GoogleAccountStatus } from '@myboteam/agent-core/common';
import { create } from 'zustand';
import { createLogger } from '../lib/logger';

const logger = createLogger('GoogleAccountStore');

interface GoogleAccountStore {
  accounts: GoogleAccount[];
  loading: boolean;
  error: string | null;

  authError: string | null;
  _requestToken: symbol | null;
  fetchAccounts: () => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  updateLabel: (id: string, label: string) => Promise<void>;
  handleStatusChange: (id: string, status: GoogleAccountStatus) => void;
  setAuthError: (message: string | null) => void;
  clearAuthError: () => void;
}

export const useGoogleAccountStore = create<GoogleAccountStore>((set) => ({
  accounts: [],
  loading: false,
  error: null,
  authError: null,
  _requestToken: null,

  fetchAccounts: async () => {
    const token = Symbol();
    set({ loading: true, _requestToken: token });
    try {
      const accounts = await window.myboteam?.gws?.listAccounts();
      if (!accounts) {
        set((state) => (state._requestToken === token ? { loading: false, accounts: [] } : {}));
        return;
      }
      set((state) => (state._requestToken === token ? { accounts, loading: false } : {}));
    } catch (err) {
      logger.error('Failed to fetch Google accounts:', err);
      set((state) => (state._requestToken === token ? { loading: false, error: String(err) } : {}));
    }
  },

  removeAccount: async (id: string) => {
    try {
      await window.myboteam?.gws?.removeAccount(id);
      set((state) => ({
        accounts: state.accounts.filter((a) => a.googleAccountId !== id),
      }));
    } catch (err) {
      logger.error('Failed to remove Google account:', err);
      set({ error: String(err) });
    }
  },

  updateLabel: async (id: string, label: string) => {
    try {
      await window.myboteam?.gws?.updateLabel(id, label);
      set((state) => ({
        accounts: state.accounts.map((a) => (a.googleAccountId === id ? { ...a, label } : a)),
      }));
    } catch (err) {
      logger.error('Failed to update Google account label:', err);
      set({ error: String(err) });
    }
  },

  handleStatusChange: (id: string, status: GoogleAccountStatus) => {
    set((state) => ({
      accounts: state.accounts.map((a) => (a.googleAccountId === id ? { ...a, status } : a)),
    }));
  },

  setAuthError: (message: string | null) => {
    set({ authError: message });
  },

  clearAuthError: () => {
    set({ authError: null });
  },
}));

let _gwsStatusUnsubscribe: (() => void) | null = null;
let _gwsAuthErrorUnsubscribe: (() => void) | null = null;

export function initGoogleAccountListener(): () => void {
  if (_gwsStatusUnsubscribe) {
    _gwsStatusUnsubscribe();
  }
  if (_gwsAuthErrorUnsubscribe) {
    _gwsAuthErrorUnsubscribe();
  }

  const unsubscribeStatus = window.myboteam?.gws?.onStatusChanged((id, status) => {
    useGoogleAccountStore.getState().handleStatusChange(id, status as GoogleAccountStatus);
  });

  const unsubscribeAuthError = window.myboteam?.gws?.onAuthError(({ message }) => {
    logger.warn('Google account auth error:', message);
    useGoogleAccountStore.getState().setAuthError(message);
  });

  _gwsStatusUnsubscribe = unsubscribeStatus ?? null;
  _gwsAuthErrorUnsubscribe = unsubscribeAuthError ?? null;

  return () => {
    if (_gwsStatusUnsubscribe) {
      _gwsStatusUnsubscribe();
      _gwsStatusUnsubscribe = null;
    }
    if (_gwsAuthErrorUnsubscribe) {
      _gwsAuthErrorUnsubscribe();
      _gwsAuthErrorUnsubscribe = null;
    }
  };
}
