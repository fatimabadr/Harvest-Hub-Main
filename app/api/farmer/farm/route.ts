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

      
      const result = await query(
        "SELECT farm_id, farm_name, description, address FROM Farms WHERE farmer_id = $1 LIMIT 1",
        [farmerId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "No farm linked to this account" },
          { status: 404 }
        );
      }

      const farm = result.rows[0];

      
      const farmerResult = await query(
        "SELECT id, email, name, phone, location FROM farmers WHERE id = $1 LIMIT 1",
        [farmerId]
      );

      const farmer = farmerResult.rows[0] || {};

      
      const productsResult = await query(
        "SELECT COUNT(*) as count FROM Products WHERE farm_id = $1",
        [farm.farm_id]
      );

      
      const packagesResult = await query(
        "SELECT COUNT(*) as count FROM premade_packages WHERE farm_id = $1",
        [farm.farm_id]
      );

      return NextResponse.json({
        ...farm,
        farmer: {
          id: farmer.id,
          email: farmer.email,
          name: farmer.name,
          phone: farmer.phone,
          location: farmer.location,
        },
        product_count: parseInt(productsResult.rows[0].count) || 0,
        package_count: parseInt(packagesResult.rows[0].count) || 0,
      });
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Error in /api/farmer/farm:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function PUT(req: NextRequest) {
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

      const body = await req.json();
      const { farmName, farmDescription, farmAddress, farmerName, farmerPhone, farmerLocation } = body;

      
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

      
      if (farmName || farmDescription || farmAddress) {
        await query(
          `UPDATE Farms 
           SET farm_name = COALESCE($1, farm_name),
               description = COALESCE($2, description),
               address = COALESCE($3, address)
           WHERE farm_id = $4`,
          [farmName || null, farmDescription || null, farmAddress || null, farmId]
        );
      }

      
      if (farmerName || farmerPhone || farmerLocation) {
        await query(
          `UPDATE farmers 
           SET name = COALESCE($1, name),
               phone = COALESCE($2, phone),
               location = COALESCE($3, location)
           WHERE id = $4`,
          [farmerName || null, farmerPhone || null, farmerLocation || null, farmerId]
        );
      }

      return NextResponse.json({ 
        message: "Farm and farmer details updated successfully" 
      });
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Error updating farm:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
