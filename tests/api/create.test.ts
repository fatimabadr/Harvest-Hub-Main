import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockSubscriptionData } from '../mocks/subscription-data';
import { query } from '@/lib/db';
import { createMockNextRequest } from '../mocks/next-mocks';
import { mockCreateSubscription } from '../mocks/subscription-api-mocks';
import '../helpers/setup';


jest.mock('@/lib/email', () => ({
  sendSubscriptionEmail: jest.fn().mockResolvedValue(true)
}));

describe('Subscription Creation API', () => {
  beforeEach(async () => {
    
    jest.clearAllMocks();
    
    
    await query('DELETE FROM test_subscription.premade_packages WHERE TRUE');
  });

  it('should create a subscription successfully with valid data', async () => {
    
    const { validSubscription } = mockSubscriptionData;
    const req = createMockNextRequest({
      method: 'POST',
      body: validSubscription
    });
    
    
    const response = await mockCreateSubscription(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(201);
    expect(responseData).toHaveProperty('subscriptionId');
    expect(responseData).toHaveProperty('message', 'Subscription created successfully');
    
    
    const result = await query(
      'SELECT * FROM test_subscription.subscriptions WHERE subscription_id = $1',
      [responseData.subscriptionId]
    );
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].subscription_type).toBe(validSubscription.subscriptionType);
  });

  it('should return 400 when required fields are missing', async () => {
    
    const { invalidSubscription } = mockSubscriptionData;
    const req = createMockNextRequest({
      method: 'POST',
      body: invalidSubscription
    });
    
    
    const response = await mockCreateSubscription(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty('error', 'Missing required fields');
    expect(responseData).toHaveProperty('details');
  });

  it('should return 400 when user does not exist', async () => {
    
    const { nonExistingUserSubscription } = mockSubscriptionData;
    const req = createMockNextRequest({
      method: 'POST',
      body: nonExistingUserSubscription
    });
    
    
    const response = await mockCreateSubscription(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty('error', 'Please register an account before creating a subscription');
    expect(responseData).toHaveProperty('requiresRegistration', true);
  });

  it('should create a subscription with a premade package', async () => {
    
    await query(`
      INSERT INTO test_subscription.premade_packages (
        package_id, package_name, farm_id, description, retail_value, plan_type
      ) VALUES (1, 'Test Package', 1, 'Test Description', 29.99, 'monthly')
    `);
    
    const { validPremadePackage } = mockSubscriptionData;
    const req = createMockNextRequest({
      method: 'POST',
      body: validPremadePackage
    });
    
    
    const response = await mockCreateSubscription(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(201);
    expect(responseData).toHaveProperty('subscriptionId');
    
    
    const result = await query(
      'SELECT * FROM test_subscription.subscriptions WHERE subscription_id = $1',
      [responseData.subscriptionId]
    );
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].package_type).toBe('premade');
    expect(result.rows[0].premade_package_id).toBe(validPremadePackage.package.package_id);
  });
}); 