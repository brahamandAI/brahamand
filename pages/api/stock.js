export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ message: 'Stock symbol is required' });
  }

  try {
    // Try the free Indian Stock Market API first
    // This API supports both NSE (.NS) and BSE (.BO) symbols
    const freeApiUrl = `https://military-jobye-haiqstudios-14f59639.koyeb.app/stock?symbol=${symbol}`;
    
    try {
      console.log(`Fetching Indian stock data for: ${symbol}`);
      const freeResponse = await fetch(freeApiUrl);
      
      if (freeResponse.ok) {
        const freeData = await freeResponse.json();
        
        // Check if the response contains valid stock data
        if (freeData && freeData.info) {
          // Transform the free API data to match our expected format
          const stockData = {
            symbol: freeData.info.symbol || symbol,
            companyName: freeData.info.shortName || freeData.info.longName || symbol,
            latestPrice: freeData.info.regularMarketPrice || freeData.info.currentPrice || 0,
            change: freeData.info.regularMarketChange || 0,
            changePercent: (freeData.info.regularMarketChangePercent || 0) / 100,
            open: freeData.info.regularMarketOpen || freeData.info.open || 0,
            high: freeData.info.regularMarketDayHigh || freeData.info.dayHigh || 0,
            low: freeData.info.regularMarketDayLow || freeData.info.dayLow || 0,
            previousClose: freeData.info.regularMarketPreviousClose || freeData.info.previousClose || 0,
            volume: freeData.info.regularMarketVolume || freeData.info.volume || 0,
            marketCap: freeData.info.marketCap || 0,
            yearHigh: freeData.info.fiftyTwoWeekHigh || 0,
            yearLow: freeData.info.fiftyTwoWeekLow || 0,
            currency: freeData.info.currency || 'INR',
            exchange: freeData.info.exchange || 'NSE',
            latestUpdate: new Date().toISOString(),
            source: 'Indian Stock Market API (Free)'
          };

          console.log(`Successfully fetched data for ${symbol} from free API`);
          return res.status(200).json(stockData);
        }
      }
    } catch (freeApiError) {
      console.log(`Free API failed for ${symbol}, falling back to Alpha Vantage:`, freeApiError.message);
    }

    // Fallback to Alpha Vantage if free API fails
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({ 
        message: 'Stock API not configured. Please contact support.',
        code: 'API_KEY_MISSING'
      });
    }
    
    // Clean the symbol for Alpha Vantage (remove .NS or .BO suffix if present)
    const cleanSymbol = symbol.replace(/\.(NS|BO)$/, '');
    const apiUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${cleanSymbol}&apikey=${API_KEY}`;

    console.log(`Fetching data from Alpha Vantage for: ${cleanSymbol}`);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if we got a valid response with data
    if (data?.['Error Message']) {
      return res.status(404).json({ 
        message: `Stock symbol '${symbol}' not found. For Indian stocks, use .NS for NSE (e.g., RELIANCE.NS) or .BO for BSE (e.g., RELIANCE.BO)`,
        code: 'SYMBOL_NOT_FOUND'
      });
    }
    
    if (data?.['Note']) {
      return res.status(429).json({ 
        message: 'API rate limit reached. Please try again in a minute.',
        code: 'RATE_LIMIT'
      });
    }
    
    if (!data?.['Global Quote'] || Object.keys(data?.['Global Quote'] || {}).length === 0) {
      return res.status(404).json({ 
        message: `No data found for stock symbol '${symbol}'. For Indian stocks, try adding .NS (NSE) or .BO (BSE) suffix.`,
        code: 'NO_DATA'
      });
    }

    const quote = data['Global Quote'];
    
    // Transform Alpha Vantage data to match our expected format
    const stockData = {
      symbol: quote['01. symbol'],
      companyName: cleanSymbol,
      latestPrice: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')) / 100,
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      previousClose: parseFloat(quote['08. previous close']),
      volume: parseInt(quote['06. volume']),
      currency: 'USD',
      exchange: 'Alpha Vantage',
      latestUpdate: new Date().toISOString(),
      source: 'Alpha Vantage (Fallback)'
    };

    console.log(`Successfully fetched data for ${symbol} from Alpha Vantage`);
    return res.status(200).json(stockData);
  } catch (error) {
    console.error('Stock API error:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch stock data. Please try again later.', 
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
} 