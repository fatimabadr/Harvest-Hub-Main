import pkg from 'pg';
const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_5zMS4EGKVoCq@ep-fragrant-frog-ahkklukm-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

interface Farm {
  name: string;
  description: string;
  address: string;
}

interface Product {
  name: string;
  unit: string; 
  unit_price: number;
  category: string;
}

const farms: Farm[] = [
  {
    name: "Green Valley Organic Farm",
    description: "Certified organic farm specializing in seasonal vegetables and fruits. Family-owned for three generations.",
    address: "123 Farm Lane, Somerset, BA5 8RT"
  },
  {
    name: "Meadowbrook Dairy",
    description: "Premium dairy products from grass-fed cows. Fresh milk, cheese, and yogurt delivered daily.",
    address: "456 Dairy Road, Devon, EX4 2QW"
  },
  {
    name: "Highland Poultry Co.",
    description: "Free-range chickens and eggs from the Scottish Highlands. Humanely raised and antibiotic-free.",
    address: "789 Highland Way, Inverness, IV2 7XY"
  },
  {
    name: "Sunny Orchard Fruits",
    description: "Fresh apples, pears, and stone fruits grown in our traditional orchards. Seasonal varieties available.",
    address: "321 Orchard Street, Kent, ME15 9AB"
  },
  {
    name: "Fresh Breeze Bakery Farm",
    description: "Artisanal bread and pastries made with our own grain. Traditional methods meet modern quality.",
    address: "654 Baker's Path, Yorkshire, YO10 5CD"
  },
  {
    name: "Riverbend Vegetable Farm",
    description: "Sustainable vegetable farming using natural methods. Wide variety of seasonal produce.",
    address: "987 Riverside Drive, Cambridgeshire, CB2 1EF"
  },
  {
    name: "Mountain View Berries",
    description: "Premium berries and soft fruits grown in ideal conditions. Pick-your-own available in season.",
    address: "147 Berry Lane, Herefordshire, HR1 3GH"
  },
  {
    name: "Coastal Fish & Seafood",
    description: "Fresh seafood caught daily from local waters. Sustainable fishing practices guaranteed.",
    address: "258 Harbor Road, Cornwall, TR1 4IJ"
  },
  {
    name: "Golden Fields Grain Farm",
    description: "Specialty grains, legumes, and pulses. Organic and non-GMO varieties available.",
    address: "369 Grain Avenue, Lincolnshire, LN1 6KL"
  },
  {
    name: "Heritage Herb Garden",
    description: "Fresh herbs and microgreens grown year-round. Culinary and medicinal varieties.",
    address: "741 Herb Street, Surrey, GU1 8MN"
  },
  {
    name: "Valley View Beef Ranch",
    description: "Premium grass-fed beef from local breeds. Sustainable grazing and ethical practices.",
    address: "852 Ranch Road, Derbyshire, DE1 9OP"
  },
  {
    name: "Sweet Meadow Honey",
    description: "Raw, unfiltered honey from local hives. Various floral varieties throughout the seasons.",
    address: "963 Beehive Way, Norfolk, NR2 1QR"
  },
  {
    name: "Crystal Clear Water Farm",
    description: "Fresh spring water and artisanal beverages. Natural and flavored options available.",
    address: "159 Spring Lane, Peak District, SK12 3ST"
  },
  {
    name: "Exotic Greens Specialty",
    description: "Rare and exotic vegetables and fruits. International varieties grown locally.",
    address: "357 Exotic Drive, London, SW1A 5UV"
  },
  {
    name: "Artisan Cheesemakers",
    description: "Handcrafted cheeses from various milks. Aged and fresh varieties with unique flavors.",
    address: "753 Cheese Court, Gloucestershire, GL7 7WX"
  }
];

const productCategories = [
  'Fruits',
  'Vegetables',
  'Dairy',
  'Bakery',
  'Poultry',
  'Beverages',
  'Grains & Legumes',
  'Artisanal',
  'Exotic',
  'Herbs',
  'Meat',
  'Condiments'
];


