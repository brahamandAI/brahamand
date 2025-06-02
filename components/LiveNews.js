import { useState, useEffect } from 'react';
import { RefreshCw, Clock, Save, Share2, Check, Search, Loader, DatabaseIcon, AlertCircle } from 'react-feather';
import Link from 'next/link';

const LiveNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState('all');
  const [savedNews, setSavedNews] = useState([]);
  const [connectionIssue, setConnectionIssue] = useState(false);
  
  const sources = [
    { id: 'all', name: 'All Sources' },
    { id: 'The Hindu', name: 'The Hindu' },
    { id: 'Times of India', name: 'Times of India' },
    { id: 'ANI', name: 'ANI' },
  ];

  useEffect(() => {
    fetchNews();
    // Load saved news from localStorage
    const saved = localStorage.getItem('savedLiveNews');
    if (saved) {
      setSavedNews(JSON.parse(saved));
    }
  }, [source]);

  const fetchNews = async () => {
    setLoading(true);
    setError('');
    setConnectionIssue(false);
    
    try {
      // Use the Next.js API route instead of direct FastAPI endpoint
      const endpoint = source === 'all' 
        ? '/api/live-news?limit=20' 
        : `/api/live-news?source=${source}&limit=20`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 503 || errorData.code === 'SERVICE_UNAVAILABLE') {
          setConnectionIssue(true);
          throw new Error('News service is currently unavailable');
        }
        
        throw new Error(errorData.message || 'Failed to fetch news');
      }
      
      const data = await response.json();
      
      // Transform the data to match the expected format
      const transformedData = data.map(article => ({
        ...article,
        title: article.title || 'No Title',
        content: article.content || 'No Content Available',
        source: article.source || 'Unknown Source',
        author: article.author || 'Unknown Author',
        scraped_at: article.scraped_at || new Date().toISOString()
      }));
      
      setNews(transformedData || []);
    } catch (err) {
      console.error('Live news fetch error:', err);
      
      if (err.message === 'Failed to fetch' || 
          err.message.includes('fetch news') || 
          err.message.includes('unavailable')) {
        setConnectionIssue(true);
      }
      
      setError('Failed to load live news: ' + (err.message || 'Please try again later'));
    } finally {
      setLoading(false);
    }
  };

  const saveNews = (article) => {
    const isAlreadySaved = savedNews.some(
      (saved) => saved.link === article.link
    );

    if (isAlreadySaved) {
      // Remove from saved
      const filtered = savedNews.filter(
        (saved) => saved.link !== article.link
      );
      setSavedNews(filtered);
      localStorage.setItem('savedLiveNews', JSON.stringify(filtered));
    } else {
      // Add to saved
      const newSavedList = [...savedNews, article];
      setSavedNews(newSavedList);
      localStorage.setItem('savedLiveNews', JSON.stringify(newSavedList));
    }
  };

  const shareNews = async (article) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.title,
          url: article.link,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        fallbackShare(article);
      }
    } else {
      fallbackShare(article);
    }
  };

  const fallbackShare = (article) => {
    // Fallback to copy to clipboard
    const textToCopy = `${article.title}\n\nRead more: ${article.link}`;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert('Article link copied to clipboard!');
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
      });
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isArticleSaved = (article) => {
    return savedNews.some(
      (saved) => saved.link === article.link
    );
  };

  return (
    <div className="rbt-dashboard-content">
      <div className="rbt-dashboard-title mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="title mb-2 text-dark fw-bold">Live News Feed</h4>
            <p className="description text-secondary">
              Real-time news updates from top Indian news sources
            </p>
          </div>
          <button 
            className="btn btn-sm btn-light mt-3 d-flex align-items-center" 
            onClick={fetchNews}
            style={{
              borderRadius: '10px',
              padding: '8px 16px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              color: '#495057',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={14} className="me-2" /> Refresh
          </button>
        </div>
      </div>

      {connectionIssue && (
        <div className="alert alert-warning rounded-4 shadow-sm mb-4" role="alert">
          <div className="d-flex align-items-center">
            <AlertCircle size={20} className="me-2" />
            <div>
              <strong>Connection Issue:</strong> Unable to connect to the news service.
              <div className="mt-2">
                <Link href="/mongodb-status" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center">
                  <DatabaseIcon size={14} className="me-1" /> Check MongoDB Status
                </Link>
                <span className="ms-2 text-muted small">
                  This will help diagnose the connection problem
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="categories-container mb-4">
        <div className="d-flex flex-wrap gap-2">
          {sources.map((src) => (
            <button
              key={src.id}
              onClick={() => setSource(src.id)}
              className={`btn btn-sm ${
                source === src.id ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              style={{
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: source === src.id ? '0 4px 10px rgba(63, 81, 181, 0.2)' : 'none',
                background: source === src.id ? 'linear-gradient(45deg, #3F51B5, #5677fd)' : 'transparent',
                border: source === src.id ? 'none' : '1px solid #dee2e6'
              }}
            >
              {src.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger rounded-4 shadow-sm" role="alert">
          <div className="d-flex align-items-center">
            <Search size={20} className="me-2" />
            <span className="fw-medium">{error}</span>
          </div>
          
          {connectionIssue && (
            <div className="mt-3 bg-light p-3 rounded">
              <h6>Troubleshooting Steps:</h6>
              <ol className="mb-0">
                <li>Make sure MongoDB is running on your server</li>
                <li>Check that the FastAPI service is running at: <code>http://localhost:8000</code></li>
                <li>Verify the connection between FastAPI and MongoDB</li>
              </ol>
            </div>
          )}
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-5 p-4 bg-light rounded-4 shadow-sm">
          <Loader size={36} className="mb-3 text-primary" />
          <p className="text-dark fw-medium">No live news found</p>
          <p className="small text-secondary">Try refreshing or selecting a different source</p>
        </div>
      ) : (
        <div className="news-articles">
          {news.map((article, index) => (
            <div key={index} className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-2">
                  <small className="text-muted me-3 d-flex align-items-center">
                    <Clock size={14} className="me-1" />
                    {formatDate(article.scraped_at)}
                  </small>
                  {article.source && (
                    <small className="badge bg-light text-dark">
                      {article.source}
                    </small>
                  )}
                </div>
                <h5 className="card-title fw-bold mb-2">{article.title}</h5>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-primary"
                    style={{
                      background: 'linear-gradient(45deg, #3F51B5, #5677fd)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      boxShadow: '0 4px 10px rgba(63, 81, 181, 0.2)'
                    }}
                  >
                    Read More
                  </a>
                  <div className="d-flex gap-2">
                    <button
                      onClick={() => saveNews(article)}
                      className="btn btn-sm btn-light d-flex align-items-center"
                      title={isArticleSaved(article) ? 'Unsave article' : 'Save article'}
                      style={{
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                        background: isArticleSaved(article) ? '#e3f2fd' : '#f8f9fa'
                      }}
                    >
                      {isArticleSaved(article) ? (
                        <Check size={16} className="text-primary" />
                      ) : (
                        <Save size={16} className="text-secondary" />
                      )}
                    </button>
                    <button
                      onClick={() => shareNews(article)}
                      className="btn btn-sm btn-light d-flex align-items-center"
                      title="Share article"
                      style={{
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Share2 size={16} className="text-secondary" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveNews; 