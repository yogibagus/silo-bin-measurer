import { useState, useEffect, useCallback } from 'react';
import { Bin, ActivityLog, TONS_PER_MINUTE, SystemSettings, ELEVATOR_SPEED_TONS_PER_HOUR, TONS_PER_FOOT } from '@/types/bin';
import { calculateBinMetrics, updateBinFillLevel, feetToTons, tonsToFeet } from '@/lib/calculations';
import { fetchBins, updateBins, fetchSystemSettings, updateSystemSettings as updateSystemSettingsAPI } from '@/lib/api';
import { useNotifications } from './useNotifications';

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
    wagonCount: 0,
    activityLogs: [],
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
    wagonCount: 0,
    activityLogs: [],
  },
];

const getDefaultSystemSettings = (): SystemSettings => ({
  elevatorSpeed: ELEVATOR_SPEED_TONS_PER_HOUR,
  tonsPerFoot: TONS_PER_FOOT,
  tonsPerTrailer: 30, // Default 30 tons per trailer
  tonsPerWagon: 50, // Default 50 tons per wagon
  notifications: {
    enabled: true,
    thresholdFeet: 10,
    soundEnabled: true,
    requireInteraction: true,
    cooldownMinutes: 30,
  },
});

export function useBinManager() {
  const [bins, setBins] = useState<Bin[]>(getDefaultBins());
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(getDefaultSystemSettings());
  const [isLoading, setIsLoading] = useState(true);
  const { 
    checkThresholdNotification,
    checkThresholdNotificationAnyState,
    checkPeriodicNotification,
  } = useNotifications();

  // Helper function to add activity log
  const addActivityLog = useCallback((binId: number, action: ActivityLog['action'], details: string, oldValue?: number, newValue?: number, unit?: string) => {
    const newLog: ActivityLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      action,
      details,
      oldValue,
      newValue,
      unit,
    };

    setBins((currentBins) =>
      currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              activityLogs: [newLog, ...(bin.activityLogs || [])].slice(0, 50), // Keep only last 50 logs
            }
          : bin
      )
    );
  }, []);

  // Load data from MongoDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load bins and system settings in parallel
        const [loadedBins, loadedSettings] = await Promise.all([
          fetchBins(),
          fetchSystemSettings()
        ]);
        
        if (loadedBins.length > 0) {
          // Convert date strings back to Date objects if they exist
          const binsWithDates = loadedBins.map((bin: any) => ({
            ...bin,
            startTime: bin.startTime ? new Date(bin.startTime) : undefined,
            lastUpdateTime: bin.lastUpdateTime ? new Date(bin.lastUpdateTime) : undefined,
            activityLogs: bin.activityLogs || [], // Ensure activityLogs is always an array
          }));
          setBins(binsWithDates);
        } else {
          // If no bins exist, save default bins to MongoDB
          await updateBins(getDefaultBins());
        }
        
        setSystemSettings({
          ...loadedSettings,
          notifications: {
            enabled: true,
            thresholdFeet: 10,
            soundEnabled: true,
            requireInteraction: true,
            cooldownMinutes: 30,
            ...(loadedSettings as any).notifications,
          },
        });
      } catch (error) {
        console.error('Error loading data from MongoDB:', error);
        // Fallback to defaults
        setBins(getDefaultBins());
        setSystemSettings(getDefaultSystemSettings());
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save to MongoDB whenever bins change (but not during loading)
  useEffect(() => {
    if (!isLoading) {
      updateBins(bins).catch(error => {
        console.error('Error saving bins to MongoDB:', error);
      });
    }
  }, [bins, isLoading]);

  // Save to MongoDB whenever system settings change (but not during loading)
  useEffect(() => {
    if (!isLoading) {
      updateSystemSettingsAPI(systemSettings).catch(error => {
        console.error('Error saving system settings to MongoDB:', error);
      });
    }
  }, [systemSettings, isLoading]);

  // Local state for real-time updates (without triggering API saves)
  const [localBins, setLocalBins] = useState<Bin[]>([]);

  // Sync local bins with actual bins when bins change
  useEffect(() => {
    if (!isLoading) {
      setLocalBins(bins);
    }
  }, [bins, isLoading]);

  // Update fill levels for active bins locally (every second for UI)
  useEffect(() => {
    if (isLoading) return;
    
    const interval = setInterval(() => {
      setLocalBins((currentLocalBins) => {
        // Check if any bin is currently filling
        const hasActiveFilling = currentLocalBins.some(bin => bin.isFilling);
        if (!hasActiveFilling) return currentLocalBins;
        
        return currentLocalBins.map((bin) => {
          if (bin.isFilling) {
            const now = new Date();
            
            // Calculate elapsed time since last update
            let elapsedMinutes = 0;
            if (bin.lastUpdateTime && bin.totalElapsedMinutes !== undefined) {
              // Use persistent timing
              elapsedMinutes = (now.getTime() - bin.lastUpdateTime.getTime()) / (1000 * 60);
            } else if (bin.startTime) {
              // Fallback to start time
              elapsedMinutes = (now.getTime() - bin.startTime.getTime()) / (1000 * 60);
            }
            
            // Calculate how much should have been added since last update
            const tonsPerMinute = systemSettings.elevatorSpeed / 60;
            const addedTons = elapsedMinutes * tonsPerMinute;
            const addedFeet = tonsToFeet(addedTons);
            
            // Calculate target fill levels
            const targetFillFeet = Math.min(bin.currentFillFeet + addedFeet, bin.maxCapacityFeet);
            const targetFillTons = Math.min(bin.currentFillTons + addedTons, bin.maxCapacityTons);
            
            // Update persistent timing data
            const newTotalElapsedMinutes = (bin.totalElapsedMinutes || 0) + elapsedMinutes;
            
            const updatedBin = {
              ...bin,
              currentFillFeet: targetFillFeet,
              currentFillTons: targetFillTons,
              lastUpdateTime: now,
              totalElapsedMinutes: newTotalElapsedMinutes,
            };
            
            // Check threshold notification for this bin
            checkThresholdNotification(updatedBin, systemSettings);
            
            // Check periodic notification for this bin
            checkPeriodicNotification(updatedBin, systemSettings);
            
            // Stop filling if bin is full
            if (targetFillFeet >= bin.maxCapacityFeet) {
              return {
                ...updatedBin,
                isFilling: false,
                currentFillFeet: bin.maxCapacityFeet,
                currentFillTons: bin.maxCapacityTons,
              };
            }
            
            return updatedBin;
          }
          return bin;
        });
      });
    }, 1000); // Update every second for real-time display

    return () => clearInterval(interval);
  }, [systemSettings, isLoading, tonsToFeet, checkThresholdNotification, checkPeriodicNotification]);

  // Sync local bins to actual bins every 5 seconds (for persistence)
  useEffect(() => {
    if (isLoading) return;
    
    const interval = setInterval(() => {
      setBins((currentBins) => {
        // Check if any bin is currently filling
        const hasActiveFilling = currentBins.some(bin => bin.isFilling);
        if (!hasActiveFilling) return currentBins;
        
        // Sync with local state
        return localBins.map((localBin) => {
          const currentBin = currentBins.find(b => b.id === localBin.id);
          if (currentBin && currentBin.isFilling) {
            return localBin; // Use local state for filling bins
          }
          return currentBin || localBin; // Use current state for non-filling bins
        });
      });
    }, 5000); // Sync every 5 seconds

    return () => clearInterval(interval);
  }, [isLoading, localBins]);

  const startFilling = useCallback((binId: number) => {
    const now = new Date();
    setBins((currentBins) => {
      const updatedBins = currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              isFilling: true,
              startTime: now,
              lastUpdateTime: now,
              totalElapsedMinutes: 0,
            }
          : bin
      );
      return updatedBins;
    });
    
    // Add activity log
    addActivityLog(binId, 'start_filling', 'Started filling bin');
    
    // Check threshold notification immediately after starting
    setTimeout(() => {
      setBins((currentBins) => {
        const targetBin = currentBins.find(b => b.id === binId);
        if (targetBin) {
          checkThresholdNotificationAnyState(targetBin, systemSettings);
        }
        return currentBins;
      });
    }, 100);
  }, [addActivityLog, checkThresholdNotificationAnyState, systemSettings]);

  const stopFilling = useCallback((binId: number) => {
    // Get the current local bin state to preserve the updated fill levels
    setLocalBins((currentLocalBins) => {
      const localBin = currentLocalBins.find(b => b.id === binId);
      if (!localBin) return currentLocalBins;
      
      // Update the actual bins with the current values from localBins
      setBins((currentBins) =>
        currentBins.map((bin) =>
          bin.id === binId
            ? {
                ...bin,
                isFilling: false,
                currentFillFeet: localBin.currentFillFeet,
                currentFillTons: localBin.currentFillTons,
                lastUpdateTime: localBin.lastUpdateTime,
                totalElapsedMinutes: localBin.totalElapsedMinutes,
              }
            : bin
        )
      );
      
      return currentLocalBins;
    });
    
    // Add activity log
    addActivityLog(binId, 'stop_filling', 'Stopped filling bin');
    
    // Force immediate state update to prevent race condition
    setTimeout(() => {
      setBins((currentBins) => {
        const targetBin = currentBins.find(b => b.id === binId);
        if (targetBin && targetBin.isFilling) {
          return currentBins.map((bin) =>
            bin.id === binId
              ? {
                  ...bin,
                  isFilling: false,
                }
              : bin
          );
        }
        return currentBins;
      });
    }, 100);
  }, [addActivityLog, checkThresholdNotificationAnyState, systemSettings, tonsToFeet]);

  const resetBin = useCallback((binId: number) => {
    // Update both localBins and bins to ensure consistency
    setLocalBins((currentLocalBins) =>
      currentLocalBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              isFilling: false,
              currentFillFeet: 0,
              currentFillTons: 0,
              startTime: undefined,
              lastUpdateTime: undefined,
              totalElapsedMinutes: 0,
            }
          : bin
      )
    );
    
    setBins((currentBins) =>
      currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              isFilling: false,
              currentFillFeet: 0,
              currentFillTons: 0,
              startTime: undefined,
              lastUpdateTime: undefined,
              totalElapsedMinutes: 0,
            }
          : bin
      )
    );
    
    // Add activity log
    addActivityLog(binId, 'reset', 'Reset bin to empty');
    
    // Force immediate state update to prevent race condition
    setTimeout(() => {
      setBins((currentBins) => {
        const targetBin = currentBins.find(b => b.id === binId);
        if (targetBin && (targetBin.isFilling || targetBin.currentFillFeet !== 0 || targetBin.currentFillTons !== 0)) {
          return currentBins.map((bin) =>
            bin.id === binId
              ? {
                  ...bin,
                  isFilling: false,
                  currentFillFeet: 0,
                  currentFillTons: 0,
                  startTime: undefined,
                  lastUpdateTime: undefined,
                  totalElapsedMinutes: 0,
                }
              : bin
          );
        }
        return currentBins;
      });
    }, 100);
  }, [addActivityLog, checkThresholdNotificationAnyState, systemSettings, tonsToFeet]);

  const updateManualFill = useCallback((binId: number, remainingFeet: number) => {
    setBins((currentBins) => {
      const targetBin = currentBins.find(bin => bin.id === binId);
      const oldFillTons = targetBin?.currentFillTons || 0;
      
      const updatedBins = currentBins.map((bin) => {
        if (bin.id === binId) {
          const currentFillFeet = Math.max(0, bin.maxCapacityFeet - remainingFeet);
          const currentFillTons = feetToTons(currentFillFeet);
          
          return {
              ...bin,
              currentFillFeet: Math.min(currentFillFeet, bin.maxCapacityFeet),
              currentFillTons: Math.min(currentFillTons, bin.maxCapacityTons),
              isFilling: false,
              startTime: undefined,
            };
        }
        return bin;
      });
      
      // Add activity log after getting the new values
      const updatedBin = updatedBins.find(b => b.id === binId);
      if (updatedBin && targetBin) {
        addActivityLog(binId, 'manual_fill', `Updated remaining capacity to ${remainingFeet.toFixed(1)} ft`, oldFillTons, updatedBin.currentFillTons, 'tons');
        
        // Check threshold notification after manual fill
        checkThresholdNotificationAnyState(updatedBin, systemSettings);
      }
      
      return updatedBins;
    });
  }, [addActivityLog, checkThresholdNotificationAnyState, systemSettings, feetToTons]);

  const getBinMetrics = useCallback((binId: number) => {
    // Use localBins for real-time data, fallback to bins for non-filling bins
    const localBin = localBins.find((b) => b.id === binId);
    const bin = bins.find((b) => b.id === binId);
    const activeBin = localBin || bin;
    if (!activeBin) return null;
    return calculateBinMetrics(activeBin, systemSettings);
  }, [bins, localBins, systemSettings]);

  const getAllBinMetrics = useCallback(() => {
    // Use localBins for real-time data, fallback to bins for non-filling bins
    return localBins.map((localBin) => {
      const bin = bins.find((b) => b.id === localBin.id);
      const activeBin = localBin || bin;
      return {
        bin: activeBin,
        metrics: calculateBinMetrics(activeBin, systemSettings),
      };
    });
  }, [bins, localBins, systemSettings]);

  const updateSystemSettings = useCallback((newSettings: Partial<SystemSettings>) => {
    setSystemSettings((current) => ({
      ...current,
      ...newSettings,
    }));
  }, []);

  const addTruckLoad = useCallback((binId: number, trailers: number) => {
    const tonsPerTrailer = systemSettings.tonsPerTrailer;
    const totalTons = trailers * tonsPerTrailer;
    const addedFeet = tonsToFeet(totalTons);
    
    setBins((currentBins) => {
      const targetBin = currentBins.find(bin => bin.id === binId);
      const oldFillTons = targetBin?.currentFillTons || 0;
      
      const updatedBins = currentBins.map((bin) =>
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
      );
      
      // Check threshold notification after adding truck load
      const updatedBin = updatedBins.find(b => b.id === binId);
      if (updatedBin) {
        checkThresholdNotificationAnyState(updatedBin, systemSettings);
      }
      
      return updatedBins;
    });
    
    // Add activity log
    const bin = bins.find(b => b.id === binId);
    if (bin) {
      addActivityLog(binId, 'truck_load', `Added ${trailers} trailer load(s)`, bin.currentFillTons, bin.currentFillTons + totalTons, 'tons');
    }
  }, [systemSettings.tonsPerTrailer, addActivityLog, bins, checkThresholdNotificationAnyState, systemSettings, tonsToFeet]);

  const removeTruckLoad = useCallback((binId: number, trailers: number) => {
    const tonsPerTrailer = systemSettings.tonsPerTrailer;
    const totalTons = trailers * tonsPerTrailer;
    const removedFeet = tonsToFeet(totalTons);
    
    setBins((currentBins) => {
      const targetBin = currentBins.find(bin => bin.id === binId);
      const oldFillTons = targetBin?.currentFillTons || 0;
      
      return currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              currentFillFeet: Math.max(bin.currentFillFeet - removedFeet, 0),
              currentFillTons: Math.max(bin.currentFillTons - totalTons, 0),
              trailerCount: bin.trailerCount - trailers, // Allow negative values
              isFilling: false,
              startTime: undefined,
            }
          : bin
      );
    });
    
    // Add activity log
    const bin = bins.find(b => b.id === binId);
    if (bin) {
      addActivityLog(binId, 'truck_remove', `Removed ${trailers} trailer load(s)`, bin.currentFillTons, bin.currentFillTons - totalTons, 'tons');
    }
  }, [systemSettings.tonsPerTrailer, addActivityLog, bins]);

  const resetTrailerCount = useCallback((binId: number) => {
    setBins((currentBins) => {
      const targetBin = currentBins.find(bin => bin.id === binId);
      const oldTrailerCount = targetBin?.trailerCount || 0;
      
      return currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              trailerCount: 0,
            }
          : bin
      );
    });
    
    // Add activity log
    addActivityLog(binId, 'trailer_reset', `Reset trailer count from ${bins.find(b => b.id === binId)?.trailerCount || 0} to 0`);
  }, [addActivityLog, bins]);

  const updateGrainType = useCallback((binId: number, grainType: string) => {
    setBins((currentBins) => {
      const targetBin = currentBins.find(bin => bin.id === binId);
      const oldGrainType = targetBin?.grainType || '';
      
      return currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              grainType,
            }
          : bin
      );
    });
    
    // Add activity log
    const bin = bins.find(b => b.id === binId);
    if (bin) {
      addActivityLog(binId, 'grain_change', `Changed grain type from "${bin.grainType}" to "${grainType}"`);
    }
  }, [addActivityLog, bins]);

  const addWagonLoad = useCallback((binId: number, wagons: number) => {
    const tonsPerWagon = systemSettings.tonsPerWagon;
    const totalTons = wagons * tonsPerWagon;
    const addedFeet = tonsToFeet(totalTons);
    
    setBins((currentBins) => {
      const targetBin = currentBins.find(bin => bin.id === binId);
      const oldFillTons = targetBin?.currentFillTons || 0;
      
      const updatedBins = currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              currentFillFeet: Math.min(bin.currentFillFeet + addedFeet, bin.maxCapacityFeet),
              currentFillTons: Math.min(bin.currentFillTons + totalTons, bin.maxCapacityTons),
              wagonCount: bin.wagonCount + wagons,
              isFilling: false,
              startTime: undefined,
            }
          : bin
      );
      
      // Check threshold notification after adding wagon load
      const updatedBin = updatedBins.find(b => b.id === binId);
      if (updatedBin) {
        checkThresholdNotificationAnyState(updatedBin, systemSettings);
      }
      
      return updatedBins;
    });
    
    // Add activity log
    const bin = bins.find(b => b.id === binId);
    if (bin) {
      addActivityLog(binId, 'wagon_load', `Added ${wagons} wagon load(s)`, bin.currentFillTons, bin.currentFillTons + totalTons, 'tons');
    }
  }, [systemSettings.tonsPerWagon, addActivityLog, bins, checkThresholdNotificationAnyState, systemSettings, tonsToFeet]);

  const removeWagonLoad = useCallback((binId: number, wagons: number) => {
    const tonsPerWagon = systemSettings.tonsPerWagon;
    const totalTons = wagons * tonsPerWagon;
    const removedFeet = tonsToFeet(totalTons);
    
    setBins((currentBins) => {
      const targetBin = currentBins.find(bin => bin.id === binId);
      const oldFillTons = targetBin?.currentFillTons || 0;
      
      return currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              currentFillFeet: Math.max(bin.currentFillFeet - removedFeet, 0),
              currentFillTons: Math.max(bin.currentFillTons - totalTons, 0),
              wagonCount: bin.wagonCount - wagons, // Allow negative values
              isFilling: false,
              startTime: undefined,
            }
          : bin
      );
    });
    
    // Add activity log
    const bin = bins.find(b => b.id === binId);
    if (bin) {
      addActivityLog(binId, 'wagon_remove', `Removed ${wagons} wagon load(s)`, bin.currentFillTons, bin.currentFillTons - totalTons, 'tons');
    }
  }, [systemSettings.tonsPerWagon, addActivityLog, bins]);

  const resetWagonCount = useCallback((binId: number) => {
    setBins((currentBins) => {
      const targetBin = currentBins.find(bin => bin.id === binId);
      const oldWagonCount = targetBin?.wagonCount || 0;
      
      return currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              wagonCount: 0,
            }
          : bin
      );
    });
    
    // Add activity log
    addActivityLog(binId, 'wagon_reset', `Reset wagon count from ${bins.find(b => b.id === binId)?.wagonCount || 0} to 0`);
  }, [addActivityLog, bins]);

  const deleteActivityLog = useCallback((binId: number, logId: string) => {
    setBins((currentBins) =>
      currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              activityLogs: (bin.activityLogs || []).filter(log => log.id !== logId),
            }
          : bin
      )
    );
  }, []);

  const manualInload = useCallback((binId: number, tons: number, loadType?: 'trailer' | 'wagon' | 'custom') => {
    const addedFeet = tonsToFeet(tons);
    
    setBins((currentBins) => {
      const targetBin = currentBins.find(bin => bin.id === binId);
      const oldFillTons = targetBin?.currentFillTons || 0;
      
      const updatedBins = currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              currentFillFeet: Math.min(bin.currentFillFeet + addedFeet, bin.maxCapacityFeet),
              currentFillTons: Math.min(bin.currentFillTons + tons, bin.maxCapacityTons),
              isFilling: false,
              startTime: undefined,
            }
          : bin
      );
      
      // Add activity log with load type information
      const updatedBin = updatedBins.find(b => b.id === binId);
      if (updatedBin && targetBin) {
        const loadTypeText = loadType && loadType !== 'custom' ? ` (${loadType})` : '';
        addActivityLog(binId, 'manual_inload', `Manual inload: ${tons} tons${loadTypeText}`, oldFillTons, updatedBin.currentFillTons, 'tons');
        
        // Check threshold notification after manual inload
        checkThresholdNotificationAnyState(updatedBin, systemSettings);
      }
      
      return updatedBins;
    });
  }, [addActivityLog, checkThresholdNotificationAnyState, systemSettings, tonsToFeet]);

  const manualOutload = useCallback((binId: number, tons: number, loadType?: 'trailer' | 'wagon' | 'custom') => {
    const removedFeet = tonsToFeet(tons);
    
    setBins((currentBins) => {
      const targetBin = currentBins.find(bin => bin.id === binId);
      const oldFillTons = targetBin?.currentFillTons || 0;
      
      const updatedBins = currentBins.map((bin) =>
        bin.id === binId
          ? {
              ...bin,
              currentFillFeet: Math.max(bin.currentFillFeet - removedFeet, 0),
              currentFillTons: Math.max(bin.currentFillTons - tons, 0),
              isFilling: false,
              startTime: undefined,
            }
          : bin
      );
      
      // Add activity log after getting the new values
      const updatedBin = updatedBins.find(b => b.id === binId);
      if (updatedBin && targetBin) {
        const loadTypeText = loadType && loadType !== 'custom' ? ` (${loadType})` : '';
        addActivityLog(binId, 'manual_outload', `Manual outload: ${tons} tons${loadTypeText}`, oldFillTons, updatedBin.currentFillTons, 'tons');
        
        // Check threshold notification after manual outload
        checkThresholdNotificationAnyState(updatedBin, systemSettings);
      }
      
      return updatedBins;
    });
  }, [addActivityLog, checkThresholdNotificationAnyState, systemSettings, tonsToFeet]);

  const undoLastActivity = useCallback((binId: number) => {
    setBins((currentBins) => {
      const bin = currentBins.find(b => b.id === binId);
      if (!bin || !bin.activityLogs || bin.activityLogs.length === 0) {
        return currentBins;
      }

      const lastLog = bin.activityLogs[0];
      let updatedBin = { ...bin };

      // Undo based on action type
      switch (lastLog.action) {
        case 'start_filling':
          updatedBin.isFilling = false;
          updatedBin.startTime = undefined;
          break;
        
        case 'stop_filling':
          // Can't easily undo stop filling without knowing the exact state
          break;
        
        case 'reset':
          // Can't easily undo reset without knowing previous state
          break;
        
        case 'manual_fill':
        case 'manual_inload':
        case 'manual_outload':
          if (lastLog.oldValue !== undefined) {
            updatedBin.currentFillTons = lastLog.oldValue;
            updatedBin.currentFillFeet = tonsToFeet(lastLog.oldValue);
            updatedBin.isFilling = false;
            updatedBin.startTime = undefined;
          }
          break;
        
        case 'truck_load':
          if (lastLog.oldValue !== undefined && lastLog.newValue !== undefined) {
            const tonsToRevert = lastLog.newValue - lastLog.oldValue;
            const feetToRevert = tonsToFeet(tonsToRevert);
            updatedBin.currentFillTons = lastLog.oldValue;
            updatedBin.currentFillFeet = Math.max(0, updatedBin.currentFillFeet - feetToRevert);
            updatedBin.trailerCount = Math.max(0, updatedBin.trailerCount - 1);
            updatedBin.isFilling = false;
            updatedBin.startTime = undefined;
          }
          break;
        
        case 'truck_remove':
          if (lastLog.oldValue !== undefined && lastLog.newValue !== undefined) {
            const tonsToAdd = lastLog.oldValue - lastLog.newValue;
            const feetToAdd = tonsToFeet(tonsToAdd);
            updatedBin.currentFillTons = lastLog.oldValue;
            updatedBin.currentFillFeet = Math.min(updatedBin.maxCapacityFeet, updatedBin.currentFillFeet + feetToAdd);
            updatedBin.trailerCount = updatedBin.trailerCount + 1;
            updatedBin.isFilling = false;
            updatedBin.startTime = undefined;
          }
          break;
        
        case 'trailer_reset':
          // Can't easily undo trailer reset without knowing previous value
          break;
        
        case 'wagon_load':
          if (lastLog.oldValue !== undefined && lastLog.newValue !== undefined) {
            const tonsToRevert = lastLog.newValue - lastLog.oldValue;
            const feetToRevert = tonsToFeet(tonsToRevert);
            updatedBin.currentFillTons = lastLog.oldValue;
            updatedBin.currentFillFeet = Math.max(0, updatedBin.currentFillFeet - feetToRevert);
            updatedBin.wagonCount = Math.max(0, updatedBin.wagonCount - 1);
            updatedBin.isFilling = false;
            updatedBin.startTime = undefined;
          }
          break;
        
        case 'wagon_remove':
          if (lastLog.oldValue !== undefined && lastLog.newValue !== undefined) {
            const tonsToAdd = lastLog.oldValue - lastLog.newValue;
            const feetToAdd = tonsToFeet(tonsToAdd);
            updatedBin.currentFillTons = lastLog.oldValue;
            updatedBin.currentFillFeet = Math.min(updatedBin.maxCapacityFeet, updatedBin.currentFillFeet + feetToAdd);
            updatedBin.wagonCount = updatedBin.wagonCount + 1;
            updatedBin.isFilling = false;
            updatedBin.startTime = undefined;
          }
          break;
        
        case 'wagon_reset':
          // Can't easily undo wagon reset without knowing previous value
          break;
        
        case 'grain_change':
          if (lastLog.details && lastLog.details.includes('from "') && lastLog.details.includes('" to "')) {
            const match = lastLog.details.match(/from "([^"]+)" to "([^"]+)"/);
            if (match) {
              updatedBin.grainType = match[1]; // Revert to old grain type
            }
          }
          break;
      }

      // Remove the last log after undoing
      updatedBin.activityLogs = updatedBin.activityLogs.slice(1);

      return currentBins.map((b) => b.id === binId ? updatedBin : b);
    });
  }, [tonsToFeet]);

  return {
    bins,
    localBins,
    systemSettings,
    isLoading,
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
    addWagonLoad,
    removeWagonLoad,
    resetWagonCount,
    deleteActivityLog,
    undoLastActivity,
    manualInload,
    manualOutload,
  };
}
