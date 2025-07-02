import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 返回测试数据
  res.status(200).json({
    success: true,
    message: 'QPLZ API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    query: req.query,
    environment: process.env.NODE_ENV || 'development'
  });
} 