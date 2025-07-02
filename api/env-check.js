export default function handler(req, res) {
  res.status(200).json({
    success: true,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI_exists: !!process.env.MONGODB_URI,
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      DB_NAME: process.env.DB_NAME || 'qplz (default)',
      MONGODB_URI_preview: process.env.MONGODB_URI ? 
        process.env.MONGODB_URI.substring(0, 30) + '...' : 
        'Not configured'
    }
  });
} 