import type { HardwareProperties } from './event-types';

let cachedHardwareProps: HardwareProperties | null = null;

export function setHardwareProperties(props: HardwareProperties): void {
  cachedHardwareProps = props;
}

export function getHardwareProperties(): HardwareProperties | null {
  return cachedHardwareProps;
}
