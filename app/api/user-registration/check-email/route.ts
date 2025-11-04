import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";


async function ensureUsersTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS harvesthub_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        account_type VARCHAR(50),
        email_verified BOOLEAN DEFAULT FALSE,
        login_method VARCHAR(50) DEFAULT 'email',
        two_factor_secret VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`);
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);`);
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);`);
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS account_type VARCHAR(50);`);
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;`);
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS login_method VARCHAR(50) DEFAULT 'email';`);
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);`);
  } catch (error) {
    console.error("Error creating harvesthub_users table:", error);
    
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

    
    await ensureUsersTable();

    try {
      const { rows } = await query(
        "SELECT COUNT(*) as count FROM harvesthub_users WHERE email = $1",
        [email]
      );
      const isAvailable = rows[0].count === "0";

      return NextResponse.json({
        available: isAvailable,
        message: isAvailable
          ? "Email is available"
          : "Email not available. If it's yours, please log in.",
      });
    } catch (e: any) {
      
      const code = (e && (e as any).code) || '';
      if (code === '42P01' || (typeof e?.message === 'string' && e.message.includes('relation "harvesthub_users" does not exist'))) {
        return NextResponse.json({
          available: true,
          message: "Email is available"
        });
      }
      throw e;
    }
  } catch (error: any) {
    console.error("Error checking email:", error.message);
    return NextResponse.json(
      { available: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

