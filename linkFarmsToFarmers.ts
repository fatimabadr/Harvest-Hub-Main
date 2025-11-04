import pkg from 'pg';
const { Pool } = pkg;
import argon2 from 'argon2';

const connectionString = 'postgresql://neondb_owner:npg_5zMS4EGKVoCq@ep-fragrant-frog-ahkklukm-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function linkFarmsToFarmers() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Adding farmer_id column to Farms table if it doesn\'t exist...');
    try {
      await client.query(`
        ALTER TABLE Farms 
        ADD COLUMN IF NOT EXISTS farmer_id INTEGER REFERENCES farmers(id);
      `);
      console.log('✓ farmer_id column added/verified');
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    
    const farmsResult = await client.query('SELECT farm_id, farm_name, address FROM Farms ORDER BY farm_id');
    const farms = farmsResult.rows;
    console.log(`\nFound ${farms.length} farms to link`);

    
    for (let i = 0; i < farms.length; i++) {
      const farm = farms[i];
      const farmerNumber = i + 1;
      const email = `Test${farmerNumber}@gmail.com`;
      const password = `#TestPass${farmerNumber}`;

      
      const existingFarmer = await client.query(
        'SELECT id FROM farmers WHERE email = $1',
        [email]
      );

      let farmerId: number;

      if (existingFarmer.rows.length > 0) {
        farmerId = existingFarmer.rows[0].id;
        console.log(`Farmer ${email} already exists (ID: ${farmerId})`);
      } else {
        
        const hashedPassword = await argon2.hash(password);
        const farmerResult = await client.query(
          `INSERT INTO farmers (email, password_hash, farm_name, name, phone, location, email_verified, login_method)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            email,
            hashedPassword,
            farm.farm_name,
            `Farmer ${farmerNumber}`,
            `0712345678${farmerNumber.toString().padStart(2, '0')}`,
            farm.address || 'London, UK',
            true, 
            'email'
          ]
        );
        farmerId = farmerResult.rows[0].id;
        console.log(`✓ Created farmer: ${email} (ID: ${farmerId}) - Password: ${password}`);
      }

      
      await client.query(
        'UPDATE Farms SET farmer_id = $1 WHERE farm_id = $2',
        [farmerId, farm.farm_id]
      );
      console.log(`  ✓ Linked farm "${farm.farm_name}" (ID: ${farm.farm_id}) to farmer ${email}`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Successfully linked all farms to farmers!');
    console.log('\nFarmer Login Credentials:');
    for (let i = 0; i < farms.length; i++) {
      console.log(`  Test${i + 1}@gmail.com / #TestPass${i + 1}`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error linking farms to farmers:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

linkFarmsToFarmers().catch(console.error);

