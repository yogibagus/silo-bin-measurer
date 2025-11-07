export interface Bin {
  id: number;
  name: string;
  grainType: string;
  isFilling: boolean;
  currentFillFeet: number;
  currentFillTons: number;
  maxCapacityFeet: number;
  maxCapacityTons: number;
  startTime?: Date;
  trailerCount: number;
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
}

export interface SystemSettings {
  elevatorSpeed: number; // tons per hour
  tonsPerFoot: number;
}

export const ELEVATOR_SPEED_TONS_PER_HOUR = 180;
export const TONS_PER_FOOT = 25;
export const TONS_PER_MINUTE = ELEVATOR_SPEED_TONS_PER_HOUR / 60;
export const FEET_PER_MINUTE = TONS_PER_MINUTE / TONS_PER_FOOT;
