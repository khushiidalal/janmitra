import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Case from '@/models/Case';
import Audit from '@/models/Audit';
import { generateCaseId, formatDisplayDate } from '@/lib/server/caseId';
import { getAuthenticatedUser } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const filter: Record<string, any> = {};
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    if (status && ['Active', 'Pending', 'Closed'].includes(status)) {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { caseId: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'people.name': { $regex: search, $options: 'i' } },
      ];
    }

    const cases = await Case.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(cases.map((c) => c.toJSON()));
  } catch (error: any) {
    console.error('Fetch cases error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(req);
    const body = await req.json();

    const {
      title,
      incidentDate,
      time,
      location,
      category,
      description,
      status,
      date,
      people,
      documents,
      prefix,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Incident title is required' },
        { status: 400 }
      );
    }

    const count = await Case.countDocuments();
    const caseId = generateCaseId(prefix || 'FIR', count + 1);

    const newCase = await Case.create({
      caseId,
      title: title.trim(),
      incidentDate: incidentDate || '',
      time: time || '',
      location: location || '',
      category: category || '',
      description: description || '',
      status: status || 'Pending',
      date: date || formatDisplayDate(incidentDate),
      people: Array.isArray(people) ? people : [],
      documents: Array.isArray(documents) ? documents : [],
      createdBy: user?._id,
    });

    try {
      await Audit.create({
        type: 'review',
        text: `New case ${caseId} created: "${newCase.title}"`,
        accessedBy: user?.fullName || 'System',
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    return NextResponse.json(newCase.toJSON(), { status: 201 });
  } catch (error: any) {
    console.error('Create case error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create case' },
      { status: 500 }
    );
  }
}
