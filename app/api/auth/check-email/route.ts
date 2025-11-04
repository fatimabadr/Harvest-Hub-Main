import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    try {
      const result = await query(
        "SELECT id FROM harvesthub_users WHERE email = $1",
        [email]
      );
      return NextResponse.json({ exists: result.rows.length > 0 });
    } catch (e: any) {
      
      const code = (e && (e as any).code) || '';
      if (code === '42P01' || (typeof e?.message === 'string' && e.message.includes('relation "harvesthub_users" does not exist'))) {
        return NextResponse.json({ exists: false });
      }
      throw e;
    }

  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json(
      { error: "Failed to check email" },
      { status: 500 }
    );
  }
} 