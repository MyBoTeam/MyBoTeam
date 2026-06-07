import type { TaskContext, TaskErrorCategory } from './types';

export type { TaskContext, TaskErrorCategory };

export interface HardwareProperties {
  gpu_name?: string;
  gpu_architecture?: string;
  effective_vram_gb?: number;
  total_memory_gb?: number;
  unified_memory?: boolean;
  is_apple_silicon?: boolean;
  cpu_cores?: number;
  os_name?: string;
  system_name?: string;
  hardware_capability?: string;
  max_recommended_params_b?: number;
}
