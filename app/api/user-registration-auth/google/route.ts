import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "demo-secret-key";

async function ensureUsersTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS harvesthub_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        account_type VARCHAR(20) CHECK (account_type IN ('individual','business')),
        password_hash VARCHAR(255),
        email_verified BOOLEAN DEFAULT FALSE,
        login_method VARCHAR(50) DEFAULT 'email',
        two_factor_secret VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);`);
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);`);
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS account_type VARCHAR(20);`);
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;`);
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS login_method VARCHAR(50) DEFAULT 'email';`);
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);`);
  } catch (e) {
    
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, accountType } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Google token is required" }, { status: 400 });
    }

    await ensureUsersTable();

    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!googleRes.ok) {
      return NextResponse.json({ error: "Failed to fetch Google user info" }, { status: 400 });
    }
    const user = await googleRes.json();
    const email: string | undefined = user?.email;
    const firstName: string = user?.given_name || "";
    const lastName: string = user?.family_name || "";

    if (!email) {
      return NextResponse.json({ error: "Invalid Google user info" }, { status: 400 });
    }

    
    const existing = await query("SELECT id FROM harvesthub_users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    
    const inserted = await query(
      `INSERT INTO harvesthub_users (email, first_name, last_name, account_type, email_verified, login_method)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id`,
      [email, firstName, lastName, accountType || 'individual', true, 'google']
    );

    
    const twoFactorSecret = `otpauth://totp/HarvestHub:${email}?secret=DEMOSECRET&issuer=HarvestHub`;
    const backupCodes = Array.from({ length: 8 }, () => Math.random().toString(36).substring(2, 10).toUpperCase());

    return NextResponse.json({
      message: "User registered via Google successfully",
      userId: inserted.rows[0].id,
      twoFactorSecret,
      backupCodes,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Google auth failed", details: error?.message || "Unexpected error" }, { status: 500 });
  }
}


