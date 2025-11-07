import { useState, useEffect, useCallback } from 'react';
import { Bin, TONS_PER_MINUTE, SystemSettings, ELEVATOR_SPEED_TONS_PER_HOUR, TONS_PER_FOOT } from '@/types/bin';
import { calculateBinMetrics, updateBinFillLevel, feetToTons, tonsToFeet } from '@/lib/calculations';

const DEFAULT_BIN_CAPACITY_FEET = 130; // Default capacity, can be adjusted

const getDefaultBins = (): Bin[] => [
  {
    id: 1,
    name: 'Bin 1',
    grainType: 'Wheat H2',
    isFilling: false,
    currentFillFeet: 0,
    currentFillTons: 0,
    maxCapacityFeet: DEFAULT_BIN_CAPACITY_FEET,
    maxCapacityTons: feetToTons(DEFAULT_BIN_CAPACITY_FEET),
    trailerCount: 0,
  },
  {
    id: 2,
    name: 'Bin 2',
    grainType: 'Wheat APH2',
    isFilling: false,
    currentFillFeet: 0,
    currentFillTons: 0,
    maxCapacityFeet: DEFAULT_BIN_CAPACITY_FEET,
    maxCapacityTons: feetToTons(DEFAULT_BIN_CAPACITY_FEET),
    trailerCount: 0,
  },
];

const loadBinsFromStorage = (): Bin[] => {
  if (typeof window === 'undefined') return getDefaultBins();
  
  try {
    const stored = localStorage.getItem('silo-bins');
    if (stored) {
      const parsedBins = JSON.parse(stored);
      // Check if old data with 50ft capacity exists
      const hasOldCapacity = parsedBins.some((bin: any) => bin.maxCapacityFeet === 50);
      if (hasOldCapacity) {
        console.log('Old capacity detected, clearing localStorage and using new defaults');
        localStorage.removeItem('silo-bins');
        return getDefaultBins();
      }
      // Convert date strings back to Date objects
      return parsedBins.map((bin: any) => ({
        ...bin,
        startTime: bin.startTime ? new Date(bin.startTime) : undefined,
      }));
    }
  } catch (error) {
    console.error('Error loading bins from localStorage:', error);
  }
  return getDefaultBins();
};

const saveBinsToStorage = (bins: Bin[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('silo-bins', JSON.stringify(bins));
  } catch (error) {
    console.error('Error saving bins to localStorage:', error);
  }
};

const getDefaultSystemSettings = (): SystemSettings => ({
  elevatorSpeed: ELEVATOR_SPEED_TONS_PER_HOUR,
  tonsPerFoot: TONS_PER_FOOT,
});

const loadSystemSettingsFromStorage = (): SystemSettings => {
  if (typeof window === 'undefined') return getDefaultSystemSettings();
  
  try {
    const stored = localStorage.getItem('silo-system-settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading system settings from localStorage:', error);
  }
  return getDefaultSystemSettings();
};

const saveSystemSettingsToStorage = (settings: SystemSettings) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('silo-system-settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving system settings to localStorage:', error);
  }
};

