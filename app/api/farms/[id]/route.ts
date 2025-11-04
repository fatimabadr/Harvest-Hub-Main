import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    
    const farmResult = await query(
      `SELECT 
        farm_id as id,
        farm_name as name,
        description,
        address
      FROM Farms
      WHERE farm_id = $1`,
      [id]
    );

    if (farmResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Farm not found" },
        { status: 404 }
      );
    }

    const farm = farmResult.rows[0];

    
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
      ORDER BY category, product_name`,
      [id]
    );

    const products = productsResult.rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price) || 0,
      unit: p.unit,
      category: p.category,
      imageUrl: p.image_url,
    }));

    return NextResponse.json({
      ...farm,
      products,
    });
  } catch (error: any) {
    console.error("Error fetching farm:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

