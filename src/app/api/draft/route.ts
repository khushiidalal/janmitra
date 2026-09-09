import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Draft from '@/models/Draft';
import { getAuthenticatedUser } from '@/lib/server/auth';

const EMPTY_DRAFT = {
  title: '',
  date: '',
  time: '',
  location: '',
  category: '',
  description: '',
  people: [],
  documents: [],
  evidence: {},
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(EMPTY_DRAFT);
    }

    const draft = await Draft.findOne({ user: user._id });
    if (!draft) return NextResponse.json(EMPTY_DRAFT);

    return NextResponse.json(draft.toJSON());
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const b = await req.json().catch(() => ({}));
    const fields = {
      title: b.title || '',
      date: b.date || '',
      time: b.time || '',
      location: b.location || '',
      category: b.category || '',
      description: b.description || '',
      people: Array.isArray(b.people) ? b.people : [],
      documents: Array.isArray(b.documents) ? b.documents : [],
      evidence: b.evidence || {},
    };

    const draft = await Draft.findOneAndUpdate(
      { user: user._id },
      { $set: fields, user: user._id },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(draft.toJSON());
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save draft' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(req);
    if (user) {
      await Draft.findOneAndDelete({ user: user._id });
    }
    return NextResponse.json(EMPTY_DRAFT);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to clear draft' },
      { status: 500 }
    );
  }
}
