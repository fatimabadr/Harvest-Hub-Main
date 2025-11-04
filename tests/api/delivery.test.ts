import { describe, it, expect, beforeEach } from '@jest/globals';
import { query } from '@/lib/db';
import { createMockNextRequest } from '../mocks/next-mocks';
import { mockMarkDeliveryComplete } from '../mocks/subscription-api-mocks';
import { createTestSubscription, getTestUserId } from '../helpers/subscription-test-utils';
import { mockSubscriptionData } from '../mocks/subscription-data';
import '../helpers/setup';

describe('Subscription Delivery API', () => {
  let testSubscriptionId: number;

  
  beforeEach(async () => {
    
    
    
    const userId = await getTestUserId('test@example.com');
    
    
    const { validSubscription } = mockSubscriptionData;
    testSubscriptionId = await createTestSubscription(userId, validSubscription);
  });

  it('should mark a delivery as complete', async () => {
    
    const mockDeliveryData = {
      subscriptionId: testSubscriptionId,
      deliveryDate: '2024-07-01'
    };
    
    const req = createMockNextRequest({
      method: 'POST',
      body: mockDeliveryData
    });
    
    
    const response = await mockMarkDeliveryComplete(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('message', 'Delivery marked as complete');
  });

  it('should return 400 when required fields are missing', async () => {
    
    const mockIncompleteData = {
      subscriptionId: testSubscriptionId
    };
    
    const req = createMockNextRequest({
      method: 'POST',
      body: mockIncompleteData
    });
    
    
    const response = await mockMarkDeliveryComplete(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty('error', 'Missing required fields');
  });

  it('should return 404 when subscription does not exist', async () => {
    
    const mockDeliveryData = {
      subscriptionId: 99999, 
      deliveryDate: '2024-07-01'
    };
    
    const req = createMockNextRequest({
      method: 'POST',
      body: mockDeliveryData
    });
    
    
    const response = await mockMarkDeliveryComplete(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(404);
    expect(responseData).toHaveProperty('error', 'Subscription not found');
  });
}); 