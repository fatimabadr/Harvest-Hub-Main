import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";


let farmsCache: { data: any; expiresAt: number } | null = null;
const FARMS_TTL_MS = 60_000; 

async function fetchFarms() {
  
  const result = await query(`
      SELECT 
        f.farm_id,
        f.farm_name,
        f.description,
        f.address as location,
        (
          SELECT ARRAY_AGG(DISTINCT category)
          FROM (
            SELECT DISTINCT category 
            FROM Products 
            WHERE farm_id = f.farm_id 
            LIMIT 10
          ) cat
        ) as specialties,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', product_id,
                'name', product_name,
                'price', unit_price,
                'unit', unit,
                'category', category,
                'organic', true,
                'image_url', image_url
              )
              ORDER BY product_id
            )
            FROM (
              SELECT product_id, product_name, unit_price, unit, category, image_url
              FROM Products
              WHERE farm_id = f.farm_id
              ORDER BY product_id
              LIMIT 15
            ) p
          ),
          '[]'
        ) as products
      FROM Farms f
      WHERE EXISTS (SELECT 1 FROM Products WHERE farm_id = f.farm_id)
      ORDER BY f.farm_id
      LIMIT 20
    `);
  return result.rows || [];
}

const createTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS Farms (
        farm_id SERIAL PRIMARY KEY,
        farm_name VARCHAR(255) NOT NULL,
        description TEXT,
        address TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS Products (
        product_id SERIAL PRIMARY KEY,
        farm_id INTEGER NOT NULL REFERENCES Farms(farm_id),
        product_name VARCHAR(255) NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
};

export async function GET(req: NextRequest) {
  try {
    const now = Date.now();
    if (farmsCache && farmsCache.expiresAt > now) {
      return NextResponse.json(farmsCache.data);
    }

    const data = await fetchFarms();
    farmsCache = { data, expiresAt: now + FARMS_TTL_MS };
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching farms with products:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch farms with products";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}



