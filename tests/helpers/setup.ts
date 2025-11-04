
import './test-env';
import { beforeAll, afterAll, afterEach } from '@jest/globals';
import { query, endPool, withTransaction } from '@/lib/db';


beforeAll(async () => {
  try {
    
    await query('CREATE SCHEMA IF NOT EXISTS test_subscription');
    
    
    await query('SET search_path TO test_subscription, public');
    
    
    await query(`
      CREATE TABLE IF NOT EXISTS test_subscription.harvesthub_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL
      )
    `);
    
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
    
    await query(`
      CREATE TABLE IF NOT EXISTS test_subscription.subscriptions (
        subscription_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES test_subscription.harvesthub_users(id),
        subscription_type VARCHAR(20) NOT NULL,
        package_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        price DECIMAL(10,2) NOT NULL,
        premade_package_id INTEGER REFERENCES test_subscription.premade_packages(package_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS test_subscription.subscription_delivery_details (
        detail_id SERIAL PRIMARY KEY,
        subscription_id INTEGER REFERENCES test_subscription.subscriptions(subscription_id),
        delivery_address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        postcode VARCHAR(10) NOT NULL,
        delivery_instructions TEXT,
        delivery_dates JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS test_subscription.subscription_items (
        subscription_item_id SERIAL PRIMARY KEY,
        subscription_id INTEGER REFERENCES test_subscription.subscriptions(subscription_id),
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        unit_text VARCHAR(50) NOT NULL DEFAULT 'items',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS test_subscription.subscription_emails (
        email_id SERIAL PRIMARY KEY,
        subscription_id INTEGER REFERENCES test_subscription.subscriptions(subscription_id),
        email_type VARCHAR(50) NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'sent',
        template_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    
    const userResult = await query(
      'SELECT id FROM test_subscription.harvesthub_users WHERE email = $1',
      ['test@example.com']
    );
    
    
    if (userResult.rows.length === 0) {
      await query(
        'INSERT INTO test_subscription.harvesthub_users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4)',
        ['test@example.com', 'password_hash_for_testing', 'Test', 'User']
      );
    }
  } catch (error) {
    console.error('Failed to set up test schema:', error);
    throw error;
  }
});


afterEach(async () => {
  try {
    
    await withTransaction(async (client) => {
      
      await client.query('SET session_replication_role = replica;');
      
      
      await client.query('TRUNCATE test_subscription.subscription_emails CASCADE;');
      await client.query('TRUNCATE test_subscription.subscription_items CASCADE;');
      await client.query('TRUNCATE test_subscription.subscription_delivery_details CASCADE;');
      await client.query('TRUNCATE test_subscription.subscriptions CASCADE;');
      await client.query('TRUNCATE test_subscription.premade_packages CASCADE;');
      
      
      await client.query('SET session_replication_role = default;');
    });
  } catch (error) {
    console.error('Failed to clean up test data:', error);
  }
});


afterAll(async () => {
  try {
    
    await query('SET search_path TO public');
    
    
    await endPool();
    
    
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error('Failed during cleanup:', error);
  }
}); 