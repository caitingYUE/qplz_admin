import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'qplz';

if (!MONGODB_URI) {
  throw new Error('Please define the DATABASE_URL environment variable inside .env.local');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  await cachedClient.connect();
  cachedDb = cachedClient.db(DB_NAME);

  // 创建索引以提高查询性能
  await createIndexes(cachedDb);

  return cachedDb;
}

async function createIndexes(db: Db) {
  // Events collection indexes
  await db.collection('events').createIndexes([
    { key: { status: 1 } },
    { key: { miniProgramVisible: 1 } },
    { key: { createdAt: -1 } },
    { key: { startTime: 1 } }
  ]);

  // Registrations collection indexes
  await db.collection('registrations').createIndexes([
    { key: { eventId: 1 } },
    { key: { phone: 1 } },
    { key: { openId: 1 } },
    { key: { registeredAt: -1 } },
    { key: { eventId: 1, phone: 1 }, options: { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } } }
  ]);

  // Sync logs collection indexes
  await db.collection('sync_logs').createIndexes([
    { key: { eventId: 1 } },
    { key: { timestamp: -1 } },
    { key: { action: 1 } }
  ]);
}

export async function closeDatabase() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}

// 健康检查
export async function healthCheck(): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.admin().ping();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
} 