import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get("farmId");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");

    let whereClause = "";
    const params: any[] = [];
    let paramIndex = 1;

    if (farmId) {
      whereClause += ` WHERE p.farm_id = $${paramIndex}`;
      params.push(farmId);
      paramIndex++;
    }

    if (category) {
      whereClause += farmId ? ` AND p.category = $${paramIndex}` : ` WHERE p.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    const result = await query(
      `SELECT 
        p.product_id as id,
        p.product_name as name,
        p.unit_price as price,
        p.unit,
        p.category,
        p.image_url,
        f.farm_id,
        f.farm_name
      FROM Products p
      LEFT JOIN Farms f ON p.farm_id = f.farm_id
      ${whereClause}
      ORDER BY p.product_name
      LIMIT $${paramIndex}`,
      [...params, limit]
    );

    const products = result.rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price) || 0,
      unit: p.unit,
      category: p.category,
      imageUrl: p.image_url,
      farmId: p.farm_id,
      farmName: p.farm_name,
    }));

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

