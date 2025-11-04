import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { query } from "@/lib/db";

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

      let user;

      if (accountType === "farmer") {
        
        const result = await query(
          "SELECT id, email, name, email_verified FROM farmers WHERE id = $1 LIMIT 1",
          [userId]
        );
        
        if (result.rows.length === 0) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        const farmer = result.rows[0];
        const nameParts = (farmer.name || "").split(" ");
        user = {
          id: farmer.id,
          email: farmer.email,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          accountType: "farmer",
        };
      } else {
        
        const result = await query(
          "SELECT id, email, first_name, last_name, account_type FROM harvesthub_users WHERE id = $1 LIMIT 1",
          [userId]
        );
        
        if (result.rows.length === 0) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        const dbUser = result.rows[0];
        user = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.first_name || "",
          lastName: dbUser.last_name || "",
          accountType: dbUser.account_type || "individual",
        };
      }

      return NextResponse.json({ user });
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Error in /api/me:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

