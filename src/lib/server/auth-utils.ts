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
export async function requireRole(request: NextRequest, permission: any) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log("AUTH DEBUG → TOKEN:", token);

  if (!token?.sub) {
    console.log("AUTH DEBUG → NO TOKEN.SUB");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = token.sub;
  console.log("AUTH DEBUG → USER ID:", userId);

  const userDoc = await adminDb.collection("users").doc(userId).get();
  console.log("AUTH DEBUG → USER DOC EXISTS:", userDoc.exists);

  const role = userDoc.exists ? userDoc.data()?.role : null;
  console.log("AUTH DEBUG → ROLE:", role);

  if (!role) {
    console.log("AUTH DEBUG → NO ROLE");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(role, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { role, userId };
}