export function useBinManager() {
  const [bins, setBins] = useState<Bin[]>(() => loadBinsFromStorage());
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => loadSystemSettingsFromStorage());

  // Save to localStorage whenever bins change
  useEffect(() => {
    saveBinsToStorage(bins);
  }, [bins]);

  // Save to localStorage whenever system settings change
  useEffect(() => {
    saveSystemSettingsToStorage(systemSettings);
  }, [systemSettings]);

  // Update fill levels for active bins
  useEffect(() => {
    const interval = setInterval(() => {
      setBins((currentBins) => {
        // Check if any bin is currently filling
        const hasActiveFilling = currentBins.some(bin => bin.isFilling);
        console.log('Interval check - hasActiveFilling:', hasActiveFilling, 'bins:', currentBins.map(b => ({id: b.id, isFilling: b.isFilling})));
        if (!hasActiveFilling) return currentBins;
        
        return currentBins.map((bin) => {
          if (bin.isFilling) {
            // Incremental update: add only 1 second worth of filling using dynamic systemSettings
            const tonsPerMinute = systemSettings.elevatorSpeed / 60;
            const addedTons = tonsPerMinute / 60; // tons per second
            const addedFeet = tonsToFeet(addedTons);
            
            const newFillFeet = Math.min(bin.currentFillFeet + addedFeet, bin.maxCapacityFeet);
            const newFillTons = Math.min(bin.currentFillTons + addedTons, bin.maxCapacityTons);
            
            // Stop filling if bin is full
            if (newFillFeet >= bin.maxCapacityFeet) {
              return {
                ...bin,
                isFilling: false,
                currentFillFeet: bin.maxCapacityFeet,
                currentFillTons: bin.maxCapacityTons,
              };
            }
            
            return {
              ...bin,
              currentFillFeet: newFillFeet,
              currentFillTons: newFillTons,
            };
          }
          return bin;
        });
      });
    }, 1000); // Update every second for smooth real-time updates

    return () => clearInterval(interval);
  }, [systemSettings, tonsToFeet]);

  const startFilling = useCallback((binId: number) => {
    console.log('startFilling called for binId:', binId);
    setBins((currentBins) => {
      console.log('Current bins before start:', currentBins);
      const updatedBins = currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              isFilling: true,
              startTime: new Date(),
            }
          : bin
      );
      console.log('Updated bins after start:', updatedBins);
      return updatedBins;
    });
  }, []);

  const stopFilling = useCallback((binId: number) => {
    setBins((currentBins) =>
      currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              isFilling: false,
            }
          : bin
      )
    );
  }, []);

  const resetBin = useCallback((binId: number) => {
    setBins((currentBins) =>
      currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              isFilling: false,
              currentFillFeet: 0,
              currentFillTons: 0,
              startTime: undefined,
            }
          : bin
      )
    );
  }, []);

  const updateManualFill = useCallback((binId: number, feet: number) => {
    console.log('updateManualFill called with binId:', binId, 'feet:', feet);
    setBins((currentBins) => {
      const updatedBins = currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              currentFillFeet: Math.min(feet, bin.maxCapacityFeet),
              currentFillTons: Math.min(feetToTons(feet), bin.maxCapacityTons),
              isFilling: false,
              startTime: undefined,
            }
          : bin
      );
      console.log('Updated bins:', updatedBins);
      return updatedBins;
    });
  }, []);

  const getBinMetrics = useCallback((binId: number) => {
    const bin = bins.find((b) => b.id === binId);
    if (!bin) return null;
    return calculateBinMetrics(bin, systemSettings);
  }, [bins, systemSettings]);

  const getAllBinMetrics = useCallback(() => {
    return bins.map((bin) => ({
      bin,
      metrics: calculateBinMetrics(bin, systemSettings),
    }));
  }, [bins, systemSettings]);

  const updateSystemSettings = useCallback((newSettings: Partial<SystemSettings>) => {
    setSystemSettings((current) => ({
      ...current,
      ...newSettings,
    }));
  }, []);

  const addTruckLoad = useCallback((binId: number, trailers: number) => {
    const tonsPerTrailer = 30; // 30 tons per trailer
    const totalTons = trailers * tonsPerTrailer;
    const addedFeet = tonsToFeet(totalTons);
    
    setBins((currentBins) =>
      currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              currentFillFeet: Math.min(bin.currentFillFeet + addedFeet, bin.maxCapacityFeet),
              currentFillTons: Math.min(bin.currentFillTons + totalTons, bin.maxCapacityTons),
              trailerCount: bin.trailerCount + trailers,
              isFilling: false,
              startTime: undefined,
            }
          : bin
      )
    );
  }, []);

  const removeTruckLoad = useCallback((binId: number, trailers: number) => {
    const tonsPerTrailer = 30; // 30 tons per trailer
    const totalTons = trailers * tonsPerTrailer;
    const removedFeet = tonsToFeet(totalTons);
    
    setBins((currentBins) =>
      currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              currentFillFeet: Math.max(bin.currentFillFeet - removedFeet, 0),
              currentFillTons: Math.max(bin.currentFillTons - totalTons, 0),
              trailerCount: Math.max(bin.trailerCount - trailers, 0),
              isFilling: false,
              startTime: undefined,
            }
          : bin
      )
    );
  }, []);

  const resetTrailerCount = useCallback((binId: number) => {
    setBins((currentBins) =>
      currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              trailerCount: 0,
            }
          : bin
      )
    );
  }, []);

  const updateGrainType = useCallback((binId: number, grainType: string) => {
    setBins((currentBins) =>
      currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              grainType,
            }
          : bin
      )
    );
  }, []);

  return {
    bins,
    systemSettings,
    startFilling,
    stopFilling,
    resetBin,
    updateManualFill,
    getBinMetrics,
    getAllBinMetrics,
    updateSystemSettings,
    addTruckLoad,
    removeTruckLoad,
    resetTrailerCount,
    updateGrainType,
  };
}
