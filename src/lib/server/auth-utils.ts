// lib/server/auth-utils.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";
import { hasPermission, UserRole } from "@/lib/rbac/roles";

/**
 * Validate user session and permissions for server APIs
 * @param request NextRequest
 * @param permission Permission key from RolePermissions
 * @returns role and userId if valid, otherwise NextResponse
 */
export async function requireRole(
  request: NextRequest,
  permission: keyof typeof hasPermission extends Function ? any : any
): Promise<{ role: UserRole; userId: string } | NextResponse> {
  // 1. Get session token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = token.sub;

  // 2. Get authoritative role from Firestore
  const userDoc = await adminDb.collection("users").doc(userId).get();
  const role: UserRole | null = userDoc.exists ? (userDoc.data()?.role as UserRole) : null;

  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Check permission
  if (!hasPermission(role, permission)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // 4. Return valid role and userId
  return { role, userId };
}
