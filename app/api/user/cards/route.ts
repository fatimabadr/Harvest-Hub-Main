import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const jwtSecret = process.env.JWT_SECRET || "fallback-secret";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const IV_LENGTH = 16;


function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}


function decrypt(text: string): string {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}


async function ensureCardsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS saved_cards (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES harvesthub_users(id) ON DELETE CASCADE,
      last_four_digits VARCHAR(4) NOT NULL,
      card_type VARCHAR(20) NOT NULL,
      expiry_month INTEGER NOT NULL,
      expiry_year INTEGER NOT NULL,
      name_on_card VARCHAR(255) NOT NULL,
      encrypted_cvv TEXT,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}


ensureCardsTable().catch(console.error);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      const userId = decoded.id;

      const result = await query(
        `SELECT id, last_four_digits, card_type, expiry_month, expiry_year, name_on_card, is_default, created_at
         FROM saved_cards
         WHERE user_id = $1
         ORDER BY is_default DESC, created_at DESC`,
        [userId]
      );

      return NextResponse.json(result.rows);
    } catch (error: any) {
      if (error.name === "JsonWebTokenError") {
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error fetching saved cards:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const body = await req.json();
    const { lastFourDigits, cardType, expiryMonth, expiryYear, nameOnCard, cvv, isDefault } = body;

    if (!lastFourDigits || !cardType || !expiryMonth || !expiryYear || !nameOnCard) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      const userId = decoded.id;

      
      if (isDefault) {
        await query(
          `UPDATE saved_cards SET is_default = FALSE WHERE user_id = $1`,
          [userId]
        );
      }

      
      const encryptedCvv = cvv ? encrypt(cvv) : null;

      const result = await query(
        `INSERT INTO saved_cards (user_id, last_four_digits, card_type, expiry_month, expiry_year, name_on_card, encrypted_cvv, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, last_four_digits, card_type, expiry_month, expiry_year, name_on_card, is_default, created_at`,
        [userId, lastFourDigits, cardType, expiryMonth, expiryYear, nameOnCard, encryptedCvv, isDefault || false]
      );

      return NextResponse.json(result.rows[0]);
    } catch (error: any) {
      if (error.name === "JsonWebTokenError") {
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error saving card:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

