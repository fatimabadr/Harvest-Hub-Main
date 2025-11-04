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

      
      const regularOrdersResult = await query(
        `SELECT DISTINCT ON (o.order_id)
          o.order_id,
          o.email,
          o.first_name,
          o.last_name,
          o.phone_number,
          o.total_amount,
          o.delivery_address,
          o.city,
          o.postcode,
          o.delivery_instructions,
          o.status,
          o.created_at,
          o.updated_at,
          (SELECT f.farm_id FROM OrderItems oi2 
           INNER JOIN Products p2 ON oi2.product_id = p2.product_id 
           INNER JOIN Farms f ON p2.farm_id = f.farm_id 
           WHERE oi2.order_id = o.order_id LIMIT 1) as farm_id,
          (SELECT f.farm_name FROM OrderItems oi2 
           INNER JOIN Products p2 ON oi2.product_id = p2.product_id 
           INNER JOIN Farms f ON p2.farm_id = f.farm_id 
           WHERE oi2.order_id = o.order_id LIMIT 1) as farm_name,
          (SELECT f.address FROM OrderItems oi2 
           INNER JOIN Products p2 ON oi2.product_id = p2.product_id 
           INNER JOIN Farms f ON p2.farm_id = f.farm_id 
           WHERE oi2.order_id = o.order_id LIMIT 1) as farm_address
        FROM Orders o
        WHERE o.user_id = $1
        ORDER BY o.order_id, o.created_at DESC`,
        [userId]
      );

      
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

      
      const regularOrders = regularOrdersResult.rows.map((order: any) => ({
        id: order.order_id,
        orderNumber: `ORD-${order.order_id.toString().padStart(6, '0')}`,
        type: "order",
        status: order.status || "pending",
        total: parseFloat(order.total_amount) || 0,
        orderDate: order.created_at,
        deliveryAddress: order.delivery_address,
        city: order.city,
        postcode: order.postcode,
        deliveryInstructions: order.delivery_instructions,
        farm: order.farm_id ? {
          id: order.farm_id,
          name: order.farm_name,
          address: order.farm_address,
        } : null,
      }));

      const subscriptions = subscriptionsResult.rows.map((order: any) => {
        const deliveryDates = Array.isArray(order.delivery_dates) 
          ? order.delivery_dates 
          : typeof order.delivery_dates === 'string' 
            ? JSON.parse(order.delivery_dates) 
            : [];

        return {
          id: order.subscription_id,
          orderNumber: `SUB-${order.subscription_id.toString().padStart(6, '0')}`,
          type: "subscription",
          subscriptionType: order.subscription_type,
          packageType: order.package_type,
          status: order.status || "active",
          total: parseFloat(order.price) || 0,
          orderDate: order.created_at,
          packageName: order.package_name || "Custom Package",
          packageDescription: order.package_description,
          retailValue: order.retail_value ? parseFloat(order.retail_value) : null,
          deliveryAddress: order.delivery_address,
          city: order.city,
          postcode: order.postcode,
          deliveryDates: deliveryDates,
          farm: order.farm_id ? {
            id: order.farm_id,
            name: order.farm_name,
            address: order.farm_address,
          } : null,
        };
      });

      
      const allOrders = [...regularOrders, ...subscriptions].sort(
        (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      );

      return NextResponse.json(allOrders);
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
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