const farmProducts: Product[][] = [
  
  [
    { name: "Organic Carrots", unit: "1 kg", unit_price: 2.50, category: "Vegetables" },
    { name: "Fresh Broccoli", unit: "500 g", unit_price: 3.00, category: "Vegetables" },
    { name: "Organic Spinach", unit: "250 g", unit_price: 2.75, category: "Vegetables" },
    { name: "Baby Potatoes", unit: "1 kg", unit_price: 2.25, category: "Vegetables" },
    { name: "Cherry Tomatoes", unit: "250 g", unit_price: 3.50, category: "Vegetables" },
    { name: "Red Bell Peppers", unit: "500 g", unit_price: 4.00, category: "Vegetables" },
    { name: "Fresh Cucumbers", unit: "3 units", unit_price: 2.00, category: "Vegetables" },
    { name: "Organic Zucchini", unit: "1 kg", unit_price: 3.25, category: "Vegetables" },
    { name: "Green Beans", unit: "500 g", unit_price: 3.50, category: "Vegetables" },
    { name: "Cauliflower", unit: "1 unit", unit_price: 2.75, category: "Vegetables" },
    { name: "Sweet Corn", unit: "4 units", unit_price: 3.00, category: "Vegetables" },
    { name: "Fresh Peas", unit: "500 g", unit_price: 4.50, category: "Vegetables" }
  ],
  
  [
    { name: "Whole Milk", unit: "2 liters", unit_price: 2.80, category: "Dairy" },
    { name: "Skimmed Milk", unit: "2 liters", unit_price: 2.60, category: "Dairy" },
    { name: "Fresh Cream", unit: "500 ml", unit_price: 3.50, category: "Dairy" },
    { name: "Natural Yogurt", unit: "500 g", unit_price: 2.90, category: "Dairy" },
    { name: "Greek Yogurt", unit: "500 g", unit_price: 3.75, category: "Dairy" },
    { name: "Mature Cheddar", unit: "250 g", unit_price: 4.50, category: "Dairy" },
    { name: "Fresh Mozzarella", unit: "250 g", unit_price: 3.80, category: "Dairy" },
    { name: "Butter", unit: "250 g", unit_price: 3.20, category: "Dairy" },
    { name: "Cottage Cheese", unit: "300 g", unit_price: 2.50, category: "Dairy" },
    { name: "Sour Cream", unit: "300 ml", unit_price: 2.75, category: "Dairy" },
    { name: "Ricotta Cheese", unit: "250 g", unit_price: 3.40, category: "Dairy" },
    { name: "Cream Cheese", unit: "200 g", unit_price: 2.90, category: "Dairy" }
  ],
  
  [
    { name: "Whole Free-Range Chicken", unit: "1.5 kg", unit_price: 12.50, category: "Poultry" },
    { name: "Chicken Breast Fillets", unit: "500 g", unit_price: 8.50, category: "Poultry" },
    { name: "Chicken Thighs", unit: "500 g", unit_price: 6.75, category: "Poultry" },
    { name: "Chicken Drumsticks", unit: "1 kg", unit_price: 7.50, category: "Poultry" },
    { name: "Free-Range Eggs", unit: "12 units", unit_price: 4.50, category: "Poultry" },
    { name: "Large Free-Range Eggs", unit: "6 units", unit_price: 3.25, category: "Poultry" },
    { name: "Organic Chicken Wings", unit: "1 kg", unit_price: 7.00, category: "Poultry" },
    { name: "Ground Chicken", unit: "500 g", unit_price: 7.25, category: "Poultry" },
    { name: "Chicken Liver", unit: "250 g", unit_price: 3.50, category: "Poultry" },
    { name: "Whole Duck", unit: "2 kg", unit_price: 18.00, category: "Poultry" },
    { name: "Turkey Breast", unit: "1 kg", unit_price: 14.50, category: "Poultry" },
    { name: "Quail Eggs", unit: "12 units", unit_price: 5.50, category: "Poultry" }
  ],
  
  [
    { name: "Granny Smith Apples", unit: "1 kg", unit_price: 3.00, category: "Fruits" },
    { name: "Gala Apples", unit: "1 kg", unit_price: 3.25, category: "Fruits" },
    { name: "Conference Pears", unit: "1 kg", unit_price: 3.50, category: "Fruits" },
    { name: "Fresh Peaches", unit: "1 kg", unit_price: 4.50, category: "Fruits" },
    { name: "Plums", unit: "1 kg", unit_price: 4.00, category: "Fruits" },
    { name: "Cherries", unit: "500 g", unit_price: 6.50, category: "Fruits" },
    { name: "Apricots", unit: "500 g", unit_price: 5.00, category: "Fruits" },
    { name: "Nectarines", unit: "1 kg", unit_price: 4.75, category: "Fruits" },
    { name: "Fresh Figs", unit: "250 g", unit_price: 5.50, category: "Fruits" },
    { name: "Quince", unit: "1 kg", unit_price: 5.25, category: "Fruits" },
    { name: "Medlars", unit: "500 g", unit_price: 6.00, category: "Fruits" },
    { name: "Crab Apples", unit: "1 kg", unit_price: 3.75, category: "Fruits" }
  ],
  
  [
    { name: "Sourdough Bread", unit: "1 loaf", unit_price: 4.50, category: "Bakery" },
    { name: "Wholemeal Bread", unit: "1 loaf", unit_price: 3.50, category: "Bakery" },
    { name: "Artisan Baguette", unit: "2 units", unit_price: 3.75, category: "Bakery" },
    { name: "Multigrain Rolls", unit: "6 units", unit_price: 3.25, category: "Bakery" },
    { name: "Croissants", unit: "4 units", unit_price: 5.50, category: "Bakery" },
    { name: "Farmhouse Loaf", unit: "1 loaf", unit_price: 3.80, category: "Bakery" },
    { name: "Rye Bread", unit: "1 loaf", unit_price: 4.25, category: "Bakery" },
    { name: "Brioche", unit: "1 loaf", unit_price: 5.00, category: "Bakery" },
    { name: "Focaccia", unit: "1 unit", unit_price: 4.75, category: "Bakery" },
    { name: "Pretzel Rolls", unit: "4 units", unit_price: 4.50, category: "Bakery" },
    { name: "Ciabatta", unit: "1 loaf", unit_price: 4.00, category: "Bakery" },
    { name: "English Muffins", unit: "6 units", unit_price: 3.90, category: "Bakery" }
  ],
  
  [
    { name: "Beetroot", unit: "1 kg", unit_price: 3.00, category: "Vegetables" },
    { name: "Swiss Chard", unit: "500 g", unit_price: 3.25, category: "Vegetables" },
    { name: "Kale", unit: "250 g", unit_price: 2.50, category: "Vegetables" },
    { name: "Brussels Sprouts", unit: "500 g", unit_price: 3.50, category: "Vegetables" },
    { name: "Cabbage", unit: "1 unit", unit_price: 2.25, category: "Vegetables" },
    { name: "Leeks", unit: "3 units", unit_price: 2.75, category: "Vegetables" },
    { name: "Onions", unit: "1 kg", unit_price: 2.00, category: "Vegetables" },
    { name: "Garlic", unit: "6 bulbs", unit_price: 2.50, category: "Vegetables" },
    { name: "Shallots", unit: "500 g", unit_price: 3.75, category: "Vegetables" },
    { name: "Spring Onions", unit: "1 bunch", unit_price: 1.50, category: "Vegetables" },
    { name: "Radishes", unit: "1 bunch", unit_price: 2.00, category: "Vegetables" },
    { name: "Turnips", unit: "1 kg", unit_price: 2.75, category: "Vegetables" }
  ],
  
  [
    { name: "Strawberries", unit: "500 g", unit_price: 5.50, category: "Fruits" },
    { name: "Raspberries", unit: "250 g", unit_price: 5.00, category: "Fruits" },
    { name: "Blueberries", unit: "250 g", unit_price: 5.75, category: "Fruits" },
    { name: "Blackberries", unit: "250 g", unit_price: 4.50, category: "Fruits" },
    { name: "Redcurrants", unit: "250 g", unit_price: 4.75, category: "Fruits" },
    { name: "Blackcurrants", unit: "250 g", unit_price: 4.80, category: "Fruits" },
    { name: "Gooseberries", unit: "500 g", unit_price: 4.25, category: "Fruits" },
    { name: "Elderberries", unit: "250 g", unit_price: 5.25, category: "Fruits" },
    { name: "Cranberries", unit: "250 g", unit_price: 5.50, category: "Fruits" },
    { name: "Mulberries", unit: "250 g", unit_price: 6.00, category: "Fruits" },
    { name: "Goji Berries", unit: "100 g", unit_price: 8.50, category: "Fruits" },
    { name: "Honeyberries", unit: "250 g", unit_price: 7.50, category: "Fruits" }
  ],
  
  [
    { name: "Fresh Salmon Fillet", unit: "500 g", unit_price: 12.50, category: "Exotic" },
    { name: "Cod Fillets", unit: "500 g", unit_price: 8.50, category: "Exotic" },
    { name: "Sea Bass", unit: "1 unit", unit_price: 15.00, category: "Exotic" },
    { name: "Prawns", unit: "500 g", unit_price: 14.50, category: "Exotic" },
    { name: "Scallops", unit: "250 g", unit_price: 18.00, category: "Exotic" },
    { name: "Mussels", unit: "1 kg", unit_price: 6.50, category: "Exotic" },
    { name: "Oysters", unit: "6 units", unit_price: 12.00, category: "Exotic" },
    { name: "Sardines", unit: "500 g", unit_price: 7.50, category: "Exotic" },
    { name: "Mackerel", unit: "500 g", unit_price: 6.00, category: "Exotic" },
    { name: "Lobster", unit: "1 unit", unit_price: 25.00, category: "Exotic" },
    { name: "Crab", unit: "1 kg", unit_price: 16.00, category: "Exotic" },
    { name: "Squid", unit: "500 g", unit_price: 9.50, category: "Exotic" }
  ],
  
  [
    { name: "Organic Brown Rice", unit: "1 kg", unit_price: 4.50, category: "Grains & Legumes" },
    { name: "Quinoa", unit: "500 g", unit_price: 6.50, category: "Grains & Legumes" },
    { name: "Lentils", unit: "500 g", unit_price: 3.50, category: "Grains & Legumes" },
    { name: "Chickpeas", unit: "500 g", unit_price: 3.75, category: "Grains & Legumes" },
    { name: "Black Beans", unit: "500 g", unit_price: 4.00, category: "Grains & Legumes" },
    { name: "Oats", unit: "1 kg", unit_price: 3.25, category: "Grains & Legumes" },
    { name: "Barley", unit: "500 g", unit_price: 3.00, category: "Grains & Legumes" },
    { name: "Bulgur Wheat", unit: "500 g", unit_price: 4.25, category: "Grains & Legumes" },
    { name: "Split Peas", unit: "500 g", unit_price: 3.40, category: "Grains & Legumes" },
    { name: "Red Kidney Beans", unit: "500 g", unit_price: 3.60, category: "Grains & Legumes" },
    { name: "Wild Rice", unit: "500 g", unit_price: 8.50, category: "Grains & Legumes" },
    { name: "Buckwheat", unit: "500 g", unit_price: 4.75, category: "Grains & Legumes" }
  ],
  
  [
    { name: "Fresh Basil", unit: "1 bunch", unit_price: 2.50, category: "Herbs" },
    { name: "Fresh Rosemary", unit: "1 bunch", unit_price: 2.25, category: "Herbs" },
    { name: "Fresh Thyme", unit: "1 bunch", unit_price: 2.00, category: "Herbs" },
    { name: "Fresh Parsley", unit: "1 bunch", unit_price: 1.75, category: "Herbs" },
    { name: "Fresh Coriander", unit: "1 bunch", unit_price: 2.00, category: "Herbs" },
    { name: "Fresh Mint", unit: "1 bunch", unit_price: 2.25, category: "Herbs" },
    { name: "Fresh Oregano", unit: "1 bunch", unit_price: 2.00, category: "Herbs" },
    { name: "Fresh Sage", unit: "1 bunch", unit_price: 2.50, category: "Herbs" },
    { name: "Fresh Dill", unit: "1 bunch", unit_price: 2.25, category: "Herbs" },
    { name: "Fresh Chives", unit: "1 bunch", unit_price: 2.00, category: "Herbs" },
    { name: "Fresh Tarragon", unit: "1 bunch", unit_price: 2.75, category: "Herbs" },
    { name: "Fresh Lemongrass", unit: "3 stalks", unit_price: 2.50, category: "Herbs" }
  ],
  
  [
    { name: "Beef Steak", unit: "500 g", unit_price: 18.50, category: "Meat" },
    { name: "Ground Beef", unit: "500 g", unit_price: 8.50, category: "Meat" },
    { name: "Beef Roast", unit: "1 kg", unit_price: 16.00, category: "Meat" },
    { name: "Beef Ribs", unit: "1 kg", unit_price: 14.50, category: "Meat" },
    { name: "Beef Brisket", unit: "1 kg", unit_price: 15.50, category: "Meat" },
    { name: "Beef Stewing Meat", unit: "500 g", unit_price: 9.50, category: "Meat" },
    { name: "Beef Liver", unit: "500 g", unit_price: 6.50, category: "Meat" },
    { name: "Beef Bones", unit: "1 kg", unit_price: 4.50, category: "Meat" },
    { name: "Beef Mince", unit: "500 g", unit_price: 8.75, category: "Meat" },
    { name: "Beef Sausages", unit: "6 units", unit_price: 7.50, category: "Meat" },
    { name: "Beef Burgers", unit: "4 units", unit_price: 9.00, category: "Meat" },
    { name: "Beef Steaks (Pack)", unit: "4 units", unit_price: 22.00, category: "Meat" }
  ],
  
  [
    { name: "Wildflower Honey", unit: "500 g", unit_price: 8.50, category: "Condiments" },
    { name: "Clover Honey", unit: "500 g", unit_price: 7.50, category: "Condiments" },
    { name: "Manuka Honey", unit: "250 g", unit_price: 15.00, category: "Condiments" },
    { name: "Orange Blossom Honey", unit: "500 g", unit_price: 9.00, category: "Condiments" },
    { name: "Acacia Honey", unit: "500 g", unit_price: 8.75, category: "Condiments" },
    { name: "Lavender Honey", unit: "250 g", unit_price: 10.50, category: "Condiments" },
    { name: "Honeycomb", unit: "250 g", unit_price: 12.50, category: "Condiments" },
    { name: "Raw Honey", unit: "1 kg", unit_price: 16.00, category: "Condiments" },
    { name: "Buckwheat Honey", unit: "500 g", unit_price: 9.50, category: "Condiments" },
    { name: "Honey Spread", unit: "300 g", unit_price: 7.00, category: "Condiments" },
    { name: "Propolis Extract", unit: "30 ml", unit_price: 18.00, category: "Condiments" },
    { name: "Beeswax", unit: "100 g", unit_price: 6.50, category: "Condiments" }
  ],
  
  [
    { name: "Natural Spring Water", unit: "2 liters", unit_price: 1.50, category: "Beverages" },
    { name: "Sparkling Water", unit: "1 liter", unit_price: 2.00, category: "Beverages" },
    { name: "Apple Juice", unit: "1 liter", unit_price: 3.50, category: "Beverages" },
    { name: "Orange Juice", unit: "1 liter", unit_price: 3.75, category: "Beverages" },
    { name: "Carrot Juice", unit: "500 ml", unit_price: 4.00, category: "Beverages" },
    { name: "Beetroot Juice", unit: "500 ml", unit_price: 4.25, category: "Beverages" },
    { name: "Kombucha", unit: "500 ml", unit_price: 5.50, category: "Beverages" },
    { name: "Ginger Ale", unit: "1 liter", unit_price: 4.50, category: "Beverages" },
    { name: "Lemonade", unit: "1 liter", unit_price: 3.25, category: "Beverages" },
    { name: "Herbal Tea Blend", unit: "100 g", unit_price: 8.50, category: "Beverages" },
    { name: "Fresh Coconut Water", unit: "500 ml", unit_price: 4.75, category: "Beverages" },
    { name: "Kefir Drink", unit: "500 ml", unit_price: 5.00, category: "Beverages" }
  ],
  
  [
    { name: "Dragon Fruit", unit: "1 unit", unit_price: 6.50, category: "Exotic" },
    { name: "Passion Fruit", unit: "6 units", unit_price: 5.00, category: "Exotic" },
    { name: "Star Fruit", unit: "500 g", unit_price: 7.50, category: "Exotic" },
    { name: "Kumquats", unit: "250 g", unit_price: 5.50, category: "Exotic" },
    { name: "Persimmons", unit: "500 g", unit_price: 6.00, category: "Exotic" },
    { name: "Bok Choy", unit: "500 g", unit_price: 3.50, category: "Exotic" },
    { name: "Pak Choi", unit: "500 g", unit_price: 3.25, category: "Exotic" },
    { name: "Chinese Cabbage", unit: "1 unit", unit_price: 3.75, category: "Exotic" },
    { name: "Daikon Radish", unit: "1 kg", unit_price: 4.50, category: "Exotic" },
    { name: "Edamame", unit: "500 g", unit_price: 5.50, category: "Exotic" },
    { name: "Shiitake Mushrooms", unit: "250 g", unit_price: 6.50, category: "Exotic" },
    { name: "Enoki Mushrooms", unit: "200 g", unit_price: 5.00, category: "Exotic" }
  ],
  
  [
    { name: "Aged Cheddar", unit: "250 g", unit_price: 7.50, category: "Artisanal" },
    { name: "Blue Stilton", unit: "250 g", unit_price: 8.50, category: "Artisanal" },
    { name: "Brie", unit: "250 g", unit_price: 6.50, category: "Artisanal" },
    { name: "Camembert", unit: "250 g", unit_price: 6.75, category: "Artisanal" },
    { name: "Goat Cheese", unit: "200 g", unit_price: 7.00, category: "Artisanal" },
    { name: "Feta Cheese", unit: "250 g", unit_price: 5.50, category: "Artisanal" },
    { name: "Halloumi", unit: "250 g", unit_price: 7.25, category: "Artisanal" },
    { name: "Parmesan", unit: "200 g", unit_price: 9.50, category: "Artisanal" },
    { name: "Gruyère", unit: "250 g", unit_price: 8.00, category: "Artisanal" },
    { name: "Manchego", unit: "250 g", unit_price: 7.75, category: "Artisanal" },
    { name: "Gouda", unit: "250 g", unit_price: 6.50, category: "Artisanal" },
    { name: "Cheese Selection Box", unit: "500 g", unit_price: 18.00, category: "Artisanal" }
  ]
];

