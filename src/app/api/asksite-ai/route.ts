import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({
    active: false,
    message: 'Module disabled',
  });
}
