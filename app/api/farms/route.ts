import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const result = await query(`
      SELECT 
        f.farm_id as id,
        f.farm_name as name,
        f.description,
        f.address,
        COUNT(DISTINCT p.product_id) as product_count
      FROM Farms f
      LEFT JOIN Products p ON f.farm_id = p.farm_id
      GROUP BY f.farm_id, f.farm_name, f.description, f.address
      HAVING COUNT(DISTINCT p.product_id) > 0
      ORDER BY f.farm_name
    `);

    const farms = result.rows.map((farm: any) => ({
      id: farm.id,
      name: farm.name,
      description: farm.description,
      address: farm.address,
      productCount: parseInt(farm.product_count) || 0,
    }));

    return NextResponse.json(farms);
  } catch (error: any) {
    console.error("Error fetching farms:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

