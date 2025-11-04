import { NextRequest, NextResponse } from "next/server";
import { markDeliveryComplete } from "@/lib/subscription-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscriptionId, deliveryDate } = body;

    if (!subscriptionId || !deliveryDate) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    await markDeliveryComplete(subscriptionId, deliveryDate);

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