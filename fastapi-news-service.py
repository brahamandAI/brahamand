from fastapi import FastAPI, BackgroundTasks, Query, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import asyncio
import httpx
from pymongo.errors import DuplicateKeyError
from typing import Optional, List, Dict, Any
import uvicorn
import json
from bson import ObjectId
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import random
from urllib.parse import urljoin
import time
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import feedparser
from pymongo import UpdateOne

# Import direct scraper module
import importlib.util
spec = importlib.util.spec_from_file_location("direct_scraper", "direct-scraper.py")
direct_scraper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(direct_scraper)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('direct_scraper')

# Custom JSON encoder for MongoDB objects
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Helper function to convert MongoDB documents to JSON-compatible dictionaries
def mongo_to_json(obj):
    if isinstance(obj, list):
        return [mongo_to_json(item) for item in obj]
    if isinstance(obj, dict):
        return {key: mongo_to_json(value) for key, value in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

app = FastAPI(title="News API", description="API for scraping and retrieving news from Indian sources")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# MongoDB setup
MONGO_URI = "mongodb+srv://avigupta1910:HQFhXznwogLX6zjA@clusterbrahamand.1zkd1vo.mongodb.net/?retryWrites=true&w=majority&appName=Clusterbrahamand"
DB_NAME = "news_db"
COLLECTION_NAME = "news_articles"

# MongoDB client with proper options
client = AsyncIOMotorClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=10000,
    socketTimeoutMS=45000,
    maxPoolSize=10,
    retryWrites=True,
    retryReads=True,
    w='majority'
)

# Initialize database and collection
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# Initialize scheduler
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    # Create indexes
    await collection.create_index([("link", 1)], unique=True)
    await collection.create_index([("source", 1)])
    await collection.create_index([("scraped_at", -1)])
    
    # Start initial scraping
    asyncio.create_task(scrape_all_sources())
    
    # Schedule periodic scraping every hour
    scheduler.add_job(scrape_all_sources, 'interval', hours=1, id='periodic_scrape')
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()

# Updated selectors based on actual HTML structure
SELECTORS = {
    'The Hindu': [
        'h1 a',                     # Main headlines
        'h2 a',                     # Sub headlines
        'h3 a',                     # Other headlines
        '.article-title a',         # Article titles
        '.title a',                 # Generic titles
        '.summary a',               # Article summaries
        '.content-title a',         # Content titles
        '.headline a',              # Headlines
        '.article-list h2 a',       # Article list headlines
        '.article-list h3 a',       # Article list sub headlines
        '.story-list h2 a',         # Story list headlines
        '.story-list h3 a'          # Story list sub headlines
    ],
    'Times of India': [
        '.article[data-highlight="true"] a',  # Featured articles
        '.article-box h2 a',                  # Article boxes
        '.article-box h3 a',                  # Article box sub headlines
        '.top-stories .article a',            # Top stories
        '.latest-news .article a',            # Latest news
        '.news-card .headline a',             # News cards
        '.list-view-item h2 a',              # List view items
        '.list-view-item h3 a',              # List view sub items
        '.featured-news h2 a',               # Featured news
        '.featured-news h3 a'                # Featured news sub headlines
    ],
    'ANI': [
        '.news-item .title a',               # News items
        '.news-post .headline a',            # News posts
        '.article-box .title a',             # Article boxes
        '.featured-news .title a',           # Featured news
        '.latest-updates .title a',          # Latest updates
        '.breaking-news .title a',           # Breaking news
        '.news-grid .title a',               # News grid
        '.news-list .title a'                # News list
    ]
}

# Updated headers with anti-bot detection bypass
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
]

def get_random_headers():
    return {
        'User-Agent': random.choice(USER_AGENTS),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Pragma': 'no-cache',
        'DNT': '1',
        'Sec-CH-UA': '"Not_A Brand";v="8", "Chromium";v="120"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"Windows"',
        'Referer': 'https://www.google.com/',
        'Cookie': f'_ga=GA1.2.{random.randint(100000000, 999999999)}.{random.randint(1000000000, 9999999999)}; cookieconsent=true'
    }

