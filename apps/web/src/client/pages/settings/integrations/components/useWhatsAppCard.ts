import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMyBoTeam } from '@/config/myboteam';
import { useWhatsAppSubscriptions } from './useWhatsAppSubscriptions';

const VALID_STATUSES = new Set([
  'connecting',
  'qr_ready',
  'connected',
  'disconnected',
  'logged_out',
  'reconnecting',
]);

function normalizeStatus(status: string): string {
  return VALID_STATUSES.has(status) ? status : 'disconnected';
}

export interface WhatsAppCardState {
  config: { status: string; phoneNumber?: string; lastConnectedAt?: number } | null;
  loading: boolean;
  connecting: boolean;
  disconnecting: boolean;
  confirmDisconnect: boolean;
  error: string | null;
  qrCode: string | null;
  qrExpiresAt: number;
  syncState: 'idle' | 'syncing' | 'complete';
  syncProgress: {
    chatsProcessed: number;
    messagesProcessed: number;
    totalChats?: number;
    totalMessages?: number;
  };
}

export interface WhatsAppCardActions {
  handleConnect(): Promise<void>;
  handleDisconnect(): Promise<void>;
  handleResync(): Promise<void>;
  setQrCode(qr: string | null): void;
}

export function useWhatsAppCard(): WhatsAppCardState & WhatsAppCardActions {
  const myboteam = useMemo(() => getMyBoTeam(), []);

  const [config, setConfig] = useState<WhatsAppCardState['config']>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<number>(0);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'complete'>('idle');
  const [syncProgress, setSyncProgress] = useState<{
    chatsProcessed: number;
    messagesProcessed: number;
    totalChats?: number;
    totalMessages?: number;
  }>({ chatsProcessed: 0, messagesProcessed: 0 });
  const qrTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!confirmDisconnect) {
      return;
    }
    const timer = setTimeout(() => setConfirmDisconnect(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmDisconnect]);

  useEffect(() => {
    return () => {
      if (qrTimerRef.current) {
        clearInterval(qrTimerRef.current);
      }
    };
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const result = await myboteam.getWhatsAppConfig();
      if (result?.enabled) {
        const status = normalizeStatus(result.status);
        setConfig({
          status,
          phoneNumber: result.phoneNumber,
          lastConnectedAt: result.lastConnectedAt,
        });

        if (result.syncState) setSyncState(result.syncState);
        if (result.syncProgress) setSyncProgress(result.syncProgress);
      } else {
        setConfig(null);
      }
    } catch {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, [myboteam]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useWhatsAppSubscriptions({
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
  });

  const handleResync = useCallback(async () => {
    setError(null);
    try {
      await myboteam.resyncWhatsApp();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to re-sync');
    }
  }, [myboteam]);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    setQrCode(null);
    try {
      await myboteam.connectWhatsApp();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setConnecting(false);
    }
  }, [myboteam]);

  const handleDisconnect = useCallback(async () => {
    if (!confirmDisconnect) {
      setConfirmDisconnect(true);
      return;
    }
    setDisconnecting(true);
    setConfirmDisconnect(false);
    try {
      await myboteam.disconnectWhatsApp();
      setConfig(null);
      setQrCode(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  }, [confirmDisconnect, myboteam]);

  return {
    config,
    loading,
    connecting,
    disconnecting,
    confirmDisconnect,
    error,
    qrCode,
    qrExpiresAt,
    syncState,
    syncProgress,
    handleConnect,
    handleDisconnect,
    handleResync,
    setQrCode,
  };
}
