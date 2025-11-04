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

      
      const regularOrdersResult = await query(
        `SELECT DISTINCT
          o.order_id,
          o.email as customer_email,
          o.first_name as customer_first_name,
          o.last_name as customer_last_name,
          o.phone_number as customer_phone,
          o.total_amount,
          o.delivery_address,
          o.city,
          o.postcode,
          o.delivery_instructions,
          o.status,
          o.created_at,
          o.updated_at
        FROM Orders o
        INNER JOIN OrderItems oi ON o.order_id = oi.order_id
        INNER JOIN Products p ON oi.product_id = p.product_id
        WHERE p.farm_id = $1
        ORDER BY o.created_at DESC`,
        [farmId]
      );

      
      const subscriptionsResult = await query(
        `SELECT DISTINCT
          s.subscription_id,
          s.subscription_type,
          s.package_type,
          s.status,
          s.price,
          s.created_at,
          s.updated_at,
          pp.package_name,
          pp.description as package_description,
          sd.delivery_address,
          sd.city,
          sd.postcode,
          sd.delivery_instructions,
          sd.delivery_dates,
          COALESCE(sd.email, hu.email) as customer_email,
          COALESCE(sd.first_name, hu.first_name) as customer_first_name,
          COALESCE(sd.last_name, hu.last_name) as customer_last_name
        FROM subscriptions s
        LEFT JOIN premade_packages pp ON s.premade_package_id = pp.package_id
        LEFT JOIN subscription_items si ON s.subscription_id = si.subscription_id
        LEFT JOIN Products p ON si.product_id = p.product_id
        LEFT JOIN subscription_delivery_details sd ON s.subscription_id = sd.subscription_id
        LEFT JOIN harvesthub_users hu ON s.user_id = hu.id
        WHERE (pp.farm_id = $1 OR p.farm_id = $1)
        ORDER BY s.created_at DESC`,
        [farmId]
      );

      const regularOrders = regularOrdersResult.rows.map((order: any) => ({
        id: order.order_id,
        type: "order",
        orderNumber: `ORD-${order.order_id.toString().padStart(6, '0')}`,
        status: order.status || "pending",
        price: parseFloat(order.total_amount),
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        deliveryAddress: order.delivery_address,
        city: order.city,
        postcode: order.postcode,
        deliveryInstructions: order.delivery_instructions,
        customerEmail: order.customer_email,
        customerFirstName: order.customer_first_name,
        customerLastName: order.customer_last_name,
        customerPhone: order.customer_phone,
      }));

      const subscriptions = subscriptionsResult.rows.map((sub: any) => ({
        id: sub.subscription_id,
        type: "subscription",
        orderNumber: `SUB-${sub.subscription_id.toString().padStart(6, '0')}`,
        subscriptionType: sub.subscription_type,
        packageType: sub.package_type,
        status: sub.status,
        price: parseFloat(sub.price),
        createdAt: sub.created_at,
        updatedAt: sub.updated_at,
        packageName: sub.package_name,
        packageDescription: sub.package_description,
        deliveryAddress: sub.delivery_address,
        city: sub.city,
        postcode: sub.postcode,
        deliveryInstructions: sub.delivery_instructions,
        deliveryDates: typeof sub.delivery_dates === 'string' 
          ? JSON.parse(sub.delivery_dates) 
          : sub.delivery_dates,
        customerEmail: sub.customer_email,
        customerFirstName: sub.customer_first_name,
        customerLastName: sub.customer_last_name,
      }));

      
      const allOrders = [...regularOrders, ...subscriptions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json(allOrders);
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Error in /api/farmer/orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

