import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";


async function ensureFarmersTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS farmers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        farm_name VARCHAR(255),
        name VARCHAR(255),
        phone VARCHAR(50),
        location TEXT,
        email_verified BOOLEAN DEFAULT FALSE,
        login_method VARCHAR(50) DEFAULT 'email',
        verification_token VARCHAR(255),
        password_hash VARCHAR(255),
        two_factor_secret VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error("Error creating farmers table:", error);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { available: false, message: "Email required" },
        { status: 400 }
      );
    }

    
    await ensureFarmersTable();

    const { rows } = await query(
      "SELECT COUNT(*) as count FROM farmers WHERE email = $1",
      [email]
    );
    const isAvailable = rows[0].count === "0";

    return NextResponse.json({
      available: isAvailable,
      message: isAvailable
        ? "Email is available"
        : "Email already taken",
    });
  } catch (error: any) {
    console.error("Error checking email:", error.message);
    return NextResponse.json(
      { available: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

