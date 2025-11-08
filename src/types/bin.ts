export interface ActivityLog {
  id: string;
  timestamp: Date;
  action: 'start_filling' | 'stop_filling' | 'reset' | 'manual_fill' | 'truck_load' | 'truck_remove' | 'trailer_reset' | 'wagon_load' | 'wagon_remove' | 'wagon_reset' | 'grain_change';
  details: string;
  oldValue?: number;
  newValue?: number;
  unit?: string;
}

export interface Bin {
  id: number;
  name: string;
  grainType: string;
  isFilling: boolean;
  currentFillFeet: number;
  currentFillTons: number;
  maxCapacityFeet: number;
  maxCapacityTons: number;
  trailerCount: number;
  wagonCount: number;
  startTime?: Date;
  activityLogs: ActivityLog[];
}

export interface BinMetrics {
  fillPercentage: number;
  tonsPerMinute: number;
  feetPerMinute: number;
  elapsedTime: string;
  estimatedTimeToFull: string;
  remainingCapacityTons: number;
  remainingCapacityFeet: number;
  estimatedTrailersToFull: number;
  estimatedWagonsToFull: number;
}

export interface SystemSettings {
  elevatorSpeed: number; // tons per hour
  tonsPerFoot: number; // tons per foot
  tonsPerTrailer: number; // tons per trailer
  tonsPerWagon: number; // tons per wagon
}

export const ELEVATOR_SPEED_TONS_PER_HOUR = 180;
export const TONS_PER_FOOT = 25;
export const TONS_PER_MINUTE = ELEVATOR_SPEED_TONS_PER_HOUR / 60;
export const FEET_PER_MINUTE = TONS_PER_MINUTE / TONS_PER_FOOT;
