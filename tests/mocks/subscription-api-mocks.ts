import { NextResponse } from 'next/server';
import { query } from '@/lib/db';


export async function mockGetSubscription(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    
    const result = await query(`
      SELECT 
        s.subscription_type,
        s.price,
        s.package_type,
        sd.delivery_dates,
        sd.delivery_address,
        sd.city,
        sd.postcode
      FROM test_subscription.subscriptions s
      JOIN test_subscription.subscription_delivery_details sd ON s.subscription_id = sd.subscription_id
      WHERE s.subscription_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const subscription = result.rows[0];
    
    
    const itemsResult = await query(`
      SELECT 
        si.product_id,
        si.quantity,
        si.price_per_unit,
        si.unit_text
      FROM test_subscription.subscription_items si
      WHERE si.subscription_id = $1
    `, [id]);

    const items = itemsResult.rows.map(item => ({
      name: `Test Product ${item.product_id}`,
      quantity: item.quantity,
      unitText: item.unit_text,
      originalPrice: item.price_per_unit * item.quantity * 1.2, 
      finalPrice: item.price_per_unit * item.quantity,
      savings: (item.price_per_unit * item.quantity * 1.2) - (item.price_per_unit * item.quantity)
    }));

    
    const originalTotal = items.reduce((sum, item) => sum + item.originalPrice, 0);
    const finalTotal = items.reduce((sum, item) => sum + item.finalPrice, 0);
    const totalSavings = originalTotal - finalTotal;

    return NextResponse.json({
      subscriptionType: subscription.subscription_type,
      price: subscription.price,
      packageType: subscription.package_type,
      deliveryDates: subscription.delivery_dates,
      deliveryAddress: subscription.delivery_address,
      city: subscription.city,
      postcode: subscription.postcode,
      items,
      originalTotal,
      finalTotal,
      totalSavings
    });

  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription details" },
      { status: 500 }
    );
  }
}


export async function mockCreateSubscription(req: Request) {
  try {
    const body = await req.json();
    const { 
      email,
      subscriptionType,
      deliveryAddress,
      city,
      postcode,
      deliveryInstructions,
      deliveryDates,
      items,
      totalPrice,
      packageType,
      package: packageData
    } = body;

    
    if (!email || !subscriptionType || !deliveryAddress || !city || !postcode || !deliveryDates) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: {
          email: !email ? 'Email is required' : null,
          subscriptionType: !subscriptionType ? 'Subscription type is required' : null,
          deliveryAddress: !deliveryAddress ? 'Delivery address is required' : null,
          city: !city ? 'City is required' : null,
          postcode: !postcode ? 'Postcode is required' : null,
          deliveryDates: !deliveryDates ? 'Delivery dates are required' : null
        }
      }, { status: 400 });
    }

    
    const userResult = await query(
      'SELECT id FROM test_subscription.harvesthub_users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({
        error: 'Please register an account before creating a subscription',
        requiresRegistration: true
      }, { status: 400 });
    }

    const userId = userResult.rows[0].id;

    
    const subscriptionResult = await query(
      `INSERT INTO test_subscription.subscriptions (
        user_id,
        subscription_type,
        package_type,
        price,
        premade_package_id
      ) VALUES ($1, $2, $3, $4, $5) RETURNING subscription_id`,
      [
        userId, 
        subscriptionType, 
        packageType || 'custom', 
        totalPrice,
        packageType === 'premade' && packageData ? packageData.package_id : null
      ]
    );

    const subscriptionId = subscriptionResult.rows[0].subscription_id;

    
    await query(
      `INSERT INTO test_subscription.subscription_delivery_details (
        subscription_id,
        delivery_address,
        city,
        postcode,
        delivery_instructions,
        delivery_dates
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        subscriptionId,
        deliveryAddress,
        city,
        postcode,
        deliveryInstructions || null,
        JSON.stringify(deliveryDates)
      ]
    );

    
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await query(
          `INSERT INTO test_subscription.subscription_items (
            subscription_id,
            product_id,
            quantity,
            price_per_unit,
            unit_text
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            subscriptionId,
            item.product_id,
            item.quantity,
            item.price_per_unit,
            item.unit_text || 'items'
          ]
        );
      }
    }

    return NextResponse.json({ 
      subscriptionId, 
      message: 'Subscription created successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create subscription'
    }, { status: 500 });
  }
}


export async function mockMarkDeliveryComplete(req: Request) {
  try {
    const body = await req.json();
    const { subscriptionId, deliveryDate } = body;

    if (!subscriptionId || !deliveryDate) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    
    const subscriptionResult = await query(
      'SELECT subscription_id FROM test_subscription.subscriptions WHERE subscription_id = $1',
      [subscriptionId]
    );

    if (subscriptionResult.rows.length === 0) {
      return NextResponse.json({
        error: 'Subscription not found'
      }, { status: 404 });
    }

    
    
    return NextResponse.json({
      success: true,
      message: 'Delivery marked as complete'
    });

  } catch (error) {
    console.error('Error updating delivery status:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to update delivery status'
    }, { status: 500 });
  }
} 