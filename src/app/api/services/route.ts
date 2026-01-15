import { NextRequest, NextResponse } from "next/server";
import { servicesData } from "@/constants/services";

export async function GET(request: NextRequest) {
  try {
    // For now, return static services data
    // In the future, this could fetch from a database
    return NextResponse.json(servicesData);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
