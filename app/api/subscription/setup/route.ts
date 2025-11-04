import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const createPackagesTable = async () => {
  try {
    await query(`
      DROP TABLE IF EXISTS premade_packages CASCADE;
      
      CREATE TABLE premade_packages (
        package_id SERIAL PRIMARY KEY,
        package_name VARCHAR(255) NOT NULL,
        farm_id INTEGER NOT NULL REFERENCES farms(farm_id),
        description TEXT NOT NULL,
        retail_value DECIMAL(10,2) NOT NULL,
        plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('weekly', 'biweekly', 'monthly')),
        items JSONB NOT NULL DEFAULT '[]',
        tags JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    return true;
  } catch (error) {
    console.error("Error creating packages table:", error);
    throw error;
  }
};

const createAllTables = async () => {
  try {
    
    await query(`
      CREATE TABLE IF NOT EXISTS harvesthub_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100)
      );
    `);

    await query(`
      DROP TABLE IF EXISTS subscription_emails CASCADE;
      DROP TABLE IF EXISTS subscription_items CASCADE;
      DROP TABLE IF EXISTS subscription_delivery_details CASCADE;
      DROP TABLE IF EXISTS subscriptions CASCADE;
      DROP TABLE IF EXISTS premade_packages CASCADE;

      CREATE TABLE premade_packages (
        package_id SERIAL PRIMARY KEY,
        package_name VARCHAR(255) NOT NULL,
        farm_id INTEGER NOT NULL REFERENCES farms(farm_id),
        description TEXT NOT NULL,
        retail_value DECIMAL(10,2) NOT NULL,
        plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('weekly', 'biweekly', 'monthly')),
        items JSONB NOT NULL DEFAULT '[]',
        tags JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE subscriptions (
        subscription_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES harvesthub_users(id),
        subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('weekly', 'biweekly', 'monthly')),
        package_type VARCHAR(20) NOT NULL CHECK (package_type IN ('custom', 'premade')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
        price DECIMAL(10,2) NOT NULL,
        premade_package_id INTEGER REFERENCES premade_packages(package_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE subscription_delivery_details (
        detail_id SERIAL PRIMARY KEY,
        subscription_id INTEGER REFERENCES subscriptions(subscription_id),
        delivery_address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        postcode VARCHAR(10) NOT NULL,
        delivery_instructions TEXT,
        delivery_dates JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE subscription_items (
        subscription_item_id SERIAL PRIMARY KEY,
        subscription_id INTEGER REFERENCES subscriptions(subscription_id),
        product_id INTEGER REFERENCES Products(product_id),
        quantity INTEGER NOT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        unit_text VARCHAR(50) NOT NULL DEFAULT 'items',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE subscription_emails (
        email_id SERIAL PRIMARY KEY,
        subscription_id INTEGER REFERENCES subscriptions(subscription_id),
        email_type VARCHAR(50) NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'sent',
        template_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    return true;
  } catch (error) {
    console.error("Error creating all tables:", error);
    throw error;
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (body.action === 'recreate_packages_table') {
      await createPackagesTable();
      return NextResponse.json({ 
        success: true, 
        message: 'Successfully recreated packages table' 
      });
    }
    
    if (body.action === 'recreate_all_tables') {
      await createAllTables();
      return NextResponse.json({ 
        success: true, 
        message: 'Successfully recreated all subscription tables' 
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in setup:", error);
    return NextResponse.json(
      { error: "Failed to perform setup action" },
      { status: 500 }
    );
  }
} 