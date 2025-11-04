import { query, withTransaction } from '@/lib/db';

/**
 * Creates a test subscription in the database
 * @param userId User ID for the subscription
 * @param subscriptionData Subscription data to use
 * @returns The created subscription ID
 */
export async function createTestSubscription(userId: number, subscriptionData: any): Promise<number> {
  try {
    return await withTransaction(async (client) => {
      
      const subscriptionResult = await client.query(
        `INSERT INTO test_subscription.subscriptions (
          user_id,
          subscription_type,
          package_type,
          price,
          premade_package_id
        ) VALUES ($1, $2, $3, $4, $5) RETURNING subscription_id`,
        [
          userId, 
          subscriptionData.subscriptionType, 
          subscriptionData.packageType || 'custom',
          subscriptionData.totalPrice,
          subscriptionData.packageType === 'premade' ? subscriptionData.package?.package_id : null
        ]
      );
      
      const subscriptionId = subscriptionResult.rows[0].subscription_id;
  
      
      await client.query(
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
          subscriptionData.deliveryAddress, 
          subscriptionData.city, 
          subscriptionData.postcode, 
          subscriptionData.deliveryInstructions || null,
          JSON.stringify(subscriptionData.deliveryDates)
        ]
      );
  
      
      if (subscriptionData.items && Array.isArray(subscriptionData.items)) {
        for (const item of subscriptionData.items) {
          await client.query(
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
  
      return subscriptionId;
    });
  } catch (error) {
    console.error('Error creating test subscription:', error);
    throw error;
  }
}

/**
 * Gets a test user ID by email
 * @param email User email to look up
 * @returns User ID
 */
export async function getTestUserId(email: string): Promise<number> {
  const userResult = await query(
    'SELECT id FROM test_subscription.harvesthub_users WHERE email = $1',
    [email]
  );
  
  if (userResult.rows.length === 0) {
    throw new Error(`Test user with email ${email} not found`);
  }
  
  return userResult.rows[0].id;
}

/**
 * Cleans up test subscription data
 * @param subscriptionId Subscription ID to clean up
 */
export async function cleanupTestSubscription(subscriptionId: number): Promise<void> {
  try {
    await withTransaction(async (client) => {
      await client.query('DELETE FROM test_subscription.subscription_emails WHERE subscription_id = $1', [subscriptionId]);
      await client.query('DELETE FROM test_subscription.subscription_items WHERE subscription_id = $1', [subscriptionId]);
      await client.query('DELETE FROM test_subscription.subscription_delivery_details WHERE subscription_id = $1', [subscriptionId]);
      await client.query('DELETE FROM test_subscription.subscriptions WHERE subscription_id = $1', [subscriptionId]);
    });
  } catch (error) {
    console.error('Failed to clean up test subscription:', error);
    throw error;
  }
} 