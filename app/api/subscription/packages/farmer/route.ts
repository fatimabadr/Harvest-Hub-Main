import { NextResponse } from "next/server";
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });


const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS premade_packages (
        package_id SERIAL PRIMARY KEY,
        package_name VARCHAR(255) NOT NULL,
        farm_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        retail_value DECIMAL(10,2) NOT NULL,
        plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('weekly', 'biweekly', 'monthly')),
        items JSONB NOT NULL DEFAULT '[]',
        tags JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
};

export async function GET(request: Request) {
  try {
    
    await createTables();

    
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get('farmId');

    if (!farmId) {
      return NextResponse.json(
        { error: "Farm ID is required" },
        { status: 400 }
      );
    }

    
    const result = await pool.query(`
      SELECT 
        package_id as id,
        package_name as name,
        description,
        retail_value::float as "retailValue",
        plan_type as "planType",
        created_at as "createdAt",
        tags,
        items,
        farm_id as "farmId",
        (SELECT farm_name FROM farms WHERE farm_id = premade_packages.farm_id) as "farmName",
        (SELECT description FROM farms WHERE farm_id = premade_packages.farm_id) as "farmDescription",
        (SELECT address FROM farms WHERE farm_id = premade_packages.farm_id) as "farmLocation"
      FROM premade_packages
      WHERE farm_id = $1
      ORDER BY created_at DESC
    `, [farmId]);

    
    const transformedPackages = result.rows.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      retailValue: Number(pkg.retailValue),
      itemCount: Array.isArray(pkg.items) ? pkg.items.length : 0,
      planType: pkg.planType,
      createdAt: pkg.createdAt,
      tags: pkg.tags || [],
      items: pkg.items || [],
      farmName: pkg.farmName,
      farmDescription: pkg.farmDescription,
      farmLocation: pkg.farmLocation
    }));

    return NextResponse.json(transformedPackages);
  } catch (error) {
    console.error("Error fetching farm packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
} 