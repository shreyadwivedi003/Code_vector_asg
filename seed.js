const { MongoClient } = require('mongodb');
require('dotenv').config();

// MONGODB_URI should be in your .env file (e.g., from MongoDB Atlas)
const client = new MongoClient(process.env.MONGODB_URI);

const CATEGORIES = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Sports', 'Beauty'];
const TOTAL_RECORDS = 200000;
const BATCH_SIZE = 20000; // Big chunks work perfectly in MongoDB

async function seedDatabase() {
  console.log('🚀 Starting MongoDB seed...');
  const startTime = Date.now();

  try {
    await client.connect();
    const db = client.db('catalog');
    const collection = db.collection('products');


    let insertedCount = 0;

    await collection.createIndex({ category: 1, created_at: -1, _id: -1 });
    console.log('✅ Compound Index created successfully.');

    while (insertedCount < TOTAL_RECORDS) {
      const productsBatch = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const currentNum = insertedCount + i + 1;
        
        const createdAt = new Date(Date.now() - (TOTAL_RECORDS - currentNum) * 1000);

        productsBatch.push({
          name: `Product ${currentNum}`,
          category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
          price: parseFloat((Math.random() * 500 + 5).toFixed(2)),
          created_at: createdAt,
          updated_at: createdAt
        });
      }

      await collection.insertMany(productsBatch);
      insertedCount += BATCH_SIZE;
      console.log(`⏳ Inserted ${insertedCount}/${TOTAL_RECORDS} documents...`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Successfully seeded ${TOTAL_RECORDS} products in ${duration} seconds!`);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await client.close();
  }
}

seedDatabase();