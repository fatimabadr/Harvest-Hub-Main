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
      const farmerId = decoded.id;
      const accountType = decoded.accountType;

      if (accountType !== "farmer") {
        return NextResponse.json(
          { error: "Access denied. Farmer account required." },
          { status: 403 }
        );
      }

      
      const farmResult = await query(
        "SELECT farm_id FROM Farms WHERE farmer_id = $1 LIMIT 1",
        [farmerId]
      );

      if (farmResult.rows.length === 0) {
        return NextResponse.json(
          { error: "No farm linked to this account" },
          { status: 404 }
        );
      }

      const farmId = farmResult.rows[0].farm_id;

      
      const productsResult = await query(
        `SELECT 
          product_id as id,
          product_name as name,
          unit_price as price,
          unit,
          category,
          image_url
        FROM Products 
        WHERE farm_id = $1 
        ORDER BY product_name`,
        [farmId]
      );

      const products = productsResult.rows.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        unit: p.unit,
        category: p.category,
        organic: true, 
        image_url: p.image_url,
      }));

      return NextResponse.json(products);
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Error in /api/farmer/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    const decoded = jwt.verify(token, jwtSecret) as any;

    if (decoded.accountType !== "farmer") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    
    const farmResult = await query(
      "SELECT farm_id FROM Farms WHERE farmer_id = $1 LIMIT 1",
      [decoded.id]
    );

    if (farmResult.rows.length === 0) {
      return NextResponse.json(
        { error: "No farm linked to this account" },
        { status: 404 }
      );
    }

    const farmId = farmResult.rows[0].farm_id;
    const { name, price, unit, category, image_url } = await req.json();

    if (!name || !price || !unit || !category) {
      return NextResponse.json(
        { error: "Missing required fields: name, price, unit, category" },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO Products (farm_id, product_name, unit_price, unit, category, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING product_id as id, product_name as name, unit_price as price, unit, category, image_url`,
      [farmId, name, price, unit, category, image_url || null]
    );

    const product = result.rows[0];
    return NextResponse.json({
      ...product,
      price: parseFloat(product.price),
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
