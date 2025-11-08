import { NextRequest, NextResponse } from 'next/server';
import { getBinsCollection } from '@/lib/mongodb';
import { Bin } from '@/types/bin';

// GET - Fetch all bins
export async function GET() {
  try {
    const collection = await getBinsCollection();
    const bins = await collection.find({}).toArray();
    
    return NextResponse.json({ success: true, data: bins });
  } catch (error) {
    console.error('Error fetching bins:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bins' },
      { status: 500 }
    );
  }
}

// POST - Update bins
export async function POST(request: NextRequest) {
  try {
    const bins: Bin[] = await request.json();
    
    if (!Array.isArray(bins)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format' },
        { status: 400 }
      );
    }

    const collection = await getBinsCollection();
    
    // Update each bin individually using upsert to avoid duplicate key errors
    for (const bin of bins) {
      await collection.replaceOne(
        { id: bin.id }, // Filter by id instead of _id
        bin,
        { upsert: true }
      );
    }
    
    return NextResponse.json({ success: true, data: bins });
  } catch (error) {
    console.error('Error updating bins:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bins' },
      { status: 500 }
    );
  }
}
