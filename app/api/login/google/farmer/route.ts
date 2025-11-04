import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const jwtSecret = process.env.JWT_SECRET || "fallback-secret";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Google token is required" },
        { status: 400 }
      );
    }

    
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

    const { email } = googleUser;

    
    const result = await query(
      "SELECT * FROM farmers WHERE email = $1 LIMIT 1",
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Farmer account not found. Please register first." },
        { status: 404 }
      );
    }

    const farmer = result.rows[0];

    
    const jwtToken = jwt.sign(
      {
        id: farmer.id,
        email: farmer.email,
        accountType: "farmer",
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token: jwtToken,
      user: {
        id: farmer.id,
        email: farmer.email,
        firstName: farmer.name?.split(" ")[0] || "",
        lastName: farmer.name?.split(" ").slice(1).join(" ") || "",
        accountType: "farmer",
      },
    });
  } catch (error: any) {
    console.error("Google login error:", error);
    return NextResponse.json(
      {
        error: "Google authentication failed",
        details: error?.message || "Unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

