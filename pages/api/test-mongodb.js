import clientPromise from '../../utils/mongodb';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'news_db');
    
    // Test the connection by counting articles
    const articleCount = await db.collection('news_articles').countDocuments();
    
    res.status(200).json({
      success: true,
      database: process.env.MONGODB_DB_NAME || 'news_db',
      articleCount,
      mongodb_uri: process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@') // Hide password in URI
    });
  } catch (error) {
    console.error('MongoDB Test Error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        hint: error.name === 'MongoServerError' 
          ? 'Check if MongoDB is running and accessible'
          : 'Verify your connection string and network connectivity'
      },
      mongodb_uri: process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@') // Hide password in URI
    });
  }
} 