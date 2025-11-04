import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "fallback-secret";


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

      
      await query(`
        CREATE TABLE IF NOT EXISTS user_addresses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          label VARCHAR(255),
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          phone_number VARCHAR(50),
          address TEXT NOT NULL,
          city VARCHAR(255) NOT NULL,
          postcode VARCHAR(20) NOT NULL,
          delivery_instructions TEXT,
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = await query(
        "SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
        [userId]
      );

      return NextResponse.json(result.rows || []);
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
    console.error("Error fetching addresses:", error);
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
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      const userId = decoded.id;

      const {
        label,
        firstName,
        lastName,
        phoneNumber,
        address,
        city,
        postcode,
        deliveryInstructions,
        isDefault,
      } = await req.json();

      
      await query(`
        CREATE TABLE IF NOT EXISTS user_addresses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          label VARCHAR(255),
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          phone_number VARCHAR(50),
          address TEXT NOT NULL,
          city VARCHAR(255) NOT NULL,
          postcode VARCHAR(20) NOT NULL,
          delivery_instructions TEXT,
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      
      if (isDefault) {
        await query(
          "UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1",
          [userId]
        );
      }

      const result = await query(
        `INSERT INTO user_addresses 
         (user_id, label, first_name, last_name, phone_number, address, city, postcode, delivery_instructions, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          userId,
          label || null,
          firstName,
          lastName,
          phoneNumber || null,
          address,
          city,
          postcode,
          deliveryInstructions || null,
          isDefault || false,
        ]
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
    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}


export async function PUT(req: NextRequest) {
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

      const {
        id,
        label,
        firstName,
        lastName,
        phoneNumber,
        address,
        city,
        postcode,
        deliveryInstructions,
        isDefault,
      } = await req.json();

      
      const checkResult = await query(
        "SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2",
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Address not found" },
          { status: 404 }
        );
      }

      
      if (isDefault) {
        await query(
          "UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1 AND id != $2",
          [userId, id]
        );
      }

      const result = await query(
        `UPDATE user_addresses 
         SET label = $3, first_name = $4, last_name = $5, phone_number = $6, 
             address = $7, city = $8, postcode = $9, delivery_instructions = $10, 
             is_default = $11, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [
          id,
          userId,
          label || null,
          firstName,
          lastName,
          phoneNumber || null,
          address,
          city,
          postcode,
          deliveryInstructions || null,
          isDefault || false,
        ]
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
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

