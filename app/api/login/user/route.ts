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
      "SELECT * FROM harvesthub_users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = result.rows[0];

    
    

    
    if (user.login_method === "google") {
      return NextResponse.json(
        { error: "Please login with Google" },
        { status: 401 }
      );
    }

    
    if (!user.password_hash) {
      return NextResponse.json(
        { error: "Password not set for this account" },
        { status: 401 }
      );
    }

    let isPasswordValid;
    try {
      isPasswordValid = await argon2.verify(user.password_hash, password);
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
        id: user.id,
        email: user.email,
        accountType: user.account_type || "individual",
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        accountType: user.account_type || "individual",
      },
    });
  } catch (error: any) {
    console.error("User login error:", error);
    return NextResponse.json(
      {
        error: "Login failed",
        details: error?.message || "Unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

