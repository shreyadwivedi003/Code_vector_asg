const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const client = new MongoClient(process.env.MONGODB_URI);
let collection;
async function initDB() {
  await client.connect();
  const db = client.db('catalog');
  collection = db.collection('products');
  console.log('🔌 Connected securely to MongoDB');
}
initDB().catch(console.error);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/products', async (req, res) => {
  try {
    const { category, cursor } = req.query;
    const limit = parseInt(req.query.limit) || 12;
    let filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }

    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('ascii');
      const [createdAtStr, idStr] = decodedCursor.split('|');
      
      filter.$or = [
        { created_at: { $lt: new Date(createdAtStr) } },
        { 
          created_at: new Date(createdAtStr), 
          _id: { $lt: new ObjectId(idStr) } 
        }
      ];
    }
    const products = await collection.find(filter)
      .sort({ created_at: -1, _id: -1 })
      .limit(limit)
      .toArray();
    let nextCursor = null;
    if (products.length === limit) {
      const lastItem = products[products.length - 1];
      const rawCursor = `${lastItem.created_at.toISOString()}|${lastItem._id.toString()}`;
      nextCursor = Buffer.from(rawCursor).toString('base64');
    }

    const formattedProducts = products.map(p => ({
      id: p._id,
      name: p.name,
      category: p.category,
      price: p.price,
      created_at: p.created_at
    }));

    res.json({ products: formattedProducts, nextCursor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});