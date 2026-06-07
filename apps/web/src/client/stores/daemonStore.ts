import { create } from 'zustand';

export type DaemonStatus =
  | 'connected'
  | 'starting'
  | 'stopping'
  | 'stopped'
  | 'disconnected'
  | 'reconnecting'
  | 'reconnect-failed';

interface DaemonState {
  status: DaemonStatus;

  toastDismissed: boolean;
  setStatus: (status: DaemonStatus) => void;
  dismissToast: () => void;
}

export const useDaemonStore = create<DaemonState>((set) => ({
  status: 'connected',
  toastDismissed: false,
  setStatus: (status) => {
    set({
      status,

      ...(status === 'disconnected' || status === 'reconnect-failed'
        ? { toastDismissed: false }
        : {}),
    });
  },
  dismissToast: () => {
    set({ toastDismissed: true });
  },
}));

function registerDaemonSubscriptions(): void {
  if (typeof window === 'undefined' || !window.myboteam) {
    return;
  }

  const myboteam = window.myboteam;
  const { setStatus } = useDaemonStore.getState();

  myboteam.onDaemonDisconnected(() => {
    useDaemonStore.getState().setStatus('disconnected');
  });

  myboteam.onDaemonReconnected(() => {
    useDaemonStore.getState().setStatus('connected');
  });

  if (myboteam.onDaemonReconnectFailed) {
    myboteam.onDaemonReconnectFailed(() => {
      useDaemonStore.getState().setStatus('reconnect-failed');
    });
  }

  myboteam
    .daemonPing()
    .then((result) => {
      if (result.status === 'ok') {
        setStatus('connected');
      } else {
        setStatus('stopped');
      }
    })
    .catch(() => {
      setStatus('stopped');
    });
}

registerDaemonSubscriptions();
