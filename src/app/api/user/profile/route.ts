import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usersRef = adminDb.collection("users");
    const snapshot = await usersRef.where("email", "==", session.user.email).get();

    if (snapshot.empty) {
        return NextResponse.json(
          { error: "User deleted", code: "USER_DELETED" },
          { status: 401 }
        );
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Ensure addresses array exists for backward compatibility
    if (userData.profile && !userData.profile.addresses) {
      userData.profile.addresses = [];
    }

    // Filter out sensitive and private data
    const {
      password,
      cart,
      wishlist,
      id,
      emailVerified,
      provider,
      createdAt,
      updatedAt,
      role,
      twoFactorSecret,
      ...safeUserData
    } = userData;

    return NextResponse.json({
      ...safeUserData,
      email: userData.email,
      id: userDoc.id
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, image, profile, currentPassword, newPassword } = body;

    const usersRef = adminDb.collection("users");
    const snapshot = await usersRef.where("email", "==", session.user.email).get();

    if (snapshot.empty) {
        return NextResponse.json(
          { error: "User deleted", code: "USER_DELETED" },
          { status: 401 }
        );
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Prepare update data, only include defined fields
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    if (typeof name !== "undefined") {
      updateData.name = name;
    }
    if (typeof image !== "undefined") {
      updateData.image = image;
    }
    if (profile?.phone !== undefined) {
      updateData["profile.phone"] = profile.phone;
    }

    // Handle password update if provided
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }

      // Verify current password
      const bcrypt = await import("bcryptjs");
      const isValid = await bcrypt.compare(currentPassword, userData.password || "");
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedPassword;
    }

    await adminDb.collection("users").doc(userDoc.id).update(updateData);

    // Fetch updated user data
    const updatedUser = await adminDb.collection("users").doc(userDoc.id).get();
    const updatedData = updatedUser.data();

    // Return updated profile data
    return NextResponse.json({
      profile: updatedData?.profile || {},
      name: updatedData?.name,
      email: updatedData?.email,
      image: updatedData?.image,
      id: userDoc.id
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
