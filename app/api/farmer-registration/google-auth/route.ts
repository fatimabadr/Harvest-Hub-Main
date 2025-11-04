import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "demo-secret-key";


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
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Google token is required" },
        { status: 400 }
      );
    }

    
    await ensureFarmersTable();

    
    const googleResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!googleResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user info from Google" },
        { status: 400 }
      );
    }

    const googleUser = await googleResponse.json();

    if (!googleUser || !googleUser.email) {
      return NextResponse.json(
        { error: "Google authentication failed: Invalid user info" },
        { status: 400 }
      );
    }

    const { email, name } = googleUser;

    
    const existing = await query(
      "SELECT * FROM farmers WHERE email = $1 LIMIT 1",
      [email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const verificationToken = jwt.sign({ email }, jwtSecret, {
      expiresIn: "24h",
    });

    
    await query(
      `INSERT INTO farmers (email, farm_name, email_verified, login_method, verification_token, name)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [email, name || "Unknown", false, "google", verificationToken, name || ""]
    );

    
    const twoFactorSecret =
      "otpauth://totp/HarvestHub:" +
      email +
      "?secret=DEMOSECRET&issuer=HarvestHub";
    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    return NextResponse.json(
      {
        message: "Farmer registered via Google successfully",
        token: verificationToken,
        twoFactorSecret: twoFactorSecret,
        backupCodes: backupCodes,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Google Signup Error:", error);
    return NextResponse.json(
      {
        error: "Google authentication failed",
        details: error.message || "Unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

