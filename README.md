# ✨ Fast Cursor Pagination System ✨

A high-performance, real-time product browser engineered to handle ~200,000 products seamlessly. This backend is built using **Node.js (Express)** and **MongoDB**, featuring an ultra-fast **Cursor-Based (Keyset) Pagination** mechanism that ensures perfect data consistency under concurrent writes, paired with a soft pink, lavender, and butter yellow pastel dashboard UI.

🚀 **Live Link:** [Insert Your Render URL Here]

---

## 🚨 The Core Engineering Challenge: Why Offsets Fail

The primary requirement of this task was handling a volatile data pool: *If 50 new products are added/updated while someone is browsing, they must not see the same product twice or miss one.*

### The Trap: Offset-Based Pagination (`.skip()` and `.limit()`)
If we use traditional page offset mechanics, inserting data at the top of the collection shifts the entire dataset downwards. If a user is on Page 1 and 5 new items are added, the items at the bottom of Page 1 shift onto Page 2. When the user hits "Next Page", they see duplicate records. Conversely, if items are deleted, rows shift upwards, causing the user to skip data entirely. Additionally, `.skip(150000)` forces the database to sequentially scan through 150,000 records to fetch the next 12, resulting in an $O(N)$ performance degradation.

### The Solution: Cursor-Based Pagination
This application utilizes **Cursor-Based Pagination**. Instead of telling the database how many rows to skip, the client passes an absolute token representing the exact point where the previous page ended. 
* The pagination cursor is a Base64-encoded string combining the record's exact timestamp and its unique ID: `created_at|id`.
* When fetching the next page, the database runs an $O(\log N)$ range query looking for records strictly *older* than the current cursor boundary:

```javascript
filter.$or = [
  { created_at: { $lt: cursorTimestamp } },
  { created_at: cursorTimestamp, _id: { $lt: cursorObjectId } } // Tie-breaker for identical timestamps
];
