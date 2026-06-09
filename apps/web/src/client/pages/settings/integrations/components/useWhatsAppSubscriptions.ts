import { useEffect } from 'react';
import type { WhatsAppCardState } from './useWhatsAppCard';

const QR_EXPIRY_SECONDS = 60;

interface UseWhatsAppSubscriptionsOptions {
  myboteam: {
    onWhatsAppQR: (cb: (qr: string) => void) => () => void;
    onWhatsAppStatus: (cb: (status: string) => void) => () => void;
    onWhatsAppSyncProgress: (
      cb: (data: {
        syncState?: 'idle' | 'syncing' | 'complete';
        chatsProcessed?: number;
        messagesProcessed?: number;
        totalChats?: number;
        totalMessages?: number;
      }) => void,
    ) => () => void;
  };
  qrTimerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  setQrCode: (qr: string | null) => void;
  setQrExpiresAt: (ts: number) => void;
  setError: (err: string | null) => void;
  setConnecting: (v: boolean) => void;
  setConfig: (fn: (prev: WhatsAppCardState['config']) => WhatsAppCardState['config']) => void;
  fetchConfig: () => Promise<void>;
  normalizeStatus: (status: string) => string;
  setSyncState: (s: 'idle' | 'syncing' | 'complete') => void;
  setSyncProgress: (p: {
    chatsProcessed: number;
    messagesProcessed: number;
    totalChats?: number;
    totalMessages?: number;
  }) => void;
}

export function useWhatsAppSubscriptions({
  myboteam,
  qrTimerRef,
  setQrCode,
  setQrExpiresAt,
  setError,
  setConnecting,
  setConfig,
  fetchConfig,
  normalizeStatus,
  setSyncState,
  setSyncProgress,
}: UseWhatsAppSubscriptionsOptions) {
  useEffect(() => {
    const clearTimers = () => {
      if (qrTimerRef.current) {
        clearInterval(qrTimerRef.current);
        qrTimerRef.current = null;
      }
    };

    const unsubQR = myboteam.onWhatsAppQR((qr: string) => {
      setQrCode(qr);
      setQrExpiresAt(Date.now() + QR_EXPIRY_SECONDS * 1000);
      setError(null);
      setConnecting(false);
      setConfig((prev) => (prev ? { ...prev, status: 'qr_ready' } : { status: 'qr_ready' }));
    });

    const unsubStatus = myboteam.onWhatsAppStatus((status: string) => {
      const nextStatus = normalizeStatus(status);
      setConfig((prev) => (prev ? { ...prev, status: nextStatus } : { status: nextStatus }));

      if (nextStatus === 'connected') {
        setQrCode(null);
        setConnecting(false);
        setError(null);
        clearTimers();
        void fetchConfig();
      }
      if (nextStatus === 'disconnected' || nextStatus === 'logged_out') {
        setQrCode(null);
        setConnecting(false);
        clearTimers();
      }
    });

    const unsubSyncProgress = myboteam.onWhatsAppSyncProgress(
      (data: {
        syncState?: 'idle' | 'syncing' | 'complete';
        chatsProcessed?: number;
        messagesProcessed?: number;
        totalChats?: number;
        totalMessages?: number;
      }) => {
        if (data.syncState) setSyncState(data.syncState);
        if (data.chatsProcessed !== undefined) {
          setSyncProgress({
            chatsProcessed: data.chatsProcessed,
            messagesProcessed: data.messagesProcessed ?? 0,
            totalChats: data.totalChats,
            totalMessages: data.totalMessages,
          });
        }
      },
    );

    return () => {
      unsubQR();
      unsubStatus();
      unsubSyncProgress();
    };
  }, [
    myboteam,
    fetchConfig,
    normalizeStatus,
    qrTimerRef,
    setQrCode,
    setQrExpiresAt,
    setError,
    setConnecting,
    setConfig,
    setSyncState,
    setSyncProgress,
  ]);
}
