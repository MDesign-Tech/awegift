import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { addressIndex } = await request.json();

    if (addressIndex === undefined) {
      return NextResponse.json(
        { error: "Address index is required" },
        { status: 400 }
      );
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
    let addresses = userData.profile?.addresses || [];

    // Remove address at specified index
    if (addressIndex >= 0 && addressIndex < addresses.length) {
      addresses.splice(addressIndex, 1);
    } else {
      return NextResponse.json(
        { error: "Invalid address index" },
        { status: 400 }
      );
    }

    await adminDb.collection("users").doc(userDoc.id).update({
      "profile.addresses": addresses,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, addresses });
  } catch (error) {
    console.error("Address deletion error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete address",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
