import clientPromise from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'news_db');

    // Get query parameters
    const { source, limit = 20 } = req.query;
    
    // Build query
    const query = source && source !== 'all' ? { source } : {};
    
    // Fetch news articles with proper sorting and error handling
    try {
      const news = await db
        .collection('news_articles')
        .find(query)
        .sort({ scraped_at: -1 })
        .limit(parseInt(limit))
        .toArray();

      // Transform the data to ensure all required fields are present
      const transformedNews = news.map(article => ({
        _id: article._id,
        title: article.title || 'No Title',
        content: article.content || 'No Content Available',
        source: article.source || 'Unknown Source',
        author: article.author || 'Unknown Author',
        scraped_at: article.scraped_at || new Date().toISOString(),
        link: article.link || '#'
      }));

      return res.status(200).json(transformedNews);
    } catch (dbError) {
      console.error('Database Query Error:', dbError);
      return res.status(500).json({
        message: 'Error querying the database',
        code: 'DATABASE_ERROR'
      });
    }
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    return res.status(503).json({
      message: 'Unable to connect to the database',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
} 