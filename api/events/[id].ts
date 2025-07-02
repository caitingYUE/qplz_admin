import { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const db = await getDatabase();
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid event ID' });
    }

    switch (req.method) {
      case 'GET':
        return await getEvent(req, res, db, id);
      case 'PUT':
        return await updateEvent(req, res, db, id);
      case 'DELETE':
        return await deleteEvent(req, res, db, id);
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

// 获取单个活动
async function getEvent(req: VercelRequest, res: VercelResponse, db: any, id: string) {
  try {
    const event = await db.collection('events').findOne({ _id: new ObjectId(id) });
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...event,
        id: event._id.toString(),
        _id: undefined
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid event ID format' });
  }
}

// 更新活动
async function updateEvent(req: VercelRequest, res: VercelResponse, db: any, id: string) {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    const result = await db.collection('events').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    // 记录同步日志
    await db.collection('sync_logs').insertOne({
      eventId: id,
      action: 'update',
      timestamp: new Date().toISOString(),
      status: 'success',
      details: `Updated fields: ${Object.keys(updateData).join(', ')}`
    });
    
    // 获取更新后的活动
    const updatedEvent = await db.collection('events').findOne({ _id: new ObjectId(id) });
    
    res.status(200).json({
      success: true,
      data: {
        ...updatedEvent,
        id: updatedEvent._id.toString(),
        _id: undefined
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid event ID format or data' });
  }
}

// 删除活动
async function deleteEvent(req: VercelRequest, res: VercelResponse, db: any, id: string) {
  try {
    const result = await db.collection('events').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    // 删除相关报名信息
    await db.collection('registrations').deleteMany({ eventId: id });
    
    // 记录同步日志
    await db.collection('sync_logs').insertOne({
      eventId: id,
      action: 'delete',
      timestamp: new Date().toISOString(),
      status: 'success',
      details: 'Event and related registrations deleted'
    });
    
    res.status(200).json({
      success: true,
      data: { id }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid event ID format' });
  }
} 