import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "fallback-secret";


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      const { id } = await params;
      const addressId = parseInt(id);

      
      const checkResult = await query(
        "SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2",
        [addressId, userId]
      );

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Address not found" },
          { status: 404 }
        );
      }

      await query(
        "DELETE FROM user_addresses WHERE id = $1 AND user_id = $2",
        [addressId, userId]
      );

      return NextResponse.json({ success: true });
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
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

