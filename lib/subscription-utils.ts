import { query } from '@/lib/db';
import { sendSubscriptionEmail } from './email';

export const sendDeliveryReminders = async () => {
  try {
    
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const dateStr = twoDaysFromNow.toISOString().split('T')[0];

    const result = await query(`
      SELECT 
        s.subscription_id,
        s.user_id,
        sd.delivery_dates,
        sd.delivery_address,
        sd.city,
        sd.postcode,
        u.email
      FROM subscriptions s
      JOIN subscription_delivery_details sd ON s.subscription_id = sd.subscription_id
      JOIN harvesthub_users u ON s.user_id = u.id
      WHERE s.status = 'active'
    `);

    for (const subscription of result.rows) {
      const deliveryDates = subscription.delivery_dates;
      
      
      if (deliveryDates.includes(dateStr)) {
        
        const itemsResult = await query(`
          SELECT 
            si.quantity,
            p.name
          FROM subscription_items si
          JOIN Products p ON si.product_id = p.product_id
          WHERE si.subscription_id = $1
        `, [subscription.subscription_id]);

        
        await sendSubscriptionEmail(subscription.email, 'delivery_reminder', {
          subscriptionId: subscription.subscription_id,
          deliveryDate: dateStr,
          deliveryAddress: subscription.delivery_address,
          city: subscription.city,
          postcode: subscription.postcode,
          items: itemsResult.rows
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending delivery reminders:', error);
    throw error;
  }
};

export const markDeliveryComplete = async (subscriptionId: string, deliveryDate: string) => {
  try {
    const result = await query(`
      SELECT 
        s.subscription_id,
        sd.delivery_dates,
        u.email
      FROM subscriptions s
      JOIN subscription_delivery_details sd ON s.subscription_id = sd.subscription_id
      JOIN harvesthub_users u ON s.user_id = u.id
      WHERE s.subscription_id = $1
    `, [subscriptionId]);

    if (result.rows.length === 0) {
      throw new Error('Subscription not found');
    }

    const subscription = result.rows[0];
    const deliveryDates = subscription.delivery_dates;
    const nextDeliveryDate = deliveryDates.find((date: string) => date > deliveryDate);

    
    await sendSubscriptionEmail(subscription.email, 'delivery_confirmation', {
      subscriptionId,
      nextDeliveryDate,
      feedbackLink: `${process.env.NEXT_PUBLIC_BASE_URL}/feedback/${subscriptionId}`
    });

    return true;
  } catch (error) {
    console.error('Error marking delivery complete:', error);
    throw error;
  }
}; 