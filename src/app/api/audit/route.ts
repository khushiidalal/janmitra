import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Audit from '@/models/Audit';

export async function GET() {
  try {
    await connectDB();
    const logs = await Audit.find().sort({ time: -1 });
    return NextResponse.json(logs.map((l) => l.toJSON()));
  } catch (error: any) {
    console.error('Fetch audit logs error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