async def scrape_news(source, url):
    try:
        # Add random delay between requests (3-7 seconds)
        await asyncio.sleep(random.uniform(3, 7))
        
        # Enhanced browser-like headers with dynamic values
        headers = {
            'User-Agent': random.choice([
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Edge/120.0.0.0'
            ]),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'Referer': 'https://www.google.com/',
            'sec-ch-ua': '"Chromium";v="120", "Not(A:Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Cookie': f'_ga=GA1.2.{random.randint(100000000, 999999999)}.{random.randint(1000000000, 9999999999)}; cookieconsent=true'
        }

        # Add source-specific headers
        if source == "The Hindu":
            headers.update({
                'Host': 'www.thehindu.com',
                'Origin': 'https://www.thehindu.com',
                'Referer': 'https://www.thehindu.com/'
            })
        elif source == "ANI":
            headers.update({
                'Host': 'www.aninews.in',
                'Origin': 'https://www.aninews.in',
                'Referer': 'https://www.aninews.in/'
            })
        
        # Try HTTP/2 first, fallback to HTTP/1.1 if not available
        try:
            async with httpx.AsyncClient(
                headers=headers,
                timeout=30.0,
                follow_redirects=True,
                http2=True
            ) as client:
                return await scrape_with_client(client, source, url)
        except ImportError:
            # If HTTP/2 is not available, fallback to HTTP/1.1
            logger.warning(f"HTTP/2 not available, falling back to HTTP/1.1 for {source}")
            async with httpx.AsyncClient(
                headers=headers,
                timeout=30.0,
                follow_redirects=True,
                http2=False
            ) as client:
                return await scrape_with_client(client, source, url)
            
    except Exception as e:
        logger.error(f"Fatal error scraping {source}: {str(e)}")
        return []

