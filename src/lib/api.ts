import { Bin } from '@/types/bin';

interface SystemSettings {
  elevatorSpeed: number;
  tonsPerTrailer: number;
  tonsPerWagon: number;
  tonsPerFoot: number;
}

// API response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Bins API functions
export async function fetchBins(): Promise<Bin[]> {
  try {
    const response = await fetch('/api/bins', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result: ApiResponse<Bin[]> = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('Failed to fetch bins:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching bins:', error);
    return [];
  }
}

export async function updateBins(bins: Bin[]): Promise<boolean> {
  try {
    const response = await fetch('/api/bins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bins),
    });
    
    const result: ApiResponse<Bin[]> = await response.json();
    
    if (result.success) {
      return true;
    } else {
      console.error('Failed to update bins:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error updating bins:', error);
    return false;
  }
}

// System Settings API functions
export async function fetchSystemSettings(): Promise<SystemSettings> {
  try {
    const response = await fetch('/api/system-settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result: ApiResponse<SystemSettings> = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('Failed to fetch system settings:', result.error);
      // Return default settings
      return {
        elevatorSpeed: 180,
        tonsPerTrailer: 25,
        tonsPerWagon: 50,
        tonsPerFoot: 25,
      };
    }
  } catch (error) {
    console.error('Error fetching system settings:', error);
    // Return default settings
    return {
      elevatorSpeed: 180,
      tonsPerTrailer: 25,
      tonsPerWagon: 50,
      tonsPerFoot: 25,
    };
  }
}

export async function updateSystemSettings(settings: SystemSettings): Promise<boolean> {
  try {
    const response = await fetch('/api/system-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    const result: ApiResponse<SystemSettings> = await response.json();
    
    if (result.success) {
      return true;
    } else {
      console.error('Failed to update system settings:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error updating system settings:', error);
    return false;
  }
}
