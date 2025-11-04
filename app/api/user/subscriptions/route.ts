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
      const userId = decoded.id;
      const accountType = decoded.accountType;

      if (accountType === "farmer") {
        return NextResponse.json(
          { error: "Access denied. User account required." },
          { status: 403 }
        );
      }

      
      const subscriptionsResult = await query(
        `SELECT 
          s.subscription_id,
          s.subscription_type,
          s.package_type,
          s.status,
          s.price,
          s.created_at,
          s.updated_at,
          pp.package_name,
          pp.description as package_description,
          pp.retail_value,
          sd.delivery_address,
          sd.city,
          sd.postcode,
          sd.delivery_instructions,
          sd.delivery_dates,
          f.farm_id,
          f.farm_name,
          f.description as farm_description,
          f.address as farm_address
        FROM subscriptions s
        LEFT JOIN premade_packages pp ON s.premade_package_id = pp.package_id
        LEFT JOIN subscription_delivery_details sd ON s.subscription_id = sd.subscription_id
        LEFT JOIN Farms f ON (pp.farm_id = f.farm_id OR 
          (SELECT farm_id FROM Products WHERE product_id = 
            (SELECT product_id FROM subscription_items WHERE subscription_id = s.subscription_id LIMIT 1) LIMIT 1) = f.farm_id)
        WHERE s.user_id = $1
        ORDER BY s.created_at DESC`,
        [userId]
      );

      const subscriptions = subscriptionsResult.rows.map((sub: any) => {
        const deliveryDates = Array.isArray(sub.delivery_dates) 
          ? sub.delivery_dates 
          : typeof sub.delivery_dates === 'string' 
            ? JSON.parse(sub.delivery_dates) 
            : [];
        
        
        const now = new Date();
        const nextDelivery = deliveryDates
          .map((d: string) => new Date(d))
          .filter((d: Date) => d > now)
          .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0];

        return {
          id: sub.subscription_id,
          type: sub.subscription_type,
          packageType: sub.package_type,
          status: sub.status || "active",
          price: parseFloat(sub.price) || 0,
          createdAt: sub.created_at,
          updatedAt: sub.updated_at,
          packageName: sub.package_name || "Custom Package",
          packageDescription: sub.package_description,
          retailValue: sub.retail_value ? parseFloat(sub.retail_value) : null,
          deliveryAddress: sub.delivery_address,
          city: sub.city,
          postcode: sub.postcode,
          deliveryInstructions: sub.delivery_instructions,
          deliveryDates: deliveryDates,
          nextDelivery: nextDelivery ? nextDelivery.toISOString() : null,
          farm: sub.farm_id ? {
            id: sub.farm_id,
            name: sub.farm_name,
            description: sub.farm_description,
            address: sub.farm_address,
          } : null,
        };
      });

      return NextResponse.json(subscriptions);
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
    console.error("Error fetching user subscriptions:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