async def scrape_with_client(client, source, url):
    articles = []
    # Try multiple times with different delays and headers
    for attempt in range(5):  # Increased from 3 to 5 attempts
        try:
            # Add random query parameter and timestamp to bypass cache
            cache_buster = f"?_={int(time.time() * 1000)}&r={random.randint(1000, 9999)}"
            
            # Generate new headers for each attempt
            new_headers = get_random_headers()
            if source == "The Hindu":
                new_headers.update({
                    'Host': 'www.thehindu.com',
                    'Origin': 'https://www.thehindu.com',
                    'Referer': 'https://www.thehindu.com/',
                    'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                })
            elif source == "ANI":
                new_headers.update({
                    'Host': 'www.aninews.in',
                    'Origin': 'https://www.aninews.in',
                    'Referer': 'https://www.aninews.in/',
                    'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
                })
            
            # Update client headers
            client.headers.update(new_headers)
            
            # Add exponential backoff delay between attempts
            if attempt > 0:
                delay = (2 ** attempt) + random.uniform(1, 3)
                await asyncio.sleep(delay)
            
            response = await client.get(f"{url}{cache_buster}")
            response.raise_for_status()
            
            # Check if we got a valid HTML response
            content_type = response.headers.get('content-type', '').lower()
            if 'text/html' not in content_type:
                logger.error(f"{source} returned non-HTML content: {content_type}")
                await asyncio.sleep(random.uniform(4, 8))
                continue
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # First try source-specific selectors
            if source == "The Hindu":
                # The Hindu specific selectors
                selectors = [
                    'article h2 a',
                    'article h3 a',
                    '.story-card-news h2 a',
                    '.story-card-news h3 a',
                    '.story-card h2 a',
                    '.story-card h3 a',
                    '.story-card-33 h2 a',
                    '.story-card-33 h3 a',
                    '.story-card-50 h2 a',
                    '.story-card-50 h3 a',
                    '.other-article h2 a',
                    '.other-article h3 a',
                    '.lead-story h2 a',
                    '.lead-story h3 a'
                ]
            elif source == "ANI":
                # ANI specific selectors
                selectors = [
                    '.ANIStory h2 a',
                    '.ANIStory h3 a',
                    '.news-post-box h2 a',
                    '.news-post-box h3 a',
                    '.news-item h2 a',
                    '.news-item h3 a',
                    '.article-box h2 a',
                    '.article-box h3 a',
                    '.featured-news h2 a',
                    '.featured-news h3 a'
                ]
            else:
                selectors = SELECTORS.get(source, [])

            # Try each selector
            for selector in selectors:
                elements = soup.select(selector)
                logger.info(f"[{source}] Found {len(elements)} items with selector '{selector}'")
                
                for element in elements:
                    try:
                        # Extract title and clean it
                        title = element.get_text().strip()
                        
                        # Get link and ensure it's absolute
                        link = element.get('href', '')
                        if link and not link.startswith(('http://', 'https://')):
                            if link.startswith('/'):
                                base_url = '/'.join(url.split('/')[:3])
                                link = base_url + link
                            else:
                                base_url = url.rsplit('/', 1)[0]
                                link = f"{base_url}/{link}"
                        
                        # Only add if we have both title and link and title is meaningful
                        if title and link and len(title) > 10:
                            # Clean up the title
                            title = ' '.join(title.split())
                            title = title.replace('\n', ' ').replace('\t', ' ')
                            
                            article = {
                                'title': title,
                                'link': link,
                                'source': source,
                                'scraped_at': datetime.utcnow()
                            }
                            articles.append(article)
                    except Exception as e:
                        logger.error(f"Error processing element in {source}: {str(e)}")
                        continue
            
            # If no articles found with specific selectors, try generic approach
            if not articles:
                # Find all article containers
                article_containers = soup.find_all(['article', 'div', 'section'], 
                    class_=lambda x: x and any(word in str(x).lower() for word in ['article', 'story', 'news', 'content']))
                
                # Process each container
                for container in article_containers:
                    # Look for headlines and links
                    headlines = container.find_all(['h1', 'h2', 'h3', 'h4', 'a'])
                    for headline in headlines:
                        try:
                            link_tag = headline if headline.name == 'a' else headline.find('a')
                            if not link_tag:
                                continue
                                
                            link = link_tag.get('href', '')
                            title = link_tag.get_text().strip()
                            
                            if link and title and len(title) > 10:
                                # Make link absolute if needed
                                if not link.startswith(('http://', 'https://')):
                                    if link.startswith('/'):
                                        base_url = '/'.join(url.split('/')[:3])
                                        link = base_url + link
                                    else:
                                        base_url = url.rsplit('/', 1)[0]
                                        link = f"{base_url}/{link}"
                                
                                # Clean up title
                                title = ' '.join(title.split())
                                title = title.replace('\n', ' ').replace('\t', ' ')
                                
                                article = {
                                    'title': title,
                                    'link': link,
                                    'source': source,
                                    'scraped_at': datetime.utcnow()
                                }
                                articles.append(article)
                        except Exception as e:
                            logger.error(f"Error processing headline in {source}: {str(e)}")
                            continue
            
            # Remove duplicates while preserving order
            seen = set()
            unique_articles = []
            for article in articles:
                article_key = (article['title'], article['link'])
                if article_key not in seen:
                    seen.add(article_key)
                    unique_articles.append(article)
            
            logger.info(f"[{source}] Found {len(unique_articles)} unique articles")
            return unique_articles
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 403:
                logger.error(f"Access forbidden for {source}. Trying with different headers...")
                # Generate new random headers
                client.headers['User-Agent'] = random.choice(USER_AGENTS)
                client.headers['Cookie'] = f'_ga=GA1.2.{random.randint(100000000, 999999999)}.{random.randint(1000000000, 9999999999)}; cookieconsent=true'
            elif e.response.status_code == 404:
                logger.error(f"Page not found for {source}: {url}")
                return []
            elif attempt < 2:
                await asyncio.sleep(random.uniform(5, 10))
                continue
            else:
                logger.error(f"Error scraping {source}: {str(e)}")
                return []
                
        except Exception as e:
            if attempt < 2:
                await asyncio.sleep(random.uniform(5, 10))
                continue
            logger.error(f"Unexpected error scraping {source}: {str(e)}")
            return []
    
    return []

# Scraper functions
async def scrape_the_hindu():
    try:
        print("[+] Scraping The Hindu...")
        # Use RSS feeds instead of direct scraping
        rss_urls = [
            "https://www.thehindu.com/news/feeder/default.rss",  # Main feed
            "https://www.thehindu.com/news/national/?service=rss",  # National
            "https://www.thehindu.com/news/international/?service=rss",  # International
            "https://www.thehindu.com/business/?service=rss",  # Business
            "https://www.thehindu.com/sport/?service=rss"  # Sports
        ]
        
        all_articles = []
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml,application/xml;q=0.9',
            'Accept-Language': 'en-US,en;q=0.9'
        }
        
        for rss_url in rss_urls:
            try:
                async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
                    response = await client.get(rss_url)
                    if response.status_code == 200:
                        feed = feedparser.parse(response.text)
                        for entry in feed.entries:
                            try:
                                # Parse the published date
                                if hasattr(entry, 'published_parsed'):
                                    published_at = datetime(*entry.published_parsed[:6])
                                elif hasattr(entry, 'updated_parsed'):
                                    published_at = datetime(*entry.updated_parsed[:6])
                                else:
                                    published_at = datetime.utcnow()
                                
                                article = {
                                    'title': entry.title,
                                    'link': entry.link,
                                    'source': 'The Hindu',
                                    'scraped_at': datetime.utcnow(),
                                    'published_at': published_at,
                                    'summary': entry.summary if hasattr(entry, 'summary') else None
                                }
                                all_articles.append(article)
                            except Exception as e:
                                print(f"Error processing The Hindu article: {e}")
                                continue
            except Exception as e:
                print(f"Error scraping The Hindu RSS feed {rss_url}: {e}")
                continue
        
        print(f"[The Hindu] Found {len(all_articles)} articles")
        
        if all_articles:
            try:
                # Remove duplicates before inserting
                seen = set()
                unique_articles = []
                for article in all_articles:
                    article_key = (article['title'], article['link'])
                    if article_key not in seen:
                        seen.add(article_key)
                        unique_articles.append(article)
                
                if unique_articles:
                    result = await collection.insert_many(unique_articles, ordered=False)
                    print(f"[The Hindu] Inserted {len(result.inserted_ids)} articles")
            except DuplicateKeyError:
                print("[The Hindu] Duplicate entries skipped")
        return all_articles
    except Exception as e:
        print(f"[Error] The Hindu scraping failed: {e}")
        return []

async def scrape_times_of_india():
    try:
        print("[+] Scraping Times of India...")
        urls = [
            "https://timesofindia.indiatimes.com/",
            "https://timesofindia.indiatimes.com/india",
            "https://timesofindia.indiatimes.com/world",
            "https://timesofindia.indiatimes.com/city",
            "https://timesofindia.indiatimes.com/india/politics",
            "https://timesofindia.indiatimes.com/business",
            "https://timesofindia.indiatimes.com/tech",
            "https://timesofindia.indiatimes.com/entertainment",
            "https://timesofindia.indiatimes.com/sports",
            "https://timesofindia.indiatimes.com/education",
            "https://timesofindia.indiatimes.com/astrology",
            "https://timesofindia.indiatimes.com/life-style"
        ]
        all_articles = []
        
        for url in urls:
            articles = await scrape_news("Times of India", url)
            if articles:
                all_articles.extend(articles)
                if len(all_articles) >= 10:  # If we have at least 10 articles, we can stop
                    break
        
        print(f"[TOI] Found {len(all_articles)} articles")
        
        if all_articles:
            try:
                result = await collection.insert_many(all_articles, ordered=False)
                print(f"[TOI] Inserted {len(result.inserted_ids)} articles")
            except DuplicateKeyError:
                print("[TOI] Duplicate entries skipped")
        return all_articles
    except Exception as e:
        print(f"[Error] Times of India scraping failed: {e}")
        return []

async def scrape_ani_news():
    try:
        print("[+] Scraping ANI News...")
        # Use ANI's news feed URLs
        feed_urls = [
            "https://www.aninews.in/feed/",
            "https://www.aninews.in/feed/category/national/",
            "https://www.aninews.in/feed/category/world/",
            "https://www.aninews.in/feed/category/business/",
            "https://www.aninews.in/feed/category/sports/",
            "https://www.aninews.in/feed/category/entertainment/"
        ]
        
        all_articles = []
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml;q=0.9',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        async with httpx.AsyncClient(
            timeout=30.0,
            headers=headers,
            follow_redirects=True,
            http2=True
        ) as client:
            for feed_url in feed_urls:
                try:
                    # Add random delay between requests
                    await asyncio.sleep(random.uniform(2, 5))
                    
                    response = await client.get(feed_url)
                    if response.status_code == 200:
                        try:
                            # Parse feed
                            feed = feedparser.parse(response.text)
                            
                            for entry in feed.entries:
                                try:
                                    # Get the published date
                                    if hasattr(entry, 'published_parsed'):
                                        published_at = datetime(*entry.published_parsed[:6])
                                    elif hasattr(entry, 'updated_parsed'):
                                        published_at = datetime(*entry.updated_parsed[:6])
                                    else:
                                        published_at = datetime.utcnow()
                                    
                                    # Only include articles from today
                                    if published_at.date() >= datetime.utcnow().date():
                                        article = {
                                            'title': entry.title,
                                            'link': entry.link,
                                            'source': 'ANI',
                                            'scraped_at': datetime.utcnow(),
                                            'published_at': published_at,
                                            'summary': entry.summary if hasattr(entry, 'summary') else None,
                                            'category': entry.get('category', None)
                                        }
                                        all_articles.append(article)
                                except Exception as e:
                                    print(f"Error processing feed entry: {e}")
                                    continue
                        except Exception as e:
                            print(f"Error parsing feed: {e}")
                    else:
                        print(f"Failed to fetch feed {feed_url}: Status code {response.status_code}")
                except Exception as e:
                    print(f"Error accessing feed {feed_url}: {e}")
                    continue
        
        print(f"[ANI] Found {len(all_articles)} articles")
        
        if all_articles:
            try:
                # Remove duplicates while preserving the most recent version
                seen = {}
                for article in all_articles:
                    article_key = article['link']
                    if article_key not in seen or article['published_at'] > seen[article_key]['published_at']:
                        seen[article_key] = article
                
                unique_articles = list(seen.values())
                
                if unique_articles:
                    # Sort by published date to prioritize newest articles
                    unique_articles.sort(key=lambda x: x['published_at'], reverse=True)
                    
                    # Use update_many with upsert for efficient batch update
                    operations = []
                    for article in unique_articles:
                        operations.append(
                            UpdateOne(
                                {'link': article['link']},
                                {'$set': article},
                                upsert=True
                            )
                        )
                    
                    if operations:
                        try:
                            result = await collection.bulk_write(operations, ordered=False)
                            print(f"[ANI] Updated/inserted {result.upserted_count + result.modified_count} articles")
                        except Exception as e:
                            print(f"Bulk write failed, falling back to individual updates: {e}")
                            # Fall back to individual updates
                            updated_count = 0
                            for article in unique_articles:
                                try:
                                    await collection.update_one(
                                        {'link': article['link']},
                                        {'$set': article},
                                        upsert=True
                                    )
                                    updated_count += 1
                                except Exception as e:
                                    print(f"Error upserting article: {e}")
                            print(f"[ANI] Individually upserted {updated_count} articles")
            except Exception as e:
                print(f"[ANI] Error saving articles: {e}")
        
        return all_articles
    except Exception as e:
        print(f"[Error] ANI scraping failed: {e}")
        return []

