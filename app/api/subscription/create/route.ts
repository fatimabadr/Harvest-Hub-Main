import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendSubscriptionEmail } from "@/lib/email";


const parseQuantity = (quantity: any): number => {
  
  if (typeof quantity === 'number') return quantity;
  
  
  if (typeof quantity === 'string') {
    
    const match = quantity.match(/^\d+/);
    if (match) {
      return parseInt(match[0], 10);
    }
  }
  
  throw new Error(`Invalid quantity format: ${quantity}`);
};

const parseQuantityAndUnit = (quantityString: string) => {
  const match = quantityString.match(/(\d+)(.*)/);
  if (match) {
    return {
      quantity: parseInt(match[1]),
      unitText: match[2].trim()
    };
  }
  return {
    quantity: 0,
    unitText: quantityString
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      firstName,
      lastName,
      email,
      subscriptionType,
      deliveryAddress,
      city,
      postcode,
      deliveryInstructions,
      deliveryDates,
      items,
      totalPrice
    } = body;

    
    if (!email || !subscriptionType || !deliveryAddress || !city || !postcode || !deliveryDates || !items) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: {
          email: !email ? 'Email is required' : null,
          subscriptionType: !subscriptionType ? 'Subscription type is required' : null,
          deliveryAddress: !deliveryAddress ? 'Delivery address is required' : null,
          city: !city ? 'City is required' : null,
          postcode: !postcode ? 'Postcode is required' : null,
          deliveryDates: !deliveryDates ? 'Delivery dates are required' : null,
          items: !items ? 'Items are required' : null
        }
      }, { status: 400 });
    }

    
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        error: 'Invalid items data',
        details: 'Items must be a non-empty array'
      }, { status: 400 });
    }

    
    
    let userId: number | null = null;
    try {
      const userResult = await query(
        'SELECT id FROM harvesthub_users WHERE email = $1',
        [email]
      );
      userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;
    } catch (e: any) {
      
      const msg = typeof e?.message === 'string' ? e.message : '';
      const code = (e && (e as any).code) || '';
      if (code === '42P01' || msg.includes('relation "harvesthub_users" does not exist')) {
        userId = null;
      } else {
        throw e;
      }
    }

    
    const price = Number(totalPrice);
    if (isNaN(price)) {
      throw new Error('Invalid price format');
    }

    
    await query('BEGIN');

    try {
      
      const subscriptionResult = await query(
        `INSERT INTO subscriptions (
          user_id,
          subscription_type,
          package_type,
          price,
          premade_package_id
        ) VALUES ($1, $2, $3, $4, $5) RETURNING subscription_id`,
        [userId, subscriptionType, body.packageType, price.toFixed(2), body.packageType === 'premade' ? body.package.package_id : null]
      );

      const subscriptionId = subscriptionResult.rows[0].subscription_id;

      
      await query(
        `INSERT INTO subscription_delivery_details (
          subscription_id,
          delivery_address,
          city,
          postcode,
          delivery_instructions,
          delivery_dates,
          email,
          first_name,
          last_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [subscriptionId, deliveryAddress, city, postcode, deliveryInstructions, JSON.stringify(deliveryDates), email, firstName || null, lastName || null]
      );

      
      for (const item of items) {
        try {
          let itemPrice;
          let quantity;
          let unitText;

          if (body.packageType === 'premade') {
            
            const productResult = await query(
              'SELECT unit_price, unit FROM Products WHERE product_id = $1',
              [item.id || item.product_id]
            );
            
            if (productResult.rows.length === 0) {
              throw new Error(`Product not found: ${item.id || item.product_id}`);
            }

            
            itemPrice = productResult.rows[0].unit_price;
            const { quantity: parsedQuantity, unitText: parsedUnitText } = parseQuantityAndUnit(item.quantity);
            quantity = parsedQuantity;
            unitText = parsedUnitText;
          } else {
            
            itemPrice = Number(item.price).toFixed(2);
            quantity = parseQuantity(item.quantity);
            unitText = item.unit || 'items';
          }
          
          await query(
            `INSERT INTO subscription_items (
              subscription_id,
              product_id,
              quantity,
              price_per_unit,
              unit_text
            ) VALUES ($1, $2, $3, $4, $5)`,
            [subscriptionId, item.id || item.product_id, quantity, itemPrice, unitText]
          );
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          throw new Error(`Invalid item data: ${error.message}`);
        }
      }

      
      const itemsResult = await query(`
        SELECT 
          p.product_name as name,
          si.quantity,
          si.price_per_unit,
          si.unit_text,
          p.unit_price as original_price
        FROM subscription_items si
        JOIN Products p ON si.product_id = p.product_id
        WHERE si.subscription_id = $1
      `, [subscriptionId]);

      
      const subscriptionItems = itemsResult.rows;
      const originalTotal = body.packageType === 'premade' 
        ? Number(body.retail_value || 0)  
        : subscriptionItems.reduce((sum, item) => sum + (item.original_price * item.quantity), 0);  

      const discountedTotal = body.packageType === 'premade'
        ? Number(price)  
        : subscriptionItems.reduce((sum, item) => sum + (item.price_per_unit * item.quantity), 0);  

      const savings = originalTotal - discountedTotal;

      await sendSubscriptionEmail(email, 'confirmation', {
        subscriptionId,
        subscriptionType,
        planPrice: price.toFixed(2),
        items: subscriptionItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitText: item.unit_text,
          originalPrice: body.packageType === 'premade' 
            ? Number(item.original_price).toFixed(2)  
            : (Number(item.original_price) * item.quantity).toFixed(2),
          finalPrice: body.packageType === 'premade'
            ? Number(item.price_per_unit).toFixed(2)  
            : (Number(item.price_per_unit) * item.quantity).toFixed(2),
          savings: body.packageType === 'premade'
            ? (Number(item.original_price) - Number(item.price_per_unit)).toFixed(2)  
            : ((Number(item.original_price) - Number(item.price_per_unit)) * item.quantity).toFixed(2)
        })),
        deliveryDates,
        deliveryAddress,
        city,
        postcode,
        originalTotal: originalTotal.toFixed(2),
        finalTotal: discountedTotal.toFixed(2),
        totalSavings: savings.toFixed(2),
        packageType: body.packageType
      });

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        subscriptionId,
        message: 'Subscription created successfully'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create subscription'
    }, { status: 500 });
  }
} 