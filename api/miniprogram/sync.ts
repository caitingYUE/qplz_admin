import { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const db = await getDatabase();
    const { eventId, action = 'publish' } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Missing eventId' });
    }

    switch (action) {
      case 'publish':
        return await publishEventToMiniProgram(req, res, db, eventId);
      case 'unpublish':
        return await unpublishEventFromMiniProgram(req, res, db, eventId);
      default:
        return res.status(400).json({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Sync API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Sync failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// 发布活动到小程序
async function publishEventToMiniProgram(req: VercelRequest, res: VercelResponse, db: any, eventId: string) {
  try {
    const event = await db.collection('events').findOne({ _id: new ObjectId(eventId) });
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    if (event.status !== 'published') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only published events can be synced to miniprogram' 
      });
    }
    
    // 更新活动的小程序可见性
    const updateResult = await db.collection('events').updateOne(
      { _id: new ObjectId(eventId) },
      { 
        $set: { 
          syncedToMiniProgram: true,
          miniProgramVisible: true,
          syncedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    // 记录同步日志
    await db.collection('sync_logs').insertOne({
      eventId,
      action: 'publish',
      timestamp: new Date().toISOString(),
      status: 'success',
      details: 'Event published to miniprogram successfully'
    });
    
    // 这里可以添加其他同步逻辑，比如：
    // 1. 推送通知给关注该活动的用户
    // 2. 生成小程序码
    // 3. 发送模板消息等
    
    res.status(200).json({
      success: true,
      data: {
        eventId,
        syncId: `sync_${Date.now()}`,
        syncedAt: new Date().toISOString(),
        message: 'Event successfully synced to miniprogram'
      }
    });
  } catch (error) {
    await db.collection('sync_logs').insertOne({
      eventId,
      action: 'publish',
      timestamp: new Date().toISOString(),
      status: 'failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}

// 从小程序下线活动
async function unpublishEventFromMiniProgram(req: VercelRequest, res: VercelResponse, db: any, eventId: string) {
  try {
    const updateResult = await db.collection('events').updateOne(
      { _id: new ObjectId(eventId) },
      { 
        $set: { 
          miniProgramVisible: false,
          unpublishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    // 记录同步日志
    await db.collection('sync_logs').insertOne({
      eventId,
      action: 'unpublish',
      timestamp: new Date().toISOString(),
      status: 'success',
      details: 'Event unpublished from miniprogram'
    });
    
    res.status(200).json({
      success: true,
      data: {
        eventId,
        unpublishedAt: new Date().toISOString(),
        message: 'Event successfully unpublished from miniprogram'
      }
    });
  } catch (error) {
    await db.collection('sync_logs').insertOne({
      eventId,
      action: 'unpublish',
      timestamp: new Date().toISOString(),
      status: 'failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
} 