import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockSubscriptionData } from '../mocks/subscription-data';
import { createTestSubscription, getTestUserId } from '../helpers/subscription-test-utils';
import { createMockNextRequest } from '../mocks/next-mocks';
import { mockGetSubscription } from '../mocks/subscription-api-mocks';
import '../helpers/setup';

describe('Get Subscription API', () => {
  let testSubscriptionId: number;

  
  beforeEach(async () => {
    
    const userId = await getTestUserId('test@example.com');
    
    
    const { validSubscription } = mockSubscriptionData;
    testSubscriptionId = await createTestSubscription(userId, validSubscription);
  });

  it('should retrieve subscription details successfully', async () => {
    
    const req = createMockNextRequest();
    const params = { id: testSubscriptionId.toString() };
    
    
    const response = await mockGetSubscription(req, { params });
    const responseData = await response.json();
    
    
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty('subscriptionType', 'weekly');
    expect(responseData).toHaveProperty('price');
    expect(responseData).toHaveProperty('deliveryDates');
    expect(responseData).toHaveProperty('deliveryAddress', '123 Test Street');
    expect(responseData).toHaveProperty('items');
    expect(Array.isArray(responseData.items)).toBe(true);
  });

  it('should return 404 when subscription does not exist', async () => {
    
    const req = createMockNextRequest();
    const params = { id: '99999' }; 
    
    
    const response = await mockGetSubscription(req, { params });
    const responseData = await response.json();
    
    
    expect(response.status).toBe(404);
    expect(responseData).toHaveProperty('error', 'Subscription not found');
  });
}); 