import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const jwtSecret = process.env.JWT_SECRET || "fallback-secret";


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
        email_verified BOOLEAN DEFAULT TRUE,
        login_method VARCHAR(50) DEFAULT 'email',
        verification_token VARCHAR(255),
        password_hash VARCHAR(255),
        two_factor_secret VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error("Error ensuring farmers table:", error);
    
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureFarmersTable();

    const { farmName, phone, email, password, location } = await req.json();

    if (!farmName || !phone || !email || !password || !location) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    
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

    
    const hashedPassword = await argon2.hash(password);

    
    const verificationToken = jwt.sign({ email }, jwtSecret, {
      expiresIn: "24h",
    });

    
    
    const result = await query(
      `INSERT INTO farmers (email, password_hash, farm_name, phone, location, verification_token, email_verified, login_method, name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        email,
        hashedPassword,
        farmName,
        phone,
        location,
        verificationToken,
        true, 
        "email",
        farmName, 
      ]
    );

    const farmerId = result.rows[0].id;

    
    const twoFactorSecret =
      "otpauth://totp/HarvestHub:" +
      email +
      "?secret=DEMOSECRET&issuer=HarvestHub";
    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    return NextResponse.json(
      {
        message: "Farmer registered successfully. You can now log in.",
        farmerId,
        twoFactorSecret,
        backupCodes,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Farmer registration error:", error);

    
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Registration failed",
        details: error?.message || "Unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

