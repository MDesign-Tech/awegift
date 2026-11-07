import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getPawapayConfig, PawapayError } from "@/lib/payments/pawapay";
import { getRwandaPawapayProviders } from "@/lib/payments/pawapay-deposit";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = getPawapayConfig();
    const providers = await getRwandaPawapayProviders(config);
    return NextResponse.json({ country: "RWA", currency: "RWF", providers });
  } catch (error) {
    console.error(
      "PawaPay provider discovery failed.",
      error instanceof PawapayError
        ? { code: error.code, httpStatus: error.httpStatus }
        : "unexpected",
    );
    return NextResponse.json(
      { error: "Mobile money providers are temporarily unavailable." },
      { status: 503 },
    );
  }
}
