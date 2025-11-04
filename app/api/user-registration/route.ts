import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "fallback-secret";


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
        phone_number VARCHAR(50),
        date_of_birth DATE,
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
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);`);
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS date_of_birth DATE;`);
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
    await query(`ALTER TABLE harvesthub_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
  } catch (error) {
    console.error("Error creating harvesthub_users table:", error);
    
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureUsersTable();

    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
    } = await req.json();

    
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Email, password, first name, and last name are required" },
        { status: 400 }
      );
    }

    
    const existing = await query(
      "SELECT * FROM harvesthub_users WHERE email = $1 LIMIT 1",
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

    
    const twoFactorSecret =
      "otpauth://totp/HarvestHub:" +
      email +
      "?secret=DEMOSECRET" +
      Date.now() +
      "&issuer=HarvestHub";
    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    
    
    const result = await query(
      `INSERT INTO harvesthub_users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        account_type,
        email_verified,
        login_method,
        two_factor_secret,
        phone_number,
        date_of_birth
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        email,
        hashedPassword,
        firstName,
        lastName,
        "individual", 
        true, 
        "email",
        twoFactorSecret,
        phoneNumber || null,
        dateOfBirth || null,
      ]
    );

    const userId = result.rows[0].id;

    return NextResponse.json(
      {
        message: "Registration successful. Please set up 2FA.",
        userId,
        twoFactorSecret: twoFactorSecret,
        backupCodes: backupCodes,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("User registration error:", error);
    
    
    if (error.code === "23505" || error.message?.includes("duplicate key")) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