async function clearDatabase() {
  console.log('Clearing existing data...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM premade_packages');
    await client.query('DELETE FROM Products');
    await client.query('DELETE FROM Farms');
    await client.query('COMMIT');
    console.log('Database cleared successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function createTables() {
  console.log('Creating tables if they don\'t exist...');
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS Farms (
        farm_id SERIAL PRIMARY KEY,
        farm_name VARCHAR(255) NOT NULL,
        description TEXT,
        address TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS Products (
        product_id SERIAL PRIMARY KEY,
        farm_id INTEGER NOT NULL REFERENCES Farms(farm_id),
        product_name VARCHAR(255) NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS premade_packages (
        package_id SERIAL PRIMARY KEY,
        package_name VARCHAR(255) NOT NULL,
        farm_id INTEGER NOT NULL REFERENCES Farms(farm_id),
        description TEXT NOT NULL,
        retail_value DECIMAL(10,2) NOT NULL,
        plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('weekly', 'biweekly', 'monthly')),
        items JSONB NOT NULL DEFAULT '[]',
        tags JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log('Tables created/verified successfully.');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function seedDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Inserting farms and products...');
    
    const farmIds: number[] = [];
    
    for (let i = 0; i < farms.length; i++) {
      const farm = farms[i];
      const products = farmProducts[i];
      
      
      const farmResult = await client.query(
        `INSERT INTO Farms (farm_name, description, address) 
         VALUES ($1, $2, $3) 
         RETURNING farm_id`,
        [farm.name, farm.description, farm.address]
      );
      
      const farmId = farmResult.rows[0].farm_id;
      farmIds.push(farmId);
      console.log(`  Inserted farm: ${farm.name} (ID: ${farmId})`);
      
      
      for (const product of products) {
        await client.query(
          `INSERT INTO Products (farm_id, product_name, unit_price, unit, category) 
           VALUES ($1, $2, $3, $4, $5)`,
          [farmId, product.name, product.unit_price, product.unit, product.category]
        );
      }
      
      console.log(`  Inserted ${products.length} products for ${farm.name}`);
    }
    
    
    console.log('\nCreating sample pre-made packages...');
    let createdPackages = 0;

    
    const unitTail = (u: string) => String(u).trim().replace(/^(\d+)\s*/, '').trim();

    
    for (let i = 0; i < Math.min(farmIds.length, 6); i++) {
      const farmId = farmIds[i];
      const farmName = farms[i].name;

      const { rows: productsForFarm } = await client.query(
        `SELECT product_id, product_name, unit_price, unit FROM Products WHERE farm_id = $1 ORDER BY product_id`,
        [farmId]
      );
      if (productsForFarm.length < 6) continue;

      
      {
        const chosen = productsForFarm.slice(0, Math.min(6, productsForFarm.length));
        const items = chosen.map((p: any, idx: number) => {
          const qty = idx % 3 === 0 ? 1 : 2; 
          return { name: p.product_name, quantity: `${qty} ${unitTail(p.unit)}` };
        });
        const retailValue = chosen.reduce((sum: number, p: any, idx: number) => {
          const qty = idx % 3 === 0 ? 1 : 2;
          return sum + qty * Number(p.unit_price);
        }, 0);
        const packageName = `Weekly ${farmName} Essentials`;
        const description = `A fresh weekly selection from ${farmName}.`;
        const tags = ['weekly-essentials'];

        await client.query(
          `INSERT INTO premade_packages (
            package_name, farm_id, description, retail_value, plan_type, items, tags, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7, NOW(), NOW())`,
          [
            packageName,
            farmId,
            description,
            retailValue.toFixed(2),
            'weekly',
            JSON.stringify(items),
            JSON.stringify(tags),
          ]
        );
        createdPackages++;
      }

      
      if (productsForFarm.length >= 8) {
        const chosen = productsForFarm.slice(0, 8);
        const items = chosen.map((p: any, idx: number) => {
          const qty = 2 + (idx % 2); 
          return { name: p.product_name, quantity: `${qty} ${unitTail(p.unit)}` };
        });
        const retailValue = chosen.reduce((sum: number, p: any, idx: number) => {
          const qty = 2 + (idx % 2);
          return sum + qty * Number(p.unit_price);
        }, 0);
        const packageName = `Bi-Weekly ${farmName} Selection`;
        const description = `A premium bi-weekly selection from ${farmName}, featuring fresh products in larger quantities.`;
        const tags = ['premium', 'bi-weekly'];

        await client.query(
          `INSERT INTO premade_packages (
            package_name, farm_id, description, retail_value, plan_type, items, tags, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7, NOW(), NOW())`,
          [
            packageName,
            farmId,
            description,
            retailValue.toFixed(2),
            'biweekly',
            JSON.stringify(items),
            JSON.stringify(tags),
          ]
        );
        createdPackages++;
      }

      
      {
        const count = Math.min(9, Math.max(7, productsForFarm.length));
        const chosen = productsForFarm.slice(0, count);
        const items = chosen.map((p: any, idx: number) => {
          const qty = 3 + (idx % 2); 
          return { name: p.product_name, quantity: `${qty} ${unitTail(p.unit)}` };
        });
        const retailValue = chosen.reduce((sum: number, p: any, idx: number) => {
          const qty = 3 + (idx % 2);
          return sum + qty * Number(p.unit_price);
        }, 0);
        const packageName = `Monthly ${farmName} Family Box`;
        const description = `A comprehensive monthly box from ${farmName}, perfect for families. Includes bulk quantities for maximum savings.`;
        const tags = ['family-size', 'monthly', 'bulk'];

        await client.query(
          `INSERT INTO premade_packages (
            package_name, farm_id, description, retail_value, plan_type, items, tags, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7, NOW(), NOW())`,
          [
            packageName,
            farmId,
            description,
            retailValue.toFixed(2),
            'monthly',
            JSON.stringify(items),
            JSON.stringify(tags),
          ]
        );
        createdPackages++;
      }
    }

    await client.query('COMMIT');
    console.log('\n✅ Database seeded successfully!');
    console.log(`   - ${farms.length} farms created`);
    console.log(`   - ${farms.length * 12} products created`);
    console.log(`   - ${createdPackages} pre-made packages created`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    await createTables();
    await clearDatabase();
    await seedDatabase();
    
    console.log('\n✨ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
