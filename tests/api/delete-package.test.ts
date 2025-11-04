import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockFarmerSubscriptionData } from '../mocks/farmer-subscription-data';
import { createTestFarm, createTestPackage } from '../helpers/farmer-subscription-test-utils';
import { createMockNextRequest } from '../mocks/next-mocks';
import { mockDeletePackage } from '../mocks/farmer-subscription-api-mocks';
import { query } from '@/lib/db';
import '../helpers/setup';

describe('Delete Package API', () => {
  let testFarmId: number;
  let testPackageId: number;

  
  beforeEach(async () => {
    
    testFarmId = await createTestFarm();
    
    
    const { validPackage } = mockFarmerSubscriptionData;
    testPackageId = await createTestPackage(testFarmId, validPackage);
  });

  it('should delete a package successfully', async () => {
    
    const req = createMockNextRequest({
      method: 'DELETE'
    });
    const url = new URL('http://test.com/api/subscription/packages');
    url.searchParams.append('packageId', testPackageId.toString());
    Object.defineProperty(req, 'url', { value: url.toString() });
    
    
    const response = await mockDeletePackage(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('message', 'Package deleted successfully');
    
    
    const result = await query(
      'SELECT COUNT(*) AS count FROM test_subscription.premade_packages WHERE package_id = $1',
      [testPackageId]
    );
    expect(parseInt(result.rows[0].count, 10)).toBe(0);
  });

  it('should return 400 when package ID is missing', async () => {
    
    const req = createMockNextRequest({
      method: 'DELETE'
    });
    const url = new URL('http://test.com/api/subscription/packages');
    
    Object.defineProperty(req, 'url', { value: url.toString() });
    
    
    const response = await mockDeletePackage(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty('error', 'Package ID is required');
  });

  it('should return 404 when package does not exist', async () => {
    
    const req = createMockNextRequest({
      method: 'DELETE'
    });
    const url = new URL('http://test.com/api/subscription/packages');
    url.searchParams.append('packageId', '9999'); 
    Object.defineProperty(req, 'url', { value: url.toString() });
    
    
    const response = await mockDeletePackage(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(404);
    expect(responseData).toHaveProperty('error', 'Package not found');
  });
}); 