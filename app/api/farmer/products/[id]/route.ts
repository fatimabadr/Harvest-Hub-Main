import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "fallback-secret";


async function getFarmerFarmId(farmerId: number): Promise<number | null> {
  const farmResult = await query(
    "SELECT farm_id FROM Farms WHERE farmer_id = $1 LIMIT 1",
    [farmerId]
  );
  return farmResult.rows.length > 0 ? farmResult.rows[0].farm_id : null;
}


async function verifyProductOwnership(productId: number, farmId: number): Promise<boolean> {
  const result = await query(
    "SELECT farm_id FROM Products WHERE product_id = $1 LIMIT 1",
    [productId]
  );
  return result.rows.length > 0 && result.rows[0].farm_id === farmId;
}


export async function GET(
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
    const decoded = jwt.verify(token, jwtSecret) as any;

    if (decoded.accountType !== "farmer") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const farmId = await getFarmerFarmId(decoded.id);
    if (!farmId) {
      return NextResponse.json(
        { error: "No farm linked to this account" },
        { status: 404 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);
    const result = await query(
      `SELECT 
        product_id as id,
        product_name as name,
        unit_price as price,
        unit,
        category,
        image_url
      FROM Products 
      WHERE product_id = $1 AND farm_id = $2`,
      [productId, farmId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const product = result.rows[0];
    return NextResponse.json({
      ...product,
      price: parseFloat(product.price),
    });
  } catch (error: any) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    const decoded = jwt.verify(token, jwtSecret) as any;

    if (decoded.accountType !== "farmer") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const farmId = await getFarmerFarmId(decoded.id);
    if (!farmId) {
      return NextResponse.json(
        { error: "No farm linked to this account" },
        { status: 404 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);
    
    
    if (!(await verifyProductOwnership(productId, farmId))) {
      return NextResponse.json(
        { error: "Product not found or access denied" },
        { status: 404 }
      );
    }

    const { name, price, unit, category, image_url } = await req.json();

    if (!name || !price || !unit || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await query(
      `UPDATE Products 
       SET product_name = $1, 
           unit_price = $2, 
           unit = $3, 
           category = $4,
           image_url = $5
       WHERE product_id = $6 AND farm_id = $7`,
      [name, price, unit, category, image_url || null, productId, farmId]
    );

    return NextResponse.json({ 
      message: "Product updated successfully",
      id: productId 
    });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


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
    const decoded = jwt.verify(token, jwtSecret) as any;

    if (decoded.accountType !== "farmer") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const farmId = await getFarmerFarmId(decoded.id);
    if (!farmId) {
      return NextResponse.json(
        { error: "No farm linked to this account" },
        { status: 404 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);
    
    
    if (!(await verifyProductOwnership(productId, farmId))) {
      return NextResponse.json(
        { error: "Product not found or access denied" },
        { status: 404 }
      );
    }

    await query(
      "DELETE FROM Products WHERE product_id = $1 AND farm_id = $2",
      [productId, farmId]
    );

    return NextResponse.json({ 
      message: "Product deleted successfully" 
    });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

