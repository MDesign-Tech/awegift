import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  // Basic proxy function - can add authentication logic here if needed
  return NextResponse.next();
}