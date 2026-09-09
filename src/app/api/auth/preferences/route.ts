import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const preferences = user.preferences || {
      language: 'English (US)',
      textSize: 'Medium',
      highContrast: false,
    };

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { language, textSize, highContrast } = body;

    const user = await User.findById(authUser._id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.preferences) {
      user.preferences = {
        language: 'English (US)',
        textSize: 'Medium',
        highContrast: false,
      };
    }

    if (language !== undefined) user.preferences.language = language;
    if (textSize !== undefined && ['Small', 'Medium', 'Large'].includes(textSize)) {
      user.preferences.textSize = textSize;
    }
    if (highContrast !== undefined) user.preferences.highContrast = Boolean(highContrast);

    await user.save();

    return NextResponse.json({
      success: true,
      preferences: user.preferences,
      message: 'Preferences updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