# Fallback scraper for NDTV in case other sources fail
async def scrape_ndtv():
    try:
        print("[+] Scraping NDTV...")
        url = "https://www.ndtv.com/india"
        articles = await scrape_news("NDTV", url)
        
        print(f"[NDTV] Found {len(articles)} articles")
        
        if articles:
            try:
                result = await collection.insert_many(articles, ordered=False)
                print(f"[NDTV] Inserted {len(result.inserted_ids)} articles.")
            except DuplicateKeyError:
                print("[NDTV] Duplicate entries skipped.")
        return articles
    except Exception as e:
        print(f"[Error] NDTV scraping failed: {e}")
        return []

# Master scraping function
async def scrape_all_sources():
    """Scrape all news sources and handle errors for each source independently."""
    try:
        tasks = [
            scrape_the_hindu(),
            scrape_times_of_india(),
            scrape_ani_news(),
            scrape_ndtv()
        ]
        
        # Run all scraping tasks concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results and log any errors
        successful_articles = []
        for source_result in results:
            if isinstance(source_result, Exception):
                logging.error(f"Error during scraping: {str(source_result)}")
            elif isinstance(source_result, list):
                successful_articles.extend(source_result)
        
        # Clean up old articles (keep last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        await collection.delete_many({"scraped_at": {"$lt": week_ago}})
        
        return successful_articles
    except Exception as e:
        logging.error(f"Error in scrape_all_sources: {str(e)}")
        return []

