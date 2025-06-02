export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  //this is a new line

  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Log the incoming query for debugging
    console.log('Tavily search query:', query);

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        query: query,
        search_depth: "advanced",
        include_answer: true,
        include_images: true,
        include_raw_content: true
      })
    });

    if (!response.ok) {
      console.error('Tavily API error:', response.status, response.statusText);
      throw new Error('Failed to fetch from Tavily API');
    }

    const data = await response.json();
    
    // Log the response for debugging
    console.log('Tavily API response structure:', Object.keys(data));
    
    // Ensure proper structure for images
    const formattedData = {
      answer: data.answer || '',
      results: Array.isArray(data.results) ? data.results.map(result => ({
        title: result.title || '',
        url: result.url || '',
        content: result.content || ''
      })) : [],
      images: Array.isArray(data.images) ? data.images.map(img => ({
        url: img.url || '',
        title: img.title || 'Related image'
      })) : []
    };

    console.log('Formatted response:', formattedData);
    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Tavily search error:', error);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
} 