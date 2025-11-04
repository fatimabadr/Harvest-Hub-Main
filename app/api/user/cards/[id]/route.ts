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
      const cardId = parseInt(id);

      
      const checkResult = await query(
        `SELECT user_id FROM saved_cards WHERE id = $1`,
        [cardId]
      );

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Card not found" },
          { status: 404 }
        );
      }

      if (checkResult.rows[0].user_id !== userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        );
      }

      await query(
        `DELETE FROM saved_cards WHERE id = $1`,
        [cardId]
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
    console.error("Error deleting card:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await req.json();
    const { isDefault } = body;
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      const userId = decoded.id;

      const { id } = await params;
      const cardId = parseInt(id);

      
      const checkResult = await query(
        `SELECT user_id FROM saved_cards WHERE id = $1`,
        [cardId]
      );

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Card not found" },
          { status: 404 }
        );
      }

      if (checkResult.rows[0].user_id !== userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        );
      }

      
      if (isDefault) {
        await query(
          `UPDATE saved_cards SET is_default = FALSE WHERE user_id = $1 AND id != $2`,
          [userId, cardId]
        );
      }

      await query(
        `UPDATE saved_cards SET is_default = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [isDefault || false, cardId]
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
    console.error("Error updating card:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