# API Endpoints
@app.get("/", tags=["Root"])
async def read_root():
    """Root endpoint with service status."""
    article_count = await collection.count_documents({})
    
    return {
        "status": "running",
        "service": "News API",
        "database": DB_NAME,
        "collection": COLLECTION_NAME,
        "articles_count": article_count,
        "endpoints": [
            "/news/latest",
            "/news/by_source",
            "/news/search",
            "/scrape"
        ]
    }

@app.get("/news/latest")
async def get_latest_news(limit: int = Query(10, description="Number of articles to return")):
    """Get the latest news articles from all sources."""
    try:
        # Get today's date range (midnight to midnight)
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        
        # Query for articles from today
        query = {
            "scraped_at": {
                "$gte": today,
                "$lt": tomorrow
            }
        }
        
        cursor = collection.find(query).sort("scraped_at", -1).limit(limit)
        articles = await cursor.to_list(length=limit)
        
        # If no articles found for today, get the most recent articles
        if not articles:
            cursor = collection.find().sort("scraped_at", -1).limit(limit)
            articles = await cursor.to_list(length=limit)
        
        # Convert MongoDB documents to JSON-serializable format
        json_articles = mongo_to_json(articles)
        
        return JSONResponse(content=json_articles)
    except Exception as e:
        print(f"Error in get_latest_news: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to retrieve articles: {str(e)}"}
        )

