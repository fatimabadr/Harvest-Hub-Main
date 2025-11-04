import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        error: 'Invalid items data',
        details: 'Items must be a non-empty array'
      }, { status: 400 });
    }

    
    const result = await query(
      `SELECT product_id, product_name 
       FROM Products 
       WHERE product_name = ANY($1)`,
      [items]
    );

    
    const productMap = new Map(result.rows.map(row => [row.product_name, row.product_id]));
    const orderedProducts = items.map(name => ({
      product_id: productMap.get(name),
      name
    }));

    
    const missingProducts = orderedProducts.filter(p => !p.product_id);
    if (missingProducts.length > 0) {
      return NextResponse.json({
        error: 'Products not found',
        details: `Could not find products: ${missingProducts.map(p => p.name).join(', ')}`
      }, { status: 404 });
    }

    return NextResponse.json(orderedProducts);
  } catch (error) {
    console.error('Error looking up products:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to look up products'
    }, { status: 500 });
  }
} 