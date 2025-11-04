import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";
import argon2 from "argon2";

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
      const accountType = decoded.accountType;

      if (accountType === "farmer") {
        return NextResponse.json(
          { error: "Access denied. User account required." },
          { status: 403 }
        );
      }

      const result = await query(
        "SELECT * FROM harvesthub_users WHERE id = $1 LIMIT 1",
        [userId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      const user = result.rows[0];

      return NextResponse.json({
        id: user.id,
        email: user.email,
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        phoneNumber: user.phone_number || "",
        dateOfBirth: user.date_of_birth || "",
        accountType: user.account_type || "individual",
        emailVerified: user.email_verified || false,
        loginMethod: user.login_method || "email",
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      });
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
    console.error("Error fetching user profile:", error);
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
      const accountType = decoded.accountType;

      if (accountType === "farmer") {
        return NextResponse.json(
          { error: "Access denied. User account required." },
          { status: 403 }
        );
      }

      const {
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        password,
      } = await req.json();

      
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (firstName !== undefined) {
        updates.push(`first_name = $${paramIndex}`);
        values.push(firstName);
        paramIndex++;
      }

      if (lastName !== undefined) {
        updates.push(`last_name = $${paramIndex}`);
        values.push(lastName);
        paramIndex++;
      }

      if (phoneNumber !== undefined) {
        updates.push(`phone_number = $${paramIndex}`);
        values.push(phoneNumber);
        paramIndex++;
      }

      if (dateOfBirth !== undefined) {
        updates.push(`date_of_birth = $${paramIndex}`);
        values.push(dateOfBirth || null);
        paramIndex++;
      }

      if (password !== undefined && password !== "") {
        const hashedPassword = await argon2.hash(password);
        updates.push(`password_hash = $${paramIndex}`);
        values.push(hashedPassword);
        paramIndex++;
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { error: "No fields to update" },
          { status: 400 }
        );
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const updateQuery = `
        UPDATE harvesthub_users
        SET ${updates.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING id, email, first_name, last_name, phone_number, date_of_birth, account_type, email_verified, login_method, created_at, updated_at
      `;

      const result = await query(updateQuery, values);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      const user = result.rows[0];

      return NextResponse.json({
        id: user.id,
        email: user.email,
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        phoneNumber: user.phone_number || "",
        dateOfBirth: user.date_of_birth || "",
        accountType: user.account_type || "individual",
        emailVerified: user.email_verified || false,
        loginMethod: user.login_method || "email",
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      });
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
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

