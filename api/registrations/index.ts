import { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const db = await getDatabase();
    
    switch (req.method) {
      case 'GET':
        return await getRegistrations(req, res, db);
      case 'POST':
        return await createRegistration(req, res, db);
      default:
        res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Registration API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// 获取报名列表
async function getRegistrations(req: VercelRequest, res: VercelResponse, db: any) {
  const { eventId, source, status } = req.query;
  
  let filter: any = {};
  
  if (eventId) {
    filter.eventId = eventId;
  }
  
  if (source) {
    filter.source = source;
  }
  
  if (status) {
    filter.status = status;
  }
  
  const registrations = await db.collection('registrations')
    .find(filter)
    .sort({ registeredAt: -1 })
    .toArray();
  
  // 聚合统计数据
  const stats = await db.collection('registrations').aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$eventId',
        totalRegistrations: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        confirmedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
        }
      }
    }
  ]).toArray();
  
  res.status(200).json({
    success: true,
    data: registrations.map((reg: any) => ({
      ...reg,
      id: reg._id.toString(),
      _id: undefined
    })),
    stats: stats.reduce((acc: any, stat: any) => {
      acc[stat._id] = {
        totalRegistrations: stat.totalRegistrations,
        totalQuantity: stat.totalQuantity,
        confirmedCount: stat.confirmedCount
      };
      return acc;
    }, {})
  });
}

// 创建报名记录
async function createRegistration(req: VercelRequest, res: VercelResponse, db: any) {
  const registrationData = req.body;
  
  // 数据验证
  if (!registrationData.eventId || !registrationData.userName || !registrationData.phone) {
    return res.status(400).json({
      success: false,
      error: '缺少必要字段：eventId, userName, phone'
    });
  }
  
  // 检查活动是否存在且可报名
  const event = await db.collection('events').findOne({ 
    _id: new ObjectId(registrationData.eventId),
    status: 'published',
    miniProgramVisible: true
  });
  
  if (!event) {
    return res.status(404).json({
      success: false,
      error: '活动不存在或不可报名'
    });
  }
  
  // 检查报名人数限制
  const currentRegistrations = await db.collection('registrations')
    .aggregate([
      { 
        $match: { 
          eventId: registrationData.eventId, 
          status: { $ne: 'cancelled' } 
        } 
      },
      { $group: { _id: null, totalQuantity: { $sum: '$quantity' } } }
    ])
    .toArray();
  
  const currentCount = currentRegistrations[0]?.totalQuantity || 0;
  const requestedQuantity = registrationData.quantity || 1;
  
  if (currentCount + requestedQuantity > event.maxParticipants) {
    return res.status(400).json({
      success: false,
      error: `报名人数超限，剩余名额：${event.maxParticipants - currentCount}`
    });
  }
  
  // 检查重复报名（同一手机号）
  const existingRegistration = await db.collection('registrations').findOne({
    eventId: registrationData.eventId,
    phone: registrationData.phone,
    status: { $ne: 'cancelled' }
  });
  
  if (existingRegistration) {
    return res.status(400).json({
      success: false,
      error: '该手机号已报名此活动'
    });
  }
  
  const newRegistration = {
    ...registrationData,
    quantity: requestedQuantity,
    status: 'confirmed',
    source: registrationData.source || 'miniprogram',
    registeredAt: new Date().toISOString()
  };
  
  const result = await db.collection('registrations').insertOne(newRegistration);
  
  // 更新活动的当前参与人数
  await db.collection('events').updateOne(
    { _id: new ObjectId(registrationData.eventId) },
    { 
      $inc: { currentParticipants: requestedQuantity },
      $set: { updatedAt: new Date().toISOString() }
    }
  );
  
  // 记录同步日志
  await db.collection('sync_logs').insertOne({
    eventId: registrationData.eventId,
    action: 'registration',
    timestamp: new Date().toISOString(),
    status: 'success',
    details: `New registration from ${registrationData.source || 'miniprogram'}: ${registrationData.userName}`
  });
  
  res.status(201).json({
    success: true,
    data: {
      ...newRegistration,
      id: result.insertedId.toString()
    }
  });
} 