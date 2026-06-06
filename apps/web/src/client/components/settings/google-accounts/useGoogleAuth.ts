import { useEffect, useRef, useState } from 'react';
import { useGoogleAccountStore } from '@/stores/googleAccountStore';

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 15;

export function useGoogleAuth() {
  const { accounts, fetchAccounts, authError, clearAuthError } = useGoogleAccountStore();
  const [connecting, setConnecting] = useState(false);
  const [reconnectId, setReconnectId] = useState<string | null>(null);
  const [pendingAuthState, setPendingAuthState] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCancelRef = useRef<boolean>(false);

  useEffect(() => {
    if (!authError) {
      return;
    }
    pollCancelRef.current = true;
    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setConnecting(false);
    setPendingAuthState(null);
    setReconnectId(null);
  }, [authError]);

  const openAuth = async (
    label: string,
    onComplete?: () => void,
    accountId?: string,
  ): Promise<void> => {
    setConnecting(true);
    try {
      const result = await window.myboteam?.gws?.startAuth(label);
      if (result?.authUrl && result.authUrl.length > 0) {
        if (window.myboteam?.openExternal) {
          await window.myboteam.openExternal(result.authUrl);
        } else {
          window.open(result.authUrl, '_blank');
        }

        setPendingAuthState(result.state);

        const knownIds = new Set(accounts.map((a) => a.googleAccountId));
        const targetAccountId = accountId || reconnectId;
        let attempts = 0;
        pollCancelRef.current = false;
        const poll = async (): Promise<void> => {
          attempts++;
          try {
            await fetchAccounts();
          } catch (_error) {
            if (pollCancelRef.current) {
              return;
            }
          }

          if (pollCancelRef.current) {
            return;
          }

          const current = useGoogleAccountStore.getState().accounts;

          const hasNewAccount = current.some((a) => !knownIds.has(a.googleAccountId));

          let reconnectComplete = false;
          if (targetAccountId) {
            const targetAccount = current.find((a) => a.googleAccountId === targetAccountId);
            if (targetAccount?.status === 'connected') {
              reconnectComplete = true;
            }
          }

          if (hasNewAccount || reconnectComplete || attempts >= POLL_MAX_ATTEMPTS) {
            if (pollTimerRef.current !== null) {
              clearTimeout(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            setPendingAuthState(null);
            setConnecting(false);
            onComplete?.();
            return;
          }

          if (pollCancelRef.current) {
            return;
          }

          pollTimerRef.current = setTimeout(() => void poll(), POLL_INTERVAL_MS);
        };
        pollTimerRef.current = setTimeout(() => void poll(), POLL_INTERVAL_MS);
      } else {
        setConnecting(false);
        onComplete?.();
      }
    } catch {
      setConnecting(false);
      onComplete?.();
    }
  };

  const cancelConnecting = async () => {
    pollCancelRef.current = true;
    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (pendingAuthState) {
      await window.myboteam?.gws?.cancelAuth(pendingAuthState);
    }
    setReconnectId(null);
    setPendingAuthState(null);
    setConnecting(false);
  };

  return {
    connecting,
    setConnecting,
    reconnectId,
    setReconnectId,
    pendingAuthState,
    openAuth,
    cancelConnecting,
  };
}
