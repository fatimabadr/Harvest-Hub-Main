import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const jwtSecret = process.env.JWT_SECRET || "fallback-secret";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { email, password, twoFactorCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    
    const result = await query(
      "SELECT * FROM farmers WHERE email = $1 LIMIT 1",
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    }

    const farmer = result.rows[0];

    
    

    
    if (farmer.login_method === "google") {
      return NextResponse.json(
        { error: "Please login with Google" },
        { status: 401 }
      );
    }

    
    if (!farmer.password_hash && !farmer.password) {
      return NextResponse.json(
        { error: "Password not set for this account" },
        { status: 401 }
      );
    }

    
    const passwordToVerify = farmer.password_hash || farmer.password;

    let isPasswordValid;
    try {
      isPasswordValid = await argon2.verify(passwordToVerify, password);
    } catch (err) {
      console.error("Password verification error:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    
    

    
    const jwtToken = jwt.sign(
      {
        id: farmer.id,
        email: farmer.email,
        accountType: "farmer",
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    const nameParts = (farmer.name || "").split(" ");

    return NextResponse.json({
      token: jwtToken,
      user: {
        id: farmer.id,
        email: farmer.email,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        accountType: "farmer",
      },
    });
  } catch (error: any) {
    console.error("Farmer login error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