@app.get("/news/by_source")
async def get_news_by_source(
    source: str = Query(..., description="News source name: 'The Hindu', 'Times of India', or 'ANI'"),
    limit: int = Query(10, description="Number of articles to return")
):
    """Get the latest news from a specific source."""
    try:
        cursor = collection.find({"source": source}).sort("scraped_at", -1).limit(limit)
        articles = await cursor.to_list(length=limit)
        
        # Convert MongoDB documents to JSON-serializable format
        json_articles = mongo_to_json(articles)
        
        return JSONResponse(content=json_articles)
    except Exception as e:
        print(f"Error in get_news_by_source: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to retrieve articles: {str(e)}"}
        )

@app.get("/news/search")
async def search_news(
    keyword: Optional[str] = Query(None, description="Keyword to search in titles"),
    from_date: Optional[str] = Query(None, description="Start date in ISO format (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="End date in ISO format (YYYY-MM-DD)"),
    limit: int = Query(10, description="Number of articles to return")
):
    """Search news articles by keyword and date range."""
    try:
        query = {}

        if keyword:
            query["title"] = {"$regex": keyword, "$options": "i"}
        
        if from_date or to_date:
            date_query = {}
            if from_date:
                date_query["$gte"] = datetime.fromisoformat(from_date)
            if to_date:
                date_query["$lte"] = datetime.fromisoformat(to_date)
            query["scraped_at"] = date_query

        cursor = collection.find(query).sort("scraped_at", -1).limit(limit)
        articles = await cursor.to_list(length=limit)
        
        # Convert MongoDB documents to JSON-serializable format
        json_articles = mongo_to_json(articles)
        
        return JSONResponse(content=json_articles)
    except Exception as e:
        print(f"Error in search_news: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to search articles: {str(e)}"}
        )

@app.post("/scrape")
async def trigger_scrape(background_tasks: BackgroundTasks):
    """Trigger a manual scrape of all news sources."""
    background_tasks.add_task(scrape_all_sources)
    return {"message": "Scraping started in background"}

@app.post("/scrape/{source}")
async def scrape_specific_source(source: str):
    """Trigger a scrape of a specific news source."""
    try:
        result = []
        message = f"Scraping {source} started"
        
        if source == "the-hindu":
            result = await scrape_the_hindu()
        elif source == "times-of-india":
            result = await scrape_times_of_india()
        elif source == "ani":
            result = await scrape_ani_news()
        elif source == "ndtv":
            result = await scrape_ndtv()
        elif source == "all":
            result = await scrape_all_sources()
        else:
            return {
                "status": "error", 
                "message": f"Invalid source: {source}. Valid options are: the-hindu, times-of-india, ani, ndtv, all"
            }
            
        return {
            "status": "success",
            "source": source,
            "articles_found": len(result),
            "articles": mongo_to_json(result)[:5]  # Return first 5 articles as preview
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error scraping {source}: {str(e)}"
        }

# Run the server directly if this file is executed
if __name__ == "__main__":
    print("Starting News API service...")
    uvicorn.run("fastapi-news-service:app", host="0.0.0.0", port=8000, reload=True) 