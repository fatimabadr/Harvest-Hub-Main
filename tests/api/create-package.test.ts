import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockFarmerSubscriptionData } from '../mocks/farmer-subscription-data';
import { createTestFarm } from '../helpers/farmer-subscription-test-utils';
import { createMockNextRequest } from '../mocks/next-mocks';
import { mockCreatePackage } from '../mocks/farmer-subscription-api-mocks';
import { query } from '@/lib/db';
import '../helpers/setup';

describe('Create Package API', () => {
  let testFarmId: number;

  
  beforeEach(async () => {
    
    testFarmId = await createTestFarm();
    
    
    await query('DELETE FROM test_subscription.premade_packages WHERE TRUE');
  });

  it('should create a package successfully with valid data', async () => {
    
    const { validPackage } = mockFarmerSubscriptionData;
    const packageData = {
      ...validPackage,
      farmId: testFarmId.toString()
    };
    
    const req = createMockNextRequest({
      method: 'POST',
      body: packageData
    });
    
    
    const response = await mockCreatePackage(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(201);
    expect(responseData).toHaveProperty('packageId');
    expect(responseData).toHaveProperty('message', 'Package created successfully');
    expect(responseData).toHaveProperty('success', true);
    
    
    const result = await query(
      'SELECT * FROM test_subscription.premade_packages WHERE package_id = $1',
      [responseData.packageId]
    );
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].package_name).toBe(validPackage.name);
    expect(result.rows[0].farm_id).toBe(testFarmId);
    expect(result.rows[0].plan_type).toBe(validPackage.planType);
  });

  it('should return 400 when required fields are missing', async () => {
    
    const { invalidPackage } = mockFarmerSubscriptionData;
    const req = createMockNextRequest({
      method: 'POST',
      body: invalidPackage
    });
    
    
    const response = await mockCreatePackage(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty('error', 'Missing required fields');
    expect(responseData).toHaveProperty('details');
    expect(responseData.details).toHaveProperty('farmId');
  });

  it('should return 404 when farm does not exist', async () => {
    
    const { invalidFarmPackage } = mockFarmerSubscriptionData;
    const req = createMockNextRequest({
      method: 'POST',
      body: invalidFarmPackage
    });
    
    
    const response = await mockCreatePackage(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(404);
    expect(responseData).toHaveProperty('error', 'Farm not found');
    expect(responseData).toHaveProperty('requiresValidFarm', true);
  });
}); 