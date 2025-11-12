export interface ActivityLog {
  id: string;
  timestamp: Date;
  action: 'start_filling' | 'stop_filling' | 'reset' | 'manual_fill' | 'truck_load' | 'truck_remove' | 'trailer_reset' | 'grain_change' | 'wagon_load' | 'wagon_remove' | 'wagon_reset' | 'manual_inload' | 'manual_outload';
  details: string;
  oldValue?: number;
  newValue?: number;
  unit?: string;
}

export interface Note {
  id: string;
  binId: number;
  title: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
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
  lastUpdateTime?: Date; // Track when the bin was last updated for persistent timing
  totalElapsedMinutes?: number; // Accumulated elapsed time for persistent timing
  activityLogs: ActivityLog[];
  notes: Note[];
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
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  enabled: boolean;
  thresholdFeet: number; // Default 10 feet
  soundEnabled: boolean;
  requireInteraction: boolean; // Keep notification visible until clicked
  cooldownMinutes: number; // Prevent spam notifications
}

export const ELEVATOR_SPEED_TONS_PER_HOUR = 180;
export const TONS_PER_FOOT = 25;
export const TONS_PER_MINUTE = ELEVATOR_SPEED_TONS_PER_HOUR / 60;
export const FEET_PER_MINUTE = TONS_PER_MINUTE / TONS_PER_FOOT;
