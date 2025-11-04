import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "fallback-secret";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

      const { id } = await params;
      const orderId = parseInt(id);

      
      const orderResult = await query(
        `SELECT 
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
          o.updated_at
        FROM Orders o
        WHERE o.order_id = $1 AND o.user_id = $2`,
        [orderId, userId]
      );

      if (orderResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }

      const order = orderResult.rows[0];

      
      const itemsResult = await query(
        `SELECT 
          oi.order_item_id,
          oi.quantity,
          oi.price_at_time,
          p.product_id,
          p.product_name,
          p.unit,
          p.image_url,
          f.farm_id,
          f.farm_name,
          f.address as farm_address
        FROM OrderItems oi
        INNER JOIN Products p ON oi.product_id = p.product_id
        LEFT JOIN Farms f ON p.farm_id = f.farm_id
        WHERE oi.order_id = $1`,
        [orderId]
      );

      const orderData = {
        id: order.order_id,
        orderNumber: `ORD-${order.order_id.toString().padStart(6, '0')}`,
        email: order.email,
        firstName: order.first_name,
        lastName: order.last_name,
        phoneNumber: order.phone_number,
        total: parseFloat(order.total_amount),
        deliveryAddress: order.delivery_address,
        city: order.city,
        postcode: order.postcode,
        deliveryInstructions: order.delivery_instructions,
        status: order.status || "pending",
        orderDate: order.created_at,
        items: itemsResult.rows.map((item: any) => ({
          id: item.order_item_id,
          productId: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          price: parseFloat(item.price_at_time),
          unit: item.unit,
          imageUrl: item.image_url,
          farm: item.farm_id ? {
            id: item.farm_id,
            name: item.farm_name,
            address: item.farm_address,
          } : null,
        })),
      };

      return NextResponse.json(orderData);
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
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

