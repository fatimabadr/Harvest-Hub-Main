import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "fallback-secret";


async function ensureOrdersTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS Orders (
      order_id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES harvesthub_users(id),
      email VARCHAR(255) NOT NULL,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(50),
      total_amount DECIMAL(10,2) NOT NULL,
      delivery_address TEXT NOT NULL,
      city VARCHAR(100) NOT NULL,
      postcode VARCHAR(20) NOT NULL,
      delivery_instructions TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS OrderItems (
      order_item_id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES Orders(order_id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES Products(product_id),
      quantity INTEGER NOT NULL,
      price_at_time DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, deliveryAddress } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      );
    }

    if (!deliveryAddress) {
      return NextResponse.json(
        { error: "Delivery address is required" },
        { status: 400 }
      );
    }

    
    let userId: number | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, jwtSecret) as any;
        userId = decoded.id;
      } catch (error) {
        
      }
    }

    
    await ensureOrdersTable();

    
    const total = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    
    const orderResult = await query(
      `INSERT INTO Orders (
        user_id, email, first_name, last_name, phone_number,
        total_amount, delivery_address, city, postcode, delivery_instructions, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
      RETURNING order_id`,
      [
        userId,
        deliveryAddress.email,
        deliveryAddress.firstName,
        deliveryAddress.lastName,
        deliveryAddress.phoneNumber || null,
        total,
        deliveryAddress.address,
        deliveryAddress.city,
        deliveryAddress.postcode,
        deliveryAddress.deliveryInstructions || null,
      ]
    );

    const orderId = orderResult.rows[0].order_id;

    
    for (const item of items) {
      await query(
        `INSERT INTO OrderItems (order_id, product_id, quantity, price_at_time)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.productId, item.quantity, item.price]
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      total,
      message: "Order created successfully",
    });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}
