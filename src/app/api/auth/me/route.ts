import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userJson: any = user.toJSON();
    if (!userJson.username) {
      userJson.username = (user as any).username || (user.email ? user.email.split('@')[0] : '');
    }

    return NextResponse.json({
      success: true,
      user: userJson,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      fullName,
      officialPhone,
      officialEmail,
      department,
      designation,
      employeeId,
      jurisdiction,
      dateOfBirth,
      gender,
      address,
      govIdType,
      govIdNumber,
      profilePhoto,
      preferences,
    } = body;

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (officialPhone !== undefined) user.officialPhone = officialPhone.trim();
    if (officialEmail !== undefined) user.officialEmail = officialEmail.trim().toLowerCase();
    if (department !== undefined) user.department = department.trim();
    if (designation !== undefined) user.designation = designation.trim();
    if (employeeId !== undefined) user.employeeId = employeeId.trim();
    if (jurisdiction !== undefined) user.jurisdiction = jurisdiction.trim();
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth.trim();
    if (gender !== undefined) user.gender = gender.trim();
    if (address !== undefined) user.address = address.trim();
    if (govIdType !== undefined) user.govIdType = govIdType.trim();
    if (govIdNumber !== undefined) user.govIdNumber = govIdNumber.trim();
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    if (preferences && typeof preferences === 'object') {
      user.preferences = {
        language: preferences.language ?? user.preferences?.language ?? 'English (US)',
        textSize: preferences.textSize ?? user.preferences?.textSize ?? 'Medium',
        highContrast: preferences.highContrast ?? user.preferences?.highContrast ?? false,
      };
    }

    await user.save();

    const userJson: any = user.toJSON();
    if (!userJson.username) {
      userJson.username = (user as any).username || (user.email ? user.email.split('@')[0] : '');
    }

    return NextResponse.json({
      success: true,
      user: userJson,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
