import { query } from '@/lib/db';

/**
 * Creates a test farm in the database
 * @returns The created farm ID
 */
export async function createTestFarm(): Promise<number> {
  try {
    
    await query(`
      CREATE TABLE IF NOT EXISTS test_subscription.farms (
        farm_id SERIAL PRIMARY KEY,
        farm_name VARCHAR(255) NOT NULL,
        description TEXT,
        address VARCHAR(255),
        contact_name VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(20)
      )
    `);
    
    
    const result = await query(`
      INSERT INTO test_subscription.farms (
        farm_name,
        description,
        address,
        contact_name,
        contact_email,
        contact_phone
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING farm_id
    `, [
      'Test Farm',
      'A test farm for API testing',
      '123 Farm Road, Test County',
      'Farmer John',
      'farmer@example.com',
      '123-456-7890'
    ]);
    
    return result.rows[0].farm_id;
  } catch (error) {
    console.error('Error creating test farm:', error);
    throw error;
  }
}

/**
 * Creates a test package in the database
 * @param farmId Farm ID for the package
 * @param packageData Package data to use
 * @returns The created package ID
 */
export async function createTestPackage(farmId: number, packageData: any): Promise<number> {
  try {
    
    await query(`
      CREATE TABLE IF NOT EXISTS test_subscription.premade_packages (
        package_id SERIAL PRIMARY KEY,
        package_name VARCHAR(255) NOT NULL,
        farm_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        retail_value DECIMAL(10,2) NOT NULL,
        plan_type VARCHAR(50) NOT NULL,
        items JSONB NOT NULL DEFAULT '[]',
        tags JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    
    const packageResult = await query(
      `INSERT INTO test_subscription.premade_packages (
        package_name,
        farm_id,
        description,
        retail_value,
        plan_type,
        items,
        tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING package_id`,
      [
        packageData.name,
        farmId,
        packageData.description,
        packageData.retailValue,
        packageData.planType,
        JSON.stringify(packageData.items || []),
        JSON.stringify(packageData.tags || [])
      ]
    );
    
    return packageResult.rows[0].package_id;
  } catch (error) {
    console.error('Error creating test package:', error);
    throw error;
  }
} 