import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

type Props = {
  params: { id: string }
}

export async function GET(
  request: NextRequest,
  props: Props
) {
  try {
    const { id } = await Promise.resolve(props.params);

    
    const result = await query(`
      SELECT 
        s.subscription_type,
        s.price,
        s.package_type,
        sd.delivery_dates,
        sd.delivery_address,
        sd.city,
        sd.postcode,
        sd.first_name,
        sd.last_name,
        sd.email,
        pp.retail_value,
        f.farm_id,
        f.farm_name,
        f.description as farm_description,
        f.address as farm_address,
        COALESCE(
          json_agg(
            json_build_object(
              'name', p.product_name,
              'quantity', si.quantity,
              'unitText', si.unit_text,
              'originalPrice', p.unit_price * si.quantity,
              'finalPrice', si.price_per_unit * si.quantity,
              'savings', (p.unit_price - si.price_per_unit) * si.quantity
            )
          ) FILTER (WHERE si.subscription_item_id IS NOT NULL),
          '[]'
        ) as items
      FROM subscriptions s
      JOIN subscription_delivery_details sd ON s.subscription_id = sd.subscription_id
      LEFT JOIN subscription_items si ON s.subscription_id = si.subscription_id
      LEFT JOIN Products p ON si.product_id = p.product_id
      LEFT JOIN premade_packages pp ON s.premade_package_id = pp.package_id
      LEFT JOIN Farms f ON (pp.farm_id = f.farm_id OR p.farm_id = f.farm_id)
      WHERE s.subscription_id = $1
      GROUP BY s.subscription_id, sd.detail_id, sd.first_name, sd.last_name, sd.email, pp.retail_value, f.farm_id, f.farm_name, f.description, f.address
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const subscription = result.rows[0];
    const items = subscription.items || [];

    
    let originalTotal;
    if (subscription.package_type === 'premade') {
      originalTotal = Number(subscription.retail_value || 0);
    } else {
      originalTotal = items.reduce((sum: number, item: any) => sum + Number(item.originalPrice), 0);
    }
    const finalTotal = items.reduce((sum: number, item: any) => sum + Number(item.finalPrice), 0);
    const totalSavings = originalTotal - finalTotal;

    return NextResponse.json({
      subscriptionType: subscription.subscription_type,
      price: subscription.price,
      packageType: subscription.package_type,
      deliveryDates: subscription.delivery_dates,
      deliveryAddress: subscription.delivery_address,
      city: subscription.city,
      postcode: subscription.postcode,
      customerName: subscription.first_name && subscription.last_name 
        ? `${subscription.first_name} ${subscription.last_name}`.trim()
        : null,
      customerEmail: subscription.email,
      items,
      originalTotal,
      finalTotal,
      totalSavings,
      retailValue: subscription.retail_value,
      farm: subscription.farm_id ? {
        id: subscription.farm_id,
        name: subscription.farm_name,
        description: subscription.farm_description,
        address: subscription.farm_address,
      } : null
    });

  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription details" },
      { status: 500 }
    );
  }
} 