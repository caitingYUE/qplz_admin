import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase, closeDatabase } from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const db = await getDatabase();
    
    switch (req.method) {
      case 'GET':
        return await getEvents(req, res, db);
      case 'POST':
        return await createEvent(req, res, db);
      default:
        res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// 获取活动列表
async function getEvents(req: VercelRequest, res: VercelResponse, db: any) {
  const { status, miniprogram } = req.query;
  
  let filter: any = {};
  
  // 如果是小程序请求，只返回已发布且同步的活动
  if (miniprogram === 'true') {
    filter = {
      status: 'published',
      miniProgramVisible: true
    };
  } else if (status) {
    filter.status = status;
  }
  
  const events = await db.collection('events')
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();
  
  res.status(200).json({
    success: true,
    data: events.map((event: any) => ({
      ...event,
      id: event._id.toString(),
      _id: undefined
    }))
  });
}

// 创建活动
async function createEvent(req: VercelRequest, res: VercelResponse, db: any) {
  const eventData = req.body;
  
  // 数据验证
  if (!eventData.name || !eventData.startTime || !eventData.location) {
    return res.status(400).json({
      success: false,
      error: '缺少必要字段：name, startTime, location'
    });
  }
  
  const newEvent = {
    ...eventData,
    currentParticipants: 0,
    syncedToMiniProgram: false,
    miniProgramVisible: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const result = await db.collection('events').insertOne(newEvent);
  
  // 记录同步日志
  await db.collection('sync_logs').insertOne({
    eventId: result.insertedId.toString(),
    action: 'create',
    timestamp: new Date().toISOString(),
    status: 'success',
    details: 'Event created in admin panel'
  });
  
  res.status(201).json({
    success: true,
    data: {
      ...newEvent,
      id: result.insertedId.toString()
    }
  });
} 