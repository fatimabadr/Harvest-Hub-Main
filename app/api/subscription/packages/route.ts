import { NextRequest, NextResponse } from "next/server";
import { pool, query, getClient } from "@/lib/db";


const packagesCache = new Map<string, { data: any; expiresAt: number }>();
const PACKAGES_TTL_MS = 60_000; 

async function fetchPackages(farmId?: string | null, planType?: string | null) {
  
  let whereClause = "";
  const params: any[] = [];
  let paramIndex = 1;

  if (farmId) {
    whereClause += ` WHERE p.farm_id = $${paramIndex}`;
    params.push(farmId);
    paramIndex++;
  }

  if (planType) {
    whereClause += farmId ? ` AND p.plan_type = $${paramIndex}` : ` WHERE p.plan_type = $${paramIndex}`;
    params.push(planType);
    paramIndex++;
  }

  const baseQuery = `
      SELECT 
        p.package_id,
        p.package_name,
        p.description,
        p.retail_value,
        p.plan_type,
        p.created_at,
        p.farm_id,
        p.items,
        p.tags,
        f.farm_name,
        f.address as farm_location
      FROM premade_packages p
      LEFT JOIN farms f ON p.farm_id = f.farm_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT 12
    `;
  const result = params.length > 0 ? await query(baseQuery, params) : await query(baseQuery);
  return result.rows || [];
}

const parseUnit = (unitStr: string) => {
  if (typeof unitStr === "number") {
    return {
      value: unitStr,
      unit: "units",
    };
  }

  const match = unitStr.match(/^(\d+)\s*(.+)$/);
  if (match) {
    return {
      value: parseInt(match[1]),
      unit: match[2].trim(),
    };
  }

  const numericValue = parseInt(unitStr);
  if (!isNaN(numericValue)) {
    return {
      value: numericValue,
      unit: "units",
    };
  }

  return { value: 1, unit: unitStr.trim() || "units" };
};

const createTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS premade_packages (
        package_id SERIAL PRIMARY KEY,
        package_name VARCHAR(255) NOT NULL,
        farm_id INTEGER NOT NULL REFERENCES farms(farm_id),
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

interface PackageItem {
  name: string;
  quantity: string;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const farmId = url.searchParams.get("farmId");
    const planType = url.searchParams.get("planType");
    
    
    const key = `${planType || "all"}_${farmId || "all"}`;
    const now = Date.now();
    const cached = packagesCache.get(key);
    if (cached && cached.expiresAt > now) {
      return NextResponse.json(cached.data);
    }

    const data = await fetchPackages(farmId, planType);
    packagesCache.set(key, { data, expiresAt: now + PACKAGES_TTL_MS });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch packages",
      },
      { status: 500 }
    );
  }
}




export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received request body:", body);
    const {
      name,
      farmer,
      farmId,
      description,
      retailValue,
      items,
      tags,
      planType,
    } = body;

    const client = await getClient();
    try {
      await client.query("BEGIN");

      const processedItems = items.map((item: PackageItem) => {
        const { value: quantityValue, unit: quantityUnit } = parseUnit(
          item.quantity
        );
        return {
          name: item.name,
          quantity: `${quantityValue} ${quantityUnit}`,
        };
      });

      console.log("Creating package with data:", {
        name,
        farmId,
        description,
        retailValue,
        planType,
        items: processedItems,
        tags,
      });
      const packageResult = await client.query(
        `INSERT INTO premade_packages (
          package_name,
          farm_id,
          description,
          retail_value,
          plan_type,
          items,
          tags,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING package_id`,
        [
          name,
          farmId,
          description,
          retailValue,
          planType,
          JSON.stringify(processedItems),
          JSON.stringify(tags),
        ]
      );

      const packageId = packageResult.rows[0].package_id;
      console.log("Created package with ID:", packageId);

      await client.query("COMMIT");
      console.log("Transaction committed successfully");
      return NextResponse.json({
        success: true,
        message: "Package created successfully",
        packageId,
      });
    } catch (error) {
      console.error("Error in transaction:", error);
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create package",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const packageId = url.searchParams.get("packageId");

    
    if (!packageId) {
      return NextResponse.json(
        { error: "packageId is required to delete a package" },
        { status: 400 }
      );
    }

    
    const result = await query(
      `DELETE FROM premade_packages WHERE package_id = $1 RETURNING package_id`,
      [packageId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Package deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting package(s):", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete package(s)",
      },
      { status: 500 }
    );
  }
}
