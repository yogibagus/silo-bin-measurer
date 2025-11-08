import { NextRequest, NextResponse } from 'next/server';
import { getSystemSettingsCollection } from '@/lib/mongodb';

interface SystemSettings {
  elevatorSpeed: number;
  tonsPerTrailer: number;
  tonsPerWagon: number;
  tonsPerFoot: number;
}

interface SystemSettingsWithId extends SystemSettings {
  _id?: any;
}

// GET - Fetch system settings
export async function GET() {
  try {
    const collection = await getSystemSettingsCollection();
    const settings = await collection.findOne({});
    
    // Default settings if none exist
    const defaultSettings: SystemSettings = {
      elevatorSpeed: 180,
      tonsPerTrailer: 25,
      tonsPerWagon: 50,
      tonsPerFoot: 25,
    };
    
    return NextResponse.json({ 
      success: true, 
      data: settings || defaultSettings 
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

// POST - Update system settings
export async function POST(request: NextRequest) {
  try {
    const settings: SystemSettingsWithId = await request.json();
    
    // Validate required fields
    const requiredFields = ['elevatorSpeed', 'tonsPerTrailer', 'tonsPerWagon', 'tonsPerFoot'];
    for (const field of requiredFields) {
      if (!(field in settings) || typeof settings[field as keyof SystemSettings] !== 'number' || settings[field as keyof SystemSettings] <= 0) {
        return NextResponse.json(
          { success: false, error: `Invalid or missing ${field}` },
          { status: 400 }
        );
      }
    }

    const collection = await getSystemSettingsCollection();
    
    // Update or insert settings (exclude _id if present)
    const { _id, ...settingsWithoutId } = settings;
    await collection.updateOne(
      {},
      { $set: settingsWithoutId },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}
