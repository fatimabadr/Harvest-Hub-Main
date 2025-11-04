import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockFarmerSubscriptionData } from '../mocks/farmer-subscription-data';
import { createTestFarm, createTestPackage } from '../helpers/farmer-subscription-test-utils';
import { createMockNextRequest } from '../mocks/next-mocks';
import { mockGetFarmPackages } from '../mocks/farmer-subscription-api-mocks';
import '../helpers/setup';

describe('Get Farm Packages API', () => {
  let testFarmId: number;

  
  beforeEach(async () => {
    
    testFarmId = await createTestFarm();
    
    
    const { validPackage } = mockFarmerSubscriptionData;
    await createTestPackage(testFarmId, validPackage);
    await createTestPackage(testFarmId, {
      ...validPackage,
      name: 'Second Test Package',
      description: 'Another test package'
    });
  });

  it('should retrieve farm packages successfully', async () => {
    
    const req = createMockNextRequest();
    const url = new URL('http://test.com/api/subscription/packages/farmer');
    url.searchParams.append('farmId', testFarmId.toString());
    Object.defineProperty(req, 'url', { value: url.toString() });
    
    
    const response = await mockGetFarmPackages(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(200);
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBe(2);
    expect(responseData[0]).toHaveProperty('name');
    expect(responseData[0]).toHaveProperty('description');
    expect(responseData[0]).toHaveProperty('retailValue');
    expect(responseData[0]).toHaveProperty('planType', 'weekly');
    expect(responseData[0]).toHaveProperty('items');
    expect(responseData[0]).toHaveProperty('tags');
    expect(responseData[0]).toHaveProperty('farmId', testFarmId);
  });

  it('should return 400 when farmId is missing', async () => {
    
    const req = createMockNextRequest();
    const url = new URL('http://test.com/api/subscription/packages/farmer');
    
    Object.defineProperty(req, 'url', { value: url.toString() });
    
    
    const response = await mockGetFarmPackages(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty('error', 'Farm ID is required');
  });

  it('should return 404 when farm does not exist', async () => {
    
    const req = createMockNextRequest();
    const url = new URL('http://test.com/api/subscription/packages/farmer');
    url.searchParams.append('farmId', '9999'); 
    Object.defineProperty(req, 'url', { value: url.toString() });
    
    
    const response = await mockGetFarmPackages(req);
    const responseData = await response.json();
    
    
    expect(response.status).toBe(404);
    expect(responseData).toHaveProperty('error', 'Farm not found');
  });
}); 