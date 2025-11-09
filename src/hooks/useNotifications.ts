'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { Bin, SystemSettings } from '@/types/bin';

interface NotificationState {
  lastNotificationTime: Map<number | string, Date>;
}

// Notification Provider Component
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement; // Provider is handled by browser APIs
}

export function useNotifications() {
  const notificationStateRef = useRef<NotificationState>({
    lastNotificationTime: new Map(),
  });

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check if notifications are supported and permitted
  const canShowNotifications = useCallback((): boolean => {
    return 'Notification' in window && Notification.permission === 'granted';
  }, []);

  // Check if cooldown period has passed for a specific bin
  const isCooldownPassed = useCallback((binId: number, cooldownMinutes: number): boolean => {
    const lastTime = notificationStateRef.current.lastNotificationTime.get(binId);
    
    if (!lastTime) {
      return true;
    }
    
    const now = new Date();
    const cooldownMs = cooldownMinutes * 60 * 1000;
    const timeDiff = now.getTime() - lastTime.getTime();
    
    return timeDiff >= cooldownMs;
  }, []);

  // Show browser notification
  const showNotification = useCallback((
    title: string,
    body: string,
    options?: NotificationOptions
  ): void => {
    if (!canShowNotifications()) {
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'silo-bin-alert',
        requireInteraction: true,
        ...options,
      });

      // Auto-close after 10 seconds if not interacted with
      setTimeout(() => {
        notification.close();
      }, 10000);

      // Focus window when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }, [canShowNotifications]);

  // Check and show threshold notification
  const checkThresholdNotification = useCallback((
    bin: Bin,
    systemSettings: SystemSettings
  ): void => {
    const { notifications } = systemSettings;
    
    // Skip if notifications are disabled
    if (!notifications.enabled) return;
    
    // Calculate remaining capacity
    const remainingCapacity = bin.maxCapacityFeet - bin.currentFillFeet;
    
    // Check if remaining capacity is at or below threshold
    if (remainingCapacity <= notifications.thresholdFeet) {
      // Check cooldown period
      if (!isCooldownPassed(bin.id, notifications.cooldownMinutes)) {
        return;
      }
      
      // Update last notification time
      notificationStateRef.current.lastNotificationTime.set(bin.id, new Date());
      
      // Show notification
      showNotification(
        `Silo Bin Alert - Bin Drop Required`,
        `${bin.name} requires manual measurement - Remaining: ${remainingCapacity.toFixed(1)} ft`,
        {
          tag: `bin-${bin.id}-threshold`,
          requireInteraction: notifications.requireInteraction,
        }
      );
      
    }
  }, [canShowNotifications, isCooldownPassed]);

  // Check threshold notification for any bin state (including after manual operations)
  const checkThresholdNotificationAnyState = useCallback((
    bin: Bin,
    systemSettings: SystemSettings
  ): void => {
    const { notifications } = systemSettings;
    
    // Skip if notifications are disabled
    if (!notifications.enabled) {
      return;
    }
    
    // Calculate remaining capacity
    const remainingCapacity = bin.maxCapacityFeet - bin.currentFillFeet;
    
    // Check if remaining capacity is at or below threshold
    if (remainingCapacity <= notifications.thresholdFeet) {
      // Check cooldown period
      if (!isCooldownPassed(bin.id, notifications.cooldownMinutes)) {
        return;
      }
      
      // Update last notification time
      notificationStateRef.current.lastNotificationTime.set(bin.id, new Date());
      
      // Show notification directly to avoid circular dependency
      if (canShowNotifications()) {
        try {
          const notification = new Notification(
            `Silo Bin Alert - Bin Drop Required`,
            {
              body: `${bin.name} requires manual measurement - Remaining: ${remainingCapacity.toFixed(1)} ft`,
              icon: '/favicon.ico',
              tag: `bin-${bin.id}-threshold`,
              requireInteraction: false,
            }
          );

          // Auto-close after 10 seconds if not interacted with
          setTimeout(() => {
            notification.close();
          }, 10000);

          // Focus window when notification is clicked
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      }
    }
  }, [canShowNotifications, isCooldownPassed]);

  // Reset notification cooldown for a specific bin
  const resetNotificationCooldown = useCallback((binId: number): void => {
    notificationStateRef.current.lastNotificationTime.delete(binId);
  }, []);

  // Get notification permission status
  const getNotificationStatus = useCallback((): 'granted' | 'denied' | 'default' | 'unsupported' => {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  // Test notification function
  const testNotification = useCallback((): void => {
    if (!canShowNotifications()) {
      return;
    }

    showNotification(
      '🔔 Test Notification',
      'This is a test notification from Silo Bin Measurer!',
      {
        tag: 'test-notification',
        requireInteraction: false,
      }
    );
  }, [canShowNotifications, showNotification]);

  // Periodic notification during filling
  const checkPeriodicNotification = useCallback((
    bin: Bin,
    systemSettings: SystemSettings
  ): void => {
    const { notifications } = systemSettings;
    
    // Skip if notifications are disabled
    if (!notifications.enabled) return;
    
    // Only send periodic notifications during active filling
    if (!bin.isFilling) return;
    
    // Check if 10 minutes have passed since last periodic notification
    const periodicKey = `${bin.id}-periodic`;
    const lastPeriodicTime = notificationStateRef.current.lastNotificationTime.get(periodicKey);
    
    const now = new Date();
    const tenMinutesMs = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    // Send periodic notification if no previous periodic notification or 10 minutes have passed
    if (!lastPeriodicTime || (now.getTime() - lastPeriodicTime.getTime()) >= tenMinutesMs) {
      // Update last periodic notification time with separate key
      notificationStateRef.current.lastNotificationTime.set(periodicKey, new Date());
      
      // Show periodic notification
      showNotification(
        `🔄 Filling Status - ${bin.name}`,
        `Still filling... Current level: ${bin.currentFillFeet.toFixed(1)} ft (${bin.currentFillTons.toFixed(0)} tons)`,
        {
          tag: `${bin.id}-periodic`,
          requireInteraction: false,
        }
      );
    }
  }, [canShowNotifications, showNotification]);

  return {
    canShowNotifications,
    checkThresholdNotification,
    checkThresholdNotificationAnyState,
    checkPeriodicNotification,
    resetNotificationCooldown,
    getNotificationStatus,
    requestNotificationPermission,
    showNotification,
    testNotification,
  };
}
