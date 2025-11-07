import { Bin, BinMetrics, TONS_PER_FOOT, SystemSettings } from '@/types/bin';

export function feetToTons(feet: number): number {
  return feet * TONS_PER_FOOT;
}

export function tonsToFeet(tons: number): number {
  return tons / TONS_PER_FOOT;
}

export function calculateFillPercentage(currentFill: number, maxCapacity: number): number {
  if (maxCapacity === 0) return 0;
  return Math.min((currentFill / maxCapacity) * 100, 100);
}

export function formatTime(minutes: number): string {
  const totalSeconds = Math.round(minutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const remainingSeconds = totalSeconds % 3600;
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  } else if (mins > 0) {
    return `${mins}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function calculateElapsedTime(startTime: Date): string {
  const now = new Date();
  const elapsedMs = now.getTime() - startTime.getTime();
  const elapsedMinutes = elapsedMs / (1000 * 60);
  return formatTime(elapsedMinutes);
}

export function calculateEstimatedTimeToFull(bin: Bin, systemSettings: SystemSettings): string {
  if (bin.currentFillFeet >= bin.maxCapacityFeet) {
    return 'Full';
  }
  
  const remainingFeet = bin.maxCapacityFeet - bin.currentFillFeet;
  const feetPerMinute = systemSettings.elevatorSpeed / 60 / systemSettings.tonsPerFoot;
  const remainingMinutes = remainingFeet / feetPerMinute;
  
  return formatTime(remainingMinutes);
}

export function calculateEstimatedTrailersToFull(bin: Bin): number {
  const remainingCapacityTons = bin.maxCapacityTons - bin.currentFillTons;
  const tonsPerTrailer = 30; // 30 tons per trailer
  return Math.ceil(remainingCapacityTons / tonsPerTrailer);
}

export function calculateBinMetrics(bin: Bin, systemSettings: SystemSettings): BinMetrics {
  const fillPercentage = calculateFillPercentage(bin.currentFillFeet, bin.maxCapacityFeet);
  const elapsedTime = (bin.isFilling && bin.startTime) ? calculateElapsedTime(bin.startTime) : '0s';
  const estimatedTimeToFull = calculateEstimatedTimeToFull(bin, systemSettings);
  const remainingCapacityTons = bin.maxCapacityTons - bin.currentFillTons;
  const remainingCapacityFeet = bin.maxCapacityFeet - bin.currentFillFeet;
  const estimatedTrailersToFull = calculateEstimatedTrailersToFull(bin);
  
  const tonsPerMinute = systemSettings.elevatorSpeed / 60;
  const feetPerMinute = tonsPerMinute / systemSettings.tonsPerFoot;

  return {
    fillPercentage,
    tonsPerMinute,
    feetPerMinute,
    elapsedTime,
    estimatedTimeToFull,
    remainingCapacityTons,
    remainingCapacityFeet,
    estimatedTrailersToFull,
  };
}

export function updateBinFillLevel(bin: Bin, startTime: Date, systemSettings: SystemSettings): Bin {
  if (!bin.isFilling) return bin;
  
  const now = new Date();
  const elapsedMs = now.getTime() - startTime.getTime();
  const elapsedMinutes = elapsedMs / (1000 * 60);
  
  const tonsPerMinute = systemSettings.elevatorSpeed / 60;
  const addedTons = elapsedMinutes * tonsPerMinute;
  const addedFeet = tonsToFeet(addedTons);
  
  const newFillFeet = Math.min(bin.currentFillFeet + addedFeet, bin.maxCapacityFeet);
  const newFillTons = Math.min(bin.currentFillTons + addedTons, bin.maxCapacityTons);
  
  return {
    ...bin,
    currentFillFeet: newFillFeet,
    currentFillTons: newFillTons,
  };
}
